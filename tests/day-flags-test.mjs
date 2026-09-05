// day-flags-test.mjs v1.0.0 — ⚠️⚠️ THE AT-A-GLANCE SURFACE ACTUALLY RENDERS.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// ROADMAP 36. Jake: *"Something that tells me at a glance what the kids did
// without having to expand each day to find out."* Three surfaces shipped
// together — the free error-rate column, the scan-only flag icons, and the
// floating legend — plus ROADMAP 32's per-run delete button.
//
// ⚠️⚠️ THE FUNCTIONS THIS FILE LIFTS WERE SCOPED INSIDE renderTable() ON THE
// FIRST ATTEMPT, WHERE scanForFlags() AND renderLegend() COULD NOT SEE THEM.
// Four ReferenceErrors waiting for a button press. undefined-calls-test.mjs
// caught it, which is exactly the class of defect that harness exists for —
// and it is v2.24.0's SOURCE_SPLIT_CUTOVER defect repeated verbatim in the same
// file. This harness pins the BEHAVIOUR those functions owe; that one pins that
// they resolve at all. Both are needed and neither replaces the other.
//
// ⚠️ WHAT THIS CANNOT CHECK: whether the thresholds are RIGHT. They are
// provisional by design (§0.-33.A — a threshold picked with no data fired on
// every row) and are on screen so Jake can watch them for a week. This harness
// asserts the SHAPE of the answer, never its calibration.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const src = readFileSync(new URL('../reports.html', import.meta.url), 'utf8');

// ── lift a function out of the page by brace-matching it ─────────────────────
function lift(name) {
    const at = src.indexOf('function ' + name + '(');
    if (at < 0) return null;
    const open = src.indexOf('{', at);
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(at, i + 1); }
    }
    return null;
}

console.log('--- A. THE HELPERS EXIST AND ARE LIFTABLE ---');
const fErr   = lift('errorRateOf');
const fCell  = lift('dayErrorCell');
const fScan  = lift('scanCell');
ok(fErr,  '⚠️ A1 errorRateOf() is present');
ok(fCell, '⚠️ A2 dayErrorCell() is present');
ok(fScan, '⚠️ A3 scanCell() is present');

// Constants the lifted functions close over.
const consts = (() => {
    const w = /const ERR_WATCH\s*=\s*([\d.]+)/.exec(src);
    const h = /const ERR_HIGH\s*=\s*([\d.]+)/.exec(src);
    return { ERR_WATCH: w ? +w[1] : null, ERR_HIGH: h ? +h[1] : null };
})();
ok(consts.ERR_WATCH !== null && consts.ERR_HIGH !== null,
   'A4 the two provisional thresholds are declared');
ok(consts.ERR_WATCH < consts.ERR_HIGH,
   '⚠️ A5 watch < high. Inverted, every high day would render as merely watch-worthy');

// FLAG_DEFS, for the legend and the icons.
const flagKeys = [...src.matchAll(/\{\s*key:\s*'(\w+)'/g)].map(m => m[1]);
ok(flagKeys.length >= 4, `A6 FLAG_DEFS carries the flags (${flagKeys.length} found)`);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- B. ⚠️⚠️ "NO ANSWER" IS NEVER RENDERED AS ZERO ---');
// This is the assertion that matters most on this surface. A clean green 0% on
// a day with no typing, or on a pre-cutover day with no split stored, is the
// report lying by omission — and it lies in the direction of "this child was
// fine", which is the direction nobody checks.
const errorRateOf = new Function('return ' + fErr)();

ok(errorRateOf(null) === null,
   '⚠️⚠️ B1 A MISSING TRIPLE IS null, NOT 0. A pre-cutover day has no School ' +
   'split at all — that is NO ANSWER, not zero mistakes');
ok(errorRateOf({ chars: 0, mistakes: 0 }) === null,
   '⚠️⚠️ B2 0/0 IS null, NOT 0. A day with a log and no typing must render a ' +
   'dash; rendering 0% invents a clean day out of an absent one');
ok(errorRateOf({ chars: 90, mistakes: 10 }) === 0.10,
   'B3 an ordinary day computes mistakes / (chars + mistakes)');
ok(errorRateOf({ chars: 10, mistakes: 10 }) === 0.50,
   '⚠️ B4 a coin-flip day reads 50% — the two-key masher\u2019s floor from ROADMAP 35, ' +
   'which is the whole reason this column exists');
ok(errorRateOf({ chars: 0, mistakes: 7 }) === 1,
   'B5 all mistakes and no correct keys is 100%, not a divide-by-zero');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- C. THE CELL SAYS WHICH SCOPE IT IS SHOWING ---');
const dayErrorCell = new Function(
    'errorRateOf', 'ERR_WATCH', 'ERR_HIGH', 'return ' + fCell
)(errorRateOf, consts.ERR_WATCH, consts.ERR_HIGH);

const school = dayErrorCell({ chars: 100, mistakes: 100, school: { chars: 90, mistakes: 10 } });
ok(/10%/.test(school),
   '⚠️⚠️ C1 THE SCHOOL TRIPLE WINS WHEN PRESENT. A day total dilutes a mashed ' +
   'two-key lesson with a cleanly-typed book, which is the exact case ROADMAP 35 ' +
   'is about — the combined number would hide it');
ok(/School only/.test(school), 'C2 and the tooltip says it is School only');
ok(!/10%\*/.test(school), 'C3 no asterisk on a School-scoped rate');

const combined = dayErrorCell({ chars: 90, mistakes: 10, school: null });
ok(/10%\*/.test(combined),
   '⚠️ C4 A COMBINED RATE IS MARKED WITH AN ASTERISK. Two different meanings in ' +
   'one column, unlabelled, is §3.1 wearing a report\u2019s clothes');
ok(/pre-cutover/i.test(combined), 'C5 and the tooltip explains why it is combined');

const none = dayErrorCell({ chars: 0, mistakes: 0, school: null });
// ⚠️ CHECK THE RENDERED VALUE, NOT THE WHOLE STRING. The first draft of this
// assertion did `!/0%/.test(none)` and failed against CORRECT code, because the
// tooltip legitimately contains the phrase "NOT a 0% day". A test that reads the
// explanation as if it were the output is a test that will be "fixed" by
// deleting the explanation.
const noneShown = />([^<]*)<\/span>/.exec(none);
ok(noneShown && noneShown[1].trim() === '\u2014',
   '\u26a0\ufe0f\u26a0\ufe0f C6 A NO-TYPING DAY RENDERS A DASH AND NEVER A PERCENTAGE. What is ' +
   'shown is "' + (noneShown ? noneShown[1] : '(nothing)') + '"');
ok(/NOT a 0% day/i.test(none),
   'C7 and says so in the tooltip, because a dash alone reads as a rendering bug');

ok(/err-high/.test(dayErrorCell({ chars: 40, mistakes: 60, school: null })),
   'C8 a rate at or above the high threshold gets the high class');
ok(/err-ok/.test(dayErrorCell({ chars: 95, mistakes: 5, school: null })),
   'C9 an ordinary rate is styled quietly — most rows are ordinary and must not shout');
ok(/PROVISIONAL/.test(school),
   '⚠️ C10 THE TOOLTIP SAYS THE THRESHOLDS ARE PROVISIONAL. §0.-33.A: a number ' +
   'picked with no data must not read to Jake as a settled judgement');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- D. ⚠️⚠️ "NOT SCANNED" NEVER LOOKS LIKE "CLEAN" ---');
const FLAG_DEFS = new Function('return ' + /const FLAG_DEFS = (\[[\s\S]*?\n    \];)/.exec(src)[1])();
const mkScanCell = (map) => new Function(
    'scanFlags', 'FLAG_DEFS', 'return ' + fScan
)(map, FLAG_DEFS);

const empty = mkScanCell(new Map())('u1', '2026-08-26');
const clean = mkScanCell(new Map([['u1|2026-08-26', new Set()]]))('u1', '2026-08-26');
const dirty = mkScanCell(new Map([['u1|2026-08-26', new Set(['fail'])]]))('u1', '2026-08-26');

ok(/scan-unknown/.test(empty), 'D1 an unscanned day renders the unknown mark');
ok(/scan-clean/.test(clean),   'D2 a scanned-and-clear day renders the clean mark');
ok(empty !== clean,
   '⚠️⚠️ D3 THE TWO ARE NOT THE SAME MARKUP. This is the single most important ' +
   'assertion on this surface: if "not looked at" and "looked, found nothing" ' +
   'converge, every clean-looking row becomes untrustworthy and the feature is ' +
   'worse than not having it');
ok(/Not scanned/i.test(empty),
   'D4 and the unscanned tooltip says so in words, not just a faint colour');
ok(/fl-fail/.test(dirty), 'D5 a flagged day renders its icon');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- E. THE LEGEND IS PRESENT, PINNED AND HONEST ---');
ok(/id="flag-legend"/.test(src), 'E1 the legend host is in the markup');
ok(/function renderLegend\(\)/.test(src), 'E2 renderLegend() exists');
ok(/#flag-legend\s*\{[^}]*position:\s*fixed/.test(src),
   '⚠️ E3 THE LEGEND IS position:fixed. Jake asked for one that "stays on the ' +
   'screen as you scroll"; a legend that scrolls away is one he has to hunt for ' +
   'at the moment he needs it');
ok(/@media \(max-width: \d+px\)[\s\S]{0,400}#flag-legend[\s\S]{0,200}position:\s*static/.test(src),
   '⚠️⚠️ E4 IT STOPS FLOATING ON A NARROW SCREEN. It lives in the dead margin ' +
   'beside a 960px container; below that width the margin does not exist and a ' +
   'fixed panel would sit ON TOP OF THE DATA');
ok(/Not scanned/.test(src) && /Scanned, clear/.test(src),
   '⚠️ E5 THE LEGEND NAMES THE UNSCANNED STATE EXPLICITLY. The distinction D3 ' +
   'enforces in markup is useless if the reader is not told it exists');
ok(/provisional/i.test(src), 'E6 the legend repeats that thresholds are provisional');
ok(/cannot be regraded/i.test(src),
   '⚠️⚠️ E7 THE LEGEND ADMITS THE SCAN\u2019S BLIND SPOT. gradeSprintsForDay() ' +
   'REFUSES rather than guesses on a drifted runCount, so a day it cannot grade ' +
   'shows no "Repeated F" — which reads identically to a clean day. An undisclosed ' +
   'false negative on a cheating check is worse than no check');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- F. THE SCAN IS ON DEMAND AND SAYS WHAT IT COSTS ---');
const scanFn = lift('scanForFlags');
ok(scanFn, 'F1 scanForFlags() exists');
// ⚠ ROADMAP 39 (Round 73) replaced the native confirm() with ttbConfirm(),
// which is AWAITED. ⚠⚠ THE `await` IS PART OF THE ASSERTION, NOT DECORATION:
// a modal is asynchronous, so an unawaited call returns a Promise — truthy —
// and the destructive action fires WITHOUT WAITING FOR THE ANSWER. That is
// the exact failure item 39 warns a half-converted page produces.
ok(scanFn && /await\s+ttbConfirm\(/.test(scanFn),
   '⚠️⚠️ F2 IT ASKS BEFORE IT SPENDS. This is the read-expensive half of ROADMAP ' +
   '36 and the only thing standing between it and the read explosion is that a ' +
   'human pressed a button knowing the cost');
ok(!/scanForFlags\(\)\s*;/.test(src.replace(/scanForFlags\(\)\s*\{[\s\S]*/, '')),
   '⚠️⚠️ F3 NOTHING CALLS IT AUTOMATICALLY. It must never run on load, on ' +
   'Generate, or on a timer — same discipline as the stuck scan and the grades ' +
   'panel: cheap when asked for, ruinous on a schedule');
ok(scanFn && /where\("date", ">="/.test(scanFn) && /where\("date", "<="/.test(scanFn),
   '⚠️ F4 ONE RANGE QUERY PER STUDENT, not one per student-day. A class of 25 ' +
   'over a week is 25 queries, not 175');
ok(scanFn && /querySelectorAll\('\.scan-cell'\)/.test(scanFn),
   '⚠️⚠️ F5 IT REPAINTS CELLS IN PLACE RATHER THAN RE-RENDERING THE TABLE. A ' +
   'renderTable() here would collapse every drill-down Jake has open, which is ' +
   'precisely the work this feature exists to save him');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- G. ROADMAP 32 — THE PER-RUN DELETE ---');
ok(/class="delete-run-btn"/.test(src), 'G1 the per-run delete button is rendered');
const handler = (() => {
    const at = src.indexOf("classList.contains('delete-run-btn')");
    return at < 0 ? null : src.slice(at, at + 5000);
})();
ok(handler, 'G2 it has a handler');
ok(handler && /data-run-id/.test(src) && /sprintIdentity\(sp\) === runId/.test(handler),
   '⚠️⚠️ G3 THE RUN IS IDENTIFIED BY IDENTITY, NEVER BY ARRAY INDEX. An index is ' +
   'stale the instant one run is removed, and the second click would delete a ' +
   'different run than the one under the cursor');
ok(handler && /findIndex/.test(handler) && !/\.filter\(sp => sprintIdentity/.test(handler),
   '⚠️ G4 IT REMOVES EXACTLY ONE. Two genuinely identical runs share an identity; ' +
   'a filter would silently delete both on one click');
ok(handler && /sprintCount/.test(handler) && /wpm:/.test(handler) && /accuracy:/.test(handler),
   '⚠️⚠️ G5 THE ROLLUP IS RECOMPUTED IN THE SAME WRITE. seconds/chars/wpm/accuracy/' +
   'sprintCount are summaries of the array; leaving them stale makes the session ' +
   'row and its own sprint list disagree — item 4\u2019s divergence signature, ' +
   'manufactured by the tool meant to clean up');
ok(handler && /recalcDailyLog/.test(handler),
   '⚠️ G6 THE DAY DOCUMENT IS RECALCULATED AFTERWARDS. typing_logs is the graded ' +
   'record and nothing else updates it');
ok(handler && /does NOT clear mastery/i.test(handler),
   '⚠️⚠️ G7 THE CONFIRM SAYS IT DOES NOT TOUCH MASTERY. ROADMAP 33 is unfixed; a ' +
   'teacher who deletes a run expecting a child to be unlocked will otherwise be ' +
   'quietly wrong, and the child stays locked out');
ok(handler && /only run in this session/i.test(handler),
   '⚠️ G8 DELETING THE LAST RUN OFFERS TO DELETE THE SESSION. A zero-run rollup ' +
   'is a ghost row the day recalculation ignores and the teacher cannot explain');

console.log('');
if (fail === 0) console.log(`PASS - ${pass} passing, 0 failing`);
else            console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
