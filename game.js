// game.js v3.45.0
//
// v3.45.0 — ⚠️ THE BUILD PANEL NO LONGER KEEPS ITS OWN "already loaded" FLAG.
//           It was a THIRD layer of staleness on top of versions.js's cache and
//           the HTTP cache, and none of the three expired inside a tab — which
//           is why a hard reload could not refresh the one instrument that
//           reports what is deployed. versions.js v1.13.0 owns freshness now
//           (60s TTL, page-scoped); this file just asks on every hover.
//           ⚠️ DO NOT REINTRODUCE A CACHE HERE. HANDOFF §0.-22.
//
// v3.44.0 — ROADMAP item 10's ACTIVE-DAY COUNTER, and nothing else. This file
//           renders no lesson gate; it counts days, because Jake's rule is "a
//           month of typing ANYTHING" and a period spent in Library is an active
//           day that a School lesson has to know about. ⚠️ TWIN OF learn.js's
//           noteActiveDay() — a page that fails to count silently starves the
//           gate on the OTHER page, with no error and no symptom except a review
//           window that never opens. lesson-gate-test.mjs section G greps both.
//           ⚠️ THE CALL SITS BELOW THE TICK'S INCREMENTS, NOT BETWEEN THEM AND
//           THE GATE — open-unit-test.mjs Part E asserts those two are adjacent.
//
// v3.43.0 — ⚠️⚠️ THE BUILD PANEL WAS UNREADABLE AND ITS LOUDEST WARNING WAS
//           FALSE. Two independent defects in one hover. (1) adventure.css's
//           unscoped `body footer { opacity:.55 }` faded the whole subtree,
//           panel included, in EVERY view — fixed in adventure.css v1.0.3 /
//           style.css v3.8.1. (2) ⚠️ THE ONE IN THIS FILE: the renderer-drift
//           check guarded against 'failed' but not against '—', the
//           NEVER-MOUNTED sentinel, so classic view — the default — printed
//           "mounted v—, deployed file reads v1.5.4 — stale module cache" on
//           every single session. A red alarm that is always on is not an
//           alarm. It now requires a real semver. ⚠️ AND THE ⚠ NOTES ARE
//           STAFF-ONLY: versions.js v1.12.0 gates them, this file passes the
//           flag and re-renders from cache when auth changes underneath. See
//           HANDOFF §0.-20.
//
// v3.42.3 — THE CORNER ID STAMP IS GONE; the student ID moved into the Settings
//           menu with its click-to-copy intact. renderIdStamp() deleted from BOTH
//           writers in one commit — it was the duplicated twin its own header
//           warned about. ⚠️ HANDOFF §2's deploy check named the stamp and has
//           been rewritten; the build footer is the instrument now. §0.-19.
//
// v3.42.2 — ⚠️⚠️ "I'M DONE" WAS NEVER WIRED IN LIBRARY. handleImDone() shipped in
//           v3.42.0 complete and correct; the button shipped in game.html; the
//           style shipped in style.css v3.7.2; receipt.js shipped to draw the
//           card. **The line attaching the handler to the button did not.**
//           Clicking it produced no handler, no error and no console output —
//           reported by Jake on 2026-08-22 after typing Pinocchio.
//           ⚠️ learn.js WIRED ITS IDENTICAL BUTTON CORRECTLY. Round 26 built both
//           halves of a twin and connected one — the sixth twin failure of the
//           week (§0.-13.E), and the first to reach a child.
//           ⚠️ NO HARNESS COULD HAVE CAUGHT IT: undefined-calls-test asks whether
//           every reference RESOLVES, and handleImDone resolves perfectly — it is
//           simply never referenced. tests/dead-handler-test.mjs now asks the
//           mirror question. HANDOFF §0.-18.
//
// v3.42.1 — ⚠️ STAMP ONLY, NO BEHAVIOUR. `const VERSION` still read "3.38.0"
//           after v3.38.1, v3.39.0, v3.39.1, v3.40.0, v3.41.0 and v3.42.0 all
//           shipped. ⚠️⚠️ THE COST WAS AIMED SQUARELY AT MONDAY'S CUTOVER
//           VERIFICATION: ROADMAP told Jake to check the footer for v3.38.1
//           before concluding anything about a stale-day carry, and a correctly
//           deployed build was going to answer "3.38.0" — the PRE-FIX version.
//           The one instrument for telling "the fix never reached the browser"
//           apart from "the fix is there and something else is wrong" was
//           reporting the wrong answer, in the direction that sends you chasing
//           the update gate. See HANDOFF §0.-14.
//           ⚠️ The warning at line ~84 about this exact defect has now been true
//           twice, so v3.42.1 also puts the reminder ON the constant itself.
//
// v3.42.0 — "I'M DONE" (ROADMAP item 0d). A student-facing exit that files the
//           open sprint and takes a `final` flush, then shows receipt.js's
//           stamped card. ⚠️ IT IS A RECEIPT, NOT A SAVE BUTTON — nothing is
//           gated on it, nothing warns if it is skipped, and ← Library and
//           (Logout) remain untouched. See handleImDone() and receipt.js.
//
// v3.41.0 — THE CELEBRATIONS MOVED TO celebrate.js, and the fireworks DOUBLED
//           there (10 shells, not 5; twice the run time). Jake's "so double it"
//           meant the display, not the odds — the weekly goal is crossed once a
//           week per child and should be impossible to miss. ⚠️ The fourth
//           hand-maintained twin found in one day, and it had already drifted.
//
//
//
//
//
// Typing engine, sprint timer, WPM/accuracy, streaks, leaderboard, practice
// mode, chapter navigation, all modals, write-ahead-log persistence.
//
// ── Full history: CHANGELOG.md § game.js ──────────────────────────────────
//
// ⚠️ v3.43.0 — 33 OLDER ENTRIES (v3.39.0 back to v3.17.0) MOVED TO CHANGELOG.md
//    § ARCHIVED FILE HEADERS. Nothing was deleted. The header budget is
//    PROPORTIONAL now — see versions.js's HEADER_MAX_LINES — so this block is
//    allowed to grow as the file does. The ENTRY budget is not proportional and
//    is the one that fired: a changelog nobody scrolls to the bottom of is the
//    defect, and it does not get better because the file got bigger.
//
// ── Load-bearing. Do not "simplify" these ─────────────────────────────────
//
//   * The write-ahead log is MORE durable than the per-sentence writes it
//     replaced. visibilitychange:hidden is the flush event that matters;
//     beforeunload does not fire reliably on Chromebooks.
//   * The leaderboard cache is deliberately NOT busted on the hot path.
//     Doing so cost ~$34,300/year at 7,000 students.
//   * VIEW_MODE is `let`. It changes at runtime three ways: Settings, the
//     splash, and reconciliation against the student's Firestore profile.
//   * applyViewMode() must replay textLoaded + positionSet. A renderer
//     mounted mid-session missed those events and will draw nothing.
import { db, auth, ADMIN_EMAILS, isStaffUser } from "./firebase-config.js";
// ROADMAP item 10's gate lives in School, but its clock is fed from BOTH pages —
// Jake: "when I say a month, I mean a month of typing ANYTHING". A student who
// spends the period in Library is having an active day, and a School lesson must
// know about it. ⚠️ THIS FILE IMPORTS THE MODULE ONLY TO COUNT DAYS; it renders
// no lesson gate and must not start.
import { activeDayPlan } from "./lesson-gate.js";
// The day/week counters' WAL, shared with learn.js. Extracted BECAUSE this
// file's WAL was the bug: one key held reading position (book-scoped) and the
// time counters (not book-scoped), and walRecover()'s correct bookId guard
// meant the counters were declined on a book switch and then overwritten.
import { statsWalSave, statsWalRecover } from "./stats-wal.js";
// The sprint/run history queue, shared with learn.js. Extracted BECAUSE the
// rollup writer lived here and nowhere else: lesson mode wrote no sprint detail
// at all, and this file dated every rollup at flush time rather than at typing
// time. See session-log.js for both defects.
import {
    sessionLogInit, sessionLogPush, sessionLogFlush,
    // sessionLogPendingSeconds is NOT imported — see the daylog.js import note.
    sessionLogPending, sessionLogAdopt, sessionLogTake, GUEST_QUEUE_UID,
} from "./session-log.js";
// The time readout, shared with learn.js. Extracted BECAUSE this file's timer
// slot held three different quantities depending on settings, and School's held a
// fourth. DOM-free: it returns strings and this file writes them.
import { hudStrings, HUD_VERSION, hudCacheSave, hudCacheLoad,
         celebrationDone, celebrationMark } from "./hud.js";
// ⚠️ v3.41.0 — THE CELEBRATIONS MOVED OUT. They were a hand-maintained twin of
// learn.js's, and the two had already drifted. celebrate.js owns them now; this
// file decides WHETHER to celebrate, that file decides HOW. Do not re-add a
// local launchFireworks() — "make the fireworks bigger" must stay ONE edit.
// showGoalToast is intentionally NOT imported: celebrate.js raises its own
// toast as part of each celebration. It stays exported there for any future
// caller that wants the banner without the animation.
import { launchConfetti, launchFireworks } from "./celebrate.js";
import { showReceipt } from "./receipt.js";
// ⚠️ HANDOFF §0.0 — the student now reads the GRADED document. See daylog.js.
// ⚠️ readDaySessions/projectDayTotal are NOT imported. They exist in daylog.js
// and are used by nothing shipped — v3.34.0 reverted the projection. Leaving the
// import in would make it one keystroke to re-enable a grade computed from
// records known to overlap. See HANDOFF §0.0 before touching this line.
import { readWeek, applyWeekToStats, dayLogPayloadFor, SOURCE_SPLIT_CUTOVER, DAYLOG_VERSION,
         carryOverPlan, carryOverPayloadFor, sourceTotalsOf } from "./daylog.js";
import { qualifyingChars, VARIETY_FLOOR_VERSION } from "./variety-floor.js";
// The version footer's three primary reads (this html file, this js file's own
// VERSION, style.css) plus the lazy full-build panel on hover. See
// updateVersionBanner() below and the header on readOneDeployedVersion() for
// why this doesn't just re-fetch game.js from inside itself.
import { readOneDeployedVersion, readDeployedVersions, renderBuildList,
         countBuildNotes, renderHiddenNotesLine,
         readAppliedCssVersion } from "./versions.js";
// serverTimestamp is imported for ONE purpose: to hand it to session-log.js so
// rollups carry a clock the student cannot set. It is not used anywhere else in
// this file, and ⚠️ it must not be: a serverTimestamp() sentinel inside a
// setDoc(merge:true) on typing_logs would be a second
// dating scheme on the documents Round 12 spent a day reconciling.
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, addDoc, query, orderBy, limit, where, updateDoc, getCountFromServer, serverTimestamp, arrayUnion } from "./read-meter.js";
import { noteDay } from "./logdays.js";
import {
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";

// ⚠️ THIS LINE IS THE VERSION — the comment at the top of the file is decoration.
// versions.js parses THIS, the footer renders THIS, and ROADMAP's verification
// steps tell Jake to read THIS. It sat at "3.38.0" across six releases, through
// the whole of Round 26, and the stale-day fix that shipped in v3.38.1 was
// therefore invisible from the chair. Bump it in the SAME EDIT as the header
// entry above, always. tests/version-stamp-test.mjs now fails the suite if you
// do not.
const VERSION = "3.45.0";

// Hand the shared session queue its Firestore surface. Done at module scope,
// once, because session-log.js imports no SDK of its own on purpose — one page
// controller's Firestore version is the only one that should ever be in play.
//
// v3.23.1 — `serverTimestamp` is new here and is the whole of this version.
// session-log.js v1.1.0 stamps `serverAt` on every rollup if it is given this
// function and omits the field if it is not, so old-page-controller/new-module
// and new-page-controller/old-module both work during an upload window. Neither
// combination throws; the only difference is whether the field appears.
sessionLogInit({ db, collection, addDoc, serverTimestamp });

const DEFAULT_BOOK = "wizard_of_oz";
const IDLE_THRESHOLD = 2000;
const AFK_THRESHOLD = 5000; // 5 Seconds to Auto-Pause
const SPRINT_COOLDOWN_MS = 1500;
const SPAM_THRESHOLD = 3;

// ─── Adventure Mode integration ────────────────────────────────────────────
// View toggle. 'classic' = original DOM-rendered text; 'adventure' = canvas
// renderer. The classic view is wholly unchanged: when in adventure mode
// game.js still drives the text-stream DOM (so all position/state logic
// remains valid) — that DOM is just hidden via CSS.
//
// v3.5.0 — VIEW_MODE is `let`, not `const`. It can now change mid-session
// three ways: the settings dropdown, the first-run splash, and reconciliation
// against the student's Firestore profile when they sit down at a machine
// they've never used. Every read site (triggerHardStop, the settings modal)
// reads the live value, so nothing needs to know a swap happened.
//
// Storage, in priority order:
//   localStorage 'ttb_view'                — pre-auth fast path, paints the
//                                            right view before Firestore answers
//   users/{uid}/profile/info.viewMode      — the durable copy, follows the
//                                            student between machines
// The PRESENCE of a valid 'ttb_view' key is also what "has chosen" means
// locally; absence in both places is what triggers the splash. Students who
// already found the Settings toggle are grandfathered in and never see it.
const VALID_VIEWS = ['classic', 'adventure'];
const _storedView = localStorage.getItem('ttb_view');
let VIEW_MODE = VALID_VIEWS.includes(_storedView) ? _storedView : 'classic';

// v3.5.0 — the splash asks on every NEW BOOK by default, because the answer
// can legitimately differ per book: Adventure suits a romp, Classic suits
// something you're reading for content. `viewRemember` is the student's
// "stop asking, just use my pick" opt-out. Default false, so every student
// sees the picker at least once — Jake's call, and correct: the previews are
// the advertisement.
//
// Per-book suppression is sessionStorage, not Firestore. It answers "have I
// already asked about THIS book in THIS sitting", which is a tab-lifetime
// question, costs nothing, and survives a reload (sessionStorage does) while
// resetting cleanly on a new tab or a new day.
let viewRemember = localStorage.getItem('ttb_viewRemember') === '1';
const SPLASH_BOOK_KEY = 'ttb_splashBook';

// Live renderer handles. `adventureModule` caches the dynamic import so a
// student toggling back and forth doesn't re-fetch a 2,400-line module each
// time; `rendererMounted` is the truth about whether listeners are attached
// (VIEW_MODE alone isn't — the import can fail).
let adventureModule = null;
let rendererMounted = false;
let rendererVersionStr = '—';

// Event bus to the adventure renderer. Each emit is fire-and-forget; if the
// renderer isn't mounted nothing happens. Wrapped in try/catch so a buggy
// listener can NEVER crash the typing engine.
function _ttbEmit(type, detail) {
    try {
        document.dispatchEvent(new CustomEvent('ttb:' + type, { detail: detail || {} }));
    } catch (e) {
        // Old browsers without CustomEvent constructor — silently ignore.
        // Adventure mode is opt-in; classic mode never reaches this code path.
    }
}

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

// ═════════════════════════════════════════════════════════════════════════════
// THE VERSION FOOTER — primary triad always visible, everything else on hover.
// ═════════════════════════════════════════════════════════════════════════════
//
// v3.26.3. The old banner showed exactly four files — game.js, style.css,
// adventure.css, adventure-renderer.js — and NONE of hud.js, session-log.js,
// stats-wal.js or firebase-config.js appeared anywhere on the page. Jake was
// debugging the HUD's 0:00 bug above and had no way to confirm which hud.js
// was actually deployed. index.html already solved this — its "build info"
// button reads every file's version via versions.js's readDeployedVersions()/
// renderBuildList() — so this reuses that mechanism rather than inventing a
// second one. #footer-primary is the three files most likely to explain what a
// student is seeing (this page, its controller, its stylesheet); #footer-full
// is everything else, fetched lazily on first hover so nobody pays for it who
// never opens it, same as index.html's button always has.
//
// ⚠️ THIS DOES NOT RE-FETCH game.js TO READ ITS OWN VERSION. VERSION is
// already a constant in this running file's memory; fetching it back from the
// network to parse out the same string would be a 210KB round trip for a
// number already sitting in scope. Only game.html (markup, no constant of its
// own to import) and style.css (a stylesheet, same reasoning) are read at all,
// and both are small.
let _mountedRendererVersion = null;

// ═══════════════════════════════════════════════════════════════════════════
// ROADMAP item 10 — the active-day counter (v3.44.0)
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ TWIN. The identical function is in learn.js. Jake's rule is "a month of
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

async function updateVersionBanner(advRendererVersion) {
    const primary = document.getElementById('footer-primary');
    if (!primary) return;

    const pageVer = await readOneDeployedVersion('game.html');
    const styleVer = readAppliedCssVersion('::before');
    const pageStr = (pageVer && pageVer.version) ? pageVer.version : '?';

    primary.innerHTML =
        `<span style="opacity:.7">game.html</span> v${pageStr}` +
        ` &nbsp;·&nbsp; <span style="opacity:.7">game.js</span> v${VERSION}` +
        ` &nbsp;·&nbsp; <span style="opacity:.7">style.css</span> v${styleVer || '?'}`;

    // Kept for the hover panel, not the triad — see _renderFullBuildPanel().
    _mountedRendererVersion = advRendererVersion || null;
    const full = document.getElementById('footer-full');
    // ⚠️ v1.13.0 of versions.js owns freshness now; this flag is only the
    // record of WHICH audience the panel was last drawn for. Resetting it forces
    // a redraw on the next hover without forcing a re-fetch.
    if (full) full.dataset.notes = '';
}

// Builds the hover panel's contents from a fresh readDeployedVersions() read.
// Separate from _ensureFullBuildLoaded() so a repeat hover after the triad
// updates (a new chapter, a view-mode switch) can re-render from the SAME
// already-fetched results without a second network round trip.
// v3.43.0 — Is the person at this keyboard staff? Read at RENDER time, never
// cached, because the panel outlives the sign-in: a student hovers it as a
// guest, Jake signs in on the same tab, and the next hover must show more.
// ⚠️ THIS IS A DISPLAY GATE AND NOTHING ELSE. Everything it hides is already
// readable by anyone who opens devtools or the raw .js files, and none of it is
// student data. Do not grow a security expectation on it.
function _buildNotesAllowed() {
    return isStaffUser(currentUser);
}

// ⚠️ v3.43.0 — '—' IS THE NEVER-MOUNTED SENTINEL AND IT WAS BEING TREATED AS A
// VERSION. The old guard excluded 'failed' and nothing else, so in classic view
// — which is the DEFAULT view — `'—' !== '1.5.4'` was true and the panel
// printed a red stale-module-cache alarm on every session since the check
// shipped. Requiring an actual semver is the fix; a sentinel can never satisfy
// it, and neither can a future one somebody adds without reading this.
const _SEMVER_RE = /^\d+\.\d+\.\d+$/;

function _rendererDriftNote(results) {
    if (!_SEMVER_RE.test(String(_mountedRendererVersion || ''))) return null;
    const fetched = results.find(r => r.file === 'adventure-renderer.js');
    if (!fetched || !fetched.version || fetched.version === _mountedRendererVersion) return null;
    return `adventure-renderer.js mounted v${_mountedRendererVersion},` +
           ` deployed file reads v${fetched.version} — stale module cache`;
}

function _renderFullBuildPanel(results) {
    const full = document.getElementById('footer-full');
    if (!full) return;
    const showNotes = _buildNotesAllowed();

    let html = `<div style="opacity:.6;margin-bottom:4px">game.html (this page)</div>`
             + renderBuildList(results, { notes: showNotes });

    // adventure-renderer.js is dynamically imported (§ applyViewMode), so its
    // live, actually-running version can be compared against a fresh fetch of
    // the file on disk — the same drift a stale-CSS check catches elsewhere.
    const drift = _rendererDriftNote(results);
    if (drift && showNotes) {
        html += `<div><span class="build-note" style="color:#c62828">⚠ ${drift}</span></div>`;
    }

    // ⚠️ ONE TOTAL, THIS FILE'S NOTE INCLUDED. A gated panel that showed nothing
    // would read as a clean build, and Jake troubleshoots at student machines
    // signed in as nobody — see versions.js v1.12.0.
    html += renderHiddenNotesLine(showNotes ? 0 : countBuildNotes(results) + (drift ? 1 : 0));

    full.innerHTML = html;
    full.dataset.notes = String(showNotes);
}

// ⚠️⚠️ v3.45.0 — THIS NO LONGER KEEPS ITS OWN "already loaded" FLAG.
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


// Hover opens it for a mouse. Touch has no hover event at all, so a tap
// toggles `.pinned` (same CSS effect) and a tap anywhere else closes it —
// without this a tablet user could never reach the panel. Keyboard focus gets
// the same treatment as hover so the toggle is reachable without a mouse.
function setupVersionFooter() {
    const footer = document.getElementById('version-footer');
    if (!footer) return;
    footer.addEventListener('mouseenter', _ensureFullBuildLoaded);
    footer.addEventListener('focus', _ensureFullBuildLoaded);
    footer.addEventListener('click', (e) => {
        _ensureFullBuildLoaded();
        footer.classList.toggle('pinned');
        e.stopPropagation();
    });
    document.addEventListener('click', () => footer.classList.remove('pinned'));
}
setupVersionFooter();

// Everything the renderer needs to reconstruct the current chapter from
// scratch. Called on every chapter load AND whenever the renderer is mounted
// mid-session — a renderer that missed textLoaded draws nothing at all (that's
// its documented behaviour), so a hot swap has to hand it the world again.
function emitTextLoaded() {
    _ttbEmit('textLoaded', {
        fullText: fullText,
        position: currentCharIndex,
        chapterNum: currentChapterNum,
        chapterTitle: (bookMetadata && bookMetadata.chapters)
            ? (bookMetadata.chapters.find(c => c.id === `chapter_${currentChapterNum}`) || {}).title
            : null,
        bookTitle: bookMetadata && bookMetadata.title,
        // Chapter map data (renderer v0.3.0+). Practice mode sends null so
        // the map hides — an AI drill isn't part of the book's journey.
        // ⚠️ BODY CHAPTERS ONLY (v3.12.2). This sent bookMetadata.chapters — the
        // whole spine — so the Adventure map drew a dot for the title page, the
        // imprint, the dedication, the appendix, the endnotes, the colophon and the
        // uncopyright page alongside the actual chapters. On the two-chapter test
        // fixture that is ten dots for two chapters, with the real ones sitting
        // fourth and fifth: exactly the "funky map on the right" Jake saw. On
        // Standard Ebooks it means every book's journey ends several dots past the
        // end of the story.
        //
        // `num` stays the real chapter id, NOT an ordinal, because the renderer
        // matches completedChapters against it.
        chapters: (!isPracticeMode && bookMetadata && bookMetadata.chapters)
            ? bodyChapterList().map(c => ({
                num: String(c.id).replace('chapter_', ''),
                title: c.title || ''
              }))
            : null,
        completedChapters: Array.from(completedChapters),
    });
}

// ─── View mode: apply, persist, reconcile ──────────────────────────────────

// Switch views in place. Replaces the v3.4.x location.reload().
//
// `replay` re-hands the current chapter to a freshly mounted renderer. It's
// false at boot (loadChapter hasn't run yet and will emit on its own) and true
// for every mid-session swap.
//
// Failure mode is deliberately one-directional: if the renderer module won't
// load, we fall back to classic and DON'T persist adventure. A student on a
// flaky connection should not end up with a stored preference for a view that
// didn't load.
async function applyViewMode(mode, opts) {
    const o = opts || {};
    if (!VALID_VIEWS.includes(mode)) mode = 'classic';

    const wantRenderer = (mode === 'adventure');
    // Nothing to do if we're already in this state. The rendererMounted check
    // matters at boot: VIEW_MODE can read 'adventure' from localStorage before
    // init() has mounted anything.
    if (mode === VIEW_MODE && wantRenderer === rendererMounted) {
        if (o.persist) await saveViewMode(mode, o.remember);
        return true;
    }

    let ok = true;

    if (wantRenderer && !rendererMounted) {
        try {
            if (!adventureModule) adventureModule = await import('./adventure-renderer.js');
            adventureModule.mountAdventureRenderer();
            rendererMounted = true;
            rendererVersionStr = adventureModule.RENDERER_VERSION || '?';
        } catch (e) {
            console.warn('Adventure renderer failed to load; staying in classic view.', e);
            rendererVersionStr = 'failed';
            mode = 'classic';
            ok = false;
        }
    } else if (!wantRenderer && rendererMounted) {
        try { adventureModule.unmountAdventureRenderer(); } catch (e) { console.warn(e); }
        rendererMounted = false;
    }

    VIEW_MODE = mode;
    document.body.classList.toggle('view-adventure', mode === 'adventure');
    document.body.classList.toggle('view-classic',   mode === 'classic');

    if (mode === 'classic') {
        // The renderer's keyboard skin repaints .key inline backgrounds to a
        // vintage palette via MutationObserver. unmount() disconnects the
        // observer but leaves the colours it already applied, so the keyboard
        // would stay parchment-toned in classic view. Repaint it.
        colorKeyboardKeys();
        // The classic text stream was transform-positioned while hidden;
        // re-run the layout so it isn't scrolled to a stale offset.
        highlightCurrentChar();
        centerView();
    } else if (o.replay && fullText) {
        emitTextLoaded();
        _ttbEmit('positionSet', { position: currentCharIndex, isResume: true });
    }

    updateVersionBanner(rendererVersionStr);

    if (ok && o.persist) await saveViewMode(mode, o.remember);
    return ok;
}

// Writes both copies. localStorage first and unconditionally, so the choice
// survives even for signed-out / anonymous students; Firestore only when
// there's a real account to hang it on.
//
// Cost: one write, only when a student actually changes views. Folded into the
// same document as initials so it never adds a read — loadProfileInfo() reads
// profile/info once per session and both consumers share it.
async function saveViewMode(mode, remember) {
    if (remember !== undefined) viewRemember = !!remember;
    try {
        localStorage.setItem('ttb_view', mode);
        localStorage.setItem('ttb_viewRemember', viewRemember ? '1' : '0');
    } catch (e) { /* private browsing */ }
    if (profileInfo) {
        profileInfo.viewMode = mode;
        profileInfo.viewRemember = viewRemember;
    }
    if (!currentUser || currentUser.isAnonymous) return;
    try {
        await setDoc(doc(db, "users", currentUser.uid, "profile", "info"),
                     { viewMode: mode, viewRemember: viewRemember }, { merge: true });
    } catch (e) { console.warn("Save view mode failed:", e); }
}

// Called once, after profile/info is loaded and BEFORE loadUserProgress().
// Placement matters: loadChapter() emits textLoaded, so resolving the view
// first means the correct renderer is already listening and no replay is
// needed at boot.
//
// Firestore is authoritative when it has an answer — this is the "different
// Chromebook" path: local had nothing, or had whatever the last kid in that
// seat picked, and the account knows better.
async function resolveViewMode() {
    if (!profileInfo) return;

    if (typeof profileInfo.viewRemember === 'boolean') {
        viewRemember = profileInfo.viewRemember;
        try { localStorage.setItem('ttb_viewRemember', viewRemember ? '1' : '0'); } catch (e) {}
    }

    const remote = profileInfo.viewMode;
    if (!VALID_VIEWS.includes(remote)) return;

    try { localStorage.setItem('ttb_view', remote); } catch (e) {}
    if (remote !== VIEW_MODE || (remote === 'adventure') !== rendererMounted) {
        // replay:true because loadUserProgress() hasn't run yet at boot, but
        // this same function is safe to call later — an empty fullText makes
        // the replay a no-op.
        await applyViewMode(remote, { replay: true });
    }
}

// ─── The view-choice splash ────────────────────────────────────────────────
//
// Two cards, each showing a live-ish mock of the mode it selects. Both mocks
// are hand-built SVG rather than a scaled-down real render: the adventure
// renderer needs a mounted canvas, a chapter, and a RAF loop to show anything,
// and spinning one up inside a chooser to advertise itself is a lot of moving
// parts for a picture. The palettes are lifted verbatim from the real thing
// (#f2e8d5 parchment, #2b221a ink, #a85040 rubric, --carolina-blue) so the
// mock and the mode agree.
//
// The overlay owns a capture-phase keydown listener instead of touching
// isModalOpen / isInputBlocked. Those flags belong to the modal chain
// underneath — the start modal, or the initials prompt if loadInitials() got
// there first — and the splash's job is to sit on top of whatever that is and
// hand it back untouched.

function classicPreviewSVG() {
    return `
<svg viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg" class="vs-art" role="img" aria-label="Classic view preview">
  <rect width="300" height="170" fill="#ffffff"/>
  <rect width="300" height="20" fill="#000000"/>
  <rect y="20" width="300" height="2.5" fill="#4B9CD3"/>
  <text x="8" y="14" font-family="'Courier Prime',monospace" font-size="7.5" fill="#aaa">Active 04:12</text>
  <text x="150" y="14" font-family="'Courier Prime',monospace" font-size="7.5" fill="#fff" text-anchor="middle">WPM: 24 | Acc: 96%</text>
  <text x="292" y="14" font-family="'Courier Prime',monospace" font-size="7.5" fill="#aaa" text-anchor="end">Week 12:40</text>
  <g font-family="'Courier Prime','Courier New',monospace" font-size="13">
    <text x="20" y="58" fill="#000">Dorothy lived in the</text>
    <text x="20" y="82" fill="#000">midst of the great</text>
    <text x="20" y="106" fill="#000">Kansas</text>
    <rect x="76" y="94" width="9.5" height="16" rx="2" fill="#4B9CD3"/>
    <text x="77" y="106" fill="#fff">p</text>
    <text x="86" y="106" fill="#ccc">rairies, with</text>
    <text x="20" y="130" fill="#ccc">Uncle Henry, who was a</text>
  </g>
  <g class="vs-keys">
    <rect x="20" y="142" width="260" height="20" rx="3" fill="#f4f4f4" stroke="#e0e0e0"/>
    <rect x="26" y="146" width="12" height="12" rx="2" fill="#FF69B4" opacity=".22"/>
    <rect x="41" y="146" width="12" height="12" rx="2" fill="#4FC3F7" opacity=".22"/>
    <rect x="56" y="146" width="12" height="12" rx="2" fill="#66BB6A" opacity=".22"/>
    <rect x="71" y="146" width="12" height="12" rx="2" fill="#FFA726" opacity=".22"/>
    <rect x="86" y="146" width="12" height="12" rx="2" fill="#FFA726" opacity=".22"/>
    <rect class="vs-key-hot" x="188" y="146" width="12" height="12" rx="2" fill="#4B9CD3"/>
    <rect x="203" y="146" width="12" height="12" rx="2" fill="#AB47BC" opacity=".22"/>
    <rect x="218" y="146" width="12" height="12" rx="2" fill="#66BB6A" opacity=".22"/>
    <rect x="233" y="146" width="12" height="12" rx="2" fill="#4FC3F7" opacity=".22"/>
    <rect x="248" y="146" width="12" height="12" rx="2" fill="#FF69B4" opacity=".22"/>
  </g>
</svg>`;
}

function adventurePreviewSVG() {
    // Laid out against a real screenshot of the renderer, not from memory. The
    // corrections that mattered:
    //   - the figure stands ON TOP of the letters, not inside them. Letters are
    //     the walkable surface (renderer v0.2.6), so its feet sit at cap-height
    //     above the text baseline, never overlapping the glyphs.
    //   - LEFT edge is the chapter close-up: wobbly rubric route, pilcrow ticks
    //     at paragraph starts, gold marker at the current position.
    //   - RIGHT edge is the book map. Drawn condensed (renderer v1.1.0) because
    //     that is what a real book of any size now looks like.
    //   - gravestones sit on the ground line at the bottom, not mid-air.
    return `
<svg viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg" class="vs-art" role="img" aria-label="Adventure view preview">
  <rect width="300" height="170" fill="#f2e8d5"/>
  <g fill="rgba(120,100,70,0.05)">
    <rect y="34" width="300" height="1"/><rect y="58" width="300" height="1"/>
    <rect y="82" width="300" height="1"/><rect y="106" width="300" height="1"/>
    <rect y="130" width="300" height="1"/>
  </g>
  <rect width="300" height="18" fill="#000"/>
  <rect y="18" width="300" height="2" fill="#4B9CD3"/>
  <text x="150" y="13" font-family="'Courier Prime',monospace" font-size="7" fill="#fff" text-anchor="middle">WPM: 24 | Acc: 96%</text>

  <!-- left: current-chapter close-up -->
  <g>
    <rect x="0" y="20" width="20" height="150" fill="rgba(120,100,70,0.06)"/>
    <line x1="20" y1="20" x2="20" y2="170" stroke="rgba(120,100,70,0.18)" stroke-width="1"/>
    <text x="3" y="30" font-family="'IM Fell English',Georgia,serif" font-size="7" fill="#a85040" font-style="italic">Ch 2</text>
    <path d="M10 36 Q12 58 9 78 Q11 100 10 124" stroke="#a85040" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M10 124 Q9 142 10 156" stroke="rgba(120,100,70,0.3)" stroke-width="2" fill="none" stroke-linecap="round"/>
    <text x="13" y="40" font-family="'IM Fell English',Georgia,serif" font-size="7" fill="rgba(168,80,64,0.6)">&#182;</text>
    <text x="13" y="96" font-family="'IM Fell English',Georgia,serif" font-size="7" fill="rgba(168,80,64,0.6)">&#182;</text>
    <circle cx="10" cy="124" r="3.6" fill="#e8c86a" stroke="#2b221a" stroke-width="1.2"/>
  </g>

  <!-- words are the ground; baseline y=104, cap height ~15 -->
  <g font-family="'IM Fell English',Georgia,serif" font-size="21" fill="#2b221a">
    <text x="38" y="104">the</text>
    <text x="80" y="104">great</text>
    <text x="150" y="104" opacity=".45">Kansas</text>
    <text x="232" y="104" opacity=".22">prairie</text>
  </g>
  <g stroke="#2b221a" stroke-width="1.3" opacity=".45" stroke-linecap="round">
    <line x1="38" y1="108" x2="70" y2="108"/>
    <line x1="80" y1="108" x2="137" y2="108"/>
    <line x1="150" y1="108" x2="216" y2="108"/>
  </g>
  <line x1="137" y1="108" x2="150" y2="108" stroke="#a85040" stroke-width="1.3" stroke-dasharray="2 2"/>

  <!-- figure stands on the letter tops (y=89), clear of the glyphs -->
  <g class="vs-figure" stroke="#2b221a" stroke-width="2.1" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="100" cy="55" r="4.3" fill="#2b221a" stroke="none"/>
    <line x1="100" y1="59" x2="100" y2="74"/>
    <path d="M100 74 L95 81 L93 89"/>
    <path d="M100 74 L106 81 L108 89"/>
    <path d="M100 63 L93 69 L90 75"/>
    <path d="M100 63 L108 68 L112 73"/>
  </g>

  <!-- a ghost, and a gravestone on the ground line -->
  <g opacity=".3" fill="none" stroke="#7a7266" stroke-width="1.3">
    <path d="M186 46 a9 9 0 0 1 18 0 v15 l-4.5 -4 -4.5 4 -4.5 -4 -4.5 4 z"/>
    <circle cx="192" cy="50" r="0.9" fill="#7a7266"/><circle cx="198" cy="50" r="0.9" fill="#7a7266"/>
  </g>
  <g opacity=".4">
    <line x1="24" y1="150" x2="272" y2="150" stroke="#c9b99a" stroke-width="1"/>
    <path d="M243 150 v-11 a5.5 5.5 0 0 1 11 0 v11 z" fill="#7a7266" stroke="#2b221a" stroke-width="0.9"/>
    <text x="248.5" y="148" font-family="'IM Fell English',Georgia,serif" font-size="7" fill="#2b221a" text-anchor="middle">k</text>
  </g>

  <!-- right: condensed book map -->
  <g class="vs-map">
    <rect x="280" y="20" width="20" height="150" fill="rgba(120,100,70,0.06)"/>
    <line x1="280" y1="20" x2="280" y2="170" stroke="rgba(120,100,70,0.18)" stroke-width="1"/>
    <line x1="290" y1="34" x2="290" y2="150" stroke="rgba(120,100,70,0.3)" stroke-width="2" stroke-linecap="round"/>
    <path d="M290 34 Q292 48 289 62 Q291 72 290 78" stroke="#a85040" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <g stroke="rgba(120,100,70,0.45)" stroke-width="0.8">
      <line x1="287" y1="46" x2="293" y2="46"/><line x1="287" y1="69" x2="293" y2="69"/>
      <line x1="287" y1="92" x2="293" y2="92"/><line x1="287" y1="115" x2="293" y2="115"/>
      <line x1="287" y1="138" x2="293" y2="138"/>
    </g>
    <circle cx="290" cy="34" r="2.6" fill="rgba(168,80,64,0.75)"/>
    <circle cx="290" cy="150" r="2.6" fill="rgba(120,100,70,0.5)"/>
    <circle cx="290" cy="78" r="4" fill="#e8c86a" stroke="#2b221a" stroke-width="1.2"/>
  </g>

  <g class="vs-keys">
    <rect x="24" y="156" width="238" height="12" rx="2" fill="#e6d9bd" stroke="#c9b99a"/>
    <rect x="29" y="158" width="9" height="8" rx="1.5" fill="#8d6b6b" opacity=".3"/>
    <rect x="41" y="158" width="9" height="8" rx="1.5" fill="#6b7d8d" opacity=".3"/>
    <rect x="53" y="158" width="9" height="8" rx="1.5" fill="#6f7d5f" opacity=".3"/>
    <rect class="vs-key-hot" x="170" y="158" width="9" height="8" rx="1.5" fill="#2b221a"/>
    <rect x="182" y="158" width="9" height="8" rx="1.5" fill="#7d6b8d" opacity=".3"/>
    <rect x="194" y="158" width="9" height="8" rx="1.5" fill="#6b7d8d" opacity=".3"/>
  </g>
</svg>`;
}

// Resolves once the student has picked. Never rejects.
function showViewSplash(opts) {
    const o = opts || {};
    return new Promise((resolve) => {
        const existing = document.getElementById('view-splash');
        if (existing) existing.remove();

        let picked = VALID_VIEWS.includes(VIEW_MODE) ? VIEW_MODE : 'classic';

        const el = document.createElement('div');
        el.id = 'view-splash';
        el.innerHTML = `
          <div class="vs-panel" role="dialog" aria-label="Choose how you want to read">
            <div class="vs-head">
              <div class="vs-title">How do you want to read this book?</div>
              <div class="vs-sub">Both modes type the same words and count the same. Pick whichever you like — you can change it any time in Settings.</div>
            </div>
            <div class="vs-cards">
              <button class="vs-card" data-view="classic" type="button">
                <div class="vs-art-wrap">${classicPreviewSVG()}</div>
                <div class="vs-name">Classic</div>
                <div class="vs-desc">The book, plainly. Clean text, colour-coded keyboard, nothing between you and the page.</div>
                <div class="vs-badge">Selected</div>
              </button>
              <button class="vs-card" data-view="adventure" type="button">
                <div class="vs-art-wrap">${adventurePreviewSVG()}</div>
                <div class="vs-name">Adventure</div>
                <div class="vs-desc">Walk the story. Words become ground, mistakes trip you up, and a map tracks how far you've come.</div>
                <div class="vs-badge">Selected</div>
              </button>
            </div>
            <div class="vs-foot">
              <label class="vs-remember">
                <input type="checkbox" id="vs-remember-box" ${viewRemember ? 'checked' : ''}>
                <span>Use this for every book — stop asking me</span>
              </label>
              <button id="vs-go" class="vs-go" type="button">Start Reading &rarr;</button>
            </div>
          </div>`;
        document.body.appendChild(el);

        const cards = el.querySelectorAll('.vs-card');
        const paint = () => cards.forEach(c =>
            c.classList.toggle('is-picked', c.dataset.view === picked));
        cards.forEach(c => {
            c.onclick = () => { picked = c.dataset.view; paint(); };
        });
        paint();

        // Capture phase + stopPropagation: the game's own document keydown
        // listener must not see a single one of these. Left/Right move the
        // selection, Enter commits — a kid who never touches the trackpad can
        // still get through it.
        const onKey = (e) => {
            if (e.key === 'ArrowLeft')  { picked = 'classic';   paint(); }
            else if (e.key === 'ArrowRight') { picked = 'adventure'; paint(); }
            else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commit(); }
            e.stopPropagation();
        };
        document.addEventListener('keydown', onKey, true);

        let done = false;
        async function commit() {
            if (done) return;
            done = true;
            const remember = !!document.getElementById('vs-remember-box').checked;
            document.removeEventListener('keydown', onKey, true);
            el.classList.add('vs-closing');
            try {
                if (o.bookId) sessionStorage.setItem(SPLASH_BOOK_KEY, o.bookId);
            } catch (err) { /* private browsing */ }
            await applyViewMode(picked, { replay: true, persist: true, remember: remember });
            setTimeout(() => { el.remove(); resolve(picked); }, 180);
        }
        el.querySelector('#vs-go').onclick = commit;
    });
}

// Called from loadChapter(). The sessionStorage check makes this fire exactly
// once per book per tab, which is what "ask again when they pick a new book"
// means in practice — a chapter advance or a reload mid-book doesn't re-ask.
function maybeShowViewSplash() {
    if (isPracticeMode) return;              // an AI drill isn't "a book"
    if (viewRemember) return;
    if (document.getElementById('view-splash')) return;
    let seen = null;
    try { seen = sessionStorage.getItem(SPLASH_BOOK_KEY); } catch (e) {}
    if (seen === currentBookId) return;
    showViewSplash({ bookId: currentBookId });
}
// ───────────────────────────────────────────────────────────────────────────

// Hand Guide
let handGuideEnabled = localStorage.getItem('ttb_handGuide') === 'true';
let handGuideRainbow = localStorage.getItem('ttb_handGuideRainbow') !== 'false'; // default true
let handGuideColor = localStorage.getItem('ttb_handGuideColor') || '#4FC3F7';
let fingerMap = {};
const FINGER_COLORS = {
    'left-pinky':   '#FF69B4', // pink
    'left-ring':    '#E53935', // red
    'left-middle':  '#FF9800', // orange
    'left-index':   '#FDD835', // yellow
    'right-index':  '#43A047', // green
    'right-middle': '#1E88E5', // blue
    'right-ring':   '#8E24AA', // purple
    'right-pinky':  '#4FC3F7', // baby blue
    'left-thumb':   '#FDD835', // yellow (same as index)
    'right-thumb':  '#43A047', // green (same as index)
};

function getFingerColor(fingerName) {
    if (handGuideRainbow) return FINGER_COLORS[fingerName] || '#4FC3F7';
    return handGuideColor;
}

// ⚠️ v3.43.0 — THE LIST IS GONE FROM THIS FILE. It is imported from
// firebase-config.js, which every page already loads. It used to be duplicated
// here, in learn.js, in admin.js and in reports.html — four hand-maintained
// copies of two email addresses, and adding a colleague meant remembering all
// four. `ADMIN_EMAILS` is still in scope under the same name so the three call
// sites below read exactly as they did; new code should prefer isStaffUser().

// STATE — URL param takes priority, then localStorage, then default
function getBookIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('book');
}
let currentBookId = getBookIdFromUrl() || localStorage.getItem('currentBookId') || DEFAULT_BOOK;
localStorage.setItem('currentBookId', currentBookId); // sync
let currentUser = null;
let bookData = null;
let bookMetadata = null;
let fullText = "";
let currentCharIndex = 0;
let savedCharIndex = 0;
let currentChapterNum = 1;
let furthestChapter = 1;
let furthestCharIndex = 0;
let autoStartNext = false; // skip start modal when advancing chapters
// Set by loadUserProgress() when the book's contentVersion has moved since this
// bookmark was written. Read by reconcilePosition() on EVERY chapter load for
// the rest of the session — not just the first — so that jumping to the furthest
// point gets the same treatment as resuming. Cleared by the first successful
// flush, which is the write that stamps the new contentVersion.
let reanchorJob = null;
let reanchorNotice = '';   // one line for the start modal, or ''
let ggRealCharIndex = -1;  // real position before Game Genie warps
let ggAllowMistakes = false; // bypass mistake limit (session only, not persisted)
let ggBypassIdle = false; // bypass AFK/idle timer (session only)

// Stats
let sessionLimit = 30;
let sessionValueStr = "30";
const savedSession = localStorage.getItem('ttb_sessionLength');
if (savedSession) { sessionValueStr = savedSession; sessionLimit = (savedSession === 'infinity') ? 'infinity' : parseInt(savedSession); }
// ⚠️ v3.35.0 — `secondsLibrary` IS THIS PAGE'S OWN COUNTER AND `secondsToday`
// IS STILL THE DAY. They tick on the same line and mean different things:
// secondsToday is what the student sees (both modes, the graded day), and
// secondsLibrary is the only number this file is allowed to WRITE. The School
// triple is carried, seeded and never touched here — daylog.js
// applyWeekToStats() seeds both on both pages so the WAL and the guest merge
// have a server figure for every key they fold. §3.1.
let statsData = { secondsToday:0, secondsWeek:0, charsToday:0, charsWeek:0, mistakesToday:0, mistakesWeek:0,
                  secondsLibrary:0, charsLibrary:0, mistakesLibrary:0,
                  secondsSchool:0,  charsSchool:0,  mistakesSchool:0,
                  lastDate:"", weekStart:0 };

// ⚠️ THE BASELINE. WHAT FIRESTORE HAD WHEN WE LAST READ IT. (v3.22.0)
//
// This exists so that "how much of statsData did this browser put there?" has an
// answer. Without it, the guest-merge on sign-in has to guess, and both available
// guesses are wrong:
//
//   sum()  — correct for a true guest (fresh page, counters started at zero, so
//            everything in statsData is new work) and WRONG for an expired
//            session, where statsData was seeded from Firestore at page load and
//            adding the server's copy back counts the same minutes twice. This is
//            what shipped, and it is what doubled a student's week on 2026-08-18.
//   max()  — correct for the expired session and WRONG for a true guest who had
//            typed earlier in the day on another machine: their 20 guest minutes
//            replace the server's 10 instead of adding to them, and 10 minutes of
//            real work vanish.
//
// The baseline makes the question answerable instead of guessable:
//
//     this browser's contribution = statsData - baseline
//     merged                      = server + contribution
//
// which is right in BOTH cases, because in the guest case the baseline is zero
// and the formula degenerates to sum(). Set ONLY where Firestore is actually
// read (loadUserStats), and reset to zero on a genuine sign-out.
let statsBaseline = { secondsToday:0, secondsWeek:0, charsToday:0, charsWeek:0, mistakesToday:0, mistakesWeek:0,
                      secondsLibrary:0, charsLibrary:0, mistakesLibrary:0,
                      secondsSchool:0,  charsSchool:0,  mistakesSchool:0 };

// ⚠️ `lastKnownRepairedAt` and checkForWeekRepair() ARE GONE (v3.31.0). They
// existed to stop a live tab overwriting reports.html's week-counter repair.
// There is no week-counter to repair: the week is the sum of seven typing_logs
// documents, computed on every load and stored nowhere. A derived quantity has
// no stored value to be wrong, so it has no repair path to defend. HANDOFF §0.0.

// ⚠️ TRUE WHEN A REAL USER BECAME NULL WITHOUT ASKING TO. (v3.22.0)
//
// Auth sessions expire at 24 hours, which lands mid-period for somebody most
// days. `currentUser` goes null and every `!currentUser || currentUser.isAnonymous`
// test in this file — there are 29 — starts reading a student who has been typing
// for twenty minutes as a visitor who just arrived. The counters keep climbing
// (the tick doesn't check auth) while logSession, markDirty, walSave and flushAll
// all silently early-return, so the work is neither recorded nor recorded as lost.
//
// A guest and an expired session need OPPOSITE handling and were indistinguishable.
// This flag is the distinction. It is never set by signOut(), which reloads.
let sessionExpired = false;
let lastKnownUid = '';        // survives the null, so we can tell whose session it was

// Goals
let goals = { dailySeconds: 0, weeklySeconds: 0 };
let dailyGoalCelebrated = false;
let weeklyGoalCelebrated = false;

// Game Vars
let mistakes = 0; let sprintMistakes = 0;
let consecutiveMistakes = 0;
let activeSeconds = 0; let sprintSeconds = 0;
// ─── The open-sprint watermark (v3.24.0, DESIGN-TELEMETRY §7 step 1.5) ───────
// How much of the CURRENT sprint has already been written to the session queue.
//
// ⚠️ WHY THIS EXISTS. Until now a session record was only created when a sprint
// ENDED — chapter complete, AFK pause, or the guest nudge. A student who types
// two sentences, switches books, types two more and toggles to School produced
// counter time with NO session record behind it at all. That is invisible today
// and becomes an UNDERCOUNT the moment totals are derived from sessions
// (step 2), on exactly the students who move around most.
//
// So the open sprint is now closed on hide/switch/navigate. Which means one
// stretch of typing can be reported twice — once as a partial, once when it
// finishes — and logSession() must therefore write DELTAS, not totals. These
// three variables are what a delta is measured from.
//
// ⚠️ RESET THEM WHEREVER `sprintSeconds` IS RESET, IN THE SAME PLACE.
// A new sprint carrying a stale watermark logs nothing until it passes the old
// sprint's length. There are four such sites and `open-unit-test.mjs` counts
// them against this file, so adding a fifth without a reset fails the suite.
let sprintLoggedSeconds = 0, sprintLoggedChars = 0, sprintLoggedMistakes = 0;
function resetSprintLogWatermark() {
    sprintLoggedSeconds = 0; sprintLoggedChars = 0; sprintLoggedMistakes = 0;
}
let sprintCharStart = 0; let timerInterval = null;
let isGameActive = false; let isOvertime = false;
let isModalOpen = false; let isInputBlocked = false;
let modalGeneration = 0;
let isHardStop = false;
let backspaceOrigin = -1; // tracks where we were when backspacing started
let bookSwitchPending = false;
let anonTotalSeconds = 0;
let anonLoginInProgress = false; // prevent auth handler from reloading during anon prompt
let modalActionCallback = null;
let chapterCompleteAt = 0;   // when the chapter-complete modal opened (any-key grace period)
let lastInputTime = 0; let timeAccumulator = 0;
let wpmHistory = []; let accuracyHistory = [];
let currentLetterStatus = 'clean';
let mistakesAtCurrent = 0;   // uncorrected mistakes at the current letter (one backspace undoes one)

// Classic-view shade for repeated mistakes at the same letter: the letter's
// background reddens a step per mistake and lightens a step per backspace.
function applyMissShade(el, n) {
    if (!el) return;
    if (n <= 0) { el.style.removeProperty('background-color'); return; }
    const alpha = Math.min(0.10 + 0.16 * (n - 1), 0.70);
    el.style.backgroundColor = `rgba(211, 47, 47, ${alpha.toFixed(2)})`;
}

// Streak tracking
let currentStreak = 0;
let bestStreak = 0;
let streakMilestone = 0; // last celebrated milestone

// Most-missed characters (session-wide)
let missedCharsMap = {};

// Sprint history (session-wide)
let sprintHistory = [];

// Completed chapters
let completedChapters = new Set();

// Anonymous session tracking for retroactive save
let anonCharsTyped = 0;
let anonMistakes = 0;

// ─── The guest login ladder (v3.20.0) ──────────────────────────────────────
//
// ⚠️ THERE USED TO BE TWO OF THESE AND THEY DID NOT KNOW ABOUT EACH OTHER.
//   - checkAnonLoginPrompt(): one-shot, at 2 sprints OR 150s, fired from
//     pauseGameForBreak(). Its sign-in handler retroactively merged the guest's
//     minutes, chars, mistakes and reading position into the new account.
//   - showAnonInfiniteReminder(): two rungs at 150s/300s, persisted daily,
//     fired from the tick — but ONLY when sessionLimit === 'infinity'. Its
//     sign-in handler called location.reload(), which discarded the entire
//     anonymous session.
//
// So the same student could get prompted twice by different code with different
// copy, and — the part that actually cost something — WHICH ONE ANSWERED THE
// CLICK decided whether their work survived. The five-minute rung, the one with
// the most typing behind it, was the one that threw it away.
//
// Generalise: when two subsystems implement the same prompt, the duplication is
// the visible defect and the divergence in what they DO is the expensive one.
// Merging the copy without merging the behaviour would have fixed the symptom.
//
// Rungs are ACTIVE TYPING SECONDS, not wall clock. A guest who opens a book and
// reads for four minutes without typing has produced nothing to save, and
// interrupting them to offer to save it is noise. Two rungs, then silence
// forever — a third prompt is nagging, and a child who has declined twice has
// decided.
let anonNudgeShown   = 0;   // 0 none, 1 first shown, 2 both shown. Persisted daily.
let anonNudgePending = 0;   // a rung crossed mid-sprint, waiting for the boundary
const ANON_NUDGE_1 = 60;    // 1 minute
const ANON_NUDGE_2 = 300;   // 5 minutes

// ⚠️ TAKES THE TOTAL AS AN ARGUMENT ON PURPOSE — do not have it read the
// globals. pauseGameForBreak() folds sprintSeconds into anonTotalSeconds and
// does NOT zero sprintSeconds (startGame() does that, later), so between those
// two points `anonTotalSeconds + sprintSeconds` counts the same sprint twice.
// A ladder that silently fires early is exactly the kind of wrong nobody
// reports. Callers pass the live total; the function does no arithmetic of
// its own.
function anonNudgeDue(totalActiveSeconds) {
    if (currentUser && !currentUser.isAnonymous) return 0;
    // ⚠️ AN EXPIRED SESSION IS NOT A GUEST. (v3.22.0)
    //
    // Without this line a student whose 24-hour token lapsed mid-lesson is
    // offered the guest ladder — "sign in to save your work!" — sixty seconds
    // later, and the sign-in they are being invited to perform is the thing that
    // ran the merge that doubled their week. The ladder is for people who have
    // never signed in. Someone who HAS gets showReauthPrompt() instead, which
    // says what actually happened and does not pretend their work is unsaved.
    if (sessionExpired) return 0;
    if (anonNudgeShown === 0 && totalActiveSeconds >= ANON_NUDGE_1) return 1;
    if (anonNudgeShown === 1 && totalActiveSeconds >= ANON_NUDGE_2) return 2;
    return 0;
}

// Keyed to the date so the ladder resets each morning rather than each tab.
// ⚠️ New localStorage key. The old one held a count under different rung
// meanings, and reading it would have started some students partway up a
// ladder whose rungs had moved.
const ANON_NUDGE_KEY = 'ttb_anonNudge_v2';
function loadAnonNudgeState() {
    const saved = localStorage.getItem(ANON_NUDGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.date === getLocalDateStr()) anonNudgeShown = data.count || 0;
        } catch(e) {}
    }
}
function saveAnonNudgeState() {
    try {
        localStorage.setItem(ANON_NUDGE_KEY, JSON.stringify({
            date: getLocalDateStr(),
            count: anonNudgeShown
        }));
    } catch(e) {}
}

// users/{uid}/profile/info, read exactly once per session. Holds initials,
// leaderboardOptOut and (v3.5.0) viewMode. Three consumers, one read — adding
// a field here is free, adding a document is not.
let profileInfo = null;

// The button label loadChapter() computed for the start modal ("Start Reading"
// / "Resume"). Stashed so the splash can restore the start modal it covered
// without guessing at the label.
let lastStartBtnLabel = "Start Reading";

// Leaderboard
let userInitials = '';
let leaderboardOptOut = false;
// ⚠️ v3.46.0 — PERSISTED, BECAUSE MODULE SCOPE MADE THE TTL A LIE.
//
// These were plain module variables, so LB_CACHE_MS only ever applied WITHIN a
// single page load. Every navigation reset them to empty, and the next sprint
// completion paid the full four-query, 60-read fetch again.
//
// ⚠️ AND `couldPlace()` DOES NOT STOP IT EARLY IN A SMALL SCHOOL. saveLbThresholds()
// records a cutoff of 0 for any board with fewer than ten entries — correctly,
// since there is room and the student really would place — so at the start of a
// year EVERY student passes the gate and EVERY sprint completion fetches. The
// gate is not broken; it is simply true for everyone until the boards fill.
//
// Measured 2026-08-24: 60 reads on a second sprint, on a second page load,
// after the thresholds were already cached. Predicted zero. It was not zero.
//
// Persisting across loads is the fix that does not touch the celebration logic:
// the board is a weekly ranking, half an hour stale is invisible to a student,
// and a fetch that used to happen per page load now happens per LB_CACHE_MS.
const LB_BOARD_KEY = 'ttb_lbBoard_v1';
let leaderboardCache = {}; // { category: [entries], ... }
let leaderboardCacheTime = 0;
(function restoreLbBoard() {
    try {
        const raw = localStorage.getItem(LB_BOARD_KEY);
        if (!raw) return;
        const c = JSON.parse(raw);
        // ⚠️ WEEK-KEYED. `totalSecondsWeek` rows are meaningless once the week
        // rolls, and a board restored across that boundary would show last
        // week's ranking as this week's. A mismatch drops the cache entirely.
        if (!c || c.weekStart !== getWeekStart(new Date())) return;
        if (!c.board || typeof c.board !== 'object') return;
        leaderboardCache = c.board;
        leaderboardCacheTime = c.at || 0;
    } catch (_) { /* a cold board costs one fetch, never correctness */ }
})();
function persistLbBoard() {
    try {
        localStorage.setItem(LB_BOARD_KEY, JSON.stringify({
            weekStart: getWeekStart(new Date()),
            at: leaderboardCacheTime,
            board: leaderboardCache,
        }));
    } catch (_) { /* quota — the in-memory copy still serves this load */ }
}
const LB_CACHE_MS = 1800000;  // 30 minutes. Now genuinely spans page loads
                              // (see LB_BOARD_KEY) — a weekly board does not
                              // change meaningfully inside a class period.

// The student's own leaderboard doc, read once per session instead of once per
// sprint. We are the only writer for our own doc, so an in-memory copy stays
// accurate. Admin resets bust it explicitly.
let lbOwnEntry = null;        // null = not yet read this session

// Write coalescing. totalSecondsWeek grows every sprint, so without this the
// doc would be written 20x per ten-minute block. Accumulate locally, flush on
// a timer / a new personal best / the tab going away.
// Matched to FLUSH_INTERVAL_MS. The board itself is cached for 10 minutes, so
// writing the underlying doc more often than the flush cadence buys nothing.
const LB_WRITE_MIN_GAP_MS = 300000;   // 5 minutes
let lbPendingSeconds = 0;
let lbLastWriteTime = 0;
let lbDirty = false;

// Top-10 cutoff memory, persisted so we can answer "could this student
// plausibly be on the board?" without a network call. Thresholds only ever
// drift upward as records improve, which makes a stale value CONSERVATIVE:
// we may miss a placement celebration, but we never invent one.
const LB_THRESHOLD_KEY = 'ttb_lbThresholds';
let lbThresholds = null;      // { bestWPM: n, bestStreak: n, ... }

function loadLbThresholds() {
    if (lbThresholds) return lbThresholds;
    try {
        const raw = localStorage.getItem(LB_THRESHOLD_KEY);
        lbThresholds = raw ? JSON.parse(raw) : {};
    } catch (_) { lbThresholds = {}; }
    return lbThresholds;
}

function saveLbThresholds(lists) {
    const t = {};
    for (const cat of LB_CATEGORIES) {
        const list = lists[cat.key] || [];
        // A board with room left has an effective cutoff of 0 — anyone qualifies.
        t[cat.key] = list.length >= 10 ? (list[list.length - 1][cat.key] || 0) : 0;
    }
    lbThresholds = t;
    try { localStorage.setItem(LB_THRESHOLD_KEY, JSON.stringify(t)); } catch (_) {}
}

// Practice Mode
const functions = getFunctions();
const generatePractice = httpsCallable(functions, 'generatePractice');
let isPracticeMode = false;
let practiceRealBookData = null;    // saved real book state
let practiceRealChapterNum = null;
let practiceRealCharIndex = null;
let practiceRealFurthestChapter = null;
let practiceRealFurthestCharIndex = null;
let practiceProblemChars = [];      // the chars that triggered this practice
let practicePrompt = '';            // the prompt sent to Gemini
let practiceText = '';              // the generated text
let practiceMissedSnapshot = {};   // snapshot of missedCharsMap at practice start
let practiceTypingAccumulator = 0;  // seconds typed since last practice (or session start)
let hasDonePractice = false;        // whether practice has been used this session
// Server-authoritative daily allowance, learned from the last successful
// generatePractice() call (index.js DAILY_LIMIT = 5). null = not known yet.
// Checked BEFORE offering the button so a student out of sessions doesn't click,
// wait for a round-trip, and get an error for their trouble.
let practiceRemainingToday = null;
const PRACTICE_FIRST_UNLOCK = 150;  // 2.5 min before first practice
const PRACTICE_COOLDOWN = 60;       // 1 min between subsequent practices
// ⚠️ THE VARIETY FLOOR (v3.27.1). Before this, ANY single missed character —
// even one miss, one letter — could unlock the AI-generated paragraph once the
// time gate passed. Jake reported students requesting practice after missing
// only "F" and "J", and the generated paragraph came back weighted so heavily
// toward "F" (the far commoner letter) that it was trivially fast and accurate
// to type — free banked time for barely any real remediation. Mirrors the
// per-character threshold learn.js's buildRemediationLinks() already uses
// (`n >= 3`) for its own "Practice missed keys" button, now applied here too,
// PLUS a minimum on how many DIFFERENT characters must clear that bar — a
// single letter missed 20 times still is not "a few tricky letters," it's one.
const PRACTICE_CHAR_MISS_THRESHOLD = 3;  // a char must be missed this many times to "count"
const PRACTICE_MIN_QUALIFYING_CHARS = 3; // and at least this many different chars must qualify
// Both gates are checked in TWO places, on purpose — getMissedCharsHTML() so
// the button is never even shown before the pattern is real, and
// startPracticeMode() so nothing that calls it directly (a bug, a stray event
// handler, a bypassed UI) can skip the check the button itself enforces.
//
// ⚠️ v3.28.1 — THE FILTER ITSELF MOVED TO variety-floor.js. Same numbers, same
// behavior; this is now a one-line wrapper naming game.js's own threshold
// constants, kept so every existing call site (`.length`, `.slice(0, N)`,
// `.map(([ch]) => ch)`) is untouched. See variety-floor.js for the extraction
// note — learn.js's `_qualifyingRemediationChars()` is its twin.
function _qualifyingPracticeChars() {
    return qualifyingChars(missedCharsMap, PRACTICE_CHAR_MISS_THRESHOLD);
}

// Profanity filter for initials (covers letter substitutions kids try)
const BLOCKED_INITIALS = new Set([
    'ASS','AZZ','A55','BCH','BJ','BJB','BJS','CNT','COC','COK','CUM','CUK',
    'DCK','DIK','DIX','DMN','DNG','DIC','FAG','FAT','FCK','FKU','FUC','FUK','FUQ',
    'GAY','GEI','GEY','GOD','HOR','JEW','JIZ','JZZ','KKK','KIK','KYK',
    'LSD','MFF','NGR','NIG','NGA','NUT','PIS','PMS','POO','PEE','PUS',
    'RAP','SEX','SHT','SLT','STD','SUK','SUC','TIT','THC','TWT','VAG',
    'WTF','WOP','XTC','XXX',
]);

function isInitialsClean(val) {
    const upper = val.toUpperCase();
    if (BLOCKED_INITIALS.has(upper)) return false;
    // Also check with common substitutions reversed (0→O, 1→I, 3→E, 5→S, etc.)
    const normalized = upper
        .replace(/0/g, 'O').replace(/1/g, 'I').replace(/3/g, 'E')
        .replace(/4/g, 'A').replace(/5/g, 'S').replace(/8/g, 'B');
    if (normalized !== upper && BLOCKED_INITIALS.has(normalized)) return false;
    return true;
}

function getDefaultInitials() {
    if (!currentUser || !currentUser.displayName) return '';
    const parts = currentUser.displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return '';
}

// DOM
const textStream = document.getElementById('text-stream');
const keyboardDiv = document.getElementById('virtual-keyboard');
const timerDisplay = document.getElementById('hud-time');
const accDisplay = document.getElementById('acc-display');
const wpmDisplay = document.getElementById('wpm-display');
const streakDisplay = document.getElementById('streak-display');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const trophyBtn = document.getElementById('trophy-btn');
const sprintDisplay = document.getElementById('hud-sprint');
const userInfo = document.getElementById('user-info');
const userNameDisplay = document.getElementById('user-name');

// Security: escape HTML to prevent XSS from Firestore data
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

async function init() {
    console.log("Initializing JS v" + VERSION);
    loadAnonNudgeState();
    // Build a consolidated version banner showing every loaded file. Helps
    // confirm GitHub Pages cache is serving fresh code (not a stale CSS or JS).
    // CSS versions are exposed via the `content` property of body::before /
    // body::after — see style.css and adventure.css for the values.

    // Open work §9 item 5: title was hardcoded to "TypeThatBook v3.0.1.1" in
    // game.html and had been wrong for four releases.
    document.title = "TypeThatBook v" + VERSION;

    // ─── Adventure: apply the locally cached view mode ───
    // This is the pre-auth paint. It uses localStorage only, so it's instant
    // and can be wrong — resolveViewMode() corrects it against the student's
    // profile a moment later, without a reload. `replay` is false: loadChapter
    // hasn't run, so there is no world to hand the renderer yet.
    document.body.classList.add('view-classic');
    await applyViewMode(VIEW_MODE, { replay: false });
    // applyViewMode paints the banner on every path that actually changes
    // something; a boot straight into classic changes nothing, so call it here.
    updateVersionBanner(rendererVersionStr);

    if (!document.getElementById('menu-btn')) {
        const btn = document.createElement('button');
        btn.id = 'menu-btn';
        btn.innerHTML = '&#9881;';
        btn.title = 'Settings';
        btn.onclick = openMenuModal;
        // ⚠️ v3.39.1 — IN THE BAR, NOT FLOATING UNDER IT. This was appended to
        // <body> with `position:absolute; top:20px; right:20px`, which put it
        // 20px down the PAGE — i.e. dangling just under a 60px #hud, in the
        // reading area, unattached to anything. Nobody had noticed because the
        // one-row bar had no obvious right-hand home for it. The two-row bar
        // does. Appended to the right section so it sits with the other
        // controls; style.css v3.7.1 takes it out of absolute positioning.
        const rightSection = document.querySelector('#hud .hud-section.right');
        (rightSection || document.body).appendChild(btn);
    }

    // Game Genie button (admin only, hidden until auth confirms)
    if (!document.getElementById('genie-btn')) {
        const gg = document.createElement('button');
        gg.id = 'genie-btn';
        gg.className = 'hidden';
        gg.innerHTML = '<span class="gg-flame">🔥</span><span class="gg-fire">G</span><span class="gg-fire gg-fire2">G</span><span class="gg-flame">🔥</span>';
        gg.title = 'Game Genie';
        gg.onclick = openGameGenie;
        document.body.appendChild(gg);
    }

    createKeyboard();
    buildFingerMap();
    createHandGuide();
    setupAuthListeners();
    trophyBtn.onclick = () => openLeaderboard();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            // Remembered across the null that a token expiry produces, so the
            // else-branch can tell an expired session from a first visit.
            if (!user.isAnonymous) lastKnownUid = user.uid;
            sessionExpired = false;
            updateAuthUI(true);
            // Show Game Genie for admins
            const ggBtn = document.getElementById('genie-btn');
            if (ggBtn) ggBtn.classList.toggle('hidden', !ADMIN_EMAILS.includes(user.email));
            // Skip full reload if login came from anon prompt (we handle it ourselves)
            if (anonLoginInProgress) return;
            try {
                await loadBookMetadata();
                // Order matters. loadProfileInfo() is the session's single read
                // of profile/info; resolveViewMode() consumes it and settles
                // which renderer is mounted BEFORE loadUserProgress() calls
                // loadChapter(), whose textLoaded emit then lands correctly
                // with no replay needed.
                await loadProfileInfo();
                await resolveViewMode();
                await loadUserProgress();
                // ⚠️ v3.36.0 — BEFORE loadUserStats(), NOT AFTER, AND THIS IS
                // THE FIX FOR THE LOST GUEST MINUTE. loadUserStats() ASSIGNS the
                // server's figures over statsData; anything this browser counted
                // while signed out has to be merged and written first, or the
                // assignment erases it. Mirrors learn.js exactly.
                await retroactiveSaveGuestSession(currentUser);
                await loadUserStats();
                // Self-heal: if today > week, data was corrupted during transition
                await loadGoals();
                // Only fires when loadGoals() found no class, so the extra read never
                // happens for a student already assigned. See the function's comment
                // for what this being absent cost on day one of a rotation.
                if (!ttbClassId) await applyPendingClassAssignment(currentUser);
                // Refresh the top-bar timer now that stats AND goals are
                // loaded — setupGame()/loadChapter() ran before either, so its
                // initial render showed the cache-seeded (or zero) totals with
                // no daily-goal denominator. This call paints the real
                // "Day 4:32 / 8:00" state immediately, before the kid types a
                // single character. ⚠️ RESTORED IN v3.26.3 — this call existed
                // in comment only for at least one prior round; without it,
                // nothing repainted the readout with real numbers until
                // gameTick() started on the first keystroke, which is the
                // "0:00 until I start typing" bug Jake reported. See
                // updateTimerUI()'s header for the other half of the fix.
                // ⚠️ ONE CALL PAINTS BOTH SLOTS (v3.25.0), so the block that used
                // to hand-format the week readout right here is gone. It was a
                // FIFTH copy of the time formatter — found by hud-test.mjs, not by
                // reading — and it existed only because updateTimerUI() did not
                // own the right-hand slot. Never format a clock next to a call
                // that already renders one.
                updateTimerUI();
                await loadInitials();
            } catch(e) { console.error("Init Error:", e); }
            trophyBtn.classList.remove('hidden');
        } else {
            // ⚠️ TWO DIFFERENT EVENTS ARRIVE HERE AND ONLY ONE OF THEM IS A
            // PAGE LOAD. (v3.22.0)
            //
            // `user === null` means either "nobody has signed in" or "the token
            // that was working sixty seconds ago has expired". The second is
            // routine — sessions are capped at 24 hours and that cap lands
            // mid-period for somebody most days — and the old code handled it by
            // wiping the UI and calling loadChapter() on the first body chapter,
            // which yanks a mid-lesson student back to chapter one and discards
            // the session with no message. It then let the guest ladder re-offer
            // sign-in, whose merge doubled the counters. All of it silent.
            //
            // lastKnownUid is what tells them apart, and it is set on the signed-in
            // branch above rather than read from currentUser, which is about to be
            // nulled.
            const wasSignedIn = !!lastKnownUid;
            currentUser = null;
            updateAuthUI(false);
            const ggBtn = document.getElementById('genie-btn');
            if (ggBtn) ggBtn.classList.add('hidden');
            trophyBtn.classList.add('hidden');

            if (wasSignedIn) {
                sessionExpired = true;
                // Everything typed from here until they re-authenticate cannot
                // reach Firestore — logSession(), markDirty(), walSave() and
                // flushAll() all require a user. The counters keep climbing in
                // memory and mergeGuestStats() will reconcile them on re-auth,
                // so the work is not lost; it is just invisible until then.
                // ⚠️ NO loadChapter() CALL. Their position is fine and reloading
                // the book on top of a live drill is the visible half of this bug.
                console.warn('[TTB] Auth session expired mid-session — pausing writes ' +
                             'until re-authentication. Counters continue locally.');
                showReauthPrompt();
            } else {
                // A genuine visitor. Load the book read-only, as before.
                try {
                    await loadBookMetadata();
                    loadChapter(firstBodyChapterId() || 1);
                } catch(e) { console.error("Init Error:", e); }
            }
        }
    });
}

function setupAuthListeners() {
    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ ROADMAP 0d — "I'M DONE" WAS NEVER WIRED IN LIBRARY. v3.42.2.
    // ═══════════════════════════════════════════════════════════════════════
    // Round 26 shipped `handleImDone()` complete and correct, gave the button
    // markup in game.html, gave it a style in style.css v3.7.2 — and never
    // attached the two. Clicking it did **nothing at all**: no handler, no
    // error, no console output, which is precisely what Jake reported after
    // typing Pinocchio on 2026-08-22.
    //
    // ⚠️ THE OTHER HALF OF THE TWIN WAS FINE. `learn.js` wires the identical
    // button correctly in its own auth block. **Round 26 built both halves of a
    // twin and connected one** — the sixth twin failure of the week, and the
    // exact shape §0.-13.E is about.
    //
    // ⚠️ NO EXISTING HARNESS COULD HAVE CAUGHT IT. undefined-calls-test asks
    // whether every reference RESOLVES; `handleImDone` resolves perfectly, it is
    // simply never referenced. A defined-but-unreachable function is invisible
    // to that check by construction. tests/dead-handler-test.mjs now asks the
    // other question. See HANDOFF §0.-18.
    //
    // Guarded, and placed here rather than at the top of the file, because
    // #done-btn lives inside #user-info: it is in the markup at load, but a
    // future change could move it, and a missing button must not throw and take
    // the login/logout wiring below down with it. Same shape as learn.js's.
    const doneBtn = document.getElementById('done-btn');
    if (doneBtn) doneBtn.addEventListener('click', handleImDone);

    loginBtn.addEventListener('click', async () => {
        try { await signInWithPopup(auth, new GoogleAuthProvider()); }
        catch (e) { alert("Login failed: " + e.message); }
    });
    logoutBtn.addEventListener('click', async () => {
        // A deliberate sign-out is the one case where the counters on screen
        // stop belonging to anybody. Reset the baseline so that if the reload
        // below is ever removed, a subsequent sign-in is treated as a fresh
        // guest merge rather than measured against a stranger's numbers.
        try { await flushAll('signout', true); } catch (_) {}
        resetStatsBaseline();
        lastKnownUid = ''; sessionExpired = false;
        try { await signOut(auth); location.reload(); }
        catch (e) { console.error(e); }
    });
}

function updateAuthUI(isLoggedIn) {
    if (isLoggedIn && !currentUser.isAnonymous) {
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userNameDisplay.innerText = currentUser.displayName || "Reader";
    } else {
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
    }
}

async function loadBookMetadata() {
    try {
        const docRef = doc(db, "books", currentBookId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            bookMetadata = docSnap.data();
        } else {
            if(currentBookId !== DEFAULT_BOOK) {
                currentBookId = DEFAULT_BOOK;
                localStorage.setItem('currentBookId', DEFAULT_BOOK);
                await loadBookMetadata();
            }
        }
    } catch (e) { console.warn("Meta Error:", e); }
}

async function loadUserStats() {
    if (!currentUser || currentUser.isAnonymous) return;
    try {
        const today = new Date();
        const dateStr = getLocalDateStr(today);
        const weekStart = getWeekStart(today);
        // ⚠️ v3.31.0 — READ FROM typing_logs, THE DOCUMENT JAKE GRADES FROM.
        //
        // This used to read users/{uid}/stats/time_tracking — a SECOND copy of
        // these numbers, written by this page on its own schedule. That document
        // is gone. See HANDOFF §0.0: the student's screen and the teacher's
        // report now read the same seven documents, which is the only
        // arrangement in which they cannot disagree.
        //
        // The DAY comes from today's document. The WEEK is the SUM of the seven,
        // computed here and stored nowhere — so it can never be double-merged,
        // can never be repaired, and can never drift from the days beneath it.
        // Every week-counter defect this project has had was a stored week
        // counter. There isn't one now.
        const read = await readWeek({ db, doc, getDoc, uid: currentUser.uid, dateStr });

        // ⚠️ A PARTIAL READ MUST NOT PAINT. If any of the seven failed, the
        // totals below are an undercount that looks exactly like a light week —
        // and showing a child a number lower than what they earned is the thing
        // this whole redesign exists to stop. Leave the HUD on its cache, leave
        // statsData alone, and let the next load try again.
        if (!read.ok) {
            console.warn("Day-log read incomplete — leaving counters untouched this load.");
            return;
        }

        applyWeekToStats(statsData, read, dateStr);

        // ⚠️ SAVED ONLY HERE — after the authoritative read, never from the live
        // counter and never from a merge. See the warning in hud.js.
        hudCacheSave({ todaySeconds: statsData.secondsToday,
                       weekSeconds:  statsData.secondsWeek,
                       date: dateStr, weekStart });

        // ⚠️ THE BASELINE IS TAKEN HERE AND NOWHERE ELSE. (v3.22.0)
        //
        // Right here, and only right here, statsData is exactly what the server
        // holds — nothing typed in this tab has been added yet. That is the
        // definition of the baseline, and it is why this line sits ABOVE
        // statsWalRecover() rather than below it: a recovered WAL tail is this
        // browser's own unflushed work, so it belongs on the contribution side
        // of the subtraction, not the server side. Move this below the recovery
        // and a re-auth will silently drop whatever the WAL just replayed.
        captureStatsBaseline();

        // ⚠️ RUNS UNCONDITIONALLY, AND THAT IS THE POINT (v3.21.0). walRecover()
        // below is gated on the bookId and always will be. This is not — the
        // counters belong to the student and the day, not to a book or a page,
        // so a tail left behind by a different book, or by learn.js, lands here.
        // Must run AFTER the read above: it compares against what the server has.
        if (statsWalRecover(currentUser.uid, statsData)) {
            console.log("Recovered unflushed time from another session.");
            statsDocDirty = true;
            // ⚠️ walDirty is deliberately NOT set. An earlier draft set it, on
            // the reflex that a recovery should mark everything dirty. It costs
            // a `users/{uid}/progress/{bookId}` write per recovery for a
            // position that did not change — the recovered value is a CLOCK.
            // flushAll() proceeds regardless because final=true.
            flushAll('stats-wal-recovery', true);
        }
    } catch (e) {}
}

// ⚠️ v3.35.0 — THE PER-SOURCE TRIPLES ARE IN HERE AND MUST STAY IN HERE.
// STAT_KEYS is what captureStatsBaseline() snapshots, and the baseline is what
// mergeGuestStats() subtracts to work out "how much of this number did THIS
// browser put there". A counter that is folded but never baselined has a
// baseline of zero forever, so every merge treats the server's own stored value
// as this browser's contribution and adds it a second time. That is the
// arithmetic that doubled a student's week on 2026-08-18.
const STAT_KEYS = ['secondsToday','charsToday','mistakesToday',
                   'secondsLibrary','charsLibrary','mistakesLibrary',
                   'secondsSchool','charsSchool','mistakesSchool',
                   'secondsWeek','charsWeek','mistakesWeek'];

// Snapshot statsData as "what the server had". See the statsBaseline block.
function captureStatsBaseline() {
    for (const k of STAT_KEYS) statsBaseline[k] = statsData[k] || 0;
}

function resetStatsBaseline() {
    for (const k of STAT_KEYS) statsBaseline[k] = 0;
}

// ═════════════════════════════════════════════════════════════════════════════
// mergeGuestStats(serverData) — THE FUNCTION THAT DOUBLED A STUDENT'S WEEK
// ═════════════════════════════════════════════════════════════════════════════
//
// Called when a student signs in on a page that has already been counting time,
// which happens two ways that look identical from here and are not:
//
//   A. A genuine guest. Page opened signed out, counters started at zero, and
//      everything in statsData is work this browser did and nobody has stored.
//   B. An EXPIRED SESSION. The student was signed in, the 24-hour token lapsed
//      mid-period, and they signed back in. statsData was seeded from Firestore
//      at page load and has been climbing ever since.
//
// v3.21.1 and earlier did `statsData.x = server.x + statsData.x` for both. In
// case B that adds the server's copy to a number that already contains it. On
// 2026-08-18 a student's week went from 20 minutes to 40 after three minutes of
// typing, and the DAY counter was untouched, which is the fingerprint: the day
// branch is guarded on `lastDate === today` and the stats document still said
// yesterday (it is only written on a `final` flush), so only the week branch —
// guarded on weekStart, which matched — actually fired.
//
// ⚠️ DO NOT "FIX" THIS BACK TO max(). It is the obvious repair and it trades one
// silent corruption for another: a real guest who typed 10 minutes earlier in the
// day on another machine loses those 10 minutes, because max(server 10, local 20)
// keeps 20 instead of 30. The baseline subtraction is right in both cases and
// degenerates to the old sum() in case A, where the baseline is zero.
//
// Period guards are kept from the original and matter for the same reason they
// always did: a stored counter from another day or another week must contribute
// nothing. The final clamp is a floor, not a merge — the merged value may never
// come out BELOW what this browser already holds, so a bug in the arithmetic can
// only ever fail toward the student's own observed number.
function mergeGuestStats(serverData, dateStr, weekStart) {
    const d = serverData || {};
    const dayMatches  = d.lastDate === dateStr;
    const weekMatches = (d.weekStart || '') === weekStart;

    // ═════════════════════════════════════════════════════════════════════════
    // ⚠️ v3.38.1 — THE GUARD WAS ON ONE SIDE OF THE SUBTRACTION ONLY.
    // ═════════════════════════════════════════════════════════════════════════
    //
    // `dayMatches` asks whether the SERVER's numbers are about today. Nothing
    // asked whether `statsData` — the `live` term below — is about today, and
    // on the one path that actually calls this function it never could:
    // retroactiveSaveGuestSession() SYNTHESISES `d` with `lastDate: dateStr`,
    // so `dayMatches` is a tautology. learn.js's caller writes the tautology
    // down as a guarantee: "Both period guards match by construction."
    //
    // ⚠️ MEASURED ON REAL DATA, 2026-08-21, two students, both Library. A tab
    // left open overnight still held YESTERDAY's day counters. The token had
    // lapsed, the child signed back in, and `mine = live - base` evaluated to
    // yesterday's ENTIRE day — which was then written to TODAY's document:
    //
    //     student A   today 20m 28s / 2,219 ch  =  6m 50s typed + 13m 38s / 1,458 ch  (08-20's whole day)
    //     student B   today 41m 37s / 9,023 ch  = 19m 14s typed + 22m 18s / 4,950 ch  (08-20's whole day)
    //
    // Exact to the second and to the character for A; 5s / 5ch of open unit for
    // B. And the child reported the fingerprint himself: the HUD "started in
    // the teens" BEFORE he typed anything, because the merge flushes.
    //
    // ⚠️ THE LAST LINE OF THIS FUNCTION IS WHY IT COULD NOT SELF-CORRECT.
    // `statsData.lastDate = dateStr` restamps the stale counters as today's, so
    // the tick's midnight rollover — the one thing that would have zeroed
    // them — finds nothing to roll over and never fires.
    //
    // ⚠️ WHY DISCARDING `live` IS SAFE AND NOT A SECOND DATA-LOSS PATH. The
    // rollover in the tick sets `lastDate` on the FIRST counted second of the
    // day, in both files. So a `lastDate` still reading yesterday PROVES no
    // second has been counted in this tab today: there is no contribution to
    // lose. Anything genuinely typed today has already moved `lastDate`
    // forward, `liveDay` is true, and the arithmetic below is untouched.
    // ⚠️ AND THE WEEK RIDES ON THE DAY, WHICH IS NOT THE OBVIOUS SHAPE. The
    // week's own guard passes for a stale tab — yesterday IS in this week — but
    // `mine` is then yesterday's contribution, and yesterday's contribution was
    // FLUSHED to yesterday's document and is therefore ALREADY inside the
    // server's week sum. Adding it again double-counts. A week boundary is
    // always also a day boundary, so this can never make the week guard
    // stricter than it needs to be; it only refuses a contribution the day has
    // already disowned.
    const liveDay  = !statsData.lastDate  || statsData.lastDate  === dateStr;
    const liveWeek = liveDay && (!statsData.weekStart || statsData.weekStart === weekStart);

    const fold = (key, matches, liveValid) => {
        const live = statsData[key] || 0;
        const server = matches ? (d[key] || 0) : 0;
        // ⚠️ THE FLOOR GOES WITH THE CONTRIBUTION. `Math.max(live, …)` exists to
        // stop a merge falling below what this browser already holds — which is
        // right only while `live` describes the period being merged. Applied to
        // a stale counter it IS the carry-forward: it would re-float yesterday's
        // figure even with `mine` zeroed. Take the server's number outright.
        if (!liveValid) { statsData[key] = server; return; }
        const base = statsBaseline[key] || 0;
        // This browser's own contribution. Clamped at zero: a counter that went
        // DOWN since the baseline means the day or week rolled over underneath
        // us, and a negative contribution would subtract real stored work.
        const mine = Math.max(0, live - base);
        statsData[key] = Math.max(live, server + mine);
    };

    // ⚠️ v3.35.0 — THE PER-SOURCE TRIPLES FOLD ON THE DAY GUARD TOO. They are
    // day-scoped counters like secondsToday and every argument above applies to
    // them unchanged. Omitting them would leave a guest's Library minutes to be
    // written over the account's stored secondsLibrary on the very next flush,
    // because the write is absolute per field.
    for (const k of ['secondsToday','charsToday','mistakesToday',
                     'secondsLibrary','charsLibrary','mistakesLibrary',
                     'secondsSchool','charsSchool','mistakesSchool']) fold(k, dayMatches, liveDay);
    for (const k of ['secondsWeek','charsWeek','mistakesWeek'])    fold(k, weekMatches, liveWeek);

    statsData.lastDate  = dateStr;
    statsData.weekStart = weekStart;
    // The merged value is now the authoritative figure and is about to be
    // written. Anything typed AFTER this point is a new contribution.
    captureStatsBaseline();
}

// ═════════════════════════════════════════════════════════════════════════════
// retroactiveSaveGuestSession() — THE MINUTE A CHILD TYPES BEFORE SIGNING IN
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ v3.36.0 — THIS FILE HAD NO SUCH STEP ON THE AUTH PATH AND learn.js DID,
// AND THAT IS THE WHOLE DEFECT. Jake, 2026-08-20, one student, one machine:
//
//     School   guest 1:04 → sign in → 8:31   (server held 7:27; 7:27+1:04 ✓)
//     Library  guest 1:11 → sign in → 8:31   (the same 8:31 — the minute lost)
//
// learn.js's onAuthStateChanged calls retroactiveSaveAnonSession() BEFORE
// loadUserStats(), so every sign-in path in School merges. This file went
// straight to loadUserStats(), and applyWeekToStats() is — by its own header —
// AN ASSIGNMENT, NOT AN ACCUMULATION. It wrote the server's number over the
// guest's counter and the minute was gone.
//
// ⚠️ THE MERGE DID EXIST HERE, TWICE, INLINE, IN TWO MODAL PATHS. So whether a
// child kept their minutes depended on WHICH OF THREE SIGN-IN BUTTONS they
// pressed: the "Nice work!" prompt merged, the start-modal merged, and the
// header Sign In button — three lines long, the obvious one, on screen at all
// times — did not. Both copies now call this function. ⚠️ DO NOT INLINE A
// FOURTH: that is how the third one came to be missing.
//
// ⚠️ ORDER IS LOAD-BEARING AND MIRRORS learn.js. This runs BEFORE
// loadUserStats(). It merges, then FLUSHES, so the loadUserStats() read that
// follows reads back the merged figure rather than the pre-merge one. Remove
// the await and the assignment wins again.
//
// ⚠️ SAFE TO CALL ON AN ORDINARY SIGN-IN. On a cold page load statsData is all
// zeros and the baseline is zero, so `mine` is zero and mergeGuestStats()
// degenerates to "take the server's numbers". On an expired-session re-auth the
// baseline was captured by loadUserStats(), so `mine` is exactly what was typed
// since. Both cases are the arithmetic mergeGuestStats() was written for.
async function retroactiveSaveGuestSession(user) {
    if (!user || user.isAnonymous) return false;
    try {
        const now = new Date();
        const dateStr = getLocalDateStr(now);
        const weekStart = getWeekStart(now);

        const read = await readWeek({ db, doc, getDoc, uid: user.uid, dateStr });
        // ⚠️ A FAILED READ MERGES AS "SERVER HAS NOTHING", which is the safe
        // direction here and only here: mergeGuestStats()'s floor never lets the
        // result fall below what this browser already holds, so the worst case
        // is that stored time is re-added by the next clean load rather than
        // lost now.
        mergeGuestStats(read.ok ? {
            lastDate: dateStr, weekStart: read.weekStart,
            secondsToday: read.today.seconds, charsToday: read.today.chars,
            mistakesToday: read.today.mistakes,
            secondsLibrary:  read.todaySources.library.seconds,
            charsLibrary:    read.todaySources.library.chars,
            mistakesLibrary: read.todaySources.library.mistakes,
            secondsSchool:   read.todaySources.school.seconds,
            charsSchool:     read.todaySources.school.chars,
            mistakesSchool:  read.todaySources.school.mistakes,
            secondsWeek: read.week.seconds, charsWeek: read.week.chars,
            mistakesWeek: read.week.mistakes,
        } : null, dateStr, weekStart);

        // ⚠️ THE SPRINTS COME ACROSS TOO, AND THAT IS THE "in the record" HALF.
        // The merge above fixes the TOTAL; without this the day would still
        // carry minutes the drill-down cannot account for. Adopted under the
        // real uid, keeping each record's own `at` and therefore its own date.
        const taken = sessionLogTake(GUEST_QUEUE_UID);
        const adopted = sessionLogAdopt(user.uid, taken, dateStr);
        if (adopted) console.log(`Adopted ${adopted} guest sprint record(s) into ${user.uid}.`);

        // ⚠️ v3.37.0 — WORK OUT THE OVERNIGHT RESCUE BEFORE THE FLUSH DRAINS
        // THE QUEUE. `taken` is the only handle on these records that survives
        // sessionLogFlush(); plan from it now, write after.
        const carry = carryOverPlan(taken, dateStr);

        sessionExpired = false;
        statsDocDirty = true;
        // final: true — this writes the daily log AND pushes the adopted
        // sprints, which is what makes the correction visible to the teacher
        // immediately rather than at the end of the period.
        await flushAll('guest-retroactive', true);

        // ⚠️ AFTER THE FLUSH, DELIBERATELY. The flush is what a child is waiting
        // on to see their own number move; this touches days that are already
        // over and nobody is watching. A failure here also must not take the
        // flush down with it, which is why it is its own await and its own try.
        if (carry.length) await carryGuestDaysToTheirOwnDocuments(user, carry);

        return true;
    } catch (e) {
        console.warn('Guest session merge failed:', e);
        return false;
    }
}

function getLocalDateStr(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function getWeekStart(date) {
    // Returns "YYYY-MM-DD" string — consistent with learn.js, immune to DST bugs
    const d = new Date(date);
    const diff = (d.getDay() + 1) % 7;
    d.setDate(d.getDate() - diff);
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}



// Goals, class, and building change roughly never, but this used to cost two
// document reads on every single page load (user doc, then class doc), plus a
// third for the settings fallback. Cached for a day. `classId`/`schoolId` are
// captured here and stamped onto every log so reports can be scoped without
// scanning the collection — see MULTITENANCY.md.
const GOALS_CACHE_KEY = 'ttb_goalsCache_v1';

// ─── Student school picker (v3.8.0) ───────────────────────────────────────
//
// Rules already allow this: `match /users/{uid}` has
// `allow update: if request.auth.uid == uid`, and `schools` is
// `allow read: if signedIn()`. No rules change, and none should be needed —
// if a change looks necessary, the design is wrong.
//
// What a student can actually do by setting this: stamp their OWN future logs
// with a building, which makes them visible to that building's staff. They
// cannot read anything new. The worst case is a student picking a school they
// don't attend, which puts their own name in that school's reports — visible,
// traceable, and fixable by a teacher reassigning them. Weighed against the
// status quo, where an unassigned student is invisible to everyone, that's the
// better failure.
const SCHOOLS_CACHE_KEY = 'ttb_schoolsCache_v1';
const SCHOOLS_CACHE_MS = 24 * 3600 * 1000;
let schoolsList = null;

async function loadSchools() {
    if (schoolsList) return schoolsList;
    try {
        const raw = localStorage.getItem(SCHOOLS_CACHE_KEY);
        if (raw) {
            const c = JSON.parse(raw);
            if (c && Array.isArray(c.schools) && (Date.now() - c.at) < SCHOOLS_CACHE_MS) {
                schoolsList = c.schools;
                return schoolsList;
            }
        }
    } catch (_) {}
    try {
        const snap = await getDocs(collection(db, "schools"));
        schoolsList = [];
        snap.forEach(d => schoolsList.push({ id: d.id, name: (d.data().name || d.id) }));
        schoolsList.sort((x, y) => x.name.localeCompare(y.name));
        try {
            localStorage.setItem(SCHOOLS_CACHE_KEY,
                JSON.stringify({ at: Date.now(), schools: schoolsList }));
        } catch (_) {}
    } catch (e) {
        console.warn('School list unreadable:', e);
        schoolsList = [];
    }
    return schoolsList;
}

async function saveStudentSchool(schoolId) {
    if (!currentUser || currentUser.isAnonymous) return false;
    try {
        await setDoc(doc(db, "users", currentUser.uid), { schoolId: schoolId }, { merge: true });
        ttbSchoolId = schoolId;
        // The goals cache carries schoolId, so a stale copy would keep stamping
        // the old building onto logs until it expired.
        try { localStorage.removeItem(GOALS_CACHE_KEY); } catch (_) {}
        return true;
    } catch (e) {
        console.warn('Save school failed:', e);
        return false;
    }
}
// ─── Apply pending class assignment set by admin before student first typed ──
//
// ⚠️ ADDED v3.14.0. This existed only in learn.js, and game.html is the page a
// student is far more likely to open first — index.html links straight into it.
//
// The consequence, on the first day of a 9-week rotation, for every new student at
// once: Jake imports a roster, and students with no Firebase account yet land in
// pendingClassAssignments/{email} rather than users/{uid} (see _commitCSV in
// lessons-admin.js — it cannot write a user document for a uid that does not exist).
// If that student then types a book chapter before ever opening the Lessons page,
// nothing consumes the pending record. ttbClassId stays '', and every log document
// this session writes is stamped classId: '' — so the student is absent from every
// class-filtered report, and their class's daily/weekly goals never apply. It
// self-heals the first time they happen to open learn.html, which could be days.
//
// Mirrors learn.js's implementation deliberately, including the cost-conscious call
// ordering: loadGoals() runs first, and this only fires when it found no class, so
// the extra read never happens for the ~99% of students already assigned.
async function applyPendingClassAssignment(user) {
    if (!user || user.isAnonymous || !user.email) return;
    try {
        const email    = user.email.toLowerCase();
        const pendRef  = doc(db, 'pendingClassAssignments', email);
        const pendSnap = await getDoc(pendRef);
        if (!pendSnap.exists()) return;

        const pend     = pendSnap.data() || {};
        const classId  = pend.classId;
        const schoolId = pend.schoolId;

        // ⚠️ EVERY EXIT FROM HERE ON DELETES THE RECORD. That is the v3.21.1 fix
        // and it is the important half of it. This function used to have three
        // paths that returned without deleting, so a record that could not act
        // was re-read, re-rejected and re-ignored on every sign-in for the rest
        // of the year — costing a billed read each time and, far worse, leaving
        // a teacher's queued instruction sitting in the database looking live.
        // A pending doc is a message. Reading it consumes it, whatever it said.

        // No class to assign: `_commitCSV` writes `classId: classId || null` for a
        // row with a blank class, which produces a record that can never do
        // anything. Drop it.
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

        // Already where the record wants them. Common on a re-import.
        if (existing === classId) { await deleteDoc(pendRef); return; }

        // ⚠️ THIS GUARD USED TO READ `if (existing) return;` AND IT SILENTLY
        // DISCARDED THE MOST IMPORTANT CASE THE IMPORTER HAS.
        //
        // A returning student has a classId — last year's. The importer cannot
        // see them: it resolves email→uid out of typing_logs scoped to the last
        // ROSTER_DAYS, and a student who last typed in the spring is not in that
        // window, so the import writes a pending record rather than touching
        // their user document. Then this line threw that record away. Ten
        // students, no error at any point, all of them still showing last year's
        // class. The importer said "will apply on first login"; this said no.
        //
        // The teacher's answer now travels WITH the record. `overwrite` is set
        // from the choice made on the preview screen (lessons-admin.js v1.10.0),
        // so this function no longer has to guess which fact is newer — it is
        // told. Absent field means false: records written before v1.10.0 get the
        // old, cautious reading, and are deleted rather than left to rot.
        if (existing && pend.overwrite !== true) {
            console.warn('[TTB] A class assignment was queued for this student, ' +
                'but they are already in a class and the import was set to ' +
                'leave existing placements alone. Discarding it.');
            await deleteDoc(pendRef);
            return;
        }

        // schoolId rides along: report scoping, the security rules and the roster all
        // key off the building, and a student with a class but no building is
        // invisible to their own teacher.
        await setDoc(doc(db, 'users', user.uid),
                     { classId, schoolId: schoolId || '' }, { merge: true });
        await deleteDoc(pendRef);

        // ⚠️ DROP THE GOALS CACHE BEFORE RE-READING. loadGoals() ran moments ago and
        // wrote ttb_goalsCache_v1 with classId: '' and a 24 HOUR lifetime. Without
        // this removal the re-read below hits that entry and hands back the empty
        // classId we just fixed — and because learn.js shares this exact key, the
        // poisoned entry follows the student to the Lessons page too.
        //
        // ⚠️ v3.21.1 — THIS NOW MATTERS FOR A SECOND REASON. On a reassignment the
        // cached entry is not empty, it is LAST YEAR'S CLASS, complete with a
        // className that satisfies every validity check the cache-hit guard makes.
        // A stale-but-well-formed entry is the one a cache guard cannot catch.
        try { localStorage.removeItem(GOALS_CACHE_KEY); } catch (_) {}

        await loadGoals();
        console.log('[TTB] Applied pending class assignment:', classId,
                    existing ? '(moved from ' + existing + ')' : '');
    } catch (e) {
        // Non-critical: never block a student from typing over this.
        console.warn('applyPendingClassAssignment failed:', e);
    }
}

const GOALS_CACHE_MS = 86400000;   // 1 day

async function loadGoals() {
    try {
        // Cache hit?
        try {
            const raw = localStorage.getItem(GOALS_CACHE_KEY);
            if (raw) {
                const c = JSON.parse(raw);
                if (c.uid === (currentUser && currentUser.uid) &&
                    (Date.now() - c.at) < GOALS_CACHE_MS) {
                    goals.dailySeconds = c.dailySeconds || 0;
                    goals.weeklySeconds = c.weeklySeconds || 0;
                    ttbClassId = c.classId || '';
                    ttbSchoolId = c.schoolId || '';
                    applyGoalCelebrationState();
                    return;
                }
            }
        } catch (_) { /* fall through to a real read */ }

        let resolved = false;
        ttbClassId = ''; ttbSchoolId = '';
        if (currentUser && !currentUser.isAnonymous) {
            const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
            if (userSnap.exists()) {
                const ud = userSnap.data();
                ttbClassId = ud.classId || '';
                ttbSchoolId = ud.schoolId || '';
                if (ud.classId) {
                    const classSnap = await getDoc(doc(db, 'classes', ud.classId));
                    if (classSnap.exists()) {
                        const cd = classSnap.data();
                        goals.dailySeconds  = cd.dailySeconds  || 0;
                        goals.weeklySeconds = cd.weeklySeconds || 0;
                        // A class knows its building; the user doc may not yet.
                        if (!ttbSchoolId && cd.schoolId) ttbSchoolId = cd.schoolId;
                        console.log(`Goals from class "${cd.name}": daily=${goals.dailySeconds}s, weekly=${goals.weeklySeconds}s`);
                        resolved = true;
                    }
                }
            }
        }
        if (!resolved) {
            const goalsSnap = await getDoc(doc(db, "settings", "goals"));
            if (goalsSnap.exists()) {
                const data = goalsSnap.data();
                goals.dailySeconds  = data.dailySeconds  || 0;
                goals.weeklySeconds = data.weeklySeconds || 0;
                console.log(`Goals from settings: daily=${goals.dailySeconds}s, weekly=${goals.weeklySeconds}s`);
            }
        }

        try {
            localStorage.setItem(GOALS_CACHE_KEY, JSON.stringify({
                uid: currentUser ? currentUser.uid : '', at: Date.now(),
                dailySeconds: goals.dailySeconds, weeklySeconds: goals.weeklySeconds,
                classId: ttbClassId, schoolId: ttbSchoolId
            }));
        } catch (_) {}

        applyGoalCelebrationState();
    } catch (e) {
        console.error("loadGoals failed:", e);
    }
}

// ⚠️ v3.40.0 — THIS ASKED THE WRONG QUESTION AND IT COST A WEEK OF FIREWORKS.
// It suppressed on "is the total already past the goal", which stays true for
// the whole remainder of the week — so a crossing that failed to fire at the
// moment it happened could never fire again. It now suppresses on whether the
// child was actually SHOWN it, latched per period. hud.js v1.4.0 has the
// argument; tests/celebration-test.mjs has the assertions.
function applyGoalCelebrationState() {
    dailyGoalCelebrated  = celebrationDone('day',  getLocalDateStr(new Date()));
    weeklyGoalCelebrated = celebrationDone('week', String(getWeekStart(new Date())));
}

async function loadUserProgress() {
    textStream.innerHTML = "Loading progress...";
    try {
        if (!currentUser || currentUser.isAnonymous) {
            // No user — start from the beginning, which is the first BODY chapter
            // and is not always called "1".
            const start = firstBodyChapterId() || 1;
            currentChapterNum = start;
            savedCharIndex = 0;

            loadChapter(start);
            return;
        }
        const docRef = doc(db, "users", currentUser.uid, "progress", currentBookId);
        const docSnap = await getDoc(docRef);
        currentChapterNum = firstBodyChapterId() || 1;
        savedCharIndex = 0;
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.chapter !== undefined && data.chapter !== null) currentChapterNum = data.chapter;
            if (data.charIndex !== undefined) savedCharIndex = data.charIndex;
            if (data.completedChapters && Array.isArray(data.completedChapters)) {
                completedChapters = new Set(data.completedChapters.map(String));
            }
            // Load furthest tracking
            if (data.furthestChapter !== undefined) furthestChapter = data.furthestChapter;
            else furthestChapter = currentChapterNum;
            if (data.furthestCharIndex !== undefined) furthestCharIndex = data.furthestCharIndex;
            else furthestCharIndex = savedCharIndex;
        }
        // Replay anything the previous session couldn't get to Firestore before
        // it died. Must run after the Firestore read so it can compare positions.
        currentCharIndex = savedCharIndex;
        walRecover();
        savedCharIndex = currentCharIndex;

        // ─── Has the book moved under this bookmark? (v3.15.0) ───────────────
        //
        // A missing contentVersion on EITHER side counts as "moved". On the
        // progress document it means the bookmark predates this feature; on the
        // book it means an upload path that never stamped one. Both are exactly
        // the case where the offset cannot be trusted, so the safe reading of
        // "I don't know" is "assume it changed" — the ladder degrades
        // gracefully, so a false positive costs at most one re-read.
        if (docSnap.exists()) {
            const data = docSnap.data();
            const bookVer   = (bookMetadata && bookMetadata.contentVersion) || null;
            const storedVer = data.contentVersion || null;
            if (!bookVer || !storedVer || bookVer !== storedVer) {
                let ageMs = Infinity;
                try {
                    const t = data.lastUpdated && data.lastUpdated.toDate
                            ? data.lastUpdated.toDate().getTime()
                            : (data.lastUpdated ? new Date(data.lastUpdated).getTime() : NaN);
                    if (!isNaN(t)) ageMs = Math.max(0, Date.now() - t);
                } catch (_) { ageMs = Infinity; }
                reanchorJob = {
                    anchorText:  data.anchorText || '',
                    storedIndex: savedCharIndex,
                    ageMs
                };
                console.warn('Book content changed since this bookmark was written ' +
                             '(age ' + Math.round(ageMs / 86400000) + 'd, anchor ' +
                             (reanchorJob.anchorText ? 'present' : 'ABSENT') + ').');
            }

            // ⚠️ CHAPTER IDENTITY, NOT CHAPTER EXISTENCE. isKnownBodyChapter()
            // below only asks whether the id resolves. After a renumber that
            // shifted content between ids that ALL still exist — Toby Tyler's
            // 3-22 → 1-20 is the precedent — every id resolves and the student
            // is silently dropped into different content at the same offset.
            // The stored title is the only thing that survives that, and it
            // refuses rather than guesses when the title is ambiguous.
            if (reanchorJob && data.chapterTitle) {
                const nowTitled = chapterTitleFor(currentChapterNum);
                if (nowTitled && nowTitled !== data.chapterTitle) {
                    const remap = chapterIdForTitle(data.chapterTitle);
                    if (remap !== null) {
                        console.warn('Chapter "' + currentChapterNum + '" is now "' +
                                     nowTitled + '"; the bookmark was in "' +
                                     data.chapterTitle + '". Remapped to "' + remap + '".');
                        currentChapterNum = remap;
                    }
                }
            }
        }

        // ⚠️ The stored chapter may no longer exist — see isKnownBodyChapter().
        // Checked AFTER walRecover(), because the WAL can also carry a stale id.
        if (bodyChapterList().length && !isKnownBodyChapter(currentChapterNum)) {
            const fallback = firstBodyChapterId();
            console.warn('Stored chapter "' + currentChapterNum + '" is not in this ' +
                         'book any more (renumbered?). Starting at "' + fallback + '".');
            currentChapterNum = fallback;
            savedCharIndex = 0; currentCharIndex = 0;
            reanchorJob = null;   // nothing left to re-anchor against
        }

        // ⚠️ PHANTOM TICKS. completedChapters was never revalidated, so after a
        // renumber a ✓ could sit on an id that now means a different chapter —
        // and `chaptersCompleted` in the stats rollup takes its size. Filtered
        // against the ids the book actually has now.
        if (bookMetadata && bookMetadata.chapters && completedChapters.size) {
            const live = new Set(bookMetadata.chapters
                .map(c => chapterKey(c.id)));
            const kept = new Set();
            completedChapters.forEach(c => { if (live.has(chapterKey(c))) kept.add(c); });
            if (kept.size !== completedChapters.size) {
                console.warn('Dropped ' + (completedChapters.size - kept.size) +
                             ' completed-chapter tick(s) for chapters this book no ' +
                             'longer has.');
                completedChapters = kept;
            }
        }
        // ⚠️ furthestChapter NEEDS THE SAME CHECK (v3.12.4). v3.12.1 validated the
        // CURRENT chapter and left the furthest one alone, so after a renumber the
        // start screen still offered "Jump to furthest point (Ch. 2)" against a book
        // whose chapters are now 1.01 and 2.01 — and clicking it produced "Chapter 2
        // not found. Returning to the start of the book." Exactly the dead end the
        // v3.12.1 note said it was there to prevent, one variable over.
        //
        // Forgotten rather than clamped: an id that no longer exists is not evidence
        // of how far anyone got, and inventing a nearest match would silently move a
        // student's furthest point.
        if (bodyChapterList().length && !isKnownBodyChapter(furthestChapter)) {
            console.warn('Furthest chapter "' + furthestChapter + '" is not in this ' +
                         'book any more (renumbered?). Forgetting it.');
            furthestChapter = currentChapterNum;
            furthestCharIndex = 0;
        }
        loadChapter(currentChapterNum);
    } catch (e) { loadChapter(firstBodyChapterId() || 1); }
}

// Chapter text is immutable once authored and it's the biggest single read in
// the app. Cached locally so a student returning to the same chapter — which is
// the normal case, every day — reads zero documents and downloads zero bytes.
// Chapter text is immutable once authored and it's the biggest single read in
// the app. Cached locally so a student returning to the same chapter — which is
// the normal case, every day — reads zero documents and downloads zero bytes.
//
// ⚠️ THE INVALIDATION IS REAL NOW. IT WASN'T BEFORE.
//
// The comment that stood here for several versions said "admin.html bumps
// `contentVersion` on a book when a chapter is edited, which invalidates the
// entry." That was false. No version of admin.js up to and including 3.11.0
// ever wrote that field, so the expiry below was the ONLY invalidation this
// cache had — and it was seven days. Fix a typo, and a student holding a cached
// copy read the typo for a week.
//
// admin.js **3.12.0** actually writes it, from all seven paths that change
// chapter text. So seven days is now a genuine ceiling for a book nobody edits,
// not a silent floor on how long a correction takes to land.
//
// ⚠️ IF YOU EVER SEE AN EDIT FAIL TO REACH STUDENTS, check that admin.js is
// 3.12.0 or later before you touch anything here. Rolling admin.js back
// reintroduces the week-long staleness with no other symptom.
const CHAPTER_CACHE_MS = 7 * 86400000;

function chapterCacheKey(bookId, chapterId) { return `ttb_ch_v1:${bookId}:${chapterId}`; }

function readChapterCache(bookId, chapterId) {
    try {
        const raw = localStorage.getItem(chapterCacheKey(bookId, chapterId));
        if (!raw) return null;
        const c = JSON.parse(raw);
        const bookVer = (bookMetadata && bookMetadata.contentVersion) || null;
        if (bookVer !== null && c.ver !== bookVer) return null;
        if ((Date.now() - c.at) > CHAPTER_CACHE_MS) return null;
        return c.data;
    } catch (_) { return null; }
}

function writeChapterCache(bookId, chapterId, data) {
    try {
        localStorage.setItem(chapterCacheKey(bookId, chapterId), JSON.stringify({
            at: Date.now(),
            ver: (bookMetadata && bookMetadata.contentVersion) || null,
            data
        }));
    } catch (e) {
        // Quota exceeded — drop other cached chapters and move on. The cache is
        // an optimisation; never let it break loading a chapter.
        try {
            Object.keys(localStorage)
                .filter(k => k.startsWith('ttb_ch_v1:'))
                .forEach(k => localStorage.removeItem(k));
        } catch (_) {}
    }
}

async function loadChapter(chapterNum) {
    textStream.innerHTML = `Loading Chapter...`;
    const chapterId = "chapter_" + chapterNum;
    try {
        const cached = readChapterCache(currentBookId, chapterId);
        if (cached) {
            bookData = cached;
            currentChapterNum = chapterNum;
            setupGame();
            getHeaderHTML();
            initBookProgressBar();
            return;
        }
        const docRef = doc(db, "books", currentBookId, "chapters", chapterId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            bookData = docSnap.data();
            writeChapterCache(currentBookId, chapterId, bookData);
            currentChapterNum = chapterNum;
            setupGame();
            getHeaderHTML(); // update book info bar
            initBookProgressBar();
        } else {
            // Recovery goes to the first BODY chapter, not to the literal "1" —
            // which on a part-numbered book does not exist, so the old code's
            // recovery path was itself a dead end and reported "Book content not
            // found" for a book whose content was fine.
            const first = firstBodyChapterId();
            if (first !== null && chapterKey(chapterNum) !== chapterKey(first)) {
                alert(`Chapter ${chapterNum} not found. Returning to the start of the book.`);
                currentChapterNum = first;
                savedCharIndex = 0;
                loadChapter(first);
            } else {
                textStream.innerText = "Book content not found.";
            }
        }
    } catch (e) {
        console.error("loadChapter error:", e);
        // Show retry button — don't leave students on a dead screen
        textStream.innerHTML =
            '<div style="text-align:center; padding:40px; font-family:monospace;">' +
            '<div style="font-size:1.1rem; margin-bottom:16px;">Couldn\u2019t load this chapter.</div>' +
            '<div style="font-size:0.85rem; color:#888; margin-bottom:20px;">' + (e.message || 'Network or permission error') + '</div>' +
            '<button onclick="loadChapter(' + chapterNum + ')" ' +
            'style="padding:10px 24px; background:var(--carolina-blue); color:white; border:none; ' +
            'border-radius:4px; cursor:pointer; font-size:1rem; margin-right:10px;">Try Again</button>' +
            // Same fix as everywhere else: the start of the book, not the literal 1.
            '<button onclick="loadChapter(\'' + (firstBodyChapterId() || 1) + '\')" ' +
            'style="padding:10px 24px; background:#555; color:white; border:none; ' +
            'border-radius:4px; cursor:pointer; font-size:1rem;">Go to the start</button>' +
            '</div>';
    }
}

// Typeable character set: printable ASCII (space through tilde), tab, newline
// Anything outside this set gets replaced with a logical equivalent or removed.
const CHAR_REPLACEMENTS = {
    // Quotes & apostrophes
    '\u2018': "'", '\u2019': "'", '\u201A': "'",  // single curly quotes
    '\u201C': '"', '\u201D': '"', '\u201E': '"',  // double curly quotes
    '\u2039': "'", '\u203A': "'",                  // single angle quotes
    '\u00AB': '"', '\u00BB': '"',                  // guillemets
    '\u02BC': "'",                                  // modifier letter apostrophe
    '\u2032': "'", '\u2033': '"',                  // prime, double prime

    // Dashes & hyphens
    '\u2013': '-',  // en dash
    '\u2014': '--', // em dash
    '\u2015': '--', // horizontal bar
    '\u2012': '-',  // figure dash
    '\u2010': '-',  // hyphen
    '\u2011': '-',  // non-breaking hyphen
    '\u00AD': '',   // soft hyphen (invisible, just remove)

    // Dots & ellipsis
    '\u2026': '...', // ellipsis
    '\u2022': '-',   // bullet
    '\u2023': '-',   // triangular bullet
    '\u2027': '-',   // hyphenation point
    '\u00B7': '.',   // middle dot

    // Spaces
    '\u00A0': ' ',   // non-breaking space
    '\u2002': ' ',   // en space
    '\u2003': ' ',   // em space
    '\u2004': ' ',   // three-per-em space
    '\u2005': ' ',   // four-per-em space
    '\u2006': ' ',   // six-per-em space
    '\u2007': ' ',   // figure space
    '\u2008': ' ',   // punctuation space
    '\u2009': ' ',   // thin space
    '\u200A': ' ',   // hair space
    '\u202F': ' ',   // narrow no-break space
    '\u205F': ' ',   // medium mathematical space

    // Invisible / zero-width (just remove)
    '\u200B': '', // zero-width space
    '\u200C': '', // zero-width non-joiner
    '\u200D': '', // zero-width joiner
    '\u200E': '', // left-to-right mark
    '\u200F': '', // right-to-left mark
    '\uFEFF': '', // byte-order mark / zero-width no-break space
    '\u2060': '', // word joiner
    '\u00AD': '', // soft hyphen

    // Ligatures
    '\u00C6': 'AE', '\u00E6': 'ae', // Æ æ
    '\u0152': 'OE', '\u0153': 'oe', // Œ œ
    '\u0132': 'IJ', '\u0133': 'ij', // Ĳ ĳ
    '\uFB00': 'ff', '\uFB01': 'fi', '\uFB02': 'fl', '\uFB03': 'ffi', '\uFB04': 'ffl',
    '\u00DF': 'ss', // ß (eszett)
    '\u00F0': 'd',  // ð (eth)
    '\u00FE': 'th', '\u00DE': 'Th', // þ Þ (thorn)

    // Symbols with logical replacements
    '\u00A9': '(c)',  // ©
    '\u00AE': '(R)',  // ®
    '\u2122': '(TM)', // ™
    '\u00B0': ' degrees', // ° (in prose: "90°" → "90 degrees")
    '\u00D7': 'x',    // × multiplication
    '\u00F7': '/',    // ÷ division
    '\u2212': '-',    // minus sign
    '\u00B1': '+/-',  // ±
    '\u00BC': '1/4',  // ¼
    '\u00BD': '1/2',  // ½
    '\u00BE': '3/4',  // ¾
    '\u2153': '1/3',  // ⅓
    '\u2154': '2/3',  // ⅔

    // Currency
    '\u00A2': 'cents',  // ¢
    '\u00A3': 'GBP ',   // £
    '\u00A5': 'JPY ',   // ¥
    '\u20AC': 'EUR ',   // €

    // Misc punctuation
    '\u2020': '*',  // † dagger
    '\u2021': '**', // ‡ double dagger
    '\u00A7': 'S.',  // § section sign
    '\u00B6': '',    // ¶ pilcrow (remove)
    '\u2016': '||',  // ‖ double vertical line
    '\u2044': '/',   // ⁄ fraction slash
};

function sanitizeText(text) {
    // 1. Apply explicit replacements
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch in CHAR_REPLACEMENTS) {
            result += CHAR_REPLACEMENTS[ch];
        } else {
            result += ch;
        }
    }

    // 2. Normalize accented characters → base letters (é→e, ñ→n, etc.)
    result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 3. Remove anything still outside typeable ASCII + tab + newline
    result = result.replace(/[^ -~\t\n]/g, '');

    // 4. Clean up artifacts: multiple spaces, spaces before punctuation
    result = result.replace(/ {2,}/g, ' ');

    return result;
}

function setupGame() {
    fullText = bookData.segments.map(s => s.text).join("\n");
    fullText = sanitizeText(fullText);

    renderText();
    // ⚠️ v3.15.0. This was `currentCharIndex = savedCharIndex` — a raw assignment
    // of an offset measured against a DIFFERENT copy of this chapter, with no
    // clamp against the text that just loaded. reconcilePosition() clamps always
    // and re-anchors when the book has moved. See its comment block.
    reconcilePosition();
    currentCharIndex = savedCharIndex;
    // Every chapter/book/practice load re-anchors the sprint and clears any
    // stale hard-stop flag. Position warps that skipped startGame() could
    // otherwise leave sprintCharStart pointing into a different text — the
    // root of the impossible leaderboard WPMs.
    sprintCharStart = currentCharIndex;
    isHardStop = false;

    if (currentCharIndex > 0) {
        for (let i = 0; i < currentCharIndex; i++) {
            const el = document.getElementById(`char-${i}`);
            if (el) {
                el.classList.remove('active');
                if (!el.classList.contains('space') && !el.classList.contains('enter') && !el.classList.contains('tab')) {
                    el.classList.add('done-perfect');
                }
            }
        }
    }

    highlightCurrentChar();
    centerView();

    accDisplay.innerText = "---"; wpmDisplay.innerText = "0";
    // Render the timer with its real value rather than a hardcoded "00:00".
    // For a kid in Day-goal mode loading the page, this shows their accumulated
    // daily time immediately instead of leaving them at 00:00 until they start
    // typing. On first call from the auth handler, statsData hasn't loaded yet
    // — updateTimerUI() itself falls back to the last-known cached totals in
    // that window (v3.26.3), and the init handler repaints for real the moment
    // loadUserStats()/loadGoals() land. See updateTimerUI()'s header.
    updateTimerUI();

    // ─── Adventure: notify renderer that a chapter is loaded ───
    emitTextLoaded();

    let btnLabel = "Resume";
    if (savedCharIndex === 0) btnLabel = "Start Reading";
    lastStartBtnLabel = btnLabel;

    if (autoStartNext) {
        autoStartNext = false;
        startGame();
    } else if (!isGameActive) {
        showStartModal(btnLabel);
        // Fire-and-forget. The splash is an overlay above the modal, so it
        // doesn't matter whether the start modal or the initials prompt ends
        // up underneath it — whichever wins is revealed when the splash closes.
        maybeShowViewSplash();
    }
}

function renderText() {
    // Every span is about to be replaced, so the tracked .active element and the
    // cached container height are both stale from this line onward.
    resetActiveLetterTracking();
    textStream.innerHTML = '';
    const container = document.createDocumentFragment();
    let wordBuffer = document.createElement('span');
    wordBuffer.className = 'word';

    for (let i = 0; i < fullText.length; i++) {
        const char = fullText[i];
        if (char === '\n') {
            const span = document.createElement('span');
            span.className = 'letter enter'; span.innerHTML = '&nbsp;'; span.id = `char-${i}`;
            wordBuffer.appendChild(span);
            container.appendChild(wordBuffer);
            container.appendChild(document.createElement('br'));
            wordBuffer = document.createElement('span'); wordBuffer.className = 'word';
        } else if (char === ' ') {
            const span = document.createElement('span');
            span.className = 'letter space'; span.innerText = ' '; span.id = `char-${i}`;
            wordBuffer.appendChild(span);
            container.appendChild(wordBuffer);
            wordBuffer = document.createElement('span'); wordBuffer.className = 'word';
        } else if (char === '\t') {
            if (wordBuffer.hasChildNodes()) { container.appendChild(wordBuffer); wordBuffer = document.createElement('span'); wordBuffer.className = 'word'; }
            const tabSpan = document.createElement('span'); tabSpan.className = 'word';
            const span = document.createElement('span'); span.className = 'letter tab'; span.innerHTML = '&nbsp;'; span.id = `char-${i}`;
            tabSpan.appendChild(span); container.appendChild(tabSpan);
        } else {
            const span = document.createElement('span'); span.className = 'letter'; span.innerText = char; span.id = `char-${i}`;
            wordBuffer.appendChild(span);
        }
    }
    if (wordBuffer.hasChildNodes()) container.appendChild(wordBuffer);
    textStream.appendChild(container);
}

function startGame() {
    const select = document.getElementById('sprint-select');
    if (select) {
        sessionValueStr = select.value;
        sessionLimit = (sessionValueStr === 'infinity') ? 'infinity' : parseInt(sessionValueStr);
        localStorage.setItem('ttb_sessionLength', sessionValueStr);
    }

    sprintSeconds = 0; sprintMistakes = 0; sprintCharStart = currentCharIndex;
    resetSprintLogWatermark();          // new sprint: nothing logged yet
    activeSeconds = 0; timeAccumulator = 0;
    // ⚠️ 0, NOT Date.now() (v3.26.0). A sprint does not start its clock; the
    // first keystroke does. See gameTick(). Both gates there test this for
    // truthiness before subtracting, so a zero means "not started", never 1970.
    lastInputTime = 0;
    consecutiveMistakes = 0; backspaceOrigin = -1; mistakesAtCurrent = 0;
    currentStreak = 0; streakMilestone = 0;
    updateStreak(false); // reset display
    wpmHistory = []; accuracyHistory = [];

    highlightCurrentChar(); centerView(); closeModal();
    isGameActive = true; isOvertime = false; isHardStop = false;
    accDisplay.innerText = "100%"; wpmDisplay.innerText = "0";
    timerDisplay.style.color = 'white'; timerDisplay.style.opacity = '1';

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(gameTick, 100);
}

function gameTick() {
    if (!isGameActive) return;
    const now = Date.now();

    // AUTO PAUSE FOR INACTIVITY - treat as full break (logs time, shows stats, practice option)
    // ⚠️ NO CLOCK UNTIL THE FIRST KEYSTROKE. (v3.26.0, DESIGN-TELEMETRY §7 step 1.75)
    //
    // `lastInputTime` is 0 until the student types. It used to be stamped at
    // startGame(), so the tick below ran from the moment a sprint opened and a
    // child who opened a book and looked at it earned IDLE_THRESHOLD seconds —
    // two of them, every sprint, for typing nothing. Jake's ruling: time typed
    // starts at the first keystroke.
    //
    // ⚠️ THE AFK CHECK SHARES THIS VARIABLE AND MUST BE GUARDED TOO. Without the
    // `lastInputTime &&`, a zero reads as 1970, `now - 0` exceeds AFK_THRESHOLD
    // on the very first tick, and every sprint would auto-pause into the break
    // screen before the student could type a character.
    if (lastInputTime && now - lastInputTime > AFK_THRESHOLD && !isModalOpen && !ggBypassIdle) {
        if (currentCharIndex >= fullText.length) { finishChapter(); return; }
        pauseGameForBreak();
        return;
    }

    // ⚠️ PAINTING IS NOT COUNTING, AND THE PAINT IS NOT GATED. (v3.26.1)
    //
    // v3.26.0 gated the accumulator on `lastInputTime` — correctly — but
    // updateTimerUI() lived INSIDE that gate, two levels down, so nothing drew
    // the readout until the first keystroke plus a full accumulator rollover.
    // Until then the page showed game.html's hardcoded `Daily 0:00` placeholder
    // and an EMPTY `#hud-week`, so a student's real daily and weekly totals read
    // as zero and missing at the exact moment they sat down to look at them.
    // The counters were always right; only the drawing was late.
    //
    // ⚠️ DO NOT MOVE THIS BACK INSIDE A GATE. A gate answers "did time pass?".
    // Drawing answers "what does the student see?", and the answer to the second
    // is never "nothing" just because the answer to the first is no. It is two
    // textContent writes and some string building — cheap enough to do always.
    updateTimerUI();

    if (lastInputTime && now - lastInputTime < IDLE_THRESHOLD) {
        timeAccumulator += 100;
        timerDisplay.style.opacity = '1';
        if (timeAccumulator >= 1000) {
            // ⚠️⚠️ THE MIDNIGHT CHECK RUNS BEFORE THE TWO INCREMENTS BELOW, AND
            // THAT ORDER IS THE FIX. (v3.38.0 — ROADMAP item 6.)
            //
            // THE DEFECT, observed on real data 2026-08-20 (HANDOFF §0.-5.I): a
            // session rollup of 4m 9s at 12:00 AM beside a daily log of 0m 6s
            // for the same date. 249 seconds in the drill-down, 6 in the total.
            //
            // ⚠️ NEITHER NUMBER WAS WRONG. THEY WERE ANSWERING DIFFERENT
            // QUESTIONS. A sprint that runs 11:56 PM → 12:00:09 AM is split
            // correctly by the day counters — 243 seconds into yesterday's
            // document, 6 into today's, second by second as the clock passes.
            // But `sprintSeconds` knew nothing about midnight and kept climbing,
            // so when the sprint finally ended, logSession() filed ONE record of
            // 249 seconds stamped with the day it ENDED on. Today's total: 6s.
            // Today's drill-down: 4m 9s. That is the whole incident.
            //
            // ⚠️ THE ROADMAP NAMED TWO CANDIDATES AND THE SECOND ONE IS INNOCENT.
            // "session-log.js's own dating of a chunk" is not it — that module
            // dates from the caller and always has. The caller was handing it a
            // sprint that had already crossed midnight.
            //
            // The fix closes the open sprint on the OUTGOING day, using the same
            // machinery that already handles a student navigating away
            // mid-sprint. The post-midnight remainder is logged later as a
            // continuation against the watermark, dated correctly, by the
            // ordinary path.
            //
            // ⚠️ IT MUST RUN BEFORE `sprintSeconds++`. One line lower and the
            // second that just elapsed — the first second of the NEW day — gets
            // filed under yesterday. Off by one second, every midnight, forever,
            // and invisible. midnight-test.mjs Part B asserts this ordering.
            //
            // ⚠️ THE 5-SECOND FLOOR STILL APPLIES. A sprint begun at 11:59:58
            // has 2 seconds to close and the floor refuses them; the watermark
            // is deliberately NOT advanced, so they roll into the first record
            // of the new day instead of being lost. Two seconds on the wrong
            // side of midnight is the residue, and it is the right residue.
            const todayStr = getLocalDateStr();
            if (statsData.lastDate && statsData.lastDate !== todayStr) {
                logOpenSprint('midnight', statsData.lastDate);
                console.log(`Day rolled over: ${statsData.lastDate} → ${todayStr}. Resetting daily stats.`);
                statsData.secondsToday = 0;
                statsData.charsToday = 0;
                statsData.mistakesToday = 0;
                // ⚠️ v3.35.0 — THE PER-SOURCE COUNTERS ROLL OVER WITH THE DAY.
                // They are day-scoped, and a counter that survived midnight
                // would be written into tomorrow's document as though it had
                // been typed tomorrow. Both triples reset: the School one is
                // seeded from a document that is also now the wrong day.
                statsData.secondsLibrary = 0;
                statsData.charsLibrary = 0;
                statsData.mistakesLibrary = 0;
                statsData.secondsSchool = 0;
                statsData.charsSchool = 0;
                statsData.mistakesSchool = 0;
                statsData.lastDate = todayStr;
                dailyGoalCelebrated = false; // eligible for today's goal
                // Check week rollover too
                const weekStart = getWeekStart(new Date());
                if (statsData.weekStart !== weekStart) {
                    statsData.secondsWeek = 0;
                    statsData.charsWeek = 0;
                    statsData.mistakesWeek = 0;
                    statsData.weekStart = weekStart;
                    weeklyGoalCelebrated = false;
                }
            }

            activeSeconds++; sprintSeconds++;

            // ⚠️ ONE LINE, THREE COUNTERS, ONE GATE (v3.35.0). `secondsLibrary`
            // advances here and NOWHERE ELSE, exactly like the two beside it.
            // A per-source counter that ticked on its own schedule would be a
            // second clock measuring the same student — DESIGN-TELEMETRY §7
            // step 1.75, and the defect open-unit-test.mjs Part E exists to
            // catch. The day and the source must never be able to disagree
            // about how many seconds just passed.
            statsData.secondsToday++; statsData.secondsWeek++; statsData.secondsLibrary++;
            timeAccumulator -= 1000;
            updateTimerUI();
            noteActiveDay();   // ⚠️ v3.44.0 — ROADMAP 10. Below the increments on purpose; see its own comment.

            // ─── Adventure: heartbeat stats ───
            _ttbEmit('stats', {
                wpm: parseInt(wpmDisplay.innerText) || 0,
                accuracy: parseInt(accDisplay.innerText) || 100,
                activeSeconds: activeSeconds,
                sprintSeconds: sprintSeconds,
                secondsToday: statsData.secondsToday,
                secondsWeek: statsData.secondsWeek,
                streak: currentStreak,
                position: currentCharIndex,
            });

            // Goal celebrations
            // ⚠️ THE `goals.* > 0` GATE IS A RACE AND IT IS ONE WAY A CHILD GOT
            // NOTHING. Goals arrive from an async class read; a child who starts
            // typing before it returns ticks through their crossing with the
            // goal still 0, and the gate drops it. Still correct to gate — a
            // goal of 0 means "no goal" — but the latch makes the miss
            // RECOVERABLE: the next page with goals and an uncelebrated period
            // fires it instead of suppressing it for the rest of the week.
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

            // ─── Guest login ladder ───
            // ⚠️ NO LONGER GATED ON infinity MODE. It was, and that is why the
            // 5-minute rung never fired for the default 30-second sprint — most
            // students were on the one ladder that only ever prompted once.
            //
            // ⚠️ ARMS HERE, FIRES AT A SPRINT BOUNDARY. Yanking a child out of a
            // sprint mid-sentence to ask them to log in interrupts the exact
            // activity the prompt is praising, and it strands a partial sprint
            // that then has to be hand-logged (which is what the old infinity
            // path did, and why it needed its own copy of the sprint-end maths).
            // In infinity mode no boundary is ever coming, so there the tick IS
            // the boundary and it fires immediately.
            if (!currentUser || currentUser.isAnonymous) {
                const due = anonNudgeDue(anonTotalSeconds + sprintSeconds);
                if (due) {
                    if (sessionLimit === 'infinity') {
                        anonNudgePending = 0;
                        interruptForAnonNudge(due);
                        return;
                    }
                    anonNudgePending = due;   // pauseGameForBreak() will show it
                }
            }
        }
    } else {
        timerDisplay.style.opacity = '0.5';
        wpmDisplay.innerText = "0";
        wpmHistory = [];
    }
}

// ⚠️ THE READOUT IS BUILT BY hud.js AND IS IDENTICAL IN learn.js. (v3.25.0)
//
// What this function used to do, and must never do again: pick WHICH quantity to
// show in the left slot based on the session-length setting. A student with a
// 30-second sprint saw sprint seconds; a student with a daily goal saw the day;
// a student with neither saw sprint seconds labelled "Active". One position,
// three meanings, and the meaning changed when a child changed a setting.
//
// Now the left slot always shows Daily, and the sprint is shown ALONGSIDE it when
// there is a limit to show it against. `Sprint 0:27 / 0:30 (Daily 9:22 / 10:00)`.
// The right slot always shows Weekly. Nothing here decides what a word means.
function updateTimerUI() {
    // ⚠️ FALL BACK TO THE LAST KNOWN TOTALS WHILE FIRESTORE IS STILL BEING READ
    // (v3.26.3). SAME FIX AS learn.js's renderTimeHUD() — see the warning above
    // HUD_CACHE_KEY in hud.js. statsData holds its initialised zeros until
    // loadUserStats()'s async read lands, so a page that painted from statsData
    // alone showed `Daily 0:00` to a student with time already banked, for
    // exactly as long as that read took.
    //
    // This used to be a one-shot seed painted once in loadChapter() and then
    // immediately overwritten by the unconditional updateTimerUI() call right
    // after it, because statsData was still zero at that point too — the paint
    // and the stomp were two lines apart in the same function. Folding the
    // fallback in here instead means every caller gets it for free, and it
    // stops being possible to call this function "before" the fallback applies.
    // ⚠️ IT PAINTS ONLY — statsData is NOT seeded from it, or the merge
    // baseline in §3.7 would be computed against a number that never came from
    // the server. That is the doubled week counter, rebuilt.
    let _today = statsData.secondsToday, _week = statsData.secondsWeek;
    if (!_today && !_week) {
        const _seed = hudCacheLoad(getLocalDateStr(new Date()), getWeekStart(new Date()));
        if (_seed) { _today = _seed.todaySeconds; _week = _seed.weekSeconds; }
    }
    const hud = hudStrings({
        sprintSeconds: sprintSeconds,
        sprintLimit:   sessionLimit,
        todaySeconds:  _today,
        dailyGoal:     goals.dailySeconds,
        weekSeconds:   _week,
        weeklyGoal:    goals.weeklySeconds,
    });

    if (timerDisplay) {
        // ⚠️ THE LEAD ROW IS ALWAYS THE DAILY FIGURE. Not the sprint. See the
        // block above hudStrings()'s return and tests/hud-lead-test.mjs.
        timerDisplay.textContent = hud.lead;
        // ⚠️ COLOUR IS THE CALLER'S JOB (hud.js is DOM-free) AND MUST BE RESET.
        // An earlier draft only ever set the overtime colour, so a sprint that
        // went long left the readout orange for the rest of the period.
        // ⚠️ v3.39.0 — OVERTIME NOW COLOURS THE SPRINT, WHICH IS WHAT IT IS
        // ABOUT. It used to tint the Daily readout orange because the two were
        // one string; they are separate elements now and the Daily figure has
        // no business changing colour for a sprint event.
        timerDisplay.style.color = hud.dailyDone ? '#22c55e' : 'white';
        // .hud-time-long and hud.long are GONE (hud.js v1.3.0). The string that
        // needed shrinking does not exist any more. Do not re-add either.
    }
    if (sprintDisplay) {
        sprintDisplay.textContent = hud.sprint;
        sprintDisplay.style.color = hud.overtime ? '#FFA500' : 'white';
    }
    if (hud.overtime) isOvertime = true;

    const hudWeekEl = document.getElementById('hud-week');
    if (hudWeekEl) {
        hudWeekEl.textContent = hud.right;
        hudWeekEl.style.color = hud.weeklyDone ? '#22c55e' : '#888';
    }
    renderHudContext();
}

// The sub row under the Daily figure. CONTEXT, NEVER A NUMBER — the slot exists
// to say what the minutes above it were spent on. learn.html's copy holds the
// lesson name; here it is the book and chapter.
function renderHudContext() {
    const el = document.getElementById('hud-context');
    if (!el) return;
    const book = (bookMetadata && bookMetadata.title) ? String(bookMetadata.title) : '';
    const chap = chapterTitleFor(currentChapterNum);
    // Chapter titles are author-supplied and long ("The Piece of Wood That
    // Laughed and Cried Like a Child"), so the book leads and the CSS
    // ellipsises. Both go in the title attribute so a hover shows the whole
    // thing, same contract #hud-lesson-label has always had.
    const text = book && chap ? (book + ' \u00b7 ' + chap) : (book || chap || '');
    el.textContent = text;
    el.title = text;
}

// ═════════════════════════════════════════════════════════════════════════════
// "I'M DONE" (ROADMAP item 0d)
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ A RECEIPT, NOT A SAVE BUTTON. receipt.js's header has the full argument and
// the rules that go with it; the one that matters at THIS call site is that
// nothing may be gated on this handler. A child who never presses it loses
// nothing, and the code must keep that true.
//
// Both halves already existed and are already called on every other exit path.
// This is a third caller, not new machinery:
//   logOpenSprint() — files the sprint in progress, so the drill-down matches
//                     the day total instead of dropping the tail under the
//                     five-second floor (ROADMAP item 5's yardstick).
//   flushAll(_, true) — ⚠️ THE DELIBERATE EXIT §3.1 SAYS DOES NOT EXIST: "a
//                     `final` flush needs a deliberate exit and a child closing
//                     a Chromebook lid produces none." This manufactures one. It
//                     does NOT fix the unflushed-tail gap; it gives every child
//                     a way not to be in it.
let _doneInFlight = false;
async function handleImDone() {
    // ⚠️ RE-ENTRANCY. Twelve-year-olds double-click. Two overlapping runs would
    // file the open sprint twice — the duplicate-rollup shape in §6 item 8,
    // manufactured on purpose. Same guard flushAll() uses, same reason.
    if (_doneInFlight) return;
    _doneInFlight = true;
    const btn = document.getElementById('done-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    try {
        logOpenSprint('done');
        await flushAll('done', true);
        const dateStr = getLocalDateStr(new Date());
        let week = null, ok = true;
        if (currentUser) {
            try {
                week = await readWeek({ db, doc, getDoc, uid: currentUser.uid, dateStr });
                ok = !!(week && week.ok);
            } catch (_) { ok = false; }
        }
        // ⚠️ A FAILED READ STILL SHOWS THE CARD, MARKED SHORT. The flush already
        // happened; the child's minutes are filed whatever the read did. Showing
        // nothing here would read as "it didn't work", which is the one message
        // this button must never send.
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

function updateRunningWPM() {
    const now = Date.now();
    wpmHistory.push(now);
    if (wpmHistory.length > 20) wpmHistory.shift();
    if (wpmHistory.length > 1) {
        const timeDiffMs = now - wpmHistory[0];
        const timeDiffMin = timeDiffMs / 60000;
        const chars = wpmHistory.length - 1;
        if (timeDiffMin > 0) {
            const wpm = Math.round((chars / 5) / timeDiffMin);
            wpmDisplay.innerText = wpm;
        }
    }
}

function updateRunningAccuracy(isCorrect) {
    accuracyHistory.push(isCorrect ? 1 : 0);
    if (accuracyHistory.length > 50) accuracyHistory.shift();
    const correctCount = accuracyHistory.filter(val => val === 1).length;
    const total = accuracyHistory.length;
    if (total > 0) accDisplay.innerText = Math.round((correctCount / total) * 100) + "%";
}

function updateStreak(correct) {
    if (correct) {
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        // Check milestones: 25, 50, 100, 200, 500
        const milestones = [25, 50, 100, 200, 500];
        for (const m of milestones) {
            if (currentStreak === m && m > streakMilestone) {
                streakMilestone = m;
                streakDisplay.classList.add('streak-pop');
                setTimeout(() => streakDisplay.classList.remove('streak-pop'), 300);
                break;
            }
        }
    } else {
        currentStreak = 0;
    }
    // Update display
    streakDisplay.textContent = `🔥 ${currentStreak}`;
    streakDisplay.className = currentStreak >= 100 ? 'streak-fire' :
                              currentStreak >= 50  ? 'streak-hot' :
                              currentStreak >= 25  ? 'streak-warm' : 'streak-cold';
}

document.addEventListener('keydown', (e) => {
    // Caps Lock detection
    if (e.getModifierState && e.key !== 'CapsLock') {
        const capsOn = e.getModifierState('CapsLock');
        document.getElementById('caps-warning').classList.toggle('hidden', !capsOn);
    } else if (e.key === 'CapsLock') {
        // CapsLock key itself — state flips AFTER the event in some browsers,
        // so we toggle based on current state
        const capsWarning = document.getElementById('caps-warning');
        const wasOn = e.getModifierState('CapsLock');
        // If it was on, pressing CapsLock turns it off, and vice versa
        capsWarning.classList.toggle('hidden', wasOn);
    }

    if (isModalOpen) {
        if (isInputBlocked) return;

        // --- HARD STOP / PAUSE LOGIC ---
        if (isHardStop) {
            let targetChar = fullText[currentCharIndex];
            let isMatch = (e.key === targetChar);
            if (targetChar === '\n' && e.key === 'Enter') isMatch = true;
            if (targetChar === '\t' && e.key === 'Tab') isMatch = true;

            if (isMatch) {
                resumeGame();
                handleTyping(e.key);
            }
            return;
        }

        // --- SMART START LOGIC ---
        // Skip if user is typing in an input/select (e.g. Game Genie fields)
        const activeTag = e.target && e.target.tagName;
        if (activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA') return;

        // ⚠️ TAB MOVED FOCUS TO THE ADDRESS BAR ON THE FIRST KEYSTROKE (v3.14.1).
        //
        // Every paragraph in an imported book starts with a tab, so Tab is very often
        // the FIRST key a student presses — and at that moment the game has not
        // started, so we are inside this pre-start branch, not the main path. The main
        // path cancels the default for Tab (v3.9.3). This branch has two `return`s and
        // neither did, so Safari did what Tab means to a browser: move focus out of the
        // page. The student's next keystrokes went to the address bar.
        //
        // It only ever bit ONCE per chapter, which is exactly why it read as a small
        // frustration rather than a bug: after clicking back into the page the game is
        // running and the main path's cancel takes over.
        //
        // Same guard shape as v3.9.3's: modifiers are excluded so Cmd+T, Ctrl+R and
        // Cmd+Tab still reach the browser and nobody gets trapped in the tab. The
        // INPUT/SELECT/TEXTAREA check above has already let real form fields go.
        if (!e.ctrlKey && !e.metaKey && !e.altKey &&
            (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Backspace' || e.key === ' ')) {
            e.preventDefault();
        }

        let shouldStart = false;
        let shouldSkip = false;

        const targetChar = fullText[currentCharIndex];

        // End-of-chapter modal: ANY of Enter, Space, or a printable key advances
        // to the next chapter. Kids don't always read the "Press Enter" hint —
        // making this lenient avoids the "I'm typing but nothing happens" bug
        // where they sit on the last character thinking the modal is stuck.
        // Tab and modifier keys are excluded so accidental Tab-to-focus or
        // Shift-Caps doesn't fast-forward.
        // 400ms grace period: a fast typist's in-flight keystrokes right after
        // the last character would otherwise blow through the stats modal
        // before they could read it.
        if (currentCharIndex >= fullText.length && modalActionCallback &&
            Date.now() - chapterCompleteAt >= 400) {
            const isContinueKey =
                e.key === 'Enter' ||
                e.key === ' ' ||
                (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey);
            if (isContinueKey) {
                e.preventDefault();
                const cb = modalActionCallback;
                modalActionCallback = null;
                cb();
                return;
            }
        }

        if (e.key === targetChar) shouldStart = true;
        if (targetChar === '\n' && e.key === 'Enter') shouldStart = true;
        if (targetChar === '\t' && e.key === 'Tab') shouldStart = true;

        if (!shouldStart && (targetChar === ' ' || targetChar === '\n')) {
            const nextCharIndex = currentCharIndex + 1;
            if (nextCharIndex < fullText.length) {
                const nextChar = fullText[nextCharIndex];
                if (e.key === nextChar) { shouldStart = true; shouldSkip = true; }
                else if (nextChar === '\t' && e.key === 'Tab') { shouldStart = true; shouldSkip = true; }
            }
        }

        if (shouldStart && modalActionCallback) {
            e.preventDefault();
            modalActionCallback();
            if (shouldSkip) {
                const skippedEl = document.getElementById(`char-${currentCharIndex}`);
                if(skippedEl) skippedEl.classList.add('done-perfect');
                currentCharIndex++;
            }
            handleTyping(e.key);
            return;
        }
        return;
    }

    if (e.key === "Escape" && isGameActive) { pauseGameForBreak(); return; }
    if (e.key === "Shift") toggleKeyboardCase(true);
    if (!isGameActive) return;
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;
    // ⚠️ CANCEL THE DEFAULT FOR EVERY KEY WE CONSUME. (v3.9.3)
    //
    // This listener is on `document`, not on an input, so nothing absorbs the
    // keystroke for us — and only space, Tab and Enter used to be cancelled.
    // Every other printable character was handled here AND handed to the browser.
    //
    // On FIREFOX that is not cosmetic. Firefox still ships Quick Find, the
    // type-ahead-find feature it inherited from Netscape: `/` opens Quick Find and
    // `'` opens Quick Find (links only). Apostrophes are in every contraction and
    // possessive, so a student typing "don't" or "Toby's" popped the find bar
    // several times per paragraph. Chrome never implemented type-ahead find, which
    // is why this was invisible at school and broken at home.
    //
    // e.key.length === 1 catches every printable character while leaving named
    // keys (F5, ArrowLeft, Escape) alone. The modifier guard is load-bearing:
    // without it we would swallow Ctrl+R, Ctrl+T and Cmd+Tab and trap the kid in
    // the tab. Backspace is included because handleTyping() consumes it and
    // Firefox historically navigated BACK on it outside a text field — that pref
    // ships off now, but a school image can flip it and cancelling costs nothing.
    if (!e.ctrlKey && !e.metaKey && !e.altKey &&
        (e.key.length === 1 || e.key === "Tab" || e.key === "Enter" ||
         e.key === "Backspace")) {
        e.preventDefault();
    }
    handleTyping(e.key);
});

function handleTyping(key) {
    lastInputTime = Date.now();
    timerDisplay.style.opacity = '1';

    let inputChar = key;
    if (key === "Tab") inputChar = "\t";
    if (key === "Enter") inputChar = "\n";

    const targetChar = fullText[currentCharIndex];
    const currentEl = document.getElementById(`char-${currentCharIndex}`);

    if (key === "Backspace") {
        if (mistakesAtCurrent > 0) {
            // Undo ONE mistake at the current letter. The cursor stays put
            // until every mistake here has been backspaced away — like
            // deleting real mistyped characters one by one.
            mistakesAtCurrent--;
            currentLetterStatus = 'fixed';
            if (backspaceOrigin < 0) backspaceOrigin = currentCharIndex;
            applyMissShade(currentEl, mistakesAtCurrent);
            if (mistakesAtCurrent === 0 && currentEl) currentEl.classList.remove('error-state');
            _ttbEmit('backspaceUndo', { position: currentCharIndex, remaining: mistakesAtCurrent });
        } else if (currentCharIndex > sprintCharStart) {
            // Additional backspaces: move back to previous char
            if (backspaceOrigin < 0) backspaceOrigin = currentCharIndex;
            currentCharIndex--;
            currentLetterStatus = 'fixed';
            const prevEl = document.getElementById(`char-${currentCharIndex}`);
            if (prevEl) {
                prevEl.classList.remove('done-perfect', 'done-fixed', 'done-dirty');
                prevEl.classList.add('active');
            }
            // Un-highlight the char we just left
            if (currentEl) currentEl.classList.remove('active');
            highlightCurrentChar(); centerView();
            _ttbEmit('positionSet', { position: currentCharIndex });
        }
        return;
    }

    if (inputChar === targetChar) {
        statsData.charsToday++; statsData.charsWeek++; statsData.charsLibrary++;
        anonCharsTyped++;
        consecutiveMistakes = 0;

        currentEl.classList.remove('active'); currentEl.classList.remove('error-state');
        currentEl.style.removeProperty('background-color');
        mistakesAtCurrent = 0;
        if (currentLetterStatus === 'clean') currentEl.classList.add('done-perfect');
        else if (currentLetterStatus === 'fixed') currentEl.classList.add('done-fixed');
        else currentEl.classList.add('done-dirty');

        currentCharIndex++;
        // Keep 'fixed' status until we pass the backspace origin point
        if (backspaceOrigin >= 0 && currentCharIndex <= backspaceOrigin) {
            currentLetterStatus = 'fixed';
        } else {
            backspaceOrigin = -1;
            currentLetterStatus = 'clean';
        }

        _ttbEmit('keystroke', {
            correct: true,
            char: inputChar,
            position: currentCharIndex,
            // status was just decided above for the just-completed char at
            // currentCharIndex - 1. Tell the renderer so it can paint that
            // letter in the appropriate color.
            statusAtCompleted: (currentEl && currentEl.classList.contains('done-perfect')) ? 'perfect' :
                                (currentEl && currentEl.classList.contains('done-fixed'))   ? 'fixed' :
                                                                                             'dirty',
            completedPos: currentCharIndex - 1,
        });

        // Was saveProgress() — three Firestore writes per sentence. Now records
        // to the local write-ahead log and lets the flush timer batch it.
        if (['.', '!', '?', '\n'].includes(targetChar)) markDirty();
        else if (['"', "'"].includes(targetChar) && currentCharIndex >= 2) {
            const prevChar = fullText[currentCharIndex - 2];
            if (['.', '!', '?'].includes(prevChar)) markDirty();
        }

        updateRunningWPM(); updateRunningAccuracy(true); updateStreak(true);

        if (currentCharIndex >= fullText.length) { finishChapter(); return; }

        if (isOvertime) {
            // Don't stop near end of chapter — let them finish it
            const remaining = fullText.length - currentCharIndex;
            if (remaining > 200 && ['.', '!', '?', '\n'].includes(targetChar)) {
                const nextChar = fullText[currentCharIndex];
                if (nextChar !== '"' && nextChar !== "'") { triggerStop(); return; }
            }
        }

        flashFingerPressed();
        highlightCurrentChar(); centerView();
    } else {
        mistakes++; sprintMistakes++;
        consecutiveMistakes++;
        anonMistakes++;

        statsData.mistakesToday++; statsData.mistakesWeek++; statsData.mistakesLibrary++;
        if (currentLetterStatus === 'clean') currentLetterStatus = 'error';
        mistakesAtCurrent++;
        const errEl = document.getElementById(`char-${currentCharIndex}`);
        if(errEl) { errEl.classList.add('error-state'); applyMissShade(errEl, mistakesAtCurrent); }
        flashKey(key); updateRunningAccuracy(false); updateStreak(false);

        // Track missed characters
        const missKey = targetChar === ' ' ? 'Space' : targetChar === '\n' ? 'Enter' : targetChar;
        if (missKey) missedCharsMap[missKey] = (missedCharsMap[missKey] || 0) + 1;

        _ttbEmit('keystroke', {
            correct: false,
            char: inputChar,
            expected: targetChar,
            position: currentCharIndex,
        });

        if (consecutiveMistakes >= SPAM_THRESHOLD && !ggAllowMistakes) {
            triggerHardStop(targetChar, false);
        }
    }
}

function triggerStop() {
    updateImageDisplay(); highlightCurrentChar(); centerView(); pauseGameForBreak();
}

function triggerHardStop(targetChar, isAfk) {
    isGameActive = false;
    clearInterval(timerInterval);
    isHardStop = true;
    resetModalFooter();

    // Roll back to the start of the current sentence — but ONLY in adventure
    // mode. Adventure has a visible figure that needs somewhere to respawn,
    // and the rollback feels narratively right (death → restart sentence). In
    // classic mode there's no figure, so the rollback would feel unfair —
    // keep the original behavior (modal waits for the failed-letter to
    // resume, no rollback).
    const failPos = currentCharIndex;
    let sentenceStart = failPos;

    if (VIEW_MODE === 'adventure') {
        sentenceStart = findSentenceStartFor(failPos);

        // Walk the per-letter DOM nodes and reset them to clean (re-typable)
        // state. game.js uses id="char-N" with classes done-perfect/done-fixed/
        // done-dirty/error-state/active.
        for (let i = sentenceStart; i <= failPos; i++) {
            const el = document.getElementById(`char-${i}`);
            if (!el) continue;
            el.classList.remove('done-perfect', 'done-fixed', 'done-dirty', 'error-state', 'active');
            el.style.removeProperty('background-color');
        }
        mistakesAtCurrent = 0;
        currentCharIndex = sentenceStart;
        highlightCurrentChar();
        centerView();
    }

    _ttbEmit('fail', {
        reason: isAfk ? 'afk' : 'spam',
        position: failPos,                  // where they died
        sentenceStart: sentenceStart,       // where they'll respawn (== failPos in classic)
        expected: targetChar,                // the letter that killed them
    });

    // Modal display: in adventure the resume gate now wants the sentence-start
    // letter (since we rolled back). In classic, we never rolled back, so the
    // failed letter is still what they need to type.
    if (VIEW_MODE === 'adventure') {
        targetChar = fullText[sentenceStart] || '?';
    }

    if (!targetChar) targetChar = '?';
    let friendlyKey = targetChar;
    if (targetChar === ' ') friendlyKey = 'Space';
    if (targetChar === '\n') friendlyKey = 'Enter';
    if (targetChar === '\t') friendlyKey = 'Tab';

    let hintHtml = "";
    if (friendlyKey.length === 1 && friendlyKey.match(/[A-Z]/)) {
        hintHtml = `<div class="modal-hint-text">(Requires Shift)</div>`;
    }

    setModalTitle(isAfk ? "Session Paused (Inactive)" : "Pausing for Accuracy");

    let msg = isAfk ? "You've been away for a while." : "Too many errors!";

    let statsHtml = '';
    if (isAfk) {
        const todayWPM = calculateAverageWPM(statsData.charsToday, statsData.secondsToday);
        const todayAcc = calculateAverageAcc(statsData.charsToday, statsData.mistakesToday);
        const weekWPM = calculateAverageWPM(statsData.charsWeek, statsData.secondsWeek);
        const weekAcc = calculateAverageAcc(statsData.charsWeek, statsData.mistakesWeek);
        if (statsData.secondsToday > 0 || statsData.secondsWeek > 0) {
            statsHtml = `
                <div class="cumulative-row" style="margin-top:10px;">
                    <span>Today: ${formatTime(statsData.secondsToday)} (${todayWPM} WPM | ${todayAcc}%)</span>
                    <span>Week: ${formatTime(statsData.secondsWeek)} (${weekWPM} WPM | ${weekAcc}%)</span>
                </div>
                ${getGoalProgressHTML()}
            `;
        }
    }

    document.getElementById('modal-body').innerHTML = `
        <div style="font-size: 1.1em;">
            ${msg}<br>
            Please type <b style="color: #D32F2F; font-size: 1.5em; border: 1px solid #ccc; padding: 2px 8px; border-radius: 4px;">${escapeHtml(friendlyKey)}</b> to resume.
            ${hintHtml}
        </div>
        ${statsHtml}
    `;
    const btn = document.getElementById('action-btn');
    btn.style.display = 'none';
    showModalPanel();
    isModalOpen = true;
    isInputBlocked = false;
}

function resumeGame() {
    isModalOpen = false;
    isHardStop = false;
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('virtual-keyboard').classList.remove('hidden');
    isGameActive = true;
    timerInterval = setInterval(gameTick, 100);
    consecutiveMistakes = 0;
    mistakesAtCurrent = 0;
    lastInputTime = Date.now();

    _ttbEmit('respawn', { position: currentCharIndex });

    const keyboard = document.getElementById('virtual-keyboard');
    if(keyboard) keyboard.focus();
}

document.addEventListener('keyup', (e) => { if (e.key === "Shift") toggleKeyboardCase(false); });

// --- VIEW LOGIC ---

// ─── Chapter picker ───────────────────────────────────────────────────────────

// Below this many chapters a plain dropdown is faster than typing. Above it,
// scrolling 286 options to find one fable is not navigation.
const CHAPTER_FILTER_MIN = 25;

// ONE builder for every chapter dropdown. There were three, and they had drifted:
// the settings list rendered "✓ Ch. 4: Title" while the rebuild that runs after a
// book switch — repopulating the very same <select> — rendered "Chapter 4: Title"
// with no completion ticks. Switching books silently relabelled the list.
//
// `filter` matches the visible label (so it hits both number and title) or the
// bare chapter number. Returns the html plus a count, because the caller needs to
// tell the student "3 of 286" or "no matches".
// `ceilingNum` (v3.17.0) limits the list to chapters at or before that one — the
// Flip Back picker's whole safety property. Optional and defaulted, so the three
// existing callers are untouched; passing a chapter that is not in the body list
// yields NO ceiling rather than an empty picker, because a student locked out of
// their own book is a worse failure than one offered a chapter too many.
function buildChapterOptions(selectedNum, filter, withCheck, ceilingNum) {
    if (!bookMetadata || !bookMetadata.chapters || !bookMetadata.chapters.length) {
        return { html: '<option value="">\u2014</option>', count: 0, total: 0 };
    }
    const q = String(filter || '').trim().toLowerCase();

    // ⚠️ STUDENTS ARE OFFERED BODY CHAPTERS ONLY (v3.11.0).
    //
    // This used to list every document in the spine, so "Ch. 0.2" — the imprint,
    // the copyright page, the colophon — sat in the picker as something to type.
    // Which is why the only safe workflow was to DELETE front matter during
    // import, and that in turn deleted the copyright notice a Creative Commons
    // licence requires be kept intact. A UI default was quietly setting a legal
    // constraint.
    //
    // Now the matter class decides. Front and back matter stay in the book, where
    // the notice belongs, and never reach a student. If a preface or an author's
    // introduction IS worth typing — §B.7's point, and Baum's introduction is a
    // real example — flip it to Body with the button in admin staging (v3.19.0).
    // One switch, one meaning: body means typeable.
    let offer = bodyChapterList();
    if (ceilingNum !== undefined && ceilingNum !== null) {
        const ck = chapterKey(ceilingNum);
        const cut = offer.findIndex(c => chapterKey(c.id) === ck);
        if (cut >= 0) offer = offer.slice(0, cut + 1);
    }
    const total = offer.length;
    let html = '', count = 0;

    // ⚠️ A PART-NUMBERED BOOK RESTARTS ITS CHAPTER NUMBERS (v3.12.4), and the label
    // logic below prefers the title whenever it begins with "chapter" — which
    // discards the id. So Heidi listed "Chapter 1" through "Chapter 14" and then
    // "Chapter 1" through "Chapter 9" again: twenty-three entries, fourteen of them
    // ambiguous. Treasure Island, Little Women and The War of the Worlds are all the
    // same shape. Jake hit it on the two-chapter fixture, where the picker showed
    // "Chapter 1" twice and there was no way to tell which was which.
    //
    // Only prefixed when the book actually HAS parts, so a novel's picker is
    // untouched. 0.x and 900.x are matter ids, not parts.
    const partOf = (id) => {
        const m = /^(\d+)\.\d+$/.exec(String(id).replace('chapter_', ''));
        if (!m) return null;
        const n = parseInt(m[1], 10);
        return (n === 0 || n === 900) ? null : n;
    };
    const partedBook = new Set(offer.map(c => partOf(c.id)).filter(x => x !== null)).size >= 2;

    offer.forEach((chap) => {
        const num  = String(chap.id).replace('chapter_', '');
        const tick = (withCheck !== false && completedChapters.has(num)) ? '\u2713 ' : '';
        const pt   = partedBook && partOf(chap.id) !== null
            ? `Pt ${partOf(chap.id)} \u00b7 ` : '';
        let label = `${tick}${pt}Ch. ${num}`;
        if (chap.title && chap.title != num) {
            label = String(chap.title).toLowerCase().startsWith('chapter')
                ? `${tick}${pt}${chap.title}`
                : `${tick}${pt}Ch. ${num}: ${chap.title}`;
        }
        if (q && num !== q && !label.toLowerCase().includes(q)) return;
        count++;
        const sel = (String(num) === String(selectedNum)) ? ' selected' : '';
        html += `<option value="${escapeHtml(num)}"${sel}>${escapeHtml(label)}</option>`;
    });

    if (!count) html = '<option value="">No chapters match</option>';
    return { html, count, total };
}

// Wires a filter box to a chapter <select>. Shared by Settings and the Game
// Genie so the behaviour — including Enter meaning "go" — can't diverge.
function wireChapterFilter(filterId, selectId, statusId, goId, ceilingNum) {
    const f = document.getElementById(filterId);
    const s = document.getElementById(selectId);
    if (!f || !s) return;
    const status = statusId ? document.getElementById(statusId) : null;
    f.oninput = () => {
        const keep = s.value;
        const r = buildChapterOptions(keep, f.value, undefined, ceilingNum);
        s.innerHTML = r.html;
        if (status) {
            status.textContent = !f.value.trim() ? ''
                : r.count ? `${r.count} of ${r.total}`
                          : 'no matches';
            status.style.color = (f.value.trim() && !r.count) ? '#D32F2F' : '#888';
        }
    };
    f.onkeydown = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const go = goId && document.getElementById(goId);
        if (go && s.value) go.click();
    };
}

// ─── Progress Bars ────────────────────────────────────────────────────────────

// Above this many chapters the per-chapter segment bar stops being either
// legible or affordable and we switch to a single condensed track.
//
// 40 is where a segment drops under ~7px on the shortest bar we render (a
// ~280px strip on a 768px Chromebook), which is about the floor for a divider
// plus fill to read as anything. Aesop is 286.
const BOOK_BAR_MAX_SEGMENTS = 40;
let bookBarCondensed = false;

function initBookProgressBar() {
    const track = document.getElementById('book-progress-track');
    if (!track || !bookMetadata || !bookMetadata.chapters) return;

    // ⚠️ SEGMENTS ARE BODY CHAPTERS (v3.13.0). This iterated
    // bookMetadata.chapters, so the bar drew a stripe for the title page, imprint,
    // dedication, appendix, endnotes, colophon and uncopyright page. On the
    // two-chapter fixture that is ten stripes for two chapters — the last of the
    // "map still loads all the chapters" reports, and the sixth place in this file
    // where the fix was "use the body list". The labels and the fraction were
    // switched in v3.10.0 and v3.12.3; the geometry itself never was, so the bar
    // was drawn against one denominator and filled against another.
    const chapters = bodyChapterList();
    const total    = chapters.length;
    if (!total) return;

    // Built ONCE for the whole render, not once per segment: Aesop has 284
    // chapters and this used to be the hot loop the v3.6.0 audit went after.
    const _bpOrdinals = bodyOrdinalMap();
    const bodyTotal = total;

    track.innerHTML = '';
    bookBarCondensed = total > BOOK_BAR_MAX_SEGMENTS;

    if (bookBarCondensed) {
        // Three nodes, not 5×286. updateProgressBars() then costs three lookups
        // per keystroke instead of 1,144.
        track.innerHTML =
            '<div id="book-condensed-fill" class="book-condensed-fill"></div>' +
            '<div id="book-condensed-marker" class="book-condensed-marker"></div>';
        const lbl0 = document.getElementById('book-progress-label');
        // Body chapters, not every document in the spine — "290 ch" for Aesop
        // counted the colophon and the uncopyright page.
        if (lbl0) lbl0.textContent = bodyTotal + ' ch';
        updateProgressBars();
        return;
    }

    chapters.forEach((chap, i) => {
        const seg = document.createElement('div');
        seg.className  = 'book-chap-seg future';
        seg.id         = 'bps-' + chap.id;
        seg.style.cssText = 'position:absolute;left:0;right:0;' +
            'top:'    + (i / total * 100) + '%;' +
            'height:' + (1 / total * 100) + '%;';

        // Divider line between chapters
        if (i > 0) {
            const div = document.createElement('div');
            div.className = 'book-chap-divider';
            div.style.top = '0';
            seg.appendChild(div);
        }

        // Inner fill (progress within current chapter)
        const innerFill = document.createElement('div');
        innerFill.className = 'chap-inner-fill';
        innerFill.id = 'bpf-' + chap.id;
        seg.appendChild(innerFill);

        // Inner marker (glowing line at current position)
        const innerMarker = document.createElement('div');
        innerMarker.className = 'chap-inner-marker';
        innerMarker.id = 'bpm-' + chap.id;
        seg.appendChild(innerMarker);

        // Chapter number label (every chapter, shown on right side)
        // Ordinal among BODY chapters, so Heidi reads 1..23 instead of fourteen
        // segments all labelled "1". Front and back matter get no number — they
        // are not chapters and numbering them was how 0.1 became "0".
        const ord = _bpOrdinals.get(chapterKey(chap.id));
        const lbl = document.createElement('div');
        lbl.className = 'book-chap-label';
        lbl.textContent = (ord === undefined) ? '' : ord;
        lbl.style.top = '50%';
        seg.appendChild(lbl);

        track.appendChild(seg);
    });

    // ⚠️ SECOND SITE, MISSED IN v3.10.0 (fixed v3.12.3). The condensed bar's label
    // was switched to the body count and this one was not, so an uncondensed book
    // still advertised every spine document — "10 ch" for a two-chapter book.
    const lbl = document.getElementById('book-progress-label');
    if (lbl) lbl.textContent = bodyTotal + ' ch';

    updateProgressBars();
}

// Where we are through the whole book, 0..1. Chapters are treated as equal
// width — they aren't, but the metadata document holds no per-chapter length and
// reading 286 chapter documents to find out would cost more than the honesty is
// worth. Within the current chapter we interpolate by real character position,
// so the marker still moves smoothly as you type.
// ─── STOP DOING ARITHMETIC ON CHAPTER IDS (v3.10.0) ──────────────────────────
//
// Four places in this file did parseInt() on a chapter id. On the four
// part-numbered books — Heidi, Treasure Island, Little Women, The War of the
// Worlds — a chapter id looks like "1.14", and parseInt("1.14") is 1. So:
//
//   · every one of Heidi's fourteen part-one chapters was labelled "1" on the
//     book progress bar, and all nine part-two chapters were labelled "2";
//   · parseInt("1.01") === parseInt("1.14") is TRUE, so findIndex() matched the
//     FIRST chapter in the part rather than the one being read — the position
//     marker never left the start of part one;
//   · isCurrent was computed the same way, so THE WHOLE PART lit up as current
//     simultaneously, and isPast was wrong for the same reason.
//
// An id is a LABEL, not a number. Position comes from the chapter list, by exact
// string match. Same defect class as index.html v3.3.1 and as the comparator
// admin.js fixed in v3.17.0 — third appearance in the project.
function chapterKey(id) {
    return String(id === undefined || id === null ? '' : id).replace(/^chapter_/, '');
}

// The body chapters, in order. Two fallbacks, because the data is not uniform:
//
//   · admin.js v3.19.1+ writes `matter` on every chapter — use it;
//   · older documents have no `matter` at all, so fall back to the ID CONVENTION
//     that assignChapterIds() established: front matter is 0.x, back matter is
//     900.x. Without this fallback an old book's front matter would count as
//     body chapter 1 and shift every ordinal, which is worse than the bug;
//   · a book with no body chapters at all (shouldn't happen) returns everything
//     rather than an empty bar.
function bodyChapterList() {
    const all = (bookMetadata && bookMetadata.chapters) ? bookMetadata.chapters : [];
    if (!all.length) return all;
    let body;
    if (all.some(c => c && c.matter)) {
        body = all.filter(c => (c.matter || 'body') === 'body');
    } else {
        body = all.filter(c => {
            const k = chapterKey(c.id);
            return !/^0\./.test(k) && !/^900\./.test(k);
        });
    }
    return body.length ? body : all;
}

// ─── THE FIRST CHAPTER IS NOT NECESSARILY CALLED "1" (v3.12.1) ───────────────
//
// Opening a book with no saved progress hardcoded currentChapterNum = 1 and
// called loadChapter(1). On a PART-NUMBERED book the first chapter is "1.01", so
// chapter_1 does not exist and the reader gets "Book content not found." or, in
// Adventure mode, a blank page with a stick figure and no text.
//
// ⚠️ THIS WAS NOT INTRODUCED BY THE TEST FIXTURE. It has been true for Heidi,
// Treasure Island, Little Women and The War of the Worlds since part numbering
// shipped in admin.js v3.14.0 — any student opening one of those four for the
// FIRST time got a blank book. It went unnoticed because the four were only ever
// opened by someone who already had progress stored.
//
// Sixth appearance of "the id is not a number" in this project.
function firstBodyChapterId() {
    const list = bodyChapterList();
    if (!list.length) return null;
    return String(list[0].id).replace(/^chapter_/, '');
}

// ⚠️ RENUMBER PROTECTION. Fix C (admin.js v3.18.5) changes chapter ids on the
// Gutenberg books — Toby Tyler goes from 3-22 to 1-20. A student whose stored
// progress points at chapter_22 would ask for a chapter the re-imported book no
// longer has. Validating the stored id against the book turns that from a dead
// end into a nudge back to the start.
function isKnownBodyChapter(id) {
    const k = chapterKey(id);
    return bodyChapterList().some(c => chapterKey(c.id) === k);
}

// ─── PROGRESS RE-ANCHORING (v3.15.0) ────────────────────────────────────────
//
// A bookmark is (chapter id, charIndex). BOTH coordinates are measured against
// one specific version of the book's text, and until now the progress document
// recorded nothing about which version that was. Re-upload a book — which Jake
// does, in bulk, whenever the cleaning pass finishes a round — and every stored
// charIndex silently becomes an offset into a text that no longer exists.
//
// ⚠️ THE SYMPTOM IS NOT AN ERROR. It is a student opening A Little Princess and
// finding one sentence left in a chapter they had barely started. Nothing throws,
// nothing logs, and the chapter completes normally when they type that sentence —
// so the book quietly marks itself read. Rounds 6 and 7 hardened the chapter *id*
// (isKnownBodyChapter, the furthestChapter companion check, firstBodyChapterId).
// Nobody ever hardened the character offset, and setupGame() assigned it raw.
//
// The fix has two halves:
//
//   PROOF — every write now stores `anchorText`, the ~48 characters immediately
//   behind the cursor. On a version mismatch we look for that string in the new
//   text. Finding it is not a guess about where the student was; it is where they
//   were, and it survives both word-level edits elsewhere in the chapter and a
//   renumber that moved the whole chapter somewhere else.
//
//   DEGRADATION — when there is no anchor (every document written before this
//   version) or the edit landed on those exact words, fall back on a ladder keyed
//   to how stale the bookmark is. Jake's rule, and it is a better one than mine:
//   under a week, keep the exact spot, because they remember the sentence; under
//   a month, the start of the sentence; beyond that, the start of the chapter,
//   because they have forgotten the chapter anyway.
//
// ⚠️ THE LADDER NEEDS NO MIGRATION AND NO LEGACY BRANCH. `lastUpdated` has been
// on the progress document all along, so the entire pre-fix cohort is simply
// "stale" and lands on the chapter-start rung by the ordinary rule.
const ANCHOR_LEN           = 48;
const REANCHOR_EXACT_MS    =  7 * 86400000;  // under a week  → exact offset
const REANCHOR_SENTENCE_MS = 30 * 86400000;  // under a month → sentence start
                                             // beyond        → chapter start

function chapterTitleFor(id) {
    if (!bookMetadata || !bookMetadata.chapters) return '';
    const k = chapterKey(id);
    const c = bookMetadata.chapters.find(x => chapterKey(x.id) === k);
    return (c && c.title) ? String(c.title) : '';
}

// Title -> chapter id, for recovering from a renumber. ⚠️ REFUSES ON AMBIGUITY
// (invariant 75, "refuse rather than approximate"). A part-numbered book can
// carry the same title in two parts,
// and Aesop has 284 chapters whose titles are not guaranteed unique. Returning
// null hands the decision back to the staleness ladder, which is honest;
// picking the first match would teleport a student into the wrong part.
function chapterIdForTitle(title) {
    const want = String(title || '').trim().toLowerCase();
    if (!want) return null;
    const hits = bodyChapterList()
        .filter(c => String(c.title || '').trim().toLowerCase() === want);
    if (hits.length !== 1) return null;
    return String(hits[0].id).replace(/^chapter_/, '');
}

// The ~48 characters BEHIND the cursor, i.e. the last thing the student typed.
// Behind rather than ahead on purpose: the text behind them is what they have
// demonstrably read, and an anchor taken from ahead would re-anchor them to
// content they have not seen if the edit inserted a paragraph.
function anchorTextAt(text, idx) {
    if (!text || idx <= 0) return '';
    const end = Math.min(idx, text.length);
    return text.slice(Math.max(0, end - ANCHOR_LEN), end);
}

// Nearest occurrence to `near`, not the first. A short anchor can legitimately
// repeat ("said Sara. " and so on), and the student's old offset is the best
// available tiebreak. Returns the index just PAST the match — where the cursor
// belongs — or -1.
function findAnchorEnd(text, anchor, near) {
    if (!text || !anchor || anchor.length < 12) return -1;
    let best = -1, bestDist = Infinity, from = 0, at;
    while ((at = text.indexOf(anchor, from)) !== -1) {
        const end = at + anchor.length;
        const d = Math.abs(end - near);
        if (d < bestDist) { bestDist = d; best = end; }
        from = at + 1;
    }
    return best;
}

// Consumed by setupGame(), which is the first moment fullText exists. Sets
// savedCharIndex and, when it moved someone, reanchorNotice.
//
// ⚠️ THE CLAMP RUNS EVEN WITH NO JOB. That single line is what stops a stored
// index past the end of a shortened chapter from rendering a chapter with
// nothing left to type — the original bug, independent of everything else here.
function reconcilePosition() {
    const len = fullText ? fullText.length : 0;
    reanchorNotice = '';

    // ⚠️ v3.15.1. AN OFFSET AT OR PAST THE END IS NOT A POSITION — IT IS A DEAD
    // STATE, and it must be caught before anything else in this function looks
    // at it. There is no such thing as a useful resume point with zero characters
    // left: the renderer draws the tail of the chapter, the student reads that as
    // "one sentence to go", and their FIRST KEYSTROKE hits the
    // `currentCharIndex >= fullText.length` guard in the keydown handler and runs
    // finishChapter(). The chapter ticks itself off in 0m 1s at 0 WPM.
    //
    // ⚠️ v3.15.0 SHIPPED THIS AS A BUG AND I HAD THREE WAYS IN:
    //   · clamping to `len` and calling it "keeping their exact spot" (recent rung)
    //   · clamping to `len` and THEN snapping to the sentence start, which lands on
    //     the final sentence of any chapter, every time (the 7–30 day rung)
    //   · the recent rung LAUNDERING the bad offset: one keystroke finishes the
    //     chapter, the flush stamps the current contentVersion onto the dead
    //     position, and from then on the versions agree and no job ever fires again
    //
    // Recency cannot rescue an index that is provably invalid, so this check sits
    // ABOVE the ladder and applies whether or not there is a job. Restarting the
    // chapter is the only actionable state; `completedChapters` still holds the ✓,
    // so nothing a student earned is lost by doing it.
    const idx = Math.max(0, Math.min(savedCharIndex, len));
    const deadState = len > 0 && savedCharIndex >= len;

    // ⚠️ ORDER IS LOAD-BEARING: PROOF IS CONSULTED BEFORE THE DEAD-STATE GUARD.
    // My first attempt at this fix put the guard first, and the harness caught it
    // immediately: a chapter that SHRANK below a student's stored offset is both
    // out of range AND perfectly rescuable, because the anchor still names the
    // exact words they had reached. Bailing to the top of the chapter there
    // throws away the one piece of hard evidence in the whole system.
    if (reanchorJob && reanchorJob.anchorText && idx > 0) {
        const hit = findAnchorEnd(fullText, reanchorJob.anchorText, idx);
        // An anchor resolving to the very end is the dead state by another road.
        // Proof that they finished is not a reason to seat them where there is
        // nothing to do — fall through to the guard below.
        if (hit >= 0 && hit < len) {
            savedCharIndex = hit;
            if (Math.abs(hit - idx) > 2) {
                reanchorNotice = 'This book was updated — we found your exact spot.';
            }
            return;
        }
    }

    if (deadState) {
        savedCharIndex = 0;
        if (reanchorJob) {
            reanchorNotice = 'This book was updated — restarting from the top of this chapter.';
        }
        return;
    }

    if (!reanchorJob) { savedCharIndex = idx; return; }
    if (idx <= 0)     { savedCharIndex = 0;   return; }   // nothing to rescue

    const age = reanchorJob.ageMs;
    if (age < REANCHOR_EXACT_MS) {
        savedCharIndex = idx;
        if (idx !== reanchorJob.storedIndex) {
            reanchorNotice = 'This book was updated since you last read it.';
        }
    } else if (age < REANCHOR_SENTENCE_MS) {
        savedCharIndex = findSentenceStartFor(idx);
        reanchorNotice = 'This book was updated — restarting from the top of your sentence.';
    } else {
        savedCharIndex = 0;
        reanchorNotice = 'This book was updated — restarting from the top of this chapter.';
    }
}

// The four fields that make a bookmark self-describing. Spread into EVERY write
// to the progress document — a write that omits them leaves a bookmark that the
// next re-upload cannot rescue, and the omission is silent.
//
// `forChapter` is for the two navigation writes that record a destination before
// its text has loaded (switchChapterHot, Game Genie's chapter jump). Those get
// an empty anchor rather than the OUTGOING chapter's, which would be worse than
// nothing: a confident fingerprint pointing at the wrong chapter entirely.
function progressStamp(forChapter) {
    const ahead = forChapter !== undefined && forChapter !== null;
    return {
        contentVersion: (bookMetadata && bookMetadata.contentVersion) || null,
        chapterTitle:   chapterTitleFor(ahead ? forChapter : currentChapterNum),
        chapterLen:     ahead ? 0 : (fullText ? fullText.length : 0),
        anchorText:     ahead ? '' : anchorTextAt(fullText, currentCharIndex)
    };
}

// key -> 1-based ordinal among body chapters. Built once per caller, not once
// per chapter: Aesop has 284 of them and this runs on every progress repaint.
function bodyOrdinalMap() {
    const m = new Map();
    bodyChapterList().forEach((c, i) => m.set(chapterKey(c.id), i + 1));
    return m;
}

function bookProgressFraction() {
    const chapters = bodyChapterList();
    if (!chapters.length) return 0;
    const key = chapterKey(currentChapterNum);
    const idx = chapters.findIndex(c => chapterKey(c.id) === key);
    // Reading front or back matter: not on the body track, so report no movement
    // rather than snapping the marker to the start.
    if (idx < 0) return 0;
    const within = (fullText && fullText.length)
        ? Math.min(1, currentCharIndex / fullText.length) : 0;
    return (idx + within) / chapters.length;
}

function updateProgressBars() {
    if (!fullText || !fullText.length) return;
    const pct = (currentCharIndex / fullText.length) * 100;

    // ── Left bar: progress through current chapter ────────────────────────────
    const fill   = document.getElementById('chapter-progress-fill');
    const marker = document.getElementById('chapter-progress-marker');
    const clabel = document.getElementById('chapter-progress-label');
    if (fill)   fill.style.height   = Math.min(100, pct) + '%';
    if (marker) marker.style.top    = Math.min(100, pct) + '%';
    if (clabel) clabel.textContent  = Math.round(pct) + '%';

    // ── Right bar: whole book ─────────────────────────────────────────────────
    if (!bookMetadata || !bookMetadata.chapters) return;

    if (bookBarCondensed) {
        const bookPct = bookProgressFraction() * 100;
        const cf = document.getElementById('book-condensed-fill');
        const cm = document.getElementById('book-condensed-marker');
        if (cf) cf.style.height = bookPct + '%';
        if (cm) cm.style.top    = bookPct + '%';
        const lbl2 = document.getElementById('book-progress-label');
        if (lbl2) {
            const o = bodyOrdinalMap().get(chapterKey(currentChapterNum));
            const t = bodyChapterList().length;
            // Falls back to the raw id when the reader is in front/back matter,
            // which is honest: "Ch 0.1 / 23" beats inventing a position.
            lbl2.textContent = 'Ch ' + (o === undefined ? currentChapterNum : o) + ' / ' + t;
        }
        return;
    }

    const ordinals = bodyOrdinalMap();
    const curOrd = ordinals.get(chapterKey(currentChapterNum));
    // Same list the builder used (v3.13.0). Walking the full spine here still
    // "worked" — the missing front/back matter nodes just failed their lookup and
    // hit `if (!seg) return` — but a loop that relies on half its iterations
    // silently finding nothing is a loop nobody can reason about later.
    bodyChapterList().forEach((chap) => {
        const ord = ordinals.get(chapterKey(chap.id));
        // Compared by POSITION, not by parsing the label. parseInt("1.01") and
        // parseInt("1.14") are both 1, which is why an entire part used to render
        // as current at once.
        const isCurrent = ord !== undefined && curOrd !== undefined && ord === curOrd;
        const isPast    = ord !== undefined && curOrd !== undefined && ord <  curOrd;

        const seg   = document.getElementById('bps-' + chap.id);
        const bfill = document.getElementById('bpf-' + chap.id);
        const bmark = document.getElementById('bpm-' + chap.id);
        if (!seg) return;

        seg.className = 'book-chap-seg ' +
            (isPast ? 'completed' : isCurrent ? 'current' : 'future');

        if (bfill) bfill.style.height = isPast ? '100%' : isCurrent ? Math.min(100, pct) + '%' : '0%';
        if (bmark) {
            bmark.style.display = isCurrent ? '' : 'none';
            bmark.style.top     = Math.min(100, pct) + '%';
        }

        // Highlight active chapter label
        const lbl = seg.querySelector('.book-chap-label');
        if (lbl) lbl.className = 'book-chap-label' + (isCurrent ? ' active-label' : '');
    });
}

// ⚠️ PER-KEYSTROKE HOT PATH. Everything below runs on every single character a
// student types, so a wasted DOM operation here is paid 300-400 times a minute
// per student. Two things were costing real frames on low-end hardware:
//
//   1. highlightCurrentChar() ran document.querySelectorAll('.letter.active')
//      — a full-document scan across ~8,000 spans — on every keystroke. Worse,
//      handleTyping() had ALREADY removed .active from the current element three
//      lines earlier, so the scan reliably walked eight thousand elements to
//      find nothing. We know which element it was; track it.
//
//   2. centerView() read container.clientHeight and currentEl.offsetTop
//      immediately after a class mutation, forcing a synchronous layout, then
//      wrote a transform — which invalidates layout again for the next
//      keystroke. Textbook layout thrash.
//
// The container height only changes on resize, so it's cached. offsetTop still
// has to be read (it depends on where the character wrapped to), but the read
// and the write are now batched into one rAF so a burst of fast keystrokes
// collapses into a single layout pass per frame instead of one per character.

let _activeLetterEl = null;         // the element currently wearing .active
let _cachedContainerHeight = 0;
let _centerRaf = 0;

function invalidateContainerHeight() { _cachedContainerHeight = 0; }
window.addEventListener('resize', invalidateContainerHeight);

function centerView() {
    if (_centerRaf) return;         // one scroll update per frame, not per key
    _centerRaf = requestAnimationFrame(() => {
        _centerRaf = 0;
        const currentEl = document.getElementById(`char-${currentCharIndex}`);
        if (!currentEl) return;
        if (!_cachedContainerHeight) {
            const container = document.getElementById('game-container');
            if (!container) return;
            _cachedContainerHeight = container.clientHeight;
        }
        const offset = (_cachedContainerHeight / 2) - currentEl.offsetTop - 25;
        textStream.style.transform = `translateY(${offset}px)`;
    });
}

function highlightCurrentChar() {
    // Was: querySelectorAll('.letter.active') — a full-document scan, every key.
    if (_activeLetterEl) _activeLetterEl.classList.remove('active');
    const el = document.getElementById(`char-${currentCharIndex}`);
    _activeLetterEl = el || null;
    if (el) { el.classList.add('active'); highlightKey(fullText[currentCharIndex]); }
    updateHandGuide();
    updateProgressBars();
}

// renderText() throws away every span, so the tracked element is now detached.
// Anything that rebuilds the stream must call this or the next highlight will
// try to clean up a node that is no longer in the document. Harmless, but it
// would quietly leak the old chapter's DOM.
function resetActiveLetterTracking() {
    _activeLetterEl = null;
    _cachedContainerHeight = 0;
}

function updateImageDisplay() {
    const p = document.getElementById('image-panel');
    if(p) p.style.display = 'none';
}

// Returns true if position A is ahead of position B in the book
function isPositionAhead(chapA, idxA, chapB, idxB) {
    const a = parseInt(chapA) || 0;
    const b = parseInt(chapB) || 0;
    return a > b || (a === b && idxA > idxB);
}

// ═════════════════════════════════════════════════════════════════════════════
// PERSISTENCE — write-ahead log + coalesced flush
// ═════════════════════════════════════════════════════════════════════════════
//
// The old saveProgress() fired on every '.', '!', '?' and newline, and each call
// wrote THREE documents. At 7,000 students that was ~236,000 writes/day against
// a 20,000/day free tier.
//
// What replaced it is not "save less" — it's "save to the right place first."
// Every sentence still records everything, synchronously, to localStorage. That
// is the durable copy and it costs nothing. Firestore gets a batched flush every
// FLUSH_INTERVAL_MS and on every event that actually ends a session.
//
// This is STRICTLY MORE durable than what it replaced. The old code lost
// everything typed since the last punctuation mark if the tab died. The WAL
// loses nothing — on next load we detect unflushed local state and replay it.
// Firestore is now the sync-and-reporting layer; localStorage is the safety net.

const WAL_KEY = 'ttb_wal_v2';
const FLUSH_INTERVAL_MS = 300000;   // 5 minutes
let walFlushTimer = null;
let walDirty = false;
// ⚠️ pendingSessions IS GONE. (v3.22.0) The queue lives in session-log.js, which
// persists it to its own localStorage key and stamps every record with the date
// it was TYPED. It used to ride inside this WAL under `sessions`, which meant it
// inherited the WAL's book scoping and the WAL's flush-time date. Legacy records
// are adopted once, in walRecover().
let statsDocDirty = false;          // ⚠️ v3.31.0: now means "a WAL recovery put
                                    // seconds into statsData that no flush has
                                    // written to typing_logs yet". It no longer
                                    // refers to a stats document; there isn't one.
// Denormalised tenancy stamps, written onto every log so reports can be scoped
// by class or building without reading the whole collection. See MULTITENANCY.md.
let ttbClassId = '';
let ttbSchoolId = '';

function walSnapshot() {
    return {
        v: 2,
        uid: currentUser ? currentUser.uid : '',
        bookId: currentBookId,
        savedAt: Date.now(),
        progress: isPracticeMode ? null : {
            chapter: currentChapterNum,
            charIndex: currentCharIndex,
            furthestChapter: furthestChapter,
            furthestCharIndex: furthestCharIndex,
            completedChapters: Array.from(completedChapters),
            ...progressStamp()
        },
        stats: { ...statsData },
    };
}

function walSave() {
    if (!currentUser || currentUser.isAnonymous) return;
    // ⚠️ THE COUNTERS GO SOMEWHERE ELSE NOW, AND THAT IS THE v3.21.0 FIX.
    //
    // This slot is book-scoped: walRecover() declines it when the bookId does
    // not match, which is correct — one book's character offset is meaningless
    // in another. But `stats` was riding in the same record, and the time a
    // student spent typing is true regardless of which book they were in. So a
    // book switch declined the whole record and the next hide overwrote it,
    // taking up to five minutes of un-flushed typing with it.
    //
    // stats-wal.js is keyed by uid and period instead. It is written first so a
    // quota failure on the (much larger) book record below cannot cost us the
    // counters, which are the part a teacher's report actually reads.
    statsWalSave(currentUser.uid, statsData);
    try { localStorage.setItem(WAL_KEY, JSON.stringify(walSnapshot())); }
    catch (e) { console.warn("WAL write failed (quota?):", e); }
}

function walLoad() {
    try {
        const raw = localStorage.getItem(WAL_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
}

function walClear() {
    try { localStorage.removeItem(WAL_KEY); } catch (_) {}
}

// Called wherever saveProgress() used to be. Records to localStorage now and
// schedules a Firestore flush. Cheap enough to call on every keystroke if needed.
function markDirty() {
    if (!currentUser || currentUser.isAnonymous) return;
    if (!isPracticeMode && isPositionAhead(currentChapterNum, currentCharIndex, furthestChapter, furthestCharIndex)) {
        furthestChapter = currentChapterNum;
        furthestCharIndex = currentCharIndex;
    }
    walDirty = true;
    walSave();
    if (!walFlushTimer) {
        walFlushTimer = setTimeout(() => { walFlushTimer = null; flushAll('interval'); }, FLUSH_INTERVAL_MS);
    }
}

// ⚠️ RE-ENTRANCY GUARD — THIS ONE CORRUPTED TEACHER-FACING DATA.
//
// flushAll() is reachable from four places: the interval timer, the
// visibilitychange handler, saveProgress(force), and walRecover(). It is async
// with four sequential awaits, so two runs could overlap. When they did, both
// captured the SAME `sessionsBeingWritten = pendingSessions.slice()`, both
// addDoc()'d that rollup, and both then ran `pendingSessions.slice(n)`.
//
// Result: a duplicate typing_sessions document. The main report table reads
// typing_logs, which is a merge and therefore immune — but the per-day sprint
// drill-down a teacher opens to check a student's work reads typing_sessions,
// and it was double-counting minutes and sprint totals.
//
// Serialising is enough. A caller arriving mid-flush waits for the running
// flush to finish and then runs its own, so a late-arriving `final` still gets
// its rollup written rather than being silently dropped.
//
// ⚠️ THE LOOP IS `while`, NOT `if`, AND THAT IS THE WHOLE GUARD. (v3.9.2)
//
// v3.9.1 wrote `if (_flushInFlight) await _flushInFlight`, which holds for two
// callers and fails for three. With A running and B and C both parked on A's
// promise: A resolves, A's finally nulls the slot, and B and C are BOTH already
// past the `if` — so both assign `_flushInFlight` and both inner runs execute
// concurrently, which is the exact duplicate-rollup bug the guard exists to
// prevent. Measured, not reasoned: 6 simultaneous callers gave 5 overlapping
// inner runs.
//
// `while` closes it because re-checking after the await is synchronous with the
// assignment that follows — B leaves the loop and claims the slot in one
// uninterrupted step, so C's re-check sees B's promise and parks on that
// instead. There are four call sites (interval timer, visibilitychange,
// saveProgress(force), walRecover()), so three-deep is reachable in normal use.
let _flushInFlight = null;

// ⚠️ checkForWeekRepair() WAS HERE AND IS DELETED (v3.31.0). It resynced this
// session against reports.html's week-counter repair, because a live tab holding
// a stale week total would otherwise write it straight back over the fix. Both
// halves of that are gone: there is no stored week total to be stale, and no
// repair button to be undone. `statsData.secondsWeek` is recomputed from seven
// documents on every load and is never written anywhere. HANDOFF §0.0.
//
// ⚠️ IF SOMETHING LIKE THIS COMES BACK, THE SECOND COPY HAS COME BACK. That is
// the thing to go and find, not the resync.

async function flushAll(reason, final = false) {
    while (_flushInFlight) {
        await _flushInFlight.catch(() => {});
    }
    _flushInFlight = _flushAllInner(reason, final);
    try { await _flushInFlight; }
    finally { _flushInFlight = null; }
}

// Push local state to Firestore. `final` writes the rollup documents that only
// matter between sessions (stats doc, session history); the periodic flush skips
// them and writes position only.
async function _flushAllInner(reason, final = false) {
    if (!currentUser || currentUser.isAnonymous) return;
    const queued = sessionLogPending(currentUser.uid);
    if (!walDirty && !final && queued === 0) return;

    if (walFlushTimer) { clearTimeout(walFlushTimer); walFlushTimer = null; }

    let ok = true;

    // 1. Position + completed chapters — ONE document. These used to be two
    //    separate writes to the same doc, which billed twice for no reason.
    if (!isPracticeMode && walDirty) {
        try {
            // bodyIndex/bodyTotal are written HERE because this is the only place
            // that has the chapter list loaded. index.html strips the list before
            // caching the grid (largest field on the document), so without these
            // two numbers a cached library card cannot place a part-numbered book
            // and falls back to rounding the label. Two integers, same write, no
            // extra billing. Undefined is never written — a reader in front matter
            // has no body position and must not be given a made-up one.
            const _ord = bodyOrdinalMap().get(chapterKey(currentChapterNum));
            const _bodyTotal = bodyChapterList().length;
            await setDoc(doc(db, "users", currentUser.uid, "progress", currentBookId), {
                chapter: currentChapterNum,
                charIndex: currentCharIndex,
                furthestChapter: furthestChapter,
                furthestCharIndex: furthestCharIndex,
                completedChapters: Array.from(completedChapters),
                ...(_ord !== undefined ? { bodyIndex: _ord } : {}),
                ...(_bodyTotal ? { bodyTotal: _bodyTotal } : {}),
                ...progressStamp(),
                lastUpdated: new Date()
            }, { merge: true });
            // This write carried the current contentVersion, so the bookmark and
            // the book agree again and the job is spent.
            reanchorJob = null;
        } catch (e) { ok = false; console.warn(`Progress flush failed (${reason}):`, e); }
    }

    // 2. Daily log for reports. Always written on a flush — this is what
    //    reports.html reads, and a teacher looking mid-period should see today.
    //
    // ⚠️ v3.29.0 — SOURCE-SPLIT FIELDS, NOT A SHARED `seconds`/`chars`/`mistakes`
    // TRIPLE. This is the fix for DESIGN-TELEMETRY.md §2.4: game.js and learn.js
    // both used to setDoc(merge:true) their OWN in-memory secondsToday into the
    // SAME field on the SAME document. A student who did School then Library
    // the same day had Library's smaller number silently overwrite School's —
    // real graded minutes gone, with no error, because a merge on a SHARED
    // field is a last-write-wins race, not a merge of anything. Writing to
    // secondsLibrary/charsLibrary/mistakesLibrary instead — a field ONLY this
    // page ever touches — makes that collision structurally impossible rather
    // than carefully avoided: whatever learn.js wrote under `secondsSchool` on
    // the same document survives a merge from here untouched, because this
    // write never mentions it. reports.html sums both triples on read; see its
    // `readLogTotals()`. ⚠️ REQUIRES firestore.rules v2.4.0 or later — the old
    // rule required a legacy `seconds` field on every document and would
    // reject a brand-new day's first flush outright. Deploy the rule first.
    // ⚠️ v3.31.0 — `|| statsDocDirty` MOVED ONTO THIS TRIGGER. It used to gate
    // the stats rollup below, which no longer exists. A WAL recovery sets it and
    // nothing else would have written the recovered seconds anywhere.
    if (walDirty || final || statsDocDirty) {
        const today = getLocalDateStr();

        // ⚠️⚠️ v3.34.0 — THE PROJECTION IS REVERTED. THE DAILY TOTAL IS THE
        // COUNTER AGAIN. DO NOT PUT IT BACK WITHOUT READING HANDOFF §0.0.
        //
        // v3.32.0 made this number `server sessions + local queue + open sprint`,
        // on the premise that `typing_sessions` is an append-only record that
        // cannot overstate what a child typed. ⚠️ THAT PREMISE IS FALSE. Jake's
        // drill-down on 2026-08-19 (HANDOFF §0.0) shows four rollups for one
        // student on 08-18 whose wall-clock windows OVERLAP — one covering
        // 10:47–11:16 and another 10:48–10:55, sharing sprint minutes with
        // different durations and character counts. A student cannot type two
        // different sprints at the same minute. Other records on 08-17 carry
        // NEGATIVE character counts. Each document's stored total matches its own
        // sprints, which is why Round 18's ten-document spot check passed and why
        // nothing here caught it.
        //
        // ⚠️ PROJECTING THE GRADE FROM THOSE RECORDS MAKES THE GRADE THE CORRUPT
        // NUMBER INSTEAD OF MERELY COMPARING AGAINST IT. That is strictly worse
        // than the counter, whose failures are at least understood.
        //
        // What is KEPT from this round and is not in question: loadUserStats()
        // reads the week from typing_logs (one number, no stats/time_tracking),
        // and the HUD is reset to whatever was actually written below. Those do
        // not depend on sessions being trustworthy. Only the projection did.
        //
        // ⚠️ SESSIONS REMAIN THE DRILL-DOWN AND THE RECONCILE INPUT. They are not
        // deleted and nothing stops writing them — they are the only evidence
        // that will identify whatever is producing the overlaps. They are simply
        // no longer permitted to decide a grade.
        // ⚠️⚠️ v3.35.0 — THE §3.1 FIX. THIS PAGE WRITES ONE SOURCE'S FIELDS AND
        // NOTHING ELSE. READ THIS BEFORE CHANGING THE PAYLOAD.
        //
        // Until now both controllers wrote the whole day under `seconds`, so a
        // Library tab left open from first period flushed its own stale total
        // over whatever School had written at lunch and a mode's time vanished.
        // Not a race that better locking fixes — a SHARED FIELD, where the last
        // writer is correct by definition. tab-lifetime-test.mjs Part C is that
        // exact classroom sequence and it lost ten minutes of twenty.
        //
        // Removing the sharing removes the defect. After the cutover this file
        // names secondsLibrary/charsLibrary/mistakesLibrary and learn.js names
        // the School triple. A merge from the other page cannot mention these
        // fields, so it cannot replace them. No lock, no read-modify-write, no
        // ordering requirement, nothing to get right at 8:47 in the morning.
        //
        // ⚠️ `own` SEEDS FROM ITS OWN FIELD (daylog.js applyWeekToStats), NEVER
        // FROM THE DAY TOTAL. Seeding from the total folds School's minutes into
        // Library's bucket and the reader adds them a second time — the v3.29.0
        // bug that got the whole split reverted in v3.30.0. tab-lifetime-test.mjs
        // Part E drives that mistake on purpose so it cannot ship quietly twice.
        //
        // ⚠️ THE GATE LIVES IN daylog.js AND IS SHARED WITH learn.js. Before the
        // cutover this writes the flat triple, byte-for-byte as v3.34.0 did,
        // because every reader is legacy-first until that date. Do not inline the
        // comparison here — two copies of a cutover rule is how a teacher and a
        // student end up reading one document and getting two numbers.
        const payload = dayLogPayloadFor('library', today, {
            day: { seconds:  statsData.secondsToday,
                   chars:    statsData.charsToday,
                   mistakes: statsData.mistakesToday },
            own: { seconds:  statsData.secondsLibrary,
                   chars:    statsData.charsLibrary,
                   mistakes: statsData.mistakesLibrary },
        });
        // ⚠️ THE LEDGER IS WRITTEN FIRST, AND THE ORDER IS THE SAFETY ARGUMENT.
        // See logdays.js: a ledger entry with no log behind it costs one wasted
        // read — which is precisely what every day costs today. A log with no
        // ledger entry costs a child minutes they earned. Never move this below
        // the setDoc, and never make the setDoc conditional on it.
        try { await noteDay({ db, doc, updateDoc, setDoc, arrayUnion,
                              uid: currentUser.uid, date: today }); }
        catch (_) { /* noteDay swallows its own failures; this is belt and braces */ }

        try {
            await setDoc(doc(db, "typing_logs", `${currentUser.uid}_${today}`), {
                uid: currentUser.uid,
                email: currentUser.email || "",
                displayName: currentUser.displayName || "Anonymous",
                classId: ttbClassId || "",
                schoolId: ttbSchoolId || "",
                date: today,
                ...payload,
                lastUpdated: new Date()
            }, { merge: true });

            // ⚠️ v3.35.0 — THE v3.33.0 HUD RECONCILIATION IS GONE, AND ITS
            // ABSENCE IS THE POINT. It reset statsData to whatever the write
            // computed, because v3.32.0's write was a PROJECTION of the session
            // record and could legitimately differ from the counter. v3.34.0
            // reverted that projection, which made the delta identically zero —
            // the block has been dead code for two versions.
            //
            // It must not come back in this shape. This write no longer knows
            // the day total: it names one source's fields, and the other
            // source's number lives in the document where only a fresh read
            // could find it. A "reconciliation" here would have to re-read to
            // learn anything, and would then be repainting the HUD from a value
            // this page did not write.
            //
            // ⚠️ AND THE CACHE IS NOT WRITTEN HERE. hud.js is explicit: the HUD
            // cache is saved after the authoritative read and never from the
            // live counter. loadUserStats() is that place. Writing it from here
            // would cache this tab's opinion of the day and hand it to the next
            // page load as though the server had said it.
        } catch (e) { ok = false; console.warn(`Log flush failed (${reason}):`, e); }
    }

    // 3. Week/day rollup.
    //
    // ⚠️ WRITTEN ON THE SAME TRIGGER AS THE DAILY LOG ABOVE, DELIBERATELY, AND
    // THIS IS NOT NEGOTIABLE. (v3.23.0)
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
    // ⚠️ v3.31.0 — THE stats/time_tracking WRITE IS DELETED. THIS IS THE POINT
    // OF THE WHOLE CHANGE, so do not put it back to "keep the HUD fast" or "for
    // the leaderboard" without reading HANDOFF §0.0 first.
    //
    // The comment that used to live here argued that two records of one quantity
    // MUST SHARE A WRITE TRIGGER or they will disagree. That was true and it was
    // treating the symptom. There is one record now. The daily log written above
    // IS the number, for the student and for the teacher, and the week is its
    // sum across seven days.
    statsDocDirty = false;

    // 4. Sprint history — DELEGATED TO session-log.js (v3.22.0).
    //
    // The chunking, the 200-record cap and the per-chunk advance all moved into
    // that module unchanged; what changed is that records are now GROUPED BY THE
    // DATE THEY WERE TYPED rather than all stamped with the date of the flush.
    // A queue that survived overnight used to collapse onto today, emptying
    // yesterday's drill-down and padding today's. See session-log.js.
    if (final && sessionLogPending(currentUser.uid) > 0) {
        const sessionsOk = await sessionLogFlush(currentUser.uid, {
            email: currentUser.email || "",
            displayName: currentUser.displayName || "Anonymous",
            classId: ttbClassId || "",
            schoolId: ttbSchoolId || "",
        });
        if (!sessionsOk) ok = false;
    }

    if (ok) {
        walDirty = false;
        // The watermark the visibilitychange delta gate measures against. Set on
        // the success path ONLY: a failed flush must not convince the next hide
        // that this work already reached Firestore.
        lastFlushedSecondsToday = statsData.secondsToday || 0;
        // Only drop the WAL once everything durable has landed. The session
        // queue keeps its own storage now, so this no longer has to wait on it.
        if (final) walClear();
        else walSave();
    } else {
        walSave();   // keep the local copy; next flush retries
    }
}

// Recover anything the last session couldn't flush — a crashed tab, a dead
// battery, a closed lid on a network blip. Called after progress/stats load so
// it can compare against what Firestore actually has.
function walRecover() {
    const wal = walLoad();
    if (!wal || wal.v !== 2) { walClear(); return false; }
    if (!currentUser || wal.uid !== currentUser.uid) return false;
    if (wal.bookId !== currentBookId) return false;   // different book; leave it

    let recovered = false;

    // Position: take the WAL's only if it's genuinely further along.
    if (wal.progress && isPositionAhead(wal.progress.chapter, wal.progress.charIndex,
                                       currentChapterNum, currentCharIndex)) {
        currentChapterNum = wal.progress.chapter;
        currentCharIndex = wal.progress.charIndex;
        savedCharIndex = wal.progress.charIndex;
        recovered = true;
    }
    if (wal.progress && isPositionAhead(wal.progress.furthestChapter, wal.progress.furthestCharIndex,
                                        furthestChapter, furthestCharIndex)) {
        furthestChapter = wal.progress.furthestChapter;
        furthestCharIndex = wal.progress.furthestCharIndex;
        recovered = true;
    }
    if (wal.progress && Array.isArray(wal.progress.completedChapters)) {
        const before = completedChapters.size;
        wal.progress.completedChapters.forEach(c => completedChapters.add(String(c)));
        if (completedChapters.size > before) recovered = true;
    }

    // Time: only trust the WAL if it's for the same day/week AND is larger.
    // Counters only go up within a period, so max() is the safe merge.
    // ⚠️ v3.35.0 — THE PER-SOURCE TRIPLE IS IN THIS LIST AND OMITTING IT LOSES
    // TIME SILENTLY. This block is the ONLY path by which a crashed tab's
    // unflushed minutes reach statsData, and after the cutover `secondsLibrary`
    // is the only number this page WRITES. Recover secondsToday without it and
    // the HUD climbs by the recovered minutes while the flush that follows
    // writes the un-recovered secondsLibrary — the student sees the time and the
    // teacher does not. The School triple rides along for the same reason it is
    // seeded: it costs a comparison and keeps the record whole for learn.js.
    if (wal.stats && wal.stats.lastDate === statsData.lastDate) {
        for (const k of ['secondsToday', 'charsToday', 'mistakesToday',
                         'secondsLibrary', 'charsLibrary', 'mistakesLibrary',
                         'secondsSchool', 'charsSchool', 'mistakesSchool']) {
            if ((wal.stats[k] || 0) > (statsData[k] || 0)) { statsData[k] = wal.stats[k]; recovered = true; }
        }
    }
    if (wal.stats && wal.stats.weekStart === statsData.weekStart) {
        for (const k of ['secondsWeek', 'charsWeek', 'mistakesWeek']) {
            if ((wal.stats[k] || 0) > (statsData[k] || 0)) { statsData[k] = wal.stats[k]; recovered = true; }
        }
    }

    if (Array.isArray(wal.sessions) && wal.sessions.length) {
        // ⚠️ ONE-TIME MIGRATION (v3.22.0). Sprints used to live in this record.
        // A student mid-upgrade has a `ttb_wal_v2` written by v3.21.x holding
        // sprints that were never flushed, and dropping them on the floor would
        // be a data loss caused by the fix for a data loss. Each record carries
        // its own ISO `at`, so the adopted copies get their true date; only a
        // record with no `at` at all falls back to today.
        const adopted = sessionLogAdopt(currentUser.uid, wal.sessions, getLocalDateStr());
        if (adopted) console.log(`Adopted ${adopted} legacy sprint record(s) into the session queue.`);
        recovered = true;
    }

    if (recovered) {
        console.log("Recovered unflushed work from local storage.");
        statsDocDirty = true;
        walDirty = true;
        flushAll('recovery', true);
    } else {
        walClear();
    }
    return recovered;
}

// Kept as a thin alias so the ~8 existing call sites keep reading naturally.
// `force` used to mean "write even if the cursor hasn't moved"; now every call
// records locally regardless, and force means "get it to Firestore now."
async function saveProgress(force = false) {
    markDirty();
    if (force) await flushAll('forced', true);
}

async function saveCompletedChapters() {
    // Folded into the progress document — completedChapters rides along in
    // flushAll(). This used to be a second billable write to the same doc.
    markDirty();
}

// ⚠️ THE RECORD IS PUSHED FOR AN EXPIRED SESSION TOO. (v3.22.0)
//
// The old guard was `if (!currentUser || currentUser.isAnonymous) return`, which
// threw away every sprint typed after a token lapse — the exact window in which a
// teacher most wants to know what happened. session-log.js persists to
// localStorage and needs no network and no live token, so there is no reason to
// drop the record; it flushes when the student signs back in.
//
// A true guest is still skipped, and that is not the same call. A guest has no
// account for the record to belong to, and stats-wal.js's guest accumulator is
// where their time is held until they have one.
// ⚠️ THE ARGUMENTS ARE SPRINT TOTALS. WHAT GETS WRITTEN IS A DELTA. (v3.24.0)
//
// Every caller passes the running totals for the current sprint, because that is
// what they have. But logOpenSprint() below may already have written part of this
// same sprint when the student hid the tab or switched books, so writing the
// totals again would file that stretch twice and inflate the very numbers this
// project spent Round 12 deflating. The watermark holds what has already been
// written; the difference is what is new.
//
// ⚠️ A ZERO OR NEGATIVE DELTA WRITES NOTHING AND IS NOT AN ERROR. It means the
// sprint has not advanced since the last record — a student hiding the tab twice
// in a row, or a rollback that moved `currentCharIndex` backwards.
// ⚠️ v3.36.0 — A TRUE GUEST'S SPRINTS ARE QUEUED, NOT DROPPED. The comment
// above said "a guest has no account for the record to belong to", which is
// true at this instant and stopped being a reason the moment session-log.js
// gained a per-owner store. They go into GUEST_QUEUE_UID's slot and are handed
// to the real account by retroactiveSaveGuestSession(). Dropping them left the
// day's total carrying minutes with no evidence behind them — which is exactly
// the shape of ROADMAP item 1's real case.
function logSession(seconds, chars, mistakes, wpm, accuracy, detailSuffix, dateOverride) {
    const uid = (currentUser && !currentUser.isAnonymous) ? currentUser.uid
              : (sessionExpired && lastKnownUid) ? lastKnownUid
              : GUEST_QUEUE_UID;

    const dSeconds  = Math.max(0, Math.round((seconds  || 0) - sprintLoggedSeconds));
    const dChars    = Math.max(0, Math.round((chars    || 0) - sprintLoggedChars));
    const dMistakes = Math.max(0, Math.round((mistakes || 0) - sprintLoggedMistakes));
    if (dSeconds <= 0 && dChars <= 0) return;   // nothing new to record

    const continuation = sprintLoggedSeconds > 0 || sprintLoggedChars > 0;
    // The floor still applies to a record that STARTS a unit; a continuation is
    // the rest of something already recorded and may legitimately be shorter.
    // See session-log.js v1.2.0.
    if (dSeconds < 5 && !continuation) return;

    // ⚠️ RECOMPUTE WPM AND ACCURACY FOR A CONTINUATION. The caller's figures
    // describe the whole sprint, and a per-run number on a per-delta record is a
    // lie of exactly the kind the 🚩 fast-run marker reads. For a first record
    // the delta IS the sprint, so the caller's values are used unchanged — they
    // come out of sanitizeSprintWPM() and carry clamping this function should not
    // second-guess.
    let outWPM = wpm, outAcc = accuracy;
    if (continuation) {
        const mins = dSeconds / 60;
        outWPM = sanitizeSprintWPM(mins > 0 ? Math.round((dChars / 5) / mins) : 0, dChars);
        const entries = dChars + dMistakes;
        outAcc = entries > 0 ? Math.round((dChars / entries) * 100) : 100;
    }

    sessionLogPush(uid, {
        // ⚠️ STAMPED NOW, NOT AT FLUSH TIME. The whole point of session-log.js.
        //
        // ⚠️ `dateOverride` IS FOR MIDNIGHT AND NOTHING ELSE. (v3.38.0) The tick
        // closes the open sprint on the OUTGOING day before it resets the day
        // counters, and at that instant getLocalDateStr() has already turned
        // over — so the one caller who knows these seconds belong to yesterday
        // has to say so. That is still "the caller dates the record", which is
        // this project's oldest rule; it is not the module guessing.
        // ⚠️ DO NOT PASS IT FROM ANYWHERE ELSE. Every other caller is logging
        // seconds that happened just now, and "just now" is getLocalDateStr().
        date: dateOverride || getLocalDateStr(),
        at: new Date().toISOString(),
        seconds: dSeconds, chars: dChars, mistakes: dMistakes,
        wpm: outWPM, accuracy: outAcc,
        source: 'library',
        label: currentBookId,
        detail: String(currentChapterNum) + (detailSuffix ? ' ' + detailSuffix : ''),
        ...(continuation ? { continuation: true } : {}),
    });

    // Advance the watermark to what the caller reported, not to what was written.
    // A refused sub-5-second first record must NOT advance it, or the seconds it
    // declined would never be written by anybody. That case returns above.
    sprintLoggedSeconds  = Math.max(sprintLoggedSeconds,  Math.round(seconds  || 0));
    sprintLoggedChars    = Math.max(sprintLoggedChars,    Math.round(chars    || 0));
    sprintLoggedMistakes = Math.max(sprintLoggedMistakes, Math.round(mistakes || 0));

    if (!currentUser || currentUser.isAnonymous) return;   // nothing else to do yet
    statsDocDirty = true;
    markDirty();
}

// ⚠️ UPLOAD QUEUED SESSION RECORDS NOW, WITHOUT A FULL FLUSH. (v3.25.0)
//
// THE DEFECT THIS FIXES, reported by Jake from live use: type 30 seconds, hit
// Home, open Reports — and the newest session is missing. Four sprints showed
// three. Every record eventually arrived, correctly and without duplication, one
// visit late.
//
// Cause: logOpenSprint() pushes to localStorage, and the QUEUE was only drained
// by a `final` flush. Hiding the tab produces a final flush only when the
// 60-second gap has elapsed, and clicking Home fired the pagehide handler, which
// wrote the queue and uploaded nothing. So the record sat, durable and invisible,
// until the next page's exit — which is exactly n-1.
//
// ⚠️ THIS IS NOT RATE-LIMITED AND DOES NOT NEED TO BE. It is self-limiting:
// records are removed from the queue as they land, so a student alt-tabbing eight
// times writes on the first hide and writes nothing on the other seven. The gap
// gate exists to protect typing_logs and the stats rollup from repeated writes;
// this touches neither.
//
// Best effort on navigation — the browser may not let an async write finish — and
// that is acceptable precisely because the queue is the safety net. Worst case is
// the behaviour Jake already observed: it arrives next time.
function flushSessionsNow() {
    if (!currentUser || currentUser.isAnonymous) return;
    if (sessionLogPending(currentUser.uid) === 0) return;
    sessionLogFlush(currentUser.uid, {
        email: currentUser.email || "",
        displayName: currentUser.displayName || "Anonymous",
        classId: ttbClassId || "",
        schoolId: ttbSchoolId || "",
    }).catch(e => console.warn('[sessions] immediate flush failed:', e));
}

// ⚠️ CLOSE THE OPEN SPRINT. (v3.24.0, DESIGN-TELEMETRY §7 step 1.5)
//
// Called when the page is going away or going to the background: tab switch,
// lid close, navigating to the library index or to School. The sprint is NOT
// ended — `sprintSeconds` and `sprintCharStart` are untouched, so if the student
// comes back and finishes the chapter, logSession() files only the remainder.
//
// This is the whole fix for the students who switch books every few sentences.
// Their time was always in the counters; now it is in the session history too.
function logOpenSprint(reason, dateOverride) {
    if (!isGameActive && sprintSeconds <= 0) return;
    const charsTyped = currentCharIndex - sprintCharStart;
    const sprintMinutes = sprintSeconds / 60;
    const sprintWPM = sanitizeSprintWPM(
        (sprintMinutes > 0) ? Math.round((charsTyped / 5) / sprintMinutes) : 0, charsTyped);
    const entries = charsTyped + sprintMistakes;
    const sprintAcc = (entries > 0) ? Math.round((charsTyped / entries) * 100) : 100;
    logSession(sprintSeconds, charsTyped, sprintMistakes, sprintWPM, sprintAcc,
               reason ? '(' + reason + ')' : '(interrupted)', dateOverride);
}

// carryGuestDaysToTheirOwnDocuments() — THE OVERNIGHT RESCUE  (v3.37.0)
//
// ⚠️ JAKE'S RULING, 2026-08-20: a child who typed as a guest, lost their
// connection, and did not sign in until the next day keeps those minutes —
// credited to the day they typed them, not to today. The design argument, and
// the objection it overturns, are in daylog.js's own header block. Read that
// before changing anything here; this function is only the plumbing.
//
// ⚠️ ONE READ AND ONE WRITE PER PRIOR DAY, AND THE READ IS LOAD-BEARING. The
// per-source field is absolute, not a Firestore increment, so the stored value
// has to be read to be added to. That is a read-modify-write, and it is safe
// here for one specific reason and no other: after the cutover this page is the
// ONLY writer of the Library triple, so nothing can land between the read and
// the write. daylog.js refuses a pre-cutover date outright for exactly this
// reason — before the cutover the target is the SHARED flat triple, and this
// same code against that field is §3.1 wearing a helpful expression.
//
// ⚠️ IT CANNOT CREATE A DAY OUT OF NOTHING BUT IT CAN CREATE A DOCUMENT. A day
// on which a child only ever typed as a guest has no `typing_logs` document at
// all. merge:true creates it, and firestore.rules v2.6.0 puts the
// `resource == null` clause FIRST on `typing_logs` precisely so a first write
// is allowed — that was Round 22's fix and this is the second caller to depend
// on it.
//
// ⚠️ IF THE WRITE FAILS THE RECORDS ARE STILL GONE FROM THE GUEST SLOT. They
// are not lost — they were adopted into the account's queue and reach
// `typing_sessions` — but that day's TOTAL will not have them, which is the
// "record without a total" divergence inverted. It is logged loudly rather than
// retried: a retry needs durable state about what has already been credited,
// and inventing one is how a rescue becomes a double-credit. Under-crediting is
// the direction to fail in. Same ruling as sessionLogTake()'s.
async function carryGuestDaysToTheirOwnDocuments(user, carry) {
    for (const g of carry) {
        try {
            const ref = doc(db, "typing_logs", `${user.uid}_${g.date}`);
            const snap = await getDoc(ref);
            const stored = sourceTotalsOf(snap.exists() ? snap.data() : {})[g.source];

            const payload = carryOverPayloadFor(g.source, g.date, {
                stored,
                add: { seconds: g.seconds, chars: g.chars, mistakes: g.mistakes },
            });

            await setDoc(ref, {
                uid: user.uid,
                email: user.email || "",
                displayName: user.displayName || "Anonymous",
                classId: ttbClassId || "",
                schoolId: ttbSchoolId || "",
                date: g.date,
                ...payload,
                lastUpdated: new Date()
            }, { merge: true });

            console.log(`Rescued ${g.seconds}s of guest ${g.source} typing onto ${g.date} ` +
                        `(${g.records.length} sprint record(s)).`);
        } catch (e) {
            // ⚠️ NAMES THE DAY AND THE SECONDS. If a teacher ever asks why a
            // drill-down row exists on a day whose total does not include it,
            // this line is the answer, and it needs to be greppable.
            console.warn(`Guest carry-over FAILED for ${g.date} ${g.source} ` +
                         `(${g.seconds}s, ${g.chars} chars):`, e);
        }
    }
}

// Shown when a token expires mid-session. Deliberately NOT the guest ladder:
// it names what happened, it does not claim their work is unsaved, and the
// button re-authenticates rather than "signing up".
function showReauthPrompt() {
    if (isModalOpen) return;          // never stack on a live modal
    isGameActive = false;
    clearInterval(timerInterval);
    isModalOpen = true; isInputBlocked = true;
    modalActionCallback = null;
    setModalTitle('');
    resetModalFooter();

    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:center;">
            <div class="stats-title">Please sign in again</div>
            <div style="font-size:0.95em; color:#555; margin: 8px 0;">
                Your sign-in expired, which happens about once a day. Your typing is
                still here &mdash; it just can't save until you sign back in.
            </div>
            <div style="font-size:0.85em; color:#888; margin-top:6px;">Use your school Google account.</div>
        </div>
    `;

    modalActionCallback = async () => {
        try {
            // ⚠️ SAME FLAG THE GUEST PATH USES. It stops onAuthStateChanged
            // running its full reload underneath us while the merge below is
            // still deciding what the counters should be.
            anonLoginInProgress = true;
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (e) {
            anonLoginInProgress = false;
            return;   // leave the prompt up; they can try again
        }
        try {
            if (currentUser && !currentUser.isAnonymous) {
                // ⚠️ v3.36.0 — WAS AN INLINE COPY OF THE MERGE. There were two
                // of them and the auth handler had neither, which is how the
                // header Sign In button came to lose a guest's minutes while
                // this modal kept them. One function now; see its header.
                await retroactiveSaveGuestSession(currentUser);
                updateTimerUI();
            }
        } catch (e) {
            console.warn('Re-auth merge failed:', e);
        } finally {
            anonLoginInProgress = false;
        }
        closeModal();
        showStartModal("Continue");
    };

    const btn = document.getElementById('action-btn');
    btn.innerText = 'Sign In Again';
    btn.onclick = modalActionCallback;
    btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
    // ⚠️ resetModalFooter() above replaced the footer's innerHTML, so the button
    // queried before that line is a detached node. Bind AFTER the last write to
    // the container. (Invariant 64, "innerHTML += destroys listeners" — same
    // shape, different panel.)
    showModalPanel();
}

// ⚠️ "The session really is over" WAS NOT TRUE. visibilitychange:hidden fires on
// every tab switch, every lid close, every app background — not just at the end
// of a period. A student bouncing to Google Classroom and back eight times fired
// eight full `final` flushes, each worth up to four Firestore writes plus a
// leaderboard write, and (before the guard above) each one racing the others.
//
// The localStorage WAL write is what actually protects the student's work, and
// it is free, so it still happens on EVERY hide. The Firestore flush is
// rate-limited to once a minute. Nothing in it is time-critical: the WAL is the
// durable copy, walRecover() replays it, and typing_logs is a merge so a teacher
// refreshing a report mid-period never sees a torn value.
const HIDDEN_FLUSH_MIN_GAP_MS = 60000;
// v3.21.0 — the delta that overrides the gap, and ⚠️ IT IS DELIBERATELY DULL.
//
// The 60-second gap is right for what it was built for and blind to the case it
// could not see: a tab going away for good with minutes of un-flushed typing
// behind it. From here, hidden-because-alt-tab and hidden-because-closing are
// indistinguishable, so the gap governs how OFTEN we flush and the delta
// governs WHETHER we flush at all.
//
// ⚠️ THIS WAS 45 SECONDS AND A `final` FLUSH IN THE FIRST DRAFT, AND THAT WAS A
// COST BUG WAITING FOR THE WRONG CLASSROOM. A `final` flush writes two to three
// documents; at a 45-second threshold, a student alt-tabbing constantly for a
// 35-minute block could trip it 46 times. Modelled across the SCALE-PLAN
// population that is ~$85/year — the same order as the cover-egress line that
// document calls the largest in the system. Not a forecast, but not a number to
// leave lying in a constant either.
//
// Two changes make it cheap:
//
//   1. 120 seconds, not 45. The 5-minute interval flush already caps exposure;
//      this only narrows the worst case from 5 minutes to 2.
//   2. NOT `final`. A non-final flush writes `typing_logs` — which since
//      v3.31.0 is the ONLY document holding these numbers, for the student and
//      the teacher alike — and skips the session-rollup upload, which is the
//      expensive part. (Before v3.31.0 this bullet also talked about skipping a
//      `stats/time_tracking` write; that document no longer exists. HANDOFF §0.0.)
//
// ⚠️ AND BE CLEAR ABOUT WHAT IS LEFT TO BUY. Once stats-wal.js exists, unflushed
// time is no longer LOST — it replays on the next load of either page. All this
// gate purchases is that a teacher refreshing a report mid-period sees numbers
// from two minutes ago instead of five. That is worth ~$1/year. It would not
// have been worth $85.
const HIDDEN_FLUSH_DELTA_SECONDS = 120;
let lastHiddenFlush = 0;
// What secondsToday was when a flush last actually reached Firestore. Set on
// success only — a failed flush must not tell the next hide the work is safe.
let lastFlushedSecondsToday = 0;

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // ⚠️ FIRST, AND UNCONDITIONALLY. (v3.24.0) This is a localStorage write
        // inside session-log.js, so it costs nothing, needs no network and needs
        // no live token — and it is the only chance to record a sprint the
        // student is walking away from. It is NOT rate-limited by the gap below:
        // the gap exists to protect Firestore from repeated alt-tabs, and this
        // writes no Firestore document. Deltas make repeat calls harmless.
        logOpenSprint('hidden');
        flushSessionsNow();               // v3.25.0 — see that function's header
        walSave();                        // free, synchronous, always
        const gapElapsed = Date.now() - lastHiddenFlush >= HIDDEN_FLUSH_MIN_GAP_MS;
        const unflushed  = (statsData.secondsToday || 0) - lastFlushedSecondsToday;
        if (gapElapsed || unflushed >= HIDDEN_FLUSH_DELTA_SECONDS) {
            lastHiddenFlush = Date.now();
            // Only the gap-driven flush is `final`. The delta-driven one is the
            // cheap top-up described above.
            if (gapElapsed) flushLeaderboard();
            flushAll('hidden', gapElapsed);
        }
    }
});

// ⚠️ pagehide IS THE NAVIGATION CASE, and it is not redundant with the handler
// above. Chrome fires visibilitychange:hidden on most navigations but the spec
// does not require it, and this file's own history says beforeunload cannot be
// relied on Chromebooks. A student clicking through to the library index or to
// School is the single most common way a sprint gets abandoned mid-way, so it
// gets a listener of its own. Double-firing is safe: the second call sees a zero
// delta and writes nothing.
window.addEventListener('pagehide', () => {
    logOpenSprint('left page');
    walSave();
    // ⚠️ AFTER walSave(), because that one is synchronous and cannot be cut off.
    // This is the click-Home case that showed n-1 sessions in Reports.
    flushSessionsNow();
});

function formatTime(seconds) {
    if (!seconds) return "0m 0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

// Sanity-clamp a computed sprint WPM before it can reach sprintHistory or the
// leaderboard. Position warps with stale sprint state have produced absurd
// values (268,848 WPM was live on the board); no human types over ~300.
// Negative charsTyped (rollback/warp artifacts) also lands here.
function sanitizeSprintWPM(wpm, charsTyped) {
    if (!isFinite(wpm) || charsTyped < 0 || wpm < 0) return 0;
    if (wpm > 300) {
        console.warn(`Implausible sprint WPM ${wpm} (chars=${charsTyped}) — recording 0.`);
        return 0;
    }
    return wpm;
}

function calculateAverageWPM(chars, seconds) {
    if(!seconds || seconds <= 0) return 0;
    const mins = seconds / 60;
    return Math.round((chars / 5) / mins);
}

function calculateAverageAcc(chars, mistakes) {
    if(!chars || chars <= 0) return 100;
    const total = chars + mistakes;
    if(total === 0) return 100;
    return Math.round((chars / total) * 100);
}

async function pauseGameForBreak() {
    isGameActive = false; clearInterval(timerInterval); saveProgress();
    const charsTyped = currentCharIndex - sprintCharStart;
    const sprintMinutes = sprintSeconds / 60;
    const sprintWPM = sanitizeSprintWPM(
        (sprintMinutes > 0) ? Math.round((charsTyped / 5) / sprintMinutes) : 0, charsTyped);
    const sprintTotalEntries = charsTyped + sprintMistakes;
    const sprintAcc = (sprintTotalEntries > 0) ? Math.round((charsTyped / sprintTotalEntries) * 100) : 100;

    // Log this session
    logSession(sprintSeconds, charsTyped, sprintMistakes, sprintWPM, sprintAcc);

    // Accumulate typing time for practice unlock
    practiceTypingAccumulator += sprintSeconds;

    // Track guest usage. anonSprintCount went with the old ladder — it was the
    // "2 sprints" half of a trigger that no longer exists, and keeping an
    // incrementing counter nobody reads is how lastSavedIndex got to eighteen
    // assignments and two reads.
    anonTotalSeconds += sprintSeconds;

    // Record sprint in history
    sprintHistory.push({ wpm: sprintWPM, acc: sprintAcc, time: sprintSeconds });

    // Update leaderboard and get placements
    const placements = await updateLeaderboard();

    // ─── Guest login ladder: this is the boundary the tick was waiting for ───
    // ⚠️ anonTotalSeconds ALREADY includes this sprint (twelve lines up) and
    // sprintSeconds is not zeroed until startGame(), so the live total here is
    // anonTotalSeconds ALONE. Adding sprintSeconds would count it twice and
    // move the 5-minute rung to roughly 4:30 for a 30-second sprint.
    const anonDue = anonNudgePending || anonNudgeDue(anonTotalSeconds);
    anonNudgePending = 0;
    if (anonDue) {
        showAnonLoginPrompt(anonDue);
        return;
    }

    const todayWPM = calculateAverageWPM(statsData.charsToday, statsData.secondsToday);
    const todayAcc = calculateAverageAcc(statsData.charsToday, statsData.mistakesToday);
    const weekWPM = calculateAverageWPM(statsData.charsWeek, statsData.secondsWeek);
    const weekAcc = calculateAverageAcc(statsData.charsWeek, statsData.mistakesWeek);

    const stats = {
        time: sprintSeconds, wpm: sprintWPM, acc: sprintAcc,
        today: `${formatTime(statsData.secondsToday)} (${todayWPM} WPM | ${todayAcc}%)`,
        week: `${formatTime(statsData.secondsWeek)} (${weekWPM} WPM | ${weekAcc}%)`,
        placements: placements || []
    };

    let title = "Sprint Complete";
    if (dailyGoalCelebrated && goals.dailySeconds > 0 && statsData.secondsToday - sprintSeconds < goals.dailySeconds) {
        title = "🎉 Daily Goal Reached!";
    }
    if (weeklyGoalCelebrated && goals.weeklySeconds > 0 && statsData.secondsWeek - sprintSeconds < goals.weeklySeconds) {
        title = "🎆 Weekly Goal Reached!";
    }

    showStatsModal(title, stats, "Continue", startGame);
}

function getMissedCharsHTML() {
    const entries = Object.entries(missedCharsMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
    if (entries.length === 0) return '';
    const pills = entries.map(([ch, count]) => 
        `<span style="display:inline-block; background:#fff0f0; border:1px solid #ffcccc; border-radius:3px; padding:1px 6px; margin:0 2px; font-weight:bold; color:#D32F2F;">${ch} <small style="color:#999;">×${count}</small></span>`
    ).join('');
    const canPractice = currentUser && !currentUser.isAnonymous && !isPracticeMode;
    // ⚠️ THE VARIETY FLOOR (v3.27.1) — see its definition above. Checked BEFORE
    // the time-based readiness gate, and on a miss it shows NEITHER the button
    // NOR the "unlocks after..." countdown: that countdown was true only of the
    // time gate, and showing it while the variety gate is still unmet would
    // read as "keep typing and it'll unlock," which isn't the whole truth and
    // isn't something to spell out — the fix is missing fewer, different
    // letters, not typing more.
    const hasVariety = _qualifyingPracticeChars().length >= PRACTICE_MIN_QUALIFYING_CHARS;
    const practiceThreshold = hasDonePractice ? PRACTICE_COOLDOWN : PRACTICE_FIRST_UNLOCK;
    const practiceReady = practiceTypingAccumulator >= practiceThreshold;
    const outOfPractice = (practiceRemainingToday !== null && practiceRemainingToday <= 0);
    let practiceBtn = '';
    if (canPractice && hasVariety && outOfPractice) {
        // Known-exhausted. Saying so here beats letting them click, wait, and
        // read an error — and "comes back tomorrow" is the bit that matters.
        practiceBtn = ` <span style="font-size:0.85em; color:#aaa;">\u2728 Practice comes back tomorrow</span>`;
    } else if (canPractice && hasVariety && practiceReady) {
        practiceBtn = ` <button id="practice-btn" class="practice-btn" title="AI-generated practice focusing on your weak spots">\u2728 Practice</button>`;
    } else if (canPractice && hasVariety && !practiceReady) {
        // The counter only advances while keys are being pressed, so "keep
        // typing" is literally the instruction — the old wording implied waiting
        // would do it. Seconds below a minute, because ceil() turned 5 seconds
        // into "~1m" and made the app look like it was stalling.
        const left = Math.max(1, Math.round(practiceThreshold - practiceTypingAccumulator));
        const pretty = left >= 60 ? `~${Math.ceil(left / 60)} more min` : `${left} more sec`;
        practiceBtn = ` <span style="font-size:0.85em; color:#aaa;" title="The timer only counts while you're typing">\u2728 Practice unlocks after ${pretty} of typing</span>`;
    }
    return `<div style="font-size:0.8em; color:#888; margin:4px 0;">Watch out for: ${pills}${practiceBtn}</div>`;
}

function getPracticeSummaryHTML() {
    if (!practiceText || practiceProblemChars.length === 0) return '';

    // Compute practice-only misses by diffing with snapshot
    const practiceMisses = {};
    Object.entries(missedCharsMap).forEach(([ch, count]) => {
        const prev = practiceMissedSnapshot[ch] || 0;
        if (count > prev) practiceMisses[ch] = count - prev;
    });

    // Count occurrences of each focus char in practice text (case-insensitive)
    const results = practiceProblemChars.map(ch => {
        const lower = ch.toLowerCase();
        const upper = ch.toUpperCase();
        const displayCh = ch === 'Space' ? ' ' : ch === 'Enter' ? '\n' : ch;
        let total = 0;
        for (let i = 0; i < practiceText.length; i++) {
            const c = practiceText[i];
            if (c === displayCh || c === lower || c === upper) total++;
        }
        const missed = practiceMisses[ch] || 0;
        const hit = Math.max(0, total - missed);
        const acc = total > 0 ? Math.round((hit / total) * 100) : 100;
        return { ch, total, hit, missed, acc };
    }).filter(r => r.total > 0).slice(0, 5);

    if (results.length === 0) return '';

    // Grade each character
    const gradeChar = (acc) => {
        if (acc === 100) return { emoji: '⭐', color: '#FFD700', label: 'Perfect!' };
        if (acc >= 90) return { emoji: '🔥', color: '#FF6600', label: 'Great' };
        if (acc >= 75) return { emoji: '👍', color: '#43A047', label: 'Good' };
        if (acc >= 50) return { emoji: '💪', color: '#1E88E5', label: 'Keep at it' };
        return { emoji: '🎯', color: '#E53935', label: 'Needs work' };
    };

    // Overall practice grade
    const totalAll = results.reduce((s, r) => s + r.total, 0);
    const hitAll = results.reduce((s, r) => s + r.hit, 0);
    const overallAcc = totalAll > 0 ? Math.round((hitAll / totalAll) * 100) : 100;
    const overall = gradeChar(overallAcc);

    const rows = results.map(r => {
        const g = gradeChar(r.acc);
        const display = r.ch === 'Space' ? '␣' : r.ch;
        return `<div style="display:flex; align-items:center; gap:6px; padding:3px 0;">
            <span style="font-weight:bold; font-size:1.1em; width:24px; text-align:center; color:#333;">${escapeHtml(display)}</span>
            <div style="flex:1; height:14px; background:#eee; border-radius:7px; overflow:hidden;">
                <div style="height:100%; width:${r.acc}%; background:${g.color}; border-radius:7px; transition:width 0.3s;"></div>
            </div>
            <span style="font-size:0.85em; min-width:42px; text-align:right; color:${g.color}; font-weight:bold;">${r.acc}%</span>
            <span style="font-size:0.8em;">${g.emoji}</span>
        </div>`;
    }).join('');

    return `<div style="width:100%;">
        <div style="text-align:center; font-size:0.85em; margin-bottom:6px;">
            <div style="font-weight:bold;">Focus Characters</div>
            <div style="color:${overall.color}; font-weight:bold;">${overall.emoji} ${overallAcc}% ${overall.label}</div>
        </div>
        ${rows}
    </div>`;
}

function getPlacementsHTML(placements) {
    if (!placements || placements.length === 0) return '';
    const rows = placements.map(p => {
        let trophy, color;
        if (p.rank === 1) { trophy = '🥇'; color = '#FFD700'; }
        else if (p.rank === 2) { trophy = '🥈'; color = '#C0C0C0'; }
        else if (p.rank === 3) { trophy = '🥉'; color = '#CD7F32'; }
        else { trophy = '🏆'; color = '#4B9CD3'; }
        const catName = p.category.label.split(' ').slice(1).join(' ') || p.category.label;
        return `<div class="trophy-row"><span class="trophy-icon">${trophy}</span><span class="trophy-label" style="color:${color};">#${p.rank} ${catName}</span></div>`;
    }).join('');
    return `<div class="trophy-panel"><div class="trophy-header">🏆</div>${rows}</div>`;
}

function getSprintHistoryHTML() {
    if (sprintHistory.length <= 1) return '';
    const rows = sprintHistory.map((s, i) => {
        const label = i === sprintHistory.length - 1 ? '<b>→</b>' : `${i + 1}`;
        return `<span style="color:#999;">${label}</span> ${s.wpm}<small>wpm</small> ${s.acc}<small>%</small>`;
    }).join(' · ');
    return `<div style="font-size:0.75em; color:#777; margin:4px 0; line-height:1.6;">Sprints: ${rows}</div>`;
}

async function finishChapter() {
    isGameActive = false; clearInterval(timerInterval);
    chapterCompleteAt = Date.now();   // start the any-key grace period
    _ttbEmit('complete', { chapter: currentChapterNum });

    // Practice mode: log session and offer to return
    if (isPracticeMode) {
        const charsTyped = currentCharIndex - sprintCharStart;
        const sprintMinutes = sprintSeconds / 60;
        const sprintWPM = sanitizeSprintWPM(
        (sprintMinutes > 0) ? Math.round((charsTyped / 5) / sprintMinutes) : 0, charsTyped);
        const sprintTotalEntries = charsTyped + sprintMistakes;
        const sprintAcc = (sprintTotalEntries > 0) ? Math.round((charsTyped / sprintTotalEntries) * 100) : 100;
        logSession(sprintSeconds, charsTyped, sprintMistakes, sprintWPM, sprintAcc);
        await logPracticeSession(sprintWPM, sprintAcc, sprintSeconds, charsTyped, sprintMistakes);

        const todayWPM = calculateAverageWPM(statsData.charsToday, statsData.secondsToday);
        const todayAcc = calculateAverageAcc(statsData.charsToday, statsData.mistakesToday);
        const weekWPM = calculateAverageWPM(statsData.charsWeek, statsData.secondsWeek);
        const weekAcc = calculateAverageAcc(statsData.charsWeek, statsData.mistakesWeek);

        // Build practice-specific summary
        const summaryHTML = getPracticeSummaryHTML();

        isModalOpen = true; isInputBlocked = false;
        setModalTitle('');
        document.getElementById('modal-body').innerHTML = `
            <div style="display:flex; gap:0; align-items:stretch;">
                ${summaryHTML ? `<div style="flex:0 0 auto; min-width:180px; max-width:200px;"></div>` : ''}
                <div style="flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center;">
                    <div class="stats-title">✨ Practice Complete!</div>
                    <div class="stats-inline">
                        <span class="si-val">${sprintWPM} <small>WPM</small></span>
                        <span class="si-dot">·</span>
                        <span class="si-val">${sprintAcc}% <small>Acc</small></span>
                        <span class="si-dot">·</span>
                        <span class="si-val">${formatTime(sprintSeconds)}</span>
                    </div>
                    <div class="cumulative-row">
                        <span>Today: ${formatTime(statsData.secondsToday)} (${todayWPM} WPM | ${todayAcc}%)</span>
                        <span>Week: ${formatTime(statsData.secondsWeek)} (${weekWPM} WPM | ${weekAcc}%)</span>
                    </div>
                    <div class="start-hint" style="margin-top:6px;">Press Enter to return</div>
                </div>
                ${summaryHTML ? `<div style="flex:0 0 auto; min-width:180px; max-width:200px; border-left:1px solid #eee; padding-left:12px; display:flex; align-items:center;">${summaryHTML}</div>` : ''}
            </div>
        `;
        resetModalFooter();
        const btn = document.getElementById('action-btn');
        btn.innerText = '📖 Return to Book'; btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
        btn.onclick = () => { closeModal(); exitPracticeMode(); };
        modalActionCallback = () => { closeModal(); exitPracticeMode(); };
        showModalPanel();
        return;
    }

    let nextChapterId = null;
    let nextChapterTitle = "";
    // ⚠️ WALKS THE BODY LIST, NOT THE SPINE (v3.12.0). v3.11.0 filtered the chapter
    // PICKER and left auto-advance walking the full list, which is worse than not
    // filtering at all: a student finishing the last chapter of a Standard Ebook was
    // offered the colophon as "next", then the uncopyright page. The picker said
    // those were not chapters and the Continue button then handed one over.
    {
        const list = bodyChapterList();
        const currentIdx = list.findIndex(c => chapterKey(c.id) === chapterKey(currentChapterNum));
        if (currentIdx !== -1 && currentIdx + 1 < list.length) {
            const nextChap = list[currentIdx + 1];
            nextChapterId = nextChap.id.replace("chapter_", "");
            nextChapterTitle = nextChap.title || "";
        }
    }

    // ⚠️ NO INVENTED NEXT CHAPTER (v3.12.0). This used to do
    // parseFloat(currentChapterNum) + 1, so finishing Augie's chapter 19 offered
    // "Ch. 20" — which does not exist — and finishing Heidi's "1.14" offered
    // "2.14", also nonexistent, while "1.01" would have offered "2.01": a real
    // chapter in the WRONG PART. nextChapterId now stays null, and null has a
    // meaning: there is no next body chapter, so the book is FINISHED. Handled
    // below, once the stats for this chapter exist to show alongside it.

    const charsTyped = currentCharIndex - sprintCharStart;
    const sprintMinutes = sprintSeconds / 60;
    const sprintWPM = sanitizeSprintWPM(
        (sprintMinutes > 0) ? Math.round((charsTyped / 5) / sprintMinutes) : 0, charsTyped);
    const sprintTotalEntries = charsTyped + sprintMistakes;
    const sprintAcc = (sprintTotalEntries > 0) ? Math.round((charsTyped / sprintTotalEntries) * 100) : 100;

    // Log this session
    logSession(sprintSeconds, charsTyped, sprintMistakes, sprintWPM, sprintAcc);

    // Accumulate typing time for practice unlock
    practiceTypingAccumulator += sprintSeconds;

    const todayWPM = calculateAverageWPM(statsData.charsToday, statsData.secondsToday);
    const todayAcc = calculateAverageAcc(statsData.charsToday, statsData.mistakesToday);
    const weekWPM = calculateAverageWPM(statsData.charsWeek, statsData.secondsWeek);
    const weekAcc = calculateAverageAcc(statsData.charsWeek, statsData.mistakesWeek);

    let title = `📖 Chapter ${currentChapterNum} Complete!`;

    // Mark chapter as completed
    completedChapters.add(String(currentChapterNum));
    saveCompletedChapters();
    const placements = await updateLeaderboard();

    const stats = {
        time: sprintSeconds, wpm: sprintWPM, acc: sprintAcc,
        today: `${formatTime(statsData.secondsToday)} (${todayWPM} WPM | ${todayAcc}%)`,
        week: `${formatTime(statsData.secondsWeek)} (${weekWPM} WPM | ${weekAcc}%)`,
        placements: placements || []
    };
    if (dailyGoalCelebrated && goals.dailySeconds > 0 && statsData.secondsToday - sprintSeconds < goals.dailySeconds) {
        title = `🎉 Chapter ${currentChapterNum} Complete + Daily Goal!`;
    }
    if (weeklyGoalCelebrated && goals.weeklySeconds > 0 && statsData.secondsWeek - sprintSeconds < goals.weeklySeconds) {
        title = `🎆 Chapter ${currentChapterNum} Complete + Weekly Goal!`;
    }

    // ─── THE BOOK IS FINISHED (v3.12.0) ──────────────────────────────────────
    //
    // No next BODY chapter. This is the completion moment bodyChapters was written
    // for back in admin.js v3.18.x and which never had a consumer — because the old
    // code invented a chapter number instead of noticing, so a student who finished
    // a book was offered a chapter that did not exist and got an error rather than a
    // congratulation.
    //
    // Judged on the BODY list, so an appendix, endnotes, a colophon or an
    // uncopyright page no longer stand between a kid and the end of the story.
    if (!nextChapterId) {
        // The book is over. Say so loudly, name it, and put the credits one click
        // away — which is also the honest place for them: a reader who has just
        // typed every word of a book is exactly who should see who made it.
        //
        // index.html opens the About panel when it sees #about=<bookId>, so this is
        // a link rather than a duplicate renderer.
        const bookName = (bookMetadata && bookMetadata.title) ? bookMetadata.title : 'this book';
        // Styled inline rather than in style.css on purpose: this is the only place
        // it is used, and a rule in a shared stylesheet is a rule someone has to
        // find later. If it ever gets reused, move it.
        const extra =
            '<div style="margin:14px 0 4px; padding:14px 16px; border-radius:8px; ' +
                 'background:linear-gradient(135deg, rgba(196,158,86,0.16), rgba(196,158,86,0.05)); ' +
                 'border:1px solid rgba(196,158,86,0.45); text-align:center;">' +
              '<div style="font-size:1.05rem; font-weight:700; letter-spacing:0.01em;">' +
                 '\u2728 You finished ' + escapeHtmlG(bookName) + ' \u2728</div>' +
              '<div style="font-size:0.8rem; opacity:0.75; margin-top:3px;">' +
                 'Every chapter, every word.</div>' +
              '<a href="index.html#about=' + encodeURIComponent(currentBookId) + '" ' +
                 'style="display:inline-block; margin-top:9px; font-size:0.78rem; ' +
                 'color:var(--carolina-blue); text-decoration:underline;">' +
                 '\u2139 Who made this book</a>' +
            '</div>';
        showStatsModal(
            title, stats, 'Back to the library',
            async () => { window.location.href = 'index.html'; },
            '', true, extra);
        // Classic gets the credits in the text area. Adventure gets the same event
        // and will scroll its own version over the canvas — the renderer owns that
        // surface and already animates, so duplicating it in the DOM would fight it.
        if (VIEW_MODE !== 'adventure') renderClassicCredits();
        _ttbEmit('bookComplete', {
            bookId:     currentBookId,
            title:      bookMetadata ? bookMetadata.title : '',
            author:     bookMetadata ? bookMetadata.author : '',
            source:     bookMetadata ? bookMetadata.source : '',
            rights:     bookMetadata ? bookMetadata.rights : '',
            cleanedBy:  bookMetadata ? bookMetadata.cleanedBy : '',
            chapters:   bodyChapterList().length
        });
        return;
    }

    // Format the next chapter label for the button
    let nextLabel = `Ch. ${nextChapterId}`;
    if (nextChapterTitle && nextChapterTitle != nextChapterId) {
        if (nextChapterTitle.toLowerCase().startsWith('chapter')) nextLabel = nextChapterTitle;
        else nextLabel = `Ch. ${nextChapterId}: ${nextChapterTitle}`;
    }

    showStatsModal(title, stats, `Next → ${nextLabel}`, async () => {
        advanceToNextChapter();
    }, 'Press Enter to continue', true);
}

async function advanceToNextChapter() {
    let nextChapterId = null;
    {
        const list = bodyChapterList();
        const currentIdx = list.findIndex(c => chapterKey(c.id) === chapterKey(currentChapterNum));
        if (currentIdx !== -1 && currentIdx + 1 < list.length) {
            nextChapterId = list[currentIdx + 1].id.replace("chapter_", "");
        }
    }
    if (!nextChapterId) {
        // ⚠️ NO parseFloat ARITHMETIC (v3.12.0). This fallback used to do
        // parseFloat(currentChapterNum) + 1, so on Heidi chapter "1.14" it asked for
        // "2.14" — a chapter that does not exist — and on "1.01" it asked for "2.01",
        // which does, and is in the WRONG PART. Fifth appearance of arithmetic-on-an-id
        // in this project. If the chapter is not in the body list there is no next
        // chapter, and saying so is better than guessing at one.
        //
        // First chapter of the body list is the only sane recovery: it is a real
        // id that definitely exists, whereas "1" was an assumption about numbering
        // that a part-numbered book breaks.
        const list = bodyChapterList();
        if (!list.length) return;
        nextChapterId = String(list[0].id).replace("chapter_", "");
    }
    // Advance state first, then flush ONCE. This used to flush the old position
    // and then immediately write the new chapter — two billable writes for one
    // navigation. completedChapters and furthest-position both ride along.
    currentChapterNum = nextChapterId;
    savedCharIndex = 0; currentCharIndex = 0;
    await saveProgress(true);
    autoStartNext = true;
    loadChapter(nextChapterId);
}

function getHeaderHTML() {
    if (isPracticeMode) {
        updateBookInfoBar('✨ Practice Mode', 'AI-Generated Exercise');
        return `<div class="modal-header-compact"><span class="mh-book">✨ Practice Mode</span> <span class="mh-sep">—</span> <span class="mh-chap">Targeted Exercise</span></div>`;
    }
    let bookTitle = (bookMetadata && bookMetadata.title) ? escapeHtml(bookMetadata.title) : escapeHtml(currentBookId.replace(/_/g, ' '));

    let displayChapTitle = `Ch. ${escapeHtml(String(currentChapterNum))}`;

    if (bookMetadata && bookMetadata.chapters) {
        const c = bookMetadata.chapters.find(ch => ch.id == "chapter_" + currentChapterNum);
        if (c && c.title) {
            if(c.title != currentChapterNum) {
                if(c.title.toLowerCase().startsWith('chapter')) {
                    displayChapTitle = escapeHtml(c.title);
                } else {
                    displayChapTitle = `Ch. ${escapeHtml(String(currentChapterNum))}: ${escapeHtml(c.title)}`;
                }
            }
        }
    }

    updateBookInfoBar(bookTitle, displayChapTitle);
    return `<div class="modal-header-compact"><span class="mh-book">${bookTitle}</span> <span class="mh-sep">—</span> <span class="mh-chap">${displayChapTitle}</span></div>`;
}

function updateBookInfoBar(bookTitle, chapTitle) {
    const bar = document.getElementById('book-info-bar');
    if (!bar) return;
    if (!bookTitle) { bar.innerHTML = ''; return; }
    bar.innerHTML = `<span class="bib-title">${bookTitle}</span><span class="bib-sep">—</span><span class="bib-chap">${chapTitle || ''}</span>`;
}

function showStartModal(btnText) {
    isModalOpen = true; isInputBlocked = false;
    modalActionCallback = startGame;
    setModalTitle('');
    resetModalFooter();

    const todayWPM = calculateAverageWPM(statsData.charsToday, statsData.secondsToday);
    const todayAcc = calculateAverageAcc(statsData.charsToday, statsData.mistakesToday);
    const weekWPM = calculateAverageWPM(statsData.charsWeek, statsData.secondsWeek);
    const weekAcc = calculateAverageAcc(statsData.charsWeek, statsData.mistakesWeek);

    const hasStats = statsData.secondsToday > 0 || statsData.secondsWeek > 0;
    const statsSection = hasStats ? `
        <div class="cumulative-row">
            <span>Today: ${formatTime(statsData.secondsToday)} (${todayWPM} WPM | ${todayAcc}%)</span>
            <span>Week: ${formatTime(statsData.secondsWeek)} (${weekWPM} WPM | ${weekAcc}%)</span>
        </div>
        ${getGoalProgressHTML()}
    ` : (goals.dailySeconds > 0 || goals.weeklySeconds > 0) ? getGoalProgressHTML() : '';

    // Check if furthest point is ahead — offer jump link
    let jumpHtml = '';
    if (currentUser && !currentUser.isAnonymous && 
        isPositionAhead(furthestChapter, furthestCharIndex, currentChapterNum, currentCharIndex)) {
        let chapLabel = `Ch. ${furthestChapter}`;
        if (bookMetadata && bookMetadata.chapters) {
            const chap = bookMetadata.chapters.find(c => c.id === "chapter_" + furthestChapter);
            if (chap && chap.title && chap.title != furthestChapter) {
                if (chap.title.toLowerCase().startsWith('chapter')) chapLabel = chap.title;
                else chapLabel = `Ch. ${furthestChapter}: ${chap.title}`;
            }
        }
        jumpHtml = `<div style="margin:4px 0;"><a href="#" id="jump-furthest" style="color:var(--carolina-blue); font-size:0.85em;">📚 Jump to furthest point (${escapeHtml(chapLabel)})</a></div>`;
    }

    // ⚠️ TELL THEM. A bookmark that moved on its own is exactly the kind of thing
    // a student reads as "the computer lost my place" and a teacher hears about
    // third-hand. One line, no dismissal needed, and it is absent on every
    // ordinary load because reanchorNotice is cleared on each reconcile.
    const noticeHtml = reanchorNotice
        ? `<div style="margin:4px 0; font-size:0.85em; color:var(--carolina-blue);">📘 ${escapeHtml(reanchorNotice)}</div>`
        : '';

    // ⚠️ THE ONLY WAY BACK (v3.16.0). Until now every navigation a student had ran
    // FORWARD — "jump to furthest" and nothing else. A student who found themselves
    // ahead of where they had actually read had no move available at all, which is
    // exactly the state v3.15.0's dead offsets left people in: the chapter ticks
    // itself complete, they advance, and the text is unfamiliar.
    //
    // Deliberately NOT gated on a re-anchor having happened. A kid who spaced out for
    // a page wants this as much as one the software misplaced, and an affordance that
    // appears only after a rare fault is one nobody has learned to look for.
    //
    // ⚠️ Does not touch furthestChapter / furthestCharIndex, so this is reversible in
    // one click via the jump link above. That is what makes it safe to leave unguarded
    // by a confirm dialog — nothing is destroyed, and a confirm on a harmless action
    // teaches children to click through warnings.
    let restartHtml = '';
    if (currentCharIndex > 0) {
        restartHtml = `<div style="margin:4px 0;"><a href="#" id="restart-chapter" style="color:var(--carolina-blue); font-size:0.85em;">↩︎ Start this chapter over</a></div>`;
    }

    // Kept alongside the one-click restart above rather than replacing it: restarting
    // the current chapter is the common case and deserves to stay one click, while
    // this is the tool for the rarer "I'm somewhere I don't recognise" problem.
    let flipHtml = '';
    if (canFlipBack()) {
        flipHtml = `<div style="margin:4px 0;"><a href="#" id="flip-back" style="color:var(--carolina-blue); font-size:0.85em;">\u{1F4D6} Flip back to an earlier part\u2026</a></div>`;
    }

    document.getElementById('modal-body').innerHTML = `
        ${statsSection}
        ${noticeHtml}
        ${jumpHtml}
        ${restartHtml}
        ${flipHtml}
        <div class="start-controls">
            ${getDropdownHTML()}
            <div class="start-hint">Type first character to start · ESC to pause</div>
        </div>
    `;

    const flipLink = document.getElementById('flip-back');
    if (flipLink) {
        flipLink.onclick = (e) => { e.preventDefault(); closeModal(); openFlipBack(); };
    }

    const restartLink = document.getElementById('restart-chapter');
    if (restartLink) {
        restartLink.onclick = async (e) => {
            e.preventDefault();
            savedCharIndex = 0; currentCharIndex = 0;
            // Persisted immediately: a student who restarts and then closes the tab
            // must not be dropped back at the old position on their next visit.
            // saveProgress() stamps the current contentVersion, which also settles
            // any outstanding re-anchor for this book.
            try { await saveProgress(true); } catch (_) { /* offline: WAL has it */ }
            closeModal();
            await loadChapter(currentChapterNum);
        };
    }

    // Wire jump link
    const jumpLink = document.getElementById('jump-furthest');
    if (jumpLink) {
        jumpLink.onclick = async (e) => {
            e.preventDefault();
            currentChapterNum = furthestChapter;
            savedCharIndex = furthestCharIndex;
            closeModal();
            await loadChapter(furthestChapter);
        };
    }

    const btn = document.getElementById('action-btn');
    btn.innerText = btnText; btn.onclick = startGame; btn.disabled = false; btn.style.display = 'inline-block'; btn.style.opacity = '1';
    showModalPanel();
}

// extraHTML (v3.12.2) is an optional block rendered below the stats and above the
// hint. Added so the book-completion screen can offer "About this book" without
// abusing the hint slot, which starts display:none and is revealed conditionally.
// Optional and defaulted, so the five existing callers are untouched.
// ─── END CREDITS, CLASSIC VIEW (v3.13.0) ─────────────────────────────────────
//
// Jake's note: credits belong "on the main screen in standard fashion" for Classic
// and scrolling like a movie for Adventure. v3.12.2 put a link in the stats modal,
// which is the wrong surface — the modal is a stats card that lives in the keyboard
// area. The credits belong where the BOOK was, because that is what just ended.
//
// So Classic replaces the text stream. The reader has just typed the last word in
// that space; the next thing in that space should be who wrote it.
//
// ⚠️ NOT A DUPLICATE OF index.html's About PANEL. That panel renders the stored
// notice PAGES, which is a subcollection read per page. This is the one-line
// attribution already on the book document, which game.js has in bookMetadata and
// costs nothing. Anyone wanting the full notices follows the link.
function renderClassicCredits() {
    if (!textStream || !bookMetadata) return;
    const m = bookMetadata;
    const bits = [];
    if (m.author)     bits.push(['By',                escapeHtmlG(m.author)]);
    if (m.source)     bits.push(['Source',            escapeHtmlG(m.source)]);
    if (m.rights)     bits.push(['License',           creditLine(m.rights)]);
    if (m.cleanedBy)  bits.push(['Text prepared by',  escapeHtmlG(m.cleanedBy)]);

    const rows = bits.map(b =>
        '<div style="margin:3px 0;"><span style="opacity:0.55;">' + b[0] +
        '</span> &nbsp;' + b[1] + '</div>').join('');

    textStream.innerHTML =
        '<div style="max-width:620px; margin:0 auto; padding:8vh 24px 0; text-align:center;">' +
          '<div style="font-size:0.72rem; letter-spacing:0.22em; text-transform:uppercase; ' +
               'opacity:0.5; margin-bottom:18px;">The End</div>' +
          '<div style="font-size:1.5rem; font-weight:700; line-height:1.25;">' +
               escapeHtmlG(m.title || 'This book') + '</div>' +
          '<div style="margin-top:26px; font-size:0.92rem; line-height:1.7;">' + rows + '</div>' +
          (bits.length ? '' : '<div style="opacity:0.55; font-size:0.9rem;">' +
               'No credits were recorded for this edition.</div>') +
          '<div style="margin-top:30px; font-size:0.85rem;">' +
            '<a href="index.html#about=' + encodeURIComponent(currentBookId) + '" ' +
               'style="color:var(--carolina-blue);">Read this book\u2019s own notices</a>' +
            '<span style="opacity:0.4;"> \u00b7 </span>' +
            '<a href="index.html" style="color:var(--carolina-blue);">Back to the library</a>' +
          '</div>' +
        '</div>';
}

// A licence value carries its URI on purpose (a URI is what CC asks for), so show
// the label and hide the URL behind it — the same rule index.html uses on the card.
// ⚠️ THE CHARACTER CLASS AND THE ATTRIBUTE ESCAPE ARE BOTH SECURITY.
//
// escapeHtmlG() is DOM-based (textContent -> innerHTML). It neutralises < > & and
// NOT quotes, because quotes need no escaping in element content — and very much do
// inside an href. A first draft of this used \S+ for the URL, so a licence value of
//     Evil" onclick="alert(2) https://x.test/"onmouseover="alert(3)
// matched through the quotes and closed the href early to inject a handler.
//
// index.html's linkifyText() already had exactly this fix and I did not carry it
// over — the second time in one round, which is the argument for the test that
// caught it rather than for trying harder to remember.
function creditLine(val) {
    const m = /^(.*?)\s*(https?:\/\/[^\s<>"']+)\s*$/.exec(String(val || ''));
    if (!m) return escapeHtmlG(val);
    const label = m[1].trim() || m[2];
    const href = m[2].replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    return '<a href="' + href + '" target="_blank" rel="noopener noreferrer" ' +
           'style="color:var(--carolina-blue);">' + escapeHtmlG(label) + '</a>';
}

// game.js has no HTML escaper of its own and this string is a book title from
// Firestore, rendered into innerHTML.
function escapeHtmlG(str) {
    const d = document.createElement('div');
    d.textContent = String(str == null ? '' : str);
    return d.innerHTML;
}

function showStatsModal(title, stats, btnText, callback, hint, instant, extraHTML) {
    isModalOpen = true; isInputBlocked = true;
    modalActionCallback = () => { closeModal(); if(callback) callback(); };
    setModalTitle('');

    const trophyHTML = getPlacementsHTML(stats.placements);
    const hasTrophies = trophyHTML.length > 0;

    document.getElementById('modal-body').innerHTML = `
        <div class="${hasTrophies ? 'stats-with-trophies' : ''}">
            ${hasTrophies ? '<div class="stats-balance"></div>' : ''}
            <div class="${hasTrophies ? 'stats-main' : ''}">
                <div class="stats-title">${title}</div>
                <div class="stats-inline">
                    <span class="si-val">${stats.wpm} <small>WPM</small></span>
                    <span class="si-dot">·</span>
                    <span class="si-val">${stats.acc}% <small>Acc</small></span>
                    <span class="si-dot">·</span>
                    <span class="si-val">${formatTime(stats.time)}</span>
                    ${bestStreak > 0 ? `<span class="si-dot">·</span><span class="si-val">🔥${bestStreak}</span>` : ''}
                </div>
                <div class="cumulative-row">
                    <span>Today: ${stats.today}</span>
                    <span>Week: ${stats.week}</span>
                </div>
                ${getGoalProgressHTML()}
                ${getSprintHistoryHTML()}
                ${getMissedCharsHTML()}
                ${extraHTML || ''}
                ${(!isPracticeMode && canFlipBack()) ? `<div style="margin:6px 0;"><a href="#" id="stats-flip-back" style="color:var(--carolina-blue); font-size:0.8em;">\u{1F4D6} Flip back to an earlier part\u2026</a></div>` : ''}
                ${hint ? `<div class="start-hint" id="modal-hint" style="display:none;">${hint}</div>` : ''}
            </div>
            ${trophyHTML}
        </div>
    `;

    // Add sprint length dropdown to footer alongside button
    const returnLink = isPracticeMode ? `<a href="#" id="practice-return" style="color:var(--carolina-blue); font-size:0.75em;">↩ Return to Book</a>` : '';
    document.getElementById('modal-footer').innerHTML = `
        <div class="modal-footer-row">
            <select id="sprint-select" class="modal-select modal-select-sm">${getSessionOptionsHTML()}</select>
            <button id="action-btn" class="modal-btn">Action</button>
        </div>
        ${returnLink}
    `;

    // ⚠️ Placed HERE, not only on the start modal (v3.18.0). The pause screen is where
    // a student actually notices they are lost — they stop typing BECAUSE the text stopped
    // making sense. Making them dismiss the stats, land back in the book and pause again
    // to reach the tool is asking them to navigate out of the exact confusion it fixes.
    //
    // Suppressed in practice mode: that text is generated, not the book, so there is
    // nowhere in it to flip back to.
    const statsFlip = document.getElementById('stats-flip-back');
    if (statsFlip) {
        statsFlip.onclick = (e) => {
            e.preventDefault();
            modalActionCallback = null;   // don't resume the sprint we're leaving
            closeModal();
            openFlipBack();
        };
    }

    // Wire practice button if present
    const practiceBtn = document.getElementById('practice-btn');
    if (practiceBtn) {
        practiceBtn.onclick = () => startPracticeMode();
    }
    // Wire return-to-book link
    const returnEl = document.getElementById('practice-return');
    if (returnEl) {
        returnEl.onclick = (e) => { e.preventDefault(); exitPracticeMode(); };
    }
    // Save sprint changes immediately so smart-start (which closes modal first) sees them
    document.getElementById('sprint-select').onchange = (e) => {
        sessionValueStr = e.target.value;
        sessionLimit = (sessionValueStr === 'infinity') ? 'infinity' : parseInt(sessionValueStr);
        localStorage.setItem('ttb_sessionLength', sessionValueStr);
    };

    const btn = document.getElementById('action-btn');
    if (instant) {
        btn.innerText = btnText; btn.onclick = modalActionCallback; btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
        isInputBlocked = false;
        const hintEl = document.getElementById('modal-hint');
        if (hintEl) hintEl.style.display = '';
    } else {
        btn.innerText = "Wait..."; btn.onclick = modalActionCallback; btn.disabled = true; btn.style.opacity = '0.5'; btn.style.display = 'inline-block';
        const gen = ++modalGeneration;
        setTimeout(() => {
            if (modalGeneration !== gen) return;
            isInputBlocked = false;
            if(document.getElementById('action-btn')) {
                const b = document.getElementById('action-btn');
                b.style.opacity = '1'; b.innerText = btnText; b.disabled = false;
            }
            const hintEl = document.getElementById('modal-hint');
            if (hintEl) hintEl.style.display = '';
        }, SPRINT_COOLDOWN_MS);
    }
    showModalPanel();
}


// Mid-sprint entry point, used only in infinity mode where no sprint boundary
// will ever arrive. Closes out the partial sprint the way pauseGameForBreak()
// would — log it, bank the seconds — so the minutes shown in the prompt are the
// minutes that get saved if they say yes.
function interruptForAnonNudge(rung) {
    isGameActive = false; clearInterval(timerInterval);

    const charsTyped = currentCharIndex - sprintCharStart;
    const sprintMinutes = sprintSeconds / 60;
    const sprintWPM = sanitizeSprintWPM(
        (sprintMinutes > 0) ? Math.round((charsTyped / 5) / sprintMinutes) : 0, charsTyped);
    const sprintTotalEntries = charsTyped + sprintMistakes;
    const sprintAcc = (sprintTotalEntries > 0) ? Math.round((charsTyped / sprintTotalEntries) * 100) : 100;
    if (sprintSeconds > 0) logSession(sprintSeconds, charsTyped, sprintMistakes, sprintWPM, sprintAcc);
    practiceTypingAccumulator += sprintSeconds;
    anonTotalSeconds += sprintSeconds;

    showAnonLoginPrompt(rung);
}

// ⚠️ ONE PROMPT, TWO RUNGS. `rung` is 1 (gentle, ~1 minute in) or 2 (blunt,
// ~5 minutes in). The old pair had one of each and they were separate
// functions, which is how they drifted into disagreeing about whether the
// student's work survived saying yes. The copy varies; the sign-in path does
// not, and that is the invariant worth protecting here.
function showAnonLoginPrompt(rung) {
    rung = (rung === 2) ? 2 : 1;
    anonNudgeShown = rung;
    saveAnonNudgeState();

    const minutes = Math.max(1, Math.round(anonTotalSeconds / 60));

    isModalOpen = true; isInputBlocked = true;
    modalActionCallback = null;
    setModalTitle('');
    resetModalFooter();

    document.getElementById('modal-body').innerHTML = rung === 1 ? `
        <div style="text-align:center;">
            <div class="stats-title">Nice work! 👏</div>
            <div style="font-size:0.95em; color:#555; margin: 8px 0;">
                You're making real progress! Sign in to save your work so you can pick up right where you left off next time.
            </div>
        </div>
    ` : `
        <div style="text-align:center;">
            <div class="stats-title">⚠️ Your progress isn't being saved</div>
            <div style="font-size:0.95em; color:#555; margin: 8px 0;">
                That's <b>${minutes} minutes</b> of typing that will be lost if you close this tab. Signing in keeps all of it — including the minutes you've already done.
            </div>
            <div style="font-size:0.85em; color:#888; margin-top:6px;">Use your school Google account. This is the last time I'll ask.</div>
        </div>
    `;

    const btn = document.getElementById('action-btn');
    btn.innerText = 'Wait...'; btn.disabled = true; btn.style.opacity = '0.5'; btn.style.display = 'inline-block';
    const signInAction = async () => {
        try {
            anonLoginInProgress = true;
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (e) {
            anonLoginInProgress = false;
            // User cancelled login — just continue
            closeModal();
            showStartModal("Continue");
            return;
        }

        // Login succeeded — retroactively save anonymous session time
        if (currentUser && !currentUser.isAnonymous) {
            try {
                // ⚠️ v3.36.0 — WAS THE SECOND INLINE COPY OF THE MERGE.
                // Both are one function now. See retroactiveSaveGuestSession().
                await retroactiveSaveGuestSession(currentUser);

                // Load goals since auth handler was skipped
                await loadGoals();
                const initialsPromptShown = await loadInitials();
                trophyBtn.classList.remove('hidden');

                // Read their saved progress BEFORE writing anything to it
                const progRef = doc(db, "users", currentUser.uid, "progress", currentBookId);
                const progSnap = await getDoc(progRef);
                let savedChap = null, savedIdx = 0, savedFurthestChap = null, savedFurthestIdx = 0;
                if (progSnap.exists()) {
                    const data = progSnap.data();
                    savedChap = data.chapter || null;
                    savedIdx = data.charIndex || 0;
                    savedFurthestChap = data.furthestChapter || savedChap;
                    savedFurthestIdx = data.furthestCharIndex || savedIdx;
                    if (data.completedChapters && Array.isArray(data.completedChapters)) {
                        completedChapters = new Set(data.completedChapters.map(String));
                    }
                }

                // Update furthest: take the max of saved furthest and current anonymous position
                if (savedFurthestChap !== null) {
                    furthestChapter = savedFurthestChap;
                    furthestCharIndex = savedFurthestIdx;
                }
                if (isPositionAhead(currentChapterNum, currentCharIndex, furthestChapter, furthestCharIndex)) {
                    furthestChapter = currentChapterNum;
                    furthestCharIndex = currentCharIndex;
                }

                // Now save progress — write current position + updated furthest
                await setDoc(progRef, {
                    chapter: currentChapterNum,
                    charIndex: currentCharIndex,
                    furthestChapter: furthestChapter,
                    furthestCharIndex: furthestCharIndex,
                    ...progressStamp(),
                    lastUpdated: new Date()
                }, { merge: true });
            } catch(e) { console.warn("Retroactive save failed:", e); }

            // If initials prompt is showing, let it handle the flow
            if (!userInitials) {
                anonLoginInProgress = false;
                return;
            }

            // Check if furthest point is ahead of current position
            if (isPositionAhead(furthestChapter, furthestCharIndex, currentChapterNum, currentCharIndex)) {
                anonLoginInProgress = false;
                showJumpToProgressPrompt(furthestChapter, furthestCharIndex);
                return;
            }
        }

        anonLoginInProgress = false;
        closeModal();
        showStartModal("Continue");
    };
    btn.onclick = signInAction;

    // Skip link below, hidden until the cooldown expires. Wording escalates with
    // the rung: at one minute nothing has been lost yet, at five minutes the
    // honest label says what declining costs.
    const footer = document.getElementById('modal-footer');
    if (!document.getElementById('anon-skip')) {
        const skip = document.createElement('div');
        skip.innerHTML = `<a href="#" id="anon-skip" style="color:#999; font-size:0.8rem; margin-top:6px; display:none;"></a>`;
        footer.appendChild(skip);
    }
    const skipEl0 = document.getElementById('anon-skip');
    skipEl0.textContent = rung === 1 ? 'No thanks, keep typing'
                                     : "I understand it won't be saved — keep typing";
    skipEl0.onclick = (e) => {
        e.preventDefault();
        closeModal();
        showStartModal("Continue");
    };

    showModalPanel();

    // 3-second cooldown before allowing dismissal
    const gen = ++modalGeneration;
    setTimeout(() => {
        if (modalGeneration !== gen) return;
        isInputBlocked = false;
        const b = document.getElementById('action-btn');
        if (b) { b.innerText = 'Sign In'; b.disabled = false; b.style.opacity = '1'; }
        const skipEl = document.getElementById('anon-skip');
        if (skipEl) skipEl.style.display = 'inline-block';
        // Set modalActionCallback so smart-start typing skips to continue
        modalActionCallback = () => { closeModal(); showStartModal("Continue"); };
    }, SPRINT_COOLDOWN_MS * 2);
}

function showJumpToProgressPrompt(savedChap, savedIdx) {
    isModalOpen = true; isInputBlocked = false;
    setModalTitle('');
    resetModalFooter();

    // Find chapter title
    let chapLabel = `Chapter ${savedChap}`;
    if (bookMetadata && bookMetadata.chapters) {
        const chap = bookMetadata.chapters.find(c => c.id === "chapter_" + savedChap);
        if (chap && chap.title && chap.title != savedChap) {
            if (chap.title.toLowerCase().startsWith('chapter')) chapLabel = chap.title;
            else chapLabel = `Ch. ${savedChap}: ${chap.title}`;
        }
    }

    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:center;">
            <div class="stats-title">Welcome back! 📚</div>
            <div style="font-size:0.95em; color:#555; margin: 8px 0;">
                You were previously on <b>${escapeHtml(chapLabel)}</b>. Would you like to pick up where you left off?
            </div>
        </div>
    `;

    const btn = document.getElementById('action-btn');
    btn.innerText = `Jump to ${escapeHtml(chapLabel)}`; btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
    btn.onclick = async () => {
        currentChapterNum = savedChap;
        savedCharIndex = savedIdx;
        closeModal();
        await loadChapter(savedChap);
    };

    // Add stay option
    const footer = document.getElementById('modal-footer');
    const stay = document.createElement('div');
    stay.innerHTML = `<a href="#" id="stay-here" style="color:#999; font-size:0.8rem; margin-top:6px; display:inline-block;">Stay here and keep typing</a>`;
    footer.appendChild(stay);
    document.getElementById('stay-here').onclick = (e) => {
        e.preventDefault();
        closeModal();
        showStartModal("Continue");
    };

    modalActionCallback = () => { closeModal(); showStartModal("Continue"); };
    showModalPanel();
}

function getGoalProgressHTML() {
    if (goals.dailySeconds <= 0 && goals.weeklySeconds <= 0) return '';

    let html = '<div class="goal-progress-row">';

    if (goals.dailySeconds > 0) {
        const dailyPct = Math.min(100, Math.round((statsData.secondsToday / goals.dailySeconds) * 100));
        const met = statsData.secondsToday >= goals.dailySeconds;
        html += `<div class="goal-item">
            <span class="goal-label">🎉 Daily</span>
            <div class="goal-bar"><div class="goal-fill" style="width:${dailyPct}%; background:${met ? '#22c55e' : '#4B9CD3'};"></div></div>
            <span class="goal-pct" style="color:${met ? '#22c55e' : '#888'};">${dailyPct}%${met ? ' ✓' : ''}</span>
        </div>`;
    }

    if (goals.weeklySeconds > 0) {
        const weeklyPct = Math.min(100, Math.round((statsData.secondsWeek / goals.weeklySeconds) * 100));
        const met = statsData.secondsWeek >= goals.weeklySeconds;
        html += `<div class="goal-item">
            <span class="goal-label">🎆 Weekly</span>
            <div class="goal-bar"><div class="goal-fill" style="width:${weeklyPct}%; background:${met ? '#FFD700' : '#4B9CD3'};"></div></div>
            <span class="goal-pct" style="color:${met ? '#FFD700' : '#888'};">${weeklyPct}%${met ? ' ✓' : ''}</span>
        </div>`;
    }

    html += '</div>';
    return html;
}

function getSessionOptionsHTML() {
    const options = [{val: "30", label: "30 Seconds"}, {val: "60", label: "1 Minute"}, {val: "120", label: "2 Minutes"}, {val: "300", label: "5 Minutes"}, {val: "infinity", label: "Open Ended (∞)"}];
    return options.map(opt => `<option value="${opt.val}" ${sessionValueStr === opt.val ? 'selected' : ''}>${opt.label}</option>`).join('');
}

function getDropdownHTML() {
    return `<div style="text-align:center;"><label for="sprint-select" style="color:#777; font-size:0.8rem; display:block; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">Session Length</label><select id="sprint-select" class="modal-select">${getSessionOptionsHTML()}</select></div>`;
}

function closeModal() {
    isModalOpen = false; isInputBlocked = false; 
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('virtual-keyboard').classList.remove('hidden');
    resetModalFooter();
    const keyboard = document.getElementById('virtual-keyboard'); if(keyboard) keyboard.focus();
}

function resetModalFooter() {
    document.getElementById('modal-footer').innerHTML = `<button id="action-btn" class="modal-btn">Action</button>`;
}

function showModalPanel() {
    document.getElementById('virtual-keyboard').classList.add('hidden');
    document.getElementById('modal').classList.remove('hidden');
}

function setModalTitle(text) {
    const bar = document.getElementById('modal-title-bar');
    document.getElementById('modal-title').innerText = text;
    if (text) bar.classList.remove('no-title');
    else bar.classList.add('no-title');
}

// ─── Book list for the Settings dropdown ──────────────────────────────────────
//
// ⚠️ THIS USED TO BE AN UNCACHED `getDocs(collection(db,"books"))` — the whole
// collection, every time a student opened Settings.
//
// It was the last read in the student path that did not follow the caching
// discipline the rest of the file settled on in v3.4.0, and it was the only one
// that got WORSE over time: the bookclean project adds titles continuously, so
// the cost of opening a menu grew with the library. At ~42 books and a couple of
// thousand students a day it was, on its own, roughly the size of the entire
// rest of the read budget.
//
// The fix is the pattern index.html already uses for the library grid: cache the
// list in localStorage, and validate it with a COUNT aggregation — ONE billed
// read for the whole collection instead of one per document. A count is enough
// because the failure this guards against is a book being added or removed;
// a *renamed* book is caught by the TTL within the hour.
//
// ⚠️ Only id and title are cached. The dropdown renders nothing else, and the
// `chapters` array on a book document is by far its largest field — index.html
// learned that the expensive way (see its BOOKS_CACHE_KEY note). Do not be
// tempted to cache the whole document "in case it's useful later."
//
// Shares no state with index.html's cache on purpose: different shape, different
// TTL, and a stale read here is a dropdown, not a library.
const BOOKLIST_CACHE_KEY = 'ttb_bookListCache_v1';
// ⚠️ NOW A CEILING ON HOW LONG A COUNT-VALIDATED CACHE MAY LIVE, not a gate on
// whether the cache is consulted at all. Raised to a school day: past TRUST_MS
// every serve costs exactly 1 read to confirm the count, so a longer life is
// nearly free and a shorter one just re-pays 55.
const BOOKLIST_CACHE_MS  = 8 * 3600 * 1000;   // 8 hours
// Inside this window the cache is served with NO reads at all. Long enough to
// cover a class period's navigations, short enough that a book added at lunch
// shows up in the afternoon.
const BOOKLIST_TRUST_MS  = 30 * 60 * 1000;    // 30 minutes
let bookListMem = null;                   // per-tab, avoids re-touching localStorage

async function loadBookList() {
    if (bookListMem) return bookListMem;

    // ⚠️ v3.46.0 — THE COUNT GUARD USED TO RUN ONLY ON A CACHE THAT WAS STILL
    // FRESH, WHICH IS THE ONE CASE THAT DOES NOT NEED IT. Past the TTL the
    // cached copy was discarded UNREAD and the full collection refetched.
    // Measured 2026-08-24 on a real student session: index.html spent 1 read
    // validating a fresh cache while this function spent 55 refetching a stale
    // one, in the same minute, over the same 55 books.
    //
    // A getCountFromServer() is ONE read and it answers the only question that
    // matters — has the library changed? So the TTL is no longer a gate on the
    // cache, it is a gate on the CHECK:
    //
    //     age < TRUST_MS   →  serve from cache, 0 reads
    //     cache exists     →  1 read to confirm the count, then serve, 1 read
    //     no cache at all  →  full fetch, 55 reads
    //
    // ⚠️ THE COUNT IS NOT A CHECKSUM, and that is deliberate. Editing a title
    // in place leaves the count unchanged and this will serve the old one for up
    // to BOOKLIST_CACHE_MS. That was already true of the previous code and it is
    // the right trade: a stale title for an hour costs nothing, and the
    // alternative is 55 reads per student per page load to catch a typo fix.
    // window.ttbClearBookList() is the escape hatch after a bulk edit.
    let cached = null;
    try {
        const raw = localStorage.getItem(BOOKLIST_CACHE_KEY);
        if (raw) {
            const c = JSON.parse(raw);
            if (Array.isArray(c.books) && c.books.length) cached = c;
        }
    } catch (_) { /* cache is an optimisation, never a dependency */ }

    if (cached) {
        // Very recently validated — skip even the count.
        if ((Date.now() - cached.at) < BOOKLIST_TRUST_MS) {
            bookListMem = cached.books;
            return bookListMem;
        }
        let liveCount = null;
        try {
            liveCount = (await getCountFromServer(collection(db, "books"))).data().count;
        } catch (_) { /* aggregation unavailable — fall through to the full fetch */ }
        if (liveCount !== null && liveCount === cached.books.length &&
            (Date.now() - cached.at) < BOOKLIST_CACHE_MS) {
            // ⚠️ RESTAMP. Without this the count is re-paid on every single
            // navigation once the entry passes TRUST_MS.
            cached.at = Date.now();
            try { localStorage.setItem(BOOKLIST_CACHE_KEY, JSON.stringify(cached)); } catch (_) {}
            bookListMem = cached.books;
            return bookListMem;
        }
    }

    const snap = await getDocs(collection(db, "books"));
    const books = [];
    snap.forEach(d => books.push({ id: d.id, title: d.data().title || d.id }));
    books.sort((a, b) => a.title.localeCompare(b.title));
    bookListMem = books;
    try {
        localStorage.setItem(BOOKLIST_CACHE_KEY,
                             JSON.stringify({ at: Date.now(), books }));
    } catch (_) { /* quota — serve from memory for this tab and move on */ }
    return books;
}

// Admin escape hatch, matching index.html's ttbClearLibraryCache().
window.ttbClearBookList = function () {
    bookListMem = null;
    try { localStorage.removeItem(BOOKLIST_CACHE_KEY); } catch (_) {}
};

async function openMenuModal() {
    // Quietly pause without showing break modal
    const wasActive = isGameActive;
    if (isGameActive) { isGameActive = false; clearInterval(timerInterval); }
    isModalOpen = true; isInputBlocked = false;
    modalGeneration++;
    modalActionCallback = () => { closeModal(); createHandGuide(); startGame(); };
    resetModalFooter();

    setModalTitle('Settings');

    const chapBuild = buildChapterOptions(currentChapterNum, '');
    const chapterOptions = chapBuild.html;
    const showChapFilter = chapBuild.total > CHAPTER_FILTER_MIN;

    let bookOptions = "";
    try {
        for (const b of await loadBookList()) {
            const sel = (b.id === currentBookId) ? "selected" : "";
            bookOptions += `<option value="${escapeHtml(b.id)}" ${sel}>${escapeHtml(b.title)}</option>`;
        }
    } catch(e) { console.warn(e); }

    // Schools are cached 24h, so this is one read per day per student at most.
    const schools = (currentUser && !currentUser.isAnonymous) ? await loadSchools() : [];
    const teacherAssigned = !!ttbClassId;
    const mySchoolName = (schools.find(s => s.id === ttbSchoolId) || {}).name || '';
    const schoolHTML = (currentUser && !currentUser.isAnonymous && (schools.length || ttbSchoolId)) ? `
        <div class="menu-label" style="margin-top:8px;">School</div>
        ${teacherAssigned ? `
            <div style="font-size:0.75em; color:#666; margin-top:3px; text-align:center;">
                ${escapeHtml(mySchoolName || 'Assigned')}<br>
                <span style="color:#aaa; font-size:0.9em;">set by your teacher</span>
            </div>`
        : `
            <select id="school-select" class="modal-select" style="margin:3px 0 0 0;">
                <option value="" ${!ttbSchoolId ? 'selected' : ''}>— No school —</option>
                ${schools.map(s => `<option value="${escapeHtml(s.id)}" ${s.id === ttbSchoolId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
            </select>
            <div id="school-status" style="font-size:0.7em; color:#888; min-height:1em; margin-top:2px;"></div>`}
    ` : '';

    // ⚠️ THE STUDENT ID LIVES HERE NOW (v3.42.3). It was a fixed-position stamp in
    // the bottom-left corner of every page; Jake asked for it to move into
    // settings, and learn.js v2.29.0 had already put it in School's ⚙ panel — so
    // leaving Library without one was the twin half-built AGAIN.
    //
    // ⚠️ EIGHT CHARACTERS, NOT TWENTY-EIGHT, AND THAT IS NOT AESTHETIC. Eight are
    // unambiguous across a building and can be read aloud across a classroom
    // without a mistake. `reports.html` prints the same eight beside each
    // student, which is the entire point: the child reads it out, Jake finds the
    // row. The full value stays in the title and on the clipboard.
    //
    // Not PII, and it is the student's own id only: no lookup, no list, nothing
    // another student's browser could be made to show.
    const idHTML = (currentUser && !currentUser.isAnonymous) ? `
        <div class="menu-label" style="margin-top:8px;">Your ID</div>
        <div id="ttb-id-row" title="${escapeHtml('Student ID: ' + currentUser.uid + ' (click to copy)')}"
             data-uid="${escapeHtml(currentUser.uid)}"
             style="font-family:monospace; font-size:0.8em; color:#aaa; margin-top:3px;
                    text-align:center; cursor:pointer; user-select:all;">${escapeHtml(currentUser.uid.slice(0, 8))}</div>
        <div style="font-size:0.7em; color:#666; text-align:center; margin-top:2px;">
            tell your teacher this if something looks wrong</div>
    ` : '';

    const initialsHTML = (currentUser && !currentUser.isAnonymous) ? `
        <div class="menu-col menu-col-initials">
            <div class="menu-label">Initials</div>
            <input id="initials-input" type="text" maxlength="3" value="${escapeHtml(userInitials)}" 
                   class="initials-box-settings">
            <div id="initials-settings-error" style="color:#D32F2F; font-size:0.7em; min-height:1em; margin-top:2px;"></div>
            <label style="display:flex; align-items:center; gap:5px; font-size:0.7em; color:#888; margin-top:4px; cursor:pointer;">
                <input type="checkbox" id="lb-optout" ${leaderboardOptOut ? 'checked' : ''}>
                Hide me from leaderboards
            </label>
            ${schoolHTML}
            ${idHTML}
        </div>` : '';

    document.getElementById('modal-body').innerHTML = `
        <div class="menu-3col">
            <div class="menu-col">
                <div class="menu-label">Book</div>
                <select id="book-select" class="modal-select">${bookOptions}</select>
                <div id="book-switch-hint" style="display:none; font-size:0.68em; line-height:1.35;
                     color:#2E7D32; margin-top:4px;"></div>
                <div class="menu-label" style="margin-top:8px;">Chapter</div>
                ${showChapFilter ? `
                <div style="display:flex; gap:6px; align-items:center; margin-bottom:4px;">
                    <input type="text" id="chapter-filter" class="modal-select"
                           placeholder="Search ${chapBuild.total} chapters\u2026"
                           autocomplete="off" style="margin:0; flex-grow:1;">
                    <span id="chapter-filter-status" style="font-size:0.7em; color:#888; min-width:52px;"></span>
                </div>` : ''}
                <div style="display:flex; gap:6px;">
                    <select id="chapter-nav-select" class="modal-select" style="margin:0; flex-grow:1;">${chapterOptions}</select>
                    <button id="go-btn" class="modal-btn" style="width:auto; padding:0 12px; font-size:13px;">Go</button>
                </div>
            </div>
            <div class="menu-col">
                <div class="menu-label">Sprint</div>
                <select id="sprint-select" class="modal-select">${getSessionOptionsHTML()}</select>
                <div class="menu-label" style="margin-top:8px;">Keyboard</div>
                <select id="layout-select" class="modal-select">
                    <option value="qwerty" ${currentLayout === 'qwerty' ? 'selected' : ''}>QWERTY</option>
                    <option value="dvorak" ${currentLayout === 'dvorak' ? 'selected' : ''}>Dvorak</option>
                </select>
                <div class="menu-label" style="margin-top:8px;">View</div>
                <select id="view-select" class="modal-select">
                    <option value="classic" ${VIEW_MODE === 'classic' ? 'selected' : ''}>Classic</option>
                    <option value="adventure" ${VIEW_MODE === 'adventure' ? 'selected' : ''}>Adventure</option>
                </select>
                <label style="display:flex; align-items:center; gap:5px; font-size:0.7em; color:#888; margin-top:4px; cursor:pointer;">
                    <input type="checkbox" id="view-ask-each" ${viewRemember ? '' : 'checked'}>
                    Ask me for each new book
                </label>
            </div>
            <div class="menu-col menu-col-guide">
                <div class="menu-label">Hand Guide</div>
                <label style="display:flex; align-items:center; gap:5px; font-size:0.8em; color:#ccc; cursor:pointer; margin-top:4px;">
                    <input type="checkbox" id="guide-toggle" ${handGuideEnabled ? 'checked' : ''}>
                    Show fingers
                </label>
                <label style="display:flex; align-items:center; gap:5px; font-size:0.8em; color:#ccc; cursor:pointer; margin-top:4px;">
                    <input type="checkbox" id="guide-rainbow" ${handGuideRainbow ? 'checked' : ''}>
                    🌈 Rainbow
                </label>
                <div id="guide-color-row" style="display:${handGuideRainbow ? 'none' : 'flex'}; align-items:center; gap:5px; margin-top:4px;">
                    <input type="color" id="guide-color" value="${handGuideColor}" 
                        style="width:28px; height:22px; border:1px solid #555; border-radius:3px; cursor:pointer; background:none; padding:0;">
                    <span style="font-size:0.7em; color:#888;">Color</span>
                </div>
            </div>
            ${initialsHTML}
        </div>
    `;

    // ⚠️ CLICK-TO-COPY CARRIED OVER FROM THE CORNER STAMP (v3.42.3). The stamp
    // copied the FULL uid on click; eight characters is enough to read aloud but
    // not enough to paste into a Firestore console, and dropping that on the way
    // into settings would have been a silent capability loss. Guarded because
    // #ttb-id-row only exists for a signed-in student.
    const idRow = document.getElementById('ttb-id-row');
    if (idRow) idRow.onclick = () => {
        const full = idRow.dataset.uid || '';
        if (full && navigator.clipboard) navigator.clipboard.writeText(full).catch(() => {});
    };

    document.getElementById('layout-select').onchange = (e) => {
        setKeyboardLayout(e.target.value);
    };

    // ─── Adventure: view mode toggle ───
    // v3.5.0: swaps in place. This used to save progress and call
    // location.reload(), which was tolerable for a deliberate settings change
    // but not for the boot-time reconciliation that now shares this code path.
    // applyViewMode() replays textLoaded + positionSet into a freshly mounted
    // renderer, so the student stays exactly where they were.
    document.getElementById('view-select').onchange = async (e) => {
        const ok = await applyViewMode(e.target.value, { replay: true, persist: true });
        if (!ok) e.target.value = 'classic';   // module failed to load
    };

    document.getElementById('view-ask-each').onchange = async (e) => {
        await saveViewMode(VIEW_MODE, !e.target.checked);
        // Re-arm the per-book prompt for the book they're in right now,
        // otherwise ticking the box appears to do nothing until they switch.
        if (!viewRemember) { try { sessionStorage.removeItem(SPLASH_BOOK_KEY); } catch (_) {} }
    };

    document.getElementById('sprint-select').onchange = (e) => {
        sessionValueStr = e.target.value;
        sessionLimit = (sessionValueStr === 'infinity') ? 'infinity' : parseInt(sessionValueStr);
        localStorage.setItem('ttb_sessionLength', sessionValueStr);
    };

    // Hand guide controls
    document.getElementById('guide-toggle').onchange = (e) => {
        handGuideEnabled = e.target.checked;
        localStorage.setItem('ttb_handGuide', handGuideEnabled);
        const guide = document.getElementById('hand-guide-overlay');
        if (guide) guide.classList.toggle('hidden', !handGuideEnabled);
        if (handGuideEnabled) { createHandGuide(); }
        else { colorKeyboardKeys(); }
    };
    document.getElementById('guide-rainbow').onchange = (e) => {
        handGuideRainbow = e.target.checked;
        localStorage.setItem('ttb_handGuideRainbow', handGuideRainbow);
        const colorRow = document.getElementById('guide-color-row');
        if (colorRow) colorRow.style.display = handGuideRainbow ? 'none' : 'flex';
    };
    document.getElementById('guide-color').oninput = (e) => {
        handGuideColor = e.target.value;
        localStorage.setItem('ttb_handGuideColor', handGuideColor);
    };

    const initialsInput = document.getElementById('initials-input');
    if (initialsInput) {
        initialsInput.onblur = async () => {
            const val = initialsInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
            const errEl = document.getElementById('initials-settings-error');
            if (val && !isInitialsClean(val)) {
                if (errEl) errEl.textContent = "Not allowed — try again";
                initialsInput.value = userInitials; // revert
                return;
            }
            if (errEl) errEl.textContent = '';
            if (val && val !== userInitials) {
                userInitials = val;
                initialsInput.value = val;
                await saveInitials(val);
            }
        };
    }

    const optOutBox = document.getElementById('lb-optout');
    if (optOutBox) {
        optOutBox.onchange = async () => {
            leaderboardOptOut = optOutBox.checked;
            await saveInitials(userInitials);
            leaderboardCacheTime = 0; // bust cache
            // ⚠️ THE PERSISTED COPY MUST GO TOO. Clearing only the in-memory one
            // means the next page load restores exactly what was just busted.
            try { localStorage.removeItem(LB_BOARD_KEY); } catch (_) {}
            // Push the flag to the public leaderboard doc right now. Waiting for
            // the next sprint-end flush would leave a student who opted out and
            // closed the tab still listed.
            if (lbOwnEntry) {
                lbOwnEntry.leaderboardOptOut = leaderboardOptOut;
                lbDirty = true;
                await flushLeaderboard();
            }
        };
    }

    document.getElementById('book-select').onchange = async (e) => {
        const newBookId = e.target.value;
        if (newBookId === currentBookId) return;

        // Save current book's progress first
        await saveProgress(true);

        // Switch to new book
        currentBookId = newBookId;
        localStorage.setItem('currentBookId', currentBookId);
        const newUrl = `game.html?book=${encodeURIComponent(currentBookId)}`;
        window.history.replaceState(null, '', newUrl);

        // Load new book's metadata
        await loadBookMetadata();

        // Peek at saved progress (without loading chapter)
        let resumeChapter = 1;
        let resumeChar = 0;
        if (currentUser && !currentUser.isAnonymous) {
            try {
                const progSnap = await getDoc(doc(db, "users", currentUser.uid, "progress", currentBookId));
                if (progSnap.exists()) {
                    const data = progSnap.data();
                    if (data.chapter !== undefined && data.chapter !== null) resumeChapter = data.chapter;
                    if (data.charIndex !== undefined) resumeChar = data.charIndex;
                }
            } catch (e) { console.warn("Progress peek error:", e); }
        }

        // Rebuild the chapter dropdown for the new book. Same builder as the
        // initial render — this used to be a second, drifted copy that dropped
        // the ✓ ticks and relabelled "Ch." to "Chapter".
        const chapSelect = document.getElementById('chapter-nav-select');
        const rebuilt = buildChapterOptions(resumeChapter, '');
        if (chapSelect) chapSelect.innerHTML = rebuilt.html;

        // The filter belongs to the OLD book's chapter count, so re-decide it.
        const cfWrap = document.getElementById('chapter-filter');
        if (cfWrap) {
            cfWrap.value = '';
            cfWrap.placeholder = `Search ${rebuilt.total} chapters\u2026`;
            const st = document.getElementById('chapter-filter-status');
            if (st) st.textContent = '';
        }

        // Update state but don't load chapter yet — user hits Go
        currentChapterNum = resumeChapter;
        savedCharIndex = resumeChar;
        currentCharIndex = 0;

        // ⚠️ THE MODAL IS STILL OPEN, SO THIS MESSAGE IS BEHIND IT. (v3.19.1)
        //
        // This line is kept because it is correct and useful the moment the modal
        // closes — but it was the ONLY guidance after a book switch, and a student
        // choosing what to do next cannot read a page they cannot see. Jake hit
        // "Close" instead of "Go" for exactly this reason. The in-modal hint below
        // is the one that has to do the work.
        textStream.innerHTML = `<span style="color:#888;">Switched to <b>${escapeHtml(bookMetadata.title || currentBookId)}</b>. Pick a chapter and hit Go.</span>`;
        bookSwitchPending = true;
        isInputBlocked = true;

        // Say it where they are actually looking.
        const hint = document.getElementById('book-switch-hint');
        if (hint) {
            hint.innerHTML = `\u2713 Switched to <b>${escapeHtml(bookMetadata.title || currentBookId)}</b>.` +
                             `<br>Pick a chapter, then hit <b>Go</b>.`;
            hint.style.display = 'block';
        }

        // And make the footer button stop lying. "Close" is technically accurate —
        // it does close the modal — but after a book switch its handler ALSO loads
        // the chapter and starts the new book, which is a much bigger promise than
        // the word "Close" makes. Both buttons now name their outcome.
        const actionBtn = document.getElementById('action-btn');
        if (actionBtn) actionBtn.innerText = "Start Reading";
    };

    // "No school" is a valid permanent state, not a prompt to fix something —
    // never nag, never block, and never auto-select the first school.
    const schoolSel = document.getElementById('school-select');
    if (schoolSel) {
        schoolSel.onchange = async (e) => {
            const st = document.getElementById('school-status');
            const val = e.target.value;
            if (st) { st.textContent = 'Saving\u2026'; st.style.color = '#888'; }
            const ok = await saveStudentSchool(val);
            if (!st) return;
            if (!ok) { st.textContent = "Couldn't save."; st.style.color = '#D32F2F'; return; }
            st.textContent = val ? '\u2713 Saved' : '\u2713 No school';
            st.style.color = '#2E7D32';
            setTimeout(() => { if (st) st.textContent = ''; }, 2500);
        };
    }

    wireChapterFilter('chapter-filter', 'chapter-nav-select', 'chapter-filter-status', 'go-btn');

    document.getElementById('go-btn').onclick = () => {
        const val = document.getElementById('chapter-nav-select').value;
        if (!val) return;                       // "No chapters match" is not a target
        if (bookSwitchPending) {
            // After a book switch, just load the chapter — no restart prompt
            bookSwitchPending = false;
            // If they picked a different chapter than their saved one, reset position
            if (val != currentChapterNum) {
                savedCharIndex = 0;
            }
            currentChapterNum = val;
            currentCharIndex = 0;

            closeModal();
            textStream.innerHTML = "Loading...";
            loadChapter(val);
        } else if (val != currentChapterNum) {
            handleChapterSwitch(val);
        } else {
            if(confirm(`Restart Chapter ${val}?`)) switchChapterHot(val);
        }
    };

    const btn = document.getElementById('action-btn');
    btn.innerText = "Close";
    btn.onclick = () => {
        if (bookSwitchPending) {
            // They switched books but didn't hit Go — load the chapter first
            bookSwitchPending = false;
            const val = document.getElementById('chapter-nav-select').value;
            currentChapterNum = val;
            currentCharIndex = 0;

            closeModal();
            loadChapter(val);
        } else {
            closeModal();
            createHandGuide();
            if (!isGameActive) startGame();
        }
    };
    btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
    showModalPanel();
}

function handleChapterSwitch(newChapter) {
    if (newChapter != currentChapterNum) switchChapterHot(newChapter);
    else if(confirm(`Go back to Chapter ${newChapter}?`)) switchChapterHot(newChapter);
}

async function switchChapterHot(newChapter) {
    if (currentUser && !currentUser.isAnonymous) {
        await setDoc(doc(db, "users", currentUser.uid, "progress", currentBookId), {
            chapter: newChapter, charIndex: 0,
            ...progressStamp(newChapter), lastUpdated: new Date()
        }, { merge: true });
    }
    currentChapterNum = newChapter; savedCharIndex = 0; currentCharIndex = 0;
    closeModal(); textStream.innerHTML = "Switching..."; loadChapter(newChapter);
}

// --- KEYBOARD LAYOUTS ---
const LAYOUTS = {
    qwerty: {
        numRow:      ['`','1','2','3','4','5','6','7','8','9','0','-','='],
        numShiftRow: ['~','!','@','#','$','%','^','&','*','(',')','_','+'],
        rows:      [['q','w','e','r','t','y','u','i','o','p','[',']','\\'],['a','s','d','f','g','h','j','k','l',';',"'"],['z','x','c','v','b','n','m',',','.','/']],
        shiftRows: [['Q','W','E','R','T','Y','U','I','O','P','{','}','|'],['A','S','D','F','G','H','J','K','L',':','"'],['Z','X','C','V','B','N','M','<','>','?']]
    },
    dvorak: {
        numRow:      ['`','1','2','3','4','5','6','7','8','9','0','[',']'],
        numShiftRow: ['~','!','@','#','$','%','^','&','*','(',')' ,'{','}'],
        rows:      [["'",',','.','p','y','f','g','c','r','l','/','+','\\'],['a','o','e','u','i','d','h','t','n','s','-'],[';','q','j','k','x','b','m','w','v','z']],
        shiftRows: [['"','<','>','P','Y','F','G','C','R','L','?','=','|'],['A','O','E','U','I','D','H','T','N','S','_'],[':', 'Q','J','K','X','B','M','W','V','Z']]
    }
};

let currentLayout = localStorage.getItem('keyboardLayout') || 'qwerty';
let numRow = LAYOUTS[currentLayout].numRow;
let numShiftRow = LAYOUTS[currentLayout].numShiftRow;
let rows = LAYOUTS[currentLayout].rows;
let shiftRows = LAYOUTS[currentLayout].shiftRows;

function setKeyboardLayout(layout) {
    if (!LAYOUTS[layout]) return;
    currentLayout = layout;
    localStorage.setItem('keyboardLayout', layout);
    numRow = LAYOUTS[layout].numRow;
    numShiftRow = LAYOUTS[layout].numShiftRow;
    rows = LAYOUTS[layout].rows;
    shiftRows = LAYOUTS[layout].shiftRows;
    createKeyboard();
    buildFingerMap();
    // Recreate hand guide overlay for new key positions
    const old = document.getElementById('hand-guide-overlay');
    if (old) old.remove();
    createHandGuide();
    highlightCurrentChar();
}

function createKeyboard() {
    keyboardDiv.innerHTML = '';

    // Number row: dual-character keys + BACK
    const numDiv = document.createElement('div'); numDiv.className = 'kb-row';
    numRow.forEach((char, i) => {
        const key = document.createElement('div');
        key.className = 'key key-num';
        key.dataset.char = char;
        key.dataset.shift = numShiftRow[i];
        key.id = `key-${char}`;
        key.innerHTML = `<span class="num-symbol">${escapeHtml(numShiftRow[i])}</span><span class="num-digit">${escapeHtml(char)}</span>`;
        numDiv.appendChild(key);
    });
    addSpecialKey(numDiv, "BACK", null, 53);
    keyboardDiv.appendChild(numDiv);

    // Letter rows
    rows.forEach((rowChars, rIndex) => {
        const rowDiv = document.createElement('div'); rowDiv.className = 'kb-row';
        if (rIndex === 0) addSpecialKey(rowDiv, "TAB", null, 72);
        if (rIndex === 1) addSpecialKey(rowDiv, "CAPS", null, 80);
        if (rIndex === 2) addSpecialKey(rowDiv, "SHIFT", "key-SHIFT-L", 100);
        rowChars.forEach((char, cIndex) => {
            const key = document.createElement('div'); key.className = 'key'; key.innerText = char; key.dataset.char = char; key.dataset.shift = shiftRows[rIndex][cIndex]; key.id = `key-${char}`; rowDiv.appendChild(key);
        });
        if (rIndex === 1) addSpecialKey(rowDiv, "ENTER", null, 80);
        if (rIndex === 2) addSpecialKey(rowDiv, "SHIFT", "key-SHIFT-R", 100);
        keyboardDiv.appendChild(rowDiv);
    });

    // Space row
    const spaceRow = document.createElement('div'); spaceRow.className = 'kb-row';
    const space = document.createElement('div'); space.className = 'key space'; space.innerText = ""; space.id = "key- ";
    spaceRow.appendChild(space); keyboardDiv.appendChild(spaceRow);
}

function addSpecialKey(parent, text, customId, width) {
    const key = document.createElement('div'); key.className = 'key wide'; key.innerText = text;
    key.id = customId || `key-${text}`;
    if (width) key.style.width = width + 'px';
    parent.appendChild(key);
}

function toggleKeyboardCase(isShift) {
    document.querySelectorAll('.key').forEach(k => {
        if (k.classList.contains('key-num')) return; // number keys always show both
        if (k.dataset.char) k.innerText = isShift ? k.dataset.shift : k.dataset.char;
        if (k.id === 'key-SHIFT-L' || k.id === 'key-SHIFT-R') isShift ? k.classList.add('shift-active') : k.classList.remove('shift-active');
    });
}

function highlightKey(char) {
    document.querySelectorAll('.key').forEach(k => k.classList.remove('target'));
    let targetId = ''; let needsShift = false;
    if (char === ' ') targetId = 'key- '; else if (char === '\t') targetId = 'key-TAB'; else if (char === '\n') targetId = 'key-ENTER';
    else {
        const keys = Array.from(document.querySelectorAll('.key'));
        const found = keys.find(k => k.dataset.char === char || k.dataset.shift === char);
        if (found) { targetId = found.id; if (found.dataset.shift === char) needsShift = true; }
    }
    const el = document.getElementById(targetId); if (el) el.classList.add('target');
    toggleKeyboardCase(needsShift);
}

function flashKey(char) {
    let targetId = '';
    if (char === ' ') targetId = 'key- '; else if (char === '\t' || char === 'Tab') targetId = 'key-TAB'; else if (char === '\\n' || char === 'Enter') targetId = 'key-ENTER';
    else {
        const keys = Array.from(document.querySelectorAll('.key'));
        const found = keys.find(k => k.dataset.char === char || k.dataset.shift === char);
        if (found) targetId = found.id;
    }
    const el = document.getElementById(targetId);
    if (el) {
        el.style.backgroundColor = 'var(--brute-force-color)';
        setTimeout(() => {
            // Always restore to correct finger color (key colors show regardless of hand guide toggle)
            if (el.id === 'key- ') {
                el.style.backgroundColor = handGuideRainbow ? '#d0d0d0' : handGuideColor + '38';
                return;
            }
            if (el.id === 'key-ENTER' || el.id === 'key-BACK') {
                el.style.backgroundColor = getFingerColor('right-pinky') + '38'; return;
            }
            if (el.id === 'key-TAB') {
                el.style.backgroundColor = getFingerColor('left-pinky') + '38'; return;
            }
            if (el.id === 'key-SHIFT-L' || el.id === 'key-CAPS') {
                el.style.backgroundColor = getFingerColor('left-pinky') + '38'; return;
            }
            if (el.id === 'key-SHIFT-R') {
                el.style.backgroundColor = getFingerColor('right-pinky') + '38'; return;
            }
            const keyChar = el.dataset.char || '';
            const info = fingerMap[keyChar];
            if (info && info.finger && info.finger !== 'thumb') {
                el.style.backgroundColor = getFingerColor(info.finger) + '38';
            } else { el.style.backgroundColor = ''; }
        }, 200);
    }
}

// ========================
// HAND GUIDE (keyboard overlay - capsule fingers)
// ========================

function getHomeKeys() {
    const r = rows[1]; // home row
    return {
        'left-pinky':  r[0],  'left-ring':   r[1],  'left-middle': r[2],  'left-index':  r[3],
        'right-index': r[6],  'right-middle':r[7],  'right-ring':  r[8],  'right-pinky': r[9],
    };
}

const FINGER_NAMES = ['left-pinky','left-ring','left-middle','left-index',
                      'right-index','right-middle','right-ring','right-pinky'];

function buildFingerMap() {
    fingerMap = {};

    // Number row finger assignments
    const numAssign = ['left-pinky','left-pinky','left-ring','left-middle','left-index','left-index',
                       'right-index','right-index','right-middle','right-ring','right-pinky','right-pinky','right-pinky'];
    numRow.forEach((char, i) => {
        if (i >= numAssign.length) return;
        fingerMap[char] = { finger: numAssign[i], keyChar: char };
        if (numShiftRow[i]) {
            fingerMap[numShiftRow[i]] = { finger: numAssign[i], keyChar: char, shift: true };
        }
    });

    // Letter row finger assignments
    const assignments = [
        // Row 0 (top): up to 13 keys
        ['left-pinky','left-ring','left-middle','left-index','left-index',
         'right-index','right-index','right-middle','right-ring','right-pinky',
         'right-pinky','right-pinky','right-pinky'],
        // Row 1 (home): up to 11 keys
        ['left-pinky','left-ring','left-middle','left-index','left-index',
         'right-index','right-index','right-middle','right-ring','right-pinky','right-pinky'],
        // Row 2 (bottom): up to 10 keys
        ['left-pinky','left-ring','left-middle','left-index','left-index',
         'right-index','right-index','right-middle','right-ring','right-pinky'],
    ];
    rows.forEach((rowChars, rIndex) => {
        const assign = assignments[rIndex];
        if (!assign) return;
        rowChars.forEach((char, cIndex) => {
            if (cIndex >= assign.length) return;
            fingerMap[char] = { finger: assign[cIndex], keyChar: char };
            if (shiftRows[rIndex] && shiftRows[rIndex][cIndex]) {
                fingerMap[shiftRows[rIndex][cIndex]] = { finger: assign[cIndex], keyChar: char, shift: true };
            }
        });
    });
    fingerMap[' '] = { finger: 'thumb', keyChar: ' ' };
    fingerMap['\n'] = { finger: 'right-pinky', keyChar: 'ENTER' };
    fingerMap['\t'] = { finger: 'left-pinky', keyChar: 'TAB' };
}

function getFingerInfo(char) {
    if (fingerMap[char]) return fingerMap[char];
    const lower = char.toLowerCase();
    if (lower !== char && fingerMap[lower]) return { ...fingerMap[lower], shift: true };
    return null;
}

function getKeyCenterInKB(charOrId) {
    const kb = document.getElementById('virtual-keyboard');
    if (!kb) return null;
    let keyEl;
    if (charOrId === ' ') keyEl = document.getElementById('key- ');
    else if (charOrId === 'ENTER') keyEl = document.getElementById('key-ENTER');
    else if (charOrId === 'SHIFT-L') keyEl = document.getElementById('key-SHIFT-L');
    else if (charOrId === 'SHIFT-R') keyEl = document.getElementById('key-SHIFT-R');
    else keyEl = document.getElementById(`key-${charOrId}`);
    if (!keyEl) return null;
    const kbRect = kb.getBoundingClientRect();
    const keyRect = keyEl.getBoundingClientRect();
    // Offset by border so SVG coords align with overlay (which sits inside border)
    return {
        x: keyRect.left - kbRect.left - kb.clientLeft + keyRect.width / 2,
        y: keyRect.top - kbRect.top - kb.clientTop + keyRect.height / 2
    };
}

function createHandGuide() {
    const old = document.getElementById('hand-guide-overlay');
    if (old) old.remove();
    const kb = document.getElementById('virtual-keyboard');
    if (!kb) return;
    kb.style.position = 'relative';

    const overlay = document.createElement('div');
    overlay.id = 'hand-guide-overlay';
    if (!handGuideEnabled) overlay.classList.add('hidden');
    overlay.innerHTML = `<svg id="hg-svg" xmlns="http://www.w3.org/2000/svg"></svg>`;
    kb.appendChild(overlay);

    colorKeyboardKeys();
    requestAnimationFrame(() => buildFingerSVG());
}

function colorKeyboardKeys() {
    // Reset all keys
    document.querySelectorAll('.key').forEach(k => { k.style.backgroundColor = ''; });

    // Color each key based on its finger assignment
    Object.entries(fingerMap).forEach(([char, info]) => {
        if (!info.finger || info.shift || info.finger === 'thumb') return;
        const color = getFingerColor(info.finger);
        if (!color) return;
        let keyEl;
        if (char === ' ') keyEl = document.getElementById('key- ');
        else if (char === '\n') keyEl = document.getElementById('key-ENTER');
        else if (char === '\t') keyEl = document.getElementById('key-TAB');
        else keyEl = document.getElementById(`key-${char}`);
        if (keyEl) keyEl.style.backgroundColor = color + '38';
    });

    // Space bar: grey for rainbow, user color tint for single color
    const spaceEl = document.getElementById('key- ');
    if (spaceEl) {
        if (handGuideRainbow) {
            spaceEl.style.backgroundColor = '#d0d0d0';
        } else {
            spaceEl.style.backgroundColor = handGuideColor + '38';
        }
    }

    // Color special keys by their pinky finger
    const lp = getFingerColor('left-pinky') + '38';
    const rp = getFingerColor('right-pinky') + '38';
    const el = id => document.getElementById(id);
    if (el('key-TAB')) el('key-TAB').style.backgroundColor = lp;
    if (el('key-CAPS')) el('key-CAPS').style.backgroundColor = lp;
    if (el('key-SHIFT-L')) el('key-SHIFT-L').style.backgroundColor = lp;
    if (el('key-SHIFT-R')) el('key-SHIFT-R').style.backgroundColor = rp;
    if (el('key-ENTER')) el('key-ENTER').style.backgroundColor = rp;
    if (el('key-BACK')) el('key-BACK').style.backgroundColor = rp;
}

function buildFingerSVG() {
    const kb = document.getElementById('virtual-keyboard');
    const svg = document.getElementById('hg-svg');
    if (!kb || !svg) return;
    svg.innerHTML = '';
    svg.setAttribute('width', kb.clientWidth);
    svg.setAttribute('height', kb.clientHeight);
    svg.setAttribute('viewBox', `0 0 ${kb.clientWidth} ${kb.clientHeight}`);

    const homeKeys = getHomeKeys();
    const R = 11; // finger circle radius

    // Create each finger group: home circle + reach body + reach tip
    FINGER_NAMES.forEach(name => {
        const pos = getKeyCenterInKB(homeKeys[name]);
        if (!pos) return;
        const fc = getFingerColor(name);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = `hg-finger-${name}`;
        g.classList.add('hg-finger-group');
        g.style.setProperty('--fc', fc);

        // Reach body (thick line with round caps = capsule connector)
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        body.classList.add('hg-body');
        body.setAttribute('x1', pos.x); body.setAttribute('y1', pos.y);
        body.setAttribute('x2', pos.x); body.setAttribute('y2', pos.y);
        body.setAttribute('stroke-width', R * 2);
        body.setAttribute('stroke-linecap', 'round');
        g.appendChild(body);

        // Home circle (base of finger - always visible)
        const home = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        home.classList.add('hg-home');
        home.setAttribute('cx', pos.x); home.setAttribute('cy', pos.y);
        home.setAttribute('r', R);
        g.appendChild(home);

        // Fingertip circle (target end - only visible when reaching)
        const tip = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        tip.classList.add('hg-tip');
        tip.setAttribute('cx', pos.x); tip.setAttribute('cy', pos.y);
        tip.setAttribute('r', R);
        g.appendChild(tip);

        svg.appendChild(g);
    });

    updateHandGuide();
}

function updateHandGuide() {
    if (!handGuideEnabled) return;
    const svg = document.getElementById('hg-svg');
    if (!svg || !fullText || currentCharIndex >= fullText.length) return;

    const nextChar = fullText[currentCharIndex];
    const info = getFingerInfo(nextChar);
    const homeKeys = getHomeKeys();

    // Clear space bar highlight
    const spaceKeyReset = document.getElementById('key- ');
    if (spaceKeyReset) spaceKeyReset.classList.remove('space-active');

    // Reset all fingers to resting state
    svg.querySelectorAll('.hg-finger-group').forEach(g => {
        g.classList.remove('hg-active', 'hg-shift-active');
        const body = g.querySelector('.hg-body');
        const home = g.querySelector('.hg-home');
        const tip = g.querySelector('.hg-tip');
        const name = g.id.replace('hg-finger-', '');

        // Reset position to home
        const homePos = getKeyCenterInKB(homeKeys[name]);
        if (!homePos) return;
        if (body) {
            body.setAttribute('x1', homePos.x); body.setAttribute('y1', homePos.y);
            body.setAttribute('x2', homePos.x); body.setAttribute('y2', homePos.y);
        }
        if (tip) { tip.setAttribute('cx', homePos.x); tip.setAttribute('cy', homePos.y); }
    });

    if (!info) return;

    // Space: just highlight the bar (CSS handles thumb circles via ::before/::after)
    if (info.finger === 'thumb') {
        const spaceBar = document.getElementById('key- ');
        if (spaceBar) spaceBar.classList.add('space-active');
        return;
    }

    const fingerName = info.finger;
    const fingerG = document.getElementById(`hg-finger-${fingerName}`);
    if (!fingerG) return;

    // Find home and target positions
    const homeChar = homeKeys[fingerName];
    const homePos = homeChar ? getKeyCenterInKB(homeChar) : null;
    const targetPos = getKeyCenterInKB(info.keyChar);

    if (!homePos || !targetPos) return;

    // Stretch the finger from home to target
    const body = fingerG.querySelector('.hg-body');
    const tip = fingerG.querySelector('.hg-tip');
    if (body) {
        body.setAttribute('x1', homePos.x); body.setAttribute('y1', homePos.y);
        body.setAttribute('x2', targetPos.x); body.setAttribute('y2', targetPos.y);
    }
    if (tip) { tip.setAttribute('cx', targetPos.x); tip.setAttribute('cy', targetPos.y); }
    fingerG.classList.add('hg-active');

    // Shift: stretch opposite pinky to correct shift key
    if (info.shift) {
        const isLeftFinger = fingerName.startsWith('left');
        const shiftHand = isLeftFinger ? 'right' : 'left';
        const shiftKey = isLeftFinger ? 'SHIFT-R' : 'SHIFT-L';
        const shiftFingerG = document.getElementById(`hg-finger-${shiftHand}-pinky`);
        if (shiftFingerG) {
            const shiftHome = homeKeys[`${shiftHand}-pinky`];
            const shiftHomePos = shiftHome ? getKeyCenterInKB(shiftHome) : null;
            const shiftTargetPos = getKeyCenterInKB(shiftKey);
            if (shiftHomePos && shiftTargetPos) {
                const sBody = shiftFingerG.querySelector('.hg-body');
                const sTip = shiftFingerG.querySelector('.hg-tip');
                if (sBody) {
                    sBody.setAttribute('x1', shiftHomePos.x); sBody.setAttribute('y1', shiftHomePos.y);
                    sBody.setAttribute('x2', shiftTargetPos.x); sBody.setAttribute('y2', shiftTargetPos.y);
                }
                if (sTip) { sTip.setAttribute('cx', shiftTargetPos.x); sTip.setAttribute('cy', shiftTargetPos.y); }
            }
            shiftFingerG.classList.add('hg-shift-active');
        }
    }
}

function flashFingerPressed() {
    if (!handGuideEnabled) return;
    const svg = document.getElementById('hg-svg');
    if (!svg) return;
    svg.querySelectorAll('.hg-active').forEach(g => {
        g.classList.add('hg-pressed');
        setTimeout(() => g.classList.remove('hg-pressed'), 120);
    });
    // Flash space bar on press
    const spaceKey = document.getElementById('key- ');
    if (spaceKey && spaceKey.classList.contains('space-active')) {
        spaceKey.classList.add('space-pressed');
        setTimeout(() => spaceKey.classList.remove('space-pressed'), 120);
    }
}

let hgResizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(hgResizeTimer);
    hgResizeTimer = setTimeout(() => {
        const old = document.getElementById('hand-guide-overlay');
        if (old) old.remove();
        createHandGuide();
    }, 200);
});

// --- CELEBRATIONS ---
// Find the start position of the sentence containing pos. Used by hard-stop
// to roll the cursor back to the start of the failed sentence — user retypes.
// Mirrors the boundary logic in getSentenceMap.
function findSentenceStartFor(pos) {
    if (!fullText || pos <= 0) return 0;
    let i = Math.min(pos, fullText.length - 1);
    while (i > 0) {
        const ch = fullText[i - 1];
        const next = fullText[i];
        if (ch === '\n') return i;
        if ((ch === '.' || ch === '!' || ch === '?') &&
            (next === ' ' || next === '\n')) {
            // Skip past whitespace and any closing quote to land on the
            // next sentence's first real character.
            let j = i;
            while (j < fullText.length &&
                   (fullText[j] === ' ' || fullText[j] === '\n' ||
                    fullText[j] === '\t' || fullText[j] === '"' ||
                    fullText[j] === "'")) {
                j++;
            }
            return j;
        }
        i--;
    }
    return 0;
}

// ─── FLIP BACK (v3.17.0) — Game Genie's navigation, for students, bounded ────
//
// Jake: "Why not give students the aspect of Game Genie that jumps to any chapter
// and any sentence in the chapter, but limit it to previous to where they are now?"
//
// ⚠️ THE CEILING IS `furthest`, NOT THE CURRENT POSITION, AND THE DIFFERENCE IS THE
// WHOLE FEATURE. Bounding by where the student is standing collapses the moment they
// use it: flip back to Ch. 2 and Ch. 3 is now "ahead", so the tool that just moved
// them can no longer move them home. Bounding by furthest gives free movement across
// everything they have already earned and still no way past the frontier. It is more
// useful and exactly as permissive.
//
// ⚠️ Cross-chapter jumps are TWO-STEP by necessity: the sentence map is built from
// `fullText`, which only exists for the chapter that is loaded. Picking a chapter
// loads it and reopens this modal at the sentence step. Do not try to collapse that
// into one screen without prefetching every chapter, which for Aesop is 284 reads.
//
// Known and accepted: sentence-level backjump makes it easy to loop a memorised
// sentence and inflate WPM. Not a new hole — restart-chapter (v3.16.0) and practice
// mode both already allow it — but tighter. Flagged to Jake before shipping.
function flipBackCeiling() {
    if (currentUser && !currentUser.isAnonymous && furthestChapter &&
        isKnownBodyChapter(furthestChapter) &&
        isPositionAhead(furthestChapter, furthestCharIndex, currentChapterNum, currentCharIndex)) {
        return { chapter: furthestChapter, charIndex: furthestCharIndex };
    }
    return { chapter: currentChapterNum, charIndex: currentCharIndex };
}

// True when there is anywhere at all to go — an earlier chapter, or earlier text in
// this one. Gates the link so it never appears as a button that does nothing.
function canFlipBack() {
    if (currentCharIndex > 0) return true;
    const list = bodyChapterList();
    if (!list.length) return false;
    return chapterKey(list[0].id) !== chapterKey(currentChapterNum);
}

function openFlipBack() {
    if (isGameActive) { isGameActive = false; clearInterval(timerInterval); }

    const ceiling   = flipBackCeiling();
    const sentences = getSentenceMap();
    const here      = getCurrentSentence(sentences);

    // On the frontier chapter the student may not pass their own furthest point;
    // in any earlier chapter every sentence is by definition already behind it.
    const onFrontier = chapterKey(ceiling.chapter) === chapterKey(currentChapterNum);
    let lastAllowed  = sentences.length - 1;
    if (onFrontier) {
        for (let i = 0; i < sentences.length; i++) {
            if (ceiling.charIndex < sentences[i].end) { lastAllowed = i; break; }
        }
    }

    const build     = buildChapterOptions(currentChapterNum, '', true, ceiling.chapter);
    const useFilter = build.total > CHAPTER_FILTER_MIN;

    // Sentences are shown as TEXT, not numbers. A student choosing where to resume is
    // looking for a moment they remember, and "Sentence 84" is not a moment.
    let sentOpts = '';
    for (let i = 0; i <= lastAllowed; i++) {
        const raw = fullText.slice(sentences[i].start, sentences[i].end).replace(/\s+/g, ' ').trim();
        const txt = raw.length > 72 ? raw.slice(0, 72) + '\u2026' : raw;
        const sel = (i === here) ? ' selected' : '';
        sentOpts += `<option value="${i}"${sel}>${escapeHtml(txt || '\u2014')}</option>`;
    }

    isModalOpen = true; isInputBlocked = false;
    modalGeneration++;
    setModalTitle('\u{1F4D6} Flip Back');

    const btn = 'background:#f8f8f8; border:1px solid #bbb; padding:4px 10px; cursor:pointer; ' +
                'font-family:inherit; border-radius:3px; font-size:0.85em;';
    const field = 'flex:1; background:#fff; border:1px solid #ccc; padding:4px; ' +
                  'font-family:inherit; font-size:0.9em; border-radius:3px; min-width:0;';

    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:left; width:78%; margin:0 auto; font-size:0.85em;">
            <div style="color:#777; margin-bottom:8px;">
                Go back to anything you've already typed. You can't skip ahead.
            </div>
            ${useFilter ? `
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:4px;">
                <input type="text" id="fb-chapter-filter" placeholder="Search ${build.total} chapters\u2026"
                       autocomplete="off" style="${field}">
                <span id="fb-chapter-filter-status" style="font-size:0.85em; color:#888; min-width:56px;"></span>
            </div>` : ''}
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:10px;">
                <select id="fb-chapter-select" style="${field}">${build.html}</select>
                <button id="fb-chapter-go" style="${btn}">Go</button>
            </div>
            <div style="color:#777; margin-bottom:4px;">Start from:</div>
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:10px;">
                <select id="fb-sentence-select" style="${field}">${sentOpts}</select>
                <button id="fb-sentence-go" style="${btn}">Go</button>
            </div>
            <div style="display:flex; gap:8px; justify-content:center;">
                <button id="fb-chapter-start" style="${btn}">\u21A9\uFE0E Top of this chapter</button>
                <button id="fb-cancel" style="${btn}">Cancel</button>
            </div>
        </div>
    `;

    if (useFilter) {
        wireChapterFilter('fb-chapter-filter', 'fb-chapter-select',
                          'fb-chapter-filter-status', 'fb-chapter-go', ceiling.chapter);
    }

    // Land at the top of the chosen chapter, then reopen here so the student can
    // pick a sentence inside it — the second half of the two-step.
    document.getElementById('fb-chapter-go').onclick = async () => {
        const target = document.getElementById('fb-chapter-select').value;
        if (!target || chapterKey(target) === chapterKey(currentChapterNum)) {
            await flipBackTo(0); return;
        }
        currentChapterNum = target;
        savedCharIndex = 0; currentCharIndex = 0;
        try { await saveProgress(true); } catch (_) { /* WAL has it */ }
        closeModal();
        await loadChapter(target);
        openFlipBack();
    };

    document.getElementById('fb-sentence-go').onclick = async () => {
        const idx = parseInt(document.getElementById('fb-sentence-select').value, 10);
        await flipBackTo(isNaN(idx) ? 0 : idx);
    };

    document.getElementById('fb-chapter-start').onclick = async () => { await flipBackTo(0); };
    document.getElementById('fb-cancel').onclick = () => { closeModal(); showStartModal('Start'); };

    document.getElementById('modal-footer').innerHTML = '';
    showModalPanel();
}

// ⚠️ Clamped against `lastAllowed` a SECOND time, here, rather than trusting the
// select to only contain legal values. The picker is rebuilt by the filter box on
// every keystroke and a stale option can survive a re-render.
async function flipBackTo(sentIdx) {
    const sentences = getSentenceMap();
    if (!sentences.length) { closeModal(); showStartModal('Start'); return; }

    const ceiling = flipBackCeiling();
    let cap = sentences.length - 1;
    if (chapterKey(ceiling.chapter) === chapterKey(currentChapterNum)) {
        for (let i = 0; i < sentences.length; i++) {
            if (ceiling.charIndex < sentences[i].end) { cap = i; break; }
        }
    }
    jumpToSentence(sentences, Math.max(0, Math.min(sentIdx, cap)));
    // jumpToSentence sets savedCharIndex but writes nothing; persist so closing the
    // tab does not silently undo a move the student deliberately made.
    try { await saveProgress(true); } catch (_) { /* WAL has it */ }
    closeModal();
    showStartModal('Start');
}

// --- GAME GENIE (Admin Debug Tool) ---
function getSentenceMap() {
    const sentences = [];
    let sentStart = 0;
    for (let i = 0; i < fullText.length; i++) {
        const ch = fullText[i];
        if (ch === '.' || ch === '!' || ch === '?') {
            // Check if next char is space, newline, quote, or end
            const next = fullText[i + 1];
            if (!next || next === ' ' || next === '\n' || next === '"' || next === "'") {
                // Find the real end (include closing quote if present)
                let end = i + 1;
                if (next === '"' || next === "'") end = i + 2;
                sentences.push({ start: sentStart, end: Math.min(end, fullText.length) });
                // Skip whitespace to find next sentence start
                let j = end;
                while (j < fullText.length && (fullText[j] === ' ' || fullText[j] === '\n' || fullText[j] === '\t')) j++;
                sentStart = j;
            }
        } else if (ch === '\n' && i > sentStart) {
            // Paragraph break = sentence boundary
            sentences.push({ start: sentStart, end: i });
            let j = i + 1;
            while (j < fullText.length && (fullText[j] === ' ' || fullText[j] === '\n' || fullText[j] === '\t')) j++;
            sentStart = j;
        }
    }
    // Catch trailing text
    if (sentStart < fullText.length) {
        sentences.push({ start: sentStart, end: fullText.length });
    }
    return sentences;
}

function getCurrentSentence(sentences) {
    for (let i = 0; i < sentences.length; i++) {
        if (currentCharIndex < sentences[i].end) return i;
    }
    return sentences.length - 1;
}

function jumpToSentence(sentences, idx) {
    idx = Math.max(0, Math.min(idx, sentences.length - 1));
    const target = sentences[idx].start;

    // Reset game state
    if (isGameActive) { isGameActive = false; clearInterval(timerInterval); }

    currentCharIndex = target;
    savedCharIndex = target;
    sprintCharStart = target;
    sprintSeconds = 0; sprintMistakes = 0;
    resetSprintLogWatermark();

    // Re-render and mark everything before current as done
    renderText();
    for (let i = 0; i < currentCharIndex; i++) {
        const el = document.getElementById(`char-${i}`);
        if (el) {
            el.classList.remove('active');
            if (!el.classList.contains('space') && !el.classList.contains('enter') && !el.classList.contains('tab')) {
                el.classList.add('done-perfect');
            }
        }
    }
    highlightCurrentChar();
    centerView();
    saveProgress();

    // Adventure mode: the renderer tracks position via events, so a Game
    // Genie warp must announce itself or the canvas keeps showing the old
    // spot while the (hidden) classic DOM moves.
    _ttbEmit('positionSet', { position: currentCharIndex });

    // Show start modal for this position
    showStartModal("Resume");
}

function openGameGenie() {
    if (!currentUser || !ADMIN_EMAILS.includes(currentUser.email)) return;
    if (isGameActive) { isGameActive = false; clearInterval(timerInterval); }

    // Save real position on first open (before any warps)
    if (ggRealCharIndex < 0) ggRealCharIndex = currentCharIndex;

    const sentences = getSentenceMap();
    const currentSent = getCurrentSentence(sentences);
    const pct = fullText.length > 0 ? Math.round((currentCharIndex / fullText.length) * 100) : 0;
    const realSent = (() => { for (let i = 0; i < sentences.length; i++) { if (ggRealCharIndex < sentences[i].end) return i; } return sentences.length - 1; })();
    const hasWarped = ggRealCharIndex !== currentCharIndex;
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    const estMinutes = Math.round(wordCount / 40); // ~40 WPM typing speed estimate
    const segCount = bookData ? bookData.segments.length : 0;
    const isInfinite = sessionValueStr === 'infinity';

    isModalOpen = true; isInputBlocked = false;
    modalGeneration++;
    setModalTitle('🔥 GAME GENIE 🔥');

    const ggBtn = 'background:#333; color:#ff6600; border:1px solid #ff6600; padding:4px 8px; cursor:pointer; font-family:inherit; border-radius:3px; font-size:0.8em;';

    // Build chapter options — third caller of the shared builder.
    const ggBuild  = buildChapterOptions(currentChapterNum, '');
    const chapOpts = ggBuild.html;
    const ggFilter = ggBuild.total > CHAPTER_FILTER_MIN;

    document.getElementById('modal-body').innerHTML = `
        <div style="font-family: 'Courier Prime', monospace; text-align: left; width: 60%; margin: 0 auto; font-size: 0.8em;">
            ${ggFilter ? `
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:4px;">
                <input type="text" id="gg-chapter-filter" placeholder="Search ${ggBuild.total} chapters\u2026"
                       autocomplete="off" style="flex:1; background:#f8f8f8; border:1px solid #ccc; padding:3px 4px; font-family:inherit; font-size:0.9em; border-radius:3px;">
                <span id="gg-chapter-filter-status" style="font-size:0.85em; color:#888; min-width:56px;"></span>
            </div>` : ''}
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
                <select id="gg-chapter-select" style="flex:1; background:#f8f8f8; border:1px solid #ccc; padding:3px 4px; font-family:inherit; font-size:0.9em; border-radius:3px;">${chapOpts}</select>
                <button id="gg-chapter-go" style="${ggBtn}">Jump Ch.</button>
                <button id="gg-reset-ch" style="${ggBtn}" title="Reset to start of chapter">⟲ Reset</button>
            </div>

            <div style="display:flex; justify-content:space-between; margin-bottom:2px; font-size:0.85em; color:#888;">
                <span>Char ${currentCharIndex.toLocaleString()} / ${fullText.length.toLocaleString()} · ${wordCount.toLocaleString()} words · ${segCount} segs · ~${estMinutes}min</span>
                <span>${pct}%</span>
            </div>
            <div id="gg-slider-track" style="height:12px; background:#eee; border-radius:6px; overflow:visible; margin-bottom:6px; cursor:pointer; position:relative;">
                <div id="gg-slider-fill" style="height:100%; width:${pct}%; background: linear-gradient(90deg, #ff6600, #ff0000, #ff6600); border-radius:6px; pointer-events:none;"></div>
                <div id="gg-slider-thumb" style="position:absolute; top:-2px; left:${pct}%; width:16px; height:16px; background:#ff6600; border:2px solid #fff; border-radius:50%; transform:translateX(-50%); cursor:grab; box-shadow:0 0 6px rgba(255,102,0,0.5);"></div>
            </div>

            <div style="display:flex; align-items:center; gap:4px; margin-bottom:6px;">
                <button id="gg-start" style="${ggBtn}">Start</button>
                <button id="gg-back10" style="${ggBtn}">-10</button>
                <button id="gg-back1" style="${ggBtn}">-1</button>
                <div style="flex:1; text-align:center; font-weight:bold;">
                    Sentence <span style="color:#ff6600;">${currentSent + 1}</span> / ${sentences.length}
                </div>
                <button id="gg-fwd1" style="${ggBtn}">+1</button>
                <button id="gg-fwd10" style="${ggBtn}">+10</button>
                <button id="gg-end" style="${ggBtn}">End</button>
            </div>

            <div style="display:flex; justify-content:center; gap:6px; align-items:center; margin-bottom:6px;">
                <label style="font-size:0.85em;">Warp #</label>
                <input id="gg-jump-input" type="number" min="1" max="${sentences.length}" value="${currentSent + 1}" 
                       style="width:60px; background:#f8f8f8; border:1px solid #ccc; padding:3px 4px; font-family:inherit; font-size:0.85em; border-radius:3px; text-align:center;">
                <button id="gg-jump-btn" style="background:#ff6600; color:#fff; border:none; padding:4px 10px; cursor:pointer; font-family:inherit; font-weight:bold; border-radius:3px; font-size:0.85em;">WARP</button>
                ${hasWarped ? `<button id="gg-return-btn" style="background:#224422; color:#88ff88; border:1px solid #44aa44; padding:4px 8px; cursor:pointer; font-family:inherit; border-radius:3px; font-size:0.75em;" title="Return to sentence ${realSent + 1}">↩ Return</button>` : ''}
            </div>

            <div id="gg-preview" style="font-size:0.8em; color:#888; background:#f5f5f5; padding:4px 6px; border-radius:3px; max-height:32px; overflow:hidden; line-height:1.3; margin-bottom:6px;">
                ${escapeHtml(fullText.substring(sentences[currentSent].start, sentences[currentSent].start + 120))}${sentences[currentSent].end - sentences[currentSent].start > 120 ? '...' : ''}
            </div>

            <div style="display:flex; justify-content:center; gap:6px; align-items:center;">
                <button id="gg-infinite" style="${isInfinite ? 'background:#ff6600; color:#fff;' : 'background:#333; color:#ff6600;'} border:1px solid #ff6600; padding:4px 12px; cursor:pointer; font-family:inherit; border-radius:3px; font-size:0.85em; font-weight:bold;" title="Toggle infinite session (no sprint timer)">${isInfinite ? '∞ INFINITE ON' : '∞ Infinite Mode'}</button>
            </div>

            <div style="margin-top:8px; padding-top:6px; border-top:1px solid #ddd;">
                <div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start;">
                    <div>
                        <div style="font-size:0.7em; color:#666; margin-bottom:3px;">Test Text</div>
                        <div style="display:flex; gap:4px;">
                            <button id="gg-test-pangram" style="${ggBtn}" title="All letters + numbers + quotes">🦊 Pangram</button>
                            <button id="gg-test-alphabet" style="${ggBtn}" title="A-Z + 0-9">🔤 ABC</button>
                        </div>
                    </div>
                    <div>
                        <div style="font-size:0.7em; color:#666; margin-bottom:3px;">Toggles</div>
                        <label style="display:flex; align-items:center; gap:3px; font-size:0.7em; color:${ggAllowMistakes ? '#ff6600' : '#888'}; cursor:pointer;">
                            <input type="checkbox" id="gg-allow-mistakes" ${ggAllowMistakes ? 'checked' : ''}> Mistakes OK
                        </label>
                        <label style="display:flex; align-items:center; gap:3px; font-size:0.7em; color:${ggBypassIdle ? '#ff6600' : '#888'}; cursor:pointer; margin-top:2px;">
                            <input type="checkbox" id="gg-bypass-idle" ${ggBypassIdle ? 'checked' : ''}> No Idle
                        </label>
                    </div>
                    <div>
                        <div style="font-size:0.7em; color:#666; margin-bottom:3px;">Debug</div>
                        <div style="display:flex; flex-direction:column; gap:3px;">
                            <button id="gg-reset-practice" style="${ggBtn}" title="Reset AI practice cooldown & count">✨ AI Reset</button>
                            <button id="gg-clear-missed" style="${ggBtn}" title="Clear missed characters map">🧹 Missed</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    resetModalFooter();
    const btn = document.getElementById('action-btn');
    btn.innerText = 'Close'; btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
    const ggClose = () => { ggRealCharIndex = -1; closeModal(); startGame(); };
    btn.onclick = ggClose;
    // Allow smart-start typing to close GG and begin typing
    modalActionCallback = ggClose;
    showModalPanel();

    // Wire up
    const s = sentences;
    const cur = currentSent;

    document.getElementById('gg-start').onclick = () => { jumpToSentence(s, 0); openGameGenie(); };
    document.getElementById('gg-back10').onclick = () => { jumpToSentence(s, cur - 10); openGameGenie(); };
    document.getElementById('gg-back1').onclick = () => { jumpToSentence(s, cur - 1); openGameGenie(); };
    document.getElementById('gg-fwd1').onclick = () => { jumpToSentence(s, cur + 1); openGameGenie(); };
    document.getElementById('gg-fwd10').onclick = () => { jumpToSentence(s, cur + 10); openGameGenie(); };
    document.getElementById('gg-end').onclick = () => { jumpToSentence(s, s.length - 1); openGameGenie(); };

    // Chapter jump
    wireChapterFilter('gg-chapter-filter', 'gg-chapter-select', 'gg-chapter-filter-status', 'gg-chapter-go');

    document.getElementById('gg-chapter-go').onclick = async () => {
        const targetChap = document.getElementById('gg-chapter-select').value;
        if (!targetChap) return;
        if (targetChap == currentChapterNum) return; // same chapter, do nothing
        ggRealCharIndex = -1;
        currentChapterNum = targetChap;
        savedCharIndex = 0; currentCharIndex = 0;
        if (currentUser && !currentUser.isAnonymous) {
            await setDoc(doc(db, "users", currentUser.uid, "progress", currentBookId), {
                chapter: currentChapterNum, charIndex: 0,
                ...progressStamp(currentChapterNum), lastUpdated: new Date()
            }, { merge: true });
        }
        closeModal();
        await loadChapter(targetChap);
        openGameGenie();
    };

    // Reset chapter
    document.getElementById('gg-reset-ch').onclick = () => {
        ggRealCharIndex = -1;
        jumpToSentence(s, 0);
        openGameGenie();
    };

    // Infinite mode toggle
    document.getElementById('gg-infinite').onclick = () => {
        if (sessionValueStr === 'infinity') {
            sessionValueStr = '30'; sessionLimit = 30;
        } else {
            sessionValueStr = 'infinity'; sessionLimit = 'infinity';
        }
        localStorage.setItem('ttb_sessionLength', sessionValueStr);
        openGameGenie(); // refresh UI
    };

    // Test text buttons
    document.getElementById('gg-test-pangram').onclick = () => {
        ggRealCharIndex = -1;
        closeModal();
        startTestText(TEST_TEXT_PANGRAM, 'Pangram');
    };
    document.getElementById('gg-test-alphabet').onclick = () => {
        ggRealCharIndex = -1;
        closeModal();
        startTestText(TEST_TEXT_ALPHABET, 'Alphabet');
    };
    document.getElementById('gg-allow-mistakes').onchange = (e) => {
        ggAllowMistakes = e.target.checked;
    };
    document.getElementById('gg-bypass-idle').onchange = (e) => {
        ggBypassIdle = e.target.checked;
    };
    document.getElementById('gg-reset-practice').onclick = () => {
        practiceTypingAccumulator = 9999;
        hasDonePractice = true;
        alert('AI practice unlocked! Cooldown reset. (Server-side 5/day limit still applies.)');
    };
    document.getElementById('gg-clear-missed').onclick = () => {
        missedCharsMap = {};
        alert('Missed characters cleared.');
    };

    // Return button
    if (document.getElementById('gg-return-btn')) {
        document.getElementById('gg-return-btn').onclick = () => {
            const realIdx = ggRealCharIndex;
            ggRealCharIndex = -1;
            currentCharIndex = realIdx;
            savedCharIndex = realIdx;
            sprintCharStart = realIdx;
            renderText();
            for (let i = 0; i < currentCharIndex; i++) {
                const el = document.getElementById(`char-${i}`);
                if (el) { el.classList.remove('active'); if (!el.classList.contains('space') && !el.classList.contains('enter') && !el.classList.contains('tab')) el.classList.add('done-perfect'); }
            }
            highlightCurrentChar(); centerView(); saveProgress();
            openGameGenie();
        };
    }

    // Warp input
    document.getElementById('gg-jump-btn').onclick = () => {
        const target = parseInt(document.getElementById('gg-jump-input').value) - 1;
        if (!isNaN(target)) { jumpToSentence(s, target); openGameGenie(); }
    };
    document.getElementById('gg-jump-input').oninput = () => {
        const target = parseInt(document.getElementById('gg-jump-input').value) - 1;
        if (!isNaN(target) && target >= 0 && target < s.length) {
            const preview = document.getElementById('gg-preview');
            if (preview) {
                preview.textContent = fullText.substring(s[target].start, s[target].start + 120) + (s[target].end - s[target].start > 120 ? '...' : '');
            }
        }
    };
    document.getElementById('gg-jump-input').onkeydown = (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); document.getElementById('gg-jump-btn').click(); }
    };

    // Draggable slider
    const track = document.getElementById('gg-slider-track');
    const thumb = document.getElementById('gg-slider-thumb');
    const fill = document.getElementById('gg-slider-fill');

    function sliderJump(clientX) {
        const rect = track.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const targetChar = Math.round(ratio * fullText.length);
        let nearest = 0;
        for (let i = 0; i < s.length; i++) {
            if (s[i].start <= targetChar) nearest = i;
            else break;
        }
        const newPct = Math.round((s[nearest].start / fullText.length) * 100);
        thumb.style.left = newPct + '%';
        fill.style.width = newPct + '%';
        return nearest;
    }

    let dragging = false;
    let dragTarget = 0;

    const onMove = (clientX) => {
        if (!dragging) return;
        dragTarget = sliderJump(clientX);
        const preview = document.getElementById('gg-preview');
        if (preview) preview.textContent = fullText.substring(s[dragTarget].start, s[dragTarget].start + 120) + (s[dragTarget].end - s[dragTarget].start > 120 ? '...' : '');
    };

    const onUp = () => {
        if (!dragging) return;
        dragging = false;
        thumb.style.cursor = 'grab';
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', touchMove);
        document.removeEventListener('touchend', onUp);
        jumpToSentence(s, dragTarget);
        openGameGenie();
    };

    const mouseMove = (ev) => onMove(ev.clientX);
    const touchMove = (ev) => { ev.preventDefault(); onMove(ev.touches[0].clientX); };

    const startDrag = (clientX) => {
        dragging = true;
        thumb.style.cursor = 'grabbing';
        document.addEventListener('mousemove', mouseMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', touchMove, { passive: false });
        document.addEventListener('touchend', onUp);
        onMove(clientX);
    };

    thumb.onmousedown = (ev) => { ev.preventDefault(); startDrag(ev.clientX); };
    thumb.ontouchstart = (ev) => { ev.preventDefault(); startDrag(ev.touches[0].clientX); };
    track.onclick = (ev) => {
        const nearest = sliderJump(ev.clientX);
        jumpToSentence(s, nearest);
        openGameGenie();
    };
}

// === LEADERBOARD SYSTEM ===

// ONE read of users/{uid}/profile/info per session, shared by loadInitials()
// and resolveViewMode(). Split out in v3.5.0 because the view mode has to be
// known BEFORE loadUserProgress() — loadChapter() emits textLoaded, and that
// emit needs the right renderer already listening — whereas initials are
// wanted at the end of the chain. Two consumers, still one read.
async function loadProfileInfo() {
    if (!currentUser || currentUser.isAnonymous) { profileInfo = null; return null; }
    try {
        const snap = await getDoc(doc(db, "users", currentUser.uid, "profile", "info"));
        profileInfo = snap.exists() ? snap.data() : {};
    } catch(e) {
        console.warn("Load profile failed:", e);
        profileInfo = {};
    }
    return profileInfo;
}

async function loadInitials() {
    if (!currentUser || currentUser.isAnonymous) return false;
    if (!profileInfo) await loadProfileInfo();
    const data = profileInfo || {};
    if (data.initials) userInitials = data.initials;
    if (data.leaderboardOptOut !== undefined) leaderboardOptOut = data.leaderboardOptOut;
    if (userInitials) return false;
    // No initials yet — prompt
    showInitialsPrompt();
    return true;
}

async function saveInitials(initials) {
    if (!currentUser || currentUser.isAnonymous) return;
    try {
        await setDoc(doc(db, "users", currentUser.uid, "profile", "info"), { 
            initials, 
            leaderboardOptOut 
        }, { merge: true });
    } catch(e) { console.warn("Save initials failed:", e); }
}

function showInitialsPrompt() {
    isModalOpen = true; isInputBlocked = true;
    modalActionCallback = null;
    setModalTitle('');
    resetModalFooter();

    const prefill = getDefaultInitials();

    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:center;">
            <div class="stats-title">🏆 Enter Your Initials</div>
            <div style="font-size:0.9em; color:#555; margin: 6px 0 12px;">
                These appear on the leaderboard. Three characters max!
            </div>
            <div style="display:flex; justify-content:center; gap:8px;" id="initials-boxes">
                <input class="initials-box" maxlength="1" data-idx="0" value="${prefill[0] || ''}" autocomplete="off" autocapitalize="characters">
                <input class="initials-box" maxlength="1" data-idx="1" value="${prefill[1] || ''}" autocomplete="off" autocapitalize="characters">
                <input class="initials-box" maxlength="1" data-idx="2" autocomplete="off" autocapitalize="characters">
            </div>
            <div id="initials-error" style="color:#D32F2F; font-size:0.8em; margin-top:6px; min-height:1.2em;"></div>
        </div>
    `;

    const btn = document.getElementById('action-btn');
    btn.innerText = 'Save'; btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
    btn.onclick = async () => {
        const boxes = document.querySelectorAll('.initials-box');
        const val = Array.from(boxes).map(b => b.value).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (val.length === 0) return;
        if (!isInitialsClean(val)) {
            const errEl = document.getElementById('initials-error');
            if (errEl) errEl.textContent = "Those initials aren't allowed. Try something else!";
            return;
        }
        userInitials = val.substring(0, 3);
        await saveInitials(userInitials);
        closeModal();

        // After first-time initials, check if furthest point is ahead
        if (isPositionAhead(furthestChapter, furthestCharIndex, currentChapterNum, currentCharIndex)) {
            showJumpToProgressPrompt(furthestChapter, furthestCharIndex);
            return;
        }

        showStartModal("Start");
    };
    showModalPanel();

    // Wire up auto-advance
    setTimeout(() => {
        const boxes = document.querySelectorAll('.initials-box');
        boxes.forEach((box, i) => {
            box.oninput = () => {
                box.value = box.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (box.value && i < 2) boxes[i + 1].focus();
                // Clear error on edit
                const errEl = document.getElementById('initials-error');
                if (errEl) errEl.textContent = '';
            };
            box.onkeydown = (e) => {
                if (e.key === 'Backspace' && !box.value && i > 0) {
                    boxes[i - 1].focus();
                    boxes[i - 1].value = '';
                } else if (e.key === 'Enter') {
                    btn.click();
                }
            };
        });
        // Focus the first empty box (after prefill)
        const firstEmpty = Array.from(boxes).findIndex(b => !b.value);
        (firstEmpty >= 0 ? boxes[firstEmpty] : boxes[2]).focus();
        isInputBlocked = false;
    }, 100);
}

// Read the student's own leaderboard doc. Once per session — we are the only
// writer for it, so the in-memory copy stays true. Returns {} if it's new.
async function loadOwnLeaderboardEntry() {
    if (lbOwnEntry) return lbOwnEntry;
    try {
        const lbSnap = await getDoc(doc(db, "leaderboard", currentUser.uid));
        lbOwnEntry = lbSnap.exists() ? lbSnap.data() : {};
    } catch (e) {
        console.warn("Own leaderboard entry read failed:", e);
        lbOwnEntry = {};
    }
    return lbOwnEntry;
}

// Push the in-memory entry to Firestore, including any week-seconds we've been
// holding back. Called on a new PB, on the 2-minute gap, and on tab-hide.
async function flushLeaderboard() {
    if (!lbDirty || !currentUser || currentUser.isAnonymous || !userInitials) return;
    if (!lbOwnEntry) return;
    lbDirty = false;
    const secondsToAdd = lbPendingSeconds;
    const priorSeconds = lbOwnEntry.totalSecondsWeek || 0;
    lbPendingSeconds = 0;
    try {
        // ⚠️ v3.32.0 — DERIVED FROM statsData, NOT ACCUMULATED SEPARATELY.
        //
        // This was the LAST independent counter of a student's time in the app,
        // and it was an honest gap in the "one number" claim: it summed its own
        // `lbPendingSeconds` bucket, so a lost or retried leaderboard write moved
        // it out of step with the graded figure permanently, with nothing
        // anywhere to notice.
        //
        // `statsData.secondsWeek` is itself derived — the sum of the seven daily
        // documents, recomputed at load (daylog.js) and ticked upward since. So
        // taking it here makes the board a VIEW of the same record everything
        // else reads, and a failed write costs nothing: the next flush simply
        // reads the current value again instead of replaying a bucket.
        //
        // ⚠️ THE ACCUMULATOR IS KEPT AS A FLOOR, NOT AS THE SOURCE. A guest
        // stretch, or a load whose week read was refused (readWeek ok:false),
        // can leave statsData.secondsWeek below what this session has genuinely
        // banked into the board. Taking the larger can only fail toward the
        // student's own observed number, which is the same discipline
        // mergeGuestStats() uses and for the same reason.
        const derivedWeek = Math.max(0, Math.round(statsData.secondsWeek || 0));
        lbOwnEntry.totalSecondsWeek = Math.max(derivedWeek, priorSeconds + secondsToAdd);
        lbOwnEntry.lastUpdated = new Date();
        await setDoc(doc(db, "leaderboard", currentUser.uid), lbOwnEntry, { merge: true });
        lbLastWriteTime = Date.now();
    } catch (e) {
        // Roll the entry back AND return the seconds to the pending bucket.
        // Rolling back only one of the two would double-count them on retry.
        console.warn("Leaderboard flush failed:", e);
        lbOwnEntry.totalSecondsWeek = priorSeconds;
        lbPendingSeconds += secondsToAdd;
        lbDirty = true;
    }
}

// Is this student plausibly on the board? Answered from the persisted cutoffs,
// so the common case (no, they're not top-10 in a school of thousands) costs
// nothing. Thresholds only move up, so a stale one makes us miss a celebration
// rather than fake one.
function couldPlace(entry) {
    if (leaderboardOptOut) return false;
    const t = loadLbThresholds();
    // No thresholds recorded yet — we have to look.
    if (!t || Object.keys(t).length === 0) return true;
    return LB_CATEGORIES.some(cat => {
        const mine = entry[cat.key] || 0;
        return mine > 0 && mine >= (t[cat.key] || 0);
    });
}

// Rank the student against the cached top-10 lists. No network.
//
// Ties: a tie at the TOP goes to the student (tie the 100 WPM record, you're
// told #1). A tie at the BOTTOM of a full board does not place, since you
// haven't displaced anyone from the visible ten. The old implementation sorted
// the whole collection and read back an index, so its tie order was whatever
// Firestore happened to return — this is at least deterministic.
function computePlacements(entry) {
    const placements = [];
    if (leaderboardOptOut) return placements;
    for (const cat of LB_CATEGORIES) {
        const mine = entry[cat.key] || 0;
        if (mine <= 0) continue;
        // Drop our own (possibly stale) row before comparing.
        const others = (leaderboardCache[cat.key] || []).filter(e => e.uid !== currentUser.uid);
        // Board full and we don't beat last place? Not on it.
        if (others.length >= 10 && mine <= (others[others.length - 1][cat.key] || 0)) continue;
        const rank = others.filter(e => (e[cat.key] || 0) > mine).length + 1;
        if (rank <= 10) placements.push({ category: cat, rank });
    }
    return placements;
}

async function updateLeaderboard() {
    if (!currentUser || currentUser.isAnonymous || !userInitials) return [];
    try {
        const weekStart = getWeekStart(new Date());
        const existing = await loadOwnLeaderboardEntry();

        // Weekly total resets when the stored weekStart is stale.
        const existingTimeWeek = ((existing.weekStart || '') === weekStart)
            ? (existing.totalSecondsWeek || 0) : 0;
        const weekRolledOver = (existing.weekStart || '') !== weekStart;

        const lastSprintWPM = sprintHistory.length > 0 ? sprintHistory[sprintHistory.length - 1].wpm : 0;
        const lastSprintAcc = sprintHistory.length > 0 ? sprintHistory[sprintHistory.length - 1].acc : 0;

        const newBestWPM     = Math.max(existing.bestWPM || 0, sanitizeSprintWPM(lastSprintWPM, 1));
        const newBestAcc     = Math.max(existing.bestAccuracy || 0, lastSprintAcc);
        const newBestStreak  = Math.max(existing.bestStreak || 0, bestStreak);
        const newChapters    = Math.max(existing.chaptersCompleted || 0, completedChapters.size);

        const gotNewBest =
            newBestWPM    > (existing.bestWPM || 0) ||
            newBestAcc    > (existing.bestAccuracy || 0) ||
            newBestStreak > (existing.bestStreak || 0) ||
            newChapters   > (existing.chaptersCompleted || 0) ||
            existing.initials !== userInitials ||
            existing.leaderboardOptOut !== leaderboardOptOut ||
            weekRolledOver;

        // Update the in-memory entry. NOTE: displayName is deliberately absent.
        // It was written here but never read — the UI shows initials — and this
        // collection is readable by every student. Real names for reporting stay
        // in typing_logs / typing_sessions.
        lbOwnEntry = {
            initials: userInitials,
            leaderboardOptOut: leaderboardOptOut,
            // Tenancy stamps for the queued "My class / My school / Everyone"
            // toggle. Written NOW, ahead of the feature, purely so that the
            // feature doesn't arrive needing a 7,000-document backfill on a
            // collection students can read. Nothing queries these yet. They add
            // no reads and no index requirement until something filters on them.
            // Still initials-only — no name, no email. See the v3.3.0 note.
            classId: ttbClassId || '',
            schoolId: ttbSchoolId || '',
            bestWPM: newBestWPM,
            bestAccuracy: newBestAcc,
            bestStreak: newBestStreak,
            chaptersCompleted: newChapters,
            totalSecondsWeek: existingTimeWeek,
            weekStart: weekStart,
            lastUpdated: existing.lastUpdated || new Date()
        };

        lbPendingSeconds += sprintSeconds;
        lbDirty = true;

        // Write now on a genuine record; otherwise wait out the coalescing gap.
        if (gotNewBest || (Date.now() - lbLastWriteTime) >= LB_WRITE_MIN_GAP_MS) {
            await flushLeaderboard();
        }

        // Placement check. The entry we compare with must include the seconds
        // we're still holding locally, or the weekly board would lag.
        const candidate = { ...lbOwnEntry, totalSecondsWeek: lbOwnEntry.totalSecondsWeek + lbPendingSeconds };

        if (!couldPlace(candidate)) return [];

        // Worth a look. This is FOUR queries at LB_FETCH_LIMIT (15) each, so up
        // to 60 document reads — 90 if the weekly board falls back to the wider
        // unfiltered fetch. The comment here said 40 for several versions and it
        // was never right. Cached for LB_CACHE_MS (10 minutes), and couldPlace()
        // above is what stops the ~99% of students who aren't near a cutoff from
        // ever reaching this line.
        await fetchLeaderboard();
        return computePlacements(candidate);
    } catch(e) { console.warn("Leaderboard update failed:", e); return []; }
}

// Fetch one category's top 10. Firestore does the sorting.
//
// We over-fetch (LB_FETCH_LIMIT) and then filter opt-outs and zeroes on the
// client. That's deliberate: putting where('leaderboardOptOut','==',false) in
// the query would silently drop any document where the field is missing, and
// it would force a composite index on all four categories. Over-fetching a few
// rows costs a few reads and needs no index at all for three of the four.
const LB_FETCH_LIMIT = 15;

const LB_CATEGORIES = [
    { key: 'bestWPM', label: '⚡ Speed', unit: 'WPM' },
    { key: 'bestStreak', label: '🔥 Streak', unit: '' },
    { key: 'chaptersCompleted', label: '📚 Chapters', unit: '' },
    { key: 'totalSecondsWeek', label: '⏱️ Weekly', unit: '', format: 'time' }
];

function lbRowsFromSnap(snap) {
    const rows = [];
    snap.forEach(d => {
        const data = d.data();
        data.uid = d.id;
        rows.push(data);
    });
    return rows;
}

// The weekly board is the one category that needs a server-side filter: a
// student who typed a lot last week still has a big totalSecondsWeek on their
// doc until they type again, so ordering alone would surface stale rows.
//
// where('weekStart','==',x) + orderBy('totalSecondsWeek','desc') needs ONE
// composite index. Firestore logs a console link for it the first time this
// runs. Until it exists the query throws, so we fall back to a wider unfiltered
// fetch — degraded (a quiet week can look sparse) but never broken mid-class.
async function fetchWeeklyRows() {
    const weekStart = getWeekStart(new Date());
    const ref = collection(db, "leaderboard");
    try {
        const snap = await getDocs(query(ref,
            where("weekStart", "==", weekStart),
            orderBy("totalSecondsWeek", "desc"),
            limit(LB_FETCH_LIMIT)));
        return lbRowsFromSnap(snap);
    } catch (e) {
        console.warn(
            "Weekly leaderboard query failed — the composite index " +
            "(weekStart ASC, totalSecondsWeek DESC) is probably missing or still " +
            "building. Check the console error above for a one-click create link. " +
            "Falling back to a client-filtered fetch.", e);
        const snap = await getDocs(query(ref,
            orderBy("totalSecondsWeek", "desc"),
            limit(LB_FETCH_LIMIT * 3)));
        return lbRowsFromSnap(snap).filter(r => (r.weekStart || '') === weekStart);
    }
}

async function fetchLeaderboard() {
    if (Date.now() - leaderboardCacheTime < LB_CACHE_MS && Object.keys(leaderboardCache).length > 0) {
        return leaderboardCache;
    }
    try {
        const ref = collection(db, "leaderboard");
        const result = {};

        for (const cat of LB_CATEGORIES) {
            let rows;
            if (cat.key === 'totalSecondsWeek') {
                rows = await fetchWeeklyRows();
            } else {
                // Single-field descending order — Firestore indexes every field
                // automatically, so no console setup is required here.
                const snap = await getDocs(query(ref,
                    orderBy(cat.key, "desc"),
                    limit(LB_FETCH_LIMIT)));
                rows = lbRowsFromSnap(snap);
            }
            result[cat.key] = rows
                .filter(e => (e[cat.key] || 0) > 0 && !e.leaderboardOptOut)
                .slice(0, 10);
        }

        leaderboardCache = result;
        leaderboardCacheTime = Date.now();
        saveLbThresholds(result);
        persistLbBoard();
        return result;
    } catch(e) { console.warn("Fetch leaderboard failed:", e); return {}; }
}

async function openLeaderboard(activeTab) {
    if (isGameActive) { isGameActive = false; clearInterval(timerInterval); }
    isModalOpen = true; isInputBlocked = false;
    modalGeneration++;
    setModalTitle('🏆 Leaderboard');
    resetModalFooter();

    document.getElementById('modal-body').innerHTML = `<div style="text-align:center; color:#888; padding:20px;">Loading...</div>`;
    showModalPanel();

    const btn = document.getElementById('action-btn');
    btn.innerText = 'Close'; btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
    btn.onclick = () => { closeModal(); showStartModal("Resume"); };
    modalActionCallback = () => { closeModal(); showStartModal("Resume"); };

    const data = await fetchLeaderboard();
    const activeCat = activeTab || LB_CATEGORIES[0].key;

    // Build tabs
    const tabs = LB_CATEGORIES.map(cat => {
        const active = cat.key === activeCat ? 'lb-tab-active' : '';
        return `<button class="lb-tab ${active}" data-cat="${cat.key}">${cat.label}</button>`;
    }).join('');

    // Build active list
    const entries = data[activeCat] || [];
    let listHTML = '';
    if (entries.length === 0) {
        listHTML = '<div style="color:#999; padding:12px;">No entries yet. Keep typing!</div>';
    } else {
        const cat = LB_CATEGORIES.find(c => c.key === activeCat);
        listHTML = entries.map((entry, i) => {
            const isMe = currentUser && entry.uid === currentUser.uid;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span style="color:#999; width:1.5em; display:inline-block; text-align:right;">${i + 1}</span>`;
            let val = entry[activeCat] || 0;
            if (cat.format === 'time') val = formatTime(val);
            else val = val + (cat.unit || '');
            const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email);
            const adminBtn = isAdmin
                ? ` <button class="lb-admin-reset" data-uid="${escapeHtml(entry.uid)}" title="Admin: reset this entry to 0" style="background:none; border:1px solid #a33; color:#a33; border-radius:3px; font-size:0.7em; padding:0 5px; cursor:pointer; margin-left:6px; vertical-align:middle;">✕</button>`
                : '';
            return `<div class="lb-entry ${isMe ? 'lb-me' : ''}">${medal} <span class="lb-initials">${escapeHtml(entry.initials || '???')}</span> <span class="lb-val">${val}</span>${adminBtn}</div>`;
        }).join('');
    }

    document.getElementById('modal-body').innerHTML = `
        <div class="lb-container">
            <div class="lb-tabs">${tabs}</div>
            <div class="lb-list">${listHTML}</div>
        </div>
    `;

    // Wire tab clicks
    document.querySelectorAll('.lb-tab').forEach(tab => {
        tab.onclick = () => openLeaderboard(tab.dataset.cat);
    });

    // Admin moderation: reset a single entry's stat for the ACTIVE category.
    // Surgical — zeroes only that field on that user's leaderboard doc; their
    // other categories and all their real progress/stats are untouched.
    document.querySelectorAll('.lb-admin-reset').forEach(btn => {
        btn.onclick = async (ev) => {
            ev.stopPropagation();
            const uid = btn.dataset.uid;
            const catDef = LB_CATEGORIES.find(c => c.key === activeCat);
            if (!confirm(`Reset this player's ${catDef ? catDef.label : activeCat} entry to 0?`)) return;
            try {
                await setDoc(doc(db, "leaderboard", uid), { [activeCat]: 0 }, { merge: true });
                leaderboardCacheTime = 0;   // bust cache
                try { localStorage.removeItem(LB_BOARD_KEY); } catch (_) {}
                // A reset lowers the real top-10 cutoff, so the persisted
                // thresholds are now too high and would suppress legitimate
                // placements. Drop them; the re-render below rebuilds them.
                lbThresholds = null;
                try { localStorage.removeItem(LB_THRESHOLD_KEY); } catch (_) {}
                // If the admin reset their own row, our in-memory copy is stale.
                if (currentUser && uid === currentUser.uid) lbOwnEntry = null;
                openLeaderboard(activeCat); // re-render
            } catch (e) {
                alert("Reset failed — Firestore rules may not allow admin writes to other users' leaderboard docs. See console.");
                console.error("Leaderboard admin reset failed:", e);
            }
        };
    });
}

// ========================
// PRACTICE MODE
// ========================

// Test Text constants (used via Game Genie)
const TEST_TEXT_PANGRAM = '"The quick brown fox jumps over the lazy dog!" exclaimed 4 typing teachers.';
const TEST_TEXT_ALPHABET = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 1234567890';

function startTestText(text, label) {
    if (isPracticeMode) return;

    // Save real book state (reuse practice mode machinery)
    practiceRealBookData = bookData;
    practiceRealChapterNum = currentChapterNum;
    practiceRealCharIndex = currentCharIndex;
    practiceRealFurthestChapter = furthestChapter;
    practiceRealFurthestCharIndex = furthestCharIndex;

    // Enter practice mode with test text
    isPracticeMode = true;
    practiceText = text;
    practiceMissedSnapshot = { ...missedCharsMap };
    bookData = { segments: [{ text: text }] };
    savedCharIndex = 0;
    currentCharIndex = 0;

    sprintSeconds = 0;
    sprintMistakes = 0;
    sprintCharStart = 0;
    resetSprintLogWatermark();

    setupGame();
    getHeaderHTML();

    const bar = document.getElementById('book-info-bar');
    if (bar) bar.classList.add('practice-active');

    closeModal();

    isModalOpen = true; isInputBlocked = false;
    modalActionCallback = startGame;
    setModalTitle('');
    resetModalFooter();
    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:center;">
            <div class="stats-title">🔥 Test Text: ${escapeHtml(label)}</div>
            <div style="font-size:0.8em; color:#888; margin:6px 0; font-family:'Courier Prime',monospace;">${escapeHtml(text)}</div>
            <div class="start-hint" style="margin-top:8px;">Type first character to start · ESC to pause</div>
        </div>
    `;
    const startBtn = document.getElementById('action-btn');
    startBtn.innerText = 'Start Typing'; startBtn.onclick = startGame;
    startBtn.disabled = false; startBtn.style.display = 'inline-block'; startBtn.style.opacity = '1';
    showModalPanel();
}

async function startPracticeMode() {
    if (isPracticeMode) return;

    // Get the problem characters from the current session. ⚠️ VARIETY FLOOR
    // (v3.27.1) — same gate getMissedCharsHTML() applies before ever showing
    // the button, checked again here so nothing that reaches this function
    // directly can skip it. practiceProblemChars is built from QUALIFYING
    // characters only (each missed at least PRACTICE_CHAR_MISS_THRESHOLD
    // times), not the top 5 regardless of count — a paragraph "focused on"
    // one dominant letter and four barely-missed ones was the whole bug.
    const entries = _qualifyingPracticeChars().slice(0, 5);
    if (entries.length < PRACTICE_MIN_QUALIFYING_CHARS) return;
    practiceProblemChars = entries.map(([ch]) => ch);

    // Get a text snippet for style reference (first 500 chars of current chapter)
    const textSnippet = (fullText || '').substring(0, 500);

    // Get book/chapter info
    let chapterTitle = '';
    if (bookMetadata && bookMetadata.chapters) {
        const c = bookMetadata.chapters.find(ch => ch.id === "chapter_" + currentChapterNum);
        if (c && c.title) chapterTitle = c.title;
    }
    const bookTitle = (bookMetadata && bookMetadata.title) || currentBookId.replace(/_/g, ' ');

    // Show loading state
    closeModal();
    isModalOpen = true; isInputBlocked = true;
    setModalTitle('');
    resetModalFooter();
    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:center; padding:20px;">
            <div class="stats-title">✨ Generating Practice...</div>
            <div style="font-size:0.85em; color:#888; margin-top:8px;">
                Creating a paragraph focused on: ${practiceProblemChars.map(c => `<b style="color:#D32F2F;">${escapeHtml(c)}</b>`).join(', ')}
            </div>
            <div style="margin-top:12px; color:#aaa;">This may take a few seconds...</div>
        </div>
    `;
    const btn = document.getElementById('action-btn');
    btn.style.display = 'none';
    showModalPanel();

    try {
        const result = await generatePractice({
            problemChars: practiceProblemChars,
            bookTitle: bookTitle,
            chapterTitle: chapterTitle,
            textSnippet: textSnippet
        });

        practiceText = result.data.text;
        practicePrompt = result.data.prompt || '';
        const remaining = result.data.remaining;
        if (typeof remaining === 'number') practiceRemainingToday = remaining;

        // Save real book state
        practiceRealBookData = bookData;
        practiceRealChapterNum = currentChapterNum;
        practiceRealCharIndex = currentCharIndex;
            practiceRealFurthestChapter = furthestChapter;
        practiceRealFurthestCharIndex = furthestCharIndex;

        // Enter practice mode
        isPracticeMode = true;
        hasDonePractice = true;
        practiceTypingAccumulator = 0;
        practiceMissedSnapshot = { ...missedCharsMap };

        // Inject practice text as a fake chapter
        bookData = { segments: [{ text: practiceText }] };
        savedCharIndex = 0;
        currentCharIndex = 0;


        // Reset sprint tracking for practice
        sprintSeconds = 0;
        sprintMistakes = 0;
        sprintCharStart = 0;
        resetSprintLogWatermark();

        // Set up the display
        setupGame();
        getHeaderHTML();

        // Add practice visual indicator
        const bar = document.getElementById('book-info-bar');
        if (bar) bar.classList.add('practice-active');

        closeModal();

        // Show practice start modal
        isModalOpen = true; isInputBlocked = false;
        modalActionCallback = startGame;
        setModalTitle('');
        resetModalFooter();
        document.getElementById('modal-body').innerHTML = `
            <div style="text-align:center;">
                <div class="stats-title">✨ Practice Ready!</div>
                <div style="font-size:0.85em; color:#888; margin:6px 0;">
                    Focused on: ${practiceProblemChars.map(c => `<b style="color:#D32F2F;">${escapeHtml(c)}</b>`).join(', ')}
                </div>
                ${remaining !== undefined ? `<div style="font-size:0.75em; color:#aaa;">${remaining} practice session${remaining !== 1 ? 's' : ''} remaining today</div>` : ''}
                <div class="start-hint" style="margin-top:8px;">Type first character to start · ESC to pause</div>
            </div>
        `;
        const startBtn = document.getElementById('action-btn');
        startBtn.innerText = 'Start Practice'; startBtn.onclick = startGame;
        startBtn.disabled = false; startBtn.style.display = 'inline-block'; startBtn.style.opacity = '1';
        showModalPanel();

    } catch (e) {
        console.error("Practice generation failed:", e);
        let errorMsg = "The practice writer is busy. Keep typing your book \u2014 " +
                       "it's the same practice, and you can try again in a minute.";
        if (e.code === 'functions/resource-exhausted') {
            // Cache it so getMissedCharsHTML() stops offering the button at all.
            practiceRemainingToday = 0;
            errorMsg = "That's all five practice sessions for today \u2014 nice work. " +
                       "They come back tomorrow. Your book is still right where you left it.";
        } else if (e.code === 'functions/unauthenticated') {
            errorMsg = 'Sign in to use practice mode.';
        }

        // Show error then go back to break modal
        document.getElementById('modal-body').innerHTML = `
            <div style="text-align:center; padding:12px;">
                <div class="stats-title">⚠️ Practice Unavailable</div>
                <div style="font-size:0.9em; color:#888; margin-top:8px;">${escapeHtml(errorMsg)}</div>
            </div>
        `;
        const errBtn = document.getElementById('action-btn');
        errBtn.innerText = 'OK'; errBtn.disabled = false; errBtn.style.opacity = '1'; errBtn.style.display = 'inline-block';
        errBtn.onclick = () => { closeModal(); showStartModal("Continue"); };
        modalActionCallback = () => { closeModal(); showStartModal("Continue"); };
    }
}

function exitPracticeMode() {
    if (!isPracticeMode) return;

    // Restore real book state
    isPracticeMode = false;
    bookData = practiceRealBookData;
    currentChapterNum = practiceRealChapterNum;
    savedCharIndex = practiceRealCharIndex;
    currentCharIndex = practiceRealCharIndex;
    furthestChapter = practiceRealFurthestChapter;
    furthestCharIndex = practiceRealFurthestCharIndex;

    // Clear practice state
    practiceRealBookData = null;
    practiceRealChapterNum = null;
    practiceRealCharIndex = null;
    practiceRealFurthestChapter = null;
    practiceRealFurthestCharIndex = null;
    practiceText = '';
    practicePrompt = '';
    practiceProblemChars = [];
    practiceMissedSnapshot = {};

    // Remove practice visual indicator
    const bar = document.getElementById('book-info-bar');
    if (bar) bar.classList.remove('practice-active');

    // Rebuild fullText to check if we were at chapter end
    setupGame();
    getHeaderHTML();
    closeModal();

    // If restored position is at/past chapter end, advance to next chapter
    if (currentCharIndex >= fullText.length) {
        autoStartNext = true;
        advanceToNextChapter();
        return;
    }
}

async function logPracticeSession(wpm, acc, seconds, chars, mistakes) {
    if (!currentUser || currentUser.isAnonymous) return;
    try {
        await addDoc(collection(db, "practice_sessions"), {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Anonymous',
            timestamp: new Date(),
            date: getLocalDateStr(),
            // TTL field — practice docs carry the full generated paragraph AND
            // the prompt, so they're the heaviest per-document payload in the
            // database. See firestore.indexes.json fieldOverrides.
            expiresAt: new Date(Date.now() + 120 * 24 * 3600 * 1000),
            // Tenancy stamps. Without these the collection can't be scoped in
            // security rules at all, and its read rule had to be "any staff,
            // anywhere" — a district-wide leak of names and generated text.
            classId: ttbClassId || "",
            schoolId: ttbSchoolId || "",
            bookId: currentBookId,
            chapter: practiceRealChapterNum,
            problemChars: practiceProblemChars,
            prompt: practicePrompt,
            generatedText: practiceText,
            wpm: wpm,
            accuracy: acc,
            seconds: seconds,
            chars: chars,
            mistakes: mistakes,
            // Capture which chars were still problematic during practice
            practiceErrors: Object.entries(missedCharsMap)
                .filter(([ch]) => practiceProblemChars.includes(ch))
                .map(([ch, count]) => ({ char: ch, errors: count }))
        });
    } catch(e) { console.warn("Practice session log failed:", e); }
}

window.onload = init;
