// run-picker-test.mjs v1.0.0 — A STUDENT COMES BACK AND LANDS WHERE THEY LEFT
// OFF. Round 114 (Carriage).
//
// ⚠️⚠️ THIS IS THE HARNESS THAT WOULD HAVE CAUGHT THE FEATURE BEING DEAD ON
// ARRIVAL. Jake, 2026-09-10: *"One kid left learn.html on the 4th run of a
// lesson, and it kicked him back to the first run. There was no way to navigate
// to later runs he had unlocked. That was supposed to be there."*
//
// It WAS there. `renderRunPicker()` was complete, correct, and wired into
// `showIntro()`. It could not fire for a single student, for two independent
// reasons that both look like careful engineering:
//
//   1. `maxReachableRunIdx()` refuses the shortcut when the stored `runCount`
//      differs from the live run count — right, because editing a lesson
//      re-chunks it and `lesson-gate.js` keys mastery BY INDEX. But
//      `attachGameSlot()` APPENDS a Deadline run, so the live count on
//      `learn2.html` is one greater than on `learn.html`, and ⭐ EVERY PROGRESS
//      RECORD EVER WRITTEN BY THE PRODUCTION PAGE LOOKED LIKE A STALE ONE.
//   2. The opening run came from `firstOpenRunIdx()` alone, which only advances
//      for a MASTERED run — 4 points, at A🔥 = 2 and A = 1, with B, C, D and F
//      worth ZERO. A child passing runs 1–4 with B's and C's banks nothing.
//
// ⭐⭐ SO THE TWO FEATURES JAKE ASKED FOR DISABLED EACH OTHER, and every harness
// in the repo was green because neither piece is wrong on its own. ⚠️ THAT IS THE
// SHAPE TO REMEMBER: a correct guard, firing on a difference that means nothing.
//
// ⚠️ PART A IS RULE 10 IN THE STRICT SENSE — it is built from the record shape
// `recordRunOutcome()` really writes, and it FAILS against the arithmetic that
// shipped.

import { typedRunCount, maxReachableRunIdx, openingRunIdx,
         RUN_PICKER_VERSION } from '../run-picker.js';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

/** A typed run, shaped as `buildRunList()` produces one. */
const typed = (i, n) => ({ stepIdx: i, chunkIdx: i, chunkCount: n, type: 'word_list' });
/** The appended Deadline slot, shaped as `attachGameSlot()` produces it. */
const game  = () => ({ stepIdx: 9, type: 'passage', gameRun: true, survival: true });

/** `learn.html`'s run list: typed runs only, no game. */
const prodRuns = n => Array.from({ length: n }, (_, i) => typed(i, n));
/** `learn2.html`'s run list: the same runs plus the game slot. */
const forkRuns = n => prodRuns(n).concat([game()]);

/**
 * A progress record exactly as `recordRunOutcome()` writes one on `learn.html`
 * for a student who has just finished run `furthest` (0-based) of `n`.
 *
 * ⚠️ `runCount` IS THE PRODUCTION PAGE'S OWN `currentRuns.length`, which has no
 * game slot in it. That is the number the fork has to be able to read.
 */
const prodRecord = (furthest, n) => ({
    lessonId: 'u4_l1', started: true,
    runCount: n, furthestRunIdx: furthest, lastRunIdx: furthest,
    lastGrade: 'C',
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nA — JAKE\'S STUDENT: FOUR RUNS DONE ON learn.html, RETURNS TO learn2.html');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THIS IS THE EXACT REPORTED CASE. A six-run lesson, four runs finished on
// the production page, then the student opens the beta. The fork's run list is
// SEVEN long (six typed + the game), the stored `runCount` is SIX, and every
// version of this arithmetic before Round 114 returned 0 from that mismatch.
{
    const rec = prodRecord(3, 6);        // finished run 4 of 6, 0-based index 3
    const runs = forkRuns(6);            // 6 typed + 1 game = 7

    ok(typedRunCount(runs) === 6,
       'the fork\u2019s list has 6 TYPED runs even though it holds 7 (' +
       typedRunCount(runs) + ')');
    ok(runs.length === 7, 'and 7 in total, which is what used to be compared');

    const maxIdx = maxReachableRunIdx(rec, runs);
    ok(maxIdx === 4,
       '\u26a0\u26a0 A STUDENT WHO FINISHED RUN 4 MAY REACH RUN 5 (idx ' + maxIdx +
       '). THIS IS THE ASSERTION THAT FAILED ON THE SHIPPED BUILD \u2014 it returned 0, ' +
       'which is what Jake watched happen');
    ok(maxIdx > 0,
       '\u2b50 and the picker therefore has more than one chip to draw, so it ' +
       'renders at all');

    // ⚠️ AND THE LESSON OPENS THERE, not at run 1. A picker the student has to
    // notice and click is not "go back to where they left off".
    const opening = openingRunIdx(0, rec, runs);
    ok(opening === 4,
       '\u26a0\u26a0 and the lesson OPENS on run 5, not run 1 (idx ' + opening + ')');
    // ⚠️ EVERY EARLIER RUN IS STILL REACHABLE. Jake: *"reach individual runs if
    // they want"* — the unlock is a ceiling, never a floor.
    for (let i = 0; i <= maxIdx; i++) {
        ok(i <= maxReachableRunIdx(rec, runs),
           '  run ' + (i + 1) + ' is still selectable');
    }
    ok(maxIdx < runs.length - 1,
       '\u26a0 but run 7 (the game) is NOT yet \u2014 no skipping ahead');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nB — THE MASTERY GATE NO LONGER DECIDES ALONE');
// ═══════════════════════════════════════════════════════════════════════════
{
    const runs = forkRuns(6);
    // The ordinary student: B's and C's, so firstOpenRunIdx() is still 0.
    const rec = prodRecord(3, 6);
    ok(openingRunIdx(0, rec, runs) === 4,
       '\u26a0\u26a0 a student with NO mastered runs still resumes (firstOpen 0 \u2192 idx ' +
       openingRunIdx(0, rec, runs) + ') \u2014 B\u2019s and C\u2019s bank ZERO mastery points, ' +
       'which is why the old resume never fired for the ordinary case');
    // ⭐ AND A STUDENT WHO HAS MASTERED FURTHER IS NOT DRAGGED BACK.
    ok(openingRunIdx(5, rec, runs) === 5,
       '\u2b50 a student mastered up to run 6 opens on run 6, not run 5 \u2014 the LATER ' +
       'of the two, never the earlier');
    ok(openingRunIdx(0, null, runs) === 0,
       'and a student who has never opened the lesson starts at run 1');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nC — THE GUARD THAT WAS RIGHT STILL WORKS');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THE POINT OF THE FIX WAS NEVER TO REMOVE THE STALENESS CHECK. A genuinely
// re-chunked lesson must still refuse the shortcut, because `lesson-gate.js` keys
// per-run mastery BY INDEX and every stored index then points at different text.
// ⭐ A FIX THAT MADE C1 PASS BY DELETING THE GUARD WOULD BE WORSE THAN THE BUG.
{
    const rec = prodRecord(3, 6);
    // The lesson was re-chunked from 6 typed runs to 8: the record is stale.
    ok(maxReachableRunIdx(rec, forkRuns(8)) === 0,
       '\u26a0\u26a0 C1 a re-chunked lesson still refuses the shortcut and opens at run 1');
    ok(maxReachableRunIdx(rec, forkRuns(4)) === 0,
       'C2 in either direction \u2014 fewer runs than the record expects, too');
    // A record written by the FORK (typed count) is readable by both pages.
    const forkRec = Object.assign({}, rec, { runCount: 6 });
    ok(maxReachableRunIdx(forkRec, prodRuns(6)) === 4,
       '\u2b50 C3 and a record written HERE is readable on learn.html \u2014 the count ' +
       'means the same thing on both pages, which is the whole fix');
    ok(maxReachableRunIdx(rec, forkRuns(6)) ===
       maxReachableRunIdx(forkRec, prodRuns(6)),
       '\u26a0 C4 the two pages agree exactly on where a student may start');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nD — EDGES, AND NOTHING OUT OF RANGE');
// ═══════════════════════════════════════════════════════════════════════════
{
    ok(maxReachableRunIdx(prodRecord(0, 1), forkRuns(1)) === 1,
       'a one-typed-run lesson unlocks its game slot once the run is done');
    // ⚠️ CLAMPED TO THE LIST. A furthestRunIdx past the end — which a stale
    // record can carry — must never return an index nothing can render.
    const wild = { started: true, furthestRunIdx: 99 };
    const m = maxReachableRunIdx(wild, forkRuns(6));
    ok(m === 6, 'a wild furthestRunIdx is clamped to the last run (' + m + ')');
    ok(maxReachableRunIdx({ started: true }, []) === 0,
       'an empty run list returns 0 rather than -1');
    ok(maxReachableRunIdx(null, forkRuns(6)) === 0, 'no record means run 1');
    ok(maxReachableRunIdx({ started: false, furthestRunIdx: 4 }, forkRuns(6)) === 0,
       '\u26a0 an unstarted record means run 1 even if it carries an index');
    ok(typedRunCount([]) === 0 && typedRunCount(null) === 0,
       'typedRunCount survives an empty or absent list');
    ok(typedRunCount([game(), game()]) === 0,
       'and a list of nothing but game runs has no typed runs');
    ok(RUN_PICKER_VERSION === '1.0.0', 'the module stamps itself');
}

console.log(fail
    ? `\nrun-picker-test: ${pass} passed, ${fail} FAILED`
    : `run-picker-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
