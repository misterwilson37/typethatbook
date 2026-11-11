# Round 165 — School picks up where they left off

**Already on `main` — nothing to upload.** No rules change in this round.

✅ Done 2026-11-11: rules v2.18.0 published and the nonce bumped.

## Order

1. Firestore → `settings` → `appVersion` → `nonce` → increase by one (open tabs reload within
   ten minutes).

## What changes

* **School (learn.html)** opens a lesson on the next run after the furthest one the student
  finished, like BETA does — no more starting over at run 1.
* The lesson intro shows **"Start from which run?"** with a button per run; runs they haven't
  reached are greyed out until they finish the one before. Mastered runs show in green.
* School and BETA now differ only by the games.

## Check

Open School on a student who has finished a few runs of a lesson but not passed it. The intro
should say **Start Run N →** with N the next run, and the run buttons above it should let them pick
any run up to there.

Expect **ALL 123 HARNESSES PASS.**
