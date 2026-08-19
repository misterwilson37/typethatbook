// variety-floor-test.mjs v1.0.0
//
// v1.0.0 — the fifth shared module gets its own harness, imported for real —
//          same reasoning as hud-test.mjs: variety-floor.js is DOM-free and
//          pure, which is what makes a direct import possible instead of
//          lifting the function out of game.js/learn.js by brace-matching.
//
// This is the filter behind both game.js's ✨ AI-practice button and
// learn.js's 🎲 "Practice missed keys" button: require several DIFFERENT
// missed characters, not just one missed a lot, before either unlocks.
// game.js's `_qualifyingPracticeChars()` and learn.js's
// `_qualifyingRemediationChars()` are now one-line wrappers around this —
// see session-merge-test.mjs or the two files' own headers for that half.
// This harness only has to prove the filter itself is right; that both
// wrappers call it correctly is unchanged, existing behavior, not retested
// here.

import { qualifyingChars, hasVarietyFloor, VARIETY_FLOOR_VERSION } from './variety-floor.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };

console.log('\n─── A. qualifyingChars ───');
ok(VARIETY_FLOOR_VERSION === '1.0.0', `variety-floor.js reports v1.0.0 (got ${VARIETY_FLOOR_VERSION})`);

ok(qualifyingChars({}, 3).length === 0, 'an empty map qualifies nothing');
ok(qualifyingChars(null, 3).length === 0, 'a null map degrades to nothing qualifying, not a throw');
ok(qualifyingChars(undefined, 3).length === 0, 'an undefined map degrades to nothing qualifying, not a throw');

{
    // Jake's original bug report, in the module's own terms: F missed a lot,
    // J missed once. Only F clears a threshold of 3.
    const q = qualifyingChars({ f: 12, j: 1 }, 3);
    ok(q.length === 1 && q[0][0] === 'f' && q[0][1] === 12,
       'below-threshold characters are excluded even when one dominant one qualifies');
}

{
    const q = qualifyingChars({ a: 3, b: 3, c: 3 }, 3);
    ok(q.length === 3, 'exactly-at-threshold counts as qualifying, not "must exceed"');
}

{
    const q = qualifyingChars({ a: 2, b: 3 }, 3);
    ok(q.length === 1 && q[0][0] === 'b', 'one below threshold, one at threshold: only the qualifying one returns');
}

{
    const q = qualifyingChars({ a: 5, b: 9, c: 3, d: 20 }, 3);
    ok(q.map(([ch]) => ch).join('') === 'dbac',
       `worst-missed-first ordering (got ${q.map(([ch]) => ch).join('')}, want dbac)`);
}

console.log('\n─── B. hasVarietyFloor ───');
ok(hasVarietyFloor({ f: 12 }, 3, 3) === false,
   'one qualifying character never clears a floor of 3 — the exact bug this exists to prevent');
ok(hasVarietyFloor({ a: 3, b: 3, c: 3 }, 3, 3) === true,
   'exactly 3 qualifying characters clears a floor of 3');
ok(hasVarietyFloor({ a: 3, b: 3 }, 3, 3) === false,
   '2 qualifying characters does not clear a floor of 3');
ok(hasVarietyFloor({ a: 5, b: 5, c: 1, d: 5 }, 3, 3) === true,
   'extra non-qualifying characters present alongside enough qualifying ones still clears the floor');
ok(hasVarietyFloor({}, 3, 3) === false, 'an empty map never clears any positive floor');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
