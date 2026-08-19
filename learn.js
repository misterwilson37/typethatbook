// learn.js v2.12.0
//
// v2.12.0 — THE REMEDIATION VARIETY FLOOR. Closes the gap flagged in v2.11.1
//           below: "🎲 Practice missed keys" already required each letter to
//           clear n >= REMEDIATION_CHAR_MISS_THRESHOLD (3), but not that 3
//           DIFFERENT letters clear it — a student who missed only "F" a
//           dozen times could still get a synthetic key_random drill built
//           from that one letter, which isn't remediation for a pattern, it's
//           a drill on a single miss. Mirrors game.js v3.27.1's variety floor
//           exactly: same threshold, same "count qualifying letters, don't
//           just cap the display list" shape. New
//           REMEDIATION_MIN_QUALIFYING_CHARS (3) and _qualifyingRemediationChars()
//           helper (returns ALL letters clearing the per-letter threshold, not
//           the top-3 display slice); buildRemediationLinks() now checks the
//           floor before emitting the button's HTML at all — the "You often
//           missed: ..." lesson links are unaffected, since those point at a
//           real lesson per letter and were never the synthetic-drill risk.
//           Defense-in-depth: window._practiceMissedKeys() re-derives the
//           qualifying set from missedChars itself and bails if it's short,
//           the same "checked again here so nothing that reaches this
//           function directly can skip it" reasoning game.js's
//           startPracticeMode() uses. Different risk profile than game.js's
//           AI paragraph (a random-key drill, not Gemini prose one letter can
//           dominate), same fix shape.
//
// v2.11.1 — HUD LONG-FORM WIRING. ⚠️ SAME AS game.js v3.27.1's HUD half: hud.js
//           v1.2.0's new `long` flag now drives a `.hud-time-long` class and a
//           `title` attribute on #hud-time here too, kept in lockstep even
//           though School's sprintLimit is hardcoded to 0 (so `long` is always
//           false today) — see the comment at renderTimeHUD()'s hudTimer block.
//
// v2.11.0 — VERSION FOOTER REDESIGN. ⚠️ SAME AS game.js v3.27.0: #footer-primary
//           always shows learn.html/learn.js/style.css; #footer-full is the rest
//           of the deployed build (hud.js, session-log.js, stats-wal.js,
//           firebase-config.js, keyboard.js, etc.), fetched lazily on first
//           hover via versions.js's readDeployedVersions()/renderBuildList() —
//           the same mechanism index.html's build-info button already used.
//           Touch gets a tap-to-pin `.pinned` class. Replaces the old static
//           one-line footer, which showed only 'School vX / keyboard.js vY' and
//           left hud.js, session-log.js, stats-wal.js and firebase-config.js
//           with no version visible anywhere on either student page. FEATURE,
//           minor bump.
//
// v2.10.2 — ⚠️ SAME AS game.js v3.26.2: renderTimeHUD() falls back to hud.js's
//           display cache while Firestore is still being read, and loadUserStats()
//           saves to it after the authoritative read. DISPLAY ONLY.
//
// v2.10.1 — ⚠️ SAME FIX AS game.js v3.26.1: renderTimeHUD() moved OUT of the
//           gate, plus a paint at step start so there is no placeholder window
//           at all. See startGradedTimer(). Counting was correct throughout.
//
// v2.10.0 — ⚠️ ONE INCREMENT SITE. DESIGN-TELEMETRY §7 step 1.75, ruled by Jake
//           2026-08-18: time typed starts at the first CORRECT keystroke. There
//           were THREE sites — stepSeconds under the graded gate, secondsToday in
//           a second interval under an idle-only gate, and a third copy of that
//           second interval inside closeGenie() with ggBypassIdle wired
//           differently from game.js. All three are now one increment on one line
//           inside startGradedTimer(); read that function's header before adding
//           anything to it. This also closes, without fixing any of them
//           separately: the hard stop that stopped one clock and not the other,
//           the admin No-Idle flag meaning two things, and the 1s/100ms sampling
//           difference. Recorded minutes drop slightly from this deploy forward;
//           NOTHING STORED IS REWRITTEN.
//
// v2.9.1 — COMMENTS ONLY. No code, no behaviour, no field, no gate changed.
//          Invariant citations renumbered against the single consolidated
//          HANDOFF.md §5, whose numbers are APPEND-ONLY from now on. See
//          game.js v3.25.1 for why the one-time repair was unavoidable.
//
// v2.9.0 — (1) ⚠️ THE TOP-BAR READOUT MOVES TO hud.js AND IS IDENTICAL TO
//          LIBRARY'S — same element id, same string, same position. School showed
//          `Today: 9:22` and never showed the current run; Library showed one of
//          three quantities in the same slot. Both now read
//          `Daily 9:22 / 10:00` on the left and `Weekly …` on the right, and
//          renderTimeHUD() is the single writer for both.
//          (2) ⚠️ QUEUED SESSIONS UPLOAD ON HIDE AND ON pagehide, same as
//          game.js v3.25.0. See flushSessionsNow().
//
// v2.8.0 — ⚠️ THE OPEN RUN IS NOW RECORDED. Same change as game.js v3.24.0 and
//          shipped with it: a run abandoned halfway (the bell, a lid, a toggle to
//          Library) used to leave counter time with no session record. logRun()
//          writes deltas against a watermark; logOpenRun() closes the open run
//          without ending it, on visibilitychange:hidden, pagehide and
//          beforeunload. The inline sessionLogPush() in finishStep() is gone —
//          it wrote run totals, which after a partial would double-file.
//          DESIGN-TELEMETRY §7 step 1.5.
//
// v2.7.1 — Hands `serverTimestamp` to session-log.js so lesson-run rollups carry
//          `serverAt`. Identical to game.js v3.23.1 and shipped with it; if only
//          one of the two is uploaded, one mode's documents carry the field and
//          the other's do not. DESIGN-TELEMETRY.md §6.3 / §7 step 1.
//
// v2.7.0 — ⚠️ THE STATS ROLLUP NOW SHARES A WRITE TRIGGER WITH THE DAILY LOG.
//          Same change as game.js v3.23.0; read the block above the write.
//
//
// Lesson-mode engine, separate from game.js. Same write-ahead-log and
// coalesced-flush persistence pattern.
//
// ── Full history: CHANGELOG.md § learn.js ─────────────────────────────────
// ── Why it looks like this: PEDAGOGY-AUDIT.md ─────────────────────────────
//
// v2.6.0 — ⚠️ THE DOUBLED WEEK COUNTER, AND SCHOOL'S MISSING SESSION HISTORY.
//          The defect a student reported on 2026-08-18 was in THIS file, not
//          game.js — he was in lessons — and the report drill-down that would
//          have diagnosed it had never existed here at all.
//          (1) SESSION LOGGING, FIRST TIME EVER IN THIS FILE. Sprint rollups
//          were built in game.js in v3.4.0 and never built here, so a student
//          who spends the period in School leaves a daily total and no detail
//          behind it: no per-run WPM, no timeline, nothing to check work or
//          spot a suspicious jump against. It read as a regression from the
//          cost work because as lesson mode grew, the share of the roster with
//          any session detail fell toward zero. Now shared: session-log.js.
//          (2) A SIGNED-OUT USER IS NOT A GUEST. Auth sessions expire at 24h
//          and can expire mid-lesson. currentUser goes null, the drill tick
//          keeps counting (it never checked auth), anonSecondsAccum starts
//          climbing as though this were a visitor, and the guest ladder offers
//          sign-in 60 seconds later. That sign-in ran retroactiveSaveAnonSession(),
//          which ADDED the server's stored totals to counters that were seeded
//          from the server at page load. 20 minutes became 40.
//          (3) The merge is a BASELINE DIFF now — not a sum, and not a max().
//          Both are wrong, in opposite directions. See mergeGuestStats().
//
// v2.5.3 — HUD lesson label carries a title attribute, because style.css v3.5.1
//          ellipsises it. Cosmetic half of a layout fix that lives in the CSS.
//
// v2.5.2 — applyPendingClassAssignment() mirrors game.js v3.21.1: an explicit
//          reassignment is honoured, every exit consumes the record, records
//          expire at 30 days, and the shared goals cache is dropped on a move.
//          ⚠️ Two copies of this function exist on purpose (neither page
//          controller can import the other). Change one, change both.
//
// v2.5.1 — ⚠️ HOTFIX. beginStep() threw a ReferenceError on `resume`, a variable
//          v2.5.0 deleted with the checkpoint system while leaving one reader of
//          it in place. Every lesson start, every student, blank drill view. One
//          line; see the block at the assignment. Also: line 1 of this header
//          said v2.3.0 while the constant said 2.5.0 — corrected, both now 2.5.1.
//
// v2.5.0 — LESSONS ARE ATOMIC. Jake's ruling: a lesson not finished in one
//          sitting restarts, it does not resume at the last word. The whole
//          `ttb_learnpos_v1` checkpoint system is deleted — 143 lines, six
//          clearRunPosition() call sites, and the checkpointOwner() identity
//          that existed only to decide whose half-finished drill a snapshot
//          was. ⚠️ DO NOT REBUILD IT; read the block where it used to live.
//          Time is unaffected and now better: stopLesson() calls saveStats(),
//          so abandoning a lesson schedules its minutes for flush instead of
//          leaving them in memory until a hide. Adds a ↺ Restart control in the
//          HUD, which is the other half of "lessons can't be easily restarted"
//          — clicking a lesson you were part-way through used to resume it
//          silently, so there was no way to ask for a clean run at all.
//
// v2.4.0 — THE BLANK LESSON SCREEN, and progress that survives a closed tab.
//          (1) ⚠️ beginStep() never removed `hidden` from #active-drill.
//          learn.html ships that div hidden and showIntro() was the ONLY line
//          in the file that unhid it — so startLesson()'s resume path, which
//          skips the intro on purpose, showed #drill-view with BOTH children
//          hidden. Blank screen, no error, and only for a student who had a
//          checkpoint on the lesson they clicked, which is why it looked random.
//          (2) Guest checkpoints moved from sessionStorage to localStorage.
//          ⚠️ SUPERSEDED BY v2.5.0, WHICH DELETED CHECKPOINTS ENTIRELY. Kept in
//          this list because the reasoning is still the reasoning — v2.3.0's
//          shared-machine premise is false at Ellis and anything else keyed to
//          it is wrong for the same reason.
//          (3) Guest minutes and lesson results now persist across a tab close
//          (stats-wal.js guest accumulator, date-guarded) so retroactive save
//          on sign-in has something to credit.
//          (4) Day/week counters move to stats-wal.js, shared with game.js.
//          game.js's single WAL was book-scoped on recovery and overwritten
//          unconditionally on save, so closing a tab in one book and opening
//          another destroyed the first one's unflushed minutes. See that file.
//          (5) The hide-flush 60s rate limit gains a delta escape hatch.
//          (6) renderMap() builds into a fragment and swaps at the end, so a
//          throw leaves the previous map standing instead of a blank div.
//          (7) buildSequence()'s key_pattern case gets the `|| ''` every other
//          case already had.
//
// v2.3.0 — GUEST MODE, three fixes. (1) loadLessons()'s in-flight promise shared
//          a FAILED attempt with a caller that had different credentials: the
//          module-load call fired before auth, was denied, swallowed the error in
//          its own catch and resolved with an empty list — and the auth handler,
//          arriving 200ms later with a token, awaited that same doomed promise and
//          got a successful-looking empty map. Intermittent by construction: a race
//          against how warm the student's session was. ⚠️ Request coalescing is only
//          valid when the callers are interchangeable, and an unauthenticated caller
//          and an authenticated one are not. Failures are no longer shared.
//          (2) The comment above it claimed "lessons collection is public, no auth
//          needed" — false until firestore.rules v2.3.0, and the whole reason for (1).
//          (3) The resume checkpoint keyed guests on the literal string 'anon', so
//          two guests on one machine matched each other. Per-browser guest id now.
//          Login nudge rebuilt to two rungs at 60s/300s, matching game.js v3.20.0.
//
// v2.2.4 — applyPendingClassAssignment() drops the goals cache before re-reading.
//          loadGoals() had written ttb_goalsCache_v1 with classId:'' and a 24 HOUR
//          lifetime moments earlier, so the re-read handed back the empty class the
//          function had just fixed. game.js shares that key, so the poisoned entry
//          followed the student between pages, and every log flushed in the window
//          was stamped classId:''.
// v2.2.3 — beginStep()'s out-of-range guard called finishLesson(), which does not
//          exist in this file or anywhere in the repo. It threw a ReferenceError
//          from the one branch written to rescue the situation, abandoning
//          beginStep() before the intro was hidden or the keyboard wired: a dead
//          drill screen, no record written, nothing for a student to report. Now
//          clears the stale checkpoint and returns to the map.
// v2.2.2 — Firefox Quick Find fix, matching game.js 3.9.3. #drill-keyboard is a
//          div, so it absorbs nothing, and lessons drill punctuation on purpose.
// v2.2.1 — flushStats()'s re-entrancy guard was `if`, which serialises two
//          callers and lets three or more overlap. Now `while`.
// v2.2.0 — Read caching, backported from game.js. This page had NONE and was
//          the most-used one: ~115 reads per load became ~3.
//
// ── Load-bearing ──────────────────────────────────────────────────────────
//
//   * saveProgress() uses merge:true. Without it, completing a lesson erases
//     every run-level field.
//   * ttb_learnwal_v1 and ttb_learnpos_v1 both carry an explicit `v`. Bump it
//     rather than changing the payload shape, or a mid-run student on the old
//     shape gets a corrupt resume.
//   * Do NOT scale gates by grade level. An 8th grader may have had this
//     teacher twice or never; unit position is the only honest signal.
import { db, auth } from "./firebase-config.js";
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
    sessionLogInit, sessionLogPush, sessionLogFlush, sessionLogPending
} from "./session-log.js";
// The time readout, shared with game.js. ⚠️ Both pages render the SAME string in
// the SAME element id — see hud.js for why that is the whole point.
import { hudStrings, HUD_VERSION, hudCacheSave, hudCacheLoad } from "./hud.js";
// The version footer's three primary reads (this html file, this js file's own
// LEARN_VERSION, style.css) plus the lazy full-build panel on hover. ⚠️ SAME
// STRUCTURE AS game.js, ON PURPOSE — see updateVersionFooter() below.
import { readOneDeployedVersion, readDeployedVersions, renderBuildList,
         readAppliedCssVersion } from "./versions.js";
import {
    collection, getDocs, doc, getDoc, setDoc, addDoc, deleteDoc,
    // Aggregation query. Firestore bills getCountFromServer at ONE read per up
    // to 1000 matched index entries, which is what makes the lessons cache
    // validation cost 1 read instead of ~80. Available since SDK v9.11.
    getCountFromServer,
    // v2.7.1 — for session-log.js's `serverAt` and nothing else. ⚠️ Do not reach
    // for it in flushStats(): a sentinel inside the typing_logs or
    // stats/time_tracking merge writes would be a second dating scheme on the
    // two documents Round 12 spent a day getting to agree.
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
const LEARN_VERSION = "2.12.0";

// Hand the shared session queue its Firestore surface, once, at module scope.
// session-log.js imports no SDK of its own on purpose — see that file.
//
// ⚠️ THIS LINE MUST MATCH game.js's. Both page controllers configure the same
// shared module, and a dependency passed on one side and not the other means
// School and Library write differently shaped documents — which is the R2
// symmetry failure DESIGN-TELEMETRY.md exists to prevent, in its smallest
// possible form. session-merge-test.mjs Part C asserts the two calls agree.
sessionLogInit({ db, collection, addDoc, serverTimestamp });

const ADMIN_EMAILS = [
    "jacob.wilson@sumnerk12.net",
    "jacob.v.wilson@gmail.com",
];

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
let statsData = { secondsToday:0, secondsWeek:0, charsToday:0, charsWeek:0,
                  mistakesToday:0, mistakesWeek:0, lastDate:'', weekStart:0 };

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
                      mistakesToday:0, mistakesWeek:0 };

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

const STAT_KEYS = ['secondsToday','charsToday','mistakesToday',
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

    const fold = (key, matches) => {
        const live = statsData[key] || 0;
        const base = statsBaseline[key] || 0;
        // Clamped at zero: a counter lower than its baseline means the day or
        // week rolled over underneath us, and a negative contribution would
        // subtract real stored work.
        const mine = Math.max(0, live - base);
        const server = matches ? (d[key] || 0) : 0;
        // The outer max() is a FLOOR, not the merge. It guarantees the result
        // can never land below what this browser already shows the student.
        statsData[key] = Math.max(live, server + mine);
    };

    for (const k of ['secondsToday','charsToday','mistakesToday']) fold(k, dayMatches);
    for (const k of ['secondsWeek','charsWeek','mistakesWeek'])    fold(k, weekMatches);

    statsData.lastDate  = dateStr;
    statsData.weekStart = weekStart;
    captureStatsBaseline();
}
let goals     = { dailySeconds: 0, weeklySeconds: 0 };
let classInfo = { id: '', name: '', dailySeconds: 0, weeklySeconds: 0 };
let dailyGoalCelebrated  = false;
let weeklyGoalCelebrated = false;
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
const CHUNK_TARGET = 150;   // ≈30–60s at these gates; matches game.js sprint length
const CHUNK_SLACK  = 1.30;  // a 180-char step stays whole rather than becoming 150+30

let currentRuns    = [];  // expanded + chunked runs for the current lesson
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

// ─── Auth ─────────────────────────────────────────────────────────────────────
document.getElementById('login-btn').onclick = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch(e) { console.error(e); }
};
document.getElementById('logout-btn').onclick = async () => {
    // Clear the marker FIRST. A deliberate sign-out must not be mistaken for an
    // expired session by the handler that is about to fire.
    try { await flushStats('signout', true); } catch (_) {}
    lastKnownUid = ''; sessionExpired = false;
    try { await signOut(auth); } catch(e) { console.error(e); }
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
    renderIdStamp();
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
function renderIdStamp() {
    let el = document.getElementById('ttb-id-stamp');
    const uid = (currentUser && !currentUser.isAnonymous) ? currentUser.uid
              : (sessionExpired ? lastKnownUid : '');
    if (!uid) { if (el) el.remove(); return; }
    if (!el) {
        el = document.createElement('div');
        el.id = 'ttb-id-stamp';
        el.style.cssText = 'position:fixed;bottom:4px;left:8px;z-index:9998;' +
            'font-family:monospace;font-size:0.7rem;opacity:0.45;cursor:pointer;' +
            'user-select:all;';
        el.onclick = () => {
            const full = el.dataset.uid || '';
            if (full && navigator.clipboard) navigator.clipboard.writeText(full).catch(() => {});
        };
        document.body.appendChild(el);
    }
    el.dataset.uid = uid;
    el.title = 'Student ID: ' + uid + ' (click to copy)';
    el.textContent = 'ID ' + uid.slice(0, 8);
}

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
        const statsRef = doc(db, 'users', user.uid, 'stats', 'time_tracking');
        const statsSnap = await getDoc(statsRef);
        mergeGuestStats(statsSnap.exists() ? statsSnap.data() : null, dateStr, weekStart);
        sessionExpired = false;
        await setDoc(statsRef, statsData, { merge: true });

        // Save lesson progress accumulated during anon session
        const GRADE_ORDER = ['F','D','C','B','A', 'A' + String.fromCodePoint(0x1F525)];
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
    userProgress = {};

    const cached = cacheRead(PROGRESS_CACHE_KEY, PROGRESS_CACHE_MS, currentUser.uid);
    if (cached && cached.progress && typeof cached.progress === 'object') {
        userProgress = cached.progress;
        return;
    }

    try {
        const snap = await getDocs(collection(db, 'users', currentUser.uid, 'lessonProgress'));
        snap.forEach(d => { userProgress[d.id] = d.data(); });
        cacheWrite(PROGRESS_CACHE_KEY, { uid: currentUser.uid, progress: userProgress });
    } catch(e) { console.warn('Could not load lesson progress:', e); }
}

// Called after every local progress write so the cache tracks what this tab
// already knows. Without this the cache would go stale the instant a student
// finished a lesson, and the next load would show them un-completing it.
function refreshProgressCache() {
    if (!currentUser) return;
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
function renderMap() {
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

            const card = document.createElement('div');
            card.className = 'map-lesson-card' +
                (isLocked ? ' locked' : '') +
                (isDone   ? ' completed' : '') +
                (isNext   ? ' active-next' : '');

            const keysLabel = (lesson.newKeys || []).length
                ? lesson.newKeys.map(k => k.toUpperCase()).join(' ')
                : (lesson.unit === 7 ? '★' : '↺');

            card.innerHTML = `
                <div class="mlc-keys">${keysLabel}</div>
                <div class="mlc-title">${escHtml(lesson.title || lesson.id)}</div>
                <div class="mlc-meta">${mapMeta(lesson)}</div>
                <div class="mlc-stars">${gradeOnMap(grade)}</div>
                ${isLocked ? '<div class="mlc-lock">🔒</div>' : ''}
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

const FIRE_GRADE = 'A' + String.fromCodePoint(0x1F525); // A🔥

// v2.0.0 grade model.
//
// Accuracy is the gate. Speed sets the badge. Three things changed and each fixes a
// specific way the old model punished the wrong student:
//
//   1. C now ADVANCES. Under the old model both gates had to be met, so 14 WPM at
//      100% accuracy failed while 15 WPM at 85% passed — the more careful typist
//      was the one held back. Accuracy met + speed short is a pass with a C.
//   2. D/F depend on accuracy alone. Being slow is never failing.
//   3. A🔥 is reachable. It was 2× the WPM gate at 95% accuracy, which on a 49-char
//      drill meant 30 WPM at 0.40s/keystroke — an adult touch-typist number sitting
//      permanently on the lesson map where every student could see it and none
//      could earn it. On drill runs it is now a clean run (zero mistakes), fully
//      inside the student's control. On prose runs it is 1.5× rather than 2×.
//
// `minWPM: null` (every key-drill run) means speed is measured and displayed but
// not graded. `clean` is a true zero-mistake flag, not rounded accuracy — 99.6%
// rounds to 100 and should not earn a badge that says perfect.
function calculateGrade(wpm, acc, minWPM, minAcc, clean) {
    if (acc < minAcc) return acc < minAcc * 0.80 ? 'F' : 'D';

    // Accuracy-only run: the badge is about how clean it was.
    if (minWPM == null) {
        if (clean)     return FIRE_GRADE;
        if (acc >= 95) return 'A';
        return 'B';
    }

    if (wpm >= minWPM) {
        if (wpm >= minWPM * 1.5  && acc >= 95) return FIRE_GRADE;
        if (wpm >= minWPM * 1.15 && acc >= 90) return 'A';
        return 'B';
    }
    return 'C';   // accuracy met, speed short — advances
}

// Advancement, in one place so the modals can't disagree about it.
function gradeAdvances(grade, gates) {
    if (grade === 'D' || grade === 'F') return false;
    if (grade === 'C' && gates && gates.strictSpeed) return false;
    return true;
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

// ─── Start Lesson ─────────────────────────────────────────────────────────────
function startLesson(lesson) {
    currentLesson  = lesson;
    currentRuns    = buildRunList(lesson);
    currentStepIdx = 0;
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
        if (hudLessonLabel && hudLessonLabel.parentNode) {
            hudLessonLabel.parentNode.insertBefore(btn, hudLessonLabel.nextSibling);
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
        beginStep(0);
    };

    // Enter key activates Start Lesson from the intro screen
    function introEnterHandler(e) {
        if (e.key === 'Enter' && !introPanel.classList.contains('hidden')) {
            e.preventDefault();
            document.removeEventListener('keydown', introEnterHandler);
            stopIntroAnim();
            beginStep(0);
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
    timerInterval = setInterval(() => {
        // The graded gate, and now the only gate. `drillPos > 0` means at least
        // one correct character; isDrillIdle() is false only within
        // LEARN_IDLE_THRESHOLD of the last input of any kind.
        if (drillPos > 0 && !isDrillIdle()) {
            stepSeconds++;
            learnActiveSeconds++;
            statsData.secondsToday++;
            statsData.secondsWeek++;
            if (!currentUser || currentUser.isAnonymous) {
                anonSecondsAccum++;
                if (anonSecondsAccum % GUEST_ACCUM_SAVE_EVERY === 0) persistGuestAccum();
                armAnonLoginPrompt();   // fires at the run boundary, not here
            }
            // Midnight rollover
            const todayStr = getLocalDateStr();
            if (statsData.lastDate && statsData.lastDate !== todayStr) {
                statsData.secondsToday = 1; statsData.charsToday = 0; statsData.mistakesToday = 0;
                statsData.lastDate = todayStr; dailyGoalCelebrated = false;
                const ws = getWeekStart(new Date());
                if (statsData.weekStart !== ws) {
                    statsData.secondsWeek = 1; statsData.charsWeek = 0; statsData.mistakesWeek = 0;
                    statsData.weekStart = ws; weeklyGoalCelebrated = false;
                }
            }
            // Goal celebrations
            if (goals.dailySeconds > 0 && !dailyGoalCelebrated && statsData.secondsToday >= goals.dailySeconds) {
                dailyGoalCelebrated = true; launchConfetti();
            }
            if (goals.weeklySeconds > 0 && !weeklyGoalCelebrated && statsData.secondsWeek >= goals.weeklySeconds) {
                weeklyGoalCelebrated = true; launchFireworks();
            }
            // ⚠️ ONE CALL DRAWS BOTH SLOTS (v2.9.0).
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

// ─── Chunking ────────────────────────────────────────────────────────────────
// Split a character array into runs of roughly CHUNK_TARGET, breaking only at
// spaces so no word or drill group is ever cut in half. Leading spaces are dropped
// from each chunk after the first, so a chunk never opens by asking for a space.
function chunkSequence(seq) {
    if (seq.length <= CHUNK_TARGET * CHUNK_SLACK) return [seq];

    // Aim for equal-sized chunks rather than filling to the brim and leaving a
    // stub: 320 chars becomes 160+160, not 150+150+20.
    const n      = Math.ceil(seq.length / CHUNK_TARGET);
    const target = Math.ceil(seq.length / n);
    const chunks = [];
    let start = 0;

    const STUB = Math.floor(target * 0.5);   // don't leave a fragment behind

    while (start < seq.length) {
        while (start < seq.length && seq[start] === ' ') start++;   // trim leading space
        if (start >= seq.length) break;

        let end = start + target;
        if (end >= seq.length) { chunks.push(seq.slice(start)); break; }

        // Walk back to the nearest space so the break lands between words/groups.
        let cut = end;
        while (cut > start && seq[cut] !== ' ') cut--;
        // No space in range (one very long token) — fall forward instead of
        // producing a zero-length chunk, which would loop forever.
        if (cut === start) {
            cut = end;
            while (cut < seq.length && seq[cut] !== ' ') cut++;
        }
        // If what's left would be a stub, swallow it now. Otherwise the last run of
        // a chunked step ends up being five characters with its own results modal,
        // which reads as a bug even though the arithmetic is fine.
        if (seq.length - cut <= STUB) { chunks.push(seq.slice(start)); break; }

        chunks.push(seq.slice(start, cut));
        start = cut;
    }
    return chunks.filter(c => c.length > 0);
}

// Which step types are pure key drills. These are graded on accuracy only — speed
// on random letter groups is not a meaningful measure of anything, and gating it
// made the new-key drill the hardest thing in its own lesson.
const DRILL_TYPES = new Set(['key_pattern', 'key_pattern_auto', 'key_random']);

// Effective gates for a run. Precedence: explicit step.gates > type default >
// lesson gates. `minWPM: null` means speed is recorded but not gated.
function gatesForRun(run) {
    const lg  = currentLesson ? (currentLesson.gates || {}) : {};
    const acc = lg.minAccuracy == null ? 85 : lg.minAccuracy;
    const wpm = lg.minWPM     == null ? 15 : lg.minWPM;

    // strictSpeed makes a short-on-speed result (grade C) block advancement again.
    // Nothing sets it today. Add `"gates": { ..., "strictSpeed": true }` to the
    // Unit 7 graduation lessons via Import JSON if you ever want 25 WPM enforced
    // rather than advisory — the engine already honours it.
    const strict = !!lg.strictSpeed;

    if (run && run.gates) {
        return { minAccuracy: run.gates.minAccuracy == null ? acc : run.gates.minAccuracy,
                 minWPM:     run.gates.minWPM     === undefined ? wpm : run.gates.minWPM,
                 strictSpeed: run.gates.strictSpeed == null ? strict : !!run.gates.strictSpeed };
    }
    if (run && DRILL_TYPES.has(run.type)) {
        return { minAccuracy: acc, minWPM: null, strictSpeed: false };
    }
    return { minAccuracy: acc, minWPM: wpm, strictSpeed: strict };
}

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
        const g = [];
        // Shuffle-ish: pick keys ensuring reach keys appear often
        for (let j = 0; j < groupSize; j++) {
            const pool = j % 2 === 0 ? reachKeys : uniqueKeys;
            g.push(pool[Math.floor(Math.random() * pool.length)]);
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

// Home-key companions: for any reach key, the same finger's home-row key.
// Using the same indices as keyboard.js getHomePositions (rows[1] positions 0-9).
const REACH_HOME_COMPANION = {
    'q':'a','z':'a',                         // left-pinky reaches → a
    'w':'s','x':'s',                         // left-ring reaches → s
    'e':'d','c':'d',                         // left-middle reaches → d
    'r':'f','t':'f','g':'f','v':'f','b':'f', // left-index reaches → f
    'y':'j','u':'j','h':'j','n':'j','m':'j', // right-index reaches → j
    'i':'k',',':'k',                         // right-middle reaches → k
    'o':'l','.':'l',                         // right-ring reaches → l
    'p':';','[':';',']':';','\\':';','\'':';','/':';', // right-pinky reaches → ;
    // Number row — same finger as the letter below
    '1':'a','2':'s','3':'d','4':'f','5':'f',
    '6':'j','7':'j','8':'k','9':'l','0':';'
};

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
        for (let i = 0; i < groupSize; i++) {
            chars.push(effectiveKeySet[Math.floor(Math.random() * effectiveKeySet.length)]);
        }
    }
    return chars;
}

// ─── Keypress Handler ─────────────────────────────────────────────────────────
function handleDrillKey(e) {
    // Ignore modifier keys
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    if (e.key === 'CapsLock') return;

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
    if (wasIdle && drillPos < drillSequence.length && drillSequence[drillPos] === ' ') {
        drillPos++;
        if (drillPos >= drillSequence.length) { finishStep(); return; }
    }
    const newExpected = drillSequence[drillPos];

    chars++;
    if (typed === newExpected) {
        flashFingerPressed(drillKeyboard);
        drillConsecutiveMistakes = 0; // reset on any correct key
        learnLastInputTime = Date.now();
        statsData.charsToday++;  statsData.charsWeek++;

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
        statsData.mistakesToday++; statsData.mistakesWeek++;
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
function logRun(wpm, acc, detailSuffix) {
    const sessionUid = currentUser ? currentUser.uid : (sessionExpired ? lastKnownUid : '');
    if (!sessionUid) return;                     // a true guest has no account yet

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
        date: getLocalDateStr(),
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
function logOpenRun(reason) {
    if (stepSeconds <= 0 && chars <= 0) return;
    logRun(netWPM(), accuracyPct(), reason ? '(' + reason + ')' : '(interrupted)');
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

    const gates    = gatesForRun(currentStep);
    const minWPM   = gates.minWPM;
    const minAcc   = gates.minAccuracy;
    const grade    = calculateGrade(wpm, acc, minWPM, minAcc, mistakes === 0);
    const canAdvance = gradeAdvances(grade, gates);

    recordRunOutcome(currentStepIdx, grade, canAdvance);

    document.getElementById('dm-title').textContent = 'Step ' + nextIdx + ' of ' + totalSteps + ' done';
    document.getElementById('dm-stars').innerHTML = gradeHTML(grade);

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

function showLessonResultModal(wpm, acc) {
    const gates  = gatesForRun(currentStep);
    const minWPM = gates.minWPM;
    const minAcc = gates.minAccuracy;

    const grade  = calculateGrade(wpm, acc, minWPM, minAcc, mistakes === 0);
    const passed = gradeAdvances(grade, gates);

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
        const GRADE_ORDER = ['F','D','C','B','A', FIRE_GRADE];
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
    document.getElementById('dm-stars').innerHTML = gradeHTML(grade);
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
function _qualifyingRemediationChars() {
    return Object.entries(missedChars)
        .filter(([ch, n]) => n >= REMEDIATION_CHAR_MISS_THRESHOLD)
        .sort((a, b) => b[1] - a[1]);
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
    currentRuns = chunkSequence(buildSequence(syntheticStep)).map((seq, i, all) => ({
        stepId: 'remediation', stepIdx: 0, chunkIdx: i, chunkCount: all.length,
        type: syntheticStep.type, anchorEnforced: false, gates: null, sequence: seq,
        label: syntheticStep.label + (all.length > 1 ? ` (${i + 1}/${all.length})` : ''),
    }));
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

function recordRunOutcome(runIdx, grade, advanced) {
    if (!currentLesson) return;
    const id   = currentLesson.id;
    const prev = userProgress[id] || {};
    const key  = String(runIdx);

    const runAttempts = Object.assign({}, prev.runAttempts);
    const runFailures = Object.assign({}, prev.runFailures);
    runAttempts[key] = (runAttempts[key] || 0) + 1;
    if (!advanced) runFailures[key] = (runFailures[key] || 0) + 1;

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

async function saveProgress(passed, wpm, acc, grade) {
    if (!currentUser || !currentLesson) return;
    const prev = userProgress[currentLesson.id] || {};
    const attempts  = (prev.attempts || 0) + 1;
    // NOT prev + stepSeconds: recordRunOutcome already added this run's seconds to
    // prev.timeSpentSeconds a moment ago. Adding again would double-count the final run.
    const timeSpent = prev.timeSpentSeconds || 0;

    // Keep best grade seen — order: F D C B A A🔥
    const GRADE_ORDER = ['F','D','C','B','A','A🔥'];
    const prevGrade   = prev.grade || 'F';
    const bestGrade   = GRADE_ORDER.indexOf(grade) > GRADE_ORDER.indexOf(prevGrade) ? grade : prevGrade;

    const record = {
        // Spread prev first so the run-level fields written by recordRunOutcome
        // survive. saveProgress used setDoc WITHOUT merge, so completing a lesson
        // would otherwise wipe runAttempts/runFailures/furthestRunIdx on the way past.
        ...prev,
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
    } catch(e) { console.warn('Could not save lesson progress:', e); }
}

// ─── Navigation ──────────────────────────────────────────────────────────────
function showView(which) {
    mapView.classList.toggle('hidden', which !== 'map');
    drillView.classList.toggle('hidden', which !== 'drill');
}

function stopLesson() {
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
    backBtn.href = 'index.html'; backBtn.onclick = null;
    hudLessonLabel.textContent = '';
    hudLessonLabel.title = '';
    document.getElementById('drill-keyboard-wrap').style.display = '';
    drillModal.classList.add('hidden');
    wpmDisplay.textContent = '—';
    accDisplay.textContent = '—';
    loadUserProgress().then(() => {
        renderMap();
        showView('map');
    });
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
            // typing_logs and skips the stats/time_tracking rollup, which is
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
        const snap = await getDoc(doc(db, 'users', currentUser.uid, 'stats', 'time_tracking'));
        if (snap.exists()) {
            const data = snap.data();
            if (data.lastDate === dateStr) {
                statsData.secondsToday  = data.secondsToday  || 0;
                statsData.charsToday    = data.charsToday    || 0;
                statsData.mistakesToday = data.mistakesToday || 0;
            } else {
                statsData.secondsToday = statsData.charsToday = statsData.mistakesToday = 0;
            }
            if ((data.weekStart || '') === weekStart) {
                statsData.secondsWeek  = data.secondsWeek  || 0;
                statsData.charsWeek    = data.charsWeek    || 0;
                statsData.mistakesWeek = data.mistakesWeek || 0;
            } else {
                statsData.secondsWeek = statsData.charsWeek = statsData.mistakesWeek = 0;
            }
        }
        statsData.lastDate  = dateStr;
        statsData.weekStart = weekStart;

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
        const c = (c0 && c0.classId && !c0.className) ? null : c0;
        if (c) {
            goals.dailySeconds  = c.dailySeconds  || 0;
            goals.weeklySeconds = c.weeklySeconds || 0;
            classInfo = { id: c.classId || '', name: c.className || '',
                          schoolId: c.schoolId || '',
                          dailySeconds: goals.dailySeconds,
                          weeklySeconds: goals.weeklySeconds };
            updateClassDisplay();
            if (goals.dailySeconds  > 0 && statsData.secondsToday >= goals.dailySeconds)  dailyGoalCelebrated  = true;
            if (goals.weeklySeconds > 0 && statsData.secondsWeek  >= goals.weeklySeconds) weeklyGoalCelebrated = true;
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

        if (goals.dailySeconds  > 0 && statsData.secondsToday >= goals.dailySeconds)  dailyGoalCelebrated  = true;
        if (goals.weeklySeconds > 0 && statsData.secondsWeek  >= goals.weeklySeconds) weeklyGoalCelebrated = true;
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
        hudTimer.textContent = hud.left;
        hudTimer.style.color = hud.dailyDone ? '#22c55e' : '';
        // ⚠️ v2.11.1 — SAME AS game.js's updateTimerUI(). hud.long is always
        // false here today (sprintLimit is hardcoded to 0 above — School has no
        // per-run time target), but kept in lockstep on purpose: hud.js's
        // header is explicit that this readout must stay identical on both
        // pages, and a future School sprint feature shouldn't silently reopen
        // the truncation bug game.js just got fixed for.
        hudTimer.classList.toggle('hud-time-long', !!hud.long);
        hudTimer.title = hud.left;
    }
    const weekEl = document.getElementById('hud-week');
    if (weekEl) {
        weekEl.textContent = hud.right;
        weekEl.style.color = hud.weeklyDone ? '#22c55e' : '#aaa';
    }
}

// Kept as an alias: several call sites read naturally as "the week changed,
// redraw". Both slots come from one call now, so either name refreshes both.
function updateWeeklyHUD() { renderTimeHUD(); }

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
        if (wal.stats.lastDate === statsData.lastDate) {
            for (const k of ['secondsToday', 'charsToday', 'mistakesToday']) {
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

async function flushStats(reason, final = false) {
    while (_learnFlushInFlight) {
        await _learnFlushInFlight.catch(() => {});
    }
    _learnFlushInFlight = _flushStatsInner(reason, final);
    try { await _learnFlushInFlight; }
    finally { _learnFlushInFlight = null; }
}

async function _flushStatsInner(reason, final = false) {
    if (!currentUser) return;
    if (!learnDirty && pendingProgress.size === 0) return;
    if (learnFlushTimer) { clearTimeout(learnFlushTimer); learnFlushTimer = null; }
    let ok = true;

    // Daily log — what reports.html reads. Written on every flush so a teacher
    // checking mid-period sees today's numbers.
    try {
        const today = getLocalDateStr();
        await setDoc(doc(db, 'typing_logs', currentUser.uid + '_' + today), {
            uid: currentUser.uid, email: currentUser.email || '',
            displayName: currentUser.displayName || 'Anonymous',
            classId: (classInfo && classInfo.id) || '',
            schoolId: (classInfo && classInfo.schoolId) || '',
            date: today, seconds: statsData.secondsToday || 0,
            chars: statsData.charsToday || 0, mistakes: statsData.mistakesToday || 0,
            lastUpdated: new Date(), source: 'school'
        }, { merge: true });
    } catch (e) { ok = false; console.warn(`Log flush failed (${reason}):`, e); }

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
    {
        try {
            await setDoc(doc(db, 'users', currentUser.uid, 'stats', 'time_tracking'),
                         statsData, { merge: true });
            learnStatsDocDirty = false;
        } catch (e) { ok = false; console.warn(`Stats flush failed (${reason}):`, e); }
    }

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
function createCelebrationCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    document.body.appendChild(canvas); return canvas;
}

function showGoalToast(message, color) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:' + color + ';color:#000;font-family:"Courier Prime",monospace;font-weight:700;font-size:1.2rem;padding:14px 28px;border-radius:8px;z-index:10000;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 3000);
}

function launchConfetti() {
    const canvas = createCelebrationCanvas();
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const colors = ['#4B9CD3','#FFD700','#FF6B6B','#22c55e','#FF69B4','#FFA500','#9B59B6','#00CED1'];
    const pieces = [];
    for (let i = 0; i < 150; i++) {
        pieces.push({ x: W*0.5+(Math.random()-0.5)*W*0.6, y:-20-Math.random()*100,
            w:6+Math.random()*6, h:10+Math.random()*8, color:colors[Math.floor(Math.random()*colors.length)],
            rotation:Math.random()*Math.PI*2, rotSpeed:(Math.random()-0.5)*0.15,
            vx:(Math.random()-0.5)*4, vy:2+Math.random()*3,
            wobble:Math.random()*Math.PI*2, wobbleSpeed:0.03+Math.random()*0.05 });
    }
    showGoalToast('🎉 Daily Goal Reached!', '#22c55e');
    let frame = 0;
    (function animate() {
        ctx.clearRect(0,0,W,H); let alive=false;
        pieces.forEach(p => {
            p.x+=p.vx+Math.sin(p.wobble)*0.5; p.y+=p.vy; p.vy+=0.04;
            p.rotation+=p.rotSpeed; p.wobble+=p.wobbleSpeed; p.vx*=0.99;
            if(p.y<H+50){ alive=true; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rotation);
                ctx.fillStyle=p.color; ctx.globalAlpha=Math.max(0,1-(frame/200));
                ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore(); }
        });
        frame++; if(alive&&frame<250) requestAnimationFrame(animate); else canvas.remove();
    })();
}

function launchFireworks() {
    const canvas = createCelebrationCanvas();
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const colors = ['#4B9CD3','#FFD700','#FF6B6B','#22c55e','#FF69B4','#FFA500','#9B59B6','#00CED1','#fff'];
    const shells = [], particles = [];
    for(let i=0;i<5;i++) setTimeout(()=>{
        shells.push({x:W*(0.2+Math.random()*0.6),y:H,vy:-(8+Math.random()*4),
            targetY:H*(0.15+Math.random()*0.35),color:colors[Math.floor(Math.random()*colors.length)],exploded:false});
    },i*400);
    showGoalToast('🎆 Weekly Goal Reached!', '#FFD700');
    let frame=0;
    (function animate(){
        ctx.clearRect(0,0,W,H);
        shells.forEach(s=>{
            if(s.exploded)return; s.y+=s.vy; s.vy+=0.12;
            ctx.beginPath();ctx.arc(s.x,s.y,2,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
            if(s.y<=s.targetY||s.vy>=0){
                s.exploded=true;
                for(let i=0;i<80;i++){
                    const angle=(Math.PI*2*i)/80+(Math.random()-0.5)*0.3, speed=2+Math.random()*4;
                    particles.push({x:s.x,y:s.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
                        color:Math.random()>0.3?s.color:colors[Math.floor(Math.random()*colors.length)],
                        life:1.0,decay:0.008+Math.random()*0.012,size:1.5+Math.random()*2});
                }
            }
        });
        for(let i=particles.length-1;i>=0;i--){
            const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.04; p.vx*=0.98; p.life-=p.decay;
            if(p.life<=0){particles.splice(i,1);continue;}
            ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
            ctx.fillStyle=p.color;ctx.globalAlpha=p.life;ctx.fill();
        }
        ctx.globalAlpha=1; frame++;
        if(frame<400&&(particles.length>0||shells.some(s=>!s.exploded))) requestAnimationFrame(animate);
        else canvas.remove();
    })();
}

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
    if (full) full.dataset.loaded = 'false';
}

function _renderFullBuildPanel(results) {
    const full = document.getElementById('footer-full');
    if (!full) return;
    let html = `<div style="opacity:.6;margin-bottom:4px">learn.html (this page)</div>`
             + renderBuildList(results);
    // keyboard.js is imported statically (not dynamically like game.js's
    // adventure-renderer.js), so KB_VERSION here IS the deployed constant —
    // no separate drift check needed the way adventure-renderer.js gets one.
    full.innerHTML = html;
    full.dataset.loaded = 'true';
}

let _buildFetchPromise = null;
function _ensureFullBuildLoaded() {
    const full = document.getElementById('footer-full');
    if (!full || full.dataset.loaded === 'true') return;
    if (!_buildFetchPromise) {
        full.innerHTML = '<div style="opacity:.6">Reading deployed files…</div>';
        _buildFetchPromise = readDeployedVersions()
            .then(results => { _renderFullBuildPanel(results); _buildFetchPromise = null; })
            .catch(() => {
                full.innerHTML = '<div style="color:#ff8a65">Could not read build info.</div>';
                _buildFetchPromise = null;
            });
    }
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
