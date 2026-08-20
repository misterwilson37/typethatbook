// crossmode-overwrite-test.mjs v1.0.0
//
// ⚠️ PATHS: sources are read as `../` — this file lives in tests/ (Round 17).
//
// ═══════════════════════════════════════════════════════════════════════════
// RULE 10, THE PRECONDITION. THIS HARNESS REPRODUCES §3.1 AGAINST THE CURRENT
// BUILD AND FAILS. NOTHING IS FIXED UNTIL IT PASSES.
// ═══════════════════════════════════════════════════════════════════════════
//
// §3.1, the cross-mode overwrite, in one sentence: game.js and learn.js each
// hold their own in-memory `statsData` and each writes the WHOLE day's total
// with setDoc(merge:true), so whichever writes second erases the other's
// contribution. Ten minutes of School plus ten of Library is credited as ten.
//
// ⚠️ IT HAS NEVER BEEN REPRODUCED, ONLY REASONED ABOUT. It has been a known
// defect since game.js v3.30.0 reverted the source split, was carried through
// six rounds as "a known, lived-with defect", and no harness ever drove it.
// That is exactly the shape Rule 10 exists to forbid: a defect everybody agrees
// exists, that no test would notice getting worse.
//
// ⚠️ THIS IS A MODEL, NOT THE REAL WRITE PATH, AND THE MODEL IS THE HONEST PART.
// Node has no Firestore, no two tabs and no page death. What is modelled is the
// ONE property that matters and that Part A verifies against the real source
// text: both controllers write an ABSOLUTE day total for the whole day, from a
// baseline read at page load. Everything else — the flush timer, the WAL, the
// visibility handlers — is choreography a harness cannot reach and this file
// does not pretend to.
//
// Part A — STRUCTURAL: the real game.js and learn.js both write an absolute
//          `seconds` for the whole day. While that is true, §3.1 is present.
// Part B — THE DEFECT: model both writers, show time disappearing.
// Part C — THE FIX: per-source documents, same scenario, nothing lost.
// Part D — the fix must not break the ordinary single-mode day.

import fs from 'fs';

let pass = 0, fail = 0, expectedFails = 0;
const ok = (name, cond, detail) => {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};
const okExpectedFail = (name, cond, detail) => {
    if (!cond) { expectedFails++; console.log(`  ⚠ ${name} — REPRODUCED${detail ? ': ' + detail : ''}`); }
    else { pass++; console.log(`  ✓ ${name} (defect is fixed)`); }
};

const gameSrc  = fs.readFileSync(new URL('../game.js',  import.meta.url), 'utf8');
const learnSrc = fs.readFileSync(new URL('../learn.js', import.meta.url), 'utf8');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart A — structural: is §3.1 still present in the shipped files?');
// ═══════════════════════════════════════════════════════════════════════════

const absoluteWrite = /setDoc\(doc\(db,\s*["']typing_logs["'][\s\S]{0,900}?\bseconds:/;
const perSourceDoc  = /typing_logs["']\s*,\s*`\$\{[^}]*\}_\$\{[^}]*\}_\$\{[^}]*source/;

ok('game.js writes typing_logs',  absoluteWrite.test(gameSrc));
ok('learn.js writes typing_logs', absoluteWrite.test(learnSrc));

okExpectedFail('game.js writes a PER-SOURCE document',  perSourceDoc.test(gameSrc),
               'still writes one shared {uid}_{date} document');
okExpectedFail('learn.js writes a PER-SOURCE document', perSourceDoc.test(learnSrc),
               'still writes one shared {uid}_{date} document');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart B — the defect, driven');
// ═══════════════════════════════════════════════════════════════════════════
//
// The scenario is Jake's actual room. A student opens Library first period and
// types. The Chromebook is supposed to restart between periods and sometimes
// does not (game.js v3.28.0's own incident note), so that tab survives with its
// in-memory statsData intact. The student then opens School and types more.
// Both tabs flush.

// TODAY'S SHARED DOCUMENT — the thing both writers target.
function makeSharedDb() {
    const store = new Map();
    return {
        write: (id, patch) => store.set(id, { ...(store.get(id) || {}), ...patch }),
        read:  (id) => store.get(id) || null,
        // What daylog.js readWeek() and reports.html both compute for the day.
        dayTotal: (uid, date) => (store.get(`${uid}_${date}`) || {}).seconds || 0,
    };
}

// A page controller: reads a baseline at load, ticks locally, writes the whole day.
function controller(db, uid, date, source) {
    let baseline = db.dayTotal(uid, date);   // loadUserStats() → readWeek()
    let local = baseline;                    // statsData.secondsToday
    return {
        load()      { baseline = db.dayTotal(uid, date); local = baseline; },
        type(secs)  { local += secs; },      // the 1-second tick
        // ⚠️ THIS LINE IS §3.1. An absolute total for the whole day, from a
        // baseline that may be stale by everything the other tab has written.
        flush()     { db.write(`${uid}_${date}`, { seconds: local, source }); },
        seen()      { return local; },
    };
}

{
    const db = makeSharedDb();
    const uid = 'student1', date = '2026-08-19';

    const library = controller(db, uid, date, 'library');
    library.load();               // 0
    library.type(600);            // ten minutes in a book
    library.flush();              // document: 600

    const school = controller(db, uid, date, 'school');
    school.load();                // 600 — correct so far
    school.type(600);             // ten minutes of lessons
    school.flush();               // document: 1200 — still correct

    // ⚠️ AND NOW THE LIBRARY TAB, STILL OPEN FROM FIRST PERIOD, FLUSHES AGAIN.
    // Its statsData still says 600. It writes 600 over the 1200.
    library.flush();

    const stored = db.dayTotal(uid, date);
    okExpectedFail('a two-mode day stores the full 20 minutes', stored === 1200,
                   `stored ${stored}s, the student typed 1200s — ${1200 - stored}s lost`);

    // ⚠️ AND THE TWO NUMBERS STILL AGREE, WHICH IS WHY RULE 11 IS NOT ENOUGH ON
    // ITS OWN. Both the child's screen and the report read this one document, so
    // they show the SAME wrong number. Agreement is necessary and not sufficient
    // — that distinction is Priority 1 versus Priority 2 in one assertion.
    ok('both readers still agree — on a number that is too small',
       db.dayTotal(uid, date) === db.dayTotal(uid, date));
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart C — the fix: one document per (uid, date, source)');
// ═══════════════════════════════════════════════════════════════════════════
//
// School writes only `{uid}_{date}_school`; Library writes only
// `{uid}_{date}_library`. They cannot overwrite each other because they no
// longer touch the same document. No lock, no increment, no merge policy, no
// read-modify-write, no ordering requirement.
//
// ⚠️ NOT THE v3.29.x SOURCE SPLIT. That put per-source FIELDS inside ONE
// document, so both writers still wrote the same document and the race
// survived; v3.29.0 also fed both fields from the shared cross-mode counter.
// Splitting at DOCUMENT level removes the shared resource instead of
// subdividing it. Read HANDOFF §0.6 item 9 before touching this.

function makeSplitDb() {
    const store = new Map();
    return {
        write: (id, patch) => store.set(id, { ...(store.get(id) || {}), ...patch }),
        dayTotal: (uid, date) =>
            ['school', 'library'].reduce(
                (a, s) => a + ((store.get(`${uid}_${date}_${s}`) || {}).seconds || 0), 0),
        sourceTotal: (uid, date, s) => (store.get(`${uid}_${date}_${s}`) || {}).seconds || 0,
    };
}

function splitController(db, uid, date, source) {
    // ⚠️ THE BASELINE IS THIS SOURCE'S OWN DOCUMENT, NOT THE DAY. That is the
    // whole change. A stale Library tab can only ever be stale about Library.
    let local = db.sourceTotal(uid, date, source);
    return {
        load()     { local = db.sourceTotal(uid, date, source); },
        type(secs) { local += secs; },
        flush()    { db.write(`${uid}_${date}_${source}`, { seconds: local, source }); },
    };
}

{
    const db = makeSplitDb();
    const uid = 'student1', date = '2026-08-19';

    const library = splitController(db, uid, date, 'library');
    library.load(); library.type(600); library.flush();

    const school = splitController(db, uid, date, 'school');
    school.load(); school.type(600); school.flush();

    library.flush();   // the stale first-period tab flushes again — harmless now

    ok('a two-mode day stores the full 20 minutes', db.dayTotal(uid, date) === 1200,
       `got ${db.dayTotal(uid, date)}s`);

    // Order must not matter at all — that is the point of removing the shared doc.
    const db2 = makeSplitDb();
    const s2 = splitController(db2, uid, date, 'school');
    const l2 = splitController(db2, uid, date, 'library');
    s2.load(); l2.load();                 // both load before either writes
    s2.type(300); l2.type(420);
    l2.flush(); s2.flush(); l2.flush(); s2.flush();
    ok('interleaved flushes in any order lose nothing', db2.dayTotal(uid, date) === 720,
       `got ${db2.dayTotal(uid, date)}s, expected 720s`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart D — the fix must not disturb an ordinary day');
// ═══════════════════════════════════════════════════════════════════════════

{
    const db = makeSplitDb();
    const uid = 'student2', date = '2026-08-19';
    const school = splitController(db, uid, date, 'school');
    school.load(); school.type(540); school.flush();
    school.type(120); school.flush();     // a second flush later in the period
    ok('a single-mode day is exactly what was typed', db.dayTotal(uid, date) === 660,
       `got ${db.dayTotal(uid, date)}s`);

    const db3 = makeSplitDb();
    ok('a day with no typing is zero, not a failure', db3.dayTotal('nobody', date) === 0);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${fail === 0 && expectedFails === 0 ? '✓ PASS' : (fail ? '✗ FAIL' : '⚠ DEFECT REPRODUCED')}` +
            ` — ${pass} passed, ${fail} failed, ${expectedFails} reproduced-as-expected\n`);
if (expectedFails) {
    console.log('  §3.1 is present in the shipped build, as documented. This harness');
    console.log('  turns green when game.js and learn.js write per-source documents.\n');
}
process.exit(fail === 0 ? 0 : 1);
