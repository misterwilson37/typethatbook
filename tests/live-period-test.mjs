// live-period-test.mjs v1.0.0 — THE STALE DAY CARRIED FORWARD.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE DEFECT, MEASURED ON REAL DATA (Jake, 2026-08-21, two students)
// ═══════════════════════════════════════════════════════════════════════════
//
// Two students out of two classes showed a daily total for 2026-08-21 that was
// their real work PLUS the entirety of 2026-08-20's day total:
//
//     student A   20m 28s / 2,219 ch  =   6m 50s /   761 ch  +  13m 38s / 1,458 ch
//     student B   41m 37s / 9,023 ch  =  19m 14s / 4,068 ch  +  22m 18s / 4,950 ch
//
// A is EXACT — to the second and to the character. B is 5s / 5ch short, which
// is one open unit under the five-second floor. The right-hand term in each row
// is that student's whole 08-20 document.
//
// ⚠️ AND THE CHILD REPORTED THE FINGERPRINT HIMSELF: the HUD "started in the
// teens" BEFORE he typed anything that morning. 13m 38s is the teens.
//
// THE MECHANISM. mergeGuestStats() computes `mine = live - base` and writes
// `max(live, server + mine)`. Both period guards test the SERVER side, `d` —
// and on the only path that calls the function, retroactiveSaveGuestSession()
// SYNTHESISES `d` with `lastDate: dateStr`, so `dayMatches` is a tautology.
// learn.js's caller says so in as many words: "Both period guards match by
// construction." Nothing tested `statsData`, the term that can actually be
// stale. A Chromebook lid closed on an open tab, a 24-hour token lapsing
// overnight, a sign-in the next morning — and `mine` is yesterday's whole day,
// posted to today's ledger line.
//
// ⚠️ IT COULD NOT SELF-CORRECT, AND THAT IS THE LAST LINE OF THE FUNCTION.
// `statsData.lastDate = dateStr` restamps the stale counters as today's, so the
// tick's midnight rollover finds nothing to roll over and never fires.
//
// PARTS
//   A — the two students' REAL figures, both files, stale tab. The day must
//       come out as the SERVER's number, not server + yesterday.
//   B — REGRESSION: with a valid live period the arithmetic is untouched. Drives
//       the real 2026-08-20 guest-minute figures that guest-merge-test.mjs
//       Part A exists for. The fix must not un-fix Round 23.
//   C — the FLOOR must not re-float a stale value. Zeroing `mine` alone is not
//       enough: max(live, …) would carry yesterday forward on its own.
//   D — the week rides on the day.
//   E — GREP: the live guard is wired into BOTH fold loops in BOTH files, and
//       the two copies have not drifted.
//
// ⚠️ MUTATION-VERIFIED. Against game.js v3.38.0 / learn.js v2.23.1 this harness
// reports 42 failing across Parts A, C, D and E (21 passing). Part B passes on
// BOTH builds, which is the point of it.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };
const eq = (msg, got, want) => ok(got === want, `${msg} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const src = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const game  = src('game.js');
const learn = src('learn.js');

// Same lifter as guest-merge-test.mjs. Balanced-brace slice of a named function.
function lift(text, name) {
    const start = text.indexOf('function ' + name + '(');
    if (start < 0) return null;
    let i = text.indexOf('{', start), depth = 0;
    for (; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') { depth--; if (!depth) break; }
    }
    return text.slice(start, i + 1);
}

// Drive the real mergeGuestStats() with an explicit statsData AND an explicit
// statsBaseline. Both matter here: the defect is a subtraction between them.
function merge(text, what, { live, baseline, server, dateStr, weekStart }) {
    const body = lift(text, 'mergeGuestStats');
    ok(!!body, `${what}: mergeGuestStats() is liftable`);
    if (!body) return null;
    const sandbox = new Function('server', 'dateStr', 'weekStart', 'live', 'baseline', `
        const statsData = Object.assign({}, live);
        const statsBaseline = Object.assign({}, baseline);
        function captureStatsBaseline() {}
        ${body}
        mergeGuestStats(server, dateStr, weekStart);
        return statsData;
    `);
    return sandbox(server, dateStr, weekStart, live, baseline);
}

// ── the two students, as the app would have held them ────────────────────────
//
// ⚠️ NO STUDENT IDENTIFIERS IN THIS FILE. These are the arithmetic and nothing
// else; the accounts they came from are not recorded here and must not be.
const STUDENTS = [
    { id: 'A',
      yDay:   { seconds: 818,  chars: 1458, mistakes: 0 },   // 08-20, 13m 38s
      yWeekStart: 1012,                                      // week sum at 08-20's page load
      todayTyped: { seconds: 410, chars: 761 },              // 08-21 session evidence, 6m 50s
      observedBad: 1228 },                                   // the 20m 28s Jake saw
    { id: 'B',
      yDay:   { seconds: 1338, chars: 4950, mistakes: 0 },   // 08-20, 22m 18s
      yWeekStart: 3155,
      todayTyped: { seconds: 1154, chars: 4068 },            // 08-21, 19m 14s
      observedBad: 2492 },
];

console.log('\n─── A. the real 2026-08-21 figures, stale tab ───');
for (const s of STUDENTS) {
    // The tab has been open since yesterday morning. statsData still describes
    // 08-20; the baseline is what the server held when that page loaded.
    const yWeek = s.yWeekStart + s.yDay.seconds;
    const live = {
        lastDate: '2026-08-20', weekStart: '2026-08-15',
        secondsToday: s.yDay.seconds, charsToday: s.yDay.chars, mistakesToday: 0,
        secondsLibrary: s.yDay.seconds, charsLibrary: s.yDay.chars, mistakesLibrary: 0,
        secondsSchool: 0, charsSchool: 0, mistakesSchool: 0,
        secondsWeek: yWeek, charsWeek: 0, mistakesWeek: 0,
    };
    const baseline = {
        secondsToday: 0, charsToday: 0, mistakesToday: 0,
        secondsLibrary: 0, charsLibrary: 0, mistakesLibrary: 0,
        secondsSchool: 0, charsSchool: 0, mistakesSchool: 0,
        secondsWeek: s.yWeekStart, charsWeek: 0, mistakesWeek: 0,
    };
    // What retroactiveSaveGuestSession() synthesises on 08-21, before any
    // typing: today's document is empty, the week sum includes yesterday.
    const server = {
        lastDate: '2026-08-21', weekStart: '2026-08-15',
        secondsToday: 0, charsToday: 0, mistakesToday: 0,
        secondsLibrary: 0, charsLibrary: 0, mistakesLibrary: 0,
        secondsSchool: 0, charsSchool: 0, mistakesSchool: 0,
        secondsWeek: yWeek, charsWeek: 0, mistakesWeek: 0,
    };

    for (const [text, what] of [[game, 'game.js'], [learn, 'learn.js']]) {
        const out = merge(text, what, { live, baseline, server,
                                        dateStr: '2026-08-21', weekStart: '2026-08-15' });
        if (!out) continue;
        eq(`A1 ${s.id} ${what}: the day starts at ZERO, not yesterday's total`,
           out.secondsToday, 0);
        eq(`A2 ${s.id} ${what}: characters too`, out.charsToday, 0);
        eq(`A3 ${s.id} ${what}: the per-source day counter as well`,
           out.secondsLibrary, 0);
        ok(out.secondsToday !== s.yDay.seconds,
           `A4 ⚠️ ${s.id} ${what}: yesterday's day is NOT carried forward`);
        // The whole observed row, reconstructed: merge, then type.
        eq(`A5 ⚠️ ${s.id} ${what}: after today's real typing the day reads the truth, not ${s.observedBad}s`,
           out.secondsToday + s.todayTyped.seconds, s.todayTyped.seconds);
    }
}

console.log('\n─── B. REGRESSION: a valid live period is untouched ───');
{
    // The real 2026-08-20 figures from guest-merge-test.mjs Part A. A genuine
    // guest, same day, nothing stale. This must behave exactly as it did before
    // the fix — if it does not, Round 23's guest minute has been un-fixed.
    const server = {
        lastDate: '2026-08-20', weekStart: '2026-08-15',
        secondsToday: 447, charsToday: 1400, mistakesToday: 30,
        secondsSchool: 447, charsSchool: 1400, mistakesSchool: 30,
        secondsLibrary: 0, charsLibrary: 0, mistakesLibrary: 0,
        secondsWeek: 3552, charsWeek: 5000, mistakesWeek: 90,
    };
    const guest = (seconds, field) => ({
        lastDate: '2026-08-20', weekStart: '2026-08-15',
        secondsToday: seconds, charsToday: 300, mistakesToday: 5,
        secondsLibrary: 0, charsLibrary: 0, mistakesLibrary: 0,
        secondsSchool: 0, charsSchool: 0, mistakesSchool: 0,
        [field]: seconds,
        secondsWeek: seconds, charsWeek: 300, mistakesWeek: 5,
    });
    const zeroBase = {};   // a true guest: nothing was ever seeded

    const school = merge(learn, 'learn.js', { live: guest(64, 'secondsSchool'), baseline: zeroBase,
                                              server, dateStr: '2026-08-20', weekStart: '2026-08-15' });
    if (school) {
        eq('B1 School: 7:27 + 1:04 = 8:31 still', school.secondsToday, 511);
        eq('B2 and the guest minute still lands in the School field', school.secondsSchool, 511);
    }
    const library = merge(game, 'game.js', { live: guest(71, 'secondsLibrary'), baseline: zeroBase,
                                             server, dateStr: '2026-08-20', weekStart: '2026-08-15' });
    if (library) {
        eq('B3 Library: 7:27 + 1:11 = 8:38 still', library.secondsToday, 518);
        eq('B4 and it still lands in the Library field', library.secondsLibrary, 71);
    }

    // An EXPIRED SESSION on the same day — the case the baseline exists for.
    // Seeded from the server at load, typed 3 minutes since, re-authed.
    const expLive = { lastDate: '2026-08-20', weekStart: '2026-08-15',
                      secondsToday: 447 + 180, secondsWeek: 3552 + 180,
                      secondsLibrary: 447 + 180 };
    const expBase = { secondsToday: 447, secondsWeek: 3552, secondsLibrary: 447 };
    for (const [text, what] of [[game, 'game.js'], [learn, 'learn.js']]) {
        const out = merge(text, what, { live: expLive, baseline: expBase, server,
                                        dateStr: '2026-08-20', weekStart: '2026-08-15' });
        if (!out) continue;
        eq(`B5 ${what}: expired session adds only the 3 minutes since the baseline`,
           out.secondsToday, 447 + 180);
        eq(`B6 ${what}: and the week is not doubled`, out.secondsWeek, 3552 + 180);
    }
}

console.log('\n─── C. the FLOOR must not re-float a stale value ───');
{
    // ⚠️ THIS IS THE PART THAT CATCHES A HALF-FIX. Zero `mine` but leave
    // `max(live, …)` in place and the stale figure comes back anyway, because
    // `live` IS the stale figure. Server smaller than live, on purpose.
    const live = { lastDate: '2026-08-20', weekStart: '2026-08-15',
                   secondsToday: 900, secondsLibrary: 900, secondsWeek: 4000 };
    const baseline = { secondsToday: 900, secondsLibrary: 900, secondsWeek: 4000 };  // mine === 0
    const server = { lastDate: '2026-08-21', weekStart: '2026-08-15',
                     secondsToday: 60, secondsLibrary: 60, secondsWeek: 4060 };
    for (const [text, what] of [[game, 'game.js'], [learn, 'learn.js']]) {
        const out = merge(text, what, { live, baseline, server,
                                        dateStr: '2026-08-21', weekStart: '2026-08-15' });
        if (!out) continue;
        eq(`C1 ${what}: the day takes the server's smaller number`, out.secondsToday, 60);
        eq(`C2 ${what}: per-source too`, out.secondsLibrary, 60);
        ok(out.secondsToday !== 900, `C3 ⚠️ ${what}: the floor did not re-float yesterday`);
    }
}

console.log('\n─── D. the week rides on the day ───');
{
    // Same week, stale day. The week guard passes on its own terms — yesterday
    // IS in this week — but `mine` is yesterday's contribution, already flushed
    // and already inside the server's week sum.
    const live = { lastDate: '2026-08-20', weekStart: '2026-08-15',
                   secondsToday: 818, secondsWeek: 1830 };
    const baseline = { secondsToday: 0, secondsWeek: 1012 };   // mine(week) === 818
    const server = { lastDate: '2026-08-21', weekStart: '2026-08-15',
                     secondsToday: 0, secondsWeek: 1830 };
    for (const [text, what] of [[game, 'game.js'], [learn, 'learn.js']]) {
        const out = merge(text, what, { live, baseline, server,
                                        dateStr: '2026-08-21', weekStart: '2026-08-15' });
        if (!out) continue;
        eq(`D1 ${what}: the week is the server's sum, not sum + yesterday again`,
           out.secondsWeek, 1830);
        ok(out.secondsWeek !== 2648, `D2 ⚠️ ${what}: the week is not double-counted`);
    }
}

console.log('\n─── E. GREP: wired into both loops, in both files ───');
{
    const decomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');
    for (const [text, what] of [[game, 'game.js'], [learn, 'learn.js']]) {
        const body = decomment(lift(text, 'mergeGuestStats') || '');
        ok(/const\s+liveDay\s*=/.test(body),  `E1 ${what}: liveDay exists`);
        ok(/const\s+liveWeek\s*=/.test(body), `E2 ${what}: liveWeek exists`);
        // ⚠️ THE ASSERTION THAT WOULD NOTICE A HALF-REVERT. A guard that exists
        // but is not passed to fold() is a comment.
        ok(/fold\(k,\s*dayMatches,\s*liveDay\)/.test(body),
           `E3 ⚠️ ${what}: the DAY loop passes liveDay`);
        ok(/fold\(k,\s*weekMatches,\s*liveWeek\)/.test(body),
           `E4 ⚠️ ${what}: the WEEK loop passes liveWeek`);
        ok(/liveWeek\s*=\s*liveDay\s*&&/.test(body),
           `E5 ${what}: liveWeek is conditioned on liveDay`);
        // The early return is what drops the floor along with the contribution.
        ok(/if\s*\(!liveValid\)\s*\{\s*statsData\[key\]\s*=\s*server;\s*return;\s*\}/.test(body),
           `E6 ⚠️ ${what}: an invalid live period takes the server value outright`);
    }
    // The two copies must not drift — the arithmetic was never the defect, the
    // divergence between two hand-maintained copies of it is.
    const norm = (t) => decomment(lift(t, 'mergeGuestStats') || '').replace(/\s+/g, ' ').trim();
    const gGuards = (norm(game).match(/live(Day|Week|Valid)/g) || []).length;
    const lGuards = (norm(learn).match(/live(Day|Week|Valid)/g) || []).length;
    eq('E7 ⚠️ both files carry the same number of live-guard references', gGuards, lGuards);
}

console.log(`\n${fail ? 'FAILED' : 'PASSED'} — ${pass} passing, ${fail} failing`);
process.exit(fail ? 1 : 0);
