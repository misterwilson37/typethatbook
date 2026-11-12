// teach.js v0.3.0 — Round 168 (stage 2): MANAGE and SCHOOL TOOLS — Admin's tabs (students & CSV
// import, classes, staff, books, lessons) and Reports' school-wide tools, framed in embed mode so
// every staff task is reachable from Teach; links from the class and student pages.
// teach.js v0.2.0 — Round 168: the student page EDITS — Delete a whole run (time AND lesson
// credit, lesson-undo.js), set a day's time, Clear mastery; sign-in claims a pre-authorised role;
// a banner points to Reports for the one-time school-consent confirmation.
// teach.js v0.1.0 — Round 167. THE CONTROLLER FOR teach.html: TODAY → CLASS → STUDENT.
//
// See teach.html's header for Jake's brief. Three views behind one hash router, every name a
// link to the student, every class a link to the class:
//
//   #/today              who has typed today (one read per active student), flags from the
//                        same records — no session reads
//   #/class/<key>        key = a class id, 'mine' (all of yours), or 'school:<id>'. Nothing
//                        loads until chosen. Roster, totals, the class's own settings, and the
//                        CSV — one file for several classes, with a Class column appended.
//   #/student/<uid>      their days → their runs, lesson progress, requirements, class, and
//                        Wipe today
//
// ⚠️ READS. The class view reads each student-day ONCE: the range query returns the days
// stamped with this class, and only days the roster's ledger knows of that the query did not
// return are fetched by id. Reports reads them all twice (query, then by id). The footer shows
// this page's running read count (read-meter.js).
// ⚠️ NUMBERS ARE teach-data.js's, which are daylog.js totalsOf() — the student's own.
// ⚠️ WRITES ARE staff-actions.js's (shared with Reports), plus the class settings and Move,
// each the same shape the Class Manager / Students panel writes.

import { db, auth, ADMIN_EMAILS } from './firebase-config.js';
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc, deleteDoc, deleteField,
         serverTimestamp, ttbMeter } from './read-meter.js';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged }
    from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { localDateStr, SOURCE_SPLIT_CUTOVER } from './daylog.js';
import { ledgerFrom, planReads } from './logdays.js';
import { resolveReq, describeReq, cleanPct, NO_SCALE, scaleGates } from './req-scale.js';
import { mergeRunAttempts, gradeMergedRun, runPlan } from './run-grade.js';
import { MASTERY_POINTS } from './lesson-gate.js';
import { undoRunAttempt } from './lesson-undo.js';
import { wipeToday, saveStudentReq, classReqPatch, deleteRunAttempt, setDayTime, clearLessonMastery, sprintKeyOf,
         claimPendingRole, hasCoppaAttestation }
    from './staff-actions.js';
import { formatTime, datesInRange, rangePreset, dayRow, idleSuspect, rollUp, toCsv, agoText }
    from './teach-data.js';
import { isTombstone } from './day-wipe.js';

export const TEACH_VERSION = '0.3.0';

const FS = { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc, deleteDoc,
             deleteField, serverTimestamp };
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const today = () => localDateStr();
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayLabel = (ymd) => { const d = new Date(ymd + 'T12:00:00'); return DAY_NAMES[d.getDay()] + ' ' + ymd.slice(5); };

// ─── who am I ────────────────────────────────────────────────────────────────
let me = { uid: null, email: '', role: null, schoolIds: [], readScope: 'own_classes', classIds: [] };
let classesById = {}, schoolsById = {}, schoolWeekStartDay = 6;
const isSuper = () => me.role === 'super_admin';
const seesBuilding = () => isSuper() || me.role === 'building_admin' || me.readScope === 'building';
const className = (id) => (id && classesById[id] && classesById[id].name) || (id ? id : 'No class');
const anchorFor = (classId) => {
    const c = classId && classesById[classId];
    return c && Number.isInteger(c.weekStartDay) ? c.weekStartDay : schoolWeekStartDay;
};
// Classes this person may pick. A plain teacher: their own. Building staff: their schools'.
function visibleClassIds() {
    const ids = Object.keys(classesById).filter(id => {
        if (isSuper()) return true;
        const c = classesById[id];
        if (seesBuilding()) return me.schoolIds.includes(c.schoolId || '');
        return me.classIds.includes(id);
    });
    return ids.sort((a, b) => className(a).localeCompare(className(b)));
}

// ─── students we know about, for the finder (no extra reads) ─────────────────
const known = new Map();   // uid → { name, email, classId }
const KNOWN_KEY = () => 'ttb_teachKnown_v1:' + me.uid;
function remember(uid, info) {
    if (!uid) return;
    const prev = known.get(uid) || {};
    known.set(uid, { name: info.name || prev.name || 'Unknown', email: info.email || prev.email || '',
                     classId: info.classId != null ? info.classId : (prev.classId || '') });
}
function saveKnown() {
    try { localStorage.setItem(KNOWN_KEY(), JSON.stringify({ day: today(), list: [...known] })); } catch (_) {}
    const dl = $('find-list');
    dl.innerHTML = [...known.values()].sort((a, b) => a.name.localeCompare(b.name))
        .map(k => `<option value="${esc(k.name)}${k.email ? ' — ' + esc(k.email) : ''}"></option>`).join('');
}
function loadKnown() {
    try {
        const c = JSON.parse(localStorage.getItem(KNOWN_KEY()) || 'null');
        if (c && Array.isArray(c.list)) for (const [uid, v] of c.list) known.set(uid, v);
    } catch (_) {}
    saveKnown();
}
$('find').addEventListener('change', () => {
    const v = $('find').value.trim().toLowerCase();
    if (!v) return;
    for (const [uid, k] of known) {
        const label = (k.name + (k.email ? ' — ' + k.email : '')).toLowerCase();
        if (label === v || k.name.toLowerCase() === v || (k.email && k.email.toLowerCase() === v)) {
            $('find').value = '';
            location.hash = '#/student/' + uid;
            return;
        }
    }
});

// ─── reads counter ───────────────────────────────────────────────────────────
setInterval(() => { try { $('reads').textContent = ttbMeter.totals().reads; } catch (_) {} }, 1500);

// ─── sign-in ─────────────────────────────────────────────────────────────────
$('login-btn').onclick = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { $('gate-msg').textContent = e.message; }
};

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        $('gate-msg').textContent = 'Staff sign-in required.';
        $('login-btn').classList.remove('hidden');
        return;
    }
    me.uid = user.uid; me.email = user.email || '';
    await claimPendingRole({ db, fs: FS, user });   // Round 168 — a new teacher's first page can be Teach
    try {
        const s = await getDoc(doc(db, 'staff', user.uid));
        if (s.exists() && s.data().active !== false) {
            const sd = s.data();
            me.role = sd.role || null;
            me.schoolIds = Array.isArray(sd.schoolIds) ? sd.schoolIds : [];
            me.readScope = sd.readScope || 'own_classes';
        }
    } catch (e) { console.warn('[teach] staff record', e); }
    if (!me.role && ADMIN_EMAILS.includes(me.email)) { me.role = 'super_admin'; me.readScope = 'building'; }
    if (!me.role) {
        $('gate-msg').innerHTML = 'This account has no staff role. Ask your building admin, or open '
            + '<a href="admin.html">Admin</a> to request access.';
        return;
    }
    try {
        const [cls, sch] = await Promise.all([getDocs(collection(db, 'classes')), getDocs(collection(db, 'schools'))]);
        cls.forEach(d => { classesById[d.id] = d.data(); });
        sch.forEach(d => { schoolsById[d.id] = d.data(); });
        me.classIds = Object.keys(classesById).filter(id =>
            Array.isArray(classesById[id].teacherUids) && classesById[id].teacherUids.includes(user.uid));
    } catch (e) { console.warn('[teach] classes/schools', e); }
    try {
        const g = await getDoc(doc(db, 'settings', 'goals'));
        if (g.exists() && Number.isInteger(g.data().weekStartDay)) schoolWeekStartDay = g.data().weekStartDay;
    } catch (_) {}
    $('who').textContent = me.email + ' (' + me.role.replace('_', ' ') + ')';
    $('gate').classList.add('hidden');
    $('nav').classList.remove('hidden');
    $('find').classList.remove('hidden');
    loadKnown();
    fillPickers();
    route();
    // Round 168 — the one-time school-consent confirmation lives in Reports (one form, one
    // record); Teach points to it rather than keeping a second copy.
    if (!(await hasCoppaAttestation({ db, fs: FS, uid: me.uid }))) {
        const b = document.createElement('div');
        b.className = 'card';
        b.style.borderColor = 'var(--notice)';
        b.innerHTML = 'Before you go further: please confirm, once, that your school has approved TypeThatBook — '
            + '<a href="reports.html">open Reports</a> and answer the question it shows. (It is only asked once.)';
        document.querySelector('main').prepend(b);
    }
});

// ─── router ──────────────────────────────────────────────────────────────────
window.addEventListener('hashchange', route);
function route() {
    if (!me.role) return;
    const parts = (location.hash || '#/today').replace(/^#\/?/, '').split('/');
    const view = parts[0] || 'today';
    for (const v of ['today', 'class', 'student', 'manage', 'tools']) $('view-' + v).classList.toggle('hidden', v !== view);
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === view));
    if (view === 'today') showToday();
    else if (view === 'class') showClass(decodeURIComponent(parts.slice(1).join('/') || ''));
    else if (view === 'student') showStudent(decodeURIComponent(parts[1] || ''));
    else if (view === 'manage') showManage(parts[1] || 'students');
    else if (view === 'tools') showTools();
}

// ═════════════════════════════════════════════════════════════════════════════
// MANAGE and SCHOOL TOOLS — Round 168. Admin's and Reports' own panels, framed in
// embed mode (admin.html?embed=<tab>, reports.html?embed=1), so every staff task is
// reachable from Teach without rewriting the deep tools (CSV import, class creation's
// access refresh, purge, retention). Each moves in natively later, one at a time.
// ═════════════════════════════════════════════════════════════════════════════
function showManage(tab) {
    const allowed = ['students', 'classes'];
    if (isSuper() || me.role === 'building_admin') allowed.push('staff');
    if (isSuper()) allowed.push('books', 'lessons');
    if (!allowed.includes(tab)) tab = 'students';
    document.querySelectorAll('#manage-tabs a').forEach(a => {
        a.classList.toggle('hidden', !allowed.includes(a.dataset.mtab));
        a.classList.toggle('on', a.dataset.mtab === tab);
    });
    const src = 'admin.html?embed=' + tab;
    if ($('manage-frame').getAttribute('src') !== src) $('manage-frame').setAttribute('src', src);
}
function showTools() {
    if (!$('tools-frame').getAttribute('src')) $('tools-frame').setAttribute('src', 'reports.html?embed=1');
}
const studentLink = (uid, name) => `<a href="#/student/${encodeURIComponent(uid)}">${esc(name || 'Unknown')}</a>`;
const classLink = (id) => id && classesById[id]
    ? `<a href="#/class/${encodeURIComponent(id)}">${esc(className(id))}</a>` : '<span class="src">No class</span>';

function fillPickers() {
    const ids = visibleClassIds();
    const mine = ids.filter(id => me.classIds.includes(id));
    const schools = isSuper() ? Object.keys(schoolsById) : me.schoolIds.filter(s => schoolsById[s]);
    const opts = (withNone) => (withNone ? '<option value="">— choose —</option>' : '')
        + (mine.length ? `<option value="mine">All my classes (${mine.length})</option>` : '')
        + ids.map(id => `<option value="${esc(id)}">${esc(className(id))}${me.classIds.includes(id) ? ' ★' : ''}</option>`).join('')
        + (seesBuilding() ? schools.map(s => `<option value="school:${esc(s)}">Whole school: ${esc((schoolsById[s] || {}).name || s)}</option>`).join('') : '');
    $('today-scope').innerHTML = opts(!mine.length);
    if (mine.length) $('today-scope').value = 'mine';
    $('class-pick').innerHTML = opts(true);
    $('stu-move').innerHTML = '<option value="">— No class —</option>'
        + ids.map(id => `<option value="${esc(id)}">${esc(className(id))}</option>`).join('');
}

/** A scope key → the queries' parts. */
function scopeOf(key) {
    if (!key) return null;
    if (key === 'mine') return { kind: 'classes', classIds: visibleClassIds().filter(id => me.classIds.includes(id)), label: 'All my classes' };
    if (key.startsWith('school:')) { const s = key.slice(7); return { kind: 'school', schoolId: s, label: 'Whole school: ' + ((schoolsById[s] || {}).name || s) }; }
    return { kind: 'classes', classIds: [key], label: className(key) };
}

// ═════════════════════════════════════════════════════════════════════════════
// TODAY
// ═════════════════════════════════════════════════════════════════════════════
let todayLoadedFor = null;
$('today-load').onclick = () => loadToday(true);
$('today-scope').onchange = () => loadToday(true);
$('today-missing').onclick = () => whoHasNotTyped();
function showToday() {
    const key = $('today-scope').value;
    if (key && todayLoadedFor !== key + '|' + today()) loadToday(false);
}

async function todayDocs(scope, day) {
    const logs = collection(db, 'typing_logs');
    const qs = scope.kind === 'school'
        ? [query(logs, where('schoolId', '==', scope.schoolId), where('date', '==', day))]
        : scope.classIds.map(cid => query(logs, where('classId', '==', cid), where('date', '==', day)));
    const out = new Map();
    for (const q of qs) (await getDocs(q)).forEach(d => out.set(d.id, d.data()));
    return out;
}

async function loadToday(force) {
    const key = $('today-scope').value;
    const scope = scopeOf(key);
    const st = $('today-status');
    $('today-missing-out').innerHTML = '';
    if (!scope) { st.textContent = 'Choose a class or a school to watch.'; $('today-table').classList.add('hidden'); return; }
    if (!force && todayLoadedFor === key + '|' + today()) return;
    st.textContent = 'Loading…';
    let docs;
    try { docs = await todayDocs(scope, today()); }
    catch (e) { st.textContent = 'Could not load: ' + e.message; return; }
    todayLoadedFor = key + '|' + today();
    const rows = [...docs.values()].map(d => ({ d, r: dayRow(d, today()) }))
        .filter(x => x.r.seconds > 0 || x.r.chars > 0)
        .sort((a, b) => lastMs(b.d) - lastMs(a.d));
    for (const { d } of rows) remember(d.uid, { name: d.displayName, email: d.email, classId: d.classId });
    saveKnown();
    const total = rows.reduce((s, x) => s + x.r.seconds, 0);
    st.textContent = rows.length
        ? `${rows.length} student${rows.length === 1 ? '' : 's'} typed today · ${formatTime(total)} in all · ${scope.label}`
        : `Nobody has typed yet today · ${scope.label}`;
    $('today-table').classList.toggle('hidden', !rows.length);
    $('today-body').innerHTML = rows.map(({ d, r }) => `
        <tr class="click" data-uid="${esc(d.uid)}">
            <td>${studentLink(d.uid, d.displayName)}</td>
            <td>${classLink(d.classId)}</td>
            <td class="num">${formatTime(r.seconds)}</td>
            <td class="src">${whereText(r)}</td>
            <td class="num">${r.wpm}</td>
            <td class="num">${r.accuracy}%</td>
            <td class="src">${esc(agoText(d.lastUpdated))}</td>
            <td>${flagsFor(r)}</td>
        </tr>`).join('');
    wireRowClicks('today-body');
}
const lastMs = (d) => (d.lastUpdated && (d.lastUpdated.toMillis ? d.lastUpdated.toMillis()
    : (d.lastUpdated.seconds ? d.lastUpdated.seconds * 1000 : 0))) || 0;
function whereText(r) {
    const p = [];
    if (r.school) p.push('School ' + formatTime(r.school));
    if (r.library) p.push('Library ' + formatTime(r.library));
    if (r.arcade) p.push('Arcade ' + formatTime(r.arcade));
    return p.join(' · ');
}
// Cheap flags: read off the day's own totals. ⏸ is Reports' idle flag (same rule);
// "mashing" is an error rate of half or more — Reports' ERR_HIGH line.
function flagsFor(r) {
    let h = '';
    if (idleSuspect(r.seconds, r.chars)) h += '<span class="flag warn" title="Time credited with almost no typing — possibly a held key">⏸ idle</span>';
    const errRate = (r.chars + r.mistakes) > 0 ? r.mistakes / (r.chars + r.mistakes) : 0;
    if (r.chars + r.mistakes >= 50 && errRate >= 0.5) h += '<span class="flag bad" title="Half or more of their keys were wrong">mashing</span>';
    else if (r.chars + r.mistakes >= 50 && errRate >= 0.3) h += '<span class="flag notice" title="A high error rate — worth a look">errors</span>';
    return h;
}
function wireRowClicks(tbodyId) {
    $(tbodyId).querySelectorAll('tr.click').forEach(tr => {
        tr.onclick = (e) => { if (e.target.closest('a')) return; location.hash = '#/student/' + encodeURIComponent(tr.dataset.uid); };
    });
}

async function rosterFor(scope) {
    const users = collection(db, 'users');
    const qs = scope.kind === 'school'
        ? [query(users, where('schoolId', '==', scope.schoolId))]
        : scope.classIds.map(cid => query(users, where('classId', '==', cid)));
    const people = new Map();
    for (const q of qs) (await getDocs(q)).forEach(d => {
        const u = d.data() || {};
        people.set(d.id, { name: u.displayName || '', email: u.email || '', classId: u.classId || '',
                           ledger: ledgerFrom(u, d.id), reqSpeedPct: u.reqSpeedPct, reqAccPct: u.reqAccPct });
    });
    return people;
}

async function whoHasNotTyped() {
    const scope = scopeOf($('today-scope').value);
    const out = $('today-missing-out');
    if (!scope) return;
    out.innerHTML = '<div class="status">Reading the roster…</div>';
    try {
        const [people, docs] = await Promise.all([rosterFor(scope), todayDocs(scope, today())]);
        const typed = new Set([...docs.values()].filter(d => (dayRow(d, today()).seconds || 0) > 0).map(d => d.uid));
        const missing = [...people].filter(([uid]) => !typed.has(uid))
            .sort((a, b) => (a[1].name || '').localeCompare(b[1].name || ''));
        missing.forEach(([uid, p]) => remember(uid, p)); saveKnown();
        out.innerHTML = `<h2>Not typed yet today (${missing.length} of ${people.size})</h2>`
            + (missing.length ? '<div>' + missing.map(([uid, p]) =>
                `<div>${studentLink(uid, p.name || p.email)} <span class="src">${esc(className(p.classId))}</span></div>`).join('') + '</div>'
              : '<div class="empty">Everyone has typed today.</div>');
    } catch (e) { out.innerHTML = `<div class="status">Could not read the roster: ${esc(e.message)}</div>`; }
}

// ═════════════════════════════════════════════════════════════════════════════
// CLASS
// ═════════════════════════════════════════════════════════════════════════════
let classRows = [], classScope = null, classSort = { col: 'name', asc: true }, classRange = null;
document.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
    const p = rangePreset(b.dataset.preset, today(), anchorFor(firstClassOf($('class-pick').value)));
    $('class-start').value = p.start; $('class-end').value = p.end;
});
const firstClassOf = (key) => { const s = scopeOf(key); return s && s.kind === 'classes' ? s.classIds[0] : null; };
$('class-pick').onchange = () => { location.hash = '#/class/' + encodeURIComponent($('class-pick').value); };
$('class-load').onclick = () => loadClass();
$('class-csv').onclick = () => exportCsv();

function showClass(key) {
    $('class-pick').value = key || '';
    if (!$('class-start').value) {
        const p = rangePreset('week', today(), anchorFor(firstClassOf(key)));
        $('class-start').value = p.start; $('class-end').value = p.end;
    }
    renderClassSettings(key);
    // ⭐ Arriving by a link (from Today or a student) loads it; an empty pick never does.
    if (key && classScope !== key) loadClass();
    if (!key) {
        $('class-title').textContent = 'Classes';
        $('class-status').textContent = '';
        $('class-table').classList.add('hidden');
        $('class-csv').disabled = true;
    }
}

const MAX_PAIRS = 4000;   // Reports' own ceiling on student-days per report

async function loadClass() {
    const key = $('class-pick').value;
    const scope = scopeOf(key);
    const st = $('class-status');
    if (!scope) { st.textContent = 'Choose a class.'; return; }
    const start = $('class-start').value, end = $('class-end').value;
    const dates = datesInRange(start, end);
    if (!dates.length) { st.textContent = 'Pick a start and end date.'; return; }
    classScope = key; classRange = { start, end };
    $('class-title').textContent = scope.label;
    st.textContent = 'Reading the roster…';
    $('class-csv').disabled = true;
    try {
        const people = await rosterFor(scope);
        // 1. The days stamped with this class (or school) — one query, each doc read once.
        st.textContent = 'Reading the days…';
        const logs = collection(db, 'typing_logs');
        const range = [where('date', '>=', start), where('date', '<=', end)];
        const qs = scope.kind === 'school' ? [query(logs, where('schoolId', '==', scope.schoolId), ...range)]
            : scope.classIds.map(cid => query(logs, where('classId', '==', cid), ...range));
        const got = new Map();   // "uid_date" → { uid, date, data }
        for (const q of qs) (await getDocs(q)).forEach(d => {
            const x = d.data(); if (x && x.uid) got.set(d.id, { uid: x.uid, date: x.date, data: x });
        });
        // 2. Anyone the query found who is not on the roster (moved, or unassigned since).
        for (const v of got.values()) if (!people.has(v.uid)) {
            people.set(v.uid, { name: v.data.displayName || '', email: v.data.email || '',
                                classId: v.data.classId || '', ledger: null });
        }
        // 3. Days the ledger knows of that the query did not return (typed under another
        //    class stamp, or before a move) — by id, as Reports reads them.
        const pairs = [];
        for (const [uid, p] of people) {
            const plan = planReads(p.ledger, dates, { always: [] });
            for (const date of plan.fetch) if (!got.has(uid + '_' + date)) pairs.push({ uid, date });
        }
        if (pairs.length > MAX_PAIRS) {
            st.textContent = `Too much at once — ${pairs.length} student-days. Narrow the dates or pick one class.`;
            return;
        }
        st.textContent = `Reading ${pairs.length} more day${pairs.length === 1 ? '' : 's'} by id…`;
        await pool(pairs, async ({ uid, date }) => {
            try {
                const s = await getDoc(doc(db, 'typing_logs', uid + '_' + date));
                if (s.exists()) got.set(uid + '_' + date, { uid, date, data: s.data() });
            } catch (_) { /* unreadable: counted as missing, like Reports */ }
        });
        classRows = rollUp([...got.values()], people).map(r => {
            const p = people.get(r.uid) || {};
            const req = resolveReq(p.classId ? classesById[p.classId] : null, p);
            remember(r.uid, { name: r.name, email: r.email, classId: p.classId || r.classId });
            return { ...r, classId: p.classId || r.classId, adjusted: describeReq(req) };
        });
        saveKnown();
        renderClassTable();
        const multi = scope.kind === 'school' || scope.classIds.length > 1;
        st.textContent = `${classRows.length} students · ${start} to ${end}`
            + (multi ? ' · CSV includes a Class column' : '');
        $('class-csv').disabled = !classRows.length;
    } catch (e) {
        st.textContent = 'Could not load: ' + e.message;
        console.error('[teach] class load', e);
    }
}

async function pool(items, worker, n = 24) {
    let i = 0;
    await Promise.all(new Array(Math.min(n, items.length)).fill(0).map(async () => {
        while (i < items.length) await worker(items[i++]);
    }));
}

const CLASS_COLS = [
    ['name', 'Student'], ['email', 'Email'], ['seconds', 'Total Time', 'num'], ['chars', 'Characters', 'num'],
    ['wpm', 'Avg WPM', 'num'], ['accuracy', 'Accuracy', 'num'], ['days', 'Days Active', 'num'],
    ['adjusted', 'Adjusted'], ['classId', 'Class'],
];
function renderClassTable() {
    const scope = scopeOf(classScope);
    const multi = scope && (scope.kind === 'school' || scope.classIds.length > 1);
    const cols = CLASS_COLS.filter(c => c[0] !== 'classId' || multi);
    $('class-head').innerHTML = cols.map(([k, label, cls]) =>
        `<th data-col="${k}" class="${cls || ''}">${label}${classSort.col === k ? (classSort.asc ? ' ▲' : ' ▼') : ''}</th>`).join('');
    $('class-head').querySelectorAll('th').forEach(th => th.onclick = () => {
        const k = th.dataset.col;
        classSort = { col: k, asc: classSort.col === k ? !classSort.asc : (k === 'name' || k === 'email' || k === 'classId') };
        renderClassTable();
    });
    const val = (r, k) => k === 'classId' ? className(r.classId) : r[k];
    const rows = [...classRows].sort((a, b) => {
        const x = val(a, classSort.col), y = val(b, classSort.col);
        const c = (typeof x === 'number' && typeof y === 'number') ? x - y : String(x || '').localeCompare(String(y || ''));
        return classSort.asc ? c : -c;
    });
    $('class-table').classList.toggle('hidden', !rows.length);
    $('class-body').innerHTML = rows.map(r => `
        <tr class="click" data-uid="${esc(r.uid)}">
            <td>${studentLink(r.uid, r.name)}</td><td class="src">${esc(r.email)}</td>
            <td class="num">${formatTime(r.seconds)}</td><td class="num">${r.chars.toLocaleString()}</td>
            <td class="num">${r.wpm}</td><td class="num">${r.accuracy}%</td>
            <td class="num">${r.days}${r.dailyLogs.some(l => idleSuspect(l.seconds, l.chars)) ? ' <span class="flag warn" title="At least one day with time and almost no typing">⏸</span>' : ''}</td>
            <td class="src">${esc(r.adjusted)}</td>
            ${multi ? `<td>${classLink(r.classId)}</td>` : ''}
        </tr>`).join('');
    wireRowClicks('class-body');
}

function exportCsv() {
    if (!classRows.length || !classRange) return;
    const scope = scopeOf(classScope);
    const multi = scope.kind === 'school' || scope.classIds.length > 1;
    const csv = toCsv(classRows, { classNameOf: multi ? className : null, adjustedOf: r => r.adjusted });
    const label = scope.label.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `typethatbook_${label}_${classRange.start}_to_${classRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
}

// The class's own settings — one class only. Same fields and shapes as the Class Manager.
function renderClassSettings(key) {
    const box = $('class-settings');
    const c = key && classesById[key];
    const s = scopeOf(key);
    if (!c || !s || s.kind !== 'classes' || s.classIds.length !== 1) { box.classList.add('hidden'); return; }
    const mins = (v) => Math.floor((v || 0) / 60);
    box.classList.remove('hidden');
    box.innerHTML = `
        <div class="card-row">
            <div class="field"><label for="cs-daily">Daily goal (min)</label><input id="cs-daily" type="number" min="0" value="${mins(c.dailySeconds)}"></div>
            <div class="field"><label for="cs-weekly">Weekly goal (min)</label><input id="cs-weekly" type="number" min="0" value="${mins(c.weeklySeconds)}"></div>
            <div class="field"><label for="cs-week">Week starts</label><select id="cs-week">
                <option value="">School default</option>
                ${DAY_NAMES.map((n, i) => `<option value="${i}" ${c.weekStartDay === i ? 'selected' : ''}>${n}</option>`).join('')}
            </select></div>
            <div class="field"><label for="cs-sp">Speed requirement (%)</label><input id="cs-sp" type="number" min="25" max="200" step="5" placeholder="100" value="${Number.isInteger(c.reqSpeedPct) ? c.reqSpeedPct : ''}"></div>
            <div class="field"><label for="cs-ac">Accuracy requirement (%)</label><input id="cs-ac" type="number" min="25" max="200" step="5" placeholder="100" value="${Number.isInteger(c.reqAccPct) ? c.reqAccPct : ''}"></div>
            <div class="field"><button id="cs-save">Save class settings</button></div>
        </div>
        <div class="hint">Requirements are a percentage of every lesson's and of Library's 15 WPM / 80%: 70 = easier, 110 = harder, blank = standard. A student's own setting replaces these.</div>
        <div class="msg" id="cs-msg"></div>`;
    $('cs-save').onclick = async () => {
        const msg = $('cs-msg');
        const req = classReqPatch(FS, $('cs-sp').value, $('cs-ac').value, true);
        if (req.error) { msg.className = 'msg bad'; msg.textContent = req.error; return; }
        const daily = Math.max(0, parseInt($('cs-daily').value, 10) || 0);
        const weekly = Math.max(0, parseInt($('cs-weekly').value, 10) || 0);
        const wk = $('cs-week').value;
        const patch = { dailySeconds: daily * 60, weeklySeconds: weekly * 60,
                        weekStartDay: wk === '' ? deleteField() : parseInt(wk, 10),
                        ...req.patch, updatedAt: new Date().toISOString() };
        try {
            await setDoc(doc(db, 'classes', key), patch, { merge: true });
            const local = { ...classesById[key], dailySeconds: daily * 60, weeklySeconds: weekly * 60 };
            if (wk === '') delete local.weekStartDay; else local.weekStartDay = parseInt(wk, 10);
            for (const k of ['reqSpeedPct', 'reqAccPct']) {
                if (req.cleared.includes(k)) delete local[k];
                else if (typeof req.patch[k] === 'number') local[k] = req.patch[k];
            }
            classesById[key] = local;
            msg.className = 'msg ok';
            msg.textContent = 'Saved. Students pick it up at their next page load.';
        } catch (e) { msg.className = 'msg bad'; msg.textContent = 'Could not save: ' + e.message; }
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// STUDENT
// ═════════════════════════════════════════════════════════════════════════════
let stu = { uid: null, data: null };
document.querySelectorAll('[data-spreset]').forEach(b => b.onclick = () => {
    const p = rangePreset(b.dataset.spreset, today(), anchorFor(stu.data && stu.data.classId));
    $('stu-start').value = p.start; $('stu-end').value = p.end;
    loadStudentDays();
});
$('stu-load').onclick = () => loadStudentDays();
$('stu-lessons').onclick = () => loadLessons();

async function showStudent(uid) {
    if (!uid) { location.hash = '#/today'; return; }
    if (stu.uid === uid && stu.data) return;
    stu = { uid, data: null };
    const k = known.get(uid) || {};
    $('stu-name').textContent = k.name || 'Student';
    $('stu-sub').textContent = 'Loading…';
    ['stu-msg', 'stu-status', 'stu-days-hint'].forEach(id => { $(id).textContent = ''; });
    $('stu-days').classList.add('hidden');
    $('stu-lessons-out').innerHTML = '';
    try {
        const s = await getDoc(doc(db, 'users', uid));
        stu.data = s.exists() ? s.data() : {};
    } catch (e) { $('stu-sub').textContent = 'Could not read this student: ' + e.message; return; }
    const u = stu.data;
    const name = u.displayName || k.name || 'Student';
    remember(uid, { name, email: u.email, classId: u.classId || '' }); saveKnown();
    $('stu-name').textContent = name;
    $('stu-sub').innerHTML = `${esc(u.email || '')}<span class="chip" title="Student ID (click to copy)" id="stu-id">${esc(uid.slice(0, 8))}</span>`
        + ` · ${classLink(u.classId)}`;
    $('stu-id').onclick = () => navigator.clipboard && navigator.clipboard.writeText(uid).catch(() => {});
    $('stu-move').value = u.classId || '';
    $('stu-sp').value = cleanPct(u.reqSpeedPct) ?? '';
    $('stu-ac').value = cleanPct(u.reqAccPct) ?? '';
    showReqHint();
    $('stu-purge-hint').classList.toggle('hidden', !isSuper());
    const p = rangePreset('week', today(), anchorFor(u.classId));
    $('stu-start').value = p.start; $('stu-end').value = p.end;
    loadStudentDays();
}

function showReqHint() {
    const u = stu.data || {};
    const c = u.classId ? classesById[u.classId] : null;
    const cs = cleanPct(c && c.reqSpeedPct), ca = cleanPct(c && c.reqAccPct);
    $('stu-sp').placeholder = cs ?? 100; $('stu-ac').placeholder = ca ?? 100;
    const r = resolveReq(c, u);
    $('stu-req-hint').textContent = 'In force: ' + (describeReq(r) || 'standard requirements')
        + '. Blank boxes follow the class' + (c ? ` (${cs ?? 100}% / ${ca ?? 100}%)` : '') + '. The student only ever sees the resulting numbers.';
}

$('stu-req-save').onclick = async () => {
    const msg = $('stu-msg');
    const res = await saveStudentReq({ db, fs: FS, uid: stu.uid, speed: $('stu-sp').value, acc: $('stu-ac').value });
    if (!res.ok) { msg.className = 'msg bad'; msg.textContent = res.error; return; }
    Object.assign(stu.data, res.values);
    for (const k of ['reqSpeedPct', 'reqAccPct']) if (res.values[k] === undefined) delete stu.data[k];
    showReqHint();
    msg.className = 'msg ok'; msg.textContent = 'Saved. Their open page uses it from the next run.';
};

$('stu-move-save').onclick = async () => {
    const msg = $('stu-msg');
    const cid = $('stu-move').value;
    // ⚠️ schoolId RIDES ALONG, as every Students-panel writer has since ROADMAP 11.
    const patch = cid ? { classId: cid, schoolId: (classesById[cid] || {}).schoolId || '' } : { classId: null };
    try {
        await setDoc(doc(db, 'users', stu.uid), patch, { merge: true });
        Object.assign(stu.data, patch);
        remember(stu.uid, { classId: cid || '' }); saveKnown();
        $('stu-sub').innerHTML = $('stu-sub').innerHTML.replace(/ · .*$/, ' · ' + classLink(cid));
        showReqHint();
        msg.className = 'msg ok'; msg.textContent = cid ? 'Moved to ' + className(cid) + '.' : 'Removed from their class.';
    } catch (e) { msg.className = 'msg bad'; msg.textContent = 'Could not move: ' + e.message; }
};

$('stu-wipe').onclick = async () => {
    const name = $('stu-name').textContent;
    if (!confirm(`Wipe today for ${name}?\n\nRemoves TODAY's runs and minutes and puts every lesson they worked on today back the way it was this morning — including any they passed. Nothing from another day is touched.\n\nIf their page is open, it resets within a few seconds. They can keep typing and earn time again.`)) return;
    const btn = $('stu-wipe'), msg = $('stu-msg');
    btn.disabled = true; btn.textContent = 'Wiping…';
    try {
        const g = await wipeToday({ db, fs: FS, uid: stu.uid, isSuper: isSuper(), day: today() });
        msg.className = g.noSignal ? 'msg bad' : 'msg ok';
        msg.textContent = g.noSignal
            ? 'Removed what was saved, but could not reach their open page — Firestore rules need v2.18.0.'
            : `Wiped today: ${g.runs} run(s), ${Math.round(g.seconds / 60)} saved minute(s), ${g.lessons} lesson(s) reset. Their open page clears its unsaved time too.`;
        loadStudentDays();
    } catch (e) { msg.className = 'msg bad'; msg.textContent = 'Could not finish the wipe: ' + e.message; }
    finally { btn.disabled = false; btn.textContent = 'Wipe today…'; }
};

let lastDays = [];
async function loadStudentDays() {
    if (!stu.uid || !stu.data) return;
    const dates = datesInRange($('stu-start').value, $('stu-end').value);
    const st = $('stu-status');
    if (!dates.length) { st.textContent = 'Pick a start and end date.'; return; }
    const plan = planReads(ledgerFrom(stu.data, stu.uid), dates, { always: dates.includes(today()) ? [today()] : [] });
    st.textContent = `Reading ${plan.fetch.length} day${plan.fetch.length === 1 ? '' : 's'}…`;
    const days = [];
    await pool(plan.fetch.map(date => ({ date })), async ({ date }) => {
        try {
            const s = await getDoc(doc(db, 'typing_logs', stu.uid + '_' + date));
            if (s.exists()) days.push(dayRow(s.data(), date));
        } catch (_) {}
    });
    days.sort((a, b) => b.date.localeCompare(a.date));
    lastDays = days;
    const tot = days.reduce((a, d) => ({ s: a.s + d.seconds, c: a.c + d.chars, m: a.m + d.mistakes }), { s: 0, c: 0, m: 0 });
    st.textContent = days.length
        ? `${formatTime(tot.s)} over ${days.length} day${days.length === 1 ? '' : 's'} · click a day to see its runs`
        : 'No typing in this range.';
    $('stu-days').classList.toggle('hidden', !days.length);
    $('stu-days-body').innerHTML = days.map(d => `
        <tr class="click" data-date="${d.date}">
            <td>${dayLabel(d.date)}</td><td class="num">${formatTime(d.seconds)}</td><td class="src">${whereText(d)}</td>
            <td class="num">${d.chars.toLocaleString()}</td><td class="num">${d.wpm}</td><td class="num">${d.accuracy}%</td>
            <td>${flagsFor(d)}</td>
        </tr>`).join('');
    $('stu-days-body').querySelectorAll('tr.click').forEach(tr => tr.onclick = () => toggleRuns(tr));
    $('stu-days-hint').innerHTML = 'To delete a single run or recalculate a day, use <a href="reports.html">Old Reports</a> for now — it moves here next.';
}

// ═════════════════════════════════════════════════════════════════════════════
// A DAY'S RUNS — Round 168: whole runs, each deletable, and the day's time editable.
// ═════════════════════════════════════════════════════════════════════════════
// A lesson run can be saved in fragments (an interrupted run continues); run-grade.js
// mergeRunAttempts() joins them, and each attempt carries its `members`, so Delete removes
// the whole run and nothing else. Library sprints and practice laps are listed one by one
// and delete their time only — they earn nothing in a lesson.
async function toggleRuns(tr) {
    const next = tr.nextElementSibling;
    if (next && next.classList.contains('runs')) { next.remove(); return; }
    const row = document.createElement('tr');
    row.className = 'runs';
    row.innerHTML = '<td colspan="7" class="src">Loading runs…</td>';
    tr.after(row);
    await renderRuns(row, tr.dataset.date);
}

async function renderRuns(row, date) {
    try {
        const snap = await getDocs(query(collection(db, 'typing_sessions'),
            where('uid', '==', stu.uid), where('date', '==', date)));
        const flat = [];
        snap.forEach(d => {
            const s = d.data();
            (Array.isArray(s.sprints) ? s.sprints : []).forEach(sp => flat.push({ ...sp, _sid: d.id,
                _source: s.source || sp.source || '', label: sp.label || s.lessonId || s.bookId || '' }));
        });
        const defs = await lessonDefs();
        const req = studentReq();
        const attempts = mergeRunAttempts(flat.filter(sp => sp._source === 'school'));
        const used = new Set();
        const rows = attempts.map(att => {
            att.members.forEach(m => used.add(sprintKeyOf(m) + m._sid));
            const lesson = defs[att.label];
            const g = lesson ? gradeMergedRun(att, lesson, null, x => scaleGates(x, req)) : { ok: false };
            return { kind: 'run', att, members: att.members, at: att.at, source: 'school', label: att.label,
                     what: (lesson && lesson.title) || att.label, runIdx: att.runIdx, grade: g.ok ? g.grade : '',
                     advances: g.ok ? g.advances : false, seconds: att.seconds, chars: att.chars,
                     mistakes: att.mistakes, wpm: att.wpm, accuracy: att.accuracy, parts: att.fragments };
        });
        for (const sp of flat) {
            if (used.has(sprintKeyOf(sp) + sp._sid)) continue;
            const lesson = defs[sp.label];
            rows.push({ kind: 'sprint', members: [sp], at: sp.at || '', source: sp._source || 'library',
                        label: sp.label, what: (lesson && lesson.title) || sp.label + (sp.detail != null && sp.detail !== '' ? ' · ' + sp.detail : ''),
                        runIdx: null, grade: sp.practice ? 'practice' : '', seconds: sp.seconds || 0,
                        chars: sp.chars || 0, mistakes: sp.mistakes || 0, wpm: sp.wpm || 0,
                        accuracy: sp.accuracy ?? '', parts: 1 });
        }
        rows.sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
        const tot = rows.reduce((a, r) => a + r.seconds, 0);
        row.innerHTML = `<td colspan="7">${rows.length ? `<table><thead><tr><th>Time</th><th>Where</th><th>What</th>
            <th>Run</th><th>Grade</th><th class="num">Length</th><th class="num">WPM</th><th class="num">Accuracy</th><th></th></tr></thead><tbody>${rows.map((r, i) => `
            <tr><td>${esc(String(r.at || '').slice(11, 16))}</td><td>${esc(r.source)}</td>
                <td>${esc(r.what)}</td><td>${r.runIdx != null ? 'run ' + (r.runIdx + 1) + (r.parts > 1 ? ` <span class="src">(${r.parts} parts)</span>` : '') : ''}</td>
                <td>${esc(r.grade)}</td><td class="num">${formatTime(r.seconds)}</td><td class="num">${r.wpm}</td>
                <td class="num">${r.accuracy}%</td>
                <td><button class="danger" data-del="${i}" title="Delete this run: its time${r.kind === 'run' ? ' and what it earned in the lesson' : ''}">Delete</button></td></tr>`).join('')}
            </tbody></table>` : '<span class="src">No run records for this day (Arcade games keep no run records).</span>'}
            <div class="bar">
                <span class="src">Set this day's time:</span>
                <input type="number" min="0" class="dt-min" style="width:5em"> min <input type="number" min="0" max="59" class="dt-sec" style="width:4em"> s
                <button class="dt-save">Save</button>
                <span class="src">replaces the whole day with this one number (runs listed: ${formatTime(tot)})</span>
            </div><div class="msg dt-msg"></div></td>`;
        row.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteRow(row, date, rows[Number(b.dataset.del)], rows));
        row.querySelector('.dt-save').onclick = () => saveDayTime(row, date);
    } catch (e) { row.innerHTML = `<td colspan="7" class="src">Could not load runs: ${esc(e.message)}</td>`; }
}

function studentReq() {
    const u = stu.data || {};
    return resolveReq(u.classId ? classesById[u.classId] : null, u);
}

async function deleteRow(row, date, r, all) {
    const msgEl = row.querySelector('.dt-msg');
    const when = String(r.at || '').slice(11, 16);
    const isRun = r.kind === 'run';
    if (!confirm(isRun
        ? `Delete run ${r.runIdx + 1} of "${r.what}" at ${when} (${formatTime(r.seconds)}, grade ${r.grade || '—'})?\n\n`
          + `• Its ${formatTime(r.seconds)} come off ${date}.\n• In the lesson it takes back what this run earned: one attempt, its mastery points, and — if this run passed the lesson — the pass.\n\n`
          + `Their open page updates within seconds. Nothing else is touched.`
        : `Delete this ${r.source} run at ${when} (${formatTime(r.seconds)})?\n\nIts time comes off ${date}. Their open page updates within seconds.`)) return;
    msgEl.className = 'msg dt-msg'; msgEl.textContent = 'Deleting…';
    try {
        let lessonId = null, lessonRecord = null, notes = [];
        if (isRun && r.grade) {
            const ref = doc(db, 'users', stu.uid, 'lessonProgress', r.label);
            const recSnap = await getDoc(ref);
            const lesson = (await lessonDefs())[r.label];
            if (recSnap.exists() && lesson) {
                const rec = recSnap.data();
                const k = String(r.runIdx);
                // Other known attempts of this run: the rest of this day, plus the record's
                // stored best when this run did not set it (see lesson-undo.js's header).
                const other = all.filter(x => x !== r && x.kind === 'run' && x.label === r.label && x.runIdx === r.runIdx).map(x => x.grade);
                const stored = (rec.runGrades || {})[k];
                if (stored && stored !== r.grade) other.push(stored);
                const u = undoRunAttempt(rec, { runIdx: r.runIdx, grade: r.grade, advanced: r.advances,
                    isFinalRun: r.runIdx === runPlan(lesson).length - 1, seconds: r.seconds, otherGrades: other });
                lessonId = r.label; lessonRecord = u.record; notes = u.notes;
            }
        }
        await deleteRunAttempt({ db, fs: FS, uid: stu.uid, date, members: r.members,
            totals: { seconds: r.seconds, chars: r.chars, mistakes: r.mistakes },
            source: r.source === 'library' ? 'library' : 'school', splitCutover: SOURCE_SPLIT_CUTOVER,
            lessonId, lessonRecord, isSuper: isSuper() });
        const smsg = $('stu-msg');
        smsg.className = 'msg ok';
        smsg.textContent = `Deleted the ${when} run (${formatTime(r.seconds)} off ${date})`
            + (notes.length ? '; in the lesson: ' + notes.join('; ') : '') + '.';
        await loadStudentDays();
        const tr = $('stu-days-body').querySelector(`tr[data-date="${date}"]`);
        if (tr) toggleRuns(tr);
        if ($('stu-lessons-out').innerHTML) loadLessons();
    } catch (e) {
        msgEl.className = 'msg bad dt-msg';
        msgEl.textContent = 'Could not delete: ' + e.message + ' (are Firestore rules v2.20.0 published?)';
    }
}

async function saveDayTime(row, date) {
    const msgEl = row.querySelector('.dt-msg');
    const mins = parseInt(row.querySelector('.dt-min').value, 10) || 0;
    const secs = Math.min(59, Math.max(0, parseInt(row.querySelector('.dt-sec').value, 10) || 0));
    const seconds = mins * 60 + secs;
    const day = (lastDays || []).find(d => d.date === date) || { chars: 0, mistakes: 0 };
    if (!confirm(`Set ${date} to ${formatTime(seconds)} for this student?\n\nThis replaces the whole day — School, Library and Arcade — with one number. Their open page updates within seconds.`)) return;
    try {
        await setDayTime({ db, fs: FS, uid: stu.uid, date, seconds, chars: day.chars, mistakes: day.mistakes });
        $('stu-msg').className = 'msg ok';
        $('stu-msg').textContent = `${date} is now ${formatTime(seconds)}.`;
        await loadStudentDays();
    } catch (e) { msgEl.className = 'msg bad dt-msg'; msgEl.textContent = 'Could not save: ' + e.message; }
}

// Lesson definitions (titles, steps, gates), read once per page load.
let _lessonDefs = null;
async function lessonDefs() {
    if (_lessonDefs) return _lessonDefs;
    const map = {};
    try { (await getDocs(collection(db, 'lessons'))).forEach(d => { map[d.id] = { id: d.id, ...d.data() }; }); } catch (_) {}
    return (_lessonDefs = map);
}

async function loadLessons() {
    const out = $('stu-lessons-out');
    out.innerHTML = '<div class="status">Reading lesson progress…</div>';
    try {
        const [snap, defs] = await Promise.all([
            getDocs(collection(db, 'users', stu.uid, 'lessonProgress')), lessonDefs()]);
        const recs = [];
        snap.forEach(d => { const r = d.data(); if (!isTombstone(r)) recs.push({ id: d.id, ...r }); });
        const order = (id) => { const l = defs[id]; return l && typeof l.order === 'number' ? l.order : 9999; };
        recs.sort((a, b) => order(a.id) - order(b.id) || a.id.localeCompare(b.id));
        const mastered = (r) => Object.values(r.runScores || {}).filter(v => v >= MASTERY_POINTS).length;
        out.innerHTML = recs.length ? `<table><thead><tr><th>Lesson</th><th>Passed</th><th>Best grade</th>
            <th class="num">Runs reached</th><th>Run grades</th><th class="num">Mastered runs</th><th>Last worked on</th><th></th></tr></thead><tbody>${recs.map(r => `
            <tr><td>${esc((defs[r.id] && defs[r.id].title) || r.id)}</td><td>${r.passed ? '✓' : ''}</td><td>${esc(r.grade || '')}</td>
                <td class="num">${r.runCount ? Math.min(r.runCount, (r.furthestRunIdx || 0) + 1) + ' / ' + r.runCount : ''}</td>
                <td class="src">${Object.keys(r.runGrades || {}).sort((a, b) => a - b).map(k => (Number(k) + 1) + ':' + esc(r.runGrades[k])).join(' ')}</td>
                <td class="num">${mastered(r) || ''}</td>
                <td class="src">${esc(String(r.lastSeenAt || r.completedAt || '').slice(0, 10))}</td>
                <td>${mastered(r) ? `<button data-clear="${esc(r.id)}" title="Every run goes back to being graded so they can earn credit again. Grades and attempts are kept.">Clear mastery</button>` : ''}</td></tr>`).join('')}
            </tbody></table>` : '<div class="empty">No lessons started.</div>';
        out.querySelectorAll('[data-clear]').forEach(b => b.onclick = async () => {
            const id = b.dataset.clear;
            if (!confirm(`Clear mastery for "${(defs[id] && defs[id].title) || id}"?\n\nEvery run in this lesson goes back to being graded, so they can earn credit in it again. Grades, fireballs and attempt counts are kept. Their open page updates within seconds.`)) return;
            b.disabled = true;
            try {
                const { lockNote } = await clearLessonMastery({ db, fs: FS, uid: stu.uid, lessonId: id });
                $('stu-msg').className = lockNote ? 'msg bad' : 'msg ok';
                $('stu-msg').textContent = lockNote || 'Mastery cleared.';
                loadLessons();
            } catch (e) { $('stu-msg').className = 'msg bad'; $('stu-msg').textContent = 'Could not clear: ' + e.message; b.disabled = false; }
        });
    } catch (e) { out.innerHTML = `<div class="status">Could not read lesson progress: ${esc(e.message)}</div>`; }
}
