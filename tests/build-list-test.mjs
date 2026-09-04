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

let failed = 0;
for (const [state, name] of results) {
    console.log(`  ${state === 'ok' ? 'ok  ' : 'FAIL'} ${name}`);
    if (state !== 'ok') failed++;
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
