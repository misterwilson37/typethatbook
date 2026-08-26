// closed-day-cache-test.mjs v1.0.0 — A CLOSED DAY IS READ ONCE, NOT ONCE PER
// PAGE LOAD.
//
// ═══════════════════════════════════════════════════════════════════════════
// ROADMAP 28 — daylog.js v1.7.0
// ═══════════════════════════════════════════════════════════════════════════
//
// Measured 2026-08-26: readWeek() was 20 of 31 reads in a full student session,
// and a Library load cost 5 reads of which 5 were this function — cold and warm
// alike. v1.6.0's memo removed the duplicate WITHIN a load; the cache removes
// the repetition ACROSS loads.
//
// ⚠️⚠️ THE CONTRACT IS logdays.js's: IT MAY OVER-READ AND MUST NEVER
// UNDER-READ. An over-read costs one Firestore read. An under-read shows a
// child fewer minutes than they typed, and an undercount is indistinguishable
// on screen from a light week — Jake's objection to inflation applies in
// reverse. Every case below that could fail in either direction is written to
// fail toward reading.
//
// ⚠️ THE TWO BOUNDARIES THAT CARRY THE RISK, AND WHY THEY ARE WHERE THEY ARE:
//
//   YESTERDAY IS NEVER CACHED. "A closed day never changes" is almost true.
//   The Overnight Rescue (game.js v3.37.0's carryOverPlan()) exists to credit
//   typing to THE DAY IT WAS TYPED ON, and reaches back into yesterday's
//   document. Caching yesterday would hide that correction from the child who
//   earned it, to save exactly one read.
//
//   THE CACHE DIES AT LOCAL MIDNIGHT. A teacher's ⟳ recalc rewrites a past
//   day's document from the TEACHER's browser, which cannot invalidate a
//   student's localStorage. There is no hook to add — an expiry is the only
//   mechanism available, and a school day is the right grain: a recalc reaches
//   the student's HUD by the next school day, while every page load after the
//   first within a day costs nothing.
//
// PARTS
//   A — the saving: a second load re-reads only today and yesterday
//   B — ⚠️ the boundary: yesterday and today are ALWAYS read
//   C — ⚠️ correctness: the cached week total equals the uncached one
//   D — ⚠️ never under-read: expired, foreign-uid, wrong-shape and corrupt
//       caches all fall back to reading
//   E — a partial (`ok:false`) run banks nothing
//   F — one student's cache is never served to another
//
// ⚠️ MUTATION-VERIFIED. Caching yesterday fails B; banking on ok:false fails E;
// dropping the uid check fails F; ignoring the expiry fails D.

import { readWeek, invalidateWeek, clearDayCache, closedDaysOf, weekDatesOf, DAYLOG_VERSION }
    from '../daylog.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m); } };

// A localStorage that behaves like the real one and can be inspected.
const store = new Map();
globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
};

const DATE = '2026-08-26';           // a Wednesday
const WEEK = weekDatesOf(DATE);

function rig({ failDate = null } = {}) {
    const seen = [];
    const getDoc = async (ref) => {
        const date = String(ref.__id).split('_').pop();
        seen.push(date);
        if (date === failDate) throw new Error('simulated read failure');
        return { exists: () => true, data: () => ({ date, seconds: 60, chars: 300, mistakes: 1 }) };
    };
    return { seen, io: { db: {}, doc: (_d, _c, id) => ({ __id: id }), getDoc } };
}

// Each call is its own page load: drop the in-memory memo, keep localStorage.
const load = async (r, uid, dateStr = DATE) => {
    invalidateWeek(uid);
    return readWeek({ ...r.io, uid, dateStr, ledger: null });
};

const reset = (uid) => { clearDayCache(uid); invalidateWeek(uid); };

console.log(`\ndaylog.js v${DAYLOG_VERSION}\n`);

// ─── A. THE SAVING ────────────────────────────────────────────────────────
console.log('─── A. a second page load re-reads only the live days ───');
{
    reset('u1');
    const r = rig();
    await load(r, 'u1');
    const first = r.seen.length;
    ok(first === WEEK.length, `A1 the first load reads the whole week (got ${first})`);

    r.seen.length = 0;
    await load(r, 'u1');
    ok(r.seen.length < first,
       `A2 ⭐ the second load reads FEWER days (got ${r.seen.length}, was ${first})`);

    const closed = closedDaysOf(WEEK, DATE);
    ok(closed.length > 0, 'A3 this week has closed days to cache at all');
    ok(closed.every(d => !r.seen.includes(d)),
       `A4 ⭐⭐ no closed day is re-read (re-read: ${r.seen.filter(d => closed.includes(d)).join(',') || 'none'})`);
}

// ─── B. THE BOUNDARY ──────────────────────────────────────────────────────
console.log('\n─── B. ⚠️⚠️ today and yesterday are ALWAYS read ───');
{
    reset('u2');
    const r = rig();
    await load(r, 'u2');
    r.seen.length = 0;
    await load(r, 'u2');

    const yest = WEEK[WEEK.indexOf(DATE) - 1];
    ok(r.seen.includes(DATE), 'B1 ⚠️ today is read on every load — it is still being written');
    ok(r.seen.includes(yest),
       `B2 ⚠️⚠️ YESTERDAY is read on every load — the Overnight Rescue writes back into it (${yest})`);
    ok(!closedDaysOf(WEEK, DATE).includes(yest),
       'B3 ⚠️ closedDaysOf() excludes yesterday, not just today');
    ok(!closedDaysOf(WEEK, DATE).includes(DATE), 'B4 and excludes today');
}

// ─── C. CORRECTNESS ───────────────────────────────────────────────────────
console.log('\n─── C. ⚠️ a cached week totals the same as an uncached one ───');
{
    reset('u3');
    const r = rig();
    const cold = await load(r, 'u3');
    const warm = await load(r, 'u3');
    ok(cold.week.seconds === warm.week.seconds,
       `C1 ⚠️⚠️ week seconds identical (${cold.week.seconds} vs ${warm.week.seconds})`);
    ok(cold.week.chars === warm.week.chars, 'C2 week chars identical');
    ok(cold.week.mistakes === warm.week.mistakes, 'C3 week mistakes identical');
    ok(warm.ok === true, 'C4 ⚠️ a cached day is a known VALUE, not a failed read — ok stays true');
    for (const d of closedDaysOf(WEEK, DATE)) {
        ok(warm.byDate[d] && warm.byDate[d].seconds === cold.byDate[d].seconds,
           `C5 ${d} folds to the same total from cache as from the read`);
    }
}

// ─── D. NEVER UNDER-READ ──────────────────────────────────────────────────
console.log('\n─── D. ⚠️⚠️ a cache that cannot be trusted is not used ───');
{
    const key = 'ttbDayCache:u4';
    const closed = closedDaysOf(WEEK, DATE);

    // Expired: the recalc escape hatch. Without this a teacher's ⟳ could never
    // reach the student's HUD at all.
    reset('u4');
    let r = rig();
    await load(r, 'u4');
    const c = JSON.parse(store.get(key));
    store.set(key, JSON.stringify({ ...c, exp: Date.now() - 1 }));
    r = rig();
    await load(r, 'u4');
    ok(closed.every(d => r.seen.includes(d)),
       'D1 ⚠️⚠️ an EXPIRED cache is discarded and every closed day is read again');

    // Older shape — a field could have changed meaning between versions.
    reset('u4'); r = rig(); await load(r, 'u4');
    const c2 = JSON.parse(store.get(key));
    store.set(key, JSON.stringify({ ...c2, v: 0 }));
    r = rig(); await load(r, 'u4');
    ok(closed.every(d => r.seen.includes(d)), 'D2 ⚠️ an older cache SHAPE is discarded');

    // Corrupt — must not throw and must not silently zero a day.
    reset('u4');
    store.set(key, '{not json at all');
    r = rig();
    let threw = null;
    try { await load(r, 'u4'); } catch (e) { threw = e; }
    ok(!threw, 'D3 ⚠️ a corrupt cache never throws into a page load');
    ok(closed.every(d => r.seen.includes(d)), 'D4 ⚠️⚠️ and every closed day is read for real');
}

// ─── E. A PARTIAL RUN BANKS NOTHING ───────────────────────────────────────
console.log('\n─── E. ⚠️ nothing is banked from an ok:false week ───');
{
    reset('u5');
    const closed = closedDaysOf(WEEK, DATE);
    let r = rig({ failDate: DATE });          // today's read throws
    const bad = await load(r, 'u5');
    ok(bad.ok === false, 'E1 the run really did report ok:false');

    r = rig();
    await load(r, 'u5');
    ok(closed.every(d => r.seen.includes(d)),
       'E2 ⚠️⚠️ the next load still reads every closed day — a faulted run banks nothing');
}

// ─── F. ONE STUDENT'S CACHE IS NEVER ANOTHER'S ────────────────────────────
console.log('\n─── F. ⚠️ two students, one browser profile ───');
{
    reset('alice'); reset('bob');
    const closed = closedDaysOf(WEEK, DATE);
    let r = rig();
    await load(r, 'alice');
    await load(r, 'alice');                    // alice is now warm

    r = rig();
    await load(r, 'bob');
    ok(closed.every(d => r.seen.includes(d)),
       'F1 ⚠️⚠️ bob reads every closed day for himself — alice\u2019s cache is not his');

    // And a cache whose stored uid disagrees with its key is refused outright.
    reset('carol');
    r = rig(); await load(r, 'carol');
    const cc = JSON.parse(store.get('ttbDayCache:carol'));
    store.set('ttbDayCache:carol', JSON.stringify({ ...cc, uid: 'someone-else' }));
    r = rig(); await load(r, 'carol');
    ok(closed.every(d => r.seen.includes(d)),
       'F2 ⚠️ a cache whose uid does not match is discarded, not trusted by key alone');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
