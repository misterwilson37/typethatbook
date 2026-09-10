# README-games.md — the arcade games

**Round 82 (Victor).** Companion to `HANDOFF-games.md` (written for the next
Claude instance) and `INTEGRATION.md` (the seam with the rest of the repo). This
one is for anyone else, including future-Jake.

## What these are

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

## The architecture, in one screen

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

## The two side panels: the window and the console

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

## The one idea worth understanding

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

## Rulings baked in

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

## Running the tests

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

## Two lessons from this round that generalise

1. ⚠️⚠️ **A test that constructs the precondition it checks proves the code *can*
   do the thing, not that the thing *happens*.** The hunter assertion was green
   for two rounds while the hunter could not appear in an assessed run at all,
   because the test hand-set the pressure that unlocked him. Fixing it exposed a
   second bug behind the first: enemies never expired, so the unlock opened onto a
   full board.
2. ⚠️ **A one-in-forty margin is not noise.** Draft 3 of the spawn rule let one
   camper in forty survive. That looked like variance; it was a rule with a gap in
   it, found only by a 40-seed sweep. A single playtest would have called it done.
