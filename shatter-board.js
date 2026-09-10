// shatter-board.js v1.1.0 — SHATTER'S BOARD, WITH NO CANVAS IN IT.
// Round 103, Round 109 (Bar-Let).
//
// v1.1.0 — ⭐ WARPS STACK TO THREE. Jake: *"That would both use up space and
//   encourage hoarding."* ⚠️ THE HOARDING IS THE MECHANIC — a single-charge meter
//   makes warping strictly correct the instant it fills, so there is nothing to
//   weigh; with a stack, spending one now costs the third one later.
//
// ⚠️⚠️ THE SPLIT IS THE MECHANIC, AND THE SPLIT IS WHY THIS FILE EXISTS BEFORE
// THE VIEW DOES. Jake, 2026-09-07, killing the sonar and campfire reskins:
// *"the subs won't split into smaller subs, so it really does just become a
// missile command clone with a different perspective. It's the splitting that
// makes it interesting."* And on the obvious version of splitting: *"I like the
// idea of splitting compound words into their component parts, but that will
// only work when they have lots of letters."*
//
// Both are right, and every interesting consequence of them is arithmetic rather
// than art — so it is testable, and `tests/shatter-board-test.mjs` tests it. Same
// split as escape-board.js, one game over.
//
// ⚠️ IT DOES NOT TOUCH THE DIRECTOR. The board reports what happened; the view
// accounts it to game-shell.js. If this file ever imports game-shell.js, the
// counting has two homes.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ SPLITTING COSTS THE STUDENT EXACTLY TWICE THE WORD, AND THE SHELL HAD
//      TO BE TOLD
// ═══════════════════════════════════════════════════════════════════════════
//
// A student types `unusually` (9 characters) to break the rock. It becomes
// `un` + `usual` + `ly` — which is 9 more characters, because the pieces spell
// the word. ⭐ **ONE SPAWNED TARGET COSTS 2N KEYSTROKES, ALWAYS**, for a
// two-part word and a three-part word alike, because the pieces concatenate
// back.
//
// ⚠️⚠️ THAT BREAKS THE SHELL'S CENTRAL GUARANTEE IF NOBODY SAYS SO. game-shell.js
// prices the push interval so that *work arrives at gate rate in characters*;
// a Shatter rock that arrived at `unusually`'s price would demand 30 WPM of a
// student on a 15 WPM gate — the same class of defect as §1's MISSION_PRESSURE
// = 0.75, which made every gate unreachable and would have failed every child
// in the building. It looks correct and it is off by a factor of two.
//
// ⭐ SO THE SHELL LEARNED `costFactor` (v1.6.0) AND SHATTER PASSES 2. The
// arithmetic stays in the one file that owns arithmetic; this file does not
// compute an interval, a velocity, a WPM or a score. It asks.
// ⚠️ DO NOT "FIX" A SHATTER PACING COMPLAINT HERE. If rocks arrive too fast, the
// wrong number is `costFactor` or the gate, and both live in game-shell.js.

import { SHATTER_WORDS } from './shatter-words.js';
import { BANKS } from './word-banks.js';
import { firstBlocked } from './drill-filter.js';

export const SHATTER_BOARD_VERSION = '1.1.0';

// ⚠️⚠️ THE NUMBER THE SHELL NEEDS. One target = the word, then its pieces.
// Pieces DO NOT SPLIT AGAIN (see `terminal` below), which is what pins this at
// exactly 2 rather than leaving it as "about 2, depending on the word".
export const SHATTER_COST_FACTOR = 2;

// Rocks live in normalised polar space: r = 1 at the spawn ring, r = 0 at the
// student. ⚠️ NO PIXELS IN THIS FILE. The view multiplies by whatever the canvas
// turned out to be, which is how the prototype's hardcoded 720×600 board — a
// stamp on a projector and cropped on a portrait iPad — cannot come back.
export const SPAWN_R = 1;
export const IMPACT_R = 0;

// ⚠️⚠️ ROCKS CONVERGE AND DO NOT WRAP, AND THAT IS A DESIGN RULE, NOT A PHYSICS
// SHORTCUT. HANDOFF-games.md §6: *"Rocks wrap forever, so clearing never clears
// and the pressure is a step function."* A wrapping rock means the board's
// population is decided by how long the student has been alive rather than by
// the director's pressure, so the difficulty curve the shell computes is not the
// difficulty curve the student feels. Every rock here ends one of two ways:
// typed out, or it reaches the student and costs a shield.

// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ THE PIECES GET A FLOOR ON THEIR REMAINING JOURNEY
// ═══════════════════════════════════════════════════════════════════════════
//
// The natural rule is that a rock has ONE journey — priced at 2N characters —
// and the split neither resets nor extends it. A student who broke the parent
// quickly has lots of runway for the pieces; a slow one has little. That is
// exactly the gate, expressed as geometry, and it is the rule.
//
// ⚠️ WITH ONE FLOOR, BECAUSE THE LAST INSTANT OF A JOURNEY IS NOT A GAME. A rock
// broken at r = 0.02 would scatter three pieces that are unavoidably on top of
// the student, and no amount of typing speed helps — the student is punished for
// clearing the parent, which inverts the mechanic. Pieces therefore start at
// least this far out.
//
// ⚠️ THIS ONLY EVER LENGTHENS A JOURNEY, NEVER SHORTENS ONE, so every
// clearability claim in the harness still holds — more runway is strictly
// easier. That one-way property is what makes it safe.
export const SPLIT_MIN_R = 0.30;

// How far apart the pieces fan, in radians, total across the group.
export const SPLIT_SPREAD = 0.55;

// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THE WARP IS EARNED, AND ITS KEY IS THE ROUND 101 RULING ONE LEVEL DOWN
// ═══════════════════════════════════════════════════════════════════════════
//
// HANDOFF-games.md §6: *"Free unlimited spacebar warp means the prototype is
// beaten without typing at all — warp goes on a charge meter earned by clearing
// words."* So the meter.
//
// ⚠️⚠️ AND THEN THE KEY ITSELF IS A TRAP, WHICH ROUND 101 ALREADY WALKED INTO
// FROM THE OTHER SIDE. Jake, on Deadline: *"I don't want spaces at the end of
// words to count against me, as it's the logical key to hit."* The space after a
// finished word is not a decision — it is the habit every lesson in School has
// spent months building. Deadline had to stop *charging* for that space. Shatter
// would be *spending a full warp meter* on it, which is worse: the student is
// punished for typing correctly, and the punishment is invisible.
//
// ⭐ SO A WARP NEEDS ALL THREE, AND EACH ONE CLOSES A DIFFERENT HOLE:
//   1. the meter is full          — the earned-not-free rule;
//   2. nothing is half-typed      — the Round 101 test, verbatim: "is a word
//                                   half-typed", not "is this key a space";
//   3. WARP_GRACE_MS since the last rock broke — the habit space, which arrives
//                                   AFTER the lock has already cleared and so
//                                   sails through rule 2.
// ⚠️ RULE 3 IS THE ONE THAT LOOKS OPTIONAL AND IS NOT. Without it, every warp a
// student ever earns is spent by reflex on the word that earned it.
export const WARP_CLEARS = 8;
export const WARP_GRACE_MS = 400;

// ⭐⭐ WARPS STACK, UP TO THREE. Jake, 2026-09-09: *"Perhaps you can charge up to
// 3 warps if you don't use them often. That would both use up space and
// encourage hoarding."*
//
// ⚠️ THE HOARDING IS THE MECHANIC, NOT A SIDE EFFECT. A single-charge meter makes
// warping strictly correct the instant it fills — there is nothing to weigh. With
// a stack, spending one now costs the third one later, so the student is making a
// judgement about a board they can see, which is the only kind of decision worth
// putting in a typing game.
// ⚠️ AND IT IS CAPPED. Uncapped charges would let a patient student bank twenty
// and then be untouchable for a minute, which removes the pressure the whole
// game is built to apply.
export const MAX_WARPS = 3;

// What a warp buys: every rock is shoved back out toward the spawn ring.
// ⚠️ IT DESTROYS NOTHING. A warp that cleared the board would be a second way to
// clear a rock that costs no keystrokes, and `clearedChars` — the quota, the
// grade, the score — would stop being a count of typing.
export const WARP_PUSH = 0.45;

// ═════════════════════════════════════════════════════════════════════════════
// THE SPLIT LADDER
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THE SPLIT MUST BE READABLE AND SHORTER, NOT MEANINGFUL. That is the whole
// resolution of Jake's two objections, and it is what lets EVERY lesson get the
// escalating swarm instead of only Unit 7. A Unit 1 student shatters `asdfjk`
// into `asd` and `fjk` — the same drill, twice, under more pressure. A Unit 7
// student shatters `unusually` into `un|usual|ly` and learns syllable chunking as
// a survival reflex, which is the actual skill that stops letter-by-letter
// typing. ⭐ The split gets more meaningful as the student advances rather than
// only working at the top.
//
// The ladder, in order, first rung that answers wins:
//   1. morphemes  — shatter-words.js, 300 words judged by a model against a
//                   CLOSED list of what is actually in the TTB library
//   2. compound   — both halves are real words in word-banks.js
//   3. halves     — split near the middle
//   4. characters — for anything too short to halve meaningfully
//
// ⚠️ RUNGS 1 AND 2 ARE LOOKUPS, NEVER ALGORITHMS. Mechanical affix-stripping
// produces confident nonsense — `de+liver+ed`, `de+sir+ous`, `de+bat+ing` — and
// **no algorithm can tell those from `un+fold+ed` without knowing meaning.**
// That is the entire reason shatter-words.js was generated by a classifier
// judging a closed list rather than by a rule. Do not add a rule here.

const MORPHEMES = new Map();
for (const e of SHATTER_WORDS) {
    // ⚠️ VERIFY, DO NOT TRUST. rejoin-shatter.py already proved the parts spell
    // the word, but this file is one bad regenerate away from silently splitting
    // a word into pieces that do not rebuild it — which on screen is a rock that
    // cannot be cleared. A failed check drops to the next rung; it never repairs.
    if (e.p.join('') === e.w) MORPHEMES.set(e.w, e.p.slice());
}

const LEXICON = new Set();
for (const k of Object.keys(BANKS)) for (const e of BANKS[k]) LEXICON.add(e.w);

/** Shortest half of a compound worth calling a word. `at`+`tend` is not one. */
export const MIN_COMPOUND_PART = 3;

/**
 * Break one target into the rocks it becomes.
 *
 * @param {string} text
 * @returns {string[]} pieces that CONCATENATE BACK TO `text`, or `[]` if it
 *          cannot be split (a single character).
 *
 * ⚠️⚠️ THE PIECES ALWAYS SPELL THE WORD, INCLUDING ITS CASE. The lookups are
 * lowercase, but a piece is taken by SLICING THE INPUT at the lengths the lookup
 * gave — never by returning the stored string. A student who typed `SUPERNOVA`
 * gets `SU|PER|NO|VA` rather than four lowercase rocks they would have to type
 * differently from the word that produced them.
 *
 * ⚠️ IT NEVER RETURNS A ONE-PIECE ARRAY. A rock that "split" into itself would
 * be typed twice for one target with no visible reason, which reads as the game
 * refusing to accept a correct word.
 */
export function splitTarget(text) {
    const s = String(text || '');
    if (s.length < 2) return [];

    const lower = s.toLowerCase();

    // ── rung 1: morphemes ───────────────────────────────────────────────────
    const parts = MORPHEMES.get(lower);
    if (parts && parts.length >= 2) {
        const out = clean(sliceByLengths(s, parts.map(p => p.length)));
        if (out) return out;
    }

    // ── rung 2: compound ────────────────────────────────────────────────────
    // ⚠️ LONGEST FIRST HALF WINS, and it matters: `something` splits at `some`
    // rather than at `so`, because `so` is in no bank but a shorter-first scan
    // over a bigger lexicon would find `son`+`something`-minus-`son` nonsense.
    if (s.length >= MIN_COMPOUND_PART * 2) {
        for (let cut = s.length - MIN_COMPOUND_PART; cut >= MIN_COMPOUND_PART; cut--) {
            if (LEXICON.has(lower.slice(0, cut)) && LEXICON.has(lower.slice(cut))) {
                const out = clean([s.slice(0, cut), s.slice(cut)]);
                if (out) return out;
            }
        }
    }

    // ── rung 3: halves ──────────────────────────────────────────────────────
    // ⚠️ CEIL, SO THE FIRST PIECE IS NEVER THE SHORT ONE. `asd` → `as`+`d`, and
    // reading left to right the student meets the bigger job first, while they
    // still have the most runway. It also makes `asdfjk` → `asd`+`fjk`, which is
    // the example in HANDOFF-games.md §6 and the one a Unit 1 student sees.
    if (s.length >= 3) {
        const cut = Math.ceil(s.length / 2);
        const out = clean([s.slice(0, cut), s.slice(cut)]);
        if (out) return out;
        // ⚠️ THE MIDPOINT CAN BE THE ONE BAD CUT. Walk outward from it rather
        // than dropping straight to characters, which would turn one unlucky
        // word into a completely different-feeling rock.
        for (let off = 1; off < s.length - 1; off++) {
            for (const c of [cut - off, cut + off]) {
                if (c < 1 || c >= s.length) continue;
                const alt = clean([s.slice(0, c), s.slice(c)]);
                if (alt) return alt;
            }
        }
    }

    // ── rung 4: characters ──────────────────────────────────────────────────
    // ⚠️ ALWAYS SAFE, WHICH IS WHY IT IS THE LAST RUNG. A single character
    // cannot be a blocked group, so this rung can never be refused and the
    // ladder can never fall off the bottom.
    return s.split('');
}

/**
 * ⚠️⚠️ SPLITTING IS A NEW WAY TO MAKE A SHORT STRING OUT OF A SAFE LONG ONE,
 * AND drill-filter.js NEVER SAW THE SHORT ONE.
 *
 * `reassuringly` is a perfectly good library word. Its morphemes are
 * `re | assuring | ly` — and `assuring` trips `LEADING`, so the split would have
 * put that piece on a classroom screen in a font sized for a projector. The word
 * passed every filter this app has, because every filter this app has looked at
 * the word.
 *
 * ⭐ SO EVERY RUNG IS SCREENED, AND A REFUSED RUNG FALLS TO THE NEXT ONE rather
 * than being repaired. Repairing would mean this file deciding what a morpheme
 * is, which is the one thing shatter-words.js exists because no algorithm can do.
 *
 * @returns {string[]|null} the pieces, or null if any piece is blocked.
 */
function clean(parts) {
    if (!parts || parts.length < 2) return null;
    for (const p of parts) if (firstBlocked(p)) return null;
    return parts;
}

/** @returns {string[]|null} null if the lengths do not account for the word. */
function sliceByLengths(s, lens) {
    let at = 0;
    const out = [];
    for (const n of lens) {
        if (n <= 0) return null;
        out.push(s.slice(at, at + n));
        at += n;
    }
    return at === s.length && out.length >= 2 ? out : null;
}

/**
 * Is this target worth spawning as a Shatter rock at all?
 *
 * ⚠️ A ONE-CHARACTER TARGET IS NOT. It cannot split, so it is a Deadline word in
 * a Shatter costume — the student pays the 2× interval `costFactor` bought and
 * gets half the game. The view filters the pool through this rather than
 * discovering it on screen.
 */
export function splittable(text) {
    return splitTarget(text).length >= 2;
}

// ═════════════════════════════════════════════════════════════════════════════
// THE BOARD
// ═════════════════════════════════════════════════════════════════════════════

let NEXT_ID = 1;

export class ShatterBoard {
    /**
     * @param {object} o
     *   rand {function}  injected, so a failing board is reproducible. ⚠️ An
     *                    earlier draft of game-deadline.js used Math.random() for
     *                    lane positions and a lane sequence could not be
     *                    reproduced in a harness — the one thing that makes an
     *                    "it only happens sometimes" report investigable.
     */
    constructor(o) {
        const c = o || {};
        this.rand = c.rand || Math.random;
        this.rocks = [];
        this.locked = null;
        this.clearsSinceWarp = 0;
        this.lastClearAt = -Infinity;
        this._lastAt = null;
    }

    // ── population ──────────────────────────────────────────────────────────

    /**
     * Put one target on the ring.
     * @param {string} text
     * @param {number} lifetimeMs  the WHOLE journey, from the director, already
     *                             priced for the word AND its pieces.
     */
    spawn(text, lifetimeMs, nowMs) {
        const life = Math.max(1, lifetimeMs || 1);
        const rock = {
            id: NEXT_ID++,
            text: String(text || ''),
            typed: 0,
            r: SPAWN_R,
            angle: this.rand() * Math.PI * 2,
            // ⚠️ SPEED IS PER MILLISECOND AND IS FIXED AT SPAWN. A rock whose
            // speed were recomputed from the director's current pressure each
            // frame would ACCELERATE under a student's own success, which is the
            // ramp applied twice.
            dr: SPAWN_R / life,
            terminal: false,
            parent: null,
        };
        this.rocks.push(rock);
        if (this._lastAt == null) this._lastAt = nowMs;
        return rock;
    }

    /**
     * Advance every rock toward the student.
     * @returns {object[]} the rocks that arrived this step. ⚠️ THEY ARE ALREADY
     *          REMOVED FROM THE BOARD. The view accounts each one to the
     *          director as a hit; a rock that stayed alive after arriving would
     *          be charged every frame.
     */
    advance(nowMs) {
        if (this._lastAt == null) { this._lastAt = nowMs; return []; }
        const dt = Math.max(0, nowMs - this._lastAt);
        this._lastAt = nowMs;

        const arrived = [];
        const alive = [];
        for (const rock of this.rocks) {
            rock.r -= rock.dr * dt;
            if (rock.r <= IMPACT_R) { rock.r = IMPACT_R; arrived.push(rock); }
            else alive.push(rock);
        }
        this.rocks = alive;
        if (this.locked && !alive.includes(this.locked)) this.locked = null;
        return arrived;
    }

    // ── typing ──────────────────────────────────────────────────────────────

    /**
     * The rock a key should go to.
     *
     * ⚠️ NEAREST TO IMPACT WHOSE NEXT CHARACTER MATCHES — the same auto-lock rule
     * game-deadline.js uses, and it is here for the reason the uniqueness rule in
     * escape-board.js exists one board over: **two rocks whose first characters
     * agree must not make the board unchoosable.** Escape Key could enforce
     * distinct first characters because it only ever offers four cells; Shatter
     * cannot, because a split can drop three pieces onto a board that already
     * holds someone else's word. So the tie is RESOLVED rather than prevented,
     * and resolving it toward the nearest rock is also the advice the student
     * should be following anyway.
     */
    aimFor(ch) {
        let best = null;
        for (const rock of this.rocks) {
            if (rock.text[rock.typed] !== ch) continue;
            if (!best || rock.r < best.r) best = rock;
        }
        return best;
    }

    /**
     * Account one keystroke.
     *
     * @returns {object} { correct, ignored, cleared, pieces }
     *   correct  the view passes this straight to d.keyResult()
     *   ignored  ⚠️ NOT THE SAME AS CORRECT. A space at a word boundary is
     *            neither right nor wrong and must reach the director as NEITHER
     *            — `keyResult(true)` there would let a student inflate accuracy
     *            by tapping space, which is the exact hole Round 101 closed on
     *            Deadline from the other side.
     *   cleared  the rock's text, if this key finished it
     *   pieces   the rocks it became — already on the board
     *
     * ⚠️ A KEYSTROKE THAT MATCHES NO ROCK IS A MISTAKE, NOT A NO-OP. The
     * prototypes all dropped unmatched keys on the floor, which meant a student
     * could mash for a minute at 100% accuracy.
     */
    tryKey(ch, nowMs) {
        const miss = { correct: false, ignored: false, cleared: null, pieces: [] };

        // ⚠️ THE TEST IS "IS A WORD HALF-TYPED", NOT "IS THIS KEY A SPACE".
        // A space a rock genuinely wants never reaches this guard, and a space
        // where a letter was wanted is how a child types "th e cat".
        if (ch === ' ') {
            const wants = this.locked && this.locked.text[this.locked.typed] === ' ';
            if (!wants) return { correct: false, ignored: true, cleared: null, pieces: [] };
        }

        if (this.locked && this.rocks.includes(this.locked)
            && this.locked.text[this.locked.typed] === ch) {
            return this._accept(this.locked, nowMs);
        }

        // ⚠️⚠️ THE RE-LOCK, AND IT IS A FAIRNESS FIX THE HARNESS FOUND, NOT A
        // NICETY. `unusually` shatters into `un | usual | ly`, and TWO OF THOSE
        // THREE PIECES START WITH `u` — at the same distance, because they were
        // born from one rock in one instant. So nearest-to-impact cannot break
        // the tie, the lock goes to `un`, and a student who meant `usual` types
        // `u` `s` and is charged a mistake for the game's ambiguity.
        //
        // ⚠️ ESCAPE KEY PREVENTS THIS AND SHATTER CANNOT. escape-board.js
        // enforces distinct first characters across the four cells it offers;
        // here the pieces come from English morphology and there is nothing to
        // enforce. So the tie is UNDONE AFTER THE FACT instead: if the keys
        // already spent on the lock, plus this one, are the opening of some
        // other rock, the student meant that rock and always did.
        //
        // ⚠️ IT CANNOT INFLATE ANYTHING. The transferred keystrokes were already
        // counted once, and they are the same characters the new rock needed —
        // the student still pays full price for every rock they clear.
        // ⚠️ AND IT ONLY EVER RESCUES A MISTAKE THAT WAS ABOUT TO BE CHARGED, so
        // it can never turn a correct key into a wrong one.
        if (this.locked && this.rocks.includes(this.locked) && this.locked.typed > 0) {
            const prefix = this.locked.text.slice(0, this.locked.typed) + ch;
            let alt = null;
            for (const rock of this.rocks) {
                if (rock === this.locked || rock.typed !== 0) continue;
                if (!rock.text.startsWith(prefix)) continue;
                if (!alt || rock.r < alt.r) alt = rock;
            }
            if (alt) {
                this.locked.typed = 0;
                alt.typed = prefix.length - 1;
                this.locked = alt;
                return this._accept(alt, nowMs);
            }
        }

        // ⭐ ABANDONING A LOCK IS FREE, AND THIS IS THE ESCAPE RULING ONE LEVEL
        // DOWN — a student who correctly decides the rock about to land on them
        // matters more than the one they started is making a tactical decision,
        // not a mistake. The partial progress on the abandoned rock is kept, not
        // reset: they may come back to it.
        const next = this.aimFor(ch);
        if (!next) { this.locked = null; return miss; }
        this.locked = next;
        return this._accept(next, nowMs);
    }

    _accept(rock, nowMs) {
        rock.typed++;
        if (rock.typed < rock.text.length) {
            return { correct: true, ignored: false, cleared: null, pieces: [] };
        }
        const text = rock.text;
        const pieces = this._break(rock, nowMs);
        return { correct: true, ignored: false, cleared: text, pieces };
    }

    /**
     * A rock was typed out. It becomes its pieces — or nothing, if it was one.
     *
     * ⚠️⚠️ PIECES ARE `terminal` AND DO NOT SPLIT AGAIN. That is what fixes the
     * cost of a target at exactly 2N and lets `SHATTER_COST_FACTOR` be a constant
     * rather than a per-word estimate. A recursive split would price a
     * three-part word differently from a two-part one and the director would be
     * pacing against a number nobody could state.
     */
    _break(rock, nowMs) {
        this.rocks = this.rocks.filter(r => r !== rock);
        if (this.locked === rock) this.locked = null;
        // ⚠️ CAPPED AT THE STACK, or a long clean run banks charge that can never
        // be spent and the meter stops meaning anything.
        this.clearsSinceWarp = Math.min(MAX_WARPS * WARP_CLEARS, this.clearsSinceWarp + 1);
        this.lastClearAt = nowMs;

        if (rock.terminal) return [];
        const parts = splitTarget(rock.text);
        if (parts.length < 2) return [];

        // ⚠️ THE FLOOR ONLY EVER PUSHES PIECES OUTWARD. See SPLIT_MIN_R.
        const r = Math.max(rock.r, SPLIT_MIN_R);
        const spread = SPLIT_SPREAD;
        const pieces = [];
        for (let i = 0; i < parts.length; i++) {
            const off = parts.length === 1 ? 0
                : (i / (parts.length - 1) - 0.5) * spread;
            const piece = {
                id: NEXT_ID++,
                text: parts[i],
                typed: 0,
                r,
                angle: rock.angle + off,
                dr: rock.dr,   // ⚠️ ONE JOURNEY, ONE SPEED. See the header.
                terminal: true,
                parent: rock.id,
            };
            this.rocks.push(piece);
            pieces.push(piece);
        }
        return pieces;
    }

    // ── the warp ────────────────────────────────────────────────────────────

    /** How many whole warps are banked, 0..MAX_WARPS. */
    get warps() {
        return Math.min(MAX_WARPS, Math.floor(this.clearsSinceWarp / WARP_CLEARS));
    }

    /**
     * 0..1 toward the NEXT warp — the partial bar above the banked pips.
     * ⚠️ IT READS 1 WHEN THE STACK IS FULL, so the panel shows a filled bar
     * rather than a bar that resets to empty at the moment the student has the
     * most power. A meter that empties on success reads as a penalty.
     */
    get charge() {
        if (this.warps >= MAX_WARPS) return 1;
        return (this.clearsSinceWarp % WARP_CLEARS) / WARP_CLEARS;
    }

    /** All three conditions. Each closes a different hole; see the header. */
    canWarp(nowMs) {
        if (this.warps < 1) return false;
        if (this.locked && this.locked.typed > 0) return false;
        if (nowMs - this.lastClearAt < WARP_GRACE_MS) return false;
        return true;
    }

    /**
     * @returns {boolean} whether it fired. ⚠️ A REFUSED WARP IS SILENT AND COSTS
     * NOTHING — it is not a mistake, because the student pressed the key the
     * game told them to press.
     */
    warp(nowMs) {
        if (!this.canWarp(nowMs)) return false;
        for (const rock of this.rocks) {
            rock.r = Math.min(SPAWN_R, rock.r + WARP_PUSH);
        }
        // ⚠️ ONE WARP IS SPENT, NOT THE WHOLE STACK. Zeroing the counter would
        // throw away the other two the student deliberately saved, which is the
        // opposite of what hoarding is supposed to buy them.
        this.clearsSinceWarp -= WARP_CLEARS;
        return true;
    }

    /** For the view's tear-down. */
    destroy() { this.rocks = []; this.locked = null; }
}
