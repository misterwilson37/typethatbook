// Lifts the attribution renderer out of index.html and checks it against a CC
// book, a public domain book, a partially-tagged book, and an XSS attempt —
// because this string comes from an admin free-text field and goes into innerHTML.
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
// index.html's escapeHtml is DOM-based, so the test needs a DOM to run the real one.
globalThis.document = new JSDOM().window.document;

const s = readFileSync('/home/claude/work/index.html', 'utf8');
const i = s.indexOf('const linkify = (txt) =>');
const j = s.indexOf('const coverHTML = book.coverUrl', i);
const body = s.slice(i, j) + '\n  return creditHTML;';
const render = new Function('book', 'escapeHtml', body);

// the real escapeHtml from index.html
const esc = new Function('s', (() => {
  const k = s.indexOf('function escapeHtml');
  let d = 0;
  for (let x = s.indexOf('{', k); x < s.length; x++) {
    if (s[x] === '{') d++;
    else if (s[x] === '}') { d--; if (!d) return s.slice(s.indexOf('{', k) + 1, x); }
  }
})());

const cases = [
  ['Augie (CC BY-NC, full)', {
    source: 'SMBC, LLC / Breadpig',
    rights: 'CC BY-NC 3.0 http://creativecommons.org/licenses/by-nc/3.0/' }],
  ['Standard Ebooks (public domain)', { source: '', rights: '' }],
  ['source only', { source: 'Project Gutenberg', rights: '' }],
  ['licence only', { source: '', rights: 'CC BY 4.0' }],
  ['XSS attempt in source', {
    source: '<img src=x onerror=alert(1)>', rights: '' }],
  ['XSS attempt inside a URL', {
    source: '', rights: 'https://x.test/"onmouseover="alert(1)' }],
  ['two URLs in one field', {
    source: '', rights: 'CC BY-NC https://a.test/l and https://b.test/m' }],
];

let fail = 0;
for (const [name, book] of cases) {
  const out = render(book, esc);
  // ⚠️ PARSE IT, DON'T REGEX IT. A first version of this test flagged
  // "&lt;img src=x onerror=alert(1)&gt;" as unsafe because the literal string
  // "onerror=" appears in it — but that text is escaped and renders as words, not
  // markup. The only way to tell an attribute from text that resembles one is to
  // build the DOM and ask it. Checks: no element outside {div, a}, no element
  // carrying any on* handler, and no href with a script scheme.
  const frag = new JSDOM('<body>' + out + '</body>').window.document.body;
  const els = Array.from(frag.querySelectorAll('*'));
  const badTag = els.filter(e => !['DIV', 'A'].includes(e.tagName));
  const badAttr = els.filter(e => Array.from(e.attributes).some(a => /^on/i.test(a.name)));
  const badHref = els.filter(e => /^(javascript|data|vbscript):/i.test(e.getAttribute('href') || ''));
  const dangerous = badTag.length || badAttr.length || badHref.length;
  if (dangerous) fail++;
  console.log('\n' + name);
  console.log('   ' + (out || '(renders nothing)'));
  console.log('   ' + (dangerous
    ? '*** UNSAFE *** ' + [badTag.length && ('tags: ' + badTag.map(e => e.tagName)),
        badAttr.length && 'event handler attribute', badHref.length && 'script href']
        .filter(Boolean).join(', ')
    : 'safe \u2014 ' + els.length + ' element(s), all inert'));
}
console.log('\n' + (fail
  ? fail + ' UNSAFE OUTPUTS'
  : 'All ' + cases.length + ' safe: parsed as DOM, no tags outside {div,a}, no on* attributes, no script hrefs.'));
