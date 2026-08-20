// tab-lifetime-test.mjs v1.0.0 — Round 21 (Hammond).
//
// ⚠️ THE AXIS NOTHING TESTED. Every counting defect of the last six rounds lived
// in one of four places: a security rule, a browser tab's lifetime, a clock, or
// a query scope. Three of those now have a harness. THIS IS THE FOURTH.
//
// §3.1 — the cross-mode day-total overwrite — is not a logic error. Every
// function involved is correct in isolation and every existing harness passes.
// The defect only exists in the SEQUENCE: which page loaded when, which one is
// still open, and which one writes last. Nothing in tests/ modelled a sequence
// until now, which is exactly why thirty-odd green harnesses never saw it.
//
// ⚠️ WHAT THIS HARNESS IS NOT. It does not test game.js or learn.js. It is a
// MODEL of the two controllers — a page that loads a day total, ticks it, and
// flushes it — driven through orderings a real classroom produces. A model can
// be wrong about the code it models. What it CAN do, which nothing else here
// does, is answer "does this shape of write survive two tabs" before four
// hundred children find out for us. Rule 10 says fail on real data first; this
// is the cheapest way to fail on real SHAPES first.
//
// ⚠️ THE ORDERINGS ARE NOT HYPOTHETICAL. game.js v3.28.0's own header records
// that school MacBooks do not restart between periods, so a tab opened in first
// period is still open at lunch. That is Part C, and it is the common case, not
// the edge case.
//
// Run: node tests/tab-lifetime-test.mjs

let failures = 0, checks = 0;
const eq = (label, got, want) => {
    checks++;
    if (got !== want) { failures++; console.log(`  FAIL ${label}\n         got ${got}, want ${want}`); }
    else console.log(`  ok   ${label}`);
};

// ═════════════════════════════════════════════════════════════════════════════
// THE MODEL
// ═════════════════════════════════════════════════════════════════════════════

// One Firestore document, one day, per student. setDoc(merge:true) semantics:
// named fields are replaced, unnamed fields are left alone. That merge is the
// whole of §3.1 — `seconds` is a named field on every write, so the last writer
// replaces it wholesale no matter what it knew.
function makeDoc() {
    return { store: {}, writes: 0 };
}
function mergeWrite(doc, fields) {
    doc.writes++;
    for (const [k, v] of Object.entries(fields)) doc.store[k] = v;
}

// A page controller. `source` is 'library' (game.js) or 'school' (learn.js).
//
// SHIPPED shape: seeds a cross-mode counter from the day total and writes the
// whole total back under `seconds`.
function openShipped(doc, source) {
    // Stage 1 (game.js v3.31.0 / learn.js v2.16.0): seed today's total from the
    // shared document at load. This is why SEQUENTIAL use is already safe and
    // why §3.1 has been mis-described as "every two-mode day loses time."
    const seeded = doc.store.seconds || 0;
    return {
        source,
        secondsToday: seeded,
        tick(n = 1) { this.secondsToday += n; return this; },
        flush() { mergeWrite(doc, { seconds: this.secondsToday }); return this; },
    };
}

// PROPOSED shape (HANDOFF §0.-5.C option 2 / ROADMAP Phase B): each controller
// keeps its OWN counter, seeded from its OWN field, and writes only that field.
//
// ⚠️ THE COUNTER MUST SEED FROM ITS OWN FIELD, NEVER FROM THE DAY TOTAL. Seeding
// from the total is precisely the game.js v3.29.0 bug: it folds the other mode's
// time into your own bucket, and then the reader adds it a second time. Part E
// drives that mistake deliberately so it can never ship unnoticed again.
function openSplit(doc, source) {
    const field = source === 'library' ? 'secondsLibrary' : 'secondsSchool';
    return {
        source, field,
        mine: doc.store[field] || 0,
        // The student-facing figure stays the whole-day total, so the HUD does
        // not change meaning. Only the WRITE is per-source.
        display() { return readSplit(doc.store); },
        tick(n = 1) { this.mine += n; return this; },
        flush() { mergeWrite(doc, { [this.field]: this.mine }); return this; },
    };
}

// The shipped reader: legacy-first (daylog.js totalsOf, reports.html
// readLogTotals). If `seconds` is present at all it wins and the splits are
// ignored — which is the READ-SIDE BLOCKER, not a rules problem.
const readLegacyFirst = (d) =>
    ('seconds' in d) ? (d.seconds || 0)
                     : (d.secondsLibrary || 0) + (d.secondsSchool || 0);

// The proposed reader: flat + both splits. The flat field is frozen at cutover
// and never written again, so it is the pre-cutover remainder rather than a
// duplicate of anything.
const readSplit = (d) =>
    (d.seconds || 0) + (d.secondsLibrary || 0) + (d.secondsSchool || 0);

console.log('\n── A. sequential use: Library, closed, then School ──');
console.log('   The common case, and it is ALREADY CORRECT on the shipped build.');
console.log('   Recorded so nobody "fixes" a path that works.');
{
    const doc = makeDoc();
    const lib = openShipped(doc, 'library');
    lib.tick(600).flush();                       // 10 minutes of reading, tab closed
    const school = openShipped(doc, 'school');   // opens AFTER, seeds from the doc
    school.tick(600).flush();
    eq('shipped: sequential two-mode day keeps all 20 minutes',
       readLegacyFirst(doc.store), 1200);
}

console.log('\n── B. concurrent tabs: both open, Library flushes last ──');
{
    const doc = makeDoc();
    const lib = openShipped(doc, 'library');     // both seeded at 0
    const school = openShipped(doc, 'school');
    school.tick(600).flush();                    // School stores 600
    lib.tick(600).flush();                       // Library still thinks the day is 0+600
    eq('shipped: concurrent tabs lose a mode entirely',
       readLegacyFirst(doc.store), 600);         // ⚠️ 600 of 1200. THE DEFECT.
}

console.log('\n── C. the stale tab: first period, still open after lunch ──');
console.log('   ⚠️ THE COMMON CASE ON A MACHINE THAT NEVER RESTARTS (game.js v3.28.0).');
{
    const doc = makeDoc();
    const lib = openShipped(doc, 'library');     // 1st period, seeded 0
    lib.tick(600).flush();                       // 10 min, tab LEFT OPEN
    const school = openShipped(doc, 'school');   // 3rd period, seeds 600 — correct
    school.tick(600).flush();                    // doc now 1200 — correct
    lib.tick(60).flush();                        // student clicks the old tab, types 1 min
    eq('shipped: the stale tab overwrites the newer total',
       readLegacyFirst(doc.store), 660);         // ⚠️ 660, not 1260. 10 minutes gone.
}

console.log('\n── D. the same three orderings on the PROPOSED split-field shape ──');
{
    const a = makeDoc();
    openSplit(a, 'library').tick(600).flush();
    openSplit(a, 'school').tick(600).flush();
    eq('split: sequential keeps 20 minutes', readSplit(a.store), 1200);

    const b = makeDoc();
    const bl = openSplit(b, 'library'), bs = openSplit(b, 'school');
    bs.tick(600).flush();
    bl.tick(600).flush();
    eq('split: concurrent tabs keep 20 minutes', readSplit(b.store), 1200);

    const c = makeDoc();
    const cl = openSplit(c, 'library');
    cl.tick(600).flush();
    openSplit(c, 'school').tick(600).flush();
    cl.tick(60).flush();                          // the stale tab writes ONLY its own field
    eq('split: the stale tab can no longer touch the other mode',
       readSplit(c.store), 1260);
}

console.log('\n── E. the v3.29.0 mistake, driven on purpose ──');
console.log('   ⚠️ A per-source counter seeded from the DAY TOTAL double-counts.');
console.log('   This part must stay red-proof: it asserts the WRONG number so');
console.log('   that shipping the wrong seeding is a visible change here.');
{
    const doc = makeDoc();
    openSplit(doc, 'library').tick(600).flush();  // secondsLibrary = 600
    // The bug: School seeds from the day total (600) instead of its own field (0).
    const bad = { field: 'secondsSchool', mine: readSplit(doc.store) };
    bad.mine += 600;
    mergeWrite(doc, { [bad.field]: bad.mine });
    eq('v3.29.0 seeding inflates the day to 1800 instead of 1200',
       readSplit(doc.store), 1800);
    console.log('        ↑ 1800 is the DEFECT being demonstrated, not a target.');
}

console.log('\n── F. the migration hazard: a day that already has a flat write ──');
console.log('   ⚠️ THE READ-SIDE BLOCKER. This is why Phase B ships the READERS');
console.log('   first and alone, and why the flat field is frozen, not deleted.');
{
    const doc = makeDoc();
    openShipped(doc, 'library').tick(600).flush();   // pre-cutover: seconds = 600
    openSplit(doc, 'school').tick(600).flush();      // post-cutover: secondsSchool = 600

    eq('legacy-first reader silently drops everything after cutover',
       readLegacyFirst(doc.store), 600);             // ⚠️ 600 of 1200
    eq('flat-plus-splits reader keeps both sides',
       readSplit(doc.store), 1200);
}

console.log('\n── G. Rule 11: the student and the teacher read the same number ──');
console.log('   ⚠️ INCLUDING WHEN THE NUMBER IS WRONG. Agreement is necessary and');
console.log('   not sufficient; Part B is agreement on a wrong figure.');
{
    const doc = makeDoc();
    const lib = openShipped(doc, 'library');
    const school = openShipped(doc, 'school');
    school.tick(600).flush();
    lib.tick(600).flush();
    const studentHud = readLegacyFirst(doc.store);   // hud.js via daylog.readWeek
    const teacherCol = readLegacyFirst(doc.store);   // reports.html readLogTotals
    eq('shipped: student HUD and teacher report agree', studentHud, teacherCol);

    const d2 = makeDoc();
    const l2 = openSplit(d2, 'library'), s2 = openSplit(d2, 'school');
    s2.tick(600).flush();
    l2.tick(600).flush();
    eq('split: student HUD and teacher report agree', l2.display(), readSplit(d2.store));
}

console.log('\n── H. midnight, and why it is NOT §3.1 ──');
console.log('   ⚠️ OBSERVED ON REAL DATA 2026-08-20 (HANDOFF §0.-5.I): a session');
console.log('   rollup of 4m 9s at 12:00 AM beside a daily log of 0m 6s. This part');
console.log('   models the HYPOTHESIS ONLY — that the day counter rolls over inside');
console.log('   the tick while a sprint is dated by its chunk — so that a future');
console.log('   round has something concrete to confirm or refute against the code.');
console.log('   ⚠️ IT IS NOT A DIAGNOSIS. Do not cite this part as one.');
{
    const d1 = makeDoc(), d2 = makeDoc();          // 08-19 and 08-20
    const tab = openShipped(d1, 'library');
    tab.tick(243).flush();                          // 11:56 PM → 11:59:59, filed to 08-19
    // Midnight: the tick resets the in-memory counter and the page starts
    // writing to tomorrow's document.
    const after = openShipped(d2, 'library');
    after.tick(6).flush();                          // 6 seconds after midnight
    eq('the day counter SPLITS a midnight sprint across two documents',
       readLegacyFirst(d1.store) + readLegacyFirst(d2.store), 249);
    eq('and tomorrow\'s document holds only the post-midnight seconds',
       readLegacyFirst(d2.store), 6);
    console.log('        ↑ a sprint rollup dated by its chunk would file all 249s');
    console.log('          under ONE date. That asymmetry is the thing to check.');
}

console.log('');
if (failures) {
    console.log(`FAIL — ${failures} of ${checks} checks failed.`);
    process.exitCode = 1;
} else {
    console.log(`All ${checks} checks pass.`);
    console.log('');
    console.log('⚠️ PARTS B, C and F PASS BY ASSERTING A DEFECT. They are green');
    console.log('   because the shipped build loses the time they say it loses.');
    console.log('   When Phase B lands, B/C/F must be rewritten to assert the');
    console.log('   CORRECT totals and must fail before the writers change.');
}
