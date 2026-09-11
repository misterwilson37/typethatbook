// arcade-scope-menu-test.mjs v1.0.0 — ROADMAP 116g. Round 117 (Corona).
//
// ⚠️⚠️ THE SETTING WAS LYING, WHICH IS WORSE THAN NOT OFFERING IT.
//
// Jake, 2026-09-11, playing Deadline: *"if a student picks 'What I know so far'
// in deadline, it still gives him access to literally every lesson. The lesson
// menu should be locked to exactly what the kid has gotten to. Full pool is
// available for those kids who haven't done anything."*
//
// The WORDS control filtered the pool and did not filter the LESSON picker
// beside it, so a child who asked for "only what I have learned" was still
// offered Unit 5. ⭐ A CONTROL THAT NAMES A PROMISE AND DOES NOT KEEP IT TEACHES
// A STUDENT NOT TO BELIEVE THE CONTROLS.
//
// ⚠️⚠️ AND THE EXCEPTION IS LOAD-BEARING, WHICH IS WHY IT HAS MORE ASSERTIONS
// THAN THE RULE. Jake: *"Full pool is available for those kids who haven't done
// anything."* A brand-new child must never meet a picker with nothing in it —
// and note that the obvious implementation gets this WRONG rather than empty:
// `arcadeWindow()` with no progress returns 0, which is a ONE-ITEM menu, not a
// full one. Part C is that trap written down.
//
// ⚠️ RULE 10. Part D drives the REAL lesson corpus — all 47 authored lessons in
// course order — because the cap is an index into that list and an index bug is
// invisible against a three-lesson fixture.

import { readFileSync } from 'fs';
import { arcadeLessonMenu, arcadeWindow } from '../game-shell.js';

let pass = 0, fail = 0;
const fails = [];
const ok = (c, l) => { if (c) pass++; else { fail++; fails.push(l); } };

const raw = JSON.parse(readFileSync(
    new URL('./fixtures/lessons-export.json', import.meta.url), 'utf8'));
const LESSONS = (Array.isArray(raw) ? raw : raw.lessons)
    .slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
ok(LESSONS.length > 20, `the real lesson corpus loaded (${LESSONS.length} lessons)`);

/**
 * ⚠️ SHAPED LIKE arcade.html's `PLAYABLE`, INCLUDING THE HOLES. That page drops
 * any lesson that yields no playable run, so a PLAYABLE position is NOT a
 * LESSONS index — which is the whole reason each entry carries `idx`. A harness
 * that built a gapless list would prove nothing about the code that ships.
 */
const playableFrom = (skip = []) => {
    const out = [];
    LESSONS.forEach((lesson, idx) => {
        if (skip.includes(idx)) return;
        out.push({ lesson, idx, runs: [{ runIdx: 0 }] });
    });
    return out;
};

/** A student who has passed lessons 0..n-1. */
const passedUpTo = n => {
    const p = {};
    for (let i = 0; i < n; i++) p[LESSONS[i].id] = { passed: true };
    return p;
};

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nA — AT `level` THE MENU STOPS WHERE THE STUDENT STOPPED');
// ═════════════════════════════════════════════════════════════════════════════
{
    const playable = playableFrom();
    const progress = passedUpTo(6);
    const menu = arcadeLessonMenu({ lessons: LESSONS, progress, scope: 'level', playable });

    // ⚠️ THE WINDOW IS arcadeWindow()'s, NOT A SECOND COPY OF THE ARITHMETIC.
    // game-shell.js's header is explicit that two windows over one list means
    // the arcade draws its letters from one lesson and its speed from another;
    // a third window for the picker would be the same defect again.
    const w = arcadeWindow(LESSONS, progress);
    ok(w === 6, `the window is the furthest pass plus the one they are on (${w})`);

    const offered = menu.map(i => playable[i].idx);
    ok(offered.length > 0, 'the menu is not empty');
    ok(Math.max(...offered) === w,
       `⚠️ the furthest lesson offered is exactly the window (${Math.max(...offered)})`);
    ok(offered.every(i => i <= w),
       '⚠️⚠️ and NOTHING past it is offered — the setting keeps its promise');
    ok(offered.length < playable.length,
       `the menu is genuinely shorter than the whole course (${offered.length} of ${playable.length})`);

    // ⭐ THE ASSERTION THAT WOULD HAVE CAUGHT THE SHIPPED DEFECT. Before the fix
    // the picker listed every PLAYABLE entry regardless of scope, so this read
    // `47 === 47`.
    ok(offered.length !== playable.length,
       '⭐ a child who asked for "what I know so far" is NOT handed Unit 5');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nB — AT `full` NOTHING IS WITHHELD');
// ═════════════════════════════════════════════════════════════════════════════
{
    const playable = playableFrom();
    const menu = arcadeLessonMenu({
        lessons: LESSONS, progress: passedUpTo(6), scope: 'full', playable });
    ok(menu.length === playable.length,
       '⚠️ `full` is the student asking for everything, and everything is what they get');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nC — ⚠️⚠️ A BRAND-NEW CHILD GETS THE FULL POOL, NOT A ONE-ITEM MENU');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ THIS IS THE EXCEPTION JAKE CALLED OUT BY NAME, AND THE TRAP IS THAT THE
// NAIVE FIX FAILS IT QUIETLY RATHER THAN LOUDLY. `arcadeWindow()` with no
// progress returns 0 — the first lesson — which is a legal, non-empty, entirely
// wrong menu of one. A student's first ever visit to the arcade would offer them
// "F and J — Your Home Base" and nothing else.
{
    for (const [label, progress] of [
        ['no progress document at all', {}],
        ['a null progress map', null],
    ]) {
        const playable = playableFrom();
        const menu = arcadeLessonMenu({ lessons: LESSONS, progress, scope: 'level', playable });
        ok(menu.length === playable.length,
           `⚠️⚠️ ${label} → the WHOLE course, not a menu of one (${menu.length})`);
    }

    // ⚠️⚠️ AND THE BOUNDARY OF JAKE'S EXCEPTION, WHICH THIS HARNESS FOUND BY
    // GOING RED AGAINST ITS OWN FIRST DRAFT. A student with a `lessonProgress`
    // record who has PASSED nothing has still *started* lesson 1 — a document
    // only exists because they attempted it.
    //
    // ⭐ THEY ARE NOT THE "haven't done anything" CHILD, AND THE HONEST MENU IS
    // ONE ITEM. "Locked to exactly what the kid has gotten to" is the rule, they
    // have gotten to exactly one lesson, and handing them all 47 under a label
    // that reads *from my lessons so far* is the same lie 116g exists to remove,
    // only narrower. ⚠️ They are not trapped either: `full` is one control away
    // and it is the honest name for what it gives them.
    // ⚠️⚠️ THIS IS A JUDGEMENT AT THE EDGE OF A RULING JAKE GAVE, NOT THE RULING
    // ITSELF. If he wants an attempt to count as "nothing", the change is one
    // line in arcadeLessonMenu() and this assertion inverts with it.
    const started = playableFrom();
    const startedMenu = arcadeLessonMenu({
        lessons: LESSONS, progress: { [LESSONS[0].id]: { passed: false } },
        scope: 'level', playable: started });
    ok(startedMenu.length === 1 && started[startedMenu[0]].idx === 0,
       '⭐ a student who has STARTED lesson 1 and passed nothing is offered lesson 1');

    // ⭐ AND THE MOMENT THEY PASS ONE THING, THE CAP TAKES EFFECT. The exception
    // is for students with NO history, not a permanent escape hatch.
    const playable = playableFrom();
    const menu = arcadeLessonMenu({
        lessons: LESSONS, progress: passedUpTo(1), scope: 'level', playable });
    ok(menu.length < playable.length,
       '⭐ one pass is history, and the cap starts applying immediately');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nD — THE CAP IS A `lessons` INDEX AND THE MENU IS A `playable` ONE');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THE OFF-BY-N THAT IS INVISIBLE UNTIL A LESSON HAS NO PLAYABLE RUN.
// arcade.html filters PLAYABLE, so position 6 in the picker is not lesson 6.
// Comparing the cap against the picker's own position would silently offer work
// past the window on exactly the students whose course has a gap in it.
{
    const skip = [2, 3, 9];
    const playable = playableFrom(skip);
    const progress = passedUpTo(6);
    const w = arcadeWindow(LESSONS, progress);
    const menu = arcadeLessonMenu({ lessons: LESSONS, progress, scope: 'level', playable });
    const offered = menu.map(i => playable[i].idx);

    ok(offered.every(i => i <= w),
       `⚠️⚠️ with ${skip.length} lessons missing from the picker, the cap still ` +
       'means a LESSON index');
    ok(!offered.includes(2) && !offered.includes(3),
       'and the gaps really are gaps');
    ok(menu.every(i => i >= 0 && i < playable.length),
       '⚠️ every value returned is a valid index into the array the page will subscript');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nE — THE PICKER IS NEVER EMPTY, WHATEVER THE DATA SAYS');
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ THE DEGENERATE CASE: a student whose progress points at lessons that all
// dropped out of PLAYABLE. The cap would exclude everything, and an empty picker
// beside an enabled Play button is a dead button. ⭐ FALLING BACK TO THE WHOLE
// LIST IS THE SAME RULING AS PART C — a child never meets an empty menu.
{
    const playable = playableFrom([0, 1, 2, 3, 4, 5, 6]);
    const menu = arcadeLessonMenu({
        lessons: LESSONS, progress: passedUpTo(6), scope: 'level', playable });
    ok(menu.length === playable.length,
       '⚠️ when the cap would empty the menu, the whole list comes back instead');
    ok(menu.length > 0, 'and it is never zero-length');

    // ⚠️ AND A PAGE THAT HAS NOT LOADED YET MUST NOT THROW.
    ok(arcadeLessonMenu({ lessons: [], progress: {}, scope: 'level', playable: [] }).length === 0,
       'an unloaded page gets an empty array rather than an exception');
    ok(arcadeLessonMenu({}).length === 0, 'and so does a call with nothing in it');
}

console.log(fail
    ? `\nFAIL — ${pass} ok, ${fail} failed`
    : `\nPASS — ${pass} ok, 0 failed`);
if (fail) { fails.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
