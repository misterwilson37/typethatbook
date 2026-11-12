// lesson-undo-test.mjs v1.0.0 — Round 168. DELETING A RUN TAKES BACK WHAT IT EARNED.
//
// Jake: *"Deleting single runs of a lesson also should be reflected on the kid's experience."*
// undoRunAttempt() must be recordRunOutcome() + saveProgress()'s pass run backwards for ONE
// attempt — so the test RECORDS attempts with the same arithmetic learn.js uses (lesson-gate.js
// pointsForGrade, MASTERY_POINTS) and then undoes one.
import { readFileSync } from 'node:fs';
const { undoRunAttempt } = await import('../lesson-undo.js');
const { pointsForGrade, MASTERY_POINTS } = await import('../lesson-gate.js');
const { FIRE_GRADE, betterGrade } = await import('../run-grade.js');

let pass = 0, fail = 0; const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

// learn.js recordRunOutcome(), reduced to the fields it changes.
function record(prev, runIdx, grade, advanced, isFinal) {
    const k = String(runIdx), r = JSON.parse(JSON.stringify(prev || {}));
    r.runAttempts = { ...(r.runAttempts || {}) }; r.runAttempts[k] = (r.runAttempts[k] || 0) + 1;
    r.runFailures = { ...(r.runFailures || {}) }; if (!advanced) r.runFailures[k] = (r.runFailures[k] || 0) + 1;
    r.runScores = { ...(r.runScores || {}) }; const before = r.runScores[k] || 0; r.runScores[k] = before + pointsForGrade(grade);
    r.runGrades = { ...(r.runGrades || {}) }; r.runGrades[k] = betterGrade(grade, r.runGrades[k] || 'F') || grade;
    r.runFires = { ...(r.runFires || {}) }; if (grade === FIRE_GRADE) r.runFires[k] = (r.runFires[k] || 0) + 1;
    r.runLocks = { ...(r.runLocks || {}) }; if (before < MASTERY_POINTS && r.runScores[k] >= MASTERY_POINTS) r.runLocks[k] = 7;
    r.furthestRunIdx = Math.max(r.furthestRunIdx || 0, runIdx);
    r.timeSpentSeconds = (r.timeSpentSeconds || 0) + 60;
    if (isFinal && advanced) { r.passed = true; r.grade = betterGrade(grade, r.grade || 'F') || grade;
        if (grade === FIRE_GRADE) r.fireCount = (r.fireCount || 0) + 1; }
    return r;
}

console.log('\nA — ONE ATTEMPT, TAKEN BACK');
{
    let r = record({}, 0, 'B', true, false);
    r = record(r, 1, 'A', true, false);
    const u = undoRunAttempt(r, { runIdx: 1, grade: 'A', advanced: true, isFinalRun: false, seconds: 60, otherGrades: [] });
    ok(!u.record.runAttempts['1'] && u.record.runAttempts['0'] === 1, 'A1 the attempt count for that run comes off; run 1 is untouched');
    ok(!u.record.runScores['1'], 'A2 its mastery points come off');
    ok(!u.record.runGrades['1'] && u.record.runGrades['0'] === 'B', 'A3 its grade is gone (no other attempt of that run)');
    ok(u.record.furthestRunIdx === 0, '⭐ A4 furthest run falls back, so the student resumes AT the deleted run');
    ok(u.record.timeSpentSeconds === 60, 'A5 its time comes off the lesson total');
}

console.log('\nB — ⭐ A CHEATED PASS IS UNDONE');
{
    let r = record({}, 0, 'B', true, false);
    r = record(r, 1, 'A', true, true);   // final run, passes the lesson
    ok(r.passed, 'B0 (setup) the lesson was passed by run 2');
    const u = undoRunAttempt(r, { runIdx: 1, grade: 'A', advanced: true, isFinalRun: true, seconds: 60, otherGrades: [] });
    ok(u.record.passed === false, '⭐⭐ B1 deleting the run that passed the lesson un-passes it');
    ok(!u.record.grade && u.record.stars === 0, 'B2 its lesson grade and stars go with it');
    ok(u.notes.some(n => /no longer passed/.test(n)), 'B3 the teacher is told');
    let r2 = record(record(record({}, 0, 'B', true, false), 1, 'B', true, true), 1, 'A', true, true);
    const u2 = undoRunAttempt(r2, { runIdx: 1, grade: 'A', advanced: true, isFinalRun: true, seconds: 60, otherGrades: ['B'] });
    ok(u2.record.passed === true && u2.record.runGrades['1'] === 'B', '⚠️ B4 another passing attempt of the final run keeps the pass (and its grade becomes the best left)');
}

console.log('\nC — MASTERY AND FIREBALLS');
{
    let r = {};
    for (let i = 0; i < 2; i++) r = record(r, 0, FIRE_GRADE, true, false);   // 2 + 2 = 4 points → mastered
    ok(r.runLocks['0'] === 7, 'C0 (setup) two fireballs master the run');
    const u = undoRunAttempt(r, { runIdx: 0, grade: FIRE_GRADE, advanced: true, isFinalRun: false, seconds: 60, otherGrades: [FIRE_GRADE] });
    ok(u.record.runScores['0'] === 2 && !('0' in (u.record.runLocks || {})), '⭐ C1 one fireball off: 4 → 2 points, no longer mastered');
    ok(u.record.runFires['0'] === 1 && u.record.runGrades['0'] === FIRE_GRADE, 'C2 one fireball left, still its best grade');
    const f = undoRunAttempt(record({}, 0, 'D', false, false), { runIdx: 0, grade: 'D', advanced: false, isFinalRun: false, seconds: 60, otherGrades: [] });
    ok(!f.record.runFailures['0'] && !f.record.runAttempts['0'], 'C3 a failed attempt takes its failure with it');
}

console.log('\nD — WIRING');
{
    const t = readFileSync(new URL('../teach.js', import.meta.url), 'utf8');
    ok(/undoRunAttempt\(rec, \{ runIdx: r\.runIdx, grade: r\.grade, advanced: r\.advances,/.test(t), 'D1 Teach\'s Delete undoes the lesson credit');
    const sa = readFileSync(new URL('../staff-actions.js', import.meta.url), 'utf8');
    ok(/stamp\.progressChangedAt = serverTimestamp\(\)/.test(sa), '⚠️ D2 and tells the student\'s open page (or its next flush puts the credit back)');
    const dw = readFileSync(new URL('../day-wipe.js', import.meta.url), 'utf8');
    ok(/export function purgeProgress\(uid\)/.test(dw) && /delete w\.progress/.test(dw), 'D3 the page drops its cached + pending lesson records, keeping unsaved minutes');
}

console.log(fail ? `\nlesson-undo-test: ${pass} passed, ${fail} FAILED` : `\nlesson-undo-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   ✗ ' + f)); process.exit(1); }
