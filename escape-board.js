// escape-board.js v2.0.0 — ESCAPE KEY's BOARD, WITH NO CANVAS IN IT.
// Round 82 (Victor), Round 104, Rounds 107–108 (Bar-Let).
//
// ✅ **2.0.0 ON JAKE'S EXPLICIT SIGN-OFF, 2026-09-09**: *"If it was 1.x, then
// it's definitely 2."* Rule 3 satisfied — flagged, not decided unilaterally.
// The creature behaviours, the spawn geometry and the round system are all
// replaced; `round` now means WAVE rather than a step count, and
// `STEPS_PER_ROUND`, `HUNTER_ROUND`, `MIN_SPAWN_DISTANCE`, `ZAP_STEPS` and
// `ENEMY_LIFE_ROUNDS` are gone.
//
// ⚠️⚠️ AND THE REASON THIS IS A 2.0.0 RATHER THAN A FEATURE IS WORTH RECORDING.
// Jake: *"this is exactly the logic I already had working with Gemini (mostly)
// when I sent it to one of your predecessors. So your version 0.x was closer to
// right than any of your 1.x."* ⭐ HE IS RIGHT, AND IT IS THE SAME FAILURE AS THE
// SPRITES ONE FILE OVER: the port kept the arithmetic and threw away the design.
// The rules in this file are not new work — they are RECOVERED work, and the
// rounds that lost them cost more than the round that restored them.
//
// v2.0.0 — ⭐ THE ROUND SYSTEM IS A WAVE SCHEDULE, AND THE OLD ONE TAUGHT THE
//   STUDENT NOTHING. Creatures used to arrive on a POPULATION TARGET driven by
//   pressure, so a child met a kaiju and a spider together in their first thirty
//   seconds with no idea what either did. Jake: *"Second round does not spawn
//   until the first round is down. This allows the player to learn what each one
//   does."* ⚠️ A population spawner cannot express that at all, which is why it
//   was replaced rather than tuned.
//   • Spiders run COLUMNS from the top or bottom and web one cell left or right,
//     40/40/20. Kaiju run ROWS from the left or right and zap one cell up or
//     down, 40/40/20. ⚠️ THE 20 IS LOAD-BEARING — a creature that acted every
//     step would leave no clean square to cross.
//   • Both PEEK at the edge for a step before committing. That replaces
//     MIN_SPAWN_DISTANCE as the telegraph.
//   • Webs last 4 steps and catch anything: kaiju stuck 1, hunter stuck 2, the
//     player types a new word out. Ash holds a square for 5 and is unenterable —
//     ⭐ BY HAVING NO WORD, so there is exactly one rule and no way for a
//     passability test and a word test to disagree.
//   • The hunter mostly follows, dies to a kaiju or its blast, and ⭐ PAYS AN
//     EXTRA LIFE if the student types onto it while it is webbed.
//
// v1.1.0 — an OPTIONAL `poolFor(round)`. ⚠️⚠️ WITHOUT IT `word-banks.js` IS
//   DECORATIVE: the eight banks exist so words lengthen as the student plays,
//   and a pool fixed at construction pins every run to round 1's length, leaving
//   seven banks that nothing ever reads. ⚠️ A HOST THAT PASSES NOTHING GETS THE
//   OLD BEHAVIOUR BYTE FOR BYTE — all 39 assertions here run that path.
//
// ⚠️⚠️ EXTRACTED FROM THE VIEW SO THE CAMPER CAN BE PROVED TO DIE. Jake asked
// the right question, 2026-09-07: *"Doesn't a student have to type in order to
// dodge? Or do you mean that they can just stay in place and hope to avoid
// trouble?"* — and the answer was that a camper WAS safe, because enemies spawned
// anywhere on a 6×5 board and mostly wandered elsewhere. That is a claim about
// board mechanics, and while the mechanics lived inside a requestAnimationFrame
// loop in a canvas view it could not be tested, only believed.
//
// So this file is the board, the enemies and the keystroke rules, and it is pure:
// no canvas, no DOM, no timers, no Date.now(), no Math.random() unless you hand
// it one. `tests/escape-board-test.mjs` drives a typist who never types a single
// key and asserts they lose. Same split as game-shell.js, one level down.
//
// ⚠️ IT DOES NOT TOUCH THE DIRECTOR. The board reports what happened; the view
// accounts it to game-shell.js. If this file ever imports game-shell.js, the
// counting has two homes.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ SPAWNING IN THE PLAYER'S ROW OR COLUMN IS THE WHOLE DESIGN, NOT A TWEAK
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake's fix, and it does more than close the camping hole: *"Could we have the
// creatures spawn at the row/column or within reach of the row/column?"*
//
// Every enemy arrives on the player's row or the player's column, at least
// MIN_SPAWN_DISTANCE cells away so it is telegraphed rather than an ambush. The
// consequence is that STANDING STILL IS NEVER SAFE, and since moving costs a
// typed word, the threat cadence *becomes* the typing requirement. That is what
// turns Escape Key from a cadence game — where typing bought mobility and a
// patient player could opt out — into a genuine throughput game whose pressure
// is already gate-derived at one enemy step per word.
//
// ⚠️ THIS IS WHY ESCAPE KEY IS ARGUABLE FOR THE GRADED PATH AND WAS NOT BEFORE.
// Do not "soften" the spawn rule back to anywhere-on-the-board without
// re-opening that decision; the row/column rule is load-bearing for the grade,
// not for the difficulty.

import { safeGroup } from './drill-filter.js';

export const ESCAPE_BOARD_VERSION = '2.0.0';

export const COLS = 6;
export const ROWS = 5;

// Telegraphing distance. At 1 an enemy could appear adjacent and take a shield
// before the student has had a chance to read it, which is not pressure, it is a
// coin flip. At 2 they always get at least one enemy step of warning.
// ⚠️ MIN_SPAWN_DISTANCE IS GONE. Creatures now enter from the board EDGE and
// spend a step peeking before they commit (see PEEK_STEPS), so the telegraph is
// the peek rather than a spawn-distance floor. Re-adding a distance rule would
// be a second answer to a question the peek already answers.

// A zapped cell stays empty for this many enemy steps, and a web lasts this many.
// ⚠️ IN STEPS, NOT MILLISECONDS, so both scale with the student's gate exactly as
// the enemy cadence does. A duration in ms would have been a second difficulty
// knob that ignored the gate.
// ⚠️ ZAP_STEPS AND THE OLD WEB_STEPS LIVED HERE. They are ASH_STEPS and
// WEB_STEPS below now, on Jake's numbers (5 and 4), declared once beside the
// rules that use them.

// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ v1.2.0 — A ROUND IS A WAVE, NOT A NUMBER OF STEPS. JAKE'S SPEC, 2026-09-09
// ═══════════════════════════════════════════════════════════════════════════
//
// Everything above this line about rounds-as-step-counts was wrong, and it was
// wrong in the way that matters most: **it never taught the student anything.**
// Creatures arrived on a population timer, so a child met a kaiju and a spider
// simultaneously in their first thirty seconds with no idea what either did.
//
// ⭐ JAKE'S SCHEDULE IS A TUTORIAL DISGUISED AS A DIFFICULTY CURVE:
//
//   wave 1  one of {spider, kaiju}, at random
//   wave 2  THE OTHER ONE — and not until wave 1 is gone
//   wave 3  either, again not until wave 2 is gone
//   wave 4  the OPPOSITE of wave 3, once wave 3 is four squares in
//   wave 5  either, four squares in
//   wave 6  the hunter, four squares in
//   waves 7–11   three squares in; 7–8 are the two, 9+ can be any of the three
//   waves 12–14  two squares in
//   waves 15+    one square in
//
// ⚠️⚠️ WAVES 1–3 WAIT FOR AN EMPTY BOARD AND THAT IS THE WHOLE POINT OF THEM.
// Jake: *"Second round does not spawn until the first round is down. This allows
// the player to learn what each one does."* A population-based spawner cannot
// express that, which is why this replaced one.
//
// ⚠️ THE TAIL IS DELIBERATELY BORING. Jake: *"You can also change it, as it's
// obviously getting silly."* Past wave 15 the gap is pinned at one square and the
// kind is random — the escalation stops being a table and becomes a floor,
// because a schedule nobody can hold in their head is a schedule nobody can
// debug. ⭐ THE REAL DIFFICULTY PAST THAT POINT IS game-shell.js's PRESSURE RAMP,
// which is already gate-derived and already tested.

/** Waves 1–3 wait for the board to clear. Later waves trigger on distance. */
export const CLEAR_WAVES = 3;

/** How far the previous wave must have travelled before the next one arrives. */
export function gapForWave(wave) {
    if (wave <= CLEAR_WAVES) return null;   // null = "wait for an empty board"
    if (wave <= 6) return 4;
    if (wave <= 11) return 3;
    if (wave <= 14) return 2;
    return 1;
}

// ⚠️⚠️ THE ONE THING IN JAKE'S SPEC I COULD NOT RECONCILE, FLAGGED RATHER THAN
// GUESSED AT. He wrote *"Hunter bot doesn't spawn until the 4th round"* and then,
// in the schedule itself, *"Sixth round is when the fifth round is 4 squares in,
// but it's a hunter bot."* Those are different numbers for the same event.
// ⭐ THE SCHEDULE WINS HERE because it is the more specific statement and because
// wave 6 is where the guaranteed hunter reads best — the student has met both
// other creatures alone AND together first. ⚠️ IF 4 WAS MEANT, THIS IS THE ONE
// LINE TO CHANGE; nothing else assumes 6.
export const HUNTER_WAVE = 6;

/** From this wave on, a random pick may draw the hunter. */
export const HUNTER_RANDOM_WAVE = 9;

/**
 * The kind for a wave. `prev` is the previous wave's kind, because two of the
 * rules are stated relative to it.
 *
 * ⚠️ `rand` IS PASSED IN, NOT READ FROM `this`, so a schedule can be computed
 * ahead of play for the preview panel without consuming the board's own random
 * sequence — which would make the board's future depend on whether anyone was
 * looking at it.
 */
export function kindForWave(wave, prev, rand) {
    const two = ['spider', 'kaiju'];
    if (wave === HUNTER_WAVE) return 'hunter';
    // Waves 2 and 4 are stated as "the opposite of the one before".
    if (wave === 2 || wave === 4) return prev === 'spider' ? 'kaiju' : 'spider';
    if (wave >= HUNTER_RANDOM_WAVE) {
        const r = rand();
        return r < 0.4 ? 'spider' : r < 0.8 ? 'kaiju' : 'hunter';
    }
    return two[rand() < 0.5 ? 0 : 1];
}

// ⚠️⚠️ 40 / 40 / 20, JAKE'S NUMBERS, AND THE 20 IS THE IMPORTANT ONE. A creature
// that acts on every single step gives the student no clean square to cross; the
// one-in-five quiet step is what makes the board readable instead of a wall.
export const ACT_LEFT = 0.4;
export const ACT_RIGHT = 0.8;   // cumulative: 0.4–0.8 is the second direction

/** A web lasts the time it takes to move four squares. Jake's spec, verbatim. */
export const WEB_STEPS = 4;

/** An ashed square holds no word and cannot be entered, for five steps. */
export const ASH_STEPS = 5;

/** How long a creature caught in a web stays stuck. The player is not on this
 *  list: a webbed player types a new word out, and is never frozen. */
export const STUCK_STEPS = { kaiju: 1, hunter: 2, spider: 0 };

// ⚠️ A CREATURE PEEKS IN BEFORE IT COMMITS. Jake: *"they spawn at the top or
// bottom and they peek in before they actually fully move in."* It costs the
// student nothing and buys them a full step of warning, which is the difference
// between a threat and an ambush — the same job MIN_SPAWN_DISTANCE used to do
// before spawning moved to the board edge.
export const PEEK_STEPS = 1;

export const MAX_ENEMIES = 6;

// ⚠️ CREATURES STILL EXPIRE, or the board fills and later waves have nowhere to
// arrive. ⚠️ IN STEPS NOW, NOT ROUNDS — rounds are waves and no longer have a
// fixed length, so a lifetime measured in them would vary with the schedule.
export const ENEMY_LIFE_STEPS = 22;

/**
 * @param {object} o
 *   pool {string[]}  the director's target list. ⚠️ THERE IS NO DICTIONARY IN
 *                    THIS FILE AND THERE MUST NOT BE ONE — the prototype's
 *                    hardcoded word list is what bypassed drill-filter.js and put
 *                    Unit 6 words in front of a Unit 1 student.
 *   rand {function}  injected, so a failing board is reproducible
 */
export class EscapeBoard {
    constructor(o) {
        const c = o || {};
        this.pool = (c.pool || []).slice();
        // ⚠️⚠️ OPTIONAL, AND WITHOUT IT `word-banks.js` IS DECORATIVE. The eight
        // banks exist so words LENGTHEN while the student plays; a pool fixed at
        // construction pins every run to round 1's length and seven of the eight
        // banks are never read by anything. `poolFor(round)` is called on every
        // draw so the board's own round decides the words.
        // ⚠️ A HOST THAT PASSES NOTHING GETS THE OLD BEHAVIOUR EXACTLY — the
        // static `pool`, byte for byte. escape-board-test.mjs's 39 assertions
        // all run that path and must stay green.
        this.poolFor = typeof c.poolFor === 'function' ? c.poolFor : null;
        this.rand = c.rand || Math.random;

        this.player = { x: 2, y: 2, facingLeft: false, webWord: null };
        this.typed = '';
        this.aim = null;
        this.enemies = [];
        this.webs = [];
        this.stepsTaken = 0;
        // ⚠️ THE WAVE, NOT A DERIVED ROUND NUMBER. `round` used to be
        // `1 + floor(steps / STEPS_PER_ROUND)` — a clock, not a schedule — and it
        // is why creatures arrived on a population timer and taught the student
        // nothing. This counts waves actually dispatched.
        this.wave = 1;
        this._schedule = {};
        this._lastSpawned = null;
        this.extraLives = 0;
        this.grid = [];
        this.zapped = [];

        for (let y = 0; y < ROWS; y++) {
            this.grid[y] = [];
            this.zapped[y] = [];
            for (let x = 0; x < COLS; x++) { this.grid[y][x] = ''; this.zapped[y][x] = 0; }
        }
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                this.grid[y][x] = this.wordAvoiding([
                    this.grid[y][x - 1], y > 0 ? this.grid[y - 1][x] : '',
                ]);
            }
        }
        this.grid[this.player.y][this.player.x] = '';
        this.refreshNeighbours();
    }

    // ── words ───────────────────────────────────────────────────────────────

    /**
     * A word whose FIRST CHARACTER differs from those in `avoid`.
     *
     * ⚠️ FIRST CHARACTER IS THE THING THAT MUST DIFFER, not the whole word. The
     * player types to choose a direction, so two adjacent cells starting with the
     * same letter make the first keystroke ambiguous — that is the actual failure
     * mode. The prototype demanded whole-word distinctness across all 30 cells,
     * which needs 31 groups a home-row key set cannot supply, and when it ran out
     * it returned `dictionary[0]`: a silent duplicate, in a game where two
     * identical adjacent words make the direction unchoosable.
     *
     * ⚠️ IT GIVES UP AND RETURNS SOMETHING RATHER THAN LOOPING. Same principle as
     * drill-filter.js's exhausted budget — a board that appears beats a board
     * that is perfect, and a game that hangs beats nothing.
     */
    /**
     * Draw a word for one cell.
     *
     * @param {string[]} avoid  words whose FIRST CHARACTER this one must not
     *        share — the adjacency rule, so four neighbours stay choosable.
     *
     * ⚠️⚠️ AND SEPARATELY, NO WORD ALREADY ON THE BOARD. Jake, 2026-09-09:
     * *"the words are all repeated multiple times on the same frame. There
     * shouldn't really be any repeats with a pool of 200 words."* He is right and
     * the cause was that THIS FUNCTION ONLY EVER COMPARED FIRST CHARACTERS. Two
     * cells holding `into` never violated the adjacency rule, so nothing stopped
     * six of them, and with 200 words available the board still looked like it
     * had eight.
     *
     * ⭐ THE TWO RULES ARE DIFFERENT AND BOTH ARE NEEDED: first characters must
     * differ among NEIGHBOURS so the student can choose a direction; whole words
     * must differ across the WHOLE BOARD so it reads as thirty things rather than
     * as eight repeated.
     *
     * ⚠️ THE UNIQUENESS PASS IS BEST-EFFORT AND FALLS BACK, because it has to:
     * `arcade-pool.js`'s MIN_POOL is 24 and the board has 30 cells, so a thin
     * early level CANNOT fill it uniquely. A hard requirement would blank cells
     * on exactly the levels that can least afford it.
     */
    wordAvoiding(avoid) {
        // ⚠️ THE ROUND'S POOL, NOT THE CONSTRUCTOR'S, WHEN A PROVIDER IS GIVEN.
        // ⚠️ AND IT FALLS BACK TO `this.pool` IF THE PROVIDER RETURNS NOTHING: a
        // provider is host code, and a board of blank cells with nowhere to move
        // is the worst outcome this file can produce.
        const pool = (this.poolFor && (this.poolFor(this.round) || []).length)
            ? this.poolFor(this.round) : this.pool;
        if (!pool.length) return '';
        const taken = new Set((avoid || []).filter(Boolean).map(w => w[0]));
        const used = this.wordsInUse();

        // Pass 1: a different first character AND a word not already on the board.
        for (let i = 0; i < 60; i++) {
            const w = pool[Math.floor(this.rand() * pool.length)];
            if (!taken.has(w[0]) && !used.has(w)) return w;
        }
        // ⚠️ PASS 2 DROPS UNIQUENESS BEFORE IT DROPS THE FIRST-CHARACTER RULE, and
        // that order is deliberate. A duplicate word is untidy; two neighbours
        // sharing a first character makes the board UNCHOOSABLE, which is a
        // broken game rather than an ugly one.
        for (let i = 0; i < 40; i++) {
            const w = pool[Math.floor(this.rand() * pool.length)];
            if (!taken.has(w[0])) return w;
        }
        const distinct = new Set(pool.map(w => w[0])).size;
        if (distinct <= 4) {
            console.warn(`[escape] only ${distinct} distinct first characters in the pool — ` +
                         'adjacent cells cannot all differ. Check this lesson\'s key set.');
        }
        return pool[Math.floor(this.rand() * pool.length)];
    }

    /** Called after every move, because "adjacent" moves with the player. */
    refreshNeighbours() {
        const seen = new Set();
        for (const c of this.adjacent(this.player.x, this.player.y)) {
            let w = this.grid[c.y][c.x];
            if (!w) continue;
            if (seen.has(w[0])) {
                this.grid[c.y][c.x] = this.wordAvoiding(Array.from(seen).concat([w]));
                w = this.grid[c.y][c.x];
            }
            if (w) seen.add(w[0]);
        }
    }

    adjacent(x, y) {
        const out = [];
        if (y > 0) out.push({ x, y: y - 1, dir: 'up' });
        if (y < ROWS - 1) out.push({ x, y: y + 1, dir: 'down' });
        if (x > 0) out.push({ x: x - 1, y, dir: 'left' });
        if (x < COLS - 1) out.push({ x: x + 1, y, dir: 'right' });
        return out;
    }

    // ── keystrokes ──────────────────────────────────────────────────────────

    /**
     * Offer one character to the board.
     *
     * @returns {object} one of:
     *   { correct:true,  kind:'progress' }
     *   { correct:true,  kind:'move',  word, from, to, webbed }
     *   { correct:true,  kind:'tear-progress' }
     *   { correct:true,  kind:'tear-free' }
     *   { correct:false, kind:'miss' }
     *
     * ⚠️ `correct` IS WHAT THE VIEW HANDS TO THE DIRECTOR, and every keystroke
     * returns one. All three prototypes discarded a key that matched nothing, so
     * a masher could sit at 100% accuracy indefinitely.
     *
     * ⚠️ CASE-SENSITIVE. learn.js compares `typed === expected` exactly, so a
     * capital needs Shift there and needs Shift here. The prototype uppercased
     * both sides, which made every capital in a book lesson free.
     *
     * ⚠️ A WEBBED PLAYER IS NEVER FROZEN. The prototype set `stuckUntil = now +
     * 4000` and returned early on every key inside that window, so the keyboard
     * did nothing and flashed red — which reads to a twelve-year-old as broken
     * hardware. Here a web costs a NEW word (Jake's amendment: *"it should be a
     * new word"*), and every keystroke still lands and still counts.
     */
    tryKey(ch) {
        const p = this.player;

        if (p.webWord != null) {
            if (ch === p.webWord[this.typed.length]) {
                this.typed += ch;
                if (this.typed.length >= p.webWord.length) {
                    p.webWord = null;
                    this.typed = '';
                    return { correct: true, kind: 'tear-free' };
                }
                return { correct: true, kind: 'tear-progress' };
            }
            this.typed = '';
            return { correct: false, kind: 'miss' };
        }

        const want = this.typed + ch;
        let exact = null, partial = false;
        for (const c of this.adjacent(p.x, p.y)) {
            // ⚠️⚠️ AN ASHED SQUARE HOLDS NO WORD, SO IT IS UNREACHABLE BY
            // CONSTRUCTION AND NEEDS NO SECOND CHECK HERE. Jake: *"Zapped squares
            // are turned to ash and don't respawn words for 5 turns. As a result,
            // the player cannot enter them."* ⭐ "AS A RESULT" IS THE DESIGN — the
            // absence of a word IS the wall, so there is exactly one rule and no
            // way for a passability test and a word test to disagree.
            const w = this.grid[c.y][c.x];
            if (!w || !w.startsWith(want)) continue;
            partial = true;
            this.aim = c.dir;
            if (w === want) { exact = c; break; }
        }

        if (!partial) {
            this.typed = '';
            this.aim = null;
            return { correct: false, kind: 'miss' };
        }
        this.typed = want;
        if (!exact) return { correct: true, kind: 'progress' };
        return this.moveTo(exact);
    }

    moveTo(c) {
        const p = this.player;
        const word = this.grid[c.y][c.x];
        const from = { x: p.x, y: p.y };

        // The vacated cell refills, the entered one empties: the board stays full
        // and the player's own square is never a target.
        this.grid[p.y][p.x] = this.wordAvoiding(
            this.adjacent(p.x, p.y).map(a => this.grid[a.y][a.x]));
        if (c.dir === 'left') p.facingLeft = true;
        if (c.dir === 'right') p.facingLeft = false;
        p.x = c.x; p.y = c.y;
        this.grid[c.y][c.x] = '';
        this.typed = '';
        this.aim = null;
        this.refreshNeighbours();

        // ⭐⭐ A HUNTER STUCK IN A WEB IS A PRIZE, NOT A HAZARD. Jake: *"If it
        // gets caught in a web and the player gets him, the player can get a new
        // life. Hooray."* ⚠️ IT IS CHECKED BEFORE THE WEB, because the square the
        // hunter is stuck on is by definition a webbed square, and resolving the
        // web first would web the player onto their own trophy.
        // ⚠️ ONLY A STUCK HUNTER. Walking into a free one is still a death, or the
        // bot would be worth chasing.
        let rescued = false;
        const hi = this.enemies.findIndex(e => e.kind === 'hunter'
            && e.x === p.x && e.y === p.y && e.stunSteps > 0);
        if (hi !== -1) {
            this.enemies.splice(hi, 1);
            this.extraLives++;
            rescued = true;
        }

        let webbed = false;
        const wi = this.webs.findIndex(w => w.x === p.x && w.y === p.y);
        if (wi !== -1 && !rescued) {
            this.webs.splice(wi, 1);
            p.webWord = this.wordAvoiding([word]);
            webbed = true;
        }
        return { correct: true, kind: 'move', word, from, to: { x: p.x, y: p.y },
                 webbed, rescued };
    }

    clearTyped() { this.typed = ''; this.aim = null; }

    // ── the enemy cadence ───────────────────────────────────────────────────

    /**
     * Advance the board one enemy step.
     *
     * @param {number} pressure  the director's current pressure, which drives
     *                           population and the hunter unlock
     * @returns {object[]} events, for the view to animate:
     *   { t:'zap', x, y } { t:'web', x, y } { t:'spawn', kind, x, y } { t:'caught' }
     *
     * ⚠️ THE STEP INTERVAL IS NOT IN HERE. How often this is called is
     * game-shell.js's `enemyStepMs()` — one step per the time the student's gate
     * allows for one word. ⚠️ IF A `MOVE_SPEED` CONSTANT APPEARS IN THIS FILE,
     * the 40-WPM defect is back.
     */
    step(pressure) {
        const events = [];
        this.stepsTaken++;

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.zapped[y][x] > 0 && --this.zapped[y][x] === 0
                    && !(x === this.player.x && y === this.player.y)) {
                    this.grid[y][x] = this.wordAvoiding(
                        this.adjacent(x, y).map(a => this.grid[a.y][a.x]));
                }
            }
        }
        for (let i = this.webs.length - 1; i >= 0; i--) {
            if (--this.webs[i].steps <= 0) this.webs.splice(i, 1);
        }
        this.refreshNeighbours();

        // ⚠️ CREATURES EXPIRE. See ENEMY_LIFE_STEPS — without this the board
        // fills in round 1 and the hunter's unlock opens onto a full board.
        // ⚠️ A STUNNED CREATURE STILL AGES. Otherwise webbing a hunter would
        // preserve it indefinitely, which is the opposite of the tactic's point.
        const life = ENEMY_LIFE_STEPS;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const en = this.enemies[i];
            if (this.stepsTaken - (en.bornStep || 0) >= life) {
                this.enemies.splice(i, 1);
                events.push({ t: 'leave', kind: en.kind, x: en.x, y: en.y });
            }
        }

        for (const en of this.enemies) {
            // ⭐ THE PEEK. Jake: *"they peek in before they actually fully move
            // in."* A creature spends its first step at the board edge, visible
            // and doing nothing, then commits. ⚠️ IT COSTS THE STUDENT NOTHING
            // AND BUYS THEM A FULL STEP OF WARNING — the difference between a
            // threat and an ambush, which is the job MIN_SPAWN_DISTANCE did back
            // when creatures spawned inside the board.
            if (en.peek > 0) { en.peek--; if (en.peek === 0) events.push({ t: 'enter', kind: en.kind, x: en.x, y: en.y }); continue; }
            if (en.stunSteps > 0) { en.stunSteps--; continue; }

            // ⚠️⚠️ A WEB CATCHES ANYTHING THAT ENTERS IT, AND FOR DIFFERENT
            // LENGTHS. Jake's spec: *"Kaiju are stuck for a turn... hunter bots
            // are stuck for 2 turns, and the player has to type a new word to get
            // out."* ⚠️ CHECKED AT THE TOP OF THE CREATURE'S TURN, NOT AFTER IT
            // MOVES — an earlier draft tested for a web underneath an enemy after
            // movement, by which time it had already stepped off the web it was
            // standing on and was never caught at all.
            // ⚠️ THE WEB IS CONSUMED. A web that held every passer-by forever
            // would let one spider lock a lane for the rest of the game.
            const wi = this.webs.findIndex(w => w.x === en.x && w.y === en.y);
            if (wi !== -1 && STUCK_STEPS[en.kind] > 0) {
                this.webs.splice(wi, 1);
                en.stunSteps = STUCK_STEPS[en.kind];
                events.push({ t: 'stuck', kind: en.kind, x: en.x, y: en.y });
                continue;
            }

            if (en.kind === 'kaiju') {
                // ⚠️⚠️ A KAIJU RUNS A ROW, ALWAYS. Jake: *"Kaiju spawn at the left
                // or right."* It is a horizontal lane threat by construction, and
                // its danger to a player NOT on its row is the zap, not the walk.
                en.x += en.dir;
                if (en.x < 0 || en.x > COLS - 1) {
                    en.dead = true;
                    events.push({ t: 'leave', kind: en.kind, x: en.x, y: en.y });
                    continue;
                }
                // ⭐ 40 / 40 / 20 — UP, DOWN, OR NOTHING. The one-in-five quiet
                // step is what leaves the student a clean square to cross.
                const roll = this.rand();
                const zapDir = roll < ACT_LEFT ? -1 : roll < ACT_RIGHT ? 1 : 0;
                if (zapDir) {
                    // ⚠️⚠️ ONE CELL, NOT THE WHOLE COLUMN, AND THE SPIDER IS WHY.
                    // Jake's two sentences are deliberately parallel — the spider
                    // shoots webs *left or right*, the kaiju zaps *up or down* —
                    // so they are the same rule mirrored, and one cell is what
                    // that reads as.
                    // ⭐ I BUILT THE COLUMN-WIDE VERSION FIRST AND A DRY RUN
                    // KILLED IT: at 80% of steps firing and five steps of ash, a
                    // single kaiju held roughly HALF THE BOARD unenterable at
                    // once, and the student had nowhere legal to type toward.
                    // ⚠️ THE BEAM IS STILL DRAWN TO THE EDGE — the `blast` event
                    // carries the direction and the view renders the full sweep,
                    // because the kaiju should LOOK like it fires across the
                    // board. What it damages is one square.
                    const zy = en.y + zapDir;
                    if (zy >= 0 && zy < ROWS) {
                        this.ash(en.x, zy);
                        events.push({ t: 'zap', x: en.x, y: zy });
                        // ⚠️ THE BLAST KILLS A HUNTER IT LANDS ON. Jake's spec,
                        // and it is the student's best tool: bait the bot into a
                        // kaiju's firing line.
                        for (const other of this.enemies) {
                            if (other !== en && other.kind === 'hunter'
                                && other.x === en.x && other.y === zy) {
                                other.dead = true;
                                events.push({ t: 'destroyed', kind: 'hunter', x: en.x, y: zy });
                            }
                        }
                    }
                    events.push({ t: 'blast', x: en.x, y: en.y, dir: zapDir });
                }
            } else if (en.kind === 'spider') {
                // ⚠️ A SPIDER RUNS A COLUMN. Jake: *"Spiders go up or down."*
                en.y += en.dir;
                if (en.y < 0 || en.y > ROWS - 1) {
                    en.dead = true;
                    events.push({ t: 'leave', kind: en.kind, x: en.x, y: en.y });
                    continue;
                }
                const roll = this.rand();
                const webDir = roll < ACT_LEFT ? -1 : roll < ACT_RIGHT ? 1 : 0;
                const wx = en.x + webDir;
                if (webDir && wx >= 0 && wx < COLS) {
                    const ex = this.webs.find(w => w.x === wx && w.y === en.y);
                    if (ex) ex.steps = WEB_STEPS;
                    else this.webs.push({ x: wx, y: en.y, steps: WEB_STEPS });
                    events.push({ t: 'web', x: wx, y: en.y });
                }
            } else {
                // ⚠️ THE HUNTER *MOSTLY* FOLLOWS. Jake's word, and the slack is
                // the point: a bot that closes perfectly every step is unbeatable
                // on a 6×5 board, and one that wanders is not a hunter. One step
                // in five it drifts, which is what makes leading it onto a web or
                // into a kaiju's row a plan rather than a coin flip.
                if (this.rand() < 0.2) {
                    if (this.rand() < 0.5) en.x += this.rand() < 0.5 ? 1 : -1;
                    else en.y += this.rand() < 0.5 ? 1 : -1;
                } else if (en.x !== this.player.x) {
                    en.x += this.player.x > en.x ? 1 : -1;
                } else if (en.y !== this.player.y) {
                    en.y += this.player.y > en.y ? 1 : -1;
                }
                en.x = Math.max(0, Math.min(COLS - 1, en.x));
                en.y = Math.max(0, Math.min(ROWS - 1, en.y));
            }
            en.facingLeft = en.dir === -1;
            en.stepsIn = (en.stepsIn || 0) + 1;
        }

        // ⚠️⚠️ CREATURES KILL EACH OTHER, AND ONLY THE HUNTER LOSES. Jake: *"It
        // can be destroyed by the kaiju, the kaiju's blast, or the spider."* The
        // other two pass through one another — they are hazards, not combatants,
        // and a kaiju that could be removed by a spider would let the board clear
        // itself while the student watched.
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const h = this.enemies[i];
            if (h.kind !== 'hunter' || h.dead) continue;
            const killer = this.enemies.find(e => e !== h && e.kind !== 'hunter'
                && !e.dead && e.peek === 0 && e.x === h.x && e.y === h.y);
            if (killer) {
                h.dead = true;
                events.push({ t: 'destroyed', kind: 'hunter', x: h.x, y: h.y, by: killer.kind });
            }
        }
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].dead) this.enemies.splice(i, 1);
        }

        const sp = this.maybeSpawn();
        if (sp) events.push(sp);
        if (this.caughtBy()) events.push({ t: 'caught' });
        return events;
    }

    /**
     * Turn one cell to ash: the word is gone and the square cannot be entered.
     *
     * ⚠️ THE PLAYER'S OWN CELL IS NEVER ASHED — a student standing where a blast
     * lands takes the hit (the view checks `caughtBy`-style contact), but ashing
     * the square under them would leave them standing somewhere they are not
     * allowed to be, with no legal move.
     */
    ash(x, y) {
        if (x === this.player.x && y === this.player.y) return;
        // ⚠️⚠️ A BLAST MAY NEVER TAKE THE PLAYER'S LAST EXIT. Found by the harness
        // once whole-board word uniqueness shifted the random stream: with enough
        // ash on the board a student could have all four neighbours ashed at
        // once, and ash holds a square for five steps. ⭐ THEY WOULD BE ALIVE,
        // UNTHREATENED, AND UNABLE TO TYPE ANYTHING — no legal move, no death, no
        // way to act. A game that simply stops is worse than one that kills you.
        // ⚠️ THE RULE IS "NOT THE LAST ONE", NOT "NEVER NEXT TO THE PLAYER".
        // Ashing three of four exits is exactly the pressure the kaiju is for;
        // only the fourth is refused.
        if (this.isAdjacentTo(x, y, this.player.x, this.player.y)) {
            const exits = this.adjacent(this.player.x, this.player.y)
                .filter(c => this.grid[c.y][c.x] && !(c.x === x && c.y === y)).length;
            if (exits === 0) return;
        }
        this.grid[y][x] = '';
        this.zapped[y][x] = ASH_STEPS;
    }

    isAdjacentTo(x, y, px, py) {
        return Math.abs(x - px) + Math.abs(y - py) === 1;
    }

    /** Can the player step here? ⚠️ THE VIEW MUST NOT ANSWER THIS — ash is a rule. */
    passable(x, y) {
        return x >= 0 && x < COLS && y >= 0 && y < ROWS && this.zapped[y][x] === 0;
    }

    // ── the wave schedule ───────────────────────────────────────────────────

    /**
     * ⭐ THE NEXT THREE WAVES, FOR THE PREVIEW PANEL. Jake: *"Left panel is like
     * the radar in Deadline in that it previews what's coming, but not where. So
     * it can go ahead and tell us what the next three monsters are."*
     *
     * ⚠️⚠️ THE SCHEDULE IS DECIDED IN ADVANCE AND STORED, NOT ROLLED AT SPAWN
     * TIME. A preview that predicted a spawn by re-rolling would show one
     * creature and deliver another; a preview that consumed the board's own
     * random sequence would make the game's future depend on whether anyone was
     * looking at the panel. ⭐ `_schedule` IS THE ONE ANSWER TO BOTH.
     */
    upcoming(n = 3) {
        this._fillSchedule(this.wave + n + 1);
        const out = [];
        for (let i = 0; i < n; i++) {
            const w = this.wave + i;
            out.push({ wave: w, kind: this._schedule[w], gap: gapForWave(w) });
        }
        return out;
    }

    _fillSchedule(upTo) {
        for (let w = 1; w <= upTo; w++) {
            if (this._schedule[w]) continue;
            this._schedule[w] = kindForWave(w, this._schedule[w - 1] || null, this.rand);
        }
    }

    /**
     * Is the next wave due?
     *
     * ⚠️⚠️ WAVES 1–3 WAIT FOR AN EMPTY BOARD, AND THAT IS THE TUTORIAL. Jake:
     * *"Second round does not spawn until the first round is down. This allows
     * the player to learn what each one does."* A population-based spawner cannot
     * express that at all, which is why it was replaced rather than tuned.
     */
    waveDue() {
        if (this.enemies.length >= MAX_ENEMIES) return false;
        // ⚠️ NO SPECIAL CASE FOR WAVE 1. An earlier line here required
        // `stepsTaken === 0`, and step() increments that BEFORE calling this — so
        // the condition was false on the very first step and false forever after.
        // ⭐ THE BOARD SPAWNED NOTHING, EVER, and threw no error while doing it.
        // Wave 1's rule is already the general rule: gap is null, so it waits for
        // an empty board, and the board starts empty.
        const gap = gapForWave(this.wave);
        if (gap === null) return this.enemies.length === 0;
        // ⚠️ MEASURED ON THE MOST RECENT WAVE'S OWN TRAVEL, not on a step count.
        // "Four squares in" is a statement about the creature, and a creature that
        // spent two of those steps stuck in a web has not gone four squares.
        const last = this._lastSpawned;
        if (!last) return true;
        if (last.dead || !this.enemies.includes(last)) return true;
        return (last.stepsIn || 0) >= gap;
    }

    /**
     * Is the student under threat right now?
     *
     * ⚠️ THREAT IS AXIS-SHAPED, because the creatures are. A kaiju two rows away
     * is not a threat to anyone; a kaiju on your row is, and so is a spider in
     * your column. ⭐ THE HUNTER IS ALWAYS A THREAT — that is what it is for.
     * ⚠️ A PEEKING OR STUCK CREATURE DOES NOT COUNT. It cannot act this turn, so
     * treating it as pressure would let the student idle behind it.
     */
    inDanger() {
        return this.enemies.some(e => {
            if (e.peek > 0 || e.stunSteps > 0) return false;
            if (e.kind === 'hunter') return true;
            if (e.kind === 'kaiju') return e.y === this.player.y;
            return e.x === this.player.x;
        });
    }

    /**
     * Which row (kaiju) or column (spider) a new creature should take.
     *
     * ⭐ THE STUDENT'S OWN LANE WHEN THEY ARE SAFE; AN UNCOVERED LANE WHEN THEY
     * ARE NOT. ⚠️ THE SECOND HALF IS WHAT BREAKS THE TRAIN — without it, three
     * kaiju stack into one row and the other four are free forever.
     * ⚠️ AND IT FALLS BACK TO RANDOM rather than to a fixed lane: with every lane
     * covered, a deterministic choice would make the sixth creature's position
     * predictable at exactly the moment the board is most dangerous.
     */
    laneFor(kind) {
        const axisOf = e => (e.kind === 'kaiju' ? e.y : e.x);
        const span = kind === 'kaiju' ? ROWS : COLS;
        const mine = kind === 'kaiju' ? this.player.y : this.player.x;
        if (!this.inDanger()) return mine;
        const covered = new Set(this.enemies
            .filter(e => e.kind === kind && !e.dead)
            .map(axisOf));
        const free = [];
        for (let i = 0; i < span; i++) if (!covered.has(i)) free.push(i);
        if (!free.length) return Math.floor(this.rand() * span);
        return free[Math.floor(this.rand() * free.length)];
    }

    maybeSpawn() {
        if (!this.waveDue()) return null;
        this._fillSchedule(this.wave + 4);
        const kind = this._schedule[this.wave];

        // ⚠️⚠️ CREATURES ENTER FROM THE EDGE THEIR AXIS DEMANDS. A kaiju runs a
        // row so it arrives from the left or right; a spider runs a column so it
        // arrives from the top or bottom. ⚠️ THE HUNTER HAS NO AXIS and arrives at
        // whichever edge cell is farthest from the player, so it never opens with
        // a free catch.
        // ═══════════════════════════════════════════════════════════════════
        // ⚠️⚠️ A NEW CREATURE THREATENS THE STUDENT IF NOTHING ELSE DOES
        // ═══════════════════════════════════════════════════════════════════
        //
        // Jake, 2026-09-10: *"Creatures are pretty much always spawning on the
        // same rows/columns, so you'll just have a train of Kaiju. I was able to
        // sit still for multiple turns without having to do anything. New
        // creatures should check to see if I'm in any danger and put me in danger
        // if I'm not. That way I have to keep moving."*
        //
        // ⭐ THE TRAIN AND THE SITTING STILL ARE THE SAME BUG. A uniformly random
        // lane is random about the BOARD and says nothing about the PLAYER, so it
        // happily stacks three kaiju into one row — a train — while leaving the
        // student's own row untouched for a minute. ⚠️ AND A TYPING GAME WHERE
        // STANDING STILL IS SAFE IS A TYPING GAME WITH AN IDLE STRATEGY.
        //
        // ⭐ SO THE LANE IS CHOSEN, NOT ROLLED: if nothing currently threatens
        // them, the new creature takes their row (kaiju) or column (spider). If
        // something already does, it takes a lane that is NOT already covered, so
        // the pressure spreads instead of piling into a train.
        // ⚠️ THIS NEVER SPAWNS ON TOP OF THEM — a creature enters at the edge and
        // still peeks for a step, so the student always has a turn to move.
        let spot;
        if (kind === 'kaiju') {
            const fromLeft = this.rand() < 0.5;
            spot = { x: fromLeft ? 0 : COLS - 1, dir: fromLeft ? 1 : -1,
                     y: this.laneFor('kaiju') };
        } else if (kind === 'spider') {
            const fromTop = this.rand() < 0.5;
            spot = { y: fromTop ? 0 : ROWS - 1, dir: fromTop ? 1 : -1,
                     x: this.laneFor('spider') };
        } else {
            // ⚠️ THE HUNTER NEEDS NO LANE RULE — it comes for the student by
            // definition. It still enters at the FARTHEST corner so it never
            // opens with a free catch.
            const corners = [{ x: 0, y: 0 }, { x: COLS - 1, y: 0 },
                             { x: 0, y: ROWS - 1 }, { x: COLS - 1, y: ROWS - 1 }];
            corners.sort((a, b) =>
                (Math.abs(b.x - this.player.x) + Math.abs(b.y - this.player.y)) -
                (Math.abs(a.x - this.player.x) + Math.abs(a.y - this.player.y)));
            spot = { x: corners[0].x, y: corners[0].y, dir: 1 };
        }

        const en = {
            kind, x: spot.x, y: spot.y, dir: spot.dir,
            facingLeft: spot.dir === -1,
            stunSteps: 0, peek: PEEK_STEPS, stepsIn: 0,
            bornStep: this.stepsTaken, wave: this.wave, dead: false,
        };
        this.enemies.push(en);
        this._lastSpawned = en;
        this.wave++;
        return { t: 'spawn', kind, x: en.x, y: en.y, wave: en.wave };
    }

    /**
     * Every word currently visible. ⚠️ INCLUDES THE TEAR-FREE WORD — a webbed
     * student typing a word that is also sitting in a neighbouring cell would
     * have two correct answers to one prompt.
     */
    wordsInUse() {
        const s = new Set();
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) if (this.grid[y][x]) s.add(this.grid[y][x]);
        }
        if (this.player.webWord) s.add(this.player.webWord);
        return s;
    }

    /**
     * A cell on the player's row or column, at least MIN_SPAWN_DISTANCE away and
     * not already occupied by an enemy.
     *
     * ⚠️ IT FALLS BACK TO THE FARTHEST ROW/COLUMN CELL RATHER THAN TO ANYWHERE ON
     * THE BOARD. If the row and column are crowded, spawning off-axis would
     * quietly restore the camping hole in exactly the situation where the player
     * is most boxed in — the case the rule exists for.
     */
    spawnSpot() {
        const p = this.player;
        const cands = [];
        for (let x = 0; x < COLS; x++) {
            if (Math.abs(x - p.x) >= MIN_SPAWN_DISTANCE) cands.push({ x, y: p.y });
        }
        for (let y = 0; y < ROWS; y++) {
            if (Math.abs(y - p.y) >= MIN_SPAWN_DISTANCE) cands.push({ x: p.x, y });
        }
        const free = cands.filter(c => !this.enemies.some(e => e.x === c.x && e.y === c.y));
        const list = free.length ? free : cands;
        if (!list.length) return null;
        return list[Math.floor(this.rand() * list.length)];
    }

    /**
     * Which round the board is in, 1-based. Shown to the student, because the
     * prototype showed it and a rising number is its own reward.
     */
    get round() {
        return this.wave;
    }

    /** The enemy standing on the player, if any. */
    caughtBy() {
        // ⚠️ A PEEKING CREATURE HAS NOT ENTERED THE BOARD AND CANNOT CATCH
        // ANYTHING, and a stuck one is held. ⚠️ THE STUCK CASE IS NOT KINDNESS —
        // it is what makes a webbed hunter approachable, which is the whole
        // extra-life tactic.
        return this.enemies.find(e => e.peek === 0 && e.stunSteps === 0
            && e.x === this.player.x && e.y === this.player.y) || null;
    }

    /**
     * Move the player to the cell farthest from any enemy.
     *
     * ⚠️ NOT TO A FIXED CENTRE. Dropping the player back onto a hunter's square
     * would spend two shields for one mistake, and the centre of a 6×5 board is
     * exactly where a converging swarm is.
     */
    respawn() {
        let best = { x: 2, y: 2 }, bestScore = -1;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                let s = Infinity;
                for (const e of this.enemies) s = Math.min(s, Math.abs(e.x - x) + Math.abs(e.y - y));
                if (s > bestScore) { bestScore = s; best = { x, y }; }
            }
        }
        this.player.x = best.x;
        this.player.y = best.y;
        this.player.webWord = null;
        this.typed = '';
        this.aim = null;
        this.grid[best.y][best.x] = '';
        this.refreshNeighbours();
    }
}
