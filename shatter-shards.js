// shatter-shards.js v1.2.0 — SHARDS. Round 116 (Sun).
//
// ⚠️ Round 117 (Corona): THE HEADER SAID v1.1.0 OVER A CONSTANT READING '1.2.0'.
// Corrected, no code change. The constant is what the build panel reports, so
// the header was the half that was wrong — the third time this file's siblings
// have recorded that exact drift (see arcade.html's own two).
//
// v1.1.0 — ⚠️⚠️ PANES NOW LEAVE. v1.0.0 punished slow typists for playing; see
//   the wandering-budget block below, which is the most important thing in this
//   file.
//
// ⭐⭐ THE SECOND CABINET. Jake, 2026-09-11: *"build shard, please. I want kids
// to have that option."* Shatter and Shards are the same game with two motion
// models, offered side by side so a class decides which one is better — which is
// a far better instrument than anything a harness can tell us about whether a
// game is fun.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ WHAT IS DIFFERENT, AND IT IS ONLY THIS
// ═══════════════════════════════════════════════════════════════════════════
//
// **Shatter:** panes converge on the prism. Each one is issued a `lifetimeMs` by
// the director, priced against the student's WPM gate, and that lifetime IS its
// journey. Pressure is TIME: every pane has a deadline.
//
// **Shards:** panes have free 2D velocity and WRAP at the edges of the field.
// Nothing arrives. Pressure is DENSITY: a pane you never type keeps going round
// until it happens to hit you, and until then it is in the way.
//
// ⚠️ EVERYTHING ELSE IS INHERITED, NOT COPIED — the split ladder, the lock rule,
// the re-lock rescue, the warp economy, the charge meter, the clear accounting.
// This class overrides FIVE methods. ⭐ THAT IS THE WHOLE DEFENCE AGAINST RULE 5
// FOR TWO LIVE BOARDS: a fix to how a word splits reaches both cabinets or
// neither, and there is no version of this repo where one of them is stale.
// ⚠️⚠️ IF YOU FIND YOURSELF COPYING A METHOD DOWN HERE TO CHANGE TWO LINES OF
// IT, STOP AND PUT A HOOK IN THE BASE INSTEAD. `_rank()` and `_placePiece()`
// exist because that was the right answer twice already.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⭐⭐ THE DIRECTOR'S LIFETIME BECOMES SPEED, AND THAT IS THE KEY DECISION
// ═══════════════════════════════════════════════════════════════════════════
//
// The obvious way to build a wrap board is to throw `lifetimeMs` away — nothing
// arrives, so what would a deadline mean? ⚠️ THAT WOULD ALSO THROW AWAY THE ONLY
// THING IN THIS APP THAT KNOWS HOW FAST THIS PARTICULAR CHILD TYPES.
// `game-shell.js` prices every lifetime against the student's gate, and the
// 990-trial corpus sweep is what established those numbers are humane.
//
// ⭐ SO A SHORT LIFETIME BECOMES A FAST PANE. A word the director thinks needs
// eight seconds drifts at the speed that crosses the field in eight seconds. The
// student's gate still sets the pace; it just no longer sets a deadline. A 15
// WPM child gets slow glass and a 40 WPM child gets fast glass, exactly as in
// Shatter.
//
// ⚠️ WHAT IS GENUINELY UNPROVEN IS SURVIVAL, and it is worth being plain about
// it: nobody has measured how long a slow student lasts under density. That is
// acceptable HERE and would not be in a lesson — Shards is arcade-only and
// grades nothing, so a child who dies in forty seconds still banks every second
// they typed, which is the only thing this game produces. ⭐ THE PACING
// GUARANTEE PROTECTS A GRADE, AND THERE IS NO GRADE HERE.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ PANES LEAVE, AND THE FIRST BUILD DID NOT LET THEM — WHICH PUNISHED
// EXACTLY THE CHILDREN THIS APP EXISTS FOR
// ═══════════════════════════════════════════════════════════════════════════
//
// v1.0.0 let a pane wrap forever until it was typed or hit someone. It looked
// right and `shatter-shards-test.mjs` Part H caught it in one line: **a slow
// typist was hit MORE OFTEN THAN A STUDENT WHO DID NOTHING AT ALL.** Over a
// three-minute run, twelve seeds:
//
//     doing nothing   10.5 hits
//     12 WPM          15.2 hits   ← playing is worse than not playing
//     30 WPM          10.3 hits
//     60 WPM           7.3 hits
//
// ⭐ THE CAUSE IS THE SPLIT LADDER MEETING A BOARD WITH NO EXIT. Clearing a word
// replaces one pane with two or three. In Shatter that is fine because every
// piece is still on a deadline and leaves; here nothing left, so a student who
// could type a word but not its pieces raised the density and then lived in it.
// ⚠️ THE GAME WAS CHARGING THEM FOR TRYING.
//
// ⭐ SO A PANE HAS A WANDERING BUDGET: it drifts for a few crossings and then
// sails out of the field. ⚠️ THAT IS NOT ARRIVAL COMING BACK — nothing lands,
// nothing is scored, and an expired pane is NOT a hit. It is the pressure-relief
// valve that "ignore it and it comes back" needs in order to be a choice rather
// than a sentence. ⚠️⚠️ AND THE BUDGET IS THE DIRECTOR'S `lifetimeMs` AGAIN, so
// the one number that knows how fast this child types governs both how fast the
// glass moves and how long it stays.
//
// ⚠️ DENSITY IS ALSO SELF-LIMITING FROM ABOVE. `GameDirector` decides when to
// spawn from how many targets are on screen, so a student who clears nothing
// stops being sent anything. The board does not need a cap of its own; that
// would be a second opinion about pressure sitting next to the director's.

import {
    ShatterBoard, SPAWN_R, SPLIT_MIN_R, WARP_PUSH, WARP_CLEARS, nextTargetId,
    MAX_SPLIT_DEPTH, MIN_RESPLIT_LEN,
} from './shatter-board.js';

export const SHATTER_SHARDS_VERSION = '1.2.0';

// ⚠️ THE FIELD IS A SQUARE THAT CONTAINS THE SPAWN RING, NOT THE RING ITSELF.
// Wrapping on a circle means a pane leaves and re-enters at the antipode, which
// looks like a teleport; wrapping on a box is what Asteroids does and what the
// eye reads as "the screen is a cylinder". 1.35 puts the edge comfortably
// outside the ring the view draws, so a pane crosses visible space before it
// wraps rather than blinking at the rim.
export const WRAP_EDGE = 1.35;

// How close a pane's centre gets to the prism before it counts as a hit.
// ⚠️ GENEROUS ON PURPOSE. In Shatter a pane arrives head-on and the student can
// see it coming down a known line; here it can cross from anywhere, so a tight
// radius would read as being hit by something that missed.
export const HIT_R = 0.10;

// A pane crosses the field in the time the director gave it. ⚠️ THE FIELD IS
// TWO SPAWN RADII WIDE, so this is the distance term in speed = distance / time.
const CROSSING = SPAWN_R * 2;

// How hard a warp shoves. ⚠️ EXPRESSED AS THE SAME DISTANCE Shatter's WARP_PUSH
// MOVES A PANE, delivered as velocity over one second rather than teleported —
// a pane that jumped 0.45 of the field would be somewhere else entirely and the
// student would lose track of the word they were typing.
const WARP_KICK = WARP_PUSH;

// How many field crossings a pane wanders before it leaves. ⚠️ MORE THAN ONE, OR
// this is Shatter with extra steps — the whole texture of this board is that a
// word you skip comes back at least once. ⚠️ AND NOT MANY MORE, or the relief
// valve is too slow to help the student who needs it.
export const WANDER_CROSSINGS = 2.5;

/**
 * Panes drift and wrap; nothing arrives.
 *
 * ⚠️ CONSTRUCTOR TAKES THE SAME OPTIONS AS ShatterBoard and adds none. A second
 * board with its own config shape would make `game-shatter.js` branch on which
 * one it has, and the view not knowing is the entire point of the seam.
 */
export class ShardsBoard extends ShatterBoard {

    /**
     * ⚠️ FIELD COORDINATES AND A DIRECTION, LIKE THE BASE. See ShatterBoard's
     * `place()` for why `dx, dy` exist at all — the origin is a singularity, and
     * a pane sitting exactly on the prism is the one the student is about to be
     * hit by.
     *
     * ⭐ `threat` IS NOT DISTANCE HERE, AND THIS IS WHERE THE SEAM EARNS ITSELF.
     * On the radial board, near equals dangerous, because everything is coming
     * straight at you. Here a pane can be close and leaving, or far and closing
     * fast. ⚠️ A VIEW THAT PAINTED "CLOSE" RED WOULD CRY WOLF at every pane that
     * happens to sail past, and a student would stop believing the colour.
     * So range is the base and closing speed raises it.
     */
    place(rock) {
        const m = Math.hypot(rock.x, rock.y);
        const dx = m < 1e-6 ? 0 : rock.x / m;
        const dy = m < 1e-6 ? -1 : rock.y / m;
        // Range term: 1 at the prism, 0 at the spawn ring and beyond.
        const range = Math.max(0, Math.min(1, 1 - m / SPAWN_R));
        // Closing term: how much of its velocity points at the prism, scaled by
        // how fast it is going relative to a nominal crossing.
        let closing = 0;
        if (m > 1e-6) {
            const speed = Math.hypot(rock.vx, rock.vy);
            if (speed > 1e-9) {
                const toward = -(rock.vx * dx + rock.vy * dy) / speed;
                closing = Math.max(0, toward);
            }
        }
        // ⚠️ RANGE DOMINATES. Closing only sharpens a pane that is already near;
        // a fast pane on the far side of the field is not yet a problem and must
        // not be painted as one.
        const threat = Math.max(0, Math.min(1, range * (0.72 + 0.28 * closing)));
        return { x: rock.x, y: rock.y, dx, dy, threat };
    }

    /**
     * ⚠️ THE LOCK RULE IS "NEAREST", NOT "MOST THREATENING". Inherited behaviour,
     * different arithmetic: the base ranks by `r` because that IS the distance.
     * ⭐ AND IT DELIBERATELY IGNORES `threat`'s closing term. Which pane a
     * keystroke goes to must be predictable enough to type against; a lock that
     * jumped because something else started closing would feel like the game
     * taking the keyboard away.
     */
    _rank(rock) { return Math.hypot(rock.x, rock.y); }

    spawn(text, lifetimeMs, nowMs) {
        const life = Math.max(1, lifetimeMs || 1);
        // ⚠️ ENTERS FROM A RANDOM EDGE, NOT FROM A RING. A ring spawn plus free
        // velocity is the radial board with extra steps; the point of wrap is
        // that the field has sides.
        const edge = Math.floor(this.rand() * 4);
        const across = (this.rand() * 2 - 1) * WRAP_EDGE;
        const x = edge === 0 ? -WRAP_EDGE : edge === 1 ? WRAP_EDGE : across;
        const y = edge === 2 ? -WRAP_EDGE : edge === 3 ? WRAP_EDGE : across;

        // ⭐ SPEED FROM THE DIRECTOR'S LIFETIME — see the header. Per millisecond,
        // and FIXED AT SPAWN for the same reason the base fixes `dr`: a speed
        // recomputed from current pressure would accelerate under the student's
        // own success, which is the ramp applied twice.
        const speed = CROSSING / life;

        // Heading: broadly across the field, but never aimed. ⚠️ AN AIMED PANE
        // IS A RADIAL PANE. The spread is wide enough that plenty of them will
        // miss on the first pass and come back, which is the whole texture of
        // this board.
        const toward = Math.atan2(-y, -x);
        const a = toward + (this.rand() - 0.5) * 1.7;

        const rock = {
            id: nextTargetId(),
            text: String(text || ''),
            typed: 0,
            x, y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            speed,
            depth: 0,
            // ⚠️ AN ABSOLUTE TIMESTAMP, NOT A COUNTDOWN. advance() is driven by
            // the view's clock and a paused game must not burn a pane's budget;
            // `_lastAt` already handles the gap, and a decrementing counter would
            // be a second clock to keep in step with it.
            leavesAt: nowMs + life * WANDER_CROSSINGS,
            terminal: false,
            parent: null,
        };
        this.rocks.push(rock);
        if (this._lastAt == null) this._lastAt = nowMs;
        return rock;
    }

    /**
     * ⚠️ RETURNS THE PANES THAT HIT THE PRISM, and they are already removed —
     * the same contract the base advertises, because the view accounts each one
     * to the director as a hit and a pane that stayed alive after hitting would
     * be charged every frame.
     *
     * ⭐ "ARRIVED" MEANS SOMETHING DIFFERENT AND THE VIEW NEVER FINDS OUT. On the
     * radial board it means a deadline expired; here it means a collision. The
     * view calls `advance()` and hits the student once per returned pane, which
     * is correct for both readings.
     */
    advance(nowMs) {
        if (this._lastAt == null) { this._lastAt = nowMs; return []; }
        const dt = Math.max(0, nowMs - this._lastAt);
        this._lastAt = nowMs;

        const hit = [];
        const alive = [];
        for (const rock of this.rocks) {
            rock.x += rock.vx * dt;
            rock.y += rock.vy * dt;
            // ⚠️ WRAP BEFORE THE HIT TEST. A pane that wrapped past the edge and
            // was tested at its pre-wrap position could register a hit on the
            // frame it teleported, which from the student's seat is being killed
            // by something off screen.
            if (rock.x < -WRAP_EDGE) rock.x += WRAP_EDGE * 2;
            else if (rock.x > WRAP_EDGE) rock.x -= WRAP_EDGE * 2;
            if (rock.y < -WRAP_EDGE) rock.y += WRAP_EDGE * 2;
            else if (rock.y > WRAP_EDGE) rock.y -= WRAP_EDGE * 2;

            if (Math.hypot(rock.x, rock.y) <= HIT_R) { hit.push(rock); continue; }
            // ⚠️⚠️ AN EXPIRED PANE IS NOT A HIT AND IS NOT RETURNED. It sails out
            // of the field: nothing lands, nothing is scored, nobody is charged.
            // Returning it would make the view account it to the director as a
            // hit and turn the relief valve into a punishment.
            if (rock.leavesAt != null && nowMs >= rock.leavesAt) continue;
            alive.push(rock);
        }
        this.rocks = alive;
        if (this.locked && !alive.includes(this.locked)) this.locked = null;
        return hit;
    }

    /**
     * ⭐⭐ PIECES ACTUALLY FLY APART, AND THIS IS THE BEST THING ABOUT THIS BOARD.
     * On the radial board they fan outward on a shared heading because they must
     * share the parent's lifetime — one journey, one speed. With free motion they
     * inherit the parent's velocity plus a kick, which is what breaking looks
     * like. ⚠️ It is also the one gameplay difference a student will feel rather
     * than merely see.
     *
     * ⚠️ PUSHED CLEAR OF THE PRISM FIRST, for the same reason SPLIT_MIN_R exists
     * on the base: a piece born on top of the student is a hit they had no
     * chance to avoid, and breaking a word must never be punished.
     */
    _placePiece(rock, text, i, n) {
        const m = Math.hypot(rock.x, rock.y);
        let x = rock.x, y = rock.y;
        if (m < SPLIT_MIN_R) {
            const dx = m < 1e-6 ? 0 : rock.x / m;
            const dy = m < 1e-6 ? -1 : rock.y / m;
            x = dx * SPLIT_MIN_R;
            y = dy * SPLIT_MIN_R;
        }
        // The kick is a fraction of the parent's own speed, so a fast pane
        // scatters harder. ⚠️ Not a constant: a fixed kick would dominate a slow
        // student's board and be invisible on a fast one.
        const spread = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2.0;
        const base = Math.atan2(rock.vy, rock.vx);
        const kick = rock.speed * 0.85;
        return {
            id: nextTargetId(),
            text, typed: 0,
            x, y,
            vx: rock.vx + Math.cos(base + spread) * kick,
            vy: rock.vy + Math.sin(base + spread) * kick,
            speed: rock.speed,
            depth: (rock.depth || 0) + 1,
            // ⚠️ PIECES INHERIT THE REMAINING BUDGET, THEY DO NOT GET A FRESH
            // ONE. A full budget per piece is precisely the bug this fixes: it
            // would mean breaking a word BOUGHT the student more clutter, for
            // longer, the slower they were.
            leavesAt: rock.leavesAt,
            // ⚠️ SAME RULE AS THE BASE — see MAX_SPLIT_DEPTH there. Two levels on
            // one board and one on the other would be two different games
            // wearing the same split ladder.
            terminal: (rock.depth || 0) + 1 >= MAX_SPLIT_DEPTH
                || text.length < MIN_RESPLIT_LEN,
            parent: rock.id,
        };
    }

    /**
     * ⚠️ THE WARP SHOVES AND DESTROYS NOTHING — the base's rule, unchanged, and
     * the reason it exists is unchanged too: a warp that cleared the board would
     * let a student bank typing time without typing.
     *
     * ⭐ HERE IT IS A VELOCITY KICK, NOT A TELEPORT. Moving every pane 0.45 of
     * the field instantly would put the word the student is halfway through
     * somewhere they have to find again. Shoving them outward lets the eye
     * follow.
     *
     * ⚠️ THE ECONOMY IS THE BASE'S. `canWarp`, `charge`, `warps` and the
     * "one warp spent, not the whole stack" rule are all inherited; only the
     * physics of the shove is here.
     */
    warp(nowMs) {
        if (!this.canWarp(nowMs)) return false;
        for (const rock of this.rocks) {
            const m = Math.hypot(rock.x, rock.y);
            const dx = m < 1e-6 ? 0 : rock.x / m;
            const dy = m < 1e-6 ? -1 : rock.y / m;
            rock.vx += dx * WARP_KICK;
            rock.vy += dy * WARP_KICK;
        }
        this.clearsSinceWarp -= WARP_CLEARS;
        return true;
    }

}
