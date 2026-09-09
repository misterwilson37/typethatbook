// arcade-panels-test.mjs v1.1.0 — Round 100 (Lambert): the threat board, and
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
import { drawRadar, drawGauges, drawSevenSeg, sevenSegWidth, drawThreatBoard }
    from '../game-draw.js';
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
    const withTotals = gauges({ wpm: 20, acc: 90, todayText: '14m', weekText: '1h 20m' });
    ok(!!findText(withTotals, 'TODAY  14m') && !!findText(withTotals, 'WEEK   1h 20m'),
       'the banked totals are printed verbatim, exactly as handed over');
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
    // ⚠️ ABSENT-SAFE. tools/game-lab.html and learn.js supply no side canvases,
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

console.log(fail
    ? `\narcade-panels-test: ${pass} passed, ${fail} FAILED`
    : `arcade-panels-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
