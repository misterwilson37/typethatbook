# Round 170 — mastered is mastered

**Already on `main` — nothing to upload, no rules change.**

## Order

1. Firestore → `settings` → `appVersion` → `nonce` → increase by one (5 → 6).

## What changes

* A run a student has mastered (4 points: A🔥 = 2, A = 1) never counts time again — however long
  they've been stuck. It's still playable for practice. The "Mastered · this run no longer counts
  time" message is now always true. Runs they haven't mastered count exactly as before.

## Check

The student you watched: her mastered run of unit 1 lesson 3 should now show the practice banner
and her daily time should not move while she types it.

Expect **ALL 128 HARNESSES PASS**.
