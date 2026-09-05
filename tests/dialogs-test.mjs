// dialogs-test.mjs — ⚠️⚠️ ROADMAP 39: reports.html HAS NO BROWSER DIALOGS LEFT,
// AND A HALF-CONVERTED PAGE IS WORSE THAN AN UNCONVERTED ONE.
//
// 22 `alert()`/`confirm()` calls lived on that page. The reason the item insists
// on whole pages rather than one call at a time is not tidiness:
//
//   ⚠️⚠️ `if (!confirm(x)) return;` IS SYNCHRONOUS. A MODAL IS NOT. An unawaited
//   `ttbConfirm()` returns a PROMISE, which is TRUTHY, so `if (!p) return;` never
//   returns — and the destructive action runs WITHOUT WAITING FOR THE ANSWER.
//
// That is a data-loss bug that looks like a working confirmation, and it is what
// Part B exists to make impossible. Everything else here is secondary to it.

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../reports.html', import.meta.url), 'utf8');

// ⚠️ COMMENTS STRIPPED. This file's own header explains the conversion by naming
// `alert()` and `confirm()` repeatedly; reading that as code would fail the round
// against correct source. `://` is protected first so import URLs survive.
const code = src
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

// ─── A. NO BROWSER DIALOGS SURVIVE ──────────────────────────────────────────

for (const [fn, why] of [
    ['alert',   'information that steals focus and demands a dismissal'],
    ['confirm', 'a synchronous question a styled page cannot ask'],
]) {
    check(`A. reports.html calls no bare ${fn}() — ${why}`, () => {
        const hits = [...code.matchAll(new RegExp('(?<![.\\w])' + fn + '\\s*\\(', 'g'))];
        assert.equal(hits.length, 0,
            `${hits.length} bare ${fn}() call(s) are back. ⚠️⚠️ THE PAGE CONVERTS AS ` +
            'A WHOLE OR NOT AT ALL — one native dialog among twenty styled ones is ' +
            'the state item 39 says is worse than never having started');
    });
}

// ─── B. ⚠️⚠️ EVERY CONFIRMATION IS AWAITED ──────────────────────────────────

check('B1. ⚠️⚠️ every ttbConfirm() is awaited', () => {
    // THE CASE THIS FILE IS FOR. An unawaited call returns a truthy Promise, so
    // `if (!ttbConfirm(...)) return;` never returns and the delete happens anyway.
    const calls = [...code.matchAll(/(\w+\s+|[^\s\w]\s*)?ttbConfirm\s*\(/g)];
    const bad = calls.filter(m => {
        const before = code.slice(Math.max(0, m.index - 40), m.index + m[0].length);
        return !/await\s+ttbConfirm\s*\($/.test(before) && !/function ttbConfirm/.test(before);
    });
    assert.deepEqual(bad.map(m => m[0]), [],
        '⚠️⚠️ an unawaited ttbConfirm(). It returns a PROMISE, which is TRUTHY, so ' +
        'the guard that was meant to stop a destructive action does nothing. This ' +
        'is the exact failure that makes a half-converted page dangerous');
});

// ⚠️ THERE IS NO B2, AND THAT IS DELIBERATE. The first draft tried to assert
// that every `await ttbConfirm(...)` sits in an `async` function, by walking
// backwards for the nearest `function` or `=>`. That heuristic is wrong the
// moment a call sits inside a nested callback, and it failed against CORRECT
// source.
//
// ⭐ IT IS ALSO REDUNDANT: `await` in a non-async function is a SyntaxError, and
// undefined-calls-test.mjs already PARSES this page's inline scripts. The parser
// owns that property completely, and it owns it better than a regex can.
// ⚠️ A check that duplicates the parser badly is worse than no check — it fails
// on good code, gets loosened, and then guards nothing.

// ─── C. THE PRIMITIVES KEEP THE PROPERTIES THAT MAKE THEM SAFE ──────────────

check('C1. ⚠️⚠️ dismissal resolves as "no", never as "yes"', () => {
    // Native <dialog> closes on Escape whether you plan for it or not. A
    // dismissed destructive confirmation that resolved TRUE is the worst bug this
    // pattern can have.
    const fn = /function ttbChoose\([\s\S]*?\n    \}/.exec(src);
    assert.ok(fn, 'ttbChoose() is gone');
    assert.match(fn[0], /addEventListener\(\s*'close'/,
        'nothing listens for the dialog closing, so Escape leaves the Promise ' +
        'pending forever and the button never responds again');
    assert.match(fn[0], /finish\(null\)/,
        'dismissal does not resolve null');
    const conf = /function ttbConfirm\([\s\S]*?\n    \}/.exec(src)[0];
    assert.match(conf, /===\s*true/,
        '⚠️⚠️ ttbConfirm must resolve on `=== true` exactly. Anything looser makes ' +
        'a dismissal (null) or a stray value read as consent');
});

check('C2. ⚠️ the safe choice takes focus, never the destructive one', () => {
    // A teacher who presses Enter out of habit must not delete a session by
    // reflex — the dialog exists to interrupt that reflex, not to arm it.
    const fn = /function ttbChoose\([\s\S]*?\n    \}/.exec(src)[0];
    assert.match(fn, /button:not\(\.ttb-modal-danger\)/,
        'focus is no longer steered away from the destructive button');
});

check('C3. the dialog is a native <dialog> opened with showModal()', () => {
    // ⭐ It gives the focus trap, the inert background and Escape for free —
    // three things a hand-rolled overlay gets wrong quietly.
    assert.match(src, /<dialog[^>]*id="ttb-modal"/,
        'the native dialog element is gone; a div overlay loses the focus trap and ' +
        'Escape, and nothing on screen says so');
    assert.match(code, /\.showModal\(\)/, 'opened with show() or a class instead of ' +
        'showModal(), which does not make the background inert');
});

check('C4. ⚠️ information does NOT get a modal', () => {
    // An alert() that only reports something does not deserve to steal focus or
    // demand a dismissal. 14 of the 22 were exactly that.
    const fn = /function ttbNotice\([\s\S]*?\n    \}/.exec(src);
    assert.ok(fn, 'ttbNotice() is gone — the information path went back to a modal');
    assert.ok(!/showModal/.test(fn[0]),
        'ttbNotice opens the modal, so every "no runs found" now interrupts');
    assert.match(fn[0], /querySelectorAll\(':scope > \.ttb-banner'\)/,
        'banners no longer replace their predecessor; a stack of three stale ' +
        'messages is how a page stops being read at all');
});

check('C5. ⚠️ row-scoped messages can land beside their row', () => {
    // A banner at the top of a forty-student report, about a run 800px down, is a
    // message the teacher has to go looking for — a failure alert() did not have.
    assert.match(code, /function rowHost\(/, 'rowHost() is gone');
    assert.ok((code.match(/host:\s*rowHost\(e\)/g) || []).length >= 4,
        'the row-scoped messages inside the report-body handler no longer pass a ' +
        'host, so they surface at the top of the page instead of beside the row');
});

check('C6. the fallback host is above the fold, not at the end of <body>', () => {
    // ⚠️ ITS FIRST HOME WAS THE END OF <body>. An information banner below the
    // fold is an alert() with the shouting removed and none of the benefit.
    const host = src.indexOf('id="ttb-banner-host"');
    const results_ = src.indexOf('id="results-container"');
    assert.ok(host > 0 && results_ > 0, 'the host or the results container is gone');
    assert.ok(host < results_,
        'the banner host has moved below the results container, so messages about ' +
        'a report appear underneath it');
});

let failed = 0;
for (const [state, name] of results) {
    console.log(`  ${state === 'ok' ? 'ok  ' : 'FAIL'} ${name}`);
    if (state !== 'ok') failed++;
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
