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
registered when it was not. ✅ **It IS registered now** (`versions.js` v1.17.0,
ROADMAP 57), read from the `INDEX_VERSION` constant rather than from a filename
comment — but the lesson stands and the command above is still the right one: a
check that over-reports is worse than no check, and this paragraph claimed the
opposite of the truth for as long as it went unread.

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

⚠️⚠️ **AND `typing_logs` NAMES NO BOOK. It cannot.** It is keyed
`{uid}_{date}` — one merged rollup **per student per DAY**, written by both page
controllers — so a child who reads two books in a period has ONE document, and
there is no single book for it to be about. The per-book id lives on
`typing_sessions`, where `session-log.js` writes it from the sprint's own label.
**This is not a subtlety; it is the fact ROADMAP 54's popularity counter got
wrong.** That feature filtered `typing_logs` on a field the collection has never
had, returned zero for all eighty books, and the library's "Most Popular" sort
therefore rendered as flawless alphabetical order for a whole round — while its
harness asserted the broken query as a requirement. **If you are about to filter
`typing_logs` on anything, `popularity-sort-test.mjs` Part E is a ratchet that
derives the real field list from the shipped writers; add your field there or
find out why it does not exist.**

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


---

## Appendix A — The arcade games — architecture and constraints

⚠️ **FOLDED IN FROM `README-games.md` IN ROUND 114 (Carriage).** Jake, 2026-09-10: *"I'd
much rather you clean up the documentation that's there so that there's one readme
and one handoff."* ⭐ **ONE README MEANS ONE README.** Appended verbatim rather
than summarised; only heading levels are shifted.
⚠️ **DO NOT CREATE `README-<anything>.md` AGAIN** — a new area of the project gets
an appendix here.

**Round 82 (Victor).** Companion to `HANDOFF-games.md` (written for the next
Claude instance) and `INTEGRATION.md` (the seam with the rest of the repo). This
one is for anyone else, including future-Jake.

#### What these are

Typing games that replace the final run of a lesson (assessed) or run endlessly
from whatever keys a student has unlocked (arcade). Two of three are built.

| id (frozen) | title | file | state |
|---|---|---|---|
| `deadline` | **Deadline** | `game-deadline.js` | built — **assessed** |
| `escape` | **Escape Key** | `game-escape.js` | built — **arcade-only** |
| `shatter` | **Shatter** | `game-shatter.js` | ✅ built (Round 103) — arcade only |

⚠️ **WHERE THE WORDS COME FROM (Round 104).** `arcade-pool.js` chooses per level:
real `word-banks.js` words when the level's key set can supply at least 24 of them
with at least 5 distinct first characters, letter groups otherwise. The home row
spells four bank words in total, so the early units correctly get letter groups —
**that is the right answer there, not a fallback that failed.** Escape Key
consumes it through `escape-board.js`'s `poolFor(round)`, so words lengthen as
rounds advance. ⚠️ **Shatter does NOT use it yet** — see `HANDOFF.md` §4 item 2.

**Every game's time counts toward the student's totals.** Only Deadline produces a
grade. Escape Key is arcade-only by Jake's ruling (2026-09-07) — ⚠️ a product
decision, not a capability one: `escape-board-test.mjs` Part B proves a camper
loses, so flipping `assessed` in `game-names.js` is all it would take.

⚠️ **The ids are frozen Firestore values; the titles are not.** `game-names.js`
holds both, which is why a rename is one line rather than a schema migration.

#### The architecture, in one screen

```
game-shell.js      THE NUMBERS.  Timing, WPM, accuracy, quota, score, pressure.
                                 Pure — no DOM, no clock of its own, no random.
escape-board.js    THE RULES.    Escape Key's grid, enemies, keystroke matching.
                                 Pure. Deadline has no equivalent; it needs none.
game-escape.js     THE PIXELS.   Renders a board. Owns no numbers, no rules.
game-deadline.js   THE PIXELS.
game-draw.js       Canvas helpers, reduced-motion, Caps Lock warning.
                   Also the two side panels and the seven-segment readouts.
game-chrome.js     Get-ready, pause, quit, restart, mute. DOM, so it is tappable.
game-audio.js      Synthesised sound. Muted by default.
game-names.js      Frozen ids <-> display titles.
```

⚠️ **THE SPLIT IS THE POINT.** Every quantity that decides whether a child passes
lives in `game-shell.js` and nowhere else. A view that grows a `speed +=` line or
a WPM calculation has reintroduced the defect the whole structure prevents — and
that was the shape all three prototypes had, with three copies of the timing rule
drifting apart.

#### The two side panels: the window and the console

The arcade page is three sibling canvases — **never one wide canvas with an inset
playfield**, because every lane position and dome measurement in `game-deadline.js`
is derived from the play canvas's own width.

* **Left — the RADAR.** Read-ahead only. Clean stroked pale-green arcs at three
  named depths (`DOME`, `MIDWAY`, `SCREEN`) plus a band above the screen ring
  holding the word that has not spawned yet, so there is something inbound even
  during the countdown. A contact is drawn at one fixed strength from the frame it
  appears to the frame it dies.
* **Left, beneath it — the THREAT BOARD.** Which landmark is SHIELDED, EXPOSED or
  LOST, with one lamp per standing shield and the spent ones still drawn. This is
  the fact the Escape key's whole tactical choice depends on.
* **Right — the CONSOLE.** Segmented ring-and-bar gauges for WPM and accuracy with
  the gate marked in stoplight colours, a drawn seven-segment clock (which is also
  where the countdown appears), the shield count, the run quota, the banked totals,
  and the control buttons.

⚠️ **THE STYLE SPLIT IS DELIBERATE AND IS NOT TWO STYLES BY ACCIDENT.** The left
panel is a window you look *through*; the right card is the console you are
sitting at. Chunky lattices and lamps belong to the console. Round 97 applied
them everywhere and Round 99 gave them a boundary.

⚠️ **NEITHER PANEL IS AN INPUT SURFACE.** A student may not type off the radar —
that would make the city, the shields and the six-lives overlap decorative, which
is most of the game. Hollow pip means "not yet"; solid means "in the sky".

⚠️ **NO SWEEPING LINE, EVER.** A rotating bright line across a 200px panel is a
periodic large-area flash in front of thirty twelve-year-olds. `RADAR_SWEEP` exists
as a `false` constant so anyone reaching for one finds the reason first.

⚠️ **THE FLANKS TRACK THE STAGE; THEY DO NOT CARRY FIXED HEIGHTS.** `#stage` is
`78vh`, so a `px` height on a flank is bare space at one window size and an
overflow at another — Round 99 shipped exactly that and Round 100 measured it
(236px bare at 900px of viewport, 470px at 1200px, a 38px overflow at 700px).
The cards stretch and the canvases flex. ⚠️ **But a flexing canvas keeps its
`min-height`**: `fitCanvas()` reads `getBoundingClientRect()`, and no definite
basis means a zero-sized buffer on the first frame and a blank panel until a
resize.

⚠️ **THE TEST FOR ANYTHING ADDED TO A FLANK IS "CAN A STUDENT ACT ON IT."**
Decorative lamps fail the brief and are worse than bare space: a child who learns
the lights mean nothing stops reading the panel that also carries the gate.

⚠️ **THE PANELS OWN NO NUMBERS.** Every figure comes off `GameDirector.report()`,
including the gates — arcade substitutes a rolling WPM for a fixed gate, so a panel
reading `cfg.targetWPM` would paint an arcade run red against a number nothing
enforces.

#### The one idea worth understanding

**Speed is not the difficulty knob. Throughput is.**

```
WPM = chars per second × 12
```

So a 15 WPM gate is 1.25 chars/sec. What forces a student to sustain that is **how
often work arrives**, not how fast anything moves on screen. Pixel velocity is
derived from `distance / lifetime`, which is why the same mission plays identically
on a 60 Hz Chromebook and a 120 Hz iPad.

Two knobs:

* `spawnIntervalMs()` — the push rate. At pressure 1.0, work arrives at exactly
  gate rate.
* `travelMs()` — the buffer. A target lives `queueDepth` intervals, so a student
  who falls momentarily behind can catch up.

⚠️⚠️ **PRESSURE MUST NEVER GO BELOW 1.0.** The clock is wall-clock, so waiting for
the next spawn is charged to the student — a push rate under the gate *caps* the
achievable WPM under the gate and fails everybody. The first draft used 0.75 and
scored perfect play at 11.3 WPM against a 15 gate. Headroom comes from target
lifetime and shields, never from spawn rate. `game-shell-test.mjs` Part A pins the
arithmetic.

⚠️ **AND THE INTERVAL IS A MAXIMUM WAIT, NOT A METRONOME.** If fewer than
`MIN_ON_SCREEN` targets are alive, the next spawns at once. Without that,
pressure 1.0 caps *every* student at exactly the gate: a 30 WPM child reads 15 and
can never earn an A🔥.

**The same arithmetic runs both game families.** `enemyStepMs` is an *alias* of
`spawnIntervalMs`, not a copy: a push game asks "how often does a target arrive",
a lane game asks "how fast does an enemy walk", and both are "how long does one
target take at this gate". 3,200 ms either way at a 15 WPM gate and 4-char groups.

#### Rulings baked in

* **A leak is not an accuracy error.** It costs a shield and the seconds spent not
  typing, which lands as a speed miss. Charging it twice would punish the careful
  slow typist in a second currency. ⚠️ Do not add the remaining characters to
  `mistakes`.
* **An unmatched keystroke *is* an error.** All three prototypes discarded keys
  that hit nothing, so a masher held 100% accuracy indefinitely.
* **Wall clock, no idle subtraction.** Dead air between spawns is the game's own
  and is charged. An idle-aware clock would report 45 WPM for a student producing
  15. A hidden tab and a deliberate pause are the only stops.
* **Case-sensitive**, like the drills. Capitals need Shift.
* **The word source is the run's own text**, re-cut into targets — key-set correct
  by construction, already through `drill-filter.js`. Arcade generates from the
  union of keys unlocked so far, also through the filter.
* **The finger map comes from `keyboard.js`**, never a local copy. A student who
  learned that yellow is the right index finger must not meet a game where it is
  not.
* **Space-bar forgiveness, ~19%, one-directional.** A game does not charge the
  delimiter, so the same text is worth fewer characters than in the drill. Accepted
  **only because it is forgiving** — a game is never harder than the drill at the
  same gate, and Part E asserts that direction.
* ⚠️ **The spawn interval is priced from each target's own length, never from the
  chunk mean.** Authored word lists group by length, so a chunk that ends with its
  long words buries a gate-speed typist if paced by a mean. Found by Rule 10
  against the real corpus and by nothing else.
* **Assessed runs target the lesson's own gates; the arcade targets the `minWPM`
  gate of the furthest lesson reached.** ⚠️ The app stores no rolling WPM, and
  inventing one would be a fourth record of a quantity it already knows. The
  furthest-gate answer is free: `arcadeKeySet()` already walks that list, so the
  arcade's letters and its speed come from the same window. An optional `bestWPM`
  raises the floor to 80% **only if the caller already has it** — never fetched.
* **Escape Key's hunter unlocks on the ROUND, not on pressure.** Pressure answers
  "how hard"; rounds answer "how far in". Round 5, and the first one is guaranteed
  rather than rolled for.
* **Enemies expire and walk off.** Without a lifetime the board fills in round 1
  and no later-unlocked creature can ever get a slot.
* **Sound off by default**, remembered per browser. Thirty iPads in a 44-minute
  rotation.
* **No full-screen flashes.** Edge vignette, transparent at the centre, degrading
  to a static border under `prefers-reduced-motion`.

#### Running the tests

```
node tests/game-shell-test.mjs        # 95 — the timing rule + the real corpus
node tests/escape-board-test.mjs      # 39 — the camper, the hunter, the webs
node tests/game-assumptions-test.mjs  # 59 — the seam with the rest of the repo
```

✅ **Rule 10 is CLOSED.** `tests/fixtures/lessons-export.json` holds the real
corpus (47 lessons, exported 2026-09-08), and Part I drives 110 authored runs × 9
seeds = 990 trials at each run's own gate. Current result: **1 loss in 990**, no
run systematically unclearable, and a typist at 60% of gate clears **nothing**.
⚠️ **Re-export the fixture when the lesson corpus changes materially** — a stale
fixture proves yesterday's corpus.

#### Two lessons from this round that generalise

1. ⚠️⚠️ **A test that constructs the precondition it checks proves the code *can*
   do the thing, not that the thing *happens*.** The hunter assertion was green
   for two rounds while the hunter could not appear in an assessed run at all,
   because the test hand-set the pressure that unlocked him. Fixing it exposed a
   second bug behind the first: enemies never expired, so the unlock opened onto a
   full board.
2. ⚠️ **A one-in-forty margin is not noise.** Draft 3 of the spawn rule let one
   camper in forty survive. That looked like variance; it was a rule with a gap in
   it, found only by a 40-seed sweep. A single playtest would have called it done.


---

## Appendix B — Round 114 — rebuilding the arcade page fixes from scratch

⚠️ **FOLDED IN FROM `README-round114.md` IN ROUND 114 (Carriage).** Jake, 2026-09-10: *"I'd
much rather you clean up the documentation that's there so that there's one readme
and one handoff."* ⭐ **ONE README MEANS ONE README.** Appended verbatim rather
than summarised; only heading levels are shifted.
⚠️ **DO NOT CREATE `README-<anything>.md` AGAIN** — a new area of the project gets
an appendix here.

For Jake and future-Jake. Round 114 (Carriage), 2026-09-10. Everything here is
`arcade.html` and its three modules; nothing touches Firestore, the grade path or
student data.

**Deploy stamp to expect: `arcade v3.14.0`** in the badge at the top right of the
arcade page. Read it before reporting a bug against this round.

---

#### What was broken, in one line each

1. **Deadline had no console in arcade mode.** The page handed side canvases to
   Escape Key and Shatter and forgot Deadline. The panels themselves were fine.
2. **Shatter was missing from the dropdown.** One stale `unbuilt: true` flag in
   the registry, eleven rounds after the game was finished.
3. **A blank 104px box below the monster queue.** The threat board is Deadline's
   only, and its canvas sat empty on the other two games.
4. **"— just for fun" on two of three games.** Nothing on this page is saved, so
   the label sorted games into serious and unserious for no reason.

Plus two found in the once-over: the `<h1>` always said DEADLINE, and the note
under the frame claimed your typing time isn't counted, which stopped being true
in Round 102.

---

#### The files, and the one idea behind the changes

Eight files. Four ship to the site, four are harnesses.

| file | version | ships? |
|---|---|---|
| `arcade.html` | 3.14.0 | yes |
| `game-names.js` | 1.2.0 | yes |
| `game-escape.js` | 2.2.0 | yes |
| `game-draw.js` | 1.12.0 | yes |
| `tests/arcade-panels-test.mjs` | 1.4.0 | no |
| `tests/arcade-versions-test.mjs` | 1.1.0 | no |
| `tests/game-assumptions-test.mjs` | 1.1.0 | no |
| `tests/undefined-calls-test.mjs` | 1.4.0 | no |

**The one idea:** three of the four bugs were *the same quantity written down in
two places*, where the second copy went stale somewhere nothing could check it.

* The console wiring was written twice — once per launch path — and the
  free-play copy forgot a game.
* The wave-queue row count was written twice — once in the view, once in the
  drawing code — and agreed only by luck.
* Shatter's built-or-not status was written twice — once in the registry, once in
  a test asserting the registry — so the test defended the stale copy.

Every fix collapses the pair to one record. That is Rule 9 applied to something
other than a Firestore field.

---

#### To rebuild it

##### 1. `game-names.js` — make the wiring a value

Delete `unbuilt: true` from the `shatter` entry. Add a `panels` field to all
three games describing the option name their view accepts for the left panel, and
whether they have a threat board:

```js
escape:   panels: { left: 'previewCanvas', threat: false }
deadline: panels: { left: 'radarCanvas',   threat: true  }
shatter:  panels: { left: 'panelCanvas',   threat: false }
```

Add two exported functions. `panelOptionsFor(id, els)` returns the options object
to spread into a view's `mount()`; `usesThreatBoard(id)` reads the same `threat`
flag.

Three rules on that function, all load-bearing:

* **It touches no DOM API.** Elements arrive as plain values, which is the only
  reason a harness can call it. This is the whole point of extracting it.
* **A missing element yields a missing key, never `undefined`.** The views test
  `opts.gaugeCanvas || null`, so an explicit `undefined` works today and hides a
  genuinely missing element tomorrow.
* **An unknown id returns `{}`.** A game this build has never heard of gets no
  canvases rather than Deadline's.

##### 2. `arcade.html` — delegate to it

Both launch paths (`play()` for lesson runs, `playFree()` for arcade) replace
their hand-written option lists with `...panelOptionsFor(id, PANEL_ELS())`.
`PANEL_ELS()` is a function, not a constant, because `#stageWrap` is hidden until
a game mounts and because `minutes` must stay a getter so BANKED climbs during
play rather than freezing at press-play.

Then:

* `showThreatBoard(on)` toggles `.no-threat` on `#radar-col`; CSS hides
  `#threat-canvas` with `display:none`. Call it from both paths with
  `usesThreatBoard(...)` — never with an id comparison of its own, or the page
  gets a second opinion about which games have a threat board.
* `fillGames()` labels options with `titleOf(id)` and nothing else.
* `applyPageChrome()` sets the `<h1>`, `document.title` and the blurb from the
  chosen game. Call it from `applyGameMode()`, **not** from the game dropdown's
  own listener — the blurb depends on `isFreePlay()`, which the WORDS row can
  change without the game changing.
* `savedNote()` returns the one sentence about what is kept, and both gate panels
  call it. Delete the claim from the paragraph under the frame entirely.
* Add `game-names.js` to the build panel. It stopped being a list of strings; a
  wrong answer in `panelOptionsFor()` is a blank panel with no error, so its
  version has to be readable from a classroom.

##### 3. `game-draw.js` — one row count, derived

In `drawWavePreview()`, delete the `slice(0, 4)` at the top. Compute the budget
once, and slice to what fits:

```js
const ROW_MIN = 48;
const budget  = H - top - pad - tipH;
const room    = Math.max(1, Math.floor(budget / ROW_MIN));
const waves   = (o.waves || []).slice(0, room);
const rowH    = Math.max(ROW_MIN, budget / waves.length);
```

The floor and the budget must be the same two numbers `rowH` uses, or the panel
draws a row it has already decided it has no room for. `tipH` is still reserved
**before** the rows are sized — that is Round 112's fix and it stays.

##### 4. `game-escape.js` — offer a fifth

`board.upcoming(4)` becomes `board.upcoming(5)`. This only shows up because the
threat box beside it is collapsed; without step 2 there is no height to spend.

---

#### How it was checked

`node tests/arcade-panels-test.mjs` — 211 assertions. Part I is the new one and
it calls `panelOptionsFor()` for every game rather than reading source text.

**Why that matters:** Part I's first draft counted `gaugeCanvas:` in the page
source. I then put the original bug back — moved the shared options inside the
`shatter` branch, exactly as it shipped — and all 185 assertions passed. The
count stayed at one; it had only moved inside a conditional, which was the whole
bug. A search over text cannot see which branch runs.

So each fix was re-broken deliberately, seven ways, and every one now turns the
suite red:

| put back | assertions that fail |
|---|---|
| Deadline loses its console | 3 |
| page hand-rolls the wiring | 4 |
| Escape Key claims a threat board | 2 |
| two names for one left panel | 2 |
| absent element gives `undefined` | 3 |
| panel's literal row count of 4 | 6 |
| view offers four creatures | 1 |

`drawWavePreview()` had no tests at all before this round. It now draws 5 rows at
full height, degrades to 1 at 200px, keeps the extra-life tip throughout, and
stays inside its canvas at six different heights. The old literal overflowed to
207px inside a 200px box.

`tests/undefined-calls-test.mjs` gained `arcade.html`, which had never been in its
list — about 1,300 lines of inline script, the largest in the repo after
`index.html`. A misspelled identifier there now reports with a line number.

`tests/arcade-versions-test.mjs` now pins `arcade.html`'s header against
`ARCADE_PAGE_VERSION`. They read 3.7.0 and 3.13.0 respectively — twelve rounds
apart. Round 98 found the same drift, fixed it by hand, and wrote the gap into a
comment rather than closing it.

---

#### Two things to know before the next round

**Run `npm install` first.** The full suite reports 10 failures of 97 on a fresh
container and 1 after installing. Nine of them are just absent `devDependencies`
(`acorn`, `acorn-walk`, `jsdom`, `@xmldom/xmldom`, `jszip`) and look identical to
nine broken harnesses. Also: `npm install` rewrites `package.json` — it bumps the
dependency ranges and un-escapes the unicode in the `//` comment blocks. Revert it
before delivering. This round ships it byte-identical to the upload.

**`guest-merge-test.mjs` fails, and it is not mine.** Seven assertions, Part D
only, all cascading from one that finds zero stored records while Parts A–C pass.
It probably means the harness's setup went stale, but it touches student time
merging, so it deserves its own round rather than a guess. Left alone on purpose.
