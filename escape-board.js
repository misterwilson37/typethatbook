// escape-board.js v1.0.0 — ESCAPE KEY's BOARD, WITH NO CANVAS IN IT.
// Round 82 (Victor).
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

export const ESCAPE_BOARD_VERSION = '1.0.0';

export const COLS = 6;
export const ROWS = 5;

// Telegraphing distance. At 1 an enemy could appear adjacent and take a shield
// before the student has had a chance to read it, which is not pressure, it is a
// coin flip. At 2 they always get at least one enemy step of warning.
export const MIN_SPAWN_DISTANCE = 2;

// A zapped cell stays empty for this many enemy steps, and a web lasts this many.
// ⚠️ IN STEPS, NOT MILLISECONDS, so both scale with the student's gate exactly as
// the enemy cadence does. A duration in ms would have been a second difficulty
// knob that ignored the gate.
export const ZAP_STEPS = 3;
export const WEB_STEPS = 4;

// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ ROUNDS EXIST SO THE HUNTER IS REACHABLE. THE FIRST VERSION LOST HIM.
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake asked the right question again: *"the hunter bot does actually appear in
// escape key, right? Somehow Gemini lost the guy, and he should appear around
// round 5 or 6."*
//
// ⚠️ HE DID NOT. An earlier draft gated hunters on `pressure >= 1.25`, and pressure is
// DELIBERATELY FLAT AT 1.0 THROUGH AN ASSESSED RUN — a difficulty curve during a
// measurement would mean the grade depended on how far in the student got — and
// an assessed run ENDS at the quota. So the unlock was unreachable and the hunter
// only ever appeared in arcade. ⚠️ SAME BUG GEMINI HAD, REACHED BY A DIFFERENT
// ROUTE, AND MY OWN TEST MISSED IT BECAUSE IT ASSERTED THE MECHANISM (spawn one
// at pressure 1.6) RATHER THAN THE REACHABILITY (does one ever appear in play).
//
// ⭐ ROUNDS ARE STEPS, NOT SCORE AND NOT PRESSURE. A round is a fixed number of
// enemy steps, so it advances at the same wall-clock rate for every student and
// arrives in a graded run as well as an endless one. At a 15 WPM gate an enemy
// step is 3.2 s, so:
//
//     round 5 begins at step 24  ≈ 77 seconds
//     a 28-target mission is     ≈ 28 steps
//
// which puts the hunter in the last stretch of an assessed run — the climax of it
// — and about a minute and a quarter into arcade. That is Jake's "round 5 or 6".
//
// ⚠️ DO NOT RE-GATE THIS ON PRESSURE. Pressure answers "how hard", rounds answer
// "how far in", and the hunter is a how-far-in creature.
export const STEPS_PER_ROUND = 6;
export const HUNTER_ROUND = 5;

export const MAX_ENEMIES = 6;

// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ CREATURES LEAVE, AND WITHOUT THAT THE HUNTER STILL COULD NOT APPEAR.
// ═══════════════════════════════════════════════════════════════════════════
//
// Moving the hunter unlock onto rounds was necessary and not sufficient: the
// population cap at mission pressure is 2, enemies had NO lifetime, and so the
// board filled with the kaiju and spider drawn in round 1 and never had a free
// slot again. ⚠️ AT ROUND 5 THE UNLOCK OPENED ONTO A FULL BOARD AND NOTHING
// SPAWNED — zero hunters on 40 of 40 boards, with the unlock working perfectly.
//
// ⭐ SO CREATURES EXPIRE AND WALK OFF, which is what the prototype's kaiju and
// spider did and which I dropped in the extraction. It fixes the hunter, and it
// separately fixes "the board is the same two creatures for ten minutes" — a
// churning board reads alive, and a static one reads broken.
//
// ⚠️ IN ROUNDS, NOT MILLISECONDS, so it scales with the student's gate like
// everything else here.
export const ENEMY_LIFE_ROUNDS = 3;

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
        this.rand = c.rand || Math.random;

        this.player = { x: 2, y: 2, facingLeft: false, webWord: null };
        this.typed = '';
        this.aim = null;
        this.enemies = [];
        this.webs = [];
        this.stepsTaken = 0;
        this._hunterSeen = false;
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
    wordAvoiding(avoid) {
        if (!this.pool.length) return '';
        const taken = new Set((avoid || []).filter(Boolean).map(w => w[0]));
        for (let i = 0; i < 40; i++) {
            const w = this.pool[Math.floor(this.rand() * this.pool.length)];
            if (!taken.has(w[0])) return w;
        }
        const distinct = new Set(this.pool.map(w => w[0])).size;
        if (distinct <= 4) {
            console.warn(`[escape] only ${distinct} distinct first characters in the pool — ` +
                         'adjacent cells cannot all differ. Check this lesson\'s key set.');
        }
        return this.pool[Math.floor(this.rand() * this.pool.length)];
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

        let webbed = false;
        const wi = this.webs.findIndex(w => w.x === p.x && w.y === p.y);
        if (wi !== -1) {
            this.webs.splice(wi, 1);
            p.webWord = this.wordAvoiding([word]);
            webbed = true;
        }
        return { correct: true, kind: 'move', word, from, to: { x: p.x, y: p.y }, webbed };
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

        // ⚠️ CREATURES EXPIRE. See ENEMY_LIFE_ROUNDS — without this the board
        // fills in round 1 and the hunter's unlock opens onto a full board.
        // ⚠️ A STUNNED CREATURE STILL AGES. Otherwise webbing a hunter would
        // preserve it indefinitely, which is the opposite of the tactic's point.
        const life = ENEMY_LIFE_ROUNDS * STEPS_PER_ROUND;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const en = this.enemies[i];
            if (this.stepsTaken - (en.bornStep || 0) >= life) {
                this.enemies.splice(i, 1);
                events.push({ t: 'leave', kind: en.kind, x: en.x, y: en.y });
            }
        }

        for (const en of this.enemies) {
            if (en.stunSteps > 0) { en.stunSteps--; continue; }
            // ⚠️⚠️ A HUNTER STANDING IN A WEB DOES NOT MOVE, WHICH IS WHAT
            // `stunSteps` IS FOR. An earlier draft declared and decremented it and
            // NOTHING EVER SET IT — the prototype's web-stuns-hunter behaviour
            // was dropped during the extraction and the field left behind, which
            // is dead code that reads like a feature. Restoring it gives webs a
            // second role, makes the spider worth having on the board, and hands
            // the student a real tactic: lead the hunter across a web.
            //
            // ⚠️ CHECKED AT THE TOP OF ITS TURN, NOT AFTER IT MOVES. The first
            // attempt tested for a web underneath the enemy *after* movement, by
            // which time the hunter had already stepped off the web it was
            // standing on and was never caught by it.
            //
            // ⚠️ HUNTERS ONLY. A webbed kaiju stops being a lane threat, which is
            // the property the entire design rests on, and a webbed spider webs
            // itself into a corner.
            if (en.kind === 'hunter' && this.webs.some(w => w.x === en.x && w.y === en.y)) {
                en.stunSteps = WEB_STEPS;
                events.push({ t: 'stuck', x: en.x, y: en.y });
                continue;
            }
            if (en.kind === 'kaiju') {
                // ⚠️⚠️ IT TRAVELS ALONG THE AXIS IT SPAWNED ON. See the header:
                // the first draft spawned correctly on the player's row or column
                // and then walked every kaiju HORIZONTALLY, so one that arrived in
                // the player's column immediately walked out of it along its own
                // row and never came near them again. 36 of 40 campers survived
                // 200 enemy steps. The lane has to be a THREAT VECTOR, not a
                // start position — the creature comes down your lane at you, and
                // getting out of the lane is what costs a typed word.
                //
                // ⚠️⚠️ AND IT RE-ACQUIRES AT THE EDGE. The second draft fixed the
                // axis and campers STILL survived, because an enemy kept its
                // original aim forever: once the player respawned elsewhere, the
                // two enemies on the board patrolled a lane nobody was standing in
                // and the game went quiet. ⚠️ THAT WOULD HAVE HURT REAL PLAY TOO,
                // not just the camper — a board whose threats have lost you is a
                // board with nothing to escape from.
                // ⚠️ RE-ACQUIRES AT THE JUNCTION AS WELL AS AT THE EDGE. The
                // third draft only re-aimed on a bounce, and seed 19 found the
                // hole: a kaiju closing the player's column reached that column
                // mid-row, had no bounce to trigger a re-aim, and ran past the
                // junction — then back, then past again, patrolling row 0 forever
                // while the player sat in row 4. ⚠️ ONE CAMPER IN FORTY SURVIVED
                // ON THAT ALONE, which is the kind of margin that looks like noise
                // and is actually a rule with a gap in it.
                // Re-aiming at the junction keeps the creature a lane-runner that
                // TURNS at corners — readable, telegraphed — and keeps it distinct
                // from the hunter, which closes every single step.
                const arrived = en.axis === 'h' ? en.x === this.player.x : en.y === this.player.y;
                const bounced = en.axis === 'v'
                    ? (en.y + en.dir < 0 || en.y + en.dir > ROWS - 1)
                    : (en.x + en.dir < 0 || en.x + en.dir > COLS - 1);
                if (arrived || bounced) this.reacquire(en);
                if (en.axis === 'v') {
                    en.y = Math.max(0, Math.min(ROWS - 1, en.y + en.dir));
                    const by = en.y - en.dir;
                    if (by >= 0 && by < ROWS && !(en.x === this.player.x && by === this.player.y)) {
                        this.grid[by][en.x] = '';
                        this.zapped[by][en.x] = ZAP_STEPS;
                        events.push({ t: 'zap', x: en.x, y: by });
                    }
                } else {
                    en.x = Math.max(0, Math.min(COLS - 1, en.x + en.dir));
                    const bx = en.x - en.dir;
                    if (bx >= 0 && bx < COLS && !(bx === this.player.x && en.y === this.player.y)) {
                        this.grid[en.y][bx] = '';
                        this.zapped[en.y][bx] = ZAP_STEPS;
                        events.push({ t: 'zap', x: bx, y: en.y });
                    }
                }
            } else if (en.kind === 'spider') {
                // Re-aims every step, then drifts — a slower, less predictable
                // version of the same lane threat rather than a creature that
                // opts out of the design.
                this.reacquire(en);
                let dx = 0, dy = 0;
                if (this.rand() < 0.65) {
                    if (en.axis === 'v') dy = en.dir; else dx = en.dir;
                } else if (en.axis === 'v') {
                    dx = this.rand() < 0.5 ? 1 : -1;
                } else {
                    dy = this.rand() < 0.5 ? 1 : -1;
                }
                en.x = Math.max(0, Math.min(COLS - 1, en.x + dx));
                en.y = Math.max(0, Math.min(ROWS - 1, en.y + dy));
                if (this.rand() < 0.5 && !(en.x === this.player.x && en.y === this.player.y)) {
                    const ex = this.webs.find(w => w.x === en.x && w.y === en.y);
                    if (ex) ex.steps = WEB_STEPS;
                    else this.webs.push({ x: en.x, y: en.y, steps: WEB_STEPS });
                    events.push({ t: 'web', x: en.x, y: en.y });
                }
            } else {
                // Hunter: closes on the player one axis at a time.
                if (en.x !== this.player.x) en.x += this.player.x > en.x ? 1 : -1;
                else if (en.y !== this.player.y) en.y += this.player.y > en.y ? 1 : -1;
            }
        }

        const sp = this.maybeSpawn(pressure);
        if (sp) events.push(sp);
        if (this.caughtBy()) events.push({ t: 'caught' });
        return events;
    }

    /**
     * ⭐ SPAWN ON THE PLAYER'S ROW OR COLUMN. See the header block — this is the
     * rule that makes standing still unsafe and therefore makes typing the only
     * way to survive.
     */
    /**
     * Re-aim an enemy at the player's current lane.
     *
     * ⚠️ IT PICKS THE **NEARER** AXIS, so an enemy that is already almost in line
     * commits to that line instead of crossing the board. That keeps the threat
     * readable — a creature that visibly turns down your row is telegraphing —
     * and it is what stops an enemy patrolling a lane the player has left.
     */
    reacquire(en) {
        const dx = this.player.x - en.x;
        const dy = this.player.y - en.y;
        if (Math.abs(dy) <= Math.abs(dx)) {
            // Nearly on the player's row: get onto it, then run along it.
            if (dy !== 0) { en.axis = 'v'; en.dir = dy > 0 ? 1 : -1; }
            else { en.axis = 'h'; en.dir = dx >= 0 ? 1 : -1; }
        } else {
            if (dx !== 0) { en.axis = 'h'; en.dir = dx > 0 ? 1 : -1; }
            else { en.axis = 'v'; en.dir = dy >= 0 ? 1 : -1; }
        }
    }

    maybeSpawn(pressure) {
        const p = pressure == null ? 1 : pressure;
        // ⚠️ BASE POPULATION IS 2, NOT 1. The first draft's `1 + floor((p-1)/0.18)`
        // put exactly ONE enemy on the board through the whole mission phase
        // (pressure 1.0), which is both an empty-feeling game and half the reason
        // the camper survived. Two lane-walkers at gate pressure is the floor.
        const want = Math.min(MAX_ENEMIES, 2 + Math.floor((p - 1) / 0.18));
        if (this.enemies.length >= want) return null;
        // ⚠️ EVERY OTHER STEP, SO A FREED SLOT REFILLS PROMPTLY. At the previous
        // cadence a creature that expired left a hole the board took several
        // steps to notice, which read as a lull rather than a rhythm.
        if (this.stepsTaken % 2 !== 0) return null;

        const roll = this.rand();
        // ⚠️ THE HUNTER UNLOCK IS THE ROUND, NOT THE PRESSURE. See the header.
        //
        // ⚠️⚠️ AND THE **FIRST** HUNTER IS GUARANTEED, NOT ROLLED FOR. With a 30%
        // roll on a spawn slot that only frees every few steps, the first hunter
        // arrived around round 8 on 29 of 40 boards and never at all on the other
        // 11 — so "he shows up around round 5" was still false, just less
        // dramatically. Forcing the first one makes the unlock mean what it says;
        // every hunter after it is probabilistic.
        const dueHunter = this.round >= HUNTER_ROUND && !this._hunterSeen;
        const kind = dueHunter ? 'hunter'
                   : (this.round >= HUNTER_ROUND && roll < 0.3) ? 'hunter'
                   : roll < 0.6 ? 'kaiju' : 'spider';
        if (kind === 'hunter') this._hunterSeen = true;

        const spot = this.spawnSpot();
        if (!spot) return null;
        // ⭐ THE AXIS AND DIRECTION COME FROM THE SPAWN GEOMETRY, so the creature
        // travels down the player's lane toward where they were standing. This is
        // what makes the row/column rule a threat rather than a formality.
        const axis = spot.y === this.player.y ? 'h' : 'v';
        const dir = axis === 'h'
            ? (this.player.x >= spot.x ? 1 : -1)
            : (this.player.y >= spot.y ? 1 : -1);
        this.enemies.push({
            kind, x: spot.x, y: spot.y, stunSteps: 0, axis, dir,
            bornStep: this.stepsTaken,
        });
        return { t: 'spawn', kind, x: spot.x, y: spot.y, axis };
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
        return 1 + Math.floor(this.stepsTaken / STEPS_PER_ROUND);
    }

    /** The enemy standing on the player, if any. */
    caughtBy() {
        return this.enemies.find(e => e.x === this.player.x && e.y === this.player.y) || null;
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
