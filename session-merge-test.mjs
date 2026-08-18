// session-merge-test.mjs v1.0.0 — the two things Round 12 changed, tested
// against the code that actually ships.
//
// PART A — mergeGuestStats(), lifted from BOTH game.js and learn.js by
// brace-matching and run in a bare sandbox. This is the function that doubled a
// student's week on 2026-08-18, and there are two copies of it because neither
// page controller can import the other. ⚠️ THE HARNESS RUNS BOTH AND ASSERTS
// THEY AGREE. A test that only checked one would let them drift, which is the
// failure mode that produced the defect in the first place.
//
// PART B — session-log.js, imported for real. It is importable BECAUSE its
// Firestore surface is injected rather than imported, which is the property that
// lets a test drive it with a fake addDoc and no network.
//
// ⚠️ chunktest.mjs REIMPLEMENTS the old game.js rollup rather than reading it,
// so it kept passing after the code moved to session-log.js in v3.22.0. It is
// now testing a copy of deleted code. Part B is its replacement; see HANDOFF §5.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };

// ─── lift a function body out of a source file by brace matching ────────────
function lift(src, name) {
    const start = src.indexOf('function ' + name + '(');
    if (start < 0) return null;
    let depth = 0, i = src.indexOf('{', start);
    const from = i;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) break; }
    }
    return src.slice(start, i + 1);
}

const gameSrc  = readFileSync(new URL('./game.js',  import.meta.url), 'utf8');
const learnSrc = readFileSync(new URL('./learn.js', import.meta.url), 'utf8');

function makeMerger(src, label) {
    const body = lift(src, 'mergeGuestStats');
    ok(!!body, `${label}: mergeGuestStats() exists`);
    if (!body) return null;
    // captureStatsBaseline is called at the end; supply a real one so the
    // post-merge baseline is genuinely re-taken.
    return (stats, baseline, server, dateStr, weekStart) => {
        const fn = new Function('statsData', 'statsBaseline', 'captureStatsBaseline', `
            ${body}
            return mergeGuestStats;
        `);
        const cap = () => { for (const k of Object.keys(baseline)) baseline[k] = stats[k] || 0; };
        fn(stats, baseline, cap)(server, dateStr, weekStart);
        return stats;
    };
}

const mergers = [
    ['game.js',  makeMerger(gameSrc,  'game.js')],
    ['learn.js', makeMerger(learnSrc, 'learn.js')],
].filter(m => m[1]);

const TODAY = '2026-08-18';
const WEEK  = '2026-08-17';
const blank = () => ({ secondsToday:0, charsToday:0, mistakesToday:0,
                       secondsWeek:0, charsWeek:0, mistakesWeek:0 });

console.log('\n─── A. mergeGuestStats ───');
for (const [label, merge] of mergers) {

    // ⚠️ THE REGRESSION. THIS IS THE BUG, EXACTLY AS IT HAPPENED.
    // Student signed in, page load seeded the week at 1206s (20m06s from the
    // previous day). Token expired mid-period. They typed 180 more seconds, so
    // the live week reads 1386. They sign back in. The stats document still
    // says lastDate = yesterday (it is only written on a final flush), so the
    // DAY branch must not fire and the WEEK branch must.
    {
        const stats = { ...blank(), secondsToday: 180, secondsWeek: 1386,
                        lastDate: TODAY, weekStart: WEEK };
        const base  = { ...blank(), secondsWeek: 1206 };
        const server = { lastDate: '2026-08-17', weekStart: WEEK,
                         secondsToday: 1206, secondsWeek: 1206 };
        merge(stats, base, server, TODAY, WEEK);
        ok(stats.secondsWeek === 1386,
           `${label}: EXPIRED SESSION — week stays 1386, does not double to 2592 (got ${stats.secondsWeek})`);
        ok(stats.secondsToday === 180,
           `${label}: expired session — day untouched, server day is a different date (got ${stats.secondsToday})`);
    }

    // A genuine guest whose account already has time from earlier in the day on
    // another machine. Baseline is zero because nothing was ever read from the
    // server into these counters. The guest's 1200s must ADD to the stored 600s.
    // ⚠️ THIS IS THE CASE max() WOULD SILENTLY DESTROY — it would keep 1200.
    {
        const stats = { ...blank(), secondsToday: 1200, secondsWeek: 1200,
                        lastDate: TODAY, weekStart: WEEK };
        const base  = blank();
        const server = { lastDate: TODAY, weekStart: WEEK,
                         secondsToday: 600, secondsWeek: 600 };
        merge(stats, base, server, TODAY, WEEK);
        ok(stats.secondsToday === 1800,
           `${label}: TRUE GUEST — 1200 guest + 600 stored = 1800, nothing lost (got ${stats.secondsToday})`);
        ok(stats.secondsWeek === 1800,
           `${label}: true guest — week adds too (got ${stats.secondsWeek})`);
    }

    // A stored counter from a DIFFERENT week must contribute nothing.
    {
        const stats = { ...blank(), secondsWeek: 300, lastDate: TODAY, weekStart: WEEK };
        const base  = blank();
        const server = { lastDate: TODAY, weekStart: '2026-08-10', secondsWeek: 99999 };
        merge(stats, base, server, TODAY, WEEK);
        ok(stats.secondsWeek === 300,
           `${label}: last week's stored counter contributes nothing (got ${stats.secondsWeek})`);
    }

    // The floor. A merge may never return LESS than the browser already shows.
    {
        const stats = { ...blank(), secondsToday: 500, lastDate: TODAY, weekStart: WEEK };
        const base  = { ...blank(), secondsToday: 900 };   // baseline > live: rolled over
        const server = { lastDate: TODAY, weekStart: WEEK, secondsToday: 0 };
        merge(stats, base, server, TODAY, WEEK);
        ok(stats.secondsToday >= 500,
           `${label}: result never drops below the live counter (got ${stats.secondsToday})`);
    }

    // Idempotence. Signing in twice in a row must not compound, because
    // mergeGuestStats() re-takes the baseline on its way out.
    {
        const stats = { ...blank(), secondsWeek: 1386, lastDate: TODAY, weekStart: WEEK };
        const base  = { ...blank(), secondsWeek: 1206 };
        const server = { lastDate: '2026-08-17', weekStart: WEEK, secondsWeek: 1206 };
        merge(stats, base, server, TODAY, WEEK);
        const once = stats.secondsWeek;
        merge(stats, base, server, TODAY, WEEK);
        ok(stats.secondsWeek === once,
           `${label}: merging twice is idempotent (${once} then ${stats.secondsWeek})`);
    }
}

// ⚠️ The two copies must agree, or the page a student happens to open first
// decides what their week says.
if (mergers.length === 2) {
    const run = (merge) => {
        const stats = { ...blank(), secondsToday: 240, secondsWeek: 1500,
                        lastDate: TODAY, weekStart: WEEK };
        const base  = { ...blank(), secondsWeek: 1260, secondsToday: 0 };
        merge(stats, base, { lastDate: TODAY, weekStart: WEEK,
                             secondsToday: 100, secondsWeek: 1260 }, TODAY, WEEK);
        return JSON.stringify(stats);
    };
    ok(run(mergers[0][1]) === run(mergers[1][1]),
       'game.js and learn.js copies of mergeGuestStats agree exactly');
}

// ─── B. session-log.js, for real ────────────────────────────────────────────
console.log('\n─── B. session-log.js ───');

// Minimal localStorage. The module must never throw through it.
const store = new Map();
globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); },
};

const mod = await import('./session-log.js');

let writes = [];
let failNext = 0;
mod.sessionLogInit({
    db: {}, collection: (_db, name) => name,
    addDoc: async (col, payload) => {
        if (failNext > 0) { failNext--; throw new Error('simulated denial'); }
        writes.push(payload);
        return { id: 'doc' + writes.length };
    },
});

const UID = 'student-1';
const rec = (date, at, seconds = 30) => ({
    date, at, seconds, chars: 100, mistakes: 5, wpm: 40, accuracy: 95,
    source: 'school', label: 'lesson_3', detail: 'run 1',
});

// ⚠️ THE DATE DEFECT. A queue that survived midnight must NOT collapse onto one
// day. game.js <= v3.21.1 stamped every rollup with getLocalDateStr() at flush
// time, so yesterday's sprints were filed under today: yesterday's drill-down
// went empty and today's was padded.
store.clear(); writes = [];
mod.sessionLogPush(UID, rec('2026-08-17', '2026-08-17T14:05:00.000Z'));
mod.sessionLogPush(UID, rec('2026-08-17', '2026-08-17T14:06:00.000Z'));
mod.sessionLogPush(UID, rec('2026-08-18', '2026-08-18T09:01:00.000Z'));
ok(mod.sessionLogPending(UID) === 3, 'three records queued');
ok(await mod.sessionLogFlush(UID, {}) === true, 'flush reports success');
ok(writes.length === 2, `a queue spanning two days writes TWO documents (got ${writes.length})`);
const byDate = Object.fromEntries(writes.map(w => [w.date, w]));
ok(!!byDate['2026-08-17'] && !!byDate['2026-08-18'], 'both dates are represented, each under its own date');
ok(byDate['2026-08-17'].sprintCount === 2, "yesterday's document holds yesterday's two runs");
ok(byDate['2026-08-18'].sprintCount === 1, "today's document holds only today's run");
ok(mod.sessionLogPending(UID) === 0, 'the queue is empty after a clean flush');

// The document timestamp is the first record's, not the moment of the write.
ok(byDate['2026-08-17'].timestamp.toISOString().startsWith('2026-08-17'),
   'the rollup timestamp comes from the typing, not from the network');

// Rules caps: sprints <= 200 and seconds <= 86400.
store.clear(); writes = [];
for (let i = 0; i < 450; i++) {
    mod.sessionLogPush(UID, rec('2026-08-18', `2026-08-18T09:${String(i % 60).padStart(2,'0')}:00.000Z`));
}
await mod.sessionLogFlush(UID, {});
ok(writes.length === 3, `450 records chunk into 3 documents (got ${writes.length})`);
ok(writes.every(w => w.sprints.length <= 200), 'no document exceeds the 200-sprint rule cap');
ok(writes.every(w => w.seconds <= 86400), 'no document exceeds the 86400-second rule cap');
ok(writes.reduce((a, w) => a + w.sprints.length, 0) === 450, 'no record is lost across chunks');

// A mid-run failure must lose nothing and duplicate nothing.
store.clear(); writes = [];
for (let i = 0; i < 300; i++) {
    mod.sessionLogPush(UID, rec('2026-08-18', `2026-08-18T10:${String(i % 60).padStart(2,'0')}:00.000Z`));
}
failNext = 1;                       // first chunk is denied
const okFlag = await mod.sessionLogFlush(UID, {});
ok(okFlag === false, 'a denied chunk makes the flush report failure');
const stillQueued = mod.sessionLogPending(UID);
const writtenNow = writes.reduce((a, w) => a + w.sprints.length, 0);
ok(writtenNow + stillQueued === 300,
   `nothing is lost or duplicated after a partial failure (${writtenNow} written + ${stillQueued} queued)`);
failNext = 0;
await mod.sessionLogFlush(UID, {});
ok(mod.sessionLogPending(UID) === 0, 'a retry drains the remainder');

// ⚠️ Another student's queue is invisible and must not be destroyed.
store.clear(); writes = [];
mod.sessionLogPush('student-A', rec('2026-08-18', '2026-08-18T09:00:00.000Z'));
ok(mod.sessionLogPending('student-B') === 0, "student B cannot see student A's queue");
mod.sessionLogClear('student-B');
ok(mod.sessionLogPending('student-A') === 1, "student B signing in does not destroy student A's unflushed work");

// Undated records are refused rather than guessed at.
store.clear();
ok(mod.sessionLogPush(UID, { seconds: 30, chars: 10 }) === false,
   'a record with no date is refused, never stamped with today');
ok(mod.sessionLogPush(UID, rec('2026-08-18', '2026-08-18T09:00:00.000Z', 2)) === false,
   'a trivially short run (<5s) is not recorded');

// Storage failure degrades to "no queue" and never throws.
store.clear();
const realSet = globalThis.localStorage.setItem;
globalThis.localStorage.setItem = () => { throw new Error('quota'); };
let threw = false;
try { mod.sessionLogPush(UID, rec('2026-08-18', '2026-08-18T09:00:00.000Z')); }
catch (_) { threw = true; }
globalThis.localStorage.setItem = realSet;
ok(!threw, 'a storage quota failure never throws into a live lesson');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
