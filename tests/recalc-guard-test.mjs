// recalc-guard-test.mjs v1.0.0 — Round 21 (Hammond).
//
// ⚠️ THE ⟳ BUTTON IS THE ONLY DESTRUCTIVE CONTROL IN reports.html REACHABLE IN
// ONE CLICK, AND UNTIL v2.23.0 IT HAD NO LIMIT ON HOW FAR DOWN IT COULD MOVE A
// DAY. recalcDailyLog() rewrites the stored log to whatever the session records
// sum to; `allowZero` only ever blocked the EMPTY case.
//
// ⚠️ THE SESSION RECORD IS NOT A SUPERSET OF THE DAY COUNTER. Real evidence,
// 2026-08-19: one student's Library day reads 12m 4s / 1,890 chars in the log
// against a SINGLE 3m 47s / 521-char rollup — and the log is the figure that
// matches what the child actually did (1,890 chars in 12m 4s is ~31 WPM, which
// agrees with the 28 WPM the one surviving rollup measured). One click would
// have written 3m 47s over eight minutes of real work, and the student's own
// screen would have changed with it, because the HUD reads that same document.
//
// Sessions go missing three known ways: a sprint under the five-second floor is
// never written, a sprint that never closes is never pushed, and a failed upload
// leaves the day counter ahead of the record.
//
// ⚠️ WHAT THIS HARNESS CANNOT DO: drive confirm(). It asserts the DECISION —
// which moves are silent, which must be confirmed, and which callers are exempt.
// The dialog text and the updateDoc call are checked by grep, not behaviour.
//
// Run: node tests/recalc-guard-test.mjs

import { readFileSync } from 'node:fs';

let failures = 0, checks = 0;
const eq = (label, got, want) => {
    checks++;
    if (got !== want) { failures++; console.log(`  FAIL ${label}\n         got ${got}, want ${want}`); }
    else console.log(`  ok   ${label}`);
};

const src = readFileSync(new URL('../reports.html', import.meta.url), 'utf8');

// ─── A. the constant and the wiring are actually in the shipped file ─────────
console.log('\n── A. the guard exists in reports.html ──');
{
    const m = src.match(/const\s+DROP_GUARD_RATIO\s*=\s*([0-9.]+)/);
    eq('A1 DROP_GUARD_RATIO is declared', !!m, true);
    const ratio = m ? parseFloat(m[1]) : null;
    eq('A2 it is a fraction below 1 (a floor on how far down ⟳ may go)',
       ratio !== null && ratio > 0 && ratio < 1, true);

    eq('A3 recalcDailyLog accepts an expectDrop option',
       /recalcDailyLog\([^)]*expectDrop\s*=\s*false/s.test(src), true);

    // ⚠️ THE DELETE PATH MUST BE EXEMPT. Removing a rollup is SUPPOSED to shrink
    // the day; guarding it would ask the teacher to confirm the thing they just
    // did, and a dialog people learn to dismiss protects nothing.
    eq('A4 the delete-session path passes expectDrop: true',
       /allowZero:\s*true,\s*expectDrop:\s*true/.test(src), true);

    // The manual button takes no options, so it gets the guard by default.
    eq('A5 the manual ⟳ handler still calls recalcDailyLog with no options',
       /await recalcDailyLog\(idx, li, uid, date\);/.test(src), true);

    // ⚠️ THE STUDENT-FACING CONSEQUENCE MUST BE IN THE DIALOG. A teacher deciding
    // whether to overwrite a child's minutes has to know the child sees them.
    eq('A6 the dialog says the student sees this number',
       /student sees this same number/.test(src), true);

    eq('A7 a declined drop returns without writing',
       /reason:\s*'drop-declined'/.test(src), true);
}

// ─── B. the decision itself ─────────────────────────────────────────────────
console.log('\n── B. which moves are silent and which must be confirmed ──');
{
    const RATIO = parseFloat(src.match(/const\s+DROP_GUARD_RATIO\s*=\s*([0-9.]+)/)[1]);

    // Lifted decision, mirroring the shipped condition exactly.
    const needsConfirm = (stored, sessions, expectDrop = false) =>
        !expectDrop && stored > 0 && sessions < stored * RATIO;

    // Jake's 2026-08-19 student: 13m 33s stored, 13m 27s in sessions. A real
    // 6-second correction and exactly the kind that should not nag anyone.
    eq('B1 a 6-second correction on a 13-minute day is SILENT',
       needsConfirm(813, 807), false);

    // The Library student: 12m 4s stored against a single 3m 47s rollup.
    eq('B2 a 12m4s day collapsing to a single 3m47s rollup is CONFIRMED',
       needsConfirm(724, 227), true);

    // ⚠️ THE CASE THE OLD CODE ALLOWED WITHOUT A WORD.
    eq('B3 15m32s collapsing to 5m36s is CONFIRMED',
       needsConfirm(932, 336), true);

    eq('B4 an UPWARD move is never guarded', needsConfirm(336, 932), false);
    eq('B5 an exactly equal recalc is silent', needsConfirm(807, 807), false);

    // ⚠️ ZERO IS THE MOST DESTRUCTIVE OUTCOME AVAILABLE and it must be confirmed
    // like any other drop. `allowZero` governs whether an EMPTY QUERY is allowed
    // to proceed at all; it is not permission to wipe a day that has one.
    eq('B6 a drop to zero is CONFIRMED', needsConfirm(724, 0), true);

    // A day the report has no stored figure for cannot lose anything.
    eq('B7 a day stored as zero is never guarded', needsConfirm(0, 500), false);

    // The delete path.
    eq('B8 deleting a rollup shrinks the day WITHOUT a dialog',
       needsConfirm(724, 227, true), false);

    // Boundary.
    const stored = 1000;
    eq('B9 exactly at the ratio is silent',   needsConfirm(stored, stored * RATIO), false);
    eq('B10 one second below the ratio is CONFIRMED',
       needsConfirm(stored, Math.floor(stored * RATIO) - 1), true);
}

console.log('');
if (failures) {
    console.log(`FAIL — ${failures} of ${checks} checks failed.`);
    process.exitCode = 1;
} else {
    console.log(`All ${checks} checks pass.`);
    console.log('');
    console.log('⚠️ THE GUARD ASKS; IT DOES NOT DECIDE. A teacher who confirms can');
    console.log('   still overwrite real work. It exists so that destroying a');
    console.log('   child\'s minutes takes a deliberate yes instead of one click.');
}
