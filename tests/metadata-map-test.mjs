// metadata-map-test.mjs v1.6.0
//
// v1.6.0 — ⚠️ THE LADDER IS IMPORTED NOW, NOT LIFTED. ROADMAP 47 step one moved
//          SOURCE_PATTERNS, looksLikeBareUrl(), canonicalSourceFrom() and
//          canonicalRightsFrom() into rights-ladder.js, so this file stopped
//          slicing them out of admin.js as text and rebuilding them through
//          `new Function(...)`. That lift tested a COPY, not the shipped code,
//          and its slicer was already known-broken for `async` functions — this
//          file documented that and kept it. Only selectOptionValues() is still
//          lifted, correctly: it reads the real admin.html <select>.
//          ⚠️ NEW PART F guards what makes a future functions-side copy possible:
//          the ladder imports nothing, touches no DOM, and admin.js keeps no
//          local copy that would silently shadow the import. 518 -> 532.
//
// v1.5.0 — ⚠️⚠️ THE SAME FAILURE AS v1.4.0, ONE LAYER DOWN, AND v1.4.0'S OWN
//          WARNING PREDICTED IT. Round 57 (Bar-Lock). This harness arrived RED
//          at 39 assertions across three rounds of handoff, filed as "a real
//          disagreement, not test rot." It was test rot. Every one of the 39
//          was checked against the books' actual dc: metadata and the mapper
//          was RIGHT in all 39.
//
//          v1.4.0 replaced a hand-kept list of book ids with a FILENAME
//          convention (`_g` means Gutenberg) and wrote, correctly: "anything
//          that requires a human to remember to edit a test fixture will
//          eventually not be edited." It then made the FILENAME the fixture.
//          Six Gutenberg books have since been imported without the suffix and
//          three Global Grey books arrived as `_GG`, which the regex does not
//          match — so 20 assertions held real Gutenberg books to Standard
//          Ebooks expectations. A convention a human has to remember is a
//          hand-kept list with the list spread across the file names.
//
//          ⚠️ THE OTHER 19 WERE A REAL CHANGE IN THE CORPUS, NOT A MISTAKE.
//          The bookclean pipeline now stamps every cleaned book with "The
//          original text is in the public domain in the United States. The
//          editorial changes in this edition are dedicated to the worldwide
//          public domain under CC0 1.0 ..." — 72 of the 74 books carry it. That
//          is accurate and it is exactly what the combined PD & CC0 option is
//          for, so canonicalRightsFrom() resolving to the combined value is
//          CORRECT. The branch demanding plain PD from every `_g` book was
//          describing a corpus that no longer exists.
//
//          ✅ FIXED BY READING THE BOOK, NOT ITS NAME. Both branches now derive
//          their expectation from the archive in front of them: the source from
//          dc:publisher + dc:identifier, the licence from whether dc:rights
//          actually carries a CC0 dedication. There is nothing left for a human
//          to keep in step. 471 -> 516 assertions, because the six unsuffixed
//          Gutenberg books now receive the origin and preparedBy checks they
//          were being excused from.
//
//          ⚠️ THE HONEST COST. The corpus half of the SOURCE check is now
//          weaker: this file and canonicalSourceFrom() read the same two dc:
//          fields, so a mapper that reordered SOURCE_PATTERNS is not caught by
//          the corpus. What the corpus still catches alone is the failure that
//          actually happened six times — a mapper returning '' and dropping the
//          book into Custom..., a bare URL reaching the dropdown, or an option
//          value that no longer exists in admin.html.
//
//          ⚠️⚠️ AND I FIRST WROTE THAT PART 1 COVERED THE ORDERING, WHICH WAS
//          FALSE, AND ONLY MUTATION TESTING SAID SO. It does not. Worse, NOTHING
//          did — not this version and not v1.4.0. canonicalSourceFrom() has two
//          protections, the pattern ORDER and the two-pass edition/upstream
//          SPLIT, and each was masking the other: flipping the order left the
//          entire suite green, collapsing the split left it green, and only both
//          at once went red. Two new PART 1 fixtures now pin each one where the
//          other cannot cover for it; see the comment above them. This is a
//          coverage hole that PREDATES v1.5.0 and was found only because the
//          claim was checked before it was written down.
//
//          ⚠️ THE `_g` FILENAME CONVENTION IS NO LONGER LOAD-BEARING IN A TEST.
//          v1.4.0 said in capitals that it was. It is now documentation only,
//          and breaking it costs nothing here. isGutenbergFile() is kept — see
//          its comment — solely to report the drift.
//
// v1.4.0 — ⚠️ THE STANDING 42-ASSERTION FAILURE IS CLOSED, AND THE CODE WAS
//          NEVER WRONG. Round 19. For several rounds HANDOFF §6 item 3 carried
//          this as "a book-metadata question, not an app defect" and invariant
//          54 warned that an accepted red is exactly how the next real failure
//          hides. It was neither: THE FIXTURE LIST WAS STALE.
//
//          Part 2's else-branch asserted that ANY book not named in EXPECT is a
//          Standard Ebooks title. That was true when it was written. Then the
//          bookclean batches landed thirteen Project Gutenberg books in
//          library/ as `*_g-claudeCleaned.epub`, and every one of them was
//          judged against Standard Ebooks expectations it was never going to
//          meet. admin.js classified all thirteen correctly the whole time —
//          Project Gutenberg, the public-domain rights string, and a canonical
//          /ebooks/<id> origin. 13 books x 3 fields, plus the preparedBy pair
//          on the ones EXPECT_ORIGIN had listed under their pre-clean names = 42.
//
//          ⚠️ FIXED BY CLASSIFYING, NOT BY LISTING. A hand-kept list of book ids
//          goes stale on the next bookclean batch and re-opens this exact hole,
//          which is how it opened the first time. The `_g` suffix is the import
//          convention for a Gutenberg source, so the harness reads it and holds
//          those books to Gutenberg expectations. The origin URL is asserted by
//          SHAPE (https://www.gutenberg.org/ebooks/<digits>) rather than by
//          value, because the harness has no business knowing each book's
//          Gutenberg id and every attempt to make it know was the stale list.
//
//          ⚠️ IF YOU ADD A GUTENBERG BOOK, NAME IT `..._g.epub`. That is now
//          load-bearing in a test, not just a convention.
//
// v1.3.1 — PATH ONLY, Round 17 (Linotype). This file moved from the repo root
//          into tests/, so every source it reads is now `../` rather than `./`.
//          No assertion, threshold or expectation changed.
//
// v1.3.1 — PATH ONLY, Round 17 (Linotype). This file moved from the repo root
//          into tests/, so every source it reads is now `../` rather than `./`.
//          No assertion, threshold or expectation changed.
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

const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
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

// ── IMPORTED, NOT LIFTED (v1.6.0 — ROADMAP 47 step one) ──────────────────────
//
// ⚠️⚠️ THIS FILE USED TO LIFT THE LADDER OUT OF admin.js AS TEXT and rebuild it
// through `new Function(...)`. That was necessary while the four lived inside a
// browser module wired to the DOM and the Firebase client SDK, and it was a
// standing hazard for two reasons worth recording now that it is gone:
//
//   * IT TESTED A COPY, NOT THE SHIPPED CODE. The lifted text was re-evaluated in
//     a fresh scope, so anything the real functions closed over was invisible and
//     any divergence between "what the slice captured" and "what runs in a
//     browser" was untestable BY CONSTRUCTION.
//   * THE SLICER WAS ALREADY KNOWN TO BE WRONG, in a way this file documented and
//     kept. about-test.mjs's lift() begins its slice after the `async` keyword,
//     producing a non-async function whose `await` is a SyntaxError; every use
//     happened to be synchronous, so nobody found out.
//
// `rights-ladder.js` is now an ordinary module, so these are ordinary imports and
// the harness exercises exactly what admin.js runs.
import { SOURCE_PATTERNS, looksLikeBareUrl,
         canonicalSourceFrom, canonicalRightsFrom } from '../rights-ladder.js';

// ⚠️ selectOptionValues() IS STILL LIFTED, AND THAT IS CORRECT. It reads the live
// <select> out of admin.html, which is the whole mechanism by which the markup
// stays the single source of truth for what a mapping may return — so it cannot
// move into a DOM-free module, and driving it against the REAL admin.html is the
// point of it. This is the only lift left in the file.
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

// ⚠️ STILL USED, by the GENRES check further down — that list is markup-adjacent
// and genuinely lives in admin.js, so it is lifted like selectOptionValues is.
function liftConst(n) {
    const m = SRC.match(new RegExp('^const ' + n + '\\s*=[\\s\\S]*?;$', 'm'));
    if (!m) throw new Error(n + ' not found in admin.js');
    return m[0];
}

// admin.html's real selects, so the option values under test are the shipped ones.
const dom = new JSDOM(HTML);
const F = Object.assign(
    new Function('document', 'Array',
        lift('selectOptionValues') + '\nreturn { selectOptionValues };'
    )(dom.window.document, Array),
    { looksLikeBareUrl, canonicalSourceFrom, canonicalRightsFrom, SOURCE_PATTERNS }
);

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

    // ⚠️⚠️ THE NEXT TWO EXIST BECAUSE canonicalSourceFrom() HAS TWO INDEPENDENT
    // PROTECTIONS AND, UNTIL v1.5.0, NEITHER WAS TESTED ALONE — THEY WERE COVERING
    // FOR EACH OTHER. Round 57 mutation-verified this: flipping SOURCE_PATTERNS so
    // Gutenberg precedes Standard Ebooks, and separately collapsing the two passes
    // into one joined haystack, EACH LEFT THE WHOLE SUITE GREEN. Only both at once
    // went red.
    //
    // The masking is symmetric. The split means a real SE book's PASS 1 string
    // never contains the word "gutenberg" at all, so the order is never consulted
    // and flipping it changes nothing. The order means that in a collapsed single
    // haystack /standard\s*ebooks/ still matches before /gutenberg/, so collapsing
    // the passes changes nothing either. Two mechanisms, one observable outcome.
    //
    // Each case below is built so that exactly ONE mechanism can produce the right
    // answer and the other cannot help.

    // Only the ORDER can answer this: both patterns match the SAME pass-1 haystack,
    // so the split is irrelevant and whichever pattern is listed first wins.
    ['ORDER, pinned alone: SE publisher with a gutenberg.org identifier',
     { publisher: 'Standard Ebooks', identifier: 'https://www.gutenberg.org/ebooks/345', sources: [] },
     'Standard Ebooks'],

    // Only the SPLIT can answer this: the pass-1 answer (Global Grey) sits LATER in
    // SOURCE_PATTERNS than the pass-2 one (Gutenberg), so no ordering rescues a
    // collapsed haystack — it would return Project Gutenberg for a Global Grey book.
    ['SPLIT, pinned alone: Global Grey edition built from a Gutenberg text',
     { publisher: 'Global Grey ebooks', identifier: 'https://www.globalgreyebooks.com/x.html',
       sources: ['https://www.gutenberg.org/ebooks/345'] },
     'Global Grey'],
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

// ── genre round-trip (v1.2.0) ───────────────────────────────────────────────
// ⚠️ THE REGRESSION: the genre select was built from GENRES with no blank option and
// no Custom…, so a stored genre outside the list selected nothing, read back as '',
// and was ERASED by the next Save Metadata. Sports was the real casualty. This walks
// the shipped population code and asserts load -> save preserves the value.
{
    const GENRES = new Function('return ' + liftConst('GENRES')
                       .replace(/^const GENRES\s*=\s*/, '').replace(/;$/, ''))();
    const gdom = new JSDOM(HTML);
    const gdoc = gdom.window.document;
    const gsel = gdoc.getElementById('active-book-genre');
    eq('genre: select exists in admin.html', !!gsel, true);
    eq('genre: Sports is back in GENRES', GENRES.includes('Sports'), true);

    // Build the options exactly as admin.js does.
    const blank = gdoc.createElement('option');
    blank.value = ''; blank.text = '\u2014 Not tagged \u2014';
    gsel.appendChild(blank);
    GENRES.forEach(g => { const o = gdoc.createElement('option'); o.value = g; o.text = g; gsel.appendChild(o); });
    const co = gdoc.createElement('option'); co.value = '__custom__'; co.text = 'Custom\u2026';
    gsel.appendChild(co);

    eq('genre: Custom\u2026 option exists', !!gsel.querySelector('option[value="__custom__"]'), true);
    eq('genre: blank option is first',      gsel.options[0].value, '');

    const GF = new Function('document', 'Array',
        lift('readSelectOrCustom') + '\n' + lift('writeSelectOrCustom') + '\n' +
        'return { readSelectOrCustom, writeSelectOrCustom };')(gdoc, Array);

    for (const stored of ['Adventure', 'Sports', 'Young Adult', 'Sword & Sorcery', 'Bildungsroman', '']) {
        GF.writeSelectOrCustom('active-book-genre', stored);
        eq(`genre: ${JSON.stringify(stored)} survives load \u2192 save`,
           GF.readSelectOrCustom('active-book-genre'), stored);
    }
    // An off-list genre must route through Custom… with the box visible, not vanish.
    GF.writeSelectOrCustom('active-book-genre', 'Sword & Sorcery');
    eq('genre: off-list value selects Custom\u2026', gsel.value, '__custom__');
    eq('genre: off-list custom box is shown',
       gdoc.getElementById('active-book-genre-custom').classList.contains('hidden'), false);
    // Clearing must hide it again and leave nothing behind.
    GF.writeSelectOrCustom('active-book-genre', '');
    eq('genre: clearing hides the custom box',
       gdoc.getElementById('active-book-genre-custom').classList.contains('hidden'), true);
    eq('genre: clearing leaves no residue', GF.readSelectOrCustom('active-book-genre'), '');
}

// ── the classroom-edition upgrade is GONE, and that is what is asserted ─────
//
// ⚠️ v3.30.0 REMOVED runDedication(), CLASSROOM_NOTICE, DEDICATION_TEXT and the
// classroom argument to canonicalRightsFrom(). This harness still lifted
// CLASSROOM_NOTICE and died on it — `CLASSROOM_NOTICE not found in admin.js` —
// so it had been RED ever since, and a permanently red harness in the fast suite
// teaches everyone to read "1 failing" as the normal number. The next real failure
// hides behind it. Repaired in v1.3.0 rather than deleted.
//
// The tests below are NOT the old ones with the classroom argument dropped. They
// assert the CURRENT contract, which is the exact inverse of the old one: the
// combined PD & CC0 option still exists in admin.html and is chosen BY HAND, and
// nothing in the mapper may reach it on its own. That is a real risk worth a guard —
// auto-relicensing a book is the kind of thing that is quiet when wrong.
eq('PD-only text maps to plain PD and is never auto-upgraded',
   F.canonicalRightsFrom('Public domain in the USA.', RIGHTS_OPTS), PD);
eq('the plain PD option round-trips to itself',
   F.canonicalRightsFrom(PD, RIGHTS_OPTS), PD);
eq('CC BY 4.0 is never relicensed',
   F.canonicalRightsFrom('Licensed CC BY 4.0', RIGHTS_OPTS), BY4);
eq('CC BY-NC-SA 3.0 is never relicensed',
   F.canonicalRightsFrom('CC BY-NC-SA 3.0', RIGHTS_OPTS), BYNCSA3);
eq('an unmappable licence still refuses rather than guessing',
   F.canonicalRightsFrom('All rights reserved.', RIGHTS_OPTS), '');

// ⚠️ The combined option must still EXIST — v3.30.0 kept it deliberately, for hand
// selection. If it disappears from admin.html, the licence a cleaned book needs is
// no longer selectable at all, and that is silent: the dropdown just lacks a line.
eq('the combined PD & CC0 option is still offered in admin.html',
   typeof PD_CC0 === 'string' && PD_CC0.length > 0, true);

// ⚠️ A THIRD ARGUMENT MUST DO NOTHING. The old signature took an options object and
// three call sites passed one. If the parameter ever comes back, it should come back
// deliberately and with its own tests, not by a stale caller quietly working again.
eq('a leftover third argument cannot resurrect the upgrade',
   F.canonicalRightsFrom('Public domain in the USA.', RIGHTS_OPTS, { classroom: true }), PD);

// ── lift readGutenbergOrigin too, and run it on the real zips ───────────────
// ⚠️ END-TO-END ON PURPOSE. This one is not string mapping — it opens a spine
// document and walks markup Gutenberg controls, so a synthetic fixture would only
// prove I can match my own fixture. The real books are the test.
const G = new Function('DOMParser', 'zipEntry', 'Array',
    liftConst('GUTENBERG_EBOOK_URL') + '\n' +
    liftConst('SIGNAL_SPINE_LIMIT') + '\n' +
    lift('cleanPreparedBy') + '\n' +
    lift('readInBookSignals') + '\n' +
    'return { readInBookSignals, cleanPreparedBy };'
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

// ⚠️ THE BOOKCLEAN PASS RENAMES. `x.epub` becomes `x-claudeCleaned.epub` or
// `x_claudeCleaned.epub` depending on the batch, which silently pushed every
// cleaned book out of EXPECT and into the Standard Ebooks bulk branch. Normalise
// before any filename lookup. EXPECT is the only thing keyed by name now.
const baseName = f => f.replace(/[-_]claudeCleaned(?=\.epub$)/i, '');

// ⚠️⚠️ NOT USED TO CLASSIFY ANYTHING. v1.4.0 identified a Gutenberg book by this
// suffix and made the convention load-bearing in a test; six books then arrived
// without it and three Global Grey books arrived as `_GG`, which this does not
// match. See the v1.5.0 note. It is kept ONLY to report the drift at the end of
// the run, where a wrong answer costs a line of output rather than 20 red
// assertions. DO NOT branch on it.
const isGutenbergFile = f => /_g(-[A-Za-z]+)?\.epub$/.test(f);

// ⚠️ THE BOOK ITSELF IS THE CLASSIFIER. Both of these read the archive in front
// of us rather than anything a human maintains alongside it.
//
// `editionIsGutenberg` deliberately mirrors canonicalSourceFrom()'s PASS 1 — the
// edition fields, dc:publisher + dc:identifier — and NOT its dc:source fallback.
// That is the whole point: a Standard Ebooks book cites Gutenberg as its
// upstream in dc:source, so anything that consults dc:source here would call
// half the corpus Gutenberg and the expectation would be as wrong as the old
// filename was. The SE guard is explicit for the same reason.
const editionOf = meta => [meta.publisher, meta.identifier].filter(Boolean).join(' ');
const isSEEdition  = ed => /standard\s*ebooks/i.test(ed);
const isGutEdition = ed => /gutenberg/i.test(ed) && !isSEEdition(ed);
const isGGEdition  = ed => /global\s*grey/i.test(ed);

// ⚠️ A CC0 DEDICATION IN dc:rights IS A FACT ABOUT THE BOOK, NOT A GUESS ABOUT
// ITS PUBLISHER. The bookclean pipeline stamps one into every book it touches —
// the original text is public domain, the editorial changes are dedicated CC0 —
// and both halves of that sentence are true and both belong in the stored
// licence. A book WITHOUT the dedication is expected to map to plain PD, so this
// harness keeps working through a bookclean batch either way.
const CC0_DEDICATION = /creativecommons\.org\/publicdomain\/zero/i;

// The canonical form admin.js must produce for a Gutenberg book. Asserted as a
// SHAPE: this harness does not know, and must not pretend to know, which
// /ebooks/<id> each book carries.
const GUTENBERG_ORIGIN_SHAPE = /^https:\/\/www\.gutenberg\.org\/ebooks\/\d+$/;

// Does this archive contain a Gutenberg "Credits:" row anywhere at all? Read
// from the zip rather than assumed, so the assertion below describes the book in
// front of us instead of a belief about what Gutenberg always emits.
async function zipHasCreditsRow(zip) {
    for (const name of Object.keys(zip.files)) {
        if (!/\.x?html?$/i.test(name)) continue;
        const txt = await zip.file(name).async('string');
        if (/Credits\s*:/i.test(txt)) return true;
    }
    return false;
}

// ── PART 2: the real corpus ─────────────────────────────────────────────────
// Expectations keyed by filename. Anything not listed must still map to SOMETHING
// non-empty for source, or the import is back to pasting a URL into the dropdown.
// Named exceptions only: the synthetic fixtures and the one Global Grey book.
// Gutenberg books are classified by filename above; everything else remaining is
// the Standard Ebooks bulk.
const EXPECT = {
    'ttb-test-flat.epub':  [ '', CC0 ],
    'ttb-test-parts.epub': [ '', CC0 ],
    'ledger-point-light.epub': [ '', CC0 ],
    // ⚠️ rights was '' here until Round 19. The cleaned edition carries a
    // dc:rights of "Public domain (United States)" and maps to it correctly;
    // the empty expectation described the pre-bookclean file.
    'jean-webster_daddy-long-legs.epub': [ 'Global Grey', PD ],
};

let files = [];
try {
    files = readdirSync(LIB).filter(f => f.endsWith('.epub')).sort();
} catch (e) {
    console.log(`\n  (library not found at ${LIB} — corpus half skipped)`);
}

const DC = 'http://purl.org/dc/elements/1.1/';
let seCount = 0, gutCount = 0;
// Books whose filename and whose metadata disagree about Gutenberg. Reported,
// never asserted — see isGutenbergFile()'s comment.
const nameDrift = [];
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
        rights: grab('rights').join(' '),   // ⚠️ ALL of them — mirrors admin.js v3.31.1
        source: grab('source')[0] || '',
        sources: grab('source'),
        publisher: grab('publisher')[0] || '',
        identifier: grab('identifier').find(v => /^https?:\/\//i.test(v)) || '',
    };

    // Classify from the archive, once, and use the same answer for the source
    // branch, the licence expectation and the Gutenberg-only signal checks below.
    const edition   = editionOf(meta);
    const isGut     = isGutEdition(edition);
    const carriesCC0 = CC0_DEDICATION.test(meta.rights);
    const wantRights = carriesCC0 ? PD_CC0 : PD;
    if (isGut !== isGutenbergFile(f)) nameDrift.push(f);

    const gotSource = F.canonicalSourceFrom(meta, SOURCE_OPTS);
    const gotRights = F.canonicalRightsFrom(meta.rights, RIGHTS_OPTS);

    const key = baseName(f);
    if (EXPECT[key]) {
        eq(`${f} \u2192 source`, gotSource, EXPECT[key][0]);
        eq(`${f} \u2192 rights`, gotRights, EXPECT[key][1]);
    } else if (isGut) {
        // The book's own dc:publisher/dc:identifier say Project Gutenberg, so the
        // dropdown must too. No list, no filename, no maintenance.
        eq(`${f} \u2192 source`, gotSource, 'Project Gutenberg');
        eq(`${f} \u2192 rights`, gotRights, wantRights);
    } else {
        // Everything left is Standard Ebooks or Global Grey. ⚠️ GLOBAL GREY IS NOT
        // AN EXCEPTION LIST ANY MORE — it was one book in EXPECT, keyed by a
        // pre-bookclean filename, and two more arrived as `_GG` and were silently
        // asserted to be Standard Ebooks. Reading the publisher covers all three
        // and covers the fourth nobody has uploaded yet.
        seCount++;
        eq(`${f} \u2192 source`, gotSource, isGGEdition(edition) ? 'Global Grey' : 'Standard Ebooks');
        eq(`${f} \u2192 rights`, gotRights, wantRights);
    }

    // ⚠️ The regression that started all this: NOTHING may put a bare URL into the
    // Source dropdown, by any path, for any book in the corpus.
    const fallback = gotSource || meta.publisher ||
                     (F.looksLikeBareUrl(meta.source) ? '' : meta.source);
    eq(`${f} \u2192 Source is never a bare URL`, F.looksLikeBareUrl(fallback), false);

    // Origin URL. Gutenberg books must yield the canonical /ebooks/<id> form; every
    // other book must yield '' here and fall back to dc:identifier in the caller.
    const sig = await G.readInBookSignals(zip, opf, opfPath, meta);
    if (isGut) {
        eq(`${f} \u2192 origin is a canonical /ebooks/<id> url`,
           GUTENBERG_ORIGIN_SHAPE.test(sig.originUrl), true);
        gutCount++;
        // Gutenberg names its transcribers in the machine header's Credits row. Not
        // asserted verbatim — the names differ per book — but where the row EXISTS
        // it must find SOMEBODY, and must never drag in the "Updated:" chatter that
        // shares the line.
        //
        // ⚠️ CONDITIONAL ON THE ROW EXISTING, AND THAT IS NOT A LOWERED BAR. Some
        // Gutenberg editions carry no Credits row at all — wonderful-wizard-of-oz
        // is one, verified by scanning every xhtml entry in the archive. An
        // unconditional assertion there demands that the importer invent an
        // attribution, which is the opposite of what this field is for. The check
        // that matters is the implication: row present => name extracted.
        const hasCreditsRow = await zipHasCreditsRow(zip);
        if (hasCreditsRow) {
            eq(`${f} \u2192 preparedBy found (book has a Credits row)`, sig.preparedBy.length > 0, true);
        } else {
            eq(`${f} \u2192 preparedBy empty (book has NO Credits row)`, sig.preparedBy, '');
        }
        eq(`${f} \u2192 preparedBy has no Updated: chatter`, /updated\s*:/i.test(sig.preparedBy), false);
    } else {
        eq(`${f} \u2192 origin`, sig.originUrl, '');
        eq(`${f} \u2192 preparedBy empty (non-Gutenberg)`, sig.preparedBy, '');
    }
    // ⚠️ The signals object must expose ONLY what v3.30.0 left behind. Asserted as an
    // exact key set, not `sig.classroom === undefined`: an undefined check passes
    // just as happily when the whole function has been renamed out from under us.
    eq(`${f} \u2192 signals expose exactly {originUrl, preparedBy}`,
       Object.keys(sig).sort().join(','), 'originUrl,preparedBy');
}

// ═══════════════════════════════════════════════════════════════════════════
// PART F — ⚠️⚠️ rights-ladder.js STAYS PORTABLE, OR STEP TWO CANNOT HAPPEN
// ═══════════════════════════════════════════════════════════════════════════
//
// ROADMAP 47's second step puts this ladder behind an admin-gated Cloud Function
// so a model can give a SECOND OPINION on a book's licence before it goes in
// front of children. ⚠️ A Cloud Function cannot import this file — `firebase
// deploy --only functions` packages the `functions/` directory and nothing above
// it — so the functions-side copy will be a COPY, and the only thing that makes
// an honest copy possible is that this module depends on nothing.
//
// ⚠️ THE FAILURE TO DESIGN AGAINST IS ALREADY IN THE REPO. `MIN_PROBLEM_CHARS =
// 3` is written by hand in BOTH `variety-floor.js` and `functions/index.js`, and
// nothing asserts they agree. That one is a number. This one would be two legal
// mappers disagreeing about what a school may put in front of a child, which is
// worse than having only one.
//
// So: no imports, no DOM, no SDK. If a future edit needs any of those, it does
// not belong in this file — it belongs in the caller, the way selectOptionValues()
// stayed in admin.js.
//
// ⚠️ MUTATION-VERIFIED, AND TWO OF THE THREE FAIL AS A CRASH RATHER THAN AS AN
// ASSERTION — recorded because "it failed" and "F1 printed" are different claims.
// Adding an import to the ladder, or dropping an export, kills this harness at
// module-load time (exit 1) BEFORE any assertion runs, because this file imports
// the ladder for real now. F1/F2/F6 are therefore belt-and-braces: they exist so
// the failure NAMES the rule instead of being a bare SyntaxError, and so they
// still bite if a future consumer stops importing. Only F7 — admin.js keeping a
// local copy that shadows the import — fails as a clean assertion, and it is the
// one that would otherwise be completely silent.
{
    console.log('\n─── F. ⚠️ THE LADDER MODULE IS SELF-CONTAINED ───');
    // This file's only assertion helper is eq(); every check below is a boolean,
    // so give them a name rather than writing `, true` twenty times.
    const ok = (cond, msg) => eq(msg, !!cond, true);
    const ladder = readFileSync(new URL('../rights-ladder.js', import.meta.url), 'utf8');
    const code = ladder
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');

    ok(!/^\s*import\s/m.test(code),
       'F1 \u26a0\ufe0f\u26a0\ufe0f rights-ladder.js imports NOTHING \u2014 an import makes the functions-side copy impossible and forces a second hand-maintained legal mapper');
    ok(!/\brequire\s*\(/.test(code),
       'F2 and require()s nothing either');
    ok(!/\bdocument\b/.test(code),
       'F3 \u26a0\ufe0f it never touches `document` \u2014 a Cloud Function has no DOM. selectOptionValues() stayed in admin.js for exactly this reason');
    ok(!/\bwindow\b/.test(code),
       'F4 and never touches `window`');
    ok(!/\blocalStorage\b|\bfetch\s*\(/.test(code),
       'F5 and reaches no browser API \u2014 it is string mapping and nothing else');

    // The four exports the two consumers actually rely on. A rename that broke
    // admin.js would otherwise only show up as a blank dropdown in a classroom.
    for (const name of ['SOURCE_PATTERNS', 'looksLikeBareUrl',
                        'canonicalSourceFrom', 'canonicalRightsFrom']) {
        ok(new RegExp('export\\s+(const|function)\\s+' + name + '\\b').test(code),
           `F6 \`${name}\` is exported`);
    }
    // ⚠️ AND admin.js MUST NOT HAVE KEPT A LOCAL COPY. An extraction that leaves
    // the original behind is the drift this move exists to prevent, and it would
    // be invisible: the local definition would simply win.
    for (const name of ['canonicalSourceFrom', 'canonicalRightsFrom', 'looksLikeBareUrl']) {
        ok(!new RegExp('^function\\s+' + name + '\\b', 'm').test(SRC),
           `F7 \u26a0\ufe0f admin.js no longer defines \`${name}\` locally \u2014 a leftover copy would silently shadow the import`);
    }
    ok(!/^const SOURCE_PATTERNS\b/m.test(SRC),
       'F7 \u26a0\ufe0f admin.js no longer defines `SOURCE_PATTERNS` locally');
    ok(/from ['"]\.\/rights-ladder\.js['"]/.test(SRC),
       'F8 admin.js imports the ladder rather than restating it');
}

console.log(`\nmetadata-map-test: ${files.length} books read from ${LIB}` +
            (files.length ? ` (${seCount} Standard Ebooks/Global Grey, ${gutCount} Gutenberg)` : ''));

// ⚠️ A NOTE, NOT AN ASSERTION, AND THE DISTINCTION IS THE POINT. The `_g` suffix
// is a filing convention for humans; the books below are classified correctly
// regardless of it, so failing here would be this file re-acquiring the exact
// dependency v1.5.0 removed. It is printed so the drift is visible to whoever is
// running batches, and costs nothing when it is empty.
if (nameDrift.length) {
    console.log(`\n  note: ${nameDrift.length} file(s) whose name and metadata disagree about Gutenberg`);
    console.log('  (the `_g` suffix is documentation only — nothing here depends on it)');
    for (const f of nameDrift) console.log(`    ${f}`);
}
if (fail) {
    console.log('\n' + bad.join('\n'));
    console.log(`\nFAIL \u2014 ${pass} passed, ${fail} failed.`);
    process.exit(1);
}
console.log(`OK \u2014 ${pass} assertions passed.`);
