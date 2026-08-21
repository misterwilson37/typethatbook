# TYPETHATBOOK — ROADMAP

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
- ⚠️⚠️ **NEW — THE OVERNIGHT RESCUE GOES LIVE ON THE CUTOVER, NOT ON UPLOAD.**
  `daylog.js` v1.4.0 refuses to carry into a pre-cutover day, so nothing happens
  before Saturday. **First chance to see it work: type as a guest on the 24th,
  do not sign in, sign in on the 25th, and check the 24th's total AND its
  drill-down.** Both should show the rescued sprint, on the 24th. Worth doing
  once in each mode — the two writers are separate copies.

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

## 7b. ✅ THE RANDOM DRILLS — FILTERED, ON JAKE'S LEADING RULING

**Shipped**: `drill-filter.js` v1.2.0, `learn.js` v2.23.0. 61 checks.

⚠️⚠️ **THE RULING IS THE ITEM, IT CHANGED TWICE IN ONE MORNING, AND THE SECOND
CHANGE REVERSED ONE OF ITS OWN EXAMPLES. READ BOTH PARTS BEFORE TOUCHING THIS.**

> 1. *"ass is bad alone, but it is fine to randomize to lass or asse or mass or
>    whatever."*
> 2. *"maybe make it so ass can't lead the word in the four letter clump. Fass is
>    fine, but asse would probably get it."*

**Part 2 is the live rule.** A tier 1 entry blocks a group when the group
**STARTS** with it. `asse` was named acceptable in part 1 and is blocked under
part 2 — that is Jake looking at the consequence and narrowing it, **not** a
contradiction to resolve by preferring the older quote. Parts B1–B5 hold all of
it, and B4 is annotated as the reversal so nobody "restores" it.

| group | verdict |
|---|---|
| `ass` `asse` `assd` | blocked — leads |
| `fass` `lass` `mass` `sass` | fine — does not lead |
| `fart` | blocked | 
| `xfart` | fine — see the asymmetry below |

⚠️ **LEADING CLOSED A DEAD SPOT THE PREVIOUS RULE HAD.** Whole-group matching
could never fire a three-letter entry at groupSize 4, so **the original report —
a student seeing "ass" — was not covered by the fix written for it.** It is now.
A1 asserts a non-zero rate where v1.1.0 measured exactly 0.

⚠️ **KNOWN ASYMMETRY, RULED NOT OVERLOOKED:** a TRAILING tier 1 word passes
(`xass`, `xfart`), because `fass` must pass and nothing separates them but
position. The severe cases live in tier 2, which is substring and position-blind.
**If a trailing giggle-tier word shows up in a classroom, move that entry to
`ALWAYS` — do not make tier 1 match both ends**, which blocks `fass` and reopens
the ruling. B5b asserts the gap on purpose.

⚠️⚠️ **AND LEADING MADE THE NEVER-USE-ON-PROSE WARNING LOAD-BEARING.**
`assignment`, `assume`, `assist`, `assess` and `asset` are ALL blocked now —
words this app cannot do without. `class`, `passage`, `grass` and `harass` survive
only because the sequence does not start them. **One import of this module into
`game.js` or the Gemini practice path would begin silently deleting ordinary
English.** B12 names the blocked half; F5/F6 hold the line.

⚠️ **`kkk` WAS IN TIER 2 FOR AN HOUR AND A TEST THREW IT OUT.** Substring rule,
`k` is a home key, so it fired on ordinary same-finger repetition more often than
the defect being fixed. **A short tier-2 entry made of common keys is a pedagogy
bug wearing a safety costume** — the cost of a content filter is paid in the thing
being filtered, and nobody notices, because the evidence is what is missing. A4
now caps the home-row rate; C7 blocks the class of entry.

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
been credited for.

**Still open from this item:** nothing. If more faces are wanted, add to
`DRILL_FONTS` and mark the fourth column `false` for anything proportional, or
F8's guarantee lapses silently.

---

## 9. REDUCE THE SURFACE

No deadline.

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
