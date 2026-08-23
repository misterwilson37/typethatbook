// lesson-gate.js v1.0.0 — ROADMAP item 10, the lesson-farming gate.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ MASTERY IS WHAT CLOSES A LESSON, AND ONLY MASTERY.
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-08-22: *"Students are just redoing the first three lessons
// indefinitely because they're easy."* And, deciding the shape of the fix:
// *"A kid wanting to redo a lesson until he masters it is a GOOD thing. A kid
// bumming around on a lesson he's mastered is a BAD thing."*
//
// ⚠️ THAT SENTENCE IS THE WHOLE DESIGN AND IT SHOULD LEAD ANY SUMMARY OF THIS
// FILE. The gate can only ever reach a lesson with `fireCount >= 3`. A lesson
// passed with a B — or an A, or two A🔥 — is ALWAYS graded and ALWAYS replayable,
// at any distance, forever. ⚠️⚠️ DO NOT ADD A DISTANCE OR TIME CONDITION THAT
// APPLIES TO AN UNMASTERED LESSON. It would invert the feature and punish the
// struggling student, who is the one this app exists for.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE RULE
// ═══════════════════════════════════════════════════════════════════════════
//
//     reachBack = floor(activeDaysSinceLastAdvance / REACH_BACK_DAYS)
//     a MASTERED lesson L is graded iff  L >= furthest - reachBack
//                                  and  it has not re-fired inside the window
//     everything else mastered is PRACTICE
//
// ⚠️ THE FLAT COOLDOWN THIS REPLACED WAS WRONG FOR A REASON WORTH KEEPING.
// Jake's students are with him for TWO MONTHS. A flat 30-day cooldown is a
// quarter of the course, and it opens EVERY mastered lesson at once — home row
// first, which is the one he least wants opened. Distance had to be in the rule,
// not just time.
//
// ⚠️⚠️ AND THE PROPERTY THAT MAKES THIS BETTER THAN A COOLDOWN: PROGRESS RESETS
// IT. A child advancing normally never accumulates reach-back and never sees an
// old lesson. A child who STALLS — the one who has actually forgotten something —
// earns one more lesson behind them per week of trying. **Review reaches the
// struggling student and withholds itself from the coasting one, without either
// of them being assessed by anybody.** The shape of the rule does the work a
// judgement call would otherwise have to.
//
// Lesson 1 needs 26 weeks of standing still. It cannot open inside a two-month
// course, which is exactly the ask.
//
// ⚠️ EVERY FUNCTION HERE IS PURE. No Firestore, no DOM, no clock — dates and
// counts are passed in. That is why the whole rule is directly testable in
// lesson-gate-test.mjs rather than reachable only by driving a browser, and it
// is the same discipline daylog.js and drill-filter.js are built on.

export const LESSON_GATE_VERSION = '1.0.0';

// Three A🔥 closes a lesson. Jake's number.
export const MASTERY_FIRE_COUNT = 3;

// One lesson of reach-back per seven ACTIVE days. ⚠️ 7 is not arbitrary and not
// new: it is the same threshold game.js's re-anchor ladder already uses
// (REANCHOR_EXACT_MS), so this adds no constant the project had not already
// reasoned about once.
export const REACH_BACK_DAYS = 7;

// ═══════════════════════════════════════════════════════════════════════════
// fireCount — and why it is SEEDED rather than migrated
// ═══════════════════════════════════════════════════════════════════════════
//
// `grade` on a lessonProgress record is BEST-EVER-SEEN and monotonic, so it
// cannot tell one A🔥 from twenty. `fireCount` is therefore a genuinely new
// quantity and not a second copy of an existing one — Rule 9 is satisfied on
// its own terms, not waived.
//
// ⚠️ 1 IS THE HONEST MAXIMUM FOR A LEGACY RECORD AND YOU MUST NOT SEED HIGHER.
// Jake's idea, and it costs nothing: computed at read time from a field already
// stored, so there is no backfill, no migration and no new write. Seeding at 3
// would claim knowledge the data does not contain **and would lock a whole class
// out on deploy morning** — the kind of thing discovered during first period
// rather than during testing.
export function fireCountOf(record, fireGrade) {
    if (!record) return 0;
    if (typeof record.fireCount === 'number') return record.fireCount;
    return record.grade === fireGrade ? 1 : 0;
}

export function isMastered(record, fireGrade) {
    return fireCountOf(record, fireGrade) >= MASTERY_FIRE_COUNT;
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVE DAYS — a gate, not a ledger
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake: *"When I say a month, I mean a month of typing anything."* — so this
// counts days the student TYPED, not calendar days. A child absent for a month
// must not return to a pile of unlocked lessons.
//
// The set of days a student typed already exists: it is exactly the set of
// `typing_logs/{uid}_{date}` documents. Counting a month of them is ~30 reads on
// every map render, which is not affordable. So this is a monotonic counter on
// the student record instead.
//
// ⚠️⚠️ THAT IS A SECOND RECORD OF A QUANTITY THAT ALREADY EXISTS, AND RULE 9 WAS
// SPENT ON IT DELIBERATELY, BY JAKE: *"A lesson unlocking a day early is fine.
// Doing this in the cheapest way possible is also fine... Unlike time, this
// doesn't have to be bullet proof — it just needs to be a gate."*
//
// ⚠️ THE DISTINCTION IS REUSABLE AND IS THE MOST VALUABLE LINE IN THIS FILE:
// **A GATE IS NOT A LEDGER.** Rule 9 exists because a duplicated counter
// corrupted the GRADED RECORD — `stats/time_tracking` was a second copy of a
// number a parent sees. This counter is never reported, never graded, never
// shown to anybody, and its worst failure is a child getting review access one
// day early. Same rule, different risk class. **Spend Rule 9 on ledgers; a gate
// can be approximate.**
//
// ⚠️⚠️ THE ROADMAP NAMED THE WRONG INCREMENT SITE AND IT WOULD HAVE NEVER FIRED.
// It said to increment "at the existing day-rollover in the tick — the one place
// that already owns the day boundary." That rollover is the MIDNIGHT-STRADDLE
// path: `statsData.lastDate` is set to today at load, so the branch only runs
// for a tab left open across midnight. In a school building that is roughly
// never, and the counter would have sat at 0 for every student while the feature
// silently did nothing. Read the stored date instead, which is what this does.
//
// Returns null when nothing needs writing — the common case, since a student
// types on a day they have already been counted for. The caller writes only on
// a non-null result, so this costs ONE Firestore write per student per day.
export function activeDayPlan(userDoc, todayStr) {
    const stored = (userDoc && userDoc.activeDayLast) || '';
    if (stored === todayStr) return null;
    const count = (userDoc && typeof userDoc.activeDayCount === 'number')
        ? userDoc.activeDayCount : 0;
    return { activeDayCount: count + 1, activeDayLast: todayStr };
}

export function activeDayCountOf(userDoc) {
    return (userDoc && typeof userDoc.activeDayCount === 'number')
        ? userDoc.activeDayCount : 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// THE WINDOW
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ MEASURED FROM THE LAST ADVANCE, NOT FROM THE START OF TIME. This is the
// clause that makes progress reset the window. `lastAdvanceDay` is the
// activeDayCount stamped when the student last passed a lesson they had never
// passed before.
//
// A missing stamp reads as "advanced on the day they were first counted", i.e.
// no reach-back yet — the safe direction for a student whose record predates
// this feature. ⚠️ NOT zero-means-the-beginning-of-time: that would hand a
// legacy student the whole curriculum on deploy morning.
export function reachBackFor(activeDayCount, lastAdvanceDay) {
    const since = activeDayCount - (typeof lastAdvanceDay === 'number' ? lastAdvanceDay : activeDayCount);
    if (!(since > 0)) return 0;
    return Math.floor(since / REACH_BACK_DAYS);
}

// ═══════════════════════════════════════════════════════════════════════════
// THE MODE OF ONE LESSON
// ═══════════════════════════════════════════════════════════════════════════
//
//   'locked'   — the existing prerequisite lock. Unchanged by this file.
//   'graded'   — normal. Counts time, files a session, can earn a grade.
//   'practice' — typeable, counts nothing, files nothing, earns nothing.
//
// ⚠️ 'practice' IS NOT A PUNISHMENT AND MUST NOT BE PRESENTED AS ONE. The lesson
// is still fully playable. What it no longer does is pay.
export function lessonModeFor({
    index, furthestIndex, record, fireGrade,
    activeDayCount = 0, lastAdvanceDay = null, unlocked = true, staff = false,
}) {
    if (!unlocked) return 'locked';

    // ⚠️ STAFF ARE NEVER GATED. Jake has to be able to demonstrate any lesson to
    // a child standing next to him, and to check this feature without inventing
    // three A🔥 runs first. It is a UI gate on a teacher's own account, not a
    // permission — see firebase-config.js.
    if (staff) return 'graded';

    // ⚠️ THE UNMASTERED CASE IS THE FIRST TEST ON PURPOSE. Everything below it
    // is unreachable for a lesson the student has not proven three times over,
    // and that ordering is the guarantee, not a shortcut.
    if (!isMastered(record, fireGrade)) return 'graded';

    // The furthest lesson reached is always graded — otherwise a student who
    // masters the end of their own progress has nowhere left that counts.
    if (index >= furthestIndex) return 'graded';

    const reachBack = reachBackFor(activeDayCount, lastAdvanceDay);
    if (index < furthestIndex - reachBack) return 'practice';

    // ⚠️ RE-LOCK ON RE-FIRE — Jake: *"If they fireball lesson 1 after it unlocks,
    // I want it immediately locked again."* A reach-back opening is ONE SHOT, not
    // a licence. `fireAtDay` is the activeDayCount when this lesson last earned
    // A🔥; re-firing stamps it, and the lesson then needs a further full window
    // before it can pay again.
    //
    // A record with no stamp predates the feature and is not held against the
    // student.
    if (typeof record?.fireAtDay === 'number' &&
        (activeDayCount - record.fireAtDay) < REACH_BACK_DAYS) return 'practice';

    return 'graded';
}

// The furthest lesson index the student has passed. -1 for a student who has
// passed nothing, so `index >= furthestIndex` is true for lesson 0 and their
// first lesson is graded.
export function furthestIndexOf(lessons, progress) {
    let furthest = -1;
    lessons.forEach((l, i) => { if (progress?.[l.id]?.passed) furthest = i; });
    return furthest;
}
