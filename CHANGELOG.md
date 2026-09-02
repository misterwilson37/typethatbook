# CHANGELOG — TypeThatBook

## Round 57 (Bar-Lock) — 2026-09-02 — three things were being read from the wrong place

⚠️⚠️ **THE ROUND'S SHAPE: EVERY DEFECT WAS SOMETHING TRUSTING A PROXY INSTEAD OF
THE THING ITSELF.** A test that read filenames instead of books. A credits row
that read the cleaner's field instead of the preparer's. A day rollover that
could only be reached through a keystroke. None was a hard bug to fix; all four
had survived many rounds because the wrong source of truth looked right.

**⭐⭐ THE PERMANENTLY-RED HARNESS WAS TEST ROT, AND THE HANDOFF SAID IT WAS NOT**
(`tests/metadata-map-test.mjs` v1.5.0). `metadata-map-test.mjs` had been arriving
at **39 failing assertions** across three rounds of handoff, filed in writing as
*"a real disagreement, not test rot."* It was rot, in all 39. Checked against the
books' own `dc:` metadata, `admin.js` was **right every time**.

Two causes. (1) The bookclean pipeline now stamps *"the original text is in the
public domain … the editorial changes … CC0 1.0"* into every book it touches —
**72 of the 74** carry it — and the mapper correctly resolves that to the combined
licence, while the test still demanded plain public domain. (2) The test decided
*"is this Gutenberg?"* **from the filename**. ⚠️ Its own v1.4.0 header had
replaced a hand-kept list of book ids with that convention and written, in
capitals, *"anything that requires a human to remember to edit a test fixture will
eventually not be edited."* **It then made the filename the fixture.** Six
Gutenberg books have since been imported without the `_g` suffix and three Global
Grey books arrived as `_GG`, which the regex does not match. Both branches now
read the archive in front of them. **471 → 518 assertions**, and the six
unsuffixed books receive the origin and preparedBy checks they were being excused
from.

⚠️⚠️ **AND THE FIX'S OWN COMMENT WAS WRONG UNTIL IT WAS MUTATION-TESTED.** It
claimed Part 1 already covered the source-ladder ordering. It did not — and
**nothing did, in this version or the previous one.** `canonicalSourceFrom()` has
two protections, the pattern ORDER and the two-pass edition/upstream SPLIT, and
each was silently covering for the other: flipping the order left the entire suite
green, collapsing the split left it green, and **only both at once went red.** Two
new Part 1 fixtures pin each where the other cannot help. A coverage hole found
only because a claim was checked before it was written down.

**⚠️⚠️ THE `test:rules` SUITE RAN FOR THE FIRST TIME — 89 ASSERTIONS, ALL GREEN.**
Round 55 added six rules cases and the handoff has carried *"THESE HAVE NEVER BEEN
RUN"* ever since, because no environment had a JVM. This one did. The rules
deployed for items 24, 32 and 33 are now **executed** rather than reasoned about.
⚠️ `firestore.rules` is the one file Jake cannot test from a browser, so this is
worth re-running every round that touches it.

**⭐ ROADMAP 48 — "TEXT PREPARED BY" NAMED THE WRONG PERSON ON EVERY BOOK**
(`index.html` v3.17.0, `game.js` v3.47.0, `adventure-renderer.js` v1.5.5). Jake,
with a screenshot: *"It's ALWAYS claude....when it shouldn't be. You're awesome,
but not that awesome."* ⚠️ **TWO INDEPENDENT DEFECTS PRODUCING ONE SYMPTOM**, and
either alone was enough to make the field look broken — which is why editing it in
admin appeared to do nothing. (1) The label was bound to `cleanedBy` at **three
sites**, and `cleanedBy` is "Claude" on essentially every book. On the About panel
it was **also a duplicate**: that panel already had a correct `Cleaned up by` row
four lines above, so it printed the same name twice under two labels — three
labels existed for two people. (2) `preparedBy` **was never projected into the
library book list at all**, so `book.preparedBy` was `undefined` for every book
ever loaded and the correct row had never rendered for anybody since v3.6.3.
⚠️ The books cache key was bumped `v2 → v3` **as part of the fix** — the cached
value is the projection, so without it the fix would have appeared not to work for
hours, for the students who use the site most.

**⭐ ROADMAP 9 — THE DAY ROLLOVER IS NO LONGER TICK-ONLY** (`game.js` v3.47.0,
`learn.js` v2.43.0). It fired only on a **counted second**, so a tab that woke on
a new day and flushed — without the student typing — worked from yesterday's day
counters while the flush stamped its document with **today's** date. ⚠️ **That is
the same shape as the defect measured on two real students on 2026-08-21.** Round
26 closed the MERGE path that produced those two rows and **left the FLUSH path
open**, where it stayed for thirty rounds because `live-period-test.mjs` only ever
drove the merge. The block is now `rollDayIfNeeded()` in both files, moved
**verbatim** (diffed against the originals to prove it), with the tick calling it
at exactly the point the block used to occupy — so the ordering constraints Round
6 spent a round establishing hold by construction rather than by re-derivation.
⚠️ The merge path is **deliberately not** a caller: it has its own tested guard.

⚠️ **`midnight-test.mjs` v1.1.0 FOLLOWED THE CODE RATHER THAN BEING RELAXED**, and
in doing so found that **its own B4 had been passing vacuously** — it read
`iClose < iBump` where `indexOf` returns `-1` if the close is absent, so `-1 <
anything` held and the assertion reported success on a build with no rollover at
all. Both ordering assertions now require their left operand to exist. Four
mutations verified, including reverting the round's own fix.

**⚠️ ROADMAP 44 — THE BOOK ID FIELD** (`admin.js` v3.39.0). A hand-typed id with an
interior space now warns and offers to collapse it; **Cancel keeps what was
typed**, because series ids are hand-shaped and a blocker would fight Jake every
time he adds one. ⚠️ **Whitespace only.** The wider "does this match
`slugifyBookId()`" check that was originally proposed **fires on the flagship
book** — `DEFAULT_BOOK` is `wizard_of_oz` and the slugifier emits `wizard-of-oz`.

**⚠️ ROADMAP 45 ANSWERED, AND THE ANSWER WAS NEITHER OPTION OFFERED.** The item
was written to force a choice between a staff convenience filter and a Firestore
permission boundary. Jake wanted a third thing: **hiding books from STUDENTS** so
a local teacher can keep Dracula away from 6th graders while still seeing it
themselves. Student-facing, `index.html`, no rules work. ⚠️ He has been told
explicitly that this is **curation, not a lock** — a held URL still reaches the
book — and is content with that. Do not let a later round upgrade it into a
security claim.

**ROADMAP 29 — README** (v2.3.0). The file map was missing **seven shipped
modules**. It now carries the `grep` that regenerates it from `versions.js`, which
is the authoritative list, rather than inviting the next hand edit.

⚠️ **HEADER BUDGET: three files hit the 8-entry cap in one round.** `admin.js`
v3.31.1, `game.js` v3.42.0 and `learn.js` v2.35.0 archived **verbatim** to
§ ARCHIVED FILE HEADERS. ⚠️ `game.js` v3.42.0 is "I'm Done" and **three entries
still in the live header cite it**; `learn.js` v2.35.0 is the "open at the first
run that still counts" rule, which is the behaviour **ROADMAP 34 is about to be
measured against**. Read it before touching the mastery lock.

**⭐ AND THE HARNESS THAT SHOULD HAVE CAUGHT 48 SHIPPED IN THE SAME ROUND**
(`tests/credits-binding-test.mjs` v1.0.0, 54 assertions). ⚠️ **Nothing watched the
credit rows on any surface** — `credits-test.mjs` and `credits-scroll-test.mjs`
both build fixtures containing `cleanedBy` and **neither asserts a single label**.
It asserts the label→field **pairing**, never presence: *"does the string appear"*
would have passed on the broken build, at all three sites, for eleven versions.
⚠️⚠️ **Parts C and D are class guards and are the more valuable half** — every
field a credit surface READS must be carried by the thing that FEEDS it, so the
next forgotten field is caught rather than this one. **Mutation-verified against
the pre-fix build: 12 failing**, including Part E reproducing Jake's report
verbatim.

**⭐ ROADMAP 47 STEP ONE — THE LICENCE LADDER MOVED OUT OF admin.js**
(`rights-ladder.js` v1.0.0, `admin.js` v3.40.0, `metadata-map-test.mjs` v1.6.0).
Extracted **verbatim**: bodies unchanged, the four declarations gained `export`
and nothing else. ⚠️ `selectOptionValues()` stayed behind on purpose — it reads
the live `<select>`, which is the mechanism keeping admin.html the single source
of truth for what a mapping may return.

⚠️⚠️ **AND THE ITEM'S STATED REASON FOR THE MOVE WAS WRONG, CHECKED BEFORE
BUILDING.** ROADMAP 47 says to extract so the planned Cloud Function can IMPORT
the ladder. **It cannot** — `firebase deploy --only functions` packages the
`functions/` directory and nothing above it, so a root-level module is never
uploaded. The functions-side ladder will be a **copy** regardless. ⚠️ The repo
already has one unguarded duplication across that exact boundary:
`MIN_PROBLEM_CHARS = 3` is hand-written in both `variety-floor.js` and
`functions/index.js` and **nothing asserts they agree**.

✅ **The move was still right, for reasons that survive the correction.**
`metadata-map-test.mjs` **stopped lifting the ladder out of admin.js as text**
through `new Function(...)` — a lift that tested a re-evaluated copy rather than
the shipped code, with a slicer already known-broken for `async` functions — and
the ladder now has one canonical home for a future copy to be checked against.
**New Part F** guards the precondition: the module imports nothing, touches no
DOM, and admin.js keeps no local copy that would silently shadow the import.
518 → 532 assertions. ⚠️ Part F's first two mutations fail as a **crash** at
module load rather than as an assertion, and the header says so.

⚠️ **`version-stamp-test.mjs` §D caught the new module being registered in two of
its three mirrors and not the third** — which is exactly the drift that section
exists for, on its first opportunity.

**⚠️ ROADMAP 42's admin.js HALF — SURVEYED AND NOT STARTED, DELIBERATELY.** The
item has now been wrong about its own method twice, so Round 57 measured before
touching anything and found three things that change the plan.

⭐⭐ **THE DEFECT INSIDE IT WAS ALREADY FIXED, BY THE ROUND THAT WROTE THE
WARNING.** Item 42 says `button:disabled` is dead on admin and that a full-book
audit "runs behind a button that looks idle", one line each to fix. **Not any
more.** Round 56 moved those buttons to `btn-tint` classes written as
`button.btn-tint-save:not(:disabled)`, and that `:not(:disabled)` is exactly what
lets `button:disabled` win. The fix shipped in the same round as the warning and
nobody updated the warning — so the next round would have "fixed" a defect that
no longer exists by deleting inline backgrounds that are no longer there.

⚠️⚠️ **AND THE BLOCKING RULE IS FAR NARROWER THAN THE ITEM STATES.** "Do not
extract a property assigned at runtime", applied file-wide, blocks 203 of the 492
declarations — including all 123 `color` ones, which is most of what item 38
needs. **It is the wrong rule.** Setting `.style.color = '#f00'` is harmless;
inline still beats a class. **The hazard is assignment of `''`**, and there are
exactly **three** in the entire file: the build-panel `display`, `.seg-row`
background, `.seg-text` color. Everything else is extractable.

⚠️ **NOT STARTED ON PURPOSE.** Round 56's transformer parsed real HTML; these are
template strings with no parser, so adding a class means editing a tag that
exists only as text. Beginning a 492-declaration rewrite of the file Jake runs
his classroom from, without room to verify it element-by-element, is the
"shipped two broken features" outcome this item already caused once. The survey,
the three reset sites, the re-runnable grep that finds a fourth, and the
twelve-value font-size ladder (**Jake's call, not a refactor's**) are all written
into the item instead.

⭐⭐ **AND JAKE OVERRULED ONE OF MY CONCLUSIONS THE SAME DAY, CORRECTLY.** I wrote
into item 42 that admin.js's twelve-value font-size ladder was "a decision for
Jake, not a refactor's" and that a round should extract at exact values and
report. His answer: *"The whole point of the admin redesign is that it doesn't
look as good as the rest. I don't need to judge whether .7 is better than .72 on
a step by step basis — right now it looks bad. Consistency would help a lot, so
cleaning it up in any way would be a step in the right direction."*
⚠️ **The caution was the mistake, not the change** — preserving twelve
near-identical sizes byte-for-byte preserves the defect. I had read his stated
design pet peeve ("slightly off" reads worse than an obvious difference) as
*every size change needs sign-off*; it means the opposite. Recorded as a standing
ruling in items 42 and 38, with its edge: it covers dimension-like values, and
**not** colour, where item 38's finding that amber means three things still has
to be settled first.

**End state: all 67 harnesses pass, `test:rules` 89/89, `audit:versions` 0
problems.** The suite has not been fully green for several rounds.

## Round 55 (Smith-Premier) — 2026-09-01 — the clean day produced bugs, not a number

Round 54 set this build up to measure the reads floor for a county rollout. Jake
ran the day and brought **six defects** instead, and the round became about those.
⚠️ **The reads measurement was never taken** — ROADMAP §READS is unchanged and it
is still worth doing.

**⭐⭐ ROADMAP 43 — AN EMPTY PROGRESS CACHE LOCKED A STUDENT OUT OF THE WHOLE
CURRICULUM** (learn.js v2.42.0). A student reported losing all lesson progression
but none of his time. `refreshProgressCache()` wrote whatever `userProgress` held
with no check that it had ever been READ, and `loadUserProgress()` sets it to `{}`
then **awaits** a network round trip — so an ordinary tab switch inside that
window persisted the empty map. `{}` then passed the `typeof`-object cache-hit
test, Firestore was never consulted, and `isUnlocked()` offered lesson one **and
nothing else** for up to eight hours, re-stamping its own TTL while he worked.
⚠️ **The Firestore record and his minutes were intact the entire time**, which is
exactly why it looked like a lesson bug. Fixed with a uid-keyed load guard and
**empty-is-a-MISS on the read side**, which self-heals every poisoned cache on the
next page load — necessary because **students have no browser console**, so the
one-line repair first offered was never reachable by the person who needed it.

**⚠️⚠️ A PERMISSION CHECKED AGAINST ONE PRIVILEGED ACCOUNT IS NOT CHECKED, AND
THIS ROUND PROVED IT TWICE.** `firestore.rules` v2.8.0 allowed the new per-run
delete to `isSuper()` and the owner — it worked for Jake and would have been
silently denied for every teacher and building admin. **I asserted in writing that
no rules change was needed; Jake caught it.** Checking that turned up **v2.7.0
with the same hole on `lessonProgress`, live since Round 15** — open to
`readsWholeBuilding()` staff only, which is false for an ordinary teacher, so the
⛑ grade-reconstruction button has been teacher-denied for forty rounds. v2.10.0
adds both branches, clamped so staff can only ever REMOVE. **Deployed and verified
by Jake.**

**✅ ROADMAP 31** (learn.js v2.41.0) — the space-bar bug two students reported and
photographed. The idle-resume space skip advanced `drillPos` past a space and never
repainted, so the keyboard kept the space target — two thumb dots — while the game
expected the next letter. Fires only after a 3-second pause landing on a space,
which is why it read as intermittent and never reproduced for a teacher on demand.

**✅ ROADMAP 32, 33, 36** (reports.html v2.34.0) — per-run delete, clear-mastery,
and the at-a-glance day surface. ⭐ **The error-rate column is free**: `typing_logs`
already carries `mistakes` beside `chars` and the report already fetches it.
Everything else costs a read per student per day and lives behind a scan button
that states its cost. ⚠️⚠️ **"No answer" is never rendered as 0% and "not scanned"
never looks like "clean"** — both would lie in the direction nobody checks.

**✅ ROADMAP 37, 38, 40, 41** (reports.html v2.36.0, admin.html v1.2.0) — design
tokens and the product font on the staff pages, three severities with one meaning
each, keyboard usability, busy states. ⚠️ **38 is a correctness item**: amber meant
three different things across two pages. ⚠️ **41 contained a real defect** —
`recalc-btn` re-enabled on the line after its await with no `finally`, so any throw
left it dead until reload.

**⚠️ admin.js v3.35.0 — ROUND 27'S DEFECT INVERTED.** The constant read `3.33.0`
while the header carried honest v3.34.0 and v3.35.0 entries whose code is
demonstrably in the file. The HEADER was true and the CONSTANT was stale, so the
build footer — the only diagnostic at a classroom machine — under-reported by two
rounds. `npm test` and `audit:versions` were both red on arrival because of it.

**⭐ docs/TEACHER-GUIDE.md** — the first teacher-facing document in the repo. Its
body carries no roadmap numbers; the maintainer footnotes do.

**⚠️⚠️ WHAT I GOT WRONG.** A header-archive step searched the whole file for the
next version comment instead of the header block, matched an inline comment deep in
the code, and **deleted learn.js's import block**; `node --check` caught it and it
was restored byte-identical. **Two mutation tests silently did not mutate** — shell
escaping turned `\u2026` into a literal ellipsis, so a harness "passed" against
changes it should have caught. `recalc-guard-test.mjs` A5 **pinned a line's text
rather than the property it protects** and went red against a meaning-preserving
refactor; corrected to assert the property and re-verified. And normalising bare
⚠️ glyphs **widened the diff** into ~26 pre-existing lines.

**⚠️ Still unrun: six new `test:rules` cases.** No emulator in the environment they
were written in. **Still red on arrival: `metadata-map-test.mjs`**, 30 assertions,
a book classified as Gutenberg where the harness expects Standard Ebooks.

65 harnesses (64 pass), 0 audit problems.

## Round 54 (Blickensderfer) — 2026-08-26 — the closed-day cache

**✅ ROADMAP item 28 is CLOSED** (daylog.js v1.7.0). Days strictly before
yesterday are banked in localStorage. Measured on the shipped code, a student who
typed Mon–Wed with the ledger in play: **3 reads cold, 2 on every load after**,
with the week total identical across all of them.

**⚠️⚠️ The real defect was that reads GREW WITH THE WEEK.** `planReads()` skips
days known EMPTY, but a day with typing must be read for its numbers — so a
five-day-a-week typist paid five reads per page load by Friday. **It is now flat
at two, Monday or Friday.**

**⚠️⚠️ Yesterday is never cached.** "A closed day never changes" is *almost* true,
and the margin is where the bug would live: the Overnight Rescue
(`carryOverPlan()`) credits typing to the day it was typed on and reaches back
into yesterday's document. Hiding that correction from the child who earned it is
not worth one read.

**⚠️⚠️ The cache expires at local midnight, and that is not a guessed TTL.** A
teacher's ⟳ recalc rewrites a past day from the TEACHER's browser and cannot
invalidate a student's localStorage. There is no hook to add — an expiry is the
only mechanism, and a school day is the right grain.

**⚠️ It may over-read and must never under-read.** Expired, foreign-uid,
wrong-shape and corrupt caches are discarded and the day is read for real; a
faulted (`ok:false`) run banks nothing. `closed-day-cache-test.mjs`, 23
assertions, mutation-verified — caching yesterday fails B2/B3, banking on a
faulted run fails E2, ignoring the expiry fails D1.

**⚠️ Two reader harnesses needed BOTH cache layers dropped.** `logdays-test` and
`daylog-test` reuse one uid across fixtures, so a day banked by an earlier part
was served to a later one. Neither stubs the caches out — they drop them, so both
still test the reader that ships.

**⚠️⚠️ ITEM 27's VALUE COLLAPSED AND THE ROADMAP NOW SAYS SO.** With the v1.6.0
memo in place the second `readWeek()` call already costs nothing, and
`loadUserStats()` needs the week regardless — so the guard saves **roughly zero
reads**. It is a twin-symmetry item now, not a performance one.

**⚠️ AND THE CLEAN-DAY PLAN WAS CORRECTED.** Round 53 wrote it up as a
before/after comparison and told the next round to freeze before item 28. That
misread Jake's purpose: he is measuring **the floor**, to judge a county rollout.
Ship every tightening first, *then* run the day.

- `daylog.js` v1.7.0, `tests/closed-day-cache-test.mjs` **(NEW)**,
  `tests/logdays-test.mjs`, `tests/daylog-test.mjs`, `tests/run-all-tests.mjs`,
  `ROADMAP.md`, `HANDOFF.md`

**59 harnesses pass. `audit:versions`: 0 problems.**

## Round 53 (Blickensderfer) — 2026-08-26 — the backlog, made readable

**Documentation only — no code changed. 58 harnesses pass.**

**✅ 11a CLOSED by Jake's ruling.** `typing_logs` stamping `classId`/`schoolId`
at write time is INTENDED — it records where a student was *that day*, which is
what you want for a child who changes class mid-year. *"All the people who it
impacts are either my students — and I can get them all anyway — or didn't exist
when it was a problem."* ⚠️ **No backfill.**

**✅ 8b RETIRED TO CONVENTION.** *"Of course we do that."* Changed-files-only
uploads is a standing rule, not a backlog task. New **§ CONVENTIONS** section at
the top of ROADMAP.md holds it, plus three rules this session earned:
verify-a-flag-before-building, look-at-layout-rendered, and
guard-on-structure-not-distance.

**⚠️ §READS AND ITEM 21 HAD NO BODIES.** Both were index entries pointing at
nothing, for several rounds — the index promised sections that did not exist.
Both written up. §READS now carries the real 2026-08-26 measurement (31 reads,
`readWeek()` 65% of them), the three findings, and ⚠️ **the mechanics for
retaking it** — including *do not `reset()` after a page has loaded*, which cost
Round 52 a sample.

**⭐ Item 29 added:** README.md is v2.0.0 from Round 28 — twenty-five rounds
stale — and it is the file map and data model. ⚠️ It was destroyed once already.

**⭐ THE CLEAN DAY is recorded in the index.** Jake runs one ordinary school day
on a frozen build: item 5's baseline, and confirmation that Round 52's read work
is live (game.html should cost 5 daylog reads on a sprint, not 10).
⚠️⚠️ **Item 28 must not land before that run** — it moves the same numbers the run
exists to read.

**⚠️⚠️ AND THE HONEST CORRECTION:** Rounds 50 and 52 both said "no defect is
outstanding." Round 50 was wrong — item 6 was live. And **item 9's first bullet
is a repair, not tidying**: a tab that wakes on a new day and paints without
typing works from stale day counters until the first keystroke. Both the index
and the handoff now say so.

- `ROADMAP.md`, `HANDOFF.md`, `CHANGELOG.md`

## Round 52 (Blickensderfer) — 2026-08-26 — §READS measured, and the week memo

**✅ §READS HAS REAL NUMBERS NOW.** Measured on real hardware signed in as a
student, across a full session (Library → sprint → leaderboard → Library →
School → lesson → practice → map): **31 reads, 11 writes, 4 misses.**

**`readWeek()` was 20 of the 31 — 65%.** Every other read site in the entire
session was 1–2 calls. There is one cost centre, not several:

| Page | daylog reads | everything else |
|---|---|---|
| game.html (sprint) | 10 | 6 |
| index.html (cold AND warm) | 5 | **0** |
| learn.html | 5 | 3 |

**✅ daylog.js v1.6.0 memoises readWeek() per page load.** game.html read the
same week TWICE — `retroactiveSaveGuestSession()` then `loadUserStats()`, three
lines apart, same uid, same date, same seven documents. The memo holds the
PROMISE (overlapping callers share one round trip), never caches an `ok:false`
read, hands every caller a deep copy, and lives in memory only.
⚠️ **Every `typing_logs` writer now calls `invalidateWeek()`** — that is the
load-bearing half, and `weekly-memo-test.mjs` Part C asserts it structurally.

**⚠️ Two existing harnesses had to be given cold reads.** `daylog-test` and
`logdays-test` reuse one uid across several fake databases, so module-level memo
state leaked between parts — Part C was handed Part B's week and reported
`ok:true` on a read that had thrown. Both now drop the memo before each call,
with a comment saying why. ⚠️ The memo is **not stubbed out** in either: those
files test the reader's arithmetic, and `weekly-memo-test.mjs` deliberately does
NOT invalidate, because it tests the memo.

**⚠️ Two new roadmap items rather than two rushed fixes:**
- **28** — the closed-day cache. A closed day never changes, so caching days
  older than yesterday takes the week read from **5 to 2** on every load. Keep
  yesterday live: the Overnight Rescue path writes to the day typing happened on.
- **27** — the guard `learn.js` has and `game.js` does not. **Deliberately
  deferred**: `game.js` has no `anonSecondsAccum`, so the guard must be AUTHORED
  rather than copied, and it lives in the path that lost guest minutes in
  v3.36.0. A performance round is the wrong place to author a new correctness
  condition in the guest-merge path. **Harness first.**

- `daylog.js` v1.6.0, `game.js`, `learn.js` (invalidation call sites),
  `tests/weekly-memo-test.mjs` **(NEW)**, `tests/daylog-test.mjs`,
  `tests/logdays-test.mjs`, `tests/run-all-tests.mjs`

**58 harnesses pass. `audit:versions`: 0 problems.** Mutation-verified: a writer
that forgets to invalidate fails C2/C3, returning the memo uncloned fails B4/B5,
and caching a failed read fails B1.

## Round 51 (Blickensderfer) — 2026-08-26 — the midnight straddle, School half

**✅ ROADMAP item 6 is CLOSED, both halves.** learn.js v2.40.0 mirrors game.js
v3.38.0: the tick closes the open run on the OUTGOING day before resetting,
`logRun()`/`logOpenRun()` take a `dateOverride` for that one caller, and the
remainder is logged as a continuation by the ordinary path.

**⚠️⚠️ The rollover moved ABOVE the increments, and that is half the fix** — the
real reason this was held for several rounds. learn.js incremented `stepSeconds`
BEFORE its rollover check and compensated with `= 1` resets. That worked for the
counters and could not work for the log: by the time the rollover ran, the second
was already inside a `stepSeconds` that `logOpenRun()` was about to file under the
new day. The block now sits above `learnActiveSeconds++`, `anonSecondsAccum++` and
`armAnonLoginPrompt()`, with every `= 1` back to `= 0`. **One line lower and the
first second of each new day is filed under yesterday, invisibly, forever.**

**✅ midnight-test.mjs Part D was INVERTED, not deleted**, as the item instructed —
nine assertions instead of two. D5/D6 pin the ordering; D7–D9 pin that the
compensating `= 1`s are gone, since leaving one behind double-counts the first
second of every new day. Mutation-verified both ways.

**⚠️ A harness had to be repaired to accept the fix, and the HARNESS was wrong.**
`open-unit-test.mjs`'s graded-gate check allowed 400 characters between the gate
and the increment — a DISTANCE check wearing a STRUCTURE check's label. It failed
while the property it names was still true. Brace-matched now (v1.2.5), and
verified **stricter**: an increment moved outside the gate still fails it.
§0.-33.C's rule applies to harnesses as much as to writes.

**⚠️ Round 50's "no defect is outstanding" was one round early.** Item 6 was live,
and it read as measurement because its heading said *fixed in Library*. Read the
headings, not the summary.

- `learn.js` v2.40.0, `tests/midnight-test.mjs`, `tests/open-unit-test.mjs` v1.2.5
- learn.js v2.34.1's header entry archived to § ARCHIVED FILE HEADERS (8-entry
  budget); still cited once at the goals-cache hit-guard

**57 harnesses pass. `audit:versions`: 0 problems.**

## Round 50 (Blickensderfer) — 2026-08-26 — the run-list pairing, and an empty board

**✅ ROADMAP item 23 is CLOSED** (learn.js v2.39.0). `currentRunsFor` records what
`currentRuns` was built for, set at every site that assigns the list, and both
writers refuse when it does not match `currentLesson.id`. The refusal is total —
no attempt, no grade, no fire, nothing on `lastGrade` — and audible, because a
silent refusal is its own failure mode.

**⚠️⚠️ The guard the item proposed would have been wrong twice.** It suggested
`currentRuns.length !== buildRunList(currentLesson).length`. But `buildSequence()`
is **random per call** for `key_random`/`key_pattern_auto` — `buildRunList()`'s
own comment says sequences are baked for exactly that reason — so recomputing
invites a false positive, and **a false positive here refuses a REAL run**: silent
data loss, strictly worse than the hazard. It also passes any swap producing the
same run count, which the remediation drill on a 3-chunk lesson would. A pairing
token answers the real question in O(1).

**✅ ROADMAP item 14a is CLOSED BY VERIFICATION** — nothing built. Its ruling
(A🔥=2, A=1, B=0, mastered at 4, scored per run, with downward closure) was
already shipped verbatim by item 14 in learn.js v2.34.0. ⚠️ **That is the fourth
stale flag in ROADMAP.md, and it carried ⭐⭐** — the highest priority marker in
the file. The check cost minutes; the build would have cost a round.

**✅ NO DEFECT IS OUTSTANDING ON THE ROADMAP.** What remains is measurement,
process, and one open decision.

- `learn.js` v2.39.0, `tests/exit-flush-test.mjs` v1.1.0 (Section G, 7 assertions,
  mutation-verified: removing the guard fails G2/G3/G4/G7, accepting a falsy
  token fails G6)
- learn.js v2.33.0's header entry archived to § ARCHIVED FILE HEADERS (8-entry
  budget); still cited once at `loadBuildInfo()`

**57 harnesses pass. `audit:versions`: 0 problems.**

## Round 49 (Blickensderfer) — 2026-08-26 — the cover size regression

**⚠️⚠️ index.html v3.15.0 shipped a visible regression and this suite could not
see it.** An `@supports` block set `width:auto; height:auto; aspect-ratio:2/3` on
the Continue-reading cover. **An `<img>` has INTRINSIC dimensions**, so `auto`
does not mean "size me from my container" — it means "use the file's own
400x600". The flex line's cross size was computed from that, `aspect-ratio` never
applied, and the covers rendered at full size, dragging the cards to ~600px tall.
Jake caught it in the browser: *"the size of the books is horrible!"*

**✅ Fixed in v3.16.0 with both dimensions definite** — 56x84, a true 2:3 — plus
a 108px card floor so the cover is never what leaves a gap, and `align-self:
center` rather than `stretch` (stretch against a fixed width is what produced the
sliver in the pass before this one). The title is clamped to two lines: an
unbounded title made one card taller than its neighbour in the same grid row,
which is the "slightly off" complaint one row down.

**⚠️ The lesson, written into the harness rather than a comment.** Three CSS
declarations produced a defect no assertion in the file could reach, because
everything here tests markup and arithmetic. `continue-reading-test.mjs` C6 now
checks the cover states both dimensions in px, that neither is `auto`, that **no
conditional block sets them back to auto** (the original bug lived in
`@supports`, so checking the base rule alone would have passed it), that the
stated size is 2:3, and that the card floor covers the cover height.
Mutation-verified by reintroducing the exact bug through the exact route.

- `index.html` v3.16.0, `tests/continue-reading-test.mjs` v1.3.0

**57 harnesses pass. `audit:versions`: 0 problems.**

## Round 48 (Blickensderfer) — 2026-08-26 — the HUD lead axis

**✅ ROADMAP item 12 is CLOSED.** School's lesson HUD leaves `#hud-sprint` empty
by design, and `.hud-stack` was `justify-content: center` with auto height — so
the one remaining row centred on the BAR's midline (~30px) while every two-row
stack put its LEAD row at ~23px. WPM/accuracy, the headline number on that page,
sat **seven pixels low**. Fixed in `style.css` v3.10.0: the stack gets a two-row
`min-height` floor and pins to the top, an empty `.hud-lead` is removed, and the
row beneath takes its box — so it centres on the same axis `#hud-time` and
`#user-name` use.

**⚠️⚠️ The old comment asserted the bug as a feature.** v3.9.0 said an empty lead
row lets the remaining row "centre itself without any conditional CSS." It does
— on the wrong axis. **A comment explaining why no code is needed is the hardest
kind of wrong to notice.**

**⚠️ `min-height`, not `height`** — the opposite of `#hud`'s own rule above it,
deliberately: Library's centre during a sprint is genuinely taller than two rows
and a fixed height would clip it. **`+`, not `:has()`** — old Safari is a real
target on school Macs.

**⚠️ Two of the item's three bullets were STALE** and were checked before any
work was done. The student-ID bullet had it backwards — both panels print eight
characters on purpose, matching `reports.html`. The class bullet was folded into
item 11, which closed in Round 33. **Three stale flags in ROADMAP.md now; 14a is
still suspected.**

- `style.css` v3.10.0, `tests/hud-lead-test.mjs` v1.2.0 (Section E, 9 assertions,
  mutation-verified both ways)

**57 harnesses pass. `audit:versions`: 0 problems.**

## Round 47 (Blickensderfer) — 2026-08-26 — the Continue-reading row

**✅ ROADMAP item 26 is CLOSED.** The row is horizontal cards now — cover left,
"Resume" above the title, progress bar, "Last read …" line, accent rule down the
left edge — laid out on the SHELF's own grid tracks with each card spanning two
columns, so card edges land on the shelf's column lines rather than near them.
The shelf gained a heading ("The stacks") so the two rows read as two named
things.

**⚠️⚠️ The old row's widths were never what the stylesheet said.** The grid
element carried `class="library-grid continue-grid"`, and `.library-grid` is
declared LATER at equal specificity — so its columns and gap silently overrode
every width in `.continue-grid`. Nothing errored; the page rendered another
rule's numbers and it read as a design choice. **When a layout looks "slightly
off", check for a shared class before adjusting a number.**

**⚠️ The cover stretches to the card's height AND keeps its 2:3 shape.** The
first attempt only did the first half: `align-self: stretch` against a fixed
width grew the box vertically while the width stayed put, turning the cover into
a sliver on any card with a wrapped title — with `object-fit: cover` hiding it by
cropping. Height stretches and `aspect-ratio` derives the width, with the fixed
width kept as an `@supports` fallback.

**⭐ `chapter-position.js` v1.0.0 (NEW MODULE).** `chapterPositionOf()` and
`lastReadLabel()` moved out of index.html. The new bar needed the same number the
shelf card prints, and copying it would have been the fifth hand-maintained twin
this project has had to find. ⚠️ A local function would have killed the twin and
still been the wrong answer — a module is importable by the HARNESSES, so
`progress-test.mjs` and `continue-reading-test.mjs` no longer lift source text out
of an HTML file and rebuild it with `new Function`. Registered in all three
registries.

- `index.html` v3.15.0, `chapter-position.js` v1.0.0 **(NEW)**
- `versions.js`, `tools/audit-versions.mjs`, `tests/version-stamp-test.mjs` —
  registry entries for the new module
- `tests/progress-test.mjs` v1.2.0 and `tests/continue-reading-test.mjs` v1.2.0 —
  both import now instead of scraping; C3/C4/C5 are new and mutation-verified
  (C3 alone passed a mutation that forced the bar on, which is why C4 exists)

**⚠️ Item 26's own instruction is still undone:** nobody has checked whether kids
were MISSING the row or IGNORING it. The redesign was worth doing either way, but
only one of those is a layout problem.

**✅ Item 24 confirmed in production this round** — three sprints across a tab
switch and an immediate Home (the `pagehide` path), no duplicates in Reports.

**57 harnesses pass. `audit:versions`: 0 problems.**

## Round 46 (Blickensderfer) — 2026-08-26 — the session-log WRITER, closed

**✅ ROADMAP item 24 is CLOSED.** `session-log.js` v1.7.0's flush is now
IDEMPOTENT: `_sessionLogFlushInner()` derives a document id from the chunk
(`uid` + first sprint's `at` + `source` + `label`) and writes with `setDoc()`
instead of `addDoc()`'s random id, so a resend (killed `pagehide`, or a
silently-failed local `_write()`) overwrites its own document instead of
duplicating it. Fixes both known paths to the bug at once.

**Shipped as one unit, per Rule 9:** `firebase/firestore.rules` v2.8.0 gives
the `typing_sessions` owner `update` rights under the same validation `create`
already applies; `game.js` v3.46.0 and `learn.js` v2.38.0 both now pass
`doc, setDoc` into `sessionLogInit()`.

**⚠️⚠️ Verified against the real emulator, not just reasoned about.**
`npm run test:rules` was actually run (Java present) — 4 new cases, and the
first run caught a bug in the test's own seeding step (a super_admin cannot
`create` a `typing_sessions` doc on another student's behalf; only the owner
can). Fixed by seeding as the student instead. **65 rules cases pass.**

- `tests/session-writer-test.mjs` **(NEW)** — 6 parts, mutation-verified: 13
  failing against v1.6.0, 23/23 passing against v1.7.0
- Five existing harnesses updated for the new required dependencies
  (`session-merge-test.mjs`, `queue-owner-test.mjs`, `guest-merge-test.mjs`,
  `open-unit-test.mjs`, `version-stamp-test.mjs`'s version pins) — mock gaps,
  not logic regressions
- `session-log.js` v1.3.0's header entry archived to § ARCHIVED FILE HEADERS
  (line budget), same mechanism as `game.js`/`lessons-admin.js` before it
- `run-all-tests.mjs` v1.19.0, `ROADMAP.md`, `HANDOFF.md` §0.-36

**57 harnesses pass. `audit:versions`: 0 problems. `test:rules`: 65 cases, 0
failing.** ⚠️ `firestore.rules` v2.8.0 is written but not yet pasted into the
console — Jake does that step himself.

## Round 45 (Rem-Sho) — 2026-08-25 — handoff pass

**A `▶ START HERE` block now opens HANDOFF.md** — the next round, the file-editing
rules from four damage incidents, the state of play, and the roster warning.

**⚠️ The ROADMAP index had gone stale within three rounds of being built** — item
22 closed and still listed open, item 24 still warning after its fix. Rebuilt
from live headings, and `tests/roadmap-index-test.mjs` now asserts the index and
the body agree.

- `tests/roadmap-index-test.mjs` **(NEW)** — 8 checks, mutation-verified
- `tests/run-all-tests.mjs` v1.18.0, `HANDOFF.md` v15.30.0, `ROADMAP.md`

**56 harnesses pass. `audit:versions`: 0 problems.** No code changed this round.

## Round 44 (Rem-Sho) — 2026-08-25

**✅ Item 22 closed by measurement** — zero `runCount` drift across five students.

**⚠️ Item 24 measured at 12 of 51 student-days and is still happening.**
`splitSessionTotals()` now sums **sprints, not documents**, so `⟳` no longer
double-counts a sprint present in two overlapping rollups. The recalc guard is
**symmetric** — an unexplained increase now prompts exactly as a decrease does.

⚠️ **The writer is traced but unfixed** (next round): the server write and the
local queue removal are not atomic, the flush runs on `pagehide`, and `_addDoc()`
mints a random id so a resend appends a larger document instead of replacing.
The fix is a derived document id, and it needs a `firestore.rules` change in the
same round.

- `reports.html` v1.4.0 / inline v2.32.0

**55 harnesses pass. `audit:versions`: 0 problems.**

## Round 43 (Rem-Sho) — 2026-08-25

**⚠️ The §10.H signal fired on almost every row.** I set the threshold at 3
runs/student with no data; the real median over 138 students is ~6–7. It is now
relative — twice this scan's median, minimum 8 students — and flagged rows sort
first. One-student lessons no longer outrank 97-student ones.

**⚠️ Three pages were invisible to the read meter,** and they were the admin
pages where the expensive sweeps live. `lessons-admin.js`, `staff-admin.js` and
`school-audit.html` now import `./read-meter.js`. The stuck scan warns before
spending (any roster over 40) and prints its real read count on screen.

- `lessons-admin.js` v1.16.0, `staff-admin.js`, `school-audit.html`

**55 harnesses pass. `audit:versions`: 0 problems.**

## Round 42 (Rem-Sho) — 2026-08-25

**✅ ROADMAP 25 — "I'm done" stamped a child a receipt shorter than the HUD they
had been watching.** 9:31 against 10:02, the gap being exactly the run in
progress. `flushStats('done', true)` passed `final` and **the gate never read
it**, so every press mid-run wrote nothing and the receipt read a stale
`typing_logs`.

⚠️ **A twin divergence where `game.js` was already correct** — Library forced the
write, School skipped it, and both files carry comments swearing they are
identical in shape. `tests/im-done-test.mjs` drives **both**.

- `learn.js` v2.37.0 — the gate reads `final`
- `tests/im-done-test.mjs` **(NEW)** — 21 checks; 2 fail against v2.36.0
- `tests/run-all-tests.mjs` v1.17.0

**55 harnesses pass. `audit:versions`: 0 problems.**

## Round 41b (Rem-Sho) — 2026-08-25, same day

**⚠️⚠️ THE ⚑ BUTTON WROTE A WRONG GRADE ONTO A REAL STUDENT.** `mergeContinuations()`
merged retries as though they were fragments of one run, folded an abandoned
32%-accuracy tail into three good attempts, and double-counted every sprint
appearing in two overlapping rollups. `u1_l5 run 1 → D`; the true answer is **B**.

✅ **The student was never affected** — `runGrades` feeds nothing that advances or
unlocks. ✅ **Fixed and self-healing:** re-run the button and it **recomputes** the
entries it wrote, correcting them. Earned grades are still never touched.

✅ **The grades now show.** A `◈` beside each student renders lesson × run, with
reconstructed pips dimmed and underdotted so a derived fireball is always
distinguishable from an earned one.

⚠️ **NEW, UNFIXED — ROADMAP 24:** `⟳` over-counts a day with overlapping rollups,
and the drop guard only guards downwards, so the inflation is silent. **Do not
press `⟳` on a day whose drill-down shows two rollups at the same minute.**

- `run-grade.js` v1.1.0 — `mergeRunAttempts()` replaces `mergeContinuations()`
- `reports.html` v1.2.0 / inline v2.30.0 — recompute, the `◈` grades panel, dialog wrapping
- `tests/run-grade-test.mjs` — Part E rebuilt on Jake's real 2026-08-24 data

## Round 41 (Rem-Sho) — 2026-08-25

**⚠️⚠️ A PRACTICE DRILL WAS BEING GRADED AS THE LESSON.** The "🎲 Practice missed
keys" drill replaces `currentRuns` and leaves `currentLesson` alone, so every
writer downstream read it as the lesson's run 1: a sprint filed under the
lesson's id, mastery points banked, `runCount: 1` written over a 12-run lesson,
and the **whole lesson marked passed**. `key_random` is accuracy-only, so a clean
83-character random drill scored **A🔥** and unlocked the next lesson.
⚠️ The minutes still count, in both records — only the assessment is suppressed.

**⭐ ROADMAP 15 BUILT, BOTH HALVES.** `runGrades`/`runFires` store the grade where
it is earned; the `⚑` button reconstructs what 14b lost from `typing_sessions`,
preview-then-confirm, never overwriting an earned grade and never touching
`passed`, `fireCount`, `runScores` or `grade`.

**⚠️ `firestore.rules` v2.7.0 — REQUIRED, CONSOLE PASTE.** Staff could read a
student's `lessonProgress` and never write it; the button does nothing until this
is deployed. Scoped to `lessonProgress` only; 61 emulator cases, 7 new.

- `learn.js` v2.36.0 — remediation fix; `runGrades`/`runFires`; imports the rule
- `run-grade.js` v1.0.0 **(NEW)** — the one copy of the grade rule (Rule 9)
- `reports.html` v1.1.0 / inline v2.29.0 — the `⚑` reconstruction button
- `versions.js` v1.15.0 — registers `run-grade.js`; fixes the out-of-order entry
- `firebase/firestore.rules` v2.7.0 — the staff `lessonProgress` write branch.
  ⚠️ **Its v2.7.0 header note was missing on first delivery** — the title said
  v2.7.0 and the note stack stopped at v2.6.0. Nothing checked this file at all;
  `version-stamp-test.mjs` v1.2.0 Section F does now.
- `tests/remediation-test.mjs` **(NEW)** — 27 passing; **17 failing against v2.35.0**
- `tests/run-grade-test.mjs` **(NEW)** — 50 checks; Part D is the anti-twin ratchet
- `tests/run-all-tests.mjs` v1.16.0, `tests/open-unit-test.mjs`,
  `tests/exit-flush-test.mjs`, `tests/firestore-rules.test.mjs`,
  `tools/audit-versions.mjs`

**54 harnesses + 61 rules cases pass. `audit:versions`: 0 problems** (1 in the
repo as delivered).

## Round 35 — Fitch (2026-08-23) — ITEM 17 MEASURED, NOTHING SHIPPED

**No code changed this round, deliberately.** Documents only.

* ✅ **The date filter was already in the query.** Item 17 claimed the window was
  applied in the browser after the read. `buildScopedQuery()` has been spreading
  `where("date", …)` into every branch for some time. ⚠️ **A round that "fixed"
  it would have changed nothing and reported a saving.**

* ⚠️⚠️ **The cost is the roster sweep: `students × days`, unconditionally.**
  Jake measured three students across two days — six legitimate documents — at
  **1,155 reads.**

* ⚠️⚠️ **Jake's correction decides the fix.** They are not empty days: *"those
  days are chock full of data…for last week."* The misses are ACTIVE students
  whose activity sits elsewhere in time, so the question is per STUDENT, not per
  day.

* ⚠️⚠️ **The obvious fix is illegal under `firestore.rules`.** One range query
  per uid would read only existing documents — but rules run per returned
  document and **a query fails ENTIRELY if any is denied**, and a `classId: ''`
  log is denied for any non-super caller. **The point reads survive only because
  they fail one at a time.**

* **Three ways forward in item 17.** Round 33's writer fix already half-solves the
  cheapest. ⚠️ **One unmeasured number decides between them**: the fraction of
  recent logs carrying a non-empty `classId`.

* ✅ **One name per INSTANCE, not per round.** Rounds 31–34 had been written up as
  four different names; consolidated to **Fitch** across all documents.

**50 harnesses, all passing.**

---

## Round 34 — Fitch (2026-08-23) — THE GATE WAS TAXING THE STUDENT IT MEANT TO MOVE ALONG

Jake, after Round 32 went live and worked: *"Scoring works! locking works! It did
reveal that if the first one is locked, students have no way to get to the second
run legitimately."*

* ✅ **`learn.js` v2.35.0 — a lesson opens at the first run that still counts.**
  Runs are typed in order from run 0, so a student whose run 1 was mastered had
  to replay it — earning nothing — to reach the run that still pays. ⚠️ **Nothing
  in item 14 was wrong; it simply never asked how a student ENTERS a lesson.**

* ✅ **`firstOpenRunIdx()` is well-defined because of downward closure, not luck.**
  `runMastered(rec, k)` is true if any run at index ≥ k has four points, so the
  mastered runs are always a PREFIX and the open runs always a SUFFIX. ⚠️ **If
  closure is loosened this stops being a suffix and the function must be
  rewritten, not patched.**

* ⚠️ **BOTH INTRO ENTRY POINTS HARDCODED `beginStep(0)`** — the Start button and
  the Enter key. Fixing one would leave which key a child pressed deciding
  whether the feature worked. Part B asserts neither hardcodes 0.

* ✅ **`tests/run-mastery-test.mjs` IS WRITTEN.** learn.js had cited it in its own
  version header **since Round 32 without the file existing.** 18 checks, 8
  failing against v2.34.1. ⚠️ **A header asserting a harness is not evidence of a
  harness.**

* ⚠️⚠️ **I DELETED LIVE CODE ARCHIVING A HEADER ENTRY.** The last
  `// vX.Y.Z —` in learn.js is in the BODY, not the header, and the delete took
  working code with it. Caught by `undefined-calls-test` and `build-panel-test`
  going red, restored, re-applied. **Bound the search: slice at
  `const LEARN_VERSION` and search only above it.** Second file-destroying
  tooling error in three rounds, both caught only because the suite runs.

**50 harnesses, all passing.**

---

## Round 33 — Fitch (2026-08-23) — TWO BUGS, TWO FILES, ONE COMPLAINT

Jake, for the third time: *"my son … is a part of my 7th & 8th grade class but
isn't actually assigned to my school due to an error in the admin code."*

* ✅ **ROADMAP 11 FIXED.** `lessons-admin.js` v1.14.0, `learn.js` v2.34.1.

* ⚠️ **BUG A — THE WRITER.** Three paths assign a class and only two wrote
  `schoolId`. The single-student save and `_bulkAssign()` sent `{ classId }`
  alone, leaving `schoolId` **absent, not empty** — visible under *All schools*,
  invisible under their own, missing from every school-filtered report.

* ⚠️ **BUG B — THE READER.** The goals cache rejected an entry naming a class
  with no `className`, but an entry taken before assignment carries
  `classId: ''` — **falsy** — and passed as a hit. Settings answered "No class
  assigned" for 24 hours after the assignment landed. **A direct admin write
  cannot reach a cache on the student's Chromebook**, so the unassigned state
  must not be cacheable at all.

* ⚠️⚠️ **FIXING EITHER ALONE FIXES NOTHING VISIBLE**, which is why two correct
  diagnoses in a row produced no shippable fix. Each looked like the whole story.

* ⚠️⚠️ **THE OBVIOUS REPAIR DIES ON A COLD CACHE.** `_classCache` is filled
  when the CLASSES panel opens; an admin going straight to Students has an empty
  one, so `_classCache[classId].schoolId` reads `undefined` and writes `''`
  exactly as the bug did. `_schoolIdForClass()` is the one answerer, cache then
  class document. Part C of the harness asserts the fallback.

* ⚠️ **THE CSV LOOKUP IS PER ROW, NOT HOISTED.** A rollover file can name a
  different class on every line; one lookup for the file stamps the first row's
  building onto everyone in it.

* ✅ **NEW: `tests/class-assign-test.mjs`** — 10 checks, **6 failing against the
  shipped build**, verified on a clean extract. Part D extracts the cache guard
  from source and runs it, so the assertion is about the shipped line.

**49 harnesses, all passing.**

---

## Round 32 — Fitch (2026-08-23) — ITEM 14 BUILT, AND I MOVED JAKE'S NUMBER

* ✅ **ROADMAP 14.** Mastery is cumulative points per RUN — A🔥 = 2, A = 1, B and
  below = 0, **locked at 4**. Locked by run, unlocked by lesson, clock from the
  last lock. `lesson-gate.js` v1.1.0, `learn.js` v2.34.0.

* ✅ **Points are banked in `recordRunOutcome()`**, where the grade already is.
  This is item 13's fix: the student is shown fire for a RUN and `fireCount` only
  ever counted a LESSON — Jake's record read `lastGrade: "A🔥"` beside
  `fireCount: 0` after three fireballs in a row.

* ✅ **Downward closure, computed not stored.** Mastering 1.2 closes 1.1; lesson 2
  never touches lesson 1.

* ⚠️⚠️ **I CHANGED `>=` TO `>` AND SILENTLY MOVED JAKE'S WORKED EXAMPLE BY ONE
  LESSON.** It closes the farming hole correctly. It also means that at seven
  stalled days only lesson 27 opens, where §10.D specifies 26 and 27.
  `lesson-gate-test.mjs` Section C failed on exactly that — **which is the entire
  reason the worked example lives in a harness instead of a document.** The
  shipped fix is a guard, `if (reachBack === 0) return 'practice'`, with v1.0.0's
  comparison untouched above zero.

* ⚠️ **"The furthest lesson is always graded" is deleted**, and the deletion is
  half the fix. An unmastered run in that lesson still counts, so nobody is
  stranded on run 2 by mastering run 1.

* ✅ **`lastLockDay` replaces `lastAdvanceDay`**; `stampAdvanceIfNew()` is gone.
  The old clock ran from the last advance, so a student grinding one run accrued
  reach-back the entire time they were farming.

* ⚠️⚠️ **NOT VERIFIED, AND 48/48 IS NOT COVERAGE.** `runScorePill()` and
  `armRunMode()` — the banner and the score, the only two things a student sees —
  have never been executed. `learn.js`'s header cites
  `tests/run-mastery-test.mjs`, **which does not exist.**

* ⚠️⚠️ **THE ROUND'S REAL FAILURE IS PROCESS, AND IT IS IN HANDOFF §0.-24.A.**
  Jake: *"WHY WON'T YOU DELIVER ANYTHING? … GIVE ME A HANDOFF EVERY ROUND."* Many
  turns produced design decisions reported as progress, a zip shipped with a red
  suite, and advice to "test it on Nico tonight" — **he deploys through the GitHub
  web portal, so there is no such thing as a private test.** A round that produces
  no document produced nothing.

* ⚠️ **`learn.js` was truncated to zero bytes mid-round** by a Python heredoc
  hitting `UnicodeEncodeError` on a surrogate escape. Restored from the Round 31
  package, all six edits re-applied with an assertion on each.

**48 harnesses, all passing.**

---

## Round 31 — Fitch (2026-08-23) — THE WRITE SUCCEEDED AND STORED THE WRONG THING

Jake: *"I finished every single run. I finished the run, got a grade, and then
clicked back to map. Could the back to map not count as finishing? It counted the
time and everything."* ROADMAP item 14b.

* ⚠️⚠️ **THE ITEM SAID THE FLUSH WAS NEVER CALLED. THE FLUSH WAS CALLED.**
  14b named `flushLessonProgress()` as having *"exactly one caller … in the
  session-end path"*. That line is inside `flushStats()`, which also runs on the
  five-minute interval and on every `visibilitychange`. **A write fired after
  every single run.**

* ⚠️⚠️ **WHAT LOST THE RUN WAS THE RELOAD.** `stopLesson()` ended with
  `loadUserProgress()`, whose first statement is `userProgress = {}`. The
  outcomes recorded in memory were destroyed before the scheduled flush read
  them — while `pendingProgress` still named the lesson — so the flush found the
  freshly RELOADED record under that id and wrote **that** back. **It returned
  `true`, cost a billed write, cleared the queue and stored the numbers it had
  just read.** There is no error path here and there never was one, which is why
  a green suite never saw it.

* ⚠️ **THE OBVIOUS FIX WOULD HAVE CHANGED NOTHING.** *"`await
  flushLessonProgress()` in `stopLesson()`"* is a fix only if it lands **before**
  the reload; appended to the end of the function, where anyone adding a line
  would put it, it flushes the record `loadUserProgress()` just installed — same
  stale document, same successful write — and **every test that asks "is the
  flush called?" goes green.** THE ORDER IS THE FIX.

* ✅ **`learn.js` v2.33.1 — `exitLessonToMap()`.** Snapshot what is pending,
  flush, `refreshProgressCache()`, reload, then carry anything that did not land
  back over the top. ⚠️ **The cache refresh is not tidiness:**
  `loadUserProgress()` prefers `PROGRESS_CACHE_KEY` over Firestore, so an
  unrefreshed cache re-installs the pre-run copy and the map under-reports the
  attempt it just banked. ⚠️ **The carry-across is not tidiness either:** an
  offline Chromebook must not have its unflushed runs replaced by the server
  copy — that is the same defect with a network error in front of it.

* ⚠️ **WHY THE LOSS LOOKED RANDOM.** `saveStats()` fires `learnWalSave()`
  *before* the wipe, so the WAL holds the good record for a window and the next
  save after the reload overwrites it with the stale one. Only runs whose
  interval flush fired inside that window landed — Jake's `runAttempts {0:1,
  1:2}` against a dozen completed runs. **Not zero, which someone would have
  reported; a plausible minority, which nobody can.**

* ✅ **"NEXT LESSON →" WAS NEVER AFFECTED** — it calls `startLesson()`, which does
  not reload progress. **Only "← Map" lost work, and Jake named that path
  exactly.**

* ✅ **NEW: `tests/exit-flush-test.mjs`** — 31 checks, **18 failing against
  `learn.js` v2.33.0**. ⚠️ **Part A drives the OLD exit and must keep losing
  runs**; it passes on both builds by construction and is the only evidence that
  Parts B–F measure anything. Part D asserts the ORDER rather than the call.
  ⚠️ Two modelling details were load-bearing and both were wrong on the first
  attempt: the page's state must be real **bindings** (the defect IS a
  reassignment, so a snapshot object made the wipe invisible and the harness
  passed against a broken build), and **`merge: true` merges nested maps key by
  key** — modelling it as a wholesale replace made the old build look worse than
  it is and would have misdescribed the very record this round is about.

* ⚠️ **A TRAP IN THE RUNNER, RECORDED IN ITS HEADER (`run-all-tests.mjs`
  v1.13.0).** It marks a harness bad on
  `status !== 0 || /FAIL|UNSAFE|\bERROR\b/.test(out)` — **a text match over
  everything the harness printed.** A harness exiting 0 and printing
  *"PASS — 31 passing, 0 failing"* is still reported **FAIL** if a section header
  contains the word. **Do not loosen the detector** — a harness that reports its
  own failures in prose and exits 0 is exactly what it exists to catch. The rule
  belongs on the other side: a harness must not print those words except on a
  real failure.

* ✅ **JAKE AMENDED A SETTLED RULING.** *"Bulk repairing scores is fine — change
  the ruling to minutes so it doesn't bite us later."* ROADMAP's *"historical data
  is good enough, no bulk repair of past days"* was written without a noun and had
  come to read as a ban on repairing anything. It is now scoped to **minutes**;
  grades and run scores are a pure function of data still on the record and are
  out of scope.

* ⭐⭐ **ROADMAP ITEM 15 IS NOW THE NEXT BUILD** and has absorbed Jake's
  reconstruction button. ⚠️ **It cannot run off `typing_logs`** — a day
  aggregate with no lesson and no per-run WPM. `typing_sessions.sprints[]`
  carries `label` (lesson), `detail` ("run N"), `wpm`, `accuracy` and `mistakes`,
  and `calculateGrade()` needs nothing else. Three constraints in that item are
  not optional; the run-index one can grade the wrong material silently.

* ⚠️ **ROADMAP item 11 was diagnosed and NOT fixed** — HANDOFF §6 item 9 now
  names both direct writers (`lessons-admin.js:1129` and `:1776` write `classId`
  and never `schoolId`, while `learn.js`'s import path writes both and says why)
  and the 24-hour goals cache behind the *"No class assigned"* display.

* ⚠️ **ROADMAP §10.H — the measurement — is still not built.** Fourth round.

**48 harnesses, all passing.**

---

## Round 30 — Postal (2026-08-23) — THE DEPLOY INSTRUMENT CACHED ITS OWN ANSWER

Jake, after uploading two files and being unable to confirm it: *"Force
refreshing is not refreshing everything. I have to close the tab and open a new
one. It's still just fetching the old files."*

* ⚠️⚠️ **IT WAS NOT HIS BROWSER AND IT WAS NOT THE FILES. IT WAS THE PANEL.**
  `readDeployedVersions()` cached its result in **`sessionStorage`**, which
  **survives a reload — including a hard reload — and clears only in a new tab.**
  So the one instrument that reports what is deployed answered *"what is running
  right now?"* from a copy taken at first page load, and **every stronger refresh
  returned the same stale answer with the same confidence.** Closing the tab
  worked, which is why the tab got the credit.

* ⚠️ **THE FETCHES THEMSELVES WERE ALREADY CORRECT.** `readOne()` uses
  `cache: 'no-cache'`, with a comment saying exactly why: *"reporting a cached
  version number would defeat the purpose."* **A correct component behind a wrong
  cache is a wrong system** — and the comment on the fetch made the whole thing
  read as carefully considered, which is why nobody looked at the layer above it.

* ⚠️⚠️ **THIS IS THE THIRD WAY THE SAME INSTRUMENT HAS LIED IN THREE ROUNDS** —
  §0.-14 (five files misreporting their version), §0.-20.A (rendered correctly,
  faded to unreadable), §0.-20.B (its loudest warning false on every session), and
  now this. **The pattern is not that the file is buggy. It is that a diagnostic
  is the one thing nobody diagnoses:** it is consulted *instead of* checking, so
  when it is wrong there is nothing behind it to disagree. Anything whose job is
  to tell the truth about the system needs a harness pointed at it specifically.

* ✅ **THE FIX IS LIFETIME, NOT CLEVERNESS.** Module state with a 60-second TTL.
  ⚠️ **Module state dies with the page, which is the lifetime the old comment
  already claimed** — it said *"cached for the tab's lifetime"* and meant *"this
  page load"*; the words and the storage disagreed and the storage won. **Do not
  move it back to anything that outlives a page load.** The TTL is what saves a
  Chromebook tab left open for a week, which is a real case here.

* ⚠️ **THREE LAYERS OF STALENESS BECAME ONE.** `game.js` and `learn.js` each kept
  their own `dataset.loaded === 'true'` early return on top of this cache, on top
  of the HTTP cache. **None of the three expired inside a tab and none of them
  owned the question.** The pages now ask on every hover and let `versions.js`
  decide; `index.html`'s explicit build button passes `{ force: true }`, because a
  deliberate press means *right now*.

* ⚠️ **A NOTE FOR WHOEVER DEBUGS DEPLOYS NEXT: THE SITE IS GITHUB PAGES.**
  `firebase.json` here is **emulator config only** and deploys nothing — easy to
  misread as hosting config. **GH Pages cannot set cache headers**, so there is no
  `Cache-Control` fix to propose. To tell *"not deployed yet"* from *"cached"*,
  fetch with a throwaway query string (`/versions.js?x=1`) — a different URL, so
  it bypasses the browser and the CDN edge together.

* ⚠️ **I FILED THIS ROUND'S OWN HEADER ENTRY IN THE WRONG SLOT** — `v1.13.0`
  landed *below* `v1.12.0` in `versions.js`, and the ordering check caught it.
  **In the file that implements the ordering check.** Exactly the drift Round 14
  built it for: each edit anchors on the previous newest entry and lands one slot
  too deep.

* **`tests/build-panel-test.mjs` section H** — 44 checks, five mutations verified,
  including that the cache expires, that `{ force: true }` always reaches the
  network, that concurrent callers share one round of fetches, and that neither
  page controller rebuilds a staleness layer of its own.
  **47 harnesses pass. 0 audit problems.**

* ⚠️ **ROADMAP §10.H — the measurement Jake asked for first — is STILL not built**
  and is next. This jumped the queue because it was costing him the ability to
  tell whether a deploy had landed at all.


## Round 29 — Odell (2026-08-23) — ROADMAP ITEM 10, THE LESSON-FARMING GATE

Jake: *"Students are just redoing the first three lessons indefinitely because
they're easy... it's one of the dumbest things I have to police manually now."*

* ⭐⭐ **`lesson-gate.js` 1.0.0 — THE WHOLE RULE, AND IT IS PURE.** No Firestore,
  no DOM, no clock; every number is passed in. ⚠️ **That is why 56 checks cover
  the entire design without driving a browser** — the same discipline
  `daylog.js` and `drill-filter.js` are built on, and the reason those two have
  real coverage while the DOM wiring around them still does not.

  ```
  reachBack = floor(activeDaysSinceLastAdvance / 7)
  a MASTERED lesson L is graded iff  L >= furthest - reachBack
                                and  it has not re-fired inside the window
  ```

* ⚠️⚠️ **MASTERY IS WHAT CLOSES A LESSON, AND ONLY MASTERY.** A lesson with fewer
  than three A🔥 — a B, an A, two fires, no record at all — is **graded and
  replayable forever, at any distance.** ⚠️ **DO NOT ADD A DISTANCE OR TIME
  CONDITION THAT REACHES AN UNMASTERED LESSON.** It would invert the feature and
  punish the struggling student, who is the one this app exists for. Section A of
  the harness is that sentence made executable; if it goes red, the feature has
  turned around.

* ⚠️⚠️ **PROGRESS RESETS THE WINDOW, WHICH IS WHY THIS BEATS A COOLDOWN.** Two
  students, same twenty active days, same lessons: the one who advanced two days
  ago gets practice, the one who has not advanced at all gets a graded lesson
  back. **Review reaches the student who has actually forgotten something and
  withholds itself from the one who is coasting, with neither of them assessed by
  anybody.** The shape of the rule does the work a judgement call would need.
  **Lesson 1 needs 26 weeks of standing still and cannot open inside a two-month
  course** — the number Jake asked for by name.

* ⚠️⚠️ **THE ROADMAP NAMED AN INCREMENT SITE THAT WOULD NEVER HAVE FIRED.** §10.E
  said to count active days *"at the existing day-rollover in the tick."* **That
  rollover is the midnight-straddle path** — `statsData.lastDate` is set to today
  at load, so it runs only for a tab left open across midnight, which in a middle
  school is never. The counter would have sat at 0 for the life of the feature.
  ⚠️ **And the failure would have looked like success:** `reachBack` 0 is
  indistinguishable from "everyone is advancing normally," so nobody would have
  reported it. **Third instance this month of a document naming a code site that
  does not do what the document thinks** (§0.-19.C, §0.-20.J). Now reads the
  stored date: one read, at most one write, per student per day.

* ⚠️ **A PRACTICE RUN WRITES NOTHING, ANYWHERE — AND THE THREE OMISSIONS ARE ONE
  DECISION.** No grade, no session record, no second of time. **Half of it would
  manufacture the exact `typing_logs`/`typing_sessions` divergence that ROADMAP
  item 4's implausibility flag exists to catch**, at scale, and the report would
  be right to flag it. Recorded in neither, the two stay in perfect agreement.
  ⚠️ It is also what makes the re-lock coherent: a practice run cannot earn the
  A🔥 that would re-lock a lesson, because it cannot earn anything.

* ⚠️ **THE ONE INCREMENT SITE IS UNTOUCHED.** An earlier draft of this item was
  rejected for putting a condition on it. It does not have to: **a practice run
  simply never arms `startGradedTimer()`.** No new gate, no new flag, nothing
  between the gate and the increments — item 0b's pause work reused differently.

* ⚠️ **THE BANNER IS THE FEATURE, NOT DECORATION.** Not dismissible, no fade, no
  close button, present for the whole run. **A child typing for ten minutes while
  the daily total does not move reads as a broken app**, and silent counting
  failures are this project's specialty. This is the one case where nothing
  happening is correct, so it is the one case that must say so out loud. The
  mastered card is styled **warm, not grey, and carries no padlock** — the lesson
  is fully playable and the student earned the state.

* ⚠️⚠️ **`undefined-calls-test.mjs` CAUGHT AN ORPHAN `async` TOKEN AT `game.js`
  MODULE TOP LEVEL.** Left behind repairing a bad insertion. ⚠️ **It parses** —
  `acorn --module` accepted the file, so the suite's syntax check passed it — and
  a bare `async` as an expression statement throws `ReferenceError` **before any
  code runs**, blanking Library for every student. **"It parses" and "every
  reference resolves" are different questions**, and this is the third time in a
  month the second one has earned its keep.

* ⚠️ **NOT DONE: ROADMAP §10.H, THE MEASUREMENT JAKE PUT FIRST** — *"before any
  of it: measure."* The attempts-per-lesson column is cheaper now than when it was
  written, since `fireCount` sits on the same record as `attempts`. This project
  has twice built on a number nobody checked.

* **`tests/lesson-gate-test.mjs` 1.0.0** — seven sections, 56 checks.
  **47 harnesses pass. 0 audit problems.**


## Round 28 — Daugherty (2026-08-22) — THE DIAGNOSTIC THAT COULD NOT BE READ

* ⚠️⚠️ **THE BUILD PANEL WAS UNREADABLE, AND THE CAUSE WAS NOT IN THE PANEL.**
  `adventure.css` carried `body footer { opacity: 0.55 }` — **the only unscoped
  rule in a file whose own comment claimed every rule was scoped to
  `.view-adventure`.** It applied in classic view too, and `opacity` composites
  the entire **subtree**, so `#footer-full` inherited the fade and the panel's
  own `rgba(255,255,255,.97)` was multiplied by `.55` after the fact. No amount
  of reading the panel's background would have explained it. The fade was written
  for the one-line version stamp this footer used to be, **before v3.5.4 hung a
  panel inside it** — a rule that was correct when written and became wrong when
  something else moved underneath it. `adventure.css` **1.0.3**; the false claim
  under `body::after` is corrected and now names the exception.

* ⚠️⚠️ **THE PANEL'S LOUDEST RED WARNING WAS FALSE, ON EVERY SESSION, SINCE THE
  CHECK SHIPPED.** `game.js` seeds `rendererVersionStr = '—'` for *never
  mounted*. The drift guard excluded `'failed'` and nothing else, so in classic
  view — **the default view** — `'—' !== '1.5.4'` was true and the panel printed
  *"adventure-renderer.js mounted v—, deployed file reads v1.5.4 — stale module
  cache"* in red. **A red alarm that is always on is not an alarm**, and this one
  was sitting next to the genuine staleness checks teaching you to discount them.
  Now gated on a semver shape, which no sentinel can satisfy — not `'—'`, not
  `'failed'`, and not the next one somebody adds without reading the comment.

* ⚠️ **THE ⚠️ NOTES ARE STAFF-ONLY, AND THE DEFAULT IS OFF.** Nothing gated them:
  every student who hovered the footer on either typing page, or pressed *build
  info* in the Library, was shown twelve files' worth of header-budget scolding
  in red over their book. `renderBuildList(results, { notes })` now defaults to
  **false**, so a caller who forgets the flag fails toward silence rather than
  toward a nine-year-old reading *"40 version entries (budget 6)"*.

* ⚠️⚠️ **BUT SUPPRESSED IS NEVER SILENT, AND THAT IS THE LOAD-BEARING HALF.**
  `renderHiddenNotesLine(n)` prints a grey *"12 build notes — sign in as staff to
  read them."* Jake troubleshoots **at a student's machine, signed in as nobody**
  — exactly the state where notes are suppressed — so a panel that looked *clean*
  when something was wrong would be a diagnostic that lies, in the same direction
  §0.-14.C is a whole write-up about. Hidden is fine. **Absent is not.**

* ✅ **THE HEADER BUDGET IS PROPORTIONAL NOW (ROADMAP item 9, closed).** On
  Jake's ruling — *"if the code itself expands, the line limit should, too."*
  ⚠️ **THE SEVENTEEN STANDING NOTES WERE TWO PROBLEMS WEARING ONE LABEL.** The
  **line** budget was simply wrong: a flat 60 applied to files from 51 to 8,000
  lines called `drill-filter.js` (191 header lines documenting 105 lines of
  filter policy, where the policy *is* the product) the same violation as a
  40-entry changelog. Now `max(220, ceil(bodyLines × 0.08))` — ⚠️ **measured
  against the BODY, because a header measured against the total funds its own
  growth.** The **entry** budget was right and was catching something real:
  `game.js` had 40 entries in one block, `learn.js` 46, both partly out of order.
  Raised 6 → 8 and **deliberately left flat** — "nobody reads to the bottom of a
  changelog" gets *worse* as a file grows.

* ⚠️ **45 HEADER ENTRIES MOVED, NOT DELETED**, to `CHANGELOG.md` §&nbsp;ARCHIVED
  FILE HEADERS — verbatim, from `game.js`, `learn.js`, `lessons-admin.js` and
  `versions.js`. ⚠️ The first attempt at this **also swallowed the "Load-bearing.
  Do not simplify these" blocks and the module descriptors**, because the trim
  scanned forward from the *last* entry rather than the first archived one. Redone
  against a pristine copy with entry lines and prose classified separately. **A
  header is not a changelog with prose in it; it is prose with a changelog in it.**

* ✅ **SECTION E IS ENFORCED RATHER THAN PRINTED.** `version-stamp-test.mjs`
  **1.1.0**. The old warning said *don't promote these without doing the work
  first*, on the grounds that seventeen violations would leave `npm test`
  permanently red — the exact mechanism that let Round 26's five lying stamps
  ship past two already-failing harnesses. **The count is zero, so the condition
  was met rather than overridden.** 170 checks.

* ⚠️⚠️ **`ADMIN_EMAILS` WENT FROM FOUR COPIES TO ONE.** It lived in `game.js`,
  `learn.js`, `admin.js` and `reports.html` (as `BOOTSTRAP_EMAILS`) — four
  hand-maintained copies of two email addresses. **Nothing had drifted. That is
  luck, not design**, and the symptom of forgetting one is a colleague who can
  reach Reports but not the admin panel with no error anywhere to explain it.
  Now one export in `firebase-config.js` **1.3.0**, which won on the grounds that
  **all five consumers already import `db`/`auth` from it** — zero new
  dependencies, and no new module to remember to register in `versions.js`.
  ⚠️ It is a **UI gate, not a security boundary**; `firestore.rules` and the
  `setStaffRole` claims are what actually enforce access.

* ⚠️ **A CHECK OF MINE PASSED FOR THE WRONG REASON AND MUTATION TESTING CAUGHT
  IT.** `build-panel-test.mjs` asserted `src.includes('renderHiddenNotesLine')`
  — **satisfied by the import line alone.** Deleting the call site and keeping
  the import passed. Same family as §0.-14.G and §0.-18: the harness confirmed a
  name *resolved* and never asked whether anything *called* it. Fixed to require
  the trailing `(`.

* ⚠️ **AND ONE MUTATION NEVER RAN WHILE REPORTING SUCCESS.** M5's `sed` died on a
  delimiter clash; the harness printed `32 passed`, **which reads identically to
  a genuine pass.** Re-run through Python, it fails correctly. **A mutation that
  never applied is not a mutation that failed to matter** — check that the file
  actually changed, not that the suite still went green.

* ⚠️⚠️ **THE PARTIAL-UPLOAD SET SHIPPED WITHOUT `versions.js` ON ITS FIRST
  BUILD.** Jake asked for a changed-files-only zip — *"I would hate for one
  corrupted, unedited file to burn the whole thing down"* — and the first attempt
  dropped a file the diff had correctly identified, because the copying loop
  discarded its manifest's last line (no trailing newline; `while read` returns
  false on an unterminated final line). `wc -l` said 18, `grep -c .` said 19.
  **`game.js` v3.43.0 importing `countBuildNotes` from `versions.js` v1.11.0
  throws at import time — both student pages blank**, from a file Jake never
  opened. ⚠️ **Caught by applying the set to a pristine copy and running the suite
  there**, where `build-panel-test.mjs` — written this round — went red. Reviewing
  the file list would have passed it, because the list was correct.
  **"Every file I edited passes" and "these files are sufficient" are different
  claims.** ROADMAP item 8b makes the applied-suite run standing practice.

* **`tests/build-panel-test.mjs` 1.0.0** — six sections, 32 checks, five
  mutations verified. **46 harnesses pass. Zero version stamps lying. Zero header
  budgets over.** ⚠️ Verified twice: in the working tree, and on a pristine
  checkout with only the 19 changed files applied.


## Round 27g — Chicago (2026-08-22) — THE ID MOVES INTO SETTINGS

* ✅ **The corner `ID xxxxxxxx` stamp is deleted.** The student ID now lives in
  **Settings on both pages** — Library's ⚙ menu (`game.js` **3.42.3**) and
  School's ⚙ panel (`learn.js` **2.30.0**) — with the same eight characters
  `reports.html` prints beside each student, and **click-to-copy carried over**
  for the full uid. `settings-panel.js` **1.2.0** gained an optional `copy` on
  info rows so School's version comes from the shared module rather than a second
  implementation.

* ⚠️ **JAKE CAUGHT A HALF-BUILT TWIN BEFORE I DID** — *"as long as you fold it
  into the game/library settings, as it's not there right now."* School's panel
  had the ID; Library's menu did not. Deleting the stamp alone would have left a
  child in Library with no way to read their own ID at all. **The seventh twin
  failure of the week, and the first that would have been mine.**
  ⚠️ The pattern is structural rather than careless: two page controllers that
  cannot import each other make every student-facing feature a twin **by
  construction**, so half-building one is the default unless something checks.

* ⚠️ **`renderIdStamp()` deleted from both writers in one commit.** It was the
  duplicated twin its own header warned about (*"CHANGE ONE, CHANGE BOTH... if it
  grows any further, extract it"*). It never grew; deletion is the other way to
  resolve a twin, and the cheaper one when the feature has somewhere better to
  live.

* ⚠️⚠️ **`HANDOFF.md` §2's deploy check named the stamp and has been rewritten.**
  It read *"if the ID stamp is missing, the new code is not running and nothing
  else you check means anything"* — a troubleshooting instruction, followed at
  8:05am with a class arriving, that became **false** the moment the element was
  deleted. The build footer is the deploy instrument now, and a better one since
  this round made the version stamps honest.
  **When you delete a visible element, grep the docs for it, not just the code.**

* **45 harnesses pass. Zero version stamps lying.**

## Round 27f — Chicago (2026-08-22) — THE BUTTON THAT DID NOTHING

* ⚠️⚠️ **"I'M DONE" WAS NEVER WIRED IN LIBRARY.** Reported live by Jake after
  typing Pinocchio: clicked it, nothing happened, nothing in the console.
  Round 26 shipped `handleImDone()` (correct and complete), the button markup,
  the `.done-btn` styling and the whole of `receipt.js` — and attached the
  handler **only in `learn.js`.** School worked the entire time.
  **Round 26 built both halves of a twin and connected one** — the sixth twin
  failure of the week and **the first to reach a child.** `game.js` → **3.42.2**.

* ⚠️⚠️ **43 HARNESSES PASSED AND NOT ONE COULD HAVE FAILED.**
  `undefined-calls-test.mjs` asks *"does every reference resolve?"* —
  `handleImDone` resolves perfectly; it is simply never referenced. **A
  defined-but-unreachable function is outside that question by construction.**

* ⭐ **`tests/dead-handler-test.mjs` 1.0.0, new — the mirror question.** Is
  everything *defined* also *used*? Three sections: every function a page
  controller defines is referenced; every `<button>` with an id is mentioned by
  its controller; and both pages attach `handleImDone` — named explicitly,
  because twins fail one half at a time. **Mutation-verified** by deleting the
  wiring line again. **45 harnesses.**

* ⚠️ **The new harness had two false-positive runs, and both fixes made it
  looser.** Stripping string literals hid every element id (an id lives *inside*
  a string), reporting all ten buttons as inert; stripping template literals
  deleted real calls from `${...}`. Two explicit source views now, each
  documented with the failure that produced it. **Stripping comments stays
  mandatory** — `handleImDone` appears in a game.js comment, and a naive grep
  would have counted that as a use and passed the very defect.

* **`learn.js` → 2.29.1 — `updateWeeklyHUD()` deleted.** Its comment claimed
  *"several call sites"*; there were **zero**. The last went when `hud.js` v1.3.0
  split the readout. ⚠️ A comment asserting callers is not evidence of callers.

* ✅ **Jake confirms School's ⚙ panel and settings look right** — §0.-16's CSS was
  written blind and landed.

## Round 27c — Chicago (2026-08-22) — ROADMAP 0b: THE SCHOOL SETTINGS PANEL

* ⭐ **`settings-panel.js` 1.1.0, new — the sixth shared module.** A ⚙ in
  School's top bar, same id and same slot as Library's, opening a dialog with the
  reading font, the child's class, their goals and their student ID.
  ⚠️ **DOM-only and state-free**, the same contract as `celebrate.js` and
  `receipt.js`: it never reads Firestore, never flushes, never touches a counter.
  Every value it shows is already in memory, so **opening settings costs zero
  document reads.** `drill-filter-test` F7b asserts the contract by name.

* ✅ **THE CLASS HAS A HOME AGAIN, AND THIS WAS A DEBT.** `updateClassDisplay()`
  had been writing to `#user-class-name` — an element `learn.js` v2.24.0 deleted
  from `learn.html` **in the same version** that removed it from the bar. Every
  call landed in a null check and the class name went nowhere at all. Same shape
  as §0.-13.C's orphaned `loadIndexStats()` paint, two instances in four days.

* ⚠️ **RULE 9 — THE FONT MODEL MOVED, IT WAS NOT COPIED.** `DRILL_FONTS`,
  `applyDrillFont()`, `readDrillFont()` and `buildFontPicker()` are **deleted**
  from `learn.js` in the same deploy that adds them to `settings-panel.js`.
  F9b asserts no local copy grew back.

* ⚠️⚠️ **JAKE NARROWED "DON'T TOUCH THE TIMING MECHANISM"** (2026-08-22): it means
  *don't break accurate tracking*, not *never stop the clock*. This shipped for a
  few hours with the gear hidden during a drill on the strict reading; **the ⚙ is
  now available in both views and the graded clock pauses**, exactly like
  Library's menu. `learn.js` **2.27.1 → 2.29.0**.
  ⚠️ Note how little the pause buys, which is why it is safe: the gate is
  `drillPos > 0 && !isDrillIdle()` with a 3-second threshold, so **School's clock
  already stopped itself three seconds into any pause.**

* ⚠️⚠️ **THE RISK IS THE RESUME, NOT THE PAUSE**, and it is defended structurally
  rather than by care: one `close()` reached by ✕, Esc and backdrop alike; the
  resume in a `finally` so a teardown throw cannot eat it; handed through
  `onClose` rather than any one dismiss handler; guarded on `drillRunning`.
  A pause that never resumes means a child types on while **nothing counts** —
  silent, no error. F7c1–c5, F7d, F7e. **Mutation-verified both ways.**

* **The Tab hazard, solved the strong way.** The dialog is created on open and
  **removed** on close, not hidden — between opens there is no `<select>` in the
  document at all, which is stronger than the map picker it replaced. Focus
  returns to whatever held it. H2 / H8b / H8c.

* **`style.css` 3.7.3 → 3.8.0** (`.settings-overlay` and friends; the font picker
  restyled from a map pill into a dialog row, 0.8rem floor unchanged and still
  asserted). **`versions.js` → 1.11.0**, **`audit-versions.mjs` → 1.3.0**,
  **`undefined-calls-test.mjs`** widened from 16 files to 20 — it had never known
  about `drill-filter.js`, `celebrate.js` or `receipt.js`.

* **`drill-filter-test.mjs` 1.3.0 → 1.5.0.** Part H now **imports the real
  module** and drives it, instead of slicing the font block out of `learn.js` as
  text and eval'ing it through `new Function`. **92 checks. 44 harnesses pass.**

* ⭐ **ROADMAP item 10 is new** — students farming the first three lessons.
  ⚠️ Step one is a **measurement, not a build**: `attempts` is already stored per
  lesson per student, so the claim can be sized before it is designed for.

* ⚠️ **NOT DONE:** the corner ID stamp still stands (Jake asked for a move; it was
  added to the panel and the corner left pending his look — see ROADMAP 0b).

## Round 27b — Chicago (2026-08-22) — hud 2.0.0, and ROADMAP 9b closed

**Two rulings from Jake, both taken. No behaviour changed.**

* ⚠️⚠️ **`hud.js` 1.4.1 → 2.0.0 — MAJOR, ON EXPLICIT SIGN-OFF** (*"Give hud 2.0.
  It's earned it"*). No code changed; the number catches up with the breaking
  return-shape change that shipped as a minor in v1.3.0 (`{ left, long }` →
  `{ lead, sprint }`). **Why it is not bookkeeping:** a minor bump is a promise
  that the caller still works, and every v1.2.0 caller reads `.left` and gets
  `undefined` — which does not throw. It renders the word "undefined" into a
  child's top bar, or crashes a line later on `.includes()`. The public surface
  is now written into the file header so callers can be checked against it.
  ⚠️ **`tests/hud-test.mjs`'s pin moved to 2.0.0 in the same commit.**

* ✅ **ROADMAP 9b closed.** `drill-filter.js`, `celebrate.js` and `receipt.js`
  were extracted in Rounds 25–26 and never wired into the version machinery, so
  the build footer could not report them — a stale cached copy was invisible
  from the chair. `celebrate.js` **1.0.0 → 1.1.0** and `receipt.js` **1.0.0 →
  1.1.0** gained the runtime constants they shipped without; all three added to
  `versions.js` **1.9.0 → 1.10.0**, `tools/audit-versions.mjs` **1.1.1 →
  1.2.0**, and the harness mirror, in one commit.

* ⚠️ **THE COST QUESTION, RECORDED BECAUSE THE ANSWER GENERALISES.** It was never
  Firestore — `versions.js` fetches *static files* from the web host, and
  nothing there is billed per operation. The ~38 KB added sits against the
  684 KB `game.js` and `learn.js` already pull, on a hover, cached per tab.
  **localStorage could not have carried it:** the footer's job is to report what
  is *on the server*, and a cache of what the browser already loaded is the very
  thing being checked. And reporting the already-imported constants — genuinely
  free — would have been a **second mechanism answering a different question**,
  i.e. a fifth hand-maintained twin in the week that taught us what those cost.

* ⚠️ **THE RATCHET.** `version-stamp-test.mjs` D2 now reads the `import`
  statements out of `game.js` and `learn.js` and **fails if a module they import
  is missing from SOURCES.** Mutation-verified. The next extraction cannot
  repeat this. **44 harnesses, all passing.**

## Round 27 — Chicago (2026-08-22, cutover morning) — VERSION STAMPS

**⚠️⚠️ FIVE FILES WERE LYING ABOUT THEIR OWN VERSION, AND THE SUITE WAS RED IN
THE REPO AS DELIVERED** (two harnesses of 43). **No student-facing behaviour
changed this round** — not one line of arithmetic, not one write path.

* **The five stamps.** In every case the runtime stamp was stale and the header
  comment was the honest half; **the code was new**:

  | file | was | now |
  |---|---|---|
  | `game.js` | constant `3.38.0`, header 3.42.0 | **3.42.1** |
  | `learn.js` | constant `2.23.1`, header 2.27.0 | **2.27.1** |
  | `hud.js` | constant `1.2.0`, header 1.4.0 | **1.4.1** |
  | `style.css` | `body::before` v3.6.1, header v3.7.2 | **3.7.3** |
  | `adventure.css` | `body::after` v1.0.0, header v1.0.1 | **1.0.2** |

* ⚠️⚠️ **WHY IT WAS URGENT: IT WAS AIMED AT MONDAY'S CUTOVER VERIFICATION.**
  `ROADMAP.md` instructed Jake to *check the footer version first —
  `game.js` v3.38.1 / `learn.js` v2.23.2*. A **correctly deployed** build was
  going to answer 3.38.0 / 2.23.1, i.e. below the stale-day data-corruption fix.
  The one instrument that separates "the fix never reached the browser" from
  "the fix is there and something else is wrong" was reporting the first when
  the second was true — and the documented response to that reading is to go and
  fire the update gate at ninety Chromebooks. **The checklist is corrected.**

* ⚠️ **THE `hud.js` PIN COULD NOT FIRE, AND THAT IS THE PART WORTH READING.**
  `hud-test.mjs` asserts `HUD_VERSION === <n>` so that bumping the module forces
  the harness to move. It stayed green through v1.3.0 and v1.4.0 — because the
  constant was never bumped either — so a **breaking** return-shape change
  (`{ left, long }` → `{ lead, sprint }`) went in underneath it and the harness
  crashed on the old API. **A pin checks a hand-maintained number and inherits
  that number's honesty. It cannot catch "you forgot to bump the module."**

* **`tests/version-stamp-test.mjs` 1.0.0, new.** 99 checks: constant vs header
  for every file in `SOURCES`, both CSS stamps, all three module pins, and
  agreement between the three mirrored copies of the source list.
  ⚠️ **THE CHECK ALREADY EXISTED — `npm run audit:versions` had been reporting
  four of these for a whole round.** It is a separate command, outside
  `npm test`. **A guard that is not in the suite is a guard nobody runs.**
  ⚠️ It fails on lying stamps ONLY; the 17 header-length/coverage findings print
  as **notes** and exit 0, because seventeen permanent reds is the exact
  mechanism that let this ship past two already-failing harnesses.

* **`tests/hud-test.mjs` 1.1.1 → 1.2.0.** Part B rewritten against the real
  `{ lead, sprint }` API; pin moved to 1.4.1. Mutation-verified: resurrecting
  the `long`/`left` fields fails 2 checks, and making `lead` sprint-above-daily
  — the graded number moving between surfaces — fails 5.

* **`tests/run-all-tests.mjs`:** registered the new harness; corrected
  `drill-filter-test.mjs`'s description, which still called Part F1 *PENDING*
  long after it went green. **44 harnesses, all passing.**

* **`hud.js`** also had its doc-block corrected — it still documented the
  deleted v1.2.0 return shape, three versions on.

* ⚠️ **NOT DONE, ON PURPOSE:** ROADMAP item 0b (the School settings panel). A red
  suite and a broken instrument outrank a new feature. And `hud.js`'s
  **major-bump question remains open and is Jake's** — v1.3.0's own header flags
  that a breaking change to a shared module's public function is arguably v2.0.0.

## Round 26g — Elliott-Fisher (2026-08-21, evening) — ROADMAP 0d

**"I'M DONE" SHIPPED.** A student-facing exit in all three modes.

* **`receipt.js` 1.0.0, new.** The stamped library date-due card — the week's
  days, then today's total stamped RETURNED. Shared by both writers from the
  start, because four hand-maintained twins failed on this same day.
  ⚠️ **DOM-only and state-free**, same contract as `celebrate.js`: it is handed a
  week that has already been read and it draws it. It never reads Firestore,
  never flushes, never decides. Formatting comes from `hud.js`'s `fmt()` — the
  fifth surface onto it, so a receipt reading "12m 30s" beside a HUD reading
  "12:30" cannot happen.
* **`game.js` 3.41.0 → 3.42.0**, **`learn.js` 2.26.0 → 2.27.0.**
  `handleImDone()`: file the open sprint/run, take a `final` flush, read the
  week, draw the card. **Both halves already existed and are already called on
  every other exit path — this is a third caller, not new machinery.**
  ⚠️ It manufactures the deliberate exit §3.1 says does not exist. It does NOT
  fix the unflushed-tail gap; it gives every child a way not to be in it. And it
  closes the open sprint, so the drill-down matches the day total instead of
  dropping the tail under the five-second floor.
* ⚠️ **THE RULES, AND THEY ARE THE DESIGN:** never labelled "Save"; no confirm,
  no nag, no warning for skipping it; never the only way out (← Library and
  (Logout) are untouched); nothing anywhere gates on it. **A child who never
  presses it loses nothing.** The failure mode is not a crash — it is the button
  slowly becoming load-bearing, and `tests/done-button-test.mjs` asserts the
  wording and the shape for exactly that reason.
* **`tabindex="-1"`, mouse only.** ROADMAP item 8's ruling: a focusable control
  reachable by Tab from a typing view eats a keystroke the child should have been
  credited for. Item 8 solved that by moving the font picker out of the drill;
  this button has the opposite requirement — they are IN the drill when the bell
  rings — so it is unreachable by Tab instead.
* **Inside `#user-info`**, so guests never see it: no week to read, nothing to
  flush.
* **Re-entrancy guarded.** Twelve-year-olds double-click, and two overlapping
  runs would file the open sprint twice — §6 item 8's duplicate rollup,
  manufactured on purpose. Released in a `finally` so a throw cannot wedge the
  button shut.
* **A failed read still shows the card, marked short.** The flush already
  happened; showing nothing would read as "it didn't work", which is the one
  message this button must never send.
* **`style.css` 3.7.1 → 3.7.2.** `.done-btn` is outlined and quiet on purpose.
  ⚠️ If a later round wants to make it a solid accent button for
  discoverability, read `receipt.js`'s header first.
* **`tests/done-button-test.mjs` 1.0.0, new.** 55 assertions; mutation-verified
  by relabelling it "Save" (fails B1/B2) and reversing close-then-flush (fails
  A4). Part F re-runs the div-balance check that would have caught 26e's stray
  tag.
* **`tests/run-all-tests.mjs` → 1.12.0.** 43 harnesses.

⚠️ **NOT SEEN RENDERING.** Same as everything else this evening.

## Round 26f — Elliott-Fisher (2026-08-21, evening)

⚠️ **"DOUBLE IT" MEANT THE FIREWORKS, NOT THE ODDS.** 26e read Jake's *"I'm not
sure if they just didn't see it (so double it)"* as a probability argument and
built a recovery latch. He meant make the display twice as big. Both were worth
doing; this is the one he asked for.

* **`celebrate.js` 1.0.0, new.** `launchConfetti()`, `launchFireworks()`,
  `showGoalToast()` and the canvas, in one place.
  ⚠️ **THE FOURTH HAND-MAINTAINED TWIN FOUND IN A SINGLE DAY** — after
  `mergeGuestStats()`, `applyGoalCelebrationState()` (open-coded twice inside
  `learn.js` alone), and the ⚙ / ↺ furniture. `learn.js`'s header called its copy
  "copied from game.js" and had for months.
  ⚠️ **AND THEY HAD ALREADY DRIFTED, WITHOUT ANYONE CHOOSING TO:** School burst a
  fixed 80 particles where Library burst 60–100; School's particles never shrank
  as they faded (`p.size` against `p.size * p.life`); School's toast had no
  entrance animation. Nobody decided any of that. School and Library now show the
  same celebration.
* **The weekly fireworks are doubled.** `SHELL_COUNT` 5 → **10**, `SHELL_STAGGER`
  400ms → 300ms, `FIREWORK_FRAMES` 400 → **800**. Wider launch spread, higher
  bursts. ⚠️ **The DAILY confetti is deliberately unchanged** — it recurs every
  morning and should stay the smaller of the two; the weekly is crossed once per
  week per child and is the most-earned moment in the app.
* ⚠️ **A latent bug the doubling would have exposed, now commented in place.** The
  teardown test is `shells.length >= SHELL_COUNT && shells.every(...)` — the
  length term is NOT redundant, because shells arrive on staggered timeouts and
  `every()` is vacuously true on an empty array. Doubling the count lengthens
  that window; without the guard the display would tear itself down before the
  second shell launched.
* **`game.js` 3.40.0 → 3.41.0**, **`learn.js` 2.25.0 → 2.26.0.** Local copies
  deleted, shared module imported. These files decide WHETHER to celebrate;
  `celebrate.js` decides HOW, and knows nothing about goals, totals or students.
* **`tests/celebration-test.mjs` 1.0.0 → 1.1.0.** 41 assertions. New checks:
  neither writer defines a local `launchFireworks`/`launchConfetti`, the doubling
  constants hold, the weekly outlasts the daily, the canvas keeps
  `pointer-events:none` (a full-screen layer that swallowed keystrokes would
  interrupt typing), and the staggered-teardown guard survives.
  Mutation-verified: reverting the constants to 5/400 fails E11 and E12.

## Round 26e — Elliott-Fisher (2026-08-21, evening)

* ⚠️ **`learn.html` 1.1.0 → 1.2.0 — A STRAY `</div>`, AND IT WAS MINE.** Round
  26b's markup replacement sliced one closing tag short of the original block
  while the replacement text carried both, leaving `#hud` with six closers to
  five openers. **That is the missing top margin Jake saw in Safari and
  intermittently in Chrome** — an unbalanced close tag is a parse-error recovery
  path, and recovery is exactly where engines differ. `game.html` was checked and
  is balanced. ⚠️ **A div-balance check on both HUD blocks is now the first thing
  to run after any markup edit** — it took one command and would have caught this
  before it shipped.
* **`index.html` 3.10.0 → 3.11.0.** Daily removed from the landing bar on Jake's
  ruling — *"it just looks out of place; weekly is what matters most there."*
  The week stays under the name. `hud.lead` is still computed and deliberately
  not painted, so the day it comes back the change is an element to paint into
  rather than a second formatter invented beside the first.
* ⚠️ **`hud.js` 1.3.0 → 1.4.0, `game.js` 3.39.1 → 3.40.0, `learn.js` 2.24.0 →
  2.25.0 — "NOT EVERYONE GOT FIREWORKS."** Both writers fired correctly; the
  **suppression** was wrong. It asked *"is the total already past the goal"* —
  true for the entire remainder of the week — instead of *"have we actually
  SHOWN this to the child."* So any crossing that failed to fire at the moment
  it happened was gone permanently, and the plainest way to fail at that moment
  is `goals.weeklySeconds` still being 0 because the class read has not returned
  and the child started typing straight away.
  ⚠️ **A WEEKLY GOAL IS CROSSED EXACTLY ONCE PER WEEK, so one missed moment is
  the whole week.** The daily goal carried the identical defect invisibly because
  it re-arms every morning.
  New `celebrationDone()` / `celebrationMark()` latch what was actually shown,
  keyed to the period. **A child who crosses in School and misses it now gets it
  in Library, once.** ⚠️ localStorage on purpose: per-browser, so a second
  Chromebook may show it twice — the correct direction to fail, and Jake's own
  ruling was "if they just didn't see it, double it."
  ⚠️ `learn.js`'s two open-coded suppression pairs are now one named
  `applyGoalCelebrationState()`, so its call sites cannot drift the way the
  duplicated pairs could.
* **`tests/celebration-test.mjs` 1.0.0, new.** 28 assertions; mutation-verified
  by restoring the old suppression, which fails Part E. Part B is the recovery
  case and is the whole point of the change.
* **`tests/hud-lead-test.mjs`** updated for the landing page's ruling.
  **`tests/run-all-tests.mjs` → 1.11.0.** 42 harnesses.

## Round 26d — Elliott-Fisher (2026-08-21, evening)

* **`game.js` 3.39.0 → 3.39.1**, **`style.css` 3.7.0 → 3.7.1.** ⚠️ **THE ⚙ GEAR
  WAS NEVER IN THE BAR AND HAD NOT BEEN FOR A LONG TIME.** It was appended to
  `<body>` with `position:absolute; top:20px; right:20px` — which is 20px down
  the PAGE, i.e. dangling just below a 60px `#hud`, in the reading area, aligned
  to nothing. It shows that way in every render Jake has sent, including the ones
  from before this round. Nobody caught it because the one-row bar had no obvious
  right-hand home for it; the two-row bar does. Now a child of
  `.hud-section.right`, laid out in the flex row like every other control.
  **Not a regression from 26b — an old defect the redesign made visible.**

## Round 26c — Elliott-Fisher (2026-08-21, evening)

**THE LANDING PAGE JOINS THE BAR** (ROADMAP item 0c.1). Jake accepted the extra
read as worth it — and ⚠️ **THERE WAS NO EXTRA READ TO ACCEPT.**

* **`index.html` 3.9.0 → 3.10.0.** ⚠️ **`loadIndexStats()` WAS ALREADY DOING THE
  SEVEN-DOCUMENT READ AND THROWING THE ANSWER AWAY.** It painted
  `#index-stats-bar`, an element removed from the markup at some point with the
  function left orphaned, so every landing visit paid for `readWeek()` and then
  hit `if (!bar) return;`. The header readout is that read finally reaching a
  screen. **The cost was already being paid; only the benefit was missing.**
* **The landing page now uses `hud.js`.** Its open-coded `fmt()` was a FOURTH
  copy of the same formatting, on the one surface nobody checks against a
  report. Daily leads on the left; the week sits under the name.
* **Goals resolve cache-first**, reading `ttb_goalsCache_v1` — game.js's own key,
  same 24-hour TTL, same uid check — so the usual case costs **zero** additional
  reads and a miss costs two. ⚠️ **A GOAL THAT WILL NOT RESOLVE STAYS ZERO** and
  hud.js renders the bare figure with no denominator and no tick. Never guess a
  goal: a wrong denominator invents a ✓ the child did not earn.
* ⚠️ **Both readouts hide on sign-out.** On a shared Chromebook the next child
  must not find the last one's minutes sitting in the header.
* **Styles are scoped as `.idx-*`, not `.hud-*`.** This page has never linked
  `style.css`; linking it now to save six declarations would restyle the whole
  library. Deliberately a different prefix so nobody greps `.hud-stack`, finds
  these, and concludes one rule governs both bars.
* **`tests/hud-lead-test.mjs` 1.0.0 → 1.1.0.** 97 assertions. New Part D checks
  cover the fourth surface: it imports `hudStrings`, its `fmt()` copy is gone,
  Daily is the lead row, the week is under the name, and the readout clears on
  sign-out.

⚠️ **STILL NOT SHIPPED: the trophy on the landing page.** `index.html` has no
leaderboard and no entry point to one — `openLeaderboard()` lives in `game.js`.
That is a real feature, not a button, and it stays in item 0.

## Round 26b — Elliott-Fisher (2026-08-21, evening)

**THE TWO-ROW TOP BAR.** ROADMAP item 0's display half, built the same evening it
was specced. ⚠️ **The "not before Monday" hold in item 0 was lifted by Jake** on
two grounds, both good: nobody is typing between now and midnight and grades are
already in, so tonight carries no data risk — and the current bar is **already
unreadable for Monday's job**, truncating to `Daily 41:37 / 10:00…` with the goal
cut off. Fixing the instrument improves the verification rather than confounding
it. `hudStrings()` is a pure function over `secondsToday`/`secondsWeek` and never
touches the per-source fields, so it is orthogonal to the cutover.

⚠️ **THE "I'M DONE" STAMP IS *NOT* IN THIS SHIP.** It is a write path and it still
has an unanswered design question (item 0c.3). It stays in the roadmap.

* **`hud.js` 1.2.0 → 1.3.0.** ⚠️ **BREAKING RETURN SHAPE:** `{ left, long }` →
  `{ lead, sprint }`. `lead` is **always** the Daily figure; the sprint is its own
  field for the centre cluster. The `long` flag — v1.2.0's shrink-the-font
  band-aid for the 40-character glued string — is **deleted, not tuned**, because
  the string it compensated for no longer exists.
  ⚠️ **JAKE: A BREAKING CHANGE TO A SHARED MODULE IS ARGUABLY MAJOR (2.0.0).**
  Shipped as a minor since both callers moved in the same commit and nothing else
  imports it, but that call is yours.
* **`game.js` 3.38.1 → 3.39.0**, **`learn.js` 2.23.2 → 2.24.0**,
  **`game.html`**, **`learn.html`**, **`style.css` 3.6.1 → 3.7.0.** Left slot is
  Daily over context; centre is the sprint over WPM/accuracy/streak; right is the
  name over the week. ⚠️ **`#hud` IS STILL `height: 60px`** — the stack lives
  inside the fixed box (15px + 11px at line-height 1.25 ≈ 33px of 60px) and does
  not grow it. v3.5.3's `min-height` warning stands untouched.
  Overtime now colours the **sprint** instead of tinting the Daily figure orange
  for a sprint event. WPM and accuracy stay near their old 1.1em rather than
  dropping to sub-row size — the centre section's own comment about classroom
  readability is right.
* ⚠️ **`learn.js`: the ↺ Restart button is re-anchored to `.hud-section.left`.**
  It inserted itself after `#hud-lesson-label`, which is now inside the 11px sub
  row — the old anchor would have rendered Restart at sub-row size wedged under
  the Daily figure. Found by checking, not by looking at it.
* **`#user-class-name` is gone from the bar** on Jake's ruling ("forget about the
  class, it can live in settings"). `learn.js`'s write to it was already guarded,
  so nothing breaks.
* **`tests/hud-lead-test.mjs` 1.0.0, new.** 91 assertions. Part A proves `lead`
  is the Daily figure across every sprint/goal combination; Part D greps both
  painters and both markups, including **that `#hud-time` appears before
  `#hud-context`** — because in markup, order is what puts Daily on top.
* **`tests/run-all-tests.mjs` 1.9.0 → 1.10.0.** 41 harnesses.

## Round 26 — Elliott-Fisher (2026-08-21, afternoon)

⚠️⚠️ **A LIVE DATA-CORRUPTION FIX IN THE GRADED DOCUMENT, FOUND IN PRODUCTION.**
Two students out of two classes showed a 2026-08-21 daily total equal to their
real work **plus the whole of 2026-08-20** — exact to the second and the
character for one of them. `HANDOFF.md` §0.-12 is the full write-up.

⚠️ **THIS IS A STUDENT WRITE-PATH ROUND AND IT TOUCHES `learn.js`.** The standing
hold exists because 8th grade depends on that file. It was overridden on the
arithmetic: `learn.js` carries the identical defect on the identical path, the
cutover verification runs Monday, and leaving one writer corrupt while fixing
the other is the divergence Round 9 §4 warns about. ⚠️ **No timing mechanism was
touched** — the tick, the 3s idle threshold and the drill path are byte-for-byte
unchanged in both files.

* **`game.js` 3.38.0 → 3.38.1** and **`learn.js` 2.23.1 → 2.23.2.**
  `mergeGuestStats()` period-guarded the **server** side of `live - base` and
  never the **live** side — and on the only path that calls it, the server guard
  is a **tautology**, because `retroactiveSaveGuestSession()` /
  `retroactiveSaveAnonSession()` synthesise `lastDate: dateStr`. `learn.js`'s
  caller states the tautology as a guarantee: *"Both period guards match by
  construction."* A tab left open overnight re-authed with yesterday's day
  counters in `live`, so `mine` was yesterday's entire day and it landed on
  today's `typing_logs` document before a key was pressed. The function's last
  line, `statsData.lastDate = dateStr`, then restamped the stale counters as
  today's, so the tick's midnight rollover never fired.
  New `liveDay` / `liveWeek` gate **the contribution and the floor** — zeroing
  `mine` alone is a half-fix, because `max(live, …)` re-floats the stale value on
  its own. `liveWeek` is conditioned on `liveDay`: yesterday's week contribution
  was already flushed and is already inside the server's week sum.
* **`tests/live-period-test.mjs` 1.0.0, new.** 42 failing against the old build,
  63 passing against the new. Part A drives the two students' real figures in
  both files; **Part B passes on both builds on purpose**, re-driving the real
  2026-08-20 guest-minute numbers so that a fix which un-fixed Round 23 goes red.
  No student identifiers in the file.
* **`tests/run-all-tests.mjs` 1.8.0 → 1.9.0.** Harness registered. 40 harnesses.

## Round 25 — Hall (2026-08-21)

⚠️ **NOT a student write-path round.** Nothing in `game.js`, `learn.js`,
`daylog.js`, `stats-wal.js` or `session-log.js` is touched. One staff-facing
READ path and one harness.

⚠️ **SHIPPED ON CUTOVER EVE ON PURPOSE.** The gate this corrects becomes
load-bearing on 2026-08-22, and Monday's verification list includes the very
panel it feeds. Fixing it after the observation would have meant not knowing
whether a bad number was this defect or a stale deploy.

* **`lessons-admin.js` 1.13.0 → 1.13.1.** The Students roster panel dated each
  `typing_logs` document by `data.date` — the field the writer stamped — where
  `reports.html` warns in capitals at its own point read to key off the document
  id instead. New `_logDateFromId()` parses `{uid}_{date}` **anchored at the end
  of the string**, because a Firebase uid may legally contain an underscore and
  `split('_')[1]` would quietly truncate the date to nothing. Falls back to
  `data.date` when the id will not parse, which is the old behaviour exactly.
  The totals expression itself is UNCHANGED, so `daylog-cutover-test.mjs` Part G
  still lifts it byte-for-byte.
* **`lessons-admin.js` header repaired (same version).** `v1.13.0`'s entry had
  been pasted into the middle of `v1.11.0`'s sentence, truncating it at
  "reports.html". Entries descend again and `audit:versions` no longer reports
  this file out of order. Comments only.
* **`package.json` — the duplicate `//scripts` key is merged.** JSON takes the
  last of a repeated key, so the array explaining `npm test` and `--with-epubs`
  was discarded by every parser that read the file. New `//type` key records why
  `"type": "module"` must NOT be added to silence the Node warning: it would
  break the CommonJS Cloud Function that `main` points at.
* **`learn.js` 2.23.0 → 2.23.1 / `style.css` 3.6.0 → 3.6.1.** ⚠️ The reading-font
  control shipped INVISIBLE — correct code, right element, styled at 0.75rem in
  `#777` with no affordance, and Jake asked whether the feature existed. Now an
  "Aa" glyph rendered in the chosen face inside a bordered pill. ⚠️ The real
  defect was that 57 assertions covered the filter and none asked whether the
  other half was on screen; **Part H** renders `learn.html` in jsdom and enforces
  a visibility floor. Also fixes F11, which asserted a COUNT as a proxy for an
  invariant and went red on a correct change.
* **`learn.js` 2.22.0 → 2.23.0.** ⚠️ Two student-facing additions under Jake's
  condition that neither touch the timing mechanism — asserted, not promised, by
  `drill-filter-test.mjs` F7, which brace-matches the five new/changed functions
  and checks none mentions a counter, timer or flush. (1) The drill filter, wired
  into `generateRandom()` and the pattern generator's random phase 3; phases 1
  and 2 are deterministic and untouched. (2) The reading-font picker, five faces,
  `localStorage`, built into the map header by an idempotent call at the top of
  `renderMap()`.
* **`style.css` 3.5.6 → 3.6.0.** `#drill-text` reads `var(--drill-font)`.
  ⚠️ `.ttb-drill-proportional` swaps `.dt-fixed`/`.dt-dirty`'s `font-weight: bold`
  for an underline: bold changes advance width in a proportional face, so the
  "state classes never change dimensions" promise above `.dt-char` held only by
  luck of the font. Also fixes `body::before`, which still read `"v3.5.5"` after
  the v3.5.6 edit — the build footer had been under-reporting this file, and
  nothing checked the stamp against the header. F12 does now.
* **`drill-filter.js` NEW, at v1.3.0 after three same-morning revisions.**
  v1.0.0 matched SUBSTRINGS (wrong — would have stripped `lass` and `mass`);
  v1.1.0 matched WHOLE GROUPS on Jake's first ruling; **v1.2.0 matches LEADING**
  on his amendment — *"ass can't lead the word in the four letter clump. Fass is
  fine, but asse would probably get it."* ⚠️ That amendment REVERSED one of his
  own earlier examples, and v1.1.0's whole-group rule had a dead spot: a
  three-letter entry could not fire at groupSize 4 at all, so the original report
  was not covered by the fix written for it. Leading covers it.
  Then **v1.3.0**: *"all of the other words should be on a NEVER USE list."*
  `ass` is the sole `LEADING` entry; everything else is `NEVER`, matched anywhere.
  ⚠️ `fuk`/`fuks` deleted — my invention, and 80% of the filter's whole cost on
  the home+index key set. Second entry to do that after `kkk`; neither was
  visible by reading. Part A now prints a per-entry cost table every run.
  ⚠️ **Leading matching also blocks `assignment`, `assume`, `assist`, `assess`
  and `asset`** — correct for nonsense groups, catastrophic for prose. The
  never-use-on-`game.js` warning is now load-bearing.
  ⚠️ `kkk` was in tier 2 for an hour; a failing test threw it out, because it is a
  substring rule and `k` is a home key, so it fired on ordinary same-finger
  repetition more often than the defect it was there to fix.
* **`school-audit.html` NEW at v1.0.0.** Read-only diagnostic: why classes do not
  appear under a school. No writes, no repair button, no student names or emails.
* **`tests/drill-filter-test.mjs` NEW.** 36 checks. Part A reproduces
  `generateRandom()` over 200,000 groups and MEASURES the rate rather than
  asserting it — and holds `drill-filter.js`'s header to that measurement, after
  the first draft of that header guessed "one in ninety" and was out by half.
  Part F1 is PENDING by design.
* **`tests/run-all-tests.mjs` 1.5.0 → 1.6.0.** Registers the new harness and adds
  `daylog.js`, `update-gate.js` and `drill-filter.js` to the syntax-check list.
  ⚠️ `update-gate.js` is imported by both student HTML pages and had **no**
  coverage; a syntax error in it would have taken down School and Library at
  import time with the suite reporting success. 13 → 16 modules.
* **`tests/daylog-cutover-test.mjs` 1.1.0 → 1.2.0.** Part H (NEW, **12 failing
  against v1.13.0**, verified by running it against the pre-fix file). H1/H2 are
  the regression guard — they assert the roster LOOP calls the helper, because a
  perfect helper that nothing calls is the failure mode here. H5 is the defect
  end to end, on a mixed day. ⚠️ H5c asserts the OLD behaviour's loss and is
  green under BOTH builds on purpose: it is the control that proves H5b is
  measuring something.

## Round 23 — Empire (2026-08-20)

⚠️ **STUDENT WRITE-PATH ROUND.** Upload `session-log.js` FIRST.

* **`session-log.js` 1.4.0 → 1.5.0.** The queue store is now one slot PER
  ACCOUNT. `_write()` had no ownership guard, so any second uid on one profile
  destroyed the first's unflushed records. The `v: 1` record migrates in place
  under the same storage key. New: `GUEST_QUEUE_UID`, `sessionLogTake()`,
  `MAX_QUEUE_OWNERS`. ⚠️ Older version entries trimmed from the header to hold
  the 6-entry budget; the behaviour they describe is in SEMANTICS, not history.
* **`game.js` 3.35.0 → 3.36.0.** THE GUEST MINUTE. This file had no guest merge
  on the auth path while `learn.js` did, so time typed before signing in was
  erased by `applyWeekToStats()`, which assigns. The merge existed twice, inline,
  in two modal paths — so which of three sign-in buttons a child pressed decided
  whether their minutes survived. `retroactiveSaveGuestSession()` is the one
  copy, called by all three, before `loadUserStats()`. A true guest's sprints are
  queued under `GUEST_QUEUE_UID` and adopted at sign-in instead of dropped.
* **`learn.js` 2.20.0 → 2.21.0.** `logRun()` filed a guest's runs under the
  throwaway anonymous uid — its guard tested `currentUser`, but a guest IS signed
  in anonymously. They go to the guest slot now and are adopted.
  `retroactiveSaveAnonSession()` adopts them. Logout reloads, so a signed-out
  page stops painting the departed student's daily and weekly totals.
* **`reports.html` 2.24.0 → 2.25.0.** Reconcile vs Sessions and rebuild-all
  DELETED (~830 lines) on Jake's confirmed boundary. Kept: Generate, CSV,
  drill-down and its ⧉ badge, the per-day editor and its SAVE box, and ⟳ on a
  single day. `runPool()` — used by Generate — no longer depends on the
  reconcile's constants. `recalcDailyLog()`'s dead `expect` option removed.
* **`tests/run-all-tests.mjs` 1.4.0 → 1.5.0.** `guest-merge-test.mjs` (NEW, 11
  failing against the old build) and `queue-owner-test.mjs` (NEW, 8 failing)
  registered. `reconcile-test.mjs` and `union-clock-test.mjs` deleted with the
  code they covered — the registration audit caught the half-done deletion.
  `real-sessions-fixture.mjs` exempted as data.
* **`tests/real-sessions-fixture.mjs` NEW.** The only real production session
  data in the repository, lifted out of `union-clock-test.mjs` before deleting
  it. No student-identifying data.
* **`HANDOFF.md` 14.30.0 → 15.0.0**, and **`docs/archive/HANDOFF-ARCHIVE.md`
  NEW.** 237 KB → 112 KB; Rounds 15–20 narratives archived read-only.
* **`ROADMAP.md` 2.2.0 → 3.0.0.**


<!-- CHANGELOG.md v1.3.0 — created 2026-08-02 by Blick.
     v1.3.0 — Round 6 (Noiseless), second pass: four documents recovered from outside
              the repo and committed — TTL-GUIDE.md v1.4.1 (verified accurate),
              HANDOFF-round3.md (Rounds 1-3, contains the definitive document map at
              its §10), SCALE-PLAN.md v1.3.0 (status corrections only, arithmetic
              untouched) and MULTITENANCY.md v1.1.0 (⚠️ superseded; committed only
              because a warning header makes it safe to read). Three documents remain
              missing; HANDOFF-round4.md never existed at all.
     v1.2.0 — Round 6 (Noiseless): four entry blocks were filed under ## `metadata-map-test.mjs`

Current: **v1.3.0**

#### v1.3.0

Round 8 (Yost). **Repaired a harness that had been red since `admin.js` v3.30.0.**

         It lifted `CLASSROOM_NOTICE` and died on it. v3.30.0 deliberately removed
         `runDedication()`, `CLASSROOM_NOTICE`, `DEDICATION_TEXT` and the classroom
         argument to `canonicalRightsFrom()` — the feature went away and the harness did
         not.

         ⚠️ **Not the old tests with the argument dropped.** The replacements assert the
         *current* contract, which is the inverse of the old one: the combined PD & CC0
         option still exists in `admin.html` and is chosen **by hand**, and nothing in the
         mapper may reach it on its own. Auto-relicensing a book is quiet when wrong.

         Added: a leftover third argument must do **nothing**, so the parameter can only
         come back deliberately; and `readInBookSignals()` is checked by exact key set
         rather than `sig.classroom === undefined`, since an undefined check passes just
         as happily when the function has been renamed out from under it.

         ⚠️ **A permanently red harness trains everyone to read "1 failing" as normal**,
         and the next real failure hides behind it. Suite is 17/17.

---

## `game.js`
              that describe index.html and style.css, and every section's entries
              were re-sorted newest-first. The ordering claim below was aspirational
              until now; game.js, admin.js and index.html were all out of order.
              Nothing was deleted — the move was line-accounted both ways.
     v1.1.0 — Round 4 (Oliver): the cost/grades/stability audit pass. -->

The full per-file history. **File headers carry only the last six entries** — see
the header budget rule in `README.md`. Anything older lives here and nowhere else.

Versions are newest-first within each file. A file's runtime constant is the
authority for what's actually running; this document is the story of how it got
there.

## Contents

- [`game.js`](#gamejs) — currently v3.14.0
- [`adventure-renderer.js`](#adventure-rendererjs) — currently v1.4.0
- [`admin.js`](#adminjs) — currently v3.24.2
- [`index.js`](#indexjs-cloud-functions) — currently v1.6.0
- [`learn.js`](#learnjs) — currently v2.2.4
- [`index.html`](#indexhtml) — currently v3.6.1
- [`style.css`](#stylecss) — currently v3.5.0

- [`lessons-admin.js`](#lessons-adminjs) — currently v1.7.1

Files not listed here have short headers that fit the budget on their own:
`staff-admin.js`, `keyboard.js`, `versions.js`, `firebase-config.js`,
`adventure.css`.

---

## `game.js`

Current: **v3.19.1**

#### v3.19.1

Round 9 (Corona). **After a book switch, the only guidance was rendered behind the modal
that was asking for the decision.**

         `book-select.onchange` wrote *"Switched to X. Pick a chapter and hit Go."* into
         `textStream` — the page **underneath the still-open Settings modal.** The message
         was correct and completely invisible until after the choice had been made.

         Reported by Jake, who hit **Close** instead of **Go**. Close is not wrong: its
         handler carries a `bookSwitchPending` fallback that loads the chapter and starts
         the new book. **Correct behaviour, dishonest label** — "Close" promises far less
         than that handler delivers, so the safety net read as the main path.

         Two changes, both cosmetic: the hint now renders in a `#book-switch-hint` slot
         directly under the book picker, inside the modal; and the footer button relabels
         itself to **"Start Reading"** while a switch is pending. The `textStream` line is
         kept — it is useful the instant the modal closes — with a comment explaining why
         it cannot be the only signal.

         No behavioural change. `resetModalFooter()` rebuilds the button on every
         `openMenuModal()`, so the label needs no manual reset.

#### v3.19.0

Round 9 (Corona). **The Settings dropdown was scanning the whole `books` collection,
uncached, on every open.**

         `openMenuModal()` did a bare `getDocs(collection(db, "books"))`. It was the last
         read in the student path that ignored the caching discipline the rest of the file
         adopted in v3.4.0, and the only one that got **worse over time** — the bookclean
         project adds titles continuously, so the cost of opening a menu grew with the
         library. At ~42 books it was roughly the size of the entire rest of the read
         budget; at 100 books it would have been double.

         Replaced with `loadBookList()`, using the pattern `index.html` already had for
         the library grid: `{id, title}` cached in `localStorage` for an hour, validated
         by a **COUNT aggregation — one billed read for the whole collection** instead of
         one per document. A count catches a book being added or removed, which is the
         case that matters; a rename is caught by the TTL.

         ⚠️ **Only `id` and `title` are cached.** The `chapters` array is by far the
         largest field on a book document and the dropdown renders neither. `index.html`
         learned this the expensive way — see its `BOOKS_CACHE_KEY` note.

         Adds `getCountFromServer` to the Firestore imports. Console escape hatch:
         `ttbClearBookList()`, matching `ttbClearLibraryCache()`.

         See SCALE-PLAN.md v1.4.0 § Problem 7.

#### v3.18.0

Round 8 (Yost). **Flip Back reachable from the pause / sprint-stats screen**, in
`showStatsModal()`'s `extraHTML` slot — between the cumulative stats and the footer
buttons, where Jake asked for it.

         ⚠️ **That screen is where a student actually notices they are lost.** They stop
         typing *because* the text stopped making sense. Requiring them to dismiss the
         stats, land back in the book and pause again to reach the tool was asking them to
         navigate out of the exact confusion the tool exists to fix. **An escape hatch
         belongs where people are when they need it, not only where the flow begins.**

         `modalActionCallback` is cleared before opening, so the sprint being abandoned
         does not resume underneath the picker. Suppressed in practice mode: that text is
         generated rather than the book, so there is nowhere in it to flip back to.

         Also reaches the chapter-complete screen, which shares `showStatsModal()`. That
         is deliberate — "I finished that but don't remember reading it" is the exact
         symptom v3.15.0's dead offsets produced.

#### v3.17.0

Round 8 (Yost). **Flip Back — Game Genie's chapter-and-sentence navigation, given to
students and bounded so it can only go backwards.**

         Jake: *"Why not give students the aspect of Game Genie that jumps to any chapter
         and any sentence in the chapter, but limit it to previous to where they are now?
         Would that be a terrible idea?"*

         ⚠️ **The ceiling is `furthest`, not the current position, and the difference is
         the whole feature.** Bounding by where a student is standing collapses the moment
         it is used: flip back to Ch. 2 and Ch. 3 becomes "ahead", so the tool that just
         moved them can no longer move them home. Bounding by `furthest` gives free
         movement across everything already earned and still no route past the frontier —
         more useful, exactly as permissive.

         ⚠️ **Cross-chapter jumps are two-step by necessity.** The sentence map is built
         from `fullText`, which only exists for the chapter that is loaded. Picking a
         chapter loads it and reopens the modal at the sentence step. Collapsing that into
         one screen means prefetching every chapter — 284 reads on Aesop's.

         Sentences are listed as **text, not numbers**. A student choosing where to resume
         is looking for a moment they remember, and "Sentence 84" is not a moment.

         `buildChapterOptions()` and `wireChapterFilter()` take an optional `ceilingNum`;
         the three existing callers are untouched. A ceiling that is not in the body list
         yields *no* ceiling rather than an empty picker — a student locked out of their
         own book is a worse failure than one offered a chapter too many. The target
         sentence is clamped a second time in `flipBackTo()` rather than trusting the
         `<select>`, because the filter box rebuilds that list on every keystroke.

         Kept alongside v3.16.0's one-click restart rather than replacing it: restarting
         the current chapter is the common case and stays one click.

         ⚠️ **Known and accepted:** sentence-level backjump makes looping a memorised
         sentence to inflate WPM easier. Not a new hole — restart-chapter and practice mode
         both already allow it — but tighter. Flagged to Jake before shipping; if the
         leaderboard ever looks wrong, start here.

#### v3.16.0

Round 8 (Yost). **"Start this chapter over" — a link in the start modal, shown whenever
the student is partway into a chapter.**

         Jake, after testing v3.15.1: *"Typed some of Little Princess, and it felt new —
         which was both good and bad, as I'm not sure I was that far forward when I was
         typing… Not sure if we can fine tune past that, other than letting kids skip back
         to the beginning of the chapter."*

         ⚠️ **Every navigation students had ran FORWARD.** Jump-to-furthest was the only
         one, and there was no chapter picker outside Game Genie (admin-only). A student
         sitting ahead of what they had actually read had no move available at all — which
         is exactly the state v3.15.0's dead offsets left people in, and it is also the
         residue those offsets left behind: a chapter falsely ticked complete advances the
         student legitimately, and no later fix can un-write that. **The remedy for damage
         already committed is a way back, not a better guard.**

         Deliberately NOT gated on a re-anchor having occurred. A kid who lost the thread
         for a page wants this as much as one the software misplaced, and an affordance
         that surfaces only after a rare fault is one nobody has learned to look for.

         Leaves `furthestChapter` / `furthestCharIndex` untouched, so the jump link above
         it reverses the action in one click. That is what makes it safe without a confirm
         dialog: nothing is destroyed, and confirming a harmless action mostly teaches
         children to click through warnings.

         ⚠️ Still no way back to a PREVIOUS chapter — see HANDOFF §3b. That needs the
         `completedChapters` semantics decided first (does re-reading un-tick a ✓?) and is
         Jake's call, not a mechanical extension of this.

#### v3.15.1

Round 8 (Yost), same session. **v3.15.0's fix reproduced the bug it was written to fix.**
Jake hit it on Aesop's Fables within minutes of deploying, on a 544-character chapter.

         ⚠️ **An offset at or past the end of a chapter is a DEAD STATE, not a position.**
         The renderer draws the tail of the text, the student reads it as "one sentence
         left", and their first keystroke hits the `currentCharIndex >= fullText.length`
         guard in the keydown handler and runs `finishChapter()`. The tell is in the
         completion modal: **0 WPM, 100% accuracy, 0m 1s.** Nobody typed anything.

         v3.15.0 reached that state three separate ways, all mine:
         (a) the under-a-week rung clamped to `len` and called it "their exact spot" —
         recency is worthless when the content changed *after* the bookmark was written;
         (b) the week-to-month rung clamped to `len` and *then* snapped to the sentence
         start, which lands on the **last sentence of any chapter, every time** — a
         machine for manufacturing this exact symptom;
         (c) worst, the recent rung **laundered** the bad offset: one keystroke completed
         the chapter, the flush stamped the current `contentVersion` onto the dead
         position, the versions then agreed, and no reconcile ever fired again.

         `reconcilePosition()` can now never return a position with nothing left to type,
         at any age, with or without a job.

         ⚠️ **Anchor proof is consulted BEFORE the dead-state guard, and the order is
         load-bearing.** The first attempt put the guard first and the harness caught it
         in one run: a chapter that *shrank* below a student's stored offset is both out
         of range and perfectly rescuable, because the anchor still names the words they
         had reached. Bailing to the top of the chapter there discards the only hard
         evidence in the system.

         ⚠️ **`reanchor-test.mjs` v1.0.0 asserted the bug as correct and passed.** It
         checked that an out-of-range index "lands on a real sentence boundary" — which
         it did: the boundary of the final sentence. 25 green checks, one of them
         expecting the wrong number. A passing assertion is only as good as the value it
         expects. The regression block added in v1.1.0 fails against v3.15.0.

#### v3.15.0

Round 8 (Yost). **A student's place in a book did not survive the book being re-uploaded.**

         A bookmark is `(chapter, charIndex)`. Both coordinates are measured against one
         specific version of the text, and the progress document recorded NOTHING about
         which version that was. Jake re-uploaded the entire library after a cleaning
         pass — edits ranging from a few reworded words to wholesale chapter renumbering
         — and every stored `charIndex` silently became an offset into a text that no
         longer existed.

         ⚠️ **It threw nothing, logged nothing, and completed normally.** Jake opened
         *A Little Princess* and found ONE SENTENCE left in Ch. 2. Typing that sentence
         ran `finishChapter()`, which ticked the chapter off as read. A student would not
         report this as an error; they would report it as "the computer says I finished
         it". That is the entire reason this class of bug survives: the failure mode is a
         plausible success.

         `setupGame()` did `currentCharIndex = savedCharIndex` — a raw assignment with no
         clamp against `fullText.length`, in every version of this file ever shipped.
         Rounds 6 and 7 hardened the chapter *id* three separate times
         (`isKnownBodyChapter`, the `furthestChapter` companion check,
         `firstBodyChapterId`). Nobody ever looked at the other coordinate.

         **The fix, in two halves.** Every progress write now stamps `contentVersion`,
         `chapterTitle`, `chapterLen` and `anchorText` — the ~48 characters immediately
         behind the cursor. A matching `contentVersion` on load is the fast path and
         behaves exactly as before. A mismatch searches the new text for the anchor;
         finding it is not a guess about where the student was, it is where they were,
         and it survives both word-level edits elsewhere and a renumber that moved the
         chapter. Failing that, a staleness ladder — Jake's rule — degrades by how old
         the bookmark is: under a week keep the exact offset, under a month snap to the
         start of the sentence, beyond that to the start of the chapter.

         ⚠️ **The ladder needs no migration and no legacy branch.** `lastUpdated` has been
         on the progress document all along, so every pre-fix bookmark is simply stale and
         lands on the chapter-start rung by the ordinary rule. A one-off repair tool was
         considered and is not buildable anyway: `firestore.rules` allows staff and super
         to READ any student's progress but restricts `write` to `request.auth.uid == uid`.
         Healing has to happen in the client, which is also where it is free.

         Also: **chapter IDENTITY is now checked, not just chapter existence.** A renumber
         that shifts content between ids that all still resolve (Toby Tyler's 3-22 → 1-20
         is the precedent) passes `isKnownBodyChapter()` and drops the student into
         different content at the same offset. The stored title survives that. It refuses
         to remap when the title is ambiguous rather than guessing at a part.

         Also: **`completedChapters` was never revalidated**, so a ✓ could sit on an id
         that now means a different chapter — and `chaptersCompleted` in the stats rollup
         takes its `.size`. Now filtered against the chapters the book actually has.

         New harness `reanchor-test.mjs` (25 assertions).

#### v3.14.2

Round 7 (Hammond). Classic end-credits row label `Licence` → `License`; the Firestore
field is still `rights` and no data changed. Cosmetic only.

         ⚠️ Its `VERSION` constant said `3.14.1` while the header comment said
         `3.14.2` for a few minutes during this round, which `audit-versions.mjs`
         caught immediately — the §2.3 failure mode, one file after reading the warning
         about it. Both are now `3.14.2`.

         `Current:` in this section read **v3.14.0** while the shipped file was
         v3.14.1, so v3.14.1's entry is also missing from this file.

#### v3.14.0

Round 6 (Noiseless). **game.js never consumed `pendingClassAssignments`.**

         Only learn.js did — and index.html links students straight into game.html,
         so a student who typed a book chapter before ever opening the Lessons page
         was never assigned to their class. ttbClassId stayed '', so every log
         document written that session carried classId: '', making the student absent
         from every class-filtered report and denying them their class's daily and
         weekly goals. It self-healed whenever they happened to open learn.html,
         which could be days. On day one of a 9-week rotation it is every newly
         imported student at once, and it is silent.

         Also: **the goals cache defeated the fix in both files.** loadGoals() writes
         ttb_goalsCache_v1 with a 24 HOUR lifetime, so an unassigned student's cache
         entry says classId: ''. applyPendingClassAssignment() writes the real class
         and then calls loadGoals() to pick it up — which hit the entry written 200ms
         earlier and returned the empty value again. learn.js's cache guard rejects an
         entry with a classId but no className, and '' is falsy, so it sailed through
         as a hit. Both pages share the key, so the poisoned entry followed the
         student between them. Both now clear it before re-reading.

         Verified by student-flow-test.mjs, which is new and walks a cold-start
         student's first sign-in against the shipping functions. It fails four
         assertions on the pre-fix code.


#### v3.13.1

Round 6 (Noiseless). **Header only — no code changed in this release.** The header
was 73 lines with 7 version entries against this project's own 60-line / 6-entry
budget, which versions.js reports in index.html's build panel. v3.12.0 and v3.11.0
moved out; both were already here in full. Uploading this file is optional and can
be batched with the next real change.


#### v3.13.0

Round 5 (Mignon). The last of the body-list fixes, and the Classic end credits.

         1. THE PROGRESS BAR'S SEGMENTS were built from bookMetadata.chapters, so
            the bar drew a stripe for the title page, imprint, dedication, appendix,
            endnotes, colophon and uncopyright page — ten stripes for a two-chapter
            book. The labels went to the body list in v3.10.0 and the second label
            in v3.12.3; the GEOMETRY never did, so the bar was drawn against one
            denominator and filled against another. Sixth site in this file. The
            updater walks the same list now instead of relying on half its lookups
            silently finding nothing.
         2. END CREDITS IN CLASSIC VIEW, in the text stream — where the book was,
            because that is what just ended. v3.12.2 put a link in the stats modal,
            which is the wrong surface: the modal is a stats card that lives in the
            keyboard area. Title, author, source, licence, who prepared the text,
            then links to the book's own notice pages and back to the library.
            ⚠️ NOT a duplicate of index.html's About panel: that renders the stored
            notice PAGES (a subcollection read each), this is the one-line
            attribution already on the book document, which costs nothing.
         3. bookComplete now carries the credit fields, so the renderer can scroll
            its own version over the canvas without a second Firestore read.
            Adventure's scrolling credits are NOT built — that is canvas animation
            and it needs eyes on it running.

         ⚠️ creditLine() shipped with the SAME injection hole index.html's
         linkifyText() had already been fixed for: \S+ for the URL, and
         escapeHtmlG() is DOM-based so it does not escape quotes. A licence value
         carrying `https://x.test/"onmouseover="alert(1)` closed the href early. The
         second time in one round, which is the argument for the test that caught it
         rather than for trying harder to remember.

#### v3.12.4

Round 5 (Mignon). Both found by the overwrite test — which is the whole argument for
running it.

         1. furthestChapter WAS NEVER VALIDATED. v3.12.1 checked the CURRENT chapter
            against the book and left the furthest one alone, so after the fixture
            was re-imported with part numbering the start screen still offered
            "Jump to furthest point (Ch. 2)" against a book whose chapters are 1.01
            and 2.01 — and clicking it produced "Chapter 2 not found. Returning to
            the start of the book." Precisely the dead end v3.12.1's own note said it
            existed to prevent, one variable over. FORGOTTEN rather than clamped: an
            id that no longer exists is not evidence of how far anyone got, and
            snapping to a nearest match would silently move a student's record.
         2. A PART-NUMBERED BOOK RESTARTS ITS CHAPTER NUMBERS, and the picker's label
            logic prefers the title whenever it begins with "chapter" — discarding
            the id that would have told them apart. Heidi listed "Chapter 1" through
            "Chapter 14" and then "Chapter 1" through "Chapter 9" again. Treasure
            Island, Little Women and The War of the Worlds are the same shape. Jake
            hit it on the two-chapter fixture, where the Game Genie showed
            "Chapter 1" twice with no way to tell which was which. Now prefixed
            "Pt N ·", when and only when the book actually has parts, so a novel's
            picker is untouched.

         ⚠️ v3.12.3 shipped WITHOUT ITS VERSION BUMP — the CHANGELOG said 3.12.3
         while the file still said 3.12.2. Recorded here rather than quietly folded
         in, because that exact drift is what this round has spent most of its time
         catching in other people's work, and exempting myself would be worse than
         the mistake.

#### v3.12.3

Round 5 (Mignon). The chapter-count label had TWO sites and v3.10.0 only fixed one.
The condensed bar was switched to the body count; the uncondensed path still printed
every spine document, so a two-chapter book advertised "10 ch".

#### v3.12.2

Round 5 (Mignon). Two things, both from Jake testing on a real screen.

         1. THE ADVENTURE MAP DREW A DOT PER SPINE DOCUMENT. It was handed
            bookMetadata.chapters, so the title page, imprint, dedication, appendix,
            endnotes, colophon and uncopyright page were all stops on the journey.
            On the two-chapter fixture that is TEN dots for TWO chapters with the
            real ones fourth and fifth — the "funky map on the right". On a Standard
            Ebook it means every journey ends several dots past the end of the story.
            Body list only. `num` stays the real chapter id, not an ordinal, because
            the renderer matches completedChapters against it.
         2. FINISHING A BOOK NOW LOOKS LIKE FINISHING A BOOK. v3.12.0 made the event
            exist; this makes it feel like one. Names the book, and links to its
            credits at index.html#about=<bookId> — which is the honest place for
            them: someone who has just typed every word of a book is precisely who
            should get to see who made it. showStatsModal() gained an optional
            seventh parameter for the block, rather than abusing the hint slot, which
            starts display:none and is revealed conditionally. Optional and
            defaulted, so the five existing callers are untouched.

         ⚠️ Investigated and NOT a bug: Jake was signed out mid-chapter. signOut() is
         called from exactly one place in this file — the logout button's click
         handler. Nothing in any error path touches it. The WAL did its job: signing
         back in restored his position. Most likely a Google session expiry.

#### v3.12.1

Round 5 (Mignon). **The first chapter is not always called "1."** Found by Jake's
blank typing page on the parts test fixture, and it is far older and wider than
that fixture.

         Opening a book with no saved progress hardcoded `currentChapterNum = 1`
         and called `loadChapter(1)`. A part-numbered book's first chapter is
         "1.01", so chapter_1 does not exist: "Book content not found", or in
         Adventure mode a blank page with a stick figure and no text.

         ⚠️ NOT INTRODUCED BY THE FIXTURE. This has been true for **Heidi, Treasure
         Island, Little Women and The War of the Worlds** since part numbering
         shipped in admin.js v3.14.0. Any student opening one of those four for the
         first time got a blank book. It stayed invisible because those four were
         only ever opened by an account that already had progress stored, which
         supplied a real id and bypassed the default.

         Sixth appearance of "the id is not a number" in this project. Five sites,
         plus loadChapter()'s own not-found recovery, which ALSO went to "1" and was
         therefore a dead end on exactly the books that needed it — reporting "Book
         content not found" about a book whose content was fine. And the error
         screen's "Go to Chapter 1" button, same assumption.

         Stored progress is now VALIDATED against the book's body list, and falls
         back to the first real chapter with a console warning if the id has gone.
         That is the protection Fix C's renumbering needs: a student whose progress
         points at Toby Tyler's old chapter_22 lands at the start instead of nowhere.

#### v3.12.0

Round 5 (Mignon). Found because Jake asked whether he still has to delete front
matter. He does not — but only after this, because v3.11.0 was half a fix.

         1. AUTO-ADVANCE WALKED THE FULL SPINE. v3.11.0 filtered the chapter
            PICKER and left both "next chapter" paths iterating
            bookMetadata.chapters. That is worse than not filtering at all: the
            picker told a student the colophon was not a chapter, and then the
            Continue button handed it to them. Finishing the last chapter of a
            Standard Ebook offered the colophon, then the uncopyright page. Both
            sites now walk bodyChapterList().
         2. TWO MORE parseFloat-ON-AN-ID FALLBACKS, the fourth and fifth instances
            in the project. `parseFloat(currentChapterNum) + 1` turned Heidi's
            "1.14" into a request for "2.14" — nonexistent — and "1.01" into
            "2.01", which exists and is in the WRONG PART. Finishing Augie's
            chapter 19 offered "Ch. 20". Gone; the recovery path uses the first
            real id in the body list instead of assuming numbering.
         3. FINISHING A BOOK IS NOW A THING THAT HAPPENS. With the arithmetic
            removed, a null next-chapter MEANS something: there is no next body
            chapter, so the story is over. Shows the chapter stats with "That was
            the last chapter — you finished the book." This is the completion
            moment admin.js has been writing bodyChapters for since v3.18.x and
            which had never had a consumer — because the old code invented a
            chapter number rather than noticing, so a student who finished a book
            got an error instead of a congratulation. Judged on the BODY list, so
            an appendix, endnotes, a colophon and an uncopyright page no longer
            stand between a kid and the end of the story.

#### v3.11.0

Round 5 (Mignon). The student chapter picker offers **body chapters only**.

         buildChapterOptions() listed every document in the spine, so "Ch. 0.2" —
         the imprint, the copyright page, the colophon — sat in the picker as
         something to type. Which made deleting front matter on import the only
         safe workflow, and THAT deleted the copyright notice a Creative Commons
         licence requires be kept intact. A UI default was quietly setting a legal
         constraint.

         Front and back matter now stay in the book, where the notice belongs, and
         never reach a student. If a preface or an author's introduction IS worth
         typing — §B.7's point, and Baum's introduction is a real instance — flip it
         to Body with the button added in admin.js v3.19.0. One switch, one meaning:
         body means typeable.

#### v3.10.0

Round 5 (Mignon). **Stop doing arithmetic on chapter ids.** Requested as "the
part-id renumber sites outside admin.js" — there were none of those, but there
were four parseInt()-on-an-id sites in this file, which is the same disease.

         An id is a LABEL. Part-numbered books use ids like "1.14" (Heidi,
         Treasure Island, Little Women, The War of the Worlds) and
         parseInt("1.14") is 1. Consequences, all on the book progress bar:

         1. Every one of Heidi's fourteen part-one chapters was labelled "1" and
            all nine part-two chapters "2".
         2. bookProgressFraction() found the current chapter with
            `parseInt(c.id) === parseInt(currentChapterNum)`. Since
            parseInt("1.01") === parseInt("1.14"), findIndex() returned the FIRST
            chapter of the part, so the position marker never left the start of
            part one however far the student read.
         3. isCurrent/isPast were computed the same way, so THE WHOLE PART
            rendered as current simultaneously. Measured: reading chapter 1.14 lit
            14 segments as current. Now 1.
         4. The condensed-bar label counted every spine document, so Aesop
            advertised "290 ch" including the colophon and the uncopyright page.

         Position now comes from the chapter list by exact string match, via
         bodyChapterList() / bodyOrdinalMap(). Two fallbacks, because the data is
         not uniform: `matter` when admin.js v3.19.1+ wrote it, otherwise the ID
         CONVENTION from assignChapterIds (front 0.x, back 900.x). ⚠️ THAT SECOND
         FALLBACK IS LOAD-BEARING — without it a legacy document's front matter
         would count as body chapter 1 and shift every ordinal, which is worse
         than the bug being fixed. Verified: legacy and modern documents both
         yield 23 body chapters for Heidi with identical ordinals.

         The map is built once per render, not once per segment — Aesop has 284
         chapters and this is the loop the v3.6.0 audit already had to rescue.

         ALSO: the progress document now carries bodyIndex and bodyTotal. This is
         the only place with the chapter list loaded, and index.html strips that
         list before caching the grid, so those two integers are what let a CACHED
         library card place a part-numbered book. Same write, no extra billing,
         and neither field is written when the reader is in front matter — a
         made-up position is worse than none. Closes the known limitation logged
         against index.html v3.3.1.

         Verified with ordinal-test.mjs, which lifts the three helpers out of this
         file and runs them over a v3.19.1 document, a legacy document and a plain
         novel.

#### v3.9.3

Round 5 (Mignon). **Firefox's Quick Find no longer fires on every apostrophe.**

         The typing listener is bound to `document`, not to an input, so nothing
         absorbs a keystroke on our behalf — and only space, Tab and Enter were
         cancelled. Every other printable character was consumed by handleTyping()
         AND handed to the browser.

         Firefox still ships Quick Find, the type-ahead-find feature it inherited
         from Netscape: `/` opens Quick Find and `'` opens Quick Find (links only).
         Apostrophes are in every contraction and possessive, so a student typing
         "don't" or "Toby's" popped the find bar several times per paragraph.
         Chrome never implemented type-ahead find, which is exactly why this was
         invisible at school and broken on a home machine.

         `e.key.length === 1` catches every printable character while leaving named
         keys alone. ⚠️ The modifier guard is load-bearing — without it Ctrl+R,
         Ctrl+T and Cmd+Tab get swallowed and the kid is trapped in the tab.
         Backspace is included because handleTyping() consumes it and Firefox
         historically navigated BACK on it outside a text field.

#### v3.9.2

Round 5 (Mignon). Two defects in v3.9.0/v3.9.1's own audit work, both found
before either shipped. Neither file had been uploaded, so nothing in production
was ever affected.

         1. THE RE-ENTRANCY GUARD WAS `if`, NOT `while`. v3.9.0 added a guard
            to flushAll() to stop overlapping runs writing a duplicate
            typing_sessions rollup. It serialises TWO callers correctly and
            fails at three or more: when the running flush resolves, its
            `finally` nulls the slot, and every caller parked on that promise
            is already past the `if` — so they all claim the slot and their
            inner runs execute concurrently. Measured by lifting the shipping
            function into a harness: 6 simultaneous callers produced 5
            overlapping runs. `while` fixes it because the re-check after the
            await is synchronous with the assignment that follows, so the
            caller that leaves the loop claims the slot before any other
            caller can re-check. Four call sites (interval timer,
            visibilitychange, saveProgress(force), walRecover()) make
            three-deep reachable in ordinary use.
         2. THE SPRINT ROLLUP IS CHUNKED AT 200 SPRINTS PER DOCUMENT.
            firestore.rules v2.2.0 newly requires `sprints.size() <= 200` and
            `seconds <= 86400` on typing_sessions. Nothing on the client
            enforced either, and pendingSessions has no cap — walRecover()
            CONCATENATES a recovered log onto the live one. So one failed
            rollup could push the array past the ceiling, after which every
            write is denied, denial keeps the WAL, and the kept WAL is
            re-concatenated next session: a permanent, silent, self-feeding
            failure. Chunks advance out of pendingSessions one at a time and
            only after their write lands, so a mid-run failure keeps exactly
            the sprints not yet stored — verified for loss, duplication and
            cap compliance across eight scenarios including denial on the
            first and second chunk. `seconds` is also clamped as a backstop,
            with a console warning if it ever fires.
         ⚠️ SHIP THIS WITH firestore.rules v2.2.0. Rules 2.2.0 without this
         file introduces the poison pill described above; this file without
         rules 2.2.0 is harmless.

#### v3.9.1

         CHAPTER_CACHE_MS back to 7 days. v3.9.0 cut it to 12 hours because
         `contentVersion` — the field this cache invalidates on — was read here
         and written nowhere, making the expiry the only invalidation the cache
         had. admin.js 3.12.0 writes it, so seven days is now a ceiling for an
         unedited book rather than a floor on how long a correction takes.
         ⚠️ These two files are a pair. Rolling admin.js below 3.12.0
         reintroduces week-long stale chapters with no other symptom.

#### v3.9.0

Round 4 audit pass. Five changes, no new features.

         1. flushAll() RE-ENTRANCY GUARD. It was reachable from four places
            (interval timer, visibilitychange, saveProgress(force),
            walRecover()) and is async with four sequential awaits. Two
            overlapping runs both captured the same sessionsBeingWritten
            slice, both addDoc()'d it, and both then advanced the queue past
            it. The result was a DUPLICATE typing_sessions document, which
            double-counted minutes in the per-day sprint drill-down a teacher
            opens to check a student's work. typing_logs was unaffected — it
            is a merge, so it was always idempotent.
         2. HIDDEN-TAB FLUSH DEBOUNCED to once a minute. visibilitychange
            fires on every tab switch, not at session end, and each one was a
            full final flush: up to four Firestore writes plus a leaderboard
            write. The localStorage WAL write is free and still fires every
            time, which is the part that actually protects the work.
         3. PER-KEYSTROKE DOM WORK. highlightCurrentChar() ran
            document.querySelectorAll('.letter.active') — a full-document scan
            over ~8,000 spans — on every character, to find nothing, because
            handleTyping() had already cleared the class three lines earlier.
            It now tracks the element. centerView() read clientHeight and
            offsetTop right after a class mutation (forced synchronous layout,
            per character) and is now batched into one requestAnimationFrame
            with the container height cached until resize.
         4. CHAPTER CACHE TTL 7 days -> 12 hours. Not a tuning change: the
            comment claiming admin.html bumps `contentVersion` was false, so
            the expiry was the only invalidation this cache has ever had.
            Reverts to 7 days once admin.js actually writes the field.
         5. Leaderboard entries now carry classId / schoolId, written ahead of
            the queued scope toggle so it will not need a 7,000-document
            backfill. Nothing queries them yet. Still initials-only.

         Also: the comment claiming fetchLeaderboard() costs 40 reads was
         corrected to 60 (four categories at LB_FETCH_LIMIT 15), or 90 on the
         weekly fallback path.

#### v3.8.0

Tier 3. Two things, both small:

         STUDENT SCHOOL PICKER (§9 item 4). Until now a student's building was
         set only by staff, so a student nobody had added yet typed with
         schoolId:'' and was invisible to every building-scoped report — and
         there was no way for them to say where they were. Settings now has a
         School control. Never forced; "No school" stays a valid permanent
         state, which is the point (Jake's son isn't in a building).
         ⚠️ It is READ-ONLY once a teacher has put them in a class. A student
         must not be able to overrule their teacher, and making the teacher's
         assignment win means the picker self-corrects the moment one happens.
         PRACTICE GATING now tells the truth (§A.10). The cooldown counter
         only advances while you TYPE, which the old wording never said, and
         it rounded 5 seconds up to "~1m". The daily cap is also checked
         before the button is offered rather than after a failed round-trip.

#### v3.7.0

Chapter picker survives a 286-chapter book. A <select> with 286

         options and no search means finding "The Donkey and the Lapdog"
         is a scroll, not a lookup. Above CHAPTER_FILTER_MIN the picker gains
         a filter box matching chapter number or title, with Enter as Go.
         Also collapses THREE divergent copies of the chapter-option builder
         into buildChapterOptions(). They had already drifted — the settings
         list showed "✓ Ch. 4: Title" while the post-book-switch rebuild of
         the SAME dropdown showed "Chapter 4: Title" with no completion
         ticks, so switching books silently changed the labels.

#### v3.6.0

Book progress bar survives a 286-chapter book. Aesop's Fables was the

         first book to exceed ~40 chapters and it broke the bar two ways:
         VISUALLY, each chapter got 1/286th of a ~280px strip — under one pixel,
         with a 1px divider inside it, so the whole bar rendered as a grey
         hairline smear (confirmed by screenshot).
         And far worse, PER KEYSTROKE: the bar built 5 DOM nodes per chapter
         (~1,430 for Aesop) and updateProgressBars() then did FOUR
         getElementById calls per chapter on every character typed — 1,144 DOM
         lookups per keystroke, on Chromebooks. That is a typing-latency bug
         wearing a cosmetic bug's clothing.
         Above BOOK_BAR_MAX_SEGMENTS the bar now renders condensed: one track,
         one fill, one marker, three nodes total and three lookups per
         keystroke regardless of chapter count. The label carries the
         information the segments used to ("Ch 12 / 286").

#### v3.5.0

Adventure Mode leaves alpha. Three changes, one feature:

         1. FIRST-RUN SPLASH. A student who has never chosen a view gets a
            full-screen picker with an animated preview of each mode before
            they type a character. Adventure was previously reachable only
            through Settings → View, which most students never opened, so the
            mode with the better engagement numbers was the hidden one.
         2. THE CHOICE FOLLOWS THE STUDENT. viewMode now lives in
            users/{uid}/profile/info alongside initials, and is read as part
            of the SAME getDoc() that already loads initials — no extra reads.
            localStorage stays as the pre-auth fast path so the correct view
            paints before Firestore answers, and is reconciled after.
         3. HOT SWAP, NO RELOAD. applyViewMode() mounts/unmounts the renderer
            and replays textLoaded + positionSet into it. The old settings
            toggle called location.reload(), which was acceptable for a
            deliberate settings change but not for "you sat down at a
            different Chromebook and we noticed".
         Also: document.title driven from VERSION (open work §9 item 5);
         "(alpha)" removed from the Settings label.

#### v3.4.2

practice_sessions now also carries classId/schoolId. Without them the

         collection was unscopeable in security rules, so its read rule had to
         be "any staff member, any district" — and those documents contain
         email, displayName, and the full generated paragraph.

#### v3.4.1

practice_sessions now writes an expiresAt TTL field. It was the one

         append-only collection still growing without bound; typing_sessions
         got one in v3.4.0 and this was missed. TTL policies for both are in
         firestore.indexes.json fieldOverrides.

#### v3.4.0

Write reduction. saveProgress() used to fire on every '.', '!', '?'

         and newline, writing THREE documents each time (~236,000 writes/day
         at 7,000 students against a 20,000/day free tier).
         Replaced with a localStorage write-ahead log plus a coalesced flush:
           - every sentence still records EVERYTHING, synchronously, locally
           - Firestore gets a batched flush every 5 min and on session end
           - walRecover() replays unflushed work on next load
         This is MORE durable than what it replaced, not less. The old code
         lost everything since the last punctuation mark if the tab died; the
         WAL loses nothing. Student position, time, speed and accuracy are all
         still tracked and still resume exactly where they left off.
         Also:
           - progress + completedChapters merged into one document (was two
             writes to the same doc)
           - typing_sessions: one rollup doc per session with a sprints[]
             array instead of one doc per sprint, plus an expiresAt TTL field
           - chapter text cached in localStorage (biggest per-load read)
           - goals/class/school cached for a day (was 2-3 reads every load)
           - chapter advance does one write instead of two
           - classId/schoolId stamped on typing_logs and typing_sessions so
             reports can be scoped by class or building. See MULTITENANCY.md.

#### v3.3.0

Leaderboard scale rework. The old fetchLeaderboard() read EVERY

         document in the leaderboard collection to build four top-10 lists,
         and updateLeaderboard() busted its own cache before calling it on
         every sprint end. At 7,000 students that projected to ~327M reads
         and ~82GB egress per day. Now:
           - four indexed orderBy+limit(10) queries: 40 reads, not 7,001
           - cache is 10 minutes and is NOT busted on the hot path
           - placements computed locally against cached threshold values,
             so a normal sprint costs zero reads
         - own leaderboard doc read once per session, not once per sprint
         - writes coalesced to >=120s apart (or immediately on a new PB),
           flushed on visibilitychange:hidden
         - displayName no longer stored on leaderboard docs. It was written
           but never read; the UI shows initials. Real names for the admin
           panel still live in typing_logs / typing_sessions, untouched.
         Needs ONE composite index (weekly board). Falls back gracefully
         while it builds — see fetchLeaderboard().

#### v3.2.0

Per-mistake corrections: mistakes at the current letter accumulate

         (deepening red shade in classic view) and each backspace undoes
         exactly one — the cursor doesn't move back until all mistakes at
         the letter are undone, just like deleting real typed characters.
         New ttb:backspaceUndo event drives the adventure tilt-back.

#### v3.1.1

textLoaded emit carries chapters + completedChapters for the

         adventure chapter map (null chapters in practice mode)

#### v3.1.0

Leaderboard hardening: WPM sanity clamp (impossible speeds were being

         recorded), admin per-entry reset buttons, Accuracy category removed;
         400ms grace period on chapter-complete any-key advance; stale
         sprint/hard-stop state cleared on every chapter load; dead
         practice-restore variable removed

#### v3.0.7

Game Genie warps emit positionSet (adventure canvas was desyncing);

         hard-stop modal escapes the resume key before innerHTML injection

#### v3.0.6

Daily timer renders correctly on page load (was stuck at 00:00 until first keystroke)

#### v3.0.5

Chapter-end modal accepts Enter/Space; Day timer shows secondsToday;

         drop redundant colon between timer label and value

#### v3.0.4

Sentence-rollback on hard-stop only fires in adventure mode

#### v3.0.3

Hard-stop modal asks for sentence-start letter; spam threshold = 3

#### v3.0.2

Hard-stop rolls cursor back to start of current sentence

#### v3.0.1

Adventure Mode integration; cross-file version banner

---

## `adventure-renderer.js`

Current: **v1.5.4**

#### v1.5.4

Round 7 (Hammond). Adventure end-credits row label `Licence` → `License`. Cosmetic
only; `RENDERER_VERSION` bumped in step with the header, per §2.3 — that constant is
the one copy `versions.js` actually reads.

         ⚠️ **GAP: v1.4.1 — v1.5.3 are not recorded here.** `Current:` read **v1.4.0**
         while the shipped file was v1.5.3. Not reconstructed, for the reason given in
         the `admin.js` gap note.

#### v1.4.0

Round 6 (Noiseless). **End-of-book credits for Adventure — closing a dangling event,
not adding a nicety.**

         `game.js` has emitted `ttb:bookComplete` with the full credit payload since
         v3.13.0, and nothing listened: one emit, zero listeners in the entire repo.
         `game.js` also reads `if (VIEW_MODE !== 'adventure') renderClassicCredits()`
         — so Adventure was deliberately opted out of the DOM credits in favour of a
         canvas version that was never written. A student finishing a book in
         Adventure saw no credits at all. The library is CC-licensed and attribution
         is a licence term, so this was a compliance gap wearing the costume of a
         missing feature.

         Content mirrors `renderClassicCredits()` field for field — By / Source /
         Licence / Text prepared by, in that order, plus the chapter count. Two views
         of one book should not credit it differently, and an absent field is dropped
         rather than credited blank. A book with no metadata says so in words instead
         of scrolling an empty reel.

         **The geometry is three pure exported functions, and it is tested.** Two
         earlier rounds declined this work because canvas animation cannot be watched
         from a session like this. That is true of APPEARANCE and false of POSITION
         OVER TIME — the same distinction v1.3.0's condensed-map bug had been hiding
         behind. `creditsContent()`, `layoutCredits()` and `creditsScroll()` take
         injected text measurement and no canvas, and `credits-scroll-test.mjs`
         asserts 3 viewport heights against 4 book shapes: nothing visible at t=0,
         monotonic motion, every row fully visible at some point, the last row
         resting on screen, no row exceeding the wrap width, and a watchable duration.
         It **holds** at rest rather than scrolling away, so a student who looks up
         late still finds the attribution.

         The draw call is wrapped in try/catch and clears itself on failure. It runs
         inside the requestAnimationFrame loop, where an exception would stop the loop
         and freeze the whole canvas — figure, terrain, map — over a decorative
         feature. Also cleared on `ttb:textLoaded`, so opening another book does not
         leave the last one's credits pasted over live typing.

         ⚠️ **What is NOT verified: how it looks.** Fonts, colours, and whether the
         parchment wash sits well over the terrain need one human look. `#modal` is a
         329px bottom panel rather than a full-screen overlay, so the reel is visible
         behind the completion stats — the same relationship Classic's credits already
         have with that modal.


#### v1.3.0

Round 6 (Noiseless). **Condensed map (>40 chapters): two bugs, both invisible on the
book they were tested against.**

         `frac` read `curIdx / n`. First, it ignored within-chapter progress, so the
         "you are here" marker froze for an entire chapter and then jumped — while
         the DOTTED map inks the current chapter to `progress` and creeps smoothly.
         Second, it disagreed with the dotted map by a whole chapter: v1.2.0 fixed
         the denominator to n but left the numerator alone, so dotY placed the marker
         at (i+1)/n (the END of the current chapter) and this placed it at i/n (the
         START). Crossing the 40-chapter threshold moved the marker backwards.

         On Aesop's 284 fables a chapter is 0.35% of the strip and neither is
         noticeable. On a 41-chapter book — one past the condensing threshold — it is
         2.4% of a 500px strip, so the marker is stuck for ~12px of travel while the
         student works. Now `(curIdx + progress) / n`, which at progress = 1 equals
         dotY(curIdx) exactly. Asserted numerically in map-geometry-test.mjs at 41,
         60 and 284 chapters — canvas geometry is arithmetic, so it is testable
         without watching it run.


#### v1.2.0

Round 5 (Mignon), with a correction in Round 6 (Noiseless).

⚠️ **This version shipped with RENDERER_VERSION still reading `'1.1.0'`.** The
code, this entry and the file's header comment were all v1.2.0; only the runtime
constant disagreed — and that constant is the one copy versions.js reads, so the
build panel would have reported 1.1.0 for a correct deploy. Corrected in Round 6
with no change to the code; map-geometry-test.mjs passing against the v1.2.0
geometry is what established which of the two was lying.

**A dot marks the END of a chapter, not its start.**

         dotY was `top + span * i / (n - 1)`, which puts dot 0 at the very top. But
         segment i runs dot[i-1] → dot[i] and represents TYPING chapter i, so
         segment 0 had nowhere to go: from a 14-pixel stub above the top down to dot
         0, also at the top. Finishing the first chapter of a two-chapter book drew a
         14-pixel squiggle; finishing the second drew the entire height in one
         stroke. Jake's report was exact — "the squiggle at the top is all that the
         first chapter did, and the long straight line is from writing an entire tab
         key."

         `(i + 1) / n` gives every chapter an equal 1/n slice and puts the dots where
         a reader expects: finish 1 of 2 and you are halfway down. Measured across the
         real book sizes — 2, 12, 23, 34 and 284 chapters — first chapter lands at
         1/n and the last at 100% in every one.

         The condensed path (over MAP_MAX_DOTS chapters) divided by n-1 for the same
         reason; also fixed. Invisible on Aesop's 284, a whole chapter out on twelve.

         The `length < 2` guard became `< 1`: it only existed because the old formula
         divided by zero on a single chapter, and a one-chapter book deserves a route.

#### v1.1.0

Chapter map survives a 284-chapter book.

  Aesop's Fables put 284 dots at 4.2px radius down a ~500px strip — roughly
  1.8px of room each — so the map rendered as a solid brown caterpillar
  (confirmed by screenshot). Above MAP_MAX_DOTS the map now draws the route
  as a continuous inked line with sparse tick marks and only three dots that
  matter: start, finish, and where you are. The journey still reads; the
  clutter doesn't. Small books are untouched.

#### v1.0.0

OUT OF ALPHA. Adventure Mode is now offered to every student on a

  first-run splash (game.js >= 3.5.0) rather than hiding behind Settings →
  View, so the version number stops saying "prototype". No rendering changes.
  One behaviour change:
  - DIAGNOSTIC OVERLAY now needs Ctrl+Shift+` or Cmd+Shift+` instead of a
    bare backtick. Backtick is a real key in the virtual keyboard's numRow
    for both QWERTY and Dvorak, so any student could open the overlay by
    typing it — harmless (it's read-only, typing continues normally) but it
    covers part of the canvas and looks like a crash to a sixth grader.
    The modifier keeps it a one-keystroke teacher tool.

#### v0.4.0

Tilt-back corrections + chapter close-up strip:

  - TILT-BACK: each backspace at the current letter undoes exactly one
    mistake's worth of tilt (driven by the new ttb:backspaceUndo event
    from game.js >= 3.2.0) and marks the letter recovered (blue). Two
    mistakes need two backspaces to fully straighten — like deleting
    real typed characters. Tilts are now count-based (angle = kick ×
    mistakes remaining) instead of additive, and a fresh mistake on a
    recovered letter un-blues it.
  - CLOSE-UP: a left-edge strip mirrors classic view's chapter progress
    bar in map style — the current chapter as a vertical route, tiny
    pilcrow ticks at paragraph starts (inked once passed), a pulsing
    gold marker at the current position, and the route inking downward
    as you type. Right-edge book map dots and line slightly enlarged
    for legibility.

#### v0.3.0

Chapter map + pilcrow landing marks (minor bump: new feature):

  - CHAPTER MAP: an always-visible strip on the right edge of the canvas,
    Indiana-Jones style. Chapters are dots top-to-bottom; a wobbly
    hand-drawn red route line fills in as you type — the segment leading
    into the current chapter's dot creeps forward with currentPos, and
    completes with a gold burst on chapter finish (visible beside the
    stats modal). Completed dots are filled rubric red, the current dot
    glows with a pulsing ring and a "Ch N" label, upcoming dots are
    faded hollow rings. Requires game.js >= 3.1.1 (chapters +
    completedChapters in the textLoaded emit); hides itself otherwise.
  - PILCROW: every paragraph's leading tab gap now shows a faded rubric
    ¶ at letter height — the medieval manuscript paragraph mark, in the
    traditional red. The figure's big leap lands ON the pilcrow, then
    mini-hops onto the first word. Answers "what is he standing on?"
    with something period-correct.

#### v0.2.16

Indent mini-leap (no more tab teleport):

  - Typing across a wide within-paragraph gap (the tab indent) now
    triggers a short, low leap (250ms, small arc) using the same
    interpolation machinery as paragraph leaps. Before this, the figure's
    X snapped across the indent in one frame while the camera lerped to
    catch up — visible as a forward teleport right after the big jump.
  - Jump duration is now a field (jumpDurationMs) instead of a hardcoded
    600 in the loop, so big leaps and mini-leaps share one code path.
  - Chaining works both directions: a mini-leap triggered mid-big-leap
    (or vice versa) starts from the figure's current interpolated
    position, same as the v0.2.15 retrigger rule.

#### v0.2.15

Leap state hygiene (found in code review):

  - isJumping and leap anchors are now cancelled on fail, respawn,
    textLoaded, and positionSet. Before this, dying / respawning /
    switching chapters / Game-Genie-warping mid-leap left the loop
    driving cameraX/cameraY from stale leap interpolation for up to
    600ms, stomping the respawn/warp camera placement.
  - Mid-leap paragraph retrigger (consecutive short paragraphs, e.g.
    dialogue) now starts the new leap from the figure's CURRENT
    interpolated position instead of snapping back to the previous
    paragraph's end. _leapStartCameraY is also re-anchored on every
    trigger instead of keeping the first leap's stale value.

#### v0.2.14

Figure leap is no longer a teleport:

  - During a leap, the figure's coord X is interpolated from the OLD
    position (the period at the end of the previous paragraph) to the new
    position (the J at the start of the new paragraph) using the same
    smoothstep curve as the Y motion. CameraX is set directly off this
    interpolated value (no lerp during leap), keeping the figure perfectly
    anchored at 35% screen-X for the duration of the arc. Result: figure
    stays put visually while the world slides under it — the new
    paragraph "comes to meet" the figure as Jake described.
  - Before this, currentPos jumped to the new paragraph's start in one
    keystroke, which meant the figure rendered ~80px to the right of
    anchor for one frame, then lerped back over ~14 frames. Visible as
    a single-frame teleport in slow-motion video capture.

#### v0.2.13

Defensive transform reset + better diagnostics.

#### v0.2.8

Persistent tilts + (broken) backspace recovery via positionSet.

#### v0.2.7

Underscore-style cursor gap + keyboard skin shim:

  - Cursor-gap red bridge line drops to LETTER BASELINE (like an underscore).
    Space label below the line; tab/enter labels above.
  - Keyboard re-tinted to muted vintage finger colors via MutationObserver
    shim. keyboard.js untouched; classic view bit-for-bit unchanged.
  - Death cleans falling-letter and tilt state so the respawn sentence
    displays cleanly. (Already mostly working in v0.2.5; locking it down.)

#### v0.2.6

Letters become walkable surface, gaps render only at cursor.

#### v0.2.5

Connector line in gap only, letter tilt on stumble, letters fall

  on plummet, head-rolling ghost, leap arc clears next paragraph.

#### v0.2.4

Diagnostic overlay + stumble/plummet split + curly-quote flip +

  platform line below words.

#### v0.2.3

Integration of Gemini's refined animation block (gait, hop, leap,

  stumble, respawn, three ghost styles). X-eyes only on actual ghosts.

v0.2.2 bugfixes:
  - Respawn detritus: paragraph crossings now rebuild via
    _relayoutCurrentWorld instead of appending forever.
  - Preview paragraph fades to ~30% alpha and loses its platform underline.
  - Tabs render distinctly: wider gap, italic "tab" label.
  - Gravestone inscription: each grave displays the failed letter.
  - Space pit drops below the platform line so the figure visibly hops.

v0.2.1 bugfixes:
  - Per-letter rendering with active-cursor highlight.
  - Bigger text (32px).
  - "space" italic label restored.
  - Curly-quote fix: ctx.fontKerning = 'none'.

Observer of TTB events. Listens to ttb:* CustomEvents on document and renders
the typing experience as a stick figure walking across word-platforms with
a parchment aesthetic. Owns no game logic. Reads no game state directly.
All it knows is what game.js tells it via events.

Mounted by game.js when the user has selected Adventure view. Unmounted
(canvas hidden, listeners removed) when they switch back to Classic.

Events consumed:
  ttb:textLoaded   { fullText, chapterTitle }       — new chapter ready
  ttb:textCleared  {}                                — chapter unloading
  ttb:positionSet  { position, isResume }            — cursor jumped (resume, fail, etc)
  ttb:keystroke    { char, correct, position, expected, status }
  ttb:fail         { reason, position }              — hard stop / spam / afk
  ttb:respawn      { position }                      — resume after pause
  ttb:stats        { wpm, accuracy, ... }            — periodic stats update
  ttb:complete     {}                                — chapter finished

Event source: document.addEventListener('ttb:keystroke', ...). The renderer
never reads from window.* / DOM ids it doesn't own / globals.

Design rules:
  - Canvas-only DOM mutation. The renderer never touches #text-stream,
    #virtual-keyboard, the modal, or any classic-view element.
  - Idempotent mount/unmount. Calling mount twice is safe; unmount removes
    all listeners.
  - Survives missed events. If textLoaded was missed, the renderer just
    shows nothing until the next one arrives.

---

## `admin.js`

Current: **v3.38.0**

⚠️ **v3.32.0–v3.35.0 are written up in the file's own header, not here.** They are
not lost and they are not reconstructed below — an invented summary of someone
else's change is worse than a pointer to the real one.

#### v3.36.0 – v3.38.0 — Round 56 (Munson)

**Genre list.** Drama added; Classic Literature, Historical Fiction and Young Adult
retired at Jake's request. ⚠️ The two `SUBJECT_TO_GENRE` rows pointing at retired
genres went in the same edit: `guessGenre()`'s result is written through
`writeSelectOrCustom()`, which PRESERVES an unknown value in Custom…, so leaving
them would have re-created the retired genres on import one book at a time.
⚠⚠ This retags nothing — the student library's genre pills are built from the
books, not from `GENRES`.

**Contributor fallback.** A book with no `dc:creator` at all now falls back to the
first `dc:contributor`, so a compiler-led anthology (English Fairy Tales, credited
to Joseph Jacobs as a contributor) stops importing with a blank author.
⚠⚠ **Three separate places read `dc:creator` and all three needed it.** The third,
`bookMetaAuthor`, is not about attribution at all — it feeds
`looksLikeLeadingMatter()`, so a blank author means the Gutenberg title page is no
longer recognised as front matter and gets imported as chapter one.
⚠️ `preparedBy` now refuses a contributor already promoted to author, or the page
reads "By Joseph Jacobs / Prepared by Joseph Jacobs".

**ROADMAP 46 — uploaded-by provenance.** Stamped from the signed-in uid on CREATE
only and rendered read-only. ⚠️ An overwrite does not restamp, or the field answers
"who touched it last". ⚠️ The uid is stored, not a name — names go stale; the
staff document is resolved at display time and cached. ⚠️ A book with no stamp
reads "added before this was recorded" and **is never guessed as Jake**: a guessed
provenance stamp is indistinguishable from a recorded one afterwards.

⚠️ **v3.31.0's header entry was archived out to hold the 8-entry budget.** Unlike
v3.30.0 it was already written up below, so nothing needed recovering.

⚠️ **This section skips v3.29.0.** It shipped in the file but was never written up
here. Round 9 did not reconstruct it — filing an invented summary of someone else's
change is worse than an acknowledged gap.

⚠️ **v3.30.0 was recovered here, not reconstructed.** It was archived out of
`admin.js`'s header to hold the 8-entry budget when v3.36.0 was added, and the text
below is that entry verbatim rather than a summary of it — the gap this section used
to acknowledge is closed by moving the original, which is the only way to close one
honestly.

#### v3.30.0

⚠️ **CLASSROOM-DEDICATION MACHINERY REMOVED AT JAKE'S REQUEST.** v3.27.0 tied a
licence change to a notice on the title page, and v3.29.0 added a button to write that
notice. Two halves that looked like one feature and were not: the gap flag read the
License FIELD while its name pointed at the title-page TEXT, so adding the line never
cleared the dot and there was no way to tell that from a bug. Gone: `runDedication()`,
`CLASSROOM_NOTICE`, `DEDICATION_TEXT`, the classroom argument to
`canonicalRightsFrom()`, and the gap flag. KEPT: the v3.26.0 source/licence mapping,
the combined PD & CC0 option (pick it by hand), Gutenberg origin, Prepared by, and the
v3.28.0 genre data-loss fix.

#### v3.31.0

Round 9 (Corona). **Cover images were the single biggest cost in the project, and no
round had ever looked at them.**

         SCALE-PLAN.md spent three rounds on Firestore reads and writes — tens of dollars
         a year at full district scale — while Cloud Storage egress, the only line that
         could reach three figures, was not in the document at all.

         Covers were uploaded **exactly as extracted from the EPUB** with **no
         `Cache-Control` header**. Measured over the 24 EPUBs in `library/`: **mean 308 KB,
         max 942 KB** (Heidi), Standard Ebooks emitting a uniform 1400×2100. The library
         grid renders them into `minmax(180px, 1fr)` at `aspect-ratio: 2/3` — a ~360px
         slot on a 2× display. Everything past ~500px wide was billed and then thrown away
         by the browser's scaler.

         New `downscaleCover()`: canvas re-encode to fit **500×800, JPEG q0.82**,
         composited **onto white** so a transparent PNG source cannot flatten onto JPEG's
         implicit black. `uploadCover()` now also sets **`cacheControl: 'public,
         max-age=2592000'`**.

         **Measured: 7.22 MB → 1.56 MB across all 24 covers, 4.6× smaller, −78%.** Mean
         308 KB → 67 KB. That takes worst-case egress from ~206 GB/month to ~45 GB against
         a 100 GB/month free allowance — **under the free tier on downscaling alone**,
         with the cache header as margin on top.

         ⚠️ **It never blocks an upload.** Every failure path — object URL, decode error,
         10-second timeout, canvas exception, `toBlob` returning null — resolves with the
         **original blob**. A full-size cover costs a fraction of a cent; a cover that
         fails to upload costs Jake an afternoon. It also keeps the original when the
         re-encode comes out larger, which already-optimised small PNGs sometimes do.

         ⚠️ **30 days is safe despite the fixed path** (`covers/{bookId}`, overwritten in
         place) because clients never request that path — they request the download URL,
         and `uploadBytes` mints a **new download token on every upload**. A replaced cover
         has a URL no cache can match.

         `coverSizeNote()` puts the saving in the admin status line (`308 KB → 67 KB,
         −78%`) at both call sites. **This is how you tell a working downscale from a
         silent fallback** — covers uploading with no size note mean the canvas path is
         failing.

         ⚠️ **Applies to covers uploaded from now on.** Existing covers keep their size
         and missing header until re-uploaded. No migration, and none needed — the library
         grows continuously so the mix shifts on its own.

         See SCALE-PLAN.md v1.4.0 § Problem 6.

#### v3.28.0

Round 7 (Hammond). **The genre dropdown had no "Custom…" option, and the missing option
was quietly erasing data.**

         Reported by Jake with a screenshot: *"We lost custom genre — a category that so
         far has only included sports."* ⚠️ **Verified byte-identical to the original zip
         before anything else — this was not introduced in Round 7.** The population block
         appended `GENRES` and nothing else, so the `__custom__` value that **three
         separate handlers** tested for could never occur:

         1. the population block's own `genreSelect.onchange`
         2. a **second, duplicate** `change` listener ~3,000 lines further down
         3. `readGenreField()`

         All three dead, and `custom-genre-input` unreachable. Which is why Sports —
         entered once by hand, back when Custom presumably worked — had no way back into
         the list.

         **The data loss.** The load path was `genreSelect.value = meta.genre || ""`. A
         stored genre with no matching option sets `selectedIndex` to `-1`; reading
         `.value` back then returns `''`; `readGenreField()` returns that; and
         `readBookMetadataForm()` writes `genre: ''`. **So opening a Sports book and
         pressing Save Metadata erased its genre.** Proven in jsdom against the shipped
         option list before any fix was written — `Sports` and `Sword & Sorcery` both read
         back as `''`, `Adventure` survived.

         ⚠️ **This was urgent rather than merely old.** v3.27.0's `dedication` flag exists
         to send Jake through every already-cleaned book pressing exactly that button, so
         a latent bug from an earlier round was about to be triggered deliberately, once
         per Sports title.

         **The fix.** Genre becomes the FOURTH field on
         `readSelectOrCustom`/`writeSelectOrCustom`/`wireCustomSelect`, alongside source,
         rights and cleanedBy. `readSelectOrCustom`'s own comment says it was *"generalised
         from readGenreField()"* in v3.21.0 — this finishes that migration rather than
         leaving the original behind as a fourth parallel implementation. Both duplicate
         change listeners are gone, the custom input is renamed `active-book-genre-custom`
         to match the shared convention, and both form-clear blocks use
         `writeSelectOrCustom(id, '')` instead of `.value = ''`, which on a select+custom
         pair leaves the custom box visible holding the previous book's text.

         `Sports` restored to `GENRES`, between Short Stories and Thriller.

         ⚠️ **A leading blank option ("— Not tagged —") is part of the fix, not tidiness.**
         Without one, a fresh form defaults to `selectedIndex` 0 — *Adventure* — so the
         autofill's `!genreSelect.value` guard saw a truthy value and declined to fill the
         genre it had just guessed from `dc:subject`. That is the same symptom v3.23.0
         attributed to leftover state from the previous book (*"the Flat Edition came out
         tagged Adventure when its dc:subject says Humor"*). Leftover state was real and
         was fixed; **a fresh page produced the identical result by a different route**,
         and that half went unnoticed because the two are indistinguishable on screen.

         `metadata-map-test.mjs` v1.2.0 walks the shipped population code and asserts
         load → save round-trips for on-list genres, Sports, two off-list values and the
         empty case, plus that an off-list value routes through Custom… with the box
         visible and that clearing leaves no residue.

#### v3.27.0

Round 7 (Hammond). **A classroom edition is not a public-domain-only text, and the
licence field was saying it was.**

         Jake, on the cleaning passes another Claude instance is running across the whole
         library: *"I probably need to license that with CC0 or whatever it is that
         standard ebooks does."* Correct, and the reasoning matters more than the change.
         You cannot CC0 the public-domain source text — there is nothing there to
         license. What exists to license is **the editorial contribution**: the specific
         rewording choices. That is precisely why Standard Ebooks' rights statement has
         two halves, and it is why `Public domain (United States) & CC0 1.0` — the option
         added in v3.26.0 — is already the correct value for a cleaned book. **No new
         licence option was needed.**

         The real consequence is narrower and easy to miss: **cleaning a book changes its
         correct licence, but only for some books.** A Standard Ebooks book already
         carries the combined value, because SE dedicated its own contributions. A raw
         Gutenberg book carries `Public domain (United States)` — accurate until the
         moment somebody rewords it, at which point there are contributions the value
         does not account for, and nobody downstream can tell whether they may reuse the
         reworded text. So a cleaned Gutenberg book must move to the combined value.

         `canonicalRightsFrom()` takes an optional `{ classroom: true }` and upgrades a
         public-domain-only result. ⚠️ **It never touches a CC BY licence** — those terms
         belong to somebody else and cannot be dedicated away — and it still refuses to
         map anything it cannot name.

         **Detection.** `readGutenbergOrigin()` became `readInBookSignals()`: ONE spine
         walk, capped at four entries, collecting three things — the classroom notice on
         the title page, Gutenberg's canonical origin link, and Gutenberg's `Credits` row.
         Previously the walk was gated to Gutenberg books to spare the 17 SE imports;
         classroom detection applies to every book, so the walk now runs for all of them.
         ⚠️ **Still a cap, not a search** — a 286-chapter book must never be walked for a
         notice that lives in the front matter or nowhere. `CLASSROOM_NOTICE` matches on
         the two phrases that carry the meaning rather than the whole sentence, which is
         written fresh per book.

         **New field: `Prepared by`**, autofilled from Gutenberg's `Credits` row (*"An
         Anonymous Volunteer and David Widger"*, *"E-text prepared by …"*), scoped to the
         machine header because the word "Credits" appears in plenty of book prose.
         ⚠️ **Deliberately distinct from `Cleaned up by`.** Prepared by is whoever produced
         the SOURCE text — Gutenberg's transcribers and proofreaders. Cleaned up by is
         whoever did our classroom pass. Conflating them would credit volunteers for edits
         they did not make and hide the edits behind their names.

         **`Cleaned up by` is now a select** (`Claude` / `Jake Wilson` / Custom…) rather
         than free text. It defaults to Claude rather than being parsed out of the notice
         on the title page: Jake — *"the reality is that it's always been Claude"* — so
         parsing prose to recover a value we already know is machinery that can only
         sometimes be right. ⚠️ Both form-clear blocks had to move it out of the
         `.value = ''` loop, because that picks the blank option and leaves the custom
         input visible and still holding the previous book's text, which then wins on save.

         **The book dropdown flags `dedication`**, at Jake's request, on any book with
         `cleanedBy` set whose `rights` omits CC0 — which is exactly the backlog of
         already-cleaned Gutenberg books. ⚠️ **This is a proxy and the code says so.**
         What it would ideally check is whether the title page carries the dedication
         sentence, and that text is not in the book record; checking it properly would
         mean fetching chapter text for every book on every render of the dropdown, which
         is real money against the project's first priority. The sentence and the licence
         get fixed in the same pass, so the flag tracks the work.

         ⚠️ **A third bug in Round 7's own code, caught by the harness again.** The
         already-canonical short-circuit added in v3.26.0 returned before the classroom
         upgrade could run — so a book already stored as `Public domain (United States)`
         and since cleaned stayed unchanged. **That is Jake's entire backlog**, i.e. the
         one case that had to work. `metadata-map-test.mjs` v1.1.0 asserts it, along with
         the CC BY non-relicensing, and end-to-end against a purpose-built cleaned EPUB.

#### v3.26.0

Round 7 (Hammond). **The Source and License autofills had never once produced a
correct value, and three separate mechanisms were keeping it that way.**

         Reported by Jake: "every standard ebook fills in as a custom field
         (gutenberg), as does gutenberg. License fills in with a whole paragraph
         rather than just saying public domain." Measured before touching anything, by
         dumping `dc:rights` / `dc:source` / `dc:publisher` / `dc:identifier` from all
         24 EPUBs in `library/`: exactly **two** matched a dropdown option, and both
         were the test fixtures written to match. Nothing was malfunctioning. The
         mapping layer between EPUB metadata and the option lists was never written.

         **Source — precedence backwards.** `meta.source || meta.publisher` read
         `dc:source` first, but for Standard Ebooks `dc:source` is the *upstream
         transcription* (`https://www.gutenberg.org/ebooks/345`) while `dc:publisher`
         is `Standard Ebooks`. 17 of 23 books therefore put a Gutenberg URL into a
         field labelled "who produced this edition". Raw Gutenberg books have no
         `dc:publisher` at all and hit the same path. Global Grey missed on one word:
         `dc:publisher` is `Global Grey ebooks`, the option is `Global Grey`.

         **License — no normalisation.** Standard Ebooks' `dc:rights` is a 90-word
         statement; Gutenberg's is `Public domain in the USA.`; the option reads
         `Public domain (United States)`. Zero exact matches.

         Both now route through `canonicalSourceFrom()` and `canonicalRightsFrom()`,
         which take the select's **own option values** as `allowed` and can only return
         something already in that list — so `admin.html` stays the single source of
         truth and no mapping can outlive the option it names. Source uses a two-pass
         split: pass 1 asks who produced *this* edition (`dc:publisher`,
         `dc:identifier`), and only if that is silent does pass 2 fall back to
         `dc:source`. Unrecognised licence text is preserved verbatim in Custom…
         rather than guessed at, because a licence we cannot name is the one most
         likely to carry terms. A CC BY licence whose version has no option (CC BY 3.0)
         deliberately refuses to map rather than rounding to 4.0 and writing a false
         claim into Firestore.

         **New option, at Jake's direction:** `Public domain (United States) & CC0
         1.0`. Standard Ebooks' statement asserts both — the source text is believed US
         public domain, *and* SE's own editorial contributions are dedicated CC0 — in
         that order, which is the order the rights arose. Neither half obliges anyone
         to credit anybody, so this is a courtesy, not a duty.

         **Two more defects in the same block.** `reportMetadataMismatches()` compared
         the form's canonical value against the file's **raw** value, so on a book
         already fixed by hand it reported a mismatch and offered a button that put the
         paragraph *back* — the one panel designed to look authoritative was arguing the
         wrong value in, once per re-import. And the v3.20.0 attribution warning had
         **never been visible**: it wrote to `#autofill-status` and the summary `say()`
         in the same synchronous block overwrote it microseconds later. Dead since the
         day it shipped. It was also wrong to fire, triggering on any non-empty
         `dc:rights` — which Standard Ebooks always populates, so ~20 public-domain
         books. `CC BY*` is the only family that obliges credit. Status is now composed
         once, at the end, from a `notes` list, so a warning cannot be swallowed.

         **Origin URL, closing §4.2.** Jake: "gutenberg already includes its origin
         link on its license page." It does, in a block Gutenberg marks up for machines
         — `<div id="pg-machine-header">`, row `Other information and formats` — and
         `stripBoilerplate()` has been **deleting it on every import**, because
         `#pg-header` is on its removal list. The link was in the file, parsed into a
         DOM, and discarded a few hundred milliseconds before Jake typed it by hand.
         Now read before the strip, gated to Gutenberg books only (the 17 SE books pay
         nothing) and capped at three spine entries, so a 286-chapter book is not walked
         for something that lives in the front matter or nowhere. Verified identical in
         structure across all three Gutenberg books including the `.txt`-derived one.
         Falls back to deriving the ebook number from `dc:identifier`; both paths
         normalise to `https://www.gutenberg.org/ebooks/<id>`. For non-Gutenberg books
         Origin URL is filled from `dc:identifier`, which is the edition's own page.

         **Two bugs in this change were found by its own harness, not by reading.**
         `metadata-map-test.mjs` failed on first run: (1) all 17 Standard Ebooks were
         getting a *Gutenberg* origin, because SE cites Gutenberg as its own upstream
         and the gate matched `dc:source` — the identical edition-vs-upstream
         distinction the source mapper gets right, got wrong in the origin reader in
         the same sitting; (2) the two test fixtures mis-mapped to the combined SE
         value, because `CC0 1.0 Public Domain Dedication` mentions both — but "Public
         Domain Dedication" is *part of CC0's own name*, not a separate claim about the
         text. Fixed by an already-canonical short-circuit and by stripping CC0's brand
         phrase before testing for an independent public-domain assertion.

         Also `licence` → `license` in every user-visible string. British noun spelling,
         which is not a typo but is the wrong register for a Tennessee classroom.
         Comments are left alone deliberately.

#### v3.25.3 — v3.24.3 (transcribed from `admin.js`'s header, Round 7)

         ⚠️ **These five entries existed ONLY as the file's own header comment**, which
         is space-budgeted and was about to lose the oldest of them to make room. Round 7
         copied them here verbatim rather than let that happen. They are abbreviated
         because the header is abbreviated — **the header was the only record, so this is
         a transcription, not a reconstruction.** Nothing was inferred or filled in.

         **v3.25.3** — ⚠️ An overwrite replaced a hand-sourced cover with no prompt. Jake
         found a real jacket photograph for a Hancock title, re-uploaded the Gutenberg
         EPUB for its metadata, and the parse staged Gutenberg's generic placeholder over
         it; Upload All then wrote that to Storage. The cover was the most hand-made field
         on the screen and the only one with no protection. A file's cover is now only
         staged when the book has NONE; otherwise it is offered in the mismatch panel with
         both images side by side.

         **v3.25.2** — ⚠️ Data-loss guard. The overwrite file input and the mismatch panel
         both survived a change of book, so Jane Eyre could sit selected with a football
         book still loaded in "Overwrite Data with New EPUB" — and Process Overwrite reads
         the input, not the book. One click would have replaced Jane Eyre's chapters. The
         stale panel was the visible, harmless half; the loaded file was the dangerous
         half and predates the panel entirely.

         **v3.25.1** — Roman numerals survive title casing: "CHAPTER XIX" was becoming
         "Chapter Xix", mangling the whole contents of every Roman-numbered book.
         `stripLeadingOrdinal()` misses these because it needs text to REMAIN after the
         numeral. Restored only when the title is structural or is nothing but a numeral,
         so "THE MIX" and "I AM BORN" are untouched. Second bug found the same way:
         `stripLeadingOrdinal`'s `[IVXLCDM]+` class matched WORDS built from numeral
         letters, so "DID IT MATTER" lost its first word. Now validated. Also: the title
         page now counts as About, because that is where Jake credits the classroom
         edition and who prepared it.

         **v3.25.0** — Overwrite now fills blank metadata from the new EPUB, and reports
         disagreements. `autofillFromEpub()` only ran on the new-book path, so re-uploading
         — the one moment the file is in hand — ignored it. For books imported before the
         licence/source/archive/cleanedBy fields existed that meant typing all of it by
         hand, once per book. Safe because autofill writes into EMPTY fields only. Where
         BOTH are filled and they differ (an author spelled "Nesbitt" in the form and
         "Nesbit" in the file), the difference is shown with a per-field accept button
         rather than either value winning silently. Compared loosely, so case and
         punctuation do not nag.

         **v3.24.3** — The parse summary carried the same lie v3.24.2 fixed in the audit
         panel: "No character issues or language warnings found" when `langIssues` was
         already filtered by the approved list. Now names the hidden approvals.
         `ARCHIVE_BASE_DEFAULT` → `https://typethatbook.misterwilson.org/library`.

#### v3.24.2

Round 6 (Noiseless). **"No flagged language found" was answering a different question
than the one it appeared to answer.**

         `scanForLanguageIssues()` silently drops any match on this book's approved
         list, so a book with every flag approved reports zero issues — and the
         zero-issues branch rendered a green tick reading "No flagged language found".
         That reads as "this text is clean". It is not the same claim.

         Found the honest way: Jake approved "queer" and "gaily" on a book whose upload
         then failed for an unrelated reason (v3.24.1), re-ran the audit on the next
         attempt, and got a clean bill of health on text he knew contained both. He
         reasonably assumed the approvals had been forgotten. They had not — they were
         in localStorage, doing precisely their job, invisibly.

         Compounding it: the approved-word list and its "Clear all" link were rendered
         ONLY in the has-issues branch. Once approvals suppressed every warning the
         state was both invisible and unreachable from the UI, with no way back short
         of devtools. `wireClearApprovals()` is now factored out and called from both
         branches.

         The message now reads "No UNAPPROVED language found", names the approved
         words, keeps Clear all reachable, and states plainly that approvals are
         per-browser and are not part of the book record.

         ⚠️ **The underlying design issue is unchanged and is now recorded in HANDOFF
         §4.2:** approvals live in `localStorage` under `ttb_approved_lang_{bookId}`,
         not on the book document. They do not travel to another device, they are not
         visible to anyone else, and a browser reset loses the entire review pass.

         Also: ARCHIVE_BASE_DEFAULT corrected to
         `https://typethatbook.misterwilson.org/library`.


#### v3.24.1

Round 6 (Noiseless). **⚠️ ADDING A NEW BOOK WAS IMPOSSIBLE. Found by Jake's console,
not by me.**

         `uploadAllBtn.onclick` called `val('active-book-title')`. `val` was declared
         `const` INSIDE `readBookMetadataForm()` — a different function — so the call
         was a ReferenceError. It sits in the ELSE branch of the overwrite check, the
         one that runs only for a book that does not exist yet; the `alreadyExists`
         branch reads `bookTitlesMap` and was fine.

         So re-uploading an existing book worked perfectly and adding a new one died
         before writing a single document. Broken since v3.23.0, when that confirm
         was introduced, and completely hidden by an already-imported library where
         every upload is an overwrite. Safari names it ("Can't find variable: val");
         Chrome buries it in an unhandled rejection, which is why it went unreported
         for three versions.

         `val()` hoisted to module scope. Also corrected ARCHIVE_BASE_DEFAULT to
         `https://www.misterwilson.org/library`.

#### v3.24.0

Round 6 (Noiseless). **Two import fixes.**

         **(1) The metadata autofill was being erased one click after it ran.**
         `autofillFromEpub()` fires on the file input's `change` event, so the fields
         are populated before Parse is ever clicked. v3.23.0 then added a clear of
         genre, ages, protagonist, source, licence, archive, cleanedby and origin, so
         a second import could not inherit the first book's tags — a correct fix in
         the wrong order. It wiped exactly what autofill had just written. The
         guarded re-fill higher up could not save it: that only fires when the id or
         title is blank, and autofill had filled those too.

         Since v3.23.0, every new-book import silently lost every field except title,
         author and cover — which survive only because they live outside the cleared
         set. It presents as "the importer never read the metadata", which is the
         opposite of the truth. Autofill now re-runs after the clear; it is safe to
         call twice because it only ever writes into an empty field.

         **(2) Archive URL fills from the picked file's name** against
         ARCHIVE_BASE_DEFAULT, overridable at runtime via `window.TTB_ARCHIVE_BASE`.
         Jake asked for this and it was lost across a handoff.


#### v3.23.3

Round 6 (Noiseless). **One comment, corrected — but the comment was load-bearing
misinformation.**

         The AUTH block opened with "Staff identity from Auth custom claims (see
         firestore.rules)". Four lines below it, the code's own comment said the
         opposite: "the role comes from staff/{uid}, NOT from Auth custom claims."
         The code does the latter. Two comments, four lines apart, in direct
         contradiction.

         Claims were the Round 1 design. `firestore.rules` v2.0.0 reversed it, and
         the reversal is permanent for a structural reason: claims can only be
         written by the Admin SDK, which needs a Cloud Functions deploy, which needs
         a terminal — and this project deploys by uploading files in a browser.

         Worth naming rather than silently deleting, because the same confusion is
         why `firestore-rules.test.mjs` seeds roles as token claims and has never
         matched the rules it tests. Round 6 recovered `MULTITENANCY.md`, the
         document that specifies the claims model, which makes the stale wording
         traceable to a source instead of mysterious. See that file's header box.


#### v3.23.2

Round 6 (Noiseless). **Header refresh and the admin.html title. No behaviour
change beyond one line.**

         The header's entry list stopped at v3.18.4 while ADMIN_VERSION read
         3.23.1 — NINE releases absent from the file that implements them,
         including Delete Book, Upload All's orphan pruning, the attribution
         fields and the entire About system. versions.js's drift check compares the
         first v<semver> in the leading comment against the constant, and the top
         line was right, so the check passed while the history below it was nine
         versions out of date. Refreshed from this document and trimmed to budget.

         admin.html's `<title>` was hardcoded — HANDOFF §4.1's first open item, and
         the field that read v3.3.0 for nineteen minor versions. admin.js now sets
         document.title from ADMIN_VERSION on load, so the tab title cannot drift
         again; the static title in the HTML is reduced to a labelled pre-JS
         fallback rather than a second source of truth.


⚠️ **Versioning note.** v3.12.0 through v3.18.0 were bumped as MINOR versions and
most of them were straight bug fixes that should have been PATCH. Jake caught it:
"We haven't added any features in a couple of turns — just tweaked what's already
there." He's right, and six inflated versions in a row makes the number stop
carrying information. Corrected going forward: a bug fix is x.y.**Z**; a minor
bump means a new capability actually arrived. Past numbers are left alone because
some of those files are already deployed and rewriting history would make the
CHANGELOG disagree with what is running.

By that standard: v3.17.0 (sort staged chapters) and v3.18.0 (re-entrancy guard)
should have been v3.16.1 and v3.16.2.

⚠️ And then the very next release broke the rule again. It shipped as v3.19.0 on
the grounds that "Start another book" was a new control — but the whole release
was fixing "there is no way to clear the create form," and a second path to a
reset that was supposed to work is a fix, not a feature. Jake caught that too,
one turn after catching the first one. Renumbered to **v3.18.1**. Recorded here
rather than quietly corrected, because stating a standard and then exempting
yourself from it in the same message is the more instructive failure.

#### v3.23.1

Round 5 (Mignon). "Cleaned up with" → **"Cleaned up by"**. Jake's suggestion, and
the right one: the shorter label stops the circled-i hint wrapping to a second line,
and "by" is what the field actually means.

#### v3.23.0

Round 5 (Mignon). Four things, all from Jake using the panel rather than reading it.

         1. DELETE BOOK. There was no way to remove a book from this panel at all;
            the only route was the Firebase console. Typed confirmation rather than
            an OK button, because confirm() is one careless Return from gone and this
            loops over every chapter document. Counts the chapters BEFORE asking so
            the number in the prompt is a fact. Chapters are deleted before the book
            record: a half-failure then leaves a visibly broken book that re-uploading
            fixes, where the other order leaves an invisible pile of orphans.
            ⚠️ Does NOT delete users/{uid}/progress/{bookId} — those live under each
            student and this panel cannot enumerate them safely. They become orphans
            pointing at nothing, which is harmless and recoverable. The prompt says
            plainly that a student mid-book loses their place and that their typing
            history does not. The cover stays in Storage and the success message says
            where it is.
         2. A NEW BOOK NO LONGER INHERITS THE LAST ONE'S TAGS. autofillFromEpub()
            only fills a field that is EMPTY — deliberately, so it cannot argue with
            something typed by hand — but nothing cleared those fields between books.
            So importing a second EPUB in one session kept the first one's genre,
            ages and protagonist and the autofill politely declined to correct them.
            That is why the Flat Edition arrived tagged **Adventure** when its
            dc:subject says Humor: left over from the book before it. Only the
            NEW-book path clears; the overwrite path must keep the metadata it is
            about to re-save.
         3. "Overwrite <id>?" ON A BOOK THAT DOES NOT EXIST YET. The id exists as a
            variable long before it exists as a document, so the very first upload of
            every book asked about overwriting nothing. Now asks "Create X with N
            chapters?" or names the actual existing book it is about to replace.
            Training someone to click through a warning is how the real one gets
            clicked through too.
         4. ORIGIN URL, beside Archive URL as Jake asked. Archive is his copy; Origin
            is upstream. Both, because the provenance should survive whichever host
            disappears first — and because with several instances doing text passes,
            knowing which edition was cleaned matters as much as who cleaned it.

#### v3.22.1 (admin.html only)

Round 5 (Mignon). **Layout, no functionality.** Jake's screenshot made the case
better than any argument: the metadata block had become ONE row of nine columns,
each with a hint paragraph printed underneath, several of them taller than the input
they described. The inputs were squeezed to roughly six characters wide and the
licence hint ran to fourteen lines.

         Two rows now — identity/tagging on the first, provenance on the second —
         with the cover in its own fixed 120px column to the right of both, so the
         cover cannot steal width from eight inputs and eight inputs cannot squash
         the cover. Stacks below 900px.

         Hints became title="" tooltips on a circled i. Same words, on hover, zero
         vertical space.

         FRONT/BODY/BACK and EDIT were the SAME BLUE, sitting adjacent, doing very
         different things — one reclassifies a page, the other opens its text. The
         matter toggle is amber now (the colour the untagged dot already uses for "a
         judgement call") and About is green when on.

         ⚠️ admin.js IS UNCHANGED, which was the point — Jake needed to run the
         import test while this was being written. Verified: all 14 metadata element
         ids present, no duplicates, HTML balanced, and the set of ids admin.js
         expects but admin.html lacks went from 27 to 23 with NO new entries. The
         four that disappeared are the fields v3.20.0 and v3.21.0 added, which is
         the first time the panel has actually contained them.

         Also set the hardcoded page title to v3.22.1. It had said v3.3.0 since
         admin.js was at 3.3.0 — nineteen minor versions ago. admin.html still has no
         version constant of its own; that is a separate job.

#### v3.22.0

Round 5 (Mignon). Upload All PRUNES orphaned chapter documents. It wrote the
chapters it had and never removed ones it did not, which was survivable while ids
were stable and is not now that v3.18.5's Fix C renumbers the Gutenberg books.

         Re-importing Toby Tyler, whose chapters move from 3–22 to 1–20, would have
         left chapter_21 and chapter_22 in the subcollection permanently: readable,
         billable, and loadable by any student whose stored progress still pointed at
         them. Deliberately runs AFTER the book document is written, so a failed book
         write leaves the old chapters intact rather than deleting content the new
         list never replaced. Non-fatal on error and reported in the completion line.

         ⚠️ There is still NO delete-a-whole-book function in this panel. Overwrite
         is the supported path and is now safe; deleting a book means the Firebase
         console.

#### v3.21.0

Round 5 (Mignon). **"About this book."** Jake's question — if nobody can SEE that
the rules are followed, are they followed? — turned out to have a smaller answer
than it felt: the standard is discoverable, not unavoidable, and a licence URI is
sufficient. What was actually missing was the copyright notice, because the
workflow deleted it.

         `about` is a new boolean on each chapter, ORTHOGONAL to `matter`. matter
         says whether a page is typeable; about says whether it is part of the
         credits; those cross. A chapter is typeable and not credits. A colophon is
         credits and not typeable. An author's real preface is neither. Collapsing
         them into one field is the mistake — so this is a second flag, and the
         About view renders EVERY chapter carrying it in id order. Standard Ebooks'
         colophon AND uncopyright both appear with nothing special-cased.

         Auto-set on import from filename and epub:type (imprint, copyright,
         uncopyright, colophon, licence, rights), and only ever for non-body
         documents — a chapter is never credits whatever it is called. Toggled per
         row with an ℹ button that appears ONLY on non-body rows, so a 31-chapter
         novel grows four buttons, not thirty-five.

         ⚠️ ALSO FIXES A SILENT DATA LOSS. Open Book's chapter push never carried
         `matter`, so opening a book and re-uploading it reset every front and back
         matter document to 'body' — classification was only ever correct on the
         FIRST import, and the About flag would have evaporated on the second. Both
         now restore from the stored chapter list.

         Source and Licence became dropdowns sharing readSelectOrCustom /
         writeSelectOrCustom, generalised from readGenreField — which existed
         because Upload All once stored the literal string "__custom__". Three
         fields with that shape means one reader, not three chances to repeat it.
         New Archive URL (provenance, not compliance) and "Cleaned up with" fields.

         THE DOT NOW NAMES WHAT IS MISSING. v3.7.0 checked age alone; it now checks
         age, cover, licence and about, and prints "· needs: cover, licence" beside
         the title. A hollow dot on forty books says there is work without saying
         what, which is how the age backlog sat. '' for licence now means "not
         decided", because public domain is an explicit dropdown choice rather than
         an absence.

#### v3.20.0

Round 5 (Mignon). **Attribution fields.** Prompted by Jake asking where the credit
for a Creative Commons book is supposed to go. Forty public domain books needed
none of this; the first CC book needs it as a condition of use, and the schema had
nowhere to put it.

         Two fields, Source and Licence/rights, because Creative Commons' own TASL
         formula is Title-Author-Source-Licence and the first two are already on
         the card. Both auto-fill from the EPUB — dc:rights for the licence,
         dc:source then dc:publisher for the edition — so the one field with a legal
         obligation attached is populated before Jake types anything. When a licence
         IS found the autofill status goes amber and says so, because it changes what
         has to appear on the library card and is easy to scroll past.
         Blank is written as '' rather than omitted, so clearing a field can clear a
         stored value (§A.14).

         ⚠️ Attribution belongs on the CARD, NOT IN THE TYPED TEXT. A student meets
         and chooses the book on the card, which is what "a manner reasonable to the
         medium" asks for. Putting it in the typing stream would make a child type
         the credit as prose and corrupt the very work being credited.

         Also retired the "multiple" protagonist option. It was a synonym for
         "ensemble" and having both split the student age/gender filter's results
         across two values for one concept.

#### v3.19.2

Round 5 (Mignon). Eleven more names in MATTER_FILE_NAMES, found by importing a real
book rather than by reading code: Augie and the Green Knight ships an
acknowledgements page, and v3.18.4's filename rescue had no entry for it, so it
displayed as "Front matter 1". Added acknowledgements/acknowledgments, foreword,
afterword, prologue, epilogue, glossary, bibliography, notes, errata, imprimatur.

#### v3.19.1

Round 5 (Mignon). Each chapter in the book document now carries its `matter`
class. bodyChapters has been written since v3.18.x with **no consumer**, and this
is why: a reader could see how many body chapters there were but not WHICH ones,
so it could not turn that number into a position. chapterMeta was `{id, title}`.

         ⚠️ Old book documents lack the field. index.html v3.3.1 falls back
         accordingly; re-upload a book to populate it.

#### v3.19.0

Round 5 (Mignon). Prompted by Jake asking whether the importer deletes anything.
It does not — but checking the answer turned up the reason that mattered.

         1. RELABEL, DON'T DELETE. Every matter class in this file is a GUESS: a
            filename pattern, an epub:type, a heading shape, or v3.18.5's
            leading-matter test. The staging row offered Merge, Split, Edit and
            Del but NO WAY TO SAY "that IS a chapter" — so the only remedy for a
            misclassified chapter one was to delete it, which is the opposite of
            what anyone wanted. New Body/Front/Back button cycles the class,
            re-derives every id, and reports the new body count. The badge tooltip
            already showed matterWhy; now the verdict can be overruled.
            This is what makes v3.18.5's three uncertain books (Oz_g, Scranton
            Chums, Camp Fire Girls) a one-click correction rather than a reason to
            distrust the whole fix.
         2. DELETING A CHAPTER NO LONGER FLATTENS EVERY ID. §B.13 item 4, open
            since v3.14.0. Three sites — Delete, Merge and Split — did
            `stagedChapters.forEach((ch, i) => ch.id = i + 1)`, which turns Heidi's
            1.01–2.09 into 1–22 and collapses front matter's 0.x and back matter's
            900.x into body positions. All three now call assignChapterIds(), which
            is the function that knows about parts and matter classes.
            ⚠️ These two fixes had to ship together: the relabel button is only
            useful if re-deriving ids is correct, and editing the staged list is
            exactly the workflow that trips the flattening bug.

#### v3.18.5

Round 5 (Mignon). **Fix C — front matter hiding inside a bodymatter file.**
Measured across Jake's full 42-book library, not two examples.

         classifyDocument() classifies a whole spine FILE; the TOC route then
         splits that file into units and every unit inherits the file's class. So
         a title page, contents list, dedication or e-text credit sharing a file
         with chapter one all became BODY chapters. This hit 9 of the 11 Gutenberg
         books and pushed real chapter numbering out by 1 to 4 — a kid told to
         type chapter 1 of The Crimson Sweater got "E-text prepared by David
         Edwards, Graeme Mackreth…". Reclassified as FRONT, never deleted: §B.7
         keeps front matter visible and labelled, so Baum's real Introduction
         stays available, just not as chapter 2.

         Signals, in order: a front-matter title vocabulary; a publisher/credit
         pattern; the heading equalling dc:title or being its leading words; the
         heading equalling dc:creator; stranded subtitle debris ("OR"); and a
         narrow dedication pattern. ⚠️ ONLY RUNS BEFORE THE FIRST REAL CHAPTER —
         the first body unit that does not match switches the filter off for the
         rest of the book, so nothing after chapter one can be touched.

         ⚠️ The dc:title test is ONE-DIRECTIONAL by design. Also testing
         heading.startsWith(dc:title) would fire on any book whose title is a
         short name its chapters reuse — dc:title "Heidi" would have swallowed a
         chapter called "Heidi Goes to the Mountain".

         RESULT: 33 of 42 books unchanged in body count. 9 changed, all Gutenberg.
         Five land exactly on canonical — Dracula 27, Toby Tyler 20, Rebecca 31,
         Outdoor Girls 25, HS Left End 25 — and Crimson Sweater's 27 matches
         Jake's own corrected count.

         ⚠️ THREE NEED A HUMAN EYE BEFORE THIS IS TRUSTED: Wizard of Oz_g lands on
         23 against a canonical 24, Scranton Chums on 19 against Jake's 20, Camp
         Fire Girls on 12 against Jake's 13. All three may be over-removing by one.
         The suspected cause is the dc:title test: Gutenberg often repeats the book
         title as an <h1> directly above chapter one IN THE SAME UNIT, so
         reclassifying that heading can take chapter one's paragraphs with it.
         Verify against those three before relying on Fix C.

#### v3.18.4

Round 5 (Mignon). Two importer fixes aimed at the non-Standard-Ebooks sources,
each measured against all eight of Jake's real EPUBs BEFORE shipping. Combined
they change 9 chapters — every one of them front or back matter — and move **no
body chapter's id on any book**, which is the §B.7 invariant that keeps a
student's stored chapter pointer where it is.

         1. FRONT MATTER CANNOT FOLLOW BODY MATTER. Toby Tyler's final spine file
            — the Gutenberg licence: zero paragraphs, no heading, no keyword in
            its filename — classified as 'front', which gave it id 0.2 and
            therefore SORTED IT TO POSITION 2 OF THE BOOK. A document that appears
            after the story has started is not front matter by definition,
            whatever its shape looks like, so `seenBodyMatter` reclassifies it as
            back. Fires exactly once across the eight books: on the one file that
            had the bug.
         2. A NON-CHAPTER IS NEVER TITLED "Chapter N". composeChapterTitle() falls
            back to the running counter for any document without a usable heading,
            regardless of kind — so Gatsby's dedication.xhtml was "Chapter 3" and
            Alice's frontispiece.xhtml was "Chapter 4", numbers that were not even
            those items' ids, sitting in the staging list beside real chapters.
            §B.7 keeps front matter visible and labelled rather than hidden, which
            only works if the label is true. Named from the filename now
            (dedication → Dedication, loi → List of Illustrations), falling back
            to "Front matter N" / "Back matter N" for the opaque names Global Grey
            and some Gutenberg builds use (index_split_001). Only consulted when
            the old code produced a bare "Chapter N", so a real title is never
            overwritten.

         ⚠️ STILL OPEN, deliberately: Toby Tyler's title block and table of
         contents become BODY chapters 1 and 2, pushing its 20 real chapters to
         3–22. classifyDocument() classifies a whole spine FILE, and the TOC route
         then splits that file into units which all inherit 'body' — so
         front-matter units INSIDE a bodymatter file are invisible to the
         classifier. Fixing it needs per-unit classification against a title
         vocabulary, and tuning a vocabulary on two examples is how you overfit.
         Waiting on the full corpus.

#### v3.18.3

Round 5 (Mignon). **The EPUB cover bug**, plus four defects found on the same
path while proving it.

         THE BUG. JSZip's `.async("blob")` builds its Blob with an EMPTY type —
         `""`, hardcoded, jszip/lib/zipObject.js:65. Firebase's uploadBytes()
         then falls through `metadata.contentType || blob.type ||
         'application/octet-stream'` and stored every EPUB-extracted cover as
         application/octet-stream. storage.rules v2.0.0 required
         `contentType.matches('image/.*')`, which that never satisfies — so every
         cover from an EPUB was denied with storage/unauthorized while every
         cover chosen by hand sailed through, because the file picker hands over
         a File carrying a real image/jpeg. That single difference is why this
         presented as an EPUB problem rather than a permissions one. It had been
         diagnosed once as an AVIF mapping issue, which was the wrong half: the
         format is irrelevant, the type is gone before anyone looks at it.
         Confirmed against Jake's Northanger Abbey failure and his report that
         manual uploads worked — those two facts identify the failing clause by
         elimination, since nothing about identity can tell the paths apart.

         Fixed at the source: sniffImageType() reads magic bytes (JPEG, PNG,
         GIF, WEBP, BMP, AVIF, HEIC, and SVG by tag), the Blob is rebuilt
         carrying that type so the preview is honest too, and the type is passed
         explicitly to uploadBytes. uploadCover() now REFUSES a blob with no
         image type rather than uploading something that stores as octet-stream
         and fails to render for reasons nobody connects back to it.

         1. DETECTION DID NOT CHECK THE MEDIA TYPE. Methods 1 and 2 accepted
            whatever the manifest pointed at. Standard Ebooks points
            `properties="cover-image"` at `images/cover.svg` — a WRAPPER whose
            only content is an <image> referencing the real raster. An SVG in an
            <img> tag runs in secure static mode and cannot load external
            resources, so that wrapper is a permanently blank cover. All three
            methods are type-checked now, and when the chosen cover is an SVG the
            raster inside it is read out of the wrapper and preferred; failing
            that, a cover-ish raster sibling; failing that the SVG is kept and
            flagged as probably blank.
         2. PERCENT-ENCODED HREFS WERE NEVER DECODED. `decodeURIComponent`
            appeared nowhere in the file, so `images/cover%20art.jpg` never
            matched the zip entry `images/cover art.jpg`. New zipEntry() helper
            tries the raw name first (a zip entry may legally contain a literal
            %) then the decoded one, and is used for cover, spine and nav.
         3. A MISSING SPINE FILE KILLED THE WHOLE IMPORT ANONYMOUSLY. It was
            `zip.file(p).async(...)`, which throws on null with a TypeError
            naming nothing. Now the file is named on screen, counted, and costs
            one chapter instead of the book — partial-and-labelled beats nothing.
         4. THE PARSE SUMMARY NEVER MENTIONED THE COVER. It reported chapters,
            splits, paragraph reconciliation and language warnings and was silent
            about the cover in both directions, so a silent extraction failure
            looked exactly like success. The one message it did write was
            overwritten unconditionally. The cover is now named in every outcome,
            with its content type, and both save paths name it on success too —
            §B.9's rule finally applied to the parse.
         5. parseEpubFile() HAD NO RE-ENTRANCY GUARD, despite §B.9 stating the
            rule that would have caught it. It opens with `stagedChapters = []`,
            is reachable from two file inputs, and nulls stagedCoverBlob several
            awaits in. Dropped rather than queued — the opposite of flushAll(),
            because a second parse of a file picker is a double-click with no
            work worth keeping. Released in a finally.
         6. THE INLINE SAVE MESSAGE COULD NOT GO AWAY. `save-title-status` was
            written in one place and cleared in none, so a green "✓ Saved ·
            genre: Horror · cover saved" from one book sat beside the NEXT book's
            form while the top of the page showed that book's COVER FAILED. The
            message was accurate about the book it was written for — which is
            §B.9 in mirror image, a success reported about the wrong SUBJECT
            rather than a failure in the wrong PLACE, and it cost real trust in a
            message that was telling the truth. Cleared on book change, Open
            Book, EPUB parse and Upload All.

         Verified by a rebuilt §B.7-style harness (cover-harness.mjs) that lifts
         sniffImageType(), zipEntry() and resolvePath() out of this file by
         brace-matching and replays them against ten synthetic EPUBs modelled on
         the real structures: SE with an SVG wrapper over AVIF, SE with a dangling
         wrapper reference, a wrapper with no raster at all, Gutenberg with a
         percent-encoded href, EPUB 2 <meta name="cover">, a meta pointing at the
         cover PAGE, a manifest that lies about the format, a declared cover
         absent from the zip, non-image bytes, and no cover at all. Every case
         resolves to the right file with the right type, and every warning fires
         exactly when it should.

#### v3.18.2

⚠️ **This entry was reconstructed in Round 5.** v3.18.2 shipped, is the version in
the repo, and is documented in the file header — but it was never added here, so
the CHANGELOG jumped from v3.18.1 straight to v3.18.3 and this file's own
"currently vX" line still said v3.18.1. Recorded from the header rather than left
as a hole.

         A failed cover upload is no longer invisible. uploadCover() reported its
         errors to the status bar at the TOP of the page — roughly seventy lines of
         markup above the button that triggered it, and reliably scrolled out of
         view — while the inline message beside Save Metadata said "✓ Saved",
         because the Firestore write DID succeed and only the cover did not. So a
         failed cover looked exactly like a successful save, and two books went up
         with no cover before anyone noticed. Save Metadata now refuses to write at
         all if the cover fails, uploadCover() returns a result rather than a
         URL-or-null so callers cannot swallow the error, and both paths name
         Firebase STORAGE rules specifically — which are separate from
         firestore.rules and had never existed anywhere in this repo.

         ⚠️ This fix is what made Round 5's diagnosis possible: it is the error
         message in Jake's Northanger Abbey screenshot. The defect it fixed was
         real, but it was the REPORTING of the cover failure, not the cause — see
         v3.18.3.

#### v3.18.1

         Two ways back to an empty create form, because there were none. Also
         paired with admin.html — the EPUB picker now sits ABOVE the three
         fields it auto-fills, since asking for them first was asking a
         question the next control answers.

         1. "Start another book" clears the form AND the staging state. Not
            just the visible inputs: stagedChapters, stagedFromDB, activeBookId,
            the cover blob, the audit panels. A blank form sitting over a
            populated stagedChapters is the setup for the worst bug available
            in this panel — clear the fields, parse book B, and Upload All
            writes B's chapters under book A's id.
         2. ⚠️ THE DROPDOWN'S OWN RESET WAS DEAD CODE. bookSelect.onchange has
            always cleared the new-book fields, and it never ran after an
            upload. loadBookList(false) silently restores whatever was selected
            before, and during a new-book upload that is "__NEW__" — so the
            picker was ALREADY on "Create New Book...", re-picking it changed
            no value, and no change event fired. Jake's screenshots showed
            turn-of-the-screw / The Turn of the Screw / Henry James still in the
            form while the file input held a different book.
            After an upload the picker now points at the book that was just
            created. That makes it honest about what exists, and makes "Create
            New Book..." a genuine change next time so its reset fires.
            ⚠️ Set SILENTLY — never dispatchEvent('change') there. onchange
            hides the staging area and reassigns activeBookId, which would throw
            away chapters that were just uploaded and are still worth auditing.
            Same trap documented on loadBookList's selectFirst parameter.
         3. onchange never cleared new-book-author, which has been auto-filled
            from <dc:creator> since v3.14.0, so the previous book's author sat
            in the form for the next one.

#### v3.18.0

         RE-ENTRANCY GUARD ON OPEN BOOK — the actual cause of the scrambled
         staging list, found by taking the numbers seriously instead of
         theorising about the code a fourth time.

         Loading a book is one sequential round trip per chapter — 13 for Tom
         Sawyer Abroad, 284 for Aesop — so there is plenty of time to click the
         button again mid-load. Both handlers then reset `stagedChapters = []`
         and push into the same array as their awaits resolve: the second reset
         discards what the first had collected, and the two loops interleave
         from wherever each had reached.

         The reported order was 4, 5, 1, 6, 2, 7, 3, 8. That is not random —
         it is (4,5,6,7,8) interleaved with (1,2,3), one run continuing while
         another started over. Reconstructed step by step it matches digit for
         digit. The stored `chapters` array was perfectly sequential the whole
         time, which is why "Repair Chapter Order" correctly reported clean and
         why no data was ever at risk.

         ⚠️ Third instance of this bug class in the project, after game.js
         flushAll() (duplicate typing_sessions, double-counted minutes in
         teacher reports) and learn.js flushStats(). The shared shape: an async
         handler that resets module state before its first await. Grep for
         `= []` or `= {}` at the top of an async function and ask what happens
         if it runs twice.

         Guard released in a `finally` so a failed load cannot leave the button
         permanently disabled.

#### v3.17.0

         stagedChapters is now sorted by chapter id after both load and parse.
         Del, Merge ↓ and Split all operate on array INDICES and all three end
         with `stagedChapters.forEach((ch, i) => ch.id = i + 1)`, so an
         out-of-order array was not cosmetic: one Del click would have
         rewritten every id from the wrong positions, and Merge would have
         merged two chapters that only looked adjacent. Sorting the array
         rather than the render is deliberate — sorting only the render would
         have fixed the appearance and left the index operations still reaching
         for the wrong rows.

         ⚠️ STILL OPEN: that renumber flattens part-aware ids. Delete one
         chapter from Heidi and 1.01-2.09 becomes 1-22. Needs the part scheme
         threaded through all three handlers. Avoid Del/Merge/Split on a
         multi-part book until then.

#### v3.16.0

         Chapter titles are tidied on import. Project Gutenberg headings arrive
         as "I. TOBY'S INTRODUCTION TO THE CIRCUS"; the number is already the
         document id, and shouting is harder to scan than mixed case, which is
         the one job a chapter list has.

         stripLeadingOrdinal() removes exactly one leading ordinal, and only
         when text remains behind. ⚠️ The trap is "I AM BORN": "I" is both a
         Roman numeral and an English word, so a bare-numeral rule turns David
         Copperfield's first chapter into "Am Born". A single-character numeral
         is therefore stripped only when punctuation follows it — that is what
         distinguishes an ordinal from a pronoun. "CHAPTER I. I AM BORN" strips
         one ordinal and correctly yields "I Am Born".

         toTitleCase() runs ONLY when a title is at least 90% uppercase. A
         mixed-case title was set deliberately and is left byte-identical —
         "The Tale of Peter Rabbit" needs no help. Capitalisation happens after
         hyphens and slashes but never after an apostrophe, so TOBY'S becomes
         Toby's rather than Toby'S; these titles are full of possessives and
         that is the case a naive implementation always breaks.

         A bare ordinal passes through untouched, because Pride and Prejudice
         and Gatsby genuinely do not name their chapters and "II" is the best
         available title. 14/14 on a fixture set covering both directions of
         the "I Am Born" case.

#### v3.15.0

         1. ⚠️ parseFloat CANNOT COMPARE PART NUMBERS, AND EVERY SORT USED IT.
            parseFloat("1.10") is 1.1 — the SAME VALUE as parseFloat("1.1"). So
            1.1 and 1.10 were not merely misordered, they were
            indistinguishable, and 1.2 sorted after both: a two-part book came
            out 1.1, 1.10, 1.11, 1.2. A dotted id is not a number, it is a
            sequence of numbers, so chapterSortKey() splits on the dot and
            compareChapterIds() compares element-wise as integers. Both sort
            sites (Upload All, Repair Chapter Order) now use it.
            ⚠️ This fixes books ALREADY numbered by hand with no renumbering,
            so no student's stored chapter pointer moves. Running the existing
            "Repair Chapter Order" button on a multi-part book is now enough.
         2. New ids are also zero-padded, as a second line of defence for any
            naive numeric sort elsewhere. Width is taken from the largest part
            in the BOOK so every id in one book has the same shape — Heidi
            becomes 1.01-1.14 and 2.01-2.09, not a mix. A book whose largest
            part is under ten chapters stays unpadded (1.1-1.9), because there
            is nothing to disambiguate and the short form reads better.
         3. REPAIR TOOL: "Remove chapter titles from typed text". For books
            uploaded before v3.13.0, whose segment zero repeats the chapter
            title. Re-importing would fix it and cost the titles Jake typed by
            hand, renumber everything, and orphan student chapter pointers —
            this drops the duplicate first segment and nothing else. Titles and
            ids untouched. Previews every change and waits for confirmation,
            because a false positive would silently delete a real opening line;
            titlesMatch() compares on letters and digits only, and requires a
            whole-string match so a sentence that merely BEGINS with the title
            is never touched. Bumps contentVersion so students see it at once.

#### v3.14.0

         1. PART-AWARE NUMBERING. v3.13.0 numbered every body chapter 1..n,
            which is right for a novel and destructive for a book with internal
            divisions — it flattened Heidi's two parts, which Jake had
            hand-numbered 1.1-1.13 and 2.1-2.8, into a single run of 1-23.
            The signal was in the filenames all along: Standard Ebooks names a
            multi-part chapter `chapter-{part}-{n}.xhtml` and drops
            `part-1.xhtml` / `part-2.xhtml` in as dividers. Heidi now imports
            as 1.1-1.14 then 2.1-2.9; Pride and Prejudice, with no parts, is
            unchanged at 1-61. A book needs two or more distinct parts before
            the scheme engages, so single-part books cannot be affected.
            Position within a part is POSITIONAL, not the book's own ordinal —
            Heidi's chapter-2-1 is headed "XV" because that edition numbers
            straight through, but 2.1 is what Jake wants and what he had. One
            rule therefore covers both restart-at-1 and continue-from-14 books.
            Part divider files carry a heading and no prose, so they yield zero
            segments and drop out with no special case.
         2. METADATA AUTO-FILL. Every field the create form demanded was
            already in the EPUB. Confirmed across the 20 test books:
            <dc:title> 20/20, <dc:creator> 20/20, <dc:subject> in most. Picking
            a file now fills title, a slugified book id, author, and a genre
            guess from dc:subject. Nothing already typed is ever overwritten,
            and a metadata read that fails leaves the manual path untouched.
            ⚠️ Only the FILE is required to parse now. The old gate demanded id
            and title up front — which is why the author extraction that had
            existed inside parseEpubFile for versions never saved anyone any
            typing: you had to type the metadata to earn the right to press the
            button that read the metadata.

            Age range remains the one field that cannot be derived and still
            needs a human.

#### v3.13.0

         Ran the shipping import code against 20 real EPUBs in a Node harness
         (jszip + jsdom) rather than reasoning about it. Two bugs, both silent.

         1. EVERY SPINE DOCUMENT WAS BECOMING A NUMBERED CHAPTER. Standard
            Ebooks' `imprint.xhtml` — their publishing boilerplate — was
            chapter 2 of every book in the library, and `titlepage.xhtml` was
            chapter 1. That shifted the real chapters by a different amount per
            book: Pride and Prejudice's Chapter I sat at position 3, Gatsby's at
            5, Douglass's at 6. Aesop reported 289 fables instead of 284 for the
            same reason. classifyDocument() now reads epub:type
            (frontmatter/bodymatter/backmatter), which resolved 18 of the 20
            test books; the two Gutenberg files fall back to filename then
            shape. Counts now match the actual books — P&P 61, Gatsby 9,
            Alice 12, Wind in the Willows 12, Pinocchio 36, Douglass 11,
            Aesop 284.
         2. CHAPTER TITLES WERE BEING TYPED INSTEAD OF READ. Standard Ebooks
            marks a titled chapter as an <hgroup> holding the ordinal in the
            heading and THE TITLE IN A <p epub:type="title">. headingTextOf()
            only queried h1-h6, so it returned "II" and never saw "Old Tom and
            Nancy" — twelve of twenty books, every one of which Jake retyped by
            hand. And because the title was a <p>, querySelectorAll('p') swept
            it into the prose, making the chapter title SEGMENT ZERO of what
            students type. headingInfoOf() returns title, ordinal, and the
            elements to exclude; the caller honours that list. Pollyanna: 32
            titles read, 32 title paragraphs removed.

         Numbering (assignChapterIds): body chapters 1..n so chapter 1 is
         chapter 1; front matter 0.1, 0.2; back matter 900.1, 900.2 — high
         enough never to collide with the 1.1 / 2.1 convention for books with
         internal parts. Front and back matter are LABELLED in the staging
         list, not hidden; some of it is real prose worth typing (Aesop's
         Introduction, Douglass's Preface). `bodyChapters` is written to the
         book document separately from `totalChapters` so "finished the book"
         can be judged on the story — Jake's catch: keeping the colophon meant
         a student never got the completion celebration.

         ⚠️ Also fixed a bug introduced by v3.12.0's own paragraph
         reconciliation: it counted the deliberately-stripped title paragraphs
         as lost text, so Pinocchio would have warned "36 paragraphs did not
         reach any chapter" in amber on every import. Caught by the regression
         run, which is the check earning its keep.

#### v3.12.0

         1. contentVersion IS NOW WRITTEN. game.js has invalidated its cached
            chapter text on `books/{id}.contentVersion` since v3.4.0, and no
            version of this file had ever set it. The chapter cache therefore
            had only its expiry, so an edited chapter took up to seven days to
            reach a student. bumpContentVersion() is called from all seven
            paths that change chapter text. A failed bump is non-fatal on
            purpose — the chapter save it follows already succeeded.
         2. THE TOC IMPORTER WAS DROPPING PARAGRAPHS. In
            chapterUnitsFromToc(), `current` started null, so every <p> before
            the FIRST TOC anchor was skipped and never reached a chapter.
            Content between anchors was always safe; content after the last
            anchor was safe. The loss case was the run-up to anchor one — a
            dedication, an epigraph, a transcriber's note sharing a file with
            chapter I. Orphans are now prepended to the first unit rather than
            dropped, and if more than half a file's paragraphs fall outside
            the TOC the whole TOC route is declined as a bad map of that file.
         3. PARAGRAPH RECONCILIATION. Every import counts <p> elements seen
            per spine file against <p> elements actually placed into a
            chapter, and warns in amber on any shortfall. The importer will
            keep getting cleverer; this is what will say so when a clever
            change loses text.


admin.js v3.10.0

#### v3.10.0

ONE PASS PER BOOK. Two divergent copies of "write the book document"

         had drifted apart, so every book had to be visited twice and you had
         to know which button wrote which field.

         ROOT CAUSE of "Save Metadata loses the chapters": saveTitleBtn called
         loadBookList() to refresh the picker (added v3.6.0, well meant), and
         loadBookList ended with `selectedIndex = 1` + a synthetic change
         event. bookSelect.onchange hides the staging area AND reassigns
         activeBookId — to the FIRST book alphabetically, not the one being
         edited. So it didn't merely hide the chapters, it silently repointed
         the editor at a different book. loadBookList() now preserves the
         selection and takes an explicit flag before it fires onchange.

         Upload All was missing minAge/maxAge/protagonistGender entirely (my
         miss in 3.7.0 — I added them to Save Metadata only), read genre via
         .value instead of readGenreField() so "Custom..." stored the literal
         "__custom__", and still had the `if (author)` guards that v3.6.0
         removed from the other path. That genre read is the FOURTH instance
         of the read-the-field-properly bug HANDOFF §11 warned to look for.

         Both paths now share readBookMetadataForm(). One reader, one writer,
         no drift. Upload All writes chapters AND metadata, so a new book is
         finished in one pass.

         Also: find & replace across a staged book, with case preservation and
         automatic a/an correction. Built after doing 169 of them by hand in
         Aesop's Fables.
v3.9.0

#### v3.9.0

EPUB import: split multi-work spine files.

         The importer assumed one spine file == one chapter. Standard Ebooks
         (where most of this library comes from) puts every short work of a
         COLLECTION in a single XHTML file as sibling <article>/<section>
         elements — Aesop's Fables is 284 fables in one file. That imported as
         one 238KB "chapter" with 284 titles run together, and the alternative
         was splitting and naming 284 chapters by hand.
         findChapterUnits() now detects that shape and splits on it. Novels are
         unaffected: one heading per file means no split, and the old path runs.
         Also fixes a latent bug — title extraction used hTag.innerText, which
         is undefined on a DOMParser document in Firefox because innerText
         needs layout. Every imported title would have been blank there.
         Also: the seven period words previously held back are now flagged, at
         Jake's request. See the note above FLAGGED_WORD_GROUPS.review.
v3.8.0

#### v3.8.0

Language filter: regex + audit. The persistent "always flag these"

         list now accepts /…/ patterns like the free-text search already did,
         patterns are validated on entry AND defensively at scan time (one bad
         stored pattern used to be able to break every scan), and there is
         finally a way to SEE the effective list — built-in plus custom, with
         a live tester. FLAGGED_WORDS regrouped by category and substantially
         expanded for period literature; see the note above it.
         Also: book list CSV export + an on-page balance report, for checking
         the library's spread of genre / age / protagonist.
v3.7.0

#### v3.7.0

Book tags: target age range (minAge/maxAge) and protagonistGender on

         books/{id}. Written unconditionally by Save Metadata, same as author
         and genre — see the v3.6.0 note on `if (author)` silently keeping the
         old value when a field is blanked. Age is validated as a RANGE, not
         two independent numbers: half a range is a data bug, and min > max is
         silently unmatchable by the library's overlap test.
         The book picker now marks untagged books with a bullet so the tagging
         backlog is visible while working through it.
v3.6.0

---

## `index.js` (Cloud Functions)

Current: **v1.6.0**

#### v1.6.0

         1. DELETED ~360 LINES — the seven abandoned custom-claims functions
            (setStaffRole, setStaffReadScope, lookupStaffCandidate, listStaff,
            syncMyClaims, revokeStaffRole, resyncStaffClaims). No client called
            any of them and no security rule consulted the claims they wrote;
            admin.js v3.0.0 replaced the model with a staff/{uid} document read.
            ⚠️ Removed rather than left alone because dead code in an
            undeployable file is not harmless: syncMyClaims was callable by any
            signed-in user, and the header's "only generatePractice is deployed"
            was true only until someone ran `firebase deploy`, which would have
            shipped an access-control system the rules no longer read.
         2. The daily practice limit is now a TRANSACTION. It used to read the
            count, spend several seconds generating a paragraph, then write
            count + 1 — so two overlapping calls both read 2, both wrote 3, and
            the student got extra turns. The slot is reserved BEFORE generation,
            which means a failed generation costs one of the five. Deliberate:
            a limit that can be bypassed by causing failures is not a limit.
         3. A 429 NO LONGER FANS OUT. It used to fall through the whole
            six-model chain, so thirty students hitting the practice unlock at
            the same moment — they all start class together — became up to 180
            API calls, making the quota problem worse the harder it was hit. A
            429 now stops immediately with a friendly message. 5xx and 404 are
            per-model faults and still fall through.

         `package.json`: Node 18 (decommissioned for Cloud Functions deploys) →
         22, firebase-functions ^5 → ^6, firebase-admin ^12 → ^13.

---

## `learn.js`

Current: **v2.2.4**

#### v2.2.4

Round 6 (Noiseless). Goals-cache half of the class-assignment bug — see game.js
v3.14.0 for the full account, since the two files share the cache key and the defect.


#### v2.2.3

Round 6 (Noiseless). **`beginStep()` called a function that does not exist.**

         `if (!currentStep) { finishLesson(); return; }` — and there is no
         finishLesson() in learn.js, or in any other file in this repo. The
         completion path has always been finishStep() -> showLessonResultModal().

         The guard exists to catch currentStepIdx landing outside currentRuns, so
         it fired only in the situation it was written to rescue, and when it fired
         it threw a ReferenceError. The throw abandons beginStep() BEFORE the intro
         panel is hidden or the keyboard is wired, so the student is left on a dead
         drill screen with no modal, no error and no route back but the browser's
         Back button. Nothing is written, which means it is also invisible from the
         teacher side — the exact failure mode the Batch A/B instrumentation exists
         to eliminate.

         Reachable two ways, both real. The Game Genie's step jump calls
         beginStep(parseInt(select.value)) with no bounds check. And a saved run
         checkpoint outlives a lesson edit: re-chunking a five-run step into three
         leaves a resume pointing at run 4 of 3. startLesson() bounds-checks the
         resume it reads, but the checkpoint itself survives.

         Recovery is stopLesson(), not completion. `!currentStep` means the run list
         and the index disagree; grading a run that does not exist would write a
         score for work nobody did. clearRunPosition() goes with it so a stale
         checkpoint cannot bounce the student straight back out.

         Also in this release: the mid-drill resume condition read
         `!drillModal.classList.contains('hidden') === false`. That is CORRECT —
         unary ! binds tighter than ===, so it reduces to "the modal is hidden" —
         but it is shaped exactly like a typo, and the next person to touch it will
         "fix" it into its own negation. Rewritten as two named booleans, with
         equivalence checked across all four input combinations first.


#### v2.2.2

Round 5 (Mignon). Same Firefox Quick Find fix as game.js v3.9.3. handleDrillKey
is bound to #drill-keyboard, which is a **div** — a div absorbs nothing, so
Firefox was free to act on anything not cancelled, and lessons drill punctuation
on purpose.

#### v2.2.1

Round 5 (Mignon). flushStats()'s re-entrancy guard was `if`, which serialises
two callers and lets three or more overlap — the identical defect as game.js
v3.9.0, introduced in the same round by the same analogy that found the bug in
the first place. Now `while`. Verified by lifting the shipping function into a
harness at 2, 3, 6 and 12 concurrent callers: one inner run at a time, no
caller dropped. learn.js was never uploaded, so production was unaffected.

#### v2.2.0

The cost headline of the Round 4 audit. game.js had accumulated a caching
layer over several versions; learn.js never got any of it, and learn.js is
the page 6th and 7th graders open every day. A returning student cost ~5
reads in game.js and ~115 here, for the same ten minutes of typing.

         1. LESSONS CACHED, validated by getCountFromServer(). Firestore
            bills an aggregation at one read per up to 1000 matched index
            entries, so checking the cache costs ONE read instead of
            re-reading ~80 documents. A count catches added or removed
            lessons instantly; an edit to an existing lesson is caught by the
            4-hour TTL. That trade is deliberate and documented at the code.
         2. loadLessons() DOUBLE-FIRED ON MOST LOADS. The guard was
            `if (allLessons.length === 0) await loadLessons()` in the auth
            handler, with a fire-and-forget call at module load. Auth settles
            in ~200ms and the fetch takes ~300ms, so the guard tested a
            length that had not been populated yet and ran the biggest read
            in the app a second time. An in-flight promise is the only thing
            that closes that race; the old comment acknowledged it and the
            old guard did not.
         3. lessonProgress cached 8h, uid-namespaced, written through on
            every flush so the cache tracks what this tab already did.
         4. GOALS CACHED 24h, sharing game.js's exact ttb_goalsCache_v1 key,
            so a student who opens both pages in a day pays one read. An
            entry written by game.js lacks className and is treated as a miss
            rather than blanking the class banner for a day.
         5. pendingClassAssignments read SKIPPED when the student already has
            a class. It was firing on every login, for every student, to find
            nothing. loadGoals() now runs first so classInfo is populated in
            time to make that decision.
         6. flushStats() re-entrancy guard — same class of bug as game.js
            flushAll(), reachable from the timer, visibilitychange,
            beforeunload and walRecoverLearn().
         7. Hidden-tab flush floored at 60s. The run-position localStorage
            write still fires on every hide.

         All caches are uid-namespaced. A shared cart machine must never hand
         one student's progress to the next one who sits down.

learn.js — TypeThatBook School v2.1.0

#### v2.1.0

Batch B: run-level instrumentation. lessonProgress was written from one

         place (the final run's modal, grade != F), so a student stuck on run 2 of
         12 wrote nothing at all and showed in admin as "not started" — the exact
         failure the audit was about was the one the data couldn't show. Now every
         finished run records runAttempts/runFailures/furthestRunIdx/lastSeenAt.
         Writes are queued onto the existing coalesced flush rather than fired per
         run, so this costs no extra Firestore writes or reads. Also fixes
         timeSpentSeconds, which counted only the final run, and adds merge:true to
         saveProgress, which was replacing the whole document.

#### v2.0.0

MAJOR (signed off by Jake 2026-08-01). Lesson mechanics rebuilt after an

         audit found students stalling mid-curriculum and blaming their own typing.
         Full analysis in PEDAGOGY-AUDIT.md. Seven changes:
           1. STEPS ARE CHUNKED INTO RUNS. Six authored steps were longer than a
              10-minute class period at the pace needed to pass them (u6_l2 step 1:
              789 chars at a 20 WPM gate = 10.5 min of flawless typing). Chunking
              happens in the engine, so all 47 lessons are fixed with no data change.
           2. RUN POSITION IS PERSISTED (ttb_learnpos_v1). The old WAL saved stats
              only, so the bell erased the whole run — making any run longer than
              the time left in the period permanently unfinishable.
           3. KEY DRILLS ARE GRADED ON ACCURACY ONLY. Speed on random letter groups
              is not a meaningful measure, and gating it made the new-key drill the
              hardest thing in its own lesson.
           4. WPM IS NET. chars++ ran before the correct/incorrect branch, so errors
              inflated reported speed — three deliberate mistakes could turn a
              failing 14 WPM perfect run into a passing 15 WPM one.
           5. THE GRADED CLOCK PAUSES ON IDLE. It previously ran regardless, so an
              interruption could put the gate out of reach and the app would then
              tell the student to type faster.
           6. C ADVANCES, AND A FAILED RUN RETRIES THAT RUN. Missing the gate on the
              last step used to replay the entire lesson including the intro.
           7. A🔥 IS REACHABLE — a clean run on drills, 1.5× (not 2×) on prose.
         Removed: DRILL_STOP_TIME_THRESHOLD, which did not do what it claimed.
NOTE: the authoritative version is LEARN_VERSION below, not this comment. An
      earlier header claimed v1.0.0 while the constant read 1.6.3; the
      constant was right. This file's real lineage is 1.6.x → 1.7.0.

#### v1.7.1

applyPendingClassAssignment now stamps schoolId alongside classId.

         Without it a student had a class but no building, which made them
         invisible to their own teacher under the new security rules.

#### v1.7.0

Write reduction to match game.js v3.4.0. saveStats() fired on every

         completed lesson step and wrote two documents each time (~20-40
         writes per student per block). Now backed by a localStorage
         write-ahead log with a coalesced flush every 5 min and on session
         end; walRecoverLearn() replays anything unflushed on next load, so
         this is more durable than the old fire-and-forget beforeunload path.
         Also stamps classId/schoolId onto typing_logs for scoped reporting,
         and adds a visibilitychange handler (beforeunload is unreliable on
         Chromebooks).

---

---

## `lessons-admin.js`

Current: **v1.7.1**

#### v1.7.1

Round 6 (Noiseless). **Two functions were wired into the UI and never written.**

         admin.html has the whole "Add one student" form — #student-one-section,
         #student-one-email, #student-one-class, #student-one-add-btn — and
         initStudentsPanel() attached listeners for both `_populateOneStudentClasses`
         and `_addOneStudent`. Neither was declared anywhere in the repo.

         That is not a dormant feature. `addEventListener('click', _addOneStudent)`
         EVALUATES the identifier, so initStudentsPanel() threw a ReferenceError at
         that line and never reached anything after it:

         · Preview CSV and Commit CSV were never wired, so the roster import
           buttons did nothing at all;
         · the Lessons/Books progress tabs were never wired;
         · loadStudentRoster() is the last statement in the function, so the roster
           never loaded — an empty student table was the only visible symptom;
         · and `_studentsInited = true` is set BEFORE the throw, so reopening the
           tab took the early-return path and rebuilt two dropdowns instead of
           recovering. Broken for the rest of the session.

         Both functions were written from _commitCSV() and _bulkAssign() rather than
         from scratch, because the single-student case is exactly one iteration of
         the bulk loop: same users/{uid} vs pendingClassAssignments/{email} split,
         same rule that schoolId must ride along on a create, same roster-cache
         update. admin.html's own help text ("If they haven't, the assignment waits
         for them and applies on their first sign-in") describes the pending path,
         which is how the intent was confirmed rather than guessed.

         Found by undefined-calls-test.mjs, which is new this round and exists
         because of this class of defect. Grep finds one hit for `_addOneStudent`
         and it looks like a reference to something real.

---

## `index.html`

Current: **v3.6.3**

⚠️ **This section was created in Round 5.** index.html had no CHANGELOG section at
all, despite carrying the student-facing library grid, the age/genre filters and
the progress bars — and despite being one of only two files that got the
single-version-constant discipline right (INDEX_VERSION drives both the title and
the footer, since v3.0.1). Entries before v3.3.1 live only in the file header.

<!-- Relocated here in Round 6 (Noiseless). This block was filed under
     ## `game.js`, which never contained the code it describes. -->
#### v3.6.3

Round 7 (Hammond). The About panel now shows `Prepared by` and `Cleaned up by` rows.

         Nothing obliges either credit — the source text is public domain and the
         editorial changes are CC0 — but the first names the volunteers who made the text
         exist, and the second is a plain disclosure that this edition was modified.
         ⚠️ **About only, deliberately.** Jake: *"as it applies to literally every book"*
         — every book in the library gets a cleaning pass, so a "classroom edition" badge
         on the library card would appear on all of them and therefore mean nothing. Same
         reasoning as v3.26.0's cry-wolf licence warning.

#### v3.6.2

Round 7 (Hammond). Library-card About panel row label `Licence` → `License`. Cosmetic
only; `creditLinkFor()` and the `rights` field are untouched.

#### v3.6.0

Round 5 (Mignon). **"The index page is ugly" was not a styling problem. The markup
was invalid.**

         v3.5.0 put a licence `<a>` and an About `<button>` INSIDE the card, which
         was itself an `<a>`. HTML forbids both: an anchor may not contain another
         anchor or a button. Browsers do not ignore that — they RECOVER from it, and
         the recovery closes the outer `</a>` early and reparents everything after
         the offending tag. Which is exactly what Jake saw: the credit line splitting
         mid-sentence, half of it and the About button sitting on the page background
         outside the card, the card's white background stopping short.

         Measured with card-markup-test.mjs, which parses the output as a real DOM:
         the v3.5.0 structure yields TWO grid children instead of one, with both the
         credit and the About button outside the card. The `<a>` now wraps only the
         cover and metadata; credit and About are siblings inside a plain `<div>`
         card. Nine structural assertions across three book shapes.

         ALSO:
         · CACHE KEY BUMPED to ttb_booksCache_v2. The cache stores a snapshot of the
           book objects, so v3.5.1's aboutTitles never reached a browser that already
           had a cache — for up to six hours. That is why Jake still saw "NOTICE" on
           every About section AFTER the fix shipped: the code was live and the data
           feeding it was stale. ⚠️ Any future change to what is cached needs this
           number bumped or the change silently does nothing.
         · ARCHIVE URL WITHOUT A SCHEME is a relative path.
           "typethatbook.misterwilson.org/library/x.epub" resolved against the
           current page and produced ".../typethatbook.misterwilson.org/library/x.epub".
           Now prefixed with https:// when no scheme is present, and any non-http(s)
           scheme is refused rather than rendered as a link.
         · Opens the About panel on arrival at index.html#about=<bookId>, from
           game.js v3.12.2's completion screen. Hooked into all THREE paths that
           populate allBooks — fresh, cached and stale-cache — because a reader
           arriving from the completion screen must get the panel regardless of which
           one served them.

<!-- Relocated here in Round 6 (Noiseless). Filed under ## `game.js`, which
     does not render the About panel. HANDOFF §7 records the bug as index.html’s. -->
#### v3.5.1

Round 5 (Mignon). Three rendering bugs, all found by Jake's screenshots rather
than by me reading the code.

         1. `[object Object]`, once per paragraph, where the copyright notice
            should have been. **A segment is `{ text: "…" }`, not a string** —
            admin.js has always stored it that way — and String({}) is
            "[object Object]". I wrote `escapeHtml(String(t))` without ever
            checking the shape. Also strips the leading tab admin.js prepends for
            paragraph indentation: meaningful when typing, just a gap when reading.
         2. Every section headed **"Notice"**. The lookup used `book.chapters`,
            which the grid STRIPS before caching — the same fact that made
            `aboutIds` necessary in v3.5.0, applied to the ids and not to their
            titles. `aboutTitles` is now captured at load time alongside them.
         3. The card credit printed a **raw URL as its own link text**, so "CC0 1.0
            Public Domain Dedication https://creativecommons.org/publicdomain/zero/1.0/"
            became four wrapped underlined lines that dwarfed the book's title. The
            licence VALUE containing its URI is correct and deliberate — a licence
            URI is what CC asks for — so the fix belongs in the rendering. New
            creditLinkFor() uses the label as the link text and keeps the URI in the
            href, shared by the card and the panel.

         Verified with about-render-test.mjs: eight segment shapes including {} and
         undefined, three headings from a cache-stripped book, and six credit values
         including one carrying an event-handler injection in both the label and the
         URL.

<!-- Relocated here in Round 6 (Noiseless). This block was filed under
     ## `game.js`, which never contained the code it describes. -->
#### v3.5.0

Round 5 (Mignon). The **About this book** panel. Renders the pages flagged
about:true — imprint, colophon, licence, uncopyright — VERBATIM, from the
document actually being served. Not a paraphrase on a card, not a link to a copy
hosted somewhere else. That is what a Creative Commons notice asks for, and it is
what deleting front matter was destroying.

         ⚠️ COST. The credits TEXT is a chapters-subcollection read, one document
         per page, and is NOT fetched on page load — only when someone opens the
         panel, then cached for the session. A book nobody asks about costs nothing.
         `aboutIds` is extracted from the chapter array at LOAD time precisely
         because that array is stripped before caching, so the ℹ button survives a
         cached grid while the text does not need to.

         The ℓ button renders only when a book HAS credits pages, so a book whose
         front matter was deleted shows nothing rather than an empty box. A failed
         subcollection read leaves the credits block standing, since that block is
         what carries the licence URI.

         ⚠️ The card is itself an <a>, so the ℹ handler needs preventDefault AND
         stopPropagation or clicking it navigates into the book. Delegated once at
         init rather than rebound per render.

         linkifyText() was hoisted to module scope and is now shared by the card and
         the panel — two copies of an escaping rule is one copy too many. This broke
         credit-test.mjs, which was extracting it by matching source text, and that
         is the correct thing for the test to have done. Now nine cases including a
         hostile book id in the button's data attribute.

#### v3.4.0

Round 5 (Mignon). Renders the attribution line on the library card, under the
author, in deliberately quiet type — it is a legal requirement rather than
something a ten-year-old needs to read, and it must not compete with the title.
Renders NOTHING when both fields are empty, which is every public domain book in
the library. URLs become links with target="_blank" and rel="noopener noreferrer",
so a student clicking a licence does not lose their place in a book.

         ⚠️ SECURITY. This string is admin free text going into innerHTML.
         index.html's escapeHtml() is DOM-based (textContent -> innerHTML), which
         neutralises < > & but NOT quotes — quotes need no escaping in element
         content, and very much do inside an href. The first draft matched URLs with
         [^\s<]+, so a "URL" of
             https://x.test/"onmouseover="alert(1)
         survived escaping, matched as a single URL, and closed the href early to
         inject an event handler. Fixed by excluding quotes from the URL character
         class AND escaping them in the attribute — both, deliberately.

         Verified with credit-test.mjs across a CC book, a public domain book,
         partially-tagged books, two XSS attempts and a two-URL field. The test
         PARSES the output as a DOM rather than regexing it, because an earlier
         version flagged correctly-escaped "&lt;img onerror=...&gt;" as unsafe on the
         strength of the literal text — the only way to tell an attribute from text
         that resembles one is to build the DOM and ask.

#### v3.3.2

Round 5 (Mignon). Reads bodyIndex/bodyTotal off the progress document when
game.js v3.10.0 has written them, which closes v3.3.1's known limitation: a
part-numbered book on a CACHED grid can now be placed exactly, because those two
integers survive the cache while the chapter list does not. Preference order is
progress fields → chapter list → arithmetic, so every older combination still
degrades the way v3.3.1 documented.

#### v3.3.1

Round 5 (Mignon). Two bugs in the library progress bar, one of them ugly.

         1. THE DENOMINATOR COUNTED FRONT AND BACK MATTER. totalChapters includes
            the imprint, the colophon and the uncopyright page, so finishing every
            fable in Aesop still left three pages between the reader and 100% and
            the bar never filled. This is bodyChapters' first consumer — the field
            has been written since v3.18.x with nothing reading it.
         2. parseInt() ON A CHAPTER ID. Part-numbered books use ids like 1.01 and
            2.09 — Heidi, Treasure Island, Little Women, The War of the Worlds.
            parseInt("2.09") is 2. **A student who had finished all 23 chapters of
            Heidi saw "Ch. 2 / 27" and a bar at 7%**; one fourteen chapters in saw
            "Ch. 1 / 27" at 4%. For a project whose open question is why students
            stall without generating progress data, a progress bar that does not
            move is not a cosmetic defect. The ordinal now comes from the chapter
            LIST rather than from arithmetic on the label.

         Degrades in three steps, because the data is not always present: chapter
         list available → exact ordinal among body chapters; list stripped (the grid
         strips it before caching, it being the largest field on the document) or
         document older than admin.js v3.19.1 → parseFloat rather than parseInt, so
         2.09 rounds to 2 instead of truncating silently; no bodyChapters at all →
         previous behaviour exactly.

         Verified with progress-test.mjs, which lifts the patched block out of the
         file and runs it over a part-numbered book, a cache-stripped document, a
         pre-v3.19.1 document and a garbage progress value.

         ⚠️ KNOWN LIMITATION: from a CACHED grid a part-numbered book still reads
         low, because the exact ordinal needs the chapter list. The proper fix is for
         game.js to write the body ordinal alongside progress. Queued, not done.

---

## `style.css`

Current: **v3.5.0**

⚠️ **Section created in Round 5.** style.css had no CHANGELOG section despite owning
every colour a student reads. Entries before v3.4.0 live only in the file header.

<!-- Relocated here in Round 6 (Noiseless). This block was filed under
     ## `game.js`, which never contained the code it describes. -->
#### v3.5.0

Round 5 (Mignon). **`#modal-body` no longer uses `justify-content: center`.**

         That property on a scrollable flex container CLIPS THE OVERFLOW AT THE
         START, and the clipped region cannot be scrolled to — the scrollbar appears
         and works, but everything above the scroll origin is unreachable. Which is
         what Jake hit: "scroll is there, but not there enough to utilize", with the
         Game Genie title appearing to cover the chapter picker it was in fact
         sitting above. The Genie panel is the tallest thing that ever goes in this
         modal, so it is the only one that overflowed far enough to lose content.

         `flex-start` plus auto margins on the first and last child gives both
         behaviours with no @supports and no browser caveats: short content still
         centres, tall content pins to the top and every pixel stays reachable.

#### v3.4.0

Round 5 (Mignon). **Classic view contrast inverted.** `.letter` was `#ccc` and
`.letter.done-perfect` was black — light grey for the words about to be typed, full
black for the words already behind the cursor. That is backwards for the only reader
who matters: the text a student is reading AHEAD needs the contrast, and #ccc at
reading size is close to invisible for a struggling eleven-year-old. Typed-and-correct
is now `--ink-spent` (#9b968e) — legible if you look back, out of the way if you
don't. done-fixed (blue) and done-dirty stay loud, because those are diagnostics
rather than prose. The tab guide moved from #ddd to #b8b2a8, having been chosen to
sit beside light grey text and being invisible beside black.

Adventure mode was fixed this way some time ago. Classic never was, and Classic is
what a student sees by default.

## ARCHIVED FILE HEADERS — moved 2026-08-22 (Round 28, Daugherty)

### learn.js v2.36.0 — archived by Round 58 (Emerson), 8-entry budget

Pushed over the budget by v2.44.0 (ROADMAP 49, the stale hard-stop overlay).
Verbatim, nothing deleted.

⚠️⚠️ **TEN LIVE COMMENTS IN `learn.js` STILL CITE v2.36.0** — `remediationRun`'s
guard, the run-list rebuild in `startLesson()`, the `practice` stamp on the
session record, both modal exits, and the note that records written *before*
v2.36.0 carry no stamp and cannot be told from real runs. **So this is where
those citations resolve**, and the pointer left in v2.37.0's entry is
load-bearing rather than courtesy — §0.-30.G's rule about checking for citations
before archiving an entry.

It is the round that stopped the 🎲 practice-missed-keys drill being graded as
the lesson's run 1 — a clean 83-character random drill scoring A🔥 and unlocking
the next lesson.

```
// v2.36.0 — ⚠️⚠️ A REMEDIATION DRILL WAS BEING GRADED AS A RUN OF THE LESSON.
//           "🎲 Practice missed keys" replaces currentRuns with a synthetic
//           key_random drill and deliberately leaves currentLesson alone, so
//           everything downstream read it as the lesson's run 1: logRun() filed
//           a sprint under the lesson's id, recordRunOutcome() banked mastery
//           points into runScores["0"] and wrote runCount: 1 over a 12-run
//           lesson's count, and saveProgress() marked the WHOLE LESSON passed.
//           ⚠️ AND key_random IS ACCURACY-ONLY, so a clean 83-character random
//           drill scored A🔥 and unlocked the next lesson. remediationRun now
//           branches ABOVE the isLastRun fork — both modals write, so a guard in
//           one still grades a multi-chunk drill. ⚠️ THE MINUTES STILL COUNT, in
//           BOTH records: this is NOT ROADMAP 10's practice run, and suppressing
//           them would manufacture item 4's divergence. tests/remediation-test.mjs.
//           ⭐ ROADMAP 15 — runGrades/runFires store the grade WHERE IT IS
//           EARNED (runScores is a SUM and cannot tell one A🔥 from two A's), and
//           the grade rule moved to run-grade.js so reports.html can reconstruct
//           without a second copy of it. Rule 9: the copies here are DELETED.
//
```

### admin.js v3.31.2 — archived by Round 57 (Bar-Lock), 8-entry budget

Second archive from this file in one round; the ladder extraction pushed it back
over 8. Verbatim, nothing deleted.

⚠️ **It records `ADMIN_EMAILS` collapsing to one home in `firebase-config.js`** —
four hand-maintained copies, nothing drifted, *"which is luck, not design."*
Worth reading next to Round 57's ladder extraction, which is the same move for
the same reason: `build-panel-test.mjs` §E fails if a second literal list
reappears under any name, and `metadata-map-test.mjs` Part F now does the
equivalent for the licence ladder.

```
// v3.31.2 — IMPORT ONLY, NO BEHAVIOUR. ADMIN_EMAILS is imported from
//           firebase-config.js instead of declared here. It was one of FOUR
//           hand-maintained copies of the same two addresses; nothing had
//           drifted, which was luck. HANDOFF §0.-20.H. v3.25.2's entry moved
//           to CHANGELOG.md § ARCHIVED FILE HEADERS — this file was one over
//           the 8-entry budget once v3.31.2 was added.
//
// Book authoring: EPUB import, chapter editor, metadata and tags, language
// filter, CSV export. Hosts the Lessons and Staff panels from their own files.
//
```

### game.js v3.42.0 and learn.js v2.35.0 — archived by Round 57 (Bar-Lock), 8-entry budget

Both files hit the 8-entry budget in the same round for the same change
(ROADMAP 9). Archived verbatim; nothing deleted.

⚠️ **game.js v3.42.0 is "I'm Done" (ROADMAP 0d)** and THREE entries still in the
live header cite it — v3.42.1, v3.42.2 and v3.42.3 are all follow-ups to it.
This block is where those pointers resolve.

⚠️ **learn.js v2.35.0 is the "open at the first run that still counts" rule**,
and it is the behaviour ROADMAP 34 is about to be measured against: it is why a
student re-entering a lesson lands on their first unmastered run rather than at
the top. Read it before touching the mastery lock.

```
// v3.42.0 — "I'M DONE" (ROADMAP item 0d). A student-facing exit that files the
//           open sprint and takes a `final` flush, then shows receipt.js's
//           stamped card. ⚠️ IT IS A RECEIPT, NOT A SAVE BUTTON — nothing is
//           gated on it, nothing warns if it is skipped, and ← Library and
//           (Logout) remain untouched. See handleImDone() and receipt.js.
//
// Typing engine, sprint timer, WPM/accuracy, streaks, leaderboard, practice
// mode, chapter navigation, all modals, write-ahead-log persistence.
//
```

```
// v2.35.0 — ⚠️⚠️ A LESSON NOW OPENS AT THE FIRST RUN THAT STILL COUNTS. Jake:
//           "if the first one is locked, students have no way to get to the
//           second run legitimately." Runs are typed in order, so a student whose
//           run 1 was mastered had to replay it FOR NOTHING to reach the run that
//           still pays — the gate was taxing the student it meant to move along.
//           firstOpenRunIdx() is well-defined because DOWNWARD CLOSURE makes the
//           mastered runs a PREFIX and the open runs a SUFFIX; loosen closure and
//           it must be rewritten, not patched. tests/run-mastery-test.mjs — which
//           learn.js had CITED SINCE ROUND 32 WITHOUT IT EXISTING, now written.
//
```

### game.js v3.42.0 and learn.js v2.35.0 — archived by Round 57 (Bar-Lock), 8-entry budget

Both files hit the 8-entry budget in the same round, for the same change
(ROADMAP 9). Archived verbatim, nothing deleted.

⚠️ **game.js v3.42.0 is "I'm Done" (ROADMAP 0d)** and three later entries still
in the live header cite it — v3.42.1, v3.42.2 and v3.42.3 are all follow-ups to
it. This block is where those pointers resolve.

⚠️ **learn.js v2.35.0 is the "open at the first run that still counts" rule**,
which is the behaviour ROADMAP 34 is about to be measured against: it is the
reason a student re-entering a lesson lands on their first unmastered run rather
than at the top. Read it before touching the mastery lock.

```
// v3.42.0 — "I'M DONE" (ROADMAP item 0d). A student-facing exit that files the
//           open sprint and takes a `final` flush, then shows receipt.js's
//           stamped card. ⚠️ IT IS A RECEIPT, NOT A SAVE BUTTON — nothing is
//           gated on it, nothing warns if it is skipped, and ← Library and
//           (Logout) remain untouched. See handleImDone() and receipt.js.
//
// Typing engine, sprint timer, WPM/accuracy, streaks, leaderboard, practice
// mode, chapter navigation, all modals, write-ahead-log persistence.
//
// ── Full history: CHANGELOG.md § game.js ──────────────────────────────────
//
// ⚠️ v3.43.0 — 33 OLDER ENTRIES (v3.39.0 back to v3.17.0) MOVED TO CHANGELOG.md
//    § ARCHIVED FILE HEADERS. Nothing was deleted. The header budget is
//    PROPORTIONAL now — see versions.js's HEADER_MAX_LINES — so this block is
//    allowed to grow as the file does. The ENTRY budget is not proportional and
//    is the one that fired: a changelog nobody scrolls to the bottom of is the
//    defect, and it does not get better because the file got bigger.
//
// ── Load-bearing. Do not "simplify" these ─────────────────────────────────
//
//   * The write-ahead log is MORE durable than the per-sentence writes it
//     replaced. visibilitychange:hidden is the flush event that matters;
//     beforeunload does not fire reliably on Chromebooks.
//   * The leaderboard cache is deliberately NOT busted on the hot path.
//     Doing so cost ~$34,300/year at 7,000 students.
//   * VIEW_MODE is `let`. It changes at runtime three ways: Settings, the
//     splash, and reconciliation against the student's Firestore profile.
//   * applyViewMode() must replay textLoaded + positionSet. A renderer
//     mounted mid-session missed those events and will draw nothing.
import { db, auth, ADMIN_EMAILS, isStaffUser } from "./firebase-config.js";
// ROADMAP item 10's gate lives in School, but its clock is fed from BOTH pages —
// Jake: "when I say a month, I mean a month of typing ANYTHING". A student who
// spends the period in Library is having an active day, and a School lesson must
// know about it. ⚠️ THIS FILE IMPORTS THE MODULE ONLY TO COUNT DAYS; it renders
// no lesson gate and must not start.
import { activeDayPlan } from "./lesson-gate.js";
// The day/week counters' WAL, shared with learn.js. Extracted BECAUSE this
// file's WAL was the bug: one key held reading position (book-scoped) and the
// time counters (not book-scoped), and walRecover()'s correct bookId guard
// meant the counters were declined on a book switch and then overwritten.
import { statsWalSave, statsWalRecover } from "./stats-wal.js";
// The sprint/run history queue, shared with learn.js. Extracted BECAUSE the
// rollup writer lived here and nowhere else: lesson mode wrote no sprint detail
// at all, and this file dated every rollup at flush time rather than at typing
// time. See session-log.js for both defects.
import {
    sessionLogInit, sessionLogPush, sessionLogFlush,
    // sessionLogPendingSeconds is NOT imported — see the daylog.js import note.
    sessionLogPending, sessionLogAdopt, sessionLogTake, GUEST_QUEUE_UID,
} from "./session-log.js";
// The time readout, shared with learn.js. Extracted BECAUSE this file's timer
// slot held three different quantities depending on settings, and School's held a
// fourth. DOM-free: it returns strings and this file writes them.
import { hudStrings, HUD_VERSION, hudCacheSave, hudCacheLoad,
         celebrationDone, celebrationMark } from "./hud.js";
// ⚠️ v3.41.0 — THE CELEBRATIONS MOVED OUT. They were a hand-maintained twin of
// learn.js's, and the two had already drifted. celebrate.js owns them now; this
// file decides WHETHER to celebrate, that file decides HOW. Do not re-add a
// local launchFireworks() — "make the fireworks bigger" must stay ONE edit.
// showGoalToast is intentionally NOT imported: celebrate.js raises its own
// toast as part of each celebration. It stays exported there for any future
// caller that wants the banner without the animation.
import { launchConfetti, launchFireworks } from "./celebrate.js";
import { showReceipt } from "./receipt.js";
// ⚠️ HANDOFF §0.0 — the student now reads the GRADED document. See daylog.js.
// ⚠️ readDaySessions/projectDayTotal are NOT imported. They exist in daylog.js
// and are used by nothing shipped — v3.34.0 reverted the projection. Leaving the
// import in would make it one keystroke to re-enable a grade computed from
// records known to overlap. See HANDOFF §0.0 before touching this line.
import { readWeek, invalidateWeek, applyWeekToStats, dayLogPayloadFor, SOURCE_SPLIT_CUTOVER, DAYLOG_VERSION,
         carryOverPlan, carryOverPayloadFor, sourceTotalsOf } from "./daylog.js";
import { qualifyingChars, VARIETY_FLOOR_VERSION } from "./variety-floor.js";
// The version footer's three primary reads (this html file, this js file's own
// VERSION, style.css) plus the lazy full-build panel on hover. See
// updateVersionBanner() below and the header on readOneDeployedVersion() for
// why this doesn't just re-fetch game.js from inside itself.
import { readOneDeployedVersion, readDeployedVersions, renderBuildList,
         countBuildNotes, renderHiddenNotesLine,
         readAppliedCssVersion } from "./versions.js";
// serverTimestamp is imported for ONE purpose: to hand it to session-log.js so
// rollups carry a clock the student cannot set. It is not used anywhere else in
// this file, and ⚠️ it must not be: a serverTimestamp() sentinel inside a
// setDoc(merge:true) on typing_logs would be a second
// dating scheme on the documents Round 12 spent a day reconciling.
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, addDoc, query, orderBy, limit, where, updateDoc, getCountFromServer, serverTimestamp, arrayUnion } from "./read-meter.js";
import { noteDay, ensureSince } from "./logdays.js";
import {
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";

// ⚠️ THIS LINE IS THE VERSION — the comment at the top of the file is decoration.
// versions.js parses THIS, the footer renders THIS, and ROADMAP's verification
// steps tell Jake to read THIS. It sat at "3.38.0" across six releases, through
// the whole of Round 26, and the stale-day fix that shipped in v3.38.1 was
// therefore invisible from the chair. Bump it in the SAME EDIT as the header
// entry above, always. tests/version-stamp-test.mjs now fails the suite if you
// do not.
const VERSION = "3.47.0";

// Hand the shared session queue its Firestore surface. Done at module scope,
// once, because session-log.js imports no SDK of its own on purpose — one page
// controller's Firestore version is the only one that should ever be in play.
//
```

```
// v2.35.0 — ⚠️⚠️ A LESSON NOW OPENS AT THE FIRST RUN THAT STILL COUNTS. Jake:
//           "if the first one is locked, students have no way to get to the
//           second run legitimately." Runs are typed in order, so a student whose
//           run 1 was mastered had to replay it FOR NOTHING to reach the run that
//           still pays — the gate was taxing the student it meant to move along.
//           firstOpenRunIdx() is well-defined because DOWNWARD CLOSURE makes the
//           mastered runs a PREFIX and the open runs a SUFFIX; loosen closure and
//           it must be rewritten, not patched. tests/run-mastery-test.mjs — which
//           learn.js had CITED SINCE ROUND 32 WITHOUT IT EXISTING, now written.
//
import { db, auth, ADMIN_EMAILS, isStaffUser } from "./firebase-config.js";
// ROADMAP item 10 — the lesson-farming gate. ⚠️ PURE MODULE, NO FIRESTORE: every
// rule in it is a function of numbers this file passes in, which is why the whole
// design is covered by lesson-gate-test.mjs without driving a browser.
import { activeDayPlan, activeDayCountOf, fireCountOf, isMastered,
         lessonModeFor, runModeFor, runScoreOf, runMastered, pointsForGrade,
         lastLockDayOf, furthestIndexOf, reachBackFor,
         MASTERY_POINTS, MASTERY_FIRE_COUNT, REACH_BACK_DAYS } from "./lesson-gate.js";
// ROADMAP item 15 — the grade rule. ⚠️ PURE MODULE, AND THE ONLY COPY: every
// function below used to live in this file, and reports.html needed all of them
// to reconstruct a grade. Two copies of calculateGrade() is the shape Rule 9
// forbids, so the copies here were DELETED in the same deploy that added this
// import. ⚠️ gatesForRun() TAKES THE LESSON'S GATES AS AN ARGUMENT now — the
// old one read `currentLesson` out of module scope, which is what made it
// impossible to call from anywhere else.
import { calculateGrade, gradeAdvances, gatesForRun, betterGrade,
         chunkSequence, DRILL_TYPES, FIRE_GRADE, GRADE_ORDER,
         REACH_HOME_COMPANION, CHUNK_TARGET, CHUNK_SLACK,
         RUN_GRADE_VERSION } from "./run-grade.js";
// The day/week counters' WAL, shared with game.js. It is a separate module
// because the counters are the one piece of state that is true regardless of
// which page or which book a student is on, and both previous copies of it were
// scoped to something narrower than that. See stats-wal.js for the bug.
import {
    statsWalSave, statsWalRecover,
    guestAccumSave, guestAccumLoad, guestAccumClear
} from "./stats-wal.js";
// The sprint/run history queue, shared with game.js. ⚠️ THIS FILE HAD NO SESSION
// LOGGING OF ANY KIND BEFORE v2.6.0 — see the header. A run is the lesson-mode
// equivalent of a sprint: a bounded stretch of typing with a duration, a
// character count and a derived WPM, which is exactly what the module stores.
import {
    sessionLogInit, sessionLogPush, sessionLogFlush, sessionLogPending,
    sessionLogAdopt, sessionLogTake, GUEST_QUEUE_UID,
} from "./session-log.js";
// The time readout, shared with game.js. ⚠️ Both pages render the SAME string in
// the SAME element id — see hud.js for why that is the whole point.
import { hudStrings, HUD_VERSION, hudCacheSave, hudCacheLoad,
         celebrationDone, celebrationMark, fmt } from "./hud.js";
// ⚠️ v2.26.0 — THE "copied from game.js" BLOCK IS GONE, and its header said so
// in as many words for months. celebrate.js owns the celebrations; School and
// Library now show the SAME one. Do not copy it back.
// showGoalToast is intentionally NOT imported: celebrate.js raises its own
// toast as part of each celebration. It stays exported there for any future
// caller that wants the banner without the animation.
import { launchConfetti, launchFireworks } from "./celebrate.js";
import { showReceipt } from "./receipt.js";
// ⚠️ ROADMAP 0b. The reading-font model MOVED here from this file in v2.28.0 —
// there is no local copy left and there must not be a new one. `openMenuModal()`
// in game.js is deliberately NOT imported: it reaches into book, chapter, sprint
// and view state School has none of. This module is its shape, not its body.
import { openSettingsPanel, buildSettingsButton, applyDrillFont, readDrillFont,
         SETTINGS_PANEL_VERSION } from "./settings-panel.js";
// ⚠️ HANDOFF §0.0 — the student now reads the GRADED document. See daylog.js.
// ⚠️ readDaySessions/projectDayTotal deliberately NOT imported — v2.19.0
// reverted the projection. See HANDOFF §0.0.
import { readWeek, invalidateWeek, applyWeekToStats, dayLogPayloadFor, SOURCE_SPLIT_CUTOVER, DAYLOG_VERSION,
         carryOverPlan, carryOverPayloadFor, sourceTotalsOf } from "./daylog.js";
import { qualifyingChars, VARIETY_FLOOR_VERSION } from "./variety-floor.js";
// ⚠️ v2.23.0 — THE DRILL TEXT FILTER. A student reported "ass" in a lesson.
// Whole-group matching on Jake's ruling: `lass`, `mass` and `asse` are FINE.
// See drill-filter.js's header — it holds the ruling and its edge cases.
import { safeGroup, DRILL_FILTER_VERSION } from "./drill-filter.js";
// The version footer's three primary reads (this html file, this js file's own
// LEARN_VERSION, style.css) plus the lazy full-build panel on hover. ⚠️ SAME
// STRUCTURE AS game.js, ON PURPOSE — see updateVersionFooter() below.
import { noteDay, ensureSince } from "./logdays.js";
import { readOneDeployedVersion, readDeployedVersions, renderBuildList,
         countBuildNotes, renderHiddenNotesLine,
         readAppliedCssVersion } from "./versions.js";
import {
    collection, getDocs, query, where, doc, getDoc, setDoc, addDoc, deleteDoc,
    // Aggregation query. Firestore bills getCountFromServer at ONE read per up
    // to 1000 matched index entries, which is what makes the lessons cache
    // validation cost 1 read instead of ~80. Available since SDK v9.11.
    getCountFromServer,
    // v3.46.0 — for logdays.js's ledger write. See the noteDay() call in the
    // flush path below and the ordering rule in logdays.js's header.
    updateDoc, arrayUnion,
    // v2.7.1 — for session-log.js's `serverAt` and nothing else. ⚠️ Do not reach
    // for it in flushStats(): a sentinel inside the typing_logs or
    // typing_logs merge writes would be a second dating scheme on the
    // two documents Round 12 spent a day getting to agree.
    serverTimestamp
} from "./read-meter.js";
import {
    onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    FINGER_COLORS, FINGER_NAMES, LAYOUTS, KB_VERSION,
    createKeyboard, buildFingerMap, getFingerInfo,
    createHandGuide, buildFingerSVG, setHandGuideToChar, setHandGuideToChars,
    resetHandGuideToHome, colorKeyboardKeys, flashFingerPressed,
    getHomePositions, getKeyCenterInKB, toggleKeyboardCase
} from "./keyboard.js";

// ─── Constants ────────────────────────────────────────────────────────────────
// ⚠️ THIS LINE IS THE VERSION — the comment at the top of the file is decoration.
// versions.js parses THIS, the footer renders THIS, and ROADMAP's verification
// steps tell Jake to read THIS. It sat at "2.23.1" across five releases. Bump it
// in the SAME EDIT as the header entry above, always.
// tests/version-stamp-test.mjs now fails the suite if you do not.
const LEARN_VERSION = "2.43.0";

// Hand the shared session queue its Firestore surface, once, at module scope.
// session-log.js imports no SDK of its own on purpose — see that file.
//
// ⚠️ THIS LINE MUST MATCH game.js's. Both page controllers configure the same
// shared module, and a dependency passed on one side and not the other means
// School and Library write differently shaped documents — which is the R2
// symmetry failure DESIGN-TELEMETRY.md exists to prevent, in its smallest
// possible form. session-merge-test.mjs Part C asserts the two calls agree.
//
```

### admin.js v3.31.1 — archived by Round 57 (Bar-Lock), 8-entry budget

⚠️ **Archived, not deleted, and it is the entry that predicted this round.** It
records two import-metadata defects found by `metadata-map-test.mjs` after that
harness had been dismissed for several rounds as *"a book-metadata question, not
an app defect."* Round 57 found the same harness's next 39 assertions dismissed
the same way, in writing — and those WERE rot. The opposite error, from the same
habit of ruling on a red harness without opening it.

⚠️ **Its half (1) is why 72 of 74 books now map to the combined licence.** That
is the fix which made `dc:rights` read ALL its elements rather than only the
first, so a book carrying a public-domain statement AND a CC0 dedication keeps
both. The bookclean pipeline now emits a single sentence carrying both halves,
and the same code path serves it.

```
// v3.31.1 — TWO IMPORT-METADATA DEFECTS, both surfaced by the harness that had
//           been failing 42 assertions for several rounds and was recorded in
//           HANDOFF §6 item 3 as "a book-metadata question, not an app defect."
//           It was an app defect. Twice.
//
//           (1) dc:rights read only its FIRST element. Standard Ebooks emits
//           two — a short "Public domain (United States)" and then the CC0
//           dedication — so every SE book carrying both had the CC0 half of its
//           licence silently dropped at import. Identical in shape to the
//           dc:source bug fixed in v3.26.0, sitting two lines away.
//
//           (2) readInBookSignals() no longer loses the transcriber credit on a
//           bookclean'd Gutenberg import. The pass strips the
//           #pg-machine-header wrapper and keeps its contents; the Credits
//           lookup was scoped to that id and therefore found nothing on all
//           thirteen cleaned Gutenberg books in library/. Falls back to the
//           whole document, gated on the page mentioning gutenberg.org so the
//           original protection against "Credits" in book prose survives.
//           Found by tests/metadata-map-test.mjs v1.4.0 — the harness that had
//           been failing 42 assertions for several rounds and was recorded as
//           "not an app defect."
//
```

### admin.js v3.28.0 and v3.27.0 — archived by Round 55, 8-entry budget

⚠️ **admin.js still cites both in live code** — v3.28.0 five times and v3.27.0
four, including one citation of v3.28.0 from inside the v3.29.0 entry itself.
This block is where those pointers resolve.

⚠️⚠️ **THEY WERE ARCHIVED IN THE ROUND THAT CAUGHT ADMIN.JS LYING ABOUT ITS OWN
VERSION.** The constant read `3.33.0` while the header carried honest v3.34.0 and
v3.35.0 entries whose code is demonstrably present in the file
(`readStandardEbooksSignals`, `findStandardEbooksProducer`, the generic
`readEpubMetadata` contributor read). **The header was true and the constant was
stale** — the reverse of Round 27's five files, and the same defect class. The
constant is what `versions.js` parses and what the in-page build footer renders,
which is the only diagnostic available at a classroom machine, so admin.js has
been reporting a two-round-old version to the one instrument that exists to
prevent exactly this.

```
// v3.28.0 — ⚠️ THE GENRE DROPDOWN HAD NO "Custom…" OPTION AND WAS ERASING DATA. The
//           population loop appended GENRES and nothing else, so the __custom__ value that
//           THREE handlers tested for could never occur and Sports had no way back into the
//           list. Worse, the load path was `genreSelect.value = meta.genre`: a stored genre
//           with no matching option sets selectedIndex -1, reads back as '', and the next
//           Save Metadata wrote genre:''. Proven in jsdom. Genre is now the fourth field on
//           readSelectOrCustom/writeSelectOrCustom/wireCustomSelect; Sports restored; a
//           leading blank option added, without which a fresh form defaulted to "Adventure"
//           and the autofill's !value guard declined to fill the genre it had just guessed.
// v3.27.0 — CLASSROOM EDITIONS ARE NOT PUBLIC-DOMAIN-ONLY: rewording slurs is an editorial
//           contribution and needs its own licence. readInBookSignals() does ONE spine walk
//           (cap 4) for the classroom notice, Gutenberg's origin link and its Credits row; a
//           cleaned PD-only book moves to combined PD+CC0, a CC BY book never does. New
//           'Prepared by' field; 'Cleaned up by' is now a select.
```


### learn.js v2.34.0 — archived by Round 55 (second pass), 8-entry budget

⚠️ learn.js still cites v2.34.0 in live code — the `recordRunOutcome()` header
block. This is where that pointer resolves.

```
// v2.34.0 — ⚠️⚠️ ROADMAP 14 — MASTERY IS CUMULATIVE POINTS PER **RUN**.
//           A🔥 = 2, A = 1, B and below = 0, LOCKED AT 4. recordRunOutcome()
//           banks the points where the grade already is — which is the fix for
//           item 13: the student is shown fire for a RUN and fireCount only ever
//           counted a LESSON, so Jake's record read lastGrade "A🔥" beside
//           fireCount 0 after three fireballs in a row.
//           ⚠️ DOWNWARD CLOSURE: mastering run k closes runs 0..k-1 of the SAME
//           lesson only — lesson 2 never touches lesson 1. ⚠️ practiceRun is now
//           armed PER RUN in beginStep(), not once per lesson: one lesson can
//           hold a mastered run and an unmastered one at the same time.
//           ⚠️ lastLockDay REPLACES lastAdvanceDay and stampAdvanceIfNew() is
//           GONE — the clock runs from the last LOCK, so a student grinding one
//           run no longer accrues reach-back while farming. runScorePill() shows
//           the score, because the old rule was unfalsifiable from outside.
//           tests/run-mastery-test.mjs.
//
// Lesson-mode engine, separate from game.js. Same write-ahead-log and
// coalesced-flush persistence pattern.
//
// ── Full history: CHANGELOG.md § learn.js ─────────────────────────────────
// ── Why it looks like this: PEDAGOGY-AUDIT.md ─────────────────────────────
//
// ⚠️ v2.31.0 — 39 OLDER ENTRIES (v2.26.0 back to v2.2.0) MOVED TO CHANGELOG.md
//    § ARCHIVED FILE HEADERS. Nothing was deleted. Same reasoning as game.js.
//
// ── Load-bearing ──────────────────────────────────────────────────────────
//
//   * saveProgress() uses merge:true. Without it, completing a lesson erases
//     every run-level field.
//   * ttb_learnwal_v1 and ttb_learnpos_v1 both carry an explicit `v`. Bump it
//     rather than changing the payload shape, or a mid-run student on the old
//     shape gets a corrupt resume.
//   * Do NOT scale gates by grade level. An 8th grader may have had this
//     teacher twice or never; unit position is the only honest signal.
```


### learn.js v2.33.1 — archived by Round 55, 8-entry budget

⚠️ **learn.js still cites v2.33.1 twice in live code** — the exitLessonToMap()
block (`⚠️⚠️ v2.33.1 — LEAVING A LESSON MUST BANK THE RUN, NOT JUST THE TIME.`)
and the reload note further down (`⚠️ v2.33.1 — THIS USED TO BE
loadUserProgress().then(...)`). This block is where both pointers resolve.

```
// v2.33.1 — ⚠️⚠️ ROADMAP 14b — "← MAP" BANKED THE TIME AND THREW AWAY THE RUN.
//           stopLesson() reloaded progress on the way out, and loadUserProgress()
//           opens by EMPTYING userProgress — so every run outcome recorded in
//           memory died before the scheduled flush could read it, while
//           pendingProgress still named the lesson, so the flush wrote the
//           freshly-reloaded copy back and reported success. ⚠️ THE WRITE NEVER
//           FAILED; it stored the numbers it had just read. Jake's u1_l1 read
//           runAttempts {0:1, 1:2} after a dozen runs. New exitLessonToMap()
//           flushes, refreshes the progress cache, THEN reloads, and carries
//           anything unflushed across. ⚠️ A flush added AFTER the reload would
//           read as correct and change nothing. tests/exit-flush-test.mjs.
//
```


### learn.js v2.34.1 — archived by Round 51 (Blickensderfer), 8-entry budget

⚠️ **learn.js still cites v2.34.1 once in live code** (the goals-cache hit-guard,
`⚠️⚠️ v2.34.1 — ROADMAP 11, BUG B. AN ENTRY WITH NO CLASS IS ALSO A MISS.`).
This block is where that pointer resolves.

```
// v2.34.1 — ⚠️⚠️ ROADMAP 11, BUG B — SETTINGS SAID "NO CLASS ASSIGNED" FOR 24
//           HOURS AFTER A CORRECT ASSIGNMENT. The goals cache's hit-guard only
//           rejected an entry naming a class with no className; an entry taken
//           BEFORE assignment has classId '' — falsy — and passed as a hit. A
//           direct admin write cannot clear a cache on the student's Chromebook,
//           so the unassigned state must not be cacheable at all. Paired with
//           lessons-admin.js v1.14.0, which fixes the writer half.
//
```


### learn.js v2.33.0 — archived by Round 50 (Blickensderfer), 8-entry budget

⚠️ **learn.js still cites v2.33.0 once in live code** (the build-panel note above
`loadBuildInfo()`). This block is where that pointer resolves.

```
// v2.33.0 — ⚠️ TWIN OF game.js v3.45.0. The build panel's per-page "already
//           loaded" flag is gone; versions.js v1.13.0 owns freshness. Nothing
//           about ROADMAP item 10 changed. HANDOFF §0.-22.
//
```


### session-log.js v1.3.0 — archived by Round 46 (Rem-Sho), line budget

⚠️ **session-log.js still cites v1.3.0 once in live code** (the `⚠️ SERIALIZED
— DO NOT CALL _sessionLogFlushInner DIRECTLY` note above `_flushChain`). This
block is where that pointer resolves.

```
// session-log.js v1.3.0 — the sprint/run history queue, shared by game.js and
// learn.js. The third shared module, after firebase-config.js and stats-wal.js.
//
// v1.3.0 — SERIALIZED FLUSHES. `sessionLogFlush()` is now a thin wrapper that
//          chains onto `_flushChain` and calls `_sessionLogFlushInner()`; a second
//          flush starts only after the first has resolved and cleared what it
//          wrote. This closes the duplicate-session race of 2026-08-19: clicking
//          Home fires BOTH visibilitychange:hidden and pagehide, each calling
//          flushSessionsNow() unawaited, and the second read a queue the first had
//          not cleared yet. Callers WAIT rather than being dropped — one arriving
//          mid-flush may carry records the in-flight run never saw. Guarded by
//          session-merge-test.mjs Part E, which is mutation-tested. The full
//          reasoning is in the comment block above sessionLogFlush().
//          ⚠️ HEADER REPAIR, Round 17 (Linotype): this file arrived with
//          SESSION_LOG_VERSION already set to '1.3.0' and its header still saying
//          1.2.1, so `npm run audit:versions` reported "header comment says
//          v1.2.1 — one of the two is a lie", the twelfth problem in a repo whose
//          standing count is eleven. The code was correct and complete; only the
//          header was missing. This entry was written from the file's own
//          sessionLogFlush() comment block and the concurrent round's HANDOFF §0.6
//          item 8, not invented. NOTHING EXECUTABLE WAS CHANGED.
//
```

### learn.js v2.32.0 — archived by Round 46 (Rem-Sho), 8-entry budget

⚠️ **learn.js still cites v2.32.0 in many live code comments** (ROADMAP item 10's
lesson-farming gate — the gate rule itself lives in `lesson-gate.js` and is
unaffected by this archive). Every header entry was cited when this was
archived, so there was no uncited one to take instead. **This block is where
those pointers resolve.**

```
// v2.32.0 — ⭐⭐ ROADMAP ITEM 10 — THE LESSON-FARMING GATE. Jake: "students are
//           just redoing the first three lessons indefinitely because they're
//           easy." ⚠️⚠️ THE RULE IS IN lesson-gate.js AND IT IS PURE; this file
//           only supplies numbers and draws the result. MASTERY IS WHAT CLOSES A
//           LESSON, AND ONLY MASTERY — a lesson with fewer than three A🔥 is
//           always graded and always replayable, forever, at any distance.
//           ⚠️ A PRACTICE RUN WRITES NOTHING ANYWHERE: no grade, no session, no
//           second. The three omissions are ONE decision — splitting them would
//           manufacture the exact typing_logs/typing_sessions divergence that
//           ROADMAP item 4's implausibility flag exists to detect. And it never
//           arms startGradedTimer(), so ⚠️ THE ONE INCREMENT SITE IS UNTOUCHED:
//           no new condition, nothing between the gate and the increments.
//           ⚠️ THE BANNER IS THE FEATURE, NOT DECORATION — a child typing for ten
//           minutes while the daily total does not move reads as a broken app.
//           See HANDOFF §0.-21.
//
```

### lessons-admin.js v1.10.0 — archived by Round 43 (Rem-Sho), 8-entry budget

```
// v1.10.0 — THE ROLLOVER IMPORT. A returning student kept last year's class and
//          nothing anywhere said so. Three parts:
//            1. The preview no longer claims a student with no uid is new. A
//               missing uid means only "no typing_logs in the last ROSTER_DAYS" —
//               a student who last typed in the spring is indistinguishable from
//               one who has never typed, and the old label promised "will apply
//               on first login" for the case where nothing happened at all.
//            2. A decision block, in the preview, asking what to do about
//               students who already have a class. Commit stays LOCKED until it
//               is answered. Not an overlay: it sits beside the table it is about
//               and cannot be dismissed by a stray click.
//            3. The answer travels with the record as `overwrite`, so the
//               consumer (game.js / learn.js applyPendingClassAssignment) is told
//               rather than left to guess which fact is newer. It governs BOTH
//               write paths — visible students are skipped here, queued students
//               are decided at sign-in — because an answer that applied to only
//               half the file would reproduce the original defect.
//          Also: the Create-classes button was losing its click listener to a
//          later `innerHTML +=` whenever a file had both new classes and valid
//          rows. All wiring in this panel now happens after the last write.
//          Also: the commit summary reports queued and skipped counts, not just
//          a bare "N assigned" that was true and misleading at the same time.
//
```

### learn.js v2.31.0 — archived by Round 42 (Rem-Sho), 8-entry budget

⚠️ **learn.js still cites v2.31.0 in live code comments.** Every header entry was
cited when this was archived, so there was no uncited one to take instead.
**This block is where those pointers resolve.**

```
// v2.31.0 — ⚠️ THE BUILD PANEL'S ⚠️ NOTES ARE STAFF-ONLY. versions.js v1.12.0
//           gates them and defaults to OFF; this file passes the flag and
//           re-renders from the cached results when auth changes underneath, so
//           signing in mid-session reveals them without a reload. ⚠️ TWIN OF
//           game.js v3.43.0 — the two panels must agree, and game.js has one
//           extra note (renderer drift) that School has no equivalent for by
//           construction, because keyboard.js is a STATIC import here. The
//           readability half of the fix is in adventure.css v1.0.3 and
//           style.css v3.8.1; nothing in this file was the cause. §0.-20.
//
```

### learn.js v2.31.0 — archived by Round 42 (Rem-Sho), 8-entry budget

⚠️ **learn.js still cites v2.31.0 in 2 live code comment(s).** Every header entry
was cited when this was archived, so there was no uncited one to take instead.
**This block is where those pointers resolve.**

```
// v2.31.0 — ⚠️ THE BUILD PANEL'S ⚠️ NOTES ARE STAFF-ONLY. versions.js v1.12.0
//           gates them and defaults to OFF; this file passes the flag and
//           re-renders from the cached results when auth changes underneath, so
//           signing in mid-session reveals them without a reload. ⚠️ TWIN OF
//           game.js v3.43.0 — the two panels must agree, and game.js has one
//           extra note (renderer drift) that School has no equivalent for by
//           construction, because keyboard.js is a STATIC import here. The
//           readability half of the fix is in adventure.css v1.0.3 and
//           style.css v3.8.1; nothing in this file was the cause. §0.-20.
//
//
//
//
//
//
// Lesson-mode engine, separate from game.js. Same write-ahead-log and
// coalesced-flush persistence pattern.
//
// ── Full history: CHANGELOG.md § learn.js ─────────────────────────────────
// ── Why it looks like this: PEDAGOGY-AUDIT.md ─────────────────────────────
//
// ⚠️ v2.31.0 — 39 OLDER ENTRIES (v2.26.0 back to v2.2.0) MOVED TO CHANGELOG.md
//    § ARCHIVED FILE HEADERS. Nothing was deleted. Same reasoning as game.js.
//
// ── Load-bearing ──────────────────────────────────────────────────────────
//
//   * saveProgress() uses merge:true. Without it, completing a lesson erases
//     every run-level field.
//   * ttb_learnwal_v1 and ttb_learnpos_v1 both carry an explicit `v`. Bump it
//     rather than changing the payload shape, or a mid-run student on the old
//     shape gets a corrupt resume.
//   * Do NOT scale gates by grade level. An 8th grader may have had this
//     teacher twice or never; unit position is the only honest signal.
import { db, auth, ADMIN_EMAILS, isStaffUser } from "./firebase-config.js";
// ROADMAP item 10 — the lesson-farming gate. ⚠️ PURE MODULE, NO FIRESTORE: every
// rule in it is a function of numbers this file passes in, which is why the whole
// design is covered by lesson-gate-test.mjs without driving a browser.
import { activeDayPlan, activeDayCountOf, fireCountOf, isMastered,
         lessonModeFor, runModeFor, runScoreOf, runMastered, pointsForGrade,
         lastLockDayOf, furthestIndexOf, reachBackFor,
         MASTERY_POINTS, MASTERY_FIRE_COUNT, REACH_BACK_DAYS } from "./lesson-gate.js";
// ROADMAP item 15 — the grade rule. ⚠️ PURE MODULE, AND THE ONLY COPY: every
// function below used to live in this file, and reports.html needed all of them
// to reconstruct a grade. Two copies of calculateGrade() is the shape Rule 9
// forbids, so the copies here were DELETED in the same deploy that added this
// import. ⚠️ gatesForRun() TAKES THE LESSON'S GATES AS AN ARGUMENT now — the
// old one read `currentLesson` out of module scope, which is what made it
// impossible to call from anywhere else.
import { calculateGrade, gradeAdvances, gatesForRun, betterGrade,
         chunkSequence, DRILL_TYPES, FIRE_GRADE, GRADE_ORDER,
         REACH_HOME_COMPANION, CHUNK_TARGET, CHUNK_SLACK,
         RUN_GRADE_VERSION } from "./run-grade.js";
// The day/week counters' WAL, shared with game.js. It is a separate module
// because the counters are the one piece of state that is true regardless of
// which page or which book a student is on, and both previous copies of it were
// scoped to something narrower than that. See stats-wal.js for the bug.
import {
    statsWalSave, statsWalRecover,
    guestAccumSave, guestAccumLoad, guestAccumClear
} from "./stats-wal.js";
// The sprint/run history queue, shared with game.js. ⚠️ THIS FILE HAD NO SESSION
// LOGGING OF ANY KIND BEFORE v2.6.0 — see the header. A run is the lesson-mode
// equivalent of a sprint: a bounded stretch of typing with a duration, a
// character count and a derived WPM, which is exactly what the module stores.
import {
    sessionLogInit, sessionLogPush, sessionLogFlush, sessionLogPending,
    sessionLogAdopt, sessionLogTake, GUEST_QUEUE_UID,
} from "./session-log.js";
// The time readout, shared with game.js. ⚠️ Both pages render the SAME string in
// the SAME element id — see hud.js for why that is the whole point.
import { hudStrings, HUD_VERSION, hudCacheSave, hudCacheLoad,
         celebrationDone, celebrationMark, fmt } from "./hud.js";
// ⚠️ v2.26.0 — THE "copied from game.js" BLOCK IS GONE, and its header said so
// in as many words for months. celebrate.js owns the celebrations; School and
// Library now show the SAME one. Do not copy it back.
// showGoalToast is intentionally NOT imported: celebrate.js raises its own
// toast as part of each celebration. It stays exported there for any future
// caller that wants the banner without the animation.
import { launchConfetti, launchFireworks } from "./celebrate.js";
import { showReceipt } from "./receipt.js";
// ⚠️ ROADMAP 0b. The reading-font model MOVED here from this file in v2.28.0 —
// there is no local copy left and there must not be a new one. `openMenuModal()`
// in game.js is deliberately NOT imported: it reaches into book, chapter, sprint
// and view state School has none of. This module is its shape, not its body.
import { openSettingsPanel, buildSettingsButton, applyDrillFont, readDrillFont,
         SETTINGS_PANEL_VERSION } from "./settings-panel.js";
// ⚠️ HANDOFF §0.0 — the student now reads the GRADED document. See daylog.js.
// ⚠️ readDaySessions/projectDayTotal deliberately NOT imported — v2.19.0
// reverted the projection. See HANDOFF §0.0.
import { readWeek, applyWeekToStats, dayLogPayloadFor, SOURCE_SPLIT_CUTOVER, DAYLOG_VERSION,
         carryOverPlan, carryOverPayloadFor, sourceTotalsOf } from "./daylog.js";
import { qualifyingChars, VARIETY_FLOOR_VERSION } from "./variety-floor.js";
// ⚠️ v2.23.0 — THE DRILL TEXT FILTER. A student reported "ass" in a lesson.
// Whole-group matching on Jake's ruling: `lass`, `mass` and `asse` are FINE.
// See drill-filter.js's header — it holds the ruling and its edge cases.
import { safeGroup, DRILL_FILTER_VERSION } from "./drill-filter.js";
// The version footer's three primary reads (this html file, this js file's own
// LEARN_VERSION, style.css) plus the lazy full-build panel on hover. ⚠️ SAME
// STRUCTURE AS game.js, ON PURPOSE — see updateVersionFooter() below.
import { noteDay, ensureSince } from "./logdays.js";
import { readOneDeployedVersion, readDeployedVersions, renderBuildList,
         countBuildNotes, renderHiddenNotesLine,
         readAppliedCssVersion } from "./versions.js";
import {
    collection, getDocs, query, where, doc, getDoc, setDoc, addDoc, deleteDoc,
    // Aggregation query. Firestore bills getCountFromServer at ONE read per up
    // to 1000 matched index entries, which is what makes the lessons cache
    // validation cost 1 read instead of ~80. Available since SDK v9.11.
    getCountFromServer,
    // v3.46.0 — for logdays.js's ledger write. See the noteDay() call in the
    // flush path below and the ordering rule in logdays.js's header.
    updateDoc, arrayUnion,
    // v2.7.1 — for session-log.js's `serverAt` and nothing else. ⚠️ Do not reach
    // for it in flushStats(): a sentinel inside the typing_logs or
    // typing_logs merge writes would be a second dating scheme on the
    // two documents Round 12 spent a day getting to agree.
    serverTimestamp
} from "./read-meter.js";
import {
    onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    FINGER_COLORS, FINGER_NAMES, LAYOUTS, KB_VERSION,
    createKeyboard, buildFingerMap, getFingerInfo,
    createHandGuide, buildFingerSVG, setHandGuideToChar, setHandGuideToChars,
    resetHandGuideToHome, colorKeyboardKeys, flashFingerPressed,
    getHomePositions, getKeyCenterInKB, toggleKeyboardCase
} from "./keyboard.js";

// ─── Constants ────────────────────────────────────────────────────────────────
// ⚠️ THIS LINE IS THE VERSION — the comment at the top of the file is decoration.
// versions.js parses THIS, the footer renders THIS, and ROADMAP's verification
// steps tell Jake to read THIS. It sat at "2.23.1" across five releases. Bump it
// in the SAME EDIT as the header entry above, always.
// tests/version-stamp-test.mjs now fails the suite if you do not.
```

### lessons-admin.js v1.11.1 — archived by Round 41 (Rem-Sho), 8-entry budget

```
// v1.11.1 — follows reports.html v2.13.1: the legacy `seconds` field is now
//          SUMMED with the split fields rather than superseded by them, so time
//          recorded earlier the same day by pre-split code isn't dropped.
//
```

### learn.js v2.30.0 — archived by Round 41 (Rem-Sho) to stay inside the 8-entry budget

```
// v2.30.0 — THE CORNER ID STAMP IS GONE. renderIdStamp() deleted; the student ID
//           lives in the ⚙ panel only, with click-to-copy carried over. Twin
//           deleted from game.js in the same commit. ⚠️ HANDOFF §2's deploy check
//           referenced the stamp and has been rewritten. §0.-19.
```

### versions.js v1.7.0 — archived by Round 41 (Rem-Sho) to stay inside the 8-entry budget

```
// v1.7.0 — registers game.html and learn.html, and exports readOneDeployedVersion()
// so a page can read its OWN entry (and only its own entry) without paying for
// the full SOURCES fetch. Built for the game.html/learn.html footer redesign:
// each page shows its own html/js/css triad immediately (three small, targeted
// fetches — game.html is ~2KB, not the 210KB fetching game.js from outside it
// would cost) and defers the full cross-file list to the SAME lazy
// readDeployedVersions() index.html's build panel already uses, on first hover.
// ⚠️ game.html and learn.html carry their version the same way style.css does —
// a comment near the top, because they are markup shells with no runtime JS of
// their own to hold a constant. HEADER_EXEMPT covers them for the same reason
// it covers the stylesheets: there is no second (constant) copy to drift from.
//
//
//
//
// ⚠️ v1.12.0 — v1.4.0's entry moved to CHANGELOG.md § ARCHIVED FILE HEADERS.
//
// Explicit patterns rather than one clever regex, so an unexpected match is
// impossible and adding a file is obvious.
```

⚠️ **NOTHING HERE WAS DELETED.** These are verbatim header entries lifted out
of four files when the per-file **entry budget** fired in the build panel. The
LINE budget was raised and made proportional to file size in the same round
(`versions.js` v1.12.0), so rationale prose was left where it was — only
changelog runs moved. The entry budget is deliberately NOT proportional: a
changelog nobody scrolls to the bottom of is the defect, and it does not get
better because the file got bigger.

Each block below is exactly what stood in the file header, newest first.

### § game.js — archived header entries

⚠️ **v3.41.0 archived by Round 46 (Rem-Sho), 8-entry budget.** game.js still
cites it at two other points in the file (the version-history summary line and
the celebrate.js extraction note) — this block is where that pointer resolves.

```
// v3.41.0 — THE CELEBRATIONS MOVED TO celebrate.js, and the fireworks DOUBLED
//           there (10 shells, not 5; twice the run time). Jake's "so double it"
//           meant the display, not the odds — the weekly goal is crossed once a
//           week per child and should be impossible to miss. ⚠️ The fourth
//           hand-maintained twin found in one day, and it had already drifted.
//
```

```
// v3.39.0 — THE TWO-ROW TOP BAR (ROADMAP item 0). The left slot is now Daily
//           over context and the sprint has moved to the centre with WPM,
//           accuracy and the streak, because a sprint is a LIVE quantity and
//           was on the left only because hud.js glued it there in parentheses.
//           ⚠️ DAILY IS THE LEAD ROW AND MUST STAY THERE — hud.js v1.3.0's
//           return block has the argument, tests/hud-lead-test.mjs has the
//           assertion. `.hud-time-long` and `hud.long` are deleted, not tuned:
//           the 40-character string they compensated for no longer exists.
//           Overtime now colours the SPRINT rather than tinting the Daily
//           figure orange for a sprint event.
//
// v3.38.1 — ⚠️ THE STALE DAY CARRIED FORWARD. mergeGuestStats() period-guarded
//           the SERVER side of `live - base` and never the LIVE side — and on
//           the one path that calls it the server guard is a TAUTOLOGY, because
//           retroactiveSaveGuestSession() synthesises `lastDate: dateStr`. A
//           tab left open overnight re-authed with yesterday's day counters in
//           `live`, so `mine` was yesterday's WHOLE DAY and it landed on
//           today's typing_logs document. Two students, 2026-08-21, exact to
//           the second and the character. `liveDay` / `liveWeek` now gate the
//           contribution AND the floor. See the block above the function and
//           tests/live-period-test.mjs.
//
// v3.38.0 — ⚠️ ROADMAP ITEM 6 CONFIRMED AND FIXED. A sprint crossing midnight
//           was split correctly by the day counters (243s to yesterday, 6s to
//           today) and filed WHOLE by the session record, stamped with the day
//           it ENDED on — the observed 4m 9s rollup beside a 0m 6s daily log.
//           The tick now closes the open sprint on the OUTGOING day before it
//           resets, and the midnight check MOVED ABOVE `sprintSeconds++` so the
//           second that just elapsed is not filed under yesterday.
//           ⚠️ THE ROADMAP'S SECOND CANDIDATE IS INNOCENT — session-log.js dates
//           from the caller and always did. tests/midnight-test.mjs.
//
// v3.37.0 — ⚠️ THE OVERNIGHT RESCUE, on Jake's ruling. A child who typed as a
//           guest and did not sign in until the NEXT DAY now has those minutes
//           credited to the day they typed them, via
//           carryGuestDaysToTheirOwnDocuments(). Input is the dated, sourced
//           guest queue, so it can only ever under-credit; sessionLogTake() is
//           atomic, so it cannot run twice. ⚠️ PRE-CUTOVER DAYS ARE REFUSED BY
//           daylog.js — adding to the shared flat triple is §3.1 with an
//           addition in front of it. The rescue switches itself on at
//           SOURCE_SPLIT_CUTOVER and never runs against the shape it would
//           corrupt. The argument is in daylog.js v1.4.0's footer.
//
// v3.36.0 — ⚠️⚠️ THE GUEST MINUTE. This file had NO guest merge on the auth
//           path and learn.js did. Jake, 2026-08-20, one student, one machine:
//           School guest 1:04 → sign in → 8:31 (server 7:27, merged); Library
//           guest 1:11 → sign in → 8:31 (the SAME number — the minute erased by
//           applyWeekToStats(), which ASSIGNS). The merge existed here twice,
//           inline, in two modal paths, so whether a child kept their minutes
//           depended on which of three sign-in buttons they pressed.
//           retroactiveSaveGuestSession() is now the one copy, called by all
//           three, BEFORE loadUserStats(). A true guest's sprints are queued
//           under GUEST_QUEUE_UID instead of dropped, and adopted at sign-in,
//           so the minutes reach the RECORD and not only the total.
//
//
// ⚠️ THE LINE ABOVE SAID v3.30.0 FOR FIVE VERSIONS while `const VERSION` said
// 3.34.0. tools/audit-versions.mjs has been reporting it as "one of the two is
// a lie" that whole time. Fixed here because this deploy touches the file
// anyway — HANDOFF §0.-7.D's instruction exactly.
//
// v3.35.0 — ⚠️⚠️ §3.1 IS CLOSED. THIS FILE NO LONGER WRITES THE DAY TOTAL.
//           On and after daylog.js's SOURCE_SPLIT_CUTOVER, the daily-log write
//           names `secondsLibrary`/`charsLibrary`/`mistakesLibrary` and nothing
//           else, fed by a counter seeded from THOSE FIELDS. learn.js writes the
//           School triple the same way. Two pages, one document, no shared
//           field — so a merge from the other page cannot mention this page's
//           numbers and therefore cannot replace them.
//
//           ⚠️ THE COUNTER SEEDS FROM ITS OWN FIELD, NEVER FROM THE DAY TOTAL.
//           Seeding from the total folds School's time into Library's bucket and
//           the reader then adds it twice. That was the v3.29.0 bug, it is why
//           the source split was reverted in v3.30.0, and
//           tab-lifetime-test.mjs Part E drives it deliberately so it cannot
//           come back unnoticed.
//
//           ⚠️ THE WRITE IS DATE-GATED AND THAT IS WHAT MAKES THIS UPLOAD SAFE
//           ON ANY DAY. Before the cutover this file writes the flat triple,
//           byte-for-byte as v3.34.0 did. The readers are legacy-first before
//           the cutover, so a page that started writing split fields early would
//           file a whole afternoon somewhere every reader ignores.
//
//           `statsData.secondsToday` is UNCHANGED in meaning — still the whole
//           day, still what the HUD paints, still seeded from the graded
//           document. The student's number does not move.
//
// v3.34.0 — ⚠️⚠️ EMERGENCY REVERT OF THE v3.32.0 PROJECTION. The daily total is
//           the in-memory counter again. `typing_sessions` was found to contain
//           OVERLAPPING rollups and NEGATIVE character counts (HANDOFF §0.0), so
//           deriving a grade from it makes the grade the corrupt number. Stage 1
//           — one document, HUD reads typing_logs, no stats/time_tracking — is
//           KEPT and does not depend on sessions. Sessions are still written and
//           still feed the drill-down; they just cannot decide a grade.
//
// v3.33.0 — ⚠️ THE HUD FOLLOWS THE DOCUMENT. Stage 2 made the WRITE a projection
//           of typing_sessions and left the HUD painting the old in-memory
//           counter — two different quantities, which is the divergence this
//           round exists to end, rebuilt by the fix for it. After a successful
//           daily-log write, statsData is reset to what was actually written and
//           the HUD repaints. The displayed number can drop once; that means the
//           counter was ahead of the record, and correcting it is the point.
//
// v3.32.0 — ⚠️ STAGE 2: THE DAILY TOTAL IS DERIVED FROM typing_sessions, AND
//           THE LEADERBOARD IS DERIVED TOO — it was the last place in the app
//           that accumulated a student's time independently, and it is now a
//           view of statsData.secondsWeek (itself the sum of seven daily docs)
//           with the old accumulator kept only as a floor. See flushLeaderboard(). The
//           typing_logs write is no longer this tab's in-memory counter; it is
//           (server sessions + local queue + this tab's open sprint). Two tabs
//           can no longer overwrite each other's day. A failed session read
//           writes NOTHING rather than a computed-from-nothing total. Requires
//           session-log.js v1.4.0 and daylog.js v1.1.0, both uploaded first.
//           HANDOFF §0.0.
//
// v3.31.0 — ⚠️⚠️ ONE NUMBER. `users/{uid}/stats/time_tracking` IS GONE FROM THIS
//           FILE — every read and every write of it. The day and week totals the
//           HUD paints are now read from `typing_logs/{uid}_{date}`, THE SAME
//           SEVEN DOCUMENTS reports.html grades from, via the new shared
//           daylog.js. HANDOFF.md §0.0 is the full statement; the short version
//           is that the student's screen and the teacher's report were two
//           independently-written copies of one quantity and no amount of
//           auditing was ever going to make two copies agree.
//
//           ⚠️ REQUIRES firestore.rules v2.5.0, DEPLOYED FIRST. Until v2.5.0 the
//           read rule on typing_logs was staff-only, which is precisely why the
//           second copy existed. Without it every load fails its read, and the
//           guard below leaves the counters untouched rather than painting zero.
//
//           ⚠️ THE WEEK IS DERIVED AND STORED NOWHERE. It is the sum of the seven
//           daily documents, recomputed every load. checkForWeekRepair() and
//           `lastKnownRepairedAt` are DELETED along with the stored counter they
//           defended — there is nothing left to repair, and reports.html's
//           week-counter audit goes with them. If either idea comes back, a
//           second copy has come back; go and find that instead.
//
// v3.30.0 — ⚠️ THE SOURCE SPLIT IS REVERTED. This file's typing_logs write is
//           byte-for-byte what v3.28.1 shipped: the flat seconds/chars/
//           mistakes triple, from statsData.*Today. v3.29.0 and v3.29.1 both
//           tried to give Library its own fields and both were wrong in ways
//           only live use caught (v3.29.0 fed both fields from the shared
//           cross-mode counter; v3.29.1 fixed that but the round as a whole
//           had by then produced two student-visible defects in two days).
//           Reverted deliberately, on Jake's clock, rather than attempting a
//           third counter change overnight with students arriving in the
//           morning. The bug the split was meant to fix — DESIGN-TELEMETRY.md
//           §2.4, two page controllers overwriting each other's daily total —
//           IS STILL PRESENT and is once again a known, lived-with defect
//           rather than a half-landed fix. See HANDOFF §0.6 item 9.
//           Everything else from Round 16 stays: the week-repair resync
//           (v3.28.0) and the variety floor (v3.28.1) are untouched.
//
// v3.28.1 — EXTRACTED `_qualifyingPracticeChars()`'s FILTER into the new
//           variety-floor.js, the fifth shared module. No behavior change —
//           see that file's header. Closes the "no harness coverage" flag
//           Round 15/16 left on this logic: the filter itself is now a real,
//           directly-imported, directly-tested pure function
//           (variety-floor-test.mjs) rather than something only reachable by
//           lifting it out of the monolith with brace-matching. The DOM-level
//           wiring around it (button gating) still isn't extracted, and still
//           isn't covered — that part is unchanged this round.
//
// v3.28.0 — THE REPAIR RESYNC. Fixes a real incident: a student's week counter
//           got audit-repaired in reports.html and came back inflated on the
//           next check — twice. Root cause was a MacBook that's supposed to
//           restart between class periods but sometimes doesn't; the tab (and
//           its in-memory statsData) survives, still holding the pre-repair
//           number, and the next 5-minute flush wrote that stale number
//           straight back over the fix. mergeGuestStats()'s data-loss floor
//           (Math.max, never trust a decrease) is what made the repair
//           unwindable in the first place — it can't tell "the number went
//           down because of a bug" from "the number went down because someone
//           corrected it." reports.html's repair now stamps a `repairedAt`;
//           new checkForWeekRepair() (called from flushAll(), right before the
//           write that would otherwise clobber a repair) compares it against
//           what this session saw at load and resyncs — server's corrected
//           value plus this browser's own contribution since baseline, no
//           floor — when it's newer. New `lastKnownRepairedAt`, set in
//           loadUserStats() and reset on week rollover alongside the counters
//           it travels with. See checkForWeekRepair()'s own comment, next to
//           flushAll(), for the full mechanism.
//
// v3.27.1 — TWO STUDENT-REPORTED FIXES. (1) THE AI-PRACTICE VARIETY FLOOR:
//           startPracticeMode()/getMissedCharsHTML() now require at least
//           PRACTICE_MIN_QUALIFYING_CHARS (3) DIFFERENT characters, each missed
//           at least PRACTICE_CHAR_MISS_THRESHOLD (3) times, before the ✨
//           Practice button offers or the Gemini call fires. Before this, a
//           single missed letter — Jake's example was "F" and "J", with only F
//           really qualifying — could produce an AI paragraph "focused on" one
//           dominant, common letter: fast and easy to type, free banked time,
//           not remediation. Server-side floor is index.js v1.7.0, which also
//           moved input validation ahead of the daily-limit reservation so a
//           rejected request no longer burns one of the student's 5 slots.
//           (2) THE HUD LONG-FORM CLIP: hud.js v1.2.0's new `long` flag drives
//           a `.hud-time-long` class (smaller font) and a `title` attribute
//           (full-string tooltip) on #hud-time, so the combined Sprint+Daily
//           form — 40+ characters — ellipsises instead of silently hard-
//           clipping past the section boundary. See style.css v3.5.5.
//
// v3.27.0 — VERSION FOOTER REDESIGN. #footer-primary always shows game.html /
//           game.js / style.css — the three files most likely to explain what
//           a student is seeing. #footer-full is the rest of the deployed
//           build (hud.js, session-log.js, stats-wal.js, firebase-config.js,
//           etc.), fetched lazily on first hover via versions.js's existing
//           readDeployedVersions()/renderBuildList() — the same mechanism
//           index.html's build-info button already used. Built because Jake,
//           debugging the HUD bug below, had no way to see which hud.js was
//           actually deployed. Touch gets a tap-to-pin `.pinned` class since
//           hover doesn't exist on a touchscreen. FEATURE, minor bump.
//
// v3.26.3 — ⚠️ THE 0:00-UNTIL-FIRST-KEYSTROKE BUG, FOR REAL THIS TIME. v3.26.2's
//           cache seed in loadChapter() was overwritten on the very next line by
//           an unconditional updateTimerUI() call, which repainted from statsData
//           — still zero, since loadUserStats() hadn't resolved yet. Separately,
//           the init handler carried a comment claiming a repaint happened after
//           loadGoals() landed; the call it described did not exist in the code.
//           Net effect: nothing painted real numbers until gameTick() started on
//           the first keystroke. Fixed two ways: the cache fallback now lives
//           INSIDE updateTimerUI() itself (same pattern as learn.js's
//           renderTimeHUD(), which never had this bug), so every caller gets it
//           for free; and the missing post-loadGoals() repaint is restored, so
//           real numbers land the moment they're available. Reported by Jake,
//           who noticed the predecessor's fix didn't actually fix it.
//
// v3.26.2 — ⚠️ THE READOUT NO LONGER OPENS AT 0:00 WHILE FIRESTORE IS READ.
//           v3.26.1 fixed the paint; the NUMBER still was not there yet, because
//           statsData holds its initialised zeros until an async read lands.
//           hud.js v1.1.0 caches the last known totals; this paints them once at
//           load and lets the real read overwrite. ⚠️ DISPLAY ONLY — statsData is
//           never seeded from the cache. Reported by Jake, twice, both times right.
//
// v3.26.1 — ⚠️ THE TIME READOUT IS PAINTED EVERY TICK, NOT ONLY WHEN IT CHANGES.
//           v3.26.0 correctly gated the ACCUMULATOR on the first keystroke and
//           left updateTimerUI() inside that gate, so nothing drew the readout
//           until a keystroke plus a full accumulator rollover. Students saw
//           game.html's hardcoded `Daily 0:00` and an empty `#hud-week` instead of
//           their real totals — reported by Jake within an hour of deploy. No
//           number was ever wrong; the drawing was late. Painting now happens
//           unconditionally, above the gate.
//
// v3.26.0 — ⚠️ NO CLOCK UNTIL THE FIRST KEYSTROKE. DESIGN-TELEMETRY §7 step 1.75,
//           ruled by Jake 2026-08-18. gameTick() gated both its AFK check and its
//           accumulator on `lastInputTime`, which startGame() stamped with
//           Date.now() — so a sprint began counting the moment it opened and a
//           student earned IDLE_THRESHOLD seconds for typing nothing. Two seconds
//           a sprint, every sprint. `lastInputTime` now starts at 0 and both gates
//           test it for truthiness first. ⚠️ THE AFK GUARD IS NOT OPTIONAL: an
//           unguarded `now - 0` exceeds AFK_THRESHOLD immediately and would
//           auto-pause every sprint into the break screen before a key was
//           pressed. Recorded minutes drop slightly from this deploy forward;
//           NOTHING STORED IS REWRITTEN — the seconds already banked stay banked,
//           which is Jake's explicit ruling.
//
// v3.25.1 — COMMENTS ONLY. No code, no behaviour, no field, no gate changed.
//           Invariant citations renumbered against the single consolidated
//           HANDOFF.md §5. ⚠️ The §5 numbers are APPEND-ONLY from now on: a new
//           invariant takes the next free number and nothing is ever renumbered
//           again. This one repair was unavoidable because the old sequence was
//           genuinely ambiguous — Round 9 assigned 56-81 and Round 11, told to
//           continue from Round 8's 55, also started at 56.
//
// v3.25.0 — (1) ⚠️ THE TOP-BAR READOUT MOVES TO hud.js AND IS IDENTICAL TO
//           SCHOOL'S. The left slot used to hold three different quantities
//           depending on the session-length setting — sprint, or day, or sprint
//           again labelled "Active" — in one position. It now always reads
//           `Sprint 0:27 / 0:30 (Daily 9:22 / 10:00)`, or Daily alone with no
//           sprint limit, and the right slot always reads Weekly.
//           (2) ⚠️ QUEUED SESSIONS UPLOAD ON HIDE AND ON pagehide. Reports showed
//           n-1 sessions: the queue was only drained by a `final` flush, so
//           clicking Home recorded the sprint locally and uploaded nothing until
//           the next visit. See flushSessionsNow().
//
// v3.24.0 — ⚠️ THE OPEN SPRINT IS NOW RECORDED. Session records were only ever
//           written when a sprint ENDED (chapter complete, AFK pause, guest
//           nudge), so a student who switches books every few sentences produced
//           counter time with NO session history behind it. Harmless today;
//           an undercount the moment totals derive from sessions. logOpenSprint()
//           closes the open sprint on visibilitychange:hidden and pagehide
//           WITHOUT ending it, and logSession() therefore writes DELTAS against
//           a watermark rather than sprint totals. DESIGN-TELEMETRY §7 step 1.5.
//           ⚠️ Reset the watermark wherever sprintSeconds is reset — four sites,
//           counted by open-unit-test.mjs.
//
// v3.23.1 — Hands `serverTimestamp` to session-log.js so sprint rollups carry
//           `serverAt` — a clock a student cannot change — alongside the client
//           `timestamp` they can. DESIGN-TELEMETRY.md §6.3 / §7 step 1. One
//           import, one dependency, no behaviour change in this file; nothing
//           reads the new field yet, deliberately.
//
// v3.23.0 — ⚠️ THE STATS ROLLUP NOW SHARES A WRITE TRIGGER WITH THE DAILY LOG.
//           They hold the same numbers and were written on different schedules,
//           so about half of ninety students had no stats document at all and the
//           rest had one from an arbitrary moment. See the block at step 3 of
//           _flushAllInner() before changing the gate back.
// v3.22.0 — ⚠️ THE DOUBLED WEEK COUNTER, and the sprint history that was filed
//           under the wrong day. Four changes; the first is the one that was
//           actively corrupting a student's numbers.
//           (1) A SIGNED-OUT USER IS NOT A GUEST. Sessions expire at 24h and can
//           expire mid-period. onAuthStateChanged fires with null, and every
//           `!currentUser || isAnonymous` test in the file then reads a student
//           halfway through a lesson as a brand-new visitor — including the
//           login ladder, which re-offered sign-in after 60 seconds. Signing
//           back in ran the guest merge, which ADDS Firestore's stored totals to
//           the live ones. But statsData was never reset by the sign-out: it
//           still held everything loaded at page open. 20 minutes + 20 minutes
//           = 40. See sessionExpired and mergeGuestStats().
//           (2) The merge is a BASELINE DIFF now, not a sum and not a max().
//           Both were wrong in opposite directions. See mergeGuestStats().
//           (3) Sprint rollups move to session-log.js, shared with learn.js,
//           which had no sprint logging whatsoever. Records carry the date they
//           were TYPED; this file used to stamp them at flush time.
//           (4) Typing while signed out is no longer discarded in silence.
//
// v3.21.1 — applyPendingClassAssignment() honours an explicit reassignment, and
//          always consumes the record it read. The old `if (existing) return;`
//          silently discarded every rollover assignment for a RETURNING student —
//          the one student the importer cannot see — and left the record in place
//          to be re-read and re-rejected on every sign-in thereafter. Intent now
//          travels on the record as `overwrite` (lessons-admin.js v1.10.0), stale
//          records expire at 30 days, and the goals cache is dropped on a move as
//          well as a first placement, because last year's cached class is
//          well-formed and therefore invisible to a validity check.
//
// v3.21.0 — ⚠️ THE CLOSED-TAB DATA LOSS. `ttb_wal_v2` held reading position AND
//           the day/week time counters in one record, overwritten wholesale on
//           every visibilitychange. walRecover() bails on
//           `wal.bookId !== currentBookId` — right for a position, wrong for a
//           clock — so: type in Dracula, close the tab (up to 5 minutes lives
//           only in the WAL), open Treasure Island, and the first hide
//           overwrites the slot. Those minutes were gone, silently, and nothing
//           reported it. Counters now live in stats-wal.js, keyed by uid and
//           period rather than by book, written and recovered by BOTH pages.
//           The hide-flush 60s rate limit also gains a delta escape hatch: the
//           gap governs how often we flush, the un-flushed delta governs
//           whether we flush at all.
//
// v3.20.1 — Deleted lastSavedIndex and practiceRealLastSavedIndex: 22 references,
//           ZERO consumers. Eighteen assignments kept a "where we last saved"
//           counter accurate, and the only two reads copied it into a shadow so
//           practice mode could zero it and put it back afterwards — a value
//           carefully preserved across a mode switch and never once used to
//           decide anything. walDirty is what actually drives flushing.
//           ⚠️ Dead state is not free: every one of those eighteen sites was a
//           place a future edit could be told to "keep lastSavedIndex in sync",
//           and Round 8 nearly did exactly that rather than leave one load path
//           inconsistent. Flagged in Round 8 §6; removed here.
//
// v3.20.0 — ONE guest login ladder, replacing two that did not know about each
//           other: a one-shot prompt at 2 sprints/150s, and a separate two-rung
//           150s/300s ladder that only armed in infinity mode. They disagreed
//           about the thing that matters — the first retroactively saved the
//           guest's minutes and position into the new account, the second called
//           location.reload() and threw the session away — and the second was the
//           one firing at five minutes, with the most to lose. Now: rungs at 60s
//           and 300s of active typing, in EVERY session mode, always the
//           retroactive-save path, never a third prompt.
//           ⚠️ Fires at a SPRINT BOUNDARY, not mid-sprint. See anonNudgeDue().
//
// v3.19.1 — Book-switch guidance was written to textStream, which sits BEHIND the
//           open modal — invisible exactly when needed. "Close" also loaded the
//           book (correct behaviour, dishonest label). Hint now renders in the
//           modal; the footer button relabels to "Start Reading".
//
// v3.19.0 — Settings dropdown stopped scanning the whole `books` collection.
//           openMenuModal() did an uncached getDocs on every open — the last read in
//           the student path ignoring the caching discipline the rest of the file
//           adopted in v3.4.0. Now cached for an hour and validated by a COUNT
//           aggregation. Console escape hatch: ttbClearBookList().
//
// v3.18.0 — Flip Back reachable from the PAUSE/sprint stats screen too. That screen
//           is where a student notices they are lost — they stop typing because the
//           text stopped making sense — so requiring them to dismiss it and pause
//           again asked them to navigate out of the confusion the tool exists to fix.
// v3.17.0 — FLIP BACK. Game Genie's chapter+sentence navigation, for students, bounded.
//           ⚠️ Ceiling is `furthest`, NOT where they stand — that bound collapses on first
//           use, since flipping back makes their old place "ahead". Two-step cross-chapter.
```

### § learn.js — archived header entries

```
// v2.25.0 — ⚠️ "NOT EVERYONE GOT FIREWORKS" — the same fix as game.js v3.40.0.
//           A child who crosses their weekly goal in School and misses it now
//           gets it in Library. ⚠️ A STRAY </div> THIS ROUND INTRODUCED in
//           learn.html is fixed in that file at v1.2.0 — it is the missing top
//           margin Jake saw in Safari and intermittently in Chrome.
//
// v2.24.0 — THE TWO-ROW TOP BAR (ROADMAP item 0), identical in structure to
//           game.js v3.39.0. Daily over the lesson name on the left; WPM and
//           accuracy centred under an #hud-sprint slot that stays empty here.
//           ⚠️ THE ↺ RESTART BUTTON IS NOW ANCHORED TO .hud-section.left rather
//           than inserted after #hud-lesson-label — the label lives inside the
//           11px sub row now, and the old anchor would have rendered Restart at
//           sub-row size wedged under the Daily figure. #user-class-name is
//           gone from the bar on Jake's ruling ("forget about the class, it can
//           live in settings"); learn.js's write to it was already guarded.
//           ⚠️ NO TIMING MECHANISM TOUCHED — this is paint only.
//
// v2.23.2 — ⚠️ THE STALE DAY CARRIED FORWARD — the identical defect and the
//           identical fix as game.js v3.38.1. mergeGuestStats() guarded only
//           the SERVER side of `live - base`; this file's caller states the
//           tautology outright ("Both period guards match by construction"), so
//           the only term that could be stale was the only one unchecked. A tab
//           open overnight credited yesterday's whole day to today.
//           `liveDay` / `liveWeek` now gate the contribution AND the floor.
//           ⚠️ NO TIMING MECHANISM TOUCHED — the tick, the 3s idle threshold and
//           the drill path are byte-for-byte unchanged.
//
// v2.23.1 — ⚠️ THE READING-FONT CONTROL IS FINDABLE. v2.23.0 shipped it as a
//           bare label in #777 at 0.75rem, tucked under the lesson counter, and
//           Jake asked whether the feature had shipped at all. It had — it was
//           invisible. Now an "Aa" glyph rendered IN the chosen face, inside a
//           bordered pill, with real contrast. style.css v3.6.1.
//           ⚠️ A CONTROL NOBODY CAN FIND HAS NOT SHIPPED. "Deliberately quiet"
//           is not a defence for a feature whose entire point is a child
//           choosing something, and no render test existed to catch it —
//           drill-filter-test.mjs Part H is that test now.
//           ⚠️ IT IS ON THE MAP ONLY, STILL DELIBERATELY. A <select> inside the
//           drill view is one Tab from eating a keystroke the student typed.
//
// v2.23.0 — ⚠️ TWO STUDENT-FACING ADDITIONS, AND NEITHER TOUCHES THE TIMING
//           MECHANISM. Jake's condition, 2026-08-21, the morning after the
//           source-split cutover shipped: do these "if you think you can make
//           them without touching the timing mechanism."
//
//           NOTHING in the tick loop, the day counters, stepSeconds,
//           anonSecondsAccum, the WAL, the flush path, logRun() or the midnight
//           rollover is modified. The diff is: one import, the two RANDOM text
//           generators, one new self-contained font block, and one idempotent
//           call at the top of renderMap().
//
//           1. THE DRILL FILTER. A student reported "ass" in a lesson.
//              generateRandom() and generateReachPattern()'s phase 3 now draw
//              each group through drill-filter.js's safeGroup(), which redraws a
//              whole group that spells something. ⚠️ WHOLE-GROUP MATCHING ON
//              JAKE'S RULING — `lass`, `mass` and `asse` are FINE. Phases 1 and 2
//              of the pattern generator are deterministic and deliberately
//              untouched. An exhausted redraw budget is LOGGED and the group is
//              used anyway: a drill that never appears is worse than one that
//              briefly spells something.
//           2. THE READING FONT (ROADMAP item 8). Five faces, per-student, in
//              localStorage, scoped to #drill-text only — never the HUD, which is
//              monospace on purpose. No webfonts: a district can block a CDN.
//              ⚠️ A PROPORTIONAL FACE BREAKS THE DRILL'S NO-REFLOW GUARANTEE via
//              .dt-fixed/.dt-dirty's `font-weight: bold`; style.css v3.6.0 swaps
//              that for an underline. See the block above buildFontPicker().
//
// v2.22.0 — ⚠️ THE OVERNIGHT RESCUE, SCHOOL HALF. Mirrors game.js v3.37.0: a
//           guest who did not sign in until the next day has those minutes
//           credited TO THE DAY THEY TYPED THEM, via
//           carryGuestDaysToTheirOwnDocuments(). Inert until
//           SOURCE_SPLIT_CUTOVER — daylog.js refuses a pre-cutover day, which
//           is the §3.1 guard, not a gap.
//
//           ⚠️⚠️ AND ROADMAP ITEM 3 IS DELETED AS A PHANTOM, NOT FIXED. It said
//           `_flushStatsInner()`'s `if (!currentUser) return;` misses guests
//           "because a guest is signed in anonymously." **`signInAnonymously`
//           APPEARS NOWHERE IN THIS REPO.** There is no anonymous auth, a guest
//           has `currentUser === null`, and that guard has always caught them.
//           No orphan `typing_logs/{anonUid}_{date}` document has ever existed.
//           ⚠️ Every `currentUser.isAnonymous` test in this file and game.js is
//           therefore belt-and-braces against a state the app cannot produce —
//           harmless, and NOT evidence that the state occurs. Do not "fix" this
//           by adding another one. See HANDOFF §0.-10.J.
//
// v2.21.1 — YOU COULD NOT HARD-REFRESH IN SCHOOL. handleDrillKey() had a
//           modifier guard on its preventDefault() and nowhere else, so Cmd+R
//           (key `'r'`, length 1) walked past it into the printable-character
//           path and was cancelled at the bottom — refresh eaten, `r` scored.
//           One early return, no behaviour change to typing. See the comment.
//
// v2.21.0 — ⚠️ THREE FIXES ON THE GUEST PATH. (1) logRun() filed a guest's runs
//           under the throwaway ANONYMOUS uid — its guard tested `currentUser`,
//           but a guest IS signed in anonymously, so the guard never fired.
//           They go to GUEST_QUEUE_UID now and are adopted into the real
//           account. (2) retroactiveSaveAnonSession() adopts those records, so
//           the minutes land in the drill-down and not only in the total.
//           (3) LOGOUT NOW RELOADS, like game.js: a signed-out page was still
//           painting the departed student's `Daily 8:31 / Weekly 59:12`.
//
//
// ⚠️ THE LINE ABOVE SAID v2.16.0 FOR FOUR VERSIONS while `const LEARN_VERSION`
// said 2.19.0. tools/audit-versions.mjs has been calling that out as "one of the
// two is a lie" the whole time. Fixed here because this deploy touches the file
// anyway — HANDOFF §0.-7.D's instruction exactly.
//
// v2.20.0 — ⚠️⚠️ §3.1 IS CLOSED. THIS FILE NO LONGER WRITES THE DAY TOTAL.
//           Mirrors game.js v3.35.0 in full; read its header for the incident.
//           On and after daylog.js's SOURCE_SPLIT_CUTOVER this page writes
//           secondsSchool/charsSchool/mistakesSchool and nothing else, from a
//           counter seeded from THOSE FIELDS — never from the day total, which
//           was the v2.14.0/v3.29.0 bug that got the whole split reverted.
//           The write is date-gated through the shared daylog.js helper, so the
//           upload is safe to land on any day and changes nothing until the
//           cutover. `statsData.secondsToday` is unchanged in meaning: still the
//           whole day, still what the HUD paints.
//
//           ⚠️ `source: 'school'` IS DROPPED FROM THE POST-CUTOVER WRITE. It was
//           a single string tag on a document that can hold both modes at once,
//           and the field names now say which mode each number came from with
//           more precision than the tag ever did. It is still written on the
//           pre-cutover path, where the payload is byte-for-byte v2.19.0's.
//
// v2.19.0 — ⚠️⚠️ EMERGENCY REVERT of the v2.17.0 projection. Mirrors game.js
//           v3.34.0. HANDOFF §0.0.
//
// v2.18.0 — ⚠️ THE HUD FOLLOWS THE DOCUMENT. Mirrors game.js v3.33.0 exactly.
//
// v2.17.0 — ⚠️ STAGE 2: the daily total is DERIVED from typing_sessions, not
//           reported from this tab's counter. Mirrors game.js v3.32.0 exactly.
//           A failed session read writes NOTHING. Requires session-log.js v1.4.0
//           and daylog.js v1.1.0, uploaded first. HANDOFF §0.0.
//
// v2.16.0 — ⚠️⚠️ ONE NUMBER. `users/{uid}/stats/time_tracking` IS GONE FROM THIS
//           FILE. Day and week totals are read from `typing_logs/{uid}_{date}` —
//           the same seven documents reports.html grades from — through the new
//           shared daylog.js, identically to game.js v3.31.0. HANDOFF.md §0.0.
//
//           ⚠️ REQUIRES firestore.rules v2.5.0, DEPLOYED FIRST, and game.js
//           v3.31.0 should go up in the same batch: a page still writing the old
//           rollup is writing to a document nothing reads, which is harmless,
//           but a page still READING it would show a student a number the
//           teacher no longer has.
//
//           ⚠️ THE WEEK IS DERIVED AND STORED NOWHERE. checkForWeekRepair() and
//           `lastKnownRepairedAt` are deleted with the stored counter they
//           defended.
//
// v2.15.0 — ⚠️ THE SOURCE SPLIT IS REVERTED. Mirrors game.js v3.30.0 — see its
//           header. This file's typing_logs write is what v2.13.1 shipped:
//           the flat triple plus `source: 'school'`. DESIGN-TELEMETRY.md §2.4
//           is once again an open, known defect. The week-repair resync and
//           the remediation variety floor are untouched.
//
// v2.13.1 — EXTRACTED `_qualifyingRemediationChars()`'s FILTER into the new
//           variety-floor.js, mirroring game.js v3.28.1 exactly — see that
//           file's header. No behavior change. Closes the "no harness
//           coverage" flag Round 16 left on this logic in the previous
//           entry below.
//
// v2.13.0 — THE REPAIR RESYNC. Mirrors game.js v3.28.0 exactly — see its header
//           for the incident and full mechanism. Short version: a week-counter
//           audit repair (reports.html) was getting silently overwritten back
//           to the inflated value by the next flush from a MacBook that's
//           supposed to restart between periods but sometimes doesn't. New
//           `lastKnownRepairedAt` + `checkForWeekRepair()`, called from
//           flushStats() right before the write that would otherwise clobber
//           a repair.
//
// v2.12.0 — THE REMEDIATION VARIETY FLOOR. Closes the gap flagged in v2.11.1
//           below: "🎲 Practice missed keys" already required each letter to
//           clear n >= REMEDIATION_CHAR_MISS_THRESHOLD (3), but not that 3
//           DIFFERENT letters clear it — a student who missed only "F" a
//           dozen times could still get a synthetic key_random drill built
//           from that one letter, which isn't remediation for a pattern, it's
//           a drill on a single miss. Mirrors game.js v3.27.1's variety floor
//           exactly: same threshold, same "count qualifying letters, don't
//           just cap the display list" shape. New
//           REMEDIATION_MIN_QUALIFYING_CHARS (3) and _qualifyingRemediationChars()
//           helper (returns ALL letters clearing the per-letter threshold, not
//           the top-3 display slice); buildRemediationLinks() now checks the
//           floor before emitting the button's HTML at all — the "You often
//           missed: ..." lesson links are unaffected, since those point at a
//           real lesson per letter and were never the synthetic-drill risk.
//           Defense-in-depth: window._practiceMissedKeys() re-derives the
//           qualifying set from missedChars itself and bails if it's short,
//           the same "checked again here so nothing that reaches this
//           function directly can skip it" reasoning game.js's
//           startPracticeMode() uses. Different risk profile than game.js's
//           AI paragraph (a random-key drill, not Gemini prose one letter can
//           dominate), same fix shape.
//
// v2.11.1 — HUD LONG-FORM WIRING. ⚠️ SAME AS game.js v3.27.1's HUD half: hud.js
//           v1.2.0's new `long` flag now drives a `.hud-time-long` class and a
//           `title` attribute on #hud-time here too, kept in lockstep even
//           though School's sprintLimit is hardcoded to 0 (so `long` is always
//           false today) — see the comment at renderTimeHUD()'s hudTimer block.
//
// v2.11.0 — VERSION FOOTER REDESIGN. ⚠️ SAME AS game.js v3.27.0: #footer-primary
//           always shows learn.html/learn.js/style.css; #footer-full is the rest
//           of the deployed build (hud.js, session-log.js, stats-wal.js,
//           firebase-config.js, keyboard.js, etc.), fetched lazily on first
//           hover via versions.js's readDeployedVersions()/renderBuildList() —
//           the same mechanism index.html's build-info button already used.
//           Touch gets a tap-to-pin `.pinned` class. Replaces the old static
//           one-line footer, which showed only 'School vX / keyboard.js vY' and
//           left hud.js, session-log.js, stats-wal.js and firebase-config.js
//           with no version visible anywhere on either student page. FEATURE,
//           minor bump.
//
// v2.10.2 — ⚠️ SAME AS game.js v3.26.2: renderTimeHUD() falls back to hud.js's
//           display cache while Firestore is still being read, and loadUserStats()
//           saves to it after the authoritative read. DISPLAY ONLY.
//
// v2.10.1 — ⚠️ SAME FIX AS game.js v3.26.1: renderTimeHUD() moved OUT of the
//           gate, plus a paint at step start so there is no placeholder window
//           at all. See startGradedTimer(). Counting was correct throughout.
//
// v2.10.0 — ⚠️ ONE INCREMENT SITE. DESIGN-TELEMETRY §7 step 1.75, ruled by Jake
//           2026-08-18: time typed starts at the first CORRECT keystroke. There
//           were THREE sites — stepSeconds under the graded gate, secondsToday in
//           a second interval under an idle-only gate, and a third copy of that
//           second interval inside closeGenie() with ggBypassIdle wired
//           differently from game.js. All three are now one increment on one line
//           inside startGradedTimer(); read that function's header before adding
//           anything to it. This also closes, without fixing any of them
//           separately: the hard stop that stopped one clock and not the other,
//           the admin No-Idle flag meaning two things, and the 1s/100ms sampling
//           difference. Recorded minutes drop slightly from this deploy forward;
//           NOTHING STORED IS REWRITTEN.
//
// v2.9.1 — COMMENTS ONLY. No code, no behaviour, no field, no gate changed.
//          Invariant citations renumbered against the single consolidated
//          HANDOFF.md §5, whose numbers are APPEND-ONLY from now on. See
//          game.js v3.25.1 for why the one-time repair was unavoidable.
//
// v2.9.0 — (1) ⚠️ THE TOP-BAR READOUT MOVES TO hud.js AND IS IDENTICAL TO
//          LIBRARY'S — same element id, same string, same position. School showed
//          `Today: 9:22` and never showed the current run; Library showed one of
//          three quantities in the same slot. Both now read
//          `Daily 9:22 / 10:00` on the left and `Weekly …` on the right, and
//          renderTimeHUD() is the single writer for both.
//          (2) ⚠️ QUEUED SESSIONS UPLOAD ON HIDE AND ON pagehide, same as
//          game.js v3.25.0. See flushSessionsNow().
//
// v2.8.0 — ⚠️ THE OPEN RUN IS NOW RECORDED. Same change as game.js v3.24.0 and
//          shipped with it: a run abandoned halfway (the bell, a lid, a toggle to
//          Library) used to leave counter time with no session record. logRun()
//          writes deltas against a watermark; logOpenRun() closes the open run
//          without ending it, on visibilitychange:hidden, pagehide and
//          beforeunload. The inline sessionLogPush() in finishStep() is gone —
//          it wrote run totals, which after a partial would double-file.
//          DESIGN-TELEMETRY §7 step 1.5.
//
// v2.7.1 — Hands `serverTimestamp` to session-log.js so lesson-run rollups carry
//          `serverAt`. Identical to game.js v3.23.1 and shipped with it; if only
//          one of the two is uploaded, one mode's documents carry the field and
//          the other's do not. DESIGN-TELEMETRY.md §6.3 / §7 step 1.
//
// v2.7.0 — ⚠️ THE STATS ROLLUP NOW SHARES A WRITE TRIGGER WITH THE DAILY LOG.
//          Same change as game.js v3.23.0; read the block above the write.
// v2.6.0 — ⚠️ THE DOUBLED WEEK COUNTER, AND SCHOOL'S MISSING SESSION HISTORY.
//          The defect a student reported on 2026-08-18 was in THIS file, not
//          game.js — he was in lessons — and the report drill-down that would
//          have diagnosed it had never existed here at all.
//          (1) SESSION LOGGING, FIRST TIME EVER IN THIS FILE. Sprint rollups
//          were built in game.js in v3.4.0 and never built here, so a student
//          who spends the period in School leaves a daily total and no detail
//          behind it: no per-run WPM, no timeline, nothing to check work or
//          spot a suspicious jump against. It read as a regression from the
//          cost work because as lesson mode grew, the share of the roster with
//          any session detail fell toward zero. Now shared: session-log.js.
//          (2) A SIGNED-OUT USER IS NOT A GUEST. Auth sessions expire at 24h
//          and can expire mid-lesson. currentUser goes null, the drill tick
//          keeps counting (it never checked auth), anonSecondsAccum starts
//          climbing as though this were a visitor, and the guest ladder offers
//          sign-in 60 seconds later. That sign-in ran retroactiveSaveAnonSession(),
//          which ADDED the server's stored totals to counters that were seeded
//          from the server at page load. 20 minutes became 40.
//          (3) The merge is a BASELINE DIFF now — not a sum, and not a max().
//          Both are wrong, in opposite directions. See mergeGuestStats().
//
// v2.5.3 — HUD lesson label carries a title attribute, because style.css v3.5.1
//          ellipsises it. Cosmetic half of a layout fix that lives in the CSS.
//
// v2.5.2 — applyPendingClassAssignment() mirrors game.js v3.21.1: an explicit
//          reassignment is honoured, every exit consumes the record, records
//          expire at 30 days, and the shared goals cache is dropped on a move.
//          ⚠️ Two copies of this function exist on purpose (neither page
//          controller can import the other). Change one, change both.
//
// v2.5.1 — ⚠️ HOTFIX. beginStep() threw a ReferenceError on `resume`, a variable
//          v2.5.0 deleted with the checkpoint system while leaving one reader of
//          it in place. Every lesson start, every student, blank drill view. One
//          line; see the block at the assignment. Also: line 1 of this header
//          said v2.3.0 while the constant said 2.5.0 — corrected, both now 2.5.1.
//
// v2.5.0 — LESSONS ARE ATOMIC. Jake's ruling: a lesson not finished in one
//          sitting restarts, it does not resume at the last word. The whole
//          `ttb_learnpos_v1` checkpoint system is deleted — 143 lines, six
//          clearRunPosition() call sites, and the checkpointOwner() identity
//          that existed only to decide whose half-finished drill a snapshot
//          was. ⚠️ DO NOT REBUILD IT; read the block where it used to live.
//          Time is unaffected and now better: stopLesson() calls saveStats(),
//          so abandoning a lesson schedules its minutes for flush instead of
//          leaving them in memory until a hide. Adds a ↺ Restart control in the
//          HUD, which is the other half of "lessons can't be easily restarted"
//          — clicking a lesson you were part-way through used to resume it
//          silently, so there was no way to ask for a clean run at all.
//
// v2.4.0 — THE BLANK LESSON SCREEN, and progress that survives a closed tab.
//          (1) ⚠️ beginStep() never removed `hidden` from #active-drill.
//          learn.html ships that div hidden and showIntro() was the ONLY line
//          in the file that unhid it — so startLesson()'s resume path, which
//          skips the intro on purpose, showed #drill-view with BOTH children
//          hidden. Blank screen, no error, and only for a student who had a
//          checkpoint on the lesson they clicked, which is why it looked random.
//          (2) Guest checkpoints moved from sessionStorage to localStorage.
//          ⚠️ SUPERSEDED BY v2.5.0, WHICH DELETED CHECKPOINTS ENTIRELY. Kept in
//          this list because the reasoning is still the reasoning — v2.3.0's
//          shared-machine premise is false at Ellis and anything else keyed to
//          it is wrong for the same reason.
//          (3) Guest minutes and lesson results now persist across a tab close
//          (stats-wal.js guest accumulator, date-guarded) so retroactive save
//          on sign-in has something to credit.
//          (4) Day/week counters move to stats-wal.js, shared with game.js.
//          game.js's single WAL was book-scoped on recovery and overwritten
//          unconditionally on save, so closing a tab in one book and opening
//          another destroyed the first one's unflushed minutes. See that file.
//          (5) The hide-flush 60s rate limit gains a delta escape hatch.
//          (6) renderMap() builds into a fragment and swaps at the end, so a
//          throw leaves the previous map standing instead of a blank div.
//          (7) buildSequence()'s key_pattern case gets the `|| ''` every other
//          case already had.
//
// v2.3.0 — GUEST MODE, three fixes. (1) loadLessons()'s in-flight promise shared
//          a FAILED attempt with a caller that had different credentials: the
//          module-load call fired before auth, was denied, swallowed the error in
//          its own catch and resolved with an empty list — and the auth handler,
//          arriving 200ms later with a token, awaited that same doomed promise and
//          got a successful-looking empty map. Intermittent by construction: a race
//          against how warm the student's session was. ⚠️ Request coalescing is only
//          valid when the callers are interchangeable, and an unauthenticated caller
//          and an authenticated one are not. Failures are no longer shared.
//          (2) The comment above it claimed "lessons collection is public, no auth
//          needed" — false until firestore.rules v2.3.0, and the whole reason for (1).
//          (3) The resume checkpoint keyed guests on the literal string 'anon', so
//          two guests on one machine matched each other. Per-browser guest id now.
//          Login nudge rebuilt to two rungs at 60s/300s, matching game.js v3.20.0.
//
// v2.2.4 — applyPendingClassAssignment() drops the goals cache before re-reading.
//          loadGoals() had written ttb_goalsCache_v1 with classId:'' and a 24 HOUR
//          lifetime moments earlier, so the re-read handed back the empty class the
//          function had just fixed. game.js shares that key, so the poisoned entry
//          followed the student between pages, and every log flushed in the window
//          was stamped classId:''.
// v2.2.3 — beginStep()'s out-of-range guard called finishLesson(), which does not
//          exist in this file or anywhere in the repo. It threw a ReferenceError
//          from the one branch written to rescue the situation, abandoning
//          beginStep() before the intro was hidden or the keyboard wired: a dead
//          drill screen, no record written, nothing for a student to report. Now
//          clears the stale checkpoint and returns to the map.
// v2.2.2 — Firefox Quick Find fix, matching game.js 3.9.3. #drill-keyboard is a
//          div, so it absorbs nothing, and lessons drill punctuation on purpose.
// v2.2.1 — flushStats()'s re-entrancy guard was `if`, which serialises two
//          callers and lets three or more overlap. Now `while`.
// v2.2.0 — Read caching, backported from game.js. This page had NONE and was
//          the most-used one: ~115 reads per load became ~3.
//
```

### § lessons-admin.js — archived header entries

```
// v1.8.1 — The Students list said "31 students loaded." above a table showing one
//          row. loadStudentRoster() wrote that string AFTER _renderRoster() had
//          already written the true one — "1 student (filtered from 31)" — into the
//          same element. Two writers, one status line, and the one that ran last
//          knew less. The sentence explaining the screen existed and was destroyed
//          a line later. _renderRoster() now owns it outright, and says both
//          numbers plus which range is filtering, because the gap between them is
//          the diagnosis. Also relabelled: this panel is built from typing_logs, so
//          an imported student who has never typed cannot appear under any filter,
//          and a bare count read like enrollment.
//          (The Sat–Fri default that caused it lives in admin.html.)
//
// v1.8.0 — CSV import can CREATE the classes it doesn't recognise. It used to
//          print "class not found" in red and stop, which left the only route
//          through the Classes tab, typing each name by hand, then re-running
//          the import — for a file that already listed every name needed.
//          Two halves:
//            1. The lookup now normalises, so "Period 3", "period-3" and
//               "Period  3" all match an existing class. A large share of what
//               was reported as missing was a punctuation mismatch, and
//               creating a duplicate class for it would have been the WORSE
//               outcome — two classes, one roster split between them.
//            2. Genuinely new names are listed with a school picker and a
//               button. ⚠️ NEVER automatic: a typo'd name in a CSV is
//               indistinguishable from a new class, and silently creating
//               "Perod 3" splits a roster in a way that looks fine on the
//               screen it was made on.
//          Class id + record shape now come from _newClassId()/_newClassRecord(),
//          shared with saveClass(), so the two creation paths cannot drift.
//
// v1.7.1 — _addOneStudent() and _populateOneStudentClasses() were WIRED AND
//          MISSING. initStudentsPanel() evaluated `_addOneStudent` while
//          attaching a listener, threw a ReferenceError there, and so never
//          reached the CSV preview/commit wiring, the progress tabs, or
//          loadStudentRoster() — an empty roster and dead import buttons, with
//          _studentsInited already true so reopening the tab could not recover.
//          Both functions written from _commitCSV()/_bulkAssign().
// v1.7.0 — Lesson + class authoring, CSV roster import, stuck-student scan.
```

### § lessons-admin.js — archived header entries (second pass, v1.8.1)

```
// v1.8.1 — The Students list said "31 students loaded." above a table showing one
//          row. loadStudentRoster() wrote that string AFTER _renderRoster() had
//          already written the true one — "1 student (filtered from 31)" — into the
//          same element. Two writers, one status line, and the one that ran last
//          knew less. The sentence explaining the screen existed and was destroyed
//          a line later. _renderRoster() now owns it outright, and says both
//          numbers plus which range is filtering, because the gap between them is
//          the diagnosis. Also relabelled: this panel is built from typing_logs, so
//          an imported student who has never typed cannot appear under any filter,
//          and a bare count read like enrollment.
//          (The Sat–Fri default that caused it lives in admin.html.)
//
```

### § game.js — archived header entries (Round 29)

```
// v3.39.1 — ⚠️ THE ⚙ GEAR WAS NEVER IN THE BAR. It was appended to <body> at
//           `absolute; top:20px; right:20px`, so it floated in the reading area
//           just below the HUD, attached to nothing. Long-standing; visible in
//           every render Jake sent. Now a child of .hud-section.right.
```

### § learn.js — archived header entries (Round 29)

```
// v2.26.0 — THE CELEBRATIONS MOVED TO celebrate.js. ⚠️ This file's copies had
//           DRIFTED from Library's without anyone choosing to: a fixed 80
//           particles against 60–100, particles that never shrank as they faded,
//           and a toast with no entrance animation. School and Library now show
//           the same celebration, and the fireworks are doubled.
```

### § versions.js — archived header entries (Round 30)

```
// v1.6.0 — registers hud.js, the FOURTH shared module. Same reasoning as v1.5.0.

// v1.5.0 — registers session-log.js, the THIRD module game.js and learn.js both
// import. The warning below applied to stats-wal.js and applies here twice over:
// this one is the only writer of typing_sessions on either page, so a stale
// cached copy takes out the teacher's entire drill-down — on both pages at once,
// with the build panel showing three correct version numbers and no sign of the
// fourth.
```

### § game.js — archived header entries (Round 30)

```
// v3.40.0 — ⚠️ "NOT EVERYONE GOT FIREWORKS." The goal suppression asked whether
//           the total was already past the goal — true for the rest of the week
//           — rather than whether the child had actually been SHOWN it. One
//           missed moment was the whole week's fireworks. Now latched per period
//           via hud.js v1.4.0, so a crossing missed in one mode fires in the
//           next. ⚠️ The daily goal hid the same defect because it re-arms every
//           morning.
```

### § learn.js — archived header entries (Round 30)

```
// v2.27.0 — "I'M DONE" (ROADMAP item 0d), the School half of game.js v3.42.0.
//           ⚠️ `tabindex="-1"` IN THE MARKUP IS LOAD-BEARING — item 8's ruling
//           says a focusable control inside the drill is one Tab away from
//           eating a keystroke the child should have been credited for. Mouse
//           only. ⚠️ NO TIMING MECHANISM TOUCHED; this files the open run and
//           takes the flush that every other exit path already takes.
```

### § learn.js — archived header entries (Round 34)

```
// v2.31.0 — ⚠️ TWIN OF game.js's _buildNotesAllowed(). Read at RENDER time and
// never cached: the panel outlives the sign-in, so a guest hover followed by
// Jake signing in on the same tab must show more on the next hover.
// ⚠️ A DISPLAY GATE, NOT A SECURITY ONE — everything it hides is in the raw
// .js files anyone can open, and none of it is student data.
function _buildNotesAllowed() {
    return isStaffUser(currentUser);
}

function _renderFullBuildPanel(results) {
    const full = document.getElementById('footer-full');
    if (!full) return;
    const showNotes = _buildNotesAllowed();

    let html = `<div style="opacity:.6;margin-bottom:4px">learn.html (this page)</div>`
             + renderBuildList(results, { notes: showNotes });
    // keyboard.js is imported statically (not dynamically like game.js's
    // adventure-renderer.js), so KB_VERSION here IS the deployed constant —
    // no separate drift check needed the way adventure-renderer.js gets one.
    // ⚠️ WHICH IS WHY THIS COUNT HAS NO `+ (drift ? 1 : 0)` TERM and game.js's
    // does. The twins differ here on purpose; do not "fix" it into symmetry.
    html += renderHiddenNotesLine(showNotes ? 0 : countBuildNotes(results));

    full.innerHTML = html;
    full.dataset.notes = String(showNotes);
}

// ⚠️⚠️ v2.33.0 — THIS NO LONGER KEEPS ITS OWN "already loaded" FLAG.
// It used to return early on `dataset.loaded === 'true'`, which was a THIRD
// layer of staleness on top of versions.js's cache and the HTTP cache — and the
// one that made a hard reload useless, because nothing in the chain expired
// inside a tab. versions.js v1.13.0 owns the freshness policy now (60s TTL,
// page-scoped), so every hover simply asks and lets it decide whether that costs
// a fetch. HANDOFF §0.-22.
//
```

### § learn.js — archived header entries (Round 34)

```
// v2.29.1 — DEAD CODE. updateWeeklyHUD() deleted: its comment claimed "several
//           call sites" and there were zero. Found by the new
//           tests/dead-handler-test.mjs. No behaviour change. §0.-18.
//
```

### § learn.js — archived header entries (Round 32)

```
// v2.29.0 — ⚠️⚠️ THE ⚙ IS AVAILABLE DURING A DRILL AND THE CLOCK PAUSES, on
//           Jake's ruling the same day: *"I meant not to break the ability to
//           track the time accurately. It acting the same way it does in library
//           mode — namely, counting time typed and pausing when necessary — is
//           just fine."* v2.28.0 hid the gear during a drill on the stricter
//           reading of item 7b/8's condition; this replaces that with a pause.
//           ⚠️ THE RISK IS THE RESUME. A pause that never resumes means a child
//           types on while NOTHING COUNTS. It rides on settings-panel.js's
//           `onClose`, in a `finally`, from the one close() all three dismiss
//           paths share, guarded on `drillRunning`. drill-filter F7c1–c5.
//           ⚠️ IT IS A TENTH CALLER OF AN EXISTING PATH, NOT A NEW MECHANISM —
//           `learnTickInterval` is an alias for `timerInterval` and nine sites
//           already stop the clock this way. No second timer, no second gate.
//           ✅ The student ID joins the panel, on Jake's ask.
//
```

### § learn.js — archived header entries (Round 31b)

```
// v2.28.0 — ⭐ THE SCHOOL SETTINGS PANEL (ROADMAP item 0b). A ⚙ in the top bar
//           opens settings-panel.js's dialog. THREE things that had nowhere to
//           live now do: the reading font, the child's CLASS, and their goals.
//           ⚠️ THE CLASS IS THE DEBT v2.24.0 CREATED, BEING PAID —
//           `updateClassDisplay()` had been writing to `#user-class-name`, an
//           element deleted from learn.html in that same version, so the text
//           went nowhere at all. Same shape as §0.-13.C's orphaned paint.
//           ⚠️ RULE 9 — THE FONT MODEL MOVED, IT WAS NOT COPIED. DRILL_FONTS,
//           applyDrillFont(), readDrillFont() and buildFontPicker() are DELETED
//           from this file in the same deploy that adds them to
//           settings-panel.js. drill-filter-test F9b asserts no copy came back.
//           ⚠️⚠️ THE GEAR IS HIDDEN DURING A DRILL AND THAT IS DELIBERATE —
//           Library's ⚙ pauses the game first and School CANNOT, because item
//           7b/8 shipped on Jake's condition "without touching the timing
//           mechanism" (drill-filter F7). Read the block above
//           ensureSettingsButton() before changing it. HANDOFF §0.-16.
//
```

### § learn.js — archived header entries (Round 31)

```
// v2.27.1 — ⚠️ STAMP ONLY, NO BEHAVIOUR. `const LEARN_VERSION` still read
//           "2.23.1" after v2.23.2, v2.24.0, v2.25.0, v2.26.0 and v2.27.0 all
//           shipped — the School half of game.js v3.42.1, same defect, same
//           evening, which makes the version stamp the FIFTH hand-maintained
//           twin to fail in one day (HANDOFF §0.-13.E counted four).
//           ⚠️ ROADMAP told Jake to check the footer for v2.23.2 on Monday. A
//           correctly deployed build was going to answer "2.23.1" — one patch
//           BELOW the stale-day fix, i.e. exactly the reading that means "the
//           fix is not running". See HANDOFF §0.-14.
```

### § lessons-admin.js — archived header entries (Round 33)

```
// v1.9.0 — Import JSON validates STEPS, not just lesson ids. parseImportJSON()
//          checked one field — that each lesson had an `id` — and wrote whatever
//          else the file held straight to Firestore. learn.js reads a different
//          field per step type, so a step whose type and fields disagree yields
//          either a throw out of renderMap() or a drill with no characters. Both
//          look like a blank screen, in another file, to every student at once,
//          and neither names the lesson. ⚠️ The validator belongs at import
//          because that is the last moment a human is looking at the file.
//          Rejects rather than repairs, reports every problem rather than the
//          first, and names lessons by id rather than by array index.
//
```

### § admin.js — archived header entries

```
// v3.26.0 — ⚠️ THE SOURCE AND LICENSE AUTOFILLS HAD NEVER ONCE BEEN RIGHT. Of 24 books in
//           library/, two ever matched an option: SE put a gutenberg.org URL in Source
//           (dc:source is UPSTREAM, read before dc:publisher) and a 90-word paragraph in
//           License. Both now map through canonicalSourceFrom()/canonicalRightsFrom(). The
//           mismatch panel argued the paragraph back in; the v3.20.0 warning was overwritten
//           by its own summary say(). Origin URL read from Gutenberg's #pg-header.

// v3.25.3 — ⚠️ AN OVERWRITE REPLACED A HAND-SOURCED COVER WITH NO PROMPT. Jake found a
//           real jacket photograph for a Hancock title, re-uploaded the Gutenberg EPUB
//           for its metadata, and the parse staged Gutenberg's generic placeholder over
//           it; Upload All then wrote that to Storage. The cover was the most hand-made
//           field on the screen and the only one with no protection. A file's cover is
//           now only staged when the book has NONE; otherwise it is offered in the
//           mismatch panel with both images side by side.

// v3.25.2 — ⚠️ DATA-LOSS GUARD. The overwrite file input and the mismatch panel both
//           survived a change of book, so Jane Eyre could sit selected with a football
//           book still loaded in "Overwrite Data with New EPUB" — and Process Overwrite
//           reads the input, not the book. One click would have replaced Jane Eyre's
//           chapters. The stale panel was the visible, harmless half; the loaded file
//           was the dangerous half and predates the panel entirely.
```

### § versions.js — archived header entries

```
// v1.4.0 — registers stats-wal.js, the second module game.js and learn.js both
// import. ⚠️ A shared module that is not in this list is the worst kind to have
// stale: a cached copy of it misbehaves on BOTH pages at once, and the build
// panel would show two files at their correct versions and no sign of the third.
```

