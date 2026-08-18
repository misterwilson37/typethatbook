# DESIGN — Typing telemetry, one honest number

**DESIGN-TELEMETRY.md v1.0.0** · drafted 2026-08-18 by Round 12 (Caligraph)
**Status: PROPOSED. Not built. Nothing in this document has shipped.**

Read `HANDOFF.md` §7 first — it explains the two defects that produced this
document, including two that Round 12 itself shipped and then had to withdraw.

---

## §1. What Jake asked for, in his words

> "I need to be able to track how long and how well each student types, even if
> they're interrupted in the middle. It needs to work as well in learn as it does
> in game (and vice versa!). It needs to track by lesson, sprint, and day so that
> if a kid cheats or one gets corrupted, we can narrow it down and I can delete
> it."

Four requirements, and they are the acceptance criteria for anything built here:

- **R1 — Durable.** An interruption never costs recorded work.
- **R2 — Symmetric.** School and Library measure the same thing the same way.
  Time typed is a grade; a student must not be advantaged by which side they use.
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

### 2.2 ⚠️ But the two sides do not measure the same thing (R2)

The thresholds differ — **2 seconds in Library, 3 seconds in School.** A student
who pauses 2.5 seconds between words banks the time in School and loses it in
Library. Over a period of ordinary hesitation this is not a rounding error, and
Jake grades on time typed.

The tick resolutions also differ. Library accumulates in 100 ms slices and is
accurate to the tenth; School tests once per second, so a run of 2.9-second gaps
is sampled differently. Two students doing identical work on opposite sides get
different numbers.

⚠️ **R2 IS CURRENTLY FALSE AND NOBODY HAS NOTICED**, because until Round 12 there
was no per-run detail on the School side to compare against.

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
  serverAt        serverTimestamp()          ⚠️ new — see §6.3
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

### 6.1 ⚠️ Unify the idle thresholds — which number?

R2 cannot be satisfied while Library is 2s and School is 3s. **This changes
recorded minutes**, so it is Jake's call, not the next instance's:

- **2 seconds** — stricter. School totals will drop slightly. Matches the side
  where students spend the most graded time.
- **3 seconds** — more forgiving. Library totals rise slightly. Kinder to
  beginners hunting for keys, which is most of School's population.
- **A new number** — 2.5s splits it and makes both sides move.

**Recommendation: 3 seconds, with the 100 ms tick from `game.js` on both sides.**
A struggling typist looking for a key is doing the work; a 2-second cutoff
penalises exactly the students the lessons exist for. ⚠️ **Whatever is chosen,
announce it — every student's minutes shift slightly the day it ships**, and a
grade that moves without explanation is worse than either threshold.

### 6.2 Historical data

School has no session records before 2026-08-18 and never will. Options: leave
history in `typing_logs` and treat sessions as authoritative going forward
(**recommended, simplest, honest**), or backfill synthetic single-session records
from the daily logs so the schema is uniform (⚠️ **manufactures per-run detail
that never existed** — do not do this).

### 6.3 Clock trust

Every date is currently client-stamped. A student who changes the Chromebook clock
files work under the wrong day, or distorts a WPM interval. Adding
`serverAt: serverTimestamp()` alongside `clientAt` costs nothing and makes a
divergence between them **a cheat signal in its own right**. Recommend yes.

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

1. **Unify the idle thresholds and tick resolution** (§6.1). Small, self-contained,
   satisfies R2, and needs Jake's number first. Ship alone, watch one day of data.
2. **Add `serverAt`** (§6.3). One field, no behaviour change.
3. **Make `typing_logs` derived.** Write it by summing the day's sessions rather
   than from the live counter. ⚠️ **This is the change that closes §2.4** and is
   the highest-value step in the list.
4. **Make `stats/time_tracking` a rebuildable cache** and add a "rebuild from
   sessions" action to `reports.html`, replacing the §7.2 audit — an audit that
   detects drift becomes unnecessary once drift can simply be recomputed away.
5. **Weekly archive + retention** (§6.4).
6. **Retire the audit** once 3 and 4 have run clean for two weeks.

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
- ⚠️ **Do not build any of this without re-reading §2.** Every claim there was
  verified against source on 2026-08-18; every claim Round 12 made *without* doing
  that turned out to be wrong.
