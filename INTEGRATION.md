# INTEGRATION.md — folding Round 82 (Victor) into the repo

**Read this if you are:** Jake, deciding what to do next; or a Claude instance
handed the full repo and told to fold in a side round's work.

**Read `HANDOFF-games.md`** for the reasoning behind every decision and the record
of what went wrong on the way. **Read `README-games.md`** for the architecture.
**Read `NEXT-STEPS.md`** for the ordered action list. This file is the seam: what
touches what, what is safe, and what will conflict.

---

## 0. ⚠️ THE ROUND NUMBER WAS WRONG AND IS NOW RIGHT

This work was stamped **Round 65** through most of its construction. The last
shipped round is **81 (Fox)**, so it is **Round 82 (Victor)**. The 65 came from
grepping `Round N (Name)` across the docs and picking up ROADMAP *prose*
references — `ROADMAP.md` line ~520 says "ROUND 64 (Duplex)" about a closed item —
rather than the `## Round N (Name)` heading at the head of `CHANGELOG.md`, which
is the actual record.

⚠️ **If you are the next instance: read `CHANGELOG.md`'s first heading to learn
the round number. Nothing else in the repo answers that question reliably.** Every
file in this drop now says Round 82; if you find a 65 anywhere, it is a straggler.

**Victor** is an 1889 typewriter. Not a duplicate of any name in `CHANGELOG.md`,
`HANDOFF.md` or `ROADMAP.md` as of Round 81.

---

## 1. What lands, and why it is safe to land first

Eight modules, three harnesses, one tools page, four docs, one proposal.

```
game-shell.js        game-names.js      game-draw.js       game-chrome.js
game-audio.js        escape-board.js    game-escape.js     game-deadline.js
tests/game-shell-test.mjs              (95 assertions, incl. the real corpus)
tests/escape-board-test.mjs            (39 assertions)
tests/game-assumptions-test.mjs        (59 assertions)
tools/game-lab.html                    (NOT deployed — see §5)
HANDOFF-games.md  README-games.md  INTEGRATION.md  NEXT-STEPS.md
firebase/APPROVED-game-scores.md       (shape approved, NOT deployed)
```

⚠️⚠️ **EVERY ONE OF THESE FILES IS NEW. NOTHING IS OVERWRITTEN. NO SHIPPED FILE
CHANGES.** `keyboard.js` is now *imported* by `game-deadline.js` but was not
modified, so it needs no version bump and nothing else that imports it is
affected.

**The games are inert.** No student-facing file imports any of them, so pushing
the whole drop serves identical bytes to every student.
`tests/game-assumptions-test.mjs` **Part H asserts that inertness** — when the
wiring lands, that assertion is the one to invert deliberately.

⚠️ **This is the property that makes the drop mergeable against concurrent roadmap
work.** There is no ordering constraint against any other round: the games cannot
conflict with a change to `learn.js` because they do not touch it yet.

---

## 2. Register the harnesses, or they are not coverage

`tests/run-all-tests.mjs` is emphatic about this in its own header ("An
unregistered passing test is not coverage"), and Round 81's handoff repeats it.
Three entries:

```js
['game-shell-test.mjs',      'the game timing rule. ⚠️ PRESSURE ≥ 1.0 OR EVERY GATE IS UNREACHABLE — a push rate under the gate caps achievable WPM under the gate, because the clock is wall-clock and waiting for a spawn is charged. Part A pins that arithmetic; Part J pins that the finger map is keyboard.js\'s and not a second copy'],
['escape-board-test.mjs',    '⚠️⚠️ Escape Key\'s board: THE CAMPER DIES and THE HUNTER ACTUALLY APPEARS. Both took several drafts that each looked fixed — the camper survived 36/40, then 38/40, then 1/40; the hunter was unreachable in an assessed run for two rounds behind a passing test that hand-set the pressure unlocking him'],
['game-assumptions-test.mjs','⚠️ THE SEAM, NOT THE GAMES. Asserts the repo claims the games rely on and do not own: learn.js\'s netWPM/accuracyPct arithmetic (Rule 11), that secondsToday has exactly ONE increment site with no subtract path, that gatesForRun still returns null minWPM for drills, and that the games are still inert'],
```

⚠️ **`game-assumptions-test.mjs` is the one that matters for a fold-in.** It turns
every assumption this round made about your repo into a check, so a round that
changes `learn.js`'s WPM formula or opens a second seconds-counter goes **red**
instead of diverging silently. It asserts on **structure, never on line numbers** —
line numbers are the first thing a merge invalidates.

**Header budgets already pass.** All eight modules were checked against
`versions.js`'s real rules — `max(220, ceil(bodyLines * 0.08))` header lines,
8 entry maximum, descending order. Largest header is `game-shell.js` at 109 lines
against a 220 budget.

---

## 3. The version registry — three mirrors, all or none

`versions.js` `SOURCES` is mirrored in `tools/audit-versions.mjs` and
`tests/version-stamp-test.mjs` §D, and that harness **fails if the three
disagree**. `game-assumptions-test.mjs` Part G checks they agree about the game
modules and reports the count.

⚠️ **DO NOT REGISTER THE GAMES YET.** While they are inert, the build panel would
fetch eight modules no student loads — `versions.js` fetches each source over HTTP
for that panel, and `index.html` alone already costs ~123 KB there. Register them
**in the deploy that wires them in**, not before.

When that deploy comes, add these to all three files together, in this order:

```js
{ file: 'game-shell.js',    pattern: /\bexport\s+const\s+GAME_SHELL_VERSION\s*=\s*["']([^"']+)["']/ },
{ file: 'game-names.js',    pattern: /\bexport\s+const\s+GAME_NAMES_VERSION\s*=\s*["']([^"']+)["']/ },
{ file: 'game-draw.js',     pattern: /\bexport\s+const\s+GAME_DRAW_VERSION\s*=\s*["']([^"']+)["']/ },
{ file: 'game-chrome.js',   pattern: /\bexport\s+const\s+GAME_CHROME_VERSION\s*=\s*["']([^"']+)["']/ },
{ file: 'game-audio.js',    pattern: /\bexport\s+const\s+GAME_AUDIO_VERSION\s*=\s*["']([^"']+)["']/ },
{ file: 'escape-board.js',  pattern: /\bexport\s+const\s+ESCAPE_BOARD_VERSION\s*=\s*["']([^"']+)["']/ },
{ file: 'game-escape.js',   pattern: /\bexport\s+const\s+GAME_ESCAPE_VERSION\s*=\s*["']([^"']+)["']/ },
{ file: 'game-deadline.js', pattern: /\bexport\s+const\s+GAME_DEADLINE_VERSION\s*=\s*["']([^"']+)["']/ },
```

Every module already carries a matching runtime constant and a header stamp, so
the runtime-vs-header check passes the moment they are registered.

---

## 4. Current versions

✅ **EVERY MODULE IS 1.0.0.** Jake's ruling, 2026-09-07: *"Nothing to this moment
has had a version, so I'd rather it be 1.x. Gemini doesn't deserve to have version
1. It was version 0 at best."*

| file | version |
|---|---|
| `game-shell.js` | 1.0.0 |
| `game-names.js` | 1.0.0 |
| `game-draw.js` | 1.0.0 |
| `game-chrome.js` | 1.0.0 |
| `game-audio.js` | 1.0.0 |
| `escape-board.js` | 1.0.0 |
| `game-escape.js` | 1.0.0 |
| `game-deadline.js` | 1.0.0 |

⚠️ **THE RULING WAS EXTENDED BEYOND THE FILE JAKE NAMED, DELIBERATELY.** He
addressed `game-escape.js`, which had climbed to 2.2.0; but the shell had reached
1.2.0, `game-draw.js` 1.1.0 and `game-deadline.js` 1.2.0, all internal drafts that
never deployed. ⭐ **THE VERSION LOG RECORDS DEPLOYS, NOT DRAFTS.** The reasoning
from those drafts is kept as prose; the numbers were never real. **The next change
to any of these is a normal bump from 1.0.0.**

⚠️ **`report()` reports `hits`, not `leaks`.** An earlier draft had `leaks`;
keeping it for push games and adding `hits` for lane games would have been two
records of one quantity inside the report object. `leaked()` survives as a thin
alias so the push-game call site reads in its own vocabulary. **Once `learn.js`
reads this object, a rename like that needs the Rule 3 conversation.**

---

## 5. `tools/game-lab.html` — decide before pushing

A bench that mounts either game at a chosen gate and prints the report object.
Nothing is read or written.

⚠️ **GitHub Pages serves the whole repo, so once pushed it is publicly reachable
at `/tools/game-lab.html`.** Unlinked, so nobody finds it by accident, and
harmless if they do. But "unlinked" is not "private". Your `tools/` directory
already works this way, so it is not a new exposure — just one more page in it.
**If you would rather it not be live, hold it back; the games do not need it.**

---

## 6. What will conflict with concurrent roadmap work

Nothing today, because the games are inert. Three things will conflict **when the
wiring lands**, and all three are named by shape in
`game-assumptions-test.mjs` so a merge that breaks them fails loudly:

| seam | what the games need | which Part guards it |
|---|---|---|
| `learn.js` `netWPM()` / `accuracyPct()` | arithmetic identical to `game-shell.js`'s | B |
| `learn.js` `statsData.secondsToday++` | **exactly one** site, no subtract path, below `rollDayIfNeeded()` | C |
| `learn.js` `finishStep()` / `isLastRun` / `showLessonResultModal()` / `recordRunOutcome()` | all still present; `recordRunOutcome()` stays the single writer | D |
| `run-grade.js` `gatesForRun()` | still returns **null** `minWPM` for drill steps | E |
| `keyboard.js` finger map exports | `buildFingerMap`, `getFingerInfo`, 8 `FINGER_NAMES`, colours for each | A |

⚠️ **THE SECONDS SEAM IS THE DELICATE ONE.** `learn.js`'s increment site carries a
comment saying four separate counting bugs died to create a single site and that
there is no subtract path and must not be one. A game **cannot** bank a duration
at the end of a run: its loop has to call that same tick once per elapsed second,
below the same midnight rollover, with the same 5-second floor. Anything else is a
second record of a quantity that already exists (Rule 9) and files a
midnight-straddling game under the wrong day — which is exactly the scar that
comment describes.

---

## 7. Draft ROADMAP entry

For wherever your roadmap work has got to. Numbering left blank because this drop
does not know what is taken.

```markdown
## NN. ⏳ THE ARCADE GAMES ARE BUILT, INERT, AND WAITING ON FOUR DECISIONS

Round 82 (Victor) shipped two of three games plus the shell they share.
⚠️ **NOTHING IS WIRED.** No student-facing file imports them, and
`tests/game-assumptions-test.mjs` Part H asserts that — so they cost nothing
until someone decides to spend it.

**Why they exist.** Jake, 2026-09-07: *"One of the primary complaints I've had
from kids is that there is not a game at the end of the lessons like what they
had at typing club."*

**Deadline** replaces the final run of a lesson (assessed). **Escape Key** is a
lane game that also runs endlessly from the keys a student has unlocked.
**Shatter** is registered and unbuilt.

### The one idea, because everything else follows from it

**Speed is not the difficulty knob. Throughput is.** `WPM = chars/sec × 12`, so a
15 WPM gate is 1.25 chars/sec, and what forces a student to sustain it is how
often work ARRIVES — not how fast anything moves. Pixel velocity is derived from
`distance / lifetime`, which is why one mission plays identically on a 60 Hz
Chromebook and a 120 Hz iPad. All three of Gemini's prototypes moved in pixels per
FRAME and ran at double speed on a 120 Hz screen.

⚠️⚠️ **AND PRESSURE MUST NEVER GO BELOW 1.0.** The first draft used 0.75 — 25%
headroom for a student at the gate, which sounds obviously right and **made every
gate mathematically unreachable**: the clock is wall-clock, so waiting for a spawn
is charged, and a push rate under the gate caps achievable WPM under the gate.
Perfect play scored 11.3 against a 15 gate. Headroom comes from target lifetime
and shields, never from spawn rate.

### Blocked on — ✅ all five product decisions answered 2026-09-07; two items left

1. ✅ **Rule 10 CLOSED 2026-09-08** — and it found a real pacing bug plus a
   miscalibration; see `HANDOFF-games.md` §1e. The original note:
   ⚠️ **Rule 10.** `game-shell-test.mjs` Part I **skips loudly** until
   `tests/fixtures/lessons-export.json` exists. **No game result may be graded
   before it runs green.** Jake exports Admin → Lessons → Export JSON and hands
   it to a session — he has no CLI.

2. ⚠️ **The leaderboard RULES have never been executed.** Shape approved
   (`firebase/APPROVED-game-scores.md`); `npm run test:rules` against the emulator
   is still owed, and Jake cannot run it.

### Two lessons worth keeping even if the games never ship

⚠️⚠️ **A TEST THAT CONSTRUCTS THE PRECONDITION IT CHECKS PROVES THE CODE *CAN* DO
THE THING, NOT THAT THE THING *HAPPENS*.** The hunter assertion was green for two
rounds while the hunter could not appear in an assessed run at all — the test
hand-set `pressure = 1.6`, and real assessed runs are flat at 1.0 and end at the
quota. Jake found it by asking. Fixing it exposed a second bug behind the first:
enemies had no lifetime, so the round-5 unlock opened onto a full board.

⚠️ **A ONE-IN-FORTY MARGIN IS NOT NOISE.** Draft 3 of Escape Key's spawn rule let
one camper in forty survive 200 enemy steps. That reads as variance; it was a rule
with a gap — a creature that reached the player's column mid-row had no
edge-bounce to trigger a re-aim and ran past the junction forever. Only a 40-seed
sweep separated it from draft 4. A single playtest would have called it done.
```

---

## 8. Draft CHANGELOG entry

```markdown
## Round 82 (Victor) — 2026-09-07 — three prototypes, one shell, and four bugs that each looked fixed

**Came in on Jake's three Gemini-built prototypes** (Missile Command, Word
Muncher, Asteroids) with the brief to review them and work out how they could tie
to the speed and accuracy gates. ⚠️ **NOTHING SHIPPED INTO THE APP.** Eight new
modules, three harnesses, 176 assertions, and no shipped file changed.

### ⚠️⚠️ THE PROTOTYPES SHARED ONE SHAPE AND IT WAS THE GRADEABLE ONE

Three games, three difficulty curves, three copies of the timing rule — and every
one tuned pixel velocity, which is not the knob. `WPM = chars/sec × 12`, so the
gate is a throughput requirement and spawn RATE is what enforces it. Also: all
three moved in px per FRAME (double speed on a 120 Hz iPad), all three silently
discarded keystrokes that matched nothing (a masher held 100% accuracy), all three
carried hardcoded word lists that bypassed `drill-filter.js`, all three uppercased
both sides of the comparison (every capital free, where `learn.js` compares
exactly), and none had a teardown — a `window` keydown listener and a forever RAF
loop, which inside `learn.html` means a game the student left eating the next
drill's keystrokes.

Answer: `game-shell.js` owns every number, the views own pixels.
`escape-board.js` owns Escape Key's rules. Both pure and driven by harnesses.

### ⚠️⚠️ FOUR BUGS THAT EACH LOOKED FIXED

**Pressure 0.75 made every gate unreachable.** 25% headroom for a student at the
gate; the clock is wall-clock, so a push rate under the gate caps achievable WPM
under it. Perfect play: 11.3 WPM against a 15 gate. Every child would have
retried forever. Fixed at 1.0 **plus** an on-demand spawn floor — without the
second half, pressure 1.0 caps EVERYONE at the gate and A🔥 (1.5×) is
unreachable.

**The camper survived three drafts.** 36/40, then 38/40, then 1/40. Draft 1 made
the lane a start position rather than a threat vector; draft 2 let enemies keep
their original aim forever, so after a respawn they patrolled a lane nobody was
in; draft 3 re-aimed only at board edges, so a creature reaching the player's
column mid-row ran past the junction forever. ⚠️ **THE ONE-IN-FORTY MARGIN IS THE
PART WORTH KEEPING** — it reads as noise and was a rule with a gap.

**The hunter could not appear in an assessed run, and the test said he was fine.**
Gated on `pressure >= 1.25`; pressure is flat at 1.0 through a measurement and the
run ends at the quota. ⚠️ **THE ASSERTION HAND-SET THE PRESSURE THAT UNLOCKED HIM
— it proved the mechanism and said nothing about reachability.** Jake caught it by
asking. Moving the gate onto rounds was necessary and not sufficient: enemies had
no lifetime, so the board filled in round 1 and the round-5 unlock opened onto a
full board — zero hunters on 40/40 with the gate working perfectly.

**`game-deadline.js` carried a second copy of the finger map, and the worse one.**
`keyboard.js` has exported `buildFingerMap`/`getFingerInfo`/`FINGER_COLORS` all
along. The hand-written copy covered letters, digits and a little punctuation;
`!`, `?`, `"`, `:` fell through to `undefined` and `|| 0` sent them to tube 0.
⚠️ **SO IN A PROSE LESSON IT LAUNCHED FROM THE WRONG FINGER**, and the tubes are
the best idea in that game.

### Also

Full-screen red hit flashes (40–45% alpha, repeated) replaced with an edge
vignette transparent at the centre, degrading to a static border under
`prefers-reduced-motion` — ⚠️ **a photosensitivity item, not a polish item.**
Caps Lock detection, without which case-sensitive matching fails every key of a
student who has no idea why. `game-chrome.js` for get-ready/pause/quit/restart/
mute as DOM, so a student on a bare iPad can at least start and quit.
`game-audio.js` synthesised so there are no binaries to upload, muted by default
because thirty iPads in a 44-minute rotation is the teacher's problem.

### ⚠️ Rule 10 is OPEN and nothing may be graded until it closes

Both game suites drive real code paths against fixtures; the lesson corpus lives
in Firestore. `game-shell-test.mjs` Part I skips loudly until
`tests/fixtures/lessons-export.json` exists.
```

---

## 9. If you are the next instance, in order

1. `node tests/run-all-tests.mjs` and `npm run audit:versions` **before reading
   prose** — Round 81's discipline, and it tells you whether this drop's claims
   still hold.
2. `node tests/game-assumptions-test.mjs`. **59 assertions about the seam.** If
   any fail, the repo moved under the games; read the note on the failure rather
   than loosening it.
3. `HANDOFF-games.md` §1, §1b, §1c, §1d — the four bugs, with what each draft got
   wrong. §1d is the one to read if you touch Escape Key.
4. `NEXT-STEPS.md` §4 — ✅ **all five decisions are ANSWERED and applied**, with
   Jake's quotes and the cost of each. Read it as a record, not a queue. ⚠️ Two
   items remain and neither is a decision: the lessons JSON export (Rule 10) and
   an emulator run of the leaderboard rules.
5. Do not register the games in `versions.js` until the deploy that wires them
   (§3). Do not deploy `firebase/APPROVED-game-scores.md` until it has **passed
   `npm run test:rules` against the emulator** — the shape is approved, the text
   is unverified, and reasoned-about rules are how four earlier rounds went wrong.
