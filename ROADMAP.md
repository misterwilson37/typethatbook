# TYPETHATBOOK — ROADMAP

**v3.52.0, 2026-09-01 (later still).** ✅ **ITEM 46 CLOSED** — `admin.js` v3.38.0 stamps `uploadedBy` from the signed-in uid on CREATE only, read-only, gated by `alreadyExists` so it costs **no extra Firestore read** and an overwrite cannot restamp. ⚠⚠ An unstamped book reads "added before this was recorded" and is **never guessed as Jake**. ✅ Contributor fallback for a missing `dc:creator` (v3.37.0) — ⚠️ **three** places read `dc:creator` and the third feeds `looksLikeLeadingMatter()`, so a blank author there imports the Gutenberg title page **as chapter one**. ⭐ **Item 47 corrected against the code**: the ladder is **six** models behind ONE callable, `generatePractice`; it powers AI practice only and **lessons do not use Gemini at all**; and ⚠⚠ 47 must share the model chain, NOT that endpoint, which is quota'd at 5/day per student uid.

**v3.51.0, 2026-09-01 (later).** ✅ **THE FIVE TINTED BUTTONS ARE FIXED, NOT DEFERRED.** Round 56 first left them inline on the reasoning that reviving a dead `:hover` is a visible change and so Jake's to approve; Jake: *"You have buttons that don't work or are invisible? They need to be fixed."* He was right — a suppressed `:disabled` is a defect, not a design decision awaiting sign-off. Tints moved to `.btn-tint-*` guarded by `:not(:disabled)`, hover is a derived `filter: brightness()` so **no new colour was added** while item 38 is open. Three `#0047AB` inlines were identical to `button{background}` and just deleted. `admin.html` **20 → 9** inline attributes; three duplicate font-size classes merged (`.8em` and `0.8em` were the same size under two names). ✅ `admin.js` **v3.37.0** — contributor fallback (see below) folded in with the genre change, since neither had shipped. ⭐ **New items 45, 46, 47** — building filtering, upload provenance, and the Gemini licence check. ⚠️ **47 answers Jake's ladder question: extract it, but the reason is the Cloud Function, not current duplication.**

**v3.50.0, 2026-09-01.** ✅ **ITEM 42 CLOSED FOR `admin.html`** — v1.3.0, 834 of
866 inline declarations extracted onto 202 utility classes. ⚠️⚠️ **THE ITEM'S OWN
METHOD WAS WRONG IN THREE WAYS AND ALL THREE ARE WRITTEN INTO IT**: the 276 count
was markup-only (`admin.js` holds 183 more and is STILL OPEN); "byte-identical
rendering" is false because 34 declarations were suppressing `:hover`/`:disabled`
and had to stay inline; and "low-risk" would have **broken the Staff tab and the
build panel**, which are restored with `.style.display = ''` and would have fallen
through to the new class. ⭐⭐ **AND IT SURFACED A DEFECT: ROADMAP 41 IS DEFEATED ON
admin.** `button:disabled` is dead on `auditBtn` and `saveTitleBtn`, both of which
really are disabled for slow work — a whole-book audit runs behind a button that
looks idle. One line each to fix, but it changes how four buttons look, so it is
Jake's call. ⭐ **New: `tools/audit-inline-styles.mjs`** (every figure this item
cites is now re-derivable) and **`tests/inline-styles-test.mjs`**, 19 assertions,
mutation-verified. ✅ Also `admin.js` v3.36.0 — **Drama added, Classic Literature /
Historical Fiction / Young Adult retired** at Jake's request, with the two
`SUBJECT_TO_GENRE` rows that pointed at retired genres removed in the same edit.
⭐ **New item 44** — the Book ID field takes any typed string; no active bug, and
the obvious slug guard would fire on `wizard_of_oz`. ⚠️ Remaining open: **30**,
**34**, **35**, **39**, **42 (admin.js half)**, **44**.

**v3.49.0, 2026-09-01.** ✅ **ITEM 41 CLOSED** — `reports.html` v2.36.0. ⭐ **It
turned out to contain a real defect**: the ⟳ recalculate re-enabled itself on the
line after its await with no `finally`, so any throw left the button dead until
reload. ⚠️ Also corrected `recalc-guard-test.mjs` A5, which pinned a line's
SHAPE rather than the property it protects and went red against a meaning-
preserving refactor. ⚠️ Remaining open: **30** (may have been transient — see the
renderer asymmetry noted in it, which stands on its own), **34**, **35** (waiting
on a week of error-rate data), **39** and **42** — and **42 should come before 39
for admin**, or the same lines get touched twice.

**v3.48.0, 2026-09-01.** ✅ **ITEMS 37, 38 AND 40 CLOSED** — `reports.html`
v2.35.0 / markup v1.7.0, `admin.html` v1.2.0. Tokens, the product font, three
severities with one meaning each, and keyboard usability. **No behaviour changed.**
⚠️ **38 IS ONLY CLOSED FOR reports.html**; admin's colour retirement is blocked
on item 42's inline-style extraction, not on effort — its 276 inline attributes
win on specificity, so restyling it now would change nothing on screen.
⚠️ Remaining open: **30** (waiting on a screenshot), **34**, **35** (waiting on a
week of real error-rate data), **39**, **41**, **42**.

**v3.47.0, 2026-09-01.** ✅ **ITEM 43 CLOSED — `learn.js` v2.42.0.** ⭐ **THE
DEPLOY IS THE REPAIR.** Jake: *"He doesn't have console on his machine. As a
student, it's removed."* The read-side half — an empty map no longer counts as a
cache hit — means every already-poisoned cache falls through to Firestore on the
student's next page load, with no console and no per-student action. The write-side
guard stops it recurring. ⚠️ **Ship this before items 37–42**; the polish work is
worth nothing to a child who cannot open lesson two.

**v3.46.0, 2026-09-01.** ⚠️⚠️⚠️ **ITEM 43 — A STUDENT IS LOCKED OUT OF THE
WHOLE CURRICULUM AND IT IS DIAGNOSED BUT NOT FIXED.** An empty progress map is a
valid cache HIT, and `refreshProgressCache()` can write one during the await
inside `loadUserProgress()`. `isUnlocked()` then offers lesson one and nothing
else, for up to eight hours, renewing itself while the student works — with the
server record perfectly intact the whole time. **Read item 43 before anything
else in this file; it carries the one-line console repair for the affected
student.** ⭐ Also added items **37–42**, the staff-page polish set Jake asked for
after seeing reports and admin beside the student pages — measured rather than
judged, and **38 is a correctness item, not a cosmetic one**.

**v3.45.0, 2026-08-30.** ⭐✅ **ITEM 33 CLOSED — THE ONE THAT WAS COSTING CHILDREN
SOMETHING EVERY DAY IT STAYED OPEN.** `reports.html` v2.34.0, `firestore.rules`
v2.10.0. ⚠️⚠️ **AND IT SURFACED THAT v2.7.0 HAD THE SAME PERMISSION HOLE, SINCE
ROUND 15**: `lessonProgress` was open to building-scoped staff only, so the ⛑
grade-reconstruction button has been silently denied for every class teacher for
forty rounds. Same root cause as v2.9.0, twice over — **a permission checked
against one privileged account is not checked.** ⚠️⚠️ **BOTH RULES VERSIONS MUST
BE PASTED INTO THE FIREBASE CONSOLE**; the new emulator cases are UNEXECUTED.

**v3.44.0, 2026-08-30.** ⚠️⚠️ **`firestore.rules` v2.9.0 — THE PER-RUN DELETE
NEEDED A RULES CHANGE AFTER ALL, AND JAKE CAUGHT IT.** v2.8.0 allowed the update to
`isSuper()` and the owner only, so the ✕ worked for Jake and would have been
silently denied for every building admin and teacher. The new staff branch is
scoped by `canReadActivity(resource.data)` — the same predicate the read rule uses
— and clamped so it can only ever REMOVE: `affectedKeys().hasOnly()` on seven
rollup fields, `sprints.size()` must strictly shrink, and `seconds`/`chars` may not
increase. `delete` is widened the same way, because the button deletes the document
when the last run goes. ⚠️⚠️ **MUST BE PASTED INTO THE FIREBASE CONSOLE — a rules
file in the repo changes nothing until it is deployed.** ⚠️ **The six new cases in
`firestore-rules.test.mjs` are UNEXECUTED**; there is no emulator in the
environment they were written in. `npm run test:rules`.

**v3.43.0, 2026-08-30.** ✅ **ITEMS 32 AND 36 CLOSED** — `reports.html` v2.33.0 /
markup v1.5.0, shipped as one loop with a floating legend. ✅ **And item 32 needed
NO firestore.rules change** — this file said it did, and that was wrong: v2.8.0's
`allow update: if isSuper()` already covers it. Nothing to paste into the console.
⚠️ **Item 35 is deliberately still open**: the error-rate column exists so its
threshold can be set from a real week rather than guessed. ⚠️⚠️ **Item 33 remains
the one hurting children** and is untouched by the new delete button — the confirm
dialog says so out loud.

**v3.42.0, 2026-08-30.** ⭐ **ITEM 36 ADDED, AND ITEMS 32 + 35 + 36 ARE ONE
FEATURE.** Jake chose item 35's shape 1 (flag, don't block) and asked for the flag
at the DAY level, so he can tell which days need expanding without opening each
one. ✅ **The finding that shapes it: `typing_logs` already carries `mistakes`
beside `chars`, and the report already fetches it** — so a day-level error rate,
which is exactly item 35's discriminator, costs ZERO additional reads. Every other
flag he might want costs a read per student per day. **Build the free one first.**

**v3.41.0, 2026-08-29.** ✅ **ITEM 31 CLOSED** — `learn.js` v2.41.0, one guarded
repaint, with `drill-paint-test.mjs` asserting the invariant and not the call site.
⚠️⚠️ **AND admin.js WAS LYING ABOUT ITS OWN VERSION, THE OTHER WAY ROUND FROM ROUND
27.** The constant read `3.33.0` while the header carried honest v3.34.0 and
v3.35.0 entries whose code is demonstrably in the file. The HEADER was true and the
CONSTANT was stale — the build footer, the only diagnostic at a classroom machine,
has been reporting a two-round-old admin.js. Constant bumped to 3.35.0; the two
oldest entries archived for the 8-entry budget. **`npm test` and `audit:versions`
were both red on arrival because of it and are green now.** ⚠️
`metadata-map-test.mjs`'s 30 assertions were red BEFORE this round too and are NOT
this round's doing.

**v3.40.0, 2026-08-29.** ⭐ **SIX NEW ITEMS FROM JAKE'S CLEAN DAY — 30 THROUGH 35.**
Reported after one ordinary school day on the Round 54 build: two defects
(**30** adventure colour feedback, **31** the idle space-skip), two gaps in the
reports panel (**32** run-level delete, **33** deleted evidence does not reach
mastery), and two anti-farming asks (**34** the lesson-level lock, **35** the
spam guard). ⚠️ **33 IS THE ONE THAT IS HURTING CHILDREN TODAY** — students
Jake tested mastery on are locked out of lessons they never passed, and there is
no code path today that can undo it. ⚠️ **31 AND 35 ARE DIAGNOSED TO THE LINE**;
**30 IS NOT** and its heading says so.

**v3.39.0, 2026-08-26.** ✅ **§READS MEASURED, AND readWeek() IS 65% OF EVERY
READ.** A full student session cost 31 reads; 20 were `readWeek()`, and a Library
page load is 5 reads of which 5 are that function, cold or warm.
`daylog.js` v1.6.0 memoises it per page load, killing the double read on
game.html. **Two new items** carry the rest: **28** (the closed-day cache, 5 → 2)
and **27** (the guard learn.js has and game.js does not — deliberately deferred,
because it must be authored, not copied, in the path that lost guest minutes).

**v3.38.0, 2026-08-26.** ✅ **ITEM 6 CLOSED — BOTH HALVES OF THE MIDNIGHT
STRADDLE.** School mirrors Library: the tick closes the open run on the outgoing
day, with the rollover moved ABOVE the increments and the compensating `= 1`s
reverted to `= 0`. midnight-test.mjs Part D inverted, not deleted — nine
assertions now. ⚠️ open-unit-test.mjs's graded-gate check was a DISTANCE check
wearing a structure check's label and had to be brace-matched; it is stricter now,
not looser.

**v3.37.0, 2026-08-26.** ✅ **ITEM 23 CLOSED.** `currentRuns` is now paired with
the lesson it was built for (`currentRunsFor`), and both writers refuse when the
pairing breaks. ⚠️ **The guard the item proposed — comparing `buildRunList()`
lengths — would have been wrong twice**: `buildSequence()` is random per call, so
recomputing invites a false positive that would REFUSE A REAL RUN, and a swap
producing the same count passes it anyway. **AND 14a IS CLOSED BY VERIFICATION** — its ruling was
already shipped verbatim by item 14 (A🔥=2, A=1, B=0, mastered at 4, scored per
run). That is the FOURTH stale flag in this file, and it carried ⭐⭐.

**v3.36.0, 2026-08-26.** ✅ **ITEM 12 CLOSED.** School's lesson HUD put its
headline number seven pixels below every other headline in the bar, because an
empty lead row let the remaining row centre on the BAR's midline instead of the
LEAD row's axis — and style.css v3.9.0's comment asserted that behaviour as a
feature. Fixed in style.css v3.10.0 by reserving the row; guarded by
hud-lead-test.mjs Section E. ⚠️ **The item's other two bullets were STALE** and
Jake confirmed it — three stale flags in this file now, with 14a still suspected.

**v3.35.0, 2026-08-26.** ✅ **ITEM 26 CLOSED — THE CONTINUE-READING ROW IS ITS OWN
KIND OF OBJECT NOW.** Horizontal cards (small cover left, "Resume" above the
title, progress bar, last-read line) on the SHELF's own grid tracks, each card
spanning two columns so its edges land on the shelf's column lines rather than
near them. ⚠️ **THE OLD ROW'S WIDTHS WERE NEVER WHAT THE CSS SAID**: the element
carried `class="library-grid continue-grid"` and `.library-grid` is declared
LATER at equal specificity, so its columns and gap silently won. ⭐ The chapter
math left index.html for `chapter-position.js` v1.0.0 — one copy, both callers,
and importable by the harnesses, which no longer scrape source text out of an
HTML file. ✅ **ITEM 24 IS ALSO CONFIRMED IN PRODUCTION** — Jake typed three
sprints across tab switches and an immediate Home (the `pagehide` path), and
Reports showed every round with no duplicates.

**v3.34.0, 2026-08-26.** ✅ **ITEM 24 CLOSED — THE WRITER IS FIXED.** session-log.js
v1.7.0 derives a stable document id per chunk and writes with `setDoc()` instead
of `addDoc()`, so a resent chunk overwrites its own document instead of
duplicating it — covering both the killed-page path and the silent-local-write-
failure path with one change. Ships with firestore.rules v2.8.0 (owner `update`
rights on `typing_sessions`, under the same validation as `create`) and
game.js v3.46.0 / learn.js v2.38.0 (both now pass `doc`/`setDoc` into
`sessionLogInit()`). ⚠️ **VERIFIED AGAINST THE REAL EMULATOR, NOT JUST
REASONED ABOUT** — `npm run test:rules` ran clean (65 cases, 4 new) after
catching one bug in the new test's own seeding step. **THIS MUST DEPLOY AS ONE
UNIT**: the rules change without the code change does nothing; the code change
without the rules change is denied and retries forever.

**v3.33.0, 2026-08-25.** ✅ **ITEM 22 CLOSED BY MEASUREMENT** (zero drift across five students — not worth a round). ⚠️⚠️ **ITEM 24 MEASURED AT 12/51 STUDENT-DAYS AND IS LIVE** — the READER is fixed so `⟳` is safe, but **the WRITER is next round** and the fix needs a `firestore.rules` change with it.

**v3.32.0, 2026-08-25.** ✅ **§10.H RECALIBRATED** — its signal fired on every row because I picked the threshold with no data; it is relative to the scan now. ✅ **EVERY PAGE IS METERED** — three admin pages were invisible to `read-meter.js`, and the scan now warns before spending ~4,000 reads.

**v3.31.0, 2026-08-25.** ✅ **ITEM 25 IS FIXED** (Round 42) — "I'm done" no longer stamps a number smaller than the HUD. **Item 26 (resume buttons) is now the top open item.**

**v3.30.0, 2026-08-25.** ⚠️⚠️ **THE ⚑ BUTTON WROTE A WRONG GRADE AND IT IS FIXED AND SELF-HEALING** — re-run it and it corrects its own past output (HANDOFF §0.-31.N). ⚠️⚠️ **ITEM 24 IS NEW AND UNFIXED: DO NOT PRESS ⟳ ON A DAY WITH TWO ROLLUPS AT THE SAME MINUTE.**

**v3.29.0, 2026-08-25.** ⭐ **§10.H IS BUILT** — Jake's first ask, unbuilt for five rounds, shipped for zero extra reads. ⚠️ **ITEMS 13 AND 11a WERE STALE ⭐⭐ FLAGS** and are closed; 11a's residue is a RULING for Jake, not a bug.

**v3.28.0, 2026-08-25.** ⭐ **ITEM 15 IS BUILT** (Round 41) — the grade is stored where it is earned, and the `⚑` button reconstructs what 14b lost. ⚠️⚠️ **AND A PRACTICE DRILL WAS BEING GRADED AS THE LESSON** — HANDOFF §0.-31.A; **ITEMS 22 AND 23 ARE NEW** and record what that cost the archive. ⚠️ **`firestore.rules` v2.7.0 MUST BE PASTED INTO THE CONSOLE** or the new button does nothing.

**v3.27.0, 2026-08-24.** ✅ **THE READ BUDGET IS MEASURED AND FIXED** (Rounds
36–37). A sprint session went **80 reads → 12**, the library page **8 → 3**, a
report **1,155 → ~6**. ⚠️ **THE THREE CONSOLES DISAGREE
AND ONLY ONE OF THEM IS WATCHING THE APP** — read §READS below before opening any
of them again, or you will spend an afternoon profiling your own clicks.
✅ **ITEM 18 IS BUILT** (Round 37) once the ledger was verified on a real student
document. ✅ **ITEM 20's CACHE IS FIXED AND VERIFIED** — a second sprint costs 0 reads.
✅ **ITEMS 16, 17, 18, 19 AND 20 ARE CLOSED.** ⭐ **THE LEDGER IS NOW SEEDED ON
SIGN-IN** (Round 40) — `noteDay()` only fired on a typing flush, so a student who
signed in and never typed had no ledger and was swept in full **forever**.
✅ Item 19 (Continue Reading) costs **zero extra reads**. ⚠️⚠️ **THE SUITE'S "8 PRE-EXISTING FAILURES" WERE NEVER REAL** — see
§0.-29.A. `jsdom` and `acorn` were declared in package.json and simply not
installed in the container. **ALL 52 HARNESSES PASS.** Run `npm install` before
believing any failure count.

---

## § CONVENTIONS — standing rules, not tasks

Things that were once backlog items and are now simply how this project works.
**They are here so they stay true without needing a task to nag about them.**

### ⭐ EVERY ROUND SHIPS A CHANGED-FILES-ONLY UPLOAD SET

*(was item 8b — retired to convention Round 53. Jake: "Of course we do that.")*

Zip **only** the files a round actually changed, keeping the original folder
structure. ⚠️ **THE RISK IS ONE-DIRECTIONAL.** Round 28 changed 19 files of
180; shipping all 180 re-uploads 161 files nobody touched — every book in
`library/`, `firestore.rules`, `functions/` — each one a chance to overwrite a
good file with a stale copy, for **zero benefit**, through a web portal, by hand,
with a class arriving.

### ⚠️ VERIFY A FLAG BEFORE YOU BUILD FOR IT

**Four flags in this file have turned out already-shipped** — 13, 11a, two of
item 12's three bullets, and 14a, which carried ⭐⭐, the highest marker here.
One of item 12's bullets had its claim **backwards**. A stale ⭐⭐ cost Round 35
an entire round; the check costs minutes. **Read the code before you believe the
flag.**

### ⚠️ IF A ROUND TOUCHES LAYOUT, LOOK AT IT RENDERED

Two visual defects reached Jake's browser in one session — a HUD row seven
pixels off its axis, and covers rendering at full file size. **Both were CSS,
both were invisible to `npm test`, both took a screenshot to find.** Use a real
full-size asset, not a convenient thumbnail.

### ⚠️ GUARD ON STRUCTURE, NEVER ON DISTANCE OR WORDS

HANDOFF §0.-33.C's rule for writes applies to **harnesses** too. A check that
allowed "400 characters between the gate and the increment" was a distance check
wearing a structure check's label, and it failed on a comment while the property
it named was still true. Brace-match instead.

---

# ROADMAP INDEX — READ THIS FIRST

⚠️⚠️ **THE NUMBERS ARE NOT AN ORDER AND THEY ARE NOT UNIQUE. DO NOT RENUMBER
THEM.** Jake, 2026-08-25: *"I tried to navigate the roadmap, and it's practically
impossible... It counts from 9 to 12, and then 10 is the last thing listed."*
He is right, and here is exactly what is wrong:

* **Items appear in the order they were WRITTEN, not in numeric order.** Items 9
  and 10 sit at the END of the file because they were expanded long after they
  were filed.
* **⚠️⚠️ THERE ARE TWO DIFFERENT ITEM 18s.** `ITEM 18 — PRUNE readWeek() WITH THE
  LEDGER` (near the top, in the §READS block) and `ITEM 18 — THE READ BUDGET`
  (lower down) are unrelated. The §READS block runs its own series 18–21 that
  collided with the main list. **When citing, quote the TITLE, never the bare
  number.**
* Letter suffixes (`11a`, `14b`, `9b`) are follow-ons filed after their parent
  closed. They are not sub-items and can outlive the parent.

⚠️ **RENUMBERING WOULD BE THE EXPENSIVE FIX, NOT THE CHEAP ONE.** HANDOFF.md,
several source files and the harnesses all cite these numbers in prose —
`ROADMAP 15`, `item 14b`, `§10.H`, `item 18's ruling on reads`. Renumbering
breaks every one of those **silently**, in files no test reads. This index is the
fix instead: **Ctrl-F any line below to land on the section.**

## ⚠️ OPEN — needs work

**Priority first, then everything else by position in the file.**

### ▶ HOW TO APPROACH WHAT'S LEFT — grouped, Round 53

✅ **NO DEFECT IS OUTSTANDING**, with ONE qualification: **item 9's first bullet
is a repair, not tidying** — the day rollover lives only in the typing tick, so a
tab that wakes on a new day and signs in, flushes or paints *without typing*
works from stale day counters until the first keystroke. It is small and quiet,
but it is a bug. ⚠️ **Rounds 50 and 52 both said "no defect outstanding" while
that bullet and item 6 sat open. Read the headings, not the summary.**

**A. The reads work — finish it in this order.**
- **28** — the closed-day cache. **The only item with a measured payoff: 5 reads
  → 2 on every page load of every page.** §READS has the numbers.
- **29** — update `README.md`, twenty-five rounds stale. Cheap, and it is the
  file map a new reader starts from.
- **27** — the guard `learn.js` has and `game.js` does not. **Harness first**;
  the guard must be AUTHORED, not copied, in the path that lost guest minutes.

**B. The measurement chain — in order, and it needs a clean day first.**
- **5** — measure `log ÷ sessions` per student for one clean day. Sets a
  threshold from evidence rather than a guess. **Everything else here waits on
  it.**
- **4** — the implausibility flag: read-only, staff-only, *"this looks
  impossible, go look."* **Needs 5's threshold.**
- **1** — the drill-down and clock are **late, not wrong**. Constrains 4: a flag
  that fires every sixth period at 2:55 PM is a flag nobody reads by October.
- **7** — the 5-second floor. Small, downward, unmeasured. **Measure first**;
  lowering it fills the drill-down with noise records.

**C. Structural, no deadline.**
- **9** — move the rollover somewhere a page load can reach (the repair above),
  and extract the timer/stats/flush path out of `game.js` as a pure, testable
  `daycounter.js`. **That path is where every counting defect has lived.**

**D. Parked — no action.**
- **21** — the reverted future-day clamp, kept so nobody re-adds it.
- **⏳** the 2026-08-22 cutover — just watch it.

### ⭐⭐ THE CLEAN DAY — JAKE'S PLAN, 2026-08-26

**PURPOSE: FIND THE FLOOR, TO DECIDE ON A COUNTY ROLLOUT.** Jake:
*"I want to see how tight we can make it and then gauge whether or not I can
ship it to the county. That requires a clean run with all of the tightenings you
can think of."*

⚠️ **IT IS NOT A BEFORE/AFTER COMPARISON.** An earlier draft of this block said
to freeze before item 28 so today and tomorrow could be compared. **That was
wrong and it has been corrected.** Nobody needs the comparison; what is needed is
the *lowest number this build can produce*, measured on a real day.

**So: ship every tightening FIRST, then run one ordinary school day on the
resulting build.**

- ✅ daylog.js v1.6.0 — the per-load memo (game.html's double week read)
- ✅ daylog.js v1.7.0 — the closed-day cache (**2 reads per load, flat**)
- ⚠️ the ledger pass-through is the one known tightening NOT done — small, and
  it only affects the cold load

**What to capture** — the mechanics are in §READS, and follow them exactly:
`copy(ttbMeter.json())` on each page **before navigating**, never `reset()` after
a page has loaded, signed in **as a student**. Then `ttbMeter.day()` at the end.

**What good looks like:** a Library load at **2** reads rather than 5, a sprint
page well under its measured 16, and a full session comfortably under 31. Those
numbers × the county's student count are the rollout argument.

---


1. **47. ⭐ A GEMINI LICENCE CHECK, AND THE RIGHTS LADDER IT WOULD NEED LIFTED OUT OF admin.js FIRST**
   — ⚠️ **UNBLOCKED IN ROUND 57.** It waited on `metadata-map-test.mjs` being
   green, and that harness is green: the 39 assertions were test rot, not a
   defect. The ladder can be extracted now.
2. **27. ⚠️ game.js READS A WEEK IT DOES NOT NEED — THE GUARD learn.js ALREADY HAS**
   — ⚠️⚠️ **ITS VALUE COLLAPSED IN ROUND 52 AND NOBODY HAS RE-JUDGED IT.** The memo means the second call costs nothing already, and `loadUserStats()` needs the week regardless — so the guard now saves **roughly zero reads**. It is a tidiness/twin-symmetry item, not a performance one. **Do the harness first** if it is done at all.

Everything else still open:

- §READS — WHAT THE CONSOLES ACTUALLY MEASURE (2026-08-24)
- ITEM 21 — THE READ RESIDUE  *(low priority, recorded so it is not rediscovered)*
- 1. THE DRILL-DOWN AND THE CLOCK ARE LATE, NOT WRONG
- 4. THE IMPLAUSIBILITY FLAG
- 5. WHAT A NORMAL DAY LOOKS LIKE
- 7. THE 5-SECOND FLOOR
- 9. REDUCE THE SURFACE  *(the day-rollover bullet CLOSED Round 57; the rest stands)*
- 30. ⚠️ ADVENTURE MODE GIVES NO COLOUR FEEDBACK ON A WRONG KEY — AND CAPS LOCK IS WHERE IT SHOWS
- 34. ⚠️ THE LESSON-LEVEL MASTERY LOCK ONLY CLOSES WHEN EVERY RUN IS MASTERED
- 35. ⚠️ THE SPAM GUARD CANNOT FIRE IN A TWO-KEY LESSON
- 39. ⚠️ 64 alert() AND confirm() CALLS ARE THE LOUDEST “UNFINISHED” SIGNAL IN THE APP
- 42. ⚠️ admin.js STILL CARRIES 183 (Round 56 CLOSED THE admin.html HALF) — AND THE THREE THINGS THIS ITEM GOT WRONG
- 45. ⚠️ BOOKS ARE GLOBAL, SO “FILTER BY BUILDING” IS TWO FEATURES WEARING ONE NAME  *(Jake ANSWERED it Round 57 — it is student-facing visibility, not a staff filter; read the item before starting)*

## ⏳ WATCHING — no action, just don't forget

- ⏳ THE CUTOVER IS STILL 2026-08-22 — nothing to do but watch

## ✅ DONE — kept for the reasoning, not for the task

- 48. ✅ “TEXT PREPARED BY” NAMED THE WRONG PERSON ON EVERY BOOK, ON EVERY SURFACE  *(Round 57 — two defects, one symptom)*
- 44. ✅ THE BOOK ID FIELD ACCEPTS ANYTHING TYPED INTO IT, AND slugifyBookId() IS RIGHT THERE  *(Round 57 — warns on whitespace, never blocks)*
- 29. ✅ README.md IS TWENTY-FIVE ROUNDS STALE  *(Round 57 — file map regenerated from versions.js)*
- ✅ ITEM 18 — PRUNE `readWeek()` WITH THE LEDGER  *(BUILT, Round 37)*
- ✅ ITEM 20 — THE LEADERBOARD  *(cache FIXED Round 37; the gate is by design)*
- ✅ ITEM 19 — CONTINUE READING  *(BUILT, Round 38)*
- 25. ✅ FIXED (Round 42, Rem-Sho) — "I'M DONE" SHOWED A TIME THAT WAS NOT THEIRS
- 0. ✅ DONE — THE TWO-ROW TOP BAR AND "I'M DONE"
- 0b. ✅ DONE — THE SETTINGS PANEL FOR SCHOOL
- 2. ✅ THE GUEST PATH IS VERIFIED BY RUNNING — and item 9's oldest bullet is closed
- 2b. ✅ THE RESCUE IS WIRED IN BOTH MODES
- 3. ✅ DELETED — "learn.js FLUSHES FOR ANONYMOUS USERS" WAS A PHANTOM
- 7b. ✅ THE RANDOM DRILLS — `ass` LEADS, EVERYTHING ELSE IS NEVER-USE
- 8. ✅ STUDENT-FACING POLISH — THE FONT PICKER SHIPPED
- 11. ✅ FIXED (Round 33, Crandall) — A STUDENT IN A CLASS BUT NOT A SCHOOL
- 13. ✅ CLOSED (Round 41) — THE GATE DID NOT FIRE, AND THE SPEC WAS WRONG
- 14. ✅ BUILT (Round 32, Lambert) — MASTERY IS CUMULATIVE POINTS PER **RUN**
- 14b. ✅ FIXED (Round 31, Fitch) — RUN OUTCOMES WERE LOST ON "BACK TO MAP"
- 15. ✅ BUILT (Round 41, Rem-Sho) — STORE THE GRADE, AND RECONSTRUCT THE ONES 14b LOST
- 22. ✅ MEASURED AND CLOSED (Round 44) — runCount DRIFT IS ESSENTIALLY ABSENT
- 24. ✅ CLOSED (Round 46, Rem-Sho) — THE WRITER: A RESENT CHUNK NO LONGER DUPLICATES
- 26. ✅ CLOSED (Round 47, Blickensderfer) — THE CONTINUE-READING ROW READS AS ITS OWN THING
- 12. ✅ CLOSED (Round 47, Blickensderfer) — THE LEAD AXIS, AND TWO STALE BULLETS
- 23. ✅ CLOSED (Round 50, Blickensderfer) — THE RUN LIST IS PAIRED WITH THE LESSON
- 14a. ✅ CLOSED BY VERIFICATION (Round 50, Blickensderfer) — ALREADY SHIPPED BY ITEM 14
- 11a. ✅ CLOSED (Round 53) — JAKE RULED: THE WRITE-TIME STAMP IS CORRECT
- 8b. ✅ RETIRED TO CONVENTION (Round 53) — A STANDING RULE, NOT A TASK
- 28. ✅ CLOSED (Round 54, Blickensderfer) — THE CLOSED-DAY CACHE
- 6. ✅ CLOSED (Round 51, Blickensderfer) — THE MIDNIGHT STRADDLE, BOTH HALVES
- 31. ✅ CLOSED (Round 55) — THE IDLE SPACE-SKIP LEFT THE SPACE BAR LIT
- 41. ✅ CLOSED (Round 55) — THE SLOW CONTROLS NOW LOOK BUSY
- 40. ✅ CLOSED (Round 55) — THE STAFF PAGES ARE KEYBOARD-USABLE
- 38. ✅ CLOSED for reports.html (Round 55) — THREE SEVERITIES, ONE MEANING EACH
- 37. ✅ CLOSED (Round 55) — THE STAFF PAGES NOW USE A DESIGN SYSTEM
- 43. ✅ CLOSED (Round 55) — AN EMPTY PROGRESS CACHE LOCKED STUDENTS OUT OF THE CURRICULUM
- 46. ✅ CLOSED (Round 56) — WHO UPLOADED THIS BOOK, STAMPED AND NOT TYPEABLE
- 33. ✅ CLOSED (Round 55) — MASTERY CAN NOW BE CLEARED FOR A LESSON
- 36. ✅ CLOSED (Round 55) — THE DAY ROW NOW SAYS WHAT HAPPENED
- 32. ✅ CLOSED (Round 55) — A RUN CAN NOW BE DELETED WITHOUT ITS SESSION
- 16. ✅ FIXED (Round 40) — THE BUILD PANEL ON `reports.html` AND `admin.html`
- 17. ✅ CLOSED (Rounds 35–40) — REPORTS READ EVERY RECORD OF EVERY STUDENT
- 18. ✅ CLOSED (Rounds 36–40) — THE READ BUDGET
- 9b. ✅ DONE — THE THREE SHARED MODULES THE FOOTER COULD NOT SEE
- 10. ✅ BUILT — STUDENTS ARE FARMING THE FIRST THREE LESSONS

## REFERENCE

- Known, and not being fixed
- Settled — do not reopen

---

## 25. ✅ FIXED (Round 42, Rem-Sho) — "I'M DONE" SHOWED A TIME THAT WAS NOT THEIRS

✅ **One clause: `flushStats()`'s gate never read its own `final` argument, so
every press mid-run wrote nothing.** ⚠️ **A twin divergence where `game.js` was
already correct** — see HANDOFF §0.-32. `tests/im-done-test.mjs` drives both.

### The original report, kept

**Jake, 2026-08-25, with two screenshots.** The HUD reads `Daily 10:02 / 10:00`.
The receipt stamps **`AUG 25 9:31 — RETURNED`** and says *"Your minutes are
counted."* **It is 31 seconds short, and the 31 seconds are the run the child is
in the middle of.** The second screenshot is the same button pressed after a run
completed: HUD `10:26`, receipt `10:26`. **They agree only when nothing is in
flight.**

⚠️⚠️ **THIS IS THE HIGHEST-PRIORITY OPEN ITEM AND IT OUTRANKS EVERY OTHER ENTRY
IN THIS FILE.** Not because 31 seconds matter arithmetically — they do not — but
because of *what the receipt says*. It is the one screen in the app whose entire
job is to tell a child their work was recorded, and it tells them a number that
is smaller than the one they were watching a second earlier. **A student who
notices learns that the app under-counts them.** Every other item here is about
data a teacher reads; this one is about trust a child has.

**THE MECHANISM (read before fixing — this is a theory, not a diagnosis):**
`logRun()` banks a run's seconds when the run ENDS. Mid-run elapsed time lives in
the live counter that the HUD renders and has not been written anywhere. The
receipt reads what is stored, so it is *honest about storage* and *wrong about
the child*.

⚠️ **THE FIX IS PROBABLY ALREADY IN THE FILE, WHICH IS THE REASON TO BE CAREFUL.**
`logRun()` already writes a partial for an interrupted run — that is what
`(left page)` and `(hidden)` are. So "I'm done" plausibly needs to do exactly
what leaving the page does: flush the partial, *then* render the receipt.
**⚠️ VERIFY THAT AND DO NOT ASSUME IT:**
* Does the partial-flush path double-count if the run is later completed? The
  watermark (`stepLoggedSeconds`) exists to stop that — **confirm it, with a
  harness, before touching the writer.**
* Does the receipt read `typing_logs`, the live counter, or `statsData`? All
  three exist and they are not the same number (§3.1).
* ⚠️ **A partial flush writes a `typing_sessions` sprint.** After Round 41 that
  sprint gets graded. **An abandoned partial must not become a graded attempt** —
  `run-grade.js`'s orphan rule covers the fragment-with-no-start case, but a
  partial with a start is a different shape. **Check it.**

⚠️ **AND CHECK THE OTHER DIRECTION.** If the receipt is fixed by flushing, the
receipt and the HUD must agree *afterwards* too — a fix that makes the stamp
right while leaving the HUD ticking from a stale seed just moves the lie.

---

## 29. ✅ README.md IS TWENTY-FIVE ROUNDS STALE

`README.md` is **v2.0.0, Round 28 (2026-08-23)**. Rounds 29–52 have since added
or changed, at minimum: `chapter-position.js`, `celebrate.js`, `receipt.js`,
`logdays.js`, `settings-panel.js`, `run-grade.js`, `lesson-gate.js`, the
source-split cutover, the two-row HUD, the School settings panel, the language
filter, `school-audit.html`, and the harness count (**17 → 58**).

⚠️ **IT IS THE FILE MAP AND DATA MODEL** — HANDOFF §7's document map assigns it
*"what the project is; file map, data model."* A stale file map is worse than
none: it sends a reader to a module that has since moved or been split.

⚠️⚠️ **AND IT HAS BEEN DESTROYED ONCE BEFORE.** Round 28 found the project README
overwritten wholesale by a copy of `tests/README.md`. **Read what is actually in
it before editing**, and do not let the two converge again.

**Do it on a round with room, not as a rush at the end of one.**

---

## 27. ⚠️ game.js READS A WEEK IT DOES NOT NEED — THE GUARD learn.js ALREADY HAS

**MEASURED 2026-08-26.** `game.html` spent 10 of its 16 reads in `readWeek()`,
because it reads the same week TWICE per page load:
`retroactiveSaveGuestSession()` reads one, then `loadUserStats()` reads it again
three lines later. daylog.js v1.6.0's memo now serves the second from memory, so
**the cost is paid once instead of twice — but it is still paid.**

⚠️ **learn.js DOES NOT PAY IT AT ALL**, because its equivalent function returns
before the read when there is no guest data:

```js
if (!anonSecondsAccum && !Object.keys(anonLessonProgress).length && !sessionExpired) return;
```

`game.js`'s `retroactiveSaveGuestSession()` guards only `if (!user ||
user.isAnonymous) return false;` and then reads unconditionally. **Another
hand-maintained twin**, and the divergence is measurable: School's map load
costs 5 daylog reads, Library's book load costs 10.

⚠️⚠️ **THIS WAS DELIBERATELY NOT DONE IN THE §READS ROUND, AND THE REASON MUST
SURVIVE.** `game.js` has **no `anonSecondsAccum`** — no page-local guest
accumulator at all — so the guard cannot be copied across, it has to be
AUTHORED. And this is the code path with a history of losing guest minutes:
game.js v3.36.0 exists because `retroactiveSaveGuestSession()` ran in the wrong
ORDER and erased what a signed-out child had typed; the comment above the call
site still says so. **A guard that is slightly too eager silently drops a
child's minutes, which is far worse than the read it saves.** A performance
round is the wrong place to author a new correctness condition in the
guest-merge path.

**What it needs:** work out what `game.js` can legitimately test for — pending
guest sprints via `sessionLogPending(GUEST_QUEUE_UID)`, whatever local stats
contribution `mergeGuestStats()` would fold, and `sessionExpired` — and prove
with a harness that a guest who typed before signing in still keeps every
second. **Do the harness first.** Saving: roughly 5 reads per Library page load
for the common case of a student who was never a guest.

---

## 28. ✅ CLOSED (Round 54, Blickensderfer) — THE CLOSED-DAY CACHE

✅ **SHIPPED daylog.js v1.7.0.** Days strictly before yesterday are banked in
localStorage, so a week read costs **today + yesterday** instead of every day the
student has typed this week.

**Measured on the shipped code**, a student who typed Mon–Wed, with the ledger
in play:

| | reads | week total |
|---|---|---|
| cold load | 3 | 1800s |
| every load after | **2** | 1800s |

⚠️⚠️ **AND IT NO LONGER GROWS WITH THE WEEK.** That was the actual defect: reads
scaled with how many days a child had typed, on every page load, so a five-day
typist paid five reads per load by Friday. It is now **flat at two**, Monday or
Friday.

⚠️⚠️ **YESTERDAY IS NEVER CACHED.** "A closed day never changes" is *almost* true
and the margin is where the bug would live — the Overnight Rescue
(game.js v3.37.0's `carryOverPlan()`) credits typing to THE DAY IT WAS TYPED ON
and reaches back into yesterday's document. Caching it would hide that
correction from the child who earned it, to save one read.

⚠️⚠️ **THE CACHE EXPIRES AT LOCAL MIDNIGHT, AND THE REASON IS NOT A GUESS AT A
TTL.** A teacher's ⟳ recalc rewrites a past day's document *from the teacher's
browser*, which cannot invalidate a student's localStorage. **There is no hook to
add** — an expiry is the only mechanism available, and a school day is the right
grain: a recalc reaches the student's HUD by the next school day, while every
page load after the first within a day costs nothing.

⚠️ **IT MAY OVER-READ AND MUST NEVER UNDER-READ** — logdays.js's contract.
Expired, foreign-uid, wrong-shape and corrupt caches are all discarded and the
day is read for real, and **nothing is banked from an `ok:false` run**. An
undercount is indistinguishable on screen from a light week.

`tests/closed-day-cache-test.mjs`, 23 assertions, mutation-verified: caching
yesterday fails B2/B3, banking on a faulted run fails E2, ignoring the expiry
fails D1.

⚠️ **TWO READER HARNESSES NEEDED BOTH CACHE LAYERS DROPPED** — `logdays-test`
and `daylog-test` reuse one uid across fixtures, and a day banked by an earlier
part was served to a later one. Neither stubs the caches out; they drop them, so
they still test the reader that ships.

### The remaining, smaller thing

⚠️ **The ledger pass-through is still not done.** No `readWeek()` call site
passes `ledger`, though daylog.js's docstring says a caller holding
`users/{uid}` should pass `ledgerFrom(userData, uid)`. With the cache in place
this only affects the **cold** load, and at Ellis the local per-machine mirror
already covers most of it — students use the same MacBook daily. **Small. Do it
if a round has room.**

### The original item, kept



**MEASURED 2026-08-26:** `readWeek()` was **20 of 31 reads across a full student
session — 65%**. A Library page load costs **5 reads, and all 5 are this
function**; cold and warm are identical, because nothing caches it across loads.
daylog.js v1.6.0's memo fixes the WITHIN-a-load duplication only.

⚠️ **THE STRUCTURAL COST: YOU CANNOT SKIP A DAY THAT HAS DATA.** `planReads()`
skips days known EMPTY, but a day with typing must be read to get its numbers.
So reads scale with how many days a child has typed this week, **on every page
load, all week**. A student who types five days a week pays five reads per load
by Friday.

⭐ **THE FIX: A CLOSED DAY NEVER CHANGES AGAIN.** Cache the folded totals for
days older than yesterday in localStorage, and the week read becomes *today +
yesterday + anything uncached* — **5 reads down to 2** on a warm machine, on
every page load, on every page.

⚠️ **KEEP YESTERDAY LIVE, DO NOT CACHE IT.** Both `typing_logs` writers target
`today`, but the Overnight Rescue path (game.js v3.37.0's `carryOverPlan()`)
exists specifically to credit typing to *the day it was typed on*, and that is
exactly the kind of edge that makes "a past day is immutable" wrong at the
margin. The cost of being conservative here is one read.

⚠️ **AND THE LEDGER PASS-THROUGH IS A SEPARATE, SMALLER THING.** Not one of the
seven `readWeek()` call sites passes `ledger`, though daylog.js's own docstring
says a caller holding `users/{uid}` should pass `ledgerFrom(userData, uid)`.
**Expect a small win at Ellis specifically**: students use the same MacBook every
day, so the local per-machine mirror is already close to the server's copy. Worth
doing, not worth leading with.

---

## 26. ✅ CLOSED (Round 47, Blickensderfer) — THE CONTINUE-READING ROW READS AS ITS OWN THING

✅ **SHIPPED index.html v3.15.0 + chapter-position.js v1.0.0.** The row is
horizontal cards now — 46px cover at the left, "Resume" in accent caps above the
title, a progress bar, and a "Last read …" line — with an accent rule down the
left edge of each card.

⚠️⚠️ **THE OLD ROW'S WIDTHS WERE NEVER WHAT THE STYLESHEET SAID, AND THAT IS THE
FINDING WORTH KEEPING.** The grid element carried `class="library-grid
continue-grid"`. `.library-grid` is declared LATER in the stylesheet at EQUAL
specificity, so its `grid-template-columns` and `gap` silently overrode
`.continue-grid`'s — every width in that rule was dead. Jake saw it as "slightly
off" and it was: the cards were shelf-width, and the heading sat at the page edge
while the cards were centred inside `.library-grid`'s max-width. ⚠️ **A
SHARED-CLASS OVERRIDE FAILS SILENTLY AND LOOKS LIKE A DESIGN CHOICE.** Nothing
errors; the page just renders someone else's numbers.

✅ **THE FIX FOR "slightly off" IS SHARED TRACKS, NOT A CLOSER NUMBER.** Jake:
being slightly different is worse than being obviously different. So the row
declares the SHELF's columns and gap, and each card spans TWO of them — card
edges land on the shelf's own column lines at every viewport width because they
are computed from the same tracks. Change `.library-grid`'s `minmax` and the row
follows it. ⚠️ **DO NOT GIVE `.continue-grid` ITS OWN COLUMN WIDTHS** — that is
the bug this item was about, in the other direction.

✅ **THE SHELF HAS A HEADING NOW** ("The stacks"), so the two rows read as two
named things rather than one long scroll. It is deliberately NOT hidden with the
Continue row: a guest, or a student with no progress, still has a shelf.

⭐⭐ **THE CHAPTER MATH LEFT index.html.** `chapterPositionOf()` and
`lastReadLabel()` are `chapter-position.js` v1.0.0. The new progress bar needed
the SAME number the shelf card prints, and copying it would have been the FIFTH
hand-maintained twin this project has had to hunt down. ⚠️ **A LOCAL FUNCTION
WOULD HAVE KILLED THE TWIN AND STILL BEEN THE WRONG ANSWER** — Jake asked why it
was not a shared module, and he was right: a module is importable by the
HARNESSES too, so progress-test.mjs and continue-reading-test.mjs no longer lift
source text out of an HTML file and rebuild it with `new Function`. Registered in
all three registries (versions.js, tools/audit-versions.mjs,
tests/version-stamp-test.mjs) — ⚠️ all three, or the build panel lies; §9b is the
round where three modules were invisible to the footer for weeks.

⚠️ **`chapterPositionOf()` IS NOT `progressOf()`.** Position vs completion. A
child on ch. 5 who finished 3 is 42% by one and 25% by the other. The bar uses
the one the shelf card prints, so one book cannot show two different percentages
on one screen.

⚠️ **A NULL POSITION DRAWS NOTHING, NEVER A 0% BAR.** A confident wrong answer is
worse than an absent one. `continue-reading-test.mjs` C3 checks the template
omits and **C4 checks the CALLER decides to** — C3 alone passed a mutation that
forced the bar on, which is why both exist.

### ⚠️ STILL OPEN, AND IT WAS THIS ITEM'S OWN INSTRUCTION

**Nobody has verified whether kids were MISSING the row or IGNORING it.** The
redesign was worth doing either way, but if they are ignoring it, a better-
looking row will not move the number and the real fix is elsewhere. The
drill-down can answer this. **Check before assuming this item did anything.**

### The original ask, kept



**Jake, 2026-08-25:** *"The resume book buttons in the library work, but they're
way too big... it looks like it's a part of the library, and kids are rolling
right past it."*

**The ask:** a **quarter-size cover** with text to its right — *"Resume Alice's
Adventures in Wonderland"* — so the row reads as a **different kind of thing**
from the shelf below it, not as the first item on the shelf.

⚠️ **THE PROBLEM IS CATEGORY, NOT SIZE.** Shrinking the cover without changing
the layout would make it a *small shelf item*, which is the same mistake quieter.
A horizontal card with the verb first (*Resume…*) is a different visual grammar
from a grid of covers, and the grammar is what tells a child this row is about
**them** rather than about the library.

⚠️ **VERIFY THE CLAIM BEFORE REDESIGNING.** *"Kids are rolling right past it"* is
an observation worth trusting, but Continue Reading was BUILT in Round 38 (item
19) and the drill-down can show whether resumed books are actually being opened.
**Check whether the button is being missed or being ignored** — they need
different fixes, and only one of them is a layout change.

---

## 0. ✅ DONE — THE TWO-ROW TOP BAR AND "I'M DONE"

✅ **THE BAR SHIPPED 2026-08-21 EVENING** (hud.js v1.3.0, game.js v3.39.0,
learn.js v2.24.0, style.css v3.7.0, both HTMLs, tests/hud-lead-test.mjs).
⚠️ **The hold below was lifted by Jake and the reasoning was better than mine:**
nobody types between now and midnight and grades are in, AND the old bar was
already truncating `Daily 41:37 / 10:00…` — so Monday's verification was going to
be done through a broken instrument either way.
✅ **THE LANDING PAGE SHIPPED TOO** (index.html v3.10.0). ⚠️ **The "extra read"
this item warned about did not exist:** `loadIndexStats()` was already calling
`readWeek()` every visit and discarding the result into a `#index-stats-bar`
element that had been deleted from the markup. Goals resolve from game.js's own
`ttb_goalsCache_v1`, so the usual case adds nothing at all.

✅ **"I'm done" SHIPPED** (receipt.js v1.0.0, game.js v3.42.0, learn.js v2.27.0,
tests/done-button-test.mjs). **ITEM 0 IS CLOSED.**

⚠️ **ONE THING MOVED OUT RATHER THAN CLOSED WITH IT: the trophy on the landing
page** — see item 0c below — that last one is a real feature,
not a button: `index.html` has no leaderboard and `openLeaderboard()` lives in
`game.js`.

⚠️ **THE FIRST THING TO BUILD AFTER MONDAY'S VERIFICATION COMES BACK CLEAN, AND
NOT ONE HOUR BEFORE.** Every screen below is an instrument Jake reads on Monday
to check the cutover. Redesigning it the night before means a wrong number has
two candidate explanations again, which is the trap Round 25 spent a whole
session removing. Specced 2026-08-21 with Jake, from live renders. Buildable.

### 0a. Why the bar is crammed — the parenthesis is a second row trying to happen

`hudStrings()` returns ONE glued string:
`Sprint 0:00 / 0:30 (Daily 41:37 / 10:00)`. At 40+ characters it overruns
`#hud-time`'s nowrap flex third, so hud.js v1.2.0 added a `long` flag that
shrinks the font and appends an ellipsis. **That was a band-aid and the renders
show it failing** — students see `Daily 41:37 / 10:00…` with the goal cut off.

⚠️ **THE FIX DELETES THE `long` FLAG RATHER THAN TUNING IT.** Give the slot two
rows and the parenthetical has somewhere to live. `hudStrings()` returns
`{ lead, sub }`; the ellipsis machinery goes.

### 0b. The layout — three columns, two rows each

| | Lead row (15px, bold) | Sub row (11px, `#888`) |
|---|---|---|
| **Left** | `Daily 41:37 / 10:00 ✓` | context — book · chapter, or lesson name · lesson time |
| **Centre** | sprint `0:12 / 0:30` | `38 wpm · 94% · 🔥 6` |
| **Right** | `Violet Peek` | `Weekly 117:51 / 50:00 ✓` |

Then the ⚙ (Adventure only, currently orphaned BELOW the bar in the render), the
stamp button, and `(Logout)`.

⚠️ **DAILY IS THE LEAD ROW ON EVERY SURFACE AND THIS IS NOT NEGOTIABLE WITHOUT
JAKE.** He asked for sprint-above-daily; the counter-argument he accepted is the
epigraph at the top of `hud.js` — *"telling kids where to look for their minutes
is kind of terrible."* Sprint-above-daily makes Daily the lead line on the
landing page and the sub line inside a book, so **the graded number moves
depending on where the child is standing.** That is the exact defect hud.js was
extracted to kill. The sprint moves to the CENTRE instead, with the other live
readouts, because a sprint is a live quantity and not a time quantity — it has
been on the left only because that is where the parenthesis put it.

**The cost, named honestly:** the big countdown is motivating and it shrinks.
The fallback if Jake wants it back is bolding the sprint within the centre
cluster, NOT promoting it to lead-left.

### 0c. Per surface

1. **Library landing (`index.html`)** — ⚠️ **THE ONLY GENUINELY NEW WORK.** It
   has no time readout at all today and no Firestore read. It needs `Daily` on
   the lead-left and `Weekly` **under the name**, plus the trophy. **No class
   name here** — Jake's ruling, it lives in settings.
   ⚠️ **IT MUST BE A REAL `readWeek()`, NOT `hudCacheLoad()`.** The cache is
   display-only; painting it as truth is the second-source-of-truth trap hud.js
   warns about in capitals. Cost: seven document reads per landing visit, on a
   page that is free today. Name that to Jake before shipping it.
2. **Standard (`game.html`)** — left `Daily` over `book · chapter`, centre
   sprint. ⚠️ **THE TROPHY IS ALREADY HERE** — `#trophy-btn` is un-hidden on
   sign-in, not on view, so Standard and Adventure share it. Nothing to add.
3. **Adventure** — identical bar. ✅ The ⚙ got a home in the row (game.js
   v3.39.1); it had been `position:absolute` against `<body>` and floating below
   the HUD for a long time.
   ⚠️ **THERE WAS NEVER AN OPEN QUESTION HERE, AND THE LESSON IS ABOUT MOCKUPS,
   NOT ABOUT CHECKMARKS.** This item recorded Jake's *"checkmark on adventure can
   go next to the time — it doesn't need its own row"* as a design choice needing
   a ruling. It was a **BUG REPORT ABOUT A PREVIEW.** The mockup Round 26 drew
   crammed eight elements into the Adventure row, it wrapped, and the ✓ landed on
   a third line. Jake was pointing at the render.
   The shipped answer is that the ✓ is part of the string `hudStrings()` builds —
   `'Weekly ' + pair(…) + ' ✓'`, one element, inline with the time — and always
   has been. **Nothing to decide, nothing to build.**
   ⚠️ **DO NOT RE-RAISE THIS.** And the general form is worth keeping: when a
   drawn preview and the shipped code disagree, feedback on the preview is
   feedback on the preview. Ask which one the person is looking at before writing
   it down as a ruling.
4. **School (`learn.html`)** — left `Daily` over `lesson name · lesson time`.
   No sprint exists (School gates on WPM and accuracy, not time), so the centre
   is WPM over accuracy. The name-over-class right column **already ships here**
   — this is the pattern the other three copy, not a new build.

### 0d. "I'm done" — the stamp

A student-facing exit that calls `logOpenSprint()` / `logOpenRun()` and then a
`final` flush. **Both halves already exist and are already called on every other
exit path; this is a third caller, not new machinery.**

⚠️ **IT IS A RECEIPT, NEVER A REQUIREMENT, AND THE WORDING IS THE SAFEGUARD.**
The flush happens anyway — on the interval, on `pagehide`, on sign-out. The
moment a child believes unpressed means unsaved, the one who packs up when the
bell rings loses minutes and a grade depends on a ritual. **Never "Save". Never
a warning for skipping it. Never the only way out.** Jake chose "I'm done".

What it buys:
- ⚠️ **IT MANUFACTURES THE DELIBERATE EXIT §3.1 SAYS DOES NOT EXIST** — *"a
  `final` flush needs a deliberate exit and a child closing a Chromebook lid
  produces none."* It does not FIX the unflushed-tail gap; it gives every child
  a way not to be in it.
- **It closes the open sprint**, so the drill-down matches the day total instead
  of dropping the tail under the five-second floor. That tightens item 5's
  `log ÷ sessions` yardstick directly.
- **The receipt is a week of receipts.** The stamped card shows five days, so a
  child can see their own week without a teacher pulling a report — Rule 11
  turning into a feature instead of a constraint.

⚠️ **SCHOOL PLACEMENT HAS A LIVE HAZARD.** Item 8's ruling put the font picker on
the map, not in the drill, because a focusable control inside the drill view is
one Tab away from eating a keystroke the child should have been credited for.
"I'm done" has the opposite requirement — they are IN the drill when the bell
rings. **Resolution: `tabindex="-1"`, click-only, parked clear of the drill
text.** Tab can never reach it; the mouse always can.

### 0e. Files, and what a harness must assert

`hud.js` (`{ lead, sub }`, `long` deleted) · `game.html` · `learn.html` ·
`index.html` (+ its first `readWeek()`) · `style.css` · the renderers in
`game.js` / `learn.js` · Adventure's ⚙ placement.

A harness should assert **that `Daily` is the lead element in all four
surfaces** — that is the invariant this whole item exists to protect, and it is
the one a later round would quietly undo while making the bar look nicer.

---

## 0b. ✅ DONE — THE SETTINGS PANEL FOR SCHOOL

**Shipped 2026-08-22** (settings-panel.js v1.0.0, learn.js v2.29.0,
style.css v3.8.0, drill-filter-test.mjs v1.5.0). A ⚙ in School's top bar, in the
same slot as Library's, opening a dialog that holds all three things this item
was opened for:

1. ✅ **The reading font.** Moved out of the map header. ⚠️ **RULE 9 — IT WAS A
   MOVE, NOT A COPY:** `DRILL_FONTS`, `applyDrillFont()`, `readDrillFont()` and
   `buildFontPicker()` are DELETED from `learn.js` in the same deploy that added
   them to `settings-panel.js`. `drill-filter-test` F9b asserts no copy grew
   back — two font tables nobody chose to differ is how the celebrations drifted.
2. ✅ **The class**, plus the goals the top bar's numbers are measured against.
   ⚠️ **THIS WAS THE DEBT v2.24.0 CREATED:** `updateClassDisplay()` had been
   writing to `#user-class-name`, an element deleted from `learn.html` in that
   same version, so the class name went nowhere at all — the same orphaned-paint
   shape as §0.-13.C's `loadIndexStats()`.
3. ✅ **Parity.** Same id, same slot, same gesture as Library's ⚙.

✅ **AND THE STUDENT ID JOINED IT**, on Jake's ask — the same eight characters the
corner stamp and `reports.html` show, from the same `currentUser.uid`.

### ⚠️⚠️ JAKE RULED ON WHAT "DON'T TOUCH THE TIMING MECHANISM" MEANS

2026-08-22: *"When I said 'don't mess with the timing mechanism', I meant not to
break the ability to track the time accurately. It acting the same way it does in
library mode — namely, counting time typed and pausing when necessary — is just
fine."*

**So the condition on items 7b/8 is about ACCURACY, not about never stopping the
clock.** This item shipped for a few hours with the gear hidden during a drill,
on the stricter reading; the ruling replaced that with a pause, exactly like
Library's menu. **The gear is now available in both views.**

⚠️ **AND THE PAUSE BUYS LESS THAN IT LOOKS LIKE, WHICH IS WHY IT IS SAFE.**
`startGradedTimer()`'s gate is `drillPos > 0 && !isDrillIdle()`, and
`LEARN_IDLE_THRESHOLD` is 3 seconds — **School's clock already stops itself three
seconds into any pause.** The explicit pause removes those three seconds and
makes the intent legible. It is not what stands between a child and a wrong
number.

⚠️⚠️ **THE RISK IS THE RESUME, NOT THE PAUSE, AND IT IS ASSERTED IN FIVE PLACES.**
A pause that never resumes means a child types for the rest of the lesson while
NOTHING COUNTS — silent, no error, minutes gone, strictly worse than the problem
the pause solves. So: one `close()` reached by ✕, Esc and backdrop alike; the
resume handed to `onClose` and run in a `finally` so a throw in the teardown
cannot swallow it; guarded on `drillRunning` so it only resumes what it paused.
`drill-filter-test` F7c1–c5, F7d, F7e. Mutation-verified both ways.

### ✅ DONE — THE CORNER ID STAMP IS GONE, THE ID IS IN BOTH SETTINGS

**Closed 2026-08-22 (Round 27g), on Jake's confirmation:** *"as long as you fold
it into the game/library settings, as it's not there right now."*

⚠️ **HE CAUGHT THE HALF-BUILT TWIN BEFORE I DID.** School's ⚙ panel had the ID;
Library's Settings menu did not. Deleting the corner stamp without adding it to
Library would have removed a child's only way to read their own ID in Library —
**the seventh twin of the week, and it would have been mine.**

Shipped: `game.js` v3.42.3 puts the ID in the Settings menu with click-to-copy;
`settings-panel.js` v1.2.0 gained an optional `copy` on info rows so School's
row keeps the same behaviour; `renderIdStamp()` deleted from **both** writers in
one commit. ⚠️ **`HANDOFF.md` §2's deploy check named the stamp and has been
rewritten** — the build footer is the instrument now, and a better one since this
round made the version stamps honest.

The two reasons it had been left standing, both now answered:

- `HANDOFF.md` §2's deploy check reads *"If the ID stamp is missing, the new code
  is not running and nothing else you check means anything."* That instruction
  would need rewriting in the same commit. ⚠️ It is now a weaker argument than it
  was this morning, because Round 27 fixed the footer version stamps and the
  footer is the better instrument.
- The stamp exists so a child can read eight characters aloud across a classroom
  without navigating anywhere (see the block above `renderIdStamp()`).

**It is a one-line removal from both writers when Jake says so.**

---

## §READS — WHAT THE CONSOLES ACTUALLY MEASURE (2026-08-24)

⚠️ **THIS SECTION HAD NO BODY UNTIL ROUND 53.** The index promised it for several
rounds and there was nothing to land on. Written up here from the first real
end-to-end measurement.

⚠️ **NUMBERING:** this block runs its own series **18–21**, unrelated to the
main items 18–21 lower in the file. See the index's note.

### ✅ THE MEASUREMENT, 2026-08-26 — SIGNED IN AS A STUDENT, FULL SESSION

Route: Library → sprint → leaderboard → Library → School → lesson → practice
→ map. Captured with `copy(ttbMeter.json())` on each page **before** navigating.

**31 reads, 11 writes, 4 misses.**

| Page | `readWeek()` reads | everything else |
|---|---|---|
| game.html (sprint) | 10 | 6 |
| index.html — **cold AND warm** | 5 | **0** |
| learn.html | 5 | 3 |

⚠️⚠️ **`readWeek()` WAS 20 OF THE 31 — 65%.** Every other read site in the whole
session was 1–2 calls. **There is one cost centre, not several.** A Library page
load is five reads of which five are that one function, and cold and warm are
identical because nothing cached it across loads.

### THE THREE FINDINGS

1. **game.html read the same week TWICE per load** —
   `retroactiveSaveGuestSession()` then `loadUserStats()`, three lines apart,
   same uid, same date. ✅ **Fixed in daylog.js v1.6.0's per-load memo.**
2. **`learn.js` skips that read entirely when there is no guest data; `game.js`
   does not.** → **item 27**, deferred deliberately.
3. **You cannot skip a day that HAS data.** `planReads()` skips days known
   empty, but a day with typing must be read for its numbers — so reads scale
   with how many days a child has typed this week, **on every page load, all
   week**. → **item 28**, the closed-day cache.

### ⚠️ HOW TO TAKE THIS MEASUREMENT AGAIN — THE MECHANICS MATTER

* `session` is **per page load and in memory**; it dies on navigation. `day` is
  **totals only**, in localStorage, and carries **no per-path detail**.
* So: `copy(ttbMeter.json())` **on each page before leaving it**. Do the thing,
  copy, *then* navigate.
* ⚠️ **DO NOT `reset()` AFTER A PAGE HAS LOADED.** Round 52 did, and it zeroed
  reads that had already happened — the first Library sample came back as 0 and
  had to be retaken. Reset before opening anything, or not at all.
* `ttbMeter.day()` at the very end for the cross-navigation total.
* ⚠️ **Sign in as a STUDENT.** An admin account reads staff and class documents
  students never touch and inflates everything.

### CONTEXT FOR THE NUMBERS

⚠️ **ITEM 18's RULING STANDS: reads are ~50× dearer than writes.** Do not trade
a read saving for a write saving. 31 reads for a full session is **healthy** —
item 18 took a sprint from 80 to 12 and it has held. At 400 students that is
roughly 14k reads against a 50k daily quota. **This is headroom work, not a
fire.** Admin and reports legitimately read a lot and are not the thing that
multiplies; the student pages are.

---

## ITEM 21 — THE READ RESIDUE  *(low priority, recorded so it is not rediscovered)*

⚠️ **THIS SECTION ALSO HAD NO BODY UNTIL ROUND 53** — its only surviving
description was one line in HANDOFF.md.

A future-day clamp was added to the week read and then **reverted**.
`planReads()` already skips a day it knows is empty, and a future day is the
easiest case of that; two mechanisms doing one job means two places to check when
a number looks wrong, and only one of them was tested.

⚠️ **JAKE'S SATURDAY-TO-FRIDAY WEEK DEFAULT MUST NOT CHANGE.** This item exists
only to record the three-line restore **if ledger seeding ever fails to deliver
in production**. It is not work to schedule — it is a note so nobody rediscovers
the clamp and re-adds it as a novelty.

---

## 1. THE DRILL-DOWN AND THE CLOCK ARE LATE, NOT WRONG

**Reframed by Round 24 on new evidence. This is a smaller problem than it has
been described as for two rounds.**

Jake re-generated 2026-08-20 about thirty minutes after typing. Two things that
Round 23 recorded as MISSING were present:

| | Round 23 saw | Round 24 saw |
|---|---|---|
| the 12:57 PM Library sprint | absent from the drill-down | **1m 8s · 89 WPM · 504 ch, present** |
| the 2:05 PM sprint's daily log | day read 11m 40s / 2,781 ch | **12m 40s / 3,337 ch** |

Both arrived on their own, one visit late. That is `game.js` v3.25.0's known
behaviour — the queue drains on the next page that runs a flush — and it means
**a report read minutes after a period ends is not yet the record.** Every
conclusion drawn from a freshly-generated report in Rounds 22 and 23 is suspect
for that reason, including some written down as fact.

⚠️ **BEFORE CALLING ANYTHING MISSING, LOOK AGAIN LATER.** Cheapest possible
rule, and it would have saved this project a round.

**What is genuinely still open:** the day counter runs through pauses inside a
sprint and the session record only counts closed sprints, so `log ÷ sessions`
above 1.0 is expected, not an error. That is item 4, and it is measurement, not
repair.

Known ways a sprint can still never reach `typing_sessions`: the five-second
floor (item 6), a unit that never closes, an upload that fails while the daily
log write succeeds. Records that arrive can arrive twice — overlapping windows
with distinct signatures, which the dedupe cannot see.

`typing_logs` stays the graded record and is unaffected.

---

## 2. ✅ THE GUEST PATH IS VERIFIED BY RUNNING — and item 9's oldest bullet is closed

**Jake drove the whole path in the console, 2026-08-20 evening. Every step
works.** This is the first time any of it has been confirmed against a live
browser rather than read.

| Step | Result |
|---|---|
| a chapter completed as a guest | queues: `[["\u0000guest", 1, ["102s 2026-08-20"]]]` |
| navigating away mid-sprint | queues — `pagehide` fires |
| sign-in | `Adopted 1 guest sprint record(s) into fuHvKkVj…` |
| after the flush | `[]` — it reached Firestore |

So the 2:03 PM record from the 20th was **late, not lost**, like the other two —
item 1 again.

⚠️ **ONE THING DID NOT FIRE AND IT IS WORTH KNOWING.** Cmd+Tab to another app did
NOT trigger `visibilitychange`, so `logOpenSprint('hidden')` did not run. macOS
fires that on occlusion, not on focus loss. `pagehide` covers the case that
matters (navigating away), so nothing is lost — but the comment above the
`visibilitychange` handler in `game.js` claims more coverage than it has, and a
future round leaning on it should not.

**Still unverified: the same path in School.** `learn.js`'s half was never driven.

---

## 2b. ✅ THE RESCUE IS WIRED IN BOTH MODES

`game.js` v3.37.0 and `learn.js` v2.22.0 both carry prior-day guest sprints to
their own documents, through the same `daylog.js` v1.4.0 functions.

⚠️ **THE STANDING HOLD ON `learn.js` DID NOT APPLY AND HERE IS WHY**, because a
future round will face the same call. The rule is that a student write-path
change to the file 8th grade depends on ships in a round that can watch School
run. **This code cannot execute before the cutover** — `carryOverPlan()` filters
every pre-cutover date, so the plan is empty and the writer is never called. It
was inert on the school day following the deploy, by construction rather than by
hope. ⚠️ **That reasoning is specific to this change.** Do not generalise it into
"learn.js edits are fine."

---

## 3. ✅ DELETED — "learn.js FLUSHES FOR ANONYMOUS USERS" WAS A PHANTOM

**⚠️ THE PREMISE WAS FALSE AND IT SURVIVED TWO ROUNDS.** The item said
`_flushStatsInner()`'s `if (!currentUser) return;` misses guests *"because a
guest is signed in anonymously, so `currentUser` is not null"* — and concluded a
real `typing_logs/{anonUid}_{date}` document existed under a uid no roster could
attribute.

**`signInAnonymously` appears NOWHERE in this repo.** Not in `game.js`, not in
`learn.js`, not in `index.html`, not anywhere. There is no anonymous auth. A
guest has `currentUser === null`, that guard has always caught them, and **no
orphan document has ever existed.** Firebase does not create an anonymous user
on its own; it requires that call.

⚠️ **EVERY `currentUser.isAnonymous` TEST IN BOTH FILES IS BELT-AND-BRACES
AGAINST A STATE THE APP CANNOT PRODUCE.** They are harmless and they are **not
evidence that the state occurs** — reading them as evidence is exactly how this
item was born. ⚠️ **DO NOT "FIX" THIS BY ADDING ANOTHER ONE.** If anonymous auth
is ever switched on, this whole area needs a real review, not another guard.

⚠️ **THE LESSON IS THE ITEM.** It was written from reading two guards side by
side and inferring the state they described. Round 23 then repeated it, Round 24
scheduled work against it, and one `grep` for `signInAnonymously` ended it.
**Grep for the mechanism before writing down the consequence.**

---

## 4. THE IMPLAUSIBILITY FLAG

A read-only, staff-only marker saying *this looks impossible, go look*, leaving
the judgement with the teacher. Two candidate signals: a day exceeding a
plausible ceiling for a class period, and a day wildly exceeding its own session
evidence. Needs a threshold, which needs item 5.

⚠️ **IT MUST NOT FIRE ON A LATE FLUSH.** Item 1 says a report read soon after a
period is legitimately short of its own sessions. A flag that goes off every
sixth period at 2:55 PM is a flag nobody reads by October.

---

## 5. WHAT A NORMAL DAY LOOKS LIKE

One clean day, one class, after the cutover: `log ÷ sessions` per student. That
distribution sets item 4's threshold from evidence instead of a guess. **The week
beginning 2026-08-24 is the first clean run on the new shape.**

A ratio above 1.0 is expected, not an error: the day counter runs through pauses
inside a sprint, the session record only counts closed sprints. The two measure
different things and always will. ⚠️ Take the measurement the NEXT DAY, not at
the end of the period — see item 1.

---

## 6. ✅ CLOSED (Round 51, Blickensderfer) — THE MIDNIGHT STRADDLE, BOTH HALVES

✅ **SHIPPED learn.js v2.40.0.** School now mirrors game.js v3.38.0: the tick
closes the open run on the OUTGOING day before resetting, `logRun()` and
`logOpenRun()` take a `dateOverride` for that one caller, and the remainder is
logged as a continuation by the ordinary path.

⚠️⚠️ **THE ROLLOVER MOVED ABOVE THE INCREMENTS, AND THAT IS HALF THE FIX.** This
is why it was held for several rounds and it was a real reason, not timidity.
learn.js incremented `stepSeconds` BEFORE its rollover check and compensated by
resetting counters to `1` rather than `0`. That worked for the COUNTERS and could
not work for the LOG: by the time the rollover ran, the second was already inside
a `stepSeconds` that `logOpenRun()` was about to file under the new day. The block
now sits above `learnActiveSeconds++`, above `anonSecondsAccum++` and above
`armAnonLoginPrompt()`, and every `= 1` is back to `= 0`. **One line lower and the
first second of each new day is filed under yesterday, invisibly, forever.**

✅ **PART D OF `midnight-test.mjs` WAS INVERTED, NOT DELETED**, exactly as the
item instructed. It now has nine assertions instead of two: D1–D4 the plumbing,
D5/D6 the ordering, D7–D9 that the compensating `= 1`s are gone — leaving one
behind would double-count the first second of every new day, the mirror image of
the bug just fixed. Mutation-verified both ways.

⚠️ **A HARNESS HAD TO BE REPAIRED TO ACCEPT THE FIX, AND IT WAS THE HARNESS THAT
WAS WRONG.** `open-unit-test.mjs`'s graded-gate check allowed 400 characters
between the gate and the increment — a DISTANCE check wearing a STRUCTURE check's
label. The new comment block pushed the increment past 400 and it failed while
the property it names was still true. It brace-matches the gate now (v1.2.5);
§0.-33.C's rule — guard on structure, never on distance or words — applies to
harnesses as much as to writes. ⚠️ Verified STRICTER, not looser: an increment
moved outside the gate still fails it.

### The original item, kept



**The mechanism is no longer a hypothesis.** `game.js` v3.38.0,
`tests/midnight-test.mjs`.

A sprint running 11:56 PM → 12:00:09 AM was **split correctly by the day
counters** — they tick second by second, so 243 seconds landed on yesterday's
document and 6 on today's. `sprintSeconds` knew nothing about midnight and kept
climbing, so when the sprint ended, `logSession()` filed ONE record of 249
seconds stamped with the day it **ended** on. Today's total: 6s. Today's
drill-down: 4m 9s. That is the observed incident, exactly.

⚠️ **NEITHER NUMBER WAS WRONG — THEY WERE ANSWERING DIFFERENT QUESTIONS**, which
is why two rounds looked at this and could not name a culprit.

⚠️ **THE SECOND CANDIDATE IS INNOCENT AND SHOULD NOT BE INVESTIGATED AGAIN.**
"`session-log.js`'s own dating of a chunk" is not it. That module dates from the
caller and always has; the caller was handing it a sprint that had already
crossed midnight. ⚠️ Round 24's `sessionLogAdopt()` fix (item 2) is a *different*
date defect on a *different* path. Do not conflate them.

**The fix:** the tick closes the open sprint on the outgoing day before resetting,
reusing the machinery that already handles navigating away mid-sprint. The
remainder is logged as a continuation, dated correctly, by the ordinary path.
⚠️ The check moved **above** `sprintSeconds++`, and that ordering is half the
fix — one line lower and the first second of each new day is filed under
yesterday, invisibly, forever. `midnight-test.mjs` B4.

### Still open: the same fix in `learn.js`

**The recipe, in full, so the next round does not re-derive it:**
1. `logRun(wpm, acc, detailSuffix)` → add a `dateOverride` param; the push uses
   `date: dateOverride || getLocalDateStr()`.
2. `logOpenRun(reason)` → add `dateOverride` and pass it through.
3. In the tick, call `logOpenRun('midnight', statsData.lastDate)` at the
   rollover.

⚠️ **STEP 3 IS NOT A ONE-LINER THERE, AND THAT IS WHY IT WAS HELD.** `learn.js`
increments `stepSeconds` **before** its rollover check and compensates by setting
the day counters to `1` rather than `0`. Mirroring `game.js` means moving the
whole block above the increments — past `anonSecondsAccum++` and
`armAnonLoginPrompt()` — and changing those `= 1`s back to `= 0`. In the file 8th
grade depends on.

⚠️ **EXPOSURE, NOT SYMMETRY, DECIDED THIS.** School runs 8am–3pm at Ellis; a
lesson does not straddle midnight. Library at home does, and Library is fixed.
`midnight-test.mjs` Part D asserts the School gap **on purpose** — invert those
two assertions when it is done, do not delete them.

---

## 7. THE 5-SECOND FLOOR

A sprint that *ends* under five seconds is dropped rather than deferred. Small,
downward, unmeasured. **Measure before changing it** — lowering the floor fills
the drill-down with noise records. ⚠️ It is one of the two candidates in item 2.

---

## 7b. ✅ THE RANDOM DRILLS — `ass` LEADS, EVERYTHING ELSE IS NEVER-USE

**Shipped**: `drill-filter.js` v1.3.0, `learn.js` v2.23.0. 57 checks.

⚠️⚠️ **THE RULING CAME IN THREE NARROWING STEPS IN ONE MORNING AND ALL THREE
QUOTES ARE IN THE MODULE HEADER. READ THEM BEFORE CHANGING ANYTHING.** Part B
asserts the FINAL state; restoring behaviour from an earlier quote goes red.

1. whole-group → `asse` fine
2. leading → `asse` blocked, `fass` fine
3. **NEVER-USE for everything but `ass`** → `xfart`/`fartx` blocked, `fass` fine

**`ass` is the only leading entry**, because it is the only one that lives inside
letter runs a drill should be free to produce. ⚠️ **A second leading entry needs a
ruling of the same kind** — "appears inside legitimate letter runs", not "seems
mild". C6 is the speed bump.

⚠️ **THE COST WAS MEASURED BEFORE ADOPTION, AND PART A PRINTS THE TABLE EVERY
RUN**: worst case 0.22% of groups, across the whole ladder from home row to full
alphabet, at both group sizes. A1 caps it at 1%.

⚠️⚠️ **TWO ENTRIES HAVE NOW COST MORE THAN THE DEFECT THEY WERE ADDED FOR, AND
NEITHER WAS VISIBLE BY READING THE LIST.** `kkk` (substring, `k` is a home key)
fired on same-finger repetition drills. `fuk` (my invention, not a word) was
**80% of the filter's entire cost** on the home+index key set, because f/u/k are
all early keys while `fuck` proper needs a late `c`. Both deleted. **The rule is:
a short entry made of early keys is expensive, and you cannot see it by looking.
Run Part A before and after.**

⚠️⚠️⚠️ **THE HOLE WITH TEETH — AND IT IS INSIDE `learn.js`, NOT `game.js`.**
`word_list`, `sentence_list` and `passage` are step types built from **real
English**, in the same switch statement as the two generators this filter guards.
Part G measures what an import there would do: **39 of 42 ordinary words
destroyed** — `title`, `constitution`, `biscuit`, `soldier`, `audience`, `sweet`,
`weekend`, `speech`, `shampoo`, `parse`, `grape`, `raccoon`, `manuscript`,
`hello`, `peanuts`, `shotgun`. **G3 asserts `safeGroup()` is called exactly
twice.** Never point this at prose, in either file.

---

## 8. ✅ STUDENT-FACING POLISH — THE FONT PICKER SHIPPED

`learn.js` v2.23.0, `style.css` v3.6.0. Five faces on the School map, per-student
in `localStorage`, scoped to `#drill-text` only.

⚠️ **NO WEBFONTS, AND THAT IS NOT LAZINESS.** Every face is either already loaded
or a system stack. `appcheck.html` exists because a district can block a CDN; a
picker whose options silently fall back to Times on the school network is worse
than no picker.

⚠️⚠️ **THE FINDING WORTH KEEPING: A PROPORTIONAL FACE BROKE A GUARANTEE `style.css`
DID NOT KNOW IT WAS MAKING.** The comment above `.dt-char` promises state classes
"change color only, never dimensions" — but `.dt-fixed` and `.dt-dirty` set
`font-weight: bold` three lines below it. **That promise held only because the
font was monospace**, where bold has the same advance width. In a proportional
face a character going bold the instant a child backspaces and retypes would
shove the rest of the line sideways under their fingers, mid-drill. `style.css`
v3.6.0 swaps bold for an underline while a proportional face is active. **The old
comment is now accurate rather than lucky.** F8–F10.

⚠️ **THE CONTROL IS ON THE MAP, NOT IN THE DRILL** — a `<select>` inside the drill
view is one Tab away from eating a keystroke the student typed and should have
been credited for. **A student mid-lesson has to return to the map to change it**,
which is acceptable for a once-a-year choice and is the deliberate trade.

⚠️⚠️ **IT SHIPPED INVISIBLE IN v2.23.0 AND JAKE ASKED WHETHER IT EXISTED.** The
code was correct, attached to the right element, and styled at 0.75rem in `#777`
with no affordance. **A CONTROL NOBODY CAN FIND HAS NOT SHIPPED** — and if the
teacher cannot find it, no twelve-year-old will, which is the entire audience.
Fixed in `learn.js` v2.23.1 / `style.css` v3.6.1: an "Aa" glyph rendered in the
chosen face, inside a bordered pill.

⚠️ **THE REAL DEFECT WAS THAT NO RENDER TEST EXISTED.** Every assertion in the
round was about the FILTER; not one asked whether the other half was on the
screen. `drill-filter-test.mjs` **Part H** now renders `learn.html` in jsdom,
builds the control and asserts it exists, is idempotent, carries an affordance,
and clears a **visibility floor** (≥0.8rem, has a border). ⚠️ *"The code runs" and
"a person can find it" are different claims, and only the first one had a test.*

**Still open from this item:** nothing. If more faces are wanted, add to
`DRILL_FONTS` and mark the fourth column `false` for anything proportional, or
F8's guarantee lapses silently.

---

## 8b. ✅ RETIRED TO CONVENTION (Round 53) — A STANDING RULE, NOT A TASK

✅ **JAKE, 2026-08-26:** *"Of course we do that."* Followed every round since 28.
**It lives in § CONVENTIONS at the top of this file now** — nothing about the
practice changed, and the reasoning below is kept because it is the argument for
never drifting off it.

### The original item, kept



**Standing practice from Round 28, on Jake's instruction:** *"Can you please only
zip up the files that need to be uploaded? I would hate for one corrupted,
unedited file to burn the whole thing down. Love that the zip has the folder
structure, but I really only want to update that which has been done."*

⚠️ **THE FULL-ARCHIVE HABIT WAS A REAL RISK AND NOBODY HAD NAMED IT.** Round 28
changed **19 files of 180**. Shipping all 180 re-uploads 161 files nobody touched
— every book in `library/`, `firestore.rules`, `functions/` — each one a chance
to overwrite a good file with a stale one, for **zero benefit**, through a web
portal, by hand, with a class arriving. The risk is entirely one-directional.

**What a round delivers from now on:**

1. A zip containing **only files whose bytes differ** from the archive Jake
   handed over, **at their real paths** so it drops over a checkout.
2. A root **`UPLOAD.md`** with the files in **dependency order**, grouped so an
   interrupted upload stops somewhere safe, plus what to check afterwards and
   ⚠️ **which files are repo-only and never reach a browser.**
   `UPLOAD.md` is per-deploy and is **deleted after the upload** — it is not a
   repository document.
3. ⚠️⚠️ **THE SET APPLIED TO A PRISTINE COPY OF WHAT JAKE ACTUALLY HAS, WITH
   `npm test` RUN THERE.** Not optional, and it is the whole item.

### ⚠️⚠️ WHY ITEM 3 IS THE POINT, AND IT IS NOT PARANOIA

*"Every file I edited passes"* and *"these files are sufficient"* are **different
claims.** The first is about the working tree, which is complete by construction
and can never expose an omission. The second is about the **archive**, and
nothing in the working tree can test it.

**Round 28's first attempt at this shipped without `versions.js`.** The diff was
correct; the shell loop that copied the files dropped its last line, because the
manifest had no trailing newline and `while read` discards an unterminated final
line. `wc -l` reported 18 and `grep -c .` reported 19. The result would have been
`game.js` v3.43.0 importing `countBuildNotes` from `versions.js` v1.11.0, which
does not export it — ⚠️ **an ES module import failure throws before any code runs,
so both student pages go BLANK**, caused by a file Jake never opened. See
HANDOFF §0.-20.K.

**It was caught by applying the set and running the suite there**, and by nothing
else. A review of the file list would have passed it; the list was right.

### Worth building, not built

- ⚠️ **A `tools/make-upload-set.mjs`** that diffs against a reference copy, copies
  in a way that cannot silently drop an entry, **re-hashes every file at the
  destination**, and refuses to emit a set that fails the applied-suite check.
  ⚠️ **JAKE CANNOT RUN IT — HE HAS NO CLI** — so it is a tool for the *instance*,
  not for him, and it should refuse rather than warn.
- **A recorded manifest of what was last delivered**, so the next round can diff
  against what Jake actually has rather than against the zip it happened to be
  handed. Today the reference is the uploaded archive, which works only because
  rounds have been sequential.

---

## 11. ✅ FIXED (Round 33, Crandall) — A STUDENT IN A CLASS BUT NOT A SCHOOL

**`lessons-admin.js` v1.14.0, `learn.js` v2.34.1, `tests/class-assign-test.mjs`.**

⚠️ **TWO INDEPENDENT BUGS PRODUCING ONE COMPLAINT, WHICH IS WHY THIS WAS
CORRECTLY DIAGNOSED TWICE AND FIXED NEITHER TIME.** Bug A: two of three
assignment writers sent `classId` alone, so `schoolId` was ABSENT and the student
sat outside their own building. Bug B: the goals cache treated an entry with
`classId: ''` as a HIT — falsy — so Settings said "No class assigned" for 24 hours
after a correct assignment. **Fix either alone and the symptom survives.**

⚠️⚠️ **THE OBVIOUS REPAIR WOULD HAVE WRITTEN `''` AND LOOKED CORRECT** —
`_classCache` is cold until the Classes panel is opened. `_schoolIdForClass()` is
now the one answerer and falls back to the class document. The CSV lookup is
**per row**: a rollover file can name a different class on every line.

---

### The original item, kept for the diagnosis

## 11a. ✅ CLOSED (Round 53) — JAKE RULED: THE WRITE-TIME STAMP IS CORRECT

✅ **JAKE'S RULING, 2026-08-26:** *"All the people who it impacts are either my
students — and I can get them all anyway — or didn't exist when it was a
problem."*

**`typing_logs` stamping `classId`/`schoolId` AT WRITE TIME IS INTENDED.** The
stamp records where a student was *that day*, which is what you want for a child
who changes class mid-year. Assigning a class does not retroactively rewrite old
reports, and should not.

⚠️ **NO BACKFILL. DO NOT WRITE ONE.** A bulk rewrite of historical
`classId`/`schoolId` would destroy the exact information the stamp exists to
preserve.

### The original decision, kept



✅ **BUG A AND BUG B WERE BOTH FIXED IN ROUND 33** (item 11, HANDOFF §0.-25):
the writer omitted `schoolId` on two of three assignment paths, and the reader
cached "no class" for 24 hours because `classId: ''` is falsy and slipped the
hit-guard. `lessons-admin.js` v1.14.0 and `learn.js` v2.34.1. **Neither is open.**

⚠️ **WHAT IS ACTUALLY LEFT IS A RULING ONLY JAKE CAN MAKE**, and it is the third
bullet below: `typing_logs` stamps `classId`/`schoolId` **at write time**, so
assigning a class does **not** retroactively fix old reports. That may well be
correct — a stamp records where the student was *that day*, which is what you want
for a child who changes class mid-year — but **the UI implies the opposite**, and
today the system does one thing while the screen suggests another.

**The two options, stated once so they are not re-derived:**
* **Stamp at write (today).** History is immutable; a mid-year class change leaves
  last month's minutes under the old class, correctly. Reports of "this student's
  work" before the assignment simply do not carry the new class.
* **Join at read.** Reports always reflect the current roster; a roster change
  silently rewrites what last month's report says. ⚠️ **This is the option that
  can make a printed report and a re-printed report disagree.**

⚠️ **DO NOT BUILD EITHER ON A GUESS.** The recommendation is to keep stamp-at-write
and fix the *implication* — a line in reports saying the class shown is the one
recorded that day. But it is Jake's call and it has never been put to him plainly.

### Kept for the reasoning — the original investigation

**Jake, 2026-08-23, testing with his son's account.** Assigned Nico to the "7th &
8th Grade" class from admin. Admin confirmed the class. **`learn.html` → Settings
still said "No class assigned."** Reports showed him under *All schools* but **not
under Ellis Middle School.**

### ✅ RESOLVED BY JAKE'S CONSOLE READ, 2026-08-23 — IT IS **TWO** BUGS

`users/{nico}` contains:

    activeDayCount: 1
    activeDayLast: "2026-08-23"
    classId: "7th_8th_grade_sta…"      ← SET
                                        ← schoolId ABSENT ENTIRELY

⚠️ **BUG A — `classId` IS WRITTEN AND `schoolId` IS NEVER WRITTEN AT ALL.** Not
empty: absent. Cause (1) below is confirmed. Assigning a class must write both.

⚠️⚠️ **BUG B — AND IT IS A SEPARATE ONE. `classId` IS PRESENT AND SETTINGS STILL
SAYS "No class assigned."** Cause (2) is ALSO real. Whatever `learn.js` reads for
that panel, it is not this field — check whether it reads `profile/info`
(a subcollection document that exists and holds `initials`, `viewMode`,
`leaderboardOptOut`, `viewRemember`) or bails early on the missing `schoolId`.
**Fixing the writer will not fix the display.**

⚠️⚠️ **AND A THIRD THING THE LOG RECORD REVEALS — READ THIS BEFORE DESIGNING THE
FIX.** `typing_logs/{uid}_2026-08-17` carries `classId: ""` and `schoolId: ""` as
**stamped fields on the log itself.** Reports filter on the LOG's stamp, not on
the student's current class. That is why Nico appears under *All schools* and is
absent from *Ellis Middle School*.

**So assigning him to a class does NOT retroactively fix his old reports**, and
that may be correct: a stamp-at-write-time records where the student was *that
day*, which is what you want for a child who changes class mid-year. **The
alternative — join to the user's current class at read time — rewrites history
every time a roster changes.** ⚠️ **PICK ONE DELIBERATELY AND WRITE DOWN WHY**;
today the system does the first while the UI implies the second.

⚠️ **THREE CANDIDATE CAUSES — (1) AND (2) ARE NOW BOTH CONFIRMED. KEPT FOR THE
REASONING.**
1. Assigning a class writes `classId` but never writes `schoolId`, so the student
   is in a class that belongs to a school he is not in. Reports filter by school
   and lose him; the "all schools" view finds him.
2. The class IS assigned and **learn.js reads it from somewhere else** — a stale
   `users/{uid}` field vs a roster document, or a read that happens before the
   assignment lands.
3. The Settings panel never read class at all and has always said this.

**The reports screenshot is the strongest evidence for (1):** Nico appears under
*All schools* with 2m 53s and is absent from *Ellis Middle School* entirely, while
Jake's two accounts appear in both. ⚠️ **But (2) and (3) have not been ruled out
and the fix differs for each.** Start by reading Nico's `users/{uid}` document in
the console and writing down what `classId` and `schoolId` actually contain.

**Whatever the cause: assigning a class must assign its school, atomically.**
Jake: *"the classes should be locked into the schools. Either which way, I need a
way to be able to assign students to schools AND classes."* A class belongs to
exactly one school; a student in a class is in that school by definition, and
letting the two be set independently is what created a record that is true from
one query and invisible from another.

⚠️ **THE SUPER-ADMIN CASE IS THE ONE THAT MADE THIS.** Jake can see every school,
so the class picker offered him a class from a school the student was not in.
Either scope the picker to the selected school, or show `School — Class` pairs and
write both.

---

## 12. ✅ CLOSED (Round 47, Blickensderfer) — THE LEAD AXIS, AND TWO STALE BULLETS

✅ **FIXED IN style.css v3.10.0.** School's lesson HUD leaves `#hud-sprint`
empty by design, and `.hud-stack` was `justify-content: center` with auto
height — so the one remaining row centred on the BAR's midline (~30px) while
every two-row stack put its LEAD row at ~23px. WPM/accuracy, the headline
number on that page, sat **seven pixels low** against "Daily …" to its left and
the student's name to its right. Jake, with a screenshot: *"very obviously off
in comparison to every other HUD (including the lesson menu HUD)."*

⚠️⚠️ **THE OLD COMMENT ASSERTED THE BUG AS A FEATURE.** style.css v3.9.0 said a
stack with an empty lead row "centres its remaining row on its own without any
conditional CSS." It does centre it — on the wrong axis. **A comment that
explains why no code is needed is the hardest kind of wrong to notice**, and
this one survived several rounds because nothing in the suite could see it.

✅ **THE FIX RESERVES THE ROW, IT DOES NOT NUDGE A MARGIN.** `.hud-stack` gets a
two-row `min-height` floor and pins to the top; an empty `.hud-lead` is removed
and the row beneath takes its box, so the promoted row centres on the same axis
`#hud-time` and `#user-name` use. Row heights are `--hud-row-lead` /
`--hud-row-sub`, defined once, because the floor and the promoted row must agree
EXACTLY — two literals would drift and land the row *near* the axis, which is
the same defect one pixel quieter.

⚠️ **min-height, NOT height** — the opposite of `#hud`'s own rule directly above
it, and deliberately so. Library's centre during a sprint is genuinely taller
than two nominal rows (the live row does not shrink to 11px), and a fixed height
would clip it against `overflow: hidden`. The floor aligns short stacks; tall
ones may still grow.

⚠️ **`+`, NOT `:has()`** — this has to work on whatever Safari is on a school
Mac. Guarded by `tests/hud-lead-test.mjs` Section E (9 assertions,
mutation-verified: reverting `justify-content` fails E2/E3, swapping the
variable for a literal fails E5/E7).

### ✅ THE OTHER TWO BULLETS WERE STALE — Jake confirmed, 2026-08-26

Both were checked against the source before any work was done, and both had
already been fixed by later rounds:

* **"Student ID is CUT OFF in Library"** — and the bullet had it BACKWARDS.
  Both panels print the same **eight** characters on purpose (`game.js` v3.42.3,
  `learn.js` v2.29.0), matching what `reports.html` prints beside each student:
  eight can be read aloud across a classroom without error, twenty-eight cannot.
  The full uid is still in the title and on the clipboard. **Not a defect.**
* **"Settings does not show the class in Library"** — was folded into item 11,
  which closed in Round 33. Jake confirmed it is no longer live.

⚠️ **THAT IS THREE STALE FLAGS IN THIS FILE NOW** (13, 11a, and two-thirds of
12), plus 14a still suspected. **Verify before building** — §0.-35 is the round
that lost time to exactly this.

---

## 13. ✅ CLOSED (Round 41) — THE GATE DID NOT FIRE, AND THE SPEC WAS WRONG

⚠️ **THE LOOSE THREAD IS ANSWERED AND THIS ITEM IS DONE.** It stayed ⭐⭐ for eight
rounds on one unresolved line: Jake typed lesson 1 *"a dozen times"* and the
record read `attempts: 3`, `runAttempts {0:1, 1:2}` — four runs, not a dozen —
with the note *"if runs are being under-recorded it undercounts every mastery
score built on top of it. Check before building item 14 on this field."*

✅ **THAT WAS ROADMAP 14b, AND IT WAS FIXED IN ROUND 31.** `stopLesson()` reloaded
progress before the scheduled flush read it, so "← Map" banked the time and threw
away the run — and `{0:1, 1:2}` out of a dozen is precisely the fingerprint
HANDOFF §0.-23.C predicts: only runs whose interval flush fired inside the WAL
window survived, which is why the loss looked random. **Runs were not being
under-recorded by the counter; they were being overwritten after the fact.**
Nothing is owed here and item 14's field is sound.

⚠️ **THE ITEM WAS ALREADY RESOLVED BELOW AND THE HEADING NEVER CAUGHT UP** — the
same defect that cost Round 35 a whole round on item 17's stale premise. **When a
console read settles an item, change the heading in the same edit.**

### Kept for the reasoning — the original diagnosis

**Jake, testing:** typed lesson 1 a dozen times, *"definitely got 3 fireballs in
that practice window"*, later got **three in a row**, and was never gated.
Confirmed running `learn.js v2.32.0` and `lesson-gate.js v1.0.0`.

⚠️⚠️ **THE STRONGEST EVIDENCE IS IN HIS OWN SCREENSHOT AND IT IS EASY TO MISS:
THE LESSON 1 CARD SHOWS A GREEN `A`, NOT `A🔥`.** `grade` on a lessonProgress
record is best-ever-seen and monotonic — it cannot go down. So if the lesson had
ever been graded A🔥, the card would say so. **It says A.**

### ✅✅ CONFIRMED BY JAKE'S CONSOLE READ, 2026-08-23

`users/{nico}/lessonProgress/u1_l1`:

    fireCount: 0          grade: "A"        lastGrade: "A"
    attempts: 3           stars: 3          runCount: 2
    runAttempts: {0:1, 1:2}                 furthestRunIdx: 1
    finalWPM: 51          finalAccuracy: 97

⚠️⚠️ **`fireCount: 0` AND `grade: "A"`. THE GATE WAS NEVER BROKEN.** It counted a
LESSON grade that never reached A🔥, incremented correctly zero times, and gated
nothing — exactly as written. **The spec was wrong, not the code.** Do not "fix"
`lesson-gate.js`; change what is scored (item 14).

⚠️ **ONE LOOSE THREAD WORTH A GLANCE:** Jake typed this lesson *"a dozen times"*
and the record shows `attempts: 3` with `runAttempts {0:1, 1:2}` — **four runs
total, not a dozen.** Either most attempts were abandoned before the write, or
runs are being under-recorded. If the latter, it undercounts every mastery score
built on top of it. **Check before building item 14 on this field.**

**Original hypothesis, now confirmed:** what a student experiences as "a fireball" is
awarded per RUN or per STEP, and what `fireCount` counts is the LESSON grade
computed across the whole lesson. Jake typed *"just that first one"* — one drill
— and saw fire on it, while the lesson-level grade stayed A. If so, `fireCount`
was correctly incremented **zero times** and the gate behaved exactly as written.

⚠️ **THAT WOULD MEAN THE GATE IS NOT BROKEN AND THE SPEC IS.** `lesson-gate.js`
counts a quantity that does not correspond to the thing the student is being
rewarded for on screen. Do not start by editing the gate.

**First step is a read, not an edit:** open Nico's
`users/{uid}/lessonProgress/{lesson-1}` in the console and record `grade`,
`fireCount`, `runAttempts`. Three outcomes, three different bugs:
* `fireCount` absent → `saveProgress` is not writing it. A wiring bug.
* `fireCount` 0–2 with `grade: 'A'` → the hypothesis above. **A spec bug**; fix
  by counting the thing the student sees (see item 14).
* `fireCount >= 3` → the gate is reading state wrong. Check `furthestIndexOf`
  and `isStaffUser` before anything else.

⚠️ **RULE OUT THE STAFF GATE FIRST AND CHEAPLY.** `lessonModeFor` returns
`'graded'` unconditionally for staff. Nico's account is not on `ADMIN_EMAILS`, so
this should not apply — but it is one line to confirm and would explain the
symptom completely.

---

## 14. ✅ BUILT (Round 32, Lambert) — MASTERY IS CUMULATIVE POINTS PER **RUN**

**Shipped in `lesson-gate.js` v1.1.0 and `learn.js` v2.34.0.** A🔥 = 2, A = 1,
B and below = 0, locked at 4. Locked by run, unlocked by lesson, clock from the
last lock. Downward closure computed, not stored. `lastLockDay` replaces
`lastAdvanceDay`; `stampAdvanceIfNew()` deleted. 48 harnesses pass.

⚠️⚠️ **THE ONE CHANGE TO A NUMBER YOU SET, AND IT WAS CAUGHT BY A HARNESS.**
Closing the farming hole by changing `index >= furthest - reachBack` to `>` also
moves §10.D's worked example by one lesson — at seven stalled days you specified
lessons 26 AND 27 open, and `>` opens only 27. The shipped fix is a guard instead:
`if (reachBack === 0) return 'practice'`, with the comparison left as v1.0.0 had
it above zero. **Every distance you specified is intact.**

⚠️ **"THE FURTHEST LESSON IS ALWAYS GRADED" IS DELETED.** That exception is why a
mastered lesson stayed farmable until the student passed a LATER one — which a
farming student never does. An unmastered RUN in the same lesson still counts, so
nobody is stranded.

✅ **ROUND 34 (Molle) CLOSED THE ENTRY GAP AND THE COVERAGE GAP.** Jake, using it:
*"if the first one is locked, students have no way to get to the second run
legitimately."* Runs are typed in order, so a mastered run 1 had to be replayed
for nothing to reach run 2. `firstOpenRunIdx()` opens a lesson at the first run
that still counts — well-defined because downward closure makes the open runs a
suffix. `tests/run-mastery-test.mjs` is written and covers the banner, the score
and both intro entry points. **50 harnesses.**

~~⚠️ NOT VERIFIED: `runScorePill()` and `armRunMode()` have no coverage~~ — the
banner and the score are the only two things a student sees and neither has been
executed. `learn.js`'s header cites `tests/run-mastery-test.mjs`, **which does not
exist.** Write it or strike the line.

---

### The original item, kept for the reasoning behind each ruling

## 14a. ✅ CLOSED BY VERIFICATION (Round 50, Blickensderfer) — ALREADY SHIPPED

⚠️⚠️ **STALE FLAG. NOTHING WAS BUILT AND NOTHING NEEDED TO BE.** Item 14 shipped
this in learn.js v2.34.0, and the code matches Jake's ruling *verbatim*:

| Jake's ruling, 2026-08-23 | `lesson-gate.js` as shipped |
|---|---|
| A🔥 = 2 | `RUN_POINTS['A🔥'] = 2` |
| A = 1 | `RUN_POINTS['A'] = 1` |
| B and below = 0 | absent from `RUN_POINTS`; `pointsForGrade()` returns 0 |
| mastered at 4 | `MASTERY_POINTS = 4` |
| scored per **run** | `runScores[runIdx]` in `recordRunOutcome()` |

The downward-closure clause Jake asked for (*"run 3 of a lesson locks runs 1 and
2, too"*) is implemented and computed rather than stored. The renumbering the
item worried about was correctly judged unnecessary at the time — the per-run
granularity already existed in the data model — and it is still unnecessary.

⚠️ **THIS IS THE FOURTH STALE FLAG IN THIS FILE** (13, 11a, two-thirds of 12, and
now 14a — which carried ⭐⭐, the highest priority marker here). A ⭐⭐ once cost
Round 35 an entire round. **The check is cheap and the build is not: read the
code before you believe the flag.**

### The original item, kept

*(Original heading: ⭐⭐ MASTERY IS CUMULATIVE POINTS, PER **RUN**, NOT THREE FIREBALLS PER LESSON — demoted from `##` so it is not read as a second open item; roadmap-index-test.mjs counts headings.)*

### ✅ JAKE'S RULING, 2026-08-23 — TAKE THIS AS DECIDED

> *"A fireball counts as 2, an A counts for 1, and we kill access at a score of 4."*

    A🔥 = 2   ·   A = 1   ·   B and below = 0   ·   MASTERED at 4

⚠️ **B SCORING ZERO IS WHAT PRESERVES THE WHOLE FEATURE'S GUARANTEE.** A student
who only ever passes with a B never accumulates and is therefore **never gated,
forever** — which is `lesson-gate.js`'s section-A promise, unchanged. Do not give
B a value "for fairness"; it would invert the feature onto the struggling student.

Reaching 4 takes: two fireballs, or one fireball and two A's, or four A's. It is
strictly harder than the shipped 3-fireball rule for a strong student and much
easier to reach honestly, which is the point.

### ✅ AND IT IS SCORED PER **RUN**, NOT PER LESSON

> *"Kids are doing the thing that I did, and that needs to stop. If that means we
> have to change it to 1.1 and 1.2 and so on, then that's what we need to do."*

⚠️⚠️ **THE RENUMBERING IS PROBABLY NOT NEEDED, AND THIS IS THE MOST USEFUL THING
ON THIS PAGE.** `recordRunOutcome(runIdx, grade, advanced)` **already writes
per-run data on every run**: `runAttempts`, `runFailures`, `furthestRunIdx`,
`lastRunIdx`, `lastGrade` — all keyed by run index, all on the lessonProgress
record. The granularity Jake is asking for **already exists in the data model.**

So the change is a `runScores` map beside `runAttempts` — `{ "0": 4, "1": 2 }` —
incremented in `recordRunOutcome` where the grade is already in hand. **No lesson
renumbering, no new collection, no migration.** ⚠️ Verify this against
`recordRunOutcome` before committing to it; the claim is from a read, not a build.

⚠️ **`runCount` IS ALREADY STORED FOR EXACTLY THIS HAZARD** and its comment says
why: *"editing a lesson changes how it chunks, which shifts every index in
runAttempts/runFailures."* `runScores` inherits that fragility. **Editing a lesson
must invalidate its run scores**, or a teacher's content edit silently locks or
unlocks runs at random.

### ✅ REACH-BACK IS IN RUNS TOO — JAKE'S RULING, 2026-08-23

> *"Adjust the reach back to runs with the same rules. I would go ahead and say
> that run 3 of a lesson locks runs 1 and 2, too, as it's the same skills. If we
> score in runs but reach back in lessons, then a kid can do run 1 forever without
> ever stopping if they never redo the second run."*

⚠️ **HIS OBJECTION KILLS MY EARLIER RECOMMENDATION AND HE IS RIGHT.** I proposed
scoring in runs and reaching back in lessons. That leaves the exploit intact: a
student who never advances past run 1 has a furthest LESSON that never moves, so
nothing behind them ever locks, and run 1 stays graded forever. **The unit that
locks and the unit that measures distance have to be the same one.**

**The model, then — everything in runs:**

* Flatten the curriculum into one ordered sequence of runs. A run's position in
  that sequence is its index.
* A run is **mastered** at 4 points (`A🔥`=2, `A`=1, `B`=0), cumulative.
* ⚠️ **DOWNWARD CLOSURE — mastering run *k* of a lesson also closes runs 1..*k-1*
  of that lesson.** Jake: *"it's the same skills."* This is what stops a student
  retreating one run to keep farming.
* `reachBack = floor(activeDaysSinceLastAdvance / 7)`, **counted in runs.**
* A mastered run is graded iff `runIndex >= furthestRun - reachBack`.

### ⚠️⚠️ THE CONSEQUENCE JAKE SHOULD SEE BEFORE THIS SHIPS — RECOMPUTE THE NUMBER

**Reach-back in runs is a much tighter window than reach-back in lessons**, and
the headline figure everyone agreed to was computed in lessons.

`u1_l1` has `runCount: 2`. If lessons average 2–5 runs, 47 lessons is roughly
**150 runs**, so:

* "Lesson 1 needs 26 weeks" becomes **lesson 1 needs ~150 weeks.** It cannot open,
  ever, which is what Jake asked for by name.
* ⚠️ **BUT THE STRUGGLING STUDENT NOW GETS LESS REVIEW, NOT MORE.** A week of
  stalling used to reopen a whole previous lesson. It now reopens **one run** —
  a fraction of the same material. **Review reaching the student who has actually
  forgotten something was the entire justification for the receding window over a
  flat cooldown**, and this change quietly weakens it.

**Two ways out, and Jake should pick:**
1. **Accept it.** Anti-farming is the live problem; review is theoretical.
2. ⚠️ **Reach back in runs but faster** — e.g. `floor(days / 7) * 3` runs, or one
   run per two active days. Same rule shape, same anti-exploit property, review
   restored to roughly its old pace. **This is the cheaper fix and it is one
   constant.**

### ✅✅ JAKE'S RESOLUTION, 2026-08-23 — TAKE THIS OVER BOTH OF MINE

> *"Maybe it's locked by run as discussed, but unlocked by lesson based on the
> date of the last lock? That seems like a happy in-between."*

**Locked by run. Unlocked by lesson. The clock runs from the last lock.**

⚠️ **THIS IS BETTER THAN EITHER OPTION ABOVE AND IT IS WORTH SEEING WHY.** My two
were both a single knob — pick a unit, or pick a multiplier — and each traded the
anti-farm property against the review property. His splits the two *directions*
instead, and each direction gets the unit that suits it:

* **Locking per run** is what kills farming, because it is fine-grained enough to
  stop a student grinding one run. Nothing coarser can.
* **Unlocking per lesson** is what makes review real, because a whole lesson's
  worth of material comes back at once. Nothing finer is worth having.
* ⚠️ **"From the date of the last lock" fixes the thing neither of mine did.** My
  window ran from the last *advance*, so a student grinding one run — never
  advancing — accrued reach-back the whole time. **Running it from the last LOCK
  means the clock only starts once the student has actually mastered something**,
  which is the correct trigger: it measures time since you last proved you knew
  something, not time since you last moved.

**Open detail for whoever builds it:** "the last lock" should almost certainly be
the most recent `lockedAt` across all runs, stored on the user record the way
`lastAdvanceDay` is now. ⚠️ Note this **replaces** `lastAdvanceDay` rather than
joining it — do not keep both, or they will disagree (Rule 9).

~~Recommendation: (2), with the multiplier tuned once real run counts are known.~~
Superseded by Jake's resolution above; kept so it is not re-proposed.
⚠️ The multiplier is a guess until somebody counts the runs per lesson across the
curriculum — which is a lessons-admin query, not an opinion.

### ⚠️ THE SUPERSEDED QUESTION — REACH-BACK'S UNIT

`lesson-gate.js` measures reach-back in **lessons** (`index >= furthest -
reachBack`). If mastery becomes per-run, does the window recede one **run** per
week or one **lesson** per week?

⚠️ **THIS SILENTLY CHANGES THE NUMBER JAKE ASKED FOR BY NAME.** "Lesson 1 needs 26
weeks" was computed in lessons. If runs are ~5 per lesson and the window recedes
one run per week, lesson 1 needs **130 weeks** — safer, but no longer the number
anyone agreed to. **Decide the unit explicitly and recompute the headline number.**

~~Recommendation: keep reach-back in lessons, score mastery in runs.~~
⚠️ **WITHDRAWN — Jake identified the hole in it (above): a student who never
advances past run 1 has a furthest LESSON that never moves, so nothing ever
locks.** Kept only so the next round does not re-propose it.

### ⚠️ AND THE STUDENT MUST BE ABLE TO SEE THE SCORE

Jake believed the shipped rule required three fireballs **in a row**. It never
did — `fireCount` was already cumulative. That he could not tell after a dozen
attempts is the finding: **the rule is unfalsifiable from outside**, so nobody can
report it as broken. Whatever the threshold is, **show progress toward it** — the
card already has room beside "3 runs · 90%".



**Jake:** *"Three fireballs in a row is HARD. If one mistake takes away a
fireball, then I think a fireball and 2 regular A's should also count. And they
shouldn't have to be in a row — they should be cumulative as discussed."*

⚠️ **THIS DISSOLVES ITEM 13'S MISMATCH IF THE HYPOTHESIS HOLDS.** Scoring the RUN
counts the thing the student is actually shown fire for, so the gate stops
measuring a quantity the screen never displays.

---

## 14b. ✅ FIXED (Round 31, Fitch) — RUN OUTCOMES WERE LOST ON "BACK TO MAP"

**Jake, 2026-08-23:** *"I finished every single run. I finished the run, got a
grade, and then clicked back to map. Could the back to map not count as
finishing? It counted the time and everything."*

### ✅ CONFIRMED, AND HE WAS EXACTLY RIGHT ABOUT THE SYMPTOM

### ⚠️⚠️ BUT THE MECHANISM BELOW WAS WRONG, AND THE CORRECTION IS THE USEFUL PART

**Shipped in `learn.js` v2.33.1.** `exitLessonToMap()` flushes, refreshes the
progress cache, then reloads — and carries anything unflushed across.
`tests/exit-flush-test.mjs`, 31 checks, 18 failing against v2.33.0.

⚠️ **THE DIAGNOSIS IN THE STRUCK-THROUGH TEXT BELOW WAS WRONG IN A WAY THAT
WOULD HAVE PRODUCED A FIX THAT CHANGED NOTHING.** `flushLessonProgress()` does
not have one caller in the session-end path: the call sits inside
`flushStats()`, which also runs on the five-minute interval and on every hide.
**A write WAS scheduled and DID fire.** What lost the run is the next line in
`stopLesson()` — `loadUserProgress()`, which opens by *emptying* `userProgress`.
The in-memory outcomes died before the scheduled flush read them, and because
`pendingProgress` still named the lesson, the flush then wrote the freshly
RELOADED record back. ⚠️ **THE WRITE SUCCEEDED EVERY TIME.** It returned true,
cost a billed write and stored the numbers it had just read.

⚠️ **SO "ADD A FLUSH TO `stopLesson()`" — THE OBVIOUS READING OF THE OLD ITEM —
IS A FIX ONLY IF IT LANDS *BEFORE* THE RELOAD.** Written after it, as anyone
appending a line to the end of a function would, it writes the same stale record
and every test that only asks "is the flush called?" goes green.
`exit-flush-test.mjs` Part D asserts the ORDER for that reason.

⚠️ **AND IT EXPLAINS THE PARTIAL SURVIVAL.** `saveStats()` fires
`learnWalSave()` before the wipe, so the WAL holds the good record briefly; the
next `saveStats()` after the reload overwrites it with the stale one. Only runs
whose interval flush beat the wipe landed — which is why the loss had no pattern
Jake could report, and why the record read four of twelve rather than zero.

✅ **"NEXT LESSON →" WAS NEVER AFFECTED.** It calls `startLesson()`, which does
not reload progress. Only "← Map" lost work — Jake named the losing path exactly.

~~`recordRunOutcome()` does not write to Firestore. It updates `userProgress` in
memory, adds the lesson to `pendingProgress`, and calls `learnWalSave()`. The
Firestore write happens in **`flushLessonProgress()`** — and that function has
**exactly one caller**, at learn.js:4778, in the session-end path.~~

~~⚠️ **`stopLesson()` DOES NOT CALL IT.**~~ It calls `saveStats()` and
`persistGuestAccum()` and returns. So leaving a lesson for the map banks the
**time** and drops the **run outcome**.

That is why `u1_l1` reads `runAttempts {0:1, 1:2}` after a dozen completed runs:
only the runs that happened to be in memory when a session actually ended
survived.

### ⚠️⚠️ THE IRONY IS THE LESSON, AND IT IS WORTH READING TWICE

`stopLesson()` carries a v2.5.0 comment headed **"BANK THE TIME ON THE WAY OUT"**,
written to fix this exact class of defect:

> *"saveStats() used to be reached only from finishStep(), i.e. only when a run
> COMPLETED... walking away is the normal way a partial lesson ends, and the
> minutes still have to count."*

**Somebody stood on this line, correctly diagnosed "leaving does not persist",
fixed the time half, and left the run half sitting beside it.** ⚠️ **When you find
a write that is missing from an exit path, check every OTHER write on that path
before you leave.** A partial fix here is worse than none, because the comment now
reads as though the path was audited.

### ⚠️ AND IT IS THE DIVERGENCE ITEM 4 EXISTS TO DETECT

Time is written; the run that produced the time is not. `typing_logs` and
`lessonProgress` disagree by construction, on the most common exit path in the
app. ⚠️ **ROADMAP item 4's implausibility flag would fire on this**, and it would
be right.

### THE FIX, AND WHY IT COMES BEFORE ITEM 14

`stopLesson()` should `await flushLessonProgress()` alongside `saveStats()`.
⚠️ **Check the guest path and the WAL recovery path** (learn.js:4593 re-populates
`pendingProgress` from the WAL) so a flush on the way out does not fight recovery
on the way back in.

⚠️⚠️ **ITEM 14 IS BUILT ENTIRELY ON PER-RUN DATA AND THAT DATA IS CURRENTLY
UNDERCOUNTED BY ROUGHLY 3x.** Mastery scored on a field that silently drops most
of its input would gate nobody and nobody would know why — **the same failure the
gate just had, one layer down.** Fix this first, then build item 14 on it.

---

## 15. ✅ BUILT (Round 41, Rem-Sho) — STORE THE GRADE, AND RECONSTRUCT THE ONES 14b LOST

**Jake:** *"Would it be possible without costing significantly more to record
grades for class alongside the other stats? ... It also feels like something we
could figure retroactively, as we know the lesson, the speed, and the accuracy
from the record, so we could do a one time compute."*

✅ **YES, AND HIS RETROACTIVE INSIGHT IS CORRECT.** Grade is a pure function of
`(lesson thresholds, wpm, accuracy)`, all three of which are already on the
record. So this is a **derived** field, not a new measurement — Rule 9 is
satisfied: it is a cache of a computation, not a second source of truth.

⚠️ **WHICH MEANS IT MUST BE COMPUTED, NOT TRUSTED.** Store it for display and
counting; recompute it if the lesson's thresholds ever change. A stored grade that
outlives its threshold is exactly the class of defect §0.-14 is about.

⚠️ **THE BACKFILL IS A WRITE-HEAVY, READ-HEAVY ONE-OFF AND MUST NOT RUN ON REPORT
GENERATION.** Jake's own instinct — *"a one time write of all of them back"* —
is right, but it should be an explicit admin button with a confirmation and a
progress count, not a side effect of opening reports. Writes are cheap here (item
17), reads are not.

Reports would then show a fireball count per student, which is what Jake wanted
when he noticed the report *"didn't share the grades (where I could have counted
the number of flaming A's)."*

### ⚠️⚠️ IT CANNOT RUN OFF `typing_logs`, AND THAT CHANGES THE BUILD

**Verified in the code, Round 31.** `typing_logs/{uid}_{date}` holds `uid`,
`email`, `displayName`, `seconds`, `chars`, `mistakes`, `source`, `classId`,
`schoolId`, `date`, `lastUpdated` — **a DAY AGGREGATE. No lesson, no run, no
per-run WPM.** A grade cannot be derived from it at all; averaging a day of
typing into one WPM and grading that would produce a number no run ever earned.

✅ **`typing_sessions` HAS EVERYTHING.** `learn.js logRun()` pushes, and
`session-log.js` flushes verbatim into `sprints[]`, one record per run:

    label ("u1_l1")   detail ("run 2")   wpm   accuracy   chars   mistakes   seconds   date

✅ **AND `calculateGrade(wpm, acc, minWPM, minAcc, clean)` NEEDS NOTHING ELSE** —
`clean` is `mistakes === 0`, which is on the record.

### ⭐ JAKE'S BUTTON, 2026-08-23 — AND IT IS THE SAME BUILD AS THIS ITEM

> *"I wonder if we can clean up the 'didn't save score on run' issue via a button
> that looks at the lesson in the report and figures out the score based on
> lesson, speed, and accuracy."*

✅ **YES.** `typing_sessions` is a SECOND, INDEPENDENT WITNESS to the runs
`lessonProgress` dropped — Nico's morning shows ten sprints against a record
holding four. Item 14b stops the bleeding forward; this recovers what is already
gone, and the two together are what make item 14 gradeable on real history.
✅ **The "no bulk repair" ruling does not block it** — amended to minutes on
Jake's instruction; see *Settled*.

⚠️ **THREE THINGS THE BUILDER MUST NOT SKIP.**
1. ⚠️ **MERGE CONTINUATIONS BEFORE GRADING.** An interrupted run writes several
   sprints and `logRun()` RECOMPUTES wpm/accuracy for each FRAGMENT (the
   `continuation: true` branch). Grading fragments individually would invent
   grades — the `(left page)` and `(hidden)` rows at 0 WPM in Jake's own
   screenshot are what that looks like. Group by `(date, label, detail)` and
   grade the union.
2. ⚠️ **THE GATES ARE NOT ON THE RECORD.** Whether run *N* is speed-graded comes
   from `gatesForRun()` — the lesson's gates and the run's TYPE, out of the
   lesson definition. So it is `lesson × run index → gates → grade`, and it
   inherits the hazard `runCount`'s own comment names: **editing a lesson
   re-chunks it and shifts every run index.** A reconstruction that reads
   today's definition against a two-week-old sprint can grade the wrong
   material. Refuse the lesson when `runCount` disagrees rather than guessing.
3. ⚠️ **`typing_sessions` HAS A 120-DAY TTL.** This repairs the current
   trimester, not the archive, and it is not a mechanism anyone should plan to
   re-run annually.


### ✅ BUILT, ROUND 41 — WHAT SHIPPED AND WHAT IT REFUSES TO DO

**Forward half.** `recordRunOutcome()` writes `runGrades[k]` (best grade per run)
and `runFires[k]` (A🔥 count per run). ⚠️ `runScores` **could not** answer Jake's
question: it is a SUM, so 2 points is one A🔥 or two A's. No new reads, no new
writes — both ride the merge already queued.

**Backward half.** The `⚑` button beside `⟳` on every daily-log row.
**Preview → confirm → write**, nothing written before the confirm. It:

* fills only runs with **no stored grade** — never overwrites what a student earned;
* **never touches `passed`, `fireCount`, `runScores`, `runLocks` or `grade`**, so
  nothing it writes can advance or unlock a lesson;
* tags every entry `runGradesFrom[k] = 'sessions'` and stamps `regradedAt`;
* **refuses** on `runCount` drift (constraint 2) and merges continuations before
  grading (constraint 1).

⚠️ **THE RULES HAD TO CHANGE FOR IT TO WORK AT ALL** — staff could read a
student's `lessonProgress` and never write it. `firestore.rules` v2.7.0, scoped to
`lessonProgress` only, shipped in the same round (Rule 9) and verified against the
emulator. **It is a console paste; the button does nothing until it is deployed.**

---

## 24. ✅ CLOSED (Round 46, Rem-Sho) — THE WRITER: A RESENT CHUNK NO LONGER DUPLICATES

**MEASURED 2026-08-25: 12 of 51 student-days, 8 of 10 students, every day from
the 18th to the 25th.** The reader's fix (Round 44) made `⟳` safe; the writer
kept producing new duplicates until this round.

✅ **THE FIX IS IDEMPOTENCE.** `session-log.js` v1.7.0's `_sessionLogFlushInner`
now derives the document id from the chunk (`uid` + the first sprint's `at` +
`source` + `label`, see `_sessionDocId()`) and writes with `setDoc()` instead
of `addDoc()`. A resend of an unflushed chunk — whether the page was killed
between the server write and the local removal, or `_write()` failed silently
(the "second, rarer path," `_write()`'s discarded return value) — derives the
SAME id and lands on the SAME document, overwriting it. A superset replacing a
subset is the correct result: no duplicate, no loss.

✅ **SHIPPED AS ONE UNIT, PER RULE 9.** `firestore.rules` v2.8.0 gives the
`typing_sessions` owner `update` rights under the same validation `create`
already applies (not a bare `isOwner()` — the seconds/sprints/expiresAt clamps
still hold, because a resend is really "create, again"). `delete` stays
`isSuper()`-only. Without this the app-side fix would look shipped and be
silently denied on every real resend.

✅ **VERIFIED AGAINST THE REAL EMULATOR, NOT JUST REASONED ABOUT.**
`tests/session-writer-test.mjs` is mutation-verified (13 failing against
v1.6.0, 23/23 passing against v1.7.0) but cannot see a rules denial — that
needed `npm run test:rules`, which was actually run this round (Java was
present). It caught a real bug in the new rules test's OWN seeding step (a
super_admin cannot create a `typing_sessions` doc on another uid's behalf —
the create rule has no `isSuper()` branch), fixed by seeding as the student
instead. **65 cases pass, 4 of them new.**

⚠️ **EXISTING DUPLICATES STILL STAND.** They predate this fix, the reader
already dedupes them (Round 44), and a cleanup pass is a bulk write over
student history — a separate decision, once the writer had stopped adding to
them, which as of this round it has.

### The original item, kept

Found while diagnosing the ⚑ mis-grade (HANDOFF §0.-31.N). Jake's 2026-08-24
drill-down showed **two rollups at 8:47** — one of 5 sprints and one of 7 that
**contains the same five** — and the same shape again at 9:12. The rollups
summed to **~30m 30s** against a stored day of **21m 40s**.

⚠️ **`sessionSignature()` CANNOT SEE THIS AND IS NOT WRONG.** It keys on the whole
sprint timestamp LIST, so a superset genuinely is a different document. The
duplication is per **sprint**, and only a per-sprint dedupe finds it —
`run-grade.js` v1.1.0 does exactly that for grading, and `recalcDailyLog()`
sums whole rollups through `splitSessionTotals()`, which Round 44 gave a
per-sprint dedupe of its own.

⚠️⚠️ **THE DROP GUARD ONLY GUARDED DOWNWARDS**, until Round 44 made it
symmetric — an unexplained *rise* now asks the same question a fall does.

⚠️ **THE CAUSE WAS UPSTREAM, AND THIS ROUND IS THAT FIX.** Two rollups covering
the same sprints meant a flush wrote a document and did not clear what it
wrote — session-log.js v1.3.0 serialised the CONCURRENT case (§0.-13's
duplicate-session race); this was the SEQUENTIAL one, a killed page or a
failed local write between an otherwise-successful write and its own cleanup.

---

## 22. ✅ MEASURED AND CLOSED (Round 44) — runCount DRIFT IS ESSENTIALLY ABSENT

✅ **Jake ran ⚑ across five students on 2026-08-25: ZERO `runcount-drift`
refusals.** The remediation defect could corrupt `runCount`, but in practice
almost nobody used the button enough to matter. **The repair sketched below is
NOT worth a round** — this is what the measurement was for.

⚠️ **The other half of this item still stands and cannot be fixed:** sprints
written before `learn.js` v2.36.0 carry no `practice` stamp, so a reconstruction
may grade an old practice drill as lesson material. Nothing the ⚑ button writes
advances a student, which is why that is tolerable.

### The original item, kept

Round 41 found that the **"🎲 Practice missed keys" drill was being graded as the
lesson's run 1** — see HANDOFF §0.-31.A. Fixed forward, but:

⚠️ **SPRINTS WRITTEN BEFORE `learn.js` v2.36.0 CARRY NO `practice` STAMP**, so a
remediation drill in the archive is indistinguishable from a real run. Item 15's
`⚑` reconstruction may therefore grade a random-letter drill as lesson material
for any day before 2026-08-25. This is **not recoverable** — the information was
never written.

⚠️ **THE SAME DEFECT WROTE `runCount: 1` ONTO REAL LESSON RECORDS.** Any student
who used the button has a `lessonProgress` record whose `runCount` is the
synthetic drill's, not the lesson's. Consequences, both live today:

1. `lessonModeFor()` scans `runCount` runs, so the **map card badge** can read
   "practice" for a lesson that still pays. The per-run banner is correct
   (`armRunMode()` asks `modeForRun()`), so this is a mislabel, not a mis-grade.
2. Item 15's `⚑` will **refuse** those lessons with `runcount-drift` — correctly,
   and visibly, which is how they can be found.

**The repair is one line and has not been written:** `recordRunOutcome()` could
re-derive `runCount` from `buildRunList(currentLesson).length` rather than
`currentRuns.length`. ⚠️ **DO NOT DO THIS BLIND** — `currentRuns` is also replaced
by the remediation detour and by nothing else, so the two agree on every ordinary
path, and a change here touches the mastery gate. Measure how many records
actually carry a wrong `runCount` first: the `⚑` button's refusal list is the
measurement, free, on any day Jake opens.

---

## 23. ✅ CLOSED (Round 50, Blickensderfer) — THE RUN LIST IS PAIRED WITH THE LESSON

✅ **SHIPPED learn.js v2.39.0.** `currentRunsFor` records what `currentRuns` was
built for, set at **every** site that assigns the list — `startLesson()`, the
remediation detour, and the exit reset — and both writers refuse when it does not
match `currentLesson.id`.

⚠️⚠️ **THE GUARD THIS ITEM PROPOSED WAS THE WRONG ONE, AND THE REASON MATTERS.**
The item suggested `currentRuns.length !== buildRunList(currentLesson).length`.
That fails twice:

1. **`buildSequence()` is RANDOM per call** for `key_random` and
   `key_pattern_auto` — `buildRunList()`'s own comment says sequences are baked
   for exactly this reason. Recomputing to compare invites a false positive, and
   **a false positive here refuses a REAL run**: silent data loss, strictly worse
   than the hazard it guards.
2. **A swap that produces the same run count passes it.** The remediation drill
   on a 3-chunk lesson would sail straight through.

A pairing token answers the real question — *was this list built for this
lesson?* — in O(1), with no recomputation and no randomness.

⚠️ **IT CANNOT FIRE TODAY, AND THAT IS THE POINT.** `finishStep()` returns at the
remediation branch before either writer. This is a backstop for a structural
hazard that has already cost one round, not a fix for a live bug — `remediationRun`
flags the one KNOWN detour, this guards the shape.

⚠️ **THE REFUSAL IS TOTAL AND AUDIBLE.** No attempt, no grade, no fire, nothing
left behind on `lastGrade` — a partial write would leave the record internally
inconsistent, which is the defect class §0.-14 is about. And it logs an error
naming the lesson, because a silent refusal is its own failure mode: the run
vanishes and nobody knows why.

Guarded by `tests/exit-flush-test.mjs` Section G (7 assertions,
mutation-verified: removing the guard fails G2/G3/G4/G7, and accepting a falsy
token — the mistake a hand-written guard would plausibly make — fails G6).

### The original item, kept

The Round 41 defect was possible because **four writers read `currentLesson` and
none of them checked that `currentRuns` still belonged to it.** The remediation
detour is the only path that breaks that pairing today, and it is now flagged —
but the *structural* hazard is unguarded: any future feature that swaps the run
list will re-open it, silently, and the symptom will again be a grade rather than
an error.

---

## 16. ✅ FIXED (Round 40) — THE BUILD PANEL ON `reports.html` AND `admin.html`

Jake: *"the hover doesn't work on reports. It also doesn't work on admin."*

`reports.html` shows `Reports v2.25.1` and `admin.html` shows a corner stamp, but
neither has the hover build list. ⚠️ **AND NEITHER IS IN `versions.js`'s
`SOURCES`** — HANDOFF §2 already flags that their versions are *unchecked*, which
means a stale `admin.js` cannot be detected by the one instrument built to detect
stale files. Small job: add both to SOURCES and give each shell the footer.

✅ **DONE.** Both shells now carry an HTML version comment (`reports.html v1.0.0`,
`admin.html v1.0.0`) parsed by `versions.js` SOURCES, and both footers have the
build-info button. ⚠️ **THE TWO SHELLS ARE IN `HEADER_EXEMPT`** in
`version-stamp-test.mjs`: section A compares a *runtime constant* against a `//`
header, and a markup shell has neither. Exempt there means "no constant to
disagree with", **not** "stop watching it" — they are still parsed and still
drift-checked. ⚠️ `admin.js` previously wrote `footerEl.innerText`, which would
have **deleted the new button half a second after load**; it now writes a span
inside the footer.

---

## 17. ✅ CLOSED (Rounds 35–40) — REPORTS READ EVERY RECORD OF EVERY STUDENT

⚠️ **THE PREMISE WAS WRONG AND THE COMPLAINT WAS RIGHT.** The date filter was
already in `buildScopedQuery()` (Round 35). Nothing historical was ever loaded:
measured 2026-08-24, the discovery query returned **104 documents** — correctly
date-filtered — while the by-id sweep spent **501 reads and got 397 misses**. The
cost was never old records; it was blind guesses at document ids.
⚠️ **AND THE `students × days` FIGURE ON SCREEN WAS THE CROSS PRODUCT** — what
the sweep *would* read before pruning — which misled two rounds. It now reports
what was actually read. See §0.-28 and §0.-30. Original text below.

### The original item, kept for the diagnosis

Jake: *"reading every record of every kid every time to generate a report seems
problematic... that 1155 is there regardless of the time window or the school
window, and it takes a minute and a half NOW. Next week, when it's 2200+, it'll
take 3 minutes."*

⚠️ **THE COST IS SUPERLINEAR IN THE WRONG VARIABLE.** 1,155 reads to report on
**three** students who typed. The window and the school filter are being applied
**in the browser, after the read.** They must move into the Firestore query.

### ✅ THE `date` FIELD ALREADY EXISTS — NO BACKFILL NEEDED

Jake's console read of `typing_logs/{uid}_2026-08-17` shows the document carries
**`date: "2026-08-17"` as a real field**, alongside `uid`, `email`,
`displayName`, `seconds`, `chars`, `mistakes`, `source`, `classId`, `schoolId`,
`lastUpdated`.

⚠️ **SO THIS IS A PURE QUERY CHANGE PLUS AN INDEX. No migration, no one-off
write.** `where('date','>=',start).where('date','<=',end)` works against the data
as it stands today.

⚠️ **BUT `schoolId` AND `classId` ARE STAMPED `""` ON EXISTING LOGS** (item 11),
so a school filter in the query will return nothing for historical records until
that is resolved. **Ship the date filter first — it is the whole cost saving —
and treat the school filter as blocked on item 11.**

`typing_logs/{uid}_{date}` also encodes the date in the document ID, which is why
the current code reads by document id — a decision §0.-11 made for good reasons. ⚠️ **The index must exist before the query ships or it
fails at runtime**, and `firebase/firestore.indexes.json` is in this repo.

---

## 18. ✅ CLOSED (Rounds 36–40) — THE READ BUDGET

Measured, then fixed. A sprint session went **80 reads → 12**, the library page
**8 → 3**. ⚠️ **AND ~38% OF THE WORST DAY WAS JAKE'S OWN AFTER-HOURS WORK**, not
students — the Firebase usage panel includes console browsing. Read §READS at the
top of this file before re-opening any console. Original text below.

### The original item, kept for the arithmetic

Jake, from the August Firestore usage: **11.3% of the 50K/day free read quota with
~135 students in one month.** Writes are at **0.2%**.

⚠️ **THE TARGET IS ~400 CONCURRENT USERS (7,000 students / 3 trimesters / 6
periods), AND THE CURRENT SHAPE REACHES ABOUT 270.** Not urgent this month;
structurally blocking before the target.

* ⚠️ **ITEM 17 IS ALMOST CERTAINLY THE BULK OF IT** and should be measured before
  anything else is optimised. **Do not optimise the student pages on a guess** —
  this project has twice built on a number nobody checked.
* ⚠️ **WRITES ARE ESSENTIALLY FREE HERE AND READS ARE THE CONSTRAINT.** Jake:
  *"if more writes would be helpful for stability, it's definitely an option, as
  we have a ton of space."* **That inverts the usual trade and should be written
  into any design discussion in this repo.** 0.2% vs 11.3% is a 50x asymmetry.
* Jake's localStorage idea — read the session start once at login, accumulate
  locally, flush as now — is **directionally right and needs care**: the WAL
  already does the flushing half. The question is which READS the student pages
  do per session, and that is a measurement, not a redesign.

---

## 9. REDUCE THE SURFACE

No deadline.

- ⚠️ **THE DAY ROLLOVER LIVES ONLY IN THE TICK.** It fires on a counted second,
  so a tab that wakes on a new day and signs in, flushes or paints — without
  typing — is working from stale day counters until the first keystroke. Round
  26 closed the one path that wrote them to Firestore; it did not move the
  rollover somewhere a page load can reach. **This is now a repair, not tidying,
  and it is the same work as the bullet below.** `HANDOFF.md` §0.-12.E.
- **Extract the timer/stats/flush path out of `game.js`** as `daycounter.js` —
  pure functions, injected dependencies, directly testable, the same discipline
  as `daylog.js`. That path is where every counting defect has lived.
  ⚠️ `STAT_KEYS`, the WAL fold, the guest merge and the midnight rollover are
  four hand-maintained lists a new counter has to be added to.
- ~~**Enforce the header budget**~~ ✅ **DONE**, Round 28 (Daugherty), on Jake's
  ruling: *"a previous iteration of you made those limits, and I have no problem
  with you raising them to a reasonable amount. Probably should make a note that
  if the code itself expands, the line limit should, too."*
  ⚠️⚠️ **THE SEVENTEEN NOTES WERE TWO DIFFERENT PROBLEMS WEARING ONE LABEL, AND
  ONLY ONE OF THEM WAS UNTIDINESS.** The bullet above assumed a single backlog of
  sloppy headers. It was not:
  * **The LINE budget was WRONG.** A flat 60 was applied to files from 51 lines
    (`variety-floor.js`) to 8,000 (`game.js`). It called `drill-filter.js` — 191
    header lines documenting 105 lines of filter policy, where the policy *is*
    the product — the same violation as a 40-entry changelog. That is not
    untidiness; it is a budget measuring the wrong thing. Now
    `max(220, ceil(bodyLines × 0.08))`, per Jake's ruling.
    ⚠️ **MEASURED AGAINST THE BODY, NOT THE FILE** — measuring against the total
    lets a header fund its own growth: add 100 lines of header, earn 8 more.
  * **The ENTRY budget was RIGHT and was the one catching something.** `game.js`
    had 40 entries in one comment block and `learn.js` 46, both partly out of
    order because nobody scrolls to the bottom of a changelog to file a new one
    correctly. 45 entries moved verbatim to `CHANGELOG.md` §&nbsp;ARCHIVED FILE
    HEADERS. Budget raised 6 → 8 (a round's work plus room) and **deliberately
    left FLAT.** ⚠️ **DO NOT MAKE ENTRIES PROPORTIONAL.** "Nobody reads to the
    bottom" gets *worse* as a file grows, not better.
  ⚠️ **SECTION E IS A FAILURE NOW, NOT A NOTE**, and the old warning's condition
  was met rather than overridden. It said *don't promote these without doing the
  work first*, because seventeen would leave `npm test` permanently red. The
  count is **zero**. A budget at zero violations is a ratchet; a budget at
  seventeen is only noise. `versions.js` v1.12.0 is the source; `audit-versions.mjs`
  v1.4.0 and `version-stamp-test.mjs` v1.1.0 are the two mirrors, and **nothing
  checks the three budget numbers against each other** — change `versions.js`
  first, then both, in the same commit.
- ~~**Four hand-maintained copies of `ADMIN_EMAILS`**~~ ✅ **DONE**, Round 28.
  `game.js`, `learn.js`, `admin.js` and `reports.html` (as `BOOTSTRAP_EMAILS`)
  each carried the same two addresses. **Nothing had drifted — that is luck, not
  design**, and the symptom of forgetting one is a colleague who can reach
  Reports but not the admin panel, with no error anywhere to explain it. Now one
  export in `firebase-config.js` v1.3.0, which won on the grounds that all five
  consumers already import `db`/`auth` from it: zero new dependencies, and no
  new module to remember to register in `versions.js`.
  ⚠️ `tests/build-panel-test.mjs` section E **fails if a second literal list
  reappears anywhere**, under any name, so this cannot silently regrow.
- **Sentence-boundary WAL checkpoint**, both files or neither. localStorage only,
  costs nothing.
- **`pendingClassAssignments` as a third roster discovery source.**
- ~~**Three shipped modules were not syntax-checked**~~ ✅ **DONE**, Round 25.
  `MODULES` in `run-all-tests.mjs` omitted `daylog.js`, `update-gate.js` and (on
  arrival) `drill-filter.js`. ⚠️ **`update-gate.js` is imported by BOTH
  `game.html` and `learn.html` and was covered by nothing at all** — a stray
  character in it takes down both student pages at import time and the suite
  would have reported success. `daylog.js` was accidentally covered by harnesses
  importing it. 13 → 16 modules. It is a hand-maintained list with no import
  graph behind it, so it will drift again; there is now a warning above it.
- ~~**Guest paths verified by running rather than reading.**~~ ✅ **DONE** for
  Library, 2026-08-20, in the console — see item 2. ⚠️ **NOT DONE for School.**
  `learn.js`'s guest handover has still never been driven against a browser.
- **The idle-threshold rationale as a code comment**, above the constants in both
  files. ⚠️ **A COMMENT, NOT A BEHAVIOUR CHANGE** — do not touch the 2s/3s values
  while adding it.
- ~~**`lessons-admin.js` keys its cutover gate off `data.date`**~~ ✅ **DONE**,
  Round 25, `lessons-admin.js` v1.13.1 — it keys off the document id now, via
  `_logDateFromId()`. ⚠️ **THE LESSON IS THE TIMING, NOT THE FIX.** This sat here
  rated *"not urgent"* and the rating was CORRECT when it was written: before the
  cutover a wrong date only mis-sorted a row. From 2026-08-22 the same string
  picks the read branch. **A backlog item's priority can be a function of the
  calendar, and nothing in this file recomputes it.** When a dated change is
  approaching, re-read the whole list against that date rather than against the
  day it was written.
  ⚠️ **STILL OPEN, AND IT IS A DIFFERENT PROBLEM:** the query above it filters on
  `where('date', ...)`, on the FIELD, because an id is not indexable. A document
  with a wrong stamp can still fail to be DISCOVERED. `HANDOFF.md` §0.-11.B.
- ~~**`lessons-admin.js`'s header entries are out of order**~~ ✅ **DONE**, Round
  25. `v1.13.0`'s entry had been pasted into the MIDDLE of `v1.11.0`'s sentence,
  cutting it off at "reports.html" and orphaning the paragraph that finished it.
  ⚠️ **THAT IS WHAT THE ORDERING WARNING WAS ACTUALLY REPORTING** — not a
  cosmetic sort problem but a destroyed sentence, which is worth knowing the next
  time `audit:versions` says "out of order" about a file. Comments only.
- ~~**`package.json` declares `//scripts` TWICE**~~ ✅ **DONE**, Round 25. JSON
  does not allow duplicate keys — last one wins — so the first array, explaining
  `npm test` and `--with-epubs`, was silently discarded by every parser that ever
  read the file. A comment that had been deleted for as long as anyone had been
  reading it. Merged into one array.
- ⚠️ **DO NOT ADD `"type": "module"` TO `package.json`.** Every harness run prints
  `MODULE_TYPELESS_PACKAGE_JSON` and recommends exactly that. `functions/index.js`
  is CommonJS and is what `main` points at, so it would break the next
  `firebase deploy` on a `require()` the warning never mentioned. The reasoning is
  now in a `//type` key in the file itself. If it is ever worth doing: rename that
  file to `.cjs` and repoint `main`, in a round that can watch a deploy.
- **`handleDrillKey()` and game.js's keydown listener are near-duplicates that
  drifted.** Round 24 fixed the modifier guard in one of them. They disagree in
  other places too. Neither is obviously the better copy.
- **The two tick loops have drifted too**, and item 6 is the proof: one
  increments before its midnight check and one after, and they compensate
  differently. ⚠️ Any extraction of a shared day-counter has to reconcile that
  first, not paper over it.
- ⚠️ **`visibilitychange` DOES NOT FIRE ON macOS APP SWITCH.** Jake demonstrated
  it 2026-08-20: Cmd+Tab away with the window still visible behind the new app
  leaves the handler silent, so `logOpenSprint('hidden')` does not run.
  `pagehide` covers navigation, which is the case that matters, so nothing is
  lost — but the comment above that handler in both files claims broader
  coverage than it has. **Do not build on it.**

---

## 9b. ✅ DONE — THE THREE SHARED MODULES THE FOOTER COULD NOT SEE

**Closed 2026-08-22 on Jake's ruling.** `drill-filter.js`, `celebrate.js` and
`receipt.js` were extracted in Rounds 25–26 and none reached `versions.js`'s
SOURCES, so the build footer could not report them — a stale cached copy of any
of the three was invisible from the chair. `celebrate.js` and `receipt.js` had
**no runtime version constant at all.**

⚠️ **THE COST WAS NEVER MONEY, AND THE QUESTION IS WORTH RECORDING BECAUSE THE
ANSWER IS NOT OBVIOUS.** Jake asked whether it was billing, and whether
localStorage could carry it instead. Neither:

- **`versions.js` does not touch Firestore.** It `fetch()`es the *static files*
  from the web host to read each version constant out of the deployed bytes.
  Nothing here is a document read; nothing here is billed per-operation.
- **The bandwidth is already spent.** SOURCES already fetches `game.js` (424 KB)
  and `learn.js` (260 KB). The three additions total about 38 KB — roughly 5% on
  top of a request that only fires when the footer is hovered, and which is
  already cached per tab in `sessionStorage`.
- ⚠️ **localStorage CANNOT ANSWER THIS QUESTION, and the reason is the point of
  the whole mechanism.** The footer exists to report **what is on the server**,
  so that a stale cached file cannot lie about its own version. A cache of what
  the browser already loaded is *the very thing being checked* — it would report
  the stale file's own opinion of itself. That is invariant 1's shape exactly: a
  cached copy of a quantity that lives elsewhere.
- ⚠️ **AND THE FREE-LOOKING ALTERNATIVE WOULD HAVE BEEN A FIFTH TWIN.** All three
  modules are ES imports already in memory, so reporting their constants directly
  costs zero fetches — genuinely free, and it was tempting. But it answers a
  *different* question ("what is running in this tab") through a *second*
  mechanism, and this project's most expensive lesson of the week (§0.-13.E) is
  that a second hand-maintained path drifts from the first. **One mechanism.**

**So the cost was programming time, which Jake pre-authorised.** Shipped:
constants added to `celebrate.js` (1.1.0) and `receipt.js` (1.1.0); all three
files added to `versions.js`, `tools/audit-versions.mjs` **and**
`tests/version-stamp-test.mjs` in one commit, which section D of that harness
requires.

⚠️ **THE RATCHET MATTERS MORE THAN THE WIRING.** `version-stamp-test.mjs` D2 now
reads the `import` statements out of `game.js` and `learn.js` and **fails if any
module they import is missing from SOURCES.** The next extracted module cannot
repeat this: a file that runs on a child's screen must be reportable in the
footer Jake reads to diagnose a deploy.

---

## 10. ✅ BUILT — STUDENTS ARE FARMING THE FIRST THREE LESSONS

✅ **SHIPPED Round 29 (Odell), 2026-08-23.** `lesson-gate.js` v1.0.0 holds the
whole rule and is pure; `learn.js` v2.32.0 renders it; `game.js` v3.44.0 feeds
the day counter. 56 checks in `tests/lesson-gate-test.mjs`. HANDOFF §0.-21.

⚠️ **THE SPEC BELOW IS CORRECT EXCEPT FOR ONE LINE IN §E, AND THE ERROR IS WORTH
KEEPING.** It says to increment `activeDayCount` *"at the existing day-rollover in
the tick."* **That rollover is the midnight-straddle path** and runs only for a
tab left open across midnight — the counter would have sat at 0 for every student
forever, and `reachBack` 0 is indistinguishable from "everyone is advancing," so
nothing would have reported it. The build reads the stored date instead. §0.-21.B.

⚠️ **STILL OPEN: §H, THE MEASUREMENT, WHICH THIS ITEM PUT FIRST** — *"before any
of it: measure."* Not built. It is cheaper now than when written: `fireCount` sits
on the same record as `attempts`, so one admin column shows mastery and grinding
side by side. **This project has twice built on a number nobody checked.**

⚠️ **AND NOTHING HERE HAS BEEN DRIVEN IN A BROWSER.** The rule is proven pure and
green; that `renderMap` asks it correctly, that the timer never arms, and that the
banner appears are unproven.

---

### THE ORIGINAL ITEM, kept because the reasoning is reusable

**Jake, 2026-08-22:** *"Students are just redoing the first three lessons
indefinitely because they're easy... it's one of the dumbest things I have to
police manually now, and I'd rather build it in if I can."*

**Position: after the quality-of-life items, well before the new game mode.**

---

### A. ⚠️ FIRST, THE CHAPTER LADDER — WHAT IT ACTUALLY IS

Jake asked whether we could reuse the chapter logic and said his memory of it
might be wrong. **It was close on the numbers and wrong on the destinations**, so
here it is from `game.js`, checked rather than recalled:

| bookmark age | where the student lands |
|---|---|
| under **7 days** | the **exact offset** — they remember the sentence |
| under **30 days** | the **start of the sentence** |
| beyond 30 days | the **start of the chapter** |

`REANCHOR_EXACT_MS` / `REANCHOR_SENTENCE_MS`. **It never sends anyone to the
start of the book.**

⚠️⚠️ **AND IT IS NOT A REVIEW MECHANIC AT ALL, WHICH IS THE PART THAT MATTERS
HERE.** The ladder is a **degradation path for a re-uploaded book**: it only runs
when the text changed and `anchorText` could not be found in the new version. It
is the app admitting *"I lost your place, here is how far back I will honestly
claim to know."* It never fires during normal reading.

**So the mechanism does not transfer — but the thresholds should.** 7 and 30 days
are Jake's own numbers, already reasoned about once and already in the codebase.
A lesson cooldown measured in the same 30 days is one fewer arbitrary constant.

---

### B. ⚠️ WHAT THE DATA CAN AND CANNOT ALREADY ANSWER

`users/{uid}/lessonProgress/{lessonId}` currently stores:

| field | use for this item |
|---|---|
| `completedAt` | ✅ **the cooldown clock, free** — updated on every completion |
| `attempts` | ✅ sizes the problem today, but counts failures too |
| `grade` | ⚠️ **BEST grade only, monotonic** — tells you they *ever* got A🔥 |
| `passed`, `timeSpentSeconds`, `finalWPM` | context |

⚠️ **"THREE TIMES A🔥" IS NOT DERIVABLE FROM WHAT IS STORED.** `grade` keeps the
best grade ever seen, so it cannot distinguish one A🔥 from twenty. A new counter
is required — `fireCount`, incremented on the run that earns `FIRE_GRADE`.

⚠️ **That is a genuinely new quantity, not a second copy of an existing one, so
Rule 9 is satisfied** — but it starts at zero for every student who has already
earned fire, so the gate does not begin biting until they earn three more.
**Decide deliberately whether that grace is wanted; it is probably a feature.**

---

### C. ⚠️⚠️ A CORRECTION — I OVERSTATED THE RULE 11 OBJECTION

The previous version of this item said *"do not fix this by not counting the
time — Rule 11 forbids it."* **That was wrong and it is worth correcting in
place rather than quietly dropping.**

Rule 11 says the number **the student sees** and the number **the teacher pulls**
must be the same number. Time that counts for neither does not violate it. There
is no divergence in "this run counted for nobody."

**The real objections are different, and two of them are serious:**

1. ⚠️⚠️ **THE DRILL-DOWN WOULD DISAGREE WITH THE DAY TOTAL, BY DESIGN.** If the
   tick skips seconds but `session-log.js` still files the run, `typing_logs` and
   `typing_sessions` diverge — which is exactly what item 4's implausibility flag
   and the Δ column in `reports.html` exist to catch. **We would be manufacturing
   the signature of the bug class this project has spent six rounds chasing.**
   Any "doesn't count" mode must exclude the run from **both** records, or mark
   it so every reader can tell.
2. ⚠️ **IT PUTS A CONDITION ON THE ONE INCREMENT SITE.** The tick has one gate and
   one increment site, and the header above `startGradedTimer()` lists four
   separate bugs that all vanished when it stopped having three. A condition is
   not a second site, so this is survivable — but it is the single most
   load-bearing line in the app.
3. **A child typing for ten minutes and watching their total not move reads as a
   broken app**, and silent counting failures are this project's specialty. It
   would have to be loud: the warning up front *and* a visible "Practice — not
   counted" state in the HUD for the whole run.

⚠️ **AND JAKE'S ARGUMENT FOR IT IS SOUND:** *"them smashing f and j for 10 minutes
should not count if they're typing full words."* That is a real fairness problem
and a real grading problem. The objection is to the **implementation cost**, not
the goal.

---

### D. ⭐ THE MODEL — A RECEDING REACH-BACK WINDOW

**Jake's clarifications, 2026-08-22, and they change the shape:**

> *"Kids are in my class for 2 months."*
> *"When I say a month, I mean a month of typing anything."*
> *"It should cool down slowly backwards — homerow shouldn't open up first. If
> they're on lesson 27 and they fireballed 26 3 times already, it should be a
> week before they can do 26 again, and then a week more before they do 25
> again."*
> *"I do not want kids to go back and do lesson 1 unless they actually,
> legitimately, need to do lesson 1 again."*

⚠️ **THE TWO-MONTH COURSE KILLS THE FLAT 30-DAY COOLDOWN THE LAST DRAFT
RECOMMENDED.** A flat month is a quarter of the time Jake has a child at all, and
it opens *every* mastered lesson at once — including the home row, which is the
one he least wants opened. **Distance has to be in the rule, not just time.**

**THE RULE:**

```
reachBack = floor(activeDaysSinceLastAdvance / 7)
lesson L is GRADED  if  L >= furthestLesson - reachBack
lesson L is PRACTICE otherwise   (when fireCount >= 3)
```

Check it against Jake's own example — a student at lesson 27:

| active days stalled | reachBack | graded lessons |
|---|---|---|
| 0–6 | 0 | 27 only |
| 7–13 | 1 | 26, 27 |
| 14–20 | 2 | 25–27 |
| 56 (the whole course) | 8 | 19–27 |

**Lesson 1 would need 26 weeks of standing still. It never opens inside a
two-month course** — which is exactly the ask.

⚠️⚠️ **AND THE PROPERTY THAT MAKES THIS BETTER THAN A COOLDOWN: PROGRESS RESETS
IT, SO REVIEW ARRIVES EXACTLY WHEN IT IS NEEDED.** A child advancing normally
never accumulates reach-back and never sees an old lesson. A child who **stalls**
— the one who actually has forgotten something — earns access to one more lesson
behind them per week of trying. The mechanism hands review to the struggling
student and withholds it from the coasting one, **without either of them being
assessed by anybody.** That is the whole problem solved by the shape of the rule
rather than by a judgement call.

⚠️ **"ACTIVE DAYS", NOT CALENDAR DAYS** — Jake was explicit. A child absent for a
month must not come back to a pile of unlocked lessons. See §E for the cost.

⚠️ **RE-LOCK ON RE-FIRE.** *"If they fireball lesson 1 after it unlocks, I want it
immediately locked again."* Earning A🔥 in a reach-back-opened lesson stamps it
and returns it to PRACTICE immediately — it does not wait out another window.
**A reach-back opening is one shot, not a licence.**

---

### E. ⚠️ THE ONE EXPENSIVE PART — "ACTIVE DAYS" NEEDS A COUNTER, AND RULE 9 APPLIES

The set of days a student typed **already exists**: it is exactly the set of
`typing_logs/{uid}_{date}` documents. Counting a month of them costs ~30 document
reads on every map render, which is not affordable.

The cheap alternative is a monotonic `activeDayCount` on the student's record,
incremented **once per day, at the existing day-rollover in the tick** — the one
place that already owns the day boundary, so it is one increment site and not a
second clock.

⚠️⚠️ **THAT IS A SECOND RECORD OF A QUANTITY THAT ALREADY EXISTS, AND RULE 9 SAYS
AN INSTANCE THAT CANNOT SATISFY IT MUST SAY SO AND ASK JAKE RATHER THAN QUIETLY
PROCEED. SO: SAYING SO.** The drift case is real — a teacher deleting a day's log
through the ⟳ path would leave the counter over-counting.

**The argument for accepting it anyway, which is Jake's to weigh:**

⚠️ **THE CONSEQUENCE OF DRIFT HERE IS "A LESSON UNLOCKS A DAY EARLY."** It is not
a grade, not a reported minute, not a number a parent sees. **Rule 9 exists
because duplicated counters corrupted the graded record** — `stats/time_tracking`
is the cautionary tale, and it was a duplicate of *the graded total itself*. This
counter never touches a grade, is never reported, and its worst failure is a
child getting review access slightly sooner than intended. **That is a different
risk class, and the rule should probably be spent elsewhere.**

**If Jake would rather not add it:** fall back to calendar days from
`completedAt` (free, already stored) and accept that an absent child returns to
unlocked lessons. ⚠️ That is a real regression against his stated requirement,
and it should be a decision rather than a discovery.

---

### F. ✅ PRACTICE MODE — AND ITEM 0b JUST MADE IT NEARLY FREE

> *"If they want to type it for fun, that's fine. But I'm not grading it, and
> they should have a banner across the top that says so."*

⚠️⚠️ **THIS RETIRES MY OBJECTION FROM THE PREVIOUS DRAFT, AND THE REASON IS
WORTH READING.** I argued that uncounted time would make `typing_logs` disagree
with `typing_sessions` — manufacturing the exact signature item 4's implausibility
flag exists to catch. **That is only true if the tick skips seconds while the
session log still files the run.** If a practice run is recorded in **neither**,
the two records stay in perfect agreement, because the run does not exist in
either of them. There is no divergence to detect.

⚠️ **AND THE SECOND OBJECTION IS RETIRED BY WORK THAT SHIPPED THIS MORNING.** I
argued it would put a condition on the one increment site the tick's header
credits with killing four bugs at once. It does not have to:
**a practice run simply never calls `startGradedTimer()`.** Item 0b built the
pause-and-resume path for the ⚙ dialog, and this is the same mechanism used
differently — no gate is touched, no condition is added, the timer is just never
armed. **The single increment site stays exactly as it is.**

So a PRACTICE run:
- never arms the graded timer → no seconds counted, no condition added;
- never calls `sessionLogPush()` / `logRun()` → no session record, so nothing to
  disagree with;
- never calls `saveProgress()` → no grade, no `fireCount`, no `completedAt` move.
  ⚠️ **THIS IS ALSO WHAT MAKES THE RE-LOCK IN §D COHERENT:** a practice run cannot
  earn the A🔥 that would re-lock it, because it cannot earn anything.
- shows **a persistent banner across the top for the whole run** — Jake's word,
  and it must not be a dismissible toast. ⚠️ **A child typing for ten minutes
  while the daily total does not move reads as a broken app**, and silent
  counting failures are this project's specialty. The banner is the feature, not
  the decoration.

---

### ✅ RESOLVED — ALL THREE DECISIONS ARE MADE. THIS IS BUILDABLE.

**Jake, 2026-08-22.** Recorded verbatim-in-substance so the next round does not
re-open them.

#### 1. ✅ `activeDayCount` — BUILD IT CHEAP, RULE 9 SPENT DELIBERATELY

> *"A lesson unlocking a day early is fine. Doing this in the cheapest way
> possible is also fine — cheap here being firestore reads. Unlike time, this
> doesn't have to be bullet proof — it just needs to be a gate."*

⚠️ **THE DISTINCTION IS THE VALUABLE PART AND IT SHOULD BE REUSED: A GATE IS NOT
A LEDGER.** Rule 9 exists because a duplicated counter corrupted the *graded
record* — `stats/time_tracking` was a second copy of the number a parent sees.
This counter is never reported, never graded, never shown, and its worst failure
is a child getting review access one day early. **Same rule, different risk
class.** Spend Rule 9 on ledgers; a gate can be approximate.

**Implementation:** a monotonic `activeDayCount` on the student record,
incremented **once per day at the existing day-rollover in the tick** — the one
place that already owns the day boundary, so it is one increment site and not a
second clock. Never read a month of `typing_logs` to compute it.

#### 2. ✅ THE QUESTION DISSOLVES — AN UNMASTERED LESSON IS NEVER GATED

> *"If the kid moves forward on a B, he should be able to go back. We're talking
> about lessons that get 3 A's... A kid wanting to redo a lesson until he masters
> it is a **good** thing. A kid bumming around on a lesson he's mastered is a
> **bad** thing."*

⚠️ **THE GATE ONLY EVER APPLIES TO LESSONS WITH `fireCount >= 3`.** A lesson
passed with a B — or an A, or two A🔥 — is **always** graded and **always**
replayable, at any distance, forever. `reachBack` never enters the question for
it. So "the kid who advanced on a B" is not a case the rule can reach.

**That is the whole design in one sentence, and it should lead any future
summary of this item:** *mastery is what closes a lesson, and only mastery.*
⚠️ **DO NOT ADD A DISTANCE OR TIME CONDITION THAT APPLIES TO UNMASTERED
LESSONS.** It would invert the feature — punishing the struggling student, who
is the one this app exists for.

**Consequence for `reachBack` reset:** it stays as specced (measured from the
last advance), because it can only ever govern lessons the student has already
proven three times over.

#### 3. ✅ SEED `fireCount` FROM THE EXISTING BEST GRADE — JAKE'S IDEA, AND IT IS FREE

> *"You said it keeps 'highest score' — if that's an A, can we make the count 1?"*

**Yes, and it costs nothing:**

```js
fireCount ?? (grade === FIRE_GRADE ? 1 : 0)
```

Computed at read time from a field already stored. **No backfill, no migration,
no new write.** A student who has already earned A🔥 starts at 1 and needs two
more rather than three.

⚠️ **AND 1 IS THE HONEST MAXIMUM — DO NOT SEED HIGHER.** `grade` is
best-ever-seen and monotonic (see §B), so it cannot distinguish one A🔥 from
twenty. Seeding at 3 would claim knowledge the data does not contain **and would
lock a class out on deploy morning**, which is the kind of thing discovered
during first period rather than during testing.

---

### H. ✅ BUILT (Round 41) — the measurement

⭐ **SHIPPED in `lessons-admin.js` v1.15.0, for ZERO EXTRA READS.** It rides the
`⚠️ Find stuck` sweep, which already reads one `lessonProgress` subcollection per
filtered student. A second button would have re-read the same ~300 documents to
answer a neighbouring question about the same data.

⚠️ **TWO COLUMNS, BECAUSE ONE IS MISLEADING.** Runs-per-student high with a **high**
pass rate is the strong ones coasting; the same number with a **low** pass rate is
the struggling ones grinding. Opposite problems, opposite fixes — and the original
spec below asked for a single "attempts" column, which cannot tell them apart.
⚠️ It sums `runAttempts`, **not** `attempts`: a student stuck on run 2 of 12 has
`attempts: 0` and is exactly who this is looking for.
⚠️ **A🔥 counts run from 2026-08-25 only** (`runFires`, Round 41). A dash means NOT
RECORDED, not zero earned.

### The original ask, kept

`attempts` is already stored per lesson per student. **A read-only
attempts-per-lesson column in the lessons admin costs an afternoon** and answers
whether this is three kids or thirty, and whether it is the strong ones coasting
or the struggling ones hiding. ⚠️ This project has twice built on a number nobody
checked (§0.-10's retraction, §0.-9.E's Chromebook theory). The fix is cheap and
the measurement is cheaper.

---

## Known, and not being fixed

- **A student tab open across a teacher's edit still flushes its own counter.**
  No client-side change removes it; corrections are made after the fact.
- **A page can no longer flush the other mode's WAL tail.** Bounded by one flush
  interval. ⚠️ **Do not "fix" this by letting a page write the other's field when
  it looks larger — that is §3.1 with a comparison in front of it.**
- **The WAL is stranded on one Chromebook.** The period guard drops those seconds
  rather than misfiling them, which is the right failure. Do not relax it —
  misfiling last week's minutes into this week's grade is worse than losing them.
- **The daily log is client-written.** A student with the console open can write
  any value under the rules' clamp. Item 4 is the practical answer; server-side
  derivation is the complete one, if it ever becomes worth building.
- **`typing_sessions` has a 120-day TTL** and `typing_logs` has none. Keep it so.

---

## Settled — do not reopen

- **The 2s Library / 3s School idle split is deliberate.** Library is for
  students who can already type; School is for students who cannot.
- **Time is a valid basis for a grade.** The job is to make the minutes
  legitimate, not to stop counting them.
- ⚠️ **HISTORICAL *MINUTES* ARE GOOD ENOUGH. NO BULK REPAIR OF PAST DAYS' TIME.**
  **Amended by Jake, 2026-08-23:** *"Bulk repairing scores is fine — change the
  ruling to minutes so it doesn't bite us later."* ⚠️ **THE RULING WAS ALWAYS
  ABOUT THE CLOCK AND IT WAS WRITTEN WITHOUT A NOUN**, which is how it came to
  read as a ban on repairing anything. It bans re-deriving a day's `seconds`
  after the fact, and it bans it because the inputs to that number expire, are
  clamped, and were never the whole story — a repaired day total is a guess
  wearing the same font as a measurement. **GRADES AND RUN SCORES ARE NOT IN
  SCOPE**: they are a pure function of data that is still on the record
  (`lesson × wpm × accuracy × clean`), so recomputing one is a *calculation*,
  not a reconstruction, and it can be re-run and checked. See item 15.
- **§3.1's fix is per-source fields**, date-gated at 2026-08-22, shipped in Round
  22. Per-source document ids are denied by the deployed rules. Do not revive.
- **The flat `seconds` triple is frozen after the cutover** and is never written
  again by a student page.
- **The reconcile is deleted** (Round 23, on Jake's confirmed boundary). If a
  future round wants a comparison back, what it probably wants is item 4.
- ⚠️ **STUDENTS DO NOT SHARE BROWSER PROFILES.** Every student logs into the
  Chromebook with their own account, so per-browser is per-person — the ruling is
  in `stats-wal.js`'s header and `learn.js`'s `checkpointOwner()`. Round 23 built
  a whole theory on the opposite and Jake had to say so twice. **The only two
  uids that can meet on one profile are guest and signed-in.**
- ⚠️⚠️ **THERE IS NO ANONYMOUS AUTH IN THIS APP.** `signInAnonymously` appears
  nowhere in the repo, so a guest has `currentUser === null` and every
  `currentUser.isAnonymous` test is a guard against a state that cannot occur.
  Two rounds wrote a defect report on the opposite belief (deleted item 3).
  **Grep for the mechanism before writing down the consequence.**
- ⚠️ **YESTERDAY'S GUEST MINUTES ARE CREDITED TO YESTERDAY, NOT TO TODAY.**
  Jake's ruling, 2026-08-20: *"It wouldn't be cheating, as it would get picked up
  and put in the right place."* This **overturns the twenty-four-hour drop** in
  `stats-wal.js`'s guest-accumulator header — that objection was right, and it
  assumed the only destination was today's counter. It has not been since the
  guest queue became dated and durable. ⚠️ The rescue can only ever
  UNDER-credit: its input is closed sprints, and `sessionLogTake()` is atomic so
  it cannot run twice. ⚠️ **NEVER add to the flat `seconds` triple to make it
  work on a pre-cutover day** — that is §3.1 with an addition in front of it.
- ⚠️ **A RECORD IS DATED BY THE CALLER, IN THE STUDENT'S OWN TIMEZONE.** Never by
  `toISOString()`, never at flush time, never by this-module's-idea-of-today.
  Round 24 found the one path that had drifted from this and it had been there
  since the guest queue shipped. `adopt-date-test.mjs` holds the line.


---

## 30. ⚠️ ADVENTURE MODE GIVES NO COLOUR FEEDBACK ON A WRONG KEY — AND CAPS LOCK IS WHERE IT SHOWS

**Jake, 2026-08-29:** *"Adventure mode caps lock is invisible. The bar pops up,
but the words are the same color."*

⚠️ **THE WARNING BAR ITSELF IS PROBABLY FINE AND THAT IS WHY THIS ITEM IS
WORDED THE WAY IT IS.** `#caps-warning` is a DOM element in `game.html`;
`style.css` paints it white on `#D32F2F` and `adventure.css` v-current repaints
it `#f2e8d5` on `#c0392b`, later in the cascade and at higher specificity. Both
pairs are legible, neither rule is `!important`-shadowed by anything else in
`adventure.css` (grepped: the only `!important` colour rules are the book-info
bar's), and `game.js`'s keydown handler toggles `.hidden` on it in every view.
**Read literally, the reported symptom should not be possible, so the report is
probably about the TEXT BEING TYPED, not the bar's own lettering.**

⚠️⚠️ **AND THERE THE ASYMMETRY IS REAL AND IT IS IN THE CODE.**
`adventure.css` sets `body.view-adventure #text-stream { display: none
!important }` — the per-letter `<span id="char-N">` nodes that carry
`error-state`, the `applyMissShade()` background and the `done-dirty` colour are
**not on screen in adventure at all**. The canvas draws the text instead, from
`_ttbEmit` events, and `_onKeystroke()` in `adventure-renderer.js` writes
`this.letterStatus[pos]` **only inside its `if (d.correct)` branch**. There is no
`else`. A wrong key gets a transient `mistakeFlash` and a tilt; it never earns a
persistent colour the way a classic-mode letter does.

**So: with caps on, a child in classic mode sees a wall of red and knows. In
adventure they see the bar, and the letters look the same as always.** That is
exactly the sentence Jake wrote.

**BEFORE BUILDING, ASK JAKE ONE QUESTION AND DO NOT GUESS THE ANSWER:** *"is the
bar's own text unreadable, or is it the typed letters that don't change?"* The
two have nothing in common — one is four lines of CSS, the other is a renderer
change — and building the wrong one costs a round. ⚠️ A screenshot settles it in
one glance and Jake has students who take them.

⚠️ **IF IT IS THE RENDERER:** the fix is an `else` branch in `_onKeystroke()`
that records a persistent wrong-key status, NOT a second colour system. The
statuses already exist (`perfect`/`fixed`/`dirty`) and the canvas already reads
them. **Do not reach for the DOM spans** — hiding them is deliberate and
`display:none` is what makes the canvas the single painter.

## 31. ✅ CLOSED (Round 55) — THE IDLE SPACE-SKIP LEFT THE SPACE BAR LIT

✅ **FIXED IN `learn.js` v2.41.0.** One `advanceHandGuide()` call inside the
idle-resume space skip, guarded on `drillPos` having actually moved. ⚠️ Nothing
else changed — no threshold, no timing, no scoring. **`tests/drill-paint-test.mjs`
asserts the INVARIANT rather than the call**: every mutation of `drillPos` is
followed by a painter at its own brace depth. ⚠️⚠️ **Part B's depth rule is the
line that makes the harness worth anything** — the first draft PASSED against the
real defect, because the skip's `{ finishStep(); return; }` guard clause sat
between the mutation and the end of the block and a depth-blind scan read it as
"painted". A painter on a branch that returns cannot paint the path that falls
through. Mutation-verified against the original code.

⚠️ **DO NOT "FIX" THIS IN `advanceHandGuide()`.** Its `if (ch !== ' ')` guard was
never the bug; clearing `space-active` unconditionally would kill the space cue on
the one frame the student is being asked to press it. Part D pins that guard.

### The original report, kept

**Jake, 2026-08-29:** *"the space bar will highlight instead of the following
letter regularly enough to notice... the two dots appeared on the space bar when
the game expected the first letter of the following word."*

✅ **FOUND, AND IT IS FIVE LINES IN `learn.js`.** `handleDrillKey()`, the
idle-resume space skip:

```js
const wasIdle = learnLastInputTime > 0 &&
                (Date.now() - learnLastInputTime) > LEARN_IDLE_THRESHOLD;
if (wasIdle && drillPos < drillSequence.length && drillSequence[drillPos] === ' ') {
    drillPos++;
    if (drillPos >= drillSequence.length) { finishStep(); return; }
}
const newExpected = drillSequence[drillPos];
```

**It moves `drillPos` past the space and never repaints the keyboard.**
`advanceHandGuide()` — the only function that moves the target highlight, the
hand guide and the space cue — is not called on this path. The last paint
happened at the END of the previous keystroke, when the space WAS the target, so
the space bar is still carrying `space-active` and `#space-hint` is still
visible. **The two dots Jake's students photographed are the thumb circles that
`setHandGuideToChar()` put there for a character the game has already skipped.**

⚠️ **AND `advanceHandGuide()` CANNOT SELF-CORRECT HERE, BY DESIGN.** Its
space-clearing line is guarded: `if (ch !== ' ')` clears `space-active`, with the
comment *"Clear space-active only when moving away from a space, not when landing
on one."* The guard is right; nothing is calling the function.

**WHY IT READS AS INTERMITTENT:** `LEARN_IDLE_THRESHOLD` is **3000ms**, and the
skip only fires when the paused-on character is a space. A three-second pause at
a word boundary is an ordinary thing for a beginning typist to do — which is why
it happens often enough for a class to notice and never on demand for a teacher.

**THE FIX IS ONE CALL**, after the skip and before `newExpected` is read. ⚠️
**But guard it on `drillPos` actually having moved**, not on `wasIdle` — a paint
on a position that did not change is a no-op today and a flicker the first time
somebody adds an animation to it. ⚠️ **A HARNESS MUST ASSERT THE INVARIANT, NOT
THE CALL**: *every mutation of `drillPos` outside `renderDrillText()`'s own path
is followed by a highlight refresh.* This is the third position/paint divergence
in this file's history; guarding the specific line leaves the next one open.

## 32. ✅ CLOSED (Round 55) — A RUN CAN NOW BE DELETED WITHOUT ITS SESSION

✅ **SHIPPED IN `reports.html` v2.33.0 / markup v1.5.0.** A ✕ on every sprint row.

⚠️⚠️ **AND THE ROUND GOT THE RULES QUESTION WRONG TWICE BEFORE JAKE FIXED IT.**
The item first said this "ships as one unit with a rules change, exactly like item
24 did". That was then CORRECTED to "no rules change needed" on the strength of
`allow update: if isSuper()` covering Jake. **Both were wrong.** Jake: *"Building
admin should be able to do it for their building and teachers for their class."*
The second claim checked exactly one privileged account — the one doing the
testing — and every building admin and teacher would have found the ✕ present and
silently denied. ⚠️ **A PERMISSION CHECKED AGAINST ONE PRIVILEGED ACCOUNT IS NOT
CHECKED.** `firestore.rules` v2.9.0 adds the staff branch.

⚠️ **THE SUPERSEDED CLAIM, KEPT SO THE MISTAKE IS LEGIBLE:** This item said it "ships as one unit with a rules change, exactly like
item 24 did". ⚠️ **It does not.** `firestore.rules` v2.8.0 reads
`allow update: if isSuper() || (owner && …)`, and Jake is super_admin — he must
be, because the whole-session delete beside it is `allow delete: if isSuper()` and
he uses it daily. The super branch already permits the write. **The owner branch
does not and must not**: it revalidates every create-time field, and a student
editing their own sprint list is the forgery that whitelist exists to stop.

⚠️ **THE ROLLUP IS RECOMPUTED IN THE SAME WRITE**, from the surviving sprints —
`seconds`, `chars`, `mistakes`, `wpm`, `accuracy`, `sprintCount`. Leaving them
stale would make a session row disagree with its own sprint list, which is item
4's divergence signature manufactured by the tool meant to clean it up. WPM is
recomputed from characters over time, not averaged across the surviving sprints,
which would weight a 5-second run equally with a five-minute one.

⚠️⚠️ **THE RUN IS IDENTIFIED BY `sprintIdentity()`, NEVER BY ARRAY INDEX.** An
index is stale the instant one run is removed, so a second click would delete a
different run than the one under the cursor. And it removes **exactly one** —
`findIndex` + splice, not `filter` — because two genuinely identical runs share an
identity and a filter would silently take both.

⚠️ **THE CONFIRM SAYS IT DOES NOT CLEAR MASTERY.** Item 33 is still open. A
teacher who deletes a run expecting a child to be unlocked would otherwise be
quietly wrong and the child would stay locked out.

### The original report, kept

**Jake, 2026-08-29:** *"as an admin, I can only delete full sessions, not
individual runs. I'd love to be able to delete individual runs."*

✅ **CONFIRMED.** `reports.html`'s drill-down renders a `.session-entry` with a
`.delete-session-btn` and, under it, a `.sprint-list` of per-run rows carrying
their grade pips and the 🚩 flag. **The run rows are display-only** — there is no
button, no handler and no data attribute pointing at anything deletable. The
delete path calls `deleteDoc(doc(db, "typing_sessions", sessionId))` on the whole
rollup and then `recalcDailyLog(..., { allowZero: true, expectDrop: true })`.

⚠️⚠️ **THE HARD PART IS NOT THE BUTTON, IT IS THAT A RUN IS NOT A DOCUMENT.**
Runs live as sprint entries INSIDE a `typing_sessions` document; `splitSessionTotals()`
sums SPRINTS, not documents (Round 44's reader fix). So deleting one run is an
**update** to a session document, not a delete — which means:

- `firestore.rules` must permit a staff `update` on `typing_sessions`, and today
  v2.8.0 grants `update` to the **owner** only, added for item 24's idempotent
  writer. ⚠️ **This ships as one unit with a rules change, exactly like item 24
  did**, and the rules go in the console by hand or the button does nothing.
- the session's own rollup fields (`seconds`, `wpm`, `accuracy`, `sprintCount`)
  are now wrong and must be recomputed from the surviving sprints **in the same
  write**, or the drill-down and its parent row disagree — which is item 4's
  divergence signature, manufactured by hand.
- `sessionSignature()` feeds the duplicate detector. Editing a session changes
  its signature. ⚠️ **Check what that does to `_isDupe` before shipping**; a
  dedupe that stops recognising a known duplicate is a silent inflation.
- and `recalcDailyLog(..., { expectDrop: true })` must still run afterwards, for
  the same reason the session delete calls it: `typing_logs` is the graded
  document and nothing else updates it.

⭐ **DO 33 IN THE SAME ROUND OR THIS BUTTON MAKES 33 WORSE**, because it hands
Jake a faster way to delete evidence that mastery still will not hear about.

## 33. ✅ CLOSED (Round 55) — MASTERY CAN NOW BE CLEARED FOR A LESSON

✅ **SHIPPED: `reports.html` v2.34.0 / markup v1.6.0, `firestore.rules` v2.10.0.**
A ⊘ in the ◈ grades panel on any lesson with banked mastery.

⚠️⚠️ **SHAPE 3 OF THE THREE THIS ITEM WEIGHED — A CONTROL, NOT AN AUTOMATIC
CONSEQUENCE OF DELETING A RUN.** Shape 1 (subtract on delete) stays unbuilt for
the reason written above: `runScores` is a cumulative SUM and `runGrades` is
best-ever-seen, so neither can have one entry removed, and subtraction would be
wrong silently. Shape 2 (a per-run ledger) is a fourth copy of a quantity already
stored twice — Rule 9.

**What it does:** clears `runScores` and `runLocks` **together**, keeps
`runGrades` / `runFires` / `runAttempts` / `runFailures`, and re-derives
`users/{uid}.lastLockDay` from the surviving maximum across the WHOLE
subcollection.

⚠️⚠️ **THE GLOBAL CLOCK IS THE PART THAT IS EASY TO MISS.** `lastLockDay` is the
reach-back window for the entire curriculum. Clearing the lesson that happened to
set it would leave the stamp pointing at a crossing that no longer exists — the
same child, still locked out, by a different mechanism. Re-read AFTER the write,
never from the copy the panel loaded.

⚠️⚠️ **`deleteField()`, NEVER AN EMPTY MAP.** An empty map is a value:
`runScoreOf()` finds no entry, falls through to `pointsForGrade(record.grade)` —
the legacy seed — and re-awards points from the best-ever grade this button just
declined to trust. `clear-mastery-test.mjs` C4/C5 pin both halves, mutation-verified.

⚠️⚠️ **AND `firestore.rules` v2.7.0 HAD THE SAME HOLE AS v2.8.0, UNNOTICED SINCE
ROUND 15.** It opened `lessonProgress` to `readsWholeBuilding()` staff — false for
an ordinary teacher, whose readScope defaults to `own_classes`. So the ⛑
reconstruction button has ALSO been teacher-denied this whole time, for the same
reason and unnoticed for the same reason: the only person testing it reads the
whole building. v2.10.0 adds a `teachesClass()` branch against the student's own
`classId`, plus a narrow `lastLockDay` branch on the user document.

⚠️ **THE MANUAL WORKAROUND IN THE ORIGINAL ITEM IS NO LONGER NEEDED**, but the
note about the Game Genie stays true and is worth keeping: `gg-unlock` writes
`passed: true` and does NOT clear mastery, so it still will not fix a
`'practice'` lesson.

### The original report, kept

**Jake, 2026-08-29:** *"deleted runs do not impact mastery judgement. So the poor
kids who had me test mastery are now locked out of the earliest lessons when
they're not the ones who tested out."*

⚠️⚠️⚠️ **THIS IS THE ONE COSTING CHILDREN SOMETHING RIGHT NOW, AND IT IS NOT A
MISSING CALL — IT IS TWO RECORDS THAT HAVE NEVER BEEN CONNECTED.**

Mastery does not live in `typing_sessions` or in `typing_logs`. It lives in the
student's `userProgress[lessonId]` record, written by `recordRunOutcome()` in
`learn.js`: `runScores`, `runGrades`, `runFires`, `runLocks`, `runAttempts`,
`runFailures`. `runModeFor()` reads `runScores` (via `runMastered()`) and
`runLocks` (via `lastLockDayOf()`), and nothing else.

**The delete path touches neither.** Deleting a session removes evidence and
recalculates `typing_logs` — the MINUTES. `runScores` is untouched, so the four
points Jake banked while demonstrating are still banked, `runMastered()` is still
true, `runModeFor()` still returns `'practice'`, and the child still cannot earn
anything in a lesson they never mastered. ⚠️ **`recalcDailyLog()` cannot be
extended to fix this**: it recomputes a day's totals from sessions, and mastery
is not a function of a day.

⚠️⚠️ **AND MASTERY IS NOT RECONSTRUCTIBLE FROM SESSIONS, SO “JUST RECALCULATE IT”
IS NOT AVAILABLE.** `runScores[k]` is a **cumulative sum** — the file says so
itself: *"runScores is a SUM and cannot tell one A🔥 from two A's"*. `runGrades[k]`
is best-ever-seen. Neither is a log, so neither can have one entry removed. ⚠️
And `runLocks[k]` / `lastLockDay` were stamped on the crossing and drive
reach-back **globally**, for every lesson, not just this one.

**THREE SHAPES, AND THE THIRD IS PROBABLY RIGHT:**

1. **Subtract on delete.** Needs the deleted run's grade to reverse
   `pointsForGrade()`. ⚠️ `runScores` is a sum and `runGrades` is a max, so
   subtraction cannot restore either faithfully, and un-stamping `runLocks`
   silently moves every other lesson's reach-back. **Do not build this.**
2. **Recompute from a per-run ledger.** Correct, and the ledger does not exist —
   it would be the fourth record of a quantity already stored twice. Rule 9.
3. ⭐ **A staff “clear mastery for this run / this lesson” control in reports,
   next to the delete.** Explicit, auditable, needs no reconstruction, and it is
   what Jake actually needs today: he knows exactly which children and which
   lessons. It also serves the same need after item 32's per-run delete.

⚠️ **WHATEVER SHIP, IT MUST CLEAR `runScores[k]` AND `runLocks[k]` TOGETHER AND
RE-DERIVE `lastLockDay`**, or the child is unlocked in one lesson and the
reach-back clock still says they proved something.

⚠️ **THERE IS A MANUAL WORKAROUND FOR TODAY AND JAKE SHOULD HAVE IT NOW**, before
any of this is built: the Game Genie overlay in `learn.js` has a `gg-unlock`
button that writes `{ passed: true, grade: 'B', adminOverride: true }`. **It
unlocks; it does NOT clear mastery**, so it will not fix a `'practice'` lesson.
For an affected child the field that has to change is `runScores` on their
`lessonProgress` record, edited in the Firestore console.

## 34. ⚠️ THE LESSON-LEVEL MASTERY LOCK ONLY CLOSES WHEN EVERY RUN IS MASTERED

**Jake, 2026-08-29:** *"Kids have found a workaround for the mastery lock by
reaching the end of a lesson, going back to the map, and doing it again... Perhaps
a three strikes tracking?"*

⚠️ **PARTIALLY DIAGNOSED. DO NOT BUILD FROM THIS ITEM WITHOUT WATCHING A CHILD
DO IT ONCE** — the mechanism below is consistent with the report and with the
code, and it is not confirmed.

**WHAT THE CODE SAYS.** The gate is per RUN, not per lesson. `runMastered(rec, k)`
is true when any run at index ≥ k has 4 points, so mastered runs form a PREFIX and
open runs a SUFFIX; `firstOpenRunIdx()` drops the student at the first run that
still pays. `lessonModeFor()` returns `'practice'` **only when every run in the
lesson is practice** — its own comment: *"A lesson is 'practice' only when EVERY
run in it is."*

⚠️⚠️ **SO THE LESSON-LEVEL LOCK CLOSES LAST, AND THE LAST RUNS ARE THE HARDEST.**
A child who masters the early runs and stops short of the late ones has a lesson
that is still graded, still replayable, and still paying — indefinitely. Walking
to the end and back to the map re-enters at `firstOpenRunIdx()` and collects
again. **That is not a bug in the gate; it is the gate's stated design meeting a
child who found its edge.**

⚠️ **AND `lesson-gate.js` FORBIDS THE OBVIOUS FIX, IN CAPITALS, FOR A GOOD
REASON:** *"DO NOT ADD A DISTANCE OR TIME CONDITION THAT APPLIES TO AN UNMASTERED
LESSON. It would invert the feature and punish the struggling student, who is the
one this app exists for."* **Read that before proposing anything.** A child
replaying an unmastered run is doing the thing Jake called *a GOOD thing*, and the
farming child and the struggling child look identical from inside the gate.

⭐ **WHICH IS WHY JAKE'S OWN ASK — TRACK IT, DON'T BLOCK IT — IS THE RIGHT
INSTINCT AND IS ALMOST FREE.** `recordRunOutcome()` **already writes
`runAttempts[k]` and `runFailures[k]` on every run, and has since Round 32.** The
counter for a three-strikes rule exists and is already persisted. ⚠️ **And
`reports.html` does not read either field — grep returns zero.** So the first
move is not a rule, it is a COLUMN: surface `runAttempts` in the drill-down, look
at a real week, and set the threshold from the distribution. ⚠️⚠️ **§0.-33.A IS
EXACTLY THIS MISTAKE ALREADY MADE ONCE** — a threshold picked with no data fired
on every row. **Measure first, and pair this with item 5.**

## 35. ⚠️ THE SPAM GUARD CANNOT FIRE IN A TWO-KEY LESSON

**Jake, 2026-08-29:** *"kids spamming the keyboard in the early lessons. When
it's just two keys, it's not hard to finish a lesson with an F."*

✅ **CONFIRMED, AND IT IS ARITHMETIC RATHER THAN A DEFECT.** `learn.js` has two
guards, and **both count CONSECUTIVE mistakes and both reset to zero on any
correct key** (`drillConsecutiveMistakes = 0; // reset on any correct key`):

- `DRILL_HARD_STOP_THRESHOLD = 5` — the hard-stop overlay
- `DRILL_SPAM_THRESHOLD = 10` — restarts the run

**In a two-key lesson, mashing lands on the right key about half the time.**
Reaching five consecutive wrong keys is a coin flip run of five — roughly one
attempt in thirty — and ten is one in a thousand. **The guard is not failing; it
is unreachable in exactly the lessons Jake is describing.** The threshold was set
for prose, where the alphabet is wide and a masher misses nearly every key.

⚠️ **AND THE TWIN COMMENT IS A LIE, WHICH IS ITS OWN SMALL FINDING.**
`DRILL_HARD_STOP_THRESHOLD = 5` is annotated *"(matches game.js)"*. `game.js` has
`SPAM_THRESHOLD = 3`. They have never matched. ⚠️ Fix the comment or the number
in whichever round touches this, and note that the two files are NOT twins here —
`game.js` types a book and `learn.js` types a two-key drill, and one number
cannot be right for both.

**WHAT IT ACTUALLY COSTS TODAY, WHICH IS LESS THAN IT LOOKS.** `pointsForGrade()`
gives **0 for both F and B**, and `MASTERY_POINTS` is 4. **A spammed F earns no
mastery and cannot unlock anything.** What it does earn is TIME in `typing_logs`
and an attempt on the record — a daily-goal number, not a grade. ⚠️ **Say this
to Jake before building anything**, because it changes what the fix is for: this
is minutes-farming, not mastery-farming, and item 33 is the one distorting
mastery.

**SHAPES, CHEAPEST FIRST:**

1. **Scale the threshold to the lesson's key count.** A run over an `n`-key
   alphabet should stop at far fewer consecutive misses when `n` is 2. Pure
   arithmetic, lives in `lesson-gate.js` where the rules already are, and is
   testable without a browser.
2. **Count TOTAL mistakes in the run, not consecutive ones.** Mashing produces a
   ≥50% error rate over the whole run; a struggling child produces a low rate
   with occasional streaks. ⚠️ This is the discriminator the consecutive counter
   is missing, and it is the one that does not punish the struggling student.
3. ⚠️ **Jake's *"stop tracking after 3 repeated false attempts"* — careful.**
   Suppressing minutes on a run that still files a session is item 4's divergence
   signature manufactured on purpose; §0.-21.C's ruling is that **the three
   omissions are one decision**. If a run stops paying, it must write NOTHING,
   the way `practiceRun` does.

**MEASURE FIRST, WITH ITEM 5.** A per-run error rate is already derivable from
the sessions data; look at what a real class produces on lesson 1 before choosing
a number.


---

## 36. ✅ CLOSED (Round 55) — THE DAY ROW NOW SAYS WHAT HAPPENED

✅ **SHIPPED IN `reports.html` v2.33.0 / markup v1.5.0**, with item 32, as one loop.

**What landed:** a free error-rate column on every day row; four scan-only flag
icons (repeated F, speed jump, duplicate, tiny runs); a "Scan for flags" button
that states its cost and asks before spending; and a `position: fixed` legend in
the dead right-hand margin beside the 960px container, collapsible, that **stops
floating below 1360px** so it can never sit on top of the data.

⚠️⚠️ **THE TWO ASSERTIONS THAT MATTER, AND BOTH ARE ABOUT LYING QUIETLY:**
"no answer" is never rendered as `0%` (a day with a log and no typing, or a
pre-cutover day with no split, shows a dash), and **"not scanned" never looks like
"scanned, clear"**. Both failure modes lie in the direction of *this child was
fine*, which is the direction nobody checks. `tests/day-flags-test.mjs` pins both,
mutation-verified.

⚠️ **THE SCAN'S BLIND SPOT IS ON SCREEN, NOT BURIED.** `gradeSprintsForDay()`
REFUSES rather than guesses on a drifted `runCount`, so a day it cannot grade
shows no "Repeated F" even if it had one — indistinguishable from a clean day. The
legend says so. An undisclosed false negative on a cheating check is worse than no
check.

⚠️ **THE THRESHOLDS ARE PROVISIONAL AND SAY SO IN EVERY TOOLTIP.** §0.-33.A.
The column shows the RATE precisely so Jake can watch a real week before item 35
picks a number.

### The original report, kept

**Jake, 2026-08-30:** *"I'd like a flag for days, too, so I know which days need
to be expanded... Something that tells me at a glance what the kids did without
having to expand each day to find out."* Chosen together with item 35's shape 1
(flag, don't block) and item 32 (delete a run, not a session).

⭐ **32 + 35 + 36 ARE ONE FEATURE AND SHOULD SHIP AS ONE.** Flag the day → expand
it → delete the run. Any one alone leaves the loop open: a flag with no per-run
delete tells Jake about a problem he still cannot fix, and a per-run delete with
no flag makes him hunt for the run by expanding every day.

✅ **ONE FLAG IS ALREADY FREE, AND THAT FINDING SHAPES THE WHOLE ITEM.**
A `typing_logs` document carries **`mistakes` beside `chars`** — see `daylog.js`
`readDay()`, and both split triples (`mistakesLibrary` / `mistakesSchool`) carry it
too. The report already fetches that document for every day row it draws;
`log.chars` is rendered in the row today and `log.mistakes` is sitting in the same
object, unread.

**So the day-level error rate — `mistakes / (chars + mistakes)` — costs ZERO
additional reads.** It is exactly item 35's discriminator (a masher sits at ≥50%,
a struggling child at 10–20%), computed at the level Jake wants to see it, from
data already on the screen. ⚠️ **Build this one first and alone**, because it is
the only flag in the list that is free, and shipping it proves the surface before
anything expensive is attached to it.

⚠️⚠️ **EVERY OTHER FLAG COSTS READS — SAY SO OUT LOUD BEFORE DESIGNING THE COLUMN.**
F-streaks, duplicate rollups, per-run grades and mastery state live in
`typing_sessions` and `lessonProgress`, which this page reads **only on expansion,
on click**. A day row that knew about them would have to read them for every
student and every day in the range on every Generate — the drill-down's cost
multiplied by the whole class. ⚠️ **That is the read explosion this file has spent
ten rounds avoiding, and it would arrive disguised as a convenience.**

⭐ **THE SHAPE THAT GETS THE REST WITHOUT THE EXPLOSION: A SCAN BUTTON, PAID ONCE,
ON DEMAND.** One `typing_sessions` query bounded by the report's own date range and
student set — the same query shape the drill-down and `reconstructGrades()` already
use — stamps EVERY day row at once, instead of one query per expansion. Jake pays
the reads deliberately, by pressing a button, and gets the whole grid lit up. ⚠️
**Same discipline as the stuck scan and the grades panel: cheap when asked for,
wasteful on a timer. It must never run on load.**

**FLAGS OR COLUMNS — Jake asked, and the answer is BOTH, split by cost:**

- **A COLUMN for the free one.** Error rate is present for every day, always, with
  no work — a column is honest about that. ⚠️ Show the RATE, not just an icon: the
  number is what lets Jake set item 35's threshold from real data instead of
  guessing, and §0.-33.A is that mistake already made once.
- **ICONS for the scanned ones**, appearing only after a scan, because an icon that
  is absent can mean "clean" or "not looked at" and a column cannot say "unknown"
  gracefully. ⚠️ **The unscanned state must be visibly different from the clean
  state**, or the report lies by omission.
- ⚠️ **DO NOT REUSE THE EXISTING FLAG GLYPH.** It already means "much faster than
  this student's other runs today" on sprint rows and "unusual stats" on session
  rows. A third meaning at a third level makes all three unreadable. New glyphs,
  and a legend that says what each one means.

⚠️ **ONE THING THE DAY FLAG CANNOT DO, AND MUST NOT PRETEND TO.** `mistakes` is a
day TOTAL across Library and School both. A child who read a book cleanly and then
mashed a two-key lesson shows a diluted rate; a child who did nothing but one bad
lesson shows a stark one. **The split fields are right there** — `mistakesSchool`
/ `charsSchool` — so the School-only rate is equally free and is the one that
matches item 35's concern. ⚠️ **Use the split, and label which one is on screen**,
or the column reads as an accusation of the wrong activity.

⚠️⚠️ **PRE-CUTOVER DAYS HAVE NO SPLIT.** `daylog.js`'s cutover is date-gated
(2026-08-22); a day before it carries only the flat triple. The column must show
the combined rate for those days and **say that it is combined** — silently mixing
two meanings in one column is §3.1's defect wearing a report's clothes.

⚠️ **A ZERO-CHARACTER DAY IS NOT A 0% DAY.** `mistakes / (chars + mistakes)` is
0/0 on a day with a log and no typing, and a column that renders that as a clean
green 0% is worse than a blank. Render nothing, not zero.


---

## 43. ✅ CLOSED (Round 55) — AN EMPTY PROGRESS CACHE LOCKED STUDENTS OUT OF THE CURRICULUM

✅ **FIXED IN `learn.js` v2.42.0.** Two halves, and they do different jobs:

1. **The write-side guard.** `_progressLoadedForUid` — a uid, not a boolean —
   cleared on entry to `loadUserProgress()` and set only where the map is
   genuinely populated. `refreshProgressCache()` returns early unless it matches
   the signed-in user. ⚠️ **The catch block deliberately does NOT set it**: a
   failed read means the empty map is ignorance, not fact.
2. ⭐ **Empty-is-a-MISS on the read side — THE SELF-HEAL, AND THE HALF THAT
   MATTERS TODAY.** Jake: *"He doesn't have console on his machine. As a student,
   it's removed."* So the one-line console repair below was never available to
   the person who needed it. **This half repairs every already-poisoned cache on
   the student's next page load**, with no console, no teacher action and no
   per-student intervention. Deploying v2.42.0 IS the repair.

⚠️ **COSTS ONE SUBCOLLECTION READ PER LOAD FOR A STUDENT WHO HAS GENUINELY
PASSED NOTHING** — a brand-new account, until they finish their first lesson.
That is the right trade: the alternative is being unable to distinguish "new
student" from "lost everything", which is the confusion that caused this defect.

⚠️⚠️ **`progress-cache-test.mjs` ASSERTS THE INVARIANT, NOT THE CALL SITES.**
Part B4 pins that there are exactly TWO `cacheWrite(PROGRESS_CACHE_KEY)` sites,
one of them the guarded function — a third would be an unguarded path straight
back here. Mutation-verified against all three halves of the fix.

⚠️ **`refreshProgressCache()` AT THE END OF `flushStats()` STILL RUNS WHEN `ok`
IS FALSE**, i.e. after a failed flush. The guard makes it harmless — it can now
only write a genuinely-loaded map — so this is no longer a defect, but it is
still wrong and is left noted rather than silently fixed.

⚠️ **THE OLD CONSOLE REPAIR, KEPT FOR THE RECORD ONLY.** It works from a
teacher's machine on a teacher's own poisoned cache; it was never reachable for a
student. Prefer the deploy.

### The original report, kept

**Jake, 2026-09-01:** *"A student reported that all his progress was lost — not
his time, but the lesson progression… I saw his screen — 1.1 was all he had
available to him."*

⚠️⚠️⚠️ **DIAGNOSED, NOT FIXED. THIS IS THE MOST SERIOUS OPEN ITEM IN THIS FILE
AND IT IS STILL HAPPENING.** Every phrase of the report matches the mechanism
below, including the two that look contradictory: the server record is intact and
the student is locked out.

### The mechanism

`loadUserProgress()` prefers `localStorage` over Firestore and **returns early on
a cache hit, without ever consulting the subcollection**:

```js
userProgress = {};
const cached = cacheRead(PROGRESS_CACHE_KEY, PROGRESS_CACHE_MS, currentUser.uid);
if (cached && cached.progress && typeof cached.progress === 'object') {
    userProgress = cached.progress;
    return;                      // ← Firestore is never read
}
```

`refreshProgressCache()` writes whatever `userProgress` currently holds, **with no
check that it has ever been loaded**:

```js
function refreshProgressCache() {
    if (!currentUser) return;
    cacheWrite(PROGRESS_CACHE_KEY, { uid: currentUser.uid, progress: userProgress });
}
```

⚠️⚠️ **AND `{}` IS A VALID CACHE PAYLOAD.** `typeof {} === 'object'` is true, so an
empty map is a HIT, not a miss. The one state that means *"I know nothing"* is
indistinguishable from *"I know this student has passed nothing"*.

**The race, in order:**

1. Page load reaches `loadUserProgress()`. It sets `userProgress = {}` and then
   **awaits** `getDocs(…)` — a network round trip. For the length of that await,
   the in-memory record is empty.
2. Anything that flushes during that window reaches `flushStats()` →
   `refreshProgressCache()` → **writes `{progress: {}}` with a fresh timestamp.**
   The triggers are ordinary: `visibilitychange:hidden` fires on a tab switch, a
   Chromebook lid, or Google Classroom in another tab.
3. `getDocs` resolves and writes the good copy — **but whichever write lands last
   wins**, and this load is fine either way.
4. **The next load is not.** `cacheRead` returns the empty map (uid matches, age
   under 8 hours), `loadUserProgress()` returns early, and Firestore is never
   asked.
5. `isUnlocked()` reads `userProgress[prev.id]?.passed === true` for every lesson.
   All undefined. **Only `allLessons[0]` — u1_11 — is unlocked.**
6. `PROGRESS_CACHE_MS` is **8 hours, one school day** — and every subsequent
   `flushStats()` re-stamps `at`, so the poisoning **renews itself for as long as
   the student keeps working.** It does not clear on reload, on navigation, or on
   signing out and back in.

### Why every detail of Jake's report follows from it

* ✅ **"not his time"** — time lives in `statsData` → `typing_logs`, a completely
  separate path that this cache never touches. Nothing about the minutes breaks.
* ✅ **"1.1 was all he had available"** — not *some* progress lost. `isUnlocked()`
  falls through to `idx === 0` and nothing else. An empty map cannot produce any
  other symptom, and a partial loss would look nothing like this.
* ✅ **The record on the server is INTACT** — screenshot 1 shows u1_11–u2_13
  passed and u2_14 attempted. Nothing ever deleted anything; the client stopped
  reading it.
* ✅ **The 08-31 session replays u1_11 → u1_12 → u1_13 → u1_14 in sequence**
  (9:57–10:11, screenshot 2). That is exactly what a student does when the map
  offers them lesson one: they walk forward through it again. Those replays wrote
  `passed: true` back, which is why the server copy still looks healthy.

⚠️ **THE SPACEBAR CONNECTION IS PROBABLY A COINCIDENCE AND SHOULD NOT STEER THE
FIX.** Jake flagged that this student was one of the two who reported item 31.
There is no code path between them. The only honest link is behavioural and it is
weak: item 31 fired after a 3-second pause, and a student who pauses is a student
who is being distracted — which is also what fires `visibilitychange`. Worth one
sentence, not an investigation.

### The fix, and the two halves are not the same size

1. ⭐ **A load-state guard, which is the actual fix.** A module-level flag set
   only after `loadUserProgress()` has genuinely populated (from cache or from
   Firestore), and `refreshProgressCache()` returns early unless it is set. That
   closes the write side, which is where the poison originates. ⚠️ It must be
   keyed to the uid, or a sign-out/sign-in as a different student re-opens it.
2. **Treat an empty map as a MISS on the read side.** Cheap belt-and-braces, and
   it makes any cache already poisoned in the wild self-heal on the next load
   rather than after 8 hours. ⚠️ Not sufficient alone — a student who has
   genuinely passed nothing would then re-read Firestore on every load, which is
   a read cost, not a defect, but it is worth knowing before shipping it.
3. ⚠️ **`refreshProgressCache()` at the end of `flushStats()` runs even when
   `ok` is false**, i.e. after a flush that failed. That is a separate smaller
   wrong and should be looked at in the same round.

⚠️⚠️ **THE HARNESS MUST ASSERT THE INVARIANT, NOT THE FLAG:** *the progress cache
is never written before the progress has been read.* Guarding the one call site
leaves the next one open, and there are already two call sites
(`exitLessonToMap()` and `flushStats()`).

### ⭐ WHAT TO DO FOR THE AFFECTED STUDENT TODAY, BEFORE ANY FIX SHIPS

**On his machine, in the browser console on the TypeThatBook tab:**

```js
localStorage.removeItem('ttb_lessonProgCache_v1'); location.reload();
```

That is the whole repair. The server record was never damaged, so the reload
re-reads it and his map comes back. ⚠️ **It will recur** until the guard ships —
the same race can poison the cache again the same afternoon.

⚠️ **It is worth asking the class whether anyone else is seeing lesson one only.**
The window is small but the trigger is an everyday tab switch, and a student who
believes they have been reset to the beginning is unlikely to volunteer it as a
BUG — they are more likely to just start typing lesson one again, which is what
the 08-31 record shows this student doing.

---

## 37. ✅ CLOSED (Round 55) — THE STAFF PAGES NOW USE A DESIGN SYSTEM

✅ **`reports.html` v2.35.0 / markup v1.7.0, `admin.html` v1.2.0.** Both pages
load Courier Prime and declare a `:root` token block: surfaces, six ink levels,
`--accent`, and the three severities.

⚠️⚠️ **THE DARK THEME STAYS AND THAT IS THE POINT.** A teacher scanning a dense
table and a child reading one sentence of a book are different jobs. What was
wrong was never the theme — it was that the staff pages had NO system, so every
value was picked at the point of use. The tokens are **role-named, not copied
from `style.css`**, exactly as this item required. The one shared value is
`--accent` (#4B9CD3), the product's identity colour, and
`staff-tokens-test.mjs` B3 pins it against `--carolina-blue`.

⚠️ **admin.html GOT THE FONT, THE TOKENS AND THE FOCUS RULES BUT NOT THE COLOUR
RETIREMENT** — see item 42. Its 276 inline `style=` attributes win on
specificity, so rewriting its style block would change nothing on screen. The
tokens are declared there so item 42's extraction has somewhere to land.

### The original report, kept

**Jake, 2026-09-01:** *"It and admin look so much rougher than the student facing
side."* Measured rather than judged, and the measurement gives the answer.

**`style.css` has a `:root` token block and loads Courier Prime. `reports.html`
and `admin.html` load NEITHER.** They are self-contained dark pages in plain
`'Courier New'`. That is not a styling gap, it is two different products — and it
is the single largest cause of the difference Jake is describing.

**The work:** a `:root` block in each staff page mapping their colours onto 8–10
named tokens (`--ink`, `--ink-dim`, `--rule`, `--accent`, `--warn`, `--bad`,
`--good`, `--surface`), plus the Courier Prime `<link>`. Mostly find-and-replace;
no behaviour changes.

⚠️⚠️ **DO NOT REDEFINE THE STUDENT-SIDE VALUES, ADOPT THEM WHERE THEY FIT AND LEAVE
THE REST ALONE.** `style.css`'s values were chosen for reading a book —
`--ink-spent` is deliberately tuned so typed text stops competing with what comes
next, and that reasoning is written at the token. A table being scanned by a
teacher wants different contrast from a sentence being read by a child.
**A token that means two different things on two surfaces is how the sprawl in
item 38 started.** Where the staff need differs, name a new token; never repoint
an existing one.

⭐ **DO THIS FIRST WHATEVER ELSE IS CHOSEN.** 38, 39, 40 and 41 are all cheaper
once the tokens exist, and 38 is barely expressible without them.

---

## 38. ✅ CLOSED for reports.html (Round 55) — THREE SEVERITIES, ONE MEANING EACH

⚠️ **JAKE'S STANDING RULING OF 2026-09-02 APPLIES TO admin AND IS RECORDED IN
FULL IN ITEM 42:** *"right now it looks bad. Consistency would help a lot, so
cleaning it up in any way would be a step in the right direction."* **Do not open
a round on admin's appearance by asking him to adjudicate individual values.**
⚠️ For COLOUR specifically the route is still through the three severities below,
not a blind merge — this page's amber means three different things, and
collapsing two ambers can merge two meanings. The ruling removes the need to ask
permission; it does not remove the need to settle what a colour MEANS first.

✅ **`reports.html` is done.** Every warning-ish value now resolves to
`--notice` (look at this), `--warn` (probably wrong) or `--bad` (wrong, or a
destructive control). Grade pips are a **separate** scale on purpose: a C is not
a warning and must not be coloured like one.

✅ **Round 55's own additions were retired**, as this item demanded — `#d9a441`
and `#8a7860` came in with the item 36 work and are gone.

⚠️⚠️ **`staff-tokens-test.mjs` PART C COVERS THE STYLE BLOCK AND THE JS HALF
BOTH.** Most of this page's markup is built in template strings, so an inline
`style="color:#ff3333"` is exactly as unsystematic as a rule and harder to find.
Zero raw hex outside `:root` in either half. Mutation-verified.

⚠️ **STILL OPEN FOR admin.html**, and it is blocked on item 42 rather than on
effort. Its amber still means three things; untangling that is part of the
inline-style extraction, not a separate pass over the same lines.

⚠️ **A NEAR-MISS WORTH KEEPING.** The colour sweep's regex matched the digits
inside `&#8635;` — an HTML entity for the recalculate glyph — and would have
rewritten it into a CSS variable. Caught by inspecting the inventory before
running the replacement. Part C3 now asserts that entity survives.

### The original report, kept

**Counted, not estimated:** `reports.html` has **33 distinct hex colours in 323
style lines**; `admin.html` has **51 in 164**. Five near-identical greys
(`#888 #aaa #666 #555 #444`) do overlapping jobs, and there are four unrelated
warning tones (`#ff3333 #ff9800 #ffaa00 #ff5555`) with no rule about which means
what.

⚠️⚠️ **THIS IS A CORRECTNESS ITEM WEARING A POLISH ITEM'S CLOTHES, AND IT SHOULD
NOT BE SORTED WITH THE COSMETIC ONES.** Amber currently means *"watch this error
rate"* on a day row, *"suspicious"* on a sprint row, and something else again in
admin. **A teacher cannot learn what a colour means if it means three things**,
and the entire value of item 36's at-a-glance surface rests on a mark meaning one
thing reliably.

**The work:** three severities — notice / warn / bad — one token each, applied
consistently, with the legend naming them.

⚠️ **ROUND 55 MADE THIS WORSE AND THE ROUND SHOULD OWN IT.** The item 36 work
introduced `#d9a441` and `#8a7860` without checking what was already in the file.
Two more colours in the pile, added by the round that was improving legibility.

---

## 39. ⚠️ 64 alert() AND confirm() CALLS ARE THE LOUDEST “UNFINISHED” SIGNAL IN THE APP

**Counted: 22 in `reports.html`, 42 in `admin.js`.**

Browser dialogs cannot be styled, cannot show structure, and read as scaffolding
to anyone who has used software built after 1998. They are also why item 32's and
item 33's confirmations are walls of unformatted text — the destructive
confirmations that most need structure are the ones least able to have it.

**The work:** a small inline status banner for information, a modal for
destructive confirmation. One pattern covers all 64.

⚠️ **BIGGER THAN 37, 38 AND 40 PUT TOGETHER, AND IT IS ITS OWN ROUND.** Every
one of those 64 sites is a behavioural change with an early return in it —
`if (!confirm(…)) return;` is synchronous and a modal is not. **A half-converted
page is worse than an unconverted one**: a destructive action whose confirmation
became non-blocking will fire without waiting for the answer. Convert whole pages,
never a call at a time.

---

## 40. ✅ CLOSED (Round 55) — THE STAFF PAGES ARE KEYBOARD-USABLE

✅ **`for=` on all six `reports.html` labels** (there were zero) and on eleven in
`admin.html` — ⚠️ **only where the pairing was unambiguous**. A `for=` pointing
at the wrong control is worse than none: it moves focus somewhere unexpected and
reads the wrong name aloud. The rest wait for item 42, when that markup is being
handled anyway.

✅ **`:focus-visible` rings on both pages**, as an `outline` with an offset — not
a border, which participates in layout and would shift the row it lands in.

⭐ **AND THE PART THAT WAS NOT IN THE ORIGINAL ITEM.** The uid chip and the
day-row expander are interactive `<span>`s: a focus ring alone would have led a
keyboard user to a control that then ignored them, which is worse than no ring
because it promises something the page does not deliver. Both now carry
`role="button"` **and** `tabindex="0"` — either alone is worse than neither — and
a `keydown` handler maps Enter and Space onto the existing click path, with
Space `preventDefault()`ed so it does not scroll the teacher away from the row.

### The original report, kept

Nearly free, and the least defensible of the six to leave undone.

* **`reports.html` has SIX `<label>` elements and ZERO `for=` attributes.**
  Clicking a label does not focus its input. `admin.html` has one `for=` in the
  whole file.
* **Two `:focus` rules in `reports.html`, one in `admin.html`** (`style.css` has
  six). A keyboard user cannot see where they are.

⚠️ **ON A TYPING APP.** The staff pages are the least keyboard-usable surface in
a product whose entire purpose is teaching children to use a keyboard without a
mouse. That is worth fixing on its own terms and not only for the teachers.

**The work:** `for=`/`id=` pairs on every label, and a visible focus ring on every
interactive element. No layout changes.

---

## 41. ✅ CLOSED (Round 55) — THE SLOW CONTROLS NOW LOOK BUSY

✅ **`reports.html` v2.36.0.** One `withBusy()` helper — disable, busy label,
`aria-busy`, restore in a `finally` — around Generate, ⛑ regrade, ⟳ recalculate
and ⊘ clear-mastery. ⚠️ **It was FOUR controls, not the three this item
counted**; the ⟳ recalculate was missed when the item was written.

⭐ **AND ONE OF THEM WAS ACTUALLY BROKEN, WHICH THIS ITEM DID NOT KNOW.**
`recalc-btn` set `disabled = true`, awaited, then set it false on the next line
— with nothing catching a throw. **Any failure inside `recalcDailyLog()` left
that button dead until the teacher reloaded**, on a row giving no hint that
reloading was the cure. That was a real defect filed as a polish item, and it is
why `busy-state-test.mjs` Part C is its own section.

⚠️ **THE DISABLE IS THE CORRECTNESS HALF.** Three of the four WRITE. A second
⛑ while the first is still resolving reconstructs the same day twice. The label
is what stops a disabled button reading as a broken one; they ship together.

⚠️ **`scanForFlags()` IS DELIBERATELY NOT CONVERTED** and Part D asserts so, to
stop a later round "finishing the job". It reports incremental progress from
inside a loop — *"42 of 60 students, 380 records read"* — which a wrap-the-call
helper cannot express. Folding it in would trade real progress for a spinner.

⚠️⚠️ **A HARNESS WAS CORRECTED, NOT WEAKENED, TO LAND THIS.**
`recalc-guard-test.mjs` A5 matched the literal string
`await recalcDailyLog(idx, li, uid, date);` and went red against a change that
did not touch its meaning — the call became a `() =>` arrow inside `withBusy()`,
same four arguments, same absent options object, same default drop guard. **A
test that pins the SHAPE of a line rather than the PROPERTY it protects fails on
refactors and passes on regressions.** A5 now asserts the property (no fifth
argument, because a fifth argument is the options object that would silently
remove the guard) and was re-verified to still catch that regression.

### The original report, kept

`reports.html` has **two** loading indicators in 3,730 lines. **Generate**, the
**⛑** regrade and **⊘** clear-mastery can all run for seconds against the network
with nothing moving on screen. Only **Scan for flags** reports progress, because
item 36 added it.

**The consequence is not aesthetic:** a teacher who thinks a button did nothing
clicks it again, and two of those three write to Firestore.

**The work:** a shared disabled-plus-status pattern, reusing what the scan button
already does.

---

## 42. ⚠️ admin.js STILL CARRIES 183 (Round 56 CLOSED THE admin.html HALF) — AND THE THREE THINGS THIS ITEM GOT WRONG

✅ **`admin.html` v1.3.0 — 834 of its 866 inline declarations moved off 276
elements into a utility block; 32 remain, each for a reason pinned by
`tests/inline-styles-test.mjs` Part C.** Structure, attributes and text are
unchanged — only `class`, `style` and the `<style>` block differ, verified
element-by-element against the pre-extraction file before shipping.

⚠⚠ **STILL OPEN FOR `admin.js`, WHICH IS THE OTHER HALF AND WAS NEVER COUNTED.**
It carries **183 more attributes / 539 declarations / 60 distinct hex colours**,
building the same page out of template strings. `node tools/audit-inline-styles.mjs`
prints all of it. **Item 38 for admin is NOT unblocked until that half is done**,
because most of this page's colour lives there, not in the markup.

### ⚠⚠ THE THREE THINGS THIS ITEM ASSERTED THAT TURNED OUT TO BE FALSE

It called the work *"mechanical, tedious, low-risk, and entirely mechanical to
verify — rendering should be byte-identical."* **Verify a flag before you build
for it** applies to an item's METHOD as much as to its premise.

**1. The count was admin.html only.** 276 was right for the markup and missed
`admin.js` entirely. The real figure is **459 attributes / 1,405 declarations**.

**2. "Byte-identical rendering" is false, and 32 declarations prove it.** An
inline value beats every selector, so **34 declarations have been suppressing
`:hover` and `:disabled` rules all along**. Extracting them REVIVES those states —
a visible change, and Jake's call rather than a refactor's. They stayed inline.

⭐⭐ ~~**AND ONE OF THOSE SUPPRESSIONS IS A DEFECT, NOT A PREFERENCE.**~~
✅ **ALREADY FIXED BY ROUND 56 ITSELF, AND THIS ITEM DID NOT KNOW.** Checked in
Round 57 before acting on it. The four buttons no longer carry an inline
background at all — Round 56 moved them to `btn-tint` classes and, crucially,
wrote them as `button.btn-tint-save:not(:disabled)` rather than plain
`.btn-tint-save`. That `:not(:disabled)` is what makes `button:disabled` win when
the button IS disabled, and admin.html carries a comment beside it warning
against "simplifying" it back. **`auditBtn.disabled = true` (line 5083) and
`saveTitleBtn.disabled = true` (4201) now both grey out correctly.**

⚠️ **THE ITEM WAS DESCRIBING THE STATE BEFORE THE ROUND THAT WROTE IT.** The fix
shipped in the same round as the warning, and nobody updated the warning — so a
later round would have "fixed" a defect that no longer existed, by deleting
inline backgrounds that are no longer there. **An item that lies about status is
worse than none**, which is §0.-22's lesson about the index, one document over.

⚠️ **ONE RESIDUE, AND THE STANDING RULING BELOW COVERS IT — DO NOT ASK.**
`saveTitleBtn.style.opacity = '0.6'` (4202) is still there. It was the workaround
someone reached for when the disabled rule was dead. It is now redundant — the
button greys out on its own — and **`auditBtn` has no equivalent**, so the two
slow controls do not look the same while they work. That is precisely the
"slightly different" mismatch, so **make them match: either both dip or neither
does.** Simplest is to delete the opacity lines and let `button:disabled` do the
work on both. ⚠️ Originally written here as "ask; do not pick" — see the standing
ruling below for why that was the wrong instinct.

**3. "Low-risk" was wrong in a way that would have broken two features.**
`#tab-staff` and `#build-list` both carry inline `display:none` and are shown
again with `element.style.display = ''`. That clears the INLINE value and falls
through to the stylesheet — so moving `display:none` into a class means `''`
resolves to the CLASS, and **the Staff tab never appears for building admins
again, and the build panel never opens.** Silent, role-dependent, and exactly the
"a button that does nothing" failure Round 55's header warns about. The general
rule, now enforced: **a property must not be extracted from an element whose
`.style.<property>` is assigned at runtime.**

### ⭐ ROUND 57's SURVEY OF THE admin.js HALF — READ THIS BEFORE STARTING

⚠️⚠️ **THE "183 attributes / 539 declarations" HEADLINE IS TRUE AND IS NOT THE
SHAPE OF THE WORK.** Measured properly rather than estimated:

| | count | what it means |
|---|---|---|
| `style=` attributes | 183 | |
| …**computed** (contain `${`) | **2** | lines 3656, 3818 — can never be a static class |
| …static | 181 | |
| static declarations | **492** | the real work |
| `.style.cssText =` elements | 3 | `createElement`, no `style=` attribute — **out of scope entirely** |

⚠️⚠️ **AND THE BLOCKING RULE IS MUCH NARROWER THAN "DO NOT EXTRACT A PROPERTY
THAT IS ASSIGNED AT RUNTIME."** Applied file-wide, that rule blocks 203 of the
492 — including all 123 `color` declarations, which is most of what item 38
needs. But it is the wrong rule. **Setting `.style.color = '#f00'` at runtime is
harmless**: an inline value still beats a class, so extraction changes nothing.
**The hazard is assignment of `''`**, which clears the inline value and falls
through to whatever the stylesheet says — that is precisely how Round 56's
`display:none` trap worked.

**There are exactly THREE such resets in the whole file:**

```
 666  list.style.display   = ''      ← the build panel
3857  row.style.background = ''      ← .seg-row, clearing search highlights
3859  textEl.style.color   = ''      ← .seg-text, same loop
```

**So the true blocked set is: `display` on the build-panel list, `background` on
`.seg-row`, and `color` on `.seg-text`.** Everything else is extractable. ⚠️ **Do
not widen this back to the file-wide rule out of caution** — it would leave 203
declarations inline for no reason and keep item 38 blocked. ⚠️ **And do not
narrow it either**: re-run the reset grep before extracting, because a new `= ''`
anywhere adds a fourth.

```
grep -noP "\w+\.style\.\w+\s*=\s*[^;]{0,40}" admin.js | grep -E "=\s*(''|\"\")"
```

⚠️ **THE TRANSFORMER ROUND 56 BUILT DOES NOT APPLY UNCHANGED.** It parsed real
HTML. These are template strings, so there is no parser — adding a class means
finding or creating a `class="…"` on a tag that exists only as text, sometimes
with interpolation inside it. **That is the actual difficulty of this half, and
it is why it is a round of its own rather than a ride-along.**

### ⭐⭐ STANDING RULING FROM JAKE, 2026-09-02 — NORMALISE. DO NOT ASK.

I wrote, in the paragraph this replaces, that the twelve-value font-size ladder
was "a decision for Jake, not a refactor's" and that a round should extract at
exact values and report. **Jake overruled that immediately, and he was right:**

> *"The whole point of the admin redesign is that it doesn't look as good as the
> rest. I don't need to judge whether .7 is better than .72 on a step by step
> basis — right now it looks **bad**. Consistency would help a lot, so cleaning
> it up in any way would be a step in the right direction."*

⚠️⚠️ **SO THE CAUTION WAS THE MISTAKE, NOT THE CHANGE.** admin.js carries **twelve
distinct font sizes** — `0.7em 0.72em 0.75em 0.8em 0.85em .85em 0.9em .9em
0.95em .95em 1em 1.1em` — several differing by 0.02em, two pairs differing only
in whether the leading zero is written. **That IS the bad look.** Preserving it
byte-for-byte preserves the defect. **Collapse it to a small scale and keep
going. Do not open a round by asking which values to keep.**

⚠️ **WHY I GOT THIS WRONG, SO THE NEXT ROUND DOES NOT.** Jake's design pet peeve
is that "slightly off" reads worse than an obvious difference — and I read that
as *"every size change needs his sign-off"*. It means the opposite here. The
peeve is the REASON to normalise, not a reason to preserve twelve near-identical
values. **A preference about what looks bad is not a request to be consulted
about every instance of it.**

⚠️ **THE STANDING PERMISSION AND ITS EDGE.** This covers dimension-like values —
font sizes, spacing, radii, border widths — where a value carries no meaning
beyond its size, so merging two of them loses nothing. ⚠️ **IT DOES NOT
AUTOMATICALLY EXTEND TO COLOUR**, and the reason is item 38's own finding: on
this page **amber means three different things**, so collapsing two ambers can
merge two meanings and destroy information the page is carrying. Normalise
colour through item 38's severities, which exist to settle what the colours MEAN
first. **Sizes: just fix them. Colours: fix them via 38.**

⚠️ **AND STILL EXTRACT FIRST.** The classes must exist before the values can be
normalised in one place — that is the whole reason 42 blocks 38. Extract to
`u-` classes, then collapse the class list, rather than hand-editing 41
`font-size` declarations in template strings.

### What shipped, and the two things that will rot

* **202 utility classes, VALUE-named (`u-color-888`), not role-named.** A role
  name asserts a meaning, and item 38's whole finding is that this page's colours
  do not yet HAVE settled meanings — amber means three things. Naming by role now
  would invent the answer to the question item 38 exists to ask.
* ⚠⚠ **THE UTILITY BLOCK MUST STAY LAST.** The classes are single-class
  selectors, so against `.lbtn`, `.l-field`, `.col` and `.l-label` they tie on
  specificity and win on **source order alone**. 69 declarations depend on it. A
  rule added below the block does not error and does not look broken — those 69
  just quietly revert to what they were written to override. Part D pins it.
* ⭐ **84 of the 202 classes are used exactly once, and that count is the metric
  for item 38.** The tail is mostly one-off colour; it should fall hard when the
  three severities land and barely move otherwise.

### The original item, kept


**276 inline `style=` attributes** in `admin.html`, against 33 in `reports.html`.

⚠️⚠️ **THIS IS WHY admin.html RESISTS EVERY OTHER ITEM ON THIS LIST.** There is no
stylesheet to edit, so any visual change means hunting through markup, and
`admin.js` builds much of the markup as strings — so the styles are in the
JavaScript too. **Items 37–41 cannot land properly on admin until this is done.**

**The work:** extract to classes in the page's `<style>` block. Mechanical,
tedious, low-risk, and entirely mechanical to verify — rendering should be
byte-identical.

⚠️ **SEQUENCE THIS BEFORE 39 FOR admin**, not after: converting 42 `confirm()`
calls in a file whose markup is still inline means touching the same lines twice.

---

### ⭐ SUGGESTED ORDER FOR 37–42

**37 + 38 + 40 in one round.** All mechanical, all low-risk, all testable without
a browser, and together they close most of the visible gap. Jake asked for exactly
these three.

**42 next** — it unblocks admin for everything else.

**39 last, on its own** — it is the only one of the six that changes behaviour.

**41 can ride along with any of them.**

⚠️ **NONE OF THESE COME BEFORE ITEM 43.** A student is locked out of the
curriculum today.

---

## 45. ⚠️ BOOKS ARE GLOBAL, SO “FILTER BY BUILDING” IS TWO FEATURES WEARING ONE NAME

✅ **ANSWERED BY JAKE, 2026-09-02, AND THE ANSWER CHANGES THE ITEM.** Asked
whether this was a staff convenience filter or a real permission boundary, he
said neither: *"The goal is to keep kids from seeing books that local teachers
may not want. Maybe they think that Dracula shouldn't be in the hands of 6th
graders — teachers can see it, but the students can't. If that can be done
without Firestore, then please do."*

⚠️⚠️ **SO IT IS A THIRD THING, AND THE CHEAPEST OF THE THREE.** Not staff-facing
at all: the audience is STUDENTS, and the surface is `index.html`, not
`admin.js`. Staff keep seeing everything — there is no admin-side hiding to
build, and no rules work, because nothing is being kept from a privileged user.
That is why it can skip Firestore entirely, and Jake explicitly asked that it
should.

⚠️ **IT IS CURATION, NOT A LOCK, AND JAKE HAS BEEN TOLD SO.** A book hidden from
the library grid is still reachable by anyone holding its URL — `game.html`
takes a book id and the rules allow any signed-in student to read any book.
Told 2026-09-02; he is content with that for the stated purpose. **Do not let a
later round quietly upgrade this into a security claim** — if it ever needs to
be a real boundary, that is rules work and a different item.

⚠️ **THE THREE ⚠️ NOTES BELOW STILL STAND AND ARE THE REASON THIS IS NOT A
ONE-LINER.** In particular there is still no field to filter ON, and item 46 is
still the same step. What changes is the SHAPE of the field: a per-building
"hidden from students" list needs a building identity on the book or on the
setting, and the existing `_staffScope.schoolIds` is the only building identity
in the codebase. Design the field for the visibility question, not for the
filter question that was asked first.

**Jake's original phrasing, 2026-09-01, kept because it is what generated the
wrong reading:** *"a way for building admins to filter books for their building
and for teachers to filter it even further."*

⚠⚠ ~~**THE FIRST THING TO SETTLE IS WHETHER THIS IS A FILTER OR A BOUNDARY**~~ —
settled above. Kept because the reasoning is still worth reading: the phrasing
sounded like staff convenience, it was actually about students, and **neither of
the two features this item was written to distinguish turned out to be the one
Jake wanted.** A question with two options offered can still have a third
answer. The original text follows.

A filter is a
convenience for staff looking at a long list. A boundary is *this building's
admin cannot see or edit that building's books* — which is `firestore.rules`
work, not UI work, and the rules have already caught three rounds out (items
0.-7.A, 22, 21). **Ask before building.** The phrasing — admins filter, teachers
filter *further* — sounds like convenience, and convenience is the version that
ships in a round.

⚠️ **AND TODAY THERE IS NOTHING TO FILTER ON.** A `books/{id}` document carries
no school, building or owner field of any kind; `_staffScope.schoolIds` exists on
the STAFF side (`admin.js:715`) and has no counterpart on a book. So step one is a
field, and **item 46 is the same step** — do them together or the second one
rewrites the first.

⚠️ **“TEACHERS FILTER FURTHER” IS PROBABLY NOT A FILTER AT ALL.** A teacher
narrowing a list for their own convenience is a dropdown. A teacher choosing which
books *their class can see* is curation, it reaches `index.html`, and it changes
what a child is offered — a different feature with a different blast radius.
**Find out which one is meant before writing either.**

⚠⚠ **AND ASK WHAT STUDENTS SEE.** `index.html:1085` builds the library's genre
pills from `allBooks`, so students currently see everything. If a building filter
is staff-only, a child in Building B is still offered Building A's books and the
feature will look broken to the person who asked for it.

---

## 46. ✅ CLOSED (Round 56) — WHO UPLOADED THIS BOOK, STAMPED AND NOT TYPEABLE

✅ **`admin.js` v3.38.0.** Stamped from `_staffScope.uid` on CREATE only, rendered
read-only next to Prepared by. `uploadedAt` goes with it.

* ⚠️ **`alreadyExists` is the gate, and it costs NO Firestore read** — it is
  already computed from `bookTitlesMap` for the overwrite confirm. Do not "harden"
  this into a `getDoc()`; see §READS.
* ⚠️ **An overwrite does not restamp.** Otherwise the field answers "who touched
  it last", which is a different question. Save Metadata never writes it at all.
* ⚠️ **The uid is stored, not a name or email** — both go stale the day someone
  changes theirs. `staff/{uid}` resolves at display time, cached for the session,
  and only for a book that HAS a stamp.
* ⚠⚠ **A book with no stamp reads "— (added before this was recorded)" and is
  NEVER guessed as Jake.** He is almost certainly right that everything so far is
  his, but a guessed provenance stamp is indistinguishable from a recorded one
  afterwards, and this field's entire value is that it can be trusted. Backfill on
  an explicit instruction only.
* ⚠️ An unreadable `staff/{uid}` falls back to showing the uid rather than
  erroring — a building admin opening another building's book becomes the ordinary
  case the moment **item 45** lands, and a uid is still a traceable answer.

⭐ **Item 45 now has the book-level owner field it needed**, though it still needs
a school/building field of its own.

### The original item, kept


**Jake, 2026-09-01:** *"a new field for who uploaded the book — Me for everything
so far, but now that there's another building admin, I assume he could upload his
own (and he may not be as strict as I am)."*

⚠⚠ **THE STATED PURPOSE IS PROVENANCE UNDER DOUBT, WHICH MEANS THE FIELD MUST
NOT BE TYPEABLE.** "He may not be as strict as I am" is the whole requirement:
this exists so that when a book turns out to be wrongly licensed or badly cleaned,
the record says who added it. A hand-typed field records who *remembered* to type
it. **Stamp it from `auth.currentUser` at create time, render it read-only.**
Compare item 44: that field is hand-typed and that is exactly why it holds
`alice1_in wonderland`.

⚠️ **STAMP AT CREATE, NEVER ON SAVE.** A book Jake uploaded and a colleague later
edited must still read as Jake's upload, or the field answers the wrong question
the first time it is used.

⚠️ **EXISTING BOOKS HAVE NO VALUE AND MUST NOT BE BACKFILLED TO JAKE BY GUESS.**
He said "me for everything so far" and he is almost certainly right — but a
guessed provenance stamp is indistinguishable from a recorded one afterwards, and
this field exists precisely to be trusted. **Backfill from an explicit instruction
or leave it blank and render blank as "— (before this field existed)".**

✅ Staff identity, not student data — no §PRIVACY concern. Store the uid and
resolve to a name for display, the way `staff/{uid}` is already read at
`admin.js:756`; an email or a display name stored on the book goes stale the day
someone changes theirs.

**Size:** small on its own, and it wants doing **in the same round as item 45**,
which needs a book-level owner field anyway.

---

## 47. ⭐ A GEMINI LICENCE CHECK, AND THE RIGHTS LADDER IT WOULD NEED LIFTED OUT OF admin.js FIRST

**Jake, 2026-09-01:** *"some sort of gemini based check for books to triple check
to make sure that they're cc0 or public domain or otherwise able for us to use …
I'd want to do that test without using your tokens."*

✅ **THE INFRASTRUCTURE EXISTS, AND HERE IS EXACTLY WHAT IT IS** (checked, because
Jake asked and a half-remembered ladder is worth confirming). `functions/index.js`
holds **one** callable, `exports.generatePractice`, backed by a **six-model** chain:
`gemini-3-flash-preview` primary, then `gemini-flash-latest`,
`gemini-3.1-flash-lite-preview`, `gemini-2.5-flash`, `gemini-flash-lite-latest`,
`gemini-2.5-flash-lite`. Running the licence check server-side is exactly right: it
bills to the project, not to a chat session, and it can run on upload rather than
on somebody remembering.

⚠️ **BUT IT IS AI PRACTICE ONLY — LESSONS DO NOT USE GEMINI AT ALL.** `game.js` is
the only caller; `learn.js` has zero references. (`variety-floor.js` and
`adventure-renderer.js` mention it only in comments.) Worth knowing before anyone
plans around a lesson-generation path that does not exist.

⚠⚠ **AND DO NOT REUSE `generatePractice` — REUSE THE MODEL LADDER.** That callable
is student-facing and quota'd at `DAILY_LIMIT = 5` per uid per day. Running admin
licence checks through it would spend a child's practice allowance on staff work,
and its prompt and response shape are built for practice text. **A licence check
wants its own admin-gated callable that shares the fallback chain.**

⚠⚠ **THE MODEL MUST NEVER BE THE AUTHORITY, ONLY THE ALARM.** A licence
determination is a legal claim about someone else's work, and this is a school
putting books in front of children. `canonicalRightsFrom()`'s existing failure mode
is already the correct one and its header says so: *"left verbatim for a human",
never "asserted a license the book does not carry"*. **The check may FLAG and it
may DISAGREE; it must not APPROVE.** A book it likes is a book a human has not
looked at yet. ⚠️ Design the output as "this disagrees with the ladder, here is
why" — not a confidence score, which invites a threshold, which becomes an
auto-approve.

⭐ **THE MOST USEFUL VERSION IS THE CHEAPEST: DISAGREEMENT DETECTION.**
`canonicalRightsFrom()` already returns a canonical value or `''`. Send the model
the book's `dc:rights` / `dc:source` / front matter and ask what IT concludes, then
compare. **Agreement is silence; disagreement, or a ladder `''` the model has an
opinion about, is the flag.** That needs no new judgement from the model — only a
second opinion on a decision already being made — and it is the one shape that
cannot silently widen what gets accepted.

### ⭐ Jake's question: should the ladder move to its own file? — YES, BUT NOT FOR THE REASON GIVEN

*"We already have the ladder of checks somewhere in the code (should it be put in
a separate file, now that it's used in a couple of places?)"*

⚠️ **CHECKED, AND IT IS NOT YET USED IN A COUPLE OF PLACES.** `SOURCE_PATTERNS`,
`canonicalSourceFrom()` and `canonicalRightsFrom()` live only in `admin.js`
(~1468–1560). The only other consumer is `tests/metadata-map-test.mjs`, and it does
not import them — **it lifts them out of the file as text**, which its own header
records. So today's duplication is not the argument.

**The argument is the Cloud Function.** `admin.js` is a browser ES module wired to
the Firebase client SDK and the DOM; a Cloud Function cannot import it at any
price. So item 47 either gets a **second copy of the licence ladder** — two legal
mappers drifting apart, which is worse than none — or the ladder moves first.
⚠️ **EXTRACT IT AS STEP ONE OF THIS ITEM, NOT AS A TIDY-UP.**

✅ **DONE, Round 57 (Bar-Lock)** — `rights-ladder.js` v1.0.0, `admin.js` v3.40.0,
`metadata-map-test.mjs` v1.6.0. Extracted verbatim; bodies unchanged, the four
declarations gained `export` and nothing else. 518 → 532 assertions, still green.

⚠️⚠️ **BUT THE REASON WRITTEN ABOVE IS WRONG, AND WHOEVER DOES STEP TWO MUST READ
THIS.** The paragraph implies the extraction lets the Cloud Function **import**
the ladder. **It does not, and it cannot.** `firebase deploy --only functions`
packages the `functions/` directory and **nothing above it**, so a root-level
module is never uploaded — checked against `firebase.json` and
`functions/index.js` before building anything. The functions-side ladder will be
a **COPY** no matter what.

⚠️ **THE PRECEDENT IS ALREADY IN THE REPO AND IT IS THE UNGUARDED KIND.**
`MIN_PROBLEM_CHARS = 3` is written by hand in **both** `variety-floor.js` and
`functions/index.js`, and **nothing asserts they agree**. That one is a number.
Two licence mappers disagreeing about what a school may put in front of a child
is a different order of problem.

✅ **SO THE EXTRACTION WAS STILL RIGHT, FOR TWO REASONS THAT SURVIVE THE
CORRECTION:**
1. `metadata-map-test.mjs` **stopped lifting the ladder out of `admin.js` as
   text** through `new Function(...)`. That lift tested a re-evaluated COPY rather
   than the shipped code, and its slicer was already known-broken for `async`
   functions. The harness now imports what admin.js runs.
2. The ladder has **one canonical home**, so step two's copy can be *checked
   against it* rather than hand-maintained beside it.

⚠️ **WHAT STEP TWO MUST DO, CONCRETELY:** copy the ladder body into `functions/`
and add a harness asserting the two are **byte-identical** (comments stripped),
so a fix to one that misses the other goes red. `metadata-map-test.mjs` **Part F**
already guards the precondition — the module imports nothing and touches no DOM,
which is the only reason an honest copy is possible at all. ⚠️ **Do not delete
Part F to make a future edit convenient.**

✅ And it pays for itself immediately: `metadata-map-test.mjs` stops lifting text
and starts importing, which removes a whole class of harness fragility. The
project already has five shared modules (`hud.js`, `celebrate.js`,
`variety-floor.js`, `session-log.js`, `daylog.js`) and `version-stamp-test.mjs`
§D2 already watches every shared module the writers import — so a `rights-ladder.js`
lands in an established pattern with its guard already written.

⚠️ **THE LADDER'S ORDER IS LOAD-BEARING AND MUST SURVIVE THE MOVE.** Standard
Ebooks before Gutenberg (an SE book cites Gutenberg upstream and matches both), the
already-canonical short-circuit before the heuristics, and CC BY before anything
that could flatten it into "public domain". `metadata-map-test.mjs` covers all
three against the real `dc:` values of the library — ⚠️ **it is currently RED on 39
stale source/rights fixtures**, so **get it green BEFORE the move**, or it cannot
tell you whether the move broke anything.


---

## 44. ✅ THE BOOK ID FIELD ACCEPTS ANYTHING TYPED INTO IT, AND slugifyBookId() IS RIGHT THERE

**Reported by Jake, 2026-09-01**, from a sibling instance's diagnosis: the
Wonderland book's id is `alice1_in wonderland` — a space in the middle of a
Firestore document id.

✅ **THERE IS NO ACTIVE BUG, AND THE CHECKING IS RECORDED HERE SO NOBODY
RE-INVESTIGATES IT.** Three things were verified, not assumed:

* **Every URL that carries a book id encodes it.** `game.js:6368`,
  `index.html:1421` and `:1577`, `game.js:5328` and `:5592` all wrap the id in
  `encodeURIComponent`, so the space travels as `%20`.
* **The one composite storage key is delimiter-safe.** `chapterCacheKey()`
  (`game.js:2371`) is `ttb_ch_v1:${bookId}:${chapterId}` — colon-delimited, and a
  space cannot collide with a colon.
* **No filename is affected.** The EPUB on disk is
  `lewis-carroll_alices-adventures-in-wonderland_john-tenniel.epub` and is clean.
  **The space is in the Firestore document id only.**

⚠⚠ **DO NOT "FIX" THE EXISTING BOOK.** A Firestore document id is immutable:
renaming means create-new, copy, delete-old — and every `books/{id}` subcollection
plus every student progress and `typing_logs` record citing that id would have to
move with it. **That is a migration with student data in it, for a cosmetic
space.** Leave it. This item is only about the next one.

### The root cause — confirmed at both line numbers

`slugifyBookId()` (`admin.js:1092`) collapses `[^a-z0-9]+` to a hyphen and could
never emit a space. But the create path (`admin.js:1643`) is just:

```js
const id = newBookId.value.trim();
```

`.trim()` strips the ends and nothing else, so a hand-typed interior space passes
straight through. The autofill only fills a field that is **empty**, so anyone who
types the id themselves bypasses the slug entirely.

### ⚠⚠ THE OBVIOUS GUARD IS THE WRONG GUARD, AND THIS IS THE USEFUL PART

The proposal that came with the report was to warn when the typed id *does not
match what `slugifyBookId()` would produce*. **That check would fire on the
flagship book.** `game.js:201` reads:

```js
const DEFAULT_BOOK = "wizard_of_oz";
```

Underscores. `slugifyBookId("Wizard of Oz")` returns `wizard-of-oz`, with hyphens
— so the existing corpus and the auto-slug **already disagree**, and a round-trip
check would flag most of the library on sight. `slugifyBookId()` also truncates at
40 characters and strips a leading `the-`/`a-`/`an-`, so it is not idempotent on
ids that are already fine.

⚠️ **A flag that fires on the correct case is a flag nobody reads by October** —
the same constraint item 1 puts on item 4.

**So: guard on the character that is actually wrong, not on slug equality.**
Whitespace, and only whitespace, until there is a reason for more:

```js
if (/\s/.test(id)) { /* warn, do not block */ }
```

⚠️ **WARN, NEVER BLOCK.** Ids like `e-nesbit-psammead01-children-and-it` and
`l-frank-baum-oz01-the-wonderful-wizard-of-oz` are hand-shaped on purpose — the
series prefix and the volume number are doing real work that no slugifier would
produce. A blocker would fight Jake every time he adds a series.

⚠️ **IF A WIDER RULE IS EVER WANTED, MEASURE THE CORPUS FIRST.** Whether
uppercase or `.`/`/` should also warn is answerable only by listing the real
`books` collection ids, which are in Firestore and not in this repo. Do not guess
the character class from the filenames in `library/` — those follow a different
convention and are not the ids.

**Size:** small, and it belongs in admin.js. ⭐ **Ride it along with any round
already inside `admin.js`** rather than spending a round on it — item 42 is going
to be in that file anyway.

---

## 48. ✅ “TEXT PREPARED BY” NAMED THE WRONG PERSON ON EVERY BOOK, ON EVERY SURFACE

✅ **DONE**, Round 57 (Bar-Lock). `index.html` v3.17.0, `game.js` v3.47.0,
`adventure-renderer.js` v1.5.5.

**Jake, 2026-09-02, with a screenshot of The Phoenix and the Carpet:** *"I don't
think the text prepared by field is working. I've updated this guy manually
multiple times — it's not claude. This is a Global Grey book, so it's Julie (or
Julia? I don't remember). But even when it's correctly pulling from Gutenberg in
Admin, it's not showing up on the about page. It's ALWAYS claude....when it
shouldn't be. You're awesome, but not that awesome."*

⚠️⚠️ **HE WAS REPORTING TWO INDEPENDENT DEFECTS THAT PRODUCED ONE SYMPTOM**, and
either one alone would have been enough to make the field look broken. That is
why editing it in admin appeared to do nothing: both had to be fixed.

**(1) THE LABEL WAS BOUND TO THE WRONG FIELD, AT THREE SITES.** `Text prepared
by` read `cleanedBy` in `index.html`'s About panel, in `game.js`'s classic end
credits, and in `adventure-renderer.js`'s. `cleanedBy` is *"Claude"* on
essentially every book in the library — so the row said Claude on every book, no
matter who had prepared the text. Not a data problem at all; the page was
faithfully rendering a field nobody meant it to render.

⚠️ **ON THE ABOUT PANEL IT WAS ALSO A DUPLICATE**, which is visible in Jake's
screenshot and is the tell nobody read: that panel already had a correct
`Cleaned up by: Claude` row four lines above, so it printed the same name twice
under two different labels. **Three labels existed for two people** — `Prepared
by`, `Cleaned up by`, `Text prepared by` — and the third was a second alias for
one of the first two.

**(2) `preparedBy` NEVER REACHED index.html AT ALL.** The library projection
(`index.html`, in the book-list loop) carried `source`, `rights`, `archiveUrl`,
`originUrl` and `cleanedBy` — and not `preparedBy`. So `book.preparedBy` was
`undefined` for every book ever loaded, and the `Prepared by` row that had been
sitting in that panel since v3.6.3 had never once rendered for anybody.
`admin.js` has saved the field correctly since v3.20.0 and still does; the
student-facing page simply never asked for it.

⚠️ **AND ADVENTURE HAD THE SAME GAP ONE LAYER UP.** `game.js`'s credits payload
passed only `cleanedBy` into `adventure-renderer.js`, so fixing that renderer's
label alone would have rendered nothing at all.

**What shipped.** `preparedBy` added to the projection (costs no extra read — it
is one more string off a document already being held); `Text prepared by` pointed
at `preparedBy` on all three surfaces; the duplicate row deleted; the cleaner's
credit kept everywhere under `Cleaned up by`. ⚠️ **THE CLEANER'S CREDIT IS
RELABELLED, NEVER DROPPED** — it is a disclosure that the text was modified, not
only a courtesy.

⚠️ **THE BOOKS CACHE KEY WAS BUMPED `ttb_booksCache_v2` → `_v3`, AND THAT BUMP IS
PART OF THE FIX.** The cached value is the PROJECTION, not the raw document, so
every cache written before this version lacks the new field. Without the bump the
fix would have appeared not to work — for hours, for exactly the students who use
the site most, with nothing on screen to explain why. Costs one extra read per
student, once. See § READS before adding a third bump casually.

✅ **AND THE HARNESS SHIPPED IN THE SAME ROUND** — `tests/credits-binding-test.mjs`
v1.0.0, 54 assertions. **No harness watched the credit rows on any surface**,
which is how a field that never reached the page went unnoticed for eleven
versions and a label bound to the wrong variable survived at three sites at once.
`credits-test.mjs` and `credits-scroll-test.mjs` both build fixtures containing
`cleanedBy` and **neither asserts a single label**.

⚠️ **IT ASSERTS THE PAIRING, NEVER THE PRESENCE.** "Does the string `Text prepared
by` appear in game.js" would have passed against the broken build, on all three
files, for the entire eleven versions. Every assertion reads a
`[label, expression]` pair and checks which field the expression names.

⚠️⚠️ **PARTS C AND D ARE CLASS GUARDS AND ARE THE MORE VALUABLE HALF.** They do
not mention `preparedBy`: C asserts that **every** `book.<field>` the About panel
renders is carried by the library projection, and D that **every**
`detail.<field>` the adventure renderer reads is supplied by game.js's payload.
Those catch the *next* field somebody adds to a credit surface and forgets to
plumb through — the failure mode is silent, permanent, and looks exactly like a
data problem, so nobody goes looking in the code.

⚠️ **MUTATION-VERIFIED AGAINST THE PRE-FIX BUILD: 12 failing across A, B, C and
E**, including Part E reproducing Jake's report exactly — `"TEXT PREPARED BY"
renders the cleaner's name`. C and D were each verified separately by deleting a
single line from the fixed build. **Part D correctly passes on the broken build**
and the harness header says so, because D guards the failure that would have come
*next*: fixing a label while leaving the field out of the payload.

**Still open, and it is Jake's to answer:** the Global Grey preparer's name.
He remembers *"Julie or Julia"* and the field currently holds whatever admin
last stored. Now that the row actually renders, the value is visible on the
About page and can be corrected book by book in admin — no code change needed.
