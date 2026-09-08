// arcade-lesson-test.mjs v1.0.0 — ROADMAP 68: arcade.html PLAYS A REAL LESSON
// RUN AT ITS REAL GATES, AND MEANS THE SAME RUN learn.js MEANS.
//
// Jake, 2026-09-08: *"kids who are typing actively doing the final lesson and
// then playing deadline - seeing if they line up."* ⚠️ THE COMPARISON IS THE
// PRODUCT. If the arcade's "Run 4" is not learn.js's run 4, or its gate is not
// that run's gate, or its characters are not the ones the student typed, then
// the numbers a child puts side by side are answering different questions and
// the test Jake is running is worthless — quietly, and in a way no screenshot
// would reveal.
//
// ⚠️ arcade.html DUPLICATES THREE CASES OF learn.js's buildSequence(), because
// that function is not exported and a standalone page cannot import it. Part B
// lifts BOTH and compares them character by character, so the duplication is
// guarded rather than merely commented.

import { readFileSync } from 'fs';
import { runPlan, gatesForRun, chunkSequence, DRILL_TYPES } from '../run-grade.js';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const html = readFileSync(new URL('../arcade.html', import.meta.url), 'utf8');

// ⚠️⚠️ COMMENTS ARE STRIPPED BEFORE ANY "DOES THE CODE DO X" CHECK, AND THIS IS
// NOT FUSSINESS. arcade.html's header warns at length "DO NOT ADD A typing_logs
// QUERY" and "TWO getDocs ON LOAD AND NOTHING PER LAUNCH" — so a naive grep for
// `typing_logs` or a count of `getDocs(` reads the page's own WARNING as the
// violation it warns against, and goes red on correct code. staff-tokens-test.mjs
// carries the same note for the same reason ("the first draft failed against
// correct code by reading its own explanation as output"), and Round 86 hit this
// class twice in one session — the other was an assertion LABEL containing the
// word "FAIL", which turned a green harness permanently red under the runner.
// ⚠️ Structural checks below use `code`; checks about what the page SAYS to a
// student use `html`.
const code = html
    .replace(/<!--[\s\S]*?-->/g, '')      // HTML comments
    .replace(/\/\*[\s\S]*?\*\//g, '')     // block comments
    .replace(/^[ \t]*\/\/.*$/gm, '');     // whole-line // comments
const learn = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');

const raw = JSON.parse(readFileSync(new URL('./fixtures/lessons-export.json', import.meta.url), 'utf8'));
const LESSONS = Array.isArray(raw) ? raw : (raw.lessons || []);
ok(LESSONS.length > 0, 'the lesson fixture loaded');

// ── Lift arcade.html's own sequenceForStep(), rather than reimplementing it ──
function lift(src, name) {
    const at = src.indexOf('function ' + name + '(');
    if (at < 0) return null;
    let d = 0;
    for (let j = src.indexOf('{', at); j < src.length; j++) {
        if (src[j] === '{') d++;
        else if (src[j] === '}') { d--; if (!d) return src.slice(at, j + 1); }
    }
    return null;
}
const arcSrc = lift(html, 'sequenceForStep');
ok(!!arcSrc, 'arcade.html defines sequenceForStep()');
const arcSeq = new Function(arcSrc + '; return sequenceForStep;')();

const learnSrc = lift(learn, 'buildSequence');
ok(!!learnSrc, 'learn.js defines buildSequence()');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nA — ONLY RUNS WITH A SPEED GATE ARE OFFERED');
// ═══════════════════════════════════════════════════════════════════════════

const OFFERABLE = new Set(['word_list', 'sentence_list', 'passage']);
{
    const m = code.match(/const OFFERABLE = new Set\(\[([^\]]*)\]\)/);
    ok(!!m, 'arcade.html declares an OFFERABLE set');
    const declared = m ? m[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean) : [];
    ok(declared.length === 3 && declared.every(t => OFFERABLE.has(t)),
       'and it is exactly word_list, sentence_list, passage — ' + JSON.stringify(declared));
    // ⚠️ NO DRILL TYPE MAY BE OFFERED. gatesForRun() returns minWPM null for
    // these, so a drill has no speed to line up with; and two of the three
    // generate fresh random text on every call, so the arcade could not
    // reproduce what the student typed even if it wanted to.
    ok(declared.every(t => !DRILL_TYPES.has(t)),
       '⚠️ and none of them is a DRILL_TYPE — a drill has no minWPM to compare against');
}

// Every offerable run across the real corpus must carry a real speed gate.
let playableRuns = 0, gatelessOffered = 0, lessonsWithPlay = 0;
for (const L of LESSONS) {
    let any = false;
    runPlan(L).forEach(entry => {
        if (!OFFERABLE.has(entry.type)) return;
        const step = (L.steps || [])[entry.stepIdx];
        if (!step) return;
        const seq = chunkSequence(arcSeq(step))[entry.chunkIdx];
        if (!seq || !seq.length) return;
        const g = gatesForRun(entry, L.gates || {});
        if (g.minWPM == null) { gatelessOffered++; return; }
        playableRuns++; any = true;
    });
    if (any) lessonsWithPlay++;
}
ok(gatelessOffered === 0,
   '⚠️ no offerable run in the real corpus resolves to a null minWPM (' + gatelessOffered + ')');
ok(playableRuns > 50,
   'the real corpus yields a usable number of playable runs — ' + playableRuns);
ok(lessonsWithPlay > 10,
   'spread across many lessons, not clustered in one unit — ' + lessonsWithPlay);

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nB — arcade.html AND learn.js BUILD THE SAME CHARACTERS');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ THIS IS THE DUPLICATION GUARD. If learn.js ever changes how one of these
// three step types becomes characters, this goes red and arcade.html must
// change in the SAME deploy — otherwise a child plays a sequence they never
// typed and the comparison silently stops meaning anything.
{
    // learn.js's buildSequence() only needs these three cases evaluated; the
    // drill cases call generators that are not in scope here and are never
    // reachable for an OFFERABLE type.
    const learnSeq = new Function(
        'generateReachPattern', 'generateRandom',
        learnSrc + '; return buildSequence;'
    )(() => [], () => []);

    let compared = 0, mismatches = 0;
    for (const L of LESSONS) {
        for (const step of (L.steps || [])) {
            if (!OFFERABLE.has(step.type)) continue;
            const a = arcSeq(step).join('');
            const b = learnSeq(step).join('');
            compared++;
            if (a !== b) mismatches++;
        }
    }
    ok(compared > 30, 'compared a real number of steps — ' + compared);
    ok(mismatches === 0,
       '⚠️⚠️ arcade.html\'s sequenceForStep() matches learn.js\'s buildSequence() ' +
       'character for character on every offerable step in the corpus (' + mismatches + ' differ)');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nC — RUN NUMBERS MEAN WHAT learn.js MEANS');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THE LOAD-BEARING AGREEMENT. arcade.html numbers runs from runPlan(),
// which chunks with run-grade.js's shapeSequence() — placeholder characters
// with the same length and space positions. For these three types that is the
// same `.split('')` of the same joined text, so the chunk COUNT must agree with
// chunking the real sequence. If it ever does not, "Run 4 of 6" on the arcade
// page is not run 4 in School, and every comparison is off by a run.
{
    let checked = 0, chunkMismatch = 0;
    for (const L of LESSONS) {
        runPlan(L).forEach(entry => {
            if (!OFFERABLE.has(entry.type)) return;
            const step = (L.steps || [])[entry.stepIdx];
            if (!step) return;
            const realChunks = chunkSequence(arcSeq(step));
            checked++;
            if (realChunks.length !== entry.chunkCount) chunkMismatch++;
        });
    }
    ok(checked > 50, 'checked chunk agreement on a real number of runs — ' + checked);
    ok(chunkMismatch === 0,
       '⚠️⚠️ runPlan()\'s chunk boundaries agree with the real sequence\'s on every ' +
       'offerable run (' + chunkMismatch + ' disagree) — otherwise run numbers drift');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nD — THE PAGE STAYS A MEASUREMENT: IT WRITES NOTHING');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ Jake, 2026-09-08: *"No need to save. This is only a test and won't be
// rolled out to everyone."* A write appearing here would be a second writer for
// a quantity learn.js owns — the exact Rule 9 break the seam notes warn about —
// and it would arrive without any of recordRunOutcome()'s guards.
for (const w of ['setDoc', 'updateDoc', 'addDoc', 'deleteDoc', 'writeBatch', 'increment']) {
    ok(!new RegExp('\\b' + w + '\\s*\\(').test(code),
       'arcade.html never calls ' + w + '() — it is a measurement, not a writer');
}
ok(!/typing_logs/.test(code),
   '⚠️ and never queries typing_logs — that is a read per launch, and the GATE is the yardstick');

// Reads are bounded: lessons + this student's lessonProgress, and nothing else.
{
    const getDocsCalls = (code.match(/getDocs\s*\(/g) || []).length;
    ok(getDocsCalls === 2,
       '⚠️ exactly two getDocs calls — lessons and lessonProgress (found ' + getDocsCalls + ')');
    ok(/collection\(db, 'lessons'\)/.test(code), 'one of them is the lessons collection');
    ok(/'lessonProgress'/.test(code), 'the other is this student\'s lessonProgress');
}

// ⚠️ A HUNG READ IS NOT A REJECTED READ. Both the auth resolution and the reads
// carry a bounded fallback, or a Chromebook that has dropped its wifi leaves a
// child on a spinner with nothing to read.
ok(/AUTH_TIMEOUT_MS/.test(code) && /setTimeout\(\(\) => begin\(null\)/.test(code),
   'auth resolution has a bounded fallback rather than waiting forever');
ok(/LOAD_TIMEOUT_MS/.test(code) && /function withTimeout/.test(code),
   'the Firestore reads have a bounded fallback too');

// ⚠️ THE CONFIG COMES FROM missionConfigFromRun(), NOT HAND-BUILT. If this page
// and the eventual learn.js wiring computed difficulty differently, the two
// would not be comparable — which is the entire point of the page.
ok(/missionConfigFromRun\(\{ sequence: r\.sequence \}, r\.gates, null\)/.test(code),
   '⚠️ difficulty comes from game-shell.js\'s missionConfigFromRun(), never hand-built here');

console.log(fail
    ? `\narcade-lesson-test: ${pass} passed, ${fail} FAILED`
    : `arcade-lesson-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
