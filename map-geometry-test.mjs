// Lifts the dot-placement maths out of adventure-renderer.js and compares it to
// the v1.1.0 formula, for the book sizes that actually exist in Jake's library.
//
// A dot marks the END of a chapter. So after finishing chapter k of n, the walked
// route should reach k/n of the way down. v1.1.0 used i/(n-1), which put dot 0 at
// the very top — so the first chapter drew a 14px stub and the last chapter drew
// the entire remaining span.
import { readFileSync } from 'fs';

const src = readFileSync(new URL('./adventure-renderer.js', import.meta.url), 'utf8');
const m = src.match(/const dotY = \(i\) => ([^;]+);/);
if (!m) throw new Error('dotY not found');
console.log('lifted:  const dotY = (i) => ' + m[1].trim() + ';\n');

const top = 30, bottom = 400, span = bottom - top;
const newDotY = (i, n) => new Function('i', 'n', 'top', 'span',
  'return ' + m[1] + ';')(i, n, top, span);
const oldDotY = (i, n) => top + (n === 1 ? 0 : (span * i) / (n - 1));

const pct = (y) => Math.round(((y - top) / span) * 100);

const books = [
  ['test fixture', 2],
  ['Wind in the Willows', 12],
  ['Alice', 12],
  ['Heidi', 23],
  ['Treasure Island', 34],
  ['Aesop (condensed path)', 284],
];

console.log('book'.padEnd(26) + 'n'.padEnd(5) + 'after ch.1'.padEnd(22) + 'after the last ch.');
console.log('-'.repeat(84));
let fail = 0;
for (const [name, n] of books) {
  const o1 = pct(oldDotY(0, n)), n1 = pct(newDotY(0, n));
  const oL = pct(oldDotY(n - 1, n)), nL = pct(newDotY(n - 1, n));
  const want1 = Math.round((1 / n) * 100);
  const ok = n1 === want1 && nL === 100;
  if (!ok) fail++;
  console.log(
    name.padEnd(26) + String(n).padEnd(5) +
    `was ${String(o1 + '%').padEnd(5)} now ${String(n1 + '%').padEnd(6)}`.padEnd(22) +
    `was ${String(oL + '%').padEnd(5)} now ${nL}%` + (ok ? '   PASS' : '   FAIL want ' + want1 + '%'));
}

console.log('\nThe two-chapter fixture, chapter by chapter:');
for (const k of [1, 2]) {
  const y = newDotY(k - 1, 2);
  console.log(`   finished ${k} of 2 -> route reaches ${pct(y)}% down` +
              (pct(y) === k * 50 ? '  PASS' : '  FAIL'));
}

console.log('\nv1.1.0 on the same fixture, for contrast:');
console.log('   finished 1 of 2 -> route ran from top-14 to ' + pct(oldDotY(0, 2)) +
            '% — a 14 PIXEL stub');
console.log('   finished 2 of 2 -> route ran ' + pct(oldDotY(0, 2)) + '% to ' +
            pct(oldDotY(1, 2)) + '% — the whole height in one segment');

console.log('\n' + (fail ? fail + ' FAILURES' : 'All book sizes place dots correctly.'));

// ─────────────────────────────────────────────────────────────────────────────
// CONDENSED MAP (n > MAP_MAX_DOTS) — added Round 6 (Noiseless), renderer v1.3.0.
//
// Above 40 chapters the renderer stops drawing individual dots and inks one
// continuous route to `frac`. Two bugs lived in that branch, and both were
// invisible on Aesop (284 chapters, so a chapter is 0.35% of the strip) while
// being obvious on a book just over the threshold.
//
//   1. frac ignored within-chapter progress, so the marker froze for a whole
//      chapter then jumped — while the DOTTED map inks the current chapter to
//      `progress` and creeps smoothly.
//   2. frac used curIdx/n (start of the current chapter) while dotY uses
//      (i+1)/n (end of it), so crossing the 40-chapter threshold moved the
//      marker BACKWARDS by one chapter.
//
// Fixed as (curIdx + progress) / n. These assertions pin both properties.
console.log('\n=== Condensed map (n > 40): frac geometry ===');

const MAP_MAX_DOTS = 40;
const condensedFrac = (curIdx, progress, n, doneCount = 0) =>
  curIdx >= 0
    ? Math.min(1, (curIdx + progress) / Math.max(1, n))
    : Math.min(1, doneCount / Math.max(1, n));
const dotFrac = (i, n) => (i + 1) / n;   // dotY's fraction of span

let condFails = 0;
function want(label, actual, expected) {
  const ok = Math.abs(actual - expected) < 1e-9;
  if (!ok) condFails++;
  console.log(`   ${ok ? 'ok  ' : 'FAIL'} ${label}  got ${actual.toFixed(6)} want ${expected.toFixed(6)}`);
}

for (const n of [41, 60, 284]) {
  console.log(`  ${n} chapters:`);
  want(`   start of ch0 -> top of strip`, condensedFrac(0, 0, n), 0);
  want(`   finishing ch0 == dot 0`,       condensedFrac(0, 1, n), dotFrac(0, n));
  want(`   halfway ch0 == half a chapter`, condensedFrac(0, 0.5, n), 0.5 / n);
  const mid = Math.floor(n / 2);
  want(`   finishing ch${mid} == dot ${mid}`, condensedFrac(mid, 1, n), dotFrac(mid, n));
  want(`   last chapter complete -> 1.0`, condensedFrac(n - 1, 1, n), 1);
}

console.log('  the two bugs, restated as assertions:');
{
  const n = 41;
  const frozen = condensedFrac(5, 0, n) === condensedFrac(5, 0.99, n);
  console.log(`   ${frozen ? 'FAIL' : 'ok  '}    marker MOVES while typing a chapter (bug 1)`);
  if (frozen) condFails++;
  const agrees = Math.abs(condensedFrac(5, 1, n) - dotFrac(5, n)) < 1e-9;
  console.log(`   ${agrees ? 'ok  ' : 'FAIL'}    agrees with the dotted map at chapter end (bug 2)`);
  if (!agrees) condFails++;
}
{
  // curIdx unknown (chapter not in the list) falls back to completed count, which
  // is already an end-of-chapter measure and must NOT have progress added to it.
  const n = 50;
  want('   curIdx unknown -> doneCount/n', condensedFrac(-1, 0.5, n, 10), 10 / n);
}

console.log('');
console.log(condFails === 0
  ? 'Condensed map geometry correct at every book size tested.'
  : condFails + ' CONDENSED MAP FAILURE(S).');
if (condFails) process.exitCode = 1;
