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
const staffAdmin = read('staff-admin.js');

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

check('C2. #repair-titles-btn takes its colour from a TIER class', () => {
    // ⚠️ ROADMAP 38's safe/edit pass (Round 70) replaced its decorative amber
    // with `tier-edit` — it rewrites STAGED text and nothing in the database, so
    // it is neither safe nor commit. C1 above still guards the inline background.
    assert.match(adminJs, /btn\.className\s*=\s*'tier-edit'/,
        'the repair button no longer declares a tier; a per-button hue is exactly ' +
        'what this pass retired');
    assert.match(adminHtml, /button\.tier-edit:not\(:disabled\)\s*\{[^}]*background:/,
        'the class is applied in admin.js and declared nowhere, which renders as ' +
        'an unstyled button');
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
    const spans = [...metaGrid.matchAll(/<div class="f([234])">/g)].map(m => +m[1]);
    // ⚠️ FIELD CELLS ONLY. The cover and its controls are explicitly placed in
    // column 7 and carry no span class, so they are correctly absent here.
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
    assert.ok(!/class="f[^234"]/.test(metaGrid),
        '⚠️ a span class other than f2/f3/f4 appeared. Whole-column widths only — ' +
        'the point is that a field is a third, a half or two thirds of the row, ' +
        'never "a bit wider than the one beside it"');
});

check('F4. ⚠️ min-width:0 is still on the grid children', () => {
    // A grid item's default min-width is auto, so a <select> with a long option
    // refuses to shrink — a second, quieter way to get `https:/`.
    assert.match(adminHtml, /\.meta-grid\s*>\s*\*\s*\{[^}]*min-width:\s*0/,
        'without this a long <option> sets its column\u2019s floor and the URL ' +
        'fields are squeezed again, with nothing in the markup to explain why');
});

check('F5. the A/B render carries the SHIPPED panel', () => {
    // ⚠️ A rendered comparison that has drifted from the code is worse than none:
    // it is a picture of a page that does not exist, and it is what Jake signs
    // off against.
    //
    // ⚠️ COMPARED WITH LEADING WHITESPACE STRIPPED FROM BOTH SIDES. The A/B is
    // generated by slicing the panel out of admin.html and dedenting it, so an
    // indentation-sensitive compare fails whenever the slice starts at a
    // different depth — which is a bounds difference reading as a stale render.
    let ab;
    try { ab = read('tools/meta-panel-ab.html'); }
    catch { assert.fail('tools/meta-panel-ab.html is missing'); }
    const flat = t => t.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
    const abFlat = flat(ab);
    const shipped = flat(metaGrid).split('\n');
    // Every line of the shipped grid must appear, in order, in the render.
    let at = 0, missing = null;
    for (const line of shipped) {
        const next = abFlat.indexOf(line, at);
        if (next < 0) { missing = line; break; }
        at = next + line.length;
    }
    assert.equal(missing, null,
        '⚠️ tools/meta-panel-ab.html no longer matches admin.html\u2019s panel. ' +
        'Regenerate it in the same round as any change, or delete it. First line ' +
        'not found: ' + String(missing).slice(0, 70));
});

// ─── G. ROADMAP 55a, SECOND HALF — THE HEADER AND THE COVER ARE ON THE GRID ──
//
// v1.10.0 gridded the fields and left the title row on flex, so `Save Metadata`
// lined up with nothing beneath it and Jake asked why. ⚠️⚠️ THE FAILURE MODE IS
// NOT "no grid" — it is TWO grids that are meant to agree and are declared
// separately, which disagree the first time one is edited.

check('G1. ⚠️⚠️ the header row and the field grid share ONE column template', () => {
    const css = adminHtml.replace(/\/\*[\s\S]*?\*\//g, ' ');
    assert.match(css, /\.meta-head,\s*\n?\s*\.meta-grid\s*\{[^}]*grid-template-columns:/,
        '⚠️ the two grids no longer share a declaration. Give either one its own ' +
        'grid-template-columns and `Save Metadata` drifts off the fields below it ' +
        'again — which is the defect Jake reported, not a hypothetical');
    const owned = [...css.matchAll(/([^{}]+)\{[^}]*grid-template-columns:[^}]*\}/g)]
        .map(m => m[1].trim()).filter(sel => /meta-(head|grid)/.test(sel));
    for (const sel of owned) {
        assert.ok(/meta-head/.test(sel) && /meta-grid/.test(sel),
            '`' + sel.replace(/\s+/g, ' ').slice(0, 60) + '` sets the track list for ' +
            'only one of the two. They must move together or not at all');
    }
});

check('G2. the header spans use the SAME vocabulary as the fields', () => {
    // ⚠️ BOUNDED BY THE NEXT GRID, NOT BY THE NEXT BLANK-LINE `</div>`. The
    // first draft's slice ran straight past the header into the field grid and
    // reported six spans, which is a bounds bug reading as a layout defect.
    const head = adminHtml.slice(adminHtml.indexOf('<div class="meta-head">'),
                                 adminHtml.indexOf('<div class="meta-grid">'));
    const spans = [...head.matchAll(/<div class="f([23])">/g)].map(m => +m[1]);
    assert.deepEqual(spans, [3, 2, 2],
        '⚠️ expected Title(3) + Author(2) + Save(2) = seven tracks; found ' +
        spans.join('+') + '. A second set of class names for the same two widths ' +
        'is how the halves drift apart again');
});

check('G3. ⚠️ Save Metadata has a spacer label, which is why it lines up', () => {
    // Its cell has no label of its own, so without one the button starts at the
    // TOP of the cell while the inputs beside it start below THEIR labels. That
    // is the "slightly off" Jake spotted, and it is invisible in code review.
    const cell = /<div class="f2">[\s\S]{0,900}?id="save-title-btn"/.exec(adminHtml);
    assert.ok(cell, 'the Save Metadata cell has moved');
    assert.match(cell[0], /class="label-spacer"/,
        'the spacer label is gone, so the button no longer starts where the ' +
        'inputs beside it start');
    assert.match(adminHtml, /\.label-spacer\s*\{[^}]*visibility:\s*hidden/,
        '⚠️ the spacer must be `visibility: hidden`, not `display: none` — ' +
        'display:none reserves no height and the alignment silently reverts');
});

check('G4. ⚠️ the cover is a SLOT in the grid, not a flex sibling', () => {
    assert.match(adminHtml, /\.meta-cover\s*\{[^}]*grid-column:\s*7[^}]*grid-row:/,
        '⚠️ the cover is placed by flex again, so its top and bottom land wherever ' +
        "the jacket image's intrinsic height puts them — slightly off every row " +
        'beside it, which is exactly what Jake asked to have fixed');
    assert.match(adminHtml, /\.cover-frame\s*\{/,
        'the frame is gone; without it the <img> is the box and its height is the ' +
        "jpeg's, not the grid's");
    assert.ok(!/\.meta-block|\.meta-fields/.test(adminHtml),
        'the old flex wrappers are back alongside the grid; two layout systems on ' +
        'one panel disagree about width and the loser holds a URL');
});

// ─── H. THE UPLOADED-BY STAMP TELLS THE TRUTH IN ALL FOUR STATES ────────────

check('H1. ⚠️ "not uploaded yet" is a state the stamp can express', () => {
    // Jake: "why isn't my name showing in uploaded by?" — of a book he was
    // staging. The field was right and said nothing: a bare em dash reads as
    // broken rather than as "not yet".
    assert.match(adminJs, /function paintUploadedByStamp\s*\(\)/,
        'the fourth state is gone; a book with no document shows a bare dash again');
    const fn = /function paintUploadedByStamp\s*\(\)\s*\{[\s\S]*?\n\}/.exec(adminJs)[0];
    assert.match(fn, /stamped when you upload/i, 'the message no longer says when');
    assert.match(fn, /activeBookExists\s*\(\)\s*===\s*false/,
        '⚠️⚠️ it must test `=== false` exactly. `!exists` is true for null too, so ' +
        'a repaint before the book list loads would stomp a REAL uploader name ' +
        'with a placeholder — showUploadedBy() owns that element for every book ' +
        'that exists');
});

check('H2. the painter runs it with the others', () => {
    const fn = /function paintTierButtons\s*\(\)\s*\{[\s\S]*?\n\}/.exec(adminJs)[0];
    assert.match(fn, /paintUploadedByStamp\s*\(\)/,
        'the stamp is defined and never called, which looks exactly like working ' +
        'code and shows a bare dash');
});

// ─── J. THE GRID OWNS THE SPACING, AND ROWS OF BUTTONS ARE ROWS ────────────
//
// Jake, on the v1.11.0 render: *"Parse and Another book are not the same height.
// Ditto export csv and the other buttons in that row. And there's uneven space
// between the rows and the edges."* Plus: the cover column still did not line up
// with the rows to its left.
//
// ⚠️⚠️ THE COVER AND THE ROW RHYTHM HAD ONE CAUSE. Every control on this page
// carries `margin-bottom: 15px` from the global rule, which predates the grid.
// Inside a grid cell that margin is INSIDE the cell, so a control's visible
// bottom sat 15px above its own cell's bottom while the cover frame filled its
// cell exactly.

check('J1. ⚠️⚠️ no control inside the panel grids carries its own bottom margin', () => {
    const css = adminHtml.replace(/\/\*[\s\S]*?\*\//g, ' ');
    assert.match(css, /\.meta-grid\s+input[^{]*\{[^}]*margin-bottom:\s*0/,
        '⚠️ the global `margin-bottom: 15px` is back inside the grid. A control ' +
        'then ends 15px above its own cell, the cover frame does not, and the ' +
        'column stops lining up with the rows beside it — which is the exact ' +
        'thing Jake reported twice');
});

check('J2. the cover controls are ONE row tall', () => {
    // ⚠️ Stacked, they were two controls tall, so the last field row grew to hold
    // them and `Prepared by` / `Cleaned up by` stopped lining up with everything
    // above. One row tall is what makes column 7 agree with columns 1-6.
    const rule = /\.meta-cover-controls\s*\{[^}]*\}/.exec(adminHtml);
    assert.ok(rule, '.meta-cover-controls is gone');
    assert.ok(!/flex-direction:\s*column/.test(rule[0]),
        'the cover controls are stacked again, so the last field row has to grow ' +
        'to hold them and column 7 no longer matches the rows to its left');
});

check('J3. ⚠️ button rows equalise height by CONSTRUCTION, not by a tuned number', () => {
    // Two causes, neither a padding: colour emoji have bigger metrics than plain
    // glyphs and the tallest sets the line box; and a 100%-wide button squeezed
    // its neighbour's label into a second line.
    const css = adminHtml.replace(/\/\*[\s\S]*?\*\//g, ' ');
    assert.match(css, /\.btn-bar\s*\{[^}]*align-items:\s*stretch/,
        '⚠️ `align-items: stretch` is what makes a row of buttons equal height ' +
        'without measuring anything. Tuning padding per button instead is chasing ' +
        'a font metric with a magic number, and it breaks when an emoji font updates');
    assert.match(css, /\.btn-bar\s*>\s*button\s*\{[^}]*width:\s*auto/,
        'without `width: auto` the 100%-wide button squeezes its neighbour until ' +
        'the label wraps, which is how they came to be different heights');
});

check('J4. both button rows actually USE it', () => {
    // ⚠️ A class nothing wears is the same as no class. Both rows Jake named must
    // be inside one.
    for (const id of ['export-books-csv-btn', 'create-parse-btn']) {
        const at = adminHtml.indexOf('id="' + id + '"');
        assert.ok(at > 0, '#' + id + ' not found');
        const before = adminHtml.slice(Math.max(0, at - 1200), at);
        assert.ok(before.lastIndexOf('btn-bar') > before.lastIndexOf('</div>'),
            '#' + id + ' is not inside a .btn-bar, so its row is back to being ' +
            'buttons that happen to sit near each other');
    }
});

check('J5. ⚠️ the panel\u2019s dividers share ONE rhythm', () => {
    // They were 12px/10px above and 15px/15px below — "not the same, not clearly
    // different", which is the pet peeve written as CSS.
    const box = adminHtml.slice(adminHtml.indexOf('id="import-box"') >= 0
        ? adminHtml.indexOf('id="import-box"') : adminHtml.indexOf('Database Manager'),
        adminHtml.indexOf('<div class="meta-head">'));
    const tops = [...box.matchAll(/u-margin-top-(\d+)px[^"]*u-border-top-1px-solid-333[^"]*u-padding-top-(\d+)px/g)];
    assert.ok(tops.length >= 2, 'expected at least two dividers; found ' + tops.length);
    const pairs = tops.map(m => m[1] + '/' + m[2]);
    assert.equal(new Set(pairs).size, 1,
        '⚠️ the dividers use different spacing: ' + pairs.join(' and ') + '. A ' +
        'divider rhythm should be one number used twice, not two that are nearly ' +
        'the same');
});

// ─── K. ROADMAP 56a — THE (i) BUTTONS ANSWER SOMETHING ─────────────────────
//
// Jake: *"Hovering over the i for Cover gives me a question mark, but clicking
// doesn't give me anything at all."* ⚠️⚠️ A help affordance that answers nothing
// is worse than no affordance: the cursor promises an explanation and the click
// spends the user's attention for nothing.

check('K1. every hint is a BUTTON with a data-note', () => {
    const spans = [...adminHtml.matchAll(/<span class="hint"[^>]*>/g)];
    assert.deepEqual(spans.map(m => m[0].slice(0, 50)), [],
        '⚠️ a hint is a <span> again, so there is nothing to click and the cursor ' +
        'is lying about it');
    const hints = [...adminHtml.matchAll(/<button[^>]*class="hint"[^>]*>/g)];
    assert.ok(hints.length >= 12, 'expected at least twelve hints; found ' + hints.length);
    for (const h of hints) {
        assert.match(h[0], /data-note="[^"]{40,}"/,
            'a hint with no note, or one too short to say anything: ' + h[0].slice(0, 60));
        // ⚠️ ONE SOURCE OF WORDS. admin.js copies data-note into title at init;
        // a hand-written title in the markup is a second copy that will drift,
        // and the one you edit will be the wrong one.
        assert.ok(!/\stitle=/.test(h[0]),
            'a hint carries its own title= as well as data-note. Two copies of a ' +
            'sentence drift: ' + h[0].slice(0, 60));
    }
});

check('K2. ⚠️ the notes are PROVENANCE, not definitions', () => {
    // Jake: "it would probably be helpful if they told the user where that
    // information is auto-filled from, IF ANYWHERE." The "if anywhere" is the
    // part a hand-written list gets wrong — a field nothing fills must SAY so,
    // rather than being left without a note and looking merely broken.
    const notes = [...adminHtml.matchAll(/class="hint" data-note="([^"]+)"/g)].map(m => m[1]);
    assert.ok(notes.length >= 12, 'found only ' + notes.length + ' notes');
    const silent = notes.filter(n => !/AUTO-FILLED|AUTO-EXTRACTED|NOTHING AUTO-FILLS|NOT FROM THE EPUB/.test(n));
    assert.deepEqual(silent.map(n => n.slice(0, 45)), [],
        '⚠️ these notes say what the field IS and not where it comes from. Every ' +
        'one must state its source or state plainly that nothing fills it');
});

check('K3. ⚠️ the click is wired once, delegated, and does not focus the field', () => {
    const fn = /function initFieldHints\s*\(\)\s*\{[\s\S]*?\n\}/.exec(adminJs);
    assert.ok(fn, 'initFieldHints() is gone; the (i) buttons are dead again');
    assert.match(fn[0], /document\.addEventListener\(\s*['"]click['"]/,
        '⚠️ per-element handlers die silently when the panel re-renders, and a ' +
        'dead help button looks exactly like a live one. Delegate');
    assert.match(fn[0], /preventDefault/,
        '⚠️ the (i) sits inside a <label for="…">, so without preventDefault a ' +
        'click focuses the field and, on a <select>, opens it');
    assert.match(fn[0], /title\s*=\s*h\.dataset\.note/,
        'hover and click no longer read the same source, so they can disagree');
    assert.match(adminJs, /initFieldHints\s*\(\)\s*;/,
        'defined and never called, which looks exactly like working code');
});

// ─── L. ROADMAP 55b — THE OVERRIDE IS A UI AFFORDANCE, NOT A PERMISSION ─────

check('L1. ⚠️⚠️ superadmin is tested by equality, never by exclusion', () => {
    const fn = /function refreshUploadedByOverride\s*\(\)\s*\{[\s\S]*?\n\}/.exec(adminJs);
    assert.ok(fn, 'refreshUploadedByOverride() is gone');
    // ⚠️⚠️ ROUND 74: THIS CASE PASSED WHILE THE FEATURE WAS DEAD. It pinned the
    // SHAPE of the comparison (`===`, not `!==`) and never asked whether the
    // string on the right was a role that EXISTS. Round 68 compared against
    // 'superadmin'; the real value is 'super_admin'. The control never appeared
    // for anyone, for six rounds, and a green test said it was fine.
    //
    // ⭐ SO THE ROLE VOCABULARY IS READ OUT OF staff-admin.js's ROLE_LABELS —
    // the source of truth — instead of being written here a second time. A
    // literal in a test is just the same guess, typed twice.
    const roles = [...staffAdmin.matchAll(/^\s{4}(\w+):\s*'/gm)].map(m => m[1]);
    assert.ok(roles.includes('super_admin'),
        'could not read the role vocabulary out of staff-admin.js ROLE_LABELS — ' +
        'if it moved, point this at wherever it went rather than hardcoding roles here');
    const cmp = /_staffScope\.role\s*===\s*'([a-z_]+)'/.exec(fn[0]);
    assert.ok(cmp, "⚠️⚠️ an undefined role must never read as permission. " +
        "`!== 'admin'` is exactly that bug, and it would hand the control to every " +
        'account whose staff document failed to load');
    assert.ok(roles.includes(cmp[1]),
        "⚠️⚠️ the override is gated on role '" + cmp[1] + "', which is not a role " +
        'that exists. staff-admin.js knows: ' + roles.join(', ') + '. A gate on a ' +
        'string nothing can equal is a feature that never appears, and it looks ' +
        'exactly like a feature that works');
    assert.equal(cmp[1], 'super_admin', "Jake's ruling was super_admin only");
    assert.match(fn[0], /activeBookExists\(\)\s*===\s*true/,
        'a book with no document has nothing to correct, and paintUploadedByStamp() ' +
        'owns that element in that state — two writers, one box');
});

check('L2. the staff list costs one read, on first open, never on load', () => {
    // §READS. A superadmin-only correction nobody opens most days must not cost
    // a read on every admin session.
    const fn = /function initUploadedByOverride\s*\(\)\s*\{[\s\S]*?\n\}\n/.exec(adminJs);
    assert.ok(fn, 'initUploadedByOverride() is gone');
    assert.match(fn[0], /_staffListLoaded/, 'the once-only guard is gone');
    assert.match(fn[0], /addEventListener\(\s*['"]focus['"]/,
        'the list is no longer filled lazily, so it costs a read on every load');
});

check('L3. ⚠️ the round says out loud that the rules do not enforce it', () => {
    // ⚠️⚠️ THE THING A LATER READER WILL GET WRONG. /books has no field
    // whitelist, so any admin who can write a book document can write this
    // field. It is an affordance, not a boundary, and silence about that is how
    // it gets cited as a control it is not.
    assert.match(adminJs, /rules DOES NOT ENFORCE|RULES DO NOT ENFORCE/i,
        'the header no longer warns that firestore.rules does not enforce ' +
        'superadmin-only here. Say it, or someone will assume the server guards it');
});

// ─── M. ROADMAP 55c — THE CONFIRMATION IS BUILT FROM THE WRITE ─────────────
//
// Jake changed the age range, saved, and the confirmation did not mention it —
// *"I think there was something else that also wasn't included."* ⚠️⚠️ THERE WERE
// EIGHT. The old line listed genre, ages, lead and cover: four of the twelve
// fields readBookMetadataForm() writes.
//
// ⭐ THESE CASES RUN THE REAL FUNCTION rather than grepping for it. describeSave()
// is pure, so it can be lifted out of admin.js and driven — and the one assertion
// that matters (every written field is named) is only worth anything if it is
// executed against the form's ACTUAL key list, read out of the same file.

const saveEnv = (() => {
    const grab = (re) => { const m = re.exec(adminJs); return m ? m[0] : null; };
    const pieces = [
        grab(/const SAVE_FIELD_LABELS = \{[\s\S]*?\n\};/),
        grab(/function saveFieldLabel\([\s\S]*?\n\}/),
        grab(/function saveFieldValue\([\s\S]*?\n\}/),
        grab(/function describeSave\([\s\S]*?\n\}\n/),
    ];
    if (pieces.some(p => !p)) return null;
    try {
        return new Function(pieces.join('\n') + '\nreturn { describeSave };')();
    } catch { return null; }
})();

// The keys the form actually writes, read from readBookMetadataForm() itself.
const formKeys = (() => {
    const fn = /function readBookMetadataForm[\s\S]*?\n\}/.exec(adminJs);
    if (!fn) return [];
    return [...fn[0].matchAll(/^\s{8}(\w+):/gm)].map(m => m[1]);
})();

check('M1. describeSave() can be lifted and run \u2014 it is pure', () => {
    assert.ok(saveEnv, 'describeSave() or its helpers could not be extracted. If ' +
        'it now depends on the DOM or on module state it is no longer testable ' +
        'here, and this whole section stops meaning anything \u2014 say so in that round');
    assert.ok(formKeys.length >= 10, 'read only ' + formKeys.length + ' form keys');
});

check('M2. \u26a0\u26a0 EVERY field the form writes is named in the confirmation', () => {
    // The item's actual requirement: if a field is written, it is listed, by
    // construction. Driven with a value for every key the form produces.
    const updates = {};
    for (const k of formKeys) updates[k] = (k === 'minAge') ? 7 : (k === 'maxAge') ? 11 : 'X-' + k;
    const out = saveEnv.describeSave(updates, null, '');
    const missing = formKeys.filter(k => {
        if (k === 'minAge' || k === 'maxAge') return !/ages 7/.test(out);
        const human = k.replace(/([A-Z])/g, ' $1').toLowerCase();
        return !out.toLowerCase().includes(human) && !out.includes('X-' + k);
    });
    assert.deepEqual(missing, [],
        '\u26a0\u26a0 these fields are WRITTEN and not mentioned: ' + missing.join(', ') +
        '. A confirmation that lists SOME of what it wrote is worse than one that ' +
        'lists none \u2014 it teaches the reader to trust a list that is lying');
});

check('M3. \u26a0 a field added to the form needs NO edit here', () => {
    // The by-construction property. A key nobody has ever labelled must still be
    // listed, humanised from its own name.
    const out = saveEnv.describeSave({ title: 'T', someNewField: 'hello' }, null, '');
    assert.match(out, /some new field: hello/,
        '\u26a0 an unlabelled key vanished from the confirmation. SAVE_FIELD_LABELS ' +
        'must only prettify names, never gate what is shown \u2014 a map that gates is ' +
        'the hand-kept list again, one refactor later');
});

check('M4. it reports what CHANGED, against the document it was opened with', () => {
    const before = { title: 'Old', author: 'A', minAge: 7, maxAge: 11 };
    const out = saveEnv.describeSave({ title: 'New', author: 'A', minAge: 7, maxAge: 11 },
                                     before, '');
    assert.match(out, /changed:/, 'no change was reported when the title changed');
    assert.match(out, /title: New/, 'the changed field is not named');
    assert.ok(!/changed:[^\u00b7]*author/.test(out),
        'an unchanged field is being reported as changed, which makes the word ' +
        '"changed" worthless');
    assert.match(out, /unchanged/, 'it no longer says the rest were written too');
});

check('M5. \u26a0\u26a0 a save that changed NOTHING says so', () => {
    // It used to look identical to one that changed everything, which is how a
    // dead form field goes unnoticed.
    const same = { title: 'T', author: 'A' };
    const out = saveEnv.describeSave({ ...same }, { ...same }, '');
    assert.match(out, /no field changed/i,
        'a no-op save is indistinguishable from a real one');
});

check('M6. \u26a0 no baseline is reported as a FIRST SAVE, not as "nothing changed"', () => {
    const out = saveEnv.describeSave({ title: 'T' }, null, '');
    assert.match(out, /first save/i,
        '\u26a0 a missing baseline is not the same as "nothing changed". A book being ' +
        'created would otherwise report that none of its twelve fields changed');
});

check('M7. minAge and maxAge are ONE fact, not two', () => {
    const out = saveEnv.describeSave({ minAge: 8, maxAge: 12 }, null, '');
    assert.match(out, /ages 8\u201312/, 'the age range is not rendered as a range');
    assert.ok(!/max age/i.test(out),
        'the two keys are reported separately, so one edit reads as two changes ' +
        'and "maxAge: 12" on its own says nothing');
});

check('M8. \u26a0 the cover is still named explicitly', () => {
    // It is NOT in `updates` unless one was uploaded, so the iteration cannot
    // speak for it — and its silence is what let two books ship coverless under
    // a "✓ Saved".
    const out = saveEnv.describeSave({ title: 'T' }, null, 'cover saved (image/jpeg)');
    assert.match(out, /cover saved/, 'the cover note was dropped from the line');
});

// ─── N. THE COVER PREVIEW IS THE SHAPE THE SHELF ACTUALLY SHOWS ────────────

check('N1. ⚠️⚠️ the admin cover preview uses the LIBRARY\u2019s aspect ratio', () => {
    // ⚠️ index.html's `.book-cover { aspect-ratio: 2/3 }` is what a student sees.
    // A preview in any other shape is previewing something else, and the point of
    // a preview is that it is not a guess.
    const lib = /\.book-cover\s*\{[^}]*aspect-ratio:\s*([\d/\s]+);/.exec(read('index.html'));
    assert.ok(lib, '⚠️ index.html no longer declares .book-cover\u2019s aspect-ratio. ' +
        'If the shelf changed shape, this panel has to follow it in the same round');
    const admin = /\.cover-frame\s*\{[^}]*aspect-ratio:\s*([\d/\s]+);/.exec(adminHtml);
    assert.ok(admin, 'the admin preview has no aspect-ratio, so its shape is ' +
        'whatever the grid rows happen to give it');
    const norm = t => t.replace(/\s+/g, '');
    assert.equal(norm(admin[1]), norm(lib[1]),
        '\u26a0\u26a0 the admin preview is ' + norm(admin[1]) + ' and the shelf is ' +
        norm(lib[1]) + '. They are read side by side by one person deciding ' +
        'whether a cover looks right');
});

check('N2. the frame is sized by HEIGHT, so its edges stay on gridlines', () => {
    // ⚠️ If `width` led instead, the frame would set its own height and stop
    // agreeing with the rows beside it — the defect that took four rounds to
    // find the first time.
    const rule = /\.cover-frame\s*\{[^}]*\}/.exec(adminHtml)[0];
    assert.match(rule, /width:\s*auto/,
        '\u26a0 the frame sets an explicit width, so the ratio now drives its HEIGHT ' +
        'and its bottom edge leaves the gridline it was put on');
    assert.match(rule, /margin:\s*0 auto/,
        'the frame no longer centres, so a narrower cover sits against one edge of ' +
        'a wider column and reads as a mistake');
});

// ─── P. A TOGGLE MUST CHANGE WHATEVER DECLARES THE STATE ────────────────────
//
// Jake: *"the one on staff doesn't work. At all. I click on it and nothing
// happens."* The panel was hidden by the CLASS `u-display-none`; the handler
// toggled the INLINE `style.display`, which starts as '' — so it could only ever
// lose to the rule it was fighting.
//
// ⭐ SAME FAMILY AS ROUND 64's DEAD HOVERS, INVERTED: an inline background beat a
// selector there; an empty inline value loses to a class here. ⚠️ THE RULE THAT
// COVERS BOTH: whatever declares the state is what has to change it.
//
// ⚠️ THIS IS A CLASS GUARD, NOT A CHECK ON ONE BUTTON. It finds every element
// hidden by a display class in the markup and fails if the code toggles that
// element's inline display instead.

check('P1. ⚠️⚠️ nothing toggles style.display on a class-hidden element', () => {
    const staff = read('staff-admin.js');
    const hidden = new Set(
        [...adminHtml.matchAll(/id="([\w-]+)"[^>]*class="[^"]*\bu-display-none\b/g)]
            .map(m => m[1]));
    assert.ok(hidden.size > 0, 'no class-hidden elements found — if the utility was ' +
        'renamed, point this at the new one rather than deleting the case');
    const offenders = [];
    for (const id of hidden) {
        for (const src of [staff, adminJs, lessons]) {
            // getElementById('x') … <same statement or next> .style.display =
            // ⚠️ ONLY THE EMPTY-STRING ASSIGNMENT IS A BUG, AND THE FIRST DRAFT
            // FLAGGED ALL SEVEN. `.u-display-none` is `display:none` with NO
            // `!important`, so an inline value WINS: `= 'block'` shows the
            // element and `= 'none'` is merely redundant. It is `= ''` that
            // loses — the inline declaration goes away and the class applies —
            // and that is the one that reads as "I made it visible" while doing
            // nothing. A check that fires on the six that work is one people
            // learn to route around.
            const re = new RegExp("getElementById\\(\\s*'" + id +
                "'\\s*\\)[\\s\\S]{0,200}?\\.style\\.display\\s*=\\s*''");
            const byVar = new RegExp("=\\s*document\\.getElementById\\(\\s*'" + id +
                "'\\s*\\)[\\s\\S]{0,400}?\\.style\\.display\\s*=\\s*''");
            const ternary = new RegExp("getElementById\\(\\s*'" + id +
                "'\\s*\\)[\\s\\S]{0,300}?\\.style\\.display\\s*=[^;]*\\?\\s*''");
            if (re.test(src) || byVar.test(src) || ternary.test(src)) offenders.push(id);
        }
    }
    assert.deepEqual(offenders, [],
        '⚠️⚠️ ' + offenders.join(', ') + ' is hidden by a CLASS and toggled by inline ' +
        'style. The class wins, so the control does nothing and looks exactly like ' +
        'one that works. Toggle the class');
});

check('P2. the staff help disclosure reports its state', () => {
    // ⚠️ A disclosure button that never says whether it is open is unusable
    // without sight of the panel — and this one spent its whole life claiming
    // nothing while doing nothing.
    const staff = read('staff-admin.js');
    const at = staff.indexOf("'staff-help-toggle'");
    assert.ok(at > 0, 'the staff help toggle is gone');
    const near = staff.slice(at, at + 700);
    assert.match(near, /classList\.toggle/,
        'the toggle is back to inline style, which the class overrides');
    assert.match(near, /aria-expanded/,
        'the button does not report open/closed');
});

// ─── Q. THE PREVIEW CROPS THE WAY THE SHELF CROPS, AND SAYS BY HOW MUCH ────
//
// Jake: *"I believe the library zooms and crops rather than fitting... I'd LOVE
// for there to be a note underneath that x% or pixels had to be cut."*
//
// ⚠️⚠️ HE WAS RIGHT AND IT WAS A REAL MISMATCH. index.html's `.book-cover` is
// `object-fit: cover`; the admin frame was `contain`, which letterboxes and cuts
// nothing — so the admin was approving a picture no student would ever see.
// ⭐ A PREVIEW WHOSE FIT RULE DIFFERS FROM THE SHELF'S IS NOT A PREVIEW.

check('Q1. ⚠️⚠️ the preview and the shelf use the SAME object-fit', () => {
    const shelf = /\.book-cover\s*\{[^}]*object-fit:\s*(\w+)/.exec(read('index.html'));
    assert.ok(shelf, 'index.html no longer sets object-fit on .book-cover — if the ' +
        'shelf changed how it fits, this panel follows in the SAME round');
    const admin = /\.cover-frame img\s*\{[^}]*object-fit:\s*(\w+)/.exec(adminHtml);
    assert.ok(admin, 'the preview sets no object-fit, so its fit is the browser default');
    assert.equal(admin[1], shelf[1],
        '⚠️⚠️ the shelf fits with `' + shelf[1] + '` and the preview with `' + admin[1] +
        '`. One of them is showing a picture the other never will');
});

check('Q2. ⚠️ the ratio is the same number in all THREE places', () => {
    // The CSS frame, the shelf, and the arithmetic that reports the crop. Three
    // places, one number — and the fit rule drifting is exactly how this item
    // started.
    const shelf = /\.book-cover\s*\{[^}]*aspect-ratio:\s*(\d+)\s*\/\s*(\d+)/.exec(read('index.html'));
    const frame = /\.cover-frame\s*\{[^}]*aspect-ratio:\s*(\d+)\s*\/\s*(\d+)/.exec(adminHtml);
    const code  = /COVER_ASPECT = (\d+)\s*\/\s*(\d+)/.exec(adminJs);
    assert.ok(shelf && frame && code, 'one of the three declarations is gone');
    const r = m => +m[1] / +m[2];
    assert.equal(r(frame), r(shelf), 'the frame and the shelf disagree');
    assert.equal(r(code), r(shelf),
        '⚠️ the CROP ARITHMETIC uses a different ratio from the box it is describing, ' +
        'so the percentage it reports is about a shape that does not exist');
});

check('Q3. ⭐ the crop arithmetic is right, driven not read', () => {
    // describeCoverFit() is pure, so it gets run rather than grepped.
    const cAspect = /const COVER_ASPECT = [^;]+;/.exec(adminJs);
    const fn = /function describeCoverFit\([\s\S]*?\n\}/.exec(adminJs);
    assert.ok(cAspect && fn, 'describeCoverFit() could not be lifted — if it now ' +
        'depends on the DOM it is no longer testable here, and this case stops ' +
        'meaning anything. Say so in that round');
    const { describeCoverFit } =
        new Function(cAspect[0] + '\n' + fn[0] + '\nreturn { describeCoverFit };')();

    assert.match(describeCoverFit(1200, 1800).text, /perfect fit/,
        'an exactly 2:3 cover is not reported as a perfect fit');
    assert.equal(describeCoverFit(1000, 1500).lost, 0,
        '⚠️ the answer must depend on the RATIO, not the size — a smaller image at ' +
        'the same shape loses nothing either');

    const wide = describeCoverFit(1400, 1800);
    assert.match(wide.text, /sides/, 'a wide image loses its sides, not its top');
    assert.ok(Math.abs(wide.lost - (1 - (2 / 3) / (1400 / 1800))) < 1e-9,
        'the width crop is miscalculated');

    const tall = describeCoverFit(1200, 2400);
    assert.match(tall.text, /top and bottom/, 'a tall image loses top and bottom');
    assert.ok(tall.lost > 0.24 && tall.lost < 0.26, '1200×2400 should lose about a quarter');

    assert.equal(describeCoverFit(0, 0).text, '',
        '⚠️ an image with no natural size must say NOTHING, not "0% cut" — a ' +
        'confident number about an image that has not loaded is worse than silence');
    assert.match(describeCoverFit(1200, 1801).text, /perfect fit/,
        '⚠️ a one-pixel rounding difference is not a design problem; below the ' +
        'tolerance a number is only noise');
});

check('Q4. the note is wired to the image, and cleared with it', () => {
    const fn = /function updateCoverPreview\(\)[\s\S]*?\n\}/.exec(adminJs)[0];
    assert.match(fn, /onload\s*=/, 'nothing reads the natural dimensions');
    // ⚠️ A cached image can fire `load` synchronously on src assignment, so a
    // handler attached afterwards misses it — silently, and only for the covers
    // that load fastest, which is the hardest kind of intermittent to chase.
    assert.ok(fn.indexOf('onload') < fn.indexOf('preview.src = stagedCoverUrl'),
        '⚠️⚠️ the load handler is attached AFTER the src. A cached image fires load ' +
        'synchronously on assignment and the note never appears — for some covers');
    assert.match(fn, /note\.textContent = ''/,
        'the note is not cleared when the cover is removed, so it describes a ' +
        'picture that is no longer there');
});

let failed = 0;
for (const [state, name] of results) {
    console.log(`  ${state === 'ok' ? 'ok  ' : 'FAIL'} ${name}`);
    if (state !== 'ok') failed++;
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
