// anon-ladder-test.mjs v1.0.0 — the guest login ladder, and the two coalescing
// guards that guest mode depends on.
//
// ⚠️ WHY THIS EXISTS. Round 9 merged two guest-login ladders in game.js and
// rebuilt a third in learn.js, and the existing 17 harnesses cover none of it —
// they all passed, unchanged, against every intermediate state of this round
// including the broken ones. A green suite says the code agrees with whatever
// the suite already tested.
//
// ⚠️ TWO KINDS OF ASSERTION IN HERE, AND THEY ARE NOT WORTH THE SAME.
//   BEHAVIOURAL — anonNudgeDue() is extracted from game.js and actually run.
//                 These test the code.
//   STRUCTURAL  — the call-site and guard checks read source text. They test
//                 that a specific line still looks a specific way, which is
//                 weaker: a refactor can keep the behaviour and fail these, or
//                 change the behaviour and pass them. They are here because the
//                 two defects they guard (double-counted seconds, a shared
//                 failure) are invisible at runtime and expensive in class.
//                 Treat a structural failure as "go read that function", not
//                 as proof of a bug.
//
// Run: node anon-ladder-test.mjs   (or via run-all-tests.mjs)

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const failures = [];
function ok(cond, label) {
    if (cond) { pass++; }
    else { fail++; failures.push(label); }
}

const game  = readFileSync(new URL('./game.js', import.meta.url), 'utf8');
const learn = readFileSync(new URL('./learn.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('./index.html', import.meta.url), 'utf8');

// ── Extract anonNudgeDue() from game.js and run it for real ──────────────────
function extractFn(src, name) {
    const start = src.indexOf(`function ${name}(`);
    if (start < 0) return null;
    let i = src.indexOf('{', start), depth = 0;
    for (let j = i; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
    }
    return null;
}

const dueSrc = extractFn(game, 'anonNudgeDue');
ok(!!dueSrc, 'game.js still defines anonNudgeDue()');
// Rebuild it with controllable module state. ANON_NUDGE_1/2 are read from the
// file rather than hardcoded here, so retuning the rungs does not silently
// invalidate the test — but the RELATIONSHIP between them is asserted below.
const N1 = Number((game.match(/const ANON_NUDGE_1 = (\d+)/) || [])[1]);
const N2 = Number((game.match(/const ANON_NUDGE_2 = (\d+)/) || [])[1]);
ok(Number.isFinite(N1) && Number.isFinite(N2), 'both rung constants parse as numbers');
ok(Number.isFinite(N1) && Number.isFinite(N2) && N1 < N2, 'rung 1 comes before rung 2');
ok(N1 === 60 && N2 === 300, `rungs are 60s and 300s as specified (got ${N1}, ${N2})`);

// ⚠️ Degrades to a reported failure rather than a crash. The first draft of
// this harness threw a ReferenceError against the pre-round file, which IS a
// failure but hides the other 33 assertions behind a stack trace — and the
// whole point of running it against old code is finding out which parts it
// catches. A harness that cannot survive the thing it is testing being absent
// tells you less than one that can.
const makeDue = (shown, user) => {
    if (!dueSrc) return () => 'NO-SUCH-FUNCTION';
    const fn = new Function('currentUser', 'anonNudgeShown', 'ANON_NUDGE_1', 'ANON_NUDGE_2',
        `${dueSrc}; return anonNudgeDue;`);
    return fn(user, shown, N1, N2);
};

// Rung 1
ok(makeDue(0, null)(0)        === 0, 'a guest with no typing is not prompted');
ok(makeDue(0, null)(N1 - 1)   === 0, 'one second short of rung 1 does not prompt');
ok(makeDue(0, null)(N1)       === 1, 'rung 1 fires exactly at the threshold');
ok(makeDue(0, null)(N2 + 999) === 1, 'a guest who blew past both rungs still gets rung 1 first');

// Rung 2
ok(makeDue(1, null)(N1)       === 0, 'rung 1 does not fire twice');
ok(makeDue(1, null)(N2 - 1)   === 0, 'one second short of rung 2 does not prompt');
ok(makeDue(1, null)(N2)       === 2, 'rung 2 fires exactly at the threshold');

// ⚠️ The point of the whole design: there is no third prompt, ever.
ok(makeDue(2, null)(N2 * 10)  === 0, 'THERE IS NO THIRD PROMPT — a child who declined twice has decided');

// Signed-in students are never prompted; anonymous-auth users would be treated
// as guests if that toggle is ever flipped.
ok(makeDue(0, { uid: 'u1', isAnonymous: false })(N2) === 0, 'a signed-in student is never prompted');
ok(makeDue(0, { uid: 'a1', isAnonymous: true })(N1)  === 1, 'an anonymous-auth user counts as a guest');

// ── STRUCTURAL: the double-count trap at the sprint boundary ─────────────────
//
// pauseGameForBreak() folds sprintSeconds into anonTotalSeconds and does NOT
// zero sprintSeconds — startGame() does, later. So at the boundary the live
// total is anonTotalSeconds ALONE. Passing anonTotalSeconds + sprintSeconds
// there counts the sprint twice and moves rung 2 to roughly 4:30 on a
// 30-second sprint: a ladder that fires early, which nobody reports.
const boundary = game.match(/const anonDue = anonNudgePending \|\| anonNudgeDue\(([^)]*)\)/);
ok(!!boundary, 'the sprint-boundary call site is still recognisable');
ok(boundary && boundary[1].trim() === 'anonTotalSeconds',
   'boundary passes anonTotalSeconds ALONE — adding sprintSeconds double-counts');

// The tick, by contrast, runs mid-sprint where the fold has not happened yet,
// so there the live total genuinely is the sum.
const tick = game.match(/const due = anonNudgeDue\(([^)]*)\)/);
ok(!!tick, 'the tick call site is still recognisable');
ok(tick && tick[1].replace(/\s/g, '') === 'anonTotalSeconds+sprintSeconds',
   'tick passes the sum — mid-sprint the fold has not happened yet');

// ── STRUCTURAL: the old ladder is gone, not merely bypassed ──────────────────
ok(!/function showAnonInfiniteReminder/.test(game),
   'showAnonInfiniteReminder() is deleted, not left orphaned');
ok(!/location\.reload\(\)[\s\S]{0,200}retroactive/i.test(game) &&
   !/anonInfiniteReminders/.test(game.replace(/^\/\/.*$/gm, '')),
   'no live reference to the deleted ladder state survives outside comments');
ok(!/\blet anonSprintCount\b/.test(game),
   'anonSprintCount is deleted — it was the trigger half that no longer exists');
ok(!/\blet anonPromptShown\b/.test(game) && !/\blet anonPromptShown\b/.test(learn),
   'the one-shot boolean is gone from both files');

// ⚠️ The expensive half of the old divergence: one ladder saved the guest's
// work on sign-in and the other threw it away. There must now be exactly one
// sign-in path, and it must be the one that saves.
const signInCalls = (game.match(/signInWithPopup\(auth, new GoogleAuthProvider\(\)\)/g) || []).length;
ok(signInCalls <= 3, `sign-in entry points are bounded (found ${signInCalls})`);
ok(/showAnonLoginPrompt\(rung\)/.test(game),
   'the surviving prompt takes a rung rather than being two functions again');

// ── STRUCTURAL: both ladders share one persisted key ─────────────────────────
ok(/ttb_anonNudge_v2/.test(game) && /ttb_anonNudge_v2/.test(learn),
   'game.js and learn.js share the daily ladder key — one child, one ladder');
ok(!/ttb_anonInfiniteReminders/.test(game),
   'the old key is not read — its counts meant different rungs');

// ── STRUCTURAL: learn.js arms on the tick, fires at the boundary ─────────────
// Firing mid-run mattered because the dismiss handler calls beginStep(), which
// restarts the run from zero: declining the prompt destroyed the typing the
// prompt was praising.
ok(/armAnonLoginPrompt\(\);\s*\/\/ fires at the run boundary/.test(learn),
   'learn.js tick arms rather than fires');
ok(/function checkAnonLoginPrompt\(\)[\s\S]{0,400}anonNudgePending = 0;/.test(learn),
   'learn.js consumes the pending rung at the boundary');

// ── BEHAVIOURAL-ish: failures are not shared by the coalescing guards ────────
//
// Both fixes have the same shape, so both are checked the same way: the early
// return must be conditional on a success flag, never a bare `return promise`.
for (const [name, src, flag] of [
    ['learn.js loadLessons', learn, '_lessonsOk'],
    ['index.html loadBooks', index, '_booksOk'],
]) {
    ok(new RegExp(`if \\(${flag}\\) return;`).test(src),
       `${name}: a shared attempt is only adopted when it succeeded`);
    ok(!/return _lessonsInFlight;/.test(src) && !/return _booksInFlight;/.test(src),
       `${name}: no bare "return theInFlightPromise" — that is the bug being fixed`);
    ok(new RegExp(`${flag} = allLessons\\.length > 0|${flag} = allBooks\\.length > 0`).test(src),
       `${name}: an empty result is treated as a failure a retry might fix`);
}

// ── Report ───────────────────────────────────────────────────────────────────
if (fail) {
    console.log(`\nanon-ladder-test: ${pass} passed, ${fail} FAILED`);
    failures.forEach(f => console.log('   ✗ ' + f));
    process.exit(1);
}
console.log(`anon-ladder-test: all ${pass} assertions pass`);
