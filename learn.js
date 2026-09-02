// learn.js v2.43.0
//
// v2.43.0 — ⚠️⚠️ ROADMAP 9: THE DAY ROLLOVER IS NO LONGER TICK-ONLY. The twin of
//           game.js v3.47.0(a), and it must stay the twin. The rollover fired
//           only on a COUNTED SECOND, so a tab that woke on a new day and
//           flushed — without the student typing — worked from yesterday's day
//           counters while _flushStatsInner() stamped its document with today's
//           date. The block is now rollDayIfNeeded(), moved VERBATIM, with the
//           tick calling it at exactly the point the block used to occupy, so
//           the ordering constraints this file spent Round 6 getting right hold
//           by construction: above the increments, above `anonSecondsAccum++`,
//           above `armAnonLoginPrompt()`. Two new callers: the existing
//           visible-half visibilitychange handler, and _flushStatsInner()'s top.
//           ⚠️ ABOVE THE `!currentUser` GUARD ON PURPOSE. A guest tab goes stale
//           the same way, and the roll needs no account — it writes localStorage
//           and zeroes memory. That guard is about who may write to Firestore.
//           ⚠️ ROADMAP 9 RECORDS THAT THESE TWO TICK LOOPS HAVE ALREADY DRIFTED
//           ONCE ON THIS EXACT PATH. midnight-test.mjs v1.1.0 Part B2 asserts
//           that BOTH files have more than one caller, so a fix applied to one
//           file and forgotten in the other goes red.
//
// v2.42.0 — ⚠️⚠️⚠️ ROADMAP 43 — AN EMPTY PROGRESS CACHE WAS LOCKING
//           STUDENTS OUT OF THE WHOLE CURRICULUM. `refreshProgressCache()` wrote
//           whatever `userProgress` held with no check that it had been read,
//           and `loadUserProgress()` sets it to `{}` then AWAITS a network round
//           trip. A flush inside that window — an ordinary tab switch —
//           persisted the empty map; `{}` then passed the `typeof === 'object'`
//           cache-hit test on the next load, Firestore was never consulted, and
//           isUnlocked() offered lesson one and nothing else for up to eight
//           hours, re-stamping its own TTL while the student worked. ⚠️ THE
//           SERVER RECORD WAS NEVER TOUCHED and neither was their time, which is
//           why it presented as lost lesson progression with intact minutes.
//           Two halves: a uid-keyed load-state guard on the write side, and
//           empty-is-a-MISS on the read side, which SELF-HEALS every already
//           poisoned cache on the student's next page load — no console needed,
//           which matters because students do not have one.
//           ⚠️ v2.34.0 ARCHIVED THIS ROUND (8-entry budget).
//           tests/progress-cache-test.mjs.
//
// v2.41.0 — ⚠️ ROADMAP 31 — THE IDLE SPACE-SKIP LEFT THE SPACE BAR LIT. The
//           idle-resume skip in handleDrillKey() advanced drillPos past a space
//           and never repainted, so the keyboard kept showing the space target
//           — thumb circles and #space-hint — while the game already expected
//           the first letter of the next word. Kids reported it and photographed
//           it; it only fires after a LEARN_IDLE_THRESHOLD (3s) pause landing on
//           a space, which is why it reads as intermittent and never reproduces
//           for a teacher on demand. One advanceHandGuide() call, guarded on
//           drillPos having actually moved. ⚠️ NOTHING ELSE CHANGED — no
//           threshold, no timing, no scoring. tests/drill-paint-test.mjs asserts
//           the INVARIANT (every drillPos mutation is followed by a paint), not
//           this call site, because guarding the line leaves the next one open.
//           ⚠️ v2.33.1 ARCHIVED THIS ROUND (8-entry budget) — its two citations
//           in this file resolve to CHANGELOG.md § ARCHIVED FILE HEADERS now.
//
// v2.40.0 — ⚠️⚠️ ROADMAP 6, THE SCHOOL HALF — THE MIDNIGHT STRADDLE. Library was
//           fixed in game.js v3.38.0; School had the same defect and kept it for
//           several rounds because the fix is NOT a one-liner here. A lesson
//           straddling midnight filed ONE record stamped with the day it ENDED
//           on, so the day counters and the drill-down disagreed — neither wrong,
//           answering different questions.
//
//           ⚠️⚠️ THE ROLLOVER MOVED ABOVE THE INCREMENTS AND THAT IS HALF THE FIX.
//           This file incremented stepSeconds BEFORE its rollover check and
//           compensated by resetting counters to `1` rather than `0`. That worked
//           for the COUNTERS and could not work for the LOG: by the time the
//           rollover ran, the second was already in a stepSeconds that
//           logOpenRun() was about to file under the new day. The block now sits
//           above `learnActiveSeconds++`, above `anonSecondsAccum++` and above
//           `armAnonLoginPrompt()`, and every `= 1` is back to `= 0`.
//           ⚠️ ONE LINE LOWER AND THE FIRST SECOND OF EACH NEW DAY IS FILED UNDER
//           YESTERDAY, invisibly, forever. midnight-test.mjs D5/D6 assert the
//           ordering; D7–D9 assert the compensations are gone. Mutation-verified.
//
//           `logRun()` and `logOpenRun()` take a `dateOverride` for exactly one
//           caller — the rollover — and default to today for every other.
//           ⚠️ THE 5-SECOND FLOOR STILL APPLIES, as in game.js: a run begun at
//           11:59:58 has 2 seconds to close, the floor refuses them, and the
//           watermark is NOT advanced, so they roll into the first record of the
//           new day rather than vanishing.
//
// v2.39.0 — ⚠️⚠️ ROADMAP 23 — THE RUN LIST IS NOW PAIRED WITH THE LESSON, AND
//           THE TWO WRITERS ASSERT IT. The Round 41 defect was possible because
//           four writers read `currentLesson` and NONE checked that
//           `currentRuns` still belonged to it — and the symptom was a GRADE on
//           a child's record, not an error. `remediationRun` (v2.36.0) guards
//           the one detour that breaks the pairing today; this guards the SHAPE,
//           so the next feature that swaps the run list fails loudly.
//           `currentRunsFor` is set at EVERY site that assigns `currentRuns`
//           (startLesson, the remediation detour, and the exit reset), and
//           recordRunOutcome() / saveProgress() refuse when it does not match.
//
//           ⚠️ THE ROADMAP PROPOSED COMPARING buildRunList() LENGTHS AND THAT
//           WOULD HAVE BEEN WRONG TWICE: buildSequence() is RANDOM per call for
//           key_random / key_pattern_auto, so recomputing invites a false
//           positive — and a false positive here REFUSES A REAL RUN, which is
//           silent data loss and strictly worse than the hazard. It also passes
//           any swap that happens to produce the same run count, which the
//           remediation drill on a 3-chunk lesson would. A pairing token answers
//           the real question in O(1) with no recomputation.
//
//           ⚠️ IT CANNOT FIRE TODAY — finishStep() returns at the remediation
//           branch before either writer. That is the point: it is a backstop for
//           a hazard that has already cost one round, not a fix for a live bug.
//           tests/exit-flush-test.mjs Section G drives it (7 assertions,
//           mutation-verified: removing the guard fails G2/G3/G4/G7, and
//           accepting a falsy token fails G6).
//
// v2.38.0 — ROADMAP item 24, the writer half — TWIN OF game.js v3.46.0.
//           `sessionLogInit()` now passes `doc` and `setDoc` (both already
//           imported from read-meter.js for other writes) alongside the
//           existing four dependencies, so session-log.js v1.7.0's
//           idempotent flush has what it needs on this page. ⚠️ THIS MUST
//           LAND IN THE SAME ROUND AS game.js's call — session-log.js's own
//           header says the two must agree, and session-merge-test.mjs Part C
//           checks it. Nothing else in this file changed; the fix lives
//           entirely in session-log.js. See its v1.7.0 entry and HANDOFF
//           §0.-36 for the full trace. ⚠️⚠️ SHIPS WITH firestore.rules v2.8.0
//           — do not deploy this without it.
//           ⚠️ v2.32.0 ARCHIVED THIS ROUND (8-entry budget) — its citations
//           throughout this file resolve to CHANGELOG.md § ARCHIVED FILE
//           HEADERS now.
//
// v2.37.0 — ⚠️⚠️ ROADMAP 25 — "I'M DONE" STAMPED A CHILD A RECEIPT SHORTER THAN
//           THE HUD THEY HAD BEEN WATCHING. 9:31 against 10:02, the gap being
//           exactly the run they were mid-way through. handleImDone() did
//           everything right — logOpenRun('done'), then `await flushStats('done',
//           true)` — but `final` was NEVER READ by the flush gate, so the flush
//           returned having written nothing and the receipt read a typing_logs it
//           had not touched. ⚠️ THE TICK INCREMENTS secondsToday AND DOES NOT SET
//           learnDirty; only saveStats() does, at RUN BOUNDARIES — so the flag was
//           false for the entire window in which a child presses this button.
//           ⚠️⚠️ A TWIN DIVERGENCE WHERE THE SIBLING WAS ALREADY CORRECT: game.js
//           gates on `!walDirty && !final && queued === 0`. Library forced the
//           write; School skipped it — and both carry comments swearing they are
//           identical in shape. IDENTICAL IN SHAPE IS NOT IDENTICAL IN BEHAVIOUR.
//           tests/im-done-test.mjs drives BOTH files.
//           ⚠️ EVERY HEADER ENTRY WAS CITED IN LIVE CODE, so v2.31.0 went to
//           CHANGELOG.md's archive rather than an uncited one; its citations
//           resolve there.
//
// v2.36.0 — ⚠️⚠️ A REMEDIATION DRILL WAS BEING GRADED AS A RUN OF THE LESSON.
//           "🎲 Practice missed keys" replaces currentRuns with a synthetic
//           key_random drill and deliberately leaves currentLesson alone, so
//           everything downstream read it as the lesson's run 1: logRun() filed
//           a sprint under the lesson's id, recordRunOutcome() banked mastery
//           points into runScores["0"] and wrote runCount: 1 over a 12-run
//           lesson's count, and saveProgress() marked the WHOLE LESSON passed.
//           ⚠️ AND key_random IS ACCURACY-ONLY, so a clean 83-character random
//           drill scored A🔥 and unlocked the next lesson. remediationRun now
//           branches ABOVE the isLastRun fork — both modals write, so a guard in
//           one still grades a multi-chunk drill. ⚠️ THE MINUTES STILL COUNT, in
//           BOTH records: this is NOT ROADMAP 10's practice run, and suppressing
//           them would manufacture item 4's divergence. tests/remediation-test.mjs.
//           ⭐ ROADMAP 15 — runGrades/runFires store the grade WHERE IT IS
//           EARNED (runScores is a SUM and cannot tell one A🔥 from two A's), and
//           the grade rule moved to run-grade.js so reports.html can reconstruct
//           without a second copy of it. Rule 9: the copies here are DELETED.
//
import { db, auth, ADMIN_EMAILS, isStaffUser } from "./firebase-config.js";
// ROADMAP item 10 — the lesson-farming gate. ⚠️ PURE MODULE, NO FIRESTORE: every
// rule in it is a function of numbers this file passes in, which is why the whole
// design is covered by lesson-gate-test.mjs without driving a browser.
import { activeDayPlan, activeDayCountOf, fireCountOf, isMastered,
         lessonModeFor, runModeFor, runScoreOf, runMastered, pointsForGrade,
         lastLockDayOf, furthestIndexOf, reachBackFor,
         MASTERY_POINTS, MASTERY_FIRE_COUNT, REACH_BACK_DAYS } from "./lesson-gate.js";
// ROADMAP item 15 — the grade rule. ⚠️ PURE MODULE, AND THE ONLY COPY: every
// function below used to live in this file, and reports.html needed all of them
// to reconstruct a grade. Two copies of calculateGrade() is the shape Rule 9
// forbids, so the copies here were DELETED in the same deploy that added this
// import. ⚠️ gatesForRun() TAKES THE LESSON'S GATES AS AN ARGUMENT now — the
// old one read `currentLesson` out of module scope, which is what made it
// impossible to call from anywhere else.
import { calculateGrade, gradeAdvances, gatesForRun, betterGrade,
         chunkSequence, DRILL_TYPES, FIRE_GRADE, GRADE_ORDER,
         REACH_HOME_COMPANION, CHUNK_TARGET, CHUNK_SLACK,
         RUN_GRADE_VERSION } from "./run-grade.js";
// The day/week counters' WAL, shared with game.js. It is a separate module
// because the counters are the one piece of state that is true regardless of
// which page or which book a student is on, and both previous copies of it were
// scoped to something narrower than that. See stats-wal.js for the bug.
import {
    statsWalSave, statsWalRecover,
    guestAccumSave, guestAccumLoad, guestAccumClear
} from "./stats-wal.js";
// The sprint/run history queue, shared with game.js. ⚠️ THIS FILE HAD NO SESSION
// LOGGING OF ANY KIND BEFORE v2.6.0 — see the header. A run is the lesson-mode
// equivalent of a sprint: a bounded stretch of typing with a duration, a
// character count and a derived WPM, which is exactly what the module stores.
import {
    sessionLogInit, sessionLogPush, sessionLogFlush, sessionLogPending,
    sessionLogAdopt, sessionLogTake, GUEST_QUEUE_UID,
} from "./session-log.js";
// The time readout, shared with game.js. ⚠️ Both pages render the SAME string in
// the SAME element id — see hud.js for why that is the whole point.
import { hudStrings, HUD_VERSION, hudCacheSave, hudCacheLoad,
         celebrationDone, celebrationMark, fmt } from "./hud.js";
// ⚠️ v2.26.0 — THE "copied from game.js" BLOCK IS GONE, and its header said so
// in as many words for months. celebrate.js owns the celebrations; School and
// Library now show the SAME one. Do not copy it back.
// showGoalToast is intentionally NOT imported: celebrate.js raises its own
// toast as part of each celebration. It stays exported there for any future
// caller that wants the banner without the animation.
import { launchConfetti, launchFireworks } from "./celebrate.js";
import { showReceipt } from "./receipt.js";
// ⚠️ ROADMAP 0b. The reading-font model MOVED here from this file in v2.28.0 —
// there is no local copy left and there must not be a new one. `openMenuModal()`
// in game.js is deliberately NOT imported: it reaches into book, chapter, sprint
// and view state School has none of. This module is its shape, not its body.
import { openSettingsPanel, buildSettingsButton, applyDrillFont, readDrillFont,
         SETTINGS_PANEL_VERSION } from "./settings-panel.js";
// ⚠️ HANDOFF §0.0 — the student now reads the GRADED document. See daylog.js.
// ⚠️ readDaySessions/projectDayTotal deliberately NOT imported — v2.19.0
// reverted the projection. See HANDOFF §0.0.
import { readWeek, invalidateWeek, applyWeekToStats, dayLogPayloadFor, SOURCE_SPLIT_CUTOVER, DAYLOG_VERSION,
         carryOverPlan, carryOverPayloadFor, sourceTotalsOf } from "./daylog.js";
import { qualifyingChars, VARIETY_FLOOR_VERSION } from "./variety-floor.js";
// ⚠️ v2.23.0 — THE DRILL TEXT FILTER. A student reported "ass" in a lesson.
// Whole-group matching on Jake's ruling: `lass`, `mass` and `asse` are FINE.
// See drill-filter.js's header — it holds the ruling and its edge cases.
import { safeGroup, DRILL_FILTER_VERSION } from "./drill-filter.js";
// The version footer's three primary reads (this html file, this js file's own
// LEARN_VERSION, style.css) plus the lazy full-build panel on hover. ⚠️ SAME
// STRUCTURE AS game.js, ON PURPOSE — see updateVersionFooter() below.
import { noteDay, ensureSince } from "./logdays.js";
import { readOneDeployedVersion, readDeployedVersions, renderBuildList,
         countBuildNotes, renderHiddenNotesLine,
         readAppliedCssVersion } from "./versions.js";
import {
    collection, getDocs, query, where, doc, getDoc, setDoc, addDoc, deleteDoc,
    // Aggregation query. Firestore bills getCountFromServer at ONE read per up
    // to 1000 matched index entries, which is what makes the lessons cache
    // validation cost 1 read instead of ~80. Available since SDK v9.11.
    getCountFromServer,
    // v3.46.0 — for logdays.js's ledger write. See the noteDay() call in the
    // flush path below and the ordering rule in logdays.js's header.
    updateDoc, arrayUnion,
    // v2.7.1 — for session-log.js's `serverAt` and nothing else. ⚠️ Do not reach
    // for it in flushStats(): a sentinel inside the typing_logs or
    // typing_logs merge writes would be a second dating scheme on the
    // two documents Round 12 spent a day getting to agree.
    serverTimestamp
} from "./read-meter.js";
import {
    onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    FINGER_COLORS, FINGER_NAMES, LAYOUTS, KB_VERSION,
    createKeyboard, buildFingerMap, getFingerInfo,
    createHandGuide, buildFingerSVG, setHandGuideToChar, setHandGuideToChars,
    resetHandGuideToHome, colorKeyboardKeys, flashFingerPressed,
    getHomePositions, getKeyCenterInKB, toggleKeyboardCase
} from "./keyboard.js";

// ─── Constants ────────────────────────────────────────────────────────────────
// ⚠️ THIS LINE IS THE VERSION — the comment at the top of the file is decoration.
// versions.js parses THIS, the footer renders THIS, and ROADMAP's verification
// steps tell Jake to read THIS. It sat at "2.23.1" across five releases. Bump it
// in the SAME EDIT as the header entry above, always.
// tests/version-stamp-test.mjs now fails the suite if you do not.
const LEARN_VERSION = "2.43.0";

// Hand the shared session queue its Firestore surface, once, at module scope.
// session-log.js imports no SDK of its own on purpose — see that file.
//
// ⚠️ THIS LINE MUST MATCH game.js's. Both page controllers configure the same
// shared module, and a dependency passed on one side and not the other means
// School and Library write differently shaped documents — which is the R2
// symmetry failure DESIGN-TELEMETRY.md exists to prevent, in its smallest
// possible form. session-merge-test.mjs Part C asserts the two calls agree.
//
// v2.38.0 — `doc` and `setDoc` join the surface; session-log.js v1.7.0
// requires them. See game.js v3.46.0's identical note.
sessionLogInit({ db, collection, addDoc, doc, setDoc, serverTimestamp });

// ⚠️ v2.31.0 — imported from firebase-config.js. ⚠️ TWIN OF game.js AND THE
// REASON FOR THE MOVE: this file and game.js each carried their own copy, so
// the two student pages could disagree about who is staff. Same name, same
// three call sites; new code should prefer isStaffUser().

// Game Genie state (admin only, session-scoped)
let ggAllowMistakes = false;
let ggBypassIdle    = false; // bump z every deploy to confirm cache cleared
const LAYOUT = localStorage.getItem('keyboardLayout') || 'qwerty';
const INTRO_ANIM_MS   = 1400;   // ms per animation frame (home ↔ reach)

// ─── State ────────────────────────────────────────────────────────────────────
let currentUser = null;
let allLessons   = [];   // sorted lesson objects from Firestore
let userProgress = {};   // lessonId → progress doc

// Guest session tracking — accumulates until sign-in.
//
// ⚠️ v2.4.0: THIS SURVIVES THE TAB NOW. It used to be two plain module
// variables that died on close, so a student who typed for twenty minutes
// signed out, closed the tab, and signed in third period got credited nothing.
// The login ladder told them their work wasn't being saved, which made it
// honest but did not make it good — we could have kept it and chose not to.
//
// Restored from localStorage by restoreGuestAccum(), which runs at init and is
// date-guarded: yesterday's guest minutes are dropped, never rolled into
// today's count. A teacher's daily report is the one number that has to mean
// exactly what it says.
let anonSecondsAccum      = 0;
let anonLessonProgress    = {};

// Persist on a cadence, not on every tick — one localStorage write per second
// per student is free-ish but pointless. The tick calls this; so do the
// visibilitychange and beforeunload handlers, which are the moments that
// actually matter.
const GUEST_ACCUM_SAVE_EVERY = 10;   // seconds of active typing
function persistGuestAccum() {
    if (currentUser && !currentUser.isAnonymous) return;
    guestAccumSave(getLocalDateStr(), anonSecondsAccum, anonLessonProgress);
}
function restoreGuestAccum() {
    const g = guestAccumLoad(getLocalDateStr());
    if (!g) return;
    // max(), not +=. This runs once at init, but a second tab of the same
    // browser would otherwise double-count a shared total on every reload.
    if (g.seconds > anonSecondsAccum) anonSecondsAccum = g.seconds;
    for (const [id, rec] of Object.entries(g.lessonProgress)) {
        if (!anonLessonProgress[id]) anonLessonProgress[id] = rec;
    }
    if (anonSecondsAccum) {
        console.log('[TTB] Restored ' + anonSecondsAccum + 's of guest typing from earlier today.');
    }
}

// ─── The guest login ladder (v2.3.0) ──────────────────────────────────────────
//
// Same two rungs as game.js v3.20.0, and ⚠️ THE SAME localStorage KEY ON
// PURPOSE. A student who declines in School and then opens a book is the same
// child; two pages each running their own private ladder would prompt them
// twice for the same rung. The accumulated SECONDS stay per-page (this file
// counts drill time, game.js counts sprint time) but the rung they have
// reached is shared, so the ladder only ever climbs.
//
// ⚠️ ARMS ON THE TICK, FIRES AT A RUN BOUNDARY. It used to fire from the tick
// directly, mid-drill — and the "Continue without signing in" handler below
// calls beginStep(currentStepIdx), which restarts the run from zero. So
// declining the prompt threw away whatever the child had just typed, which is
// a strange thing to do while telling them their typing matters. Waiting for
// the end of the run costs at most a few seconds of delay and destroys nothing.
let anonNudgeShown   = 0;   // 0 none, 1 first shown, 2 both shown. Persisted daily.
let anonNudgePending = 0;   // a rung crossed mid-run, waiting for the boundary
const ANON_NUDGE_1 = 60;    // 1 minute
const ANON_NUDGE_2 = 300;   // 5 minutes
const ANON_NUDGE_KEY = 'ttb_anonNudge_v2';   // shared with game.js

function loadAnonNudgeState() {
    try {
        const saved = localStorage.getItem(ANON_NUDGE_KEY);
        if (!saved) return;
        const data = JSON.parse(saved);
        if (data.date === getLocalDateStr()) anonNudgeShown = data.count || 0;
    } catch (e) {}
}
function saveAnonNudgeState() {
    try {
        localStorage.setItem(ANON_NUDGE_KEY, JSON.stringify({
            date: getLocalDateStr(),
            count: anonNudgeShown
        }));
    } catch (e) {}
}

// ─── Stats & Goals (mirrors game.js — writes to same Firestore path) ────────
// ⚠️ v2.20.0 — `secondsSchool` IS THIS PAGE'S OWN COUNTER AND `secondsToday`
// IS STILL THE DAY. They advance on the same line and mean different things:
// secondsToday is what the student sees (both modes, the graded day), and
// secondsSchool is the only number this file is allowed to WRITE. The Library
// triple is carried, seeded and never touched here — daylog.js
// applyWeekToStats() seeds both on both pages so the WAL and the guest merge
// have a server figure for every key they fold. §3.1, and game.js v3.35.0.
let statsData = { secondsToday:0, secondsWeek:0, charsToday:0, charsWeek:0,
                  mistakesToday:0, mistakesWeek:0,
                  secondsSchool:0,  charsSchool:0,  mistakesSchool:0,
                  secondsLibrary:0, charsLibrary:0, mistakesLibrary:0,
                  lastDate:'', weekStart:0 };

// ⚠️ THE BASELINE — WHAT FIRESTORE HELD WHEN WE LAST READ IT. (v2.6.0)
//
// Mirrors game.js v3.22.0 and exists for the same reason: so that "how much of
// statsData did this browser put there?" has an answer instead of a guess. The
// guest merge on sign-in has to reconcile the live counters against the stored
// ones, and both obvious ways of doing that are wrong in one direction each:
//
//   sum()  — right for a true guest (page opened signed out, counters started at
//            zero, so all of statsData is new work), and WRONG for an expired
//            session, where statsData was seeded from the server at page load
//            and adding the server's copy back counts it twice. This is what
//            shipped, and on 2026-08-18 it took a student's week from 20 minutes
//            to 40 after three minutes of typing.
//   max()  — right for the expired session, and WRONG for a guest who typed
//            earlier in the day elsewhere: max(server 10, local 20) keeps 20
//            instead of 30 and ten minutes of real work disappear.
//
//     this browser's contribution = statsData - baseline
//     merged                      = server + contribution
//
// Correct in both, because a true guest's baseline is zero and the formula
// collapses back into sum(). Set ONLY where Firestore is read (loadUserStats).
let statsBaseline = { secondsToday:0, secondsWeek:0, charsToday:0, charsWeek:0,
                      mistakesToday:0, mistakesWeek:0,
                      secondsSchool:0,  charsSchool:0,  mistakesSchool:0,
                      secondsLibrary:0, charsLibrary:0, mistakesLibrary:0 };

// ⚠️ `lastKnownRepairedAt` and checkForWeekRepair() ARE GONE (v2.16.0), same as
// in game.js v3.31.0. They defended a STORED week counter against reports.html's
// repair button. The week is derived from seven typing_logs documents now and is
// stored nowhere, so there is nothing to repair and nothing to defend.
// HANDOFF §0.0.

// ⚠️ TRUE WHEN A REAL USER BECAME NULL WITHOUT ASKING TO. (v2.6.0)
//
// Auth expires at 24 hours and that lands mid-period for somebody most days.
// currentUser goes null; the drill tick keeps counting because it never checked
// auth; and every `!currentUser || currentUser.isAnonymous` test in this file
// starts reading a student twenty minutes into a lesson as a fresh visitor.
// A guest and an expired session need opposite handling and were, until this
// flag, indistinguishable.
let sessionExpired = false;
let lastKnownUid   = '';   // survives the null, so we know whose session lapsed

// ⚠️ v2.20.0 — THE PER-SOURCE TRIPLES ARE IN HERE AND MUST STAY IN HERE.
// STAT_KEYS is what captureStatsBaseline() snapshots, and the baseline is what
// mergeGuestStats() subtracts to work out how much of a number THIS browser put
// there. A counter that is folded but never baselined has a baseline of zero
// forever, so every merge treats the server's own stored value as this browser's
// contribution and adds it twice — the arithmetic that doubled a student's week
// on 2026-08-18, rebuilt on a new field.
//
// ⚠️ LIBRARY BEFORE SCHOOL, MATCHING game.js EXACTLY, EVEN THOUGH THIS PAGE IS
// SCHOOL. session-merge-test.mjs compares the two files' merge output as
// serialised objects, so the key ORDER is part of what it holds identical. That
// looks like pedantry and is not: the harness exists because the page a student
// happens to open first must not decide what their week says, and the cheapest
// way to keep two hand-maintained copies honest is to require them to be
// character-for-character the same list.
const STAT_KEYS = ['secondsToday','charsToday','mistakesToday',
                   'secondsLibrary','charsLibrary','mistakesLibrary',
                   'secondsSchool','charsSchool','mistakesSchool',
                   'secondsWeek','charsWeek','mistakesWeek'];

function captureStatsBaseline() {
    for (const k of STAT_KEYS) statsBaseline[k] = statsData[k] || 0;
}

// ⚠️ THE FUNCTION THAT DOUBLED A STUDENT'S WEEK. Read the statsBaseline block
// above before touching the arithmetic, and DO NOT "simplify" it to max() —
// that trades one silent corruption for another. Kept structurally identical to
// game.js mergeGuestStats(); ⚠️ CHANGE ONE, CHANGE BOTH. Neither page controller
// can import the other, so this is the third pair of twins in the codebase
// (applyPendingClassAssignment and getWeekStart are the others).
//
// The period guards are load-bearing and they are also the fingerprint of the
// original bug: on 2026-08-18 the stats document still said lastDate = the day
// before (it is only written on a `final` flush), so the DAY branch was skipped
// and only the WEEK branch fired. Week doubled, day did not. That asymmetry is
// how the defect was identified from a screenshot.
function mergeGuestStats(serverData, dateStr, weekStart) {
    const d = serverData || {};
    const dayMatches  = d.lastDate === dateStr;
    const weekMatches = (d.weekStart || '') === weekStart;

    // ═════════════════════════════════════════════════════════════════════════
    // ⚠️ v2.23.2 — THE GUARD WAS ON ONE SIDE OF THE SUBTRACTION ONLY.
    // ═════════════════════════════════════════════════════════════════════════
    //
    // `dayMatches` asks whether the SERVER's numbers are about today. Nothing
    // asked whether `statsData` — the `live` term below — is about today. The
    // caller's own note two hundred lines down said "Both period guards match
    // by construction — the read WAS for this date and this week," which is
    // true and is the problem: it makes `dayMatches` a TAUTOLOGY, so the only
    // term that can be stale is the only one never checked.
    //
    // ⚠️ MEASURED ON REAL DATA, 2026-08-21, two students, both in Library. A
    // tab left open overnight still held YESTERDAY's day counters; the token
    // lapsed, the child signed back in, and `mine = live - base` evaluated to
    // yesterday's ENTIRE day, which was written to TODAY's document. See
    // game.js v3.38.1 for the two students' arithmetic — this file carries the
    // identical defect on the identical path and is fixed identically.
    //
    // ⚠️ WHY DISCARDING `live` IS SAFE. The rollover in the tick sets
    // `lastDate` on the FIRST counted second of the day — in this file that is
    // the block that sets the counters to 1 rather than 0, and it runs for
    // guests too, inside the same gate. So a `lastDate` still reading yesterday
    // PROVES nothing has been counted in this tab today: there is no
    // contribution to lose.
    // ⚠️ AND THE WEEK RIDES ON THE DAY. The week's own guard passes for a stale
    // tab — yesterday IS in this week — but `mine` is then yesterday's
    // contribution, which was flushed to yesterday's document and is already
    // inside the server's week sum. A week boundary is always also a day
    // boundary, so this never refuses a contribution the day would have kept.
    const liveDay  = !statsData.lastDate  || statsData.lastDate  === dateStr;
    const liveWeek = liveDay && (!statsData.weekStart || statsData.weekStart === weekStart);

    const fold = (key, matches, liveValid) => {
        const live = statsData[key] || 0;
        const server = matches ? (d[key] || 0) : 0;
        // ⚠️ THE FLOOR GOES WITH THE CONTRIBUTION. The outer max() below stops a
        // merge landing under what this browser already shows the student —
        // right only while `live` describes the period being merged. Against a
        // stale counter the floor IS the carry-forward, and zeroing `mine`
        // alone would not stop it.
        if (!liveValid) { statsData[key] = server; return; }
        const base = statsBaseline[key] || 0;
        // Clamped at zero: a counter lower than its baseline means the day or
        // week rolled over underneath us, and a negative contribution would
        // subtract real stored work.
        const mine = Math.max(0, live - base);
        // The outer max() is a FLOOR, not the merge. It guarantees the result
        // can never land below what this browser already shows the student.
        statsData[key] = Math.max(live, server + mine);
    };

    // ⚠️ v2.20.0 — the per-source triples are day-scoped counters like
    // secondsToday and fold on the same guard. Omitting them leaves a guest's
    // School minutes to be written straight over the account's stored
    // secondsSchool on the next flush, because the write is absolute per field.
    // ⚠️ Library before School, matching game.js exactly — see STAT_KEYS above.
    for (const k of ['secondsToday','charsToday','mistakesToday',
                     'secondsLibrary','charsLibrary','mistakesLibrary',
                     'secondsSchool','charsSchool','mistakesSchool']) fold(k, dayMatches, liveDay);
    for (const k of ['secondsWeek','charsWeek','mistakesWeek'])    fold(k, weekMatches, liveWeek);

    statsData.lastDate  = dateStr;
    statsData.weekStart = weekStart;
    captureStatsBaseline();
}
let goals     = { dailySeconds: 0, weeklySeconds: 0 };
let classInfo = { id: '', name: '', dailySeconds: 0, weeklySeconds: 0 };
let dailyGoalCelebrated  = false;
let weeklyGoalCelebrated = false;

// ⚠️ v2.25.0 — IDENTICAL TO game.js's, AND IT ONLY WORKS IF BOTH FILES USE IT.
// This was two open-coded lines in two places asking "is the total already past
// the goal", which stays true for the rest of the week — so a crossing that
// failed to fire at the moment it happened never fired again. hud.js v1.4.0's
// latch records what was actually SHOWN. A child who crosses their weekly goal
// in School and misses it now gets it in Library, once. Named as a function so
// the two call sites cannot drift apart the way the open-coded pairs could.
function applyGoalCelebrationState() {
    dailyGoalCelebrated  = celebrationDone('day',  getLocalDateStr(new Date()));
    weeklyGoalCelebrated = celebrationDone('week', String(getWeekStart(new Date())));
}
let learnActiveSeconds   = 0;   // active seconds this step (for HUD display)
let learnTickInterval    = null;
let learnLastInputTime   = 0;
const LEARN_IDLE_THRESHOLD = 3000; // 3s idle = paused

// ─── Drill session state ─────────────────────────────────────────────────────
let currentLesson  = null;

// ─── Runs, not steps (v2.0.0) ────────────────────────────────────────────────
// A lesson's authored steps are expanded at lesson start into a flat list of
// "runs". A short step becomes one run; a long one is split into several. Runs are
// what the engine actually executes, grades, and counts pips for — currentStepIdx
// indexes currentRuns, NOT currentLesson.steps.
//
// Why this exists: six authored steps were longer than a 10-minute class period at
// the pace required to pass them (u6_l2 step 1 is 789 chars at a 20 WPM gate =
// 10.5 minutes of flawless typing), and nothing survived the bell. Chunking in the
// engine rather than the data fixes all 47 existing lessons without touching a
// single Firestore document. See PEDAGOGY-AUDIT.md §3.2.

let currentRuns    = [];  // expanded + chunked runs for the current lesson
// ⚠️⚠️ v2.39.0 — ROADMAP 23. WHAT currentRuns WAS BUILT FOR. The Round 41 defect
// was possible because four writers read `currentLesson` and none of them
// checked that `currentRuns` still belonged to it — and the symptom was a GRADE,
// not an error. This is the pairing, written at every site that assigns
// currentRuns, and asserted by the two writers that persist a run.
//
// Holds a lesson id, or REMEDIATION_RUNS while a remediation drill owns the
// list, or null when no lesson is open.
const REMEDIATION_RUNS = '\u0000remediation';   // cannot collide with a lesson id
let currentRunsFor = null;
let currentStepIdx = 0;   // index into currentRuns
let currentStep    = null;// currentRuns[currentStepIdx]
let drillSequence  = [];  // array of chars to type for current run
let drillPos       = 0;   // index into drillSequence
let mistakes       = 0;
let chars          = 0;
let stepStartTime  = 0;
let stepSeconds    = 0;
// ─── The open-run watermark (v2.8.0, DESIGN-TELEMETRY §7 step 1.5) ───────────
// How much of the CURRENT run has already been written to the session queue.
// ⚠️ Same mechanism, same reasoning and the same reset rule as game.js's
// sprintLoggedSeconds — read the block above that declaration. Until v2.8.0 this
// file only wrote a session record in finishStep(), so a student who abandoned a
// run halfway (toggled to Library, closed the lid, walked out at the bell) left
// counter time with no record behind it. `open-unit-test.mjs` counts the reset
// sites in this file against the sites where `stepSeconds` is zeroed.
let stepLoggedSeconds = 0, stepLoggedChars = 0, stepLoggedMistakes = 0;
function resetStepLogWatermark() {
    stepLoggedSeconds = 0; stepLoggedChars = 0; stepLoggedMistakes = 0;
}
let timerInterval  = null;
let introAnimTimer = null;
let introAnimFrame = 0;   // 0 = home, 1 = reach
let fingerMap      = buildFingerMap(LAYOUT);
let missedChars    = {};  // char → count for this lesson

// Per-character done states — mirrors game.js currentLetterStatus logic
let drillCharStates      = [];      // 'upcoming' | 'perfect' | 'fixed' | 'dirty' per char
let drillLetterStatus    = 'clean'; // 'clean' | 'error' | 'fixed'
let drillBackspaceOrigin = -1;      // furthest pos reached during a backspace run
let drillConsecutiveMistakes = 0;   // resets on any correct key
let drillIsHardStop      = false;   // timer paused, waiting for correct key
// DRILL_STOP_TIME_THRESHOLD (was 3) removed in v2.0.0 — it did not do what its name
// or comment claimed. See the note in handleDrillKey's error branch.
const DRILL_HARD_STOP_THRESHOLD = 5;  // consecutive errors before hard stop overlay (matches game.js)
const DRILL_SPAM_THRESHOLD      = 10; // consecutive errors to restart step entirely

// ─── DOM ─────────────────────────────────────────────────────────────────────
const mapView        = document.getElementById('map-view');
const drillView      = document.getElementById('drill-view');
const introPanel     = document.getElementById('intro-panel');
const activeDrill    = document.getElementById('active-drill');
const lessonMapEl    = document.getElementById('lesson-map');
const introKeysEl    = document.getElementById('intro-keys');
const introTitleEl   = document.getElementById('intro-title');
const introTextEl    = document.getElementById('intro-text');
const introStartBtn  = document.getElementById('intro-start-btn');
const introKeyboard  = document.getElementById('intro-keyboard');
const drillTextEl    = document.getElementById('drill-text');
const stepLabelEl    = document.getElementById('step-label');
const stepProgressEl = document.getElementById('step-progress-bar');
const drillModal     = document.getElementById('drill-modal');
const drillKeyboard  = document.getElementById('virtual-keyboard');
const wpmDisplay     = document.getElementById('wpm-display');
const accDisplay     = document.getElementById('acc-display');
const mapProgressEl  = document.getElementById('map-progress-summary');
const graduateLink   = document.getElementById('graduate-link');
const backBtn        = document.getElementById('back-btn');
const hudLessonLabel = document.getElementById('hud-lesson-label');
const hudTimer       = document.getElementById('hud-time');

// ═════════════════════════════════════════════════════════════════════════════
// THE READING FONT  (v2.23.0) — ROADMAP item 8
// ═════════════════════════════════════════════════════════════════════════════
//
// Kids want to change the font they read the drill in. Per-student, stored
// locally, scoped to the DRILL TEXT ONLY.
//
// ⚠️ THE HUD IS NOT IN SCOPE AND MUST NOT BE. It is monospace on purpose — the
// clock does not reflow while it counts. Same for the keyboard and the modal.
// The selector below writes ONE custom property that ONLY #drill-text reads.
//
// ⚠️ NO WEBFONTS. Every face here is either already loaded (Courier Prime) or a
// system stack. This project has an entire page — appcheck.html — devoted to the
// fact that a district can block a CDN, and a font picker whose options silently
// fall back to Times on the school network is worse than no picker. Nothing here
// makes a network request.
//
// ⚠️ NO SCRIPT OR JOINED FACES (Jake's rule). A child learning to touch-type has
// to tell `l` from `1` and `rn` from `m`, and per-character highlighting on a
// joined face is unreadable besides.
//
// ⚠️⚠️ AND THE ONE THAT IS NOT OBVIOUS: A PROPORTIONAL FONT BREAKS THE DRILL'S
// NO-REFLOW GUARANTEE, AND style.css SAYS SO WITHOUT KNOWING IT. The comment
// above .dt-char reads "State classes change color only, never dimensions, so
// every character is always the same width" — but .dt-fixed and .dt-dirty set
// `font-weight: bold`. In a MONOSPACE face bold has the same advance width, so
// that claim holds by luck of the font rather than by the CSS. In a proportional
// face it does not: a character going bold the moment a child backspaces and
// retypes would shove the rest of the line sideways, under their fingers, at
// exactly the worst moment. style.css v3.6.0 swaps bold for an underline while a
// proportional face is active — underline changes no advance width. If you add a
// face here, add it to the right list below or that guarantee silently lapses.
// ⚠️ THE READING-FONT MODEL MOVED TO settings-panel.js (v2.28.0, ROADMAP 0b).
// DRILL_FONTS, applyDrillFont(), readDrillFont() and buildFontPicker() all lived
// here. ⚠️ RULE 9 — THIS WAS A MOVE AND THE ORIGINALS ARE DELETED, in the same
// deploy that added them there. Do not re-add a local copy of the font table:
// two lists that nobody chose to differ is exactly how the celebrations drifted
// (HANDOFF §0.-13.E).
//
// ⚠️ AND THE CONTROL MOVED WITH IT — from the map header into the ⚙ dialog. The
// ruling it was placed on the map to satisfy has NOT changed: a focusable
// control reachable by Tab from a typing view eats keystrokes. The dialog
// satisfies it a stronger way — it does not exist at all between opens, so
// there is nothing to tab to, whereas the map picker was permanently in the
// document. See settings-panel.js's header.

// ⚠️ APPLIED AT MODULE LOAD, BEFORE ANY DRILL IS BUILT, so a student never sees
// the default face flash to their own. It touches one CSS property and one class
// and reads nothing from the network or Firestore.
applyDrillFont(readDrillFont());

// ═══════════════════════════════════════════════════════════════════════════
// ⚙ THE SCHOOL SETTINGS PANEL (ROADMAP item 0b)
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THE GEAR IS AVAILABLE DURING A DRILL AND THE CLOCK PAUSES, EXACTLY LIKE
// LIBRARY. Jake ruled on this directly, 2026-08-22: *"When I said 'don't mess
// with the timing mechanism', I meant not to break the ability to track the time
// accurately. It acting the same way it does in library mode — namely, counting
// time typed and pausing when necessary — is just fine."*
//
// ⚠️ SO ITEM 7b/8's CONDITION IS ABOUT ACCURACY, NOT ABOUT NEVER STOPPING THE
// CLOCK. Pausing while a child is demonstrably not typing IS accurate tracking;
// it is what the idle gate already does. The forbidden thing is a second
// increment site, a second gate, or credit for time nobody typed.
//
// ⚠️ AND NOTE HOW LITTLE THIS ACTUALLY BUYS, because it explains why it is safe:
// `startGradedTimer()`'s gate is `drillPos > 0 && !isDrillIdle()`, and
// LEARN_IDLE_THRESHOLD is 3 seconds. **School's clock already stops itself three
// seconds into any pause**, dialog or no dialog. The explicit pause below
// removes those three seconds and makes the intent legible; it is not what
// stands between a child and a wrong number.
function ensureSettingsButton() {
    const btn = buildSettingsButton(openSchoolSettings);
    if (!btn.parentNode) {
        // ⚠️ SAME SLOT AS LIBRARY'S, so the two bars stay identical. game.js
        // v3.39.1 learned the hard way that appending this to <body> dangles it
        // in the reading area; style.css v3.7.1 positions it inside the bar.
        const right = document.querySelector('#hud .hud-section.right');
        (right || document.body).appendChild(btn);
    }
    return btn;
}

// ⚠️ EVERY VALUE HERE IS ALREADY IN MEMORY. This function performs NO reads:
// `classInfo` and `goals` were resolved by loadGoals() and cached for 24h, the
// uid is on `currentUser`, and the font comes from localStorage. Opening
// settings must never cost a document read — the same rule hud.js's celebration
// latch is built on.
function openSchoolSettings() {
    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ THE PAUSE, AND ITS RESUME. READ BOTH HALVES BEFORE EDITING EITHER.
    // ═══════════════════════════════════════════════════════════════════════
    // `learnTickInterval` is an ALIAS for `timerInterval`, not a second timer —
    // see the block above startGradedTimer(). Nine call sites already stop the
    // clock this way for a hard stop, a modal or a step end; this is a tenth
    // caller of an existing path, NOT a new mechanism. `startGradedTimer()`
    // re-arms the same single interval and resets no counter, so `stepSeconds`
    // and the WPM denominator survive the pause intact.
    //
    // ⚠️⚠️ THE FAILURE MODE IS THE RESUME, NOT THE PAUSE. A pause that never
    // resumes means a child types for the rest of the lesson while NOTHING
    // COUNTS — silent, no error, minutes gone. That is worse than the few
    // seconds the pause saves. The resume therefore rides on
    // settings-panel.js's `onClose`, which runs in a `finally` on the single
    // close() that all three dismiss paths (✕, Esc, backdrop) go through.
    // ⚠️ NEVER pause here without handing the matching resume to onClose.
    const drillRunning = drillView && !drillView.classList.contains('hidden');
    if (drillRunning) clearInterval(learnTickInterval);

    const rows = [{ kind: 'font' }];

    // ⚠️ THIS IS THE DEBT learn.js v2.24.0 CREATED, BEING PAID. `#user-class-name`
    // was removed from the top bar on Jake's ruling ("forget about the class, it
    // can live in settings") and then lived NOWHERE — `updateClassDisplay()` has
    // been writing to an element that no longer exists in learn.html, which is
    // the same shape as §0.-13.C's orphaned `loadIndexStats()` paint.
    if (currentUser && !currentUser.isAnonymous) {
        rows.push({
            kind: 'info', label: 'Class',
            value: (classInfo && classInfo.name) || '',
            empty: 'No class assigned',
            hint: 'set by your teacher',
        });
        // The goals the graded numbers in the top bar are measured against. A
        // child who can see `Daily 9:22 / 10:00` should be able to find out
        // where the 10:00 came from.
        if (goals.dailySeconds > 0 || goals.weeklySeconds > 0) {
            rows.push({
                kind: 'info', label: 'Your goals',
                value: (goals.dailySeconds  > 0 ? fmt(goals.dailySeconds)  + ' a day' : '')
                     + (goals.dailySeconds > 0 && goals.weeklySeconds > 0 ? ' \u00b7 ' : '')
                     + (goals.weeklySeconds > 0 ? fmt(goals.weeklySeconds) + ' a week' : ''),
            });
        }
        // ⚠️ THE STUDENT ID. Round 27g DELETED the corner stamp that used to
        // carry it, so this and Library's Settings menu are now the only places
        // it appears. Same EIGHT characters reports.html prints beside each
        // student — eight are unambiguous across a building and can be read
        // aloud across a classroom without a mistake; twenty-eight cannot.
        // ⚠️ `copy` CARRIES OVER THE STAMP'S CLICK-TO-COPY. Eight characters are
        // enough to read out and not enough to paste into a console, and losing
        // that on the way into settings would have been a silent capability loss.
        rows.push({
            kind: 'info', label: 'Your ID',
            value: currentUser.uid.slice(0, 8),
            copy: currentUser.uid,
            hint: 'tell your teacher this if something looks wrong',
        });
    } else {
        rows.push({ kind: 'note',
            text: 'Sign in to see your class, your goals and your ID.' });
    }

    openSettingsPanel({
        title: 'Settings',
        rows,
        onClose: () => { if (drillRunning) startGradedTimer(); },
    });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
document.getElementById('login-btn').onclick = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch(e) { console.error(e); }
};
{
    // ROADMAP item 0d. Guarded because #done-btn lives inside #user-info and a
    // future markup change could move it; a missing button must not throw here
    // and take the logout wiring below down with it.
    const _doneBtn = document.getElementById('done-btn');
    if (_doneBtn) _doneBtn.onclick = handleImDone;
}

document.getElementById('logout-btn').onclick = async () => {
    // Clear the marker FIRST. A deliberate sign-out must not be mistaken for an
    // expired session by the handler that is about to fire.
    try { await flushStats('signout', true); } catch (_) {}
    lastKnownUid = ''; sessionExpired = false;
    // ⚠️ v2.21.0 — RELOAD, LIKE game.js ALREADY DID. Without it the HUD kept
    // painting the signed-out page with the departed student's figures — Jake's
    // 2026-08-20 screenshot shows a signed-out School page still reading
    // `Daily 8:31 / 10:00 · Weekly 59:12 / 50:00`, goal denominators and all.
    // Under Rule 11 that is the worst kind of wrong number: a child looking at
    // a total that is not theirs. A reload is the only thing that clears every
    // in-memory counter at once; resetting them by hand is a list that the next
    // counter gets left off.
    try { await signOut(auth); location.reload(); } catch(e) { console.error(e); }
};
onAuthStateChanged(auth, async user => {
    // ⚠️ CAPTURED BEFORE currentUser IS OVERWRITTEN. (v2.6.0) `user === null`
    // means either "nobody has signed in" or "the token that worked a minute ago
    // expired". Those need opposite handling and were indistinguishable; this is
    // the distinction. Deliberate sign-out clears lastKnownUid first, below.
    const wasSignedIn = !!lastKnownUid;
    currentUser = user;
    if (user && !user.isAnonymous) { lastKnownUid = user.uid; sessionExpired = false; }
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    if (user) {
        document.getElementById('user-name').textContent = user.displayName || user.email;
        userInfo.classList.remove('hidden'); loginBtn.style.display = 'none';
        // Game Genie button — admin only
        if (!document.getElementById('learn-genie-btn')) {
            const gg = document.createElement('button');
            gg.id = 'learn-genie-btn';
            gg.innerHTML = '<span style="font-size:1.1em;">\uD83D\uDD25</span>' +
                '<span class="gg-fire">G</span><span class="gg-fire gg-fire2">G</span>' +
                '<span style="font-size:1.1em;">\uD83D\uDD25</span>';
            gg.title = 'Game Genie (admin)';
            gg.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:9999;' +
                'background:#111;border:1px solid #ff6600;color:#ff6600;' +
                'padding:4px 8px;cursor:pointer;border-radius:4px;font-family:monospace;' +
                'font-size:0.85rem;font-weight:bold;';
            gg.onclick = openLearnGenie;
            document.body.appendChild(gg);
        }
        const ggBtn = document.getElementById('learn-genie-btn');
        if (ggBtn) ggBtn.style.display = ADMIN_EMAILS.includes(user.email) ? '' : 'none';
        // ⚠️ NO length check here any more. loadLessons() is idempotent and
        // returns the in-flight promise if the module-load call is still
        // running, so awaiting it unconditionally is both correct and cheaper
        // than the guard it replaces. See the comment on _lessonsInFlight.
        await loadLessons();
        await retroactiveSaveAnonSession(user);
        await loadUserProgress();
        await loadUserStats();
        walRecoverLearn();   // replay unflushed lesson time from a dead session
        await loadGoals();
        // ⚠️ ORDER CHANGED: goals now runs FIRST so classInfo is populated, and
        // the pending-assignment lookup is skipped entirely for the ~99% of
        // students who already have a class. That read was firing on every
        // single login, for every student, forever, to find nothing.
        if (!(classInfo && classInfo.id)) await applyPendingClassAssignment(user);
    } else {
        userInfo.classList.add('hidden'); loginBtn.style.display = '';
        if (wasSignedIn) {
            // ⚠️ AN EXPIRED SESSION, NOT A VISITOR. (v2.6.0)
            //
            // The old code cleared userProgress unconditionally, which wipes the
            // map for a student who is mid-lesson and has done nothing wrong.
            // Their progress is still perfectly valid; the only thing that
            // stopped being true is that we can write. Counters keep climbing in
            // memory and mergeGuestStats() reconciles them on re-auth, so the
            // work is not lost — it is invisible until then, which is why the
            // prompt below is not optional.
            sessionExpired = true;
            console.warn('[TTB] Auth session expired mid-session — pausing writes ' +
                         'until re-authentication. Time continues to count locally.');
            showReauthPrompt();
        } else {
            userProgress = {};
        }
        // Load lessons if needed for signed-out view
        if (allLessons.length === 0) await loadLessons();
    }
    renderMap();
});

// ═════════════════════════════════════════════════════════════════════════════
// THE ID STAMP — bottom left, mirroring the version stamp bottom right.
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ WHY THIS EXISTS. On 2026-08-18 a student reported a doubled week counter,
// and there was no way to get from "this child, at this machine" to a row in the
// database. typing_logs carries an email and a display name, but nothing on the
// STUDENT'S SCREEN carried anything at all, so a bug reported verbally could not
// be tied to a record without asking the child to sign in again in front of you.
//
// It shows the FIRST EIGHT characters, not all twenty-eight. Eight hex-ish
// characters are unambiguous across a building and can be read aloud across a
// classroom without a mistake; twenty-eight cannot. The full value is in the
// title attribute and on the clipboard when clicked, for when eight is not
// enough. reports.html prints the same eight beside each student.
//
// Not PII, and it is the student's own id only — there is no lookup here, no
// list, and nothing another student's browser could be made to show.
//
// ⚠️ THIS FUNCTION IS DUPLICATED IN game.js AND learn.js. CHANGE ONE, CHANGE
// BOTH. Neither page controller can import the other, and it was not worth a
// fourth shared module for fifteen lines — but that judgement is exactly the one
// that produced the divergences this round spent its time on, so if it grows any
// further, extract it.
// ⚠️ renderIdStamp() DELETED (Round 27g). The student ID was a fixed-position
// stamp in the bottom-left corner of every page. Jake asked for it to move into
// settings; it is in School's ⚙ panel (learn.js v2.29.0) and in Library's
// Settings menu (game.js v3.42.3), with the same eight characters and the same
// click-to-copy.
//
// ⚠️ THIS FUNCTION WAS THE DUPLICATED-TWIN ITS OWN HEADER WARNED ABOUT — "CHANGE
// ONE, CHANGE BOTH... if it grows any further, extract it." It never grew; it was
// deleted from both files in one commit instead, which is the other way to
// resolve a twin and the cheaper one when the feature has somewhere better to
// live.
//
// ⚠️⚠️ AND IT HAD A SECOND JOB NOBODY WROTE DOWN AS A REQUIREMENT: HANDOFF §2's
// deploy check read "if the ID stamp is missing, the new code is not running and
// nothing else you check means anything." **That instruction is now wrong and
// has been rewritten** — the build footer is the deploy instrument, and it is a
// better one since Round 27 made the version stamps honest. If you delete a
// visible element, grep the DOCS for it too, not just the code.

// ─── Re-authentication ───────────────────────────────────────────────────────
//
// Deliberately NOT the guest ladder. The guest ladder says "sign in to save your
// work", which is both alarming and untrue here, and the sign-in it offers is
// what ran the merge that doubled a student's week. This one names what actually
// happened and makes no claim about their work being at risk.
function showReauthPrompt() {
    if (document.getElementById('reauth-overlay')) return;
    clearInterval(timerInterval);
    clearInterval(learnTickInterval);

    const overlay = document.createElement('div');
    overlay.id = 'reauth-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.55);' +
        'display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
        '<div style="background:#fff;max-width:420px;padding:24px;border-radius:8px;text-align:center;">' +
        '<div style="font-size:1.1rem;font-weight:bold;margin-bottom:8px;">Please sign in again</div>' +
        '<div style="font-size:0.9rem;color:#555;margin-bottom:14px;">Your sign-in expired, which happens ' +
        'about once a day. Your work is still here &mdash; it just can\u2019t save until you sign back in.</div>' +
        '<button id="reauth-btn" style="padding:8px 18px;cursor:pointer;">Sign In Again</button>' +
        '</div>';
    document.body.appendChild(overlay);

    // ⚠️ BOUND AFTER THE LAST innerHTML WRITE. (Invariant 64, "innerHTML +=
    // destroys listeners".)
    document.getElementById('reauth-btn').onclick = async () => {
        const btn = document.getElementById('reauth-btn');
        btn.textContent = 'Signing in\u2026'; btn.disabled = true;
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
            // onAuthStateChanged fires; retroactiveSaveAnonSession() runs the
            // baseline-aware merge from there.
            overlay.remove();
        } catch (e) {
            btn.textContent = 'Sign In Again'; btn.disabled = false;
            if (e.code !== 'auth/popup-closed-by-user') console.warn('Re-auth failed:', e);
        }
    };
}


// ─── Guest Login Ladder ───────────────────────────────────────────────────────
// Called from the drill tick, once a second. Arms only; see the block comment
// on anonNudgeShown for why this no longer fires mid-run.
function armAnonLoginPrompt() {
    if (currentUser && !currentUser.isAnonymous) return;
    // ⚠️ AN EXPIRED SESSION IS NOT A GUEST. (v2.6.0) Without this line a student
    // whose token lapsed mid-lesson is invited to "sign in to save your work"
    // sixty seconds later — and that sign-in is what ran the merge that doubled
    // their week. Someone who has already signed in gets showReauthPrompt().
    if (sessionExpired) return;
    if (anonNudgePending) return;
    if (anonNudgeShown === 0 && anonSecondsAccum >= ANON_NUDGE_1) anonNudgePending = 1;
    else if (anonNudgeShown === 1 && anonSecondsAccum >= ANON_NUDGE_2) anonNudgePending = 2;
}

// Called at the end of a run, which is the boundary the tick was waiting for.
function checkAnonLoginPrompt() {
    if (currentUser && !currentUser.isAnonymous) return;
    if (sessionExpired) return;   // see armAnonLoginPrompt()
    // A rung can come due exactly at the boundary without the tick seeing it.
    armAnonLoginPrompt();
    const rung = anonNudgePending;
    anonNudgePending = 0;
    if (!rung) return;
    anonNudgeShown = rung;
    saveAnonNudgeState();
    // Slight delay so the lesson result modal finishes first
    setTimeout(() => showAnonLoginPrompt(rung), 800);
}

function showAnonLoginPrompt(rung) {
    if (currentUser && !currentUser.isAnonymous) return; // signed in while waiting
    if (sessionExpired) return;   // see armAnonLoginPrompt()
    rung = (rung === 2) ? 2 : 1;

    // Pause any active drill
    clearInterval(timerInterval);
    clearInterval(learnTickInterval);

    const mins = Math.round(anonSecondsAccum / 60);
    const timeStr = mins >= 1 ? mins + ' minute' + (mins !== 1 ? 's' : '') : 'a bit';

    // Show over whatever is currently visible using a fixed overlay
    const overlay = document.createElement('div');
    overlay.id = 'anon-login-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.55);' +
        'display:flex;align-items:center;justify-content:center;';

    overlay.innerHTML = rung === 1 ?
        '<div style="background:#fff;border-radius:8px;padding:28px 32px;max-width:360px;' +
        'text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.3);font-family:"Courier Prime",monospace;">' +
        '<div style="font-size:1.5rem;margin-bottom:8px;">\uD83D\uDCAA Nice work!</div>' +
        '<div style="color:#444;font-size:0.92rem;margin-bottom:16px;line-height:1.5;">' +
        'You’ve been typing for ' + timeStr + '.' +
        '<br>Sign in to <strong>save your progress</strong> and have it count toward your goals!' +
        '</div>' +
        '<button id="anon-signin-btn" style="width:100%;padding:12px;background:var(--carolina-blue);' +
        'color:white;border:none;border-radius:5px;font-size:1rem;font-weight:bold;' +
        'cursor:pointer;font-family:inherit;margin-bottom:8px;">Sign In with Google</button>' +
        '<button id="anon-skip-btn" style="width:100%;padding:8px;background:none;border:none;' +
        'color:#aaa;font-size:0.82rem;cursor:pointer;font-family:inherit;">Continue without signing in</button>' +
        '</div>'
        :
        '<div style="background:#fff;border-radius:8px;padding:28px 32px;max-width:360px;' +
        'text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.3);font-family:"Courier Prime",monospace;">' +
        '<div style="font-size:1.4rem;margin-bottom:8px;">\u26A0\uFE0F Not being saved</div>' +
        '<div style="color:#444;font-size:0.92rem;margin-bottom:16px;line-height:1.5;">' +
        'That’s ' + timeStr + ' of typing that will be lost when you close this tab.' +
        '<br>Signing in keeps <strong>all of it</strong> — including what you’ve already done.' +
        '<br><span style="color:#888;font-size:0.85rem;">This is the last time I’ll ask.</span>' +
        '</div>' +
        '<button id="anon-signin-btn" style="width:100%;padding:12px;background:var(--carolina-blue);' +
        'color:white;border:none;border-radius:5px;font-size:1rem;font-weight:bold;' +
        'cursor:pointer;font-family:inherit;margin-bottom:8px;">Sign In with Google</button>' +
        '<button id="anon-skip-btn" style="width:100%;padding:8px;background:none;border:none;' +
        'color:#aaa;font-size:0.82rem;cursor:pointer;font-family:inherit;">Keep typing without saving</button>' +
        '</div>';

    document.body.appendChild(overlay);

    document.getElementById('anon-skip-btn').onclick = () => {
        overlay.remove();
        // Resume if mid-drill: the drill view is showing and no modal is over it.
        //
        // v2.2.3 rewrote the second half from `!drillModal.classList.contains(
        // 'hidden') === false`. That is EQUIVALENT — unary ! binds tighter than
        // ===, so (!contains) === false reduces to contains === true, i.e. the
        // modal is hidden — but it is shaped exactly like a typo, and the next
        // person to touch it will "fix" it into its own negation.
        const onDrill    = !drillView.classList.contains('hidden');
        const modalIsUp  = !drillModal.classList.contains('hidden');
        if (onDrill && !modalIsUp) {
            beginStep(currentStepIdx); // restarts current step fresh — acceptable
        }
    };

    document.getElementById('anon-signin-btn').onclick = async () => {
        const signinBtn = document.getElementById('anon-signin-btn');
        signinBtn.textContent = 'Signing in…'; signinBtn.disabled = true;
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
            // onAuthStateChanged fires — retroactive save handled there
            overlay.remove();
        } catch(e) {
            signinBtn.textContent = 'Sign In with Google'; signinBtn.disabled = false;
            if (e.code !== 'auth/popup-closed-by-user') console.warn('Sign-in failed:', e);
        }
    };
}

// carryGuestDaysToTheirOwnDocuments() — THE OVERNIGHT RESCUE  (v2.22.0)
//
// ⚠️ THE SCHOOL HALF OF game.js v3.37.0. Jake's ruling, 2026-08-20: a child who
// typed as a guest, lost their connection, and did not sign in until the next
// day keeps those minutes — credited to the day they typed them. The design
// argument, and the standing ruling it overturns, are in daylog.js v1.4.0's
// footer. Read that before changing anything here; this is only the plumbing.
//
// ⚠️ THE PLAN IS SOURCE-AGNOSTIC AND THIS FUNCTION IS NOT. carryOverPlan() reads
// each record's OWN `source`, so a queue holding both School and Library sprints
// produces a group for each, and each group writes only its own triple. That is
// why this loop passes `g.source` through rather than hard-coding 'school':
// naming the wrong source's field here would rebuild §3.1 by hand.
//
// ⚠️ ONE READ AND ONE WRITE PER PRIOR DAY, AND THE READ IS LOAD-BEARING. The
// per-source field is absolute, not a Firestore increment, so the stored value
// has to be read to be added to. That read-modify-write is safe ONLY after the
// cutover, when each page owns its own three fields outright — daylog.js refuses
// a pre-cutover date for exactly that reason. Before it, the target is the
// SHARED flat triple and this same code is §3.1 wearing a helpful expression.
//
// ⚠️ IF THE WRITE FAILS THE RECORDS ARE STILL GONE FROM THE GUEST SLOT. They are
// not lost — they were adopted and reach `typing_sessions` — but that day's
// TOTAL will not have them. Logged loudly rather than retried: a retry needs
// durable state about what has already been credited, and inventing one is how a
// rescue becomes a double-credit. Under-crediting is the direction to fail in.
async function carryGuestDaysToTheirOwnDocuments(user, carry) {
    for (const g of carry) {
        try {
            const ref = doc(db, 'typing_logs', `${user.uid}_${g.date}`);
            const snap = await getDoc(ref);
            const stored = sourceTotalsOf(snap.exists() ? snap.data() : {})[g.source];

            const payload = carryOverPayloadFor(g.source, g.date, {
                stored,
                add: { seconds: g.seconds, chars: g.chars, mistakes: g.mistakes },
            });

            await setDoc(ref, {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || 'Anonymous',
                classId: (classInfo && classInfo.id) || '',
                schoolId: (classInfo && classInfo.schoolId) || '',
                date: g.date,
                ...payload,
                lastUpdated: new Date()
            }, { merge: true });

            console.log(`Rescued ${g.seconds}s of guest ${g.source} typing onto ${g.date} ` +
                        `(${g.records.length} run record(s)).`);
        } catch (e) {
            // ⚠️ NAMES THE DAY AND THE SECONDS. If a teacher ever asks why a
            // drill-down row exists on a day whose total does not include it,
            // this line is the answer, and it needs to be greppable.
            console.warn(`Guest carry-over FAILED for ${g.date} ${g.source} ` +
                         `(${g.seconds}s, ${g.chars} chars):`, e);
        }
    }
}

async function retroactiveSaveAnonSession(user) {
    if (!user || user.isAnonymous) return;
    // ⚠️ THE `sessionExpired` TERM IS NOT OPTIONAL. (v2.6.0)
    //
    // anonSecondsAccum is incremented by the drill tick whenever currentUser is
    // falsy — which includes a token that lapsed mid-lesson, not just a genuine
    // guest. So this guard passed for an expired session, the merge below ran,
    // and it ran against counters already seeded from the server. Now the merge
    // is baseline-aware, so running it is harmless either way; the flag is here
    // so the SUBSEQUENT lesson-progress replay knows the difference.
    if (!anonSecondsAccum && !Object.keys(anonLessonProgress).length && !sessionExpired) return;

    try {
        const today = new Date();
        const dateStr = getLocalDateStr(today);
        const weekStart = getWeekStart(today);

        // Merge accumulated time into their stats.
        // ⚠️ v2.6.0 — this used to be `statsData.x += server.x` inline, which was
        // right for a guest and doubled the counters for an expired session. The
        // arithmetic lives in mergeGuestStats() now; read the block above it
        // before changing anything here.
        // ⚠️ v2.16.0 — the server side of the merge is the week of typing_logs
        // now. mergeGuestStats() is unchanged: it wants an object shaped like the
        // old stats document, and a week read is exactly that once named. Both
        // period guards match by construction — the read WAS for this date and
        // this week.
        const read = await readWeek({ db, doc, getDoc, uid: user.uid, dateStr });
        // ⚠️ v2.20.0 — THE PER-SOURCE FIELDS ARE PASSED AS THE SERVER SIDE.
        // mergeGuestStats() computes `server + this browser's contribution` for
        // every key it folds; a key with no server value folds as `0 + mine`,
        // and the absolute per-field write that follows then puts this guest's
        // School minutes over the account's stored secondsSchool.
        // read.todaySources is what the document holds, per source, out of the
        // same seven reads. Mirrors game.js v3.35.0.
        mergeGuestStats(read.ok ? {
            lastDate: dateStr, weekStart: read.weekStart,
            secondsToday: read.today.seconds, charsToday: read.today.chars,
            mistakesToday: read.today.mistakes,
            secondsSchool:   read.todaySources.school.seconds,
            charsSchool:     read.todaySources.school.chars,
            mistakesSchool:  read.todaySources.school.mistakes,
            secondsLibrary:  read.todaySources.library.seconds,
            charsLibrary:    read.todaySources.library.chars,
            mistakesLibrary: read.todaySources.library.mistakes,
            secondsWeek: read.week.seconds, charsWeek: read.week.chars,
            mistakesWeek: read.week.mistakes,
        } : null, dateStr, weekStart);
        // ⚠️ v2.21.0 — THE RUNS COME ACROSS TOO, AND THAT IS THE "in the record"
        // HALF. The merge above fixes the TOTAL; without this the day still
        // carries minutes the drill-down cannot account for. Each record keeps
        // its own `at`, and therefore its own date.
        const taken = sessionLogTake(GUEST_QUEUE_UID);
        const adopted = sessionLogAdopt(user.uid, taken, dateStr);
        if (adopted) console.log(`Adopted ${adopted} guest run record(s) into ${user.uid}.`);

        // ⚠️ v2.22.0 — PLAN THE OVERNIGHT RESCUE BEFORE THE FLUSH DRAINS THE
        // QUEUE. `taken` is the only handle on these records that survives
        // sessionLogFlush(). Mirrors game.js v3.37.0 exactly; the argument for
        // the whole feature is in daylog.js v1.4.0's footer and it is worth
        // reading before touching either copy.
        const carry = carryOverPlan(taken, dateStr);

        sessionExpired = false;
        learnStatsDocDirty = true;
        await flushStats('anon-retroactive', true);

        // ⚠️ AFTER THE FLUSH, DELIBERATELY. The flush is what a child is waiting
        // on to see their own number move; this touches days that are already
        // over and nobody is watching. Its own await and its own try, so a
        // failure here cannot take the flush down with it.
        if (carry.length) await carryGuestDaysToTheirOwnDocuments(user, carry);

        // Save lesson progress accumulated during anon session
        for (const [lessonId, record] of Object.entries(anonLessonProgress)) {
            const progRef  = doc(db, 'users', user.uid, 'lessonProgress', lessonId);
            const progSnap = await getDoc(progRef);
            if (progSnap.exists()) {
                // Keep best grade between what was saved and this anon session
                const existing = progSnap.data();
                const existGrade  = existing.grade || 'F';
                const anonGrade   = record.grade   || 'F';
                const bestGrade   = GRADE_ORDER.indexOf(anonGrade) > GRADE_ORDER.indexOf(existGrade)
                    ? anonGrade : existGrade;
                await setDoc(progRef, {
                    ...record,
                    grade:   bestGrade,
                    passed:  record.passed || existing.passed || false,
                    attempts: (existing.attempts || 0) + (record.attempts || 1),
                    timeSpentSeconds: (existing.timeSpentSeconds || 0) + (record.timeSpentSeconds || 0),
                }, { merge: false });
            } else {
                await setDoc(progRef, record);
            }
            userProgress[lessonId] = record;
        }

        // ⚠️ COUNT BEFORE CLEARING. The log line below used to read
        // `Object.keys(anonLessonProgress).length` AFTER the two lines that
        // empty it, so it reported 0 lessons every time, forever. Harmless, and
        // exactly the kind of thing that makes a console message worthless as
        // evidence when you finally need it.
        const savedLessonCount = Object.keys(anonLessonProgress).length;

        // Clear anon accumulators — in memory AND on disk. The persisted copy
        // has now been credited to a real account; leaving it would re-apply
        // the same minutes on the next sign-in of the day.
        anonSecondsAccum = 0;
        anonLessonProgress = {};
        guestAccumClear();

        console.log('[TTB] Retroactive anon session saved:', savedLessonCount, 'lessons');
    } catch(e) { console.warn('[TTB] Retroactive save failed:', e); }
}

// ═════════════════════════════════════════════════════════════════════════════
// READ CACHING  (v2.2.0)
// ═════════════════════════════════════════════════════════════════════════════
//
// Every fix in this block exists in game.js already and never got backported.
// The result was that the MOST-USED page in the app was the only one with no
// caching at all. A returning student cost ~5 reads in game.js and ~115 in
// learn.js, for the same ten minutes of typing.
//
// What was read on EVERY learn.js load, uncached:
//   the whole `lessons` collection        (~80 docs)
//   the whole `lessonProgress` subcoll    (~30 docs mid-curriculum)
//   users/{uid} + classes/{id}            (2 docs, for goals)
//   pendingClassAssignments/{email}       (1 doc, almost always absent)
//
// ⚠️ Cache invalidation strategy differs per collection and the reasons matter:
//
//   lessons        — shared, edited rarely, by an adult. Validated with an
//                    aggregation COUNT query, which Firestore bills as ONE read
//                    per 1000 matched index entries. So the check costs 1 read
//                    instead of 80. A count catches added/removed lessons
//                    instantly; edits to an EXISTING lesson are caught by the
//                    TTL below. That is the deliberate trade.
//   lessonProgress — per-student, and this tab is normally the only writer, so
//                    the local copy stays true. Shorter TTL because a student
//                    on a second device is possible.
//   goals          — verbatim port of game.js GOALS_CACHE_KEY.
//
// ⚠️ Every cache key is namespaced by uid. A shared cart Chromebook must never
// hand one student's progress to the next one who sits down.

const LESSONS_CACHE_KEY   = 'ttb_lessonsCache_v1';
const LESSONS_CACHE_MS    = 4 * 3600 * 1000;    // content edits land within 4h
const PROGRESS_CACHE_KEY  = 'ttb_lessonProgCache_v1';
const PROGRESS_CACHE_MS   = 8 * 3600 * 1000;    // one school day

// ⚠️⚠️ v2.42.0 — ROADMAP 43. THE CACHE MUST NOT BE WRITTEN BEFORE IT IS READ.
//
// Holds the uid whose progress is genuinely in `userProgress` right now — set
// ONLY where the map has actually been populated, never on the error path.
// `refreshProgressCache()` refuses to write unless this matches the signed-in
// user, which is what stops an empty map being persisted as fact.
//
// ⚠️ A uid AND NOT A BOOLEAN. Two students share a Chromebook in the same
// browser profile more often than anyone plans for; a boolean would stay true
// across a sign-out and let the second student's flush write the first
// student's map, or an empty one, under the new uid.
let _progressLoadedForUid = null;
const LEARN_GOALS_KEY     = 'ttb_goalsCache_v1'; // SAME key game.js uses — one
                                                 // read serves both pages
const LEARN_GOALS_MS      = 24 * 3600 * 1000;

// Read a namespaced cache entry, or null. Never throws: a corrupt or absent
// cache must degrade to a real read, never to a broken page.
function cacheRead(key, maxAgeMs, uid) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const c = JSON.parse(raw);
        if (uid !== undefined && c.uid !== uid) return null;
        if ((Date.now() - c.at) > maxAgeMs) return null;
        return c;
    } catch (_) { return null; }
}

// Write a cache entry. A quota failure drops OUR keys and gives up quietly —
// the cache is an optimisation and must never break a page load.
function cacheWrite(key, payload) {
    try {
        localStorage.setItem(key, JSON.stringify({ at: Date.now(), ...payload }));
    } catch (e) {
        try {
            Object.keys(localStorage)
                .filter(k => k.startsWith('ttb_lessonsCache') ||
                             k.startsWith('ttb_lessonProgCache'))
                .forEach(k => localStorage.removeItem(k));
        } catch (_) {}
    }
}

// Admin escape hatch, wired into the Game Genie. After editing a lesson, Jake
// can drop every cache and reload rather than waiting out the TTL.
function ttbClearLearnCaches() {
    [LESSONS_CACHE_KEY, PROGRESS_CACHE_KEY, LEARN_GOALS_KEY].forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
    });
}
window.ttbClearLearnCaches = ttbClearLearnCaches;

// ─── Load Lessons ─────────────────────────────────────────────────────────────
//
// ⚠️ IN-FLIGHT PROMISE, NOT A LENGTH CHECK. The old guard was
// `if (allLessons.length === 0) await loadLessons()` in the auth handler, with a
// fire-and-forget loadLessons() at module load. Auth settles in ~200ms; the
// collection fetch takes ~300ms. So the guard tested a length that had not been
// populated yet and ran the app's single biggest read A SECOND TIME, on most
// loads. The comment on the old guard acknowledged the race; the guard did not
// close it. A promise handle is the only thing that does.
//
// ⚠️ BUT COALESCING IS ONLY VALID WHEN THE CALLERS ARE INTERCHANGEABLE, AND
// THESE TWO ARE NOT. Until firestore.rules v2.3.0 the module-load call went out
// with no auth token and came back permission-denied; the catch below swallowed
// it and resolved with an empty list. The auth handler then arrived holding a
// token that WOULD have worked, found a promise in flight, awaited it, and
// inherited a failure it was never subject to. Empty map, no error, no way for
// a student to describe it beyond "it went white" — and intermittent, because
// it turned on whether the denial landed before or after auth settled.
//
// So: success is shared, failure is not. `_lessonsOk` records whether the
// in-flight attempt actually populated anything; a caller arriving after a
// failed attempt starts a fresh one rather than adopting the corpse. The result
// is at most one redundant read in the rare case, and never a silent empty map.
//
// This still matters with public read in place. It is now a network fault
// rather than a permissions fault, which is rarer and no less real — a school
// wifi hiccup during the first 300ms reproduces it exactly.
let _lessonsInFlight = null;
let _lessonsOk = false;

async function loadLessons() {
    if (_lessonsInFlight) {
        await _lessonsInFlight;
        if (_lessonsOk) return;
        // The shared attempt failed. Fall through and try again on our own
        // credentials rather than reporting its emptiness as our result.
    }
    _lessonsOk = false;
    _lessonsInFlight = (async () => {
        try {
            const cached = cacheRead(LESSONS_CACHE_KEY, LESSONS_CACHE_MS);
            if (cached && Array.isArray(cached.lessons) && cached.lessons.length) {
                // Validate with a count aggregation: 1 billed read instead of ~80.
                let liveCount = null;
                try {
                    const agg = await getCountFromServer(collection(db, 'lessons'));
                    liveCount = agg.data().count;
                } catch (_) { /* aggregation unavailable — trust the TTL */ }
                if (liveCount === null || liveCount === cached.lessons.length) {
                    allLessons = cached.lessons;
                    _lessonsOk = true;
                    afterLessonsLoaded();
                    return;
                }
            }

            const snap = await getDocs(collection(db, 'lessons'));
            allLessons = [];
            snap.forEach(d => allLessons.push(d.data()));
            allLessons.sort((a, b) => {
                if (a.unit !== b.unit) return a.unit - b.unit;
                return a.lesson - b.lesson;
            });
            cacheWrite(LESSONS_CACHE_KEY, { lessons: allLessons });
            // ⚠️ An EMPTY collection is not a successful load for our purposes.
            // A denied read and an empty `lessons` collection are indistinguishable
            // downstream — both draw a blank map — so the one that a retry might
            // fix is treated as a failure. The cost of being wrong is one extra
            // read on a genuinely empty database, which only exists before Jake
            // has authored a single lesson.
            _lessonsOk = allLessons.length > 0;
            afterLessonsLoaded();
        } catch(e) {
            // Last resort: an expired cache beats an error screen. A student
            // with no connection can still see the map they saw this morning.
            const stale = cacheRead(LESSONS_CACHE_KEY, Infinity);
            if (stale && Array.isArray(stale.lessons) && stale.lessons.length) {
                allLessons = stale.lessons;
                // Serving an expired cache IS a success: there are lessons on the
                // screen and a retry would only fail the same way.
                _lessonsOk = true;
                afterLessonsLoaded();
                console.warn('Lessons fetch failed; serving expired cache.', e);
                return;
            }
            lessonMapEl.innerHTML = '<div style="color:#888; text-align:center; padding:40px;">Could not load lessons. Check your connection.</div>';
            console.error(e);
        }
    })();
    try { await _lessonsInFlight; }
    finally { _lessonsInFlight = null; }
}

function afterLessonsLoaded() {
    // If the map is already visible but was rendered before lessons loaded, refresh it
    if (!mapView.classList.contains('hidden') &&
        lessonMapEl.querySelectorAll('.map-lesson-card').length === 0) {
        renderMap();
    }
}

async function loadUserProgress() {
    if (!currentUser) return;
    // ⚠️ v2.32.0 — ROADMAP 10. The gate's two numbers are read alongside progress
    // because they are useless without it and vice versa: a mode needs the record
    // AND the day count. Reading them apart is how one of them ends up stale
    // behind a renderMap() that already ran.
    await loadGateState();
    userProgress = {};

    // ⚠️⚠️ v2.42.0 — ROADMAP 43. NOT LOADED UNTIL PROVEN LOADED. Cleared here so
    // that an early return, a throw, or a flush firing during the await below
    // cannot find a stale `true` from the previous student or the previous load.
    _progressLoadedForUid = null;

    const cached = cacheRead(PROGRESS_CACHE_KEY, PROGRESS_CACHE_MS, currentUser.uid);
    // ⚠️⚠️ AN EMPTY MAP IS A MISS, NOT A HIT. `typeof {} === 'object'` is true,
    // so the old condition accepted `{}` as a complete answer — and `{}` is
    // exactly what a poisoned cache holds. isUnlocked() then found nothing
    // passed and offered lesson one and nothing else, for up to eight hours,
    // re-stamping its own TTL on every flush while the student worked.
    //
    // ⭐ THIS HALF IS THE SELF-HEAL. Any cache already poisoned in the wild
    // falls through to Firestore on the student's next page load, with no
    // console and no teacher intervention. The guard on the write side stops it
    // happening again; this stops it having already happened.
    //
    // ⚠️ COSTS ONE SUBCOLLECTION READ PER LOAD FOR A STUDENT WHO HAS GENUINELY
    // PASSED NOTHING — a brand-new account, until they finish their first
    // lesson. That is a real read cost and it is the right trade: the
    // alternative is being unable to tell "new student" from "lost everything",
    // which is the confusion that caused this defect.
    if (cached && cached.progress && typeof cached.progress === 'object'
        && Object.keys(cached.progress).length > 0) {
        userProgress = cached.progress;
        _progressLoadedForUid = currentUser.uid;
        return;
    }

    try {
        const snap = await getDocs(collection(db, 'users', currentUser.uid, 'lessonProgress'));
        snap.forEach(d => { userProgress[d.id] = d.data(); });
        // ⚠️ SET ONLY HERE, AFTER THE READ RESOLVED. The catch below deliberately
        // leaves it null: a failed read means the empty map in memory is
        // ignorance, not fact, and nothing may persist it.
        _progressLoadedForUid = currentUser.uid;
        cacheWrite(PROGRESS_CACHE_KEY, { uid: currentUser.uid, progress: userProgress });
    } catch(e) { console.warn('Could not load lesson progress:', e); }
}

// Called after every local progress write so the cache tracks what this tab
// already knows. Without this the cache would go stale the instant a student
// finished a lesson, and the next load would show them un-completing it.
function refreshProgressCache() {
    if (!currentUser) return;
    // ⚠️⚠️ v2.42.0 — ROADMAP 43. THE GUARD, AND THE WHOLE FIX IS THIS LINE.
    //
    // This function used to write whatever `userProgress` happened to hold, with
    // no check that it had ever been read. `loadUserProgress()` sets it to `{}`
    // and then AWAITS a network round trip; anything flushing inside that window
    // — visibilitychange:hidden fires on a tab switch, a Chromebook lid, or
    // Google Classroom in another tab — reached here and persisted the empty map
    // as though it were the student's record.
    //
    // ⚠️ THE CONSEQUENCE WAS NOT PARTIAL. isUnlocked() reads
    // `userProgress[prev.id]?.passed === true` for every lesson, so an empty map
    // unlocks allLessons[0] and nothing else. A student with eight lessons
    // passed was offered lesson one, for eight hours, with their Firestore
    // record perfectly intact the whole time. Their TIME was never affected —
    // that lives in typing_logs — which is what made it look like a lesson bug
    // rather than a cache bug.
    //
    // ⚠️ THE UID MUST MATCH, not merely be set. See _progressLoadedForUid.
    if (_progressLoadedForUid !== currentUser.uid) return;
    cacheWrite(PROGRESS_CACHE_KEY, { uid: currentUser.uid, progress: userProgress });
}

// ─── Lesson Map ───────────────────────────────────────────────────────────────
// ⚠️ BUILDS INTO A FRAGMENT AND SWAPS AT THE END. (v2.4.0)
//
// This function used to open with `lessonMapEl.innerHTML = ''` and then do all
// its work — including calling mapMeta() → buildRunList() → buildSequence() for
// every lesson in the corpus. Anything throwing anywhere after line 1 left the
// container EMPTIED and unrefilled: a blank map, no console error a student can
// report, and a page that stays blank on every subsequent render because the
// same lesson throws again.
//
// It was not the cause of the blank screen Jake reported in Round 10 — that was
// beginStep(), see the comment there — and the 47-lesson corpus was verified
// clean across 3,000 renders before this was written, so nothing throws here
// today. It is still the wrong shape. A render that destroys the old view
// before it can build the new one has no failure mode except "nothing", and
// lesson content is authored in an admin panel by a human and imported from
// JSON that (before lessons-admin.js v1.9.0) validated only the lesson id.
//
// Build first, swap last: a throw now leaves the PREVIOUS map standing, which
// is both a usable screen and a much better bug report.
// ═══════════════════════════════════════════════════════════════════════════
// ROADMAP item 10 — THE GATE'S STATE (v2.32.0)
// ═══════════════════════════════════════════════════════════════════════════
//
// Two numbers off the student record, read once at sign-in and cached: how many
// days they have typed, and what that count was when they last advanced. The
// rule needs nothing else — see lesson-gate.js, which is pure.
//
// ⚠️ BOTH DEFAULT TO 0 AND THE DEFAULT IS THE PERMISSIVE ONE. A read that fails,
// or a student whose record predates this feature, yields reachBack 0, which
// means "no lesson has been reopened" — nothing is unlocked that should not be.
// ⚠️ THE OPPOSITE DEFAULT WOULD HAND A LEGACY STUDENT THE WHOLE CURRICULUM ON
// DEPLOY MORNING, which is the failure discovered during first period rather
// than during testing.
let gateActiveDays = 0;
// ⚠️ v2.34.0 — ROADMAP 14. `lastLockDay` REPLACES `lastAdvanceDay`. Do not
// reintroduce the second stamp — they will disagree, and that is Rule 9. The old
// field is still READ once, as a fallback for records written before this
// shipped, inside lastLockDayOf().
let gateLastLockDay = 0;

async function loadGateState() {
    gateActiveDays = 0; gateLastLockDay = 0;
    if (!currentUser || currentUser.isAnonymous) return;
    try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        const d = snap.exists() ? snap.data() : {};

        // ⚠️ SAME REASON AS game.js's noteActiveDay(): this already holds the
        // user document, and ensureSince() must see the existing value rather
        // than write one blind. See logdays.js v1.1.0.
        try { await ensureSince({ db, doc, setDoc, uid: currentUser.uid,
                                  date: getLocalDateStr(), userData: d }); }
        catch (_) { /* ensureSince swallows its own failures */ }

        gateActiveDays = activeDayCountOf(d);
        const lock = lastLockDayOf(d);
        gateLastLockDay = (typeof lock === 'number') ? lock : gateActiveDays;
    } catch (e) {
        console.warn('[TTB] gate state not read; nothing will be gated:', e);
    }
}

// The mode of one lesson: 'locked' | 'graded' | 'practice'.
// ⚠️ ONE FUNCTION ASKS THE RULE, AND EVERY CALLER GOES THROUGH IT. renderMap
// draws the badge, startLesson decides whether to arm the clock, and
// finishStep decides whether anything is written — three decisions that MUST
// agree. A second place computing this is a lesson that shows a practice badge
// and files a grade anyway.
function modeForLesson(lesson) {
    const rec = userProgress[lesson.id];
    return lessonModeFor({
        index: allLessons.findIndex(l => l.id === lesson.id),
        furthestIndex: furthestIndexOf(allLessons, userProgress),
        record: rec,
        // ⚠️ v2.34.0 — WITHOUT runCount THIS DEFAULTS TO 1 AND GATES OFF RUN 0
        // ALONE, which is wrong and wrong quietly. Prefer the stored count; fall
        // back to the live run list for a lesson with no record yet.
        runCount: (rec && rec.runCount) || buildRunList(lesson).length || 1,
        activeDayCount: gateActiveDays,
        lastLockDay: gateLastLockDay,
        unlocked: isUnlocked(lesson),
        staff: isStaffUser(currentUser),
    });
}

// ⚠️⚠️ v2.34.0 — ROADMAP 14. THE MODE OF ONE **RUN**, AND THIS IS NOW THE
// DECISION THAT MATTERS. modeForLesson() above is the label on the map card;
// this decides whether a run pays. A single lesson can hold a mastered run and
// an unmastered one at the same time — that is the whole point of scoring per
// run — so anything asking "does this count?" must ask about the RUN.
// ⚠️⚠️ v2.35.0 — JAKE, 2026-08-23: *"if the first one is locked, students have
// no way to get to the second run legitimately."* He is right, and it is the one
// thing item 14 did not think through. Runs are typed in order from run 0, so a
// student whose run 1 was mastered had to replay it — for nothing — to reach the
// run that still pays. THE GATE WAS TAXING THE STUDENT IT MEANT TO MOVE ALONG.
//
// ✅ THE ANSWER IS WELL-DEFINED BECAUSE OF DOWNWARD CLOSURE, NOT BY LUCK.
// runMastered(rec, k) is true if ANY run at index ≥ k has four points, so the
// mastered runs are always a PREFIX and the open runs always a SUFFIX. "The first
// open run" therefore exists, is unique, and cannot strand a student in the
// middle of a lesson. ⚠️ IF CLOSURE IS EVER LOOSENED this stops being a suffix
// and this function must be REWRITTEN, not patched.
//
// Returns 0 when every run is practice: the whole lesson is replayable, the
// banner says so, and the student starts at the top like anyone else.
function firstOpenRunIdx(lesson) {
    const runs = buildRunList(lesson);
    for (let i = 0; i < runs.length; i++) {
        if (modeForRun(lesson, i) !== 'practice') return i;
    }
    return 0;
}

function modeForRun(lesson, runIdx) {
    return runModeFor({
        lessonIndex: allLessons.findIndex(l => l.id === lesson.id),
        runIdx,
        furthestLessonIndex: furthestIndexOf(allLessons, userProgress),
        record: userProgress[lesson.id],
        activeDayCount: gateActiveDays,
        lastLockDay: gateLastLockDay,
        unlocked: isUnlocked(lesson),
        staff: isStaffUser(currentUser),
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// ROADMAP item 10 — the active-day counter (v2.32.0)
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ TWIN. The identical function is in game.js. Jake's rule is "a month of
// typing ANYTHING", so a day spent in either mode is one active day, and a page
// that fails to count silently starves the lesson gate on the OTHER page — no
// error, no visible symptom, just a review window that never opens.
// lesson-gate-test.mjs section G greps both files for it. CHANGE ONE, CHANGE BOTH.
//
// ⚠️ CALLED FROM INSIDE THE TICK'S GATE BUT **BELOW** THE INCREMENTS, and that is
// not stylistic. open-unit-test.mjs Part E asserts the gate and the first
// increment are ADJACENT — it matches them within a fixed window of characters —
// so anything inserted between them fails the suite. Below is the only place
// this can go.
//
// ⚠️ IT IS NOT A SECOND CLOCK. It does not measure time; it answers a yes/no
// question about the calendar, once per session. `_activeDayDone` makes every
// call after the first a single boolean test, so this sits on a path that runs
// 3,600 times an hour and costs ONE Firestore read and AT MOST one write per
// student per day.
//
// ⚠️ THE FLAG IS SET BEFORE THE FIRST await ON PURPOSE. Ticks are 1s apart and
// the read is slower than that on a school connection; without it, two ticks
// race and the day is counted twice. That failure is invisible — the counter is
// never displayed — which is exactly why it is guarded here rather than left to
// be noticed.
let _activeDayDone = false;
async function noteActiveDay() {
    if (_activeDayDone) return;
    if (!currentUser || currentUser.isAnonymous) return;   // a guest has no record to stamp
    _activeDayDone = true;
    try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        const plan = activeDayPlan(snap.exists() ? snap.data() : {}, getLocalDateStr());
        if (!plan) return;                                 // already counted today — the common case
        await setDoc(doc(db, 'users', currentUser.uid), plan, { merge: true });
    } catch (e) {
        // ⚠️ A FAILED WRITE MUST NOT COST THE STUDENT ANYTHING. The worst case is
        // a review lesson opening one active day late, which is the safe
        // direction, and it is the trade Jake spent Rule 9 on deliberately:
        // a gate is not a ledger. See lesson-gate.js.
        console.warn('[TTB] active-day counter not written:', e);
    }
}

function renderMap() {
    // ⚠️ v2.23.0 — IDEMPOTENT BY ITS OWN GUARD, and it has to be: renderMap() is
    // called on every auth change and every progress update. buildFontPicker()
    // returns immediately if the control already exists, so this is not a leak
    // and not a duplicate listener. It is placed BEFORE the early return below
    // so the picker survives a lessons-failed-to-load state — a student whose
    // lessons did not load can still fix a font they cannot read.
    // ⚠️ v2.28.0 — THE FONT PICKER IS NO LONGER BUILT HERE. It moved into the ⚙
    // dialog (ROADMAP 0b, settings-panel.js). renderMap() runs on every auth
    // change and every progress update, so what it does now is make sure the
    // gear exists — `buildSettingsButton()` returns the existing one if there is
    // one, so this stays idempotent for the same reason the picker did.
    //
    // ⚠️ IT STAYS BEFORE THE EARLY RETURN BELOW, for the reason the picker did:
    // a student whose lessons failed to load must still be able to reach the
    // control that fixes a font they cannot read.
    ensureSettingsButton();
    if (allLessons.length === 0) {
        lessonMapEl.innerHTML = '<div style="color:#888; text-align:center; padding:40px;">No lessons loaded.</div>';
        return;
    }
    const mapFrag = document.createDocumentFragment();

    const completed = new Set(Object.keys(userProgress).filter(id => userProgress[id]?.passed));
    const totalLessons = allLessons.length;
    const doneCount = completed.size;
    mapProgressEl.textContent = currentUser
        ? `${doneCount} of ${totalLessons} lessons complete`
        : 'Sign in to save your progress';

    // Build by unit
    // "Continue" button — find first incomplete unlocked lesson
    const continueLesson = allLessons.find(l => !completed.has(l.id) && isUnlocked(l));
    const continueBtnEl = document.getElementById('map-continue-btn');
    if (continueBtnEl) {
        if (continueLesson) {
            const keys = (continueLesson.newKeys || []).length
                ? continueLesson.newKeys.map(k => k.toUpperCase()).join(' ') : '↺';
            continueBtnEl.textContent = '▶ Continue: ' + (continueLesson.title || continueLesson.id);
            continueBtnEl.style.display = '';
            continueBtnEl.onclick = () => startLesson(continueLesson);
        } else {
            continueBtnEl.style.display = 'none';
        }
    }

    // Show today's time in map header
    const timeEl = document.getElementById('map-time-today');
    if (timeEl && statsData.secondsToday > 0) {
        const dailyDone = goals.dailySeconds > 0 && statsData.secondsToday >= goals.dailySeconds;
        timeEl.innerHTML = 'Today: <strong>' + formatTime(statsData.secondsToday) + '</strong>' +
            (dailyDone ? ' <span class="goal-badge goal-daily" style="display:inline-flex;width:18px;height:18px;font-size:0.65rem;">✓</span>' : '');
        timeEl.style.display = '';
    }

    const byUnit = {};
    allLessons.forEach(l => {
        const u = l.unit || 0;
        if (!byUnit[u]) byUnit[u] = [];
        byUnit[u].push(l);
    });

    const UNIT_LABELS = {
        1: 'Unit 1 — Home Row',
        2: 'Unit 2 — Index Fingers',
        3: 'Unit 3 — Middle & Ring Up',
        4: 'Unit 4 — Remaining Letters',
        5: 'Unit 5 — Number Row',
        6: 'Unit 6 — Shift & Capitals',
        7: 'Unit 7 — Graduation',
    };

    // Find first unlocked-and-incomplete lesson to highlight
    let firstActiveId = null;
    let prevUnlocked = true;
    for (const lesson of allLessons) {
        if (!completed.has(lesson.id) && prevUnlocked) { firstActiveId = lesson.id; break; }
        prevUnlocked = completed.has(lesson.id);
    }

    Object.keys(byUnit).sort((a,b) => a-b).forEach(unit => {
        const header = document.createElement('div');
        header.className = 'map-unit-header';
        header.textContent = UNIT_LABELS[unit] || `Unit ${unit}`;
        mapFrag.appendChild(header);

        const row = document.createElement('div');
        row.className = 'map-lesson-row';

        byUnit[unit].forEach(lesson => {
            const prog = userProgress[lesson.id];
            const isDone = prog?.passed;
            const grade = prog?.grade || (prog?.stars ? ['','B','A','A🔥'][Math.min(prog.stars,3)] : '');
            const isLocked = !isDone && !isUnlocked(lesson);
            const isNext = lesson.id === firstActiveId;
            // ⚠️ v2.32.0 — ROADMAP 10. 'practice' is a MASTERED lesson outside the
            // reach-back window. It is NOT locked and must never be drawn as
            // though it were: the student can still play it, and telling a child
            // they may not revisit something they are good at is the opposite of
            // this feature. What changes is that it no longer pays.
            const isPractice = !isLocked && modeForLesson(lesson) === 'practice';

            const card = document.createElement('div');
            card.className = 'map-lesson-card' +
                (isLocked   ? ' locked' : '') +
                (isDone     ? ' completed' : '') +
                (isPractice ? ' practice-only' : '') +
                (isNext     ? ' active-next' : '');

            const keysLabel = (lesson.newKeys || []).length
                ? lesson.newKeys.map(k => k.toUpperCase()).join(' ')
                : (lesson.unit === 7 ? '★' : '↺');

            card.innerHTML = `
                <div class="mlc-keys">${keysLabel}</div>
                <div class="mlc-title">${escHtml(lesson.title || lesson.id)}</div>
                <div class="mlc-meta">${mapMeta(lesson)}</div>
                <div class="mlc-stars">${gradeOnMap(grade)}</div>
                ${isLocked ? '<div class="mlc-lock">🔒</div>' : ''}
                ${isPractice ? '<div class="mlc-practice" title="You have mastered this one — play it any time, but it won\u2019t count toward your time or your grade.">Mastered · practice</div>' : ''}
            `;

            if (!isLocked) {
                card.addEventListener('click', () => startLesson(lesson));
            }
            row.appendChild(card);
        });

        mapFrag.appendChild(row);
    });

    // Everything built without throwing — NOW replace what's on screen.
    lessonMapEl.replaceChildren(mapFrag);

    // Graduate button: show if all non-Unit-7 lessons complete
    const graduateable = allLessons.filter(l => l.unit < 7).every(l => completed.has(l.id));
    graduateLink.classList.toggle('hidden', !graduateable);
}

// Map card subtitle. Reports the number of runs a student will actually type — a
// 2-step lesson can be 12 runs after chunking — and the accuracy target, which is
// the gate that governs advancement everywhere. Speed is shown only where it's
// graded, so the card can't advertise a WPM number the lesson won't enforce.
function mapMeta(lesson) {
    const runs = buildRunList(lesson).length;
    const g    = lesson.gates || {};
    const acc  = g.minAccuracy == null ? 85 : g.minAccuracy;
    const prose = (lesson.steps || []).some(s => !DRILL_TYPES.has(s.type));
    const wpm  = g.minWPM == null ? 15 : g.minWPM;
    return runs + (runs === 1 ? ' run · ' : ' runs · ') + acc + '%' +
           (prose ? ' · ' + wpm + ' WPM' : '');
}

function isUnlocked(lesson) {
    // A lesson is unlocked if it's the first in its unit, or the previous lesson is complete
    const idx = allLessons.findIndex(l => l.id === lesson.id);
    if (idx === 0) return true;
    const prev = allLessons[idx - 1];
    // Different unit: first of new unit needs previous unit's last lesson done
    return userProgress[prev.id]?.passed === true;
}

// Feedback text. The old version's C and D branches told students to speed up, which
// on a paused-clock or accuracy-only run was simply false information — and being
// told to try harder at something you already did is how a student concludes the
// problem is them. Every message below names a cause the student can act on, and no
// message asks for speed on a run where speed isn't gated.
function getGradeMessage(wpm, acc, minWPM, minAcc, grade) {
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    const speedGated = (minWPM != null);
    const accShort   = minAcc - acc;

    if (grade === FIRE_GRADE) return pick([
        speedGated ? 'On fire! Fast AND clean.' : 'A perfect run. Not one mistake.',
        'Outstanding — that\u2019s as good as it gets.',
        'Absolutely blazing. Keep it up!'
    ]);
    if (grade === 'A') return pick([
        'Excellent work \u2014 really clean typing.',
        speedGated ? 'Strong pace and strong accuracy. Well done!'
                   : 'Very nearly perfect. Go for a clean run next time!',
        'A-level work. Keep pushing for that fire.'
    ]);
    if (grade === 'B') return pick([
        'Nice job \u2014 you passed!',
        'Solid typing. On to the next one.',
        'That\u2019s a pass. Keep it going!'
    ]);
    // C only happens on a speed-gated run: accuracy was fine, pace was short.
    if (grade === 'C') return pick([
        'Passed \u2014 accuracy is where it needs to be. Speed will come with practice.',
        'Good, accurate typing. You\u2019re through; the pace builds on its own.',
        'That counts. Accuracy first is exactly the right order.'
    ]);
    if (grade === 'D') return pick([
        'So close \u2014 ' + accShort + '% more accuracy and this one is done.',
        'Accuracy is at ' + acc + '%, and you need ' + minAcc + '%. Slow right down; there\u2019s no clock pressure here.',
        'Nearly there. Find each key before you press it \u2014 going slower actually helps.'
    ]);
    return pick([
        'Let\u2019s slow way down and focus on hitting the right keys. Take your time \u2014 the timer pauses when you pause.',
        'Take a breath. Find the key, press the key, repeat. Speed is not the goal yet.',
        'Every expert was once a beginner. Slow and correct beats fast and messy.'
    ]);
}


function gradeHTML(grade) {
    const map = {
        'A🔥': { color:'#ff6600', label:'A 🔥', bg:'rgba(255,100,0,0.12)' },
        'A':   { color:'#22c55e', label:'A',    bg:'rgba(34,197,94,0.12)'  },
        'B':   { color:'#4B9CD3', label:'B',    bg:'rgba(75,156,211,0.12)' },
        'C':   { color:'#FFD700', label:'C',    bg:'rgba(255,215,0,0.12)'  },
        'D':   { color:'#FF9800', label:'D',    bg:'rgba(255,152,0,0.12)'  },
        'F':   { color:'#888',    label:'F',    bg:'rgba(128,128,128,0.08)'},
    };
    const g = map[grade] || map['F'];
    return '<span class="grade-badge" style="color:' + g.color + ';background:' + g.bg + ';">' + g.label + '</span>';
}

function gradeOnMap(grade) {
    // Compact version for the lesson map card
    if (!grade) return '';
    if (grade === 'A🔥') return '<span style="color:#ff6600;font-weight:bold;font-size:0.85rem;">A🔥</span>';
    const colors = { A:'#22c55e', B:'#4B9CD3', C:'#FFD700', D:'#FF9800', F:'#888' };
    return '<span style="color:' + (colors[grade] || '#888') + ';font-weight:bold;font-size:0.85rem;">' + grade + '</span>';
}

// ⚠️⚠️ v2.34.0 — ROADMAP 14, AND THE ITEM CALLS THIS A REQUIREMENT, NOT A
// NICETY. The v1.0.0 rule was UNFALSIFIABLE FROM OUTSIDE: Jake ran a dozen
// attempts and could not tell whether it wanted three fireballs IN A ROW (it did
// not), which is why nobody could report it broken. Whatever the threshold is,
// THE STUDENT MUST SEE PROGRESS TOWARD IT.
function runScorePill(runIdx) {
    if (!currentLesson) return '';
    const have = Math.min(runScoreOf(userProgress[currentLesson.id], runIdx), MASTERY_POINTS);
    const done = have >= MASTERY_POINTS;
    const label = done
        ? 'Mastered \u00b7 this run no longer counts time'
        : 'Mastery ' + have + '/' + MASTERY_POINTS + ' \u2014 A🔥 = 2, A = 1';
    return '<div class="run-score-pill" style="margin-top:0.5rem;font-size:0.8rem;' +
           'letter-spacing:0.04em;color:' + (done ? '#ff6600' : '#8a8a8a') + ';">' +
           label + '</div>';
}

// ─── Start Lesson ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// THE PRACTICE BANNER (v2.32.0, ROADMAP 10)
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake: *"they should have a banner across the top that says so."*
//
// ⚠️⚠️ THE BANNER IS THE FEATURE, NOT THE DECORATION, AND IT MUST NOT BE
// DISMISSIBLE. A child typing for ten minutes while the daily total does not
// move reads as a broken app — and **silent counting failures are this
// project's specialty**: §0.-16's orphaned paint, §0.-12's stale day, the WAL
// that dropped a book-switch. Every one of them looked like nothing happening.
// This is the one case where nothing happening is CORRECT, so it is the one
// case that has to say so out loud, for the whole run, where the clock would be.
//
// ⚠️ THE WORDING IS DELIBERATE AND IS NOT A TELLING-OFF. The student earned this
// state by mastering the lesson three times. "Mastered" leads; what it costs
// comes second; and it names the way back — which is forward.
const PRACTICE_MODE_BANNER =
    '\u2b50 <strong>Practice run.</strong> You have already mastered this lesson, ' +
    'so this run will not add to your time or change your grade. ' +
    'Keep going for fun \u2014 or head to your next lesson to earn more.';

function showPracticeBanner(on) {
    let el = document.getElementById('practice-banner');
    if (!on) { if (el) el.remove(); return; }
    if (!el) {
        el = document.createElement('div');
        el.id = 'practice-banner';
        el.className = 'practice-banner';
        // Ahead of the drill view so it sits across the top of the run rather
        // than scrolling with the text.
        drillView.insertAdjacentElement('afterbegin', el);
    }
    el.innerHTML = PRACTICE_MODE_BANNER;
}

// ⚠️ v2.32.0 — ROADMAP 10. TRUE for the whole of a practice run, decided ONCE at
// the door and never re-derived mid-run. Re-asking modeForLesson() later would be
// a bug waiting for the day a student's counter ticks over mid-lesson and a run
// changes its mind about whether it counts.
let practiceRun = false;

// ⚠️⚠️ v2.36.0 — TRUE FOR THE WHOLE OF A "🎲 PRACTICE MISSED KEYS" DRILL.
//
// ⚠️ IT IS NOT THE SAME FLAG AS practiceRun ABOVE AND MUST NOT BE FOLDED INTO
// IT. They suppress DIFFERENT things, and that is the entire fix:
//
//   practiceRun     — ROADMAP 10's replay of a MASTERED run. Writes NOTHING
//                     anywhere, minutes included (§0.-21.C: the three omissions
//                     are one decision).
//   remediationRun  — a synthetic drill built from the keys the student just
//                     missed. The child is typing and the clock is honest, so
//                     the MINUTES COUNT, in typing_logs and typing_sessions
//                     alike. What must not happen is that it is ASSESSED.
//
// ⚠️ SUPPRESSING THE MINUTES HERE WOULD MANUFACTURE THE DIVERGENCE ROADMAP
// ITEM 4's FLAG EXISTS TO CATCH — time in one record and not the other. Both
// records get the seconds; neither gets a grade.
let remediationRun = false;

// ⚠️⚠️ v2.34.0 — ROADMAP 14. DECIDED PER **RUN**, AT THE DOOR OF THE RUN.
// v2.32.0 decided it once for the whole lesson, which was right when the unit
// was a lesson and is wrong now: one lesson can hold a mastered run and an
// unmastered one at the same time, and that is the entire point of scoring per
// run. Still decided ONCE per run and never re-derived mid-run — a counter
// ticking over mid-drill must not change whether the run already being typed
// counts.
function armRunMode(runIdx) {
    practiceRun = currentLesson ? modeForRun(currentLesson, runIdx) === 'practice' : false;
    showPracticeBanner(practiceRun);
}

function startLesson(lesson) {
    currentLesson  = lesson;
    // ⚠️ v2.36.0 — CLEARED HERE, WHERE THE REAL RUN LIST IS REBUILT. A
    // remediation drill leaves currentLesson alone and only replaces
    // currentRuns, so this is the one line that both entry points into a real
    // run go through ("Play it again" and _gotoLesson() both land here).
    remediationRun = false;
    currentRuns    = buildRunList(lesson);
    currentRunsFor = lesson.id;          // ⚠️ ROADMAP 23 — paired here, always.
    // ⚠️ v2.35.0 — NOT ALWAYS 0. See firstOpenRunIdx(): a student whose early runs
    // are mastered starts at the first one that still counts.
    currentStepIdx = firstOpenRunIdx(lesson);
    mistakes       = 0;
    chars          = 0;
    resetStepLogWatermark();
    missedChars    = {};
    // Title attribute as well as text: style.css v3.5.1 ellipsises this label
    // (it is the only variable-length item in the HUD and the only one allowed to
    // shrink), so the full lesson name has to stay reachable on hover.
    hudLessonLabel.textContent = lesson.title || '';
    hudLessonLabel.title = lesson.title || '';
    backBtn.href = '#'; backBtn.onclick = () => { stopLesson(); return false; };

    showView('drill');
    showRestartButton(true);

    // ⚠️ THERE IS NO MID-LESSON RESUME, AND THAT IS A RULING. (v2.5.0)
    //
    // Jake, 2026-08-17: *"If a kid doesn't finish a lesson one session, they
    // should restart it — not start at the last word. The lesson should be
    // taken as a whole (although it should track the time whether it finishes
    // or not)."*
    //
    // This block used to read a saved checkpoint, skip the intro, and drop the
    // student back into the exact character where the bell caught them. The
    // reasoning was that replaying the intro made an interrupted lesson feel
    // like starting from zero. Right about the feeling, wrong about the goal:
    // a lesson is a pedagogical unit, not a queue of characters to get through.
    // Resuming at word 340 of a fluency drill measures nothing, because the
    // thing being trained is the whole run.
    //
    // ⚠️ IT WAS ALSO THE BLANK SCREEN. This branch is the path that reached
    // beginStep() without ever unhiding #active-drill (see v2.4.0). Deleting it
    // removes the defect rather than guarding it — the v2.4.0 guard stays
    // anyway, because the invariant should hold for whatever calls beginStep()
    // next, not just for the caller that exposed it.
    //
    // ⚠️ AND IT IS WHY LESSONS "COULDN'T BE RESTARTED". Clicking a lesson you
    // had already been part-way through silently resumed it instead of starting
    // it, so there was no way to ask for a clean run — including for a lesson
    // already completed. That was the same code path, reported as a different
    // complaint.
    //
    // TIME IS UNAFFECTED. statsData ticks once a second from the drill tick
    // regardless of whether a lesson ever completes, and stopLesson() now calls
    // saveStats() so an abandoned lesson's minutes are scheduled for flush
    // rather than waiting on a hide. Abandoning is the normal way a partial
    // lesson ends now, so that path had to stop being the unlucky one.
    showIntro(lesson);
}

// Restart the lesson in progress from its first run. Goes through the intro on
// purpose: if the unit of work is the whole lesson, the intro is part of it, and
// showIntro() is also what pre-builds the drill keyboard at real pixel size.
function restartLesson() {
    if (!currentLesson) return;
    clearInterval(timerInterval);
    clearInterval(learnTickInterval);
    stopIntroAnim();
    drillKeyboard.onkeydown = null;
    // Bank whatever they typed before the restart — the time counts even though
    // the attempt is being thrown away.
    saveStats();
    persistGuestAccum();
    startLesson(currentLesson);
}

// The restart control. Built in JS rather than learn.html so this ships as one
// file — same pattern as the Game Genie button.
function showRestartButton(show) {
    let btn = document.getElementById('learn-restart-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'learn-restart-btn';
        btn.type = 'button';
        btn.textContent = '\u21BA Restart';
        btn.title = 'Start this lesson over from the beginning';
        btn.style.cssText = 'margin-left:10px;font:inherit;font-size:12px;' +
            'background:none;border:1px solid #555;border-radius:4px;' +
            'padding:1px 8px;color:#999;cursor:pointer;' +
            'font-family:\'Courier Prime\',monospace;';
        btn.onclick = restartLesson;
        // ⚠️ v2.24.0 — ANCHORED TO THE SECTION, NOT TO THE LESSON LABEL. The
        // label used to be a direct child of .hud-section.left, so inserting
        // after it put the button in the bar. It is now inside #hud-context,
        // the 11px SUB ROW of the two-row stack, and inserting there would
        // render Restart at sub-row size wedged under the Daily figure.
        const leftSection = document.querySelector('#hud .hud-section.left');
        if (leftSection) {
            leftSection.appendChild(btn);
        } else {
            document.getElementById('hud').appendChild(btn);
        }
    }
    btn.style.display = show ? '' : 'none';
}

function showIntro(lesson) {
    introPanel.classList.remove('hidden');
    // Keep active-drill visible but collapse it so the drill keyboard
    // gets laid out in the DOM with real pixel dimensions while the intro shows.
    // This eliminates the race condition where beginStep() builds the keyboard
    // on a zero-size element that Safari hasn't reflowed yet.
    activeDrill.classList.remove('hidden');
    activeDrill.style.position = 'absolute';
    activeDrill.style.top = '0';
    activeDrill.style.left = '0';
    activeDrill.style.width = '100%';
    activeDrill.style.height = '100%';
    activeDrill.style.opacity = '0';
    activeDrill.style.pointerEvents = 'none';
    drillModal.classList.add('hidden');
    document.getElementById('drill-keyboard-wrap').style.display = '';
    stopIntroAnim();

    // Key badges
    introKeysEl.innerHTML = (lesson.newKeys || []).length
        ? lesson.newKeys.map(k => '<div class="intro-key-badge">' + escHtml(k.toUpperCase()) + '</div>').join('')
        : '<div class="intro-key-badge" style="font-size:1rem;">All Keys</div>';

    introTitleEl.textContent = lesson.title || '';
    introTextEl.textContent  = lesson.intro || '';

    // Build intro keyboard
    createKeyboard(introKeyboard, LAYOUT);
    createHandGuide(introKeyboard, fingerMap, LAYOUT, true);

    // Pre-build the drill keyboard NOW while it has real dimensions in the DOM.
    // By the time the student hits Start, the keyboard has been laid out for
    // several seconds and beginStep() just needs to show and focus it.
    requestAnimationFrame(() => {
        createKeyboard(drillKeyboard, LAYOUT);
        createHandGuide(drillKeyboard, fingerMap, LAYOUT, true);
        console.log('[TTB] Drill keyboard pre-built during intro — keys:', drillKeyboard.querySelectorAll('.key').length);
        startIntroAnim(lesson);
    });

    introStartBtn.onclick = () => {
        stopIntroAnim();
        document.removeEventListener('keydown', introEnterHandler);
        // ⚠️ v2.35.0 — currentStepIdx, NOT 0. startLesson() already worked out the
        // first run that still counts; a literal 0 here sends the student back
        // through the runs the gate exists to move them past.
        beginStep(currentStepIdx);
    };

    // Enter key activates Start Lesson from the intro screen
    function introEnterHandler(e) {
        if (e.key === 'Enter' && !introPanel.classList.contains('hidden')) {
            e.preventDefault();
            document.removeEventListener('keydown', introEnterHandler);
            stopIntroAnim();
            beginStep(currentStepIdx);   // v2.35.0 — see introStartBtn above
        }
    }
    document.addEventListener('keydown', introEnterHandler);
}

// ─── Intro Animation ──────────────────────────────────────────────────────────
function startIntroAnim(lesson) {
    const newKeys = lesson.newKeys || [];
    if (newKeys.length === 0) {
        resetHandGuideToHome(introKeyboard, LAYOUT);
        return;
    }

    introAnimFrame = 0;
    runIntroAnimFrame(newKeys);
    introAnimTimer = setInterval(() => {
        introAnimFrame = 1 - introAnimFrame;
        runIntroAnimFrame(newKeys);
    }, INTRO_ANIM_MS);
}

function runIntroAnimFrame(newKeys) {
    if (introAnimFrame === 0) {
        // Frame A: all fingers resting at home
        resetHandGuideToHome(introKeyboard, LAYOUT);
    } else {
        // Frame B: all target fingers reach simultaneously
        // setHandGuideToChars resets once then activates all — no second reset clobbers the first
        setHandGuideToChars(introKeyboard, fingerMap, LAYOUT, newKeys);
    }
}

function stopIntroAnim() {
    if (introAnimTimer) { clearInterval(introAnimTimer); introAnimTimer = null; }
}

// ─── Step Engine ──────────────────────────────────────────────────────────────

// The graded clock. stepSeconds is the WPM denominator, so it must not run while
// the student isn't typing — before v2.0.0 it incremented unconditionally, which
// meant a teacher talking for fifteen seconds mid-drill could put the gate out of
// arithmetic reach and the app would then tell the student to type faster.
// LEARN_IDLE_THRESHOLD and learnLastInputTime already existed; the graded timer
// simply never consulted them.
function isDrillIdle() {
    if (!learnLastInputTime) return true;   // nothing typed yet this run
    return (Date.now() - learnLastInputTime) > LEARN_IDLE_THRESHOLD;
}

// ⚠️ THE ONE INCREMENT SITE. (v2.10.0, DESIGN-TELEMETRY §7 step 1.75)
//
// This function owns the ONLY tick in this file, and every quantity that measures
// time advances on the same line under the same gate. Jake's ruling, 2026-08-18:
// **time typed starts at the first CORRECT keystroke of a run.** `drillPos` only
// advances on an accepted character, so `drillPos > 0` is that moment exactly.
//
// WHAT THIS REPLACED, AND WHY IT MATTERED
//
// There used to be THREE increment sites: `stepSeconds` here under the graded
// gate, and `statsData.secondsToday` in a SECOND interval under an idle-only
// gate — plus a third copy of that second interval inside closeGenie(). Two
// timers, two gates, one student. That is invariant 1 living inside one file,
// and it had four separate consequences:
//
//   1. The daily counter started on the first keypress of ANY kind; the graded
//      clock waited for the first correct one. A student hunting for a key
//      earned daily-goal time they had not earned graded time for. Bounded by
//      the 3s idle gate, and by DRILL_HARD_STOP_THRESHOLD (5) before the drill
//      stops them — so several seconds a run for exactly the students least able
//      to afford a wrong number.
//   2. A hard stop ran `clearInterval(timerInterval)`, which stopped the graded
//      clock and left the other one running.
//   3. `ggBypassIdle` defeated the idle gate on the School copy and not on
//      Library's, so the same admin flag meant two things.
//   4. The two sides sampled at different resolutions.
//
// ⚠️ ALL FOUR ARE GONE BECAUSE THERE IS ONE SITE, not because any of them was
// fixed. Add a second increment site and all four come back at once.
// `open-unit-test.mjs` counts the sites in the shipped source and fails if a
// second one appears.
//
// ⚠️ `learnTickInterval` IS AN ALIAS FOR THIS INTERVAL, NOT A SECOND TIMER.
// Nine call sites already do `clearInterval(learnTickInterval)` to stop the
// clock — a hard stop, a modal, a step end. Aliasing keeps every one of them
// correct rather than betting that all nine were found. Both names, one timer.
function startGradedTimer() {
    clearInterval(timerInterval);
    // ⚠️⚠️ v2.32.0 — ROADMAP 10. A PRACTICE RUN NEVER ARMS THE CLOCK, AND NOTE
    // WHAT THIS IS **NOT**: it is not a condition inside the gate below. The one
    // increment site that this function's header credits with killing four
    // separate counting bugs is untouched — no new test, no new flag, nothing
    // between the gate and the increments. The timer is simply never started.
    //
    // ⚠️ THAT DISTINCTION IS THE WHOLE REASON THIS FEATURE COULD BE BUILT AT ALL.
    // The earlier draft of item 10 was rejected because it would have put a
    // condition on the increment. Item 0b's pause work made this possible: the
    // mechanism for "run without the clock" already existed and is reused here,
    // used differently.
    if (practiceRun) { renderTimeHUD(); updateHUD(); return; }
    timerInterval = setInterval(() => {
        // The graded gate, and now the only gate. `drillPos > 0` means at least
        // one correct character; isDrillIdle() is false only within
        // LEARN_IDLE_THRESHOLD of the last input of any kind.
        // ⚠️ ONE GATE, AND `secondsSchool` IS INSIDE IT (v2.20.0). The per-source
        // counter advances on the line below and NOWHERE ELSE, exactly like the
        // counters beside it. A per-source counter on its own schedule would be
        // a second clock measuring the same student — the three-increment-site
        // state this function was written to end, and what open-unit-test.mjs
        // Part E counts. The day and the source must never be able to disagree
        // about how many seconds just passed.
        //
        // ⚠️ NOTHING MAY GO BETWEEN THIS GATE AND THE INCREMENTS. open-unit-test
        // Part E matches the gate and the first increment within a fixed window
        // of characters, on purpose: it is asserting that the two are ADJACENT,
        // not merely both present. A long comment in the gap fails it — and so
        // does writing the increment out longhand in a comment anywhere in this
        // file, because the same harness also counts how many times it appears.
        if (drillPos > 0 && !isDrillIdle()) {
            stepSeconds++;
            // ⚠️⚠️ v2.40.0 — ROADMAP 6, THE SCHOOL HALF. THE ROLLOVER RUNS *BEFORE*
            // THE INCREMENTS NOW, AND THAT ORDERING IS HALF THE FIX.
            //
            // The Library half (game.js v3.38.0) closes the open sprint on the
            // OUTGOING day before resetting, so the seconds typed before
            // midnight are filed against the day they were typed on. School had
            // no equivalent: `stepSeconds` knew nothing about midnight and kept
            // climbing, so a lesson straddling it filed ONE record stamped with
            // the day it ENDED on — the same defect, the same shape, the same
            // two numbers disagreeing afterwards.
            //
            // ⚠️ THE OLD CODE INCREMENTED FIRST AND COMPENSATED WITH `= 1`. That
            // worked for the counters and could not work for the LOG, because by
            // the time the rollover was reached the second had already been
            // added to a `stepSeconds` that logOpenRun() was about to file under
            // the new day. Moving the block up and restoring the `= 0`s is the
            // only arrangement where both the counters and the record agree.
            // ROADMAP 6 spelled this out; it is not a one-liner and that is why
            // it was held. midnight-test.mjs Part D asserts it.
            //
            // ⚠️ IT MUST ALSO RUN ABOVE `anonSecondsAccum++` AND
            // `armAnonLoginPrompt()` — both are day-scoped in the same way.
            //
            // ⚠️ THE 5-SECOND FLOOR STILL APPLIES, exactly as in game.js: a run
            // begun at 11:59:58 has 2 seconds to close, the floor refuses them,
            // and the watermark is deliberately NOT advanced so they roll into
            // the first record of the new day rather than vanishing.
            rollDayIfNeeded('tick');

            learnActiveSeconds++;
            statsData.secondsToday++;
            statsData.secondsWeek++;
            statsData.secondsSchool++;
            if (!currentUser || currentUser.isAnonymous) {
                anonSecondsAccum++;
                if (anonSecondsAccum % GUEST_ACCUM_SAVE_EVERY === 0) persistGuestAccum();
                armAnonLoginPrompt();   // fires at the run boundary, not here
            }
            // Goal celebrations
            if (goals.dailySeconds > 0 && !dailyGoalCelebrated && statsData.secondsToday >= goals.dailySeconds) {
                dailyGoalCelebrated = true;
                celebrationMark('day', getLocalDateStr(new Date()));
                launchConfetti();
            }
            if (goals.weeklySeconds > 0 && !weeklyGoalCelebrated && statsData.secondsWeek >= goals.weeklySeconds) {
                weeklyGoalCelebrated = true;
                celebrationMark('week', String(getWeekStart(new Date())));
                launchFireworks();
            }
            // ⚠️ ONE CALL DRAWS BOTH SLOTS (v2.9.0).
            noteActiveDay();   // ⚠️ v2.32.0 — ROADMAP 10. Below the increments; see its own comment.
        }
        // ⚠️ PAINTING IS NOT COUNTING, AND THE PAINT IS NOT GATED. (v2.10.1)
        // renderTimeHUD() used to sit inside the gate above, so nothing drew the
        // readout until the first CORRECT keystroke — until then learn.html's
        // hardcoded `Daily 0:00` placeholder and an EMPTY `#hud-week` stood in for
        // a student's real totals. The counters were right; the drawing was late.
        // ⚠️ DO NOT MOVE THIS BACK INSIDE THE GATE. A gate answers "did time
        // pass?"; drawing answers "what does the student see?".
        renderTimeHUD();
        updateHUD();
    }, 1000);
    learnTickInterval = timerInterval;   // alias — see the header above
}

// ⚠️ THE OUT-OF-RANGE GUARD CALLED A FUNCTION THAT DOES NOT EXIST (v2.2.3).
//
// This read `if (!currentStep) { finishLesson(); return; }` and there has never
// been a finishLesson() in this file — the completion path is finishStep() ->
// showLessonResultModal(). So the guard threw a ReferenceError, which is worse
// than no guard at all: the throw abandons beginStep() before the intro panel is
// hidden or the keyboard is wired, leaving the student on a dead drill screen
// with no modal, no error and no way back except the browser Back button. Nothing
// is written, so it is also invisible from the teacher side — the failure mode
// this whole round of instrumentation exists to eliminate.
//
// Reachable two ways, both real:
//   * the Game Genie's step jump calls beginStep(parseInt(select.value)) with no
//     bounds check;
//   * the remediation detour rebuilds currentRuns from a synthetic step, so any
//     index captured before it is stale afterwards.
//
// ⚠️ v2.5.0 REMOVED THE THIRD AND MOST COMMON WAY IN. A saved run checkpoint
// could outlive a lesson edit: re-chunking a five-run step into three left a
// resume pointing at run 4 of 3. Checkpoints are gone, so that route is closed
// — but the Game Genie route is not, and a guard whose only remaining caller is
// an admin tool is still worth its six lines.
//
// Recovery is stopLesson(), not completion. `!currentStep` means the run list and
// the index disagree, and grading a run that does not exist would write a score
// for work nobody did. stopLesson() clears the timers, reloads progress and puts
// the student back on the map, which is where the ← Map button sends them anyway.
function beginStep(stepIdx) {
    currentStepIdx = stepIdx;
    currentStep = currentRuns[stepIdx];
    // ⚠️ BEFORE ANY TIMER ARMS. armRunMode() sets practiceRun, which decides
    // whether this run pays at all — settled before the first keystroke can be
    // counted, not after.
    armRunMode(stepIdx);
    if (!currentStep) {
        console.warn('[TTB] beginStep: run ' + stepIdx + ' does not exist in a ' +
                     currentRuns.length + '-run lesson — returning to the map.');
        stopLesson();
        return;
    }

    introPanel.classList.add('hidden');
    // ⚠️ THIS LINE IS THE BLANK SCREEN. (v2.4.0)
    //
    // learn.html ships `<div id="active-drill" class="hidden">`, and until now
    // the ONLY line in this file that removed that class was inside
    // showIntro(). startLesson() has a resume path that deliberately skips the
    // intro — it hides #intro-panel and calls beginStep() directly — so on that
    // path #drill-view was shown with BOTH of its children hidden. A student
    // clicked a lesson and got nothing: no error, no console warning, no
    // keyboard, nothing to describe beyond "it went white".
    //
    // It fired only for a student who had a saved checkpoint for the lesson
    // they clicked, which is why WHICH lesson you picked decided whether the
    // app worked. Continue → a lesson they were mid-way through → blank.
    // A different card → no checkpoint → intro → fine. That was the "luck".
    //
    // ⚠️ GENERALISE: A VIEW-STATE INVARIANT ENFORCED BY THE COMMON PATH IS NOT
    // ENFORCED. showIntro() was the only writer, so it read as the owner of
    // that class, and the second entry point inherited an obligation nothing
    // stated. beginStep() now asserts the whole drill view for itself rather
    // than trusting whatever ran before it. resume-path-test.mjs asserts that
    // every path reaching beginStep() leaves both children resolved.
    //
    // ⚠️ v2.5.0 DELETED THE PATH THAT EXPOSED THIS, AND THE GUARD STAYS ANYWAY.
    // Jake's whole-lesson ruling removed the resume branch in startLesson(), so
    // nothing reaches beginStep() past showIntro() today except the Game Genie.
    // The invariant is about what beginStep() owes its caller, not about which
    // caller happened to catch it out — the next entry point added here should
    // find the drill view already correct rather than inherit an unstated
    // obligation, which is precisely how this defect was born.
    activeDrill.classList.remove('hidden');
    // Restore active-drill to normal flow (was kept visible but hidden during intro)
    activeDrill.style.position = '';
    activeDrill.style.top = '';
    activeDrill.style.left = '';
    activeDrill.style.width = '';
    activeDrill.style.height = '';
    activeDrill.style.opacity = '';
    activeDrill.style.pointerEvents = '';
    drillModal.classList.add('hidden');

    // Keyboard was pre-built during intro — only rebuild if it somehow ended up empty
    if (drillKeyboard.querySelectorAll('.key').length === 0) {
        console.warn('[TTB] beginStep: keyboard empty, rebuilding (pre-build failed)');
        createKeyboard(drillKeyboard, LAYOUT);
        createHandGuide(drillKeyboard, fingerMap, LAYOUT, true);
    }
    drillKeyboard.focus();

    // Progress pips — one per run, so a chunked step shows its parts
    stepProgressEl.innerHTML = currentRuns.map((r, i) => {
        const cls = i < stepIdx ? 'done' : i === stepIdx ? 'active' : '';
        return `<div class="step-pip ${cls}"></div>`;
    }).join('');
    stepLabelEl.textContent = currentStep.label || `Step ${stepIdx + 1}`;

    // The run carries its own baked sequence (see buildRunList).
    drillSequence = currentStep.sequence.slice();
    drillPos  = 0;
    mistakes  = 0;
    chars     = 0;
    resetStepLogWatermark();            // new run: nothing logged yet

    // v2.5.0 — the mid-run resume that used to live here is gone; see
    // startLesson(). A run always begins at character zero with clean counters.
    drillCharStates     = new Array(drillSequence.length).fill('upcoming');
    drillLetterStatus   = 'clean';
    drillBackspaceOrigin = -1;
    drillConsecutiveMistakes = 0;
    drillIsHardStop = false;
    stepStartTime = Date.now();
    // ⚠️ v2.5.1 — THIS LINE WAS THE OUTAGE. v2.5.0 deleted the checkpoint system
    // and the local `resume` object with it, but left this reference standing:
    //     stepSeconds = resume ? (resume.stepSeconds || 0) : 0;
    // learn.js is an ES module, so it is strict mode, so reading an undeclared
    // identifier is a ReferenceError — not undefined. beginStep() therefore threw
    // on EVERY lesson start, from all eight of its call sites, after the intro
    // panel was hidden and #active-drill unhidden but BEFORE startGradedTimer()
    // and the first renderDrill(). An empty drill view: no text, no timer, no
    // error a student can report. Identical to the v2.4.0 symptom and strictly
    // worse in reach, because v2.4.0 needed a saved checkpoint to trigger and
    // this needed only a click.
    //
    // ⚠️ GENERALISE: deleting a system means deleting its READERS, not just its
    // writers. `resume` had no declaration left to grep for — the only thing that
    // could still see it was undefined-calls-test.mjs, which parses every shipped
    // file for exactly this and reported it on the very next run. RUN THE SUITE.
    // A round that deletes a subsystem is the round most likely to need it.
    //
    // A run always starts at zero seconds now. There is nothing to carry in.
    stepSeconds   = 0;
    resetStepLogWatermark();

    learnActiveSeconds = 0;
    learnLastInputTime = 0;
    clearInterval(timerInterval);
    clearInterval(learnTickInterval);

    startGradedTimer();

    // The second interval that used to live here is GONE (v2.10.0).
    // startGradedTimer() above is now the only tick in this file.
    //
    // ⚠️ PAINT ONCE NOW (v2.10.1). The tick draws every second, but a student
    // opening a drill would otherwise stare at learn.html's placeholder for up to
    // a full second before their real totals appeared.
    renderTimeHUD();

    renderDrillText();
    advanceHandGuide();

    // Set up keypress handling
    drillKeyboard.onkeydown = handleDrillKey;
    // Defer focus until after the browser has painted the keyboard.
    // Then immediately verify it rendered — if not, rebuild right away
    // rather than waiting for the 2-second periodic check.
    // Single rAF for focus — keyboard was pre-built during intro so no timing games needed
    requestAnimationFrame(() => {
        drillKeyboard.focus();
        _hideKeyboardRecovery();
    });

    // Show a static anchor hint below the step label when anchorEnforced is true.
    // This replaces the reactive popup — it informs without alarming.
    const anchorHint = document.getElementById('anchor-hint');
    if (anchorHint) {
        if (currentStep.anchorEnforced && (currentLesson.anchorKeys || []).length) {
            anchorHint.textContent = '💡 Rest your other fingers lightly on the home keys between strokes.';
            anchorHint.style.display = 'block';
        } else {
            anchorHint.style.display = 'none';
        }
    }
}

function buildSequence(step) {
    switch (step.type) {
        // ⚠️ `|| ''` ADDED v2.4.0. This was the one case in the switch without
        // it — every sibling already had `step.text || ''` or `step.keySet ||
        // []` — so a key_pattern step with no text threw a TypeError out of
        // buildSequence, up through buildRunList, and out of renderMap, which
        // had already blanked the container. The corpus is clean today and
        // lessons-admin.js v1.9.0 now rejects the shape at import, but this is
        // the last line of defence and it costs two characters.
        case 'key_pattern':
            return (step.text || '').split('');
        case 'key_pattern_auto':
            return generateReachPattern(step.keySet || [], step.groupSize || 4, step.groupCount || 10);
        case 'key_random':
            return generateRandom(step.keySet || [], step.groupSize || 4, step.groupCount || 12);
        case 'word_list':
            return (step.words || []).join(' ').split('');
        case 'sentence_list':
            return (step.sentences || []).join(' ').split('');
        case 'passage':
            return (step.text || '').split('');
        default:
            return [];
    }
}

// Which step types are pure key drills. These are graded on accuracy only — speed
// on random letter groups is not a meaningful measure of anything, and gating it
// made the new-key drill the hardest thing in its own lesson.
// Expand authored steps into the run list the engine executes.
function buildRunList(lesson) {
    const runs = [];
    (lesson.steps || []).forEach((step, stepIdx) => {
        const chunks = chunkSequence(buildSequence(step));
        chunks.forEach((seq, chunkIdx) => {
            runs.push({
                stepId:     step.id,
                stepIdx,
                chunkIdx,
                chunkCount: chunks.length,
                type:       step.type,
                anchorEnforced: !!step.anchorEnforced,
                gates:      step.gates || null,   // per-step override, optional
                // Baked, not regenerated. key_random and key_pattern_auto produce a
                // fresh random sequence every call, so a run has to carry its own
                // characters — otherwise a resume would restore a position into a
                // different sequence.
                sequence:   seq,
                label:      chunks.length > 1
                    ? (step.label || `Step ${stepIdx + 1}`) + ` (${chunkIdx + 1}/${chunks.length})`
                    : (step.label || `Step ${stepIdx + 1}`),
            });
        });
    });
    return runs;
}

// Generates a reach pattern: reach→home→reach→home groups for each new key,
// then mixed groups that interleave all keys together.
// Example with g/h: gfgf jhjh fggf jhhj gfhj fgjh fhgj ...
function generateReachPattern(keySet, groupSize, groupCount) {
    if (!keySet.length) return [];
    groupSize = groupSize || 4;
    groupCount = groupCount || 10;

    // Split into reach keys and home keys (some lessonsets may be pure home row)
    const reachKeys = keySet.filter(k => REACH_HOME_COMPANION[k.toLowerCase()]);
    const homeKeys  = keySet.filter(k => !REACH_HOME_COMPANION[k.toLowerCase()]);

    // Build companion pairs: each reach key paired with its home companion
    const pairs = reachKeys.map(k => ({
        reach: k,
        home: REACH_HOME_COMPANION[k.toLowerCase()]
    }));

    // If no reach keys, fall through to pure random
    if (!pairs.length) return generateRandom(keySet, groupSize, groupCount);

    const groups = [];

    // Phase 1: isolated pairs — reach home reach home for each key separately
    // e.g. gfgf, jhjh
    pairs.forEach(({reach, home}) => {
        const g = [];
        for (let i = 0; i < groupSize; i++) g.push(i % 2 === 0 ? reach : home);
        groups.push(g);
    });

    // Phase 2: reversed pairs — home reach reach home (tests finding the reach from home)
    // e.g. fggf, jhhj
    pairs.forEach(({reach, home}) => {
        const g = [];
        for (let i = 0; i < groupSize; i++) {
            if (i === 0 || i === groupSize - 1) g.push(home);
            else g.push(reach);
        }
        groups.push(g);
    });

    // Phase 3: cross pairs — mix all keys together
    // e.g. gfhj fgjh hgfj
    const allKeys = reachKeys.concat(pairs.map(p => p.home)).concat(homeKeys);
    const uniqueKeys = [...new Set(allKeys)];
    const remaining = groupCount - groups.length;
    for (let i = 0; i < remaining; i++) {
        // ⚠️ v2.23.0 — PHASE 3 IS RANDOM AND THEREFORE FILTERED TOO. Phases 1 and
        // 2 above are DETERMINISTIC — reach/home alternations built from the key
        // pairs — so they cannot spell anything a lesson author did not choose,
        // and are deliberately left alone. This phase draws freely and can.
        const { group: g, exhausted, matched } = safeGroup(() => {
            const g2 = [];
            // Shuffle-ish: pick keys ensuring reach keys appear often
            for (let j = 0; j < groupSize; j++) {
                const pool = j % 2 === 0 ? reachKeys : uniqueKeys;
                g2.push(pool[Math.floor(Math.random() * pool.length)]);
            }
            return g2;
        });
        if (exhausted) {
            console.warn(`[drill-filter] pattern phase 3 cannot avoid "${matched}" ` +
                         `at groupSize ${groupSize} — using it anyway.`);
        }
        groups.push(g);
    }

    // Flatten with spaces between groups
    const chars = [];
    groups.forEach((g, i) => {
        if (i > 0) chars.push(' ');
        g.forEach(c => chars.push(c));
    });
    return chars;
}

function expandKeySetWithHomeCompanions(keySet) {
    // For each reach key in the set, automatically include its home-row companion
    // so students must use correct finger placement and not cheat with index fingers.
    const expanded = new Set(keySet);
    keySet.forEach(k => {
        const companion = REACH_HOME_COMPANION[k.toLowerCase()];
        if (companion) expanded.add(companion);
    });
    return Array.from(expanded);
}

function generateRandom(keySet, groupSize, groupCount) {
    if (!keySet.length) return [];
    // Always include home companions for reach keys
    const effectiveKeySet = expandKeySetWithHomeCompanions(keySet);
    const chars = [];
    for (let g = 0; g < groupCount; g++) {
        if (g > 0) chars.push(' ');
        // ⚠️ v2.23.0 — EACH GROUP IS DRAWN THROUGH THE FILTER. safeGroup()
        // redraws the WHOLE group if it spells something, which is rejection
        // sampling: every allowed group stays exactly as likely relative to
        // every other as it was, so the drill still teaches the finger
        // sequences it was built to teach. Changing one offending letter
        // instead would bias it away from them. drill-filter.js Part E.
        //
        // ⚠️ THIS TOUCHES NO COUNTER, NO TIMER AND NO FLUSH. It is text
        // generation only, called while a drill is being BUILT, before any of
        // it is on screen and long before a keystroke is counted.
        const { group, exhausted, matched } = safeGroup(() => {
            const g2 = [];
            for (let i = 0; i < groupSize; i++) {
                g2.push(effectiveKeySet[Math.floor(Math.random() * effectiveKeySet.length)]);
            }
            return g2;
        });
        // ⚠️ AN EXHAUSTED BUDGET IS LOGGED AND THE GROUP IS STILL USED. It means
        // this key set cannot produce a clean group at this size — a lesson
        // configuration problem for Jake, NOT a reason to stop a child typing.
        // A drill that never appears is worse than one that briefly spells
        // something. drill-filter.js Part D.
        if (exhausted) {
            console.warn(`[drill-filter] key set cannot avoid "${matched}" at ` +
                         `groupSize ${groupSize} — using it anyway. Check this lesson.`);
        }
        group.forEach(c => chars.push(c));
    }
    return chars;
}

// ─── Keypress Handler ─────────────────────────────────────────────────────────
function handleDrillKey(e) {
    // Ignore modifier keys
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    if (e.key === 'CapsLock') return;

    // ⚠️ A MODIFIER COMBO IS NOT A KEYSTROKE THIS DRILL GETS TO HAVE. (v2.21.1)
    //
    // THE DEFECT, reported by Jake: you cannot hard-refresh in School, and you
    // can in Library. There is a modifier guard in front of the preventDefault()
    // just below — and it is the ONLY one. Cmd+R arrives here as `e.key === 'r'`,
    // length 1, so it walks straight past that guard, falls into the printable-
    // character branch, and hits the UNCONDITIONAL `e.preventDefault()` at the
    // bottom of the typing path. The refresh is cancelled AND an `r` is typed
    // into the drill and scored against the student.
    //
    // game.js is not better written here, it is merely luckier: it cancels
    // nothing for a modifier combo, so the page reloads before the stray `r`
    // can matter. The reload is the reason its bug is invisible.
    //
    // ⚠️ THIS RETURNS RATHER THAN JUST SKIPPING THE CANCEL, and the difference
    // is the scored character. Ctrl+R, Cmd+T, Cmd+Tab, Ctrl+Shift+I: none of
    // them is the student typing, and none of them belongs in drillCharStates.
    // Shift is deliberately NOT in this list — Shift+A is how you type a
    // capital, and half the lessons drill exactly that.
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // ⚠️ SAME FIREFOX QUICK FIND FIX AS game.js 3.9.3. This handler is bound to
    // #drill-keyboard, which is a DIV — a div does not absorb keystrokes the way an
    // <input> does, so Firefox is still free to act on anything we do not cancel.
    // `'` opens Quick Find (links only) and `/` opens Quick Find, and lessons drill
    // punctuation deliberately. Cancel everything we consume; never cancel a
    // modifier combo, or Ctrl+R and Cmd+Tab stop working.
    if (!e.ctrlKey && !e.metaKey && !e.altKey &&
        (e.key.length === 1 || e.key === 'Tab' || e.key === 'Enter' ||
         e.key === 'Backspace')) {
        e.preventDefault();
    }

    const anchors = (currentStep?.anchorEnforced && currentLesson?.anchorKeys) || [];

    // Silently consume anchor key presses — but never block the key the drill
    // is currently asking for. key_pattern_auto adds home companions (e.g. d for e,
    // k for i) which appear in anchorKeys but must be typeable when required.
    if (anchors.length && e.key.length === 1 && anchors.includes(e.key.toLowerCase())) {
        const expectedNow = drillSequence[drillPos];
        if (e.key !== expectedNow) { e.preventDefault(); return; }
    }

    // Anchor key reminder is shown as a static hint (not reactive) — see beginStep()

    if (drillPos >= drillSequence.length) return;
    const expected = drillSequence[drillPos];

    // If in hard stop, only the correct key resumes — anything else is ignored
    if (drillIsHardStop) {
        const expected = drillSequence[drillPos];
        const typed = (e.key === 'Enter') ? '\n' : (e.key === 'Tab') ? '\t' : (e.key.length === 1 ? e.key : null);
        if (typed === expected) {
            drillIsHardStop = false;
            drillConsecutiveMistakes = 0;
            // Clear the hard stop overlay and re-enable timer
            const hsEl = document.getElementById('drill-hardstop');
            if (hsEl) hsEl.remove();
            clearInterval(timerInterval);
            startGradedTimer();
            learnLastInputTime = Date.now();
            // Now process the correct key normally
            flashFingerPressed(drillKeyboard);
            if (drillLetterStatus === 'clean')      drillCharStates[drillPos] = 'perfect';
            else if (drillLetterStatus === 'fixed') drillCharStates[drillPos] = 'fixed';
            else                                     drillCharStates[drillPos] = 'dirty';
            drillPos++;
            if (drillBackspaceOrigin >= 0 && drillPos <= drillBackspaceOrigin) {
                drillLetterStatus = 'fixed';
            } else { drillBackspaceOrigin = -1; drillLetterStatus = 'clean'; }
            renderDrillText();
            if (drillPos >= drillSequence.length) { finishStep(); return; }
            advanceHandGuide();
            updateHUD();
        }
        e.preventDefault(); return;
    }

    let typed = '';
    if (e.key === 'Enter')     typed = '\n';
    else if (e.key === 'Tab')  typed = '\t';
    else if (e.key === 'Backspace') {
        if (drillLetterStatus === 'error') {
            // First backspace: clear current error, become 'fixed'
            drillLetterStatus = 'fixed';
            if (drillBackspaceOrigin < 0) drillBackspaceOrigin = drillPos;
            renderDrillText(false);  // re-render without error highlight
        } else if (drillPos > 0) {
            // Additional backspaces: step back, mark status fixed
            if (drillBackspaceOrigin < 0) drillBackspaceOrigin = drillPos;
            drillPos--;
            drillLetterStatus = 'fixed';
            drillCharStates[drillPos] = 'upcoming'; // un-done the char we stepped back to
            renderDrillText();
            advanceHandGuide();
        }
        e.preventDefault(); return;
    } else if (e.key.length === 1) {
        typed = e.key;
    } else {
        e.preventDefault(); return;
    }
    e.preventDefault();

    // Idle-resume space skip: if the student was idle (> LEARN_IDLE_THRESHOLD)
    // and the current position is a space, skip it once so they don't have to
    // type a space as their first character back. During active typing every
    // space is required as normal.
    const wasIdle = learnLastInputTime > 0 && (Date.now() - learnLastInputTime) > LEARN_IDLE_THRESHOLD;
    // ⚠️⚠️ v2.41.0 — ROADMAP 31. THE SKIP MOVES drillPos, SO THE SKIP MUST REPAINT.
    //
    // This block advanced past the space and returned to the caller with the
    // keyboard still painted for the character it had just skipped:
    // advanceHandGuide() is the ONLY thing that moves the target highlight, the
    // hand guide and #space-hint, and nothing on this path called it. The last
    // paint happened at the end of the PREVIOUS keystroke, when the space really
    // was the target — so the space bar kept `space-active` and its two thumb
    // circles while the game had already moved on to the next letter. Jake's
    // students photographed exactly that: "the two dots appeared on the space bar
    // when the game expected the first letter of the following word."
    //
    // ⚠️ advanceHandGuide() CANNOT SELF-CORRECT HERE AND MUST NOT BE MADE TO.
    // Its space-clearing line is guarded `if (ch !== ' ')` — "Clear space-active
    // only when moving away from a space, not when landing on one." That guard is
    // right. The defect was never in the painter; it was a mutation that did not
    // call it.
    //
    // ⚠️ GUARDED ON drillPos HAVING MOVED, NOT ON wasIdle. A repaint at an
    // unchanged position is a no-op today and a flicker the first time somebody
    // gives the highlight a transition.
    //
    // ⚠️⚠️ THE INVARIANT, AND IT IS BIGGER THAN THIS BLOCK: EVERY MUTATION OF
    // drillPos IS FOLLOWED BY A PAINT. Guarding this one line leaves the next one
    // open, and this is the third position/paint divergence in this file.
    // tests/drill-paint-test.mjs asserts the invariant, not the call.
    if (wasIdle && drillPos < drillSequence.length && drillSequence[drillPos] === ' ') {
        const posBeforeSkip = drillPos;
        drillPos++;
        if (drillPos >= drillSequence.length) { finishStep(); return; }
        if (drillPos !== posBeforeSkip) advanceHandGuide();
    }
    const newExpected = drillSequence[drillPos];

    chars++;
    if (typed === newExpected) {
        flashFingerPressed(drillKeyboard);
        drillConsecutiveMistakes = 0; // reset on any correct key
        learnLastInputTime = Date.now();
        statsData.charsToday++;  statsData.charsWeek++; statsData.charsSchool++;

        if (drillLetterStatus === 'clean')       drillCharStates[drillPos] = 'perfect';
        else if (drillLetterStatus === 'fixed')  drillCharStates[drillPos] = 'fixed';
        else                                     drillCharStates[drillPos] = 'dirty';

        drillPos++;

        // Keep 'fixed' status until we re-pass the backspace origin
        if (drillBackspaceOrigin >= 0 && drillPos <= drillBackspaceOrigin) {
            drillLetterStatus = 'fixed';
        } else {
            drillBackspaceOrigin = -1;
            drillLetterStatus = 'clean';
        }

        renderDrillText();
        if (drillPos >= drillSequence.length) {
            finishStep();
            return;
        }
        advanceHandGuide();
    } else {
        mistakes++;
        drillConsecutiveMistakes++;
        learnLastInputTime = Date.now();
        statsData.mistakesToday++; statsData.mistakesWeek++; statsData.mistakesSchool++;
        if (newExpected !== ' ') {
            missedChars[newExpected] = (missedChars[newExpected] || 0) + 1;
        }
        if (drillLetterStatus === 'clean') drillLetterStatus = 'error';
        flashTargetKey();
        renderDrillText(true);

        // v2.0.0 removed a `learnLastInputTime = 0` here. Its comment said it
        // stopped the clock at DRILL_STOP_TIME_THRESHOLD to protect the score, but
        // learnLastInputTime drives the *time-on-task* counter, not the graded one.
        // The effect was that a struggling student stopped earning credit toward
        // their daily goal while the graded clock kept running — penalised twice,
        // protected never. The graded clock now pauses on idle (startGradedTimer)
        // and the hard stop below stops it outright, so nothing is left to do here.

        if (!ggAllowMistakes && drillConsecutiveMistakes >= DRILL_SPAM_THRESHOLD) {
            const stepIdx = currentStepIdx;
            clearInterval(timerInterval);
            clearInterval(learnTickInterval);
            const hsEl = document.getElementById('drill-hardstop');
            if (hsEl) hsEl.remove();
            setTimeout(() => beginStep(stepIdx), 400);
            return;
        }
        if (!ggAllowMistakes && drillConsecutiveMistakes >= DRILL_HARD_STOP_THRESHOLD) {
            drillIsHardStop = true;
            clearInterval(timerInterval);
            _showHardStopOverlay(newExpected);
        }
    }
    updateHUD();
}

// Maintain a set of currently held keys
const heldKeys = new Set();
window.addEventListener('keydown', e => { if (e.key.length === 1) heldKeys.add(e.key.toLowerCase()); });
window.addEventListener('keyup',   e => { if (e.key.length === 1) heldKeys.delete(e.key.toLowerCase()); });



function flashTargetKey() {
    const expected = drillSequence[drillPos];
    if (!expected) return;
    const info = getFingerInfo(fingerMap, expected);
    if (!info) return;
    const el = document.getElementById(`key-${info.keyChar}`);
    if (!el) return;
    const orig = el.style.backgroundColor;
    el.style.backgroundColor = '#c62828';
    setTimeout(() => { el.style.backgroundColor = orig; }, 200);
}

// ─── Render Drill Text ────────────────────────────────────────────────────────
function renderDrillText(showError = false) {
    const seq = drillSequence;

    // Render exactly like the book: every character (including space) is the same
    // .dt-char inline-block span with identical min-width and padding.
    // State classes change color only — never dimensions.
    // Groups of non-space chars are wrapped in a nowrap container so CSS
    // line-wrapping never splits a group mid-character. Each trailing space
    // is attached to the end of its preceding group so lines never start
    // with a bare space.

    // Build groups: each group is a run of chars ending with optional space
    const groups = [];
    let cur = [];
    seq.forEach((ch, i) => {
        cur.push({ch, i});
        if (ch === ' ') {
            groups.push(cur);
            cur = [];
        }
    });
    if (cur.length) groups.push(cur);

    let html = '';
    groups.forEach(group => {
        // Wrap group in nowrap so it never splits across lines
        html += '<span style="display:inline-block;white-space:nowrap;">';
        group.forEach(({ch, i}) => {
            // Space displays as &nbsp; — invisible but identical width to any letter
            const disp = (ch === ' ') ? '&nbsp;' : (ch === '\n' ? '↵' : escHtml(ch));
            let cls;
            if (i === drillPos) {
                const errClass = (showError || drillLetterStatus === 'error') ? 'dt-error' : 'dt-current';
                cls = 'dt-char ' + errClass;
                html += '<span class="' + cls + '" id="dt-cursor">' + disp + '</span>';
                return;
            }
            const state = drillCharStates[i] || 'upcoming';
            if      (state === 'perfect')  cls = 'dt-char dt-done';
            else if (state === 'fixed')    cls = 'dt-char dt-fixed';
            else if (state === 'dirty')    cls = 'dt-char dt-dirty';
            else                           cls = 'dt-char dt-upcoming';
            // Spaces: add background-tint class so the state is visible (text is invisible)
            if (ch === ' ' && state === 'fixed') cls += ' dt-space-fixed';
            if (ch === ' ' && state === 'dirty') cls += ' dt-space-dirty';
            html += '<span class="' + cls + '">' + disp + '</span>';
        });
        html += '</span>';
    });

    drillTextEl.innerHTML = html;

    // Scroll cursor into view
    requestAnimationFrame(() => {
        centerDrillView();
    });
}

// ─── Center current character vertically — mirrors game.js centerView() ───────
function centerDrillView() {
    const cursor  = document.getElementById('dt-cursor');
    const textEl  = drillTextEl;
    const areaEl  = document.getElementById('drill-text-area');
    if (!cursor || !textEl || !areaEl) return;
    const cursorTop  = cursor.offsetTop;
    const areaHeight = areaEl.clientHeight;
    const targetTop  = Math.round(areaHeight / 2 - cursorTop - cursor.offsetHeight / 2);
    textEl.style.top = targetTop + 'px';
}


function advanceHandGuide() {
    if (drillPos >= drillSequence.length) return;
    const ch = drillSequence[drillPos];
    setHandGuideToChar(drillKeyboard, fingerMap, LAYOUT, ch);
    const info = getFingerInfo(fingerMap, ch);
    toggleKeyboardCase(drillKeyboard, info?.shift || false);

    // Highlight target key. Space bar uses space-active only (shows thumb circles).
    // 'target' is for letter keys only — adding it to space caused persistent dots.
    // Clear space-active only when moving away from a space, not when landing on one
    if (ch !== ' ') {
        const spaceKey = drillKeyboard.querySelector('.key.space');
        if (spaceKey) spaceKey.classList.remove('space-active', 'space-pressed');
    }

    drillKeyboard.querySelectorAll('.key').forEach(k => k.classList.remove('target'));
    if (ch !== ' ' && info) {
        const el = Array.from(drillKeyboard.querySelectorAll('[data-char]'))
            .find(k => k.dataset.char === info.keyChar);
        if (el) el.classList.add('target');
    }
    // space-active is set by setHandGuideToChar (called above) — no extra work needed

    // Space bar cue: show a small hint so students don't wonder what to press
    const spaceHint = document.getElementById('space-hint');
    if (spaceHint) spaceHint.style.visibility = (ch === ' ') ? 'visible' : 'hidden';
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
// `chars` counts every keystroke including wrong ones, because that is the correct
// denominator for accuracy. It was also the WPM numerator, which meant errors
// *raised* reported speed: three deliberate mistakes could turn a failing 14 WPM
// perfect run into a passing 15 WPM one. WPM is now net — correct keystrokes only.
function netWPM() {
    if (stepSeconds <= 0) return 0;
    const correct = Math.max(0, chars - mistakes);
    return Math.round((correct / 5) / (stepSeconds / 60));
}
function accuracyPct() {
    return chars > 0 ? Math.round(((chars - mistakes) / chars) * 100) : 100;
}

function updateHUD() {
    wpmDisplay.textContent = netWPM();
    accDisplay.textContent = accuracyPct() + '%';
}

// ─── Session records for a run ───────────────────────────────────────────────
//
// ⚠️ ONE RUN CAN PRODUCE SEVERAL RECORDS. (v2.8.0, DESIGN-TELEMETRY §7 step 1.5)
// A run used to be recorded only when it finished, so a run abandoned halfway —
// the bell, a lid, a toggle over to Library — left time in the counters with
// nothing behind it. logOpenRun() closes the open run without ending it, and
// this function writes only what has not been written yet.
//
// The counters are module-level and describe the current run: `stepSeconds` (the
// graded clock, which only advances once a character has been typed and the
// student is not idle), `chars` and `mistakes`.
//
// ⚠️ A ZERO DELTA IS NORMAL, NOT AN ERROR. Two hides in a row, or a hide
// immediately followed by finishStep(), produce nothing the second time.
// ⚠️⚠️ v2.40.0 — ROADMAP 6, THE SCHOOL HALF. `dateOverride` exists for exactly one
// caller: the tick's midnight rollover, which must file the seconds typed BEFORE
// midnight against the day they were typed on. Every other caller passes
// nothing and gets today, which is correct for them.
function logRun(wpm, acc, detailSuffix, dateOverride) {
    // ⚠️ v2.21.0 — THE OLD LINE READ `currentUser ? currentUser.uid : …` AND ITS
    // COMMENT SAID "a true guest has no account yet". Both were wrong about the
    // same fact: a guest IS signed in, anonymously, so `currentUser` is NOT null
    // and their runs were filed under a throwaway anonymous uid that no report
    // can attribute and no later flush ever names. They go to the shared guest
    // slot now and are handed to the real account by
    // retroactiveSaveAnonSession(). Matches game.js v3.36.0.
    const sessionUid = (currentUser && !currentUser.isAnonymous) ? currentUser.uid
                     : (sessionExpired && lastKnownUid) ? lastKnownUid
                     : GUEST_QUEUE_UID;

    const dSeconds  = Math.max(0, Math.round(stepSeconds - stepLoggedSeconds));
    const dChars    = Math.max(0, Math.round(chars       - stepLoggedChars));
    const dMistakes = Math.max(0, Math.round(mistakes    - stepLoggedMistakes));
    if (dSeconds <= 0 && dChars <= 0) return;

    const continuation = stepLoggedSeconds > 0 || stepLoggedChars > 0;
    // The 5-second floor guards against trivial standalone records only; the tail
    // of an already-recorded run is the rest of something real. session-log.js
    // v1.2.0 enforces the same distinction.
    if (dSeconds < 5 && !continuation) return;

    // ⚠️ A CONTINUATION'S WPM MUST DESCRIBE THE CONTINUATION. The caller's
    // figures describe the whole run, and the report's per-run 🚩 marker reads
    // these numbers as belonging to the row they sit on.
    let outWPM = wpm, outAcc = acc;
    if (continuation) {
        const correct = Math.max(0, dChars - dMistakes);
        outWPM = dSeconds > 0 ? Math.round((correct / 5) / (dSeconds / 60)) : 0;
        outAcc = dChars > 0 ? Math.round((correct / dChars) * 100) : 100;
    }

    sessionLogPush(sessionUid, {
        // ⚠️ STAMPED NOW, NOT AT FLUSH TIME. See session-log.js.
        // ⚠️ ROADMAP 6 — the outgoing day when the tick is closing a run across
        // midnight; today for every other caller.
        date: dateOverride || getLocalDateStr(),
        at: new Date().toISOString(),
        seconds: dSeconds,
        chars: dChars,
        mistakes: dMistakes,
        wpm: outWPM,
        accuracy: outAcc,
        source: 'school',
        label: (currentLesson && currentLesson.id) || '',
        detail: 'run ' + (currentStepIdx + 1) + (detailSuffix ? ' ' + detailSuffix : ''),
        ...(continuation ? { continuation: true } : {}),
        // ⚠️⚠️ v2.36.0 — THE STAMP THAT MAKES THIS RECORD HONEST.
        //
        // The minutes belong to the child and are filed unchanged. But this
        // sprint carries the LESSON'S id and a run number, because the drill
        // borrows the lesson's engine — so without this field it is byte-for-byte
        // indistinguishable from a real run of that lesson, and ROADMAP 15's
        // reconstruction would grade it as one.
        //
        // ⚠️ RECORDS WRITTEN BEFORE v2.36.0 DO NOT HAVE IT and cannot be
        // recovered — run-grade.js isAssessedSprint() treats an unstamped record
        // as assessed, which is the only safe default going forward and is
        // WRONG for the existing archive. ROADMAP 15 says what that costs.
        ...(remediationRun ? { practice: 'remediation' } : {}),
    });

    stepLoggedSeconds  = Math.max(stepLoggedSeconds,  Math.round(stepSeconds));
    stepLoggedChars    = Math.max(stepLoggedChars,    Math.round(chars));
    stepLoggedMistakes = Math.max(stepLoggedMistakes, Math.round(mistakes));
}

// ⚠️ UPLOAD QUEUED SESSION RECORDS NOW, WITHOUT A FULL FLUSH. (v2.9.0)
// Identical to game.js flushSessionsNow() and shipped with it — read that
// function's header for the defect (Reports showed n-1 sessions) and for why this
// is deliberately outside the 60-second rate limit.
function flushSessionsNow() {
    if (!currentUser) return;
    if (sessionLogPending(currentUser.uid) === 0) return;
    sessionLogFlush(currentUser.uid, {
        email: currentUser.email || '',
        displayName: currentUser.displayName || 'Anonymous',
        classId: (classInfo && classInfo.id) || '',
        schoolId: (classInfo && classInfo.schoolId) || '',
    }).catch(e => console.warn('[sessions] immediate flush failed:', e));
}

// Close the open run WITHOUT ending it. Counters are untouched, so a student who
// comes back and finishes the run has only the remainder recorded.
// ─── ROADMAP 9, FIRST BULLET (v2.43.0) — THE DAY ROLLOVER IS REACHABLE NOW ────
//
// ⚠️⚠️ NOT NEW CODE, AND THE TWIN OF game.js's rollDayIfNeeded(). This is the
// tick's midnight rollover moved here verbatim so that something other than a
// counted second can reach it. The tick calls it at exactly the point the block
// used to occupy, so every ordering constraint the block carried is preserved by
// construction rather than by re-derivation. READ THOSE CONSTRAINTS AT THE CALL
// SITE before moving it — in this file the block must also sit above
// `anonSecondsAccum++` and `armAnonLoginPrompt()`, both day-scoped the same way.
//
// ⚠️ THE BUG IT CLOSES. The rollover fired only on a counted second, so a tab
// that woke on a new day and flushed, or painted, WITHOUT the student typing was
// working from yesterday's day counters — and the flush stamps its document with
// getLocalDateStr(), i.e. TODAY. Round 26 closed the MERGE path that produced
// the two measured student rows; it did not close the FLUSH path, and nothing
// has since. game.js's copy of this comment carries the figures.
//
// ⚠️ KEEP THE TWO COPIES IDENTICAL IN SHAPE. game.js and learn.js have drifted
// on this exact path before: ROADMAP 9 records that the two tick loops already
// disagree about whether they increment before or after their midnight check.
// midnight-test.mjs Part B2 asserts that BOTH files have more than one caller.
//
// Returns true when a day actually turned over, so a caller can repaint.
function rollDayIfNeeded(reason) {
    const todayStr = getLocalDateStr();
    // ⚠️ A MISSING lastDate IS NOT A ROLLOVER. An unseeded statsData has no day
    // to roll OUT of, and treating it as one would file an open run against
    // `undefined` and zero counters that were never loaded.
    if (!statsData.lastDate || statsData.lastDate === todayStr) return false;

    logOpenRun('midnight', statsData.lastDate);
    console.log(`Day rolled over (${reason}): ${statsData.lastDate} → ${todayStr}. Resetting daily stats.`);
    statsData.secondsToday = 0; statsData.charsToday = 0; statsData.mistakesToday = 0;
    // ⚠️ v2.20.0 — THE PER-SOURCE COUNTERS ROLL OVER WITH THE DAY. The
    // Library triple resets to 0 — it is seeded from a document that
    // is now the wrong day and this page never adds to it.
    // ⚠️ v2.40.0 — SCHOOL'S RESETS TO 0 NOW, NOT 1. The second that
    // just elapsed has not been counted yet at this point in the
    // tick; the increments below add it, to the new day, once.
    statsData.secondsSchool = 0; statsData.charsSchool = 0; statsData.mistakesSchool = 0;
    statsData.secondsLibrary = 0; statsData.charsLibrary = 0; statsData.mistakesLibrary = 0;
    statsData.lastDate = todayStr; dailyGoalCelebrated = false;
    const ws = getWeekStart(new Date());
    if (statsData.weekStart !== ws) {
        // ⚠️ v2.40.0 — 0, not 1, for the same reason as above.
        statsData.secondsWeek = 0; statsData.charsWeek = 0; statsData.mistakesWeek = 0;
        statsData.weekStart = ws; weeklyGoalCelebrated = false;
    }
    return true;
}

function logOpenRun(reason, dateOverride) {
    if (stepSeconds <= 0 && chars <= 0) return;
    logRun(netWPM(), accuracyPct(), reason ? '(' + reason + ')' : '(interrupted)',
           dateOverride);
}

// ═════════════════════════════════════════════════════════════════════════════
// "I'M DONE" (ROADMAP item 0d) — the School half
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ IDENTICAL IN SHAPE TO game.js's handleImDone(), AND IT MUST STAY THAT WAY.
// A child moving between School and Library should not find that the same button
// behaves differently. receipt.js owns the card so the two cannot drift the way
// four other twins did on 2026-08-21 — see HANDOFF §0.-13.E before copying
// anything out of this function into that one.
//
// ⚠️ THE TAB HAZARD IS WHY THE MARKUP LOOKS THE WAY IT DOES. ROADMAP item 8 put
// the reading-font control on the MAP rather than in the drill, because a
// focusable control inside the drill view is one Tab away from eating a
// keystroke the child should have been credited for. "I'm done" has the opposite
// requirement — they are IN the drill when the bell rings — so learn.html gives
// it `tabindex="-1"`: Tab can never reach it, the mouse always can.
let _doneInFlight = false;
async function handleImDone() {
    if (_doneInFlight) return;          // twelve-year-olds double-click
    _doneInFlight = true;
    const btn = document.getElementById('done-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    try {
        logOpenRun('done');
        await flushStats('done', true);
        const dateStr = getLocalDateStr(new Date());
        let week = null, ok = true;
        if (currentUser) {
            try {
                week = await readWeek({ db, doc, getDoc, uid: currentUser.uid, dateStr });
                ok = !!(week && week.ok);
            } catch (_) { ok = false; }
        }
        // A failed read still shows the card, marked short. The flush already
        // happened — see game.js's copy of this comment for why that matters.
        showReceipt(week || { dates: [dateStr], byDate: {} }, dateStr, !ok);
    } catch (e) {
        console.warn("I'm done failed:", e);
        const dateStr = getLocalDateStr(new Date());
        showReceipt({ dates: [dateStr], byDate: {} }, dateStr, true);
    } finally {
        _doneInFlight = false;
        if (btn) { btn.disabled = false; btn.textContent = "I'm done"; }
    }
}

// ─── Finish Step ─────────────────────────────────────────────────────────────
function finishStep() {
    clearInterval(timerInterval);
    clearInterval(learnTickInterval);
    drillKeyboard.onkeydown = null;
    const spaceHint = document.getElementById('space-hint');
    if (spaceHint) spaceHint.style.visibility = 'hidden';
    const anchorHint = document.getElementById('anchor-hint');
    if (anchorHint) anchorHint.style.display = 'none';
    saveStats(); // write time to Firestore

    const wpm = netWPM();
    const acc = accuracyPct();

    // ⚠️ THE FIRST SESSION RECORD THIS FILE HAS EVER WRITTEN. (v2.6.0)
    //
    // game.js has logged sprint detail since v3.4.0; School logged none, so a
    // student who spends the period in lessons leaves a daily minute total with
    // nothing underneath it — no per-run WPM, no timeline, nothing to check work
    // against or to notice a suspicious jump in. A run is the lesson-mode
    // equivalent of a sprint and needs no new shape to store.
    //
    // Pushed for an EXPIRED SESSION too: session-log.js writes to localStorage
    // and needs no live token, so there is no reason to discard a run typed in
    // the window a token happened to lapse in — which is precisely the window a
    // teacher most wants a record of. A true guest is still skipped; they have
    // no account for the record to belong to.
    // ⚠️ v2.8.0 — this used to be an inline sessionLogPush(). It is now logRun(),
    // which writes a DELTA against the watermark, because logOpenRun() may already
    // have recorded part of this same run when the student hid the tab or toggled
    // to Library. Writing the run total here after a partial would file that
    // stretch twice.
    logRun(wpm, acc);

    // ⚠️⚠️ v2.36.0 — THE REMEDIATION DRILL LEAVES BEFORE EITHER MODAL.
    //
    // ⚠️ THE BRANCH IS HERE, NOT INSIDE showLessonResultModal(), AND THE
    // DIFFERENCE IS LOAD-BEARING. Both modals write: showLessonResultModal()
    // calls recordRunOutcome() AND saveProgress(), and showStepModal() calls
    // recordRunOutcome(). A guard in the first one alone would still grade every
    // drill that chunks into more than one run — and a missed-key set large
    // enough to chunk is exactly the student this button exists for. Branching
    // above the isLastRun fork is the only placement that covers both.
    //
    // saveStats() and logRun() have already run, so the minutes are banked in
    // both records before this returns.
    if (remediationRun) {
        renderRemediationResult(wpm, acc);
        return;
    }

    const isLastRun = currentStepIdx >= currentRuns.length - 1;

    if (isLastRun) {
        showLessonResultModal(wpm, acc);
    } else {
        showStepModal(wpm, acc, currentStepIdx + 1, currentRuns.length);
    }
}

function showStepModal(wpm, acc, nextIdx, totalSteps) {
    drillModal.classList.remove('hidden');
    document.getElementById('drill-keyboard-wrap').style.display = 'none';

    const gates    = gatesForRun(currentStep, currentLesson && currentLesson.gates);
    const minWPM   = gates.minWPM;
    const minAcc   = gates.minAccuracy;
    const grade    = calculateGrade(wpm, acc, minWPM, minAcc, mistakes === 0);
    const canAdvance = gradeAdvances(grade, gates);

    recordRunOutcome(currentStepIdx, grade, canAdvance);

    document.getElementById('dm-title').textContent = 'Step ' + nextIdx + ' of ' + totalSteps + ' done';
    document.getElementById('dm-stars').innerHTML = gradeHTML(grade) + runScorePill(currentStepIdx);

    const dailyBadge = (goals.dailySeconds > 0 && statsData.secondsToday >= goals.dailySeconds)
        ? '<span class="goal-badge goal-blue">\u2713</span>' : '';
    const weeklyBadge = (goals.weeklySeconds > 0 && statsData.secondsWeek >= goals.weeklySeconds)
        ? '<span class="goal-badge goal-blue">\u2713</span>' : '';

    // The target shown is the one actually being enforced. On a key drill that is
    // accuracy, and no WPM target is shown at all — displaying a number the run is
    // not graded on is what taught students to chase the wrong thing.
    document.getElementById('dm-stats').innerHTML =
        '<div class="dm-stat"><div class="dm-val">' + wpm + '</div><div class="dm-label">WPM</div></div>' +
        '<div class="dm-stat"><div class="dm-val">' + acc + '%</div><div class="dm-label">Accuracy</div></div>' +
        '<div class="dm-stat"><div class="dm-val" style="font-size:1.4rem;">' + minAcc + '%+</div>' +
        '<div class="dm-label">Target</div></div>' +
        (minWPM != null
            ? '<div class="dm-stat"><div class="dm-val" style="font-size:1.4rem;">' + minWPM + '+</div>' +
              '<div class="dm-label">Target WPM</div></div>'
            : '');

    const stepMsg = getGradeMessage(wpm, acc, minWPM, minAcc, grade);
    const hint = canAdvance
        ? '<span style="color:#888;font-size:0.8rem;font-family:monospace;">press Enter to continue</span>'
        : '<span style="color:#e65100;font-size:0.85rem;">' + escHtml(stepMsg) + ' (Enter to try again)</span>';
    document.getElementById('dm-msg').innerHTML =
        '<div class="cumulative-row" style="font-size:0.78rem;margin-bottom:4px;">' +
        dailyBadge + '<span>Today: ' + formatTime(statsData.secondsToday) + '</span>' +
        '<span class="cumulative-sep">|</span>' +
        '<span>This week: ' + formatTime(statsData.secondsWeek) + '</span>' +
        weeklyBadge + '</div>' + hint;
    document.getElementById('dm-remediation').innerHTML = '';

    const btns = document.getElementById('dm-btns');
    btns.innerHTML = '';

    // Define handler ONCE (not inside if/else) to avoid hoisting issues
    // that cause stale listeners to accumulate across steps
    var stepAction = null;
    function stepKeyHandler(e) {
        if (e.key === 'Enter') { e.preventDefault(); if (stepAction) stepAction(); }
    }
    document.addEventListener('keydown', stepKeyHandler);

    function cleanup() {
        document.removeEventListener('keydown', stepKeyHandler);
        drillModal.classList.add('hidden');
        document.getElementById('drill-keyboard-wrap').style.display = '';
    }

    const mapBtn = document.createElement('button');
    mapBtn.className = 'dm-btn-secondary'; mapBtn.textContent = '\u2190 Map';
    mapBtn.onclick = function() { cleanup(); stopLesson(); };
    btns.appendChild(mapBtn);

    if (canAdvance) {
        const next = document.createElement('button');
        next.className = 'dm-btn-primary'; next.textContent = 'Next Step \u2192 (Enter)';
        stepAction = function() { cleanup(); beginStep(nextIdx); };
        next.onclick = stepAction;
        btns.appendChild(next);
    } else {
        const retry = document.createElement('button');
        retry.className = 'dm-btn-primary'; retry.textContent = 'Try Again (Enter)';
        stepAction = function() { cleanup(); beginStep(nextIdx - 1); };
        retry.onclick = stepAction;
        btns.appendChild(retry);
    }
}

// ⚠️ v2.36.0 — ROADMAP 15. The remediation drill's end screen.
//
// ⚠️ IT IS NOT renderPracticeResult(). That screen says "nothing was recorded",
// which would be FALSE here — the minutes were recorded, in both records. A
// child who typed for four minutes and is told it did not count will stop
// pressing the button, and the button is the one thing in this app that responds
// to what they personally got wrong.
//
// So: their numbers, an honest line about what happened to them, and no grade
// badge — because no grade was earned. There is nothing to grade against; a
// drill built from three letters the student missed is not the lesson.
function renderRemediationResult(wpm, acc) {
    const title = document.getElementById('dm-title');
    if (title) title.textContent = '\uD83C\uDFB2 Practice Done';

    const stars = document.getElementById('dm-stars');
    if (stars) stars.innerHTML = '';

    const stats = document.getElementById('dm-stats');
    if (stats) stats.innerHTML =
        '<div class="dm-stat"><div class="dm-val">' + wpm + '</div><div class="dm-label">WPM</div></div>' +
        '<div class="dm-stat"><div class="dm-val">' + acc + '%</div><div class="dm-label">Accuracy</div></div>';

    const msg = document.getElementById('dm-msg');
    if (msg) msg.innerHTML =
        '<div style="font-size:0.85rem;color:#555;">Extra practice on the keys you missed \u2014 ' +
        'your time counted, and this one is not graded. Nice work.</div>' +
        '<div class="cumulative-row" style="font-size:0.78rem;margin-top:4px;">' +
        '<span>Today: ' + formatTime(statsData.secondsToday) + '</span>' +
        '<span class="cumulative-sep">|</span>' +
        '<span>This week: ' + formatTime(statsData.secondsWeek) + '</span>' +
        '</div>';

    const rem = document.getElementById('dm-remediation');
    if (rem) rem.innerHTML = '';

    // ⚠️ NO "TRY AGAIN" AND NO "NEXT STEP". currentRuns holds the synthetic
    // drill, so beginStep() from here would replay or overrun the drill rather
    // than move through the lesson. Both ways out rebuild the real run list:
    // startLesson() for another go at the lesson, stopLesson() for the map.
    const btns = document.getElementById('dm-btns');
    if (btns) {
        btns.innerHTML = '<button id="dm-rem-again" class="dm-btn-secondary">Play the lesson again</button>' +
                         '<button id="dm-rem-done" class="dm-btn-primary">\u2190 Map</button>';
        const again = document.getElementById('dm-rem-again');
        const done  = document.getElementById('dm-rem-done');
        const lesson = currentLesson;
        if (again) again.onclick = () => {
            drillModal.classList.add('hidden');
            document.getElementById('drill-keyboard-wrap').style.display = '';
            if (lesson) startLesson(lesson); else stopLesson();
        };
        if (done) done.onclick = () => {
            drillModal.classList.add('hidden');
            document.getElementById('drill-keyboard-wrap').style.display = '';
            stopLesson();
        };
    }

    drillModal.classList.remove('hidden');
    document.getElementById('drill-keyboard-wrap').style.display = 'none';
}

// ⚠️ v2.32.0 — ROADMAP 10. The practice run's end screen. It shows the student
// exactly what they did and then stops. No grade badge, because no grade was
// earned; no "press Enter to continue", because there is no progression to
// continue along; and no remediation links, because nothing here was assessed.
function renderPracticeResult(wpm, acc, grade) {
    const stats = document.getElementById('dm-stats');
    if (stats) stats.innerHTML =
        '<div class="dm-stat"><div class="dm-val">' + wpm + '</div><div class="dm-label">WPM</div></div>' +
        '<div class="dm-stat"><div class="dm-val">' + acc + '%</div><div class="dm-label">Accuracy</div></div>';
    const msg = document.getElementById('dm-msg');
    if (msg) msg.innerHTML =
        '<div style="font-size:0.85rem;color:#555;">\u2b50 Practice run \u2014 nothing was recorded. ' +
        'Nice typing.</div>';
    const rem = document.getElementById('dm-remediation');
    if (rem) rem.innerHTML = '';

    // Two ways out, both back to the map. ⚠️ NO "next step" BUTTON: a practice
    // run does not advance through the lesson, because advancing is the thing
    // that would need recording.
    const btns = document.getElementById('dm-btns');
    if (btns) {
        btns.innerHTML = '<button id="dm-practice-again">Play it again</button>' +
                         '<button id="dm-practice-done" class="primary">Back to lessons</button>';
        const again = document.getElementById('dm-practice-again');
        const done  = document.getElementById('dm-practice-done');
        if (again) again.onclick = () => { drillModal.classList.add('hidden'); startLesson(currentLesson); };
        if (done)  done.onclick  = () => { drillModal.classList.add('hidden'); stopLesson(); };
    }
    drillModal.classList.remove('hidden');
}

function showLessonResultModal(wpm, acc) {
    const gates  = gatesForRun(currentStep, currentLesson && currentLesson.gates);
    const minWPM = gates.minWPM;
    const minAcc = gates.minAccuracy;

    const grade  = calculateGrade(wpm, acc, minWPM, minAcc, mistakes === 0);
    const passed = gradeAdvances(grade, gates);

    // ⚠️⚠️ v2.32.0 — ROADMAP 10. A PRACTICE RUN WRITES NOTHING, ANYWHERE.
    //
    // Not a grade, not a run outcome, not a session record, not an attempt, not
    // a second. The modal still shows the student their WPM and accuracy —
    // ⚠️ THEY ARE NOT BEING PUNISHED AND THE SCREEN MUST NOT ACT LIKE IT — but
    // nothing leaves this function.
    //
    // ⚠️ THE THREE OMISSIONS ARE ONE DECISION, AND SPLITTING THEM IS THE BUG.
    // A run recorded in typing_logs but not typing_sessions (or the reverse) is
    // precisely the divergence signature ROADMAP item 4's implausibility flag
    // exists to catch — this feature would MANUFACTURE the anomaly the report is
    // built to find. Recorded in NEITHER, the two stay in perfect agreement,
    // because the run does not exist in either of them. There is nothing to
    // disagree about.
    //
    // ⚠️ AND IT IS WHAT MAKES THE RE-LOCK IN lesson-gate.js COHERENT: a practice
    // run cannot earn the A🔥 that would re-lock the lesson, because it cannot
    // earn anything at all.
    if (practiceRun) {
        renderPracticeResult(wpm, acc, grade);
        return;
    }

    // Record the run BEFORE saveProgress, so the cumulative time and run maps it
    // spreads forward already include this run.
    recordRunOutcome(currentStepIdx, grade, passed);

    // v2.0.0: an F now writes a record too. It previously wrote nothing, so the
    // students in the most trouble were the ones who left no trace at all.
    const countsAsTime = true;

    // Hint toward next grade
    const gradeHint = getGradeMessage(wpm, acc, minWPM, minAcc, grade);
    if (currentUser && countsAsTime) {
        saveProgress(passed, wpm, acc, grade);
    } else if (!currentUser && countsAsTime) {
        // Accumulate guest lesson progress for retroactive save on sign-in.
        // anonLessonsCompleted went with the old trigger — it was the "2 lessons"
        // half of a condition that no longer exists, and an incrementing counter
        // nobody reads is how dead state accumulates.
        const prev = anonLessonProgress[currentLesson.id];
        const prevGrade = prev ? (prev.grade || 'F') : 'F';
        const bestGrade = GRADE_ORDER.indexOf(grade) > GRADE_ORDER.indexOf(prevGrade) ? grade : prevGrade;
        anonLessonProgress[currentLesson.id] = {
            lessonId: currentLesson.id,
            completedAt: new Date().toISOString(),
            attempts: (prev ? prev.attempts || 0 : 0) + 1,
            finalWPM: wpm, finalAccuracy: acc,
            timeSpentSeconds: (prev ? prev.timeSpentSeconds || 0 : 0) + stepSeconds,
            passed: passed || (prev ? prev.passed || false : false),
            grade: bestGrade,
            stars: bestGrade === FIRE_GRADE || bestGrade === 'A' ? 3 : bestGrade === 'B' ? 2 : bestGrade === 'C' ? 1 : 0,
        };
        persistGuestAccum();   // v2.4.0 — survives the tab; see anonLessonProgress
        checkAnonLoginPrompt();
    }

    drillModal.classList.remove('hidden');
    document.getElementById('drill-keyboard-wrap').style.display = 'none';

    var titleMap = {};
    titleMap[FIRE_GRADE] = String.fromCodePoint(0x1F525) + ' On Fire!';
    titleMap['A']     = '\uD83C\uDF89 Excellent!';
    titleMap['B']     = '\u2713 Lesson Complete!';
    titleMap['C']     = '\u2713 Lesson Complete!';
    titleMap['D']     = 'Almost \u2014 Try Once More';
    titleMap['F']     = 'Not Yet';
    document.getElementById('dm-title').textContent = titleMap[grade] || 'Done';
    document.getElementById('dm-stars').innerHTML = gradeHTML(grade) + runScorePill(currentStepIdx);
    const rdBadge = (goals.dailySeconds > 0 && statsData.secondsToday >= goals.dailySeconds)
        ? '<span class="goal-badge goal-blue" title="Daily goal!">✓</span>' : '';
    const rwBadge = (goals.weeklySeconds > 0 && statsData.secondsWeek >= goals.weeklySeconds)
        ? '<span class="goal-badge goal-blue" title="Weekly goal!">✓</span>' : '';
    document.getElementById('dm-stats').innerHTML =
        rdBadge +
        '<div class="dm-stat"><div class="dm-val">' + wpm + '</div><div class="dm-label">WPM</div></div>' +
        '<div class="dm-stat"><div class="dm-val">' + acc + '%</div><div class="dm-label">Accuracy</div></div>' +
        '<div class="dm-stat"><div class="dm-val" style="font-size:1.4rem;">' + minAcc + '%+</div><div class="dm-label">Target</div></div>' +
        (minWPM != null
            ? '<div class="dm-stat"><div class="dm-val" style="font-size:1.4rem;">' + minWPM + '+</div><div class="dm-label">Target WPM</div></div>'
            : '') +
        rwBadge;

    const msg = 'You got ' + wpm + ' WPM at ' + acc + '% accuracy.' + (gradeHint ? ' ' + gradeHint : '');
    document.getElementById('dm-msg').innerHTML =
        escHtml(msg) +
        '<div class="cumulative-row" style="font-size:0.78rem;margin-top:4px;">' +
        '<span>Today: ' + formatTime(statsData.secondsToday) + '</span>' +
        '<span class="cumulative-sep">|</span>' +
        '<span>This week: ' + formatTime(statsData.secondsWeek) + '</span>' +
        '</div>';

    // Remediation links for missed chars. Same qualifying set buildRemediationLinks()
    // uses, so the button (when it renders) and the keys it's wired to always agree.
    const remMissedKeys = _qualifyingRemediationChars().slice(0, 3).map(([ch]) => ch);
    const remText = buildRemediationLinks();
    document.getElementById('dm-remediation').innerHTML = remText;
    // Wire all interactive elements after HTML is inserted
    const pracBtn = document.getElementById('practice-missed-btn');
    if (pracBtn) pracBtn.onclick = () => window._practiceMissedKeys(remMissedKeys);
    document.querySelectorAll('#dm-remediation a[data-lesson-id]').forEach(a => {
        a.href = '#';
        a.onclick = e => { e.preventDefault(); window._gotoLesson(a.dataset.lessonId); };
    });

    const btns = document.getElementById('dm-btns');
    btns.innerHTML = '';

    // Enter key shortcut for primary action
    const enterResultHandler = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.removeEventListener('keydown', enterResultHandler);
            primaryAction();
        }
    };
    document.addEventListener('keydown', enterResultHandler);

    let primaryAction;
    if (passed) {
        const nextLesson = getNextLesson();
        primaryAction = () => {
            document.removeEventListener('keydown', enterResultHandler);
            if (nextLesson) { startLesson(nextLesson); }
            else { window.location.href = 'index.html'; }
        };
        const nextBtn = document.createElement('button');
        nextBtn.className = 'dm-btn-primary';
        nextBtn.textContent = nextLesson ? 'Next Lesson → (Enter)' : '📚 Go to Library';
        nextBtn.onclick = primaryAction;
        const mapBtnP = document.createElement('button');
        mapBtnP.className = 'dm-btn-secondary'; mapBtnP.textContent = '← Map';
        mapBtnP.onclick = () => {
            document.removeEventListener('keydown', enterResultHandler);
            stopLesson();
        };
        btns.appendChild(mapBtnP); // left
        btns.appendChild(nextBtn); // right
    } else {
        // v2.0.0: retry THIS run. The old code called startLesson(), which reset
        // currentStepIdx to 0 and replayed the intro \u2014 so missing the gate on the
        // last step of a five-step lesson meant redoing all five. At a 50% per-run
        // pass rate that turned a 5-run lesson into ~18 runs of work.
        const retryIdx = currentStepIdx;
        primaryAction = () => {
            document.removeEventListener('keydown', enterResultHandler);
            drillModal.classList.add('hidden');
            document.getElementById('drill-keyboard-wrap').style.display = '';
            beginStep(retryIdx);
        };
        const retryBtn = document.createElement('button');
        retryBtn.className = 'dm-btn-primary'; retryBtn.textContent = 'Try Again (Enter)';
        retryBtn.onclick = primaryAction;
        const mapBtnF = document.createElement('button');
        mapBtnF.className = 'dm-btn-secondary'; mapBtnF.textContent = '← Map';
        mapBtnF.onclick = () => {
            document.removeEventListener('keydown', enterResultHandler);
            stopLesson();
        };
        btns.appendChild(mapBtnF); // left
        btns.appendChild(retryBtn); // right
    }
}

// ⚠️ THE REMEDIATION VARIETY FLOOR (v2.12.0). Mirrors game.js's variety floor
// (PRACTICE_CHAR_MISS_THRESHOLD / PRACTICE_MIN_QUALIFYING_CHARS) exactly, for
// the same reason: a single letter missed enough times to clear the per-letter
// threshold is not "a pattern of tricky letters," it's one letter, and the
// "🎲 Practice missed keys" button built a synthetic key_random drill out of
// just that one letter before this floor existed. Checked in TWO places, on
// purpose — buildRemediationLinks() so the button is never even rendered
// before the pattern is real, and window._practiceMissedKeys() so nothing that
// calls it directly can skip the check the button itself enforces.
const REMEDIATION_CHAR_MISS_THRESHOLD = 3;  // a letter must be missed this many times to "count"
const REMEDIATION_MIN_QUALIFYING_CHARS = 3; // and at least this many different letters must qualify
// ⚠️ v2.13.1 — THE FILTER ITSELF MOVED TO variety-floor.js. Same numbers, same
// behavior; this is now a one-line wrapper naming learn.js's own threshold
// constants, kept so every existing call site is untouched. game.js's
// `_qualifyingPracticeChars()` is its twin — see variety-floor.js.
function _qualifyingRemediationChars() {
    return qualifyingChars(missedChars, REMEDIATION_CHAR_MISS_THRESHOLD);
}

function buildRemediationLinks() {
    const qualifying = _qualifyingRemediationChars();
    if (!qualifying.length) return '';

    const top = qualifying.slice(0, 3);
    const missedKeys = top.map(([ch]) => ch);

    const links = top.map(([ch]) => {
        const introLesson = allLessons.find(l => (l.newKeys || []).includes(ch));
        if (!introLesson) return null;
        return '<a href="#" data-lesson-id="' + introLesson.id + '">' + ch.toUpperCase() + ' (' + escHtml(introLesson.title) + ')</a>';
    }).filter(Boolean);

    const linkText = links.length
        ? 'You often missed: ' + links.join(', ') + ' — revisit these?'
        : '';

    // Practice button — store keys in data attribute to avoid quoting nightmares.
    // ⚠️ Gated behind the variety floor: a single dominant letter gets a lesson
    // link above, but not a synthetic drill built from it alone.
    const hasVariety = qualifying.length >= REMEDIATION_MIN_QUALIFYING_CHARS;
    const practiceBtn = hasVariety
        ? '<button class="dm-btn-secondary" style="margin-top:6px;width:100%;font-size:0.8rem;padding:7px;" '
          + 'id="practice-missed-btn">🎲 Practice missed keys</button>'
        : '';

    return linkText + practiceBtn;
}

window._practiceMissedKeys = function(missedKeys) {
    if (!missedKeys || !missedKeys.length) return;
    // ⚠️ THE REMEDIATION VARIETY FLOOR (v2.12.0) — same gate buildRemediationLinks()
    // applies before ever showing the button, checked again here so nothing that
    // reaches this function directly (a bug, a stray event handler, a bypassed
    // UI) can skip it. Re-derived from missedChars rather than trusting the
    // missedKeys argument, so a caller can't route around the check by passing
    // a short-but-valid-looking array.
    if (_qualifyingRemediationChars().length < REMEDIATION_MIN_QUALIFYING_CHARS) return;
    // Build a synthetic key_random step from the missed keys
    const syntheticStep = {
        id: 'remediation',
        label: 'Practice: ' + missedKeys.map(k => k.toUpperCase()).join(' '),
        type: 'key_random',
        keySet: missedKeys,
        groupSize: 5,
        groupCount: 14,
        anchorEnforced: false,
    };
    drillModal.classList.add('hidden');
    document.getElementById('drill-keyboard-wrap').style.display = '';
    // v2.0.0: replace the run list rather than mutating currentLesson.steps. The old
    // swap-and-restore worked only because beginStep read steps synchronously; runs
    // make the intent explicit and leave the lesson object alone. Chunked in case
    // the missed-key set produces a long drill.
    // ⚠️ ROADMAP 23 — the list stops belonging to currentLesson on the NEXT line,
    // so the pairing is broken here, deliberately and visibly, before it is.
    currentRunsFor = REMEDIATION_RUNS;
    currentRuns = chunkSequence(buildSequence(syntheticStep)).map((seq, i, all) => ({
        stepId: 'remediation', stepIdx: 0, chunkIdx: i, chunkCount: all.length,
        type: syntheticStep.type, anchorEnforced: false, gates: null, sequence: seq,
        label: syntheticStep.label + (all.length > 1 ? ` (${i + 1}/${all.length})` : ''),
    }));
    // ⚠️⚠️ v2.36.0 — SET BEFORE beginStep(). THIS DRILL IS NOT A RUN OF THE
    // LESSON AND MUST NOT BE GRADED AS ONE.
    //
    // Until v2.36.0 it was. currentLesson is deliberately left alone above (the
    // student is still "in" the lesson), so everything downstream read this
    // drill as the lesson's run 1: logRun() filed a typing_sessions sprint under
    // the lesson's id labelled "run 1"; recordRunOutcome(0, …) banked mastery
    // points into the real runScores["0"] and wrote runCount: 1 over a 12-run
    // lesson's count; and saveProgress() marked the WHOLE LESSON passed with the
    // drill's grade. And because a synthetic step is key_random, gatesForRun()
    // returns minWPM: null — accuracy only — so a clean 83-character run of
    // random letters scored A🔥 and could unlock the next lesson.
    remediationRun = true;
    beginStep(0);
};

window._gotoLesson = function(id) {
    const lesson = allLessons.find(l => l.id === id);
    if (lesson) startLesson(lesson);
};

// ─── Progress Persistence ────────────────────────────────────────────────────
// ─── Run-level instrumentation (v2.1.0, Batch B) ─────────────────────────────
// Before this, lessonProgress was written from exactly one place: the final run's
// result modal, and only when the grade wasn't F. A student stuck on run 2 of 12
// therefore wrote NOTHING — and rendered in the admin per-student grid as
// "not started", indistinguishable from a student who never opened the lesson. The
// failure mode the whole audit was about was the one the data couldn't show.
//
// Writes are queued, not immediate. learn.js v1.7.0 was explicitly a write-reduction
// release, and firing a document write on all 176 runs would undo it. These ride the
// existing coalesced flush (5-min timer, visibilitychange, beforeunload), so the
// added Firestore cost is zero writes per run and one merge per lesson per flush.
//
// Counters are computed from userProgress, which loadProgress() already populated at
// page load, so no extra reads either. Two devices at once would clobber rather than
// sum — same as the pre-existing attempts counter, and not worth a transaction.
const pendingProgress = new Set();   // lessonIds with unflushed run data

// ⚠️⚠️ v2.39.0 — ROADMAP 23. THE STRUCTURAL GUARD, NOT A SECOND FLAG.
//
// The Round 41 defect: four writers read `currentLesson`, none checked that
// `currentRuns` still belonged to it, and the symptom was a GRADE rather than an
// error. `remediationRun` fixed the one path that broke the pairing in v2.36.0 —
// but that is a flag for a KNOWN detour. Any future feature that swaps the run
// list re-opens the hazard silently, and a wrong grade on a child's record is
// the thing that gets discovered weeks later from a report.
//
// ⚠️ THE ROADMAP PROPOSED COMPARING LENGTHS —
// `currentRuns.length !== buildRunList(currentLesson).length` — AND THAT WOULD
// HAVE BEEN THE WRONG GUARD, TWICE OVER:
//   1. buildSequence() is RANDOM per call for key_random and key_pattern_auto
//      (see buildRunList's own note on why sequences are baked). Recomputing to
//      compare invites a false positive, and a false positive here REFUSES TO
//      RECORD A REAL RUN — silent data loss, strictly worse than the hazard.
//   2. A swap that happens to produce the same number of runs passes it. The
//      remediation drill on a 3-chunk lesson would.
// The pairing token answers the actual question — "was this list built for this
// lesson?" — in O(1), with no recomputation and no randomness.
//
// ⚠️ A FIRING GUARD MEANS A BUG UPSTREAM, so it refuses the write rather than
// filing a run against a lesson it may not belong to. It cannot fire today:
// finishStep() returns at the remediation branch before reaching either writer.
function runsBelongToCurrentLesson(where) {
    if (!currentLesson) return false;
    if (currentRunsFor === currentLesson.id) return true;
    console.error(
        `[ROADMAP 23] ${where}: currentRuns was built for ` +
        `${currentRunsFor === REMEDIATION_RUNS ? 'a remediation drill' : String(currentRunsFor)}` +
        `, not lesson ${currentLesson.id}. Refusing to record — this is a bug, ` +
        `not a student action.`);
    return false;
}

function recordRunOutcome(runIdx, grade, advanced) {
    if (!currentLesson) return;
    if (!runsBelongToCurrentLesson('recordRunOutcome')) return;
    const id   = currentLesson.id;
    const prev = userProgress[id] || {};
    const key  = String(runIdx);

    const runAttempts = Object.assign({}, prev.runAttempts);
    const runFailures = Object.assign({}, prev.runFailures);
    runAttempts[key] = (runAttempts[key] || 0) + 1;
    if (!advanced) runFailures[key] = (runFailures[key] || 0) + 1;

    // ⚠️⚠️ v2.34.0 — ROADMAP 14. THE POINTS ARE BANKED HERE, ON THE RUN,
    // WHERE THE GRADE ALREADY IS. This is the line item 13 was about: the student
    // is shown a fireball for a RUN, and `fireCount` only ever counted a LESSON —
    // which is why Jake's own record read `lastGrade: "A🔥"` beside
    // `fireCount: 0` after three fireballs in a row. Scoring the run counts the
    // thing the screen actually shows fire for.
    //
    // ⚠️ A PRACTICE RUN NEVER REACHES THIS FUNCTION — finishStep() returns at
    // the practiceRun branch first — so a mastered run cannot re-lock itself by
    // being replayed. That is what makes the reach-back window escapable at all.
    const runScores = Object.assign({}, prev.runScores);
    const before    = runScoreOf(prev, runIdx);
    const after     = before + pointsForGrade(grade);
    runScores[key]  = after;

    // ⚠️⚠️ v2.36.0 — ROADMAP 15, THE FORWARD HALF. THE GRADE IS STORED WHERE IT
    // IS EARNED, so it never has to be reconstructed again.
    //
    // Jake: *"the report didn't share the grades (where I could have counted the
    // number of flaming A's)."* runScores above cannot answer that — it is a
    // SUM, so 2 points is one A🔥 or two A's and nothing can tell them apart
    // afterwards. These two fields can:
    //
    //   runGrades[k] — the BEST grade seen on run k. Best, not last, because
    //                  that is what `grade` has always meant on this record and
    //                  a report showing two different senses of the word is
    //                  worse than one showing neither.
    //   runFires[k]  — how many times run k was A🔥. The countable thing.
    //
    // ⚠️ COSTS NO NEW READS AND NO NEW WRITES. Both ride the merge that
    // recordRunOutcome() already queues; `prev` is in memory. Item 18's ruling —
    // reads are 50× dearer than writes — is why two fields is the right shape
    // rather than something cleverer that has to be recomputed.
    //
    // ⚠️ DERIVED, NOT AUTHORITATIVE. It is a cache of
    // calculateGrade(gates, wpm, acc); if a lesson's gates ever change, the
    // stored grade outlives them. That is the defect class §0.-14 is about, and
    // it is why reports.html recomputes rather than trusting these, and why the
    // reconstruction refuses a lesson whose runCount has drifted.
    const runGrades = Object.assign({}, prev.runGrades);
    const runFires  = Object.assign({}, prev.runFires);
    runGrades[key]  = betterGrade(grade, runGrades[key] || 'F') || grade;
    if (grade === FIRE_GRADE) runFires[key] = (runFires[key] || 0) + 1;

    // ⚠️ THE LOCK STAMP IS THE CLOCK FOR EVERY LESSON, NOT JUST THIS ONE. Jake:
    // unlock "based on the date of the last lock". Crossing the threshold resets
    // reach-back globally, which is the point — it measures time since the student
    // last PROVED something, not time since they last moved. Stamped ONLY on the
    // crossing, so replaying a mastered run cannot keep pushing it forward.
    const runLocks = Object.assign({}, prev.runLocks);
    if (before < MASTERY_POINTS && after >= MASTERY_POINTS) {
        runLocks[key] = gateActiveDays;
        stampLastLockDay();
    }

    userProgress[id] = Object.assign({}, prev, {
        lessonId: id,
        started: true,
        runCount: currentRuns.length,
        // runCount is stored so a stale map is detectable: editing a lesson changes
        // how it chunks, which shifts every index in runAttempts/runFailures.
        furthestRunIdx: Math.max(prev.furthestRunIdx || 0, runIdx),
        lastRunIdx: runIdx,
        lastGrade: grade,
        lastSeenAt: new Date().toISOString(),
        runAttempts,
        runFailures,
        runScores,
        runGrades,
        runFires,
        runLocks,
        // The real cumulative figure. timeSpentSeconds previously added only the
        // final run's stepSeconds, so it undercounted by the whole rest of the lesson.
        timeSpentSeconds: (prev.timeSpentSeconds || 0) + stepSeconds,
    });

    pendingProgress.add(id);
    learnDirty = true;
    learnWalSave();
}

async function flushLessonProgress() {
    if (!currentUser || pendingProgress.size === 0) return true;
    let ok = true;
    for (const id of Array.from(pendingProgress)) {
        const rec = userProgress[id];
        if (!rec) { pendingProgress.delete(id); continue; }
        try {
            await setDoc(doc(db, 'users', currentUser.uid, 'lessonProgress', id),
                         rec, { merge: true });
            pendingProgress.delete(id);
        } catch (e) { ok = false; console.warn('Lesson progress flush failed:', e); }
    }
    return ok;
}

// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ v2.33.1 — LEAVING A LESSON MUST BANK THE RUN, NOT JUST THE TIME.
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-08-23: *"I finished every single run. I finished the run, got a
// grade, and then clicked back to map. Could the back to map not count as
// finishing? It counted the time and everything."* He was exactly right, and
// his own `lessonProgress` record proves it: `u1_l1` read `attempts: 3`,
// `runAttempts {0:1, 1:2}` after a dozen completed runs.
//
// ⚠️ THE MECHANISM IS NOT THE ONE ROADMAP 14b NAMED, AND THE DIFFERENCE DECIDES
// WHERE THE FIX GOES. 14b said `flushLessonProgress()` has one caller in the
// session-end path and `stopLesson()` never calls it. The first half is wrong —
// the call sits inside `flushStats()`, which also runs on the five-minute
// interval and on every hide — so a write *was* scheduled and *did* fire. What
// killed the run was the line underneath:
//
//     loadUserProgress()   →   userProgress = {}   →   repopulate from cache
//
// `stopLesson()` reloads the map's data on the way out, and `loadUserProgress()`
// opens by EMPTYING `userProgress`. The run outcomes recorded in memory are
// gone before the scheduled flush ever reads them, while `pendingProgress` still
// names the lesson — so the flush finds the freshly-RELOADED record under that
// id and writes that back instead. ⚠️ THE WRITE SUCCEEDS. It reports true, it
// costs a billed write, and it stores the numbers it just read. Nothing
// anywhere logs a failure, which is why this survived a dozen rounds.
//
// ⚠️ AND IT EXPLAINS WHY SOME RUNS SURVIVED. `saveStats()` fires
// `learnWalSave()` before the wipe, so the WAL holds the good record for a
// window; the next `saveStats()` after the reload overwrites it with the stale
// one. Whatever happened to be flushed inside that window landed. That is the
// 4-of-12 in Jake's record, and it is why the loss looked random.
//
// ⚠️ THE "NEXT LESSON →" BUTTON WAS NEVER AFFECTED — it calls `startLesson()`,
// which does not reload progress, so the in-memory record survives to the next
// flush. Only "← Map" loses work. Jake described the losing path precisely.
//
// SO THE ORDER IS THE WHOLE FIX: flush BEFORE the reload, refresh the cache the
// reload is about to read, and carry anything that did NOT land across it.
// ⚠️ A FLUSH ADDED *AFTER* `loadUserProgress()` WOULD READ AS CORRECT AND
// CHANGE NOTHING — it would write the same reloaded copy the old code did.
//
// ⚠️ THE CACHE REFRESH IS NOT TIDINESS. `loadUserProgress()` prefers
// PROGRESS_CACHE_KEY over Firestore, so without `refreshProgressCache()` the
// reload re-installs the pre-run copy from localStorage, the map under-reports
// the attempt it just banked, and the next run computes `prev` from it.
async function exitLessonToMap() {
    // Snapshot BEFORE anything can replace userProgress. Cheap: pendingProgress
    // holds at most the lessons touched since the last flush.
    const held = {};
    for (const id of pendingProgress) {
        if (userProgress[id]) held[id] = userProgress[id];
    }

    const flushed = await flushLessonProgress();
    if (flushed) refreshProgressCache();

    await loadUserProgress();

    // ⚠️ WHATEVER DID NOT LAND STAYS IN MEMORY. An offline Chromebook must not
    // have its unflushed runs quietly replaced by the server copy — that is the
    // defect above with a network error in front of it. `held` is newer by
    // construction, so it wins the merge.
    let carried = 0;
    for (const id of Object.keys(held)) {
        if (!pendingProgress.has(id)) continue;
        userProgress[id] = Object.assign({}, userProgress[id], held[id]);
        carried++;
    }
    if (carried && currentUser) { learnDirty = true; learnWalSave(); }

    renderMap();
    showView('map');
}

// ⚠️ v2.32.0 — ROADMAP 10. THE CLAUSE THAT MAKES PROGRESS RESET THE WINDOW.
//
// Passing a lesson the student had NEVER passed before stamps today's active-day
// count, which collapses reachBack to 0. This is the whole reason the design
// beats a flat cooldown: a child who keeps advancing never accumulates reach-back
// and never sees an old lesson, while a child who stalls earns one more lesson
// behind them per week of trying. **Review reaches the student who needs it and
// withholds itself from the one who is coasting, with neither of them assessed by
// anybody.**
//
// ⚠️ ONLY ON A **FIRST** PASS. Re-passing a lesson already passed must not reset
// the window — that would be farming with extra steps, and it is exactly what
// this feature exists to stop.
// ⚠️⚠️ v2.34.0 — ROADMAP 14. THE CLOCK RUNS FROM THE LAST **LOCK**, NOT THE
// LAST ADVANCE, AND THAT IS JAKE'S RULING. The old stamp fired when a student
// passed a lesson they had never passed before — so a student grinding ONE RUN,
// never advancing, accrued reach-back the entire time they were farming. From
// the last lock, the clock starts only once the student has actually mastered
// something.
//
// ⚠️ CALLED ON THE CROSSING ONLY (see recordRunOutcome), so replaying a mastered
// run cannot keep pushing the window out from under itself.
async function stampLastLockDay() {
    if (!currentUser || currentUser.isAnonymous) return;
    gateLastLockDay = gateActiveDays;
    try {
        await setDoc(doc(db, 'users', currentUser.uid),
                     { lastLockDay: gateActiveDays }, { merge: true });
    } catch (e) { console.warn('[TTB] lock stamp not written:', e); }
}

async function saveProgress(passed, wpm, acc, grade) {
    if (!currentUser || !currentLesson) return;
    // ⚠️ ROADMAP 23 — the second of the two writers. saveProgress() marks the
    // WHOLE LESSON passed, which is the more damaging of the two if the run list
    // it was reached through did not belong to this lesson (see §0.-31.N: a
    // remediation drill marked a 12-run lesson passed on one 83-character run of
    // random letters).
    if (!runsBelongToCurrentLesson('saveProgress')) return;
    const prev = userProgress[currentLesson.id] || {};
    const attempts  = (prev.attempts || 0) + 1;
    // NOT prev + stepSeconds: recordRunOutcome already added this run's seconds to
    // prev.timeSpentSeconds a moment ago. Adding again would double-count the final run.
    const timeSpent = prev.timeSpentSeconds || 0;

    // Keep best grade seen — order: F D C B A A🔥
    const prevGrade   = prev.grade || 'F';
    const bestGrade   = GRADE_ORDER.indexOf(grade) > GRADE_ORDER.indexOf(prevGrade) ? grade : prevGrade;

    // ⚠️ v2.32.0 — ROADMAP 10. fireCount is the ONLY thing that closes a lesson.
    //
    // ⚠️ IT IS SEEDED, NOT MIGRATED. fireCountOf() derives a legacy record's count
    // from the `grade` already stored — no backfill, no migration, no extra write.
    // A student who has earned A🔥 before today starts at 1 and needs two more,
    // because `grade` is best-ever-seen and cannot tell one fire from twenty.
    // Seeding at 3 would have locked a whole class out on deploy morning.
    const prevFire = fireCountOf(prev, FIRE_GRADE);
    const fireCount = grade === FIRE_GRADE ? prevFire + 1 : prevFire;

    // ⚠️ THE RE-LOCK STAMP. Recorded only on the run that reaches mastery or
    // beyond, and it is what makes a reach-back opening ONE SHOT rather than a
    // licence — Jake: "if they fireball lesson 1 after it unlocks, I want it
    // immediately locked again." lesson-gate.js reads it; nothing else does.
    const fireAtDay = (grade === FIRE_GRADE && fireCount >= MASTERY_FIRE_COUNT)
        ? gateActiveDays : prev.fireAtDay;

    const record = {
        // Spread prev first so the run-level fields written by recordRunOutcome
        // survive. saveProgress used setDoc WITHOUT merge, so completing a lesson
        // would otherwise wipe runAttempts/runFailures/furthestRunIdx on the way past.
        ...prev,
        fireCount,
        ...(typeof fireAtDay === 'number' ? { fireAtDay } : {}),
        lessonId: currentLesson.id,
        completedAt: new Date().toISOString(),
        attempts,
        finalWPM: wpm,
        finalAccuracy: acc,
        timeSpentSeconds: timeSpent,
        passed: passed || prev.passed || false,
        grade: bestGrade,
        // Keep stars field for backward compat with old progress records
        stars: bestGrade === 'A🔥' ? 3 : bestGrade === 'A' ? 3 : bestGrade === 'B' ? 2 : bestGrade === 'C' ? 1 : 0,
    };

    // Leap detection flag
    const prevWPM = prev.finalWPM || 0;
    if (prevWPM > 0 && wpm > prevWPM * 1.5) record.leapFlagged = true;

    try {
        await setDoc(
            doc(db, 'users', currentUser.uid, 'lessonProgress', currentLesson.id),
            record, { merge: true }
        );
        userProgress[currentLesson.id] = record;
        pendingProgress.delete(currentLesson.id);   // this write covered it
        // ⚠️ v2.34.0 — stampAdvanceIfNew() IS GONE. The window no longer runs from
        // the last advance; recordRunOutcome() stamps lastLockDay when a run
        // crosses 4 points. Passing a lesson is no longer a clock event.
    } catch(e) { console.warn('Could not save lesson progress:', e); }
}

// ─── Navigation ──────────────────────────────────────────────────────────────
function showView(which) {
    mapView.classList.toggle('hidden', which !== 'map');
    drillView.classList.toggle('hidden', which !== 'drill');
    // ⚠️ THE GEAR IS NOT HIDDEN HERE ANY MORE (v2.28.0 shipped it map-only for a
    // few hours; Jake ruled the same day that pausing is fine). It stays visible
    // in both views, like Library's, and openSchoolSettings() pauses the graded
    // clock while it is open. `ensureSettingsButton()` is idempotent, so there
    // is nothing to toggle here.
}

function stopLesson() {
    showPracticeBanner(false);   // ⚠️ v2.32.0 — the banner is per-run; it must not survive back to the map
    clearInterval(timerInterval);
    clearInterval(learnTickInterval);
    stopIntroAnim();
    drillKeyboard.onkeydown = null;
    // ⚠️ v2.5.0 — BANK THE TIME ON THE WAY OUT. saveStats() used to be reached
    // only from finishStep(), i.e. only when a run COMPLETED. That was survivable
    // while an abandoned lesson left a position checkpoint behind; now that a
    // partial attempt is discarded by design, walking away is the normal way a
    // partial lesson ends, and the minutes still have to count. Jake was explicit:
    // *"it should track the time whether it finishes or not."*
    //
    // The counters themselves were never at risk — the drill tick increments
    // statsData once a second regardless. What was missing was anything to
    // SCHEDULE those seconds for a flush, so they sat in memory until a hide or
    // the 5-minute interval happened to catch them.
    saveStats();
    persistGuestAccum();
    showRestartButton(false);
    currentLesson = null;
    currentRunsFor = null;               // ⚠️ ROADMAP 23 — unpaired when nothing is open.
    backBtn.href = 'index.html'; backBtn.onclick = null;
    hudLessonLabel.textContent = '';
    hudLessonLabel.title = '';
    document.getElementById('drill-keyboard-wrap').style.display = '';
    drillModal.classList.add('hidden');
    wpmDisplay.textContent = '—';
    accDisplay.textContent = '—';
    // ⚠️ v2.33.1 — THIS USED TO BE `loadUserProgress().then(...)` AND THAT LINE
    // IS WHERE THE RUN WENT. See exitLessonToMap()'s header: the reload empties
    // userProgress, so the run outcomes recorded above were destroyed before the
    // scheduled flush could read them. The flush now happens first.
    exitLessonToMap();
}

function getNextLesson() {
    if (!currentLesson) return null;
    const idx = allLessons.findIndex(l => l.id === currentLesson.id);
    return allLessons[idx + 1] || null;
}

// ─── Save stats on page unload ───────────────────────────────────────────────
// Ensures time typed in School is persisted even if student navigates away
// mid-lesson without completing a step (which is when saveStats() normally fires).

// ─── LEARN GAME GENIE (admin only) ───────────────────────────────────────────
function openLearnGenie() {
    if (!currentUser || !ADMIN_EMAILS.includes(currentUser.email)) return;

    // Pause the drill timer while panel is open
    clearInterval(timerInterval);
    clearInterval(learnTickInterval);
    if (drillKeyboard) drillKeyboard.onkeydown = null;

    const lesson    = currentLesson;
    const stepIdx   = currentStepIdx;
    // Runs, not authored steps — beginStep() indexes currentRuns, so the jump list
    // has to match or the genie sends you to the wrong place in a chunked lesson.
    const steps     = (lesson && currentRuns.length) ? currentRuns
                    : (lesson ? buildRunList(lesson) : []);
    const onDrill   = !drillView.classList.contains('hidden');

    const ggS = 'background:#1a1a1a;color:#ff6600;border:1px solid #ff6600;' +
                'padding:4px 10px;cursor:pointer;border-radius:3px;font-family:monospace;' +
                'font-size:0.8em;font-weight:bold;margin:2px;';
    const ggT = 'color:#888;font-size:0.7em;margin-bottom:3px;font-family:monospace;';

    // Lesson dropdown
    const lessonOpts = allLessons.map(l => {
        const prog    = userProgress[l.id] || {};
        const grade   = prog.grade || (prog.passed ? 'B' : '');
        const sel     = lesson && l.id === lesson.id ? ' selected' : '';
        return '<option value="' + l.id + '"' + sel + '>' +
               'U' + l.unit + 'L' + l.lesson + ' ' + escHtml(l.title || l.id) +
               (grade ? ' [' + grade + ']' : '') + '</option>';
    }).join('');

    // Step dropdown
    const stepOpts = steps.map((s, i) =>
        '<option value="' + i + '"' + (i === stepIdx ? ' selected' : '') + '>' +
        'Run ' + (i+1) + ': ' + escHtml(s.label || s.stepId || '') + '</option>'
    ).join('');

    drillModal.classList.remove('hidden');
    document.getElementById('drill-keyboard-wrap').style.display = 'none';
    document.getElementById('dm-title').textContent = '\uD83D\uDD25 GAME GENIE \uD83D\uDD25';
    document.getElementById('dm-stars').innerHTML = '';
    document.getElementById('dm-remediation').innerHTML = '';

    document.getElementById('dm-stats').innerHTML =
        '<div style="font-size:0.75rem;color:#888;font-family:monospace;">' +
        (lesson ? escHtml(lesson.title || lesson.id) : 'No lesson active') +
        (onDrill ? ' — Step ' + (stepIdx+1) + '/' + steps.length : '') +
        '</div>';

    document.getElementById('dm-msg').innerHTML =
        '<div style="font-family:monospace;font-size:0.82em;text-align:left;max-width:420px;margin:0 auto;">' +

        // Lesson jump
        '<div style="margin-bottom:10px;">' +
        '<div style="' + ggT + '">WARP TO LESSON</div>' +
        '<div style="display:flex;gap:4px;align-items:center;">' +
        '<select id="gg-lesson-select" style="flex:1;background:#222;color:#eee;border:1px solid #555;padding:3px 4px;font-family:monospace;font-size:0.82em;border-radius:3px;">' + lessonOpts + '</select>' +
        '<button id="gg-lesson-go" style="' + ggS + '">WARP</button>' +
        '</div>' +
        '</div>' +

        // Step jump (only when on a drill)
        (onDrill && steps.length > 1 ?
        '<div style="margin-bottom:10px;">' +
        '<div style="' + ggT + '">JUMP TO STEP</div>' +
        '<div style="display:flex;gap:4px;align-items:center;">' +
        '<select id="gg-step-select" style="flex:1;background:#222;color:#eee;border:1px solid #555;padding:3px 4px;font-family:monospace;font-size:0.82em;border-radius:3px;">' + stepOpts + '</select>' +
        '<button id="gg-step-go" style="' + ggS + '">GO</button>' +
        '</div>' +
        '</div>' : '') +

        // Lock / unlock current lesson
        (lesson ?
        '<div style="margin-bottom:10px;">' +
        '<div style="' + ggT + '">CURRENT LESSON PROGRESS</div>' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap;">' +
        '<button id="gg-unlock" style="' + ggS + '" title="Mark as passed (grade B)">\u2713 UNLOCK (mark passed)</button>' +
        '<button id="gg-lock" style="' + ggS + 'color:#ff4444;border-color:#ff4444;" title="Delete progress record">\u2717 LOCK (remove progress)</button>' +
        '</div>' +
        '</div>' : '') +

        // Toggles
        '<div style="margin-bottom:10px;">' +
        '<div style="' + ggT + '">TOGGLES</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<label style="display:flex;align-items:center;gap:3px;font-size:0.78em;color:' + (ggAllowMistakes ? '#ff6600' : '#888') + ';cursor:pointer;">' +
        '<input type="checkbox" id="gg-allow-mistakes"' + (ggAllowMistakes ? ' checked' : '') + '> Mistakes OK</label>' +
        '<label style="display:flex;align-items:center;gap:3px;font-size:0.78em;color:' + (ggBypassIdle ? '#ff6600' : '#888') + ';cursor:pointer;">' +
        '<input type="checkbox" id="gg-bypass-idle"' + (ggBypassIdle ? ' checked' : '') + '> No Idle</label>' +
        '</div>' +
        '</div>' +

        '</div>';

    const btns = document.getElementById('dm-btns');
    btns.innerHTML = '';

    function closeGenie() {
        drillModal.classList.add('hidden');
        document.getElementById('drill-keyboard-wrap').style.display = '';
        // Resume if on a drill
        if (onDrill && !drillView.classList.contains('hidden')) {
            // ⚠️ THIS USED TO REBUILD ITS OWN COPY OF THE TICK (v2.10.0), with
            // `ggBypassIdle` defeating the idle gate — which game.js's version of
            // the same flag never did. Admin-only, so no student ever reached it,
            // but it was a third increment site and the two sides disagreed about
            // what one flag meant. startGradedTimer() is now the only tick, and
            // the flag means the same thing on both pages: it suppresses the AFK
            // auto-pause and never defeats the idle gate.
            startGradedTimer();
            drillKeyboard.onkeydown = handleDrillKey;
            drillKeyboard.focus();
        }
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'dm-btn-secondary'; closeBtn.textContent = 'Close (Esc)';
    closeBtn.onclick = closeGenie;
    btns.appendChild(closeBtn);

    function genieEscHandler(e) {
        if (e.key === 'Escape') { document.removeEventListener('keydown', genieEscHandler); closeGenie(); }
    }
    document.addEventListener('keydown', genieEscHandler);

    // Wire lesson warp
    const lessonGoBtn = document.getElementById('gg-lesson-go');
    if (lessonGoBtn) lessonGoBtn.onclick = () => {
        const id = document.getElementById('gg-lesson-select').value;
        const target = allLessons.find(l => l.id === id);
        if (target) { document.removeEventListener('keydown', genieEscHandler); closeGenie(); startLesson(target); }
    };

    // Wire step jump
    const stepGoBtn = document.getElementById('gg-step-go');
    if (stepGoBtn) stepGoBtn.onclick = () => {
        const idx = parseInt(document.getElementById('gg-step-select').value);
        document.removeEventListener('keydown', genieEscHandler);
        drillModal.classList.add('hidden');
        document.getElementById('drill-keyboard-wrap').style.display = '';
        beginStep(idx);
    };

    // Unlock
    const unlockBtn = document.getElementById('gg-unlock');
    if (unlockBtn) unlockBtn.onclick = async () => {
        if (!currentUser || !lesson) return;
        const record = { lessonId: lesson.id, completedAt: new Date().toISOString(),
            passed: true, grade: 'B', adminOverride: true,
            attempts: 1, finalWPM: 0, finalAccuracy: 0, timeSpentSeconds: 0 };
        await setDoc(doc(db, 'users', currentUser.uid, 'lessonProgress', lesson.id), record, { merge: true });
        userProgress[lesson.id] = record;
        unlockBtn.textContent = '\u2713 UNLOCKED';
        unlockBtn.style.color = '#22c55e'; unlockBtn.style.borderColor = '#22c55e';
    };

    // Lock
    const lockBtn = document.getElementById('gg-lock');
    if (lockBtn) lockBtn.onclick = async () => {
        if (!currentUser || !lesson) return;
        if (!confirm('Remove progress for "' + (lesson.title || lesson.id) + '"?')) return;
        await deleteDoc(doc(db, 'users', currentUser.uid, 'lessonProgress', lesson.id));
        delete userProgress[lesson.id];
        lockBtn.textContent = '\u2717 LOCKED'; lockBtn.style.color = '#888'; lockBtn.style.borderColor = '#888';
    };

    // Toggles
    const mistakesBox = document.getElementById('gg-allow-mistakes');
    if (mistakesBox) mistakesBox.onchange = () => { ggAllowMistakes = mistakesBox.checked; };
    const idleBox = document.getElementById('gg-bypass-idle');
    if (idleBox) idleBox.onchange = () => { ggBypassIdle = idleBox.checked; };
}

// visibilitychange:hidden is the reliable one — it fires on tab switch, lid
// close, and app backgrounding, where beforeunload often doesn't.
//
// ⚠️ BUT IT FIRES ON EVERY TAB SWITCH, not just at session end. A student
// bouncing to Google Classroom and back eight times used to trigger eight full
// final flushes. The localStorage position write is free and must still happen
// every time — that's the part protecting their work. The Firestore flush is
// rate-limited to once a minute, because nothing in it is time-critical: the WAL
// already holds the durable copy, and a teacher reading a report mid-period is
// looking at typing_logs, which is a merge and therefore idempotent.
const HIDDEN_FLUSH_MIN_GAP_MS = 60000;
// v2.4.0 — the delta that overrides the gap. ⚠️ SEE game.js v3.21.0 FOR THE FULL
// REASONING, INCLUDING WHY IT IS 120 AND NOT 45. Short version: a `final` flush
// writes two to three documents, and a 45-second threshold across the
// SCALE-PLAN population has a ~$85/year ceiling. 120 seconds and a non-final
// flush drops that to about a dollar, and once stats-wal.js exists the only
// thing this gate still buys is a fresher number in a report a teacher happens
// to be refreshing mid-period. Unflushed time is no longer lost either way.
//
// ⚠️ KEEP THESE TWO CONSTANTS EQUAL TO game.js's. They are the same policy
// applied to the same student on two pages; a student who alt-tabs out of a
// lesson and a student who alt-tabs out of a book should not be governed by
// different numbers. Round 9 §4 is the standing warning about exactly this.
const HIDDEN_FLUSH_DELTA_SECONDS = 120;
let lastHiddenFlush = 0;
// What secondsToday was the last time a flush actually reached Firestore.
// Updated by flushStats() on success only — a failed flush must not make the
// next hide think the work is safe.
let lastFlushedSecondsToday = 0;

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // Position first: it's a synchronous localStorage write and it's the thing
        // whose loss actually costs the student their work. Never rate-limited.
        // ⚠️ FIRST, AND UNCONDITIONALLY (v2.8.0). A localStorage write inside
        // session-log.js: free, no network, no live token needed, and the only
        // chance to record a run the student is walking away from. Deliberately
        // outside the rate limit below — that gap protects Firestore, and this
        // writes no Firestore document. Repeat calls write nothing.
        logOpenRun('hidden');
        flushSessionsNow();    // v2.9.0 — see that function's header
        learnWalSave();
        persistGuestAccum();   // no-op when signed in; the whole point when not
        // ⚠️ THE RATE LIMIT NOW HAS AN ESCAPE HATCH (v2.4.0).
        //
        // The 60-second gap is right for its stated purpose — a student
        // bouncing to Google Classroom eight times should not fire eight full
        // flushes. It is wrong when the tab is going away for good with four
        // minutes of un-flushed typing behind it, and hidden-because-alt-tab
        // and hidden-because-closing are indistinguishable from here.
        //
        // So the gap governs how OFTEN we flush, and the un-flushed delta
        // governs whether we flush at all. A student who alt-tabs constantly
        // still gets one flush a minute; a student who alt-tabs once and then
        // closes at 4:30 does not lose four and a half minutes to a timer that
        // was protecting Firestore from a problem they don't have.
        const gapElapsed = Date.now() - lastHiddenFlush >= HIDDEN_FLUSH_MIN_GAP_MS;
        const unflushed  = (statsData.secondsToday || 0) - lastFlushedSecondsToday;
        if (gapElapsed || unflushed >= HIDDEN_FLUSH_DELTA_SECONDS) {
            lastHiddenFlush = Date.now();
            // Only the gap-driven flush is `final`. The delta-driven one writes
            // typing_logs (the only document holding these numbers since
            // v2.16.0) and skips the session-rollup upload, which is
            // read at page load only and which the shared WAL now covers.
            flushStats('hidden', gapElapsed);
        }
    }
});

// ⚠️ pagehide, NOT ONLY beforeunload. A student clicking through to Library is
// the most common way a run gets abandoned, and this file's own comments record
// that beforeunload is unreliable on Chromebooks. pagehide fires on navigation
// where beforeunload may not. Safe to double-fire: the delta is zero the second
// time.
window.addEventListener('pagehide', () => {
    logOpenRun('left page');
    learnWalSave();
    persistGuestAccum();
    // ⚠️ AFTER the two synchronous writes, which cannot be cut off. This is the
    // click-through-to-Library case that showed n-1 sessions in Reports.
    flushSessionsNow();
});

window.addEventListener('beforeunload', () => {
    // ⚠️ Synchronous localStorage writes first, ALWAYS. The Firestore flush
    // below is async and the browser is under no obligation to let it finish —
    // it is a best effort, not the safety net. These two lines are the net.
    logOpenRun('left page');
    learnWalSave();
    persistGuestAccum();
    if (currentUser && statsData.secondsToday > 0) flushStats('beforeunload', true);
});

// ─── Caps Lock Warning ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    const capsEl = document.getElementById('caps-warning');
    if (capsEl) capsEl.classList.toggle('hidden', !e.getModifierState('CapsLock'));
});

// Escape: show quick stats overlay during a drill (mirrors game.js pause)
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (drillView.classList.contains('hidden')) return;
    if (!drillModal.classList.contains('hidden')) return; // modal already showing
    e.preventDefault();
    showEscapeStats();
});

function showEscapeStats() {
    const wpm = stepSeconds > 0 ? Math.round((chars / 5) / (stepSeconds / 60)) : 0;
    const acc = chars > 0 ? Math.round(((chars - mistakes) / chars) * 100) : 100;
    const todayWPM  = statsData.secondsToday > 0 ? Math.round((statsData.charsToday / 5) / (statsData.secondsToday / 60)) : 0;
    const weekWPM   = statsData.secondsWeek  > 0 ? Math.round((statsData.charsWeek  / 5) / (statsData.secondsWeek  / 60)) : 0;
    const dGoal = goals.dailySeconds  > 0;
    const wGoal = goals.weeklySeconds > 0;
    const dDone = dGoal && statsData.secondsToday >= goals.dailySeconds;
    const wDone = wGoal && statsData.secondsWeek  >= goals.weeklySeconds;

    drillModal.classList.remove('hidden');
    document.getElementById('drill-keyboard-wrap').style.display = 'none';

    document.getElementById('dm-title').textContent = 'Paused';
    document.getElementById('dm-stars').innerHTML = '';
    document.getElementById('dm-stats').innerHTML =
        '<div class="dm-stat"><div class="dm-val">' + wpm + '</div><div class="dm-label">WPM</div></div>' +
        '<div class="dm-stat"><div class="dm-val">' + acc + '%</div><div class="dm-label">Accuracy</div></div>';

    document.getElementById('dm-msg').innerHTML =
        '<div class="cumulative-row" style="font-size:0.85rem;gap:16px;margin-bottom:6px;">' +
        '<span>' + (dDone ? '✓ ' : '') + 'Today: <strong>' + formatTime(statsData.secondsToday) + '</strong>' +
        (dGoal ? ' / ' + formatTime(goals.dailySeconds) : '') + '</span>' +
        '<span>' + (wDone ? '✓ ' : '') + 'Week: <strong>' + formatTime(statsData.secondsWeek) + '</strong>' +
        (wGoal ? ' / ' + formatTime(goals.weeklySeconds) : '') + '</span>' +
        '</div>' +
        '<span style="color:#aaa;font-size:0.78rem;">Press Escape or Enter to resume</span>';
    document.getElementById('dm-remediation').innerHTML = '';

    const btns = document.getElementById('dm-btns');
    btns.innerHTML = '';
    const resumeBtn = document.createElement('button');
    resumeBtn.className = 'dm-btn-primary'; resumeBtn.textContent = 'Resume';

    function resumeHandler() {
        document.removeEventListener('keydown', escKeyHandler);
        drillModal.classList.add('hidden');
        document.getElementById('drill-keyboard-wrap').style.display = '';
        drillKeyboard.focus();
    }
    function escKeyHandler(e) {
        if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); resumeHandler(); }
    }
    resumeBtn.onclick = resumeHandler;
    btns.appendChild(resumeBtn);
    document.addEventListener('keydown', escKeyHandler);
}

// ─── Auto-refocus keyboard on click-back ─────────────────────────────────────
function ensureKeyboardFocus() {
    if (!activeDrill.classList.contains('hidden') &&
        drillModal.classList.contains('hidden') &&
        drillKeyboard.onkeydown) {
        drillKeyboard.focus();
    }
}

document.getElementById('active-drill').addEventListener('click', ensureKeyboardFocus);

document.addEventListener('keydown', e => {
    if (e.target !== drillKeyboard) ensureKeyboardFocus();
});

// ─── Keyboard health-check ────────────────────────────────────────────────────
// Re-initialize keyboard if it somehow ends up empty (Safari paint timing edge case).
// Runs whenever the tab becomes visible again and on a periodic interval during drills.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // ⚠️ ROADMAP 9 (v2.43.0) — THE WAKE CASE, AND IT COMES FIRST. A
        // Chromebook lid closed overnight reopens on a new day with yesterday's
        // counters still in memory, and everything below — plus the HUD repaint
        // that follows — would otherwise work from them. Rolling here files
        // yesterday's open run against yesterday and zeroes the day before
        // anyone reads it. Twin of game.js's call in its hidden/visible handler.
        rollDayIfNeeded('wake');
        ensureKeyboardFocus();
        rebuildKeyboardIfNeeded();
    }
});

function _showHardStopOverlay(targetChar) {
    // Remove any existing overlay first
    const existing = document.getElementById('drill-hardstop');
    if (existing) existing.remove();

    let friendly = targetChar;
    if (targetChar === ' ')  friendly = 'Space';
    if (targetChar === '\n') friendly = 'Enter';
    if (targetChar === '\t') friendly = 'Tab';

    const el = document.createElement('div');
    el.id = 'drill-hardstop';
    el.style.cssText = [
        'position:absolute','inset:0','z-index:30',
        'display:flex','flex-direction:column','align-items:center','justify-content:center',
        'background:rgba(255,255,255,0.92)','gap:12px'
    ].join(';');
    el.innerHTML =
        '<div style="font-size:0.9rem;color:#555;font-family:monospace;">Too many errors — type the correct key to continue</div>' +
        '<div style="font-size:2rem;font-weight:bold;color:#D32F2F;border:2px solid #D32F2F;border-radius:6px;padding:6px 20px;font-family:monospace;">' +
        escHtml(friendly) + '</div>';

    // Attach to drill-keyboard-wrap so it overlays the keyboard area
    const wrap = document.getElementById('drill-keyboard-wrap');
    if (wrap) { wrap.style.position = 'relative'; wrap.appendChild(el); }
}

function _rebuildKeyboard() {
    console.warn('[TTB] Rebuilding keyboard — layout:', LAYOUT, 'step:', currentStepIdx);
    createKeyboard(drillKeyboard, LAYOUT);
    createHandGuide(drillKeyboard, fingerMap, LAYOUT, true);
    colorKeyboardKeys(drillKeyboard, fingerMap, true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        if (currentStep) advanceHandGuide();
        drillKeyboard.focus();
        _hideKeyboardRecovery();
        console.log('[TTB] Keyboard rebuilt OK — keys:', drillKeyboard.querySelectorAll('.key').length);
    }));
}

function _showKeyboardRecovery() {
    let el = document.getElementById('keyboard-recovery');
    if (!el) {
        el = document.createElement('div');
        el.id = 'keyboard-recovery';
        el.style.cssText = [
            'position:absolute', 'inset:0', 'display:flex',
            'align-items:center', 'justify-content:center',
            'background:rgba(0,0,0,0.55)', 'z-index:20',
            'cursor:pointer', 'border-radius:4px'
        ].join(';');
        el.innerHTML = '<div style="background:#fff;padding:16px 24px;border-radius:6px;text-align:center;font-family:monospace;">'
            + '<div style="font-size:1rem;font-weight:bold;margin-bottom:8px;">&#x2328; Keyboard did not load</div>'
            + '<div style="font-size:0.85rem;color:#555;margin-bottom:12px;">Tap to reload it</div>'
            + '<button style="background:var(--carolina-blue);color:white;border:none;padding:8px 20px;border-radius:4px;font-family:inherit;cursor:pointer;font-size:0.9rem;">Reload Keyboard</button>'
            + '</div>';
        el.addEventListener('click', () => { _rebuildKeyboard(); });
        // Wrap in position:relative container
        const wrap = document.getElementById('drill-keyboard-wrap');
        if (wrap) { wrap.style.position = 'relative'; wrap.appendChild(el); }
    }
    el.style.display = 'flex';
}

function _hideKeyboardRecovery() {
    const el = document.getElementById('keyboard-recovery');
    if (el) el.style.display = 'none';
}

function rebuildKeyboardIfNeeded() {
    if (activeDrill.classList.contains('hidden')) return;
    if (drillModal && !drillModal.classList.contains('hidden')) return;
    if (drillKeyboard.querySelectorAll('.key').length === 0) {
        console.warn('[TTB] Periodic check: keyboard empty — showing recovery UI');
        _showKeyboardRecovery();
        _rebuildKeyboard();
    }
}

// Periodic backstop — 1s interval (was 2s) for faster recovery
setInterval(() => {
    if (!activeDrill.classList.contains('hidden') &&
        drillModal.classList.contains('hidden')) {
        rebuildKeyboardIfNeeded();
    }
}, 1000);

// ─── Utils ────────────────────────────────────────────────────────────────────
function escHtml(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return m + ':' + String(s).padStart(2,'0');
}

function getLocalDateStr(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function getWeekStart(date) {
    // Returns "YYYY-MM-DD" for the Saturday starting this school week (Sat-Fri).
    const d = new Date(date);
    const diff = (d.getDay() + 1) % 7;
    d.setDate(d.getDate() - diff);
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}



// ─── Stats loading (mirrors game.js) ─────────────────────────────────────────
async function loadUserStats() {
    if (!currentUser) return;
    try {
        const today = new Date();
        const dateStr = getLocalDateStr(today);
        const weekStart = getWeekStart(today);
        // ⚠️ v2.16.0 — READS typing_logs, THE DOCUMENT JAKE GRADES FROM. Mirrors
        // game.js v3.31.0 exactly, through the same shared daylog.js, so the two
        // pages cannot drift apart in how they compute this. The stats rollup
        // this used to read is deleted. HANDOFF §0.0.
        const read = await readWeek({ db, doc, getDoc, uid: currentUser.uid, dateStr });

        // ⚠️ A PARTIAL READ MUST NOT PAINT — an undercount looks exactly like a
        // light week, and showing a child less than they earned is the failure
        // this redesign exists to end. Leave everything alone and try next load.
        if (!read.ok) {
            console.warn('[TTB] Day-log read incomplete — counters left untouched this load.');
            return;
        }

        applyWeekToStats(statsData, read, dateStr);

        // ⚠️ THE BASELINE IS TAKEN HERE AND NOWHERE ELSE. (v2.6.0)
        //
        // At this exact line statsData is precisely what the server holds —
        // nothing typed in this tab has been folded in yet. That is what makes
        // it a baseline, and it is why this sits ABOVE statsWalRecover(): a
        // recovered WAL tail is this browser's own unflushed work and belongs on
        // the contribution side of the subtraction. Move it below the recovery
        // and a re-auth silently discards whatever the WAL just replayed.
        captureStatsBaseline();

        // ⚠️ CROSS-PAGE RECOVERY (v2.4.0). Fold in anything game.js could not
        // get to Firestore before its tab died. Before this existed, minutes
        // typed in a book and lost on tab-close only came back if the student
        // happened to reopen THAT BOOK — learn.js and game.js each replayed
        // their own WAL and neither replayed the other's. See stats-wal.js.
        //
        // Must run after the read above, not before: it compares against what
        // the server already has.
        if (statsWalRecover(currentUser.uid, statsData)) {
            console.log('[TTB] Recovered unflushed time from another session.');
            learnDirty = true; learnStatsDocDirty = true;
            flushStats('stats-wal-recovery', true);
        }
        // ⚠️ SAVED ONLY HERE — after the authoritative read. See hud.js.
        hudCacheSave({ todaySeconds: statsData.secondsToday,
                       weekSeconds:  statsData.secondsWeek,
                       date: dateStr, weekStart });
    } catch(e) { console.warn('loadUserStats failed:', e); }
}


// ─── Apply pending class assignment set by admin before student first typed ──
// ⚠️ MIRRORS game.js's implementation. Two copies exist because neither page
// controller can import the other — both have module-level side effects. If you
// change one, change both: a student can reach either page first, and the entire
// point of this function is that it does not matter which.
async function applyPendingClassAssignment(user) {
    if (!user || user.isAnonymous || !user.email) return;
    try {
        const email   = user.email.toLowerCase();
        const pendRef = doc(db, 'pendingClassAssignments', email);
        const pendSnap = await getDoc(pendRef);
        if (!pendSnap.exists()) return;

        const pend     = pendSnap.data() || {};
        const classId  = pend.classId;
        const schoolId = pend.schoolId;

        // ⚠️ EVERY EXIT FROM HERE ON DELETES THE RECORD (v2.5.2). A pending doc is
        // a message from a teacher; reading it consumes it, whatever it said. The
        // old version had three paths that returned without deleting, so a record
        // that could not act was re-read and re-rejected on every sign-in forever.
        if (!classId) { await deleteDoc(pendRef); return; }

        // Age of the record, inlined ON PURPOSE. student-flow-test.mjs lifts this
        // function out of the file by brace-matching and runs it standalone against
        // fake Firestore and localStorage — so a top-level helper here is invisible
        // to it and becomes a ReferenceError inside the sandbox, swallowed by the
        // catch below. The harness's constraint is a real design constraint: this
        // function must depend on nothing but its injected arguments.
        // assignedAt is an ISO string from lessons-admin.js. An unparseable or
        // absent stamp yields null — "unknown age", which must never read as
        // "expired", or legacy records could never be consumed at all.
        let ageMs = null;
        const _rawAt = pend.assignedAt;
        if (_rawAt) {
            let _t = NaN;
            if (typeof _rawAt === 'string') _t = Date.parse(_rawAt);
            else if (typeof _rawAt.toDate === 'function') {
                try { _t = _rawAt.toDate().getTime(); } catch (_) { _t = NaN; }
            }
            if (isFinite(_t)) ageMs = Date.now() - _t;
        }
        if (ageMs !== null && ageMs > 30 * 86400000) {
            console.warn('[TTB] Discarding a class assignment queued ' +
                Math.round(ageMs / 86400000) + ' days ago — too old to trust.');
            await deleteDoc(pendRef);
            return;
        }

        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const existing = (userSnap.exists() && userSnap.data().classId) || '';

        if (existing === classId) { await deleteDoc(pendRef); return; }

        // ⚠️ THIS GUARD USED TO READ `if (existing) return;` — see the long note
        // in game.js. Short version: a RETURNING student is exactly the student
        // the importer cannot see (email→uid comes out of typing_logs scoped to
        // the last ROSTER_DAYS, and they last typed in the spring), so a rollover
        // import writes a pending record for them — and this line then threw it
        // away because they had last year's classId. Ten students, no error, all
        // of them still on last year's roster.
        //
        // The teacher's intent now travels with the record as `overwrite`, set
        // from the preview screen (lessons-admin.js v1.10.0). Absent means false,
        // so pre-v1.10.0 records keep the old cautious reading — but are deleted
        // instead of being ignored in perpetuity.
        if (existing && pend.overwrite !== true) {
            console.warn('[TTB] A class assignment was queued for this student, ' +
                'but they are already in a class and the import was set to ' +
                'leave existing placements alone. Discarding it.');
            await deleteDoc(pendRef);
            return;
        }

        // Apply the pre-assignment
        // Stamp schoolId at the same time. Everything downstream — report scoping,
        // security rules, the roster — keys off the building, and a student with a
        // class but no building is invisible to their own teacher.
        await setDoc(doc(db, 'users', user.uid),
                     { classId, schoolId: schoolId || '' }, { merge: true });

        // Delete the pending record so it doesn't re-apply
        await deleteDoc(pendRef);

        // ⚠️ DROP THE GOALS CACHE FIRST (v2.2.4). loadGoals() ran moments ago and
        // wrote ttb_goalsCache_v1 with classId: '' — because at that point the
        // student genuinely had no class — stamped with a 24 HOUR lifetime. Calling
        // loadGoals() again without clearing it hits that entry and returns the
        // empty classId we are here to replace.
        //
        // The cache-hit guard below does not save us: it rejects an entry that has
        // a classId but no className, and '' is falsy, so an unassigned entry sails
        // straight through as a hit.
        //
        // What that cost, before this line existed: the Firestore write above DID
        // land, so the database was correct — but classInfo stayed empty in memory
        // and in the cache, for up to a day and across page loads, because game.js
        // and learn.js share this key. Every log flushed in that window was stamped
        // classId: '' (see the flush payloads), which means the student's first day
        // of typing does not appear in any class-filtered report and their class's
        // daily/weekly goals never apply. On the first day of a 9-week rotation that
        // is every student at once.
        //
        // ⚠️ v2.5.2 — AND NOW A SECOND REASON, WHICH IS WORSE. On a REASSIGNMENT the
        // stale entry is not empty, it is last year's class with a valid className.
        // It passes every check the cache-hit guard makes, because it is well-formed
        // — just wrong. That is the case a validity check cannot catch, and it is why
        // this removal is unconditional rather than guarded.
        try { localStorage.removeItem(LEARN_GOALS_KEY); } catch (_) {}

        // Reload goals with the new class
        await loadGoals();
        console.log('[TTB] Applied pending class assignment:', classId,
                    existing ? '(moved from ' + existing + ')' : '');
    } catch(e) { /* non-critical — don't block login */ }
}

async function loadGoals() {
    try {
        // Cache hit? game.js has had this for several versions; learn.js never
        // got it, so every load paid two reads for values that change about once
        // a year. Same key, same shape, same 24h window — a student who opens
        // both pages in a day pays for one read, not two.
        //
        // ⚠️ game.js writes this same key WITHOUT `className` — it has no class
        // banner to fill. If we accepted that entry we'd blank the class name in
        // the header for up to 24h. So an entry that names a class but carries no
        // className is treated as a miss: we pay two reads once, and the entry we
        // write back has everything both pages need.
        const c0 = cacheRead(LEARN_GOALS_KEY, LEARN_GOALS_MS,
                             currentUser ? currentUser.uid : '');
        // ⚠️⚠️ v2.34.1 — ROADMAP 11, BUG B. AN ENTRY WITH NO CLASS IS ALSO A MISS.
        // The guard below only rejected an entry that NAMES a class but carries
        // no className. An entry recorded before the student was assigned has
        // `classId: ''` — falsy — so it sailed through as a HIT, and Settings
        // kept answering "No class assigned" for up to 24 HOURS after a correct
        // assignment landed in Firestore. Jake hit this on his own son and spent
        // an evening on it, with the admin panel and the database both right.
        //
        // ⚠️ A DIRECT ADMIN WRITE CANNOT REACH A CACHE ON THE STUDENT'S
        // CHROMEBOOK. applyPendingClassAssignment() clears this key deliberately,
        // but only the IMPORT path runs it — there is no mechanism by which the
        // Students panel could. So the unassigned state must not be cacheable at
        // all: it is the one value that changes from OUTSIDE the browser holding
        // it, and it costs two reads for a student who genuinely has no class.
        const c = (c0 && (!c0.classId || !c0.className)) ? null : c0;
        if (c) {
            goals.dailySeconds  = c.dailySeconds  || 0;
            goals.weeklySeconds = c.weeklySeconds || 0;
            classInfo = { id: c.classId || '', name: c.className || '',
                          schoolId: c.schoolId || '',
                          dailySeconds: goals.dailySeconds,
                          weeklySeconds: goals.weeklySeconds };
            updateClassDisplay();
            applyGoalCelebrationState();
            return;
        }

        // Step 1: check if user belongs to a class
        let resolved = false;
        if (currentUser) {
            const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
            if (userSnap.exists()) {
                const ud = userSnap.data();
                if (ud.classId) {
                    const classSnap = await getDoc(doc(db, 'classes', ud.classId));
                    if (classSnap.exists()) {
                        const cd = classSnap.data();
                        goals.dailySeconds  = cd.dailySeconds  || 0;
                        goals.weeklySeconds = cd.weeklySeconds || 0;
                        classInfo = { id: ud.classId, name: cd.name || '',
                                      schoolId: ud.schoolId || cd.schoolId || '',
                                      dailySeconds: goals.dailySeconds,
                                      weeklySeconds: goals.weeklySeconds };
                        resolved = true;
                        updateClassDisplay();
                    }
                }
            }
        }
        // Step 2: fall back to settings/goals if no class
        if (!resolved) {
            const snap = await getDoc(doc(db, 'settings', 'goals'));
            if (snap.exists()) {
                const d = snap.data();
                goals.dailySeconds  = d.dailySeconds  || 0;
                goals.weeklySeconds = d.weeklySeconds || 0;
            }
            classInfo = { id: '', name: '', dailySeconds: goals.dailySeconds,
                          weeklySeconds: goals.weeklySeconds };
            updateClassDisplay();
        }

        // Persist for 24h. `className` is extra over game.js's payload and is
        // additive only — game.js reads the fields it knows and ignores this one.
        cacheWrite(LEARN_GOALS_KEY, {
            uid: currentUser ? currentUser.uid : '',
            dailySeconds: goals.dailySeconds, weeklySeconds: goals.weeklySeconds,
            classId: classInfo.id || '', className: classInfo.name || '',
            schoolId: classInfo.schoolId || ''
        });

        applyGoalCelebrationState();
    } catch(e) { console.warn('loadGoals failed:', e); }
}

function updateClassDisplay() {
    // Class name below username
    const classEl = document.getElementById('user-class-name');
    if (classEl) classEl.textContent = classInfo.name || '';

    // ⚠️ hud-daily-goal IS GONE (v2.9.0). The denominator is part of the string
    // hud.js builds, so there is no separate element to keep in step — writing one
    // here would put half the readout under a second owner.
    renderTimeHUD();
}

// ⚠️ ONE FUNCTION WRITES BOTH SLOTS, AND IT IS THE SAME STRING BUILDER game.js
// USES. (v2.9.0) There were three writers before: the word `Today:` was static
// markup, hud-timer held a bare number, hud-daily-goal held the denominator, and
// updateWeeklyHUD() owned the week — while Library's left slot held three
// different quantities depending on a setting.
//
// School passes NO sprint limit, deliberately: a lesson run has no time target
// (its gates are WPM and accuracy), so hud.js renders Daily alone, in the same
// position Library renders it. That is the uniformity, not an omission.
//
// ⚠️ The old strings used non-breaking spaces to stop the readout wrapping.
// hud.js uses ordinary spaces and style.css keeps the slot on one line; if a
// narrow window ever wraps it, fix it in CSS, not by threading \u00a0 back
// through a shared module.
function renderTimeHUD() {
    // ⚠️ FALL BACK TO THE LAST KNOWN TOTALS WHILE FIRESTORE IS STILL BEING READ
    // (v2.10.2). statsData holds its initialised zeros until an async read lands,
    // so a student with time banked opened a drill and saw `Daily 0:00`.
    // ⚠️ PAINT ONLY — statsData is never seeded from this. See hud.js.
    let _today = statsData.secondsToday, _week = statsData.secondsWeek;
    if (!_today && !_week) {
        const seed = hudCacheLoad(getLocalDateStr(new Date()), getWeekStart(new Date()));
        if (seed) { _today = seed.todaySeconds; _week = seed.weekSeconds; }
    }
    const hud = hudStrings({
        sprintSeconds: stepSeconds,
        sprintLimit:   0,
        todaySeconds:  _today,
        dailyGoal:     goals.dailySeconds,
        weekSeconds:   _week,
        weeklyGoal:    goals.weeklySeconds,
    });
    if (hudTimer) {
        // ⚠️ THE LEAD ROW IS ALWAYS THE DAILY FIGURE, SAME AS game.js. See the
        // block above hudStrings()'s return and tests/hud-lead-test.mjs.
        hudTimer.textContent = hud.lead;
        hudTimer.style.color = hud.dailyDone ? '#22c55e' : '';
        // .hud-time-long and hud.long are GONE (hud.js v1.3.0). Do not re-add.
    }
    // ⚠️ EMPTY HERE TODAY AND WIRED ANYWAY, SAME REASONING AS v2.11.1's. School
    // gates on WPM and accuracy, not time, so `sprintLimit` is hardcoded to 0
    // above and hud.sprint is ''. Kept in lockstep so a future School sprint
    // cannot land in a different slot than Library's.
    const sprintEl = document.getElementById('hud-sprint');
    if (sprintEl) {
        sprintEl.textContent = hud.sprint;
        sprintEl.style.color = hud.overtime ? '#FFA500' : '';
    }
    const weekEl = document.getElementById('hud-week');
    if (weekEl) {
        weekEl.textContent = hud.right;
        weekEl.style.color = hud.weeklyDone ? '#22c55e' : '#888';
    }
}

// ⚠️ updateWeeklyHUD() DELETED (v2.29.1). Its comment claimed it was "kept as an
// alias: several call sites read naturally as 'the week changed, redraw'" —
// **there were zero call sites.** The last one went when hud.js v1.3.0 split the
// readout, and the alias stayed behind describing callers that no longer exist.
//
// ⚠️ A COMMENT ASSERTING CALLERS IS NOT EVIDENCE OF CALLERS, and this one read
// as justification, which is what kept it alive through four rounds of people
// reading past it. Found by tests/dead-handler-test.mjs on its first run — the
// same harness written for the "I'm done" button, which was the same defect
// pointing the other way (a caller with nothing attached, vs. a callee with
// nobody calling). HANDOFF §0.-18.

// Coalesced stats persistence, mirroring the pattern in game.js v3.4.0.
//
// saveStats() fired on every completed lesson step and wrote TWO documents each
// time. Steps come every 30-60 seconds, so a ten-minute lesson block was ~20-40
// writes per student. Now every call records to a local write-ahead log (free,
// synchronous, instant) and Firestore gets a batched flush on a timer and at
// session end. Nothing is lost — see walRecoverLearn() below.
const LEARN_WAL_KEY = 'ttb_learnwal_v1';

// ─── Run position persistence — DELETED (v2.5.0) ─────────────────────────────
//
// ⚠️ DO NOT REBUILD THIS. It is not missing; it was removed on a ruling, and the
// argument for putting it back is the same argument that put it here.
//
// What was here: `ttb_learnpos_v1`, a latest-wins snapshot of {lessonId, runIdx,
// drillPos, chars, mistakes, stepSeconds, seq} written every five characters,
// plus the checkpointOwner() identity that decided who a snapshot belonged to.
// startLesson() read it, skipped the intro, and dropped the student back on the
// exact character where the bell caught them.
//
// The case FOR it, which was and is real: before it existed, an interrupted run
// erased the whole run and every earlier run cleared in that sitting, because
// lessonProgress is only written when a lesson completes. Any run longer than
// the time left in the period was unfinishable, forever.
//
// Jake's ruling, 2026-08-17: *"If a kid doesn't finish a lesson one session,
// they should restart it — not start at the last word. The lesson should be
// taken as a whole (although it should track the time whether it finishes or
// not)."*
//
// ⚠️ THE ORIGINAL PROBLEM WAS REAL AND THE DIAGNOSIS WAS WRONG. "The student
// loses their work" and "the student loses their TIME" got treated as one
// thing, and a position checkpoint only ever addressed the first. Time is
// counted by the drill tick into statsData every second and persisted by the
// WAL; it never depended on this file's position snapshot and never needed to.
// What the checkpoint actually preserved was a partial attempt at a lesson —
// and a partial attempt is not something the curriculum wants to keep, because
// the unit being trained is the whole lesson.
//
// So the fix for "unfinishable runs" is chunking (CHUNK_TARGET, which exists and
// keeps a run to 30–60 seconds), not resumption. If runs are ever long enough
// that the bell reliably beats a student, shorten the runs.
//
// Three things went with it, and each was carrying its own weight before it:
//   * checkpointOwner() / ttb_guestId — an identity that existed ONLY to decide
//     whose half-finished drill a snapshot was. Nothing else asked.
//   * The v2.4.0 sessionStorage→localStorage move, shipped hours earlier this
//     same round. It was correct, and this ruling made the code it corrected
//     unnecessary. Noted rather than hidden: see HANDOFF Round 10 §5.
//   * Six clearRunPosition() calls scattered across run completion, lesson
//     completion, the remediation detour and two unload handlers — every one of
//     them existing to stop a stale snapshot doing something wrong.
//
// ⚠️ `ttb_learnpos_v1` and `ttb_guestId` / `ttb_guestId_v2` are dropped from
// localStorage at init by purgeRetiredKeys(). A retired key left in place is a
// trap for the next person who greps for it and finds data but no writer.

const LEARN_FLUSH_MS = 300000;   // 5 minutes
let learnFlushTimer = null;
let learnDirty = false;
let learnStatsDocDirty = false;

function learnWalSave() {
    if (!currentUser) return;
    // The page-agnostic half goes to the shared WAL so game.js can replay it.
    // This one keeps the lesson-scoped half (queued run progress), which means
    // nothing to the Library page.
    statsWalSave(currentUser.uid, statsData);
    try {
        localStorage.setItem(LEARN_WAL_KEY, JSON.stringify({
            v: 1, uid: currentUser.uid, savedAt: Date.now(), stats: { ...statsData },
            // Queued run-level progress, so a crash between flushes doesn't lose the
            // record of a student grinding on a run they can't clear.
            progress: Array.from(pendingProgress).reduce((acc, id) => {
                if (userProgress[id]) acc[id] = userProgress[id];
                return acc;
            }, {})
        }));
    } catch (e) { console.warn('learn WAL write failed:', e); }
}

// Replay whatever the last session couldn't flush. Counters only rise within a
// day/week, so max() is the safe merge. Call after loadUserStats().
function walRecoverLearn() {
    try {
        const raw = localStorage.getItem(LEARN_WAL_KEY);
        if (!raw) return;
        const wal = JSON.parse(raw);
        if (wal.v !== 1 || !currentUser || wal.uid !== currentUser.uid || !wal.stats) return;
        let recovered = false;
        // ⚠️ v2.20.0 — THE PER-SOURCE TRIPLE IS IN THIS LIST AND OMITTING IT
        // LOSES TIME SILENTLY. This is the only path by which a crashed tab's
        // unflushed minutes reach statsData, and after the cutover secondsSchool
        // is the only number this page WRITES. Recover secondsToday without it
        // and the HUD climbs by the recovered minutes while the flush that
        // follows writes the un-recovered secondsSchool — student sees the time,
        // teacher does not. Mirrors game.js v3.35.0 walRecover().
        if (wal.stats.lastDate === statsData.lastDate) {
            for (const k of ['secondsToday', 'charsToday', 'mistakesToday',
                             'secondsSchool', 'charsSchool', 'mistakesSchool',
                             'secondsLibrary', 'charsLibrary', 'mistakesLibrary']) {
                if ((wal.stats[k] || 0) > (statsData[k] || 0)) { statsData[k] = wal.stats[k]; recovered = true; }
            }
        }
        if (wal.stats.weekStart === statsData.weekStart) {
            for (const k of ['secondsWeek', 'charsWeek', 'mistakesWeek']) {
                if ((wal.stats[k] || 0) > (statsData[k] || 0)) { statsData[k] = wal.stats[k]; recovered = true; }
            }
        }
        // Replay queued run-level progress (v2.1.0). Merge rather than overwrite:
        // loadProgress() has already read Firestore, and the WAL copy is only newer
        // for the specific lessons that were mid-flight when the tab died.
        if (wal.progress && typeof wal.progress === 'object') {
            for (const [id, rec] of Object.entries(wal.progress)) {
                const live = userProgress[id];
                const walSeen  = Date.parse(rec.lastSeenAt || 0) || 0;
                const liveSeen = Date.parse(live && live.lastSeenAt) || 0;
                if (!live || walSeen > liveSeen) {
                    userProgress[id] = Object.assign({}, live, rec);
                    pendingProgress.add(id);
                    recovered = true;
                }
            }
            if (pendingProgress.size) {
                console.log('Recovered unflushed run progress for', pendingProgress.size, 'lesson(s).');
            }
        }

        if (recovered) {
            console.log('Recovered unflushed lesson data from local storage.');
            learnDirty = true; learnStatsDocDirty = true;
            flushStats('recovery', true);
        } else {
            localStorage.removeItem(LEARN_WAL_KEY);
        }
    } catch (_) { /* corrupt WAL — ignore it */ }
}

// Record locally and schedule a flush. Replaces the old saveStats().
function saveStats() {
    if (!currentUser) return;
    learnDirty = true;
    learnStatsDocDirty = true;
    learnWalSave();
    if (!learnFlushTimer) {
        learnFlushTimer = setTimeout(() => { learnFlushTimer = null; flushStats('interval'); }, LEARN_FLUSH_MS);
    }
}

// ⚠️ RE-ENTRANCY GUARD. flushStats() is reachable from the interval timer,
// visibilitychange, beforeunload, and walRecoverLearn(). It is async with
// several sequential awaits, so two runs could overlap and both iterate
// `pendingProgress` — writing the same lesson record twice and deleting entries
// out from under each other's loop. Same class of bug as game.js flushAll().
// A single in-flight promise serialises them: a caller that arrives mid-flush
// waits for the running flush and then re-runs, so nothing is dropped.
//
// ⚠️ THE LOOP IS `while`, NOT `if`. (v2.2.1)
//
// v2.2.0 wrote `if`, which holds for two callers and fails for three or more:
// once the running flush resolves and its finally nulls the slot, every caller
// parked on that promise is ALREADY past the `if`, so they all claim the slot
// and their inner runs overlap. `while` closes it, because re-checking after
// the await is synchronous with the assignment that follows. Four call sites
// means three-deep is reachable — a student alt-tabbing during an interval
// flush is enough. Identical fix to game.js 3.9.2; both files had it.
let _learnFlushInFlight = null;

// ⚠️ checkForWeekRepair() WAS HERE AND IS DELETED (v2.16.0). See game.js
// v3.31.0's identical note. There is no stored week counter to resync and no
// week-counter repair to be undone. If something shaped like this returns, a
// second copy of the numbers has returned; go and find that instead.

async function flushStats(reason, final = false) {
    while (_learnFlushInFlight) {
        await _learnFlushInFlight.catch(() => {});
    }
    _learnFlushInFlight = _flushStatsInner(reason, final);
    try { await _learnFlushInFlight; }
    finally { _learnFlushInFlight = null; }
}

async function _flushStatsInner(reason, final = false) {
    // ⚠️⚠️ ROADMAP 9 (v2.43.0) — BEFORE THE GUARD, AND BEFORE ANYTHING IS
    // WRITTEN. The twin of game.js's call in _flushAllInner(). This path stamps
    // its daily-log document with today's date while writing statsData's
    // counters, which a stale tab still holds from yesterday. Rolling first is
    // what stops yesterday's day total landing on today's ledger line.
    // ⚠️ ABOVE THE currentUser GUARD ON PURPOSE. A guest tab goes stale the same
    // way, and the roll's own work — filing the open run to localStorage and
    // zeroing in-memory counters — needs no account. The guard below is about
    // who may WRITE to Firestore, which is a different question.
    rollDayIfNeeded('flush:' + reason);
    if (!currentUser) return;
    // ⚠️⚠️ v2.37.0 — `&& !final` IS THE FIX FOR ROADMAP 25 AND IT IS ONE CLAUSE.
    //
    // "I'm done" stamped a child a receipt SHORTER than the HUD they had been
    // watching a second earlier — 9:31 against 10:02, the gap being exactly the
    // run they were in the middle of. handleImDone() does everything right:
    // logOpenRun('done'), then `await flushStats('done', true)`. But `final` was
    // never read HERE, so the flush hit this gate and returned having written
    // NOTHING, and the receipt then read a typing_logs the flush never touched.
    //
    // ⚠️ THE PER-SECOND TICK INCREMENTS statsData.secondsToday AND DOES NOT SET
    // learnDirty. Only saveStats() does, and it is called at RUN BOUNDARIES —
    // finishStep(), stopLesson(). So mid-run the counter climbs while the flag
    // stays false, and every "final" flush in that window was a no-op. That is
    // why the two numbers agreed the moment a run ended and disagreed at every
    // other moment.
    //
    // ⚠️⚠️ THIS WAS A TWIN DIVERGENCE, AND THE SIBLING WAS ALREADY RIGHT.
    // game.js's flushAll() gates on `if (!walDirty && !final && queued === 0)`.
    // Library's "I'm done" has always forced the write; School's silently
    // skipped it. Both carry comments swearing they are identical in shape
    // (§0.-13.E), and they differed in exactly the clause that decides whether a
    // child is told the truth. ⚠️ IDENTICAL IN SHAPE IS NOT IDENTICAL IN
    // BEHAVIOUR, and only a harness driving BOTH can tell them apart.
    //
    // ⚠️ A `final` FLUSH WITH NOTHING TO SAY IS CHEAP AND CORRECT. It writes the
    // same values back under a merge. The gate exists to skip IDLE interval
    // flushes; "the child pressed the button" is not idle.
    if (!learnDirty && pendingProgress.size === 0 && !final) return;
    if (learnFlushTimer) { clearTimeout(learnFlushTimer); learnFlushTimer = null; }
    let ok = true;

    // Daily log — what reports.html reads. Written on every flush so a teacher
    // checking mid-period sees today's numbers.
    //
    // ⚠️ v2.14.0 — SOURCE-SPLIT FIELDS. Mirrors game.js v3.29.0 exactly — see
    // its comment for the full incident (DESIGN-TELEMETRY.md §2.4: two page
    // controllers sharing one field on one document, each overwriting the
    // other's contribution). Writes secondsSchool/charsSchool/mistakesSchool
    // now, never the shared seconds/chars/mistakes triple. The old `source:
    // 'school'` field is dropped — it was a single string tag on a document
    // that can now legitimately hold contributions from both modes at once,
    // which the field name itself now encodes precisely, so a separate tag
    // saying which one "the" source was is no longer meaningful and would be
    // actively misleading on a mixed day. ⚠️ REQUIRES firestore.rules v2.4.0+;
    // see game.js's comment — deploy the rule before this file.
    // ⚠️⚠️ v2.19.0 — THE PROJECTION IS REVERTED. Mirrors game.js v3.34.0 and its
    // note in full: `typing_sessions` was found to contain OVERLAPPING rollups
    // and NEGATIVE character counts (HANDOFF §0.0), so a grade derived from it is
    // the corrupt number rather than a check on it. Stage 1 is KEPT — the week is
    // read from typing_logs and there is no stats/time_tracking. Sessions are
    // still written and still feed the drill-down; they cannot decide a grade.
    // ⚠️⚠️ v2.20.0 — THE §3.1 FIX. THIS PAGE WRITES ONE SOURCE'S FIELDS AND
    // NOTHING ELSE. Mirrors game.js v3.35.0 exactly; read its note for the full
    // incident. The short version: both controllers used to write the whole day
    // under `seconds`, so whichever flushed last was correct by definition and a
    // stale tab from an earlier period erased the other mode's minutes. Removing
    // the shared field removes the race — a merge from game.js cannot mention
    // secondsSchool, so it cannot replace it.
    //
    // ⚠️ `own` SEEDS FROM ITS OWN FIELD (daylog.js applyWeekToStats), NEVER FROM
    // THE DAY TOTAL. Seeding from the total folds Library's minutes into
    // School's bucket and the reader adds them twice — the v2.14.0 bug that got
    // the split reverted. tab-lifetime-test.mjs Part E drives it on purpose.
    //
    // ⚠️ THE GATE LIVES IN daylog.js AND IS SHARED WITH game.js. Before the
    // cutover this writes the flat triple plus `source: 'school'`, byte-for-byte
    // what v2.19.0 shipped, because every reader is legacy-first until then. Do
    // not inline the date comparison here: two copies of a cutover rule is how a
    // teacher and a student read one document and get two numbers.
    const today = getLocalDateStr();
    const useSplit = today >= SOURCE_SPLIT_CUTOVER;
    const payload = dayLogPayloadFor('school', today, {
        day: { seconds:  statsData.secondsToday,
               chars:    statsData.charsToday,
               mistakes: statsData.mistakesToday },
        own: { seconds:  statsData.secondsSchool,
               chars:    statsData.charsSchool,
               mistakes: statsData.mistakesSchool },
    });
    {
      // ⚠️ LEDGER FIRST — see logdays.js. Same rule as game.js's flush: the
      // ledger may be a superset of the logs and must never be a subset.
      try { await noteDay({ db, doc, updateDoc, setDoc, arrayUnion,
                            uid: currentUser.uid, date: today }); }
      catch (_) { /* noteDay swallows its own failures */ }

      try {
        await setDoc(doc(db, 'typing_logs', currentUser.uid + '_' + today), {
            uid: currentUser.uid, email: currentUser.email || '',
            displayName: currentUser.displayName || 'Anonymous',
            classId: (classInfo && classInfo.id) || '',
            schoolId: (classInfo && classInfo.schoolId) || '',
            date: today,
            ...payload,
            lastUpdated: new Date(),
            // ⚠️ DROPPED AFTER THE CUTOVER. `source` was one string tag on a
            // document that can legitimately hold both modes at once; the field
            // names now carry that information exactly, and a tag claiming the
            // day had a single source would be actively wrong on a mixed day.
            // Kept on the pre-cutover path so that payload stays identical to
            // v2.19.0's.
            ...(useSplit ? {} : { source: 'school' })
        }, { merge: true });
        // ⚠️⚠️ §READS / daylog.js v1.6.0 — THE MEMO MUST BE DROPPED THE MOMENT THIS
        // LANDS. readWeek() is memoised per page load; a caller later in this same
        // load would otherwise be handed the pre-write week and paint a total that
        // is short by whatever was just saved. Over-calling is free — the cost of a
        // needless drop is one read. weekly-memo-test.mjs asserts this call exists.
        invalidateWeek(currentUser.uid);

        // ⚠️ v2.20.0 — THE v2.18.0 HUD RECONCILIATION IS GONE. It existed
        // because v2.17.0's write was a PROJECTION of the session record and
        // could differ from the counter; v2.19.0 reverted that projection, which
        // made the delta identically zero, and it has been dead code since.
        //
        // It must not return in this shape. This write no longer knows the day
        // total — it names one source's fields and the other source's number is
        // in the document where only a fresh read would find it. And the HUD
        // cache is not written here: hud.js is explicit that it is saved after
        // the authoritative read and never from the live counter.
      } catch (e) { ok = false; console.warn(`Log flush failed (${reason}):`, e); }
    }

    // Week/day rollup.
    //
    // ⚠️ WRITTEN ON THE SAME TRIGGER AS THE DAILY LOG ABOVE, DELIBERATELY, AND
    // THIS IS NOT NEGOTIABLE. (v2.7.0)
    //
    // Until now this was gated on `final` while the daily log was gated on
    // `walDirty || final`. Two documents holding THE SAME NUMBERS, written on
    // DIFFERENT SCHEDULES. That is not a lag; it is a guarantee of divergence,
    // and every symptom Jake saw on 2026-08-18 came out of it:
    //
    //   * Roughly half of ninety students had no stats document AT ALL, because
    //     a `final` flush depends on a page-hide gap or a deliberate exit and a
    //     child who closes a Chromebook lid mid-sentence produces neither. Their
    //     week counter was being reconstructed from localStorage alone, so it
    //     changed on every refresh and matched nothing.
    //   * Those who did have one had a value from whenever their last final
    //     flush happened to land, which is why reports and the HUD disagreed for
    //     students with no corruption at all.
    //
    // ⚠️ DO NOT RE-GATE THIS ON `final` TO SAVE WRITES. The saving is about one
    // write per five minutes of active typing — roughly +7/student/day, ~900/day
    // across Ellis, comfortably inside the free tier, and about $7/year even at
    // the full district population SCALE-PLAN models. Round 11 traded this away
    // for ~$85/year on the reasoning that the rollup "is only ever read at page
    // load and the WAL now covers it anyway". The first half was true. The second
    // half assumed a WAL that always survives, on hardware shared between
    // students, and it does not.
    //
    // The rule this encodes: TWO RECORDS OF THE SAME QUANTITY MUST SHARE A WRITE
    // TRIGGER, or they will disagree and no amount of auditing will keep up.
    // ⚠️ v2.16.0 — THE stats/time_tracking WRITE IS DELETED, and this is the
    // whole point of the change. The comment above used to argue that two
    // records of one quantity must share a write trigger; there is one record
    // now, and it is the daily log written just above. HANDOFF §0.0.
    learnStatsDocDirty = false;

    if (!(await flushLessonProgress())) ok = false;

    // Run history rollup (v2.6.0). Session-end only, same cadence game.js uses:
    // it is never read by the app, only by reports.html, so it needs to be
    // correct by the time a teacher looks rather than by the next keystroke.
    if (final && sessionLogPending(currentUser.uid) > 0) {
        const sessionsOk = await sessionLogFlush(currentUser.uid, {
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Anonymous',
            classId: (classInfo && classInfo.id) || '',
            schoolId: (classInfo && classInfo.schoolId) || '',
        });
        if (!sessionsOk) ok = false;
    }

    // The local copy is now authoritative for this student — mirror it into the
    // cache so the next page load doesn't have to re-read the subcollection to
    // learn what this tab already did.
    refreshProgressCache();

    if (ok) {
        learnDirty = false;
        // The watermark the hide-handler's delta gate measures against. Only set
        // on success: a failed flush must not convince the next hide that the
        // work is already safe.
        lastFlushedSecondsToday = statsData.secondsToday || 0;
        if (final) { try { localStorage.removeItem(LEARN_WAL_KEY); } catch (_) {} }
        // ⚠️ The shared stats WAL is deliberately NOT cleared here. It is
        // max-merged on both read and write, so an entry the server has already
        // caught up with contributes nothing on the next recovery — it costs
        // one comparison, not a wrong number. What it buys is that game.js can
        // still replay this page's tail if THIS flush was the last thing that
        // happened before a crash the browser never told us about. It ages out
        // on its own the moment the day or the week rolls over.
    } else {
        learnWalSave();   // keep the local copy; next flush retries
    }
}

// ─── Celebration (copied from game.js) ───────────────────────────────────────
// ─── Init ─────────────────────────────────────────────────────────────────────
// ⚠️ THIS COMMENT USED TO SAY "lessons collection is public, no auth needed"
// AND IT WAS NOT TRUE. firestore.rules had `allow read: if signedIn()` on
// /lessons, so this fire-and-forget call went out unauthenticated and came back
// denied for anyone without a warm session — which is the whole of the v2.3.0
// loadLessons() fix above. It is true NOW, as of firestore.rules v2.3.0, and it
// is true because that file says so, not because this one does.
//
// Generalise: a comment asserting a permission is a claim about a DIFFERENT
// file, and nothing checks it. When code depends on a rule, name the rule and
// its version so the claim can be falsified by someone reading only this line.
//
// onAuthStateChanged handles ALL rendering — it fires for both signed-in and
// signed-out states, and is the only reliable moment to know auth is settled.
// We must NOT call renderMap() here because auth.currentUser is null at module
// load time even for a returning signed-in user.
// ═════════════════════════════════════════════════════════════════════════════
// THE VERSION FOOTER — primary triad always visible, everything else on hover.
// ═════════════════════════════════════════════════════════════════════════════
//
// v2.10.3. ⚠️ SAME STRUCTURE AS game.js, ON PURPOSE — see that file's comment
// on updateVersionBanner() for the full reasoning. School's old footer was a
// single static line ('School v2.10.2 / keyboard.js v1.1.1') with no way at
// all to see hud.js, session-log.js, stats-wal.js or firebase-config.js — the
// same blind spot game.js had, on the page where the HUD bug above actually
// lives half the time. #footer-primary is this page/js/css triad; #footer-full
// is everything else, fetched lazily on first hover via versions.js's existing
// readDeployedVersions()/renderBuildList() (the same call index.html's build-info
// button already makes — not a second mechanism).

async function updateVersionFooter() {
    const primary = document.getElementById('footer-primary');
    if (!primary) return;

    const pageVer = await readOneDeployedVersion('learn.html');
    const styleVer = readAppliedCssVersion('::before');
    const pageStr = (pageVer && pageVer.version) ? pageVer.version : '?';

    primary.innerHTML =
        `<span style="opacity:.7">learn.html</span> v${pageStr}` +
        ` &nbsp;·&nbsp; <span style="opacity:.7">learn.js</span> v${LEARN_VERSION}` +
        ` &nbsp;·&nbsp; <span style="opacity:.7">style.css</span> v${styleVer || '?'}`;

    const full = document.getElementById('footer-full');
    // ⚠️ v1.13.0 of versions.js owns freshness now; this flag is only the
    // record of WHICH audience the panel was last drawn for. Resetting it forces
    // a redraw on the next hover without forcing a re-fetch.
    if (full) full.dataset.notes = '';
}

// v2.31.0 — ⚠️ TWIN OF game.js's _buildNotesAllowed(). Read at RENDER time and
// never cached: the panel outlives the sign-in, so a guest hover followed by
// Jake signing in on the same tab must show more on the next hover.
// ⚠️ A DISPLAY GATE, NOT A SECURITY ONE — everything it hides is in the raw
// .js files anyone can open, and none of it is student data.
function _buildNotesAllowed() {
    return isStaffUser(currentUser);
}

function _renderFullBuildPanel(results) {
    const full = document.getElementById('footer-full');
    if (!full) return;
    const showNotes = _buildNotesAllowed();

    let html = `<div style="opacity:.6;margin-bottom:4px">learn.html (this page)</div>`
             + renderBuildList(results, { notes: showNotes });
    // keyboard.js is imported statically (not dynamically like game.js's
    // adventure-renderer.js), so KB_VERSION here IS the deployed constant —
    // no separate drift check needed the way adventure-renderer.js gets one.
    // ⚠️ WHICH IS WHY THIS COUNT HAS NO `+ (drift ? 1 : 0)` TERM and game.js's
    // does. The twins differ here on purpose; do not "fix" it into symmetry.
    html += renderHiddenNotesLine(showNotes ? 0 : countBuildNotes(results));

    full.innerHTML = html;
    full.dataset.notes = String(showNotes);
}

// ⚠️⚠️ v2.33.0 — THIS NO LONGER KEEPS ITS OWN "already loaded" FLAG.
// It used to return early on `dataset.loaded === 'true'`, which was a THIRD
// layer of staleness on top of versions.js's cache and the HTTP cache — and the
// one that made a hard reload useless, because nothing in the chain expired
// inside a tab. versions.js v1.13.0 owns the freshness policy now (60s TTL,
// page-scoped), so every hover simply asks and lets it decide whether that costs
// a fetch. HANDOFF §0.-22.
//
// ⚠️ THE PANEL IS READ AT EXACTLY THE MOMENT SOMEONE DOUBTS WHAT IS RUNNING.
// That is the moment a remembered answer is worst. Do not reintroduce a cache
// here to save a fetch nobody is paying for.
let _buildFetchPromise = null;
let _buildResults = null;
function _ensureFullBuildLoaded() {
    const full = document.getElementById('footer-full');
    if (!full) return;
    if (!_buildResults) full.innerHTML = '<div style="opacity:.6">Reading deployed files\u2026</div>';
    if (_buildFetchPromise) return;
    _buildFetchPromise = readDeployedVersions()
        .then(results => {
            _buildResults = results;
            _renderFullBuildPanel(results);
            _buildFetchPromise = null;
        })
        .catch(() => {
            full.innerHTML = '<div style="color:#c05621">Could not read build info.</div>';
            _buildFetchPromise = null;
        });
}


// Hover for a mouse; `.pinned` (toggled by click/tap) for touch, which has no
// hover event at all. ⚠️ SAME LISTENERS AS game.js's setupVersionFooter() —
// keep the two in step if this ever changes.
function setupVersionFooter() {
    const footerEl = document.getElementById('version-footer');
    if (!footerEl) return;
    footerEl.addEventListener('mouseenter', _ensureFullBuildLoaded);
    footerEl.addEventListener('focus', _ensureFullBuildLoaded);
    footerEl.addEventListener('click', (e) => {
        _ensureFullBuildLoaded();
        footerEl.classList.toggle('pinned');
        e.stopPropagation();
    });
    document.addEventListener('click', () => footerEl.classList.remove('pinned'));
}
setupVersionFooter();
updateVersionFooter();
// Title was hardcoded in learn.html and drifted from the constant. Drive it from
// the constant so there is only one number to change.
document.title = 'TypeThatBook — School v' + LEARN_VERSION;

// ⚠️ Retired storage keys, dropped once per load. A key with data and no writer
// is a trap: the next person to grep for `ttb_learnpos_v1` would find live-looking
// JSON in a student's browser and no code that produced it. Cheap to keep;
// remove this call once a school year has passed. (v2.5.0)
function purgeRetiredKeys() {
    ['ttb_learnpos_v1', 'ttb_guestId', 'ttb_guestId_v2'].forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
    });
}

purgeRetiredKeys();     // v2.5.0 — checkpoints are gone; see the block above
loadAnonNudgeState();   // shared daily ladder state; see ANON_NUDGE_KEY
restoreGuestAccum();    // v2.4.0 — guest minutes now survive a closed tab

loadLessons(); // fire-and-forget; renderMap() in onAuthStateChanged will re-render when done
