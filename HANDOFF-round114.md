# HANDOFF-round114.md — the arcade page, and a harness that defended a bug

**Round 114 (Carriage), 2026-09-10.** Instance name: **Carriage**, as in carriage
return, continuing the typewriter series. Checked against `CHANGELOG.md`,
`HANDOFF.md`, `HANDOFF-games.md` and `ROADMAP.md` — no hits. Not a duplicate of
Victor (Round 82), Franklin (99–100), Wellington (101) or Bar-Let (103–113).

⚠️ **Read `HANDOFF.md` then `HANDOFF-games.md` first.** This covers one round on
`arcade.html` and assumes the standing rules and §5's invariants.

⭐ **EXPECTED BUILD STAMP AFTER DEPLOY: `arcade v3.14.0`.** Round 113's ruling —
every delivery states the version to expect, every bug report starts by reading
it. If the badge says 3.13.0, the files are not applied and nothing below is
being tested.

---

## 0. State

| file | version | what changed |
|---|---|---|
| `arcade.html` | **3.14.0** | Deadline's console on the free-play path; `PANEL_ELS()`; `showThreatBoard()`; picker label; title/blurb track the game; `savedNote()`; `game-names.js` added to the build panel |
| `game-names.js` | **1.2.0** | `unbuilt` cleared on Shatter; ⭐ `panelOptionsFor()` and `usesThreatBoard()` — the console wiring as a value |
| `game-escape.js` | **2.2.0** | `upcoming(5)` — a fifth creature in the queue |
| `game-draw.js` | **1.12.0** | `drawWavePreview()` derives its row count from height |
| `tests/arcade-panels-test.mjs` | **1.4.0** | Part I, 211 assertions, mutation-verified 7 ways; `stripHtml()` |
| `tests/arcade-versions-test.mjs` | **1.1.0** | pins `arcade.html`'s own two halves |
| `tests/game-assumptions-test.mjs` | **1.1.0** | the `unbuilt` assertion is derived from disk, not asserted as a literal |
| `tests/undefined-calls-test.mjs` | **1.4.0** | `arcade.html`, `learn2.html`, `school-audit.html` join `HTML_FILES` |

`package.json` is **byte-identical to the upload** — see §5.

---

## 1. ⚠️⚠️ THE DEFECT IN THIS ROUND'S OWN HARNESS, WHICH IS THE THING TO READ

Jake reported three faults. Fixing them was straightforward. **Proving the first
one fixed took two attempts, and the first attempt passed its own mutation test
while the bug was still in place.**

The bug: `playFree()` in `arcade.html` listed a spread of console options for
`shatter` and a spread for `escape` and **nothing for `deadline`**, so a
free-play Deadline run received no canvases at all. The panels were never
missing — `drawRadar()`, `drawThreatBoard()` and `drawGauges()` have had 141
assertions behind them since Round 99. Nothing called them.

⚠️ **AND NOTHING REPORTED A FAULT, BECAUSE AN ABSENT OPTION IS A LEGAL OPTION.**
Every panel in all three views is absent-safe by design, for `learn.js`'s
benefit. ⭐ **THE FAILURE MODE OF AN ABSENT-SAFE CONTRACT IS A BLANK PANEL AND A
GREEN SUITE.**

### The first harness, and why it was worthless

Part I's first draft asserted that `playFree()`'s source contained `barHost:` and
`gaugeCanvas:` exactly once apiece. Then I reinstated the exact shipped defect —
moved the shared options back inside the `shatter` spread — and **all 185
assertions passed.** The mutation kept each count at one. It only moved them
inside a conditional, which is the entire bug.

⚠️⚠️ **THE PROPERTY BEING CHECKED WAS "WHICH GAMES RECEIVE A CONSOLE", WHICH IS
CONTROL FLOW, AND A REGEX OVER SOURCE TEXT CANNOT SEE CONTROL FLOW.**

⭐ **THIS IS THE FIFTH BADLY-AIMED ASSERTION IN THIS FILE'S HISTORY AND THE ONLY
DANGEROUS ONE.** `escape-board` Part B measured the wrong span, the hunter test
asserted a mechanism instead of its reachability, `game-shell` Part I ran one
seed, and Part J's first assertion demanded a wrong answer. **Every one of those
went RED on correct code, which is loud.** This one went **GREEN on broken code**,
which is silent, and it would have shipped a false claim of coverage.

### The fix that made it testable

The wiring was an object literal inside `arcade.html`, which imports
`firebase-config.js` — so no harness could import it and a regex was the only
tool available. ⭐ **SO THE DECISION MOVED INTO `panelOptionsFor()` IN
`game-names.js`, A PURE FUNCTION OVER THE REGISTRY.** Part I now calls it for
every id in `GAME_ORDER` and asserts a returned object.

⚠️ **THIS IS THE SAME MOVE `escape-board.js` MADE** before the camper bug was
testable: extract the decision, then it can be driven. When something cannot be
tested, that is a fact about the shape of the code, not about the harness.

⚠️ **`panelOptionsFor()` MAY NEVER TOUCH A DOM API.** Elements arrive as plain
values. A `document.getElementById` in it undoes the whole point.

⚠️ **AND BOTH LAUNCH PATHS CALL IT.** They used to spell the same four options
separately — two records of one wiring decision, and the free-play copy was the
one missing a game. Part I asserts that **neither path names a canvas option
itself**, which is the strongest available form: an absence.

Mutation-verified seven ways, all red:

| mutation | caught by |
|---|---|
| Deadline loses barHost/gauge/minutes | 3 assertions |
| page hand-rolls the wiring again | 4 |
| Escape Key wrongly claims a threat board | 2 |
| two aliases for one left-panel box | 2 |
| absent element yields an explicit `undefined` | 3 |
| panel reinstates its literal row count of 4 | 6 |
| view goes back to offering four creatures | 1 |

---

## 2. ⚠️⚠️ A GREEN ASSERTION THAT KEPT A FINISHED GAME UNREACHABLE FOR ELEVEN ROUNDS

Jake: *"Shatter is theoretically made, but not available in the game drop down."*

`game-names.js` still carried `unbuilt: true` on `shatter` with a comment reading
"NOT BUILT YET". Round 103 built the view; Rounds 106 and 109 took it to v1.2.0
**with both side panels already wired.** `fillGames()` skips any game carrying the
flag, so the option was simply absent — no error, nothing to notice.

⚠️⚠️ **AND `game-assumptions-test.mjs` WAS DEFENDING IT.** Line 333 read
`ok(GAMES.shatter.unbuilt === true, 'Shatter is flagged unbuilt so no picker
offers it')`. True in Round 82. False from Round 103. **Green the whole time.**

⭐ **THE FAULT IS THE SHAPE OF THE ASSERTION, NOT THE VALUE IN IT.** It pinned a
fact about the **world** ("this game does not exist") as though it were a fact
about the **design** ("this game must not be offered"). Facts about the world go
stale on their own; the harness then holds the stale one in place and reports
success for doing so.

⭐ **SO IT IS NOW DERIVED FROM DISK**: for every id in `GAME_ORDER`, the view file
either exists or it does not, and `unbuilt` must agree. It needs no editing when a
fourth game arrives, and it goes red either way round.

⚠️ **THE LESSON GENERALISES AND IS THE MOST PORTABLE THING IN THIS ROUND: AN
ASSERTION WHOSE SUBJECT IS A FACT ABOUT THE WORLD MUST DERIVE THAT FACT, NEVER
RESTATE IT.**

---

## 3. The other two reported faults

### The dead space below the monster queue

Jake: *"There's also dead space below the incoming monsters row."* That space was
`#threat-canvas` — a fixed **104px** canvas only Deadline is handed — sitting
empty below the radar on the other two games. A fixed height reserving room for a
panel that was never going to arrive.

* `#radar-col.no-threat #threat-canvas { display: none; }`, toggled by
  `showThreatBoard()`, whose argument comes from `usesThreatBoard()` — ⭐ **the
  same registry flag that decides whether `threatCanvas` is passed**, so the page
  cannot reveal a box it passed no canvas for.
* ⚠️ **`display:none`, NOT A ZERO HEIGHT.** `fitCanvas()` measures
  `getBoundingClientRect()`; a 0px canvas is a live element whose draws all
  resolve to nothing — a blank panel that costs frames rather than an absent one.
* ⭐ **AND THE RECLAIMED HEIGHT PAYS FOR THE FIFTH CREATURE** Jake asked for, so
  the extra row is funded by the fix rather than taken from the extra-life tip.

⚠️⚠️ **AND THE ROW COUNT WAS IN TWO FILES.** `drawWavePreview()` sliced to a
literal `4` while `game-escape.js` called `upcoming(4)` — agreeing by luck.
Raising the view to 5 alone would have changed **nothing on screen**, and would
have read as a deploy that did not take, which is precisely Round 113's finding
wearing a different hat. ⭐ **THE VIEW NOW SAYS HOW MANY IT CAN OFFER; THE PANEL
SAYS HOW MANY FIT**, derived from the same height budget `rowH` uses.

⚠️ That also fixed a real overflow the literal was causing: at a 200px panel the
old code drew to **207px inside a 200px canvas** and dropped the tip via a guard
that had already been overrun. `drawWavePreview()` had **no assertions at all**
before this round, which is why.

### The picker label

Jake: *"take 'Play for fun!' off of Escape Key. On this panel, they're all for
fun."* The suffix came from `assessed`, which is a **capability** flag meaning
"this game CAN carry a grade" — and nothing on this page carries one.

⚠️ **DO NOT DERIVE A LABEL FROM `assessed` AGAIN.** When the `learn.js` wiring
lands, what changes is whether a **run** is graded — a per-run fact
`isFreePlay()` already computes — not a permanent property of a title.

---

## 4. Two changes Jake did not ask for, offered for veto

Both are real defects found in the once-over. **Neither was requested.**

1. **The `<h1>` always read `DEADLINE`.** True while Deadline was the only game;
   a lie from Round 103. A student playing Escape Key read ESCAPE KEY in the
   dropdown and DEADLINE under the frame. Now `titleOf(g.id)`, so a rename stays
   the one line `game-names.js` exists to make it.

2. ⚠️⚠️ **THE STANDING NOTE SAID SOMETHING FALSE ABOUT BANKED TIME.** It read
   *"your time, score and grade don't count toward your lessons"* — but
   `bankSecond()` and `flushArcadeSeconds()` write arcade seconds into
   `typing_logs` **and the ledger**, so the time has counted since Round 102.
   ⭐ **AND THE PAGE CONTRADICTED ITSELF:** the gates panel already said the
   opposite, on the same screen. Two records of one claim, disagreeing — Rule 9,
   in the copy rather than in the code.

   ⚠️ **RESOLVED BY DELETING THE FALSE COPY, NOT CORRECTING IT.** `savedNote()` is
   the one writer and **both** gate panels call it — the lesson path never carried
   any such line at all, and a student playing a graded run is the one most likely
   to assume the result counts. ⚠️ **WHEN THE WIRING LANDS, `savedNote()` IS THE
   THING TO EDIT, AND IT MUST STAY THE ONLY THING.**

---

## 5. ⚠️ Environment, and the nine failures that were never failures

The full suite reported **10 failing of 93** on the pristine upload. ⭐ **NINE OF
THEM WERE A MISSING `npm install`** — `acorn`, `acorn-walk`, `jsdom`,
`@xmldom/xmldom`, `jszip` are all declared in `devDependencies` and none were
present. After installing: **1 failing of 93.**

⚠️⚠️ **RUN `npm install` BEFORE BELIEVING A FAILURE COUNT.** Jake has no CLI
(HANDOFF B.4, browser-only deploys), so a Claude instance is the only thing that
ever runs these, and a fresh container starts with no `node_modules`. Nine
harnesses reporting `ERR_MODULE_NOT_FOUND` look exactly like nine broken
harnesses.

⚠️ **`package.json` IS SHIPPED BYTE-IDENTICAL TO THE UPLOAD AND WAS DELIBERATELY
REVERTED.** `npm install` rewrote it twice over: it bumped every devDependency
range (`^8.11.0` → `^8.18.0` and so on) and **un-escaped the unicode in the `//`
comment arrays**, turning `\u26a0\u26a0` into literal `⚠⚠`. Neither is this
round's change to make, and the second would have produced a large meaningless
diff across documentation blocks. ⚠️ **CHECK `package.json` AGAINST THE UPLOAD
BEFORE DELIVERING, ANY ROUND THAT RUNS npm.**

### ⚠️ The one real pre-existing failure, NOT fixed and NOT diagnosed

`guest-merge-test.mjs` — **7 assertions, Part D only.** All cascade from D1 (*"the
guest slot holds both records — got 0, want 2"*), and Parts A–C pass **including**
*"a guest's records are kept, and handed over"*. That pattern points at stale
harness setup rather than a live merge bug, **but I did not confirm it and it must
not be assumed.**

⚠️ **IT TOUCHES STUDENT TIME, WHICH IS RULE 11 TERRITORY, SO IT DESERVES ITS OWN
ROUND RATHER THAN A GUESS AT THE END OF THIS ONE.** Jake's bug-report rule cuts
both ways: stop speculating after one or two files. Flagged, untouched.

---

## 6. Run it

```
npm install                              # ⚠️ FIRST. Nine harnesses depend on it
node tests/arcade-panels-test.mjs        # 211 — the panels, RUN not read; Part I
node tests/game-assumptions-test.mjs     #  62 — the seam; the derived unbuilt flag
node tests/arcade-versions-test.mjs      #  39 — both halves of every stamp
node tests/undefined-calls-test.mjs      #  23 files, arcade.html now among them
node tests/run-all-tests.mjs             # 1 failing of 93 (§5)
```

Play it: push the files and open `/arcade.html`. Confirm `arcade v3.14.0` in the
badge **before** reporting anything. `?lab=1` adds the gate override.

---

## 7. Not done

* **Rule 11 remains untested for the games**, because nothing is wired to
  `learn.js` yet. Unchanged by this round.
* **`guest-merge-test.mjs` Part D** — §5.
* **`docs-vs-repo-test.mjs` still passes vacuously for the arcade** — Round 113's
  finding. None of the arcade modules are in `versions.js`'s registry, so all
  twelve report "no readable version stamp; skipped". ⚠️ This round added
  `game-names.js` to the arcade's own build panel, which is a different surface
  and does **not** close that gap.
* **`CHANGELOG.md` / `ROADMAP.md` entries** are drafted separately for pasting;
  I did not edit those two files.
