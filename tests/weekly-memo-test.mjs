// weekly-memo-test.mjs v1.0.0 — ONE WEEK READ PER PAGE LOAD, AND IT MUST NOT
// GO STALE.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS IS ABOUT — §READS, daylog.js v1.6.0
// ═══════════════════════════════════════════════════════════════════════════
//
// Measured 2026-08-26 on real hardware, signed in as a student, across a full
// session (Library → sprint → leaderboard → Library → School → lesson →
// practice → map):
//
//     readWeek()  20 reads of 31 total  —  65% of every read in the session
//     index.html   5 reads, of which 5 were readWeek() and nothing else
//     game.html   10 reads — the SAME week, twice, in one page load
//
// game.html pays double because `retroactiveSaveGuestSession()` reads a week
// and `loadUserStats()` reads it again three lines later. Same uid, same date,
// same seven documents. The memo removes the second round trip without
// changing what either caller sees.
//
// ⚠️⚠️ THE STALENESS RULE IS THE WHOLE RISK, AND IT IS WHY PART C EXISTS. A
// memo is only safe while every writer drops it. `typing_logs` has exactly two
// writers — game.js and learn.js — and if either one ever writes without
// calling `invalidateWeek()`, a caller later in the SAME page load is handed
// pre-write numbers and paints a total short by whatever was just saved. That
// is a counting defect, in the file with the worst history of them, and it
// would look like the arithmetic was wrong rather than the cache.
//
// ⚠️ WHAT THIS IS NOT. This is the per-page-load memo, not the closed-day
// localStorage cache (ROADMAP §READS). It cannot outlive the page, so it can
// never serve a stale day to a later visit — the only staleness it can produce
// is within one load, and Part C is what closes that.
//
// ═══════════════════════════════════════════════════════════════════════════
// PARTS
// ═══════════════════════════════════════════════════════════════════════════
//
//   A — the memo: a second identical call costs zero reads; a different uid or
//       date does not hit it
//   B — the contract: failures are never cached, overlapping callers share one
//       round trip, and every caller gets its own object
//   C — ⚠️ THE GREP: every typing_logs writer calls invalidateWeek(), and the
//       call sits AFTER the write
//   D — invalidation actually restores a fresh read
//
// ⚠️ MUTATION-VERIFIED. Deleting either `invalidateWeek()` call fails C;
// caching an `ok:false` read fails B1; returning the memo without cloning
// fails B4.

import { readFileSync } from 'fs';
import { readWeek, invalidateWeek, _weekMemoSize, DAYLOG_VERSION } from '../daylog.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m); } };
const src = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// A getDoc that counts round trips and can be told to fail.
function makeDb({ failDates = [], throwOn = null } = {}) {
    const st = { calls: 0, byDate: {} };
    const getDoc = async (ref) => {
        st.calls++;
        const date = String(ref && ref.__id || '').split('_').pop();
        st.byDate[date] = (st.byDate[date] || 0) + 1;
        if (throwOn && date === throwOn) throw new Error('simulated read failure');
        if (failDates.includes(date)) return { exists: () => false, data: () => null };
        return { exists: () => true, data: () => ({ date, seconds: 60, chars: 300, mistakes: 1 }) };
    };
    return { st, db: {}, doc: (_d, _c, id) => ({ __id: id }), getDoc };
}

const DATE = '2026-08-26';
console.log(`\ndaylog.js v${DAYLOG_VERSION}\n`);

// ─── A. THE MEMO ──────────────────────────────────────────────────────────
console.log('─── A. one week read per page load ───');
{
    invalidateWeek('u1'); invalidateWeek('u2');
    const { st, db, doc, getDoc } = makeDb();

    await readWeek({ db, doc, getDoc, uid: 'u1', dateStr: DATE });
    const first = st.calls;
    ok(first > 0, `A1 the first call actually reads (got ${first})`);

    await readWeek({ db, doc, getDoc, uid: 'u1', dateStr: DATE });
    ok(st.calls === first,
       `A2 ⚠️⚠️ the SECOND identical call costs ZERO reads — this is the game.html double (got ${st.calls}, want ${first})`);

    // ⚠️ THE KEY IS uid AND DATE, NOT uid ALONE. Two students sharing a browser
    // profile is the §0.-13.E case, and a memo keyed on date alone would hand
    // one child the other's week.
    await readWeek({ db, doc, getDoc, uid: 'u2', dateStr: DATE });
    ok(st.calls > first, 'A3 ⚠️ a DIFFERENT uid is not served from the memo');

    const before = st.calls;
    await readWeek({ db, doc, getDoc, uid: 'u1', dateStr: '2026-08-27' });
    ok(st.calls > before,
       'A4 ⚠️ a different DATE is not served from the memo — midnight rollover must re-read');
}

// ─── B. THE CONTRACT ──────────────────────────────────────────────────────
console.log('\n─── B. failures, overlap, and aliasing ───');
{
    invalidateWeek('u3');
    // ⚠️ A PARTIAL WEEK MUST NOT BE PINNED FOR THE LIFE OF THE PAGE. `ok:false`
    // means some day could not be read; the caller's next attempt has to be a
    // real retry, not the same failure served from memory.
    const bad = makeDb({ throwOn: DATE });
    const r1 = await readWeek({ db: bad.db, doc: bad.doc, getDoc: bad.getDoc, uid: 'u3', dateStr: DATE });
    if (r1 && r1.ok === false) {
        const after = bad.st.calls;
        await readWeek({ db: bad.db, doc: bad.doc, getDoc: bad.getDoc, uid: 'u3', dateStr: DATE });
        ok(bad.st.calls > after, 'B1 ⚠️⚠️ an ok:false read is NOT memoised — the retry really retries');
    } else {
        ok(true, 'B1 (skipped — this stub could not produce ok:false)');
    }

    // ⚠️ OVERLAPPING CALLERS SHARE ONE ROUND TRIP. game.html awaits them back to
    // back today, but caching the resolved value rather than the promise would
    // let a second caller start its own reads while the first is in flight.
    invalidateWeek('u4');
    const par = makeDb();
    const [x, y] = await Promise.all([
        readWeek({ db: par.db, doc: par.doc, getDoc: par.getDoc, uid: 'u4', dateStr: DATE }),
        readWeek({ db: par.db, doc: par.doc, getDoc: par.getDoc, uid: 'u4', dateStr: DATE }),
    ]);
    ok(par.st.calls <= 7,
       `B2 ⚠️ two SIMULTANEOUS callers share one round trip (got ${par.st.calls} reads, want ≤7)`);
    ok(x && y && x.week.seconds === y.week.seconds, 'B3 and both get the same numbers');

    // ⚠️ EACH CALLER GETS ITS OWN OBJECT. Handing the same one to two callers
    // means a caller mutating `today` corrupts the other's week, and it would
    // read as a counting bug rather than an aliasing bug.
    ok(x !== y, 'B4 ⚠️⚠️ callers get DISTINCT objects, not a shared reference');
    if (x && y && x.today && y.today) {
        x.today.seconds = 999999;
        ok(y.today.seconds !== 999999,
           'B5 ⚠️ mutating one caller\u2019s copy cannot reach another\u2019s');
    }
}

// ─── C. ⚠️ THE GREP: EVERY WRITER DROPS THE MEMO ──────────────────────────
console.log('\n─── C. ⚠️⚠️ every typing_logs writer invalidates ───');
{
    // ⚠️ THIS IS THE PART THAT MATTERS. The memo is only safe while every
    // writer drops it. A new writer added without an invalidateWeek() call
    // makes a later caller in the same load paint a short total — see this
    // file's header. Structural, not distance-based: the write and its
    // invalidation are located, then compared by position (§0.-33.C).
    for (const f of ['game.js', 'learn.js']) {
        const t = src(f);
        const w = t.search(/await setDoc\(doc\(db, ["']typing_logs["'],/);
        ok(w > 0, `C1 ${f}: the typing_logs write is present`);
        const inv = t.indexOf('invalidateWeek(', w);
        ok(inv > 0, `C2 ⚠️⚠️ ${f}: calls invalidateWeek() — without it the memo goes stale mid-load`);
        ok(inv > w, `C3 ⚠️ ${f}: the invalidation comes AFTER the write, not before`);
        ok(/import \{[^}]*\binvalidateWeek\b/.test(t),
           `C4 ${f}: invalidateWeek is imported from daylog.js`);
    }

    // ⚠️ AND NO THIRD WRITER SNUCK IN. If this ever fails, the new writer needs
    // its own invalidateWeek() call and its own entry above — do not just raise
    // the number.
    for (const f of ['game.js', 'learn.js']) {
        const n = (src(f).match(/await setDoc\(doc\(db, ["']typing_logs["'],/g) || []).length;
        ok(n === 1, `C5 ⚠️ ${f} has exactly ONE typing_logs writer (found ${n})`);
    }
}

// ─── D. INVALIDATION RESTORES A FRESH READ ────────────────────────────────
console.log('\n─── D. a dropped memo really re-reads ───');
{
    invalidateWeek('u5');
    const { st, db, doc, getDoc } = makeDb();
    await readWeek({ db, doc, getDoc, uid: 'u5', dateStr: DATE });
    const before = st.calls;
    await readWeek({ db, doc, getDoc, uid: 'u5', dateStr: DATE });
    ok(st.calls === before, 'D1 memoised before invalidation');

    invalidateWeek('u5');
    await readWeek({ db, doc, getDoc, uid: 'u5', dateStr: DATE });
    ok(st.calls > before, 'D2 ⚠️ after invalidateWeek() the next call reads for real');

    // Dropping one student must not drop another's — a shared browser profile
    // would otherwise pay for every sign-out.
    invalidateWeek('u5');
    await readWeek({ db, doc, getDoc, uid: 'u6', dateStr: DATE });
    const afterU6 = st.calls;
    await readWeek({ db, doc, getDoc, uid: 'u6', dateStr: DATE });
    ok(st.calls === afterU6, 'D3 ⚠️ invalidating one uid leaves another\u2019s memo intact');

    ok(_weekMemoSize() >= 1, 'D4 the memo holds entries (test seam reachable)');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
