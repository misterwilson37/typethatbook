// continue-reading-test.mjs — ROADMAP 19. THE ROW MUST POINT AT A BOOK THAT
// EXISTS, IN THE ORDER THE STUDENT LAST TOUCHED IT.
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

await check('C1. the card parses with the anchor intact and no nested interactives', () => {
    // ⚠️ SAME RULE THAT BROKE renderBooks() IN v3.5.0: an <a> may not contain
    // another <a> or a <button>, and browsers RECOVER by closing the outer
    // anchor early and reparenting everything after it — which is what put half
    // a credit line on the page background outside its card.
    const start = src.indexOf('                return `\n                    <div class="book-card">\n                        <a class="book-card-link" href="game.html?book=${encodeURIComponent(id)}">');
    assert.ok(start > 0, 'could not locate the continue-card template in index.html');
    const end = src.indexOf('</div>`;', start);
    const tpl = src.slice(start + '                return `'.length, end + '</div>'.length);

    const render = new Function('id', 'book', 'coverHTML', 'escapeHtml', 'escapeAttr',
                                'return `' + tpl + '`;');
    const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
    const escA = s => String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    // coverHTML is built just above the template in renderContinue(); the cover
    // itself is not what this case is about, so a stand-in stands in.
    const COVER = '<img class="book-cover" src="c.jpg" alt="cover">';

    const html = render('pinocchio', {
        title: 'The Adventures of "Pinocchio"',
        author: "Carlo Collodi",
        coverUrl: 'https://example.test/c.jpg',
    }, COVER, esc, escA);

    const host = document.createElement('div');
    host.innerHTML = html;

    const card = host.querySelector('.book-card');
    assert.ok(card, 'a card element must exist');
    const link = card.querySelector('a.book-card-link');
    assert.ok(link, 'the anchor must survive parsing');
    assert.equal(link.querySelectorAll('a').length, 0, 'no nested anchor');
    assert.equal(link.querySelectorAll('button').length, 0, 'no button inside the anchor');
    assert.ok(link.querySelector('.book-title'), 'the title must be INSIDE the link');
    assert.ok(link.querySelector('.continue-resume'), 'the resume line must be inside the link');
    assert.equal(card.children.length, 1, 'nothing reparented out of the anchor');
    assert.ok(link.getAttribute('href').includes('book=pinocchio'));
});

await check('C2. a title with quotes and markup cannot escape its element', () => {
    const start = src.indexOf('                return `\n                    <div class="book-card">\n                        <a class="book-card-link" href="game.html?book=${encodeURIComponent(id)}">');
    const end = src.indexOf('</div>`;', start);
    const tpl = src.slice(start + '                return `'.length, end + '</div>'.length);
    const render = new Function('id', 'book', 'coverHTML', 'escapeHtml', 'escapeAttr',
                                'return `' + tpl + '`;');
    const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
    const escA = s => String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const nasty = '<img src=x onerror=alert(1)>"';
    const host = document.createElement('div');
    // ⚠️ NO COVER IMAGE HERE, so any <img> the parser finds came out of the
    // TITLE — which is the whole point of the case.
    host.innerHTML = render('b', { title: nasty, author: nasty, coverUrl: '' },
                            '<div class="book-cover-placeholder"></div>', esc, escA);
    assert.equal(host.querySelectorAll('img').length, 0,
        'a book title must never become an element');
    assert.equal(host.querySelector('.book-title').textContent, nasty);
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
