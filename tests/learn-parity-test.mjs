// learn-parity-test.mjs v1.0.0 — Round 165. SCHOOL AND SCHOOL BETA DIFFER ONLY BY THE GAMES.
//
// Jake, 2026-11-11: *"I believe the only two differences between lessons and lessons beta are
// the games and the resume where left off... If there are other differences, let me know.
// People are pretty happy with beta, but not everyone likes the games."*
//
// Round 165 ported the resume (run-picker.js openingRunIdx()) and the intro run picker into
// learn.js. ⭐ THIS FILE KEEPS THE ANSWER TRUE: every function the two files share must be
// identical (comments and whitespace ignored) unless it is on ALLOWED below, and every
// function only one file has must be a game function. A fix made in one page and not the
// other turns this red — which is how the two had drifted apart before.
//
// ⚠️ ADDING TO ALLOWED IS A DECISION, NOT A FIX. Each entry says why that function may
// differ. If the reason is not "the games" or "the page's own name", the right change is
// almost always to copy the code across instead.
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0; const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };
const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

function strip(s) {
    return s.replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '')
            .replace(/\s\/\/.*$/gm, '')
            .replace(/\s+/g, ' ').trim();
}
function functions(src) {
    const out = {};
    const re = /^(async )?function ([A-Za-z0-9_]+)\s*\(/gm;
    let m;
    while ((m = re.exec(src))) {
        let i = src.indexOf('{', m.index + m[0].length), d = 0, j = i;
        for (; j < src.length; j++) {
            if (src[j] === '{') d++;
            else if (src[j] === '}' && --d === 0) break;
        }
        out[m[2]] = strip(src.slice(m.index, j + 1));
    }
    return out;
}

// Shared functions allowed to differ, and why.
const ALLOWED = {
    beginStep:             'games — a game run mounts Deadline instead of the drill',
    buildRunList:          'games — attachGameSlot() appends the Deadline run',
    recordRunOutcome:      'games — learn2 counts typed runs through typedRunCountLocal()',
    renderRunPicker:       'games — BETA draws the Deadline run as a 🚀 chip',
    syncIntroStartLabel:   'games — BETA says "Play Deadline" on the game run',
    restartLesson:         'games — tears down a running game',
    stopLesson:            'games — tears down a running game',
    showLessonResultModal: 'games — "City Defended!" and the game pass',
    updateHUD:             'games — the HUD shows the game\'s own WPM/accuracy',
    updateVersionFooter:   'the page\'s own name in the footer',
    _renderFullBuildPanel: 'the page\'s own name in the build panel',
};
// Functions only BETA has: the games.
const BETA_ONLY = ['attachGameSlot', 'bankGameSecond', 'beginGameStep', 'cumulativeKeyCount',
    'destroyGameHandle', 'finishGameStep', 'gameSlotIdx', 'isGameRun', 'renderGameLostResult',
    'typedRunCountLocal'];

const A = functions(read('learn.js')), B = functions(read('learn2.js'));

console.log('\nA — EVERY SHARED FUNCTION IS IDENTICAL, OR ON THE LIST WITH A REASON');
for (const k of Object.keys(A).filter(k => k in B).sort()) {
    if (k in ALLOWED) continue;
    ok(A[k] === B[k], `⚠️⚠️ ${k}() differs between learn.js and learn2.js — copy the change across, or add it to ALLOWED with a reason`);
}
for (const k of Object.keys(ALLOWED)) {
    ok(k in A && k in B, `A2 ${k} is still in both files (a stale ALLOWED entry hides nothing, but it misleads)`);
}

console.log('\nB — ONLY THE GAMES ARE BETA-ONLY, AND NOTHING IS SCHOOL-ONLY');
for (const k of Object.keys(A)) ok(k in B, `⚠️ ${k}() is only in learn.js — BETA is missing it`);
for (const k of Object.keys(B)) {
    if (!(k in A)) ok(BETA_ONLY.includes(k), `⚠️ ${k}() is only in learn2.js — port it to learn.js, or list it as a game function`);
}

console.log('\nC — ⭐ THE RESUME AND THE PICKER ARE ON SCHOOL TOO');
{
    const src = read('learn.js');
    ok(/import \{[^}]*openingRunIdx[^}]*\} from '\.\/run-picker\.js'/.test(src), 'C1 learn.js imports openingRunIdx');
    ok(/currentStepIdx = openingRunIdx\(firstOpenRunIdx\(lesson\),\s*userProgress\[lesson\.id\], currentRuns\);/.test(src),
       '⭐ C2 a lesson opens where the student left off, not at the first unmastered run');
    ok(A.showIntro && /renderRunPicker\(lesson\)/.test(A.showIntro), 'C3 the intro draws the run picker');
    ok(!/gameSlotIdx|Deadline/.test(A.renderRunPicker || ''), 'C4 School\'s picker has no game chip');
    const html = read('learn.html');
    const panel = html.indexOf('id="intro-panel"'), intro = html.indexOf('id="intro-run-picker"'),
          drill = html.indexOf('id="active-drill"');
    ok(intro > 0, 'C5 learn.html has the picker\'s host');
    ok(panel > 0 && panel < intro && intro < drill, 'C6 …on the intro panel, before (outside) the typing view');
}

console.log(fail ? `\nlearn-parity-test: ${pass} passed, ${fail} FAILED` : `\nlearn-parity-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   ✗ ' + f)); process.exit(1); }
