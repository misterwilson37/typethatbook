// search-test.mjs v1.0.0 — ROADMAP 53: A SEARCH BOX ON THE STACKS, FOR THE
// CHILD WHO ALREADY KNOWS WHAT THEY WANT.
//
// ⚠️ WHY THIS IS A SEPARATE FILE FROM sort-test.mjs. That file proves the SORT
// KEYS are correct; this proves the SEARCH PREDICATE is correct and that it
// actually composes with the rest of renderBooks()'s filter chain (genre, age,
// protagonist) rather than living beside it unconnected. Different question,
// different harness, same file (index.html) — matching this project's own
// one-harness-per-question convention (mirror-heal-test.mjs vs logdays-test.mjs
// is the same split for a different pair of files).
//
// BEHAVIOURAL for matchesSearch() itself — lifted and run, not grepped.
// STRUCTURAL for the render-chain wiring, the markup, and the CSS class
// separation from .filter-select, none of which a pure function can prove.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function extractFn(s, name) {
    const start = s.indexOf(`function ${name}(`);
    if (start < 0) return null;
    let depth = 0;
    for (let j = s.indexOf('{', start); j < s.length; j++) {
        if (s[j] === '{') depth++;
        else if (s[j] === '}') { depth--; if (depth === 0) return s.slice(start, j + 1); }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// A — matchesSearch(): BEHAVIOURAL, LIFTED AND RUN
// ═══════════════════════════════════════════════════════════════════════════

const matchesSearchSrc = extractFn(html, 'matchesSearch');
ok(!!matchesSearchSrc, 'index.html defines matchesSearch()');

const run = (query, book) => new Function('searchQuery', matchesSearchSrc +
    '; return matchesSearch(' + JSON.stringify(book) + ');')(query);

ok(run('', { title: 'Dracula', author: 'Bram Stoker' }) === true,
   'an empty query matches every book (no filter applied)');
ok(run('drac', { title: 'Dracula', author: 'Bram Stoker' }) === true,
   'a substring of the title matches');
ok(run('stoker', { title: 'Dracula', author: 'Bram Stoker' }) === true,
   'a substring of the author matches');
ok(run('DRAC', { title: 'Dracula', author: 'Bram Stoker' }) === false,
   'the predicate itself does not lowercase the query — renderBooks() must do ' +
   'that once at input time, not here on every book on every keystroke');
ok(run('drac', { title: 'dracula', author: 'bram stoker' }) === true,
   'a lowercase book title still matches — book.title.toLowerCase() runs here');
ok(run('zzz', { title: 'Dracula', author: 'Bram Stoker' }) === false,
   'a query matching neither field excludes the book');
ok(run('wind', { title: 'The Wind in the Willows', author: 'Kenneth Grahame' }) === true,
   '⚠️ NOT run through titleSortKey() — a plain substring search must find a ' +
   'word anywhere in the title, not only after a stripped leading article');
ok(run('grahame', { title: 'The Wind in the Willows', author: 'Kenneth Grahame' }) === true,
   '⚠️ NOT run through authorSortKey() — searching the full name must work, ' +
   'not only the folded surname key sortBooks() uses for ordering');
ok(!run('anything', { title: 'No Author Book', author: null }),
   'a null author does not throw — it just fails to match on that field');
ok(!run('anything', { title: null, author: 'Someone' }),
   'a null title does not throw either');

// ═══════════════════════════════════════════════════════════════════════════
// B — THE RENDER CHAIN: search COMPOSES WITH genre/age/protagonist
// ═══════════════════════════════════════════════════════════════════════════

ok(/byGenre\.filter\(b => matchesSearch\(b\) && matchesAge\(b\) && matchesProt\(b\)\)/.test(html),
   'renderBooks() ANDs matchesSearch() into the SAME filter pass as age and ' +
   'protagonist, rather than filtering the results of that pass separately ' +
   '(which would still work, but would compute the intermediate array twice)');

// ⚠️ THE "N HIDDEN — NO AGE RANGE SET" NOTE MUST ALSO RESPECT AN ACTIVE SEARCH.
// Without this, typing a narrowing search while the age filter is on would
// report a hidden-book count computed against books the search has already
// excluded from view, which reads as the note disagreeing with the shelf.
ok(/matchesSearch\(b\) && matchesProt\(b\)\)\.length/.test(html),
   'the age-hidden-count note also filters by matchesSearch(), not just genre and protagonist');

// ═══════════════════════════════════════════════════════════════════════════
// C — MARKUP AND STYLING
// ═══════════════════════════════════════════════════════════════════════════

ok(/<input type="search" id="book-search" class="filter-search"/.test(html),
   'the search input exists with the expected id and class');
ok(/aria-label="Search the library by title or author"/.test(html),
   'the search input is labelled for a screen reader, not just visually via the adjacent span');

// ⚠️ NOT .filter-select. That class sets `cursor: pointer`, correct for a
// <select> the student only ever clicks, and visibly wrong for a text box
// they are meant to click into and type in — a small mismatch, but exactly
// the kind Jake's "slightly off" complaints have been about before.
ok(!/class="filter-search[^"]*"[^>]*>/.test(html) ||
   !html.match(/class="filter-search[^"]*"/g).some(c => c.includes('filter-select')),
   'the search input does not carry .filter-select');
ok(/\.filter-search\s*\{[^}]*cursor:\s*text/.test(html),
   'the search box has its own cursor: text rule, not the select-select cursor: pointer');
ok(/\.filter-search\.is-set\s*\{/.test(html),
   'the search box has an .is-set state, matching every other active filter control on this page');

// ═══════════════════════════════════════════════════════════════════════════
// D — THE INPUT LISTENER: LOWERCASES ONCE, TOGGLES is-set, RE-RENDERS
// ═══════════════════════════════════════════════════════════════════════════

const listenerAt = html.indexOf("getElementById('book-search').addEventListener");
ok(listenerAt > -1, "the search input has a wired 'input' listener");
const listenerBlock = listenerAt > -1 ? html.slice(listenerAt, listenerAt + 400) : '';
ok(/searchQuery\s*=\s*e\.target\.value\.trim\(\)\.toLowerCase\(\)/.test(listenerBlock),
   'the query is trimmed and lowercased ONCE, at input time — not on every book, every keystroke');
ok(/classList\.toggle\('is-set', searchQuery !== ''\)/.test(listenerBlock),
   'the is-set class follows whether a query is active, matching sort-select\'s own toggle pattern');
ok(/renderBooks\(\)/.test(listenerBlock), 'the listener re-renders the shelf after updating the query');

// ⚠️ NO DEBOUNCE. The library is already fully in memory for every OTHER
// filter on this page — a debounce here would be latency protecting against
// a cost that does not exist, which is a claim worth pinning so a future
// "performance" pass doesn't add one on a guess.
ok(!/setTimeout[^;]*searchQuery/.test(html) && !/debounce/i.test(listenerBlock),
   'no debounce/setTimeout around the search handler — filtering is synchronous and free');

console.log(fail
    ? `\nsearch-test: ${pass} passed, ${fail} FAILED`
    : `search-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
