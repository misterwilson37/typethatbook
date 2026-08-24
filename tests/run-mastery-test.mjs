// run-mastery-test.mjs v1.0.0 — ROADMAP 14's STUDENT-FACING HALF.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THIS FILE WAS CITED BY learn.js BEFORE IT EXISTED
// ═══════════════════════════════════════════════════════════════════════════
//
// Round 32 shipped the run-scoring rule with `tests/run-mastery-test.mjs` named
// in learn.js's own version header, and did not write it. HANDOFF §0.-24.D
// carried the debt for two rounds. **A header asserting a harness is not
// evidence of a harness** — the same shape as §0.-18.D's comment claiming
// "several call sites" when there were zero.
//
// It covers the two things 48/48 did not: the paths a STUDENT actually meets.
// `lesson-gate-test.mjs` proves the rule; this proves the student can reach it.
//
// ⚠️ THE BUG JAKE FOUND BY USING IT, 2026-08-23: *"if the first one is locked,
// students have no way to get to the second run legitimately."* Runs are typed
// in order from run 0, so a student whose run 1 was mastered had to replay it
// for nothing to reach the run that still pays. **The gate was taxing the
// student it existed to move along.**
//
// ⚠️ MUTATION-VERIFIED: 6 failing against learn.js v2.34.1 (Parts A and B).

import { readFileSync } from 'fs';
import { runModeFor, MASTERY_POINTS } from '../lesson-gate.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL  ' + m); } };

const src = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');
const decomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');

function extractFn(s, name) {
    const re = new RegExp('(?:async\\s+)?function\\s+' + name + '\\s*\\(');
    const m = re.exec(s);
    if (!m) return null;
    let i = s.indexOf('{', m.index), depth = 0;
    for (let j = i; j < s.length; j++) {
        if (s[j] === '{') depth++;
        else if (s[j] === '}') { depth--; if (depth === 0) return s.slice(m.index, j + 1); }
    }
    return null;
}

// A record with `mastered` runs banked, in a lesson of `n` runs.
// ⚠️ SCORES ARE WRITTEN AS A PREFIX BECAUSE THAT IS WHAT DOWNWARD CLOSURE
// PRODUCES — runMastered() reads any index ≥ k, so a mastered set is always a
// prefix and an open set always a suffix. Part A depends on that being true.
const recWith = (n, mastered) => {
    const runScores = {};
    for (let i = 0; i < n; i++) runScores[String(i)] = i < mastered ? MASTERY_POINTS : 1;
    return { runCount: n, passed: true, grade: 'A', runScores };
};

// Drive the SHIPPED firstOpenRunIdx() against the SHIPPED rule.
function firstOpen(n, mastered) {
    const body = extractFn(src, 'firstOpenRunIdx');
    if (!body) return null;
    const record = recWith(n, mastered);
    const fn = new Function('buildRunList', 'modeForRun',
                            body + '\nreturn firstOpenRunIdx;')(
        () => new Array(n).fill(0).map((_, i) => ({ i })),
        (_lesson, runIdx) => runModeFor({
            lessonIndex: 0, runIdx, furthestLessonIndex: 0, record,
            activeDayCount: 0, lastLockDay: 0, unlocked: true, staff: false,
        }));
    return fn({ id: 'u1_l1' });
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─── A. ⚠️⚠️ A LESSON OPENS AT THE FIRST RUN THAT STILL COUNTS ───');
{
    ok(extractFn(src, 'firstOpenRunIdx') !== null,
       'A1 firstOpenRunIdx() exists in learn.js');

    ok(firstOpen(2, 0) === 0,
       'A2 nothing mastered → the student starts at run 1, as always');
    ok(firstOpen(2, 1) === 1,
       '⚠️⚠️ A3 RUN 1 MASTERED → THE LESSON OPENS AT RUN 2. This is Jake\u2019s bug: ' +
       'without it the student replays a run that pays nothing in order to reach ' +
       'the one that does');
    ok(firstOpen(5, 3) === 3,
       'A4 the first open run is found at any depth, not just index 1');
    ok(firstOpen(2, 2) === 0,
       '⚠️ A5 EVERY run mastered → back to 0. The whole lesson is replayable, the ' +
       'banner says so, and the student is not stranded with nowhere to start');
}

console.log('\n─── B. THE INTRO SCREEN HONOURS IT ───');
{
    const clean = decomment(src);
    const intro = clean.slice(clean.indexOf('introStartBtn.onclick'),
                              clean.indexOf('document.addEventListener(\'keydown\', introEnterHandler)'));
    ok(intro.length > 0, 'B1 the intro start handlers are where they were');
    ok(!/beginStep\(\s*0\s*\)/.test(intro),
       '⚠️⚠️ B2 NEITHER "START LESSON" NOR THE ENTER KEY HARDCODES beginStep(0). ' +
       'startLesson() worked out the first open run; a literal 0 here sends the ' +
       'student straight back through the runs the gate exists to move them past');
    ok((intro.match(/beginStep\(\s*currentStepIdx\s*\)/g) || []).length === 2,
       'B3 both entry points \u2014 button and Enter \u2014 start where startLesson() said');

    const start = extractFn(clean, 'startLesson') || '';
    ok(/currentStepIdx\s*=\s*firstOpenRunIdx\(/.test(start),
       'B4 startLesson() is what decides it, so there is ONE answerer');
}

console.log('\n─── C. THE MODE IS ARMED PER RUN, BEFORE THE RUN ───');
{
    const clean = decomment(src);
    const begin = extractFn(clean, 'beginStep') || '';
    ok(/armRunMode\(\s*stepIdx\s*\)/.test(begin),
       '⚠️ C1 beginStep() arms the mode for THIS run. A lesson can hold a mastered ' +
       'run and an unmastered one at once, so a per-lesson decision is wrong');

    const arm = extractFn(clean, 'armRunMode') || '';
    ok(/modeForRun\(/.test(arm), 'C2 it asks the RUN, not the lesson');
    ok(/showPracticeBanner\(/.test(arm),
       'C3 and the banner follows the same decision \u2014 a run that pays nothing must ' +
       'say so, or the student is being silently unpaid');

    // ⚠️ ORDER: armRunMode must precede anything that could count a keystroke.
    const iArm = begin.indexOf('armRunMode');
    const iShow = begin.indexOf('showView');
    ok(iArm > -1 && (iShow === -1 || iArm < iShow),
       '⚠️ C4 the mode is settled BEFORE the drill is shown, not after');
}

console.log('\n─── D. THE STUDENT CAN SEE THE SCORE ───');
{
    const body = extractFn(src, 'runScorePill');
    ok(body !== null, 'D1 runScorePill() exists');
    if (body) {
        const make = (score) => new Function(
            'currentLesson', 'userProgress', 'runScoreOf', 'MASTERY_POINTS',
            body + '\nreturn runScorePill;')(
            { id: 'u1_l1' }, {}, () => score, MASTERY_POINTS)(0);

        ok(/2\s*\/\s*4|Mastery/.test(make(2)),
           'D2 a partial score is shown as progress toward the threshold');
        ok(make(2).includes('2') && make(2).includes(String(MASTERY_POINTS)),
           '⚠️ D3 BOTH NUMBERS ARE PRESENT \u2014 "2" alone is not progress toward ' +
           'anything. ROADMAP 14 calls this a requirement: the old rule was ' +
           'unfalsifiable from outside, which is why nobody could report it broken');
        ok(/[Mm]astered/.test(make(MASTERY_POINTS)),
           'D4 at the threshold it says so in words');
        ok(make(MASTERY_POINTS) !== make(1),
           'D5 mastered and not-yet-mastered do not render identically');
    }
}

console.log(`\n${fail === 0 ? 'PASS' : 'RED'} — ${pass} passing, ${fail} failing`);
process.exit(fail === 0 ? 0 : 1);
