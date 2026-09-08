// popularity-sort-test.mjs v1.0.0 — ROADMAP 54: SORT THE LIBRARY BY MOST
// POPULAR, DERIVED FROM WRITES THAT ALREADY HAPPEN, NEVER LIVE.
//
// ⚠️ WHY THIS IS ONE FILE ACROSS THREE SOURCES. The feature only works if all
// three agree on the same document shape: reports.html WRITES
// settings/popularity.counts, index.html READS it, and firestore.rules
// decides who's allowed to do either. A harness that only checked one of the
// three could stay green while the other two drifted out of step with it.
//
// BEHAVIOURAL where the logic is pure (sortBooks()'s 'popular' case,
// popularityOf()). STRUCTURAL everywhere the surface is DOM/Firestore-shaped
// with no framework here to mount it in — matching this project's own
// BEHAVIOURAL/STRUCTURAL split (inline-styles-test.mjs, class-week-anchor-test.mjs).

import fs from 'fs';

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

const indexHtml   = fs.readFileSync(new URL('../index.html',   import.meta.url), 'utf8');
const reportsHtml = fs.readFileSync(new URL('../reports.html', import.meta.url), 'utf8');
const rules       = fs.readFileSync(new URL('../firebase/firestore.rules', import.meta.url), 'utf8');

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

    const f = new Function(
        'titleSortKey', 'authorSortKey', 'lengthOf', 'popularityOf', 'activeSort',
        sortBooksSrc + '\nreturn sortBooks;'
    )(titleSortKey, authorSortKey, lengthOf,
      (b) => (counts[b.id] || 0), 'popular');

    const order = f(books).map(b => b.id);
    ok('most-typed books come first',
       order.indexOf('zeta') < order.indexOf('mid') &&
       order.indexOf('alpha') < order.indexOf('mid'),
       order.join(','));
    ok('a book never typed sorts LAST, not first or crashing the comparator',
       order[order.length - 1] === 'never', order.join(','));
    ok('a tie in popularity (zeta=alpha=10) breaks on title, alphabetically',
       order.indexOf('alpha') < order.indexOf('zeta'), order.join(','));
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nB — index.html: THE LAZY FETCH — ZERO COST UNTIL SOMEONE ASKS');
// ═══════════════════════════════════════════════════════════════════════════

ok('a "Most Popular" option exists in the sort control',
   /<option value="popular">Most Popular<\/option>/.test(indexHtml));

const ensureFn = extractFn(indexHtml, 'ensurePopularityLoaded') ||
    (() => {
        // async function declarations need their own extractor — extractFn's
        // indexOf('function ' + name) still matches "async function ensure…"
        // since that substring is present after "async ", so this fallback
        // exists only in case the declaration style ever changes.
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
    const fetchSites = [...indexHtml.matchAll(/doc\(db,\s*['"]settings['"],\s*['"]popularity['"]\)/g)];
    ok('settings/popularity is fetched from exactly ONE call site in index.html',
       fetchSites.length === 1, `found ${fetchSites.length} call sites`);
}
ok('the sort-select change handler awaits the load before re-rendering, only for \'popular\'',
   /if\s*\(activeSort === 'popular'\)\s*await ensurePopularityLoaded\(\);/.test(indexHtml));

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nC — reports.html: recalculatePopularity() — STAFF-TRIGGERED, NEVER LIVE');
// ═══════════════════════════════════════════════════════════════════════════

const recalcFn = (() => {
    const at = reportsHtml.indexOf('async function recalculatePopularity');
    if (at < 0) return null;
    const brace = reportsHtml.indexOf('{', at);
    let depth = 0;
    for (let j = brace; j < reportsHtml.length; j++) {
        if (reportsHtml[j] === '{') depth++;
        else if (reportsHtml[j] === '}') { depth--; if (depth === 0) return reportsHtml.slice(at, j + 1); }
    }
    return null;
})();
ok('recalculatePopularity() exists', !!recalcFn);
ok('it counts with getCountFromServer, not by reading every session document',
   /getCountFromServer\(/.test(recalcFn || ''),
   'a getDocs() over typing_logs here would be the full-collection read this feature exists to avoid');
ok('it queries typing_logs filtered by bookId, per book',
   /where\(['"]bookId['"],\s*['"]==['"],\s*bookId\)/.test(recalcFn || ''));
ok('it writes the result to settings/popularity',
   /setDoc\(doc\(db,\s*['"]settings['"],\s*['"]popularity['"]\)/.test(recalcFn || ''));
ok('the write includes an updatedAt stamp',
   /updatedAt:\s*new Date\(\)\.toISOString\(\)/.test(recalcFn || ''));

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
console.log('\nD — firestore.rules: THE NEW DOCUMENT\'S ACCESS TIER');
// ═══════════════════════════════════════════════════════════════════════════

ok('settings/popularity is guest-readable, same tier as settings/goals',
   /docId == 'goals' \|\| docId == 'popularity' \|\| signedIn\(\)/.test(rules));
// ⚠️ THE WRITE RULE IS THE WHOLE POINT — if a signed-in student could write
// this document, a class of kids could hand-pick which books look "popular".
{
    const at = rules.indexOf("match /settings/{docId}");
    const block = at < 0 ? '' : rules.slice(at, rules.indexOf('}', rules.indexOf('}', at) + 1) + 1);
    ok('settings/{docId} write stays isSuper()-only — no per-document carve-out for popularity',
       /allow write:\s*if isSuper\(\);/.test(block));
}

console.log(fail ? `\n✗ FAIL — ${pass} passed, ${fail} failed` : `\n✓ PASS — ${pass} passed, 0 failed`);
process.exit(fail ? 1 : 0);
