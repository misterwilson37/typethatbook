# Round 162 — games don't count time nobody typed

**Already on `main` — nothing to upload.** (Round 161 is on main too.) No Firestore rules
change. Three code files changed, all games: `game-deadline.js`, `game-shatter.js`,
`game-escape.js`.

## Order

1. Nothing to upload.
2. To reach tabs that are already open: Firestore → `settings` → `appVersion` → field
   `nonce` → increase it by one. Open tabs reload within ten minutes.

## What changes

* **Deadline** (Arcade and the end-of-lesson run): stop typing for 3 seconds and the day's minutes
  stop going up; they resume on the next key. Shatter, Shards and Escape Key already did this.
* **All games:** holding a key down no longer keeps the minutes going.
* **Grades don't change** — Deadline's WPM and pass/fail are computed exactly as before.

## Check

Open the Arcade, start Deadline, type a word, then take your hands off. Watch the day's total
in the side panel: it should stop within about 3 seconds while the game keeps running.

Expect **ALL 121 HARNESSES PASS.**
