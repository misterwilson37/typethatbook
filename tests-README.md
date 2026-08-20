# tests/

<!-- tests/README.md v1.1.0 — Round 18 (Salter). Registered reconcile-test.mjs
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
npm install          # devDependencies only; nothing here reaches Cloud Functions
npm test             # the 28 fast harnesses, ~10 seconds
npm run test:epubs   # plus the 4 corpus harnesses over library/, ~2 minutes
```

`npm test` is `node tests/run-all-tests.mjs`. You can also run any single harness
directly, from anywhere:

```
node tests/hud-test.mjs
node tests/lesson-atomicity-test.mjs
```

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

Thirty-four harnesses are in this folder. Thirty-two are registered:
`run-all-tests.mjs` holds three lists — `FAST` (28 harnesses, no external data, runs
in a fresh clone), `EPUB` (4, needs `library/`, behind `--with-epubs`), and `PENDING`
(currently empty, see below). A harness that is in
neither list **is not coverage**, however green it is on demand — Round 17 found
`sort-test.mjs` and `lesson-atomicity-test.mjs` in exactly that state, both passing,
both invisible, and registered them.

Two files are deliberately unregistered:

| File | Why it is not in the runner |
|---|---|
| `firestore-rules.test.mjs` | Needs the Firebase emulator — a CLI and a JVM. Also **known wrong**: it seeds roles as auth-token claims, and `firestore.rules` v2.x reads `staff/{uid}` documents. It is a starting point for a rewrite, not a passing suite. Its path to the rules is now `../firebase/firestore.rules`. |
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

## The standing failure

`metadata-map-test.mjs` fails on 42 of 487 assertions and has for several rounds:
Gutenberg-sourced EPUBs report a `gutenberg.org` origin where the harness expects
Standard Ebooks. It is a book-metadata question, not an app defect. It is also
exactly the kind of accepted red that hides the next real one — see `HANDOFF.md`
invariant 54. **The number to watch is "1 failing, 0 missing." Anything else is new.**

## Fixtures

`TESTING-ttb-test-epubs.md` documents `ttb-test-flat.epub` and `ttb-test-parts.epub`
in `library/` — every expected chapter count and word count in it was produced by
hand, not by the importer, so it is a real check rather than a recording of current
behaviour.
