# Round 158 — Adventure gets its own hands drop-down

⚠️ **Assumes Round 157 is deployed** (it ships `hand-skeleton.js`, which this round relies on).
No Firestore rules change. **No new file** — three code files change.

## Order

1. Upload everything in the zip, keeping the folders. Nothing has to go first.
2. To reach tabs that are already open: Firestore → `settings` → `appVersion` → field
   `nonce` → increase it by one. Open tabs reload within ten minutes.

## What changes

* **In Adventure view, ⚙ → Show hands is Off / Human hand / Skeleton hand.** In Classic it is
  still Off / Beside the words / Beside the keyboard / Both.
* **The skeleton shows only in Adventure.** Classic and School never show it.
* **Independent choices.** Picking a hand in Adventure does not touch Classic or School.
* **Never chosen in Adventure → follows Classic** (off stays off; anything else is the skeleton).
  So a student who already has hands on sees the same skeleton they see today — and can switch
  to the human hand with one click.
* Changing the **View** drop-down inside the ⚙ menu swaps the hands list straight away.

## Check

Hard-refresh Library; the footer should read `game.js v3.61.0`. Open ⚙ with Classic showing: the
hands list has four choices. Switch **View** to Adventure: the list becomes Off / Human hand /
Skeleton hand. Pick Human hand, then Skeleton hand — the hands change. Switch back to Classic:
its own choice is untouched.

Expect **ALL 119 HARNESSES PASS.** (No new harness this round.)
