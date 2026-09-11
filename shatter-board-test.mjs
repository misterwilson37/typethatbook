// tests/shatter-board-test.mjs v1.1.0 — Round 116 (Sun): Part H, the view seam.
// tests/shatter-board-test.mjs v1.0.0 — CAN A GATE-SPEED CHILD CLEAR A ROCK
// THAT COSTS TWICE WHAT IT LOOKS LIKE IT COSTS? Round 103 (Bar-Let).
//
// ⚠️⚠️ THIS FILE EXISTS BECAUSE SHATTER'S CENTRAL MECHANIC BREAKS THE SHELL'S
// CENTRAL GUARANTEE UNLESS SOMEBODY DOES THE ARITHMETIC. `unusually` is nine
// characters on screen and eighteen keystrokes to actually clear, because the
// pieces spell the word. A rock priced at nine would demand 30 WPM of a student
// on a 15 WPM gate — and it would LOOK RIGHT, exactly as MISSION_PRESSURE = 0.75
// looked right in Round 82 while making every gate in the building unreachable.
//
// ⚠️ PART B IS THE ONE TO READ FIRST IF SHATTER'S PACING IS EVER REOPENED. It
// pins the factor-of-two in arithmetic, so it cannot come back as a readability
// tweak. Part F is the one that decides whether Shatter could ever sit on the
// graded path: it drives a simulated child at the gate and asserts they live.

import {
    ShatterBoard, splitTarget, splittable,
    SHATTER_COST_FACTOR, SPLIT_MIN_R, SPAWN_R,
    WARP_CLEARS, WARP_GRACE_MS, WARP_PUSH, MAX_WARPS,
    SHATTER_BOARD_VERSION, MAX_SPLIT_DEPTH, MIN_RESPLIT_LEN,
} from '../shatter-board.js';
import {
    GameDirector, spawnIntervalMs, charsPerSecondFor, makeArcadeTargets,
    GAME_SHELL_VERSION,
} from '../game-shell.js';
import { SHATTER_WORDS } from '../shatter-words.js';
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

const HOME = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];

console.log(`\nshatter-board.js v${SHATTER_BOARD_VERSION} against game-shell.js v${GAME_SHELL_VERSION}\n`);

// ═════════════════════════════════════════════════════════════════════════════
console.log('PART A — the split ladder: readable and shorter, never meaningful-or-nothing');
// ═════════════════════════════════════════════════════════════════════════════

{
    // ⭐ Rung 1: the morphemes, from the closed list a model judged.
    ok(splitTarget('unusually').join('|') === 'un|usual|ly',
       'a real morpheme split comes from shatter-words.js, not from a rule');
    ok(splitTarget('accomplishment').join('|') === 'accomplish|ment',
       'a two-part word splits in two');

    // ⚠️ THE CASE COMES FROM THE INPUT, NOT FROM THE STORED ENTRY. A student who
    // typed a capitalised word must not be handed lowercase pieces to retype.
    ok(splitTarget('Unusually').join('|') === 'Un|usual|ly',
       'the pieces carry the input\'s case, because they are SLICES of it');
    ok(splitTarget('UNUSUALLY').join('|') === 'UN|USUAL|LY',
       'and an all-caps word too');

    // ⚠️⚠️ THE INVARIANT THE WHOLE MECHANIC RESTS ON. A piece set that does not
    // rebuild the word is a rock on screen that cannot be cleared.
    let rebuilt = 0, oneUp = 0;
    for (const e of SHATTER_WORDS) {
        const parts = splitTarget(e.w);
        if (parts.join('') === e.w) rebuilt++;
        if (parts.length >= 2) oneUp++;
    }
    ok(rebuilt === SHATTER_WORDS.length,
       `all ${SHATTER_WORDS.length} bank words rebuild themselves from their pieces`);
    ok(oneUp === SHATTER_WORDS.length,
       'and none of them returns a single piece, which would be "type it twice for no reason"');

    // ⭐ Rung 3: the Unit 1 student, who has no morphemes and needs the game anyway.
    ok(splitTarget('asdfjk').join('|') === 'asd|fjk',
       'a drill group halves — HANDOFF-games.md §6\'s own example');
    ok(splitTarget('asd').join('|') === 'as|d',
       'ceil, so the student meets the bigger job while they still have runway');

    // Rung 4, and the floor.
    ok(splitTarget('as').join('|') === 'a|s', 'two characters split into two characters');
    ok(splitTarget('a').length === 0, 'one character cannot split');
    ok(splittable('a') === false && splittable('asd') === true,
       'splittable() is how the view keeps a one-character target out of the pool');

    // ⚠️ THE LADDER NEVER INVENTS. Every rung is a slice of the input, so no rung
    // can produce a letter the student did not type.
    let clean = true;
    for (const w of ['something', 'football', 'asdfjk', 'unusually', 'qqqqqq', 'zz']) {
        if (splitTarget(w).join('') !== w) clean = false;
    }
    ok(clean, 'every rung concatenates back to the input, compound and nonsense alike');

    // ⚠️ AND IT NEVER PRODUCES A BLOCKED GROUP THE DRILL FILTER WOULD HAVE CAUGHT.
    // Splitting is a new way to make a short string out of a safe long one.
    let blocked = '';
    for (const e of SHATTER_WORDS) {
        for (const p of splitTarget(e.w)) {
            const bad = firstBlocked(p);
            if (bad) { blocked = `${e.w} → ${p} (${bad})`; break; }
        }
        if (blocked) break;
    }
    ok(blocked === '', `no split piece trips drill-filter.js${blocked ? ' — ' + blocked : ''}`);
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART B — \u26a0\ufe0f\u26a0\ufe0f THE COST FACTOR, AS ARITHMETIC');
// ═════════════════════════════════════════════════════════════════════════════
//
// This is the part that would have shipped a game every child failed.

{
    // ⚠️⚠️ 2 → 3 IN ROUND 116, WHEN A WORD STARTED BREAKING TWICE. The factor is
    // not a difficulty knob — it is the director's statement of how many
    // keystrokes an N-character target really demands, and the ladder now
    // demands N + N + N. ⭐ THIS ASSERTION AND MAX_SPLIT_DEPTH MUST MOVE
    // TOGETHER, ALWAYS: a factor below the true cost prices every word under the
    // work it takes and then fails the student against a quota that was never
    // reachable.
    ok(SHATTER_COST_FACTOR === 3,
       'one target costs three times its own characters \u2014 parent, pieces, ' +
       'and the pieces of those');

    const targets = ['unusually', 'accomplishment'];
    const naive = new GameDirector({ targets, targetWPM: 15, endless: true });
    const real = new GameDirector({ targets, targetWPM: 15, endless: true,
                                    costFactor: SHATTER_COST_FACTOR });

    const t = real.nextTarget(0);
    const n = naive.nextTarget(0);
    ok(Math.abs(t.lifetimeMs - n.lifetimeMs * SHATTER_COST_FACTOR) < 1,
       'a Shatter rock gets exactly ' + SHATTER_COST_FACTOR + '\u00d7 the journey of an unpriced one');
    ok(Math.abs(real.intervalMs - naive.intervalMs * SHATTER_COST_FACTOR) < 1,
       'and rocks arrive proportionally less often, which is the same statement');

    // ⭐ THE CLAIM STATED THE WAY IT MATTERS: what WPM does clearing one rock in
    // one interval actually demand?
    const chars = 'unusually'.length * SHATTER_COST_FACTOR;
    const ms = spawnIntervalMs(chars, 15, 1.0);
    const demanded = (chars / 5) / (ms / 60000);
    ok(Math.abs(demanded - 15) < 0.01,
       `clearing one rock and its pieces per interval is exactly ${demanded.toFixed(1)} WPM — the gate`);

    // ⚠️ AND WHAT IT WOULD HAVE BEEN. Kept as the number, not as a warning.
    const wrong = (chars / 5) / (spawnIntervalMs('unusually'.length, 15, 1.0) / 60000);
    // ⚠️ THE BOUNDS DERIVE FROM THE FACTOR RATHER THAN RESTATING IT. Round 116
    // moved it 2 → 3 and this went red at a hardcoded "about 30" — which was the
    // check working, and then being in the way. ⭐ The claim is "an unpriced rock
    // demands `factor` times the gate", and that is true whatever the factor is.
    ok(Math.abs(wrong - 15 * SHATTER_COST_FACTOR) < 0.5,
       `an unpriced rock would have demanded ${wrong.toFixed(0)} WPM on a 15 WPM ` +
       `gate \u2014 ${SHATTER_COST_FACTOR}\u00d7 the gate, which is the whole point ` +
       'of the factor');

    // ⚠️ THE DEFAULT IS THE OLD BEHAVIOUR EXACTLY. Deadline and Escape Key pass
    // nothing and must not move by a millisecond.
    const plain = new GameDirector({ targets: ['asdf'], targetWPM: 15, endless: true });
    ok(plain.costFactor === 1 && plain.lifetimeFor('asdf') === 12800
       && plain.intervalMs === 3200,
       'a caller that says nothing gets costFactor 1, a 3200ms interval and a 12800ms fall — v1.5.0 exactly');

    // ⚠️ THE QUOTA SCALES TOO, or an assessed Shatter would be half its length.
    const mission = new GameDirector({ targets, targetWPM: 15,
                                       costFactor: SHATTER_COST_FACTOR });
    const raw = targets.reduce((a, b) => a + b.length, 0);
    ok(mission.quotaChars === raw * SHATTER_COST_FACTOR,
       'the DEFAULTED quota is in keystrokes, because cleared() fires per rock');
    const told = new GameDirector({ targets, targetWPM: 15, quotaChars: 40,
                                    costFactor: SHATTER_COST_FACTOR });
    ok(told.quotaChars === 40, 'and an explicit quota is taken as given, never doubled again');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART C — rocks converge, and every one of them ends');
// ═════════════════════════════════════════════════════════════════════════════

{
    const b = new ShatterBoard({ rand: mulberry(1) });
    b.spawn('asdf', 4000, 0);
    ok(b.rocks[0].r === SPAWN_R, 'a rock starts on the ring');

    let last = b.rocks[0].r;
    let monotone = true;
    for (let t = 100; t < 3900; t += 100) {
        b.advance(t);
        if (!b.rocks.length) break;
        if (b.rocks[0].r >= last) monotone = false;
        last = b.rocks[0].r;
    }
    ok(monotone, 'it moves inward every step and never outward');

    const arrived = b.advance(4100);
    ok(arrived.length === 1 && b.rocks.length === 0,
       'it arrives once, and is off the board when it does');

    // ⚠️⚠️ NO WRAPPING. HANDOFF-games.md §6: a wrapping rock means clearing never
    // clears and population is decided by how long the student has been alive
    // rather than by the director's pressure.
    const c = new ShatterBoard({ rand: mulberry(2) });
    c.spawn('asdf', 1000, 0);
    c.advance(5000);
    ok(c.rocks.length === 0, 'a rock past the student is gone, not recycled to the ring');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART D — the split, and the one journey it does not reset');
// ═════════════════════════════════════════════════════════════════════════════

{
    const b = new ShatterBoard({ rand: mulberry(3) });
    b.spawn('unusually', 10000, 0);
    b.advance(2000);
    const rBefore = b.rocks[0].r;

    let res = null;
    for (const ch of 'unusually') res = b.tryKey(ch, 2000);
    ok(res.cleared === 'unusually', 'typing it out clears it');
    ok(res.pieces.length === 3 && res.pieces.map(p => p.text).join('|') === 'un|usual|ly',
       'and it becomes its three pieces');
    ok(b.rocks.length === 3, 'which are on the board, and the parent is not');

    ok(Math.abs(b.rocks[0].dr - (SPAWN_R / 10000)) < 1e-12,
       '⭐ ONE JOURNEY, ONE SPEED — the pieces inherit the parent\'s, they do not get a fresh one');
    ok(b.rocks.every(p => p.r >= rBefore - 1e-9),
       'and they never start closer in than the parent was');

    // ⚠️⚠️ TWO OF THE THREE PIECES START WITH `u`, AT THE SAME DISTANCE, so the
    // lock is genuinely ambiguous and nearest-to-impact cannot break the tie.
    // The re-lock is what stops the student paying for that; without it, the
    // second keystroke below is charged as a mistake.
    b.tryKey('u', 2100);
    ok(b.locked.text === 'un', 'the tie goes to the first piece, deterministically');
    const relock = b.tryKey('s', 2100);
    ok(relock.correct && b.locked.text === 'usual' && b.locked.typed === 2,
       '⭐ THE RE-LOCK — `u`+`s` opens no other rock, so the student always meant `usual`');

    // ⚠️⚠️ A WORD BREAKS TWICE, AND THEN STOPS. Jake, 2026-09-11: *"it should
    // split into 2 or 3 and then split again."* ⭐ THE OLD ASSERTION HERE SAID
    // "a piece is terminal", and its reasoning — that a recursive split makes
    // the cost unstatable — was RIGHT AND IS WHY THIS IS BOUNDED BY DEPTH rather
    // than left to run. Two levels is still a statable cost: N + N + N, which is
    // why SHATTER_COST_FACTOR moved 2 → 3 in the same edit. ⚠️ IF A LATER ROUND
    // RAISES MAX_SPLIT_DEPTH IT MUST RAISE THAT FACTOR TOO, or the director
    // prices every word below the work it demands and the quota stops being
    // reachable.
    let sub = null;
    for (const ch of 'ual') sub = b.tryKey(ch, 2100);
    ok(sub.cleared === 'usual' && sub.pieces.length >= 2,
       '\u2b50 a piece splits ONCE MORE (' + sub.pieces.map(p => p.text).join('+') + ')');
    ok(sub.pieces.every(p => p.terminal),
       '\u26a0\u26a0 and its pieces are terminal \u2014 the ladder stops at depth 2, ' +
       'which is what keeps the cost statable at 3N');
    ok(sub.pieces.every(p => p.depth === 2), 'they know their own depth');

    // ⚠️ A SHORT PIECE DOES NOT SPLIT INTO RUBBLE. `us`+`ual` is a drill; `u`+`s`
    // is a keystroke with a box round it.
    const tiny = new ShatterBoard({ rand: mulberry(41) });
    const tr = tiny.spawn('asdfjk', 9000, 0);
    for (const ch of 'asdfjk') tiny.tryKey(ch, 1);
    ok(tiny.rocks.every(p => p.text.length >= 2),
       'no piece is a single character (' +
       tiny.rocks.map(p => p.text).join(' ') + ')');

    // ⭐ THE FLOOR. A rock broken on the doorstep must not scatter pieces that
    // are already on top of the student.
    const late = new ShatterBoard({ rand: mulberry(4) });
    late.spawn('unusually', 10000, 0);
    late.advance(9900);
    let lr = null;
    for (const ch of 'unusually') lr = late.tryKey(ch, 9900);
    ok(lr.pieces.every(p => p.r >= SPLIT_MIN_R - 1e-9),
       `pieces from a last-instant break start at least ${SPLIT_MIN_R} out`);

    // ⚠️⚠️ AND THE TOTAL COST IS THE NUMBER PART B PRICED — NOW SUMMED OVER THE
    // WHOLE LADDER, because Round 116 made a word break twice. ⭐ WALKED RATHER
    // THAN ASSERTED AS A FORMULA: `SHATTER_COST_FACTOR` is a CEILING (a piece
    // too short to re-split costs less), and a test that demanded exactly 3N
    // would go red on perfectly good words like `asdfjk`. The promise to the
    // director is "never more than this", and that is what is checked.
    const walk = (text, depth) => {
        let total = text.length;
        if (depth >= MAX_SPLIT_DEPTH) return total;
        for (const part of splitTarget(text)) {
            if (part.length < MIN_RESPLIT_LEN) { total += part.length; continue; }
            total += walk(part, depth + 1);
        }
        return total;
    };
    for (const w of ['unusually', 'something', 'asdfjk', 'carefully']) {
        const c = walk(w, 0);
        ok(c <= w.length * SHATTER_COST_FACTOR,
           `\u26a0\u26a0 clearing "${w}" costs ${c} keystrokes, never more than ` +
           `${w.length * SHATTER_COST_FACTOR} \u2014 the ceiling the shell was told`);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART E — the lock, and the key that hits nothing');
// ═════════════════════════════════════════════════════════════════════════════

{
    const b = new ShatterBoard({ rand: mulberry(5) });
    const far = b.spawn('assess', 10000, 0);
    const near = b.spawn('adder', 10000, 0);
    near.r = 0.3; far.r = 0.9;

    // ⚠️ TWO ROCKS, SAME FIRST CHARACTER. escape-board.js could PREVENT this by
    // enforcing distinct first characters across four cells; Shatter cannot,
    // because a split drops pieces onto a board that already holds a word.
    const r = b.tryKey('a', 0);
    ok(r.correct && b.locked === near,
       'a tie on the first character resolves toward the rock nearest impact');

    ok(b.tryKey('q', 0).correct === false,
       '⚠️ A KEY THAT MATCHES NOTHING IS A MISTAKE — the prototypes dropped it on the floor');

    // ⭐ Abandoning a lock is free, and progress is kept.
    const b2 = new ShatterBoard({ rand: mulberry(6) });
    const one = b2.spawn('asdf', 10000, 0);
    const two = b2.spawn('jkl', 10000, 0);
    one.r = 0.8; two.r = 0.8;
    b2.tryKey('a', 0); b2.tryKey('s', 0);
    ok(one.typed === 2, 'two characters in');
    const jump = b2.tryKey('j', 0);
    ok(jump.correct && b2.locked === two && one.typed === 2,
       'switching to a more urgent rock costs nothing and keeps the partial progress');

    // ⚠️ THE ROUND 101 RULING, VERBATIM: "is a word half-typed", not "is this key
    // a space". A space is neither right nor wrong — it must reach the director
    // as NEITHER, or a student inflates accuracy by tapping it.
    const sp = b2.tryKey(' ', 0);
    ok(sp.ignored === true && sp.correct === false,
       'a space at a word boundary is IGNORED, not scored either way');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART F — ⚠️⚠️ THE WARP IS EARNED, AND ITS THREE CONDITIONS EACH CLOSE A HOLE');
// ═════════════════════════════════════════════════════════════════════════════

{
    const b = new ShatterBoard({ rand: mulberry(7) });
    ok(b.charge === 0 && b.warp(0) === false,
       '⚠️ NOT FREE — the prototype was beatable without typing at all');

    // Earn it. Each cleared rock, parent or piece, is one clear.
    let t = 0;
    while (b.clearsSinceWarp < WARP_CLEARS) {
        b.spawn('as', 100000, t);
        for (const ch of 'as') b.tryKey(ch, t);
        t += 10;
    }
    ok(b.warps === 1, `${WARP_CLEARS} cleared rocks bank one warp`);

    // ⚠️ HOLE 3, AND IT IS THE ONE THAT LOOKS OPTIONAL. The habit space arrives
    // right after the word that earned the meter, when nothing is locked — so it
    // sails past the half-typed test and spends the warp by reflex.
    ok(b.canWarp(t) === false,
       'the reflex space right after a clear cannot fire it');
    const after = t + WARP_GRACE_MS + 1;
    ok(b.canWarp(after) === true, `${WARP_GRACE_MS}ms later, it can`);

    // ⚠️ HOLE 2 — mid-word.
    b.spawn('jkl', 100000, after);
    b.tryKey('j', after);
    ok(b.canWarp(after + 1000) === false, 'and not while a word is half-typed');
    b.tryKey('k', after + 1000); b.tryKey('l', after + 1000);

    const t2 = after + 1000 + WARP_GRACE_MS + 1;
    const rocks = [b.spawn('asdf', 100000, t2), b.spawn('fdsa', 100000, t2)];
    for (const r of rocks) r.r = 0.2;
    ok(b.warp(t2) === true, 'with all three satisfied, it fires');
    ok(rocks.every(r => Math.abs(r.r - (0.2 + WARP_PUSH)) < 1e-9),
       'and shoves every rock back out');
    ok(rocks.every(r => b.rocks.includes(r)),
       '⚠️ IT DESTROYS NOTHING — a warp that cleared the board would be a way to clear a rock for free');
    ok(b.warps === 0, 'and spending it leaves none banked');

    // ⭐⭐ HOARDING. Jake, 2026-09-09: warps stack to three, *"which would both
    // use up space and encourage hoarding."*
    // ⚠️ THE POINT IS THAT SPENDING ONE COSTS THE THIRD ONE LATER — a
    // single-charge meter makes warping strictly correct the instant it fills,
    // so there is nothing for the student to weigh.
    const h = new ShatterBoard({ rand: mulberry(21) });
    let t3 = 0;
    while (t3 < 4000 && h.warps < MAX_WARPS) {
        h.spawn('as', 1000000, t3);
        for (const ch of 'as') h.tryKey(ch, t3);
        t3 += 10;
    }
    ok(h.warps === MAX_WARPS, `a clean run banks up to ${MAX_WARPS} warps`);
    for (let i = 0; i < 40; i++) {
        h.spawn('as', 1000000, t3); for (const ch of 'as') h.tryKey(ch, t3); t3 += 10;
    }
    ok(h.warps === MAX_WARPS,
       '⚠️ AND NO FURTHER — uncapped charge would make a patient student untouchable');
    ok(h.charge === 1,
       '⚠️ the partial bar reads FULL at the cap, not empty — a meter that empties on success reads as a penalty');
    const t4 = t3 + WARP_GRACE_MS + 1;
    ok(h.warp(t4) === true && h.warps === MAX_WARPS - 1,
       '⭐ spending one leaves the rest — zeroing the stack would throw away what they saved');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART G — ⚠️⚠️ CAN A CHILD AT THE GATE ACTUALLY SURVIVE THIS?');
// ═════════════════════════════════════════════════════════════════════════════
//
// The claim Part B pins in arithmetic, played out. A simulated student types at
// a steady rate and always aims at the rock nearest impact — the advice the game
// gives them. ⚠️ THE SPAWN LOOP IS THE VIEW'S, WRITTEN ONCE HERE, so a real
// game-shatter.js that diverges from it will be visible as a divergence.

const STEP_MS = 20;

function play({ wpm, gate, seed, seconds, shields = 3, typist = true, split = true }) {
    const rand = mulberry(seed);
    const pool = makeArcadeTargets(HOME, 400, 4, mulberry(seed + 500))
        .filter(splittable);
    // ⚠️ `split: false` IS THE CONTROL, AND IT IS THE WHOLE EXPERIMENT. It is the
    // same board, the same shell and the same typist with the split turned off —
    // which is Deadline's shape. Comparing Shatter to it is the only way to ask
    // "did the split make this harder", and that is the question costFactor
    // exists to answer.
    const d = new GameDirector({
        targets: pool, targetWPM: gate, minAccuracy: 85, shields,
        endless: true, costFactor: split ? SHATTER_COST_FACTOR : 1, rand,
    });
    const b = new ShatterBoard({ rand });

    const perKeyMs = 1000 / charsPerSecondFor(wpm);
    let nextKeyAt = 0;

    for (let now = 0; now <= seconds * 1000 && !d.over; now += STEP_MS) {
        for (const gone of b.advance(now)) d.leaked(gone.text, now);
        if (d.over) break;

        if (d.spawnDue(now, b.rocks.length)) {
            const t = d.nextTarget(now);
            if (t) { const rk = b.spawn(t.text, t.lifetimeMs, now); if (!split) rk.terminal = true; }
        }

        // ⚠️ THE TYPIST IS NOT A KEY-MASHER AND NOT AN ORACLE. They finish the
        // rock they started, and otherwise aim at the one nearest impact — the
        // advice the game gives them. A policy that always typed the first
        // available target measured nothing, which is the mistake
        // escape-board-test.mjs's mover test made twice.
        //
        // ⚠️ THE FIRST DRAFT OF THIS LOOP KILLED EVERY CHILD ON EVERY SEED, and
        // the game was innocent: `nextKeyAt` was advanced past `now` on the
        // first key of each frame and then compared against `now` again, so the
        // typist emitted at most one keystroke per 20 ms tick and then stopped —
        // a harness that measured its own bug. ⭐ THE SIMULATED STUDENT IS PART
        // OF THE APPARATUS AND CAN BE WRONG; when a sweep fails 20 of 20, read
        // the typist before reading the game.
        if (!typist) { nextKeyAt = now + STEP_MS; continue; }
        while (nextKeyAt <= now) {
            let aim = b.locked && b.rocks.includes(b.locked) && b.locked.typed > 0
                ? b.locked : null;
            if (!aim) for (const r of b.rocks) if (!aim || r.r < aim.r) aim = r;
            if (!aim) { nextKeyAt = now + perKeyMs; break; }
            const wasPiece = aim.parent != null;
            const res = b.tryKey(aim.text[aim.typed], now);
            d.keyResult(res.correct, now);
            // ⚠️ ONE SPAWNED TARGET, ONE RAMP STEP. See game-shell.js v1.6.0 —
            // a piece that ramped would triple the arcade's difficulty curve
            // against a child who is only typing what the game gave them.
            if (res.cleared) d.cleared(res.cleared, now, { ramp: !wasPiece });
            nextKeyAt += perKeyMs;
        }
    }
    return { d, rep: d.report(seconds * 1000), b, lasted: d.over ? d.clock.seconds(seconds * 1000) : seconds };
}

{
    // ⚠️⚠️ THE CAMPER, ONE GAME OVER. A student who types nothing must lose, or
    // Shatter's `countsTime: true` is a way to farm the daily clock.
    let camperDied = 0;
    for (let s = 1; s <= 20; s++) {
        const { d } = play({ wpm: 15, gate: 15, seed: s, seconds: 300, typist: false });
        if (d.over) camperDied++;
    }
    ok(camperDied === 20, 'a student who types nothing loses on 20 of 20 seeds');

    // ⚠️⚠️ AND HERE IS THE ASSERTION I GOT WRONG FIRST, IN EXACTLY THE WAY
    // escape-board-test.mjs's mover test got it wrong TWICE. My first draft
    // demanded a gate-speed child survive three minutes of ENDLESS arcade. They
    // do not, and they should not: an endless run has no quota, so the pressure
    // ramp climbs forever and IS SUPPOSED TO WIN. "Survives N seconds" measures
    // the ramp, not the game.
    //
    // ⭐ THE CLAIM THAT ACTUALLY MATTERS IS COMPARATIVE: **the split must never
    // make Shatter harsher than the same board with the split turned off.** That
    // is what `costFactor` is for, it is falsifiable, and it does not depend on
    // where anyone decided to put the ramp.
    let never = 0, ratios = [];
    for (let s = 1; s <= 20; s++) {
        const shatter = play({ wpm: 15, gate: 15, seed: s, seconds: 600 });
        const control = play({ wpm: 15, gate: 15, seed: s, seconds: 600, split: false });
        if (shatter.lasted >= control.lasted) never++;
        ratios.push(shatter.lasted / Math.max(1, control.lasted));
    }
    const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    ok(never === 20,
       `the split never shortens a gate-speed child's run — ${never} of 20 seeds, mean ${mean.toFixed(2)}×`);

    // ⚠️ AND IT IS NOT OVER IN TWENTY SECONDS EITHER. costFactor could satisfy
    // the line above by making every run trivially short in both arms.
    let brief = 0;
    for (let s = 1; s <= 20; s++) {
        if (play({ wpm: 15, gate: 15, seed: s, seconds: 600 }).lasted < 90) brief++;
    }
    ok(brief === 0, 'and every gate-speed run lasts at least 90 seconds before the ramp wins');

    // ⭐ THE GAME REPORTS THE CHILD, NOT THE RAMP. A faster typist must get
    // further, or Shatter is measuring patience.
    const slow = play({ wpm: 15, gate: 15, seed: 3, seconds: 600 });
    const fast = play({ wpm: 30, gate: 15, seed: 3, seconds: 600 });
    ok(fast.lasted > slow.lasted,
       `a 30 WPM child outlasts a 15 WPM one on the same seed — ${fast.lasted.toFixed(0)}s vs ${slow.lasted.toFixed(0)}s`);

    // ⚠️ AND THE WPM IT REPORTS IS THEIRS. The defect HANDOFF-games.md §1 was
    // written about: pressure 1.0 with no refill floor caps EVERY student at
    // exactly the gate, so a fast typist reads slow.
    const quick = play({ wpm: 40, gate: 15, seed: 3, seconds: 120 });
    ok(quick.rep.wpm > 32,
       `a 40 WPM typist on a 15 WPM gate reads ${quick.rep.wpm.toFixed(0)}, not 15`);

    // ⚠️ THE PIECES ARE REACHING THE DIRECTOR. A run whose cleared count never
    // exceeded its spawn count would mean splits were being dropped silently.
    ok(quick.d.clearedCount > quick.d._cursor,
       'more rocks are cleared than spawned, because every target becomes several');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nH — place(): THE VIEW SEAM REPRODUCES THE ARITHMETIC IT REPLACED');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THIS IS A REFACTOR HARNESS AND IT HAS EXACTLY ONE JOB: prove that moving
// the view off `rock.r` / `rock.angle` CHANGED NOTHING ON SCREEN.
//
// Jake, 2026-09-10: *"What about a shatter 2 and have kids try both?"* Two
// motion models, offered side by side for a rotation. ⭐ THE WHOLE RISK IN THAT
// PLAN IS RULE 5: two games is fine, two COPIES of one game is what
// `tools/game-lab.html` was deleted for. `game-shatter.js` read polar
// coordinates in nine places, so a drift board would have forced a second VIEW
// — and from then on every change to the glass would have to be made twice.
//
// ⚠️ SO THE SEAM LANDS FIRST, WITH THE SECOND BOARD NOT YET WRITTEN, and this
// part is what makes that safe: the refactor is only trustworthy if the
// existing game is provably unchanged through it.
//
// ⚠️⚠️ IT REPRODUCES THE OLD VIEW ARITHMETIC LITERALLY, COPIED FROM
// game-shatter.js v1.3.0's px(). ⭐ THAT COPY IS THE POINT AND IS NOT A RULE 9
// VIOLATION: it is a FROZEN RECORD OF THE PREVIOUS BEHAVIOUR, not a second
// live implementation. ⚠️ IF A FUTURE ROUND DELIBERATELY CHANGES THE MAPPING,
// THIS PART SHOULD GO RED AND SHOULD THEN BE DELETED — not updated to agree.
// A refactor harness that is kept in step with the thing it was pinning has
// stopped being a refactor harness.
{
    const OLD_SHIP_R = 26, OLD_RING = 300, OLD_CX = 400, OLD_CY = 250;
    /** game-shatter.js v1.3.0's px(), verbatim. */
    const oldPx = (rock) => {
        const rr = OLD_SHIP_R + Math.max(0, rock.r) * (OLD_RING - OLD_SHIP_R);
        return { x: OLD_CX + Math.cos(rock.angle) * rr,
                 y: OLD_CY + Math.sin(rock.angle) * rr };
    };
    /** game-shatter.js v1.4.0's toPixels(), verbatim. */
    const newPx = (g) => {
        const m = Math.hypot(g.x, g.y);
        const rr = OLD_SHIP_R + m * (OLD_RING - OLD_SHIP_R);
        return { x: OLD_CX + g.dx * rr, y: OLD_CY + g.dy * rr };
    };

    const b = new ShatterBoard({ rand: mulberry(31) });
    let worst = 0, worstT = 0, n = 0;
    for (let i = 0; i < 400; i++) {
        // ⚠️ EVERY RADIUS THE BOARD CAN PRODUCE, NOT JUST THE TIDY ONES: 0 is
        // impact, > 1 is a pane a warp has shoved back out past the ring, and
        // the old code clamped negatives with Math.max(0, r).
        const r = -0.1 + (i / 399) * 1.5;
        const angle = (i * 0.37) % (Math.PI * 2);
        const rock = { r, angle };
        const g = b.place(rock);
        const a = oldPx(rock), c = newPx(g);
        worst = Math.max(worst, Math.abs(a.x - c.x), Math.abs(a.y - c.y));
        // The view's danger test: `r <= 0.22` became `threat >= 0.78`.
        const oldNear = r <= 0.22, newNear = g.threat >= 0.78;
        if (oldNear !== newNear) worstT++;
        n++;
    }
    ok(n === 400, 'swept 400 positions across the whole radius range');
    ok(worst < 1e-9,
       '\u26a0\u26a0 place() + toPixels() lands every pane on the SAME PIXEL the old ' +
       'px() did (worst drift ' + worst.toExponential(2) + ')');
    ok(worstT === 0,
       '\u26a0\u26a0 and `threat >= 0.78` is `r <= 0.22` exactly \u2014 the danger ring, ' +
       'the red rim and the crazing all still trigger in the same place');

    // ⚠️ CLAMPED AT BOTH ENDS. A warped pane past the ring has a NEGATIVE
    // threat under a bare `1 - r`, which would read as safer than nothing —
    // and the view has no colour for that.
    ok(b.place({ r: 1.6, angle: 0 }).threat === 0,
       'a pane shoved out past the ring is threat 0, never negative');
    ok(b.place({ r: -0.3, angle: 0 }).threat === 1,
       'and one at or past impact is threat 1, never above');

    // ⭐ THE ORDER THE VIEW DRAWS IN IS PRESERVED. It sorted by descending `r`;
    // it now sorts by ascending threat, and those must be the same order or a
    // pane about to land starts being painted underneath a distant one.
    const rocks = [0.9, 0.1, 0.5, 1.2, 0.0].map((r, i) => ({ r, angle: i }));
    const byOld = rocks.slice().sort((x, y) => y.r - x.r).map(k => k.r);
    const byNew = rocks.slice()
        .sort((x, y) => b.place(x).threat - b.place(y).threat).map(k => k.r);
    ok(JSON.stringify(byOld) === JSON.stringify(byNew),
       '\u2b50 least-urgent-first is the same order as farthest-first (' +
       byNew.join(',') + ')');

    // ⚠️ AND IT IS A PURE READ. A seam that mutated the board would be a second
    // way to move a pane, and the view calls it several times a frame.
    const live = new ShatterBoard({ rand: mulberry(32) });
    live.spawn('unusually', 8000, 0);
    live.spawn('sunlight', 9000, 0);
    const before = JSON.stringify(live.rocks);
    for (let i = 0; i < 50; i++) live.rocks.forEach(k => live.place(k));
    ok(JSON.stringify(live.rocks) === before,
       '\u26a0\u26a0 place() mutates nothing \u2014 the view calls it several times a ' +
       'frame and it must never be a second way to move a pane');
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} failed`);
if (fail) { fails.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
