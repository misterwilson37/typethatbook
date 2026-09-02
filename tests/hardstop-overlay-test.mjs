// hardstop-overlay-test.mjs v1.0.0 — Round 58 (Emerson).
//
// ⚠️⚠️ ROADMAP 49 — THE HARD-STOP OVERLAY AND ITS FLAG ARE ONE PIECE OF STATE.
//
// Jake, 2026-09-02, with two screenshots from two students: the drill showed
// `;lfd;` and the keyboard was covered by a red `S` and "Too many errors — type
// the correct key to continue". There is no `s` in that line, in QWERTY,
// anywhere. He was right that it made no sense.
//
// `#drill-hardstop` was removed at TWO sites and `drillIsHardStop` cleared at
// THREE. beginStep() was the third: it regenerated drillSequence, reset
// drillPos, cleared the flag — and left the DIV in the document. Its parent
// #drill-keyboard-wrap is static markup in learn.html that beginStep() never
// rebuilds, so nothing tore it down. Caps Lock made every keystroke a mistake,
// five consecutive hit the hard stop, the release branch could not match the
// correct key while Caps Lock was on, the student pressed ↻ Restart, and the
// overlay outlived the sequence that produced it.
//
// ⚠️ THE FLAG WAS FALSE BY THEN, SO THE DRILL WAS LIVE AND SCORING UNDERNEATH A
// 92%-WHITE SHEET. The app was grading a run the child believed it was refusing.
//
// ⚠️⚠️ THIS ASSERTS THE PAIRING, NOT THE CALL SITES. "Does beginStep() remove the
// element" would pass forever and say nothing about the NEXT site that clears
// the flag — and this file's whole existence is that a third site appeared and
// nobody noticed. Part A reads every assignment of `drillIsHardStop = false` out
// of the shipped source and requires each one to clear the overlay too.
//
// ⚠️ CAPS LOCK IS DELIBERATELY NOT TESTED HERE. Jake ruled on it 2026-09-02:
// "The kid needs to learn to turn off caps lock. I'm not worried about that.
// That's not an error on your or my part — that's the kid needing to learn."
// With Caps Lock on the child really is producing the wrong character and the
// banner already says so. DO NOT add a case that forgives it: learn.js teaches
// capitals, and a future round "fixing" the comparison would make every
// capital-letter drill unfailable.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };

// ⚠️ COMMENTS ARE STRIPPED BEFORE ANY MATCHING, AND HERE IT IS LOAD-BEARING: the
// fix ships with comment blocks QUOTING the defect ("beginStep() cleared the flag
// and left the element"), so an unstripped read would satisfy itself on prose.
// §0.-31.H is the round that learned this the expensive way.
function decomment(src) {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

const src = decomment(read('learn.js'));

console.log('─── A. ⚠️⚠️ EVERY SITE THAT CLEARS THE FLAG ALSO CLEARS THE ELEMENT ───');
{
    const lines = src.split('\n');
    const clearAt = [];
    // ⚠️ THE DECLARATION IS NOT A CLEAR SITE. `let drillIsHardStop = false;` at
    // the top of the file initialises the state; it has no overlay to remove
    // because none can exist yet. The first draft matched it and went red
    // against the CORRECT build — §0.-14.G's rule, that a checker crying wolf on
    // honest input is one the next round learns to skip. Excluded by shape, not
    // by line number.
    lines.forEach((l, i) => {
        if (!/\bdrillIsHardStop\s*=\s*false\s*;/.test(l)) return;
        if (/^\s*(let|const|var)\s+drillIsHardStop\b/.test(l)) return;
        clearAt.push(i);
    });

    // ⚠️ TWO, NOT THREE, AND THE HARNESS CORRECTED ME ON IT. I expected three
    // because the overlay is removed at three places. The spam-restart branch
    // removes the ELEMENT and then reaches beginStep() through a setTimeout,
    // which is what clears the FLAG — so it is one clear site expressed across
    // two functions, not a site of its own. Pinning 3 would have gone red
    // against a correct build.
    ok(clearAt.length >= 2,
       `expected at least 2 sites clearing drillIsHardStop (found ${clearAt.length}) — ` +
       `if this dropped, the state moved and this harness needs re-aiming`);

    // ⚠️ A WINDOW, NOT A WHOLE-FILE SEARCH. "_hideHardStopOverlay appears in the
    // file" is satisfied by its own definition and by any one caller, which is
    // exactly the false pass §0.-20.E1 records. The clearing and the hiding have
    // to be the same piece of code, so they have to be near each other.
    for (const i of clearAt) {
        const window = lines.slice(Math.max(0, i - 6), i + 7).join('\n');
        ok(/_hideHardStopOverlay\s*\(/.test(window),
           `⚠️ learn.js:${i + 1} clears drillIsHardStop and does NOT clear the ` +
           `overlay within 6 lines — ROADMAP 49 verbatim. A restarted drill will ` +
           `inherit the previous sequence's red letter, and the flag being false ` +
           `means the drill underneath is LIVE AND SCORING under it.`);
    }
}

console.log('\n─── B. THE REMOVAL HAS ONE HOME ───');
{
    // Every raw removal is a place the pairing above can be broken silently.
    const raw = [...src.matchAll(/getElementById\(\s*['"]drill-hardstop['"]\s*\)/g)];
    ok(raw.length === 1,
       `⚠️ #drill-hardstop is looked up ${raw.length} times outside comments; it ` +
       `should be exactly once, inside _hideHardStopOverlay(). A hand-rolled ` +
       `removal elsewhere is a fourth site that Part A cannot see.`);
    ok(/function\s+_hideHardStopOverlay\s*\(\s*\)\s*\{/.test(src),
       '_hideHardStopOverlay() is defined');
    ok(/function\s+_showHardStopOverlay\s*\([^)]*\)\s*\{[\s\S]{0,200}?_hideHardStopOverlay\s*\(/.test(src),
       '_showHardStopOverlay() clears any previous overlay through the same helper');
}

console.log('\n─── C. THE OVERLAY STILL SHOWS THE CHARACTER IT WAS GIVEN ───');
{
    // ⚠️ Guards the fix against being "simplified" into never showing anything.
    ok(/_showHardStopOverlay\(\s*newExpected\s*\)/.test(src),
       'the overlay is still passed the CURRENT expected character');
    ok(/drillSequence\[drillPos\]/.test(src),
       'newExpected still derives from drillSequence[drillPos]');
}

console.log('\n─── D. ⚠️ THE PARENT IS STATIC MARKUP, WHICH IS WHY NOTHING TORE IT DOWN ───');
{
    const html = read('learn.html');
    ok(/id="drill-keyboard-wrap"/.test(html),
       '#drill-keyboard-wrap is static markup in learn.html — the overlay is ' +
       'appended to it, so it survives every drill regeneration and MUST be ' +
       'removed explicitly. If this ever stops being true, Part A can relax.');
}

console.log('\n─── E. ⚠️⚠️ game.js IS SAFE BY CIRCUMSTANCE, NOT BY CONSTRUCTION ───');
{
    // ⚠️ game.js HAS THE SAME ASYMMETRY AS THE DEFECT ABOVE: `isHardStop` is
    // cleared at three sites and only resumeGame() hides #modal — setupGame()
    // and startGame() do not. Round 58 traced every route into those two and
    // found the stale-modal case UNREACHABLE, so game.js was NOT changed: the
    // fix there would have been a change to shared modal plumbing in service of
    // a bug nobody can produce, and §0.-28.H is the round that acted on a twin's
    // assumed behaviour and was wrong.
    //
    // ⚠️⚠️ BUT IT IS UNREACHABLE FOR TWO REASONS THAT ARE EASY TO DELETE BY
    // ACCIDENT, AND NEITHER LOOKS LOad-BEARING WHERE IT SITS. If either goes,
    // Library acquires School's bug — a stale hard-stop modal over a fresh
    // chapter — and nothing else in the suite would notice.
    const g = decomment(read('game.js'));

    // 1. The hard-stop modal has NO action button. Every other modal's button
    //    runs modalActionCallback, and showStartModal() sets that to startGame
    //    with no closeModal() in front of it — so a visible button here is a
    //    direct route from "hard stop" to "new sprint, modal still up".
    ok(/function\s+triggerHardStop[\s\S]{0,4000}?btn\.style\.display\s*=\s*'none'/.test(g),
       '⚠️ triggerHardStop() no longer hides the action button — that button ' +
       'runs modalActionCallback, which showStartModal() sets to startGame ' +
       'WITHOUT closeModal(). Library now has ROADMAP 49.');

    // 2. The keystroke handler's isHardStop branch RETURNS unconditionally, so
    //    the smart-start path below it (which also fires modalActionCallback)
    //    cannot run while a hard stop is up.
    const m = /if\s*\(\s*isHardStop\s*\)\s*\{([\s\S]*?)\n\s{8}\}/.exec(g);
    ok(!!m, 'the isHardStop branch in the keystroke handler is readable');
    ok(!!m && /\breturn\s*;\s*$/.test(m[1].trimEnd()),
       '⚠️ the isHardStop branch no longer ends in an unconditional return — ' +
       'keystrokes now fall through to the smart-start path, which fires ' +
       'modalActionCallback and can start a game under the hard-stop modal.');
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
