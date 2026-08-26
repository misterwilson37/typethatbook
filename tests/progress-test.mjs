// progress-test.mjs v1.1.0
//
// v1.1.0 — Lifts the NAMED chapterPositionOf() function (index.html v3.15.0+)
//          by walking its braces, instead of slicing a region between two
//          substring anchors. No assertion about behaviour changed.
//
// Lifts the chapter-position rule out of index.html and exercises it against
// the cases that were broken: a part-numbered book, a cache-stripped document,
// and a pre-v3.19.1 document with no `matter` on its chapters.
import { readFileSync } from 'fs';
import { chapterPositionOf } from '../chapter-position.js';

const s = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
// ⚠️ v1.1.0 — THIS NO LONGER SLICES A REGION, AND THAT IS THE POINT. index.html
// v3.15.0 extracted the math into a NAMED function, `chapterPositionOf()`,
// because ROADMAP 26's Continue-reading row needed the same number and copying
// it would have made a hand-maintained twin. The old anchor here sliced from
// `const denom = ` to `const pct = Math.min(100` and rebuilt a function out of
// the fragment — twice already that anchor had drifted onto unrelated code and
// failed while naming the wrong function. Extracting a whole named declaration
// is bounded by its own braces, so it cannot silently capture a neighbour.
//
// ⚠️ IT STILL READS THE LIVE FILE rather than importing. index.html is a page,
// not a module; there is nothing to import. The point of reading the real file
// is unchanged — a copy of the rule pasted into this harness would pass forever
// while the page drifted underneath it.
// ⚠️ v1.2.0 — IT IMPORTS NOW. index.html v3.15.0 moved the rule out to
// chapter-position.js, a real module, so this harness no longer lifts source
// text out of an HTML file at all — no substring anchor, no brace walking, no
// `new Function`. Two earlier versions of this file located the math by
// searching for a common substring and both drifted onto unrelated code and
// failed while naming the wrong function. An import cannot do that.
const calc = chapterPositionOf;

const part = n => 'chapter_' + n;
const heidi = {
  bodyChapters: 23, totalChapters: 27,
  chapters: [
    { id: part('0.1'), matter: 'front' }, { id: part('0.2'), matter: 'front' },
    ...Array.from({ length: 14 }, (_, k) => ({ id: part('1.' + String(k + 1).padStart(2, '0')), matter: 'body' })),
    ...Array.from({ length: 9 }, (_, k) => ({ id: part('2.' + String(k + 1).padStart(2, '0')), matter: 'body' })),
    { id: part('900.1'), matter: 'back' },
  ],
};
const aesop = {
  bodyChapters: 284, totalChapters: 290,
  chapters: [
    ...Array.from({ length: 284 }, (_, k) => ({ id: part(k + 1), matter: 'body' })),
    { id: part('900.1'), matter: 'back' },
  ],
};

const cases = [
  ['Heidi, on 1.01 (first body chapter)', heidi, { chapter: part('1.01') }, '1 / 23'],
  ['Heidi, on 2.09 (LAST body chapter)', heidi, { chapter: part('2.09') }, '23 / 23 = 100%'],
  ['Heidi, on 1.14 (end of part one)', heidi, { chapter: part('1.14') }, '14 / 23'],
  ['Heidi from CACHE (chapter list stripped)', { ...heidi, chapters: [] }, { chapter: part('2.09') }, 'degrades, no crash'],
  ['Aesop finished, new document', aesop, { chapter: part(284) }, '284 / 284 = 100%'],
  ['Pre-v3.19.1 doc (no bodyChapters, no list)', { bodyChapters: null, totalChapters: 290, chapters: [] }, { chapter: part(284) }, 'old behaviour, 290 denom'],
  ['Garbage progress value', heidi, { chapter: 'chapter_wat' }, 'clamps to 1, no NaN'],
  ['CACHED + game.js 3.10.0 bodyIndex', { ...heidi, chapters: [] }, { chapter: part('2.09'), bodyIndex: 23, bodyTotal: 23 }, '23 / 23 = 100% from cache'],
  ['CACHED + bodyIndex mid-book', { ...heidi, chapters: [] }, { chapter: part('1.14'), bodyIndex: 14, bodyTotal: 23 }, '14 / 23 from cache'],
];

console.log('case'.padEnd(44) + 'label shown'.padEnd(16) + 'pct'.padEnd(7) + 'expected');
console.log('-'.repeat(96));
for (const [name, book, prog, want] of cases) {
  const r = calc(book, prog);
  const label = 'Ch. ' + r.chapNum + ' / ' + r.denom;
  const bad = !Number.isFinite(r.pct) || !Number.isFinite(r.chapNum);
  console.log(name.padEnd(44) + label.padEnd(16) + (r.pct + '%').padEnd(7) + want + (bad ? '   ← FAIL (NaN)' : ''));
}

console.log('\nWhat v3.3.0 did with the same inputs, for contrast:');
for (const [name, book, prog] of cases.slice(0, 3)) {
  const old = parseInt(String(prog.chapter).replace('chapter_', ''));
  console.log('  ' + name.padEnd(44) + 'Ch. ' + old + ' / ' + book.totalChapters +
    '  (' + Math.min(100, Math.round((old / book.totalChapters) * 100)) + '%)');
}
