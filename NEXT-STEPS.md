# NEXT STEPS — Round 82 (Victor), arcade games

Everything in `ttb-games-round65.zip` is **inert**. Nothing in the repo imports any
of it, so unzipping it into your tree and pushing changes **nothing** a student
sees. That is deliberate: it means you can push first and decide second.

Steps 1 and 2 are what is left for you. Steps 3 and 4 are **done** and kept as a
record.

⚠️ **IF YOU ARE HANDING THIS TO THE NEXT INSTANCE INSTEAD, give them
`INTEGRATION.md`.** It has the seam map, the three version mirrors, draft ROADMAP
and CHANGELOG entries, and the assumptions harness. This file is the do-it-yourself
path; that one is the fold-it-in path. Both work from the same drop.

---

## 1. Unzip and push (safe — no behaviour change)

The zip mirrors the repo layout. Extract at the repo root:

```
game-shell.js          →  repo root
game-names.js          →  repo root
game-draw.js           →  repo root
game-chrome.js         →  repo root
game-audio.js          →  repo root
escape-board.js        →  repo root
game-escape.js         →  repo root
game-deadline.js       →  repo root
HANDOFF-games.md       →  repo root
README-games.md        →  repo root
tests/                 →  tests/       (2 files)
(tools/game-lab.html is GONE as of Round 112 — the lab is arcade.html?lab=1)
firebase/APPROVED-game-scores.md  →  firebase/   (shape approved, NOT deployed)
```

⚠️ **Nothing is overwritten.** Every file is new, and every module is at **1.0.0**
per your 4a ruling. `keyboard.js` is now *imported*
by `game-deadline.js` but was **not modified**, so there is no version bump on it
and nothing else that imports it is affected.

⚠️ **There is no `game-missile.js` or `game-muncher.js` to delete** — I never
shipped those names to you. If earlier drafts made it into your tree from a
previous message, delete them; they are superseded by `game-deadline.js` and
`game-escape.js`.

**Register the tests** in `tests/run-all-tests.mjs`, or they are not coverage. That
file's own comment is emphatic about it ("An unregistered passing test is not
coverage"). Two entries:

Three entries — see `INTEGRATION.md` §2 for the full text, including
`game-assumptions-test.mjs`, which asserts the repo claims the games depend on and
do not own (learn.js's WPM arithmetic, the single seconds site, the insertion
point). **That is the one that protects this work from your roadmap work.**

---

## 2. Smoke test — play them (5 minutes, no JSON needed)

Open `https://<your-pages-domain>/arcade.html?lab=1`. ⚠️ THE LAB IS THE ARCADE
PAGE WITH A FLAG, NOT A SEPARATE BUILD — a bench with its own layout cannot
reproduce the page's layout bugs, which is how four rounds of them reached Jake
instead of the harness.

⚠️ **This page is publicly reachable once pushed.** It is unlinked so nobody finds
it by accident, and it is harmless if they do — no auth, no reads, no writes. But
"unlinked" is not "private". If you would rather it not be live, keep it out of the
push and tell me; I will note that in the handoff.

Press **Start**, then **Start** again on the get-ready panel. Sound is **off** —
the Sound button turns it on.

### What to check, and what "wrong" looks like

| # | Check | Pass looks like | Tell me if |
|---|---|---|---|
| 1 | **Deadline, gate 15, source "sight words"** | comfortable; you clear the quota with shields left | you die, or it feels dead slow |
| 2 | **Deadline, gate 40** | frantic but fair | the words arrive faster than you can read them |
| 3 | **Deadline, source "book prose"** | ⚠️ **watch the tubes on punctuation.** `!` should fire from the LEFT PINKY; `?` from the RIGHT PINKY; `,` right middle; `.` right ring | any punctuation fires from the wrong tube |
| 4 | **Type a wrong letter on purpose** | that finger's tube darks, a grey missile fizzles, accuracy drops | input feels blocked or laggy |
| 5 | **Escape Key, mode arcade** | ⚠️ **a HUNTER (red pulsing star) appears around round 5–7.** The round is in the HUD | no hunter by round 10 |
| 6 | **Escape Key — stand still and type nothing** | you lose all three shields in about a minute | you survive |
| 7 | **Escape Key — step onto a web** | a tear-free word appears on a plate above the board; every key still lands | keys feel eaten, or the word is the one you just typed |
| 8 | **Lead a hunter across a web** | it freezes for a few enemy steps | nothing happens |
| 9 | **Rotate an iPad mid-game** | board re-lays out, nothing off screen | anything is cropped |
| 10 | **Turn on OS "Reduce Motion", then take a hit** | a static red border, no full-screen flash | the whole screen flashes |
| 11 | **Turn Caps Lock on** | "CAPS LOCK IS ON" appears | it does not, or matching silently succeeds |
| 12 | **Pause, then Resume** | clock stops and resumes; the reported seconds do not jump | the WPM leaps after resuming |
| 13 | **Play again after game over** | a clean run; score starts at zero | any number carries over from the last run |
| 14 | **Done button** | the readout prints the report object | nothing happens |

The readout panel at the bottom prints exactly the object `learn.js` would receive.
Nothing is saved.

---

## 3. ✅ RULE 10 IS CLOSED — and the export earned its keep immediately

You sent `ttb-lessons-2026-09-08.json` (47 lessons, exporter v1.21.0). It is
committed as `tests/fixtures/lessons-export.json` and Part I now drives **110 real
runs × 9 seeds = 990 trials**.

⚠️ **THE FIRST RUN FAILED, AND IT FOUND A REAL BUG THAT 130 ASSERTIONS AGAINST
FIXTURES HAD MISSED.** Full write-up in `HANDOFF-games.md` §1e; the short version:

1. **The spawn interval used the chunk MEAN.** `u4_l1/s4` chunk 1 —
   `pink pipe pan pay ... spear spend speak pride trade plant` — starts with
   3-letter words and **ends with 6-letter words**. Mean 4.03 set a 3.23 s
   interval; a 6-letter word needs 4.8 s at a 15 WPM gate. A gate-speed typist
   accumulated a deficit through the back half and lost all three shields on
   **every seed**, while another chunk of the same step passed 9/9.
   ⚠️ **A mean only paces correctly if targets are uniform, and authored word lists
   are not — they group by length, which is good pedagogy and fatal to a mean.**
   Work now arrives at gate rate *in characters*: each target's own length prices
   the interval after it.
2. **`QUEUE_DEPTH` 3 was too tight.** Two Unit 7 graduation passages still failed,
   now seed-dependent. Raised to 4 on a corpus sweep: gate-speed failures went
   **19/990 → 1/990**, peak targets on screen stayed at **4**, and a typist at 60%
   of gate still cleared **0/550**. The buffer stopped punishing rounding error
   without letting anyone through.
3. **Part I's own assertion was wrong** — one seed cannot tell "impossible" from
   "hard", and it demanded a 100% win rate from a typist at *exactly* the gate.
   Reframed to a 9-seed sweep.

**Final: 990 trials, 1 loss (0.1%). No run systematically unclearable. Tightest is
`u7_r6/s1` at 8/9 — the longest graduation passage at the 25 WPM gate.**

⚠️ **RE-EXPORT THE FIXTURE WHENEVER YOU CHANGE LESSONS MATERIALLY.** A stale
fixture is a harness proving yesterday's corpus.

⚠️ **NOTHING IS AUTHORED WRONG.** Both findings were my code, not your lessons. No
lesson needs editing.

---

## 4. ✅ DECISIONS — ANSWERED BY JAKE, 2026-09-07, AND ALREADY APPLIED

All five are in the code and in the harnesses. Nothing below is still open.

### 4a ✅ Every module ships at **1.0.0**

Jake: *"Nothing to this moment has had a version, so I'd rather it be 1.x. Gemini
doesn't deserve to have version 1. It was version 0 at best. You upgraded it to
1.x."*

⚠️ **I EXTENDED THIS RULING BEYOND THE FILE YOU ASKED ABOUT — SAY SO IF THAT IS
WRONG.** You addressed `game-escape.js` (which had reached 2.2.0). But the same
argument voids *every* number in the drop: the shell had reached 1.2.0,
`game-draw.js` 1.1.0, `game-deadline.js` 1.2.0 — all of them my own drafts, none
ever deployed. **The version log records deploys, not drafts.** Stamping five
internal iterations into a header puts history in front of the next reader that
describes nothing they can observe. So all eight modules are **1.0.0**, and the
reasoning from those drafts is kept as prose, because the reasoning is the part
with value.

### 4b ✅ Leaderboard shape approved

Jake: *"Kids compete against themselves and then against everyone else, reducing
the number of writes."* — a better summary of the personal-best mechanic than the
one I wrote. `firebase/PROPOSED-game-scores.md` is now **`firebase/APPROVED-game-scores.md`**.

⚠️ **APPROVED IS NOT DEPLOYED.** The shape is settled; the rules *text* has still
never been executed. It has to pass `npm run test:rules` against the emulator
before it goes near the console, and that needs a Claude session, not you.

### 4c ✅ Assessed uses lesson gates; arcade uses the furthest gate reached

Jake: *"For straight practice, target wpm should be the gates that are built into
the lesson gates. For arcade, go with their rolling wpm from typethatbook."*

The assessed half was already done. ⚠️ **THE ARCADE HALF NEEDED A SOURCE AND THE
APP STORES NO ROLLING WPM** — per-run WPM only reaches `typing_logs` (a query per
arcade launch, which is the cost your WAL round drove to near-zero) and `bestWPM`
on the leaderboard doc is a *best*, not a mean. Storing a new average would be a
fourth record of a quantity the app already knows.

⭐ **So the arcade targets the `minWPM` gate of the furthest lesson the student has
reached.** It is free — `lessons` and `progress` are already in memory on both
pages, and `arcadeKeySet()` walks exactly that list to pick the arcade's letters,
so the letters and the speed now come from the same window. 15 at the start, 20
mid-course, 25 at the end of the ladder.

⚠️ **THE KNOWN COST: it lags a fast student.** A quick typist parked in Unit 1 gets
a 15 WPM arcade until they advance. `arcadeTargetWPM()` accepts an optional
`bestWPM` and raises the floor to 80% of it **only if the caller already has the
leaderboard document** — never fetched for this purpose. If that trade is wrong,
say so; the alternative is a read per launch.

### 4d ✅ Both entry points, quiet, no day gate

Jake: *"A tile on the library page (school, library, arcade) as well as an option
on the school page to practice everything they've learned so far. I wouldn't make
it too obvious, as I want school to come first."*

Recorded in `game-names.js` as `ARCADE_ENTRY` — a third tile of **equal weight**
beside School and Library (not a banner), plus a secondary option on the school
page below the lesson path. ⚠️ **`dayGated: false`, and the harness asserts it**:
you are explicitly undecided, so nothing may assume a Friday. A game that
disappears on a Tuesday reads as broken.
⚠️ **Neither surface is built** — this records the intent beside the registry so
the two cannot drift into disagreeing about what the arcade is called.

### 4e ✅ Escape Key is arcade-only; its time still counts

Jake: *"I'm leaning toward arcade for now, but time typed should still count."*

`game-names.js`: `assessed: false`, `countsTime: true`. ⚠️ **A PRODUCT DECISION,
NOT A CAPABILITY ONE** — Part B of `escape-board-test.mjs` proves a camper loses
all three shields on 40 of 40 seeds, which is what would earn it the graded path.
Flip one flag and it works.

⚠️ **AND PART B STILL MATTERS WHILE THE GRADE IS OFF, because time counts.** A
student who could stand still and bank minutes against zero characters would be
farming the daily clock. Do not read that test as dead weight.

---

## 5. The wiring work — §4 is settled, so this is the queue

In the order I would do it:

1. **Game seconds into the totals.** ⚠️ **This is the delicate one.** `learn.js`
   line ~2366 is a *single* per-second increment site, below
   `rollDayIfNeeded('tick')`, with a comment saying four counting bugs died to
   create it and that there is no subtract path and must not be one. So a game
   **cannot** bank a duration at the end — its loop has to call the same tick once
   per elapsed second, below the same midnight rollover, with the same 5-second
   floor. Anything else is a second record of a quantity that already exists
   (Rule 9) and files a midnight-straddling game under the wrong day.
2. **Deadline into the final-run slot** — the `isLastRun` fork in `finishStep()`,
   above `showLessonResultModal()`, handing it the same `(wpm, acc)` pair a typed
   run would so `recordRunOutcome()` / `saveProgress()` / `logRun()` stay the only
   writers. ⚠️ No second write path for a game result.
3. **The Rule 11 harness** — both readers driven off the same record, asserting
   they agree. This ships *with* step 2, not after it.
4. **The leaderboard**, once 4b is approved and the rules pass the emulator.
5. **Shatter.** The split mechanic needs one shell function, `splitTarget(text)`,
   with a fallback ladder: syllables → compound parts → halves → single characters.
   That is what makes it work for a Unit 1 student (`asdfjk` → `asd` + `fjk`) as
   well as a Unit 7 one (`SUPERNOVA` → `SU-PER-NO-VA`).

---

## 6. Known gaps, so nothing is a surprise

* **No touch input for gameplay.** The chrome buttons are tappable, so a student
  can start, pause and quit on a bare iPad — but the games need a keyboard to
  play. For a typing app that is arguably correct; flagging it because "the buttons
  work but the game doesn't" is a confusing state to meet cold.
* **Deadline caps at three landmarks.** A shield count above 3 wraps the landmark
  list. Fine today; a real limit if shields ever become configurable.
* **No sound assets, by design** — everything is synthesised, so there is nothing
  to upload and nothing to 404, but it will not sound like an arcade cabinet.
* **Shatter is registered in `game-names.js` and marked `unbuilt`**, so the lab
  page and any future leaderboard code can be written once. It will not appear in
  any picker until it exists.
