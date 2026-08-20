# HANDOFF — TypeThatBook

<!-- HANDOFF.md v14.15.0 — consolidated 2026-08-18 by Round 14 (Sholes); amended
     2026-08-19 by Round 15 (Densmore), Round 16 (Royal) and Round 17 (Linotype);
     amended 2026-08-19 by Round 18 (Salter); amended 2026-08-19 by Round 19
     (Hermes).

     v14.18.0 — Round 19, FOURTH pass: ⚠️ STAGE 2 IS BUILT TOO. §0.0.5 now covers
     both stages. typing_logs is a PROJECTION of typing_sessions; the leaderboard
     — the last independent counter in the app — is derived; §0.0.6's open list
     is down to the two items nothing in code can close. New: a note on EPUB
     metadata backfill (§0.0.7), because Jake asked and the answer is not the one
     anybody wants.

     v14.17.0 — Round 19, THIRD pass: ⚠️ STAGE 1 IS BUILT. §0.0.5's step list is
     rewritten as a record of what shipped rather than a plan. New shared module
     daylog.js; game.js 3.31.0, learn.js 2.16.0, index.html 3.9.0 and
     reports.html 2.16.0 all read the graded document; the week-counter audit and
     repair are DELETED. §2's table and harness count updated. §6 items 3 and 4
     resolved. ⚠️ THE SUITE IS AT 29 OF 29 FOR THE FIRST TIME — invariant 54's
     standing red is closed, and it was closed by FIXING TWO REAL DEFECTS, not by
     deleting the harness that found them.

     v14.16.0 — Round 19, second pass. ⚠️ §0.0 IS NEW AND IT IS THE TOP OF THIS
     FILE. Jake, 2026-08-19, after five rounds of asking: "I NEED THE NUMBERS TO
     LINE UP ACROSS THE BOARD. Make it the number one thing in the handoff. If
     everything else works and that doesn't, then nothing works." §0.0 is that.
     It also records the ROOT CAUSE, which no round before this one had named,
     and it OVERTURNS §0.9's max() recommendation on Jake's explicit ruling that
     inflation is not the safe direction. Read §0.0 before §0.10, before §0.9,
     before anything.

     v14.15.0 — Round 19: §0.10 added ABOVE §0.9, because it answers a question
     §0.9 does not — §0.9 makes JAKE's number trustworthy and says nothing about
     the number the STUDENT is looking at, and Jake's stated requirement is that
     the two line up. §0.10 also records the deploy-reach problem and the gate
     built for it. ⚠️ NO COUNTING CODE CHANGED: game.js, learn.js, hud.js,
     stats-wal.js, session-log.js, reports.html and firestore.rules are all
     byte-identical to what Round 18 left.

     v14.14.0 — ⚠️ §0.9 ADDED AND IT IS THE TOP OF THIS FILE FOR A REASON. Jake
     ruled on 2026-08-19 that the grade moves off `typing_logs` and onto
     `typing_sessions`. That is now the priority above everything in §4. Read
     §0.9 before §0.8, before §4, before anything.

     v14.13.0 — Round 18: §0.8 added (reconciliation view + rebuild-all,
     reports.html 2.15.0, tests/reconcile-test.mjs new). §2's table and harness
     count updated. §5 gains invariants 107–109. §6 gains items 7–9, which are
     the THREE OPEN QUESTIONS Round 18 deliberately did not answer. §8 and §9
     updated. ⚠️ NO APP CODE OUTSIDE reports.html CHANGED — game.js, learn.js,
     hud.js, stats-wal.js, session-log.js and firestore.rules are byte-identical
     to what Round 17 left, and that was the point of the round.

     v14.12.0 — Round 17, fourth pass: ⚠️ THE SOURCE SPLIT WAS REVERTED. game.js
     3.30.0, learn.js 2.15.0, lessons-admin.js 1.12.0, reports.html 2.14.0 and
     source-split-test.mjs v2.0.0 landed; §0.6 now carries item 9 and the revert
     analysis. session-log.js STAYS at 1.3.0 — the flush serialization was kept.
     Stale references to the deleted Part C corrected in §0.7 and in
     run-all-tests.mjs's harness description.

     v14.11.0 — Round 17, third pass: the concurrent round's APP CODE landed
     (game.js 3.29.1, learn.js 2.14.1, lessons-admin.js 1.11.1, session-log.js 1.3.0,
     reports.html 2.13.2). All three PENDING harnesses went green and are promoted
     into FAST; PENDING is empty. Their §0.6 items 7 and 8 are merged in verbatim.
     ⚠️ session-log.js arrived with a HEADER/CONSTANT MISMATCH, repaired here.

     v14.10.0 — Round 17, second pass: three harnesses from a CONCURRENT round were
     merged in. They are test-first and red on purpose; `run-all-tests.mjs` grew a
     `PENDING` list so they do not corrupt the headline number. §0.7 and §6 updated.

     v14.9.0 — Round 17 reorganised the repository. NO APP CODE CHANGED and nothing
     the browser loads moved, so every version number in §2 is still correct — but
     the harnesses are in tests/, the reference docs in docs/, the Firebase config
     in firebase/, the Cloud Function in functions/, and audit-versions.mjs plus
     the two Python builders in tools/. §2, §8 and §9 are updated. §9's claim that
     MULTITENANCY.md was deleted is CORRECTED: it never was.

     ⚠️ THIS IS THE ONLY HANDOFF DOCUMENT. It replaces every HANDOFF-roundN.md
     that ever existed. Rounds 3, 5, 6, 7, 8, 9, 11, 12 and 13 have all been read
     and folded in; their files are deleted from the repo. Everything a future
     instance needs is here.

     ⚠️ DO NOT CREATE HANDOFF-round15.md. DO NOT FORK THIS FILE. §0 is the rule
     set and it is not optional. Six rounds of "go and read round 8 §4" cost Jake
     an entire evening of hunting, and produced an invariant numbering collision
     that took seven file uploads to repair. -->

**Round 19 — Hermes.** Predecessors: Salter (18) · Linotype (17) · Royal (16) · Densmore (15) ·
Sholes (14) · Ludlow (13) · Caligraph (12) · Bar-Lock (11) · Williams (10) ·
Remington (9) · Yost (8) · Hammond (7) · Noiseless (6) · Mignon (5) · Oliver (4) ·
Blick (3) · Dvorak (2) · Underwood (1).
*Other projects, do not reuse:* Stedman, Fable, Trilby, Vernier.

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

## §0.0. ⚠️⚠️ THE ONLY THING THAT MATTERS: ONE NUMBER, NOT THREE

**If you read one section of this document, read this one. If everything else in
this repo works and this does not, nothing in this repo works.**

Jake's words, 2026-08-19, after asking five consecutive rounds for the same
thing and being handed five plans that did not deliver it:

> *"I need the numbers to line up. Period. End of story."*
> *"It's like saying I have a great car, except for the fact it has no brakes."*

### 0.0.1 ⚠️ JAKE'S RULING ON WHICH DIRECTION IS SAFE — THIS OVERTURNS §0.9

**§0.9 recommends grading on `max(logSeconds, sessionSeconds)` and argues that
overcounting is the safe direction because it "can only err in the student's
favour." JAKE HAS RULED THAT REASONING WRONG AND IT IS WITHDRAWN.** His words:

> *"Inflating a kid's grade because my code is fucked may not result in angry
> parents, but it results in kids getting credit for work they did not do.
> That's not better. For the kid, it's worse."*

⚠️ **DO NOT PROPOSE `max()`, A TOLERANCE WINDOW, A FUDGE FACTOR, OR ANY OTHER
SCHEME WHOSE DEFENCE IS "IT ERRS TOWARD THE STUDENT."** He is not optimising for
the absence of complaints. He is optimising for the number being TRUE, because a
grade that overstates what a child did is a lie told to that child. The target
is not "safe." The target is **correct**.

`max()` remains in §0.9 only as the interim CSV workaround for the week already
in progress, and it is a stopgap he accepted under a deadline, not a design.

### 0.0.2 ⚠️ THE ROOT CAUSE — nobody had named this before Round 19

`firestore.rules` up to v2.4.0:

```
match /typing_logs/{docId}     { allow read: if canReadActivity(resource.data); }
match /typing_sessions/{id}    { allow read: if canReadActivity(resource.data); }
```

`canReadActivity()` is **staff-only**. Therefore:

⚠️ **A STUDENT'S BROWSER HAS BEEN STRUCTURALLY FORBIDDEN FROM READING EITHER
RECORD THE TEACHER GRADES FROM.** It could write them. It could never read them
back. So the HUD had no way to display the graded number and **no choice but to
maintain a private second copy** — `users/{uid}/stats/time_tracking` —
accumulated independently in browser memory and flushed on its own schedule.

That is §3.1's sentence ("two records of one quantity, updated on different
paths, disagreed") and this rule is **why it was unavoidable rather than
careless**. Every counting incident in this project's history — the doubled week
counter, the missing stats documents, the HUD that changed on refresh, the
cross-mode overwrite, the repair that gets overwritten by a live tab — is
downstream of it. Four rounds tried to make two independently-written copies
agree with each other. **They cannot. That is not a bug to fix, it is a
guarantee that does not exist.**

### 0.0.3 THE TARGET STATE — one document, read by both surfaces

| | |
|---|---|
| **Record** | `typing_sessions` — append-only, dated when typed, written from a durable queue by every client back to v2.4.0. Already trustworthy; verified by console dump 2026-08-19. Untouched by this work. |
| **Projection** | `typing_logs/{uid}_{date}` — **recomputed from that day's sessions. Set, never merged.** |
| **The student's HUD** | reads `typing_logs/{uid}_{date}` |
| **The teacher's report** | reads `typing_logs/{uid}_{date}` |
| **`users/{uid}/stats/time_tracking`** | ⚠️ **DELETED. It is the second copy. It is the disease.** |

**The kid's screen and Jake's report become the same document.** Not reconciled,
not audited, not compared — *the same document*. Two things reading one document
cannot disagree. That is the only arrangement that satisfies what he asked for,
and everything short of it is another reconciliation tool.

⚠️ **THE WEEK-COUNTER AUDIT AND ITS REPAIR DIE WITH IT.** They exist solely to
drag the second copy back into line with the first. With one copy there is
nothing to audit. Jake: *"I can't run an audit every time."* He is right, and
the answer is not a faster audit.

### 0.0.4 WHY THIS IS SMALLER THAN FIVE ROUNDS OF FAILURE SUGGEST

The document id is `uid + '_' + date`. It is **deterministic**, so the HUD reads
a week as **seven `getDoc()` calls by id** — no query, **no composite index**,
and no change to `firestore.indexes.json`'s field exemptions (which have `uid`
un-indexed, and would have made a `where('uid','==')` query impossible). About
seven reads per page load against the one it does today. Negligible.

**SHIPPED ALREADY (Round 19): `firestore.rules` v2.5.0** adds
`(signedIn() && resource.data.uid == request.auth.uid) ||` to the read rule on
both collections. Owner-scoped; no student can see another's anything; staff
access unchanged. **Safe standing alone — nothing reads those paths as a student
yet — which is why it deploys first.**

### 0.0.5 ⚠️ STAGE 1 IS BUILT — WHAT SHIPPED, AND IN WHAT ORDER TO DEPLOY IT

**STAGE 1 — MAKE THEM LINE UP. BUILT, Round 19. Deploy in this order.**

| # | file | version | note |
|---|---|---|---|
| 1 | `firebase/firestore.rules` | 2.5.0 | ⚠️ **CONSOLE. Jake confirmed live 2026-08-19.** Everything below fails its reads without it. |
| 2 | `daylog.js` | 1.0.0 — **NEW** | Shared module, imported by both page controllers. Goes up FIRST — a missing import renders nothing at all (§1). |
| 3 | `reports.html` | 2.16.0 | ⚠️ **CONSUMER FIRST (§1).** Works correctly against the OLD controllers; the old version against the NEW ones offers a repair button for a document nothing reads. |
| 4 | `index.html` | 3.9.0 | Shelf banner off the old rollup. |
| 5 | `game.js` | 3.31.0 | |
| 6 | `learn.js` | 2.16.0 | |
| 7 | `versions.js` | 1.9.0 | Registers `daylog.js`. |

**What the change is, in one sentence:** the day and week totals a student sees
are read from `typing_logs/{uid}_{date}` — the same seven documents
`reports.html` grades from — and `users/{uid}/stats/time_tracking` is written by
nothing and read by nothing.

**Deleted, deliberately, and each deletion is load-bearing:**

* `checkForWeekRepair()` and `lastKnownRepairedAt`, both files. They defended a
  stored week counter against a repair button. There is no stored week counter:
  the week is the SUM of seven documents, recomputed on every load and persisted
  nowhere.
* `auditWeekCounters()`, `renderAuditPanel()`, `repairWeekCounter()`, `bucket()`,
  `WEEK_TOLERANCE`, and `reports.html`'s own `weekStartOf()`/`addDays()` — about
  240 lines. All of it existed to drag a second copy back into line with the
  first. **Jake: "I can't run an audit every time." A faster audit was never it.**
* The two mirror writes into `stats/time_tracking` from `reports.html`'s manual
  save and `⟳` recalculate. A correction now reaches the student by being
  written, full stop.

**What survives and is now the only checking tool on the page:** `Reconcile vs
Sessions`. That compares the graded document against the append-only session
record — **a projection against its SOURCE**, which is a real check. The audit
compared two rival copies of one number, which never was.

⚠️ **THE ONE RESIDUAL GAP, AND SAY IT IN THESE WORDS.** A student mid-sprint has
typed seconds that have reached no stored record anywhere. The HUD shows the
projection plus the live open-unit delta. It closes at every unit boundary and on
`visibilitychange`/`pagehide`. It is irreducible in any design. **DO NOT CLAIM
ZERO.**

⚠️ **`readWeek()` RETURNS `ok:false` RATHER THAN ZEROS IF ANY OF THE SEVEN READS
FAILED, AND BOTH CALLERS STOP.** A partial week is an undercount that looks
exactly like a light week, and showing a child less than they earned is the same
lie as showing them more. `tests/daylog-test.mjs` Part C guards the module;
`session-merge-test.mjs` Part D guards that the callers honour it.

**STAGE 2 — MAKE IT TRUE. BUILT, Round 19. Deploy after Stage 1 has been seen
working in a real period.**

| file | version | note |
|---|---|---|
| `session-log.js` | 1.4.0 | Adds `sessionLogPendingSeconds()`. ⚠️ **Three version pins move with it** (§1) — `session-merge-test.mjs` and `open-unit-test.mjs` are updated. |
| `daylog.js` | 1.1.0 | Adds `sessionSignature()`, `sumDaySessions()`, `readDaySessions()`, `projectDayTotal()`. |
| `game.js` | 3.32.0 | Projection + leaderboard derived. |
| `learn.js` | 2.17.0 | Projection. |

**The daily total is no longer reported by a tab. It is computed:**

```
typing_logs.seconds = server sessions (deduped)
                    + this device's un-uploaded queue
                    + this tab's still-open sprint/run
```

The first term is shared, append-only and cannot be overwritten, so **two tabs
can no longer erase each other's day** — each adds only its own unflushed tail on
top of the same base, and that tail reappears for everyone the moment it is
logged. The projection is **self-healing**: it converges on the session record.

⚠️ **THE OPEN TERM IS READ FROM THE WATERMARKS THAT ALREADY EXIST** —
`sprintSeconds` vs `sprintLoggedSeconds` in `game.js`, `stepSeconds` vs
`stepLoggedSeconds` in `learn.js`. No second set of books, so §3.3's "reset the
watermark wherever you reset the counter" still covers both by construction.

⚠️ **A FAILED SESSION READ WRITES NOTHING.** A projection built on a failed read
is not a smaller number, it is an invented one, and it would land on top of a
correct stored value. The WAL keeps the local copy and the next flush retries.

⚠️ **ONLY `seconds` IS PROJECTED.** `chars` and `mistakes` still ride the counter.
Deliberate: seconds are what Jake grades on, `session-log.js` exposes queued
seconds only, and a second accessor for figures nobody grades on is surface area
for nothing. `⟳` corrects them when they matter.

⚠️ **READ COST.** One `typing_sessions` query per flush per student. At Ellis —
90 students, roughly one period each, ~10 flushes — that is ~900 queries/day
returning a handful of documents each. Negligible. **At the full district
population SCALE-PLAN models it is materially larger and should be re-costed
before that rollout**, most cheaply by caching the server term and refreshing it
only after a successful session upload.

**THE LEADERBOARD IS DERIVED TOO.** `flushLeaderboard()` was the last place in
the app that accumulated a student's time independently — an honest gap in the
"one number" claim, called out in the previous pass of this section. It now takes
`statsData.secondsWeek` (itself the sum of seven daily documents) and keeps the
old `lbPendingSeconds` accumulator **only as a floor**, so a guest stretch or a
refused week read can never drag the board below what the session banked.

### 0.0.6 ⚠️ STILL OPEN AFTER STAGE 2

* ✅ **The leaderboard is derived** as of v3.32.0. It was the last independent
  counter; see §0.0.5.
* ⚠️ **THE 120-DAY TTL ON `typing_sessions` IS NOW LOAD-BEARING.** `typing_logs`
  IS a projection of a collection that expires, a rebuild after 120 days produces
  zero. `typing_logs` has no TTL and must keep none — **and the never-zero
  refusal (§0.8.3 item 1) becomes load-bearing, not a nicety.**
* **Guests.** No uid, so no daily log and no gate. Both signed-out branches still
  paint from local counters. Verified by reading, NOT by running.
* ⚠️ **NOTHING IN NODE CAN CHECK THAT `firestore.rules` v2.5.0 ACTUALLY PERMITS
  THE OWNER READ.** It is a console action and the entire redesign rests on it.
  **If students report 0:00 after this deploys, check the rule first**, not the
  green suite. `tests/daylog-test.mjs`'s header says the same thing.


### 0.0.7 EPUB METADATA BACKFILL — asked for, and the honest answer

Jake, 2026-08-19, on the transcriber credits lost by the `admin.js` bug before
v3.31.1: *"If — on a future pass — we could add the ability to try to fill in
missing metadata from the book itself (assuming that's still in what's uploaded),
that would be grand."*

⚠️ **IT IS NOT STILL IN WHAT WAS UPLOADED.** `admin.js` parses the EPUB **in the
browser** and writes only the extracted chapter text to Firestore and the cover
image to Storage (`covers/{bookId}` — the only `uploadBytes()` call in the file).
**The source archive is discarded.** There is nothing on the server to re-read,
so a backfill for the ~53 books already imported would need those EPUBs uploaded
again.

**What IS worth building, and is small:** a re-import path that takes an EPUB for
a book that already exists and fills in **only the metadata fields that are
currently blank**, touching no chapter text and overwriting nothing Jake has
typed by hand. That turns the backfill from "re-import 53 books and redo the
manual attribution work" into "drag the file in, and anything missing appears."
He has already corrected rights and source by hand on all of them, so a tool that
respects existing values is the difference between useful and destructive.

⚠️ **DO NOT BUILD A BULK OVERWRITE.** He fixed those fields manually, one book at
a time.

**A cheaper partial for Gutenberg books specifically:** the origin URL is already
stored and canonical (`gutenberg.org/ebooks/<id>`), so the transcriber names are
recoverable from Gutenberg itself — but that is a cross-origin fetch from a
browser with no CLI and no Cloud Function deploy, so it is a bigger job than it
sounds. Mentioned so nobody re-derives it as an easy win.

---

## §0.10. ⚠️ ROUND 19 — READ WITH §0.9, NOT INSTEAD OF IT

### 0.10.1 THE GAP IN §0.9, AND JAKE SAID IT OUT LOUD

§0.9 is right about which record to grade from and **does not answer the
question Jake actually asked.** His words, 2026-08-19: *"Kids see one time, but
I see another. That time is their grade, so they need to line up."*

§0.9 grades from `typing_sessions` and demotes `typing_logs` to "a live
on-screen display, never graded from again." That makes **Jake's** number
trustworthy. It leaves the student watching a *different* number and calls that
acceptable. It is not: a child who sees 38 minutes and is graded on 44 cannot
check their own work, and neither can Jake when a parent asks.

**THREE documents still hold one quantity** (§3.1), and the split is exactly
along the line of the complaint:

| surface | reads |
|---|---|
| the student's HUD | `users/{uid}/stats/time_tracking` |
| Jake's report | `typing_logs/{uid}_{date}` |
| the independent record | `typing_sessions` |

⚠️ **THE HUD AND THE REPORT ARE DIFFERENT DOCUMENTS ON DIFFERENT WRITE
SCHEDULES. They drift by construction, and no amount of correcting the counter
changes that.** Whatever number becomes the grade, the student has to be looking
at that number. That is unfinished and it is the next real design decision —
**it is a write-path change and must not ship on a school night.**

### 0.10.2 THE GRADE DOES NOT DEPEND ON THE STALE-CLIENT PROBLEM

The one genuinely good piece of news this round found, and it is what let Jake
grade before anything else was fixed:

**`typing_sessions` is written the same way by every client back to v2.4.0** —
from a durable localStorage queue, dated when the typing happened. It does not
care which version of `game.js` is in the tab. `typing_logs` is a live
in-memory counter whose correctness depends entirely on which code is running.

⚠️ **So "which version is this child running" and "what is this child's grade"
are separable problems, and they were being fought as one.** The weekly
procedure is in `README.md`: Generate → Reconcile vs Sessions (read-only) →
Export CSV → grade off the larger of `Total Seconds` and `Session Seconds`.
Since the target is 10 minutes a day, inflation above target changes no grade;
deflation is the only thing that costs a child points, and taking the higher of
two independently-written records catches exactly that.

### 0.10.3 WHAT SHIPPED — `update-gate.js` v1.0.1

**NEW FILE `update-gate.js`, plus one `<script>` line each in `game.html`
(1.1.0 → 1.2.0) and `learn.html` (1.0.0 → 1.1.0). `versions.js` → 1.8.0 and its
`tools/audit-versions.mjs` mirror register it.** Nothing else moved.

To fire a building-wide reload: Firestore → `settings` → `appVersion` → field
`nonce` (number), increase by one. Optional `note` (string) shows on the
student's overlay.

⚠️ **NO `firestore.rules` CHANGE IS NEEDED** — `match /settings/{docId}` already
allows read to any signed-in account. **Guests are therefore never gated.**
Deliberate: a guest has no graded record to keep consistent, and widening that
rule is a security decision, not a deploy convenience.

⚠️ **IT LOADS FROM ITS OWN SCRIPT TAG, NOT AS AN IMPORT.** Two reasons, both
load-bearing. A separate module graph means a 404 on it cannot stop the typing
page booting — §1's "a missing module renders nothing at all" does not cross
script tags. And it meant this shipped without one line changing in `game.js` or
`learn.js`, which is the standing rule while the counting code is under repair.

⚠️ **IT CANNOT REACH A TAB ALREADY OPEN ON PRE-GATE CODE.** Nothing can — a page
that is not asking the server a question cannot be told an answer. Those clear
on the next reload or restart. What the gate buys is that it is the last time.
**Do not let anyone write a release note claiming otherwise.**

### 0.10.4 ⚠️ THE BUG THIS ROUND SHIPPED AND CAUGHT, v1.0.0 → v1.0.1

v1.0.0 pre-fetched each asset as `fetch(a + "?u=" + nonce, {cache: "reload"})`.
**An HTTP cache entry is keyed by the whole url.** That refreshed the entry for
`game.js?u=7` — a url nothing ever requests — and left `game.js`, which is what
`game.html`'s script tag actually asks for, exactly as stale as it was.

**The gate would have reloaded the entire building into the identical old code,
every ten minutes, and every observable sign would have said it worked.** The
cache-busting is `{cache: 'reload'}` alone; the query string was not merely
redundant, it defeated the mechanism. The `?u=` on the *page* url is a different
thing and is still wanted — it forces the html document past the bfcache.

Found by re-reading, not by running anything. **No harness in this repo could
have caught it**, which is the same shape as Round 18's §0.8.4 near-miss and
worth noticing as a pattern: the defects that survive this project's test suite
are the ones about *identity* — which url, which student, which document — not
about arithmetic.

### 0.10.5 WHAT ROUND 19 DID NOT DO

* **Did not touch `reports.html`.** Round 18's 2.15.0 is untouched at 2.15.0.
* **Did not make the HUD and the grade agree.** §0.10.1. Still open, still the
  most important thing left, still a write-path change.
* **Did not write a harness for `update-gate.js`.** Everything it does is
  `fetch`, `localStorage` and `location.replace` — the parts worth testing are
  precisely the parts Node cannot see. A green harness here would be decoration.
  **If you disagree, the assertion worth writing is that the pre-fetch url has
  no query string** (§0.10.4), and that one is a text check against the source
  in the same style as `open-unit-test.mjs` Part E.
* **Did not resolve why the week-counter audit reports problems on every run.**
  The hypothesis on the table, and it is only that: students holding pre-v3.28.0
  code in an open tab do not have `checkForWeekRepair()` and write their stale
  in-memory week counter back over each repair. Repair, overwrite, repair.
  **If that is it, the gate is the fix and the audit was never broken.**
  ⚠️ **Do not treat this as established.** Round 16 formed a theory in this area,
  Jake's console output killed it, and §6 item 7 still says CAUSE UNKNOWN — DO
  NOT GUESS.

---

## §0.9. ⚠️ SUPERSEDED IN PART BY §0.0 — READ §0.0 FIRST

⚠️ **§0.9's `max(logSeconds, sessionSeconds)` recommendation is WITHDRAWN.** Jake
ruled on 2026-08-19 that inflation is not the safe direction — see §0.0.1. What
survives here is the analysis of why `typing_sessions` is the trustworthy record
and `typing_logs` is not; what does not survive is the idea that erring upward is
acceptable. §0.9's step 3 ("demote the counter, leave the student watching it")
is also superseded: §0.0 deletes the second copy instead.

### The original §0.9 — THE GRADE MOVES OFF `typing_logs`

**Jake's ruling, 2026-08-19, verbatim in substance:** *"If we have one
trustworthy number and one broken number, get rid of the broken one and keep the
trustworthy one."*

He grades students on practice time. 10 minutes a day, 40/50 for the week is an
80%. Real grades, real parents, real administrators, and other schools now using
this. **The number he grades from is not trustworthy and he knows it.** That is
the only problem worth working on until it is closed.

### 0.9.1 The ruling

| | |
|---|---|
| **`typing_logs`** | A live counter in browser memory, written by `game.js` **and** `learn.js` into one shared document, flushed on a timer and at page-death. **Four rounds have tried to make it reliable. Three of those attempts shipped defects into a live classroom and were reverted.** It is not going to become trustworthy. |
| **`typing_sessions`** | Append-only. One document per (day, source, book/lesson), written from a durable `localStorage` queue, dated when the typing happened, each carrying its own `sprints[]`. Verified by Jake's own console dump on 2026-08-19: ten documents, every stored total matching the sum of its own sprints exactly. |

**`typing_sessions` becomes the graded record. `typing_logs` is demoted to a
live on-screen display for the student and is never graded from again.**

⚠️ **DO NOT "FIX" THE COUNTER.** That is the trap this project has fallen into
four times. The counter is fine at its actual job — showing a kid a number while
they type. It was never fit to be a grade. Rounds 15, 16 and two of Round 16's
own passes were all spent trying to make a fundamentally unreliable mechanism
reliable instead of asking why a grade was reading from it. **If your plan
contains an edit to `game.js` or `learn.js`, you have the wrong plan.**

### 0.9.2 Build order — smallest safe step first

Every step below is in `reports.html` alone. **No step touches `game.js`,
`learn.js`, `hud.js`, `stats-wal.js` or `session-log.js`. No step needs a
`firestore.rules` change.** That is what makes this shippable inside a school
week; do not give that property up for elegance.

**STEP 1 — GRADE FROM SESSIONS. This is the one that has to land first.**

`reports.html` v2.15.0 already computes the deduped session total per student —
it is the `Sessions` column, and the sweep behind it (`runReconcile()`,
`readPairSessions()`) is finished, tested and read-only. **The work is not
computing the number. It is promoting it.**

* Make the graded column **`max(logSeconds, sessionSeconds)`**, labelled plainly
  as the graded figure, with the two inputs shown beside it.
* ⚠️ **`max()`, NOT sessions-alone, and this is a deliberate safety margin, not
  indecision.** Sessions are written at run/unit boundaries, so a queue that
  never flushed loses real time — **sessions can undercount.** The log's failure
  is bidirectional; the session record's failure is one-directional and always
  downward. Taking the higher of two independently-written records can only ever
  err in the student's favour, and every known defect in this area is our code's
  fault, not a child's. Do not "simplify" this to sessions-only to make the data
  model tidier.
* Note what Jake's grading scheme does to the error: the target is 10 minutes,
  so **anything above target is already full credit and inflation above it
  changes no grade at all.** The only students inflation can affect are those
  under target, and `max()` is generous to exactly them. **Deflation is the real
  enemy and `max()` is precisely what catches it.**
* Export it in the CSV. The CSV is what he actually grades from.

**STEP 2 — SNAPSHOT, BECAUSE THE RECORD EXPIRES.**

⚠️ **`typing_sessions` carries a 120-day TTL.** A 9-week rotation is 63 days, so
the current quarter is safe — **but a grade challenged in April for October's
work has no record behind it.** Write a per-student weekly total into a small
permanent document (no TTL) at the end of each week, from `reports.html`, from
the swept session data. Small, cheap, permanent, and it is the thing that makes
this defensible six months out.

**STEP 3 — DEMOTE THE COUNTER, IN THE UI ONLY.**

Relabel `typing_logs` in `reports.html` as a live display figure, not a grade.
Leave the writers alone. The counter keeps doing its on-screen job.

**STEP 4 — ONLY THEN, and only with Jake's say-so, consider the writers.**

Once the grade no longer depends on it, `typing_logs` becomes low-stakes and can
be fixed calmly, or left alone forever. **It stops being urgent the moment
step 1 lands, which is the entire point of doing step 1 first.**

### 0.9.3 ⚠️ Two blind spots that survive this change — say them out loud

1. **A student with no `typing_logs` document at all is invisible.** The report
   enumerates students *from* `typing_logs`, so the sweep can only check students
   that collection already knows about. A missing *day* is caught; a missing
   *student* is not. The durable fix is to enumerate from the class roster
   instead. **A cheaper interim check: compare the report's student count against
   the class roster size and say so on screen when they differ.** Do that even
   if you do nothing else about it.
2. **Sessions begin at v2.4.0.** Anything before that is log-only and always will
   be. Nothing fixes it; do not pretend otherwise in a UI.

### 0.9.4 What Jake needs from the very next instance

He said *"I can't chase this for weeks"* and he is right. **Step 1 is one file
and no new write path.** It is achievable in a single session. Ship step 1 by
itself if that is all there is time for — a shipped step 1 changes his situation
completely and a perfect four-step plan that lands next month does not.

⚠️ **This is a teacher who is the only tester and whose students are the blast
radius.** Never deploy a write-path change on a school night. Step 1 is a
read-path change, which is exactly why it is first.

---

## §0.8. Round 18 — Salter

Jake's brief opened with the fact everything else in this round hangs off:

> *Student grades come from typing time. The number he grades from is wrong —
> inflation and deflation on every audit run. He grades from it now. Fixing the
> writers is not the job. Giving him a correct number and a way to see it is
> the job.*

**One file changed: `reports.html`, 2.14.0 → 2.15.0.** One file added:
`tests/reconcile-test.mjs`. `game.js`, `learn.js`, `hud.js`, `stats-wal.js`,
`session-log.js` and `firestore.rules` are untouched, and the next round should
keep it that way unless it has a reason far better than "while I was in there".

### 0.8.1 ⚠️ THE PREMISE. Do not build on this round without accepting it.

`typing_sessions` is the record. `typing_logs` is a cache of it.

That was established on 2026-08-19 by a console dump Jake ran: ten
`typing_sessions` documents, each one's stored `seconds`/`chars` matching the sum
of its own `sprints[]` **exactly**, correct `source` tags, no internal
inconsistency anywhere. Meanwhile every defect of Round 16 lived in
`typing_logs` — a live counter accumulated in browser memory, shared by two page
controllers, dependent on a tab surviving and on a write landing at page-death.

So the comparison this round draws is (cache − record), and the repair rebuilds
the cache from the record. **If a future round finds that `typing_sessions` is
itself unreliable, this entire feature becomes actively dangerous** — it would
be confidently overwriting good numbers with bad ones, at scale, with a preview
that looks authoritative. Re-verify the premise before extending it.

### 0.8.2 What shipped

**(1) Reconciliation view — read-only.** A `Reconcile vs Sessions` button beside
`Audit Week Counters`. It sweeps `typing_sessions` for every (student, date) pair
in the current report, dedupes with the existing `sessionSignature()`, and fills
three new **top-level, sortable** columns: `Sessions`, `Δ`, `⧉`.

Top-level was the requirement, not a preference. Jake's complaint was specific:
he should not have to expand each child to find a duplicate, and the drill-down
version of this (v2.13.2) did not fix that. Sorting by `Δ` or by `⧉` is now the
entire workflow; expanding a student is for confirming what the summary row
already told you.

⚠️ **The sweep probes every date in the range, not only dates that have a log
row.** A day whose `typing_logs` write never landed at all has no row to iterate,
so iterating the report's own `dailyLogs` would skip precisely the case this
tool exists to catch — real sessions, no cached total, a child under-credited
and nothing on screen saying so. A quiet day costs one empty-query read, which
is the cheapest way to be able to say "checked".

**(2) Rebuild-all.** What `⟳` does for one day, across the report, behind a
preview. The preview splits into **"will go DOWN — read these first"** and "will
go UP", biggest movers at the top of each, because a correct rebuild can
legitimately lower a child's number and Jake has to be the one who accepts that
before anything is written. It calls `recalcDailyLog()` — the same function `⟳`
has used since v2.13.0 — one day at a time, one `updateDoc` each, against
`typing_logs` only. **No new write path was introduced.**

### 0.8.3 ⚠️ THE FOUR REFUSALS. Each one is a defect that was otherwise possible.

1. **A day with no session records is never zeroed.** Skipped and listed with its
   reason. `allowZero` is *not* passed on the bulk path. Such a day is usually
   one that predates session logging (v2.4.0) or whose sessions aged past the
   120-day TTL — its log total is real and is the only copy left. Zeroing it
   would destroy graded time and would look exactly like a successful repair.
2. **Sessions with no daily-log document are skipped, not created.**
   `firestore.rules` gives staff `update` only on `typing_logs`; `create`
   requires `request.resource.data.uid == request.auth.uid`. There is nothing to
   write into, and widening that rule is a security change, not a repair.
   They are surfaced in the panel so the shortfall is visible.
3. **Today is excluded by default**, checkbox to include. Sessions are written at
   run/unit boundaries, so a student mid-chapter has real time in their log that
   is not in sessions yet; rebuilding now truncates them to their last completed
   unit. The panel also warns if it is currently a weekday between 07:00 and
   15:00.
4. **Each write re-verifies against the preview.** `recalcDailyLog()` gained an
   `expect` option: if the re-read produces anything other than what the preview
   promised, the pair is **skipped and reported**, not written. Writing the
   newer, more-correct value is the defensible-sounding choice and it is wrong —
   the point of a preview is that the write is the thing that was previewed.

### 0.8.4 ⚠️ POSITION IS NOT IDENTITY. This round's own near-miss.

`reportData` is sorted **in place** by `renderTable()`, and the reconcile sweep
*finishes by sorting the table by Δ*. The first version of `buildRebuildPlan()`
keyed its moves by the array index the sweep had captured — which means every
correction would have been written to whichever student happened to occupy that
row after the sort. **One child's corrected time, written onto another child's
log, in bulk, with a preview that named the right student.**

It was found by reading the code, not by running anything. Every arithmetic
assertion in this repo would have stayed green through it — which is Jake's
standing point about Round 16 arriving one round later and landing on the same
mistake. Everything that survives a render is keyed by `uid` now and resolved to
an index at the moment of use (`uidIndexMap()`), including at write time, because
clicking a column header between reading the preview and pressing the button is
an entirely ordinary thing to do.

`reconcile-test.mjs` Part B is the regression guard and it is the reason that
file exists.

### 0.8.5 ⚠️ WHAT THE HARNESS DOES NOT COVER. Read this before trusting green.

`tests/reconcile-test.mjs` — 35 assertions, all passing, **five of them
mutation-verified** (un-guard the zero refusal → 3 fail; restore the positional
index → 3 fail; pass `allowZero` from the bulk path → 1 fail; move the `expect`
check after the write → 1 fail; put an `updateDoc` in the read-only half →
1 fail).

It does **not** cover, and no harness in Node ever will:

* whether `firestore.rules` actually permits the sweep for a real staff account
  (rules are not evaluated here — and note that the bulk write needs
  `readsWholeBuilding()`, so a class-scoped teacher's rebuild would be denied.
  The preview detects this client-side and disables the button with an
  explanation, but that check is a client-side guess at a server-side rule);
* that the `⟳` button still works now that `recalcDailyLog()` returns an object
  instead of a boolean (both pre-existing callers ignore the return value, and an
  object is truthy, so this should be inert — *should be* is not *verified in a
  browser*);
* anything whatsoever about a student's tab being open during a rebuild, which
  is the exact failure mode the "not during a period" rule exists for.

**Green here means the refusals are wired up. It does not mean the round is
safe.** Round 16 shipped three defects that each passed a full suite.

### 0.8.6 Costs and ceilings

* `MAX_RECONCILE_PAIRS = 2000` (students × days). Over that it **refuses** rather
  than truncating — same principle as `MAX_REPORT_DOCS`. A reconciliation you
  cannot tell is partial would report an all-clear it has not earned, on the one
  screen whose whole job is to be trustworthy.
* `RECONCILE_CONCURRENCY = 6`. Serial would take about a minute on a week of
  ninety students and Jake would reasonably assume it had hung; all-at-once drops
  connections. Cancellable, and a cancelled run shows **no partial results**,
  because a half-swept table reads exactly like a clean one.
* At Ellis a weekly reconcile is roughly 630 queries and a few thousand document
  reads. Comfortably inside the free tier; it is not free at district scale, and
  the confirm dialog states the cost before running.

### 0.8.7 Honesty affordances — do not "simplify" these away

* The three columns start as **`null`, not `0`**, and render as `—`. "Not
  measured" and "measured, clean" must never look the same. The sort comparator
  sinks nulls in both directions for the same reason.
* Any path that changes a row's total (`⟳`, manual Save, bulk rebuild) **blanks
  that row's reconciliation cells** rather than recomputing them from cached
  session numbers. Recomputing would be arithmetic dressed up as observation.
* After a rebuild the whole panel is replaced with *"reconciliation is now out of
  date"*. A summary reading "14 with a non-zero Δ" above a freshly-repaired table
  is a sentence that was true two seconds ago, which is the most misleading kind.
* Unreadable days render as `unreadable`, are excluded from every count, and are
  called out in red. A failed read must never pass for a clean one.
* CSV export gains the reconciliation columns **only when a sweep has run** — an
  always-present blank column in a spreadsheet that outlives the page is an
  invitation to read "no duplicates found" out of "never looked".

### 0.8.8 Accounting from the previous instance, carried forward deliberately

Round 16's own note, kept because it is the reason this round was scoped the way
it was: *three defects in two days, into a system where Jake is the only tester
and students are the blast radius. The writers were changed before anything
existed to see whether the numbers they produced were right. **That ordering was
the mistake, not the ambition.*** Round 18 built the observation tool and nothing
else. The next round should be very slow to break that ordering again.

---

## §0.7. Round 17 — Linotype

Jake asked for the repository to be organised: the root directory held seventy-nine
entries, most of them files no human ever opens, and the harnesses were interleaved
alphabetically with the code they test.

**⚠️ THE ONE THING TO KNOW ABOUT THIS ROUND: no app code changed.** Not one line of
`game.js`, `learn.js`, `admin.js`, any HTML page, either stylesheet, or anything else
the browser loads. Every version number in §2 is unchanged and still correct. If you
are debugging behaviour and the trail leads to Round 17, the trail is wrong.

**What moved:**

| to | what |
|---|---|
| `tests/` | all 33 harnesses (31 registered, 2 deliberately not), `run-all-tests.mjs`, `TESTING-ttb-test-epubs.md`, plus a new `tests/README.md` |
| `docs/` | `DESIGN-TELEMETRY.md`, `SCALE-PLAN.md`, `TTL-GUIDE.md`, `README-SESSION-LOGGING.md`, `PEDAGOGY-AUDIT.md`, plus `docs/archive/MULTITENANCY.md` and a new `docs/README.md` |
| `tools/` | `audit-versions.mjs`, `build-test-epubs.py`, `build-augie-epub.py`, plus a new `tools/README.md` |
| `firebase/` | `firestore.rules`, `firestore.indexes.json`, `storage.rules` |
| `functions/` | `index.js` — the Cloud Function, which had been sitting directly above `index.html` and is unrelated to it |

**What stayed, and why it had to:** GitHub Pages serves this repo from its root, so
the six HTML pages, the thirteen shipped ES modules, both stylesheets and `library/`
are all exactly where they were. `package.json` stays because npm requires it there.
`README.md`, `HANDOFF.md`, `CHANGELOG.md` and `CNAME` stay because they are the front
door. **Moving any shipped file into a folder breaks the site**, and no amount of
tidiness is worth that.

**What else this turned up** — the useful part, and the reason a reorganisation is
not just cosmetics:

1. **Two harnesses were passing and unwatched.** `sort-test.mjs` and
   `lesson-atomicity-test.mjs` were both green on demand and in neither list in
   `run-all-tests.mjs`, so nothing would have reported the day they stopped. Both
   registered. The suite is 27 fast harnesses now, not 25. This is invariant 39's
   territory: **a test nobody runs is not coverage, and a test nobody *registers* is
   the same thing with better camouflage.**
2. **`@xmldom/xmldom` was never declared.** `cover-harness.mjs` needed it, the old
   `run-all-tests.mjs` header told you to `npm install --no-save` it, and
   `package.json` did not list it — the same class of defect Round 9 fixed for the
   other four packages and this one survived. Declared in `devDependencies` now.
   `cover-harness.mjs` is still not registered, deliberately: it prints a report for a
   human to read and exits 0 regardless, so registering it would add a line that says
   `ok` unconditionally. See `tests/README.md`.
3. **There was no `.gitignore`.** Harmless while Jake deploys from a browser and
   never runs npm — but every Claude session that runs `npm test` creates
   `node_modules/`, and one commit through github.dev would have pushed twenty
   thousand files into a repo GitHub Pages serves. Added.
4. **`MULTITENANCY.md` was never deleted.** Both this file (§9) and `README.md`
   recorded it as gone from Round 14 onward while it sat in the repo root the whole
   time. That is the worst of both states: anyone trusting the note would not open
   the file, and anyone finding the file would not know it was superseded. It is in
   `docs/archive/` now with its original warning header intact. **Deleting it for
   real is Jake's call, not a tidy-up's** — see §9.

### ⚠️ Second pass — three harnesses from a concurrent round

Jake handed over `open-unit-test.mjs`, `session-merge-test.mjs` and
`source-split-test.mjs` from **another instance working on the pages at the same
time**. All three were written test-first: they assert behaviour the shipped repo
does not have. Merged, with three kinds of edit.

**1. Paths.** All three read `./game.js` and friends; they are `../` now, and
`source-split-test.mjs`'s three working-directory-relative reads were converted to
`import.meta.url` like the rest of the folder.

**2. Versions.** `open-unit-test.mjs` **arrived as v1.2.0 with its content already
changed** — the concurrent round moved its `session-log.js` pin from 1.2.1 to 1.3.0
and left the header alone, so two different files were both calling themselves
v1.2.0. Since v1.2.1 was spent on the tests/ move, it is **v1.2.2**. The other two
self-bumped correctly (v1.1.0 and v1.4.0) and both clear the reorg's patch numbers.

**3. ⚠️ `PENDING`, a new third list in `run-all-tests.mjs` (v1.3.0).** Dropping these
into `FAST` would have moved the headline from "1 failing" to "4 failing" — and
invariant 54, plus `README.md`'s own warning, is that an accepted red is precisely
how the next real failure hides. Pending harnesses run, their blockers are printed,
and they **do not count toward `failed`**.

| harness | blocked on |
|---|---|
| `open-unit-test.mjs` | `session-log.js` v1.3.0 — 1 assertion (the version pin) |
| `session-merge-test.mjs` | `session-log.js` v1.3.0 flush serialization — 4 assertions. Part E reproduces the **duplicate-session race of 2026-08-19**: clicking Home fires both `visibilitychange:hidden` and `pagehide`, each calling `flushSessionsNow()` fire-and-forget, and the second read a queue the first had not cleared. |
| `source-split-test.mjs` | `reports.html`'s summing merge + `sessionSignature()`, and `mySourceSeconds`/`logSourceBase` in `game.js`/`learn.js` — 11 assertions. ⚠️ **Historical: all of that was reverted hours later.** The harness is v2.0.0 now, Part C is deleted, and Part A asserts legacy-FIRST reading — the opposite of what this row describes. Kept as written because it records why `PENDING` existed, not what the harness currently checks. See §0.6 item 9. |

**⚠️ THE LIST IS SELF-CLEARING, AND THAT IS THE ONLY THING THAT MAKES IT SAFE.** A
pending harness that starts passing is reported as `LAND` with a capitalised notice,
because passing means the code shipped. **Promote it into `FAST` and delete it from
`PENDING` in the same commit that ships that code.** Verified by simulation, not
assumed: setting `SESSION_LOG_VERSION` to `'1.3.0'` flips `open-unit-test.mjs` to
`LAND` and fires the notice. A harness sitting quietly in `PENDING` is a disabled
test with a nicer name — which is what `chunktest.mjs` was deleted for.

**No app code was changed to make any of this pass.** The three harnesses are the
specification for the concurrent round's work; making them green is that round's job.

### ✅ Third pass — the app code landed, and PENDING emptied itself

Jake delivered `game.js` v3.29.1, `learn.js` v2.14.1, `lessons-admin.js` v1.11.1,
`session-log.js` v1.3.0 and `reports.html` v2.13.2 from the concurrent round. **All
three pending harnesses went green in the same run.** The runner reported `LAND` on
each and printed its notice; all three are promoted into `FAST` in this commit, which
is what the mechanism demands. `PENDING` remains in `run-all-tests.mjs`, empty, as the
documented home for the next test-first harness.

`npm test` → **26 of 27, 0 missing, 0 pending.** Only `metadata-map-test.mjs`.

**⚠️ ONE DEFECT IN THE DELIVERY, CAUGHT BY `audit-versions.mjs`.** `session-log.js`
arrived with `SESSION_LOG_VERSION = '1.3.0'` and a header still reading v1.2.1 — the
tool said *"header comment says v1.2.1 — one of the two is a lie"*, and the problem
count went from the standing 11 to 12. **This is the exact defect class `versions.js`
exists for**, and the same shape Round 6 found in `adventure-renderer.js`, only
inverted: there the constant lagged the code, here the header lagged the constant. The
v1.3.0 entry is written now, derived from the file's own `sessionLogFlush()` comment
block and §0.6 item 8 rather than invented, and marked as a Round 17 repair.
**Verified that nothing executable moved:** every non-comment line is byte-identical to
what Jake uploaded. Back to 11 problems.

**Part C was independently mutation-tested here, not taken on trust** — and the way
that nearly went wrong outlived Part C itself, so it is kept. §0.6 item 7 claimed that
re-introducing the v3.29.0 line makes `source-split-test.mjs` Part C fail. The first
attempt did not fire: the substitution silently missed, because the real line is
`secondsLibrary:  logSourceBase.seconds  + mySourceSeconds` with doubled spaces, and
the string being grepped to confirm the hit already existed *in a comment* a thousand
lines up. **So the confirmation confirmed the documentation, not the mutation, and an
invalid mutation looked exactly like a passing guard.** Re-run against the real
assignment, Part C failed on 2 assertions as claimed.

⚠️ **Part C no longer exists** — the fourth pass reverted the counters it guarded and
`source-split-test.mjs` v2.0.0 deleted it. The finding above is retained anyway,
because it is about verifying a mutation actually applied, which is a technique, not a
fact about that harness. It is the same shape as §0.6's closing lesson: a green result
proves the check ran, not that it checked what you meant.

### ⚠️ Fourth pass — the source split was reverted

`game.js` v3.30.0, `learn.js` v2.15.0, `lessons-admin.js` v1.12.0, `reports.html`
v2.14.0 and `source-split-test.mjs` **v2.0.0** landed. The full reasoning is §0.6 item
9, written by the round that made the call; it is not restated here. What matters for
this document:

- **`session-log.js` stays at v1.3.0.** The flush serialization was explicitly kept —
  it touches no counter. My header repair from the third pass stands, and the file was
  not re-delivered, so nothing about it changed in this pass.
- **`source-split-test.mjs` v2.0.0 is a MAJOR bump**, and it earns one: Part C is
  deleted and Part A's central assertion is **inverted** — legacy-first, not summed.
  A harness whose contract reverses is exactly the case the x-digit is for. It arrived
  as a major from the round that wrote it, so it is not mine to sign off; recorded here
  so it is not mistaken for drift.
- **Three stale references were corrected**, all of them things a green suite would
  never have caught: `run-all-tests.mjs`'s one-line description of the harness still
  advertised "Part C: no split field is fed from the shared cross-mode counter" for a
  Part C that no longer exists, and two passages in §0.7 above described the split as
  landed. **A test description is documentation with no test behind it** — nothing
  asserts it matches the harness, so it rots silently and reads as authoritative.
- **`npm test` → 26 of 27, 0 missing.** `audit:versions` → the standing 11.

**What did NOT get done, and is left flagged rather than improvised:**

- `package.json` still serves two masters — `dependencies` are the Cloud Function's
  (`firebase-admin`, `firebase-functions`) and `devDependencies` are the suite's. A
  fresh `npm install` therefore pulls the whole `@google-cloud` tree to run harnesses
  that never touch it. Splitting it into a root `package.json` and a
  `functions/package.json` is the correct fix and was **deliberately not done**: it
  changes what a deploy would install, and the function is mirrored into the console
  by hand rather than deployed from here, so the blast radius is not verifiable from
  inside the repo. Flagged for Jake.
- `metadata-map-test.mjs` still fails on the same 42 assertions. Untouched — §6.
- `firestore-rules.test.mjs` is still known-wrong. Moved, repointed at
  `../firebase/firestore.rules`, not repaired.

---

## §0.6. Round 16 — Royal

Round 15 (Densmore) shipped the AI-practice variety floor for game.js's ✨
Gemini-practice button and explicitly flagged, rather than fixed, the same gap
in School's own "🎲 Practice missed keys" button (`learn.js`'s
`buildRemediationLinks()`): it already required each letter to clear
`n >= 3` misses, but not that 3 *different* letters clear it, so a single
dominant letter could still produce a synthetic `key_random` drill built from
just that one letter. Jake asked for it to be closed. It is now.

**What shipped this round:**

1. **The remediation variety floor.** New `REMEDIATION_CHAR_MISS_THRESHOLD`
   (3) and `REMEDIATION_MIN_QUALIFYING_CHARS` (3) constants in `learn.js`,
   plus a `_qualifyingRemediationChars()` helper that mirrors game.js's
   `_qualifyingPracticeChars()` exactly — same shape, same numbers, different
   file. `buildRemediationLinks()` now withholds the "🎲 Practice missed
   keys" button's HTML entirely unless at least 3 different letters clear the
   per-letter threshold; the "You often missed: ..." lesson links (which
   point at a real lesson per letter, one link at a time) are untouched,
   since those were never the synthetic-drill risk. **Defense-in-depth**, the
   same shape game.js's `startPracticeMode()` uses: `window._practiceMissedKeys()`
   re-derives the qualifying set from `missedChars` itself and bails if it's
   short, rather than trusting its `missedKeys` argument — so nothing that
   calls it directly, bypassing the button, can skip the check. `learn.js`
   v2.12.0.
2. **De-duplicated the qualifying-chars filter.** Before this round, the
   `n >= 3` filter existed in two places in `learn.js` — once inline where
   `remMissedKeys` was computed for wiring the button's click handler, once
   inside `buildRemediationLinks()` for the display list — with no shared
   source of truth between them. Both now call `_qualifyingRemediationChars()`,
   so the button (when it renders) and the keys it's wired to can't drift
   apart the way two independent copies of the same filter eventually do.
3. **The repair resync — a real incident, not a hypothetical.** Jake's
   week-counter audit (`reports.html`) repaired one student's inflated week
   twice and it came back inflated both times. Root cause: a MacBook that's
   supposed to restart between class periods but sometimes doesn't — the
   browser tab (and its in-memory `statsData`) survives the "restart," still
   holding the pre-repair number, and the very next periodic flush wrote that
   stale number straight back over the fix. The exact mechanism that let this
   happen: `mergeGuestStats()`'s data-loss floor (`Math.max`, never trust a
   decrease — by design, see §3's write-up of the 2026-08-18 doubling bug)
   cannot tell "the number went down because it was lost" from "the number
   went down because it was corrected," so it defends against both, and a
   repair IS a decrease.
   New: `reports.html`'s `repairWeekCounter()` now stamps a plain
   `repairedAt: Date.now()` alongside the corrected fields (not
   `serverTimestamp()` — this only needs to be self-consistent within one
   admin's own repair run, not agree with any client's clock).
   `game.js`/`learn.js` each gained `lastKnownRepairedAt` (captured in
   `loadUserStats()` when `weekStart` matches, reset to 0 on week rollover)
   and `checkForWeekRepair()` — called from `flushAll()`/`flushStats()`,
   *right before* the write that would otherwise clobber a repair. If the
   doc's `repairedAt` is newer than what this session saw at load, it
   resyncs: server's corrected value plus this browser's own contribution
   since baseline, **no floor** — this is the one place the code is
   deliberately allowed to trust a decrease, because the marker is what
   proves it's a correction rather than a loss. One extra `getDoc()` per
   flush that was already about to happen (every ~5 min of active typing, or
   at session end), not one per second. `game.js` v3.28.0, `learn.js`
   v2.13.0, `reports.html` v2.12.0.
   **Has real harness coverage**, unlike items 1–2 above: `session-merge-test.mjs`
   Part D (v1.3.0) lifts `checkForWeekRepair()` out of both files the same
   way Part A already lifts `mergeGuestStats()`, and asserts: a newer repair
   resyncs correctly (server value + this browser's own contribution, no
   floor); the same `repairedAt` seen twice is a no-op, not a re-apply; no
   `repairedAt` on the doc (the common, unaudited case) leaves `statsData`
   untouched; a marker from a different week is ignored; an
   anonymous/signed-out session is skipped without a read or a throw.

⚠️ **NO HARNESS COVERAGE FOR ITEM 1's DOM WIRING** — same caveat Round 15 left:
the button gating itself (`getMissedCharsHTML()`, `buildRemediationLinks()`)
lives inside the `game.js`/`learn.js` monolith and isn't extracted. What IS now
covered, as of item 4 below, is the filter both of them call.

⚠️ **ONE THING THE REPAIR RESYNC DOES NOT COVER**: `mergeGuestStats()` itself
(the re-auth path, on a 24-hour token expiry) does not check `repairedAt` — it
doesn't need to, because `checkForWeekRepair()` runs independently on the very
next qualifying flush regardless of which path got a session into a stale
state, and re-running it against an already-correct `statsData` is a no-op
(Part D's second case asserts exactly this). Not a gap, just worth knowing
`mergeGuestStats()` and `checkForWeekRepair()` are two separate correctness
paths that happen to compose safely rather than one calling the other.

4. **`variety-floor.js` — the fifth shared module.** `_qualifyingPracticeChars()`
   (game.js) and `_qualifyingRemediationChars()` (learn.js) were the same nine
   lines with different names — filter a missed-character map to the ones
   clearing a per-character threshold, sorted worst-first. Both files flagged
   the duplication as worth closing "if this becomes a pattern"; it did, so it's
   closed. `qualifyingChars(missedMap, threshold)` and the convenience wrapper
   `hasVarietyFloor(missedMap, threshold, minQualifying)` now live in
   `variety-floor.js` v1.0.0, imported for real by both files (not lifted —
   it's DOM-free and pure, same reason `hud.js` is importable). Each file kept
   its own threshold constants (`PRACTICE_*` / `REMEDIATION_*` — two separate
   tuning knobs that happen to both be 3/3 today, not one shared constant) and
   every existing call site untouched; `_qualifyingPracticeChars()` and
   `_qualifyingRemediationChars()` are now one-line wrappers. No behavior
   change. `game.js` v3.28.1, `learn.js` v2.13.1.
   **Registered everywhere a shared module has to be**, so this doesn't
   reproduce the exact gap Round 15 found and closed for `hud.js` /
   `session-log.js` / `stats-wal.js`: `versions.js` and `audit-versions.mjs`'s
   `SOURCES` mirrors, `undefined-calls-test.mjs`'s `FILES` list, and
   `run-all-tests.mjs`'s syntax-gate `MODULES` list all now include it.
   **Has real harness coverage**: new `variety-floor-test.mjs` (v1.0.0), 13
   assertions against the real module — empty/null/undefined maps degrade to
   "nothing qualifies" rather than throwing, exactly-at-threshold counts as
   qualifying, worst-missed-first ordering, and `hasVarietyFloor` against
   Jake's original F/J bug report specifically (one dominant qualifying
   character never clears a floor of 3).

`npm test` → 24 of 24 harnesses now (variety-floor-test.mjs is new), 23 passing
— same pre-existing `metadata-map-test.mjs` failure as Rounds 14–15, untouched.
`undefined-calls-test.mjs` now says 13 JS files (was 12) and confirms every
identifier still resolves. `(syntax)` gate: 13 shipped modules, all parse.

5. **THE SOURCE SPLIT — DESIGN-TELEMETRY.md §2.4, the actual bug behind the
   week-counter incident this round started with.** Jake asked directly: "is
   there a D that does what we want, or do I have to risk the cost I don't
   want to?" — the choice was framed as A (full session-derivation: real,
   checked cost, ~$28–150/year, out of Jake's own pocket for a district paying
   him nothing) vs. B (per-source fields, zero added reads) vs. C (ruled out,
   doesn't close the bug). **Landed on B.** `typing_logs` no longer holds one
   shared `seconds`/`chars`/`mistakes` triple that BOTH page controllers wrote
   via `setDoc(merge:true)` from their own independent counters — that's what
   let School-then-Library the same day silently overwrite one mode's
   contribution with the other's, no error, real graded minutes gone. Now:
   `game.js` writes `secondsLibrary`/`charsLibrary`/`mistakesLibrary` (fields
   ONLY it ever touches); `learn.js` writes `secondsSchool`/`charsSchool`/
   `mistakesSchool`. Two independent fields on one document can't clobber each
   other under a merge — the collision is now structurally impossible, not
   carefully avoided. `game.js` v3.29.0, `learn.js` v2.14.0.
   ⚠️ **REQUIRES `firestore.rules` v2.4.0, DEPLOYED FIRST.** The old
   `validDailyLog()` required a legacy `seconds` field on every document — a
   brand-new day's first-ever flush under the new code would be a document
   with ONLY split fields, and the old rule would reject it outright, silently
   (the client catches the failure and logs a console warning; the student's
   time just stops recording that day, with nothing on screen to say so). The
   updated rule accepts either shape, every field optional individually but at
   least one recognized seconds field required, so an empty/garbage document
   still can't pass.
   **Read side**: `reports.html`'s new `readLogTotals(data)` sums both split
   triples when either is present, falling back to the legacy flat fields only
   for documents with neither — the split is authoritative once it exists,
   even at 0, on purpose (a present split of 0 is real information: this mode
   hasn't been used today yet, not "we don't know"). `reports.html` v2.13.0.
   `lessons-admin.js`'s roster panel got the same read-side fix, inline rather
   than shared (no module bridges two standalone pages) — v1.11.0.
   **Not chosen and why**: the fuller §4 proposal (deriving `typing_logs` from
   `typing_sessions` at flush time) closes the SAME bug and also delivers R4
   (delete a session, totals update) — but session records aren't timely yet
   (a student mid-chapter has zero session records for that period), and it
   costs Jake real, ongoing money for a district he isn't paid to support.
   Deferred, not abandoned — R4 is still owed whenever that migration happens.

6. **CONNECTING THE BUTTONS — deletability, today, for $0.** Jake's actual
   question wasn't really A/B/C at all: "I had a kid cheat today. How do I get
   rid of that bad batch?" The tools already existed and cost nothing —
   per-sprint outlier flagging (🚩, already shipped), a delete button on every
   session record, and a "⟳ Recalculate from sessions" button on every day's
   log — they just weren't CONNECTED, so deleting a session left `typing_logs`
   telling the old, inflated story until someone remembered to click recalc by
   hand. `delete-session-btn` now calls `recalcDailyLog()` automatically,
   reading which day to recalculate off new `data-idx`/`data-li`/`data-uid`/
   `data-date` attributes on the sessions-container element (added this
   round). `recalcDailyLog()` itself now writes the source-split fields too —
   computed from each remaining session's own `source` tag via new, PURE
   `splitSessionTotals()` — so a recalculated day migrates to the new shape as
   a side effect of being corrected.
   `allowZero`: the manual ⟳ button keeps its long-standing refusal on an empty
   result ("No sessions found") — usually a pre-v2.4.0 day with real time but
   no session records at all, where zeroing would destroy legitimate old data.
   The delete-cascade passes `allowZero: true`, because it knows for certain a
   session existed a moment ago; an empty result there IS the corrected truth,
   not a failed lookup.
   `save-log-btn` (the fully-manual override) now clears the split fields on
   save — otherwise a stale split sum would silently outrank Jake's hand-typed
   number the next time anyone reads the doc, since the split is always
   authoritative once present. chars/mistakes carry forward unchanged; only
   seconds is the thing being overridden.
   **Has real harness coverage**: new `source-split-test.mjs` (v1.0.0), 12
   assertions lifted straight out of the shipped `reports.html` (same
   technique `week-anchor-test.mjs` uses) — covers `readLogTotals()`'s four
   document shapes (legacy-only, both-split, one-side-split, and the case that
   actually matters: a present split of 0 must outrank a much larger stale
   legacy number) and `splitSessionTotals()`'s session-to-fields arithmetic
   (all-School, all-Library, an untagged session correctly folding into
   Library, empty input, and a malformed session missing chars/mistakes not
   poisoning the sum with NaN).

⚠️ **NOT YET COVERED BY A HARNESS**: `recalcDailyLog()`'s and `save-log-btn`'s
own Firestore read/write calls and DOM updates — only the pure arithmetic
inside them (`splitSessionTotals()`) is tested. The delete → recalc cascade
itself (the actual button-connecting) is UI wiring, same category as the
practice-button gating Round 15/16 also left uncovered, for the same reason:
not asked for, would have meant mocking Firestore and the DOM for a page that
has neither today.

⚠️ **DEPLOY ORDER FOR THIS ROUND MATTERS, FOR REAL, NOT JUST BY CONVENTION**:
`firestore.rules` v2.4.0 FIRST. Uploading `game.js`/`learn.js` before the rule
change is live means every student's next new-day flush gets silently
rejected — the exact failure mode the v2.3.0 "NO keys().hasOnly()" note in the
rules file already warned about, now actually possible for a different reason.

7. **⚠️ ITEM 5 SHIPPED BROKEN AND WAS FIXED THE SAME DAY — READ THIS ONE.**
   Jake deployed the source split, typed in School and then Library, and looked
   at the report. It was wrong, and the way it was wrong is the most important
   thing in this document.
   **The defect**: `game.js` wrote `secondsLibrary: statsData.secondsToday`.
   But `statsData.secondsToday` comes from `users/{uid}/stats/time_tracking` —
   a counter BOTH page controllers read, increment, and write back. It has
   never been per-mode. So the "Library" field was receiving the COMBINED day
   total, and `learn.js` wrote that same combined total into the "School"
   field. **Two disjoint field names fed from one shared number is not a
   split.** It reads plausibly right up until both modes touch one day, at
   which point `readLogTotals()` sums two overlapping numbers and inflates.
   The whole point of the change was that the two sides can't contaminate each
   other, and the wiring reintroduced exactly that.
   **The fix (`game.js` v3.29.1 / `learn.js` v2.14.1)**: per-page counters
   `mySourceSeconds`/`mySourceChars`/`mySourceMistakes`, incremented ONLY at
   the three sites that increment `statsData.*Today`, counting only what THIS
   page typed since THIS page loaded — deliberately NOT routed through
   `statsBaseline` or `mergeGuestStats()`, which exist to reconcile a shared
   counter and are the very machinery that went wrong. Plus
   `loadLogSourceBase()`, which reads what this mode had already recorded today
   (ONE document read at page load, not per flush) so a student returning for a
   second Library session the same day doesn't erase the first. The flush
   writes `base + mine`, which is idempotent — re-flushing writes the same
   value rather than accumulating. Both reset on midnight rollover alongside
   the counters they travel with.
   **`readLogTotals()` also corrected (`reports.html` v2.13.1,
   `lessons-admin.js` v1.11.1)**: v2.13.0 returned the split sum ALONE whenever
   either split field existed. Jake watched his morning's School time vanish
   from the report the moment the afternoon's Library session wrote a split
   field — that morning had been recorded by pre-split code as flat `seconds`.
   The legacy field is now SUMMED with the splits, which is correct because the
   two shapes describe disjoint periods: `seconds` can only have been written
   by pre-split code, and the per-page counters start at zero on page load so
   the splits never re-include anything the old code already recorded. Both
   repair paths preserve this: `recalcDailyLog()` deletes the legacy fields
   when it writes splits, `save-log-btn` deletes the splits when it writes a
   manual flat total.
   **Guarded structurally** — `source-split-test.mjs` v1.1.0 Part C asserts the
   shared counter never appears on the right-hand side of a split field, that
   the per-page counter is actually incremented, and that it sits with
   `statsData.secondsToday++` rather than somewhere else. This is weaker than
   an arithmetic test (the flush is far too entangled with Firestore and the
   DOM to lift the way Part A lifts `readLogTotals()`) but it was
   **mutation-tested**: re-introducing the v3.29.0 line makes Part C fail. Note
   the guard strips comments first — both files necessarily quote the bad line
   verbatim while explaining it, and the guard fired on the documentation on
   its first run.
   **The lesson for whoever is next**: the round that shipped this also shipped
   a harness, ran a clean suite, and reasoned carefully in a long comment — and
   was still wrong, because every test written was a test of the *arithmetic*
   and the defect was in *which variable was handed to it*. A green suite
   proves the code does what its author thought; it cannot prove the author
   understood the data. Jake's thirty-second manual check found in one try what
   25 harnesses missed. **When a change touches a counter, trace where the
   number comes from, not just what is done to it.**

8. **THE DUPLICATE SESSION — a race the code had explicitly argued was
   impossible.** Jake typed one 23-second Pinocchio run, clicked Home, and
   Reports showed TWO identical rollups: same timestamp, same 182 characters,
   same sprint, both labelled "left page".
   **The cause**: `sessionLogFlush()` removes records from the local queue only
   AFTER `await _addDoc(...)` resolves — a full network round trip. Clicking
   Home fires BOTH `visibilitychange:hidden` and `pagehide`, and each calls
   `flushSessionsNow()` fire-and-forget, unawaited. The second call ran while
   the first was still in flight, read a queue nobody had cleared yet, and
   wrote the same record again.
   ⚠️ **`flushSessionsNow()`'s own header asserted this could not happen** —
   "it is self-limiting: records are removed from the queue as they land."
   That is true sequentially and false concurrently, and it had been written
   down confidently enough that nobody re-examined it. A comment claiming
   safety is not a guard.
   **The fix (`session-log.js` v1.3.0)**: flushes are serialized on a promise
   chain inside the module that owns the queue — not in the callers, because
   there are four call sites across two files, two of them deliberately
   unawaited on navigation paths, and any future caller would inherit the same
   trap. Callers wait their turn rather than being dropped: a caller arriving
   mid-flush may carry records the in-flight run never saw.
   **Mutation-tested.** `session-merge-test.mjs` Part E (v1.4.0) pushes one
   record, fires two unawaited flushes exactly as the real handlers do, and
   asserts one document is written. Defeating the serialization makes it report
   `got 2` — Jake's duplicate, reproduced. The stub `addDoc` used elsewhere in
   that file resolves instantly and CANNOT reproduce this; Part E's is
   deliberately slow, because the window only exists across a real await.
   **The already-written duplicates are still in the database**, and
   `recalcDailyLog()` grades from `typing_sessions` — so a duplicate would
   inflate the very day a repair is trying to correct, which matters more now
   that the post-delete recalc fires automatically. `reports.html` v2.13.2 adds
   `sessionSignature()` (sprint instants, not totals — two genuine sessions can
   coincidentally share seconds and characters); the recalc ignores duplicates
   arithmetically while the drill-down MARKS them "⧉ duplicate" rather than
   hiding them, since Jake needs to see one to delete it and a silently
   collapsed view would contradict the run count beside it.

9. **⚠️ THE SOURCE SPLIT WAS REVERTED. READ THIS BEFORE RE-ATTEMPTING IT.**
   Items 5 and 7 above describe a fix that was shipped, found broken in live
   use, re-fixed, and then **backed out entirely** the same evening. Final
   state: `game.js` v3.30.0 and `learn.js` v2.15.0 write the flat
   `seconds`/`chars`/`mistakes` triple exactly as v3.28.1 / v2.13.1 did.
   **DESIGN-TELEMETRY.md §2.4 is once again an OPEN, KNOWN defect** — two page
   controllers still overwrite each other's daily total — rather than a
   half-landed fix.
   **Why reverted rather than fixed forward.** The v3.29.1 per-page counters
   are, as far as I can tell, correct. But the round had by then produced two
   student-visible defects in two days, every one found by Jake in live use
   rather than by any harness, and he had one evening before students arrived.
   Shipping a third counter change overnight, unverified in production, was
   the same gamble that had already lost twice. Reverting to a defect he has
   lived with for months was the lower-variance choice. **That reasoning is
   about the calendar, not the code** — if you are reading this with time to
   test properly, the v3.29.1 approach (per-page counters + a base read once at
   load) is where to start, and it is in git history.
   **Read side follows the write side**: `reports.html` v2.14.0 and
   `lessons-admin.js` v1.12.0 read LEGACY-FIRST. Summing the two shapes
   (v2.13.1) would now double-count any day still carrying split fields from
   the hours the split was deployed, because the flat number is already the
   whole combined day. Split fields are read only for a day with no flat
   number at all — those exist, and would otherwise read as zero. They heal on
   the next flat write, and ⟳ rewrites them flat outright.

⚠️ **WHAT WAS KEPT, AND WHY IT IS SAFE.** The revert covers the counter/write
path only. These all survive because none of them can corrupt a number — they
only read or repair:
   - **The delete → recalc cascade** (`reports.html`): deleting a cheated
     session automatically rebuilds that day. This was the thing Jake actually
     asked for, and it works.
   - **Duplicate detection** (`sessionSignature()`): ⟳ ignores duplicate
     rollups arithmetically, and the drill-down marks them `⧉ duplicate`.
   - **The flush serialization** (`session-log.js` v1.3.0): correct in itself
     and touches no counter. See the caveat below.
   - **The week-repair resync** (`game.js` v3.28.0 / `learn.js` v2.13.0):
     tested, and it fixes a repair that provably would not stick.
   - **`variety-floor.js`** and the remediation floor: no data path at all.

⚠️ **AN OPEN QUESTION THE REVERT DOES NOT ANSWER.** After `session-log.js`
v1.3.0 was deployed, a THIRD identical 4:55 PM rollup appeared where there had
been two. Serialization prevents two concurrent flushes writing the same
record; it does NOT prevent a record being re-sent by a LATER page load if the
queue-clearing `localStorage` write never persisted because the page was being
torn down. That is the leading hypothesis and **it is not proven** — do not act
on it without evidence. The durable fix, if it holds up, is a DETERMINISTIC
document id derived from `(uid, date, source, label, first sprint instant)` and
`setDoc` instead of `addDoc`, which makes a re-send overwrite rather than
duplicate and makes n-1 self-healing. **That needs a `firestore.rules` change
to allow owner update on `typing_sessions`, which today only allows create** —
get that wrong and sessions stop recording silently.

⚠️ **THE PATTERN ACROSS THIS WHOLE ROUND, FOR WHOEVER IS NEXT.** Three
defects shipped green: the shared-counter split, the legacy-drop on read, and
the flush race. Every harness written passed. Every one of them tested
ARITHMETIC — does this function compute the right number from these inputs —
and every defect was in CHOREOGRAPHY: which variable got handed in, which
handler fired twice, what the browser does at page death. **There is still no
end-to-end harness that simulates the exit sequence** (`visibilitychange` then
`pagehide`, slow network) and asserts a record lands exactly once. That harness
is worth more than the next feature. Until it exists, Jake is the integration
test, and that is not an acceptable place to leave him.

⚠️ **WHY THE WEEK-COUNTER AUDIT DID NOT CATCH THIS, AND WAS NEVER GOING TO.**
The audit compares `typing_logs` daily sums against the week counter in
`stats/time_tracking`. It never reads `typing_sessions` at all. The two
collections are written on the same trigger but audited by nothing in common,
so a duplicate rollup is invisible to every automated check in the project —
it showed up only because a human looked at the drill-down. There is no
sessions-vs-logs reconciliation anywhere. That is the largest remaining
unaudited surface, and it is the thing to build next if numbers go wrong again.

⚠️ **KNOWN, ACCEPTED, NOT FIXED**: two tabs of the SAME mode open at once
still race — both read the same base, and the last flush wins, losing the
other's contribution. This is pre-existing (the shared-field code had it too),
it is not made worse here, and closing it means either a read per flush or
Firestore `increment()` with the double-count-on-retry risk the WAL exists to
avoid. The ⟳ recalc-from-sessions button rebuilds any day this damages.

`npm test` at the close of Round 16 → 25 of 25 harnesses, 24 passing, same
pre-existing `metadata-map-test.mjs` failure. ⚠️ **That denominator is historical.**
Round 17 reorganised the repo and re-counted; see §0.7 for the number to use now.

---

## §0.5. Round 15 — Densmore

James Densmore financed Sholes's machine and, by every account, was the reason it
ever worked at all: he kept sending prototypes back with the same demand — *does
it actually do the thing, or does it just look like it does?* That's this round.
Round 14's HUD fix (v3.26.2, the entry directly below) shipped with tests green
and a HANDOFF paragraph explaining exactly why it worked. It didn't. The seed
paint it introduced was overwritten one line later by the very call it was
supposed to precede, and a second paint the init handler's own comment claimed
existed had been deleted at some earlier point without the comment going with
it. Both defects were invisible from inside `game.js` — each line was locally
correct — and invisible in the test suite, because `open-unit-test.mjs` Part E
checks for a second *increment* site, not a repaint that never fires. Only
Jake, watching the actual page, caught it.

**What shipped this round:**

1. **The real HUD fix.** The cache-fallback that used to be a one-shot block in
   `loadChapter()` now lives *inside* `updateTimerUI()` itself, so every caller
   gets it — the same shape `learn.js`'s `renderTimeHUD()` already had, and the
   reason School never had this bug. The missing post-`loadGoals()` repaint is
   restored. `game.js` v3.26.3. See §3.5 amendment below.
2. **The version footer redesign**, both student pages. `#footer-primary` shows
   this page's html/js/css triad, always, no click required. `#footer-full` is
   everything else — every file `versions.js`'s `SOURCES` knows about, hud.js
   and session-log.js and stats-wal.js included — on hover, or tap-to-pin on
   touch. Reuses `readDeployedVersions()`/`renderBuildList()` exactly as
   `index.html`'s build-info button already did; nothing new was invented.
   `game.js` v3.27.0, `learn.js` v2.11.0, `versions.js` v1.7.0, `style.css`
   v3.5.4. `game.html` and `learn.html` are now versioned themselves (v1.0.0
   each), the same way the stylesheets are — a comment near the top, parsed by
   `versions.js`. Built because Jake, debugging the HUD bug, had no way to see
   which `hud.js` was actually deployed — this is the fix for that blind spot,
   not a cosmetic add-on.
3. **`audit-versions.mjs` closed a three-module gap against `versions.js`** it
   should never have had — `session-log.js`, `stats-wal.js` and `hud.js` were
   missing from its `SOURCES` mirror since the round each was added there.
   Found while adding the two new html entries. v1.1.0.
4. **The AI-practice variety floor.** A student had missed "F" and "J" —
   really just F, in any quantity that mattered — and the ✨ Practice button's
   Gemini paragraph came back so F-heavy it was trivially fast and accurate to
   type: free banked time, not remediation. `game.js`'s
   `getMissedCharsHTML()`/`startPracticeMode()` now require
   `PRACTICE_MIN_QUALIFYING_CHARS` (3) DIFFERENT characters, each missed at
   least `PRACTICE_CHAR_MISS_THRESHOLD` (3) times, before the button offers or
   the call fires — mirrors the `n >= 3` per-character convention
   `learn.js`'s `buildRemediationLinks()` already used, adds the missing
   distinct-count floor on top. **Enforced server-side too**, in
   `index.js`'s `generatePractice()` — deduplicated exact-match count of
   `problemChars` must clear the same floor, because the callable is reachable
   directly from devtools regardless of what the button does. ⚠️ **While
   fixing this, found and fixed a real ordering bug**: input validation used
   to run *after* the daily-limit transaction reserved a slot, so a rejected
   request burned one of the student's 5 daily sessions for nothing. Moved
   validation first. `game.js` v3.27.1, `index.js` v1.7.0.
   
   **Not yet done, flagged for Jake:** School's own "🎲 Practice missed keys"
   (`learn.js`'s `buildRemediationLinks()`) has the same shape of gap — it
   already requires `n >= 3` per letter but not 3 *different* qualifying
   letters, so a single-letter synthetic drill is still reachable there.
   Different risk profile (a random-key drill, not an AI essay one common
   letter can dominate), so left alone rather than changed without being
   asked.
5. **The HUD long-form clip.** `hud.js`'s combined Sprint+Daily form
   ("Sprint 29:59 / 30:00 (Daily 119:55 / 120:00)") runs 40+ characters and
   was silently hard-clipping at `.hud-section.left`'s boundary — no ellipsis,
   no way to see what was cut, because `#hud-time` had no overflow handling of
   its own. `hud.js` now returns `long: showSprint` (v1.2.0); `game.js` and
   `learn.js` use it to toggle a `.hud-time-long` class (smaller font) and set
   a `title` attribute (full-string tooltip) on `#hud-time`. `style.css`
   (v3.5.5) makes `#hud-time` the designated shrinker, same pattern
   `#hud-lesson-label` already used, and pins `#trophy-btn` /
   the new `#hud-back-link` id against shrinking so they're never what gives.
   ⚠️ **Considered and rejected: a real second line.** `style.css`'s own
   header carries three rounds of hard-won bugs (v3.5.1–v3.5.3) from this
   exact bar wrapping — reopening variable height for this felt like the
   wrong trade against a safer fix that solves the actual complaint (silent,
   invisible clipping) without touching `#hud`'s fixed 60px height at all.
   `game.js` v3.27.1, `learn.js` v2.11.1, `hud.js` v1.2.0, `style.css` v3.5.5,
   `game.html` v1.1.0. Pin update: `hud-test.mjs` v1.1.0, new B-section
   assertions for the `long` flag.

⚠️ **NEW LOGIC THIS ROUND HAS NO HARNESS COVERAGE.** Items 4 and 5's DOM-level
wiring (`getMissedCharsHTML()`'s button gating, the `.hud-time-long` class
toggle) live inside `game.js`/`learn.js`'s monolith and aren't extracted into
a testable pure module the way `hud.js`/`session-log.js` are. `hud-test.mjs`
covers the new `long` flag itself (it's pure, in `hud.js`), and
`index.js`'s server-side variety floor is at least type-checked by
`node --check`, but nothing exercises the actual gating logic end to end. If
this becomes a pattern worth trusting, it's a candidate for extraction next
round — not done here because it wasn't asked for and would have widened this
round's diff considerably.

⚠️ **A LESSON FOR THE NEXT ROUND, NOT JUST A LOG LINE.** A comment describing
what a function call does is not evidence the call exists. Both defects this
round fixed were paired with prose that correctly described the *intended*
behaviour and shipped anyway, because nobody re-read the code next to the
comment after editing one side of it. When a fix is "restore a call the
comment says should be here," grep for the call before writing the comment
that explains it — the grep is the whole test.

`npm test` → still 23 of 24 harnesses pass; same pre-existing `metadata-map-test.mjs`
failure as Round 14, untouched. `hud-test.mjs` and `open-unit-test.mjs` Part E
both still pass — no second increment site, no formatter drift.

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

Shipped state after Round 18, 2026-08-19. **Verified against the repo, not copied from
the previous table** — three consecutive rounds carried a stale version for `admin.js`.
Run `npm run audit:versions`; do not trust this table either. **Round 17 moved
files but changed no code.** **Round 18 changed exactly one line of this table
(`reports.html`) and nothing else — every other version below is unchanged since
Round 16.**

| file | version |
|---|---|
| `game.js` | 3.32.0 — ⚠️ Round 19 Stage 2 |
| `learn.js` | 2.17.0 — ⚠️ Round 19 Stage 2 |
| `session-log.js` | 1.4.0 — ⚠️ Round 19. ⚠️ Its THREE version pins moved with it |
| `hud.js` | 1.2.0 |
| `variety-floor.js` | 1.0.0 |
| `stats-wal.js` | shared module — check the constant |
| `versions.js` | 1.9.0 — ⚠️ Round 19 |
| `daylog.js` | 1.1.0 — ⚠️ **NEW, Round 19.** The shared week reader AND the Stage 2 projection. §0.0 |
| `keyboard.js` | 1.1.1 |
| `adventure-renderer.js` | 1.5.4 |
| `admin.js` | 3.31.1 — ⚠️ Round 19: two real import-metadata defects, see §6 item 3 |
| `lessons-admin.js` | 1.12.0 |
| `staff-admin.js` | 2.2.0 |
| `reports.html` | 2.16.0 — ⚠️ Round 19: week-counter audit and repair DELETED |
| `update-gate.js` | 1.0.1 — ⚠️ NEW in Round 19. Loaded by its own script tag in both shells, NOT imported. See §0.10 |
| `index.html` | 3.9.0 — ⚠️ Round 19 Stage 1 |
| `firebase-config.js` | 1.2.0 |
| `firebase/firestore.rules` | 2.5.0 — ⚠️ Round 19. Owner-read on typing_logs + typing_sessions. **Jake confirmed live 2026-08-19.** See §0.0.2 |
| `style.css` | 3.5.5 |
| `game.html` | 1.2.0 — ⚠️ Round 19 added the update-gate script tag |
| `learn.html` | 1.1.0 — ⚠️ Round 19 added the update-gate script tag |
| `functions/index.js` | 1.7.0 — Cloud Function, NOT deployable from this repo; Jake mirrors it into the console by hand. See its own header. Moved out of the root in Round 17; the file is byte-identical. |

`npm test` → ⚠️ **ALL 29 HARNESSES PASS, 0 PENDING.** Round 19 added
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
