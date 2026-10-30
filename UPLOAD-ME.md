# Round 153 — hands in the Library too

⚠️ **Assumes Round 152 is deployed** (it is: "Show hands" already works in School).
No Firestore rules change this round.

## Order

1. Upload everything in the zip, keeping the folders. Nothing has to go first.
2. To reach tabs that are already open: Firestore → `settings` → `appVersion` → field
   `nonce` → increase it by one. Open tabs reload within ten minutes.

## What changes

* **Library has "Show hands".** ⚙ → Hand Guide column → **Show hands**: Off / Beside the
  words / Beside the keyboard / Both. Same hands as School.
* **It is the same setting.** Turn it on in School and it is on in Library, and the other
  way round — for that student, on any machine.
* **Beside the words narrows Library's text column** to 700px while it's on (there is no
  margin to put a hand in otherwise). Adventure view has no text column, so there only
  *Beside the keyboard* shows.
* **Library's old "Show fingers" is untouched** — the sliding fingertip dot is a separate
  switch.
* **learn2.js (staging) has the hands too.**
* Hidden below 1000px wide. The Arcade is left out on purpose.

## Cost

None new. Library already reads the student's profile document, so it just reads one more
field from it. School's once-a-week read is unchanged.

## Check

Hard-refresh Library. The footer should read `game.js v3.59.0`. Open ⚙ → Show hands →
Both, and type a few words: the hands should light with the keyboard. Then open School —
the setting should already be on.

Expect **ALL 119 HARNESSES PASS.** (No new harness this round.)
