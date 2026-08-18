# Session history, the week-counter audit, and the ID stamp

*Round 12 (Caligraph), 2026-08-18. Companion to `HANDOFF.md`.*

This covers three things a teacher touches directly. For the engineering
reasoning, read `HANDOFF.md`; for the cost model, `SCALE-PLAN.md`.

---

## 1. What went wrong, in one paragraph

Sign-ins expire after 24 hours, and that expiry lands mid-class for somebody most
days. When it happened, the app stopped being able to tell that student apart from
a visitor who had just arrived — so it offered them the "sign in to save your
work" prompt, and signing back in *added* their stored time to the time already on
screen. A student who arrived with 20 minutes left the prompt with 40. Only the
**weekly** number was affected in the usual case; the daily numbers in Reports
were never wrong, which is why they can be used to repair the weekly ones.

Fixed in `game.js` v3.22.0 and `learn.js` v2.6.0. It cannot recur.

---

## 2. The ID stamp

Every signed-in student now sees a small grey `ID a1b2c3d4` in the **bottom-left**
corner of the Library and School pages, mirroring the version stamp bottom-right.

- Those are the first eight characters of their account id. Eight is enough to be
  unique across the building and short enough to read aloud across a room.
- **Clicking it copies the full id** to the clipboard.
- Reports shows the same eight characters beside each student's name. Clicking
  those copies the full id too.

So when a child says "my minutes look wrong", you ask for the eight characters and
go straight to their row — no guessing from a display name.

It is also the fastest deploy check there is: **if the ID stamp is not showing,
the new code is not running.**

---

## 3. The week-counter audit

**Reports → set your date range → Generate → Audit Week Counters.**

The button compares each student's stored weekly total against the sum of their
own daily logs. The daily logs were never corrupted, so their sum is the correct
answer — this is a calculation, not an estimate.

What you will see:

- **Nothing flagged** — no inflated counters in that window.
- **A list of students, each with `stored 40m 12s → correct 20m 06s`.** Press
  **Fix** on any row, or **Fix all**. Only the three weekly fields are rewritten;
  daily numbers are never touched, because the audit proves nothing about them.
- **"exactly doubled"** beside a row means the stored value is almost exactly twice
  the correct one. That is this specific bug's signature. Other overages are worth
  a look but may have another cause.
- **"could not be checked"** means your date range does not cover the whole week
  that student's counter describes, so the comparison would be meaningless. Widen
  the range to include that Monday and run it again.

⚠️ **Set the range to cover the whole week, starting Monday.** A partial week
produces unverifiable rows rather than answers.

⚠️ **One case the audit cannot see.** If a student hit the bug *after* their time
had already saved once that same day, the daily number was inflated too — and the
daily numbers are the yardstick, so that day looks self-consistent. If a day's
minutes look far larger than the runs listed underneath it, that is the signature.
Rare, and impossible from now on.

**Cost:** one read per student in the report, one write per student repaired. A
class of thirty is thirty reads — negligible against the daily free tier.

---

## 4. Session detail is back, and School has it for the first time

Click a date inside a student's **Details** panel to expand it. You now get two
levels:

1. **Rollups** — one row per stretch of work, with total time, average WPM,
   accuracy, how many runs it contains, and whether it was **School** or
   **Library**.
2. **Individual runs**, indented beneath each rollup — clock time, duration, WPM,
   accuracy, characters, and which lesson run or chapter it was.

🚩 marks a run much faster than that student's **other** runs the same day. The
comparison deliberately excludes the run being judged, so a single very fast run
cannot raise the average it is being measured against and hide inside it.

Two things worth knowing:

- **This works on data you already have.** Every rollup ever written stored its
  individual runs; Reports simply never displayed them. Expand any past Library
  day and the detail is there.
- **School detail starts today.** Lesson mode never wrote session records at all —
  not a setting that got switched off, a feature that was never built. There is
  nothing to recover for earlier days. Library days are complete.

---

## 5. What a student sees when their sign-in expires

Instead of the old guest prompt, they get: *"Please sign in again — your sign-in
expired, which happens about once a day. Your work is still here, it just can't
save until you sign back in."*

Their typing keeps counting while they are signed out, their lesson map is not
cleared, and the Library no longer jumps them back to chapter one. When they sign
in, the time is reconciled correctly — added once, never twice.
