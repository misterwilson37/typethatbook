#!/usr/bin/env python3
"""
Builds an EPUB 3 of "Augie and the Green Knight" from the KF8/MOBI Jake owns,
shaped specifically for the TypeThatBook importer (admin.js v3.19.1).

WHY NOT CALIBRE: the source is a KF8, which carries a complete EPUB inside it, so
there is nothing to "convert" — the job is to RESHAPE what is already there. The
InDesign export it came from has no <h1>-<h6> anywhere; chapter titles are
<p class="Basic-Paragraph"> like every other paragraph. That matters because:

  · classifyDocument() falls back to filename, then shape, when there is no
    epub:type — and the filenames are part0004.xhtml, which say nothing;
  · headingInfoOf() looks for headings to identify a chapter title AND to put it
    in titleEls so it gets removed from the typeable text. With no heading, the
    line "Chapter 1" becomes segment zero and a student types it as prose.

So this script emits, per document:
  · epub:type on a wrapping <section> (frontmatter/bodymatter/backmatter), which
    classifyDocument() treats as authoritative;
  · a semantic filename as well (titlepage, imprint, chapter-1, colophon), so the
    filename strategy agrees with the epub:type strategy rather than fighting it;
  · a real <h1> for the chapter number, so it is recognised and then excluded
    from what students type.

Also drops the InDesign spacer <p>s (empty paragraphs become empty segments) and
the Kindle auto-TOC (0 paragraphs, an artifact of kindlegen, replaced by a real
nav.xhtml).

LICENCE: CC BY-NC 3.0 Unported. Derivatives are permitted (no ND, no SA), which
is what makes this reshaping legitimate. Attribution is REQUIRED, so the
copyright/licence page is preserved verbatim as the imprint, Boulet is credited
as illustrator in dc:contributor, and dc:rights carries the licence URL.
"""
import os, re, sys, html, zipfile, shutil, warnings
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
warnings.filterwarnings('ignore', category=XMLParsedAsHTMLWarning)

SRC = sys.argv[1] if len(sys.argv) > 1 else None
OUT = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/augie/out'
TEXT = os.path.join(SRC, 'OEBPS', 'Text')
IMGS = os.path.join(SRC, 'OEBPS', 'Images')

# spine stem -> (output filename, epub:type, nav title)
PLAN = [
    ('part0000', 'acknowledgements.xhtml', 'frontmatter acknowledgements', 'Acknowledgements'),
    ('part0001', 'imprint.xhtml',          'frontmatter imprint',          'Imprint'),
    ('part0002', 'dedication.xhtml',       'frontmatter dedication',       'Dedication'),
    ('part0003', 'titlepage.xhtml',        'frontmatter titlepage',        'Title Page'),
]
for n in range(1, 20):
    PLAN.append(('part%04d' % (n + 3), 'chapter-%d.xhtml' % n, 'bodymatter chapter', 'Chapter %d' % n))
PLAN += [
    ('part0023', 'appendix.xhtml', 'backmatter appendix', 'Appendix'),
    ('part0024', 'endnotes.xhtml', 'backmatter endnotes', 'Endnotes'),
    ('part0025', 'colophon.xhtml', 'backmatter colophon', 'Colophon'),
]
# part0026 (the kindlegen auto-TOC) is deliberately dropped: 0 paragraphs, and a
# real nav.xhtml supersedes it. Leaving it in would add a spine entry that
# admin.js Fix A has to rescue from being filed as front matter at the END.

KEEP_INLINE = {'em', 'i', 'strong', 'b', 'sup', 'sub', 'br'}

def clean_paragraphs(soup):
    """Paragraph inner HTML with InDesign cruft removed. Empty paragraphs are
    dropped — an empty <p> becomes an empty typing segment, which is a chapter
    a student cannot finish."""
    out = []
    for p in soup.find_all('p'):
        for img in p.find_all(['img', 'image', 'svg']):
            img.decompose()
        for tag in p.find_all(True):
            if tag.name not in KEEP_INLINE:
                tag.unwrap()
            else:
                tag.attrs = {}
        txt = ' '.join(p.get_text().split())
        if not txt:
            continue
        inner = ''.join(str(c) for c in p.contents)
        inner = re.sub(r'\s+', ' ', inner).strip()
        if not inner:
            continue
        out.append(inner)
    return out

def xhtml(title, epubtype, heading, paras):
    body = ''
    if heading:
        body += '    <h1>%s</h1>\n' % html.escape(heading)
    for para in paras:
        body += '    <p>%s</p>\n' % para
    return ('<?xml version="1.0" encoding="utf-8"?>\n'
            '<!DOCTYPE html>\n'
            '<html xmlns="http://www.w3.org/1999/xhtml" '
            'xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en-CA" lang="en-CA">\n'
            '<head>\n  <title>%s</title>\n  <meta charset="utf-8"/>\n</head>\n'
            '<body>\n  <section epub:type="%s">\n%s  </section>\n</body>\n</html>\n'
            % (html.escape(title), epubtype, body))

def main():
    oebps = os.path.join(OUT, 'EPUB')
    for d in (os.path.join(oebps, 'text'), os.path.join(oebps, 'images')):
        os.makedirs(d, exist_ok=True)

    shutil.copy(os.path.join(IMGS, 'cover00125.jpeg'), os.path.join(oebps, 'images', 'cover.jpg'))

    manifest, spine, nav_items, report = [], [], [], []
    for stem, outname, etype, navtitle in PLAN:
        src = os.path.join(TEXT, stem + '.xhtml')
        soup = BeautifulSoup(open(src, encoding='utf-8').read(), 'lxml')
        paras = clean_paragraphs(soup)

        # EVERY document gets a real <h1>, not just the chapters. Front matter
        # without a heading falls through composeChapterTitle() to the running
        # counter, so the acknowledgements page came out titled "Chapter 1" — and
        # admin.js v3.18.4's filename rescue has no entry for "acknowledgements".
        # A heading fixes it at the source and gets excluded from the typeable
        # text either way, which a bare <p> title would not be.
        if paras and re.fullmatch(r'Chapter\s+\d+', paras[0].strip()):
            heading = paras.pop(0).strip()
        else:
            heading = navtitle
        open(os.path.join(oebps, 'text', outname), 'w', encoding='utf-8').write(
            xhtml(navtitle, etype, heading, paras))

        ident = outname.replace('.xhtml', '').replace('.', '-')
        manifest.append('    <item id="%s" href="text/%s" media-type="application/xhtml+xml"/>'
                        % (ident, outname))
        spine.append('    <itemref idref="%s"/>' % ident)
        nav_items.append('      <li><a href="text/%s">%s</a></li>' % (outname, html.escape(navtitle)))
        report.append((outname, etype.split()[0], len(paras), sum(len(re.sub('<[^>]+>', '', p).split()) for p in paras)))

    nav = ('<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n'
           '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" '
           'xml:lang="en-CA" lang="en-CA">\n<head>\n  <title>Contents</title>\n'
           '  <meta charset="utf-8"/>\n</head>\n<body>\n'
           '  <nav epub:type="toc" id="toc">\n    <h1>Contents</h1>\n    <ol>\n'
           + '\n'.join(nav_items) + '\n    </ol>\n  </nav>\n</body>\n</html>\n')
    open(os.path.join(oebps, 'nav.xhtml'), 'w', encoding='utf-8').write(nav)

    ncx_points = '\n'.join(
        '    <navPoint id="np%d" playOrder="%d"><navLabel><text>%s</text></navLabel>'
        '<content src="text/%s"/></navPoint>' % (i + 1, i + 1, html.escape(t[3]), t[1])
        for i, t in enumerate(PLAN))
    ncx = ('<?xml version="1.0" encoding="utf-8"?>\n'
           '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n'
           '  <head><meta name="dtb:uid" content="ttb-augie-green-knight"/></head>\n'
           '  <docTitle><text>Augie and the Green Knight</text></docTitle>\n'
           '  <navMap>\n' + ncx_points + '\n  </navMap>\n</ncx>\n')
    open(os.path.join(oebps, 'toc.ncx'), 'w', encoding='utf-8').write(ncx)

    opf = ('<?xml version="1.0" encoding="utf-8"?>\n'
           '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">\n'
           '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n'
           '    <dc:identifier id="uid">ttb-augie-green-knight</dc:identifier>\n'
           '    <dc:title>Augie and the Green Knight</dc:title>\n'
           '    <dc:language>en-CA</dc:language>\n'
           '    <dc:creator id="author">Zach Weinersmith</dc:creator>\n'
           '    <meta refines="#author" property="role" scheme="marc:relators">aut</meta>\n'
           '    <dc:contributor id="ill">Boulet</dc:contributor>\n'
           '    <meta refines="#ill" property="role" scheme="marc:relators">ill</meta>\n'
           '    <dc:date>2014-11-19</dc:date>\n'
           '    <dc:publisher>SMBC, LLC / Breadpig</dc:publisher>\n'
           '    <dc:rights>Copyright 2015 Zach Weinersmith. Licensed under Creative Commons '
           'Attribution-NonCommercial 3.0 Unported (CC BY-NC 3.0): '
           'http://creativecommons.org/licenses/by-nc/3.0/ . Illustrations by Boulet. '
           'Text-only edition reshaped from the KF8 release for use in a non-commercial '
           'classroom typing tutor; no changes to the words.</dc:rights>\n'
           '    <dc:source>ISBN 978-0-9785016-9-3</dc:source>\n'
           '    <dc:subject>Fantasy</dc:subject>\n'
           '    <meta property="dcterms:modified">2026-08-05T00:00:00Z</meta>\n'
           '    <meta name="cover" content="cover-img"/>\n'
           '  </metadata>\n  <manifest>\n'
           '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n'
           '    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n'
           '    <item id="cover-img" href="images/cover.jpg" media-type="image/jpeg" '
           'properties="cover-image"/>\n'
           + '\n'.join(manifest) + '\n  </manifest>\n'
           '  <spine toc="ncx">\n' + '\n'.join(spine) + '\n  </spine>\n</package>\n')
    open(os.path.join(oebps, 'content.opf'), 'w', encoding='utf-8').write(opf)

    os.makedirs(os.path.join(OUT, 'META-INF'), exist_ok=True)
    open(os.path.join(OUT, 'META-INF', 'container.xml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n'
        '  <rootfiles>\n'
        '    <rootfile full-path="EPUB/content.opf" media-type="application/oebps-package+xml"/>\n'
        '  </rootfiles>\n</container>\n')
    open(os.path.join(OUT, 'mimetype'), 'w').write('application/epub+zip')

    epub = '/mnt/user-data/outputs/augie-and-the-green-knight.epub'
    os.makedirs(os.path.dirname(epub), exist_ok=True)
    if os.path.exists(epub):
        os.remove(epub)
    with zipfile.ZipFile(epub, 'w') as z:
        # mimetype MUST be first and STORED, per the EPUB spec.
        z.write(os.path.join(OUT, 'mimetype'), 'mimetype', compress_type=zipfile.ZIP_STORED)
        for root, _, files in os.walk(OUT):
            for f in sorted(files):
                full = os.path.join(root, f)
                rel = os.path.relpath(full, OUT)
                if rel == 'mimetype':
                    continue
                z.write(full, rel, compress_type=zipfile.ZIP_DEFLATED)

    print('%-26s %-6s %5s %7s' % ('file', 'matter', 'paras', 'words'))
    print('-' * 50)
    tb = tw = 0
    for name, m, p, w in report:
        print('%-26s %-6s %5d %7d' % (name, m, p, w))
        if m == 'bodymatter':
            tb += 1; tw += w
    print('-' * 50)
    print('%d body chapters, %d words of body text' % (tb, tw))
    print('written: ' + epub + '  (%d KB)' % (os.path.getsize(epub) // 1024))

main()
