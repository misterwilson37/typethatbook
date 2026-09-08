# HANDOFF-games.md — the arcade views

**Round 82 (Victor), 2026-09-07.** Instance name: **Victor**, an 1889 typewriter,
following the round series. Not a duplicate of any name in `CHANGELOG.md`,
`HANDOFF.md` or `ROADMAP.md` as of Round 81.

⚠️ **THIS WORK WAS STAMPED "ROUND 65" THROUGH MOST OF ITS CONSTRUCTION AND THAT
WAS WRONG.** The number came from grepping `Round N (Name)` across the docs, which
picks up ROADMAP *prose* references to closed items rather than the `## Round N`
heading at the head of `CHANGELOG.md` — the only reliable answer. Corrected
throughout; a stray 65 anywhere is a straggler.

⚠️ **READ `INTEGRATION.md` FIRST IF YOU ARE FOLDING THIS INTO OTHER WORK.** It
covers the seam — what touches what, the three version mirrors, the draft ROADMAP
and CHANGELOG entries, and `tests/game-assumptions-test.mjs`, which turns every
assumption this round made about the repo into an executable check.

⚠️ **Read `HANDOFF.md` first.** This document covers only the arcade games and
assumes the standing rules, the deploy table and §5's invariants.

---

## 0. State

| file | version | status |
|---|---|---|
| `game-shell.js` | 1.0.0 | **new.** Pure. All game timing/scoring math |
| `game-names.js` | 1.0.0 | **new.** Frozen ids ↔ titles, assessed/time flags, entry points |
| `game-draw.js` | 1.0.0 | **new.** Canvas helpers + reduced-motion + Caps Lock |
| `game-chrome.js` | 1.0.0 | **new.** Get-ready, pause, quit, restart, mute (DOM) |
| `game-audio.js` | 1.0.0 | **new.** Synthesised sound, muted by default |
| `escape-board.js` | 1.0.0 | **new.** Pure. Escape Key's grid, enemies, key rules |
| `game-escape.js` | 1.0.0 | **new.** Escape Key view |
| `game-deadline.js` | 1.0.0 | **new.** Deadline view |
| `tests/game-shell-test.mjs` | 1.2.0 | **new.** 91 assertions, green |
| `tests/escape-board-test.mjs` | 1.2.0 | **new.** 39 assertions, green |
| `tests/game-assumptions-test.mjs` | 1.0.0 | **new.** 59 assertions, green — the seam |
| `tools/game-lab.html` | 1.3.0 | **new. NOT DEPLOYED.** Play bench, both games |

⚠️ **`keyboard.js` IS NOW IMPORTED BY `game-deadline.js`** and was not touched.
It is the source of truth for the finger map and the finger colours; see §1c.

⚠️ **DELETE `game-missile.js` AND `game-muncher.js` IN THE SAME COMMIT** that adds
`game-deadline.js` and `game-escape.js`. They are the same files renamed; leaving
both is two copies of a game, which is the Rule 9 failure this project keeps
finding. Nothing imports the old names.

### The names (Jake's rulings, 2026-09-07)

| id (frozen) | title | was |
|---|---|---|
| `deadline` | **Deadline** | "Missile Command" — an active Atari trademark |
| `escape` | **Escape Key** | "Word Muncher" |
| `shatter` | **Shatter** | "Asteroids" — not built yet |

⚠️ **THE ID AND THE TITLE ARE DIFFERENT THINGS AND `game-names.js` IS WHY.** The
id goes into Firestore, the composite index and every leaderboard query, and must
never change or it orphans scores. The title is what a twelve-year-old reads and
is exactly the kind of thing that gets a better idea in eighteen months. With the
registry, a rename is one line; without it, the title would have been spelled into
two views, a modal, a leaderboard header and a Firestore field, and the fifth copy
is the one nobody finds.

⚠️ **"Last Word" was rejected deliberately.** It frames the game as unwinnable,
and the *assessed* mode is winnable — clear the quota and the banner reads CITY
DEFENDED. Only arcade is endless. Promising a struggling child doom before their
graded run is the one thing the title must not do.

### ✅ EVERY MODULE IS 1.0.0 — Jake's ruling, 2026-09-07

*"Nothing to this moment has had a version, so I'd rather it be 1.x. Gemini
doesn't deserve to have version 1. It was version 0 at best."*

He addressed `game-escape.js`, which had climbed to 2.2.0 across an inline-board
draft, the extraction into `escape-board.js`, and the polish pass. ⚠️ **THE SAME
ARGUMENT VOIDS EVERY NUMBER IN THE DROP** — the shell had reached 1.2.0,
`game-draw.js` 1.1.0, `game-deadline.js` 1.2.0. All my own drafts; none ever
deployed.

⭐ **THE VERSION LOG RECORDS DEPLOYS, NOT DRAFTS.** A file that has never shipped
has no history to record, and stamping five internal iterations into a header puts
history in front of the next reader that describes nothing they can observe. The
reasoning from those drafts is kept as prose throughout, because the reasoning is
the part with value — the numbers were never real.

⚠️ **THE NEXT CHANGE TO ANY OF THESE IS A NORMAL BUMP FROM 1.0.0**, and from here
the version log means what it says everywhere else in this repo.

**Not done, and deliberately not started:** the wiring into `learn.js`, the
leaderboard write, and Shatter. Reasons in §4 and §6.

⚠️ **v1.1.0 of the shell is a breaking change to the report object and it is
taken deliberately while nothing consumes it.** `report().leaks` is now
`report().hits`, because Muncher needed to report a collision and the alternative
was keeping `leaks` for push games and adding `hits` for cadence games — **two
records of one quantity, inside the report object, which is a Rule 9 break.**
`leaked()` survives as a thin alias onto `hit()` so the Missile Command call site
still reads in its own vocabulary. Every consumer was updated in this same
change. ⚠️ Once `learn.js` reads this object, a rename like this needs the Rule 3
major-bump conversation.

Run the suites:
```
node tests/game-shell-test.mjs        # 91 — the timing rule
node tests/escape-board-test.mjs      # 39 — the camper, the hunter, the webs
node tests/game-assumptions-test.mjs  # 59 — THE SEAM with the rest of the repo
```
⚠️ Register all three in `tests/run-all-tests.mjs` or they are not coverage; see
`INTEGRATION.md` §2 for the entries.
Play it: serve the repo root, open `/tools/game-lab.html`.

---

## 1. ⚠️⚠️ The defect this round exists to have caught

The first draft of `game-shell.js` set `MISSION_PRESSURE = 0.75`, reasoning that
a student typing at the gate deserves 25% headroom. **It made every gate
mathematically unreachable and would have failed every child in the building.**

Because the game clock is wall-clock, the seconds a student spends *waiting for
the next spawn* are charged to them. So a push rate below the gate caps the
achievable WPM below the gate:

```
gate 15 WPM, 4-char targets, pressure 0.75  →  push interval 4.27 s
kill each target the instant it spawns      →  4 chars / 4.27 s × 12 = 11.3 WPM
```

11.3 against a gate of 15, for a student playing perfectly. It looked correct,
it read correct in review, and it took thirty seconds of arithmetic in a harness
to expose. **`tests/game-shell-test.mjs` Part A now pins that arithmetic**, so it
cannot return as a readability tweak.

The fix is two things, and both are load-bearing:

1. **Pressure is 1.0** — work is pushed at exactly gate rate. Headroom comes
   from target *lifetime* (`QUEUE_DEPTH` intervals) and from shields, neither of
   which touches the measured number.
2. **The push interval is a maximum wait, not a metronome.** If the screen holds
   fewer than `MIN_ON_SCREEN` targets, the next spawns at once. Without this,
   pressure 1.0 caps *everyone* at exactly the gate: a 30 WPM student would read
   15, A🔥 (1.5 × gate) would be unreachable, and the game would be reporting the
   spawn timer rather than the child. Part D asserts a 40 WPM typist reads 40.

A second silent one, same class: `pressure` gated its ramp on `quotaMet`, and
arcade sets `quotaChars = Infinity`, so **arcade had no difficulty curve at all**
— identical to the prototype's `round` counter, which incremented, displayed, and
changed nothing.

---

## 1b. ⚠️⚠️ THE CAMPER, AND THREE DRAFTS THAT EACH LOOKED FIXED

Jake asked the right question: *"Doesn't a student have to type in order to dodge?
Or do you mean that they can just stay in place and hope to avoid trouble?"* — and
proposed the fix: *"Could we have the creatures spawn at the row/column or within
reach of the row/column?"*

He was right, and it matters more than a fairness patch: **Escape Key's WPM is
only a typing measurement if moving is mandatory**, because moving is what costs a
typed word. A camper banks wall-clock seconds against zero characters. So the
camper test is the test that decides whether Escape Key may sit on the graded
path at all.

Extracting `escape-board.js` made it testable, and it took **three drafts**, each
of which looked correct:

| draft | what it did | result |
|---|---|---|
| 1 | spawn on the player's row/column | **36 of 40 campers survived.** A creature spawning in the player's *column* then walked horizontally along its own row and never came near them. The lane was a start position, not a threat vector |
| 2 | travel along the axis you spawned on | **38 of 40 survived.** Enemies kept their original aim forever, so after a respawn they patrolled a lane nobody was in. ⚠️ That would have hurt real play too — a board whose threats have lost you has nothing to escape from |
| 3 | re-acquire the player's lane at board edges | **1 of 40 survived.** Seed 19: a kaiju reached the player's column mid-row, had no bounce to trigger a re-aim, and ran past the junction forever |
| 4 | re-acquire at the junction as well as the edge | **0 of 40 survived.** Median death at enemy step 20 — about a minute at a 15 WPM gate |

⚠️ **THE ONE-IN-FORTY MARGIN AT DRAFT 3 IS THE INTERESTING PART.** It looks like
noise. It was a rule with a gap in it, and only a 40-seed sweep distinguished the
two. A single playtest would have called draft 3 done.

Base population also went from 1 to 2: `1 + floor((p-1)/0.18)` put exactly ONE
enemy on the board through the entire mission phase, which was half the camping
hole and an empty-feeling game besides.

⚠️ **AND THE MOVER TEST WAS MEASURING THE WRONG THING TWICE.** Its first policy
always typed the first available neighbour, walking cheerfully into enemies —
37/40 died, which said nothing, because no child plays that way. Its second
assertion demanded survival over 200 enemy steps, which is **10.7 minutes** at a
15 WPM gate: an endless arcade run, where the ramp is *supposed* to win. The
claims that actually bear on the grade are the two that shipped:

* a dodging player clears **102 moves** on average against a **28-target** mission
* and survives a mission-length run on **38 of 40** seeds

⚠️ **DO NOT SOFTEN THE ROW/COLUMN SPAWN RULE.** It is load-bearing for the grade,
not for the difficulty. The player's row and column are tinted in the view so the
rule teaches itself without a tutorial.

---

## 1c. THE POLISH PASS, AND THE TWO REAL DEFECTS IN IT

Jake: *"Please do all the polish you can."* Most of it was furniture. Two items
were defects.

### ⚠️⚠️ The full-screen red flash was a blocker, not a nicety

All three prototypes — and the first draft of both shipped views — answered a hit
with a **40–45% alpha red fill across the entire canvas**, repeated. In a room of
thirty twelve-year-olds that is a photosensitivity risk, and repeated large-area
luminance flashes are the exact pattern seizure guidance names. It now goes
through `drawHitFeedback()`, which draws an edge vignette **transparent at the
centre** (so the area the student is reading never changes luminance) and degrades
to a **static border band** under `prefers-reduced-motion`. Particle counts scale
by `motionScale()` too.
⚠️ `prefersReducedMotion()` returns **true** when it cannot answer — a harness, an
old WebView or a locked-down MDM browser is not consent to flash the screen. It is
read fresh every frame rather than cached, because a student can change the OS setting
mid-session.

### ⚠️⚠️ `game-deadline.js` carried a second, worse copy of the finger map

v1.1.0 hand-wrote `FINGER_MAP` and `FINGER_COLORS`. **`keyboard.js` has exported
`buildFingerMap()`, `getFingerInfo()` and `FINGER_COLORS` all along**, and handles
the shift rows properly. The hand-written copy covered letters, digits and a
little punctuation; everything else — `!`, `?`, `"`, `:`, all over any book
lesson — fell through to `undefined`, and `FINGER_MAP[...] || 0` turned that into
tube 0, the left pinky.

**So in a prose lesson the game confidently launched from the wrong finger** — and
the finger tubes are the single best thing in that game. Showing the wrong one is
worse than showing none. Fixed by importing the real thing, which also means a
recolour or layout change in `keyboard.js` follows here for free. Part J pins it.
⚠️ Space now returns `null` rather than 0: it is a thumb character with no tube,
and `|| 0` is what taught the left pinky to fire the space bar.

⚠️ **AND PART J'S FIRST ASSERTION WAS WRONG, NOT THE MAP.** It asserted that no
punctuation lands on the left pinky — but `!` is Shift+1, which really is the left
pinky. Asserting "not pinky" would have forced a wrong answer to satisfy a wrong
test. It now spot-checks known values and asserts the mapping is *distributed*
rather than degenerate.

### The furniture

* **`game-chrome.js`** — get-ready panel with a 3-2-1 countdown, pause, quit,
  restart, mute. ⚠️ **DOM, not canvas**, so every one is a real tap target: both
  views were keyboard-only, so a student on an iPad with no keyboard attached
  could not even quit. ⚠️ Every button calls `blur()` on click, because a focused
  `<button>` swallows Space and Enter and Space is a real character in prose.
* **Spawns wait for the countdown**, but the clock does not — it starts on the
  first keystroke as it always did, so a student reading the get-ready panel is
  charged nothing.
* **Pause stops the graded clock.** The one deliberate exception beside a hidden
  tab: the student asked for it, and there is nothing on screen to type at.
* **Restart builds a fresh director and board**, never resets the old ones. A
  `reset()` would be a second place that knows every field on both objects, which
  is how a stale counter survives a restart and shows up as a second game scoring
  impossibly high.
* **`game-audio.js`** — every sound synthesised from oscillators, so there are no
  binaries for Jake to push through the GitHub web UI and nothing to 404. ⚠️
  **Muted by default and remembered per browser** — thirty iPads making launch
  noises in a 44-minute rotation is the teacher's problem, not the student's. The
  AudioContext is created on the first deliberate unmute, never at import.
  The keystroke pitch varies by finger, which is teaching rather than decoration:
  a student hears the shape of a word, and a wrong finger is audibly wrong before
  they have read the screen.
* **Caps Lock warning**, read from `getModifierState` every keystroke rather than
  tracked. Matching is case-sensitive, so without it a student with Caps Lock on
  fails every single key and concludes the game is broken — the Word Muncher STUCK
  failure in a new costume.
* **Deadline now uses the injected `rand`** instead of `Math.random()`, so a lane
  sequence is reproducible in a harness.
* **`escape-board.js` v1.1.0: webs stun hunters again.** v1.0.0 declared
  `stunSteps`, decremented it, and **nothing ever set it** — I dropped the
  prototype's behaviour during the extraction and left the field behind, which is
  dead code that reads like a feature. Restoring it gives webs a second role and
  hands the student a real tactic: lead the hunter across a web. ⚠️ Checked at the
  **top** of the enemy's turn — the first attempt tested for a web after movement,
  by which time the hunter had already stepped off it. ⚠️ Hunters only: a webbed
  kaiju stops being a lane threat, which is the property the whole design rests on.

---

## 1d. ⚠️⚠️ THE HUNTER, WHICH I ALSO LOST — AND MY TEST SAID HE WAS FINE

Jake: *"the hunter bot does actually appear in escape key, right? Somehow Gemini
lost the guy, and he should appear around round 5 or 6."*

**He did not appear.** Not in an assessed run, ever. And `escape-board-test.mjs`
was green on a hunter assertion the whole time.

⚠️ **THE TEST PROVED THE MECHANISM, NOT THE REACHABILITY.** It constructed a board
at `pressure 1.6`, asserted a hunter spawned, and passed. But pressure is
**deliberately flat at 1.0 through an assessed run** — a curve during a
measurement would make the grade depend on how far in the student got — and an
assessed run **ends at the quota**. So `pressure >= 1.25` was never met in real
play and the hunter existed only in arcade. Same bug Gemini had, reached by a
different route, and hidden behind a passing test.

⚠️ **THE LESSON GENERALISES AND IS WORTH CARRYING TO THE OTHER GAMES: a test that
constructs the precondition it is checking proves the code CAN do the thing, not
that the thing HAPPENS.** Part C2 now drives boards at the pressure a mission
actually uses.

Fixing it took three changes, and only the first was the one I expected:

1. **Rounds, not pressure.** `STEPS_PER_ROUND = 6`, `HUNTER_ROUND = 5`. Pressure
   answers "how hard"; rounds answer "how far in", and the hunter is a how-far-in
   creature. Round 5 begins at enemy step 24 ≈ 77 s at a 15 WPM gate, which puts
   him in the last stretch of a ~28-step assessed run — its climax — and about a
   minute and a quarter into arcade. ⚠️ **DO NOT RE-GATE THIS ON PRESSURE.**
2. **Creatures expire and walk off** (`ENEMY_LIFE_ROUNDS = 3`). Necessary, and I
   had not seen it coming: population at mission pressure is 2 and enemies had no
   lifetime, so the board filled with the kaiju and spider drawn in round 1 and
   **the unlock at round 5 opened onto a full board.** Zero hunters on 40 of 40,
   with the round gate working perfectly. This separately fixes "the board is the
   same two creatures for ten minutes" — a churning board reads alive, a static
   one reads broken. ⚠️ A stunned creature still ages, or webbing a hunter would
   preserve it forever.
3. **The first hunter is guaranteed, not rolled for.** At a 30% roll on a slot
   that frees every few steps he arrived around round 8 on 29 of 40 boards and
   never on the other 11 — so "round 5 or 6" was still false, just less
   dramatically. Every hunter after the first is probabilistic.

Now: **40 of 40 boards see a hunter at flat mission pressure**, none before the
unlock round even at high pressure, and the round is shown in the HUD — the
difference from the prototype's display-only counter being that this one gates
something.

⚠️ **AND THE MISSION-SURVIVAL CHECK WAS MEASURING THE WRONG SPAN.** It ran a flat
40 enemy steps, which keeps the board alive past the point a real mission would
have ended and counts deaths that could not happen. It now runs until 28 targets
are cleared, as an assessed run does: **39 of 40 seeds clear it.**

---

## 1e. ✅ RULE 10 CLOSED — AND IT FOUND A REAL BUG AND A REAL MISCALIBRATION

Jake exported the corpus on 2026-09-08: 47 lessons, 110 game-eligible runs after
chunking. First run: **3 failures**. This is the whole argument for Rule 10 — every
one of these was invisible to 130 assertions against fixtures.

### ⚠️⚠️ FINDING 1 — THE SPAWN INTERVAL USED THE CHUNK MEAN (a code bug)

`u4_l1/s4`, `u4_l2/s4`, `u4_l4/s5` failed. Not seed noise — **deterministic**, and
one chunk of a step would fail 0/9 seeds while another chunk of the *same step*
passed 9/9. The length distributions told the story:

```
u4_l1/s4 chunk 0 — quite quiet quest queen ... pile pine
  lengths 4–5, sd 0.42  → mean is a good predictor → 9/9 pass
u4_l1/s4 chunk 1 — pink pipe pan pay pen ... spear spend speak pride trade plant
  lengths 3–6, sd 0.96, AND THE LONG WORDS ARE ALL AT THE END → 0/9
```

Chunk 1's mean of 4.03 set a 3.23 s interval, but each 6-letter word needs 4.8 s at
a 15 WPM gate. A gate-speed typist accumulated a deficit through the back half and
lost all three shields, every time.

⚠️ **THE MEAN IS ONLY A CORRECT PACING INPUT IF THE TARGETS ARE UNIFORM, AND
AUTHORED WORD LISTS ARE NOT** — they group by length and by pattern, which is good
pedagogy and fatal to a mean. ⭐ Fixed by pricing the interval **from the target
just handed out**: work now arrives at gate rate *in characters*, so a 6-letter
word buys 1.5× the interval a 4-letter word does. Lifetime is per-target for the
same reason. All three runs went to 9/9.

### ⚠️ FINDING 2 — QUEUE_DEPTH 3 WAS TOO TIGHT (a miscalibration)

With the bug fixed, two Unit 7 graduation passages still failed — now
*seed-dependent* (4/9, 6/9), which is the signature of marginal difficulty rather
than a broken rule. At pressure 1.0 work arrives at exactly gate rate, so a typist
at exactly the gate **with any error rate** is fractionally slower than the push,
and that deficit compounds. Unit 7 has the highest gate (25) and the longest words,
so it is the tightest case in the corpus.

Swept the whole corpus, 990 trials per setting:

| `QUEUE_DEPTH` | gate-speed failures | runs affected | peak on screen | 60%-of-gate typists cleared |
|---|---|---|---|---|
| 3 | 19/990 | 6 | 4 | 0/550 |
| **4** | **1/990** | **1** | **4** | **0/550** |
| 5 | 0/990 | 0 | 5 | 0/550 |

⭐ **4, and the two reasons it is free.** ⚠️ **PEAK TARGETS ON SCREEN IS 4 AT BOTH 3
AND 4** — the buffer is measured in TIME, and a student who is keeping up never
fills it, so the readability cost I asserted when I wrote *"3 is a readability
ceiling"* does not exist. The depth only matters to a student already behind. And
⚠️ **it does not let slow students through**: a typist at 60% of gate failed 550 of
550 at depth 3, 4 *and* 5. The gate still discriminates; the buffer only stopped
punishing someone for a rounding error.

⚠️ **IF MISSIONS EVER FEEL TOO HARD, THIS IS THE NUMBER TO RAISE — NOT
`MISSION_PRESSURE`.** Lowering pressure below 1.0 caps achievable WPM below the
gate; see §1.

### ⚠️⚠️ FINDING 3 — PART I'S OWN ASSERTION WAS WRONG, FOR THE THIRD TIME THIS ROUND

It ran **one fixed seed** per run and demanded a gate-speed typist clear every
authored run. Two faults: one seed cannot distinguish a run that is **impossible**
from one that is merely **hard**, and those need opposite responses; and demanding
a 100% win rate from a typist at *exactly* the gate is not the design goal — such a
student should usually clear it and will sometimes lose and retry, exactly as on an
ordinary typed run.

⚠️ **THAT IS THE THIRD BADLY-AIMED ASSERTION IN THIS ROUND**, after `escape-board`
Part B measuring the wrong span and the hunter test asserting a mechanism instead
of its reachability. The pattern is the lesson: **write down what a failure would
mean before writing the assertion.**

Part I now runs 9 seeds per run and asserts (a) no run is systematically
unclearable at its own gate, (b) at least 95% of trials clear corpus-wide, and
(c) a 60%-of-gate typist clears nothing. Result: **990 trials, 1 loss (0.1%),
tightest run `u7_r6/s1` at 8/9.**

---

## 2. The rules, and where they stand

**Rule 9 — Single Source of Truth.** ✅ Held. Every quantity that decides whether
a child passes lives in `game-shell.js` and nowhere else. The views own pixels
and own no numbers. `netWPM()` and `accuracyPct()` are `learn.js`'s formulas
character for character, and Part B pins them; `chunkSequence()` and
`gatesForRun()` are *imported* from `run-grade.js`, not reproduced; arcade groups
go through `drill-filter.js`'s real `safeGroup()`.
⚠️ **`report()` deliberately has no `grade` field.** `run-grade.js`'s
`calculateGrade()` turns `(wpm, acc)` into a letter, and a second place that did
that is exactly what that module exists to prevent.

**Rule 10 — Prove It on Real Data First.** ✅ **CLOSED, 2026-09-08, AND IT FOUND
TWO THINGS.** See §1e. The fixture is committed at
`tests/fixtures/lessons-export.json` (47 lessons, exporter v1.21.0). ⚠️ **RE-EXPORT
IT WHENEVER THE LESSON CORPUS CHANGES MATERIALLY** — a stale fixture is a harness
proving yesterday's corpus, which is the shape of half the bugs in this repo's
history.

The original note, kept because the reasoning is what mattered: ⚠️ **NOT
SATISFIED. Do not treat any game result as authoritative yet.** The harness drives simulated typists through
the real code paths and real arithmetic, but the lesson documents live in
Firestore and are not in the repo, so Parts B–G use a fixture ladder. Part H is
written and **skips loudly** rather than passing.

> **To close it:** Admin → Lessons → Export JSON. ⚠️ **Jake cannot run the
> harness himself — there is no CLI in his workflow (HANDOFF B.4, browser-only
> deploys).** He uploads the export into a session and a Claude instance saves it
> to `tests/fixtures/lessons-export.json` and runs `node tests/game-shell-test.mjs`.
> Part I then drives a gate-speed typist through *every* game-eligible authored
> run and asserts each one is clearable. Until that has run green, the game must
> not write a grade.
>
> ⚠️ **Playing the games needs none of this.** `tools/game-lab.html` is static and
> `tools/` is served by Pages, so pushing the files through the GitHub web UI and
> opening `/tools/game-lab.html` on the live site is the whole loop. The JSON is
> for the automated harness only, and conflating the two was this instance's
> error in the previous turn.

**Rule 11 — Sacred.** ⚠️ **Untested, because nothing is wired yet.** The student
sees the game's `wpm`/`acc`; the teacher will see whatever `learn.js` records. The
moment the wiring exists it must ship with a harness driving both readers off the
same record. There is one *calibration* gap that is not a Rule 11 divergence but
must be written down: see §3.

**Rule 3 — version bumps.** All new files at 1.0.0. No existing file was touched,
so nothing needed bumping. That is deliberate — see §4.

**Rule 4 — no student data.** Nothing here reads or stores identity.

---

## 3. Rulings baked in, with the quotes

**Leaks are not charged as accuracy errors.** Jake, 2026-09-07: *"kids can
already get 100% accuracy and lose because they don't get the required speed -
and THAT's what we're looking at here."* A leak costs a shield and costs the
seconds spent not typing it, which lands as a speed miss. Charging it twice would
punish the careful slow typist in a second currency.
⚠️ **Do not "fix" `leaked()` by adding the remaining characters to `mistakes`.**

**An unmatched keystroke *is* an error.** All three prototypes silently discarded
a key that hit nothing, so a masher could sit at 100% accuracy indefinitely. This
is not the same event as a leak and is charged.

**Wall clock, no idle subtraction.** `learn.js`'s `stepSeconds` stops when a
student idles, correctly — in a drill, idle is a child staring at a screen. In a
game, idle is *the game's own dead air between spawns*, and an idle-aware clock
would divide 20 characters by the 0.4 s spent typing them and report 45 WPM for a
student producing 15. Part G pins it. A hidden tab is the only pause.

**The space-bar forgiveness, accepted and one-directional.** A drill charges the
delimiter (`asdf jkl;` is ten keystrokes); a game does not. So the same text is
worth **~19% fewer characters** in a game — measured, Part E. A space-to-confirm
keystroke would make the two exactly comparable and was rejected: it puts a
fiddly extra key between a sixth grader and an explosion, and Jake's ruling above
points the same way. **The error is accepted only because it is forgiving — a
game is never harder than the drill at the same gate, and Part E asserts that
direction** so a change that inverts it fails the suite instead of failing
children.
⚠️ Nothing credits a phantom character. `chars` and `mistakes` are honest
keystroke counts; crediting the missing delimiter would have inflated *accuracy*
too (4 typed / 1 wrong = 75%, but 5 charged / 1 wrong = 80%), and accuracy is
what a lesson is gated on.

**Lanes are opt-in.** Jake's concern: *"my only fear on the lanes is that it
distracts kids who just want to type."* So targeting **auto-locks to the target
nearest impact** and a child who only wants to type never thinks about lanes.
Lanes pay off only for a student who chooses to abandon a lock (Escape, free) to
save a different landmark. Landmark names carry the payoff for everyone else:
`THE PARTHENON IS GONE` is a story, not a skill check.

**Arcade scales with the student, not with a lesson.** Jake: *"it generates
words/letter combos based on as far as they've gotten in the lessons"* and *"It's
tricking them into practicing more, so of course it counts."* `arcadeKeySet()`
takes the union up to and including the lesson they are currently on — a student
who has passed nothing gets the home row and nothing else. Target WPM is their
own rolling WPM, because there is no gate to read.

**Misfire feedback never blocks input.** The Muncher prototype froze the keyboard
for four seconds on a web hit and flashed red, which reads to a twelve-year-old
as broken hardware. A wrong key darks its finger's tube for 260 ms and fires a
missile at nothing. Purely visual.

---

## 4. Why `learn.js` was not touched

Three reasons, in order of weight.

1. **Rule 10 is open.** Wiring the game into the final run of a lesson makes it a
   graded path. Until Part H has run green against the exported corpus, a green
   suite here is a green suite on a fixture.
2. **Rule 11 needs a harness that cannot be written yet.** The two-readers test
   needs both readers to exist.
3. **The leaderboard is a schema decision that is still yours.** Sketch below,
   not built.

⚠️ **The insertion point, when it is time:** `learn.js` line ~3376, the
`isLastRun` fork in `finishStep()`. A game replaces the *final run* of a lesson
(your framing, and it is better than the options I offered — the final run
already exists as the graded slot, so nothing new has to be invented). The game
must sit **above** `showLessonResultModal()` and hand it the same `(wpm, acc)`
pair a typed run would, so `recordRunOutcome()`, `saveProgress()` and `logRun()`
stay the single writers. ⚠️ **Do not add a second write path for a game result.**

---

## 5. ✅ The leaderboard — shape approved 2026-09-07, NOT deployed

✅ **Jake approved the shape:** *"Kids compete against themselves and then against
everyone else, reducing the number of writes."* — his summary of the personal-best
mechanic, and a better one than mine. Full text, rules and index in
`firebase/APPROVED-game-scores.md`.

⚠️⚠️ **APPROVED IS NOT DEPLOYED.** The rules text has never been executed. It must
pass `npm run test:rules` against the emulator first, and that needs a session —
`firestore.rules` is the one file Jake cannot test from a browser.

The current board is one document per uid with four scalar categories and a
top-10 `orderBy`. A per-lesson game board does not fit that shape.

* New collection `game_scores`, doc id `{uid}_{game}_{lessonId}`.
* Fields: `game`, `lessonId`, `score`, `initials`, `classId`, `schoolId`,
  `updatedAt`. **Initials only** — same discipline as `leaderboard`, which every
  student can read.
* One composite index: `game` + `lessonId` + `score desc`.
* **Written only on a personal best** for that `(game, lessonId)` — roughly one
  write per student per lesson per game, which keeps the WAL-era cost profile.
* Two boards, not one: **assessed** (the Missile Command final-run slot) and
  **arcade**. Mixing them would rank forty minutes of Friday above a passed
  graded run. Your framing: a different board because it is a different game.
* ⚠️ **Escape Key writes only arcade rows** now (4e: arcade-only), so Deadline is
  the only game producing assessed rows. Do not build the query layer assuming
  every game appears on both boards — read `game-names.js`'s `assessed` flag.
* ⚠️ Arcade minutes count toward totals, per your ruling. Stamp `mode: 'game'`
  into the session detail anyway so `reports.html` *can* separate game minutes
  from drill minutes when looking at one child. Costs nothing at write time and
  keeps the totals inspectable.

---

## 6. What the prototypes got right, and what has to change

**Keep, and do not simplify away:** the finger tubes (Missile Command — one
launch tube per finger, in that finger's `keyboard.js` colour; it is a live
kinetic version of the keyboard colouring and it is the single best idea in all
three files). Words-as-movement (Muncher). The wireframe vector art (Asteroids).

**The cross-cutting defects, all three files:**

| defect | detail |
|---|---|
| frame-rate dependence | Asteroids and Missile Command move in px/**frame**; both run at double speed on a 120 Hz iPad. Muncher was already `performance.now()`-based |
| no accuracy signal | wrong keys silently discarded; a masher reads 100% |
| hardcoded word lists | `SUPERNOVA` in a home-row lesson; bypasses `drill-filter.js` |
| case | all three uppercase and match uppercase, so every capital is free. Drills compare exactly |
| canvas sized once | no resize handler; rotate an iPad and Missile Command's domes are off screen |
| no teardown | `window` keydown + a forever RAF loop. Mounted in `learn.html`, a game the student left eats the next drill's keystrokes |
| text unreadable | bare `fillText` on busy canvas. `game-draw.js`'s plate is the fix, applied everywhere, not just to STUCK |

**Muncher — done this round.** `game-muncher.js` v1.0.0. What changed and why:

* ⭐ **The enemy step interval is `enemyStepMs()` from the shell — 3.2 s at a 15
  WPM gate, not 1.2 s.** This was the whole unfairness. In Muncher one typed word
  buys one cell of movement, so keeping pace with an enemy at 1.2 s required
  `12 × 4 / 1.2 = 40 WPM` — nearly three times the default gate. ⚠️ **No amount
  of iterating on the spawn table, the web duration or the hunter AI could ever
  have fixed that**, which is why every step forward had a step backward: the
  defect was one constant in a file where the other numbers were fine. Part H
  pins both the old arithmetic and the new.
* **It is a CADENCE game and it shares the shell's arithmetic anyway.** A push
  game asks "how often does a target arrive"; a cadence game asks "how fast does
  an enemy walk". Both are "how long does one target take at this gate", so
  `enemyStepMs` is an *alias* of `spawnIntervalMs`, not a copy. Part H asserts
  they are the same function object.
* **Difficulty now comes from the director's pressure**, so enemy population
  climbs and the step tightens as the ramp does. The prototype's `round` counter
  incremented, displayed, and changed nothing but a round-6 hunter unlock; that
  is the same class of silent no-op as the shell's own arcade-ramp bug in §1.
* **Webs cost a new word and never eat a keystroke.** Per your amendment — a
  *fresh* tear-free word, not the one just typed, on a plate above the board.
  The prototype's `stuckUntil` swallowed every key for four seconds and flashed
  red, which reads as broken hardware to a twelve-year-old.
* **Adjacent-only uniqueness, on first character.** The prototype filtered
  against all 30 cells, needing 31 distinct groups a home-row key set cannot
  supply — and when it ran out it returned `dictionary[0]`, a silent duplicate,
  in a game where two identical adjacent words make the direction unchoosable.
  Only the four cells the player can type from need to differ, and only in their
  first character. Part H proves a home-row pool offers 8 distinct first
  characters and a two-key pool offers fewer than 4, so the warning path is real
  rather than theoretical.
* **Board scales to the canvas** (prototype: hardcoded 120 px cells, 720×600
  canvas, cropped on a portrait iPad), **plates on every label**, case-sensitive
  matching, unmatched keys charged as mistakes, `destroy()` tears down.
* **Respawn goes to the cell farthest from any enemy**, not a fixed centre —
  dropping the player back onto a hunter would spend two shields for one mistake.

**Shatter** (still to do). Was "Asteroids".

* Free unlimited spacebar warp means the prototype is beaten without typing at
  all — warp goes on a charge meter earned by clearing words.
* Rocks wrap forever, so clearing never clears and the pressure is a step
  function. Targets must converge and not wrap.
* ⚠️ **THE SPLIT IS THE MECHANIC AND IT MUST NOT BE SEMANTIC.** Jake's objection
  killed the sonar and campfire reskins outright: *"the subs won't split into
  smaller subs, so it really does just become a missile command clone with a
  different perspective. It's the splitting that makes it interesting."* And on
  the obvious version of splitting: *"I like the idea of splitting compound words
  into their component parts, but that will only work when they have lots of
  letters."*
  Both are right, and the resolution is that the split needs to be **readable and
  shorter**, not meaningful. One shell function, `splitTarget(text)`, with a
  fallback ladder: syllables → compound parts → halves → single characters. A
  Unit 1 student shatters `asdfjk` into `asd` and `fjk` — the same drill, twice,
  under more pressure. A Unit 7 student shatters `SUPERNOVA` into `SU-PER-NO-VA`
  and learns syllable chunking as a survival reflex, which is the actual skill
  that stops letter-by-letter typing. ⚠️ Every lesson gets the escalating swarm;
  the split gets *more* meaningful as the student advances rather than only
  working at the top.
* On the rip-off question, Jake's own read is the right one: Maelstrom was
  Asteroids' mechanic wearing none of Asteroids' clothes. Mechanics are not the
  exposure; the name and the art are. Keep the mechanic, own the art, and the
  title was the only item on the list that actually needed changing — which it
  now has.

---

## 7. ✅ ALL FIVE DECISIONS ANSWERED — Jake, 2026-09-07

Applied in code and pinned in `tests/game-assumptions-test.mjs`. Nothing here is
open. Full quotes and consequences in `NEXT-STEPS.md` §4.

| # | ruling | where it lives |
|---|---|---|
| 4a | every module ships at **1.0.0** | headers + runtime constants |
| 4b | leaderboard shape **approved**, still not deployed | `firebase/APPROVED-game-scores.md` |
| 4c | assessed → lesson gates; arcade → **furthest gate reached** | `arcadeTargetWPM()` |
| 4d | **both** entry points, quiet, **no day gate** | `game-names.js` `ARCADE_ENTRY` |
| 4e | Escape Key **arcade-only**, time still counts | `game-names.js` `assessed`/`countsTime` |

### ⚠️ THE TWO THAT CARRY A COST WORTH RE-READING

**4c lags a fast student.** The app stores no rolling WPM — per-run WPM only
reaches `typing_logs` (a query per arcade launch, against a codebase whose WAL
round drove writes to near-zero) and `bestWPM` is a best, not a mean. Storing a
new average would be a fourth record of a quantity the app already knows. So the
arcade targets the `minWPM` gate of the furthest lesson reached: **free**, because
`arcadeKeySet()` already walks that exact list, which also means the arcade's
letters and its speed now come from the same window. ⚠️ A quick typist parked in
Unit 1 gets a 15 WPM arcade until they advance. `bestWPM` raises the floor to 80%
**only when the caller already holds the leaderboard document** — ⚠️ **DO NOT ADD
A READ TO SUPPLY IT.**

**4e turns the grade off but not the clock.** `assessed: false`, `countsTime:
true`. ⚠️ **PART B OF `escape-board-test.mjs` IS STILL LOAD-BEARING** — a student
who could stand still and bank minutes against zero characters would be farming
the daily clock. Do not read that test as dead weight because the grade is off,
and do not soften the row/column spawn rule it guards.

### What is still open, and it is not a decision

⚠️ **Rule 10.** `game-shell-test.mjs` Part I skips loudly until
`tests/fixtures/lessons-export.json` exists. **It is now the only thing blocking
Deadline's wiring.** Jake exports Admin → Lessons → Export JSON and hands it to a
session; he has no CLI and cannot run the harness himself.
