// run-grade.js v1.0.0 — THE GRADE RULE, IN ONE PLACE, WITH NOTHING ELSE IN IT.
//
// ROADMAP item 15. Extracted from learn.js so that reports.html can grade a run
// without owning a second copy of the rule. ⚠️ THAT IS THE WHOLE REASON THIS
// FILE EXISTS, and it is Rule 9: learn.js's copies are DELETED in the same
// deploy, not left beside these.
//
// ⚠️ PURE. No Firestore, no DOM, no clock, no randomness. Same inputs, same
// answer, in a browser or in a harness — which is why run-grade-test.mjs can
// cover the whole design without driving a page. lesson-gate.js is the model.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ WHY A RECONSTRUCTION NEEDS MORE THAN calculateGrade()
// ═══════════════════════════════════════════════════════════════════════════
//
// A stored sprint carries wpm, accuracy, chars, mistakes, seconds, the lesson
// id and "run N". It does NOT carry the gates it was graded against, and the
// gates are what decide whether speed counted at all. So the chain is
//
//     lesson  ×  run index  →  run type  →  gates  →  grade
//
// and the middle arrow is the hard one: run index is an index into the CHUNKED
// run list, not into the authored steps. A 2-step lesson can be 12 runs. That
// mapping is what runPlan() below reproduces, and it is why this module owns
// chunkSequence() rather than importing a number from somewhere.
//
// ⚠️ runPlan() COMPUTES SHAPE, NEVER CONTENT. Two of the six step types generate
// their characters at RANDOM every call. Their LENGTH and their space layout are
// fixed by (groupSize, groupCount) and nothing else, so the chunk boundaries —
// and therefore the run count and every run's type — are perfectly determined
// without generating a single letter. shapeSequence() fills random groups with a
// placeholder. ⚠️ IT MUST NEVER BE USED TO DRIVE A DRILL; it is the wrong text.
// run-grade-test.mjs Part D drives learn.js's REAL generators and asserts the
// two agree on run count for every step type, which is the ratchet that stops
// this becoming a twin.

export const RUN_GRADE_VERSION = "1.0.0";

// A🔥 as a string, built from a code point so no source file has to carry a
// surrogate pair literally — HANDOFF §0.-24 is about a heredoc that died on one.
export const FIRE_GRADE = 'A' + String.fromCodePoint(0x1F525);

// Best-to-worst is the reverse of this; index order is what saveProgress()
// compares on, so it stays in this direction.
export const GRADE_ORDER = ['F', 'D', 'C', 'B', 'A', FIRE_GRADE];

// Which step types are pure key drills. Graded on accuracy only — speed on
// random letter groups is not a meaningful measure of anything, and gating it
// made the new-key drill the hardest thing in its own lesson.
export const DRILL_TYPES = new Set(['key_pattern', 'key_pattern_auto', 'key_random']);

export const CHUNK_TARGET = 150;   // ≈30–60s at these gates; matches game.js sprint length
export const CHUNK_SLACK  = 1.30;  // a 180-char step stays whole rather than becoming 150+30

// Home-key companions: for any reach key, the same finger's home-row key.
// ⚠️ NEEDED HERE ONLY TO COUNT GROUPS. generateReachPattern() emits one group
// per reach key twice over before it mixes, so the group count depends on how
// many keys in the set are reaches. Content is learn.js's business.
export const REACH_HOME_COMPANION = {
    'q':'a','z':'a',
    'w':'s','x':'s',
    'e':'d','c':'d',
    'r':'f','t':'f','g':'f','v':'f','b':'f',
    'y':'j','u':'j','h':'j','n':'j','m':'j',
    'i':'k',',':'k',
    'o':'l','.':'l',
    'p':';','[':';',']':';','\\':';','\'':';','/':';',
    '1':'a','2':'s','3':'d','4':'f','5':'f',
    '6':'j','7':'j','8':'k','9':'l','0':';'
};

// ═════════════════════════════════════════════════════════════════════════════
// THE GRADE
// ═════════════════════════════════════════════════════════════════════════════
//
// v2.0.0 grade model, moved here verbatim from learn.js. Accuracy is the gate;
// speed sets the badge.
//
//   1. C ADVANCES. Under the old model both gates had to be met, so 14 WPM at
//      100% accuracy failed while 15 WPM at 85% passed — the more careful typist
//      was the one held back.
//   2. D/F depend on accuracy alone. Being slow is never failing.
//   3. A🔥 is reachable: a clean run on a drill, 1.5× rather than 2× on prose.
//
// `minWPM: null` (every key-drill run) means speed is measured and displayed but
// not graded. `clean` is a true zero-mistake flag, not rounded accuracy — 99.6%
// rounds to 100 and should not earn a badge that says perfect.
export function calculateGrade(wpm, acc, minWPM, minAcc, clean) {
    if (acc < minAcc) return acc < minAcc * 0.80 ? 'F' : 'D';

    // Accuracy-only run: the badge is about how clean it was.
    if (minWPM == null) {
        if (clean)     return FIRE_GRADE;
        if (acc >= 95) return 'A';
        return 'B';
    }

    if (wpm >= minWPM) {
        if (wpm >= minWPM * 1.5  && acc >= 95) return FIRE_GRADE;
        if (wpm >= minWPM * 1.15 && acc >= 90) return 'A';
        return 'B';
    }
    return 'C';   // accuracy met, speed short — advances
}

// Advancement, in one place so the modals can't disagree about it.
export function gradeAdvances(grade, gates) {
    if (grade === 'D' || grade === 'F') return false;
    if (grade === 'C' && gates && gates.strictSpeed) return false;
    return true;
}

// The better of two grades, by GRADE_ORDER. An unknown string loses to anything
// known, which is the safe direction: a reconstruction must never be able to
// PROMOTE a record by writing a grade nobody recognises.
export function betterGrade(a, b) {
    const ia = GRADE_ORDER.indexOf(a), ib = GRADE_ORDER.indexOf(b);
    if (ia < 0) return ib < 0 ? null : b;
    if (ib < 0) return a;
    return ia >= ib ? a : b;
}

// Effective gates for a run. Precedence: explicit step.gates > type default >
// lesson gates. `minWPM: null` means speed is recorded but not gated.
//
// ⚠️ lessonGates IS A PARAMETER NOW. learn.js's copy read `currentLesson` out of
// module scope, which is exactly the thing that made it unreusable and untestable
// from anywhere else.
export function gatesForRun(run, lessonGates) {
    const lg  = lessonGates || {};
    const acc = lg.minAccuracy == null ? 85 : lg.minAccuracy;
    const wpm = lg.minWPM     == null ? 15 : lg.minWPM;

    // strictSpeed makes a short-on-speed result (grade C) block advancement again.
    // Nothing sets it today. Add `"gates": { ..., "strictSpeed": true }` to the
    // Unit 7 graduation lessons via Import JSON if you ever want 25 WPM enforced
    // rather than advisory — the engine already honours it.
    const strict = !!lg.strictSpeed;

    if (run && run.gates) {
        return { minAccuracy: run.gates.minAccuracy == null ? acc : run.gates.minAccuracy,
                 minWPM:     run.gates.minWPM     === undefined ? wpm : run.gates.minWPM,
                 strictSpeed: run.gates.strictSpeed == null ? strict : !!run.gates.strictSpeed };
    }
    if (run && DRILL_TYPES.has(run.type)) {
        return { minAccuracy: acc, minWPM: null, strictSpeed: false };
    }
    return { minAccuracy: acc, minWPM: wpm, strictSpeed: strict };
}

// ═════════════════════════════════════════════════════════════════════════════
// THE RUN PLAN — lesson × run index → type and gates
// ═════════════════════════════════════════════════════════════════════════════

// Split a character array into runs of roughly CHUNK_TARGET, breaking only at
// spaces so no word or drill group is ever cut in half. Moved from learn.js
// unchanged; learn.js imports it from here.
export function chunkSequence(seq) {
    if (seq.length <= CHUNK_TARGET * CHUNK_SLACK) return [seq];

    // Aim for equal-sized chunks rather than filling to the brim and leaving a
    // stub: 320 chars becomes 160+160, not 150+150+20.
    const n      = Math.ceil(seq.length / CHUNK_TARGET);
    const target = Math.ceil(seq.length / n);
    const chunks = [];
    let start = 0;

    const STUB = Math.floor(target * 0.5);   // don't leave a fragment behind

    while (start < seq.length) {
        while (start < seq.length && seq[start] === ' ') start++;   // trim leading space
        if (start >= seq.length) break;

        let end = start + target;
        if (end >= seq.length) { chunks.push(seq.slice(start)); break; }

        // Walk back to the nearest space so the break lands between words/groups.
        let cut = end;
        while (cut > start && seq[cut] !== ' ') cut--;
        // No space in range (one very long token) — fall forward instead of
        // producing a zero-length chunk, which would loop forever.
        if (cut === start) {
            cut = end;
            while (cut < seq.length && seq[cut] !== ' ') cut++;
        }
        // If what's left would be a stub, swallow it now. Otherwise the last run of
        // a chunked step ends up being five characters with its own results modal,
        // which reads as a bug even though the arithmetic is fine.
        if (seq.length - cut <= STUB) { chunks.push(seq.slice(start)); break; }

        chunks.push(seq.slice(start, cut));
        start = cut;
    }
    return chunks.filter(c => c.length > 0);
}

// How many groups generateReachPattern() emits for a key set. Phases 1 and 2
// give one group per reach key each; phase 3 tops up to groupCount and does not
// remove any, so a key set with more than groupCount/2 reach keys produces MORE
// groups than asked for. ⚠️ A KEY SET WITH NO REACH KEYS falls through to
// generateRandom() inside learn.js, which is groupCount exactly.
function reachGroupCount(keySet, groupCount) {
    const reachKeys = (keySet || []).filter(k => REACH_HOME_COMPANION[String(k).toLowerCase()]);
    if (!reachKeys.length) return groupCount;
    return Math.max(groupCount, 2 * reachKeys.length);
}

// A character array with the SAME LENGTH and the SAME SPACE POSITIONS as the one
// learn.js's buildSequence() would produce, and deliberately not the same
// letters. Only chunkSequence() ever sees it.
function shapeSequence(step) {
    const groups = (n, size) => {
        if (n <= 0 || size <= 0) return [];
        const out = [];
        for (let g = 0; g < n; g++) {
            if (g > 0) out.push(' ');
            for (let i = 0; i < size; i++) out.push('x');
        }
        return out;
    };
    switch (step.type) {
        case 'key_pattern':
            return (step.text || '').split('');
        case 'key_pattern_auto': {
            const keySet = step.keySet || [];
            if (!keySet.length) return [];
            const size = step.groupSize || 4;
            return groups(reachGroupCount(keySet, step.groupCount || 10), size);
        }
        case 'key_random': {
            const keySet = step.keySet || [];
            if (!keySet.length) return [];
            return groups(step.groupCount || 12, step.groupSize || 4);
        }
        case 'word_list':
            return (step.words || []).join(' ').split('');
        case 'sentence_list':
            return (step.sentences || []).join(' ').split('');
        case 'passage':
            return (step.text || '').split('');
        default:
            return [];
    }
}

// The gates-only projection of learn.js's buildRunList(): one entry per run, in
// run order, carrying everything gatesForRun() needs and nothing a drill needs.
// ⚠️ THE LENGTH OF THIS ARRAY IS THE LESSON'S runCount, and that is the number
// item 15's staleness check compares against.
export function runPlan(lesson) {
    const plan = [];
    ((lesson && lesson.steps) || []).forEach((step, stepIdx) => {
        const chunks = chunkSequence(shapeSequence(step));
        chunks.forEach((_seq, chunkIdx) => {
            plan.push({
                stepId: step.id,
                stepIdx,
                chunkIdx,
                chunkCount: chunks.length,
                type: step.type,
                gates: step.gates || null,
            });
        });
    });
    return plan;
}

// Gates for run `runIdx` of `lesson`, or null if the lesson has no such run.
// ⚠️ null IS AN ANSWER AND MUST BE HANDLED. It means the stored run index does
// not exist in the lesson as it is authored TODAY, which is the re-chunking
// hazard: the caller must refuse the run, not guess at it.
export function gatesForRunIndex(lesson, runIdx) {
    const plan = runPlan(lesson);
    if (!(runIdx >= 0) || runIdx >= plan.length) return null;
    return gatesForRun(plan[runIdx], (lesson && lesson.gates) || {});
}

// ═════════════════════════════════════════════════════════════════════════════
// THE SPRINT SIDE — turning stored records back into runs
// ═════════════════════════════════════════════════════════════════════════════

// "run 3 (interrupted)" → 3. "run 3" → 3. Anything else → null.
// ⚠️ THE PARENTHETICAL SUFFIX IS PART OF THE RECORD AND MUST NOT BE PART OF THE
// KEY. logRun() appends "(interrupted)", "(left page)" or "(hidden)" to the
// detail of a fragment, so keying on the raw string would file the fragments of
// one run as three different runs — which is exactly the invented-grade failure
// item 15's constraint 1 is about.
export function runIndexFromDetail(detail) {
    const m = /^\s*run\s+(\d+)/i.exec(String(detail || ''));
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return n >= 1 ? n - 1 : null;      // stored 1-based, indexed 0-based
}

// ⚠️ A REMEDIATION DRILL IS NOT A RUN OF THE LESSON. learn.js v2.36.0 stamps
// `practice: 'remediation'` on the sprint it writes for the "🎲 Practice missed
// keys" drill, which carries the lesson's id and a run number because it borrows
// the lesson's engine. Records written BEFORE v2.36.0 have no such stamp and are
// indistinguishable from real runs — see ROADMAP 15 for what that costs.
export function isAssessedSprint(s) {
    return !!s && !s.practice;
}

// Group a flat list of sprints into runs and sum each run's fragments.
//
// ⚠️⚠️ THIS IS ITEM 15'S CONSTRAINT 1 AND IT IS NOT OPTIONAL. An interrupted run
// writes several sprints, and logRun() RECOMPUTES wpm/accuracy for each fragment
// against that fragment alone. Grading the fragments individually invents grades:
// the "(left page)" and "(hidden)" rows sitting at 0 WPM in Jake's own screenshot
// are what that looks like. The union is the run; a fragment is not.
//
// wpm and accuracy are recomputed from the summed chars/mistakes/seconds using
// logRun()'s own arithmetic, so a merged run is graded on the same formula a
// single-fragment run is.
export function mergeContinuations(sprints) {
    const byRun = new Map();
    for (const s of (sprints || [])) {
        if (!isAssessedSprint(s)) continue;
        const runIdx = runIndexFromDetail(s.detail);
        if (runIdx === null) continue;
        const key = `${s.date}\u0000${s.label}\u0000${runIdx}`;
        if (!byRun.has(key)) {
            byRun.set(key, {
                date: s.date, label: s.label, runIdx,
                seconds: 0, chars: 0, mistakes: 0, fragments: 0,
                at: s.at || '',
            });
        }
        const g = byRun.get(key);
        g.seconds  += Number(s.seconds)  || 0;
        g.chars    += Number(s.chars)    || 0;
        g.mistakes += Number(s.mistakes) || 0;
        g.fragments += 1;
        if (s.at && (!g.at || s.at < g.at)) g.at = s.at;
    }

    for (const g of byRun.values()) {
        const correct = Math.max(0, g.chars - g.mistakes);
        g.wpm      = g.seconds > 0 ? Math.round((correct / 5) / (g.seconds / 60)) : 0;
        g.accuracy = g.chars   > 0 ? Math.round((correct / g.chars) * 100) : 100;
        g.clean    = g.mistakes === 0;
    }
    return Array.from(byRun.values())
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.runIdx - b.runIdx));
}

// Grade one merged run against a lesson. Returns a reason instead of a grade
// whenever the answer would be a guess.
//
// ⚠️ THE runCount CHECK IS ITEM 15'S CONSTRAINT 2 AND IT REFUSES RATHER THAN
// GUESSES. Editing a lesson re-chunks it and shifts every run index, so today's
// definition read against a two-week-old sprint can grade the wrong material.
// `storedRunCount` is the count the student's own record was written with; when
// it disagrees with the lesson as authored now, the mapping is unsafe and the
// only honest answer is to say so.
export function gradeMergedRun(run, lesson, storedRunCount) {
    if (!lesson) return { ok: false, reason: 'no-lesson' };

    const plan = runPlan(lesson);
    if (!plan.length) return { ok: false, reason: 'no-runs' };

    if (storedRunCount != null && storedRunCount !== plan.length) {
        return { ok: false, reason: 'runcount-drift',
                 detail: `record was written against ${storedRunCount} runs; the lesson now builds ${plan.length}` };
    }
    if (run.runIdx >= plan.length) {
        return { ok: false, reason: 'run-out-of-range',
                 detail: `run ${run.runIdx + 1} does not exist in a ${plan.length}-run lesson` };
    }

    const gates = gatesForRun(plan[run.runIdx], (lesson.gates) || {});
    const grade = calculateGrade(run.wpm, run.accuracy, gates.minWPM, gates.minAccuracy, run.clean);
    return { ok: true, grade, gates, advances: gradeAdvances(grade, gates) };
}
