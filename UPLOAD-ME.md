# Round 163 — mashing doesn't count either

**Already on `main` — nothing to upload.** No Firestore rules change. Three game files changed:
`game-deadline.js`, `game-shatter.js`, `game-escape.js`.

## Order

1. Nothing to upload.
2. To reach tabs that are already open: Firestore → `settings` → `appVersion` → field
   `nonce` → increase it by one. Open tabs reload within ten minutes.

## What changes

* **All games:** a run of wrong keys in a row stops the day's minutes until the next correct key.
  Same number as School's drills — the number of different keys in play, between 2 and 5 (so 5 for
  almost every game). No message or overlay; the game keeps going. A single typo still counts.
* Still in place from Round 162: no keys for 3 seconds, or a key held down, also stops the minutes.
* **Grades and accuracy don't change.**

## Check

Start Deadline in the Arcade, type a word, then mash letters that aren't on screen. The day's total
should stop going up almost at once, then start again when you type a correct letter.

Expect **ALL 121 HARNESSES PASS.**
