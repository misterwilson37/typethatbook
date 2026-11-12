# Round 168 — Teach: editing a student, and everything reachable

**Already on `main` — nothing to upload.** ⚠️ **Paste the rules (v2.20.0).**

## Order

1. **Firestore → Rules:** paste the whole of `firebase/firestore.rules` (v2.20.0) and **Publish**.
   Without it, deleting a run in Teach removes the time and the lesson credit but can't tell the
   student's open page (it says so).
2. Firestore → `settings` → `appVersion` → `nonce` → increase by one.

## What changes

* **Teach → a student → click a day → Delete** on a run: its time comes off, and in the lesson it
  takes back what that run earned (attempt, mastery points, grade — and the pass, if that run
  passed the lesson). The student's open page updates within seconds and keeps their unsaved
  minutes.
* Also there: **set a day's time**, and **Clear mastery** in the Lessons table.
* Reports: setting a day's time no longer leaves Arcade minutes on top.
* **Teach → Manage**: Students & CSV import, Classes (create/rename/delete/teachers), Staff, Books,
  Lessons — Admin's own panels inside Teach. **Teach → School tools**: Reports' school-wide tools
  (school week, privacy & Delete student, retention, popularity, leaderboard, scan for flags).
  These are the old panels framed for now; tell me where the flow feels wrong and they move in
  natively one by one.

## Check

On a test student, do two runs of a lesson in School. In Teach, open them, click today, and delete
the second run. The message lists what changed in the lesson; in School the student resumes at that
run.

Expect **ALL 127 HARNESSES PASS** and **96 rules tests**.
