// Lifts the ENTIRE chapter-detection pipeline out of admin.js by brace-matching
// and runs it over Jake's real EPUBs — front/back matter classification,
// TOC-driven splitting, structure fallback, part-aware numbering, paragraph
// reconciliation. This is the §B.7 harness rebuilt.
import JSZip from 'jszip';
import { readFileSync, readdirSync } from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
const { DOMParser, Node, NodeFilter } = dom.window;
globalThis.Node = Node;
globalThis.NodeFilter = NodeFilter;
const parser = new DOMParser();

const SRC = readFileSync('/home/claude/work/admin.js', 'utf8');
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
const NAMES = ['zipEntry','resolvePath','findChapterUnits','findNavHref','buildTocIndex',
  'chapterUnitsFromToc','stripBoilerplate','classifyDocument','headingInfoOf',
  'cleanChapterTitle','composeChapterTitle','chapterSortKey','compareChapterIds',
  'assignChapterIds'];

// Auto-resolve the dependency closure: compile, read the "X is not defined"
// complaint, lift X too, repeat. Ends with the minimum set of REAL shipping
// functions and constants needed, without me guessing at the graph.
function liftAny(name) {
  const fnRe = new RegExp('^(?:async )?function ' + name + '\\(', 'm');
  if (fnRe.test(SRC)) return lift(name);
  const cRe = new RegExp('^const ' + name + '\\s*=[\\s\\S]*?;$', 'm');
  const m = SRC.match(cRe);
  if (m) return m[0];
  return null;
}
let extra = [], F = null, guard = 0;
while (guard++ < 60) {
  try {
    F = new Function('Node','NodeFilter','TextDecoder',
      extra.join('\n') + '\n' + NAMES.map(lift).join('\n') +
      '\nreturn {' + NAMES.join(',') + '};')(Node, NodeFilter, TextDecoder);
    // force evaluation of every lifted body's free variables by calling nothing —
    // ReferenceErrors surface at call time, so probe with a smoke parse below.
    break;
  } catch (e) {
    const m = /(\w+) is not defined/.exec(e.message);
    if (!m) throw e;
    const src = liftAny(m[1]);
    if (!src) throw new Error('cannot lift ' + m[1]);
    extra.push(src);
  }
}
// Runtime ReferenceErrors only appear when the functions actually run, so the
// resolver is re-entered from parseBook's catch as well (see resolveAndRetry).
function rebuild() {
  F = new Function('Node','NodeFilter','TextDecoder',
    extra.join('\n') + '\n' + NAMES.map(lift).join('\n') +
    '\nreturn {' + NAMES.join(',') + '};')(Node, NodeFilter, TextDecoder);
}
function resolveAndRetry(err) {
  const m = /(\w+) is not defined/.exec(err.message);
  if (!m) return false;
  const src = liftAny(m[1]);
  if (!src) return false;
  extra.push(src);
  rebuild();
  return true;
}

async function parseBook(file) {
  const zip = await JSZip.loadAsync(readFileSync(file));
  let opfPath;
  const container = await zip.file('META-INF/container.xml')?.async('string');
  if (container) opfPath = parser.parseFromString(container, 'text/xml')
    .querySelector('rootfile').getAttribute('full-path');
  else opfPath = Object.keys(zip.files).find(f => f.endsWith('.opf'));

  const opfDoc = parser.parseFromString(
    await F.zipEntry(zip, opfPath).async('string'), 'text/xml');
  const spine = opfDoc.getElementsByTagName('spine')[0];
  const manifest = opfDoc.getElementsByTagName('manifest')[0];
  const basePath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);

  const idToHref = {};
  Array.from(manifest.getElementsByTagName('item')).forEach(i => {
    idToHref[i.getAttribute('id')] = i.getAttribute('href');
  });

  let tocIndex = {};
  try {
    const navRef = F.findNavHref(opfDoc);
    if (navRef && navRef.href) {
      const navPath = (basePath === '') ? navRef.href : basePath + navRef.href;
      const navFile = F.zipEntry(zip, navPath);
      if (navFile) tocIndex = F.buildTocIndex(
        parser.parseFromString(await navFile.async('string'), 'application/xhtml+xml'),
        navRef.kind);
    }
  } catch (e) { /* falls back to structure, as shipped */ }

  const chapters = [];
  let pSeen = 0, pGrouped = 0, titleSegmentsRemoved = 0, orphansRescued = 0;
  let front = 0, back = 0, body = 0, viaToc = 0, viaStructure = 0, missing = [];

  for (const ref of Array.from(spine.getElementsByTagName('itemref'))) {
    const href = idToHref[ref.getAttribute('idref')];
    if (!href) continue;
    const full = (basePath === '') ? href : basePath + href;
    const f = F.zipEntry(zip, full);
    if (!f) { missing.push(full); continue; }
    const doc = parser.parseFromString(await f.async('string'), 'application/xhtml+xml');
    if (!doc.body) continue;
    F.stripBoilerplate(doc);
    pSeen += doc.body.querySelectorAll('p').length;
    const fileKey = href.split('/').pop();
    const kind = F.classifyDocument(doc, fileKey);
    if (kind.cls === 'front') front++; else if (kind.cls === 'back') back++; else body++;

    let units = F.chapterUnitsFromToc(doc, tocIndex[fileKey]);
    if (units) { viaToc++; orphansRescued += (units.orphanCount || 0); }
    else { units = F.findChapterUnits(doc); if (units) viaStructure++; }

    let groups;
    if (units) groups = units.map(u => {
      const info = F.headingInfoOf(u.root || doc.body);
      return { title: u.title || info.title || info.ordinal, info, pEls: u.pEls };
    });
    else {
      const info = F.headingInfoOf(doc.body);
      groups = [{ title: '', info, pEls: Array.from(doc.body.querySelectorAll('p')) }];
    }
    for (const g of groups) {
      const drop = (g.info && g.info.titleEls) || [];
      if (!drop.length) continue;
      const before = g.pEls.length;
      g.pEls = g.pEls.filter(el => drop.indexOf(el) === -1);
      titleSegmentsRemoved += (before - g.pEls.length);
    }
    for (const g of groups) {
      pGrouped += g.pEls.length;
      const title = (g.title && g.title.trim())
        ? F.cleanChapterTitle(g.title).substring(0, 60)
        : F.composeChapterTitle(g.info, chapters.length + 1);
      if (g.pEls.length === 0) continue;   // parseEpubFile guards on segments.length > 0
      chapters.push({ title, matter: kind.cls, fileKey, srcFile: fileKey,
                      segments: g.pEls.length });
    }
  }

  const numbering = F.assignChapterIds(chapters);
  return { file, chapters, numbering, pSeen, pGrouped, titleSegmentsRemoved,
           orphansRescued, front, back, body, viaToc, viaStructure, missing };
}

const files = readdirSync('/home/claude/lib/library').filter(f => f.endsWith('.epub') && !f.startsWith('._')).sort();
console.log('book'.padEnd(34) + 'chaps'.padEnd(7) + 'body'.padEnd(6) + 'parts'.padEnd(7) +
            'front/back'.padEnd(12) + 'route'.padEnd(14) + 'p lost');
console.log('-'.repeat(96));
const all = [];
for (const f of files) {
  let r = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { r = await parseBook('/home/claude/lib/library/' + f); break; }
    catch (e) { if (!resolveAndRetry(e)) { console.log(f.slice(0,32).padEnd(34) + 'ERROR: ' + e.message); break; } }
  }
  if (!r) continue;
  try {
    all.push(r);
    const delta = r.pSeen - r.pGrouped - r.titleSegmentsRemoved;
    console.log(
      f.replace(/\.epub$/, '').slice(0, 32).padEnd(34) +
      String(r.chapters.length).padEnd(7) +
      String(r.numbering.bodyChapters).padEnd(6) +
      String(r.numbering.parts || 0).padEnd(7) +
      `${r.front}/${r.back}`.padEnd(12) +
      `toc ${r.viaToc} str ${r.viaStructure}`.padEnd(14) +
      (delta === 0 ? '0 ✓' : delta + ' ⚠') +
      (r.missing.length ? '  MISSING ' + r.missing.length : ''));
  } catch (e) {
    console.log(f.slice(0, 32).padEnd(34) + 'ERROR: ' + e.message);
  }
}

console.log('\n═══ first / last chapter ids + titles, and any part structure ═══');
for (const r of all) {
  const c = r.chapters;
  console.log('\n' + r.file.split('/').pop().replace(/\.epub$/, ''));
  const show = i => c[i] ? `${c[i].id ?? '?'} · ${c[i].title} [${c[i].matter}]` : '—';
  console.log('   first 3: ' + [0,1,2].map(show).join('  |  '));
  console.log('   last  2: ' + [c.length-2, c.length-1].map(show).join('  |  '));
  const ids = c.map(x => String(x.id ?? ''));
  const parts = new Set(ids.filter(i => i.includes('.')).map(i => i.split('.')[0]));
  if (parts.size > 1) console.log('   part prefixes: ' + [...parts].join(', '));
}



console.log('\n═══ SUSPECT BODY CHAPTERS (Fix C candidates) ═══');
const SUS = /^(contents?|table of contents|title page|titlepage|illustrations?|list of illustrations|transcriber|advertisement|preface|introduction|dedication|epigraph|colophon|copyright|the full project gutenberg|project gutenberg|end of (the )?project gutenberg|frontispiece|half.?title)\b/i;
let n = 0;
for (const r of all) {
  const name = r.file.split('/').pop().replace(/\.epub$/, '');
  const bodies = r.chapters.filter(c => c.matter === 'body');
  const hits = bodies.filter((c, i) =>
    SUS.test(c.title.trim()) ||
    (i < 3 && c.segments <= 6) ||
    (i >= bodies.length - 2 && c.segments <= 6) ||
    c.segments === 0);
  if (!hits.length) continue;
  n += hits.length;
  console.log('\n' + name);
  for (const c of hits) {
    const pos = bodies.indexOf(c);
    console.log('   body#' + String(pos + 1).padStart(3) + '  id ' + String(c.id).padEnd(6) +
      String(c.segments).padStart(4) + 'p  ' + String(c.srcFile).slice(0,30).padEnd(32) +
      '"' + c.title.slice(0, 44) + '"');
  }
}
console.log('\nTotal suspect body chapters across ' + all.length + ' books: ' + n);
