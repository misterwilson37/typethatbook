// game-slot.js v1.0.0 — WHERE DEADLINE GOES IN A LESSON. Round 114 (Carriage).
//
// Jake's ruling, 2026-09-10: *"I want deadline to replace the final run at the end
// of lessons anywhere that it makes sense."* Presented four options; he chose
// **Option 1 — pace from the lesson, grade on accuracy only** — and **kept the
// 4-key floor**.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THE PACE AND THE GRADE ARE TWO DIFFERENT NUMBERS. THAT IS THE WHOLE RULING.
// ═════════════════════════════════════════════════════════════════════════════
//
// Deadline needs a words-per-minute figure to decide **how fast words fall**. A
// lesson's `minWPM` is a figure a student must **beat to pass**. Before this
// round one line conflated them:
//
//     const g = gatesForRun(last, lesson.gates);
//     if (!g || g.minWPM == null) return runs;      // no game at all
//
// `run-grade.js` returns `minWPM: null` for `DRILL_TYPES` — deliberately, because
// speed on random letter groups measures nothing — so **every lesson ending in a
// drill got no game**. Measured against the real 47-lesson corpus that is 14
// lessons: all of Units 1, 2 and 5. ⭐ **THOSE ARE EXACTLY JAKE'S "more than 4
// keys but not passages" CASE, AND WHERE MOST OF A MIDDLE SCHOOL SITS.**
//
// ⭐ SO A DRILL RUN NOW GETS A GAME, PACED BY THE LESSON'S OWN minWPM AND GRADED
// ON ACCURACY ALONE — exactly as the typed drill it replaces was graded. Nothing
// about who passes changes. ⚠️ `missionConfigFromRun()` ALREADY DID THE RIGHT
// THING HERE and needed no edit: it falls back to `lessonGates.minWPM` when the
// run's own gate is null. The pace source existed all along; one guard upstream
// meant it was never reached.
//
// ⚠️⚠️ THE REPLACED RUN KEEPS ITS ORIGINAL `type`, AND THAT IS LOAD-BEARING FOR
// THE GRADE. `gatesForRun()` reads the type, drill types are in `DRILL_TYPES`, so
// the grade stays accuracy-only automatically. **Inventing a new type here, or
// stamping a prose type on a drill run, would silently turn a Unit 1 lesson into
// a speed test** — which is Option 2, which Jake did not choose.
//
// ⚠️ AND A DRILL GAME CANNOT BE PASSED BY DOING NOTHING. A student who types
// nothing leaks every target and the game ends itself, reporting `chars: 0,
// mistakes: 0` — and `accuracyPct(0)` is **100 by definition**, which on an
// accuracy-only run would be an A🔥 for an empty screen. `finishGameStep()` gates
// on `rep.quotaMet`, so a lost game is an UNFINISHED run rather than a passed or
// failed one. ⚠️ **DO NOT REMOVE THAT GATE**; it is the only thing standing
// between this ruling and a free pass on every drill lesson in the course.
//
// ⚠️ THIS FILE IS PURE — no DOM, no Firestore, no imports. It exists so the
// decision can be driven against `tests/fixtures/lessons-export.json`, which is
// how the 14 missing lessons were found in the first place. See
// tests/game-slot-test.mjs.

export const GAME_SLOT_VERSION = '1.0.0';

/** Prose finishes get the game APPENDED; everything else gets it REPLACED. */
export const PROSE_TYPES = ['passage', 'sentence_list'];

/**
 * ⚠️ JAKE KEPT THIS FLOOR, 2026-09-10. Below four cumulative keys there is not
 * enough alphabet for falling words to be anything but the same two letters, and
 * a lesson that early is still teaching where the home row is. Against the real
 * corpus it skips exactly one lesson: `u1_l1`.
 */
export const GAME_MIN_KEYS = 4;

/**
 * Decide whether a lesson gets a Deadline run, and how.
 *
 * @param {object} lesson       the lesson document
 * @param {object[]} runs       the typed run list, in order
 * @param {object} deps
 *   gatesForRun {function}     run-grade.js's gatesForRun — ⚠️ INJECTED, NOT
 *                              REIMPLEMENTED. It is the single answerer for what
 *                              a run is graded on, and a second copy of that
 *                              judgement is the Rule 9 break this file would
 *                              otherwise be.
 *   cumulativeKeys {number}    how many distinct keys the course has taught up
 *                              to and including this lesson
 * @returns {{mode: string, reason: string, pace: number|null, gradesSpeed: boolean}}
 *   mode: 'append' | 'replace' | 'none'
 *
 * ⚠️ IT RETURNS A PLAN AND MUTATES NOTHING. The caller owns the run list; this
 * owns the judgement. That split is what makes the judgement testable.
 */
export function planGameSlot(lesson, runs, deps) {
    const list = runs || [];
    const gatesForRun = deps && deps.gatesForRun;
    const keys = (deps && deps.cumulativeKeys) || 0;
    const none = r => ({ mode: 'none', reason: r, pace: null, gradesSpeed: false });

    if (!list.length) return none('no runs');
    if (keys < GAME_MIN_KEYS) return none('fewer than ' + GAME_MIN_KEYS + ' keys taught');
    if (typeof gatesForRun !== 'function') return none('no gatesForRun supplied');

    const last = list[list.length - 1];
    if (!last || !last.type) return none('final run has no type');

    const g = gatesForRun(last, lesson && lesson.gates) || {};
    const lessonWPM = lesson && lesson.gates && lesson.gates.minWPM != null
        ? lesson.gates.minWPM : null;

    // ⭐ THE PACE: the run's own graded gate when it has one, else the lesson's.
    // ⚠️ THE SAME PRECEDENCE missionConfigFromRun() USES, deliberately — if these
    // two disagreed, this file would approve a game at a pace the mission then
    // built differently, and the difficulty a child met would not be the
    // difficulty anything here reasoned about.
    const pace = g.minWPM != null ? g.minWPM : lessonWPM;
    // ⚠️ NO PACE, NO GAME. missionConfigFromRun() would fall back to a hardcoded
    // 15, which on a Unit 1 lesson is roughly half again the speed that lesson
    // asks for — a game nobody could clear, arriving without a word of warning.
    if (pace == null) return none('no pace available from run or lesson');

    // ⚠️ WHETHER THE GRADE INCLUDES SPEED IS `gatesForRun()`'s ANSWER, NOT OURS.
    // A drill keeps its accuracy-only grade; prose keeps its speed gate.
    const gradesSpeed = g.minWPM != null;

    if (PROSE_TYPES.indexOf(last.type) !== -1) {
        // ⭐ APPEND. Jake, 2026-09-09: *"kids do 1/4 as they did originally, then
        // 2/4, then 3/4, then 4/4. Then — only for fun — they do the passage
        // AGAIN as a game. Once they pass 1/4, they win... but the game doesn't
        // stop until they lose."* ⚠️ NOTHING IS REMOVED FROM THE LESSON.
        return { mode: 'append', reason: 'prose finish', pace, gradesSpeed };
    }

    // ⭐ REPLACE. ⚠️ A ONE-RUN LESSON IS NEVER REPLACED, or the whole lesson
    // becomes the game and the child never types the drill at all.
    if (list.length < 2) return none('single-run lesson — replacing would erase it');
    return { mode: 'replace', reason: 'drill or word-list finish', pace, gradesSpeed };
}
