// Lifts the attribution renderer out of index.html and checks it against a CC
// book, a public domain book, a partially-tagged book, and an XSS attempt —
// because this string comes from an admin free-text field and goes into innerHTML.
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
// index.html's escapeHtml is DOM-based, so the test needs a DOM to run the real one.
globalThis.document = new JSDOM().window.document;

const s = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
// linkifyText() is now module-scoped in index.html and SHARED with the About
// panel, so lift it separately and hand it to the credit block. This test broke
// when it was hoisted, which is the correct thing for it to have done: it was
// extracting by matching source text, and the source moved.
function liftFn(name) {
  const k = s.indexOf('function ' + name + '(');
  if (k < 0) throw new Error(name + ' not found in index.html');
  let d = 0;
  for (let x = s.indexOf('{', k); x < s.length; x++) {
    if (s[x] === '{') d++;
    else if (s[x] === '}') { d--; if (!d) return s.slice(k, x + 1); }
  }
}
// ⚠️ REANCHORED in Round 6. The old start marker was `const linkify =
// linkifyText;`, which index.html v3.5.1 replaced with a shared creditLinkFor()
// when the raw-URL fix moved the label/href split out of the card. indexOf()
// returned -1, s.slice(-1, j) produced an empty string, and the appended
// `return creditHTML + aboutHTML;` then referenced two variables that had not
// been lifted — so this suite died with a ReferenceError that looked like a
// product bug and was not one.
//
// Breaking when the source moves IS this harness's correct behaviour (HANDOFF §6):
// it extracts the SHIPPING code rather than a copy, so a rename must be noticed.
// What was wrong is that nobody could run it to see the break, because every
// harness had a dead absolute path. Both fixed together.
const START = 'const creditBits = [];';
const END   = 'const coverHTML = book.coverUrl';
const i = s.indexOf(START);
const j = s.indexOf(END, i);
if (i < 0 || j < 0) {
  throw new Error('credit-test: could not find the credit block in index.html — ' +
    'looked for ' + JSON.stringify(START) + ' then ' + JSON.stringify(END) + '. ' +
    'The card renderer moved again; reanchor these two markers rather than ' +
    'silently testing nothing.');
}
const body = liftFn('linkifyText') + '\n' + liftFn('creditLinkFor') + '\n' +
             s.slice(i, j) + '\n  return creditHTML + aboutHTML;';
const render = new Function('book', 'escapeHtml', 'escapeAttr', body);

// the real escapeAttr from index.html — this is what guards the data-book
// attribute on the ⓘ button, and a book id is admin-supplied.
const escAttr = new Function('s', (() => {
  const k = s.indexOf('function escapeAttr');
  let d = 0;
  for (let x = s.indexOf('{', k); x < s.length; x++) {
    if (s[x] === '{') d++;
    else if (s[x] === '}') { d--; if (!d) return s.slice(s.indexOf('{', k) + 1, x); }
  }
})());

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
  ['book WITH about pages (button renders)', {
    source: 'SMBC, LLC / Breadpig', rights: 'CC BY-NC 3.0',
    aboutIds: ['chapter_0.2'], id: 'augie_green_knight' }],
  ['hostile book id in the button attribute', {
    source: 'x', rights: '', aboutIds: ['chapter_0.2'],
    id: 'evil" onclick="alert(1)' }],
];

let fail = 0;
for (const [name, book0] of cases) {
  // aboutIds defaults to [] — the lifted slice now also renders the ⓘ button, and
  // [] exercises the "no credits pages, so no button" path.
  const book = { aboutIds: [], ...book0 };
  const out = render(book, esc, escAttr);
  // ⚠️ PARSE IT, DON'T REGEX IT. A first version of this test flagged
  // "&lt;img src=x onerror=alert(1)&gt;" as unsafe because the literal string
  // "onerror=" appears in it — but that text is escaped and renders as words, not
  // markup. The only way to tell an attribute from text that resembles one is to
  // build the DOM and ask it. Checks: no element outside {div, a}, no element
  // carrying any on* handler, and no href with a script scheme.
  const frag = new JSDOM('<body>' + out + '</body>').window.document.body;
  const els = Array.from(frag.querySelectorAll('*'));
  const badTag = els.filter(e => !['DIV', 'A', 'BUTTON'].includes(e.tagName));
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
