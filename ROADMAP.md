# TYPETHATBOOK — ROADMAP

**v3.0.0, 2026-08-20.** Round 23 closed the guest minute and deleted the
reconcile. Completed work and settled arguments live in `HANDOFF.md`.

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
- ⚠️ **NEW — a child who types before signing in keeps those minutes, in BOTH
  modes, and they appear in the drill-down.** Round 23. Type as a guest for a
  minute, sign in, and check the day total and the sessions under it.

---

## 1. LIBRARY SESSION RECORDS ARE MISSING FOR A SIGNED-IN SPRINT

**Sharpened by Round 23, not solved.** Jake's 2026-08-20 test: the drill-down
showed School rows at 8:47, 9:00, 12:51, 12:52 and **nothing** from Library
typing at 12:55–12:57, though that minute reached the daily total (8:31 → 9:39).

The **guest** half is fixed — guest sprints are queued and adopted now.
**The signed-in minute is not explained.** `logSession()` should have fired at
Sprint Complete.

⚠️ **DO NOT GUESS BETWEEN THE TWO CANDIDATES — THEY ARE DIFFERENT FIXES.** After
a Library sprint, before navigating, run `sessionLogPending(<uid>)` in the
console. Non-zero: it queued and did not flush. Zero: it never queued.

Other known ways a sprint never reaches `typing_sessions`: the five-second floor,
a unit that never closes, an upload that fails while the daily-log write
succeeds. Records that do arrive can arrive twice — overlapping windows with
distinct signatures, which the dedupe cannot see.

`typing_logs` stays the graded record and is unaffected.

---

## 2. learn.js FLUSHES FOR ANONYMOUS USERS

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

## 3. THE IMPLAUSIBILITY FLAG

A read-only, staff-only marker saying *this looks impossible, go look*, leaving
the judgement with the teacher. Two candidate signals: a day exceeding a
plausible ceiling for a class period, and a day wildly exceeding its own session
evidence. Needs a threshold, which needs item 4.

---

## 4. WHAT A NORMAL DAY LOOKS LIKE

One clean day, one class, after the cutover: `log ÷ sessions` per student. That
distribution sets item 3's threshold from evidence instead of a guess. **The week
beginning 2026-08-24 is the first clean run on the new shape.**

A ratio above 1.0 is expected, not an error: the day counter runs through pauses
inside a sprint, the session record only counts closed sprints. The two measure
different things and always will.

---

## 5. THE MIDNIGHT STRADDLE

A session rollup of 4m 9s at 12:00 AM beside a daily log of 0m 6s for the same
date. Two candidates: the day-rollover reset inside the tick, and
`session-log.js`'s own dating of a chunk. `tab-lifetime-test.mjs` Part H models
the hypothesis. **Confirm against the code before fixing.** A midnight defect,
not a school-hours one.

---

## 6. THE 5-SECOND FLOOR

A sprint that *ends* under five seconds is dropped rather than deferred. Small,
downward, unmeasured. **Measure before changing it** — lowering the floor fills
the drill-down with noise records.

---

## 7. REDUCE THE SURFACE

No deadline.

- **Extract the timer/stats/flush path out of `game.js`** as `daycounter.js` —
  pure functions, injected dependencies, directly testable, the same discipline
  as `daylog.js`. That path is where every counting defect has lived.
  ⚠️ `STAT_KEYS`, the WAL fold, the guest merge and the midnight rollover are
  four hand-maintained lists a new counter has to be added to.
- **Enforce the header budget**: 60 lines, 6 version entries; history belongs in
  `CHANGELOG.md`. `game.js` is at 352 lines / 29 entries, `learn.js` at 297 / 32.
  ⚠️ Round 23 added to both knowingly. `session-log.js` is back inside the entry
  limit; six shared modules are still over the LINE budget.
- **Sentence-boundary WAL checkpoint**, both files or neither. localStorage only,
  costs nothing.
- **`pendingClassAssignments` as a third roster discovery source.**
- **Guest paths verified by running rather than reading.**
- **The idle-threshold rationale as a code comment**, above the constants in both
  files. ⚠️ **A COMMENT, NOT A BEHAVIOUR CHANGE** — do not touch the 2s/3s values
  while adding it.
- **`lessons-admin.js` keys its cutover gate off `data.date`**, the field the
  writer stamped, where `reports.html` warns in capitals to key off the document
  id. Not urgent; recorded so it is not rediscovered from scratch.

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
  any value under the rules' clamp. Item 3 is the practical answer; server-side
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
  future round wants a comparison back, what it probably wants is item 3.
- ⚠️ **STUDENTS DO NOT SHARE BROWSER PROFILES.** Every student logs into the
  Chromebook with their own account, so per-browser is per-person — the ruling is
  in `stats-wal.js`'s header and `learn.js`'s `checkpointOwner()`. Round 23 built
  a whole theory on the opposite and Jake had to say so twice. **The only two
  uids that can meet on one profile are guest and signed-in.**
