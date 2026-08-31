# Reading a TypeThatBook report

<!-- docs/TEACHER-GUIDE.md v1.0.0 — Round 55, 2026-08-30. New file.

     ⚠️ THIS IS THE ONLY DOCUMENT IN THE REPO WRITTEN FOR A TEACHER RATHER THAN
     FOR WHOEVER IS EDITING THE CODE. Everything else in docs/ assumes the reader
     is about to change something. This one assumes the reader is about to grade
     a class on a Monday morning and has no interest in the file map.

     ⚠️ KEEP IT THAT WAY. When a round adds a teacher-visible control, the entry
     here should say what it does and what it does NOT do, in the words a teacher
     would use. Do not import the roadmap item numbers into the prose — they are
     in the footnotes at the bottom for whoever maintains this, and they mean
     nothing to the person the document is for.

     ⚠️ EVERY CLAIM BELOW WAS READ OUT OF reports.html v2.34.0 AND
     firestore.rules v2.10.0, not from memory. If a control behaves differently
     from what this says, the document is wrong and should be corrected here
     rather than explained away in conversation. -->

This is the teacher's side of TypeThatBook: how to pull a report, what the marks
in it mean, and how to clean up a day that went sideways. You do not need to know
anything about how the app is built.

**Open `reports.html` and sign in with your school Google account.** What you can
see depends on your role — a teacher sees their own classes, a building admin
sees their building.

---

## Pulling a report

Pick a **School** and **Class** at the top, then a date range, then **Generate**.
Your own classes are marked with a **★** in the dropdown.
You get one row per student, and under each student a list of the days they
typed. Click a date to open that day and see the individual sessions and runs
inside it.

**Export CSV** gives you the same numbers as a spreadsheet.

⚠️ **The day rows are the graded record.** The minutes a student sees on their
own screen come from the same place, so their screen and your report cannot
disagree.

---

## What the marks mean

### The error-rate column — always there

Every day row now shows what share of that student's keystrokes were mistakes.

| What you see | What it means |
|---|---|
| a low percentage in grey | ordinary typing |
| an amber percentage | worth a look |
| an orange bold percentage | high — see below |
| `—` | **no answer**, not zero |
| a `*` after the number | the figure covers Library *and* School together |

**Why the high end matters.** In the earliest lessons a student is only being
asked to hit two keys. Someone mashing the keyboard at random still hits the
right key about half the time, so they can reach the end of a lesson without
typing anything on purpose. That behaviour shows up here as an error rate around
50% or above. A student who is genuinely struggling usually sits nearer 10–20%.

⚠️ **The thresholds are provisional and are meant to be watched, not trusted
yet.** They were set from reasoning, not from your students' real numbers. Watch
the column for a week or two before treating any particular figure as a verdict —
that is why the column shows the **number** and not just a colour.

⚠️ **`—` is not 0%.** It means there is no answer to give: either the student has
a record for that day but did no typing, or the day is old enough that the app
was not yet storing School and Library separately. A day with no typing is not a
day with no mistakes, and the report will not pretend otherwise.

⚠️ **The `*` matters more than it looks.** Normally the figure is **School work
only**, because that is where the two-key lessons are. On older days it is
everything combined — and a student who read a book cleanly and then mashed one
short lesson will look fine, because the good typing dilutes the bad. Treat a
starred figure as a weaker signal.

### The flag icons — only after you ask for them

Beside the error rate is a small mark that starts as a faint dot. Press **Scan for
flags** to fill these in.

| Mark | Meaning |
|---|---|
| `·` faint dot | **not scanned** — no information yet |
| `✓` green tick | scanned, nothing found |
| `●` red | three or more failing runs in a row that day |
| `▲` amber | a run far faster than that student's others that day |
| `⧉` blue | the same session filed twice — safe to delete |
| `○` purple | several runs under the five-second floor |

⚠️ **A faint dot and a green tick are different things and the difference is the
whole point.** The dot means nobody has looked. The tick means somebody looked
and found nothing. If you read a dot as "clean" you will skip the day that needed
you.

**Why the scan is a button and not automatic.** It reads every session record for
every student in the report. That costs money on the Firebase bill, and the app
is paid for personally. The error-rate column is free because it uses numbers the
report already loaded; the flags are not, so you spend that deliberately. It will
tell you how many students and days it is about to scan and let you say no.

⚠️ **One thing the scan can miss.** The "three F's in a row" check has to work out
what each run *would* have scored. If a lesson has been edited since a student
typed it, the app **refuses to guess** rather than grading the wrong material — so
that day shows no red mark even if it had a streak. A day with no red mark is
"nothing found *or* nothing checkable", not "definitely clean".

### The legend

The panel on the right of the screen lists all of this and stays put as you
scroll. Collapse it with the **−** in its corner. On a narrower screen it moves
above the table instead of floating.

---

## Cleaning up

### Deleting one run

Open a day, open a session, and each individual run now has a **✕**. Use it when
a student's record has something in it that should not count — a run they did on
somebody else's machine, a demonstration you typed yourself, a bit of mashing.

The run is removed, the session's totals are recalculated, and then the day's
totals are recalculated from the sessions. If it was the only run in the session,
you will be asked whether to delete the whole session instead — an empty session
is a confusing leftover.

⚠️⚠️ **Deleting a run does NOT unlock a student.** This is the single most
important sentence in this document. See the next section.

### Clearing mastery — the one that actually unlocks a student

Once a student has done well enough at a run several times, that run becomes
**practice**: they can still type it, but it stops earning credit. That is
deliberate, so a student cannot farm easy minutes by replaying lesson one forever.

⚠️⚠️ **The problem this solves.** If somebody *else* typed on a student's account —
a teacher demonstrating, a classmate messing about — the app banked that mastery
against the student. They are then locked out of earning credit in a lesson they
never actually passed. **Deleting the runs does not fix it**, because mastery is
stored separately from the evidence and cannot be worked backwards from it.

**To fix it:** click the **◈** beside a student's name to open their lesson
grades. Any lesson they have mastery in shows a count in the **Mastered** column
and a **⊘** button. Press it.

That lesson goes back to being graded, so the student can earn credit in it
again.

⚠️ **It keeps their history.** Grades, fireballs and attempt counts all stay. You
are undoing the lock, not erasing what the student did.

⚠️ **It affects more than that one lesson.** There is a clock that measures how
long it has been since a student last proved something, and it feeds how quickly
locked lessons open back up. Clearing mastery recalculates that clock from
whatever mastery is left. This is correct — but it means the effect is not
confined to the lesson you clicked.

### The other two buttons you will see

* **⚑** on a day row — rebuilds missing lesson grades from the session records,
  for days where the grade did not save. It never overwrites a grade the student
  actually earned and never advances anyone through the curriculum.
* **Delete session** — removes a whole session. Prefer the per-run **✕** now
  unless you really want all of it gone.

---

## Things worth knowing

**Students cannot edit their own records.** The delete and clear controls are
staff-only, and a teacher can only reach their own classes.

**Nothing here is undoable.** There is no bin. A deleted run is gone and cleared
mastery has to be re-earned. Everything destructive asks first; read the box.

⚠️ **If a button appears to do nothing, say so rather than clicking again.** The
most likely cause is that a permissions update has not been applied on the
Firebase side yet, and the app cannot always tell the difference between "not
allowed" and "nothing happened". Repeating the click will not help. Tell Jake.

---

<!-- ── maintainer footnotes ────────────────────────────────────────────────
     The teacher-facing prose above deliberately contains no roadmap numbers.
     For whoever edits this next:

     * error-rate column, scan button, flag icons, legend  — ROADMAP 36
     * per-run delete (✕)                                  — ROADMAP 32
     * clear mastery (⊘)                                   — ROADMAP 33
     * grade reconstruction (⚑)                            — ROADMAP 15
     * the five-second floor                               — ROADMAP 7
     * the two-key mashing problem                         — ROADMAP 35, still OPEN.
       The thresholds described above as "provisional" are exactly the numbers
       item 35 is waiting on real data to set. When that lands, update the
       error-rate table here in the same round.

     ⚠️ THE ⊘ AND ✕ CONTROLS REQUIRE firestore.rules v2.9.0 AND v2.10.0 TO BE
     DEPLOYED IN THE FIREBASE CONSOLE. Until then they work for a super_admin and
     are silently denied for every teacher and building admin — which is what the
     "if a button appears to do nothing" note above is really about. If those
     rules are live, that note can be softened.

     ⚠️ v2.7.0 had the same hole for the ⚑ button and nobody noticed for forty
     rounds, because the only person testing it read the whole building.
     ── -->
