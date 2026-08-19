# DESIGN — Typing telemetry, one honest number

**DESIGN-TELEMETRY.md v1.3.0** · drafted 2026-08-18 by Round 12 (Caligraph)
· amended 2026-08-18 by Round 13 (Ludlow) and Round 14 (Sholes)

**Status: PARTLY BUILT. §7 steps 1 and 1.5 are SHIPPED. Steps 2-6 are still proposal.**

⚠️ **v1.3.0 — §2.7 IS DECIDED AND §6 GAINS NOTHING.** Jake ruled on the graded clock:
it starts on the first keystroke of a run. That closes the last open question blocking
step 2 and creates one piece of work that must ship before it — the clock unification,
scoped in `HANDOFF.md` §4.1. **The reasoning in §1-§5 is otherwise unchanged.** If a
later round finds the design wrong, say so in a new version and say which part — do not
edit the reasoning to match what got built.

| step | state |
|---|---|
| 1. `serverAt` | ✅ **SHIPPED** — Round 13. `session-log.js` v1.1.0, `game.js` v3.23.1, `learn.js` v2.7.1. See §6.3 and §7. |
| 1.5. close the open unit | ✅ **SHIPPED** — Round 13. ⚠️ **NEW STEP, AND STEP 2 CANNOT BE BUILT WITHOUT IT.** `session-log.js` v1.2.0, `game.js` v3.24.0, `learn.js` v2.8.0. See §2.6 and §7. |
| 1.75. unify the clock | ⬜ **NEXT.** Ruled by Jake 2026-08-18: time typed starts at the first keystroke. Scoped in `HANDOFF.md` §4.1. ⚠️ **Ships BEFORE step 2 and separately from it.** |
| 2. `typing_logs` derived | ⬜ the one that matters — ⚠️ read §2.6 and §2.7 first, and note the timeliness prerequisite in §7 |
| 3. `stats/time_tracking` as rebuildable cache | ⬜ |
| 4. weekly archive + retention | ⬜ |
| 5. retire the audit | ⬜ |
| 6. tick resolution | ⬜ optional — ⚠️ **may be absorbed by 1.75;** re-read before doing it separately |

⚠️ **v1.1.0 CHANGED NOTHING IN §1-§5 EXCEPT §4's SCHEMA ANNOTATION.** The design
was not revised on contact with the first step; only its status was. If a later
round finds the design wrong, say so in a new version and say which part —
do not edit the reasoning to match what got built.

Read `HANDOFF-round12.md` §7 first — it explains the two defects that produced this
document, including two that Round 12 itself shipped and then had to withdraw.
(That file was `HANDOFF.md` when this document was written; Round 13 archived it.)

---

## §1. What Jake asked for, in his words

> "I need to be able to track how long and how well each student types, even if
> they're interrupted in the middle. It needs to work as well in learn as it does
> in game (and vice versa!). It needs to track by lesson, sprint, and day so that
> if a kid cheats or one gets corrupted, we can narrow it down and I can delete
> it."

Four requirements, and they are the acceptance criteria for anything built here:

- **R1 — Durable.** An interruption never costs recorded work.
- **R2 — Symmetric.** School and Library measure honestly and comparably, and
  record the same *shape* of data. ⚠️ **This does NOT mean identical thresholds** —
  see §2.2, where the difference is deliberate.
- **R3 — Granular.** Day, lesson/chapter, and individual sprint or run.
- **R4 — Correctable.** A bad record can be found and deleted, and the totals
  must change when it is.

⚠️ **R4 IS THE REQUIREMENT MOST LIKELY TO BE QUIETLY DROPPED.** It is the only one
that constrains the *architecture* rather than the code. Everything else can be
bolted onto the current design; R4 cannot, and §4 is essentially its consequence.

---

## §2. Verification first — what the code actually does today

Round 12 asserted two things it had not traced and got one of them wrong (see
`HANDOFF.md` §7). So every claim below was read out of the shipped source before
being written down.

### 2.1 ✅ Idle pause still works. Both sides. Confirmed.

Jake's memory was right, and the behaviour survived every intervening round.

| | game.js | learn.js |
|---|---|---|
| idle threshold | `IDLE_THRESHOLD = 2000` (2s) | `LEARN_IDLE_THRESHOLD = 3000` (3s) |
| tick resolution | 100 ms, accumulator | 1000 ms |
| auto-pause | `AFK_THRESHOLD = 5000` → `pauseGameForBreak()` | none |
| counts before first keystroke? | no | no (`if (!learnLastInputTime) return`) |

`gameTick()` only accrues inside `if (now - lastInputTime < IDLE_THRESHOLD)`, and
`learn.js`'s tick only inside `if (idle < LEARN_IDLE_THRESHOLD)`. **A student
cannot run out the clock by leaving the tab open on either side.**

### 2.2 ✅ The thresholds differ ON PURPOSE — 2s Library, 3s School

⚠️ **DO NOT UNIFY THESE. DECIDED BY JAKE, 2026-08-18.**

Round 12 first flagged the 2s/3s difference as an R2 violation. It is not. Jake's
reasoning, which is better than the objection:

> *"I actually like the 2 and 3 second discrepancy, as the kids typing books know
> how to type and are more likely to wander away."*

The populations are genuinely different and the thresholds are fitted to them.
Library is fluent readers typing prose they can already type — a two-second gap
there is much more likely to be attention drifting than a key being hunted for.
School is beginners locating keys, where three seconds is often the work itself.
A single number would either steal time from the students the lessons exist for,
or hand it to the students most able to idle.

**The symmetry that R2 actually requires** is that both sides pause on idle at
all, record the same shape of session, and be equally resistant to running out
the clock. All three hold. §2.1 confirms the first.

⚠️ One genuinely open (and minor) item: the **tick resolutions** differ — Library
accumulates in 100 ms slices, School tests once per second — so School's sampling
can mis-attribute up to about a second either way around a gap near its threshold.
Worth aligning to the 100 ms accumulator eventually for measurement precision.
That is a separate question from the threshold values and **does not change what
counts as idle.**

### 2.3 ✅ The second `secondsToday` increment in learn.js is NOT a double count

`learn.js:2794` is inside `closeGenie()`, which re-creates the tick after the
Game Genie panel closes. It is safe: `openGenie()` calls
`clearInterval(learnTickInterval)` before opening, and the whole panel is gated on
`ADMIN_EMAILS.includes(currentUser.email)`. Students cannot reach it.

⚠️ One real inconsistency inside it: `ggBypassIdle` ("No Idle") makes the School
tick accrue time while idle, whereas in `game.js` the same flag only suppresses
the AFK auto-pause and never defeats the idle gate. Admin-only, so not a grading
risk — but if the flag is ever exposed more widely, the two sides behave
differently. Fix when convenient; do not treat as urgent.

### 2.4 ⚠️ `typing_logs` is one document per student per day — shared by both modes

`typing_logs/{uid}_{date}`. `game.js` and `learn.js` both `setDoc(..., {merge:true})`
into it, each writing **its own in-memory `secondsToday`**.

This is only correct if both pages loaded a current `stats/time_tracking` before
they started counting. Round 12 established that this document was frequently
stale and, for roughly half of ninety students, **did not exist at all**.

So: a student does 10 minutes in School, opens Library. `game.js` loads a stats
doc that says 0, counts 4 minutes, writes `seconds: 240` over the top of `600`.
**Six minutes of that child's graded work is gone, silently, and the daily log —
the document this project treats as its reliable record — is the thing that lost
it.** Two open tabs produce the same collision faster.

⚠️ **THIS IS A LIVE DATA-LOSS PATH TODAY.** It is mode-crossing, so it violates
R1 and R2 at once, and it is the strongest single argument for §4.

### 2.6 ⚠️ SESSIONS ONLY EVER HELD *COMPLETED* UNITS — verified 2026-08-18

**This was found by reading the writers, and it invalidates step 2 as originally
specified.** Round 13 fixed it; the finding is recorded because the reasoning is
what matters for step 2.

A session record was created in exactly four places in `game.js` — chapter
complete, practice complete, AFK auto-pause, guest nudge — and one in `learn.js`:
`finishStep()`. **Not one of them fires when a student walks away from an
unfinished unit.** `visibilitychange: hidden` flushed the *counters* and never
touched the open sprint.

So: a student types two sentences, switches books, types two more, toggles to
School. The time is in `secondsToday` and in `typing_logs`, and there is **no
session record for any of it.**

⚠️ **DERIVING TOTALS FROM SESSIONS WOULD THEREFORE HAVE UNDERCOUNTED**, silently,
and worst for the students who move around most — which is a large share of a
middle-school period. It would have replaced an intermittent overwrite (§2.4) with
a reliable undercount, and looked clean doing it.

**Round 13's fix (step 1.5):** `logOpenSprint()` / `logOpenRun()` close the open
unit on `visibilitychange: hidden` and `pagehide` *without ending it*, so the
counters keep running and the student can come back and finish. Because one
stretch of typing can now be reported two or three times, the writers emit
**deltas against a watermark**, not totals.

⚠️ **THE WATERMARK IS THE PART THAT BREAKS IF SOMEONE IS CARELESS.** Reset it
wherever the sprint or run counters are zeroed, in the same place. A new sprint
carrying a stale watermark records nothing until it grows past the old sprint's
length — a silent loss, not a crash. `open-unit-test.mjs` counts the reset sites
in both shipped files and fails if they disagree.

### 2.7 ⚠️ SCHOOL HAS TWO CLOCKS AND SESSIONS RECORD THE OTHER ONE

Also verified by reading source, also load-bearing for step 2, **not fixed.**

| clock | gate | what it feeds |
|---|---|---|
| `stepSeconds` | `drillPos > 0 && !isDrillIdle()` | the graded clock: WPM denominator, and the `seconds` on a School session record |
| `statsData.secondsToday` | `learnLastInputTime` set, `idle < 3000` | the daily counter, `typing_logs`, the HUD |

They are not the same quantity. The graded clock does not start until the student
has typed at least one character of the run; the daily counter is already running.

⚠️ **CONSEQUENCE FOR STEP 2: even with step 1.5's complete coverage, the sum of a
School day's sessions will be slightly LESS than that day's counter, and the
difference is legitimate.** It is not drift and it is not corruption. Any step-2
implementation that treats "sessions ≠ counter" as an error will flag every
lesson-mode student every day.

✅ **DECIDED — Jake, 2026-08-18: the graded quantity is the clock that starts on the
FIRST KEYSTROKE of a run.** That is `stepSeconds` semantics, and it becomes the
definition of "time typed" on both sides rather than School's local peculiarity.

⚠️ **THIS CLOSES THE QUESTION AND OPENS A PIECE OF WORK THAT MUST SHIP FIRST.** The
split above is not resolved by picking a side in a document; the two increment sites
have to actually become one. `HANDOFF.md` §4.1 carries the scope: collapse School's
two sites into a single gated increment, and gate Library's tick on the first
keystroke so it stops counting the two free seconds at the head of every sprint.

⚠️ **Ship the clock unification BEFORE step 2, not with it.** It changes what the
counters *mean*; step 2 changes where the totals *come from*. Together, any
discrepancy has two candidate causes and no way to tell them apart.

⚠️ **And confirm what "first keystroke" means on each side before writing the gate.**
School gates on `drillPos > 0`, a position that advances only on accepted input;
Library's equivalent is `currentCharIndex > sprintCharStart`. If one side advances on
a wrong keystroke and the other does not, the two clocks start at different moments
and the asymmetry survives the fix that was supposed to remove it. Read both keydown
handlers. Do not infer it from the variable names.

Library has no equivalent split today: `sprintSeconds` and `secondsToday` are
incremented on the same line under the same gate.

### 2.5 ⚠️ Deleting a session does nothing (R4 is currently false)

`reports.html` has a delete button on every session record. Totals come from
`typing_logs`. Deleting a suspicious session removes the *evidence* and leaves the
*minutes*. Jake can narrow down; he cannot correct.

---

## §3. Why the current shape keeps producing this class of bug

Three documents hold overlapping views of one quantity:

| document | written | read by | authoritative for |
|---|---|---|---|
| `users/{uid}/stats/time_tracking` | every flush *(as of v3.23.0; `final` only before)* | student HUD, at load | day + week totals |
| `typing_logs/{uid}_{date}` | every flush | reports | day totals |
| `typing_sessions/*` | session end | reports drill-down | nothing |

Every incident this week is the same sentence: **two records of one quantity,
updated on different paths, disagreed.** The doubled week, the missing stats docs,
the HUD that changed on refresh, the cross-mode overwrite in §2.4 — all of it.

Round 12 fixed the *symptom* twice: aligned the write triggers (v3.23.0/v2.7.0),
then built an audit to detect residual drift. Both were correct and neither is
sufficient, because an audit is a confession that the data model permits states
you have to go looking for.

⚠️ **AN AUDIT IS NOT AN ARCHITECTURE.** If the next round's answer to a divergence
is a better audit, it has misread this document.

---

## §4. Proposal — sessions are the truth, totals are derived

**One writable record. Everything else computed from it.**

A **session** is an immutable, append-only record of one bounded stretch of
typing: a Library sprint or a School run. Nothing ever updates one. Totals are
sums over sessions.

```
typing_sessions/{autoId}
  uid, email, displayName, classId, schoolId
  date            "2026-08-18"   local date the typing happened
  source          "school" | "library"
  label           lesson id or book id
  detail          "run 3" | "chapter 7"
  seconds, chars, mistakes, wpm, accuracy
  sprints[]       the individual runs inside this rollup
  clientAt        ISO, from the browser
                  ⚠️ SHIPPED AS `timestamp`, ITS EXISTING NAME. There is no
                  `clientAt` field and adding one would put two copies of one
                  quantity in one document (invariant 71 at field scope).
                  `timestamp` keeps its name because reports.html and a live
                  single-field index exemption already know it — the same trade
                  `bookId` made below.
  serverAt        serverTimestamp()          ✅ SHIPPED, Round 13 — see §6.3
  expiresAt       TTL
```

### Why append-only fixes the class of bug

- **No read-modify-write**, so two tabs and two modes cannot clobber each other.
  §2.4 becomes structurally impossible rather than carefully avoided.
- **Deletion works** (R4). Remove a session, the sums change. That is the whole
  requirement, and it falls out for free.
- **Symmetry is enforced by shape** (R2). Both sides emit the same record. A
  School run and a Library sprint are the same row with a different `source`.
- **Granularity is inherent** (R3). The day is the sum of its sprints; there is no
  separate daily figure that can disagree with the sprints under it.

### What happens to the other two documents

- **`typing_logs`** → a derived cache, rebuildable at any time from sessions.
  Keep it: reports' class-wide queries are far cheaper against one doc per student
  per day than against every session. ⚠️ **But it stops being authoritative.** If
  it ever disagrees with the sessions, the sessions win and the cache is rebuilt.
  It should be written by summing the day's sessions, never from a live counter.
- **`stats/time_tracking`** → a HUD cache with the same status. It may be
  reconstructed from sessions at any time, so it can never be *wrong* for long,
  only *behind*.

⚠️ **A CACHE YOU CAN ALWAYS REBUILD FROM TRUTH IS NOT A SECOND SOURCE OF TRUTH.**
That distinction is the entire difference between this design and the current one,
and it is the sentence to keep if the rest of the document is forgotten.

---

## §5. Cadence — Jake's proposal, adjusted

### 5.1 Local buffer: on a timer, NOT on every keystroke

Jake proposed writing localStorage on every keystroke. ⚠️ **Don't.** `localStorage`
is synchronous and blocks the main thread. At 60 WPM that is ~5 serialize-and-write
cycles per second against a buffer that grows all period, on a low-end Chromebook,
*while a child is typing*. It would be felt as input lag, and input lag is the one
defect that would make students hate the app.

**Instead:** flush the in-memory counters to localStorage on a **2-second timer**
whenever dirty, and unconditionally on `blur`, `visibilitychange` and `pagehide`.
Worst-case loss is ~2 seconds of typing. The keystroke handler stays untouched.

### 5.2 Upload triggers

Upload the queued sessions when **any** of these fire:

1. Sprint or lesson run ends *(the natural boundary — most uploads are this)*
2. Lesson completed, or book/chapter changed
3. **Every 2 minutes of active typing** *(not wall-clock — an idle student should
   not generate writes)*
4. `visibilitychange` → hidden, and `pagehide`
5. Sign-out, and on the next load after a failed upload

⚠️ **RATE-LIMIT (3) AGAINST THE OTHERS.** A student finishing short runs would
otherwise trigger 1 and 3 together. One upload per 90 seconds minimum, whatever
combination of triggers fires.

### 5.3 Cost

Estimates, arithmetic shown, to be re-checked against `SCALE-PLAN.md` — Round 12
was burned by an unverified assumption and these are not yet verified.

*Firestore: 20k writes/day and 50k reads/day free; then ~$0.18/100k writes,
~$0.06/100k reads.*

**Ellis, 90 students, ~30 min typing/day:**
- uploads ≈ 15/student/day → 1 session doc + 1 cache write = **~2,700 writes/day**
- HUD load: 1 cache read/student/page-load ≈ **~200 reads/day**
- **Inside the free tier. $0.**

**District scale, ~3,000 students:**
- ~90,000 writes/day → 70k billable → **~$46/year**
- reads negligible against 50k/day free

**If the HUD is derived from sessions instead of a cache** (~30 session reads per
page load): 3,000 × 2 × 30 = 180k reads/day → 130k billable → **~$28/year**.
Affordable, and it removes the last cache. ⚠️ **Recommend keeping the cache
anyway** — not for cost, but because a cold HUD read of 30 documents on a school
wifi connection is a visible delay at the exact moment a child sits down.

For scale: the pre-v3.4.0 per-keystroke design modelled at **$34,400/year**. None
of the numbers above are in that conversation.

---

## §6. Decisions Jake needs to make

### 6.1 ✅ CLOSED — idle thresholds stay as they are

2s Library / 3s School, deliberately. See §2.2. **Nothing to decide and nothing to
build.** Recorded here only so the question is not reopened by someone who spots
the difference and assumes it is a bug — which is exactly what Round 12 did.

### 6.2 Historical data

School has no session records before 2026-08-18 and never will. Options: leave
history in `typing_logs` and treat sessions as authoritative going forward
(**recommended, simplest, honest**), or backfill synthetic single-session records
from the daily logs so the schema is uniform (⚠️ **manufactures per-run detail
that never existed** — do not do this).

### 6.3 ✅ CLOSED — clock trust. Jake said yes; Round 13 shipped it.

Every date was client-stamped. A student who changes the Chromebook clock files
work under the wrong day, or distorts a WPM interval. `serverAt: serverTimestamp()`
now lands on every `typing_sessions` rollup alongside the client `timestamp`, and a
divergence between them is **a cheat signal in its own right**.

⚠️ **NOTHING READS IT YET, ON PURPOSE.** No total derives from it, no panel shows
it. A comparison against history is worthless on the day it ships and valuable a
term later, so the write side went in during the quiet round. The read side is
step 3's business at the earliest.

⚠️ **AND IT MUST NEVER ACQUIRE A CLIENT-SIDE FALLBACK.** A `serverAt` written from
`new Date()` agrees with `timestamp` by construction, so the divergence is
permanently zero and the field reports "no tampering" whether or not there was
any. Absent is honest; approximated is a lie wearing the name of a trusted source.
`session-log.js` omits the field when it has no injected `serverTimestamp`, and
`session-merge-test.mjs` asserts the absence of a fallback against the source text.
(Round 13, invariant 74.)

### 6.4 Retention

`typing_sessions` has a **120-day TTL**. If totals derive from sessions, then on
day 121 last spring's numbers begin silently shrinking. ⚠️ **This is a correctness
bug waiting on a calendar.** Either extend retention past a school year, or freeze
a per-week archive document once a week closes. Recommend the archive: it bounds
storage and gives a stable record for grading disputes.

---

## §7. Build order

Staged so each step is separately deployable and separately revertible. ⚠️ **Do
not collapse these into one round.** Round 12 shipped a rewrite and a diagnostic
in one afternoon and got both wrong.

1. ✅ **DONE — `serverAt`** (§6.3). Round 13 (Ludlow), 2026-08-18.
   `session-log.js` v1.1.0 stamps it at write time from an injected
   `serverTimestamp`; `game.js` v3.23.1 and `learn.js` v2.7.1 inject it. No rules
   change and no index change was required — both verified against source, see
   `HANDOFF.md` §3. ⚠️ **The dependency is optional and must stay optional:** Jake
   uploads one file at a time, so there is a window where the module is new and a
   page controller is not, and a required dep would write `serverAt: undefined`,
   which Firestore rejects, which loses a period of sprint detail. Omitting one
   field is the correct degradation. See `HANDOFF.md` §1.3.
1.5. ✅ **DONE — close the open unit.** Round 13 (Ludlow). ⚠️ **This step did not
   exist in v1.0.0 of this document and step 2 was not buildable without it** —
   see §2.6. `logOpenSprint()` / `logOpenRun()` on hide and pagehide; delta writes
   against a watermark; `continuation` records exempt from the 5-second floor
   (`session-log.js` v1.2.0). Adds records only: no total, counter, gate or
   grading input changed. New harness: `open-unit-test.mjs`.

1.75. ⬜ **NEXT — UNIFY THE CLOCK. Ruled by Jake 2026-08-18; scoped in
   `HANDOFF.md` §4.1; not yet built.** Time typed starts at the first keystroke of a
   run, on both sides. Collapse School's two increment sites into one gated
   increment; gate Library's tick on the first keystroke. ⚠️ **This must ship BEFORE
   step 2 and separately from it** — it changes what the counters mean, step 2
   changes where the totals come from, and together a discrepancy has two candidate
   causes. ⚠️ **It moves every student's recorded minutes down on the day it ships**,
   Library more than School. That is a correction, but tell Jake the size first and
   record the date, or a week-over-week comparison across the boundary reads as a bug.

2. ⬜ **THEN — make `typing_logs` derived.** ⚠️ **Read §2.6 AND §2.7 first.**
   §2.7 is now decided but the split it describes is only closed once step 1.75 has
   shipped — until then a School day's sessions legitimately sum to less than its
   counter. Write it by summing the day's sessions rather
   than from the live counter. ⚠️ **This is the change that closes §2.4** and is
   the highest-value step in the list.
   ⚠️ **AND IT HAS A SECOND PREREQUISITE NOBODY HAS BUILT: session records are not
   TIMELY.** They are created only at unit boundaries and on hide/pagehide, while
   `typing_logs` is rewritten from the live counter every five minutes so a teacher
   can see mid-period. A student twenty minutes into an uninterrupted chapter has
   twenty minutes in the counter and zero session records — so a derived
   `typing_logs` would sit flat at their last completed unit for that whole period.
   Found by Round 14 reading the writers. `HANDOFF.md` §4 carries it.
3. **Make `stats/time_tracking` a rebuildable cache** and add a "rebuild from
   sessions" action to `reports.html`, replacing the §7.2 audit — an audit that
   detects drift becomes unnecessary once drift can simply be recomputed away.
4. **Weekly archive + retention** (§6.4).
5. **Retire the audit** once 2 and 3 have run clean for two weeks.
6. **Optional, low priority:** align tick resolution to 100 ms on both sides
   (§2.2). Precision only — ⚠️ **not a licence to touch the threshold values.**

---

## §8. Things that must not happen

- ⚠️ **Do not re-gate the stats write on `final`.** See `HANDOFF.md` §7.1. The
  ~$85/year it saves is the price of the entire week of 2026-08-18.
- ⚠️ **Do not write a daily or weekly total from a live in-memory counter once
  sessions exist.** That is §2.4 rebuilt by hand.
- ⚠️ **Do not add a fourth document holding the same quantity.** If a new view
  needs a total, derive it or cache it explicitly as a rebuildable cache, and say
  so in the file header.
- ⚠️ **Do not answer the next divergence with a better audit.** See §3.
- ⚠️ **Do not unify the 2s/3s idle thresholds.** They are fitted to two different
  populations on purpose (§2.2). Round 12 called this a defect and was wrong.
- ⚠️ **Do not reset a sprint or run counter without resetting its log
  watermark.** §2.6. The result is not a crash; it is a sprint that records
  nothing until it outgrows the previous one. (Round 13.)
- ⚠️ **Do not treat "session sum ≠ daily counter" as corruption in School.** §2.7.
  The two clocks have different gates on purpose.
- ⚠️ **Do not add a `clientAt` field.** §4's schema names one; `timestamp` already
  is it. Two names for one quantity in one document is the same mistake as two
  documents holding one quantity, at smaller scale. (Round 13.)
- ⚠️ **Do not let `serverAt` fall back to a client clock.** §6.3. It would be a
  field that certifies its own honesty.
- ⚠️ **Do not build any of this without re-reading §2.** Every claim there was
  verified against source on 2026-08-18; every claim Round 12 made *without* doing
  that turned out to be wrong.
