# TypeThatBook

A classroom typing application for Ellis Middle School. Students type real books,
one sentence at a time, and the time they spend doing it becomes the number their
teacher grades.

<!-- README.md v2.4.0 — Round 64 (Duplex), 2026-09-03.

     v2.4.0 — ⚠️⚠️ THE REGENERATION COMMAND IN THIS FILE WAS WRONG, AND IT WAS
     WRONG IN THE DIRECTION THAT HIDES A DEFECT. It grepped `versions.js` for
     anything shaped like a filename, which reads COMMENTS as well as entries —
     so it reported `index.html` as registered when it is not in `SOURCES` at
     all. The page every student lands on first has never had its version stamp
     audited (ROADMAP 57), and the one command in this repo that would have
     revealed it said the opposite. It now reads the `file:` keys only.
     ⚠️ A CHECK THAT OVER-REPORTS IS WORSE THAN NO CHECK: it answers the question
     you asked, wrongly, and you stop asking.
     ⚠️ `rights-ladder.js` (Round 47) added to the module list — found by running
     the corrected command against the paragraph, which is the point of having
     one. ⚠️ tools/ row corrected: `audit-inline-styles.mjs` and `tier-ab.html`
     were not mentioned.
     ⚠️ ROADMAP 29 CALLED THIS FILE "v2.0.0, twenty-five rounds stale" AND IT WAS
     NOT — Round 57 rebuilt it and Round 55 corrected it twice. The item was
     itself stale; do not trust a staleness claim without checking the stamp.

     README.md v2.3.0 — Round 57 (Bar-Lock), 2026-09-02.

     ⚠️⚠️ THIS FILE HAD BEEN OVERWRITTEN BY A COPY OF tests/README.md AND THE
     PROJECT README WAS GONE. HANDOFF §7's document map says this file should
     hold "what the project is; file map, data model. **Root**". Instead the
     root held a duplicate of the tests README, titled "# tests/", at v1.4.0 —
     while tests/README.md itself was still at v1.2.0. Two copies, two versions,
     and the ROOT one was the one being edited, so four rounds of tests-README
     work landed in a file nobody would look in for it.

     ⚠️ THE ORIGINAL CONTENT IS NOT RECOVERABLE. There is no git history in the
     delivered archive. What follows is RECONSTRUCTED from HANDOFF.md, ROADMAP.md
     and the code, and it is deliberately thin: a short true map beats a long
     confident invention. If Jake has the original anywhere, prefer it over this.

     The tests README now lives only at tests/README.md, at v1.5.0, merged from
     the newer root copy.

     v2.2.0 — Round 55 (Smith-Premier). ⚠️ Two stale facts corrected by
     MEASURING rather than remembering: the jsdom harness count said eight and is
     thirteen, and the command block never mentioned `npm run test:rules` at all
     — a suite outside `npm test` that six unrun cases now depend on. ⚠️⚠️ Added
     lessonProgress to the data-model paragraph: it held two of the three record
     types and omitted the one that decides whether a child can earn credit.

     v2.1.0 — Round 55: added the teacher pointer at the top and the
     docs/TEACHER-GUIDE.md row. ⚠️ The pointer is FIRST, above the HANDOFF line,
     on purpose: a teacher who opens this file is one paragraph from a file map
     they have no use for, and the reason this README exists at all is that
     documents get read by the wrong person and edited in the wrong place. -->

⚠️ **Teaching with it rather than working on it? Read
[`docs/TEACHER-GUIDE.md`](docs/TEACHER-GUIDE.md) and stop there.** It covers the
reports panel — what the marks mean, how to delete a run, how to unlock a student
whose mastery was set by somebody else typing on their account — and it assumes
no knowledge of anything below.

⚠️ **Start with `HANDOFF.md`.** It is the working document — current state, every
defect and its write-up, the standing rules, and the deploy order. This file is
only a map.

## The documents

| file | what it is |
|---|---|
| `HANDOFF.md` | ⚠️ **Read first.** State, defects, standing rules, §2 deploy table, §5 invariants |
| `ROADMAP.md` | What is planned and what was deliberately deferred, with the reasoning |
| `CHANGELOG.md` | Per-round history, plus **§ ARCHIVED FILE HEADERS** — older per-file entries moved out of source headers |
| `docs/TEACHER-GUIDE.md` | ⭐ **For teachers.** The reports panel in plain language — the error-rate column, the flag icons and the scan, deleting one run, clearing mastery. The only non-developer document in the repo |
| `docs/README.md` | Index of `docs/` — one line per document on when to read it |
| `tests/README.md` | How the harnesses work, what is registered, and what each cannot cover |
| `tools/README.md` | `audit-versions.mjs`, `audit-inline-styles.mjs`, the two EPUB builders, and `tier-ab.html` (a not-deployed A/B render for ROADMAP 38) |

## The shape of it

Static files on Firebase Hosting, Firestore for data, one Cloud Function.
**No build step and no bundler** — the browser loads the ES modules directly, so
what is in the repo is what runs.

* `index.html` — the Library: book list, landing readout, build-info button
* `game.html` + `game.js` — **Library mode**, typing a book. The largest file
* `learn.html` + `learn.js` — **School mode**, structured lessons and drills
* `admin.html` + `admin.js` — book import, metadata, staff and class management
  * `lessons-admin.js` — the Lessons panel, mounted by `admin.js`
  * `staff-admin.js` — the Staff and class panel, mounted by `admin.js`
* `reports.html` — the teacher's grading view
* `school-audit.html` — a **read-only** diagnostic view of School data. It
  changes nothing and is safe to open in front of anybody

Shared modules the pages import: `firebase-config.js` (⚠️ also the one home of
`ADMIN_EMAILS`), `daylog.js`, `logdays.js`, `session-log.js`, `stats-wal.js`,
`hud.js`, `keyboard.js`, `versions.js`, `settings-panel.js`, `drill-filter.js`,
`variety-floor.js`, `celebrate.js`, `receipt.js`, `update-gate.js`,
`read-meter.js`, `lesson-gate.js`, `run-grade.js`, `chapter-position.js`,
`rights-ladder.js`, `adventure-renderer.js`.

⚠️ **THE AUTHORITATIVE LIST IS `versions.js`, NOT THIS PARAGRAPH.** Every shipped
file must be registered there or it ships unversioned and untested — `npm test`
reports unregistered files. This list went twenty-five rounds without an update
and was missing seven shipped modules when Round 57 checked it, so **regenerate
it from `versions.js` rather than adding to it by hand:**

```
grep -oP "file:\s*'\K[^']+" versions.js | sort -u
```

⚠️⚠️ **THAT COMMAND READS THE `file:` KEYS, NOT THE WHOLE FILE, AND THE
DIFFERENCE MATTERS.** Until v2.4.0 it grepped `versions.js` for anything shaped
like a filename — which matches **comments** — and so it reported `index.html` as
registered. It is not in `SOURCES`. The library landing page has never had its
version stamp audited (**ROADMAP 57**), and the one command here that would have
shown that was answering the opposite. A check that over-reports is worse than no
check.

⚠️ **The two page controllers cannot import each other.** Every student-facing
feature is therefore a **twin by construction**, and half-building one is the
default outcome unless something checks. See HANDOFF §0.-13.E — it counts the
occasions this has actually happened.

## The data model, in one paragraph

`typing_logs/{uid}_{date}` is **the graded document** — one per student per day,
and the thing reports grade from. The daily and weekly totals a student sees in
their own HUD are read from those same documents, so the child's screen and the
teacher's report cannot disagree. `typing_sessions` holds sprint- and run-level
detail for drill-down; it is **evidence, never a grade**. HANDOFF §3.1 is the
full statement and is worth reading before touching any counter.

⚠️⚠️ **AND MASTERY LIVES IN NEITHER OF THEM.** `users/{uid}/lessonProgress/{id}`
holds `runScores`, `runLocks`, `runGrades` and the attempt counters — the record
that decides whether a lesson is graded or has gone to practice. **Deleting
evidence does not touch it**, and it cannot be reconstructed from evidence:
`runScores` is a cumulative SUM and `runGrades` is best-ever-seen, so neither can
have one entry removed. That is ROADMAP 33, and it is why clearing mastery is an
explicit control in reports.html rather than a side effect of deleting a run.

## Working on it

```
npm install    # ⚠️ FIRST. jsdom is not vendored; without it THIRTEEN harnesses
               #    fail with ERR_MODULE_NOT_FOUND, which is an uninstalled
               #    suite, not a red one. (Count verified Round 55 by
               #    `grep -ln jsdom tests/*.mjs | wc -l` — it said "eight" for
               #    several rounds. Recount it, do not carry it forward.
               #    Recounted Round 57: still thirteen.)
npm test       # every fast harness, plus the registration and syntax audits
npm run audit:versions   # version stamps and header budgets

# ⚠️⚠️ THE RULES SUITE IS NOT PART OF `npm test` AND IS EASY TO FORGET.
# It needs the Firebase emulator (a JVM and a one-time jar download):
npm run test:rules:setup # once
npm run test:rules       # ⚠️ 89 assertions. ALL GREEN as of Round 57 — the six
                         #    cases Round 55 added had never once been executed
                         #    (no environment had a JVM) and they pass.
```

⚠️ **Every shipped file carries its version TWICE** — a runtime constant and a
header comment — and **both are bumped in the same edit, always**. The constant
is what `versions.js` reads out of the *deployed* file to build the footer panel,
which is the only way to tell what is actually running in a classroom. `npm test`
fails if the two disagree. See `tests/README.md`.

⚠️ **There is no command line in the classroom.** Deploys go through the GitHub
web portal and the Firebase console, and the in-page build footer is the only
diagnostic instrument available at a student's machine. HANDOFF §2 explains how
to read it, including what it shows when nobody is signed in.
