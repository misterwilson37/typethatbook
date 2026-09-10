// escape-peek-test.mjs v1.0.0 — THE SPAWN TELEGRAPH, BY ARITHMETIC RATHER THAN
// BY EYE. Round 114 (Carriage).
//
// ⚠️⚠️ THIS FILE EXISTS BECAUSE JAKE REPORTED THE SAME SENTENCE TWICE.
//
// 2026-09-10, on the shipped build: *"Notice that the Kaiju leans back to peek in
// if he enters from the right. He should lean forward (like he does on the
// left)."* He had reported the identical symptom before Round 112, which shipped
// a fix for it, and the fix was correct about the thing it changed.
//
// ⭐⭐ TWO BUGS WERE CANCELLING, AND FIXING THE REAL ONE EXPOSED THE OTHER.
// `drawPixelSprite()` applies `scale(-1, 1)` before rotating, which mirrors the
// ANGLE as well as the sprite. Round 112 made the angle screen-space by negating
// it inside the draw call. But the call site passed a FIXED `lean = 0.5`, and a
// lean that points along the direction of travel is `+0.5` from the left edge and
// `-0.5` from the right. While the mirror was flipping the angle, the flip and
// the lean were correlated — both derive from `dir` — so the wrong constant came
// out looking right on both edges. Remove the mirror and the constant is naked.
//
// ⚠️ SO ROUND 112'S REPORT OF SUCCESS WAS TRUE OF THE CODE AND FALSE OF THE
// SCREEN, and no amount of reading either file could settle it: the correctness
// of an angle in game-escape.js depended on a `scale()` two files away.
//
// ⭐ WHAT MAKES THIS HARNESS DIFFERENT FROM A REGEX ON THE LEAN CONSTANT: it
// accumulates the REAL 2×3 CANVAS TRANSFORM through translate/scale/rotate and
// asks where the top of the sprite actually lands. That is the quantity Jake is
// looking at. An assertion on the sign of a constant would go green the moment
// someone "simplified" drawPixelSprite() again.

import { peekStaging, KAIJU_PEEK_LEAN } from '../game-draw.js';
import { drawPixelSprite, ENEMY_SPRITES, ENEMY_PALETTES } from '../game-sprites.js';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

/**
 * A 2D context that accumulates a real affine transform and records where each
 * fillRect lands in SCREEN space.
 *
 * ⚠️ THE MATRIX IS THE POINT. A recorder with `scale(){}` and `rotate(){}` as
 * no-ops — which is what tests/arcade-panels-test.mjs uses, correctly, for
 * panels that never transform — cannot see this defect at all: every pixel would
 * be logged at its unrotated position and both kaiju would look identical.
 */
function matrixRecorder() {
    // [a c e ; b d f] — screen = M · local
    let M = [1, 0, 0, 1, 0, 0];
    const stack = [];
    const mul = (m, n) => [
        m[0] * n[0] + m[2] * n[1],
        m[1] * n[0] + m[3] * n[1],
        m[0] * n[2] + m[2] * n[3],
        m[1] * n[2] + m[3] * n[3],
        m[0] * n[4] + m[2] * n[5] + m[4],
        m[1] * n[4] + m[3] * n[5] + m[5],
    ];
    const pts = [];
    return {
        fillStyle: '#000', globalAlpha: 1,
        pts,
        save() { stack.push(M.slice()); },
        restore() { M = stack.pop() || [1, 0, 0, 1, 0, 0]; },
        translate(x, y) { M = mul(M, [1, 0, 0, 1, x, y]); },
        scale(x, y) { M = mul(M, [x, 0, 0, y, 0, 0]); },
        rotate(a) {
            M = mul(M, [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]);
        },
        fillRect(x, y, w, h) {
            const cx = x + w / 2, cy = y + h / 2;
            pts.push({
                x: M[0] * cx + M[2] * cy + M[4],
                y: M[1] * cx + M[3] * cy + M[5],
            });
        },
    };
}

/**
 * Draw a kaiju peeking in from one edge and report how far its TOP leans,
 * horizontally, from its own centre.
 *
 * ⚠️ POSITIVE MEANS THE HEAD IS TO THE RIGHT OF THE BODY. That is the only
 * quantity in this file, and it is exactly what Jake is describing.
 */
function headLean(dir) {
    const CELL = 40;
    const stage = peekStaging('kaiju', dir);
    // ⚠️⚠️ MEASURED AS A DIFFERENCE FROM THE SAME SPRITE AT ANGLE ZERO, AND THE
    // FIRST DRAFT OF THIS FILE DID NOT DO THAT. The kaiju is NOT left-right
    // symmetric — it has a head crest and one glowing eye — so mirroring it moves
    // the average x of any horizontal band all by itself. The raw measurement
    // therefore mixed "how far the rotation tipped it" with "how the sprite is
    // shaped", and Part C's zero-angle control proved it: a flipped sprite at
    // angle 0 read as leaning 2.4px when it is not leaning at all.
    // ⭐ SUBTRACTING THE UNROTATED BASELINE ISOLATES THE ROTATION, which is the
    // only quantity this file is about. ⚠️ Part A passed on the first draft, and
    // it passed PARTLY BY LUCK — the asymmetry happened to point the same way as
    // the answer. A check that is right for the wrong reason is the shape this
    // whole round has been about.
    const at = angle => {
        const ctx = matrixRecorder();
        drawPixelSprite(
            ctx, PROBE, { '1': '#fff' },
            cellX + stage.ox * CELL, cellY + stage.oy * CELL, CELL * 0.8,
            dir === -1, angle,
        );
        return bandSkew(ctx);
    };
    // The cell the creature is entering, in screen coordinates. The x is only a
    // reference point; every assertion below is relative to it.
    // ⚠️ THE FLIP IS `dir === -1`, COPIED FROM game-escape.js's call site —
    // `en.dir === -1 || en.facingLeft`. A creature entering from the right walks
    // left and is drawn mirrored, which is the whole source of the bug.
    return { lean: at(stage.lean), ox: stage.ox, leanAngle: stage.lean };
}

// ⚠️⚠️ A SYMMETRIC PROBE SPRITE, NOT THE KAIJU. Two earlier drafts of this file
// measured the real artwork and both were wrong, in two different ways:
//   1. The kaiju is not left-right symmetric — head crest, one glowing eye — so
//      mirroring it moves the average x of any horizontal band on its own, and
//      the reading mixed "how far the rotation tipped it" with "how it is drawn".
//   2. Baseline-subtracting fixed the sign but not the magnitude, because the
//      BANDS THEMSELVES are chosen from post-rotation screen y: rotating changes
//      which pixels are topmost, so the two readings being differenced were not
//      measuring the same pixels.
// ⭐ THE SPRITE'S IDENTITY IS IRRELEVANT TO A QUESTION ABOUT THE TRANSFORM. A
// single centred vertical bar makes the head unambiguous, the baseline exactly
// zero, and the expected skew computable by hand: at angle a the top of a bar of
// height h lands (h/2)·sin(a) to the side.
// ⚠️ DO NOT "IMPROVE" THIS BY USING THE REAL SPRITE. That is the mistake, twice.
const PROBE = Array.from({ length: 24 }, () =>
    '000000000000110000000000');

/** Top-row x minus bottom-row x, in screen space, for the probe bar. */
function bandSkew(ctx) {
    const ys = ctx.pts.map(p => p.y);
    const top = Math.min(...ys), bottom = Math.max(...ys);
    const avgX = ps => ps.reduce((s, p) => s + p.x, 0) / ps.length;
    const eps = (bottom - top) * 0.02 + 0.001;
    return avgX(ctx.pts.filter(p => p.y <= top + eps)) -
           avgX(ctx.pts.filter(p => p.y >= bottom - eps));
}

const cellX = 400, cellY = 300;

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nA — THE KAIJU LEANS INTO THE BOARD FROM BOTH EDGES');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THE BOARD IS TO THE RIGHT OF A LEFT-EDGE SPAWN AND TO THE LEFT OF A
// RIGHT-EDGE SPAWN, so "leans in" is two opposite screen directions and cannot
// be one constant. That sentence is the entire defect.
{
    const fromLeft = headLean(1);
    const fromRight = headLean(-1);

    ok(fromLeft.lean > 1,
       '\u26a0\u26a0 entering from the LEFT, the head leans RIGHT \u2014 into the board (' +
       fromLeft.lean.toFixed(1) + 'px)');
    ok(fromRight.lean < -1,
       '\u26a0\u26a0 entering from the RIGHT, the head leans LEFT \u2014 into the board (' +
       fromRight.lean.toFixed(1) + 'px). THIS IS THE ASSERTION THAT WAS FAILING ' +
       'ON THE SHIPPED BUILD, TWICE');
    // ⭐ AND SYMMETRICALLY, because the two edges are mirror images of one
    // situation. An asymmetry here would mean one of them is merely less wrong.
    ok(Math.abs(fromLeft.lean + fromRight.lean) < 0.5,
       '\u2b50 and by the same amount, mirrored (' + fromLeft.lean.toFixed(1) +
       ' vs ' + fromRight.lean.toFixed(1) + ')');
    // ⚠️ THE OFFSET IS AGAINST THE DIRECTION OF TRAVEL, so the creature is pushed
    // back off its own edge and only partly on screen. A peek drawn at its full
    // position is the Round 107–111 defect: a telegraph in the rules and nothing
    // on screen.
    ok(fromLeft.ox < 0 && fromRight.ox > 0,
       '\u26a0 each is pushed BACK off its own edge, opposite its travel (' +
       fromLeft.ox + ', ' + fromRight.ox + ')');
    // ⚠️ AND THE ANGLES ARE SIGNED, WHICH THE OLD CALL SITE'S CONSTANT WAS NOT.
    ok(fromLeft.leanAngle === KAIJU_PEEK_LEAN &&
       fromRight.leanAngle === -KAIJU_PEEK_LEAN,
       '\u2b50 the screen angle itself is signed by direction (' +
       fromLeft.leanAngle + ', ' + fromRight.leanAngle + ')');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nB — THE OTHER TWO CREATURES ARE STAGED FOR THEIR OWN AXIS');
// ═══════════════════════════════════════════════════════════════════════════
{
    // ⚠️ THE SPIDER TRAVELS VERTICALLY, so its offset is vertical and it has NO
    // lean: a rotation is a lean along the horizontal, and tipping it would point
    // at an axis it never moves on.
    for (const d of [1, -1]) {
        const s = peekStaging('spider', d);
        ok(s.ox === 0, 'a spider peeking (dir ' + d + ') has no horizontal offset');
        ok(s.oy !== 0 && Math.sign(s.oy) === -d,
           '\u26a0 it is pushed back along its OWN axis, opposite travel (' + s.oy + ')');
        ok(s.lean === 0,
           '\u26a0\u26a0 and does NOT lean \u2014 a rotation would name the horizontal, ' +
           'which is not an axis it moves on');
    }
    // ⚠️ THE HUNTER ARRIVES AT A CORNER AND IS ANNOUNCED IN WORDS. Jake: *"Robot
    // gets an announcement, so it doesn't matter."* It has no entry axis, so any
    // lean would name a direction it is not about to move in.
    for (const d of [1, -1]) {
        const h = peekStaging('hunter', d);
        ok(h.ox === 0 && h.oy === 0 && h.lean === 0,
           'a hunter is not staged at all (dir ' + d + ') \u2014 it is announced');
    }
    // Absent-safe: an unknown kind must not throw or invent a lean.
    let threw = false;
    let unknown = null;
    try { unknown = peekStaging('gribbly', 1); } catch (_) { threw = true; }
    ok(!threw, 'an unknown creature kind does not throw');
    ok(unknown && unknown.lean === 0 && unknown.ox === 0,
       '\u26a0 and is drawn unstaged rather than given the kaiju\u2019s lean');
    ok(peekStaging('kaiju', 0).lean === KAIJU_PEEK_LEAN,
       'dir 0 is treated as +1 rather than producing a zero lean');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nC — drawPixelSprite() TAKES A SCREEN ANGLE, AND THAT IS PINNED');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ peekStaging() IS ONLY CORRECT IF THIS CONTRACT HOLDS, and the contract is
// Round 112's v1.1.0 change. If a later round "simplifies" the `flipX ? -rotation`
// line away, Part A's numbers invert and the two bugs start cancelling again —
// which is a state this project has already shipped once. ⭐ SO THE CONTRACT IS
// ASSERTED SEPARATELY FROM THE THING THAT DEPENDS ON IT.
{
    // ⚠️ BASELINE-SUBTRACTED, for the reason in headLean()'s comment: the sprite
    // is asymmetric, so `at(true, 0)` is not zero and a raw reading measures the
    // artwork as much as the transform.
    const at = (flip, angle) => {
        const ctx = matrixRecorder();
        drawPixelSprite(ctx, PROBE, { '1': '#fff' }, 0, 0, 48, flip, angle);
        return bandSkew(ctx);
    };
    const plainPos = at(false, 0.5), flipPos = at(true, 0.5);
    ok(plainPos > 1, 'a positive angle leans the head right when unflipped');
    ok(flipPos > 1,
       '\u26a0\u26a0 AND ALSO WHEN FLIPPED \u2014 the mirror is undone for the ' +
       'rotation, so a positive angle means one thing everywhere (' +
       plainPos.toFixed(1) + ' vs ' + flipPos.toFixed(1) + ')');
    ok(Math.abs(plainPos - flipPos) < 0.5,
       '\u2b50 by the same amount, which is what "screen space" means');
    ok(Math.abs(at(false, 0)) < 0.5 && Math.abs(at(true, 0)) < 0.5,
       'a zero angle leans neither way, flipped or not');
    ok(at(false, -0.5) < -1, 'and a negative angle leans the other way');
}

console.log(fail
    ? `\nescape-peek-test: ${pass} passed, ${fail} FAILED`
    : `escape-peek-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
