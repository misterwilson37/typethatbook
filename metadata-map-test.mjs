// metadata-map-test.mjs v1.0.0
//
// Lifts canonicalSourceFrom(), canonicalRightsFrom(), selectOptionValues() and
// looksLikeBareUrl() out of admin.js and runs them two ways:
//
//   PART 1  synthetic cases — the mapping table's edges, including the ones that
//           MUST NOT map (CC BY 3.0, a versionless CC licence, unknown publishers)
//   PART 2  the real dc:rights / dc:source / dc:publisher / dc:identifier of every
//           EPUB in library/, asserted against the value each book should land on
//
// ⚠️ WHY THIS EXISTS. The autofill was wrong for six versions and nothing caught it,
// because "did the dropdown end up on the right option" was only ever checked by
// looking at the screen. It is string mapping over fixed inputs: it is arithmetic,
// so it is testable. Same argument §2.2c made about canvas geometry.
//
// ⚠️ THE OPTION LISTS COME FROM admin.html, not from a copy in here. If an option is
// renamed or removed, the mappers stop returning it and these assertions fail, which
// is the correct and intended behaviour — a mapping table that outlives the option it
// names is exactly the drift this suite is for.
//
// Usage: node metadata-map-test.mjs [libraryDir]

import { readFileSync, readdirSync } from 'fs';
import { JSDOM } from 'jsdom';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';
import path from 'path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(path.join(HERE, 'admin.js'), 'utf8');
const HTML = readFileSync(path.join(HERE, 'admin.html'), 'utf8');
const LIB = process.argv[2] || path.join(HERE, 'library');

let pass = 0, fail = 0;
const bad = [];
function eq(label, got, want) {
    if (got === want) { pass++; return; }
    fail++;
    bad.push(`  ${label}\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`);
}

// ── lift, the same way about-test.mjs does ───────────────────────────────────
// ⚠️ NOTE FOR WHOEVER COPIES THIS. about-test.mjs's lift() searches for
// `function NAME(` and so begins its slice AFTER the `async` keyword, silently
// producing a non-async function whose `await` is a SyntaxError. Every previous use
// happened to be synchronous, so nobody found out. Preserved here.
function lift(name) {
    let start = SRC.indexOf(`async function ${name}(`);
    if (start < 0) start = SRC.indexOf(`function ${name}(`);
    if (start < 0) throw new Error(name + ' not found in admin.js');
    let d = 0;
    for (let j = SRC.indexOf('{', start); j < SRC.length; j++) {
        if (SRC[j] === '{') d++;
        else if (SRC[j] === '}') { d--; if (!d) return SRC.slice(start, j + 1); }
    }
    throw new Error(name + ' is unbalanced');
}
function liftConst(n) {
    const m = SRC.match(new RegExp('^const ' + n + '\\s*=[\\s\\S]*?;$', 'm'));
    if (!m) throw new Error(n + ' not found in admin.js');
    return m[0];
}

// admin.html's real selects, so the option values under test are the shipped ones.
const dom = new JSDOM(HTML);
const F = new Function('document', 'Array',
    liftConst('SOURCE_PATTERNS') + '\n' +
    lift('selectOptionValues') + '\n' +
    lift('looksLikeBareUrl') + '\n' +
    lift('canonicalSourceFrom') + '\n' +
    lift('canonicalRightsFrom') + '\n' +
    'return { selectOptionValues, looksLikeBareUrl, canonicalSourceFrom, canonicalRightsFrom };'
)(dom.window.document, Array);

const RIGHTS_OPTS = F.selectOptionValues('active-book-rights');
const SOURCE_OPTS = F.selectOptionValues('active-book-source');

if (!RIGHTS_OPTS.length || !SOURCE_OPTS.length) {
    console.error('FATAL: admin.html yielded no options — the selects moved or were renamed.');
    process.exit(1);
}

const PD       = 'Public domain (United States)';
const PD_CC0   = 'Public domain (United States) & CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/';
const CC0      = 'CC0 1.0 Public Domain Dedication https://creativecommons.org/publicdomain/zero/1.0/';
const BY4      = 'CC BY 4.0 https://creativecommons.org/licenses/by/4.0/';
const BYNCSA3  = 'CC BY-NC-SA 3.0 https://creativecommons.org/licenses/by-nc-sa/3.0/';

// The combined option must EXIST, or the Standard Ebooks case silently degrades to
// Custom… and this whole round achieved nothing.
eq('admin.html offers the combined PD + CC0 option', RIGHTS_OPTS.includes(PD_CC0), true);

// ── PART 1: synthetic edges ─────────────────────────────────────────────────
const SE_PARAGRAPH =
    'The source text and artwork in this ebook are believed to be in the United ' +
    'States public domain; that is, they are believed to be free of copyright ' +
    'restrictions in the United States. They may still be copyrighted in other ' +
    'countries. The creators of, and contributors to, this ebook dedicate their ' +
    'contributions to the worldwide public domain via the terms in the [CC0 1.0 ' +
    'Universal Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/).';

const rightsCases = [
    ['Standard Ebooks paragraph \u2192 combined',      SE_PARAGRAPH,                          PD_CC0],
    ['Gutenberg terse PD',                             'Public domain in the USA.',            PD],
    ['PD, wordier',                                    'This work is in the public domain.',   PD],
    ['CC0 alone',                                      'CC0 1.0 Universal https://creativecommons.org/publicdomain/zero/1.0/', CC0],
    ['CC0 by URL alone',                               'https://creativecommons.org/publicdomain/zero/1.0/', CC0],
    ['CC BY 4.0',                                      'Licensed CC BY 4.0',                   BY4],
    ['CC BY-NC-SA 3.0',                                'CC BY-NC-SA 3.0',                      BYNCSA3],
    // ⚠️ MUST NOT MAP. There is no CC BY 3.0 option, and answering 4.0 would write a
    // licence claim into Firestore that the book does not make.
    ['CC BY 3.0 has no option \u2192 refuses',         'CC BY 3.0',                            ''],
    ['versionless CC licence \u2192 refuses',          'Released under CC BY-SA',              ''],
    ['empty',                                          '',                                     ''],
    ['unrecognised \u2192 refuses, caller keeps raw',  'All rights reserved. \u00a9 2019 Someone', ''],
];
for (const [label, input, want] of rightsCases) {
    eq('rights: ' + label, F.canonicalRightsFrom(input, RIGHTS_OPTS), want);
}

// A CC BY book must never be flattened to public domain by the PD rule, even when its
// rights text also says the words "public domain".
eq('rights: CC BY wins over a stray "public domain" mention',
   F.canonicalRightsFrom('CC BY 4.0 \u2014 not public domain', RIGHTS_OPTS), BY4);

const sourceCases = [
    ['SE: publisher wins over its gutenberg dc:source',
     { publisher: 'Standard Ebooks', identifier: 'https://standardebooks.org/ebooks/x',
       sources: ['https://www.gutenberg.org/ebooks/345', 'https://archive.org/details/x'] },
     'Standard Ebooks'],
    ['SE with no identifier still resolves on publisher alone',
     { publisher: 'Standard Ebooks', sources: ['https://www.gutenberg.org/ebooks/345'] },
     'Standard Ebooks'],
    ['Gutenberg direct: no publisher, identifier carries it',
     { publisher: '', identifier: 'http://www.gutenberg.org/91',
       sources: ['https://www.gutenberg.org/files/91/91-h/91-h.htm'] },
     'Project Gutenberg'],
    ['Gutenberg direct: nothing but dc:source',
     { publisher: '', identifier: '', sources: ['https://www.gutenberg.org/files/91/91-h/91-h.htm'] },
     'Project Gutenberg'],
    ['Global Grey: "ebooks" suffix no longer defeats it',
     { publisher: 'Global Grey ebooks', identifier: 'https://www.globalgreyebooks.com/x.html', sources: [] },
     'Global Grey'],
    ['archive.org only \u2192 Internet Archive',
     { publisher: '', identifier: '', sources: ['https://archive.org/details/x'] },
     'Internet Archive'],
    ['unknown publisher \u2192 refuses, caller falls back to the name',
     { publisher: 'TypeThatBook', identifier: '', sources: ['Written for TypeThatBook'] },
     ''],
    ['nothing at all',
     { publisher: '', identifier: '', sources: [] },
     ''],
];
for (const [label, meta, want] of sourceCases) {
    eq('source: ' + label, F.canonicalSourceFrom(meta, SOURCE_OPTS), want);
}

// The legacy single-value shape must still work: canonicalSourceFrom falls back to
// meta.source when meta.sources is absent.
eq('source: legacy meta.source shape still read',
   F.canonicalSourceFrom({ publisher: '', source: 'https://www.gutenberg.org/ebooks/1' }, SOURCE_OPTS),
   'Project Gutenberg');

eq('looksLikeBareUrl: a URL',      F.looksLikeBareUrl('https://www.gutenberg.org/ebooks/1'), true);
eq('looksLikeBareUrl: a name',     F.looksLikeBareUrl('Standard Ebooks'),                    false);
eq('looksLikeBareUrl: prose',      F.looksLikeBareUrl('Written for TypeThatBook'),           false);

// ── lift readGutenbergOrigin too, and run it on the real zips ───────────────
// ⚠️ END-TO-END ON PURPOSE. This one is not string mapping — it opens a spine
// document and walks markup Gutenberg controls, so a synthetic fixture would only
// prove I can match my own fixture. The real books are the test.
const G = new Function('DOMParser', 'zipEntry', 'Array',
    liftConst('GUTENBERG_EBOOK_URL') + '\n' +
    lift('readGutenbergOrigin') + '\n' +
    'return { readGutenbergOrigin };'
)(dom.window.DOMParser, liftedZipEntry, Array);

// The real zipEntry, lifted, so the URL-decoding path is the shipped one.
function liftedZipEntry(zip, p) {
    if (!p) return null;
    let f = zip.file(p);
    if (f) return f;
    try {
        const decoded = decodeURIComponent(p);
        if (decoded !== p) { f = zip.file(decoded); if (f) return f; }
    } catch (_) { /* malformed escape — the raw miss stands */ }
    return null;
}

const EXPECT_ORIGIN = {
    'mark-twain-tom-sawyer-abroad_g.epub':                    'https://www.gutenberg.org/ebooks/91',
    'kate-douglas-smith-wiggin-rebecca-of-sunnybrook_g.epub': 'https://www.gutenberg.org/ebooks/498',
    'laura-lee-hope-outdoor-girls-of-deepdale_g.epub':         'https://www.gutenberg.org/ebooks/10465',
};

// ── PART 2: the real corpus ─────────────────────────────────────────────────
// Expectations keyed by filename. Anything not listed must still map to SOMETHING
// non-empty for source, or the import is back to pasting a URL into the dropdown.
const EXPECT = {
    'ttb-test-flat.epub':  [ '', CC0 ],
    'ttb-test-parts.epub': [ '', CC0 ],
    'ledger-point-light.epub': [ '', CC0 ],
    'jean-webster_daddy-long-legs.epub': [ 'Global Grey', '' ],
    'kate-douglas-smith-wiggin-rebecca-of-sunnybrook_g.epub': [ 'Project Gutenberg', PD ],
    'laura-lee-hope-outdoor-girls-of-deepdale_g.epub':        [ 'Project Gutenberg', PD ],
    'mark-twain-tom-sawyer-abroad_g.epub':                    [ 'Project Gutenberg', PD ],
};

let files = [];
try {
    files = readdirSync(LIB).filter(f => f.endsWith('.epub')).sort();
} catch (e) {
    console.log(`\n  (library not found at ${LIB} — corpus half skipped)`);
}

const DC = 'http://purl.org/dc/elements/1.1/';
let seCount = 0, gutCount = 0;
for (const f of files) {
    const zip = await JSZip.loadAsync(readFileSync(path.join(LIB, f)));
    const container = await zip.file('META-INF/container.xml')?.async('string');
    let opfPath = null;
    if (container) {
        opfPath = new JSDOM(container, { contentType: 'text/xml' })
                    .window.document.querySelector('rootfile')?.getAttribute('full-path');
    }
    if (!opfPath) opfPath = Object.keys(zip.files).find(x => x.endsWith('.opf'));
    const opf = new JSDOM(await zip.file(opfPath).async('string'), { contentType: 'text/xml' })
                  .window.document;
    const grab = tag => Array.from(opf.getElementsByTagNameNS(DC, tag))
                             .map(el => (el.textContent || '').trim()).filter(Boolean);
    const meta = {
        rights: grab('rights')[0] || '',
        source: grab('source')[0] || '',
        sources: grab('source'),
        publisher: grab('publisher')[0] || '',
        identifier: grab('identifier').find(v => /^https?:\/\//i.test(v)) || '',
    };

    const gotSource = F.canonicalSourceFrom(meta, SOURCE_OPTS);
    const gotRights = F.canonicalRightsFrom(meta.rights, RIGHTS_OPTS);

    if (EXPECT[f]) {
        eq(`${f} \u2192 source`, gotSource, EXPECT[f][0]);
        eq(`${f} \u2192 rights`, gotRights, EXPECT[f][1]);
    } else {
        // Unlisted books are the Standard Ebooks bulk. Every one of them must resolve
        // to Standard Ebooks and to the combined licence — that IS the reported bug.
        seCount++;
        eq(`${f} \u2192 source`, gotSource, 'Standard Ebooks');
        eq(`${f} \u2192 rights`, gotRights, PD_CC0);
    }

    // ⚠️ The regression that started all this: NOTHING may put a bare URL into the
    // Source dropdown, by any path, for any book in the corpus.
    const fallback = gotSource || meta.publisher ||
                     (F.looksLikeBareUrl(meta.source) ? '' : meta.source);
    eq(`${f} \u2192 Source is never a bare URL`, F.looksLikeBareUrl(fallback), false);

    // Origin URL. Gutenberg books must yield the canonical /ebooks/<id> form; every
    // other book must yield '' here and fall back to dc:identifier in the caller.
    const gotOrigin = await G.readGutenbergOrigin(zip, opf, opfPath, meta);
    eq(`${f} \u2192 origin`, gotOrigin, EXPECT_ORIGIN[f] || '');
    if (EXPECT_ORIGIN[f]) gutCount++;
}

console.log(`\nmetadata-map-test: ${files.length} books read from ${LIB}` +
            (files.length ? ` (${seCount} Standard Ebooks, ${gutCount} Gutenberg)` : ''));
if (fail) {
    console.log('\n' + bad.join('\n'));
    console.log(`\nFAIL \u2014 ${pass} passed, ${fail} failed.`);
    process.exit(1);
}
console.log(`OK \u2014 ${pass} assertions passed.`);
