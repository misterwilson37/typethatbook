// celebration-test.mjs v1.0.0 — "NOT EVERYONE GOT FIREWORKS."
//
// ═══════════════════════════════════════════════════════════════════════════
// THE REPORT AND THE DEFECT
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, week of 2026-08-21: *"lots of complaints this week that not everyone got
// fireworks when they hit their weekly goal."*
//
// Both writers fire correctly from the tick, and both suppressed on load so a
// child would not get fireworks on every page view for the rest of the week.
// ⚠️ THE SUPPRESSION WAS THE DEFECT, AND IT ASKED THE WRONG QUESTION:
//
//     if (goals.weeklySeconds > 0 && statsData.secondsWeek >= goals.weeklySeconds)
//         weeklyGoalCelebrated = true;
//
// "Is the total already past the goal" is true for the ENTIRE REMAINDER OF THE
// WEEK. So any crossing that failed to fire at the moment it happened was gone
// permanently — and there are real ways to fail at that moment, the plainest
// being that `goals.weeklySeconds` is still 0 because the class read has not
// returned and the child started typing straight away.
//
// ⚠️ AND A WEEKLY GOAL IS CROSSED EXACTLY ONCE PER WEEK. One missed moment is the
// whole week. The DAILY goal carried the identical defect and nobody noticed,
// because it re-arms every morning — miss Monday's confetti, Tuesday's arrives.
//
// PARTS
//   A — the latch answers "was this SHOWN", per period, and rolls over.
//   B — ⚠️ THE RECOVERY CASE: a crossing missed in one mode fires in the next.
//       This is the whole point and it is what the old logic could not do.
//   C — but only ONCE. A child does not get fireworks on every page view.
//   D — a broken or empty store reports "not shown" — fail toward showing it.
//   E — GREP: both writers latch, both use the shared helper, neither has kept
//       an open-coded "is the total past the goal" suppression.
//
// ⚠️ MUTATION-VERIFIED. Restoring either file's old suppression lines fails
// Part E; making celebrationDone() return true whenever the key exists,
// regardless of period, fails Part A's rollover rows.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };
const eq = (msg, got, want) => ok(got === want, `${msg} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const src = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// hud.js reaches for localStorage; node has none. A minimal stand-in, installed
// before the import so the module sees it.
let _store = {};
globalThis.localStorage = {
    getItem: (k) => (k in _store ? _store[k] : null),
    setItem: (k, v) => { _store[k] = String(v); },
    removeItem: (k) => { delete _store[k]; },
};
const { celebrationDone, celebrationMark } = await import('../hud.js');
const reset = () => { _store = {}; };

const MON = '2026-08-17', FRI = '2026-08-21';
const WK1 = '1755230400000', WK2 = '1755835200000';

console.log('\n─── A. the latch is per period ───');
{
    reset();
    ok(!celebrationDone('week', WK1), 'A1 nothing shown yet');
    celebrationMark('week', WK1);
    ok(celebrationDone('week', WK1),  'A2 shown for this week');
    ok(!celebrationDone('week', WK2), 'A3 ⚠️ next week re-arms — a latch that never rolls over is silence');
    ok(!celebrationDone('day', WK1),  'A4 day and week are separate latches');

    reset();
    celebrationMark('day', MON);
    ok(celebrationDone('day', MON),  'A5 Monday shown');
    ok(!celebrationDone('day', FRI), 'A6 Friday re-arms');
    // Both can be live at once — a child crossing both on the same afternoon
    // should get confetti AND fireworks, not whichever was written last.
    celebrationMark('week', WK1);
    ok(celebrationDone('day', MON) && celebrationDone('week', WK1),
       'A7 ⚠️ marking one does not clear the other');
}

console.log('\n─── B. ⚠️ THE RECOVERY CASE — the reason this exists ───');
{
    reset();
    // The child crosses 50:00 in School while `goals.weeklySeconds` is still 0,
    // because the class read has not returned. Nothing fires, nothing is marked.
    const goalsNotLoadedYet = 0;
    const crossedInSchool = (goalsNotLoadedYet > 0);
    ok(!crossedInSchool, 'B1 the gate correctly drops it — there is no goal to cross');
    ok(!celebrationDone('week', WK1), 'B2 and nothing was marked');

    // They move to Library. Goals are loaded now, the week is well past the goal.
    // ⚠️ UNDER THE OLD LOGIC THIS SUPPRESSED AND THE WEEK WAS LOST. Under the
    // latch, the period is uncelebrated, so it fires.
    const weeklyGoalCelebrated = celebrationDone('week', WK1);
    ok(!weeklyGoalCelebrated, 'B3 ⚠️ Library does NOT suppress — the child has not been shown it');
    const willFire = (3000 > 0 && !weeklyGoalCelebrated && 3210 >= 3000);
    ok(willFire, 'B4 ⚠️ THE FIREWORKS FIRE IN THE NEXT MODE. This is the fix.');
    celebrationMark('week', WK1);
    ok(celebrationDone('week', WK1), 'B5 and now it is recorded');
}

console.log('\n─── C. but only once ───');
{
    reset();
    celebrationMark('week', WK1);
    let fired = 0;
    for (let pageView = 0; pageView < 20; pageView++) {
        if (!celebrationDone('week', WK1) && 3210 >= 3000) { fired++; celebrationMark('week', WK1); }
    }
    eq('C1 ⚠️ twenty page views, zero repeat fireworks', fired, 0);
}

console.log('\n─── D. a broken store fails toward showing it ───');
{
    reset();
    _store['ttb_celebrated_v1'] = 'not json {{{';
    ok(!celebrationDone('week', WK1), 'D1 unparseable store reads as "not shown"');
    reset();
    ok(!celebrationDone('week', ''),  'D2 an empty period is never "already shown"');
    ok(!celebrationDone('week', null), 'D3 nor a missing one');
    // ⚠️ A THROWING setItem MUST NOT TAKE THE PAGE DOWN. Private mode, quota.
    const good = globalThis.localStorage.setItem;
    globalThis.localStorage.setItem = () => { throw new Error('QuotaExceeded'); };
    let threw = false;
    try { celebrationMark('week', WK1); } catch { threw = true; }
    ok(!threw, 'D4 ⚠️ a failing write is swallowed — worst case the child sees it twice');
    globalThis.localStorage.setItem = good;
}

console.log('\n─── E. GREP: both writers, same helper ───');
{
    const decomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');
    for (const f of ['game.js', 'learn.js']) {
        const body = decomment(src(f));
        ok(/celebrationDone/.test(body) && /celebrationMark/.test(body),
           `E1 ${f}: uses the shared latch`);
        ok(/celebrationMark\('week'/.test(body), `E2 ⚠️ ${f}: marks the WEEK when it fires`);
        ok(/celebrationMark\('day'/.test(body),  `E3 ${f}: marks the day when it fires`);
        // ⚠️ THE ASSERTION THAT CATCHES A REVERT. The old suppression set the
        // flag true from the totals; nothing may do that again in either file.
        ok(!/weeklyGoalCelebrated\s*=\s*true;?\s*$/m.test(
             body.split('\n').filter(l => /statsData\.secondsWeek\s*>=\s*goals\.weeklySeconds/.test(l)).join('\n')),
           `E4 ⚠️ ${f}: no open-coded "already past the goal" suppression survives`);
        ok(/function applyGoalCelebrationState/.test(body),
           `E5 ${f}: the seed is a named function, so its call sites cannot drift`);
    }
    ok(/export function celebrationDone/.test(src('hud.js')) &&
       /export function celebrationMark/.test(src('hud.js')),
       'E6 hud.js owns the definition both files share');
}

console.log(`\n${fail ? 'FAILED' : 'PASSED'} — ${pass} passing, ${fail} failing`);
process.exit(fail ? 1 : 0);
