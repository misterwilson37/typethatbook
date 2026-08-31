// drill-paint-test.mjs v1.0.0 — ⚠️⚠️ EVERY MUTATION OF drillPos IS FOLLOWED BY A PAINT.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-08-29: *"the space bar will highlight instead of the following
// letter regularly enough to notice... the two dots appeared on the space bar
// when the game expected the first letter of the following word."* Kids reported
// it and photographed it. ROADMAP 31.
//
// The idle-resume space skip in `handleDrillKey()` advanced `drillPos` past a
// space and returned to the caller without repainting. `advanceHandGuide()` is
// the ONLY function that moves the target highlight, the hand guide and
// `#space-hint`, and nothing on that path called it — so the keyboard was still
// painted for the character the code had just skipped. The two dots are the
// thumb circles `setHandGuideToChar()` left on the space bar.
//
// ⚠️⚠️ AND THE PAINTER WAS NOT WRONG. `advanceHandGuide()` clears `space-active`
// under a deliberate guard — `if (ch !== ' ')`, *"Clear space-active only when
// moving away from a space, not when landing on one."* That guard is correct.
// The defect was a mutation that did not call the painter. **Anyone tempted to
// "fix" this by loosening the guard in advanceHandGuide() should read this
// paragraph twice** — it would clear the cue on the frame a student lands on a
// space, which is the one frame the cue exists for.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THIS HARNESS ASSERTS THE INVARIANT, NOT THE CALL SITE — AND THAT IS THE
// WHOLE POINT OF WRITING IT AT ALL.
// ═══════════════════════════════════════════════════════════════════════════
//
// A test that greps for one `advanceHandGuide()` call after the idle skip passes
// forever and catches nothing. This is the THIRD position/paint divergence in
// this file's history, so the thing worth guarding is the class, not the
// instance: **every statement that moves `drillPos` is followed, before the
// function can return to the event loop, by something that repaints.**
//
// ⚠️ WHAT COUNTS AS A PAINT, AND WHY THE LIST IS BROAD ON PURPOSE:
//   * `advanceHandGuide()` — moves the keyboard target and the hand guide
//   * `renderDrillText()`  — repaints the text, and is always paired with one of
//                            the above or with a terminal call
//   * `finishStep()` / `beginStep()` — the run is over or restarting; the whole
//                            surface is rebuilt and the old paint is discarded
// A mutation followed by any of those is fine. A mutation followed by NONE of
// them before the enclosing block ends is the defect.
//
// ⚠️ STRUCTURE, NOT DISTANCE — ROADMAP § CONVENTIONS. The scan brace-matches
// `handleDrillKey()` and then walks statements; it does not count characters or
// lines between a mutation and a call, because a "within N lines" check is a
// distance check wearing a structure check's label and open-unit-test.mjs
// already had to be rewritten once for exactly that.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const src = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');

// ── brace-match the function we care about ───────────────────────────────────
function bodyOf(text, signature) {
    const at = text.indexOf(signature);
    if (at < 0) return null;
    const open = text.indexOf('{', at);
    if (open < 0) return null;
    let depth = 0, inLine = false, inBlock = false, inStr = null;
    for (let i = open; i < text.length; i++) {
        const c = text[i], n = text[i + 1];
        if (inLine)  { if (c === '\n') inLine = false; continue; }
        if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
        if (inStr)   { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
        if (c === '/' && n === '/') { inLine = true; i++; continue; }
        if (c === '/' && n === '*') { inBlock = true; i++; continue; }
        if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) return text.slice(open, i + 1); }
    }
    return null;
}

// Comments carry example code and prose about drillPos; strip them so the scan
// reads statements rather than explanations of statements.
function stripComments(text) {
    let out = '', inLine = false, inBlock = false, inStr = null;
    for (let i = 0; i < text.length; i++) {
        const c = text[i], n = text[i + 1];
        if (inLine)  { if (c === '\n') { inLine = false; out += c; } continue; }
        if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
        if (inStr)   { out += c; if (c === '\\') { out += text[++i]; continue; } if (c === inStr) inStr = null; continue; }
        if (c === '/' && n === '/') { inLine = true; i++; continue; }
        if (c === '/' && n === '*') { inBlock = true; i++; continue; }
        if (c === '"' || c === "'" || c === '`') { inStr = c; out += c; continue; }
        out += c;
    }
    return out;
}

console.log('--- A. THE FUNCTION IS STILL THERE AND STILL SHAPED LIKE THIS ---');
const raw = bodyOf(src, 'function handleDrillKey');
ok(raw !== null,
   '⚠️ A1 handleDrillKey() is brace-matchable. If this fails the function was ' +
   'renamed or restructured and THIS HARNESS IS NOW BLIND — fix the signature ' +
   'here in the same edit, do not delete the check');

const body = raw ? stripComments(raw) : '';

const MUTATION = /\bdrillPos\s*(?:\+\+|--|\+=|-=|=(?!=))/g;
const mutations = body ? [...body.matchAll(MUTATION)] : [];
ok(mutations.length >= 4,
   `A2 the scan finds the drillPos mutations (${mutations.length} found; the ` +
   `hard-stop advance, the backspace step-back, the idle space skip and the ` +
   `correct-key advance are the four that must exist)`);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- B. ⚠️⚠️ EVERY drillPos MUTATION IS FOLLOWED BY A PAINT ---');

const PAINTERS = ['advanceHandGuide(', 'renderDrillText(', 'finishStep(', 'beginStep('];

// For each mutation, look forward to the end of the enclosing block and ask
// whether a painter is reached. The enclosing block ends at the `}` that closes
// the depth the mutation sits at.
function paintedAfter(text, from) {
    let depth = 0;
    for (let i = from; i < text.length; i++) {
        const c = text[i];
        if (c === '{') depth++;
        else if (c === '}') { if (depth === 0) return { painted: false, end: i }; depth--; }
        // ⚠️⚠️ ONLY AT depth 0 RELATIVE TO THE MUTATION, AND THIS IS THE LINE
        // THAT MAKES PART B WORTH ANYTHING. A painter inside a NESTED block is
        // on a branch — typically a `{ finishStep(); return; }` guard clause —
        // and a branch that returns cannot paint the path that falls through.
        // Counting it was how the first draft of this harness passed against the
        // real ROADMAP 31 defect: the idle skip's `if (drillPos >= length) {
        // finishStep(); return; }` sat between the mutation and the end of the
        // block, and a depth-blind scan read it as "painted".
        if (depth === 0) {
            for (const p of PAINTERS) {
                if (text.startsWith(p, i)) return { painted: true, end: i };
            }
        }
    }
    return { painted: false, end: text.length };
}

const unpainted = [];
for (const m of mutations) {
    const from = m.index + m[0].length;
    const { painted } = paintedAfter(body, from);
    if (!painted) {
        const ctx = body.slice(Math.max(0, m.index - 90), m.index + 60)
                        .replace(/\s+/g, ' ').trim();
        unpainted.push('…' + ctx + '…');
    }
}

ok(unpainted.length === 0,
   '⚠️⚠️ B1 A drillPos MUTATION REACHES THE END OF ITS BLOCK WITHOUT A PAINT. ' +
   'Unpainted: ' + (unpainted.slice(0, 3).join('  ||  ') || 'none') +
   (unpainted.length > 3 ? ` (+${unpainted.length - 3} more)` : '') +
   ' — this is ROADMAP 31 exactly: the position moved and the keyboard did not, ' +
   'so a child is shown a target the game has already passed. Add a painter ' +
   'before the block ends; do NOT loosen the space guard inside advanceHandGuide()');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- C. THE IDLE SPACE SKIP SPECIFICALLY (the reported defect) ---');

const skipBlock = (() => {
    const at = body.indexOf('wasIdle');
    if (at < 0) return null;
    const open = body.indexOf('{', body.indexOf('if (wasIdle', at));
    if (open < 0) return null;
    let depth = 0;
    for (let i = open; i < body.length; i++) {
        if (body[i] === '{') depth++;
        else if (body[i] === '}') { depth--; if (depth === 0) return body.slice(open, i + 1); }
    }
    return null;
})();

ok(skipBlock !== null, 'C1 the idle-resume space-skip block is present');
ok(skipBlock ? skipBlock.includes('advanceHandGuide(') : false,
   '⚠️⚠️ C2 THE IDLE SPACE SKIP REPAINTS. This is the exact defect Jake\u2019s ' +
   'students photographed — drillPos moved past the space and the space bar kept ' +
   'its two thumb circles while the next letter was expected');
ok(skipBlock ? /posBeforeSkip|drillPos\s*!==/.test(skipBlock) : false,
   '⚠️ C3 THE REPAINT IS GUARDED ON THE POSITION HAVING MOVED, not on wasIdle. ' +
   'A repaint at an unchanged position is a no-op today and a flicker the first ' +
   'time the highlight gets a transition');
ok(skipBlock ? skipBlock.indexOf('finishStep(') < skipBlock.indexOf('advanceHandGuide(') : false,
   '⚠️ C4 THE END-OF-RUN RETURN STILL COMES FIRST. Painting a position past the ' +
   'end of drillSequence is what advanceHandGuide()\u2019s own first line guards ' +
   'against; reaching it at all would mean the run ended and nobody noticed');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- D. THE PAINTER\u2019S SPACE GUARD IS INTACT ---');
const guideBody = bodyOf(src, 'function advanceHandGuide');
ok(guideBody !== null, 'D1 advanceHandGuide() is brace-matchable');
ok(guideBody ? /if\s*\(\s*ch\s*!==\s*' '\s*\)/.test(guideBody) : false,
   '⚠️⚠️ D2 space-active IS STILL CLEARED ONLY WHEN MOVING AWAY FROM A SPACE. ' +
   'ROADMAP 31 was NOT a bug in this function and must not be "fixed" here — ' +
   'clearing unconditionally would kill the space cue on the one frame it exists ' +
   'for, which is the frame the student is being asked to press it');

console.log('');
if (fail === 0) console.log(`PASS - ${pass} passing, 0 failing`);
else            console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
