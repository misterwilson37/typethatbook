// open-unit-test.mjs v1.2.2 — the open sprint / open run, and the watermark that
//
// v1.2.2 — ⚠️ ARRIVED TWICE AS v1.2.0 WITH ITS CONTENT ALREADY CHANGED. The
//          concurrent round moved the session-log.js pin from 1.2.1 to 1.3.0 and
//          left the header alone both times, so two different files were calling
//          themselves v1.2.0. v1.2.1 was spent on the tests/ move, so this is
//          1.2.2: the pin change, plus `../` source paths for tests/.
// stops it being counted twice. Round 13 (Ludlow), DESIGN-TELEMETRY §7 step 1.5.
//
// v1.2.0 — Part E also guards the PAINT, not just the increment: v3.26.0 gated\n//          both and shipped looking correct.\n// v1.1.0 — PART E is new: one-increment-site guards for both page controllers
//          (DESIGN-TELEMETRY §7 step 1.75). Same reasoning as Part C — the
//          shipped sources are counted, not trusted.
//          Invariant citation renumbered against the consolidated HANDOFF.md §5,
//          and the Part D version pin follows session-log.js to 1.2.1.
//          ⚠️ THERE ARE TWO PINS ON session-log.js — this one and
//          session-merge-test.mjs's. Both must move together. Round 14 moved one
//          and not the other and the suite named the miss on the first run, which
//          is the entire reason they are written as pins rather than as a comment.
//
// WHAT THIS PROTECTS
//
// Before v3.24.0 / v2.8.0 a session record existed only for a COMPLETED sprint or
// run. Time typed by a student who switched books every few sentences was in the
// counters and nowhere else. Closing the open unit fixes that and creates a new
// hazard in the same motion: one stretch of typing can now be reported twice —
// once as a partial, once when it finishes — so the writers must emit DELTAS.
//
// ⚠️ THE FAILURE THIS HARNESS EXISTS FOR IS DOUBLE COUNTING, which is the exact
// class of defect that cost Round 12 a day. A missing record is visible as an
// absence; a duplicated one looks like a student who typed more than they did.
//
// HOW IT RUNS THE REAL CODE
//
// `logSession()` (game.js) and `logRun()` (learn.js) are lifted by brace-matching
// and executed in a sandbox, with their module-scope dependencies passed in as
// parameters — the pattern session-merge-test.mjs uses on mergeGuestStats().
//
// ⚠️ INVARIANT 42 ("A LIFTED FUNCTION MUST BE SELF-CONTAINED") APPLIES AND WILL
// BITE THE NEXT PERSON. Every module-scope name
// these functions touch has to be supplied here. Add a dependency to either
// function and this harness must be updated in the same commit, or it fails with
// a ReferenceError that looks like a bug in the sandbox rather than in the change.
// The watermarks are declared INSIDE the sandbox so that assignments to them
// persist across calls, which is what makes the delta behaviour testable at all.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };

function lift(src, name) {
    const start = src.indexOf('function ' + name + '(');
    if (start < 0) return null;
    let depth = 0, i = src.indexOf('{', start);
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) break; }
    }
    return src.slice(start, i + 1);
}

const gameSrc  = readFileSync(new URL('../game.js',  import.meta.url), 'utf8');
const learnSrc = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');

// ─── A. game.js logSession() + logOpenSprint() ───────────────────────────────
console.log('\n─── A. game.js: the open sprint ───');

// ⚠️ THE SANDBOX SOURCE IS BUILT BY CONCATENATION, NOT BY A TEMPLATE LITERAL.
// sanitizeSprintWPM() contains a template literal of its own, and `${wpm}` inside
// a lifted body is interpolated by the OUTER template before Node ever parses the
// sandbox — a SyntaxError pointing at this file rather than at the real cause.
// Any future harness that lifts a function with a backtick in it hits this.
function buildSandbox(parts) { return parts.join('\n'); }

function makeLibrarySandbox() {
    const pushed = [];
    const body      = lift(gameSrc, 'logSession');
    const openBody  = lift(gameSrc, 'logOpenSprint');
    const resetBody = lift(gameSrc, 'resetSprintLogWatermark');
    const sanBody   = lift(gameSrc, 'sanitizeSprintWPM');
    ok(!!body,      'game.js: logSession() exists');
    ok(!!openBody,  'game.js: logOpenSprint() exists');
    ok(!!resetBody, 'game.js: resetSprintLogWatermark() exists');
    ok(!!sanBody,   'game.js: sanitizeSprintWPM() exists and is lifted, not stubbed');
    if (!body || !openBody || !resetBody || !sanBody) return null;

    const state = {
        isGameActive: true, sprintSeconds: 0, sprintMistakes: 0,
        currentCharIndex: 0, sprintCharStart: 0,
    };
    const src = buildSandbox([
        'let isGameActive = true, sprintSeconds = 0, sprintMistakes = 0;',
        'let currentCharIndex = 0, sprintCharStart = 0;',
        'let sprintLoggedSeconds = 0, sprintLoggedChars = 0, sprintLoggedMistakes = 0;',
        'let statsDocDirty = false;',
        'let currentChapterNum = 3;',
        sanBody, resetBody, body, openBody,
        'function apply() {',
        '  isGameActive = state.isGameActive;',
        '  sprintSeconds = state.sprintSeconds;',
        '  sprintMistakes = state.sprintMistakes;',
        '  currentCharIndex = state.currentCharIndex;',
        '  sprintCharStart = state.sprintCharStart;',
        '}',
        'return {',
        '  hide() { apply(); logOpenSprint("hidden"); },',
        '  finish() {',
        '    apply();',
        '    const chars = currentCharIndex - sprintCharStart;',
        '    const mins = sprintSeconds / 60;',
        '    const wpm = sanitizeSprintWPM(mins > 0 ? Math.round((chars/5)/mins) : 0, chars);',
        '    const acc = (chars + sprintMistakes) > 0',
        '      ? Math.round((chars / (chars + sprintMistakes)) * 100) : 100;',
        '    logSession(sprintSeconds, chars, sprintMistakes, wpm, acc);',
        '  },',
        '  newSprint() { resetSprintLogWatermark(); },',
        '  watermark() { return sprintLoggedSeconds; },',
        '};',
    ]);
    const api = new Function('state', 'sessionLogPush', 'markDirty', 'getLocalDateStr',
                             'currentUser', 'sessionExpired', 'lastKnownUid', 'currentBookId', src)(
        state, (uid, r) => { pushed.push(r); return true; }, () => {},
        () => '2026-08-18', { uid: 'stu1', isAnonymous: false }, false, '', 'wizard_of_oz');
    return { api, state, pushed };
}

const lib = makeLibrarySandbox();
if (lib) {
    const { api, state, pushed } = lib;

    // ⚠️ THE CASE JAKE DESCRIBED: type, switch books, come back, finish.
    state.sprintSeconds = 40; state.currentCharIndex = 200;
    api.hide();
    ok(pushed.length === 1, `hiding mid-sprint writes one record (got ${pushed.length})`);
    ok(pushed[0].seconds === 40, `the partial holds the 40 seconds typed so far (got ${pushed[0]?.seconds})`);
    ok(!pushed[0].continuation, 'the first record of a sprint is not a continuation');

    state.sprintSeconds = 65; state.currentCharIndex = 330;
    api.finish();
    ok(pushed.length === 2, `finishing writes a second record (got ${pushed.length})`);
    ok(pushed[1].seconds === 25,
       `⚠️ the second record is the DELTA (25), not the total (65) — got ${pushed[1]?.seconds}`);
    ok(pushed[1].continuation === true, 'the remainder is marked as a continuation');
    ok(pushed.reduce((a, r) => a + r.seconds, 0) === 65,
       'the records sum to the sprint exactly: nothing lost, nothing doubled');
    ok(pushed.reduce((a, r) => a + r.chars, 0) === 330,
       'characters sum to the sprint exactly');

    // Repeated hides — a student bouncing to Classroom eight times.
    pushed.length = 0; api.newSprint();
    state.sprintSeconds = 30; state.sprintCharStart = 0; state.currentCharIndex = 100;
    api.hide(); api.hide(); api.hide();
    ok(pushed.length === 1,
       `three hides with no typing between them write ONE record (got ${pushed.length})`);

    // A hide immediately followed by completion with nothing typed between.
    pushed.length = 0; api.newSprint();
    state.sprintSeconds = 20; state.currentCharIndex = 80;
    api.hide(); api.finish();
    ok(pushed.length === 1,
       `hide-then-finish with no typing between writes ONE record (got ${pushed.length})`);
    ok(pushed[0].seconds === 20, 'and it holds the whole 20 seconds');

    // The sub-5-second tail. ⚠️ It must be KEPT, or session sums drift below the
    // counters — the undercount step 2 must not inherit.
    pushed.length = 0; api.newSprint();
    state.sprintSeconds = 40; state.currentCharIndex = 200;
    api.hide();
    state.sprintSeconds = 43; state.currentCharIndex = 210;
    api.finish();
    ok(pushed.length === 2, `a 3-second tail is still recorded (got ${pushed.length} records)`);
    ok(pushed.reduce((a, r) => a + r.seconds, 0) === 43,
       'the tail is included, so the sum still equals the sprint');

    // A trivial standalone hide is still refused: the floor keeps its old job.
    pushed.length = 0; api.newSprint();
    state.sprintSeconds = 3; state.currentCharIndex = 8;
    api.hide();
    ok(pushed.length === 0, 'a 3-second sprint that was never recorded is still refused');
    ok(api.watermark() === 0,
       '⚠️ a refused record does not advance the watermark, or its seconds would be orphaned');
    state.sprintSeconds = 30; state.currentCharIndex = 120;
    api.finish();
    ok(pushed.length === 1 && pushed[0].seconds === 30,
       'those 3 seconds arrive inside the full record later');

    // A rollback that moves the cursor backwards must not write a negative.
    pushed.length = 0; api.newSprint();
    state.sprintSeconds = 30; state.currentCharIndex = 120;
    api.hide();
    state.sprintSeconds = 30; state.currentCharIndex = 90;   // warp backwards
    api.finish();
    ok(pushed.every(r => r.seconds >= 0 && r.chars >= 0), 'no record carries a negative quantity');

    // A new sprint starts clean.
    pushed.length = 0; api.newSprint();
    state.sprintSeconds = 12; state.sprintCharStart = 90; state.currentCharIndex = 150;
    api.finish();
    ok(pushed.length === 1 && pushed[0].seconds === 12 && !pushed[0].continuation,
       'after resetSprintLogWatermark() the next sprint records in full');

    ok(pushed[0].source === 'library', "records are stamped source 'library'");
}

// ─── B. learn.js logRun() + logOpenRun() ─────────────────────────────────────
console.log('\n─── B. learn.js: the open run ───');

function makeSchoolSandbox() {
    const pushed = [];
    const body      = lift(learnSrc, 'logRun');
    const openBody  = lift(learnSrc, 'logOpenRun');
    const resetBody = lift(learnSrc, 'resetStepLogWatermark');
    ok(!!body,      'learn.js: logRun() exists');
    ok(!!openBody,  'learn.js: logOpenRun() exists');
    ok(!!resetBody, 'learn.js: resetStepLogWatermark() exists');
    if (!body || !openBody || !resetBody) return null;

    const state = { stepSeconds: 0, chars: 0, mistakes: 0 };
    const src = buildSandbox([
        'let stepSeconds = 0, chars = 0, mistakes = 0;',
        'let stepLoggedSeconds = 0, stepLoggedChars = 0, stepLoggedMistakes = 0;',
        'let currentLesson = { id: "lesson_3" }, currentStepIdx = 0;',
        'function netWPM() {',
        '  if (stepSeconds <= 0) return 0;',
        '  const correct = Math.max(0, chars - mistakes);',
        '  return Math.round((correct / 5) / (stepSeconds / 60));',
        '}',
        'function accuracyPct() {',
        '  return chars > 0 ? Math.round(((chars - mistakes) / chars) * 100) : 100;',
        '}',
        resetBody, body, openBody,
        'function apply() {',
        '  stepSeconds = state.stepSeconds; chars = state.chars; mistakes = state.mistakes;',
        '}',
        'return {',
        '  hide() { apply(); logOpenRun("hidden"); },',
        '  finish() { apply(); logRun(netWPM(), accuracyPct()); },',
        '  newRun() { resetStepLogWatermark(); },',
        '  watermark() { return stepLoggedSeconds; },',
        '};',
    ]);
    const api = new Function('state', 'sessionLogPush', 'getLocalDateStr',
                             'currentUser', 'sessionExpired', 'lastKnownUid', src)(
        state, (uid, r) => { pushed.push(r); return true; },
        () => '2026-08-18', { uid: 'stu1' }, false, '');
    return { api, state, pushed };
}

const school = makeSchoolSandbox();
if (school) {
    const { api, state, pushed } = school;

    // ⚠️ THE BELL CASE. A run abandoned halfway used to leave no record at all.
    state.stepSeconds = 50; state.chars = 180; state.mistakes = 6;
    api.hide();
    ok(pushed.length === 1, `hiding mid-run writes a record (got ${pushed.length})`);
    ok(pushed[0].seconds === 50, 'the partial holds the run so far');
    ok(pushed[0].source === 'school', "records are stamped source 'school'");

    state.stepSeconds = 70; state.chars = 250; state.mistakes = 8;
    api.finish();
    ok(pushed[1] && pushed[1].seconds === 20,
       `finishing writes only the delta (20), not the total (70) — got ${pushed[1]?.seconds}`);
    ok(pushed[1].mistakes === 2, 'mistakes are a delta too (got ' + pushed[1]?.mistakes + ')');
    ok(pushed.reduce((a, r) => a + r.seconds, 0) === 70, 'records sum to the run exactly');

    // The continuation's WPM must describe the continuation, not the whole run.
    ok(pushed[1].wpm !== pushed[0].wpm || pushed[1].chars === pushed[0].chars,
       'a continuation carries its own recomputed WPM, not the run-wide figure');

    pushed.length = 0; api.newRun();
    state.stepSeconds = 0; state.chars = 0; state.mistakes = 0;
    api.hide();
    ok(pushed.length === 0, 'a run with nothing typed writes nothing on hide');

    pushed.length = 0; api.newRun();
    state.stepSeconds = 45; state.chars = 150; state.mistakes = 3;
    api.hide(); api.finish();
    ok(pushed.length === 1, 'hide-then-finish with no typing between writes one record');
}

// ─── C. the watermark is reset everywhere the counters are ───────────────────
console.log('\n─── C. reset-site parity ───');

// ⚠️ READ OUT OF THE SHIPPED FILES. This is the guard for the one mistake that
// silently loses data going forward: adding a new place that zeroes the sprint or
// run counters without also resetting the watermark. The next sprint then records
// NOTHING until it grows past the previous one's length.
const gameResetSites  = (gameSrc.match(/^\s*sprintSeconds = 0;/gm)  || []).length;
const gameWatermarks  = (gameSrc.match(/resetSprintLogWatermark\(\);/g) || []).length;
ok(gameResetSites > 0, `game.js: found ${gameResetSites} sprintSeconds reset sites`);
ok(gameWatermarks >= gameResetSites,
   `⚠️ game.js: every sprintSeconds reset has a watermark reset ` +
   `(${gameResetSites} resets, ${gameWatermarks} watermark calls)`);

const learnResetSites = (learnSrc.match(/^\s*(stepSeconds\s+= 0;|chars\s+= 0;)/gm) || []).length;
const learnWatermarks = (learnSrc.match(/resetStepLogWatermark\(\);/g) || []).length;
ok(learnResetSites > 0, `learn.js: found ${learnResetSites} run-counter reset sites`);
ok(learnWatermarks >= 3,
   `⚠️ learn.js: run-counter resets carry a watermark reset ` +
   `(${learnResetSites} counter resets, ${learnWatermarks} watermark calls)`);

// The exit paths must exist. A closer nobody calls is worse than no closer,
// because the design document will say the case is handled.
ok(/logOpenSprint\('hidden'\)/.test(gameSrc),  'game.js closes the open sprint on visibilitychange');
ok(/logOpenSprint\('left page'\)/.test(gameSrc), 'game.js closes the open sprint on pagehide');
ok(/logOpenRun\('hidden'\)/.test(learnSrc),    'learn.js closes the open run on visibilitychange');
ok(/logOpenRun\('left page'\)/.test(learnSrc), 'learn.js closes the open run on pagehide/beforeunload');

// ⚠️ finishStep() must NOT still contain an inline push, or a completed run is
// filed twice: once by logRun() and once by the leftover.
// ⚠️ COMMENTS ARE STRIPPED FIRST. The first version of this assertion failed on
// the comment that EXPLAINS the removal — a test that reads prose as code will
// eventually pass or fail for the wrong reason, and this one failed loudly on the
// first run, which is the good case. Do not "fix" it by deleting the comment.
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '')
                                 .replace(/^\s*\/\/.*$/gm, '');
const finishStepBody = stripComments(lift(learnSrc, 'finishStep') || '');
ok(!/sessionLogPush\(/.test(finishStepBody),
   '⚠️ finishStep() no longer pushes a session record directly — it calls logRun()');
ok(/logRun\(/.test(finishStepBody),
   'finishStep() does call logRun() — a removed push with no replacement loses every completed run');

// ─── D. the continuation floor, in the module that enforces it ───────────────
console.log('\n─── D. session-log.js continuation floor ───');

const store = new Map();
globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); },
};
const mod = await import('../session-log.js');
ok(mod.SESSION_LOG_VERSION === '1.3.0',
   `session-log.js reports v1.3.0 (got ${mod.SESSION_LOG_VERSION})`);

const base = { date: '2026-08-18', at: '2026-08-18T09:00:00.000Z', chars: 10,
               mistakes: 0, wpm: 30, accuracy: 100, source: 'library', label: 'oz' };
store.clear();
ok(mod.sessionLogPush('u1', { ...base, seconds: 3 }) === false,
   'a 3-second record that starts a unit is still refused');
ok(mod.sessionLogPush('u1', { ...base, seconds: 3, continuation: true }) !== false,
   '⚠️ a 3-second CONTINUATION is accepted — refusing it undercounts the day');
ok(mod.sessionLogPush('u1', { ...base, seconds: 0, continuation: true }) === false,
   'a zero-second continuation is still refused: nothing happened');


// ─── E. ONE INCREMENT SITE PER PAGE ──────────────────────────────────────────
//
// ⚠️ [STRUCTURAL] These read the shipped sources. DESIGN-TELEMETRY §7 step 1.75:
// every quantity that measures time advances on the same line under the same
// gate. The failure this guards is not a crash — it is a second timer quietly
// counting a different number for the same student, which is exactly the state
// learn.js was in for months while both files looked internally consistent.
console.log('\n─── E. one increment site per page ───');

const learnSrc2 = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');
const gameSrc2  = readFileSync(new URL('../game.js',  import.meta.url), 'utf8');

const learnIncs = (learnSrc2.match(/statsData\.secondsToday\+\+/g) || []).length;
ok(learnIncs === 1,
   `learn.js increments secondsToday in exactly ONE place (found ${learnIncs}) ` +
   `— a second site rebuilds the two-clock split, the hard-stop divergence and ` +
   `the ggBypassIdle asymmetry all at once`);

const gameIncs = (gameSrc2.match(/statsData\.secondsToday\+\+/g) || []).length;
ok(gameIncs === 1,
   `game.js increments secondsToday in exactly ONE place (found ${gameIncs})`);

ok(/if \(drillPos > 0 && !isDrillIdle\(\)\) \{[\s\S]{0,400}?statsData\.secondsToday\+\+/.test(learnSrc2),
   '⚠️ learn.js: secondsToday advances INSIDE the graded gate (drillPos > 0), ' +
   'i.e. not until the first CORRECT keystroke — Jake\'s ruling, 2026-08-18');

ok(/if \(lastInputTime && now - lastInputTime < IDLE_THRESHOLD\)/.test(gameSrc2),
   '⚠️ game.js: the tick is gated on lastInputTime being set — no free seconds ' +
   'before the first keystroke of a sprint');

ok(/if \(lastInputTime && now - lastInputTime > AFK_THRESHOLD/.test(gameSrc2),
   '⚠️ game.js: the AFK check is guarded too — unguarded, `now - 0` auto-pauses ' +
   'every sprint before a key is pressed');

// ⚠️ [STRUCTURAL] The paint must NOT be gated. Part E above guards the counting
// side; this guards the drawing side, because v3.26.0 got the first right and the
// second wrong and shipped looking correct. A gate answers "did time pass?";
// drawing answers "what does the student see?".
ok(/\n    updateTimerUI\(\);\n\n    if \(lastInputTime && now - lastInputTime < IDLE_THRESHOLD\)/.test(gameSrc2),
   '⚠️ game.js paints the readout ABOVE the idle gate — inside it, students see ' +
   'game.html\'s hardcoded "Daily 0:00" placeholder until they type');

ok(/\n        \}\n[\s\S]{0,600}?\n        renderTimeHUD\(\);\n        updateHUD\(\);/.test(learnSrc2),
   '⚠️ learn.js paints the readout OUTSIDE the graded gate, not within it');

ok(!/learnTickInterval = setInterval/.test(learnSrc2),
   '⚠️ learn.js declares no second interval — learnTickInterval is an ALIAS for ' +
   'the one tick, so all nine existing clearInterval sites stay correct');


console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
