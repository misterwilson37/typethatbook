// session-merge-test.mjs v1.2.1 — the two things Round 12 changed, plus the one
// thing Round 13 added, tested against the code that actually ships.
//
// v1.2.1 — version pin follows session-log.js to 1.2.1, and the invariant
//          citations are renumbered against the consolidated HANDOFF.md §5.
//          ⚠️ session-log.js v1.2.1 is a COMMENT-ONLY change, so the pin below
//          is the only thing in this harness that had to move. If you are
//          reading this because the pin failed, check which of the two files
//          uploaded — that is exactly what it exists to tell you.
//          ⚠️ open-unit-test.mjs Part D CARRIES A SECOND PIN on the same module.
//          Both move together or the suite goes red on the one you forgot.
//
// v1.2.0 — version pin follows session-log.js to 1.2.0 (the continuation floor).
//          ⚠️ The pin is deliberate: an out-of-order upload shows up here as a
//          named failure instead of as behaviour nobody can explain.
//
// v1.1.0 — PART B gains the `serverAt` assertions (session-log.js v1.1.0), and
//          PART C is new: it reads the sessionLogInit(...) call out of game.js
//          and learn.js and asserts they hand the shared module the SAME
//          dependencies. That is invariant 50 — a fact about another file must
//          be tested against that file — applied to a dependency list instead of
//          a constant (invariant 51), because a dep passed on one side and not
//          the other makes School and Library write differently shaped documents.
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
// Stand-in for the real FieldValue sentinel. The point of the fake is that it is
// NOT a date and NOT serializable to anything meaningful — which is why the
// module may only create one at write time. A fresh object each call, so identity
// tells us the module called the function rather than caching one value.
const SENTINEL = () => ({ __sentinel: 'serverTimestamp' });
const surface = {
    db: {}, collection: (_db, name) => name,
    addDoc: async (col, payload) => {
        if (failNext > 0) { failNext--; throw new Error('simulated denial'); }
        writes.push(payload);
        return { id: 'doc' + writes.length };
    },
};
mod.sessionLogInit({ ...surface, serverTimestamp: SENTINEL });

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

// ─── serverAt (v1.1.0, DESIGN-TELEMETRY §6.3) ───────────────────────────────
// The field is written from an INJECTED serverTimestamp and from nothing else.

store.clear(); writes = [];
mod.sessionLogInit({ ...surface, serverTimestamp: SENTINEL });
mod.sessionLogPush(UID, rec('2026-08-18', '2026-08-18T09:00:00.000Z'));
mod.sessionLogPush(UID, rec('2026-08-19', '2026-08-19T09:00:00.000Z'));

// ⚠️ The sentinel must never be persisted. JSON.stringify() flattens a FieldValue
// to `{}`, and a queue that survived a tab close would then try to write an empty
// map into a timestamp field — denied by the rules, retried forever.
const rawQueue = globalThis.localStorage.getItem('ttb_sessionq_v1') || '';
ok(!rawQueue.includes('serverAt') && !rawQueue.includes('__sentinel'),
   'the serverTimestamp sentinel never reaches localStorage');

await mod.sessionLogFlush(UID, {});
ok(writes.length === 2, `two days, two documents (got ${writes.length})`);
ok(writes.every(w => w.serverAt && w.serverAt.__sentinel === 'serverTimestamp'),
   'every rollup document carries serverAt, taken from the injected function');
ok(writes[0].serverAt !== writes[1].serverAt,
   'serverAt is created per document at write time, not cached at init');
// ⚠️ serverAt must not have quietly replaced the client stamp. Both clocks, or
// the divergence between them means nothing.
ok(writes.every(w => w.timestamp instanceof Date),
   'the client `timestamp` survives alongside serverAt — two clocks, not one');
ok(writes[0].timestamp.toISOString().startsWith('2026-08-18'),
   'the client stamp still comes from the typing, unchanged by v1.1.0');

// ⚠️ A page controller that does not pass serverTimestamp must still write. This
// is the GitHub-web-portal upload window: new module, old game.js. Omitting one
// field is the correct degradation; `serverAt: undefined` is a rejected write and
// a lost period of sprint detail.
store.clear(); writes = [];
mod.sessionLogInit({ ...surface, serverTimestamp: undefined });
mod.sessionLogPush(UID, rec('2026-08-18', '2026-08-18T09:00:00.000Z'));
ok(await mod.sessionLogFlush(UID, {}) === true,
   'a page controller with no serverTimestamp still flushes successfully');
ok(writes.length === 1, 'the document is still written');
ok(!('serverAt' in writes[0]),
   'serverAt is ABSENT, not undefined — Firestore rejects undefined field values');

// A non-function is the same case as a missing one.
store.clear(); writes = [];
mod.sessionLogInit({ ...surface, serverTimestamp: 'nonsense' });
mod.sessionLogPush(UID, rec('2026-08-18', '2026-08-18T09:00:00.000Z'));
await mod.sessionLogFlush(UID, {});
ok(writes.length === 1 && !('serverAt' in writes[0]),
   'a non-function serverTimestamp dep is ignored rather than called');

// ⚠️ Invariant 7 ("absent beats approximated"), asserted against the source:
// no client-side fallback. A
// serverAt built from `new Date()` agrees with `timestamp` by construction and
// makes the cheat signal permanently unfalsifiable.
const sessionSrc = readFileSync(new URL('./session-log.js', import.meta.url), 'utf8');
const stamper = lift(sessionSrc, '_stampServer');
ok(!!stamper, '_stampServer() exists in session-log.js');
ok(!!stamper && !/new Date|Date\.now/.test(stamper),
   'serverAt has no client-clock fallback in session-log.js');

// ─── C. the two page controllers configure the module identically ────────────
console.log('\n─── C. sessionLogInit parity ───');

// ⚠️ READ OUT OF THE SHIPPED FILES, not out of a memory of them. Invariant 50.
function initDeps(src, label) {
    const m = src.match(/sessionLogInit\(\{([^}]*)\}\)/);
    ok(!!m, `${label}: a module-scope sessionLogInit({...}) call exists`);
    if (!m) return null;
    return m[1].split(',')
        .map(s => s.trim().split(':')[0].trim())
        .filter(Boolean)
        .sort();
}
const gameDeps  = initDeps(gameSrc,  'game.js');
const learnDeps = initDeps(learnSrc, 'learn.js');
if (gameDeps && learnDeps) {
    ok(gameDeps.join(',') === learnDeps.join(','),
       `game.js and learn.js pass the same deps to session-log.js ` +
       `(game: ${gameDeps.join('|')} / learn: ${learnDeps.join('|')})`);
    ok(gameDeps.includes('serverTimestamp'),
       'both page controllers pass serverTimestamp (v3.23.1 / v2.7.1)');
}

// The module's own version, so a stale copy uploaded out of order is visible in
// the test output rather than only in the footer.
ok(mod.SESSION_LOG_VERSION === '1.2.1',
   `session-log.js reports v1.2.1 (got ${mod.SESSION_LOG_VERSION})`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
