// adopt-date-test.mjs v1.0.0 — THE EVENING GUEST: an adopted sprint must keep
// the date the student typed it on.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE DEFECT THIS WAS WRITTEN AGAINST — session-log.js v1.5.0 and earlier
// ═══════════════════════════════════════════════════════════════════════════
//
// A guest's sprints go into GUEST_QUEUE_UID's slot and are handed to the real
// account at sign-in by `sessionLogAdopt(uid, sessionLogTake(GUEST_QUEUE_UID))`.
// Those records were pushed by game.js `logSession()` / learn.js `logRun()`,
// which stamp
//
//     date: getLocalDateStr()          ← the student's own date. CORRECT.
//     at:   new Date().toISOString()   ← UTC.
//
// …and `sessionLogAdopt()` then threw the first one away and recomputed it from
// the second: `at.slice(0, 10)`. In America/Chicago that is TOMORROW's date
// from 7:00 PM local onward (6:00 PM outside daylight saving).
//
// ⚠️ SO A CHILD READING AT HOME AFTER DINNER HAD THEIR EVENING SPLIT ACROSS TWO
// DAYS: the daily log — written by the merge, in local terms — landed on today,
// and the session record for the same minutes landed on tomorrow. The drill-down
// under today is then short by exactly one sprint while today's clock is right,
// which is precisely the shape of ROADMAP item 1, arrived at from a completely
// different direction.
//
// It also blinds `sessionLogPendingSeconds(uid, dateStr)`, which matches on
// `date`: the seconds are in the queue and the projection cannot see them, so a
// flush between two unit boundaries writes a total short by that sprint.
//
// ⚠️ WHY NOBODY CAUGHT IT AT SCHOOL. Ellis runs 8am–3pm Central, where the local
// and UTC dates always agree. Every classroom test of the guest handover passes
// on a build with this defect. It is a Library-at-home defect, and the only
// reason it is visible at all is that TypeThatBook is used in the evening.
//
// ⚠️ WHAT THIS HARNESS DOES NOT PROVE. It does not explain the missing
// 2026-08-20 2:03 PM guest record in Jake's test — 2:03 PM Central is 19:03 UTC
// on the same date, so this defect cannot have been the cause of THAT one.
// Two different faults on one path. Do not close ROADMAP item 1 on this.
//
// ═══════════════════════════════════════════════════════════════════════════
// PARTS
// ═══════════════════════════════════════════════════════════════════════════
//
//   A — the evening guest: a record carrying its own date keeps it through
//       take + adopt, on both sides of the UTC midnight
//   B — the projection can still see those seconds under the right day
//   C — the LEGACY path is untouched: an undated record still derives from
//       `at`, and an undated record with no `at` still takes fallbackDate
//   D — a malformed `date` is not propagated; it falls back rather than
//       poisoning the record
//
// ⚠️ MUTATION-VERIFIED. Against session-log.js v1.5.0 this harness reports
// 4 failing across Parts A, B and D. If you are reading it green, check that
// sessionLogAdopt() still prefers `r.date`.

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };
const eq = (msg, got, want) => ok(got === want, `${msg} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// ─── a localStorage that behaves like the real one and never throws ─────────
const store = new Map();
globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); },
};

const KEY = 'ttb_sessionq_v1';
const reset = () => { store.clear(); };
const queued = uid => {
    const raw = store.get(KEY);
    if (!raw) return [];
    const slot = JSON.parse(raw).owners[uid];
    return (slot && slot.records) ? slot.records : [];
};

const mod = await import('../session-log.js');

console.log(`\nsession-log.js v${mod.SESSION_LOG_VERSION}\n`);

const GUEST = mod.GUEST_QUEUE_UID;

// A sprint as game.js logSession() actually builds one: local `date`, UTC `at`.
function sprint(localDate, utcAt, seconds = 66) {
    return {
        date: localDate,
        at: utcAt,
        seconds, chars: seconds * 5, mistakes: 3, wpm: 60, accuracy: 97,
        source: 'library', label: 'aesops fables', detail: '1',
    };
}

// ─── A. the evening guest ──────────────────────────────────────────────────
console.log('─── A. a record that knows its own date keeps it ───');
{
    // 8:30 PM Thursday in Hendersonville (CDT, UTC-5) is 01:30Z on Friday.
    reset();
    mod.sessionLogPush(GUEST, sprint('2026-08-20', '2026-08-21T01:30:00.000Z'));
    mod.sessionLogAdopt('realUid', mod.sessionLogTake(GUEST), '2026-08-20');
    const rec = queued('realUid')[0];
    eq('A1 ⚠️ the evening sprint is still filed under the day it was typed',
       rec && rec.date, '2026-08-20');
    eq('A2 and the UTC instant is preserved untouched',
       rec && rec.at, '2026-08-21T01:30:00.000Z');
    eq('A3 the guest slot is empty afterwards', mod.sessionLogPending(GUEST), 0);

    // The daytime case, which was always correct — it must stay correct.
    reset();
    mod.sessionLogPush(GUEST, sprint('2026-08-20', '2026-08-20T19:03:00.000Z'));
    mod.sessionLogAdopt('realUid', mod.sessionLogTake(GUEST), '2026-08-20');
    eq('A4 the school-hours sprint is unchanged', queued('realUid')[0].date, '2026-08-20');

    // And the far side: a student typing at 00:30 local in a UTC+ timezone,
    // whose UTC date is YESTERDAY. The bug is symmetric; so is the fix.
    reset();
    mod.sessionLogPush(GUEST, sprint('2026-08-21', '2026-08-20T22:30:00.000Z'));
    mod.sessionLogAdopt('realUid', mod.sessionLogTake(GUEST), '2026-08-21');
    eq('A5 ⚠️ and it works on the other side of midnight too',
       queued('realUid')[0].date, '2026-08-21');
}

// ─── B. the projection ─────────────────────────────────────────────────────
console.log('\n─── B. sessionLogPendingSeconds() can still see the seconds ───');
{
    reset();
    mod.sessionLogPush(GUEST, sprint('2026-08-20', '2026-08-21T01:30:00.000Z', 66));
    mod.sessionLogAdopt('realUid', mod.sessionLogTake(GUEST), '2026-08-20');
    eq('B1 ⚠️ 66 unflushed seconds are visible for the day they belong to',
       mod.sessionLogPendingSeconds('realUid', '2026-08-20'), 66);
    eq('B2 and none of them leak onto the next day',
       mod.sessionLogPendingSeconds('realUid', '2026-08-21'), 0);
}

// ─── C. the legacy path is untouched ───────────────────────────────────────
console.log('\n─── C. the one-time ttb_wal_v2 migration still behaves ───');
{
    // No `date` at all — this is what the function was originally written for.
    reset();
    mod.sessionLogAdopt('realUid', [{
        at: '2026-08-21T01:30:00.000Z',
        seconds: 40, chars: 200, mistakes: 1, wpm: 60, accuracy: 99,
        source: 'library', label: 'oz',
    }], '2026-08-20');
    eq('C1 an undated legacy record still derives its date from `at`',
       queued('realUid')[0].date, '2026-08-21');

    // No `date` and no `at` — fallbackDate is the last resort.
    reset();
    mod.sessionLogAdopt('realUid', [{
        seconds: 40, chars: 200, mistakes: 1, wpm: 60, accuracy: 99,
        source: 'library', label: 'oz',
    }], '2026-08-20');
    eq('C2 with no `at` either, fallbackDate is used', queued('realUid')[0].date, '2026-08-20');

    // Nothing to date it with at all: refused, not guessed.
    reset();
    eq('C3 a record with no date, no `at` and no fallback is refused',
       mod.sessionLogAdopt('realUid', [{ seconds: 40, chars: 200 }], ''), 0);

    // The five-second floor still applies to adopted records.
    reset();
    eq('C4 the floor still refuses a 3-second standalone record',
       mod.sessionLogAdopt('realUid', [sprint('2026-08-20', '2026-08-20T19:00:00.000Z', 3)], '2026-08-20'), 0);
}

// ─── D. a malformed date is not propagated ─────────────────────────────────
console.log('\n─── D. garbage in `date` falls back rather than propagating ───');
{
    reset();
    mod.sessionLogAdopt('realUid', [{
        date: 'yesterday', at: '2026-08-21T01:30:00.000Z',
        seconds: 40, chars: 200, mistakes: 1, wpm: 60, accuracy: 99,
        source: 'library', label: 'oz',
    }], '2026-08-20');
    eq('D1 a `date` that is not YYYY-MM-DD is ignored', queued('realUid')[0].date, '2026-08-21');

    reset();
    mod.sessionLogAdopt('realUid', [{
        date: 42, at: '',
        seconds: 40, chars: 200, mistakes: 1, wpm: 60, accuracy: 99,
        source: 'library', label: 'oz',
    }], '2026-08-20');
    eq('D2 a non-string `date` falls through to fallbackDate',
       queued('realUid')[0].date, '2026-08-20');
}

console.log(`\n${pass} passing, ${fail} failing.`);
process.exit(fail ? 1 : 0);
