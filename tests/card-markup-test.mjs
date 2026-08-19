// The "index page is ugly" bug was NOT styling — the markup was invalid, and
// browsers recover from invalid nesting by reparenting content out of the element
// that contained it. This test renders a card the way renderBooks() does, feeds it
// to a real HTML parser, and asserts the parsed DOM matches the intent.
//
// An <a> may not contain another <a> or a <button>. v3.5.0 put both inside the
// card anchor, so the parser closed it early and half the credit line plus the
// About button ended up outside the card.
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
globalThis.document = new JSDOM().window.document;

const src = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// Lift the card template and the helpers it needs.
function liftFn(name) {
  const k = src.indexOf('function ' + name + '(');
  let d = 0;
  for (let x = src.indexOf('{', k); x < src.length; x++) {
    if (src[x] === '{') d++;
    else if (src[x] === '}') { d--; if (!d) return src.slice(k, x + 1); }
  }
}
const start = src.indexOf('                // \u26a0\ufe0f THE RAW URL WAS THE PROBLEM');
const end = src.indexOf('            }).join(\'\');', start);
const bodyTpl = src.slice(start, end);

const esc = new Function('s', 'const d=document.createElement("div"); d.textContent=s; return d.innerHTML;');
const escAttr = new Function('s', 'return String(s).replace(/"/g,"&quot;").replace(/\'/g,"&#39;");');

const render = new Function('book', 'escapeHtml', 'escapeAttr', 'linkifyText', 'creditLinkFor', 'progressHTML',
  liftFn('creditLinkFor').replace('function creditLinkFor', 'function _unused_') + '\n' + bodyTpl);

const books = [
  ['CC book: licence link + About button', {
    id: 'augie', title: 'Augie and the Green Knight', author: 'Zach Weinersmith',
    genre: 'Fantasy', minAge: 8, maxAge: 13, coverUrl: 'https://x/c.jpg',
    source: 'SMBC, LLC / Breadpig',
    rights: 'CC BY-NC 3.0 https://creativecommons.org/licenses/by-nc/3.0/',
    aboutIds: ['chapter_0.2'], aboutTitles: {} }],
  ['public domain: neither', {
    id: 'heidi', title: 'Heidi', author: 'Johanna Spyri', genre: 'Classic Literature',
    minAge: 7, maxAge: 11, coverUrl: 'https://x/h.jpg',
    source: '', rights: '', aboutIds: [], aboutTitles: {} }],
  ['licence but no About pages', {
    id: 'x', title: 'X', author: 'Y', genre: 'Humor', minAge: null, maxAge: null,
    coverUrl: '', source: 'Standard Ebooks', rights: 'Public domain (United States)',
    aboutIds: [], aboutTitles: {} }],
];

let fail = 0;
const creditLinkFor = new Function('escapeHtml', 'escapeAttr',
  liftFn('creditLinkFor') + '; return creditLinkFor;')(esc, escAttr);

for (const [label, book] of books) {
  const html = render(book, esc, escAttr, (t) => esc(t), creditLinkFor, '');
  const doc = new JSDOM('<div id="grid">' + html + '</div>').window.document;
  const grid = doc.getElementById('grid');
  const card = grid.querySelector('.book-card');

  const checks = [];
  // 1. exactly one card, and it is the grid's only child
  checks.push(['one card, nothing loose beside it', grid.children.length === 1 && !!card]);
  // 2. NO nested anchors anywhere
  checks.push(['no <a> inside an <a>', doc.querySelectorAll('a a').length === 0]);
  // 3. NO button inside an anchor
  checks.push(['no <button> inside an <a>', doc.querySelectorAll('a button').length === 0]);
  // 4. everything the card should own is INSIDE the card, not reparented out
  const inside = (sel) => {
    const el = doc.querySelector(sel);
    return !el || card.contains(el);
  };
  checks.push(['cover inside the card', inside('.book-cover, .book-cover-placeholder')]);
  checks.push(['title inside the card', inside('.book-title')]);
  checks.push(['credit inside the card', inside('.book-credit')]);
  checks.push(['About button inside the card', inside('.book-about-btn')]);
  // 5. the link wraps the cover and metadata but NOT the credit
  const link = card.querySelector('.book-card-link');
  const credit = doc.querySelector('.book-credit');
  checks.push(['link exists and holds the title', !!link && link.contains(doc.querySelector('.book-title'))]);
  checks.push(['credit is a SIBLING of the link, not inside it',
               !credit || !link.contains(credit)]);

  console.log('\n' + label);
  for (const [name, ok] of checks) {
    if (!ok) fail++;
    console.log('   ' + (ok ? 'PASS  ' : 'FAIL  ') + name);
  }
}

// And the same render under the OLD structure, to show the parser really does this.
const oldStyle = '<a class="book-card" href="game.html?book=x">' +
  '<div class="book-info"><div class="book-title">T</div>' +
  '<div class="book-credit"><a href="https://cc.test/">CC BY-NC 3.0</a></div>' +
  '<button class="book-about-btn">About</button></div></a>';
const od = new JSDOM('<div id="g">' + oldStyle + '</div>').window.document;
const oCard = od.querySelector('.book-card');
const oBtn = od.querySelector('.book-about-btn');
const oCredit = od.querySelector('.book-credit');
console.log('\nv3.5.0 structure, same parser, for contrast:');
console.log('   grid children (should be 1): ' + od.getElementById('g').children.length);
console.log('   About button still inside the card: ' + (oCard && oBtn ? oCard.contains(oBtn) : 'n/a'));
console.log('   credit still inside the card: ' + (oCard && oCredit ? oCard.contains(oCredit) : 'n/a'));

console.log('\n' + (fail ? fail + ' FAILURES' : 'All structural checks pass.'));
