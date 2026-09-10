// arcade-pool.js v1.0.0 — WHAT WORDS AN ARCADE RUN IS PLAYED WITH.
// Round 104 (Bar-Let).
//
// ⚠️⚠️ THIS FILE EXISTS BECAUSE TWO GOOD RULES COLLIDE, AND SOMETHING HAD TO
// DECIDE WHICH ONE WINS PER LEVEL.
//
//   Rule 1 — Jake, 2026-09-09: *"choosing a specific level in the lessons should
//   help decide what characters are available."* An arcade that puts letters a
//   student has never been taught in front of them is a different subject, not
//   practice.
//
//   Rule 2 — HANDOFF §7 item 2: wire `word-banks.js` in, because
//   `makeArcadeTargets()` letter groups are the reason the arcade reads as
//   nonsense. Every bank word appears in a book in the TTB library, and the
//   banks are chosen for LETTER BALANCE rather than frequency.
//
// ⚠️⚠️ THEY CANNOT BOTH HOLD AT UNIT 1. A student who has been taught `asdfjk`
// can type no English word at all, so "real words, restricted to your keys" is
// an EMPTY POOL — and an empty pool in Escape Key is a board of blank cells with
// nowhere to move, which is the worst outcome available.
//
// ⭐ SO THE RULE IS ONE SENTENCE: **real words when the level's keys can supply
// enough of them, letter groups when they cannot.** The game upgrades itself as
// a student advances, with no switch for anyone to forget to flip, and neither
// rule is ever violated — the letters always come from the level either way.
//
// ⚠️ AND THE FALLBACK IS NOT A FAILURE PATH. For a third of the school it is the
// correct answer and will be for months. It must never log a warning, degrade
// quietly, or look like something went wrong.
//
// ⚠️ PURE. No DOM, no canvas, no Date.now(), no Math.random() unless you hand it
// one. tests/arcade-pool-test.mjs drives it against every real key set the
// course produces.

import { BANKS, BANK_LENGTHS, MIN_LEN, MAX_LEN, ROUNDS_PER_TIER } from './word-banks.js';
import { makeArcadeTargets, ARCADE_GROUP_SIZE } from './game-shell.js';
import { firstBlocked } from './drill-filter.js';

export const ARCADE_POOL_VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THE TWO THRESHOLDS, AND WHY THEY ARE THE NUMBERS THEY ARE
// ═══════════════════════════════════════════════════════════════════════════
//
// **Distinct first characters is the one that actually matters**, and it is
// escape-board.js's rule, not a preference of this file. Escape Key offers four
// adjacent cells and every one of them must start with a different letter, or
// the student cannot choose a direction — `wordAvoiding()` gives up after 40
// draws and returns a duplicate, which makes the board unchoosable. Four is the
// hard floor; five gives `refreshNeighbours()` something to swap in when it has
// to replace one.
//
// ⚠️ A POOL CAN BE LARGE AND STILL FAIL THIS. Restricting the 5-letter bank to
// an early key set leaves words that nearly all start with the same two or three
// letters, because that is what those letters spell. Size and variety are
// different questions and both have to be asked.
export const MIN_DISTINCT_FIRSTS = 5;

// And enough words that a 30-cell board is not the same eight words repeated.
export const MIN_POOL = 24;

/**
 * Every bank word of length `len` that can be typed with `keySet` alone.
 *
 * @param {string[]} keySet  ⚠️ EMPTY OR NULL MEANS NO RESTRICTION, which is what
 *        a host with no lesson context (the lab) wants. It does NOT mean "no
 *        words" — a silent empty pool is the failure this file is written to
 *        avoid, and it must not be reachable by omitting an argument.
 */
export function wordsForKeys(keySet, len) {
    const bank = BANKS[len] || [];
    const keys = (keySet || []).filter(k => typeof k === 'string' && k.length === 1);
    const allowed = keys.length ? new Set(keys.map(k => k.toLowerCase())) : null;
    const out = [];
    for (const e of bank) {
        const w = e.w;
        if (allowed) {
            let ok = true;
            for (const ch of w) { if (!allowed.has(ch)) { ok = false; break; } }
            if (!ok) continue;
        }
        // ⚠️ SCREENED, EVEN THOUGH THE BANK IS ALREADY CURATED. The generator
        // dropped proper nouns and period vocabulary; it did not run
        // drill-filter.js. Round 103 learned this the expensive way one file
        // over — `reassuringly` is a fine library word whose PIECE `assuring`
        // trips `LEADING`, and every filter in this app had only ever seen the
        // whole word. A curated list is not a filtered list.
        if (firstBlocked(w)) continue;
        out.push(w);
    }
    return out;
}

/** How many distinct first characters a pool offers. escape-board.js's question. */
export function distinctFirsts(words) {
    const s = new Set();
    for (const w of words) if (w) s.add(w[0]);
    return s.size;
}

/**
 * The word length an arcade round should be played at.
 *
 * ⚠️ THE SAME TIER ARITHMETIC `bankForRound()` USES, AND IT IS CALLED RATHER
 * THAN COPIED — this file needs the LENGTH to walk downward from it, which the
 * bank accessor does not expose. ⚠️ IF `ROUNDS_PER_TIER` EVER CHANGES, this must
 * not be a second place that disagrees; it reads the constant.
 */
export function lengthForRound(round, minLen = MIN_LEN, maxLen = MAX_LEN) {
    const tier = Math.floor(Math.max(0, (round | 0) - 1) / ROUNDS_PER_TIER);
    return Math.min(maxLen, minLen + tier);
}

/**
 * Choose the pool for one arcade round.
 *
 * @param {object} o
 *   keySet {string[]}  the level's letters — arcadeKeySet(lessons, progress, levelIdx)
 *   round  {number}    escape-board.js's `round`, 1-based
 *   count  {number}    how many letter groups to make if we fall back
 *   rand   {function}  injected
 * @returns {{ targets: string[], source: 'words'|'letters', len: number|null }}
 *
 * ⭐ IT WALKS DOWN, NOT JUST ACROSS. If the round's own length cannot supply
 * enough words for this key set, SHORTER words are tried before giving up on
 * words entirely — a student whose keys spell plenty of 4-letter words should
 * not be thrown back to letter groups in round 7 merely because their keys spell
 * no 6-letter ones. ⚠️ THE ROUND STILL SETS THE CEILING: it never walks UP, or a
 * round would get harder words than the tier it is in.
 */
export function poolForLevel({ keySet, round = 1, count = 200, rand = Math.random }) {
    const want = lengthForRound(round);
    const lengths = BANK_LENGTHS.filter(n => n <= want).sort((a, b) => b - a);
    for (const len of lengths) {
        const words = wordsForKeys(keySet, len);
        if (words.length >= MIN_POOL && distinctFirsts(words) >= MIN_DISTINCT_FIRSTS) {
            return { targets: words, source: 'words', len };
        }
    }
    // ⚠️ NOT A FAILURE. See the header — for the early units this IS the answer,
    // and it must not be logged, flagged or styled as a degradation.
    return {
        targets: makeArcadeTargets(keySet, count, ARCADE_GROUP_SIZE, rand),
        source: 'letters',
        len: null,
    };
}

/**
 * A `poolFor(round)` function for EscapeBoard, closed over one key set.
 *
 * ⚠️⚠️ THE POOL MUST CHANGE AS ROUNDS ADVANCE OR `word-banks.js` IS DECORATIVE.
 * The whole point of eight banks is that the words lengthen while the student
 * plays; a pool chosen once at mount would pin every run to round 1's length and
 * seven of the eight banks would never be read by anything.
 *
 * ⚠️ MEMOISED PER ROUND, because escape-board.js calls `wordAvoiding()` on every
 * board refresh and re-filtering a 200-word bank on each of 30 cells is work
 * nobody asked for.
 */
export function poolProviderFor(keySet, rand = Math.random) {
    const cache = new Map();
    return function poolFor(round) {
        const key = lengthForRound(round);
        if (!cache.has(key)) cache.set(key, poolForLevel({ keySet, round, rand }));
        return cache.get(key).targets;
    };
}
