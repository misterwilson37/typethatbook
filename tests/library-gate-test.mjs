// library-gate-test.mjs v1.0.0 — Round 134 (Bodoni II). ROADMAP 131a.
//
// ⚠️ NOT lesson-gate-test.mjs, WHICH ALREADY EXISTS AND TESTS SOMETHING ELSE —
// lesson-gate.js, the arcade's graded gate (Round 29). This file tests the LIBRARY
// gate in game.js. Two gates, two files; do not merge them by name.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ UNDER 15 WPM OR 80% STOPS LIBRARY TIME COUNTING, UNTIL THEY'RE BETTER.
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-23: *"Kids who are typing less than 15 words a minute do not know
// how to type. … pushing kids to the lessons if they're doing less than 15 wpm or
// 80% accuracy is just reinforcing the expectation."* And the unlock: *"they won't
// get to count the time until they're better, and that's what matters."*
//
// ⭐ THE GATE FUNCTIONS ARE LIFTED OUT OF game.js AND RUN, not re-implemented. Only
// the DOM-facing pieces (dialog, timer styling, toast) and logOpenSprint() are
// stubbed — and the stubs RECORD what they were asked to do, so the harness sees
// whether the real logic asked for the right thing at the right moment.

import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const game = readFileSync(path.join(ROOT, 'game.js'), 'utf8');
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok    ' + m); } else { fails.push(m); console.log('  FAIL  ' + m); } };

function extractFn(src, name) {
    const start = src.indexOf(`function ${name}(`);
    if (start < 0) return null;
    let i = src.indexOf('{', start), depth = 0;
    for (let j = i; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
    }
    return null;
}
const constLine = (name) => { const m = new RegExp(`const ${name} = [^;]+;`).exec(game); return m ? m[0] : null; };

const FNS = ['gateToday', 'gateStorageKey', 'gateFresh', 'gateEnsure', 'gateSave', 'gateLocked',
             'gateOnActiveTick', 'gateOnKey', 'gateMeasure', 'gatePasses', 'gateResetWindow',
             'gateResetSprintMarkers', 'gateJudge', 'gateMaybeShow',
             'gateChooseLessons', 'gateChooseChance', 'gateChooseLock'];
const CONSTS = ['GATE_WINDOW_MS', 'GATE_MIN_WPM', 'GATE_MIN_ACC', 'GATE_FALLBACK_MS', 'GATE_KEY'];

console.log('\nA — THE RULING, READ OUT OF game.js');
ok(FNS.every(f => !!extractFn(game, f)), `A0 game.js defines all ${FNS.length} gate functions`);
ok(CONSTS.every(c => !!constLine(c)), 'A0b and all five constants');
ok(/const GATE_MIN_WPM = 15;/.test(game), '⭐ A1 the speed line is 15 WPM — Jake\u2019s number');
ok(/const GATE_MIN_ACC = 80;/.test(game), '⭐ A2 the accuracy line is 80% — Jake\u2019s number');
ok(/const GATE_WINDOW_MS = 60000;/.test(game), '⭐ A3 one judging window is one minute');

function sandbox(env) {
    const src = CONSTS.map(constLine).join('\n') + '\n' + FNS.map(f => extractFn(game, f)).join('\n');
    return new Function('env', `
        let currentUser = env.user;
        const localStorage = env.ls;
        function getLocalDateStr() { return env.today(); }
        let sprintSeconds = 60, sprintMistakes = 3, sprintCharStart = 0, currentCharIndex = 0;
        const document = { getElementById: () => null };
        function gateShow(kind) { env.shown.push(kind); }
        function gateApplyTimerLook() { env.looks.push(gateLocked()); }
        function gateToast(m) { env.toasts.push(m); }
        function logOpenSprint(reason) { env.logged.push({ reason, lockedAtCall: gateLocked() }); }
        // ⚠️ RECORDED, not merely tolerated: every run reset must pair with a
        // watermark reset (open-unit-test's rule), and C18b/C10b assert it happened.
        function resetSprintLogWatermark() { env.watermarks++; }
        let gate = null;
        ${src}
        return {
            tick: (ms) => gateOnActiveTick(ms), key: (c) => gateOnKey(c), maybe: (ch) => gateMaybeShow(ch),
            chance: () => gateChooseChance(), lock: () => gateChooseLock(), lessons: () => gateChooseLessons(),
            state: () => { gateEnsure(); return JSON.parse(JSON.stringify(gate)); },
            locked: () => { gateEnsure(); return gateLocked(); },
            sprint: () => ({ sprintSeconds, sprintMistakes }),
            ageP: (ms) => { gateEnsure(); gate.pendingSince -= ms; },
        };
    `)(env);
}
const memLS = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)) }; };
const mkEnv = (over = {}) => ({ user: { uid: 'kid1' }, ls: memLS(), today: () => '2026-09-24',
                                shown: [], looks: [], toasts: [], logged: [], watermarks: 0, ...over });

// One minute of ACTIVE typing at a given speed and accuracy, delivered in the same
// 100 ms ticks gameTick() uses. Returns milliseconds CREDITED.
function typeMinute(g, wpm, acc) {
    const correct = Math.round(wpm * 5);
    const mistakes = acc >= 100 ? 0 : Math.round(correct * (100 - acc) / acc);
    const keys = [...Array(correct).fill(true), ...Array(mistakes).fill(false)];
    let k = 0, cred = 0;
    for (let t = 0; t < 600; t++) {
        const want = Math.floor(((t + 1) / 600) * keys.length);
        while (k < want) g.key(keys[k++]);
        if (g.tick(100)) cred += 100;
    }
    return cred;
}

console.log('\nB — ⭐ A CHILD WHO CAN TYPE NEVER SEES IT');
{
    const env = mkEnv(); const g = sandbox(env);
    let total = 0;
    for (let i = 0; i < 5; i++) total += typeMinute(g, 90, 97);
    ok(env.shown.length === 0 && !g.state().pending, 'B1 five minutes at 90 WPM, 97% — no choice, ever');
    ok(total === 5 * 60000, 'B2 and every second of it is credited');
    const g2 = sandbox(mkEnv());
    typeMinute(g2, 15, 80);
    ok(!g2.state().pending, '⚠️ B3 EXACTLY 15 WPM at EXACTLY 80% passes — the line is "less than"');
}

console.log('\nC — ⚠️⚠️⚠️ THE FULL FLOW, AS RULED');
{
    const env = mkEnv(); const g = sandbox(env);
    ok(typeMinute(g, 10, 92) === 60000, 'C1 the first minute is always credited — garbage or not');
    ok(g.state().pending === 'first', 'C2 10 WPM → the FIRST choice is pending');
    g.maybe('a');
    ok(env.shown.length === 0, '⚠️ C3 it does NOT appear mid-word');
    g.maybe('.');
    ok(env.shown[0] === 'first', 'C4 it appears at the sentence end');
    g.chance();
    ok(g.state().stage === 'chance' && g.state().chanceUsed, 'C5 "another chance" is recorded');
    ok(g.state().win.ms === 0, '⭐ C6 and the window restarts, so the next minute is judged ALONE');
    ok(typeMinute(g, 11, 90) === 60000, 'C7 the chance minute is credited');
    ok(g.state().pending === 'second', 'C8 still under → the SECOND choice is pending');
    g.maybe('!');
    ok(env.shown[1] === 'second', 'C9 and it appears at the next sentence end');
    env.logged.length = 0;
    g.lock();
    ok(env.logged.length === 1 && env.logged[0].lockedAtCall === false,
       '⚠️⚠️ C10 keeping going CLOSES THE HONEST RUN FIRST, before the lock engages');
    ok(g.locked(), 'C11 then the lock engages');
    ok(env.watermarks >= 1,
       '⚠️⚠️ C10b and the run reset at the lock ALSO resets the log watermark — the bug '
       + 'open-unit-test caught in this round\u2019s first draft');
    ok(env.looks[env.looks.length - 1] === true, '⭐ C12 and the timer is told to show it');
    ok(typeMinute(g, 11, 90) === 0, '⚠️⚠️⚠️ C13 LOCKED: a whole minute of typing credits NOTHING');
    ok(!g.state().pending && env.shown.length === 2, '⚠️ C14 a bad locked minute does not nag — they already chose');
    ok(typeMinute(g, 18, 88) === 0, 'C15 the proving minute itself is not credited retroactively');
    ok(!g.locked() && g.state().stage === 'ok', '⭐⭐ C16 A GOOD MINUTE UNLOCKS — performance, not attendance');
    ok(env.toasts.length === 1, 'C17 and the child is told their time counts again');
    ok(g.sprint().sprintSeconds === 0 && g.sprint().sprintMistakes === 0,
       '⚠️ C18 and a FRESH run starts, so the locked stretch is never part of one');
    ok(typeMinute(g, 18, 88) === 60000, 'C19 after the unlock, time is credited again');
}

console.log('\nD — ⚠️ ACCURACY ALONE IS ENOUGH, AND SO IS SPEED ALONE');
{
    const g = sandbox(mkEnv()); typeMinute(g, 40, 72);
    ok(g.state().pending === 'first', 'D1 40 WPM at 72% — fast but inaccurate — is under the line');
    const g2 = sandbox(mkEnv()); typeMinute(g2, 12, 99);
    ok(g2.state().pending === 'first', 'D2 12 WPM at 99% — careful but slow — is under the line');
}

console.log('\nE — ⚠️⚠️ ONE "ANOTHER CHANCE" PER DAY');
{
    const g = sandbox(mkEnv());
    typeMinute(g, 10, 90); g.maybe('.'); g.chance();
    typeMinute(g, 25, 95);
    ok(g.state().stage === 'ok' && !g.state().pending, 'E1 a recovered chance minute returns to normal');
    typeMinute(g, 9, 85);
    ok(g.state().pending === 'second',
       '⚠️⚠️ E2 a second slip the same day goes STRAIGHT to the second choice — a rough morning, not a rough every minute');
}

console.log('\nF — ⭐ A CHILD WHO NEVER ENDS A SENTENCE STILL SEES IT');
{
    const env = mkEnv(); const g = sandbox(env);
    typeMinute(g, 10, 90);
    g.maybe(' ');
    ok(env.shown.length === 0, 'F1 a space straight away is not a trigger');
    g.ageP(20000); g.maybe('q');
    ok(env.shown.length === 0, '⚠️ F2 even after 20 s, never mid-word');
    g.maybe(' ');
    ok(env.shown[0] === 'first', 'F3 after 20 s pending, the next word boundary is');
    const env2 = mkEnv(); const g2 = sandbox(env2);
    typeMinute(g2, 10, 90); g2.maybe('__resume__');
    ok(env2.shown[0] === 'first', '⭐ F4 a hard-stop resume is a trigger — Jake\u2019s "after an error reset"');
}

console.log('\nG — ⚠️⚠️⚠️ A RELOAD IS NOT A FREE RESET; A NEW DAY IS');
{
    const ls = memLS();
    const g = sandbox(mkEnv({ ls }));
    typeMinute(g, 10, 90); g.maybe('.'); g.chance();
    typeMinute(g, 10, 90); g.maybe('.'); g.lock();
    const g2 = sandbox(mkEnv({ ls }));
    ok(g2.locked(), '⚠️⚠️⚠️ G1 AFTER A RELOAD THE CHILD IS STILL LOCKED');
    ok(typeMinute(g2, 10, 90) === 0, 'G2 and still credits nothing');

    const ls2 = memLS(); const ga = sandbox(mkEnv({ ls: ls2 }));
    for (let t = 0; t < 590; t++) { ga.key(t % 12 === 0); ga.tick(100); }
    const gb = sandbox(mkEnv({ ls: ls2 }));
    ok(gb.state().win.ms >= 58000, '⚠️⚠️ G3 a reload at 59 s does NOT restart the window — no endless free minutes');

    const tomorrow = sandbox(mkEnv({ ls, today: () => '2026-09-25' }));
    ok(!tomorrow.locked() && tomorrow.state().stage === 'ok' && !tomorrow.state().chanceUsed,
       '⭐⭐ G4 THE NEXT DAY IS A FRESH START — unlocked, with a new chance, as Jake ruled');
    const other = sandbox(mkEnv({ ls, user: { uid: 'kid2' } }));
    ok(!other.locked(), '⚠️ G5 one child\u2019s lock never leaks to another on a shared machine');
}

console.log('\nH — ⚠️⚠️⚠️ WHILE LOCKED, NOTHING IS RECORDED — THE STRUCTURE THAT MAKES IT TRUE');
{
    const code = game.replace(/^\s*\/\/.*$/gm, '');
    ok(/IDLE_THRESHOLD && gateOnActiveTick\(100\)\)/.test(code),
       '⚠️⚠️ H1 the credit block — all three clocks — is gated on gateOnActiveTick()');
    ok(/if \(!gateLocked\(\)\) \{\s*statsData\.charsToday\+\+/.test(code), 'H2 day characters are not recorded while locked');
    ok(/if \(!gateLocked\(\)\) \{ statsData\.mistakesToday\+\+/.test(code), 'H3 day mistakes are not recorded while locked');
    ok(/mistakes\+\+; if \(!gateLocked\(\)\) sprintMistakes\+\+;/.test(code), 'H4 run mistakes are not recorded while locked');
    ok(/consecutiveMistakes\+\+/.test(code), '⭐ H5 but LIVE mistakes still count, so the hard stop still fires on garbage');
    const los = extractFn(game, 'logOpenSprint').replace(/^\s*\/\/.*$/gm, '');
    ok(/^function logOpenSprint[^{]*\{\s*if \(gateLocked\(\)\) \{ gateResetSprintMarkers\(\); return; \}/.test(los),
       '⚠️⚠️⚠️ H6 logOpenSprint() refuses to record a locked stretch as a run — its FIRST line');
    ok(/gateMaybeShow\('__resume__'\)/.test(extractFn(game, 'resumeGame')), 'H7 resumeGame() offers the hard-stop trigger');
    const gs = extractFn(game, 'gateShow');
    ok(/disabled/.test(gs) && /GATE_ARM_MS/.test(gs),
       '⚠️⚠️ H8 the buttons start DISABLED — a child mid-word cannot pick one with a stray Space');
    ok(/learn\.html/.test(gs), 'H9 "Go to lessons" goes to School');
    ok(!/logOpenSprint/.test(extractFn(game, 'gateChooseLessons')),
       '⚠️ H10 going to lessons does NOT log the run itself — the unload flush does, once');
}

console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed` : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
