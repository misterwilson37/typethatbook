# TypeThatBook

<!-- README.md v1.15.0 — Round 19 (Hermes). ⚠️ STAGES 1 AND 2 SHIPPED: the student's
     screen and the teacher's report read the SAME DOCUMENT. stats/time_tracking
     is deleted, the week-counter audit is deleted, and daylog.js is the shared
     reader. New sections: "Grading a week", "Forcing an update". The
     reconciliation table now records the third copy as removed rather than as
     the disease-in-waiting. See HANDOFF.md §0.0.
     v1.13.0 — Round 18 (Salter).
     v1.13.0 — RECONCILIATION. reports.html 2.15.0 adds a read-only view comparing
              every student's daily-log total against the sum of their actual
              session records, and a bulk rebuild that repairs the logs from the
              sessions behind a preview. New section "Reconciliation: which number
              is the record" below, which is the one to read before touching either
              collection — it states the premise (sessions are the record, logs are
              a cache) that the whole feature rests on. Test count 27 → 28. No other
              app file changed.
     v1.12.0 — Round 17 (Linotype).
     v1.12.0 — THE ROOT DIRECTORY WAS SEVENTY-NINE ENTRIES AND IS NOW THIRTY-THREE.
              Nothing the browser loads moved: every HTML page, every shipped .js,
              both stylesheets and library/ are exactly where GitHub Pages expects
              them, and not one line of app code changed. What moved is everything
              a human never opens — the harnesses into tests/, the reference docs
              into docs/, the Firebase config into firebase/, the Cloud Function
              into functions/, the two Python builders and the version auditor into
              tools/. The "Layout" section below is rewritten around that, and this
              file no longer claims MULTITENANCY.md was deleted, because it never
              was; it is in docs/archive/ with its warning header intact.
     v1.11.0 — Round 14 (Sholes).
     v1.11.0 — ⚠️ THE TWO DOCUMENT MAPS IN THIS FILE ARE GONE, REPLACED BY ONE
              SENTENCE POINTING AT HANDOFF.md §9. This file used to carry a
              file-map listing six archived handoffs AND a second table at the
              bottom rating the recoverability of four missing ones. Between
              them they sent Jake hunting for files that are not in the repo,
              repeatedly, across at least six turns. Round 14 consolidated nine
              handoffs into one HANDOFF.md and deleted the rest; both maps now
              say so once and stop. Also: chunktest.mjs deregistered and removed
              from the harness table, the harness count corrected to 23, and the
              standing metadata-map failure written down as a KNOWN state rather
              than left to be rediscovered.
     v1.10.0 — Round 13 (Ludlow).
     v1.10.0 — The document map corrected on two points, both of which cost real
              time this round. (1) DESIGN-TELEMETRY.md was in the repo and in no
              listing, so the file describing where the data model is going was
              invisible to anyone reading this one. Listed now, with its status.
              (2) The archived-handoff situation is stated once, plainly: rounds
              3, 5, 6, 7, 11 and 12 are files; rounds 4, 8, 9 and 10 are not in
              the repo at all, and rounds 8 and 9 are cited as load-bearing by a
              handoff whose own source is one of the missing ones. HANDOFF.md §9
              is the authority; this file points at it rather than restating it.
     v1.9.0 — Round 10 (Remington, continued).
     v1.9.0 — package.json corrected: the four harness packages were NOT declared,
              contrary to what v1.7.x of this file said. They are devDependencies
              now, `npm test` exists, and a fresh clone runs the suite. Also:
              reports.html is finally driven from a constant, and the dead
              lastSavedIndex note is retired.
     v1.8.0 — Round 9 (Remington).
     v1.8.0 — Guest mode. Rewrote the Auth section, whose claim that students
              "may also play anonymously" was aspirational for the whole life of
              this file: the client code existed, firestore.rules blocked it, and
              nothing in the repo had ever called signInAnonymously. Added the
              new harness and corrected the note on firestore-rules.test.mjs.
     v1.7.0 — Round 6 (Noiseless).
     v1.7.0 — Four recovered documents committed: TTL-GUIDE, SCALE-PLAN, MULTITENANCY,
              HANDOFF-round3. Two of them need warning headers to be safe to read;
              see the Documents section. Three documents remain genuinely missing.
     v1.6.0 — Removed every hand-maintained version number (all of them were wrong,
              one dangerously so), reconciled the references to four documents that
              are not in the repo, and documented the test suite, which existed but
              had never been written up and could not run. -->

A browser-based typing tutor for middle school students. Students type their way
through real books, chapter by chapter, while the app tracks speed, accuracy, and
time-on-task for teacher reporting.

**Live:** https://typethatbook.misterwilson.org (GitHub Pages, `CNAME` in repo root)
**Backend:** Firebase project `typethatbook` — Firestore + Auth + Cloud Functions

---

## The five surfaces

Versions are deliberately not listed here — see the note under "Versions: where
they actually live". Every number this column used to carry was stale, including an
`admin.html` entry reading 3.3.0 against an `admin.js` nineteen minor versions ahead.

| Page | Who | What it does |
|---|---|---|
| `index.html` | students | Library — pick a book, see per-book progress and today's time |
| `game.html` | students | **The main event.** Type a book chapter. Sprints, WPM, streaks, leaderboard, AI practice mode, Adventure Mode |
| `learn.html` | students | Structured lessons — home row, finger drills, on-screen keyboard guidance |
| `admin.html` | Jake | Book/chapter authoring (EPUB import via JSZip), lesson authoring + JSON import/export, goals. Title is driven from `ADMIN_VERSION` |
| `reports.html` | Jake | Time-on-task and accuracy reports by student and date range |

No build step. No bundler. Native ES modules loaded straight from the HTML with
`<script type="module">`, Firebase SDK 10.8.0 pulled from `gstatic.com`. Edit a
file, upload it to GitHub, it's live. Same workflow as Ellis Web Bell.

## File map

### Versions: where they actually live

**The runtime constant in each file is authoritative.** Header comments and
hardcoded page titles are decoration and have drifted before — `learn.js` carried
a header saying v1.0.0 while its constant read 1.6.3, and `index.html`'s title said
3.0.0 while its own footer said 2.3.1.

⚠️ **This document does not carry version numbers, on purpose (Round 6).** The
layout listing below used to, and every single one of them was wrong: `game.js`
read v3.8.0 against a constant of 3.13.x, `admin.js` v3.9.0 against 3.23.x,
`learn.js` v2.1.0 against 2.2.x, `storage.rules` v2.0.0 — which is the version
whose `image/*` requirement denied every EPUB cover. A hand-maintained list of
versions in prose is a fourth copy of something that already has three, and it is
the copy nobody updates. **Two places read themselves and cannot lie: the build
panel in `index.html` (expand the version banner) and the Contents list at the top
of `CHANGELOG.md`.** Use those.

| file | constant | shown where |
|---|---|---|
| `game.js` | `const VERSION` | game.html `#footer-primary`, console on init |
| `learn.js` | `const LEARN_VERSION` | learn.html `#footer-primary` + `document.title` |
| `game.html` | comment near top (Round 15) | game.html `#footer-primary` — html files carry it the same way the stylesheets do, since there's no runtime JS in a page shell to hold a constant |
| `learn.html` | comment near top (Round 15) | learn.html `#footer-primary` |
| `keyboard.js` | `export const KB_VERSION` | learn.html `#footer-full` (hover panel), no longer the primary line |
| `adventure-renderer.js` | `export const RENDERER_VERSION` | game.html `#footer-full` (hover panel), adventure debug overlay |
| `session-log.js` | `export const SESSION_LOG_VERSION` | `#footer-full` on both student pages (Round 15 — wasn't shown anywhere before) |
| `stats-wal.js` | `export const STATS_WAL_VERSION` | `#footer-full` on both student pages (Round 15 — wasn't shown anywhere before) |
| `hud.js` | `export const HUD_VERSION` | `#footer-full` on both student pages (Round 15 — wasn't shown anywhere before) |
| `admin.js` | `const ADMIN_VERSION` | admin.html footer |
| `lessons-admin.js` | `window.LESSONS_ADMIN_VERSION` | admin.html footer |
| `firebase-config.js` | `export const CONFIG_VERSION` | index.html build panel, `#footer-full` on both student pages |
| `versions.js` | `export const VERSIONS_VERSION` | index.html build panel, `#footer-full` on both student pages |
| `index.html` | `const INDEX_VERSION` | its own `document.title` + footer |
| `reports.html` | `const REPORTS_VERSION` | its own `<title>` + footer. ⚠️ Not in `versions.js`'s `SOURCES`, so the build panel does not list it — same as `index.html`, which self-reports too |
| `appcheck.html` | *hardcoded* `<title>` | standalone diagnostic, no deps beyond firebase-config |
| `storage.rules` | header comment | **console-only.** Storage rules are separate from firestore.rules |
| `style.css` | `body::before { content }` | read via `getComputedStyle`; also `#footer-primary` on both student pages |
| `adventure.css` | `body::after { content }` | read via `getComputedStyle`, `#footer-full` |

**Round 15 — the student-page footers changed shape.** `game.html` and
`learn.html` used to show a short hand-picked list (game.js/style.css/
adventure.css/adventure-renderer.js on Library; a one-line `School vX /
keyboard.js vY` string on School) with no way at all to see `hud.js`,
`session-log.js`, `stats-wal.js` or `firebase-config.js` — which mattered,
because that's exactly the blind spot Jake hit debugging the HUD bug in
`HANDOFF.md` §0.5. Now `#footer-primary` shows the three files most likely to
explain what a student is seeing (this page, its controller, its stylesheet),
always, no click required; `#footer-full` shows everything else, fetched
lazily on first hover (tap-to-pin on touch) via the SAME `readDeployedVersions()`
/`renderBuildList()` index.html's build-info button already used — not a
second mechanism. `game.html`/`learn.html` are versioned themselves now, the
same way the stylesheets are.

`index.html`'s **build info** panel reads every one of those out of the files as
actually deployed — it fetches and parses them rather than importing, because
importing `game.js` would try to boot the typing game on the library page. Lazy;
nothing is fetched until the panel is opened. See the header of `versions.js` for
why a shared version *manifest* was rejected (a stale cached file would report the
new version while running old code — it would lie exactly when you need the truth).

As of `versions.js` **v1.2.0** the build panel also compares each JS file's
**runtime constant against its header comment** and flags a mismatch in amber.
Both numbers exist in every file, both kept drifting (`admin.js` was nine minor
versions adrift), and keeping them aligned was a discipline problem until it
became a detected one. The convention: **the first `v<semver>` in a file's leading
`//` comment block is its current version.** Stylesheets are exempt — their comment
is the source of truth.

`game.js` now sets `document.title` from `VERSION` at runtime. `admin.html` and
`reports.html` still carry hardcoded page-shell versions in their `<title>` and are
NOT yet driven from a constant. Remaining inconsistency.

### Where everything is

⚠️ **The root directory is the deployment surface.** GitHub Pages serves this repo
from its root, so every file the browser loads has to stay there and the five
folders exist precisely because nothing in them is loaded by anything. Moving a
`.js`, a `.css`, an `.html` or `library/` out of the root breaks the site; moving
things *into* the five folders is free.

```
/                    THE SITE. Six HTML pages, thirteen shipped ES modules, two
                     stylesheets, library/. Plus CNAME, README.md, HANDOFF.md,
                     CHANGELOG.md, package.json, .gitignore.
tests/               33 harnesses + run-all-tests.mjs. 31 registered (27 fast,
                     4 corpus); 2 deliberately not. See tests/README.md.
docs/                Reference material, and docs/archive/ for superseded designs.
                     See docs/README.md.
tools/               audit-versions.mjs and the two EPUB builders. See tools/README.md.
firebase/            firestore.rules, firestore.indexes.json, storage.rules.
                     Console-deployed; nothing reads them from here.
functions/           index.js — the Cloud Function. Not deployable from this repo.
library/             The book corpus, plus the two synthetic test EPUBs.
```

Root is thirty-three entries. It was seventy-nine before Round 17, and the reason
that mattered was not tidiness: the harnesses were interleaved alphabetically with
the code they test, so `game.js` sat between `firestore.rules` and `hud-test.mjs`
and there was no way to see at a glance which files the site actually serves.

### Layout

```
firebase-config.js               Firebase init. Exports db, auth, storage, and
                                 CONFIG_VERSION.
                                 experimentalForceLongPolling is load-bearing —
                                 it fixes Safari's CORS block on Firestore's
                                 WebChannel transport. Do not remove.

versions.js                      Reads every file's version constant out of the
                                 deployed files, for index.html's build panel.
                                 Also parses header comments and flags drift,
                                 plus the header budget. No imports, no side
                                 effects. Mirrored for CLI use by
                                 audit-versions.mjs.
                                 ⚠️ It cannot check itself against reality: it
                                 reads what a file CLAIMS. Round 6 found
                                 adventure-renderer.js shipped with its constant
                                 a version behind its code, which this panel
                                 reported as a clean 1.1.0.

game.js                          ~5,900 lines. Typing engine, sprint timer,
                                 WPM/accuracy math, streaks, mistake tracking,
                                 leaderboard, practice mode, chapter navigation,
                                 all modals. Write-ahead-log persistence.
                                 Owns the view-choice splash and applyViewMode()
                                 — the Classic/Adventure switch.
adventure-renderer.js            Adventure Mode — the illustrated/animated skin.
                                 Listens for _ttbEmit('keystroke') from game.js.
                                 Out of alpha as of v1.0.0.
adventure.css                    Adventure Mode styling.

learn.js                         Lesson-mode engine (separate from game.js).
                                 Same WAL/flush persistence pattern as game.js.
keyboard.js                      On-screen keyboard widget, used by learn.html.

admin.js                         Book authoring, EPUB import, chapter editor,
                                 book tags, language filter (regex + audit),
                                 book list CSV export + balance report.
                                 Hosts the Lessons and Staff panels from their
                                 own files.
lessons-admin.js                 Lesson + class authoring, CSV roster import,
                                 lessons JSON import AND export, gate audit
                                 table, stuck-student scan, add-one-student.
                                 Version exposed as window.LESSONS_ADMIN_VERSION
                                 so admin.js can read it.
staff-admin.js                   Staff tab: roles, schools, classes, grants.

style.css                        Main stylesheet. #view-splash, condensed book bar.

functions/index.js                Cloud Function: generatePractice. Calls Gemini to
                                  generate custom practice paragraphs targeting a
                                  student's problem characters. 5/user/day cap.
                                  NOT deployable from this repo — needs a CLI.
                                  ⚠️ It was `index.js`, in the root, directly above
                                  `index.html`, and unrelated to it. Round 17 moved
                                  it into functions/ for that reason alone.
package.json                      Stays at the root, because npm requires it there.
                                  It serves both the function (dependencies) and the
                                  harness suite (devDependencies); the comment keys
                                  inside it explain which is which and why the split
                                  matters at deploy time.
```

### Not served, not deployable from a browser

```
firebase/firestore.rules          Published; console-only. Version is in its own
                                  header comment — see the note above about not
                                  duplicating version numbers here.
firebase/firestore.indexes.json   The ONLY written record of the three composite
                                  indexes and both TTL field overrides. Needs the
                                  CLI to deploy; the indexes can also be created
                                  from the click-to-create links Firestore returns
                                  on the first failing query.
CHANGELOG.md                      Full per-file version history. Headers are
                                  budgeted to 6 entries; the rest lives here.

docs/TTL-GUIDE.md                 ✅ RECOVERED in Round 6 and verified. Console
                                  runbook: the two TTL policies, the billing
                                  arithmetic, why pre-v3.4.0 documents are never
                                  collected, and the three composite indexes. TTL
                                  lives in the GOOGLE CLOUD console, not Firebase —
                                  that trips everyone.

docs/SCALE-PLAN.md                Recovered Round 6. The 7,000-student cost model.
                                  ⚠️ Read its header box: statuses were corrected,
                                  and its Security section's premise was false.

docs/DESIGN-TELEMETRY.md          ⚠️ THE FORWARD PLAN, and read it before touching
                                  anything that counts time. Sessions become the
                                  single append-only source of truth and all totals
                                  derive from them. §2 is verification-only, every
                                  claim read out of shipped source. §7 is the build
                                  order — steps 1 and 1.5 shipped in Round 13,
                                  step 2 is next and closes a live data-loss path.
                                  §8 is the list of things that must not happen.

HANDOFF.md                        ⚠️ THE ONLY HANDOFF. There is no
                                  HANDOFF-roundN.md and there must never be one
                                  again. Round 14 folded nine of them into this
                                  single file and deleted the rest; §0 is the rule
                                  set that keeps it that way, §5 is the invariant
                                  list, and §8 is one line per round so a version
                                  number in a comment can still be placed.
                                  ⚠️ If a document you are reading cites
                                  "HANDOFF-round8 §4" or similar, that file does
                                  not exist and its content is already in
                                  HANDOFF.md. Do not go looking, and do not send
                                  Jake looking.

tests/firestore-rules.test.mjs    ⚠️ KNOWN WRONG. Header says v1.1.0 and it seeds
                                  roles as auth-token claims; rules v2.x reads
                                  staff/{uid} documents and ignores the token.
                                  Committed as a starting point for a rewrite, not
                                  as a passing suite. Needs a CLI + emulator.

docs/README.md                    Index of the reference documents, with a line on
tests/README.md                   when to read each. Written in Round 17 because
tools/README.md                   three folders with thirty-odd files in them need
                                  a door, and because the old single flat list had
                                  twice sent readers after files that were not there.
```

### Deleted in Round 14, deliberately — do not restore them

⚠️ **Corrected in Round 17: `MULTITENANCY.md` was never actually deleted.** Both this
file and `HANDOFF.md` recorded it as gone for three rounds while it sat in the repo
root the entire time — which is the worst of both, since anyone who trusted the note
would not open the file and anyone who found the file would not know it was superseded.
It is in `docs/archive/` now, with the warning header it was committed with. It
specified an Auth custom-claims model that was reversed years ago, it read as
authoritative to anyone who opened it first, and it is the probable reason
`firestore-rules.test.mjs` has never matched the rules it tests. **Genuinely deleted,
and still to be left deleted:** `UPLOAD-ORDER.md`
described Round 6's upload batch and had been eight rounds stale.
`typethatbook-round6-noiseless.zip` was a copy of the repo, inside the repo.
`chunktest.mjs` passed green against a rollup loop that had moved into
`session-log.js` — `session-merge-test.mjs` Part B is its real replacement. Every
`HANDOFF-roundN.md` is folded into `HANDOFF.md`.

⚠️ **All of it is in GitHub commit history if it is ever genuinely wanted.** That is
the archive. A second copy in the working tree is invariant 37, not a backup.

## Firestore data model

```
books/{bookId}                          title, author, chapter list metadata
books/{bookId}/chapters/{chapter_N}     the actual text students type

users/{uid}                             classId
users/{uid}/progress/{bookId}           chapter, charIndex, furthestChapter,
                                        furthestCharIndex, completedChapters[],
                                        bodyIndex, bodyTotal, lastUpdated,
                                        contentVersion, chapterTitle,
                                        chapterLen, anchorText
users/{uid}/stats/time_tracking         secondsToday, charsToday, mistakesToday,
                                        secondsWeek, charsWeek, mistakesWeek,
                                        lastDate, weekStart
users/{uid}/profile/info                initials, leaderboardOptOut
users/{uid}/lessonProgress/{lessonId}   lesson completion records

typing_logs/{uid}_{YYYY-MM-DD}          daily rollup for reports.html
typing_sessions/{auto}                  one doc per sprint (append-only)
practice_sessions/{auto}                one doc per AI practice attempt
practice_limits/{uid}                   rate-limit counter, written by Cloud Function

leaderboard/{uid}                        initials, bestWPM, bestAccuracy, bestStreak,
                                        chaptersCompleted, totalSecondsWeek, weekStart
                                        NO real names — every student can read this
                                        collection. Names live in typing_logs.
                                        Needs one composite index:
                                        weekStart ASC + totalSecondsWeek DESC

classes/{classId}                        class metadata
pendingClassAssignments/{...}            class-join handshake
lessons/{lessonId}                       lesson definitions. The ONLY copy of the
                                         curriculum — export it from admin.html
                                         (Lessons → Export JSON) to back it up.
                                         Export output is import-compatible, so a
                                         downloaded file can be pasted straight
                                         back into Import JSON to restore.
settings/goals                           daily/weekly time goals (global)
```

⚠️ **`contentVersion` / `chapterTitle` / `chapterLen` / `anchorText` make a bookmark
self-describing (game.js v3.15.0), and every write to this document must include them.**
A bookmark is `(chapter, charIndex)`, both measured against one version of the book's
text — so when a book is re-uploaded, a bookmark that does not record its version cannot
be rescued, and the failure is silent: the student resumes at a meaningless offset,
which near a chapter end means the chapter completes and marks itself read.

`anchorText` is the ~48 characters *behind* the cursor. On a version mismatch `game.js`
searches the new text for it and resumes at the match — proof, not a guess, and it
survives both word-level edits and a renumber. When there is no anchor or it cannot be
found, position degrades by the age of `lastUpdated`: under a week the exact offset,
under a month the start of the sentence, beyond that the start of the chapter.

**Books can therefore be re-uploaded freely.** No migration, no reset, no admin tool —
each student's bookmark heals the next time they open that book. (An admin repair tool
is not buildable anyway: `firestore.rules` permits staff to *read* any student's
progress but restricts writes to the student themselves.)


## Grading a week — the procedure, start to finish

⚠️ **The `Audit Week Counters` button is GONE as of `reports.html` v2.16.0.** It
compared a student's stored week counter against the sum of their daily logs.
There is no stored week counter any more — the student's own screen reads these
same daily logs — so there is nothing for it to compare. If you are looking for
it, you want `Reconcile vs Sessions`, which checks the graded document against
the append-only session record behind it.


⚠️ **This is the weekly routine. It is read-only until the CSV lands, it does
not require the week-counter audit, and it does not depend on which version of
`game.js` any student is running.** That last property is the whole reason it
works — see "Reconciliation: which number is the record" below.

1. Open `reports.html`. **Check the browser tab title reads `TypeThatBook
   Reports v2.15.0` or higher.** If it says 2.14.0 you are on a cached copy and
   nothing below will be there.
2. Set the range to the Sat–Fri school week. The **This Week** button does it.
3. **Generate.**
4. **Reconcile vs Sessions.** Read-only — it issues no writes of any kind. It
   fills three columns: `Sessions`, `Δ`, `⧉`.
5. **Export CSV.** It now carries `Session Seconds` beside `Total Seconds`.
6. **Grade off the larger of `Total Seconds` and `Session Seconds`.**

⚠️ **Why the larger of the two, and not "the correct one".** The two numbers are
written by independent paths. `typing_logs` can err in either direction;
`typing_sessions` can only ever undercount, because a queue that never flushed
loses real time and nothing invents time that was not typed. Taking the higher
can therefore only err in a student's favour. And since the target is 10 minutes
a day, **anything above target is already full credit — inflation above the line
changes no grade at all.** Deflation is the only failure that costs a child
points, and taking the higher number is precisely what catches it. Every known
defect in this area is our code's fault, not a child's.

**When to run it:** end of period or end of week, never mid-chapter. Sessions
are written at run and unit boundaries, so a student typing right now has real
time in their log that has not reached sessions yet. They will show a positive Δ
that is not a defect, and the page warns you during school hours.

**What Δ means, and what it does not.** Δ is (daily log − sessions). It is not
automatically a defect: session records begin at v2.4.0 and carry a 120-day TTL,
so anything older legitimately has a log and no sessions behind it. Sort by Δ to
put the outliers on top; sort by ⧉ to find duplicate rollups.

## Forcing an update — `update-gate.js`

A Chromebook tab that is never closed never re-requests anything, and there is no
service worker to swap. So a fix can sit deployed on the server for days while
the classroom keeps running last week's arithmetic. `update-gate.js` v1.0.1
closes that.

**To reload every signed-in client in the building:** Firestore console →
`settings` → `appVersion` → field `nonce` (number) → **increase it by one.**
That is the entire operation. Optional `note` (string) is shown to the student on
the overlay.

Clients check at startup, every ten minutes, and whenever a hidden tab comes back
to the foreground. A client that finds a higher nonce than the one it last acted
on re-requests every asset with `{cache: 'reload'}` and then reloads itself.

* **It waits for 8 seconds of no keystrokes** before reloading, so nobody is
  interrupted mid-sprint. A tab that is already hidden reloads immediately.
* **It preserves `?book=`**, so a student lands back in their own book.
* ⚠️ **It cannot reach a tab that is already open running code from before this
  file shipped.** Nothing can — a page that is not asking the server a question
  cannot be told an answer. Those clear on the next reload or restart. What the
  gate buys you is that this is the last time it happens.
* ⚠️ **Guests are not gated.** `firestore.rules` allows `settings/{docId}` reads
  to signed-in accounts only, and that was left alone on purpose — widening it is
  a security decision, not a deploy convenience. Guests have no graded record.

⚠️ **If a deploy does not seem to have reached a student, check the footer before
theorising.** Both student pages stamp their own `html / js / css` triad into the
footer, and hovering it (tap-to-pin on touch) expands the full deployed build
including `update-gate.js`. **If `update-gate.js` is missing from that list, the
gate is not running on that machine** and no nonce bump will move it.

## Reconciliation: which number is the record

⚠️ **Read this before changing anything that writes to `typing_logs` or
`typing_sessions`.** Two collections hold overlapping copies of the same
quantity, and which one you treat as authoritative is the single most
consequential decision in this part of the app.

| collection | how it is written | trust |
|---|---|---|
| `typing_logs/{uid}_{date}` | a **live counter** accumulated in browser memory by `game.js` and `learn.js`, flushed on a timer and at page-death. Two page controllers share one document. | **This is a cache.** It depends on a tab surviving and on a write landing at exactly the wrong moment not happening. Every counter defect this project has had lived here. |
| `typing_sessions/{auto}` | one document per (day, source, book/lesson) group, written from a durable `localStorage` queue at run/unit boundaries, each carrying the `sprints[]` it was built from. | **This is the record.** Verified 2026-08-19 by console dump: every document's stored `seconds`/`chars` matched the sum of its own sprints exactly. |
| ~~`users/{uid}/stats/time_tracking`~~ | ✅ **DELETED — Round 19, Stage 1.** | It was a second copy of the same numbers, accumulated separately in the student's browser and flushed on its own schedule, and it is where every counting incident in this project's history came from. It existed only because `firestore.rules` up to v2.4.0 gave a student's browser **no read access** to either record above, so the HUD had nowhere else to get a number. `firestore.rules` v2.5.0 added owner-read; `daylog.js` is what that unlocked. |

⚠️ **AND `typing_logs` IS ITSELF DERIVED** (Stage 2, `game.js` v3.32.0 /
`learn.js` v2.17.0). Each flush writes

```
seconds = deduped sessions on the server
        + this device's un-uploaded queue
        + this tab's still-open sprint or run
```

so two tabs open at once can no longer overwrite each other's day — each adds
only its own unflushed tail on top of the same shared base. **A failed session
read writes nothing at all**, because a projection built on a failed read is an
invented number, not a smaller one.

⚠️ **ONE DOCUMENT, READ BY EVERY SURFACE.** The student's HUD, the library shelf
banner and the teacher's report all read `typing_logs/{uid}_{date}` — the same
seven documents per week, through the same shared `daylog.js`. **Two surfaces
reading one document cannot disagree.** Two surfaces reconciling two documents
always eventually will, which is what four rounds of audits and repairs were
about.

⚠️ **THE WEEK IS DERIVED AND STORED NOWHERE.** It is the sum of the seven daily
documents, recomputed on every page load. A derived quantity cannot drift from
its inputs, cannot be double-merged, and has no repair path because it has no
stored value to be wrong. **The week-counter audit and its repair button are
deleted** — there is nothing left to audit.

⚠️ **THE ONE RESIDUAL GAP, stated plainly because it is irreducible:** a student
mid-sprint has typed seconds that have reached no stored record anywhere. The HUD
shows the stored figure plus the live open-unit delta. It closes at every unit
boundary and whenever the tab is hidden. No design removes it.

Grades come from `typing_logs`. That is fine as long as somebody can check it
against `typing_sessions`, which is what `reports.html` v2.15.0 exists to let
you do.

### Using it

**Reconcile vs Sessions** (read-only, writes nothing) sweeps the sessions for
every student-day in the current report and fills three sortable columns on the
main table:

* **Sessions** — the deduped sum of that student's session records.
* **Δ** — daily log minus sessions, in time, with a characters delta beneath it.
* **⧉** — duplicate session rollups found.

Sort by **Δ** or by **⧉** and the problems come to the top. That is the whole
workflow; you should not have to expand a student to discover a problem, only to
confirm one.

**Rebuild from sessions** recalculates each day's log from the sessions behind
it — the same operation the per-day `⟳` button performs, applied across the
report, behind a preview that separates the students whose numbers go **down**
from those whose go **up**.

### ⚠️ When a Δ is not a defect

* **Sessions begin at v2.4.0 and carry a 120-day TTL.** Anything older
  legitimately has a log total and no session records behind it.
* **Sessions are written at run/unit boundaries.** A student who is mid-chapter
  right now has real time in their log that has not reached sessions yet.
  Reconciling during a period shows a positive Δ for every child currently
  typing.

**So: reconcile and rebuild at the end of a period or the end of a week, never
mid-chapter.** Rows dated today are excluded from a rebuild by default for this
reason, and the panel warns on weekdays between 07:00 and 15:00.

### ⚠️ What a rebuild will not do

It never zeroes a day that has no session records — that day's log total is
probably the only copy left. It never creates a missing daily-log document
(`firestore.rules` permits staff to *update* a log, never to *create* one), so
days with sessions and no log are reported for you to handle by hand. It skips
any day whose sessions changed between the preview and the write, rather than
writing a number you did not approve. And the bulk write needs building-scoped
staff — a class-scoped teacher gets the read-only half only.

### Known blind spot

A student with **no `typing_logs` document at all** in the range never appears in
the report, so reconciliation cannot see them. A missing *day* is caught; a
missing *student* is not. `HANDOFF.md` §6.9.


## Auth and admin access

Google sign-in via `signInWithPopup`. **Signing in is optional**: a guest can
browse the library, read and type a book, and work through the lessons. Nothing
is tracked until they sign in, and the login nudge (see below) is the only thing
that asks.

⚠️ **THIS SECTION USED TO SAY "students may also play anonymously" AND IT WAS NOT
TRUE UNTIL ROUND 9.** The client code was all there — a signed-out branch in
`game.js`, another in `learn.js`, 29 `isAnonymous` write guards — but
`firestore.rules` had `allow read: if signedIn()` on every content collection, so
a guest could read nothing and every page drew an empty shelf. `firestore.rules`
v2.3.0 is what switched it on. **Guest access is granted by `allow read: if true`
on the content matches; it has nothing to do with Firebase Anonymous Auth, which
is not enabled and which `signInAnonymously` is never called to start.** See the
warning in `firestore.rules` before enabling it — it widens six unrelated grants.

If a guest signs in mid-session, both `game.js` and `learn.js` retroactively
merge the session's minutes, chars, mistakes and reading position into the
account. ⚠️ **That merge is the load-bearing part of the login prompt.** Round 9
found two competing prompts in `game.js`, one of which called `location.reload()`
instead and discarded the session — so whichever fired decided whether the child's
work survived saying yes. There is now one prompt, two rungs (60s and 300s of
active typing), shared across both pages via `ttb_anonNudge_v2`, and never a
third. `anon-ladder-test.mjs` guards it.

Admin pages gate on a hardcoded email list:
- `admin.js` line 18 — `ADMIN_EMAILS`
- `reports.html` line 306 — a second, separate copy of the same list

⚠️ **Keep those two lists in sync.** They are duplicated, not shared.

⚠️ **This gate is cosmetic.** It hides UI; it does not stop anyone from reading or
writing the same data directly from the browser console. Real enforcement requires
Firestore security rules — read `firestore.rules` directly. `SCALE-PLAN.md` § Security
is now in the repo too, but ⚠️ its premise ("no rules in this repo") was true when
written and is not now; read its header box.

## Tests

There are thirty-four harnesses, in `tests/` — thirty-two of them registered in
`run-all-tests.mjs` (28 fast + 4 corpus) and two deliberately not, for reasons
`tests/README.md` gives. They are for whoever is editing the code,
not for Jake — running them needs Node, which is exactly what this project's
deployment story does not have. Nothing in the app depends on them.

```
npm install                            # devDependencies only; nothing ships to Functions
npm test                               # the 28 fast ones, ~10 seconds
npm run test:epubs                     # plus the 4 corpus harnesses, ~2 minutes
npm run audit:versions                 # versions.js's drift + budget checks, offline
```

All three run from the repo root. `tests/README.md` covers the suite in detail —
including the two harnesses that are deliberately not registered, and the two that
Round 17 found passing and unregistered and wired in.

⚠️ **`npm test` currently reports 27 of 28 with `metadata-map-test.mjs` failing** on 42
of 487 assertions — Gutenberg-sourced EPUBs report a `gutenberg.org` origin where the
harness expects Standard Ebooks. It is a book-metadata question, not an app defect, and
it has been the accepted "1 failing" for several rounds. **That is exactly the state
that hides the next real failure** (`HANDOFF.md` invariant 54). Fix the map or skip it
loudly; do not keep reading "1 failing" as the normal number.

⚠️ **Every harness had an absolute path from the sandbox that wrote it**
(`/home/claude/work/game.js`) until Round 6, so **not one of them could run** in a
fresh checkout. They now resolve their sources relative to their own location via
`import.meta.url`, and the EPUB harnesses default to this repo's `library/` with an
optional directory argument. **That property is what made the Round 17 move cheap** —
every source path became `../` instead of `./` and nothing else had to change. The cost of that was not "the tests were stale" — it
was that `credit-test.mjs` had been broken for a whole round and nobody could see
the difference between broken and passing.

⚠️ **Run `npm install` before running the suite.** Without `node_modules`, seven
harnesses fail with `ERR_MODULE_NOT_FOUND`, which looks exactly like seven broken tests
and is not one.

⚠️ **THIS SECTION USED TO SAY THOSE FOUR PACKAGES WERE "all declared in `package.json`"
AND THEY WERE NOT.** Round 7 reported them missing; Round 8 called that false and wrote
the correction into this file and the handoff — in the same section that added the
invariant *"verify your own complaints before writing them down."* Round 8's container
had them installed from an earlier session, so the suite ran, and a working test run was
read as proof of a declaration nobody opened the file to check. **A green suite is
evidence about the machine it ran on.** Fixed in Round 10: `acorn`, `acorn-walk`, `jsdom`
and `jszip` are `devDependencies`, so `firebase deploy` — which installs production
dependencies only — does not carry them to the functions bundle or its cold starts.
`git clone && npm install && npm test` now works on a clean machine, which it never had.

⚠️ **`metadata-map-test.mjs` takes ~3 seconds**, not the "well under a second" the
fast list otherwise promises, because it unzips all 24 books in `library/`. It is in
the fast list anyway, and `run-all-tests.mjs` says so: it guards a regression that
shipped for six versions unnoticed, and a guard that only runs behind a flag is a
guard nobody runs. Its synthetic half still passes with `library/` absent.

⚠️ **`lift()` as inherited silently strips `async`.** It searches for
`function NAME(`, which begins the slice *after* an `async` keyword, producing a
non-async function whose `await` is a `SyntaxError`. Every use before Round 7 happened
to be synchronous, so nobody found out. `metadata-map-test.mjs` has the corrected
version; copy that one.

**How they work, and why not to rebuild them.** They lift the *shipping* functions
out of the real files by brace-matching rather than keeping a copy, so a rename
breaks them. That is correct: it forces a human to notice. When one breaks, reanchor
the markers; don't paste the logic in.

| harness | what it proves |
|---|---|
| `undefined-calls-test.mjs` | every identifier reference in the 9 shipped JS files resolves |
| `metadata-map-test.mjs` | EPUB `dc:` metadata maps onto real `admin.html` dropdown options, over all 24 books in `library/`; and Gutenberg's origin link is found in `#pg-machine-header` |
| `reanchor-test.mjs` | Progress survives a book being re-uploaded: the clamp, the anchor search, and the staleness ladder (exact → sentence → chapter) |
| `verify-guards.mjs` | flush re-entrancy guards hold at 2/3/6/12 concurrent callers |
| `progress-test.mjs` | library progress bar, including its degradation paths |
| `ordinal-test.mjs` | body ordinals on modern and legacy documents |
| `map-geometry-test.mjs` | Adventure dot placement across real book sizes |
| `credits-test.mjs` | Classic end credits: structure and HTML injection |
| `credit-test.mjs` | library card attribution: structure and HTML injection |
| `card-markup-test.mjs` | card markup survives the HTML parser intact |
| `about-test.mjs` | `detectAbout()` and the completeness dot's gap list |
| `about-render-test.mjs` | About panel segments, cached headings, credit injection |
| `anon-ladder-test.mjs` | guest login ladder: rungs, the no-third-prompt rule, both coalescing guards. ⚠️ Half its assertions are structural (they read source text) and say so — see its header |
| `class-create-test.mjs` | class-name matching and the shared CSV class-creation path. ⚠️ Asserts that name variants collapse to one class AND that `Period 3`/`Period 4` stay apart — a matcher this feature can now *create* against |
| `roster-filter-test.mjs` | Students-tab date range and status line. ⚠️ Pins the property that makes the Saturday week start correct — Mon–Fri in one bucket — so nobody "fixes" the boundary and silently breaks weekly goals |
| `sort-test.mjs` | library sort keys, tested against the REAL author strings in `library/` — initials, four-token names, and Brontë's diacritic are the cases that break |
| `chapter-harness.mjs` | full chapter pipeline over a directory of EPUBs |
| `real-epub-harness.mjs` | cover detection + old-vs-new spine resolution |
| `scan2.mjs` | suspect body chapters (Fix C candidates) |
| `fix-candidates.mjs` | **before/after differ** — collateral damage from any importer change |
| `firestore-rules.test.mjs` | ⚠️ excluded from the runner — needs the emulator, and **has never once been executed**. Updated to v1.2.0 for rules v2.3.0: its old "a guest can read nothing" assertion passed while describing the bug, and is now inverted into where the guest boundary actually is |

**`undefined-calls-test.mjs` is the one to run first**, because it is the only one
that checks the whole codebase rather than one behaviour. It parses each file with
acorn and asks whether every identifier reference resolves to a declaration, an
import, or a known global. It was written in Round 6 after `learn.js` shipped a call
to a `finishLesson()` that never existed; it immediately found a second instance in
`lessons-admin.js` that had taken four admin features down with it. Both are the
same shape of defect and neither is findable by reading — grep shows one hit and it
looks like a reference to something real.

**`fix-candidates.mjs` is the important one before touching the importer.** Point it
at a corpus and it tells you exactly which chapters a change moves. That is how
Fix A, B and C were shown to move no body chapter's id on any book before shipping.

## Deploying

**Static pages** (everything except `index.js`/`package.json`): upload the changed
files to the GitHub repo through the web UI. GitHub Pages serves them. No build.

**Cloud Function:** requires the Firebase CLI from a machine with the functions
directory and `GEMINI_API_KEY` set as a Firebase secret. This is the one part of
the project that can't be shipped from a browser.

**Cache:** these files are served with default GitHub Pages caching. If a change
doesn't appear, hard-reload. The version stamps in the page titles and the admin
footer exist so you can confirm which build is actually loaded. **To push a
reload to the whole building rather than asking students to do it, see "Forcing
an update" above.**

⚠️ **UPLOAD ORDER WHEN A SHARED MODULE IS INVOLVED.** `game.js` and `learn.js`
import `session-log.js`, `stats-wal.js` and `hud.js`; a missing module throws on
import and renders **nothing at all**. Shared modules go up first, always.
`update-gate.js` is the one exception in the repo — it loads from its own
`<script>` tag in each shell, so its own module graph is separate and a 404 on it
cannot take a page down. It still goes up before the two shells that reference
it, because a shell pointing at a file that isn't there logs a console error on
every student's machine for no reason.

## Header budget

**60 lines and 6 version entries per file header, newest first.** Everything
older goes to `CHANGELOG.md`, which is organised per file.

A header should answer three questions and stop: what is this file, what changed
recently, and what will bite me if I "simplify" it. That last part — the
load-bearing invariants — is the reason a header exists at all, and it was
getting buried. `game.js` had reached **122 lines and 18 entries**, with the
entries silently **out of order**, because each session's edit anchored on the
previous newest one and landed a slot too deep. Nobody catches that by reading,
because nobody reads a 122-line comment.

Enforced, not merely requested: `versions.js` v1.3.0 audits every header and
reports over-budget, over-count, and out-of-order to **`index.html`'s build
panel** in red. Stylesheets are exempt — their comment is their only version.

The checker is sabotage-verified: it fires on 7 entries, on 61 lines, and on the
exact scramble `game.js` had, while not counting version numbers that merely
appear inside an entry's prose.

## Versioning rules

- Every file that ships gets a version bump.
- Patch and minor are automatic; **major requires Jake's explicit sign-off.**
- **Bump the runtime constant, not just the header comment.** The constant is what
  renders on the page; a header-only bump is invisible and actively misleading.
  See the version table above for where each file's constant lives.
- **Bump both, and they must agree.** Constant, header comment, and any `<title>`
  are three copies of one fact. `index.html`'s build panel flags constant-vs-header
  disagreement in amber as of `versions.js` v1.2.0 — if you see amber there, one of
  the two numbers is a lie and the constant is the one telling the truth.

## Book tags (admin.js v3.7.0 / index.html v3.2.0)

`books/{id}` carries `minAge`, `maxAge` (numbers, or **`null` for untagged**) and
`protagonistGender` (`''` untagged, or `female` / `male` / `multiple` / `ensemble`
/ `nonhuman` / `unspecified`).

`null` and `''` are meaningful values, not absences — read them with a type check,
never `|| 0` or `|| ''`. `unspecified` means "somebody looked and the text doesn't
say"; `''` means "nobody has looked yet". The admin book picker marks the latter
with an amber ○.

The library filters by **overlap**, not containment:
`book.minAge <= filterMax && book.maxAge >= filterMin`, with an absent filter end
unbounded. A student asking for 9–12 gets a 7–11 book, which is the point.
Untagged books are excluded from age-filtered results and counted in a note
beneath the filter bar.

## EPUB import: ask the book, don't guess

Three strategies, tried in order, all of them reading what the book states about
itself rather than inferring from shape:

1. **`epub:type`** on the root section says `frontmatter` / `bodymatter` /
   `backmatter`. Authoritative in 18 of 20 test books. Only bodymatter becomes a
   numbered chapter — before this, Standard Ebooks' `imprint.xhtml` was chapter 2
   of every book in the library and every real chapter was offset.
2. **The table of contents**, for splitting one spine file into many.
3. **Container structure** (`<article>` / `<section>`), the v3.9.0 heuristic.
4. Whole file, unchanged from the original behaviour.

⚠️ **A chapter's title may not be in its heading.** Standard Ebooks marks a titled
chapter as an `<hgroup>` with the ordinal in the `<h2>` and **the title in a
`<p epub:type="title">`**. A heading-only extractor returns "II" and never sees
"Old Tom and Nancy" — and because the title is a `<p>`, it also lands in the prose
as the first thing a student types. Both halves are fixed; if you touch this code,
rebuild the twenty-book harness described in `HANDOFF.md` §B.7 first.

⚠️ **`parseFloat` cannot compare part numbers.** `parseFloat("1.10")` is 1.1, the
same value as `parseFloat("1.1")`. Use `compareChapterIds()`.

## EPUB import: collections vs novels

One spine file is normally one chapter. **Collections break that rule** —
Standard Ebooks puts every short work of a collection in a single XHTML file as
sibling `<article>` / `<section>` elements. Aesop's Fables is 284 fables in one
file.

`findChapterUnits()` in `admin.js` detects that shape and splits on it. A unit
must have a heading *and* a paragraph; only leaf units count (so a
parts-and-chapters book splits into chapters, not parts); and fewer than two
units means no split, which is what keeps novels on the original code path.

The parse status line reports when a file was split and into how many sections.
If a split ever looks wrong, that number is the tell.

⚠️ Never use `innerText` on a `DOMParser` document here — it needs layout and
returns `undefined` in Firefox. Use `textContent`.

## Editing a book: one pass

`readBookMetadataForm()` is the only place the book metadata form is read. **Save
Metadata and Upload All both call it**, so they cannot drift — they did, for four
releases, and that is what made every book need two visits.

Upload All writes chapters *and* metadata. A new book is: create → parse → fill
in genre / age / protagonist → Upload All. Done.

⚠️ `loadBookList(selectFirst)` defaults to **false** and preserves the current
selection. Passing `true` makes it jump to the first book and fire `onchange`,
which hides the staging area and reassigns `activeBookId`. Only the boot call
should pass `true`.

**Find & replace** (Language panel) works on the staged copy only — nothing is
written until upload. Case-preserving, fixes a/an, whole-word by default, `/…/`
for regex. Preview before commit.

## Student school picker

Settings → School. A student with **no class** may set or clear their building;
`schoolId: ''` is a permanent valid state and is never nagged about. A student
**in a class** sees it read-only — the teacher's assignment wins, always.

Uses existing rules (`users/{uid}` self-write, `schools` read-if-signed-in). No
rules change was needed. Schools are cached 24h in `SCHOOLS_CACHE_KEY`; saving
clears `GOALS_CACHE_KEY`, which also carries `schoolId`.

## Books with a lot of chapters

Aesop's Fables is 286 chapters and was the first book to break the per-chapter
UI. Two thresholds now guard it, both set to **40**:

- `BOOK_BAR_MAX_SEGMENTS` (`game.js`) — above it, the classic book progress bar
  renders condensed. This is a **performance** guard as much as a visual one: the
  segmented bar cost four `getElementById` calls per chapter *per keystroke*.
- `MAP_MAX_DOTS` (`adventure-renderer.js`) — above it, the chapter map draws one
  continuous route instead of a dot per chapter. The branch returns *before* the
  per-chapter route loop; keep it that way or the frame cost stays.
- `CHAPTER_FILTER_MIN` (`game.js`) — above it, chapter dropdowns get a filter box
  matching number or title, with Enter as Go.

Every chapter dropdown is built by `buildChapterOptions()`. There were three
hand-rolled copies and they had drifted — two of them populated the *same*
`<select>` with different labels. One builder; don't add a fourth.

## Language filter

Built-in terms live in `FLAGGED_WORD_GROUPS` in `admin.js` (categories: `slur`,
`profanity`, `period`, `anatomy`) and need a code change. Custom terms live in
`settings/languageFilter` and apply to every book immediately.

Both accept **`/…/` for a regular expression**; anything else is a whole-word
literal. Patterns are validated on entry and skipped-with-a-report at compile
time, so one bad entry can't break every scan. Admin → Language panel →
**Show every term** renders the whole effective filter and will highlight which
terms fire against a sentence you paste in.

Some words are deliberately *not* flagged because they're innocent in period
English — see the comment above `FLAGGED_WORD_GROUPS` before adding any.

## localStorage keys

As of `game.js` v3.4.0 the app keeps real state locally. Clearing site data loses
at most one unflushed session; it is not destructive beyond that.

View-mode keys added in v3.5.0: `ttb_view` (`classic` | `adventure`) and
`ttb_viewRemember` (`'1'` | `'0'`). Both are a **cache** — the durable copies live
in `users/{uid}/profile/info` as `viewMode` / `viewRemember` and win on conflict,
which is what makes the choice follow a student between machines. There is also a
**sessionStorage** key, `ttb_splashBook`, holding the book id the splash last asked
about in this tab; that one is deliberately not durable.

| key | what |
|---|---|
| `ttb_wal_v2` | **write-ahead log** — position, time, sprint history not yet in Firestore |
| `ttb_learnwal_v1` | same, for lesson mode |
| `ttb_ch_v1:{book}:{chapter}` | cached chapter text |
| `ttb_goalsCache_v1` | goals + classId + schoolId, 1-day TTL. **Shared by game.js and learn.js** — one read serves both pages |
| `ttb_lessonsCache_v1` | the whole `lessons` collection, 4h TTL, count-validated (learn.js 2.2.0) |
| `ttb_lessonProgCache_v1` | the student's `lessonProgress`, 8h, uid-namespaced (learn.js 2.2.0) |
| `ttb_booksCache_v1` | the library list with `chapters` stripped, 6h, count-validated (index.html 3.3.0) |
| `ttb_idxProgCache_v1` | the student's per-book progress, 8h, uid-namespaced (index.html 3.3.0) |
| `ttb_lbThresholds` | leaderboard top-10 cutoffs |
| `ttb_sessionLength` | the sprint-length dropdown |

⚠️ **Every per-student cache is namespaced by uid.** On a shared cart machine a
cache that isn't would hand one student another's progress. If you add one, do
the same.

⚠️ **Caches degrade to a read, never to a broken page.** A quota failure, a
corrupt entry, or a parse error all fall through to a real fetch. The lessons
and library caches go one further and serve an EXPIRED copy rather than an error
screen, so a student on a flaky school network still sees the map they saw this
morning.

**Escape hatches**, because a TTL is not a workflow. After editing content, run
`ttbClearLearnCaches()` in the console on the school page, or
`ttbClearLibraryCache()` on the library, and reload.

⚠️ **`admin.js` and `admin.html` are a matched pair.** From `admin.js` 3.18.1 onward the
JS expects `create-reset-btn` and `autofill-status`, which exist only in the newer
HTML. Upload both or neither.

⚠️ **`contentVersion` couples two files — keep them together.** `game.js`
invalidates its 7-day chapter cache on `books/{id}.contentVersion`, and
`admin.js` **3.12.0** is the first version that has ever written it (from all
seven paths that change chapter text). Before that the field was read and never
set, so an edited chapter took up to a week to reach students, silently.
Running `game.js` 3.9.1+ against an `admin.js` below 3.12.0 brings that back
with no other symptom.

## Known constraints

- `game.js` is ~5,500 lines and does not have a test suite. Every change in
  Round 4 was verified by reading both sides of the interaction, then by hand.
- Default sprint length is **30 seconds** (`sessionValueStr = "30"`). This is the
  single most important number for understanding load — a lot of per-sprint work
  fires twenty times in a ten-minute typing block.
- `firestore.rules` and `storage.rules` are both in this repo and both must be
  pasted into the Firebase console to take effect. Nothing here deploys itself.
  Their versions are in their own header comments; this file used to name them and
  named `storage.rules` **v2.0.0**, which is the version whose `image/*` write
  requirement silently denied every EPUB cover upload.
  ⚠️ `firebase-storage.rules` was a second, contradictory copy of the Storage
  rules and is the file that caused that outage. Deleted after Round 5. If it ever
  reappears, delete it again — two copies of a security rule set is the defect,
  even while they happen to agree.
- ⚠️ `index.js` v1.6.0 and `package.json` **cannot be deployed at all** without a
  CLI. The Cloud Function actually running is the pre-1.6.0 one, which still
  exports seven abandoned custom-claims functions the security rules no longer
  consult. First person with terminal access should deploy this before anything
  else. `package.json` also moves Node 18 → 22, since 18 is no longer accepted.
- ⚠️ Del / Merge ↓ / Split in the admin staging list renumber chapters from array
  position, which flattens part-aware ids: delete one chapter from a two-part book
  and `1.01–2.09` becomes `1–22`. **Avoid those three buttons on a multi-part
  book** until that is fixed. Edit and Upload are safe.
- No automated backup of book content. `admin.html` is the only way in or out.
  Lesson content **can** now be exported (Lessons tab → Export JSON, v1.6.0);
  book content still cannot.
- Practice mode depends on Gemini free-tier quota, which Google has changed
  without notice more than once.

## Before you scale this

**Target, confirmed with Jake:** 7,000 middle schoolers in his district ÷ 3
trimesters ÷ 5 periods ≈ **467 simultaneous**, and that is deliberately
conservative — most districts run quarters and 6-8 periods. He charges nobody,
is not paid to write this, and every student past about thirty is money out of
his own paycheck. **Cost is the first priority, ahead of everything except data
that is wrong.**

Round 4 (2026-08-02) audited the whole app against that. What it found and
fixed is in `HANDOFF.md` §B; the short version:

- **`learn.js` had no caching at all** while `game.js` had accumulated a full
  layer, and `learn.js` is the page most students open daily. ~115 reads per
  load became ~3.
- **No query anywhere had a `limit()`** except the leaderboard. A building-wide
  semester report was ~126,000 reads on one click, 2.5× the daily free tier.
  There is now a 20,000-document ceiling that **refuses rather than truncates**
  — a partial report you can't tell is partial is worse than none.
- **Three things were wrong, not slow:** duplicate sprint rollups double-counting
  minutes in the reports teachers grade from; "My classes" denied outright for
  the default teacher scope; and teacher time corrections that have never once
  worked.
- **`typing_logs` was an unbounded authenticated write target** and students
  could forge their own graded minutes. Both closed in `firestore.rules` 2.2.0.

### App Check — client half live, enforcement unconfirmed

Sign-up is open to any Google account — deliberately, so students self-serve —
which meant an unvalidated write rule was an uncapped liability against a personal
card. `firestore.rules` 2.2.0 caps what a single forged document can cost;
App Check is what stops the flood arriving.

`firebase-config.js` **1.2.0** mints App Check tokens using **classic reCAPTCHA
v3**, and that is live and verified. Enforcement — Firebase console → App Check →
**APIs** → Cloud Firestore — is a separate switch and its state is **not
confirmed**. Check it before assuming you are protected.

⚠️ **Classic reCAPTCHA v3, not Enterprise.** Enterprise bills above 10,000
assessments a month and this app clears that in a week; classic has a quota that
stops evaluating rather than charging. Token TTL is 7 days because every refresh
is a billable assessment. The tell, if anyone re-keys it: classic issues a secret
key, Enterprise does not.

**Verified 2026-08-04, on a school Mac on the district network:**

| layer | result |
|---|---|
| Client mints a token | ✅ |
| District firewall / proxy | ✅ |
| Chrome enterprise policy, teacher profile | ✅ |
| **Student profile in Chrome** | ⚠️ **never tested** |

The remaining risk is filtering extensions — GoGuardian, Securly, Lightspeed are
force-installed **per profile**, so a teacher account passing does not prove a
student account will. Send any student to
**`typethatbook.misterwilson.org/appcheck.html`** and have them read the colour
back: it needs no devtools and no sign-in, which is why it exists (a managed
Chromebook has no console).

If enforcement is on and work stops saving: **App Check → APIs → Cloud Firestore →
Unenforce.** The write-ahead logs mean nothing is permanently lost, but a period's
data would not reach a report that day.

### ⚠️ Firebase Storage has its own rules, and they are not in firestore.rules

`storage.rules` (v2.0.0, in the repo, console-only) governs the `covers/` bucket.
It went undocumented for most of the project's life, and that absence caused an
outage: the old rules required a Firestore document at `admins/{email}`, a
collection nothing in the codebase referenced. It was identified as a dead fossil
by grep, deleted, and cover uploads silently failed on every book afterwards.

**The lesson generalises.** Several things consume Firestore data from outside the
codebase — Storage rules, Firestore rules, TTL policies, index definitions, App
Check settings, reCAPTCHA keys. **Grep cannot see any of them.** Before deleting a
collection, check the console too.

### Hardware assumptions

Jake's building is **MacBooks running Chrome**. Districts that adopt this may be
Chromebooks, possibly in ephemeral mode where localStorage is wiped at every
sign-out — which would defeat every cache above. That is survivable by design
(each cache falls back to a plain read) but roughly 25× more expensive, so if
another district's numbers look wrong, check that setting in their Google Admin
console before touching code.

Schools, classes, and teacher roles are built and live — see `firestore.rules`
and §4 of `HANDOFF.md`.
### Documents: what is here, and what is gone

⚠️ **The authoritative map is `HANDOFF.md` §9, and there is nothing to hunt for.**
Round 14 consolidated nine handoff documents into one and deleted the rest. Anything
citing `HANDOFF-round3.md` §10, `HANDOFF-round8.md` §4, or any other `-roundN` file is
citing something that no longer exists in this repo — and everything those files
contained that still matters is in `HANDOFF.md`.

**The rule that produced all of this, and it still stands:** if a session produces a
document, it ships in the same commit as the code. **Referencing a file that is not in
the repo is worse than not writing it** — it sends the next person, or Jake, looking for
something that was never there. That rule was broken often enough to cost an entire
evening of searching.

**Genuinely lost, long ago, and not worth chasing:**

| doc | what it was |
|---|---|
| `SETUP-NO-CLI.md` | ⚠️ **`firestore.rules` cites it by name** for granting the first `super_admin`. The one operationally real gap — and the fix is to write that paragraph into `firestore.rules`'s own header, not to go looking for the file. |
| `RULES-AUDIT.md` | An overnight audit tracing 103 Firestore ops. The three fixes it found are live in `firestore.rules`. |
| `SETUP-MULTISCHOOL.md` | No loss — obsolete, assumed a CLI. |

**Read with care:**

| doc | how |
|---|---|
| `TTL-GUIDE.md` | ✅ **as-is.** Its index table was verified against `firestore.indexes.json`, and its console steps were walked through against the live UI with Jake. |
| `SCALE-PLAN.md` | ⚠️ **header box first.** Cost model is good; Problem 4 has since shipped; its Security section's premise was false and is re-headed. |
| `CHANGELOG.md` | ⚠️ **its index is stale** — `game.js` entries stop at v3.19.1, `learn.js` at v2.2.4, and `session-log.js`, `stats-wal.js` and `hud.js` have no section at all. The file headers are the more reliable history. See `HANDOFF.md` §6. |
