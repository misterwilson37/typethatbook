// featured-shelf-test.mjs v1.2.0 — ROADMAP 53 + 69. FEATURED IS A MIXTURE:
// SOME NEW, THE REST A DISCOVERY DRAW, AND ALL OF IT SHUFFLED.
//
// ⚠️⚠️ v1.2.0 — THE "NEWEST" HALF WAS DETERMINISTIC AND THIS FILE PROVED IT
// WAS, WHICH IS NOT THE SAME AS PROVING IT SHOULD BE. B1–B4 and E5 all pinned
// `sort((a,b) => b.at - a.at).slice(0, MAX)` — a total order over a stable
// field, so a fortnight of page loads showed identical titles. Jake,
// 2026-09-08: "Ideally, the 'Featured' would be different every time, or at
// least not the same 2 titles every time." Three books were inside the window
// when he said it, and the row had shown the same two for days.
//
// ⚠️ SO B1–B4's `pickNewest()` MIRROR NOW DESCRIBES A CANDIDATE SET, NOT AN
// ORDER — it is kept because "which books are eligible" and "0 never counts as
// new" are still real rules with real edge cases, and only the ordering claim
// was wrong. ⭐ E5 IS REWRITTEN INTO THE DECISION THAT SUPERSEDED IT rather
// than deleted, following D4's own precedent in this file: E5 used to assert
// that the cache MUST NOT reach the new path, and now both halves of the pick
// deliberately run through it. A superseded assertion is worth rewriting into
// the reason it changed, so the next reader learns the history instead of
// finding a gap. Part F is new and covers the two-up grid and the row's card
// count, which are now a single coupled decision.
//
// Jake, 2026-09-06: "I think 'featured' should just be 'newest' and then if
// nothing is new within a week or 2, 'featured' should be random, untyped
// books" — then, on the fallback specifically: "'plain random' is fine."
// That second answer is why this file never checks for popularity weighting
// — ROADMAP 54's counter is a separate, later feature, and building it into
// 53's fallback was explicitly declined.
//
// Same shape as continue-reading-test.mjs, on purpose: `bookUploadedAtMs()`
// is lifted from the shipped file and RUN, because it has the same
// four-shape timestamp problem `progressTimeMs()` does and a duplicated
// implementation in this test would pass forever while the page did
// something else. The selection pipelines (newest-window, random-fallback)
// are mirrored rather than lifted, matching that file's own Part B — the
// DOM-rendering half of renderFeatured() is checked structurally instead.

import { readFileSync } from 'fs';
import { strict as assert } from 'node:assert';

const src = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function liftFn(name) {
    const k = src.indexOf('function ' + name + '(');
    if (k < 0) throw new Error('could not find function ' + name + ' in index.html');
    let d = 0;
    for (let x = src.indexOf('{', k); x < src.length; x++) {
        if (src[x] === '{') d++;
        else if (src[x] === '}') { d--; if (!d) return src.slice(k, x + 1); }
    }
    throw new Error('unbalanced braces lifting ' + name);
}

// ⚠️ LIFTED FROM THE SHIPPED FILE, NOT REIMPLEMENTED HERE — same reasoning as
// continue-reading-test.mjs's progressTimeMs.
const bookUploadedAtMs = new Function(liftFn('bookUploadedAtMs') + '; return bookUploadedAtMs;')();

const results = [];
function check(name, fn) {
    try { fn(); results.push(['ok', name]); }
    catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
}

const WHEN = Date.UTC(2026, 8, 6, 14, 30, 0);
const DAY = 86400000;

// ─── A. EVERY SHAPE `uploadedAt` CAN ARRIVE IN ──────────────────────────────

check('A1. a cold-read Firestore Timestamp (has .toDate)', () => {
    const b = { uploadedAt: { toDate: () => new Date(WHEN) } };
    assert.equal(bookUploadedAtMs(b), WHEN);
});

check('A2. the CACHED shape after a localStorage round-trip', () => {
    // ⚠️ THE CASE THAT ACTUALLY RUNS ALL DAY. idxCacheWrite() JSON-stringifies
    // allBooks, which turns a Timestamp into a plain { seconds, nanoseconds }.
    const cold = { uploadedAt: { toDate: () => new Date(WHEN) } };
    const roundTripped = JSON.parse(JSON.stringify({
        uploadedAt: { seconds: Math.floor(WHEN / 1000), nanoseconds: 0 },
    }));
    assert.equal(typeof roundTripped.uploadedAt.toDate, 'undefined',
        'the round-trip must really have stripped the method, or this proves nothing');
    assert.equal(bookUploadedAtMs(roundTripped), bookUploadedAtMs(cold),
        'cached and cold must rank IDENTICALLY or a book\u2019s "new" status flips ' +
        'at the eight-hour cache boundary for no reason a reader could see');
});

check('A3. a legacy ISO string, a raw epoch number, a real Date', () => {
    assert.equal(bookUploadedAtMs({ uploadedAt: new Date(WHEN).toISOString() }), WHEN);
    assert.equal(bookUploadedAtMs({ uploadedAt: WHEN }), WHEN);
    assert.equal(bookUploadedAtMs({ uploadedAt: new Date(WHEN) }), WHEN);
});

check('A4. absent, null and junk all rank 0 and never throw', () => {
    // ⚠️ A THROW HERE TAKES THE WHOLE LIBRARY PAGE DOWN, not just the row —
    // renderFeatured() runs from renderBooks(), which draws the shelf.
    for (const v of [undefined, null, {}, { uploadedAt: null }, { uploadedAt: {} },
                     { uploadedAt: 'not a date' }, { uploadedAt: NaN },
                     { uploadedAt: { toDate: () => { throw new Error('boom'); } } }]) {
        assert.equal(bookUploadedAtMs(v), 0, 'shape: ' + JSON.stringify(v));
    }
});

check('A5. a book with NO uploadedAt at all never counts as new', () => {
    // ⚠️ THE CASE JAKE'S OWN LIBRARY IS FULL OF. Every book uploaded before
    // admin.js started stamping this field has no evidence it belongs in
    // the "newest" window — 0 is not "less new than everything," it is
    // "unknown," and unknown must never win a recency sort by accident.
    assert.equal(bookUploadedAtMs({}), 0);
    assert.ok(0 <= Date.now() - 14 * DAY,
        'sanity: 0 must fall outside any real FEATURED_WINDOW_MS cutoff');
});

// ─── B. THE NEWEST-WINDOW SELECTION ─────────────────────────────────────────
//
// Mirrors the first half of renderFeatured()'s pipeline: keep books whose
// uploadedAt falls after the cutoff, newest first, capped.

function pickNewest(allBooks, cutoff, max = 3) {
    return allBooks
        .map(book => ({ book, at: bookUploadedAtMs(book) }))
        .filter(x => x.at > cutoff)
        .sort((a, b) => b.at - a.at)
        .slice(0, max)
        .map(x => x.book.id);
}

const WINDOW = 14 * DAY;

check('B1. a book added yesterday is newest', () => {
    const books = [
        { id: 'old',   uploadedAt: WHEN - 90 * DAY },
        { id: 'fresh', uploadedAt: WHEN - 1 * DAY },
    ];
    assert.deepEqual(pickNewest(books, WHEN - WINDOW), ['fresh']);
});

check('B2. outside the window, nothing is newest — the fallback must take over', () => {
    const books = [{ id: 'old', uploadedAt: WHEN - 20 * DAY }];
    assert.deepEqual(pickNewest(books, WHEN - WINDOW), []);
});

check('B3. several within the window sort newest-first and cap at max', () => {
    const books = [
        { id: 'a', uploadedAt: WHEN - 10 * DAY },
        { id: 'b', uploadedAt: WHEN - 1 * DAY },
        { id: 'c', uploadedAt: WHEN - 5 * DAY },
        { id: 'd', uploadedAt: WHEN - 2 * DAY },
    ];
    assert.deepEqual(pickNewest(books, WHEN - WINDOW, 3), ['b', 'd', 'c']);
});

check('B4. a book with no stamp never displaces a stamped one, even a very old one', () => {
    const books = [
        { id: 'stamped',   uploadedAt: WHEN - 13 * DAY },
        { id: 'unstamped' /* no uploadedAt at all */ },
    ];
    assert.deepEqual(pickNewest(books, WHEN - WINDOW), ['stamped']);
});

// ─── C. THE RANDOM-UNTYPED FALLBACK ─────────────────────────────────────────
//
// Mirrors the second half: exclude anything in userProgress, then pick from
// what's left. "Plain random" per Jake's own answer — no popularity weighting.

function untypedPool(allBooks, userProgress) {
    const started = new Set(Object.keys(userProgress || {}));
    return allBooks.filter(b => !started.has(b.id)).map(b => b.id);
}

check('C1. a started book is excluded from the fallback pool', () => {
    const books = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const pool = untypedPool(books, { a: { lastUpdated: WHEN } });
    assert.deepEqual(pool.sort(), ['b', 'c']);
});

check('C2. a guest (no progress at all) gets the WHOLE library as the pool', () => {
    // ⚠️ THIS IS WHY renderFeatured() NEEDS NO GUEST SPECIAL-CASE. An empty
    // exclusion set naturally reduces to "everything," which is exactly the
    // plain-random behaviour a guest should see.
    const books = [{ id: 'a' }, { id: 'b' }];
    assert.deepEqual(untypedPool(books, {}).sort(), ['a', 'b']);
    assert.deepEqual(untypedPool(books, undefined).sort(), ['a', 'b']);
});

check('C3. a student who has started every book gets an empty pool, not a crash', () => {
    const books = [{ id: 'a' }, { id: 'b' }];
    const pool = untypedPool(books, { a: {}, b: {} });
    assert.deepEqual(pool, []);
});

// ─── D. THE SHIPPED FUNCTION MATCHES THIS SHAPE, STRUCTURALLY ──────────────

const renderFeaturedSrc = liftFn('renderFeatured');

check('D1. renderFeatured() filters on the SAME window constant it declares', () => {
    assert.match(src, /FEATURED_WINDOW_MS\s*=\s*14\s*\*\s*24\s*\*\s*3600\s*\*\s*1000/,
        'the 14-day window moved without this test being told why');
    assert.match(renderFeaturedSrc, /x\.at\s*>\s*cutoff/,
        'renderFeatured() no longer filters newest picks against the cutoff');
});

check('D2. \u26a0\ufe0f a book with no uploadedAt (at === 0) cannot pass the cutoff filter', () => {
    // ⚠️⚠️ THE ONE A LOOSER FILTER WOULD LET THROUGH. `x.at > cutoff` with a
    // FUTURE-dated or zero cutoff would still exclude 0 correctly, but a
    // careless rewrite to `x.at >= cutoff` combined with a cutoff of exactly
    // 0 would not. This pins the operator, not just the constant.
    assert.doesNotMatch(renderFeaturedSrc, /x\.at\s*>=\s*cutoff/,
        '>= would let an unstamped book (at === 0) through if cutoff were ever 0 or negative');
});

check('D3. the random fallback excludes started books, via userProgress', () => {
    assert.match(renderFeaturedSrc, /started\.has\(b\.id\)/,
        'the fallback pool no longer excludes books the student has already opened');
    assert.match(renderFeaturedSrc, /Object\.keys\(userProgress/,
        'the exclusion set no longer comes from userProgress \u2014 check what replaced it');
});

check('D4. the random pick is cached, and the cache is STAMPED', () => {
    // ⚠️⚠️ THIS ASSERTION USED TO READ:
    //     assert.match(renderFeaturedSrc, /if\s*\(\s*!_featuredRandomCache\s*\)/)
    // It was green for the whole life of the defect Part E now covers, and it
    // was green BECAUSE of it — a write-once cache is exactly what that regex
    // demanded, and a write-once cache is what froze the pre-auth answer.
    // ⭐ REPLACED WITH THE RULE THAT SUPERSEDED IT rather than deleted: a
    // superseded assertion is worth rewriting into the decision that replaced
    // it, so the next reader learns why the shape changed instead of finding
    // a gap. The stability half it was protecting has not been dropped — it
    // moved to E2, where it is RUN rather than grepped.
    assert.match(src, /_featuredRandomCache/,
        'the stable-random cache is gone \u2014 the row would reshuffle on every ' +
        'sort/filter click, which reads as broken');
    assert.match(src, /_featuredRandomStamp/,
        'the cache is unstamped again \u2014 that is the v3.18.0 defect returning: ' +
        'a write-once cache freezes the pre-auth answer, when userProgress is {}');
    assert.match(renderFeaturedSrc, /_featuredRandomStamp\s*!==\s*stamp/,
        'renderFeatured() no longer compares the stamp before reusing the cache');
    assert.match(renderFeaturedSrc, /_featuredRandomStamp\s*=\s*stamp/,
        'the stamp is compared but never recorded \u2014 the cache would re-roll on ' +
        'every single render, which is E2\u2019s failure, not E1\u2019s');
});

check('D5. renderFeatured() is called from renderBooks(), same as renderContinue()', () => {
    const renderBooksSrc = liftFn('renderBooks');
    assert.match(renderBooksSrc, /renderContinue\(\)/, 'renderContinue() call is gone from renderBooks()');
    assert.match(renderBooksSrc, /renderFeatured\(\)/,
        'renderFeatured() is not called from renderBooks() \u2014 it would go stale ' +
        'on 7 of its 8 call sites');
});

check('D6. the badge is decided PER CARD, not once for the row', () => {
    // ⚠️⚠️ THIS ASSERTION USED TO READ:
    //     assert.match(renderFeaturedSrc, /isNew\s*\?\s*'New'\s*:\s*'Featured'/)
    // That was correct for as long as the row was newest-OR-random and could
    // only ever be one of the two. It is a MIXTURE now, so a single `isNew`
    // for the whole row would mislabel every card in it — the reserved new
    // pick and the discovery picks would all claim the same badge.
    assert.match(renderFeaturedSrc, /newIds\.has\(book\.id\)\s*\?\s*'New'\s*:\s*'Featured'/,
        'the badge is not read per book \u2014 a mixed row would label its ' +
        'discovery picks "New", or its new upload "Featured"');
    // ⚠️⚠️ COMMENTS ARE STRIPPED FIRST, AND THIS IS THE FOURTH TIME THIS REPO
    // HAS HIT THAT — HANDOFF §3 predicted a fourth by name. renderFeatured()'s
    // own comment EXPLAINS why the row-wide `isNew` was removed, and a bare
    // grep read the explanation as the violation and went red against correct
    // code. arcade-lesson-test.mjs and staff-tokens-test.mjs carry the
    // identical note for the identical reason.
    const noComments = renderFeaturedSrc
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
    assert.doesNotMatch(noComments, /\bisNew\b/,
        'a row-wide isNew flag came back \u2014 it cannot describe a mixed row');
});

check('D9. some slots are RESERVED for new books, and never all of them', () => {
    // ⚠️ BOTH BOUNDS ARE THE POINT. At zero, a brand-new upload could be
    // invisible on the row whose job is announcing it. At FEATURED_MAX, this
    // is the old deterministic newest-only row wearing a new name, and Jake's
    // complaint comes straight back.
    assert.match(src, /FEATURED_NEW_SLOTS\s*=\s*Math\.max\(1,\s*FEATURED_MAX\s*-\s*1\)/,
        'the reserved-slot count is no longer bounded below by 1 and above by ' +
        'FEATURED_MAX - 1 \u2014 read the constant\u2019s own comment');
    assert.match(renderFeaturedSrc, /FEATURED_NEW_SLOTS/,
        'renderFeatured() no longer honours the reserved-slot count');
});

check('D10. every pool the pick draws from is SHUFFLED, and allBooks is not', () => {
    // ⚠️ THE FISHER-YATES MUST RUN ON A COPY. allBooks is what renderBooks()
    // sorts and filters for the shelf; shuffling it in place would reorder the
    // stacks under the child as a side effect of drawing two cards.
    assert.match(renderFeaturedSrc, /const out = pool\.slice\(\)/,
        'the shuffle no longer copies \u2014 it is reordering allBooks in place');
    const fills = [...renderFeaturedSrc.matchAll(/fillTo\([^)]*,\s*shuffled\(/g)];
    assert.ok(fills.length >= 2,
        `every fill must draw from a shuffled pool (found ${fills.length} that do)`);
    assert.doesNotMatch(renderFeaturedSrc, /\.sort\(\(a, b\) => b\.at - a\.at\)/,
        '⚠️ the deterministic newest-first sort is back \u2014 that is the exact ' +
        'shape that showed Jake the same two titles for a fortnight');
});

check('D7. reuses .continue-card, not a parallel .featured-card', () => {
    assert.match(renderFeaturedSrc, /class="continue-card"/,
        'renderFeatured() built its own card class \u2014 check whether the pinned ' +
        'grid/cover/title CSS on .continue-card was actually duplicated or shared');
    assert.doesNotMatch(renderFeaturedSrc, /class="featured-card"/,
        'a parallel .featured-card class appeared \u2014 confirm this was deliberate, ' +
        'not accidental drift from .continue-card');
});

check('D8. the markup exists and starts hidden', () => {
    assert.match(src, /id="featured-row"[^>]*hidden/, '#featured-row is gone or no longer starts hidden');
    assert.match(src, /id="featured-grid"/, '#featured-grid is gone');
});

// ─── E. THE FALLBACK IS ROLLED WHEN THE ANSWER IS KNOWN, NOT BEFORE ────────
//
// ⚠️⚠️ THIS SECTION EXISTS BECAUSE PART D WENT GREEN AGAINST A DEFECT, AND
// D4 IS THE ASSERTION THAT PINNED IT IN PLACE.
//
// v1.0.0 lifted `untypedPool()` as a pure function (C1–C3), proved it
// excludes started books, then checked STRUCTURALLY that renderFeatured()
// contains `started.has(b.id)` (D3) and caches behind `if
// (!_featuredRandomCache)` (D4). Every one of those passed while the
// exclusion did nothing, because none of them asked WHEN the cache is
// filled — and the answer was "before `userProgress` exists."
//
// The real load order, from index.html itself:
//
//   1. `loadBooks()` fires at module load, fire-and-forget (the INIT block
//      says so in its own comment: auth is unresolved at this point).
//   2. `_loadBooksOnce()` calls `renderBooks()` on ALL THREE of its paths —
//      trusted cache, count-validated cache, and the full fetch.
//   3. `renderBooks()` calls `renderFeatured()`.
//   4. Only later does `onAuthStateChanged` await `loadUserProgress()`.
//
// So on an ordinary warm-cache load the dice are rolled while
// `userProgress` is still `{}`, the exclusion set is empty, and a
// write-once cache freezes that answer for the rest of the page. The
// student is shown "random, untyped" books drawn from a pool that
// excluded nothing.
//
// ⚠️ SAME SHAPE AS ROADMAP 43, one round later and in the adjacent file:
// an empty map captured during the pre-auth window and then treated as a
// valid cached answer. That one locked a child out of the curriculum; this
// one only shows them a book they have already typed — but the mechanism
// is identical and so is the reason it survived review.
//
// ⚠️ THESE CHECKS RUN THE SHIPPED FUNCTION. It is lifted and executed
// against a stub DOM, with its module-level free variables (`allBooks`,
// `userProgress`, `currentUser`, `document`) hosted on globalThis so they
// stay LIVE between calls — a `const` copy would freeze the very thing
// under test. `Math.random` is stubbed to a fixed LCG so nothing here can
// be flaky; a shuffle that depends on real entropy would make a red run
// unreproducible, which is worse than no coverage.

const renderFeaturedRunner = (() => {
    const factory = new Function(`
        let _featuredRandomCache = null;
        let _featuredRandomStamp = null;
        ${renderFeaturedSrc}
        return {
            render: renderFeatured,
            peek: () => _featuredRandomCache,
        };
    `);
    return factory;
})();

function makeStubDom() {
    const row  = { hidden: true, innerHTML: '' };
    const grid = { hidden: true, innerHTML: '' };
    return {
        row, grid,
        document: {
            getElementById: (id) =>
                id === 'featured-row' ? row : id === 'featured-grid' ? grid : null,
        },
    };
}

// A deterministic pseudo-random source. Any fixed sequence will do; what
// matters is that a failure here is reproducible on the next run.
function seededRandom(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Pulls the ids back out of the rendered markup, so these assertions read
// what a student would actually see rather than an internal array.
function renderedIds(grid) {
    return [...grid.innerHTML.matchAll(/book=([^"]+)"/g)].map(m => decodeURIComponent(m[1]));
}

function withFeaturedEnv(fn) {
    const saved = {
        document: globalThis.document,
        allBooks: globalThis.allBooks,
        userProgress: globalThis.userProgress,
        currentUser: globalThis.currentUser,
        FEATURED_WINDOW_MS: globalThis.FEATURED_WINDOW_MS,
        FEATURED_MAX: globalThis.FEATURED_MAX,
        FEATURED_NEW_SLOTS: globalThis.FEATURED_NEW_SLOTS,
        bookUploadedAtMs: globalThis.bookUploadedAtMs,
        escapeAttr: globalThis.escapeAttr,
        escapeHtml: globalThis.escapeHtml,
        random: Math.random,
    };
    try {
        globalThis.FEATURED_WINDOW_MS = WINDOW;
        // ⚠️ THE CONSTANTS ARE INJECTED, NOT READ FROM index.html, SO PART E
        // KEEPS ITS 3-CARD ARITHMETIC WHILE THE SHIPPED ROW IS 2. Part F is
        // what checks the shipped values, and it checks them against the GRID
        // rather than against a number written here — a hardcoded 2 in this
        // file would just be a second place to forget to change.
        globalThis.FEATURED_MAX = 3;
        globalThis.FEATURED_NEW_SLOTS = 2;
        globalThis.bookUploadedAtMs = bookUploadedAtMs;
        globalThis.escapeAttr = (s) => String(s);
        globalThis.escapeHtml = (s) => String(s);
        Math.random = seededRandom(20260906);
        return fn();
    } finally {
        for (const [k, v] of Object.entries(saved)) {
            if (k === 'random') Math.random = v; else globalThis[k] = v;
        }
    }
}

// 20 books, none of them new (no uploadedAt at all), so the newest branch
// is guaranteed empty and the fallback is what runs. The student has
// started 17 of them, leaving a 3-book untyped pool and FEATURED_MAX of 3
// — so a correct implementation has exactly ONE possible answer and a
// broken one is overwhelmingly unlikely to stumble onto it.
const E_BOOKS = Array.from({ length: 20 }, (_, i) => ({ id: 'b' + i, title: 'Book ' + i }));
const E_STARTED = Object.fromEntries(E_BOOKS.slice(0, 17).map(b => [b.id, { lastUpdated: WHEN }]));
const E_UNTYPED = new Set(E_BOOKS.slice(17).map(b => b.id));

check('E1. \u26a0\ufe0f\u26a0\ufe0f the pre-auth render must not freeze the fallback pool', () => {
    withFeaturedEnv(() => {
        const dom = makeStubDom();
        globalThis.document = dom.document;
        const featured = renderFeaturedRunner();

        // ── The render that really happens first: loadBooks() → renderBooks()
        //    → renderFeatured(), with auth unresolved.
        globalThis.allBooks = E_BOOKS;
        globalThis.userProgress = {};
        globalThis.currentUser = null;
        featured.render();

        // ── Then auth resolves and loadUserProgress() fills in the real set.
        globalThis.currentUser = { uid: 'student-1' };
        globalThis.userProgress = E_STARTED;
        featured.render();

        const shown = renderedIds(dom.grid);
        assert.equal(shown.length, 3, 'the row should still be showing FEATURED_MAX cards');
        const leaked = shown.filter(id => !E_UNTYPED.has(id));
        assert.deepEqual(leaked, [],
            'the student is being shown ' + leaked.length + ' book(s) they have already ' +
            'typed \u2014 the fallback pool was chosen during the pre-auth render, when ' +
            'userProgress was still {} and the exclusion set was empty, and a write-once ' +
            'cache then froze it for the rest of the page load');
    });
});

check('E2. \u2b50 and it still does NOT re-roll on an ordinary sort or filter click', () => {
    // ⚠️ THE HALF D4 WAS PROTECTING, AND IT IS A REAL REQUIREMENT — not
    // something to sacrifice to fix E1. renderBooks() runs from eight call
    // sites; a row that reshuffles when a child changes the genre filter
    // reads as broken. E1 and E2 together say: re-roll when the ANSWER
    // changes, never when the view does.
    // ⚠️⚠️ THIS CHECK'S FIRST DRAFT REUSED E_STARTED AND WAS TOO WEAK TO
    // FAIL. That leaves an untyped pool of exactly FEATURED_MAX, so every
    // possible draw contains the SAME three books and only their ORDER can
    // vary — deleting `_featuredRandomStamp = stamp` (which re-rolls on
    // every single render) left it green. Caught by mutation-testing the
    // fix rather than by reading. It uses a 15-book pool now, where a
    // re-roll changes which books appear, not just their order.
    withFeaturedEnv(() => {
        const dom = makeStubDom();
        globalThis.document = dom.document;
        const featured = renderFeaturedRunner();

        globalThis.allBooks = E_BOOKS;
        globalThis.currentUser = { uid: 'student-1' };
        globalThis.userProgress = Object.fromEntries(
            E_BOOKS.slice(0, 5).map(b => [b.id, { lastUpdated: WHEN }]));

        featured.render();
        const first = renderedIds(dom.grid);
        assert.equal(first.length, 3, 'sanity: the row must be drawing cards to compare');
        for (let i = 0; i < 5; i++) featured.render();   // sort, filter, genre, filter, sort
        assert.deepEqual(renderedIds(dom.grid), first,
            'the Featured row reshuffled across renders with identical state \u2014 a child ' +
            'changing the genre filter would watch it change under them');
    });
});

check('E3. a different student on the same page load gets their OWN exclusion set', () => {
    // ⚠️ THE SHARED-CHROMEBOOK CASE THE AUTH HANDLER ALREADY TAKES
    // SERIOUSLY: `lastAuthUid` exists precisely so "the progress pips must
    // not survive" a sign-out and sign-in as someone else. The Featured row
    // must not survive it either.
    withFeaturedEnv(() => {
        const dom = makeStubDom();
        globalThis.document = dom.document;
        const featured = renderFeaturedRunner();

        globalThis.allBooks = E_BOOKS;
        globalThis.currentUser = { uid: 'student-1' };
        globalThis.userProgress = E_STARTED;
        featured.render();

        // Signs out, then a different child signs in — one who has started
        // a DIFFERENT 17 books, so the two untyped pools are disjoint.
        const otherStarted = Object.fromEntries(E_BOOKS.slice(3).map(b => [b.id, {}]));
        const otherUntyped = new Set(E_BOOKS.slice(0, 3).map(b => b.id));
        globalThis.currentUser = { uid: 'student-2' };
        globalThis.userProgress = otherStarted;
        featured.render();

        const shown = renderedIds(dom.grid);
        const leaked = shown.filter(id => !otherUntyped.has(id));
        assert.deepEqual(leaked, [],
            'the second student is seeing books they have already typed \u2014 the ' +
            'first student\u2019s cached pick survived the identity change');
    });
});

check('E4. a guest still gets a full-library pool, and the row still draws', () => {
    // ⚠️ NOT A REGRESSION TEST FOR E1 \u2014 a guest legitimately has an empty
    // exclusion set, and C2 already proves that reduces to "everything."
    // This pins that the FIX did not make an empty set mean "hide the row."
    // Discovery is the whole point of the row for a signed-out reader.
    withFeaturedEnv(() => {
        const dom = makeStubDom();
        globalThis.document = dom.document;
        const featured = renderFeaturedRunner();

        globalThis.allBooks = E_BOOKS;
        globalThis.currentUser = null;
        globalThis.userProgress = {};
        featured.render();

        assert.equal(dom.row.hidden, false, 'the Featured row is hidden for a guest');
        assert.equal(renderedIds(dom.grid).length, 3, 'a guest should see FEATURED_MAX cards');
        assert.match(dom.grid.innerHTML, /Featured</,
            'the fallback badge should read "Featured", not "New"');
    });
});

check('E6. \u26a0\ufe0f a uid alone is NOT a sufficient stamp \u2014 the narrow window', () => {
    // ⚠️⚠️ E1 CANNOT CATCH THIS ONE AND THAT IS WHY IT IS SEPARATE. E1 goes
    // from "no user" to "user," so a stamp keyed on the uid ALONE would pass
    // it — the uid changes, the cache re-rolls, the answer comes out right.
    //
    // But there is a narrower window in the real page. `onAuthStateChanged`
    // assigns `currentUser = user` on its first line and only fills
    // `userProgress` after `await loadUserProgress()`. The module-load
    // `loadBooks()` is still in flight at that point and calls renderBooks()
    // when it settles — so a render can land with a REAL uid and a STILL
    // EMPTY progress map, and a uid-keyed stamp would freeze that.
    //
    // ⭐ This is what makes the started-ids component of the signature
    // load-bearing rather than belt-and-braces. Drop them from the stamp in
    // index.html and this check goes red on its own.
    withFeaturedEnv(() => {
        const dom = makeStubDom();
        globalThis.document = dom.document;
        const featured = renderFeaturedRunner();

        globalThis.allBooks = E_BOOKS;
        globalThis.currentUser = { uid: 'student-1' };
        globalThis.userProgress = {};          // the await has not returned yet
        featured.render();

        globalThis.userProgress = E_STARTED;   // ...and now it has
        featured.render();

        const leaked = renderedIds(dom.grid).filter(id => !E_UNTYPED.has(id));
        assert.deepEqual(leaked, [],
            'a render that landed between the uid being set and progress arriving ' +
            'froze an empty exclusion set \u2014 the stamp is not reading the started ids');
    });
});

check('E5. a new book still surfaces \u2014 but it SHARES the row now', () => {
    // ⚠️⚠️ THIS CHECK USED TO ASSERT THE OPPOSITE OF WHAT IT ASSERTS NOW, AND
    // THE OLD VERSION WAS RIGHT ABOUT ITS OWN DESIGN. It read:
    //
    //     assert.deepEqual(renderedIds(dom.grid), ['brand-new'],
    //         'a book inside the window must win outright over the random fallback');
    //     assert.equal(featured.peek(), null,
    //         'the random cache was populated on the newest path...');
    //
    // "Win outright" was the v3.19.0 rule and it is exactly what Jake asked to
    // be changed: a single new upload took the WHOLE row, and two or three new
    // uploads took it deterministically, in uploadedAt order, every load for a
    // fortnight. ⭐ The new rule is that a new book is guaranteed A SLOT, not
    // the row — so the cache legitimately holds both halves of the pick, and
    // `peek()` being non-null is now correct rather than a defect.
    //
    // ⚠️ THE HALF THE OLD CHECK WAS PROTECTING IS NOT DROPPED. Its real worry
    // was a book aging out of the moving window while a frozen answer kept
    // ranking it — that is what E7 covers, by putting the new-id set INTO the
    // stamp instead of keeping the branch out of the cache.
    withFeaturedEnv(() => {
        const dom = makeStubDom();
        globalThis.document = dom.document;
        const featured = renderFeaturedRunner();

        globalThis.allBooks = E_BOOKS.concat([
            { id: 'brand-new', title: 'Brand New', uploadedAt: Date.now() - DAY },
        ]);
        globalThis.currentUser = { uid: 'student-1' };
        globalThis.userProgress = E_STARTED;
        featured.render();

        const shown = renderedIds(dom.grid);
        assert.ok(shown.includes('brand-new'),
            'a book inside the window must still be guaranteed a slot \u2014 that is ' +
            'the half of ROADMAP 53 the mixture must not lose');
        assert.equal(shown.length, 3, 'the row should still fill to FEATURED_MAX');
        assert.match(dom.grid.innerHTML, /New</, 'the new book\u2019s badge should read "New"');
        assert.match(dom.grid.innerHTML, /Featured</,
            'the slots beside it are discovery picks and must say so');
        const leaked = shown.filter(id => id !== 'brand-new' && !E_UNTYPED.has(id));
        assert.deepEqual(leaked, [],
            'the non-new slots are still the ROADMAP 53 untyped draw \u2014 a book the ' +
            'student has already opened leaked into one');
    });
});

check('E7. \u26a0\ufe0f a book aging out of the window loses its badge without a reload', () => {
    // ⚠️⚠️ READ THIS BEFORE TRUSTING THE STAMP FOR IT. An earlier draft of this
    // check claimed to be the guard on the new-id component of
    // `_featuredRandomStamp`, and MUTATION-TESTING SAID OTHERWISE: delete that
    // component from index.html and this check stays GREEN, 34/34.
    //
    // ⭐ THE REASON IS THAT THE BADGE IS NOT CACHED AT ALL. `newIds` is derived
    // fresh on every render and `badge` is read from it inside the map over
    // `picks`, so the label follows the clock even when the PICK is a frozen
    // one. That is the right design and it is why the hazard the earlier draft
    // worried about — a Chromebook left open across the window boundary
    // printing "New" over a three-week-old book — cannot happen.
    //
    // ⚠️ SO THIS CHECK IS KEPT FOR THE BEHAVIOUR AND NOT FOR THE MECHANISM.
    // E8 below is the one that fails without the stamp component. If a later
    // round moves the badge INTO the cached pick (storing `{book, badge}`
    // rather than a book), this check becomes the one that goes red, which is
    // exactly what it is here for.
    withFeaturedEnv(() => {
        const dom = makeStubDom();
        globalThis.document = dom.document;
        const featured = renderFeaturedRunner();

        const fresh = { id: 'fresh', title: 'Fresh', uploadedAt: Date.now() - DAY };
        globalThis.allBooks = E_BOOKS.concat([fresh]);
        globalThis.currentUser = { uid: 'student-1' };
        globalThis.userProgress = E_STARTED;
        featured.render();
        assert.ok(renderedIds(dom.grid).includes('fresh'), 'sanity: it starts inside the window');
        assert.match(dom.grid.innerHTML, /New</, 'sanity: it starts badged New');

        // The same book, now older than the window — the library did not
        // change, the clock did.
        fresh.uploadedAt = Date.now() - 30 * DAY;
        featured.render();

        assert.doesNotMatch(dom.grid.innerHTML, /New</,
            'an aged-out book is still badged "New" \u2014 the badge is being read from ' +
            'the cached pick instead of from a freshly derived new-id set');
    });
});

check('E8. \u2b50 a book REPLACED in a live tab still earns its reserved slot', () => {
    // ⚠️⚠️ THIS IS THE ASSERTION THE NEW-ID COMPONENT OF THE STAMP EXISTS FOR,
    // AND IT IS THE ONLY ONE THAT FAILS WITHOUT IT. The other three components
    // cannot see this case: the uid is unchanged, the started set is unchanged,
    // and `allBooks.length` is unchanged — one book left the library and
    // another arrived, which is an ordinary afternoon for Jake (a title pulled
    // for re-cleaning, its replacement uploaded, and a student's tab still open
    // on the Library page through both).
    //
    // ⚠️ TWO THINGS GO WRONG AT ONCE WITHOUT THE RE-ROLL, AND THE SECOND IS
    // WORSE THAN A STALE ROW: the brand-new upload is denied the reserved slot
    // whose entire purpose is announcing it, AND the frozen pick can still be
    // holding the book that was DELETED — a card whose link 404s, which is the
    // exact failure renderContinue() carries a filter against.
    withFeaturedEnv(() => {
        const dom = makeStubDom();
        globalThis.document = dom.document;
        const featured = renderFeaturedRunner();

        // 20 books, none new, 17 started — so the row is three discovery picks
        // drawn from b17/b18/b19, and b19 is certain to be in it.
        globalThis.allBooks = E_BOOKS;
        globalThis.currentUser = { uid: 'student-1' };
        globalThis.userProgress = E_STARTED;
        featured.render();
        assert.ok(renderedIds(dom.grid).includes('b19'),
            'sanity: the pool is exactly FEATURED_MAX, so b19 must be showing');

        // b19 is pulled and a fresh title takes its place. Same count.
        globalThis.allBooks = E_BOOKS.slice(0, 19).concat([
            { id: 'just-uploaded', title: 'Just Uploaded', uploadedAt: Date.now() - DAY },
        ]);
        assert.equal(globalThis.allBooks.length, E_BOOKS.length,
            'sanity: this case only bites while the LENGTH is unchanged');
        featured.render();

        const shown = renderedIds(dom.grid);
        assert.ok(shown.includes('just-uploaded'),
            'the new upload did not get its reserved slot \u2014 the pick was reused ' +
            'because nothing in the stamp noticed the library had changed');
        assert.ok(!shown.includes('b19'),
            '\u26a0\ufe0f the row is still pointing at a book that has left the library ' +
            '\u2014 that card\u2019s link is a 404');
    });
});

// ─── F. THE ROW IS ONE ROW, AND THE CARD COUNT IS PART OF THAT RULE ─────────
//
// ⚠️⚠️ THIS SECTION EXISTS BECAUSE THE CARD COUNT AND THE GRID USED TO BE
// INDEPENDENT AND ARE NOT ANY MORE. FEATURED_MAX's own comment said, for two
// rounds, "matches CONTINUE_MAX for visual consistency — not load-bearing,
// just matching." It became load-bearing the moment .continue-grid stopped
// auto-filling: N cards in a fixed-column grid wrap the moment N exceeds the
// column count, and the wrap is what Jake reported as "1.5 rows, which is
// wonky." Nothing on screen says "this wrapped because a constant in the JS
// disagrees with a rule in the CSS," so it is asserted here.

const cssBlock = (() => {
    const a = src.indexOf('<style>'), b = src.indexOf('</style>');
    return src.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '');
})();

function gridColumnCount(rule) {
    const m = cssBlock.match(new RegExp('\\' + rule.replace('.', '.') +
        '\\s*\\{([^}]*)\\}'));
    if (!m) return null;
    const t = m[1].match(/grid-template-columns:\s*repeat\((\d+),/);
    return t ? Number(t[1]) : null;
}

check('F1. .continue-grid declares a FIXED column count, not auto-fill', () => {
    // ⚠️ auto-fill IS THE DEFECT, NOT THE FIX. It gave the row the shelf's own
    // tracks so 2-span cards aligned to shelf column lines — but .library-grid
    // is capped at max-width 1100px, which resolves to FIVE columns at every
    // desktop width, and three 2-span cards need SIX.
    const m = cssBlock.match(/\.continue-grid\s*\{([^}]*)\}/);
    assert.ok(m, '.continue-grid rule is gone');
    assert.doesNotMatch(m[1], /auto-fill|auto-fit/,
        'the row is auto-filling again \u2014 an odd column count then wraps the last ' +
        'card onto a half-empty second row');
    assert.match(m[1], /grid-template-columns:\s*repeat\(\d+,/,
        'the row no longer states how many cards fit across it');
});

check('F2. \u26a0\ufe0f\u26a0\ufe0f nothing spans two columns any more', () => {
    // The span and the fixed column count together would mean HALF as many
    // cards fit as the count says, and the wrap returns with no rule changed.
    const m = cssBlock.match(/\.continue-card\s*\{([^}]*)\}/);
    assert.ok(m, '.continue-card rule is gone');
    assert.doesNotMatch(m[1], /grid-column/,
        '.continue-card spans columns again \u2014 with a fixed 2-column grid that ' +
        'fits one card per row and wraps the second');
});

check('F3. \u2b50 BOTH row maxima equal the grid\u2019s column count', () => {
    // ⚠️ CHECKED AGAINST THE CSS, NEVER AGAINST A LITERAL WRITTEN HERE. A
    // hardcoded 2 in this file is just a third place to forget.
    const cols = gridColumnCount('.continue-grid');
    assert.ok(cols, 'could not read the column count out of .continue-grid');
    const featuredMax = Number(src.match(/const FEATURED_MAX = (\d+)/)[1]);
    const continueMax = Number(src.match(/const CONTINUE_MAX = (\d+)/)[1]);
    assert.equal(featuredMax, cols,
        `FEATURED_MAX is ${featuredMax} against a ${cols}-column row \u2014 ` +
        (featuredMax > cols ? 'the extra card(s) wrap, which is the 1.5-row complaint'
                            : 'the row renders short and leaves a visible gap'));
    assert.equal(continueMax, cols,
        `CONTINUE_MAX is ${continueMax} against a ${cols}-column row \u2014 ` +
        (continueMax > cols ? 'the extra card(s) wrap, which is the 1.5-row complaint'
                            : 'the row renders short and leaves a visible gap'));
});

check('F4. the narrow-width rule collapses to ONE column, never two', () => {
    // Half of a two-column shelf is narrower than the 56px cover plus a
    // readable title. One card per row is a list; half a card is a defect.
    const media = cssBlock.match(/@media \(max-width: (\d+)px\) \{\s*\.continue-grid \{([^}]*)\}/);
    assert.ok(media, 'the narrow-width override for .continue-grid is gone');
    assert.match(media[2], /grid-template-columns:\s*1fr/,
        'the narrow override no longer collapses the row to a single column');
});

check('F5. both rows name the author, from the same field as the shelf', () => {
    // ⚠️ Jake, 2026-09-08: "If you look at what actually shows, there is
    // plenty of room for an author. There's one line of text - the title - and
    // then nothing makes up the vertical space provided by the covers."
    // ⚠️ THE SAME FIELD AS renderBooks() IS THE POINT. A book shown twice on
    // one screen attributed two different ways is worse than one not
    // attributed at all.
    for (const fn of ['renderContinue', 'renderFeatured']) {
        const body = liftFn(fn);
        assert.match(body, /book\.author \? `<div class="continue-author">\$\{escapeHtml\(book\.author\)\}<\/div>` : ''/,
            `${fn}() does not render the author line, or renders it from a ` +
            'different field or without escaping');
    }
    assert.match(cssBlock, /\.continue-author\s*\{/, '.continue-author has no rule');
    // One line, ellipsised: a wrapping surname makes one card taller than the
    // one beside it in the same grid row, which is the "slightly off"
    // complaint this whole row has been fighting since ROADMAP 26.
    const rule = cssBlock.match(/\.continue-author\s*\{([^}]*)\}/)[1];
    assert.match(rule, /white-space:\s*nowrap/, 'the author line may wrap and unbalance the row');
    assert.match(rule, /text-overflow:\s*ellipsis/, 'a long author name is cut without an ellipsis');
});

// ─────────────────────────────────────────────────────────────────────────
let failed = 0;
for (const [state, name] of results) {
    console.log(`  ${state === 'ok' ? 'ok  ' : 'FAIL'} ${name}`);
    if (state !== 'ok') failed++;
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
