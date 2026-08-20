// crossmode-overwrite-test.mjs v2.0.0
//
// ⚠️ PATHS: sources are read as `../` — this file lives in tests/ (Round 17).
//
// ═══════════════════════════════════════════════════════════════════════════
// v2.0.0 — §3.1 IS FIXED AND THIS HARNESS NOW GUARDS THE FIX INSTEAD OF
// DOCUMENTING THE DEFECT. READ THIS BEFORE EDITING ANYTHING BELOW.
// ═══════════════════════════════════════════════════════════════════════════
//
// v1.0.0 reproduced §3.1 — game.js and learn.js each writing the WHOLE day
// total under `seconds`, so whichever flushed last erased the other's
// contribution — and modelled the fix as PER-SOURCE DOCUMENTS: one
// `{uid}_{date}_{source}` document per mode.
//
// ⚠️ THAT FIX WAS NEVER DEPLOYABLE AND THE HARNESS COULD NOT KNOW. The deployed
// firestore.rules bind the document id to the date — `docId == uid + '_' +
// date` — so a third segment is PERMISSION_DENIED. Round 21 found that by
// running the rules emulator against the real file rather than reading it
// (HANDOFF §0.-5.B); rules-probe.test.mjs Part B is the executed evidence. A
// green Part C here was describing a shape Firestore would have rejected on the
// first write of first period.
//
// ⚠️ THE LESSON IS NOT "THE MODEL WAS WRONG". It is that a harness modelling a
// FIX rather than the SHIPPED CODE proves only that the author's idea is
// internally consistent. Part A below is the part that was always worth having:
// it reads the real files. Everything else is arithmetic around it.
//
// The shipped fix is per-source FIELDS on the one permitted document —
// secondsLibrary/secondsSchool — which the rules have allowed since v2.4.0 and
// which needs no rules deploy at all.
//
// Part A — STRUCTURAL: the real game.js and learn.js each write their OWN
//          source's fields through the shared gate, and neither writes the
//          other's. This is the assertion that would notice §3.1 coming back.
// Part B — the scenario that lost ten minutes of twenty, driven on the new
//          shape: nothing is lost.
// Part C — the shape must not disturb an ordinary single-mode day.
// Part D — the pre-cutover path is BYTE-FOR-BYTE the old behaviour, including
//          its defect. Deploy day is not cutover day and the old shape has to
//          keep behaving exactly as it did until the date arrives.

import fs from 'fs';
import { dayLogPayloadFor, SOURCE_FIELDS, SOURCE_SPLIT_CUTOVER, totalsOf } from '../daylog.js';

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

const gameSrc  = fs.readFileSync(new URL('../game.js',  import.meta.url), 'utf8');
const learnSrc = fs.readFileSync(new URL('../learn.js', import.meta.url), 'utf8');
const stripComments = (src) => src.replace(/^\s*\/\/.*$/gm, '');
const gameCode  = stripComments(gameSrc);
const learnCode = stripComments(learnSrc);

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart A — structural: each page writes its own source and only its own');
// ═══════════════════════════════════════════════════════════════════════════

ok('game.js writes typing_logs',  /setDoc\(doc\(db,\s*["']typing_logs["']/.test(gameCode));
ok('learn.js writes typing_logs', /setDoc\(doc\(db,\s*['"]typing_logs['"]/.test(learnCode));

// ⚠️ THE PAYLOAD COMES FROM THE SHARED HELPER, NOT FROM AN INLINE OBJECT. That
// is what keeps the two files from drifting on the field names AND on the
// cutover date at the same time. An inlined `date >= '2026-08-22'` in either
// file is the Rule 9 failure this project has already paid for twice.
ok('game.js builds its payload with dayLogPayloadFor(\'library\')',
   /dayLogPayloadFor\(\s*['"]library['"]/.test(gameCode));
ok('learn.js builds its payload with dayLogPayloadFor(\'school\')',
   /dayLogPayloadFor\(\s*['"]school['"]/.test(learnCode));

// ⚠️⚠️ THE ONE ASSERTION THAT WOULD CATCH §3.1 COMING BACK. Neither page may
// name the other's fields anywhere in its code. Not in the write, not in a
// recovery path, not in a "helpful" reconciliation. The whole fix is that a
// merge from one page cannot mention the other's fields; a page that names them
// has rebuilt the shared resource whatever it thought it was doing.
//
// Comments are stripped first, deliberately: BOTH files discuss the other
// mode's fields at length in their headers and must go on being able to.
for (const [label, code, forbidden] of [
    ['game.js',  gameCode,  SOURCE_FIELDS.school],
    ['learn.js', learnCode, SOURCE_FIELDS.library],
]) {
    for (const field of Object.values(forbidden)) {
        // Assignment or object-key use of the other source's field. A bare
        // mention inside a seeded statsData literal is fine — that is the
        // carried copy — so this looks for the field being WRITTEN into a
        // Firestore payload, i.e. followed by a colon at the top of an object
        // passed to setDoc. Simplest reliable proxy: the field name must never
        // appear as a computed write target.
        const wrote = new RegExp(`${field}\\s*:\\s*(statsData|Math|projected|payload)`).test(code);
        ok(`${label}: never writes ${field} into a Firestore payload`, !wrote,
           'a page that writes the other mode\'s field has rebuilt §3.1');
    }
}

// ⚠️ AND THE INCREMENT IS SINGLE-SITED, per source, on both pages. A second
// increment site is a second clock — open-unit-test.mjs Part E owns the
// cross-mode counter; this owns the per-source one, which that harness does not
// know about.
ok(`game.js increments secondsLibrary in exactly ONE place`,
   (gameCode.match(/statsData\.secondsLibrary\+\+/g) || []).length === 1,
   `found ${(gameCode.match(/statsData\.secondsLibrary\+\+/g) || []).length}`);
ok(`learn.js increments secondsSchool in exactly ONE place`,
   (learnCode.match(/statsData\.secondsSchool\+\+/g) || []).length === 1,
   `found ${(learnCode.match(/statsData\.secondsSchool\+\+/g) || []).length}`);

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart B — the scenario that lost ten minutes of twenty');
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake's actual room. A student opens Library first period and types. The
// Chromebook is supposed to restart between periods and sometimes does not
// (game.js v3.28.0's own incident note), so that tab survives with its in-memory
// counters intact. The student then opens School and types more. Both flush.

const POST = SOURCE_SPLIT_CUTOVER;   // the first day the new shape is live

function makeDoc() {
    return { store: {}, writes: 0 };
}
function mergeWrite(doc, fields) {
    doc.writes++;
    for (const [k, v] of Object.entries(fields)) doc.store[k] = v;
}
// The day, as every reader in the app computes it.
const dayTotal = (doc, date) => totalsOf(doc.store, date).seconds;

// A page controller built on the SHIPPED helper — not a hand-rolled copy of it.
// If dayLogPayloadFor() ever starts naming a different field, every scenario
// below moves with it rather than quietly testing an obsolete shape.
function page(doc, source, date) {
    const own = SOURCE_FIELDS[source];
    return {
        // ⚠️ SEEDS FROM ITS OWN FIELD. Never from the day total — that is the
        // v3.29.0 bug (tab-lifetime-test.mjs Part E drives it deliberately).
        mine: { seconds: doc.store[own.seconds] || 0,
                chars:   doc.store[own.chars]   || 0,
                mistakes: doc.store[own.mistakes] || 0 },
        day:  { seconds: totalsOf(doc.store, date).seconds, chars: 0, mistakes: 0 },
        type(secs) { this.mine.seconds += secs; this.day.seconds += secs; return this; },
        flush() { mergeWrite(doc, dayLogPayloadFor(source, date, { day: this.day, own: this.mine })); return this; },
    };
}

{
    const doc = makeDoc();
    const library = page(doc, 'library', POST);
    library.type(600).flush();                    // ten minutes in a book

    const school = page(doc, 'school', POST);     // opens after, seeds its own field at 0
    school.type(600).flush();
    ok('a two-mode day stores the full 20 minutes', dayTotal(doc, POST) === 1200,
       `stored ${dayTotal(doc, POST)}s`);

    // ⚠️ AND NOW THE STALE FIRST-PERIOD TAB FLUSHES AGAIN. On the old shape this
    // line wrote 600 over the 1200 and ten minutes ceased to exist.
    library.flush();
    ok('the stale first-period tab can no longer erase the other mode',
       dayTotal(doc, POST) === 1200, `stored ${dayTotal(doc, POST)}s`);

    library.type(60).flush();
    ok('and its own later minute still lands', dayTotal(doc, POST) === 1260,
       `stored ${dayTotal(doc, POST)}s`);
}

{
    // Order must not matter at all — that is the point of removing the shared
    // field. Both pages load before either writes, then interleave.
    const doc = makeDoc();
    const s = page(doc, 'school', POST), l = page(doc, 'library', POST);
    s.type(300); l.type(420);
    l.flush(); s.flush(); l.flush(); s.flush();
    ok('interleaved flushes in any order lose nothing', dayTotal(doc, POST) === 720,
       `got ${dayTotal(doc, POST)}s, expected 720s`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart C — an ordinary single-mode day is undisturbed');
// ═══════════════════════════════════════════════════════════════════════════

{
    const doc = makeDoc();
    const school = page(doc, 'school', POST);
    school.type(540).flush();
    school.type(120).flush();          // a second flush later in the period
    ok('a single-mode day is exactly what was typed', dayTotal(doc, POST) === 660,
       `got ${dayTotal(doc, POST)}s`);

    ok('a day with no typing is zero, not a failure', dayTotal(makeDoc(), POST) === 0);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart D — before the cutover, NOTHING CHANGES, defect included');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ THIS PART ASSERTS A DEFECT ON PURPOSE AND MUST NOT BE "FIXED". The upload
// and the cutover are different days: game.js and learn.js go up on a
// non-school evening and the shape switches on the date. Until it does, both
// pages write the flat triple exactly as v3.34.0/v2.19.0 did — because every
// reader in the app is legacy-first before that date, so a page writing split
// fields early would file a whole afternoon somewhere nothing reads.
//
// The price of that safety is that §3.1 is still live for the days in between.
// That is the correct trade and it is bounded by the calendar.

{
    const PRE = '2026-08-21';
    const doc = makeDoc();
    const l = page(doc, 'library', PRE);
    l.type(600).flush();
    const s = page(doc, 'school', PRE);
    s.type(600).flush();
    ok('pre-cutover: the flat field is still what gets written',
       'seconds' in doc.store && !('secondsLibrary' in doc.store),
       JSON.stringify(doc.store));
    ok('pre-cutover: sequential use is correct, as it always was',
       dayTotal(doc, PRE) === 1200, `got ${dayTotal(doc, PRE)}s`);

    l.flush();   // the stale tab, on the old shape
    ok('pre-cutover: §3.1 is STILL PRESENT and that is expected until the date',
       dayTotal(doc, PRE) === 600,
       `got ${dayTotal(doc, PRE)}s — if this is 1200 the writers stopped honouring the gate`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${fail === 0 ? '✓ PASS' : '✗ FAIL'} — ${pass} passed, ${fail} failed\n`);
if (fail === 0) {
    console.log(`  §3.1 is closed on and after ${SOURCE_SPLIT_CUTOVER}. Part A is the`);
    console.log('  assertion that would notice it coming back: neither page may name');
    console.log('  the other source\'s fields in a Firestore payload, ever.\n');
}
process.exit(fail === 0 ? 0 : 1);
