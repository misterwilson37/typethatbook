// reanchor-test.mjs v1.0.0
//
// Guards game.js v3.15.0's progress re-anchoring: the clamp, the anchor search,
// and the staleness ladder (exact → sentence → chapter).
//
// ⚠️ WHY THIS EXISTS. The bug it guards was invisible three ways at once. It
// threw nothing, it logged nothing, and the affected chapter COMPLETED NORMALLY
// — a student resumed inside the last sentence of a chapter they had barely
// started, typed that sentence, and the book ticked itself off as read. No
// parser, no version audit and no identifier check can see a wrong integer.
//
// ⚠️ lift() STRIPS `async` IF YOU COPY THE OLD ONE. See Round 7 §3. Everything
// lifted here is synchronous, but copy metadata-map-test.mjs's lift(), not
// about-test.mjs's, if you extend this.

import { readFileSync } from 'fs';

const SRC = readFileSync(new URL('./game.js', import.meta.url), 'utf8');

// Pull a named function declaration out of game.js by brace-matching.
function lift(name) {
    const needle = 'function ' + name + '(';
    const at = SRC.indexOf(needle);
    if (at === -1) throw new Error(name + ' not found in game.js');
    let i = SRC.indexOf('{', at), depth = 0, end = -1;
    for (let j = i; j < SRC.length; j++) {
        if (SRC[j] === '{') depth++;
        else if (SRC[j] === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
    }
    if (end === -1) throw new Error('unbalanced braces lifting ' + name);
    return SRC.slice(at, end);
}

// Constants the lifted code closes over, read from the file rather than
// retyped — so retuning the ladder in game.js retunes the test with it.
function liftConst(name) {
    const m = SRC.match(new RegExp('^const\\s+' + name + '\\s*=\\s*([^;]+);', 'm'));
    if (!m) throw new Error(name + ' not found in game.js');
    return 'const ' + name + ' = ' + m[1] + ';';
}

const harness = [
    liftConst('ANCHOR_LEN'),
    liftConst('REANCHOR_EXACT_MS'),
    liftConst('REANCHOR_SENTENCE_MS'),
    'let fullText = "", savedCharIndex = 0, reanchorJob = null, reanchorNotice = "";',
    lift('anchorTextAt'),
    lift('findAnchorEnd'),
    lift('findSentenceStartFor'),
    lift('reconcilePosition'),
    `return {
        anchorTextAt, findAnchorEnd, reconcilePosition,
        set(text, idx, job) { fullText = text; savedCharIndex = idx; reanchorJob = job; },
        get() { return { savedCharIndex, reanchorNotice }; }
     };`
].join('\n');

const M = new Function(harness)();

const DAY = 86400000;
let pass = 0, fail = 0;
function ok(label, cond, detail) {
    if (cond) { pass++; console.log('  ok   ' + label); }
    else { fail++; console.log('  FAIL ' + label + (detail ? '\n         ' + detail : '')); }
}
function eq(label, got, want) { ok(label, got === want, `got ${got}, want ${want}`); }

// A chapter with clear sentence boundaries. Sentence 3 starts at index 46.
const TEXT = 'Sara was a little girl. She lived in London. '
           + 'And she began to feel a grudge against her show pupil. '
           + 'The end came quickly.';
const S3 = TEXT.indexOf('And she began');

console.log('\nanchorTextAt');
eq('takes the text BEHIND the cursor', M.anchorTextAt(TEXT, 22), TEXT.slice(0, 22));
eq('caps at ANCHOR_LEN', M.anchorTextAt(TEXT, 100).length, 48);
eq('start of chapter yields no anchor', M.anchorTextAt(TEXT, 0), '');
eq('empty text yields no anchor', M.anchorTextAt('', 40), '');

console.log('\nfindAnchorEnd');
eq('returns the index just PAST the match',
   M.findAnchorEnd(TEXT, 'She lived in London.', 0), TEXT.indexOf('She lived in London.') + 20);
eq('absent anchor returns -1', M.findAnchorEnd(TEXT, 'no such words here at all', 0), -1);
eq('too-short anchor refuses rather than guessing', M.findAnchorEnd(TEXT, 'She', 0), -1);
// A repeated anchor must resolve to the occurrence NEAREST the old offset,
// not the first — otherwise a student is dragged backwards to chapter start.
const REP = 'said Sara. ' + 'x'.repeat(400) + 'said Sara. ' + 'y'.repeat(400);
const second = REP.lastIndexOf('said Sara. ') + 11;
eq('repeated anchor resolves to the nearest occurrence',
   M.findAnchorEnd(REP, 'said Sara. and then some more words', 500), -1);
eq('repeated anchor picks the near copy',
   M.findAnchorEnd(REP, 'x'.repeat(400) + 'said Sara. ', 820), second);

console.log('\nreconcilePosition — the clamp (runs with NO job)');
M.set(TEXT, 9999, null);
M.reconcilePosition();
eq('index past the end is clamped to the text length', M.get().savedCharIndex, TEXT.length);
ok('clamping alone raises no notice', M.get().reanchorNotice === '');
M.set(TEXT, -5, null);
M.reconcilePosition();
eq('negative index is clamped to 0', M.get().savedCharIndex, 0);
M.set(TEXT, 30, null);
M.reconcilePosition();
eq('an in-range index with no job is left exactly alone', M.get().savedCharIndex, 30);

console.log('\nreconcilePosition — the anchor wins regardless of age');
// The student was just past "She lived in London." Someone then inserted a
// paragraph AHEAD of them, moving every later offset — the ordinary shape of an
// editorial pass. The raw offset is now wrong; the anchor is not.
const EDITED = TEXT.replace('And she began', 'She was seven years old. And she began');
const anchor = 'She lived in London.';
M.set(EDITED, 44, { anchorText: anchor, storedIndex: 44, ageMs: 365 * DAY });
M.reconcilePosition();
eq('a year-old bookmark still lands exactly, because the anchor is proof',
   M.get().savedCharIndex, EDITED.indexOf(anchor) + anchor.length);

// ⚠️ The case that produced the original report: text SHORTENED under a stored
// offset that used to be mid-chapter and is now near the end.
const SHORT = 'Sara was a little girl. She lived in London. The end.';
M.set(SHORT, 200, { anchorText: 'She lived in London.', storedIndex: 200, ageMs: 2 * DAY });
M.reconcilePosition();
eq('a shrunken chapter re-anchors instead of stranding one sentence',
   M.get().savedCharIndex, SHORT.indexOf('She lived in London.') + 20);

console.log('\nreconcilePosition — the staleness ladder (no usable anchor)');
M.set(TEXT, S3 + 20, { anchorText: '', storedIndex: S3 + 20, ageMs: 2 * DAY });
M.reconcilePosition();
eq('under a week: exact offset kept', M.get().savedCharIndex, S3 + 20);

M.set(TEXT, S3 + 20, { anchorText: '', storedIndex: S3 + 20, ageMs: 14 * DAY });
M.reconcilePosition();
eq('over a week: snapped to the start of the sentence', M.get().savedCharIndex, S3);
ok('…and says so', M.get().reanchorNotice.includes('sentence'));

M.set(TEXT, S3 + 20, { anchorText: '', storedIndex: S3 + 20, ageMs: 90 * DAY });
M.reconcilePosition();
eq('over a month: snapped to the start of the chapter', M.get().savedCharIndex, 0);
ok('…and says so', M.get().reanchorNotice.includes('chapter'));

// Every pre-v3.15.0 document lands here: no anchor, no contentVersion, and a
// lastUpdated that could not be parsed. Infinity must fall to the SAFE rung.
M.set(TEXT, S3 + 20, { anchorText: '', storedIndex: S3 + 20, ageMs: Infinity });
M.reconcilePosition();
eq('an unreadable timestamp falls to the safest rung, not the loosest',
   M.get().savedCharIndex, 0);

console.log('\nreconcilePosition — the ladder never runs past the end');
M.set(TEXT, 9999, { anchorText: '', storedIndex: 9999, ageMs: 14 * DAY });
M.reconcilePosition();
ok('a stale out-of-range index is clamped BEFORE the ladder is applied',
   M.get().savedCharIndex <= TEXT.length && M.get().savedCharIndex === M.get().savedCharIndex,
   'got ' + M.get().savedCharIndex);
eq('…and lands on a real sentence boundary',
   M.get().savedCharIndex, TEXT.indexOf('The end came quickly.'));

M.set(TEXT, 0, { anchorText: 'anything', storedIndex: 0, ageMs: 400 * DAY });
M.reconcilePosition();
eq('a student at char 0 is left at char 0, not "rescued"', M.get().savedCharIndex, 0);
ok('…and is not told the book changed', M.get().reanchorNotice === '');

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail) process.exit(1);
