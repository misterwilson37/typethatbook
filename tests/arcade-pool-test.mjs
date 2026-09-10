// tests/arcade-pool-test.mjs v1.0.0 — DOES EVERY LEVEL GET A PLAYABLE BOARD?
// Round 104 (Bar-Let).
//
// ⚠️⚠️ THIS FILE EXISTS BECAUSE THE TWO RULES BEHIND arcade-pool.js CANNOT BOTH
// HOLD AT UNIT 1, AND THE PLACE THEY BREAK IS NOT GUESSABLE. "Real words,
// restricted to the letters this level has taught" is an EMPTY POOL for a
// student who knows `asdfjk` — and an empty pool in Escape Key is a board of
// blank cells with nowhere to move. Where exactly real words become possible is
// a fact about English and about this library's vocabulary, not a design
// decision, so it has to be measured rather than chosen.
//
// ⚠️ PART C IS THE ONE THAT MATTERS. It walks the key set forward one lesson at
// a time and asserts that EVERY level in the course produces a board Escape Key
// can actually deal a legal row of neighbours from. A gap in the middle is a
// silent dead arcade for whichever class is standing on it that week.

import {
    poolForLevel, poolProviderFor, wordsForKeys, distinctFirsts, lengthForRound,
    MIN_POOL, MIN_DISTINCT_FIRSTS, ARCADE_POOL_VERSION,
} from '../arcade-pool.js';
import { EscapeBoard, COLS, ROWS } from '../escape-board.js';
import { BANKS, BANK_LENGTHS, MIN_LEN, MAX_LEN } from '../word-banks.js';
import { firstBlocked } from '../drill-filter.js';

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) {
    if (cond) pass++; else { fail++; fails.push(label); }
    console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${label}`);
}
function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// ⚠️ THE REAL COURSE ORDER, NOT AN INVENTED ONE. These are the key sets TTB's
// lessons actually unlock, in order, which is what makes Part C a statement
// about this school rather than about a hypothetical curriculum.
const UNLOCKS = [
    'asdfjkl;', 'ei', 'ru', 'ghtynm', 'cv', 'ow', 'pq', 'bxz', ".,'?",
];

function keysAfter(n) {
    const s = new Set();
    for (let i = 0; i <= n && i < UNLOCKS.length; i++) for (const c of UNLOCKS[i]) s.add(c);
    return Array.from(s);
}

console.log(`\narcade-pool.js v${ARCADE_POOL_VERSION}\n`);

// ═════════════════════════════════════════════════════════════════════════════
console.log('PART A — the filter is honest about what a key set can type');
// ═════════════════════════════════════════════════════════════════════════════

{
    const home = 'asdfjkl;'.split('');
    for (const len of BANK_LENGTHS) {
        const words = wordsForKeys(home, len);
        const bad = words.find(w => [...w].some(ch => !home.includes(ch)));
        if (bad) { ok(false, `home row: ${bad} contains an untaught letter`); break; }
    }
    ok(true, 'no word survives the filter that the key set cannot type');

    // ⚠️ THE HOME ROW SPELLS ALMOST NOTHING, AND THAT IS THE WHOLE PROBLEM.
    const homeWords = BANK_LENGTHS.reduce((n, l) => n + wordsForKeys(home, l).length, 0);
    ok(homeWords < MIN_POOL,
       `the home row spells ${homeWords} bank words in total — real words are impossible there`);

    // ⚠️ NO KEY SET MEANS NO RESTRICTION, NOT NO WORDS. A silent empty pool
    // reachable by omitting an argument is the failure this module exists for.
    ok(wordsForKeys(null, 4).length > 100, 'a null key set is unrestricted, not empty');
    ok(wordsForKeys([], 4).length > 100, 'and so is an empty one');

    // ⚠️ SCREENED, EVEN THOUGH THE BANK IS CURATED. Round 103's lesson: a
    // curated list is not a filtered list.
    let blocked = '';
    for (const len of BANK_LENGTHS) {
        for (const w of wordsForKeys(null, len)) if (firstBlocked(w)) { blocked = w; break; }
        if (blocked) break;
    }
    ok(blocked === '', `no word in any bank survives that drill-filter.js blocks${blocked ? ' — ' + blocked : ''}`);
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART B — the round decides the length, and the ceiling is never exceeded');
// ═════════════════════════════════════════════════════════════════════════════

{
    ok(lengthForRound(1) === MIN_LEN, `round 1 plays at ${MIN_LEN} letters`);
    ok(lengthForRound(999) === MAX_LEN, `and it tops out at ${MAX_LEN}, never beyond the banks`);
    let monotone = true, prev = 0;
    for (let r = 1; r <= 40; r++) { const l = lengthForRound(r); if (l < prev) monotone = false; prev = l; }
    ok(monotone, 'length never goes backwards as rounds advance');

    // ⭐ IT WALKS DOWN, NOT UP. A key set that spells plenty of 4-letter words
    // must not be thrown back to letter groups in round 7 just because it spells
    // no 6-letter ones.
    const mid = keysAfter(3);
    const late = poolForLevel({ keySet: mid, round: 12, rand: mulberry(1) });
    ok(late.len == null || late.len <= lengthForRound(12),
       'the round is a CEILING on word length, never a floor');

    // ⚠️ AND THE POOL IT RETURNS ALWAYS MEETS BOTH THRESHOLDS, or it is letters.
    let broke = '';
    for (let n = 0; n < UNLOCKS.length; n++) {
        for (let r of [1, 4, 8, 15, 30]) {
            const p = poolForLevel({ keySet: keysAfter(n), round: r, rand: mulberry(n * 10 + r) });
            if (p.source !== 'words') continue;
            if (p.targets.length < MIN_POOL || distinctFirsts(p.targets) < MIN_DISTINCT_FIRSTS) {
                broke = `unlock ${n} round ${r}`;
            }
        }
    }
    ok(broke === '', `a 'words' pool always clears both thresholds${broke ? ' — ' + broke : ''}`);
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART C — ⚠️⚠️ EVERY LEVEL IN THE COURSE GETS A BOARD IT CAN DEAL');
// ═════════════════════════════════════════════════════════════════════════════
//
// The claim this module was written to make. ⚠️ A GAP HERE IS A SILENT DEAD
// ARCADE for whichever class is standing on that lesson that week — nothing
// throws, nothing logs, the board is just blank.

{
    let dealt = 0, empty = '';
    const report = [];
    for (let n = 0; n < UNLOCKS.length; n++) {
        const keys = keysAfter(n);
        const p = poolForLevel({ keySet: keys, round: 1, rand: mulberry(n + 1) });
        report.push(`unlock ${n} (${keys.length} keys) → ${p.source}${p.len ? ' len ' + p.len : ''}, ${p.targets.length} targets`);
        if (!p.targets.length) { empty = `unlock ${n}`; continue; }
        // Deal a real board and check the four neighbours are choosable.
        const b = new EscapeBoard({ pool: p.targets, rand: mulberry(n + 50) });
        const firsts = b.adjacent(b.player.x, b.player.y)
            .map(c => b.grid[c.y][c.x]).filter(Boolean).map(w => w[0]);
        if (firsts.length && new Set(firsts).size === firsts.length) dealt++;
    }
    report.forEach(l => console.log('        ' + l));
    ok(empty === '', `no level produces an empty pool${empty ? ' — ' + empty : ''}`);
    ok(dealt === UNLOCKS.length,
       `all ${UNLOCKS.length} levels deal four adjacent cells with distinct first letters`);

    // ⭐ AND THE UPGRADE ACTUALLY HAPPENS. If every level came back 'letters',
    // word-banks.js would still be unread and this whole round would be a no-op
    // that passed its own tests.
    const sources = [];
    for (let n = 0; n < UNLOCKS.length; n++) {
        sources.push(poolForLevel({ keySet: keysAfter(n), round: 6, rand: mulberry(n) }).source);
    }
    ok(sources.includes('letters'), 'early levels fall back to letter groups, as they must');
    ok(sources.includes('words'),
       `later levels play real library words — ${sources.filter(s => s === 'words').length} of ${sources.length} do`);
    ok(sources.lastIndexOf('letters') < sources.indexOf('words'),
       '⚠️ AND IT NEVER GOES BACKWARDS — no level regresses to letters after words became possible');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART D — the provider, and the seven banks that would otherwise go unread');
// ═════════════════════════════════════════════════════════════════════════════

{
    const keys = keysAfter(8);   // the whole course
    const provide = poolProviderFor(keys, mulberry(7));
    const seen = new Set();
    for (let r = 1; r <= 30; r++) {
        const words = provide(r);
        if (words.length) seen.add(words[0].length);
    }
    ok(seen.size >= 4,
       `a 30-round run reads ${seen.size} different banks — a fixed pool would read one`);

    // ⚠️ MEMOISED PER LENGTH, not per round: escape-board.js calls wordAvoiding()
    // for all 30 cells on every refresh.
    const p1 = provide(1), p2 = provide(2);
    ok(p1 === p2, 'two rounds in the same tier share one pool object, not two filter passes');

    // ⚠️ escape-board.js WARNS ON A ONE-LETTER POOL, WHICH IS EXACTLY WHAT THE
    // THREE FALLBACK CASES BELOW HAND IT ON PURPOSE. Silenced so the suite's
    // output stays readable — ⚠️ AND RESTORED IMMEDIATELY, because a harness
    // that leaves console.warn stubbed hides the next file's real warnings.
    const realWarn = console.warn;
    console.warn = () => {};

    // ⚠️⚠️ AND THE BOARD ACTUALLY USES IT. A provider the board ignores is the
    // exact shape of Escape Key's twenty-round dead tick: the wiring existed at
    // one end and nothing consumed it at the other.
    const b = new EscapeBoard({ pool: ['zzzz'], poolFor: provide, rand: mulberry(9) });
    const onBoard = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (b.grid[y][x]) onBoard.push(b.grid[y][x]);
    ok(onBoard.length > 0 && !onBoard.every(w => w === 'zzzz'),
       'a board given a provider deals the PROVIDER\'s words, not the constructor\'s pool');

    // ⚠️ AND A BOARD GIVEN NOTHING IS UNCHANGED. escape-board-test.mjs's 39
    // assertions all run this path.
    const plain = new EscapeBoard({ pool: ['zzzz'], rand: mulberry(9) });
    let allStatic = true;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        if (plain.grid[y][x] && plain.grid[y][x] !== 'zzzz') allStatic = false;
    }
    ok(allStatic, 'and a board with no provider deals only the static pool, byte for byte');

    // ⚠️ A PROVIDER THAT RETURNS NOTHING FALLS BACK RATHER THAN BLANKING. A
    // provider is host code; a blank board is the worst thing this can produce.
    const broken = new EscapeBoard({ pool: ['asdf'], poolFor: () => [], rand: mulberry(11) });
    ok(broken.grid.some(row => row.some(Boolean)),
       'an empty provider result falls back to the static pool instead of a blank board');
    console.warn = realWarn;
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} failed`);
if (fail) { fails.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
