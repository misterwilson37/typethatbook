# TYPETHATBOOK — ROADMAP

**v3.21.0, 2026-08-23.** ⭐⭐ **EIGHT NEW ITEMS (11–18) FROM JAKE'S FIRST REAL TEST
OF THE LESSON GATE.** ⚠️ **ITEM 13 IS THE ONE TO READ FIRST AND ITS FIRST STEP IS
A READ, NOT AN EDIT** — the gate did not fire, and the evidence in Jake's own
screenshot (lesson 1 showing a green `A`, not `A🔥`, on a monotonic best-ever
field) suggests **the gate is fine and the spec is wrong**: it counts a LESSON
grade while the student is being shown fire on a RUN. Item 14 likely dissolves it.
⚠️ **ITEM 11 IS A DATA-INTEGRITY BUG** — a class assigned without a school makes a
student visible from one query and invisible from another. ⚠️ **ITEM 17 IS THE
EXPENSIVE ONE** (1,155 reads to report on three students) and **ITEM 18 IS WHY IT
MATTERS** (11% of the daily read quota at 135 students; the target is ~400).
⚠️ **WRITES ARE 0.2%, READS ARE 11.3% — A 50x ASYMMETRY. TRADE READS FOR WRITES
FREELY IN THIS PROJECT.**

**v3.20.0, 2026-08-23.** ⚠️⚠️ **THE BUILD PANEL WAS CACHING ITS OWN ANSWER IN
`sessionStorage`** and could not be refreshed by reloading — only by opening a new
tab. Fixed in Round 30 (Postal), `versions.js` v1.13.0. ⚠️ **Anything that reports
on the system needs a harness pointed at it specifically**, because a diagnostic
is consulted instead of checking and so has nothing behind it to disagree when it
is wrong — third instance in three rounds. HANDOFF §0.-22. ⚠️ **§10.H — THE
MEASUREMENT — IS STILL THE NEXT THING**, and was next before this round too.

**v3.19.0, 2026-08-23.** ✅ **ITEM 10 IS BUILT** — the lesson-farming gate, Round
29 (Odell). ⚠️⚠️ **MASTERY IS WHAT CLOSES A LESSON, AND ONLY MASTERY**; an
unmastered lesson is graded and replayable forever, at any distance, and a
distance-or-time condition reaching one would invert the feature. ⚠️ §10.E named
an increment site that would never have fired — read the note at the top of the
item before trusting any other line number it cites. ⚠️ **§10.H, the measurement
Jake asked for FIRST, is still not built.**

**v3.18.0, 2026-08-23.** ⭐ **NEW ITEM 8b — EVERY ROUND SHIPS A CHANGED-FILES-ONLY
UPLOAD SET**, on Jake's instruction, with the applied-to-a-clean-copy suite run as
the non-optional part. ⚠️ Round 28's first attempt at it silently omitted
`versions.js` and would have blanked both student pages; the file list was right
and the copy was wrong, which is why reviewing the list is not the check.
✅ **ITEM 9's HEADER-BUDGET AND `ADMIN_EMAILS` BULLETS ARE CLOSED** (Round 28).
⚠️ **ITEM 10 IS STILL THE NEXT BUILD** and is unchanged by any of this.

**v3.17.0, 2026-08-22.** ✅ **ITEM 10 IS FULLY SPECCED AND BUILDABLE** — all three
open questions resolved by Jake. ⚠️ (1) `activeDayCount` ships cheap: **A GATE IS
NOT A LEDGER**, and Rule 9 exists to protect the graded record, not a review
gate whose worst failure is a lesson opening a day early. (2) ⚠️⚠️ **THE GATE ONLY
EVER TOUCHES LESSONS WITH 3× A🔥** — an unmastered lesson is always replayable,
forever, so "the kid who advanced on a B" is not a case the rule can reach.
*Mastery is what closes a lesson, and only mastery.* (3) `fireCount` seeds from
the existing best grade — `grade === 'A🔥' ? 1 : 0`, computed at read time, no
migration; **1 is the honest maximum**, since best-grade cannot tell one fire
from twenty, and seeding higher would lock a class out on deploy morning.

**v3.16.0, 2026-08-22.** ⭐ **ITEM 10 HAS A MODEL** — a RECEDING REACH-BACK
WINDOW, on Jake's clarifications. ⚠️ **THE FLAT 30-DAY COOLDOWN IS WITHDRAWN:**
kids are in his class for **2 months**, so a flat month is a quarter of the
course and it opens every mastered lesson at once, home row first — the opposite
of the ask. The rule is now `reachBack = floor(activeDays / 7)`, graded if
`L >= furthest - reachBack`. ⚠️⚠️ **PROGRESS RESETS IT, WHICH IS THE ELEGANT
PART:** a child advancing never sees an old lesson, a child STALLING earns one
more lesson behind them per week — review reaches the struggling student and not
the coasting one, with nobody assessing anybody. Lesson 1 needs 26 weeks of
standing still. ✅ **PRACTICE MODE IS BACK IN** and both of my objections are
retired: a run recorded in NEITHER `typing_logs` NOR `typing_sessions` creates no
divergence, and it never touches the increment site because **it simply never
arms `startGradedTimer()`** — item 0b's pause work is the mechanism. ⚠️ THREE
OPEN QUESTIONS need Jake, including a Rule 9 call on `activeDayCount`.

**v3.15.0, 2026-08-22.** ⭐ **ITEM 10 IS SPECCED** — lesson farming. ⚠️ THREE
FINDINGS WORTH READING BEFORE BUILDING IT. (1) The chapter staleness ladder is
7d→exact / 30d→sentence / beyond→chapter start, it NEVER goes to the start of the
book, and **it is a re-upload degradation path, not a review mechanic** — the
mechanism does not transfer but the 7/30-day thresholds should. (2) `grade` stores
the BEST grade only, so **"three times A🔥" is not derivable from what is stored**
and needs a new `fireCount`; `completedAt` already gives the cooldown clock free.
(3) ⚠️⚠️ **A CORRECTION IN PLACE: the previous draft said Rule 11 forbids
uncounted time. That was WRONG** — time counting for neither student nor teacher
creates no divergence. The real objections are that the drill-down would disagree
with the day total by design, and that it puts a condition on the one increment
site. **Recommendation is the 30-day cooldown, which gets the same outcome with
none of it.** ⚠️ And the override should be an admin toggle, NOT a hashed password
in the bundle — the failure mode is a student watching Jake type it, not
cryptography, and a hardcoded hash cannot be rotated without a deploy.

**v3.14.0, 2026-08-22.** ⚠️⚠️ **`hud.js` IS v2.0.0 ON JAKE'S EXPLICIT SIGN-OFF**
("Give hud 2.0. It's earned it"). No code changed — the number catches up with
the breaking return-shape change that shipped as a minor in v1.3.0. ⚠️ Why it is
not bookkeeping: a minor says "your caller still works", and every v1.2.0 caller
reads `.left` and gets `undefined` — which does not throw, it renders the word
"undefined" into a child's top bar. That is what happened to `hud-test.mjs` for
two releases. ✅ **ITEM 9b IS CLOSED** — the cost was never Firestore and could
not have been localStorage; see the item for why, because the reasoning is
reusable. **44 harnesses, all passing.**

**v3.13.0, 2026-08-22 (cutover morning).** Round 27 (Chicago) — ⚠️⚠️ **THE SUITE
WAS RED IN THE REPO AS DELIVERED (two harnesses of 43) AND FIVE FILES WERE LYING
ABOUT THEIR OWN VERSION.** `game.js`'s constant read 3.38.0 against a 3.42.0
header; `learn.js` 2.23.1 against 2.27.0; `hud.js` 1.2.0 across a *breaking*
return-shape change; both stylesheets in their CSS stamps. **The code was new in
every case — only the stamps were stale.** ⚠️⚠️ **THE COST WAS AIMED AT MONDAY:
the checklist above told Jake to check the footer for v3.38.1 / v2.23.2, and a
correctly deployed build was going to answer with the PRE-FIX numbers** — the
reading that means "go fire the update gate." **The checklist is corrected
above.** ⚠️ The hud.js pin could not fire because a pin checks a hand-maintained
number and inherits its honesty; `HANDOFF.md` §0.-14.D is the part worth reading.
Fixed by `tests/version-stamp-test.mjs` (99 checks), which moves
`audit:versions`'s check INSIDE `npm test` — **a guard outside the suite is a
guard nobody runs.** `hud-test.mjs` rewritten for the `{ lead, sprint }` API.
**44 harnesses, all passing.** ⭐ **ITEM 9b IS NEW** (closed same day — see above). ⚠️ **ITEM 0b WAS NOT
STARTED** — a red suite and a broken instrument outrank a new feature.

**v3.12.0, 2026-08-21 (evening).** ✅ **ITEM 0 IS CLOSED** — the two-row bar, the
landing readout and "I'm done" all shipped. ⚠️ **The landing-page trophy did NOT
ship with it and is NOT part of item 0's closure:** index.html has no leaderboard
and `openLeaderboard()` lives in game.js. That is a feature, not a button, and it
now stands on its own. Next up is **item 0b**, a settings panel for School — and
⚠️ that item is also where the class information learn.js v2.24.0 removed from
the bar gets a home again, because right now it lives NOWHERE on the School side.

**v3.11.0, 2026-08-21 (evening).** ⭐ **ITEM 0b IS NEW** — a settings panel for
School, which the two-row bar made room for and which is now the only home for
the class information learn.js v2.24.0 removed from the bar. ✅ Item 0's bar and
landing readout shipped; "I'm done" is still open; ✅ 0c.3 was never a question — see it. ✅ **"NOT EVERYONE GOT
FIREWORKS" IS FIXED** — the goal suppression asked whether the total was already
past the goal, which stays true all week, rather than whether the child had been
SHOWN it. hud.js v1.4.0's latch; tests/celebration-test.mjs. ✅ **AND THE
FIREWORKS ARE DOUBLED** — celebrate.js v1.0.0, 10 shells over twice the run time.
⚠️ **celebrate.js IS THE FOURTH TWIN EXTRACTED TODAY** and its two copies had
already drifted; item 9's "reduce the surface" is no longer a tidying exercise,
it is the day's actual lesson.

**v3.10.0, 2026-08-21 (afternoon).** ⭐ **ITEM 0 IS NEW AND IT IS THE NEXT
BUILD** — the two-row top bar and the "I'm done" stamp, specced with Jake from
live renders. Buildable; **not before Monday's verification**, because every
screen it touches is an instrument Jake reads to perform that verification.

**v3.9.0, 2026-08-21 (afternoon).** Round 26 (Elliott-Fisher) — one item, found
in production, not on this list. ⚠️⚠️ **A TAB LEFT OPEN OVERNIGHT WAS POSTING
YESTERDAY'S WHOLE DAY TOTAL TO TODAY'S `typing_logs` DOCUMENT** on re-auth, exact
to the second and the character on one of the two students it hit.
`mergeGuestStats()` guarded the server side of `live - base` and never the live
side. Fixed in `game.js` v3.38.1 and `learn.js` v2.23.2;
`tests/live-period-test.mjs` fails 42 against the old build. **`HANDOFF.md`
§0.-12 is the write-up** — §0.-12.E lists three residues, and the first of them
promotes item 9's `daycounter.js` bullet from tidying to repair. ⚠️ **§0.-12.F
is a SECOND finding, undiagnosed on purpose:** one student's 2026-08-17 reads
0m 0s against real typing. **Do not theorise — get a population.**

**v3.8.0, 2026-08-21.** Round 25 (Hall), in three parts across one day.
**Morning:** audited the whole cutover on its eve and **found it sound** — the
table is `HANDOFF.md` §0.-11.C, and it exists so nobody repeats it. The one thing
that was not sound was item 9's `lessons-admin.js` bullet, rated *"not urgent"*
while the cutover was still in the future and **load-bearing from the moment it
was not**. Fixed. **Then:** two piddly items outside the frozen files.
**Then, on Jake's call:** ⚠️ **items 7b and 8 both SHIPPED into `learn.js`** — the
drill filter and the font picker — under an explicit condition, *"without
touching the timing mechanism"*, which is now asserted by
`drill-filter-test.mjs` **F7** rather than promised. ⚠️ **BOTH ITEMS CARRY A
RULING OR A FINDING THAT MATTERS MORE THAN THE FEATURE. Read 7b and 8 before
touching either.**

**v3.4.0, 2026-08-20.** Round 24 shipped THE OVERNIGHT RESCUE on Jake's ruling,
fixed the evening-guest date, the School hard refresh and the Logout button
(invisible twice, in two stylesheets), and — from Jake's own re-generated
report — **downgraded item 1 from "records are lost" to "records are late."**
⚠️ It also **confirmed and fixed item 6** (the midnight straddle, Library) and
**deleted item 3 as a phantom** — one `grep` ended a defect two rounds had
carried. Completed work and settled arguments live in `HANDOFF.md`.

---

## ⏳ THE CUTOVER IS STILL 2026-08-22 — nothing to do but watch

⚠️ **DO NOT MOVE THE DATE.** Every reader and both writers gate on the one
constant in `daylog.js`, copied into `reports.html` and `lessons-admin.js` and
held identical by `daylog-cutover-test.mjs` Parts F and G. §3.1 stays live until
that morning **by design**, and two harness Parts assert that defect on purpose.

**Verify on Monday 2026-08-24:**
- A student who used both modes shows a total **higher** than the old shape.
- The Students roster panel in the lessons admin still shows real weekly minutes.
  Near-zero means **`lessons-admin.js` v1.13.1 did not reach the browser** — and
  as of Round 25 that is now the ONLY thing near-zero can mean. It used to have a
  second explanation (the panel dated documents by the stamped field, so a
  post-cutover day could read legacy-first and drop its afternoon) and the two
  were indistinguishable from the chair. ⚠️ **Check the footer version before
  concluding anything.**
- One ⟳ click on a post-cutover day leaves the day unchanged.
- **A child who types before signing in keeps those minutes.** ✅ **PROVEN
  2026-08-20 in Library** — see item 1. Still unproven in School.
- ⚠️ **NEW — Cmd+R / Ctrl+R reloads a School lesson** and does not type an `r`
  into the drill. `learn.js` v2.21.1.
- ⚠️⚠️ **NEW — THE STALE-DAY CARRY IS THE ONE TO WATCH FOR ON MONDAY.** It is
  fixed, but it is the defect most likely to be MISREAD as a cutover failure: a
  day total far above its own sessions, in a child who never closed their tab.
  **Check the footer version first** — ⚠️ **`game.js` v3.42.1 OR HIGHER /
  `learn.js` v2.27.1 OR HIGHER.** A pre-fix build still in a tab will still do
  it, and Hermes's update gate is how you get the building onto the new code.

  ⚠️⚠️ **THESE NUMBERS WERE WRONG UNTIL ROUND 27 AND THE ERROR POINTED THE
  DANGEROUS WAY.** This line used to say *v3.38.1 / v2.23.2*, and a correctly
  deployed build would have answered **3.38.0 / 2.23.1** — because the version
  CONSTANTS in both files had not been bumped since Round 26 began, while their
  headers had. So the footer was going to report the PRE-FIX version of the very
  fix you are here to confirm, and the documented response to that reading is to
  go and fire the update gate at ninety Chromebooks. **The fix is now the number
  above, and `npm test` fails if a stamp and a header ever disagree again.**
  See `HANDOFF.md` §0.-14.
- ⚠️ **AND WHILE YOU ARE READING THE FOOTER: `style.css` should be v3.7.3 or
  higher and `hud.js` **v2.0.0** or higher** (hover the footer, or tap to pin on
  touch). Both were under-reporting themselves by two and three versions
  respectively, which matters because the two-row bar you are reading the day
  total off of shipped in `style.css` v3.7.0.
- ⚠️⚠️ **NEW — THE OVERNIGHT RESCUE GOES LIVE ON THE CUTOVER, NOT ON UPLOAD.**
  `daylog.js` v1.4.0 refuses to carry into a pre-cutover day, so nothing happens
  before Saturday. **First chance to see it work: type as a guest on the 24th,
  do not sign in, sign in on the 25th, and check the 24th's total AND its
  drill-down.** Both should show the rescued sprint, on the 24th. Worth doing
  once in each mode — the two writers are separate copies.

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

## 6. ⚠️ THE MIDNIGHT STRADDLE — CONFIRMED, FIXED IN LIBRARY, OPEN IN SCHOOL

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

## 8b. ⭐ NEW — EVERY ROUND SHIPS A CHANGED-FILES-ONLY UPLOAD SET

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

## 11. ⭐⭐ NEW — A CLASS WITHOUT A SCHOOL, AND THE STUDENT WHO IS IN NEITHER

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

## 12. ⚠️ SAFARI HUD SPACING, AND TWO SMALLER THINGS IN THE SAME PANEL

* **`learn.html` lacks the top padding `game.html` has.** Visible in Jake's
  screenshot: School's HUD sits flush against the top edge, Library's does not.
  Believed to be a missing wrapper element, noted in an earlier round and still
  open. ⚠️ **Twin problem again** — the two shells are hand-maintained.
* **The student ID is CUT OFF in Library's settings panel** but renders fully in
  School's. Same panel, same field, different shell.
* **Settings does not show the class in Library at all** (School shows "No class
  assigned"). Fold into item 11 — until that is resolved it is unclear whether
  this is a display bug or a correct display of missing data.

---

## 13. ⭐⭐ NEW — THE GATE DID NOT FIRE, AND THE LIKELY REASON IS A GRADE MISMATCH

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

## 14. ⭐⭐ MASTERY IS CUMULATIVE POINTS, PER **RUN**, NOT THREE FIREBALLS PER LESSON

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

## 14b. ⚠️⚠️ NEW, AND IT BLOCKS ITEM 14 — RUN OUTCOMES ARE LOST ON "BACK TO MAP"

**Jake, 2026-08-23:** *"I finished every single run. I finished the run, got a
grade, and then clicked back to map. Could the back to map not count as
finishing? It counted the time and everything."*

### ✅ CONFIRMED IN THE CODE. HE IS EXACTLY RIGHT.

`recordRunOutcome()` does not write to Firestore. It updates `userProgress` in
memory, adds the lesson to `pendingProgress`, and calls `learnWalSave()`. The
Firestore write happens in **`flushLessonProgress()`** — and that function has
**exactly one caller**, at learn.js:4778, in the session-end path.

⚠️ **`stopLesson()` DOES NOT CALL IT.** It calls `saveStats()` and
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

## 15. ⭐ NEW — STORE THE GRADE ON THE LOG RECORD, AND BACKFILL IT ONCE

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

---

## 16. ⚠️ NEW — THE BUILD PANEL IS MISSING ON `reports.html` AND `admin.html`

Jake: *"the hover doesn't work on reports. It also doesn't work on admin."*

`reports.html` shows `Reports v2.25.1` and `admin.html` shows a corner stamp, but
neither has the hover build list. ⚠️ **AND NEITHER IS IN `versions.js`'s
`SOURCES`** — HANDOFF §2 already flags that their versions are *unchecked*, which
means a stale `admin.js` cannot be detected by the one instrument built to detect
stale files. Small job: add both to SOURCES and give each shell the footer.

---

## 17. ⚠️⚠️ NEW — REPORTS READ EVERY RECORD OF EVERY STUDENT, EVERY TIME

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

## 18. ⚠️ NEW — THE READ BUDGET CAPS THE PROJECT AT ~270 STUDENTS

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

### H. Before any of it: measure

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
- **Historical data is good enough.** No bulk repair of past days.
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
