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

`node run-all-tests.mjs` → **18 of 18 pass** (17 + one new).

| file | version | changed? | upload? |
|---|---|---|---|
| `firestore.rules` | **2.3.0** | ⚠️ yes — the actual fix | **CONSOLE PASTE** |
| `game.js` | **3.20.0** | ⚠️ yes — ladders merged | **YES** |
| `learn.js` | **2.3.0** | ⚠️ yes — three fixes | **YES** |
| `index.html` | **3.7.0** | ⚠️ yes — load sequencing | **YES** |
| `anon-ladder-test.mjs` | **1.0.0** | new harness, 34 assertions | commit it |
| `firestore-rules.test.mjs` | **1.2.0** | guest boundary asserted | commit it |
| `run-all-tests.mjs` | — | registers the new harness | commit it |
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
