// tests/game-shell-test.mjs v1.0.0 — DOES A CHILD WHO TYPES AT THE GATE PASS
// THE GAME? Round 82 (Victor).
//
// ⚠️⚠️ THIS HARNESS EXISTS BECAUSE THE FIRST DRAFT OF game-shell.js FAILED
// EVERY STUDENT AND LOOKED CORRECT. MISSION_PRESSURE was 0.75 on the reasoning
// that a passing student deserves headroom; because the clock is wall-clock, a
// push rate below the gate caps achievable WPM below the gate, so the gate was
// mathematically unreachable and every child would have retried forever. Part A
// pins that arithmetic so it cannot come back as a "readability" tweak.
//
// ⚠️ Rule 10 STATUS: **NOT YET SATISFIED, AND SAYING SO IS THE POINT.** Rule 10
// wants a harness that fails against real production data before a fix and
// passes after. The lesson documents live in Firestore and are not in the repo,
// so Parts B–E drive a FIXTURE ladder shaped like the real one (a 2-key home-row
// drill, a word list, a sentence step) through the REAL chunkSequence() from
// run-grade.js and the REAL safeGroup() from drill-filter.js. That covers the
// code paths and the arithmetic. It does NOT prove the numbers against the
// authored corpus, because chunk length and word-length distribution vary by
// step type and unit.
// ⚠️ TO CLOSE IT: Admin → Lessons → Export JSON, drop the payload at
// tests/fixtures/lessons-export.json, and Part F picks it up automatically and
// asserts across every authored lesson. Until that file exists Part F SKIPS
// LOUDLY rather than passing, because a skipped check that prints "ok" is how
// this project has been bitten before.

import {
    GameDirector, MISSION_PRESSURE, MIN_ON_SCREEN, QUEUE_DEPTH, PRESSURE_CEILING,
    spawnIntervalMs, travelMs, queueDepthFor, netWPM, accuracyPct,
    targetsFromSequence, avgTargetChars, arcadeKeySet, makeArcadeTargets,
    missionConfigFromRun, charsPerSecondFor, GAME_SHELL_VERSION,
    enemyStepMs, targetTimeMs,
} from '../game-shell.js';
import { chunkSequence, gatesForRun } from '../run-grade.js';
import { firstBlocked } from '../drill-filter.js';
import { buildFingerMap, getFingerInfo, FINGER_COLORS, FINGER_NAMES } from '../keyboard.js';
import { readFileSync, existsSync } from 'node:fs';

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) {
    if (cond) { pass++; } else { fail++; fails.push(label); }
    console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${label}`);
}
function near(a, b, tol, label) {
    ok(Math.abs(a - b) <= tol, `${label} (got ${typeof a === 'number' ? a.toFixed(2) : a}, want ~${b})`);
}

// ═════════════════════════════════════════════════════════════════════════════
// THE SIMULATED TYPIST
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ A TYPIST IS A RATE AND AN ERROR PROBABILITY, AND IT TYPES IN WALL TIME.
// The whole point is to run the director against a clock we control, so `nowMs`
// advances in fixed steps and the typist emits keystrokes when its own next-key
// time arrives. It types the OLDEST live target first, which is what a child
// does and what every one of the three views auto-locks to.
//
// ⚠️ `wpm` HERE IS GROSS TYPING RATE, characters produced per unit time — NOT the
// net WPM the director reports back. A typist at 15 WPM with 10% errors reports
// a net WPM below 15, exactly as a real student does.
function runSim({ cfg, typistWPM, errorRate = 0, maxMs = 600000, stepMs = 20, rand = mulberry(7) }) {
    const d = new GameDirector(cfg);
    const live = [];                       // { text, typed, diesAt }
    const cps = charsPerSecondFor(typistWPM);
    const msPerKey = 1000 / cps;
    let now = 0;
    let nextKeyAt = 1000;                  // a second of reading before the first key
    let leakEvents = 0;

    while (!d.over && now < maxMs) {
        // Spawns
        while (d.spawnDue(now, live.length)) {
            const t = d.nextTarget(now);
            if (!t) break;
            live.push({ text: t.text, typed: '', diesAt: now + t.lifetimeMs });
            if (live.length > 40) break;   // runaway guard
        }

        // Leaks
        for (let i = live.length - 1; i >= 0; i--) {
            if (now >= live[i].diesAt) {
                d.leaked(live[i].text, now);
                live.splice(i, 1);
                leakEvents++;
            }
        }
        if (d.over) break;

        // Keystrokes
        while (nextKeyAt <= now) {
            const target = live[0];
            if (!target) { nextKeyAt = now + msPerKey; break; }
            const wrong = rand() < errorRate;
            d.keyResult(!wrong, now);
            if (!wrong) {
                target.typed += target.text[target.typed.length];
                if (target.typed.length >= target.text.length) {
                    d.cleared(target.text, now);
                    live.shift();
                }
            }
            nextKeyAt += msPerKey;
        }

        if (!d.endless && d.quotaMet) { d.end(now); break; }
        now += stepMs;
    }
    if (!d.over) d.end(now);
    return { report: d.report(now), leakEvents, elapsed: now, director: d };
}

// Deterministic PRNG so a failure is reproducible.
function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// ═════════════════════════════════════════════════════════════════════════════
console.log(`\ngame-shell.js v${GAME_SHELL_VERSION}\n`);
console.log('PART A — the pressure arithmetic that failed everybody');
// ═════════════════════════════════════════════════════════════════════════════

ok(MISSION_PRESSURE >= 1.0,
   'MISSION_PRESSURE is at least 1.0 — below it, the gate is unreachable');
ok(MIN_ON_SCREEN >= 1,
   'MIN_ON_SCREEN is at least 1 — at 0, a fast student idles and is capped at the gate');

{
    // The original defect, stated as arithmetic.
    const bad = spawnIntervalMs(4, 15, 0.75) / 1000;
    const bestWPM = (4 / bad) * 12;
    near(bestWPM, 11.25, 0.1, 'at pressure 0.75 the BEST achievable WPM is 11.25 against a 15 gate');
    ok(bestWPM < 15, 'which is below the gate — this is the bug Part A guards');

    const good = spawnIntervalMs(4, 15, MISSION_PRESSURE) / 1000;
    near((4 / good) * 12, 15, 0.1, 'at shipped pressure, pushed work alone equals the gate exactly');
}

{
    // Longer targets take proportionally longer, at the same WPM. This is the
    // reason avgTargetChars() is measured rather than assumed.
    const short = spawnIntervalMs(4, 15, 1);
    const long  = spawnIntervalMs(8, 15, 1);
    near(long / short, 2, 0.001, 'interval scales linearly with target length');
    ok(spawnIntervalMs(4, 30, 1) < spawnIntervalMs(4, 15, 1),
       'a higher gate means a shorter interval');
    near(travelMs(short, QUEUE_DEPTH) / short, QUEUE_DEPTH, 0.001,
         'lifetime is queueDepth intervals');
    near(queueDepthFor(1.0), QUEUE_DEPTH, 0.001, 'queue depth is full at gate pressure');
    ok(queueDepthFor(PRESSURE_CEILING) < QUEUE_DEPTH,
       'queue depth tightens as pressure climbs');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART B — the formulas are learn.js\'s, character for character');
// ═════════════════════════════════════════════════════════════════════════════

// learn.js netWPM():   round(((chars - mistakes) / 5) / (stepSeconds / 60))
// learn.js accuracyPct(): round(((chars - mistakes) / chars) * 100)
ok(netWPM(150, 0, 60) === 30, 'netWPM: 150 clean chars in 60s is 30 WPM');
ok(netWPM(150, 15, 60) === 27, 'netWPM subtracts mistakes as characters');
ok(netWPM(100, 0, 0) === 0, 'netWPM is 0 at zero seconds, not Infinity');
ok(accuracyPct(0, 0) === 100, 'accuracy with no keystrokes is 100, not NaN');
ok(accuracyPct(100, 15) === 85, 'accuracy: 15 wrong of 100 is 85%');

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART C — the word source comes from the run, and stays clean');
// ═════════════════════════════════════════════════════════════════════════════

{
    // Shaped like learn.js's buildSequence() output for each step type.
    const drill    = 'asdf jkl; fdsa ;lkj asdf jkl;'.split('');
    const wordList = 'said with that this from have'.split('');
    const passage  = 'The cat sat.\nThe dog ran.\tHome.'.split('');

    ok(targetsFromSequence(drill).length === 6, 'a drill sequence cuts into its groups');
    near(avgTargetChars(targetsFromSequence(drill)), 4, 0.001, 'home-row groups average 4 chars');
    near(avgTargetChars(targetsFromSequence(wordList)), 4, 0.001, 'that word list averages 4 chars');

    const p = targetsFromSequence(passage);
    ok(p.every(t => !/\s/.test(t)), 'newlines and tabs are delimiters, never inside a target');
    ok(!p.includes(''), 'no empty targets from runs of whitespace');
    ok(targetsFromSequence([]).length === 0, 'an empty sequence yields no targets');
}

{
    // Chunking is run-grade.js's, so a game mission is exactly one run's worth.
    const seq = 'said with that this from have they were said with that this from have they were'.split('');
    const chunks = chunkSequence(seq);
    ok(chunks.length >= 1, 'chunkSequence still runs (imported, not copied)');
    const run = { type: 'word_list', sequence: chunks[0] };
    const gates = gatesForRun(run, { minAccuracy: 85, minWPM: 15 });
    const cfg = missionConfigFromRun(run, gates, { minWPM: 15 });
    ok(cfg.targetWPM === 15 && cfg.minAccuracy === 85, 'mission config takes the run\'s real gates');
    ok(cfg.quotaChars === cfg.targets.reduce((n, t) => n + t.length, 0),
       'the quota is the run\'s own character count — the game is the size of the run it replaces');
    ok(cfg.endless === false && cfg.shields === 3, 'an assessed mission has a quota and three shields');
}

{
    // A drill step is accuracy-only. The game needs a speed number anyway, and
    // it must fall back rather than divide by null.
    const run = { type: 'key_random', sequence: 'asdf jkl;'.split('') };
    const gates = gatesForRun(run, { minAccuracy: 85, minWPM: 15 });
    ok(gates.minWPM === null, 'gatesForRun really does return null for a drill (assumption checked)');
    const cfg = missionConfigFromRun(run, gates, { minWPM: 15 });
    ok(cfg.targetWPM === 15, 'an accuracy-only run falls back to the lesson WPM, never null');
}

{
    // Arcade key set: only what the student has unlocked.
    const lessons = [
        { id: 'u1_l1', availableKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'] },
        { id: 'u1_l2', availableKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], newKeys: ['e', 'i'] },
        { id: 'u2_l1', availableKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'e', 'i'], newKeys: ['r', 'u'] },
        { id: 'u3_l1', availableKeys: ['q', 'z', 'x', 'p'], newKeys: ['q', 'z'] },
    ];
    const beginner = arcadeKeySet(lessons, {});
    ok(beginner.length === 8 && !beginner.includes('e'),
       'a student who has passed nothing gets lesson 1 only — home row, no reaches');
    ok(beginner.length > 0, 'and never an empty key set, which would be an arcade with no letters');

    const mid = arcadeKeySet(lessons, { u1_l1: { passed: true }, u1_l2: { passed: true } });
    ok(mid.includes('e') && mid.includes('r'),
       'two lessons passed unlocks through the lesson they are now on');
    ok(!mid.includes('q'), 'and nothing beyond it — no keys the student has never met');

    // And the generated groups go through the real filter.
    const rand = mulberry(3);
    const targets = makeArcadeTargets(beginner, 4000, 4, rand);
    const dirty = targets.filter(t => firstBlocked(t) !== '');
    ok(dirty.length === 0,
       `4000 arcade groups from the home row, none blocked by drill-filter (found ${dirty.length})`);
    ok(targets.every(t => t.length === 4), 'arcade groups are all the requested size');
    ok(makeArcadeTargets([], 10).length === 0, 'no key set yields no targets rather than a crash');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART D — a child who types at the gate passes; one who does not, does not');
// ═════════════════════════════════════════════════════════════════════════════

// A realistic assessed run: a word-list chunk at the default gates.
const RUN_TEXT = ('said with that this from have they were when your said with that this ' +
                  'from have they were when your said with that this from have they were').split('');
const RUN = { type: 'word_list', sequence: chunkSequence(RUN_TEXT)[0] };
const GATES = gatesForRun(RUN, { minAccuracy: 85, minWPM: 15 });
const MISSION = missionConfigFromRun(RUN, GATES, { minWPM: 15 });

console.log(`  [mission: ${MISSION.targets.length} targets, ${MISSION.quotaChars} chars, ` +
            `gate ${MISSION.targetWPM} WPM / ${MISSION.minAccuracy}%, ` +
            `interval ${(spawnIntervalMs(avgTargetChars(MISSION.targets), 15, 1) / 1000).toFixed(2)}s]`);

{
    const r = runSim({ cfg: { ...MISSION }, typistWPM: 15, errorRate: 0.02 }).report;
    console.log(`  [at-gate typist: ${r.wpm} WPM, ${r.acc}%, ${r.hits} leaks, ` +
                `${r.targetsCleared} cleared, quota ${r.quotaMet}]`);
    ok(r.quotaMet, 'a typist at exactly the gate speed CLEARS THE MISSION');
    ok(r.shieldsLeft > 0, 'with shields left');
    ok(r.metAccuracy, 'and meets the accuracy gate at a realistic 2% error rate');
    ok(r.wpm >= MISSION.targetWPM - 1,
       'and their reported WPM is their real speed, within rounding');
}

{
    const r = runSim({ cfg: { ...MISSION }, typistWPM: 25, errorRate: 0.02 }).report;
    console.log(`  [fast typist: ${r.wpm} WPM, ${r.acc}%, ${r.hits} leaks]`);
    ok(r.quotaMet && r.hits === 0, 'a 25 WPM typist clears it without losing a shield');
    ok(r.wpm >= 22,
       'AND READS BACK ABOVE 22 WPM — the on-demand floor is working; a pure metronome ' +
       'would have capped them at the 15 WPM gate and made A🔥 impossible');
}

{
    const r = runSim({ cfg: { ...MISSION }, typistWPM: 40, errorRate: 0.01 }).report;
    ok(r.wpm >= 30, `a 40 WPM typist reads back above 30 (got ${r.wpm}) — no artificial ceiling`);
    ok(r.wpm >= MISSION.targetWPM * 1.5,
       'and clears 1.5 × the gate, so A🔥 is reachable in a game');
}

{
    const r = runSim({ cfg: { ...MISSION }, typistWPM: 9, errorRate: 0.02 }).report;
    console.log(`  [slow typist: ${r.wpm} WPM, ${r.hits} leaks, quota ${r.quotaMet}]`);
    ok(!r.quotaMet, 'a typist well under the gate does NOT clear the mission');
    ok(r.hits >= 3 && r.shieldsLeft === 0, 'they run out of shields — they lose the game, not the grade');
    ok(!r.passed, 'and the report says so');
}

{
    // Accuracy has to be able to fail on its own.
    const r = runSim({ cfg: { ...MISSION }, typistWPM: 30, errorRate: 0.30 }).report;
    console.log(`  [sloppy fast typist: ${r.wpm} WPM, ${r.acc}%]`);
    ok(!r.metAccuracy, 'a fast but sloppy typist fails the ACCURACY gate');
    ok(!r.passed, 'and does not pass, however fast they were');
    ok(r.mistakes > 0 && r.chars > r.mistakes, 'mistakes are actually being counted');
}

{
    // ⚠️ THE PROTOTYPE DEFECT: all three of Gemini's games discarded a keystroke
    // that matched nothing, so a masher could sit at 100% accuracy forever.
    const d = new GameDirector({ ...MISSION });
    for (let i = 0; i < 20; i++) d.keyResult(false, 1000 + i * 100);
    ok(d.report(3000).acc === 0, 'twenty keys that hit nothing read 0% accuracy, not 100%');
    ok(d.report(3000).chars === 20, 'and are all counted as keystrokes');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART E — the game is never HARDER than the drill at the same gate');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ THE SPACE-BAR FORGIVENESS, ASSERTED AS A DIRECTION. A game does not charge
// the delimiter, so the same text is worth ~18% fewer characters than in the
// drill. That is accepted, and it is accepted ONLY because it is forgiving. A
// change that inverted it — a game demanding MORE than the drill it replaced —
// fails here instead of failing children.
{
    const targets = targetsFromSequence(RUN.sequence);
    const gameChars = targets.reduce((n, t) => n + t.length, 0);
    const drillChars = RUN.sequence.length;   // includes the spaces
    ok(gameChars <= drillChars,
       `the game asks for no more characters than the drill (${gameChars} vs ${drillChars})`);
    const forgiveness = 1 - gameChars / drillChars;
    console.log(`  [forgiveness: ${(forgiveness * 100).toFixed(1)}% fewer characters than the typed run]`);
    ok(forgiveness < 0.25,
       'and the forgiveness is under 25% — beyond that the game is a different assessment');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART F — arcade mode: it ramps, and it ends');
// ═════════════════════════════════════════════════════════════════════════════

{
    const rand = mulberry(11);
    const cfg = {
        targets: makeArcadeTargets(['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], 300, 4, rand),
        targetWPM: 15, minAccuracy: 85, shields: 3, endless: true, rand,
    };
    const d = new GameDirector({ ...cfg });
    const p0 = d.pressure;
    for (let i = 0; i < 30; i++) d.cleared('asdf', 1000);
    const p30 = d.pressure;
    ok(p30 > p0, `arcade pressure climbs with targets cleared (${p0.toFixed(2)} → ${p30.toFixed(2)})`);
    ok(d.intervalMs < spawnIntervalMs(4, 15, p0), 'so the interval genuinely shortens');
    for (let i = 0; i < 2000; i++) d.cleared('asdf', 1000);
    ok(d.pressure <= PRESSURE_CEILING, 'and is capped, so it cannot reach a zero interval');

    // A real arcade run must terminate rather than run forever.
    const sim = runSim({ cfg: { ...cfg }, typistWPM: 20, errorRate: 0.03, maxMs: 900000 });
    console.log(`  [arcade @20 WPM: score ${sim.report.score}, ` +
                `${sim.report.targetsCleared} cleared, ${(sim.elapsed / 1000).toFixed(0)}s]`);
    ok(sim.report.targetsCleared > 20, 'an arcade run at 20 WPM lasts a decent while');
    ok(sim.director.over, 'and it ENDS — the ramp eventually beats the student');

    const slow = runSim({ cfg: { ...cfg }, typistWPM: 10, errorRate: 0.03, maxMs: 900000 });
    ok(slow.report.targetsCleared < sim.report.targetsCleared,
       'a slower typist scores lower — the board ranks typing, not patience');
    ok(sim.report.score > slow.report.score, 'and the score agrees');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART G — the clock: wall time, hidden tabs, and no idle subtraction');
// ═════════════════════════════════════════════════════════════════════════════

{
    const d = new GameDirector({ ...MISSION });
    ok(d.report(50000).seconds === 0,
       'no keystroke yet: fifty seconds of staring at the screen is not charged');
    d.keyResult(true, 10000);
    near(d.report(20000).seconds, 10, 0.01, 'the clock starts at the FIRST keystroke');

    // ⚠️ Dead air between spawns IS charged. This is the whole reason the game
    // cannot use learn.js's idle-aware stepSeconds.
    d.keyResult(true, 30000);
    near(d.report(30000).seconds, 20, 0.01,
         'twenty seconds and two keys reads 20 seconds — game dead air is charged');
    // ⚠️ THE ASSERTION HERE WAS `< 1` AND IT WAS THE TEST THAT WAS WRONG, not the
    // clock: (2 / 5) / (20 / 60) = 1.2, which learn.js's Math.round makes 1. The
    // point being pinned is that it is not 60 — an idle-subtracting clock would
    // have divided 2 characters by the ~0.4 s spent typing them.
    ok(d.report(30000).wpm <= 1, 'so two characters in twenty seconds reads 1 WPM, not 60');
}

{
    const d = new GameDirector({ ...MISSION });
    d.keyResult(true, 1000);
    d.pause(2000);
    d.resume(62000);            // a minute in a hidden tab
    d.keyResult(true, 63000);
    near(d.report(63000).seconds, 2, 0.01, 'a hidden tab is not charged to the student');
    d.pause(64000);
    near(d.report(120000).seconds, 3, 0.01, 'and a report taken while paused does not drift');
    d.resume(120000);
    d.end(121000);
    near(d.report(500000).seconds, 4, 0.01, 'after end(), the number is frozen');
}

{
    const d = new GameDirector({ ...MISSION });
    d.keyResult(true, 1000);
    d.end(11000);
    const before = d.report(11000);
    d.keyResult(true, 12000);
    d.cleared('said', 12000);
    d.leaked('with', 12000);
    const after = d.report(12000);
    ok(before.chars === after.chars && before.targetsCleared === after.targetsCleared
       && before.hits === after.hits,
       'nothing is accounted after the game is over');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART H — cadence games: one formula, two vocabularies');
// ═════════════════════════════════════════════════════════════════════════════

ok(enemyStepMs === spawnIntervalMs && enemyStepMs === targetTimeMs,
   'enemyStepMs and spawnIntervalMs are ALIASES of one function, not two copies');

{
    // ⚠️ THE MUNCHER PROTOTYPE'S DEFECT, STATED AS ARITHMETIC. In Muncher one
    // typed word buys one cell of movement, so keeping pace with an enemy
    // requires typing a whole word inside one enemy step.
    const protoStepMs = 1200;
    const impliedWPM = 12 * 4 / (protoStepMs / 1000);
    near(impliedWPM, 40, 0.01,
         'the prototype\'s 1200ms step demanded 40 WPM just to keep pace with an enemy');
    ok(impliedWPM > 15 * 2.5,
       'which is over 2.5x the default gate — the unfairness was one constant');

    near(enemyStepMs(4, 15, 1) / 1000, 3.2, 0.01,
         'the shipped step at a 15 WPM gate and 4-char groups is 3.2s');
    ok(enemyStepMs(4, 25, 1) < enemyStepMs(4, 15, 1),
       'a Unit 7 student at a 25 WPM gate meets a faster board, automatically');
    // A student typing at the gate moves at exactly enemy pace: that is the
    // definition the constant is derived from, so it is worth asserting directly.
    const stepS = enemyStepMs(4, 15, 1) / 1000;
    near((4 / stepS) * 12, 15, 0.01, 'a gate-speed typist moves at exactly one cell per enemy step');
}

{
    // The hit path is shared, and there is only ONE counter for it.
    const d = new GameDirector({ ...MISSION });
    d.keyResult(true, 1000);
    d.hit(2000);
    const r = d.report(2000);
    ok(r.hits === 1 && r.shieldsLeft === 2, 'hit() spends one shield and counts once');
    ok(!('leaks' in r),
       'and the report has no second field for the same count — one quantity, one record');
    d.leaked('word', 3000);
    ok(d.report(3000).hits === 2, 'leaked() is a thin alias onto the same counter');
    d.hit(4000);
    ok(d.over && d.report(4000).shieldsLeft === 0, 'the third hit ends the game');
}

{
    // Muncher's board needs four adjacent cells with DISTINCT FIRST CHARACTERS.
    // A pool that cannot supply four is a lesson-configuration problem, and the
    // game must be able to detect it rather than loop or silently duplicate.
    const home = makeArcadeTargets(['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], 200, 4, mulberry(5));
    const distinct = new Set(home.map(w => w[0])).size;
    ok(distinct >= 4,
       `a home-row pool offers ${distinct} distinct first characters — enough for four neighbours`);
    const twoKey = makeArcadeTargets(['a', 's'], 60, 4, mulberry(5));
    ok(new Set(twoKey.map(w => w[0])).size < 4,
       'a two-key lesson CANNOT — the warning path in game-muncher.js is reachable, not theoretical');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART I — Rule 10: the real corpus');
// ═════════════════════════════════════════════════════════════════════════════

const FIXTURE = new URL('./fixtures/lessons-export.json', import.meta.url);
if (!existsSync(FIXTURE)) {
    console.log('  SKIP  no tests/fixtures/lessons-export.json — Rule 10 is NOT satisfied.');
    console.log('        Admin → Lessons → Export JSON, save it there, and rerun.');
    console.log('        ⚠️ Everything above proves the ARITHMETIC and the CODE PATHS.');
    console.log('        It does not prove the numbers against the authored lessons.');
} else {
    const payload = JSON.parse(readFileSync(FIXTURE, 'utf8'));
    const lessons = payload.lessons || payload;
    console.log(`  [export ${payload.exportedAt || 'undated'}, exporter ` +
                `v${payload.exporterVersion || '?'}, ${payload.lessonCount ?? lessons.length} lessons]`);

    // ⚠️⚠️ NINE SEEDS PER RUN, AND THE ASSERTION IS "NOT SYSTEMATICALLY
    // UNCLEARABLE" RATHER THAN "NEVER FAILS".
    //
    // The first version of this Part ran ONE fixed seed per run and demanded a
    // gate-speed typist clear every authored run. ⚠️ THAT IS THE THIRD TIME IN
    // THIS ROUND AN ASSERTION MEASURED THE WRONG THING — after asserting survival
    // over the wrong span (escape-board Part B) and after asserting a mechanism
    // instead of its reachability (the hunter).
    //
    // Two faults. One seed cannot tell a run that is IMPOSSIBLE from a run that is
    // merely HARD, and those need opposite responses — a code fix versus nothing
    // at all. And demanding a 100% win rate from a typist at EXACTLY the gate is
    // not the design goal: such a student should USUALLY clear it and will
    // sometimes lose and retry, exactly as on an ordinary typed run. What must
    // never exist is a run nobody at the gate can beat.
    const SEEDS = 9;
    let checked = 0, trials = 0, failures = 0;
    const starved = [];
    const perRun = [];

    function eligibleRuns() {
        const out = [];
        for (const lesson of lessons) {
            const lg = lesson.gates || {};
            for (const step of (lesson.steps || [])) {
                if (!['word_list', 'sentence_list', 'passage'].includes(step.type)) continue;
                const seq = step.type === 'word_list' ? (step.words || []).join(' ').split('')
                          : step.type === 'sentence_list' ? (step.sentences || []).join(' ').split('')
                          : (step.text || '').split('');
                for (const chunk of chunkSequence(seq)) {
                    const run = { ...step, sequence: chunk };
                    out.push({
                        id: `${lesson.id}/${step.id}`,
                        cfg: missionConfigFromRun(run, gatesForRun(run, lg), lg),
                    });
                }
            }
        }
        return out;
    }

    const eligible = eligibleRuns();
    for (const { id, cfg } of eligible) {
        if (!cfg.targets.length) { starved.push(id); continue; }
        let cleared = 0;
        for (let s = 1; s <= SEEDS; s++) {
            const r = runSim({ cfg: { ...cfg }, typistWPM: cfg.targetWPM,
                               errorRate: 0.02, rand: mulberry(s) }).report;
            trials++;
            if (r.quotaMet) cleared++; else failures++;
        }
        perRun.push({ id, cleared, gate: cfg.targetWPM, targets: cfg.targets.length });
        checked++;
    }

    console.log(`  [${checked} real runs, ${SEEDS} seeds each = ${trials} trials]`);
    ok(starved.length === 0,
       `every game-eligible step yields targets (${starved.slice(0, 3).join(', ') || 'all do'})`);

    // ⭐ THE ONE THAT MATTERS: no run is unbeatable at its own gate.
    const unclearable = perRun.filter(r => r.cleared < Math.ceil(SEEDS / 2));
    ok(unclearable.length === 0,
       'NO authored run is systematically unclearable at its own gate ' +
       `(${unclearable.map(r => `${r.id} ${r.cleared}/${SEEDS}`).slice(0, 4).join(', ') || 'none'})`);

    const rate = trials ? failures / trials : 0;
    console.log(`  [gate-speed typist lost ${failures}/${trials} trials — ${(rate * 100).toFixed(1)}%]`);
    ok(rate < 0.05,
       `a gate-speed typist clears at least 95% of trials corpus-wide ` +
       `(${(100 - rate * 100).toFixed(1)}%)`);

    const worst = perRun.slice().sort((a, b) => a.cleared - b.cleared).slice(0, 3);
    console.log('  [tightest runs: ' +
                worst.map(r => `${r.id} ${r.cleared}/${SEEDS} @${r.gate}wpm`).join(', ') + ']');

    // ⚠️ AND THE GATE MUST STILL DISCRIMINATE. A buffer generous enough to carry a
    // slow typist would have turned the mission into a participation trophy, so
    // the same corpus is driven at 60% of each run's own gate. QUEUE_DEPTH was
    // raised from 3 to 4 on the strength of this pair of numbers, not on one.
    let slowTrials = 0, slowCleared = 0;
    for (const { cfg } of eligible) {
        if (!cfg.targets.length) continue;
        const slow = Math.max(5, Math.round(cfg.targetWPM * 0.6));
        for (let s = 1; s <= 3; s++) {
            const r = runSim({ cfg: { ...cfg }, typistWPM: slow,
                               errorRate: 0.02, rand: mulberry(s + 50) }).report;
            slowTrials++;
            if (r.quotaMet) slowCleared++;
        }
    }
    console.log(`  [60%-of-gate typist cleared ${slowCleared}/${slowTrials}]`);
    ok(slowCleared === 0,
       `a typist at 60% of the gate clears NOTHING (${slowCleared}/${slowTrials}) — ` +
       'the buffer stopped punishing rounding error without letting anyone through');
}

// ═════════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART J — the finger map is keyboard.js\'s, and covers what a book contains');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ game-deadline.js v1.1.0 CARRIED ITS OWN `FINGER_MAP` AND IT WAS THE WORSE
// COPY OF ONE THAT ALREADY EXISTED. It covered letters, digits and a little
// punctuation; everything else — `!`, `?`, `"`, `:`, all over a book lesson —
// fell through to `undefined`, and `FINGER_MAP[...] || 0` turned that into tube 0,
// the left pinky. So in a prose lesson the game confidently launched from the
// WRONG FINGER, and the finger tubes are the single best thing in that game.
{
    const fm = buildFingerMap('qwerty');
    const idx = ch => {
        const info = getFingerInfo(fm, ch);
        if (!info || !info.finger) return null;
        const i = FINGER_NAMES.indexOf(info.finger);
        return i === -1 ? null : i;
    };

    ok(idx('a') === 0 && idx(';') === 7, 'home row anchors land on the right pinkies');
    ok(idx('f') === 3 && idx('j') === 4, 'and the index fingers');
    ok(idx('A') === idx('a'), 'a capital resolves to the same finger as its base key');

    // The characters that broke the old map. Every one of these appears in the
    // punctuation of an ordinary children's book.
    const bookChars = ['!', '?', '"', ':', ';', ',', '.', "'", '-', '(', ')'];
    const unmapped = bookChars.filter(c => idx(c) === null);
    ok(unmapped.length === 0,
       `every common book punctuation mark maps to a real finger (unmapped: ${unmapped.join(' ') || 'none'})`);
    // ⚠️ THE FIRST VERSION OF THIS CHECK ASSERTED THAT NO PUNCTUATION LANDS ON
    // THE LEFT PINKY, AND THE ASSERTION WAS WRONG, NOT THE MAP: `!` is Shift+1,
    // which really is the left pinky. Asserting "not pinky" would have forced a
    // wrong answer to satisfy a wrong test. The real claim is that the mapping is
    // DISTRIBUTED rather than degenerate, plus spot-checks with known answers.
    ok(idx('!') === 0, '`!` is Shift+1 and correctly IS the left pinky');
    ok(idx(',') === 5, '`,` is the right middle finger');
    ok(idx('.') === 6, '`.` is the right ring finger');
    ok(idx('?') === 7, '`?` is Shift+/ on the right pinky');
    ok(new Set(bookChars.map(idx)).size >= 4,
       `and the punctuation spreads across ${new Set(bookChars.map(idx)).size} different fingers — ` +
       'the old || 0 fallback collapsed the unmapped ones onto tube 0');

    // ⚠️ SPACE HAS NO TUBE AND MUST RETURN null, NOT 0. Returning 0 is what
    // taught the left pinky to fire the space bar.
    ok(idx(' ') === null, 'space is a thumb character and has no finger tube');

    ok(FINGER_NAMES.length === 8, 'eight tubes, eight finger names');
    ok(FINGER_NAMES.every(n => !!FINGER_COLORS[n]),
       'and every one of them has a colour in keyboard.js — the game does not define its own');
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} failed`);
if (fail) { fails.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
