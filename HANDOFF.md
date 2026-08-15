# HANDOFF — Round 9 (Remington)

<!-- HANDOFF.md v9.0.0 — Round 9, instance "Remington", 2026-08-15.
     ⚠️ SUPERSEDES Round 8. Archive Round 8 as HANDOFF-round8.md rather than
     overwriting it. Round 8 §4 (invariants 37–55), §7 (browser spot-checks) and
     §8 (working with Jake), plus Round 7 §5 and §8, are STILL LOAD-BEARING and
     are NOT restated here. Go and read them. -->

**Instance:** **Remington** (9) · Yost (8) · Hammond (7) · Noiseless (6) · Mignon (5)
· Oliver (4) · Blick (3) · Dvorak (2) · Underwood (1)
· *other projects:* Stedman, Fable, Trilby, Vernier

> *On the name:* the Remington 2's innovation was the shift key. The capitals were
> already on the type-bars — the double-keyboard machines it replaced gave every
> capital its own key because nobody had worked out how to reach the ones already
> there. One lever, and half the machine became usable. This round was the same
> shape: the entire guest-mode feature was written, sitting in the codebase,
> reachable by a single line in a file nobody had connected to it.

---

## §0. What this round was

Jake's brief: *"students have to log in to see anything, and they should be able
to see stuff without logging in. It just shouldn't track their progress unless
they log in… Also — every student has to refresh the page to see any books after
logging in. Lessons sometimes don't load for some students — it just goes to
white."*

Three symptoms. **One root cause, and it was not in any of the three files that
looked guilty.**

⚠️ **THE FEATURE WAS ALREADY BUILT AND HAD NEVER ONCE EXECUTED.**
- `game.js` had an explicit signed-out branch — the comment reads *"No anonymous
  sign-in — just load the book as read-only"* — loading metadata and the first
  body chapter with no user.
- `learn.js` had a signed-out branch, a login nudge, and a
  `retroactiveSaveAnonSession()` that folds a guest's minutes into their account.
- **29 sites** across the two files guarded writes with
  `!currentUser || currentUser.isAnonymous`.

`firestore.rules` had `allow read: if signedIn()` on `books`, `books/*/chapters`,
`lessons` and `settings`. A guest is `request.auth == null`. So every page began
by reading content it was not allowed to read, got permission-denied, and drew an
empty shelf. **No page in the app ever asked a student to log in. Firestore just
returned nothing.**

---

## §1. Version state — `audit-versions.mjs`: 2 problems, both pre-existing

`node run-all-tests.mjs` → **19 of 19 pass** (17 + two new).

| file | version | changed? | upload? |
|---|---|---|---|
| `firestore.rules` | **2.3.0** | ⚠️ yes — the actual fix | **CONSOLE PASTE** |
| `game.js` | **3.20.1** | ⚠️ yes — ladders merged, then dead state deleted | **YES** |
| `learn.js` | **2.3.0** | ⚠️ yes — three fixes | **YES** |
| `index.html` | **3.7.0** | ⚠️ yes — load sequencing | **YES** |
| `lessons-admin.js` | **1.8.0** | ⚠️ yes — CSV can create classes | **YES** |
| `reports.html` | **2.9.0** | version driven from a constant | **YES** |
| `package.json` | — | ⚠️ devDependencies; suite runs on a clean clone | commit it |
| `anon-ladder-test.mjs` | **1.0.0** | new harness, 34 assertions | commit it |
| `class-create-test.mjs` | **1.0.0** | new harness, 26 assertions | commit it |
| `firestore-rules.test.mjs` | **1.2.0** | guest boundary asserted | commit it |
| `run-all-tests.mjs` | — | registers both new harnesses | commit it |
| everything else | — | no | — |

The 2 audit problems are `admin.js` v3.31.0's header budget (69 lines / 7 entries
against 60 / 6). **Not mine, not touched.** Round 8 left 4; game.js's two are
now cleared.

⚠️ **Round 8's table claimed `admin.js` was v3.30.0. It is v3.31.0.** That is
three rounds running where the handoff's own version table was stale on this
exact file. **Run the audit. Do not trust this table either.**

---

## §2. The rules change, and the road not taken

`books` / `chapters` / `lessons` → `allow read: if true`. `settings` **split by
document id**: `settings/goals` public, `settings/languageFilter` still behind
auth, because publishing a curated list of slurs has no upside.

### ⚠️ 2.1 Anonymous Auth was the wrong answer and the rules file recommended it

The comment on `signedIn()` read: *"signedIn() is TRUE for Firebase Anonymous
Auth users. Intentional — game.js lets students play anonymously."* Every clause
true except the premise. **`signInAnonymously` appears nowhere in the repo.** No
user has ever been anonymous. `firestore-rules.test.mjs` carried the same belief
in a comment, next to an assertion that guests can read nothing — which passed,
and which was describing the bug.

Enabling anonymous auth would make `signedIn()` true for the entire internet,
silently widening **six** grants with nothing to do with reading a book:
`leaderboard` read *and* write-your-own-uid, `typing_logs` create/update,
`typing_sessions` create, `practice_sessions` create, `schools` read, `classes`
read, `staffRequests` create. The client-side `isAnonymous` guards do not help —
rules are the boundary and the client is not.

⚠️ **A comment asserting a permission is a claim about a DIFFERENT file, and
nothing checks it.** Three separate files carried the anonymous-auth belief. The
new comments name the rule and its version so the claim can be falsified by
someone reading one line. That is invariant 56.

---

## §3. The two coalescing bugs — the same defect, twice, one of them mine

### 3.1 `learn.js` — this is the white screen

```js
if (_lessonsInFlight) return _lessonsInFlight;   // ← the bug
```

The module-load `loadLessons()` fired before auth, was denied, **swallowed the
error in its own catch** and resolved with an empty list. The auth handler
arrived ~200ms later holding a token that would have worked, found a promise in
flight, awaited it, and inherited a failure it was never subject to. Empty map.
No error. Nothing for a child to describe beyond "it went white".

⚠️ **Intermittent by construction.** It turned on whether the denial landed
before or after auth settled — i.e. on how warm that student's session was.
"Sometimes, for some students" was the literal shape of the race.

⚠️ **REQUEST COALESCING IS ONLY VALID WHEN THE CALLERS ARE INTERCHANGEABLE, AND
AN UNAUTHENTICATED CALLER AND AN AUTHENTICATED ONE ARE NOT.** Successes are
shared; failures send the second caller to try on its own credentials.

⚠️ **An empty result counts as a failure.** A denied read and a genuinely empty
collection are indistinguishable downstream — both draw a blank map — so the one
a retry might fix wins. Costs one extra read on an empty database, which only
exists before the first lesson is authored.

### 3.2 ⚠️ `index.html` — I INTRODUCED THIS ONE WHILE FIXING THE REFRESH BUG

`loadBooks()` ran once at module load and `onAuthStateChanged` only called
`renderBooks()`, so signing in re-rendered the same empty array — a faithful
drawing of nothing. The fix is obvious: re-load when the identity changes.

**And that fix creates two callers where there was one, which is exactly the
learn.js defect.** I had just written a 20-line comment about it in the other
file and still reached for `if (inFlight) return inFlight` here. Caught it before
shipping; it is worth writing down that having diagnosed a bug an hour earlier
was not enough to stop me rebuilding it. Both now use the same guard shape, and
`anon-ladder-test.mjs` asserts both.

⚠️ **The rules fix alone makes index.html work, which is exactly why it was
still wrong.** A page that loads its data once, before it knows who is asking,
and never reloads when the answer changes, is one permission change from the
same silent empty screen. **The bug was the missing reload, not the denied read.**

---

## §4. game.js v3.20.0 — two ladders that disagreed about what "yes" means

There were **two guest login prompts** and they did not know about each other:

| | old ladder A | old ladder B |
|---|---|---|
| trigger | 2 sprints **or** 150s | 150s, then 300s |
| fired from | sprint end | the tick, **only if `sessionLimit === 'infinity'`** |
| one-shot? | yes, session-scoped | two rungs, persisted daily |
| **on sign-in** | **retroactively merged** minutes, chars, mistakes and reading position into the account | **`location.reload()`** — discarded the whole session |

⚠️ **THE DUPLICATION IS THE VISIBLE DEFECT AND THE DIVERGENCE IS THE EXPENSIVE
ONE.** Which function happened to answer the click decided whether the child's
work survived — and the ladder that threw it away was the one firing at five
minutes, with the most typing behind it. Merging the copy without merging the
behaviour would have fixed the symptom and kept the loss.

Also: because B was gated on infinity mode, **the 5-minute rung never fired for
the default 30-second sprint at all.** Most students only ever had A's single
prompt. Jake asked for "a minute, then five" believing neither existed; half of
it existed and was unreachable.

Now: one ladder, rungs at **60s and 300s of active typing**, every session mode,
always the retroactive-save path, **never a third prompt**.

### ⚠️ 4.1 The arithmetic trap, which would have shipped silently

`pauseGameForBreak()` folds `sprintSeconds` into `anonTotalSeconds` and does
**not** zero `sprintSeconds` — `startGame()` does, later. So at the boundary the
live total is `anonTotalSeconds` **alone**, and the obvious
`anonTotalSeconds + sprintSeconds` counts the sprint twice, moving rung 2 to
roughly 4:30 on a 30-second sprint. **A ladder that fires early is not something
a child reports.** `anonNudgeDue()` therefore takes the total as an argument and
does no arithmetic of its own; the two call sites pass different expressions and
the harness asserts both.

### 4.2 It arms on the tick and fires at a boundary

Same in both files, for different reasons. In `game.js`, yanking a child out
mid-sentence strands a partial sprint that then needs hand-logging (which is why
ladder B carried its own copy of the sprint-end maths). In `learn.js` it is
worse: the dismiss handler calls `beginStep(currentStepIdx)`, which **restarts
the run from zero** — so declining the prompt destroyed the typing the prompt was
praising. Infinity mode fires immediately, because no boundary is ever coming.

### 4.3 One key, shared between the pages

`ttb_anonNudge_v2` is read and written by both files. A child who declines in
School and then opens a book is the same child; two private ladders would prompt
them twice for the same rung. Seconds stay per-page; the rung reached is shared,
so the ladder only climbs. **New key on purpose** — the old one held counts under
different rung meanings and reading it would have started students partway up a
ladder whose rungs had moved.

---

## §5. learn.js — the guest checkpoint identity

`readRunPosition()` compared `currentUser ? currentUser.uid : 'anon'`. For
signed-in students the uid did the job its comment claimed ("don't hand one
student's position to another on a shared Chromebook"). **For guests it compared
a constant to itself and always passed.**

⚠️ **A PER-BROWSER GUEST ID WOULD NOT HAVE FIXED IT.** That was my first
instinct and it is the same bug with a longer string: two guests on one browser
profile share `localStorage`, so they would share the id. What separates them is
the **tab** — `sessionStorage` dies with it, so the next student is a different
owner by construction.

The cost, stated plainly: **a guest who closes the tab loses their resume point.**
Correct trade. We cannot tell whether the next child at that machine is the same
one, and we have told them twice that nothing is being saved. Signing in is what
buys a durable checkpoint.

Pre-v2.3.0 checkpoints carry `uid:'anon'`, which matches no owner the new
function can produce, so they are discarded. That is the intended migration —
there is no way to find out whose they were.

---

## §5a. `lessons-admin.js` v1.8.0 — CSV import can create the classes it names

Jake, mid-rollout of the rest of this round: *"when I upload classes, I can't
create classes on upload. It tells me the classes don't exist rather than saying
they don't exist and asking if I'd like to make them."*

The report matched the code on the first read — `_previewCSV()` printed
`class not found` in red and stopped. The only route was the Classes tab, typing
each name by hand, then re-running the import, **for a file that already listed
every name needed.**

### ⚠️ 5a.1 The lookup had to be fixed FIRST, or the feature makes things worse

`classLookup` keyed on `name.toLowerCase()` and nothing else. A roster export
writing `Period 3` against an existing class named `Period-3` was reported
missing. Harmless while "missing" only produced a red message — **and actively
destructive the moment "missing" produces a CREATE.** The obvious version of
this feature, built on the old lookup, answers a punctuation mismatch by making
a second class with the same name and splitting the roster across both. Nothing
throws; the Classes list shows two entries that look identical; reports quietly
disagree with the teacher's own count.

**Generalise: before giving a "not found" branch the power to create, check what
counts as found.** A tolerant matcher and a creating branch are the same
feature; shipping the second without the first manufactures duplicates.

`_classKey()` strips case and non-alphanumerics, so those four spellings are one
class. `class-create-test.mjs` asserts both directions — that the variants
collapse, and that `Period 3` / `Period 4`, `7th CS` / `8th CS` and
`Mrs Smith AM` / `Mrs Smith PM` stay distinct.

### ⚠️ 5a.2 The harness caught a real hazard in my own normaliser

An assertion about `_newClassId('!!!')` failed. Chasing the cosmetic symptom
(a leading underscore in the id) led to the actual defect: **a name that
normalises to the empty string would be looked up as `''`, and would match any
other class whose name also normalises to empty** — a lookup hit assigning
students to a class nobody named. `_isUsableClassName()` now rejects those
before lookup or creation, and `_newClassId()` falls back to a `class_` prefix.
Invariant 47, working: the expected value is where the misconception lives.

### 5a.3 Deliberate choices

- **Creation is a button, never automatic.** A typo'd name in a CSV is
  indistinguishable from a new class, and the resulting split roster looks
  correct on the screen it was made on. The panel lists the names, says how many
  students each would take, and tells the admin to read them first.
- **`schoolId` is required and comes from a picker.** `firestore.rules` demands
  it on create; there is no honest way to derive a building from a file of
  emails. No schools → the panel says so instead of offering a doomed button.
- **Goals are 0.** A class created from a roster file has no stated target, and
  inventing one puts a number in a student's HUD that nobody chose.
- **It re-runs `_previewCSV()` rather than patching the table.** `_csvParsed` is
  built against `_classCache`; painting rows green after the cache changed would
  leave the commit writing pre-creation values.
- **Failures are named individually.** "3 of 5 failed" means redoing all five.
- **`_newClassId()` / `_newClassRecord()` / `_loadSchoolOptions()` are now
  shared** with `saveClass()` and `populateClassSchools()`. Two creation paths
  with private copies of the id scheme is §4's divergence waiting to happen, and
  the harness asserts the id scheme appears exactly once in the file.

⚠️ **Stale comment corrected while in there.** `saveClass()` justified writing
`teacherUids` with *"claim.classIds is derived from teacherUids"*. That
mechanism was **deleted** in Cloud Functions `index.js` v1.6.0, which removed
seven custom-claims functions no client called and no rule consulted. The line
still earns its place — `firestore.rules` scopes teachers by `teacherUids` on
the class document — but the stated reason had been wrong for rounds. Same shape
as §2.1: a comment describing machinery that no longer exists.

⚠️ **`_onClassesChanged()` is probably vestigial for the same reason** — it
exists to refresh a custom-claims token. Called once per batch here to match
existing behaviour. **Not investigated. Do not delete it without checking
`admin.js`'s hook first.**

## §5b. Round 10 — the cleanups, and one handoff claim that was backwards

### ⚠️ 5b.1 `package.json` — Round 8's *correction* was the error

Round 8 §5 listed, under "Two things earlier drafts of this handoff said that
were WRONG", the claim that the harnesses need packages `package.json` does not
declare. It called that **False** and wrote *"jsdom, acorn, acorn-walk and jszip
are all declared"* into both the handoff and the README.

**Open the pristine file. `dependencies` contains `firebase-admin` and
`firebase-functions`. That is all it has ever contained.** The original complaint
was true and Round 8 overturned it wrongly — in the same section that added
**invariant 55, "Verify your own complaints before writing them down."**

The mechanism is worth more than the fact. Round 8's container had those packages
installed from an earlier session, so `node run-all-tests.mjs` ran green, and **a
working test run was taken as proof of a declaration nobody opened the file to
check.** The suite was evidence about the machine, not about the repository.

Consequence until now: `git clone && npm install && node run-all-tests.mjs`
failed on a clean machine with seven `ERR_MODULE_NOT_FOUND`, and the documented
remedy — install them by hand — wrote them into `dependencies`, where
`package.json` is the **Cloud Functions** package (`"main": "index.js"`) and they
would ride to the next deploy.

Now `devDependencies`, which `firebase deploy` does not install, plus `npm test`
and `npm run test:epubs`. **Verified by unzipping the original archive into a
clean directory and running `npm install && npm test`: 19/19.** That had never
been true before.

### 5b.2 `lastSavedIndex` — 22 references, zero consumers

Eighteen assignments kept a "where we last saved" counter accurate. The only two
reads copied it into `practiceRealLastSavedIndex` so practice mode could zero it
and hand it back on exit. A value carefully preserved across a mode switch and
never once used to decide anything; `walDirty` is what drives flushing.

⚠️ **Dead state is not free, and the cost is not bytes.** Every one of those
eighteen sites was somewhere a future edit could be told to "keep
`lastSavedIndex` in sync" — and Round 8 did exactly that, adding a nineteenth
assignment rather than leave one load path inconsistent with a variable that does
nothing. **The gravity of an unused field is proportional to how carefully it is
maintained.** Both variables are gone.

### 5b.3 `reports.html` — the last surface carrying its version by hand

Hardcoded in the `<title>` **and** the `<footer>`: two copies of one number,
updated by hand. That is the exact arrangement `index.html` was in when its title
said 3.0.0 and its footer said 2.3.1. Both now written from `REPORTS_VERSION`.

⚠️ **Not added to `versions.js`'s `SOURCES`**, so the build panel still does
not list it. That manifest is JS-only and its header-budget parser expects a
leading `//` block, which an HTML file has nowhere to put. `index.html` is absent
for the same reason and self-reports instead. Adding both wants `HEADER_EXEMPT`
entries and a `versions.js` bump — a real improvement, not this round's.

---

## §6. Invariants — additions to Round 8 §4 (37–55), which still applies

56. ⚠️ **A comment asserting a permission is a claim about a different file, and
    nothing checks it.** Three files here carried "lessons are public" / "anon
    auth lets students read books". All false, for years. When code depends on a
    rule, name the rule **and its version**, so one line can be falsified.
57. ⚠️ **Request coalescing is only valid between interchangeable callers.** An
    unauthenticated caller and an authenticated one are not. Share successes;
    never share a failure with someone who would have succeeded.
58. **An empty result and a denied one are indistinguishable downstream.** If
    both render the same blank screen, treat the ambiguous case as the one a
    retry can fix.
59. ⚠️ **When two subsystems implement the same prompt, the duplication is the
    visible defect and the divergence in what they DO is the expensive one.**
    Ask what each one does when the user says yes, before merging the copy.
60. **A feature gated on a mode nobody uses has not shipped.** The 5-minute rung
    existed for months behind `sessionLimit === 'infinity'`. Grep for the gate
    before concluding a behaviour is absent — and before building it again.
61. ⚠️ **Diagnosing a bug does not inoculate you against writing it.** I fixed
    the shared-failure coalescing bug in `learn.js` and reached for the identical
    broken shape in `index.html` within the hour.
62. **The fix that makes a symptom disappear is not always the fix for the bug.**
    Public read makes `index.html` work; the missing reload is still the defect.
    Ask: *if the thing I just changed changed back, would this break again?*
63. **A per-device id is not a per-person id.** Anything keyed to storage a
    shared machine shares is keyed to the machine. Scope to the session when the
    session is the only thing that distinguishes people.
64. ⚠️ **A harness that crashes instead of reporting tells you less than one that
    survives.** My first draft threw a ReferenceError against the pre-round file
    — a failure, but it hid the other 33 assertions behind a stack trace, and
    running it against old code is the whole point.
69. ⚠️ **A green test suite is evidence about the machine it ran on.** Round 8
    inferred a `package.json` declaration from the fact that the harnesses ran,
    and the packages were merely installed in that container. Before claiming a
    dependency is declared, open the file — running the code proves a different
    thing.
70. ⚠️ **Correcting a predecessor deserves the same verification as accusing
    one.** Round 8 overturned a true complaint while writing the invariant about
    verifying complaints. A retraction feels like humility and lands in the
    record with exactly the same authority as the original claim.
71. **The gravity of dead state is proportional to how carefully it is
    maintained.** `lastSavedIndex` had eighteen assignments and no consumer, and
    its very tidiness is what recruited Round 8 into adding a nineteenth. Delete
    it, or every future edit inherits an obligation to nothing.
72. **Test the fresh-clone path, not the working-directory path.** The
    environment that has been building the thing is the one environment
    guaranteed not to reproduce a new contributor's experience.

66. ⚠️ **Before giving a "not found" branch the power to create, fix what counts
    as found.** A tolerant matcher and a creating branch are one feature.
    Shipping the create half against a strict matcher manufactures duplicates,
    and duplicates of a container — a class, a folder, a tag — silently split
    everything filed into them.
67. **A normaliser that can return empty has an implicit wildcard in it.** Any
    two inputs that normalise to nothing match each other. Reject the empty case
    at the boundary rather than trusting that nobody types punctuation.
68. **Say which one failed.** A batch reporting "3 of 5 failed" forces a retry of
    all five; the per-item error usually names the one condition that differs.

65. **Say which assertions are behavioural and which are structural.** Half of
    `anon-ladder-test.mjs` reads source text. Those catch invisible, expensive
    defects and they also break on innocent refactors. A harness that does not
    grade its own assertions invites them to be trusted equally.

---

## §7. ⚠️ What to check in a browser, in order

Jake walked the guest path after the rules paste and reported the library, a
book, and a lesson all working, with a nudge at 2 minutes (the old learn.js
`ANON_REMIND_AFTER_SECONDS = 120`). **That number is the regression test for
this round: it must now be 1 minute.** If it is still 2, learn.js did not upload.

0. **Incognito, not signed in.** Library grid → open a book → type. Then School →
   a lesson → a drill. Aesop's Fables for the book, per Round 8 §7.
1. **The ladder.** Type for one minute as a guest → gentle prompt at a sprint
   boundary. Decline. Keep going to five minutes → the blunt one, saying "last
   time I'll ask". Keep going → **nothing, ever again.**
2. ⚠️ **The part that actually matters: click SIGN IN on the five-minute
   prompt.** The minutes shown must land in the account. Old ladder B reloaded
   and lost them. This is the divergence in §4 and the only way to test it.
3. **Cross-page.** Decline in School, open a book: the next prompt should be the
   five-minute one, not the one-minute one again.
4. **Two guests, one machine.** Guest drill halfway, close the tab, reopen: the
   drill starts clean, not resumed. Signed in, same test: it resumes.
5. **The refresh bug.** Sign in from a cold library page. Books appear **without
   a refresh**. Then sign out and in as someone else: pips must change.
6. **Console.** No `permission-denied` on any guest page.
7. **Admin, CSV import.** Upload a roster naming a class that does not exist. The
   panel should list it, say how many students it covers, and offer a building
   picker. Create it, and the preview must **re-check itself** — amber rows turn
   green and Commit lights up without re-picking the file.
8. **Reports page.** Title and footer should both read v2.9.0 and agree.
9. ⚠️ **The one that matters more:** a roster naming a class that DOES exist with
   different punctuation (`Period 3` against `Period-3`). It must match silently
   and offer to create nothing. If it offers, the normaliser is not reaching the
   lookup and you are one click from a duplicate class.

**I have clicked none of this.** The harness is 34 assertions against extracted
functions and source text; it has never rendered a pixel.

---

## §8. Open, and not mine to close

- **Round 8's two unresolved rulings still stand.** Does re-reading a chapter
  un-tick its ✓? Should a hard time cap override a confirmed anchor match? Both
  answered by default rather than by decision.
- **App Check enforcement.** Wired in `firebase-config.js` v1.2.0, never
  enforced. This moved up in priority the moment content became world-readable —
  it is now the only thing between Jake's card and a scraper. ⚠️ Run
  `ttbAppCheckStatus()` on a real school MacBook on the school network first; a
  district filter blocking recaptcha paths turns enforcement into a total outage.
- **`firestore-rules.test.mjs` has still never been executed.** v1.1.0 said so;
  so does v1.2.0. Its three new assertions are the only automated statement of
  where the guest boundary is, which makes them worth the emulator setup more
  than the rest of the file.
- **`lastSavedIndex`** — eighteen assignments, two reads. Round 8 flagged it;
  still there. I deleted `anonSprintCount` and `anonLessonsCompleted` for the
  same reason, which is the smaller half of the same job.
- **`package.json`** ships `jsdom`/`acorn`/`jszip` to the Cloud Functions deploy
  as dead cold-start weight.

## §9. Jake — working with him

Round 8 §8 and Round 7 §8 still hold. Adding:

- **He tests immediately and reports the number, not the impression.** "Got a
  reminder at 2 minutes" was a version fingerprint — it identified which of the
  four ladders had fired, on which page, from which file, in one clause.
- **He tells you when something is good enough.** *"Books did take a literal
  second to load, but that's not horrible."* That is a decision, not a
  complaint; do not go optimise it.
- **"What's next in the roadmap?" means give an ordered list with reasons.** He
  picked item 2 and skipped nothing.
