// day-wipe-test.mjs v1.0.0 — Round 164. "WIPE TODAY", AND THE OPEN TAB THAT HEARS IT.
//
// Jake's scenario, 2026-11-11: he catches a student cheating 7 minutes in. Reports
// shows ~3 saved minutes; the other 4–5 live only in the student's open tab. He
// presses Wipe today. ⭐ The saved part goes from the server; the tab hears the
// stamp, locks its saves, throws away the unsaved part, and reloads. Lessons the
// student worked on today go back to how they stood this morning.
//
//   A  the start-of-today lesson snapshot and its restore (pure)
//   B  what a users/{uid} snapshot asks of the browser
//   C  ⚠️ the listener: a closed tab purges at sign-in, an open tab locks + reloads
//   D  the purge touches only this student, and only the wiped day's runs
//   E  ⚠️⚠️ THE SCENARIO: 7 minutes in a tab, wipe, nothing of it survives
//   F  wiring on every page, and Reports' wipe is TODAY ONLY
import { readFileSync } from 'node:fs';

const store = new Map();
globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); },
    key: i => [...store.keys()][i] ?? null,
    get length() { return store.size; },
};

const W = await import('../day-wipe.js');
const WAL = await import('../stats-wal.js');
const SL = await import('../session-log.js');

let pass = 0, fail = 0; const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };
const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const TODAY = '2026-11-11', YDAY = '2026-11-10';
const ts = ms => ({ toMillis: () => ms });

console.log('\nA — THE START-OF-TODAY SNAPSHOT');
{
    const morning = { lessonId: 'u2_l3', passed: false, attempts: 2, runAttempts: { 0: 2 },
                      dayStartDate: YDAY, dayStartAt: 1, dayStartJson: '{"old":1}' };
    const run1 = W.withDayStart(morning, { ...morning, attempts: 3 }, TODAY, 100);
    ok(run1.dayStartDate === TODAY && run1.dayStartAt === 100, 'A1 the first change today takes a snapshot');
    const snap = JSON.parse(run1.dayStartJson);
    ok(snap.attempts === 2 && !('dayStartJson' in snap) && !('dayStartDate' in snap),
       'A2 …of the record as it stood this morning, with no snapshot nested inside it');
    const run2 = W.withDayStart(run1, { ...run1, passed: true, grade: 'A' }, TODAY, 200);
    ok(run2.dayStartAt === 100 && run2.dayStartJson === run1.dayStartJson,
       '⚠️ A3 a second change today CARRIES the morning snapshot — never retakes it');
    const back = W.restoreForWipe(run2, 'u2_l3', TODAY);
    ok(back && back.passed === false && back.attempts === 2 && !back.grade,
       '⭐ A4 the wipe restores the morning record: the pass made by cheating is gone');
    ok(!('dayStartDate' in back), 'A5 the restored record carries no snapshot (the next change takes a fresh one)');
    ok(W.restoreForWipe(run2, 'u2_l3', YDAY) === null,
       '⚠️⚠️ A6 a record changed today is NOT touched by a wipe of any other day');
    const fresh = W.withDayStart(undefined, { lessonId: 'u3_l1', passed: true }, TODAY, 5);
    const tomb = W.restoreForWipe(fresh, 'u3_l1', TODAY);
    ok(tomb && tomb.wipedAt && W.isTombstone(tomb), 'A7 a lesson first touched today becomes a tombstone ("never started")');
    const fromEmpty = W.withDayStart({}, { lessonId: 'x', attempts: 1 }, TODAY, 5);
    ok(W.isTombstone(W.restoreForWipe(fromEmpty, 'x', TODAY)), 'A8 …so does one whose only prior record was empty');
    ok(!W.isTombstone({ wipedAt: 'x', passed: true }), 'A9 a tombstone that has since been typed on is a real record again');
}

console.log('\nB — WHAT A SNAPSHOT ASKS');
{
    store.clear();
    ok(W.accountAction({}, 'kid', TODAY) === null, 'B1 nothing stamped → nothing to do');
    const a = W.accountAction({ wipeAt: ts(5000), wipeDay: TODAY, logsChangedAt: ts(5000) }, 'kid', TODAY);
    ok(a && a.kind === 'wipe' && a.day === TODAY, 'B2 a new wipe is a wipe');
    W.ackWipe('kid', 5000);
    ok(W.accountAction({ wipeAt: ts(5000), wipeDay: TODAY }, 'kid', TODAY) === null, 'B3 …once, then acknowledged');
    const t = W.accountAction({ logsChangedAt: ts(6000), logsChangedDay: TODAY }, 'kid', TODAY);
    ok(t && t.kind === 'today', 'B4 a teacher change to TODAY\'s minutes asks for a reload');
    ok(W.accountAction({ logsChangedAt: ts(7000), logsChangedDay: YDAY }, 'kid', TODAY) === null,
       '⚠️ B5 a change to another day does not interrupt a student typing today');
}

console.log('\nC — THE LISTENER');
function fakeFirestore() {
    let cb = null;
    return {
        onSnapshot: (_ref, next) => { cb = next; return () => { cb = null; }; },
        push: (data) => cb && cb({ exists: () => !!data, data: () => data, metadata: { hasPendingWrites: false } }),
    };
}
{
    // A CLOSED tab: unsaved minutes from before the wipe sit in the WAL.
    store.clear(); W._unlockForTest();
    WAL.statsWalSave('kid', { lastDate: TODAY, weekStart: 1, secondsToday: 420, secondsWeek: 420 });
    ok(store.has('ttb_statswal_v1'), 'C0 (setup) the WAL holds 7 unsaved minutes');
    const fs = fakeFirestore(); let reloads = 0;
    const w = W.watchAccount({ db: {}, doc: (...a) => a.join('/'), onSnapshot: fs.onSnapshot, uid: 'kid',
                               today: () => TODAY, onReload: () => { reloads++; }, firstTimeoutMs: 50 });
    fs.push({ wipeAt: ts(9000), wipeDay: TODAY, logsChangedAt: ts(9000) });
    await w.ready;
    ok(!store.has('ttb_statswal_v1'), '⭐ C1 a wipe this browser had not seen is purged at sign-in, before any replay');
    ok(reloads === 0 && !W.savesLocked(), 'C2 …without a reload or a lock — nothing was loaded yet');
    ok(W.accountAction({ wipeAt: ts(9000), wipeDay: TODAY }, 'kid', TODAY) === null, 'C3 …and acknowledged');
    // The same tab, later: a second wipe arrives LIVE.
    fs.push({ wipeAt: ts(12000), wipeDay: TODAY, logsChangedAt: ts(12000) });
    ok(W.savesLocked() && reloads === 1, '⭐⭐ C4 a LIVE wipe locks every save and reloads the page');
    WAL.statsWalSave('kid', { lastDate: TODAY, secondsToday: 999 });
    ok(!store.has('ttb_statswal_v1'), '⚠️⚠️ C5 while locked, the WAL refuses to write — the reload\'s own exit save cannot put minutes back');
    ok(SL.sessionLogPush('kid', { date: TODAY, seconds: 60 }) === false, '⚠️ C6 …and the run queue refuses too');
    w.stop();
}
{
    store.clear(); W._unlockForTest();
    const fs = fakeFirestore(); let reloads = 0;
    const w = W.watchAccount({ db: {}, doc: () => 'x', onSnapshot: fs.onSnapshot, uid: 'kid2',
                               today: () => TODAY, onReload: () => { reloads++; }, firstTimeoutMs: 50 });
    fs.push({});
    await w.ready;
    fs.push({ logsChangedAt: ts(20000), logsChangedDay: TODAY });
    ok(W.savesLocked() && reloads === 1, '⭐ C7 ROADMAP 145a: a deleted run TODAY reloads an open tab instead of being overwritten');
    W._unlockForTest();
    const before = reloads;
    fs.push({ logsChangedAt: ts(30000), logsChangedDay: YDAY });
    ok(reloads === before && !W.savesLocked(), 'C8 a correction to yesterday leaves today\'s typing alone');
    w.stop();
}
{
    // ⚠️ A BROWSER THAT REFUSES localStorage cannot ack. The student's own later
    // write to users/{uid} re-delivers the same stamp; it must not reload again.
    store.clear(); W._unlockForTest();
    const realSet = globalThis.localStorage.setItem;
    globalThis.localStorage.setItem = () => { throw new Error('blocked'); };
    const fs = fakeFirestore(); let reloads = 0;
    const w = W.watchAccount({ db: {}, doc: () => 'x', onSnapshot: fs.onSnapshot, uid: 'kid3',
                               today: () => TODAY, onReload: () => { reloads++; }, firstTimeoutMs: 50 });
    fs.push({ logsChangedAt: ts(100), logsChangedDay: TODAY });   // an old, unacked stamp at attach
    await w.ready;
    fs.push({ logsChangedAt: ts(100), logsChangedDay: TODAY, lastLockDay: 5 });  // the student's own write
    fs.push({ logsChangedAt: ts(100), logsChangedDay: TODAY, lastLockDay: 6 });
    ok(reloads === 0, '⚠️⚠️ C8b no storage: the same stamp never reloads the page (no reload loop)');
    fs.push({ logsChangedAt: ts(200), logsChangedDay: TODAY, lastLockDay: 6 });
    ok(reloads === 1, 'C8c …but a genuinely NEW stamp still does');
    globalThis.localStorage.setItem = realSet;
    w.stop();
}
{
    // Offline: no snapshot ever comes. Sign-in must not hang.
    W._unlockForTest();
    const w = W.watchAccount({ db: {}, doc: () => 'x', onSnapshot: () => () => {}, uid: 'k',
                               today: () => TODAY, onReload: () => {}, firstTimeoutMs: 30 });
    const t0 = Date.now(); await w.ready;
    ok(Date.now() - t0 < 1000, 'C9 offline, sign-in waits at most the timeout');
}

console.log('\nD — THE PURGE IS THIS STUDENT\'S, AND THIS DAY\'S');
{
    store.clear(); W._unlockForTest();
    store.set('ttb_statswal_v1', JSON.stringify({ v: 1, uid: 'other', stats: {} }));
    store.set('ttb_learnwal_v1', JSON.stringify({ v: 1, uid: 'kid', progress: {} }));
    store.set('ttb_sessionq_v1', JSON.stringify({ v: 2, owners: {
        kid:   { savedAt: 1, records: [{ date: TODAY, seconds: 60 }, { date: YDAY, seconds: 30 }] },
        other: { savedAt: 1, records: [{ date: TODAY, seconds: 90 }] } } }));
    W.purgeLocal('kid', TODAY);
    ok(store.has('ttb_statswal_v1'), 'D1 another student\'s unsaved minutes on a shared Chromebook survive');
    ok(!store.has('ttb_learnwal_v1'), 'D2 this student\'s unsaved lesson progress is gone');
    const q = JSON.parse(store.get('ttb_sessionq_v1'));
    ok(q.owners.kid.records.length === 1 && q.owners.kid.records[0].date === YDAY,
       '⚠️ D3 only the wiped day\'s queued runs are dropped');
    ok(q.owners.other.records.length === 1, 'D4 another student\'s queued runs are untouched');
}

console.log('\nE — ⚠️⚠️ THE SCENARIO: 7 MINUTES IN AN OPEN TAB');
{
    store.clear(); W._unlockForTest();
    // Minute 0–3 were saved (the server side is Reports' job — F asserts it).
    // Minutes 3–7 live only here: in memory, the WAL and the run queue.
    const memory = { lastDate: TODAY, weekStart: 1, secondsToday: 420, secondsWeek: 420 };
    WAL.statsWalSave('kid', memory);
    SL.sessionLogPush('kid', { date: TODAY, seconds: 240, source: 'school', label: 'u2_l3' });
    const fs = fakeFirestore(); let reloaded = false;
    const w = W.watchAccount({ db: {}, doc: () => 'x', onSnapshot: fs.onSnapshot, uid: 'kid',
                               today: () => TODAY, onReload: () => { reloaded = true; }, firstTimeoutMs: 50 });
    fs.push({}); await w.ready;
    // Jake presses Wipe today.
    fs.push({ wipeAt: ts(50000), wipeDay: TODAY, logsChangedAt: ts(50000), logsChangedDay: TODAY });
    // The page's exit path then tries to save on its way out (pagehide).
    WAL.statsWalSave('kid', memory);
    SL.sessionLogPush('kid', { date: TODAY, seconds: 30 });
    const q = store.get('ttb_sessionq_v1');
    ok(reloaded, 'E1 the tab reloads');
    ok(!store.has('ttb_statswal_v1'), '⭐⭐ E2 the 4 unsaved minutes are gone — nothing for the reload to recover');
    ok(!q || !JSON.parse(q).owners.kid, '⭐ E3 the unsent runs are gone too');
    w.stop();
}

console.log('\nF — WIRING, AND TODAY ONLY');
for (const [f, before] of [['game.js', 'await loadBookMetadata();'], ['learn.js', 'await loadUserProgress();'],
                           ['learn2.js', 'await loadUserProgress();'], ['arcade.html', null]]) {
    const src = read(f);
    ok(/import \{[^}]*watchAccount[^}]*\} from ["']\.\/day-wipe\.js["']/.test(src), `F1 ${f} imports watchAccount`);
    ok(/import \{[^}]*\bonSnapshot\b[^}]*\} from ["']\.\/read-meter\.js["']/.test(src),
       `F2 ${f} brings onSnapshot through read-meter.js`);
    if (before) {
        const at = src.indexOf('await startAccountWatch(user.uid);');
        ok(at > 0 && src.indexOf(before, at) > at && src.indexOf(before, at) - at < 400,
           `⚠️ F3 ${f}: the listener starts BEFORE the first local replay (${before})`);
    }
}
for (const [f, fn] of [['game.js', 'async function flushAll('], ['learn.js', 'async function flushStats('],
                       ['learn2.js', 'async function flushStats('], ['arcade.html', 'async function flushArcadeSeconds(']]) {
    const src = read(f);
    const body = src.slice(src.indexOf(fn), src.indexOf(fn) + 600);
    ok(/if \(savesLocked\(\)\) return/.test(body), `⚠️⚠️ F4 ${f}: ${fn.split(' ').pop()}) refuses while saves are locked`);
}
for (const f of ['learn.js', 'learn2.js']) {
    const src = read(f);
    ok((src.match(/withDayStart\(prev, \{\}, getLocalDateStr\(new Date\(\)\)\)/g) || []).length === 2,
       `F5 ${f}: both lesson-record writers take the start-of-today snapshot`);
    ok(/isTombstone\(rec\)/.test(src), `F6 ${f}: a tombstone loads as "never started"`);
}
{
    const r = read('reports.html');
    const fn = r.slice(r.indexOf('async function wipeToday('), r.indexOf('async function openWipeDialog('));
    ok(/const day = localDateStr\(\);/.test(fn), 'F7 Reports wipes the CURRENT day');
    ok(/where\('date', '==', day\)/.test(fn) && /where\('dayStartDate', '==', day\)/.test(fn)
       && /uid \+ '_' \+ day/.test(fn), '⚠️⚠️ F8 every read it writes from is scoped to that day — runs, minutes, lessons');
    ok(!/getDocs\(collection\(db, 'users', uid, 'lessonProgress'\)\)/.test(fn),
       '⚠️ F9 it never reads every lesson — only the ones changed today');
    ok(fn.indexOf('await pass(true)') < fn.indexOf('wipeAt: serverTimestamp()')
       && fn.indexOf('wipeAt: serverTimestamp()') < fn.indexOf('await pass(false)'),
       '⚠️ F10 it removes, then stamps, then sweeps again (a save that landed in between)');
    ok(/setDoc\(d\.ref, back\)/.test(fn), 'F11 a lesson is replaced whole, never merged into');
    const rules = read('firebase/firestore.rules').replace(/^\s*\/\/.*$/gm, '');
    ok(/hasOnly\(\['logsChangedAt', 'logsChangedDay', 'wipeAt', 'wipeDay'\]\)/.test(rules)
       && /wipeAt == request\.time/.test(rules), 'F12 rules: staff may stamp a wipe, on the server clock, and nothing else');
}

console.log(fail ? `\nday-wipe-test: ${pass} passed, ${fail} FAILED` : `\nday-wipe-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   ✗ ' + f)); process.exit(1); }
