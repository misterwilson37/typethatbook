// arcade-mount-test.mjs v1.0.0 — Round 116 (Sun).
//
// ⚠️⚠️ THE FIRST HARNESS IN THIS PROJECT THAT ACTUALLY RUNS A GAME VIEW, AND IT
// FOUND A DEFECT IN ITS FIRST MINUTE.
//
// HANDOFF's rule 2, written after `arcade.html` shipped blank at 93/93: *"A
// GREEN SUITE DOES NOT MEAN THE PAGES LOAD."* `module-parse-test.mjs` closed the
// parse half. `arcade-panels-test.mjs` closed the *panel drawing* half by
// calling drawRadar() and friends against a recording context. ⭐ NEITHER OF
// THEM HAS EVER CALLED mount(), so nothing in this repo had ever executed the
// frame loop, the input path, the spawn path or the teardown of a game.
//
// ⚠️⚠️ WHAT THAT COST, FOUND HERE: `game-chrome.js`'s `pauseKey` was declared
// INSIDE showReady() while `destroy()` removed its listener at MOUNT scope.
//   * Every teardown threw `ReferenceError: pauseKey is not defined`, so every
//     statement after that line was skipped — the panel, the control bar, and
//     (in the caller) the canvas and `board.destroy()`. `arcade.html` destroys
//     and re-mounts on every launch, so switching cabinets stacked a dead
//     canvas on the page each time.
//   * showReady() runs again on every RESTART, so the listener was re-added
//     each time and Escape called setPaused() TWICE per press — pause,
//     immediately unpause. **Escape-to-pause stopped working after the first
//     "play again"**, which is the precondition Jake asked for so the hover card
//     would have something to hang off.
// All 97 harnesses were green over both, for as long as both existed.
//
// ⚠️ WHAT THIS FILE MAY NOT BECOME: a second copy of the game rules. It asserts
// only things that are true of ANY view — it draws, it banks, it tears down
// cleanly — plus the two chrome behaviours above. Anything about how a word
// splits or what a keystroke is worth belongs in shatter-board-test.mjs and
// game-shell-test.mjs, which test it properly and without a DOM.
//
// ⚠️ jsdom HAS NO CANVAS. The context below answers every call and records the
// method NAMES, which is enough to ask "did the render path run to the end"
// and deliberately not enough to ask "did it look right" — that is Part K of
// arcade-panels-test.mjs, against a real recording context.

import { JSDOM } from 'jsdom';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

// ⚠️ ONE DOM FOR THE WHOLE FILE. jsdom is slow to build and the views attach to
// `window`, so a per-test DOM would also need a per-test module registry.
const dom = new JSDOM('<!doctype html><div id="host"></div>', { pretendToBeVisual: true });
const g = globalThis;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.getComputedStyle = el => dom.window.getComputedStyle(el);
g.devicePixelRatio = 2;
// ⚠️ NOT dom.window.performance — it delegates to the global `performance`,
// which we are in the middle of replacing, and the two recurse until the stack
// blows. A plain monotonic clock is all any view asks for.
const T0 = Date.now();
g.performance = { now: () => Date.now() - T0 };
g.requestAnimationFrame = cb => setTimeout(() => cb(g.performance.now()), 6);
g.cancelAnimationFrame = clearTimeout;
dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

/** Every canvas call answered; the method names remembered. */
const drawn = new Set();
const ctx = new Proxy({}, {
    get(_, k) {
        if (k === 'canvas') return { width: 800, height: 600 };
        if (k === 'measureText') return t => ({ width: String(t).length * 7 });
        if (k === 'createLinearGradient' || k === 'createRadialGradient') {
            return () => ({ addColorStop() {} });
        }
        if (typeof k === 'symbol') return undefined;
        return () => { drawn.add(k); };
    },
    set() { return true; },
});
dom.window.HTMLCanvasElement.prototype.getContext = () => ctx;
const RECT = { width: 800, height: 600, left: 0, top: 0, right: 800, bottom: 600 };
dom.window.HTMLElement.prototype.getBoundingClientRect = () => RECT;

const { mount } = await import('../game-shatter.js');
const { COUNTDOWN_MS } = await import('../game-chrome.js');

const fire = key => dom.window.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key, bubbles: true }));
const tick = (n = 1) => new Promise(r => setTimeout(r, n));
const btn = label => [...document.querySelectorAll('button')]
    .find(b => (b.textContent || '').trim() === label);

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nA — A VIEW MOUNTS, DRAWS, BANKS AND TEARS DOWN');
// ═════════════════════════════════════════════════════════════════════════════
const host = document.getElementById('host');
let seconds = 0;
const rand = (() => { let x = 42; return () => (x = (x * 48271) % 2147483647) / 2147483647; })();
const inst = mount(host, {
    config: { targets: ['unusually', 'something', 'asdfjk', 'sunlight', 'carefully'],
              minWPM: 15, rand },
    onSecond: () => { seconds++; },
});

ok(host.querySelector('canvas') != null, 'mount() puts a canvas in the host');
await tick(30);
ok(drawn.has('fillRect') && drawn.has('fillText'),
   'the frame loop runs and paints before the student has done anything');

ok(btn('Start') != null, 'the get-ready panel offers Start');
fire('Enter');
// ⚠️ COUNTDOWN_MS IS IMPORTED, NOT GUESSED. The first draft waited 60ms, every
// keystroke was correctly ignored by the get-ready guard, and five assertions
// went red against perfectly good code — which is the shape of failure this
// suite's header warns about twice.
await tick(COUNTDOWN_MS + 150);
ok(btn('Start') == null, 'and the panel is gone once the countdown has run');

// ⚠️ TYPED BLIND, ON PURPOSE. This harness must not know which letter any pane
// wants — that is the board's business and shatter-board-test.mjs's. Spraying
// the alphabet exercises the correct path, the miss path and the clear path
// without this file learning a single rule.
const ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
for (let i = 0; i < 260; i++) {
    await tick(6);
    fire(ALPHA[(i * 7) % ALPHA.length]);
    if (i % 90 === 0) fire(' ');
}

const rep = inst.report();
ok(rep.chars > 0, 'correct keystrokes reached the director (' + rep.chars + ')');
ok(rep.mistakes > 0, '\u26a0 and so did the misses \u2014 an unmatched key is a ' +
   'mistake, never a no-op (' + rep.mistakes + ')');
ok(rep.targetsCleared > 0,
   '\u2b50 at least one pane was typed out and shattered (' + rep.targetsCleared + ')');
// ⭐ THE SEAM. Time is the only thing Shatter produces that the app keeps; a
// view that draws beautifully and never emits a second does nothing, which is
// what Escape Key did for twenty rounds.
ok(seconds > 0, '\u26a0\u26a0 onSecond() fired \u2014 the graded seconds reach the ' +
   'host (' + seconds + ')');
ok(seconds <= Math.ceil(rep.seconds) + 1,
   'and never more of them than the clock has counted');

// ⚠️ THE WHOLE STAINED-GLASS PATH RAN, not just a background fill. `clip` is
// only ever called by drawPane() — it is how the panels are kept inside the
// glass — so its presence means a real pane was drawn with real panels.
ok(drawn.has('clip'),
   '\u2b50 drawPane() ran: the panels were clipped to the pane');
ok(drawn.has('rotate'),
   'and the panes and the prism were rotated into place');

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nB — ESCAPE STILL PAUSES AFTER A RESTART');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THE REGRESSION. showReady() used to register the pause listener, and it
// runs again on every restart — so the second registration made Escape pause
// and unpause in the same press. ⭐ COUNTED RATHER THAN INSPECTED: a text check
// for where the addEventListener call sits would pass the day someone moves it
// somewhere else that is also wrong.
{
    let keydownListeners = 0;
    const realAdd = dom.window.addEventListener.bind(dom.window);
    dom.window.addEventListener = (type, fn, cap) => {
        if (type === 'keydown') keydownListeners++;
        return realAdd(type, fn, cap);
    };
    // Drive a restart the way a student does: finish, then "Play again".
    const again = btn('Play again');
    if (again) again.click();
    else {
        // Not dead yet — the chrome's own restart control does the same thing.
        const r = btn('Restart') || btn('Again');
        if (r) r.click();
    }
    await tick(20);
    ok(keydownListeners === 0,
       '\u26a0\u26a0 a restart adds NO new keydown listener \u2014 the pause key is ' +
       'registered once, at mount (' + keydownListeners + ' added)');
    dom.window.addEventListener = realAdd;
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nC — TEARDOWN COMPLETES, AND LEAVES NOTHING BEHIND');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THIS IS THE ASSERTION THAT WAS RED. destroy() threw partway through, so
// every line after the throw was skipped and the caller's own cleanup never
// ran at all. `arcade.html` destroys and re-mounts on every launch.
{
    let threw = null;
    try { inst.destroy(); } catch (e) { threw = e; }
    ok(threw == null,
       '\u26a0\u26a0 destroy() completes without throwing' +
       (threw ? ' \u2014 ' + threw.message : ''));
    ok(host.querySelectorAll('canvas').length === 0,
       '\u26a0\u26a0 and the canvas is gone \u2014 a throw partway through destroy() ' +
       'leaves it on the page, and switching cabinets stacks them');
    ok(host.querySelectorAll('button').length === 0,
       '\u2b50 and so are the chrome\u2019s controls');
}

console.log(fail
    ? `\narcade-mount-test: ${pass} passed, ${fail} FAILED`
    : `arcade-mount-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
