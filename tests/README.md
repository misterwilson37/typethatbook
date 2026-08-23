# tests/

<!-- tests/README.md v1.8.0 — Round 31 (Fitch), Round 30 (Postal), Round 29
     (Odell), Round 28 (Daugherty), Round 21

     v1.8.0 — Round 31 (Fitch). NEW: exit-flush-test.mjs — ROADMAP 14b.
     ⚠️ PART A DRIVES THE OLD, BROKEN EXIT AND MUST KEEP LOSING RUNS. It passes
     on both builds by construction and is the ONLY evidence that Parts B–F are
     measuring anything; if A2 ever reads twelve, the model has gone insensitive
     and the green below it is worthless. ⚠️ TWO MODELLING DETAILS WERE
     LOAD-BEARING AND BOTH WERE WRONG ON THE FIRST ATTEMPT: the page's state must
     be real BINDINGS rather than a snapshot object (the defect IS a
     reassignment, so a copy made it invisible and the harness passed against a
     broken build), and `merge: true` merges nested maps KEY BY KEY rather than
     replacing them — modelling it as a replace made the old build look worse
     than it is and would have misdescribed the production record the round is
     about.
     ⚠️⚠️ AND A TRAP EVERY FUTURE HARNESS INHERITS: run-all-tests.mjs marks a
     harness bad on `status !== 0 || /FAIL|UNSAFE|\bERROR\b/` — A TEXT MATCH OVER
     EVERYTHING THE HARNESS PRINTED. A harness that exits 0 and prints
     "PASS — 31 passing, 0 failing" is still reported FAIL if one of its own
     section headers contains the word. DO NOT LOOSEN THE DETECTOR: a harness
     that reports failures in prose and exits 0 is exactly what it catches.
     A HARNESS MUST NOT PRINT FAIL, ERROR OR UNSAFE EXCEPT ON A REAL FAILURE.

     v1.7.0 — Round 30 (Postal). build-panel-test.mjs gained SECTION H: the build
     panel's read cache must EXPIRE and must never outlive a page load. ⚠️ IT WAS
     IN sessionStorage, WHICH SURVIVES A HARD RELOAD — so the one instrument that
     reports what is deployed could not be refreshed by any action a person would
     try. ⚠️ THE GENERAL POINT, AND IT IS WHY THIS SECTION EXISTS AT ALL: a
     diagnostic is consulted INSTEAD of checking, so when it is wrong nothing
     disagrees with it. Anything that reports on the system needs a harness aimed
     at it specifically. Third instance in three rounds.
     v1.6.0 — Round 29 (Odell), Round 28 (Daugherty), Round 21
     (Hammond), Phase A.

     v1.6.0 — Round 29 (Odell). NEW: lesson-gate-test.mjs — ROADMAP item 10.
     ⚠️ SECTION A IS THE ONE THAT MATTERS AND IT IS NOT A REGRESSION TEST: it
     asserts an UNMASTERED lesson is never gated, at any distance, forever. If it
     goes red the feature has inverted and is punishing the struggling student,
     and the fix is NEVER to relax a number below it. 56 checks; 47 harnesses.
     ⚠️ AND THE COUNTS BELOW WERE GUESSED ONCE IN THIS ROUND BEFORE BEING RUN —
     inside the very paragraph that says not to do that. They are now from
     `node -e` over the directory and the FAST list. COUNT BY RUNNING.
     v1.5.0 — Round 28 (Daugherty), Round 21 (Hammond), Phase A.

     v1.5.0 — Round 28 (Daugherty). NEW: build-panel-test.mjs — the build footer
     must not scold children AND must not look clean when it has merely been
     gagged.
     ⚠️⚠️ THIS FILE WAS TWO FILES AT TWO DIFFERENT VERSIONS. A copy of it sat at
     the REPO ROOT as README.md at v1.4.0 while tests/README.md was still v1.2.0,
     and the root copy was the one being edited. Merged here; see the note in the
     root README about what that copy had displaced.
     ⚠️ THE COUNTS BELOW WERE THREE ROUNDS STALE. The registration audit catches
     an unregistered FILE; it cannot catch a wrong NUMBER in English prose. Count
     by running, not by editing the sentence.
     ⚠️ EIGHT HARNESSES FAIL ON A FRESH CHECKOUT WITH ERR_MODULE_NOT_FOUND —
     `jsdom` is a dev dependency and is not vendored. RUN `npm install` BEFORE
     CONCLUDING THE SUITE IS RED. Round 28 nearly filed those eight as defects.
     v1.4.0 — Round 21 (Hammond), Phase A. ⚠️ THE REGISTRATION
     AUDIT NOW ENFORCES THIS FILE. run-all-tests.mjs v1.4.0 reads the directory
     and FAILS THE SUITE on any .mjs in no list. The counts below cannot drift
     again — if they disagree with reality, `npm test` goes red. Three orphans
     (crossmode-overwrite, union-clock, week-agreement) are registered; new
     harness tab-lifetime-test.mjs covers the axis nothing covered; new RULES
     list runs under `npm run test:rules` (67 assertions, all passing).
     v1.3.0 — Round 21 (Hammond). ⚠️ THE FIREBASE EMULATOR RUNS.
     firestore-rules.test.mjs's "I COULD NOT RUN THIS" header was copied forward
     through four rounds and is FALSE — see "Running the rules harnesses" below.
     New file rules-probe.test.mjs (13 assertions, passing) executes the rules
     questions HANDOFF §0.-5 depends on. ⚠️ THE UNREGISTERED COUNT WAS WRONG: this
     file said two files are unregistered; there are FIVE, and one of them is
     crossmode-overwrite-test.mjs, the only harness that reproduces the live §3.1
     defect.
     v1.2.0 — Round 19 (Hermes). Registered daylog-test.mjs
     (29 FAST). ⚠️ THE STANDING FAILURE IS CLOSED AND THE SECTION ABOUT IT IS
     REWRITTEN — metadata-map-test was reporting two real admin.js defects, not a
     book-metadata question. week-anchor-test.mjs v1.1.0 now compares learn.js and
     game.js against daylog.js instead of against reports.html's deleted
     weekStartOf(). session-merge-test.mjs v1.4.0's Part D is INVERTED: it guards
     the ABSENCE of the second copy.
     v1.1.0 — Round 18 (Salter). Registered reconcile-test.mjs
     (28 FAST). ⚠️ That harness's own header is the important part of it: it says
     what it CANNOT cover, which is everything about a browser tab, and it should
     be read before anyone treats its green run as reassurance.
     v1.0.0 — Round 17 (Linotype). New file: before the Round 17
     tidy these thirty-odd harnesses sat loose in the repo root among the shipped
     files, and there was nowhere to write down which of them the runner actually
     watches. Two of them turned out not to be watched at all. -->

Everything in here is for whoever is editing the code. **Nothing the app serves
lives in this directory, and nothing in this directory ships.** GitHub Pages will
serve these files if someone asks for them by URL, which is harmless and also the
reason they are plain `.mjs` and not something the browser would try to execute.

## Running them

From the repo root:

```
npm install          # ⚠️ FIRST, AND ON EVERY FRESH CLONE. devDependencies only;
                     #    nothing here reaches Cloud Functions. jsdom is NOT
                     #    vendored, and without it EIGHT harnesses fail with
                     #    ERR_MODULE_NOT_FOUND — which is not a red suite, it is
                     #    an uninstalled one. Round 28 nearly filed it as a defect.
npm test             # the fast harnesses + the registration and syntax audits
npm run test:epubs   # plus the corpus harnesses over library/, ~2 minutes
npm run audit:versions   # version stamps only — now also covered by `npm test`
```

`npm test` is `node tests/run-all-tests.mjs`. You can also run any single harness
directly, from anywhere:

```
node tests/hud-test.mjs
node tests/lesson-atomicity-test.mjs
```

## ⚠️ VERSION STAMPS — the one rule that keeps the deploy diagnosable

**Every shipped file carries its version TWICE: a runtime constant and a header
comment. Bump BOTH in the same edit, always.**

The constant is the one that matters. `versions.js` parses it out of the
**deployed** file to build the footer panel, so a stale cached file cannot lie
about itself — and since there is no command line here, that footer is the only
way to tell what is actually running in a classroom. The header comment is
decoration.

The two are hand-maintained twins, and in Round 26 **five files** drifted in a
single evening — `game.js` reported itself six releases behind while the fix
everyone was about to verify sat in the code. Stylesheets have the same problem
in a different shape: `style.css`'s `body::before` and `adventure.css`'s
`body::after` are machine-readable stamps that must match their own headers.

`npm test` now fails if any of them disagree (`tests/version-stamp-test.mjs`).
It also fails if a module `game.js` or `learn.js` imports is missing from
`versions.js`'s SOURCES — three extracted modules had been invisible to the
footer for two rounds. **Anything that runs on a child's screen must be
reportable in the footer**, because that footer is the only deploy diagnostic
available without a command line.
It also checks the three harness **version pins** — and note why that is
separate: a pin catches *"you bumped the module and forgot the harness."* It is
structurally incapable of catching *"you forgot to bump the module,"* because it
is an assertion about a number a human maintains by hand. Both checks are needed.

**Header-length budgets are reported as notes, not failures.** Read the block at
the top of that harness before changing that — a permanently red suite is what
allowed the above to ship past two already-failing harnesses.

## ⚠️ Running the rules harnesses — THE EMULATOR WORKS, AND FIVE ROUNDS BELIEVED IT DID NOT

`firestore-rules.test.mjs` opens with *"I COULD NOT RUN THIS. The Firestore
emulator downloads its jar from storage.googleapis.com, which isn't reachable
from my sandbox."* **That sentence is false and it was copied forward through
four rounds.** Round 20 then designed a §3.1 fix that the deployed rules reject,
because nobody executed the file that would have said so in nine seconds.

⚠️ **`firestore.rules` IS THE ONLY FILE IN THIS PROJECT JAKE CANNOT TEST FROM A
BROWSER** (§B.4 — the Rules editor is console-only). It is therefore the file
that most needs executing and the one that has been reasoned about most. From
the repo root:

```
npm install --no-save firebase-tools @firebase/rules-unit-testing firebase mocha
npx firebase emulators:exec --only firestore --project demo-ttb \
    "npx mocha tests/rules-probe.test.mjs --timeout 20000"
```

You need `java` (any modern JDK) and network access to `storage.googleapis.com`
for the emulator jar; `firebase.json` needs
`{ "firestore": { "rules": "firebase/firestore.rules" } }` and the project id
`demo-ttb` is a fake, so nothing touches production.

⚠️ **ROLES LIVE IN `staff/{uid}` DOCUMENTS WITH `active: true`, NOT IN THE AUTH
TOKEN.** `authenticatedContext(uid, { role: 'teacher' })` produces a context the
rules treat as a **student**. Every one of `firestore-rules.test.mjs`'s 14
failures is that one mistake. If a new rules harness reports that staff can do
nothing, check the seed before you touch the rules.

## ⚠️ How these files find the code they test

Every harness reads its sources with `new URL('../game.js', import.meta.url)` —
resolved from **the harness's own location**, not from the working directory. That
is why `node tests/hud-test.mjs` works from the repo root, from inside `tests/`,
or from anywhere else.

Before Round 17 the same lines said `'./game.js'`, because the harnesses were
siblings of the code. **If you write a new harness, `../` is the prefix**, and if
you copy an old harness out of git history to restore it, that is the one line you
must change. `run-all-tests.mjs` keeps both paths explicitly — `HERE` for this
directory and `ROOT` for the repo root — and spawns each harness with `cwd: ROOT`,
so a harness that reads a working-directory-relative path still sees what it saw
before the move.

## What is registered, and what is not

⚠️ **THIS PARAGRAPH USED TO CARRY A HAND-MAINTAINED COUNT AND IT WAS WRONG** —
it said thirty-four harnesses with thirty-two registered when the truth was
thirty-nine and thirty-four. The count drifted because each round updated the
number it remembered rather than the number on disk, and three harnesses fell
out of the suite entirely, including the only one that reproduces the live §3.1
defect.

✅ **THAT CANNOT HAPPEN AGAIN.** `run-all-tests.mjs` v1.4.0 reads this directory
on every run and fails the suite on anything in no list. To exempt a file you
must name it in `EXEMPT` **with a reason**, which is a deliberate act visible in
a diff. Trust the audit, not this paragraph.

⚠️ **AND IT DRIFTED AGAIN ANYWAY, IN THE SENTENCE BELOW THIS ONE.** Round 28
found it reading *"28 harnesses"*. **The audit catches an unregistered FILE; it
cannot catch a wrong NUMBER in English prose**, so the paragraph above overstated
what was fixed. Recount by running, never by editing the number you remember.

Current, verified by running: **57 `.mjs` files in this folder, 47 registered** —
`FAST` (41, no external data, runs in a fresh clone), `EPUB` (4, needs
`library/`, behind `--with-epubs`), `RULES` (2, behind `npm run test:rules`).
`PENDING` is empty. The remainder are fixtures and helpers, not harnesses.
`npm test` reports **ALL 48 HARNESSES PASS** — 48 rather than 41 because the
runner counts its own syntax-check and registration audits.

A harness that is in
neither list **is not coverage**, however green it is on demand — Round 17 found
`sort-test.mjs` and `lesson-atomicity-test.mjs` in exactly that state, both passing,
both invisible, and registered them.

### Not in `FAST`, and why

✅ **THE THREE ACCIDENTAL ORPHANS ARE NOW REGISTERED** (Round 21, Phase A). What
remains out is out on purpose:

| File | Why it is not in the runner |
|---|---|
| `crossmode-overwrite-test.mjs` | ⚠️ **NOT DELIBERATE — REGISTER IT.** This is the harness that reproduces §3.1 against the shipped build (loses 600 of 1200 seconds). It exits 0 by design, reporting "reproduced-as-expected", so it can be registered without turning the suite red. **The suite prints ALL 29 HARNESSES PASS while the harness driving the live defect is not in it.** ⚠️ Its Part C models per-source **document ids**, which `firestore.rules` v2.5.0 **denies** — see HANDOFF §0.-5.B. Green here does not mean deployable. |
| `union-clock-test.mjs` | ⚠️ **NOT DELIBERATE — REGISTER IT.** 35 assertions, passing. Holds the interval-union measurement §0.-1 rests on, against the four real 2026-08-18 rollups. |
| `week-agreement-test.mjs` | ⚠️ **NOT DELIBERATE — REGISTER IT.** 26 assertions, passing. The Rule 11 date-agreement proof at all 24 hours. Run it as `TZ=America/Chicago node tests/week-agreement-test.mjs` for the real check. |
| `firestore-rules.test.mjs` | Needs the Firebase emulator — see below; **the emulator is available**, contrary to this file's own header. Also **known wrong**: it seeds roles as auth-token claims, and `firestore.rules` v2.x reads `staff/{uid}` documents. Run as-is it fails **14** assertions, none of which are rule defects. With only the seed corrected — five staff documents carrying `active: true`, classes carrying `teacherUids` — it runs **48 passing, 4 failing**, and three of those four are test artifacts. ⚠️ The fourth is **unresolved**: `"a request with no auth token at all can read nothing"` bundles three reads and succeeded; which one passed was never determined. See HANDOFF §0.-5.G. |
| `rules-probe.test.mjs` | Needs the emulator, same as above. Registering it would break `npm test` in a fresh clone, which has no JVM guarantee — that is why it is out, and it is the **only** reason. 13 assertions, passing. |
| `cover-harness.mjs` | It is a **diagnostic report**, not an assertion harness — it prints a table of cover-detection outcomes for a human to read, and exits 0 whether or not those outcomes are the right ones. Registering it would add a line that says `ok` unconditionally, which is worse than no line. Its `@xmldom/xmldom` dependency is declared now, so it runs from a clean install; deciding whether to give it real assertions is a live question, not a settled one. |

## ⚠️ `reconcile-test.mjs` — read its header before trusting it (Round 18)

It carries 35 assertions and **five of them are mutation-verified**: un-guard the
never-zero refusal and 3 fail; restore the positional index and 3 fail; pass
`allowZero` from the bulk path, move the `expect` check after the write, or put an
`updateDoc` into the read-only half, and 1 fails each. That is the standard to
hold new guards to — a guard nobody has broken on purpose is decoration.

But it runs in Node, and the defects it is nearest to do not live in Node. It
**cannot** see whether `firestore.rules` permits the sweep for a real account,
whether the `⟳` button still works now that `recalcDailyLog()` returns an object,
or anything at all about a student's tab being open during a rebuild. Its header
says so at length, on purpose. **Green here means the refusals are wired up. It
does not mean the round is safe.**

## `PENDING` — currently empty, and that is the correct resting state

`run-all-tests.mjs` has a third list for harnesses written **test-first**, against app
code that has not shipped yet. It exists because three such harnesses arrived from a
concurrent round mid-reorganisation, and dropping them into `FAST` would have moved the
headline from "1 failing" to "4 failing" — and an accepted red is precisely how the next
real failure hides (invariant 54).

**It emptied itself, once, and worked.** When the concurrent round's `session-log.js`
v1.3.0, `reports.html` v2.13.2 and the per-source counters arrived, the runner reported
`LAND` on all three and printed its notice; all three were promoted into `FAST` in the
same commit. The list stays in the file, empty, because it is now the documented place
to put a test-first harness.

⚠️ **Postscript, and the reason this is worth reading twice: the per-source counters
were reverted hours later** (`game.js` v3.30.0, `learn.js` v2.15.0 — HANDOFF §0.6 item
9). `source-split-test.mjs` is v2.0.0 now, Part C is gone, and Part A asserts the
*opposite* of what it asserted when it came out of `PENDING`. The flush serialization
in `session-log.js` v1.3.0 was kept. **A harness passing is not evidence the design
survives contact with students** — all three were green the whole time.

**The rules, if you use it:**

- **Name the specific file and version each entry waits on.** "Pending" with no named
  blocker is not a status, it is an excuse.
- **A pending harness that passes is reported as `LAND`, loudly.** Promote it into
  `FAST` and delete it from `PENDING` **in the same commit that ships the code**. A
  harness sitting in `PENDING` quietly is a disabled test with a nicer name — which is
  what `chunktest.mjs` was deleted for.

## ⚠️ THE STANDING FAILURE IS CLOSED, AND IT WAS HIDING TWO REAL BUGS

For several rounds `metadata-map-test.mjs` failed 42 of 487 assertions and this
file said it was "a book-metadata question, not an app defect." **It was an app
defect. Twice.** Both fixed in `admin.js` v3.31.1:

* `dc:rights` read only its FIRST element. Standard Ebooks emits two — a short
  "Public domain (United States)" and then the CC0 dedication — so every SE book
  carrying both had **the CC0 half of its licence silently dropped at import**.
  Identical in shape to the `dc:source` bug fixed in v3.26.0, two lines away in
  the same object literal.
* `readInBookSignals()` scoped its Credits lookup to `#pg-machine-header`, which
  the bookclean pass strips. All thirteen cleaned Gutenberg books imported with
  **no transcriber attribution at all.**

The harness itself went to v1.4.0 and is stronger for it: Gutenberg books are
identified by the `_g` filename convention rather than a hand-kept id list that
went stale on every bookclean batch, the `-claudeCleaned` rename is normalised,
the origin URL is asserted by SHAPE, and the credits assertion is conditional on
the book actually containing a Credits row (`wonderful-wizard-of-oz` has none —
verified by scanning every xhtml entry in the archive, not assumed).

⚠️ **THIS IS INVARIANT 54 WITH A BODY.** An accepted red hid two real bugs for
four rounds, exactly as the invariant predicts. **The number to watch is now
"0 failing, 0 missing." Anything else is new — and do not re-open a standing
red.**

## ⚠️ `daylog-test.mjs` — the one-number guard (Round 19)

28 assertions, **five mutation-verified**: report `ok:true` on a failed day and
Part C fails; sum the split fields on top of a flat `seconds` and Part B fails;
anchor the week on Monday and Part A fails eleven times; make
`applyWeekToStats()` accumulate instead of assign and Part D fails; build dates
with `toISOString()` and Part A fails.

⚠️ **IT PINS `process.env.TZ = 'America/Chicago'` BEFORE IMPORTING ANYTHING, AND
THAT IS LOAD-BEARING.** The container is UTC, where `toISOString()` and local
time agree — so the "never use toISOString()" guard passed happily against a
version that used `toISOString()`, i.e. proved nothing. Jake's students are in
Central. That mutation is only caught with the zone pinned.

⚠️ **WHAT IT CANNOT COVER:** whether `firestore.rules` v2.5.0 actually permits a
student to read their own `typing_logs`. That is a console action, the entire
redesign rests on it, and no harness in Node will ever check it. **If students
report 0:00 after a deploy, check the rule first, not the green suite.**

## Fixtures

`TESTING-ttb-test-epubs.md` documents `ttb-test-flat.epub` and `ttb-test-parts.epub`
in `library/` — every expected chapter count and word count in it was produced by
hand, not by the importer, so it is a real check rather than a recording of current
behaviour.
