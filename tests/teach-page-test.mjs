// teach-page-test.mjs v1.0.0 — Round 167. teach.html, RUN IN A REAL BROWSER (Rule 10).
//
// Chromium loads the real teach.html / teach.js / teach-data.js / staff-actions.js / daylog.js
// with Firebase replaced by an in-memory Firestore (fakeFirestore below) holding a made-up school:
// a teacher with two classes, a class that is not theirs, four students, an Arcade day, an idle
// day and a mashing day. It drives Today → student → runs → lessons → requirements → class →
// settings → CSV → all-my-classes CSV, and checks what a teacher would see and what gets written.
// ⚠️ SKIPS (exit 0) where Playwright is not installed.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { console.log('teach-page-test: SKIPPED — Playwright is not installed here.'); process.exit(0); }
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const now = new Date(); const T = ymd(now); const Y = ymd(new Date(now.getTime() - 86400000));
const ts = (ms) => ({ seconds: Math.floor(ms / 1000) });
const fx = {
  'staff/T1': { role: 'teacher', schoolIds: ['s1'], readScope: 'own_classes', active: true },
  'schools/s1': { name: 'Test Middle' },
  'classes/c1': { name: 'Period 1', schoolId: 's1', teacherUids: ['T1'], dailySeconds: 600, weeklySeconds: 3000 },
  'classes/c2': { name: 'Period 2', schoolId: 's1', teacherUids: ['T1'], reqSpeedPct: 70 },
  'classes/cX': { name: 'Not mine', schoolId: 's1', teacherUids: ['T9'] },
  'settings/goals': { weekStartDay: 6 },
  'users/a': { displayName: 'Ann Able', email: 'ann@x', classId: 'c1', schoolId: 's1', ttbLogDays: [T, Y], ttbLogDaysSince: '2026-01-01' },
  'users/b': { displayName: 'Ben Bold', email: 'ben@x', classId: 'c1', schoolId: 's1', reqAccPct: 110, ttbLogDays: [T], ttbLogDaysSince: '2026-01-01' },
  'users/c': { displayName: 'Cal Calm', email: 'cal@x', classId: 'c1', schoolId: 's1', ttbLogDays: [], ttbLogDaysSince: '2026-01-01' },
  'users/d': { displayName: 'Dee Dash', email: 'dee@x', classId: 'c2', schoolId: 's1', ttbLogDays: [T], ttbLogDaysSince: '2026-01-01' },
  [`typing_logs/a_${T}`]: { uid: 'a', date: T, classId: 'c1', schoolId: 's1', displayName: 'Ann Able', email: 'ann@x',
     secondsSchool: 420, charsSchool: 700, mistakesSchool: 20, secondsArcade: 120, charsArcade: 200, mistakesArcade: 5, lastUpdated: ts(Date.now() - 120000) },
  [`typing_logs/a_${Y}`]: { uid: 'a', date: Y, classId: 'c1', schoolId: 's1', displayName: 'Ann Able', secondsLibrary: 300, charsLibrary: 600, mistakesLibrary: 10 },
  [`typing_logs/b_${T}`]: { uid: 'b', date: T, classId: 'c1', schoolId: 's1', displayName: 'Ben Bold', email: 'ben@x',
     secondsLibrary: 600, charsLibrary: 40, mistakesLibrary: 2, lastUpdated: ts(Date.now() - 600000) },
  [`typing_logs/d_${T}`]: { uid: 'd', date: T, classId: 'c2', schoolId: 's1', displayName: 'Dee Dash', email: 'dee@x',
     secondsSchool: 200, charsSchool: 300, mistakesSchool: 400, lastUpdated: ts(Date.now() - 60000) },
  [`typing_sessions/s1`]: { uid: 'a', date: T, source: 'school', sprints: [
     { at: T + 'T09:05:00', seconds: 200, chars: 300, mistakes: 6, wpm: 18, accuracy: 96, label: 'u1_l1', detail: 'run 1' },
     { at: T + 'T09:10:00', seconds: 220, chars: 400, mistakes: 4, wpm: 20, accuracy: 97, label: 'u1_l1', detail: 'run 2' }] },
  // Four passage steps of ~40 characters -> four runs (run-grade.js runPlan()).
  'lessons/u1_l1': { title: 'Home Row 1', order: 1, gates: { minWPM: 15, minAccuracy: 85 },
     steps: [1, 2, 3, 4].map(i => ({ type: 'passage', text: 'the quick brown fox jumps over a lazy dog ' + i })) },
  // Ann did run 1 (B) and run 2 (A) today; runs 3-4 earlier, the lesson passed on run 4.
  'users/a/lessonProgress/u1_l1': { lessonId: 'u1_l1', passed: true, grade: 'A', runCount: 4, furthestRunIdx: 3,
     lastSeenAt: T + 'T09:10:00', runAttempts: { 0: 1, 1: 1, 2: 1, 3: 1 }, runScores: { 0: 0, 1: 1, 2: 4, 3: 1 },
     runGrades: { 0: 'B', 1: 'A', 2: 'A', 3: 'A' }, runLocks: { 2: 5 } },
};
const server = createServer((req, res) => {
  const p = ROOT + decodeURIComponent(req.url.split('?')[0]);
  if (!existsSync(p)) { res.writeHead(404); return res.end(); }
  const type = p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : 'application/octet-stream';
  res.writeHead(200, { 'content-type': type }); res.end(readFileSync(p));
}).listen(0);
const PORT = await new Promise(r => server.on('listening', () => r(server.address().port)));
function fakeFirestore(fixtureJson) {
  return `
const store = new Map(Object.entries(${fixtureJson}));
let reads = 0;
export const DEL = { __del: true };
export function deleteField() { return DEL; }
export function serverTimestamp() { const t = Date.now(); return { toMillis: () => t }; }
const join = (segs) => segs.join('/');
export function collection(db, ...segs) { return { kind: 'col', path: join(segs) }; }
export function doc(db, ...segs) { return { kind: 'doc', path: join(segs), id: segs[segs.length - 1] }; }
export function where(f, op, v) { return { f, op, v }; }
export function query(col, ...w) { return { kind: 'q', path: col.path, wheres: w }; }
const snap = (path) => { const d = store.get(path); return { id: path.split('/').pop(), ref: doc(null, ...path.split('/')),
  exists: () => !!d, data: () => d ? JSON.parse(JSON.stringify(d)) : undefined }; };
const test = (d, w) => { const x = d[w.f];
  if (w.op === '==') return x === w.v; if (w.op === '>=') return x >= w.v; if (w.op === '<=') return x <= w.v;
  if (w.op === 'array-contains') return Array.isArray(x) && x.includes(w.v); return false; };
export async function getDoc(ref) { reads++; return snap(ref.path); }
export async function getDocs(q) {
  const base = q.path; const n = base.split('/').length + 1; const out = [];
  for (const [p, d] of store) if (p.startsWith(base + '/') && p.split('/').length === n && (q.wheres || []).every(w => test(d, w))) out.push(snap(p));
  reads += Math.max(1, out.length);
  return { docs: out, empty: !out.length, size: out.length, forEach: (fn) => out.forEach(fn) };
}
function apply(prev, data) { const o = { ...(prev || {}) }; for (const [k, v] of Object.entries(data)) { if (v && v.__del) delete o[k]; else o[k] = v; } return o; }
export async function setDoc(ref, data, opts) { window.__writes.push({ op: 'set', path: ref.path, data, merge: !!(opts && opts.merge) });
  store.set(ref.path, opts && opts.merge ? apply(store.get(ref.path), data) : apply({}, data)); }
export async function updateDoc(ref, data) { window.__writes.push({ op: 'update', path: ref.path, data });
  if (!store.has(ref.path)) throw new Error('no doc'); store.set(ref.path, apply(store.get(ref.path), data)); }
export async function deleteDoc(ref) { window.__writes.push({ op: 'delete', path: ref.path }); store.delete(ref.path); }
export function onSnapshot() { return () => {}; }
export const ttbMeter = { totals: () => ({ reads, writes: window.__writes.length, byPath: [{ where: 'typing_logs', reads, writes: 0, calls: 1 }] }), day: () => ({ reads: reads + 100 }) };
window.__writes = []; window.__store = store;
`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ acceptDownloads: true });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
// The framed Admin / Reports pages are their own harnesses' business; here they are blank.
await page.route(/(admin|reports)\.html\?embed=/, r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>framed</title>' }));
await page.route('**/firebase-config.js', r => r.fulfill({ contentType: 'text/javascript', body: `export const db = {}; export const auth = {}; export const ADMIN_EMAILS = [];` }));
await page.route('**/read-meter.js', r => r.fulfill({ contentType: 'text/javascript', body: fakeFirestore(JSON.stringify(fx)) }));
await page.route('https://www.gstatic.com/**', r => r.fulfill({ contentType: 'text/javascript', body:
  `export function onAuthStateChanged(a, cb) { setTimeout(() => cb({ uid: 'T1', email: 'teacher@x' }), 10); }
   export class GoogleAuthProvider {} export async function signInWithPopup() {}` }));
const results = [];
const check = (c, l) => results.push((c ? 'ok   ' : 'FAIL ') + l);
await page.goto(`http://localhost:${PORT}/teach.html`);
await page.waitForSelector('#today-table:not(.hidden)', { timeout: 5000 }).catch(() => {});
const todayRows = await page.$$eval('#today-body tr', trs => trs.map(t => t.innerText.replace(/\s+/g, ' ')));
check(todayRows.length === 3, 'Today lists the 3 students who typed (got ' + todayRows.length + ')');
check(/Dee Dash/.test(todayRows[0]), 'newest first: Dee (1 min ago) at the top');
check(todayRows.some(r => /Ann Able.*9m 0s.*School 7m 0s · Arcade 2m 0s/.test(r)), 'Ann: 9m with School + Arcade split');
check(todayRows.some(r => /Ben Bold.*idle/.test(r)), 'Ben is flagged idle (600 s, 40 chars)');
check(todayRows.some(r => /Dee Dash.*mashing/.test(r)), 'Dee is flagged mashing (400 wrong of 700)');
check(!todayRows.some(r => /Not mine/.test(r)), 'nothing from a class that is not mine');
await page.click('#today-missing');
await page.waitForSelector('#today-missing-out h2');
check(/Cal Calm/.test(await page.innerText('#today-missing-out')), '"Who hasn\'t typed?" lists Cal');
// student
await page.click('#today-body a:text("Ann Able")');
await page.waitForSelector('#stu-days:not(.hidden)');
check((await page.innerText('#stu-name')) === 'Ann Able', 'student page opens on Ann');
check(/Period 1/.test(await page.innerText('#stu-sub')), 'her class is a link on her page');
const dayRows = await page.$$eval('#stu-days-body tr', t => t.map(x => x.innerText));
check(dayRows.length >= 1, 'her days are listed (' + dayRows.length + ')');
await page.click('#stu-days-body tr');
await page.waitForSelector('.runs table');
const runs = await page.innerText('.runs');
check(/Home Row 1/.test(runs) && /run 2/.test(runs), 'clicking a day shows its runs with lesson titles');
await page.click('#stu-lessons');
await page.waitForSelector('#stu-lessons-out table');
check(/Home Row 1.*✓.*A.*4 \/ 4/s.test(await page.innerText('#stu-lessons-out')), 'lesson progress table');
// Round 168 - delete run 2 (graded A) from today: its time AND its lesson credit.
await page.waitForSelector('.runs [data-del]');
page.once('dialog', d => d.accept());
const delBtn = await page.$$('.runs [data-del]');
await delBtn[1].click();
await page.waitForFunction(() => /Deleted the/.test(document.getElementById('stu-msg').textContent));
let st = await page.evaluate(() => Object.fromEntries(window.__store));
const sess = st['typing_sessions/s1'];
check(sess && sess.sprints.length === 1 && sess.sprints[0].detail === 'run 1', 'Delete run removes run 2 - and only run 2 - from the session');
check(st[`typing_logs/a_${T}`].secondsSchool === 200 && st[`typing_logs/a_${T}`].secondsArcade === 120,
      'its 220 s come off the day (School 420 -> 200); Arcade untouched');
const lp = st['users/a/lessonProgress/u1_l1'];
check(lp && !lp.runAttempts['1'] && !lp.runScores['1'] && !lp.runGrades['1'], 'the lesson record loses run 2\'s attempt, point and grade');
check(lp.runGrades['2'] === 'A' && lp.runLocks['2'] === 5 && lp.passed === true, '...and nothing else (run 3 mastery and the pass from run 4 stay)');
check(typeof st['users/a'].progressChangedAt === 'object' && st['users/a'].logsChangedDay === T,
      'the student\'s page is told: minutes changed today AND lesson records changed');
check(/in the lesson:/.test(await page.innerText('#stu-msg')), 'the teacher is told what changed in the lesson');
await page.fill('#stu-sp', '70'); await page.click('#stu-req-save');
await page.waitForFunction(() => /Saved/.test(document.getElementById('stu-msg').textContent));
let w = await page.evaluate(() => window.__writes);
check(w.some(x => x.path === 'users/a' && x.data.reqSpeedPct === 70), 'saving requirements writes users/a.reqSpeedPct = 70');
check(/speed 70%/.test(await page.innerText('#stu-req-hint')), 'the "in force" hint updates');
// class via link
await page.click('#stu-sub a:text("Period 1")');
await page.waitForSelector('#class-table:not(.hidden)');
const clsRows = await page.$$eval('#class-body tr', t => t.map(x => x.innerText.replace(/\s+/g, ' ')));
check(clsRows.length === 3, 'Period 1 roster: 3 students, including Cal at zero (' + clsRows.length + ')');
check(clsRows.some(r => /Cal Calm.*0m 0s/.test(r)), 'Cal shows 0m 0s');
check(clsRows.some(r => /Ben Bold.*accuracy 110%/.test(r)), 'Ben\'s Adjusted column shows accuracy 110%');
check(await page.isVisible('#class-settings'), 'one class → its settings card is shown');
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#class-csv')]);
const csv = readFileSync(await dl.path(), 'utf8');
check(csv.split('\n')[0] === 'Name,Email,Total Seconds,Total Time,Characters,Avg WPM,Accuracy %,Days Active,Adjusted', 'one-class CSV header = Reports\'');
// Yesterday is in "this week" unless today is the week's first day (Saturday, anchor 6).
const annWeek = now.getDay() === 6 ? '320,5m 20s' : '620,10m 20s';   // after run 2 (220 s) was deleted above
check(new RegExp('Ann Able,ann@x,' + annWeek).test(csv), 'Ann\'s week includes her Arcade minutes (' + annWeek + ')');
// class settings save
await page.fill('#cs-sp', '80'); await page.click('#cs-save');
await page.waitForFunction(() => /Saved/.test((document.getElementById('cs-msg') || {}).textContent || ''));
w = await page.evaluate(() => window.__writes);
check(w.some(x => x.path === 'classes/c1' && x.data.reqSpeedPct === 80 && x.data.dailySeconds === 600), 'class settings save writes reqSpeedPct 80, keeps the goals');
// all my classes
await page.selectOption('#class-pick', 'mine');
await page.waitForSelector('#class-head th[data-col="classId"]');
await page.waitForFunction(() => document.querySelectorAll('#class-body tr').length === 4);
const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#class-csv')]);
const csv2 = readFileSync(await dl2.path(), 'utf8').trim().split('\n');
check(csv2[0].endsWith('Adjusted,Class') && csv2.length === 5, 'all-my-classes CSV: one file, 4 students, Class appended');
check(/Dee Dash.*speed 70%.*Period 2/.test(csv2[4]), 'Dee is in Period 2 with the class\'s speed 70%');
check(!csv2.some(l => /Not mine/.test(l)), 'no class that is not mine');
await page.waitForTimeout(2000);
// Round 168 — Manage and School tools frame Admin's and Reports' own pages in embed mode.
await page.goto(`http://localhost:${PORT}/teach.html#/manage/classes`);
await page.waitForSelector('#view-manage:not(.hidden)');
check((await page.getAttribute('#manage-frame', 'src')) === 'admin.html?embed=classes', 'Manage → Classes frames admin.html?embed=classes');
check(await page.isHidden('#manage-tabs a[data-mtab="books"]'), 'a teacher is not offered Books (super only)');
await page.click('#nav-tools');
await page.waitForSelector('#view-tools:not(.hidden)');
check((await page.getAttribute('#tools-frame', 'src')) === 'reports.html?embed=1', 'School tools frames reports.html?embed=1');
const reads = await page.evaluate(() => document.getElementById('reads').textContent);
await page.click('#reads-link');
const rp = await page.innerText('#reads-panel');
check(/Reads on this page since it opened/.test(rp) && /day records/.test(rp) && /free 50,000/.test(rp),
      'clicking "reads" explains them: by kind, the day\'s browser total, against the free allowance');
check(Number(reads) > 0, 'the footer counts this page\'s reads (' + reads + ')');
check(!errors.length, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
console.log(results.join('\n'));
await browser.close(); server.close();
const failed = results.filter(r => r.startsWith('FAIL'));
console.log(failed.length ? `\nteach-page-test: ${failed.length} FAILED` : `\nteach-page-test: all ${results.length} checks pass`);
process.exit(failed.length ? 1 : 0);
