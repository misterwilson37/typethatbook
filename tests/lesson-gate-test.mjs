// lesson-gate-test.mjs v1.0.0 — Round 29. ROADMAP item 10.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THE FEATURE'S FAILURE MODE IS PUNISHING THE STRUGGLING STUDENT
// ═════════════════════════════════════════════════════════════════════════════
//
// Every check in section A exists because the obvious implementation of "stop
// kids redoing easy lessons" is a distance-or-time rule applied to ALL lessons,
// and that version takes review away from the child who needs it while barely
// inconveniencing the one who is coasting. Jake ruled it out in one sentence —
// *"a kid wanting to redo a lesson until he masters it is a GOOD thing"* — and
// section A is that sentence made executable.
//
//     A. an UNMASTERED lesson is never gated, at any distance, forever
//     B. mastery, and why a legacy record seeds at 1 and not 3
//     C. the receding window, against Jake's own worked example
//     D. ⚠️ progress RESETS the window — the property the whole design rests on
//     E. re-lock on re-fire: one shot, not a licence
//     F. active days: a gate, not a ledger, and one write per student per day
//     G. ⚠️ the twin — both page controllers must count the same days
//
// ⚠️ WHAT THIS CANNOT COVER, stated so nobody trusts it further than it goes:
// every function under test is pure, so this proves the RULE is right. It cannot
// prove learn.js asks the rule the right question, that a practice run really
// fails to arm the timer, or that the banner appears. Section G greps for the
// call sites; the rest is unproven until someone drives a browser.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const G = await import(path.join(ROOT, 'lesson-gate.js'));
const FIRE = 'A' + String.fromCodePoint(0x1F525);

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL  ' + m); } };

// ⚠️⚠️ ROADMAP 14 REPLACED THE RULE THIS FILE WAS WRITTEN FOR, AND THESE TWO
// HELPERS ARE WHERE THE TRANSLATION LIVES. Mastery was "three A🔥 on a LESSON"
// (`fireCount >= 3`); it is now "four POINTS on a RUN" (A🔥 = 2, A = 1). Every
// assertion below is unchanged in meaning — only the unit moved — which is the
// point: if a section that guarded the old rule cannot be re-expressed in the
// new one, that is a promise the new rule broke, not a test that went stale.
//
// `n` is still "how mastered", 0–3, so the cases below read the same. It is
// spent as points on EVERY run of the lesson, because these sections ask about
// lessons and a lesson is practice only when all of its runs are.
const rec = (n, extra = {}) => {
    const pts = n >= 3 ? G.MASTERY_POINTS : n * 1;      // 3 fires → mastered
    return {
        passed: true, grade: n ? FIRE : 'B',
        runCount: 2, runScores: { '0': pts, '1': pts },
        ...extra,
    };
};
// The mode of lesson `index` for a student at `furthest`, stalled `days`.
// ⚠️ `lastLockDay: 0` REPLACES `lastAdvanceDay: 0` — same zero, different event.
const mode = (index, furthest, record, days, extra = {}) => G.lessonModeFor({
    index, furthestIndex: furthest, record, runCount: (record && record.runCount) || 2,
    activeDayCount: days, lastLockDay: 0, unlocked: true, ...extra,
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── A. ⚠️⚠️ AN UNMASTERED LESSON IS NEVER GATED. EVER. ───');
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ IF ANY CHECK IN THIS SECTION GOES RED, THE FEATURE HAS INVERTED AND IS NOW
// HURTING THE STUDENT IT EXISTS FOR. Do not "fix" it by relaxing a number below.
{
    for (const fc of [0, 1, 2]) {
        ok(mode(0, 27, rec(fc), 0) === 'graded',
           `lesson 1 with ${fc} fire(s), student at 27, stalled 0 days — graded`);
        ok(mode(0, 27, rec(fc), 400) === 'graded',
           `lesson 1 with ${fc} fire(s) after 400 active days — still graded`);
    }
    ok(mode(0, 27, { passed: true, grade: 'B' }, 400) === 'graded',
       'a lesson passed with a B is replayable for credit forever');
    ok(mode(0, 27, { passed: true, grade: 'A' }, 400) === 'graded',
       '⚠️ an A is NOT mastery — only three A🔥 closes a lesson');
    ok(mode(5, 27, undefined, 400) === 'graded',
       'a lesson with NO record at all is graded, not gated');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── B. MASTERY, AND THE LEGACY SEED ───');
// ═══════════════════════════════════════════════════════════════════════════
{
    ok(G.fireCountOf(undefined, FIRE) === 0, 'no record → 0 fires');
    ok(G.fireCountOf({ grade: 'B' }, FIRE) === 0, 'a B seeds 0');
    ok(G.fireCountOf({ grade: 'A' }, FIRE) === 0, '⚠️ an A seeds 0 — A is not A🔥');
    ok(G.fireCountOf({ grade: FIRE }, FIRE) === 1,
       '⚠️ a legacy A🔥 record seeds ONE — `grade` is best-ever-seen and cannot ' +
       'tell one fire from twenty, so 1 is the honest maximum');
    ok(G.fireCountOf({ grade: FIRE, fireCount: 7 }, FIRE) === 7,
       'a stored count always wins over the seed');
    ok(G.fireCountOf({ grade: FIRE, fireCount: 0 }, FIRE) === 0,
       '⚠️ a stored ZERO is respected, not treated as absent — `?? ` on a number ' +
       'that can legitimately be 0 is how the seed would silently overwrite it');

    ok(G.isMastered({ fireCount: 3 }, FIRE) === true, '3 fires is mastery');
    ok(G.isMastered({ fireCount: 2 }, FIRE) === false, '2 fires is not');
    ok(G.isMastered({ grade: FIRE }, FIRE) === false,
       '⚠️ SEEDING AT 3 WOULD LOCK A CLASS OUT ON DEPLOY MORNING. A student who ' +
       'has already earned fire starts at 1 and needs two more.');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log("\n─── C. THE RECEDING WINDOW — Jake's own worked example ───");
// ═══════════════════════════════════════════════════════════════════════════
// From ROADMAP §10.D. A student at lesson 27 (index 26), everything mastered.
{
    const table = [
        [0, 0], [6, 0], [7, 1], [13, 1], [14, 2], [20, 2], [56, 8],
    ];
    for (const [days, expected] of table) {
        ok(G.reachBackFor(days, 0) === expected,
           `${days} active days stalled → reachBack ${expected}`);
    }

    // At 7 days, exactly lessons 26 and 27 (indices 25, 26) are graded.
    ok(mode(25, 26, rec(3), 7) === 'graded', 'stalled a week: lesson 26 opens');
    ok(mode(24, 26, rec(3), 7) === 'practice', 'stalled a week: lesson 25 does NOT');
    ok(mode(24, 26, rec(3), 14) === 'graded', 'stalled two weeks: lesson 25 opens');
    // ⚠️⚠️ ROADMAP 14 DELETED "THE FURTHEST LESSON IS ALWAYS GRADED", AND THE
    // DELETION IS HALF THE FIX. Under the old rule that exception is what let
    // Jake master lesson 1 and keep farming it: nothing behind him ever locked
    // because he never passed a LATER lesson. What the exception was PROTECTING
    // is still guaranteed, and these two assertions are that guarantee moved
    // into the new unit — the student always has somewhere that counts, it is
    // just the next RUN rather than the same lesson.
    ok(mode(26, 26, rec(3), 0) === 'practice',
       '⚠️ a fully mastered furthest lesson is PRACTICE with no window open — ' +
       'the farming hole is closed');
    ok(G.runModeFor({ lessonIndex: 26, runIdx: 1, furthestLessonIndex: 26,
                      record: { runCount: 2, runScores: { '0': 4, '1': 1 } },
                      activeDayCount: 0, lastLockDay: 0 }) === 'graded',
       '⚠️⚠️ BUT AN UNMASTERED RUN IN THAT SAME LESSON STILL COUNTS — which is ' +
       'why the exception is safe to delete. Mastering run 1 does not strand a ' +
       'student on run 2');

    ok(mode(0, 26, rec(3), 56) === 'practice',
       '⚠️⚠️ LESSON 1 IS STILL PRACTICE AFTER THE ENTIRE TWO-MONTH COURSE SPENT ' +
       'STANDING STILL. It needs 26 weeks. This is the single number Jake asked ' +
       'for by name: "I do not want kids to go back and do lesson 1."');
    ok(mode(0, 26, rec(3), 26 * 7) === 'graded',
       'and at 26 weeks it does open — the rule recedes, it does not wall off');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── D. ⚠️⚠️ PROGRESS RESETS THE WINDOW ───');
// ═══════════════════════════════════════════════════════════════════════════
// The property that makes this better than a cooldown: review reaches the
// student who stalls and withholds itself from the one who is coasting, with
// nobody assessed by anybody.
{
    // Same 20 active days. One student advanced on day 18; one has not advanced
    // since day 0.
    const coasting = G.lessonModeFor({
        index: 24, furthestIndex: 26, record: rec(3), fireGrade: FIRE,
        activeDayCount: 20, lastAdvanceDay: 18, unlocked: true,
    });
    const stalled = G.lessonModeFor({
        index: 24, furthestIndex: 26, record: rec(3), fireGrade: FIRE,
        activeDayCount: 20, lastAdvanceDay: 0, unlocked: true,
    });
    ok(coasting === 'practice',
       '⚠️ THE ADVANCING STUDENT NEVER SEES AN OLD LESSON — 2 days since advancing');
    ok(stalled === 'graded',
       '⚠️ THE STALLED STUDENT DOES — 20 days trying, same calendar, same lessons');
    ok(coasting !== stalled,
       'the two students differ ONLY in whether they progressed, which is the ' +
       'whole design: the shape of the rule replaces a judgement call');

    ok(G.reachBackFor(20, 20) === 0, 'advancing today collapses the window to 0');
    ok(G.reachBackFor(5, null) === 0,
       '⚠️ a record with NO advance stamp reads as "advanced today", not as ' +
       '"advanced at the beginning of time" — the second would hand a legacy ' +
       'student the whole curriculum on deploy morning');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── E. RE-LOCK ON RE-FIRE — one shot, not a licence ───');
// ══════════════════════════════════════════════════════════════════════════
// ⚠️ ROADMAP 14 MADE THIS FREE. v1.0.0 needed a per-lesson `fireAtDay` stamp and
// a clause reading it. Now the clock runs from `lastLockDay`, and crossing four
// points on ANY run stamps it — so re-mastering anything collapses the window to
// zero for everything. One mechanism instead of two, and Jake's requirement is
// unchanged: *"if they fireball lesson 1 after it unlocks, I want it immediately
// locked again."*
{
    // Stalled 7 days with the last lock on day 0: lesson 26 (index 25) has opened.
    ok(mode(25, 26, rec(3), 7) === 'graded', 'before: the opened lesson is graded');

    // They re-master it on day 7, which stamps lastLockDay = 7.
    const after = (days) => G.lessonModeFor({
        index: 25, furthestIndex: 26, record: rec(3), runCount: 2,
        activeDayCount: days, lastLockDay: 7, unlocked: true,
    });
    ok(after(7) === 'practice',
       '⚠️ IMMEDIATELY after re-firing it, the same lesson is practice again');
    ok(after(13) === 'practice', 'six active days later, still practice');
    ok(after(14) === 'graded',
       'a further full window later it opens again — the rule recedes rather than ' +
       'permanently burning a lesson');
    ok(mode(0, 27, rec(2), 0) === 'graded',
       '⚠️ the re-lock cannot reach an UNMASTERED lesson either — section A holds ' +
       'whatever the clock says');
}

// ══════════════════════════════════════════════════════════════════════════
console.log('\n─── F. ACTIVE DAYS — a gate, not a ledger ───');
// ═══════════════════════════════════════════════════════════════════════════
{
    ok(G.activeDayPlan({ activeDayLast: '2026-08-23', activeDayCount: 9 }, '2026-08-23') === null,
       '⚠️ ALREADY COUNTED TODAY → null → NO WRITE. This is what keeps it to one ' +
       'Firestore write per student per day rather than one per second.');
    const p = G.activeDayPlan({ activeDayLast: '2026-08-22', activeDayCount: 9 }, '2026-08-23');
    ok(p && p.activeDayCount === 10 && p.activeDayLast === '2026-08-23',
       'a new day increments by exactly one and stamps the date');
    const first = G.activeDayPlan({}, '2026-08-23');
    ok(first && first.activeDayCount === 1, 'a brand-new student lands on 1');
    ok(G.activeDayPlan(undefined, '2026-08-23').activeDayCount === 1,
       'a missing user doc does not throw');

    // A student who skips a fortnight gains ONE day, not fifteen.
    const back = G.activeDayPlan({ activeDayLast: '2026-08-01', activeDayCount: 4 }, '2026-08-23');
    ok(back.activeDayCount === 5,
       '⚠️⚠️ ACTIVE DAYS, NOT CALENDAR DAYS. A child absent three weeks returns ' +
       'to ONE more day of reach-back, not twenty-two. Jake was explicit: "when ' +
       'I say a month, I mean a month of typing anything."');
    ok(G.activeDayCountOf({}) === 0 && G.activeDayCountOf(undefined) === 0,
       'reading a missing counter is 0, not NaN');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── G. ⚠️ THE TWIN — both pages count the same days ───');
// ═══════════════════════════════════════════════════════════════════════════
// Jake: "a month of typing ANYTHING". Time typed in Library counts toward a
// School gate, so game.js must increment the counter too. The two page
// controllers cannot import each other, so this is a twin by construction —
// §0.-13.E's problem, and the seventh instance of it was three weeks ago.
{
    for (const f of ['game.js', 'learn.js']) {
        const src = read(f);
        ok(src.includes('activeDayPlan('),
           `${f} CALLS activeDayPlan — a page that counts no days silently ` +
           `starves the gate on the OTHER page`);
        ok(/from\s+["']\.\/lesson-gate\.js["']/.test(src),
           `${f} imports from lesson-gate.js rather than reimplementing the rule`);
    }
    // learn.js is the only page that renders the gate.
    const learn = read('learn.js');
    ok(learn.includes('lessonModeFor('), 'learn.js asks the rule for a mode');
    ok(learn.includes('furthestIndexOf('), 'learn.js derives furthest from progress');

    // ⚠️ The three things a practice run must NOT do (ROADMAP §10.F).
    ok(/practice/i.test(learn) && learn.includes('PRACTICE_MODE_BANNER'),
       '⚠️ learn.js declares the persistent banner — a child typing for ten ' +
       'minutes while the daily total does not move reads as a broken app, and ' +
       'silent counting failures are this project\'s specialty');

    // ⚠️ Comments stripped first: this file TALKS about Firestore at length, and
    // the first draft of this check failed on its own documentation.
    const src = read('lesson-gate.js').replace(/\/\/[^\n]*/g, '');
    ok(!/\bfetch\(|firebase|getDoc\(|setDoc\(/.test(src),
       '⚠️ lesson-gate.js stays PURE — no Firestore, no DOM, no clock. That is ' +
       'why every rule above is testable without a browser.');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
