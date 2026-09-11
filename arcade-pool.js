// arcade-pool.js v2.2.0 — Round 116 (Sun): Shards gets the SAME words as
// Shatter. It was missing from arcadePool()'s id branch and was being dealt the
// plain word banks.
// arcade-pool.js v2.1.0 — Round 116 (Sun): ⭐ THE WORDS STOP ARRIVING IN
// ALPHABETICAL ORDER. Jake, playing the build: *"the words are coming through
// alphabetically...which is kind of lame."* Shuffled within the difficulty
// band for Shatter and outright for the word banks — see the block above
// gradedOrder() for why the fix is here and not in GameDirector. ⚠️ The header
// below is v1.0.0's and the ruling in it still stands.
// arcade-pool.js v1.0.0 — WHAT WORDS AN ARCADE RUN IS PLAYED WITH.
// Round 104 (Bar-Let).
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THE STUDENT CHOOSES THE SCOPE. THIS FILE DOES NOT CHOOSE IT FOR THEM.
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-09, and this is the correction that produced v2.0.0:
//
//   *"students should have the option of opening it up to everything because
//   roughly 30% of my students know how to type and have not done a single
//   lesson. They should be able to open up available lessons OR go straight to
//   the word pools. That's why we made the word pools (and put some real work
//   into them, for the record)."*
//
// ⚠️⚠️ v1.0.0 GOT THIS BACKWARDS AND IT WAS THE WHOLE POINT OF THE FILE. It
// widened the pool automatically as a student's lessons unlocked letters, and
// offered **no way out** — so a twelve-year-old who already types 60 WPM but has
// completed zero lessons was locked to `asdfjk` letter groups by a rule they
// could not see or override. ⭐ **THAT IS ABOUT A THIRD OF THE SCHOOL**, and
// they are exactly the students the word banks were built for.
//
// ⚠️ THE AUTOMATIC WIDENING WAS NEVER THE PROBLEM AND IS KEPT. Words open when
// they open; that depends on the level of the kid, and `scope: 'level'` still
// does it. What was missing is `scope: 'full'`.
//
//   scope 'level' — only letters this level has taught. Real words once those
//                   letters can spell enough of them; letter groups until then.
//                   ⚠️ THE LETTER-GROUP CASE IS NOT A FAILURE PATH — for the
//                   early units it is the correct answer, and it must never
//                   warn, degrade quietly or be styled as a problem.
//   scope 'full'  — the whole pool, every letter, regardless of progress.
//                   ⚠️ NOT GATED ON ANYTHING. A student who cannot handle it
//                   loses quickly, which is what a "how far can you get" game
//                   is for. Jake: *"They either can do it or they can't. Again —
//                   it's a game."*
//
// ⚠️ NEITHER SCOPE IS THE "REAL" ONE. A UI that presents `full` as unlocking
// something, or `level` as training wheels, has re-created the hole this version
// exists to close.
//
// ⚠️ PURE. No DOM, no canvas, no Date.now(), no Math.random() unless you hand it
// one. tests/arcade-pool-test.mjs drives it against every real key set the
// course produces.

import { BANKS, BANK_LENGTHS, MIN_LEN, MAX_LEN, ROUNDS_PER_TIER } from './word-banks.js';
import { SHATTER_WORDS } from './shatter-words.js';
import { splitTarget, splittable } from './shatter-board.js';
import { makeArcadeTargets, ARCADE_GROUP_SIZE } from './game-shell.js';
import { firstBlocked } from './drill-filter.js';

export const ARCADE_POOL_VERSION = '2.2.0';

/** The two scopes a student may choose between. ⚠️ NEITHER IS THE DEFAULT-CORRECT
 *  ONE; the picker asks and the answer is theirs. */
export const SCOPES = ['level', 'full'];

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
export function poolForLevel({ keySet, round = 1, count = 200, scope = 'level',
                               rand = Math.random }) {
    // ⚠️ `full` IGNORES THE KEY SET ENTIRELY — that is what the student asked
    // for. It does NOT ignore the round: word length still climbs as the run
    // goes on, because that is the game's difficulty curve and not a restriction
    // on who may play.
    if (scope === 'full') keySet = null;
    const want = lengthForRound(round);
    const lengths = BANK_LENGTHS.filter(n => n <= want).sort((a, b) => b - a);
    for (const len of lengths) {
        const words = wordsForKeys(keySet, len);
        if (words.length >= MIN_POOL && distinctFirsts(words) >= MIN_DISTINCT_FIRSTS) {
            // ⚠️ SHUFFLED ON THE WAY OUT, NOT INSIDE wordsForKeys(). That
            // function is exported and is used to ASK QUESTIONS about a key set
            // ("how many words can these letters spell?"); an answer that came
            // back in a different order every call would be a worse tool and
            // would make three harnesses non-deterministic.
            // ⚠️ EVERY WORD IN A BANK IS THE SAME LENGTH, so unlike Shatter's
            // pool there is no band here to preserve — a plain shuffle is the
            // whole fix. ⭐ AND poolProviderFor() MEMOISES PER ROUND, so Escape
            // Key sees one stable order for the round rather than a reshuffle
            // on every cell refresh.
            return { targets: shuffled(words, rand), source: 'words', len };
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
export function poolProviderFor(keySet, rand = Math.random, scope = 'level') {
    const cache = new Map();
    return function poolFor(round) {
        const key = lengthForRound(round);
        if (!cache.has(key)) cache.set(key, poolForLevel({ keySet, round, scope, rand }));
        return cache.get(key).targets;
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// SHATTER'S POOL
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ SHATTER'S POOL IS `shatter-words.js`, NOT `word-banks.js`, AND THE
// DIFFERENCE IS THE ENTIRE GAME. Those 300 words are the ones with **verified
// morpheme splits** — the only pool on which `splitTarget()` reaches its top
// rung. A Shatter run played on `word-banks.js` words, or on letter groups,
// lands every split on the **halves** rung: `asdfjk` → `asd|fjk`, the same drill
// twice. That is a real and useful thing for a beginner and it is NOT the point
// of the game.
//
// ⭐ THE POINT IS `un|usual|ly` — a student learning syllable chunking as a
// survival reflex, which is the actual skill that stops letter-by-letter typing.
// ⚠️ A BUILD IN WHICH NO STUDENT CAN REACH THE MORPHEME RUNG HAS SHIPPED SHATTER
// WITHOUT SHIPPING SHATTER.
//
// ⚠️ AND THAT IS WHY `scope: 'full'` MATTERS MOST HERE. Morpheme words are long
// and use the whole alphabet, so a level-scoped pool cannot reach them until very
// late in the course — while a third of the school could type them on day one.

// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THE ORDER A STUDENT RECEIVES WORDS IN — Jake, 2026-09-10
// ═════════════════════════════════════════════════════════════════════════════
//
// *"the words are coming through alphabetically...which is kind of lame."*
//
// ⭐ NOBODY CHOSE THAT. It fell out of three separately-correct decisions:
// `shatter-words.js` and every bank in `word-banks.js` are STORED
// alphabetically (right — a human has to be able to find a word in them);
// `wordsForKeys()` and `gradedOrder()` PRESERVE input order (right — neither
// has any business inventing one); and `GameDirector.nextTarget()` walks
// `targets` with a wrapping cursor (right — learn.js hands it the sentences of
// a passage and they must arrive in the order the author wrote them).
//
// ⚠️⚠️ SO THE FIX BELONGS HERE AND NOT IN THE DIRECTOR. Shuffling inside
// nextTarget() would shuffle learn.js's passages too, and would destroy the
// easy-band-first ramp below. ⭐ THE POOL IS THE THING THAT KNOWS WHAT ORDER IT
// WANTS; the director is the thing that must honour whatever it is handed.
//
// ⚠️ IT TAKES `rand`, LIKE EVERY OTHER RANDOM THING IN THIS REPO. A pool that
// cannot be reproduced in a harness is one whose "it dealt me three impossible
// words in a row" report cannot be investigated.

/** Fisher–Yates, on a copy. ⚠️ NEVER IN PLACE — `BANKS` and `SHATTER_WORDS` are
 *  module-level constants shared by every caller in the app, and shuffling one
 *  of them would reorder the source of truth for the whole process. */
function shuffled(list, rand) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
}

/**
 * ⭐ EASY BAND FIRST, THEN MEDIUM. The director consumes `targets` in order and
 * wraps, so the order IS the difficulty curve — a free ramp that costs nothing
 * and needs no new machinery.
 *
 * ⚠️⚠️ SHUFFLED **WITHIN** EACH BAND, NEVER ACROSS THEM. v2.0.0 said "NOT
 * SHUFFLED: shuffling would hand a Unit-2 student `accomplishment` as their
 * opening rock" — that reasoning is correct and is why this is not a plain
 * shuffle. ⭐ BUT IT ONLY EVER DEFENDED THE BAND ORDER, AND WAS READ AS
 * DEFENDING THE ALPHABET, which nothing defends: the list happens to be stored
 * A–Z so the student got `abandoned abruptly absently absolutely`. Shuffling
 * inside each band keeps every easy word ahead of every harder one and kills
 * the march. tests/arcade-pool-test.mjs Part F pins both halves.
 */
function gradedOrder(entries, rand = Math.random) {
    const easy = [], rest = [];
    for (const e of entries) (e.grade === 'easy' ? easy : rest).push(e);
    return shuffled(easy, rand).concat(shuffled(rest, rand));
}

/**
 * @param {object} o
 *   scope  {'level'|'full'}
 *   keySet {string[]}  only consulted when scope is 'level'
 *   count  {number}    letter groups to make if a level cannot supply words
 * @returns {{ targets: string[], source: 'morphemes'|'letters', len: null }}
 *
 * ⚠️ EVERY RETURNED WORD IS `splittable()`. game-shatter.js filters the pool
 * again on mount and would silently drop anything that is not, leaving a
 * shorter pool than anyone here intended.
 */
export function shatterPool({ scope = 'level', keySet, count = 200, rand = Math.random }) {
    const usable = SHATTER_WORDS.filter(e => splittable(e.w) && !firstBlocked(e.w));
    if (scope === 'full') {
        return { targets: gradedOrder(usable, rand).map(e => e.w), source: 'morphemes', len: null };
    }
    const keys = (keySet || []).filter(k => typeof k === 'string' && k.length === 1);
    const allowed = keys.length ? new Set(keys.map(k => k.toLowerCase())) : null;
    const fits = allowed
        ? usable.filter(e => [...e.w].every(ch => allowed.has(ch)))
        : usable;
    if (fits.length >= MIN_POOL && distinctFirsts(fits.map(e => e.w)) >= MIN_DISTINCT_FIRSTS) {
        return { targets: gradedOrder(fits, rand).map(e => e.w), source: 'morphemes', len: null };
    }
    // ⚠️ NOT A FAILURE — see the header. A beginner shattering `asd|fjk` is
    // practising the drill they are actually on, under pressure.
    return {
        targets: makeArcadeTargets(keySet, count, ARCADE_GROUP_SIZE, rand),
        source: 'letters',
        len: null,
    };
}

/**
 * One entry point, so a host does not need to know which module a game's words
 * live in. ⚠️ THE HOSTS CALL THIS, NOT THE TWO FUNCTIONS ABOVE — two pages each
 * branching on game id is two places to add the fourth game to.
 */
export function arcadePool({ game, scope = 'level', keySet, round = 1,
                             count = 200, rand = Math.random }) {
    // ⚠️⚠️ SHARDS WAS MISSING HERE AND FELL THROUGH TO poolForLevel(), so it was
    // dealt the plain word banks instead of the morpheme-splittable words.
    // Jake, 2026-09-11: *"Shards just got the whole word pool, which made it play
    // a little weird."* ⭐ EXACTLY THE DEFECT THIS FUNCTION'S HEADER WARNS ABOUT,
    // one round after it was written: *"two pages each branching on game id is
    // two places to add the fourth game to"* — and then the fourth game was added
    // and this branch was not. ⚠️ A LIST OF IDS IS STILL A SECOND RECORD OF WHICH
    // GAMES SHATTER; if a fifth appears, it belongs in game-names.js as a flag,
    // not here.
    if (game === 'shatter' || game === 'shards') {
        return shatterPool({ scope, keySet, count, rand });
    }
    return poolForLevel({ keySet, round, scope, count, rand });
}
