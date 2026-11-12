// lesson-undo.js v1.0.0 — Round 168. DELETING A RUN TAKES BACK WHAT THE RUN EARNED.
//
// Jake, 2026-11-12: *"Deleting single runs of a lesson also should be reflected on the kid's
// experience."* Until now a deleted run lost its TIME and kept everything else — its attempt,
// its grade, its mastery points, and the lesson pass it may have earned (Reports' own dialog
// said so: "This does NOT clear mastery").
//
// undoRunAttempt() is recordRunOutcome() (learn.js) and saveProgress()'s pass, run backwards,
// field by field, for ONE attempt:
//   runAttempts[i] − 1, runFailures[i] − 1 if it failed, runScores[i] − its points,
//   runFires[i] − 1 if it was A🔥, runLocks[i] dropped if the run falls below mastery,
//   runGrades[i] → the best grade among the run's OTHER known attempts (or removed),
//   furthestRunIdx → the furthest run that still has an attempt,
//   timeSpentSeconds − its seconds,
//   and if it was the FINAL run and it advanced, and no other passing attempt of the final
//   run remains: passed → false (and the lesson's grade, stars and fireCount follow).
//
// ⚠️ "OTHER KNOWN ATTEMPTS" ARE THE ONES STILL IN typing_sessions (120-day TTL). An older
// attempt's grade is not known, so a run whose best grade came from beyond that window can
// read lower afterwards. Counts and points are exact; only the "best grade" is best-known.
// ⚠️ Pure — no DOM, no Firestore. tests/lesson-undo-test.mjs.

import { pointsForGrade, MASTERY_POINTS, MASTERY_FIRE_COUNT } from './lesson-gate.js';
import { FIRE_GRADE, betterGrade } from './run-grade.js';

export const LESSON_UNDO_VERSION = '1.0.0';

const STARS = (g) => (g === FIRE_GRADE || g === 'A') ? 3 : g === 'B' ? 2 : g === 'C' ? 1 : 0;

function dec(map, key, by = 1) {
    const out = Object.assign({}, map || {});
    if (typeof out[key] !== 'number') return out;
    const v = Math.max(0, out[key] - by);
    if (v === 0) delete out[key]; else out[key] = v;
    return out;
}

/**
 * @param rec      the lessonProgress record as stored
 * @param a        { runIdx, grade, advanced, isFinalRun, seconds, otherGrades }
 *                 otherGrades: grades of this run's OTHER known attempts (any day)
 * @returns { record, notes } — the whole record to write back (a full replace), and
 *          plain-English notes on what changed, for the teacher.
 */
export function undoRunAttempt(rec, a) {
    const r = Object.assign({}, rec || {});
    const k = String(a.runIdx);
    const notes = [];

    r.runAttempts = dec(r.runAttempts, k);
    if (!a.advanced) r.runFailures = dec(r.runFailures, k);

    const pts = pointsForGrade(a.grade);
    const scoreBefore = (r.runScores || {})[k];
    if (pts && typeof scoreBefore === 'number') {
        r.runScores = dec(r.runScores, k, pts);
        notes.push(`run ${a.runIdx + 1} mastery points ${scoreBefore} → ${(r.runScores[k] || 0)}`);
        if (scoreBefore >= MASTERY_POINTS && (r.runScores[k] || 0) < MASTERY_POINTS && r.runLocks && k in r.runLocks) {
            r.runLocks = Object.assign({}, r.runLocks); delete r.runLocks[k];
            notes.push(`run ${a.runIdx + 1} is no longer mastered`);
        }
    }
    if (a.grade === FIRE_GRADE) r.runFires = dec(r.runFires, k);

    // Best grade among what is left that we know of.
    const others = (a.otherGrades || []).filter(Boolean);
    const best = others.reduce((b, g) => betterGrade(g, b) || g, null);
    const grades = Object.assign({}, r.runGrades || {});
    if (best) grades[k] = best; else delete grades[k];
    if (grades[k] !== (r.runGrades || {})[k]) notes.push(`run ${a.runIdx + 1} best grade ${(r.runGrades || {})[k] || '—'} → ${grades[k] || '—'}`);
    r.runGrades = grades;
    if (r.runGradesFrom && !(k in grades)) { r.runGradesFrom = Object.assign({}, r.runGradesFrom); delete r.runGradesFrom[k]; }

    // Furthest run reached = the furthest that still has an attempt.
    const left = Object.entries(r.runAttempts || {}).filter(([, n]) => n > 0).map(([i]) => Number(i));
    const furthest = left.length ? Math.max(...left) : 0;
    if ((r.furthestRunIdx || 0) !== furthest) {
        notes.push(`furthest run ${(r.furthestRunIdx || 0) + 1} → ${furthest + 1}`);
        r.furthestRunIdx = furthest;
    }
    if (typeof r.timeSpentSeconds === 'number') r.timeSpentSeconds = Math.max(0, r.timeSpentSeconds - (a.seconds || 0));

    // The lesson pass — only the final run earns it, in saveProgress().
    if (a.isFinalRun && a.advanced) {
        const passesLeft = ((r.runAttempts || {})[k] || 0) - ((r.runFailures || {})[k] || 0);
        if (a.grade === FIRE_GRADE && typeof r.fireCount === 'number') {
            r.fireCount = Math.max(0, r.fireCount - 1);
            if (r.fireCount < MASTERY_FIRE_COUNT) delete r.fireAtDay;
        }
        if (passesLeft <= 0 && r.passed) {
            r.passed = false;
            notes.push('the lesson is no longer passed');
        }
        if (!r.passed) {
            const g = grades[k] || null;
            if (g) r.grade = g; else delete r.grade;
            r.stars = STARS(g);
        }
    }
    return { record: r, notes };
}
