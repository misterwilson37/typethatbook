// game-idle-time-test.mjs v1.0.0 — Round 162. A GAME LEFT RUNNING BANKS NO TIME.
//
// Jake, 2026-11-09: *"Kids are letting the games play and letting the time count
// up. Games should not count any time that students are not typing."*
//
// Deadline banked every second of wall clock: start it, walk away, and the day's
// minutes climbed until the domes were gone. Shatter, Shards and Escape Key already
// stopped after 3 s without a key — but a key held down (auto-repeat) kept them alive.
//
// ⭐ RUN, NOT READ (Rule 10). Each real view is mounted on a fake clock, the student
// types for a moment and then stops, and the harness counts the onSecond() calls the
// host would bank. ⚠️ A FAILS against game-deadline.js v1.22.0 (it banked ~all of the
// idle stretch); B FAILS against game-shatter.js v1.19.0 / game-escape.js v2.10.0.
import { JSDOM } from 'jsdom';
import { trustedKeyDispatcher } from './fixtures/trusted-key.mjs';

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
const frame = (ms = 16) => {
    CLOCK += ms;
    const due = [...cbs.entries()]; cbs = new Map();
    for (const [, cb] of due) cb(CLOCK);
};
const run = (ms) => { for (let t = 0; t < ms; t += 16) frame(16); };
dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const ctx = new Proxy({}, {
    get(_, k) {
        if (k === 'canvas') return { width: 800, height: 600 };
        if (k === 'measureText') return t => ({ width: String(t).length * 7 });
        if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
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
const { mount: mountEscape } = await import('../game-escape.js');
const { COUNTDOWN_MS } = await import('../game-chrome.js');
const key = trustedKeyDispatcher(dom.window);

const WORDS = ['sunlight', 'morning', 'planted', 'reading', 'whisper', 'kitchen'];
const GAMES = [
    ['Deadline', mountDeadline, {}],
    ['Shatter', mountShatter, {}],
    ['Escape Key', mountEscape, {}],
];

function launch(mount, over) {
    const host = document.getElementById('host');
    host.innerHTML = '';
    const banked = { n: 0 };
    const h = mount(host, {
        config: Object.assign({
            targets: WORDS.slice(), targetWPM: 20, endless: true, shields: 6,
            rand: () => 0.5,
        }, over),
        onSecond: () => { banked.n++; },
        onEnd() {},
    });
    frame(0); key('Enter');
    for (let i = 0; i < 8; i++) frame(COUNTDOWN_MS / 4);
    return { h, banked };
}

// Two seconds of steady real typing (a key every 200 ms), then hands off.
function typeBriefly() {
    for (let i = 0; i < 10; i++) { key(WORDS[0][i % WORDS[0].length]); run(200); }
}

console.log('\nA — HANDS OFF THE KEYBOARD: THE BANK STOPS');
for (const [name, mount, over] of GAMES) {
    const { h, banked } = launch(mount, over);
    typeBriefly();
    const before = banked.n;
    run(30000);                        // thirty seconds of nobody typing
    const idleBanked = banked.n - before;
    ok(idleBanked <= 4,
       `⚠️⚠️ ${name}: 30 s with no keys banks at most the 3 s grace (banked ${idleBanked})`);
    ok(before >= 1, `${name}: real typing still banks time (${before})`);
    // And it resumes the moment they type again.
    const atResume = banked.n;
    typeBriefly();
    ok(banked.n > atResume, `${name}: typing again banks again`);
    try { h.destroy(); } catch (_) {}
}

console.log('\nB — A HELD-DOWN KEY IS NOT TYPING');
for (const [name, mount, over] of GAMES) {
    const { h, banked } = launch(mount, over);
    typeBriefly();
    const before = banked.n;
    // A key held for 30 s: the OS sends auto-repeat keydowns ~30 times a second.
    for (let t = 0; t < 30000; t += 33) { key('a', { repeat: true }); frame(33); }
    const heldBanked = banked.n - before;
    ok(heldBanked <= 4,
       `⚠️⚠️ ${name}: a key held down for 30 s banks at most the 3 s grace (banked ${heldBanked})`);
    try { h.destroy(); } catch (_) {}
}

console.log(fail
    ? `\ngame-idle-time-test: ${pass} passed, ${fail} FAILED`
    : `\ngame-idle-time-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   ✗ ' + f)); process.exit(1); }
