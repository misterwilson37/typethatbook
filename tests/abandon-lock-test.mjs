// abandon-lock-test.mjs v1.0.0 — ⚠️⚠️ A STUDENT MUST ALWAYS BE ABLE TO LET GO OF
// THE WORD THEY ARE ON. Round 119 (Hammond).
//
// ═════════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS — A CONTROL THE GAME ADVERTISED AND COULD NOT PERFORM
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-11, and a student told him the same day: *"There's no escape
// key. So if I think I'm typing one word, but I'm actually typing another,
// there's no way to get out of it to start a new word... when the sky is covered
// in words, you can't tell where you're missing."*
//
// ⭐⭐ AND THE CAUSE IS NOT THE ONE IT LOOKS LIKE — THIS FILE'S OWN MUTATION TEST
// CORRECTED ITS AUTHOR. The first draft of this header said Escape had become
// *unreachable*, because `game-chrome.js` v1.8.0 binds it to pause in the
// capture phase and calls `stopPropagation()`. ⚠️⚠️ `stopPropagation()` STOPS
// OTHER TARGETS, NOT OTHER LISTENERS ON THE SAME ONE — that is
// `stopImmediatePropagation()`. Both handlers sit on `window`, so **Escape did
// both things at once**: released the lock AND paused the game.
//
// ⭐ SO THE MECHANIC WAS ALIVE AND UNUSABLE, which is a different and worse
// defect than a dead one. You could not let go of a word without freezing the
// game, and the freeze is the only half a student can see. Jake reported it as
// *"there's no escape key"* because that is exactly what it is to play.
// ⚠️⚠️ AN ARBITRATION THAT DOES NOT ARBITRATE IS WORSE THAN NONE: the author
// chose, wrote the choice down, and the code did something neither option
// described — and a green suite over ten rounds agreed with the comment.
//
// ⚠️⚠️ AND IN DEADLINE IT WAS A TRAP, NOT A MISSING CONVENIENCE. Once `locked` is
// set every key goes to it, right or wrong, and the auto-lock skips any target
// with `typed > 0` as "already someone's business" — so a student who locked the
// wrong word was **stuck in it until it landed**, and the half-typed word could
// never be re-acquired either.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ WHAT THIS FILE ASSERTS, AND THE ONE IT REFUSES TO
// ═════════════════════════════════════════════════════════════════════════════
//
// It asserts the ESCAPE HATCH EXISTS AND IS FREE, in every view, driven through
// the real key handler. ⚠️ It deliberately does NOT assert that Escape pauses —
// that is `arcade-mount-test.mjs`'s, and duplicating it here would make this
// file go red for a reason that is not this defect.
//
// ⚠️ AND PART D IS THE HALF THAT WOULD HAVE CAUGHT THE ORIGINAL: a hint may not
// name a key the view does not handle. The code was only half the failure; the
// other half was a sentence on screen that stayed true-looking for ten rounds.

import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = f => readFileSync(path.join(ROOT, f), 'utf8');

let pass = 0, fail = 0; const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const dom = new JSDOM('<!doctype html><div id="host"></div>', { pretendToBeVisual: true });
const g = globalThis;
g.window = dom.window; g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement; g.KeyboardEvent = dom.window.KeyboardEvent;
g.getComputedStyle = el => dom.window.getComputedStyle(el);
g.devicePixelRatio = 1;
g.Image = dom.window.Image;

let CLOCK = 0;
g.performance = { now: () => CLOCK };
let cbs = new Map(); let nextRaf = 1;
g.requestAnimationFrame = cb => { const id = nextRaf++; cbs.set(id, cb); return id; };
g.cancelAnimationFrame = id => { cbs.delete(id); };
// ⚠️ A QUEUE, NOT A SLOT — game-chrome.js's countdown runs a second rAF loop
// alongside the view's, and a one-slot fake lets them clobber each other so no
// countdown ever finishes. Learned the hard way in adaptive-arcade-test.mjs.
const frame = (ms = 16) => {
    CLOCK += ms;
    const due = [...cbs.entries()]; cbs = new Map();
    for (const [, cb] of due) cb(CLOCK);
};
dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const ctx = new Proxy({}, {
    get(_, k) {
        if (k === 'canvas') return { width: 800, height: 600 };
        if (k === 'measureText') return t => ({ width: String(t).length * 7 });
        if (k === 'createLinearGradient' || k === 'createRadialGradient') {
            return () => ({ addColorStop() {} });
        }
        if (typeof k === 'symbol') return undefined;
        return () => {};
    },
    set() { return true; },
});
dom.window.HTMLCanvasElement.prototype.getContext = () => ctx;
dom.window.HTMLElement.prototype.getBoundingClientRect =
    () => ({ width: 800, height: 600, left: 0, top: 0, right: 800, bottom: 600 });

const { mount: mountShatter } = await import('../game-shatter.js');
const { mount: mountDeadline } = await import('../game-deadline.js');
const { COUNTDOWN_MS } = await import('../game-chrome.js');

const key = k => dom.window.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

const WORDS = ['sunlight', 'morning', 'planted', 'reading', 'whisper', 'kitchen'];

function launch(mount, over = {}) {
    const host = document.getElementById('host');
    host.innerHTML = '';
    const h = mount(host, {
        config: Object.assign({
            targets: WORDS.slice(), targetWPM: 20, endless: true, shields: 3,
            adaptive: true, rand: () => 0.5,
        }, over),
        onEnd() {},
    });
    frame(0); key('Enter');
    for (let i = 0; i < 8; i++) frame(COUNTDOWN_MS / 4);
    return h;
}

/** Half-type whatever is on the board, so there is a lock to let go of. */
function halfType(h) {
    for (let i = 0; i < 200; i++) {
        const live = h.debug().panes;
        if (live.length) {
            const p = live[0];
            // ⚠️ THREE CHARACTERS, NEVER THE WHOLE WORD. A cleared target has no
            // lock to abandon, and the assertion would pass vacuously.
            for (const ch of p.text.slice(0, 3)) key(ch);
            return h.debug().panes.find(x => x.id === p.id) || null;
        }
        frame();
    }
    return null;
}

for (const [name, mount] of [['Shatter', mountShatter], ['Deadline', mountDeadline]]) {
    // ═════════════════════════════════════════════════════════════════════════
    console.log(`\n${name} — ⚠️⚠️ THE STUDENT CAN ALWAYS LET GO OF THE WORD`);
    // ═════════════════════════════════════════════════════════════════════════
    {
        const h = launch(mount);
        const started = halfType(h);
        ok(started != null && started.typed > 0,
           `${name} A1 a word is half-typed, so there is really a lock to abandon `
           + `(typed ${started && started.typed})`);

        // ⭐⭐ THE REGRESSION ITSELF. Escape is game-chrome.js's pause and does
        // NOT reach the view — asserted so that a later round which "restores"
        // the Escape branch discovers here that it cannot work, rather than in a
        // classroom. ⚠️ This is a statement about REACHABILITY, not about
        // whether abandoning should be possible; Backspace is what makes it so.
        key('Escape');
        const afterEsc = h.debug().panes.find(x => x.id === started.id);
        ok(afterEsc && afterEsc.typed > 0,
           `⚠️⚠️ ${name} A2 ESCAPE NO LONGER TOUCHES THE WORD — it is the pause key `
           + 'and nothing else. Until Round 119 it did BOTH in one keystroke, because '
           + 'game-chrome.js\'s stopPropagation() does not stop a sibling listener on '
           + 'the same target. ⭐ ONE KEY, ONE JOB');

        // ⚠️⚠️ AND RESUME, OR EVERY ASSERTION BELOW IS VACUOUS. The Escape above
        // really did pause the game, so `onKeyDown`'s own paused guard would
        // correctly swallow the Backspace and this file would report the fix as
        // broken. ⭐ THE FIRST DRAFT DID EXACTLY THAT — six red assertions
        // against correct code, and the cause was the harness pressing pause and
        // then complaining that the game was paused.
        key('Escape');

        key('Backspace');
        const afterBs = h.debug().panes.find(x => x.id === started.id);
        ok(afterBs != null,
           `${name} A3 …and Backspace does not destroy the word, only the claim on it`);
        ok(afterBs && afterBs.typed === 0,
           `⭐⭐ ${name} A4 BACKSPACE WIPES THE HALF-TYPED PROGRESS (typed `
           + `${afterBs && afterBs.typed}). Dropping the lock alone would leave a pane `
           + 'wanting a letter the student cannot see, so every attempt to start it '
           + 'over is charged as a mistake with nothing on screen to explain why');

        // ⚠️ THE WORD MUST BE TYPEABLE AGAIN FROM ITS FIRST LETTER. In Deadline
        // the auto-lock skips any target with `typed > 0`, so without the reset
        // Backspace would free the student and leave a permanently untypeable
        // missile falling on a landmark — worse than the trap it replaced.
        const accBefore = h.report().acc;
        for (const ch of afterBs.text.slice(0, 2)) key(ch);
        const again = h.debug().panes.find(x => x.id === started.id);
        ok(again && again.typed === 2,
           `⭐ ${name} A5 THE ABANDONED WORD IS TYPEABLE AGAIN FROM ITS FIRST LETTER `
           + `(typed ${again && again.typed} of 2)`);
        ok(h.report().acc >= accBefore,
           `⚠️ ${name} A6 …and starting it over cost no accuracy. Abandoning a lock is `
           + 'a tactical decision, not a mistake');

        // ⚠️ DELETE IS THE SAME KEY ON A MAC KEYBOARD, WHICH IS WHAT THIS SCHOOL
        // HAS. A fix that only answered to `Backspace` would be a fix nobody in
        // the building could press by the label on their own key.
        key('Delete');
        const afterDel = h.debug().panes.find(x => x.id === started.id);
        ok(afterDel && afterDel.typed === 0,
           `⚠️ ${name} A7 DELETE DOES IT TOO — Mac keyboards label that key \`delete\``);
        h.destroy();
    }
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nD — ⚠️⚠️ NO HINT NAMES A KEY ITS VIEW DOES NOT HANDLE');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⭐ THIS IS THE HALF THAT WOULD HAVE CAUGHT THE ORIGINAL. The code was only one
// side of the failure; the other was four sentences on screen that went on
// promising Esc for ten rounds after it stopped working, in a hint a child reads
// precisely when they are stuck.
{
    for (const f of ['game-shatter.js', 'game-deadline.js', 'game-escape.js']) {
        const src = read(f);
        const hintStart = src.indexOf('hint:');
        const hints = hintStart < 0 ? '' : src.slice(hintStart, hintStart + 2200);
        ok(!/\bEsc\b/.test(hints),
           `⚠️⚠️ D1 ${f}'s hint does not promise Esc — game-chrome.js owns that key`);
        ok(/Backspace/.test(hints),
           `D2 ${f}'s hint names Backspace, which the view really does handle`);

        // ⚠️ AND THE BRANCH IS GONE, NOT MERELY SUPERSEDED. A dead `if (e.key ===
        // 'Escape')` in a view reads to the next author as a working feature, and
        // is how this survived review three times.
        const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
        ok(!/e\.key\s*===\s*'Escape'/.test(code),
           `⭐ D3 ${f} carries no unreachable Escape branch`);
    }
}

if (fail) {
    console.log('\n  x FAILURES');
    for (const f of failures) console.log('    - ' + f);
}
console.log(`\n${fail ? 'x' : 'ok'}  abandon-lock-test.mjs — ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
