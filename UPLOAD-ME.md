# Round 156 — Adventure's map line goes behind the hands

⚠️ **Assumes Round 155 is deployed.** No Firestore rules change. **One code file changes.**

## Order

1. Upload everything in the zip, keeping the folders. Nothing has to go first.
2. To reach tabs that are already open: Firestore → `settings` → `appVersion` → field
   `nonce` → increase it by one. Open tabs reload within ten minutes.

## What changes

* **Library, Adventure view only:** the hands are drawn in front of the map's route line
  instead of behind it. Nothing else moves. School and Classic view are unchanged.

## Check

Hard-refresh Library, switch to Adventure, turn on ⚙ → Show hands → Beside the keyboard (or
Both), and open a book. The footer should read `style.css v3.11.1`. The dotted route line
should pass *behind* a hand, not across it.

Expect **ALL 119 HARNESSES PASS.** (No new harness this round.)
