# HANDOFF — Round 6 (Noiseless)

<!-- HANDOFF.md v6.0.0 — Round 6, instance "Noiseless", 2026-08-05.
     ⚠️ SUPERSEDES the Round 5 handoff, which is archived in this repo as
     HANDOFF-round5.md rather than left to Jake to rename. Round 5 asked Round 4's
     to be kept and it was lost instead; §5 and §2 of the archived file are still
     load-bearing and are NOT fully restated here. Go and read them. -->

**Instance:** **Noiseless** (6) · Mignon (5) · Oliver (4) · Blick (3) · Dvorak (2)
· Underwood (1) · *other projects:* Stedman, Fable, Trilby, Vernier

> *On the name:* the Remington Noiseless muffled the typebar so you could not hear it
> strike. Every defect this round failed silently. A `ReferenceError` on a blank drill
> screen no student could describe. A test suite that could not run, so nothing ever
> failed. A version constant lying quietly to the one panel built to catch it. An
> admin panel that threw during setup and showed an empty table as its only symptom.
> None of it was found by reading. All of it was found by making something audible.

---

## §0. What this round actually was

Jake's brief: *"Last guy started to hallucinate, so start with the handoff and then
check his work. Make sure nothin' is hangin' or broken, and then you can work your
way through the to do list."* Then: *"Prioritize cleaning up the previous mess."*

Almost none of the to-do list got done, and that was the right outcome. Verifying
Round 5 turned up **two live bugs, four misfiled document sections, and a test suite
that could not execute at all.** §4 below is still §4, barely touched.

**Round 5's §0 was right and it applies to this file too:** never trust a version
claim in a handoff. Every number in §1 was read out of a file by a script, not
remembered. Two of Round 5's own claims turned out to be wrong.

---

## §1. Version state — read by `audit-versions.mjs`, 2026-08-05

`node audit-versions.mjs` reports **0 problems**. Do not read that as proof of much:
see §2.3 for why a version audit cannot catch a version lie.

| file | version | changed this round? | uploaded? |
|---|---|---|---|
| `lessons-admin.js` | **1.7.1** | ⚠️ **yes — real bug fix, upload first** | **ask Jake** |
| `learn.js` | **2.2.3** | ⚠️ **yes — real bug fix** | **ask Jake** |
| `adventure-renderer.js` | **1.2.0** | constant only; code untouched | **ask Jake** |
| `admin.js` | **3.23.2** | header + one line (`document.title`) | ask |
| `admin.html` | — (no constant; title driven from `admin.js`) | yes | ask |
| `game.js` | **3.13.1** | header comment only | optional |
| `index.html` | 3.6.1 | no | ask |
| `style.css` | 3.5.0 | no | ask |
| `keyboard.js` | 1.1.1 | no | — |
| `staff-admin.js` | 2.2.0 | no | — |
| `firebase-config.js` | 1.2.0 | no | — |
| `versions.js` | 1.3.0 | no | — |
| `reports.html` | 2.8.0 | no | ⚠️ verify — Round 5 nearly lost this file |
| `firestore.rules` | 2.2.0 | no | console-only, verify |
| `storage.rules` | 2.1.0 | no | console-only, verify |

**If only some get uploaded:** `lessons-admin.js` first — it un-breaks four admin
features. Then `learn.js`. `game.js` and `admin.js` are comment-only apart from one
line and can ride along with the next real change.

`firebase-storage.rules` — Jake deleted it during this session, as Round 5 §1.2
asked. It was byte-identical to `storage.rules` by then; the point stands that two
copies of a security rule set is itself the defect.

---

## §2. What was broken, and what it teaches

### 2.1 `learn.js` called a function that does not exist

```js
if (!currentStep) { finishLesson(); return; }   // no finishLesson() anywhere in the repo
```

In `beginStep()`, in the branch that catches `currentStepIdx` landing outside
`currentRuns`. It fired only in the situation it existed to rescue, and then threw —
abandoning `beginStep()` before the intro panel was hidden or the keyboard wired. A
dead drill screen, no modal, no error, no route back but the browser Back button,
**and nothing written**, so invisible from the teacher side too. Reachable via the
Game Genie's unbounded step jump, and via a saved checkpoint outliving a lesson edit
(re-chunk a five-run step into three and a resume points at run 4 of 3).

Now `clearRunPosition()` + `stopLesson()`. Recovery, not completion — grading a run
that does not exist would write a score for work nobody did.

### 2.2 `lessons-admin.js` — two functions wired into the UI and never written

The worse of the two. `admin.html` has the entire "Add one student" form and
`initStudentsPanel()` attached listeners for `_populateOneStudentClasses` and
`_addOneStudent`. **Neither was declared anywhere in the repo.**

`addEventListener('click', _addOneStudent)` *evaluates* the identifier, so the panel
threw a `ReferenceError` at that line and never reached what came after it:

- Preview CSV / Commit CSV never wired — **roster import buttons did nothing**
- the Lessons/Books progress tabs never wired
- `loadStudentRoster()` is the function's last statement — **the roster never loaded**
- `_studentsInited = true` is set *before* the throw, so reopening the tab took the
  early-return path and rebuilt two dropdowns instead of recovering

⚠️ **Jake: worth clicking through in the app.** I am confident in the mechanism and
the suite is green, but the only visible symptom was an empty student table — which
is also what a permissions problem or an empty building looks like. If your roster
has been loading fine all along then something in my model is wrong and that matters
more than the fix.

Both functions were written **from `_commitCSV()` and `_bulkAssign()`**, not invented:
the single-student case is exactly one iteration of the bulk loop, so the
`users/{uid}` vs `pendingClassAssignments/{email}` split, the rule that `schoolId`
must ride along on a create, and the roster-cache update are all copied from working
code. `admin.html`'s own help text describes the pending path, which is how the intent
was confirmed rather than guessed at.

### 2.3 `adventure-renderer.js` shipped with its constant a version behind its code

Header said v1.2.0. CHANGELOG said v1.2.0. The code *was* v1.2.0. And
`RENDERER_VERSION` said `'1.1.0'` — the one copy `versions.js` actually reads. So the
build panel would report a stale version for a correct deploy.

⚠️ **This is the limit of the drift checks.** `versions.js` and `audit-versions.mjs`
compare what a file claims against what the same file claims elsewhere, and both
passed this file cleanly. What caught it was `map-geometry-test.mjs` — a *behavioural*
test agreeing with the v1.2.0 geometry. **When a version claim is in doubt, run the
test, not the audit.**

### 2.4 The suite could not run

All thirteen harnesses had `/home/claude/work/...` hardcoded — the scratch directory
of the session that wrote them. Round 5 §6 said "use them, do not rebuild them" while
not one of them could execute. Three EPUB harnesses pointed at three different
nonexistent corpus directories.

Fixed: sources resolve through `import.meta.url`, corpora default to this repo's
`library/` with an `argv[2]` override. `credit-test.mjs` also needed reanchoring — a
marker it lifts by text was renamed in `index.html` v3.5.1, so it died with a
`ReferenceError` that looked like a product bug and was not one. **Breaking on a
rename is correct behaviour for these harnesses. Being unrunnable is what hid it for
a whole round.**

`fix-candidates.mjs` was reporting a fabricated denominator: banner said "all eight
books", summary divided by a hardcoded `42`, whatever the corpus actually held. Both
now come from `files.length`. It reads 23 books today.

---

## §3. `undefined-calls-test.mjs` — the new harness, and the one to run first

It is the only harness that checks the whole codebase rather than one behaviour.

It parses each of the nine shipped JS files with acorn and asks, for **every
identifier reference**, whether anything declares it — a declaration, an import, or a
known global. Scope-aware on purpose: a regex version threw ~20 false positives per
file, and a check that cries wolf twenty times is the same as no check at all.

**Verified against a pristine copy of Jake's zip: it flags all three defects there
and passes clean on the fixed tree.**

⚠️ **I wrote v1.0.0 checking only call expressions and that was not enough.** It found
`finishLesson()` and walked straight past `_addOneStudent` — the worse of the two —
because an undeclared identifier passed as an *argument* throws exactly as hard as one
that is invoked. Widened to every reference position in v1.1.0, which is when §2.2
surfaced. **The lesson generalises past this file: "where can this name appear" is
almost always a bigger set than the obvious one.**

Also new: `run-all-tests.mjs` (one command — 11 fast harnesses in ~5s, `--with-epubs`
for the 4 corpus ones) and `audit-versions.mjs` (versions.js's checks, offline, with
its own caveats in its header). Deps:

```
npm install --no-save jsdom jszip @xmldom/xmldom acorn acorn-walk
```

**Suite status: 11/11 fast harnesses pass. Corpus harnesses run clean over the 23
books in `library/`, and `fix-candidates.mjs` shows only the front-matter relabels
Round 5 documented — no body chapter moves on any book.**

---

## §4. Open work

### 4.1 Documentation that is now *recorded* as missing rather than fixed

These are referenced in the repo but absent from it. **Deleted, or never written? I
could not tell, and guessing would have been worse than flagging.** Jake, if you
know, say so and the references can be cleaned up properly rather than annotated:

| named in | missing file |
|---|---|
| `README.md`, twice | `MULTITENANCY.md`, `SCALE-PLAN.md` |
| `README.md`'s not-deployable-from-a-browser list | `TTL-GUIDE.md` |
| Round 5's §0, which asks that it be kept | `HANDOFF-round4.md` |

`TTL-GUIDE.md` is the one that matters. `firestore.indexes.json` still holds the index
and TTL field-override definitions, but the billing arithmetic and the "pre-v3.4.0
documents are never collected" reasoning existed nowhere else.

### 4.2 Still small and certain

- **Archive URL auto-fill.** Jake wants a configurable base directory with the
  filename filled in from the import. `originUrl` exists; the base does not.
- **A `/credits` page** listing every book, source and licence. Conventional, cheap,
  and what a copyright holder would actually look for.
- ~~`admin.html` has no version constant~~ — **done.** `document.title` is driven from
  `ADMIN_VERSION`, so the field that once read v3.3.0 for nineteen minor versions
  cannot drift again.

### 4.3 Adventure scrolling credits — still the next real piece, still not built

`game.js` 3.13.x emits `ttb:bookComplete` carrying the credit fields
(`title/author/source/rights/cleanedBy/chapters`), so the renderer needs no extra
Firestore read. Classic already renders its credits into the text stream. Adventure
should scroll them up the canvas — the renderer owns that surface and already animates.

⚠️ **Not built, for the same reason Mignon did not build it: it is canvas animation
and I cannot watch it run.** Do not ship motion you cannot see. Jake was offered this
explicitly and chose the cleanup instead. If a future session can actually observe the
canvas, this is the piece to take.

### 4.4 The text-cleanup pass (designed, not built)

Unchanged from Round 5 §4.3 and still correct — **read it there.** In brief: false
positives get context regexes (free, permanent); true positives Jake accepts need
*acknowledge and mute*, per word, stored on the book (the tool is failing him by
asking again); true positives needing a rewrite are the only expensive part, and
⚠️ **send flagged PASSAGES, not books** — ~50–200 excerpts instead of 60,000 words,
and cost is Jake's stated top priority. If it lands in `admin.js` it must route
through a Cloud Function; an API key in static GitHub Pages JS is a published key.

⚠️ **The thing a word list will miss:** the Nancy Drew and Hardy Boys are the **1930
originals** — which is *why* they are public domain. The 1959–60 revisions exist
substantially because the originals contain racial caricature, and those revised texts
are still in copyright. A word list catches "gay" and sails past a page of dialect
caricature. Same class: disability language used clinically, and "ejaculated" as a
dialogue verb. **Those need reading, not scanning.**

### 4.5 Library additions Jake has agreed to

Unchanged from Round 5 §4.4 — the eight-book table (Augie, Anne of Green Gables, Black
Beauty, Girls of Central High 01, Sherlock, The Lost World, Five Children and It, The
Peterkin Papers), the measured coverage gaps (sports is male-only and 10–14; humour
collapses to one book at age 12; a 14-year-old has zero fantasy), and the built
`augie-and-the-green-knight.epub` awaiting import. **That section is not restated
here; go and read it.** Note the built Augie EPUB is not in the zip I received.

### 4.6 Not now

- `ttb-shared.js`. Pure refactor across every file, nothing to verify against. Rounds
  4 and 5 both declined it and both were right.
- `experimentalAutoDetectLongPolling`. Still the wrong side of the cost priority.
- **Rewriting `firestore-rules.test.mjs`.** It seeds roles as auth-token claims; rules
  v2.x reads `staff/{uid}` documents and ignores the token. It needs a CLI and a JVM
  emulator, so it cannot be verified from a session like this one, and writing it
  blind would produce a suite that passes for the wrong reasons.

---

## §5. Invariants — additions to Round 5 §5, which still applies in full

Round 5's ten are **not repeated here.** Read `HANDOFF-round5.md` §5, especially the
id-is-a-label rule and the `ttb_booksCache_v*` bump rule. Adding:

11. **An undeclared identifier throws in *every* expression position, not only when
    called.** Passing one to `addEventListener` is as fatal as invoking it, and it
    takes down every statement after it in the same function.
12. **A `_inited = true` flag set before the risky work is a trap.** It converts a
    one-time failure into a permanent one by making the retry path skip the repair.
    Set it last, or in a `finally`.
13. **A version audit cannot catch a version lie.** It compares a file's claims
    against the same file's other claims. Only a behavioural test knows what the code
    actually does.
14. **A harness with an absolute path is not a harness.** If it cannot run in a fresh
    checkout it is a comment, and nobody can tell broken from passing.
15. **A hardcoded denominator in a diagnostic is worse than no diagnostic.**
    `fix-candidates.mjs` reported "2 of 42" while reading 23 books.
16. **Documents drift exactly like code, and nothing checks them.** Four entry blocks
    sat under the wrong file in `CHANGELOG.md` for a whole round, and
    `PEDAGOGY-AUDIT.md` advertised finished work as outstanding for three releases.

---

## §6. Documents corrected this round

- **`CHANGELOG.md` → v1.2.0.** Four entry blocks were filed under ``## `game.js` ``
  that describe other files: `index.html` v3.6.0 (invalid card markup), v3.5.1
  (`[object Object]` in the About panel), v3.5.0 (the About panel itself), and
  `style.css` v3.5.0 (`#modal-body`'s `justify-content` overflow clip). Which is why
  `index.html`'s history appeared to stop at v3.4.0. Moved — and **every section
  re-sorted newest-first**, because `game.js`, `admin.js` and `index.html` were all
  out of order, making the file's own stated ordering convention aspirational. The
  move was line-accounted in both directions; nothing was lost.
- **`PEDAGOGY-AUDIT.md` → v2.0.1.** §4 said "Batch B is outstanding". It shipped in
  `learn.js` v2.1.0, three releases earlier, under different field names —
  `furthestRunIdx`/`runAttempts`/`runFailures`/`lastSeenAt`, because the engine
  instruments *runs*, not authored steps — and item 2's stuck-student view is live in
  `lessons-admin.js`. **Nothing in §4's list is outstanding; the next pedagogy work is
  new work.** No finding, recommendation or measurement changed. Its pointer to
  `HANDOFF.md` §11 was also dangling and is gone.
- **`README.md` → v1.6.0.** Removed **every** hand-maintained version number. All of
  them were wrong and one was dangerous: `storage.rules v2.0.0`, the version whose
  `image/*` write requirement silently denied every EPUB cover. Two places read
  themselves and cannot lie — the build panel in `index.html` and `CHANGELOG.md`'s
  Contents. Also documented the test suite for the first time and reconciled the
  missing-document references in §4.1.
- **`HANDOFF-round5.md`** now exists in the repo, annotated with what in it is still
  live and what has gone stale.

---

## §7. Things I got wrong, recorded on purpose

- **`undefined-calls-test.mjs` v1.0.0 was too narrow and I shipped it that way.** It
  found the smaller bug and missed the bigger one, and I only widened it because I went
  reading the surrounding code by hand afterwards. A tool that is right and incomplete
  is more dangerous than no tool, because it buys false confidence.
- **I broke `verify-guards.mjs` while fixing it.** Swapped its path for a `URL` object
  and left a `file.split('/')` downstream. Caught on the next run — which only
  happened because I ran the suite instead of trusting the edit.
- **I nearly corrected the README's version table instead of deleting it.** Fixing
  four wrong numbers would have left the fifth to rot and guaranteed the same finding
  next round. Removing the column removes the category.
- **I did not verify §2.2 in a browser and cannot.** The reasoning is sound and the
  parser agrees, but this is the one item in this handoff that wants a human click
  before it is believed.

---

## §8. Jake — working with him

Round 5's §8 and Round 4's §12 both still hold. Additions from this round:

- **When he says prioritise, he means go deep rather than wide.** "Prioritize cleaning
  up the previous mess and then I trust you to decide what all you can handle" was
  permission to spend the whole session on the audit, and the audit is where the two
  live bugs were. Do not read a broad to-do list as permission to skip it.
- **He acts on findings immediately.** Told about `firebase-storage.rules` he replied
  "I'll delete it right now." Report things as you find them; don't batch them to the
  end.
- **He is fine with "I won't ship what I can't watch run."** Said twice now, two rounds
  running, about the same feature. It has never landed badly.
- **Telling him which uploads matter beats listing what changed.** Six files changed
  this round; two of them fix anything.
- **Don't burn the session and skip the handoff.** Round 5 had to be told "ahem".
