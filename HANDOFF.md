# HANDOFF — TypeThatBook

<!-- HANDOFF.md v14.4.0 — consolidated 2026-08-18 by Round 14 (Sholes).

     ⚠️ THIS IS THE ONLY HANDOFF DOCUMENT. It replaces every HANDOFF-roundN.md
     that ever existed. Rounds 3, 5, 6, 7, 8, 9, 11, 12 and 13 have all been read
     and folded in; their files are deleted from the repo. Everything a future
     instance needs is here.

     ⚠️ DO NOT CREATE HANDOFF-round15.md. DO NOT FORK THIS FILE. §0 is the rule
     set and it is not optional. Six rounds of "go and read round 8 §4" cost Jake
     an entire evening of hunting, and produced an invariant numbering collision
     that took seven file uploads to repair. -->

**Round 14 — Sholes.** Predecessors: Ludlow (13) · Caligraph (12) · Bar-Lock (11)
· Williams (10) · Remington (9) · Yost (8) · Hammond (7) · Noiseless (6) ·
Mignon (5) · Oliver (4) · Blick (3) · Dvorak (2) · Underwood (1).
*Other projects, do not reuse:* Stedman, Fable, Trilby, Vernier.

> *On the name:* the Sholes & Glidden was an up-strike. The type hit the underside
> of the platen, so a typist wrote three or four lines blind and lifted the
> carriage to find out whether any of it was right. Every defect in this project's
> history is that machine: a number written where nobody could see it until later.

---

## §0. ⚠️ HOW THIS DOCUMENT WORKS — read before writing a word of it

**There is one handoff. This one. It is amended in place and never forked.**

1. **Never create `HANDOFF-roundN.md`.** Not to archive, not to be safe, not
   because your round was big. GitHub commit history is the archive and it is
   sufficient. A second handoff file is the beginning of nine of them.
2. **Never cite a document that is not in the repo.** Not "see round 8 §4", not
   "the reasoning is in the old handoff". If a claim matters, the claim goes
   *here*, in full, in your own words. If you cannot restate it because you cannot
   read it, then **it is gone, you say so once, and you move on.** Jake has stated
   plainly that he will not go looking, and he is right not to.
3. **Amend, don't append.** When your round supersedes a paragraph, *rewrite that
   paragraph.* Do not add a §7.4 amendment below a §7 that is now wrong. Round 12
   did that and the wrong version stayed on the page.
4. **Bump this file on the `x.y.z` pattern** in the comment block above. Minor for
   a normal round; major only with Jake's sign-off, like any other file.
5. **Delete as you add.** If your round makes a section obsolete, remove it in the
   same commit. This document earns its length only by being the shortest thing
   that is still complete.
6. ⚠️ **INVARIANT NUMBERS IN §5 ARE APPEND-ONLY. NEVER RENUMBER THEM AGAIN.** A
   new invariant takes the next free number and goes at the bottom of its group.
   Round 14 renumbered once, as a repair, and it cost seven file uploads — see §5.
7. **A document a session produces ships in the same commit as the code**, or it
   does not exist. This is the oldest rule in the project (Blick, Round 3) and
   breaking it is what produced the mess this file cleans up.

---

## §1. ⚠️ HARD CONSTRAINTS — these are not preferences

**Jake has no command line.** No `firebase deploy`, no `gcloud`, no emulator, no
`npm` on the machine that matters. He uploads files through the GitHub web portal
and clicks in the Firebase and Google Cloud consoles. **Anything that is not (a) a
file on GitHub or (b) a console click is not shippable.** An entire Auth
custom-claims role system was built across two rounds before anyone asked. That one
constraint explains `firestore.rules` v2.x reading Firestore documents instead of
token claims, and why `functions/index.js` is undeployable.

**Complete replacement files, never diffs or patches.** Every time.

**Version constants, not header comments.** Each file carries a runtime constant
that renders on the page; the header comment is decoration. `versions.js` parses the
constants out of the deployed files precisely so a stale cached file cannot lie about
its own version. Bump the constant.

- **One bump per shipped release, not per edit.**
- **Never walk a deployed version backwards.** Corrections go forward.
- **Patch (z) for fixes, minor (y) for features, both automatic. Major (x) requires
  Jake's explicit sign-off** — flag it, don't decide it.
- ⚠️ **Two harnesses PIN `session-log.js`'s version** — `session-merge-test.mjs` and
  `open-unit-test.mjs` Part D. Bump that module and **both** pins move in the same
  commit. Round 14 moved one and the suite named the miss on the first run, which is
  exactly what pins are for.

**`npm install` first on a clean container**, then `npm test`. Dependencies are in
`devDependencies` and are not vendored. **Round 10 shipped without running the suite
and took lesson mode down completely**; the harness that already existed named the
defect by file and line on the first run.

**Upload order is load-bearing whenever a shared module is involved.** `game.js` and
`learn.js` both import `session-log.js`, `stats-wal.js` and `hud.js`. A missing module
throws on import and renders **nothing at all** — there is no graceful degradation.
Shared modules go up first, always. Where a writer and a consumer change together,
ship the *consumer* first unless you have reasoned otherwise in writing: an old
consumer silently discards a new field.

**`experimentalForceLongPolling` in `firebase-config.js` is load-bearing.** It fixes
Safari's CORS block on Firestore's WebChannel transport. Not debug leftovers.

**Never retain student-identifying data.** No Skyward IDs, no real names, no
demographics tied to a person. The leaderboard stores initials only and there is no
browsable user directory, by design. `users/{uid}` deliberately holds no PII, which is
*why* the roster is built from `typing_logs` (§3.10).

---

## §2. Where the code is

Shipped state after Round 14, 2026-08-18. **Verified against the repo, not copied from
the previous table** — three consecutive rounds carried a stale version for `admin.js`.
Run `node audit-versions.mjs`; do not trust this table either.

| file | version |
|---|---|
| `game.js` | 3.26.1 |
| `learn.js` | 2.10.1 |
| `session-log.js` | 1.2.1 |
| `hud.js` | 1.0.0 |
| `stats-wal.js` | shared module — check the constant |
| `versions.js` | 1.6.0 |
| `keyboard.js` | 1.1.1 |
| `adventure-renderer.js` | 1.5.4 |
| `admin.js` | 3.31.0 |
| `lessons-admin.js` | 1.10.0 |
| `staff-admin.js` | 2.2.0 |
| `reports.html` | 2.11.0 |
| `firebase-config.js` | 1.2.0 |
| `firestore.rules` | 2.3.0 |
| `style.css` | 3.5.3 |

`npm test` → **23 of 24 harnesses pass.** The only failure is `metadata-map-test.mjs`
(42 of 487 assertions), pre-existing and unrelated — §6.

**Deploy check, in one glance:** Library footer reads `game.js v3.26.1`; Lessons footer
reads `School v2.10.1`; both student pages show a small grey `ID xxxxxxxx` bottom-left
once signed in. **If the ID stamp is missing, the new code is not running** and nothing
else you check means anything.

---

## §3. Architecture — understand these before editing

### 3.1 ⚠️ THE CENTRAL PROBLEM: three documents hold one quantity

| document | written | authoritative for |
|---|---|---|
| `users/{uid}/stats/time_tracking` | every flush | day + week totals (HUD) |
| `typing_logs/{uid}_{date}` | every flush | day totals (reports grade from this) |
| `typing_sessions/*` | unit end, and on hide | nothing — drill-down display only |

**Every counting incident in this project's history is the same sentence: two records
of one quantity, updated on different paths, disagreed.** The doubled week counter, the
missing stats documents, the HUD that changed on refresh, the cross-mode overwrite —
all of it.

⚠️ **`typing_logs/{uid}_{date}` is ONE document written by BOTH page controllers, each
from its own in-memory counter.** A student does ten minutes in School, opens Library,
and `game.js` writes 240 seconds over the top of 600. **That is a live data-loss path
today**, in the document the project grades from. Closing it is what §4 is about.

⚠️ **Do not re-gate the stats write on `final`.** Round 11 did, to save ~$85/year.
Result: roughly half of ninety students had no stats document at all, because a `final`
flush needs a deliberate exit and a child closing a Chromebook lid produces none. The
real saving is about $7/year at district scale and it cost the entire week of
2026-08-18.

### 3.2 The write-ahead log

`saveProgress()` used to fire on every `.`/`!`/`?`/newline, writing three documents each
time. Now everything records synchronously to localStorage each sentence and flushes to
Firestore on a timer (`FLUSH_INTERVAL_MS` / `LEARN_FLUSH_MS` = **300000**, five minutes)
and on real boundaries. `walRecover()` replays on the next load; `typing_logs` is a merge
and therefore idempotent under replay.

⚠️ **The WAL does not always survive.** It lives on hardware shared between students. Any
design treating it as a durability guarantee is wrong.

### 3.3 `session-log.js` — records, deltas and the watermark

A session record is one bounded stretch of typing: a Library sprint or a School run.
Records queue in localStorage, grouped by the date they were **typed** (not flushed — a
queue surviving overnight used to collapse yesterday's work onto today), and write in
rollup documents capped at `RECORDS_PER_DOC` = 200.

`logOpenSprint()` (game.js) and `logOpenRun()` (learn.js) close the open unit on
`visibilitychange: hidden` and `pagehide` **without ending it** — counters and
`sprintCharStart` are untouched, so a student who returns and finishes has only the
remainder recorded. This exists because a student who switches books every few sentences
used to produce counter time with *no session history at all*.

⚠️ **BECAUSE ONE STRETCH OF TYPING CAN PRODUCE SEVERAL RECORDS, THE WRITERS EMIT DELTAS
against a watermark of what has already been logged.**

- A zero or negative delta writes nothing and is not an error.
- A continuation carries its **own** recomputed WPM and accuracy. `reports.html` reads
  per-run figures as belonging to the row they sit on, the 🚩 fast-run marker especially.
- `continuation` records are exempt from the 5-second floor. A standalone 3-second run is
  noise; the 3-second tail of a recorded 40-second sprint is the rest of something real.
  A refused *first* record deliberately does not advance the watermark, or the seconds it
  declined would be orphaned.

⚠️ **RESET THE WATERMARK WHEREVER YOU RESET THE COUNTER, IN THE SAME PLACE.** Four such
sites in `game.js`, three in `learn.js`. A new sprint carrying a stale watermark records
**nothing** until it grows past the previous sprint's length — a silent loss, not a
crash. `open-unit-test.mjs` counts the reset sites against the shipped sources.

`flushSessionsNow()` uploads the queue immediately on hide and on navigation, outside the
60-second rate limit, because the queue was previously drained only by a `final` flush and
Reports showed n-1 sessions as a result. It is self-limiting.

### 3.4 ⚠️ `serverAt`, and why nothing reads it

Every date, duration and WPM interval is stamped by the student's own Chromebook clock.
`serverAt: serverTimestamp()` resolves at commit and lands on every `typing_sessions`
rollup. **Nothing reads it. No total derives from it. No panel shows it.** That is the
point: a cheat signal added on the day you need it has no history behind it.

⚠️ **`_stampServer()` HAS NO CLIENT-SIDE FALLBACK AND MUST NEVER ACQUIRE ONE.** A
`serverAt` built from `new Date()` agrees with `timestamp` by construction, so the
divergence is permanently zero — a field certifying "no clock tampering" whether or not
there was any. `session-merge-test.mjs` asserts the absence of a fallback against the
source text.

⚠️ **The dependency is optional on purpose.** `sessionLogInit()` takes `serverTimestamp`
and works without it, omitting the field. Jake uploads one file at a time, so there is a
window where the module is new and a page controller is cached. A *required* dependency
would write `serverAt: undefined`, which Firestore rejects, which fails the whole rollup
write, which loses a period of sprint detail. **A missing dependency costs one field; a
required one costs a period.**

⚠️ **There is no `clientAt` field and adding one would be a defect.** `timestamp` already
holds that value and keeps its name because `reports.html` and a live single-field index
exemption already know it.

### 3.5 ✅ ONE CLOCK — School's two-clock split is CLOSED (Round 14)

**Jake's ruling, 2026-08-18: time typed starts at the first CORRECT keystroke of a
run.** `drillPos` advances only on an accepted character, so `drillPos > 0` is that
moment exactly, and it is now the single gate on both pages.

`startGradedTimer()` in `learn.js` owns the **only** tick in that file, and
`stepSeconds`, `learnActiveSeconds`, `secondsToday` and `secondsWeek` all advance on
consecutive lines inside it. `gameTick()` in `game.js` gates on `lastInputTime` being
set, so a sprint no longer counts the two free seconds it used to grant before the
first keystroke. **Read `startGradedTimer()`'s header before adding anything to it.**

⚠️ **THERE WERE THREE INCREMENT SITES, NOT TWO** — `stepSeconds` under the graded
gate, `secondsToday` in a second interval under an idle-only gate, and a third copy of
that second interval inside `closeGenie()` with `ggBypassIdle` wired differently from
`game.js`. Collapsing them closed four things at once without any being fixed
separately: the first-keypress/first-correct-keypress gap, a hard stop that stopped
one clock and left the other running, the admin No-Idle flag meaning two different
things on the two pages, and the 1s-versus-100ms sampling difference (which retires
`DESIGN-TELEMETRY` step 6).

⚠️ **`learnTickInterval` IS AN ALIAS FOR `timerInterval`, NOT A SECOND TIMER.** Nine
call sites already clear it to stop the clock; aliasing keeps all nine correct rather
than betting they were all found. **Do not "clean up" one of the names without
checking every clear site.**

⚠️ **PAINTING IS NOT COUNTING, AND THE PAINT MUST NEVER BE GATED.** v3.26.0 gated
the accumulator correctly and left the *draw* call inside that gate, so students saw
`game.html`'s hardcoded `Daily 0:00` and an empty `#hud-week` until they typed. Every
number was right the whole time. A gate answers "did time pass?"; drawing answers
"what does the student see?", and the second is never "nothing" because the first is
no. Fixed in v3.26.1 / v2.10.1 and now asserted by Part E.

⚠️ **`open-unit-test.mjs` PART E COUNTS THE INCREMENT SITES IN THE SHIPPED SOURCES**
and fails if a second one appears on either page. That guard is the whole defence —
a second timer counting a slightly different number is invisible from inside either
file, because each stays internally consistent.

⚠️ **Nothing stored was rewritten.** Jake's ruling was explicit: the seconds already
banked were a gift and students keep them. This is a correction going forward only.
**Do not "correct" historical figures.**

### 3.6 ⚠️ The idle thresholds differ ON PURPOSE — 2s Library, 3s School

**Decided by Jake, 2026-08-18, closed.** Do not unify them. Do not "align" them. Library
is fluent readers typing prose they can already type, where a two-second gap is attention
drifting. School is beginners locating keys, where three seconds is often the work itself.
A single number either steals time from the students the lessons exist for or hands it to
the ones most able to idle. Round 12 flagged this as a symmetry violation and was wrong.

The symmetry actually required is that both sides pause on idle at all, record the same
*shape* of record, and be equally resistant to running out the clock. All three hold.

Open and minor: **tick resolutions** differ — Library accumulates in 100 ms slices, School
tests once per second — so School can mis-attribute up to about a second around a gap near
its threshold. Worth aligning eventually for precision. **Not a licence to touch the
threshold values.**

Admin-only, not urgent: `ggBypassIdle` ("No Idle" in the Game Genie) makes the School tick
accrue while idle, whereas in `game.js` the same flag only suppresses AFK auto-pause.
Gated on `ADMIN_EMAILS`.

### 3.7 The guest / expired-session merge, and its baseline

A 24-hour auth token lapsing mid-period read as a guest arriving for the first time.
`statsData` is module state and **a sign-out is not a page load**, so the tick kept
incrementing while every writer early-returned on a falsy user. The guest ladder armed,
the student signed back in, and `retroactiveSaveAnonSession()` did
`secondsWeek += server.secondsWeek`. Week doubled.

⚠️ **THE FIX IS NOT `max()`.** Sum is right for a true guest who typed earlier on another
machine; max is right for the expired session; **neither number contains the fact that
distinguishes them.** What was missing is how much of the live counter came from the
server, so that is now recorded:

```
statsBaseline               = statsData at the moment Firestore was read
this browser's contribution = statsData - baseline
merged                      = server + contribution
```

Correct in both cases — a true guest's baseline is zero and it collapses to the original
sum. ⚠️ **The baseline is captured in `loadUserStats()`, ABOVE `statsWalRecover()`.** A
recovered WAL tail is this browser's own unflushed work and belongs on the contribution
side; move the capture below the recovery and a re-auth silently discards whatever the WAL
just replayed.

`sessionExpired` is carried, not inferred — 29 sites in `game.js` alone test it.

### 3.8 The week starts on SATURDAY

`getWeekStart()` in both page controllers returns the Saturday beginning a Sat–Fri school
week, so Mon–Fri sits whole inside one bucket and a weekly goal cannot reset mid-week.
`week-anchor-test.mjs` lifts the function from **both** the app and `reports.html` and
asserts they agree — the v2.10.0 audit computed Mondays, every comparison missed, and the
panel printed "no problems found" across ninety students.

⚠️ **A period boundary right for accumulating is not automatically right for looking
back.** The admin review filter defaults to *Last 7 days*, not Sat–Fri, because a teacher
reviewing on a Saturday would otherwise see the week that just ended excluded entirely.

### 3.9 Stored positions, re-anchoring and the staleness ladder

A bookmark is `(chapter, charIndex)` and **both coordinates are measured against one
version of the text.** Re-upload the library and every stored offset silently becomes an
index into a text that no longer exists. Three rounds hardened the chapter id and nobody
looked at the other coordinate, one line away.

**Proof, then guard, then ladder — in that order, and the order is load-bearing.** Every
write stamps `contentVersion`, `chapterTitle`, `chapterLen` and `anchorText` (~48
characters *behind* the cursor — that is text the student has demonstrably read; an anchor
from ahead would re-anchor them onto content they have never seen). A matching
`contentVersion` is the fast path at zero cost. A mismatch searches for the anchor.
`findAnchorEnd()` returns the occurrence **nearest** the old offset, not the first — a
48-character anchor can legitimately repeat, and taking the first match drags a student
backwards, which looks exactly like the bug.

⚠️ **A chapter that SHRANK below a stored offset is both out of range and perfectly
rescuable**, because the anchor still names the words they reached. That is why proof runs
before the dead-state guard. Putting the guard first throws away the only hard evidence in
the system — and a harness caught exactly that on one run.

**Jake's time-based ladder is load-bearing pedagogy, not a tuning constant:** under a week
→ exact spot; a week to a month → sentence start; a month or more → chapter start. The
reasoning is about what a child remembers. **Do not "simplify" it.** It needed no
migration, because `lastUpdated` was already on every progress document.

⚠️ **An offset at or past the end is a dead state, not a position**, and
`reconcilePosition()` can never return one. "One sentence left to type" is what a stale
offset *looks like*, and Aesop's Fables (284 chapters of ~500 characters) is the library's
best stress case — almost any overshoot lands past the end there. **Never accept "the
chapter completed" as a pass:** check the completion modal, because `0 WPM` and `0m 1s`
means nobody typed anything.

Flip Back is bounded by `furthest`, **not** by the current position — a bound computed from
state the feature itself mutates is not a bound. Cross-chapter is deliberately two-step
because `getSentenceMap()` reads `fullText`, which exists only for the loaded chapter.
⚠️ Sentence-level backjump makes WPM farming easier; **if the leaderboard ever looks wrong,
start here.**

⚠️ **No admin repair tool is buildable as the rules stand.** `firestore.rules` lets staff
read any student's progress but restricts write to `request.auth.uid == uid`. Repairing
from `admin.html` needs a Cloud Function or a looser rule; healing in the client on next
open is better than both, costs nothing for books nobody reopens, and needs no coordination.

### 3.10 Two copies on purpose, and the roster's real shape

`applyPendingClassAssignment()` exists in **both** `game.js` and `learn.js` and neither page
controller can import the other. **Change one, change both** — a student can reach either
page first and the whole point is that it does not matter which. `renderIdStamp()` is
duplicated for the same reason; fifteen lines, and this note is the tripwire for extracting
it if it grows.

The Students roster is built from `typing_logs` over `ROSTER_DAYS` = **45**, so it is
**activity, not enrollment** — an imported student who has never typed cannot appear under
any filter and widening the range will never summon them. That is why the importer could not
see returning students in August, and why intent travels on the pending record (`overwrite`)
instead of being guessed. Every exit path from `applyPendingClassAssignment()` deletes the
record.

⚠️ **Do not "fix" the roster by putting emails in user documents.** The absence of an
email→uid index outside `typing_logs` is the privacy constraint working.

⚠️ **There is no `classAssignedAt` field and there must not be one.** The staff grant on
`users/{uid}` is `.affectedKeys().hasOnly(['classId','schoolId'])`, so a third field is
denied — it would need a console rules paste *and* widen what a teacher may write into a
student's document to store a fact the teacher already knows.

### 3.11 What needs a console paste, and what does not

- **`firestore.rules`** — the `typing_sessions` create rule requires `uid`, `seconds` in
  `[0, 86400]`, `sprints` a list of ≤ 200, and `expiresAt`. It has **no `keys().hasOnly()`**,
  deliberately, so added fields are not denied. Both `source` and `serverAt` rode in on that
  property. Read the comment above `validDailyLog` before "tidying" it.
- **`firestore.indexes.json`** — the drill-down query is equality-only and needs no composite
  index. ⚠️ **Adding an `orderBy` or a range filter does**, and that is a console change.
  `serverAt` is deliberately *not* exempted from auto-indexing, because the first thing anyone
  will want from it is a range query, and removing an exemption rebuilds the index across the
  collection. Re-decide at district scale.
- **App Check is initialized but not enforced.** A `401` on `recaptcha/api2/pat` is visible at
  Ellis; harmless now, an **outage** the day it is enforced if a district filter blocks
  recaptcha paths. Run `ttbAppCheckStatus()` on a real school MacBook on the school network
  first. This rose in priority when book content became world-readable — it is now the only
  thing between Jake's card and a scraper.
- **Content is world-readable on purpose.** `books`, `chapters` and `lessons` are
  `allow read: if true`; `settings` is split by document id so `settings/goals` is public and
  `settings/languageFilter` is not, because publishing a curated list of slurs has no upside.
  ⚠️ **Anonymous Auth was the wrong answer and the rules file used to recommend it.**
  `signInAnonymously` appears nowhere in this repo; enabling it would make `signedIn()` true
  for the entire internet across six unrelated grants.

---

## §4. ⚠️ THE FORWARD PLAN — telemetry step 2

`DESIGN-TELEMETRY.md` is the design and it is live; read its §2 (verification-only, every
claim read out of shipped source) and §8 (things that must not happen) before writing code.
Steps 1 and 1.5 shipped in Round 13. **Step 2 is next: make `typing_logs` derived rather than
written from a live in-memory counter.** It closes §3.1's data-loss path and is worth more
than Rounds 12 and 13 combined.

⚠️ **Step 2 has a prerequisite of the same shape step 1.5 had. Found by Round 14 reading the
writers; not yet fixed.**

Step 1.5 fixed session *coverage* — abandoned units now produce records. It did not fix
*timeliness*. Session records are created only at unit boundaries and on hide/pagehide;
nothing periodic. Meanwhile `typing_logs` is rewritten from the live counter every five
minutes, deliberately, so a teacher looking mid-period sees today. **A student twenty minutes
into an uninterrupted chapter has twenty minutes in the counter and zero session records.**
Derive `typing_logs` from sessions as specified and that student's daily figure sits flat at
their last completed unit for the whole twenty minutes — a day-one visible regression, and the
mirror image of the undercount step 1.5 fixed.

**One decision is required before step 2 can be written. It is not Claude's.**

⚠️ **THE GRADED CLOCK IS DECIDED. Jake, 2026-08-18: the clock starts on the first
keystroke of a run and not before.** That is `stepSeconds` semantics — School's
existing graded gate — and it is now the definition of "time typed" on BOTH sides.
Recorded here and in `DESIGN-TELEMETRY.md` §2.7 because the previous round scoped
this work in conversation and never wrote it down, which cost it entirely.

✅ **SHIPPED in Round 14** — `game.js` v3.26.0 / `learn.js` v2.10.0. See §3.5.

**Still open — where the sum comes from:**
   - **(a) Query the day's sessions at flush time.** Literally what the design says.
     Closes §3.1 completely. Costs ~15–30 reads per flush per student — the one figure in
     `SCALE-PLAN.md` that was never checked.
   - **(b) Per-source fields in `typing_logs`** (`secondsLibrary` / `secondsSchool`), each
     written by exactly one page, summed on read. Makes the cross-mode clobber *structurally
     impossible* with no extra reads. Costs changes in `reports.html` and `lessons-admin.js`.
   - **(c) A local accumulator of committed sessions.** Cheapest, and **does not close §3.1**
     — two modes, two accumulators, same clobber. Ruled out here on the record rather than by
     omission.

**After step 2:** make `stats/time_tracking` a rebuildable cache with a "rebuild from sessions"
action in `reports.html`; weekly archive plus retention (⚠️ `typing_sessions` has a **120-day
TTL**, so once totals derive from sessions, day 121 makes last spring's numbers start
shrinking — a correctness bug waiting on a calendar); retire the week audit once the rest runs
clean for two weeks.

⚠️ **Do not answer the next divergence with a better audit.** An audit is a confession that the
data model permits states you have to go looking for.

⚠️ **Do not backfill synthetic session records.** School has no session history before
2026-08-18 and never will; manufacturing per-run detail that never existed is worse than an
honest gap.

### 4.1 ✅ THE CLOCK UNIFICATION — SHIPPED, Round 14

Done. `game.js` v3.26.0, `learn.js` v2.10.0, guarded by `open-unit-test.mjs` Part E.
Full detail in §3.5. **What remains of step 2 is below; this is no longer a blocker.**

⚠️ **What Jake should expect to see, and it is the only visible consequence:**
recorded minutes drop slightly from the deploy forward — the two free seconds at the
head of every Library sprint, and the seconds between a School student's first
keypress and their first correct one. Small per run; a struggling typist on a ten-run
lesson loses more than a fluent one. **It is a correction, not a regression**, but a
week-over-week comparison across 2026-08-18 will show a step change with no other
explanation. That date is the boundary; it is recorded here and in
`README-SESSION-LOGGING.md` so nobody debugs it later as a defect.

### 4.2 ⚠️ Open rulings that have been waiting since Round 8

Both were answered *by default* rather than by decision, and both have been carried unanswered
through five rounds. They are small.

- **Does re-reading a chapter un-tick its ✓?** Ships as "no", the non-destructive default.
  `completedChapters` feeds `chaptersCompleted` in the stats rollup and the ✓ in Game Genie's
  picker. Clearing it edits a record of something the student did; keeping it shows chapters as
  done that they are actively redoing. If you want it cleared, the place is `flipBackTo()`.
- **Should a hard time cap override a confirmed anchor match?** Ships as "no" — a found anchor
  wins regardless of age, because it is proof rather than a guess, and time governs only the
  fallback. If you want caps that override even a confirmed match, that is
  `reconcilePosition()`'s first branch and nothing else.

---

## §5. Invariants

⚠️ **THESE NUMBERS ARE APPEND-ONLY. DO NOT RENUMBER THEM. EVER.**

Round 14 renumbered once, as a repair, and it cost seven file uploads. The old sequence was
genuinely unusable: Round 9 assigned 56–81, and Round 11 — told to continue from Round 8, which
ended at 55 — **also started at 56**. Every number in that range meant two different things and
the code cited both meanings. A new invariant now takes the next free number and goes at the
bottom of its group. Citations in code carry the invariant's **name** as well as its number, so
a number that somehow drifts can still be resolved.

### Data, counters and records (1–16)

1. **ONE QUANTITY, ONE RECORD.** Two documents — or two fields — holding the same number will
   disagree. If you need a second view, make it an explicitly rebuildable cache and say so in
   the file header. **A cache you can always rebuild from truth is not a second source of
   truth.**
2. **TWO RECORDS OF ONE QUANTITY MUST SHARE A WRITE TRIGGER.** Not "be flushed often enough."
   Any staleness budget granted to one and not the other is a divergence you agreed to,
   debugged later by someone who does not know you agreed.
3. **A MERGE NEEDS A BASELINE, NOT A BIGGER HAMMER.** `sum()` and `max()` are both guesses at
   the same missing fact and each is silently wrong where the other works.
4. **A RECORD IS DATED WHEN IT HAPPENS, NOT WHEN IT IS WRITTEN.** Anything queued for later
   delivery carries its own timestamp, or a delayed flush relabels history.
5. **A RECORD IS ONLY COMPLETE WHEN ITS UNIT CAN END WITHOUT WARNING.** "It will finish" is an
   assumption about a twelve-year-old with a lid and a bell.
6. **RESET A WATERMARK WHEREVER YOU RESET WHAT IT MEASURES**, in the same place.
7. **ABSENT BEATS APPROXIMATED.** A field named for a trusted source, filled in by an untrusted
   one, type-checks and lies. Omit it and let the reader see it missing.
8. **A SIGNAL MUST BE PLANTED BEFORE IT IS NEEDED.** A comparison against history is worthless
   the day it ships and valuable a term later. Shipping the write side alone is a complete
   deliverable.
9. **"UNKNOWN" IS NOT "EXPIRED."** An absent or unparseable timestamp falls back to the
   permissive reading, or legacy data becomes silently unusable.
10. **A PENDING DOCUMENT IS A MESSAGE; READING IT CONSUMES IT.** Every exit path deletes. A
    record that cannot act must not survive to be re-read.
11. **A SIGN-OUT IS NOT A PAGE LOAD.** Module state survives it.
12. **`null` USER MEANS TWO DIFFERENT THINGS.** "Never signed in" and "token expired" need
    opposite handling everywhere they are tested. Carry the distinction; do not infer it.
13. **AN ID IS A LABEL.** Never `parseInt` one.
14. **BUMP THE CACHE KEY WHEN THE CACHED SHAPE CHANGES**, or the change silently does nothing
    for six hours.
15. **A CACHE GUARD CANNOT CATCH A WELL-FORMED STALE ENTRY.** Drop the goals cache
    unconditionally on any class change, not only when it looks empty.
16. **A PER-DEVICE ID IS NOT A PER-PERSON ID.** Two guests share a browser profile; what
    separates them is the tab, so scope to `sessionStorage`.

### Stored positions and restored state (17–28)

17. **ANY STORED OFFSET INTO CONTENT IS A FOREIGN KEY INTO A VERSION YOU DID NOT RECORD.**
    Character indices, line numbers, scroll positions, timestamps into media. Store what it was
    measured against, or a fingerprint of the content, or accept that it rots silently.
18. **WHEN YOU HARDEN ONE HALF OF A COMPOSITE KEY, STATE WHY THE OTHER HALF IS SAFE.** Three
    rounds hardened the chapter id, each writing a comment about renumbering. The character
    offset sat one line away, untouched, the whole time.
19. **THE DANGEROUS BUG IS NOT THE ONE THAT ERRORS — IT IS THE ONE THAT COMPLETES.** Ask of any
    restored state: *if this value were wrong, would the app fail, or would it succeed at
    something else?* A student does not report a smooth failure; they report finishing.
20. **AN OFFSET AT OR PAST THE END OF ITS CONTENT IS A DEAD STATE, NOT A POSITION.** Guard the
    *shape* of the answer — "does this leave anything to do?" — not just its range.
21. **RECENCY IS NOT VALIDITY.** A bookmark written an hour ago is garbage if the content
    changed after it was written. Never let an age threshold decide whether a provably invalid
    value is acceptable.
22. **PREFER PROOF TO POLICY WHERE PROOF IS CHEAP.** 48 characters per write turns "we think
    they were about here" into "they were exactly here."
23. **CONSULT PROOF BEFORE APPLYING A GUARD.** A value can be both out of range and exactly
    recoverable. Guards that run first discard evidence.
24. **A SELF-HEALING SYSTEM MUST NEVER WRITE ITS OWN BAD STATE BACK AS VERIFIED.** It converts a
    recoverable fault into a permanent one and deletes the evidence. Before writing a "this is
    now correct" marker, check that it *is*.
25. **A SYSTEM THAT CAN ONLY ADVANCE CANNOT RECOVER.** When auditing a flow, list the moves
    available and check whether any go backwards.
26. **SHIPPING THE GUARD IS HALF THE JOB WHEN A BUG HAS BEEN WRITING BAD STATE.** Ask "what did
    this corrupt that my fix cannot reach?"
27. **A BOUND COMPUTED FROM STATE THE FEATURE ITSELF MUTATES IS NOT A BOUND.** Flip Back bounded
    by the current position collapses the instant it is used.
28. **AN ESCAPE HATCH BELONGS WHERE PEOPLE ARE WHEN THEY NEED IT.** Ask of any recovery
    affordance: *what screen is someone looking at at the moment they realise they need this?*
    And do not gate it on the rare fault — an affordance that appears only after one is an
    affordance nobody has learned to look for.

### Deleting, refactoring and dead code (29–38)

29. **DELETING A SUBSYSTEM MEANS DELETING ITS READERS.** A deleted declaration leaves its
    references grep-invisible. Run `undefined-calls-test.mjs` first.
30. **AN UNDECLARED IDENTIFIER THROWS IN EVERY EXPRESSION POSITION**, not only when called, and
    takes down every statement after it in the same function.
31. **"DECLARED SOMEWHERE IN THE FILE" IS NOT "IN SCOPE HERE."** Three bugs of this one class
    have shipped in this codebase.
32. **THE GRAVITY OF DEAD STATE IS PROPORTIONAL TO HOW CAREFULLY IT IS MAINTAINED.**
    `lastSavedIndex` had eighteen assignments and no consumer, and its tidiness is what
    recruited a later round into adding a nineteenth.
33. **`_inited = true` SET BEFORE THE RISKY WORK IS A TRAP.** It turns a one-time failure into a
    permanent one. Set it last, or in a `finally`.
34. **A SHORT-CIRCUIT ADDED FOR ONE CASE WILL BLOCK A LATER RULE FOR ANOTHER.** When you add a
    rule downstream of an early return, test the early-return path against it.
35. **NEVER COMPUTE A DELETION SLICE FROM A LOOSE TEXTUAL MATCH.** A `startswith` once matched a
    comment in the file body and took 370 lines with it. Anchor deletions to an asserted line
    index, and assert the count before splicing.
36. **A PARSE CHECK PROVES SYNTAX, NOT SURVIVAL.** Before shipping a file edited by script, diff
    its declaration list against the previous copy.
37. **AN OLDER COPY OF A FILE IS A LIVE HAZARD, NOT A BACKUP.** Diff every file in a handed-over
    archive before touching any of it.
38. **A FEATURE THAT WALKS EVERY RECORD AND RE-SAVES IT TRIGGERS EVERY LATENT
    READ-MODIFY-WRITE BUG AT ONCE.** Ask what the save path does to values the form cannot
    represent.

### Tests and harnesses (39–58)

39. **A TEST THAT REIMPLEMENTS THE CODE IT TESTS PASSES AFTER THAT CODE IS DELETED.** A harness
    must lift, import or parse the *shipped file*, or it is testing a fossil.
40. **A GREEN SUITE IS EVIDENCE ABOUT THE MACHINE IT RAN ON.** Before claiming a dependency is
    declared, open the file.
41. **TEST THE FRESH-CLONE PATH.** The environment that built the thing is the one guaranteed
    not to reproduce a new contributor's experience.
42. **A LIFTED FUNCTION MUST BE SELF-CONTAINED.** Every module-scope reference becomes a
    ReferenceError inside the sandbox, swallowed by the function's own catch. Adding a
    dependency to a lifted function means updating its harness in the same commit.
43. **A HARNESS THAT LIFTS A BODY CONTAINING A TEMPLATE LITERAL MUST BUILD ITS SANDBOX BY
    CONCATENATION.** `${...}` is interpolated by the outer template before Node parses anything,
    and the SyntaxError points at the harness rather than the cause.
44. **A HARNESS THAT LOCATES CODE BY A COMMON SUBSTRING WILL ONE DAY TEST A DIFFERENT FUNCTION
    AND BLAME THE WRONG AUTHOR.** Anchor on something unique; throw a named error when it is not
    found.
45. **A TEST THAT ONLY PRINTS IS NOT A TEST.** Ask what a harness would have to see before it
    fails.
46. **A HARNESS THAT CRASHES TELLS YOU LESS THAN ONE THAT SURVIVES.** Running it against old code
    is the whole point, and a stack trace hides the other assertions.
47. **GRADE YOUR OWN ASSERTIONS.** Tag them `[BEHAVIOURAL]` or `[STRUCTURAL]`. Structural ones
    catch invisible, expensive defects and also break on innocent refactors; a harness that does
    not grade itself invites both to be trusted equally.
48. **THE NUMBER AN ASSERTION EXPECTS IS WHERE THE AUTHOR'S MISCONCEPTION LIVES.** A green
    harness proves the code agrees with the author, not with reality. When a test passes first
    try, re-derive the expected values from the requirement.
49. **DO NOT HAND-WRITE AN EXPECTED ORDERING.** Compute it from data already verified.
50. **TEST A COPIED CONSTANT AGAINST ITS SOURCE FILE**, not against your reading of it. The
    Monday week anchor was a confident assumption never checked against the source twelve feet
    away.
51. **A SHARED MODULE'S DEPENDENCY LIST IS A CONTRACT BETWEEN FILES THAT CANNOT SEE EACH OTHER.**
    Assert both call sites' dep sets are equal.
52. **ASSERT AN EXACT KEY SET, NOT THE ABSENCE OF ONE KEY.** `sig.classroom === undefined` passes
    just as happily when the whole function has been renamed out from under you.
53. **WHEN A FEATURE IS REMOVED, ITS TESTS ARE INVERTED, NOT DELETED.** The removal is itself a
    contract, and contracts want tests.
54. **A PERMANENTLY RED TEST IS WORSE THAN A DELETED ONE.** It trains everyone to read "1
    failing" as the expected number and the next real failure hides behind it. If a harness goes
    red and cannot be fixed the same day, delete it or skip it loudly.
55. **A VERSION PIN IS A DEPLOY DIAGNOSTIC, AND PINS COME IN SETS.** Grep for every assertion on
    a module's version before bumping it; two harnesses pin `session-log.js` and moving one is
    how you find out about the other.
56. **`node --check foo.js` DOES NOT CHECK AN ES MODULE.** Use `node --input-type=module --check`.
57. **A VERSION AUDIT CANNOT CATCH A VERSION LIE.** It compares a file's claims against the same
    file's other claims. Only a behavioural test knows what the code does.
58. **A HARNESS WITH AN ABSOLUTE PATH IS A COMMENT**, and a hardcoded denominator in a diagnostic
    is worse than no diagnostic.

### UI, rendering and reporting (59–71)

59. **AN AUDIT MAY NEVER HAVE A SILENT SKIP.** Every subject lands in exactly one named bucket,
    every bucket is counted on screen, and the totals are printed so they can be checked by eye.
    **"Could not be examined" and "passed" are opposite findings and must never render
    identically.**
60. **TWO WRITES TO THE SAME OUTPUT ELEMENT IN ONE SYNCHRONOUS BLOCK: THE FIRST ONE NEVER
    HAPPENED.** No linter, parser or identifier check can see it.
61. **WHEN A RENDER FUNCTION AND ITS CALLER BOTH REPORT STATE, THE RENDER WINS.** It is the one
    holding the filters.
62. **A COUNT THAT CONTRADICTS THE LIST BELOW IT IS WORSE THAN NO COUNT.**
63. **SAY WHAT A LIST IS MADE OF WHEN IT IS NOT MADE OF THE OBVIOUS THING.** A roster built from
    activity logs cannot show an enrolled student who has not acted.
64. **`innerHTML +=` DESTROYS LISTENERS IN THE WHOLE CONTAINER.** It is a read, a concatenate and
    a full re-parse of the subtree. Bind after the last write, never before.
65. **A BADGE THAT APPLIES TO EVERY ITEM IS NOT A BADGE.** Ask what fraction of rows a flag will
    appear on before adding it.
66. **A FEATURE THAT IS WRONG EVERY TIME GETS RECLASSIFIED AS DECORATION**, and then nobody
    reports it. Ask what a user has stopped trusting.
67. **A MISSING OPTION IN A `<select>` IS A DATA-LOSS BUG.** `selectedIndex = -1` reads back as
    `''` and gets saved. A `select` + Custom… pair cannot be cleared with `.value = ''`.
68. **AN `<a>` MAY NOT CONTAIN AN `<a>` OR A `<button>`.** Browsers recover by closing the anchor
    early and reparenting the rest. Not a CSS problem.
69. **`justify-content: center` + `overflow: auto` CLIPS AT THE START**, and the clipped part
    cannot be scrolled to.
70. **`escapeHtml`-BY-DOM DOES NOT ESCAPE QUOTES.** Fine in element content, fatal inside an
    `href`.
71. **A PERIOD BOUNDARY RIGHT FOR ACCUMULATING IS NOT RIGHT FOR LOOKING BACK.** Ask what day the
    person is standing on when they open the screen.

### Matching, creating and coalescing (72–83)

72. **BEFORE GIVING A "NOT FOUND" BRANCH THE POWER TO CREATE, FIX WHAT COUNTS AS FOUND.** A
    tolerant matcher and a creating branch are one feature; shipping the create half against a
    strict matcher manufactures duplicates, and duplicates of a container silently split
    everything filed into them.
73. **A NORMALISER THAT CAN RETURN EMPTY HAS AN IMPLICIT WILDCARD IN IT.** Any two inputs
    normalising to nothing match each other.
74. **A NORMALISER AND A DIFFER MUST COMPARE ON THE SAME SIDE OF THE NORMALISATION**, or the
    differ reverts the normaliser.
75. **REFUSE RATHER THAN APPROXIMATE** wherever the value is a claim rather than a preference — a
    licence, a version, an age range, a chapter identity. `''` plus a human is cheaper than a
    false assertion in the database, and the refusal belongs at the level of the whole operation,
    not one field.
76. **REQUEST COALESCING IS ONLY VALID BETWEEN INTERCHANGEABLE CALLERS.** An unauthenticated
    caller and an authenticated one are not. Share successes; never share a failure with someone
    who would have succeeded.
77. **AN EMPTY RESULT AND A DENIED ONE ARE INDISTINGUISHABLE DOWNSTREAM.** If both render the
    same blank screen, treat the ambiguous case as the one a retry can fix.
78. **WHEN TWO SUBSYSTEMS IMPLEMENT THE SAME PROMPT, THE DUPLICATION IS THE VISIBLE DEFECT AND
    THE DIVERGENCE IN WHAT THEY DO IS THE EXPENSIVE ONE.** Ask what each does when the user says
    yes, *before* merging the copy.
79. **A CHOICE MUST GOVERN EVERY PATH IT APPEARS TO GOVERN.** If a teacher's answer applies to one
    write path and not the other, behaviour depends on which branch a student fell into, and that
    is not a choice the teacher made.
80. **A FEATURE GATED ON A MODE NOBODY USES HAS NOT SHIPPED.** Grep for the gate before concluding
    a behaviour is absent — and before building it again.
81. **SAY WHICH ONE FAILED.** "3 of 5 failed" forces a retry of all five.
82. **NAME THE METRIC BEFORE BUILDING THE FEATURE.** "Popularity" is books opened or sentences
    typed, and the two need different data.
83. **SORT ON A DERIVED KEY AND YOU LOSE LOCALE COLLATION.** Fold diacritics when you derive, or
    Brontë files after Zola.

### Judgement and process (84–99)

84. **AN ABSENCE IS A DIVERGENCE WITH NOTHING TO GREP FOR.** Two copies that disagree can be
    diffed; one copy and a missing one cannot, and the missing side stays invisible until somebody
    asks for the feature it never had.
85. **ASK FOR ONE MEASURED NUMBER BEFORE CHOOSING WHICH BUG YOU ARE FIXING.** "One sentence to
    type" had two causes with no overlap in their fixes. One readout cost one exchange and
    eliminated an entire investigation.
86. **A SCREENSHOT CARRIES MORE THAN THE NUMBER YOU ASKED FOR.** Read the whole image, not the
    field you requested.
87. **DIAGNOSING A BUG DOES NOT INOCULATE YOU AGAINST WRITING IT.** One round fixed a coalescing
    bug in `learn.js` and reached for the identical broken shape in `index.html` within the hour.
88. **THE FIX THAT MAKES A SYMPTOM DISAPPEAR IS NOT ALWAYS THE FIX FOR THE BUG.** Ask: if the thing
    I just changed changed back, would this break again?
89. **VERIFY YOUR OWN COMPLAINTS BEFORE WRITING THEM DOWN.** A claim about a file you did not open
    goes into the README and the handoff and outlives you.
90. **CORRECTING A PREDECESSOR DESERVES THE SAME VERIFICATION AS ACCUSING ONE.** A retraction feels
    like humility and lands in the record with the same authority as the original claim. Round 8
    overturned a true complaint *in the same section* that added invariant 89.
91. **THE SAME CONCEPTUAL CONFUSION GETS COMMITTED TWICE IN ONE SESSION.** After fixing one, grep
    for every other place those two fields are read.
92. **A COMMENT ASSERTING A PERMISSION IS A CLAIM ABOUT A DIFFERENT FILE, AND NOTHING CHECKS IT.**
    Name the rule *and its version* so one line can falsify it. Three files carried "anon auth lets
    students read books" for years; it was never true.
93. **A COMMENT ASSERTING A TEST EXISTS IS WORSE THAN NO COMMENT.** It stops the next person
    looking.
94. **READ THE CORPUS BEFORE READING THE CODE.** One command over 24 files turned a vague report
    into an exact per-book explanation and made every theory unnecessary.
95. **BEFORE ASSUMING YOU BROKE IT, DIFF THE BLOCK AGAINST THE LAST KNOWN-GOOD COPY.**
96. **A BUG ON A PATH NOBODY TAKES IS INVISIBLE INDEFINITELY.** Ask which branch has had nobody on
    it lately.
97. **DOCUMENTS DRIFT EXACTLY LIKE CODE, AND NOTHING CHECKS THEM.**
98. **A DOCUMENT A SESSION PRODUCES SHIPS IN THE SAME COMMIT AS THE CODE**, or it does not exist.
99. **COMMITTING A SUPERSEDED DESIGN DOCUMENT UNMARKED IS WORSE THAN LOSING IT.** Recovering a
    document and *endorsing* it are separate decisions.

### Books, EPUBs and the library (100–105)

100. **`bookMetadata.chapters` IS THE SPINE, NOT THE BOOK.** Use `bodyChapterList()`.
101. **`matter` SAYS TYPEABLE; `about` SAYS CREDITS.** Orthogonal. Collapsing them is the mistake.
102. **FRONT MATTER MUST SURVIVE IMPORT.** The notice is a licence condition, and `game.js` filters
     the picker so it can.
103. **OPEN BOOK MUST RESTORE `matter` AND `about`**, or a re-upload silently resets every non-body
     page to `body`.
104. **UPLOAD ALL PRUNES ORPHANED CHAPTER DOCUMENTS.** It must, because Fix C renumbers books.
105. **YOU CANNOT LICENSE A PUBLIC-DOMAIN TEXT; YOU CAN ONLY LICENSE YOUR OWN EDITS.**

### Later additions (106– )

New invariants go here, at the next free number, and are folded into a group above
at the next consolidation **without changing the number**.

106. **PAINTING IS NOT COUNTING.** When you tighten a gate on a counter, check what
     else lives inside that gate. A draw call trapped behind a counting gate shows
     the student nothing — or worse, a hardcoded placeholder standing in for their
     real total — while every number in the system is correct. It is invisible to
     anyone reading the arithmetic, and it shipped in `game.js` v3.26.0 inside a
     change whose counting half was right.

---

## §6. Known problems left standing

1. **`chunktest.mjs` tested deleted code and is DELETED (Round 14).** It reimplemented the v3.9.2
   rollup loop inline instead of importing `session-log.js`, so it passed green on a fossil.
   `session-merge-test.mjs` Part B is its replacement. If it ever reappears, it came from an old
   copy — invariant 37.
2. ⚠️ **Historical day counters may be doubled and no audit can detect it.** If a student hit the
   additive merge on a day their stats doc had already been written, the day counter doubled too
   and that value reached `typing_logs` — the audit's yardstick — so those days look
   self-consistent. Session rollups are the independent check where they exist: all Library days,
   School only from 2026-08-18. **For School days before that there is no second record and never
   will be.** Cannot recur from `game.js` v3.23.0 / `learn.js` v2.7.0 forward.
3. **`metadata-map-test.mjs` — 42 of 487 assertions fail.** Pre-existing and unrelated:
   Gutenberg-sourced EPUBs report a `gutenberg.org` origin where the harness expects Standard
   Ebooks. A bookclean/import metadata question, not an app defect. Confirmed still 42 after Round
   14. ⚠️ **Invariant 54 applies** — this has been the accepted "1 failing" for several rounds and
   is exactly the state that hides the next real failure. Fix the map or skip it loudly.
4. **`audit-versions.mjs` reports 7 header-budget problems** (`game.js` 135 lines / 13 entries,
   `learn.js` 152/16, `admin.js` 69/7, `lessons-admin.js` 76, against budgets of 60 and 6). Three
   rounds called migrating entries into `CHANGELOG.md` "the cheapest real task available" and none
   did it. `CHANGELOG.md` is kept (Jake's call, Round 14) but its index is stale — `game.js`
   entries stop at v3.19.1, `learn.js` at v2.2.4, and there is no section at all for
   `session-log.js`, `stats-wal.js` or `hud.js`. **Either backfill it or raise the budget; do not
   call it cheap again without doing it.**
5. **`resume-path-test.mjs` does not exist** and `learn.js` ~line 1554 asserts in a comment that it
   does. Flagged by four rounds. Invariant 93. Write it or delete the claim.
6. **`renderIdStamp()` is duplicated in `game.js` and `learn.js`.** Fifteen lines, unchanged
   tripwire.
7. **App Check initialized, not enforced.** §3.11.
8. **`firestore-rules.test.mjs` has never been executed** and is known wrong — it seeds roles as
   auth-token claims while rules v2.x reads `staff/{uid}` documents. Needs a CLI and an emulator,
   which Jake does not have. Its guest-boundary assertions are the only automated statement of
   where that boundary is.
9. **`_bulkAssign()` writes `classId` but not `schoolId`.** Fine within one building; do not use it
   for a cross-building move.
10. **`_onClassesChanged()` is probably vestigial** — it exists to refresh a custom-claims token,
    and claims were removed. **Not investigated. Check `admin.js`'s hook before deleting.**
11. **No word or character count exists anywhere in the book schema**, so library "Length" sorts by
    chapters, and Aesop's 284 fables sort as the longest book while being among the shortest to
    type. **"Popularity" is unbuilt** and needs a scheduled Cloud Function to be affordable — which
    needs a functions deploy, which is Jake's call.
12. **`lastSavedIndex` is dead state** — eighteen assignments, two reads, both of which only save
    and restore it around practice mode. Nothing consumes it; `walDirty` drives flushing. Clean,
    self-contained deletion for whoever wants one. Invariant 32.

---

## §7. Jake — working with him

- **He tests immediately and reports the number, not the impression.** "Got a reminder at 2 minutes"
  identified which of four ladders had fired, on which page, from which file, in one clause. **Take
  his descriptions literally; they are usually the diagnosis.**
- **He will ask "are you sure?" and he is usually right to.** "But we delete the front matter, don't
  we?" and "shouldn't it be 2.2.1?" both caught real errors. Check properly before answering, every
  time.
- **He hedges when he is right.** Verify the hedged claim and say plainly which way it came out.
- **He answers a policy question with a better policy.** Given three flat options for the legacy
  cohort he returned a graded, time-keyed ladder — plus a throwaway line that was itself the design
  constraint. **Ask, and take the answer seriously rather than as a tiebreak between your own two
  ideas.**
- **He reasons from what a child will experience, not from what is easy to build.**
- **He sends screenshots that answer more than the question asked.** Invariant 86.
- **He supplies domain knowledge you cannot derive, mid-round. Stay interruptible.**
- **He tells you when something is good enough.** "Books did take a literal second to load, but
  that's not horrible" is a decision, not a complaint. Do not go optimise it.
- **"Prioritise" means go deep, not wide.** Do not read a broad to-do list as permission to skim.
- **He acts on findings immediately.** Report as you find, don't batch to the end.
- **He is fine with "I won't ship what I can't watch run."** Said across several rounds; it has
  never landed badly.
- **"What's next in the roadmap?" means give an ordered list with reasons.**
- **Tell him which uploads matter**, not what changed. Nine files changed, two fix anything — lead
  with the two.
- **Present designs for comment rather than shipping them silently.** His review has caught real
  bugs more than once.
- ⚠️ **Do not burn the session and skip the handoff.** He has had to say "ahem" twice, in two
  different rounds. And do not make him hunt for a document — that is what this consolidation exists
  to end.

---

## §8. Round history — one line each

Kept only so a version number or an instance name in a code comment can be placed. **Nothing here is
a pointer to a file you should go and read.**

| round | instance | what it was |
|---|---|---|
| 1–2 | Underwood, Dvorak | Write-ahead log replaces per-sentence writes. Lesson-mode pedagogy audit. Roles in documents, not claims. |
| 3 | Blick | Adventure Mode out of alpha. Language filter. EPUB multi-work spines. The document-map rule this file finally enforces. |
| 4 | Oliver | `reports.html` 2.8.0. Storage rules and the cover bug. |
| 5 | Mignon | Chapter identity (`matter`/`about`), library card markup, the first real harness suite. |
| 6 | Noiseless | `undefined-calls-test.mjs`. Two functions wired into the UI and never written. The suite could not run at all. |
| 7 | Hammond | EPUB source/licence precedence — 17 of 23 books wrong. `metadata-map-test.mjs`. Classroom editions. |
| 8 | Yost | The stale character offset, present in every `game.js` ever shipped. `contentVersion` + `anchorText` re-anchoring, Jake's time-based staleness ladder, Start Over and Flip Back. Its own first fix reproduced the bug and the harness blessed it. |
| 9 | Remington | Guest mode had been fully built and had never once executed — `firestore.rules` denied every read. Merged two disagreeing login ladders. CSV class creation. Library sorting. |
| 10 | Williams | Lesson atomicity — the entire checkpoint system deleted on Jake's ruling. Shipped without running the suite and took lesson mode down. |
| 11 | Bar-Lock | Fixed that outage (one line). The rollover import: 10 returning students imported with no error and no effect. |
| 12 | Caligraph | The doubled week counter. School had never logged session detail. `session-log.js` created. Shipped an audit that gave a false all-clear across ninety students and withdrew it the same day. |
| 13 | Ludlow | `serverAt` (write side only). Step 1.5: closing the open sprint/run, delta writes, the watermark. `hud.js`. |
| 14 | Sholes | This consolidation: nine handoffs into one, the invariant renumbering repair, and the step-2 timeliness finding in §4. |

---

## §9. Document map

**In the repo and live:**

| doc | what it is for |
|---|---|
| `HANDOFF.md` | this file — the only handoff |
| `README.md` | what the project is; file map, data model |
| `DESIGN-TELEMETRY.md` | ⚠️ the forward plan. §2 verification-only, §7 build order, §8 things that must not happen |
| `SCALE-PLAN.md` | cost model. Read the header box; its Security section's premise was false and is re-headed |
| `CHANGELOG.md` | kept, but its index is stale — §6.4. The file headers are the more reliable history |
| `TTL-GUIDE.md` | TTL policy, billing arithmetic, composite indexes. Console steps walked through with Jake |
| `README-SESSION-LOGGING.md` | teacher-facing: session history, the week audit, the ID stamp |
| `PEDAGOGY-AUDIT.md` | Round 2 research. The only record of why the lesson gates are what they are |
| `TESTING-ttb-test-epubs.md` | the synthetic EPUB test corpus |
| `library/gutCleaners/*` | the bookclean project's own docs. Separate concern, leave alone |

**⚠️ GONE, AND GONE MEANS GONE.** Every `HANDOFF-roundN.md` is deleted; their content is in §1–§8.
`MULTITENANCY.md` is deleted — it specified an Auth custom-claims model that was reversed, and it is
the probable reason `firestore-rules.test.mjs` has never matched the rules it tests.
`UPLOAD-ORDER.md` is deleted; it described Round 6.

`SETUP-NO-CLI.md` and `RULES-AUDIT.md` were lost long ago. `firestore.rules` cites `SETUP-NO-CLI.md`
by name for granting the first `super_admin`; that is the one operationally real gap, and the remedy
is to write the paragraph into `firestore.rules`'s own header, not to go looking.

**Do not go hunting for any of these, and do not send Jake hunting.** If you ever genuinely need
one, say so plainly and name what you need it for.
