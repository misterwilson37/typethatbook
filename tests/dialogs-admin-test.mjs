// dialogs-admin-test.mjs — ⚠️⚠️ ROADMAP 39: admin.js's HALF, THE ONE
// reports.html's OWN dialogs-test.mjs (Round 73) COULD NOT COVER — the two
// files are different pages with different modals, and a check written
// against one page's markup does not read the other's.
//
// Same reason for existing as dialogs-test.mjs: `if (!confirm(x)) return;`
// is SYNCHRONOUS. A modal is not. An unawaited `ttbConfirm()` returns a
// PROMISE, which is TRUTHY, so `if (!p) return;` never returns — and the
// destructive action runs WITHOUT WAITING FOR THE ANSWER. All 45 sites on
// this page went together, in the same round: 30 alert() + 15 confirm(),
// recounted fresh against the actual file rather than trusted from an
// older round's line numbers, which had already drifted by 18 lines before
// this round touched anything.
//
// ⚠️⚠️ THIS PAGE HAD A CORRECTNESS TRAP reports.html's version of this file
// never needed to think about: admin.html carries TWO full-viewport,
// z-index:200, fully opaque custom modals (#warning-modal,
// #error-wizard-modal) that predate this conversion. A native <dialog>
// opened with showModal() renders in the browser's own top layer regardless
// of z-index, so ttbConfirm()/ttbChoose() are unaffected — but ttbNotice()'s
// plain-<div> banner is NOT, and would render invisibly behind either
// modal's backdrop if it used the page-level host while one was open. Part D
// below is the regression test for the one place this actually happens.

import { readFileSync } from 'node:fs';

const js   = readFileSync(new URL('../admin.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../admin.html', import.meta.url), 'utf8');

// ⚠️ COMMENTS STRIPPED, SAME METHOD AS dialogs-test.mjs. This file's own
// header explains the conversion by naming alert()/confirm()/prompt()
// repeatedly; reading that as code would fail the round against correct
// source. `://` is protected first so import URLs survive.
const code = js
    .replace(/:\/\//g, ':\u0001\u0001')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/:\u0001\u0001/g, '://');

const results = [];
function check(name, fn) {
    try { fn(); results.push(['ok', name]); }
    catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
}

function extractFn(s, name) {
    const start = s.indexOf(`function ${name}(`);
    if (start < 0) return null;
    // ⚠️ SKIP THE PARAMETER LIST BEFORE COUNTING BODY BRACES. ttbConfirm() and
    // ttbNotice() both destructure defaults — `{ title = 'Confirm', ... } = {}`
    // — which has its own { } INSIDE the parens. Counting braces from the
    // first `{` after the function name finds that one instead of the body,
    // and returns a truncated slice that silently fails every check against
    // the real body. Paren-depth-count past `(...)` first, then find the
    // body's own `{`.
    let parenDepth = 0, i = s.indexOf('(', start);
    for (; i < s.length; i++) {
        if (s[i] === '(') parenDepth++;
        else if (s[i] === ')') { parenDepth--; if (parenDepth === 0) { i++; break; } }
    }
    const bodyStart = s.indexOf('{', i);
    let depth = 0;
    for (let j = bodyStart; j < s.length; j++) {
        if (s[j] === '{') depth++;
        else if (s[j] === '}') { depth--; if (depth === 0) return s.slice(start, j + 1); }
    }
    return null;
}

// ─── A. NO BROWSER DIALOGS SURVIVE, EXCEPT THE ONE NAMED EXCEPTION ─────────

for (const [fn, why] of [
    ['alert',   'information that steals focus and demands a dismissal'],
    ['confirm', 'a synchronous question a styled page cannot ask'],
]) {
    check(`A. admin.js calls no bare ${fn}() — ${why}`, () => {
        const hits = [...code.matchAll(new RegExp('(?<![.\\w])' + fn + '\\s*\\(', 'g'))];
        assert(hits.length === 0,
            `${hits.length} bare ${fn}() call(s) are back. ⚠️⚠️ THE PAGE CONVERTS AS ` +
            'A WHOLE OR NOT AT ALL — one native dialog among the rest is the state ' +
            'item 39 says is worse than never having started');
    });
}

check('A. admin.js calls prompt() EXACTLY ONCE, and it is the deliberate one', () => {
    // ⚠️⚠️ prompt() IS A THIRD DIALOG TYPE THIS ITEM'S OWN COUNT NEVER
    // INCLUDED (30 alert() + 15 confirm() = 45, recounted fresh this round).
    // The delete-book flow chose a TYPED confirmation over confirm() on
    // purpose — "a confirm() dialog is one careless Return away from gone" —
    // and ttbChoose()/ttbConfirm() have no typed-input capability to replace
    // it with. This is not an oversight; it is one exception, pinned so a
    // SECOND prompt() creeping in elsewhere doesn't get to cite this one as
    // precedent without a round actually deciding that.
    const hits = [...code.matchAll(/(?<![.\w])prompt\s*\(/g)];
    assert(hits.length === 1,
        `expected exactly 1 prompt() (the delete-book typed confirmation), found ${hits.length}`);
    const idx = hits[0].index;
    const before = code.slice(Math.max(0, idx - 4000), idx);
    assert(/deleteBookBtn\.onclick/.test(before),
        'the one allowed prompt() has moved out of the delete-book handler — ' +
        'wherever it is now needs its own ruling, this test cannot assume it');
});

// ─── B. ⚠️⚠️ EVERY CONFIRMATION IS AWAITED ──────────────────────────────────

for (const fnName of ['ttbConfirm', 'ttbChoose']) {
    check(`B. ⚠️⚠️ every ${fnName}() is awaited`, () => {
        // THE CASE THIS FILE EXISTS FOR. An unawaited call returns a truthy
        // Promise, so `if (!ttbConfirm(...)) return;` never returns and the
        // action happens anyway. ttbChoose() gets the same check: the
        // space-in-book-id dialog uses it directly, not through ttbConfirm().
        const calls = [...code.matchAll(new RegExp('(\\w+\\s+|[^\\s\\w]\\s*)?' + fnName + '\\s*\\(', 'g'))];
        const bad = calls.filter(m => {
            const before = code.slice(Math.max(0, m.index - 40), m.index + m[0].length);
            if (new RegExp('await\\s+' + fnName + '\\s*\\($').test(before)) return false;
            if (new RegExp('function ' + fnName).test(before)) return false;
            // ⚠️ ttbConfirm()'s OWN IMPLEMENTATION calls ttbChoose() and
            // returns the resulting promise chain directly — that's a
            // legitimate hand-off, not a dropped Promise, since ttbConfirm's
            // own callers await ttbConfirm(), not this inner call. m[0]
            // already captures a leading "return " when present (the
            // optional group matches `\w+\s+`), so check THAT directly
            // rather than re-scanning further back.
            const after = code.slice(m.index, m.index + 60);
            if (/^return\s+/.test(m[0]) && new RegExp('^return\\s+' + fnName + '\\s*\\(title,').test(after)) return false;
            return true;
        });
        assert(bad.length === 0,
            `⚠️⚠️ an unawaited ${fnName}(): ${bad.map(m => m[0]).join(', ')}. It returns ` +
            'a PROMISE, which is TRUTHY, so the guard that was meant to stop a ' +
            'destructive action does nothing');
    });
}

// ⚠️ THERE IS NO SEPARATE "await sits in an async function" CHECK, same
// reasoning as dialogs-test.mjs's own missing B2: `await` in a non-async
// function is a SyntaxError, and node --check / this project's parse-based
// harnesses already own that property completely. Six handlers needed to
// BECOME async for the await they gained — Part D checks those by name,
// which is a real, checkable claim; "await only appears where legal" is not
// a claim worth re-deriving badly with a regex.

// ─── C. THE PRIMITIVES KEEP THE PROPERTIES THAT MAKE THEM SAFE ─────────────

check('C1. ⚠️⚠️ dismissal resolves as "no", never as "yes"', () => {
    const fn = extractFn(js, 'ttbChoose');
    assert(!!fn, 'ttbChoose() is gone');
    assert(/addEventListener\(\s*'close'/.test(fn),
        'nothing listens for the dialog closing, so Escape leaves the Promise ' +
        'pending forever and the button never responds again');
    assert(/finish\(null\)/.test(fn), 'dismissal does not resolve null');
    const conf = extractFn(js, 'ttbConfirm');
    assert(/===\s*true/.test(conf),
        '⚠️⚠️ ttbConfirm must resolve on `=== true` exactly. Anything looser makes ' +
        'a dismissal (null) or a stray value read as consent');
});

check('C2. ⚠️ the safe choice takes focus, never the destructive one', () => {
    const fn = extractFn(js, 'ttbChoose');
    assert(/button:not\(\.ttb-modal-danger\)/.test(fn),
        'focus is no longer steered away from the destructive button');
});

check('C3. the dialog is a native <dialog> opened with showModal()', () => {
    assert(/<dialog[^>]*id="ttb-modal"/.test(html),
        'the native dialog element is gone from admin.html; a div overlay loses ' +
        'the focus trap and Escape, and nothing on screen says so');
    assert(/\.showModal\(\)/.test(code),
        'opened with show() or a class instead of showModal(), which does not ' +
        'make the background inert — and does not enter the top layer, which ' +
        'this page specifically needs (see the file header)');
});

check('C4. ⚠️ information does NOT get a modal', () => {
    const fn = extractFn(js, 'ttbNotice');
    assert(!!fn, 'ttbNotice() is gone — the information path went back to a modal');
    assert(!/showModal/.test(fn),
        'ttbNotice opens the modal, so every guard message now interrupts');
    assert(/querySelectorAll\(':scope > \.ttb-banner'\)/.test(fn),
        'banners no longer replace their predecessor; a stack of stale messages ' +
        'is how a page stops being read at all');
});

// ─── D. ⚠️⚠️ THE TWO-MODAL TRAP THIS PAGE ACTUALLY HAS ─────────────────────

check('D1. ⚠️⚠️ #wizard-banner-host exists in BOTH places it needs to', () => {
    // ⚠️⚠️ THE BUG THIS PINS: #error-wizard-modal is reused by openSplitUI()
    // for an unrelated feature (chapter splitting), which rebuilds the
    // modal's ENTIRE content via content.innerHTML — destroying the static
    // host admin.html ships for the ORIGINAL wizard flow. Without a second
    // copy inside openSplitUI()'s own template, ttbNotice() would silently
    // fall through to the page-level host, which sits BEHIND this modal's
    // z-index:200 backdrop while it's open — a message created but never
    // seen. Caught by hand while converting; this is what stops it coming
    // back unnoticed.
    const staticHits = (html.match(/id="wizard-banner-host"/g) || []).length;
    assert(staticHits >= 1, 'the static #wizard-banner-host is gone from admin.html');

    const splitFn = extractFn(js, 'openSplitUI');
    assert(!!splitFn, 'openSplitUI() is gone');
    assert(/id="wizard-banner-host"/.test(splitFn),
        "openSplitUI()'s own content.innerHTML template no longer includes a " +
        'wizard-banner-host — the static one in admin.html gets destroyed the ' +
        'moment this function runs, and any ttbNotice() fired from the split UI ' +
        'would render invisibly behind the modal backdrop');
});

check('D2. ⚠️ the ONE alert() that fired inside the wizard now targets the wizard host', () => {
    // wizardSaveBtn's validation failure is the one site that actually needed
    // this — everywhere else on the page can safely use ttbNotice()'s
    // page-level default, since nothing else fires while a same-page overlay
    // is showing.
    const fn = extractFn(js, 'showErrorWizard');
    const saveHandlerIdx = code.indexOf('wizardSaveBtn.onclick');
    assert(saveHandlerIdx > -1, 'wizardSaveBtn.onclick is gone');
    const body = code.slice(saveHandlerIdx, saveHandlerIdx + 800);
    assert(/ttbNotice\([\s\S]*?host:\s*document\.getElementById\('wizard-banner-host'\)/.test(body),
        "wizardSaveBtn's validation message no longer names the wizard-local " +
        'host explicitly — it would fall back to the page-level banner, which ' +
        'is invisible while this modal is open');
});

// ─── E. THE SIX HANDLERS THAT HAD TO BECOME async DID ──────────────────────

for (const [marker, label] of [
    ['createResetBtn) createResetBtn.onclick = async', 'createResetBtn.onclick'],
    ['wizardCancelBtn.onclick = async',                 'wizardCancelBtn.onclick'],
    ['replaceAllBtn.onclick = async',                   'replaceAllBtn.onclick'],
    ['replaceWordBtn.onclick = async',                  'replaceWordBtn.onclick'],
    ['async function mergeWithNext',                    'mergeWithNext()'],
]) {
    check(`E. ${label} is async — it carries an awaited confirmation now`, () => {
        assert(code.includes(marker),
            `${label} is not declared async — an await inside it would be a ` +
            'SyntaxError, so either the confirmation was removed or this ' +
            'handler is broken');
    });
}

check("E. mergeWithNext()'s one caller awaits it, not fire-and-forget", () => {
    // ⚠️ Making a shared function async changes its contract for every
    // caller. This function has exactly one (verified fresh this round, not
    // assumed from an older count) — this pins that the caller was updated
    // in the same edit, not left calling an async function without await.
    assert(/btn\.onclick = async \(e\) => \{ await mergeWithNext\(/.test(code),
        "mergeWithNext()'s caller does not await it — if a second caller is " +
        'ever added without checking this, an unawaited call silently drops ' +
        'any error the confirmation or the merge itself throws');
});

check('E. wireClearApprovals()\u2019s clearLink.onclick is async', () => {
    const fn = extractFn(js, 'wireClearApprovals');
    assert(!!fn, 'wireClearApprovals() is gone');
    assert(/clearLink\.onclick = async/.test(fn),
        'clearLink.onclick is not async — the ttbConfirm() it carries would throw');
});

// ─── assert() shim: no node:assert import needed for boolean checks ────────
function assert(cond, msg) { if (!cond) throw new Error(msg); }

let failed = 0;
for (const [state, name] of results) {
    console.log(`  ${state === 'ok' ? 'ok  ' : 'FAIL'} ${name}`);
    if (state !== 'ok') failed++;
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
