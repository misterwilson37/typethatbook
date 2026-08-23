// lesson-gate.js v1.1.0 — ROADMAP items 10 and 14, the farming gate.
//
// ⚠️⚠️ v1.1.0 — ROADMAP 14. MASTERY IS NOW CUMULATIVE POINTS PER **RUN**.
//        A🔥 = 2, A = 1, B and below = 0, MASTERED AT 4. Jake's ruling, and it
//        replaces the three-fireballs-per-lesson rule of v1.0.0 outright.
//        LOCKED BY RUN, UNLOCKED BY LESSON, CLOCK FROM THE LAST LOCK — also his;
//        the block headed WHY JAKE'S RESOLUTION BEATS BOTH OF MINE is worth
//        reading before anyone simplifies it back to a single unit.
//        ⚠️⚠️ THIS IS ARGUABLY A MAJOR BUMP AND I HAVE NOT TAKEN IT.
//        `lessonModeFor()` keeps its name and signature but now answers from run
//        scores, and `fireCountOf()`/`isMastered()` survive only to seed legacy
//        records — they are no longer the rule. Jake's call, not mine; the
//        v2.0.0 precedent is hud.js, which he signed off explicitly.
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

export const LESSON_GATE_VERSION = '1.1.0';

// Three A🔥 closes a lesson. Jake's number.
export const MASTERY_FIRE_COUNT = 3;

// One lesson of reach-back per seven ACTIVE days. ⚠️ 7 is not arbitrary and not
// new: it is the same threshold game.js's re-anchor ladder already uses
// (REANCHOR_EXACT_MS), so this adds no constant the project had not already
// reasoned about once.
export const REACH_BACK_DAYS = 7;

// ⚠️⚠️ ROADMAP 14 — POINTS PER RUN. THIS IS THE RULE NOW.
//
// Jake, 2026-08-23: *"A fireball counts as 2, an A counts for 1, and we kill
// access at a score of 4."*
//
// ⚠️ **B SCORING ZERO IS WHAT PRESERVES THE GUARANTEE AT THE TOP OF THIS FILE.**
// A student who only ever passes with a B never accumulates and is therefore
// NEVER GATED, FOREVER. Do not give B a value "for fairness" — it would invert
// the feature onto the struggling student, who is the one it exists to protect.
// Only the definition of "mastered" moved; the unmastered promise is unchanged.
export const RUN_POINTS = { 'A\uD83D\uDD25': 2, 'A': 1 };
export const MASTERY_POINTS = 4;

// ⚠️ WHY POINTS AND NOT A COUNT. Jake believed the v1.0.0 rule needed three
// fireballs IN A ROW; it never did, and that he could not tell after a dozen
// attempts is the finding, not the misreading. Four points is reachable three
// honest ways — two fireballs, one fireball and two A's, or four A's.
export function pointsForGrade(grade) {
    return RUN_POINTS[grade] || 0;
}

// ════════════════════════════════════════════════════════════════════════
// DOWNWARD CLOSURE — mastering run k closes runs 1..k-1 of the same lesson
// ════════════════════════════════════════════════════════════════════════
//
// Jake: *"run 3 of a lesson locks runs 1 and 2, too, as it's the same skills."*
//
// ⚠️ THIS IS THE CLAUSE THAT STOPS THE RETREAT. Without it a student who has
// mastered run 3 drops back to run 1 and farms there instead, and the whole
// per-run gate would have bought nothing.
//
// ⚠️ IT IS COMPUTED, NOT STORED. A closure flag written onto runs 1..k-1 would
// be a second record of something `runScores` already determines (Rule 9), and
// it would go stale the moment a lesson is re-chunked.
export function runMastered(record, runIdx) {
    if (!record) return false;
    const scores = record.runScores || {};
    for (const [idx, pts] of Object.entries(scores)) {
        if (Number(idx) >= runIdx && pts >= MASTERY_POINTS) return true;
    }
    return false;
}

// The student-facing number: points banked on this run.
// ⚠️ ROADMAP 14'S LAST SECTION IS A REQUIREMENT, NOT A NICETY — the v1.0.0
// rule was unfalsifiable from outside, which is why nobody could report it
// broken. Whatever the threshold is, SHOW PROGRESS TOWARD IT.
export function runScoreOf(record, runIdx) {
    if (!record) return 0;
    const direct = (record.runScores || {})[String(runIdx)];
    if (typeof direct === 'number') return direct;
    // ⚠️ SEEDED, NOT MIGRATED — same discipline and same reason as fireCountOf()
    // below. A legacy record's only evidence is best-ever `grade`, which cannot
    // tell one A🔥 from twenty, so it is worth its own points ONCE. Seeding at
    // 4 would lock a whole class out on deploy morning.
    return pointsForGrade(record.grade || '');
}

// ════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ WHY JAKE'S RESOLUTION BEATS BOTH OF MINE — READ BEFORE SIMPLIFYING
// ════════════════════════════════════════════════════════════════════════
//
// Jake: *"Maybe it's locked by run as discussed, but unlocked by lesson based on
// the date of the last lock? That seems like a happy in-between."*
//
// **LOCKED BY RUN. UNLOCKED BY LESSON. THE CLOCK RUNS FROM THE LAST LOCK.**
//
// Two options were on the table and both were a single knob — pick a unit, or
// pick a multiplier — and each traded anti-farming against review. His splits
// the two DIRECTIONS and gives each the unit that suits it:
//
//   * LOCKING PER RUN kills farming, because it is fine-grained enough to stop a
//     student grinding one run. Nothing coarser can.
//   * UNLOCKING PER LESSON makes review real, because a whole lesson's material
//     returns at once. ⚠️ REVIEW REACHING THE STUDENT WHO HAS ACTUALLY FORGOTTEN
//     SOMETHING WAS THE ENTIRE JUSTIFICATION FOR A RECEDING WINDOW OVER A FLAT
//     COOLDOWN. Reaching back one RUN per week would have gutted that while
//     looking like the smaller, safer change.
//   * ⚠️ "FROM THE DATE OF THE LAST LOCK" FIXES WHAT NEITHER OPTION DID. The
//     v1.0.0 window ran from the last ADVANCE, so a student grinding one run —
//     never advancing — accrued reach-back the entire time they were farming.
//     From the last LOCK, the clock starts only once the student has actually
//     mastered something: it measures time since you last PROVED you knew
//     something, not time since you last moved.
//
// ⚠️ `lastLockDay` REPLACES `lastAdvanceDay`. Do not keep both — they will
// disagree, and that is Rule 9. `lastAdvanceDay` is read once as a fallback for
// records written before this shipped, and never written again.
export function lastLockDayOf(userDoc) {
    if (userDoc && typeof userDoc.lastLockDay === 'number') return userDoc.lastLockDay;
    if (userDoc && typeof userDoc.lastAdvanceDay === 'number') return userDoc.lastAdvanceDay;
    return null;
}

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
export function runModeFor({
    lessonIndex, runIdx, furthestLessonIndex, record,
    activeDayCount = 0, lastLockDay = null, unlocked = true, staff = false,
}) {
    if (!unlocked) return 'locked';

    // ⚠️ STAFF ARE NEVER GATED — Jake demonstrates lessons to a child standing
    // next to him. ⚠️⚠️ BUT THE v1.0.0 COMMENT CLAIMED THIS ALSO LET HIM "check
    // this feature without inventing three A🔥 runs first", AND THAT IS BACKWARDS:
    // it makes the feature unobservable from the only account he tests on. He
    // burned an evening on exactly that. Verify on a student account, or add a
    // staff override toggle — do not read this exemption as a test affordance.
    if (staff) return 'graded';

    // ⚠️ THE UNMASTERED CASE IS FIRST ON PURPOSE. Everything below is
    // unreachable for a run the student has not banked four points on, and that
    // ordering is the guarantee, not a shortcut.
    if (!runMastered(record, runIdx)) return 'graded';

    // ⚠️⚠️ THE v1.0.0 EXCEPTION `if (index >= furthestIndex) return 'graded'`
    // IS DELIBERATELY GONE, AND ITS ABSENCE IS HALF THE FIX. It existed so a
    // student mastering the end of their own progress had somewhere left that
    // counts — a real concern when the unit was a LESSON. With runs, an
    // unmastered run in the same lesson is always still graded, so the student
    // always has somewhere to go and the exception buys nothing but the exploit:
    // it is what kept a just-mastered lesson farmable until the student passed a
    // LATER one, which a farming student never does.
    //
    // ⚠️ ONE CONSEQUENCE, UNGUARDED ON PURPOSE: a student who masters every run
    // of the FINAL lesson in the curriculum has nothing graded left. That is a
    // student who has finished the course, and inventing a rule for them would be
    // inventing a rule Jake did not ask for. Flagged, not handled.
    const reachBack = reachBackFor(activeDayCount, lastLockDay);

    // ⚠️⚠️ ZERO IS A SPECIAL CASE AND IT IS THE ONE THAT CLOSES THE EXPLOIT.
    // With no window open at all, NOTHING mastered is graded — including the
    // furthest lesson. v1.0.0 reached this line with `index >= furthest - 0`,
    // which reopened the furthest lesson instantly, so a student who mastered
    // where they stood kept farming it forever. That is the hole Jake hit.
    if (reachBack === 0) return 'practice';

    // ⚠️ AND ABOVE ZERO THE COMPARISON IS UNCHANGED FROM v1.0.0, DELIBERATELY.
    // I first wrote this as `>`, which closes the same hole but silently shifts
    // JAKE'S OWN WORKED EXAMPLE (ROADMAP §10.D) by one lesson: at seven days he
    // specified lessons 26 AND 27 open, and `>` opens only 27.
    // ⚠️ lesson-gate-test.mjs SECTION C CAUGHT THAT, WHICH IS THE ENTIRE REASON
    // THE WORKED EXAMPLE IS IN A HARNESS INSTEAD OF A DOCUMENT. The guard above
    // fixes what `>` was reaching for without touching a number he set.
    if (lessonIndex >= furthestLessonIndex - reachBack) return 'graded';

    return 'practice';
}

// ⚠️ THE LESSON-LEVEL SUMMARY, FOR THE MAP CARD ONLY. A lesson is 'practice'
// only when EVERY run in it is — otherwise the card would tell a student their
// lesson pays nothing while runs inside it still do. The gate that decides
// whether a run counts is runModeFor(); this is a label.
export function lessonModeFor({
    index, furthestIndex, record, runCount = 1,
    activeDayCount = 0, lastLockDay = null, unlocked = true, staff = false,
    // ⚠️ ACCEPTED AND IGNORED. v1.0.0 callers passed `fireGrade` and
    // `lastAdvanceDay`; both are dead here. Left in the signature so a missed
    // call site fails loudly on behaviour rather than silently on a typo.
    fireGrade = null, lastAdvanceDay = null,
}) {
    if (!unlocked) return 'locked';
    if (staff) return 'graded';
    const n = Math.max(1, runCount || 1);
    for (let r = 0; r < n; r++) {
        const mode = runModeFor({
            lessonIndex: index, runIdx: r, furthestLessonIndex: furthestIndex,
            record, activeDayCount,
            lastLockDay: (lastLockDay === null ? lastAdvanceDay : lastLockDay),
            unlocked, staff,
        });
        if (mode === 'graded') return 'graded';
    }
    return 'practice';
}

// The furthest lesson index the student has passed. -1 for a student who has
// passed nothing, so `index >= furthestIndex` is true for lesson 0 and their
// first lesson is graded.
export function furthestIndexOf(lessons, progress) {
    let furthest = -1;
    lessons.forEach((l, i) => { if (progress?.[l.id]?.passed) furthest = i; });
    return furthest;
}
