# The two lab pages — how to run them, and what they are for

⚠️⚠️ **NEITHER PAGE SHIPS.** They are not linked from anywhere, they touch no
Firebase, they write no typing time, and they grade nothing. They exist so Jake
can look at a thing before anyone commits to it.

## Running them

Both are ES modules, so `file://` will not work — the browser blocks module
imports from the filesystem. From the folder these files are in:

```
python3 -m http.server 8000
```

then open:

* `http://localhost:8000/shatter-preview.html` — the panes, static, with a
  slider for typing progress and a seed control.
* `http://localhost:8000/shatter-drift-lab.html` — **playable.** Click the
  canvas and type. Space warps, Escape drops the lock.

If the page is blank, it is almost always the module thing above.

## What each one is asking

**`shatter-preview.html`** asks *do the windows look right*. Reroll the seed a
few times — the whole claim is that no two are alike, and that is worth
checking rather than taking on trust.

**`shatter-drift-lab.html`** asks *does drift-and-wrap feel better than the
radial approach, and can a kid survive it*. ⭐ **THE SECOND HALF OF THAT
QUESTION IS THE ONE THAT MATTERS** and it is the reason this is a toy rather
than a branch.

## ⚠️ What the drift lab shares with the real game, and what it does not

**Shared, so the comparison is honest:**

| | |
|---|---|
| `game-sprites.js` | the panes, the prism, the shots — identical |
| `game-draw.js` | the shards, the finger palette — identical |
| `shatter-board.js` | `splitTarget()` / `splittable()`, the whole split ladder — identical |

**Not shared, because it is the thing under test:** motion. The shipped board
moves panes radially inward on a per-target lifetime the director prices
against the student's WPM gate. The lab gives them free 2D velocity and wraps
them at the edges, with **no lifetime and no arrival**.

⚠️⚠️ **AND THAT IS THE WHOLE DECISION, STATED AS CODE.** In the shipped board
pressure is **time**: every pane has a deadline, and the 990-trial corpus sweep
proved those deadlines are clearable at the gate. In the lab pressure is
**density**: panes you never clear accumulate until one hits the prism.
⭐ **NOBODY HAS EVER MEASURED WHETHER A 15 WPM CHILD SURVIVES DENSITY.**

⚠️ Every number in the lab — drift speed, spawn gap, collision radius, the kick
pieces get — is a **guess typed to make it playable**. None of them came from
`game-shell.js` and none has been proved against anything. **Do not copy them
into the app.** If drift wins, they all have to be re-derived from the gate.

## The three controls that are actually experiments

* **wrap off** is the control condition, and it is deliberately bad: a pane
  that leaves is gone, so a student survives by ignoring everything. That is
  what arrival exists to prevent, and it is worth feeling the difference.
* **spawn every** is the density knob. Turning it down is the fastest way to
  find out what "a kid who is slower than you" experiences.
* **trails** is not a proposal. It is on the panel because motion blur makes it
  much easier to see whether the drift paths read as tumbling glass or as
  floating rectangles.

## If drift wins

It is a round of its own, roughly in this order:

1. A harness first, driving a drift board headless over many seeded runs, that
   answers *how long does a 15 / 25 / 40 WPM student last*. Rule 10: it has to
   exist before the board is authoritative.
2. `shatter-drift.js` implementing the same interface `ShatterBoard` exposes.
3. ⚠️ **DELETE THE LOSER IN THE SAME DEPLOY.** Rule 9, and rule 5 — two live
   boards behind a flag is precisely what `tools/game-lab.html` was deleted
   for. A bug found in one is useless when the other runs different code.
4. This page goes too, once its question is answered.
