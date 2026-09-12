// adaptive-arcade-test.mjs v1.1.0 — Round 119 (Hammond): Parts H and I — the
// THIRD cabinet (Deadline has its own view; Shatter and Shards share one, so
// wiring game-shatter.js covered two and read like three), the replay that
// halved the city, and Jake's ruling that Escape Key stays non-adaptive.
// adaptive-arcade-test.mjs v1.0.0 — ROADMAP 118a, the wiring half.
// Round 119 (Hammond).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ WHAT THIS FILE EXISTS TO CATCH IS **NOT** "DOES SHATTER ADAPT".
// ═════════════════════════════════════════════════════════════════════════════
//
// It is the two ways the single line `adaptive: true` can hurt a child:
//
//   1. ⚠️⚠️ **A GAME THAT ASKS TO ADAPT AND HAS NOBODY MEASURING IT.**
//      `arcadeConfig()` is not Shatter's config — `isFreePlay()` sends Shatter,
//      Shards, Escape Key AND full-scope Deadline through it. Only Shatter feeds
//      the calibrator. For the other two `confident` can never become true, so
//      the pre-comfort seed — `min(targetWPM, floorWPM)` — would have been the
//      pace for the WHOLE RUN, FOREVER. Measured against a real `arcadeConfig()`
//      on a 20 WPM gate: spawn interval 2400ms → 6000ms, lifetime 16.8s → 42.0s.
//      ⭐ THE SEED IS THE FLOOR *BECAUSE A MEASUREMENT IS COMING*. Where none is
//      coming it is not gentleness, it is eight WPM until the bell.
//      ⚠️ AND IT WOULD HAVE SHIPPED GREEN — nothing in this repo mounts Deadline
//      or Escape Key against an adaptive config. Part A is that assertion.
//
//   2. ⚠️⚠️ **A GRADED RUN WHOSE PACING MOVED UNDER THE STUDENT.** The 990-trial
//      clearability sweep is a statement about a FIXED `gates.minWPM`. A lesson
//      that adapted would invalidate it silently and per-student, which is the
//      worst way to break a guarantee. Part B is the ratchet on that.
//
// ⚠️ PART F IS THE ROUND-117 LESSON. A simulation that invents its own pacing is
// not a measurement, so the wiring half (Parts C–E) drives the REAL mounted
// view through the REAL frame loop and the REAL key handler.
//
// ⚠️ jsdom HAS NO CANVAS. The recording context below answers every call and is
// deliberately not enough to ask "did it look right" — that is
// arcade-panels-test.mjs's job.

import { JSDOM } from 'jsdom';
import { readFileSync, readdirSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    GameDirector, arcadeConfig, missionConfigFromRun, MIN_ON_SCREEN,
} from '../game-shell.js';
import { TypingCalibrator, FLOOR_WPM, MIN_SAMPLES } from '../typing-calibrator.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = f => readFileSync(path.join(ROOT, f), 'utf8');

let pass = 0, fail = 0; const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

// A small real course: two lessons, real gate shapes.
const LESSONS = [
    { id: 'u1_l1', gates: { minWPM: 15, minAccuracy: 85 }, steps: [{ type: 'keys', keys: 'fj' }] },
    { id: 'u1_l2', gates: { minWPM: 20, minAccuracy: 85 }, steps: [{ type: 'keys', keys: 'dk' }] },
];
const PROGRESS = { u1_l1: { passed: true }, u1_l2: { passed: true } };

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nA — ⚠️⚠️ A VIEW THAT MEASURES NOTHING MUST NOT BE PINNED AT THE FLOOR');
// ═════════════════════════════════════════════════════════════════════════════
{
    const cfg = arcadeConfig({ lessons: LESSONS, progress: PROGRESS, rand: () => 0.5 });

    ok(cfg.adaptive === true,
       'A1 ⭐ arcadeConfig() ASKS for adaptive pacing — ROADMAP 118a\'s one line');

    // ⚠️ THIS IS THE PAIR THAT MATTERS. Same config, one with a calibrator the
    // host feeds and one without. Escape Key and full-scope Deadline are the
    // second case TODAY.
    const unfed = new GameDirector(Object.assign({}, cfg));
    const fed = new GameDirector(Object.assign({}, cfg, { calibrator: new TypingCalibrator({}) }));
    const flat = new GameDirector(Object.assign({}, cfg, { adaptive: false }));

    ok(unfed.adaptive === false,
       '⚠️⚠️ A2 `adaptive: true` WITHOUT A CALIBRATOR IS NOT ADAPTIVE — supplying '
       + 'the object is how a view says "I feed this", and no other signal can '
       + 'tell it apart from a child who froze');
    ok(fed.adaptive === true, 'A3 …and a view that supplies one IS adaptive');

    // ⚠️ BYTE-FOR-BYTE, NOT MERELY "CLOSE". The claim is that Escape Key and
    // Deadline are untouched, and "untouched" has to mean untouched.
    const sameAsBefore = ['intervalMs', 'lifetimeMs', 'calibratedWPM', 'onScreenTarget']
        .every(k => unfed[k] === flat[k]);
    ok(sameAsBefore,
       '⚠️⚠️ A4 AN UNFED ADAPTIVE DIRECTOR IS BYTE-FOR-BYTE A NON-ADAPTIVE ONE '
       + 'across interval, lifetime, calibratedWPM and onScreenTarget');
    ok(unfed.lifetimeFor('reading') === flat.lifetimeFor('reading'),
       'A5 …including the per-word lifetime, which is what a pane actually flies on');

    // ⭐ AND THE NUMBERS THAT MADE THIS URGENT, PINNED SO THE REGRESSION IS
    // LEGIBLE RATHER THAN A BARE INEQUALITY.
    ok(unfed.calibratedWPM === cfg.targetWPM,
       `A6 an unfed run paces at the arcade gate (${cfg.targetWPM} WPM), not at the floor`);
    ok(fed.calibratedWPM === Math.min(cfg.targetWPM, FLOOR_WPM),
       `⚠️ A7 a FED run opens at the floor (${FLOOR_WPM} WPM) — that is the seed, and `
       + 'it is gentle only because a measurement is on its way');
    ok(fed.intervalMs > unfed.intervalMs * 2,
       `⭐ A8 THE SIZE OF THE TRAP: the seed more than doubles the spawn interval `
       + `(${Math.round(unfed.intervalMs)}ms → ${Math.round(fed.intervalMs)}ms). Held `
       + 'for a whole run on a game nobody is measuring, that is a broken game, not an easy one');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nB — ⚠️⚠️ THE GRADED PATH NEVER ADAPTS, AT ANY SEAM');
// ═════════════════════════════════════════════════════════════════════════════
{
    const seq = [{ type: 'keys', keys: 'fj', text: 'fj fj jf jf ff jj' }];
    const gates = { minWPM: 20, minAccuracy: 90 };
    const mission = missionConfigFromRun({ sequence: seq }, gates, null);

    ok(!('adaptive' in mission) || mission.adaptive !== true,
       '⚠️⚠️ B1 missionConfigFromRun() DOES NOT SET `adaptive`. This is the lesson '
       + 'path; the 990-trial clearability sweep is a promise about a FIXED gate, '
       + 'and a run whose pace moved mid-flight would void it silently and per-student');

    const d = new GameDirector(mission);
    ok(d.adaptive === false, 'B2 …and a mission director is not adaptive');
    ok(d.calibratedWPM === gates.minWPM,
       `B3 a graded run paces at exactly its own gate (${gates.minWPM} WPM)`);
    ok(d.onScreenTarget === MIN_ON_SCREEN,
       'B4 …and holds the global MIN_ON_SCREEN, not a per-student count');

    // ⚠️⚠️ THE BELT AND BRACES. Even if a future round hands a lesson config a
    // calibrator by accident, the flag is what opens the door — and it is not
    // there. This asserts the SOURCE, because that is the thing a careless
    // `Object.assign` would carry.
    const shell = read('game-shell.js');
    const missionFn = shell.slice(shell.indexOf('export function missionConfigFromRun'),
                                  shell.indexOf('export function arcadeTargetWPM'));
    ok(!/^\s*adaptive:/m.test(missionFn),
       '⚠️⚠️ B5 THE LITERAL `adaptive:` DOES NOT APPEAR IN missionConfigFromRun()\'s BODY. '
       + 'Asserted on the source because this is the one line in the feature that '
       + 'could quietly move a graded run\'s pacing under a student');
}

// ═════════════════════════════════════════════════════════════════════════════
// The mounted view. ⚠️ ONE DOM FOR THE FILE — jsdom is slow to build and the
// views attach to `window`.
// ═════════════════════════════════════════════════════════════════════════════
const dom = new JSDOM('<!doctype html><div id="host"></div>', { pretendToBeVisual: true });
const g = globalThis;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.getComputedStyle = el => dom.window.getComputedStyle(el);
g.devicePixelRatio = 1;

// ⚠️⚠️ A CLOCK THIS FILE OWNS. The whole point is measuring inter-key gaps, so a
// wall clock would make every assertion about WPM a race against the test
// runner's scheduler. `tick()` advances it explicitly.
let CLOCK = 0;
const tick = ms => { CLOCK += ms; };
g.performance = { now: () => CLOCK };
// ⚠️ NOT dom.window.performance — it delegates to the global we just replaced.

// ⚠️⚠️ THE FRAME LOOP IS PUMPED BY HAND, AND rAF IS A **QUEUE**, NOT A SLOT.
// The first draft held one callback and the harness went red against correct
// code: `game-chrome.js`'s countdown drives its own rAF loop alongside the
// view's, so a single slot let each clobber the other, no countdown ever
// finished, `started` stayed false and no pane was ever spawned. ⭐ TWO
// INDEPENDENT rAF LOOPS IN ONE MOUNT IS A FACT ABOUT THE CODE, and a fake that
// cannot represent it is testing a different program.
let cbs = new Map(); let nextRaf = 1;
g.requestAnimationFrame = cb => { const id = nextRaf++; cbs.set(id, cb); return id; };
g.cancelAnimationFrame = id => { cbs.delete(id); };
const frame = (ms = 16) => {
    tick(ms);
    // ⚠️ DRAINED INTO AN ARRAY FIRST. Every callback here re-registers itself,
    // so iterating the live map would spin forever.
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

// ⚠️ game-deadline.js NEWS AN `Image` AT MODULE SCOPE (the city skyline), and
// jsdom's constructor is on the window rather than the global. Absent, the
// import throws before a single assertion runs.
g.Image = dom.window.Image;

const { mount } = await import('../game-shatter.js');
const { mount: mountDeadline } = await import('../game-deadline.js');
const { COUNTDOWN_MS } = await import('../game-chrome.js');

const key = k => dom.window.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

/**
 * Mount Shatter, run the countdown out, and hand back a driver.
 *
 * ⚠️ THE WORDS ARE FIXED AND SPLITTABLE. game-shatter.js filters one-character
 * targets, and a pool that got filtered to nothing would silently test the
 * fallback path instead of the one students play.
 */
function launch(over = {}) {
    const host = document.getElementById('host');
    host.innerHTML = '';
    const cfg = Object.assign({
        targets: ['sunlight', 'morning', 'planted', 'reading', 'whisper', 'kitchen'],
        targetWPM: 20, endless: true, shields: 3, adaptive: true,
        rand: () => 0.5,
    }, over);
    const h = mount(host, { config: cfg, onEnd() {} });
    // ⚠️ THE GET-READY PANEL GATES EVERY KEY. Enter starts the countdown; only
    // when it runs out does `onStart` set `started` and spawning begin.
    frame(0);
    key('Enter');
    // ⚠️ COUNTDOWN_MS IS IMPORTED, NOT GUESSED — arcade-mount-test.mjs went red
    // across five assertions for waiting 60ms here.
    for (let i = 0; i < 8; i++) frame(COUNTDOWN_MS / 4);
    return h;
}

/** Type a whole live pane at `msPerKey`, parents and pieces alike. */
function typeOnePane(h, pane, msPerKey) {
    for (const ch of pane.text.slice(pane.typed)) { tick(msPerKey); key(ch); }
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nC — ⭐ THE MOUNTED VIEW ACTUALLY FEEDS THE ENGINE');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THIS IS THE ASSERTION ROUND 118 COULD NOT MAKE, AND ITS ABSENCE IS WHY AN
// ENGINE SHIPPED THAT NOTHING CALLED WHILE 101 HARNESSES STAYED GREEN.
{
    const h = launch();
    ok(h.debug().calibration != null, 'C1 the mounted view owns a calibrator');
    ok(h.debug().calibration.samples === 0, 'C2 …and it starts empty');

    let cleared = 0;
    for (let i = 0; i < 400 && h.debug().calibration.samples < MIN_SAMPLES + 2; i++) {
        // ⚠️ TYPE WHATEVER IS ON THE BOARD, PIECES INCLUDED — that is what a
        // student does, and it is the only way pieces get their chance to
        // wrongly become samples (Part D).
        const live = h.debug().panes;
        if (!live.length) { frame(); continue; }
        const before = h.debug().calibration.samples;
        typeOnePane(h, live[0], 120);
        if (h.debug().calibration.samples > before) cleared++;
        frame();
    }

    const snap = h.debug().calibration;
    ok(snap.samples >= MIN_SAMPLES,
       `⭐⭐ C3 TYPING PANES PRODUCES CALIBRATION SAMPLES (${snap.samples}) — the `
       + 'wiring is real, driven through the real key handler and the real frame loop');
    ok(snap.confident === true, 'C4 …and the estimate becomes believable');
    ok(snap.comfortAt != null, 'C5 …and comfort strikes, which is what starts the ramp');
    ok(snap.wpm > FLOOR_WPM,
       `⚠️ C6 A CHILD WHO TYPES IS NOT LEFT AT THE FLOOR (${snap.wpm.toFixed(1)} WPM). `
       + 'A calibrator that were fed spawns but never keys would look "wired" and '
       + 'still pace every run at 8');
    h.destroy();
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nD — ⚠️⚠️ PIECES ARE NOT CALIBRATION SAMPLES');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⭐ THE RULING, AND IT IS A RULING RATHER THAN AN OVERSIGHT. Acquisition means
// locate-and-read: find the target, read the word, aim. A piece is born where
// the student is already looking, spelling a word they finished typing half a
// second ago — its acquisition is near zero for a fast child and a slow one
// alike. ⚠️⚠️ FOLDING PIECES IN WOULD DRAG MEDIAN ACQUISITION DOWN, WHICH RAISES
// `onScreenTarget`, WHICH PUTS MORE PANES ON THE BOARD — and more panes is
// exactly what hurts the hunting child this whole per-student design exists to
// protect. It is the `MIN_ON_SCREEN = 3` sweep that collapsed to 53.2%, made
// again one level down.
{
    const h = launch();
    let parentClears = 0, pieceClears = 0, badPieceSamples = 0;

    for (let i = 0; i < 600; i++) {
        const live = h.debug().panes;
        if (!live.length) { frame(); continue; }
        const pane = live[0];
        const before = h.debug().calibration.samples;
        typeOnePane(h, pane, 120);
        const gained = h.debug().calibration.samples - before;
        if (pane.piece) { pieceClears++; if (gained > 0) badPieceSamples++; }
        else parentClears++;
        frame();
    }

    ok(pieceClears > 3,
       `D1 the run really does break panes into pieces and type them (${pieceClears} piece clears) `
       + '— without this the rest of Part D would be vacuously green');
    ok(badPieceSamples === 0,
       `⚠️⚠️ D2 NOT ONE PIECE BECAME A CALIBRATION SAMPLE (${badPieceSamples} of ${pieceClears})`);
    ok(h.debug().calibration.samples <= parentClears,
       `⭐ D3 SAMPLES NEVER EXCEED PARENT CLEARS (${h.debug().calibration.samples} of `
       + `${parentClears}) — the count is bounded by the words a student actually had to find`);

    // ⚠️ AND THE RULE IS ENFORCED AT ONE SITE. A piece was never `spawned()`, so
    // `keyed()`/`finished()`/`dropped()` are no-ops against it by construction.
    // A second test inside the key handler would be a copy that can drift.
    const view = read('game-shatter.js');
    ok((view.match(/calibrator\.spawned\(/g) || []).length === 1,
       '⚠️ D4 EXACTLY ONE `calibrator.spawned()` IN THE VIEW — the ruling lives at the '
       + 'spawn site and nowhere else, so it cannot drift out of step with a second test');
    h.destroy();
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nE — ⚠️⚠️ THE CALIBRATOR IS FED THE WALL CLOCK, NEVER THE BOARD CLOCK');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ `bNow` RUNS AT 22% OF REAL TIME DURING THE SHATTER SLOWDOWN. A child
// typing through slow motion is typing in real seconds; charging their burst to
// the slowed clock would report them **up to 4.5× faster than they are** and
// hand them a game paced for a typist who does not exist. ⭐ AND IT WOULD LOOK
// RIGHT — the spawn call sits on the line below `board.spawn(..., bNow)`, which
// correctly takes the board clock, so the two are one keystroke apart.
//
// ⚠️ STRUCTURAL ON PURPOSE. The slowdown only fires on a hit, so driving it
// behaviourally would mean losing a shield to assert an argument name — and the
// thing that can regress here is literally which identifier is typed.
{
    const view = read('game-shatter.js');
    const calls = [...view.matchAll(/d\.calibrator\.(\w+)\(([^)]*)\)/g)];
    ok(calls.length >= 4,
       `E1 the view makes all four calls (${calls.map(c => c[1]).join(', ')})`);
    const onBoardClock = calls.filter(c => /\bbNow\b/.test(c[2]));
    ok(onBoardClock.length === 0,
       '⚠️⚠️ E2 NOT ONE CALIBRATOR CALL TAKES `bNow`. The BOARD runs on the board '
       + 'clock; anything measuring the STUDENT runs on the wall clock');
    // ⚠️ THE TWO EXCUSES ARE NAMED, NOT INFERRED. `dropped()` forgets a pane and
    // `snapshot()` reads one — neither takes a clock — and a filter that merely
    // skipped argument lists without a `now` would excuse a REGRESSION too.
    const NO_CLOCK = new Set(['dropped', 'snapshot', 'reset']);
    const timed = calls.filter(c => !NO_CLOCK.has(c[1]));
    ok(timed.length >= 3 && timed.every(c => /\bnow\b/.test(c[2])),
       `⚠️ E3 …and every call that takes a time takes \`now\` `
       + `(${timed.map(c => c[1]).join(', ')})`);
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nF — ⭐ THE CHILD WHO FROZE GETS THE GENTLEST GAME, END TO END');
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, asked what happens to a student who types almost nothing during
// calibration: *"I would go with gentlest possible."*
//
// ⚠️ NOT THE LESSON GATE. A child who produced nothing in thirty seconds is
// telling you something, and answering with a number derived from the furthest
// lesson they have passed answers a different question.
// ⭐ THIS IS ALSO THE ASSERTION THAT SEPARATES "WIRED" FROM "PINNED": Part A
// proves an UNFED view escapes the floor; this proves a FED one that measured
// nothing stays on it, which is the behaviour the floor exists for.
{
    const h = launch({ targetWPM: 40 });
    for (let i = 0; i < 400; i++) frame(50);   // twenty seconds, not one keystroke
    const snap = h.debug().calibration;
    ok(snap.samples === 0, 'F1 a student who types nothing produces no samples');
    ok(snap.confident === false, 'F2 …so nothing is believed about them');
    ok(snap.wpm === FLOOR_WPM,
       `⭐ F3 …AND THEY GET THE FLOOR (${FLOOR_WPM} WPM), not the 40 WPM gate their `
       + 'progress would have implied');
    ok(snap.onScreenTarget === 1,
       '⚠️ F4 …and one pane at a time. Zero panes is not a difficulty, it is a stopped game');
    h.destroy();
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nG — ⚠️⚠️ RULE 11: THE CALIBRATION NUMBER NEVER REACHES A SCREEN');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ IT IS NOT `netWPM()` — different window (one burst, not a session),
// different denominator (characters of target text, not keystrokes), different
// purpose (pacing, not assessment). Two numbers called WPM that disagree is a
// thing this project has paid for twice, and the second one always arrives as
// "it was already on the handle".
{
    const files = readdirSync(ROOT).filter(f => /\.(js|html)$/.test(f));

    // ⚠️⚠️ THIS ASSERTION WAS NARROWED IN ROUND 119, AND THE NARROWING IS THE
    // INTERESTING PART. It used to read "nobody outside tests/ calls debug()",
    // and it went red the moment `arcade-telemetry.js` was wired up — correctly,
    // because a page had started reading the accessor.
    // ⭐ BUT "NOBODY MAY READ IT" WAS NEVER THE RULE. The rule is that the
    // calibration number must never reach a SCREEN, because it is not netWPM()
    // and two numbers called WPM that disagree is a thing this project has paid
    // for twice. A diagnostic CSV that a teacher downloads is not a screen.
    // ⚠️ SO THE EXEMPTION IS NAMED, NOT INFERRED. Exactly one caller, and if a
    // second page starts reading `debug()` this goes red again and whoever
    // added it has to come and justify it here — which is the whole point.
    const CALLERS_ALLOWED = new Set(['arcade.html']);
    const callers = files.filter(f => /\.debug\(\)/.test(read(f)));
    const rogue = callers.filter(f => !CALLERS_ALLOWED.has(f));
    ok(rogue.length === 0,
       `⚠️⚠️ G1 ONLY THE NAMED TELEMETRY SEAM READS debug() (rogue: ${rogue.join(', ') || 'none'})`);

    // ⚠️⚠️ AND THIS IS THE ASSERTION THAT ACTUALLY ENFORCES RULE 11. A page may
    // READ the number; it may not PUT IT ON THE PAGE. Checked against the two
    // ways anything reaches a student's eye in this app.
    const RENDERERS = /(innerHTML|textContent|innerText)\s*=[^;\n]*\b(calibration|pacedWPM)\b/;
    const rendered = files.filter(f => RENDERERS.test(read(f)));
    ok(rendered.length === 0,
       `⚠️⚠️⚠️ G2 NOTHING RENDERS THE CALIBRATION NUMBER (found: ${rendered.join(', ') || 'none'}). `
       + 'It is not netWPM() — different window, different denominator, different '
       + 'purpose. ⭐ THE STUDENT SEES A DIFFICULTY, NEVER A SPEED');

    // ⚠️ AND THE RECORDER IS OFF BY DEFAULT, WHICH IS A PROPERTY OF THE FLAG AND
    // NOT OF ANYONE'S DISCIPLINE. A telemetry switch a student can find, or a
    // teacher can leave on for a term, is a different product.
    const tele = read('arcade-telemetry.js');
    ok(/telemetry=1/.test(tele) && !/localStorage|sessionStorage/.test(tele),
       '⚠️⚠️ G5 RECORDING IS A URL FLAG, NOT A STORED SETTING — it dies with the tab');
    ok(!/fetch\(|XMLHttpRequest|navigator\.sendBeacon/.test(tele),
       '⚠️⚠️ G6 THE TRACE IS DOWNLOADED, NEVER UPLOADED. No endpoint means no place '
       + 'for thirty children\'s traces to accumulate on a server');

    // ⚠️⚠️ AND THE ONE LINE, COUNTED. `adaptive:` is set in exactly one place in
    // the whole repo, and that place is arcadeConfig().
    const shell = read('game-shell.js');
    const sets = [...shell.matchAll(/^\s{4,}adaptive:\s*true/gm)];
    ok(sets.length === 1,
       `⚠️⚠️ G3 \`adaptive: true\` IS SET EXACTLY ONCE IN game-shell.js (${sets.length}). `
       + 'Round 118: *"it is the line that could quietly move a graded run\'s pacing '
       + 'under a student. If that\'s tempting to generalise, don\'t."*');
    // ⚠️ THE MATCH POSITION, NOT indexOf(). The first literal `adaptive: true` in
    // this file is inside the v1.10.0 header comment, and locating the enclosing
    // function from THERE reports the wrong answer — the first draft of this
    // assertion went red against correct code for exactly that.
    const idx = sets.length ? sets[0].index : -1;
    const fnStart = shell.lastIndexOf('export function', idx);
    ok(shell.slice(fnStart, idx).includes('arcadeConfig'),
       '⭐ G4 …and the function it lives in is arcadeConfig()');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nH — ⭐ DEADLINE MEASURES THE CHILD TOO (ROADMAP 118a, third cabinet)');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ SHATTER AND SHARDS ARE ONE VIEW AND WERE WIRED TOGETHER. Deadline has its
// own, and until this part existed *"the arcade adapts"* was two-thirds true.
{
    const host = document.getElementById('host');
    host.innerHTML = '';
    const h = mountDeadline(host, {
        config: {
            targets: ['sunlight', 'morning', 'planted', 'reading', 'whisper', 'kitchen'],
            targetWPM: 20, endless: true, shields: 3, adaptive: true, rand: () => 0.5,
        },
        onEnd() {},
    });
    frame(0); key('Enter');
    for (let i = 0; i < 8; i++) frame(COUNTDOWN_MS / 4);

    ok(h.debug().calibration != null, 'H1 the mounted Deadline view owns a calibrator');
    for (let i = 0; i < 400 && h.debug().calibration.samples < MIN_SAMPLES + 2; i++) {
        const live = h.debug().panes;
        if (!live.length) { frame(); continue; }
        typeOnePane(h, live[0], 120);
        frame();
    }
    const snap = h.debug().calibration;
    ok(snap.samples >= MIN_SAMPLES,
       `⭐⭐ H2 TYPING WORDS IN DEADLINE PRODUCES SAMPLES (${snap.samples}) — driven `
       + 'through the real key handler, not a simulation of one');
    ok(snap.confident && snap.wpm > FLOOR_WPM,
       `H3 …and the estimate becomes believable (${snap.wpm.toFixed(1)} WPM)`);

    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ H4 IS NOT ABOUT CALIBRATION AT ALL. **PLAY AGAIN HALVED THE CITY.**
    // ═══════════════════════════════════════════════════════════════════════
    //
    // The mount built its director with `shields: shieldCount * 2` — a dome
    // absorbs a hit and the landmark under it takes the next, so a 3-shield
    // difficulty is staged on screen as SIX. ⚠️ `restart()` built
    // `new GameDirector(cfg)` and did not repeat it, so every replay ended at
    // three hits with three landmarks still standing — which is the *"the dome
    // doesn't do anything"* complaint the doubling was written to answer,
    // resurrected on the second game of every session and on no other.
    // ⭐ FOUND WHILE WIRING, because both the doubling and the calibrator now
    // come from one `newDirector()`.
    const before = h.debug().shieldsMax;
    // ⚠️ THE GAME HAS TO ACTUALLY END. Stop typing and let the sky land on the
    // city — the result card only appears on `d.over`, and a replay button
    // cannot be clicked on a game still in progress.
    for (let i = 0; i < 4000 && !h.debug().over; i++) frame(50);
    ok(h.debug().over, 'H5a the run ends once the student stops typing');
    const again = [...document.querySelectorAll('button')]
        .find(b => (b.textContent || '').trim() === 'Play again');
    ok(again != null, 'H5 the result card offers a replay');
    if (again) {
        again.click();
        ok(h.debug().shieldsMax === before,
           `⚠️⚠️ H4 A REPLAY GETS THE SAME CITY AS THE FIRST RUN (${before} → `
           + `${h.debug().shieldsMax}). The doubling is staged on screen; a director `
           + 'that ended early would leave landmarks standing at game over');
        // ⚠️ NULL-SAFE ON PURPOSE. The obvious `h.debug().calibration.samples`
        // THREW when the shield mutation was applied — a replay built by
        // `new GameDirector(cfg)` has no calibrator at all — and a stack trace
        // is not a finding. ⭐ A harness that dies on the defect it is hunting
        // reports nothing about the OTHER assertions in the part, which is how
        // a second regression rides along behind the first.
        const after = h.debug().calibration;
        ok(after != null && after.samples === 0,
           '⭐ H6 …and a fresh calibrator with it. A replay that opened already '
           + 'confident would be paced for the run the student just lost — or, in a '
           + 'rotation of thirty, for the previous child');
    }
    h.destroy();
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nI — ⚠️⚠️ ESCAPE KEY IS NON-ADAPTIVE BY RULING, AND SAFE BY GUARD');
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-11: *"Seems like Escape Key is what it is."*
//
// ⭐ BOTH HALVES OF THE CALIBRATOR MEASURE SOMETHING ELSE ON THAT BOARD. Four
// cells sit on screen and the student CHOOSES one, so "spawn → first key" is
// dominated by deliberation rather than locate-and-read; and `onScreenTarget`
// has nothing to act on, because the cell count is fixed by the layout and not
// by a director. ⚠️⚠️ WIRING IT WOULD PRODUCE A NUMBER THAT MEANS A DIFFERENT
// THING UNDER THE SAME NAME — the 100 WPM dropdown, one board over.
//
// ⚠️ THIS PART EXISTS SO A LATER ROUND CANNOT "FINISH" IT BY ACCIDENT. It asserts
// the ruling is recorded in the file, and that the guard — not luck — is what
// keeps the game at its real pace while `arcadeConfig()` asks for adaptation.
{
    const esc = read('game-escape.js');
    ok(/NOT ADAPTIVE, FOR EVER/.test(esc),
       '⚠️ I1 THE RULING IS IN THE FILE ITSELF, not only in a document. A view '
       + 'whose non-wiring looks like unfinished work invites the next round to finish it');
    // ⚠️ COMMENTS STRIPPED FIRST, AND THIS FILE NEEDS IT MOST: the ruling block
    // above explains at length what it does NOT do, so a raw grep reads its own
    // explanation as the behaviour it forbids. The same trap staff-tokens-test
    // and escape-seconds-test both fell into.
    const escCode = esc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    ok(!/calibrator\s*\./.test(escCode),
       '⚠️⚠️ I2 …and game-escape.js FEEDS NOTHING, which is what the ruling means');

    // ⭐ THE GUARD, DRIVEN. This is the config Escape Key really receives.
    const cfg = arcadeConfig({ lessons: LESSONS, progress: PROGRESS, rand: () => 0.5 });
    const asEscapeSeesIt = new GameDirector(Object.assign({}, cfg));
    ok(cfg.adaptive === true && asEscapeSeesIt.adaptive === false,
       '⭐ I3 arcadeConfig() ASKS and Escape Key\'s director DECLINES — the v1.10.0 '
       + 'guard, not an oversight');
    ok(asEscapeSeesIt.calibratedWPM === cfg.targetWPM,
       `⚠️⚠️ I4 …so it paces at ${cfg.targetWPM} WPM exactly as it always has. Before `
       + `the guard the same flag would have pinned it at ${FLOOR_WPM} for the whole run`);
}

if (fail) {
    console.log('\n  x FAILURES');
    for (const f of failures) console.log('    - ' + f);
}
console.log(`\n${fail ? 'x' : 'ok'}  adaptive-arcade-test.mjs — ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
