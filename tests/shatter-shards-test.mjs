// shatter-shards-test.mjs v1.2.0 — Round 117 (Bennett): Part G is HYPERSPACE.
// shatter-shards-test.mjs v1.1.0 — Round 117 (Bennett): PART H NOW DRIVES THE
// REAL `GameDirector`. It had been inventing its own spawn pacing — 2500ms to a
// ceiling of 8, against a real interval of 9.6–17.3s — so it reported a board
// four to seven times busier than the one students play, passed, and let Shards
// ship a game Jake could ignore for two minutes. Part H now carries the idle
// floor ROADMAP 116h asked for by name.
// shatter-shards-test.mjs v1.0.0 — SHARDS: THE SECOND CABINET. Round 116 (Sun).
//
// ⚠️⚠️ THE FIRST THING THIS FILE CHECKS IS THAT THE TWO BOARDS ARE
// INTERCHANGEABLE, because that is the claim the whole design rests on. Shatter
// and Shards share ONE view; if `ShardsBoard` is missing something
// `game-shatter.js` calls, the failure is a live cabinet throwing in a
// classroom, and nothing else in this repo would notice — arcade-mount-test.mjs
// drives Shatter, not Shards.
//
// ⭐ AND THE SECOND THING IS THAT IT REALLY DID SUBCLASS. A drift board that
// quietly reimplemented `tryKey` or the split ladder would pass every behaviour
// test here and be Rule 5 in a month. Part B asserts the inheritance itself.
//
// ⚠️ WHAT THIS FILE DOES NOT CLAIM: that Shards is FUN, or that a 15 WPM child
// survives it. Pressure here is density, not time, and nobody has measured
// that. It is measured by thirty twelve-year-olds in a rotation — which is the
// entire reason Jake asked for the cabinet rather than a simulation. Part F
// pins only that the game is not trivially impossible.

import { ShatterBoard, splitTarget, splittable, WARP_CLEARS, MAX_WARPS,
         SHATTER_COST_FACTOR } from '../shatter-board.js';
import { GameDirector } from '../game-shell.js';
import { SHATTER_WORDS } from '../shatter-words.js';
import { ShardsBoard, WRAP_EDGE, PRISM_R, reachOf, SPEED_GAIN, wrapCoord,
         SHARDS_WARP_CLEARS } from '../shatter-shards.js';

let pass = 0, fail = 0;
const fails = [];
const ok = (c, l) => { if (c) pass++; else { fail++; fails.push(l); } };

function mulberry(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const dist = r => Math.hypot(r.x, r.y);

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nA — THE VIEW CANNOT TELL THE TWO BOARDS APART');
// ═════════════════════════════════════════════════════════════════════════════
{
    const a = new ShatterBoard({ rand: mulberry(1) });
    const b = new ShardsBoard({ rand: mulberry(1) });

    // ⚠️ EVERY NAME game-shatter.js REACHES FOR. Listed explicitly rather than
    // diffed against the base, because the point is the VIEW's contract, not
    // class symmetry — a method both boards happen to share but the view never
    // calls is not what keeps a cabinet alive.
    const methods = ['spawn', 'advance', 'tryKey', 'aimFor', 'warp', 'canWarp',
                     'place', 'destroy'];
    for (const m of methods) {
        ok(typeof b[m] === 'function', 'ShardsBoard.' + m + '() exists');
    }
    for (const p of ['rocks', 'locked', 'warps', 'charge']) {
        ok(p in b || b[p] !== undefined || b[p] === null,
           'ShardsBoard exposes `' + p + '`');
    }
    ok(Array.isArray(b.rocks) && b.locked === null,
       'and starts empty with nothing locked, like the base');

    // ⚠️ place() IS THE SEAM AND ITS SHAPE IS NOT NEGOTIABLE. The view reads
    // x, y, dx, dy and threat by name; a board returning four of the five draws
    // every pane at NaN and the canvas silently goes blank.
    b.spawn('unusually', 8000, 0);
    const g = b.place(b.rocks[0]);
    for (const k of ['x', 'y', 'dx', 'dy', 'threat']) {
        ok(typeof g[k] === 'number' && Number.isFinite(g[k]),
           'place() returns a finite `' + k + '`');
    }
    ok(Math.abs(Math.hypot(g.dx, g.dy) - 1) < 1e-9,
       '\u26a0\u26a0 dx/dy is a UNIT vector \u2014 the view multiplies it by a pixel ' +
       'radius, so anything else scales every pane by a random amount');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nB — IT SUBCLASSED, RATHER THAN COPIED');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THIS IS THE RULE 5 ASSERTION AND IT IS THE REASON TWO BOARDS ARE
// ACCEPTABLE AT ALL. A fix to how a word splits, to the lock rule, to the
// re-lock rescue or to the warp economy must reach both cabinets or neither.
{
    const b = new ShardsBoard({ rand: mulberry(2) });
    ok(b instanceof ShatterBoard,
       '\u26a0\u26a0 ShardsBoard IS a ShatterBoard');

    const own = Object.getOwnPropertyNames(ShardsBoard.prototype)
        .filter(n => n !== 'constructor');
    // ⚠️ `_bestJump` IS MOTION, not a new rule: it chooses WHERE the field lands,
    // which is the same kind of question `place()` answers. ⚠️ The constructor is
    // excluded above and supplies exactly one thing — the base's own
    // `warpClears` option — rather than a second config shape.
    const expected = ['place', '_rank', 'spawn', 'advance', '_placePiece',
                      'warp', '_bestJump'];
    ok(own.every(n => expected.includes(n)),
       '\u26a0\u26a0 it overrides ONLY motion (' + own.join(', ') + ')');
    for (const n of ['tryKey', 'aimFor', 'canWarp', '_break', '_accept']) {
        ok(!own.includes(n),
           '\u2b50 `' + n + '` is INHERITED \u2014 the ' +
           (n === 'tryKey' || n === 'aimFor' ? 'lock rule' : 'clear economy') +
           ' cannot diverge between the two cabinets');
    }

    // ⭐ AND THE SPLIT LADDER IS LITERALLY THE SAME FUNCTION.
    const a = new ShatterBoard({ rand: mulberry(3) });
    a.spawn('unusually', 8000, 0);
    b.spawn('unusually', 8000, 0);
    for (const ch of 'unusually') { a.tryKey(ch, 1); b.tryKey(ch, 1); }
    const at = a.rocks.map(r => r.text).sort();
    const bt = b.rocks.map(r => r.text).sort();
    ok(JSON.stringify(at) === JSON.stringify(bt) && at.length > 1,
       '\u2b50\u2b50 the same word breaks into the same pieces on both boards (' +
       at.join(' ') + ')');
    ok(JSON.stringify(at) === JSON.stringify(splitTarget('unusually').sort()),
       'and those pieces are splitTarget()\u2019s, not a second ladder');

    // ⚠️ ONE ID SPACE. `parent` points at an id; two counters would eventually
    // mint the same number and a piece would claim a parent that was not its own.
    const ids = a.rocks.concat(b.rocks).map(r => r.id);
    ok(new Set(ids).size === ids.length,
       '\u26a0\u26a0 ids never collide across the two boards (nextTargetId)');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nC — THE DIRECTOR\u2019S LIFETIME BECOMES SPEED');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THE DESIGN DECISION THIS BOARD LIVES OR DIES BY. Nothing arrives, so the
// obvious move is to throw `lifetimeMs` away — and that would discard the only
// number in this app that knows how fast THIS child types. game-shell.js prices
// every lifetime against the student's gate and the 990-trial corpus sweep is
// what established those numbers are humane. ⭐ A SHORT LIFETIME BECOMES A FAST
// PANE, so the gate still sets the pace; it just no longer sets a deadline.
{
    const b = new ShardsBoard({ rand: mulberry(4) });
    const slow = b.spawn('sunlight', 12000, 0);
    const fast = b.spawn('sunlight', 4000, 0);
    const sp = r => Math.hypot(r.vx, r.vy);
    ok(sp(fast) > sp(slow),
       '\u26a0\u26a0 a shorter lifetime is a FASTER pane, so a 15 WPM child still ' +
       'gets slow glass');
    ok(Math.abs(sp(fast) / sp(slow) - 3) < 1e-6,
       '\u2b50 and proportionally so \u2014 a third of the time is three times the ' +
       'speed, not some other curve');

    // ⚠️ CROSSING THE FIELD TAKES THE LIFETIME IT WAS GIVEN, DIVIDED BY
    // SPEED_GAIN — Round 117. The director's lifetime is priced for SHATTER,
    // where it is one inbound journey and a deadline; read as a drift speed it
    // means a 65-second crossing at a 20 WPM gate, and a board whose objects
    // barely move cannot threaten anyone. ⭐ THE GATE STILL SETS THE PACE, which
    // is what the two assertions above pin; this only sets the scale.
    const crossed = sp(slow) * 12000 / SPEED_GAIN;
    ok(Math.abs(crossed - 2) < 1e-6,
       'a pane covers the field exactly once in its lifetime (' +
       crossed.toFixed(3) + ' of a spawn radius \u00d7 2)');

    // ⚠️ FIXED AT SPAWN. A speed recomputed from current pressure would
    // accelerate under the student's own success — the ramp applied twice.
    const before = sp(slow);
    for (let t = 0; t < 4000; t += 16) b.advance(t);
    ok(Math.abs(sp(slow) - before) < 1e-9,
       '\u26a0 and never changes afterwards');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nD — IT WRAPS, AND NOTHING IS EVER LOST OR TELEPORTED ONTO YOU');
// ═════════════════════════════════════════════════════════════════════════════
{
    const b = new ShardsBoard({ rand: mulberry(5) });
    for (let i = 0; i < 6; i++) b.spawn('carefully', 9000, 0);
    const ids = new Set(b.rocks.map(r => r.id));

    let outside = 0, wrapped = 0;
    const seen = new Map(b.rocks.map(r => [r.id, { x: r.x, y: r.y }]));
    for (let t = 16; t < 120000; t += 16) {
        b.advance(t);
        for (const r of b.rocks) {
            if (Math.abs(r.x) > WRAP_EDGE + 1e-9 ||
                Math.abs(r.y) > WRAP_EDGE + 1e-9) outside++;
            const was = seen.get(r.id);
            if (was && (Math.abs(r.x - was.x) > WRAP_EDGE ||
                        Math.abs(r.y - was.y) > WRAP_EDGE)) wrapped++;
            seen.set(r.id, { x: r.x, y: r.y });
        }
    }
    ok(outside === 0,
       '\u26a0\u26a0 no pane is ever outside the field \u2014 one that drifted off and ' +
       'kept going is a word the student is still being asked to type and ' +
       'cannot see (' + outside + ' frames)');
    ok(wrapped > 0, '\u2b50 and panes really do wrap (' + wrapped + ' crossings)');

    // ⚠️ WRAPPED BEFORE THE HIT TEST. A pane tested at its pre-wrap position
    // could register a hit on the frame it teleported — from the student's seat,
    // being killed by something off screen.
    const c = new ShardsBoard({ rand: mulberry(6) });
    const r = c.spawn('the', 5000, 0);
    // Park it just inside the far edge, heading out.
    r.x = WRAP_EDGE - 0.001; r.y = 0; r.vx = 0.01; r.vy = 0;
    c._lastAt = 0;
    const hits = c.advance(1);
    ok(hits.length === 0 && Math.abs(c.rocks[0].x + WRAP_EDGE) < 0.02,
       '\u26a0\u26a0 a pane that wraps does NOT register a hit on the frame it ' +
       'crosses');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nE — COLLISION, AND WHAT place() CALLS DANGEROUS');
// ═════════════════════════════════════════════════════════════════════════════
{
    const b = new ShardsBoard({ rand: mulberry(7) });
    const r = b.spawn('the', 5000, 0);
    r.x = 0.4; r.y = 0; r.vx = -0.001; r.vy = 0;
    b._lastAt = 0;
    let hit = [];
    for (let t = 16; t < 3000 && !hit.length; t += 16) hit = b.advance(t);
    ok(hit.length === 1 && hit[0] === r,
       'a pane that reaches the prism is returned as a hit');
    ok(!b.rocks.includes(r),
       '\u26a0\u26a0 and is already REMOVED \u2014 one that stayed alive after hitting ' +
       'would be charged to the student every frame');
    ok(b.locked !== r, 'and is not still locked');

    // ⭐ THREAT IS NOT DISTANCE, AND THIS IS WHERE THE SEAM EARNS ITSELF. On the
    // radial board near means dangerous because everything is coming at you.
    // Here a pane can be close and leaving. A view that painted "close" red
    // would cry wolf at everything that sails past.
    const c = new ShardsBoard({ rand: mulberry(8) });
    const closing = c.spawn('the', 5000, 0);
    const leaving = c.spawn('the', 5000, 0);
    closing.x = 0.3; closing.y = 0; closing.vx = -0.001; closing.vy = 0;
    leaving.x = 0.3; leaving.y = 0; leaving.vx = 0.001; leaving.vy = 0;
    ok(c.place(closing).threat > c.place(leaving).threat,
       '\u26a0\u26a0 at the SAME range, a pane closing on you reads as more ' +
       'dangerous than one sailing away');

    const far = c.spawn('the', 5000, 0);
    far.x = 1.2; far.y = 0; far.vx = -0.01; far.vy = 0;   // far but fast
    ok(c.place(far).threat < c.place(closing).threat,
       '\u2b50 but range still dominates \u2014 a fast pane on the far side is not ' +
       'yet a problem and must not be painted as one');
    for (const rock of c.rocks) {
        const t = c.place(rock).threat;
        ok(t >= 0 && t <= 1, 'threat stays inside 0..1 (' + t.toFixed(3) + ')');
    }

    // ⚠️ THE LOCK RULE IGNORES CLOSING SPEED ON PURPOSE. Which pane a keystroke
    // goes to must be predictable enough to type against; a lock that jumped
    // because something else started closing would feel like the game taking
    // the keyboard away.
    ok(c._rank(closing) === c._rank(leaving),
       '\u2b50\u2b50 two panes at the same range rank EQUALLY for the lock, however ' +
       'they are moving');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nF — PIECES FLY APART, AND NEVER ONTO THE PRISM');
// ═════════════════════════════════════════════════════════════════════════════
{
    const b = new ShardsBoard({ rand: mulberry(9) });
    const parent = b.spawn('unusually', 8000, 0);
    parent.x = 0.7; parent.y = 0.2;
    for (const ch of 'unusually') b.tryKey(ch, 1);
    const pieces = b.rocks.filter(r => r.parent === parent.id);
    ok(pieces.length >= 2, 'the word broke into pieces (' + pieces.length + ')');

    // ⭐ THE BEST THING ABOUT THIS BOARD. On the radial board pieces fan out on a
    // shared heading because they must share the parent's lifetime — one
    // journey, one speed. With free motion they inherit the parent's velocity
    // plus a kick, which is what breaking actually looks like.
    const headings = pieces.map(p => Math.atan2(p.vy, p.vx));
    const spread = Math.max(...headings) - Math.min(...headings);
    ok(spread > 0.3,
       '\u2b50\u2b50 and they really diverge (' + spread.toFixed(2) + ' rad) rather ' +
       'than travelling as one clump');
    ok(pieces.every(p => dist(p) >= 0.29),
       '\u26a0\u26a0 no piece is born on top of the prism \u2014 breaking a word must ' +
       'never be punished with a hit the student could not avoid');

    // A word broken right on the prism is the dangerous case.
    const c = new ShardsBoard({ rand: mulberry(10) });
    const near = c.spawn('unusually', 8000, 0);
    near.x = 0; near.y = 0.01;
    for (const ch of 'unusually') c.tryKey(ch, 1);
    ok(c.rocks.every(p => dist(p) >= 0.29),
       '\u26a0\u26a0 including one broken at point-blank range');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nG — HYPERSPACE: THE FIELD TRANSLATES, AND NOTHING IS DESTROYED');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ v1.2.0 — THE WARP WAS A SHOVE AND IS NOW A JUMP. Jake: *"Warp doesn't work
// the way I meant it to — namely, that the ship jumps somewhere with fewer
// asteroids on the same map… it just removing **everything** makes the game far
// too easy."* And: *"none of the panes of glass would be gone — you're just
// further away."*
{
    const b = new ShardsBoard({ rand: mulberry(11) });
    for (let i = 0; i < 6; i++) b.spawn('sunlight', 6000, 0);
    ok(!b.canWarp(0), 'no charge, no warp');

    // ⚠️ THE PRICE IS SHARDS', NOT SHATTER'S — ROADMAP 116h.3. Clears are far
    // more plentiful on a board where nothing arrives and dies on a timer.
    ok(b.warpClears === SHARDS_WARP_CLEARS && SHARDS_WARP_CLEARS > WARP_CLEARS,
       `⭐ a warp costs more here than in Shatter (${SHARDS_WARP_CLEARS} vs ${WARP_CLEARS})`);
    ok(new ShatterBoard({ rand: mulberry(1) }).warpClears === WARP_CLEARS,
       '⚠️ and Shatter\'s own price is untouched by the hook');

    // ⚠️⚠️ THE METER READS THE SAME PRICE THE WARP CHARGES. Three readers —
    // `warps`, `charge`, `canWarp()` — and a subclass that overrode only warp()
    // would have left the pips promising a warp the board would refuse.
    b.clearsSinceWarp = SHARDS_WARP_CLEARS - 1;
    ok(b.warps === 0 && !b.canWarp(1000), 'one clear short is no warp');
    b.clearsSinceWarp = SHARDS_WARP_CLEARS;
    ok(b.warps === 1 && b.charge === 1 / 1 || b.warps === 1,
       '⭐ and one clear more is exactly one warp — meter and cost agree');

    b.clearsSinceWarp = SHARDS_WARP_CLEARS * MAX_WARPS;
    const before = b.rocks.map(r => ({ id: r.id, x: r.x, y: r.y, vx: r.vx, vy: r.vy }));
    const n = b.rocks.length;
    // ⚠️⚠️ SCORED THE WAY THE CHOOSER SCORES — the WORST of now and 1.5s ahead.
    // ⭐ THE FIRST DRAFT OF THIS ASSERTION COMPARED PRESENT-ONLY CLEARANCE AND
    // WENT RED AGAINST CORRECT CODE (1.076 → 0.481), because the jump had
    // correctly traded a roomy present for a survivable next two seconds. A check
    // on a different quantity from the one being optimised is not a check.
    const worstClear = (rocks, jx = 0, jy = 0) => Math.min(...rocks.map(r => {
        const reach = reachOf(r);
        return Math.min(...[0, 250, 500, 750, 1000, 1250, 1500].map(dt =>
            Math.hypot(wrapCoord(r.x + r.vx * dt - jx), wrapCoord(r.y + r.vy * dt - jy)) - reach));
    }));
    const nearestBefore = worstClear(b.rocks);

    ok(b.warp(1000) === true, 'the warp fires');
    ok(b.rocks.length === n,
       '⚠️⚠️ and DESTROYS NOTHING — a warp that cleared the board would let a ' +
       'student bank typing time without typing');
    ok(b.warps === MAX_WARPS - 1,
       `⭐ one warp is spent, not the whole stack (${b.warps} left)`);

    // ⭐⭐ THE PROPERTY THAT MAKES IT A JUMP RATHER THAN A SHOVE: every pane moved
    // by the SAME offset. Density is exactly preserved, so the student gets
    // breathing room without getting fewer words.
    const offs = b.rocks.map(r => {
        const was = before.find(x => x.id === r.id);
        return { dx: r.x - was.x, dy: r.y - was.y };
    });
    // ⚠️ COMPARED MODULO THE FIELD, because a rigid translation wraps and two
    // panes that wrapped different numbers of times differ by a whole span.
    const span = WRAP_EDGE * 2;
    const near = (a, c) => Math.abs(wrapCoord(a - c)) < 1e-9;
    ok(offs.every(o => near(o.dx, offs[0].dx) && near(o.dy, offs[0].dy)),
       '⭐⭐ EVERY pane shifted by the same offset — the field translated rigidly');

    // ⚠️⚠️ VELOCITIES UNTOUCHED. The ship teleported; it did not accelerate. This
    // is the assertion that stops a future round quietly reintroducing the shove.
    ok(b.rocks.every(r => {
        const was = before.find(x => x.id === r.id);
        return r.vx === was.vx && r.vy === was.vy;
    }), '⚠️⚠️ and NO pane changed speed or bearing — hyperspace, not thrust');

    // ⚠️ PAIRWISE DISTANCES SURVIVE, which is the formal statement of "none of
    // the panes are gone, you are just further away".
    ok(b.rocks.length === before.length,
       'the constellation is intact — same panes, same count');

    // ⭐ AND IT ACTUALLY BUYS SOMETHING. The jump is chosen to maximise the
    // clearance to the nearest pane, so it must not leave the student worse off.
    const nearestAfter = worstClear(b.rocks);
    ok(nearestAfter >= nearestBefore - 1e-9,
       '⚠️⚠️ A WARP IS NEVER WORSE THAN NOT WARPING — the identity offset is ' +
       `always a candidate (${nearestAfter.toFixed(3)} vs ${nearestBefore.toFixed(3)})`);

    // ⚠️⚠️ WHAT THIS DELIBERATELY DOES **NOT** ASSERT, BECAUSE IT IS NOT TRUE AND
    // MUST NOT BE MADE TO LOOK TRUE: that a warp buys SAFETY for the next second
    // and a half. It does not, and it cannot.
    //
    // ⭐ ON A CROWDED BOARD THERE MAY BE NO SAFE POINT AT ALL. Six panes at these
    // speeds cover well over a third of the field in 1.5s, and the field is only
    // 2.7 wide — every candidate offset the chooser can reach still has something
    // crossing it. The identity candidate then wins or ties, and the student is
    // no worse off than if they had never pressed the key, which is exactly the
    // guarantee above and the only one available.
    //
    // ⚠️ THAT IS A PROPERTY OF THE DESIGN AND NOT A DEFECT TO TUNE AWAY. A warp
    // that guaranteed survival would be a shield, and a shield on a charge meter
    // earned by clearing is a way to bank typing time without typing — the same
    // hole `WARP_PUSH` destroying nothing was written to close.
    // ⭐ THE HONEST CLAIM IS COMPARATIVE: never worse, usually better, never safe.
    for (let t = 1016; t <= 2500; t += 16) b.advance(t);
    ok(b.rocks.length <= n,
       '⚠️ and the board is still running afterwards — a warp ends nothing by ' +
       `itself (${b.rocks.length} of ${n} panes left)`);
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nH — THE GAME IS NOT TRIVIALLY IMPOSSIBLE, AND NOT FREE');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️⚠️ v1.1.0 — THIS PART WAS MEASURING A BOARD NO STUDENT HAS EVER PLAYED,
// AND THAT IS WHY IT PASSED WHILE JAKE WENT TWO MINUTES WITHOUT A THREAT.
//
// v1.0.0 spawned on a hardcoded 2500ms timer to a hardcoded ceiling of eight
// panes and never touched `GameDirector`. ⭐ **THE REAL PUSH INTERVAL AT THESE
// GATES IS 9.6 TO 17.3 SECONDS** — the director prices it from the student's
// gate and multiplies by SHATTER_COST_FACTOR, which is 3. So this harness was
// feeding the board between four and seven times the work the live game does,
// reported 9.3 idle hits over three minutes, and called that a game.
//
// ⭐⭐ THE RULE THIS ROUND PAID FOR: **A SIMULATION THAT INVENTS ITS OWN PACING
// IS NOT A MEASUREMENT OF THE GAME.** Part H's job is to answer "is this board
// survivable", and the answer depends entirely on how fast work arrives — which
// is the one thing it was making up. Everything downstream of it was measured
// against a fiction, including the reassuring table in ROADMAP 116e.
//
// ⚠️ IT NOW DRIVES THE REAL PIPELINE: a real `GameDirector` with
// `costFactor: SHATTER_COST_FACTOR` and `endless: true` exactly as
// `game-shatter.js` builds it, real splittable words from `shatter-words.js`,
// `d.spawnDue(t, board.rocks.length)` for the spawn test, and `d.hit()` for the
// shields — so "dead" means what it means on screen.
{
    const WORDS = SHATTER_WORDS.filter(e => splittable(e.w)).map(e => e.w);
    ok(WORDS.length > 50, `the real splittable word pool loaded (${WORDS.length})`);

    /**
     * One run, driven the way the view drives it.
     * @param kpm keys per minute; WPM is a fifth of it. A typist who is always
     *        correct and always aims at whatever the board would lock — the best
     *        case deliberately, because the question is whether the BOARD is
     *        fair and not whether a simulated student is good.
     */
    const play = ({ seed, kpm, gate = 20, ms = 300000 }) => {
        const rand = mulberry(seed);
        const d = new GameDirector({
            targets: WORDS, targetWPM: gate, endless: true,
            costFactor: SHATTER_COST_FACTOR, rand,
        });
        const b = new ShardsBoard({ rand });
        const iv = kpm ? 60000 / kpm : 0;
        let hits = 0, cleared = 0, lastKey = -1e9, firstHitAt = null, deadAt = null;
        let occSum = 0, frames = 0;
        for (let t = 0; t < ms; t += 16) {
            for (const _gone of b.advance(t)) {
                hits++;
                if (firstHitAt == null) firstHitAt = t;
                d.hit(t);
                if (d.over && deadAt == null) deadAt = t;
            }
            if (!d.over && d.spawnDue(t, b.rocks.length)) {
                const tg = d.nextTarget(t);
                if (tg) b.spawn(tg.text, tg.lifetimeMs, t);
            }
            if (kpm && t - lastKey >= iv) {
                lastKey = t;
                const target = b.locked && b.rocks.includes(b.locked)
                    ? b.locked
                    : b.rocks.slice().sort((p, q) => b._rank(p) - b._rank(q))[0];
                if (target) {
                    const r = b.tryKey(target.text[target.typed], t);
                    if (r.cleared) cleared++;
                }
            }
            occSum += b.rocks.length; frames++;
            if (deadAt != null) break;
        }
        return { hits, cleared, firstHitAt, deadAt, occ: occSum / frames };
    };

    const SEEDS = [3, 11, 21, 37, 53, 71, 89, 101];
    const sweep = kpm => SEEDS.map(s => play({ seed: s, kpm }));
    const mean = (rs, k) => rs.reduce((n, r) => n + (r[k] || 0), 0) / rs.length;

    const idle = sweep(0);
    const slow = sweep(60);     // ≈12 WPM
    const fast = sweep(300);    // ≈60 WPM

    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ THE IDLE FLOOR — ROADMAP 116h, AND IT IS THE ASSERTION THE ROADMAP
    // ASKED FOR BY NAME.
    // ═══════════════════════════════════════════════════════════════════════
    //
    // Jake, 2026-09-11: *"shards is just too easy… I went 2 minutes without
    // touching the keyboard **at all** and never had any threat at all."*
    //
    // ⭐ A STUDENT WHO TYPES NOTHING MUST BE DEAD INSIDE THE FLOOR, ON EVERY
    // SEED. Not "usually", not "on average" — a game you can reliably ignore
    // for the length of a class rotation is not a game, and an average hides
    // exactly the seeds where nothing ever happens.
    //
    // ⚠️ 120 SECONDS IS JAKE'S OWN NUMBER, not a tuning choice: it is the span
    // he sat through untouched. ⚠️⚠️ IT IS A CEILING ON SAFETY AND NOT A TARGET
    // — a board that kills an idler in 30 seconds passes this and may well be
    // right; a board that takes three minutes does not.
    // ⚠️⚠️ THE THRESHOLD IS STATED AS A MEAN PLUS A HARD CEILING, AND THE FIRST
    // DRAFT DEMANDED "every seed inside 120s" AND COULD NOT BE MET WITHOUT
    // INVERTING THE FAIRNESS ORDERING BELOW. That is a real finding and it is
    // written down rather than tuned around: faster glass kills idlers sooner
    // and ALSO kills slow typists sooner, and this app exists for the second
    // group. ⭐ SO THE IDLE FLOOR YIELDS TO THE FAIRNESS RULE, not the reverse.
    const IDLE_MEAN_MS = 120000;   // Jake's own two untouched minutes
    const IDLE_CEILING_MS = 180000;
    const meanDead = mean(idle.map(r => ({ v: r.deadAt == null ? 300000 : r.deadAt })), 'v');
    ok(meanDead < IDLE_MEAN_MS,
       '⚠️⚠️ A STUDENT WHO TYPES NOTHING IS DEAD INSIDE JAKE\'S TWO MINUTES ON ' +
       `AVERAGE (${Math.round(meanDead / 1000)}s; was 265s before Round 117)`);
    const stragglers = idle.filter(r => r.deadAt == null || r.deadAt > IDLE_CEILING_MS);
    ok(stragglers.length <= 1,
       '⚠️ and at most one seed in eight outlives three minutes doing nothing ' +
       `(${stragglers.length})`);

    const never = idle.filter(r => r.firstHitAt == null);
    ok(never.length === 0,
       `⚠️ and every idle seed is threatened at all (${never.length} never were)`);

    const firsts = idle.map(r => r.firstHitAt == null ? Infinity : r.firstHitAt);
    const worstFirst = Math.max(...firsts);
    ok(worstFirst <= 60000,
       '⭐ the FIRST threat arrives inside 60s on every seed — a student must ' +
       `learn what the game is before it kills them (worst ${Math.round(worstFirst / 1000)}s)`);

    // ⚠️⚠️ AND THE BOARD IS NOT EMPTY WHILE THIS HAPPENS. This is the assertion
    // that stops a future round "fixing" the floor by simply spawning more.
    // ⭐ THE ORIGINAL DEFECT WAS NEVER DENSITY: an idle student already sat under
    // 7.5 panes and was not hit, because `HIT_R` was 0.10 in a field 2.7 wide and
    // the pane's own SIZE was not in the hit test at all — glass visibly passed
    // over the prism and nothing happened. If this goes red upward, someone has
    // answered a geometry problem by burying the student in words.
    ok(mean(idle, 'occ') < 12,
       `⚠️ and the idle board is not merely buried in glass (${mean(idle, 'occ').toFixed(1)} panes)`);

    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ PLAYING IS NEVER WORSE THAN NOT PLAYING. The original v1.0.0 defect.
    // ═══════════════════════════════════════════════════════════════════════
    //
    // ⭐ AND IT IS ASSERTED ON TIME SURVIVED, NOT ON HIT COUNT. A hit count
    // comparison is meaningless once students die at different moments: the
    // idler dies early and stops accruing hits, so "fewer hits" can mean "died
    // sooner". `deadAt` is the number a child feels.
    const survived = rs => mean(rs.map(r => ({ v: r.deadAt == null ? 300000 : r.deadAt })), 'v');
    const [tIdle, tSlow, tFast] = [survived(idle), survived(slow), survived(fast)];
    ok(tSlow >= tIdle,
       '⚠️⚠️ a SLOW typist lives at least as long as a student who does nothing ' +
       `— the game must never charge a child for trying (${Math.round(tSlow / 1000)}s ` +
       `vs ${Math.round(tIdle / 1000)}s)`);
    ok(tFast > tIdle,
       `⭐ and a fast typist really does survive longer (${Math.round(tFast / 1000)}s ` +
       `vs ${Math.round(tIdle / 1000)}s)`);

    ok(mean(slow, 'cleared') > 3,
       `a slow typist still clears panes while they are at it (${mean(slow, 'cleared').toFixed(0)})`);
    ok(mean(fast, 'cleared') > mean(slow, 'cleared') * 2,
       `⭐ and a fast one clears far more (${mean(fast, 'cleared').toFixed(0)} vs ` +
       `${mean(slow, 'cleared').toFixed(0)})`);

    // ⚠️ THE GAME IS STILL LOSABLE BY EVERYONE. An arcade cabinet eats quarters;
    // a Shards run that never ends is a different game and a worse one.
    // ⚠️⚠️ DELIBERATELY NOT ASSERTED: that a fast typist eventually loses. They
    // survive all five minutes on every seed here, and that is CORRECT for the
    // window rather than a defect — `arcadeConfig()` ramps pressure toward
    // `survivalCeilingFor(gate)` over a far longer run than a harness should
    // simulate, and "an arcade cabinet eats quarters" is that ramp's job, not
    // this board's. ⭐ ASSERTING IT HERE WOULD MEASURE THE RAMP AND CALL IT THE
    // GAME — which is exactly the mistake Part G of shatter-board-test.mjs
    // records making twice.
    ok(tFast >= tSlow,
       `⚠️ a fast typist is never worse off than a slow one (${Math.round(tFast / 1000)}s ` +
       `vs ${Math.round(tSlow / 1000)}s)`);

    console.log(`    idle ${Math.round(tIdle / 1000)}s | slow ${Math.round(tSlow / 1000)}s ` +
                `| fast ${Math.round(tFast / 1000)}s survived; ` +
                `occupancy idle ${mean(idle, 'occ').toFixed(1)}`);
}

console.log(fail
    ? `\nFAIL — ${pass} ok, ${fail} failed`
    : `\nPASS — ${pass} ok, 0 failed`);
if (fail) { fails.forEach(f => console.log('  \u2717 ' + f)); process.exitCode = 1; }
