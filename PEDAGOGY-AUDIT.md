# PEDAGOGY-AUDIT.md — why students stalled in lesson mode

<!-- v2.0.0 — Round 2 (Dvorak), 2026-08-01. MAJOR, signed off by Jake. §3.2 was wrong. It reasoned
     from learn.js defaults because the curriculum had not been exported yet. The
     real gates are a sensible per-unit ramp; the actual wall is step LENGTH.
     Rewritten against ttb-lessons-2026-08-01.json (47 lessons, 105 steps). -->

**The reported symptom:** test students in the 2025–26 rotation never complained
about `learn.html`, but never got far. They hit a point where they could not pass,
and when asked, attributed it to their own typing.

**The finding:** they were correct that they could not pass, and wrong about why.
Six mechanisms compound into a wall. None of them are about student ability, and
one of them made the wall invisible from the teacher side.

Derived from `learn.js` v1.7.1 and the curriculum export
`ttb-lessons-2026-08-01.json` — 47 lessons, 105 steps, 18,564 characters.

**v1.0.0 of this document reasoned from the code's defaults (`minWPM: 15`,
`minAccuracy: 85`) because the curriculum had not been exported yet, and was wrong
about the gates as a result.** The authored gates are fine. §3.2 has been rewritten.
The mechanisms in §3.1 and §3.3–§3.6 were unaffected by the correction.

---

## 1. What the research supports

This literature is thin and should be quoted with care. The most-cited teacher
reference — Hartman's 2005 QIAT compilation — states outright that there is no set
standard for how fast children should type at a given grade level, and the authors
of the largest recent keyboarding study (Donica et al., *OJOT* 2019) note that
research on effective keyboarding instruction is scarce. Much of what circulates
online as "grade-level WPM benchmarks" is commercial typing-site content. The
firmer sources are state standards, the NBEA criteria, and the OT literature.

What holds up, and what it implies here:

| Finding | Source | Implication for `learn.js` |
|---|---|---|
| Speed is a **course outcome**, not a per-drill gate | Utah Keyboarding 1 (grades 7–9): 25 WPM / ≤6 errors by end of **nine weeks**, 35 WPM by semester, on two-minute timed writes using **high-frequency words**. NBEA 1987: 15 wpm elementary, 25 wpm middle school as criteria | A 15 WPM gate on lesson 1 step 1 is the research's *exit* number used as an *entry* requirement |
| Novice rates run well below published benchmarks | Gerlach: 6th graders averaged **9.71 wpm** after a 6–8 hour course. An Illinois district review found teachers setting grade 4–5 goals as low as 7 WPM | 15 WPM is above what a typical mid-course 6th grader produces at all, let alone on drill material |
| Technique, not speed, is the elementary criterion | Utah's current 5th-grade proficiency assessment grades whether the student keys **by touch**, not a speed threshold | The anti-hunt-and-peck machinery is the valuable part and should not be traded for speed |
| Material changes the number substantially | Prose types faster than unfamiliar words, symbols, or random characters; the Aalto 136M-keystroke study explicitly distinguishes randomised phrases from practiced text | Random letter groups are the **hardest** material, so a uniform WPM gate is hardest on the drill steps |
| **~85% success is the learning sweet spot** | Wilson et al., *Nature Communications* 2019 — optimal training error rate ≈ 15.87%; framed against flow, where low accuracy maps to anxiety rather than learning | `minAccuracy: 85` is **theoretically well-chosen and should stay.** The speed gate is the problem |
| Blocked → then varied is right for beginners, and for children specifically | Porter & Magill: systematically increasing contextual interference beat both blocked and varied practice for beginners. Meta-analytic work finds the contextual-interference advantage in adults but generally **not** in children during acquisition, with several studies favouring blocked practice for ages 7–12 | `generateReachPattern()` is already correct — see §2 |

---

## 2. What the code already gets right

Do not "fix" these.

- **`generateReachPattern()`** runs isolated pairs (`gfgf jhjh`) → reversed pairs
  (`fggf jhhj`) → mixed (`gfhj fgjh`). That is the progressive-contextual-interference
  schedule the beginner literature supports, and it is the schedule that works for
  this age group rather than the adult one.
- **`expandKeySetWithHomeCompanions()`** forces the same-finger home key into every
  reach drill. This is the strongest anti-hunt-and-peck mechanic in the file, and
  hunt-and-peck is the thing that actually caps a student's ceiling for life
  (Donica: ~35 wpm hunt-and-peck vs. 70+ with proper technique).
- **`anchorEnforced` as a static hint** rather than a reactive popup — "informs
  without alarming," per the comment in `beginStep()`. Correct.
- **The hard stop at 5 consecutive errors** does pause `stepSeconds`
  (`clearInterval(timerInterval)`), and the spam restart at 10 gives a clean slate.
  Both are humane. The hard stop is the *only* place the graded timer pauses.
- **`missedChars` tracking and the remediation links** back to earlier lessons.

---

## 3. The six mechanisms

### 3.1 One gate, every step — so the hardest step is the first

`showStepModal()` and `showLessonResultModal()` both read `currentLesson.gates`.
There is **no per-step gate anywhere in the schema** — `lessons-admin.js` writes
`gates` only at lesson level. So the `key_pattern_auto` drill introducing a new key
is graded at the identical WPM threshold as the `sentence_list` step of real words
at the end.

Because random letter groups type materially slower than prose, **15 WPM on the
introduction drill is a harder requirement than 15 WPM on the closing sentences.**
The lesson's difficulty curve runs backwards.

### 3.2 The gates are fine. Step *length* is the wall.

The authored gates ramp per unit, and sensibly:

| Unit | Gate | Per-keystroke budget |
|---|---|---|
| 1 — home row | 10 WPM / 90% | 1.20 s |
| 2 — index reaches | 12–14 / 88% | 1.00–0.86 s |
| 3 — e i, w o | 15–18 / 85% | 0.80–0.67 s |
| 4 — rest of alphabet | 15–20 / 85% | 0.80–0.60 s |
| 5 — number row | **12** / 85% | 1.00 s |
| 6 — shift, capitals | 18–20 / 85% | 0.67–0.60 s |
| 7 — graduation | 25 / 90% | 0.48 s |

That is a ramp to the intended 25 WPM exit, and resetting to 12 for the number row
is correct — new motor territory, so the gate resets. **Do not "fix" the gates.**
The only two worth revisiting are unit 4's jump to 18 and unit 6's 20, which are the
tightest budgets outside graduation.

The wall is that six steps are longer than a class period's typing block:

```
LONG STEPS — minutes of continuous typing, no breaks, no retries
lesson     # type           chars gate | 10wpm | 12wpm | 15wpm | 18wpm | 20wpm
u4_l3      5 sentence_list    477   18 |  9.5  |  8.0  |  6.4  |  5.3  |  4.8
u4_l4      5 sentence_list    582   18 | 11.6! |  9.7  |  7.8  |  6.5  |  5.8
u4_l5      5 sentence_list    563   18 | 11.3! |  9.4  |  7.5  |  6.3  |  5.6
u5_l6      2 sentence_list    688   15 | 13.8! | 11.5! |  9.2  |  7.6  |  6.9
u6_l1      3 sentence_list    608   18 | 12.2! | 10.1! |  8.1  |  6.8  |  6.1
u6_l2      1 sentence_list    789   20 | 15.8! | 13.2! | 10.5! |  8.8  |  7.9

! = longer than the entire 10-minute daily block
```

`u6_l2` step 1 is 789 characters. At its own gate of 20 WPM — a flawless run — that
is **10.5 minutes**. The step cannot be finished at the pace required to pass it.

And nothing survives the bell. The lesson WAL persists `statsData` only:

```js
localStorage.setItem(LEARN_WAL_KEY, JSON.stringify({
    v: 1, uid: currentUser.uid, savedAt: Date.now(), stats: { ...statsData }
}));
```

`drillPos`, `currentStepIdx`, `chars`, `mistakes`, and `stepSeconds` are **not**
persisted. Combined with §3.6 (`saveProgress()` only fires on the final step):

- bell rings mid-step → the whole step is lost, back to character 1
- bell rings after clearing steps 1–4 of 5 → those clears are lost too

So a student who reaches a step longer than their remaining block time is in a
closed loop: ten minutes of work, lost, same step from scratch tomorrow, forever.
**Lowering `minWPM` would not help** — they still run out of clock mid-step. This is
the one mechanism where "I can't do it" was mechanically correct.

Which step traps them depends on their sustained speed: 10 WPM → `u4_l4`;
12 WPM → `u5_l6`; 15 WPM → `u6_l2`. The 6-to-9-minute steps immediately before those
consume nearly the whole block, so any retry pushes them over. Expected stall point
at realistic middle-school speeds: **unit 4**, around "All 26 Letters."

**They never saw the exit.** `renderMap()` shows the graduate link only when every
unit 1–6 lesson is passed — eight lessons past `u4_l6` where the letters are
complete, and behind the two longest steps in the curriculum. The escape hatch sits
on the far side of the wall. (Jake's call 2026-08-01: leave the gate where it is. If
the wall comes down the hatch is not needed.)

**Curriculum sizing is otherwise well judged.** 18,564 characters is 3.4 hours at
each lesson's own gate with zero retries — 21 school days of 10-minute blocks in a
~45-day rotation, leaving room for books. It only breaks because the retry
mechanics in §3.5 multiply it three- to four-fold.

### 3.3 Grade C fails — and errors inflate WPM

`calculateGrade()` requires both gates simultaneously; meeting one and missing the
other returns `'C'`, and `passed` requires `B` or better.

| Performance | Grade | Result |
|---|---|---|
| 14 WPM, **100%** accuracy | C | **fail** |
| 15 WPM, 85% accuracy | B | pass |

Worse, in `handleDrillKey()` **`chars++` fires before the correct/incorrect branch**
(~line 992), so every wrong keystroke counts toward the WPM numerator. Wrong keys
are fast to press. Same student, same 42 seconds, same 49-char drill:

```
  0 deliberate errors → 14 WPM, 100% acc → C → fail
  1 deliberate error  → 14 WPM,  98% acc → C → fail
  2 deliberate errors → 14 WPM,  96% acc → C → fail
  3 deliberate errors → 15 WPM,  94% acc → B → PASS
```

**Three intentional mistakes convert a failing perfect run into a pass.** The
reported figure is gross keystroke rate, not the net WPM every standard assessment
reports.

Compounding: `Backspace` returns early without incrementing `chars`, and `mistakes`
is never decremented. Correcting an error costs time, earns no credit, and does not
remove the penalty — the app actively teaches students not to fix mistakes.

### 3.4 The graded timer never pauses for thinking

`stepSeconds` increments every second whenever `drillPos > 0`, unconditionally.
`LEARN_IDLE_THRESHOLD` (3 s) gates `learnActiveSeconds` — the time-on-task credit —
but **not** the timer in the WPM denominator.

Talk to the class mid-drill, or let a student look up at the board for fifteen
seconds, and that time lands in the WPM calculation. On a 39-second budget one
interruption makes the gate arithmetically unreachable — and then
`getGradeMessage()` says *"So close on speed! 3 more WPM with that same accuracy
and you pass."* The student was fast enough. They paused. There is no way for them
to see the difference.

Related, and probably inverted intent:

```js
// Stop counting time once errors hit threshold (but before hard stop)
if (!ggAllowMistakes && drillConsecutiveMistakes >= DRILL_STOP_TIME_THRESHOLD) {
    learnLastInputTime = 0;
}
```

The comment reads as protecting the student's score. The effect is to stop
`learnActiveSeconds` accrual — so a struggling student stops earning credit toward
the daily/weekly goal while `stepSeconds` keeps running and degrading their WPM.
Struggle is penalised twice and protected zero times. This looks like it meant to
pause `timerInterval`.

### 3.5 Failing the last step replays the entire lesson

`showStepModal()` retries the failed step, correctly. But
`showLessonResultModal()`'s failure path calls `startLesson(currentLesson)`, which
sets `currentStepIdx = 0` **and** calls `showIntro()`. Clear steps 1–4, miss the
gate on step 5, and you redo the intro animation and all five steps.

Expected drills typed to clear one lesson, where the floor is the step count:

| Per-step pass rate | 3 steps | 4 steps | 5 steps | 6 steps |
|---|---|---|---|---|
| 80% | 4.4 | 5.9 | 7.5 | 9.1 |
| 60% | 7.2 | 10.0 | 12.8 | 15.6 |
| 50% | 10.0 | 14.0 | **18.0** | 22.0 |
| 40% | 15.0 | 21.2 | 27.5 | 33.8 |
| 30% | 25.6 | 36.7 | **47.8** | 58.9 |

At roughly 55 s per drill-plus-modal cycle, a 5-step lesson costs 6.9 minutes at an
80% pass rate and **43.8 minutes at 30%** — i.e. 1.45 vs. **0.23** lessons per
10-minute daily block. Gate setting alone moves throughput by 6× on identical
students. That is the "never got very far."

And because `isUnlocked()` requires `userProgress[prev.id]?.passed === true` on a
flat sorted list, **one unpassable lesson freezes the whole remaining curriculum.**
There is no attempt-based unlock.

### 3.6 It was structurally invisible

`saveProgress()` is called from exactly one place — `showLessonResultModal()`, which
runs only on the **final step**, and only when `countsAsTime` (grade ≠ F).
Therefore:

- A student who fails **step 2** forty times writes **zero** `lessonProgress` records.
- Reaching the final step and earning an F writes **zero** records.
- `attempts` counts only completed lessons, undercounting exactly the cases that matter.
- `timeSpentSeconds` adds only the final step's `stepSeconds`, not the lesson's.

In the admin per-student grid (`lessons-admin.js`, `loadStudentProgress`) a lesson
renders as one of `✓ passed` / `attempted` / `not started`. A student who ground on
step 2 every day for two weeks renders as **`not started`** — visually identical to
one who never clicked it. `reports.html` does not read `lessonProgress` at all;
it is time-on-task only.

So the only remaining signal was asking the students, and the attribution
literature predicts exactly the answer received: failure attributed to internal,
stable, uncontrollable causes produces shame and withdrawal, and repeated failure
with no visible cause leads students to conclude they cannot improve. When a system
fails you and shows you no reason, "it's me" is the only available explanation.
Their politeness was not stoicism; it was the predictable output of an unexplainable
gate.

---

## 4. Agreed changes

Approved by Jake 2026-08-01. Ordering and implementation notes in `HANDOFF.md` §11.

**Batch A shipped in `learn.js` v2.0.0** — items 0, 0b, 3, 4, 5, 6, 7, 9, plus the
grade-F record from item 1. **Batch B is outstanding** — the rest of item 1
(`furthestStepIdx`, `stepAttempts`, `stepFailures`, the `timeSpentSeconds` fix) and
item 2 (the stuck-student view in `lessons-admin.js`).

### Batch A, measured against the real curriculum

```
total runs: 176 (was 105 authored steps)
runs over a 10-minute block: 0        <- was 6
stub runs under 40 chars:    0
longest run: 193 chars (~3.1 min at the slowest passing pace)
character integrity across all 105 steps: PASS
```

`u5_l6` step 2 — 688 characters, 9.2 minutes at its 15 WPM gate — is now five runs
of ~137 characters at 1.8 minutes each. `u6_l2` step 1 — 789 characters, 10.5
minutes — is six runs of ~130. Chunks break only at spaces, no run opens on a space,
and rejoining every chunk set reproduces its source exactly.

Grade model, retested at an 18 WPM / 85% prose gate: 14 WPM at 100% accuracy now
returns C and **advances** (it previously failed while 18 WPM at 85% passed). A🔥 at
1.5× needs 27 WPM instead of 36. On accuracy-only drill runs, A🔥 is a zero-mistake
run — measured from the mistake counter, not from rounded accuracy, because 99.6%
rounds to 100 and should not earn a badge that says perfect.

### Summary of the full list

0. **Chunk any step over ~150 characters** into sub-runs, in the engine rather than
   the data, so all 47 existing lessons and everything authored later are fixed
   without re-editing documents. `buildSequence()` already returns a flat array;
   split on group/word/sentence boundaries. 150 chars is 30–60 s at these gates,
   matching the `game.js` sprint length. **Nothing else matters until a step fits
   in a class period.** Jake approved 150 on 2026-08-01.
0b. **Persist `drillPos` and `currentStepIdx` in the lesson WAL** so the bell stops
   erasing work. Required even with chunking.
1. Record every finished step, pass or fail, including F. Add `furthestStepIdx`,
   `stepAttempts`, `stepFailures`. Fix `timeSpentSeconds`.
2. A "stuck student" view in admin.
3. WPM from **correct** keystrokes only.
4. Pause `stepSeconds` on idle; fix the `DRILL_STOP_TIME_THRESHOLD` inversion.
5. Failed final step retries that step, not the lesson.
6. Grade C advances — accuracy gates progression, speed sets the badge.
7. Per-step gates: drill steps accuracy-only, prose step carries the speed number.
8. ~~`minWPM` scales by unit~~ — **already done in the authored curriculum.** Only
   unit 4's 18 and unit 6's 20 are worth revisiting. **Never by grade level** — see below.
9. `A🔥` recalibrated to be reachable. The award stays.

### Two decisions worth preserving

**No grade-level scaling.** Rejected by Jake, and the reasoning is load-bearing: an
8th grader may have had him twice or never before, so grade level carries no
information about skill. **Unit** scaling is grade-independent and self-calibrating —
a student's position in the curriculum *is* the level signal. An experienced student
clears the early units in days and meets a 25 WPM gate at the end because they are
ready for it; a novice meets a 9 WPM gate in unit 1 because that is where they are.
Nobody is asked for 25 in week one, and 25 remains the exit number for everyone.

**Lesson mode is not the only path.** Students who have learned all the letters have
a sanctioned exit into `game.html` (typing books), and both sides are tracked.
Lesson mode does not have to carry every student to 25 WPM by itself, which removes
most of the pressure to gate aggressively.
