// arcade-panels-test.mjs v1.3.0 — Round 101: Part H, the console's spare height,
// the seconds on BANKED, the free word-end space and the two error signals on
// the board.
// arcade-panels-test.mjs v1.2.0 — Round 100b: Part G, the four things Jake's
// own screen showed — the playfield countdown, the duplicated controls, the
// duplicated top HUD plate, and the flanks outgrowing the stage.
// v1.1.0 — Round 100 (Franklin): the threat board, and
// Part F, which pins that the flanks track the stage rather than carrying fixed
// heights that cannot answer a question about a viewport-relative box.
// v1.0.0 — THE SIDE PANELS ARE *RUN*, NOT READ. Round 99
// (Franklin).
//
// ⚠️⚠️ THIS FILE EXISTS BECAUSE EVERY OTHER ARCADE HARNESS READS THESE MODULES AS
// TEXT, AND THAT HAS ALREADY LET TWO DEFECTS REACH A CLASSROOM. HANDOFF's own
// list: a backtick inside a CSS template literal (every harness green, page
// dead) and a panel-drawing splice that left a function unterminated (`draw is
// not defined` every frame, both side canvases simply blank, game otherwise
// normal, all 87 harnesses passing). `module-parse-test.mjs` closed the *parse*
// half. Parsing is not drawing.
//
// ⭐ SO THIS ONE CALLS drawRadar(), drawGauges() AND drawSevenSeg() FOR REAL,
// against a recording 2D context, and asserts GEOMETRY AND COLOUR rather than
// source text. A regex cannot tell you that the DOME ring ended up below the
// SCREEN ring; arithmetic can.
//
// ⚠️⚠️ AND PART B IS A RULE 10 HARNESS IN THE STRICT SENSE: it FAILS against the
// code that shipped and PASSES against the fix. Round 95's radar ramped every
// contact's alpha over its first 15% of descent, which is why Jake reported
// *"Each word fades out the whole grid... making it impossible to actually start
// typing the next possible word."* B4 drives two contacts at different depths
// and asserts their pips are drawn at the SAME strength. Mutation-verified by
// restoring the old `Math.min(1, c.ny / RADAR_FADE_IN)` factor: B4 goes red.
//
// ⚠️ WHAT THIS FILE MAY NOT DO: assert pixel positions as literals. A layout
// number changing is not a defect — game-layout.js exists to be edited — so
// every assertion here is a RELATIONSHIP (this is above that; this is inside the
// panel; these two are equal) that must hold at any sane set of constants.

import { readFileSync } from 'fs';
import { drawRadar, drawGauges, drawSevenSeg, sevenSegWidth, drawThreatBoard,
         drawCountdownOverlay, drawKeyboardStrip } from '../game-draw.js';
import * as LAY from '../game-layout.js';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

/**
 * A 2D context that records what it was asked to draw.
 *
 * ⚠️ IT RECORDS THE STATE AT THE MOMENT OF THE DRAW CALL, not at the moment the
 * property was set. `globalAlpha` and `fillStyle` are mutable canvas state, so a
 * recorder that logged assignments instead of draws would report an alpha that
 * had already been overwritten — which is the entire quantity Part B is about.
 */
function recorder() {
    const ops = [];
    const path = [];
    const ctx = {
        globalAlpha: 1, fillStyle: '#000', strokeStyle: '#000',
        lineWidth: 1, font: '', textAlign: 'left', textBaseline: 'alphabetic',
        lineCap: 'butt', lineJoin: 'miter',
        ops,
        save() {}, restore() {},
        clearRect() {}, setTransform() {},
        // ⚠️ PRESENT SO A MUTATION CANNOT PASS BY CRASHING. Mutating
        // drawCountdownOverlay() to pulse via ctx.translate() threw a TypeError
        // on a recorder that lacked it, which LOOKS like a caught mutation and
        // is not — the harness died instead of disagreeing. A recorder missing a
        // method it should have is a hole in every assertion downstream of it.
        translate(dx, dy) { this._tx = (this._tx || 0) + dx; this._ty = (this._ty || 0) + dy; },
        scale() {}, rotate() {},
        beginPath() { path.length = 0; },
        closePath() {},
        moveTo(x, y) { path.push([x, y]); },
        lineTo(x, y) { path.push([x, y]); },
        arcTo() {},
        quadraticCurveTo(cx, cy, x, y) { path.push([cx, cy], [x, y]); },
        arc(x, y, r) { path.push([x, y]); this._lastArc = { x, y, r }; },
        ellipse(x, y) { path.push([x, y]); },
        fill() {
            ops.push({ op: 'fill', pts: path.slice(), alpha: this.globalAlpha,
                       color: String(this.fillStyle), arc: this._lastArc });
        },
        stroke() {
            ops.push({ op: 'stroke', pts: path.slice(), alpha: this.globalAlpha,
                       color: String(this.strokeStyle), arc: this._lastArc });
        },
        fillRect(x, y, w, h) {
            ops.push({ op: 'fillRect', x, y, w, h, alpha: this.globalAlpha,
                       color: String(this.fillStyle) });
        },
        strokeRect() {},
        fillText(text, x, y) {
            ops.push({ op: 'text', text: String(text), x, y,
                       alpha: this.globalAlpha, color: String(this.fillStyle) });
        },
        // ⚠️ A REAL measureText IS NOT AVAILABLE AND MUST NOT BE FAKED AS ZERO:
        // drawRadar advances the untyped half of a word by the typed half's
        // width, so a zero would stack them and hide a real overlap bug.
        measureText(t) { return { width: String(t).length * 6.2,
                                  actualBoundingBoxAscent: 8,
                                  actualBoundingBoxDescent: 3 }; },
        createLinearGradient() { return { addColorStop() {} }; },
        createRadialGradient() { return { addColorStop() {} }; },
    };
    return ctx;
}

/** Reduced motion answers TRUE in node (no matchMedia), so opt out explicitly. */
function withFullMotion(fn) {
    const had = 'window' in globalThis;
    const prev = globalThis.window;
    globalThis.window = { matchMedia: () => ({ matches: false }) };
    try { return fn(); } finally {
        if (had) globalThis.window = prev; else delete globalThis.window;
    }
}


/** ⚠️ COMMENTS OUT BEFORE ANY "DOES THE CODE DO X" CHECK. Fifth instance of that
 *  defect landed in this suite in Round 99; assume a sixth. */
const stripJs = src => src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^[ \t]*\/\/.*$/gm, ' ');

const textOps = ctx => ctx.ops.filter(o => o.op === 'text');
const findText = (ctx, s) => textOps(ctx).find(o => o.text === s);

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nA — SEVEN-SEGMENT DIGITS ARE DRAWN, AND CANNOT FALL BACK');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ THE WHOLE REASON THESE ARE POLYGONS AND NOT A WEBFONT IS THAT A CANVAS DOES
// NOT WAIT FOR FONTS: fillText with an unloaded family draws in the fallback,
// silently, so on a filtered school network the clock would be the one element
// whose appearance depended on the wifi. These assertions are what make that
// claim true rather than merely intended.
{
    const ctx = recorder();
    drawSevenSeg(ctx, { x: 0, y: 0, h: 20, text: '8', color: '#f00' });
    const fills = ctx.ops.filter(o => o.op === 'fill');
    ok(fills.length === 7, 'an 8 draws all seven segments (' + fills.length + ')');
    ok(fills.every(f => f.alpha === 1), 'and every one of them is lit');
    ok(textOps(ctx).length === 0,
       '\u26a0 it draws NO text at all \u2014 no font, so nothing to fall back to');

    const one = recorder();
    drawSevenSeg(one, { x: 0, y: 0, h: 20, text: '1', color: '#f00' });
    const oneFills = one.ops.filter(o => o.op === 'fill');
    ok(oneFills.length === 7, 'a 1 still draws seven segment shapes');
    ok(oneFills.filter(f => f.alpha === 1).length === 2, 'but only two are lit');
    // ⚠️ THE UNLIT ONES ARE DRAWN, FAINTLY. That is most of what makes it read
    // as an LED panel, and it keeps the digit box from reflowing as values
    // change — nothing on the console moves when 9 becomes 10.
    ok(oneFills.filter(f => f.alpha > 0 && f.alpha < 1).length === 5,
       '\u2b50 and the other five are drawn dim rather than skipped');

    const blank = recorder();
    let threw = false;
    try { drawSevenSeg(blank, { x: 0, y: 0, h: 20, text: 'Q', color: '#f00' }); }
    catch (_) { threw = true; }
    ok(!threw, 'an unmapped character does not throw');
    ok(blank.ops.filter(o => o.op === 'fill').every(f => f.alpha < 1),
       'it renders as a blank digit \u2014 visible, and obviously not a number');

    // ⚠️ THE WIDTH HELPER IS WHAT EVERY 'center'/'right' ALIGNMENT DEPENDS ON.
    // If it disagreed with the draw loop the readouts would drift off the panel.
    ok(sevenSegWidth('88', 20) > sevenSegWidth('8', 20), 'width grows with length');
    ok(sevenSegWidth('8:8', 20) < sevenSegWidth('888', 20),
       'and a colon is narrower than a digit, as on the reference clock');
    const centred = recorder();
    drawSevenSeg(centred, { x: 100, y: 0, h: 20, text: '12', color: '#f00', align: 'center' });
    const xs = centred.ops.filter(o => o.op === 'fill').flatMap(o => o.pts.map(p => p[0]));
    const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
    ok(Math.abs(mid - 100) < 2.5, 'centred text is actually centred on its anchor');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nB — THE SCOPE: RINGS IN THE RIGHT ORDER, AND CONTACTS THAT DO NOT FADE');
// ═══════════════════════════════════════════════════════════════════════════
const W = LAY.RADAR_COL_W - 26, H = 420;

{
    const ctx = withFullMotion(() => {
        const c = recorder();
        drawRadar(c, { W, H, contacts: [], inbound: null, inboundProgress: 0 });
        return c;
    });

    // ⚠️⚠️ B1 IS THE ASSERTION A REGEX CANNOT MAKE. Jake: *"lowest should be
    // dome, second should be midway up the screen, third should be screen."*
    // Canvas y grows DOWNWARD, so "lowest on screen" is the LARGEST y — an easy
    // sign error that would look like a plausible radar and be exactly wrong.
    const rings = {};
    for (const name of ['SCREEN', 'MIDWAY', 'DOME']) {
        const t = findText(ctx, name);
        if (t) rings[name] = t.y;
    }
    ok(Object.keys(rings).length === 3, 'all three rings are labelled (' +
       Object.keys(rings).join(',') + ')');
    ok(rings.DOME > rings.MIDWAY && rings.MIDWAY > rings.SCREEN,
       '\u26a0\u26a0 DOME sits lowest, MIDWAY between, SCREEN highest \u2014 ' +
       JSON.stringify(rings));
    ok(rings.DOME < H, 'and the dome ring is inside the panel, not off the bottom');
    // ⚠️ THE DOME ARC IS FLOORED AWAY FROM THE ORIGIN. ny=1 IS the origin, so an
    // unfloored arc through it has zero height and the lowest ring vanishes.
    ok(H - rings.DOME > 8,
       '\u2b50 the dome arc is floored clear of the origin, so it is visible at all');

    // Three drooping arcs, none crossing another.
    const strokes = ctx.ops.filter(o => o.op === 'stroke');
    ok(strokes.length >= 4, 'the rings and the bearing lines are stroked (' +
       strokes.length + ' strokes)');
    ok(strokes.every(s => s.pts.every(p => p[0] >= -1 && p[0] <= W + 1)),
       'every stroked point stays within the panel width');
}

{
    // B4 — THE FADE. Two contacts, one just entered, one nearly home.
    const ctx = withFullMotion(() => {
        const c = recorder();
        drawRadar(c, {
            W, H, inbound: null, inboundProgress: 0,
            contacts: [
                { text: 'fresh', typed: 0, nx: 0.3, ny: 0.01 },
                { text: 'nearly', typed: 0, nx: 0.7, ny: 0.95 },
            ],
        });
        return c;
    });
    const fresh = findText(ctx, 'fresh'), nearly = findText(ctx, 'nearly');
    ok(!!fresh && !!nearly, 'both contacts are plotted');
    // ⚠️⚠️ THE ROUND 95 DEFECT, PINNED. A contact 1% into its descent was drawn
    // at 1/15th strength and was effectively unreadable at the very moment a
    // fast student wants to read it.
    ok(fresh && nearly && fresh.alpha === nearly.alpha,
       '\u26a0\u26a0 a just-entered contact is drawn exactly as strongly as an old one (' +
       (fresh && fresh.alpha) + ' vs ' + (nearly && nearly.alpha) + ')');
    ok(fresh && fresh.alpha === LAY.RADAR_CONTACT_ALPHA,
       'at the one fixed contact strength, so nothing on the grid pulses');
    // Depth still maps to position — losing the fade must not lose the reading.
    ok(fresh && nearly && nearly.y > fresh.y,
       'and depth is still legible: the older contact is nearer the city');
}

{
    // B5 — THE PREVIEW SITS OUTSIDE THE SCREEN RING, WHICH IS THE SAFETY RULE.
    const ctx = withFullMotion(() => {
        const c = recorder();
        drawRadar(c, {
            W, H, contacts: [{ text: 'onscreen', typed: 0, nx: 0.5, ny: 0.0 }],
            inbound: 'incoming', inboundProgress: 0.5,
        });
        return c;
    });
    const prev = findText(ctx, 'incoming'), on = findText(ctx, 'onscreen');
    ok(!!prev, 'the inbound word is drawn');
    ok(!!findText(ctx, 'INBOUND'), 'and its band is labelled');
    // ⚠️⚠️ THIS IS THE ONE THAT WOULD HAVE CAUGHT MY OWN BUG IN THIS ROUND. The
    // first draft passed `ny: 0` with no override; rowY() clamps to 0..1, so the
    // preview was drawn ON the screen ring — reading as "already arrived", the
    // single thing this panel must never say — AND a second pip was drawn in the
    // band, so one word appeared twice. Nothing in the source text was wrong.
    ok(prev && on && prev.y < on.y,
       '\u26a0\u26a0 the preview is strictly ABOVE a contact at the screen edge (' +
       (prev && Math.round(prev.y)) + ' vs ' + (on && Math.round(on.y)) + ')');
    ok(textOps(ctx).filter(o => o.text === 'incoming').length === 1,
       'and the inbound word is drawn exactly once, not once per pip');
    // ⚠️ HOLLOW, NEVER SOLID. A filled pip means "in the sky and typable".
    const inBand = ctx.ops.filter(o => o.arc && o.arc.y < (prev ? prev.y + 6 : 0));
    ok(inBand.some(o => o.op === 'stroke') && !inBand.some(o => o.op === 'fill'),
       'the inbound pip is stroked and never filled');
}

{
    // B6 — IT BRIGHTENS AS ITS SPAWN APPROACHES, AND NEVER TO NOTHING.
    const at = p => withFullMotion(() => {
        const c = recorder();
        drawRadar(c, { W, H, contacts: [], inbound: 'soon', inboundProgress: p });
        return findText(c, 'soon');
    });
    const early = at(0), late = at(1);
    ok(early && late && late.alpha > early.alpha,
       'the inbound contact materialises as its spawn nears');
    ok(early && early.alpha >= LAY.RADAR_INBOUND_MIN_ALPHA * 0.8,
       '\u26a0 but is never invisible, so it can be found before it brightens');
    // ⚠️ AND REDUCED MOTION FREEZES IT. It is the only changing alpha left on
    // the panel, so this is the whole of the panel's motion budget.
    const a = (() => { const c = recorder();
        drawRadar(c, { W, H, contacts: [], inbound: 'soon', inboundProgress: 0 });
        return findText(c, 'soon'); })();
    const b = (() => { const c = recorder();
        drawRadar(c, { W, H, contacts: [], inbound: 'soon', inboundProgress: 1 });
        return findText(c, 'soon'); })();
    ok(a && b && a.alpha === b.alpha,
       'under prefers-reduced-motion even that is static');
}

{
    // B7 — A FULL SKY DOES NOT PILE UP IN ONE CORNER OR LEAVE THE PANEL.
    const ctx = withFullMotion(() => {
        const c = recorder();
        c.__ = drawRadar(c, {
            W, H, inbound: 'next', inboundProgress: 0.3,
            // ⚠️ typed:0 HERE ON PURPOSE. A partly-typed word is drawn as TWO
            // text runs so the typed prefix can be dimmed, so 'w1' would never
            // appear as one op and this check would fail on correct code. The
            // split itself is asserted below.
            contacts: Array.from({ length: 6 }, (_, i) => ({
                text: 'w' + i, typed: 0, nx: i / 5, ny: i / 6,
            })),
        });
        return c;
    });
    for (let i = 0; i < 6; i++) ok(!!findText(ctx, 'w' + i),
        'contact w' + i + ' reaches the panel');
    const words = textOps(ctx).filter(o => /^w\d$/.test(o.text));
    ok(words.every(o => o.x >= -2 && o.x <= W + 2),
       'and every label is anchored inside the panel');

    // ⚠️ THE TYPED PREFIX IS DIMMED, WHICH IS THE WHOLE READ-AHEAD VALUE: a
    // student glancing at the scope sees how far into a word they already are.
    // It is drawn as two runs, dim then bright, and the second must be advanced
    // by the first's measured width or the halves overlap.
    const split = withFullMotion(() => {
        const c = recorder();
        drawRadar(c, { W, H, inbound: null, inboundProgress: 0,
                       contacts: [{ text: 'because', typed: 3, nx: 0.2, ny: 0.4 }] });
        return c;
    });
    const typed = findText(split, 'bec'), rest = findText(split, 'ause');
    ok(!!typed && !!rest, 'a partly-typed contact is drawn as two runs');
    ok(typed && rest && rest.x > typed.x,
       'and the untyped half is advanced past the typed half, not stacked on it');
    ok(typed && rest && typed.color !== rest.color,
       'the typed half is drawn in the dimmer of the two inks');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nC — THE CONSOLE: THE GATE IS VISIBLE, AND IT IS NEVER INVENTED');
// ═══════════════════════════════════════════════════════════════════════════
const GW = LAY.CONTROL_COL_W - 26, GH = 344;
const gauges = o => { const c = recorder();
    drawGauges(c, Object.assign({ W: GW, H: GH }, o)); return c; };
const lamps = ctx => ctx.ops.filter(o => o.op === 'fillRect');
const hasColor = (ctx, col) => lamps(ctx).some(o => o.color === col);

{
    // ⚠️⚠️ C1/C2 ARE THE STOPLIGHT, AND THE DIRECTION MATTERS. Jake: *"red
    // failing, green passing"*. A sign error here tells a struggling child they
    // are fine and a passing one they are not.
    const below = gauges({ wpm: 8, acc: 70, targetWPM: 25, minAccuracy: 90 });
    ok(hasColor(below, LAY.GAUGE_RED),
       'a run under the gate paints red on the bar');
    const above = gauges({ wpm: 40, acc: 97, targetWPM: 25, minAccuracy: 90 });
    ok(hasColor(above, LAY.GAUGE_GREEN),
       'a run over it paints green');
    // ⚠️ THE ZONES ARE DRAWN EVEN BEFORE THERE IS A VALUE, faintly — that is
    // what "delineate the different targets visually on the bar" asks for, and
    // it has to work at 0 WPM in the first second of a run.
    const zero = gauges({ wpm: 0, acc: 0, targetWPM: 25, minAccuracy: 90 });
    ok(hasColor(zero, LAY.GAUGE_RED) && hasColor(zero, LAY.GAUGE_GREEN),
       '\u2b50 both zones are visible at 0, before the run has earned anything');

    // ⚠️⚠️ C4 IS THE ONE THAT PROTECTS THE DRILLS. run-grade.js returns
    // `minWPM: null` for DRILL_TYPES because speed on random letter groups
    // measures nothing, and learn.js grades them on accuracy alone. A panel
    // that painted a drill red against a gate nobody enforces would be
    // inventing a failure the lesson engine deliberately refuses to report.
    const nogate = gauges({ wpm: 8, acc: 70, targetWPM: null, minAccuracy: null });
    ok(!hasColor(nogate, LAY.GAUGE_RED) && !hasColor(nogate, LAY.GAUGE_GREEN),
       '\u26a0\u26a0 a run with NO gate is coloured neither red nor green');
    ok(!!findText(nogate, 'NO GATE'), 'and says so in words, not by omission');
    ok(!!findText(above, 'GATE 25'), 'a gated run prints the gate it is judged against');
}

{
    // ⚠️ THE LIT COUNT ROUNDS DOWN. A meter lighting its last lamp at 96% would
    // claim a target was met when it was not — and on the quota bar that is the
    // difference between CITY DEFENDED and not.
    const nearly = gauges({ wpm: 0, acc: 0, quota: 0.99 });
    const full = gauges({ wpm: 0, acc: 0, quota: 1 });
    const goldOf = ctx => lamps(ctx).filter(o => o.color === LAY.GAUGE_GOLD &&
                                                 o.alpha === 1).length;
    ok(goldOf(full) === LAY.GAUGE_SEGMENTS,
       'a met quota lights every lamp (' + goldOf(full) + ')');
    ok(goldOf(nearly) < LAY.GAUGE_SEGMENTS,
       '\u26a0 99% does NOT, because the count rounds down (' + goldOf(nearly) + ')');
    ok(!!findText(full, '100%'), 'and the figure is printed beside the bar');
    ok(!!findText(full, 'RUN QUOTA'),
       '\u26a0 labelled \u2014 unlabelled, Jake read this bar as the week\u2019s time');

    // ⚠️ ABSENT IN ARCADE, NOT ZEROED. An endless run has no quota, and a bar
    // pinned at 0% would report a mission that does not exist.
    const endless = gauges({ wpm: 20, acc: 90, quota: null });
    ok(!findText(endless, 'RUN QUOTA'), 'arcade shows no quota bar at all');
}

{
    // ⚠️⚠️ THE CLOCK SHOWS THE COUNT *OR* THE RUN, NEVER BOTH. Two timers for
    // one clock is the Rule 9 shape in miniature: the student would have to work
    // out whether they agree.
    const counting = gauges({ wpm: 0, acc: 0, countdown: 3, seconds: 0 });
    ok(!!findText(counting, 'GET READY'), 'during the countdown the clock says so');
    ok(!findText(counting, 'RUN CLOCK'), 'and does not also claim to be the run clock');
    const running = gauges({ wpm: 20, acc: 90, countdown: null, seconds: 95 });
    ok(!!findText(running, 'RUN CLOCK'), 'once playing it is the run clock');
    ok(!findText(running, 'GET READY'), 'and the countdown label is gone');
    // The clock is seven-segment, so it draws polygons and no numerals as text.
    ok(!textOps(running).some(o => /^\d+:\d\d$/.test(o.text)),
       '\u26a0 the time is drawn in segments, not as text in a font');
    ok(running.ops.filter(o => o.op === 'fill').length > 20,
       'which is why there are many small filled shapes on the panel');
}

{
    // ⚠️ THE TOTALS STAY PLAIN TEXT, AND THAT IS DELIBERATE. They arrive as
    // formatted strings ("1h 20m") from ONE formatter in game-deadline.js;
    // drawSevenSeg renders digits only, so making them digital would mean
    // reformatting here — a second formatter showing a student two "today"s.
    // ⚠️⚠️ ROUND 100b — THE ROWS ARE SEVEN-SEGMENT NOW, on Jake's ruling that
    // BANKED *"should look very similar to the run clock at the top"*. So the
    // digits are polygons and the only TEXT on these rows is the two labels.
    const withTotals = gauges({ wpm: 20, acc: 90, todayText: '14m', weekText: '1h 20m',
                                todayClock: '0:14', weekClock: '1:20' });
    ok(!!findText(withTotals, 'BANKED'), 'the banked block is headed');
    ok(!!findText(withTotals, 'TODAY') && !!findText(withTotals, 'WEEK'),
       'and each row is NAMED, which is what keeps it apart from the run clock');
    ok(!findText(withTotals, '0:14') && !findText(withTotals, '1:20'),
       '\u26a0 the totals are drawn in segments, not as text in a font');
    // ⚠️ THE INK IS WHAT SEPARATES THE RUN FROM THE WEEK NOW THAT THE TYPEFACE
    // DOES NOT. The standing rule is that a child must not read "28 WPM" and
    // "14m today" as facts of the same kind; with one instrument family, colour
    // and the row label carry that distinction and must not drift together.
    const inks = new Set(withTotals.ops.filter(o => o.op === 'fill' && o.alpha === 1)
                                       .map(o => o.color));
    ok(inks.has(LAY.GAUGE_TOTAL_INK), 'the banked digits use the TOTAL ink');
    ok(LAY.GAUGE_TOTAL_INK !== LAY.SEG_TIME_INK,
       '\u26a0\u26a0 which is a different colour from the run clock\u2019s, deliberately');

    // ⚠️⚠️ AND NOTHING DOWNSTREAM MAY REFORMAT SECONDS. drawSevenSeg cannot be
    // handed "1h 20m", and the tempting fix is a Math.floor(sec/60) right here —
    // which is the second formatter game-deadline.js has warned about since
    // Round 95. Two places converting seconds to minutes is two chances to round
    // differently, and what a student sees is two different totals for one day.
    const draw = readFileSync(new URL('../game-draw.js', import.meta.url), 'utf8');
    const gg = draw.slice(draw.indexOf('export function drawGauges'));
    // ⚠️ SCOPED TO THE BANKED BLOCK, AND THE FIRST DRAFT WAS NOT. It forbade
    // `/ 60` anywhere in drawGauges() and went red on correct code: the RUN
    // CLOCK legitimately converts its own elapsed seconds to m:ss, a number that
    // exists nowhere else and is nobody's stored total. The rule being enforced
    // is about the BANKED figures, which are read from Firestore and must match
    // what a teacher pulls \u2014 so that is the region to check.
    const banked = stripJs(gg.slice(gg.indexOf('if (o.todayClock')));
    ok(!/\/\s*60/.test(banked) && !/dailySeconds|weeklySeconds/.test(banked),
       '\u26a0\u26a0 the banked block does no seconds\u2192minutes arithmetic of its own');
    const dl = readFileSync(new URL('../game-deadline.js', import.meta.url), 'utf8');
    ok(/todayClock: clock\(m\.dailySeconds\)/.test(dl) &&
       /weekClock:\s+clock\(m\.weeklySeconds\)/.test(dl),
       'both shapes are emitted by minuteLines(), over the same seconds');
    // ⚠️ NOTHING IS PRINTED WHEN THERE IS NOTHING TO PRINT. "0m today" is a
    // claim, and a page that never read the totals may not make it.
    const none = gauges({ wpm: 20, acc: 90 });
    ok(!findText(none, 'BANKED'),
       '\u26a0 a panel with no totals read prints no totals heading');
}

{
    // Everything drawn has to be ON the panel. A readout half off the card is
    // the failure mode of a fixed-height canvas holding a growing stack.
    const busy = gauges({
        wpm: 44, acc: 93, targetWPM: 25, minAccuracy: 90, quota: 0.5,
        seconds: 3599, shieldsLeft: 6, countdown: null,
        todayText: '14m', weekText: '1h 20m',
    });
    const ys = [...lamps(busy).map(o => o.y + o.h), ...textOps(busy).map(o => o.y)];
    ok(Math.max(...ys) <= GH,
       '\u26a0\u26a0 the fullest possible console still fits its canvas (' +
       Math.round(Math.max(...ys)) + ' of ' + GH + 'px)');
    const xsAll = [...lamps(busy).map(o => o.x + o.w)];
    ok(Math.max(...xsAll) <= GW, 'and nothing runs off the right edge');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nD — THE COUNTDOWN HANDOFF IS OPT-IN, SO NO SURFACE LOSES IT');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THE RISK THIS GUARDS IS A SILENT REGRESSION ON THE OTHER TWO SURFACES.
// Round 94 ruled the countdown must not cover the radar; Round 99 moved the
// digits into the console. Escape Key and learn.js have no console to put them
// in, so if the move had been unconditional they would simply have lost their
// countdown — and nothing on those pages would say so.
{
    const chrome = readFileSync(new URL('../game-chrome.js', import.meta.url), 'utf8');
    const dl = readFileSync(new URL('../game-deadline.js', import.meta.url), 'utf8');
    const esc = readFileSync(new URL('../game-escape.js', import.meta.url), 'utf8');

    ok(/hostOwnsCount\s*=\s*typeof o\.onCountdown === 'function'/.test(chrome),
       'the chrome decides once whether the host owns the digits');
    // ⚠️ TWO SEPARATE FACTS, NOT ONE CLEVER REGEX. The first draft of this
    // assertion tried to match the whole if/else in one pattern and went red on
    // correct code because the comment inside the branch is longer than the
    // window it allowed. A check that cannot survive a comment being written is
    // a check that gets deleted.
    ok(/if \(hostOwnsCount\) \{/.test(chrome),
       'the opt-in branch exists');
    ok(/\} else \{[\s\S]*?gc-count/.test(chrome),
       '\u26a0 and the else branch keeps its own numeral for a host that does not');
    ok(/onCountdown\(n\) \{ countdown = n; \}/.test(dl),
       'Deadline opts in, because it has a readout to put them in');
    ok(!/onCountdown/.test(esc),
       '\u26a0\u26a0 Escape Key does NOT, so its countdown is untouched');
    // ⚠️ ROUND 94's RULING SURVIVES: the ready/paused/result panels are still
    // overlays on the play container. Only three digits moved.
    ok(/wrap\.append\(panel\);/.test(chrome),
       'the ready/paused/result panel still overlays the play area');
    // ⚠️ CLEARED BEFORE onStart. After it, "1" would sit on the clock for one
    // frame of live play.
    const tick = chrome.slice(chrome.indexOf('const tick = () =>'));
    ok(tick.indexOf('o.onCountdown(null)') < tick.indexOf('o.onStart()'),
       'the count is cleared BEFORE play starts, not after');
}


// ═══════════════════════════════════════════════════════════════════════════
console.log('\nE — THE THREAT BOARD SAYS WHICH LANDMARK IS EXPOSED');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THIS PANEL IS THE ONE MOST AT RISK OF BECOMING DECORATION, so the
// assertions are about whether a student could ACT on it. The tactical choice
// the game is built around — Escape abandons a word so a different landmark can
// be saved — needs the answer to "which one is exposed", and a board that got
// that backwards would send a child to defend the lane that is already safe.
const threat = lanes => { const c = recorder();
    drawThreatBoard(c, { W: LAY.RADAR_COL_W - 26, H: LAY.THREAT_H,
                         coverMax: 3, lanes }); return c; };

{
    const c = threat([
        { short: 'PARTHENON', cover: 2, alive: true },
        { short: 'BATMAN BLDG', cover: 0, alive: true },
        { short: 'RYMAN', cover: 0, alive: false },
    ]);
    ok(!!findText(c, 'CITY STATUS'), 'the board is headed');
    for (const n of ['PARTHENON', 'BATMAN BLDG', 'RYMAN']) {
        ok(!!findText(c, n), n + ' has a row');
    }
    // ⚠️⚠️ THE STATE MUST BE ON THE RIGHT *ROW*, AND THE FIRST DRAFT OF THIS
    // BLOCK DID NOT CHECK THAT. It asserted only that each word appeared
    // SOMEWHERE on the panel, and mutation testing walked straight through it:
    // swapping SHIELDED and EXPOSED in drawThreatBoard() left all 94 assertions
    // green. ⚠️ THAT IS THE WORST AVAILABLE BUG ON THIS PANEL — it sends a child
    // to defend the lane that is already safe — and the check written to catch
    // it could not see it. A presence check is not a correctness check.
    // ⭐ SO THE ROW IS THE UNIT: a state word must share its row's baseline with
    // the landmark name it describes.
    const stateOf = name => {
        const row = findText(c, name);
        if (!row) return null;
        const near = textOps(c).filter(o => Math.abs(o.y - row.y) < 2 &&
                                            /^(SHIELDED|EXPOSED|LOST)$/.test(o.text));
        return near.length === 1 ? near[0].text : null;
    };
    ok(stateOf('PARTHENON') === 'SHIELDED',
       'a covered landmark reads SHIELDED on its own row (' + stateOf('PARTHENON') + ')');
    ok(stateOf('BATMAN BLDG') === 'EXPOSED',
       '\u26a0\u26a0 a standing landmark with NO cover left reads EXPOSED on its own row \u2014 ' +
       'the fact the Escape decision depends on (' + stateOf('BATMAN BLDG') + ')');
    ok(stateOf('RYMAN') === 'LOST',
       'and a destroyed one reads LOST on its own row (' + stateOf('RYMAN') + ')');
    // ⚠️ AND THE LAMPS BELONG TO THEIR ROW TOO. Counting lamps panel-wide would
    // let all six of one lane's lit lamps satisfy a total while the exposed lane
    // showed three.
    const lampsOn = name => {
        const row = findText(c, name);
        return lamps(c).filter(o => o.alpha === 1 &&
                                    o.y > row.y && o.y < row.y + 12).length;
    };
    ok(lampsOn('PARTHENON') === 2 && lampsOn('BATMAN BLDG') === 0,
       '\u26a0 each row lights exactly its OWN standing shields (' +
       lampsOn('PARTHENON') + ', ' + lampsOn('BATMAN BLDG') + ')');
    // ⚠️ THE COLOUR IS NEVER THE ONLY CHANNEL. One boy in twelve in a class of
    // thirty has a colour vision deficiency, and this panel exists to be read at
    // a glance under time pressure.
    const words = ['SHIELDED', 'EXPOSED', 'LOST'].map(w => findText(c, w));
    ok(words.every(Boolean) && new Set(words.map(o => o.color)).size === 3,
       'the three states differ in colour AS WELL AS in words');

    // ⚠️ A LOST LANDMARK KEEPS ITS ROW. If rows collapsed, the two survivors
    // would move under the student's eye at the worst possible moment.
    const rows = ['PARTHENON', 'BATMAN BLDG', 'RYMAN'].map(n => findText(c, n).y);
    ok(rows[0] < rows[1] && rows[1] < rows[2], 'rows keep their order');
    const lost = findText(c, 'RYMAN');
    ok(lost.alpha < 1, 'a lost landmark is dimmed rather than removed');

    // ⭐ THE SHIELD LAMPS SHOW WHAT HAS BEEN SPENT AS WELL AS WHAT IS LEFT,
    // which is the six-lives mechanic made visible for the first time.
    const lit = lamps(c).filter(o => o.alpha === 1).length;
    ok(lit === 2, 'exactly one lamp lights per standing shield (' + lit + ')');
    ok(lamps(c).length === 9, 'and the spent ones are still drawn (3 lanes x 3)');
}

{
    // ⚠️ ABSENT-SAFE. learn.js supplies no side canvases (tools/game-lab.html did too, until Round 112 deleted it),
    // and a panel that threw on empty input would take the bench with it.
    let threw = false;
    try { const c = recorder(); drawThreatBoard(c, { W: 180, H: 104, lanes: [] }); }
    catch (_) { threw = true; }
    ok(!threw, 'an empty board draws nothing and does not throw');

    // Everything stays on the panel at the smallest height it can be given.
    const tight = (() => { const c = recorder();
        drawThreatBoard(c, { W: 174, H: LAY.THREAT_ROW_MIN * 3 + 20, coverMax: 3,
            lanes: [{ short: 'A', cover: 1, alive: true },
                    { short: 'B', cover: 1, alive: true },
                    { short: 'C', cover: 1, alive: true }] });
        return c; })();
    const bottom = Math.max(...[...lamps(tight).map(o => o.y + o.h),
                                ...textOps(tight).map(o => o.y)]);
    ok(bottom <= LAY.THREAT_ROW_MIN * 3 + 20,
       'three rows fit the minimum height they are allowed (' + Math.round(bottom) + ')');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nF — THE FLANKS TRACK THE STAGE, SO THERE IS NO BARE SPACE LEFT');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ ROUND 99 ANSWERED *"big chunks of empty space don't fit the vibe"* WITH
// TALLER FIXED HEIGHTS AND DID NOT FIX IT. Measured against #stage's own 78vh:
// 236px of bare left column at a 900px viewport, 470px at 1200px, and a console
// card that OVERFLOWED by 38px at 700px. A fixed height cannot answer a question
// about a viewport-relative box.
{
    const html = readFileSync(new URL('../arcade.html', import.meta.url), 'utf8');
    const lay = readFileSync(new URL('../game-layout.js', import.meta.url), 'utf8');

    ok(/align-items:\s*stretch/.test(html),
       '\u26a0\u26a0 the stage grid stretches, so a flank card is as tall as the stage');
    ok(!/align-items:\s*start/.test(html), 'and nothing reinstates start');

    // ⚠️ NO FIXED HEIGHT MAY RETURN TO A FLANK CANVAS. This is the assertion
    // that would have caught Round 99 shipping a non-fix.
    const flankCanvas = /<canvas id="(radar|gauge)-canvas"[^>]*>/g;
    const tags = html.match(flankCanvas) || [];
    ok(tags.length === 2, 'both flexing flank canvases are present');
    ok(tags.every(t => !/style="[^"]*height:/.test(t)),
       '\u26a0\u26a0 neither carries an inline fixed height \u2014 ' + JSON.stringify(tags));
    ok(/#radar-canvas \{[^}]*flex: 1/.test(html) && /#gauge-canvas \{[^}]*flex: 1/.test(html),
       'both flex to fill the column');

    // ⚠️ BUT A FLOOR IS MANDATORY. fitCanvas() reads getBoundingClientRect, so a
    // canvas with no definite basis resolves to ZERO on the first frame and the
    // panel is blank until a resize. This is the trap the previous round's own
    // comment warned about, and flexing is exactly when it becomes reachable.
    for (const k of ['RADAR_MIN_H', 'GAUGE_MIN_H']) {
        ok(new RegExp('export const ' + k + '\\s*=\\s*[0-9]+').test(lay),
           k + ' gives that flex a floor');
    }
    ok(/#radar-canvas \{[^}]*min-height/.test(html) &&
       /#gauge-canvas \{[^}]*min-height/.test(html),
       '\u26a0 and the floors are actually applied in the stylesheet');

    // ⭐ THE SPARE HEIGHT IS SPENT, NOT LEFT. Left column: the radar takes it,
    // with the fixed-height board beneath. Right column: the buttons take it.
    ok(/#threat-canvas \{[^}]*flex: 0 0 auto/.test(html),
       'the threat board does NOT flex, so the radar gets the column\'s spare height');
    ok(/\.gc-bar-card \{ flex: 1 1 auto/.test(html) &&
       /\.gc-btn \{ flex: 1 1 auto/.test(html),
       '\u2b50 and the control stack grows into the right column\'s spare height');
    ok(/max-height: 68px/.test(html),
       '\u26a0 capped \u2014 four buttons sharing 400px would read as a mistake');

    // ⚠️ THE MEASUREMENT THAT MADE THIS ROUND NECESSARY, KEPT AS A CHECK. At no
    // sane viewport may a flank's MINIMUM content exceed the stage, or the card
    // overflows the row it sits in — which is what happened at 700px.
    const num = k => Number((lay.match(new RegExp('export const ' + k + '\\s*=\\s*([0-9]+)')) || [])[1]);
    const chrome = 24 + 10 + 12;                 // padding + heading + margin
    const worstStage = Math.max(420, Math.round(700 * 0.78));
    const leftMin  = num('RADAR_MIN_H') + num('THREAT_H') + chrome + 8;
    const rightMin = num('GAUGE_MIN_H') + chrome + 4 + 4 * 40 + 10;
    ok(leftMin <= worstStage,
       'at the shortest supported stage the left flank still fits (' + leftMin +
       ' of ' + worstStage + 'px)');
    ok(rightMin <= worstStage,
       '\u26a0\u26a0 and so does the right, which OVERFLOWED by 38px before this round (' +
       rightMin + ' of ' + worstStage + 'px)');
}


// ═══════════════════════════════════════════════════════════════════════════
console.log('\nG — JAKE\'S SCREEN: THE COUNTDOWN, AND THE THINGS DRAWN TWICE');
// ═══════════════════════════════════════════════════════════════════════════
{
    // ⭐ THE COUNTDOWN IS ALSO BIG IN THE MIDDLE OF THE FIELD. Jake: *"let's
    // duplicate those numbers (and that font) in the middle of the playfield,
    // too, so it's super obvious."*
    const c = recorder();
    drawCountdownOverlay(c, 800, 600, 3);
    const segs = c.ops.filter(o => o.op === 'fill');
    ok(segs.length === 7, 'the overlay draws one seven-segment digit');
    ok(!!findText(c, 'GET READY'), 'with a caption');
    // ⚠️ IT IS THE SAME TYPEFACE AS THE CONSOLE CLOCK BECAUSE IT IS THE SAME
    // FUNCTION — that is the whole of "and that font".
    ok(segs.every(o => o.color === LAY.SEG_COUNT_INK), 'in the countdown ink');
    // Centred on the canvas, both axes, at any size.
    const xs = segs.flatMap(o => o.pts.map(p => p[0]));
    const ys = segs.flatMap(o => o.pts.map(p => p[1]));
    ok(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 400) < 3,
       'horizontally centred on the play area');
    ok(Math.abs((Math.min(...ys) + Math.max(...ys)) / 2 - 300) < 3,
       'and vertically centred');

    // ⚠️⚠️ NO PULSE. The DOM countdown this replaces animated its scale every
    // frame; a large centred numeral that strobes is a periodic large-area
    // luminance change in front of thirty twelve-year-olds, which is the exact
    // pattern drawHitFeedback() stopped doing a full-screen fill to avoid.
    const big = (() => { const r = recorder(); drawCountdownOverlay(r, 800, 600, 3);
        return r.ops.filter(o => o.op === 'fill').flatMap(o => o.pts.map(p => p[1])); })();
    ok(Math.max(...big) === Math.max(...ys) && Math.min(...big) === Math.min(...ys),
       'two draws of the same count are pixel-identical');
    // ⚠️⚠️ AND THAT SAMPLE ALONE DOES NOT PROVE IT, WHICH IS WHY THE NEXT CHECK
    // EXISTS. Mutating the overlay to scale by `Math.sin(Date.now())` passed all
    // 120 assertions: two back-to-back draws land in the SAME MILLISECOND, so
    // any time-driven pulse is invisible to sampling. A property about "for all
    // t" cannot be established by evaluating at one t.
    // ⭐ SO THE REAL CHECK IS STRUCTURAL: the overlay's geometry may depend on
    // nothing but (W, H, n). No clock reaches it, so there is nothing to pulse
    // with — and that is the assertion that guards a photosensitivity rule
    // rather than merely describing one.
    const drawSrc = readFileSync(new URL('../game-draw.js', import.meta.url), 'utf8');
    const ov = stripJs(drawSrc.slice(drawSrc.indexOf('export function drawCountdownOverlay'),
                                     drawSrc.indexOf('export function drawThreatBoard')));
    ok(!/Date\.now|performance\.now|Math\.random|tSec|new Date/.test(ov),
       '\u26a0\u26a0 no clock or randomness reaches the overlay, so it CANNOT pulse');
    ok(!/globalAlpha\s*=/.test(ov),
       'and it never varies its own alpha');
    // ⚠️ AND NO FULL-AREA WASH BEHIND IT. A dimming panel over the sky would be
    // the same luminance problem wearing a different hat.
    ok(!c.ops.some(o => o.op === 'fillRect' && o.w >= 800),
       'and nothing is drawn across the whole play area behind it');

    // Absent-safe: no count, nothing drawn.
    const off = recorder();
    drawCountdownOverlay(off, 800, 600, null);
    ok(off.ops.length === 0, 'no countdown means no overlay at all');
}

{
    // ⚠️⚠️ ONE SOURCE, DISPLAYED TWICE \u2014 NOT TWO SOURCES. The rule Round 95
    // enforced (the strip flanks and the console each computing a WPM) is about
    // two things COUNTING. Both countdown readouts render the view's single
    // `countdown` variable, handed down from game-chrome.js's one timer.
    const dl = readFileSync(new URL('../game-deadline.js', import.meta.url), 'utf8');
    const code = stripJs(dl);
    ok(/drawCountdownOverlay\(ctx, W, H, countdown\)/.test(code) &&
       /countdown,/.test(code),
       'both readouts are fed the same `countdown` variable');
    // The declaration, restart()'s reset, and the chrome callback. Nothing else
    // may write it, or the two readouts have two sources after all.
    ok((code.match(/countdown = /g) || []).length <= 3,
       '\u26a0 and only the declaration, restart() and the chrome callback assign it');

    // ⚠️⚠️ THE TOP HUD PLATE MUST NOT RUN WHEN A CONSOLE IS PRESENT. Jake's
    // screenshot: "0 WPM 100% TARGET 25/90%" on a plate over the sky while the
    // console printed the same four numbers to the right. It happened only with
    // the KEYBOARD OFF \u2014 kbH is 0, so the fallback branch ran. The flanks stood
    // down for this in Round 95; this branch did not.
    ok(/\} else if \(!gaugeCtx\) \{\s*(?:[^}]*?)drawHudTop/.test(code) ||
       /else if \(!gaugeCtx\)/.test(code),
       '\u26a0\u26a0 drawHudTop() is gated on there being NO console panel');
}

{
    // ⚠️⚠️ THE DUPLICATED BUTTONS. destroy() removed the overlay and left the
    // BAR behind, because with a barHost the bar has a different parent \u2014 so
    // arcade.html's destroy-and-remount on every launch appended another set.
    // ⭐ AND THAT IS ALSO WHY THE PAGE WAS TOO TALL: the extra stack contributed
    // its own min-content height to the grid row.
    const chrome = readFileSync(new URL('../game-chrome.js', import.meta.url), 'utf8');
    const cc = stripJs(chrome);
    const destroy = cc.slice(cc.indexOf('destroy() {'));
    ok(/bar\.parentNode.*removeChild\(bar\)/s.test(destroy.slice(0, 600)),
       '\u26a0\u26a0 destroy() removes the BAR as well as the overlay');
    ok(/wrap\.parentNode.*removeChild\(wrap\)/s.test(destroy.slice(0, 600)),
       'and still removes the overlay');
    ok(/classList\.contains\('gc-bar'\)/.test(cc),
       'plus a stale-bar sweep on mount, so a missed teardown cannot show two');

    // ⚠️ THE FLANKS MAY NOT SET THE GRID ROW HEIGHT. Every floor inside a card
    // competes with #stage for it, which is what made the radar taller than the
    // play frame on a real screen.
    const html = readFileSync(new URL('../arcade.html', import.meta.url), 'utf8');
    const lay = readFileSync(new URL('../game-layout.js', import.meta.url), 'utf8');
    ok(/\.side-card \{[^}]*min-height: 0/.test(html),
       '\u26a0\u26a0 a flank card contributes no min-height of its own');
    ok(/\.side-card \{[^}]*overflow: hidden/.test(html),
       'and clips rather than growing the row');
    ok(/#controls-col \.gc-bar-card \{ min-height: 0/.test(html),
       'nor does the control stack');
    const num = k => Number((lay.match(new RegExp('export const ' + k + '\\s*=\\s*([0-9]+)')) || [])[1]);
    // ⚠️ THE ARITHMETIC THAT MADE ROUND 100b NECESSARY, AT JAKE'S OWN VIEWPORT.
    // His screenshot is ~745 CSS px tall, so #stage's 78vh is ~581.
    const chromeH = 24 + 10 + 12;
    const stage = Math.max(420, Math.round(745 * 0.78));
    const leftMin  = num('RADAR_MIN_H') + num('THREAT_H') + chromeH + 8;
    const rightMin = num('GAUGE_MIN_H') + chromeH + 4 + 4 * 34 + 3 * 8 + 10;
    ok(leftMin <= stage, 'at Jake\'s viewport the left flank fits the stage (' +
       leftMin + ' of ' + stage + 'px)');
    ok(rightMin <= stage, '\u26a0\u26a0 and so does the right (' + rightMin +
       ' of ' + stage + 'px)');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nH — ROUND 101: THE SPARE HEIGHT, THE SECONDS, AND THE TWO SIGNALS');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ EVERY ASSERTION HERE IS A RELATIONSHIP, NOT A PIXEL. Jake asked for the
// banked timers to be *"bigger... to better fill all the dead space"*, and the
// thing that has to stay true is not a size — it is that a TALLER canvas yields
// a BIGGER readout and that NOTHING leaves the panel at any height. A literal
// would go red the first time game-layout.js is edited, which is what that file
// exists for.
{
    const bankedAt = H => {
        const c = recorder();
        drawGauges(c, { W: GW, H, wpm: 22, acc: 94, targetWPM: 25, minAccuracy: 90,
                        seconds: 73, shieldsLeft: 6,
                        todayClock: '0:08:05', weekClock: '3:12:40' });
        return c;
    };
    const bottomOf = c => Math.max(
        ...c.ops.filter(o => o.op === 'fillRect').map(o => o.y + o.h),
        ...textOps(c).map(o => o.y),
        ...c.ops.filter(o => o.op === 'fill').flatMap(o => o.pts.map(p => p[1])));
    // The banked digits are the lowest thing on the panel, so the height of the
    // block is measurable as how far below the TODAY label the drawing reaches.
    const sizeOf = c => {
        const row = findText(c, 'TODAY');
        if (!row) return 0;
        const segs = c.ops.filter(o => o.op === 'fill' && o.color === LAY.GAUGE_TOTAL_INK)
                          .flatMap(o => o.pts.map(p => p[1]))
                          .filter(v => Math.abs(v - row.y) < 60);
        return segs.length ? Math.max(...segs) - Math.min(...segs) : 0;
    };
    const short = bankedAt(LAY.GAUGE_MIN_H), tall = bankedAt(LAY.GAUGE_MAX_H);
    ok(sizeOf(tall) > sizeOf(short),
       '\u2b50 a taller console draws BIGGER banked digits (' +
       Math.round(sizeOf(short)) + ' \u2192 ' + Math.round(sizeOf(tall)) + 'px)');
    for (const H of [LAY.GAUGE_MIN_H, 300, 344, LAY.GAUGE_MAX_H]) {
        ok(bottomOf(bankedAt(H)) <= H,
           '\u26a0\u26a0 and nothing runs off the bottom at ' + H + 'px (' +
           Math.round(bottomOf(bankedAt(H))) + ')');
    }
    // ⚠️ THE ROWS SPREAD, THEY DO NOT STACK. This is the whole difference
    // between filling the dead space and moving it: at the tall size the two
    // rows must sit FURTHER apart than at the short one.
    const gapOf = c => {
        const t = findText(c, 'TODAY'), w = findText(c, 'WEEK');
        return t && w ? w.y - t.y : 0;
    };
    ok(gapOf(tall) > gapOf(bankedAt(344)),
       'the two rows spread down the spare height rather than stacking at the top');
    // ⚠️ AND IT DEGRADES INSTEAD OF OVERFLOWING. At the floor the block gives up
    // its heading and then the WEEK row; TODAY is the last thing to go, because
    // it is the figure a child can still act on.
    ok(!!findText(short, 'TODAY'),
       '\u26a0 at the shortest console TODAY survives the squeeze');
}

{
    // ⚠️⚠️ THE SECONDS COME OFF THE SAME FORMATTER AS THE WORDS. Jake asked for
    // seconds on these rows; the standing rule since Round 95 is that only
    // minuteLines() may turn seconds into a readout, or a student is shown two
    // different totals for one day. So the check is that the SHAPE changed in
    // that one function and that drawGauges() still does no arithmetic.
    const dl = readFileSync(new URL('../game-deadline.js', import.meta.url), 'utf8');
    const fn = stripJs(dl.slice(dl.indexOf('function minuteLines()')));
    const body = fn.slice(0, fn.indexOf('function hudLines'));
    ok(/3600/.test(body) && /% 60/.test(body),
       'minuteLines() emits hours, minutes AND seconds');
    ok(/todayClock: clock\(m\.dailySeconds\)/.test(dl) &&
       /weekClock:\s+clock\(m\.weeklySeconds\)/.test(dl),
       'and both rows still come off that one function');
    const draw = readFileSync(new URL('../game-draw.js', import.meta.url), 'utf8');
    const gg = draw.slice(draw.indexOf('export function drawGauges'));
    const banked = stripJs(gg.slice(gg.indexOf('if (o.todayClock')));
    ok(!/dailySeconds|weeklySeconds/.test(banked),
       '\u26a0\u26a0 and the drawing side never sees a seconds figure to reformat');
}

{
    // ⚠️⚠️ A SPACE AT A WORD BOUNDARY IS FREE, MID-WORD IT IS NOT. Jake:
    // *"I don't want spaces at the end of words to count against me... In the
    // middle of a word should hurt, but at the end should not."*
    // ⚠️ AND IT MUST NOT BE SCORED AS A HIT EITHER — d.keyResult(true) here
    // would let a student inflate accuracy by tapping space, which is the exact
    // hole reject() was written to close.
    const dl = readFileSync(new URL('../game-deadline.js', import.meta.url), 'utf8');
    const kd = stripJs(dl.slice(dl.indexOf('function onKeyDown(e)')));
    const guard = kd.slice(kd.indexOf("if (ch === ' ')"), kd.indexOf('function accept'));
    ok(/midWord/.test(guard) && /typed > 0/.test(guard) &&
       /typed < src\.text\.length/.test(guard),
       'the space guard tests whether a word is half-typed, not merely which key it is');
    ok(/if \(!midWord\) return;/.test(guard),
       '\u2b50 a boundary space returns without reaching reject()');
    ok(!/keyResult/.test(guard),
       '\u26a0\u26a0 and without being counted as a correct key either');
}

{
    // ⚠️⚠️ TWO SIGNALS, TWO SHAPES. The key the student NEEDED swells; the key
    // they HIT blinks. If these ever converge on one effect the feature is dead:
    // the child sees two red keys and cannot tell which one to press.
    const strip = (extra) => { const c = recorder();
        drawKeyboardStrip(c, Object.assign(
            { W: 800, H: 600, height: 120, nextChar: '.', keyStates: {} }, extra));
        return c; };
    const quiet = strip({});
    const loud = withFullMotion(() => strip({ missPulse: { key: '.', age: 0 },
                                              hitFlash: { key: 'm', age: 0 } }));
    const redOf = c => c.ops.filter(o => o.color === LAY.KEY_MISS_INK).length;
    ok(redOf(quiet) === 0, 'a clean board draws nothing red');
    ok(redOf(loud) > redOf(quiet), 'an error paints red on the board');
    // ⚠️ THE PULSE IS DRAWN LAST, OVER ITS NEIGHBOURS. Inside the row loop it
    // would be painted over by every key after it and clipped on one side, which
    // reads as a rendering fault rather than as emphasis.
    const boardKeys = loud.ops.filter(o => o.op === 'stroke');
    ok(boardKeys.length > 0 &&
       boardKeys[boardKeys.length - 1].color === LAY.KEY_MISS_INK,
       '\u26a0 the swelling key is stroked last, so it sits over its neighbours');
    // ⚠️ IT EXPIRES. An age past the span draws nothing, which is what keeps a
    // stale error off the first frame of the next run.
    const stale = strip({ missPulse: { key: '.', age: LAY.KEY_MISS_PULSE_MS + 1 },
                          hitFlash: { key: 'm', age: LAY.KEY_HIT_FLASH_MS + 1 } });
    ok(redOf(stale) === 0, 'and both signals expire on their own spans');
    // ⚠️⚠️ REDUCED MOTION KEEPS THE COLOUR AND DROPS THE GROWTH. A student who
    // cannot have the movement must still be told which key they missed.
    const still = strip({ missPulse: { key: '.', age: 0 } });
    ok(redOf(still) > 0,
       '\u26a0\u26a0 under prefers-reduced-motion the red survives');
    // ⚠️ THE SIZE OF THE SWELL IS NOT OBSERVABLE ON THIS RECORDER — roundRect()
    // draws with arcTo(), whose control points it does not log — so the motion
    // half is pinned at source instead. ⚠️ A CHECK THAT CANNOT SEE ITS SUBJECT
    // MUST SAY SO RATHER THAN ASSERT SOMETHING ADJACENT AND LOOK GREEN.
    const draw = readFileSync(new URL('../game-draw.js', import.meta.url), 'utf8');
    const strip2 = stripJs(draw.slice(draw.indexOf('export function drawKeyboardStrip')));
    ok(/const grow = prefersReducedMotion\(\) \? 0 : LAY\.KEY_MISS_PULSE_SCALE/.test(strip2),
       'and only the motion is what it loses \u2014 the scale, never the colour');
}


console.log(fail
    ? `\narcade-panels-test: ${pass} passed, ${fail} FAILED`
    : `arcade-panels-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
