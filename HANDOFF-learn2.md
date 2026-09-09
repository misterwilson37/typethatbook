# HANDOFF-learn2.md — the Deadline lesson-gate staging fork

**2026-09-09.** Built at Jake's request: a lesson's FINAL run should be Deadline
(`game-deadline.js`) instead of a typed drill, so a student on run 5/6 at the
bell can come back, finish run 5, and play Deadline as run 6 to prove they're
ready for the next lesson.

⚠️⚠️ **READ THIS BEFORE TOUCHING `learn2.html` OR `learn2.js`.** They are a
**staging fork of `learn.html`/`learn.js` v2.48.0, NOT the production page.**
Read `HANDOFF.md` and `HANDOFF-games.md` first if you haven't — this document
assumes both.

---

## 0. Why a fork, and why that's a Rule 9 exception on purpose

Deadline's keystrokes never touch `learn.js`'s `drillPos`/`learnLastInputTime`
— the two variables `startGradedTimer()`'s tick gates on, and the exact gate
`tests/open-unit-test.mjs` Part E brace-matches against, by reading
`../learn.js` **by hardcoded filename** and failing if `statsData.secondsToday++`
appears more than once in that file. There is no way to bank a game run's
seconds without a second increment site somewhere, and putting it inside
`learn.js` itself is precisely the shape that harness exists to catch.

Two honest options were on the table (see the conversation this was built in):
forking to a new file the harness has never heard of, or a flag-gated branch
inside `learn.js` with a second, clearly-labelled increment site living beside
the one Part E polices. **Jake chose the fork, 2026-09-09.**

**What that costs, plainly:** `learn2.js` carries its own full copy of the
grading/time engine. Two files now compute a grade and bank a second — the
exact drift risk Rule 9 exists to prevent. This is deliberate and temporary,
the same role `tools/game-lab.html` and (until Round 82) `arcade.html` already
played: real, playable, **not the page a whole roster is on.**

⚠️⚠️ **THIS MUST BE RECONCILED BEFORE IT GOES NEAR A WHOLE CLASS.** Two paths,
Jake's call whenever he's ready:

1. **Promote it.** Once tested, rename `learn2.html`→`learn.html` and
   `learn2.js`→`learn.js` (bump to a real version, Rule 3's major-bump
   conversation), delete the old ones, register in `versions.js`.
2. **Fold it back.** Port `isGameRun()`/`beginGameStep()`/`bankGameSecond()`/
   `finishGameStep()`/`destroyGameHandle()` into `learn.js` proper behind a
   flag, accepting the second-increment-site cost inside the production file
   and updating `open-unit-test.mjs` Part E to know about it deliberately
   (rather than merely satisfying its letter).

Either way: **delete the loser.** Two copies of this file surviving past the
decision is the exact failure this whole document exists to prevent.

---

## 1. State

| file | status |
|---|---|
| `learn2.html` | **new.** Fork of `learn.html` v1.2.0. One new element (`#game-mount`), one `<style>` block scoped to it, script tag points at `learn2.js`. |
| `learn2.js` | **new.** Fork of `learn.js` v2.48.0. Diffed line-for-line against it — see §2 for exactly what changed. |
| `HANDOFF-learn2.md` | this file. |
**Not touched:** `learn.js`, `learn.html`, `game-deadline.js`, `game-shell.js`,
`game-chrome.js`, `run-grade.js`, or anything else in the repo. `learn2.html`/
`learn2.js` are **deliberately absent from `versions.js`**, same as the arcade
was kept out while inert (Round 82's ruling) — the version footer says
"STAGING FORK" rather than pretending to a deploy number.

**Rule 10:** already closed against the real corpus (2026-09-08, 990/990
trials, see `HANDOFF-games.md` §1e) — this fork does not reopen it. It reuses
`missionConfigFromRun()` unmodified.

**Rule 11:** held by construction, not by a new harness. `finishGameStep(rep)`
hands `rep.wpm`/`rep.acc` to the *same* `saveStats()` → `logRun()` →
`showLessonResultModal()` chain a typed run's `finishStep()` already uses.
There is no second reader — a game run and a typed run are graded by literally
the same code from that point on.

---

## 2. Exactly what changed, `learn.js` → `learn2.js`

Confirmed with `diff` before this was written. Every change is one of:

1. **Header banner** (this document, referenced).
2. **Two new imports**: `missionConfigFromRun` (`game-shell.js`), `mount` as
   `mountDeadline` (`game-deadline.js`). `readOneDeployedVersion` import
   dropped — nothing calls it now that the footer can't ask `versions.js`
   about an unregistered page.
3. **`LEARN_VERSION`** → `"0.1.0-staging"`; footer/title text says STAGING FORK.
4. **One new module var**: `gameHandle` (holds `mountDeadline()`'s handle).
5. **`beginStep()`**: one new branch — `destroyGameHandle()` unconditionally
   at entry (covers the Game Genie jump and every other caller for free),
   then `if (isGameRun(stepIdx)) { beginGameStep(stepIdx); return; }` before
   the typed-drill setup.
6. **`stopLesson()` / `restartLesson()`**: one added `destroyGameHandle()`
   call each, so a mounted game is never left running under a view that no
   longer owns it.
7. **Five new functions**, inserted as one block right after `beginStep()`,
   clearly banner-delimited in the file:
   - `gameSlotIdx()` / `isGameRun(idx)` / `runHasSpeedGate(idx)` /
     `cumulativeKeyCount(lesson)` / `GAME_MIN_KEYS` — the one answerer for the
     game slot and its three gates (§5).
   - `destroyGameHandle()` — `gameHandle.destroy()` + hides `#game-mount`.
   - `bankGameSecond()` — **the second time-increment site**, documented at
     length in-file. Same statements, same order as `startGradedTimer()`'s
     tick body (rollover → `stepSeconds`/`learnActiveSeconds`/
     `statsData.*` → anon accum → goal celebrations → `noteActiveDay()` →
     paint). Called from Deadline's `onSecond`, which only fires on a whole
     elapsed *graded* second — never before the first keystroke, never while
     paused, never after end (`game-deadline.js` watches `document.hidden`
     itself, so a hidden tab already stops it with no extra wiring here).
   - `beginGameStep(stepIdx)` — the typed-drill-shaped setup (hide intro,
     unhide `#active-drill`, reset counters, paint pips/label) minus the
     typed-only parts (no `drillKeyboard.onkeydown`, no `startGradedTimer()`),
     then builds the mission with `missionConfigFromRun()` — **the same call
     `arcade.html` makes**, given the run's own baked `sequence` — and mounts
     Deadline with `onSecond`/`onTick`/`onEnd`/`onQuit` wired as above.
   - `finishGameStep(rep)` / `renderGameLostResult(rep)` — the tail, gated on
     `rep.quotaMet`. See §3, which is the most important section in this file.
   - `maxReachableRunIdx()` / `renderRunPicker()` / `syncIntroStartLabel()` —
     the run picker (§4), called from `showIntro()`.
8. **`showIntro()`**: two added lines, `renderRunPicker(lesson)` and
   `syncIntroStartLabel()`, after the intro text is set.

Nothing else moved. `git diff`/`diff` against `learn.js` v2.48.0 should show
only the above.

---

## 3. ⚠️⚠️ THE ZERO-EFFORT PASS — a defect this wiring created, found before it shipped

**Not a feature request. Found 2026-09-09 by reading `calculateGrade()` against
a game nobody plays**, while checking whether accuracy-only final runs were
safe. It would have let a student pass any lesson by doing nothing.

A student mounts the game and **types nothing**. Every target leaks, every
shield goes, the game ends by itself. `game-shell.js` does not charge a leak as
an accuracy error — Jake's ruling 2026-09-07, and correct for a typed-run-shaped
measurement — so the report reads `chars: 0, mistakes: 0`, and `accuracyPct(0)`
returns **100** by definition. Handed to `showLessonResultModal()` that is
acc 100 / wpm 0, which `calculateGrade()` turns into:

* **accuracy-only final run** (all of Units 1, 2 and 5): `minWPM == null` and
  `clean` is true → **A🔥**;
* **speed-graded final run**: accuracy met, speed short → **'C'**, and
  `gradeAdvances('C')` is **true**, because nothing in the corpus sets
  `strictSpeed`.

Either way `saveProgress(passed)` marks the lesson **passed**.

⚠️ **A TYPED RUN CANNOT DO THIS, AND THE ASYMMETRY IS THE WHOLE POINT.**
`finishStep()` is only reachable by typing the sequence to its end, so an
abandoned typed run produces no outcome at all — only banked time. **The game
is the first run in this app that can END BY ITSELF**, so it is the first one
that ever needed this said.

⭐ **THE FIX: A LOST GAME IS AN UNFINISHED RUN, NOT A FAILED ONE.**
`finishGameStep()` gates on `rep.quotaMet`. A lost game banks the minutes and
logs the sprint (the child really did type for those minutes; Jake's standing
rule is that time counts whether the work finishes or not) but never reaches
`recordRunOutcome()` or `saveProgress()` — exactly how an abandoned typed run
already behaves. It gets its own screen, `renderGameLostResult()`: their real
numbers, an honest line, Try Again / ← Map.

⚠️ **DO NOT "FIX" THIS BY INVENTING A GRADE.** Writing 'F' would be a claim
about how well they typed, and a student who cleared 90% of the mission at
100% accuracy did not earn an F. The honest record is that the run did not
finish.

---

## 4. The run picker — and a correction to something I told Jake

Jake, 2026-09-09: *"a student got kicked back to the first run and had no way
to move forward with it."*

⚠️⚠️ **EARLIER IN THAT SAME CONVERSATION I TOLD HIM THIS ALREADY WORKED, VIA
ROUND 34's `firstOpenRunIdx()`. THAT WAS WRONG, AND HIS REPORT IS THE PROOF.**
`firstOpenRunIdx()` returns the first run whose mode is not `'practice'`, and a
run only becomes `'practice'` once **mastered** — `MASTERY_POINTS = 4`, banked
at A🔥 = 2 and A = 1, with **B, C, D and F worth ZERO** (`lesson-gate.js`
`RUN_POINTS`). So the resume only ever fires for a student who scored two
fireballs, or a fireball and two A's, or four A's, **on every earlier run**. A
child who passed runs 1–4 with B's and C's — the normal case, the case the
gates are tuned for — banks nothing, and every visit reopens at run 1.

⚠️ **NOTHING IS BROKEN IN `firstOpenRunIdx()`.** Round 34 fixed a real problem
and fixed it only for students already excelling. It never covered the case
Jake watched happen. Do not go looking for a bug in it.

**Why a picker and not a new auto-resume:** Jake's standing ruling, 2026-08-17,
the one that deleted mid-lesson resume in v2.5.0 — *"If a kid doesn't finish a
lesson one session, they should restart it — not start at the last word. The
lesson should be taken as a whole."* That ruling governs the DEFAULT and
governs resuming mid-RUN, at the character. This changes neither: the lesson
still opens at `firstOpenRunIdx()`, and a run still always starts at character
zero. What is new is that a student may **choose** a run, deliberately, from a
screen — which is also the "more practice where necessary" half of the ask.

**Where it lives:** `#intro-run-picker`, on the intro panel, and ⚠️ **that
placement is a ruling, not a layout choice.** ROADMAP item 8: a focusable
control reachable by Tab from a **typing** view eats keystrokes the child
should have been credited for — which is why the font picker went to the map
and why `#done-btn` carries `tabindex="-1"`. The intro panel is not a typing
view. **DO NOT MOVE THIS INTO `#active-drill`.**

⚠️⚠️ **THE CEILING IS THE POINT, AND WITHOUT IT THIS HANDS EVERY STUDENT THE
WHOLE CURRICULUM.** A lesson is marked passed by `showLessonResultModal()`,
which only the FINAL run reaches — so an unrestricted picker would let a child
open any lesson, jump to the last run, and pass without typing a character of
runs 1..N-1. Now that the last run is the game, it would also be a one-click
route to the only fun thing on the page, forever.

`maxReachableRunIdx()`: a student may replay anything already reached and step
exactly **one** run past it — the run they would have arrived at by typing
anyway. Built from `furthestRunIdx`, already maintained on the progress record
as a running max, so this costs **no new field, no new write, no new read**.
It refuses the shortcut entirely (returns 0) when the record's stored
`runCount` disagrees with the current chunking, because a lesson edit makes
every stored index mean something else.

---

## 5. The three game gates — Jake's rulings, 2026-09-09

`gameSlotIdx()` is **the one answerer** for "which run, if any, is this
lesson's game slot." ⚠️⚠️ **EVERY SURFACE ASKS IT AND NONE RE-DERIVES IT.** The
first draft spelled the test out three times — `isGameRun()`, the picker's 🚀
chip, and the Start button's label — which is Rule 9 at its smallest, and whose
failure mode is a picker promising a rocket the lesson then declines to
deliver. All three copies would have looked individually correct.

* **A one-run lesson is never a game.** *"If there were only one run, it should
  not be a game."* ⚠️ **LIVE, NOT HYPOTHETICAL** — six lessons (`u7_p1`–`p4`,
  `p7`, `p8`) are a single short `sentence_list` that chunks to one run.
* ⭐ **No game where speed is not graded.** *"I would lean toward no game on any
  lesson where wpm doesn't matter."* ⚠️⚠️ **THIS GATE CLOSES AN INCOHERENCE, NOT
  JUST A PREFERENCE.** A run with `minWPM: null` is graded on accuracy alone,
  but a Deadline mission is a **throughput test by construction** — the city
  falls if you cannot keep up. The game would therefore decide pass/fail on a
  quantity the grade formula is forbidden to look at: the student loses their
  city for being slow, then reads a screen saying speed was never measured.
  One of those two screens is lying whichever way it resolves.
  ⚠️ It also removes `missionConfigFromRun()`'s invented-pace fallback from the
  graded path entirely — **every game run now reads a real authored gate**,
  which retires `game-shell.js`'s "not without Jake's sign-off" caveat rather
  than answering it.
  ⚠️ Read through `gatesForRun()`, **never** by testing `run.type` against
  `DRILL_TYPES` locally: an explicit `step.gates.minWPM` overrides the type
  default, and reproducing that precedence would be a second copy of the rule
  `run-grade.js` owns.
* **At least `GAME_MIN_KEYS` (4) cumulative keys.** *"Spamming the game is lame
  and not worth doing."* ⚠️ **THIS GATE CANNOT FIRE AGAINST THE CURRENT CORPUS
  AND IS KEPT DELIBERATELY.** The only sub-4-key lesson is `u1_l1`, which the
  speed rule already excludes. Retained because it encodes a separate intent
  that would otherwise hold only by coincidence. ⚠️ It is **not** dead in the
  `escape-board` `stunSteps` sense (declared, decremented, never set) — it is
  evaluated every call and simply never decides the answer today.

### Measured against the real corpus (47 lessons, executed through the actual `chunkSequence()`/`gatesForRun()`)

| | count | which |
|---|---|---|
| **game** | **26** | `u3_l1`–`u3_l3`, all of `u4`, `u5_l6`, both `u6`, `u7_p5/p6/p9/p10`, all ten `u7_r*` |
| no game — accuracy-only final run | 14 | `u1_l2`–`u1_l5`, `u2_l1`–`u2_l5`, `u5_l1`–`u5_l5` |
| no game — single run | 6 | `u7_p1`–`p4`, `p7`, `p8` |
| no game — under 4 keys | 1 | `u1_l1` |

⚠️⚠️ **THE CONSEQUENCE JAKE SHOULD SEE: THE FIRST GAME IS NOW `u3_l1`, NOT
`u1_l2`.** He originally expected it from "the second lesson"; the speed-gate
ruling supersedes that and pushes it to lesson 11 of 47. Units 1, 2 and 5 are
game-free. **This is the correct outcome of his own later ruling, but it is not
what his earlier sentence described, so it should be confirmed rather than
assumed.**

### ⚠️ Why Units 1, 2 and 5 end on `key_random` — not a corpus bug

Units 1 and 2 because a handful of letters cannot spell a word. **Unit 5
because it is the NUMBER ROW, and digits cannot spell one either** — `u5_l1`–
`u5_l5` are literally `pattern → random-new-keys → combined-digits`, with no
prose step available to them. Same structural cause, not an authoring slip.
`u5_l6` (Number Row Synthesis) **keeps its game**: its capstone is a
mixed-alphanumeric `sentence_list` carrying a real 15 WPM gate.

⚠️ **A SEPARATE, PRE-EXISTING FINDING, STILL TRUE AND NOT ADDRESSED HERE:**
because those 14 lessons are graded on their final run and that run is
accuracy-only, **a student can pass all of Units 1, 2 and 5 at 2 WPM with clean
accuracy** — today, typed, with or without this fork. Jake believed the
opposite (*"I'm pretty sure there's always a speed component"*), which is true
per-lesson (`gates.minWPM` exists on all 47) but false for the run that decides
passing. Excluding the game from those lessons **avoids the incoherence; it
does not fix this.** Fixing it is a curriculum decision — a speed gate on the
synthesis steps, or `strictSpeed`, or nothing — and belongs to Jake, not to a
wiring round.

---

## 6. Open questions for Jake — none blocking

* **Confirm the first game moving to `u3_l1`** (see §5). One sentence either
  way.
* **The `u7_p*` graduation passages split arbitrarily.** `p5`, `p6`, `p9`,
  `p10` cross the 195-char chunk threshold and get a 2-run lesson whose second
  run is the game; `p1`–`p4`, `p7`, `p8` fall under it and get none. A student
  would see the game appear and vanish for no visible reason. Not wrong, just
  arbitrary.
* **`missedChars` never sees the game run.** Jake, 2026-09-09: *"Practice
  missed keys isn't available during a game run, so it also doesn't matter."*
  Recorded as answered, not open.

---

## 7. Known gaps

* **No new automated harness.** Built and reviewed by hand: line-by-line `diff`
  against `learn.js` v2.48.0, `node --check`, every reused signature
  cross-checked against `game-shell.js`/`game-deadline.js`'s real exports, and
  the game-eligibility gates executed against the real 47-lesson fixture
  through the actual `chunkSequence()`/`gatesForRun()`. **Not driven by a
  browser.**
* **The live WPM/Accuracy HUD during play is an estimate.** `onTick` and
  `onSecond` are independent callbacks and can land a fraction of a second out
  of sync with each other. The only number ever written is the one frozen in
  `rep` at `onEnd`. Cosmetic.

**Play it before trusting it with a class:** a normal multi-run lesson through
to the Deadline finish; a **deliberate loss** (sit still — confirm it says the
city fell, does NOT pass the lesson, and the map still shows the lesson
unpassed); a fail-and-retry; a mid-game quit; a tab-hide mid-game; and the run
picker on a lesson you are part-way through.

## 8. How to try it

Push `learn2.html`, `learn2.js`, and this file through the GitHub web UI same
as always — nothing else needs to move. Open `learn2.html` in place of
`learn.html` for a test account, play a lesson through to its last run, and
confirm Deadline mounts there instead of the typed drill. The version footer
will say "STAGING FORK" the whole time, which is the point — nobody should be
able to mistake this page for the live one by accident.
