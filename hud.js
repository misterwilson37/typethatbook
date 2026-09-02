// hud.js v2.1.0
//
// v2.1.0 — ⚠️⚠️ ROADMAP 50: HUD_CACHE_KEY bumped _v1 → _v2. A ONE-SHOT REPAIR,
//          NOT A FIX — the root cause of a weekly HUD reading exactly today's
//          figure is still unknown. Renaming orphans every stored entry so each
//          machine re-reads its week from Firestore once.
//          ⚠️ IT SHIPS IN THE APP BECAUSE NOTHING ELSE CAN REACH THE VALUE:
//          students cannot clear site data (blocked by district policy) and have
//          no devtools. ⚠️ IF THE FAULT RETURNS AFTER THIS, IT IS A WRITE BUG
//          AND NOT A STALE ENTRY — the most useful thing to tell the next round.
//
// ⚠️⚠️ v2.0.0 — MAJOR, ON JAKE'S EXPLICIT SIGN-OFF (2026-08-22: "Give hud 2.0.
//          It's earned it"). NO CODE CHANGED IN THIS BUMP. It is the version
//          number catching up with a breaking change that already shipped.
//
//          v1.3.0 changed this module's public return shape — `{ left, long }`
//          became `{ lead, sprint }` — and went out as a MINOR, with its own
//          header saying that was arguably wrong and that the call was Jake's.
//          It is now made: **that was a major, and it is recorded as one.**
//
//          ⚠️ WHY IT MATTERS BEYOND BOOKKEEPING. A minor bump says "your caller
//          still works." Every caller of `hudStrings()` written against v1.2.0
//          reads `.left` and gets `undefined` — which does not throw, it renders
//          the word "undefined" into a child's top bar, or crashes on
//          `.includes()` one line later. **That is exactly what happened to
//          `tests/hud-test.mjs`**, which sat crashed for two releases (§0.-14).
//          A semver major is the one signal that would have said "go and look at
//          every call site," and it was the signal not sent.
//
//          THE PUBLIC SURFACE AT 2.0.0, so a caller can be checked against it:
//            fmt(seconds) -> 'm:ss'
//            hudStrings(state) -> { lead, sprint, right,
//                                   dailyDone, weeklyDone, overtime }
//            hudCacheSave({...}) / hudCacheLoad(todayStr, weekStart)
//            celebrationDone(kind, period) / celebrationMark(kind, period)
//            HUD_VERSION
//          ⚠️ `left` and `long` ARE GONE AND ARE NOT COMING BACK — see the block
//          at the return statement in hudStrings().
//
// v1.4.1 — ⚠️ STAMP ONLY, NO BEHAVIOUR. `HUD_VERSION` still read '1.2.0' after
//          v1.3.0 and v1.4.0 both shipped. The constant is what versions.js
//          parses and what the build footer renders, so this module reported
//          itself as the PRE-BREAKING-CHANGE build for two versions.
//          ⚠️ AND IT DISARMED ITS OWN PIN: tests/hud-test.mjs asserts
//          `HUD_VERSION === <n>` precisely so that bumping this file forces the
//          harness to move with it. The constant never moved, so the pin stayed
//          green while v1.3.0 changed the return shape underneath it, and
//          hud-test.mjs sat red on the old `{ left, long }` API. A pin only
//          works if the thing it pins is honest. See HANDOFF §0.-14.
//          Also corrected the stale doc-block above hudStrings(), which still
//          documented the v1.2.0 return shape.
//
// v1.4.0 — celebrationDone() / celebrationMark(). A period-keyed latch recording
//          what a child was actually SHOWN, replacing "is the total already past
//          the goal" as the suppression test. See the block above them: the old
//          question stayed true for the rest of the week, so one missed moment
//          was the whole week's fireworks. Reported by Jake.
//
// v1.3.0 — ⚠️ BREAKING RETURN SHAPE. `{ left, long }` → `{ lead, sprint }`. The
//          top bar is two rows now (ROADMAP item 0), so the combined
//          `Sprint … (Daily …)` string and the `long` flag that existed to
//          shrink it are both gone. `lead` is ALWAYS the Daily figure — read the
//          block above the return before changing that.
//          ⚠️ JAKE: A BREAKING CHANGE TO A SHARED MODULE'S PUBLIC FUNCTION IS
//          ARGUABLY A MAJOR BUMP (v2.0.0). Shipped as a minor because both
//          callers moved in the same commit and nothing else imports it, but
//          that is your call to make, not mine.
//
// v1.2.0 — hudStrings() now returns `long: showSprint` alongside the strings.
//          `left` runs to 40+ characters in the combined Sprint+Daily form
//          ("Sprint 29:59 / 30:00 (Daily 119:55 / 120:00)"), which was silently
//          hard-clipping inside #hud-time's fixed-width, nowrap, overflow:hidden
//          flex third — no ellipsis, no way to see what was cut. Callers use the
//          flag to switch to a smaller font and add an ellipsis+title fallback;
//          hud.js still touches no DOM and decides nothing about how it's shown.
//
// v1.1.0 — hudCacheSave()/hudCacheLoad(): the last-known readout, so a page does
//          not open at 0:00 while Firestore is still being read. ⚠️ DISPLAY ONLY
//          — read the warning above HUD_CACHE_KEY before touching it.
// — the time readout, in words, for both page controllers.
// The fourth shared module, after firebase-config.js, stats-wal.js and
// session-log.js.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS FILE EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, who built the app: *"telling kids where to look for their minutes is
// kind of terrible. It's confusing me where numbers are, and I made the thing."*
//
// He was right, and the cause is worse than inconsistent labels. The Library
// timer showed THREE DIFFERENT QUANTITIES IN ONE SLOT depending on settings:
//
//   * a session limit set        → the current sprint's seconds
//   * no limit, daily goal set   → the whole day's seconds
//   * neither                    → the current sprint's seconds again, as "Active"
//
// Same position, same digits, same font, three meanings — and a label above it
// that a student has no reason to read carefully. Meanwhile School showed
// `Today: 9:22` in that slot and never showed the current run at all. A child
// moving between the two sides had to relearn the top bar, and a child who
// switched their session length changed what their own number meant.
//
// ⚠️ THE NUMBER A STUDENT IS GRADED ON MUST ALWAYS BE IN THE SAME PLACE, WITH
// THE SAME WORD IN FRONT OF IT. That is the whole content of this module.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE LAYOUT (Jake's, 2026-08-18)
// ═══════════════════════════════════════════════════════════════════════════
//
//   left    Sprint 0:27 / 0:30 (Daily 9:22 / 10:00)
//   left    Daily 9:22 / 10:00                        ← when there is no sprint
//   right   Weekly 9:22 / 50:00
//
// Three words only: **Sprint, Daily, Weekly.** Sprint is the unit in front of
// them, Daily is what they owe today, Weekly is what they owe this week. Daily
// appears on BOTH sides in the same place whether or not a sprint is running, so
// the answer to "where are my minutes" is one answer.
//
// ⚠️ EVERY NUMBER IS m:ss. Jake's sketch had `27 / 30 sec` next to
// `9:22 / 10 min`, which asks a sixth-grader to compare seconds against decimal
// minutes in one glance. Mixed units in one line is how the old bar got confusing
// in the first place.
//
// ⚠️ DAILY AND WEEKLY ARE EQUAL ON THE FIRST DAY OF THE WEEK. Saturday, and
// Monday for most classes. Somebody will report it as a bug. It is not one.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY IT RETURNS STRINGS AND TOUCHES NO DOM
// ═══════════════════════════════════════════════════════════════════════════
//
// Same reasoning as session-log.js's injected Firestore surface: this is imported
// by two page controllers whose markup is not identical, and a module that
// queried the DOM would be a third place that has to know about element ids. It
// returns text and flags; each page writes them where it keeps them. It is also
// then a pure function, so `hud-test.mjs` drives the real code with no jsdom.

// ⚠️ THIS CONSTANT IS THE VERSION. The comment at the top of the file is
// decoration; versions.js parses THIS line and the build footer renders it.
// It sat at '1.2.0' through v1.3.0 and v1.4.0 — bump it in the same edit that
// writes the header entry, every time, or the file lies about itself.
export const HUD_VERSION = '2.1.0';

// m:ss. Not padded on minutes — `9:22` reads faster than `09:22` and a student's
// day does not reach three digits. Seconds ALWAYS padded, or 9:7 appears.
export function fmt(seconds) {
    const s = Math.max(0, Math.round(seconds || 0));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// `elapsed / goal`, or just `elapsed` when there is no goal to measure against.
// ⚠️ A ZERO OR MISSING GOAL PRINTS NO DENOMINATOR RATHER THAN `/ 0:00`. A goal of
// zero means "no goal set", and `9:22 / 0:00` reads as though the child is
// spectacularly ahead or the app is broken.
function pair(elapsed, goal) {
    const g = Math.max(0, Math.round(goal || 0));
    return g > 0 ? fmt(elapsed) + ' / ' + fmt(g) : fmt(elapsed);
}

// The two readouts. One call, both sides, so they cannot drift apart.
//
//   sprintSeconds  seconds in the current sprint or run (0 when none is running)
//   sprintLimit    the sprint's target in seconds, or 0/'infinity' for none
//   todaySeconds   statsData.secondsToday   — the graded day total
//   dailyGoal      goals.dailySeconds
//   weekSeconds    statsData.secondsWeek
//   weeklyGoal     goals.weeklySeconds
//
// Returns { lead, sprint, right, dailyDone, weeklyDone, overtime }.
//
// ⚠️ THIS BLOCK DESCRIBED `{ left, right, ..., long }` UNTIL v1.4.1 — three
// versions after v1.3.0 deleted both. It is fixed here for the same reason the
// constant below the header was: a comment that describes a shape the code no
// longer returns is a trap for the next reader, and this file had two of them.
//
//   lead    the Daily figure — ALWAYS, on every surface. Read the block at the
//           return statement before changing that; it needs Jake.
//   sprint  the live sprint clock for the CENTRE cluster, or '' when there is
//           no limit to show it against (School's normal case).
//   right   the Weekly figure.
//
// The flags are for colour; the caller owns colour because the two pages theme
// differently. hud.js stays DOM-free and never sizes anything itself.
export function hudStrings(state) {
    const st = state || {};
    const today = Math.max(0, Math.round(st.todaySeconds || 0));
    const week  = Math.max(0, Math.round(st.weekSeconds  || 0));
    const dailyGoal  = Math.max(0, Math.round(st.dailyGoal  || 0));
    const weeklyGoal = Math.max(0, Math.round(st.weeklyGoal || 0));

    const dailyDone  = dailyGoal  > 0 && today >= dailyGoal;
    const weeklyDone = weeklyGoal > 0 && week  >= weeklyGoal;

    const daily = 'Daily ' + pair(today, dailyGoal) + (dailyDone ? ' ✓' : '');

    // A sprint is only shown when there is a limit to show it against. School
    // has no per-run time target — its gates are WPM and accuracy — so School
    // shows the Daily figure alone, in the same place Library shows it.
    const limit = (st.sprintLimit === 'infinity') ? 0
                : Math.max(0, Math.round(st.sprintLimit || 0));
    const sprint = Math.max(0, Math.round(st.sprintSeconds || 0));
    const showSprint = limit > 0;

    // ══════════════════════════════════════════════════════════════════════════
    // ⚠️ v1.3.0 — THE PARENTHESIS WAS A SECOND ROW TRYING TO HAPPEN.
    // ══════════════════════════════════════════════════════════════════════════
    //
    // v1.2.0 returned ONE glued string — `Sprint 0:00 / 0:30 (Daily 41:37 /
    // 10:00)` — and added a `long` flag so the callers could shrink the font and
    // ellipsise it. That was a band-aid on a cramming problem, and the renders
    // Jake sent on 2026-08-21 showed it losing: students saw
    // `Daily 41:37 / 10:00…` with the GOAL cut off.
    //
    // ⚠️ `long` IS GONE, NOT TUNED. The bar has two rows now, so the
    // parenthetical has somewhere to live and there is nothing left to truncate.
    // If you find yourself re-adding a flag that tells a caller to shrink text,
    // stop: that is this bug's exact fingerprint.
    //
    // ⚠️⚠️ `lead` IS ALWAYS THE DAILY FIGURE, ON EVERY SURFACE, AND CHANGING THAT
    // NEEDS JAKE. Sprint-above-daily was asked for and argued down on the file
    // header's own grounds: it would make Daily the lead line on the landing
    // page and the sub line inside a book, so THE GRADED NUMBER WOULD MOVE
    // DEPENDING ON WHERE THE CHILD IS STANDING. That is the defect this whole
    // module was extracted to kill. The sprint is a LIVE quantity, not a time
    // quantity, and it belongs with WPM and accuracy in the centre — it sat on
    // the left only because that is where the parenthesis put it.
    // tests/hud-lead-test.mjs asserts it. See ROADMAP item 0.
    return {
        // The graded number. Same slot, same word, all four surfaces.
        lead: daily,
        // The live sprint, for the CENTRE cluster. Empty when there is no limit
        // to show it against — School has no per-run time target, so School's
        // centre is WPM and accuracy alone and its lead row is simply absent.
        sprint: showSprint ? fmt(sprint) + ' / ' + fmt(limit) : '',
        right: 'Weekly ' + pair(week, weeklyGoal) + (weeklyDone ? ' ✓' : ''),
        dailyDone,
        weeklyDone,
        // Past the sprint target. Library colours the readout for this; the
        // sprint is not stopped, and never has been.
        overtime: showSprint && sprint >= limit,
    };
}

// ─── The last-known readout, so a page does not open at 0:00 ─────────────────
//
// ⚠️ THIS IS A DISPLAY CACHE AND NOTHING MAY EVER READ IT INTO `statsData`.
// (v1.1.0) Firestore is an async read. Between a page painting and that read
// landing, the only totals in memory are the zeros `statsData` is initialised
// with — so a student who had 17 minutes opened their book, saw `Daily 0:00`,
// and had to wait. Jake reported it twice, correctly, and the second time it was
// still true after the paint itself was fixed: the paint was fine, the NUMBER
// was not there yet.
//
// ⚠️ IT IS A CACHE OF A QUANTITY THAT LIVES ELSEWHERE, WHICH IS THE SHAPE THIS
// PROJECT HAS BEEN BITTEN BY REPEATEDLY (invariant 1). It is legitimate ONLY
// because it is:
//   · write-only from the authoritative side — saved after Firestore is read,
//     never from a live counter and never from a merge;
//   · read exactly once, to paint, before the real value exists;
//   · discarded the instant the real value lands, and stale-checked by date.
// ⚠️ IF YOU EVER FEEL LIKE SEEDING `statsData` FROM THIS, DON'T. It would become
// a second source of truth for the day total, and §3.7's merge baseline would be
// computed against a number that never came from the server. That is the doubled
// week counter, rebuilt.
// ⚠️⚠️ BUMPED TO _v2 BY ROUND 58 — A ONE-SHOT REPAIR, NOT A FIX. ROADMAP 50: a
// student whose daily rows totalled 26m 15s had a weekly HUD reading 6m 55s —
// exactly today's figure — while reports.html totalled the same documents
// correctly. Proven to live in PER-BROWSER state: the same student read
// correctly in a fresh browser, because empty storage makes planReads() go
// blind and fetch all seven days.
// ⚠️ THE ROOT CAUSE IS STILL UNKNOWN and this rename does not find it. Changing
// the key orphans every existing entry, so every machine re-reads its week from
// Firestore once. That is the only repair available: STUDENTS CANNOT CLEAR SITE
// DATA (blocked by district policy) and HAVE NO DEVTOOLS, so nothing outside the
// app can reach this value on their machine.
// ⚠️ IF THE FAULT RETURNS AFTER THIS, IT IS A WRITE BUG AND NOT A STALE ENTRY —
// that is the single most useful thing the next round can be told.
const HUD_CACHE_KEY = 'ttb_hudCache_v2';

export function hudCacheSave({ todaySeconds, weekSeconds, date, weekStart }) {
    try {
        localStorage.setItem(HUD_CACHE_KEY, JSON.stringify({
            todaySeconds: todaySeconds || 0,
            weekSeconds:  weekSeconds  || 0,
            date:         date  || '',
            weekStart:    weekStart || 0,
        }));
    } catch { /* private mode, quota — the page just opens at 0:00 as before */ }
}

// Returns { todaySeconds, weekSeconds } or null. ⚠️ Returns null rather than
// zeros when the cache is for another day or another week: showing a stale
// total is worse than showing none, because the student cannot tell it is stale.
export function hudCacheLoad(todayStr, weekStart) {
    try {
        const raw = localStorage.getItem(HUD_CACHE_KEY);
        if (!raw) return null;
        const c = JSON.parse(raw);
        if (!c || c.date !== todayStr) return null;
        return {
            todaySeconds: c.todaySeconds || 0,
            weekSeconds:  (c.weekStart === weekStart) ? (c.weekSeconds || 0) : 0,
        };
    } catch { return null; }
}

// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ THE CELEBRATION LATCH (v1.4.0) — "NOT EVERYONE GOT FIREWORKS"
// ═════════════════════════════════════════════════════════════════════════════
//
// Reported by Jake, week of 2026-08-21: some students never saw the weekly
// fireworks. Both game.js and learn.js fire them correctly from the tick, and
// both suppress on load so a child does not get fireworks on every page view for
// the rest of the week. ⚠️ THE SUPPRESSION WAS THE PROBLEM, AND IT ASKED THE
// WRONG QUESTION. It asked *"is the total already past the goal?"* — which is
// true for the entire remainder of the week — instead of *"have we actually
// SHOWN this to the child yet?"*
//
// So any crossing that failed to fire at the moment it happened was gone
// permanently, and there are real ways to fail at that moment:
//   • `goals.weeklySeconds` is still 0 because the class read has not returned
//     yet, and the child started typing immediately. The gate drops it silently.
//   • the child has no class, or the goals cache went cold and the read failed.
//   • the crossing lands on a page or path that is not the tick.
// ⚠️ AND THE WEEKLY GOAL IS CROSSED EXACTLY ONCE PER WEEK, so a single missed
// moment is the whole week. The daily goal hid the same defect because it
// re-arms every morning — miss Monday's confetti and Tuesday's still comes.
//
// This latch records what was actually SHOWN, keyed to the period it was shown
// for. A child who crosses in School and misses it gets it in Library, once.
//
// ⚠️ IT IS localStorage, SO IT IS PER-BROWSER, AND THAT IS DELIBERATE. A child on
// a second Chromebook may see the fireworks twice. That is the correct direction
// to fail in — Jake's own ruling was "if they just didn't see it, double it" —
// and a duplicate celebration costs nothing while a missing one generated a
// week of complaints. NEVER make this authoritative by moving it to Firestore:
// a celebration is not a grade, and it must never cost a document read.
const CELEBRATION_KEY = 'ttb_celebrated_v1';

function _celebrationRead() {
    try { return JSON.parse(localStorage.getItem(CELEBRATION_KEY)) || {}; }
    catch { return {}; }
}

// kind: 'day' | 'week'. period: the dateStr for a day, the weekStart for a week.
// ⚠️ A MISSING OR UNREADABLE LATCH REPORTS false — "not shown yet" — so private
// mode and a cleared cache err toward showing it again, never toward silence.
export function celebrationDone(kind, period) {
    if (!period) return false;
    const c = _celebrationRead();
    return c[kind] === period;
}

export function celebrationMark(kind, period) {
    if (!period) return;
    try {
        const c = _celebrationRead();
        c[kind] = period;
        localStorage.setItem(CELEBRATION_KEY, JSON.stringify(c));
    } catch { /* private mode — the child may simply see it twice */ }
}
