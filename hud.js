// hud.js v1.1.0
//
// v1.1.0 — hudCacheSave()/hudCacheLoad(): the last-known readout, so a page does
//          not open at 0:00 while Firestore is still being read. ⚠️ DISPLAY ONLY
//          — read the warning above HUD_CACHE_KEY before touching it.
// — the time readout, in words, for both page controllers.
// The fourth shared module, after firebase-config.js, stats-wal.js and
// session-log.js.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS FILE EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, who built the app: *"telling kids where to look for their minutes is
// kind of terrible. It's confusing me where numbers are, and I made the thing."*
//
// He was right, and the cause is worse than inconsistent labels. The Library
// timer showed THREE DIFFERENT QUANTITIES IN ONE SLOT depending on settings:
//
//   * a session limit set        → the current sprint's seconds
//   * no limit, daily goal set   → the whole day's seconds
//   * neither                    → the current sprint's seconds again, as "Active"
//
// Same position, same digits, same font, three meanings — and a label above it
// that a student has no reason to read carefully. Meanwhile School showed
// `Today: 9:22` in that slot and never showed the current run at all. A child
// moving between the two sides had to relearn the top bar, and a child who
// switched their session length changed what their own number meant.
//
// ⚠️ THE NUMBER A STUDENT IS GRADED ON MUST ALWAYS BE IN THE SAME PLACE, WITH
// THE SAME WORD IN FRONT OF IT. That is the whole content of this module.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE LAYOUT (Jake's, 2026-08-18)
// ═══════════════════════════════════════════════════════════════════════════
//
//   left    Sprint 0:27 / 0:30 (Daily 9:22 / 10:00)
//   left    Daily 9:22 / 10:00                        ← when there is no sprint
//   right   Weekly 9:22 / 50:00
//
// Three words only: **Sprint, Daily, Weekly.** Sprint is the unit in front of
// them, Daily is what they owe today, Weekly is what they owe this week. Daily
// appears on BOTH sides in the same place whether or not a sprint is running, so
// the answer to "where are my minutes" is one answer.
//
// ⚠️ EVERY NUMBER IS m:ss. Jake's sketch had `27 / 30 sec` next to
// `9:22 / 10 min`, which asks a sixth-grader to compare seconds against decimal
// minutes in one glance. Mixed units in one line is how the old bar got confusing
// in the first place.
//
// ⚠️ DAILY AND WEEKLY ARE EQUAL ON THE FIRST DAY OF THE WEEK. Saturday, and
// Monday for most classes. Somebody will report it as a bug. It is not one.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY IT RETURNS STRINGS AND TOUCHES NO DOM
// ═══════════════════════════════════════════════════════════════════════════
//
// Same reasoning as session-log.js's injected Firestore surface: this is imported
// by two page controllers whose markup is not identical, and a module that
// queried the DOM would be a third place that has to know about element ids. It
// returns text and flags; each page writes them where it keeps them. It is also
// then a pure function, so `hud-test.mjs` drives the real code with no jsdom.

export const HUD_VERSION = '1.1.0';

// m:ss. Not padded on minutes — `9:22` reads faster than `09:22` and a student's
// day does not reach three digits. Seconds ALWAYS padded, or 9:7 appears.
export function fmt(seconds) {
    const s = Math.max(0, Math.round(seconds || 0));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// `elapsed / goal`, or just `elapsed` when there is no goal to measure against.
// ⚠️ A ZERO OR MISSING GOAL PRINTS NO DENOMINATOR RATHER THAN `/ 0:00`. A goal of
// zero means "no goal set", and `9:22 / 0:00` reads as though the child is
// spectacularly ahead or the app is broken.
function pair(elapsed, goal) {
    const g = Math.max(0, Math.round(goal || 0));
    return g > 0 ? fmt(elapsed) + ' / ' + fmt(g) : fmt(elapsed);
}

// The two readouts. One call, both sides, so they cannot drift apart.
//
//   sprintSeconds  seconds in the current sprint or run (0 when none is running)
//   sprintLimit    the sprint's target in seconds, or 0/'infinity' for none
//   todaySeconds   statsData.secondsToday   — the graded day total
//   dailyGoal      goals.dailySeconds
//   weekSeconds    statsData.secondsWeek
//   weeklyGoal     goals.weeklySeconds
//
// Returns { left, right, dailyDone, weeklyDone, overtime }. The flags are for
// colour; the caller owns colour because the two pages theme differently.
export function hudStrings(state) {
    const st = state || {};
    const today = Math.max(0, Math.round(st.todaySeconds || 0));
    const week  = Math.max(0, Math.round(st.weekSeconds  || 0));
    const dailyGoal  = Math.max(0, Math.round(st.dailyGoal  || 0));
    const weeklyGoal = Math.max(0, Math.round(st.weeklyGoal || 0));

    const dailyDone  = dailyGoal  > 0 && today >= dailyGoal;
    const weeklyDone = weeklyGoal > 0 && week  >= weeklyGoal;

    const daily = 'Daily ' + pair(today, dailyGoal) + (dailyDone ? ' ✓' : '');

    // A sprint is only shown when there is a limit to show it against. School
    // has no per-run time target — its gates are WPM and accuracy — so School
    // shows the Daily figure alone, in the same place Library shows it.
    const limit = (st.sprintLimit === 'infinity') ? 0
                : Math.max(0, Math.round(st.sprintLimit || 0));
    const sprint = Math.max(0, Math.round(st.sprintSeconds || 0));
    const showSprint = limit > 0;

    const left = showSprint
        ? 'Sprint ' + fmt(sprint) + ' / ' + fmt(limit) + ' (' + daily + ')'
        : daily;

    return {
        left,
        right: 'Weekly ' + pair(week, weeklyGoal) + (weeklyDone ? ' ✓' : ''),
        dailyDone,
        weeklyDone,
        // Past the sprint target. Library colours the readout for this; the
        // sprint is not stopped, and never has been.
        overtime: showSprint && sprint >= limit,
    };
}

// ─── The last-known readout, so a page does not open at 0:00 ─────────────────
//
// ⚠️ THIS IS A DISPLAY CACHE AND NOTHING MAY EVER READ IT INTO `statsData`.
// (v1.1.0) Firestore is an async read. Between a page painting and that read
// landing, the only totals in memory are the zeros `statsData` is initialised
// with — so a student who had 17 minutes opened their book, saw `Daily 0:00`,
// and had to wait. Jake reported it twice, correctly, and the second time it was
// still true after the paint itself was fixed: the paint was fine, the NUMBER
// was not there yet.
//
// ⚠️ IT IS A CACHE OF A QUANTITY THAT LIVES ELSEWHERE, WHICH IS THE SHAPE THIS
// PROJECT HAS BEEN BITTEN BY REPEATEDLY (invariant 1). It is legitimate ONLY
// because it is:
//   · write-only from the authoritative side — saved after Firestore is read,
//     never from a live counter and never from a merge;
//   · read exactly once, to paint, before the real value exists;
//   · discarded the instant the real value lands, and stale-checked by date.
// ⚠️ IF YOU EVER FEEL LIKE SEEDING `statsData` FROM THIS, DON'T. It would become
// a second source of truth for the day total, and §3.7's merge baseline would be
// computed against a number that never came from the server. That is the doubled
// week counter, rebuilt.
const HUD_CACHE_KEY = 'ttb_hudCache_v1';

export function hudCacheSave({ todaySeconds, weekSeconds, date, weekStart }) {
    try {
        localStorage.setItem(HUD_CACHE_KEY, JSON.stringify({
            todaySeconds: todaySeconds || 0,
            weekSeconds:  weekSeconds  || 0,
            date:         date  || '',
            weekStart:    weekStart || 0,
        }));
    } catch { /* private mode, quota — the page just opens at 0:00 as before */ }
}

// Returns { todaySeconds, weekSeconds } or null. ⚠️ Returns null rather than
// zeros when the cache is for another day or another week: showing a stale
// total is worse than showing none, because the student cannot tell it is stale.
export function hudCacheLoad(todayStr, weekStart) {
    try {
        const raw = localStorage.getItem(HUD_CACHE_KEY);
        if (!raw) return null;
        const c = JSON.parse(raw);
        if (!c || c.date !== todayStr) return null;
        return {
            todaySeconds: c.todaySeconds || 0,
            weekSeconds:  (c.weekStart === weekStart) ? (c.weekSeconds || 0) : 0,
        };
    } catch { return null; }
}
