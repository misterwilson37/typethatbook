# HANDOFF ARCHIVE — TypeThatBook, Rounds 15–20

<!-- ARCHIVE.md v1.0.0 — split out of HANDOFF.md by Round 23 (Empire),
     2026-08-20, under ROADMAP item 7: "Cap HANDOFF.md. Past 200 KB nobody
     reads it, which is how a blocker sat unread in the repo for a full
     session." It was at 237 KB.

     ⚠️ THIS IS NOT A SECOND HANDOFF AND MUST NEVER BECOME ONE. §0 rule 1 —
     never fork the handoff — still stands, and this file is the reason it can:
     it is a READ-ONLY record of rounds already closed. NOTHING here is a plan,
     a blocker, or an instruction. Every claim that still governs the code was
     LIFTED INTO HANDOFF.md's own text before this file existed, in HANDOFF's
     own words, exactly as §0 rule 2 requires. If you find yourself needing
     something from here to do your job, that is a bug in HANDOFF.md — fix it
     THERE, do not start citing this.

     ⚠️ DO NOT ADD TO THIS FILE except by archiving a section that has been
     superseded, and only after its live conclusions are in HANDOFF.md.

     What is here: the round-by-round narratives for Rounds 15 through 20 —
     the typing_sessions overlap and the Stage 2 revert, the interval UNION vs
     the deduped SUM, the `WHERE`-clause divergence, the per-source document
     design the deployed rules reject, the reconciliation view and rebuild-all
     (both DELETED in Round 23), the repository reorganisation, and the source
     split that shipped and was reverted. -->

## §0.-6. ⚠️⚠️⚠️ ROUND 21, SECOND PASS — THE ROADMAP, AND A CORRECTION TO §0.-5

**`ROADMAP.md` is a new file at the repo root and it is the plan of record.** It
answers a question nobody had asked in writing: *is this salvageable?* Summary,
so this document is not silently dependent on that one:

**Salvageable as a learning tool — it already is. NOT salvageable as an
accountability tool in its current architecture**, and no amount of bug-fixing
gets there, because the graded number is written by the student's own browser.

### 0.-6.A ⚠️ CORRECTION TO §0.-5 — "THE LOG ONLY UNDERCOUNTS" IS UNSUPPORTED

§0.-5.J and the Round 21 brief both lean on §3.1 losing time in one direction.
**Jake's own 2026-08-19 reconcile screenshot contradicts it.** 08-19 is the first
day with full session coverage on both modes, and its DOWN list is long:
`10m 7s → 5m 33s`, `9m 14s → 5m 2s`, `12m 20s → 9m 56s`. On a one-directional
defect that list would run the other way.

⚠️ **THE HONEST STATEMENT IS THAT NOBODY KNOWS WHICH DIRECTION THE ERROR RUNS**,
because the log and the sessions **measure different quantities** — see 0.-6.B.
Do not tell a teacher the number is a floor.

### 0.-6.B ⚠️⚠️ THE LOG AND THE SESSIONS ARE NOT TWO COPIES OF ONE NUMBER

Six rounds have reconciled them as though one is right. **Neither is.**

* The **day counter** ticks once per second whenever the student is inside the
  idle window. It runs during pauses *inside* a sprint.
* A **session rollup** records a completed sprint, floored at 5 seconds,
  watermarked, only when the sprint closes.

**A clean day of real typing produces log > sessions before any bug is
involved.** The Δ only becomes evidence once someone establishes what that
structural difference normally is, and **nobody ever has.** That measurement —
`log ÷ union` across a class on a clean day — is `ROADMAP.md` Phase C2 and it is
the input every rebuild decision has been missing.

### 0.-6.C ⚠️ NEW DEFECT — THE TWO MODES DO NOT COUNT THE SAME MINUTE

```
game.js:370   IDLE_THRESHOLD       = 2000    // Library stops counting at 2s
learn.js:520  LEARN_IDLE_THRESHOLD = 3000    // School keeps counting to 3s
```

**Library and School credit identical work differently, and the two figures are
then added into one graded total.** For a hunt-and-peck student whose keystroke
gaps cluster at 2–3 seconds this is a large fraction of recorded time. It has
been there the whole time, on both sides of the number every round has been
reconciling. It violates Jake's standing rule — *"Learn and game, of course.
Everything should do both"* — with a constant.

⚠️ **CHANGING IT IS A MEASUREMENT CHANGE, NOT A BUG FIX.** It moves every
student's minutes. Jake picks the value and it gets announced. `ROADMAP.md` C1.

### 0.-6.D THE FOUR DECISIONS THAT BLOCK EVERYTHING, AND NOTHING ELSE DOES

1. §0.-5.C — the §3.1 fix shape. **Recommendation: per-source fields.**
2. The v3.29.x double-count window — special-case it or repair by hand?
3. The idle gate value (0.-6.C).
4. ⚠️ **Is a minute a grade at all?** `ROADMAP.md` §6 lays out the only two
   honest options: stop grading minutes and grade chapters/lessons/characters
   instead, or derive the total server-side in a Cloud Function where the student
   cannot reach it. **There is no third option**, and the first makes the rest of
   the roadmap optional.

⚠️ **`ROADMAP.md` PHASE A CARRIES ZERO STUDENT RISK AND NEEDS NO DECISION.**
Register the five orphan harnesses, fix the two lying version headers, repair the
rules-suite seed, and build the tab-lifetime harness. **A successor with time and
no ruling from Jake should do Phase A, not write another document.**

---

## §0.-5. ⚠️⚠️⚠️ ROUND 21 (Hammond) — §0.-4.C's FIX IS NOT DEPLOYABLE. EXECUTED EVIDENCE, NOT READ EVIDENCE.

**Written 2026-08-20, after midnight. This round wrote no application code.** It
ran the Firestore rules emulator — which every previous round recorded as
impossible — and checked the plan §0.-4.C left behind. The plan fails against
the deployed rules. Read this before implementing anything in §0.-4.C.

> **Naming.** Hammond. The Hammond typewriter struck every character with
> identical force regardless of how hard the typist hit the key — a uniform
> impression under any pressure. Round 20's failures were all assertions made
> under time pressure and corrected only after Jake pushed. This round's job was
> to press the same key on every claim.

### 0.-5.A ⚠️ THE EMULATOR RUNS. IT HAS ALWAYS RUN. NOBODY TRIED.

`tests/firestore-rules.test.mjs` carries this line at the top:

> *⚠️ I COULD NOT RUN THIS. The Firestore emulator downloads its jar from
> storage.googleapis.com, which isn't reachable from my sandbox.*

That sentence was copied forward through four rounds and is **false**. The
sandbox has `java` (OpenJDK 21) and `node` v22, and `storage.googleapis.com` is
reachable. The emulator jar (`cloud-firestore-emulator-v1.22.0.jar`) downloads in
seconds. Setup, start to finish:

```
npm install --no-save firebase-tools @firebase/rules-unit-testing firebase mocha
# firebase.json → { "firestore": { "rules": "firebase/firestore.rules" } }
npx firebase emulators:exec --only firestore --project demo-ttb \
    "npx mocha tests/rules-probe.test.mjs --timeout 20000"
```

⚠️ **EVERY RULES CLAIM IN THIS DOCUMENT BEFORE §0.-5 WAS MADE BY READING.** Rules
are the one file in this project with no test path Jake can run himself — §B.4
says so — and that is exactly the file five rounds reasoned about instead of
executing. **A future round that says "I cannot run the rules" is repeating a
copied sentence, not reporting a fact.**

### 0.-5.B ⚠️⚠️ THE §0.-4.C FIX IS DENIED BY THE DEPLOYED RULES

`tests/crossmode-overwrite-test.mjs` Part C goes green on per-source **document
ids** — `{uid}_{date}_school`, `{uid}_{date}_library`. Against `firestore.rules`
v2.5.0 that write returns:

```
PERMISSION_DENIED: false for 'create' @ L392 ... false for 'create' @ L662
```

The binding at L392/L412 is `docId == request.auth.uid + '_' +
request.resource.data.date`, added in v2.3.0 to cap the collection at one
document per student per day. A third segment fails it. **The harness models a
design production rejects, and it models it in green.** Round 20 discovered this
in its final minutes and never got it into §0.-4.C, which still reads as though
the fix is designed and ready.

⚠️ **THIS IS THE RULE 9 CASE, EXACTLY.** If per-source documents are the chosen
shape, the rules change **is** the round and ships first, alone, verified.

### 0.-5.C ⚠️ THE CHEAPER SHAPE NEEDS NO RULES CHANGE — AND ITS BLOCKER IS ON THE READ SIDE

`validDailyLog()` has accepted the **split-field** shape since v2.4.0, and it was
never rolled back when game.js v3.30.0 / learn.js v2.15.0 reverted the writers.
Executed against v2.5.0, all three of these succeed for a student on their own
document:

| write | result |
|---|---|
| create carrying ONLY `secondsLibrary`/`charsLibrary`/`mistakesLibrary` | ✅ allowed |
| merge `secondsSchool`/`charsSchool`/`mistakesSchool` onto the same document | ✅ allowed |
| a document carrying flat **and** both split triples | ✅ allowed |
| create at `{uid}_{date}_school` | ❌ **denied** |

**So the write side is already open and the read side is the blocker.** Both
readers are legacy-first and identical by design:

* `daylog.js` `totalsOf()`
* `reports.html` `readLogTotals()`

Both say: *if `seconds` is present at all, return it and ignore the splits.* The
probe wrote a document holding `seconds: 90` beside `secondsLibrary: 120` and
`secondsSchool: 240`; both readers return **90**. On any day that already carries
a flat write from the current code — which is every day up to the cutover — a
switch to split fields silently drops everything written after it.

⚠️ **THAT IS A DESIGN DECISION FOR JAKE, NOT A ROUND.** The three candidate
shapes, stated so the next instance does not re-derive them:

1. **Per-source documents** (§0.-4.C). Needs a rules deploy first, alone. Rule 9.
2. **Per-source fields**, readers changed from legacy-first to flat-plus-splits.
   No rules deploy. ⚠️ Double-counts the handful of days written during the
   v3.29.x window, which is precisely why v2.14.0 made the readers legacy-first.
3. **Per-source fields with the flat field frozen** — writers stop writing
   `seconds` entirely, readers sum flat + both splits, and the frozen flat value
   is the pre-cutover remainder. No rules deploy, no migration, no double count,
   because after cutover nothing ever writes flat again. ⚠️ Not tested by
   anything. It is an idea, not a plan.

**No instance should pick one of these on Jake's behalf.**

### 0.-5.D PRIORITY 3 — THE ROSTER READ WORKS. THE BANNER WILL NOT FIRE.

Round 20 shipped `reports.html` v2.21.0's roster sweep and left a warning that a
red **"THE ROSTER READ FAILED"** banner might appear because nobody had checked
whether the rules permit `users` queries. Executed:

| query | result |
|---|---|
| building-scope teacher, `where('classId','==',cid)` | ✅ allowed |
| class-scope teacher, `where('classId','==',cid)` | ✅ allowed |
| building-scope teacher, `where('schoolId','==',sid)` | ✅ allowed |
| super_admin, unfiltered `users` | ✅ allowed |
| signed-in **student**, `where('classId','==',cid)` | ❌ denied — correct |

The class query also returns students whose `users` document carries
`schoolId: ''` or has no `schoolId` field at all — **the day-one and new-school
case the whole v2.21.0 rewrite exists for.** A foreign-school student sitting in
the class does not deny the whole query either.

⚠️ **AND NAMES ARE NOT LOST.** `users` documents only ever carry `classId` and
`schoolId` — game.js and learn.js write nothing else there — so
`readRosterUids()`'s `u.displayName`/`u.email` are always `''`. Roster-discovered
students would render as "Unknown" except that the by-id log read recovers
`displayName` and `email` off the log document itself. Verified by reading the
`runPool` worker: `data.displayName || p.info.name || 'Unknown'`. A student with
a log gets a name; a student with no log produces no row at all, which is
correct.

⚠️ **THE ONE HOLE I LOOKED FOR AND DID NOT FIND.** `readRosterUids()` issues zero
queries when `schoolId === '__all__'` and `classId === '__all__'`, and returns an
empty roster with `rosterOk` still true — a silent partial. It is **not
reachable**: `loadScopeOptions()` offers "All schools" to `isSuper()` only and
defaults every other staff member to their first building. Left as-is, recorded
so nobody re-derives it.

### 0.-5.E ⚠️⚠️ THE RECONCILE SCREEN SHOWS TWO DIFFERENT SESSION NUMBERS AND THE REBUILD USES THE LARGER ONE

From Jake's 2026-08-20 screenshots. **This is the reason the up-moves look
ridiculous and it is not a rendering problem.**

* **⏱ Clock** is the **union of wall-clock intervals** — `union-clock-test.mjs`.
* **Sessions**, and the rebuild's target, is the **deduped sum** —
  `sessionSignature()` then add.

For the §0.-1 student on 2026-08-18 those are **1826s (30m 26s)** and **1941s
(32m 21s)**. The rebuild preview offers `13m 27s → 32m 21s`. It is proposing the
larger of two numbers the same screen is already showing, and the gap between
them — 115s — is real double-counting the dedupe cannot see.

⚠️ **`sessionSignature()` CATCHES IDENTICAL RECORDS, NOT OVERLAPPING ONES.**
Jake's drill-down shows both failure modes side by side on one day:

* Three identical `pinocchio` rollups at 4:55 PM — `0m 23s / 95 WPM / 182 ch`.
  Two are tagged **⧉ duplicate** and excluded. **The dedupe works.**
* The four §0.0.A rollups on 08-18 have **different** sprint stamps and
  **overlapping** windows. Every signature is distinct. **Nothing excludes
  them**, and they are what the +18m 54s is made of.

⚠️ **A STUDENT REPORTED THEIR NUMBER WAS TOO HIGH.** That is the second
independent signal — after the union/sum gap — that the up-moves are inflated.
**Weight it.** It is the only evidence in this entire file that comes from
someone who was actually in the room while the typing happened.

✅ **NOTHING ON THAT SCREEN CAN WRITE.** `rebuild-run-btn` is unconditionally
`disabled` since v2.19.0 and `runRebuildAll()` refuses independently on its first
lines; `union-clock-test.mjs` Part F holds both. The preview is a diagnostic.
**Do not re-enable it to fix a grading week.**

### 0.-5.F THE ONE-MINUTE REPORT IS `RECONCILE_CONCURRENCY = 6`

150 students × 7 days = **1,050 point reads**, issued six at a time. That is ~175
sequential round-trips; at typical Firestore latency it lands almost exactly on
the observed minute. The cost is unchanged either way — the ceiling is round
trips, not documents. Raising the pool is a **staff-only, read-only** change to
one constant and touches no student path. Not done this round; nothing was
shipped this round.

### 0.-5.G ⚠️ `tests/firestore-rules.test.mjs` IS STALE AND FAILS 14 ASSERTIONS — THE TEST IS WRONG, NOT THE RULES

Its own header says *"tests for firestore.rules v1.1.0."* The rules are v2.5.0.
Run as-is: **14 failing.** Every one traces to the test, not the rules:

* It supplies roles as **auth-token claims** (`authenticatedContext(uid, { role:
  'teacher' })`). Rules v2.x read `staff/{uid}` **documents** via `staffDoc()`.
* It seeds exactly one staff document, without `active: true`, which v2.3.0 made
  mandatory — hence `Property active is undefined on object`.
* Class membership moved to `classes/{id}.teacherUids`; the test still uses
  `staff.classIds`.

With **only the seed corrected** — five staff documents with `active: true`,
classes carrying `teacherUids` — the same file runs **48 passing, 4 failing**.
Three of the four are test artifacts: one uid (`TEACHER_EMS`) serves two
different personas that used to be distinguishable only by token claim, and one
class is created without `teacherUids`.

⚠️ **THE FOURTH IS UNRESOLVED AND IS NOT CLEARED.** `"a request with no auth
token at all can read nothing"` bundles three reads —
`getDoc(books/b1)`, `getDoc(typing_logs/…)`, `getDocs(collection(classes))` — and
succeeded where it should fail. **Which of the three passed was not determined.**
`match /classes/{classId}` is `allow read: if signedIn()`, so a token-less read
of it should be denied; that is where to look first. **Do not record this as
closed until someone splits the assertion and runs it.**

⚠️ **ANYONE FOLLOWING THAT FILE'S OWN INSTRUCTION — "please run this before you
let a colleague near real student data" — GETS 14 RED FAILURES AND WOULD
REASONABLY CONCLUDE THE RULES ARE BROKEN.** They are not. Fixing the seed is a
real, small, zero-risk job for the next round.

### 0.-5.H FIVE HARNESSES ARE NOT IN THE SUITE THAT SAYS EVERYTHING IS GREEN

`npm test` prints **ALL 29 HARNESSES PASS**. These exist in `tests/` and are not
registered in `run-all-tests.mjs`:

* `crossmode-overwrite-test.mjs` — ⚠️ **the harness that reproduces §3.1**
* `union-clock-test.mjs` — the overlap measurement §0.-1 rests on
* `week-agreement-test.mjs` — the Rule 11 date-agreement proof
* `firestore-rules.test.mjs` — see §0.-5.G
* `cover-harness.mjs` — known, recorded in `tests/README.md`

⚠️ **THE HARNESS DRIVING THE LIVE DEFECT IS NOT IN THE SUITE THAT REPORTS
GREEN.** All three of the first four that can run do pass or reproduce-as-
expected when run by hand; this is a registration gap, not a hidden failure. It
is also exactly how a green suite stops meaning anything.

### 0.-5.I THE MIDNIGHT ROLLOVER — OBSERVED, NOT DIAGNOSED

Jake's drill-down, 2026-08-20: a Library session rollup at **12:00 AM, 4m 9s,
833 ch**, while the daily-log editor row for that same date reads **0m 6s, 13
chars**. The session record and the graded document disagree by four minutes on
a day six minutes old.

⚠️ **NOT INVESTIGATED. DO NOT ASSUME IT IS §3.1.** The two candidates are the
day-rollover reset in the flush path and the session rollup's own dating scheme
(`session-log.js`), and distinguishing them needs the code read, not a guess.
Recorded because it was seen, on real data, at the moment it happened. It is a
**midnight** defect, not a school-hours one, and it ranks below everything above.

### 0.-5.J STATE OF THE THREE PRIORITIES

**PRIORITY 1 — the student's number equals the teacher's number: MET, and now
tested rather than asserted.** One document, `typing_logs/{uid}_{date}`, read by
id on both sides. `totalsOf()` and `readLogTotals()` are the same logic.
`week-agreement-test.mjs` holds the dates at all 24 hours;
`crossmode-overwrite-test.mjs` Part B holds the harder half — **both readers
agree even when the number is wrong.** Rule 11 is necessary and not sufficient.

**PRIORITY 2 — that number is accurate: OPEN.** §3.1 is reproduced (600 of 1200
seconds lost) and the fix shape is undecided per §0.-5.C. ⚠️ **One correction to
how §3.1 has been described:** with Stage 1 deployed, both controllers seed
today's total from the shared document at load, so a student who does Library
**then** School sequentially loses nothing. The loss needs a **stale or
concurrent tab** — which game.js v3.28.0's own comment says is routine on
MacBooks that do not restart between periods. Real defect, real harness, and the
population size is still unmeasured.

**PRIORITY 3 — the colleague's reports: the reporting path is sound.** §0.-5.D.
His students' totals are as accurate as anyone's, which is to say they carry
§3.1. **The reports are trustworthy as a record of what the daily log says. The
daily log is what is in question.**

### 0.-5.K WHAT THIS ROUND SHIPPED

**No application code.** `HANDOFF.md` (this section), `tests/rules-probe.test.mjs`
(new, runs), `tests/README.md` (the emulator setup, so the next instance does not
re-derive it), and `ROUND-21-BRIEF.md`.

⚠️ **DELIBERATE.** Round 19 shipped a student write-path change overnight and it
is why §0.0 exists. This round started after midnight with two schools typing in
seven hours. **The next round's first job is a decision from Jake on §0.-5.C, not
code.**

---

## §0.-4. ⚠️⚠️⚠️ ROUND 20, THIRD PASS — THE THIRD DIVERGENCE WAS A `WHERE` CLAUSE

**Rule 11 says test the QUERY, not only the arithmetic. §0.-2 tested the
readers and the dates and declared Priority 1 met. It had not tested the SET OF
DOCUMENTS each side looks at. That was the third divergence and it was live.**

### 0.-4.A THE DEFECT

`daylog.js readWeek()` fetches `typing_logs/{uid}_{date}` **by document id**,
unfiltered. Whatever is in that document, the child sees.

`reports.html` queried `where("classId","==",cid)`. A daily log is stamped with
whatever `ttbClassId` held in the browser that wrote it — and **game.js's own
comment above `applyPendingClassAssignment()` states exactly when that is
blank**: a roster-imported student with no Firebase account yet lands in
`pendingClassAssignments/{email}`; if they type a chapter before ever opening
the Lessons page, `ttbClassId` stays `''` and every log that session writes is
stamped `classId: ''`. It self-heals days later.

⚠️ **The document exists, the child sees it, and no class query on the page
could ever return it.** That comment was filed as a reporting inconvenience for
rounds. It is the sacred rule broken by a `WHERE` clause.

⚠️ **IT IS WORST ON DAY ONE OF A ROTATION OR A NEW SCHOOL**, when every student
is unassigned at once. Round 18 named the gap ("needs the class roster as the
iteration source instead of the report") and deferred it as too large.

### 0.-4.B THE FIX — `reports.html` v2.21.0

**Discover by query, read by id.** The class query is now a DISCOVERY pass whose
documents are never summed. The `users` roster is unioned in as a second
discovery source, and every `(uid, date)` is then read with
`getDoc(doc(db,'typing_logs', uid + '_' + date))` — byte-for-byte the read
`daylog.js` performs.

⚠️ **BOTH DISCOVERY SOURCES ARE NEEDED.** The roster finds students whose logs
carry a blank classId; the class query finds students whose `users` document is
missing or stale but who left stamped logs. Neither alone is complete.

⚠️ **A FAILED ROSTER READ IS SAID OUT LOUD, NEVER DEGRADED TO THE OLD PATH.**
Silently falling back produces a report that looks correct and is short by every
blank-classId student — the defect wearing the fix's clothes.

The report line now states the read shape, how many students came from the
roster with no class-stamped log, and how many days the old query could not see.
Cost: (students × days) point reads, ~630 for a class week. `MAX_ROSTER_PAIRS`
refuses above 4,000.

⚠️ **REMAINING HOLE, STATED:** a student with NO `users` document and NO
class-stamped log is invisible to both discovery sources. Closing it needs
`pendingClassAssignments` as a third source, keyed by email→uid. Not done.

### 0.-4.C PRIORITY 2 — §3.1 IS NOW REPRODUCED

`tests/crossmode-overwrite-test.mjs` drives the cross-mode overwrite and it
**loses 600 of 1200 seconds against the shipped build.** Six rounds carried §3.1
as "a known, lived-with defect" and no harness ever drove it — precisely the
shape Rule 10 forbids.

⚠️ **Part B's second assertion is the one to read: BOTH READERS STILL AGREE.**
They read one document, so they show the SAME wrong number. **Rule 11 is
necessary and not sufficient**, and that is Priority 1 versus Priority 2 in a
single line.

Parts C and D show the fix passing: one document per `(uid, date, source)`, id
`{uid}_{date}_{source}`, each controller baselined on ITS OWN source document.
Order-independent, no lock, no increment, no merge policy.

⚠️ **THE FIX IS NOT WRITTEN INTO `game.js`/`learn.js` AND THAT IS DELIBERATE.**
It is a student write-path change across four files. Round 19 shipped exactly
that overnight and it is why §0.0 exists. **It goes out on a non-school evening,
with this harness green, and it is Round 21's first job.** Touching `daylog.js
readWeek()` (fourteen point reads, summed) and `reports.html` (group by
`(uid,date)`) in the same deploy is required — Rule 9: the shared document is
DELETED in the same deploy, not left beside the new ones.

---

## §0.-1. ⚠️⚠️⚠️ ROUND 20 (Corona) — §0.0's DIAGNOSIS IS HALF WRONG. READ THIS FIRST.

**Written 2026-08-19, later still. §0.0 below is kept verbatim because its
EVIDENCE is good and its instructions are still binding. Its CONCLUSION about
which direction the error runs is wrong, and grading on it would have hurt
students.**

### 0.-1.A THE MEASUREMENT §0.0 DID NOT MAKE

§0.0.A lists four rollup documents for one student on 2026-08-18 and observes
correctly that their sprint windows overlap. It concludes that `typing_sessions`
is inflated and that `typing_logs` — while imperfect — is the safer number to
grade on. **Nobody measured how much of the gap the overlap actually accounts
for.** Round 20 measured it. `tests/union-clock-test.mjs` Part E holds the
figures against the real documents:

| quantity | value |
|---|---|
| `typing_logs` (the graded number) | **807s — 13m 27s** |
| sessions, SUMMED (the reconcile screen) | 1941s — 32m 21s |
| sessions, UNIONED over wall-clock time | **1826s — 30m 26s** |
| double-counting the overlap actually causes | **115s — 1m 55s** |
| ⚠️ shortfall in the graded number | **1019s — 16m 59s** |

⚠️ **THE OVERLAP IS REAL AND IT IS SMALL.** It is under two minutes of a
nineteen-minute discrepancy. Remove every trace of double-counting and the
session record still says this child typed **more than twice** what the document
Jake grades on says they typed.

⚠️ **SO THE DOMINANT DEFECT IS `typing_logs` UNDERCOUNTING, NOT
`typing_sessions` OVERCOUNTING.** That is not a new bug. It is §3.1, the
cross-mode overwrite — two page controllers each holding their own in-memory
`statsData` and each `setDoc(merge:true)`-ing the day's total, last writer wins.
It has been a known, lived-with defect since game.js v3.30.0 reverted the source
split, and §0.0 was written in the small hours by an instance that had just
found a scarier-looking problem and did not go back and weigh the two.

**This matters because it inverts the advice.** §0.0.C's refusals are still
right — the rebuild must stay disabled, because "sessions are inflated" was
never the only reason not to bulk-write, and a tool that cannot tell a corrected
log from a gap in the record must not run over 900 documents. But the SECOND
half of §0.0's advice — grade from `typing_logs`, it is the conservative number
— is advice to under-credit most of a roster by half.

### 0.-1.B WHAT WAS BUILT

`reports.html` v2.19.0. Read-only; it writes nothing and students load none of it.

1. **The rebuild write is refused in two places** — the button attribute and the
   first lines of `runRebuildAll()`. §0.0.C's "first job of Round 20", done.
2. **New `⏱ Clock` column: the UNION of the typing intervals.** Every sprint
   carries `at` (stamped when the record was filed, i.e. when that stretch of
   typing ENDED) and `seconds`, so it describes the interval
   `[at − seconds, at]`. The column is the measure of the union of those
   intervals across every document for that student-day.

⚠️ **WHY A UNION IS THE RIGHT OPERATION AND A SUM NEVER WAS.** A sum of
durations is only correct if no two records describe the same minutes. §0.0.A
proved they can. A union is correct either way — it needs no assumption about
how many writers there were, and it does not need §0.0.D's cause to be found
first. Feed it a document twice and the number does not move
(`union-clock-test.mjs` Part B). **A child cannot type in two places at once,
and this is the only figure on the page that encodes that fact.**

⚠️ **WHAT IT CANNOT PLACE, IT REFUSES TO COUNT.** A sprint with an unparseable
`at`, and any pre-v2.10.0 rollup with no `sprints[]`, are reported separately as
`unplaced` and never folded in. A student showing a red `unplaced` figure has
NOT been measured by this column; their Clock number is a floor. Invariant 7.

3. **`tests/union-clock-test.mjs`** — the harness §0.0.A asked for and said
   nobody had written. 35 assertions, all green. Part D is a mutation guard on
   the interval direction; Part E pins the §0.-1.A figures so this finding
   cannot be quietly lost again.

### 0.-1.C ⚠️ WHAT THE CLOCK COLUMN IS *NOT*

**It is not yet proven to be the truth, and it must not be written into
`typing_logs`.** Two honest limits, neither of which a harness can close:

* **`seconds` is graded time, not elapsed time.** The idle-aware clock excludes
  pauses, so `[at − seconds, at]` is a *compressed* block anchored at the end of
  the stretch, not the true wall-clock span. Intervals are therefore placed
  slightly late. This makes the union **conservative** — it can only fail to
  detect an overlap, never invent one — but it means the figure is a good
  estimate, not a measurement.
* **Two independent writers logging the same work at different instants** produce
  intervals that only partially coincide, so the union collapses part of the
  duplication and not all of it. It is strictly better than the sum. It is not
  a proof.

**Round 21's job is to decide which number becomes the grade, and that is a
decision for Jake with evidence in front of him, not for an instance at 3am.**
Until then: `Total Time` is what the app writes and what the student sees;
`⏱ Clock` is the independent check; where they disagree, the drill-down is the
adjudicator.

### 0.-1.D ⚠️ THE `-29 ch` THREAD IS CLOSED — NO CURRENT WRITER CAN PRODUCE IT

§0.0.A calls the negative character count "the cheapest thread." It was traced.
`game.js logSession()`, `learn.js logRun()` and `session-log.js
sessionLogPush()` all clamp with `Math.max(0, …)`, and those are the only three
paths into a sprint record. **No code in the deployed build can write a negative
character count.** It is residue from a pre-clamp build, it appears only on
08-17, and it makes a total *smaller*, so it is not a contributor to any
inflation. Per Jake's standing rule, no mechanism was invented to explain it.
**Do not spend another round on it.**

---

## §0.-2. ⚠️⚠️ PRIORITY 1 IS MET — AND THE LAST THING BREAKING IT WAS A DATE FORMATTER

**Round 20, second pass. Jake's standing Priority 1, asked for across six
rounds: THE NUMBER THE STUDENT SEES MUST EQUAL THE NUMBER THE TEACHER PULLS.**

### 0.-2.A THE STRUCTURAL ANSWER: YES, AND IT SHIPPED IN ROUND 19

There is one record. `game.js` and `learn.js` both call `readWeek()` in
`daylog.js`, which reads seven `typing_logs/{uid}_{date}` documents by id.
`reports.html` sums the same documents over the selected range.
`users/{uid}/stats/time_tracking` is gone from every file. Round 19's Stage 1
was correct and is the most valuable thing that round did.

`tests/week-agreement-test.mjs` Part A now proves it rather than asserting it:
`daylog.js totalsOf()` and `reports.html readLogTotals()` are lifted out of the
shipping files and driven with every document shape that exists in production —
flat, legacy-split, both, neither. Identical on all of them.

### 0.-2.B ⚠️ WHAT WAS STILL BREAKING IT, EVERY EVENING

`reports.html toDateStr()` formatted through `toISOString()`. **That is UTC.**
Nashville is UTC−5 in summer, so **from 7:00 PM local every date that function
produced was tomorrow.**

Every caller is a date-picker default or a quick-range button:

* **`This Week`** fills the start box from `getLastSaturday()`. Shifted forward
  it lands on **Sunday**. The teacher's week began a day after the student's, so
  **Saturday's typing was inside the number on the child's screen and outside
  the report.**
* **`Today`** filled both boxes with tomorrow and returned an empty report —
  which reads as "this child did nothing", not as a bug.

⚠️ **THE COUNTING CODE WAS INNOCENT.** Six rounds hunted this divergence in
`statsData`, the WAL, flush ordering, `typing_sessions`. Part of it was a date
formatter, firing only after 7 PM, which is when a teacher grades. **A
disagreement between two readers is not necessarily in either reader. It can be
in what you asked them to read.** Check the query before the arithmetic.

⚠️ **`daylog.js` warns against exactly this thirty lines in — "Never
toISOString(): that is UTC" — and `datesInRange()` in `reports.html` says it
again.** Both were written by rounds that fixed it in their own function and did
not grep for the other callers. **Fixed in `reports.html` v2.20.0. Grep.**

### 0.-2.C WHAT REMAINS BETWEEN THE TWO NUMBERS

Three things, all now known and none of them mysterious:

1. **In-flight lag, by design.** The HUD adds this tab's still-open sprint on top
   of the written document. Mid-period the student is ahead of the report by at
   most one unlogged unit. It converges at the next flush. Not a defect.
2. **The date range must match the week.** Use the `This Week` button, which is
   now correct at every hour. A hand-typed range that starts Sunday will
   disagree with a Saturday-anchored HUD and always would have.
3. **§3.1, the cross-mode overwrite.** Both sides read the same document — so
   they still AGREE — but they agree on a number that is too small. **This is
   Priority 2 and it is the only counting defect left.** See §0.-1.A: one
   student, one day, 13m 27s recorded against a 30m 26s session union.

⚠️ **PRIORITY 1 AND PRIORITY 2 ARE NOW SEPARABLE, AND THAT IS THE POINT.** They
were tangled for six rounds. Agreement is structural and done. Accuracy is one
named bug in one write path.

### 0.-2.D ⚠️ PRIORITY 2 — THE FIX, AND WHY IT IS NOT A REWRITE

§3.1 in one sentence: `game.js` and `learn.js` each hold their own in-memory
`statsData` and each writes the WHOLE day's total with `setDoc(merge:true)`, so
whichever writes second erases the other's contribution. A student who does ten
minutes of School and ten of Library is credited with ten.

**The fix is one document per (uid, date, source), summed on read.** Document id
becomes `{uid}_{date}_{source}`. School writes only the School document, Library
only the Library one. **They can no longer overwrite each other because they no
longer touch the same document** — no lock, no increment, no merge policy, no
read-modify-write. `daylog.js readWeek()` reads fourteen documents instead of
seven and adds them; `reports.html` groups by `(uid, date)` and sums.

⚠️ **THIS IS NOT THE v3.29.x SOURCE SPLIT COMING BACK.** That split put
per-source FIELDS inside ONE document, which left both writers writing the same
document and therefore left the race intact — v3.29.0 also fed both fields from
the shared cross-mode counter. Splitting at DOCUMENT level removes the shared
resource instead of subdividing it. Read §0.6 item 9 before touching this.

⚠️ **REQUIRED, RULE 10, BEFORE ANY CODE:** a harness that reproduces the
overwrite against the current build — two writers, one day, second write erases
the first — and fails. Then the fix. Then it passes. `week-agreement-test.mjs`
and `union-clock-test.mjs` are the pattern.

⚠️ **STILL OPEN AND NOT A BLOCKER:** two tabs in the SAME mode still race for
one document. Rarer, bounded by one flush interval, and worth a note rather than
a design. Do not let it grow the scope of the fix above.

---

## §0.0. ⚠️⚠️⚠️ ROUND 19'S BRIEFING — THE `typing_sessions` OVERLAP AND THE STAGE 2 REVERT

⚠️ **READ §0.-1 AND §0.-2 FIRST.** This section's EVIDENCE is sound and its
REFUSALS are still binding — the rebuild stays disabled, nothing re-derives a
grade from sessions, the overlapping documents are not deleted. What §0.-1
corrects is its CONCLUSION about which direction the error runs; what §0.-2
answers is the Priority 1 question this section could not. Kept verbatim.

**Written 2026-08-19, late, at the end of Round 19. Jake has students typing in
the morning. Read this section completely before writing a line of code.**

### 0.0.A THE EVIDENCE, FROM JAKE'S OWN DRILL-DOWN

One student, 2026-08-18. `typing_logs` says **13m 27s**. The reconcile sweep says
**32m 21s**. The sweep's arithmetic is CORRECT — it is the exact sum of four
rollup documents. The records are what is wrong.

| document stamp | its own sprints sum to | the window its sprints cover |
|---|---|---|
| 10:25 AM | 891s ✓ | **10:47 – 11:16** |
| 10:40 AM | 486s ✓ | **10:27 – 10:38** |
| 10:43 AM | 245s ✓ | 10:43 – 10:46 |
| 10:48 AM | 319s ✓ | 10:48 – 10:55 |

**Three separate defects are visible here:**

1. ⚠️ **THE WINDOWS OVERLAP.** The 10:25 document covers 10:47–11:16. The 10:48
   document covers 10:48–10:55. They share sprint minutes (10:49, 10:55) with
   **different durations and different character counts**. A student cannot be
   typing two different sprints in the same minute. This is one stretch of typing
   recorded twice by two writers — and because the sprint lists differ,
   `sessionSignature()` sees two distinct documents and counts both in full.
   **THE DUPLICATE DETECTION CANNOT SEE A PARTIAL OVERLAP.**
2. ⚠️ **DOCUMENT TIMESTAMPS DO NOT MATCH THEIR CONTENTS.**
   `_sessionLogFlushInner()` stamps each rollup with `chunk[0].at` — its first
   sprint. The 10:25 document's first sprint is 10:47. The 10:40 document's is
   10:27. That invariant is broken and nobody knows by what.
3. ⚠️ **NEGATIVE CHARACTER COUNTS.** On 08-17 the same student has a sprint
   reading `0 WPM, -362%, -29 ch`. Characters cannot be negative. That is not a
   disagreement between records, it is garbage inside one.

Characters corroborate: **1,620** across the sessions against **839** in the log.

⚠️ **WHY ROUND 18's VERIFICATION PASSED AND WHY NO HARNESS CAUGHT IT.** Round 18
checked that each document's stored totals equal the sum of its own `sprints[]`.
**All four documents above pass that check.** Internal consistency says nothing
about whether two documents describe the same minutes. Every test in this repo is
arithmetic on records; none of them compares records to each other in time.
**The check that would have found this is: do any two rollups for one student on
one day overlap in wall-clock time?** Nobody had written it. Write it.

### 0.0.B WHAT WAS DONE ABOUT IT, AT 3AM, AND WHY

**Stage 2 was deployed to production before this was found.** `game.js` v3.32.0
and `learn.js` v2.17.0 made the graded daily total
`server sessions + local queue + open sprint` — **a grade derived from the
records above.** That does not compare a number against corruption, **it makes
the grade the corruption.** It is strictly worse than the counter, whose failure
modes are at least understood and bounded.

⚠️ **REVERTED IN `game.js` v3.34.0 AND `learn.js` v2.19.0.** The daily total is
`statsData.secondsToday` again. `readDaySessions`, `projectDayTotal` and
`sessionLogPendingSeconds` are **not imported** by either file — deliberately, so
re-enabling it is not one keystroke. `session-merge-test.mjs` v1.5.0 asserts
their ABSENCE, because the failure is silent: grades inflate and every arithmetic
test stays green.

**KEPT, because none of it depends on sessions being trustworthy:**

* One number. `loadUserStats()` reads the week from the seven
  `typing_logs/{uid}_{date}` documents the report grades from.
  `users/{uid}/stats/time_tracking` is gone from every file.
* The HUD is reset to whatever was actually written, so the student's screen and
  the report cannot drift.
* `firestore.rules` v2.5.0 owner-read. `update-gate.js`. `daylog.js`'s
  `readWeek()`.

**Sessions are still written and still feed the drill-down.** They are not
deleted and nothing stops writing them — **they are the only evidence that will
identify whatever is producing the overlaps.** They simply may not decide a grade.

### 0.0.C ⚠️ WHAT MUST NOT HAPPEN

* ⚠️ **DO NOT PRESS `Rebuild from sessions`. EITHER DIRECTION.** Up-moves were
  recommended earlier in Round 19 on the reasoning that sessions cannot overstate
  what a child typed. **That reasoning is dead.** The tool should be disabled in
  `reports.html`; Round 19 ran out of time and did not do it. **Doing that is the
  first job of Round 20.**
* ⚠️ **DO NOT RE-DERIVE ANY GRADE FROM `typing_sessions`** until the overlap
  cause is found AND a harness exists that would have caught it.
* ⚠️ **DO NOT DELETE THE OVERLAPPING DOCUMENTS.** They are the evidence.

### 0.0.D ⚠️ WHERE ROUND 20 SHOULD START — three candidates, no evidence for any

**Do not pick one and build. Get a diagnostic first.** Round 16 formed a theory
in this area and Jake's console output killed it; §6 item 7 still reads
CAUSE UNKNOWN — DO NOT GUESS.

1. **Two writers at once.** A stale cached page controller and a current one, or
   Library and School in two tabs, each with its own in-memory watermark
   (`sprintLoggedSeconds` / `stepLoggedSeconds`, §3.3). Two watermarks over one
   stretch of typing produce exactly the overlap shape seen above.
2. **`sessionLogAdopt()` re-adopting.** It exists to migrate the legacy sprint
   array out of `ttb_wal_v2`. If it ever runs twice, or the legacy array is not
   cleared, already-uploaded records are re-queued and re-chunked — different
   chunk boundaries, different signature, counted again.
3. **A failed queue trim.** `_sessionLogFlushInner()` writes the document, then
   trims the queue and persists it. If the page dies in between, those records
   are re-sent next load — and because more records have accumulated, the new
   chunk is a SUPERSET, which is precisely a partial overlap.

**The negative character count is the cheapest thread**, because whatever
produced `-29 ch` is a bug with a line number, and it may be the same writer.

⚠️ **THE FIRST THING TO BUILD IS A DETECTOR, NOT A FIX**: for one student-day,
does any sprint timestamp appear in more than one rollup? Run it across the
corpus. That turns this from an argument into a population of cases.

### 0.0.E WHAT JAKE CAN AND CANNOT DO WITH THE DATA HE HAS

* **He cannot take a defensible minutes grade for the week of 2026-08-15.** He
  knows. He is giving students what they have.
* **The sprint-level detail is still the best evidence available** — individual
  runs with their own timestamps, WPM and character counts. "Did this student
  show up and type most days" is answerable. "How many minutes exactly" is not.
* **From the v3.34.0 deploy forward the counter is the only measure**, written to
  one document that both he and the student read. That is Stage 1, and Stage 1
  was never in question.

---

## §0.0.1 (was §0.0) — ONE NUMBER, NOT THREE

**If you read one section of this document, read this one. If everything else in
this repo works and this does not, nothing in this repo works.**

Jake's words, 2026-08-19, after asking five consecutive rounds for the same
thing and being handed five plans that did not deliver it:

> *"I need the numbers to line up. Period. End of story."*
> *"It's like saying I have a great car, except for the fact it has no brakes."*

### 0.0.1 ⚠️ JAKE'S RULING ON WHICH DIRECTION IS SAFE — THIS OVERTURNS §0.9

**§0.9 recommends grading on `max(logSeconds, sessionSeconds)` and argues that
overcounting is the safe direction because it "can only err in the student's
favour." JAKE HAS RULED THAT REASONING WRONG AND IT IS WITHDRAWN.** His words:

> *"Inflating a kid's grade because my code is fucked may not result in angry
> parents, but it results in kids getting credit for work they did not do.
> That's not better. For the kid, it's worse."*

⚠️ **DO NOT PROPOSE `max()`, A TOLERANCE WINDOW, A FUDGE FACTOR, OR ANY OTHER
SCHEME WHOSE DEFENCE IS "IT ERRS TOWARD THE STUDENT."** He is not optimising for
the absence of complaints. He is optimising for the number being TRUE, because a
grade that overstates what a child did is a lie told to that child. The target
is not "safe." The target is **correct**.

`max()` remains in §0.9 only as the interim CSV workaround for the week already
in progress, and it is a stopgap he accepted under a deadline, not a design.

### 0.0.2 ⚠️ THE ROOT CAUSE — nobody had named this before Round 19

`firestore.rules` up to v2.4.0:

```
match /typing_logs/{docId}     { allow read: if canReadActivity(resource.data); }
match /typing_sessions/{id}    { allow read: if canReadActivity(resource.data); }
```

`canReadActivity()` is **staff-only**. Therefore:

⚠️ **A STUDENT'S BROWSER HAS BEEN STRUCTURALLY FORBIDDEN FROM READING EITHER
RECORD THE TEACHER GRADES FROM.** It could write them. It could never read them
back. So the HUD had no way to display the graded number and **no choice but to
maintain a private second copy** — `users/{uid}/stats/time_tracking` —
accumulated independently in browser memory and flushed on its own schedule.

That is §3.1's sentence ("two records of one quantity, updated on different
paths, disagreed") and this rule is **why it was unavoidable rather than
careless**. Every counting incident in this project's history — the doubled week
counter, the missing stats documents, the HUD that changed on refresh, the
cross-mode overwrite, the repair that gets overwritten by a live tab — is
downstream of it. Four rounds tried to make two independently-written copies
agree with each other. **They cannot. That is not a bug to fix, it is a
guarantee that does not exist.**

### 0.0.3 THE TARGET STATE — one document, read by both surfaces

| | |
|---|---|
| **Record** | `typing_sessions` — append-only, dated when typed, written from a durable queue by every client back to v2.4.0. Already trustworthy; verified by console dump 2026-08-19. Untouched by this work. |
| **Projection** | `typing_logs/{uid}_{date}` — **recomputed from that day's sessions. Set, never merged.** |
| **The student's HUD** | reads `typing_logs/{uid}_{date}` |
| **The teacher's report** | reads `typing_logs/{uid}_{date}` |
| **`users/{uid}/stats/time_tracking`** | ⚠️ **DELETED. It is the second copy. It is the disease.** |

**The kid's screen and Jake's report become the same document.** Not reconciled,
not audited, not compared — *the same document*. Two things reading one document
cannot disagree. That is the only arrangement that satisfies what he asked for,
and everything short of it is another reconciliation tool.

⚠️ **THE WEEK-COUNTER AUDIT AND ITS REPAIR DIE WITH IT.** They exist solely to
drag the second copy back into line with the first. With one copy there is
nothing to audit. Jake: *"I can't run an audit every time."* He is right, and
the answer is not a faster audit.

### 0.0.4 WHY THIS IS SMALLER THAN FIVE ROUNDS OF FAILURE SUGGEST

The document id is `uid + '_' + date`. It is **deterministic**, so the HUD reads
a week as **seven `getDoc()` calls by id** — no query, **no composite index**,
and no change to `firestore.indexes.json`'s field exemptions (which have `uid`
un-indexed, and would have made a `where('uid','==')` query impossible). About
seven reads per page load against the one it does today. Negligible.

**SHIPPED ALREADY (Round 19): `firestore.rules` v2.5.0** adds
`(signedIn() && resource.data.uid == request.auth.uid) ||` to the read rule on
both collections. Owner-scoped; no student can see another's anything; staff
access unchanged. **Safe standing alone — nothing reads those paths as a student
yet — which is why it deploys first.**

### 0.0.5 ⚠️ STAGE 1 IS BUILT — WHAT SHIPPED, AND IN WHAT ORDER TO DEPLOY IT

**STAGE 1 — MAKE THEM LINE UP. BUILT, Round 19. Deploy in this order.**

| # | file | version | note |
|---|---|---|---|
| 1 | `firebase/firestore.rules` | 2.5.0 | ⚠️ **CONSOLE. Jake confirmed live 2026-08-19.** Everything below fails its reads without it. |
| 2 | `daylog.js` | 1.0.0 — **NEW** | Shared module, imported by both page controllers. Goes up FIRST — a missing import renders nothing at all (§1). |
| 3 | `reports.html` | 2.16.0 | ⚠️ **CONSUMER FIRST (§1).** Works correctly against the OLD controllers; the old version against the NEW ones offers a repair button for a document nothing reads. |
| 4 | `index.html` | 3.9.0 | Shelf banner off the old rollup. |
| 5 | `game.js` | 3.31.0 | |
| 6 | `learn.js` | 2.16.0 | |
| 7 | `versions.js` | 1.9.0 | Registers `daylog.js`. |

**What the change is, in one sentence:** the day and week totals a student sees
are read from `typing_logs/{uid}_{date}` — the same seven documents
`reports.html` grades from — and `users/{uid}/stats/time_tracking` is written by
nothing and read by nothing.

**Deleted, deliberately, and each deletion is load-bearing:**

* `checkForWeekRepair()` and `lastKnownRepairedAt`, both files. They defended a
  stored week counter against a repair button. There is no stored week counter:
  the week is the SUM of seven documents, recomputed on every load and persisted
  nowhere.
* `auditWeekCounters()`, `renderAuditPanel()`, `repairWeekCounter()`, `bucket()`,
  `WEEK_TOLERANCE`, and `reports.html`'s own `weekStartOf()`/`addDays()` — about
  240 lines. All of it existed to drag a second copy back into line with the
  first. **Jake: "I can't run an audit every time." A faster audit was never it.**
* The two mirror writes into `stats/time_tracking` from `reports.html`'s manual
  save and `⟳` recalculate. A correction now reaches the student by being
  written, full stop.

**What survives and is now the only checking tool on the page:** `Reconcile vs
Sessions`. That compares the graded document against the append-only session
record — **a projection against its SOURCE**, which is a real check. The audit
compared two rival copies of one number, which never was.

⚠️ **THE ONE RESIDUAL GAP, AND SAY IT IN THESE WORDS.** A student mid-sprint has
typed seconds that have reached no stored record anywhere. The HUD shows the
projection plus the live open-unit delta. It closes at every unit boundary and on
`visibilitychange`/`pagehide`. It is irreducible in any design. **DO NOT CLAIM
ZERO.**

⚠️ **`readWeek()` RETURNS `ok:false` RATHER THAN ZEROS IF ANY OF THE SEVEN READS
FAILED, AND BOTH CALLERS STOP.** A partial week is an undercount that looks
exactly like a light week, and showing a child less than they earned is the same
lie as showing them more. `tests/daylog-test.mjs` Part C guards the module;
`session-merge-test.mjs` Part D guards that the callers honour it.

**STAGE 2 — MAKE IT TRUE. BUILT, Round 19. Deploy after Stage 1 has been seen
working in a real period.**

| file | version | note |
|---|---|---|
| `session-log.js` | 1.4.0 | Adds `sessionLogPendingSeconds()`. ⚠️ **Three version pins move with it** (§1) — `session-merge-test.mjs` and `open-unit-test.mjs` are updated. |
| `daylog.js` | 1.1.0 | Adds `sessionSignature()`, `sumDaySessions()`, `readDaySessions()`, `projectDayTotal()`. |
| `game.js` | 3.33.0 | Projection, leaderboard derived, HUD follows the document. |
| `learn.js` | 2.18.0 | Projection, HUD follows the document. |

**The daily total is no longer reported by a tab. It is computed:**

```
typing_logs.seconds = server sessions (deduped)
                    + this device's un-uploaded queue
                    + this tab's still-open sprint/run
```

The first term is shared, append-only and cannot be overwritten, so **two tabs
can no longer erase each other's day** — each adds only its own unflushed tail on
top of the same base, and that tail reappears for everyone the moment it is
logged. The projection is **self-healing**: it converges on the session record.

⚠️ **THE OPEN TERM IS READ FROM THE WATERMARKS THAT ALREADY EXIST** —
`sprintSeconds` vs `sprintLoggedSeconds` in `game.js`, `stepSeconds` vs
`stepLoggedSeconds` in `learn.js`. No second set of books, so §3.3's "reset the
watermark wherever you reset the counter" still covers both by construction.

⚠️ **A FAILED SESSION READ WRITES NOTHING.** A projection built on a failed read
is not a smaller number, it is an invented one, and it would land on top of a
correct stored value. The WAL keeps the local copy and the next flush retries.

⚠️ **ONLY `seconds` IS PROJECTED.** `chars` and `mistakes` still ride the counter.
Deliberate: seconds are what Jake grades on, `session-log.js` exposes queued
seconds only, and a second accessor for figures nobody grades on is surface area
for nothing. `⟳` corrects them when they matter.

⚠️ **READ COST.** One `typing_sessions` query per flush per student. At Ellis —
90 students, roughly one period each, ~10 flushes — that is ~900 queries/day
returning a handful of documents each. Negligible. **At the full district
population SCALE-PLAN models it is materially larger and should be re-costed
before that rollout**, most cheaply by caching the server term and refreshing it
only after a successful session upload.

**THE LEADERBOARD IS DERIVED TOO.** `flushLeaderboard()` was the last place in
the app that accumulated a student's time independently — an honest gap in the
"one number" claim, called out in the previous pass of this section. It now takes
`statsData.secondsWeek` (itself the sum of seven daily documents) and keeps the
old `lbPendingSeconds` accumulator **only as a floor**, so a guest stretch or a
refused week read can never drag the board below what the session banked.

### 0.0.6 ⚠️ STILL OPEN AFTER STAGE 2

* ⚠️ **THE WAL IS ON ONE CHROMEBOOK AND A WEEK CAN AGE OUT UNDER IT.** Jake
  raised this and he is right. A student types 4:30, closes the tab before any
  flush, and that time lives only in `ttb_wal_v2` in **that machine's**
  localStorage. Signing in at home does not see it — different device, different
  storage. It replays when they next open the app **on that Chromebook**, which
  may be the following week, at which point the seconds land in a week that is
  already graded. `stats-wal.js` carries `lastDate`/`weekStart` and the recovery
  is period-guarded, so nothing is double-counted; the seconds are simply
  **dropped rather than misfiled**, which is the right failure but is still a
  loss. ⚠️ **DO NOT "FIX" THIS BY RELAXING THE PERIOD GUARD** — misfiling last
  week's minutes into this week's grade is strictly worse than losing them.
  Discuss with Jake before doing anything; he asked for it flagged, not solved.
* ⚠️ **THE 5-SECOND FLOOR IS A SYSTEMATIC DOWNWARD BIAS ON THE PROJECTION.**
  `sessionLogPush()` refuses a standalone record under 5 seconds (§3.3), and the
  refusal deliberately does not advance the watermark — so those seconds are
  DEFERRED, not lost, and arrive once the sprint grows past the floor. **But a
  sprint that ENDS under 5 seconds drops them permanently.** Since Stage 2 the
  graded total is projected from sessions, so this bias now reaches the grade
  where before it only affected the drill-down. It is small (a few seconds per
  abandoned sprint) and it errs downward, which is the direction Jake tolerates —
  but it is real and nobody has measured it. **Measure before changing the
  floor**: lowering it fills the report with noise records.
* ⚠️ **SENTENCE DETECTION IS NAIVE AND THE WAL CHECKPOINT RIDES ON IT.**
  `markDirty()` in `game.js` fires on any `.`/`!`/`?`/newline with no
  abbreviation check, so "Mrs." is a sentence end. Jake noticed this in *Anne of
  Green Gables*. For the WAL that is harmless-to-good (more checkpoints, all
  local and free). **His proposal — checkpoint every sentence OR every N
  characters (~100) — is sound and should be built**, because a long stretch with
  no terminal punctuation currently goes unwritten, and it costs nothing:
  localStorage only, no Firestore. ⚠️ **learn.js has NO equivalent trigger** —
  it checkpoints at step boundaries only. **Jake's standing rule: "Learn and
  game, of course. Everything should do both."** Build it symmetrically or not
  at all.

* ✅ **The leaderboard is derived** as of v3.32.0. It was the last independent
  counter; see §0.0.5.
* ⚠️ **THE 120-DAY TTL ON `typing_sessions` IS NOW LOAD-BEARING.** `typing_logs`
  IS a projection of a collection that expires, a rebuild after 120 days produces
  zero. `typing_logs` has no TTL and must keep none — **and the never-zero
  refusal (§0.8.3 item 1) becomes load-bearing, not a nicety.**
* **Guests.** No uid, so no daily log and no gate. Both signed-out branches still
  paint from local counters. Verified by reading, NOT by running.
* ⚠️ **NOTHING IN NODE CAN CHECK THAT `firestore.rules` v2.5.0 ACTUALLY PERMITS
  THE OWNER READ.** It is a console action and the entire redesign rests on it.
  **If students report 0:00 after this deploys, check the rule first**, not the
  green suite. `tests/daylog-test.mjs`'s header says the same thing.


### 0.0.8 ⚠️⚠️ THE 2026-08-19 NEAR-MISS — READ BEFORE TOUCHING THE REBUILD

Jake ran `Reconcile vs Sessions` on 2026-08-19 and screenshotted the preview. The
DOWN list opened with **26m 24s → 1m 51s on 2026-08-17**, and there were a dozen
more like it. The UP list opened with **27m 21s → 50m 48s**.

**Neither list was showing corrupt logs.** They were showing two different real
things, and the tool could not tell them apart:

* ⚠️ **THE DOWN MOVES ARE THE TOOL BEING BLIND.** `learn.js` gained session
  logging in v2.7.0, which shipped **2026-08-18** (§6 item 2). Before that date a
  student's `typing_sessions` cover their Library time and **none** of their
  School time. So a child who did twenty-four minutes of School on 08-17 shows
  `log 26m / sessions 1m51s` — and the rebuild would have written over **the only
  surviving copy** of that work, in bulk, behind a preview that looked
  authoritative.
* **THE UP MOVES ARE PROBABLY REAL RECOVERIES.** Sessions higher than the log is
  the signature of §3.1's cross-mode overwrite: `game.js` flushed its own
  `secondsToday` over the shared field and erased what `learn.js` had put there.
  The sessions kept both. **Left unrefused on purpose** — a rebuild that RAISES a
  student's time is giving back work the log lost.

⚠️ **WHY §0.8.3's FIRST REFUSAL DID NOT FIRE.** It refuses to rebuild a day with
**zero** session documents. These days had one. **A PARTIAL RECORD DEFEATS AN
EMPTINESS CHECK, AND IS MORE DANGEROUS THAN NO RECORD**, because it looks like
evidence. That sentence is the lesson of this near-miss; generalise it before
writing the next refusal.

⚠️ **WHY THE WEEK-COUNTER AUDIT SAW NOTHING HOURS EARLIER.** It compared
`stats/time_tracking` against `typing_logs` — **two copies of the same counter**.
Reconcile compares `typing_logs` against `typing_sessions` — **two different
sources**. The audit could not have found this and never could have. Not a
contradiction; a different question.

⚠️ **THE REBUILD WRITES UP MOVES ONLY BY DEFAULT (2.18.0).** An UP move means the
sessions hold more than the log, and sessions are append-only and deduped — they
**cannot invent time a child did not type**. So an UP move recovers work the log
lost to the cross-mode overwrite and can only move a student toward the truth. A
DOWN move has two possible causes and this tool cannot tell them apart. Under
Jake's ruling that inflation is a lie told to a child, **a wrong DOWN move is the
same lie pointed the other way — it deletes work they actually did.** Down is an
explicit per-run opt-in with the count in front of him.

**SHIPPED (reports.html 2.17.0, corrected in 2.18.0), both DOWNWARD ONLY:**

1. `SCHOOL_SESSIONS_FROM = '2026-08-19'` — no down-move is proposed for any
   earlier date. ⚠️ **IT WAS 08-18 IN v2.17.0 AND THAT WAS OFF BY ONE.**
   `learn.js` v2.7.0 was *deployed* on 08-18, part-way through the day, so School
   coverage that day starts at the upload hour and every earlier run exists only
   in the daily log. Jake's live preview caught it — a full screen of 08-18
   down-moves, largest 33m 12s → 17m 17s. Those were **mornings, not
   corruption.** ⚠️ **A DEPLOY DATE IS NOT A COVERAGE DATE; coverage starts the
   next midnight.** Generalise that before writing the next guard of this shape.
2. `MAX_DROP_FRACTION = 0.5` above a `MAX_DROP_FLOOR_SECONDS = 300` floor — a
   rebuild that would cut a day by more than half is quarantined **for every
   date, including future ones**. The date guard closes the case we understand;
   this closes the case we do not.

Both quarantine into `skipped` **with their reason on screen**, never silently.
`tests/reconcile-test.mjs` covers both, mutation-verified, and lifts the
constants out of `reports.html` rather than retyping them so the date cannot
drift while the test keeps passing.

### 0.0.7 EPUB METADATA BACKFILL — asked for, and the honest answer

Jake, 2026-08-19, on the transcriber credits lost by the `admin.js` bug before
v3.31.1: *"If — on a future pass — we could add the ability to try to fill in
missing metadata from the book itself (assuming that's still in what's uploaded),
that would be grand."*

⚠️ **IT IS NOT STILL IN WHAT WAS UPLOADED.** `admin.js` parses the EPUB **in the
browser** and writes only the extracted chapter text to Firestore and the cover
image to Storage (`covers/{bookId}` — the only `uploadBytes()` call in the file).
**The source archive is discarded.** There is nothing on the server to re-read,
so a backfill for the ~53 books already imported would need those EPUBs uploaded
again.

**What IS worth building, and is small:** a re-import path that takes an EPUB for
a book that already exists and fills in **only the metadata fields that are
currently blank**, touching no chapter text and overwriting nothing Jake has
typed by hand. That turns the backfill from "re-import 53 books and redo the
manual attribution work" into "drag the file in, and anything missing appears."
He has already corrected rights and source by hand on all of them, so a tool that
respects existing values is the difference between useful and destructive.

⚠️ **DO NOT BUILD A BULK OVERWRITE.** He fixed those fields manually, one book at
a time.

**A cheaper partial for Gutenberg books specifically:** the origin URL is already
stored and canonical (`gutenberg.org/ebooks/<id>`), so the transcriber names are
recoverable from Gutenberg itself — but that is a cross-origin fetch from a
browser with no CLI and no Cloud Function deploy, so it is a bigger job than it
sounds. Mentioned so nobody re-derives it as an easy win.

---

## §0.10. ⚠️ ROUND 19 — READ WITH §0.9, NOT INSTEAD OF IT

### 0.10.1 THE GAP IN §0.9, AND JAKE SAID IT OUT LOUD

§0.9 is right about which record to grade from and **does not answer the
question Jake actually asked.** His words, 2026-08-19: *"Kids see one time, but
I see another. That time is their grade, so they need to line up."*

§0.9 grades from `typing_sessions` and demotes `typing_logs` to "a live
on-screen display, never graded from again." That makes **Jake's** number
trustworthy. It leaves the student watching a *different* number and calls that
acceptable. It is not: a child who sees 38 minutes and is graded on 44 cannot
check their own work, and neither can Jake when a parent asks.

**THREE documents still hold one quantity** (§3.1), and the split is exactly
along the line of the complaint:

| surface | reads |
|---|---|
| the student's HUD | `users/{uid}/stats/time_tracking` |
| Jake's report | `typing_logs/{uid}_{date}` |
| the independent record | `typing_sessions` |

⚠️ **THE HUD AND THE REPORT ARE DIFFERENT DOCUMENTS ON DIFFERENT WRITE
SCHEDULES. They drift by construction, and no amount of correcting the counter
changes that.** Whatever number becomes the grade, the student has to be looking
at that number. That is unfinished and it is the next real design decision —
**it is a write-path change and must not ship on a school night.**

### 0.10.2 THE GRADE DOES NOT DEPEND ON THE STALE-CLIENT PROBLEM

The one genuinely good piece of news this round found, and it is what let Jake
grade before anything else was fixed:

**`typing_sessions` is written the same way by every client back to v2.4.0** —
from a durable localStorage queue, dated when the typing happened. It does not
care which version of `game.js` is in the tab. `typing_logs` is a live
in-memory counter whose correctness depends entirely on which code is running.

⚠️ **So "which version is this child running" and "what is this child's grade"
are separable problems, and they were being fought as one.** The weekly
procedure is in `README.md`: Generate → Reconcile vs Sessions (read-only) →
Export CSV → grade off the larger of `Total Seconds` and `Session Seconds`.
Since the target is 10 minutes a day, inflation above target changes no grade;
deflation is the only thing that costs a child points, and taking the higher of
two independently-written records catches exactly that.

### 0.10.3 WHAT SHIPPED — `update-gate.js` v1.0.1

**NEW FILE `update-gate.js`, plus one `<script>` line each in `game.html`
(1.1.0 → 1.2.0) and `learn.html` (1.0.0 → 1.1.0). `versions.js` → 1.8.0 and its
`tools/audit-versions.mjs` mirror register it.** Nothing else moved.

To fire a building-wide reload: Firestore → `settings` → `appVersion` → field
`nonce` (number), increase by one. Optional `note` (string) shows on the
student's overlay.

⚠️ **NO `firestore.rules` CHANGE IS NEEDED** — `match /settings/{docId}` already
allows read to any signed-in account. **Guests are therefore never gated.**
Deliberate: a guest has no graded record to keep consistent, and widening that
rule is a security decision, not a deploy convenience.

⚠️ **IT LOADS FROM ITS OWN SCRIPT TAG, NOT AS AN IMPORT.** Two reasons, both
load-bearing. A separate module graph means a 404 on it cannot stop the typing
page booting — §1's "a missing module renders nothing at all" does not cross
script tags. And it meant this shipped without one line changing in `game.js` or
`learn.js`, which is the standing rule while the counting code is under repair.

⚠️ **IT CANNOT REACH A TAB ALREADY OPEN ON PRE-GATE CODE.** Nothing can — a page
that is not asking the server a question cannot be told an answer. Those clear
on the next reload or restart. What the gate buys is that it is the last time.
**Do not let anyone write a release note claiming otherwise.**

### 0.10.4 ⚠️ THE BUG THIS ROUND SHIPPED AND CAUGHT, v1.0.0 → v1.0.1

v1.0.0 pre-fetched each asset as `fetch(a + "?u=" + nonce, {cache: "reload"})`.
**An HTTP cache entry is keyed by the whole url.** That refreshed the entry for
`game.js?u=7` — a url nothing ever requests — and left `game.js`, which is what
`game.html`'s script tag actually asks for, exactly as stale as it was.

**The gate would have reloaded the entire building into the identical old code,
every ten minutes, and every observable sign would have said it worked.** The
cache-busting is `{cache: 'reload'}` alone; the query string was not merely
redundant, it defeated the mechanism. The `?u=` on the *page* url is a different
thing and is still wanted — it forces the html document past the bfcache.

Found by re-reading, not by running anything. **No harness in this repo could
have caught it**, which is the same shape as Round 18's §0.8.4 near-miss and
worth noticing as a pattern: the defects that survive this project's test suite
are the ones about *identity* — which url, which student, which document — not
about arithmetic.

### 0.10.5 WHAT ROUND 19 DID NOT DO

* **Did not touch `reports.html`.** Round 18's 2.15.0 is untouched at 2.15.0.
* **Did not make the HUD and the grade agree.** §0.10.1. Still open, still the
  most important thing left, still a write-path change.
* **Did not write a harness for `update-gate.js`.** Everything it does is
  `fetch`, `localStorage` and `location.replace` — the parts worth testing are
  precisely the parts Node cannot see. A green harness here would be decoration.
  **If you disagree, the assertion worth writing is that the pre-fetch url has
  no query string** (§0.10.4), and that one is a text check against the source
  in the same style as `open-unit-test.mjs` Part E.
* **Did not resolve why the week-counter audit reports problems on every run.**
  The hypothesis on the table, and it is only that: students holding pre-v3.28.0
  code in an open tab do not have `checkForWeekRepair()` and write their stale
  in-memory week counter back over each repair. Repair, overwrite, repair.
  **If that is it, the gate is the fix and the audit was never broken.**
  ⚠️ **Do not treat this as established.** Round 16 formed a theory in this area,
  Jake's console output killed it, and §6 item 7 still says CAUSE UNKNOWN — DO
  NOT GUESS.

---

## §0.9. ⚠️ SUPERSEDED IN PART BY §0.0 — READ §0.0 FIRST

⚠️ **§0.9's `max(logSeconds, sessionSeconds)` recommendation is WITHDRAWN.** Jake
ruled on 2026-08-19 that inflation is not the safe direction — see §0.0.1. What
survives here is the analysis of why `typing_sessions` is the trustworthy record
and `typing_logs` is not; what does not survive is the idea that erring upward is
acceptable. §0.9's step 3 ("demote the counter, leave the student watching it")
is also superseded: §0.0 deletes the second copy instead.

### The original §0.9 — THE GRADE MOVES OFF `typing_logs`

**Jake's ruling, 2026-08-19, verbatim in substance:** *"If we have one
trustworthy number and one broken number, get rid of the broken one and keep the
trustworthy one."*

He grades students on practice time. 10 minutes a day, 40/50 for the week is an
80%. Real grades, real parents, real administrators, and other schools now using
this. **The number he grades from is not trustworthy and he knows it.** That is
the only problem worth working on until it is closed.

### 0.9.1 The ruling

| | |
|---|---|
| **`typing_logs`** | A live counter in browser memory, written by `game.js` **and** `learn.js` into one shared document, flushed on a timer and at page-death. **Four rounds have tried to make it reliable. Three of those attempts shipped defects into a live classroom and were reverted.** It is not going to become trustworthy. |
| **`typing_sessions`** | Append-only. One document per (day, source, book/lesson), written from a durable `localStorage` queue, dated when the typing happened, each carrying its own `sprints[]`. Verified by Jake's own console dump on 2026-08-19: ten documents, every stored total matching the sum of its own sprints exactly. |

**`typing_sessions` becomes the graded record. `typing_logs` is demoted to a
live on-screen display for the student and is never graded from again.**

⚠️ **DO NOT "FIX" THE COUNTER.** That is the trap this project has fallen into
four times. The counter is fine at its actual job — showing a kid a number while
they type. It was never fit to be a grade. Rounds 15, 16 and two of Round 16's
own passes were all spent trying to make a fundamentally unreliable mechanism
reliable instead of asking why a grade was reading from it. **If your plan
contains an edit to `game.js` or `learn.js`, you have the wrong plan.**

### 0.9.2 Build order — smallest safe step first

Every step below is in `reports.html` alone. **No step touches `game.js`,
`learn.js`, `hud.js`, `stats-wal.js` or `session-log.js`. No step needs a
`firestore.rules` change.** That is what makes this shippable inside a school
week; do not give that property up for elegance.

**STEP 1 — GRADE FROM SESSIONS. This is the one that has to land first.**

`reports.html` v2.15.0 already computes the deduped session total per student —
it is the `Sessions` column, and the sweep behind it (`runReconcile()`,
`readPairSessions()`) is finished, tested and read-only. **The work is not
computing the number. It is promoting it.**

* Make the graded column **`max(logSeconds, sessionSeconds)`**, labelled plainly
  as the graded figure, with the two inputs shown beside it.
* ⚠️ **`max()`, NOT sessions-alone, and this is a deliberate safety margin, not
  indecision.** Sessions are written at run/unit boundaries, so a queue that
  never flushed loses real time — **sessions can undercount.** The log's failure
  is bidirectional; the session record's failure is one-directional and always
  downward. Taking the higher of two independently-written records can only ever
  err in the student's favour, and every known defect in this area is our code's
  fault, not a child's. Do not "simplify" this to sessions-only to make the data
  model tidier.
* Note what Jake's grading scheme does to the error: the target is 10 minutes,
  so **anything above target is already full credit and inflation above it
  changes no grade at all.** The only students inflation can affect are those
  under target, and `max()` is generous to exactly them. **Deflation is the real
  enemy and `max()` is precisely what catches it.**
* Export it in the CSV. The CSV is what he actually grades from.

**STEP 2 — SNAPSHOT, BECAUSE THE RECORD EXPIRES.**

⚠️ **`typing_sessions` carries a 120-day TTL.** A 9-week rotation is 63 days, so
the current quarter is safe — **but a grade challenged in April for October's
work has no record behind it.** Write a per-student weekly total into a small
permanent document (no TTL) at the end of each week, from `reports.html`, from
the swept session data. Small, cheap, permanent, and it is the thing that makes
this defensible six months out.

**STEP 3 — DEMOTE THE COUNTER, IN THE UI ONLY.**

Relabel `typing_logs` in `reports.html` as a live display figure, not a grade.
Leave the writers alone. The counter keeps doing its on-screen job.

**STEP 4 — ONLY THEN, and only with Jake's say-so, consider the writers.**

Once the grade no longer depends on it, `typing_logs` becomes low-stakes and can
be fixed calmly, or left alone forever. **It stops being urgent the moment
step 1 lands, which is the entire point of doing step 1 first.**

### 0.9.3 ⚠️ Two blind spots that survive this change — say them out loud

1. **A student with no `typing_logs` document at all is invisible.** The report
   enumerates students *from* `typing_logs`, so the sweep can only check students
   that collection already knows about. A missing *day* is caught; a missing
   *student* is not. The durable fix is to enumerate from the class roster
   instead. **A cheaper interim check: compare the report's student count against
   the class roster size and say so on screen when they differ.** Do that even
   if you do nothing else about it.
2. **Sessions begin at v2.4.0.** Anything before that is log-only and always will
   be. Nothing fixes it; do not pretend otherwise in a UI.

### 0.9.4 What Jake needs from the very next instance

He said *"I can't chase this for weeks"* and he is right. **Step 1 is one file
and no new write path.** It is achievable in a single session. Ship step 1 by
itself if that is all there is time for — a shipped step 1 changes his situation
completely and a perfect four-step plan that lands next month does not.

⚠️ **This is a teacher who is the only tester and whose students are the blast
radius.** Never deploy a write-path change on a school night. Step 1 is a
read-path change, which is exactly why it is first.

---

## §0.8. Round 18 — Salter

Jake's brief opened with the fact everything else in this round hangs off:

> *Student grades come from typing time. The number he grades from is wrong —
> inflation and deflation on every audit run. He grades from it now. Fixing the
> writers is not the job. Giving him a correct number and a way to see it is
> the job.*

**One file changed: `reports.html`, 2.14.0 → 2.15.0.** One file added:
`tests/reconcile-test.mjs`. `game.js`, `learn.js`, `hud.js`, `stats-wal.js`,
`session-log.js` and `firestore.rules` are untouched, and the next round should
keep it that way unless it has a reason far better than "while I was in there".

### 0.8.1 ⚠️ THE PREMISE. Do not build on this round without accepting it.

`typing_sessions` is the record. `typing_logs` is a cache of it.

That was established on 2026-08-19 by a console dump Jake ran: ten
`typing_sessions` documents, each one's stored `seconds`/`chars` matching the sum
of its own `sprints[]` **exactly**, correct `source` tags, no internal
inconsistency anywhere. Meanwhile every defect of Round 16 lived in
`typing_logs` — a live counter accumulated in browser memory, shared by two page
controllers, dependent on a tab surviving and on a write landing at page-death.

So the comparison this round draws is (cache − record), and the repair rebuilds
the cache from the record. **If a future round finds that `typing_sessions` is
itself unreliable, this entire feature becomes actively dangerous** — it would
be confidently overwriting good numbers with bad ones, at scale, with a preview
that looks authoritative. Re-verify the premise before extending it.

### 0.8.2 What shipped

**(1) Reconciliation view — read-only.** A `Reconcile vs Sessions` button beside
`Audit Week Counters`. It sweeps `typing_sessions` for every (student, date) pair
in the current report, dedupes with the existing `sessionSignature()`, and fills
three new **top-level, sortable** columns: `Sessions`, `Δ`, `⧉`.

Top-level was the requirement, not a preference. Jake's complaint was specific:
he should not have to expand each child to find a duplicate, and the drill-down
version of this (v2.13.2) did not fix that. Sorting by `Δ` or by `⧉` is now the
entire workflow; expanding a student is for confirming what the summary row
already told you.

⚠️ **The sweep probes every date in the range, not only dates that have a log
row.** A day whose `typing_logs` write never landed at all has no row to iterate,
so iterating the report's own `dailyLogs` would skip precisely the case this
tool exists to catch — real sessions, no cached total, a child under-credited
and nothing on screen saying so. A quiet day costs one empty-query read, which
is the cheapest way to be able to say "checked".

**(2) Rebuild-all.** What `⟳` does for one day, across the report, behind a
preview. The preview splits into **"will go DOWN — read these first"** and "will
go UP", biggest movers at the top of each, because a correct rebuild can
legitimately lower a child's number and Jake has to be the one who accepts that
before anything is written. It calls `recalcDailyLog()` — the same function `⟳`
has used since v2.13.0 — one day at a time, one `updateDoc` each, against
`typing_logs` only. **No new write path was introduced.**

### 0.8.3 ⚠️ THE FOUR REFUSALS. Each one is a defect that was otherwise possible.

1. **A day with no session records is never zeroed.** Skipped and listed with its
   reason. `allowZero` is *not* passed on the bulk path. Such a day is usually
   one that predates session logging (v2.4.0) or whose sessions aged past the
   120-day TTL — its log total is real and is the only copy left. Zeroing it
   would destroy graded time and would look exactly like a successful repair.
2. **Sessions with no daily-log document are skipped, not created.**
   `firestore.rules` gives staff `update` only on `typing_logs`; `create`
   requires `request.resource.data.uid == request.auth.uid`. There is nothing to
   write into, and widening that rule is a security change, not a repair.
   They are surfaced in the panel so the shortfall is visible.
3. **Today is excluded by default**, checkbox to include. Sessions are written at
   run/unit boundaries, so a student mid-chapter has real time in their log that
   is not in sessions yet; rebuilding now truncates them to their last completed
   unit. The panel also warns if it is currently a weekday between 07:00 and
   15:00.
4. **Each write re-verifies against the preview.** `recalcDailyLog()` gained an
   `expect` option: if the re-read produces anything other than what the preview
   promised, the pair is **skipped and reported**, not written. Writing the
   newer, more-correct value is the defensible-sounding choice and it is wrong —
   the point of a preview is that the write is the thing that was previewed.

### 0.8.4 ⚠️ POSITION IS NOT IDENTITY. This round's own near-miss.

`reportData` is sorted **in place** by `renderTable()`, and the reconcile sweep
*finishes by sorting the table by Δ*. The first version of `buildRebuildPlan()`
keyed its moves by the array index the sweep had captured — which means every
correction would have been written to whichever student happened to occupy that
row after the sort. **One child's corrected time, written onto another child's
log, in bulk, with a preview that named the right student.**

It was found by reading the code, not by running anything. Every arithmetic
assertion in this repo would have stayed green through it — which is Jake's
standing point about Round 16 arriving one round later and landing on the same
mistake. Everything that survives a render is keyed by `uid` now and resolved to
an index at the moment of use (`uidIndexMap()`), including at write time, because
clicking a column header between reading the preview and pressing the button is
an entirely ordinary thing to do.

`reconcile-test.mjs` Part B is the regression guard and it is the reason that
file exists.

### 0.8.5 ⚠️ WHAT THE HARNESS DOES NOT COVER. Read this before trusting green.

`tests/reconcile-test.mjs` — 35 assertions, all passing, **five of them
mutation-verified** (un-guard the zero refusal → 3 fail; restore the positional
index → 3 fail; pass `allowZero` from the bulk path → 1 fail; move the `expect`
check after the write → 1 fail; put an `updateDoc` in the read-only half →
1 fail).

It does **not** cover, and no harness in Node ever will:

* whether `firestore.rules` actually permits the sweep for a real staff account
  (rules are not evaluated here — and note that the bulk write needs
  `readsWholeBuilding()`, so a class-scoped teacher's rebuild would be denied.
  The preview detects this client-side and disables the button with an
  explanation, but that check is a client-side guess at a server-side rule);
* that the `⟳` button still works now that `recalcDailyLog()` returns an object
  instead of a boolean (both pre-existing callers ignore the return value, and an
  object is truthy, so this should be inert — *should be* is not *verified in a
  browser*);
* anything whatsoever about a student's tab being open during a rebuild, which
  is the exact failure mode the "not during a period" rule exists for.

**Green here means the refusals are wired up. It does not mean the round is
safe.** Round 16 shipped three defects that each passed a full suite.

### 0.8.6 Costs and ceilings

* `MAX_RECONCILE_PAIRS = 2000` (students × days). Over that it **refuses** rather
  than truncating — same principle as `MAX_REPORT_DOCS`. A reconciliation you
  cannot tell is partial would report an all-clear it has not earned, on the one
  screen whose whole job is to be trustworthy.
* `RECONCILE_CONCURRENCY = 6`. Serial would take about a minute on a week of
  ninety students and Jake would reasonably assume it had hung; all-at-once drops
  connections. Cancellable, and a cancelled run shows **no partial results**,
  because a half-swept table reads exactly like a clean one.
* At Ellis a weekly reconcile is roughly 630 queries and a few thousand document
  reads. Comfortably inside the free tier; it is not free at district scale, and
  the confirm dialog states the cost before running.

### 0.8.7 Honesty affordances — do not "simplify" these away

* The three columns start as **`null`, not `0`**, and render as `—`. "Not
  measured" and "measured, clean" must never look the same. The sort comparator
  sinks nulls in both directions for the same reason.
* Any path that changes a row's total (`⟳`, manual Save, bulk rebuild) **blanks
  that row's reconciliation cells** rather than recomputing them from cached
  session numbers. Recomputing would be arithmetic dressed up as observation.
* After a rebuild the whole panel is replaced with *"reconciliation is now out of
  date"*. A summary reading "14 with a non-zero Δ" above a freshly-repaired table
  is a sentence that was true two seconds ago, which is the most misleading kind.
* Unreadable days render as `unreadable`, are excluded from every count, and are
  called out in red. A failed read must never pass for a clean one.
* CSV export gains the reconciliation columns **only when a sweep has run** — an
  always-present blank column in a spreadsheet that outlives the page is an
  invitation to read "no duplicates found" out of "never looked".

### 0.8.8 Accounting from the previous instance, carried forward deliberately

Round 16's own note, kept because it is the reason this round was scoped the way
it was: *three defects in two days, into a system where Jake is the only tester
and students are the blast radius. The writers were changed before anything
existed to see whether the numbers they produced were right. **That ordering was
the mistake, not the ambition.*** Round 18 built the observation tool and nothing
else. The next round should be very slow to break that ordering again.

---

## §0.7. Round 17 — Linotype

Jake asked for the repository to be organised: the root directory held seventy-nine
entries, most of them files no human ever opens, and the harnesses were interleaved
alphabetically with the code they test.

**⚠️ THE ONE THING TO KNOW ABOUT THIS ROUND: no app code changed.** Not one line of
`game.js`, `learn.js`, `admin.js`, any HTML page, either stylesheet, or anything else
the browser loads. Every version number in §2 is unchanged and still correct. If you
are debugging behaviour and the trail leads to Round 17, the trail is wrong.

**What moved:**

| to | what |
|---|---|
| `tests/` | all 33 harnesses (31 registered, 2 deliberately not), `run-all-tests.mjs`, `TESTING-ttb-test-epubs.md`, plus a new `tests/README.md` |
| `docs/` | `DESIGN-TELEMETRY.md`, `SCALE-PLAN.md`, `TTL-GUIDE.md`, `README-SESSION-LOGGING.md`, `PEDAGOGY-AUDIT.md`, plus `docs/archive/MULTITENANCY.md` and a new `docs/README.md` |
| `tools/` | `audit-versions.mjs`, `build-test-epubs.py`, `build-augie-epub.py`, plus a new `tools/README.md` |
| `firebase/` | `firestore.rules`, `firestore.indexes.json`, `storage.rules` |
| `functions/` | `index.js` — the Cloud Function, which had been sitting directly above `index.html` and is unrelated to it |

**What stayed, and why it had to:** GitHub Pages serves this repo from its root, so
the six HTML pages, the thirteen shipped ES modules, both stylesheets and `library/`
are all exactly where they were. `package.json` stays because npm requires it there.
`README.md`, `HANDOFF.md`, `CHANGELOG.md` and `CNAME` stay because they are the front
door. **Moving any shipped file into a folder breaks the site**, and no amount of
tidiness is worth that.

**What else this turned up** — the useful part, and the reason a reorganisation is
not just cosmetics:

1. **Two harnesses were passing and unwatched.** `sort-test.mjs` and
   `lesson-atomicity-test.mjs` were both green on demand and in neither list in
   `run-all-tests.mjs`, so nothing would have reported the day they stopped. Both
   registered. The suite is 27 fast harnesses now, not 25. This is invariant 39's
   territory: **a test nobody runs is not coverage, and a test nobody *registers* is
   the same thing with better camouflage.**
2. **`@xmldom/xmldom` was never declared.** `cover-harness.mjs` needed it, the old
   `run-all-tests.mjs` header told you to `npm install --no-save` it, and
   `package.json` did not list it — the same class of defect Round 9 fixed for the
   other four packages and this one survived. Declared in `devDependencies` now.
   `cover-harness.mjs` is still not registered, deliberately: it prints a report for a
   human to read and exits 0 regardless, so registering it would add a line that says
   `ok` unconditionally. See `tests/README.md`.
3. **There was no `.gitignore`.** Harmless while Jake deploys from a browser and
   never runs npm — but every Claude session that runs `npm test` creates
   `node_modules/`, and one commit through github.dev would have pushed twenty
   thousand files into a repo GitHub Pages serves. Added.
4. **`MULTITENANCY.md` was never deleted.** Both this file (§9) and `README.md`
   recorded it as gone from Round 14 onward while it sat in the repo root the whole
   time. That is the worst of both states: anyone trusting the note would not open
   the file, and anyone finding the file would not know it was superseded. It is in
   `docs/archive/` now with its original warning header intact. **Deleting it for
   real is Jake's call, not a tidy-up's** — see §9.

### ⚠️ Second pass — three harnesses from a concurrent round

Jake handed over `open-unit-test.mjs`, `session-merge-test.mjs` and
`source-split-test.mjs` from **another instance working on the pages at the same
time**. All three were written test-first: they assert behaviour the shipped repo
does not have. Merged, with three kinds of edit.

**1. Paths.** All three read `./game.js` and friends; they are `../` now, and
`source-split-test.mjs`'s three working-directory-relative reads were converted to
`import.meta.url` like the rest of the folder.

**2. Versions.** `open-unit-test.mjs` **arrived as v1.2.0 with its content already
changed** — the concurrent round moved its `session-log.js` pin from 1.2.1 to 1.3.0
and left the header alone, so two different files were both calling themselves
v1.2.0. Since v1.2.1 was spent on the tests/ move, it is **v1.2.2**. The other two
self-bumped correctly (v1.1.0 and v1.4.0) and both clear the reorg's patch numbers.

**3. ⚠️ `PENDING`, a new third list in `run-all-tests.mjs` (v1.3.0).** Dropping these
into `FAST` would have moved the headline from "1 failing" to "4 failing" — and
invariant 54, plus `README.md`'s own warning, is that an accepted red is precisely
how the next real failure hides. Pending harnesses run, their blockers are printed,
and they **do not count toward `failed`**.

| harness | blocked on |
|---|---|
| `open-unit-test.mjs` | `session-log.js` v1.3.0 — 1 assertion (the version pin) |
| `session-merge-test.mjs` | `session-log.js` v1.3.0 flush serialization — 4 assertions. Part E reproduces the **duplicate-session race of 2026-08-19**: clicking Home fires both `visibilitychange:hidden` and `pagehide`, each calling `flushSessionsNow()` fire-and-forget, and the second read a queue the first had not cleared. |
| `source-split-test.mjs` | `reports.html`'s summing merge + `sessionSignature()`, and `mySourceSeconds`/`logSourceBase` in `game.js`/`learn.js` — 11 assertions. ⚠️ **Historical: all of that was reverted hours later.** The harness is v2.0.0 now, Part C is deleted, and Part A asserts legacy-FIRST reading — the opposite of what this row describes. Kept as written because it records why `PENDING` existed, not what the harness currently checks. See §0.6 item 9. |

**⚠️ THE LIST IS SELF-CLEARING, AND THAT IS THE ONLY THING THAT MAKES IT SAFE.** A
pending harness that starts passing is reported as `LAND` with a capitalised notice,
because passing means the code shipped. **Promote it into `FAST` and delete it from
`PENDING` in the same commit that ships that code.** Verified by simulation, not
assumed: setting `SESSION_LOG_VERSION` to `'1.3.0'` flips `open-unit-test.mjs` to
`LAND` and fires the notice. A harness sitting quietly in `PENDING` is a disabled
test with a nicer name — which is what `chunktest.mjs` was deleted for.

**No app code was changed to make any of this pass.** The three harnesses are the
specification for the concurrent round's work; making them green is that round's job.

### ✅ Third pass — the app code landed, and PENDING emptied itself

Jake delivered `game.js` v3.29.1, `learn.js` v2.14.1, `lessons-admin.js` v1.11.1,
`session-log.js` v1.3.0 and `reports.html` v2.13.2 from the concurrent round. **All
three pending harnesses went green in the same run.** The runner reported `LAND` on
each and printed its notice; all three are promoted into `FAST` in this commit, which
is what the mechanism demands. `PENDING` remains in `run-all-tests.mjs`, empty, as the
documented home for the next test-first harness.

`npm test` → **26 of 27, 0 missing, 0 pending.** Only `metadata-map-test.mjs`.

**⚠️ ONE DEFECT IN THE DELIVERY, CAUGHT BY `audit-versions.mjs`.** `session-log.js`
arrived with `SESSION_LOG_VERSION = '1.3.0'` and a header still reading v1.2.1 — the
tool said *"header comment says v1.2.1 — one of the two is a lie"*, and the problem
count went from the standing 11 to 12. **This is the exact defect class `versions.js`
exists for**, and the same shape Round 6 found in `adventure-renderer.js`, only
inverted: there the constant lagged the code, here the header lagged the constant. The
v1.3.0 entry is written now, derived from the file's own `sessionLogFlush()` comment
block and §0.6 item 8 rather than invented, and marked as a Round 17 repair.
**Verified that nothing executable moved:** every non-comment line is byte-identical to
what Jake uploaded. Back to 11 problems.

**Part C was independently mutation-tested here, not taken on trust** — and the way
that nearly went wrong outlived Part C itself, so it is kept. §0.6 item 7 claimed that
re-introducing the v3.29.0 line makes `source-split-test.mjs` Part C fail. The first
attempt did not fire: the substitution silently missed, because the real line is
`secondsLibrary:  logSourceBase.seconds  + mySourceSeconds` with doubled spaces, and
the string being grepped to confirm the hit already existed *in a comment* a thousand
lines up. **So the confirmation confirmed the documentation, not the mutation, and an
invalid mutation looked exactly like a passing guard.** Re-run against the real
assignment, Part C failed on 2 assertions as claimed.

⚠️ **Part C no longer exists** — the fourth pass reverted the counters it guarded and
`source-split-test.mjs` v2.0.0 deleted it. The finding above is retained anyway,
because it is about verifying a mutation actually applied, which is a technique, not a
fact about that harness. It is the same shape as §0.6's closing lesson: a green result
proves the check ran, not that it checked what you meant.

### ⚠️ Fourth pass — the source split was reverted

`game.js` v3.30.0, `learn.js` v2.15.0, `lessons-admin.js` v1.12.0, `reports.html`
v2.14.0 and `source-split-test.mjs` **v2.0.0** landed. The full reasoning is §0.6 item
9, written by the round that made the call; it is not restated here. What matters for
this document:

- **`session-log.js` stays at v1.3.0.** The flush serialization was explicitly kept —
  it touches no counter. My header repair from the third pass stands, and the file was
  not re-delivered, so nothing about it changed in this pass.
- **`source-split-test.mjs` v2.0.0 is a MAJOR bump**, and it earns one: Part C is
  deleted and Part A's central assertion is **inverted** — legacy-first, not summed.
  A harness whose contract reverses is exactly the case the x-digit is for. It arrived
  as a major from the round that wrote it, so it is not mine to sign off; recorded here
  so it is not mistaken for drift.
- **Three stale references were corrected**, all of them things a green suite would
  never have caught: `run-all-tests.mjs`'s one-line description of the harness still
  advertised "Part C: no split field is fed from the shared cross-mode counter" for a
  Part C that no longer exists, and two passages in §0.7 above described the split as
  landed. **A test description is documentation with no test behind it** — nothing
  asserts it matches the harness, so it rots silently and reads as authoritative.
- **`npm test` → 26 of 27, 0 missing.** `audit:versions` → the standing 11.

**What did NOT get done, and is left flagged rather than improvised:**

- `package.json` still serves two masters — `dependencies` are the Cloud Function's
  (`firebase-admin`, `firebase-functions`) and `devDependencies` are the suite's. A
  fresh `npm install` therefore pulls the whole `@google-cloud` tree to run harnesses
  that never touch it. Splitting it into a root `package.json` and a
  `functions/package.json` is the correct fix and was **deliberately not done**: it
  changes what a deploy would install, and the function is mirrored into the console
  by hand rather than deployed from here, so the blast radius is not verifiable from
  inside the repo. Flagged for Jake.
- `metadata-map-test.mjs` still fails on the same 42 assertions. Untouched — §6.
- `firestore-rules.test.mjs` is still known-wrong. Moved, repointed at
  `../firebase/firestore.rules`, not repaired.

---

## §0.6. Round 16 — Royal

Round 15 (Densmore) shipped the AI-practice variety floor for game.js's ✨
Gemini-practice button and explicitly flagged, rather than fixed, the same gap
in School's own "🎲 Practice missed keys" button (`learn.js`'s
`buildRemediationLinks()`): it already required each letter to clear
`n >= 3` misses, but not that 3 *different* letters clear it, so a single
dominant letter could still produce a synthetic `key_random` drill built from
just that one letter. Jake asked for it to be closed. It is now.

**What shipped this round:**

1. **The remediation variety floor.** New `REMEDIATION_CHAR_MISS_THRESHOLD`
   (3) and `REMEDIATION_MIN_QUALIFYING_CHARS` (3) constants in `learn.js`,
   plus a `_qualifyingRemediationChars()` helper that mirrors game.js's
   `_qualifyingPracticeChars()` exactly — same shape, same numbers, different
   file. `buildRemediationLinks()` now withholds the "🎲 Practice missed
   keys" button's HTML entirely unless at least 3 different letters clear the
   per-letter threshold; the "You often missed: ..." lesson links (which
   point at a real lesson per letter, one link at a time) are untouched,
   since those were never the synthetic-drill risk. **Defense-in-depth**, the
   same shape game.js's `startPracticeMode()` uses: `window._practiceMissedKeys()`
   re-derives the qualifying set from `missedChars` itself and bails if it's
   short, rather than trusting its `missedKeys` argument — so nothing that
   calls it directly, bypassing the button, can skip the check. `learn.js`
   v2.12.0.
2. **De-duplicated the qualifying-chars filter.** Before this round, the
   `n >= 3` filter existed in two places in `learn.js` — once inline where
   `remMissedKeys` was computed for wiring the button's click handler, once
   inside `buildRemediationLinks()` for the display list — with no shared
   source of truth between them. Both now call `_qualifyingRemediationChars()`,
   so the button (when it renders) and the keys it's wired to can't drift
   apart the way two independent copies of the same filter eventually do.
3. **The repair resync — a real incident, not a hypothetical.** Jake's
   week-counter audit (`reports.html`) repaired one student's inflated week
   twice and it came back inflated both times. Root cause: a MacBook that's
   supposed to restart between class periods but sometimes doesn't — the
   browser tab (and its in-memory `statsData`) survives the "restart," still
   holding the pre-repair number, and the very next periodic flush wrote that
   stale number straight back over the fix. The exact mechanism that let this
   happen: `mergeGuestStats()`'s data-loss floor (`Math.max`, never trust a
   decrease — by design, see §3's write-up of the 2026-08-18 doubling bug)
   cannot tell "the number went down because it was lost" from "the number
   went down because it was corrected," so it defends against both, and a
   repair IS a decrease.
   New: `reports.html`'s `repairWeekCounter()` now stamps a plain
   `repairedAt: Date.now()` alongside the corrected fields (not
   `serverTimestamp()` — this only needs to be self-consistent within one
   admin's own repair run, not agree with any client's clock).
   `game.js`/`learn.js` each gained `lastKnownRepairedAt` (captured in
   `loadUserStats()` when `weekStart` matches, reset to 0 on week rollover)
   and `checkForWeekRepair()` — called from `flushAll()`/`flushStats()`,
   *right before* the write that would otherwise clobber a repair. If the
   doc's `repairedAt` is newer than what this session saw at load, it
   resyncs: server's corrected value plus this browser's own contribution
   since baseline, **no floor** — this is the one place the code is
   deliberately allowed to trust a decrease, because the marker is what
   proves it's a correction rather than a loss. One extra `getDoc()` per
   flush that was already about to happen (every ~5 min of active typing, or
   at session end), not one per second. `game.js` v3.28.0, `learn.js`
   v2.13.0, `reports.html` v2.12.0.
   **Has real harness coverage**, unlike items 1–2 above: `session-merge-test.mjs`
   Part D (v1.3.0) lifts `checkForWeekRepair()` out of both files the same
   way Part A already lifts `mergeGuestStats()`, and asserts: a newer repair
   resyncs correctly (server value + this browser's own contribution, no
   floor); the same `repairedAt` seen twice is a no-op, not a re-apply; no
   `repairedAt` on the doc (the common, unaudited case) leaves `statsData`
   untouched; a marker from a different week is ignored; an
   anonymous/signed-out session is skipped without a read or a throw.

⚠️ **NO HARNESS COVERAGE FOR ITEM 1's DOM WIRING** — same caveat Round 15 left:
the button gating itself (`getMissedCharsHTML()`, `buildRemediationLinks()`)
lives inside the `game.js`/`learn.js` monolith and isn't extracted. What IS now
covered, as of item 4 below, is the filter both of them call.

⚠️ **ONE THING THE REPAIR RESYNC DOES NOT COVER**: `mergeGuestStats()` itself
(the re-auth path, on a 24-hour token expiry) does not check `repairedAt` — it
doesn't need to, because `checkForWeekRepair()` runs independently on the very
next qualifying flush regardless of which path got a session into a stale
state, and re-running it against an already-correct `statsData` is a no-op
(Part D's second case asserts exactly this). Not a gap, just worth knowing
`mergeGuestStats()` and `checkForWeekRepair()` are two separate correctness
paths that happen to compose safely rather than one calling the other.

4. **`variety-floor.js` — the fifth shared module.** `_qualifyingPracticeChars()`
   (game.js) and `_qualifyingRemediationChars()` (learn.js) were the same nine
   lines with different names — filter a missed-character map to the ones
   clearing a per-character threshold, sorted worst-first. Both files flagged
   the duplication as worth closing "if this becomes a pattern"; it did, so it's
   closed. `qualifyingChars(missedMap, threshold)` and the convenience wrapper
   `hasVarietyFloor(missedMap, threshold, minQualifying)` now live in
   `variety-floor.js` v1.0.0, imported for real by both files (not lifted —
   it's DOM-free and pure, same reason `hud.js` is importable). Each file kept
   its own threshold constants (`PRACTICE_*` / `REMEDIATION_*` — two separate
   tuning knobs that happen to both be 3/3 today, not one shared constant) and
   every existing call site untouched; `_qualifyingPracticeChars()` and
   `_qualifyingRemediationChars()` are now one-line wrappers. No behavior
   change. `game.js` v3.28.1, `learn.js` v2.13.1.
   **Registered everywhere a shared module has to be**, so this doesn't
   reproduce the exact gap Round 15 found and closed for `hud.js` /
   `session-log.js` / `stats-wal.js`: `versions.js` and `audit-versions.mjs`'s
   `SOURCES` mirrors, `undefined-calls-test.mjs`'s `FILES` list, and
   `run-all-tests.mjs`'s syntax-gate `MODULES` list all now include it.
   **Has real harness coverage**: new `variety-floor-test.mjs` (v1.0.0), 13
   assertions against the real module — empty/null/undefined maps degrade to
   "nothing qualifies" rather than throwing, exactly-at-threshold counts as
   qualifying, worst-missed-first ordering, and `hasVarietyFloor` against
   Jake's original F/J bug report specifically (one dominant qualifying
   character never clears a floor of 3).

`npm test` → 24 of 24 harnesses now (variety-floor-test.mjs is new), 23 passing
— same pre-existing `metadata-map-test.mjs` failure as Rounds 14–15, untouched.
`undefined-calls-test.mjs` now says 13 JS files (was 12) and confirms every
identifier still resolves. `(syntax)` gate: 13 shipped modules, all parse.

5. **THE SOURCE SPLIT — DESIGN-TELEMETRY.md §2.4, the actual bug behind the
   week-counter incident this round started with.** Jake asked directly: "is
   there a D that does what we want, or do I have to risk the cost I don't
   want to?" — the choice was framed as A (full session-derivation: real,
   checked cost, ~$28–150/year, out of Jake's own pocket for a district paying
   him nothing) vs. B (per-source fields, zero added reads) vs. C (ruled out,
   doesn't close the bug). **Landed on B.** `typing_logs` no longer holds one
   shared `seconds`/`chars`/`mistakes` triple that BOTH page controllers wrote
   via `setDoc(merge:true)` from their own independent counters — that's what
   let School-then-Library the same day silently overwrite one mode's
   contribution with the other's, no error, real graded minutes gone. Now:
   `game.js` writes `secondsLibrary`/`charsLibrary`/`mistakesLibrary` (fields
   ONLY it ever touches); `learn.js` writes `secondsSchool`/`charsSchool`/
   `mistakesSchool`. Two independent fields on one document can't clobber each
   other under a merge — the collision is now structurally impossible, not
   carefully avoided. `game.js` v3.29.0, `learn.js` v2.14.0.
   ⚠️ **REQUIRES `firestore.rules` v2.4.0, DEPLOYED FIRST.** The old
   `validDailyLog()` required a legacy `seconds` field on every document — a
   brand-new day's first-ever flush under the new code would be a document
   with ONLY split fields, and the old rule would reject it outright, silently
   (the client catches the failure and logs a console warning; the student's
   time just stops recording that day, with nothing on screen to say so). The
   updated rule accepts either shape, every field optional individually but at
   least one recognized seconds field required, so an empty/garbage document
   still can't pass.
   **Read side**: `reports.html`'s new `readLogTotals(data)` sums both split
   triples when either is present, falling back to the legacy flat fields only
   for documents with neither — the split is authoritative once it exists,
   even at 0, on purpose (a present split of 0 is real information: this mode
   hasn't been used today yet, not "we don't know"). `reports.html` v2.13.0.
   `lessons-admin.js`'s roster panel got the same read-side fix, inline rather
   than shared (no module bridges two standalone pages) — v1.11.0.
   **Not chosen and why**: the fuller §4 proposal (deriving `typing_logs` from
   `typing_sessions` at flush time) closes the SAME bug and also delivers R4
   (delete a session, totals update) — but session records aren't timely yet
   (a student mid-chapter has zero session records for that period), and it
   costs Jake real, ongoing money for a district he isn't paid to support.
   Deferred, not abandoned — R4 is still owed whenever that migration happens.

6. **CONNECTING THE BUTTONS — deletability, today, for $0.** Jake's actual
   question wasn't really A/B/C at all: "I had a kid cheat today. How do I get
   rid of that bad batch?" The tools already existed and cost nothing —
   per-sprint outlier flagging (🚩, already shipped), a delete button on every
   session record, and a "⟳ Recalculate from sessions" button on every day's
   log — they just weren't CONNECTED, so deleting a session left `typing_logs`
   telling the old, inflated story until someone remembered to click recalc by
   hand. `delete-session-btn` now calls `recalcDailyLog()` automatically,
   reading which day to recalculate off new `data-idx`/`data-li`/`data-uid`/
   `data-date` attributes on the sessions-container element (added this
   round). `recalcDailyLog()` itself now writes the source-split fields too —
   computed from each remaining session's own `source` tag via new, PURE
   `splitSessionTotals()` — so a recalculated day migrates to the new shape as
   a side effect of being corrected.
   `allowZero`: the manual ⟳ button keeps its long-standing refusal on an empty
   result ("No sessions found") — usually a pre-v2.4.0 day with real time but
   no session records at all, where zeroing would destroy legitimate old data.
   The delete-cascade passes `allowZero: true`, because it knows for certain a
   session existed a moment ago; an empty result there IS the corrected truth,
   not a failed lookup.
   `save-log-btn` (the fully-manual override) now clears the split fields on
   save — otherwise a stale split sum would silently outrank Jake's hand-typed
   number the next time anyone reads the doc, since the split is always
   authoritative once present. chars/mistakes carry forward unchanged; only
   seconds is the thing being overridden.
   **Has real harness coverage**: new `source-split-test.mjs` (v1.0.0), 12
   assertions lifted straight out of the shipped `reports.html` (same
   technique `week-anchor-test.mjs` uses) — covers `readLogTotals()`'s four
   document shapes (legacy-only, both-split, one-side-split, and the case that
   actually matters: a present split of 0 must outrank a much larger stale
   legacy number) and `splitSessionTotals()`'s session-to-fields arithmetic
   (all-School, all-Library, an untagged session correctly folding into
   Library, empty input, and a malformed session missing chars/mistakes not
   poisoning the sum with NaN).

⚠️ **NOT YET COVERED BY A HARNESS**: `recalcDailyLog()`'s and `save-log-btn`'s
own Firestore read/write calls and DOM updates — only the pure arithmetic
inside them (`splitSessionTotals()`) is tested. The delete → recalc cascade
itself (the actual button-connecting) is UI wiring, same category as the
practice-button gating Round 15/16 also left uncovered, for the same reason:
not asked for, would have meant mocking Firestore and the DOM for a page that
has neither today.

⚠️ **DEPLOY ORDER FOR THIS ROUND MATTERS, FOR REAL, NOT JUST BY CONVENTION**:
`firestore.rules` v2.4.0 FIRST. Uploading `game.js`/`learn.js` before the rule
change is live means every student's next new-day flush gets silently
rejected — the exact failure mode the v2.3.0 "NO keys().hasOnly()" note in the
rules file already warned about, now actually possible for a different reason.

7. **⚠️ ITEM 5 SHIPPED BROKEN AND WAS FIXED THE SAME DAY — READ THIS ONE.**
   Jake deployed the source split, typed in School and then Library, and looked
   at the report. It was wrong, and the way it was wrong is the most important
   thing in this document.
   **The defect**: `game.js` wrote `secondsLibrary: statsData.secondsToday`.
   But `statsData.secondsToday` comes from `users/{uid}/stats/time_tracking` —
   a counter BOTH page controllers read, increment, and write back. It has
   never been per-mode. So the "Library" field was receiving the COMBINED day
   total, and `learn.js` wrote that same combined total into the "School"
   field. **Two disjoint field names fed from one shared number is not a
   split.** It reads plausibly right up until both modes touch one day, at
   which point `readLogTotals()` sums two overlapping numbers and inflates.
   The whole point of the change was that the two sides can't contaminate each
   other, and the wiring reintroduced exactly that.
   **The fix (`game.js` v3.29.1 / `learn.js` v2.14.1)**: per-page counters
   `mySourceSeconds`/`mySourceChars`/`mySourceMistakes`, incremented ONLY at
   the three sites that increment `statsData.*Today`, counting only what THIS
   page typed since THIS page loaded — deliberately NOT routed through
   `statsBaseline` or `mergeGuestStats()`, which exist to reconcile a shared
   counter and are the very machinery that went wrong. Plus
   `loadLogSourceBase()`, which reads what this mode had already recorded today
   (ONE document read at page load, not per flush) so a student returning for a
   second Library session the same day doesn't erase the first. The flush
   writes `base + mine`, which is idempotent — re-flushing writes the same
   value rather than accumulating. Both reset on midnight rollover alongside
   the counters they travel with.
   **`readLogTotals()` also corrected (`reports.html` v2.13.1,
   `lessons-admin.js` v1.11.1)**: v2.13.0 returned the split sum ALONE whenever
   either split field existed. Jake watched his morning's School time vanish
   from the report the moment the afternoon's Library session wrote a split
   field — that morning had been recorded by pre-split code as flat `seconds`.
   The legacy field is now SUMMED with the splits, which is correct because the
   two shapes describe disjoint periods: `seconds` can only have been written
   by pre-split code, and the per-page counters start at zero on page load so
   the splits never re-include anything the old code already recorded. Both
   repair paths preserve this: `recalcDailyLog()` deletes the legacy fields
   when it writes splits, `save-log-btn` deletes the splits when it writes a
   manual flat total.
   **Guarded structurally** — `source-split-test.mjs` v1.1.0 Part C asserts the
   shared counter never appears on the right-hand side of a split field, that
   the per-page counter is actually incremented, and that it sits with
   `statsData.secondsToday++` rather than somewhere else. This is weaker than
   an arithmetic test (the flush is far too entangled with Firestore and the
   DOM to lift the way Part A lifts `readLogTotals()`) but it was
   **mutation-tested**: re-introducing the v3.29.0 line makes Part C fail. Note
   the guard strips comments first — both files necessarily quote the bad line
   verbatim while explaining it, and the guard fired on the documentation on
   its first run.
   **The lesson for whoever is next**: the round that shipped this also shipped
   a harness, ran a clean suite, and reasoned carefully in a long comment — and
   was still wrong, because every test written was a test of the *arithmetic*
   and the defect was in *which variable was handed to it*. A green suite
   proves the code does what its author thought; it cannot prove the author
   understood the data. Jake's thirty-second manual check found in one try what
   25 harnesses missed. **When a change touches a counter, trace where the
   number comes from, not just what is done to it.**

8. **THE DUPLICATE SESSION — a race the code had explicitly argued was
   impossible.** Jake typed one 23-second Pinocchio run, clicked Home, and
   Reports showed TWO identical rollups: same timestamp, same 182 characters,
   same sprint, both labelled "left page".
   **The cause**: `sessionLogFlush()` removes records from the local queue only
   AFTER `await _addDoc(...)` resolves — a full network round trip. Clicking
   Home fires BOTH `visibilitychange:hidden` and `pagehide`, and each calls
   `flushSessionsNow()` fire-and-forget, unawaited. The second call ran while
   the first was still in flight, read a queue nobody had cleared yet, and
   wrote the same record again.
   ⚠️ **`flushSessionsNow()`'s own header asserted this could not happen** —
   "it is self-limiting: records are removed from the queue as they land."
   That is true sequentially and false concurrently, and it had been written
   down confidently enough that nobody re-examined it. A comment claiming
   safety is not a guard.
   **The fix (`session-log.js` v1.3.0)**: flushes are serialized on a promise
   chain inside the module that owns the queue — not in the callers, because
   there are four call sites across two files, two of them deliberately
   unawaited on navigation paths, and any future caller would inherit the same
   trap. Callers wait their turn rather than being dropped: a caller arriving
   mid-flush may carry records the in-flight run never saw.
   **Mutation-tested.** `session-merge-test.mjs` Part E (v1.4.0) pushes one
   record, fires two unawaited flushes exactly as the real handlers do, and
   asserts one document is written. Defeating the serialization makes it report
   `got 2` — Jake's duplicate, reproduced. The stub `addDoc` used elsewhere in
   that file resolves instantly and CANNOT reproduce this; Part E's is
   deliberately slow, because the window only exists across a real await.
   **The already-written duplicates are still in the database**, and
   `recalcDailyLog()` grades from `typing_sessions` — so a duplicate would
   inflate the very day a repair is trying to correct, which matters more now
   that the post-delete recalc fires automatically. `reports.html` v2.13.2 adds
   `sessionSignature()` (sprint instants, not totals — two genuine sessions can
   coincidentally share seconds and characters); the recalc ignores duplicates
   arithmetically while the drill-down MARKS them "⧉ duplicate" rather than
   hiding them, since Jake needs to see one to delete it and a silently
   collapsed view would contradict the run count beside it.

9. **⚠️ THE SOURCE SPLIT WAS REVERTED. READ THIS BEFORE RE-ATTEMPTING IT.**
   Items 5 and 7 above describe a fix that was shipped, found broken in live
   use, re-fixed, and then **backed out entirely** the same evening. Final
   state: `game.js` v3.30.0 and `learn.js` v2.15.0 write the flat
   `seconds`/`chars`/`mistakes` triple exactly as v3.28.1 / v2.13.1 did.
   **DESIGN-TELEMETRY.md §2.4 is once again an OPEN, KNOWN defect** — two page
   controllers still overwrite each other's daily total — rather than a
   half-landed fix.
   **Why reverted rather than fixed forward.** The v3.29.1 per-page counters
   are, as far as I can tell, correct. But the round had by then produced two
   student-visible defects in two days, every one found by Jake in live use
   rather than by any harness, and he had one evening before students arrived.
   Shipping a third counter change overnight, unverified in production, was
   the same gamble that had already lost twice. Reverting to a defect he has
   lived with for months was the lower-variance choice. **That reasoning is
   about the calendar, not the code** — if you are reading this with time to
   test properly, the v3.29.1 approach (per-page counters + a base read once at
   load) is where to start, and it is in git history.
   **Read side follows the write side**: `reports.html` v2.14.0 and
   `lessons-admin.js` v1.12.0 read LEGACY-FIRST. Summing the two shapes
   (v2.13.1) would now double-count any day still carrying split fields from
   the hours the split was deployed, because the flat number is already the
   whole combined day. Split fields are read only for a day with no flat
   number at all — those exist, and would otherwise read as zero. They heal on
   the next flat write, and ⟳ rewrites them flat outright.

⚠️ **WHAT WAS KEPT, AND WHY IT IS SAFE.** The revert covers the counter/write
path only. These all survive because none of them can corrupt a number — they
only read or repair:
   - **The delete → recalc cascade** (`reports.html`): deleting a cheated
     session automatically rebuilds that day. This was the thing Jake actually
     asked for, and it works.
   - **Duplicate detection** (`sessionSignature()`): ⟳ ignores duplicate
     rollups arithmetically, and the drill-down marks them `⧉ duplicate`.
   - **The flush serialization** (`session-log.js` v1.3.0): correct in itself
     and touches no counter. See the caveat below.
   - **The week-repair resync** (`game.js` v3.28.0 / `learn.js` v2.13.0):
     tested, and it fixes a repair that provably would not stick.
   - **`variety-floor.js`** and the remediation floor: no data path at all.

⚠️ **AN OPEN QUESTION THE REVERT DOES NOT ANSWER.** After `session-log.js`
v1.3.0 was deployed, a THIRD identical 4:55 PM rollup appeared where there had
been two. Serialization prevents two concurrent flushes writing the same
record; it does NOT prevent a record being re-sent by a LATER page load if the
queue-clearing `localStorage` write never persisted because the page was being
torn down. That is the leading hypothesis and **it is not proven** — do not act
on it without evidence. The durable fix, if it holds up, is a DETERMINISTIC
document id derived from `(uid, date, source, label, first sprint instant)` and
`setDoc` instead of `addDoc`, which makes a re-send overwrite rather than
duplicate and makes n-1 self-healing. **That needs a `firestore.rules` change
to allow owner update on `typing_sessions`, which today only allows create** —
get that wrong and sessions stop recording silently.

⚠️ **THE PATTERN ACROSS THIS WHOLE ROUND, FOR WHOEVER IS NEXT.** Three
defects shipped green: the shared-counter split, the legacy-drop on read, and
the flush race. Every harness written passed. Every one of them tested
ARITHMETIC — does this function compute the right number from these inputs —
and every defect was in CHOREOGRAPHY: which variable got handed in, which
handler fired twice, what the browser does at page death. **There is still no
end-to-end harness that simulates the exit sequence** (`visibilitychange` then
`pagehide`, slow network) and asserts a record lands exactly once. That harness
is worth more than the next feature. Until it exists, Jake is the integration
test, and that is not an acceptable place to leave him.

⚠️ **WHY THE WEEK-COUNTER AUDIT DID NOT CATCH THIS, AND WAS NEVER GOING TO.**
The audit compares `typing_logs` daily sums against the week counter in
`stats/time_tracking`. It never reads `typing_sessions` at all. The two
collections are written on the same trigger but audited by nothing in common,
so a duplicate rollup is invisible to every automated check in the project —
it showed up only because a human looked at the drill-down. There is no
sessions-vs-logs reconciliation anywhere. That is the largest remaining
unaudited surface, and it is the thing to build next if numbers go wrong again.

⚠️ **KNOWN, ACCEPTED, NOT FIXED**: two tabs of the SAME mode open at once
still race — both read the same base, and the last flush wins, losing the
other's contribution. This is pre-existing (the shared-field code had it too),
it is not made worse here, and closing it means either a read per flush or
Firestore `increment()` with the double-count-on-retry risk the WAL exists to
avoid. The ⟳ recalc-from-sessions button rebuilds any day this damages.

`npm test` at the close of Round 16 → 25 of 25 harnesses, 24 passing, same
pre-existing `metadata-map-test.mjs` failure. ⚠️ **That denominator is historical.**
Round 17 reorganised the repo and re-counted; see §0.7 for the number to use now.

---

## §0.5. Round 15 — Densmore

James Densmore financed Sholes's machine and, by every account, was the reason it
ever worked at all: he kept sending prototypes back with the same demand — *does
it actually do the thing, or does it just look like it does?* That's this round.
Round 14's HUD fix (v3.26.2, the entry directly below) shipped with tests green
and a HANDOFF paragraph explaining exactly why it worked. It didn't. The seed
paint it introduced was overwritten one line later by the very call it was
supposed to precede, and a second paint the init handler's own comment claimed
existed had been deleted at some earlier point without the comment going with
it. Both defects were invisible from inside `game.js` — each line was locally
correct — and invisible in the test suite, because `open-unit-test.mjs` Part E
checks for a second *increment* site, not a repaint that never fires. Only
Jake, watching the actual page, caught it.

**What shipped this round:**

1. **The real HUD fix.** The cache-fallback that used to be a one-shot block in
   `loadChapter()` now lives *inside* `updateTimerUI()` itself, so every caller
   gets it — the same shape `learn.js`'s `renderTimeHUD()` already had, and the
   reason School never had this bug. The missing post-`loadGoals()` repaint is
   restored. `game.js` v3.26.3. See §3.5 amendment below.
2. **The version footer redesign**, both student pages. `#footer-primary` shows
   this page's html/js/css triad, always, no click required. `#footer-full` is
   everything else — every file `versions.js`'s `SOURCES` knows about, hud.js
   and session-log.js and stats-wal.js included — on hover, or tap-to-pin on
   touch. Reuses `readDeployedVersions()`/`renderBuildList()` exactly as
   `index.html`'s build-info button already did; nothing new was invented.
   `game.js` v3.27.0, `learn.js` v2.11.0, `versions.js` v1.7.0, `style.css`
   v3.5.4. `game.html` and `learn.html` are now versioned themselves (v1.0.0
   each), the same way the stylesheets are — a comment near the top, parsed by
   `versions.js`. Built because Jake, debugging the HUD bug, had no way to see
   which `hud.js` was actually deployed — this is the fix for that blind spot,
   not a cosmetic add-on.
3. **`audit-versions.mjs` closed a three-module gap against `versions.js`** it
   should never have had — `session-log.js`, `stats-wal.js` and `hud.js` were
   missing from its `SOURCES` mirror since the round each was added there.
   Found while adding the two new html entries. v1.1.0.
4. **The AI-practice variety floor.** A student had missed "F" and "J" —
   really just F, in any quantity that mattered — and the ✨ Practice button's
   Gemini paragraph came back so F-heavy it was trivially fast and accurate to
   type: free banked time, not remediation. `game.js`'s
   `getMissedCharsHTML()`/`startPracticeMode()` now require
   `PRACTICE_MIN_QUALIFYING_CHARS` (3) DIFFERENT characters, each missed at
   least `PRACTICE_CHAR_MISS_THRESHOLD` (3) times, before the button offers or
   the call fires — mirrors the `n >= 3` per-character convention
   `learn.js`'s `buildRemediationLinks()` already used, adds the missing
   distinct-count floor on top. **Enforced server-side too**, in
   `index.js`'s `generatePractice()` — deduplicated exact-match count of
   `problemChars` must clear the same floor, because the callable is reachable
   directly from devtools regardless of what the button does. ⚠️ **While
   fixing this, found and fixed a real ordering bug**: input validation used
   to run *after* the daily-limit transaction reserved a slot, so a rejected
   request burned one of the student's 5 daily sessions for nothing. Moved
   validation first. `game.js` v3.27.1, `index.js` v1.7.0.
   
   **Not yet done, flagged for Jake:** School's own "🎲 Practice missed keys"
   (`learn.js`'s `buildRemediationLinks()`) has the same shape of gap — it
   already requires `n >= 3` per letter but not 3 *different* qualifying
   letters, so a single-letter synthetic drill is still reachable there.
   Different risk profile (a random-key drill, not an AI essay one common
   letter can dominate), so left alone rather than changed without being
   asked.
5. **The HUD long-form clip.** `hud.js`'s combined Sprint+Daily form
   ("Sprint 29:59 / 30:00 (Daily 119:55 / 120:00)") runs 40+ characters and
   was silently hard-clipping at `.hud-section.left`'s boundary — no ellipsis,
   no way to see what was cut, because `#hud-time` had no overflow handling of
   its own. `hud.js` now returns `long: showSprint` (v1.2.0); `game.js` and
   `learn.js` use it to toggle a `.hud-time-long` class (smaller font) and set
   a `title` attribute (full-string tooltip) on `#hud-time`. `style.css`
   (v3.5.5) makes `#hud-time` the designated shrinker, same pattern
   `#hud-lesson-label` already used, and pins `#trophy-btn` /
   the new `#hud-back-link` id against shrinking so they're never what gives.
   ⚠️ **Considered and rejected: a real second line.** `style.css`'s own
   header carries three rounds of hard-won bugs (v3.5.1–v3.5.3) from this
   exact bar wrapping — reopening variable height for this felt like the
   wrong trade against a safer fix that solves the actual complaint (silent,
   invisible clipping) without touching `#hud`'s fixed 60px height at all.
   `game.js` v3.27.1, `learn.js` v2.11.1, `hud.js` v1.2.0, `style.css` v3.5.5,
   `game.html` v1.1.0. Pin update: `hud-test.mjs` v1.1.0, new B-section
   assertions for the `long` flag.

⚠️ **NEW LOGIC THIS ROUND HAS NO HARNESS COVERAGE.** Items 4 and 5's DOM-level
wiring (`getMissedCharsHTML()`'s button gating, the `.hud-time-long` class
toggle) live inside `game.js`/`learn.js`'s monolith and aren't extracted into
a testable pure module the way `hud.js`/`session-log.js` are. `hud-test.mjs`
covers the new `long` flag itself (it's pure, in `hud.js`), and
`index.js`'s server-side variety floor is at least type-checked by
`node --check`, but nothing exercises the actual gating logic end to end. If
this becomes a pattern worth trusting, it's a candidate for extraction next
round — not done here because it wasn't asked for and would have widened this
round's diff considerably.

⚠️ **A LESSON FOR THE NEXT ROUND, NOT JUST A LOG LINE.** A comment describing
what a function call does is not evidence the call exists. Both defects this
round fixed were paired with prose that correctly described the *intended*
behaviour and shipped anyway, because nobody re-read the code next to the
comment after editing one side of it. When a fix is "restore a call the
comment says should be here," grep for the call before writing the comment
that explains it — the grep is the whole test.

`npm test` → still 23 of 24 harnesses pass; same pre-existing `metadata-map-test.mjs`
failure as Round 14, untouched. `hud-test.mjs` and `open-unit-test.mjs` Part E
both still pass — no second increment site, no formatter drift.

---

