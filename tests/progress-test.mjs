// Lifts the patched progress block out of index.html and exercises it against
// the cases that were broken: a part-numbered book, a cache-stripped document,
// and a pre-v3.19.1 document with no `matter` on its chapters.
import { readFileSync } from 'fs';

const s = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
// ⚠️ ANCHOR ON THE PROGRESS BLOCK, NOT ON `const denom`. This used to slice from
// the first `const denom = ` in the whole file. index.html v3.8.0 added a sort
// comparator with its own denominator earlier in the file, and this harness
// silently sliced a region hundreds of lines wide, then failed with a
// SyntaxError naming a function it does not test. A harness that locates code by
// a common substring is one unrelated edit away from testing something else and
// blaming the wrong author.
const anchor = s.indexOf('const progress = userProgress[book.id];');
if (anchor < 0) throw new Error('progress-test: could not find the progress block in index.html');
const i = s.indexOf('const denom = ', anchor);
const j = s.indexOf('const pct = Math.min(100', i);
if (i < 0 || j < 0) throw new Error('progress-test: the progress block no longer has the expected shape');
// The slice opens `if (progress && denom > 0) {` and the closing brace is past
// our end point, so drop that guard — the test always supplies progress.
const body = s.slice(i, j).replace('if (progress && denom > 0) {', '') +
  '\n  return { chapNum, denom, pct: Math.min(100, Math.round((chapNum / denom) * 100)) };';
const calc = new Function('book', 'progress', body);

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
