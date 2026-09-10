// run-picker.js v1.0.0 — WHICH RUN A STUDENT MAY START. Round 114 (Carriage).
//
// ⚠️⚠️ THIS FILE EXISTS SO THE ANSWER CAN BE TESTED. Jake, 2026-09-10: *"One kid
// left learn.html on the 4th run of a lesson, and it kicked him back to the first
// run. There was no way to navigate to later runs he had unlocked. That was
// supposed to be there."* The picker had been built, was fully wired, and could
// not fire for a single student — and the reason was two lines of arithmetic
// buried in a 6,000-line page that no harness can import.
//
// ⭐ SO THE ARITHMETIC LIVES HERE, PURE, WITH tests/run-picker-test.mjs BEHIND IT.
// Same move as this round's panelOptionsFor() and peekStaging(), and the same
// reason each time: when a thing cannot be tested, that is a fact about the shape
// of the code and not about the harness.
//
// ⚠️ NO DOM, NO FIRESTORE, NO IMPORTS. It takes a progress record and a run list
// and returns a number. That is the whole contract, and it is what lets both
// learn.js and learn2.js call it — which matters, because HANDOFF §11 says one of
// those two files is going to be deleted.

export const RUN_PICKER_VERSION = '1.0.0';

/**
 * How many runs a student TYPES in this lesson — the game slot excluded.
 *
 * ⚠️⚠️ THE GAME SLOT IS WHY THE PICKER WAS DEAD. `attachGameSlot()` appends a
 * Deadline run, so `currentRuns.length` on `learn2.html` is one greater than on
 * `learn.html`. Every progress record ever written by the production page
 * therefore looked, to the guard below, exactly like a stale record from an
 * edited lesson — and the guard did the right thing with a difference that meant
 * nothing, for every student, on every lesson.
 *
 * ⭐ COUNTING THE TYPED RUNS COUNTS THE THING THAT DID NOT CHANGE. A record
 * written on either page now means the same thing, and a genuine lesson edit
 * still moves the number and still trips the guard.
 */
export function typedRunCount(runs) {
    return (runs || []).filter(r => r && !r.gameRun).length;
}

/**
 * The furthest run index a student may select, given their progress record.
 *
 * @param {object|null} rec   the stored progress record for this lesson
 * @param {object[]} runs     the live run list, game slot included
 * @returns {number}          0..runs.length-1
 *
 * ⚠️ ONE PAST THE FURTHEST FINISHED RUN, CLAMPED. Finishing run 3 unlocks run 4
 * and no further — a student may always go back, never skip ahead.
 * ⚠️ AN ABSENT OR UNSTARTED RECORD MEANS RUN 1 AND NOTHING ELSE. A picker that
 * opened a whole lesson to a child who has never touched it would make the
 * unlock meaningless.
 * ⚠️ AND A RE-CHUNKED LESSON MEANS RUN 1 TOO. `lesson-gate.js` keys per-run
 * mastery BY INDEX, so if the lesson has been edited since this record was
 * written every stored index points at different text. Refuse the shortcut
 * rather than trust it — that guard is correct and stays.
 */
export function maxReachableRunIdx(rec, runs) {
    const list = runs || [];
    const last = list.length - 1;
    if (last < 0) return 0;
    if (!rec || !rec.started) return 0;
    if (rec.runCount != null && rec.runCount !== typedRunCount(list)) return 0;
    const furthest = Number(rec.furthestRunIdx) || 0;
    return Math.max(0, Math.min(last, furthest + 1));
}

/**
 * Which run the intro panel should have selected when a lesson opens.
 *
 * @param {number} firstOpenIdx  the caller's `firstOpenRunIdx()` — the first run
 *                               that is not yet mastered-into-'practice'
 * @param {object|null} rec
 * @param {object[]} runs
 *
 * ⚠️⚠️ `firstOpenRunIdx()` ALONE COULD NEVER RESUME ANYBODY, AND THAT IS WHY JAKE
 * WATCHED A STUDENT GET SENT BACK TO RUN 1. It returns the first run whose mode
 * is not `'practice'`, and a run only becomes `'practice'` once MASTERED —
 * `MASTERY_POINTS = 4`, banked at A🔥 = 2 and A = 1, with **B, C, D and F worth
 * ZERO**. So it advanced only for a student scoring fireballs and A's on every
 * earlier run. A child who passed runs 1–4 with B's and C's — the ordinary case,
 * the case the gates are tuned for — banked nothing and reopened at run 1 every
 * single visit.
 *
 * ⭐ THE LATER OF THE TWO, NEVER THE EARLIER. A student who has mastered further
 * than they have merely reached must not be dragged backwards, and vice versa.
 *
 * ⚠️ THIS DOES NOT REOPEN JAKE'S 2026-08-17 RULING (*"If a kid doesn't finish a
 * lesson one session, they should restart it — not start at the last word"*).
 * That governs resuming mid-RUN, at the character, and a run still always starts
 * at character zero. This only decides which RUN is selected, and every earlier
 * run stays one click away.
 */
export function openingRunIdx(firstOpenIdx, rec, runs) {
    const a = Number(firstOpenIdx) || 0;
    return Math.max(a, maxReachableRunIdx(rec, runs));
}
