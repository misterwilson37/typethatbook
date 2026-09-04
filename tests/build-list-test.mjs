// build-list-test.mjs — ROADMAP 51, 56b, 56c, and the staged-work guard.
//
// Four small things that share one property: each is a rule that is easy to
// restate somewhere it does not belong, and cheap to check where it does.
//
// A. THE BUILD LIST SORTS ITS OUTPUT AND NEVER ITS SOURCE.
//    Jake could not find a file in a list ordered by when each module was
//    registered. ⚠️⚠️ THE FIX MUST NOT BE APPLIED TO `SOURCES`: that array is
//    mirrored in tools/audit-versions.mjs and version-stamp-test.mjs §D, half
//    its entries carry positional comments, and it is the only record of
//    registration order. A2 is the case that would catch a later round "tidying"
//    the array instead.
//
// B. ⚠️⚠️ PARSE & INITIALIZE ASKS BEFORE IT DISCARDS STAGED WORK — and asks ONLY
//    when there is work to discard. A confirm on the first parse of every book
//    is a dialog people learn to dismiss, and then it is not there on the press
//    that mattered.
//
// C. AN INLINE `background` BEATS EVERY SELECTOR, so a button that sets one
//    cannot be reached by `button:hover`. This is admin.js v3.42.0's defect
//    class; Round 59 fixed eighteen of them in markup and missed the two that
//    are built in JS. C is a CLASS GUARD over generated buttons, not a list of
//    the two Jake happened to hover over.
//
// D. AND ONE ELEMENT, ONE `class` ATTRIBUTE. The class manager's Delete carried
//    two; HTML keeps the first and silently discards the second, which killed
//    both its hover and its selector hook.

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const versions = read('versions.js');
const adminJs  = read('admin.js');
const adminHtml = read('admin.html');
const lessons  = read('lessons-admin.js');

const results = [];
function check(name, fn) {
    try { fn(); results.push(['ok', name]); }
    catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
}

function fnBody(src, marker) {
    // ⚠️ SKIP THE PARAMETER LIST. renderBuildList's signature carries a
    // destructured default — `{ notes = false } = {}` — so brace-matching from
    // the first `{` after the name returns the PARAMETERS, and every assertion
    // about the body passes vacuously against an empty string.
    const at = src.indexOf(marker);
    if (at < 0) return null;
    const paren = src.indexOf('(', at);
    let d = 0, after = paren;
    for (let i = paren; i < src.length; i++) {
        if (src[i] === '(') d++;
        else if (src[i] === ')') { d--; if (d === 0) { after = i; break; } }
    }
    const open = src.indexOf('{', after);
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(open, i); }
    }
    return null;
}

// ─── A. THE BUILD LIST ───────────────────────────────────────────────────────

check('A1. renderBuildList() sorts by filename', () => {
    const body = fnBody(versions, 'export function renderBuildList');
    assert.ok(body, 'renderBuildList() not found');
    assert.match(body, /\.sort\s*\(/,
        'the list is back in registration order. Jake: "the build info list is in ' +
        'no order I can recognize"');
    assert.match(body, /localeCompare/,
        'sorted by raw comparison, which orders by code unit and puts every ' +
        'capitalised filename ahead of every lower-case one');
});

check('A2. ⚠️⚠️ the sort COPIES — `results` is _buildCache by reference', () => {
    // Three pages call this. An in-place .sort() reorders the cache the NEXT
    // caller reads, which is a bug that only shows on the second call.
    const body = fnBody(versions, 'export function renderBuildList');
    assert.match(body, /\[\s*\.\.\.\s*results\s*\]\s*\.sort|results\.slice\s*\(\s*\)\s*\.sort|Array\.from\s*\(\s*results\s*\)\s*\.sort/,
        '⚠️ the sort runs on `results` directly. That array is _buildCache, handed ' +
        'to every caller BY REFERENCE — sorting it in place quietly reorders what ' +
        'the next page reads');
});

check('A3. ⚠️⚠️ the `SOURCES` array is still in REGISTRATION order', () => {
    // The case that catches a later round sorting the array instead of the
    // output. game.js/learn.js/keyboard.js lead because they were first; an
    // alphabetised array would start with admin.js.
    const arr = versions.slice(versions.indexOf('const SOURCES = ['));
    const files = [...arr.matchAll(/file:\s*'([^']+)'/g)].map(m => m[1]);
    assert.ok(files.length > 25, 'could not read SOURCES (' + files.length + ' entries)');
    const sorted = [...files].sort((a, b) => a.localeCompare(b));
    assert.notDeepEqual(files, sorted,
        '⚠️⚠️ SOURCES has been alphabetised. Put it back: it is mirrored in ' +
        'tools/audit-versions.mjs and version-stamp-test.mjs §D, half its entries ' +
        'carry positional comments that sorting orphans, and it is the only ' +
        'record of when each module entered the build. SORT THE OUTPUT INSTEAD');
    assert.equal(files[0], 'game.js', 'the array no longer starts where it did');
});

// ─── B. THE STAGED-WORK GUARD ───────────────────────────────────────────────

check('B1. ⚠️⚠️ Parse & Initialize confirms before discarding staged chapters', () => {
    const body = fnBody(adminJs, 'createParseBtn.onclick =');
    assert.ok(body, 'the parse handler moved');
    assert.match(body, /stagedChapters\.length\s*>\s*0[\s\S]{0,600}confirm\s*\(/,
        'everything past the file check REPLACES stagedChapters wholesale — every ' +
        'split, merge and retitle since the last parse, none of it in Firestore ' +
        'and no undo. On a forty-chapter book that is an afternoon');
});

check('B2. it names the FILE it is about to parse', () => {
    // ⚠️ v3.25.2's lesson in this panel: the file input survives everything, so
    // the second press reads whatever is sitting in it — which may not be the
    // book you have been editing.
    const body = fnBody(adminJs, 'createParseBtn.onclick =');
    const dlg = /confirm\(([\s\S]{0,700}?)\);/.exec(body);
    assert.ok(dlg, 'no confirm found in the handler');
    assert.match(dlg[1], /file\.name/,
        'the prompt does not say which file it will read. That is the whole ' +
        'v3.25.2 failure: a stale file input and a dialog that does not name it');
});

check('B3. it asks ONLY when there is something to lose', () => {
    // A confirm on the first parse of every book is a dialog people learn to
    // dismiss, and then it is not there on the press that mattered (v3.23.0).
    const body = fnBody(adminJs, 'createParseBtn.onclick =');
    const guard = body.indexOf('stagedChapters.length > 0');
    const dlg = body.indexOf('confirm(', guard >= 0 ? guard : 0);
    assert.ok(guard >= 0 && dlg > guard,
        'the confirm is no longer behind the "is anything staged" test');
});

// ─── C. NO GENERATED BUTTON SETS ITS OWN BACKGROUND ─────────────────────────

check('C1. ⚠️⚠️ no button built in admin.js sets `background` inline', () => {
    // ⚠️ CLASS GUARD, NOT A LIST. Round 59 swept the eighteen inline backgrounds
    // in the MARKUP; the ones built in JS were outside it, and #repair-titles-btn
    // sat there with a dead hover until Jake hovered over it.
    //
    // ⚠️ SCOPED TO BUTTONS BY WHAT createElement() WAS ASKED FOR, not by any
    // cssText anywhere. The first draft flagged showBootstrapWarning()'s <div>,
    // which has no hover state to lose — a check that fires on things that are
    // fine is a check people learn to route around.
    const buttonVars = new Set(
        [...adminJs.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*document\.createElement\(\s*['"]button['"]/g)]
            .map(m => m[1]));
    assert.ok(buttonVars.size > 0, 'no buttons are built in admin.js any more — ' +
        'if that is true this case is obsolete; delete it in that round');
    const bad = [...adminJs.matchAll(/(\w+)\.style\.cssText\s*=\s*([\s\S]{0,400}?);/g)]
        .filter(m => buttonVars.has(m[1]) && /background\s*:/.test(m[2]))
        .map(m => m[1] + ': ' + m[2].slice(0, 40));
    assert.deepEqual(bad, [],
        '⚠️ an inline background beats every selector, so `button:hover` and ' +
        "btn-tint's brightness() cannot reach it. Put the colour in a " +
        '`btn-bg-*` class in admin.html: ' + bad.join(' | '));
});

check('C2. #repair-titles-btn takes its colour from a class', () => {
    assert.match(adminJs, /btn.className\s*=\s*'btn-tint btn-bg-3a2200'/,
        'the repair button no longer declares btn-tint + a background class');
    assert.match(adminHtml, /button\.btn-bg-3a2200:not\(:disabled\)\s*\{\s*background:/,
        'the class is applied in admin.js and declared nowhere, which renders as ' +
        'the default blue');
});

// ─── D. ONE ELEMENT, ONE `class` ATTRIBUTE ──────────────────────────────────

check('D1. ⚠️⚠️ no generated button carries two `class` attributes', () => {
    // The class manager's Delete did. HTML keeps the FIRST and discards the
    // second, so `class-del-btn` was never on the element — which killed its
    // hover (inline background) and forced the click to be found by position.
    for (const [name, src] of [['lessons-admin.js', lessons], ['admin.js', adminJs]]) {
        const dupes = [...src.matchAll(/<button[^>]*?\bclass=[^>]*?\bclass=[^>]*>/g)];
        assert.deepEqual(dupes.map(d => d[0].slice(0, 70)), [],
            `${name} builds a button with two class attributes. The second is ` +
            'silently discarded, and everything that selector was for goes with it');
    }
});

check('D2. the class Delete button is wired BY CLASS, not by position', () => {
    assert.match(lessons, /querySelector\('\.class-del-btn'\)\.onclick/,
        '⚠️ the delete handler is attached by position again. `[data-id]:last-child` ' +
        'worked only while Delete happened to be last: appending anything to that ' +
        'card moves the delete handler onto it, silently');
    assert.ok(!/\[data-id="' \+ cls\.id \+ '"\]:last-child/.test(lessons),
        'the positional selector is back');
});

// ─── E. ROADMAP 56b — THE TWO CONTROLS IN THE ROW WITH NO HINT ──────────────

for (const [cls, why] of [['edit-btn', 'opens the text'],
                          ['delete-btn', 'is the destructive one in the row']]) {
    check(`E1. the chapter row's .${cls} carries a hint — it ${why}`, () => {
        const re = new RegExp('<button[^>]*\\b' + cls + '"[^>]*>', 's');
        const m = re.exec(adminJs);
        assert.ok(m, `.${cls} not found in the chapter row template`);
        assert.match(m[0], /title="[^"]{25,}"/,
            'Jake: "about, merge, split and body are great. Edit and Del don\'t ' +
            'have them." Del especially — a moment\'s hesitation is worth most on ' +
            'the button that removes something');
    });
}

// ─── F. ROADMAP 55a — THE METADATA PANEL IS A GRID, AND THE SPANS SUM ───────
//
// ⚠️⚠️ The old layout was `.row { display:flex }` with SEVEN equal `.col`s
// sharing what the 120px cover column left over, and both URL fields rendered as
// the string `https:/` — not truncated decoratively, useless.
//
// ⚠️ THESE ASSERT STRUCTURE, NOT PIXELS. No test here says a field is 240px
// wide; they say the spans add up and that nothing is a fraction of a neighbour.
// A width assertion in a file whose whole item is about widths goes red for
// reasons that are not defects.

const metaGrid = (() => {
    const a = adminHtml.indexOf('<div class="meta-grid">');
    if (a < 0) return null;
    const b = adminHtml.indexOf('<div class="meta-cover">', a);
    return adminHtml.slice(a, b);
})();

check('F1. the metadata panel is a grid, not flex rows', () => {
    assert.ok(metaGrid, '.meta-grid is gone — if the panel was rebuilt again, ' +
        'rewrite this section in that round rather than deleting it');
    assert.match(adminHtml, /\.meta-grid\s*\{[^}]*grid-template-columns:\s*repeat\(6/,
        'the six-column track is gone; spans of 2 and 3 mean nothing without it');
    assert.ok(!/class="col[ "]/.test(metaGrid),
        'a flex .col is back inside the grid — the two layout systems disagree ' +
        'about width and the loser is whichever field holds a URL');
});

check('F2. ⚠️⚠️ every row\u2019s spans sum to exactly six', () => {
    const spans = [...metaGrid.matchAll(/<div class="f([23])">/g)].map(m => +m[1]);
    assert.ok(spans.length >= 8, 'expected at least eight fields; found ' + spans.length);
    let row = 0;
    for (const sp of spans) {
        row += sp;
        assert.ok(row <= 6,
            '⚠️ a row overflows six columns, so it wraps and the field that wraps ' +
            'gets a row to itself at full width — which reads as more important ' +
            'than the title. Running total hit ' + row);
        if (row === 6) row = 0;
    }
    assert.equal(row, 0,
        '⚠️ the last row is short by ' + (6 - row) + ' column(s). Every row must ' +
        'fill, or the final field stretches and stops lining up with the rows above');
});

check('F3. ⚠️ no field is a FRACTION of another \u2014 Jake\u2019s pet peeve, as CSS', () => {
    // `.u-flex-1-4 { flex: 1.4 }` made two columns slightly wider than their
    // neighbours. Not the same, not clearly different. Spans are 2 or 3 of six.
    //
    // ⚠️ COMMENTS STRIPPED FIRST, and the first draft did not — admin.html
    // v1.10.0 explains the deleted rule by QUOTING it, so the check failed
    // against correct code by reading its own explanation. staff-tokens-test.mjs
    // learned this before; every check that counts occurrences in these files
    // has to.
    const css = adminHtml.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
    assert.ok(!/flex:\s*1\.\d/.test(css),
        'a fractional flex weight is back in admin.html. A field is a third of the ' +
        'row or a half of it; "a bit wider than the one beside it" is the thing ' +
        'this panel was rebuilt to stop doing');
    assert.ok(!/class="f[^23"]/.test(metaGrid),
        'a span class other than f2/f3 appeared. Two sizes is the point');
});

check('F4. ⚠️ min-width:0 is still on the grid children', () => {
    // A grid item's default min-width is auto, so a <select> with a long option
    // refuses to shrink — a second, quieter way to get `https:/`.
    assert.match(adminHtml, /\.meta-grid\s*>\s*\*\s*\{[^}]*min-width:\s*0/,
        'without this a long <option> sets its column\u2019s floor and the URL ' +
        'fields are squeezed again, with nothing in the markup to explain why');
});

check('F5. the A/B render carries the SHIPPED grid, verbatim', () => {
    // ⚠️ A rendered comparison that has drifted from the code is worse than none:
    // it is a picture of a page that does not exist, and it is what Jake signs
    // off against.
    let ab;
    try { ab = read('tools/meta-panel-ab.html'); }
    catch { assert.fail('tools/meta-panel-ab.html is missing'); }
    const shipped = metaGrid.slice(0, metaGrid.lastIndexOf('</div>'))
        .split('\n').map(l => l.replace(/^ {18}/, '')).join('\n').trimEnd();
    assert.ok(ab.includes(shipped.split('\n').slice(0, 6).join('\n')),
        '⚠️ tools/meta-panel-ab.html no longer contains admin.html\u2019s grid ' +
        'markup. Regenerate it in the same round as any change to the panel, or ' +
        'delete it \u2014 a stale A/B is a picture of a page that does not exist');
});

let failed = 0;
for (const [state, name] of results) {
    console.log(`  ${state === 'ok' ? 'ok  ' : 'FAIL'} ${name}`);
    if (state !== 'ok') failed++;
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
