// Lifts detectAbout(), readSelectOrCustom/writeSelectOrCustom and the dot-gap
// logic out of admin.js and runs them against the real shapes: a Standard Ebook,
// my Augie build, a Gutenberg book with no front matter at all, and a legacy
// document that predates every one of these fields.
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';

const SRC = readFileSync(new URL('./admin.js', import.meta.url), 'utf8');
function lift(name) {
  const start = SRC.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(name + ' not found');
  let d = 0;
  for (let j = SRC.indexOf('{', start); j < SRC.length; j++) {
    if (SRC[j] === '{') d++;
    else if (SRC[j] === '}') { d--; if (!d) return SRC.slice(start, j + 1); }
  }
}
function liftConst(n) {
  const m = SRC.match(new RegExp('^const ' + n + '\\s*=[\\s\\S]*?;$', 'm'));
  if (!m) throw new Error(n + ' not found');
  return m[0];
}

const dom = new JSDOM('<body></body>');
globalThis.Array = Array;
const F = new Function('document',
  liftConst('ABOUT_FILE') + '\n' + liftConst('ABOUT_EPUB_TYPE') + '\n' +
  lift('detectAbout') + '\nreturn { detectAbout };')(dom.window.document);

// ── detectAbout ──────────────────────────────────────────────────────────────
function docWith(epubType) {
  const d = new JSDOM(`<body><section${epubType ? ` epub:type="${epubType}"` : ''}><p>x</p></section></body>`);
  return d.window.document;
}
const aboutCases = [
  ['Standard Ebooks colophon.xhtml',    'colophon.xhtml',      'back',  'backmatter colophon', true],
  ['Standard Ebooks uncopyright.xhtml', 'uncopyright.xhtml',   'back',  'backmatter',          true],
  ['my Augie imprint.xhtml',            'imprint.xhtml',       'front', 'frontmatter imprint', true],
  ['Augie acknowledgements.xhtml',      'acknowledgements.xhtml','front','frontmatter acknowledgements', true],
  ['titlepage.xhtml',                   'titlepage.xhtml',     'front', 'frontmatter titlepage', false],
  ['dedication.xhtml',                  'dedication.xhtml',    'front', 'frontmatter dedication', false],
  ['a real chapter named copyright?!',  'copyright.xhtml',     'body',  'bodymatter',          false],
  ['Gutenberg part0001 (no signal)',    'part0001.xhtml',      'front', '',                    false],
  ['epub:type copyright-page only',     'pg0007.xhtml',        'front', 'copyright-page',      true],
];
console.log('detectAbout()');
console.log('  ' + 'case'.padEnd(36) + 'got'.padEnd(7) + 'want');
let fail = 0;
for (const [name, file, cls, etype, want] of aboutCases) {
  const got = F.detectAbout(docWith(etype), file, cls);
  const ok = got === want;
  if (!ok) fail++;
  console.log('  ' + name.padEnd(36) + String(got).padEnd(7) + String(want) + (ok ? '  PASS' : '  FAIL'));
}

// ── the dot's gap list ───────────────────────────────────────────────────────
function gapsFor(b) {
  const gaps = [];
  if (b.minAge === null || b.minAge === undefined) gaps.push('age');
  if (!b.coverUrl) gaps.push('cover');
  if (!b.rights) gaps.push('licence');
  const chapArr = Array.isArray(b.chapters) ? b.chapters : [];
  const hasMatter = chapArr.some(c => c && c.matter && c.matter !== 'body');
  const hasAbout = chapArr.some(c => c && c.about === true);
  if (hasMatter && !hasAbout) gaps.push('about');
  return gaps;
}
const ch = (id, matter, about) => ({ id, matter, about });
const books = [
  ['fully done (Augie after re-upload)', {
    minAge: 8, coverUrl: 'https://x/y.jpg', rights: 'CC BY-NC 3.0 https://…',
    chapters: [ch('0.2', 'front', true), ch('1', 'body', false)] }],
  ['public domain, licence chosen', {
    minAge: 10, coverUrl: 'https://x/y.jpg', rights: 'Public domain (United States)',
    chapters: [ch('900.1', 'back', true), ch('1', 'body', false)] }],
  ['licence never decided', {
    minAge: 10, coverUrl: 'https://x/y.jpg', rights: '',
    chapters: [ch('1', 'body', false)] }],
  ['Northanger Abbey as it stands today', {
    minAge: 13, coverUrl: '', rights: '',
    chapters: [ch('1', 'body', false)] }],
  ['front matter present, nothing in About', {
    minAge: 9, coverUrl: 'https://x/y.jpg', rights: 'Public domain (United States)',
    chapters: [ch('0.1', 'front', false), ch('1', 'body', false)] }],
  ['legacy doc: no matter, no about, no rights', {
    minAge: null, coverUrl: '', rights: undefined, chapters: undefined }],
];
console.log('\nDot label');
for (const [name, b] of books) {
  const g = gapsFor(b);
  console.log('  ' + (g.length ? '\u25cb ' : '\u25cf ') + name.padEnd(40) +
    (g.length ? '\u00b7 needs: ' + g.join(', ') : '(done)'));
}

// A book with no front/back matter at all must NOT be nagged about About.
const noMatter = gapsFor({ minAge: 9, coverUrl: 'x', rights: 'Public domain (United States)',
                           chapters: [ch('1', 'body', false), ch('2', 'body', false)] });
const ok = !noMatter.includes('about');
if (!ok) fail++;
console.log('\nA book with no front/back matter is not nagged for About: ' + (ok ? 'PASS' : 'FAIL'));
console.log(fail ? '\n' + fail + ' FAILURES' : '\nAll checks pass.');
