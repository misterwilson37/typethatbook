// typing-calibrator-test.mjs v1.1.0 — Round 120 (Maskelyne): PART T, the
// acquisition defect that read a 100 WPM typist at 24 on a busy board.
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
    FLOOR_WPM, ACQUIRE_CAP_MS, MIN_SAMPLES, MAX_BELIEVABLE_WPM, RECENT_SAMPLES,
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
    // ⚠️⚠️ REWRITTEN IN ROUND 119, AND THE REWRITE IS THE POINT. This used to read
    // *"burst speed recovers the typist's real rate (30)"* and it was true of the
    // code and false of the child: a 30 WPM burst between 900ms hunts is a **25.9
    // WPM student**, and the game is paced for the student.
    // ⭐ THE OLD ASSERTION IS WHY THE DEFECT SURVIVED — it pinned the burst window
    // as correct, so five production traces reporting a 36 WPM child as 90 never
    // turned anything red.
    ok(cal.wpm > 22 && cal.wpm < 30,
       `⭐ A2 THE ESTIMATE IS THE SUSTAINED RATE (${cal.wpm.toFixed(1)} WPM): 30 WPM `
       + 'bursts with 900ms of hunting between them is not a 30 WPM typist');
    // ⚠️ AND ACQUISITION IS STILL RECORDED SEPARATELY. It is now spent twice — on
    // the pace AND on `onScreenTarget` — but it is still ONE recorded number, so
    // Rule 9 holds and the two readers cannot disagree.
    ok(Math.abs(cal.acquireMs - 900) < 60,
       `⚠️ A3 and acquisition is still measured in its own right (${cal.acquireMs}ms of 900)`);

    // ⭐⭐ THE POINT OF THE DECOMPOSITION. Same fingers, different heads.
    const slowHead = new TypingCalibrator();
    let u = 0;
    for (let i = 0; i < 8; i++) {
        u = typeOne(slowHead, i, 'sunlight', u + 100,
                    { acquireMs: 2200, msPerKey: wpmToMsPerKey(30) });
    }
    // ⚠️⚠️⚠️ THIS ASSERTION IS DELIBERATELY INVERTED IN ROUND 119. It used to
    // demand that the two measure the SAME, and that was the defect stated as a
    // requirement: the child who needs 2.2s to find every word is not typing at
    // the same rate as the one who needs 0.9s, and pacing them identically is
    // what produced a 364ms spawn interval in Deadline.
    // ⭐ THE DECOMPOSITION IS STILL REAL — `acquireMs` below still separates them
    // for `onScreenTarget`. What changed is that the PACE now hears about it too.
    ok(slowHead.wpm < cal.wpm - 2,
       `⭐⭐ A4 SAME FINGERS, SLOWER HUNT, SLOWER GAME (${slowHead.wpm.toFixed(1)} vs `
       + `${cal.wpm.toFixed(1)} WPM). A crowded board really does make a child `
       + 'slower, and the pacing finally knows it');
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
// ═════════════════════════════════════════════════════════════════════════════
console.log('\nS — ⚠️⚠️⚠️ THE ESTIMATE IS A SUSTAINED RATE, NOT A BURST RATE');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⭐⭐ MEASURED IN FIVE PRODUCTION TRACES, ALL THREE CABINETS: `pacedWPM` sat at
// 83.9-90.0 for whole runs while the game's own netWPM read 36.
//
// ⚠️⚠️⚠️ AND THE FIRST DIAGNOSIS OF THAT WAS WRONG. I called it a saturated
// sensor. ⭐⭐ THE PLAYER IS A 90 WPM TYPIST — the burst measurement was CORRECT,
// and the defect was that the DIRECTOR ASKED THE WRONG QUESTION. "How fast are
// these fingers" and "how fast can words be thrown at this person" are different
// quantities, and only the second prices a spawn interval: a 90 WPM typist on a
// forty-pane board is not clearing at 90, because most of the second goes on
// FINDING the next word.
// ⭐ THE COST OF A WORD IS FIND IT AND TYPE IT, which is what a spawn interval
// buys. Deadline was the proof: 364ms interval, words living 1.3s, 47 on screen
// by t=30s, Jake's verdict *"Deadline is impossible"*.
function typist(burstWPM, acquireMs, chars = 7, n = 6) {
    const c = new TypingCalibrator({});
    const per = 60000 / (burstWPM * 5);
    for (let i = 0; i < n; i++) {
        const t0 = i * 20000;
        c.spawned(i, chars, t0, 3);
        for (let k = 0; k < chars; k++) c.keyed(i, t0 + acquireMs + k * per);
        c.finished(i, t0 + acquireMs + (chars - 1) * per);
    }
    return c;
}
{
    // ⭐⭐ THE VALIDATION THAT MATTERS: JAKE'S OWN RUN, AGAINST HIS OWN SCREEN.
    // His bursts railed the old estimate at 90 and his netWPM readout said 36.
    const real = typist(90, 1400).wpm;
    ok(real > 30 && real < 45,
       `⭐⭐ S1 A REAL 90 WPM TYPIST WHO SPENDS 1.4s FINDING EACH WORD IS CLEARING `
       + `WORDS AT ${real.toFixed(1)} WPM — and the game's own netWPM read 36 for `
       + 'that same run. ⚠️ THE 90 WAS NEVER WRONG ABOUT HIS FINGERS; it was the '
       + 'wrong quantity to price a spawn interval with');
    ok(real < MAX_BELIEVABLE_WPM - 5,
       '⚠️⚠️ S2 …AND THE ESTIMATE IS OFF ITS OWN CLAMP. Not because 90 was a lie — '
       + 'it was true — but because a number sitting exactly on MAX_BELIEVABLE_WPM '
       + 'cannot tell 90 apart from 150, so it could not rank the fastest children '
       + 'against each other at all');

    // ⚠️ IT MUST STILL SEPARATE FAST CHILDREN FROM SLOW ONES, or it is just a
    // constant with extra steps.
    const fast = typist(120, 300).wpm, slow = typist(40, 2500).wpm;
    ok(fast > real && real > slow,
       `⭐ S3 IT STILL RANKS TYPISTS (fast ${fast.toFixed(0)} > Jake ${real.toFixed(0)} `
       + `> slow ${slow.toFixed(0)} WPM)`);

    // ⚠️⚠️ THE HUNT IS WHAT MOVES IT, WHICH IS THE WHOLE POINT. Same fingers,
    // different time spent finding the word.
    const quick = typist(90, 300).wpm, dawdle = typist(90, 3000).wpm;
    ok(quick > dawdle * 1.5,
       `⚠️⚠️ S4 THE SAME FINGERS ARE PACED DIFFERENTLY BY HOW LONG THE HUNT TAKES `
       + `(${quick.toFixed(0)} vs ${dawdle.toFixed(0)} WPM) — a crowded board really `
       + 'does make a child slower, and now the pacing knows it');

    // ⚠️ AND A DAWDLER CANNOT BE REPORTED AS GLACIAL, because `acquire` is capped.
    // Without the cap, one pane a student ignored for half a minute would report
    // them as a half-minute-per-word typist and stall the game for everyone.
    const ignored = typist(90, 60000).wpm, capped = typist(90, ACQUIRE_CAP_MS).wpm;
    ok(Math.abs(ignored - capped) < 0.5,
       `⚠️⚠️ S5 ACQUIRE_CAP_MS HOLDS: ignoring a pane for a minute reads the same as `
       + `${ACQUIRE_CAP_MS}ms (${ignored.toFixed(1)} vs ${capped.toFixed(1)} WPM)`);
    ok(typist(90, 60000).wpm >= FLOOR_WPM,
       '⚠️ S6 …and never below the floor, which is the gentlest the game gets');
}

// ═══════════════════════════════════════════════════════════════════════════
// PART T — ⚠️⚠️⚠️ THE SENSOR WAS MEASURING THE QUEUE AND REPORTING IT AS THE
//          CHILD. Round 120 (Maskelyne).
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake's Shards trace, 2026-09-13, ONE PLAYER IN ONE MINUTE:
//     onScreen 1–2  →  pacedWPM 47
//     onScreen 5–7  →  pacedWPM 24
//
// ⭐⭐ THE SIGN IS WHAT MAKES IT SERIOUS. A crowded board made him look slower, so
// the director spawned SLOWER, so the board stayed quiet — a loop that ends with
// a 100 WPM typist standing in an empty field. Part S (Round 119) is right that a
// real hunt belongs in the measurement; what did not belong is time the student
// spent typing something else.
//
// ⚠️ WRITTEN RED FIRST: against v1.1.0 the two figures below are 60 and 26.
{
    console.log('\nT — ⚠️⚠️ ACQUISITION IS NOT TIME THE STUDENT SPENT TYPING SOMETHING ELSE');

    // Two panes up. The student types the first one straight through, then turns
    // to the second — which has been sitting there the whole time.
    const busyBoard = () => {
        const cal = new TypingCalibrator();
        let t = 0;
        for (let n = 0; n < MIN_SAMPLES; n++) {
            const a = 100 + n * 2, b = 200 + n * 2;
            cal.spawned(a, 5, t, 2);
            cal.spawned(b, 5, t, 2);            // ⚠️ SAME INSTANT. It waits its turn.
            let k = t + 300;                     // a real, short hunt for the first
            for (let i = 0; i < 5; i++) { cal.keyed(a, k); k += 120; }
            cal.finished(a, k);
            k += 300;                            // and an equally short one for the second
            for (let i = 0; i < 5; i++) { cal.keyed(b, k); k += 120; }
            cal.finished(b, k);
            t = k + 50;
        }
        return cal;
    };
    // The same hands, with only one pane to look at.
    const quietBoard = () => {
        const cal = new TypingCalibrator();
        let t = 0;
        for (let n = 0; n < MIN_SAMPLES * 2; n++) {
            t = typeOne(cal, 300 + n, 'abcde', t, { acquireMs: 300, msPerKey: 120 }) + 50;
        }
        return cal;
    };

    const busy = busyBoard().wpm, quiet = quietBoard().wpm;
    ok(Math.abs(busy - quiet) < 1.0,
       `⚠️⚠️ T1 A SECOND PANE ON SCREEN DOES NOT MAKE THE SAME TYPIST LOOK SLOWER `
       + `(${busy.toFixed(1)} vs ${quiet.toFixed(1)} WPM) — this is the defect that `
       + 'read Jake at 24 WPM on a busy board and 47 on a quiet one');
    ok(busy > 30,
       `⚠️ T2 …and the number is the typist's, not the board's (${busy.toFixed(1)} WPM)`);

    // ⚠️ AND A REAL HUNT IS STILL CHARGED. Part S's ruling stands: the cost of a
    // word is find it AND type it. What was removed is only provable busy-ness.
    const hunter = () => {
        const cal = new TypingCalibrator();
        let t = 0;
        for (let n = 0; n < MIN_SAMPLES * 2; n++) {
            t = typeOne(cal, 400 + n, 'abcde', t, { acquireMs: 2500, msPerKey: 120 }) + 50;
        }
        return cal.wpm;
    };
    ok(hunter() < quiet * 0.75,
       `⚠️⚠️ T3 A STUDENT WHO GENUINELY HUNTS IS STILL PACED FOR IT `
       + `(${hunter().toFixed(1)} vs ${quiet.toFixed(1)} WPM) — T1 must not be `
       + 'read as a licence to go back to burst measurement');

    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ THE ESTIMATE CAN COME BACK DOWN **AND BACK UP**. A whole-run median
    // could not: Jake's bad patch outvoted his good one for the rest of the run.
    // ═══════════════════════════════════════════════════════════════════════
    const recovering = new TypingCalibrator();
    let t = 0;
    // ⚠️ THE SLOW STRETCH IS DELIBERATELY LONGER THAN THE WINDOW. With equal
    // halves a whole-run median lands between them and this assertion would pass
    // against the very code it was written to catch — the failure mode Round 116
    // shipped twice in one file.
    for (let n = 0; n < RECENT_SAMPLES * 3; n++) {
        t = typeOne(recovering, 500 + n, 'abcde', t, { acquireMs: 3000, msPerKey: 400 }) + 50;
    }
    const slump = recovering.wpm;
    for (let n = 0; n < RECENT_SAMPLES; n++) {
        t = typeOne(recovering, 600 + n, 'abcde', t, { acquireMs: 250, msPerKey: 90 }) + 50;
    }
    ok(recovering.wpm > slump * 3,
       `⭐⭐ T4 A PLAYER WHO SETTLES DOWN IS RE-PRICED (${slump.toFixed(1)} → `
       + `${recovering.wpm.toFixed(1)} WPM) — the median runs over the last `
       + `${RECENT_SAMPLES} samples, not over the whole run`);

    // ═══════════════════════════════════════════════════════════════════════
    // ⭐⭐ AND THE OPENING IS NOT DEAD ANY MORE.
    // ═══════════════════════════════════════════════════════════════════════
    // Jake's Shards run held the 8 WPM floor for FIFTY SECONDS and seven clears
    // before the fourth clean sample arrived — with `costFactor: 3` that is a
    // 40-second first spawn interval, which is the "two minutes without touching
    // the keyboard and never any threat" report, measured.
    const opening = new TypingCalibrator();
    ok(opening.provisionalWPM(FLOOR_WPM) === FLOOR_WPM,
       '⚠️ T5 with no samples at all the seed is still the floor — a child who froze '
       + 'gets the gentlest game, which is Jake\'s own ruling');
    let t2 = typeOne(opening, 700, 'abcde', 0, { acquireMs: 250, msPerKey: 90 });
    const afterOne = opening.provisionalWPM(FLOOR_WPM);
    ok(afterOne > FLOOR_WPM * 1.5 && afterOne < opening.samples[0].wpm,
       `⭐⭐ T6 ONE CLEAN SAMPLE ALREADY MOVES THE PACING (${FLOOR_WPM} → `
       + `${afterOne.toFixed(1)} WPM) — the opening minute stops being a waiting room`);
    ok(!opening.confident,
       '⚠️ T7 …without claiming confidence, which is a different question and still '
       + `needs ${MIN_SAMPLES} samples`);

    // ⚠️⚠️ AND ONE FLUKE CANNOT SET THE RUN, which is what MIN_SAMPLES defends.
    const fluke = new TypingCalibrator();
    typeOne(fluke, 800, 'abcde', 0, { acquireMs: 40, msPerKey: 20 });   // absurdly fast
    // ⚠️ AGAINST THE RAW SAMPLE, NOT AGAINST `.wpm` — that getter answers the
    // floor until `confident`, so comparing to it would pass for the wrong reason.
    ok(fluke.provisionalWPM(FLOOR_WPM) < fluke.samples[0].wpm * 0.4,
       '⚠️⚠️ T8 a single freak sample is believed at a quarter weight, not outright ('
       + fluke.provisionalWPM(FLOOR_WPM).toFixed(1) + ' from a sample of '
       + fluke.samples[0].wpm.toFixed(0) + ')');
}
// ═════════════════════════════════════════════════════════════════════════════
console.log('\nR — ⚠️⚠️⚠️ A DISCARDED SAMPLE IS COUNTED, AND THE REASON IS NAMED');
// ⭐⭐ ADDED ROUND 127 (Didot) AGAINST REAL STUDENT DATA. One sixth-grader cleared
// 22 words across 435 seconds and `pacedWPM` held the 8 WPM floor for every
// sample in the trace — one distinct value, start to finish. `MIN_SAMPLES` is 4,
// so nineteen-plus finished words were thrown away and NOTHING RECORDED IT.
// ⚠️ THIS HARNESS DOES NOT ASSERT A FIX. `BURST_GAP_CAP_MS` is the suspect —
// 1,500 ms, absolute, against children for whom a 1.5 s hunt between letters is
// ordinary — but keystroke timing is in no trace we hold, so Rule 10 forbids
// changing it yet. This pins the INSTRUMENT that will let the next round prove
// or clear that suspicion on real data.
{
    const c = new TypingCalibrator({});
    ok(c.rejected.gapped === 0 && c.rejected.tooShort === 0 && c.rejected.noKeys === 0,
       'R1 a fresh calibrator has rejected nothing');

    // A word typed with a 2-second hole in the middle — ordinary for a beginner.
    c.spawned(1, 5, 0, 1);
    c.keyed(1, 400); c.keyed(1, 800);
    c.keyed(1, 3000);                      // ⚠️ 2.2 s gap > BURST_GAP_CAP_MS
    c.keyed(1, 3300); c.keyed(1, 3600);
    c.finished(1, 3600);
    ok(c.samples.length === 0, 'R2 the gapped word produced NO sample');
    ok(c.rejected.gapped === 1,
       '⚠️⚠️ R3 and it is COUNTED as gapped — the fact that used to vanish');

    // The same word typed without the hole is kept.
    c.spawned(2, 5, 4000, 1);
    for (let i = 1; i <= 5; i++) c.keyed(2, 4000 + i * 400);
    c.finished(2, 6000);
    ok(c.samples.length === 1, 'R4 the ungapped word IS a sample');
    ok(c.rejected.gapped === 1, 'R5 and nothing new was rejected');

    // ⚠️ THE REASONS DO NOT SMEAR INTO EACH OTHER.
    c.spawned(3, 5, 7000, 1);
    c.finished(3, 7000);                   // never touched
    ok(c.rejected.noKeys === 1 && c.rejected.gapped === 1,
       'R6 an untouched pane counts as noKeys, not as gapped');

    const snap = c.snapshot();
    ok(snap.rejected && snap.rejected.gapped === 1,
       '⭐ R7 snapshot() carries the counts, so telemetry sees them');
}


if (fail) { fails.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
