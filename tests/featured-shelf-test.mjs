// featured-shelf-test.mjs v1.0.0 — ROADMAP 53. FEATURED IS "NEWEST," THEN
// "RANDOM, UNTYPED" WHEN NOTHING IS NEW.
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

check('D4. the random pick is CACHED, not re-rolled on every render', () => {
    assert.match(src, /_featuredRandomCache/,
        'the stable-random cache is gone \u2014 the row would reshuffle on every ' +
        'sort/filter click, which reads as broken');
    assert.match(renderFeaturedSrc, /if\s*\(\s*!_featuredRandomCache\s*\)/,
        'renderFeatured() no longer checks the cache before re-rolling');
});

check('D5. renderFeatured() is called from renderBooks(), same as renderContinue()', () => {
    const renderBooksSrc = liftFn('renderBooks');
    assert.match(renderBooksSrc, /renderContinue\(\)/, 'renderContinue() call is gone from renderBooks()');
    assert.match(renderBooksSrc, /renderFeatured\(\)/,
        'renderFeatured() is not called from renderBooks() \u2014 it would go stale ' +
        'on 7 of its 8 call sites');
});

check('D6. the badge text distinguishes "New" from "Featured"', () => {
    assert.match(renderFeaturedSrc, /isNew\s*\?\s*'New'\s*:\s*'Featured'/,
        'the two modes (newest vs. random fallback) no longer say which one a card is');
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

// ─────────────────────────────────────────────────────────────────────────
let failed = 0;
for (const [state, name] of results) {
    console.log(`  ${state === 'ok' ? 'ok  ' : 'FAIL'} ${name}`);
    if (state !== 'ok') failed++;
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
