# Session history, the week-counter audit, and the ID stamp

*Round 12 (Caligraph), 2026-08-18. Amended Round 13 (Ludlow), 2026-08-18.
Companion to `HANDOFF.md`.*

This covers the things a teacher touches directly. For the engineering reasoning,
read `HANDOFF.md`; for the cost model, `SCALE-PLAN.md`; for where the data model is
going, `DESIGN-TELEMETRY.md`.

⚠️ **Round 13 corrected one instruction in this file.** §3 used to tell you to set
the audit range "starting Monday." The app and the audit both start the school week
on **Saturday**, so a Monday range produced rows the audit declared unverifiable
and looked like a broken button. Corrected below. Everything else in §3 stands.

---

## 0. ⚠️ 2026-08-18 — the clock changed. Minutes before and after are not comparable.

From this date, **time typed starts at the first keystroke** (in lessons, the first
*correct* one). Before it, two smaller clocks were running that credited a little
time nobody had earned: every Library sprint counted about two seconds from the moment
a book opened, and a lesson's daily counter started on the first keypress of any kind
while the graded clock waited for the first correct one.

**Recorded minutes are slightly lower from here on. That is the fix, not a fault.** A
student who struggles loses a bit more than a fluent one, because they spend longer
between their first keypress and their first correct one.

⚠️ **Nothing already recorded was changed.** Seconds banked before this date stay
banked. But a week-over-week comparison that spans 2026-08-18 is comparing two
different definitions — if a class looks like it dipped that week, this is why.

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
  the range back to that **Saturday** and run it again.

⚠️ **Set the range to cover the whole week, and the school week starts on
SATURDAY.** Not Monday — a week runs Saturday to Friday, so a counter that says
"this week" includes the weekend before it. A range that starts on Monday leaves
two days out and the audit will correctly refuse to judge those students, listing
them as unverifiable rather than accusing them. Widen it and the rows resolve.
(This is the same Saturday-versus-Monday mistake that made the first version of the
audit report a false all-clear across ninety students; it survived in this
paragraph two rounds longer than it did in the code.)

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

---

## 6. Two clocks on every session record (new, Round 13)

Every time and date in the app used to come from the Chromebook the student was
sitting at. Chromebook clocks can be changed, and a changed clock files work under
the wrong day or inflates a words-per-minute figure.

From this deploy, each session record carries **two** timestamps: the one the
student's browser reported, and one written by Google's servers at the moment the
record arrives. The second cannot be altered from a Chromebook.

**Nothing in Reports looks different, and nothing you grade on has changed.** This
is groundwork on purpose. The two clocks are only useful when compared, and a
comparison needs history behind it — so the recording starts now, quietly, and the
first time it can answer a question is a term from now rather than the afternoon
somebody is under suspicion.

Two things worth knowing if it ever does come up:

- **The two clocks are *supposed* to differ.** A Chromebook lid closed mid-sentence
  keeps its records locally and delivers them on the next sign-in, sometimes the
  next day. That gap is the app working correctly, not a red flag. What is not
  normal is a browser time that lands in a different *week* from the server time.
- **If a record shows no server time at all**, the browser was running an older
  cached copy of the app when it sent it. That is a deploy state, not a student.

**Cost: nothing.** One extra field on records that were already being written.

---

## 7. Why one sprint sometimes shows up as two rows (new, Round 13)

A student who types for a while, switches books, and comes back to finish used to
leave **one** record covering the whole stretch — or, if they never finished it,
**none at all.** Time typed in an abandoned sprint or lesson run was counted in
their minutes but had nothing behind it in the detail view.

That is fixed. The app now closes the open sprint whenever a student leaves the
page or hides the tab, without ending it. So in the drill-down you will now see:

- **More rows than before**, and some stretches split into two or three.
- A suffix on the pieces — `(hidden)` when they switched tabs or closed the lid,
  `(left page)` when they navigated away.
- **WPM and accuracy on each piece describe that piece**, not the whole stretch.
  A 12-second fragment with a low WPM is usually someone getting started again.

⚠️ **This is not double counting, and the totals did not change.** The minutes were
always being counted; what changed is that the detail underneath them is now
complete. A period of book-hopping renders as the shape it actually had.

⚠️ **One thing to know if you compare School detail against School minutes.** The
lesson side has two clocks: the graded clock that produces WPM only runs once a
student has typed the first character of a run, while their minutes start slightly
earlier. So a lesson day's session rows can sum to a little less than the day's
minutes, and that gap is normal — not lost time.
