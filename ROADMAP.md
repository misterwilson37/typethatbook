# TYPETHATBOOK — ROADMAP

**v3.2.0, 2026-08-20.** Round 24 shipped THE OVERNIGHT RESCUE on Jake's ruling,
fixed the evening-guest date, the School hard refresh and the Logout button
(invisible twice, in two stylesheets), and — from Jake's own re-generated
report — **downgraded item 1 from "records are lost" to "records are late."**
Completed work and settled arguments live in `HANDOFF.md`.

---

## ⏳ THE CUTOVER IS STILL 2026-08-22 — nothing to do but watch

⚠️ **DO NOT MOVE THE DATE.** Every reader and both writers gate on the one
constant in `daylog.js`, copied into `reports.html` and `lessons-admin.js` and
held identical by `daylog-cutover-test.mjs` Parts F and G. §3.1 stays live until
that morning **by design**, and two harness Parts assert that defect on purpose.

**Verify on Monday 2026-08-24:**
- A student who used both modes shows a total **higher** than the old shape.
- The Students roster panel in the lessons admin still shows real weekly minutes.
  Near-zero means `lessons-admin.js` v1.13.0 did not reach the browser.
- One ⟳ click on a post-cutover day leaves the day unchanged.
- **A child who types before signing in keeps those minutes.** ✅ **PROVEN
  2026-08-20 in Library** — see item 1. Still unproven in School.
- ⚠️ **NEW — Cmd+R / Ctrl+R reloads a School lesson** and does not type an `r`
  into the drill. `learn.js` v2.21.1.
- ⚠️⚠️ **NEW — THE OVERNIGHT RESCUE GOES LIVE ON THE CUTOVER, NOT ON UPLOAD.**
  `daylog.js` v1.4.0 refuses to carry into a pre-cutover day, so nothing happens
  before Saturday. **First chance to see it work: type as a guest on the 24th,
  do not sign in, sign in on the 25th, and check the 24th's total AND its
  drill-down.** Both should show the rescued sprint, on the 24th.

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

## 2b. ⚠️ THE RESCUE IS LIBRARY-ONLY — learn.js IS NOT WIRED

`game.js` v3.37.0 carries prior-day guest sprints to their own documents.
`learn.js` does not, and the shared machinery in `daylog.js` v1.4.0 is
source-agnostic and ready for it: `carryOverPlan()` already groups School
records correctly and `carryOverPayloadFor('school', …)` already names the right
triple. `carryover-test.mjs` Parts A2, D4 and F5 cover the School side today.

**What is missing is six lines in `learn.js`'s `retroactiveSaveAnonSession()`**,
mirroring `game.js`: keep the taken array in a local, plan from it, write after
the flush.

⚠️ **HELD BACK DELIBERATELY, under the standing rule** (§0.-9.G, item 3): a
student write-path change to the file 8th grade depends on ships in a round that
can watch School run. Round 24 could not. **Ship this and item 3 together, in
one School-watching round** — they touch the same function and the same file, and
two separate deploys to `learn.js` is two chances to be wrong.

⚠️ Until then, a School guest who signs in the next day keeps their **record**
and not their **minutes**. That is the pre-existing behaviour, unchanged, not a
regression.

## 3. learn.js FLUSHES FOR ANONYMOUS USERS

`game.js`'s `_flushAllInner()` opens `if (!currentUser || currentUser.isAnonymous)
return;`. **`learn.js`'s `_flushStatsInner()` opens only `if (!currentUser)
return;`** — and a guest is signed in anonymously, so `currentUser` is not null.
A guest in School therefore writes `typing_logs/{anonUid}_{date}`: a real
document under a uid no roster can attribute.

**It loses nothing** — the student's own document is correct via the merge — so
this is orphan noise, not a wrong grade. It is a one-line change to the file 8th
grade depends on. ⚠️ **Ship it in a round that can watch School run**, not under
deadline.

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

## 6. THE MIDNIGHT STRADDLE

A session rollup of 4m 9s at 12:00 AM beside a daily log of 0m 6s for the same
date. Two candidates: the day-rollover reset inside the tick, and
`session-log.js`'s own dating of a chunk. `tab-lifetime-test.mjs` Part H models
the hypothesis. **Confirm against the code before fixing.**

⚠️ **ONE OF THE TWO CANDIDATES HAS SHRUNK.** Round 24 found and fixed a real
UTC/local date defect in `sessionLogAdopt()` (item 2), which is the *adopt* half
of "session-log.js's own dating." The rest of the module dates from the caller
and always did. Re-read this item against v1.6.0 before spending a round on it.

---

## 7. THE 5-SECOND FLOOR

A sprint that *ends* under five seconds is dropped rather than deferred. Small,
downward, unmeasured. **Measure before changing it** — lowering the floor fills
the drill-down with noise records. ⚠️ It is one of the two candidates in item 2.

---

## 8. STUDENT-FACING POLISH — Jake, 2026-08-20. NOT SOON.

Neither of these is a defect and neither has a deadline. They are here so they
are not lost.

- **A FONT PICKER IN SETTINGS.** Kids want to change the reading font; School at
  minimum, but there is no reason to scope it. A handful of good options rather
  than a list — a serif, a humanist sans, a slab, and one high-legibility face
  (OpenDyslexic or similar) is plenty. ⚠️ **NO SCRIPT FACES.** A child learning
  to touch-type has to be able to tell `l` from `1` and `rn` from `m`, and a
  joined face makes per-character highlighting unreadable besides.
  ⚠️ The setting is per-student and belongs beside the existing gear-menu
  preferences, not in a class or school document.
- **The reading-pane font is not the HUD font.** The HUD is monospace on purpose
  — the clock does not reflow while it counts. Scope the picker to the text.

---

## 9. REDUCE THE SURFACE

No deadline.

- **Extract the timer/stats/flush path out of `game.js`** as `daycounter.js` —
  pure functions, injected dependencies, directly testable, the same discipline
  as `daylog.js`. That path is where every counting defect has lived.
  ⚠️ `STAT_KEYS`, the WAL fold, the guest merge and the midnight rollover are
  four hand-maintained lists a new counter has to be added to.
- **Enforce the header budget**: 60 lines, 6 version entries; history belongs in
  `CHANGELOG.md`. `game.js` is at 352 lines / 29 entries, `learn.js` at 303 / 33.
  ⚠️ Rounds 23 and 24 both added to them knowingly. Six shared modules are over
  the LINE budget; `session-log.js` is now over the ENTRY budget again too.
- **Sentence-boundary WAL checkpoint**, both files or neither. localStorage only,
  costs nothing.
- **`pendingClassAssignments` as a third roster discovery source.**
- ~~**Guest paths verified by running rather than reading.**~~ ✅ **DONE** for
  Library, 2026-08-20, in the console — see item 2. ⚠️ **NOT DONE for School.**
  `learn.js`'s guest handover has still never been driven against a browser.
- **The idle-threshold rationale as a code comment**, above the constants in both
  files. ⚠️ **A COMMENT, NOT A BEHAVIOUR CHANGE** — do not touch the 2s/3s values
  while adding it.
- **`lessons-admin.js` keys its cutover gate off `data.date`**, the field the
  writer stamped, where `reports.html` warns in capitals to key off the document
  id. Not urgent; recorded so it is not rediscovered from scratch.
- **`handleDrillKey()` and game.js's keydown listener are near-duplicates that
  drifted.** Round 24 fixed the modifier guard in one of them. They disagree in
  other places too. Neither is obviously the better copy.

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
