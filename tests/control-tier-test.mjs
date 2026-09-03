// control-tier-test.mjs — ⚠️⚠️ A CONTROL THAT REACHES STUDENTS MUST NOT LOOK
// LIKE ONE THAT OPENS A TEXT BOX.
//
// ROADMAP 38, and Jake's ruling of 2026-09-03: **a button is not a state.** The
// three value severities (notice / warn / bad) grade a VALUE that already exists.
// A control is graded by **what a click costs if you did not mean it** — safe,
// edit, commit. Forcing buttons onto the severity scale is a category error and
// would produce a red Save.
//
// ⚠️⚠️ THE DEFECT: `#upload-all-btn` carried NO class attribute at all, so it
// fell through to admin.html's default `button { background: #0047AB }` — the
// same blue as `EDIT`. **The control that pushes a book to every student in the
// building was visually identical to the one that opens a text box**, and it is
// the largest target on the panel.
//
// ⚠️ WHY THE TEST IS "HAS THE CLASS" AND NOT "IS THIS SHADE OF RED".
// Asserting a colour would pin a decorative value in a file whose whole item is
// about decorative values changing, and it would go red on the very next pass
// for a reason that is not a defect. The tier is the claim; the shade is that
// round's business. ⚠️ Part C guards the one colour fact that IS load-bearing:
// commit and the default `button` must not resolve to the same declaration.
//
// ⚠️⚠️ ONE CONTROL'S TIER IS RUNTIME STATE, NOT MARKUP (v3.43.0). Jake: an
// upload to a book that does not exist yet destroys nothing — it is creative, not
// destructive. So `#upload-all-btn` is `.tier-create` (green) on a new book and
// `.tier-commit` (red) on an existing one, and Part D tests the SWAP rather than
// a fixed class: that the markup ships in the cautious state, that both branches
// exist, that the label moves WITH the colour, and — the case that matters most —
// that the painter and the confirm dialog read ONE predicate. A button that
// paints from one copy of "does this book exist" and confirms from a second copy
// can go green and then ask you to confirm an overwrite.
//
// ⚠️ AND IT DOES NOT TEST safe/edit. Those tiers are not built yet — item 38's
// own instruction is to fix the commit row FIRST, because it is the only part of
// that item that can lose work. A harness asserting a vocabulary that does not
// exist yet is a PENDING entry, and this one is not that: everything below is
// true of the code on disk today.

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const js   = readFileSync(new URL('../admin.js',   import.meta.url), 'utf8');

const results = [];
function check(name, fn) {
    try { fn(); results.push(['ok', name]); }
    catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
}

/** The body of an assigned handler, matched by braces from its assignment. */
function handlerBody(src, marker) {
    // ⚠️ ANCHOR ON THE ASSIGNMENT, NOT THE NAME. `uploadAllBtn.onclick` also
    // appears in a comment 160 lines above the real one, and the first draft
    // brace-matched from there into an unrelated function.
    const at = src.indexOf(marker);
    if (at < 0) return null;
    const open = src.indexOf('{', at);
    if (open < 0) return null;
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(open, i); }
    }
    return null;
}

// The controls Jake's table names as commit, and where each one lives.
// ⚠️ EVERY ONE IS "IRREVERSIBLE, OR IT REACHES STUDENTS" — that is the entry
// test, not "it feels scary". `Cancel Import` is deliberately NOT here: it
// abandons staged work and reaches nobody, and putting it in this list would be
// a later round quietly widening the tier.
const COMMIT = [
    // ⚠️ #upload-all-btn is here for its MARKUP DEFAULT only. Its live tier is
    // Part D's business; what this list asserts is that the state it ships in —
    // "the book list has not loaded, I do not know" — is the cautious one.
    ['upload-all-btn',       html, 'ships cautious: unknown must never paint as create'],
    ['overwrite-btn',        html, "replaces an entire book's data"],
    ['confirm-overwrite-btn', html, 'the confirm for the above'],
    ['delete-book-btn',      html, 'deletes a book'],
    ['cover-remove-btn',     html, 'destroys a hand-sourced cover (v3.25.3)'],
];

// ─── A. EVERY COMMIT CONTROL DECLARES ITS TIER ───────────────────────────────

for (const [id, src, why] of COMMIT) {
    check(`A. #${id} is tier-commit — ${why}`, () => {
        const re = new RegExp('<button[^>]*id="' + id + '"[^>]*>');
        const m = re.exec(src);
        assert.ok(m, `#${id} not found — if the control was renamed, rename it here ` +
                     'in the same edit, because a missing id passes nothing');
        assert.match(m[0], /class="[^"]*\btier-commit\b/,
            `#${id} does not carry .tier-commit. ⚠️ A control with NO class falls ` +
            'through to `button { background: #0047AB }` — the EDIT blue. That is ' +
            'exactly how UPLOAD ALL CHAPTERS TO DATABASE came to look like a text box');
    });
}

check('A6. the chapter row\u2019s Del button is tier-commit', () => {
    // ⚠️ Built in a template string in admin.js, not in the markup. Most of this
    // page's controls are, which is why a check that only reads admin.html would
    // report a page that is half-tiered as fully tiered.
    const m = /<button class="([^"]*)delete-btn"/.exec(js);
    assert.ok(m, 'the chapter-row delete button template has moved or been renamed');
    assert.match(m[1], /\btier-commit\b/,
        'Del is the canonical commit example in Jake\u2019s table and does not ' +
        'declare the tier');
});

// ─── B. THE TIER IS DECLARED, ONCE, AND SHARES ITS DECLARATION ───────────────

check('B1. .tier-commit is declared in admin.html', () => {
    assert.match(html, /button\.tier-commit\s*,/,
        'the class is applied to controls and styled nowhere, which renders as ' +
        'the default blue and passes an "is the class present" test');
});

check('B2. .tier-commit and .danger-btn share ONE declaration', () => {
    // ⚠️⚠️ THE POINT OF THIS CASE. .danger-btn is this tier under its old name,
    // on eight call sites. Giving each selector its own block is how the two
    // drift into two nearly-identical reds — Jake's number one pet peeve, and
    // the exact failure item 38 lists as "two reds doing very different jobs".
    // The next pass renames .danger-btn away; until then they must be welded.
    assert.match(html, /button\.tier-commit,\s*\n\s*button\.danger-btn\s*\{/,
        'the two selectors are no longer in one rule. If .danger-btn has been ' +
        'renamed out of existence, delete this case in that round and say so');
    assert.match(html, /button\.tier-commit:hover,\s*\n\s*button\.danger-btn:hover\s*\{/,
        'the hover states have separated, which is the same drift one state later');
});

// ─── C. COMMIT DOES NOT RESOLVE TO THE DEFAULT ──────────────────────────────

check('C1. the commit tier is not the default button background', () => {
    const dflt  = /(?:^|\n)\s*button\s*\{[^}]*background:\s*([#\w]+)/.exec(html);
    const commit = /button\.tier-commit,\s*\n\s*button\.danger-btn\s*\{[^}]*background:\s*([#\w]+)/.exec(html);
    assert.ok(dflt && commit, 'could not read both backgrounds out of the style block');
    assert.notEqual(dflt[1].toLowerCase(), commit[1].toLowerCase(),
        '⚠️⚠️ commit and the default resolve to the SAME colour, which is the ' +
        'original defect restored: UPLOAD ALL CHAPTERS TO DATABASE looking like EDIT');
});

check('C2. #upload-all-btn is no longer classless', () => {
    // The specific regression. It shipped for the whole life of the panel with
    // no class attribute at all, and nothing noticed because nothing was looking.
    const m = /<button[^>]*id="upload-all-btn"[^>]*>/.exec(html);
    assert.ok(m, '#upload-all-btn not found');
    assert.match(m[0], /class="/,
        'the class attribute is gone again — this button inherits the EDIT blue ' +
        'the moment it has none');
});

// ─── D. THE UPLOAD CONTROL'S TIER FOLLOWS THE DATA ──────────────────────────

check('D1. .tier-create is declared, and is not the commit red', () => {
    assert.match(html, /button\.tier-create\s*\{/,
        'the create tier is applied in admin.js and styled nowhere, which paints ' +
        'the default blue and passes every "is the class set" check');
    const create = /button\.tier-create\s*\{[^}]*background:\s*([#\w]+)/.exec(html);
    const commit = /button\.tier-commit,\s*\n\s*button\.danger-btn\s*\{[^}]*background:\s*([#\w]+)/.exec(html);
    assert.ok(create && commit, 'could not read both tier backgrounds');
    assert.notEqual(create[1].toLowerCase(), commit[1].toLowerCase(),
        'create and commit resolve to the same colour, so the state the button is ' +
        'in stopped being visible');
});

check('D2. the painter swaps BOTH classes, in opposite directions', () => {
    const fn = /function paintUploadButton\s*\(\)\s*\{[\s\S]*?\n\}/.exec(js);
    assert.ok(fn, 'paintUploadButton() is gone — the button is static again');
    assert.match(fn[0], /tier-create/, 'no create branch');
    assert.match(fn[0], /tier-commit/,
        '⚠️ no commit branch. Adding .tier-create without REMOVING .tier-commit ' +
        'leaves both classes on the button and the winner decided by source order');
});

check('D3. the label moves with the colour', () => {
    const fn = /function paintUploadButton\s*\(\)\s*\{[\s\S]*?\n\}/.exec(js)[0];
    assert.match(fn, /Overwrite Existing Chapters/i,
        'the red state does not say what it overwrites');
    assert.match(fn, /Upload All Chapters/i, 'the green state lost its label');
    // ⚠️ A green button reading "Overwrite" is worse than either mistake alone.
    assert.ok(/textContent|innerText/.test(fn),
        'the class changes and the text does not, so one of them is now lying');
});

check('D4. ⚠️⚠️ the painter and the confirm dialog read ONE predicate', () => {
    // The whole reason activeBookExists() was extracted rather than copied.
    assert.match(js, /function activeBookHasChapters\s*\(\)/,
        'the shared predicate is gone; both call sites are now guessing separately');
    const paint = /function paintUploadButton\s*\(\)\s*\{[\s\S]*?\n\}/.exec(js)[0];
    assert.match(paint, /activeBookHasChapters\s*\(\)/, 'the painter has its own copy');
    // ⚠️ BRACE-MATCHED, NOT A CHARACTER WINDOW. ROADMAP § GUARD ON STRUCTURE,
    // NEVER ON DISTANCE OR WORDS — the first draft of this case used a 1400-char
    // window and went red the moment a comment was added above the call, which is
    // a distance check wearing a structure check's label.
    const body = handlerBody(js, 'uploadAllBtn.onclick =');
    assert.ok(body, 'the upload handler moved or could not be brace-matched');
    assert.match(body, /activeBookHasChapters\s*\(\)/,
        '⚠️ the confirm dialog no longer reads the shared predicate. A second copy ' +
        'of "does this book exist" is how a green CREATE button comes to open an ' +
        '"already exists, overwrite it?" dialog');
    assert.ok(!/hasOwnProperty\.call\(bookTitlesMap, activeBookId\)/.test(body),
        'the old inline copy is back inside the handler');
});

check('D5. ⚠️⚠️ "not known yet" paints commit, never create', () => {
    // ⚠️ THE ONE DIRECTION THAT COSTS SOMETHING. loadBookList() empties
    // bookTitlesMap BEFORE its getDocs() resolves, so mid-refresh every book in
    // the library reads as new. Green on an existing book is a destroyed book.
    assert.match(js, /let bookListLoaded\s*=\s*false/,
        'the "have I actually loaded the list" flag is gone, so an empty map reads ' +
        'as a library with no books in it');
    const pred = /function activeBookExists\s*\(\)\s*\{[\s\S]*?\n\}/.exec(js);
    assert.ok(pred, 'activeBookExists() not found');
    assert.match(pred[0], /if\s*\(\s*!\s*bookListLoaded\s*\)\s*return\s+null/,
        'an unloaded list no longer returns null, so it returns false — "this book ' +
        'is new" — for every book in the library');
    const paint = /function paintUploadButton\s*\(\)\s*\{[\s\S]*?\n\}/.exec(js)[0];
    assert.match(paint, /===\s*false/,
        '⚠️ the create branch must test `=== false` exactly. `!exists` is true for ' +
        'null, which paints UNKNOWN green — the failure this case exists for');
    assert.match(js, /bookListLoaded\s*=\s*false;[\s\S]{0,200}paintTierButtons/,
        'a failed book-list read leaves the map empty and confidently wrong; the ' +
        'catch must drop back to unknown and repaint');
});

// ─── E. \u26a0\u26a0 "IT EXISTED, BUT IT WASN'T THERE" ────────────────────────────
//
// Jake: *"I updated metadata and forgot to upload the chapters so it was just...
// empty. It existed, but it wasn't there."* Save Metadata writes a book document
// with no chapters, so EXISTS and HAS-SOMETHING-TO-DESTROY are two different
// questions. Everything in this section is about keeping them apart.

check('E1. the upload control asks about CHAPTERS, not existence', () => {
    const paint = /function paintUploadButton\s*\(\)\s*\{[\s\S]*?\n\}/.exec(js)[0];
    assert.ok(!/activeBookExists\s*\(\)/.test(paint),
        '\u26a0\u26a0 the painter is back on activeBookExists(). A book saved by Save ' +
        'Metadata alone EXISTS and has nothing to destroy \u2014 painting that red ' +
        'calls the most creative act on the page an overwrite');
    assert.match(paint, /activeBookHasChapters\s*\(\)/, 'no chapter-aware predicate');
});

check('E2. the chapter map is built from data already in hand', () => {
    // \u26a0 IT MUST COST NO READ. b.chapters is in loadBookList()'s snapshot
    // already \u2014 the re-upload dot has read it since v3.21.0. A getDocs on the
    // chapters subcollection here would be one read per book, every book change.
    assert.match(js, /bookHasChapters\s*\[\s*doc\.id\s*\]\s*=/,
        'the chapter map is not populated in the book-list loop');
    const loop = /querySnapshot\.forEach\([\s\S]*?\n\s{8}\}\);/.exec(js);
    assert.ok(loop, 'could not find the book-list loop');
    assert.ok(!/getDocs|getDoc\(/.test(loop[0]),
        '\u26a0\u26a0 a per-book read crept into the loop. Forty books is forty reads ' +
        'on every refresh, to sharpen a warning that already errs the safe way');
});

check('E3. \u26a0\u26a0 a book with no chapters is a GAP on the re-upload checklist', () => {
    // The defect behind Jake's empty book: age + cover + licence and no chapters
    // drew a FILLED dot \u2014 "done" \u2014 on a book that does not work at all.
    assert.match(js, /gaps\.push\(\s*['"]CHAPTERS['"]\s*\)/,
        'the dot still calls a book with no chapters done. Every other gap is a ' +
        'book that works badly; this one is a book a child opens and finds empty');
});

check('E4. the confirm dialog has the empty-book state too', () => {
    const body = handlerBody(js, 'uploadAllBtn.onclick =');
    assert.match(body, /activeBookExists\s*\(\)/,
        'the handler no longer distinguishes "exists with no chapters" from ' +
        '"does not exist" \u2014 one of those two dialogs is now wrong');
    assert.equal((body.match(/confirm\(/g) || []).length, 3,
        'expected three confirm branches (replacing / empty book / brand new); ' +
        'found ' + (body.match(/confirm\(/g) || []).length);
});

// ─── F. THE HINTS NAME WHAT THE CONTROL WRITES ──────────────────────────────
//
// Jake: *"I've never been sure what clicking it does"*, and *"uploading chapters
// also does metadata... or I've been acting like it does, so I HOPE it does."*
// \u26a0 IT DOES \u2014 the upload handler calls readBookMetadataForm(), the same
// reader Save Metadata uses. F2 is there so that stays true.

for (const id of ['upload-all-btn', 'save-title-btn', 'create-parse-btn',
                  'overwrite-btn', 'cover-remove-btn']) {
    check(`F1. #${id} carries a hint`, () => {
        const m = new RegExp('<button[^>]*id="' + id + '"[^>]*>', 's').exec(html);
        assert.ok(m, `#${id} not found`);
        assert.match(m[0], /title="[^"]{25,}"/,
            'no hint, or one too short to say anything a label does not already say');
    });
}

check('F2. \u26a0\u26a0 Upload All really does write the metadata form', () => {
    // The claim the hint makes. If a later round splits these apart, the hint
    // becomes a lie about a write, which is worse than no hint.
    const body = handlerBody(js, 'uploadAllBtn.onclick =');
    assert.match(body, /readBookMetadataForm\s*\(/,
        '\u26a0\u26a0 the upload no longer saves metadata, and both the hint and ' +
        "Jake's mental model say it does");
});

check('F3. the Save Metadata hint lists every field the form writes', () => {
    // \u26a0 THE COMPLAINT THIS ANSWERS: "the alert at the top of the page doesn't
    // actually include everything update metadata updates." A hint that lists
    // SOME of them is the same defect in a smaller font.
    const form = /function readBookMetadataForm[\s\S]*?\n\}/.exec(js)[0];
    const keys = [...form.matchAll(/^\s{8}(\w+):/gm)].map(m => m[1]);
    assert.ok(keys.length >= 10, 'could not read the form fields (' + keys.length + ')');
    const paint = /function paintSaveMetadataButton\s*\(\)\s*\{[\s\S]*?\n\}/.exec(js)[0];
    // \u26a0 JOIN THE CONCATENATED STRING PIECES BEFORE MATCHING. A hint long
    // enough to be useful is long enough to wrap, and "cleaned ' + 'by" must not
    // read as a missing field \u2014 that would be the harness failing on line
    // breaks, which is the distance-check mistake in another costume.
    const words = paint.replace(/'\s*\+\s*'/g, '').toLowerCase();
    const missing = keys.filter(k => {
        const human = k.replace(/([A-Z])/g, ' $1').toLowerCase();
        return !words.includes(human) && !words.includes(k.toLowerCase());
    });
    assert.deepEqual(missing, [],
        'fields written by readBookMetadataForm() and not named in the hint: ' +
        missing.join(', ') + '. Add them in the same edit as the form');
});

let failed = 0;
for (const [state, name] of results) {
    console.log(`  ${state === 'ok' ? 'ok  ' : 'FAIL'} ${name}`);
    if (state !== 'ok') failed++;
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
