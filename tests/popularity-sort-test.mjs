// popularity-sort-test.mjs v2.0.0 — ROADMAP 54: SORT THE LIBRARY BY MOST
// POPULAR, DERIVED FROM WRITES THAT ALREADY HAPPEN, NEVER LIVE.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ v2.0.0 — v1.0.0 ASSERTED THE BUG AS A REQUIREMENT AND WAS GREEN FOR
//                 A ROUND WHILE THE FEATURE PRODUCED NOTHING BUT ZEROS.
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-08: "Sort by popular is just alphabetical. I ran the
// popularity report in reports.html and it did not appear to do anything."
//
// v1.0.0 Part C contained an assertion requiring recalculatePopularity() to
// filter `typing_logs` on a `bookId` field, per book. It passed.
//
// ⚠️⚠️ `typing_logs` DOCUMENTS HAVE NO SUCH FIELD, AND CANNOT. The collection
// is keyed `{uid}_{date}` — one merged rollup per student per DAY — so a child
// who reads two books in a period has one document with no single book to
// name. That field lives on `typing_sessions`, the per-sprint rollup. The
// query matched nothing, eighty zeros were written to settings/popularity, and
// index.html's sortBooks() fell through to its `|| byTitle(a, b)` tiebreak.
// Alphabetical, exactly as reported.
//
// ⚠️ EVERY ASSERTION IN THIS FILE PASSED WHILE THAT WAS TRUE, because every
// one of them compared the code against an expectation invented in the same
// session as the code. That is Rule 10 in one sentence: a green suite over
// synthetic expectations is not evidence about production data.
//
// ⭐ SO PART E IS NEW AND IT IS THE POINT OF THIS FILE NOW: a counter may only
// filter on a field that some writer actually writes. It derives the field set
// from the four shipped writers of `typing_logs` rather than from a list typed
// here, and it is a RATCHET over every filter this page aims at that
// collection — the class of defect, not the instance. Mutation-verified
// against the v2.40.0 query.
//
// ⚠️ WHY THIS IS ONE FILE ACROSS FIVE SOURCES. The feature only works if they
// agree on one document shape: reports.html WRITES settings/popularity,
// index.html READS it, firestore.rules decides who may do either, and
// game.js/learn.js/daylog.js decide what evidence exists to count in the first
// place. v1.0.0 read the first three, and the fourth is the gap the defect
// lived in.
//
// BEHAVIOURAL where the logic is pure (sortBooks()'s 'popular' case,
// popularityOf(), daylog.js's payload builders). STRUCTURAL everywhere the
// surface is DOM/Firestore-shaped with no framework here to mount it in —
// matching this project's own BEHAVIOURAL/STRUCTURAL split
// (inline-styles-test.mjs, class-week-anchor-test.mjs).

import fs from 'fs';
import { dayLogPayloadFor, carryOverPayloadFor, SOURCE_FIELDS } from '../daylog.js';

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

const read = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const indexHtml   = read('index.html');
const reportsHtml = read('reports.html');
const rules       = read('firebase/firestore.rules');
const gameJs      = read('game.js');
const learnJs     = read('learn.js');

// ⚠️ COMMENTS ARE STRIPPED BEFORE EVERY STRUCTURAL SCAN. reports.html now
// quotes the broken query in the comment that explains the fix, so a bare
// grep for the defect finds the explanation and goes red against correct
// code. Fourth and fifth instance of that trap in this repo;
// arcade-lesson-test.mjs and staff-tokens-test.mjs carry the identical note.
const decomment = (s) => s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');

const reportsCode = decomment(reportsHtml);
const indexCode   = decomment(indexHtml);
const gameCode    = decomment(gameJs);
const learnCode   = decomment(learnJs);

function extractFn(src, name) {
    const at = src.indexOf('function ' + name);
    if (at < 0) return null;
    const brace = src.indexOf('{', at);
    let depth = 0;
    for (let j = brace; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(at, j + 1); }
    }
    return null;
}

// Brace-matches the first object literal at or after `from`.
function objectLiteralAt(src, from) {
    const open = src.indexOf('{', from);
    if (open < 0) return null;
    let depth = 0;
    for (let j = open; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(open, j + 1); }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nA — index.html: popularityOf() AND THE \'popular\' SORT CASE');
// ═══════════════════════════════════════════════════════════════════════════

const popularityOfSrc = extractFn(indexHtml, 'popularityOf');
ok('popularityOf() exists', !!popularityOfSrc);

// ⚠️ popularityOf() CLOSES OVER THE MODULE-LEVEL popularityCounts, not a
// parameter — so it must be evaluated with that variable actually in scope,
// not passed as a receiver or an argument.
{
    const run = (counts, book) => new Function(
        `let popularityCounts = ${JSON.stringify(counts)};\n` +
        popularityOfSrc + '\nreturn popularityOf(' + JSON.stringify(book) + ');'
    )();
    ok('a book present in the counts map returns its count',
       run({ b1: 42, b2: 7 }, { id: 'b1' }) === 42);
    ok('a book ABSENT from the counts map returns 0, not undefined or NaN',
       run({ b1: 42 }, { id: 'never-typed' }) === 0);
    ok('an explicit zero count and an absent book are indistinguishable (both 0)',
       run({ b1: 0 }, { id: 'b1' }) === run({}, { id: 'b1' }));
    ok('a null counts map (never fetched) returns 0, never throws',
       new Function('let popularityCounts = null;\n' + popularityOfSrc +
           '\nreturn popularityOf({ id: "x" });')() === 0);
}

const sortBooksSrc = extractFn(indexHtml, 'sortBooks');
ok('sortBooks() exists', !!sortBooksSrc);
ok('sortBooks() has a \'popular\' case', /case 'popular':/.test(sortBooksSrc || ''));

{
    // Lift the real sortBooks() with everything it references injected —
    // titleSortKey/authorSortKey/lengthOf as simple stand-ins (only title
    // matters for this section), popularityOf as the REAL lifted function,
    // and activeSort fixed to 'popular'.
    const titleSortKey = (t) => t.toLowerCase();
    const authorSortKey = () => '';
    const lengthOf = () => 0;
    const books = [
        { id: 'zeta',  title: 'Zeta Book' },
        { id: 'alpha', title: 'Alpha Book' },
        { id: 'never', title: 'Never Typed' },
        { id: 'mid',   title: 'Mid Book' },
    ];
    const counts = { zeta: 10, alpha: 10, mid: 3 }; // 'never' absent entirely

    const lift = (popOf) => new Function(
        'titleSortKey', 'authorSortKey', 'lengthOf', 'popularityOf', 'activeSort',
        sortBooksSrc + '\nreturn sortBooks;'
    )(titleSortKey, authorSortKey, lengthOf, popOf, 'popular');

    const order = lift((b) => (counts[b.id] || 0))(books).map(b => b.id);
    ok('most-typed books come first',
       order.indexOf('zeta') < order.indexOf('mid') &&
       order.indexOf('alpha') < order.indexOf('mid'),
       order.join(','));
    ok('a book never typed sorts LAST, not first or crashing the comparator',
       order[order.length - 1] === 'never', order.join(','));
    ok('a tie in popularity (zeta=alpha=10) breaks on title, alphabetically',
       order.indexOf('alpha') < order.indexOf('zeta'), order.join(','));

    // ⚠️⚠️ AND HERE IS THE FAILURE MODE THAT HID THE DEFECT, PINNED AS A FACT
    // RATHER THAN LEFT AS A SURPRISE. With every count zero — which is exactly
    // what v2.40.0 wrote — the title tiebreak decides the WHOLE order, so
    // "Most Popular" renders as a flawless alphabetical list with nothing
    // anywhere to say it measured nothing. The tiebreak is CORRECT and must
    // stay (see sortBooks()'s own comment: every comparator falls back to
    // title so that no ordering is partial). What was missing was anyone
    // saying so on screen, which is what Part B's note assertion covers.
    ok('⚠️ an all-zero counts map is INDISTINGUISHABLE from title order',
       lift(() => 0)(books).map(b => b.id).join(',') === 'alpha,mid,never,zeta',
       'if this ever stops being true, the silent-failure story above is stale');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nB — index.html: THE LAZY FETCH, AND SAYING SO WHEN IT IS EMPTY');
// ═══════════════════════════════════════════════════════════════════════════

ok('a "Most Popular" option exists in the sort control',
   /<option value="popular">Most Popular<\/option>/.test(indexHtml));

const ensureFn = extractFn(indexHtml, 'ensurePopularityLoaded') ||
    (() => {
        const at = indexHtml.indexOf('ensurePopularityLoaded');
        return at < 0 ? null : indexHtml.slice(at, at + 800);
    })();
ok('ensurePopularityLoaded() exists', !!ensureFn);
ok('a cache hit (popularityCounts already truthy) returns without fetching again',
   /if\s*\(popularityCounts\)\s*return popularityCounts;/.test(ensureFn || ''));
ok('a second call while the first is still in flight reuses the SAME promise',
   /if\s*\(popularityFetchPromise\)\s*return popularityFetchPromise;/.test(ensureFn || ''),
   'without this, two rapid clicks on "Most Popular" would fire two fetches');
ok('a missing settings/popularity document degrades to an empty map, not a throw',
   /snap\.exists\(\)\s*&&\s*snap\.data\(\)\.counts\)\s*\|\|\s*\{\}/.test(ensureFn || ''));

// ⚠️⚠️ THE WHOLE POINT OF LAZY LOADING. If this document is fetched anywhere
// OTHER than inside ensurePopularityLoaded() or the sort-select handler that
// calls it, "Most Popular" is no longer free for a student who never picks it.
{
    const fetchSites = [...indexCode.matchAll(/doc\(db,\s*['"]settings['"],\s*['"]popularity['"]\)/g)];
    ok('settings/popularity is fetched from exactly ONE call site in index.html',
       fetchSites.length === 1, `found ${fetchSites.length} call sites`);
}
ok('the sort-select change handler awaits the load before re-rendering, only for \'popular\'',
   /if\s*\(activeSort === 'popular'\)\s*await ensurePopularityLoaded\(\);/.test(indexHtml));

// ⭐ NEW IN v2.0.0 — THE INSTRUMENT THAT WOULD HAVE SHORTENED THIS BY A ROUND.
// Jake diagnosed "just alphabetical" from a shelf that had no way to tell him
// it was sorting by an empty map. This is not the fix; it is the page
// admitting what it knows.
{
    const renderBooksSrc = extractFn(indexCode, 'renderBooks') || '';
    ok('renderBooks() detects a popularity map with nothing measured in it',
       /activeSort === 'popular' &&\s*!\(popularityCounts && Object\.values\(popularityCounts\)\.some\(n => n > 0\)\)/
           .test(renderBooksSrc),
       'an unmeasured library and a measured one look identical from the shelf');
    ok('and it says so in #filter-note rather than failing silently',
       /popularityUnmeasured/.test(renderBooksSrc) && /Most Popular/.test(renderBooksSrc),
       'the note is the only thing standing between this defect and another round');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nC — reports.html: THE COUNT ITSELF — STAFF-TRIGGERED, NEVER LIVE');
// ═══════════════════════════════════════════════════════════════════════════

const tallyFn = extractFn(reportsCode, 'tallyPopularity');
const recalcFn = (() => {
    const at = reportsCode.indexOf('async function recalculatePopularity');
    if (at < 0) return null;
    const brace = reportsCode.indexOf('{', at);
    let depth = 0;
    for (let j = brace; j < reportsCode.length; j++) {
        if (reportsCode[j] === '{') depth++;
        else if (reportsCode[j] === '}') { depth--; if (depth === 0) return reportsCode.slice(at, j + 1); }
    }
    return null;
})();

ok('recalculatePopularity() exists', !!recalcFn);
ok('tallyPopularity() exists — the count is FACTORED OUT of the write',
   !!tallyFn,
   'the dry run and the real run must count by the same code, or the dry run ' +
   'proves nothing about what will be saved');

ok('it counts a student\'s progress subcollection',
   /getDocs\(collection\(db,\s*['"]users['"],\s*uid,\s*['"]progress['"]\)\)/.test(tallyFn || ''),
   'the source of truth moved; check it is still one document per student per book');
ok('the tally keys on the progress document id, which IS the book id',
   /counts\[d\.id\]\s*=\s*\(counts\[d\.id\]\s*\|\|\s*0\)\s*\+\s*1/.test(tallyFn || ''));

// ⚠️⚠️ THE ASSERTION THAT REPLACES v1.0.0's. Read this file's header.
ok('⚠️⚠️ nothing on this page filters on a per-book field of typing_logs',
   !/where\(\s*['"]bookId['"]/.test(reportsCode),
   'that filter is back; typing_logs has no such field and typing_sessions ' +
   'has it exempted from indexing in firestore.indexes.json');

// ⚠️ A READ THAT FAILED IS NOT A BOOK NOBODY OPENED. Same rule as
// readLogById() on this page: a ranking that cannot tell a miss from a zero
// is a ranking nobody can audit.
ok('an unreadable student is counted as a MISS, never as a zero',
   /missedUids\.push\(uid\)/.test(tallyFn || ''),
   'a permission-denied on one student would otherwise silently deflate every ' +
   'book that student had opened');
ok('and the miss count reaches the screen',
   /missedUids\.length/.test(recalcFn || ''));

ok('it writes the result to settings/popularity',
   /setDoc\(doc\(db,\s*['"]settings['"],\s*['"]popularity['"]\)/.test(recalcFn || ''));
ok('the write includes an updatedAt stamp',
   /updatedAt:\s*new Date\(\)\.toISOString\(\)/.test(recalcFn || ''));
// ⭐ `basis` IS WHAT LETS A LATER READER TELL A v2.40.0 ALL-ZERO MAP APART
// FROM A REAL ONE WITHOUT GUESSING FROM THE NUMBERS.
ok('the write records its BASIS, so a stored map says which definition made it',
   /basis:\s*'students-with-progress'/.test(recalcFn || ''));

// ⚠️⚠️ RULE 10's OWN INSTRUMENTS, AND THEY ARE NOT DECORATION. This code was
// authored where Firestore is unreachable — the same condition that produced
// the defect it replaces — so the only proof available is Jake running it on
// real data before it becomes the order his students browse in.
{
    const dryFn = extractFn(reportsCode, 'dryRunPopularity');
    const peekFn = extractFn(reportsCode, 'peekPopularity');
    ok('a DRY RUN exists', !!dryFn);
    ok('⚠️ and the dry run writes NOTHING', !!dryFn && !/setDoc\(/.test(dryFn),
       'the dry run is the only way to see the numbers before they are published');
    ok('the dry run says out loud that nothing was saved',
       /NOTHING WAS SAVED/.test(dryFn || ''));
    ok('a SHOW SAVED readout exists, reading the document back',
       !!peekFn && /getDoc\(doc\(db,\s*['"]settings['"],\s*['"]popularity['"]\)\)/.test(peekFn));
    ok('all three controls are wired to a button',
       /popularity-dryrun-btn/.test(reportsCode) &&
       /popularity-peek-btn/.test(reportsCode) &&
       /recalc-popularity-btn/.test(reportsCode));
}

// ⚠️ THE SCOPE PICKERS ARE DELIBERATELY IGNORED. settings/popularity is ONE
// library-wide document; counting only the class Jake happened to have
// selected would publish one period's taste as the whole library's order,
// with nothing on index.html able to say which scope produced the map.
ok('the tally reads the whole roster, not the report\'s selected scope',
   /getDocs\(collection\(db,\s*['"]users['"]\)\)/.test(tallyFn || '') &&
   !/readRosterUids/.test(tallyFn || ''),
   'readRosterUids() answers "who is in the selected class", which is the right ' +
   'question for a report and the wrong one for a global document');

ok('the panel is hidden by default in the markup',
   /id="popularity-panel"[^>]*class="[^"]*\bhidden\b/.test(reportsHtml) ||
   /class="[^"]*\bhidden\b[^"]*"\s+id="popularity-panel"/.test(reportsHtml));
ok('the panel is only revealed for isSuper()',
   /if\s*\(isSuper\(\)\)\s*document\.getElementById\('popularity-panel'\)\.classList\.remove\('hidden'\);/.test(reportsHtml),
   'a plain teacher who could see this button would only get permission-denied on click');

// ⚠️ NOT THE DEFAULT SORT. This is a product decision, not a bug a test can
// catch by itself — but the item text explicitly leaves it open, so pin that
// the shipped option value is 'popular' and NOT wired as sort-select's
// default/selected option, which would be silently promoting an unanswered
// question to an answer.
ok('"Most Popular" is NOT the selected default in the sort control',
   !/<option value="popular"[^>]*\bselected\b/.test(indexHtml));

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nD — firestore.rules: THE DOCUMENT\'S ACCESS TIER');
// ═══════════════════════════════════════════════════════════════════════════

ok('settings/popularity is guest-readable, same tier as settings/goals',
   /docId == 'goals' \|\| docId == 'popularity' \|\| signedIn\(\)/.test(rules));
// ⚠️ THE WRITE RULE IS THE WHOLE POINT — if a signed-in student could write
// this document, a class of kids could hand-pick which books look "popular".
{
    const at = rules.indexOf("match /settings/{docId}");
    const block = at < 0 ? '' : rules.slice(at, rules.indexOf('}', rules.indexOf('}', at) + 1) + 1);
    ok('settings/{docId} write stays isSuper()-only — no per-document carve-out',
       /allow write:\s*if isSuper\(\);/.test(block));
}

// ⚠️ THE READ PATH THE NEW COUNT DEPENDS ON, AND IT NEEDED NO CHANGE. That is
// half the reason Jake picked this source over typing_sessions.
{
    const at = rules.indexOf('match /users/{uid}/{collection}/{docId}');
    const block = at < 0 ? '' : rules.slice(at, at + 1600);
    ok('isSuper() may already read a student\'s progress subcollection',
       /allow read: if request\.auth\.uid == uid\s*\|\|\s*isSuper\(\)/.test(block),
       'the count would need a rules change it was designed to avoid');
}
// ⚠️⚠️ AND A collectionGroup() QUERY WOULD **NOT** HAVE BEEN COVERED BY THAT
// RULE — collection-group queries do not match a nested path rule, they need
// `match /{path=**}/progress/{id}`. This pins that no such rule was added,
// because opening one and then not using it is a widened surface for nothing.
ok('no collection-group rule was opened for progress, and none is queried',
   !/match \/\{path=\*\*\}\/progress/.test(rules) && !/collectionGroup\(/.test(reportsCode),
   'if a later round wants a collection-group count, the rule and the query ' +
   'must land in the same deploy');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nE — ⭐ THE RATCHET: A COUNTER MAY ONLY FILTER ON A FIELD SOMEBODY WRITES');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THIS SECTION IS WHY v2.0.0 EXISTS. Everything above it could be — and
// was — green against a query that matched nothing, because nothing compared
// the FIELD BEING FILTERED against the fields that exist. This derives the
// second set from the shipped writers instead of trusting a list.

// Every field any writer puts into a `typing_logs` document. Derived, not
// listed: the call sites are found by locating the collection name, the
// enclosing setDoc() is brace-matched, and its payload object's keys are read.
// `...payload` is expanded by CALLING daylog.js's two builders, so the dynamic
// half is exact rather than guessed.
function typingLogsWrittenFields() {
    const fields = new Set();
    let sawSpread = false;
    let sites = 0;

    for (const [label, src] of [['game.js', gameCode], ['learn.js', learnCode]]) {
        const re = /['"]typing_logs['"]/g;
        let m;
        while ((m = re.exec(src))) {
            // The setDoc() may open BEFORE the collection name (an inline
            // `doc()` as its first argument) or AFTER it (`const ref =
            // doc(...)` and then `setDoc(ref, {...})`), so look both ways.
            const back = src.lastIndexOf('setDoc(', m.index);
            const fwd  = src.indexOf('setDoc(', m.index);
            const cand = [];
            if (back >= 0 && m.index - back < 200) cand.push(back);
            if (fwd  >= 0 && fwd - m.index < 2500) cand.push(fwd);
            if (!cand.length) throw new Error(`${label}: a typing_logs reference with no setDoc near it`);
            for (const at of cand) {
                const obj = objectLiteralAt(src, at);
                if (!obj) continue;
                sites++;
                if (/\.\.\.payload/.test(obj)) sawSpread = true;
                for (const k of obj.matchAll(/^\s*(?:\.\.\.)?([A-Za-z_$][\w$]*)\s*:/gm)) fields.add(k[1]);
            }
        }
    }

    if (sawSpread) {
        // ⚠️ CALLED, NOT MIRRORED. These builders are date-gated across the
        // 2026-08-22 source-split cutover and return DIFFERENT keys on each
        // side of it, so both sides are expanded. A mirrored copy here would
        // be a second statement of the payload shape, which is the twin
        // failure this project has hit repeatedly. Rule 9.
        const trio = { seconds: 1, chars: 1, mistakes: 1 };
        for (const source of ['library', 'school']) {
            for (const d of ['2020-01-01', '2030-01-01']) {
                Object.keys(dayLogPayloadFor(source, d, { day: trio, own: trio }))
                    .forEach(k => fields.add(k));
            }
            Object.keys(carryOverPayloadFor(source, '2030-01-01',
                { stored: trio, add: trio })).forEach(k => fields.add(k));
        }
    }
    return { fields, sawSpread, sites };
}

const { fields: written, sawSpread, sites } = typingLogsWrittenFields();

ok('the writer scan found the typing_logs payloads at all',
   sites >= 4 && written.size >= 8 && sawSpread,
   `${sites} payload(s), ${written.size} field(s), spread seen: ${sawSpread} — ` +
   'if this ever reads zero, every assertion below it is vacuous and green');
ok('it agrees with daylog.js about the per-source field names',
   Object.values(SOURCE_FIELDS).every(f =>
       written.has(f.seconds) && written.has(f.chars) && written.has(f.mistakes)),
   'the builders and the scan disagree, so one of them is not reading the ' +
   'shipped writers');

// ⚠️⚠️ THE FACT THE WHOLE DEFECT TURNED ON, ASSERTED AS A FACT.
ok('⚠️⚠️ NO writer of typing_logs writes a per-book id — it is a DAY rollup',
   !written.has('bookId'),
   'if a writer ever DOES add one, this assertion is the place to decide whether ' +
   'a per-day document naming a single book can possibly be correct');

// The ratchet. Every filter this page aims at typing_logs must name a field
// that exists on the documents.
{
    const bad = [];
    let scanned = 0;
    const scopes = [];
    const re = /collection\(db,\s*['"]typing_logs['"]\)/g;
    let m;
    while ((m = re.exec(reportsCode))) {
        // The queries are built from a `logsRef` handed to a helper, so the
        // filters are not adjacent to the collection() call. Take the
        // enclosing function and its continuation instead.
        const fnStart = reportsCode.lastIndexOf('function ', m.index);
        scopes.push(reportsCode.slice(fnStart, m.index + 4000));
    }
    // buildScopedQuery() is where the report's real filters live, and it
    // RECEIVES the ref rather than creating it — so it is scanned by name.
    scopes.push(extractFn(reportsCode, 'buildScopedQuery') || '');
    for (const scope of scopes) {
        for (const w of scope.matchAll(/where\(\s*['"]([\w.]+)['"]/g)) {
            scanned++;
            if (!written.has(w[1])) bad.push(w[1]);
        }
    }
    ok('the ratchet actually found filters to check', scanned >= 3,
       `only ${scanned} filter(s) seen — a scan that finds none passes for free`);
    ok('⭐ every typing_logs filter on this page names a field that is written',
       bad.length === 0,
       bad.length
           ? `filters on field(s) no writer writes: ${[...new Set(bad)].join(', ')} — ` +
             'that query returns nothing, forever, silently'
           : `checked against ${written.size} written field(s)`);
}

console.log(fail ? `\n✗ FAIL — ${pass} passed, ${fail} failed` : `\n✓ PASS — ${pass} passed, 0 failed`);
process.exit(fail ? 1 : 0);
