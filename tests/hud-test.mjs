// hud-test.mjs v1.2.0
//
// v1.2.0 — ⚠️ THIS HARNESS WAS RED IN THE DELIVERED REPO AND THE PIN DID NOT
//          CATCH IT, WHICH IS THE INTERESTING HALF. Round 27 (Chicago).
//
//          hud.js v1.3.0 changed the return shape — `{ left, long }` became
//          `{ lead, sprint }` — and this file went on asserting `h.left` and
//          `h.long`, crashing on a TypeError at line 85. Part B is rewritten
//          against the real API below.
//
//          ⚠️ THE PIN IS WHY THIS WAS ALLOWED TO HAPPEN. Line ~31 asserts
//          `HUD_VERSION === <n>` for exactly one reason: so that bumping hud.js
//          fails this harness and forces whoever bumped it to come and look. It
//          did not fire — because hud.js's CONSTANT was never bumped either. It
//          sat at '1.2.0' through both releases while the header comment said
//          1.4.0. **A pin is a check on a number that a human maintains by
//          hand, so it inherits that number's honesty and cannot exceed it.**
//          The version stamps are now machine-checked in
//          tests/version-stamp-test.mjs, which is the guard that would have
//          fired here. Keep the pin anyway: it is doing a different job, and
//          the two together are what close the hole.
//
// v1.1.1 — PATH ONLY, Round 17 (Linotype). This file moved from the repo root
//          into tests/, so every source it reads is now `../` rather than `./`.
//          No assertion, threshold or expectation changed.
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
import { hudStrings, fmt, HUD_VERSION } from '../hud.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };

console.log('\n─── A. formatting ───');
ok(HUD_VERSION === '2.1.0', `hud.js reports v2.1.0 (got ${HUD_VERSION})`);
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

// ⚠️ v1.3.0 SPLIT THE ONE GLUED STRING INTO TWO FIELDS, AND THE SPLIT IS THE
// POINT — NOT A FORMATTING PREFERENCE. `lead` is the graded day figure and
// `sprint` is the live clock, and they go in DIFFERENT PARTS OF THE BAR. The old
// `Sprint 0:27 / 0:30 (Daily 9:22 / 10:00)` put a live quantity and a graded one
// in one slot with a parenthesis between them, which is how the goal ended up
// being the thing that got clipped.
{
    const h = hudStrings({ sprintSeconds: 27, sprintLimit: 30, todaySeconds: 562,
                           dailyGoal: 600, weekSeconds: 562, weeklyGoal: 3000 });
    ok(h.lead === 'Daily 9:22 / 10:00',
       `the lead row is the daily figure, exactly — got "${h.lead}"`);
    ok(h.sprint === '0:27 / 0:30',
       `the sprint is a bare clock for the centre cluster — got "${h.sprint}"`);
    ok(h.right === 'Weekly 9:22 / 50:00', `the week layout is exact — got "${h.right}"`);
}

// ⚠️ THE `long` FLAG IS GONE AND MUST NOT COME BACK. v1.2.0 returned
// `long: showSprint` so callers could shrink the font and ellipsise a 40+
// character string; v1.3.0 deleted it because two rows mean there is nothing
// left to truncate. ⚠️ RE-ADDING ANY FLAG THAT TELLS A CALLER TO SHRINK TEXT IS
// THIS BUG'S EXACT FINGERPRINT — hud.js's own header says so. Asserted rather
// than trusted, because this harness spent two versions asserting the opposite.
{
    const withSprint = hudStrings({ sprintSeconds: 27, sprintLimit: 30,
                           todaySeconds: 562, dailyGoal: 600, weekSeconds: 562, weeklyGoal: 3000 });
    ok(!('long' in withSprint),
       '⚠️ `long` is not in the return shape at all — deleted, not set false');
    ok(!('left' in withSprint),
       '⚠️ `left` is gone too — the combined Sprint+Daily string no longer exists');

    // The daily figure is never glued to the sprint, at any magnitude. This is
    // the property the old `long` flag was a proxy for, tested directly.
    const big = hudStrings({ sprintSeconds: 1799, sprintLimit: 1800,
                           todaySeconds: 7195, dailyGoal: 7200, weekSeconds: 900, weeklyGoal: 3000 });
    ok(big.lead === 'Daily 119:55 / 120:00',
       `the lead row carries its whole goal even at 119:55 / 120:00 — got "${big.lead}"`);
    ok(!big.lead.includes('Sprint') && !big.lead.includes('('),
       '⚠️ no sprint and no parenthesis ever appear in the lead row');
    ok(!big.lead.includes('…') && !big.lead.includes('...'),
       '⚠️ hud.js never ellipsises — a cut-off goal is what this whole change fixed');
}

// ⚠️ NO SPRINT LIMIT → THE LEAD ROW IS UNCHANGED AND THE SPRINT IS EMPTY. This
// is School's case and Library's no-limit case. The DAILY FIGURE MUST RENDER
// IDENTICALLY IN BOTH — that is invariant: the graded number does not move.
{
    const a = hudStrings({ sprintSeconds: 0, sprintLimit: 'infinity',
                           todaySeconds: 562, dailyGoal: 600, weekSeconds: 900, weeklyGoal: 3000 });
    const b = hudStrings({ sprintSeconds: 45, sprintLimit: 0,
                           todaySeconds: 562, dailyGoal: 600, weekSeconds: 900, weeklyGoal: 3000 });
    const c = hudStrings({ sprintSeconds: 27, sprintLimit: 30,
                           todaySeconds: 562, dailyGoal: 600, weekSeconds: 900, weeklyGoal: 3000 });
    ok(a.lead === 'Daily 9:22 / 10:00', `no limit still leads with Daily — got "${a.lead}"`);
    ok(a.lead === b.lead,
       "⚠️ School (limit 0) and Library (limit 'infinity') render the same lead row");
    ok(a.lead === c.lead,
       '⚠️⚠️ THE GRADED NUMBER DOES NOT MOVE: the lead row is byte-identical whether or not a sprint is running');
    ok(a.sprint === '' && b.sprint === '',
       'with no limit to show it against, the sprint slot is empty rather than 0:00');
    ok(!a.lead.includes('Active'),
       'the word "Active" is gone — it labelled a sprint total as though it were a day total');
}

// A goal of zero means "no goal", not a goal of zero.
{
    const h = hudStrings({ todaySeconds: 562, dailyGoal: 0, weekSeconds: 900, weeklyGoal: 0 });
    ok(h.lead === 'Daily 9:22', `no daily goal prints no denominator — got "${h.lead}"`);
    ok(h.right === 'Weekly 15:00', `no weekly goal prints no denominator — got "${h.right}"`);
    ok(!h.lead.includes('/ 0:00'), '⚠️ never renders "/ 0:00", which reads as broken or as a win');
    ok(h.dailyDone === false && h.weeklyDone === false,
       'a goal of zero is never "done" — nothing was asked for');
}

// Goals met.
{
    const h = hudStrings({ todaySeconds: 700, dailyGoal: 600, weekSeconds: 3100, weeklyGoal: 3000 });
    ok(h.lead.endsWith('✓'), 'a met daily goal is ticked');
    ok(h.right.endsWith('✓'), 'a met weekly goal is ticked');
    ok(h.dailyDone && h.weeklyDone, 'and the flags say so, for colour');
    ok(h.lead.includes('11:40 / 10:00'),
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
    // ⚠️ v1.3.0: the sprint clock moved OUT of the lead row into its own field.
    ok(h.sprint === '0:45 / 0:30', `and the sprint keeps counting — it is not clamped (got "${h.sprint}")`);
    ok(!h.lead.includes('0:45'), '⚠️ and it does NOT bleed into the graded daily row');
    const g = hudStrings({ sprintSeconds: 10, sprintLimit: 30, todaySeconds: 100 });
    ok(g.overtime === false, 'inside the target does not');
    const n = hudStrings({ todaySeconds: 100, dailyGoal: 600 });
    ok(n.overtime === false, 'with no sprint there is no overtime to be in');
}

// ⚠️ The first day of a week. Daily and Weekly are equal, and that is correct.
// Recorded as a test so nobody "fixes" it.
{
    const h = hudStrings({ todaySeconds: 562, dailyGoal: 600, weekSeconds: 562, weeklyGoal: 3000 });
    ok(h.lead.includes('9:22') && h.right.includes('9:22'),
       'on the first day of the week both figures are the same number — not a bug');
}

// Garbage in must not produce NaN on a child's screen.
{
    const h = hudStrings({});
    ok(h.lead === 'Daily 0:00' && h.right === 'Weekly 0:00',
       `an empty state renders zeros — got "${h.lead}" / "${h.right}"`);
    ok(h.sprint === '', 'and an empty state has no sprint to show');
    // ⚠️ EVERY STRING FIELD, not just the one that used to exist. The old
    // version of this line read `.left`, which is how it survived the rename
    // into a TypeError rather than a failed assertion.
    const n = hudStrings();
    for (const k of ['lead', 'sprint', 'right']) {
        ok(typeof n[k] === 'string' && !n[k].includes('NaN'),
           `no argument at all still renders a clean \`${k}\` — got "${n[k]}"`);
    }
}

console.log('\n─── C. both pages use it, and nothing else formats time ───');

const gameSrc  = readFileSync(new URL('../game.js',  import.meta.url), 'utf8');
const learnSrc = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');
const gameHtml  = readFileSync(new URL('../game.html',  import.meta.url), 'utf8');
const learnHtml = readFileSync(new URL('../learn.html', import.meta.url), 'utf8');

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
