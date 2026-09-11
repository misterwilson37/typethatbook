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

import { ShatterBoard, splitTarget, WARP_CLEARS, MAX_WARPS }
    from '../shatter-board.js';
import { ShardsBoard, WRAP_EDGE, HIT_R } from '../shatter-shards.js';

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
    const expected = ['place', '_rank', 'spawn', 'advance', '_placePiece', 'warp'];
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

    // Crossing the field takes the lifetime it was given.
    const crossed = sp(slow) * 12000;
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
console.log('\nG — THE WARP SHOVES AND DESTROYS NOTHING');
// ═════════════════════════════════════════════════════════════════════════════
{
    const b = new ShardsBoard({ rand: mulberry(11) });
    for (let i = 0; i < 5; i++) b.spawn('the', 6000, 0);
    ok(!b.canWarp(0), 'no charge, no warp');
    b.clearsSinceWarp = WARP_CLEARS * MAX_WARPS;
    ok(b.canWarp(1000), 'a full meter can be spent');

    const before = b.rocks.map(r => ({ id: r.id, d: dist(r) }));
    const n = b.rocks.length;
    ok(b.warp(1000) === true, 'the warp fires');
    ok(b.rocks.length === n,
       '\u26a0\u26a0 and DESTROYS NOTHING \u2014 a warp that cleared the board would ' +
       'let a student bank typing time without typing');
    ok(b.warps === MAX_WARPS - 1,
       '\u2b50 one warp is spent, not the whole stack \u2014 hoarding still buys ' +
       'something (' + b.warps + ' left)');

    // ⭐ A KICK, NOT A TELEPORT. Moving every pane instantly would put the word
    // the student is halfway through somewhere they have to find again.
    for (let t = 1016; t < 2200; t += 16) b.advance(t);
    let pushed = 0;
    for (const r of b.rocks) {
        const was = before.find(x => x.id === r.id);
        if (was && dist(r) > was.d) pushed++;
    }
    ok(pushed >= Math.ceil(n * 0.8),
       '\u26a0 and everything is further away a second later (' + pushed +
       ' of ' + n + ')');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nH — THE GAME IS NOT TRIVIALLY IMPOSSIBLE, AND NOT FREE');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THIS IS A SANITY FLOOR AND NOT A BALANCE CLAIM. Pressure here is
// DENSITY, and nobody has measured how long a slow child lasts under it — that
// is what a rotation of thirty twelve-year-olds is for, and it is the whole
// reason Jake asked for the cabinet rather than a simulation. ⭐ WHAT THIS PINS
// IS ONLY THE TWO WAYS A NEW BOARD IS USUALLY BROKEN: unplayable on arrival, or
// impossible to lose.
{
    const play = ({ seed, kpm }) => {
        const b = new ShardsBoard({ rand: mulberry(seed) });
        const words = ['sunlight', 'carefully', 'remarking', 'mistakes', 'unfolded'];
        let hits = 0, cleared = 0, w = 0, nextSpawn = 0, lastKey = -1e9;
        const iv = kpm ? 60000 / kpm : 0;
        for (let t = 0; t < 180000; t += 16) {
            if (t >= nextSpawn && b.rocks.length < 8) {
                b.spawn(words[w++ % words.length], 9000, t);
                nextSpawn = t + 2500;
            }
            hits += b.advance(t).length;
            // ⚠️ kpm IS KEYS PER MINUTE AND WPM IS FIFTHS OF IT. A typist who
            // is always correct and always aims at whatever the board would
            // lock — the best case, deliberately, because the question is
            // whether the BOARD is fair and not whether a simulated student is
            // good.
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
        }
        return { hits, cleared, left: b.rocks.length };
    };

    // ⚠️⚠️ THE ASSERTION THAT FOUND THE REAL DEFECT. v1.0.0 of the board let a
    // pane wrap forever; over twelve seeds a 12 WPM typist took 15.2 hits
    // against 10.5 for a student who did nothing at all. ⭐ PLAYING WAS WORSE
    // THAN NOT PLAYING, for exactly the children this app exists for — clearing
    // a word replaces one pane with two or three, and a board with no exit meant
    // a slow typist raised the density and then had to live in it. Fixed by
    // giving panes a wandering budget; see shatter-shards.js v1.1.0.
    const slow = play({ seed: 21, kpm: 60 });    // ≈12 WPM
    const idle = play({ seed: 21, kpm: 0 });
    const fast = play({ seed: 21, kpm: 300 });   // ≈60 WPM

    ok(slow.hits <= idle.hits + 1,
       '\u26a0\u26a0 a SLOW typist is not punished for playing \u2014 they take no ' +
       'more hits than a student who types nothing (' + slow.hits + ' vs ' +
       idle.hits + ')');
    ok(slow.cleared > 3,
       'and still clears panes while they are at it (' + slow.cleared + ')');
    ok(fast.hits < idle.hits,
       '\u2b50 while a fast typist really does survive longer (' + fast.hits +
       ' vs ' + idle.hits + ')');
    ok(fast.cleared > slow.cleared * 3,
       '\u2b50 and clears far more (' + fast.cleared + ' vs ' + slow.cleared + ')');
    ok(idle.hits > 0,
       '\u26a0\u26a0 a student who types NOTHING is still eventually hit \u2014 a ' +
       'wrap board where ignoring everything is survivable has no game in it (' +
       idle.hits + ')');

    // ⚠️⚠️ AND WHAT THIS DELIBERATELY DOES **NOT** ASSERT, because it is not
    // true and must not be quietly made to look true: that typing PROTECTS you
    // in proportion to skill. It does not. The director refills the field to a
    // fixed occupancy, so density — and therefore the hit rate — is roughly
    // flat from 12 to 30 WPM, and only a genuinely fast typist outruns it.
    // ⭐ SHARDS IS SURVIVE-BY-LUCK AND SCORE-BY-SKILL; SHATTER IS
    // SURVIVE-BY-SKILL. That is a real difference between the two cabinets, it
    // is exactly the kind of thing a rotation of students will feel, and it is
    // written down here rather than tuned away because nobody has yet decided
    // whether it is a flaw or the point. See ROADMAP 116e.
}

console.log(fail
    ? `\nFAIL — ${pass} ok, ${fail} failed`
    : `\nPASS — ${pass} ok, 0 failed`);
if (fail) { fails.forEach(f => console.log('  \u2717 ' + f)); process.exitCode = 1; }
