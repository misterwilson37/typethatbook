// tests/escape-board-test.mjs v1.0.0 — DOES A STUDENT WHO STANDS STILL LOSE?
// Round 82 (Victor).
//
// ⚠️⚠️ THIS FILE EXISTS BECAUSE THE ANSWER USED TO BE NO, AND NOBODY COULD HAVE
// PROVED IT EITHER WAY. Enemies spawned anywhere on a 6×5 board and mostly
// wandered elsewhere, so a student could stand on one cell, type nothing, and
// survive — banking wall-clock seconds against zero characters. That is a claim
// about board mechanics, and while the mechanics lived inside a canvas render
// loop it could only be argued about.
//
// ⚠️ WHY IT MATTERS BEYOND FAIRNESS: Escape Key's WPM is only a real measure of
// typing if MOVING IS MANDATORY, because moving is what costs a typed word. The
// camper test is therefore the test that decides whether Escape Key may ever sit
// on the graded path. Part B is the one to look at first if that question is
// reopened.

import {
    EscapeBoard, COLS, ROWS, MIN_SPAWN_DISTANCE, MAX_ENEMIES,
    STEPS_PER_ROUND, HUNTER_ROUND, ESCAPE_BOARD_VERSION,
} from '../escape-board.js';
import { makeArcadeTargets, GameDirector, enemyStepMs } from '../game-shell.js';
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
function pool(seed = 1, keys = HOME) { return makeArcadeTargets(keys, 200, 4, mulberry(seed)); }

console.log(`\nescape-board.js v${ESCAPE_BOARD_VERSION}\n`);

// ═════════════════════════════════════════════════════════════════════════════
console.log('PART A — the board is legible and choosable');
// ═════════════════════════════════════════════════════════════════════════════

{
    const b = new EscapeBoard({ pool: pool(1), rand: mulberry(2) });
    ok(b.grid.length === ROWS && b.grid[0].length === COLS, 'the board is 6×5');
    ok(b.grid[b.player.y][b.player.x] === '', 'the player\'s own cell is never a target');

    // ⭐ The fix that makes small key sets work: four adjacent cells, four
    // distinct first characters.
    let checked = 0, collisions = 0;
    for (let trial = 0; trial < 400; trial++) {
        const bb = new EscapeBoard({ pool: pool(trial + 1), rand: mulberry(trial + 100) });
        // Walk it around so the check covers corners and edges too.
        for (let m = 0; m < 6; m++) {
            const firsts = bb.adjacent(bb.player.x, bb.player.y)
                .map(c => bb.grid[c.y][c.x]).filter(Boolean).map(w => w[0]);
            checked++;
            if (new Set(firsts).size !== firsts.length) collisions++;
            const target = bb.adjacent(bb.player.x, bb.player.y)
                .map(c => bb.grid[c.y][c.x]).find(Boolean);
            if (!target) break;
            for (const ch of target) bb.tryKey(ch);
        }
    }
    ok(collisions === 0,
       `${checked} neighbourhoods across 400 boards, no two adjacent words share a first ` +
       `character (${collisions} collisions)`);

    const dirty = pool(7).filter(w => firstBlocked(w) !== '');
    ok(dirty.length === 0, 'the pool is already filtered — no words are generated in this file');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART B — ⭐ THE CAMPER DIES');
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Run a board for N enemy steps with a given keystroke policy.
 * `policy` returns a character to type each step, or null to type nothing.
 */
function runBoard({ seed, steps, pressure = 1.0, policy, shields = 3, stopAfterMoves = null }) {
    const b = new EscapeBoard({ pool: pool(seed), rand: mulberry(seed * 31 + 7) });
    let hits = 0, moves = 0, keys = 0, mistakes = 0;
    for (let s = 0; s < steps; s++) {
        if (policy) {
            // The student gets roughly one word's worth of keystrokes per enemy
            // step, which is what a gate-speed typist has.
            for (let k = 0; k < 4; k++) {
                const ch = policy(b);
                if (ch == null) break;
                const r = b.tryKey(ch);
                keys++;
                if (!r.correct) mistakes++;
                if (r.kind === 'move') { moves++; break; }
            }
        }
        const events = b.step(pressure);
        if (events.some(e => e.t === 'caught')) { hits++; b.respawn(); }
        if (hits >= shields) return { b, hits, moves, keys, mistakes, diedAtStep: s + 1 };
        // ⚠️ AN ASSESSED RUN ENDS AT THE QUOTA, NOT AFTER A FIXED NUMBER OF ENEMY
        // STEPS. The first version of the mission check ran a flat 40 steps, which
        // kept the board alive past the point a real mission would have finished
        // and counted deaths that could not have happened.
        if (stopAfterMoves != null && moves >= stopAfterMoves) {
            return { b, hits, moves, keys, mistakes, diedAtStep: null, cleared: true };
        }
    }
    return { b, hits, moves, keys, mistakes, diedAtStep: null };
}

// The camper: never types a key.
const camperDeaths = [];
for (let seed = 1; seed <= 40; seed++) {
    const r = runBoard({ seed, steps: 200, policy: () => null });
    camperDeaths.push(r.diedAtStep);
}
const camperSurvivors = camperDeaths.filter(d => d === null).length;
const median = camperDeaths.filter(Boolean).sort((a, b) => a - b)[
    Math.floor(camperDeaths.filter(Boolean).length / 2)];
console.log(`  [40 campers: ${40 - camperSurvivors} died, median at enemy step ${median}]`);
ok(camperSurvivors === 0,
   'a student who types NOTHING loses all three shields on every one of 40 seeds');
ok(median <= 40,
   `and quickly — median death at step ${median}, about ${(median * 3.2 / 60).toFixed(1)} minutes ` +
   'at a 15 WPM gate, so camping is not a strategy even briefly');

{
    // ⚠️ THE MOVER MUST DODGE, OR THE TEST MEASURES THE WRONG THING. The first
    // version of this policy always typed the first available neighbour, which
    // walked cheerfully into enemies — 37 of 40 died, and that number said
    // nothing about the design because no child plays that way. A student looks
    // at the board and moves AWAY from the creature. The claim worth pinning is
    // that a competent gate-speed player survives; a random walker dying is not
    // evidence against it.
    //
    // ⚠️ IT ALSO COMMITS TO A TARGET. Once a word is started the student finishes
    // it — switching mid-word is not available to them, since the buffer is
    // shared, so a policy that re-decided every keystroke would have superhuman
    // information.
    let choice = null;
    const safest = b => {
        if (b.player.webWord != null) return b.player.webWord[b.typed.length];
        if (b.typed === '' || !choice) {
            const opts = b.adjacent(b.player.x, b.player.y)
                .filter(c => b.grid[c.y][c.x])
                .map(c => {
                    let d = Infinity;
                    for (const e of b.enemies) d = Math.min(d, Math.abs(e.x - c.x) + Math.abs(e.y - c.y));
                    return { word: b.grid[c.y][c.x], d };
                })
                .sort((a, z) => z.d - a.d);
            if (!opts.length) { b.clearTyped(); choice = null; return null; }
            choice = opts[0].word;
        }
        if (!choice.startsWith(b.typed)) { b.clearTyped(); choice = null; return null; }
        const ch = choice[b.typed.length];
        if (ch == null) { choice = null; return null; }
        return ch;
    };

    let deaths = 0, totalMoves = 0, movesBeforeDeath = [];
    for (let seed = 1; seed <= 40; seed++) {
        choice = null;
        const r = runBoard({ seed, steps: 200, policy: safest });
        if (r.diedAtStep) { deaths++; movesBeforeDeath.push(r.moves); }
        totalMoves += r.moves;
    }
    const avgMoves = Math.round(totalMoves / 40);
    console.log(`  [40 dodging movers, 200 steps: ${deaths} died, ${avgMoves} moves each]`);
    // ⚠️ THE NUMBER THAT MATTERS FOR THE GRADED PATH: an assessed mission is one
    // run's worth of targets, about 28 on a word-list chunk. If a competent
    // player cannot clear that many moves before dying, the mission is
    // unwinnable at the gate and Escape Key does not belong on the graded path.
    ok(avgMoves >= 28,
       `a dodging player clears ${avgMoves} moves on average — a 28-target mission is winnable`);

    // ⚠️ AND THE DEATH RATE OVER 200 STEPS IS **NOT** A FAILURE. 200 enemy steps
    // is 10.7 minutes at a 15 WPM gate — an endless arcade run, where the ramp is
    // supposed to win eventually. The first version of this block asserted
    // "survives more often than not" over that span, which measured the arcade
    // board and called it a mission bug. The mission-length claim is the one
    // that bears on the grade:
    // A real assessed mission: one word-list chunk, 28 targets, ends when cleared.
    const QUOTA_TARGETS = 28;
    let missionDeaths = 0;
    for (let seed = 1; seed <= 40; seed++) {
        choice = null;
        const r = runBoard({ seed, steps: 400, policy: safest, stopAfterMoves: QUOTA_TARGETS });
        if (r.diedAtStep) missionDeaths++;
    }
    console.log(`  [40 dodging movers, real ${QUOTA_TARGETS}-target mission: ${missionDeaths} died]`);
    ok(missionDeaths <= 4,
       `a dodging player clears a ${QUOTA_TARGETS}-target mission on at least 36 of 40 seeds ` +
       `(${40 - missionDeaths}/40)`);
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART C — the spawn rule that makes Part B true');
// ═════════════════════════════════════════════════════════════════════════════

{
    let onAxis = 0, tooClose = 0, total = 0;
    for (let seed = 1; seed <= 60; seed++) {
        const b = new EscapeBoard({ pool: pool(seed), rand: mulberry(seed * 13 + 3) });
        for (let s = 0; s < 60; s++) {
            const before = b.enemies.length;
            const px = b.player.x, py = b.player.y;
            b.step(1.4);
            if (b.enemies.length > before) {
                const e = b.enemies[b.enemies.length - 1];
                total++;
                if (e.x === px || e.y === py) onAxis++;
                const axisDist = e.x === px ? Math.abs(e.y - py) : Math.abs(e.x - px);
                if (axisDist < MIN_SPAWN_DISTANCE) tooClose++;
            }
            // Keep the player moving so the axis actually changes.
            const t = b.adjacent(b.player.x, b.player.y).map(c => b.grid[c.y][c.x]).find(Boolean);
            if (t) for (const ch of t) b.tryKey(ch);
        }
    }
    console.log(`  [${total} spawns observed]`);
    ok(total > 100, 'enough spawns observed to mean something');
    ok(onAxis === total,
       `EVERY enemy arrives on the player's row or column (${onAxis}/${total})`);
    ok(tooClose === 0,
       `and none within ${MIN_SPAWN_DISTANCE} cells — telegraphed, never an ambush (${tooClose})`);
}

{
    // Population and the hunter unlock ride the director's pressure, not a
    // display-only round counter.
    const b1 = new EscapeBoard({ pool: pool(5), rand: mulberry(9) });
    for (let s = 0; s < 60; s++) b1.step(1.0);
    const b2 = new EscapeBoard({ pool: pool(5), rand: mulberry(9) });
    for (let s = 0; s < 60; s++) b2.step(2.0);
    ok(b2.enemies.length > b1.enemies.length,
       `higher pressure means more enemies (${b1.enemies.length} at 1.0 vs ${b2.enemies.length} at 2.0)`);
    ok(b1.enemies.length <= MAX_ENEMIES && b2.enemies.length <= MAX_ENEMIES,
       'and it is capped, so the board never becomes unreadable');

}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART C2 — ⭐ THE HUNTER ACTUALLY SHOWS UP');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ HE DID NOT, AND THE OLD TEST HERE PASSED ANYWAY. It spawned a board at
// pressure 1.6 and asserted a hunter appeared — proving the MECHANISM while
// saying nothing about REACHABILITY. In real play pressure is flat at 1.0 through
// an assessed run and the run ends at the quota, so `pressure >= 1.25` was never
// met and the hunter existed only in arcade. Jake caught it by asking.
//
// ⚠️ THE LESSON GENERALISES: a test that constructs the precondition it is
// checking for proves the code can do the thing, not that the thing happens.

{
    ok(HUNTER_ROUND >= 4 && HUNTER_ROUND <= 6,
       `the hunter unlocks at round ${HUNTER_ROUND} — Jake's "around round 5 or 6"`);
    const stepAtUnlock = (HUNTER_ROUND - 1) * STEPS_PER_ROUND;
    console.log(`  [round ${HUNTER_ROUND} begins at enemy step ${stepAtUnlock}` +
                ` ≈ ${(stepAtUnlock * 3.2).toFixed(0)}s at a 15 WPM gate]`);

    const b = new EscapeBoard({ pool: pool(1), rand: mulberry(2) });
    ok(b.round === 1, 'a fresh board is round 1');
    for (let i = 0; i < STEPS_PER_ROUND; i++) b.step(1.0);
    ok(b.round === 2, 'and advances one round per STEPS_PER_ROUND enemy steps');

    // ⭐ REACHABILITY, AT THE PRESSURE AN ASSESSED RUN ACTUALLY USES.
    let sawHunter = 0, firstRounds = [];
    for (let seed = 1; seed <= 40; seed++) {
        const bb = new EscapeBoard({ pool: pool(seed), rand: mulberry(seed * 17 + 1) });
        let seen = null;
        for (let s2 = 0; s2 < 60; s2++) {
            bb.step(1.0);   // ⚠️ 1.0 — the flat mission pressure, not a hand-set 1.6
            if (!seen && bb.enemies.some(e => e.kind === 'hunter')) seen = bb.round;
            // keep the player moving so spawns keep coming
            const t = bb.adjacent(bb.player.x, bb.player.y).map(c => bb.grid[c.y][c.x]).find(Boolean);
            if (t) for (const ch of t) bb.tryKey(ch);
        }
        if (seen) { sawHunter++; firstRounds.push(seen); }
    }
    const avgRound = (firstRounds.reduce((a, z) => a + z, 0) / (firstRounds.length || 1)).toFixed(1);
    console.log(`  [40 boards at mission pressure 1.0: ${sawHunter} saw a hunter, ` +
                `first appearing around round ${avgRound}]`);
    ok(sawHunter >= 38,
       `a hunter appears at FLAT MISSION PRESSURE on at least 38 of 40 boards (${sawHunter}/40)`);
    ok(firstRounds.every(r => r >= HUNTER_ROUND),
       'and never before the unlock round');

    // And none before it, checked directly.
    let early = 0;
    for (let seed = 1; seed <= 40; seed++) {
        const bb = new EscapeBoard({ pool: pool(seed), rand: mulberry(seed * 3 + 5) });
        for (let s2 = 0; s2 < (HUNTER_ROUND - 1) * STEPS_PER_ROUND - 1; s2++) bb.step(2.0);
        if (bb.enemies.some(e => e.kind === 'hunter')) early++;
    }
    ok(early === 0,
       `no hunter before round ${HUNTER_ROUND} even at high pressure (${early}) — ` +
       'the unlock is the round, not the difficulty');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART D — keystrokes: every one counts, and a web never eats one');
// ═════════════════════════════════════════════════════════════════════════════

{
    const b = new EscapeBoard({ pool: pool(3), rand: mulberry(4) });
    const target = b.adjacent(b.player.x, b.player.y).map(c => b.grid[c.y][c.x]).find(Boolean);
    const results = Array.from(target).map(ch => b.tryKey(ch));
    ok(results.every(r => r.correct), 'typing a neighbour out is all correct keystrokes');
    ok(results[results.length - 1].kind === 'move', 'and the last one moves the player');
    ok(results.slice(0, -1).every(r => r.kind === 'progress'), 'the earlier ones report progress');

    // ⚠️ THE PROTOTYPE DEFECT: an unmatched key was dropped on the floor.
    const b2 = new EscapeBoard({ pool: pool(3), rand: mulberry(4) });
    const firsts = new Set(b2.adjacent(b2.player.x, b2.player.y)
        .map(c => b2.grid[c.y][c.x]).filter(Boolean).map(w => w[0]));
    const bogus = ['q', 'w', 'z', 'x', 'p'].find(c => !firsts.has(c));
    const r = b2.tryKey(bogus);
    ok(r.correct === false && r.kind === 'miss',
       'a key matching no neighbour is reported as a MISTAKE, not silently dropped');
    ok(b2.typed === '', 'and the buffer resets so the student is not stuck mid-word');

    // Case matters, exactly as in a drill.
    const b3 = new EscapeBoard({ pool: ['said', 'with', 'that', 'from'], rand: mulberry(6) });
    const t3 = b3.adjacent(b3.player.x, b3.player.y).map(c => b3.grid[c.y][c.x]).find(Boolean);
    ok(b3.tryKey(t3[0].toUpperCase()).correct === false,
       'a capital where a lowercase was expected is a mistake — case-sensitive, like the drills');
}

{
    // Webs: cost a NEW word, never freeze.
    const b = new EscapeBoard({ pool: pool(8), rand: mulberry(11) });
    const adj = b.adjacent(b.player.x, b.player.y).find(c => b.grid[c.y][c.x]);
    b.webs.push({ x: adj.x, y: adj.y, steps: 4 });
    const word = b.grid[adj.y][adj.x];
    let res = null;
    for (const ch of word) res = b.tryKey(ch);
    ok(res.kind === 'move' && res.webbed === true, 'stepping onto a web webs the player');
    ok(b.player.webWord && b.player.webWord !== word,
       'and the tear-free word is a NEW word, not the one just typed');

    const tear = b.player.webWord;
    const tearResults = Array.from(tear).map(ch => b.tryKey(ch));
    ok(tearResults.every(r => r.correct), 'every keystroke while webbed lands and counts');
    ok(tearResults[tearResults.length - 1].kind === 'tear-free', 'and the last one frees them');
    ok(b.player.webWord === null, 'the web is gone');

    // A wrong key while webbed is a mistake, not a swallowed keystroke.
    const b2 = new EscapeBoard({ pool: pool(8), rand: mulberry(12) });
    b2.player.webWord = 'asdf';
    const bad = b2.tryKey('j');
    ok(bad.correct === false && bad.kind === 'miss',
       'a wrong key while webbed is charged, not discarded');
    ok(b2.player.webWord === 'asdf', 'and the player is still webbed rather than freed by an error');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART D2 — webs stun hunters, and only hunters');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ v1.0.0 DECLARED `stunSteps`, DECREMENTED IT, AND NOTHING EVER SET IT. Dead
// code that looks like a feature is worse than missing code, because the next
// reader assumes the behaviour exists. Restoring it gives webs a second role and
// hands the student a real tactic: lead the hunter across a web.
{
    const b = new EscapeBoard({ pool: pool(4), rand: mulberry(21) });
    b.enemies.push({ kind: 'hunter', x: 5, y: 4, stunSteps: 0, axis: 'h', dir: -1 });
    b.webs.push({ x: 5, y: 4, steps: 4 });
    b.step(1.0);
    ok(b.enemies[0].stunSteps > 0, 'a hunter standing on a web is stunned');

    const before = { x: b.enemies[0].x, y: b.enemies[0].y };
    b.step(1.0);
    ok(b.enemies[0].x === before.x && b.enemies[0].y === before.y,
       'and does not move while stunned');

    // ⚠️ AND ONLY HUNTERS. A webbed kaiju stops being a lane threat, which is the
    // property the whole design rests on; a webbed spider webs itself into a
    // corner.
    const b2 = new EscapeBoard({ pool: pool(4), rand: mulberry(22) });
    b2.enemies.push({ kind: 'kaiju', x: 5, y: 4, stunSteps: 0, axis: 'h', dir: -1 });
    b2.webs.push({ x: 5, y: 4, steps: 4 });
    b2.step(1.0);
    ok(b2.enemies[0].stunSteps === 0, 'a kaiju on a web is NOT stunned');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART E — respawn does not spend a second shield');
// ═════════════════════════════════════════════════════════════════════════════

{
    let landedOnEnemy = 0;
    for (let seed = 1; seed <= 60; seed++) {
        const b = new EscapeBoard({ pool: pool(seed), rand: mulberry(seed * 5) });
        for (let s = 0; s < 40; s++) b.step(2.0);
        b.respawn();
        if (b.caughtBy()) landedOnEnemy++;
    }
    ok(landedOnEnemy === 0,
       `60 respawns onto a crowded board, none landing on an enemy (${landedOnEnemy}) — ` +
       'a fixed centre would have been where the swarm is');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART F — the cadence is the shell\'s, and the game is a throughput game now');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ THE POINT OF THE ROW/COLUMN RULE, STATED AS ARITHMETIC. Moving costs one
// typed word. Enemies arrive on the player's axis every other enemy step, and an
// enemy step is the time a gate-speed typist needs for one word. So survival
// demands roughly gate-rate typing, continuously — which is what makes the WPM
// Escape Key reports a typing measurement rather than a patience measurement.
{
    const d = new GameDirector({ targets: pool(1), targetWPM: 15, minAccuracy: 85, endless: true });
    const stepMs = enemyStepMs(d.avgChars, d.targetWPM, d.pressure);
    ok(Math.abs(stepMs - 3200) < 1, `one enemy step is ${Math.round(stepMs)}ms at a 15 WPM gate`);
    const wordsPerMinute = 60000 / stepMs;
    ok(Math.abs(wordsPerMinute * 4 / 5 - 15) < 0.1,
       'which is exactly gate-rate work per enemy step — one word, one step');
    const faster = enemyStepMs(d.avgChars, 25, d.pressure);
    ok(faster < stepMs, 'a higher gate tightens the cadence automatically');
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} failed`);
if (fail) { fails.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
