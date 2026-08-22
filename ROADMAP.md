# TYPETHATBOOK — ROADMAP

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
  **Check the footer version first** — `game.js` v3.38.1 / `learn.js` v2.23.2.
  A pre-fix build still in a tab will still do it, and Hermes's update gate is
  how you get the building onto the new code.
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

## 0b. ⭐ NEXT — A SETTINGS PANEL FOR SCHOOL

Jake, 2026-08-21: *"I think we have room for the settings thing in learn."* The
two-row bar freed the space, and `.hud-section.right` now has a real home for a
⚙ (game.js v3.39.1 put Library's there).

⚠️ **THIS IS NOT "ADD A GEAR TO learn.html". IT IS A PLACE TO PUT THREE THINGS
THAT CURRENTLY HAVE NOWHERE TO LIVE:**

1. **The reading-font control.** Item 8 shipped it into the School MAP, not the
   drill, because a focusable control inside the drill is one Tab away from
   eating a keystroke the child should have been credited for. ⚠️ **THAT RULING
   DOES NOT CHANGE** — a modal is the way to satisfy both: the ⚙ itself is
   `tabindex="-1"` and click-only, and the controls live inside a dialog that
   only exists while it is open.
2. **Class information.** `#user-class-name` was removed from the bar in
   learn.js v2.24.0 on Jake's ruling ("forget about the class, it can live in
   settings"). ⚠️ **IT NOW LIVES NOWHERE. THIS IS THE DEBT THAT RULING CREATED**
   and this item is where it gets paid. Library's menu modal already shows
   school and class; School shows neither.
3. **Parity with Library's menu**, which is the real argument. A child moving
   between the two modes should not find that the ⚙ means something different
   on each side.

`openMenuModal()` in `game.js` is the model. ⚠️ **DO NOT IMPORT IT** — it reaches
into book, chapter, sprint and view state that School has none of. Take its
shape, not its body, and put the shared parts somewhere both can import rather
than growing a third copy of a settings dialog.

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
- **Enforce the header budget**: 60 lines, 6 version entries; history belongs in
  `CHANGELOG.md`. ⚠️ `npm run audit:versions` is the tool and it reports **15
  problems**; `game.js` (373 lines / 31 entries) and `learn.js` (321 / 34) are the
  worst and both are frozen until after Monday. The ONE ordering failure it found
  is fixed — see below. ⚠️ **AND THE CHANGELOG HAS TO BE WRITTEN FOR THAT TO MEAN
  ANYTHING — ROUND 24 SHIPPED FOUR FILES AND ADDED NO ENTRY**, putting all of it
  in `HANDOFF.md` instead, which is the pressure this bullet is about. Round 25
  did not reconstruct it from the outside; see `HANDOFF.md` §0.-11.D. The
  per-file sections are stale too (`lessons-admin.js` reads `Current: v1.7.1`). `game.js` is at 352 lines / 29 entries, `learn.js` at 303 / 33.
  ⚠️ Rounds 23 and 24 both added to them knowingly. Six shared modules are over
  the LINE budget; `session-log.js` is now over the ENTRY budget again too.
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
