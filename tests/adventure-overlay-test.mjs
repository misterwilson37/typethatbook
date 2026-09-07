// adventure-overlay-test.mjs v1.0.0 — ⚠️⚠️ NOTHING IN ADVENTURE VIEW MAY SIT IN
// NORMAL FLOW BENEATH THE FIXED CANVAS.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-06, on ROADMAP 30: *"the caps lock is just showing as a white
// bar....a sliver of which is still visible when the button is pressed again."*
//
// ⚠️⚠️ THE BAR HE COULD SEE WAS NOT THE WARNING. `body.view-adventure
// #adventure-canvas` is `position: fixed` from top:56px to bottom:80px at
// z-index:5, covering the whole flow beneath it. `#caps-warning` is a
// normal-flow child of <body> declared above #game-container, and adventure.css
// v1.0.3 restyled its COLOURS without touching its POSITIONING. So it painted
// correctly, under the canvas, where nobody could see it — while its ~28px of
// flow height went on pushing #book-info-bar and #virtual-keyboard down. The
// canvas is fixed and does not move with them. **What was visible was the gap.**
//
// ⭐ THE CLASS OF DEFECT, WHICH IS THE POINT OF THIS FILE: adventure.css skins
// classic elements by overriding their paint. That is safe for every element
// that stays inside #game-container, and WRONG for every element that does not,
// because the fixed canvas re-parents the visual stack without re-parenting the
// DOM. There are only a few such elements, and each one needs an explicit
// position + z-index or it is invisible in exactly this way.
//
// ⚠️ WHAT THIS CANNOT CHECK. It reads CSS text; it does not lay the page out.
// It cannot tell you the bar is the right height, in the right place, or
// legible — only that it is not in the category that renders under the canvas.
// A real render is still the only proof, and Jake's screenshot is what found
// this in the first place.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const css = readFileSync(new URL('../adventure.css', import.meta.url), 'utf8');
const markup = readFileSync(new URL('../game.html', import.meta.url), 'utf8');

// Strip comments so a rule quoted inside a warning block cannot satisfy a check.
const cssLive = css.replace(/\/\*[\s\S]*?\*\//g, '');

const ruleFor = (selector) => {
    const i = cssLive.indexOf(selector);
    if (i < 0) return null;
    const open = cssLive.indexOf('{', i);
    const close = cssLive.indexOf('}', open);
    return open < 0 || close < 0 ? null : cssLive.slice(open + 1, close);
};

const decl = (body, prop) => {
    if (!body) return null;
    const m = new RegExp('(?:^|;)\\s*' + prop + '\\s*:\\s*([^;]+)').exec(body);
    return m ? m[1].trim() : null;
};

console.log('\n--- A. THE CANVAS IS STILL THE THING EVERYTHING ELSE MUST CLEAR ---');

const canvas = ruleFor('body.view-adventure #adventure-canvas');
ok(!!canvas, 'A1 body.view-adventure #adventure-canvas has a rule');
ok(decl(canvas, 'position') === 'fixed',
   '⚠️ A2 the adventure canvas is still position:fixed — if this changed, the ' +
   'whole premise of this file changed with it and every check below needs re-reading');

const canvasZ = parseInt(decl(canvas, 'z-index') || '0', 10);
ok(canvasZ > 0, `A3 the canvas declares a z-index (${canvasZ})`);

console.log('\n--- B. ⚠️⚠️ #caps-warning IS ABOVE THE CANVAS, NOT UNDER IT ---');

// ⚠️ THE THREE PARTS ARE NOT INTERCHANGEABLE AND ALL THREE ARE REQUIRED.
// z-index alone does nothing on a statically-positioned element — that is the
// single most likely way for someone to "fix" this and ship the bug back.
const caps = ruleFor('body.view-adventure #caps-warning');
ok(!!caps, '⚠️ B1 body.view-adventure #caps-warning still has a rule');

const capsPos = decl(caps, 'position');
ok(capsPos === 'fixed' || capsPos === 'absolute',
   '⚠️⚠️ B2 #caps-warning IS OUT OF FLOW IN ADVENTURE VIEW (position:fixed). It ' +
   'is a flow child of <body>, so while it is static it renders UNDER the fixed ' +
   'canvas and its only visible effect is the gap it opens below — the white bar ' +
   'Jake reported. ⚠️ z-index does NOTHING on a static element: adding one ' +
   'without this line looks like a fix and changes nothing.');

const capsZ = parseInt(decl(caps, 'z-index') || '0', 10);
ok(capsZ > canvasZ,
   `⚠️⚠️ B3 #caps-warning STACKS ABOVE THE CANVAS (${capsZ} > ${canvasZ}). Out of ` +
   `flow but underneath is the same invisible bar, arrived at a different way.`);

// ⭐ The half that was never broken, pinned so a re-fix cannot drop it.
ok(/#c0392b/i.test(caps || ''),
   'B4 the parchment red survives — the colours were always correct here, only ' +
   'the positioning was wrong, and a rewrite should not "fix" what worked');

console.log('\n--- C. THE MARKUP THIS ALL DEPENDS ON ---');

// ⚠️ If #caps-warning ever moves INSIDE #game-container, B2/B3 stop being
// necessary and this file should be re-judged rather than obeyed.
const capsAt = markup.indexOf('id="caps-warning"');
const containerAt = markup.indexOf('id="game-container"');
ok(capsAt > 0 && containerAt > 0, 'C1 both elements are still in game.html');
ok(capsAt < containerAt,
   '⚠️ C2 #caps-warning is still a sibling declared BEFORE #game-container. If it ' +
   'moved inside the container, the fixed-canvas overlap argument no longer ' +
   'applies and section B should be re-judged, not merely satisfied');

ok(/id="caps-warning"[^>]*class="[^"]*\bhidden\b/.test(markup),
   '⚠️ C3 #caps-warning still ships hidden. It is toggled by class from game.js; ' +
   'a bar that starts visible is a bar every student sees on load');

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} - ${pass} passing, ${fail} failing`);
process.exit(fail === 0 ? 0 : 1);
