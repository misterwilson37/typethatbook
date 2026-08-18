# HANDOFF — Round 12 (Caligraph)

> ⚠️ **AMENDED 2026-08-18, same day.** The audit shipped in `reports.html`
> v2.10.0 was wrong and gave a false all-clear across ninety students. The stats
> flush gate was also wrong and is the root cause of the divergence. Both are
> fixed in v2.11.0 / `game.js` v3.23.0 / `learn.js` v2.7.0. **Read §7 before §2.**

<!-- HANDOFF.md v12.0.0 — Round 12, instance "Caligraph", 2026-08-18.
     ⚠️ SUPERSEDES Round 11, archived as HANDOFF-round11.md. Round 11's §3.3,
     §4 (invariants 56–63) and §6 remain LOAD-BEARING and are not restated here.
     Round 8 §4 (invariants 37–55), §7, §8, and Round 7 §5 and §8 are also still
     live. Go and read them. -->

**Instance:** **Caligraph** (12) · Bar-Lock (11) · *(Round 10 — unnamed)* ·
Remington (9) · Yost (8) · Hammond (7) · Noiseless (6) · Mignon (5) · Oliver (4)
· Blick (3) · Dvorak (2) · Underwood (1) · *other projects:* Stedman, Fable,
Trilby, Vernier

> *On the name:* the Caligraph had no shift key. To type capitals it carried a
> second complete set of keys — seventy-two of them, two full alphabets, one
> machine. It worked, and it was the wrong answer: the Remington's shift did the
> same job with one mechanism instead of two.
>
> This round was that shape twice. `game.js` had a sprint logger and `learn.js`
> had none, so School wrote no session history at all — not two copies that
> drifted, but one copy and an absence, which is the same failure with nothing to
> grep for. And the additive stats merge existed in both files, identically wrong
> in both. The fix in each case was one mechanism where there had been two: a
> shared module, and a shared function name with a test asserting the copies agree.

---

## §0. What this round was

One student, one report: *"his screen says 40 minutes for the week, the admin
panel says 20."* That unwound into three defects and one missing capability.

1. **The doubled week counter.** A 24-hour auth session expiring mid-period, read
   by the app as a guest arriving for the first time.
2. **School has never logged session detail.** Not a regression. An absence,
   since v3.4.0, that grew invisible as lesson mode grew.
3. **Sprint rollups dated at flush time**, so a queue surviving overnight filed
   yesterday's work under today.
4. **Nothing on a student's screen identified them**, so a verbally reported bug
   could not be tied to a database row.

⚠️ **THE COMMON SHAPE:** every one is a place where the code answered a question
it could not see the answer to. Is this a guest or an expired session? Which day
did this sprint happen on? Which child is this? In each case something was
*inferred* that should have been *carried* — and the fix is to carry it:
`sessionExpired`, a per-record `date`, a visible uid.

---

## §1. The defect in full, because the asymmetry is how it was found

The screenshot showed 2026-08-17 at 20m06s and 2026-08-18 at 0m, while the HUD
said 40 minutes for the week. He typed three minutes and it jumped.

1. Page opens signed in. `loadUserStats()` seeds `secondsWeek = 1206`.
2. The 24-hour token lapses mid-period. `onAuthStateChanged` fires with `null`.
   **`statsData` is not reset by this** — it is module state, and a sign-out is
   not a page load.
3. The drill tick keeps incrementing; it never checked auth. Meanwhile
   `logSession()`, `markDirty()`, `walSave()` and `flushStats()` all early-return
   on a falsy user, so the work is neither saved nor reported as unsaved.
4. `anonSecondsAccum` also increments on a falsy user, so the **guest ladder**
   arms and fires at 60 seconds. The student signs back in.
5. `retroactiveSaveAnonSession()` runs `statsData.secondsWeek += server.secondsWeek`.
   1386 + 1206 = 2592. **40 minutes.**

⚠️ **WHY THE DAY COUNTER STAYED CORRECT, AND WHY THAT MATTERS MORE THAN THE BUG.**
The merge has two branches, guarded on `lastDate === today` and
`weekStart === thisWeek`. `stats/time_tracking` is written only on a **final**
flush, so that morning it still carried *yesterday's* `lastDate` — the day branch
was skipped, the week branch fired. Week doubled; day did not.

That asymmetry is the fingerprint. It is also what makes the damage
**repairable**: `typing_logs` is written on *every* flush from `secondsToday`,
which was never doubled, so it is an independent, uncorrupted record of the same
quantity. **The correct week total is the sum of the daily logs.** Computed, not
guessed. That is what the new audit in `reports.html` does.

### ⚠️ THE FIX IS NOT max(), AND THIS IS THE PARAGRAPH TO RE-READ

The obvious repair is `max()` instead of `+`. It is wrong, and wrong *silently*,
which is worse than the bug it replaces. `max()` is right for the expired session
and destroys a true guest who typed earlier in the day on another machine:
`max(server 10, local 20)` keeps 20 instead of 30.

Sum is right in one case, max in the other, and **neither can tell the cases
apart** — the missing information is not in either number. What was missing is
*how much of the live counter came from the server in the first place*. So that
is now recorded:

```
statsBaseline               = statsData at the moment Firestore was read
this browser's contribution = statsData - baseline
merged                      = server + contribution
```

Right in both cases, because a true guest's baseline is zero and the formula
collapses back into the original sum. `session-merge-test.mjs` asserts both cases
and the idempotence of merging twice.

⚠️ **The baseline is captured in `loadUserStats()`, ABOVE `statsWalRecover()`.**
A recovered WAL tail is this browser's own unflushed work and belongs on the
contribution side. Move the capture below the recovery and a re-auth silently
discards whatever the WAL just replayed.

---

## §2. Version state

`npm test` → **20 of 21 harnesses pass.** The one failure is pre-existing; §5.

| file | version | changed? | upload? |
|---|---|---|---|
| `session-log.js` | **1.0.0** | ⚠️ **NEW FILE** | **YES — 1st** |
| `game.js` | **3.23.0** | ⚠️ yes — merge, expired-session, rollups, id stamp | **YES — 2nd** |
| `learn.js` | **2.7.0** | ⚠️ yes — same, plus session logging that never existed | **YES — 3rd** |
| `versions.js` | **1.5.0** | registers `session-log.js` | **YES — 4th** |
| `reports.html` | **2.11.0** | sprint detail, id chips, the week audit | **YES — 5th** |
| `anon-ladder-test.mjs` | 1.1.0 | teaches the harness about `sessionExpired` | commit it |
| `session-merge-test.mjs` | 1.0.0 | **NEW** | commit it |
| `run-all-tests.mjs` | — | registers the new harness | commit it |
| `firestore.rules` | 2.3.0 | **NO — verified unnecessary, see §3** | no |
| `firestore.indexes.json` | — | **NO — verified unnecessary, see §3** | no |

⚠️ **UPLOAD `session-log.js` FIRST.** `game.js` and `learn.js` both import it; a
page loading either before the module exists throws on import and renders nothing
at all. There is no graceful degradation for a missing module.

**Deploy check:** (see also §7) the Lessons footer reads `School v2.7.0`; the Library footer
reads `game.js v3.23.0`. Both student pages show a small grey `ID xxxxxxxx` in
the bottom-left once signed in — **if that is missing, the new code is not
running**, and it is the fastest check available.

---

## §3. Why there is no rules change and no index change

Both were checked rather than assumed, because either needs a console paste and
Jake has no CLI.

- **`firestore.rules`.** The `typing_sessions` create rule requires `uid`,
  `seconds` in range, `sprints` a list of ≤ 200, and `expiresAt` a timestamp.
  `session-log.js` satisfies all four by construction — the 200 cap is where
  `RECORDS_PER_DOC` comes from. The new `source` field needs no permission: that
  match block has **no `keys().hasOnly()`**, deliberately (see the comment above
  `validDailyLog`), so an added field is not denied.
- **`firestore.indexes.json`.** The drill-down query is
  `where('uid','==',…) && where('date','==',…)` — equality only, and neither
  field is exempted from automatic single-field indexing in the overrides block.
  Equality-only queries need no composite index.

⚠️ **If you add an `orderBy` or a range filter to that query, this stops being
true** and you will need a composite index, which is a console change.

---

## §4. Invariants added this round (continuing Round 11's numbering)

64. **A merge needs a baseline, not a bigger hammer.** When reconciling a local
    counter against a stored one, record what the stored one *was* at read time.
    `sum()` and `max()` are both guesses at the same missing fact, and each is
    silently wrong in the case the other handles.
65. **`null` user means two different things.** "Never signed in" and "token
    expired" need opposite handling everywhere they are tested — 29 such tests in
    `game.js` alone. Carry the distinction; do not infer it.
66. **A sign-out is not a page load.** Module state survives it. Any code assuming
    an unauthenticated page has zeroed counters is wrong.
67. **A record is dated when it happens, not when it is written.** Anything queued
    for later delivery must carry its own timestamp, or a delayed flush relabels
    history.
68. **An absence is a divergence with nothing to grep for.** Two copies that
    disagree can at least be diffed. One copy and a missing one cannot, and the
    missing side stays invisible until somebody asks for the feature it never had.
69. **A test that reimplements the code it tests passes after that code is
    deleted.** `chunktest.mjs` did exactly this. A harness must *read the shipped
    file* — lift it, import it, parse it — or it is testing a fossil.
70. **Lifting a function into a sandbox makes every new module-scope reference a
    ReferenceError.** Invariant 62 again, and it fired again the moment
    `anonNudgeDue()` gained `sessionExpired`. Adding a dependency to a lifted
    function means updating its harness in the same commit.

---

## §5. Known problems left standing

1. ⚠️ **`chunktest.mjs` is testing deleted code.** It reimplements the v3.9.2
   rollup loop inline rather than reading `game.js`, so it kept passing after the
   logic moved into `session-log.js`. `session-merge-test.mjs` Part B is its real
   replacement and drives the actual module. **Delete `chunktest.mjs` or rewrite
   it to import — do not leave a green tick on a fossil.** Left standing this
   round only because deleting a passing test on the same day as a student-facing
   fix is how you lose an afternoon.
2. ⚠️ **The day counters can be doubled too, and this round cannot detect it.**
   If a student had already triggered a final flush earlier the same day,
   `lastDate` matched and the day branch fired as well — so the inflated value
   reached `typing_logs`, and `typing_logs` is the audit's yardstick. Those days
   look self-consistent and the audit passes them. The per-run detail is the
   check: a day whose logged minutes far exceed the sum of its session rollups is
   the signature. **From v2.6.0 forward this cannot recur**, but historical days
   may carry it.
3. **`metadata-map-test.mjs` — 42 of 487 assertions fail.** Pre-existing and
   unrelated: Gutenberg-sourced EPUBs report a `gutenberg.org` origin where the
   harness expects Standard Ebooks. A bookclean/import metadata question.
4. **`audit-versions.mjs` header budgets.** Unchanged from Round 11 and made
   slightly worse: `game.js` and `learn.js` each gained a history entry. Round 11
   called this the cheapest real task available; it still is, and it still needs
   `CHANGELOG.md`'s stale index fixed first (it claims `game.js` v3.14.0,
   `learn.js` v2.2.4, `lessons-admin.js` v1.7.1).
5. **`resume-path-test.mjs` still does not exist** and `learn.js` still asserts in
   a comment that it does. Round 11 flagged this; still true.
6. **`renderIdStamp()` is duplicated in `game.js` and `learn.js`.** Fifteen lines,
   marked *change one change both*. ⚠️ That is exactly the judgement that produced
   defect 2 above. If it grows, extract it — this note is the tripwire.
7. **App Check is initialized but not enforced.** Unchanged. Read the App Check
   block in `firebase-config.js` before clicking Enforce.

---

## §6. For Jake, operationally

- **Upload order: `session-log.js`, `game.js`, `learn.js`, `versions.js`,
  `reports.html`.** The first is not arbitrary ordering — see §2.
- **Finding the student tomorrow: you should not need him.** Open Reports, set
  the range to cover **Monday 2026-08-17 onward**, Generate, then
  **Audit Week Counters**. It reads one `stats/time_tracking` doc per student
  (~30 reads for a class), compares each stored week total against the sum of
  that student's daily logs, and lists anyone whose stored value is higher.
  Anything flagged **"exactly doubled"** is this defect with high confidence.
  **Fix** rewrites only the three week fields to the computed correct value.
- ⚠️ **The audit needs the window to cover the whole week.** If it does not, the
  daily sum is a partial and any excess is meaningless — those students are listed
  separately as unverifiable rather than accused. Widen the range and re-run.
- **The id stamp** is bottom-left on both student pages, showing the first eight
  characters of the uid. Click copies the full value. Reports shows the same eight
  beside each name, so a child reading eight characters aloud is enough to find
  their row.
- **The drill-down now expands twice:** click a date for the rollups, and each
  rollup lists its individual runs with per-run WPM, accuracy and clock time.
  🚩 marks a run much faster than that student's *other* runs the same day —
  measured against the mean of the others, so a fast run cannot raise the bar it
  is judged against and hide itself. **This works retroactively on every rollup
  already in the database**; the detail was always stored and never displayed.
- **School session history starts from today.** There is nothing to recover for
  earlier days because nothing was ever written. Library days are all there.


---

## §8. ⚠️ NEXT ROUND STARTS HERE — read `DESIGN-TELEMETRY.md`

Jake asked for a telemetry design that survives interruption, measures School and
Library identically, tracks by day/lesson/sprint, and lets him **delete a bad
record and have the totals change**. That last requirement cannot be met by the
current data model, so it is an architecture question, not a patch.

`DESIGN-TELEMETRY.md` v1.0.0 is the proposal. **Nothing in it has been built.**
Its §2 is verification-only — every claim read out of shipped source — and it
contains two findings Round 12 did not previously know:

* ⚠️ **`typing_logs/{uid}_{date}` is one document shared by BOTH page controllers**,
  each writing its own in-memory counter over the other's. A student who does ten
  minutes in School and then opens Library can have that work overwritten. **A live
  data-loss path, today, independent of everything else this round fixed.**
* ⚠️ **The idle thresholds differ — 2s in Library, 3s in School** — so the two
  sides do not measure the same thing, and Jake grades on time typed.

Idle pause itself was verified **working on both sides**; Jake's memory of the
original behaviour was correct, and it survived every intervening round.

⚠️ **§6 of that document needs Jake's decision before code is written** — chiefly
which idle threshold both sides should adopt, since it moves every student's
recorded minutes on the day it ships.

---

## §7. ⚠️ AMENDMENT — the two things Round 12 got wrong on the first pass

Both were found within hours of shipping, by Jake, from live data. Both are the
same class of error: **a check that could not fail loudly.**

### 7.1 The stats rollup and the daily log had different write triggers

`typing_logs` was gated on `walDirty || final`. `users/{uid}/stats/time_tracking`
was gated on `final` alone. **The same numbers, on two schedules.** Round 11 made
that trade deliberately to save ~$85/year, reasoning the rollup was "only ever
read at page load and the WAL now covers it anyway."

The first half was true. The second half assumed a write-ahead log that always
survives, on hardware shared between students. Observed consequences:

* **Roughly half of ninety students had no stats document at all.** A `final`
  flush needs a page-hide gap or a deliberate exit; a child closing a Chromebook
  lid mid-sentence produces neither. Those students' week counters were being
  rebuilt from localStorage alone — which is why one showed 11:00, then 15:30,
  then 26:23 across refreshes, matching nothing.
* Students who *did* have the document held a value from whenever their last
  final flush happened to land, so reports and the HUD disagreed even for
  students with no corruption whatsoever.

**Fixed:** the rollup now shares the daily log's trigger in both files. Cost is
about one extra write per five minutes of active typing — ~900/day across Ellis,
inside the free tier, ~$7/year even at the district population SCALE-PLAN models.

⚠️ **Invariant 71: two records of the same quantity must share a write trigger.**
Not "be flushed often enough" — *share a trigger*. Any staleness budget you grant
one and not the other is a divergence you have agreed to and will be debugged
later by someone who does not know you agreed to it.

### 7.2 The audit anchored the week on Monday; the app anchors on Saturday

`getWeekStart()` in both page controllers returns **the Saturday** starting a
Sat–Fri school week. There is a harness named for that boundary. The v2.10.0
audit computed Mondays.

So every stored `weekStart` failed to match every computed one, no day ever fell
inside the week, and the not-covered branch `continue`d — **silently**. The panel
then printed "no inflated week counters found." Ninety students examined: zero.

The confirmed case it missed, once read directly from Firestore:

| field | stored | daily-log sum | excess |
|---|---|---|---|
| `secondsWeek` | 2868 | 1662 | **1206 — exactly 08-17's seconds, twice** |
| `charsWeek` | 6816 | 4271 | **2545 — exactly 08-17's chars, twice** |
| `mistakesWeek` | 561 | 353 | 208, solving cleanly to an integer |

Three fields, one extra copy of one day, each independently confirming the
additive merge in §1.

**Fixed in v2.11.0:** Saturday anchor lifted verbatim from the app, plus
`week-anchor-test.mjs`, which lifts *both* functions from the shipped sources and
asserts they agree — the failure was invisible from inside either file, because
each was internally consistent.

⚠️ **Invariant 72: an audit may never have a silent skip.** Every subject lands in
exactly one named bucket, every bucket is counted on screen, and the totals are
printed so they can be checked by eye. "Could not be examined" and "passed" are
opposite findings and must never render identically. The rewritten panel shows
correct / inflated / under-counted / no-stats-doc / unverifiable / read-error /
no-logged-days, and flags it in red if they fail to sum to the roster.

⚠️ **Invariant 73: a constant copied from another file must be tested against that
file, not against your reading of it.** The Monday anchor was not a typo — it was
a confident assumption never checked against the source twelve feet away.

### 7.3 What is still not verifiable

Unchanged from §5.2 and worth restating because it now bounds the repair: if a
student hit the additive merge on a day when their stats doc had **already** been
written that day, the day counter doubled too, and that value went into
`typing_logs` — which is the audit's yardstick. Those days look self-consistent
and are counted as correct.

Session rollups are the independent check where they exist: all Library days, and
School only from 2026-08-18. **For School days before 2026-08-18 there is no
second record and there never will be.** If those daily figures matter, they have
to be judged against what a period can physically contain.
