// tab-lifetime-test.mjs v2.0.0 — Round 22 (Smith Premier).
//
// ⚠️ THE AXIS NOTHING TESTED. Every counting defect of the last six rounds lived
// in one of four places: a security rule, a browser tab's lifetime, a clock, or
// a query scope. Three of those have a harness. THIS IS THE FOURTH.
//
// §3.1 — the cross-mode day-total overwrite — was never a logic error. Every
// function involved was correct in isolation and thirty-odd harnesses passed.
// The defect existed only in the SEQUENCE: which page loaded when, which one was
// still open, and which one wrote last.
//
// ═══════════════════════════════════════════════════════════════════════════
// v2.0.0 — PARTS B, C AND F NOW ASSERT THE CORRECT TOTALS. READ THIS FIRST.
// ═══════════════════════════════════════════════════════════════════════════
//
// v1.0.0 shipped with B, C and F GREEN BY ASSERTING THE DEFECT: they were green
// precisely because the build lost the time they said it lost. That was honest
// and it was temporary, and v1.0.0's own closing note said so — "when the
// writers land they must be rewritten to assert the correct totals, and must
// fail before the writers change."
//
// ⚠️ HOW THIS ONE FAILS AGAINST THE OLD BUILD, WHICH IS THE WHOLE OF RULE 10.
// The controller these parts drive is NOT chosen by the person editing the
// harness. It is chosen by reading game.js and learn.js: if those files build
// their daily-log payload with dayLogPayloadFor(), the split controller is
// live; otherwise the flat one is. So on a build where the writers have NOT
// shipped, B/C/F drive the flat controller against the correct totals and go
// RED — which is exactly what they should have done all along, and is the state
// you can reproduce by checking out game.js v3.34.0 beside this file.
//
// ⚠️ THAT INDIRECTION IS LOAD-BEARING, NOT CLEVERNESS. A model harness that
// hard-codes which shape it believes is shipped proves only that its author's
// idea is internally consistent — which is how v1.0.0's sibling
// (crossmode-overwrite-test.mjs) spent six rounds validating a per-source
// DOCUMENT design the deployed security rules reject outright. Reading the real
// files is the cheapest way to stop a harness quietly testing a build that does
// not exist.
//
// ⚠️ WHAT THIS HARNESS STILL IS NOT. It does not execute game.js or learn.js.
// It is a MODEL of the two controllers — a page that loads a day, ticks it, and
// flushes — driven through orderings a real classroom produces, with the actual
// shipped payload builder and the actual shipped reader doing the arithmetic in
// the middle. The flush timer, the WAL and the visibility handlers are
// choreography a harness cannot reach and this file does not pretend to.
//
// ⚠️ THE ORDERINGS ARE NOT HYPOTHETICAL. game.js v3.28.0's own header records
// that school MacBooks do not restart between periods, so a tab opened in first
// period is still open at lunch. That is Part C, and it is the common case.
//
// Run: node tests/tab-lifetime-test.mjs

import { readFileSync } from 'node:fs';
import { dayLogPayloadFor, totalsOf, SOURCE_FIELDS, SOURCE_SPLIT_CUTOVER } from '../daylog.js';

let failures = 0, checks = 0;
const eq = (label, got, want) => {
    checks++;
    if (got !== want) { failures++; console.log(`  FAIL ${label}\n         got ${got}, want ${want}`); }
    else console.log(`  ok   ${label}`);
};

// ═════════════════════════════════════════════════════════════════════════════
// WHICH SHAPE IS ACTUALLY SHIPPED
// ═════════════════════════════════════════════════════════════════════════════

const gameSrc  = readFileSync(new URL('../game.js',  import.meta.url), 'utf8');
const learnSrc = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');
const strip = (s) => s.replace(/^\s*\/\/.*$/gm, '');

// ⚠️ BOTH files, or neither. A build where only one page has been updated is
// worse than either consistent state — the updated page writes a field the
// other page's day total does not include — so the harness refuses to call that
// "split" and drives the old shape, which will then fail loudly below.
const WRITERS_ARE_SPLIT =
    /dayLogPayloadFor\(\s*['"]library['"]/.test(strip(gameSrc)) &&
    /dayLogPayloadFor\(\s*['"]school['"]/.test(strip(learnSrc));

console.log(`\n   shipped writers: ${WRITERS_ARE_SPLIT ? 'PER-SOURCE (game.js + learn.js both)' : 'FLAT — the pre-§3.1-fix shape'}`);
console.log(`   cutover: ${SOURCE_SPLIT_CUTOVER}`);

const PRE  = '2026-08-19';                 // a real school day before the cutover
const POST = SOURCE_SPLIT_CUTOVER;         // the first day the new shape is live

// ═════════════════════════════════════════════════════════════════════════════
// THE MODEL
// ═════════════════════════════════════════════════════════════════════════════

// One Firestore document, one day, per student. setDoc(merge:true) semantics:
// named fields are replaced, unnamed fields are left alone. That merge IS §3.1 —
// `seconds` was a named field on every write, so the last writer replaced it
// wholesale no matter what it knew.
function makeDoc(seed = {}) { return { store: { ...seed }, writes: 0 }; }
function mergeWrite(doc, fields) {
    doc.writes++;
    for (const [k, v] of Object.entries(fields)) doc.store[k] = v;
}

// The reader, as every surface in the app computes a day: daylog.js totalsOf(),
// which reports.html's readLogTotals() is held identical to by
// daylog-cutover-test.mjs Part F.
const dayTotal = (doc, date) => totalsOf(doc.store, date).seconds;

// The FLAT controller — the shape shipped through game.js v3.34.0. Seeds a
// cross-mode counter from the day total and writes the whole total back under
// `seconds`. Kept because Part D still drives it deliberately and because a
// build without the writers falls back to it.
function openFlat(doc, source, date) {
    const seeded = dayTotal(doc, date);
    return {
        source, split: false,
        day:  { seconds: seeded, chars: 0, mistakes: 0 },
        mine: { seconds: seeded, chars: 0, mistakes: 0 },
        display() { return this.day.seconds; },
        tick(n = 1) { this.day.seconds += n; this.mine.seconds += n; return this; },
        flush() { mergeWrite(doc, { seconds: this.day.seconds }); return this; },
    };
}

// The SPLIT controller — game.js v3.35.0 / learn.js v2.20.0. Each page keeps its
// OWN counter, seeded from its OWN field, and the shipped dayLogPayloadFor()
// decides what actually gets written.
//
// ⚠️ THE COUNTER SEEDS FROM ITS OWN FIELD, NEVER FROM THE DAY TOTAL. Seeding
// from the total folds the other mode's time into your own bucket and the
// reader then adds it a second time. That is precisely the game.js v3.29.0 bug.
// Part E drives that mistake deliberately so it can never ship unnoticed again.
function openSplit(doc, source, date) {
    const f = SOURCE_FIELDS[source];
    return {
        source, split: true,
        mine: { seconds: doc.store[f.seconds] || 0,
                chars:   doc.store[f.chars]   || 0,
                mistakes: doc.store[f.mistakes] || 0 },
        // The student-facing figure stays the whole-day total, so the HUD does
        // not change meaning. Only the WRITE is per-source.
        day:  { seconds: dayTotal(doc, date), chars: 0, mistakes: 0 },
        display() { return this.day.seconds; },
        tick(n = 1) { this.mine.seconds += n; this.day.seconds += n; return this; },
        flush() {
            mergeWrite(doc, dayLogPayloadFor(this.source, date, { day: this.day, own: this.mine }));
            return this;
        },
    };
}

// ⚠️ THE CHOICE IS MADE BY THE SHIPPED FILES, NOT BY THIS FILE. See the header.
const open = (doc, source, date) =>
    (WRITERS_ARE_SPLIT && date >= SOURCE_SPLIT_CUTOVER)
        ? openSplit(doc, source, date)
        : openFlat(doc, source, date);

console.log('\n── A. sequential use: Library, closed, then School ──');
console.log('   The common case, and it was ALREADY CORRECT before the fix.');
console.log('   Recorded so nobody "fixes" a path that works.');
{
    const doc = makeDoc();
    const lib = open(doc, 'library', POST);
    lib.tick(600).flush();                       // 10 minutes of reading, tab closed
    const school = open(doc, 'school', POST);    // opens AFTER, seeds from the doc
    school.tick(600).flush();
    eq('sequential two-mode day keeps all 20 minutes', dayTotal(doc, POST), 1200);
}

console.log('\n── B. concurrent tabs: both open, Library flushes last ──');
console.log('   ⚠️ ASSERTS THE CORRECT TOTAL (v2.0.0). On the flat shape this');
console.log('   stored 600 of 1200 and this part was GREEN saying so.');
{
    const doc = makeDoc();
    const lib = open(doc, 'library', POST);      // both seeded at 0
    const school = open(doc, 'school', POST);
    school.tick(600).flush();                    // School stores its 600
    lib.tick(600).flush();                       // Library stores its own 600
    eq('concurrent tabs keep both modes', dayTotal(doc, POST), 1200);
}

console.log('\n── C. the stale tab: first period, still open after lunch ──');
console.log('   ⚠️ THE COMMON CASE ON A MACHINE THAT NEVER RESTARTS (game.js v3.28.0).');
console.log('   ⚠️ ASSERTS THE CORRECT TOTAL (v2.0.0). On the flat shape this stored');
console.log('   660 instead of 1260 — ten minutes gone — and was GREEN saying so.');
{
    const doc = makeDoc();
    const lib = open(doc, 'library', POST);      // 1st period, seeded 0
    lib.tick(600).flush();                       // 10 min, tab LEFT OPEN
    const school = open(doc, 'school', POST);    // 3rd period
    school.tick(600).flush();
    eq('the newer total survives the other mode', dayTotal(doc, POST), 1200);

    lib.tick(60).flush();                        // student clicks the old tab, types 1 min
    eq('the stale tab adds its own minute and erases nothing',
       dayTotal(doc, POST), 1260);

    // ⚠️ AND THE STALE TAB FLUSHING WITH NOTHING NEW IS A NO-OP ON THE DAY.
    // This is the assertion that would catch a "helpful" reconciliation being
    // added back into the write path: a flush that knows only half the day must
    // never write anything that describes the whole of it.
    lib.flush();
    eq('a stale tab re-flushing changes nothing at all', dayTotal(doc, POST), 1260);
}

console.log('\n── D. the same orderings on the FLAT shape, for the record ──');
console.log('   ⚠️ THIS PART ASSERTS THE DEFECT ON PURPOSE. It is the pre-cutover');
console.log('   behaviour and it is still live until the date arrives — see I.');
{
    const b = makeDoc();
    const bl = openFlat(b, 'library', PRE), bs = openFlat(b, 'school', PRE);
    bs.tick(600).flush();
    bl.tick(600).flush();
    eq('flat: concurrent tabs lose a mode entirely', dayTotal(b, PRE), 600);

    const c = makeDoc();
    const cl = openFlat(c, 'library', PRE);
    cl.tick(600).flush();
    openFlat(c, 'school', PRE).tick(600).flush();
    cl.tick(60).flush();
    eq('flat: the stale tab overwrites the newer total', dayTotal(c, PRE), 660);
}

console.log('\n── E. the v3.29.0 mistake, driven on purpose ──');
console.log('   ⚠️ A per-source counter seeded from the DAY TOTAL double-counts.');
console.log('   This part asserts the WRONG number so that shipping the wrong');
console.log('   seeding is a visible change here.');
{
    const doc = makeDoc();
    openSplit(doc, 'library', POST).tick(600).flush();   // secondsLibrary = 600
    // The bug: School seeds from the day total (600) instead of its own field (0).
    const bad = openSplit(doc, 'school', POST);
    bad.mine.seconds = dayTotal(doc, POST);              // ⚠️ the mistake
    bad.tick(600).flush();
    eq('v3.29.0 seeding inflates the day to 1800 instead of 1200',
       dayTotal(doc, POST), 1800);
    console.log('        ↑ 1800 is the DEFECT being demonstrated, not a target.');
}

console.log('\n── F. the migration seam: a day that already has a flat write ──');
console.log('   ⚠️ ASSERTS THE CORRECT TOTAL (v2.0.0). This is the cutover day');
console.log('   itself: a morning written flat by a cached page, an afternoon');
console.log('   written per-source. BOTH are real and both must count.');
{
    // A student whose browser still had the old build in the morning.
    const doc = makeDoc({ seconds: 600 });
    const school = open(doc, 'school', POST);
    school.tick(600).flush();

    eq('flat morning plus split afternoon reads as the whole day',
       dayTotal(doc, POST), 1200);

    // ⚠️ AND THE FLAT FIELD IS FROZEN, NOT DELETED. totalsOf() adds it to the
    // splits after the cutover precisely because nothing writes it again; a page
    // that overwrote it would make that assumption false the moment it did.
    eq('the frozen flat field is left exactly as it was', doc.store.seconds, 600);
}

console.log('\n── G. Rule 11: the student and the teacher read the same number ──');
console.log('   ⚠️ AGREEMENT IS NECESSARY AND NOT SUFFICIENT — Part D is agreement');
console.log('   on a wrong figure. This part holds the necessary half.');
{
    const doc = makeDoc();
    const lib = open(doc, 'library', POST);
    const school = open(doc, 'school', POST);
    school.tick(600).flush();
    lib.tick(600).flush();

    // ⚠️ A LIVE TAB IS STALE BY WHATEVER ANOTHER TAB HAS DONE SINCE IT LOADED,
    // AND THAT IS TRUE OF EVERY SHAPE THIS APP HAS EVER HAD. `lib` opened before
    // School wrote anything, so its in-memory day is its own 600. That is not
    // §3.1 and it is not fixable with a field layout — an in-memory counter
    // cannot know about a write it did not make. What CHANGED is the
    // consequence: the stale tab used to PUBLISH its stale figure over the real
    // one. Now it publishes only its own field and the day stays whole.
    eq('a concurrently-open tab shows its own contribution, and stores it',
       lib.display(), 600);
    eq('while the document holds the whole day', dayTotal(doc, POST), 1200);

    // ⚠️ RULE 11 IS A PROPERTY OF A PAGE LOAD, NOT OF EVERY INSTANT. The
    // guarantee is that when a student's page reads the document, it reads the
    // SAME document the teacher grades from and gets the SAME number. That is
    // what this asserts, and it is the assertion that was false for five rounds.
    const reloaded = open(doc, 'library', POST);
    const studentHud = reloaded.display();       // hud.js via daylog.readWeek
    const teacherCol = dayTotal(doc, POST);      // reports.html readLogTotals
    eq('on reload, student HUD and teacher report agree', studentHud, teacherCol);

    // ⚠️ AND THE HUD IS THE WHOLE DAY, NOT THIS PAGE'S HALF OF IT. The write is
    // per-source; the DISPLAY never was and must never become so. A student who
    // did ten minutes of each is owed a screen that says twenty.
    eq('and it is the whole day, not one mode', studentHud, 1200);
}

console.log('\n── H. midnight, and why it is NOT §3.1 ──');
console.log('   ⚠️ OBSERVED ON REAL DATA 2026-08-20 (HANDOFF §0.-5.I): a session');
console.log('   rollup of 4m 9s at 12:00 AM beside a daily log of 0m 6s. This part');
console.log('   models the HYPOTHESIS ONLY — that the day counter rolls over inside');
console.log('   the tick while a sprint is dated by its chunk — so that a future');
console.log('   round has something concrete to confirm or refute against the code.');
console.log('   ⚠️ IT IS NOT A DIAGNOSIS. Do not cite this part as one.');
{
    const d1 = makeDoc(), d2 = makeDoc();          // two consecutive days
    const tab = open(d1, 'library', POST);
    tab.tick(243).flush();                          // 11:56 PM → 11:59:59
    // Midnight: the tick resets the in-memory counters (both of them, v3.35.0)
    // and the page starts writing to tomorrow's document.
    const after = open(d2, 'library', POST);
    after.tick(6).flush();                          // 6 seconds after midnight
    eq('the day counter SPLITS a midnight sprint across two documents',
       dayTotal(d1, POST) + dayTotal(d2, POST), 249);
    eq('and tomorrow\'s document holds only the post-midnight seconds',
       dayTotal(d2, POST), 6);
    console.log('        ↑ a sprint rollup dated by its chunk would file all 249s');
    console.log('          under ONE date. That asymmetry is the thing to check.');
}

console.log('\n── I. the deploy is not the cutover ──');
console.log('   ⚠️ THE UPLOAD LANDS ON A NON-SCHOOL EVENING; THE SHAPE SWITCHES ON');
console.log('   THE DATE. Until it does, the live writers must produce the OLD');
console.log('   payload exactly — every reader is legacy-first before the cutover,');
console.log('   so a split field written early is filed where nothing reads it.');
{
    const doc = makeDoc();
    const lib = open(doc, 'library', PRE);
    lib.tick(600).flush();
    eq('pre-cutover the live writer still names the flat field',
       'seconds' in doc.store && !('secondsLibrary' in doc.store), true);
    eq('and a pre-cutover day reads exactly as it always did',
       dayTotal(doc, PRE), 600);

    // The day before the cutover and the cutover day are consecutive; the gate
    // is a string compare on YYYY-MM-DD and this is the boundary it turns on.
    const d2 = makeDoc();
    open(d2, 'library', POST).tick(600).flush();
    eq('on the cutover day itself the live writer names the split field',
       WRITERS_ARE_SPLIT ? ('secondsLibrary' in d2.store) : ('seconds' in d2.store), true);
}

console.log('');
if (failures) {
    console.log(`FAIL — ${failures} of ${checks} checks failed.`);
    if (!WRITERS_ARE_SPLIT) {
        console.log('');
        console.log('⚠️ THE SHIPPED WRITERS ARE STILL FLAT. Parts B, C and F assert the');
        console.log('   CORRECT totals now, and the flat shape cannot produce them —');
        console.log('   that is what this harness is for. Ship game.js v3.35.0 and');
        console.log('   learn.js v2.20.0 together and these turn green.');
    }
    process.exitCode = 1;
} else {
    console.log(`All ${checks} checks pass.`);
    console.log('');
    console.log('⚠️ PARTS D AND E STILL ASSERT DEFECTS ON PURPOSE — D is the');
    console.log('   pre-cutover shape, E is the v3.29.0 seeding mistake. Neither is');
    console.log('   a target. Everything else here asserts what a student earned.');
}
