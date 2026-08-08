// canvas-clear-test.mjs v1.0.0 — Round 6 (Noiseless).
//
// The "stacked detritus" bug: the current line renders crisply and the same line is
// also stamped dozens of times below it at a few pixels' interval, like a caterpillar.
// It was fixed once in v0.2.7 for one cause and came back in v1.4.x through another.
//
// The cause both times is one invariant being violated:
//
//     the rectangle _render() clears MUST cover the whole canvas
//     i.e.  this.w * dpr === canvas.width  AND  this.h * dpr === canvas.height
//
// _resize() clamped the BACKING STORE with Math.max(300, rect) and wrote the RAW rect
// into this.w/this.h. Any time those disagreed, fillRect(0, 0, this.w, this.h) left a
// permanently dirty band — or, on a zero-sized rect, cleared nothing whatsoever while
// every other draw call carried on.
//
// This is arithmetic, so it is testable without a browser. The function is lifted from
// the shipping file by brace-matching; a rename breaks this on purpose.
//
//   node canvas-clear-test.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import assert from 'assert';

const src = readFileSync(fileURLToPath(new URL('./adventure-renderer.js', import.meta.url)), 'utf8');

function lift(name) {
    const k = src.indexOf('  ' + name + '(');
    if (k < 0) throw new Error(`${name}() not found — reanchor this harness, do not copy the logic in`);
    let d = 0;
    for (let x = src.indexOf('{', k); x < src.length; x++) {
        if (src[x] === '{') d++;
        else if (src[x] === '}') { d--; if (!d) return src.slice(k, x + 1); }
    }
    throw new Error('unbalanced braces in ' + name);
}

// Minimal stand-in for the renderer: just enough state for _resize to run.
function makeRenderer(rect, dpr) {
    // A real canvas.width setter coerces to unsigned long, i.e. TRUNCATES. Modelling
    // that is the point: an exact-equality guard against a fractional dpr loops
    // forever, and this fake is what caught that.
    const canvas = { style: {}, parentElement: { getBoundingClientRect: () => rect },
        _w: 0, _h: 0,
        get width()  { return this._w; }, set width(v)  { this._w = Math.trunc(v) || 0; },
        get height() { return this._h; }, set height(v) { this._h = Math.trunc(v) || 0; } };
    const obj = {
        canvas,
        ctx: { setTransform() {} },
        _dpr: 1, w: 0, h: 0,
    };
    const body = lift('_resize') + '\n' + lift('_assertCanvasMatchesLogicalSize');
    const cls = new Function('window', `return class R { ${body} }`)({ devicePixelRatio: dpr });
    Object.assign(cls.prototype, {});
    const inst = Object.assign(Object.create(cls.prototype), obj);
    return inst;
}

let fails = 0;
function ok(label, cond, extra) {
    if (cond) { console.log('   ok   ' + label); return; }
    fails++; console.log('   FAIL ' + label + (extra ? '\n          ' + extra : ''));
}

console.log('=== the clear must always cover the whole canvas ===');
const CASES = [
    ['normal desktop',        { width: 1200, height: 700 }, 1],
    ['retina',                { width: 1200, height: 700 }, 2],
    ['odd fractional dpr',    { width: 1033.5, height: 611.25 }, 1.5],
    ['parent SHORTER than the 300px clamp', { width: 1200, height: 200 }, 2],
    ['parent NARROWER than the clamp',      { width: 180,  height: 700 }, 1],
    ['both below the clamp',  { width: 100, height: 120 }, 3],
];
for (const [label, rect, dpr] of CASES) {
    const r = makeRenderer(rect, dpr);
    r._resize();
    // The clear must COVER the canvas. Over-clearing by a sub-pixel is harmless;
    // under-clearing by any amount is the dirty band.
    const okW = r.w * r._dpr >= r.canvas.width  && r.w * r._dpr - r.canvas.width  < 1;
    const okH = r.h * r._dpr >= r.canvas.height && r.h * r._dpr - r.canvas.height < 1;
    ok(`${label}: cleared area covers canvas`, okW && okH,
       `this.w*dpr=${(r.w * r._dpr).toFixed(2)} vs canvas.width=${r.canvas.width}; ` +
       `this.h*dpr=${(r.h * r._dpr).toFixed(2)} vs canvas.height=${r.canvas.height}`);
    ok(`${label}: neither dimension is zero`, r.w >= 1 && r.h >= 1, `w=${r.w} h=${r.h}`);
}

console.log('\n=== a degenerate rect must not poison the last good size ===');
for (const [label, bad] of [
    ['parent collapsed to zero height', { width: 1200, height: 0 }],
    ['parent collapsed entirely',       { width: 0, height: 0 }],
    ['parent hidden (negative)',        { width: -1, height: -1 }],
    ['NaN rect',                        { width: NaN, height: NaN }],
]) {
    const r = makeRenderer({ width: 1200, height: 700 }, 2);
    r._resize();                                   // establish a good size
    const goodW = r.w, goodH = r.h, cw = r.canvas.width, ch = r.canvas.height;
    r.canvas.parentElement.getBoundingClientRect = () => bad;
    r._resize();                                   // the hostile call
    ok(`${label}: keeps the last good size`,
       r.w === goodW && r.h === goodH && r.canvas.width === cw && r.canvas.height === ch,
       `became w=${r.w} h=${r.h} canvas=${r.canvas.width}x${r.canvas.height}`);
    ok(`${label}: clear is still non-empty`, r.w * r.h > 0, `${r.w} x ${r.h} = 0 -> clears NOTHING`);
}

console.log('\n=== the per-frame net catches a drift nothing told us about ===');
{
    const r = makeRenderer({ width: 1200, height: 700 }, 2);
    r._resize();
    r.canvas.height = 99;                 // simulate a backing store changed behind us
    r._assertCanvasMatchesLogicalSize();
    ok('mismatched backing store is repaired', Math.abs(r.h * r._dpr - r.canvas.height) <= 1,
       `h*dpr=${r.h * r._dpr} canvas.height=${r.canvas.height}`);
}

console.log('\n=== the net must not fire on a sub-pixel truncation (else: infinite resize) ===');
for (const dpr of [1, 1.25, 1.5, 2, 2.25, 3]) {
    const r = makeRenderer({ width: 1033.5, height: 611.25 }, dpr);
    r._resize();
    const before = { w: r.canvas.width, h: r.canvas.height };
    let resizes = 0;
    const real = r._resize.bind(r);
    r._resize = () => { resizes++; real(); };
    for (let f = 0; f < 60; f++) r._assertCanvasMatchesLogicalSize();
    ok(`dpr ${dpr}: 60 frames caused 0 resizes`, resizes === 0, `${resizes} resize(s) — this is a per-frame loop`);
    ok(`dpr ${dpr}: dimensions stayed put`, r.canvas.width === before.w && r.canvas.height === before.h);
}

console.log('');
if (fails) {
    console.log(`${fails} FAILURE(S). Each one is a region of the canvas that never gets`);
    console.log('cleared, which shows up as text stamped over itself dozens of times.');
    process.exitCode = 1;
} else {
    console.log('ALL PASS — the cleared rectangle equals the canvas at every size, clamp');
    console.log('boundary and dpr tested, and a degenerate parent cannot zero it out.');
}

// ── A warp is not a backspace (added v1.5.3) ─────────────────────────────────
// _onPositionSet() was written for a one-character backspace. game.js's
// jumpToSentence() reuses the same event for a Game Genie warp of thousands of
// characters, and none of the per-word visual state was reset — so crumbleAt still
// flagged every word between the new and old cursor as already crumbled, which is
// permanent, and the page rendered empty until each word was retyped.
//
// This asserts the reset happens on a jump and does NOT happen on a backspace,
// because the backspace path carries the tilt-recovery behaviour that makes a near
// miss visible and wiping it would silently delete a feature.
console.log('\n=== positionSet: warp resets word state, backspace does not ===');
{
    const src = readFileSync(fileURLToPath(new URL('./adventure-renderer.js', import.meta.url)), 'utf8');
    const k = src.indexOf('  _onPositionSet(');
    let d = 0, body = '';
    for (let x = src.indexOf('{', k); x < src.length; x++) {
        if (src[x] === '{') d++;
        else if (src[x] === '}') { d--; if (!d) { body = src.slice(k, x + 1); break; } }
    }
    if (!body) { ok('could lift _onPositionSet', false, 'renamed? reanchor this harness'); }

    const make = (curPos) => {
        const cls = new Function('performance', `return class R { ${body} }`)({ now: () => 0 });
        return Object.assign(Object.create(cls.prototype), {
            currentPos: curPos, w: 1000,
            crumbleAt: { '0:0': 1, '0:5': 2 }, letterStatus: { 3: 'bad' },
            mistakeFlash: { 2: 1 }, letterTilts: { 4: { angleRad: 0.4 } },
            fallingLetters: { 7: 1 }, ghosts: [{}], gravestones: [{}],
            queuedRespawnPos: 9, globalWordIdx: 12, prevSign: 1, runLen: 3,
            _mapBurst: {}, currentParaIdx: 2,
            _cancelLeap() {}, _logEvent() {}, _setCurrentParaForPos() {},
            _relayoutCurrentWorld() {}, _paragraphYOffset: () => 0, _xAtPosition: () => 0,
        });
    };

    const warp = make(1200);
    warp._onPositionSet({ position: 40 });
    ok('warp clears crumbleAt (the one that blanks the page)',
       Object.keys(warp.crumbleAt).length === 0,
       'words behind the new cursor stay flagged crumbled and never draw again');
    ok('warp clears letterTilts and fallingLetters (the stray fragments)',
       Object.keys(warp.letterTilts).length === 0 && Object.keys(warp.fallingLetters).length === 0);
    ok('warp clears ghosts and gravestones',
       warp.ghosts.length === 0 && warp.gravestones.length === 0);
    ok('warp moves the cursor', warp.currentPos === 40);

    const bs = make(100);
    bs._onPositionSet({ position: 99 });
    ok('a 1-char backspace does NOT wipe crumbleAt',
       Object.keys(bs.crumbleAt).length === 2,
       'the backspace path must stay cheap and keep the tilt-recovery feature');
    ok('a backspace still moves the cursor', bs.currentPos === 99);

    const fwd = make(40);
    fwd._onPositionSet({ position: 1200 });
    ok('a large FORWARD jump also resets (skip-ahead warp)',
       Object.keys(fwd.crumbleAt).length === 0);
}
if (fails) process.exitCode = 1;
