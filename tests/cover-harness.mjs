// Rebuilds the §B.7 harness for the COVER path. Lifts sniffImageType(),
// zipEntry() and resolvePath() out of admin.js BY BRACE-MATCHING — the shipping
// functions, not copies — then replays the v3.18.3 detection/extraction logic
// against synthetic EPUBs modelled on the real structures: Standard Ebooks
// (SVG wrapper + AVIF raster), Gutenberg (percent-encoded JPEG), EPUB 2
// (<meta name="cover">), and the failure cases.
import JSZip from 'jszip';
import { readFileSync } from 'fs';
import { DOMParser } from '@xmldom/xmldom';

// ── lift real functions ──────────────────────────────────────────────────────
const SRC = readFileSync(new URL('../admin.js', import.meta.url), 'utf8');
function lift(name) {
  const start = SRC.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} not found`);
  let depth = 0, end = -1;
  for (let j = SRC.indexOf('{', start); j < SRC.length; j++) {
    if (SRC[j] === '{') depth++;
    else if (SRC[j] === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
  }
  return SRC.slice(start, end);
}
const { sniffImageType, zipEntry, resolvePath } = new Function(
  'TextDecoder',
  `${lift('sniffImageType')}\n${lift('zipEntry')}\n${lift('resolvePath')}
   return { sniffImageType, zipEntry, resolvePath };`
)(TextDecoder);

// ── byte fixtures ────────────────────────────────────────────────────────────
const JPEG = new Uint8Array([0xFF,0xD8,0xFF,0xE0,0,16,74,70,73,70,0,1,0,0,0,1]);
const PNG  = new Uint8Array([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0,0,0,13,73,72,68,82]);
const AVIF = new Uint8Array([0,0,0,32,0x66,0x74,0x79,0x70,0x61,0x76,0x69,0x66,0,0,0,0]);
const WEBP = new Uint8Array([0x52,0x49,0x46,0x46,0x24,0,0,0,0x57,0x45,0x42,0x50,0x56,0x50,0x38,0x20]);
const GARBAGE = new Uint8Array(Array.from({length:32},(_,i)=>i));
const svgWrap = (h) =>
  `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" ` +
  `xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1400 2100">` +
  `<image width="1400" height="2100" xlink:href="${h}"/></svg>`;

// ── the shipping detection + extraction logic, transcribed once ──────────────
async function extractCover(zip, opfPath) {
  const parser = new DOMParser();
  const opfDoc = parser.parseFromString(await zipEntry(zip, opfPath).async('string'), 'text/xml');
  const manifest = opfDoc.getElementsByTagName('manifest')[0];
  const basePath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);

  const items = Array.from(manifest.getElementsByTagName('item'));
  const hrefOf = it => it && it.getAttribute('href');
  const mtOf   = it => (it && it.getAttribute('media-type')) || '';
  const isRaster = it => mtOf(it).startsWith('image/') && mtOf(it) !== 'image/svg+xml';
  const toPath = href => (basePath === '') ? href : resolvePath(basePath + 'dummy', href);

  let coverItem = null, coverPathOverride = null, coverDeclaredType = '', coverVia = '';
  let coverNote = 'NO COVER FOUND IN EPUB';

  const metas = Array.from(opfDoc.getElementsByTagName('meta'))
    .filter(m => m.getAttribute('name') === 'cover');
  if (metas.length) {
    const id = metas[0].getAttribute('content');
    const byId = items.find(i => i.getAttribute('id') === id);
    if (byId && mtOf(byId).startsWith('image/')) coverItem = byId;
  }
  if (!coverItem) coverItem = items.find(i =>
    (i.getAttribute('properties') || '').includes('cover-image')
    && mtOf(i).startsWith('image/')) || null;
  if (!coverItem) coverItem = items.find(i => {
    const id = (i.getAttribute('id') || '').toLowerCase();
    const hr = (hrefOf(i) || '').toLowerCase();
    return (id.includes('cover') || hr.includes('cover')) && mtOf(i).startsWith('image/');
  }) || null;

  let svgFellBack = false;
  if (coverItem && mtOf(coverItem) === 'image/svg+xml') {
    const svgPath = toPath(hrefOf(coverItem));
    let swapped = null;
    try {
      const f = zipEntry(zip, svgPath);
      if (f) {
        const d = parser.parseFromString(await f.async('string'), 'image/svg+xml');
        const inner = d.getElementsByTagName('image')[0];
        const ih = inner && (inner.getAttribute('href') || inner.getAttribute('xlink:href'));
        if (ih) {
          const rp = resolvePath(svgPath, ih);
          if (zipEntry(zip, rp)) swapped = rp;
        }
      }
    } catch (_) {}
    if (!swapped) {
      const alt = items.find(i => isRaster(i) &&
        ((i.getAttribute('id')||'') + (hrefOf(i)||'')).toLowerCase().includes('cover'));
      if (alt) swapped = toPath(hrefOf(alt));
    }
    if (swapped) {
      coverPathOverride = swapped;
      coverVia = ' · raster from inside the SVG wrapper';
      const si = items.find(i => toPath(hrefOf(i)) === swapped);
      coverDeclaredType = si ? mtOf(si) : '';
    } else {
      coverPathOverride = svgPath; svgFellBack = true;
      coverDeclaredType = mtOf(coverItem);
    }
  } else if (coverItem) {
    coverPathOverride = toPath(hrefOf(coverItem));
    coverDeclaredType = mtOf(coverItem);
  }

  let blobType = null;
  if (coverPathOverride) {
    const f = zipEntry(zip, coverPathOverride);
    if (!f) coverNote = 'COVER MISSING FROM EPUB (' + coverPathOverride + ')';
    else {
      const buf = await f.async('arraybuffer');
      const declared = coverDeclaredType;
      const sniffed = sniffImageType(buf);
      const type = sniffed || declared || '';
      if (!type.startsWith('image/')) coverNote = 'COVER TYPE UNKNOWN — not uploaded';
      else {
        blobType = type;
        const note = !sniffed
          ? ' ⚠ UNVERIFIED — bytes unrecognised, type from manifest'
          : (declared && declared !== sniffed ? ' ⚠ manifest said ' + declared : '');
        coverNote = 'cover: ' + coverPathOverride.split('/').pop() + ' (' + type + ')' + coverVia + note;
      }
    }
  }
  return { path: coverPathOverride, blobType, coverNote, svgFellBack };
}

// what Firebase would store, given the blob we build
const storedAs = t => t || 'application/octet-stream';
// what storage.rules v2.0.0 would have decided
const v200 = t => /^image\//.test(storedAs(t));

// ── books ────────────────────────────────────────────────────────────────────
function opf(items, metas = '') {
  return `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0">
<metadata>${metas}</metadata><manifest>${items}</manifest><spine><itemref idref="c1"/></spine></package>`;
}

const books = {
  'Standard Ebooks (SVG wrapper + AVIF)': z => {
    z.file('EPUB/content.opf', opf(
      `<item id="cover.svg" href="images/cover.svg" media-type="image/svg+xml" properties="cover-image"/>
       <item id="cover.avif" href="images/cover.avif" media-type="image/avif"/>
       <item id="c1" href="text/chapter-1.xhtml" media-type="application/xhtml+xml"/>`));
    z.file('EPUB/images/cover.svg', svgWrap('cover.avif'));
    z.file('EPUB/images/cover.avif', AVIF);
    return 'EPUB/content.opf';
  },
  'SE variant, SVG wrapper + JPG sibling': z => {
    z.file('EPUB/content.opf', opf(
      `<item id="cover.svg" href="images/cover.svg" media-type="image/svg+xml" properties="cover-image"/>
       <item id="coverjpg" href="images/cover.jpg" media-type="image/jpeg"/>
       <item id="c1" href="text/c1.xhtml" media-type="application/xhtml+xml"/>`));
    z.file('EPUB/images/cover.svg', svgWrap('nope-missing.avif'));  // dangling ref
    z.file('EPUB/images/cover.jpg', JPEG);
    return 'EPUB/content.opf';
  },
  'SVG wrapper, NO raster anywhere': z => {
    z.file('EPUB/content.opf', opf(
      `<item id="cover.svg" href="images/cover.svg" media-type="image/svg+xml" properties="cover-image"/>
       <item id="c1" href="text/c1.xhtml" media-type="application/xhtml+xml"/>`));
    z.file('EPUB/images/cover.svg', svgWrap('gone.png'));
    return 'EPUB/content.opf';
  },
  'Gutenberg, percent-encoded href': z => {
    z.file('content.opf', opf(
      `<item id="cover-img" href="images/cover%20art.jpg" media-type="image/jpeg"/>
       <item id="c1" href="c1.htm" media-type="application/xhtml+xml"/>`));
    z.file('images/cover art.jpg', JPEG);   // literal space in the zip entry
    return 'content.opf';
  },
  'EPUB 2, <meta name="cover">': z => {
    z.file('OEBPS/content.opf', opf(
      `<item id="myCover" href="img/front.png" media-type="image/png"/>
       <item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>`,
      `<meta name="cover" content="myCover"/>`));
    z.file('OEBPS/img/front.png', PNG);
    return 'OEBPS/content.opf';
  },
  'meta points at the cover PAGE, not image': z => {
    z.file('OEBPS/content.opf', opf(
      `<item id="coverpage" href="cover.xhtml" media-type="application/xhtml+xml"/>
       <item id="realcover" href="images/cover.webp" media-type="image/webp"/>
       <item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>`,
      `<meta name="cover" content="coverpage"/>`));
    z.file('OEBPS/cover.xhtml', '<html><body/></html>');
    z.file('OEBPS/images/cover.webp', WEBP);
    return 'OEBPS/content.opf';
  },
  'manifest LIES: says png, bytes are jpeg': z => {
    z.file('EPUB/content.opf', opf(
      `<item id="cover" href="images/cover.png" media-type="image/png" properties="cover-image"/>
       <item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>`));
    z.file('EPUB/images/cover.png', JPEG);
    return 'EPUB/content.opf';
  },
  'declared cover absent from the zip': z => {
    z.file('EPUB/content.opf', opf(
      `<item id="cover" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>
       <item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>`));
    return 'EPUB/content.opf';
  },
  'cover bytes are not an image': z => {
    z.file('EPUB/content.opf', opf(
      `<item id="cover" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>
       <item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>`));
    z.file('EPUB/images/cover.jpg', GARBAGE);
    return 'EPUB/content.opf';
  },
  'no cover declared at all': z => {
    z.file('EPUB/content.opf', opf(
      `<item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>`));
    return 'EPUB/content.opf';
  },
};

console.log('book'.padEnd(38), 'resolved cover'.padEnd(24), 'type'.padEnd(16), 'v2.0.0 rules');
console.log('-'.repeat(100));
for (const [name, build] of Object.entries(books)) {
  const z = new JSZip();
  const opfPath = build(z);
  const buf = await z.generateAsync({ type: 'nodebuffer' });
  const zip = await JSZip.loadAsync(buf);
  const r = await extractCover(zip, opfPath);
  const before = r.path ? 'octet-stream' : '—';
  console.log(
    name.padEnd(38),
    String(r.path ? r.path.split('/').pop() : '—').padEnd(24),
    String(r.blobType || '—').padEnd(16),
    (r.blobType ? (v200(r.blobType) ? 'PASS' : 'DENY') : 'n/a') +
    `   (was: ${before}${r.path ? ' → DENY' : ''})`
  );
  if (r.svgFellBack) console.log('    ↳ flagged: SVG wrapper with no raster, will render blank');
  console.log('    ↳ ' + r.coverNote);
}
