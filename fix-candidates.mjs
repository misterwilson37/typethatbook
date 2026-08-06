// Candidate fixes for the two non-SE books, tested for COLLATERAL DAMAGE on the
// six that already import cleanly. Nothing here is in admin.js yet.
//
// FIX A — "front matter cannot follow body matter."  Position rule. Once a body
//   chapter has been emitted, a later file classified 'front' is reclassified
//   'back'. Fixes the Gutenberg licence landing at id 0.2 (which sorts it to
//   position 2 of the book). Front matter after the story has started is a
//   contradiction in terms, so this should be safe everywhere.
//
// FIX B — "a non-chapter is never called 'Chapter N'."  composeChapterTitle()
//   falls back to the running counter regardless of matter class, so Gatsby's
//   dedication.xhtml is titled "Chapter 3". Name it from the filename instead,
//   then "Front matter N" / "Back matter N".
//
// FIX C — per-unit matter classification (Toby Tyler's title block and Contents
//   becoming body chapters 1 and 2). NOT modelled here: it needs a title/type
//   vocabulary, and tuning a vocabulary on two examples is how you overfit.
//   Waiting on the full corpus.
import JSZip from 'jszip';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
const { DOMParser, Node, NodeFilter } = dom.window;
globalThis.Node = Node; globalThis.NodeFilter = NodeFilter;
const parser = new DOMParser();
const SRC = readFileSync(new URL('./admin.js', import.meta.url), 'utf8');

function lift(name) {
  const start = SRC.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(name + ' not found');
  let depth = 0, end = -1;
  for (let j = SRC.indexOf('{', start); j < SRC.length; j++) {
    if (SRC[j] === '{') depth++;
    else if (SRC[j] === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
  }
  return SRC.slice(start, end);
}
function liftAny(n) {
  if (new RegExp('^(?:async )?function ' + n + '\\(', 'm').test(SRC)) return lift(n);
  const m = SRC.match(new RegExp('^const ' + n + '\\s*=[\\s\\S]*?;$', 'm'));
  return m ? m[0] : null;
}
const NAMES = ['zipEntry','resolvePath','findChapterUnits','findNavHref','buildTocIndex',
  'chapterUnitsFromToc','stripBoilerplate','classifyDocument','headingInfoOf',
  'cleanChapterTitle','composeChapterTitle','chapterSortKey','compareChapterIds',
  'assignChapterIds','detectPart','looksLikeLeadingMatter','normaliseTitleForCompare'];
let extra = [], F;
function build() {
  F = new Function('Node','NodeFilter','TextDecoder',
    extra.join('\n') + '\n' + NAMES.map(lift).join('\n') +
    '\nreturn {' + NAMES.join(',') + '};')(Node, NodeFilter, TextDecoder);
}
function retry(e) {
  const m = /(\w+) is not defined/.exec(e.message);
  if (!m) return false;
  const s = liftAny(m[1]); if (!s) return false;
  extra.push(s); build(); return true;
}
build();

// ── FIX B: name a non-chapter from its filename ──────────────────────────────
const MATTER_NAMES = {
  titlepage: 'Title Page', halftitlepage: 'Half Title', halftitle: 'Half Title',
  imprint: 'Imprint', dedication: 'Dedication', epigraph: 'Epigraph',
  frontispiece: 'Frontispiece', colophon: 'Colophon', uncopyright: 'Uncopyright',
  copyright: 'Copyright', endnotes: 'Endnotes', loi: 'List of Illustrations',
  toc: 'Table of Contents', contents: 'Table of Contents', index: 'Index',
  appendix: 'Appendix', preface: 'Preface', introduction: 'Introduction',
};
function matterTitleFrom(fileKey, cls, n) {
  const stem = String(fileKey).replace(/\.x?html?$/i, '').toLowerCase();
  for (const k of Object.keys(MATTER_NAMES)) {
    if (new RegExp('\\b' + k + '\\b').test(stem)) return MATTER_NAMES[k];
  }
  return (cls === 'back' ? 'Back matter ' : 'Front matter ') + n;
}

async function parseBook(file, { fixA, fixB, fixC }) {
  const zip = await JSZip.loadAsync(readFileSync(file));
  let opfPath;
  const c = await zip.file('META-INF/container.xml')?.async('string');
  opfPath = c ? parser.parseFromString(c, 'text/xml').querySelector('rootfile')
                  .getAttribute('full-path')
              : Object.keys(zip.files).find(f => f.endsWith('.opf'));
  const opfDoc = parser.parseFromString(await F.zipEntry(zip, opfPath).async('string'), 'text/xml');
  const spine = opfDoc.getElementsByTagName('spine')[0];
  const manifest = opfDoc.getElementsByTagName('manifest')[0];
  const basePath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
  const idToHref = {};
  Array.from(manifest.getElementsByTagName('item')).forEach(i =>
    idToHref[i.getAttribute('id')] = i.getAttribute('href'));

  let tocIndex = {};
  try {
    const nav = F.findNavHref(opfDoc);
    if (nav && nav.href) {
      const np = (basePath === '') ? nav.href : basePath + nav.href;
      const nf = F.zipEntry(zip, np);
      if (nf) tocIndex = F.buildTocIndex(
        parser.parseFromString(await nf.async('string'), 'application/xhtml+xml'), nav.kind);
    }
  } catch (_) {}

  const chapters = [];
  let seenBody = false, fCount = 0, bCount = 0, seenReal = false;
  const DC = 'http://purl.org/dc/elements/1.1/';
  const dc1 = t => { const e = opfDoc.getElementsByTagNameNS(DC, t);
                     return (e && e[0] && (e[0].textContent || '').trim()) || ''; };
  const bTitle = dc1('title'), bAuthor = dc1('creator');
  for (const ref of Array.from(spine.getElementsByTagName('itemref'))) {
    const href = idToHref[ref.getAttribute('idref')];
    if (!href) continue;
    const full = (basePath === '') ? href : basePath + href;
    const f = F.zipEntry(zip, full); if (!f) continue;
    const doc = parser.parseFromString(await f.async('string'), 'application/xhtml+xml');
    if (!doc.body) continue;
    F.stripBoilerplate(doc);
    const fileKey = href.split('/').pop();
    let cls = F.classifyDocument(doc, fileKey).cls;

    // ── FIX A ──
    if (fixA && cls === 'front' && seenBody) cls = 'back';

    let units = F.chapterUnitsFromToc(doc, tocIndex[fileKey]) || F.findChapterUnits(doc);
    let groups = units
      ? units.map(u => { const info = F.headingInfoOf(u.root || doc.body);
                         return { title: u.title || info.title || info.ordinal, info, pEls: u.pEls }; })
      : [{ title: '', info: F.headingInfoOf(doc.body),
           pEls: Array.from(doc.body.querySelectorAll('p')) }];
    for (const g of groups) {
      const drop = (g.info && g.info.titleEls) || [];
      if (drop.length) g.pEls = g.pEls.filter(el => drop.indexOf(el) === -1);
    }
    for (const g of groups) {
      let title = (g.title && g.title.trim())
        ? F.cleanChapterTitle(g.title).substring(0, 60)
        : F.composeChapterTitle(g.info, chapters.length + 1);
      // ⚠️ ucls is PER UNIT. Assigning back to `cls` here (as an earlier draft of
      // this harness did) leaks the reclassification to every later unit in the
      // same file — it turned 15 real chapters of Outdoor Girls into front matter.
      let ucls = cls;
      if (fixC && ucls === 'body' && !seenReal) {
        if (F.looksLikeLeadingMatter(title, bTitle, bAuthor, g.pEls.length)) ucls = 'front';
        else seenReal = true;
      }
      // ── FIX B ──
      if (fixB && cls !== 'body' && /^Chapter \d+$/.test(title)) {
        title = matterTitleFrom(fileKey, cls, cls === 'back' ? ++bCount : ++fCount);
      }
      if (g.pEls.length === 0) continue;  // real code guards on segments.length > 0
      chapters.push({ title, matter: ucls, srcFile: fileKey, segments: g.pEls.length });
      if (ucls === 'body') seenBody = true;
    }
  }
  F.assignChapterIds(chapters);
  return chapters;
}

// EPUB corpus. Defaults to the repo's own library/; pass a directory as argv[2]
// to point it at a bigger one. This was a hardcoded sandbox path, so the harness
// could not run outside the session that wrote it.
const LIB = process.argv[2] || fileURLToPath(new URL('./library', import.meta.url));
const files = readdirSync(LIB).filter(f => f.endsWith('.epub') && !f.startsWith('._')).sort();
// Both counts were fabricated: the banner said "eight books" and the summary
// divided by a hardcoded 42, whatever the corpus actually held. A differ that
// reports a denominator no file backs up is the exact failure HANDOFF §0 is about,
// so both now come from files.length.
console.log('Comparing CURRENT vs CURRENT+FIX A+FIX B on ' + files.length +
            ' book(s) in ' + LIB + '.\n');
let totalChanged = 0; const COUNTS = [];
for (const fn of files) {
  const path = LIB + '/' + fn;
  let base = null, next = null;
  for (let a = 0; a < 40; a++) { try { base = await parseBook(path, {}); break; } catch (e) { if (!retry(e)) throw e; } }
  for (let a = 0; a < 40; a++) { try { next = await parseBook(path, { fixA: true, fixB: true, fixC: true }); break; } catch (e) { if (!retry(e)) throw e; } }

  const bb = base.filter(c=>c.matter==='body').length;
  const nb = next.filter(c=>c.matter==='body').length;
  if (bb !== nb) COUNTS.push([fn.replace(/\.epub$/,''), bb, nb,
      base.filter(c=>c.matter==='body').slice(0, bb-nb).map(c=>'"'+c.title.slice(0,34)+'"').join(', ')]);
  const diffs = [];
  for (let i = 0; i < Math.max(base.length, next.length); i++) {
    const b = base[i], n = next[i];
    if (!b || !n) { diffs.push(['length mismatch at ' + i, '', '']); continue; }
    if (b.id !== n.id || b.title !== n.title || b.matter !== n.matter)
      diffs.push([b.srcFile, `${b.id} ${b.matter} "${b.title}"`, `${n.id} ${n.matter} "${n.title}"`]);
  }
  totalChanged += diffs.length;
  const name = fn.replace(/\.epub$/, '');
  if (!diffs.length) { console.log('✅ ' + name.slice(0, 56).padEnd(58) + 'NO CHANGE'); continue; }
  console.log('🔧 ' + name.slice(0, 56) + '  — ' + diffs.length + ' chapter(s) changed');
  const shown = diffs.filter(([f, was, now]) =>
    was.split(' ')[1] !== now.split(' ')[1] || /front|back/.test(now));
  for (const [f, was, now] of shown.slice(0, 6))
    console.log('      ' + f.slice(0, 26).padEnd(28) + 'was ' + was.padEnd(34) + 'now ' + now);
  const rest = diffs.length - shown.slice(0,6).length;
  if (rest > 0) console.log('      (+ ' + rest + ' renumbered only \u2014 same title, same matter)');
}
console.log('\n═══ BODY CHAPTER COUNT: before → after Fix C ═══');
console.log('book'.padEnd(46) + 'was'.padEnd(6) + 'now'.padEnd(6) + 'reclassified as front matter');
console.log('-'.repeat(110));
for (const [n, b, a, what] of COUNTS)
  console.log(n.slice(0,44).padEnd(46) + String(b).padEnd(6) + String(a).padEnd(6) + what);
console.log('\nBooks whose body count changed: ' + COUNTS.length + ' of ' + files.length);
