// Lifts chapterKey(), bodyChapterList() and bodyOrdinalMap() out of game.js and
// checks them against a part-numbered book, a plain book, and a legacy document
// with no `matter` field at all — the case where getting the fallback wrong would
// be worse than the original bug.
import { readFileSync } from 'fs';

const SRC = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
function lift(name) {
  const start = SRC.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(name + ' not found');
  let depth = 0;
  for (let j = SRC.indexOf('{', start); j < SRC.length; j++) {
    if (SRC[j] === '{') depth++;
    else if (SRC[j] === '}') { depth--; if (depth === 0) return SRC.slice(start, j + 1); }
  }
}
const make = new Function('bookMetadata',
  lift('chapterKey') + lift('bodyChapterList') + lift('bodyOrdinalMap') +
  'return { chapterKey, bodyChapterList, bodyOrdinalMap };');

const ch = (id, matter) => matter ? { id: 'chapter_' + id, matter } : { id: 'chapter_' + id };

// Heidi as admin.js v3.19.1 writes it: matter on every entry.
const modern = { chapters: [
  ch('0.1', 'front'), ch('0.2', 'front'),
  ...Array.from({ length: 14 }, (_, k) => ch('1.' + String(k + 1).padStart(2, '0'), 'body')),
  ...Array.from({ length: 9 }, (_, k) => ch('2.' + String(k + 1).padStart(2, '0'), 'body')),
  ch('900.1', 'back'),
]};
// The SAME book from a pre-v3.19.1 document: no matter field anywhere.
const legacy = { chapters: modern.chapters.map(c => ({ id: c.id })) };
// A plain novel, front matter, no parts.
const plain = { chapters: [
  ch('0.1', 'front'),
  ...Array.from({ length: 12 }, (_, k) => ch(k + 1, 'body')),
  ch('900.1', 'back'),
]};

function report(label, meta, probes) {
  const F = make(meta);
  const list = F.bodyChapterList();
  const m = F.bodyOrdinalMap();
  console.log('\n' + label);
  console.log('   body chapters: ' + list.length +
    '   (of ' + meta.chapters.length + ' entries)');
  for (const [id, want] of probes) {
    const got = m.get(F.chapterKey(id));
    const old = parseInt(String(id).replace('chapter_', '')) || 0;
    const ok = String(got) === String(want);
    console.log('   ' + String(id).padEnd(12) +
      'ordinal ' + String(got === undefined ? '—' : got).padEnd(5) +
      'want ' + String(want).padEnd(5) +
      (ok ? 'PASS' : 'FAIL') +
      '    v3.9.x parseInt gave ' + old);
  }
}

report('Heidi, admin.js v3.19.1 document (matter present)', modern, [
  ['1.01', 1], ['1.14', 14], ['2.01', 15], ['2.09', 23],
  ['0.1', undefined], ['900.1', undefined],
]);
report('Heidi, LEGACY document (no matter field \u2014 falls back to id shape)', legacy, [
  ['1.01', 1], ['1.14', 14], ['2.09', 23],
  ['0.1', undefined], ['900.1', undefined],
]);
report('Plain novel, no parts \u2014 ordinals must equal the ids', plain, [
  ['1', 1], ['7', 7], ['12', 12], ['0.1', undefined],
]);

// The bug that mattered most: isCurrent used to be true for a whole part.
const F = make(modern);
const m = F.bodyOrdinalMap();
const cur = m.get('1.14');
const alsoCurrentNow = modern.chapters.filter(c => m.get(F.chapterKey(c.id)) === cur).length;
const alsoCurrentBefore = modern.chapters.filter(c =>
  (parseInt(F.chapterKey(c.id)) || 0) === (parseInt('1.14') || 0)).length;
console.log('\nReading Heidi chapter 1.14 \u2014 how many segments render as "current"?');
console.log('   v3.9.x: ' + alsoCurrentBefore + '   v3.10.0: ' + alsoCurrentNow +
  (alsoCurrentNow === 1 ? '   PASS' : '   FAIL'));
