# Round 145 — 19 files — includes 143 and 144

⚠️ **Assumes Round 142 is deployed** (you confirmed it and rules v2.15.0). Everything
from 143 and 144 is in here — skip those zips.

## ⚠️⚠️ Order

1. **Rules first:** `firebase/firestore.rules` → **v2.16.0** → Firebase console →
   Firestore → Rules → paste → Publish. Without it, SAVE still works but shows a
   notice that the student's screen may lag.
2. **The new `scripts/` folder** — GitHub Pages serves it, and Cloud Shell downloads
   the script from your site.
3. **Everything else.**

## What changed for students

**A teacher's deletion now sticks.** Each browser keeps a backup log of unsaved
minutes, and on every load it took whichever number was bigger — the log's or the
server's. So your deletions came back for the rest of the week, and a deletion made
the **same day** could have been written straight back into your records. Now,
whenever you SAVE or recalculate a student's day, their account is stamped, and
their browser checks that stamp before its log is allowed to raise a number. The
same fix is in Library, School and the Lessons beta.

⚠️ **One gap remains:** if a student has the page **open** while you delete *today's*
minutes, their next save can still write them back. Until that's fixed, **delete
runs the day after they happen.**

## What changed for you

* **📋 How-to** on reports, below the controls (super-admin only): the quarterly
  routine, what to do for a deletion request or a "stop collecting" request, and all
  nine Cloud Shell commands with **Copy** buttons.
* **Retention…** now shows when the next student could come due.
* **Leaderboard:** the weekly-time floor yields to your corrections, and each best
  now records the date it was set (from now on — older bests have no date).
* **Student picker:** named students first; nameless ones grouped at the bottom.
* **Policy and SECURITY.md:** your mailing address — COPPA's contact list is now
  complete — and a sentence saying exactly when a sign-in account is deleted.

## The Cloud Shell script — read before your first run

`scripts/auth-cleanup.py` deletes sign-in accounts only when the student's records
are **already gone** *and* the account hasn't been used in **24 months**. Staff are
never touched. It lists everything first and changes nothing unless you add
`--delete` and type `delete` plus the number.

⚠️ **It has not been run against the live project.** The logic is tested; the
Cloud Shell sign-in steps can only be tested by using them. Try it once in
list-only mode — `python3 auth-cleanup.py` — well before you actually need it.

## Verify

```
npm install acorn jsdom
node tests/run-all-tests.mjs
```

Expect **ALL 114 HARNESSES PASS**, with one note: publish the policy only after your
principal's yes.
