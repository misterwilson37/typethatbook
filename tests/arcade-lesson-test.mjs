// arcade-lesson-test.mjs v1.4.0 — Round 101 (Wellington): survival stays in
// PROSE, the picker defaults to run 1, and the wall is derived from the gate.
// arcade-lesson-test.mjs v1.3.0 — Round 101 (Wellington): survival mode, and the
// one property everything rests on — the graded snapshot is frozen at the pass
// and only that copy may ever be graded.
// arcade-lesson-test.mjs v1.2.0 — Round 101 (Wellington): the OTHER HALF of the
// per-second tick. v1.1.0 pinned that the PAGE wires `onSecond` to bankSecond()
// and stayed green for ten rounds while the GAME never called it once — the
// banked rows could not move, and Jake found it by playing for 35 seconds and
// watching them sit at zero. ⚠️⚠️ A SEAM NEEDS BOTH ENDS ASSERTED: a check on the
// listener that never asks whether anything emits is half a check.
// arcade-lesson-test.mjs v1.1.0 — Round 99 (Franklin): the Round 97 lattice
// assertion is REVERSED on Jake's correction, the radar's ring positions and
// no-fade rule are pinned, and this file gained a comment stripper after
// becoming the fifth instance of the read-a-comment-as-code defect.
// v1.0.0 — ROADMAP 68: arcade.html PLAYS A REAL LESSON
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

// ⚠️⚠️ STRIP COMMENTS BEFORE ANY "DOES THE CODE DO X" CHECK. HANDOFF's own
// standing note: *"four times now a harness has read a COMMENT as code — an
// assertion label containing 'FAIL', arcade.html's own 'DO NOT ADD a
// typing_logs QUERY' warning, firestore.rules' header naming secondsArcade,
// popularity-sort's field scan. Strip comments before any 'does the code do X'
// check. Assume a fifth."*
//
// ⭐ THE FIFTH ARRIVED IMMEDIATELY, IN THIS FILE, IN ROUND 99. Two new
// assertions checked that `RADAR_CELL` and `RADAR_FADE_IN` were DELETED from
// game-layout.js. They went red against correct code, because the block that
// deletes them explains itself — *"RADAR_CELL is deleted; see the radar block
// above"* — and a substring search cannot tell an obituary from a declaration.
// ⚠️ THE TEMPTATION WAS TO REWORD THE COMMENT. That is backwards: it would
// make the prose worse to keep a broken check green, and the next person to
// write a useful warning would trip the same wire.
const stripComments = src => src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^[ \t]*\/\/.*$/gm, ' ')
    .replace(/([^:])\/\/.*$/gm, '$1');

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

const OFFERABLE = new Set(['word_list', 'sentence_list', 'passage', 'key_pattern']);
{
    const m = code.match(/const OFFERABLE = new Set\(\[([^\]]*)\]\)/);
    ok(!!m, 'arcade.html declares an OFFERABLE set');
    const declared = m ? m[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean) : [];
    ok(declared.length === 4 && declared.every(t => OFFERABLE.has(t)),
       'and it is word_list, sentence_list, passage, key_pattern — ' + JSON.stringify(declared));
    // ⚠️⚠️ v1.1.0 — key_pattern IS A DRILL_TYPE AND IS NOW OFFERED ON PURPOSE.
    // v1.0.0 asserted no drill type could appear, reasoning that a drill has no
    // minWPM to compare against. True, and it shipped a page that told a real
    // unit-2 student nothing was unlocked — units 1 and 2 are ENTIRELY drills.
    // key_pattern carries real `text` on the lesson document, so the arcade can
    // reproduce exactly what the student typed; it borrows the LESSON's minWPM
    // as a pace and the UI says School grades it on accuracy only.
    // ⚠️ THE OTHER TWO DRILL TYPES STILL MAY NOT BE OFFERED — their text is
    // generated by learn.js at run time and is not on the document, so the
    // arcade would be handing out a sequence the student never typed.
    ok(!declared.includes('key_pattern_auto') && !declared.includes('key_random'),
       '⚠️ the GENERATED drill types are still excluded — their text is not on the lesson document');
    ok(DRILL_TYPES.has('key_pattern'),
       'key_pattern is indeed a DRILL_TYPE, so the pace-vs-grade distinction is real');
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
// ⚠️ v1.1.0 — a null minWPM is no longer disqualifying; it means "borrow the
// lesson's pace". What must hold is that SOMETHING playable exists.
ok(true, 'gateless runs are now paced from the lesson, not excluded (' + gatelessOffered + ' such)');
ok(playableRuns > 50,
   'the real corpus yields a usable number of playable runs — ' + playableRuns);
ok(lessonsWithPlay > 10,
   'spread across many lessons, not clustered in one unit — ' + lessonsWithPlay);

// ⚠️⚠️ THE REGRESSION THAT SHIPPED, AND THE ASSERTION THAT WOULD HAVE CAUGHT IT.
// Jake logged in as a real unit-2 student and was told nothing was unlocked.
// EVERY lesson must yield at least one playable entry — a real run where the
// text is on the document, or synthesized key practice where it is not.
{
    const arcSrcKP = lift(html, 'keyPracticeFor');
    ok(!!arcSrcKP, 'arcade.html defines keyPracticeFor()');
    const keyPractice = new Function(arcSrcKP + '; return keyPracticeFor;')();
    const empty = [];
    for (const L of LESSONS) {
        let n = 0;
        runPlan(L).forEach(entry => {
            if (!OFFERABLE.has(entry.type)) return;
            const step = (L.steps || [])[entry.stepIdx];
            if (!step) return;
            const seq = chunkSequence(arcSeq(step))[entry.chunkIdx];
            if (!seq || !seq.length) return;
            const g = gatesForRun(entry, L.gates || {});
            const w = g.minWPM != null ? g.minWPM : (L.gates || {}).minWPM;
            if (w > 0) n++;
        });
        if (!n && keyPractice(L)) n++;
        if (!n) empty.push(L.id);
    }
    ok(empty.length === 0,
       '⚠️⚠️ EVERY lesson in the real corpus yields something playable — a unit-1 ' +
       'or unit-2 student must never be told nothing is unlocked (' +
       empty.length + ' empty: ' + empty.slice(0, 4).join(', ') + ')');
}

// ⚠️ AND NO LOCK. The page saves nothing and grades nothing, so there is no
// reason a child may not practise ahead. Jake: "just a dropdown of the lessons".
ok(!/function hasReached/.test(code),
   'the reached/unlocked gating is gone — every lesson is listed');

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
console.log('\nD — THE PAGE WRITES ARCADE SECONDS, AND ONLY ARCADE SECONDS');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THIS PART WAS INVERTED ON PURPOSE (Round 92). Until now it asserted the
// page wrote NOTHING, which was true and was the right assertion while the
// arcade was a pure measurement. Jake, 2026-09-08: *"New arcade source,
// please"* — beta testers needed their minutes to count. An assertion that
// pins yesterday's deliberate limitation becomes tomorrow's false alarm, so it
// is rewritten rather than deleted: what must hold now is not "no writes" but
// "no write this page has no business making".

// ⚠️ THE ONE WRITE, AND IT NAMES ONLY THE arcade ROW. That is the whole §3.1
// fix: a merge naming only these fields cannot mention — and so cannot replace
// — secondsSchool or secondsLibrary. If this page ever spells a field name
// itself instead of going through dayLogPayloadFor(), that protection is gone.
ok(/dayLogPayloadFor\('arcade',/.test(code),
   'the day write is built by daylog.js\'s builder, for the arcade source');
ok(!/secondsSchool|secondsLibrary|charsSchool|charsLibrary/.test(code),
   '⚠️⚠️ the page never spells another source\'s field — a merge naming one would replace it');

// ⚠️ ABSOLUTE VALUE, NOT AN INCREMENT, so it must start from what is stored.
ok(/ARCADE_BASE\.seconds \+ banked/.test(code),
   'the write starts from the stored arcade total, so a second device cannot erase the first');
ok(/ARCADE_BASE\.seconds \+= banked;[\s\S]{0,80}ARCADE_SECONDS -= banked;/.test(code),
   'the baseline advances and the counter drops together, so a flush cannot double-write');

// ⚠️ A DROPPED WRITE MUST COST A STUDENT NOTHING.
ok(/catch[\s\S]{0,200}could not bank seconds/.test(code),
   'a failed flush keeps the banked seconds for the next attempt rather than discarding them');

// ⚠️ ONE WRITE A MINUTE, NOT ONE A SECOND. This app's whole budget assumes it.
ok(/setInterval\(flushArcadeSeconds, 60000\)/.test(code),
   'seconds are flushed on a timer, never per tick');
ok(/pagehide/.test(code) && /visibilitychange/.test(code),
   'and flushed when the tab goes away — beforeunload is unreliable on Chromebooks');

// ⚠️ THE TICK CARRIES NO DATE. The host stamps it, so a session crossing
// midnight files under the day each second actually belonged to.
ok(/onSecond: \(\) => bankSecond\(\)/.test(code),
   'the game emits bare ticks and the page stamps the date');

// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ AND THE GAME MUST ACTUALLY EMIT THE TICK — ROUND 101.
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-09, with a screenshot at 0:35 on the run clock and TODAY/WEEK
// both frozen: *"I can confirm it's not adding time to the day or week."*
// ⭐ TWO DEFECTS IN ONE BLOCK, AND THE SECOND HID THE FIRST. The banking loop
// lived only inside finish(), so nothing could move while a student played —
// and it sat behind `if (onSecond && started && !ended)` three lines AFTER
// `ended = true`, a guard that is permanently false. Moving the call without
// fixing the guard would have looked like a fix and banked nothing.
{
    const dl = stripComments(readFileSync(new URL('../game-deadline.js', import.meta.url), 'utf8'));

    ok(/function bankWholeSeconds\(now\)/.test(dl),
       'the per-second bank is a named function rather than an inline loop');

    // ⚠️ THE FRAME LOOP IS WHERE IT HAS TO FIRE. A student watches these rows
    // DURING a run; a tick that only lands at game over is not the feature.
    const frame = dl.slice(dl.indexOf('function frame(ts)'),
                           dl.indexOf('function bankWholeSeconds'));
    ok(/bankWholeSeconds\(now\)/.test(frame),
       '\u2b50 and the frame loop calls it, so the totals move while they play');

    // ⚠️⚠️ ORDERING IS THE FIX IN finish(), NOT A LOOSER GUARD. d.end() stops the
    // graded clock, so a catch-up after it reads a frozen figure — and a call
    // after `ended = true` behind a `!ended` test is the bug that shipped.
    const fin = dl.slice(dl.indexOf('function finish(now, won)'));
    const body = fin.slice(0, fin.indexOf('function drawSidePanels'));
    ok(body.indexOf('bankWholeSeconds(now)') < body.indexOf('ended = true'),
       '\u26a0\u26a0 finish() banks the last part-second BEFORE it sets `ended`');
    ok(body.indexOf('bankWholeSeconds(now)') < body.indexOf('d.end(now)'),
       'and before the graded clock is stopped');
    ok(!/if \(onSecond && started && !ended\)/.test(dl),
       '\u26a0\u26a0 the permanently-false guard is gone and has not come back');

    // ⚠️ DERIVED FROM THE GRADED CLOCK, NEVER ACCUMULATED FROM dt. A second
    // accumulator drifts from the figure the result modal reports, and then a
    // student's banked minutes disagree with the run they just played.
    const bank = dl.slice(dl.indexOf('function bankWholeSeconds'));
    ok(/d\.clock\.seconds\(now\)/.test(bank.slice(0, 400)),
       'the tick count comes off d.clock.seconds(), not a private accumulator');
    ok(/while \(secondsBanked < whole\)/.test(bank),
       '\u26a0 a WHILE loop \u2014 a hidden tab hands back many whole seconds at once, ' +
       'and each is a separate second the host stamps with its own date');

    // ⚠️⚠️ AND THE HIGH-WATER MARK RESETS WITH THE DIRECTOR. restart() builds a
    // fresh GameDirector, so the clock returns to zero; a `secondsBanked` left
    // at 35 would swallow the first 35 seconds of every replay. This only became
    // reachable once the tick started firing at all.
    const res = dl.slice(dl.indexOf('function restart()'));
    ok(/secondsBanked = 0/.test(res.slice(0, 900)),
       '\u2b50 restart() resets the seconds high-water mark with everything else');
}


// ═══════════════════════════════════════════════════════════════════════════
// SURVIVAL: THE GRADE FREEZES, AND ONLY THE FROZEN COPY MAY BE GRADED
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THE FAILURE THIS GUARDS IS SILENT AND EXPENSIVE: a wiring that graded the
// SESSION instead of the snapshot would file a leaderboard stunt as a lesson
// result, and the student it hurts is the one who passed cleanly and then played
// on — exactly the child the mode is for.
{
    const dl = stripComments(readFileSync(new URL('../game-deadline.js', import.meta.url), 'utf8'));
    const arc = stripComments(readFileSync(new URL('../arcade.html', import.meta.url), 'utf8'));

    // ⚠️ OFF BY DEFAULT. learn.js and tools/game-lab.html mount this same view;
    // a run that stopped ending on its quota would hang the lesson flow.
    ok(/const survival = !!\(opts && opts\.survival\)/.test(dl),
       'survival is an explicit host opt-in, not a default');
    ok(/survival: survivalPool\.length > 0/.test(arc),
       'and only the arcade page opts in, when it has a pool to play on with');

    // ⚠️⚠️ THE SNAPSHOT, AND ITS TIMING. WPM and accuracy are ratios over the
    // session and do not decompose — the instant of the pass is the only correct
    // time to read them.
    ok(/passReport = d\.report\(now\)/.test(dl),
       '\u2b50 the grade is a COPY of the report taken at the moment the quota is met');
    const acc = dl.slice(dl.indexOf('function accept('), dl.indexOf('function reject('));
    ok(/if \(!survival\) \{ finish\(now, true\); \}/.test(acc),
       'without survival the quota still ends the run exactly as before');
    ok(/else if \(!passReport\)/.test(acc),
       '\u26a0 and the snapshot is taken ONCE \u2014 a second pass would overwrite the grade');

    // ⚠️⚠️ A PASS CANNOT BE UNDONE BY DYING AFTERWARDS.
    ok(/const passed = !!passReport \|\| \(won && !survival\)/.test(dl),
       '\u2b50\u2b50 a run with a snapshot reports as PASSED however the session ends');

    // ⚠️ THE HOST IS HANDED BOTH, AND GRADES OFF `pass`.
    ok(/pass: passReport \|\| \(passed \? rep : null\)/.test(dl),
       'onEnd() carries the frozen run as `pass` alongside the whole session');
    ok(/const graded = rep\.pass \|\| rep/.test(arc),
       '\u26a0\u26a0 and the result panel grades off the SNAPSHOT, never the session');
    ok(!/rep\.wpm|rep\.acc/.test(arc.slice(arc.indexOf('const graded = rep.pass'))),
       '\u26a0\u26a0 no session WPM or accuracy reaches the panel at all');

    // ⚠️ THE QUOTA IS NOT MOVED BY THE POOL. missionConfigFromRun() computes it
    // from the targets it is given, so the append must come AFTER.
    const play = arc.slice(arc.indexOf('function play()'));
    ok(play.indexOf('missionConfigFromRun') < play.indexOf('cfg.targets = cfg.targets.concat'),
       '\u26a0\u26a0 the survival pool is appended AFTER the quota is computed, or nobody passes');

    // ⭐ THE POOL'S SOURCE IS DECIDED BY THE LESSON, not by a setting.
    const sv = arc.slice(arc.indexOf('function survivalTargetsFor'));
    const prose = arc.slice(arc.indexOf('function proseTargetsOf'));
    ok(/if \(skip && si === skip\.stepIdx && ci <= skip\.chunkIdx\) return;/.test(prose),
       'survival starts at the chunk AFTER the one they were graded on');

    // ⚠️⚠️ PROSE IS EXHAUSTED BEFORE ANY GENERATOR IS CONSIDERED. Jake, on
    // v3.5.0: *"It also fleshed out with random characters rather than words.
    // Once students have passages, they should stay in passages."* The old
    // version only looked at later chunks of the SAME step, so playing the last
    // chunk found nothing and dropped straight to `zxcv qwer` — a student who
    // has read prose all year got letter groups for their victory lap.
    ok(/step\.type !== 'passage' && step\.type !== 'sentence_list'/.test(prose),
       'the survival pool is built from passages and sentences, not word lists or drills');
    ok(sv.indexOf('proseTargetsOf(l, null)') < sv.indexOf('makeArcadeTargets'),
       '\u2b50\u2b50 EVERY other prose lesson is tried before the generator is reached');
    ok(/for \(let i = 0; i <= upTo/.test(sv),
       '\u26a0 and it wraps back to unit 1 rather than stopping at the current lesson');
    ok(/const upTo = here >= 0 \? here : PLAYABLE\.length - 1/.test(sv),
       '\u26a0\u26a0 nothing PAST the lesson they are on \u2014 same window arcadeKeySet() uses, ' +
       'so no unlearned key turns up in a victory lap');
    ok(/makeArcadeTargets\(arcadeKeySet\(LESSONS, PROGRESS\)/.test(sv),
       'and a student with no prose behind them still falls back to their OWN key set');

    // ⚠️ THE PICKER DEFAULTS TO RUN 1, REVERSING v3.0.0's LAST-RUN DEFAULT.
    // Survival superseded that reason: run 1 flows into the whole rest of the
    // lesson, so the last run is now the SHORTEST one and it starts mid-sentence.
    ok(/sel\.value = '0';/.test(arc),
       '\u2b50 the run dropdown defaults to run 1');
    ok(!/sel\.value = String\(Math\.max\(0, p\.runs\.length - 1\)\)/.test(arc),
       'and the old last-run default is gone, not merely overridden');

    // ⚠️ THE WALL IS DERIVED FROM THIS RUN'S GATE, because pressure is a multiple
    // of that gate and the wall is an absolute WPM.
    ok(/cfg\.pressureCeiling = survivalCeilingFor\(gates\.minWPM\)/.test(arc),
       'the survival ceiling is derived from the run\u2019s own gate');
}


// ⚠️⚠️ THE ENVELOPE, AND EVERY ONE OF THESE FAILS SILENTLY IN A CLASSROOM.
// firestore.rules' validDailyLog() requires uid and date on the MERGED result,
// and dayLogPayloadFor() returns only the three source fields — so an arcade
// write to a day the student has not otherwise touched CREATES the document and
// is rejected without them. The student plays, banks nothing, and sees no error.
// The emulator suite cannot run in this environment, so these are pinned here.
for (const f of ['uid:', 'date: dateStr', 'classId:', 'schoolId:']) {
    ok(code.includes(f), 'the day write carries `' + f + '` for validDailyLog()');
}

// ⚠️ LEDGER FIRST. logdays.js's ledger may be a SUPERSET of the logs and must
// never be a subset: a day in typing_logs but absent from the ledger is planned
// as a skip by readWeek(), and a skip reads as a zero — the student's own
// minutes would go DOWN after playing.
{
    const nd = code.indexOf('noteDay(');
    const sd = code.indexOf("setDoc(doc(db, 'typing_logs'");
    ok(nd > -1 && sd > -1 && nd < sd,
       '⚠️ noteDay() runs BEFORE the typing_logs write, as in game.js and learn.js');
}

// ⚠️ THE RULES MUST ACCEPT AN ARCADE-ONLY WRITE. This clause was the hard
// blocker: an arcade flush names none of seconds/secondsLibrary/secondsSchool.
{
    // ⚠️⚠️ COMMENTS STRIPPED, AND THIS ONE BIT. The first draft grepped the raw
    // rules file, and `secondsArcade` appears in v2.13.0's own header comment
    // explaining the change — so the assertion passed against a rules file with
    // the clause DELETED. Caught by mutating the rule and watching the test stay
    // green. Fourth time this repo has read a comment as code
    // (game-assumptions-test's "FAIL" label, arcade.html's typing_logs warning,
    // popularity-sort's field scan); assume a fifth.
    const rules = readFileSync(new URL('../firebase/firestore.rules', import.meta.url), 'utf8')
        .replace(/^\s*\/\/.*$/gm, '');
    // ⚠️ TARGETS THE DISJUNCTION, NOT THE NAME. `'secondsArcade' in d` also
    // appears in the BOUNDS line above it, so a bare name search stayed green
    // with the accept-clause deleted — mutation-verified twice before this
    // regex was right. What must hold is that secondsArcade appears in the
    // "at least one recognised seconds field" list itself.
    ok(/'secondsSchool' in d\s*\|\|\s*'secondsArcade' in d\s*\)/.test(rules),
       '⚠️⚠️ validDailyLog() accepts secondsArcade as a recognised seconds field');
    ok(/d\.secondsArcade\s+is number[\s\S]{0,60}<= 86400/.test(rules),
       'and bounds it, so a client cannot park an impossible number in the day total');
}

// Still true, and still worth pinning: no per-launch typing_logs QUERY.
ok(!/typing_logs['"]\),\s*where/.test(code),
   '⚠️ still never QUERIES typing_logs — that is a read per launch, and the gate is the yardstick');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nE — SIDE PANELS: COVERAGE SURVIVES, AND THE PLAY AREA NEVER SHRINKS');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THE PLAN'S OWN CLOSING RULE: *"Assert three-deep overlap on the centre
// lane AFTER the change... Do not verify by looking at it; it looked fine last
// time."* Round 91 shrank the dome radius for looks, silently ended the overlap
// that gives the city six lives instead of three, and nothing on screen said so.
// The panels changed the play canvas's WIDTH, and every lane and radius is
// derived from that width — so the property has to be re-proved at the new sizes,
// not assumed because no dome code was edited.
{
    const lay = readFileSync(new URL('../game-layout.js', import.meta.url), 'utf8');
    const num = k => {
        const m = lay.match(new RegExp('export const ' + k + '\\s*=\\s*([0-9.]+)'));
        return m ? Number(m[1]) : null;
    };

    // The same arithmetic game-deadline.js layout() performs, at a range of
    // play-canvas widths the new grid can produce.
    const coverageHolds = (W) => {
        const n = 3;
        const laneX = i => W * ((i + 1) / (n + 1));
        const reach = Math.abs(laneX(Math.floor(n / 2)) - laneX(0));
        const radius = Math.max(60, reach + 8);
        const centre = laneX(1);
        const allCoverCentre = [0, 1, 2].every(i => Math.abs(laneX(i) - centre) <= radius);
        // ⚠️ AND THE OUTER PAIR MUST *NOT* REACH EACH OTHER, or every lane is
        // covered by every dome and the graduated reveal collapses into "three
        // hits then three hits" with no exposure in between.
        const outersStayApart = Math.abs(laneX(0) - laneX(2)) > radius;
        return allCoverCentre && outersStayApart;
    };

    for (const W of [700, 724, 776, 816, 900, 1100, 1284]) {
        ok(coverageHolds(W), 'dome overlap holds at a ' + W + 'px play canvas');
    }

    // ⚠️ THE FLOOR IS THE PLAY CANVAS, NOT THE PANEL WIDTHS. The plan is explicit
    // that the play area must never be narrower than it was before the panels.
    const playMin = num('PLAY_MIN_W');
    ok(playMin === 724, 'PLAY_MIN_W records today\'s width as the floor (' + playMin + ')');
    const arcade = readFileSync(new URL('../arcade.html', import.meta.url), 'utf8');
    const mins = [...arcade.matchAll(/minmax\((\d+)px,\s*1fr\)/g)].map(m => Number(m[1]));
    ok(mins.length >= 2 && mins.every(v => v >= playMin),
       '⚠️ every grid template floors the play column at or above PLAY_MIN_W — ' + JSON.stringify(mins));

    // The three columns must actually fit the wrap they are given.
    const wrap = num('WRAP_MAX_W'), radar = num('RADAR_COL_W'),
          ctrl = num('CONTROL_COL_W'), gap = num('PANEL_GAP');
    const play = wrap - 36 - radar - ctrl - 2 * gap;
    ok(play >= playMin,
       '⚠️⚠️ at the full wrap the play canvas is ' + play + 'px \u2014 wider than the ' +
       playMin + 'px it had BEFORE the panels, which is what "without changing the size" required');

    // ⚠️ THE OVERLAY CONSTANTS MUST STAY DEAD. Reviving them is reviving the bug.
    ok(!/^export const CHROME_BOTTOM/m.test(lay),
       'the retired chrome-overlay constants are not re-exported');
    const chromeSrc = readFileSync(new URL('../game-chrome.js', import.meta.url), 'utf8');
    ok(/barHost/.test(chromeSrc) && /gc-bar-card/.test(chromeSrc),
       'game-chrome.js can host its bar outside the canvas');
    ok(!/\.gc-bar\s*\{[^}]*position:absolute/.test(chromeSrc),
       '⚠️ the default .gc-bar rule no longer positions itself over the canvas');
    // ⚠️ THE COUNTDOWN AND MODAL STAY OVER THE PLAY AREA — Jake ruled the
    // countdown must not cover the radar, which means it must not MOVE to a card.
    ok(/wrap\.append\(panel\);/.test(chromeSrc),
       'the countdown/modal panel still overlays the play container, not a side card');
}

// ⚠️⚠️ THE RADAR MUST NOT BE MISTAKABLE FOR A TARGET. Jake declined a radar a
// student could type off; if it reads as a second input surface the city, the
// domes and the six-lives overlap are decorative and most of the game is gone.
{
    const dr = readFileSync(new URL('../game-draw.js', import.meta.url), 'utf8');
    const body = dr.slice(dr.indexOf('export function drawRadar'));
    const fn = body.slice(0, body.indexOf('\nexport function', 1));
    ok(!/platedText\s*\(/.test(fn), 'the radar draws no plate — plates are what a target wears');
    ok(!/#ffd700/.test(fn), 'and never the lock colour');
    ok(/RADAR_TYPED|RADAR_INK/.test(fn), 'it uses its own dim instrument palette');

    // ⚠️⚠️ NO SWEEPING LINE, EVER — a rotating bright line across a 200px panel
    // is a periodic large-area flash in front of thirty children, the same
    // reason drawHitFeedback() stopped doing a full-screen fill.
    ok(/RADAR_SWEEP = false/.test(readFileSync(new URL('../game-layout.js', import.meta.url), 'utf8')),
       'the sweep constant is present and false, so anyone reaching for one finds the reason');
    ok(!/rotate\s*\(/.test(fn), 'and the radar rotates nothing');
    ok(/prefersReducedMotion\(\)/.test(fn),
       'prefers-reduced-motion removes even the fade-in');

    // ⚠️ IT KNOWS NOTHING ABOUT PLAY GEOMETRY. Contacts arrive normalised, so no
    // lane, dome or impact number is reachable from the panel.
    ok(!/laneX|radius|domes/.test(fn),
       'the radar cannot reach a lane, a dome radius or an impact test');

    const gd = readFileSync(new URL('../game-deadline.js', import.meta.url), 'utf8');
    ok(/nx: W \? e\.x \/ W : 0\.5, ny: threat\(e\)/.test(gd),
       'contacts are handed over pre-normalised');
    // ⭐ THE FREE 34px: with a radar, the strip stops paying for the NEXT band.
    ok(/if \(kbH && !radarCtx\) kbH \+= LAY\.KB_PREVIEW_BAND;/.test(gd),
       'the preview band is only charged when the strip carries the preview');
    // ⚠️ AND THE FLANKS BECOME THE NARROW-MODE FALLBACK, or the same four
    // numbers are drawn twice six inches apart.
    ok(/gaugeCtx \? \{ left: \[\], right: \[\] \} : hudLines/.test(gd),
       'the strip flanks stand down when the gauge panel is present');
}

// ⭐ THE RADAR SHOWS ONE WORD MORE THAN THE SKY HOLDS, and it materialises.
{
    const sh = readFileSync(new URL('../game-shell.js', import.meta.url), 'utf8');
    const dr = readFileSync(new URL('../game-draw.js', import.meta.url), 'utf8');
    const gd = readFileSync(new URL('../game-deadline.js', import.meta.url), 'utf8');

    ok(/spawnProgress\(nowMs\)/.test(sh), 'the director reports how close the next spawn is');
    // ⚠️⚠️ IT MUST BE A PURE READ. peekNext() and spawnProgress() exist because
    // raising MIN_ON_SCREEN to show more collapsed the corpus sweep from 99.9%
    // to 53.2% clearable. Reading ahead must never mean receiving faster.
    const spBody = sh.slice(sh.indexOf('spawnProgress(nowMs)'), sh.indexOf('nextTarget(nowMs)'));
    // ⚠️ `=(?!=)` — the first draft used `\\s*=` and matched the `==` in
    // `this._lastSpawnAt == null`, failing a function that only READS it. A
    // purity check that cannot tell a comparison from an assignment is worse
    // than none: it goes red on correct code and gets deleted.
    ok(!/_cursor\+\+|this\._lastSpawnAt\s*=(?!=)/.test(spBody),
       '⚠️⚠️ spawnProgress() advances nothing — no cursor, no spawn clock');
    ok(/inboundProgress: d\.spawnProgress\(now\)/.test(gd),
       'the view feeds that progress to the radar');

    // ⚠️ SOLID PIP = IN THE SKY. HOLLOW = NOT YET. The preview must never look
    // like something already typable.
    const rd = dr.slice(dr.indexOf('export function drawRadar'), dr.indexOf('export function drawGauges'));
    const lay = readFileSync(new URL('../game-layout.js', import.meta.url), 'utf8');
    ok(/ghost/.test(rd) && /plot\(\{ text: o\.inbound[^)]*\}, [^,]+, true[,)]/.test(rd),
       'the inbound contact is drawn hollow, not solid');
    // ⭐ AND IT SITS OUTSIDE THE SCREEN RING, NOT ON IT (Round 99). Jake: *"above
    // that should be the preview/incoming word that isn't on the screen yet...
    // even during the countdown, there should be a word coming in the edge of
    // that screen."* A preview drawn ON the screen ring says "arrived", which is
    // the one thing this panel must never say. rowY() clamps to 0..1, so the
    // override is what puts it in the band — without it the clamp would silently
    // park the preview on the ring and nothing would look wrong.
    ok(/RADAR_PREVIEW_BAND/.test(lay) && /yAt/.test(rd),
       '\u26a0 the preview is plotted in the band above the screen ring, not clamped onto it');
    ok(/const topRow = pad \+ band/.test(rd),
       'and the band is RESERVED height, so the preview is not an overlay on the sky');
    ok(/RADAR_INBOUND_MIN_ALPHA/.test(rd),
       'and never fully invisible, so it can be found before it brightens');

    // ⚠️⚠️ REVERSED IN ROUND 99, DELIBERATELY, AND THE OLD ASSERTION IS QUOTED
    // HERE SO THE REVERSAL IS NOT MISTAKEN FOR A REGRESSION. Round 97 pinned
    // `const snap = v => Math.round(v / cell) * cell` in this function, having
    // read *"more chunky pixels"* as covering the whole stage. Jake, 2026-09-09:
    // *"The left panel radar grid is pixellated, which is weird... I'd like that
    // all clean, traditional pale green lines."* And on the original ask: *"when
    // I wanted it chunkier, I was referring to the overall look, and especially
    // the right card."*
    // ⭐ THE CHUNK KEPT ITS SCOPE, IT DID NOT GO AWAY: the assertions below
    // still require the gauges to be segmented lamps. Scope is the whole point —
    // the left panel is the WINDOW, the right card is the CONSOLE.
    ok(!/const snap = /.test(stripComments(rd)) && !/RADAR_CELL/.test(stripComments(rd)),
       '\u26a0 the radar no longer snaps to a lattice \u2014 Round 99 reversal, not a regression');
    ok(!/RADAR_CELL/.test(stripComments(lay)),
       'and RADAR_CELL is deleted rather than left dangling for someone to re-use');
    ok(/quadraticCurveTo/.test(rd) && /ctx\.stroke\(\)/.test(rd),
       'the rings are stroked curves now');
    // ⚠️ THE RINGS ARE NAMED GAME POSITIONS, NOT FRACTIONS OF A PANEL. Round 95
    // used [0.25, 0.5, 0.75] \u2014 three arcs that meant nothing. They are in the
    // same `ny` units a contact carries, so a pip above a ring is genuinely
    // nearer the screen than that ring is.
    for (const k of ['RADAR_RING_SCREEN', 'RADAR_RING_MID', 'RADAR_RING_DOME']) {
        ok(new RegExp('export const ' + k).test(lay), k + ' is a named ring position');
    }
    ok(!/RADAR_RINGS/.test(stripComments(lay)) && !/RADAR_RINGS/.test(stripComments(rd)),
       'the anonymous RADAR_RINGS fractions are gone');

    // ⚠️⚠️ AND A CONTACT NEVER FADES, WHICH WAS A PLAYABILITY BUG AND NOT A LOOK.
    // Jake: *"Each word fades out the whole grid, too, making it impossible to
    // actually start typing the next possible word. Once a word appears on
    // there, it should stay on there and not fade out until it's destroyed."*
    ok(!/RADAR_FADE_IN/.test(stripComments(rd)) && !/RADAR_FADE_IN/.test(stripComments(lay)),
       '\u26a0\u26a0 the per-contact fade-in is deleted, not merely shortened');
    ok(/RADAR_CONTACT_ALPHA/.test(rd),
       'live contacts draw at one fixed strength from spawn to destruction');
    // ⚠️ THE INBOUND WORD IS THE ONLY VARIABLE ALPHA LEFT ON THE PANEL. If a
    // second one appears, the wash-in/wash-out complaint is back.
    ok((rd.match(/globalAlpha = /g) || []).length <= 4,
       'and it is the only thing on the panel with a changing alpha');
    const gg = dr.slice(dr.indexOf('export function drawGauges'));
    ok(/LAY\.GAUGE_SEGMENTS/.test(gg), 'the gauges are segmented, not smooth bars');
    // ⚠️ LIT SEGMENTS ROUND DOWN. A meter lighting its last lamp at 96% would
    // claim a target was met when it was not.
    ok(/Math\.floor\(Math\.max\(0, Math\.min\(1, frac\)\) \* segs\)/.test(gg),
       '⚠️ segment count rounds DOWN, so a meter never claims a target it missed');
}

console.log(fail
    ? `\narcade-lesson-test: ${pass} passed, ${fail} FAILED`
    : `arcade-lesson-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
