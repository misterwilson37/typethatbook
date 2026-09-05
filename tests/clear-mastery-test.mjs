// clear-mastery-test.mjs v1.0.0 — ⚠️⚠️ CLEARING MASTERY UNDOES THE GATE, NOT THE HISTORY.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// ROADMAP 33. Jake: *"the poor kids who had me test mastery are now locked out
// of the earliest lessons when they're not the ones who tested out."* This is
// the only open item that was costing children something every day it stayed
// open, and the failure mode of getting it wrong is the same as the defect:
// a child silently unable to earn credit in a lesson they never passed.
//
// ⚠️⚠️ THE THING THIS FEATURE CANNOT DO, AND WHY IT IS A BUTTON. Deleting a
// session removes EVIDENCE. Mastery is not stored as evidence: `runScores[k]`
// is a CUMULATIVE SUM and `runGrades[k]` is best-ever-seen. Neither is a log,
// so neither can have one entry removed, and subtracting pointsForGrade() on
// delete would be arithmetic on a number that cannot be faithfully reversed —
// wrong, and wrong silently. Hence an explicit, auditable control.
//
// ⚠️ WHAT THIS HARNESS CANNOT CHECK: whether the Firestore writes are PERMITTED.
// That is firestore.rules v2.10.0 and needs the emulator — see
// firestore-rules.test.mjs, whose new cases are unexecuted for the same reason.
// This file pins the SEMANTICS of what gets cleared and what survives.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const src   = readFileSync(new URL('../reports.html', import.meta.url), 'utf8');
const gate  = readFileSync(new URL('../lesson-gate.js', import.meta.url), 'utf8');

function lift(text, name) {
    const at = text.indexOf('function ' + name + '(');
    if (at < 0) return null;
    const open = text.indexOf('{', at);
    let depth = 0;
    for (let i = open; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') { depth--; if (depth === 0) return text.slice(at, i + 1); }
    }
    return null;
}

console.log('--- A. THE THRESHOLD COPY MATCHES ITS AUTHORITY ---');
const uiPts   = /const MASTERY_POINTS_UI = (\d+)/.exec(src);
const realPts = /export const MASTERY_POINTS = (\d+)/.exec(gate);
ok(uiPts && realPts, 'A1 both constants are findable');
ok(uiPts && realPts && uiPts[1] === realPts[1],
   `⚠️⚠️ A2 reports.html's MASTERY_POINTS_UI (${uiPts && uiPts[1]}) EQUALS ` +
   `lesson-gate.js's MASTERY_POINTS (${realPts && realPts[1]}). reports.html imports ` +
   `no modules, so this is a second copy — the same Rule 9 acceptance as ` +
   `readLogTotals(). If they drift, the panel describes a gate the app is not ` +
   `applying, and a teacher clears a lock that was never set`);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- B. masteredRuns() LISTS WHAT BANKED THE POINTS ---');
const masteredRuns = new Function('MASTERY_POINTS_UI', 'return ' + lift(src, 'masteredRuns'))(+uiPts[1]);

ok(JSON.stringify(masteredRuns({ runScores: { '0': 4, '1': 2 } })) === '[0]',
   'B1 a run at the threshold is listed and one below it is not');
ok(JSON.stringify(masteredRuns({ runScores: { '0': 4, '2': 6 } })) === '[0,2]',
   'B2 several mastered runs come back in index order');
ok(JSON.stringify(masteredRuns({})) === '[]', 'B3 a record with no scores lists nothing');
ok(JSON.stringify(masteredRuns(null)) === '[]', 'B4 a null record does not throw');

// ⚠️ THE DISTINCTION THIS ASSERTION PROTECTS IS SUBTLE AND LOAD-BEARING.
// lesson-gate.js's runMastered(rec, k) is true when ANY run at index ≥ k has the
// points — mastered runs form a PREFIX, so run 0 reads as mastered the moment
// run 5 is. That is correct for "is this run in practice mode" and WRONG for
// "which runs did the student actually master", which is what the panel shows
// and what the button clears. Reusing runMastered() here would report every run
// of a lesson as mastered the instant its last run was.
ok(JSON.stringify(masteredRuns({ runScores: { '5': 4 } })) === '[5]',
   '⚠️⚠️ B5 A LATE MASTERED RUN DOES NOT MAKE THE EARLY ONES READ AS MASTERED. ' +
   'This is NOT runMastered() and must never be replaced by it');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- C. ⚠️⚠️ THE GATE IS CLEARED; THE HISTORY IS KEPT ---');
const clear = lift(src, 'clearMastery');
ok(clear, 'C1 clearMastery() exists');

ok(clear && /runScores:\s*deleteField\(\)/.test(clear) && /runLocks:\s*deleteField\(\)/.test(clear),
   '⚠️⚠️ C2 runScores AND runLocks ARE CLEARED TOGETHER. runLocks stamps when the ' +
   'threshold was crossed and feeds the reach-back clock; clearing the points ' +
   'alone unlocks the lesson while the clock still says the child proved something');

for (const keep of ['runGrades', 'runFires', 'runAttempts', 'runFailures']) {
    ok(clear && !new RegExp(keep + '\\s*:\\s*deleteField').test(clear),
       `⚠️ C3 ${keep} SURVIVES. The child earned those grades; what is being undone ` +
       `is the GATE, not the record. Erasing history here would make item 34's ` +
       `three-strikes tracking impossible after any cleanup`);
}

ok(clear && /deleteField\(\)/.test(clear) && !/runScores:\s*\{\}/.test(clear),
   '⚠️⚠️ C4 deleteField(), NEVER AN EMPTY MAP. An empty map is a VALUE: ' +
   'runScoreOf() would find no entry for the run and fall through to ' +
   'pointsForGrade(record.grade) — the legacy seed path — re-awarding points from ' +
   'the best-ever grade this button just declined to trust');

// The seed path this depends on, in the module that owns it.
ok(/return pointsForGrade\(record\.grade \|\| ''\);/.test(gate),
   '⚠️ C5 lesson-gate.js STILL SEEDS FROM record.grade WHEN runScores HAS NO ENTRY. ' +
   'C4 is only correct while this is true — if the seed is ever removed, re-read C4');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- D. ⚠️⚠️ THE GLOBAL CLOCK IS RE-DERIVED ---');
// lastLockDay is the reach-back window for the WHOLE curriculum. Clearing the
// lesson that happened to set it would leave the stamp pointing at a crossing
// that no longer exists, and reach-back would stay shut for every OTHER lesson —
// the same child, still locked out, by a different mechanism.
ok(clear && /lastLockDay/.test(clear),
   '⚠️⚠️ D1 lastLockDay IS TOUCHED AT ALL. Clearing a lesson without it leaves ' +
   'the child unlocked here and the global reach-back clock stale everywhere else');
ok(clear && /getDocs\(collection\(db, 'users', uid, 'lessonProgress'\)\)/.test(clear),
   '⚠️ D2 IT RE-READS THE WHOLE SUBCOLLECTION to find the surviving maximum');
ok(clear && clear.indexOf('updateDoc') < clear.indexOf('getDocs'),
   '⚠️⚠️ D3 THE RE-READ HAPPENS AFTER THE CLEARING WRITE. Deriving from the copy ' +
   'the panel loaded would include the lesson just cleared and put the stamp ' +
   'straight back — a no-op that looks like a fix');
ok(clear && /maxLock === null/.test(clear) && /lastLockDay: deleteField\(\)/.test(clear),
   '⚠️ D4 NO SURVIVING MASTERY REMOVES THE FIELD RATHER THAN WRITING 0. ' +
   'lastLockDayOf() falls back to lastAdvanceDay and then null; 0 is a real ' +
   'crossing on day zero, which is a different claim');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- E. IT TELLS THE TEACHER THE TRUTH ---');
// ⚠ ROADMAP 39 (Round 73) replaced the native confirm() with ttbConfirm(),
// which is AWAITED. ⚠⚠ THE `await` IS PART OF THE ASSERTION, NOT DECORATION:
// a modal is asynchronous, so an unawaited call returns a Promise — truthy —
// and the destructive action fires WITHOUT WAITING FOR THE ANSWER. That is
// the exact failure item 39 warns a half-converted page produces.
ok(clear && /await\s+ttbConfirm\(/.test(clear),
   'E1 it AWAITS a confirmation before writing');
ok(clear && /KEPT/.test(clear),
   '⚠️ E2 THE CONFIRM SAYS HISTORY IS KEPT. A teacher who thinks this erases ' +
   'grades will not use it on the child who needs it');
ok(clear && /reach-back clock is recalculated/i.test(clear),
   'E3 and that the global clock moves — it affects lessons other than this one');
ok(clear && /v2\.10\.0 has not\s*\n?\s*.*been deployed/i.test(clear.replace(/`/g, '')) ||
   (clear && /permission denied/i.test(clear)),
   '⚠️⚠️ E4 A DENIED WRITE NAMES THE RULES DEPLOY. Without v2.10.0 this button is ' +
   'silently denied for exactly the teachers it was widened for, and "nothing ' +
   'happened" is the least debuggable failure this project has');
ok(clear && /reach-back clock could not be/i.test(clear),
   '⚠️ E5 A FAILED RE-DERIVATION IS REPORTED, not swallowed. The lesson is ' +
   'unlocked and the clock is stale — a real state a human has to know about');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- F. THE CONTROL IS REACHABLE AND SCOPED ---');
ok(/class="clear-mastery-btn"/.test(src), 'F1 the button is rendered');
ok(/classList\.contains\('clear-mastery-btn'\)/.test(src), 'F2 it is wired');
ok(/r\.mastered\.length[\s\S]{0,200}clear-mastery-btn/.test(src),
   '⚠️ F3 IT ONLY APPEARS ON A LESSON THAT HAS MASTERY TO CLEAR. A button that ' +
   'does nothing on most rows trains the teacher to ignore it on the row where ' +
   'it matters');
ok(/data-lesson=/.test(src) && /data-uid=/.test(src),
   'F4 it carries both the student and the lesson it acts on');

console.log('');
if (fail === 0) console.log(`PASS - ${pass} passing, 0 failing`);
else            console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
