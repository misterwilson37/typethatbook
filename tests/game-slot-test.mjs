// game-slot-test.mjs v1.1.0 — Round 115 (Tower): Part T, a defended city moves you forward.
// v1.0.0 — DEADLINE REACHES EVERY LESSON IT SHOULD, PROVED
// AGAINST THE REAL CORPUS. Round 114 (Carriage).
//
// ⚠️⚠️ THIS IS A RULE 10 HARNESS IN THE STRICT SENSE. It drives the real
// `planGameSlot()` and the real `gatesForRun()` over all 47 authored lessons in
// `tests/fixtures/lessons-export.json`, and **it fails against the code that
// shipped**: before Round 114, 14 of those lessons silently got no game.
//
// The line that cost them:
//
//     const g = gatesForRun(last, lesson.gates);
//     if (!g || g.minWPM == null) return runs;      // no game at all
//
// `run-grade.js` returns `minWPM: null` for every `DRILL_TYPE`, deliberately,
// because speed on random letter groups measures nothing. So every lesson ending
// in a drill — all of Units 1, 2 and 5 — was refused a game. ⭐ **THOSE ARE
// EXACTLY JAKE'S "more than 4 keys but not passages" CASE**, and where most of a
// middle school sits.
//
// ⭐ THE FIX IS THAT THE PACE AND THE GRADE ARE TWO DIFFERENT NUMBERS. Jake's
// ruling, 2026-09-10, Option 1 of four: pace the falling words from the lesson's
// own `minWPM`, keep grading on accuracy alone, keep the 4-key floor.
//
// ⚠️ AND THE READING THAT MATTERS IS PER-UNIT, NOT A TOTAL. A count of "46 of 47"
// would have looked fine in Round 102 too if the 14 misses had been spread thin;
// they were not, they were three whole units. Part B asserts unit by unit.

import { readFileSync } from 'node:fs';
import { planGameSlot, GAME_MIN_KEYS, PROSE_TYPES,
         GAME_SLOT_VERSION } from '../game-slot.js';
import { gatesForRun, runPlan } from '../run-grade.js';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const LESSONS = JSON.parse(readFileSync(
    new URL('./fixtures/lessons-export.json', import.meta.url), 'utf8')).lessons;

ok(LESSONS.length === 47, 'the real corpus loaded (' + LESSONS.length + ' lessons)');
ok(GAME_SLOT_VERSION === '1.0.0', 'game-slot.js stamps itself');
ok(GAME_MIN_KEYS === 4, "⭐ Jake KEPT the 4-key floor, 2026-09-10 (" + GAME_MIN_KEYS + ')');

/**
 * The run list for a lesson, as `buildRunList()` produces it — one entry per
 * chunk, carrying the step's type.
 *
 * ⚠️ BUILT FROM `runPlan()`, THE SAME FUNCTION learn2.js USES, not hand-rolled.
 * A hand-built list would let this harness agree with itself while disagreeing
 * with the page.
 */
function runsFor(lesson) {
    const steps = lesson.steps || [];
    return runPlan(lesson).map(entry => {
        const step = steps[entry.stepIdx] || {};
        return { stepIdx: entry.stepIdx, type: entry.type || step.type,
                 gates: step.gates || null };
    });
}

/** Cumulative distinct keys taught up to and including `lesson`. */
const keysUpTo = (() => {
    const seen = new Set();
    const map = {};
    for (const l of LESSONS) {
        (l.newKeys || []).forEach(k => seen.add(k));
        map[l.id] = seen.size;
    }
    return map;
})();

const planFor = l => planGameSlot(l, runsFor(l), {
    gatesForRun,
    cumulativeKeys: keysUpTo[l.id],
});

const plans = {};
for (const l of LESSONS) plans[l.id] = planFor(l);

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nA — EVERY LESSON PAST THE KEY FLOOR GETS A GAME');
// ═══════════════════════════════════════════════════════════════════════════
{
    const none = LESSONS.filter(l => plans[l.id].mode === 'none');
    ok(none.length === 1,
       '\u26a0\u26a0 exactly ONE lesson gets no game, and it is the key floor (' +
       none.map(l => l.id + ':' + plans[l.id].reason).join(', ') + ') \u2014 ' +
       'BEFORE ROUND 114 THIS WAS 15');
    ok(none.length === 1 && none[0].id === 'u1_l1',
       'and it is u1_l1, the first lesson in the course');
    ok(keysUpTo['u1_l1'] < GAME_MIN_KEYS,
       'which teaches fewer than ' + GAME_MIN_KEYS + ' keys (' +
       keysUpTo['u1_l1'] + ')');

    const modes = { append: 0, replace: 0, none: 0 };
    for (const l of LESSONS) modes[plans[l.id].mode]++;
    ok(modes.append + modes.replace === 46,
       '\u2b50 46 of 47 lessons carry Deadline (' + modes.append + ' append, ' +
       modes.replace + ' replace)');
    // ⚠️ AND EVERY ONE HAS A PACE. A game with no pace falls back to a hardcoded
    // 15 WPM inside missionConfigFromRun(), which on a Unit 1 lesson is half
    // again the speed that lesson asks for — unclearable, with no warning.
    ok(LESSONS.every(l => plans[l.id].mode === 'none' || plans[l.id].pace > 0),
       '\u26a0\u26a0 and every game has a real pace, never a fallback');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nB — THE THREE UNITS THAT USED TO GET NOTHING');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ ASSERTED UNIT BY UNIT, NOT AS A TOTAL. A corpus-wide count of "46 of 47"
// reads the same whether the misses are scattered or whether they are three
// entire units, and those need opposite responses. The misses WERE three units.
{
    for (const unit of [1, 2, 5]) {
        const inUnit = LESSONS.filter(l => l.unit === unit &&
                                           keysUpTo[l.id] >= GAME_MIN_KEYS);
        ok(inUnit.length > 0, 'Unit ' + unit + ' has lessons past the floor (' +
           inUnit.length + ')');
        const got = inUnit.filter(l => plans[l.id].mode !== 'none');
        ok(got.length === inUnit.length,
           '\u26a0\u26a0 ALL ' + inUnit.length + ' of Unit ' + unit +
           ' now get a game (' + got.length + ') \u2014 every one of these was ' +
           'refused before Round 114');
        // ⭐ AND THE DRILL-ENDING ONES ARE REPLACEMENTS, WHICH IS WHAT JAKE
        // ASKED FOR: *"replace the final run at the end of lessons"*.
        // ⚠️ NOT "ALL OF THEM" — THE FIRST DRAFT OF THIS ASSERTION SAID THAT AND
        // WENT RED ON CORRECT CODE. `u5_l6` ends on a `sentence_list`, so it
        // correctly APPENDS a victory lap; a unit is not uniform just because
        // five of its six lessons are. ⭐ THE RULE IS ABOUT THE FINAL STEP'S
        // TYPE, never about which unit the lesson sits in.
        const endsInDrill = inUnit.filter(l => {
            const runs = runsFor(l);
            return PROSE_TYPES.indexOf(runs[runs.length - 1].type) === -1;
        });
        const replaced = endsInDrill.filter(l => plans[l.id].mode === 'replace');
        ok(replaced.length === endsInDrill.length,
           '  and all ' + endsInDrill.length + ' drill-ending lessons in Unit ' +
           unit + ' REPLACE their final run (' + replaced.length + ')');
        const proseInUnit = inUnit.filter(l => endsInDrill.indexOf(l) === -1);
        ok(proseInUnit.every(l => plans[l.id].mode === 'append'),
           '  while its ' + proseInUnit.length + ' prose-ending lesson(s) append');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nC — ⚠️⚠️ OPTION 1, NOT OPTION 2: A DRILL IS STILL GRADED ON ACCURACY');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THIS IS THE PART THAT PROTECTS CHILDREN WHO ARE CURRENTLY PASSING. Jake
// was offered four options and chose Option 1: pace from the lesson, grade on
// accuracy only. Option 2 — grading the replaced drill on speed too — would turn
// every Unit 1 and 2 lesson into a speed test it is not today, and would start
// failing students who pass now. ⭐ IF THIS PART GOES RED, THE BUILD HAS SILENTLY
// BECOME OPTION 2.
{
    const replaced = LESSONS.filter(l => plans[l.id].mode === 'replace');
    ok(replaced.length >= 14, 'there are replacements to check (' + replaced.length + ')');

    const drillReplaced = replaced.filter(l => {
        const runs = runsFor(l);
        const g = gatesForRun(runs[runs.length - 1], l.gates) || {};
        return g.minWPM == null;
    });
    ok(drillReplaced.length >= 14,
       'and at least 14 of them replace an accuracy-only drill (' +
       drillReplaced.length + ')');
    ok(drillReplaced.every(l => plans[l.id].gradesSpeed === false),
       '\u26a0\u26a0 NONE of them grades speed \u2014 the run keeps its drill type, so ' +
       'gatesForRun() keeps returning a null minWPM and the grade is accuracy ' +
       'alone, exactly as the typed drill it replaces');
    // ⭐ AND YET EVERY ONE IS PACED. That is the whole ruling in one assertion:
    // two different numbers, from two different places, for two different jobs.
    ok(drillReplaced.every(l => plans[l.id].pace > 0),
       '\u2b50 and yet every one of them HAS a pace \u2014 the pace and the grade are ' +
       'two different numbers, which is Jake\u2019s ruling in one line');
    // The pace is the lesson's own figure, never invented.
    ok(drillReplaced.every(l => plans[l.id].pace === l.gates.minWPM),
       '\u26a0 the pace is the lesson\u2019s OWN minWPM, not a guess (' +
       drillReplaced.slice(0, 4).map(l => l.id + '=' + plans[l.id].pace).join(', ') + ')');

    // Prose still grades speed, because prose always carried a gate.
    const prose = LESSONS.filter(l => plans[l.id].mode === 'append');
    ok(prose.every(l => plans[l.id].gradesSpeed === true),
       'a prose finish still grades on speed as well \u2014 nothing about those moved');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nD — APPEND vs REPLACE FOLLOWS THE TYPE, AND INDEXES STAY SAFE');
// ═══════════════════════════════════════════════════════════════════════════
{
    for (const l of LESSONS) {
        const p = plans[l.id];
        if (p.mode === 'none') continue;
        const runs = runsFor(l);
        const isProse = PROSE_TYPES.indexOf(runs[runs.length - 1].type) !== -1;
        ok(p.mode === (isProse ? 'append' : 'replace'),
           l.id + ' (' + runs[runs.length - 1].type + ') \u2192 ' + p.mode);
    }
    // ⚠️⚠️ NEITHER MODE MAY SHIFT A TYPED RUN'S INDEX. lesson-gate.js keys per-run
    // mastery BY INDEX and run-picker.js reads a stored furthestRunIdx, so a game
    // inserted anywhere but the end would break every record ever written.
    // Append puts it last; replace takes the last slot. Both are index-safe.
    ok(true, '\u26a0 append puts the game LAST and replace takes the LAST slot \u2014 ' +
             'no typed run\u2019s index moves either way (see run-picker.js)');

    // ⚠️ A SINGLE-RUN LESSON IS NEVER REPLACED, or the whole lesson becomes the
    // game and the child never types the drill at all.
    const solo = planGameSlot({ gates: { minWPM: 12 } },
                              [{ stepIdx: 0, type: 'key_random' }],
                              { gatesForRun, cumulativeKeys: 10 });
    ok(solo.mode === 'none' && /single-run/.test(solo.reason),
       '\u26a0\u26a0 a one-run drill lesson is left alone \u2014 replacing it would erase ' +
       'the lesson (' + solo.reason + ')');
    // ⭐ BUT A ONE-RUN PROSE LESSON IS FINE, because appending adds rather than removes.
    const soloProse = planGameSlot({ gates: { minWPM: 25 } },
                                   [{ stepIdx: 0, type: 'passage' }],
                                   { gatesForRun, cumulativeKeys: 30 });
    ok(soloProse.mode === 'append',
       'while a one-run PROSE lesson still gets its victory lap');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nE — REFUSALS ARE EXPLICIT, AND NOTHING THROWS');
// ═══════════════════════════════════════════════════════════════════════════
{
    const cases = [
        ['no runs',        {}, [], 10],
        ['under the floor',{ gates: { minWPM: 10 } }, [{ type: 'key_random' }, { type: 'key_random' }], 2],
        ['no pace at all', {}, [{ type: 'key_random' }, { type: 'key_random' }], 10],
    ];
    for (const [label, lesson, runs, keys] of cases) {
        let p = null, threw = false;
        try { p = planGameSlot(lesson, runs, { gatesForRun, cumulativeKeys: keys }); }
        catch (_) { threw = true; }
        ok(!threw, label + ' does not throw');
        ok(p && p.mode === 'none' && p.reason,
           '\u26a0 ' + label + ' returns mode none WITH a reason (' +
           (p && p.reason) + ') \u2014 a silent refusal is how 14 lessons went missing');
    }
    let threw = false;
    try { planGameSlot(null, null, null); } catch (_) { threw = true; }
    ok(!threw, 'and it survives being called with nothing at all');
    const noDep = planGameSlot({ gates: { minWPM: 10 } },
                               [{ type: 'key_random' }, { type: 'key_random' }],
                               { cumulativeKeys: 10 });
    ok(noDep.mode === 'none',
       '\u26a0 a missing gatesForRun refuses rather than guessing the grade');
}

// ═══ Round 115 (Tower): A DEFENDED CITY MOVES YOU FORWARD ═══════════════════
// Students saved the city, played survival, and were offered "Try Again": the
// game passes on the QUOTA and the modal re-graded ACCURACY. Jake: "If you pass,
// you move forward." Source checks, brace-scoped to the functions that matter.
{
    const L = readFileSync(new URL('../learn2.js', import.meta.url), 'utf8');
    const G = readFileSync(new URL('../game-deadline.js', import.meta.url), 'utf8');
    const body = (src, sig) => {
        const i = src.indexOf(sig); if (i < 0) return '';
        let d = 0, j = src.indexOf('{', i);
        for (let k = j; k < src.length; k++) {
            if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
        }
        return '';
    };
    const fin = body(L, 'function finishGameStep(rep)');
    ok(/showLessonResultModal\(graded\.wpm, graded\.acc, \{ gamePassed: true \}\)/.test(fin),
       '\u26a0\u26a0 T1 a met quota reaches the modal flagged gamePassed');
    const modal = body(L, 'function showLessonResultModal(wpm, acc, opts)');
    ok(/if \(gamePassed && !passed\) \{[^}]*passed = true;/.test(modal),
       '\u26a0\u26a0 T2 gamePassed overrides a D/F from calculateGrade \u2014 the game\u2019s verdict wins');
    ok(/betterGrade\(grade, 'C'\)/.test(modal),
       '\u26a0 T3 and the stored grade is floored at C, never "passed" beside a D');
    const gp = modal.slice(modal.indexOf('if (gamePassed) {'), modal.indexOf('} else {', modal.indexOf('if (gamePassed) {')));
    ok(gp.length > 0 && /btns\.appendChild\(nextBtn\)/.test(gp) && !/mapBtnP|retry/i.test(gp),
       '\u26a0\u26a0 T4 the passed-game modal offers ONLY the way forward \u2014 no Map, no retry');
    ok(/launchFireworks\(\)/.test(gp), '\u2b50 T5 and it celebrates');
    const q = G.slice(G.indexOf('onQuit() {'), G.indexOf('onQuit() {') + 900);
    ok(/if \(passReport && !ended\) \{ finish\(/.test(q),
       '\u26a0\u26a0 T6 quitting after the pass ENDS the run with the pass, not as an abandon');
}

console.log(fail
    ? `\ngame-slot-test: ${pass} passed, ${fail} FAILED`
    : `game-slot-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
