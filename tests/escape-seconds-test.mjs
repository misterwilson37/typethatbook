// escape-seconds-test.mjs v1.0.0 — Round 102.
//
// ⚠️⚠️ WHY THIS FILE EXISTS: `game-names.js` has carried `countsTime: true` for
// Escape Key since Round 82 — Jake's 4e ruling, *"I'm leaning toward arcade for
// now, but time typed should still count"* — and `game-escape.js` v1.0.0
// accepted no `onSecond` at all. The registry promised a thing the view had no
// way to deliver, and nothing anywhere went red, because **no harness had ever
// asked whether this view emits a second.**
//
// ⭐ THAT IS THE SAME FAILURE game-deadline.js SHIPPED, AND THE HANDOFF ALREADY
// NAMED IT: *"arcade-lesson-test.mjs pinned the PAGE's listener and stayed green
// for ten rounds while nothing emitted. A seam needs BOTH ends asserted."*
// Escape Key had neither end asserted. This file is the emitter end.
//
// ⚠️ IT IS DELIBERATELY A STRUCTURAL HARNESS, AND THAT IS A REAL LIMIT WORTH
// STATING: `game-escape.js` is a canvas view that needs a DOM, a
// requestAnimationFrame and a real GameDirector clock, none of which exist
// under node. So these assertions pin the SHAPE of the banking path — the
// properties whose absence caused the Deadline defect — not its behaviour. A
// browser is still the only thing that can prove a minute actually banks.
// ⚠️ DO NOT READ GREEN HERE AS "TIME BANKS". Read it as "the four mistakes
// Deadline made are not present."
//
// ⚠️⚠️ COMMENTS ARE STRIPPED BEFORE EVERY CHECK. HANDOFF's standing note counts
// five occasions when a harness read a COMMENT as code and went red against
// correct source. This file's own subject matter guarantees a sixth if it
// forgets: `game-escape.js` now contains long prose about the permanently-false
// guard `if (onSecond && started && !ended)`, and an unstripped search for that
// string would find the WARNING and fail the file it is protecting.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const stripComments = src => src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^[ \t]*\/\/.*$/gm, ' ')
    .replace(/([^:])\/\/.*$/gm, '$1');

const raw = readFileSync(new URL('../game-escape.js', import.meta.url), 'utf8');
const esc = stripComments(raw);
const names = stripComments(readFileSync(new URL('../game-names.js', import.meta.url), 'utf8'));

console.log('\n─── A. the registry still says time counts ───');

// ⚠️ THE PREMISE OF THE WHOLE FILE. If Jake ever rules that Escape Key's time
// should NOT count, this assertion is the one that should go red first, and the
// right response is to delete this harness rather than to weaken it.
{
    const block = names.slice(names.indexOf('escape:'), names.indexOf('deadline:'));
    ok(/countsTime:\s*true/.test(block),
       'game-names.js: escape still declares countsTime: true');
    ok(/assessed:\s*false/.test(block),
       'and assessed: false — this file is about the CLOCK, not the grade');
}

console.log('\n─── B. the view accepts and emits a per-second tick ───');

ok(/opts\.onSecond/.test(esc),
   '⭐ mount() reads opts.onSecond at all — v1.0.0 did not, which was the defect');
ok(/function bankWholeSeconds\(now\)/.test(esc),
   'the per-second bank is a named function rather than an inline loop');

console.log('\n─── C. it fires DURING play, not only at game over ───');

// ⚠️ A student watches the daily total move while they play; a tick that only
// lands at game over is not the feature. Deadline's banking loop lived only in
// finish() and Jake caught it by playing 35 seconds and watching zeros.
{
    const frame = esc.slice(esc.indexOf('function frame(ts)'),
                            esc.indexOf('function bankWholeSeconds'));
    ok(frame.length > 0, 'frame() appears before bankWholeSeconds() in the file');
    ok(/bankWholeSeconds\(now\)/.test(frame),
       '⭐ and the frame loop calls it, so the totals move while they play');
}

console.log('\n─── D. finish() banks the last part-second, in the right order ───');

// ⚠️⚠️ ORDERING IS THE FIX, NOT A LOOSER GUARD. d.end() stops the graded clock,
// so a catch-up after it reads a frozen figure; and a call placed after
// `ended = true` behind a `!ended` test is the exact bug Deadline shipped.
{
    const fin = esc.slice(esc.indexOf('function finish(now, won)'));
    const body = fin.slice(0, fin.indexOf('function restart()'));
    ok(body.indexOf('bankWholeSeconds(now)') >= 0,
       'finish() banks before it returns');
    ok(body.indexOf('bankWholeSeconds(now)') < body.indexOf('ended = true'),
       '⚠️⚠️ finish() banks the last part-second BEFORE it sets `ended`');
    ok(body.indexOf('bankWholeSeconds(now)') < body.indexOf('d.end(now)'),
       'and before the graded clock is stopped');
}

// ⚠️ THE PERMANENTLY-FALSE GUARD, BY NAME. Deadline's read
// `if (onSecond && started && !ended)` and sat three lines below `ended = true`.
// Escape Key must never grow it. ⚠️ THIS IS THE ASSERTION THAT NEEDS THE COMMENT
// STRIPPER MOST — the file explains this exact string at length.
ok(!/if \(onSecond && started && !ended\)/.test(esc),
   '⚠️⚠️ the permanently-false guard Deadline shipped is absent');

console.log('\n─── E. the count comes off the graded clock, not a private timer ───');

// ⚠️ A SECOND ACCUMULATOR DRIFTS FROM THE REPORTED FIGURE, and then a student's
// banked minutes disagree with the run they just played. It matters more here
// than in Deadline: frame()'s `dt` is CLAMPED to 50ms for the enemy stepper, so
// accumulating from dt would silently under-bank every hidden tab.
{
    const bank = esc.slice(esc.indexOf('function bankWholeSeconds'));
    const head = bank.slice(0, 400);
    ok(/d\.clock\.seconds\(now\)/.test(head),
       'the tick count comes off d.clock.seconds(), not a private accumulator');
    ok(!/stepAccMs|tickAcc|\bdt\b/.test(head),
       '⚠️ and not off dt or either of this file\'s other accumulators');
    ok(/while \(secondsBanked < whole\)/.test(bank),
       '⚠️ a WHILE loop — a hidden tab hands back many whole seconds at once, ' +
       'and each is a separate second the host stamps with its own date');
    ok(/!started/.test(head),
       'no tick before the run has started');
    ok(/try \{[\s\S]{0,80}onSecond\(\)/.test(bank),
       'a host error in the callback can never stop play');
}

console.log('\n─── F. the high-water mark resets with the director ───');

// ⚠️⚠️ restart() BUILDS A FRESH GameDirector, so the clock returns to zero. A
// `secondsBanked` left at 35 would swallow the first 35 seconds of every
// replay — invisible, and only reachable once the tick fires at all.
{
    const res = esc.slice(esc.indexOf('function restart()'));
    ok(/secondsBanked = 0/.test(res.slice(0, 900)),
       '⚠️ restart() resets secondsBanked, or the replay loses its opening seconds');
}

console.log('\n─── G. the view still owns no numbers and no dates ───');

// ⚠️ THE SPLIT THIS FILE'S HEADER DECLARES: game-shell.js owns the numbers,
// escape-board.js owns the rules, game-escape.js owns the pixels. A date here
// would mean a game crossing midnight files every second under the day it
// STARTED, which is the bug the bare-tick contract exists to prevent.
ok(!/localDateStr|toISOString|new Date\(/.test(esc),
   '⚠️⚠️ the view stamps no date — the host does, inside the callback');

// ⚠️ AND THE DOC COMMENT MUST NOT CLAIM A CONTRACT IT DOES NOT HAVE. v1.0.0's
// said "same contract as game-deadline", which was false and is how the missing
// tick stayed invisible for a reader. Checked against the RAW source, because
// this is the one assertion whose subject IS the comment.
ok(!/same contract as game-deadline/.test(raw),
   '⚠️ the false "same contract as game-deadline" claim is gone');
ok(/GAME_ESCAPE_VERSION = '1\.[1-9]/.test(esc) || /GAME_ESCAPE_VERSION = '[2-9]/.test(esc),
   'and the file is versioned past 1.0.0, where none of this existed');

console.log(fail
    ? `\nescape-seconds-test: ${pass} passed, ${fail} FAILED`
    : `\nescape-seconds-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
