// real-sessions-fixture.mjs v1.0.0 — THE ONLY REAL PRODUCTION SESSION DATA IN
//                                    THIS REPOSITORY. Do not delete it.
//
// ⚠️ WHY THIS FILE EXISTS. These documents lived inside `union-clock-test.mjs`,
// which Round 23 deleted along with the reconcile tool it tested. ROADMAP item 2
// said in as many words: *lift the real session documents out of
// union-clock-test.mjs first; item 1 needs them.* This is that lift, done before
// the deletion rather than regretted after it.
//
// ⚠️ JAKE'S RULE 10 IS THE REASON TO CARE. "No number becomes an authoritative
// value until a harness exists that FAILS against real production data before
// the fix and passes after." Synthetic records cannot serve: every defect this
// project has had in `typing_sessions` — the overlap, the negative character
// counts, the duplicate rollups — is a relation BETWEEN records, and a harness
// that invents its own records invents them consistent. Round 18's ten-document
// spot check passed through the corruption for exactly that reason.
//
// ⚠️ THIS IS NOT STUDENT-IDENTIFYING DATA AND MUST NOT BECOME ANY. No uid, no
// name, no email, no class. One anonymous student's timings on one morning.
// Anything added here follows the same rule.
//
// ⚠️ MINUTE RESOLUTION, AND THAT IS A REAL LIMIT. Transcribed from the
// drill-down, which renders `at` to the minute; the stored values carry seconds.
// The magnitudes are approximate. THE ORDER OF THE THREE NUMBERS IS NOT, and
// that ordering is the whole finding — see below.

export const FIXTURE_VERSION = '1.0.0';

/** The date these were typed. */
export const REAL_DATE = '2026-08-18';

const D = REAL_DATE + 'T';
/**
 * `at` is the END of a stretch of typing, not its start. Reading it as a start
 * shifts every interval forward by its own duration — a defect that leaves an
 * arithmetic check green and destroys any conclusion drawn about overlap.
 */
export const sp = (hhmmss, secs) =>
    ({ at: D + (hhmmss.length === 5 ? hhmmss + ':00' : hhmmss), seconds: secs });

// ─── One student, 2026-08-18, four rollups covering one morning ─────────────
//
// ⚠️ A AND D OVERLAP IN WALL-CLOCK TIME and A and B were stamped out of order
// against the stretches they cover. A student cannot type two different sprints
// in the same minute. This is the day that produced HANDOFF §0.0 and then §0.-1.

/** Stamped 10:25; covers 10:47–11:16. */
export const docA = { seconds: 891, source: 'school', sprints: [
    sp('10:47', 9), sp('10:49', 53), sp('10:55', 34), sp('10:56', 40), sp('10:59', 127),
    sp('10:59', 39), sp('11:02', 94), sp('11:03', 14), sp('11:05', 116), sp('11:16', 365)] };

/** Stamped 10:40; covers 10:27–10:38. */
export const docB = { seconds: 486, source: 'school', sprints: [
    sp('10:27', 51), sp('10:29', 106), sp('10:32', 113), sp('10:33', 26),
    sp('10:34', 79), sp('10:36', 90), sp('10:38', 21)] };

export const docC = { seconds: 245, source: 'school', sprints: [
    sp('10:43', 105), sp('10:45', 107), sp('10:46', 33)] };

/** Library; covers 10:48–10:55 — inside document A's stretch. */
export const docD = { seconds: 319, source: 'library', sprints: [
    sp('10:48', 32), sp('10:49', 23), sp('10:50', 49), sp('10:51', 38),
    sp('10:53', 94), sp('10:54', 39), sp('10:55', 44)] };

export const REAL_ROLLUPS = [docA, docB, docC, docD];

/** What the four rollups sum to: 1,941s — 32m 21s. */
export const REAL_SESSION_SUM = 1941;

/** What `typing_logs` stored for that student that day: 807s — 13m 27s. */
export const REAL_LOG_SECONDS = 807;

// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THE FINDING THIS DATA CARRIES, WRITTEN DOWN SO IT CANNOT BE LOST WITH
// THE HARNESS THAT USED TO ASSERT IT
// ═══════════════════════════════════════════════════════════════════════════
//
// The rollups overlap, and Round 19 concluded from that the session record was
// inflated and `typing_logs` was the conservative number to grade from. Round 20
// weighed it and the arrow was backwards: **overlap accounts for roughly two
// minutes of a nineteen-minute gap.** The other seventeen minutes was
// `typing_logs` UNDERCOUNTING — §3.1, the cross-mode overwrite, closed in
// Round 22 and live from 2026-08-22.
//
// So: `union < sum`, and `log < union` by a wide margin. Both halves matter.
// A future round that finds the overlap again and stops there will re-derive
// Round 19's conclusion and it will be wrong for the same reason.
//
// ⚠️ THE ONE THING THIS DATA CANNOT TELL YOU. It is four documents that
// ARRIVED. It says nothing about the sprints that never reached the collection
// at all, which is ROADMAP item 1 — the five-second floor, the unit that never
// closes, the failed upload, and (Round 23) the queue destroyed by the next
// student to sign in on that Chromebook. Those leave no record here to inspect,
// which is exactly why item 1 has been the hardest thing in the roadmap to
// measure.

// ─── A second real case, from ROADMAP item 1 ────────────────────────────────
//
// ⚠️ NOT ROLLUPS — A SUMMARY. Jake's Library drill-down for one student on
// 2026-08-19 showed a stored day of 12m 4s / 1,890 characters against a SINGLE
// surviving rollup of 3m 47s / 521 characters.
//
// ⚠️ THE STORED FIGURE IS THE CORRECT ONE, and the arithmetic is what says so:
// 1,890 characters in 12m 4s is about 31 WPM, and the one surviving rollup
// measured 28 WPM. The rates agree. Roughly eight minutes of real typing
// produced no session record at all — the day counter is right and the evidence
// behind it is missing, which is the opposite shape from the 08-18 case above
// and is why the two must not be reasoned about together.
export const ITEM_ONE_CASE = {
    date: '2026-08-19',
    source: 'library',
    storedLogSeconds: 724,      // 12m 4s
    storedLogChars: 1890,
    survivingRollups: [{ seconds: 227, chars: 521, wpm: 28 }],   // 3m 47s
    /** Stored day implies ~31 WPM; the surviving rollup measured 28. */
    impliedWpmFromLog: Math.round((1890 / 5) / (724 / 60)),
};
