# Round 134 (Bodoni II) — 7 files — the Library lesson gate

⚠️ **Assumes Round 133 is deployed** (you confirmed the farming fix is out).
Every file here was checked against the 133 package, not from memory.

| # | path | version | what changed |
|---|---|---|---|
| 1 | `game.js` | 3.52.0 → **3.53.0** | ⭐ the lesson gate |
| 2 | `tests/library-gate-test.mjs` | **1.0.0** | ⭐ NEW, 51 assertions |
| 3 | `tests/open-unit-test.mjs` | — | sandbox + two anchors, see below |
| 4 | `tests/run-all-tests.mjs` | — | registers the new harness (106 → 107) |
| 5-7 | `HANDOFF.md`, `CHANGELOG.md`, `ROADMAP.md` | — | §34, 131a built, 134a |

## ⚠️⚠️ Read before deploying: there is no exemption yet

Every student is judged. A kid with an accommodation that genuinely keeps them
under 15 WPM will be uncounted after their second slow minute each day. The
exemption is ROADMAP 134a and it's next. If you have a student who needs one
*now*, hold this until 134a ships.

## What a student sees

1. Their first minute of Library typing each day always counts.
2. If a minute comes in **under 15 WPM or under 80%**, then at the next sentence
   end (or after a hard-stop resume, or at the next space if 20 seconds pass):
   **Go to lessons** / **Give me another chance — rough morning**.
3. The next minute is judged on its own. Still under →
   **Go to lessons** / **Keep typing — my time won't count**.
4. If they keep typing: the timer greys out and pulses red with
   "⏸ not counting". Nothing is recorded.
5. **One good minute and they're counting again**, with a green "your time is
   counting again" message. Wherever they got better.
6. Tomorrow is a fresh start. A reload today is not.

## Choices I made that you might want to change

* **"Another chance" is once per day.** A kid who recovers and slips again goes
  straight to the "won't count" choice. A rough morning, not a rough every minute.
* **The minute that proves they've improved isn't credited back** — counting
  resumes from the end of it.
* **The buttons ignore input for under a second** — the box appears mid-typing,
  and a focused button fires on Space.
* **Locked means nothing is recorded — not just time, but characters and mistakes
  too.** That one isn't really a choice; see below.

## ⚠️⚠️ Why the lock records nothing at all

Time is counted in three places at once: the live clock, the current run, and the
day. If only the day stops, the run keeps growing — and ⟳ Recalculate rebuilds the
day from its runs, silently undoing the lock. If time stops but characters keep
counting, a run records 500 characters in a frozen minute: **100 WPM, which trips
🚩.** The lock would manufacture the cheating flag. So the gate keeps its own
private measurement to see the kid improve, and records nothing while locked.

## ⚠️ Two real bugs caught before you saw them

* **The run reset missed its log watermark.** `open-unit-test.mjs` — written months
  ago for a different bug — caught it on the first run. Left in, it would have
  corrupted session totals every time a kid locked or unlocked.
* **The proving minute credited itself 100 ms.** The tick that finished it
  unlocked and then counted itself.

## Testing it yourself

At 90 WPM you'll never trigger it. Open the console in a book:

```
ttbGate.force('first')    // then end a sentence or press space
ttbGate.force('second')   // the "won't count" version
ttbGate.state()           // what it currently thinks
ttbGate.reset()           // back to a fresh day
```

## Verify

```
npm install acorn jsdom
node tests/run-all-tests.mjs
```

Expect **ALL 107 HARNESSES PASS**.
