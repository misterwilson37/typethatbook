// week-agreement-test.mjs v1.0.0
//
// ⚠️ PATHS: sources are read as `../` — this file lives in tests/ (Round 17).
//
// ═══════════════════════════════════════════════════════════════════════════
// THIS IS THE PRIORITY 1 HARNESS. IT TESTS THE ONE THING JAKE HAS ASKED FOR
// SIX ROUNDS RUNNING: does the number on the student's screen equal the number
// the teacher pulls out of reports.html?
// ═══════════════════════════════════════════════════════════════════════════
//
// Every other harness in this repo tests a component. This one tests an
// AGREEMENT between two components that never call each other, which is why
// nothing caught the defect it was written for.
//
// ⚠️ IT FOUND ONE ON ITS FIRST RUN. reports.html's toDateStr() formatted through
// toISOString() — UTC. Nashville is UTC−5 in summer, so from 7:00 PM local the
// `This Week` button selected a start date of SUNDAY while the student's week
// was anchored to SATURDAY. Saturday's typing was inside the child's number and
// outside the teacher's report, every evening, which is when a teacher grades.
// Six rounds hunted that divergence in the counting code. It was in a date
// formatter. Part C is the regression guard.
//
// Part A — THE TWO READERS. daylog.js totalsOf() (student) and reports.html
//          readLogTotals() (teacher) must return identical totals for every
//          shape of typing_logs document that exists in production.
// Part B — THE WEEK ANCHOR. daylog.js weekStartOf() and reports.html
//          getLastSaturday() must name the same Saturday.
// Part C — ⚠️ AT EVERY HOUR, IN JAKE'S TIMEZONE. Part B passes at 9 AM whether
//          or not the bug is present. The defect only appears after the
//          local/UTC date boundary diverges, so the hour is not incidental to
//          this test — it IS the test.
// Part D — GREPS: no toISOString() date formatting survives in either file.

import fs from 'fs';

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

const daylogSrc  = fs.readFileSync(new URL('../daylog.js',    import.meta.url), 'utf8');
const reportsSrc = fs.readFileSync(new URL('../reports.html', import.meta.url), 'utf8');

// ⚠️ LIFTED FROM THE SHIPPING FILES, NEVER RE-IMPLEMENTED HERE. A copy in this
// file would be a third implementation of the thing whose duplication is the
// entire subject of the test. Round 9 §4.
function lift(src, marker) {
    const s = src.indexOf(marker);
    if (s < 0) throw new Error('could not find in source: ' + marker);
    let depth = 0;
    for (let j = src.indexOf('{', s); j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') {
            depth--;
            if (depth === 0) {
                // `export` is a module-level keyword and cannot appear inside an
                // eval'd expression. Stripping it changes nothing about the
                // function body, which is the part under test.
                return eval('(' + src.slice(s, j + 1).replace(/^export\s+/, '') + ')');
            }
        }
    }
    throw new Error('unbalanced braces after ' + marker);
}

// daylog.js is a real ES module with no side effects, so its exports are
// IMPORTED rather than lifted — a lifted function loses the helpers it calls
// (weekStartOf() calls ymd()), and re-declaring those here would be the
// duplication this file exists to argue against. reports.html has no exports —
// it is a page — so its two functions are lifted out of the markup instead.
const studentTotals = lift(daylogSrc,  'function totalsOf(data) {');
const teacherTotals = lift(reportsSrc, 'function readLogTotals(data) {');
const teacherSat    = lift(reportsSrc, 'function getLastSaturday(from = new Date()) {');
const teacherFmt    = lift(reportsSrc, 'function toDateStr(d) {');
const { weekStartOf: studentWeek, localDateStr: studentYmd } =
    await import(new URL('../daylog.js', import.meta.url));

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart A — the student reader and the teacher reader');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ THE LEGACY-SPLIT CASES ARE NOT HYPOTHETICAL. game.js v3.29.0/v3.29.1 wrote
// secondsLibrary/secondsSchool for about two days before v3.30.0 reverted, so a
// handful of real documents carry the split shape. Both readers are
// legacy-FIRST: read the split ONLY when there is no flat field, because
// summing both shapes would double every ordinary day.

const DOCS = [
    ['ordinary flat document',      { seconds: 807, chars: 839, mistakes: 40 }],
    ['a day with no typing',        { seconds: 0, chars: 0, mistakes: 0 }],
    ['legacy split-only (v3.29.x)', { secondsLibrary: 300, secondsSchool: 507,
                                      charsLibrary: 400, charsSchool: 439,
                                      mistakesLibrary: 10, mistakesSchool: 30 }],
    ['flat AND split both present', { seconds: 807, chars: 839, mistakes: 40,
                                      secondsLibrary: 300, secondsSchool: 507 }],
    ['seconds present, rest absent', { seconds: 60 }],
    ['chars but no seconds key',     { chars: 5 }],
    ['empty document',               {}],
    ['flat zero over a legacy split', { seconds: 0, secondsLibrary: 120, secondsSchool: 90 }],
];

for (const [name, doc] of DOCS) {
    const a = studentTotals(doc), b = teacherTotals(doc);
    ok(name, a.seconds === b.seconds && a.chars === b.chars && a.mistakes === b.mistakes,
       `student ${a.seconds}s/${a.chars}ch vs teacher ${b.seconds}s/${b.chars}ch`);
}

// A whole week, summed by each side the way each side actually sums it.
{
    const week = [
        { seconds: 0 }, { seconds: 812, chars: 900 }, { seconds: 640, chars: 700 },
        { secondsLibrary: 200, secondsSchool: 407, charsLibrary: 100, charsSchool: 300 },
        { seconds: 903, chars: 1000 }, { seconds: 45, chars: 60 }, {},
    ];
    const s = week.reduce((a, d) => a + studentTotals(d).seconds, 0);
    const t = week.reduce((a, d) => a + teacherTotals(d).seconds, 0);
    ok('a seven-day week sums identically on both sides', s === t, `${s} vs ${t}`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart B — the week anchor (Sat–Fri)');
// ═══════════════════════════════════════════════════════════════════════════

for (const d of ['2026-08-15', '2026-08-16', '2026-08-19', '2026-08-21', '2026-08-22']) {
    const student = studentWeek(d);
    const teacher = teacherFmt(teacherSat(new Date(d + 'T12:00:00')));
    ok(`${d} → both anchor to ${student}`, student === teacher, `teacher said ${teacher}`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart C — ⚠️ AT EVERY HOUR, IN JAKE\'S TIMEZONE');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ DO NOT COLLAPSE THIS INTO PART B. Part B runs at local noon and passes with
// the UTC bug fully present. A date defect that only fires in the evening is
// invisible to any test that picks one hour, and the evening is precisely when
// a teacher sits down to grade. THE HOUR IS THE TEST.

if (process.env.TZ !== 'America/Chicago') {
    console.log('  ! run as `TZ=America/Chicago node week-agreement-test.mjs` for the real check');
}

{
    let mismatches = 0, worst = null;
    // Aug 15–22 2026 spans a Saturday boundary in both directions.
    for (let dayOff = 0; dayOff < 8; dayOff++) {
        for (let hour = 0; hour < 24; hour++) {
            const now = new Date(2026, 7, 15 + dayOff, hour, 30, 0);
            // What the student's HUD sums: the Sat–Fri week containing today.
            const studentAnchor = studentWeek(studentYmd(now));
            // What the `This Week` button puts in the teacher's start box.
            const teacherAnchor = teacherFmt(teacherSat(now));
            if (studentAnchor !== teacherAnchor) {
                mismatches++;
                if (!worst) worst = { now, studentAnchor, teacherAnchor, hour };
            }
        }
    }
    ok('`This Week` agrees with the student week at all 192 hours tested',
       mismatches === 0,
       worst ? `${mismatches} mismatches, first at ${String(worst.hour).padStart(2,'0')}:30 — ` +
               `student week starts ${worst.studentAnchor}, teacher selects ${worst.teacherAnchor}` : '');

    // ⚠️ The `Today` button has the same formatter behind it. After the UTC
    // boundary it filled both boxes with TOMORROW and the report came back
    // empty — which reads as "this child did nothing", not as a bug.
    let todayBad = 0;
    for (let hour = 0; hour < 24; hour++) {
        const now = new Date(2026, 7, 19, hour, 30, 0);
        if (teacherFmt(now) !== studentYmd(now)) todayBad++;
    }
    ok('`Today` selects today at every hour', todayBad === 0,
       `wrong at ${todayBad} of 24 hours`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart D — no UTC date formatting survives');
// ═══════════════════════════════════════════════════════════════════════════

// ⚠️ COMMENTS ARE STRIPPED FIRST. v2.20.0's own changelog QUOTES the defective
// line to explain it, and a grep that cannot tell code from prose would fail on
// the file that fixes the bug — which trains the next person to delete the
// check rather than read it.
const stripComments = (s) => s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');

const reportsCode = stripComments(reportsSrc);
const daylogCode  = stripComments(daylogSrc);
const utcDateFormat = /toISOString\(\)\s*(?:\.\s*split\(\s*['"]T['"]|\.\s*slice\(\s*0\s*,\s*10)/;

ok('reports.html formats no date through toISOString()',
   !utcDateFormat.test(reportsCode));

ok('daylog.js formats no date through toISOString()',
   !utcDateFormat.test(daylogCode));

// ⚠️ NOT A BAN ON toISOString() OUTRIGHT. session-log.js legitimately stamps
// `at` with a full ISO INSTANT, which is correct — an instant has no timezone
// ambiguity. The defect is only ever taking the DATE PORTION of a UTC instant
// and treating it as a local calendar day.
ok('the student and teacher day formatters produce the same string',
   (() => {
       for (let h = 0; h < 24; h++) {
           const d = new Date(2026, 7, 19, h, 30);
           if (teacherFmt(d) !== studentYmd(d)) return false;
       }
       return true;
   })());

// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${fail === 0 ? '✓ PASS' : '✗ FAIL'} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
