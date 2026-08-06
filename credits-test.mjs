// Renders the Classic credits block and parses it, checking structure and that a
// licence URL becomes a link rather than visible text.
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<div id="text-stream"></div>');
globalThis.document = dom.window.document;

const src = readFileSync(new URL('./game.js', import.meta.url), 'utf8');
function lift(n){const k=src.indexOf('function '+n+'(');let d=0;
  for(let x=src.indexOf('{',k);x<src.length;x++){if(src[x]==='{')d++;else if(src[x]==='}'){d--;if(!d)return src.slice(k,x+1);}}}
const f = new Function('textStream','bookMetadata','currentBookId','document',
  lift('escapeHtmlG')+lift('creditLine')+lift('renderClassicCredits')+
  '; renderClassicCredits(); return textStream.innerHTML;');

const cases = [
  ['full credits', { title:'Augie and the Green Knight', author:'Zach Weinersmith',
     source:'SMBC, LLC / Breadpig',
     rights:'CC BY-NC 3.0 https://creativecommons.org/licenses/by-nc/3.0/',
     cleanedBy:'Claude (Mignon)' }],
  ['public domain, no source/licence', { title:'Heidi', author:'Johanna Spyri' }],
  ['nothing recorded', { title:'Mystery Book' }],
  ['hostile title + licence', { title:'<img src=x onerror=alert(1)>',
     rights:'Evil" onclick="alert(2) https://x.test/"onmouseover="alert(3)' }],
];
let fail = 0;
for (const [name, meta] of cases) {
  const el = dom.window.document.getElementById('text-stream');
  const html = f(el, meta, 'bk1', dom.window.document);
  const d = new JSDOM('<body>'+html+'</body>').window.document.body;
  const els = Array.from(d.querySelectorAll('*'));
  const badTag  = els.filter(e => !['DIV','SPAN','A'].includes(e.tagName));
  const badAttr = els.filter(e => Array.from(e.attributes).some(a => /^on/i.test(a.name)));
  const badHref = els.filter(e => /^(javascript|data|vbscript):/i.test(e.getAttribute('href')||''));
  const hasBack = !!d.querySelector('a[href="index.html"]');
  const hasAbout = !!d.querySelector('a[href^="index.html#about="]');
  const rawUrlVisible = /https?:\/\//.test(d.textContent);
  const bad = badTag.length || badAttr.length || badHref.length || !hasBack || !hasAbout;
  if (bad) fail++;
  console.log('\n' + name);
  console.log('   text: ' + d.textContent.replace(/\s+/g,' ').trim().slice(0,110));
  console.log('   ' + (bad ? '*** FAIL *** ' + [badTag.length&&('tags '+badTag.map(e=>e.tagName)),
      badAttr.length&&'on* attr', badHref.length&&'script href',
      !hasBack&&'no library link', !hasAbout&&'no notices link'].filter(Boolean).join(', ')
    : 'safe, both links present') + (rawUrlVisible ? '  (raw URL visible \u2014 check)' : ''));
}
console.log('\n' + (fail ? fail+' FAILURES' : 'All '+cases.length+' render safely with both links.'));
