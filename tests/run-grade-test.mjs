// run-grade-test.mjs v1.0.0 — ROADMAP 15. THE GRADE RULE, AND THE RECONSTRUCTION.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ PART D IS THE ONE THAT MATTERS. READ IT BEFORE TOUCHING run-grade.js.
// ═══════════════════════════════════════════════════════════════════════════
//
// Grading a stored sprint needs `lesson × run index → run type → gates`, and
// run index indexes the CHUNKED run list, not the authored steps: a 2-step
// lesson can be 12 runs. reports.html therefore has to reproduce learn.js's
// chunking — and a second implementation of chunking is a TWIN, which is the
// structural failure this project has hit seven times (§0.-13.E, §0.-18, §0.-19).
//
// run-grade.js avoids being a twin in the only way that works: learn.js IMPORTS
// chunkSequence() from it, so there is one implementation. But runPlan() still
// needs a sequence to chunk, and two of the six step types generate their
// characters at RANDOM every call. So runPlan() feeds chunkSequence() a SHAPE —
// the right length, the right space positions, placeholder letters.
//
// ⚠️ THAT SHAPE IS THE ONE PLACE A TWIN COULD STILL FORM. Part D drives
// learn.js's REAL generators, extracted from the shipped source, and asserts the
// two agree on run count for every step type at a range of sizes. If it goes
// red, reports.html is grading a run against the wrong step's gates and every
// number it writes is wrong.
//
// ⚠️ MUTATION-VERIFIED: D fails if reachGroupCount() drops its Math.max, if the
// key_random default groupCount moves from 12, or if the space between groups
// is omitted.

import { readFileSync } from 'fs';
import {
    calculateGrade, gradeAdvances, gatesForRun, betterGrade, chunkSequence,
    runPlan, gatesForRunIndex, runIndexFromDetail, isAssessedSprint,
    mergeContinuations, gradeMergedRun, FIRE_GRADE, DRILL_TYPES,
} from '../run-grade.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const src = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');
function extractFn(s, name) {
    const re = new RegExp('(?:async\\s+)?function\\s+' + name + '\\s*\\(');
    const m = re.exec(s);
    if (!m) return null;
    let i = s.indexOf('{', m.index), depth = 0;
    for (let j = i; j < s.length; j++) {
        if (s[j] === '{') depth++;
        else if (s[j] === '}') { depth--; if (depth === 0) return s.slice(m.index, j + 1); }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- A. THE GRADE RULE, MOVED VERBATIM ---');
{
    // 85 * 0.80 = 68, so the F/D boundary sits at 68% — not at "well short".
    ok(calculateGrade(50, 60, 15, 85, false) === 'F',
       'A1 accuracy below 80% of the gate (68% here) is F');
    ok(calculateGrade(50, 70, 15, 85, false) === 'D',
       '⚠️ A1b 70% IS A **D**, NOT AN F, against an 85% gate. The F line is ' +
       '0.80 x minAcc, not a fixed number — it moves with the lesson');
    ok(calculateGrade(50, 80, 15, 85, false) === 'D',
       'A2 accuracy short but within 80% of the gate is D');
    ok(calculateGrade(10, 90, 15, 85, false) === 'C',
       '⚠️ A3 ACCURACY MET, SPEED SHORT IS A **C**, AND C ADVANCES. The careful ' +
       'typist must not be the one held back');
    ok(gradeAdvances('C', { strictSpeed: false }) === true, 'A4 C advances by default');
    ok(gradeAdvances('C', { strictSpeed: true }) === false, 'A5 strictSpeed blocks C');
    ok(gradeAdvances('D', {}) === false && gradeAdvances('F', {}) === false,
       'A6 D and F never advance');

    ok(calculateGrade(9, 100, null, 85, true) === FIRE_GRADE,
       '⚠️ A7 ON AN ACCURACY-ONLY RUN, CLEAN IS A🔥 AT ANY SPEED. This is what ' +
       'made the remediation defect score fireballs');
    ok(calculateGrade(9, 100, null, 85, false) === 'A',
       '⚠️ A8 100% ROUNDED IS NOT CLEAN. 99.6% rounds to 100 and must not earn a ' +
       'badge that says perfect — `clean` is a true zero-mistake flag');
    ok(calculateGrade(23, 96, 15, 85, false) === FIRE_GRADE,
       'A9 prose: 1.5x the gate at 95%+ is A🔥');
    ok(calculateGrade(18, 92, 15, 85, false) === 'A', 'A10 1.15x at 90%+ is A');

    ok(betterGrade('A', 'B') === 'A' && betterGrade('B', FIRE_GRADE) === FIRE_GRADE,
       'A11 betterGrade picks the better of two');
    ok(betterGrade('nonsense', 'B') === 'B',
       '⚠️ A12 AN UNKNOWN GRADE LOSES. A reconstruction must never be able to ' +
       'PROMOTE a record by writing a string nobody recognises');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- B. GATES: TYPE BEATS LESSON, STEP BEATS BOTH ---');
{
    const lg = { minAccuracy: 90, minWPM: 20 };
    ok(gatesForRun({ type: 'passage' }, lg).minWPM === 20,
       'B1 a prose run inherits the lesson gates');
    ok(gatesForRun({ type: 'key_random' }, lg).minWPM === null,
       '⚠️ B2 A DRILL RUN IS SPEED-UNGATED whatever the lesson says. Speed on ' +
       'random letter groups measures nothing');
    ok(gatesForRun({ type: 'key_random' }, lg).minAccuracy === 90,
       'B3 ...but it still inherits the lesson ACCURACY gate');
    ok(gatesForRun({ type: 'passage', gates: { minWPM: 5 } }, lg).minWPM === 5,
       'B4 an explicit step gate wins');
    ok(gatesForRun({ type: 'passage', gates: { minWPM: null } }, lg).minWPM === null,
       '⚠️ B5 AN EXPLICIT null IS A VALUE, NOT AN ABSENCE. `=== undefined` is ' +
       'what distinguishes them; `== null` here would silently re-gate the run');
    ok(gatesForRun(null, {}).minAccuracy === 85 && gatesForRun(null, {}).minWPM === 15,
       'B6 the defaults are 85% and 15 WPM');
    ok([...DRILL_TYPES].length === 3, 'B7 three drill types');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- C. THE RUN PLAN ---');
{
    const short = { steps: [{ id: 's1', type: 'passage', text: 'a'.repeat(40) }] };
    ok(runPlan(short).length === 1, 'C1 a short step is one run');

    const long = { steps: [{ id: 's1', type: 'passage', text: ('word '.repeat(120)).trim() }] };
    ok(runPlan(long).length > 1, 'C2 a long step chunks into several runs');
    ok(runPlan(long).every(r => r.stepIdx === 0 && r.type === 'passage'),
       'C3 every chunk of a step keeps that step\u2019s identity and type');

    const mixed = { gates: { minAccuracy: 85, minWPM: 15 }, steps: [
        { id: 'd', type: 'key_random', keySet: ['f', 'j'], groupSize: 4, groupCount: 12 },
        { id: 'p', type: 'passage', text: 'the quick brown fox jumps over it' },
    ]};
    const plan = runPlan(mixed);
    ok(plan.length === 2, 'C4 a two-step lesson with short steps is two runs');
    ok(gatesForRunIndex(mixed, 0).minWPM === null,
       '⚠️⚠️ C5 RUN 0 IS THE DRILL AND IS SPEED-UNGATED; RUN 1 IS PROSE AND IS ' +
       'NOT. This is the whole reason a reconstruction cannot just use the ' +
       'lesson gates \u2014 the same lesson grades two runs by different rules');
    ok(gatesForRunIndex(mixed, 1).minWPM === 15, 'C6 run 1 is speed-gated');
    ok(gatesForRunIndex(mixed, 9) === null,
       '⚠️ C7 A RUN INDEX PAST THE END RETURNS null, NOT A GUESS. null is an ' +
       'answer the caller must handle: the stored index does not exist in the ' +
       'lesson as authored today');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- D. ⚠️⚠️ THE RATCHET: SHAPE MUST AGREE WITH THE REAL GENERATORS ---');
{
    // Drive learn.js's ACTUAL sequence builders, with its real drill-filter.
    const bodies = ['generateRandom', 'generateReachPattern', 'expandKeySetWithHomeCompanions',
                    'buildSequence'].map(n => extractFn(src, n));
    const missing = bodies.some(b => !b);
    ok(!missing, 'D1 learn.js\u2019s sequence generators are still extractable');

    if (!missing) {
        // REACH_HOME_COMPANION now lives in run-grade.js; learn.js imports it.
        const reachMap = JSON.parse(readFileSync(
            new URL('../run-grade.js', import.meta.url), 'utf8')
            .match(/REACH_HOME_COMPANION = \{([\s\S]*?)\};/)[1]
            .replace(/'/g, '"').replace(/,\s*$/, '')
            .replace(/^/, '{').replace(/$/, '}'));

        const realBuild = new Function(
            'safeGroup', 'REACH_HOME_COMPANION', 'chunkSequence',
            bodies.join('\n') + '\nreturn buildSequence;'
        )((draw) => ({ group: draw(), exhausted: false, matched: null }),
          reachMap, chunkSequence);

        const cases = [
            { id: 'r1', type: 'key_random', keySet: ['f','j'], groupSize: 4, groupCount: 12 },
            { id: 'r2', type: 'key_random', keySet: ['g','h','f','j'], groupSize: 5, groupCount: 30 },
            { id: 'r3', type: 'key_random', keySet: ['a','s','d','f'] },
            { id: 'a1', type: 'key_pattern_auto', keySet: ['g','h'], groupSize: 4, groupCount: 10 },
            { id: 'a2', type: 'key_pattern_auto', keySet: ['q','w','e','r','t','y'], groupSize: 4, groupCount: 10 },
            { id: 'a3', type: 'key_pattern_auto', keySet: ['a','s','d','f'], groupSize: 4, groupCount: 10 },
            { id: 'a4', type: 'key_pattern_auto', keySet: ['r','t','y','u','i','o','p'], groupSize: 6, groupCount: 8 },
            { id: 'k1', type: 'key_pattern', text: 'fff jjj fff jjj' },
            { id: 'w1', type: 'word_list', words: 'the of and to a in is you that it he was for'.split(' ') },
            { id: 's1', type: 'sentence_list', sentences: ['The cat sat.', 'The dog ran.'] },
            { id: 'p1', type: 'passage', text: ('lorem ipsum dolor sit amet '.repeat(30)).trim() },
        ];

        let agree = 0;
        for (const step of cases) {
            const realRuns  = chunkSequence(realBuild(step)).length;
            const planRuns  = runPlan({ steps: [step] }).length;
            if (realRuns === planRuns) agree++;
            else console.log(`         ${step.id} (${step.type}): real ${realRuns} runs, plan ${planRuns}`);
        }
        ok(agree === cases.length,
           '⚠️⚠️ D2 runPlan() AGREES WITH learn.js\u2019S REAL GENERATORS ON RUN ' +
           `COUNT for all ${cases.length} step shapes. If this is red, ` +
           'reports.html is mapping run indices onto the wrong steps and every ' +
           'grade it writes is against the wrong gates');

        // The shape must never be mistaken for drill text.
        const shaped = runPlan({ steps: [cases[0]] });
        ok(shaped.length === 1 && !('sequence' in shaped[0]),
           '⚠️ D3 THE PLAN CARRIES NO SEQUENCE. Placeholder letters must never ' +
           'be reachable by anything that could put them on a screen');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- E. SPRINTS BACK INTO RUNS ---');
{
    ok(runIndexFromDetail('run 3') === 2, 'E1 "run 3" is index 2');
    ok(runIndexFromDetail('run 3 (interrupted)') === 2,
       '⚠️⚠️ E2 THE PARENTHETICAL IS STRIPPED. logRun() appends "(interrupted)", ' +
       '"(left page)" or "(hidden)" to a FRAGMENT of a run \u2014 keying on the raw ' +
       'string would file one run\u2019s fragments as three separate runs and grade ' +
       'each on its own partial numbers, which is how invented grades appear');
    ok(runIndexFromDetail('left page') === null && runIndexFromDetail('') === null,
       'E3 a non-run detail yields null');
    ok(runIndexFromDetail('run 0') === null,
       '⚠️ E4 "run 0" IS NOT A THING. logRun() writes currentStepIdx + 1, so the ' +
       'stored numbers are 1-based; a 0 means the record is malformed');

    ok(isAssessedSprint({ detail: 'run 1' }) === true, 'E5 an unstamped sprint is assessed');
    ok(isAssessedSprint({ detail: 'run 1', practice: 'remediation' }) === false,
       'E6 a remediation sprint is not');

    // ⚠️ CONSTRAINT 1: an interrupted run writes several sprints, and logRun()
    // RECOMPUTES wpm/accuracy for each fragment against that fragment alone.
    const merged = mergeContinuations([
        { date: '2026-08-24', label: 'u1_l1', detail: 'run 2', seconds: 30, chars: 100, mistakes: 2, at: '2026-08-24T14:00:00Z' },
        { date: '2026-08-24', label: 'u1_l1', detail: 'run 2 (hidden)', seconds: 30, chars: 100, mistakes: 0, continuation: true, at: '2026-08-24T14:01:00Z' },
    ]);
    ok(merged.length === 1,
       '⚠️⚠️ E7 TWO FRAGMENTS OF ONE RUN MERGE INTO ONE RUN. Grading them ' +
       'separately is ROADMAP 15 constraint 1 \u2014 the 0 WPM rows in Jake\u2019s ' +
       'screenshot are what that looks like');
    ok(merged[0].seconds === 60 && merged[0].chars === 200 && merged[0].mistakes === 2,
       'E8 the union sums seconds, chars and mistakes');
    ok(merged[0].wpm === Math.round((198 / 5) / 1),
       'E9 wpm is recomputed from the union with logRun()\u2019s own arithmetic');
    ok(merged[0].clean === false,
       '⚠️ E10 THE UNION IS NOT CLEAN. The second fragment alone had zero ' +
       'mistakes and would have scored A🔥 on its own');

    const twoRuns = mergeContinuations([
        { date: '2026-08-24', label: 'u1_l1', detail: 'run 1', seconds: 30, chars: 90, mistakes: 0 },
        { date: '2026-08-24', label: 'u1_l1', detail: 'run 2', seconds: 30, chars: 90, mistakes: 0 },
    ]);
    ok(twoRuns.length === 2, 'E11 two genuinely different runs stay separate');

    const skipRem = mergeContinuations([
        { date: '2026-08-24', label: 'u1_l1', detail: 'run 1', seconds: 30, chars: 90, mistakes: 1 },
        { date: '2026-08-24', label: 'u1_l1', detail: 'run 1', seconds: 20, chars: 80, mistakes: 0, practice: 'remediation' },
    ]);
    ok(skipRem.length === 1 && skipRem[0].chars === 90,
       '⚠️⚠️ E12 A REMEDIATION SPRINT IS DROPPED BEFORE MERGING. It carries the ' +
       'same lesson id and the same run number, so merging it would fold a ' +
       'random-letter drill into a real run\u2019s totals');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- F. GRADING A RECONSTRUCTED RUN ---');
{
    const lesson = { id: 'u1_l1', gates: { minAccuracy: 85, minWPM: 15 }, steps: [
        { id: 'p', type: 'passage', text: 'the quick brown fox jumps over the lazy dog' },
    ]};
    const run = { runIdx: 0, wpm: 24, accuracy: 97, clean: false };

    const g = gradeMergedRun(run, lesson, 1);
    ok(g.ok && g.grade === FIRE_GRADE, 'F1 a fast clean prose run reconstructs as A🔥');
    ok(g.advances === true, 'F2 and it advances');

    ok(gradeMergedRun(run, lesson, 7).ok === false,
       '⚠️⚠️ F3 A DRIFTED runCount REFUSES. ROADMAP 15 constraint 2: editing a ' +
       'lesson re-chunks it and shifts every run index, so today\u2019s definition ' +
       'read against a two-week-old sprint can grade the wrong material');
    ok(gradeMergedRun(run, lesson, 7).reason === 'runcount-drift',
       'F4 ...and says why, rather than failing silently');
    ok(gradeMergedRun({ ...run, runIdx: 5 }, lesson, 1).reason === 'run-out-of-range',
       'F5 a run index past the end refuses too');
    ok(gradeMergedRun(run, null, 1).ok === false, 'F6 a missing lesson refuses');
    ok(gradeMergedRun(run, { id: 'x', steps: [] }, null).ok === false,
       'F7 a lesson that builds no runs refuses');
    ok(gradeMergedRun(run, lesson, null).ok === true,
       '⚠️ F8 A RECORD WITH NO STORED runCount IS STILL GRADEABLE. Records ' +
       'written before v2.34.0 have no runCount; refusing them would refuse the ' +
       'whole archive this feature exists to recover');
}

console.log('');
if (fail === 0) console.log(`PASS - ${pass} passing, 0 failing`);
else            console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
