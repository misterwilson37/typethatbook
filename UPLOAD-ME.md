# Round 164 — Wipe today

**The code is already on `main` — nothing to upload.** ⚠️ **One manual step: the Firestore
rules.** Until it's done, Wipe today still removes what's saved, but can't reach an open page
(Reports will tell you).

## Order

1. **Firestore → Rules:** paste the whole of `firebase/firestore.rules` (v2.18.0) and **Publish**.
2. Firestore → `settings` → `appVersion` → `nonce` → increase by one (so open tabs pick up the
   new pages within ten minutes).

## What changes

* **Reports → choose a student → Wipe today…** Removes today's runs and minutes and puts every
  lesson they touched today back the way it was this morning — passes included. Other days are
  never touched.
* **Their open page resets within a few seconds**, including time it hadn't saved yet. They can
  keep typing and earn time again. A closed page cleans up the next time they sign in.
* **Deleting a single run from today** now also reaches an open page (it reloads), instead of the
  old total coming back five minutes later.
* Leaderboard scores and Library book position are not changed by a wipe.
* ⚠️ Lessons are only restorable for changes made **after** this update reached the student's
  page — a lesson passed earlier today, before the reload, has no morning snapshot yet.

## Check

1. On a test student account, open a lesson in School and do a run or two (pass one if you can).
2. In Reports, choose that student → **Wipe today…** → confirm.
3. Within a few seconds the student's page reloads: today's time reads 0, and the lesson is back
   where it was this morning. Type a little more — time counts again.

Expect **ALL 122 HARNESSES PASS** and **86 rules tests passing** (`npm run test:rules`).
