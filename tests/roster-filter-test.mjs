// roster-filter-test.mjs v1.0.1 — the Students-tab date filter, pinned to the
//
// v1.0.1 — PATH ONLY, Round 17 (Linotype). This file moved from the repo root
//          into tests/, so every source it reads is now `../` rather than `./`.
//          No assertion, threshold or expectation changed.
// Saturday-morning case that made it unreadable.
//
// ⚠️ THE SCENARIO THIS EXISTS FOR. On Saturday 2026-08-15 the panel reported
// "31 students loaded" above a table containing one row, and the one row was
// Jake himself. Both halves were working as written:
//   * the week starts on SATURDAY, so Friday's entire school week had already
//     rolled into "last week" and the default filter excluded all of it;
//   * loadStudentRoster() overwrote _renderRoster()'s honest status string one
//     line after it was written, so the screen contradicted itself and the
//     sentence that explained it never survived to be read.
//
// BEHAVIOURAL: _weekStartDate() and _localDateStr() are extracted and run
//              against fixed dates.
// STRUCTURAL:  the status-line ownership and the admin.html default.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const src   = readFileSync(new URL('../lessons-admin.js', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../admin.html', import.meta.url), 'utf8');

function extractFn(s, name) {
    const start = s.indexOf(`function ${name}(`);
    if (start < 0) return null;
    let depth = 0;
    for (let j = s.indexOf('{', start); j < s.length; j++) {
        if (s[j] === '{') depth++;
        else if (s[j] === '}') { depth--; if (depth === 0) return s.slice(start, j + 1); }
    }
    return null;
}

const wsSrc = extractFn(src, '_weekStartDate');
const ldSrc = extractFn(src, '_localDateStr');
ok(!!wsSrc && !!ldSrc, 'lessons-admin.js defines _weekStartDate() and _localDateStr()');

const fns = (wsSrc && ldSrc)
    ? new Function(`${wsSrc}; ${ldSrc}; return { _weekStartDate, _localDateStr };`)()
    : { _weekStartDate: d => d, _localDateStr: () => '' };
const { _weekStartDate, _localDateStr } = fns;

// Local noon, so no timezone can shift the calendar day out from under a test.
const day = (y, m, d) => new Date(y, m - 1, d, 12, 0, 0);

// ── The week really does start on Saturday ───────────────────────────────────
ok(_localDateStr(_weekStartDate(day(2026, 8, 15))) === '2026-08-15',
   'Saturday is day 0 of its own week');
ok(_localDateStr(_weekStartDate(day(2026, 8, 14))) === '2026-08-08',
   'Friday belongs to the week that began the PREVIOUS Saturday');
ok(_localDateStr(_weekStartDate(day(2026, 8, 17))) === '2026-08-15',
   'Monday belongs to the Saturday just gone');

// ⚠️ The property that makes the Saturday start correct for GOALS, and which any
// change to the boundary must preserve: one school week sits in one bucket.
const schoolWeek = [17, 18, 19, 20, 21].map(d => _localDateStr(_weekStartDate(day(2026, 8, d))));
ok(new Set(schoolWeek).size === 1,
   'Mon–Fri all land in one week bucket — a student\'s week cannot reset mid-week');

// ── ...and why it is the wrong DEFAULT for this filter ───────────────────────
// Reproduce _renderRoster()'s cutoff comparison for Jake's actual data.
const today   = day(2026, 8, 15);          // Saturday, when he looked
const typedOn = '2026-08-14';              // Friday, when the class typed

const weekCutoff = _localDateStr(_weekStartDate(today));
ok(typedOn < weekCutoff,
   'THE BUG: Friday\'s work is excluded by "This week" when checked on Saturday');

const d7 = new Date(today); d7.setDate(d7.getDate() - 7);
const sevenCutoff = _localDateStr(d7);
ok(!(typedOn < sevenCutoff),
   'Last 7 days includes Friday — which is why it is now the default');

// A rolling 7 days must contain the previous school day on EVERY day of the week,
// which is the whole claim being made by changing the default.
for (let offset = 0; offset < 7; offset++) {
    const when = day(2026, 8, 15 + offset);
    const c = new Date(when); c.setDate(c.getDate() - 7);
    const prev = new Date(when); prev.setDate(prev.getDate() - 1);
    ok(!(_localDateStr(prev) < _localDateStr(c)),
       `last-7-days contains yesterday when checked on ${_localDateStr(when)}`);
}

// ── STRUCTURAL: the default actually shipped in the markup ───────────────────
ok(/<option value="7days" selected>/.test(admin),
   'admin.html defaults the range to Last 7 days');
ok(!/<option value="thisweek" selected>/.test(admin),
   'the Sat–Fri option is no longer the default');
ok(/<option value="thisweek">/.test(admin),
   'the Sat–Fri option is still OFFERED — the default moved, the feature did not');

// ── STRUCTURAL: one writer owns the status line ──────────────────────────────
// ⚠️ The original defect was not a wrong string, it was two writers on one
// element with the less-informed one running last.
ok(!/statusEl\.textContent = _rosterData\.length \+ ' students loaded\.'/.test(src),
   'loadStudentRoster() no longer overwrites the rendered status');
// ⚠️ The first draft of this asserted a file-wide count of `statusEl.textContent =`
// against a guessed ceiling of 8. There are 21, because a dozen unrelated
// functions each have their own statusEl — the assertion counted the wrong
// population and failed on correct code. The claim that matters is narrower and
// exact: inside loadStudentRoster(), nothing writes the status after the render.
const loadBody = extractFn(src, 'loadStudentRoster') || '';
// ...and narrower still: the SUCCESS path only. The catch block writes an error
// into the same element and must keep doing so — when the load throws there is
// no rendered status to protect, and suppressing that message to satisfy a test
// would trade a real diagnostic for a green tick.
const successTail = loadBody
    .slice(loadBody.lastIndexOf('_renderRoster()'))
    .split('} catch')[0];
ok(loadBody.includes('_renderRoster()'), 'loadStudentRoster() still calls the renderer');
ok(!/statusEl\.textContent\s*=/.test(successTail),
   'on the success path nothing writes the status after _renderRoster()');
ok(/catch\(e\)\s*\{[\s\S]{0,120}statusEl\.textContent/.test(loadBody),
   'the catch block still reports load errors into the same element');
ok(/' of ' \+ _rosterData\.length/.test(src),
   'the status shows BOTH numbers when filtering hides people — the gap is the diagnosis');
ok(/built from typing activity, not from your roster/.test(src),
   'an empty roster explains that this list comes from typing, not from the import');

if (fail) {
    console.log(`\nroster-filter-test: ${pass} passed, ${fail} FAILED`);
    failures.forEach(f => console.log('   \u2717 ' + f));
    process.exit(1);
}
console.log(`roster-filter-test: all ${pass} assertions pass`);
