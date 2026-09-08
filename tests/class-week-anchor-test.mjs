// class-week-anchor-test.mjs v1.0.0 — ROADMAP 58 STEP TWO: A CLASS CAN CHOOSE
// ITS OWN WEEK, THE WIRING HALF.
//
// week-agreement-test.mjs Part B3 and week-anchor-test.mjs prove the PURE
// function (weekStartOf/weekDatesOf) is correct for every anchor. Neither one
// can prove admin.html's picker actually reaches a class document, or that a
// class with no override actually falls through to the school default rather
// than silently landing on a wrong day. This file is STRUCTURAL — reading the
// shipped source rather than driving a browser — because the surface under
// test is Firestore + DOM in three different files, matching this project's
// own BEHAVIOURAL/STRUCTURAL split (inline-styles-test.mjs, control-tier-test.mjs).

import fs from 'fs';

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

const admin  = fs.readFileSync(new URL('../admin.html',        import.meta.url), 'utf8');
const lesAdm = fs.readFileSync(new URL('../lessons-admin.js',  import.meta.url), 'utf8');
const gameSrc  = fs.readFileSync(new URL('../game.js',  import.meta.url), 'utf8');
const learnSrc = fs.readFileSync(new URL('../learn.js', import.meta.url), 'utf8');

function extractFn(src, name) {
    const at = src.indexOf('function ' + name);
    if (at < 0) return null;
    const brace = src.indexOf('{', at);
    let depth = 0;
    for (let j = brace; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(at, j + 1); }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nA — admin.html: THE PICKER ITSELF');
// ═══════════════════════════════════════════════════════════════════════════

ok('admin.html has the week-start select', /id="class-weekstart-select"/.test(admin));
{
    const m = admin.match(/<select id="class-weekstart-select"[^>]*>([\s\S]*?)<\/select>/);
    ok('the select has a body to check', !!m);
    const body = m ? m[1] : '';
    const values = Array.from(body.matchAll(/<option value="([^"]*)"/g)).map(x => x[1]);
    ok('exactly 8 options: blank + 0..6', values.length === 8 && values[0] === '',
       JSON.stringify(values));
    ok('every day 0-6 is offered exactly once',
       ['0','1','2','3','4','5','6'].every(d => values.filter(v => v === d).length === 1),
       JSON.stringify(values));
}
// ⚠️ THE 4-COLUMN UTILITY MUST BE GONE, NOT ORPHANED. It had exactly one use
// before this round added a 5th field; leaving it declared-and-unused is
// exactly what inline-styles-test.mjs A4 exists to catch.
ok('the old 4-column grid utility was removed, not left orphaned',
   !/\.u-grid-template-columns-2fr-1fr-1fr-1fr\s*\{/.test(admin));
ok('the new 5-column grid utility is declared',
   /\.u-grid-template-columns-2fr-1fr-1fr-1fr-1fr\s*\{/.test(admin));
ok('the class-editor grid uses the 5-column utility',
   (() => {
       // ⚠️ `class-teachers-wrap` is also named in an EARLIER changelog comment
       // near the top of the file — indexOf() alone would find that mention,
       // not the markup. Anchor every search to AFTER the grid itself opens.
       const gridAt = admin.indexOf('u-grid-template-columns-2fr-1fr-1fr-1fr-1fr u-gap-8px');
       if (gridAt < 0) return false;
       const selectAt = admin.indexOf('class-weekstart-select', gridAt);
       const teachersAt = admin.indexOf('id="class-teachers-wrap"', gridAt);
       // The picker must sit AFTER the grid opens and BEFORE the next thing
       // after the grid (the teachers wrap), i.e. inside the same block.
       return selectAt > gridAt && teachersAt > selectAt;
   })());

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nB — lessons-admin.js: saveClass() WRITES THE RIGHT SHAPE');
// ═══════════════════════════════════════════════════════════════════════════

const saveClass = extractFn(lesAdm, 'saveClass');
ok('saveClass() exists', !!saveClass);
const sc = saveClass || '';

ok('reads the picker by id',
   /getElementById\(['"]class-weekstart-select['"]\)/.test(sc));
ok('a non-blank value is parsed as an integer, not stored as a string',
   /record\.weekStartDay\s*=\s*parseInt\(weekStartVal,\s*10\)/.test(sc));
// ⚠️ THIS IS THE ONE THAT MATTERS. deleteField() must fire ONLY on an EDIT —
// a brand-new class choosing "School default" must get no key at all, never a
// deleteField() sentinel written into a document that doesn't exist yet.
ok('deleteField() is scoped to editId — a new class never writes it',
   /if\s*\(editId\)\s*\{\s*record\.weekStartDay\s*=\s*deleteField\(\)/.test(sc),
   'a blank pick on a NEW class must omit the key, not call deleteField()');
ok('deleteField is imported from read-meter.js (SDK re-export, not hand-rolled)',
   /import\s*\{[^}]*\bdeleteField\b[^}]*\}\s*from\s*["']\.\/read-meter\.js["']/.test(lesAdm));
// ⚠️ THE SENTINEL MUST NOT LEAK INTO THE IN-MEMORY CACHE. deleteField() returns
// an opaque object; spreading `record` straight into `_classCache[classId]`
// would store THAT OBJECT as if it were the class's weekStartDay, and the next
// startClassEdit() would read it as a truthy non-integer and show it wrong.
ok('the deleteField() sentinel is stripped from _classCache, not copied in',
   /if\s*\(clearedWeekStartDay\)\s*delete\s*_classCache\[classId\]\.weekStartDay/.test(sc),
   'without this, editing a class to "School default" and reopening it shows garbage');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nC — lessons-admin.js: startClassEdit() / cancelClassEdit()');
// ═══════════════════════════════════════════════════════════════════════════

const startEdit  = extractFn(lesAdm, 'startClassEdit')  || '';
const cancelEdit = extractFn(lesAdm, 'cancelClassEdit') || '';

ok('startClassEdit() sets the picker from the class doc',
   /class-weekstart-select['"]\)\.value\s*=\s*\n?\s*Number\.isInteger\(cls\.weekStartDay\)/.test(startEdit));
// ⚠️ AN ABSENT FIELD MUST SHOW "School default" (''), NEVER "Saturday" (6). A
// class that inherits and a class explicitly pinned to Saturday must not look
// identical in the editor, or nobody could tell them apart to know which ones
// would move if the school default ever changed.
ok('an absent weekStartDay resolves to the blank option, not to 6',
   /:\s*['"]{2}/.test(startEdit.slice(startEdit.indexOf('class-weekstart-select'))),
   'startClassEdit() must fall back to \'\', not \'6\', for a class with no override');
ok('cancelClassEdit() resets the picker to "School default"',
   /class-weekstart-select['"]\)\.value\s*=\s*['"]{2}/.test(cancelEdit));

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nD — game.js / learn.js: THE LADDER, NOT JUST THE FIELD');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ EACH FILE MUST READ THE CLASS'S weekStartDay BEFORE FALLING BACK TO
// settings/goals's, AND ONLY FALL BACK WHEN THE CLASS DIDN'T ANSWER. Getting
// this backwards — settings/goals overriding an explicit class choice — would
// make a school-wide change silently override every class that picked its own
// day, the opposite of what "override" means.

for (const [name, src] of [['game.js', gameSrc], ['learn.js', learnSrc]]) {
    const loadGoals = extractFn(src, 'loadGoals') || '';
    ok(`${name}: loadGoals() reads weekStartDay off the class doc`,
       /Number\.isInteger\(cd\.weekStartDay\)/.test(loadGoals));
    ok(`${name}: an anchor found on the class sets anchorResolved`,
       /anchorResolved\s*=\s*true/.test(loadGoals));
    ok(`${name}: settings/goals is consulted when the class didn't resolve the anchor`,
       /!resolved\s*\|\|\s*!anchorResolved/.test(loadGoals),
       'without this OR, a class with its own minutes but no anchor override never checks the school default');
    ok(`${name}: the school-default fallback is itself guarded by anchorResolved`,
       /!anchorResolved\s*&&\s*Number\.isInteger\(data\.weekStartDay\)/.test(loadGoals) ||
       /!anchorResolved\s*&&\s*Number\.isInteger\(d\.weekStartDay\)/.test(loadGoals),
       'without this guard, settings/goals could overwrite a class\'s explicit choice');
    ok(`${name}: getWeekStart() passes goals.weekStartDay to weekStartOf()`,
       (() => {
           const fn = extractFn(src, 'getWeekStart') || '';
           return /weekStartOf\(/.test(fn) && /,\s*goals\.weekStartDay\)/.test(fn);
       })());
    ok(`${name}: every readWeek() call site sends weekStartDay`,
       (src.match(/readWeek\(\{[^}]*\}\)/g) || []).every(call => /weekStartDay:\s*goals\.weekStartDay/.test(call)),
       'a readWeek() call with no weekStartDay silently reads the DEFAULT anchor for a class that chose otherwise');
}

// ⚠️ GOALS_CACHE_KEY / LEARN_GOALS_KEY MUST BE THE SAME STRING IN BOTH FILES —
// they are deliberately one shared cache (learn.js's own comment says so), and
// a bump in only one turns every load of the OTHER page into a permanent miss.
{
    const gKey = (gameSrc.match(/GOALS_CACHE_KEY\s*=\s*'([^']+)'/) || [])[1];
    const lKey = (learnSrc.match(/LEARN_GOALS_KEY\s*=\s*'([^']+)'/) || [])[1];
    ok('game.js and learn.js share the exact same goals-cache key string',
       !!gKey && gKey === lKey, `game.js='${gKey}' learn.js='${lKey}'`);
    ok('the shared key was bumped to v2 for this feature',
       gKey === 'ttb_goalsCache_v2', gKey);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nE — lessons-admin.js: THE ROSTER FILTER STAYS ON THE DEFAULT, ON PURPOSE');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ _weekStartDate() SPANS CLASSES AND SCHOOLS AT ONCE (the Students-tab "this
// week" filter) — "one class's week" doesn't apply there, and admin.html's
// `This week (Sat–Fri)` label stays true BECAUSE this deliberately never reads
// a per-class or per-school anchor. If this ever gains a second argument, the
// label next to it needs to stop being static text in the same round.
{
    const fn = extractFn(lesAdm, '_weekStartDate') || '';
    ok('_weekStartDate() still calls weekStartOf() with ONE argument',
       /weekStartOf\([^,)]*\)/.test(fn) && !/weekStartOf\([^)]*,/.test(fn),
       'a second argument here means admin.html\'s literal "(Sat–Fri)" label can now lie');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nF — reports.html: resolveWeekAnchor() — JAKE\'S NO-MODAL RULING');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ LIFTED AND DRIVEN WITH A FAKE document, classesById AND me — this is the
// only way to exercise the mismatch/most-common/tie-break logic at all,
// since it's DOM- and Firestore-shaped code with no framework in this repo to
// mount it in. A fake <select> exposes exactly the two things the function
// reads: `.value` and `.options` (an array of `{ value }`).
{
    const reportsSrc = fs.readFileSync(new URL('../reports.html', import.meta.url), 'utf8');
    const fn = extractFn(reportsSrc, 'resolveWeekAnchor');
    ok('resolveWeekAnchor() exists in reports.html', !!fn);

    function run(classSelValue, optionValues, classesById, me, schoolWeekStartDay) {
        const fakeSelect = { value: classSelValue, options: optionValues.map(v => ({ value: v })) };
        const fakeDocument = { getElementById: (id) => id === 'scope-class' ? fakeSelect : null };
        const f = new Function('document', 'classesById', 'me', 'schoolWeekStartDay',
            fn + '\n; return resolveWeekAnchor;')(fakeDocument, classesById, me, schoolWeekStartDay);
        return f();
    }

    // A single named class — never ambiguous, regardless of what else is in view.
    {
        const classesById = { c1: { weekStartDay: 2 }, c2: { weekStartDay: 4 } };
        const r = run('c1', ['__mine__', '__all__', 'c1', 'c2'], classesById, { classIds: [] }, 6);
        ok('a single named class: day = that class\'s own anchor, never a mismatch',
           r.day === 2 && r.mismatch === false, JSON.stringify(r));
    }
    // A named class with NO override falls to the school default.
    {
        const classesById = { c1: {} };
        const r = run('c1', ['c1'], classesById, { classIds: [] }, 3);
        ok('a named class with no override resolves to the school default',
           r.day === 3 && r.mismatch === false, JSON.stringify(r));
    }
    // '__mine__' — every one of the teacher's own classes agrees.
    {
        const classesById = { c1: { weekStartDay: 1 }, c2: { weekStartDay: 1 }, c3: { weekStartDay: 5 } };
        const r = run('__mine__', ['__mine__', 'c1', 'c2', 'c3'], classesById,
                      { classIds: ['c1', 'c2'] }, 6);
        ok('\'__mine__\', all agreeing classes: single anchor, no mismatch',
           r.day === 1 && r.mismatch === false, JSON.stringify(r));
    }
    // '__mine__' — the teacher's own classes disagree: most common wins, and
    // the disagreement is reported.
    {
        const classesById = { c1: { weekStartDay: 1 }, c2: { weekStartDay: 1 }, c3: { weekStartDay: 5 } };
        const r = run('__mine__', ['__mine__', 'c1', 'c2', 'c3'], classesById,
                      { classIds: ['c1', 'c2', 'c3'] }, 6);
        ok('\'__mine__\', disagreeing classes: falls to the MOST COMMON anchor',
           r.day === 1 && r.mismatch === true, JSON.stringify(r));
        ok('the mismatch carries counts a caller can render into a note',
           r.counts instanceof Map && r.counts.get(1) === 2 && r.counts.get(5) === 1,
           JSON.stringify([...(r.counts || [])]));
    }
    // '__all__' reads the <select>'s OWN options, not a separate query — so a
    // class hidden from THIS teacher's dropdown can never sway the answer.
    {
        const classesById = { c1: { weekStartDay: 0 }, c2: { weekStartDay: 0 }, hidden: { weekStartDay: 6 } };
        const r = run('__all__', ['__mine__', '__all__', 'c1', 'c2'], classesById, { classIds: [] }, 6);
        ok('\'__all__\' only counts classes actually offered in the dropdown',
           r.day === 0 && r.mismatch === false, JSON.stringify(r));
    }
    // An exact tie breaks toward the LOWER day number, deterministically.
    {
        const classesById = { c1: { weekStartDay: 5 }, c2: { weekStartDay: 1 } };
        const r = run('__all__', ['__all__', 'c1', 'c2'], classesById, { classIds: [] }, 6);
        ok('an exact tie breaks toward the lower day number',
           r.day === 1 && r.mismatch === true, JSON.stringify(r));
    }
    // Nothing in view at all (e.g. a teacher with no classes yet) — falls
    // back to the school default without throwing.
    {
        const r = run('__mine__', ['__mine__'], {}, { classIds: [] }, 4);
        ok('an empty scope falls back to the school default without throwing',
           r.day === 4 && r.mismatch === false, JSON.stringify(r));
    }
}

console.log(fail ? `\n✗ FAIL — ${pass} passed, ${fail} failed` : `\n✓ PASS — ${pass} passed, 0 failed`);
process.exit(fail ? 1 : 0);
