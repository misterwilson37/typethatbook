// remediation-test.mjs v1.0.0 — ⚠️⚠️ A PRACTICE DRILL IS NOT A RUN OF THE LESSON.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE DEFECT, FOUND IN THE SHIPPED BUILD (learn.js v2.35.0), ROUND 41
// ═══════════════════════════════════════════════════════════════════════════
//
// `showLessonResultModal()` renders a "🎲 Practice missed keys" button.
// `_practiceMissedKeys()` replaces `currentRuns` with a synthetic one-chunk
// `key_random` drill and calls `beginStep(0)` — and deliberately leaves
// `currentLesson` alone, because the student is still notionally in the lesson.
//
// Everything downstream then read the drill as the lesson's run 1:
//
//   * `logRun()` filed a typing_sessions sprint carrying the LESSON'S id and
//     `detail: "run 1"`, indistinguishable from a real run.
//   * `recordRunOutcome(0, …)` banked mastery points into the real lesson's
//     `runScores["0"]` and wrote **`runCount: 1`** over a 12-run lesson's count —
//     the very field ROADMAP 15's staleness check compares against.
//   * `saveProgress()` marked the WHOLE LESSON `passed` with the drill's grade,
//     bumped `attempts`, overwrote `finalWPM`/`finalAccuracy` and could
//     increment `fireCount`.
//
// ⚠️ AND THE GRADE WAS THE EASIEST ONE IN THE APP. A synthetic step is
// `key_random`, so `gatesForRun()` returns `minWPM: null` — accuracy only — and
// `calculateGrade()` awards A🔥 for a clean run. 83 characters of random letters
// with no mistakes passed a 12-run lesson and unlocked the next one.
//
// ⚠️ THE FIX IS NOT "SUPPRESS EVERYTHING". §0.-21.C's ruling for ROADMAP 10's
// practice mode — write NOTHING, minutes included — is right THERE and wrong
// HERE. That run replays material already mastered; this one is a child typing
// keys they just got wrong. The minutes are real and are filed in BOTH records.
// Only the ASSESSMENT is suppressed. Part C is that distinction.
//
// ⚠️ MUTATION-VERIFIED: 11 failing against learn.js v2.35.0 (Parts A, B and D).

import { readFileSync } from 'fs';
import { calculateGrade, gatesForRun, isAssessedSprint,
         FIRE_GRADE } from '../run-grade.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const src = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');

// ⚠️⚠️ ASSERT ON CODE, NOT ON PROSE. Every position check below was red on
// the first run against the CORRECT build, because this round's own explanatory
// comments name `isLastRun` and `beginStep()` above the lines that use them.
// A harness that reads comments is a harness that can be satisfied by writing a
// comment. run-mastery-test.mjs carries the same helper for the same reason.
const decomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');
const code = decomment(src);

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

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- A. THE DRILL IS FLAGGED, AND THE FLAG REACHES THE RECORD ---');
{
    // ⚠️ IT IS AN ASSIGNMENT, NOT A DECLARATION — `window._practiceMissedKeys =
    // function (…)` — so extractFn() cannot see it. Slice between the two
    // window assignments in DECOMMENTED source, or the doc comment above it
    // (which names the function) is what gets measured.
    // ⚠️ ANCHOR ON THE ASSIGNMENT, NOT THE NAME. The first occurrence of the
    // bare name is the CALL SITE in showLessonResultModal(), 194 characters of
    // unrelated code that happily contains no flag — a slice that measured the
    // wrong region and reported the fix missing when it was present.
    const dStart = code.indexOf('window._practiceMissedKeys = function');
    const dEnd   = code.indexOf('window._gotoLesson = function');
    const detour = (dStart >= 0 && dEnd > dStart) ? code.slice(dStart, dEnd) : null;
    ok(detour !== null, 'A1 the practice-missed-keys detour exists in learn.js');
    ok(detour && /remediationRun\s*=\s*true/.test(detour),
       'A2 ⚠️⚠️ THE DETOUR SETS remediationRun. Without it every downstream ' +
       'writer reads a synthetic key_random drill as the lesson\u2019s run 1');
    ok(detour && detour.indexOf('remediationRun = true') < detour.indexOf('beginStep(0)'),
       '⚠️ A3 SET **BEFORE** beginStep(). beginStep() arms the run mode and can ' +
       'reach a writer; a flag set afterwards is a flag set too late');

    const start = extractFn(code, 'startLesson');
    ok(start && /remediationRun\s*=\s*false/.test(start),
       '⚠️ A4 startLesson() CLEARS IT. currentRuns is rebuilt there and nowhere ' +
       'else, so a flag left standing would silence grading for the rest of the ' +
       'session \u2014 failing toward "nothing counts", which is worse than the bug');

    const logRun = extractFn(code, 'logRun');
    ok(logRun && /practice:\s*'remediation'/.test(logRun),
       'A5 logRun() stamps practice:\u2009\u2019remediation\u2019 on the sprint');
    ok(logRun && /remediationRun\s*\?/.test(logRun),
       '⚠️ A6 THE STAMP IS CONDITIONAL. An ordinary run must not carry it, or ' +
       'the reconstruction skips every run in the archive');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- B. NEITHER MODAL IS REACHED, SO NEITHER WRITER RUNS ---');
{
    const finish = extractFn(code, 'finishStep');
    ok(finish !== null, 'B1 finishStep() exists');
    ok(finish && /if\s*\(\s*remediationRun\s*\)/.test(finish),
       'B2 finishStep() branches on remediationRun');

    // ⚠️ THE PLACEMENT IS THE FIX, NOT THE PRESENCE. Assert the ORDER, the way
    // exit-flush-test.mjs Part D does: a guard inside showLessonResultModal()
    // alone would still grade any drill that chunks into more than one run,
    // because showStepModal() calls recordRunOutcome() too.
    const iBranch = finish ? finish.indexOf('remediationRun') : -1;
    const iFork   = finish ? finish.indexOf('isLastRun') : -1;
    ok(iBranch >= 0 && iFork >= 0 && iBranch < iFork,
       '⚠️⚠️ B3 THE BRANCH IS **ABOVE** THE isLastRun FORK. Both modals write \u2014 ' +
       'showLessonResultModal() calls recordRunOutcome() AND saveProgress(), ' +
       'showStepModal() calls recordRunOutcome() \u2014 so a guard in one of them ' +
       'still grades a multi-chunk drill, which is exactly the student with ' +
       'enough missed keys to need one');
    ok(finish && /return;/.test(finish.slice(iBranch, iFork)),
       'B4 the branch RETURNS rather than falling through');

    ok(extractFn(code, 'renderRemediationResult') !== null,
       'B5 renderRemediationResult() exists \u2014 the student still sees their run');

    const rem = extractFn(code, 'renderRemediationResult') || '';
    ok(!/recordRunOutcome|saveProgress/.test(rem),
       '⚠️ B6 THE RESULT SCREEN WRITES NOTHING. It is a renderer; a write added ' +
       'here would reintroduce the defect one layer down');
    ok(!/beginStep\s*\(/.test(rem),
       '⚠️ B7 NO beginStep() OUT OF IT. currentRuns holds the SYNTHETIC list, so ' +
       'a "next step" button would walk the drill, not the lesson');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- C. THE MINUTES STILL COUNT. THIS IS NOT ROADMAP 10 ---');
{
    const finish = extractFn(code, 'finishStep') || '';
    const iBranch = finish.indexOf('if (remediationRun)');
    ok(finish.indexOf('saveStats()') >= 0 && finish.indexOf('saveStats()') < iBranch,
       '⚠️⚠️ C1 saveStats() RUNS BEFORE THE BRANCH. The child typed; typing_logs ' +
       'gets the seconds. Suppressing them here would manufacture the exact ' +
       'typing_logs / typing_sessions divergence ROADMAP item 4 exists to catch');
    ok(finish.indexOf('logRun(wpm, acc)') >= 0 && finish.indexOf('logRun(wpm, acc)') < iBranch,
       '⚠️⚠️ C2 logRun() RUNS BEFORE THE BRANCH, so typing_sessions gets them too. ' +
       'BOTH records or NEITHER \u2014 never one');

    const rem = extractFn(code, 'renderRemediationResult') || '';
    ok(!/nothing was recorded/i.test(rem),
       '⚠️ C3 IT MUST NOT SAY "NOTHING WAS RECORDED". That is ROADMAP 10\u2019s ' +
       'wording and it would be FALSE here \u2014 the time was recorded. A child ' +
       'told their four minutes did not count stops pressing the one button in ' +
       'this app that answers what they personally got wrong');
    ok(/dm-stats/.test(rem) && /wpm/i.test(rem),
       'C4 the student is still shown their WPM and accuracy');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- D. WHAT THE OLD BUILD WOULD HAVE SCORED ---');
{
    // The synthetic step _practiceMissedKeys() builds, verbatim from learn.js.
    const synthetic = { type: 'key_random', gates: null };
    const gates = gatesForRun(synthetic, { minAccuracy: 85, minWPM: 15 });

    ok(gates.minWPM === null,
       '⚠️ D1 A SYNTHETIC DRILL IS SPEED-UNGATED. key_random is in DRILL_TYPES, ' +
       'so gatesForRun() returns minWPM: null however the lesson is gated');
    ok(calculateGrade(9, 100, gates.minWPM, gates.minAccuracy, true) === FIRE_GRADE,
       '⚠️⚠️ D2 A CLEAN DRILL SCORED A🔥 AT 9 WPM. This is the grade the old ' +
       'build wrote onto the lesson, and A🔥 sets `passed`, feeds fireCount and ' +
       'unlocks the next lesson');

    // The stamp is what lets a reader tell the two apart at all.
    ok(isAssessedSprint({ label: 'u1_l1', detail: 'run 1' }) === true,
       'D3 an ordinary sprint is assessed');
    ok(isAssessedSprint({ label: 'u1_l1', detail: 'run 1', practice: 'remediation' }) === false,
       '⚠️ D4 A STAMPED SPRINT IS NOT. Same lesson id, same run number \u2014 the ' +
       'field is the only thing that distinguishes them');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- E. RULE 9: ONE COPY OF THE GRADE RULE ---');
{
    ok(/from\s+["']\.\/run-grade\.js["']/.test(src),
       'E1 learn.js imports the shared rule');
    ok(!/^function\s+calculateGrade\s*\(/m.test(src),
       '⚠️⚠️ E2 learn.js NO LONGER DEFINES calculateGrade(). Rule 9: the second ' +
       'copy is deleted in the SAME deploy that adds the first, not later');
    ok(!/^function\s+gatesForRun\s*\(/m.test(src),
       'E3 learn.js no longer defines gatesForRun()');
    ok(!/^function\s+chunkSequence\s*\(/m.test(src),
       'E4 learn.js no longer defines chunkSequence()');
    ok(!/^const\s+DRILL_TYPES\s*=/m.test(src),
       'E5 learn.js no longer defines DRILL_TYPES');
    ok(!/^\s*const GRADE_ORDER = \[/m.test(src),
       '⚠️ E6 THE THREE LOCAL GRADE_ORDER COPIES ARE GONE. Two of them were ' +
       'written as literal \u2018A\uD83D\uDD25\u2019 strings and one built the code point \u2014 ' +
       'three spellings of one ordering, in one file');
}

console.log('');
if (fail === 0) console.log(`PASS - ${pass} passing, 0 failing`);
else            console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
