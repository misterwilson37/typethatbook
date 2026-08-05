// Lifts the dot-placement maths out of adventure-renderer.js and compares it to
// the v1.1.0 formula, for the book sizes that actually exist in Jake's library.
//
// A dot marks the END of a chapter. So after finishing chapter k of n, the walked
// route should reach k/n of the way down. v1.1.0 used i/(n-1), which put dot 0 at
// the very top — so the first chapter drew a 14px stub and the last chapter drew
// the entire remaining span.
import { readFileSync } from 'fs';

const src = readFileSync('/home/claude/work/adventure-renderer.js', 'utf8');
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
