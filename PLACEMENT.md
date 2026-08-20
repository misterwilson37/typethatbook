# WHERE THESE GO — Round 21, Phase B step B2 (READERS ONLY)

```
daylog.js                       → repo ROOT   (v1.1.0 → v1.2.0)
reports.html                    → repo ROOT   (v2.21.0 → v2.22.0)
tests/daylog-cutover-test.mjs   → tests/      (NEW)
tests/week-agreement-test.mjs   → tests/      (v1.0.0 → v1.1.0)
tests/run-all-tests.mjs         → tests/      (registers the new harness)
```

⚠️ **APPLY THE PHASE A ZIP FIRST.** `run-all-tests.mjs` here builds on the Phase
A version. Applying this one alone will drop the registration audit.

---

## ⚠️ THIS IS HALF OF A FIX AND IT IS THE HALF THAT CHANGES NOTHING

`daylog.js` **is** student-facing — `game.js` and `learn.js` import it for the
HUD. So this is a student deploy. Read the next paragraph before you upload.

**No number moves.** The readers now sum `seconds` plus `secondsLibrary` plus
`secondsSchool` for days on or after **2026-08-22**. Nothing writes those split
fields yet, so both are zero, so every total is arithmetically identical to what
it is today. Days before the cutover take the old legacy-first path unchanged.

⚠️ **THAT IS THE ENTIRE SAFETY ARGUMENT AND IT IS WHY THE READERS SHIP ALONE.**
If the writers went first, every afternoon after the switch would vanish behind
that morning's flat number, silently, on every student. Consumers before
producers.

## What to check after you upload

1. Open `reports.html`. Run any report you ran yesterday. **Every number should
   be identical.** ⚠️ If any number changes, stop and tell me — it would mean
   something was already writing split fields and nobody knew.
2. Open `game.html`, type for fifteen seconds, watch the HUD. Today's and this
   week's figures should behave exactly as before.
3. The footer should read `reports 2.22.0`.

## The cutover date is 2026-08-22 and it is a Saturday on purpose

Your school week is Sat–Fri everywhere in this project. A cutover on any other
weekday leaves one week half in the old shape and half in the new, and a weekly
total spanning that seam is the one number you could not explain to a parent.
Cutting on a week boundary means no week is ever mixed.

⚠️ **IF THE WRITERS DO NOT SHIP BEFORE 2026-08-22, MOVE THIS DATE.** It lives in
exactly two places — `daylog.js` (exported constant) and `reports.html` (its own
copy). `daylog-cutover-test.mjs` Part F and `week-agreement-test.mjs` both fail
if the two ever disagree, so you cannot change one and forget the other.

⚠️ **DO NOT MOVE IT AFTER THE WRITERS ARE LIVE.** Later, and days between the two
values carry only splits while being read legacy-first — they read as **zero**.
Earlier, and the v3.29.x days start double-counting.

## Why a date gate rather than just adding the fields up

Plain summing double-counts the days from the v3.29.x window, when the split
shipped and was reverted — those documents hold a flat number *and* splits
describing the same seconds. That is why the readers were made legacy-first in
the first place, and undoing it blindly would re-break days that are currently
right.

You ruled that the historical data is good enough and is not to be repaired. The
date gate honours that exactly: **every day before 2026-08-22 reads bit-for-bit
as it does today.** The proof is that `tests/daylog-test.mjs` passes **unedited** —
its documents are dated 08-17, 08-18 and 08-19, and all 40 of its assertions
still hold. If that harness had needed changing, the cutover would have been
wrong.

## Verify before uploading

```
npm test
```
Expect **ALL 34 HARNESSES PASS**, including `daylog-cutover-test.mjs`.

## ⚠️ WHAT IS STILL BROKEN AFTER THIS

**§3.1 is not fixed.** `game.js` and `learn.js` still write the whole day total
under `seconds`, so a stale tab still overwrites a newer figure. This deploy only
makes the readers ready for the writers.

**Phase B step B4 is the rest** — the per-source counters in both student files,
plus every place they fold: the WAL, `mergeGuestStats()`, `statsWalRecover()`,
`STAT_KEYS`. That is the one that goes out on a non-school evening.

⚠️ **`tab-lifetime-test.mjs` PARTS B, C AND F STILL PASS BY ASSERTING THE
DEFECT.** They are green because the shipped build still loses the time they say
it loses. When B4 lands they must be rewritten to assert the correct totals, and
must fail before the writers change.
