# Round 155 — a tighter thumb, a centred letter

⚠️ **Assumes Round 154 is deployed.** No Firestore rules change. **One code file changes.**

## Order

1. Upload everything in the zip, keeping the folders. Nothing has to go first.
2. To reach tabs that are already open: Firestore → `settings` → `appVersion` → field
   `nonce` → increase it by one. Open tabs reload within ten minutes.

## What changes

* **The thumb stays plain unless the thumb is the target.** Before, its base lit up with the
  palm whenever any finger was the target.
* **The big letter sits in the middle of the palm.**
* Same Settings choice, colours, placement and SHIFT/SPACE behaviour, in School, Library and
  learn2.

## Check

Hard-refresh a School drill with ⚙ → Show hands → Both. Type an `f`: the yellow should stop at
a straight line beside the index finger, the thumb side stays grey, and the `f` is centred in
the yellow. Then a space: the thumb and palm both light.

Expect **ALL 119 HARNESSES PASS.** (No new harness this round.)
