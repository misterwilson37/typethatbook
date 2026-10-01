# Round 150 (Nesmith) — re-typed ground earns nothing

⚠️ **Assumes Round 149 is deployed.** No Firestore rules change this round.

## Order

1. Upload everything in the zip, keeping the folders. Nothing has to go first.
2. **To close the trick in tabs that are already open** (otherwise they keep the old
   code until reloaded): Firestore → `settings` → `appVersion` → field `nonce` →
   increase it by one. Open tabs reload within ten minutes.

## What changes

* **The `h`-Backspace trick earns nothing.** After a student backspaces, the letters they
  re-type are treated as a correction: they still type and show normally, but they add
  no time, no characters, no streak, and (in School) nothing to the graded WPM. Watch
  the timer go grey if you want to see it — that's it not paying.
* **Honest students lose nothing that matters.** A typo fixed right away is paid exactly
  as before. A long correction just isn't paid until they're back on new ground, and the
  game never auto-pauses them in the middle of it.
* **Characters may read a touch lower** for students who correct a lot — the day count
  is now real progress, not keystrokes.
* **Fake keypresses don't type.** A bookmark that runs JavaScript can't auto-type in
  Library, School, or the arcade.
* **`ttbGate` only exists in your console**, not a student's. `ttbMeter` and `ttbGuide`
  still work for anyone, since they only report.
* **Signing out doesn't reset the Library lesson gate** on that student's machine.
* **School: holding a key types it once.**

## One thing to check for me

On a student login: make a bookmark, set its URL to `javascript:alert('hi')`, open TTB,
and click it. A "hi" popup means bookmarklets run on student machines and this round's
fake-keypress guard is doing real work. No popup means the district already blocks them.

Expect **ALL 118 HARNESSES PASS**.
