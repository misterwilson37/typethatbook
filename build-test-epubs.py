#!/usr/bin/env python3
"""
Builds two small test EPUBs for TypeThatBook, deliberately shaped to exercise
every fix made in Round 5. Original text, so there is no licence question about
the fixture itself.

  ttb-test-flat.epub    2 chapters, flat ids (1, 2)
  ttb-test-parts.epub   2 chapters in 2 PARTS, ids 1.01 and 2.01

Two books rather than one so a failure isolates. The flat book answers "does the
basic loop work?" and the parts book answers "do the ordinal fixes work?" — the
part-numbered path is where every parseInt-on-an-id bug lived, and it is the one
worth a separate run.

Deliberate traps, each aimed at a specific fix:

  cover.xhtml         0 paragraphs -> must be DROPPED (segments.length > 0 guard)
  halftitle.xhtml     heading only, 0 paragraphs -> must be DROPPED
  imprint.xhtml       -> front matter AND about:true, auto-detected
  colophon.xhtml      -> back matter AND about:true
  uncopyright.xhtml   -> back matter AND about:true
  titlepage/dedication-> front matter, about:FALSE (not credits)
  appendix.xhtml      -> back matter, about:false
  "endnotes page"     href is PERCENT-ENCODED -> tests zipEntry() (v3.18.3)
  toc.xhtml LAST      matches FRONT_MATTER_FILE but sits after the body, so Fix A
                      (v3.18.4) must reclassify it BACK, not leave it at id 0.x
  chapter text        stuffed with apostrophes -> Firefox Quick Find (game.js
                      v3.9.3); curly quotes and em dashes -> character cleaner

Word counts are ~300 per chapter: at 100 wpm that is about three minutes each, so
the whole book including the completion screen fits in well under twenty.
"""
import os, re, html, zipfile, shutil, sys

OUT_DIR = '/mnt/user-data/outputs'
WORK = '/home/claude/testbooks'

CH1 = [
    "Marisol found the machine on a Tuesday, which she'd later decide was the most ordinary day of her life up to that point.",
    "It sat in the back room of her grandmother's shop, under a bedsheet, humming.",
    "Nothing in the shop hummed. The clocks ticked, the floorboards complained, and the kettle whistled when it felt like it \u2014 but nothing hummed.",
    "\u201cThat's not for touching,\u201d her grandmother said from the doorway, without turning around. Marisol hadn't heard her come in. She never did.",
    "\u201cWhat is it?\u201d",
    "\u201cIt's a machine.\u201d",
    "\u201cI can see that. What does it do?\u201d",
    "Her grandmother set down a box of brass hinges and considered the question with more care than Marisol expected.",
    "\u201cIt asks questions,\u201d she said finally. \u201cAnd it doesn't like being wrong.\u201d",
    "Marisol waited for the rest. There wasn't any rest.",
    "That night she couldn't sleep. She'd catalogued eleven possible explanations by midnight and thrown out nine of them by one o'clock. The two survivors were: it's a clock that's forgotten how to be a clock, or it's something nobody's given a name to yet.",
    "She preferred the second one. Naming things was her favourite part of anything.",
    "At half past two she gave up on sleeping, took the stairs two at a time, and pulled the bedsheet off.",
    "The machine was made of brass and something darker, and it had a slot at the front about the width of a postcard. Above the slot, stamped into the metal, were four words: ASK ME SOMETHING HARD.",
    "\u201cAll right,\u201d Marisol said. \u201cAll right, then.\u201d",
]

CH2 = [
    "It took her three days to work out that the machine didn't want questions at all. It wanted arguments.",
    "She'd fed it seventeen postcards. Why is the sky blue \u2014 nothing. What's the largest number \u2014 nothing. How do birds know which way is south \u2014 the machine had hummed a little louder, then gone back to its ordinary hum, which she'd started thinking of as its bored hum.",
    "But when she wrote \u201cthe largest number is the one I say it is, and I say it's eleven,\u201d the whole thing shuddered and spat the card back out with a single word pressed into it: PROVE IT.",
    "Marisol sat down on the floor of the back room and laughed until her grandmother came to see what was wrong.",
    "\u201cIt argued with me,\u201d she said.",
    "\u201cIt does that.\u201d",
    "\u201cYou could have told me.\u201d",
    "\u201cYou'd have believed me,\u201d her grandmother said, \u201cand then you wouldn't have found out.\u201d",
    "That, Marisol thought, was an extremely annoying thing to be right about.",
    "She wrote back: \u201cI can't prove it. That's the point. Eleven is the largest number I'm willing to argue for today, and tomorrow I might argue for something bigger, and the number itself doesn't care either way.\u201d",
    "The machine was quiet for a long time. Long enough that she wondered whether she'd broken it.",
    "Then it printed one more card, and the card said: BETTER.",
    "Marisol pinned it above her desk, where it stayed for eleven years \u2014 which was, she'd point out later, a perfectly reasonable length of time for the largest number to hold its position.",
]

FRONT = [
    ('titlepage.xhtml', 'frontmatter titlepage', 'Title Page', [
        "The Machine in the Back Room", "A Test Fixture in Two Chapters"]),
    ('imprint.xhtml', 'frontmatter imprint', 'Imprint', [
        "The Machine in the Back Room was written to test the TypeThatBook importer. "
        "The text is original and is dedicated to the public domain under CC0 1.0.",
        "Anyone may copy, change, or reuse it for any purpose, with or without credit.",
        "CC0 1.0 Universal: https://creativecommons.org/publicdomain/zero/1.0/",
        "This page exists so that the About this book view has a notice to display. "
        "If you can read this inside the app, the attribution path works."]),
    ('dedication.xhtml', 'frontmatter dedication', 'Dedication', [
        "For everyone who has ever pulled the sheet off the machine."]),
    ('halftitle.xhtml', 'frontmatter halftitlepage', 'Half Title', []),
]

BACK = [
    ('appendix.xhtml', 'backmatter appendix', 'Appendix', [
        "A note on the largest number: the argument in Chapter 2 is not a real "
        "mathematical claim, and Marisol knows it. The machine's reply is the point.",
        "This page is back matter that is NOT part of the credits, so it should "
        "arrive with the About toggle switched off."]),
    ('endnotes page.xhtml', 'backmatter endnotes', 'Endnotes', [
        "This file's name contains a space. The manifest refers to it as "
        "endnotes%20page.xhtml, which is what the EPUB specification requires.",
        "If this page imported at all, percent-decoding works. Before v3.18.3 the "
        "importer would have thrown a TypeError here and lost the whole book."]),
    ('colophon.xhtml', 'backmatter colophon', 'Colophon', [
        "Set in whatever your browser feels like. Produced as a test fixture, not "
        "as a book anyone should read twice.",
        "This page should arrive with the About toggle switched ON, detected from "
        "its filename."]),
    ('uncopyright.xhtml', 'backmatter colophon', 'Uncopyright', [
        "This work is dedicated to the public domain under CC0 1.0 Universal.",
        "The person who associated a work with this deed has dedicated the work to "
        "the public domain by waiving all rights to the work worldwide under "
        "copyright law.",
        "This page should ALSO arrive with About switched on, which is the point: "
        "the About view must handle MORE THAN ONE page."]),
    # ⚠️ LAST in the spine, and its filename matches FRONT_MATTER_FILE. Fix A must
    # notice that body matter has already been seen and file it as BACK.
    ('toc.xhtml', '', 'Table of Contents', [
        "1. The Machine in the Back Room",
        "2. What the Machine Wanted",
        "This page is named toc.xhtml, which the importer's front-matter filename "
        "rule matches \u2014 but it sits AFTER the story. It must be classified as BACK "
        "matter (id 900.x), not front (0.x). If it shows up as 0.4, Fix A regressed."]),
]


def make_cover(path):
    from PIL import Image, ImageDraw
    img = Image.new('RGB', (900, 1350), (28, 42, 58))
    d = ImageDraw.Draw(img)
    d.rectangle([40, 40, 860, 1310], outline=(196, 158, 86), width=6)
    for i, line in enumerate(['THE MACHINE', 'IN THE', 'BACK ROOM']):
        d.text((90, 220 + i * 90), line, fill=(240, 232, 214))
    d.text((90, 600), 'A TEST FIXTURE', fill=(196, 158, 86))
    d.text((90, 1180), 'TypeThatBook', fill=(150, 160, 170))
    d.rectangle([90, 700, 810, 706], fill=(196, 158, 86))
    img.save(path, 'JPEG', quality=88)


def xhtml(title, epubtype, heading, paras):
    body = ''
    if heading:
        body += '    <h1>%s</h1>\n' % html.escape(heading)
    for p in paras:
        body += '    <p>%s</p>\n' % html.escape(p)
    sec = ' epub:type="%s"' % epubtype if epubtype else ''
    return ('<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n'
            '<html xmlns="http://www.w3.org/1999/xhtml" '
            'xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en-US" lang="en-US">\n'
            '<head>\n  <title>%s</title>\n  <meta charset="utf-8"/>\n</head>\n'
            '<body>\n  <section%s>\n%s  </section>\n</body>\n</html>\n'
            % (html.escape(title), sec, body))


def build(kind):
    """kind='flat' -> chapter-1/chapter-2 ; kind='parts' -> chapter-1-1/chapter-2-1"""
    root = os.path.join(WORK, kind)
    if os.path.exists(root):
        shutil.rmtree(root)
    oebps = os.path.join(root, 'EPUB')
    os.makedirs(os.path.join(oebps, 'text'))
    os.makedirs(os.path.join(oebps, 'images'))
    make_cover(os.path.join(oebps, 'images', 'cover.jpg'))

    if kind == 'flat':
        chapfiles = [('chapter-1.xhtml', 'Chapter 1', CH1),
                     ('chapter-2.xhtml', 'Chapter 2', CH2)]
    else:
        chapfiles = [('chapter-1-1.xhtml', 'Chapter 1', CH1),
                     ('chapter-2-1.xhtml', 'Chapter 1', CH2)]

    plan = []
    # A cover page with no prose: must be dropped by the segments guard.
    plan.append(('cover.xhtml', 'frontmatter cover', 'Cover', [], None))
    for f, etype, nav, paras in FRONT:
        plan.append((f, etype, nav, paras, None))
    for f, heading, paras in chapfiles:
        plan.append((f, 'bodymatter chapter', heading, paras, heading))
    for f, etype, nav, paras in BACK:
        plan.append((f, etype, nav, paras, None))

    manifest, spine, navitems = [], [], []
    for f, etype, nav, paras, heading in plan:
        head = heading if heading else nav
        open(os.path.join(oebps, 'text', f), 'w', encoding='utf-8').write(
            xhtml(nav, etype, head, paras))
        href = 'text/' + f.replace(' ', '%20')
        ident = re.sub(r'[^A-Za-z0-9]+', '-', f.replace('.xhtml', '')).strip('-')
        manifest.append('    <item id="%s" href="%s" media-type="application/xhtml+xml"/>'
                        % (ident, href))
        spine.append('    <itemref idref="%s"/>' % ident)
        navitems.append('      <li><a href="%s">%s</a></li>' % (href, html.escape(nav)))

    open(os.path.join(oebps, 'nav.xhtml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n'
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" '
        'xml:lang="en-US" lang="en-US">\n<head>\n  <title>Contents</title>\n'
        '  <meta charset="utf-8"/>\n</head>\n<body>\n  <nav epub:type="toc" id="toc">\n'
        '    <h1>Contents</h1>\n    <ol>\n' + '\n'.join(navitems) +
        '\n    </ol>\n  </nav>\n</body>\n</html>\n')

    ncx = '\n'.join(
        '    <navPoint id="np%d" playOrder="%d"><navLabel><text>%s</text></navLabel>'
        '<content src="text/%s"/></navPoint>'
        % (i + 1, i + 1, html.escape(t[2]), t[0].replace(' ', '%20'))
        for i, t in enumerate(plan))
    open(os.path.join(oebps, 'toc.ncx'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n'
        '  <head><meta name="dtb:uid" content="ttb-test-%s"/></head>\n'
        '  <docTitle><text>The Machine in the Back Room</text></docTitle>\n'
        '  <navMap>\n%s\n  </navMap>\n</ncx>\n' % (kind, ncx))

    title = ('The Machine in the Back Room'
             + (' (Parts Edition)' if kind == 'parts' else ' (Flat Edition)'))
    open(os.path.join(oebps, 'content.opf'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">\n'
        '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n'
        '    <dc:identifier id="uid">ttb-test-%s</dc:identifier>\n'
        '    <dc:title>%s</dc:title>\n'
        '    <dc:language>en-US</dc:language>\n'
        '    <dc:creator>TypeThatBook Test Fixture</dc:creator>\n'
        '    <dc:publisher>TypeThatBook</dc:publisher>\n'
        '    <dc:subject>Humor</dc:subject>\n'
        '    <dc:rights>CC0 1.0 Public Domain Dedication '
        'https://creativecommons.org/publicdomain/zero/1.0/</dc:rights>\n'
        '    <dc:source>TypeThatBook test fixtures</dc:source>\n'
        '    <meta property="dcterms:modified">2026-08-05T00:00:00Z</meta>\n'
        '    <meta name="cover" content="cover-img"/>\n'
        '  </metadata>\n  <manifest>\n'
        '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n'
        '    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n'
        '    <item id="cover-img" href="images/cover.jpg" media-type="image/jpeg" '
        'properties="cover-image"/>\n' + '\n'.join(manifest) +
        '\n  </manifest>\n  <spine toc="ncx">\n' + '\n'.join(spine) +
        '\n  </spine>\n</package>\n' % () if False else
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">\n'
        '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n'
        '    <dc:identifier id="uid">ttb-test-' + kind + '</dc:identifier>\n'
        '    <dc:title>' + html.escape(title) + '</dc:title>\n'
        '    <dc:language>en-US</dc:language>\n'
        '    <dc:creator>TypeThatBook Test Fixture</dc:creator>\n'
        '    <dc:publisher>TypeThatBook</dc:publisher>\n'
        '    <dc:subject>Humor</dc:subject>\n'
        '    <dc:rights>CC0 1.0 Public Domain Dedication '
        'https://creativecommons.org/publicdomain/zero/1.0/</dc:rights>\n'
        '    <dc:source>TypeThatBook test fixtures</dc:source>\n'
        '    <meta property="dcterms:modified">2026-08-05T00:00:00Z</meta>\n'
        '    <meta name="cover" content="cover-img"/>\n'
        '  </metadata>\n  <manifest>\n'
        '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n'
        '    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n'
        '    <item id="cover-img" href="images/cover.jpg" media-type="image/jpeg" '
        'properties="cover-image"/>\n' + '\n'.join(manifest) +
        '\n  </manifest>\n  <spine toc="ncx">\n' + '\n'.join(spine) +
        '\n  </spine>\n</package>\n')

    os.makedirs(os.path.join(root, 'META-INF'))
    open(os.path.join(root, 'META-INF', 'container.xml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n'
        '  <rootfiles>\n    <rootfile full-path="EPUB/content.opf" '
        'media-type="application/oebps-package+xml"/>\n  </rootfiles>\n</container>\n')
    open(os.path.join(root, 'mimetype'), 'w').write('application/epub+zip')

    epub = os.path.join(OUT_DIR, 'ttb-test-%s.epub' % kind)
    if os.path.exists(epub):
        os.remove(epub)
    with zipfile.ZipFile(epub, 'w') as z:
        z.write(os.path.join(root, 'mimetype'), 'mimetype', compress_type=zipfile.ZIP_STORED)
        for r, _, fs in os.walk(root):
            for f in sorted(fs):
                full = os.path.join(r, f)
                rel = os.path.relpath(full, root)
                if rel == 'mimetype':
                    continue
                z.write(full, rel, compress_type=zipfile.ZIP_DEFLATED)

    w1 = sum(len(p.split()) for p in CH1)
    w2 = sum(len(p.split()) for p in CH2)
    return epub, w1, w2, len(plan)


os.makedirs(OUT_DIR, exist_ok=True)
for kind in ('flat', 'parts'):
    epub, w1, w2, n = build(kind)
    print('%-40s %2d spine docs  ch1=%d words  ch2=%d words  total=%d (~%d min at 100wpm)  %d KB'
          % (os.path.basename(epub), n, w1, w2, w1 + w2, round((w1 + w2) / 100),
             os.path.getsize(epub) // 1024))
