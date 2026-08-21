// hud-lead-test.mjs v1.0.0 — THE GRADED NUMBER DOES NOT MOVE.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS PROTECTS, AND WHY IT IS A HARNESS AND NOT A COMMENT
// ═══════════════════════════════════════════════════════════════════════════
//
// hud.js exists because of one sentence from Jake: *"telling kids where to look
// for their minutes is kind of terrible. It's confusing me where numbers are,
// and I made the thing."* The Library timer had been showing three different
// quantities in one slot depending on settings.
//
// ⚠️ THE TWO-ROW BAR PUTS THAT BACK WITHIN REACH, WHICH IS WHY THIS FILE EXISTS.
// Sprint-above-daily was asked for on 2026-08-21 and argued down: it would make
// Daily the LEAD row on the landing page and the SUB row inside a book, so the
// graded number would move depending on where the child is standing. That is
// the original defect in a nicer layout. A later round making the bar look
// better is exactly the kind of change that would undo it without noticing,
// because nothing about it looks like a data bug.
//
// PARTS
//   A — `lead` is the Daily figure for every combination of sprint limit,
//       goals and progress. Never the sprint, never blank, never both.
//   B — the sprint is its OWN field and empty when there is no limit, so
//       School's centre row has nothing to render rather than a stray "0:00".
//   C — REGRESSION: the numbers hud.js reports are the numbers it was given.
//       A layout change must not become an arithmetic change.
//   D — GREP: both paint functions read `hud.lead` into the lead element, and
//       neither has re-grown a shrink-the-text flag.
//
// ⚠️ MUTATION-VERIFIED. Swapping `lead: daily` for the old combined string in
// hud.js fails Part A on every row; deleting either `hud.lead` assignment fails
// Part D.

import { readFileSync } from 'fs';
import { hudStrings } from '../hud.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };
const eq = (msg, got, want) => ok(got === want, `${msg} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const src = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

console.log('\n─── A. `lead` is ALWAYS the Daily figure ───');
{
    // Every shape a real bar can be in: sprint or no sprint, goals or no goals,
    // met or unmet, plus the real 2026-08-21 numbers from the two students.
    const cases = [
        { what: 'no sprint, no goals',      st: { todaySeconds: 410 } },
        { what: 'no sprint, goal unmet',    st: { todaySeconds: 410, dailyGoal: 600 } },
        { what: 'no sprint, goal met',      st: { todaySeconds: 900, dailyGoal: 600 } },
        { what: 'sprint running',           st: { todaySeconds: 410, dailyGoal: 600, sprintSeconds: 12, sprintLimit: 30 } },
        { what: 'sprint in overtime',       st: { todaySeconds: 410, dailyGoal: 600, sprintSeconds: 44, sprintLimit: 30 } },
        { what: 'sprintLimit infinity',     st: { todaySeconds: 410, dailyGoal: 600, sprintLimit: 'infinity' } },
        { what: 'the long form that used to truncate',
          st: { todaySeconds: 7195, dailyGoal: 7200, sprintSeconds: 1799, sprintLimit: 1800 } },
        { what: 'student A, 2026-08-21',    st: { todaySeconds: 410,  dailyGoal: 600, weekSeconds: 3058, weeklyGoal: 3000 } },
        { what: 'student B, 2026-08-21',    st: { todaySeconds: 1159, dailyGoal: 600, weekSeconds: 7071, weeklyGoal: 3000 } },
    ];
    for (const c of cases) {
        const h = hudStrings(c.st);
        ok(h.lead.startsWith('Daily '), `A1 ${c.what}: lead begins "Daily "  (got ${JSON.stringify(h.lead)})`);
        // ⚠️ THE ASSERTION THAT CATCHES SPRINT-ABOVE-DAILY.
        ok(!/Sprint/i.test(h.lead), `A2 ⚠️ ${c.what}: the SPRINT IS NOT IN THE LEAD ROW`);
        // ⚠️ AND THE ONE THAT CATCHES RE-GLUING THEM BACK TOGETHER.
        ok(!h.lead.includes('('), `A3 ⚠️ ${c.what}: no parenthetical — that was the cramming`);
        ok(h.lead.length <= 26, `A4 ${c.what}: lead stays short enough not to truncate (${h.lead.length} chars)`);
        ok(typeof h.right === 'string' && h.right.startsWith('Weekly '),
           `A5 ${c.what}: the week readout is unchanged`);
        ok(!('long' in h), `A6 ⚠️ ${c.what}: the shrink-the-text flag is gone, not renamed`);
        ok(!('left' in h), `A7 ${c.what}: the old glued field is gone`);
    }
}

console.log('\n─── B. the sprint is its own field ───');
{
    // School hardcodes sprintLimit to 0. Its centre must render NOTHING rather
    // than a stray "0:00" that a child would read as a number about them.
    eq('B1 School (no limit) has an empty sprint', hudStrings({ todaySeconds: 410, sprintLimit: 0 }).sprint, '');
    eq('B2 "infinity" is also no sprint', hudStrings({ todaySeconds: 410, sprintLimit: 'infinity' }).sprint, '');
    eq('B3 a running sprint reads elapsed / limit',
       hudStrings({ todaySeconds: 410, sprintSeconds: 12, sprintLimit: 30 }).sprint, '0:12 / 0:30');
    ok(hudStrings({ sprintSeconds: 44, sprintLimit: 30 }).overtime,
       'B4 past the limit still flags overtime');
    ok(!hudStrings({ todaySeconds: 410, sprintLimit: 0 }).overtime,
       'B5 ⚠️ no limit can never be overtime — School must not glow orange');
}

console.log('\n─── C. REGRESSION: a layout change is not an arithmetic change ───');
{
    const h = hudStrings({ todaySeconds: 2497, dailyGoal: 600, weekSeconds: 7071, weeklyGoal: 3000 });
    eq('C1 41m 37s formats as 41:37', h.lead, 'Daily 41:37 / 10:00 ✓');
    eq('C2 the week formats and ticks', h.right, 'Weekly 117:51 / 50:00 ✓');
    ok(h.dailyDone && h.weeklyDone, 'C3 both goals report met');
    const u = hudStrings({ todaySeconds: 410, dailyGoal: 600, weekSeconds: 1200, weeklyGoal: 3000 });
    eq('C4 an unmet goal carries no tick', u.lead, 'Daily 6:50 / 10:00');
    ok(!u.dailyDone && !u.weeklyDone, 'C5 and reports unmet');
    eq('C6 no goal set shows the bare figure', hudStrings({ todaySeconds: 410 }).lead, 'Daily 6:50');
}

console.log('\n─── D. GREP: both painters, both pages ───');
{
    const decomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');
    for (const [f, el] of [['game.js', 'timerDisplay'], ['learn.js', 'hudTimer']]) {
        const body = decomment(src(f));
        ok(new RegExp(el + '\\.textContent\\s*=\\s*hud\\.lead').test(body),
           `D1 ⚠️ ${f}: the lead element is painted from hud.lead`);
        ok(!/hud\.long/.test(body), `D2 ⚠️ ${f}: hud.long is not read any more`);
        ok(!/hud-time-long/.test(body), `D3 ${f}: the shrink class is not toggled`);
        ok(/hud-sprint/.test(body), `D4 ${f}: the sprint has its own element`);
    }
    for (const f of ['game.html', 'learn.html']) {
        const html = src(f);
        // ⚠️ THE ORDER IN THE MARKUP IS THE ORDER ON SCREEN. hud-time must come
        // BEFORE hud-context inside the stack, or Daily is the sub row.
        const stack = html.indexOf('class="hud-stack"');
        const time  = html.indexOf('id="hud-time"');
        const ctx   = html.indexOf('id="hud-context"');
        ok(stack >= 0 && time > stack, `D5 ${f}: #hud-time is inside the stack`);
        ok(time >= 0 && ctx > time, `D6 ⚠️ ${f}: #hud-time comes BEFORE #hud-context — Daily is the lead row`);
        ok(/id="hud-sprint"[^>]*class="hud-lead"/.test(html), `D7 ${f}: the sprint leads the centre stack`);
        ok(/id="user-name"[\s\S]{0,240}id="hud-week"/.test(html),
           `D8 ${f}: the week sits UNDER the name`);
    }
    ok(!/hud-time-long/.test(decomment(src('style.css'))),
       'D9 ⚠️ style.css: the shrink rule is deleted, not just unused');
}

console.log(`\n${fail ? 'FAILED' : 'PASSED'} — ${pass} passing, ${fail} failing`);
process.exit(fail ? 1 : 0);
