// lesson-game-layout-test.mjs v1.0.0 — A LESSON RUN AND AN ARCADE RUN ARE THE
// SAME GAME, ON THE SAME PLAYFIELD. Round 114 (Carriage).
//
// ⚠️⚠️ JAKE, 2026-09-10, WATCHING A STUDENT PLAY THE LESSON GAME: *"the game is a
// mess due to the layout that's there... this is very definitely nigh impossible
// for students."*
//
// ⭐ IT WAS NOT A DIFFICULTY PROBLEM. IT WAS AN ASPECT RATIO. `learn2.html` gave
// Deadline `width: 100%` of an uncapped body — measured ~2380x521 on his screen,
// a **4.6:1** strip. `arcade.html`'s stage is ~816x581, **1.4:1**, because
// `.wrap` caps at 1320px and two side columns take 440px of it. So words were
// spread across **2.9x** the horizontal distance a student scans in the arcade,
// in a strip less than half as tall.
//
// ⚠️ AND EVERY NUMBER IN THE GAME IS COMPUTED FROM THE PLAY CANVAS'S OWN `W`.
// game-deadline.js derives lane positions, dome radii and spawn spread from it,
// and arcade.html's own comment records that Round 91 shrank the dome radius
// "for looks", silently ended the three-deep overlap, and **it looked completely
// fine**. The game was tuned against 816px and handed 2380.
//
// ⭐⭐ SO THE TWO PAGES MUST NOT DRIFT, AND THAT IS WHAT THIS FILE PINS. If they
// lay Deadline out differently then a lesson run and an arcade run are not the
// same difficulty — and the entire premise printed on arcade.html, *"type the
// same run in School and see whether the numbers line up"*, is void. ⚠️ THAT
// FAILURE IS INVISIBLE: both pages render, both games play, and only the numbers
// quietly stop meaning the same thing.
//
// ⚠️ THIS IS A TEXT COMPARISON OF TWO STYLESHEETS AND IT KNOWS IT. It cannot
// measure a rendered pixel. What it CAN do is refuse to let the two grids differ,
// which is the only way the pixel difference ever arises.

import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const rd = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

/**
 * ⚠️⚠️ CSS COMMENTS OUT BEFORE ANY DECLARATION CHECK. This repo comments its CSS
 * as heavily as its code, INCLUDING by quoting the exact declaration a check is
 * asserting — `min-height: 0` appears in the prose explaining why `min-height: 0`
 * is load-bearing. ⭐ SO A MUTATION THAT DELETED THE REAL DECLARATION LEFT THE
 * ASSERTION GREEN, because the comment still matched. Second time this round a
 * check of mine measured prose instead of code (see arcade-panels-test.mjs's
 * stripHtml).
 */
const noCss = src => src.replace(/\/\*[\s\S]*?\*\//g, ' ');
const arcade = rd('arcade.html');
const learn2 = rd('learn2.html');
const learn2js = rd('learn2.js');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nA — THE PLAY COLUMN IS THE SAME WIDTH ON BOTH PAGES');
// ═══════════════════════════════════════════════════════════════════════════
{
    const cols = src => (src.match(/grid-template-columns:\s*([^;]+);/g) || [])
        .map(m => m.replace(/\s+/g, ' ').trim());
    const aCols = cols(arcade), lCols = cols(learn2);

    ok(aCols.length >= 3, 'arcade.html declares its grid plus breakpoints (' +
       aCols.length + ')');
    ok(lCols.length >= 3, 'learn2.html declares the same three (' + lCols.length + ')');

    // ⭐ THE FULL-WIDTH DECLARATION AND BOTH FOLD STEPS, IN ORDER.
    const want = [
        'grid-template-columns: 200px minmax(724px, 1fr) 240px;',
        'grid-template-columns: 200px minmax(724px, 1fr);',
        'grid-template-columns: minmax(0, 1fr);',
    ];
    for (const w of want) {
        ok(aCols.indexOf(w) !== -1, 'arcade.html has `' + w + '`');
        ok(lCols.indexOf(w) !== -1,
           '\u26a0\u26a0 learn2.html has the SAME `' + w + '` \u2014 a different play column ' +
           'is a different game at the same gate');
    }
    // ⚠️ THE 724px FLOOR IS THE CONSTRAINT TO TEST, NOT THE PANEL WIDTHS.
    // arcade.html's own comment says so. Below it the keyboard strip hits
    // KEY_MAX_W and the control bar spills onto the keys.
    for (const [name, src] of [['arcade.html', arcade], ['learn2.html', learn2]]) {
        const floors = (src.match(/minmax\((\d+)px/g) || [])
            .map(m => +m.match(/\d+/)[0]);
        ok(floors.length > 0 && floors.every(f => f >= 724),
           '\u26a0 ' + name + ' never lets the play column below 724px (' +
           floors.join(', ') + ')');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nB — THE STAGE IS CAPPED, WHICH IS THE WHOLE FIX');
// ═══════════════════════════════════════════════════════════════════════════
{
    // ⚠️⚠️ THE UNCAPPED WIDTH IS THE DEFECT JAKE SAW. Without a cap the play
    // column takes `1fr` of the whole viewport, which on a classroom monitor or
    // a teacher's 27" display is two to three thousand pixels.
    ok(/max-width:\s*1320px/.test(arcade), 'arcade.html caps its wrap at 1320px');
    ok(/#game-wrap\s*\{[^}]*max-width:\s*1320px/s.test(learn2),
       '\u26a0\u26a0 learn2.html caps #game-wrap at THE SAME 1320px \u2014 uncapped is the ' +
       'defect: ~2380x521 on Jake\u2019s screen, a 4.6:1 strip against the arcade\u2019s 1.4:1');

    // ═════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ THE HEIGHTS LEGITIMATELY DIFFER, AND AN EARLIER DRAFT OF THIS PART
    // ASSERTED THEY MUST MATCH — WHICH IS HOW THE PANELS ENDED UP TOO TALL.
    // ═════════════════════════════════════════════════════════════════════
    //
    // Jake, 2026-09-10: *"the side panels are loading too tall."*
    //
    // ⭐ `78vh` WAS COPIED FROM arcade.html AND arcade.html HAS NOTHING ABOVE
    // ITS STAGE. This page has ~285px of it — the lesson HUD, two progress bars
    // and the FINAL RUN label — so 285 + 78vh of a 1484px window is 1443px
    // before the cards contribute their own min-content, and the flanks ran off
    // the bottom of the screen.
    //
    // ⚠️ A vh FRACTION CANNOT KNOW THE HUD EXISTS. It is measured against the
    // viewport; the box actually available is the viewport minus whatever chrome
    // the lesson happens to be showing, which changes when a lesson title wraps.
    // ⭐ SO WHAT IS PINNED HERE IS THE MECHANISM, NOT THE NUMBER: learn2 takes
    // the remaining flex space, arcade takes 78vh, and BOTH ARE DEFINITE — which
    // is the property the canvases actually need, because fitCanvas() measures
    // getBoundingClientRect() and an indefinite height resolves to zero on the
    // first frame and renders the panel blank.
    // ⚠️ THE HEIGHT WAS NEVER THE PART THAT AFFECTED DIFFICULTY. Part A pins the
    // play COLUMN, which is where Deadline's lanes, dome radii and spawn spread
    // come from.
    ok(/78vh/.test(arcade), 'arcade.html’s stage is 78vh — it has no chrome above it');
    const wrap = (noCss(learn2).match(/#game-wrap\s*\{[^}]*\}/s) || [''])[0];
    ok(/flex:\s*1 1 auto/.test(wrap),
       '⚠⚠ learn2’s game area claims the REMAINING space instead (flex: 1 1 auto)');
    ok(/min-height:\s*0/.test(wrap),
       '⚠⚠ with min-height: 0 — LOAD-BEARING: without it a flex item refuses ' +
       'to shrink below its content’s min-content, which is the overflow itself');
    // ═════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ THE VOID IS PAINTED, AND THIS ASSERTION WAS MISSING ENTIRELY.
    // ═════════════════════════════════════════════════════════════════════
    // Jake, 2026-09-10: *"the background should probably be black instead of
    // white."* style.css is a LIGHT theme, so every pixel of the game area not
    // covered by a card or the play canvas came out white — the gutters between
    // the columns, the padding, the band under the frame. ⭐ arcade.html never
    // had this because its own body sets --bg: #06090f.
    // ⚠️⚠️ I WROTE THE CSS AND FORGOT THE CHECK, AND THEN WROTE THE CHECK WITH A
    // MIS-ESCAPED ANCHOR SO THE INSERT SILENTLY DID NOTHING — Python's
    // str.replace() does not complain when it matches nothing. TWO passes of the
    // mutation test reported green on code with the declaration deleted.
    // ⭐ ASSERT THE ANCHOR BEFORE EDITING, AND RE-RUN THE MUTATION AFTER.
    ok(/background:\s*#06090f/.test(wrap),
       '⚠️⚠️ the game area paints the arcade’s void (#06090f) rather than ' +
       'inheriting style.css’s light theme');
    ok(!/#game-wrap[^{]*\{[^}]*background:\s*(#fff|white)/is.test(noCss(learn2)),
       'and never white');
    // ⚠️ ON THE WRAP, NOT ON body. This is the only part of a lesson that is a
    // dark console; painting the whole page would take the typed runs and the
    // result modal with it.
    ok(!/body\s*\{[^}]*#06090f/s.test(noCss(learn2)),
       '⚠️ scoped to the game area, so typed runs keep the light theme');
    ok(!/#game-mount\s*\{[^}]*\dvh/s.test(noCss(learn2)),
       '⚠⚠ and the play cell carries NO vh height at all — a viewport fraction ' +
       'under 285px of lesson chrome is what pushed the flanks off the fold');
    ok(/grid-template-rows:\s*minmax\(0, 1fr\)/.test(noCss(learn2)),
       '⭐ the grid row is capped at minmax(0, 1fr), so the row cannot grow to ' +
       'its tallest item’s min-content — the stage owns the row, the flanks fit');
    ok(/#game-mount\s*\{[^}]*height:\s*100%/s.test(noCss(learn2)),
       'the play cell fills that row exactly');
    // ⚠️ AND A FLOOR STILL EXISTS, or a short window collapses the game to
    // nothing and fitCanvas() measures a zero-height box.
    ok(/min-height:\s*420px/.test(arcade) && /min-height:\s*420px/.test(learn2),
       'both pages keep a 420px floor on the game area');
    // ⚠️ THE FLANK CANVAS FLOORS ARE LOWER HERE, ON PURPOSE. game-chrome.js's own
    // header records Round 101 hitting this in the arcade: four buttons plus the
    // canvas floor contributed more min-content than the row had. The card here
    // is shorter than the arcade's, so the floors have to be too, or DONE gets
    // clipped — and DONE is the only way off this page for a student on an iPad.
    for (const [id, cap] of [['gauge-canvas', 260], ['radar-canvas', 200]]) {
        const rule = (noCss(learn2).match(new RegExp('#' + id + '\\s*\\{[^}]*\\}', 's')) || [''])[0];
        const floor = +((rule.match(/min-height:\s*(\d+)px/) || [0, 9999])[1]);
        ok(floor < cap,
           '⚠ learn2’s #' + id + ' floor (' + floor + 'px) is below the arcade’s ' +
           cap + 'px, because its card is shorter');
        ok(floor > 0, 'but still non-zero, so fitCanvas() never measures a zero box');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nC — THE PANEL ELEMENT IDS MATCH, OR THE PANELS GO BLANK SILENTLY');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ BOTH PAGES HAND THESE IDS TO THE SAME panelOptionsFor(). Rename one and
// `document.getElementById` returns null, `panelOptionsFor()` correctly omits the
// key, the view correctly draws no panel, and NOTHING REPORTS A FAULT — every
// panel is absent-safe for learn.js's benefit. ⭐ THAT IS THE EXACT DEFECT JAKE
// REPORTED ON THE ARCADE THE SAME MORNING: *"there are no active consoles on
// deadline."*
{
    // ⚠️ THE PLAY CELL IS THE ONE ID THAT LEGITIMATELY DIFFERS: `#stage` on
    // arcade.html, `#game-mount` on learn2.html. It is the only element neither
    // page passes to panelOptionsFor() — the view is mounted INTO it directly —
    // so its name is local to each page and nothing breaks silently.
    // ⭐ THE FIRST DRAFT OF THIS LOOP LISTED IT AS SHARED AND WENT RED ON CORRECT
    // CODE. Part B already pins that cell's geometry, which is the part that
    // matters; its name is not.
    ok(/id="stage"/.test(arcade) || /id='stage'/.test(arcade),
       'arcade.html’s play cell is #stage');
    ok(/id="game-mount"/.test(learn2),
       'and learn2.html’s is #game-mount — different by design, see above');
    for (const id of ['radar-col', 'controls-col', 'radar-canvas',
                      'threat-canvas', 'gauge-canvas']) {
        ok(new RegExp('id="' + id + '"').test(arcade), 'arcade.html has #' + id);
        ok(new RegExp('id="' + id + '"').test(learn2),
           '\u26a0\u26a0 learn2.html has #' + id + ' too \u2014 a rename blanks the panel ' +
           'with no error at all');
    }
    // ⭐ AND learn2.js GOES THROUGH THE SHARED FUNCTION rather than an object
    // literal. An inlined options object in a 360KB page controller is
    // unreachable by any harness — which is why the arcade's version of this bug
    // survived eleven rounds behind a green suite.
    ok(/panelOptionsFor\('deadline',/.test(learn2js),
       '\u26a0\u26a0 learn2.js wires its panels through panelOptionsFor(), not a literal');
    ok(/from '\.\/game-names\.js'/.test(learn2js),
       'importing it from game-names.js, the same module arcade.html uses');
    for (const opt of ['gaugeCanvas:', 'radarCanvas:', 'threatCanvas:']) {
        ok(!new RegExp(opt).test(learn2js),
           '\u26a0 and learn2.js never names `' + opt + '` itself');
    }
    // ⚠️ THE BAR HOST IS WHAT STOPS THE BUTTONS LANDING ON THE GAUGES. Jake's
    // screenshot had PAUSE/SOUND OFF/KEYS ON/DONE sitting on top of the in-canvas
    // BANKED readout, because with no barHost game-chrome.js falls back to a
    // floating bar over the play area.
    ok(/barHost:\s*document\.getElementById\('controls-col'\)/.test(learn2js),
       '\u26a0\u26a0 learn2.js passes a barHost, so the controls live in the console ' +
       'card instead of on top of the gauges');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nD — ⚠️⚠️ RULE 11: ONE RECORD FOR WPM AND ACCURACY');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ JAKE'S SCREENSHOT HAD THE TOP BAR READING **Acc: 94%** AND THE GAME'S OWN
// FOOTER READING **95% accurate**, same instant, same screen. One quantity, two
// readers, two answers — and accuracy is the number a lesson is GATED on.
//
// ⭐ THE FORMULAS WERE NEVER THE PROBLEM. game-shell.js's netWPM() and
// accuracyPct() are character-for-character learn.js's, on purpose. THE
// DENOMINATORS WERE: this page divided by `stepSeconds`, the lesson's step clock;
// the game divides by its own elapsed clock, which starts after the countdown.
// Two clocks, therefore two speeds, and no formula change could reconcile them.
//
// ⚠️ SO THE HUD DISPLAYS THE GAME'S REPORT AND DOES NOT RECOMPUTE. Jake's ruling
// when offered three options: *"Keep them, but read them from the game's
// numbers."*
{
    ok(/let gameNumbers = null;/.test(learn2js),
       'there is a single override holding the game\u2019s numbers');
    const hud = learn2js.slice(learn2js.indexOf('function updateHUD()'),
                               learn2js.indexOf('function updateHUD()') + 700);
    ok(/if \(gameNumbers\) \{/.test(hud),
       '\u26a0\u26a0 updateHUD() prefers the game\u2019s report over its own arithmetic');
    ok(/gameNumbers\.wpm/.test(hud) && /gameNumbers\.acc/.test(hud),
       '\u2b50 displaying rep.wpm and rep.acc VERBATIM \u2014 no second rounding, no ' +
       'fallback arithmetic, which is how a second answer gets back in');
    // ⚠️ SET IN EXACTLY ONE PLACE AND CLEARED IN EXACTLY ONE PLACE.
    const sets = (learn2js.match(/gameNumbers = \{/g) || []).length;
    const clears = (learn2js.match(/gameNumbers = null;/g) || []).length;
    ok(sets === 1, 'set in exactly one place \u2014 the game\u2019s onTick (' + sets + ')');
    ok(clears === 2,
       '\u26a0\u26a0 and cleared on teardown as well as declared (' + clears +
       ') \u2014 a stale override would show a finished game\u2019s frozen numbers over ' +
       'the next TYPED run, the same lie pointing the other way');
    ok(/gameNumbers = null;[\s\S]{0,40}\}/.test(
           learn2js.slice(learn2js.indexOf('function destroyGameHandle'))),
       '\u2b50 and the clear is inside destroyGameHandle(), which every exit in the ' +
       'file already calls');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nE — THE WRAP HIDES, NOT THE MOUNT');
// ═══════════════════════════════════════════════════════════════════════════
{
    // ⚠️ #game-mount IS THE MIDDLE CELL OF A THREE-COLUMN GRID NOW. Hiding the
    // cell alone leaves two empty flank cards standing on the lesson page
    // between runs, which is a visible defect on every typed run in the course.
    ok(/id="game-wrap" class="hidden"/.test(learn2),
       'the wrap starts hidden in the markup');
    ok(/getElementById\('game-wrap'\)\.classList\.remove\('hidden'\)/.test(learn2js),
       'beginGameStep() reveals the WRAP');
    const teardown = learn2js.slice(learn2js.indexOf('function destroyGameHandle'),
                                    learn2js.indexOf('function destroyGameHandle') + 1200);
    ok(/gw\.classList\.add\('hidden'\)/.test(teardown),
       '\u26a0 and teardown hides the WRAP, not just the mount');
    ok(!/gm\.classList\.add\('hidden'\)/.test(teardown),
       '\u26a0\u26a0 the mount itself is no longer the thing that hides \u2014 two hiding ' +
       'mechanisms would be two answers to "is the game on screen"');
}

console.log(fail
    ? `\nlesson-game-layout-test: ${pass} passed, ${fail} FAILED`
    : `lesson-game-layout-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
