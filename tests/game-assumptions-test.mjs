// tests/game-assumptions-test.mjs v1.1.0 — Round 114 (Carriage). ⚠️⚠️ AN
// ASSERTION IN HERE WAS DEFENDING A BUG FOR ELEVEN ROUNDS: it pinned
// `GAMES.shatter.unbuilt === true`, which was correct in Round 82 and false from
// Round 103, and it stayed green while `fillGames()` silently dropped Shatter
// from the only picker that offers it. ⭐ THE FAULT WAS THE SHAPE, NOT THE VALUE
// — it pinned a fact about the WORLD as though it were a fact about the DESIGN.
// The flag is now DERIVED from whether each view exists on disk.
// tests/game-assumptions-test.mjs v1.0.0 — DOES THE REPO STILL LOOK THE WAY THE
// GAMES ASSUME IT DOES? Round 82 (Victor).
//
// ⚠️⚠️ THIS HARNESS EXISTS BECAUSE THE GAMES WERE BUILT IN A SIDE ROUND WHILE
// ROADMAP WORK CONTINUED ELSEWHERE. Every assertion below is a claim
// game-shell.js, game-deadline.js or game-escape.js RELIES ON, made about a file
// none of them own. Left as prose in a handoff, each one rots silently and is
// discovered by a student. Written here, a round that changes `learn.js`'s WPM
// formula or moves the seconds counter turns this suite RED instead.
//
// ⚠️ IT ASSERTS ON STRUCTURE AND ARITHMETIC, NEVER ON LINE NUMBERS. Line numbers
// are the first thing a merge invalidates, and a harness that fails on a moved
// function teaches people to ignore it. Everything here is found by importing the
// module or by matching a shape.
//
// ⚠️ NOTHING HERE IS A GAME TEST. game-shell-test.mjs and escape-board-test.mjs
// test the games. This file tests the SEAM.
//
// ⚠️⚠️ IF AN ASSERTION IN HERE FAILS, THE ANSWER IS ALMOST NEVER "LOOSEN THE
// ASSERTION". It means the repo moved under the games and the games need the
// corresponding change in the same deploy. Read the note attached to the failure.

import { readFileSync, existsSync } from 'node:fs';
import {
    netWPM, accuracyPct, CHARS_PER_WORD, targetsFromSequence,
    arcadeTargetWPM, arcadeConfig, arcadeKeySet,
} from '../game-shell.js';
import { GAMES, GAME_ORDER, isAssessed, ARCADE_ENTRY } from '../game-names.js';

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) {
    if (cond) pass++; else { fail++; fails.push(label); }
    console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${label}`);
}
function read(f) {
    const p = new URL('../' + f, import.meta.url);
    return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

console.log('\ngame-assumptions-test.mjs — the seam between the games and the repo\n');

// ═════════════════════════════════════════════════════════════════════════════
console.log('PART A — the files the games import still exist and still export');
// ═════════════════════════════════════════════════════════════════════════════

const runGrade = await import('../run-grade.js');
const drillFilter = await import('../drill-filter.js');
const keyboard = await import('../keyboard.js');

ok(typeof runGrade.chunkSequence === 'function',
   'run-grade.js exports chunkSequence — game-shell.js sizes a mission with it');
ok(typeof runGrade.gatesForRun === 'function',
   'run-grade.js exports gatesForRun — the games read a run\'s real gates through it');
ok(typeof runGrade.calculateGrade === 'function',
   'run-grade.js exports calculateGrade — ⚠️ the games deliberately do NOT call it, ' +
   'but the host wiring must, so a rename breaks the plan');
ok(typeof drillFilter.safeGroup === 'function' && typeof drillFilter.firstBlocked === 'function',
   'drill-filter.js exports safeGroup and firstBlocked — arcade words are drawn through them');
ok(typeof keyboard.buildFingerMap === 'function' && typeof keyboard.getFingerInfo === 'function',
   'keyboard.js exports buildFingerMap and getFingerInfo — Deadline\'s tubes read them');
ok(keyboard.FINGER_NAMES && keyboard.FINGER_NAMES.length === 8,
   'keyboard.js still names exactly 8 fingers — Deadline draws one tube per name');
ok(keyboard.FINGER_COLORS && keyboard.FINGER_NAMES.every(n => keyboard.FINGER_COLORS[n]),
   'and every one has a colour — ⚠️ a student who learned that yellow is the right ' +
   'index finger must not meet a game where it is not');

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART B — ⚠️⚠️ THE TWO FORMULAS ARE STILL learn.js\'s');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ THIS IS THE RULE 11 SEAM AND IT IS THE MOST IMPORTANT PART OF THIS FILE.
// The student sees the game's wpm/acc; the teacher's report shows a run's wpm/acc.
// If learn.js's arithmetic changes and game-shell.js's does not, the same run is
// described by two different numbers and nothing anywhere would notice.

const learn = read('learn.js');
ok(learn != null, 'learn.js is present (this harness needs the real file, not a fixture)');

/**
 * Pull one function's body out by brace matching.
 *
 * ⚠️ THE FIRST VERSION OF PART B MATCHED A CONTIGUOUS REGEX ACROSS THE WHOLE FILE
 * AND FAILED ON CORRECT CODE. learn.js's netWPM() assigns
 * `const correct = Math.max(0, chars - mistakes)` and then divides `correct / 5`,
 * so `(chars - mistakes) / 5` never appears as one expression. ⚠️ A HARNESS THAT
 * FAILS ON A REFACTOR IT SHOULD TOLERATE IS WORSE THAN NO HARNESS: it gets
 * loosened until it means nothing. Scoping to the function body lets variable
 * names and intermediate steps move while still pinning the OPERATIONS.
 */
function fnBody(text, name) {
    const at = text.indexOf('function ' + name);
    if (at === -1) return null;
    const open = text.indexOf('{', at);
    if (open === -1) return null;
    let depth = 0;
    for (let i = open; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') { depth--; if (depth === 0) return text.slice(open, i + 1); }
    }
    return null;
}

if (learn) {
    const wpmBody = fnBody(learn, 'netWPM');
    ok(wpmBody != null, 'learn.js still defines netWPM()');
    if (wpmBody) {
        // ⚠️ THREE OPERATIONS, ASSERTED SEPARATELY, INSIDE THE FUNCTION ONLY.
        ok(/chars\s*-\s*mistakes/.test(wpmBody),
           // ⚠️⚠️ DO NOT PUT THE WORD "FAIL" (OR "UNSAFE", OR "ERROR") IN AN
           // ASSERTION LABEL. run-all-tests.mjs decides a harness is bad on
           // `r.status !== 0 || /FAIL|UNSAFE|\bERROR\b/.test(out)` — it reads
           // the OUTPUT, not just the exit code. This label said "IF THIS
           // FAILS" and turned a 59/59 green harness permanently red the
           // moment it was registered: it passed standalone, so the drop's own
           // testing never saw it, and the runner reported a failure with no
           // failing assertion under it. Round 84 hit the same class of thing
           // from the other side (staff-tokens-test.mjs's header records a
           // draft that failed against correct code by reading its own
           // explanation as output). Say "IF THIS BREAKS".
           'netWPM() still subtracts mistakes from chars — ⚠️ IF THIS BREAKS, ' +
           'game-shell.js\'s netWPM() must change in the SAME deploy (Rule 11)');
        ok(/\/\s*5\b/.test(wpmBody) || /CHARS_PER_WORD/.test(wpmBody),
           'and still divides by 5 characters per word');
        ok(/\/\s*60\b/.test(wpmBody),
           'and still converts seconds to minutes by 60, not by working in minutes');
        ok(/Math\.round/.test(wpmBody),
           'and still rounds — an unrounded game WPM beside a rounded report WPM is a ' +
           'one-off disagreement on every single run');
    }

    const accBody = fnBody(learn, 'accuracyPct');
    ok(accBody != null, 'learn.js still defines accuracyPct()');
    if (accBody) {
        ok(/chars\s*-\s*mistakes/.test(accBody) && /\/\s*chars/.test(accBody),
           'accuracyPct() is still (chars - mistakes) / chars');
        ok(/\*\s*100/.test(accBody) && /Math\.round/.test(accBody),
           'still scaled to 100 and rounded');
        ok(/:\s*100/.test(accBody) || /chars\s*>\s*0/.test(accBody),
           'and still returns 100 rather than NaN when no keys have been typed');
    }
}

// Arithmetic cross-check, independent of text matching.
ok(netWPM(150, 0, 60) === 30 && netWPM(150, 15, 60) === 27,
   'game-shell.js\'s netWPM still agrees with those definitions numerically');
ok(accuracyPct(100, 15) === 85 && accuracyPct(0, 0) === 100,
   'and accuracyPct does too, including the zero-keystroke case');
ok(CHARS_PER_WORD === 5, 'a "word" is still five characters everywhere');

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART C — ⚠️⚠️ THE SECONDS COUNTER IS STILL A SINGLE SITE');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ learn.js's own comment says four separate counting bugs died to create one
// increment site and that there is no subtract path and must not be one. Banking
// game seconds MUST go through that site, once per elapsed second, below the
// midnight rollover — not as a duration written at the end. If the count of sites
// changes, the wiring plan in NEXT-STEPS.md §5.1 needs rewriting before anyone
// follows it.

if (learn) {
    const todaySites = (learn.match(/statsData\.secondsToday\s*\+\+/g) || []).length;
    const weekSites = (learn.match(/statsData\.secondsWeek\s*\+\+/g) || []).length;
    ok(todaySites === 1,
       `learn.js increments secondsToday in exactly ONE place (found ${todaySites}) — ` +
       '⚠️ game seconds must join it there, not open a second site (Rule 9)');
    ok(weekSites === 1, `and secondsWeek in exactly one place (found ${weekSites})`);
    ok(!/statsData\.secondsToday\s*(-=|--)/.test(learn),
       'and there is still NO subtract path, which learn.js\'s header is emphatic about');
    ok(/rollDayIfNeeded\s*\(/.test(learn),
       'rollDayIfNeeded() still exists — game seconds must be banked BELOW it, or a ' +
       'game straddling midnight files its minutes under the wrong day');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART D — the insertion point the wiring plan names still exists');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ NAMED BY SHAPE, NOT BY LINE. NEXT-STEPS.md §5.2 says Deadline replaces the
// final run of a lesson at the isLastRun fork in finishStep(), above
// showLessonResultModal(). If a round renames or restructures either, the plan
// is stale and should be re-read rather than followed.

if (learn) {
    ok(/function\s+finishStep\s*\(/.test(learn),
       'finishStep() still exists — the assessed-game fork goes inside it');
    ok(/isLastRun/.test(learn),
       'and still distinguishes the last run of a lesson');
    ok(/function\s+showLessonResultModal\s*\(/.test(learn),
       'showLessonResultModal() still exists — the game hands it the same (wpm, acc) pair');
    ok(/recordRunOutcome\s*\(/.test(learn),
       'recordRunOutcome() still exists — ⚠️ it must stay the SINGLE writer of a run ' +
       'outcome; the games must not open a second write path');
    ok(/function\s+buildRunList\s*\(/.test(learn) && /function\s+buildSequence\s*\(/.test(learn),
       'buildRunList()/buildSequence() still exist — a run still carries a baked `sequence`, ' +
       'which is the games\' entire word source');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART E — a run\'s sequence still cuts into usable targets');
// ═════════════════════════════════════════════════════════════════════════════

{
    // The step types a game can be offered for, shaped as buildSequence() returns.
    const cases = [
        ['word_list', 'said with that this from have'.split('')],
        ['sentence_list', 'The cat sat. The dog ran.'.split('')],
        ['passage', 'One line.\nAnother line.\tThird.'.split('')],
        ['key_random', 'asdf jkl; fdsa'.split('')],
    ];
    for (const [type, seq] of cases) {
        const t = targetsFromSequence(seq);
        ok(t.length > 0 && t.every(x => x && !/\s/.test(x)),
           `a ${type} sequence still yields whitespace-free targets (${t.length})`);
    }
    const gates = runGrade.gatesForRun({ type: 'key_random', sequence: 'asdf'.split('') },
                                        { minAccuracy: 85, minWPM: 15 });
    ok(gates.minWPM === null,
       '⚠️ gatesForRun STILL returns null minWPM for a drill step — game-shell.js\'s ' +
       'missionConfigFromRun() falls back on exactly this, and a change to a number ' +
       'would silently make drills speed-graded in the games');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART F — the leaderboard the proposal is written against');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ firebase/PROPOSED-game-scores.md argues for a NEW collection on the grounds
// that the existing board is one doc per uid with scalar category fields. If that
// shape changed, the proposal's reasoning changed with it.

{
    const gameJs = read('game.js');
    if (gameJs) {
        ok(/collection\s*\(\s*db\s*,\s*['"]leaderboard['"]/.test(gameJs)
           || /['"]leaderboard['"]/.test(gameJs),
           'a `leaderboard` collection is still referenced — the proposal compares against it');
    } else {
        ok(false, 'game.js not found — cannot check the leaderboard assumption');
    }
    const rules = read('firebase/firestore.rules');
    ok(rules != null, 'firebase/firestore.rules is present');
    if (rules) {
        ok(!/game_scores/.test(rules),
           '⚠️ game_scores is NOT yet in the rules, which is correct — the proposal is ' +
           'unapproved and unrun against the emulator. If this fails, someone deployed it');
    }
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART G — the registry mirrors, and whether the games are in them');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ versions.js SOURCES is mirrored in tools/audit-versions.mjs and
// tests/version-stamp-test.mjs §D, and that harness FAILS if the three disagree.
// So the games are registered in all three or in none — never in one.
// ⚠️ THIS PART IS INFORMATIONAL UNTIL THE GAMES ARE REGISTERED. It reports rather
// than fails, because an unregistered game module is a deliberate state (the
// games are inert), and a red suite for a decision not yet taken is noise.

{
    const versions = read('versions.js');
    const auditor = read('tools/audit-versions.mjs');
    const stamp = read('tests/version-stamp-test.mjs');
    ok(versions && auditor && stamp, 'all three version mirrors are present');

    const gameFiles = ['game-shell.js', 'game-names.js', 'game-draw.js', 'game-chrome.js',
                       'game-audio.js', 'escape-board.js', 'game-escape.js', 'game-deadline.js'];
    const inVersions = gameFiles.filter(f => versions && versions.includes(`'${f}'`));
    const inAuditor = gameFiles.filter(f => auditor && auditor.includes(`'${f}'`));
    const inStamp = gameFiles.filter(f => stamp && stamp.includes(`'${f}'`));

    console.log(`  [registered — versions.js: ${inVersions.length}/8, ` +
                `audit-versions.mjs: ${inAuditor.length}/8, version-stamp-test.mjs: ${inStamp.length}/8]`);
    ok(inVersions.length === inAuditor.length && inAuditor.length === inStamp.length,
       '⚠️ THE THREE MIRRORS AGREE about the game modules — all three or none, never one. ' +
       'See INTEGRATION.md §3 for the exact entries to add when they are registered');
    if (inVersions.length === 0) {
        console.log('  NOTE  the games are not registered in any mirror yet, which is correct');
        console.log('        while they are inert. Register all three together when they ship.');
    }
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART H — the games are still inert (delete this Part when they are not)');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ WHILE THIS PART PASSES, PUSHING THE GAME FILES CHANGES NOTHING A STUDENT
// SEES. That is what makes them safe to land ahead of the wiring, and it is worth
// asserting rather than assuming: a stray import added while folding in roadmap
// work would make them live without anyone deciding to.

{
    const learnHtml = read('learn.html');
    const gameHtml = read('game.html');
    const names = ['game-shell', 'game-escape', 'game-deadline', 'escape-board',
                   'game-chrome', 'game-audio'];
    const liveIn = [];
    for (const [label, text] of [['learn.html', learnHtml], ['game.html', gameHtml],
                                  ['learn.js', learn], ['game.js', read('game.js')]]) {
        if (!text) continue;
        for (const n of names) if (text.includes(n)) liveIn.push(`${label}:${n}`);
    }
    ok(liveIn.length === 0,
       `no student-facing file imports a game module yet (${liveIn.join(', ') || 'none'}) — ` +
       '⚠️ when the wiring lands, THIS ASSERTION IS THE ONE TO INVERT, deliberately');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART I — the name registry is internally consistent');
// ═════════════════════════════════════════════════════════════════════════════

{
    ok(GAME_ORDER.every(id => GAMES[id]), 'every id in GAME_ORDER has an entry');
    ok(Object.keys(GAMES).every(k => GAMES[k].id === k),
       'every entry\'s id matches its key — ⚠️ these ids are FROZEN Firestore values');
    // ⚠️ JAKE'S 4e RULING, 2026-09-07: Escape Key is ARCADE-ONLY for now, but its
    // time counts. Deadline is the assessed one.
    ok(isAssessed('deadline'), 'Deadline is the assessed game');
    ok(!isAssessed('escape'),
       'Escape Key is arcade-only for now — ⚠️ a PRODUCT decision, not a capability ' +
       'one; escape-board-test Part B is what would earn it the graded path');
    ok(!isAssessed('shatter'),
       'and Shatter is not assessed \u2014 ⚠️ a PRODUCT decision like Escape Key\u2019s, ' +
       'NOT a statement that it is unfinished; it shipped in Round 103');
    ok(Object.keys(GAMES).every(k => GAMES[k].countsTime === true),
       '⚠️ EVERY game counts time toward totals — Jake: "It\'s tricking them into ' +
       'practicing more, so of course it counts"');
    ok(ARCADE_ENTRY.dayGated === false,
       '⚠️ the arcade is NOT day-gated — Jake is explicitly undecided, so nothing may ' +
       'assume a Friday; a game that vanishes on a Tuesday reads as broken');
    ok(ARCADE_ENTRY.libraryTile && ARCADE_ENTRY.schoolOption,
       'both entry points Jake asked for are recorded (library tile + school-page option)');
    // ═════════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ THE ASSERTION THAT USED TO LIVE HERE WAS DEFENDING THE BUG.
    // ═════════════════════════════════════════════════════════════════════════
    //
    // It read `ok(GAMES.shatter.unbuilt === true, 'Shatter is flagged unbuilt so
    // no picker offers it')`. That was true and correct in Round 82. Round 103
    // BUILT the game, Rounds 106 and 109 took it to v1.2.0 with both side panels
    // wired — and this line went on passing, green, for eleven rounds, while
    // `fillGames()` silently dropped Shatter from the only picker that offers it.
    // Jake could not give feedback on a game he was never shown.
    //
    // ⭐ THE FAULT IS THE SHAPE OF THE ASSERTION, NOT THE VALUE IN IT. It pinned
    // a fact about the WORLD ("this game does not exist") as though it were a
    // fact about the DESIGN ("this game must not be offered"). Facts about the
    // world go stale on their own; the harness then holds the stale one in place
    // and reports success for doing so.
    //
    // ⚠️ SO THE FLAG IS NOW DERIVED FROM DISK RATHER THAN ASSERTED AS A LITERAL.
    // A view that exists may not be flagged unbuilt, and a flag with no view
    // behind it may not be missing. Either way round, this goes red — and it
    // needs no editing when a fourth game arrives.
    for (const id of GAME_ORDER) {
        const g = GAMES[id];
        const src = read(String(g.module || '').replace(/^\.\//, ''));
        ok(!!src === !g.unbuilt,
           `⚠️⚠️ ${g.title}: the view ${src ? 'EXISTS' : 'is ABSENT'} on disk, so ` +
           `unbuilt must be ${src ? 'falsy' : 'true'} (is ${JSON.stringify(g.unbuilt)}) ` +
           '\u2014 a registry that denies a finished game is why Shatter was ' +
           'unreachable for eleven rounds');
    }
    // ⚠️ AND THE PICKER'S FILTER IS THE THING THAT MAKES THE FLAG MATTER, so it
    // is checked here rather than assumed. If arcade.html ever stops reading the
    // flag, the check above is measuring a quantity nothing consumes.
    {
        const html = read('arcade.html') || '';
        ok(/if \(!g \|\| g\.unbuilt\) continue;/.test(html),
           'and fillGames() is still the consumer of that flag, so it still matters');
    }
    ok(Object.keys(GAMES).every(k => GAMES[k].title && GAMES[k].module),
       'every game has a display title and a module path');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nPART J — the arcade target WPM costs nothing to compute');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ JAKE'S 4c RULING: assessed runs use the lesson gates; arcade uses the
// student's rolling speed. ⚠️ THE APP STORES NO ROLLING WPM — per-run WPM only
// reaches `typing_logs`, and `bestWPM` on the leaderboard doc is a best, not a
// mean. Computing and storing a new average would be a fourth record of a
// quantity the app already knows. So the arcade reads THE GATE OF THE FURTHEST
// LESSON REACHED, which is free: `lessons` and `progress` are already in memory
// on both pages, and `arcadeKeySet()` walks exactly that list already.

{
    const L = [
        { id: 'u1_l1', gates: { minWPM: 15 }, availableKeys: ['a', 's', 'd', 'f'] },
        { id: 'u1_l2', gates: { minWPM: 15 }, availableKeys: ['a', 's', 'd', 'f'] },
        { id: 'u3_l1', gates: { minWPM: 20 }, availableKeys: ['a', 's', 'd', 'f'] },
        { id: 'u7_l1', gates: { minWPM: 25 }, availableKeys: ['a', 's', 'd', 'f'] },
    ];
    ok(arcadeTargetWPM({ lessons: L, progress: {} }) === 15,
       'a student who has passed nothing gets the course default, not zero');
    ok(arcadeTargetWPM({ lessons: L, progress: { u1_l1: { passed: true }, u1_l2: { passed: true } } }) === 20,
       'and it rises as they advance through the units');
    const all = { u1_l1: { passed: true }, u1_l2: { passed: true }, u3_l1: { passed: true }, u7_l1: { passed: true } };
    ok(arcadeTargetWPM({ lessons: L, progress: all }) === 25,
       'reaching the end of the ladder targets the hardest gate they have met');

    // ⚠️ THE WINDOW MUST MATCH arcadeKeySet()'s EXACTLY, or the arcade would draw
    // its letters from one lesson and its speed from another.
    const keys = arcadeKeySet(L, { u1_l1: { passed: true } });
    ok(keys.length > 0, 'arcadeKeySet and arcadeTargetWPM both include the lesson in progress');

    ok(arcadeTargetWPM({ lessons: L, progress: {}, bestWPM: 40 }) === 32,
       'a personal best raises the floor to 80% of it, when the caller already has one');
    ok(arcadeTargetWPM({ lessons: L, progress: {}, bestWPM: 0 }) === 15,
       '⚠️ and its absence is fine — DO NOT ADD A FIRESTORE READ to supply it');
    ok(arcadeTargetWPM({ lessons: [], progress: {} }) === 15,
       'an empty course still yields a usable number rather than NaN or Infinity');

    const cfg = arcadeConfig({ lessons: L, progress: all, rand: () => 0.5 });
    ok(cfg.endless === true && cfg.targetWPM === 25,
       'arcadeConfig wires that target in and stays endless');
    ok(cfg.targets.length > 0, 'and still produces filtered targets');
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} failed`);
if (fail) { fails.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
