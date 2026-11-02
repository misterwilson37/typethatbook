# Round 161 — a target only when someone set one

⚠️ **Assumes Round 160 is deployed.** No Firestore rules change. **One NEW file:
`goal-ladder.js`** — Library, School, School BETA and the landing page all import it, so
if it's missing, all four fail to load.

## Order

1. Upload everything in the zip, keeping the folders. **`goal-ladder.js` first** (or all at
   once) — the pages need it the moment they change.
2. To reach tabs that are already open: Firestore → `settings` → `appVersion` → field
   `nonce` → increase it by one. Open tabs reload within ten minutes.
3. Reports → **School Week** → **Save** once. It rewrites `settings/goals` with the week start
   day only, clearing the old site-wide minutes (nothing reads them now — this is tidying).

## What changes

* **No class → no target.** The HUD shows `Daily 9:22` / `Weekly 41:10` with no "/ 10:00" and
  no ✓, unless the student set their own goals.
* **Class always wins.** A student in a class gets the class's goals and can't change them.
* **⚙ Settings:** School and Library both show the class ("No class assigned" if none) and
  the goals — read-only "set by your teacher" in a class, two boxes + Save with no class.
* **Reports:** the Daily/Weekly goal boxes are gone; "Week Starts On" stays.

## Check

Hard-refresh Library; the footer should read `game.js v3.62.0` and `goal-ladder.js v1.0.0`.

1. **A student in your class:** HUD still shows `/ 10:00` (or whatever the class sets).
   ⚙ shows the class name and "set by your teacher".
2. **A student in no class** (or a test account): HUD shows no "/". ⚙ says "No class
   assigned". Type 5 into min/day → Save → "✓ Saved", and the HUD now reads `/ 5:00`.
   Open School: it shows the same 5:00.

Expect **ALL 120 HARNESSES PASS.**
