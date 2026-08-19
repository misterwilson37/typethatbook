// hud-test.mjs v1.1.0
//
// v1.1.0 — version pin follows hud.js to 1.2.0. Added B tests for the new
//          `long` flag hudStrings() now returns.
// v1.0.1 — version pin follows hud.js to 1.1.0. ⚠️ THIS IS THE THIRD PIN IN THE
//          SUITE (the others are on session-log.js, in session-merge-test.mjs and
//          open-unit-test.mjs Part D). Invariant 55: pins come in sets.
// — the shared time readout. Round 13 (Ludlow).
//
// hud.js is imported for real, not lifted: it is DOM-free and pure, which is the
// property that makes this harness five lines of setup instead of jsdom.
//
// ⚠️ WHAT THIS HARNESS IS ACTUALLY DEFENDING is not a format. It is the rule that
// A NUMBER'S POSITION MEANS ONE THING. The bug it was written against was the
// Library timer showing sprint seconds, or day seconds, or sprint seconds again
// labelled "Active", in the same slot, depending on a setting a child could
// change. Part C asserts that both page controllers get their strings from here
// and hold no second formatter.

import { readFileSync } from 'fs';
import { hudStrings, fmt, HUD_VERSION } from './hud.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };

console.log('\n─── A. formatting ───');
ok(HUD_VERSION === '1.2.0', `hud.js reports v1.2.0 (got ${HUD_VERSION})`);
ok(fmt(0) === '0:00', 'zero is 0:00');
ok(fmt(7) === '0:07', 'seconds are padded (0:07, never 0:7)');
ok(fmt(562) === '9:22', '562 seconds is 9:22');
ok(fmt(600) === '10:00', '600 seconds is 10:00');
ok(fmt(3000) === '50:00', '3000 seconds is 50:00');
ok(fmt(-5) === '0:00', 'a negative never renders as a negative clock');
ok(fmt(undefined) === '0:00', 'a missing value renders as 0:00, not NaN:NaN');
// ⚠️ Minutes are NOT padded and seconds always are. `9:22` reads faster than
// `09:22`, and `9:7` is unreadable.
ok(!fmt(562).startsWith('0'), 'minutes are not zero-padded');

console.log('\n─── B. the two readouts ───');

// Jake's layout, verbatim from the specification.
{
    const h = hudStrings({ sprintSeconds: 27, sprintLimit: 30, todaySeconds: 562,
                           dailyGoal: 600, weekSeconds: 562, weeklyGoal: 3000 });
    ok(h.left === 'Sprint 0:27 / 0:30 (Daily 9:22 / 10:00)',
       `the sprint layout is exact — got "${h.left}"`);
    ok(h.right === 'Weekly 9:22 / 50:00', `the week layout is exact — got "${h.right}"`);
}

// ⚠️ `long` (v1.2.0) — true only for the combined Sprint+Daily form, which is
// the one that runs long enough to hit #hud-time's ellipsis in style.css.
// Daily-alone is never `long`, no matter how big its own numbers get — it's
// shorter than the combined form even at three-digit hours, and the bug this
// flag exists for was specifically the sprint case's parenthetical getting
// clipped.
{
    const withSprint = hudStrings({ sprintSeconds: 27, sprintLimit: 30,
                           todaySeconds: 562, dailyGoal: 600, weekSeconds: 562, weeklyGoal: 3000 });
    ok(withSprint.long === true, 'the combined Sprint+Daily form is `long`');

    const noSprintLimit = hudStrings({ sprintSeconds: 0, sprintLimit: 'infinity',
                           todaySeconds: 562, dailyGoal: 600, weekSeconds: 900, weeklyGoal: 3000 });
    ok(noSprintLimit.long === false, 'Daily alone is never `long`, even with large totals');

    const bigDailyAlone = hudStrings({ todaySeconds: 7195, dailyGoal: 7200,
                           weekSeconds: 900, weeklyGoal: 3000 });
    ok(bigDailyAlone.long === false,
       `Daily alone stays \`long: false\` even at 119:55 / 120:00 — got ${bigDailyAlone.long}`);
}

// ⚠️ NO SPRINT LIMIT → DAILY ALONE, IN THE SAME POSITION. This is School's case
// and Library's no-limit case, and they must render identically.
{
    const a = hudStrings({ sprintSeconds: 0, sprintLimit: 'infinity',
                           todaySeconds: 562, dailyGoal: 600, weekSeconds: 900, weeklyGoal: 3000 });
    const b = hudStrings({ sprintSeconds: 45, sprintLimit: 0,
                           todaySeconds: 562, dailyGoal: 600, weekSeconds: 900, weeklyGoal: 3000 });
    ok(a.left === 'Daily 9:22 / 10:00', `no limit shows Daily alone — got "${a.left}"`);
    ok(a.left === b.left,
       "⚠️ School (limit 0) and Library (limit 'infinity') render the same left slot");
    ok(!a.left.includes('Active'),
       'the word "Active" is gone — it labelled a sprint total as though it were a day total');
}

// A goal of zero means "no goal", not a goal of zero.
{
    const h = hudStrings({ todaySeconds: 562, dailyGoal: 0, weekSeconds: 900, weeklyGoal: 0 });
    ok(h.left === 'Daily 9:22', `no daily goal prints no denominator — got "${h.left}"`);
    ok(h.right === 'Weekly 15:00', `no weekly goal prints no denominator — got "${h.right}"`);
    ok(!h.left.includes('/ 0:00'), '⚠️ never renders "/ 0:00", which reads as broken or as a win');
    ok(h.dailyDone === false && h.weeklyDone === false,
       'a goal of zero is never "done" — nothing was asked for');
}

// Goals met.
{
    const h = hudStrings({ todaySeconds: 700, dailyGoal: 600, weekSeconds: 3100, weeklyGoal: 3000 });
    ok(h.left.endsWith('✓'), 'a met daily goal is ticked');
    ok(h.right.endsWith('✓'), 'a met weekly goal is ticked');
    ok(h.dailyDone && h.weeklyDone, 'and the flags say so, for colour');
    ok(h.left.includes('11:40 / 10:00'),
       'past the goal keeps counting up rather than capping at the goal');
}

// Exactly at the goal counts as met — a child who does precisely ten minutes has
// done their ten minutes.
{
    const h = hudStrings({ todaySeconds: 600, dailyGoal: 600, weekSeconds: 3000, weeklyGoal: 3000 });
    ok(h.dailyDone && h.weeklyDone, 'exactly on the goal is met, not one second short');
}

// Overtime is a flag, not a stop.
{
    const h = hudStrings({ sprintSeconds: 45, sprintLimit: 30, todaySeconds: 100, dailyGoal: 600 });
    ok(h.overtime === true, 'past the sprint target sets overtime');
    ok(h.left.includes('0:45 / 0:30'), 'and the sprint keeps counting — it is not clamped');
    const g = hudStrings({ sprintSeconds: 10, sprintLimit: 30, todaySeconds: 100 });
    ok(g.overtime === false, 'inside the target does not');
    const n = hudStrings({ todaySeconds: 100, dailyGoal: 600 });
    ok(n.overtime === false, 'with no sprint there is no overtime to be in');
}

// ⚠️ The first day of a week. Daily and Weekly are equal, and that is correct.
// Recorded as a test so nobody "fixes" it.
{
    const h = hudStrings({ todaySeconds: 562, dailyGoal: 600, weekSeconds: 562, weeklyGoal: 3000 });
    ok(h.left.includes('9:22') && h.right.includes('9:22'),
       'on the first day of the week both figures are the same number — not a bug');
}

// Garbage in must not produce NaN on a child's screen.
{
    const h = hudStrings({});
    ok(h.left === 'Daily 0:00' && h.right === 'Weekly 0:00',
       `an empty state renders zeros — got "${h.left}" / "${h.right}"`);
    ok(!hudStrings().left.includes('NaN'), 'no argument at all still renders');
}

console.log('\n─── C. both pages use it, and nothing else formats time ───');

const gameSrc  = readFileSync(new URL('./game.js',  import.meta.url), 'utf8');
const learnSrc = readFileSync(new URL('./learn.js', import.meta.url), 'utf8');
const gameHtml  = readFileSync(new URL('./game.html',  import.meta.url), 'utf8');
const learnHtml = readFileSync(new URL('./learn.html', import.meta.url), 'utf8');

ok(/from ["']\.\/hud\.js["']/.test(gameSrc),  'game.js imports hud.js');
ok(/from ["']\.\/hud\.js["']/.test(learnSrc), 'learn.js imports hud.js');
ok(/hudStrings\(/.test(gameSrc) && /hudStrings\(/.test(learnSrc),
   'both page controllers call hudStrings()');

// ⚠️ THE ELEMENT ID MUST MATCH IN BOTH PAGES. That is what makes the readout
// occupy the same position, which is the actual requirement.
ok(/id="hud-time"/.test(gameHtml),  'game.html has the shared #hud-time slot');
ok(/id="hud-time"/.test(learnHtml), 'learn.html has the shared #hud-time slot');
ok(/id="hud-week"/.test(gameHtml) && /id="hud-week"/.test(learnHtml),
   'both pages keep #hud-week for the right slot');

// The retired elements must be gone from BOTH markup and code, or a stale writer
// keeps updating an element nobody can see and the two halves disagree forever.
for (const [name, html, js, label] of [
    ['timer-label',    gameHtml,  gameSrc,  'game'],
    ['timer-goal',     gameHtml,  gameSrc,  'game'],
    ['timer-display',  gameHtml,  gameSrc,  'game'],
    ['hud-timer',      learnHtml, learnSrc, 'learn'],
    ['hud-daily-goal', learnHtml, learnSrc, 'learn'],
]) {
    ok(!html.includes('id="' + name + '"'), `${label}.html no longer defines #${name}`);
    ok(!js.includes("getElementById('" + name + "')"),
       `${label}.js no longer queries #${name}`);
}

// ⚠️ NO SECOND FORMATTER. The old bar had four: two in learn.js's ticks, one in
// updateWeeklyHUD(), one in updateTimerUI(). Any `String(x).padStart(2,'0')` next
// to a seconds calculation in a HUD writer is this bug coming back.
const timeMath = /Math\.floor\(statsData\.seconds(Today|Week) *\/ *60\)/g;
const gameHits  = (gameSrc.match(timeMath)  || []).length;
const learnHits = (learnSrc.match(timeMath) || []).length;
ok(gameHits === 0,
   `⚠️ game.js formats no day/week clock outside hud.js (found ${gameHits})`);
ok(learnHits === 0,
   `⚠️ learn.js formats no day/week clock outside hud.js (found ${learnHits})`);

// ⚠️ The static label is gone too. `Today:` lived in learn.html's markup, so the
// word and the number had different owners and the word could not change with the
// value it described.
ok(!/Today:\s*<span/.test(learnHtml),
   'the hardcoded "Today:" label is gone from learn.html — the label is part of the string now');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
