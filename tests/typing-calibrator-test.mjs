// typing-calibrator-test.mjs v1.0.0 — ROADMAP 118a. Round 118 (Underwood).
//
// ⚠️⚠️ THE FAILURE THIS FILE EXISTS TO CATCH IS NOT "DOES IT ADAPT". It is
// **"CAN A SLOW CHILD EVER END UP WORSE OFF THAN THEY ARE TODAY"** — the shape
// most bad difficulty adjustment takes, where a lucky streak ratchets the game
// up and it cannot come back down, and a child experiences it as cheating.
//
// ⚠️ AND THE SECOND ONE, WHICH ROUND 117 PAID FOR: a simulation that invents its
// own pacing is not a measurement. Part F drives the REAL `GameDirector`.

import {
    TypingCalibrator, budgetScale, median, DIFFICULTY,
    FLOOR_WPM, ACQUIRE_CAP_MS, MIN_SAMPLES, MAX_BELIEVABLE_WPM,
} from '../typing-calibrator.js';
import { GameDirector, spawnIntervalMs } from '../game-shell.js';
import { SHATTER_WORDS } from '../shatter-words.js';

let pass = 0, fail = 0; const fails = [];
const ok = (c, l) => { if (c) pass++; else { fail++; fails.push(l); } };

/**
 * Type one target at a steady rate. ⚠️ RETURNS THE CLOCK, so a caller can build
 * a run rather than a single event.
 */
function typeOne(cal, id, text, t0, { acquireMs, msPerKey, onScreen = 1 }) {
    cal.spawned(id, text.length, t0, onScreen);
    let t = t0 + acquireMs;
    for (let i = 0; i < text.length; i++) { cal.keyed(id, t); t += msPerKey; }
    cal.finished(id, t);
    return t;
}

const wpmToMsPerKey = wpm => 60000 / (wpm * 5);

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nA — IT MEASURES SPEED AND ACQUISITION SEPARATELY');
// ═════════════════════════════════════════════════════════════════════════════
{
    const cal = new TypingCalibrator();
    let t = 0;
    for (let i = 0; i < 8; i++) {
        t = typeOne(cal, i, 'sunlight', t + 100,
                    { acquireMs: 900, msPerKey: wpmToMsPerKey(30) });
    }
    ok(cal.confident, 'eight clean targets is enough to believe a number');
    ok(Math.abs(cal.wpm - 30) < 3,
       `⭐ burst speed recovers the typist's real rate (${cal.wpm.toFixed(1)} of 30)`);
    ok(Math.abs(cal.acquireMs - 900) < 60,
       `⚠️ and acquisition is measured, not folded into it (${cal.acquireMs}ms of 900)`);

    // ⭐⭐ THE POINT OF THE DECOMPOSITION. Same fingers, different heads.
    const slowHead = new TypingCalibrator();
    let u = 0;
    for (let i = 0; i < 8; i++) {
        u = typeOne(slowHead, i, 'sunlight', u + 100,
                    { acquireMs: 2200, msPerKey: wpmToMsPerKey(30) });
    }
    ok(Math.abs(slowHead.wpm - cal.wpm) < 3,
       '⭐⭐ two children with the same FINGERS measure the same speed…');
    ok(slowHead.acquireMs > cal.acquireMs * 2,
       '⭐⭐ …and the one who takes longer to FIND the word is told apart');
    ok(slowHead.onScreenTarget < cal.onScreenTarget,
       '⚠️⚠️ so they are sent a different NUMBER of panes — the per-student ' +
       'answer to the MIN_ON_SCREEN experiment that failed as a global');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nB — ⚠️⚠️ ONE DISTRACTION MUST NOT SET THE DIFFICULTY FOR A RUN');
// ═════════════════════════════════════════════════════════════════════════════
//
// The classroom failure, not the lab one: a child looks out of the window,
// answers a question, or drops a stylus.
{
    const cal = new TypingCalibrator();
    let t = 0;
    for (let i = 0; i < 6; i++) {
        t = typeOne(cal, i, 'sunlight', t + 100,
                    { acquireMs: 800, msPerKey: wpmToMsPerKey(28) });
    }
    const cleanWpm = cal.wpm, cleanAcq = cal.acquireMs;

    // ⚠️ A TWELVE-SECOND STARE.
    t = typeOne(cal, 99, 'sunlight', t + 100,
                { acquireMs: 12000, msPerKey: wpmToMsPerKey(28) });
    ok(cal.acquireMs <= cleanAcq * 1.35,
       `⚠️⚠️ a 12-second stare barely moves the estimate (${cleanAcq} → ${cal.acquireMs}ms)`);
    ok(cal.samples.every(s => s.acquireMs <= ACQUIRE_CAP_MS),
       `⚠️ because no single sample may exceed the cap (${ACQUIRE_CAP_MS}ms)`);

    // ⚠️ AND A HOLE IN THE MIDDLE OF A WORD IS NOT A SLOW WORD.
    const n = cal.samples.length;
    cal.spawned(200, 8, t, 1);
    cal.keyed(200, t + 500); cal.keyed(200, t + 600);
    cal.keyed(200, t + 9000);              // the child stopped
    cal.keyed(200, t + 9100);
    cal.finished(200, t + 9200);
    ok(cal.samples.length === n,
       '⚠️⚠️ a burst with a hole in it is DISCARDED, not averaged across — a ' +
       'child who types in confident chunks must not be scored on the pauses');
    ok(Math.abs(cal.wpm - cleanWpm) < 3,
       `⭐ so speed survives both insults intact (${cal.wpm.toFixed(1)} of ${cleanWpm.toFixed(1)})`);
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nC — ⚠️⚠️ THE CHILD WHO FROZE GETS THE GENTLEST GAME, NOT A GUESS');
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, asked what happens to a student who types almost nothing: *"I would go
// with gentlest possible."* ⭐ NOT the lesson gate — a child who produced
// nothing in thirty seconds is telling you something, and answering with a
// number derived from lessons they passed last week answers a different
// question.
{
    const cal = new TypingCalibrator();
    ok(!cal.confident, 'a calibrator that has seen nothing is not confident');
    ok(cal.wpm === FLOOR_WPM, `⚠️⚠️ and answers the FLOOR (${FLOOR_WPM} WPM)`);
    ok(cal.acquireMs === null, '⚠️ acquisition is null rather than a fabricated 0');
    ok(cal.onScreenTarget === 1,
       '⚠️ and one pane — never zero, which is a stopped game rather than an easy one');

    // ⚠️ ONE GOOD WORD IS NOT A MEASUREMENT.
    typeOne(cal, 1, 'the', 0, { acquireMs: 200, msPerKey: 60 });
    ok(!cal.confident && cal.wpm === FLOOR_WPM,
       `⭐ and ${MIN_SAMPLES} samples are needed before anything is believed`);

    // ⚠️ A CHILD WHO IS GENUINELY SLOWER THAN THE FLOOR IS NOT PUSHED TO IT.
    const slow = new TypingCalibrator();
    let t = 0;
    for (let i = 0; i < 6; i++) {
        t = typeOne(slow, i, 'sunlight', t + 100,
                    { acquireMs: 1800, msPerKey: wpmToMsPerKey(4) });
    }
    ok(slow.wpm === FLOOR_WPM,
       '⚠️⚠️ the floor is a FLOOR: a very slow child gets the gentlest game and ' +
       'is never handed a number below it');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nD — ⭐ COMFORT STARTS THE RAMP, AND NEVER UN-STARTS IT');
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake: *"if you're measuring all along, I would start the ramp when the comfort
// strikes."*
{
    const cal = new TypingCalibrator();
    ok(cal.comfortAt === null, 'no comfort before any play');
    let t = 0;
    for (let i = 0; i < MIN_SAMPLES - 1; i++) {
        t = typeOne(cal, i, 'sunlight', t + 100,
                    { acquireMs: 700, msPerKey: wpmToMsPerKey(35) });
    }
    ok(cal.comfortAt === null, '⚠️ nor one sample short of it');
    t = typeOne(cal, 90, 'sunlight', t + 100,
                { acquireMs: 700, msPerKey: wpmToMsPerKey(35) });
    ok(cal.comfortAt !== null,
       '⭐ comfort strikes the moment the estimate may be believed — calibration ' +
       'is the opening ramp, not a separate phase the child has to sit through');
    const struck = cal.comfortAt;

    // ⚠️⚠️ AND A BAD PATCH AFTERWARDS DOES NOT SEND THE GAME BACK TO THE NURSERY
    // SLOPE. Difficulty falling mid-run rewards sandbagging and teaches a child
    // that slowing down makes the game kinder, which is the opposite lesson.
    for (let i = 0; i < 4; i++) {
        t = typeOne(cal, 300 + i, 'sunlight', t + 100,
                    { acquireMs: 3500, msPerKey: wpmToMsPerKey(6) });
    }
    ok(cal.comfortAt === struck,
       '⚠️⚠️ and a bad twenty seconds NEVER un-strikes it');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nE — EASY / MEDIUM / HARD SCALES **TIME**, AND IS MONOTONE');
// ═════════════════════════════════════════════════════════════════════════════
{
    ok(budgetScale('easy') > budgetScale('medium')
       && budgetScale('medium') > budgetScale('hard'),
       '⚠️ easy gives MORE time than medium, which gives more than hard');
    ok(budgetScale('medium') === 1, 'medium is exactly the measurement');
    ok(budgetScale(undefined) === 1 && budgetScale('nonsense') === 1,
       '⚠️ and anything unrecognised is medium rather than an exception');

    // ⭐⭐ THE REASON IT IS TIME AND NOT "DEMAND". Applied to demand it would have
    // to choose between speed and pane count, and if it hit both it would
    // compound: 1.2 × 1.2 = 1.44, so the two ends would sit nearly twice as far
    // apart as the labels promise.
    const spread = DIFFICULTY.easy / DIFFICULTY.hard;
    ok(spread < 1.6,
       `⭐ the whole dial spans ${spread.toFixed(2)}×, not the ${(spread * spread).toFixed(2)}× ` +
       'a compounded version would');

    // ⚠️ AND IT REALLY REACHES THE PACING. Same measurement, three intervals.
    const iv = lvl => spawnIntervalMs(24, 20, 1) * budgetScale(lvl);
    ok(iv('easy') > iv('medium') && iv('medium') > iv('hard'),
       '⚠️ a harder setting really does shorten the interval work arrives on');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nF — ⚠️⚠️ AGAINST THE REAL DIRECTOR: NOBODY ENDS UP WORSE OFF');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ RULE 10, AND ROUND 117'S LESSON. The last harness that measured pacing
// invented its own spawn schedule and was wrong by a factor of five. This drives
// a real `GameDirector` and compares what the calibrator would ask of a child
// against what the old lesson-gate heuristic asked.
{
    const WORDS = SHATTER_WORDS.map(e => e.w).filter(w => w.length >= 4);

    /** What the game demands of a child, in characters per second. */
    const demandOf = (wpm, level) => {
        const d = new GameDirector({ targets: WORDS, targetWPM: wpm, endless: true });
        return (5 * wpm / 60) / budgetScale(level);
    };

    // ⚠️⚠️ THE HEADLINE CASE — JAKE AT 100.
    // `peekNext()`'s own measurement: a 100 WPM typist measures 44 in-game.
    const measured = new TypingCalibrator();
    let t = 0;
    for (let i = 0; i < 8; i++) {
        t = typeOne(measured, i, 'carefully', t + 100,
                    { acquireMs: 420, msPerKey: wpmToMsPerKey(44), onScreen: 3 });
    }
    ok(Math.abs(measured.wpm - 44) < 5,
       `⭐⭐ a 100 WPM typist is measured at what they can actually do in-game ` +
       `(${measured.wpm.toFixed(0)}), not at what they typed into a dropdown`);
    ok(demandOf(measured.wpm, 'medium') < demandOf(100, 'medium'),
       '⚠️⚠️ so the game asks LESS of Jake than the dropdown did — which is why ' +
       'Deadline at 100 was impossible even for him');
    ok(measured.onScreenTarget >= 2,
       '⭐ and he is given panes to read ahead on, which is the thing a fast ' +
       'typist loses most to');

    // ⚠️⚠️ THE ASSERTION THIS FILE EXISTS FOR. A struggling child must never be
    // asked for more than the gentlest setting asks — no ratchet, no lucky
    // streak that cannot come down, nothing that reads as the game cheating.
    const struggling = new TypingCalibrator();
    let u = 0;
    for (let i = 0; i < 10; i++) {
        // ⚠️ ONE FLUKE FAST WORD IN THE MIDDLE. This is the ratchet test.
        const fast = i === 5;
        u = typeOne(struggling, i, 'sunlight', u + 100, {
            acquireMs: fast ? 400 : 2600,
            msPerKey: wpmToMsPerKey(fast ? 55 : 11),
        });
    }
    ok(struggling.wpm < 20,
       `⚠️⚠️ one lucky word does NOT ratchet a struggling child upward ` +
       `(${struggling.wpm.toFixed(1)} WPM) — the median absorbs it`);
    ok(struggling.onScreenTarget === 1,
       '⭐ and they are still sent one pane at a time');
    ok(demandOf(struggling.wpm, 'easy') < demandOf(15, 'medium'),
       '⚠️⚠️ and on `easy` the game asks less of them than the gentlest lesson ' +
       'gate in the course does today');

    // ⚠️ THE CEILING IS A SANITY CLAMP, NOT A DIFFICULTY. Division by a measured
    // interval can produce anything if the interval is small enough.
    const absurd = new TypingCalibrator();
    let v = 0;
    for (let i = 0; i < 6; i++) {
        v = typeOne(absurd, i, 'sunlight', v + 100, { acquireMs: 100, msPerKey: 1 });
    }
    ok(absurd.wpm <= MAX_BELIEVABLE_WPM,
       `⚠️ a stuck key cannot produce a 6000 WPM child (${absurd.wpm.toFixed(0)})`);
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nG — THE SMALL SHARP EDGES');
// ═════════════════════════════════════════════════════════════════════════════
{
    ok(median([]) === null && median(null) === null, 'median of nothing is null');
    ok(median([3, 1, 2]) === 2, 'median of an odd list');
    ok(median([4, 1, 2, 3]) === 2.5, 'median of an even list');

    const cal = new TypingCalibrator();
    // ⚠️ A PANE THE STUDENT NEVER TOUCHED IS NOT A SAMPLE — it measures the
    // board, not the child.
    cal.spawned(1, 8, 0, 1); cal.finished(1, 9000);
    ok(cal.samples.length === 0, '⚠️ an untouched target is not a sample');

    // ⚠️ NOR IS ONE THAT WAS HIT OR ABANDONED.
    cal.spawned(2, 8, 0, 1); cal.keyed(2, 100); cal.dropped(2); cal.finished(2, 500);
    ok(cal.samples.length === 0, '⚠️ a dropped target leaves nothing behind');

    // ⚠️ AND A RESTART IS A NEW CHILD.
    let t = 0;
    for (let i = 10; i < 18; i++) {
        t = typeOne(cal, i, 'sunlight', t + 100,
                    { acquireMs: 700, msPerKey: wpmToMsPerKey(30) });
    }
    ok(cal.confident, 'confident after a good run');
    cal.reset();
    ok(!cal.confident && cal.wpm === FLOOR_WPM && cal.comfortAt === null,
       '⚠️ reset() returns it to the floor, comfort included');

    // ⚠️ EVENTS FOR UNKNOWN IDS MUST NOT THROW. The view fires these from a
    // keystroke path; an exception there kills the frame loop.
    cal.keyed('nope', 1); cal.finished('nope', 2); cal.dropped('nope');
    cal.spawned(null, 5, 0, 1);
    ok(true, '⚠️ stray events for unknown ids are ignored rather than fatal');
}

console.log(fail ? `\nFAIL — ${pass} ok, ${fail} failed`
                 : `\nPASS — ${pass} ok, 0 failed`);
if (fail) { fails.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
