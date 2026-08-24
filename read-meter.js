// read-meter.js v1.0.1 — FIRESTORE READ/WRITE INSTRUMENTATION.
//
// v1.0.1 — ⚠️ THE `calls` COLUMN WAS INFLATED AND IT LOOKED LIKE A FINDING.
//          bump() incremented `calls` on every field pass, and record() calls it
//          once for reads and again for misses — so a getDoc that MISSED counted
//          as two calls. Jake's first run showed `typing_logs/* — 7 reads, 6
//          misses, 13 calls`, and 13 is 7+6, not a real call count. readWeek()
//          makes exactly SEVEN getDoc calls. Nothing else was wrong: reads,
//          misses and writes were all correct.
//          ⚠️ THE LESSON IS ABOUT INSTRUMENTS, NOT ARITHMETIC. A diagnostic that
//          over-reports is worse than none, because the next three rounds get
//          spent explaining a number that was never there. Count the event once,
//          at the event.
//
// ⚠️ THIS IS A DIAGNOSTIC, NOT A FEATURE. It exists to answer one question that
// neither Firebase console can answer: HOW MANY DOCUMENTS DOES ONE STUDENT'S
// PAGE LOAD ACTUALLY COST, AND WHICH LINE SPENDS THEM.
//
// ⚠️ WHY THE CONSOLES CANNOT ANSWER IT (2026-08-24, measured):
//   * Firebase > Usage "Billable Metrics" gives a TOTAL with no breakdown, and
//     its own header says it INCLUDES FIREBASE CONSOLE USAGE — so Jake browsing
//     data in the console is mixed in with the students.
//   * Cloud Monitoring `document/read_ops_count` splits LOOKUP / QUERY /
//     NOT_FOUND but not by collection or call site.
//   * Firestore Query Insights DOES break down by collection — and profiles the
//     CONSOLE, not the app. Every top row read
//     `COLLECTION /x SELECT _none_ PageSize 300`: no WHERE clause, uniform page
//     size, and one row was `COLLECTION * SELECT __collection__` (list the
//     collection names). No TTB query has that shape; every app query filters on
//     classId, uid or date. Query Insights showed ~7,500 reads for a week in
//     which Cloud Monitoring counted ~138,600. IT IS NOT SAMPLING. IT IS
//     WATCHING A DIFFERENT CLIENT.
//
// ═══════════════════════════════════════════════════════════════════════════
// HOW IT ATTACHES  —  ONE IMPORT LINE PER FILE, NOTHING ELSE
// ═══════════════════════════════════════════════════════════════════════════
//
// This module re-exports the ENTIRE Firestore SDK, with the billable calls
// wrapped in counters. A caller changes only the URL it imports from:
//
//     -  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
//     +  from "./read-meter.js"
//
// ⚠️ `export *` FIRST, THEN THE LOCAL OVERRIDES, AND THE ORDER IS LOAD-BEARING.
// Per the module spec an explicit local export SHADOWS a star export of the same
// name. So every SDK symbol stays available even though this file names only a
// dozen of them — which means a caller importing something I did not think of
// (deleteField, writeBatch, increment, Timestamp…) still works. THAT IS THE
// WHOLE SAFETY ARGUMENT: the failure mode of a shim like this is a blank page in
// a classroom, and `export *` makes that failure impossible by construction.
//
// ⚠️ IT IS ALSO WHY YOU MUST NOT "TIDY" THIS INTO AN EXPLICIT EXPORT LIST.
//
// ⚠️ SAME SDK URL, SAME VERSION (10.8.0). ES modules are cached by URL, so this
// resolves to the exact module instance firebase-config.js already loaded. A
// version bump here without one there would give you two Firestores in one page.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT IT COUNTS, AND WHAT "A READ" MEANS
// ═══════════════════════════════════════════════════════════════════════════
//
//   getDoc()              1 read. A MISS IS STILL 1 READ AND IS COUNTED
//                         SEPARATELY — Firestore bills a get() on a document
//                         that does not exist, and the roster sweep in
//                         reports.html is ~99.5% misses. If misses were free
//                         there would be no problem to fix.
//   getDocs()             snapshot.size reads, MINIMUM 1 — an empty query
//                         result is billed as one read, not zero.
//   getCountFromServer()  1 read (Firestore bills 1 per up to 1000 matched
//                         index entries; at TTB's scale that is always 1).
//   setDoc / updateDoc /
//   addDoc / deleteDoc    1 write each.
//
// ⚠️ THESE ARE THE CLIENT'S VIEW AND MAY NOT MATCH THE BILL EXACTLY. Cached
// reads served from the SDK's local layer, retries, and the console's own
// traffic all live outside this file. Treat it as "what this page asked for",
// which is the number that decides what to fix.
//
// ⚠️ FAILURE IS ALWAYS SILENT AND ALWAYS PASSES THROUGH. Every counter runs in
// a try/catch and the underlying SDK call's result is returned untouched. A bug
// in the meter must never be able to break a student's page.

export * from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
    getDoc as _getDoc,
    getDocs as _getDocs,
    getCountFromServer as _getCountFromServer,
    setDoc as _setDoc,
    updateDoc as _updateDoc,
    addDoc as _addDoc,
    deleteDoc as _deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const READ_METER_VERSION = "1.0.1";

// ─── State ────────────────────────────────────────────────────────────────────
//
// Two scopes, deliberately:
//   session — since this page load. Answers "what does one load cost?"
//   day     — accumulated across navigations, in localStorage. Answers "what
//             does one student cost me in a class period?", which is the number
//             that actually multiplies by 400.
const DAY_KEY = 'ttb_readmeter_' + new Date().getFullYear() + '-' +
                String(new Date().getMonth() + 1).padStart(2, '0') + '-' +
                String(new Date().getDate()).padStart(2, '0');

const session = { reads: 0, misses: 0, writes: 0, calls: 0, byPath: {}, bySite: {} };
const t0 = Date.now();

// ⚠️ ONE CALL IS ONE CALL. v1.0.0 incremented `calls` once per FIELD written,
// so a miss (which writes both `reads` and `misses`) scored two. Every counter
// for one SDK invocation is applied here, together, exactly once.
function bump(bucket, key, reads, misses, writes) {
    if (!bucket[key]) bucket[key] = { reads: 0, misses: 0, writes: 0, calls: 0 };
    bucket[key].reads  += reads;
    bucket[key].misses += misses;
    bucket[key].writes += writes;
    bucket[key].calls  += 1;
}

// ⚠️ DOCUMENT IDS ARE COLLAPSED TO `*`. `users/aB3x.../lessonProgress` and
// `users/kP9z.../lessonProgress` are the same line of code and must aggregate
// together, or the table is 135 rows of noise. Path segments alternate
// collection / document, so every odd index is an id.
function normalize(path) {
    if (!path) return '(unknown)';
    return path.split('/').map((seg, i) => (i % 2 === 1 ? '*' : seg)).join('/');
}

function pathOfRef(ref) {
    try { if (ref && typeof ref.path === 'string') return ref.path; } catch (_) {}
    return '(unknown)';
}

// ⚠️ PUBLIC PROPERTIES FIRST, INTERNALS LAST. A CollectionReference exposes
// `.path`; a Query does not, so we fall back to the first returned document's
// parent, and only then to the SDK's private `_query`. If a future SDK renames
// the private field we lose a label, not a page.
function pathOfQuery(q, snap) {
    try { if (q && typeof q.path === 'string') return q.path; } catch (_) {}
    try {
        if (snap && snap.docs && snap.docs.length) {
            const p = snap.docs[0].ref.path.split('/');
            p.pop();
            return p.join('/');
        }
    } catch (_) {}
    try {
        const segs = q && q._query && q._query.path && q._query.path.segments;
        if (segs && segs.length) return segs.join('/');
    } catch (_) {}
    return '(unknown query)';
}

// ⚠️ THE CALL SITE IS THE POINT OF THE WHOLE EXERCISE. Knowing that `books`
// costs 57 reads is half an answer; knowing it came from game.js:5986 rather
// than index.html:737 tells you which cache is not working.
function callSite() {
    try {
        const lines = (new Error().stack || '').split('\n');
        for (const line of lines) {
            if (!line.includes('http') && !line.includes('/')) continue;
            if (line.includes('read-meter.js')) continue;
            if (line.includes('firebase-firestore.js')) continue;
            const m = line.match(/\/([A-Za-z0-9_.-]+\.(?:js|html)):(\d+):(\d+)/);
            if (m) return m[1] + ':' + m[2];
        }
    } catch (_) {}
    return '(unknown site)';
}

function record({ path, site, reads = 0, misses = 0, writes = 0 }) {
    try {
        session.reads += reads;
        session.misses += misses;
        session.writes += writes;
        session.calls += 1;
        bump(session.byPath, normalize(path), reads, misses, writes);
        bump(session.bySite, site, reads, misses, writes);
        persistDay(reads, misses, writes);
    } catch (_) { /* a broken counter must never break a page */ }
}

function persistDay(reads, misses, writes) {
    try {
        const raw = localStorage.getItem(DAY_KEY);
        const d = raw ? JSON.parse(raw) : { reads: 0, misses: 0, writes: 0, loads: 0 };
        d.reads += reads; d.misses += misses; d.writes += writes;
        localStorage.setItem(DAY_KEY, JSON.stringify(d));
    } catch (_) {}
}

try {
    const raw = localStorage.getItem(DAY_KEY);
    const d = raw ? JSON.parse(raw) : { reads: 0, misses: 0, writes: 0, loads: 0 };
    d.loads = (d.loads || 0) + 1;
    localStorage.setItem(DAY_KEY, JSON.stringify(d));
} catch (_) {}

// ─── Wrapped SDK calls ────────────────────────────────────────────────────────

export async function getDoc(ref, ...rest) {
    const site = callSite();
    const snap = await _getDoc(ref, ...rest);
    let exists = true;
    try { exists = snap.exists(); } catch (_) {}
    record({ path: pathOfRef(ref), site, reads: 1, misses: exists ? 0 : 1 });
    return snap;
}

export async function getDocs(q, ...rest) {
    const site = callSite();
    const snap = await _getDocs(q, ...rest);
    let size = 0;
    try { size = snap.size; } catch (_) {}
    // ⚠️ MINIMUM ONE. An empty query result is billed as one read.
    record({ path: pathOfQuery(q, snap), site, reads: Math.max(1, size),
             misses: size === 0 ? 1 : 0 });
    return snap;
}

export async function getCountFromServer(q, ...rest) {
    const site = callSite();
    const snap = await _getCountFromServer(q, ...rest);
    record({ path: pathOfQuery(q, null) + ' [count]', site, reads: 1 });
    return snap;
}

export async function setDoc(ref, ...rest) {
    const site = callSite();
    const r = await _setDoc(ref, ...rest);
    record({ path: pathOfRef(ref), site, writes: 1 });
    return r;
}

export async function updateDoc(ref, ...rest) {
    const site = callSite();
    const r = await _updateDoc(ref, ...rest);
    record({ path: pathOfRef(ref), site, writes: 1 });
    return r;
}

export async function addDoc(ref, ...rest) {
    const site = callSite();
    const r = await _addDoc(ref, ...rest);
    record({ path: pathOfRef(ref), site, writes: 1 });
    return r;
}

export async function deleteDoc(ref, ...rest) {
    const site = callSite();
    const r = await _deleteDoc(ref, ...rest);
    record({ path: pathOfRef(ref), site, writes: 1 });
    return r;
}

// ─── Reporting ────────────────────────────────────────────────────────────────

function rows(bucket) {
    return Object.keys(bucket)
        .map(k => ({ where: k, reads: bucket[k].reads, misses: bucket[k].misses,
                     writes: bucket[k].writes, calls: bucket[k].calls }))
        .sort((a, b) => (b.reads + b.writes) - (a.reads + a.writes));
}

function report(label) {
    try {
        const secs = ((Date.now() - t0) / 1000).toFixed(1);
        let day = null;
        try { day = JSON.parse(localStorage.getItem(DAY_KEY) || 'null'); } catch (_) {}

        console.log(
            '%c TTB READ METER %c ' + (label || 'report') + ' %c ' +
            session.reads + ' reads · ' + session.writes + ' writes · ' +
            session.misses + ' misses · ' + secs + 's on ' + location.pathname,
            'background:#00ff41;color:#000;font-weight:bold',
            'background:#222;color:#00ff41',
            'color:inherit'
        );
        if (day) {
            console.log('  ALL PAGES TODAY (this browser): ' + day.reads +
                        ' reads · ' + day.writes + ' writes · ' + day.misses +
                        ' misses · across ' + day.loads + ' page loads');
        }
        console.log('  BY COLLECTION');
        console.table(rows(session.byPath));
        console.log('  BY CALL SITE');
        console.table(rows(session.bySite));
        console.log('  Copy for Jake:  copy(ttbMeter.json())');
    } catch (e) { console.warn('[read-meter] report failed', e); }
}

// ⚠️ THE AUTOMATIC REPORT FIRES ONCE, LATE, AND ONLY IF SOMETHING HAPPENED.
// A page load's reads are spread over auth, then the profile fetch, then the
// week read. Reporting at DOMContentLoaded would print zeros and teach us
// nothing; 6 seconds is after the load has settled and before a student has
// typed enough to muddy it.
let reported = false;
setTimeout(() => {
    if (reported || session.calls === 0) return;
    reported = true;
    report('page load settled');
}, 6000);

// A second snapshot when they leave, so a whole class period is captured.
try {
    window.addEventListener('pagehide', () => report('leaving page'), { once: true });
} catch (_) {}

export const ttbMeter = {
    version: READ_METER_VERSION,
    report,
    totals: () => ({ ...session, byPath: rows(session.byPath), bySite: rows(session.bySite) }),
    json: () => JSON.stringify({
        page: location.pathname,
        version: READ_METER_VERSION,
        seconds: (Date.now() - t0) / 1000,
        session: { reads: session.reads, misses: session.misses,
                   writes: session.writes, calls: session.calls },
        byPath: rows(session.byPath),
        bySite: rows(session.bySite),
    }, null, 2),
    day: () => { try { return JSON.parse(localStorage.getItem(DAY_KEY) || 'null'); }
                 catch (_) { return null; } },
    reset: () => {
        session.reads = session.misses = session.writes = session.calls = 0;
        session.byPath = {}; session.bySite = {};
        try { localStorage.removeItem(DAY_KEY); } catch (_) {}
        console.log('[read-meter] reset');
    },
};

try { window.ttbMeter = ttbMeter; } catch (_) {}
console.log('%c[read-meter v' + READ_METER_VERSION + '] armed — ttbMeter.report() any time',
            'color:#00ff41');
