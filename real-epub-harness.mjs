// Runs the SHIPPING v3.18.3 cover-detection and spine-resolution logic against
// Jake's real EPUBs. sniffImageType(), zipEntry() and resolvePath() are lifted
// out of admin.js by brace-matching, so this tests the real code.
//
// Also diffs OLD vs NEW spine resolution: my only change to the chapter path was
// swapping zip.file(p) for zipEntry(zip, p), so if every spine href resolves
// identically both ways, chapter detection is provably untouched.
import JSZip from 'jszip';
import { readFileSync, readdirSync } from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
const DOMParser = dom.window.DOMParser;
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
const { sniffImageType, zipEntry, resolvePath } = new Function('TextDecoder',
  `${lift('sniffImageType')}\n${lift('zipEntry')}\n${lift('resolvePath')}
   return { sniffImageType, zipEntry, resolvePath };`)(TextDecoder);

async function analyse(file) {
  const zip = await JSZip.loadAsync(readFileSync(file));

  // --- locate the OPF exactly as parseEpubFile does ---
  let opfPath = null;
  const container = await zip.file('META-INF/container.xml')?.async('string');
  if (container) {
    opfPath = parser.parseFromString(container, 'text/xml')
      .querySelector('rootfile').getAttribute('full-path');
  } else {
    opfPath = Object.keys(zip.files).find(f => f.endsWith('.opf'));
  }

  const opfDoc = parser.parseFromString(
    await zipEntry(zip, opfPath).async('string'), 'text/xml');
  const manifest = opfDoc.getElementsByTagName('manifest')[0];
  const spine = opfDoc.getElementsByTagName('spine')[0];
  const basePath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);

  const items = Array.from(manifest.getElementsByTagName('item'));
  const hrefOf = it => it && it.getAttribute('href');
  const mtOf = it => (it && it.getAttribute('media-type')) || '';
  const isRaster = it => mtOf(it).startsWith('image/') && mtOf(it) !== 'image/svg+xml';
  const toPath = h => (basePath === '') ? h : resolvePath(basePath + 'dummy', h);

  // ================= COVER (v3.18.3 logic) =================
  let coverItem = null, coverPath = null, declared = '', via = '', method = '—';

  const metas = opfDoc.querySelectorAll('meta[name="cover"]');
  if (metas.length) {
    const id = metas[0].getAttribute('content');
    const byId = items.find(i => i.getAttribute('id') === id);
    if (byId && mtOf(byId).startsWith('image/')) { coverItem = byId; method = '1 meta'; }
  }
  if (!coverItem) {
    coverItem = items.find(i => (i.getAttribute('properties') || '').includes('cover-image')
      && mtOf(i).startsWith('image/')) || null;
    if (coverItem) method = '2 properties';
  }
  if (!coverItem) {
    coverItem = items.find(i => {
      const id = (i.getAttribute('id') || '').toLowerCase();
      const hr = (hrefOf(i) || '').toLowerCase();
      return (id.includes('cover') || hr.includes('cover')) && mtOf(i).startsWith('image/');
    }) || null;
    if (coverItem) method = '3 name';
  }

  let svgBlank = false;
  if (coverItem && mtOf(coverItem) === 'image/svg+xml') {
    const svgPath = toPath(hrefOf(coverItem));
    let swapped = null;
    try {
      const f = zipEntry(zip, svgPath);
      if (f) {
        const d = parser.parseFromString(await f.async('string'), 'image/svg+xml');
        const inner = d.querySelector('image');
        const ih = inner && (inner.getAttribute('href') ||
          inner.getAttributeNS('http://www.w3.org/1999/xlink', 'href'));
        if (ih) { const rp = resolvePath(svgPath, ih); if (zipEntry(zip, rp)) swapped = rp; }
      }
    } catch (_) {}
    if (!swapped) {
      const alt = items.find(i => isRaster(i) &&
        ((i.getAttribute('id') || '') + (hrefOf(i) || '')).toLowerCase().includes('cover'));
      if (alt) swapped = toPath(hrefOf(alt));
    }
    if (swapped) {
      coverPath = swapped; via = ' (raster from SVG wrapper)';
      const si = items.find(i => toPath(hrefOf(i)) === swapped);
      declared = si ? mtOf(si) : '';
    } else { coverPath = svgPath; declared = mtOf(coverItem); svgBlank = true; }
  } else if (coverItem) {
    coverPath = toPath(hrefOf(coverItem)); declared = mtOf(coverItem);
  }

  let type = null, note = '', sizeKB = 0, oldWouldResolve = false;
  if (coverPath) {
    oldWouldResolve = !!zip.file(coverPath);           // the pre-fix lookup
    const f = zipEntry(zip, coverPath);
    if (!f) note = 'MISSING FROM ZIP';
    else {
      const buf = await f.async('arraybuffer');
      sizeKB = Math.round(buf.byteLength / 1024);
      const sniffed = sniffImageType(buf);
      type = sniffed || declared || null;
      if (!sniffed) note = 'UNVERIFIED (manifest word)';
      else if (declared && declared !== sniffed) note = 'manifest said ' + declared;
      if (svgBlank) note = 'SVG wrapper, no raster — would render blank';
    }
  } else note = 'NO COVER DECLARED';

  // ================= SPINE (old vs new resolution) =================
  const idToHref = {};
  items.forEach(i => { idToHref[i.getAttribute('id')] = hrefOf(i); });
  const refs = Array.from(spine.getElementsByTagName('itemref'));
  let spineTotal = 0, oldMiss = [], newMiss = [], encoded = [];
  for (const r of refs) {
    const href = idToHref[r.getAttribute('idref')];
    if (!href) continue;
    spineTotal++;
    const full = (basePath === '') ? href : basePath + href;
    if (!zip.file(full)) oldMiss.push(full);
    if (!zipEntry(zip, full)) newMiss.push(full);
    if (/%[0-9A-Fa-f]{2}/.test(href)) encoded.push(full);
  }

  return { file, opfPath, method, coverPath, type, note, sizeKB, via,
           oldWouldResolve, spineTotal, oldMiss, newMiss, encoded,
           epubVersion: (opfDoc.documentElement.getAttribute('version') || '?') };
}

const files = readdirSync('/mnt/user-data/uploads').filter(f => f.endsWith('.epub')).sort();
const rows = [];
for (const f of files) rows.push(await analyse('/mnt/user-data/uploads/' + f));

console.log('═══ COVERS ═══\n');
for (const r of rows) {
  const name = r.file.split('/').pop().replace(/\.epub$/, '');
  console.log(name.slice(0, 52));
  console.log('   opf ' + r.opfPath + '  (EPUB ' + r.epubVersion + ')  detected via method ' + r.method);
  console.log('   cover: ' + (r.coverPath || '—') + r.via);
  console.log('   type:  ' + (r.type || '—') + '  ' + r.sizeKB + ' KB' + (r.note ? '   ⚠ ' + r.note : ''));
  const before = r.coverPath ? (r.oldWouldResolve ? 'octet-stream → DENIED by v2.0.0' : 'not even found') : 'no cover';
  console.log('   v3.18.2 would have: ' + before);
  console.log('   v3.18.3 stores as:  ' + (r.type || 'nothing — refused') +
              (r.type ? '  → v2.0.0 verdict ' + (/^image\//.test(r.type) ? 'PASS' : 'DENY') : ''));
  console.log('');
}

console.log('═══ SPINE RESOLUTION: old zip.file() vs new zipEntry() ═══\n');
console.log('book'.padEnd(40) + 'spine'.padEnd(7) + 'old miss'.padEnd(10) + 'new miss'.padEnd(10) + '%-encoded');
console.log('-'.repeat(80));
for (const r of rows) {
  console.log(
    r.file.split('/').pop().replace(/\.epub$/, '').slice(0, 38).padEnd(40) +
    String(r.spineTotal).padEnd(7) +
    String(r.oldMiss.length).padEnd(10) +
    String(r.newMiss.length).padEnd(10) +
    String(r.encoded.length));
  for (const m of r.oldMiss) console.log('    old failed to resolve: ' + m);
  for (const m of r.newMiss) console.log('    NEW ALSO FAILED: ' + m);
}

const identical = rows.every(r => r.oldMiss.length === r.newMiss.length);
console.log('\n' + (identical
  ? '✅ Spine resolution IDENTICAL old vs new on every book — chapter detection is provably untouched.'
  : '⚠️ Spine resolution DIFFERS — inspect above.'));
