// continue-reading-test.mjs v1.1.0 — ROADMAP 19. THE ROW MUST POINT AT A BOOK
// THAT EXISTS, IN THE ORDER THE STUDENT LAST TOUCHED IT.
//
// v1.1.0 — ⭐ ROADMAP 26 (index.html v3.15.0): the card is its own <a> now, not
//          a .book-card div wrapping a .book-card-link. Part C rewritten for
//          the new structure with the nested-interactive assertions KEPT — this
//          row has no ⓘ button today, and C1 is what catches the day one is
//          added. C3 and C4 are new: C3 that an empty bar string leaves no
//          element (never a 0% bar), C4 that the CALLER actually omits it,
//          because C3 alone passed a mutation that forced the bar on. Both
//          mutation-verified. Sections A, B and D are unchanged.
//
// The feature reads nothing new: every field comes off the progress documents
// index.html already fetches and caches. That makes ONE function load-bearing —
// progressTimeMs() — because `lastUpdated` arrives in a different shape
// depending on whether the page served a cold read or the eight-hour cache.
//
// ⚠️ THE CACHED SHAPE IS THE ONE THAT MATTERS. A cold read gives a Firestore
// Timestamp with .toDate(); the localStorage round-trip strips the methods and
// leaves { seconds, nanoseconds }. Handling only the Timestamp would rank every
// card 0 for almost the whole school day — the row would still render, in a
// stable but meaningless order. That is the kind of wrong nobody reports,
// because it looks like a feature that just does not seem very smart.

import { readFileSync } from 'fs';
import { chapterPositionOf, lastReadLabel } from '../chapter-position.js';
import { strict as assert } from 'node:assert';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.document = dom.window.document;

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

// ⚠️ LIFTED FROM THE SHIPPED FILE, NOT REIMPLEMENTED HERE. A copy in the test
// would pass forever while the page did something else.
const progressTimeMs = new Function(liftFn('progressTimeMs') + '; return progressTimeMs;')();

const results = [];
async function check(name, fn) {
    try { await fn(); results.push(['ok', name]); }
    catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
}

const WHEN = Date.UTC(2026, 7, 24, 14, 30, 0);

// ─── A. EVERY SHAPE `lastUpdated` CAN ARRIVE IN ──────────────────────────────

await check('A1. a cold-read Firestore Timestamp (has .toDate)', () => {
    const p = { lastUpdated: { toDate: () => new Date(WHEN) } };
    assert.equal(progressTimeMs(p), WHEN);
});

await check('A2. the CACHED shape after a localStorage round-trip', () => {
    // ⚠️ THE CASE THAT ACTUALLY RUNS ALL DAY. idxCacheWrite() JSON-stringifies
    // the map, which turns a Timestamp into a plain { seconds, nanoseconds }.
    const cold = { lastUpdated: { toDate: () => new Date(WHEN) } };
    const roundTripped = JSON.parse(JSON.stringify({
        lastUpdated: { seconds: Math.floor(WHEN / 1000), nanoseconds: 0 },
    }));
    assert.equal(typeof roundTripped.lastUpdated.toDate, 'undefined',
        'the round-trip must really have stripped the method, or this proves nothing');
    assert.equal(progressTimeMs(roundTripped), progressTimeMs(cold),
        'cached and cold must rank IDENTICALLY or the order changes at the ' +
        'eight-hour boundary for no reason a student could understand');
});

await check('A3. a legacy ISO string', () => {
    assert.equal(progressTimeMs({ lastUpdated: new Date(WHEN).toISOString() }), WHEN);
});

await check('A4. a raw epoch number and a real Date', () => {
    assert.equal(progressTimeMs({ lastUpdated: WHEN }), WHEN);
    assert.equal(progressTimeMs({ lastUpdated: new Date(WHEN) }), WHEN);
});

await check('A5. absent, null and junk all rank 0 and never throw', () => {
    // ⚠️ A THROW HERE TAKES THE WHOLE LIBRARY PAGE DOWN, not just the row —
    // renderContinue() runs from renderBooks(), which draws the shelf.
    for (const v of [undefined, null, {}, { lastUpdated: null }, { lastUpdated: {} },
                     { lastUpdated: 'not a date' }, { lastUpdated: NaN },
                     { lastUpdated: { toDate: () => { throw new Error('boom'); } } }]) {
        assert.equal(progressTimeMs(v), 0, 'shape: ' + JSON.stringify(v));
    }
});

// ─── B. THE SELECTION RULE ───────────────────────────────────────────────────
//
// Mirrors the pipeline in renderContinue(): filter to books that still exist,
// drop unstamped entries, sort by last touched, take three.

function pick(userProgress, allBooks, max = 3) {
    const byId = new Map(allBooks.map(b => [b.id, b]));
    return Object.keys(userProgress)
        .filter(id => byId.has(id))
        .map(id => ({ id, at: progressTimeMs(userProgress[id]) }))
        .filter(x => x.at > 0)
        .sort((a, b) => b.at - a.at)
        .slice(0, max)
        .map(x => x.id);
}

const DAY = 86400000;
const BOOKS = ['pinocchio', 'heidi', 'aesop', 'treasure'].map(id => ({ id }));

await check('B1. ranks on LAST TOUCHED, not on percent complete', () => {
    // ⚠️ THE DESIGN DECISION THIS FEATURE RESTS ON. An abandoned book at 80% is
    // not what a student wants resumed; the one opened this morning at 4% is.
    const prog = {
        aesop:     { lastUpdated: WHEN - 30 * DAY, chapter: 200, furthestChapter: 240 },
        pinocchio: { lastUpdated: WHEN,            chapter: 1,   furthestChapter: 1 },
    };
    assert.deepEqual(pick(prog, BOOKS), ['pinocchio', 'aesop']);
});

await check('B2. a book no longer in the library falls out silently', () => {
    // Progress documents outlive the books they point at — a title pulled for
    // re-cleaning, a bad EPUB deleted. A card whose link 404s is worse than none.
    const prog = {
        deleted:   { lastUpdated: WHEN },
        pinocchio: { lastUpdated: WHEN - DAY },
    };
    assert.deepEqual(pick(prog, BOOKS), ['pinocchio']);
});

await check('B3. an unstamped entry is never surfaced', () => {
    const prog = {
        heidi:     { chapter: 3 },              // no lastUpdated at all
        pinocchio: { lastUpdated: WHEN - DAY },
    };
    assert.deepEqual(pick(prog, BOOKS), ['pinocchio']);
});

await check('B4. capped at three, newest first', () => {
    const prog = {
        pinocchio: { lastUpdated: WHEN - 3 * DAY },
        heidi:     { lastUpdated: WHEN - 1 * DAY },
        aesop:     { lastUpdated: WHEN - 2 * DAY },
        treasure:  { lastUpdated: WHEN - 4 * DAY },
    };
    assert.deepEqual(pick(prog, BOOKS), ['heidi', 'aesop', 'pinocchio']);
});

await check('B5. no progress, no books, and a guest all yield nothing', () => {
    assert.deepEqual(pick({}, BOOKS), []);
    assert.deepEqual(pick({ pinocchio: { lastUpdated: WHEN } }, []), [],
        'before the shelf resolves there is nothing to point at');
});

// ─── C. THE MARKUP SURVIVES A REAL PARSER ────────────────────────────────────

const TPL_ANCHOR = '                return `\n                    <a class="continue-card" href="game.html?book=${encodeURIComponent(id)}">';

// Lifts the card template out of renderContinue() and renders it for real.
// ⚠️ v1.1.0 — THE CARD IS ITS OWN <a> NOW (index.html v3.15.0, ROADMAP 26). It
// used to be a .book-card div wrapping a .book-card-link anchor, because the
// shelf card has an ⓘ button and a credit link that may not sit inside an
// anchor. This row has neither, so the whole card is the link and a child
// aiming at a 60px target has no dead margin. The nested-interactive
// assertions below are KEPT AND TIGHTENED anyway — if anything clickable is
// ever added here, this is what catches it before a browser does.
function renderCard(id, book, coverHTML, barHTML, lastHTML) {
    const start = src.indexOf(TPL_ANCHOR);
    assert.ok(start > 0, 'could not locate the continue-card template in index.html');
    const end = src.indexOf('</a>`;', start);
    assert.ok(end > start, 'the continue-card template no longer ends where expected');
    const tpl = src.slice(start + '                return `'.length, end + '</a>'.length);
    const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
    const escA = s => String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const render = new Function('id', 'book', 'coverHTML', 'barHTML', 'lastHTML',
                                'escapeHtml', 'escapeAttr', 'return `' + tpl + '`;');
    return render(id, book, coverHTML, barHTML, lastHTML, esc, escA);
}

await check('C1. the card parses with the anchor intact and no nested interactives', () => {
    // ⚠️ SAME RULE THAT BROKE renderBooks() IN v3.5.0: an <a> may not contain
    // another <a> or a <button>, and browsers RECOVER by closing the outer
    // anchor early and reparenting everything after it — which is what put half
    // a credit line on the page background outside its card.
    const COVER = '<img class="continue-cover" src="c.jpg" alt="">';
    const BAR = '<div class="continue-bar-bg"><div class="continue-bar-fill" style="width:62%"></div></div>';
    const LAST = '<div class="continue-last">Last read yesterday</div>';

    const host = document.createElement('div');
    host.innerHTML = renderCard('pinocchio', {
        title: 'The Adventures of "Pinocchio"',
        author: 'Carlo Collodi',
        coverUrl: 'https://example.test/c.jpg',
    }, COVER, BAR, LAST);

    const card = host.querySelector('a.continue-card');
    assert.ok(card, 'the card must BE the anchor');
    assert.equal(card.querySelectorAll('a').length, 0, 'no nested anchor');
    assert.equal(card.querySelectorAll('button').length, 0, 'no button inside the anchor');
    assert.ok(card.querySelector('.continue-title'), 'the title must be inside the link');
    assert.ok(card.querySelector('.continue-resume'), 'the resume label must be inside the link');
    assert.ok(card.querySelector('.continue-bar-fill'), 'the progress bar must be inside the link');
    assert.ok(card.querySelector('.continue-last'), 'the last-read line must be inside the link');
    // ⚠️ NOTHING REPARENTED. If a browser had recovered from a nested anchor it
    // would have closed this one early and left siblings behind it.
    assert.equal(host.children.length, 1, 'nothing reparented out of the anchor');
    assert.ok(card.getAttribute('href').includes('book=pinocchio'));
});

await check('C2. a title with quotes and markup cannot escape its element', () => {
    const nasty = '<img src=x onerror=alert(1)>"';
    const host = document.createElement('div');
    // ⚠️ NO COVER IMAGE HERE, so any <img> the parser finds came out of the
    // TITLE — which is the whole point of the case.
    host.innerHTML = renderCard('b', { title: nasty, author: nasty, coverUrl: '' },
                                '<div class="continue-cover-placeholder"></div>', '', '');
    assert.equal(host.querySelectorAll('img').length, 0,
        'a book title must never become an element');
    assert.equal(host.querySelector('.continue-title').textContent, nasty);
});

await check('C3. an empty bar/last-read string leaves NO element behind', () => {
    // ⚠️ THIS CASE COVERS THE TEMPLATE ONLY — that given an empty string it
    // renders nothing at all, rather than an empty <div> that would paint a 0%
    // bar. It does NOT prove the caller ever passes an empty string; that is
    // C4's job, and the two were briefly conflated here. A mutation forcing
    // `barHTML` to a constant passes this case and fails C4, which is the
    // split working as intended.
    const host = document.createElement('div');
    host.innerHTML = renderCard('b', { title: 'Heidi', coverUrl: '' },
                                '<div class="continue-cover-placeholder"></div>', '', '');
    assert.equal(host.querySelectorAll('.continue-bar-bg').length, 0,
        'no bar element at all when the position is unknown');
    assert.equal(host.querySelectorAll('.continue-last').length, 0,
        'no last-read element at all when there is no stamp');
    assert.ok(host.querySelector('.continue-title'), 'the title still renders');
});

await check('C4. the CALLER omits the bar when the position is unknowable', () => {
    // ⚠️ A 0% BAR WOULD BE A LIE — a child halfway through a book must not be
    // shown an empty bar because a field was stripped from a cache. The
    // contract that prevents it is chapterPositionOf() returning null, and the
    // caller guarding on it. Both halves are checked here, against the LIVE
    // file: the function is lifted by walking its braces (same technique as
    // progress-test.mjs v1.1.0, and for the same reason — a substring anchor
    // drifts onto its neighbour), and the guard is checked as source.
    // ⚠️ IMPORTED, NOT SCRAPED (v1.2.0). chapter-position.js is a real module
    // now, so the contract is checked against the thing the page actually runs.
    const calc = chapterPositionOf;

    assert.equal(calc({ totalChapters: 20 }, null), null, 'no progress doc → null');
    assert.equal(calc({ totalChapters: 0 }, { chapter: 'chapter_3' }), null, 'no denominator → null');
    assert.equal(calc({}, { chapter: 'chapter_3' }), null, 'nothing to divide by → null');
    // And it still answers for the ordinary case, so the nulls above are a
    // contract rather than a function that never returns anything.
    assert.equal(calc({ totalChapters: 20 }, { chapter: 'chapter_5' }).pct, 25);

    // ⚠️ THE GUARD ITSELF. Without this the nulls above are unused and the
    // template gets `undefined`, which renders the string "undefined".
    assert.ok(/const barHTML = pos\s*\n?\s*\?/.test(src),
        'renderContinue must guard barHTML on pos being non-null');
});

await check('C5. lastReadLabel never prints a precision the stamp does not have', () => {
    // ⚠️ THE STAMP IS `lastUpdated`, WRITTEN WHEN PROGRESS IS SAVED — not when
    // the child stopped typing. Minutes would be a confident wrong answer, so
    // the label is coarse by design and the smallest unit is a day.
    const NOW = Date.parse('2026-08-26T15:00:00Z');
    const ago = d => NOW - d * 86400000;

    assert.equal(lastReadLabel(ago(0), NOW), 'Last read today');
    assert.equal(lastReadLabel(ago(1), NOW), 'Last read yesterday');
    assert.equal(lastReadLabel(ago(3), NOW), 'Last read 3 days ago');
    assert.equal(lastReadLabel(ago(9), NOW), 'Last read last week');
    assert.equal(lastReadLabel(ago(21), NOW), 'Last read 3 weeks ago');
    assert.equal(lastReadLabel(ago(400), NOW), 'Last read a while ago');
    assert.ok(!/minute|hour/i.test(lastReadLabel(ago(0), NOW)), 'never minutes or hours');

    // ⚠️ NO STAMP MEANS NO LINE, not "Last read NaN days ago". B3 already
    // refuses to surface an unstamped book at all, so this is the second line
    // of defence rather than the first.
    for (const junk of [0, null, undefined, NaN, 'yesterday']) {
        assert.equal(lastReadLabel(junk, NOW), '', `junk stamp ${String(junk)} yields no line`);
    }

    // A clock-skewed FUTURE stamp must not read as negative days. A Chromebook
    // with a wrong clock is not a hypothetical in a school.
    assert.equal(lastReadLabel(NOW + 86400000, NOW), 'Last read today');
});

// ─── D. THE ROW IS HIDDEN, NOT EMPTY, WHEN THERE IS NOTHING ──────────────────

await check('D1. index.html ships the row hidden by default', () => {
    // A heading over an empty box on every guest visit is a visible defect.
    assert.ok(/<section id="continue-row" class="continue-row" hidden>/.test(src),
        'the section must carry the hidden attribute in the served markup');
});

await check('D2. renderContinue is called from renderBooks, not hung off one caller', () => {
    // ⚠️ renderBooks() is invoked from eight places — cold load, warm cache,
    // stale cache, sign-in, sign-out, sort, filter, age-clear. Hanging the row
    // off any single one leaves the other seven showing a stale row, including
    // the sign-out path, where it would show one child's books to the next.
    const body = liftFn('renderBooks');
    assert.ok(/renderContinue\(\)/.test(body),
        'renderBooks() must call renderContinue()');
});

// ─── report ──────────────────────────────────────────────────────────────────
let failed = 0;
for (const [state, name] of results) {
    console.log(`  ${state === 'ok' ? 'ok  ' : 'FAIL'} ${name}`);
    if (state !== 'ok') failed++;
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
