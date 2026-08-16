// sort-test.mjs v1.0.0 — the library sort keys, tested against the ACTUAL
// author strings in library/ rather than against names I invented.
//
// ⚠️ WHY THE CORPUS AND NOT MADE-UP NAMES. A surname heuristic tested on
// "John Smith" passes trivially and tells you nothing. The real list has
// "E. Nesbit", "H. G. Wells", "L. Frank Baum", "Kate Douglas Smith Wiggin" and
// "Charlotte Brontë" in it — initials, four-token names, and a diacritic that
// sorts after Z if anyone forgets to fold it. Those are the cases that break.
//
// BEHAVIOURAL throughout: the three key functions are extracted from index.html
// and run. The expected surnames below are asserted one by one, by name, so a
// failure says WHICH author regressed rather than "12 !== 13".

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');

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

const parts = ['sortKey', 'titleSortKey', 'authorSortKey', 'lengthOf'];
const srcs = parts.map(n => extractFn(html, n));
ok(srcs.every(Boolean), 'index.html defines all four sort-key functions');

const F = srcs.every(Boolean)
    ? new Function(`${srcs.join('\n')}; return { sortKey, titleSortKey, authorSortKey, lengthOf };`)()
    : { sortKey: x => x, titleSortKey: x => x, authorSortKey: x => x, lengthOf: () => 0 };

// ── Titles: leading articles are noise ───────────────────────────────────────
const titleCases = [
    ['The Wind in the Willows',  'wind in the willows'],
    ['A Little Princess',        'little princess'],
    ['An Old-Fashioned Girl',    'old-fashioned girl'],
    ['The Count of Monte Cristo','count of monte cristo'],
    ['Alice\u2019s Adventures in Wonderland', 'alice\u2019s adventures in wonderland'],
    ['Little Women',             'little women'],
    ['Dracula',                  'dracula'],
];
for (const [input, want] of titleCases) {
    ok(F.titleSortKey(input) === want,
       `title "${input}" \u2192 "${want}" (got "${F.titleSortKey(input)}")`);
}

// ⚠️ Articles are stripped only at the START, and only as whole words.
ok(F.titleSortKey('Theodore Roosevelt') === 'theodore roosevelt',
   '"Theodore" is not the article "The" — prefix matching would eat it');
ok(F.titleSortKey('Anne of Green Gables') === 'anne of green gables',
   '"Anne" is not the article "An"');
ok(F.titleSortKey('A Tale of Two Cities').startsWith('tale'),
   'a one-letter article is still stripped');

// ── Authors: every surname in the real library, by name ──────────────────────
const corpus = [
    ['Alexandre Dumas',            'dumas'],
    ['Bram Stoker',                'stoker'],
    ['Carlo Collodi',              'collodi'],
    ['Charlotte Bront\u00eb',      'bronte'],   // ⚠️ diacritic folded, or she files after Zola
    ['E. Nesbit',                  'nesbit'],
    ['Frances Hodgson Burnett',    'burnett'],
    ['H. G. Wells',                'wells'],
    ['Henry James',                'james'],
    ['Jane Austen',                'austen'],
    ['Jean Webster',               'webster'],
    ['Johanna Spyri',              'spyri'],
    ['Kate Douglas Smith Wiggin',  'wiggin'],
    ['Kenneth Grahame',            'grahame'],
    ['L. Frank Baum',              'baum'],
    ['Laura Lee Hope',             'hope'],
    ['Lewis Carroll',              'carroll'],
    ['Louisa May Alcott',          'alcott'],
    ['Mark Twain',                 'twain'],
    ['Mary Roberts Rinehart',      'rinehart'],
    ['Mary Shelley',               'shelley'],
    ['Claude',                     'claude'],   // single-token author
];
for (const [input, want] of corpus) {
    ok(F.authorSortKey(input) === want,
       `author "${input}" \u2192 "${want}" (got "${F.authorSortKey(input)}")`);
}

// ── Authors: forms not in the library yet but that Gutenberg emits ───────────
ok(F.authorSortKey('Wiggin, Kate Douglas') === 'wiggin',
   'an already-filed "Last, First" is not re-parsed');
ok(F.authorSortKey('Oliver Wendell Holmes Jr.') === 'holmes',
   'a generational suffix does not become the surname');
ok(F.authorSortKey('Ludwig van Beethoven') === 'van beethoven',
   'a nobiliary particle stays with the surname');
ok(F.authorSortKey('Aesop') === 'aesop', 'a single-name author is his own surname');

// ⚠️ Unattributed must sort LAST, not first. An empty key would put every
// untagged book at the top of the shelf, which is the opposite of useful.
ok(F.authorSortKey('') > F.authorSortKey('Zola'), 'an unattributed book sorts last');
ok(F.authorSortKey(null) > F.authorSortKey('Zola'), 'null author sorts last too');

// ── The whole corpus actually orders sensibly ────────────────────────────────
//
// ⚠️ I WROTE THIS BLOCK TWICE BY HAND AND GOT THE TAIL WRONG BOTH TIMES —
// first "Webster last", then "Wells second-to-last". Both were me reading down
// my own alphabetised source list and eyeballing, when the actual keys are
// webster < wells < wiggin. Three guesses at a fact I could compute.
//
// So it is computed. The expected order is the corpus sorted by its DECLARED
// surnames, and those are asserted one at a time above — so this compares the
// function's ordering against independently verified data rather than against
// my impression of the alphabet.
const expectedOrder = corpus.slice()
    .sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]))
    .map(c => c[0]);
const actualOrder = corpus.map(c => c[0])
    .sort((a, b) => F.authorSortKey(a).localeCompare(F.authorSortKey(b))
                 || a.localeCompare(b));

ok(actualOrder.join('|') === expectedOrder.join('|'),
   'the whole corpus orders by surname exactly as the declared surnames do');
if (actualOrder.join('|') !== expectedOrder.join('|')) {
    for (let i = 0; i < expectedOrder.length; i++) {
        if (actualOrder[i] !== expectedOrder[i]) {
            failures.push(`  position ${i}: expected ${expectedOrder[i]}, got ${actualOrder[i]}`);
        }
    }
}

// One ordering worth stating outright rather than leaving to the bulk compare,
// because it is the failure a missing diacritic fold produces.
ok(actualOrder.indexOf('Charlotte Bront\u00eb') < actualOrder.indexOf('Lewis Carroll'),
   'Bront\u00eb precedes Carroll — the diacritic did not exile her to the end');

// ── lengthOf: bodyChapters wins, totalChapters is the fallback ───────────────
ok(F.lengthOf({ bodyChapters: 61, totalChapters: 67 }) === 61,
   'body chapters beat total chapters — front matter is not length');
ok(F.lengthOf({ bodyChapters: null, totalChapters: 67 }) === 67,
   'an old document with no bodyChapters falls back rather than reporting zero');
ok(F.lengthOf({ bodyChapters: 0, totalChapters: 67 }) === 67,
   'zero body chapters is treated as absent, not as a zero-length book');
ok(F.lengthOf({}) === 0, 'a book with no chapter counts at all does not throw');

// ── STRUCTURAL: the frozen load-time sort is gone ────────────────────────────
ok(!/allBooks\.sort\(\(a, b\) => a\.title\.localeCompare\(b\.title\)\)/.test(html),
   'loadBooks() no longer freezes one order before the control can change it');
ok(/sortBooks\(byGenre\.filter/.test(html), 'renderBooks() owns the ordering');

if (fail) {
    console.log(`\nsort-test: ${pass} passed, ${fail} FAILED`);
    failures.forEach(f => console.log('   \u2717 ' + f));
    process.exit(1);
}
console.log(`sort-test: all ${pass} assertions pass`);
