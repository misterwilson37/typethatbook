# HANDOFF — TypeThatBook

<!-- HANDOFF.md v15.1.0 — consolidated 2026-08-18 by Round 14 (Sholes); amended
     through Round 24; ⚠️ RESTRUCTURED 2026-08-20 by Round 23 (Empire).

     v15.1.0 — Round 24 (Monotype). ⚠️⚠️ §0.-10 IS THE WRITE-UP AND IT OPENS
     WITH A RETRACTION. ROADMAP item 1 and §0.-9.F both recorded records as
     MISSING that were merely LATE: Jake re-generated the same day thirty
     minutes on and found the 12:57 PM Library sprint present in the drill-down
     and the day's log up from 11m 40s to 12m 40s. A report generated minutes
     after a period is not yet the record, and this project has built work on
     one at least twice. The round's own fix is THE EVENING GUEST:
     sessionLogAdopt() recomputed each record's date from at.slice(0,10) — UTC —
     discarding the local date the caller had already stamped, so a child typing
     Library at home after 7:00 PM Central had their clock land on today and
     their sprint record on tomorrow. Invisible during school hours by
     construction. Also: Cmd+R was eaten in School (and typed as an `r`), and
     the (Logout) button was styled invisible TWICE, in two stylesheets. ⚠️ AND
     THEN JAKE RULED ON THE OVERNIGHT RESCUE and it shipped: a child who typed
     as a guest and did not sign in until the next day now has those minutes
     credited TO THE DAY THEY TYPED THEM, in BOTH modes. See §0.-10.G.
     ⚠️⚠️ AND ROADMAP ITEM 3 IS DELETED AS A PHANTOM — §0.-10.J. It described an
     orphan `typing_logs/{anonUid}` document written for guests in School,
     "because a guest is signed in anonymously." `signInAnonymously` APPEARS
     NOWHERE IN THIS REPO. Two rounds carried it; one grep ended it.
     37/37 harnesses.

     ⚠️⚠️ v15.0.0 IS A MAJOR AND JAKE SIGNED IT OFF ("Feel free to do a clean up
     of Handoff while you're at it. Clean out anything unnecessary that you no
     longer need."). THE ROUND NARRATIVES FOR ROUNDS 15–20 ARE NOW IN
     docs/archive/HANDOFF-ARCHIVE.md. This file went 237 KB → 112 KB, which was
     ROADMAP item 7: past 200 KB nobody reads it, and that is how a blocker sat
     unread in the repo for a full session. ⚠️ THE ARCHIVE IS READ-ONLY HISTORY,
     NOT A SECOND HANDOFF — §0 rules 1 and 2 are unchanged, and every live
     conclusion was lifted into this file's own text BEFORE the split. If you
     need the archive to do your job, that is a bug HERE. Fix it here.

     v15.0.0 — Round 23 (Empire). ⚠️⚠️ §0.-9 IS THE WRITE-UP AND IT IS A STUDENT
     WRITE-PATH ROUND. THE GUEST MINUTE: a child who types before signing in had
     their time merged in School and ERASED in Library, proven on Jake's own
     numbers (7:27 + 1:04 = 8:31 in School; 7:27 + 1:11 = 8:31 in Library — the
     same figure, the minute gone). game.js had NO guest merge on the auth path
     while learn.js did; the merge existed in game.js TWICE, inline, in two modal
     paths, so which of three sign-in buttons a child pressed decided whether
     their minutes survived. One function now, called by all three, BEFORE
     loadUserStats(). A guest's sprints are queued and adopted rather than
     dropped, so the minutes reach the RECORD as well as the total.
     ⚠️ THE RECONCILE IS DELETED on Jake's confirmed boundary (~830 lines), and
     the real production session documents were LIFTED FIRST into
     tests/real-sessions-fixture.mjs. ⚠️ A CROSS-ACCOUNT QUEUE THEORY WAS RAISED
     AND KILLED BY JAKE — see §0.-9.E, which is the most useful part of this
     section for a future instance. 35/35 harnesses. -->

**Round 24 — Monotype.** Predecessors: Empire (23) · Smith Premier (22) · Hammond II (21) · Corona (20) · Hermes (19) ·
Salter (18) · Linotype (17) · Royal (16) · Densmore (15) ·
Sholes (14) · Ludlow (13) · Caligraph (12) · Bar-Lock (11) · Williams (10) ·
Remington (9) · Yost (8) · Hammond (7) · Noiseless (6) · Mignon (5) · Oliver (4) ·
Blick (3) · Dvorak (2) · Underwood (1).

⚠️ **Linotype IS ROUND 17 AND MONOTYPE IS NOT IT.** They are different machines
by different companies and both are now on the list; a future round reading the
list quickly will see two similar words and must not conclude one is a typo for
the other. **Check the list, and read the whole word.**

> *On the name:* the Monotype was **two machines in two rooms**. A keyboard
> operator punched a spool of paper tape; a caster in another room read that
> tape, later, and cast the type from it. The record and the output were
> separate objects, produced at separate times, and they could disagree — and
> when they did, the tape was right and the type was merely not made yet.
> That is this round exactly. Two rounds recorded a sprint as LOST because the
> report did not show it thirty minutes on; pressing the button again showed it
> had simply not been cast yet. ⚠️ And the round's own fix is the other half of
> the same idea: a record must carry the date it was *punched*, in the operator's
> own terms, because the machine that reads it may not run until tomorrow.

⚠️ **I nearly called this round Underwood No. 5 and got as far as writing it into
a harness header.** Underwood is Round 1 and it is in the list above; Salter's
note below is about very nearly making the identical mistake. Reading the warning
is not the same as checking the list. **Check the list.**
*Other projects, do not reuse:* Stedman, Fable, Trilby, Vernier.

> *On the name:* the Empire was built in Canada and sold across Europe as the
> Adler, and its trick was that the typebars did not swing — they slid straight
> forward on rails and struck the platen head-on, in full view of the typist.
> Every other machine of the era hid the work: the letter appeared under a
> carriage you had to lift to read. **Visible writing** was the selling point.
> That is this round twice over. A child's minute was being counted in one mode
> and silently dropped in the other, and it took Jake typing for four minutes
> with a stopwatch to make it visible — no test, no log, no error. And the fix
> is the same shape: a guest's sprints now go somewhere you can see rather than
> being thrown away at the point of capture. ⚠️ It is also the round in which I
> built an elaborate theory about shared Chromebooks, asked Jake to prove it,
> and was told the ruling was already written in the repo I had just read. The
> thing you cannot see is not always the thing that is hidden. Sometimes you
> just did not look.

> *On the previous name:* the Smith Premier had **two full keyboards** — one complete set
> of keys for capitals and a second for lowercase, side by side, because it
> refused to put two characters on one typebar. Every other maker used a shift.
> Smith Premier's answer was: stop sharing the mechanism, and the collision stops
> being something you have to manage. That is this round in one sentence. §3.1
> was never a race that better locking would fix — it was **one field with two
> writers**, where the last one to arrive is correct by definition. game.js and
> learn.js now have their own keys. Nothing arbitrates, because there is nothing
> left to arbitrate. ⚠️ The machine was also enormous, and the shift won in the
> end. Two banks of keys is the *right* answer to exactly one problem and an
> expensive answer to every other one — which is why this is a per-source
> **field**, not the per-source **document** that two rounds designed and the
> deployed rules reject.

> *On the name:* the Corona 3 folded. You unlatched the carriage and the whole
> top of the machine hinged down over the keys, which is how it fitted in a
> haversack and why it went to the Front. Folding is the trick, and folding is
> what this round did: four session documents covering the same stretch of a
> Tuesday morning, laid on top of one another instead of end to end, so the
> minutes they share are counted once. ⚠️ It is also the round that had to fold
> up its own predecessor's conclusion. §0.0 was written at 3am by an instance
> that found something frightening and reported it accurately, and then drew the
> wrong arrow from it. The evidence was sound. Nobody had weighed it.

> *On the name:* Hermes was a Swiss typewriter — the Baby, the 3000, the ones
> war correspondents carried. It is also the messenger, and that is the half
> that earned it. This round wrote no arithmetic. It built the thing that gets
> a message from Jake to ninety Chromebooks: one number in a console, and every
> tab in the building comes and collects the new code. Everything this project
> has ever fixed stayed broken in the classroom for as long as one tab stayed
> open, and no round before this one had a way to say so.

> *On the name:* George Salter & Co. of West Bromwich made typewriters, but that
> was the sideline. What the name meant to anybody who bought one was **spring
> balances and weighing scales** — the thing you put on the counter when the
> number mattered and you needed to be able to show somebody how you got it.
> This round built no typewriter. It built a scale: one pan holds `typing_logs`,
> the other holds `typing_sessions`, and the needle is the Δ column. The repair
> came second, on purpose, and only after the instrument existed to check it
> with. ⚠️ *I very nearly called this round Underwood* — it is Round 1, it is
> right there in the list above, and I wrote the wrong name into a message to
> Jake before catching it. Read the list before you pick.

> *On the previous name:* the Linotype's celebrated trick was not casting a line
> of type — it was the distributor bar putting every brass matrix back in its own
> channel afterwards, which is the only reason the next line could be set at
> speed. That round did no typesetting: it took seventy-nine loose things out of
> the repo root and dropped each one into the channel it belonged in.

---

## §0.-10. ⚠️⚠️ ROUND 24 (Monotype) — LATE IS NOT LOST, AND THE EVENING GUEST

**2026-08-20, late afternoon.** Three shipped files, one new harness, two pins.
`npm test` → **36/36, 0 unregistered.** `audit:versions` → 15 problems (baseline
15), zero "one of the two is a lie."

### 0.-10.A ⚠️⚠️ THE MOST IMPORTANT THING IN THIS SECTION IS A RETRACTION

**ROADMAP item 1 has been wrong for two rounds, and so was §0.-9.F.** Jake
re-generated 2026-08-20 about thirty minutes after typing. Two things recorded
as MISSING were present:

| | Round 23 recorded | Round 24 observed |
|---|---|---|
| the 12:57 PM Library sprint | absent from the drill-down | **1m 8s · 89 WPM · 504 ch, present** |
| the 2:05 PM sprint's daily log | 11m 40s / 2,781 ch | **12m 40s / 3,337 ch** |

Both arrived on their own, one visit late. That is `game.js` v3.25.0's own
documented behaviour — the queue drains on the next page that runs a flush — and
it was written down in the file the whole time.

⚠️ **A REPORT GENERATED MINUTES AFTER A PERIOD IS NOT YET THE RECORD.** Every
conclusion this project has drawn from a freshly-generated report is suspect,
and at least two rounds built work on one. **Before calling anything missing,
look again later.** It is the cheapest rule in the repo and it would have saved
a round.

⚠️ **AND NOTE WHERE THE EVIDENCE CAME FROM.** Round 23 asked Jake to run a
console command to split two candidates. He instead did the obvious human thing
— pressed the button again — and that settled more than the console command
would have. The instrument you reach for first is not always the cheap one.

### 0.-10.B ✅ WHAT SHIPPED

| File | Version | What |
|---|---|---|
| `session-log.js` | **v1.6.0** | `sessionLogAdopt()` prefers the record's own local `date`; the UTC slice survives only for the undated legacy migration |
| `learn.js` | v2.21.1 → **v2.22.0** | Cmd/Ctrl+R reaches the browser; then the School rescue |
| `style.css` | **v3.5.6** | `.text-btn` legible: #ccc, 13px, hover background, focus ring |
| `tests/adopt-date-test.mjs` | **NEW** | 13 assertions, **4 failing against v1.5.0** |
| `tests/run-all-tests.mjs` | v1.6.0 | registers it |
| `tests/session-merge-test.mjs` | v1.6.1 | version pin only |
| `tests/open-unit-test.mjs` | v1.2.3 | version pin only |
| `adventure.css` | **v1.0.1** | the `.text-btn` tint that ate the Logout fix (§0.-10.D) |
| `daylog.js` | **v1.4.0** | `carryOverPlan()` / `carryOverPayloadFor()` (§0.-10.G) |
| `game.js` | **v3.37.0** | `carryGuestDaysToTheirOwnDocuments()` (§0.-10.G) |
| `tests/carryover-test.mjs` | **NEW** | 40 assertions, both guards mutation-verified |
| `tests/guest-merge-test.mjs` | v1.1.0 | C4, C5, C7 assert the property, not the spelling (§0.-10.K) |
| `learn.js` | **v2.22.0** | the School half of the rescue; item 3 deleted (§0.-10.G, §0.-10.J) |

⚠️ **UPLOAD ORDER: `session-log.js`, then `daylog.js`, then `game.js` and
`learn.js`.** Both shared modules before EITHER page controller — v3.37.0 and
v2.22.0 both import `carryOverPlan`, `carryOverPayloadFor` and `sourceTotalsOf`,
and a missing export throws on import and renders **nothing at all**. ⚠️ This is
the first round in a while where getting the order wrong breaks BOTH modes
rather than one.

⚠️ **UPLOAD `session-log.js` FIRST**, same as Round 23 — `game.js` and `learn.js`
both import from it.

### 0.-10.C ⚠️⚠️ THE EVENING GUEST — A UTC DATE ON A LOCAL RECORD

`sessionLogAdopt()` recomputed each record's date from `at.slice(0, 10)`, and
`at` is `new Date().toISOString()` — **UTC**. America/Chicago crosses UTC
midnight at **7:00 PM** local (6:00 PM outside daylight saving). So a guest
typing at home after dinner, then signing in, got:

* their **daily log** on today, written by the merge in local terms — correct;
* their **sprint record** on tomorrow — wrong.

That is the drill-down-versus-total split this project has been chasing for
three rounds, arriving from a direction nobody was looking. It also blinds
`sessionLogPendingSeconds(uid, dateStr)`, which matches on `date`, so a flush
between two unit boundaries writes a total short by that sprint.

⚠️ **THE RECORD ALREADY CARRIED THE RIGHT ANSWER AND THE MODULE'S OWN HEADER
SAID SO.** `_write()`'s note reads *"`date` IS THE CALLER'S, NOT ours… an undated
record is refused outright rather than guessed at."* `sessionLogAdopt()` was the
one path in the file that overrode a date the caller had supplied. It was written
for the one-time `ttb_wal_v2` migration, where records genuinely had no date and
deriving one was the only option; Round 23 then routed the **guest handover**
through it, and the guest handover's records are dated. A function acquired a
second caller with different needs and nobody re-read its contract.

⚠️ **WHY NO CLASSROOM TEST COULD EVER HAVE CAUGHT IT.** Ellis runs 8am–3pm
Central, where the local and UTC dates always agree. Every guest-handover test
Jake has run passes on a build carrying this defect. **It is a Library-at-home
defect and it exists only because children use TypeThatBook in the evening.**

⚠️ **IT IS NOT THE CAUSE OF THE 2:03 PM CASE** in §0.-10.E. 2:03 PM Central is
19:03 UTC on the same date. Two different faults on one path — Rule 10.

### 0.-10.D ✅ TWO SMALL ONES, AND THE FIRST IS NOT WHAT IT LOOKS LIKE

**You could not hard-refresh in School and you could in Library.**
`handleDrillKey()` has a modifier guard in front of its `preventDefault()` and
**nowhere else**. Cmd+R arrives as `e.key === 'r'`, length 1, walks past that
guard into the printable-character branch, and hits the unconditional
`e.preventDefault()` at the bottom of the typing path: **the refresh is
cancelled AND an `r` is typed into the drill and scored.**

⚠️ **`game.js` IS NOT BETTER WRITTEN HERE, IT IS LUCKIER.** It cancels nothing
for a modifier combo, so the page reloads before its own stray `r` can matter.
The reload is the only reason its version of this bug is invisible. The two
handlers are near-duplicates that have drifted, and they disagree elsewhere too
— ROADMAP item 9.

⚠️ **THE FIX RETURNS RATHER THAN SKIPPING THE CANCEL**, and the difference is the
scored character. Shift is deliberately not in the modifier list: Shift+A is how
a child types a capital, and the lessons drill exactly that.

**The Logout nobody could find — and it was invisible TWICE.** Jake reported
*"there's no logout in library/game"* and attached screenshots with `(Logout)`
visible in three of them, at `#999` / 12px on a black bar beside a bold white
name. `style.css` v3.5.6 fixed that. He then reported it was *"completely
invisible in adventure mode"* — and it was, for a **different reason, in a
different file**: `adventure.css` line 249,
`body.view-adventure .text-btn { color: rgba(43, 34, 26, 0.6) }`. Dark brown at
60%, correct on parchment, near-black-on-black in the only place the class is
ever used — **and three lines below it sits a comment declaring the HUD bar is
deliberately NOT skinned.** The rule reached into the one region the file
promises not to touch, and it silently ate the `style.css` fix. Deleted;
`adventure.css` **v1.0.1**.

⚠️ **TWO STYLESHEETS, ONE INVISIBLE CONTROL, AND THE SECOND ONE WOULD HAVE MADE
THE FIRST FIX LOOK LIKE A FAILED DEPLOY.** `game.html` line 44 and `learn.html`
line 37 are the only users of `.text-btn` in the whole repo — so a skin rule
targeting the class could only ever have hit the HUD. **A control nobody can
find is a control that does not exist**, and this one had been there for rounds
while a test protocol worked around it.

### 0.-10.E ✅ CLOSED BY §0.-10.H — THE GUEST SPRINT'S RECORD

⚠️ **THIS SECTION WAS WRITTEN AS "STILL OPEN" AND WAS RESOLVED LATER THE SAME
EVENING.** Jake drove the whole path in the console and every step worked; the
2:03 PM record was late, like the other two. It is kept because the arithmetic
below is still the clean proof that the MERGE works, and because the two
candidates it names are the right ones to check if this ever recurs. **Read
§0.-10.H before acting on anything here.**

The merge is **proven working**, from the header alone:

| Time | Daily | |
|---|---|---|
| 2:02:10 | 10:34 | signed in, before signing out |
| 2:02:59 | 0:01 | signed out, guest |
| 2:04:24 | **11:40** | signed back in, **before typing anything** |

10:34 + 1:06 = 11:40, and the modal put the guest stretch at exactly 1m 6s. Jake
read the shortfall in the report as "we lost the guest minute"; the arithmetic
says the guest minute landed and the *last* minute was merely late. **Two
different absences that looked like one.**

**But no ~2:03 PM row ever appeared in the drill-down**, and unlike the other two
it has not turned up late. The 2:05 PM row reads `1 runs`, so it was not swept in
with the following flush either.

⚠️ **DO NOT GUESS BETWEEN THE CANDIDATES.** Type as a guest in Library for a
minute and, **before signing in**, run:

```js
JSON.parse(localStorage.getItem('ttb_sessionq_v1') || '{}')
```

* an `owners` key of `"\u0000guest"` holding a record → it queued, and the loss is
  in the handover (`sessionLogTake` → `sessionLogAdopt` → `flushAll('guest-retroactive', true)`).
* no such key → `logSession()` never pushed, and the fix is in `game.js`: either
  the sprint never closed or the five-second floor refused it.

⚠️ Jake's own account of the test: he typed continuously and finished a fable
each time but is **not sure a completion screen appeared**. The 2:02:59
screenshot shows a guest "Sprint Complete" at **0m 1s**, which the floor
certainly refused. Neither candidate is eliminated.

### 0.-10.G ✅⚠️ THE OVERNIGHT RESCUE — JAKE OVERTURNED A STANDING RULING

**Jake, 2026-08-20, verbatim:** *"If Kid A types a bunch but loses connection and
comes in tomorrow, I want him to be able to rescue that time. It wouldn't be
cheating, as it would get picked up and put in the right place. I'm not sure how
that would be a bad thing."*

⚠️ **THE RULING THIS OVERTURNS WAS IN THE REPO AND IT WAS CORRECT.**
`stats-wal.js`'s guest-accumulator header: *"⚠️ DATE-STAMPED AND DROPPED ON A NEW
DAY. Yesterday's guest minutes must not be silently credited to today — a
teacher's daily report is the one thing that has to mean what it says."* Every
word of that still holds. **It assumed the only available destination was
today's counter** — which was true when it was written and stopped being true
the moment Round 23 gave a guest's sprints a dated, sourced, 21-day queue.
`typing_logs` is keyed `{uid}_{date}`, so the right day is addressable.

⚠️ **THE GUEST ACCUMULATOR'S 24-HOUR DROP IS UNCHANGED AND MUST STAY.** It feeds
the LIVE counter, where "yesterday's seconds land on today" is exactly the wrong
answer. The rescue does not touch it. **Two mechanisms, two destinations** — the
accumulator owns today, the queue owns the days that are over.

| File | Version | What |
|---|---|---|
| `daylog.js` | **v1.4.0** | `carryOverPlan()`, `carryOverPayloadFor()` — pure, no clock, no storage |
| `game.js` | **v3.37.0** | `carryGuestDaysToTheirOwnDocuments()`, called after the flush |
| `tests/carryover-test.mjs` | **NEW** | 40 assertions; mutation-verified on both guards |

**Why it cannot inflate a grade, structurally rather than carefully:**
1. the input is **closed sprints only** — the open tail is not in the queue, so
   the rescue is always *less* than what the child typed;
2. `sessionLogTake()` is atomic, so a second sign-in finds nothing;
3. a guest's time has never reached `typing_logs` under any uid, so there is
   nothing to double.

**The failure direction is UNDER-crediting a child**, which is the one to have.

⚠️⚠️ **PRE-CUTOVER DAYS ARE REFUSED AND THAT IS THE §3.1 GUARD, NOT A GAP.**
Before `SOURCE_SPLIT_CUTOVER` a day's time is in the SHARED flat triple, and
adding to it is read-modify-write on a field the other page also writes — §3.1
with an addition in front of it. After the cutover the target is this page's own
per-source field, which no other writer may name, so the add is safe by
construction and needs no lock. **The rescue therefore switches itself on with
the cutover** and can never run against the shape it would corrupt.
⚠️ `carryOverPayloadFor()` **throws** on a pre-cutover date rather than falling
back to the flat triple. Do not "fix" that.

⚠️ **IT IS LIBRARY-ONLY. `learn.js` IS NOT WIRED** — ROADMAP item 2b. The shared
machinery is source-agnostic and the School side is already covered by the
harness; what is missing is six lines in `retroactiveSaveAnonSession()`. Held
back under the standing rule that a write-path change to the file 8th grade
depends on ships in a round that can watch School run. **Ship it with item 3**;
they touch the same function.

### 0.-10.H ✅ THE GUEST PATH, DRIVEN RATHER THAN READ

Jake ran the whole thing in the console. First time in the project's history.

| Step | Result |
|---|---|
| chapter completed as a guest | `[["\u0000guest", 1, ["102s 2026-08-20"]]]` |
| navigating away mid-sprint | queues — `pagehide` fires |
| sign-in | `Adopted 1 guest sprint record(s) into fuHvKkVj…` |
| after the flush | `[]` |

So the 2:03 PM record was **late, not lost** — §0.-10.A, for the third time in
one round.

⚠️ **ONE THING DID NOT FIRE.** Cmd+Tab to another application did NOT trigger
`visibilitychange`; macOS fires it on occlusion, not on focus loss. `pagehide`
covers the case that matters, so nothing is lost — but the comment above the
`visibilitychange` handler claims broader coverage than it has, and a future
round must not lean on it.

⚠️ **AND A FIRST READING WAS WRONG BECAUSE THE QUESTION WAS WRONG.** The first
console check returned `{}` and looked like a smoking gun. It was taken mid-
sprint, when an empty queue is the CORRECT state — the queue is only written
when a sprint ends. **Ask for the reading at a moment when the answer means
something**, or you will get a true answer to a question nobody asked.

### 0.-10.J ⚠️⚠️ ROADMAP ITEM 3 WAS A PHANTOM, AND THE WAY IT GOT THERE MATTERS

**Jake asked "why not fix the learn.js while we're in there?" The answer turned
out to be: because there is nothing to fix.**

Item 3, written in Round 23 as §0.-9.G and carried into two roadmaps, said:

> `learn.js`'s `_flushStatsInner()` opens only `if (!currentUser) return;` — and
> a guest is signed in **anonymously**, so `currentUser` is not null. A guest in
> School therefore writes `typing_logs/{anonUid}_{date}`: a real document under
> a uid no roster can attribute.

⚠️ **`signInAnonymously` APPEARS NOWHERE IN THIS REPOSITORY.** Not in `game.js`,
not in `learn.js`, not in `index.html`, not in any HTML shell. There is no
anonymous auth and there never has been. A guest has `currentUser === null`, the
guard has always caught them, and **no orphan document has ever existed.**
Firebase does not mint an anonymous user by itself; it requires that call.

⚠️ **HOW IT HAPPENED, WHICH IS THE USEFUL PART.** Both files are full of
`!currentUser || currentUser.isAnonymous` tests. Round 23 read two of them side
by side, noticed one file's guard was shorter than the other's, and inferred the
*state* the longer guard described. **A defensive guard is evidence that somebody
was being careful, not evidence that the case occurs.** The inference was made
from reading code rather than from establishing a fact, which is the identical
failure §0.-9.E warns about in capitals one section below — and this round
scheduled work against it before checking.

⚠️ **THE CHEAP RULE: GREP FOR THE MECHANISM BEFORE WRITING DOWN THE
CONSEQUENCE.** "A guest is signed in anonymously" is one `grep` away from being
settled either way. It cost two rounds because nobody spent it.

⚠️ **DO NOT "FIX" THIS BY ADDING ANOTHER `isAnonymous` GUARD.** It would be
harmless code that enshrines a false belief for the next instance to inherit —
which is exactly what happened here. If anonymous auth is ever switched on, this
whole area wants a real review, not another guard.

⚠️ **AND CHECK THE GUEST BRANCH AT `learn.js` ~2805 IF IT EVER IS.**
`if (currentUser && countsAsTime) … else if (!currentUser && countsAsTime)` — the
second branch is the one that fills `anonLessonProgress`, which is what
`retroactiveSaveAnonSession()` replays into the real account. It is live and
correct **because `currentUser` is null for a guest**. Turn anonymous auth on and
that branch goes dead, and a guest's completed lesson grades stop reaching their
account. That is a real defect waiting behind a config flag, and it is the
opposite of the one item 3 described.

### 0.-10.K ⚠️ THREE ASSERTIONS IN ONE HARNESS WENT RED FOR PROSE

`guest-merge-test.mjs` C4, C5 and C7 were all defeated by Round 24's edits
without a single behaviour changing: C4 and C5 required a literal nested
`sessionLogAdopt(user.uid, sessionLogTake(GUEST_QUEUE_UID)`, which had to become
a local so the rescue could plan from it before the flush; C7 used a
500-character proximity window that a comment block pushed the flush outside of.

All three now lift the function body and assert **order** — taken before
adopted, adopted before flushed. **v1.1.0.**

⚠️ **A SOURCE-TEXT ASSERTION SHOULD HOLD THE PROPERTY, NOT ONE WAY OF WRITING
IT.** A proximity window in characters is the worst version of this: it makes
documenting your own change a test failure, which teaches the next round to
write less of the thing this project runs on.

### 0.-10.F WHAT WAS DELIBERATELY NOT DONE

* ~~**ROADMAP item 3 and item 2b.**~~ Both resolved after Jake pushed back on the
  hold — 2b shipped (`learn.js` v2.22.0), item 3 **deleted** (§0.-10.J).
  ⚠️ **THE HOLD WAS RIGHT TO EXIST AND WRONG HERE**, and the distinction is
  worth keeping: the rescue cannot execute before the cutover, so it was inert
  on the school day after the deploy **by construction**. That is a property of
  this change, not a licence for the next `learn.js` edit.
* **The header budget.** `learn.js` went 297 → 303 lines and 32 → 33 entries,
  `game.js` 352 → 363 and 29 → 30, `daylog.js` 92 → 101; `session-log.js` is now
  over the entry budget as well as the line budget. All knowingly. The audit
  still reports **15 problems, the same count as before the round**. ROADMAP
  item 9.
* **Nothing was done about the late flush itself.** It is not obviously a defect
  — the records arrive — and "flush more often" trades Firestore writes for a
  teacher seeing numbers two minutes fresher. §0.-9's `HIDDEN_FLUSH_MIN_GAP_MS`
  comment already priced that at about $1/year against $85. Measure item 5 first.

---

## §0.-9. ⚠️⚠️ ROUND 23 (Empire) — THE GUEST MINUTE, AND A THEORY THAT WAS WRONG

**2026-08-20, afternoon.** ⚠️ **STUDENT WRITE-PATH ROUND.** Five shipped files.
`npm test` → **35/35, 0 unregistered.** `audit:versions` → zero "one of the two
is a lie."

### 0.-9.A ⚠️⚠️ THE DEFECT, IN JAKE'S OWN NUMBERS

One student, one machine, cache cleared, both modes:

| | guest total | after sign-in | server held |
|---|---|---|---|
| **School** (`learn.js`) | 1:04 | **8:31** | 7:27 |
| **Library** (`game.js`) | 1:11 | **8:31** | 7:27 |

7:27 + 1:04 = 8:31 — School merged the guest minute. Library landed on the
**same 8:31**, the server's own figure, so its minute was overwritten. The next
signed-in sprint took it 8:31 → 9:39, which the report confirms at 9m 39s /
1,633 chars.

⚠️ **THE CAUSE WAS AN ABSENCE, WHICH IS WHY NOTHING COULD GREP FOR IT.**
`learn.js`'s `onAuthStateChanged` calls `retroactiveSaveAnonSession()` **before**
`loadUserStats()`. `game.js`'s went straight to `loadUserStats()`, and
`applyWeekToStats()` is by its own header **AN ASSIGNMENT, NOT AN ACCUMULATION**
— it wrote the server's number over the guest's counter.

⚠️ **AND `game.js` DID HAVE THE MERGE — TWICE, INLINE, IN TWO MODAL PATHS.** The
"Nice work!" prompt merged. The start-modal merged. The header **Sign In**
button — three lines long, on screen at all times, the obvious one — did not.
**Whether a child kept their minutes depended on which of three buttons they
pressed.** Two copies of a rule are not the defect; the third caller that has
neither is.

### 0.-9.B ✅ WHAT SHIPPED

| File | Version | What |
|---|---|---|
| `game.js` | **v3.36.0** | `retroactiveSaveGuestSession()` — ONE copy, all three callers, **before** `loadUserStats()`. Guest sprints queued, not dropped |
| `learn.js` | **v2.21.0** | `logRun()` stops filing guests under the anonymous uid; adopts the guest queue; **logout reloads** |
| `session-log.js` | **v1.5.0** | per-owner queue store, `GUEST_QUEUE_UID`, `sessionLogTake()` |
| `reports.html` | **v2.25.0** | the reconcile and rebuild DELETED (§0.-9.D) |
| `tests/run-all-tests.mjs` | v1.5.0 | two harnesses deregistered, two added, fixture exempted |
| `tests/guest-merge-test.mjs` | **NEW** | 11 failing against v3.35.0/v2.20.0 |
| `tests/queue-owner-test.mjs` | **NEW** | 8 failing against session-log.js v1.4.0 |
| `tests/real-sessions-fixture.mjs` | **NEW** | the only real production session data in the repo |

⚠️ **UPLOAD `session-log.js` FIRST.** `game.js` and `learn.js` both import
`sessionLogTake` and `GUEST_QUEUE_UID` from it, and a missing export throws on
import and renders **nothing at all**. Shared module first, always.

### 0.-9.C ⚠️ THE THREE FIXES ON THE GUEST PATH, AND WHY EACH IS SEPARATE

1. **The merge.** `retroactiveSaveGuestSession()` in `game.js`, mirroring
   `learn.js`. ⚠️ **IT RUNS BEFORE `loadUserStats()` AND MUST STAY THERE** —
   it merges, then *flushes*, so the read that follows reads back the merged
   figure. Move it after and the assignment wins again.
   `guest-merge-test.mjs` Part B asserts that ORDER, which is the thing a
   future edit will get wrong.
2. **The record.** A guest's sprints go to `GUEST_QUEUE_UID`'s slot and are
   adopted at sign-in. Jake's requirement verbatim: *"As a flush so it's in the
   record, too."* Without this the day's total would be right and the
   drill-down would still be short — which **is the shape of ROADMAP item 1's
   real case**, and is now a named candidate for it rather than a mystery.
3. **Logout.** `learn.js` signed out without reloading, so a signed-out School
   page kept painting `Daily 8:31 / 10:00 · Weekly 59:12 / 50:00` — goal
   denominators and all. Under Rule 11 that is the worst kind of wrong number:
   a child reading a total that is not theirs. It reloads now, like `game.js`.

⚠️ **`sessionLogTake()` TAKES RATHER THAN READS, ON PURPOSE.** A handover
interrupted half-way loses the tail instead of adopting it twice. Losing a
guest's unlogged tail costs one sprint's detail; adopting it twice inflates a
graded number. That is the direction to fail in.

### 0.-9.D ✅ THE RECONCILE IS GONE — JAKE CONFIRMED THE BOUNDARY

`reports.html` **v2.25.0**, ~830 lines: `runReconcile()`, `renderReconPanel()`,
`reconCellsHtml()`, `readPairSessions()`, `unionSprintSeconds()`,
`uidIndexMap()`, `buildRebuildPlan()`, `renderRebuildPreview()`,
`runRebuildAll()`, `localToday()`, the Sessions / Δ / ⧉ / ⏱ Clock columns, their
notes panels, and the CSS. Jake, asked directly: *"As long as you agree none of
it is necessary, you can make all those cuts without impacting students at all."*

**Kept:** Generate, the CSV, the drill-down and its ⧉ badge, the per-day editor
and its SAVE box, and ⟳ on a single day.

⚠️ **TWO THINGS THE CUT NEARLY BROKE, AND THEY ARE THE LESSON:**
* **`runPool()` is used by Generate**, not only by the reconcile, and it read
  `RECONCILE_CONCURRENCY` and `reconCancel`. Cutting by function name would
  have left Generate throwing. It has its own `POOL_CONCURRENCY` now.
* **`recalcDailyLog()`'s `expect` option** became dead the moment the bulk
  rebuild went — its only caller was `runRebuildAll()`. Removed with its branch.

⚠️ **THE REAL SESSION DOCUMENTS WERE LIFTED BEFORE THE DELETION**, into
`tests/real-sessions-fixture.mjs`, which ROADMAP item 2 required in as many
words. `reconcile-test.mjs` and `union-clock-test.mjs` are deleted in the same
commit — **and the registration audit caught the attempt to remove only one
half**, which is that audit earning its keep for the second time.

### 0.-9.E ⚠️⚠️ THE PART A FUTURE INSTANCE SHOULD ACTUALLY READ

This round spent most of its length on a theory that was **wrong**, and the way
it went wrong is more useful than the fix.

`session-log.js` stored the queue under one key holding one uid, and `_write()`
had no ownership guard, so a second account's first push destroyed the first's
unflushed records. That is **true**, it is proven by
`queue-owner-test.mjs`, and it **cannot happen at Ellis** — every student logs
into the Chromebook with their own account, so per-browser is per-person.

⚠️ **THAT RULING WAS ALREADY IN THE REPO, IN `stats-wal.js`'s OWN HEADER**:
*"THIS IS THE ONE PLACE A SHARED MACHINE STILL MATTERS. See learn.js
checkpointOwner() for the ruling: every student at Ellis has their own account,
so per-browser is per-person."* I read that file top to bottom in the same
session and then asked Jake to run a classroom test to establish a fact he had
already written down. He had to say it twice.

**The rules that would have caught it, and are cheap:**
1. ⚠️ **BEFORE ASKING JAKE FOR GROUND TRUTH, GREP THE REPO FOR IT.** His
   rulings are recorded precisely so they stop being relitigated (§0.-7.A). A
   question you can answer from a file is a question you should not be asking.
2. ⚠️ **A MECHANISM IS NOT A CAUSE.** "This code could lose data" and "this is
   what lost Jake's data" are different claims. Rule 10 exists for the gap.
3. **The correction was worth more than the theory.** Asking *which two uids
   can actually meet on one profile* — the question left once shared machines
   were ruled out — led straight to guest-vs-signed-in, which is the real
   defect and needed no facts about the building at all.

⚠️ **THE PER-OWNER STORE IS KEPT AND IS NOW LOAD-BEARING FOR A DIFFERENT
REASON.** The guest slot and the account slot must exist at the same moment for
the handover in §0.-9.C to be possible. It stopped being a fix for a case that
cannot occur and became the mechanism for one that does.

### 0.-9.F ⚠️ STILL OPEN — LIBRARY SESSION RECORDS

In Jake's 2026-08-20 test, the drill-down showed School rows at 8:47, 9:00,
12:51 and 12:52 and **nothing from the Library typing at 12:55–12:57**, even
though that minute reached the daily total (8:31 → 9:39). The guest half of that
is explained and fixed. **The signed-in minute is not.** `logSession()` should
have fired at Sprint Complete.

**Do not guess between the two candidates — they are different fixes.** After a
Library sprint, before navigating, run `sessionLogPending(<uid>)` in the
console: non-zero means it queued and did not flush; zero means it never queued.

### 0.-9.G ⚠️ FOUND, NOT FIXED — learn.js FLUSHES FOR ANONYMOUS USERS

`game.js`'s `_flushAllInner()` opens `if (!currentUser || currentUser.isAnonymous)
return;`. **`learn.js`'s `_flushStatsInner()` opens only `if (!currentUser) return;`**
— and a guest is signed in *anonymously*, so `currentUser` is not null. A guest
in School therefore writes `typing_logs/{anonUid}_{date}`, which is a real
document under a uid no roster can attribute.

**Not fixed this round, deliberately.** It loses nothing — the student's own
document is correct via the merge — and it is orphan noise rather than a wrong
grade. It is a one-line change to the file 8th grade depends on, and it was not
demonstrated in Jake's test. **Fix it in a round that can watch School run.**

### 0.-9.H WHAT WAS DELIBERATELY NOT DONE

* **The 60-line header budget** on the six shared modules. `session-log.js` is
  back inside the **6-entry** limit; the line budget is untouched everywhere.
  The audit went 16 problems → 15. ⚠️ `game.js` (352 lines, 29 entries) and
  `learn.js` (297, 32) got worse, knowingly — the guest-minute notes were worth
  the lines. ROADMAP item 7.
* **ROADMAP items 3, 4, 5, 6.** Items 4 and 5 wait on the cutover week.

---

## §0.-8. ✅ §3.1 IS CLOSED — THE WRITERS SHIPPED, AND THREE THINGS TURNED UP WHILE DOING IT

**Round 22 (Smith Premier), 2026-08-20 afternoon.** ROADMAP items 1 and 3, done.
⚠️ **THIS IS A STUDENT WRITE-PATH CHANGE.** Six shipped files, five harnesses.

### 0.-8.A ⚠️ JAKE'S RULES DEPLOY LANDED AND IT IS CORRECT

`firestore.rules` **v2.6.0 is in the repo and in the right place.** The
`resource == null` clause is FIRST on `typing_logs`, ahead of both clauses that
dereference `resource.data`, mirrored pre-emptively onto `typing_sessions`, and
correctly *not* applied to `practice_sessions` (staff-query-only, no by-id
reader). Executed against the emulator: **54 + 18 = 72 assertions green.**

⚠️ **THAT FIX HAD NO HARNESS, AND NOW IT DOES.** `rules-probe.test.mjs` **v1.1.0
Part D** drives a full seven-day week read including a Saturday, a Sunday and a
day that has not happened yet — the exact shape `daylog.js readWeek()` makes —
plus the other half of the property: a stranger still learns nothing about a
document that *does* exist. **Proven red against the v2.5.0 clause order** by
deleting the null clause and re-running: 4 failing, then green when restored.

⚠️ **WHAT PART D IS REALLY ASSERTING IS CLAUSE ORDER**, which nothing else in the
repo can see. Every clause after the null test dereferences `resource`, so any
reordering reinstates the incident **silently, with the app still appearing to
work** — the page falls back to a live counter and the number on screen stays
plausible. That is how it survived to reach ninety children.

### 0.-8.B ✅ WHAT SHIPPED

| File | Version | What |
|---|---|---|
| `daylog.js` | **v1.3.0** | `SOURCE_FIELDS`, `sourceTotalsOf()`, `dayLogPayloadFor()`; `readWeek()` returns `todaySources`. **`totalsOf()` UNTOUCHED.** |
| `stats-wal.js` | **v1.1.0** | per-source counters in `DAY_COUNTERS`. Storage key unchanged. |
| `game.js` | **v3.35.0** | writes `secondsLibrary`/`charsLibrary`/`mistakesLibrary` only. Stale header fixed. |
| `learn.js` | **v2.20.0** | writes the School triple only. Stale header fixed. |
| `reports.html` | **v2.24.0** | `recalcDailyLog()` date-gated; cutover constant hoisted out of `generateReport()` |
| `lessons-admin.js` | **v1.13.0** | the fourth reader, date-gated |
| `tests/tab-lifetime-test.mjs` | **v2.0.0** | B, C, F assert the CORRECT totals; new Part I |
| `tests/crossmode-overwrite-test.mjs` | **v2.0.0** | rewritten onto per-source FIELDS |
| `tests/daylog-cutover-test.mjs` | **v1.1.0** | Part G: `lessons-admin.js` parity |
| `tests/rules-probe.test.mjs` | **v1.1.0** | Part D: the null-resource incident |
| `tests/session-merge-test.mjs` | **v1.6.0** | the dead v3.33.0 HUD reset is now asserted ABSENT |

**`npm test` → 35/35. `npm run test:rules` → 72 passing.**
**`audit:versions` → zero "one of the two is a lie".**

### 0.-8.C ⚠️⚠️ THE WRITERS ARE DATE-GATED, AND THE ROADMAP DID NOT SAY SO

ROADMAP item 1 assumed the deploy day *is* the cutover day. **It is not.** The
upload lands on a non-school evening; the cutover is Saturday 2026-08-22.

⚠️ **EVERY READER IS LEGACY-FIRST BEFORE THAT DATE.** A page that started writing
`secondsLibrary` on the 21st would file that whole afternoon in a field every
reader in the app ignores, and the day would read as the morning's stale flat
number. **So the gate is on the writer too**, in `daylog.js dayLogPayloadFor()` —
**one `if` in the entire app** decides which shape a day is written in, and both
pages pass their cross-mode counter AND their per-source counter into it so the
choice of counter and the choice of field cannot disagree.

**Consequences worth knowing:**
- The upload is **safe on any day of the week** and changes nothing until Saturday.
- A machine that misses the deploy is merely **old**, not at odds with the new shape.
- ⚠️ **§3.1 IS STILL LIVE FOR THE DAYS IN BETWEEN.** `tab-lifetime-test.mjs`
  Part D and `crossmode-overwrite-test.mjs` Part D **assert that defect on
  purpose.** Do not "fix" them. It is bounded by the calendar.

### 0.-8.D ⚠️ THE ⟳ BUTTON WOULD HAVE THROWN, NOT MERELY LOST DATA

ROADMAP item 3 was right that `recalcDailyLog()`'s `deleteField()` calls become
a data-loss button after the cutover — the split fields *are* the day by then.
Gated: before the cutover, byte-for-byte v2.23.0; after it, the day comes back as
the two per-source triples out of `splitSessionTotals()` **and the flat triple is
deleted**, because ⟳ asserts "this day equals its sessions" and the sessions
cover the whole day including any flat morning. That also makes the result
correct under **both** branches of `readLogTotals()`.

⚠️ **BUT THE GATE DID NOT COMPILE INTO A WORKING BUTTON.**
`SOURCE_SPLIT_CUTOVER` was declared **inside `generateReport()`'s scope**.
`recalcDailyLog()` is a sibling function outside it. The gate parsed fine and
would have thrown a `ReferenceError` on the first click, with nothing on screen
to explain it. **Found by `undefined-calls-test.mjs`, which is exactly the class
of defect that harness exists for.** The constant now sits at the top of the
script. ⚠️ **ONE DECLARATION ONLY** — a second one anywhere in that file lets the
read path and the write path disagree about the date with nothing to notice.

⚠️ **THE PER-DAY EDITOR'S SAVE BOX IS DELIBERATELY *NOT* GATED.** The two buttons
assert different things: ⟳ says *this day equals its sessions*, which is a claim
about where the time came from and must be filed per source; the SAVE box says
*this day was N minutes, because I was in the room*, which is a claim about the
total with no claim about the mode. Writing N into the frozen flat field and
clearing the splits says exactly that, and after the cutover the reader sums, so
the day reads as N. **Known and accepted:** a student tab left open across the
edit still flushes its own counter on top. That hazard predates the cutover —
the same tab used to overwrite the correction outright — and no client-side
change removes it.

### 0.-8.E ⚠️ `lessons-admin.js` WAS A FOURTH READER AND NOBODY HAD COUNTED IT

`daylog.js`, `reports.html` and `index.html` all learned the cutover in v2.22.0.
**The Students roster panel in `lessons-admin.js` has its own legacy-first copy
of the totals rule and did not.** From Saturday it would have shown a roster of
students with a week of nearly nothing while `reports.html`, three clicks away,
showed their real minutes.

⚠️ **THE PROBLEM IS THAT THERE ARE THREE HAND-MAINTAINED COPIES OF ONE RULE**,
and the reason is the same each time: three standalone pages that cannot import
each other. `daylog-cutover-test.mjs` **Part G now lifts this third copy too** and
drives it against `daylog.js` on identical inputs, so all three are held to one
behaviour **by execution rather than by anyone remembering**. Parts F and G
together are the only mechanical guard on that trio.

**The lesson to carry:** when a rule is copied, the copies are found by asking
*who else reads this collection* — not by grepping for the rule, which only finds
the copies that already agree with you.

### 0.-8.F ⚠️ THE WAL TRADE, STATED PLAINLY BECAUSE IT IS A REAL NARROWING

Before v1.1.0, a School tail stranded in the shared stats WAL could be flushed by
a **Library** page, because both pages wrote the same `seconds` field and either
could push the other's number. **That is over.** Each page writes only its own
triple, so a Library page recovering `secondsSchool` has nowhere to put it. The
value is kept and carried — a later School page flushes it — but it is no longer
true that any page can drain the whole record.

**This is the smaller loss and it is deliberate.** What the old behaviour bought
was the tail of the other mode, bounded by one flush interval and recovered the
next time that mode is opened. What it cost was that either page could write the
other's minutes, **which IS §3.1** — unbounded and permanent. ⚠️ **Do not "fix"
this by letting a page write the other's field when it looks larger.** That is
§3.1 with a comparison in front of it.

⚠️ **THE STORAGE KEY IS UNCHANGED ON PURPOSE.** A v1.0.0 record has no per-source
keys; `_mergeInto()` skips absent keys, so it still replays its `secondsToday`
correctly and contributes nothing to the new counters. Bumping the key would have
thrown away every unflushed tail in the building on deploy day.

### 0.-8.G ⚠️ HOW THE HARNESSES FAIL AGAINST THE OLD BUILD — THIS IS THE RULE 10 PART

ROADMAP item 1 step 1 required that `tab-lifetime-test.mjs` B, C and F **fail
against the shipped build before anything else moved.** They do, and the
mechanism is worth keeping:

**The controller those parts drive is not chosen by whoever edits the harness.
It is chosen by reading `game.js` and `learn.js`.** If both build their payload
with `dayLogPayloadFor()`, the split controller is live; otherwise the flat one
is. Against a build without the writers, B/C/F drive the flat controller against
the correct totals and go red — **6 of 19 failing**, verified by running the new
harness against the original v3.34.0 files side by side.

⚠️ **THAT INDIRECTION IS LOAD-BEARING, NOT CLEVERNESS.** A model harness that
hard-codes which shape it believes is shipped proves only that its author's idea
is internally consistent. **That is precisely how `crossmode-overwrite-test.mjs`
spent six rounds validating a per-source DOCUMENT design the deployed rules
reject outright.** It is rewritten onto fields, and its Part A — *neither page
may name the other source's fields in a Firestore payload, ever* — is now the
assertion that would notice §3.1 coming back.

### 0.-8.H WHAT WAS DELIBERATELY NOT DONE

* **ROADMAP item 2, removing the reconcile.** Independent of this work, and
  §0.-7.A item 3 still stands: confirm the boundary with Jake before cutting,
  because it shares `reports.html` with the drill-down and the per-day editor,
  which he uses.
* **ROADMAP items 3 (the session record losing work), 4, 5, 6, 7 and 8.**
  Untouched. Item 5 is now measurable — the day after the cutover is the first
  clean `log ÷ sessions` day on the new shape.
* **The idle-threshold rationale as a code comment.** §0.-7.D wanted it folded
  into this deploy. Not done: both headers were already over budget and this
  round added to them. §0.-7.A item 1 remains the record. ⚠️ It is a comment,
  not behaviour — **do not "fix" the 2s/3s constants while adding it.**

---

## §0.-7. ✅ PHASE A COMPLETE — AND JAKE'S RULINGS, RECORDED SO THEY STOP BEING RELITIGATED

**Round 21 (Hammond), 2026-08-20 morning.** ⚠️ **NOTHING IN THIS SECTION SHIPS TO
A STUDENT.** Six files, all test tooling and config. `game.js`, `learn.js`,
`reports.html`, `daylog.js` and `firestore.rules` are untouched.

### 0.-7.A ⚠️⚠️ JAKE'S RULINGS. DO NOT REOPEN THESE.

Each of these has now cost the project a round because it lived in a chat log
instead of a file. **They are settled.**

1. ⚠️ **THE 2s / 3s IDLE ASYMMETRY IS CORRECT AND DELIBERATE.** Jake, verbatim:
   *"in game they know how to type and learn they don't."* Library is for
   students who can already type, so a 2-second gate is right; School is for
   students who cannot, whose keystroke gaps are legitimately longer, so 3
   seconds is right. **It is not a bug, it is not an inconsistency, and it is not
   a violation of "everything should do both."** Round 21 raised it as a defect
   (§0.-6.C) and was wrong. ⚠️ **`ROADMAP.md` PHASE C1 IS WITHDRAWN.** Jake added
   that if instances keep reopening it, collapse both to 2.5 — **treat that as
   what it is: an expression of exhaustion at the churn, not a design decision.**
   The right response is to leave the constants alone and stop raising it.

2. ⚠️ **TIME IS A VALID BASIS FOR A GRADE.** Jake: *"Time is a perfectly valid
   way to grade if the practice is legitimate. The goal is to make a tool that
   measures legitimate practice time."* **`ROADMAP.md` §6 D-1 — "stop grading
   minutes, grade chapters instead" — IS REJECTED.** The pedagogy is settled:
   typing a book is excellent practice once a student can type; School exists to
   get them to that point. **The job is to make the minutes legitimate, not to
   stop counting them.** Do not re-propose D-1.

3. **THE RECONCILE TOOL IS TO BE REMOVED.** Jake: *"Torch it. Torch the
   reconcile."* ⚠️ **NOT DONE THIS ROUND AND DELIBERATELY SO** — "Reconcile vs
   Sessions" shares `reports.html` with the drill-down and the per-day editor,
   which Jake **uses** and which are not implicated. Removing the wrong one costs
   him a tool he relies on. **Confirm the boundary with him before cutting.** It
   writes nothing today, so there is no urgency.

4. ⚠️ **THE HISTORICAL DATA IS GOOD ENOUGH AND IS NOT TO BE "REPAIRED."** Jake's
   own account: a previous audit repaired the daily logs each time he ran it, as
   he went. His judgement: *"The time that is currently showing is the real time,
   or it's close enough."* **He is the person with ground truth about what he
   ran, and this is his call to make.** ⚠️ **NO INSTANCE MAY PROPOSE A BULK
   REBUILD OF PAST DAYS.** The remaining exposure he has already accepted is a
   couple of students who typed at home.

5. **CONSOLE TAMPERING → a report-side outlier check, later.** Jake: *"If a kid
   finds that in the console, I find it hard to believe that we couldn't have
   some sort of check in the reports that wouldn't find an obvious overcount."*
   He is right and it is cheap — an implausibility flag in `reports.html`, not a
   rules change. **Roadmap item, not urgent.** Note it needs the log-to-session
   baseline to set a threshold.

### 0.-7.B ✅ WHAT PHASE A SHIPPED

| File | Version | What |
|---|---|---|
| `tests/run-all-tests.mjs` | **v1.4.0** | Three orphans registered; new `RULES` list; **REGISTRATION AUDIT** |
| `tests/tab-lifetime-test.mjs` | **v1.0.0 NEW** | 13 checks. The axis nothing covered. |
| `tests/rules-probe.test.mjs` | **v1.0.0 NEW** | 13 assertions against the real rules |
| `tests/firestore-rules.test.mjs` | **v2.0.0** | 14 red → **54 passing, 0 failing** |
| `tests/README.md` | v1.4.0 | The emulator setup; counts now audit-enforced |
| `package.json` | — | `test:rules`, `test:rules:setup` |
| `firebase.json` | **NEW** | Emulator config only. **Changes nothing about deploys.** |

**`npm test` → ALL 33 HARNESSES PASS.** **`npm run test:rules` → 67 passing.**

⚠️ **THE REGISTRATION AUDIT IS THE PART THAT MATTERS**, not the three lines that
registered the orphans. A harness is only coverage if something notices when it
stops being run, and until now nothing did. The suite now fails on any `.mjs` in
`tests/` that is in no list and not exempted **with a written reason**.

⚠️ **`tab-lifetime-test.mjs` PARTS B, C AND F PASS BY ASSERTING A DEFECT.** They
are green *because* the shipped build loses the time they say it loses. **When
Phase B lands they must be rewritten to assert the correct totals, and must fail
before the writers change.** A green there today is not a green there tomorrow.

### 0.-7.C ⚠️ THREE THINGS FOUND WHILE DOING PHASE A

* ⚠️ **THE TWO RULES HARNESSES CANNOT SHARE ONE `mocha` PROCESS.** Both declare
  root-level hooks that seed and clear the emulator; interleaved, each wipes the
  other's seed and five roster assertions fail with `Null value error` — which
  looks **exactly** like broken security rules. `test:rules` runs two separate
  invocations for this reason. **Do not merge them to save three seconds.**
* ✅ **THE OPEN UNKNOWN FROM §0.-5.G IS RESOLVED, AND IT IS BENIGN.** Split, the
  token-less assertion shows `books/{id}` is `allow read: if true` **on purpose**
  — a signed-out child must be able to open a book before they have an account.
  Student logs and classes are correctly denied. **The old test asserted a policy
  this project does not have.**
* ⚠️ **`firestore-rules.test.mjs` HAD A SECOND WRONG ASSERTION**, unrelated to the
  seed: it created a class with no `teacherUids` and expected success. The rule
  requires a teacher to put themselves on a class they create, or they would make
  a class they cannot then read. **The rule is right.** Both halves are now
  asserted so the requirement is visible.

### 0.-7.D WHAT WAS DELIBERATELY NOT DONE

* **The stale version headers** (`game.js` says v3.30.0, runs 3.34.0). Comment-only
  — but fixing them means re-uploading a **396 KB student file** for a comment.
  ⚠️ **FOLD IT INTO THE PHASE B DEPLOY**, when those files are being touched
  anyway. Not worth a standalone student-file deploy, and certainly not before
  first period.
* **The idle-threshold rationale as a code comment.** It belongs in `game.js` and
  `learn.js` above the constants, and it ships with Phase B for the same reason.
  Until then §0.-7.A item 1 is the record.
* **Removing the reconcile.** §0.-7.A item 3.

---

## §0.-3. ⚠️⚠️⚠️ JAKE'S STANDING RULES 9, 10 AND 11 — THEY OUTRANK EVERY PLAN BELOW

Added 2026-08-19 on Jake's instruction, after this project cost him an evening
for the sixth time. They apply to every project, not only this one. **An
instance that cannot satisfy them must SAY SO and ask Jake to overrule, not
quietly proceed.**

**RULE 9 — SINGLE SOURCE OF TRUTH.** Adding a second record of a quantity that
already exists requires DELETING the first in the same deploy. If the first
cannot be deleted — a security rule, a live index, an API limit — **the round
does not ship the addition. It ships work on the blocker.**

> *Why:* every counting incident in this project traces to one sentence — "the
> rules won't let me remove the old one yet, so I'll add the new one now and
> clean up later." `stats/time_tracking` existed for months because
> `firestore.rules` would not let a student read their own daily log. That was a
> true constraint and the round shipped the second copy anyway. Rule 9 says the
> rule change WAS the round.

**RULE 11 — SACRED, AND IT OUTRANKS RULES 9 AND 10 AND EVERYTHING BELOW.**
The number the student sees and the number the teacher pulls must be the SAME
NUMBER, read from the same record by readers proven identical. No feature ships
if it could let them diverge. ⚠️ **A divergence can live in the QUERY or the
DATE RANGE, not just the arithmetic** — §0.-2 (a UTC date formatter) and §0.-4
(a `classId` WHERE clause) are both proof. Test the query.

**RULE 10 — PROVE IT ON REAL DATA FIRST.** No number becomes a graded or
reported value until a harness exists that FAILS against real production data
before the fix and passes after. **A green suite on synthetic data is not
evidence.**

> *Why:* Round 18 verified every session document against its own `sprints[]`
> and all four corrupt documents passed. Internal consistency is a statement
> about ONE record; the defect lived BETWEEN records. Round 19 then derived a
> grade from those records — Stage 2 — with a fully green suite.
> ⚠️ **`week-agreement-test.mjs` Part B passes with the UTC bug fully present**
> because it runs at local noon. Part C is the same check at all 24 hours and it
> fails. That gap is the whole of Rule 10 in one file.

---

## §0. ⚠️ HOW THIS DOCUMENT WORKS — read before writing a word of it

**There is one handoff. This one. It is amended in place and never forked.**

1. **Never create `HANDOFF-roundN.md`.** Not to archive, not to be safe, not
   because your round was big. GitHub commit history is the archive and it is
   sufficient. A second handoff file is the beginning of nine of them.
2. **Never cite a document that is not in the repo.** Not "see round 8 §4", not
   "the reasoning is in the old handoff". If a claim matters, the claim goes
   *here*, in full, in your own words. If you cannot restate it because you cannot
   read it, then **it is gone, you say so once, and you move on.** Jake has stated
   plainly that he will not go looking, and he is right not to.
3. **Amend, don't append.** When your round supersedes a paragraph, *rewrite that
   paragraph.* Do not add a §7.4 amendment below a §7 that is now wrong. Round 12
   did that and the wrong version stayed on the page.
4. **Bump this file on the `x.y.z` pattern** in the comment block above. Minor for
   a normal round; major only with Jake's sign-off, like any other file.
5. **Delete as you add.** If your round makes a section obsolete, remove it in the
   same commit. This document earns its length only by being the shortest thing
   that is still complete.
6. ⚠️ **INVARIANT NUMBERS IN §5 ARE APPEND-ONLY. NEVER RENUMBER THEM AGAIN.** A
   new invariant takes the next free number and goes at the bottom of its group.
   Round 14 renumbered once, as a repair, and it cost seven file uploads — see §5.
7. **A document a session produces ships in the same commit as the code**, or it
   does not exist. This is the oldest rule in the project (Blick, Round 3) and
   breaking it is what produced the mess this file cleans up.

---

## §1. ⚠️ HARD CONSTRAINTS — these are not preferences

**Jake has no command line.** No `firebase deploy`, no `gcloud`, no emulator, no
`npm` on the machine that matters. He uploads files through the GitHub web portal
and clicks in the Firebase and Google Cloud consoles. **Anything that is not (a) a
file on GitHub or (b) a console click is not shippable.** An entire Auth
custom-claims role system was built across two rounds before anyone asked. That one
constraint explains `firestore.rules` v2.x reading Firestore documents instead of
token claims, and why `functions/index.js` is undeployable.

**Complete replacement files, never diffs or patches.** Every time.

⚠️ **DELIVER THE REPO AS A ZIP, WITH EVERY FILE ALREADY IN THE DIRECTORY IT
BELONGS IN.** `tests/`, `tools/`, `docs/`, `firebase/`, `functions/`, `library/`.
Round 17 spent an evening emptying the repo root and it is not to be refilled by
a lazy delivery. Jake unzips and drags each file to the matching path; a flat
zip makes that a guessing game.

⚠️ **THE DEPLOY / TEST DOCUMENT GOES ALONGSIDE THE ZIP, NEVER INSIDE IT.** Jake's
instruction, 2026-08-19, after a `DEPLOY-ROUND19.md` shipped inside the archive:
he uploads what is in the zip, so anything in the zip is a candidate for the
repo. A deploy note is **scaffolding for one delivery** — an upload order, a
console step, a test script, a delete list — and it has no business in a
repository that already carries `README.md` and `HANDOFF.md` as its permanent
documentation. Present it as a **separate file in the same message**, where he
can read it without unzipping anything.

⚠️ **ANYTHING DURABLE OUT OF A DEPLOY NOTE BELONGS IN `README.md` OR THIS FILE
INSTEAD.** If a step will be true again next round — the weekly grading
procedure, how to fire the update gate, where the version stamps are — it is
documentation, not scaffolding, and putting it only in a throwaway note means
re-deriving it next time.

**Version constants, not header comments.** Each file carries a runtime constant
that renders on the page; the header comment is decoration. `versions.js` parses the
constants out of the deployed files precisely so a stale cached file cannot lie about
its own version. Bump the constant.

- **One bump per shipped release, not per edit.**
- **Never walk a deployed version backwards.** Corrections go forward.
- **Patch (z) for fixes, minor (y) for features, both automatic. Major (x) requires
  Jake's explicit sign-off** — flag it, don't decide it.
- ⚠️ **THREE VERSION PINS EXIST.** `session-merge-test.mjs` and `open-unit-test.mjs`
  Part D both pin `session-log.js`; `hud-test.mjs` pins `hud.js`. Bump either module
  and every pin on it moves in the same commit. Round 14 tripped over this twice in
  one evening, and both times the suite named the miss on the first run. **Grep for
  the version string before bumping a shared module.**

**`npm install` first on a clean container**, then `npm test`. Dependencies are in
`devDependencies` and are not vendored. **Round 10 shipped without running the suite
and took lesson mode down completely**; the harness that already existed named the
defect by file and line on the first run.

**Upload order is load-bearing whenever a shared module is involved.** `game.js` and
`learn.js` both import `session-log.js`, `stats-wal.js` and `hud.js`. A missing module
throws on import and renders **nothing at all** — there is no graceful degradation.
Shared modules go up first, always. Where a writer and a consumer change together,
ship the *consumer* first unless you have reasoned otherwise in writing: an old
consumer silently discards a new field.

**`experimentalForceLongPolling` in `firebase-config.js` is load-bearing.** It fixes
Safari's CORS block on Firestore's WebChannel transport. Not debug leftovers.

**Never retain student-identifying data.** No Skyward IDs, no real names, no
demographics tied to a person. The leaderboard stores initials only and there is no
browsable user directory, by design. `users/{uid}` deliberately holds no PII, which is
*why* the roster is built from `typing_logs` (§3.10).

---

## §2. Where the code is

Shipped state after **Round 22, 2026-08-20**. **Verified by running
`npm run audit:versions`, not copied from the previous table** — three
consecutive rounds carried a stale version for `admin.js`, and `game.js` and
`learn.js` carried header comments that disagreed with their own constants for
five and four versions respectively. **Both are fixed; the audit now reports
zero "one of the two is a lie".** Run the audit; do not trust this table either.

⚠️ **ROUND 22 IS A STUDENT WRITE-PATH ROUND.** `game.js`, `learn.js`,
`daylog.js`, `stats-wal.js`, `reports.html` and `lessons-admin.js` all moved.
See §0.-8 before deploying any of them, and §0.-8.B for the order.

| file | version |
|---|---|
| `game.js` | **3.36.0** — ⚠️ Round 23. THE GUEST MERGE, §0.-9. Writes the Library triple only |
| `learn.js` | **2.21.0** — ⚠️ Round 23. Guest runs off the anon uid; logout reloads. §0.-9 |
| `session-log.js` | **1.5.0** — ⚠️ Round 23. PER-OWNER queue + `GUEST_QUEUE_UID`. ⚠️ UPLOAD THIS FIRST — both pages import from it. Its TWO pins moved with it |
| `hud.js` | 1.2.0 |
| `variety-floor.js` | 1.0.0 |
| `stats-wal.js` | **1.1.0** — ⚠️ Round 22. Per-source counters in DAY_COUNTERS; storage key unchanged. §0.-8.F |
| `versions.js` | 1.9.0 — ⚠️ Round 19 |
| `daylog.js` | **1.3.0** — ⚠️ Round 22. The shared week reader, the cutover, and `dayLogPayloadFor()` — **the one gate deciding a day's shape**. §0.-8.C |
| `keyboard.js` | 1.1.1 |
| `adventure-renderer.js` | 1.5.4 |
| `admin.js` | 3.31.1 — ⚠️ Round 19: two real import-metadata defects, see §6 item 3 |
| `lessons-admin.js` | **1.13.0** — ⚠️ Round 22. The FOURTH reader of typing_logs, date-gated at last. §0.-8.E |
| `staff-admin.js` | 2.2.0 |
| `reports.html` | **2.25.0** — ⚠️ Round 23. THE RECONCILE AND REBUILD ARE DELETED, §0.-9.D |
| `update-gate.js` | 1.0.1 — ⚠️ NEW in Round 19. Loaded by its own script tag in both shells, NOT imported. See §0.10 |
| `index.html` | 3.9.0 — ⚠️ Round 19 Stage 1 |
| `firebase-config.js` | 1.2.0 |
| `firebase/firestore.rules` | **2.6.0** — ⚠️ **Jake deployed this 2026-08-20 and it is CONFIRMED CORRECT BY EXECUTION.** The null-resource clause is FIRST and must stay first. §0.-8.A |
| `style.css` | 3.5.5 |
| `game.html` | 1.2.0 — ⚠️ Round 19 added the update-gate script tag |
| `learn.html` | 1.1.0 — ⚠️ Round 19 added the update-gate script tag |
| `functions/index.js` | 1.7.0 — Cloud Function, NOT deployable from this repo; Jake mirrors it into the console by hand. See its own header. Moved out of the root in Round 17; the file is byte-identical. |

`npm test` → ⚠️ **ALL 35 HARNESSES PASS, 0 PENDING, 0 UNREGISTERED.**
(Round 23: two harnesses added, two deleted with the code they covered.)
`npm run test:rules` → **72 passing** (54 + 18) against the deployed rules.
⚠️ **TWO HARNESS PARTS ASSERT A DEFECT ON PURPOSE** and must not be "fixed":
`tab-lifetime-test.mjs` Part D and `crossmode-overwrite-test.mjs` Part D are the
pre-cutover shape, which is still live until 2026-08-22. `tab-lifetime-test.mjs`
Part E is the v3.29.0 seeding mistake, driven deliberately so it cannot ship
twice. Everything else asserts what a student earned.

Historical note — Round 19 added
`tests/daylog-test.mjs` (28 assertions, five mutation-verified) and **closed the
standing `metadata-map-test` failure that had been carried as acceptable for
several rounds.** It was not a book-metadata question: it was reporting two real
defects in `admin.js` (§6 item 3). **The number to watch is now "0 failing, 0
missing." Anything else is new** — and invariant 54's warning about an accepted
red hiding the next real failure has just been demonstrated the hard way, so do
not re-open one.

**Deploy check, in one glance:** Library footer reads `game.html vX · game.js vX ·
style.css vX` (⚠️ CHANGED IN ROUND 15 — it used to read just `game.js v3.26.2`; if
you see that old single-file format, Round 15's code is not running). Lessons footer
reads the same three-file shape for `learn.html` / `learn.js` / `style.css`. Hover
either footer (tap-to-pin on touch) for the full deployed build, `hud.js` and
`session-log.js` and `stats-wal.js` included. Both student pages still show a small
grey `ID xxxxxxxx` bottom-left once signed in. **If the ID stamp is missing, the new
code is not running** and nothing
else you check means anything.

---

## §3. Architecture — understand these before editing

### 3.1 ⚠️ THE CENTRAL PROBLEM: three documents hold one quantity

| document | written | authoritative for |
|---|---|---|
| `users/{uid}/stats/time_tracking` | every flush | day + week totals (HUD) |
| `typing_logs/{uid}_{date}` | every flush | day totals (reports grade from this) |
| `typing_sessions/*` | unit end, and on hide | nothing — drill-down display only |

**Every counting incident in this project's history is the same sentence: two records
of one quantity, updated on different paths, disagreed.**

⚠️ **AND ROUND 19 FOUND WHY THE SECOND RECORD HAD TO EXIST: `firestore.rules`
gave the student's browser NO READ ACCESS to `typing_logs` or `typing_sessions`,
so the HUD could not display the graded number and was forced to keep its own
copy. Read §0.0.2. Do not spend another round trying to make two copies agree —
that guarantee does not exist. Delete one.** The doubled week counter, the
missing stats documents, the HUD that changed on refresh, the cross-mode overwrite —
all of it.

⚠️ **`typing_logs/{uid}_{date}` is ONE document written by BOTH page controllers, each
from its own in-memory counter.** A student does ten minutes in School, opens Library,
and `game.js` writes 240 seconds over the top of 600. **That is a live data-loss path
today**, in the document the project grades from. Closing it is what §4 is about.

⚠️ **Do not re-gate the stats write on `final`.** Round 11 did, to save ~$85/year.
Result: roughly half of ninety students had no stats document at all, because a `final`
flush needs a deliberate exit and a child closing a Chromebook lid produces none. The
real saving is about $7/year at district scale and it cost the entire week of
2026-08-18.

### 3.2 The write-ahead log

`saveProgress()` used to fire on every `.`/`!`/`?`/newline, writing three documents each
time. Now everything records synchronously to localStorage each sentence and flushes to
Firestore on a timer (`FLUSH_INTERVAL_MS` / `LEARN_FLUSH_MS` = **300000**, five minutes)
and on real boundaries. `walRecover()` replays on the next load; `typing_logs` is a merge
and therefore idempotent under replay.

⚠️ **The WAL does not always survive.** It lives on hardware shared between students. Any
design treating it as a durability guarantee is wrong.

### 3.3 `session-log.js` — records, deltas and the watermark

A session record is one bounded stretch of typing: a Library sprint or a School run.
Records queue in localStorage, grouped by the date they were **typed** (not flushed — a
queue surviving overnight used to collapse yesterday's work onto today), and write in
rollup documents capped at `RECORDS_PER_DOC` = 200.

`logOpenSprint()` (game.js) and `logOpenRun()` (learn.js) close the open unit on
`visibilitychange: hidden` and `pagehide` **without ending it** — counters and
`sprintCharStart` are untouched, so a student who returns and finishes has only the
remainder recorded. This exists because a student who switches books every few sentences
used to produce counter time with *no session history at all*.

⚠️ **BECAUSE ONE STRETCH OF TYPING CAN PRODUCE SEVERAL RECORDS, THE WRITERS EMIT DELTAS
against a watermark of what has already been logged.**

- A zero or negative delta writes nothing and is not an error.
- A continuation carries its **own** recomputed WPM and accuracy. `reports.html` reads
  per-run figures as belonging to the row they sit on, the 🚩 fast-run marker especially.
- `continuation` records are exempt from the 5-second floor. A standalone 3-second run is
  noise; the 3-second tail of a recorded 40-second sprint is the rest of something real.
  A refused *first* record deliberately does not advance the watermark, or the seconds it
  declined would be orphaned.

⚠️ **RESET THE WATERMARK WHEREVER YOU RESET THE COUNTER, IN THE SAME PLACE.** Four such
sites in `game.js`, three in `learn.js`. A new sprint carrying a stale watermark records
**nothing** until it grows past the previous sprint's length — a silent loss, not a
crash. `open-unit-test.mjs` counts the reset sites against the shipped sources.

`flushSessionsNow()` uploads the queue immediately on hide and on navigation, outside the
60-second rate limit, because the queue was previously drained only by a `final` flush and
Reports showed n-1 sessions as a result. It is self-limiting.

### 3.4 ⚠️ `serverAt`, and why nothing reads it

Every date, duration and WPM interval is stamped by the student's own Chromebook clock.
`serverAt: serverTimestamp()` resolves at commit and lands on every `typing_sessions`
rollup. **Nothing reads it. No total derives from it. No panel shows it.** That is the
point: a cheat signal added on the day you need it has no history behind it.

⚠️ **`_stampServer()` HAS NO CLIENT-SIDE FALLBACK AND MUST NEVER ACQUIRE ONE.** A
`serverAt` built from `new Date()` agrees with `timestamp` by construction, so the
divergence is permanently zero — a field certifying "no clock tampering" whether or not
there was any. `session-merge-test.mjs` asserts the absence of a fallback against the
source text.

⚠️ **The dependency is optional on purpose.** `sessionLogInit()` takes `serverTimestamp`
and works without it, omitting the field. Jake uploads one file at a time, so there is a
window where the module is new and a page controller is cached. A *required* dependency
would write `serverAt: undefined`, which Firestore rejects, which fails the whole rollup
write, which loses a period of sprint detail. **A missing dependency costs one field; a
required one costs a period.**

⚠️ **There is no `clientAt` field and adding one would be a defect.** `timestamp` already
holds that value and keeps its name because `reports.html` and a live single-field index
exemption already know it.

### 3.5 ✅ ONE CLOCK — School's two-clock split is CLOSED (Round 14)

**Jake's ruling, 2026-08-18: time typed starts at the first CORRECT keystroke of a
run.** `drillPos` advances only on an accepted character, so `drillPos > 0` is that
moment exactly, and it is now the single gate on both pages.

`startGradedTimer()` in `learn.js` owns the **only** tick in that file, and
`stepSeconds`, `learnActiveSeconds`, `secondsToday` and `secondsWeek` all advance on
consecutive lines inside it. `gameTick()` in `game.js` gates on `lastInputTime` being
set, so a sprint no longer counts the two free seconds it used to grant before the
first keystroke. **Read `startGradedTimer()`'s header before adding anything to it.**

⚠️ **THERE WERE THREE INCREMENT SITES, NOT TWO** — `stepSeconds` under the graded
gate, `secondsToday` in a second interval under an idle-only gate, and a third copy of
that second interval inside `closeGenie()` with `ggBypassIdle` wired differently from
`game.js`. Collapsing them closed four things at once without any being fixed
separately: the first-keypress/first-correct-keypress gap, a hard stop that stopped
one clock and left the other running, the admin No-Idle flag meaning two different
things on the two pages, and the 1s-versus-100ms sampling difference (which retires
`DESIGN-TELEMETRY` step 6).

⚠️ **`learnTickInterval` IS AN ALIAS FOR `timerInterval`, NOT A SECOND TIMER.** Nine
call sites already clear it to stop the clock; aliasing keeps all nine correct rather
than betting they were all found. **Do not "clean up" one of the names without
checking every clear site.**

⚠️ **PAINTING IS NOT COUNTING, AND THE PAINT MUST NEVER BE GATED.** v3.26.0 gated
the accumulator correctly and left the *draw* call inside that gate, so students saw
`game.html`'s hardcoded `Daily 0:00` and an empty `#hud-week` until they typed. Every
number was right the whole time. A gate answers "did time pass?"; drawing answers
"what does the student see?", and the second is never "nothing" because the first is
no. Fixed in v3.26.1 / v2.10.1 and now asserted by Part E.

⚠️ **`hud.js` CARRIES A DISPLAY CACHE OF THE DAY AND WEEK TOTALS, AND NOTHING MAY
SEED `statsData` FROM IT.** Firestore is an async read, so between a page painting
and that read landing the only totals in memory are the initialised zeros — a student
with time banked opened a book and saw `Daily 0:00`. `hudCacheSave()` writes **only**
after the authoritative read; `hudCacheLoad()` returns null rather than stale numbers
if the cache is from another day. **It paints and nothing else.** Seed `statsData`
from it and §3.7's merge baseline gets computed against a number that never came from
the server, which is the doubled week counter rebuilt. Read the header above
`HUD_CACHE_KEY`.

⚠️ **ROUND 15: THE FALLBACK LIVES INSIDE `updateTimerUI()` / `renderTimeHUD()`
NOW, NOT AT ONE CALL SITE.** Round 14 painted the cache seed once in
`loadChapter()`, then called `updateTimerUI()` on the very next line — which
repainted from `statsData`, still zero, stomping the seed it had just drawn.
Separately, the init handler carried a comment claiming a repaint happened
after `loadGoals()` resolved; the call it described had been deleted at some
earlier point without the comment following it. Net effect: nothing painted
real numbers until `gameTick()` started on the first keystroke — Round 14's
fix genuinely did not fix it, and shipped with tests green because
`open-unit-test.mjs` Part E checks for a second *increment* site, not a missing
*repaint*. Fixed by folding the cache-fallback into `updateTimerUI()` itself —
`learn.js`'s `renderTimeHUD()` already worked this way and never had the bug —
so every caller gets it for free, and restoring the actual `updateTimerUI()`
call after `loadGoals()`. **If you ever add a new place that paints the HUD,
call `updateTimerUI()`/`renderTimeHUD()` — do not paint it by hand, and do not
trust a comment that says a repaint happens without finding the call.**

⚠️ **`open-unit-test.mjs` PART E COUNTS THE INCREMENT SITES IN THE SHIPPED SOURCES**
and fails if a second one appears on either page. That guard is the whole defence —
a second timer counting a slightly different number is invisible from inside either
file, because each stays internally consistent.

⚠️ **Nothing stored was rewritten.** Jake's ruling was explicit: the seconds already
banked were a gift and students keep them. This is a correction going forward only.
**Do not "correct" historical figures.**

### 3.6 ⚠️ The idle thresholds differ ON PURPOSE — 2s Library, 3s School

**Decided by Jake, 2026-08-18, closed.** Do not unify them. Do not "align" them. Library
is fluent readers typing prose they can already type, where a two-second gap is attention
drifting. School is beginners locating keys, where three seconds is often the work itself.
A single number either steals time from the students the lessons exist for or hands it to
the ones most able to idle. Round 12 flagged this as a symmetry violation and was wrong.

The symmetry actually required is that both sides pause on idle at all, record the same
*shape* of record, and be equally resistant to running out the clock. All three hold.

Open and minor: **tick resolutions** differ — Library accumulates in 100 ms slices, School
tests once per second — so School can mis-attribute up to about a second around a gap near
its threshold. Worth aligning eventually for precision. **Not a licence to touch the
threshold values.**

Admin-only, not urgent: `ggBypassIdle` ("No Idle" in the Game Genie) makes the School tick
accrue while idle, whereas in `game.js` the same flag only suppresses AFK auto-pause.
Gated on `ADMIN_EMAILS`.

### 3.7 The guest / expired-session merge, and its baseline

A 24-hour auth token lapsing mid-period read as a guest arriving for the first time.
`statsData` is module state and **a sign-out is not a page load**, so the tick kept
incrementing while every writer early-returned on a falsy user. The guest ladder armed,
the student signed back in, and `retroactiveSaveAnonSession()` did
`secondsWeek += server.secondsWeek`. Week doubled.

⚠️ **THE FIX IS NOT `max()`.** Sum is right for a true guest who typed earlier on another
machine; max is right for the expired session; **neither number contains the fact that
distinguishes them.** What was missing is how much of the live counter came from the
server, so that is now recorded:

```
statsBaseline               = statsData at the moment Firestore was read
this browser's contribution = statsData - baseline
merged                      = server + contribution
```

Correct in both cases — a true guest's baseline is zero and it collapses to the original
sum. ⚠️ **The baseline is captured in `loadUserStats()`, ABOVE `statsWalRecover()`.** A
recovered WAL tail is this browser's own unflushed work and belongs on the contribution
side; move the capture below the recovery and a re-auth silently discards whatever the WAL
just replayed.

`sessionExpired` is carried, not inferred — 29 sites in `game.js` alone test it.

### 3.8 The week starts on SATURDAY

`getWeekStart()` in both page controllers returns the Saturday beginning a Sat–Fri school
week, so Mon–Fri sits whole inside one bucket and a weekly goal cannot reset mid-week.
`week-anchor-test.mjs` lifts the function from **both** the app and `reports.html` and
asserts they agree — the v2.10.0 audit computed Mondays, every comparison missed, and the
panel printed "no problems found" across ninety students.

⚠️ **A period boundary right for accumulating is not automatically right for looking
back.** The admin review filter defaults to *Last 7 days*, not Sat–Fri, because a teacher
reviewing on a Saturday would otherwise see the week that just ended excluded entirely.

### 3.9 Stored positions, re-anchoring and the staleness ladder

A bookmark is `(chapter, charIndex)` and **both coordinates are measured against one
version of the text.** Re-upload the library and every stored offset silently becomes an
index into a text that no longer exists. Three rounds hardened the chapter id and nobody
looked at the other coordinate, one line away.

**Proof, then guard, then ladder — in that order, and the order is load-bearing.** Every
write stamps `contentVersion`, `chapterTitle`, `chapterLen` and `anchorText` (~48
characters *behind* the cursor — that is text the student has demonstrably read; an anchor
from ahead would re-anchor them onto content they have never seen). A matching
`contentVersion` is the fast path at zero cost. A mismatch searches for the anchor.
`findAnchorEnd()` returns the occurrence **nearest** the old offset, not the first — a
48-character anchor can legitimately repeat, and taking the first match drags a student
backwards, which looks exactly like the bug.

⚠️ **A chapter that SHRANK below a stored offset is both out of range and perfectly
rescuable**, because the anchor still names the words they reached. That is why proof runs
before the dead-state guard. Putting the guard first throws away the only hard evidence in
the system — and a harness caught exactly that on one run.

**Jake's time-based ladder is load-bearing pedagogy, not a tuning constant:** under a week
→ exact spot; a week to a month → sentence start; a month or more → chapter start. The
reasoning is about what a child remembers. **Do not "simplify" it.** It needed no
migration, because `lastUpdated` was already on every progress document.

⚠️ **An offset at or past the end is a dead state, not a position**, and
`reconcilePosition()` can never return one. "One sentence left to type" is what a stale
offset *looks like*, and Aesop's Fables (284 chapters of ~500 characters) is the library's
best stress case — almost any overshoot lands past the end there. **Never accept "the
chapter completed" as a pass:** check the completion modal, because `0 WPM` and `0m 1s`
means nobody typed anything.

Flip Back is bounded by `furthest`, **not** by the current position — a bound computed from
state the feature itself mutates is not a bound. Cross-chapter is deliberately two-step
because `getSentenceMap()` reads `fullText`, which exists only for the loaded chapter.
⚠️ Sentence-level backjump makes WPM farming easier; **if the leaderboard ever looks wrong,
start here.**

⚠️ **No admin repair tool is buildable as the rules stand.** `firestore.rules` lets staff
read any student's progress but restricts write to `request.auth.uid == uid`. Repairing
from `admin.html` needs a Cloud Function or a looser rule; healing in the client on next
open is better than both, costs nothing for books nobody reopens, and needs no coordination.

### 3.10 Two copies on purpose, and the roster's real shape

`applyPendingClassAssignment()` exists in **both** `game.js` and `learn.js` and neither page
controller can import the other. **Change one, change both** — a student can reach either
page first and the whole point is that it does not matter which. `renderIdStamp()` is
duplicated for the same reason; fifteen lines, and this note is the tripwire for extracting
it if it grows.

The Students roster is built from `typing_logs` over `ROSTER_DAYS` = **45**, so it is
**activity, not enrollment** — an imported student who has never typed cannot appear under
any filter and widening the range will never summon them. That is why the importer could not
see returning students in August, and why intent travels on the pending record (`overwrite`)
instead of being guessed. Every exit path from `applyPendingClassAssignment()` deletes the
record.

⚠️ **Do not "fix" the roster by putting emails in user documents.** The absence of an
email→uid index outside `typing_logs` is the privacy constraint working.

⚠️ **There is no `classAssignedAt` field and there must not be one.** The staff grant on
`users/{uid}` is `.affectedKeys().hasOnly(['classId','schoolId'])`, so a third field is
denied — it would need a console rules paste *and* widen what a teacher may write into a
student's document to store a fact the teacher already knows.

### 3.11 What needs a console paste, and what does not

- **`firestore.rules`** — the `typing_sessions` create rule requires `uid`, `seconds` in
  `[0, 86400]`, `sprints` a list of ≤ 200, and `expiresAt`. It has **no `keys().hasOnly()`**,
  deliberately, so added fields are not denied. Both `source` and `serverAt` rode in on that
  property. Read the comment above `validDailyLog` before "tidying" it.
- **`firestore.indexes.json`** — the drill-down query is equality-only and needs no composite
  index. ⚠️ **Adding an `orderBy` or a range filter does**, and that is a console change.
  `serverAt` is deliberately *not* exempted from auto-indexing, because the first thing anyone
  will want from it is a range query, and removing an exemption rebuilds the index across the
  collection. Re-decide at district scale.
- **App Check is initialized but not enforced.** A `401` on `recaptcha/api2/pat` is visible at
  Ellis; harmless now, an **outage** the day it is enforced if a district filter blocks
  recaptcha paths. Run `ttbAppCheckStatus()` on a real school MacBook on the school network
  first. This rose in priority when book content became world-readable — it is now the only
  thing between Jake's card and a scraper.
- **Content is world-readable on purpose.** `books`, `chapters` and `lessons` are
  `allow read: if true`; `settings` is split by document id so `settings/goals` is public and
  `settings/languageFilter` is not, because publishing a curated list of slurs has no upside.
  ⚠️ **Anonymous Auth was the wrong answer and the rules file used to recommend it.**
  `signInAnonymously` appears nowhere in this repo; enabling it would make `signedIn()` true
  for the entire internet across six unrelated grants.

---

## §4. ⚠️ THE FORWARD PLAN — telemetry step 2

> ⚠️ **SUPERSEDED IN PRIORITY BY §0.9 (2026-08-19).** Everything in this section
> remains valid engineering, and **none of it comes before moving the grade off
> `typing_logs`.** Jake ruled on that directly. Read §0.9 first.


`DESIGN-TELEMETRY.md` is the design and it is live; read its §2 (verification-only, every
claim read out of shipped source) and §8 (things that must not happen) before writing code.
Steps 1 and 1.5 shipped in Round 13. **Step 2 is next: make `typing_logs` derived rather than
written from a live in-memory counter.** It closes §3.1's data-loss path and is worth more
than Rounds 12 and 13 combined.

⚠️ **Step 2 has a prerequisite of the same shape step 1.5 had. Found by Round 14 reading the
writers; not yet fixed.**

Step 1.5 fixed session *coverage* — abandoned units now produce records. It did not fix
*timeliness*. Session records are created only at unit boundaries and on hide/pagehide;
nothing periodic. Meanwhile `typing_logs` is rewritten from the live counter every five
minutes, deliberately, so a teacher looking mid-period sees today. **A student twenty minutes
into an uninterrupted chapter has twenty minutes in the counter and zero session records.**
Derive `typing_logs` from sessions as specified and that student's daily figure sits flat at
their last completed unit for the whole twenty minutes — a day-one visible regression, and the
mirror image of the undercount step 1.5 fixed.

**One decision is required before step 2 can be written. It is not Claude's.**

⚠️ **THE GRADED CLOCK IS DECIDED. Jake, 2026-08-18: the clock starts on the first
keystroke of a run and not before.** That is `stepSeconds` semantics — School's
existing graded gate — and it is now the definition of "time typed" on BOTH sides.
Recorded here and in `DESIGN-TELEMETRY.md` §2.7 because the previous round scoped
this work in conversation and never wrote it down, which cost it entirely.

✅ **SHIPPED in Round 14** — `game.js` v3.26.0 / `learn.js` v2.10.0. See §3.5.

**Still open — where the sum comes from:**
   - **(a) Query the day's sessions at flush time.** Literally what the design says.
     Closes §3.1 completely. Costs ~15–30 reads per flush per student — the one figure in
     `SCALE-PLAN.md` that was never checked.
   - **(b) Per-source fields in `typing_logs`** (`secondsLibrary` / `secondsSchool`), each
     written by exactly one page, summed on read. Makes the cross-mode clobber *structurally
     impossible* with no extra reads. Costs changes in `reports.html` and `lessons-admin.js`.
   - **(c) A local accumulator of committed sessions.** Cheapest, and **does not close §3.1**
     — two modes, two accumulators, same clobber. Ruled out here on the record rather than by
     omission.

**After step 2:** make `stats/time_tracking` a rebuildable cache with a "rebuild from sessions"
action in `reports.html`; weekly archive plus retention (⚠️ `typing_sessions` has a **120-day
TTL**, so once totals derive from sessions, day 121 makes last spring's numbers start
shrinking — a correctness bug waiting on a calendar); retire the week audit once the rest runs
clean for two weeks.

⚠️ **Do not answer the next divergence with a better audit.** An audit is a confession that the
data model permits states you have to go looking for.

⚠️ **Do not backfill synthetic session records.** School has no session history before
2026-08-18 and never will; manufacturing per-run detail that never existed is worse than an
honest gap.

### 4.1 ✅ THE CLOCK UNIFICATION — SHIPPED, Round 14

Done. `game.js` v3.26.0, `learn.js` v2.10.0, guarded by `open-unit-test.mjs` Part E.
Full detail in §3.5. **What remains of step 2 is below; this is no longer a blocker.**

⚠️ **What Jake should expect to see, and it is the only visible consequence:**
recorded minutes drop slightly from the deploy forward — the two free seconds at the
head of every Library sprint, and the seconds between a School student's first
keypress and their first correct one. Small per run; a struggling typist on a ten-run
lesson loses more than a fluent one. **It is a correction, not a regression**, but a
week-over-week comparison across 2026-08-18 will show a step change with no other
explanation. That date is the boundary; it is recorded here and in
`README-SESSION-LOGGING.md` so nobody debugs it later as a defect.

### 4.2 ⚠️ Open rulings that have been waiting since Round 8

Both were answered *by default* rather than by decision, and both have been carried unanswered
through five rounds. They are small.

- **Does re-reading a chapter un-tick its ✓?** Ships as "no", the non-destructive default.
  `completedChapters` feeds `chaptersCompleted` in the stats rollup and the ✓ in Game Genie's
  picker. Clearing it edits a record of something the student did; keeping it shows chapters as
  done that they are actively redoing. If you want it cleared, the place is `flipBackTo()`.
- **Should a hard time cap override a confirmed anchor match?** Ships as "no" — a found anchor
  wins regardless of age, because it is proof rather than a guess, and time governs only the
  fallback. If you want caps that override even a confirmed match, that is
  `reconcilePosition()`'s first branch and nothing else.

---

## §5. Invariants

⚠️ **THESE NUMBERS ARE APPEND-ONLY. DO NOT RENUMBER THEM. EVER.**

Round 14 renumbered once, as a repair, and it cost seven file uploads. The old sequence was
genuinely unusable: Round 9 assigned 56–81, and Round 11 — told to continue from Round 8, which
ended at 55 — **also started at 56**. Every number in that range meant two different things and
the code cited both meanings. A new invariant now takes the next free number and goes at the
bottom of its group. Citations in code carry the invariant's **name** as well as its number, so
a number that somehow drifts can still be resolved.

### Data, counters and records (1–16)

1. **ONE QUANTITY, ONE RECORD.** Two documents — or two fields — holding the same number will
   disagree. If you need a second view, make it an explicitly rebuildable cache and say so in
   the file header. **A cache you can always rebuild from truth is not a second source of
   truth.**
2. **TWO RECORDS OF ONE QUANTITY MUST SHARE A WRITE TRIGGER.** Not "be flushed often enough."
   Any staleness budget granted to one and not the other is a divergence you agreed to,
   debugged later by someone who does not know you agreed.
3. **A MERGE NEEDS A BASELINE, NOT A BIGGER HAMMER.** `sum()` and `max()` are both guesses at
   the same missing fact and each is silently wrong where the other works.
4. **A RECORD IS DATED WHEN IT HAPPENS, NOT WHEN IT IS WRITTEN.** Anything queued for later
   delivery carries its own timestamp, or a delayed flush relabels history.
5. **A RECORD IS ONLY COMPLETE WHEN ITS UNIT CAN END WITHOUT WARNING.** "It will finish" is an
   assumption about a twelve-year-old with a lid and a bell.
6. **RESET A WATERMARK WHEREVER YOU RESET WHAT IT MEASURES**, in the same place.
7. **ABSENT BEATS APPROXIMATED.** A field named for a trusted source, filled in by an untrusted
   one, type-checks and lies. Omit it and let the reader see it missing.
8. **A SIGNAL MUST BE PLANTED BEFORE IT IS NEEDED.** A comparison against history is worthless
   the day it ships and valuable a term later. Shipping the write side alone is a complete
   deliverable.
9. **"UNKNOWN" IS NOT "EXPIRED."** An absent or unparseable timestamp falls back to the
   permissive reading, or legacy data becomes silently unusable.
10. **A PENDING DOCUMENT IS A MESSAGE; READING IT CONSUMES IT.** Every exit path deletes. A
    record that cannot act must not survive to be re-read.
11. **A SIGN-OUT IS NOT A PAGE LOAD.** Module state survives it.
12. **`null` USER MEANS TWO DIFFERENT THINGS.** "Never signed in" and "token expired" need
    opposite handling everywhere they are tested. Carry the distinction; do not infer it.
13. **AN ID IS A LABEL.** Never `parseInt` one.
14. **BUMP THE CACHE KEY WHEN THE CACHED SHAPE CHANGES**, or the change silently does nothing
    for six hours.
15. **A CACHE GUARD CANNOT CATCH A WELL-FORMED STALE ENTRY.** Drop the goals cache
    unconditionally on any class change, not only when it looks empty.
16. **A PER-DEVICE ID IS NOT A PER-PERSON ID.** Two guests share a browser profile; what
    separates them is the tab, so scope to `sessionStorage`.

### Stored positions and restored state (17–28)

17. **ANY STORED OFFSET INTO CONTENT IS A FOREIGN KEY INTO A VERSION YOU DID NOT RECORD.**
    Character indices, line numbers, scroll positions, timestamps into media. Store what it was
    measured against, or a fingerprint of the content, or accept that it rots silently.
18. **WHEN YOU HARDEN ONE HALF OF A COMPOSITE KEY, STATE WHY THE OTHER HALF IS SAFE.** Three
    rounds hardened the chapter id, each writing a comment about renumbering. The character
    offset sat one line away, untouched, the whole time.
19. **THE DANGEROUS BUG IS NOT THE ONE THAT ERRORS — IT IS THE ONE THAT COMPLETES.** Ask of any
    restored state: *if this value were wrong, would the app fail, or would it succeed at
    something else?* A student does not report a smooth failure; they report finishing.
20. **AN OFFSET AT OR PAST THE END OF ITS CONTENT IS A DEAD STATE, NOT A POSITION.** Guard the
    *shape* of the answer — "does this leave anything to do?" — not just its range.
21. **RECENCY IS NOT VALIDITY.** A bookmark written an hour ago is garbage if the content
    changed after it was written. Never let an age threshold decide whether a provably invalid
    value is acceptable.
22. **PREFER PROOF TO POLICY WHERE PROOF IS CHEAP.** 48 characters per write turns "we think
    they were about here" into "they were exactly here."
23. **CONSULT PROOF BEFORE APPLYING A GUARD.** A value can be both out of range and exactly
    recoverable. Guards that run first discard evidence.
24. **A SELF-HEALING SYSTEM MUST NEVER WRITE ITS OWN BAD STATE BACK AS VERIFIED.** It converts a
    recoverable fault into a permanent one and deletes the evidence. Before writing a "this is
    now correct" marker, check that it *is*.
25. **A SYSTEM THAT CAN ONLY ADVANCE CANNOT RECOVER.** When auditing a flow, list the moves
    available and check whether any go backwards.
26. **SHIPPING THE GUARD IS HALF THE JOB WHEN A BUG HAS BEEN WRITING BAD STATE.** Ask "what did
    this corrupt that my fix cannot reach?"
27. **A BOUND COMPUTED FROM STATE THE FEATURE ITSELF MUTATES IS NOT A BOUND.** Flip Back bounded
    by the current position collapses the instant it is used.
28. **AN ESCAPE HATCH BELONGS WHERE PEOPLE ARE WHEN THEY NEED IT.** Ask of any recovery
    affordance: *what screen is someone looking at at the moment they realise they need this?*
    And do not gate it on the rare fault — an affordance that appears only after one is an
    affordance nobody has learned to look for.

### Deleting, refactoring and dead code (29–38)

29. **DELETING A SUBSYSTEM MEANS DELETING ITS READERS.** A deleted declaration leaves its
    references grep-invisible. Run `undefined-calls-test.mjs` first.
30. **AN UNDECLARED IDENTIFIER THROWS IN EVERY EXPRESSION POSITION**, not only when called, and
    takes down every statement after it in the same function.
31. **"DECLARED SOMEWHERE IN THE FILE" IS NOT "IN SCOPE HERE."** Three bugs of this one class
    have shipped in this codebase.
32. **THE GRAVITY OF DEAD STATE IS PROPORTIONAL TO HOW CAREFULLY IT IS MAINTAINED.**
    `lastSavedIndex` had eighteen assignments and no consumer, and its tidiness is what
    recruited a later round into adding a nineteenth.
33. **`_inited = true` SET BEFORE THE RISKY WORK IS A TRAP.** It turns a one-time failure into a
    permanent one. Set it last, or in a `finally`.
34. **A SHORT-CIRCUIT ADDED FOR ONE CASE WILL BLOCK A LATER RULE FOR ANOTHER.** When you add a
    rule downstream of an early return, test the early-return path against it.
35. **NEVER COMPUTE A DELETION SLICE FROM A LOOSE TEXTUAL MATCH.** A `startswith` once matched a
    comment in the file body and took 370 lines with it. Anchor deletions to an asserted line
    index, and assert the count before splicing.
36. **A PARSE CHECK PROVES SYNTAX, NOT SURVIVAL.** Before shipping a file edited by script, diff
    its declaration list against the previous copy.
37. **AN OLDER COPY OF A FILE IS A LIVE HAZARD, NOT A BACKUP.** Diff every file in a handed-over
    archive before touching any of it.
38. **A FEATURE THAT WALKS EVERY RECORD AND RE-SAVES IT TRIGGERS EVERY LATENT
    READ-MODIFY-WRITE BUG AT ONCE.** Ask what the save path does to values the form cannot
    represent.

### Tests and harnesses (39–58)

39. **A TEST THAT REIMPLEMENTS THE CODE IT TESTS PASSES AFTER THAT CODE IS DELETED.** A harness
    must lift, import or parse the *shipped file*, or it is testing a fossil.
40. **A GREEN SUITE IS EVIDENCE ABOUT THE MACHINE IT RAN ON.** Before claiming a dependency is
    declared, open the file.
41. **TEST THE FRESH-CLONE PATH.** The environment that built the thing is the one guaranteed
    not to reproduce a new contributor's experience.
42. **A LIFTED FUNCTION MUST BE SELF-CONTAINED.** Every module-scope reference becomes a
    ReferenceError inside the sandbox, swallowed by the function's own catch. Adding a
    dependency to a lifted function means updating its harness in the same commit.
43. **A HARNESS THAT LIFTS A BODY CONTAINING A TEMPLATE LITERAL MUST BUILD ITS SANDBOX BY
    CONCATENATION.** `${...}` is interpolated by the outer template before Node parses anything,
    and the SyntaxError points at the harness rather than the cause.
44. **A HARNESS THAT LOCATES CODE BY A COMMON SUBSTRING WILL ONE DAY TEST A DIFFERENT FUNCTION
    AND BLAME THE WRONG AUTHOR.** Anchor on something unique; throw a named error when it is not
    found.
45. **A TEST THAT ONLY PRINTS IS NOT A TEST.** Ask what a harness would have to see before it
    fails.
46. **A HARNESS THAT CRASHES TELLS YOU LESS THAN ONE THAT SURVIVES.** Running it against old code
    is the whole point, and a stack trace hides the other assertions.
47. **GRADE YOUR OWN ASSERTIONS.** Tag them `[BEHAVIOURAL]` or `[STRUCTURAL]`. Structural ones
    catch invisible, expensive defects and also break on innocent refactors; a harness that does
    not grade itself invites both to be trusted equally.
48. **THE NUMBER AN ASSERTION EXPECTS IS WHERE THE AUTHOR'S MISCONCEPTION LIVES.** A green
    harness proves the code agrees with the author, not with reality. When a test passes first
    try, re-derive the expected values from the requirement.
49. **DO NOT HAND-WRITE AN EXPECTED ORDERING.** Compute it from data already verified.
50. **TEST A COPIED CONSTANT AGAINST ITS SOURCE FILE**, not against your reading of it. The
    Monday week anchor was a confident assumption never checked against the source twelve feet
    away.
51. **A SHARED MODULE'S DEPENDENCY LIST IS A CONTRACT BETWEEN FILES THAT CANNOT SEE EACH OTHER.**
    Assert both call sites' dep sets are equal.
52. **ASSERT AN EXACT KEY SET, NOT THE ABSENCE OF ONE KEY.** `sig.classroom === undefined` passes
    just as happily when the whole function has been renamed out from under you.
53. **WHEN A FEATURE IS REMOVED, ITS TESTS ARE INVERTED, NOT DELETED.** The removal is itself a
    contract, and contracts want tests.
54. **A PERMANENTLY RED TEST IS WORSE THAN A DELETED ONE.** It trains everyone to read "1
    failing" as the expected number and the next real failure hides behind it. If a harness goes
    red and cannot be fixed the same day, delete it or skip it loudly.
55. **A VERSION PIN IS A DEPLOY DIAGNOSTIC, AND PINS COME IN SETS.** Grep for every assertion on
    a module's version before bumping it; two harnesses pin `session-log.js` and moving one is
    how you find out about the other.
56. **`node --check foo.js` DOES NOT CHECK AN ES MODULE.** Use `node --input-type=module --check`.
57. **A VERSION AUDIT CANNOT CATCH A VERSION LIE.** It compares a file's claims against the same
    file's other claims. Only a behavioural test knows what the code does.
58. **A HARNESS WITH AN ABSOLUTE PATH IS A COMMENT**, and a hardcoded denominator in a diagnostic
    is worse than no diagnostic.

### UI, rendering and reporting (59–71)

59. **AN AUDIT MAY NEVER HAVE A SILENT SKIP.** Every subject lands in exactly one named bucket,
    every bucket is counted on screen, and the totals are printed so they can be checked by eye.
    **"Could not be examined" and "passed" are opposite findings and must never render
    identically.**
60. **TWO WRITES TO THE SAME OUTPUT ELEMENT IN ONE SYNCHRONOUS BLOCK: THE FIRST ONE NEVER
    HAPPENED.** No linter, parser or identifier check can see it.
61. **WHEN A RENDER FUNCTION AND ITS CALLER BOTH REPORT STATE, THE RENDER WINS.** It is the one
    holding the filters.
62. **A COUNT THAT CONTRADICTS THE LIST BELOW IT IS WORSE THAN NO COUNT.**
63. **SAY WHAT A LIST IS MADE OF WHEN IT IS NOT MADE OF THE OBVIOUS THING.** A roster built from
    activity logs cannot show an enrolled student who has not acted.
64. **`innerHTML +=` DESTROYS LISTENERS IN THE WHOLE CONTAINER.** It is a read, a concatenate and
    a full re-parse of the subtree. Bind after the last write, never before.
65. **A BADGE THAT APPLIES TO EVERY ITEM IS NOT A BADGE.** Ask what fraction of rows a flag will
    appear on before adding it.
66. **A FEATURE THAT IS WRONG EVERY TIME GETS RECLASSIFIED AS DECORATION**, and then nobody
    reports it. Ask what a user has stopped trusting.
67. **A MISSING OPTION IN A `<select>` IS A DATA-LOSS BUG.** `selectedIndex = -1` reads back as
    `''` and gets saved. A `select` + Custom… pair cannot be cleared with `.value = ''`.
68. **AN `<a>` MAY NOT CONTAIN AN `<a>` OR A `<button>`.** Browsers recover by closing the anchor
    early and reparenting the rest. Not a CSS problem.
69. **`justify-content: center` + `overflow: auto` CLIPS AT THE START**, and the clipped part
    cannot be scrolled to.
70. **`escapeHtml`-BY-DOM DOES NOT ESCAPE QUOTES.** Fine in element content, fatal inside an
    `href`.
71. **A PERIOD BOUNDARY RIGHT FOR ACCUMULATING IS NOT RIGHT FOR LOOKING BACK.** Ask what day the
    person is standing on when they open the screen.

### Matching, creating and coalescing (72–83)

72. **BEFORE GIVING A "NOT FOUND" BRANCH THE POWER TO CREATE, FIX WHAT COUNTS AS FOUND.** A
    tolerant matcher and a creating branch are one feature; shipping the create half against a
    strict matcher manufactures duplicates, and duplicates of a container silently split
    everything filed into them.
73. **A NORMALISER THAT CAN RETURN EMPTY HAS AN IMPLICIT WILDCARD IN IT.** Any two inputs
    normalising to nothing match each other.
74. **A NORMALISER AND A DIFFER MUST COMPARE ON THE SAME SIDE OF THE NORMALISATION**, or the
    differ reverts the normaliser.
75. **REFUSE RATHER THAN APPROXIMATE** wherever the value is a claim rather than a preference — a
    licence, a version, an age range, a chapter identity. `''` plus a human is cheaper than a
    false assertion in the database, and the refusal belongs at the level of the whole operation,
    not one field.
76. **REQUEST COALESCING IS ONLY VALID BETWEEN INTERCHANGEABLE CALLERS.** An unauthenticated
    caller and an authenticated one are not. Share successes; never share a failure with someone
    who would have succeeded.
77. **AN EMPTY RESULT AND A DENIED ONE ARE INDISTINGUISHABLE DOWNSTREAM.** If both render the
    same blank screen, treat the ambiguous case as the one a retry can fix.
78. **WHEN TWO SUBSYSTEMS IMPLEMENT THE SAME PROMPT, THE DUPLICATION IS THE VISIBLE DEFECT AND
    THE DIVERGENCE IN WHAT THEY DO IS THE EXPENSIVE ONE.** Ask what each does when the user says
    yes, *before* merging the copy.
79. **A CHOICE MUST GOVERN EVERY PATH IT APPEARS TO GOVERN.** If a teacher's answer applies to one
    write path and not the other, behaviour depends on which branch a student fell into, and that
    is not a choice the teacher made.
80. **A FEATURE GATED ON A MODE NOBODY USES HAS NOT SHIPPED.** Grep for the gate before concluding
    a behaviour is absent — and before building it again.
81. **SAY WHICH ONE FAILED.** "3 of 5 failed" forces a retry of all five.
82. **NAME THE METRIC BEFORE BUILDING THE FEATURE.** "Popularity" is books opened or sentences
    typed, and the two need different data.
83. **SORT ON A DERIVED KEY AND YOU LOSE LOCALE COLLATION.** Fold diacritics when you derive, or
    Brontë files after Zola.

### Judgement and process (84–99)

84. **AN ABSENCE IS A DIVERGENCE WITH NOTHING TO GREP FOR.** Two copies that disagree can be
    diffed; one copy and a missing one cannot, and the missing side stays invisible until somebody
    asks for the feature it never had.
85. **ASK FOR ONE MEASURED NUMBER BEFORE CHOOSING WHICH BUG YOU ARE FIXING.** "One sentence to
    type" had two causes with no overlap in their fixes. One readout cost one exchange and
    eliminated an entire investigation.
86. **A SCREENSHOT CARRIES MORE THAN THE NUMBER YOU ASKED FOR.** Read the whole image, not the
    field you requested.
87. **DIAGNOSING A BUG DOES NOT INOCULATE YOU AGAINST WRITING IT.** One round fixed a coalescing
    bug in `learn.js` and reached for the identical broken shape in `index.html` within the hour.
88. **THE FIX THAT MAKES A SYMPTOM DISAPPEAR IS NOT ALWAYS THE FIX FOR THE BUG.** Ask: if the thing
    I just changed changed back, would this break again?
89. **VERIFY YOUR OWN COMPLAINTS BEFORE WRITING THEM DOWN.** A claim about a file you did not open
    goes into the README and the handoff and outlives you.
90. **CORRECTING A PREDECESSOR DESERVES THE SAME VERIFICATION AS ACCUSING ONE.** A retraction feels
    like humility and lands in the record with the same authority as the original claim. Round 8
    overturned a true complaint *in the same section* that added invariant 89.
91. **THE SAME CONCEPTUAL CONFUSION GETS COMMITTED TWICE IN ONE SESSION.** After fixing one, grep
    for every other place those two fields are read.
92. **A COMMENT ASSERTING A PERMISSION IS A CLAIM ABOUT A DIFFERENT FILE, AND NOTHING CHECKS IT.**
    Name the rule *and its version* so one line can falsify it. Three files carried "anon auth lets
    students read books" for years; it was never true.
93. **A COMMENT ASSERTING A TEST EXISTS IS WORSE THAN NO COMMENT.** It stops the next person
    looking.
94. **READ THE CORPUS BEFORE READING THE CODE.** One command over 24 files turned a vague report
    into an exact per-book explanation and made every theory unnecessary.
95. **BEFORE ASSUMING YOU BROKE IT, DIFF THE BLOCK AGAINST THE LAST KNOWN-GOOD COPY.**
96. **A BUG ON A PATH NOBODY TAKES IS INVISIBLE INDEFINITELY.** Ask which branch has had nobody on
    it lately.
97. **DOCUMENTS DRIFT EXACTLY LIKE CODE, AND NOTHING CHECKS THEM.**
98. **A DOCUMENT A SESSION PRODUCES SHIPS IN THE SAME COMMIT AS THE CODE**, or it does not exist.
99. **COMMITTING A SUPERSEDED DESIGN DOCUMENT UNMARKED IS WORSE THAN LOSING IT.** Recovering a
    document and *endorsing* it are separate decisions.

### Books, EPUBs and the library (100–105)

100. **`bookMetadata.chapters` IS THE SPINE, NOT THE BOOK.** Use `bodyChapterList()`.
101. **`matter` SAYS TYPEABLE; `about` SAYS CREDITS.** Orthogonal. Collapsing them is the mistake.
102. **FRONT MATTER MUST SURVIVE IMPORT.** The notice is a licence condition, and `game.js` filters
     the picker so it can.
103. **OPEN BOOK MUST RESTORE `matter` AND `about`**, or a re-upload silently resets every non-body
     page to `body`.
104. **UPLOAD ALL PRUNES ORPHANED CHAPTER DOCUMENTS.** It must, because Fix C renumbers books.
105. **YOU CANNOT LICENSE A PUBLIC-DOMAIN TEXT; YOU CAN ONLY LICENSE YOUR OWN EDITS.**

### Later additions (106– )

New invariants go here, at the next free number, and are folded into a group above
at the next consolidation **without changing the number**.

107. **POSITION IS NOT IDENTITY.** Any handle that survives a re-render must be a
     stable key — a `uid`, a document id — and must be resolved to an index at the
     moment it is used, never at the moment it is captured. `reportData` is sorted
     **in place**; an array index captured before a `renderTable()` names a
     different student afterwards. Round 18 wrote this bug and caught it by
     reading, not by testing: the arithmetic is identical either way, so a suite
     that checks totals stays green while corrections land on the wrong children.
108. **BUILD THE INSTRUMENT BEFORE THE REPAIR.** If you cannot see whether a
     number is wrong, you cannot tell whether your fix helped, and you will ship
     the fix anyway because it looked right in the code. Round 16 changed how
     three counters were written before anything existed to check them and
     shipped three defects in two days. An observation tool that writes nothing
     is deployable on a school night; a write-path change is not.
109. **"NOT MEASURED" MUST NOT RENDER AS "MEASURED, CLEAN".** A zero, a blank
     cell, an empty column in an exported spreadsheet, a truncated result, a
     cancelled run showing partial rows — every one of these gets read as an
     all-clear by a tired person at 4pm. Initialise to `null` and render `—`;
     refuse rather than truncate; discard partial results rather than display
     them; and when a repair invalidates a measurement, clear the measurement
     instead of leaving it on screen.

---

## §6. Known problems left standing

1. **`chunktest.mjs` tested deleted code and is DELETED (Round 14).** It reimplemented the v3.9.2
   rollup loop inline instead of importing `session-log.js`, so it passed green on a fossil.
   `session-merge-test.mjs` Part B is its replacement. If it ever reappears, it came from an old
   copy — invariant 37.
2. ⚠️ **Historical day counters may be doubled and no audit can detect it.** If a student hit the
   additive merge on a day their stats doc had already been written, the day counter doubled too
   and that value reached `typing_logs` — the audit's yardstick — so those days look
   self-consistent. Session rollups are the independent check where they exist: all Library days,
   School only from 2026-08-18. **For School days before that there is no second record and never
   will be.** Cannot recur from `game.js` v3.23.0 / `learn.js` v2.7.0 forward.
3. ✅ **RESOLVED, Round 19 — and it was never a metadata question.** This entry
   read "a bookclean/import metadata question, not an app defect" for several
   rounds. The harness was reporting **two real defects in `admin.js`**, both
   fixed in v3.31.1: (a) `dc:rights` read only its FIRST element, and Standard
   Ebooks emits two — so the CC0 half of the licence was silently dropped at
   import, on a licence family whose one legal obligation is attribution;
   identical in shape to the `dc:source` bug fixed in v3.26.0 two lines away.
   (b) `readInBookSignals()` scoped its Credits lookup to `#pg-machine-header`,
   which the bookclean pass strips — so all thirteen cleaned Gutenberg books
   imported with **no transcriber attribution at all**. The harness went to
   v1.4.0: it classifies Gutenberg books by the `_g` filename convention instead
   of a hand-kept id list that goes stale on every batch, normalises the
   `-claudeCleaned` rename, asserts the origin URL by SHAPE, and makes the
   credits assertion conditional on the book actually having a Credits row
   (wizard-of-oz has none — verified by scanning every xhtml entry).
   ⚠️ **THE LESSON, WHICH IS INVARIANT 54 WITH A BODY: an accepted red was
   hiding two real bugs for four rounds, exactly as predicted.**
4. **`audit-versions.mjs` reports 7 header-budget problems** (`game.js` 135 lines / 13 entries,
   `learn.js` 152/16, `admin.js` 69/7, `lessons-admin.js` 76, against budgets of 60 and 6). Three
   rounds called migrating entries into `CHANGELOG.md` "the cheapest real task available" and none
   did it. `CHANGELOG.md` is kept (Jake's call, Round 14) but its index is stale — `game.js`
   entries stop at v3.19.1, `learn.js` at v2.2.4, and there is no section at all for
   `session-log.js`, `stats-wal.js` or `hud.js`. **Either backfill it or raise the budget; do not
   call it cheap again without doing it.**
5. **`resume-path-test.mjs` does not exist** and `learn.js` ~line 1554 asserts in a comment that it
   does. Flagged by four rounds. Invariant 93. Write it or delete the claim.
6. **`renderIdStamp()` is duplicated in `game.js` and `learn.js`.** Fifteen lines, unchanged
   tripwire.
7. ⚠️ **71 CHARACTERS MISSING FROM 8/19's RECALC versus the displayed sprint totals. CAUSE
   UNKNOWN — DO NOT GUESS.** Round 16 formed a session-writing theory and **Jake's console output
   disproved it**. That is the whole state of knowledge: one theory, tested, dead. Round 18 did
   not attempt this and deliberately added no speculation to it; what it *did* add is the
   instrument — the `Δ` column carries a **characters delta alongside the time delta**, and the
   CSV export carries `Delta Characters`, so the next attempt starts from a population of cases
   rather than from one screenshot. Get a sample across many students before theorising again.
8. ⚠️ **A THIRD DUPLICATE APPEARED AFTER `session-log.js` v1.3.0 SHIPPED.** The serialization in
   v1.3.0 stops two *concurrent* flushes writing the same queue twice; it does **not** stop a
   queue entry being re-sent by a **later page load** if the clearing `localStorage` write never
   persisted during teardown. **That is a hypothesis and is labelled as one.** The likely durable
   fix is deterministic document ids with `setDoc` instead of `addDoc` — which needs a
   `firestore.rules` change to allow owner `update` on `typing_sessions`, and **getting that wrong
   stops session recording silently**, which is the worst failure shape in this codebase. It is
   not a school-week change. Round 18 did not touch it. Note the interaction: duplicates inflate
   the drill-down but are already excluded from `recalcDailyLog()`, from the `Sessions` column and
   from every rebuild, so this defect currently costs *visibility*, not *grades*.
9. **The reconciliation view cannot see a student who has no `typing_logs` document at all.**
   `reports.html` v2.15.0 sweeps every student **in the report** across every date in the range,
   so a missing *day* is caught. A missing *student* is not — they never appear in the report to
   be swept. Closing it means iterating the class roster rather than the report as the source of
   truth, which is a real change to how that page is built, not an addition to it. Stated in the
   panel's own notes so nobody reads a clean sweep as a complete one.
7. **App Check initialized, not enforced.** §3.11.
8. **`firestore-rules.test.mjs` has never been executed** and is known wrong — it seeds roles as
   auth-token claims while rules v2.x reads `staff/{uid}` documents. Needs a CLI and an emulator,
   which Jake does not have. Its guest-boundary assertions are the only automated statement of
   where that boundary is.
9. **`_bulkAssign()` writes `classId` but not `schoolId`.** Fine within one building; do not use it
   for a cross-building move.
10. **`_onClassesChanged()` is probably vestigial** — it exists to refresh a custom-claims token,
    and claims were removed. **Not investigated. Check `admin.js`'s hook before deleting.**
11. **No word or character count exists anywhere in the book schema**, so library "Length" sorts by
    chapters, and Aesop's 284 fables sort as the longest book while being among the shortest to
    type. **"Popularity" is unbuilt** and needs a scheduled Cloud Function to be affordable — which
    needs a functions deploy, which is Jake's call.
12. **`lastSavedIndex` is dead state** — eighteen assignments, two reads, both of which only save
    and restore it around practice mode. Nothing consumes it; `walDirty` drives flushing. Clean,
    self-contained deletion for whoever wants one. Invariant 32.

---

## §7. Jake — working with him

- **He tests immediately and reports the number, not the impression.** "Got a reminder at 2 minutes"
  identified which of four ladders had fired, on which page, from which file, in one clause. **Take
  his descriptions literally; they are usually the diagnosis.**
- **He will ask "are you sure?" and he is usually right to.** "But we delete the front matter, don't
  we?" and "shouldn't it be 2.2.1?" both caught real errors. Check properly before answering, every
  time.
- **He hedges when he is right.** Verify the hedged claim and say plainly which way it came out.
- **He answers a policy question with a better policy.** Given three flat options for the legacy
  cohort he returned a graded, time-keyed ladder — plus a throwaway line that was itself the design
  constraint. **Ask, and take the answer seriously rather than as a tiebreak between your own two
  ideas.**
- **He reasons from what a child will experience, not from what is easy to build.**
- **He sends screenshots that answer more than the question asked.** Invariant 86.
- **He supplies domain knowledge you cannot derive, mid-round. Stay interruptible.**
- **He tells you when something is good enough.** "Books did take a literal second to load, but
  that's not horrible" is a decision, not a complaint. Do not go optimise it.
- **"Prioritise" means go deep, not wide.** Do not read a broad to-do list as permission to skim.
- **He acts on findings immediately.** Report as you find, don't batch to the end.
- **He is fine with "I won't ship what I can't watch run."** Said across several rounds; it has
  never landed badly.
- **"What's next in the roadmap?" means give an ordered list with reasons.**
- **Tell him which uploads matter**, not what changed. Nine files changed, two fix anything — lead
  with the two.
- **Present designs for comment rather than shipping them silently.** His review has caught real
  bugs more than once.
- ⚠️ **Do not burn the session and skip the handoff.** He has had to say "ahem" twice, in two
  different rounds. And do not make him hunt for a document — that is what this consolidation exists
  to end.

---

## §8. Round history — one line each

Kept only so a version number or an instance name in a code comment can be placed. **Nothing here is
a pointer to a file you should go and read.**

| round | instance | what it was |
|---|---|---|
| 1–2 | Underwood, Dvorak | Write-ahead log replaces per-sentence writes. Lesson-mode pedagogy audit. Roles in documents, not claims. |
| 3 | Blick | Adventure Mode out of alpha. Language filter. EPUB multi-work spines. The document-map rule this file finally enforces. |
| 4 | Oliver | `reports.html` 2.8.0. Storage rules and the cover bug. |
| 5 | Mignon | Chapter identity (`matter`/`about`), library card markup, the first real harness suite. |
| 6 | Noiseless | `undefined-calls-test.mjs`. Two functions wired into the UI and never written. The suite could not run at all. |
| 7 | Hammond | EPUB source/licence precedence — 17 of 23 books wrong. `metadata-map-test.mjs`. Classroom editions. |
| 8 | Yost | The stale character offset, present in every `game.js` ever shipped. `contentVersion` + `anchorText` re-anchoring, Jake's time-based staleness ladder, Start Over and Flip Back. Its own first fix reproduced the bug and the harness blessed it. |
| 9 | Remington | Guest mode had been fully built and had never once executed — `firestore.rules` denied every read. Merged two disagreeing login ladders. CSV class creation. Library sorting. |
| 10 | Williams | Lesson atomicity — the entire checkpoint system deleted on Jake's ruling. Shipped without running the suite and took lesson mode down. |
| 11 | Bar-Lock | Fixed that outage (one line). The rollover import: 10 returning students imported with no error and no effect. |
| 12 | Caligraph | The doubled week counter. School had never logged session detail. `session-log.js` created. Shipped an audit that gave a false all-clear across ninety students and withdrew it the same day. |
| 13 | Ludlow | `serverAt` (write side only). Step 1.5: closing the open sprint/run, delta writes, the watermark. `hud.js`. |
| 14 | Sholes | This consolidation: nine handoffs into one, the invariant renumbering repair, and the step-2 timeliness finding in §4. |
| 15 | Densmore | Fixed Round 14's HUD fix, which shipped green and didn't work. Version footer redesign. AI-practice variety floor (game.js/index.js). HUD long-form clip fix. |
| 16 | Royal | ⚠️ MIXED — the source split shipped, broke twice in live use, and was REVERTED the same evening (see §0.6 item 9). Kept: delete→recalc, duplicate detection, flush serialization, week-repair resync, variety-floor extraction. The remediation variety floor (School's practice-missed-keys gap Round 15 flagged). The repair resync — a real incident, fixed and given harness coverage: an audit-repaired week counter that kept getting silently overwritten by a MacBook that skipped its between-period restart. Extracted the two files' duplicated variety-floor filter into `variety-floor.js`, the fifth shared module, with its own harness. The source split (DESIGN-TELEMETRY.md §2.4) — game.js/learn.js write per-source typing_logs fields instead of a shared, clobberable triple; requires firestore.rules v2.4.0 deployed first. Connected delete → recalc on the reports.html session drill-down, so a cheating student's numbers get fixed with zero manual bookkeeping and zero added cost. |
| 17 | Linotype | Repository reorganisation — 79 root entries to 33. No app code changed and nothing the browser loads moved. Harnesses to `tests/`, docs to `docs/`, Firebase config to `firebase/`, the Cloud Function to `functions/`, `audit-versions.mjs` and the Python builders to `tools/`. Found and registered two green-but-unregistered harnesses (`sort-test`, `lesson-atomicity-test`), declared the missing `@xmldom/xmldom`, added the repo's first `.gitignore`, and corrected three rounds of notes claiming `MULTITENANCY.md` had been deleted when it had not. Second pass: merged three test-first harnesses from a concurrent round and added the `PENDING` list to `run-all-tests.mjs` so red-on-purpose harnesses cannot corrupt the headline number. Third pass: the concurrent round's app code landed, all three went green and were promoted, and `session-log.js`'s header/constant mismatch was repaired. |
| 18 | Salter | Built the instrument before touching the repair, which is the whole shape of the round. `reports.html` 2.15.0 only; `game.js`, `learn.js`, `hud.js`, `stats-wal.js`, `session-log.js` and `firestore.rules` untouched. **(1)** A read-only reconciliation view: three sortable TOP-LEVEL columns (`Sessions`, `Δ`, `⧉`) comparing each student's daily-log total against the deduped sum of their actual session records — no expanding required, which was Jake's specific unfixed complaint. Sweeps every date in the range, not just dates with a log row, so a day whose log write never landed is caught. **(2)** Rebuild-all: `⟳` applied across the report behind a preview that separates who moves DOWN from who moves UP, with four refusals — never zero a sessionless day, never invent a missing log document, hold today back by default, and skip any pair that moved between preview and write. Wrote and then caught its own position-is-not-identity bug (corrections would have landed on the wrong children after the table re-sorted); invariant 107. New `tests/reconcile-test.mjs`, 35 assertions, five mutation-verified — and its own header says plainly what it cannot cover. Left §6 items 7–9 deliberately unanswered rather than guessing. |
| 19 | Hermes | The update gate — one number in a console and every open tab in the building collects the new code. Stage 1 and Stage 2 of ONE NUMBER (the student and the teacher read the same document); `daylog.js` created; `stats/time_tracking` deleted from both pages. ⚠️ Stage 2 was REVERTED the same night on finding overlapping rollups and negative character counts in `typing_sessions`. |
| 20 | Corona | Folded its own predecessor's conclusion: §0.0's evidence was sound, its arrow was wrong. The interval UNION vs the deduped SUM. Found the THIRD divergence — a `WHERE` clause, so a log stamped `classId:''` was visible to the child and invisible to every class query. Reproduced §3.1 at last. |
| 21 | Hammond II | Test tooling only, nothing student-facing. The registration audit (an unregistered harness now FAILS the suite). `tab-lifetime-test.mjs`. ⚠️ RAN THE RULES EMULATOR that four rounds recorded as impossible, and found the per-source DOCUMENT design DENIED by the deployed rules. Recorded Jake's four standing rulings in §0.-7.A so they stop being relitigated. |
| 23 | Empire | ⚠️ THE GUEST MINUTE: a child who typed before signing in kept their time in School and lost it in Library, because `game.js` had no guest merge on the auth path while `learn.js` did — and `game.js`'s two INLINE copies meant which of three sign-in buttons they pressed decided the outcome. One function now, before `loadUserStats()`, with the sprints adopted so the minutes reach the record. `learn.js` stopped filing guest runs under the throwaway anonymous uid, and its logout reloads instead of leaving the last student's totals on screen. The reconcile and rebuild-all DELETED on Jake's confirmed boundary (~830 lines), with the real production session documents lifted into `real-sessions-fixture.mjs` first. `session-log.js` made per-owner. ⚠️ Also spent most of its length on a cross-account queue theory that Jake killed with a fact already written in `stats-wal.js`'s header — see §0.-9.E, which is the part worth reading. HANDOFF.md split at 237 KB; Rounds 15–20 to `docs/archive/`. |
| 22 | Smith Premier | ⚠️ §3.1 CLOSED. The writers ship per-source FIELDS, date-gated so the upload is safe on a school night and the shape switches on 2026-08-22. Confirmed Jake's `firestore.rules` v2.6.0 by execution and gave it the harness it never had. Found two readers nobody had counted: `recalcDailyLog()`'s cutover constant was out of scope and would have thrown on the ⟳ button, and `lessons-admin.js` was a fourth reader of `typing_logs` that would have shown every student's week as nearly nothing from Saturday. Rewrote `crossmode-overwrite-test.mjs`, which had spent six rounds validating a design the rules reject. |

---

## §9. Document map

**In the repo and live:**

| doc | what it is for |
|---|---|
| `HANDOFF.md` | this file — the only handoff. **Root**, and it stays there |
| `README.md` | what the project is; file map, data model. **Root** |
| `CHANGELOG.md` | **Root.** Kept, but its index is stale — §6.4. The file headers are the more reliable history. ⚠️ Round 17 left it untouched on purpose: a changelog is a record of what happened, and rewriting old entries to use new paths would falsify it |
| `docs/README.md` | 🆕 index of the folder below — one line per document on when to read it |
| `docs/DESIGN-TELEMETRY.md` | ⚠️ the forward plan. §2 verification-only, §7 build order, §8 things that must not happen |
| `docs/SCALE-PLAN.md` | cost model. Read the header box; its Security section's premise was false and is re-headed |
| `docs/TTL-GUIDE.md` | TTL policy, billing arithmetic, composite indexes. Console steps walked through with Jake |
| `docs/README-SESSION-LOGGING.md` | teacher-facing: session history, the week audit, the ID stamp |
| `docs/PEDAGOGY-AUDIT.md` | Round 2 research. The only record of why the lesson gates are what they are |
| `docs/archive/MULTITENANCY.md` | ⚠️ **SUPERSEDED, and see the correction below.** Kept for two arguments that appear nowhere else; its warning header is what makes keeping it safe |
| `tests/README.md` | 🆕 the suite: what is registered, what is deliberately not, and the standing failure |
| `tests/reconcile-test.mjs` | ⚠️ not a document, listed here because **its header is one** — it states what the reconciliation harness does *not* cover, which is the part that matters. Read it before trusting a green run |
| `tests/TESTING-ttb-test-epubs.md` | the synthetic EPUB test corpus |
| `tools/README.md` | 🆕 `audit-versions.mjs` and the two EPUB builders, with their accepted problem count |
| `library/gutCleaners/*` | the bookclean project's own docs. Separate concern, leave alone |

**⚠️ CORRECTION, ROUND 17 — `MULTITENANCY.md` WAS NEVER DELETED.** This section said it was, from
Round 14 through Round 16, while the file sat in the repo root the entire time. Three rounds of
readers were told not to look for a file that was right there, and told nothing about the file they
would find if they did. It is `docs/archive/MULTITENANCY.md` now, unchanged, with the warning header
it was committed with in Round 6. Everything this section said *about* it remains true: it specified
an Auth custom-claims model that was reversed, and it is the probable reason
`firestore-rules.test.mjs` has never matched the rules it tests. **Whether to delete it for real is
Jake's call.** A tidy-up may move a file; deleting a document three rounds of notes disagree about is
a decision, not housekeeping.

**⚠️ GONE, AND GONE MEANS GONE.** Every `HANDOFF-roundN.md` is deleted; their content is in §1–§8.
`UPLOAD-ORDER.md` is deleted; it described Round 6.

`SETUP-NO-CLI.md` and `RULES-AUDIT.md` were lost long ago. `firestore.rules` cites `SETUP-NO-CLI.md`
by name for granting the first `super_admin`; that is the one operationally real gap, and the remedy
is to write the paragraph into `firestore.rules`'s own header, not to go looking.

**Do not go hunting for any of these, and do not send Jake hunting.** If you ever genuinely need
one, say so plainly and name what you need it for.
