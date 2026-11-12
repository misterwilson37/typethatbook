# Round 167 — Teach, and Arcade minutes count

**Already on `main` — nothing to upload, and no rules change.** (If Round 166's rules v2.19.0 aren't
pasted yet, that's still needed for per-student requirements.)

## Order

1. Firestore → `settings` → `appVersion` → `nonce` → increase by one.

## What changes

* ⚠️ **Reports and its CSV now include Arcade minutes.** They had been left out of every total,
  while the student's own screen counted them. Arcade players' totals will go up to match what they
  see.
* ⭐ **New page: Teach** (link in Reports, Admin and the home page footer, or `/teach.html`):
  * **Today** — who has typed today with flags; *Who hasn't typed?* on demand.
  * **Classes** — one class, all your classes, or the school; any date range; class settings;
    **Export CSV** — same columns as Reports, and for several classes one file with a Class column.
  * **Student** — days → runs, lessons, move class, requirements, Wipe today.
  * For deleting a single run or recalculating a day, it links to Old Reports for now.
* Students see **how their week is defined**: "Your week" in Settings, and the dates when they
  hover the Weekly figure.

## Check

Open Teach. Today should list your students who have typed. Click one, then their class, then
**Export CSV** for **All my classes** and open it next to last week's Reports export — the first nine
columns line up (totals will be higher only for students who played Arcade).

Expect **ALL 126 HARNESSES PASS**.
