// The three bugs Jake's screenshots exposed, tested against the REAL shapes:
//   1. segments are { text: "\tParagraph." } objects -> "[object Object]"
//   2. book.chapters is stripped before caching -> every heading read "Notice"
//   3. the credit line printed a raw URL as its own link text, four wrapped lines
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
globalThis.document = new JSDOM().window.document;

const s = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function liftFn(name) {
  const k = s.indexOf('function ' + name + '(');
  if (k < 0) throw new Error(name + ' not found');
  let d = 0;
  for (let x = s.indexOf('{', k); x < s.length; x++) {
    if (s[x] === '{') d++;
    else if (s[x] === '}') { d--; if (!d) return s.slice(k, x + 1); }
  }
}
const esc = new Function('s', 'const d=document.createElement("div"); d.textContent=s; return d.innerHTML;');
const escAttr = new Function('s', 'return String(s).replace(/"/g,"&quot;").replace(/\'/g,"&#39;");');
const creditLinkFor = new Function('escapeHtml', 'escapeAttr', 'document',
  liftFn('creditLinkFor') + '; return creditLinkFor;')(esc, escAttr, globalThis.document);

// segText, lifted out of openAbout by locating it in the source
const st = s.indexOf('const segText = (seg) => {');
const se = s.indexOf('};', st) + 2;
const segText = new Function(s.slice(st, se) + ' return segText;')();

console.log('1. SEGMENT SHAPES (the [object Object] bug)');
const segs = [
  [{ text: '\tMarisol found the machine on a Tuesday.' }, 'Marisol found the machine on a Tuesday.'],
  [{ text: 'No leading tab here.' }, 'No leading tab here.'],
  [{ text: '\t\t  double tab and spaces  ' }, 'double tab and spaces'],
  [{ text: '' }, ''],
  [{}, ''],
  ['a bare string, just in case', 'a bare string, just in case'],
  [null, ''],
  [undefined, ''],
];
let fail = 0;
for (const [input, want] of segs) {
  const got = segText(input);
  const ok = got === want;
  if (!ok) fail++;
  console.log('   ' + String(JSON.stringify(input)).slice(0, 44).padEnd(46) +
    '-> ' + JSON.stringify(got).slice(0, 42).padEnd(44) + (ok ? 'PASS' : 'FAIL want ' + JSON.stringify(want)));
}
const old = segs.map(([i]) => String(i)).filter(x => x === '[object Object]').length;
console.log('   v3.5.0 would have printed "[object Object]" for ' + old + ' of these ' + segs.length);

console.log('\n2. SECTION HEADINGS from a CACHED book (chapters stripped)');
const cached = {
  chapters: [],                                    // stripped by the grid cache
  aboutIds: ['chapter_0.2', 'chapter_900.3', 'chapter_900.4'],
  aboutTitles: { 'chapter_0.2': 'Imprint', 'chapter_900.3': 'Colophon',
                 'chapter_900.4': 'Uncopyright' },
};
const titleOf = id => (cached.aboutTitles && cached.aboutTitles[id]) ||
  ((cached.chapters || []).find(x => x.id === id) || {}).title || 'Notice';
for (const id of cached.aboutIds) {
  const got = titleOf(id);
  const ok = got !== 'Notice';
  if (!ok) fail++;
  console.log('   ' + id.padEnd(18) + '-> ' + got.padEnd(14) + (ok ? 'PASS' : 'FAIL (still "Notice")'));
}

console.log('\n3. CREDIT LINE rendering');
const credits = [
  'CC0 1.0 Public Domain Dedication https://creativecommons.org/publicdomain/zero/1.0/',
  'CC BY-NC 3.0 https://creativecommons.org/licenses/by-nc/3.0/',
  'Public domain (United States)',
  'Standard Ebooks',
  'https://example.test/only-a-url',
  'Evil" onmouseover="alert(1) https://x.test/"onclick="alert(2)',
];
for (const c of credits) {
  const out = creditLinkFor(c);
  const dom = new JSDOM('<body>' + out + '</body>').window.document.body;
  const els = Array.from(dom.querySelectorAll('*'));
  const bad = els.some(e => !['A'].includes(e.tagName)) ||
              els.some(e => Array.from(e.attributes).some(a => /^on/i.test(a.name))) ||
              els.some(e => /^(javascript|data|vbscript):/i.test(e.getAttribute('href') || ''));
  if (bad) fail++;
  console.log('   in : ' + c.slice(0, 70));
  console.log('   out: ' + out.slice(0, 110));
  console.log('   shown as: "' + dom.textContent + '"  ' + (bad ? '*** UNSAFE ***' : 'safe'));
}

console.log('\n' + (fail ? fail + ' FAILURES' : 'All checks pass.'));
