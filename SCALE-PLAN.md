# TypeThatBook — Scaling to 7,000 Students

<!-- SCALE-PLAN.md v1.3.0 -->
<!-- v1.3.0 — Round 6 (Noiseless): recovered from outside the repo and committed.
              Status corrections only — no number, assumption or piece of
              arithmetic was altered, because the cost model is the value here and
              it exists nowhere else.
              THREE things had gone stale and one of them was dangerous:
                · Problem 4 (reports class filter) has SHIPPED — reports.html 2.8.0
                  uses exactly the query shape proposed here. Marked ✅.
                · The Security section said "no rules in this repo." There are now
                  firestore.rules v2.2.0 and storage.rules v2.1.0, both committed.
                  Left in place but re-headed, because a reader hitting a red
                  SECURITY heading claiming no rules exist will either panic or
                  start rewriting something that is already done.
                · "Security rules + custom claims" in the suggested order: the
                  CLAIMS half was tried and abandoned. firestore.rules v2.0.0 moved
                  roles into Firestore documents precisely because claims need the
                  Admin SDK, which needs a terminal, which this project does not
                  have. See MULTITENANCY.md's Round 6 header.
     v1.2.0 — Problems 2 and 3 shipped.
     v1.1.0 — Problem 1 SHIPPED in game.js v3.3.0. Numbers re-run against the
              actual implementation. Writes are now the remaining line item. -->

> ## ⚠️ Read this before the rest of the file
>
> **The load model, the arithmetic and the per-block read/write counts are still
> good and are the reason this document was worth recovering.** They exist nowhere
> else. Problems 1, 2 and 3 shipped as described.
>
> **What is out of date:** Problem 4 has since shipped (marked below). The Security
> section's premise — that the repo contains no rules — is false as of
> `firestore.rules` v2.0.0, and its recommendation of Auth custom claims was
> explicitly rejected in favour of Firestore role documents. Read the header comment
> at the top of `firestore.rules` for the model that actually shipped.
>
> **What was never verified:** every per-day total. They rest on assumptions about
> student behaviour, as the Summary says. Check the Firestore Usage tab against a
> real week before treating any of it as measured.

**Question asked:** can this handle 7,000 students over a year — peaking around 467
simultaneous — without costing money?

**Answer:** yes, and it isn't close. But the code as written would cost about
**$34,000 a school year**, and 99.9% of that came from one function.

> ### Status: Problems 1, 2 and 3 are fixed
> `game.js` **v3.3.0** fixed the leaderboard; **v3.4.0** plus `learn.js` **v1.1.0**
> fixed the write storm and the storage growth.
>
> **$34,404/yr → about 30 cents/yr.** Reads at **58%** of free tier, writes at
> **105%**. Problems 4–5 and security remain.

---

## Load model

Assumptions, stated so they can be argued with:

| | |
|---|---|
| Total students/year | 7,000 |
| Trimesters | 3 → ~2,335 students per trimester |
| Periods/day | 5 → **467 simultaneous** at peak |
| Students touching Firestore per day | ~2,335 |
| Typing block | 10 minutes |
| Sprint length | 30 seconds (the default) → **20 sprint-ends per block** |
| Characters typed | ~1,500 at 30 WPM → ~25 sentence-ending punctuation marks |
| School days | 175 |

Firestore free tier (daily, resets midnight Pacific): **50,000 reads · 20,000 writes ·
20,000 deletes · 1 GiB storage · 10 GiB egress per month.**
Blaze overage: **$0.06/100k reads · $0.18/100k writes · $0.02/100k deletes.**

You are on Blaze already — Cloud Functions requires it. That means overages **bill
silently** rather than cutting you off. That's the risk that matters.

---

## ✅ Problem 1 — the leaderboard read the entire collection, twenty times per student, per block

> **Fixed in `game.js` v3.3.0.** Description kept for the record; what actually
> shipped is documented at the end of this section.

This is the whole ballgame. `game.js` line 3902:

```js
async function fetchLeaderboard() {
    // Cache for 30 seconds
    if (Date.now() - leaderboardCacheTime < 30000 && ...) return leaderboardCache;
    const snap = await getDocs(collection(db, "leaderboard"));   // ← every document
```

It pulls **every leaderboard document** to compute four top-10 lists. At 7,000
students that's 7,000 document reads to find 40 rows.

And the 30-second cache doesn't save you, because `updateLeaderboard()` deliberately
destroys it three lines before calling in (line 3880):

```js
    leaderboardCacheTime = 0; // bust cache
    const allData = await fetchLeaderboard();
```

`updateLeaderboard()` is called from `pauseGameForBreak()` — **every sprint end.**
At the default 30-second sprint, that's 20 full collection scans per student per
ten-minute block.

```
467 students × 20 sprints × 7,000 docs =  65,380,000 reads per class period
                              × 5 periods = 326,900,000 reads per day
```

Against a 50,000/day free tier. At $0.06/100k that is **$196/day**, or **$34,300 a
school year** — from this one line.

The egress is arguably worse. Each scan ships ~250 bytes × 7,000 docs ≈ 1.75 MB down
the wire. Across a day that's **~82 GB**, against a free tier of 10 GiB *per month*.
You'd exhaust the monthly egress allowance in the first three hours of the first
Monday, on your school's wifi, 467 devices at once.

### Fix

Firestore can do the sort server-side. You only ever display the top 10:

```js
import { query, orderBy, limit, where } from ".../firebase-firestore.js";

async function fetchLeaderboard() {
    // 10-minute cache, and DO NOT bust it
    if (Date.now() - leaderboardCacheTime < 600_000 && Object.keys(leaderboardCache).length) {
        return leaderboardCache;
    }
    const result = {};
    for (const cat of LB_CATEGORIES) {
        const q = query(
            collection(db, "leaderboard"),
            where("leaderboardOptOut", "==", false),
            orderBy(cat.key, "desc"),
            limit(10)
        );
        const snap = await getDocs(q);
        result[cat.key] = snap.docs.map(d => ({ ...d.data(), uid: d.id }));
    }
    leaderboardCache = result;
    leaderboardCacheTime = Date.now();
    return result;
}
```

**40 reads instead of 7,001 — a 175× reduction.** Requires four composite indexes
(`leaderboardOptOut` ASC + `<category>` DESC). Firestore will hand you the exact
console links the first time each query runs; click them once and you're done.

Then stop re-fetching on every sprint. Placement is computable locally: after writing
the student's own entry, compare their new score against the cached 10th-place value.
Same answer, zero reads.

Two more things to change while you're in there:

- **`leaderboardOptOut` must exist on every document.** `where("...", "==", false)`
  silently excludes docs where the field is missing. Backfill it, and write it
  explicitly on create.
- **Stop storing `displayName` in leaderboard docs.** The doc already carries
  `initials`, which is what the UI shows. `displayName` is the student's real name
  from their Google account, and the leaderboard collection is read by every student
  in the building. Dropping the field is a one-line change that removes the exposure
  entirely — cheaper than trying to write rules around it.

---

### What shipped (v3.3.0)

Four changes, all inside `game.js`:

1. **Four `orderBy` + `limit(15)` queries** replace the collection scan, filtered
   and sliced to 10 on the client. Over-fetching five rows means opt-outs and
   documents missing the `leaderboardOptOut` field are handled client-side — so
   three of the four categories need **no composite index at all** (Firestore
   auto-indexes every single field descending).
2. **Cache raised to 10 minutes and no longer busted on the hot path.** The two
   remaining `leaderboardCacheTime = 0` sites are the opt-out toggle and the admin
   reset button — both rare, both correct.
3. **Placement computed locally.** `couldPlace()` checks the student's score
   against top-10 cutoffs persisted in `localStorage`. In a school of thousands,
   most students most sprints aren't near the board, so the common case costs
   **zero reads**. Thresholds only drift upward, which makes a stale one
   conservative: it can miss a celebration, never invent one. `computePlacements()`
   then ranks against the cached lists with no network call.
4. **Own doc read once per session** (was once per sprint) and **writes coalesced**
   to ≥120s apart, flushed immediately on a genuine personal best and on
   `visibilitychange: hidden`.

Plus `displayName` is no longer written to leaderboard docs. It was written but
never read — the UI has always shown `initials`. Real names for the admin panel
live in `typing_logs` / `typing_sessions` and were not touched.

**Measured, one 10-minute block, one student:**

| | before | after |
|---|---|---|
| Leaderboard reads | 140,020 | 9 |
| Leaderboard writes | 20 | 6 |

### The one index you need

The weekly board is the only category needing a server-side filter — a student who
typed a lot last week keeps a large `totalSecondsWeek` until they type again, so
ordering alone would surface stale rows.

```
Collection: leaderboard
  weekStart          Ascending
  totalSecondsWeek   Descending
```

Firestore prints a one-click create link to the browser console the first time the
query runs. **You don't have to create it before deploying** — `fetchWeeklyRows()`
catches the failure and falls back to a wider unfiltered fetch with client-side
week filtering. Degraded (a quiet week can look sparse), never broken mid-class.
The console warning names the index explicitly.

### Testing it

1. Open the trophy panel. All four tabs should populate as before.
2. Open devtools → Network, filter to Firestore, and type through several sprints.
   Sprint-ends should be near-silent — no repeated bursts of document traffic.
3. Check the console for the weekly-index warning; if present, click through to
   create the index and reload.
4. Confirm a genuine personal best still triggers the placement celebration.
5. Toggle leaderboard opt-out and confirm the student disappears from the board.

---

## ✅ Problem 2 — `saveProgress()` fired three writes per sentence

> **Fixed in `game.js` v3.4.0 / `learn.js` v1.1.0.** What shipped is at the end
> of this section — it differs from the plan below in one important way.

`game.js` line 1208:

```js
if (['.', '!', '?', '\n'].includes(targetChar)) saveProgress();
```

Every period, exclamation point, question mark, and newline. And `saveProgress()`
does three separate document writes (lines 1511, 1521, 1526):

1. `users/{uid}/progress/{bookId}` — cursor position
2. `users/{uid}/stats/time_tracking` — day/week totals
3. `typing_logs/{uid}_{date}` — the daily rollup for reports

~25 sentences per block × 3 = **75 writes**, plus 20 leaderboard writes and 20
`typing_sessions` docs from sprint-ends. Call it **115 writes per student per block**.

```
2,335 students × 115 = 268,500 writes/day  vs. 20,000 free  →  ~$80/year
```

Not the crisis the leaderboard is, but it's 13× over the free tier and it's pure
waste. Writes #2 and #3 are **rollups** — they only need to be correct when someone
looks at them. Writing them mid-sentence buys nothing.

### Fix — flush, don't stream

Keep everything in memory and localStorage. Write on a schedule and on the events
that actually matter:

```js
let flushTimer = null, dirty = false;

function markDirty() {
    dirty = true;
    if (!flushTimer) flushTimer = setTimeout(flush, 120_000);  // 2-min backstop
}

async function flush() {
    clearTimeout(flushTimer); flushTimer = null;
    if (!dirty || !currentUser || currentUser.isAnonymous) return;
    dirty = false;
    // ...one batched write, see below
}

// Real save points
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();   // tab switch, app close
});
```

`visibilitychange → hidden` is the important one. It's the only lifecycle event that
fires reliably on mobile and on tab close; `beforeunload` does not. Every save point
that matters — bell rings, kid closes the Chromebook, kid switches tabs — routes
through it.

Then replace `saveProgress()` on line 1208 with `markDirty()`. Position is still
durable to within two minutes, and a student who crashes loses at most a couple of
sentences of cursor position — which they retype in seconds.

Also fold `saveCompletedChapters()` (line 1543) into the same write. It targets the
*same document* as save #1, so it's a second billable write for no reason.

### Merge the two rollup docs

`users/{uid}/stats/time_tracking` and `typing_logs/{uid}_{date}` store overlapping
data — `secondsToday`, `charsToday`, `mistakesToday` live in both. Firestore bills
per *document*, not per field, so two docs is literally double the cost of one.

Collapse to a single `typing_logs/{uid}_{date}` carrying both the day and week
fields. `reports.html` already queries this collection, and `game.js`/`learn.js`
already read the stats doc once at load — same read, different path.

That drops the per-student daily budget to about **7 writes**:

| | writes/student/day |
|---|---|
| progress doc (flushed) | ~3 |
| merged daily log | ~2 |
| leaderboard (only on a genuine personal best) | ~1 |
| session rollup (see Problem 3) | ~1 |
| **total** | **~7** |

```
2,335 × 7 = 16,345 writes/day   →  82% of the free tier
```

---

### What shipped (v3.4.0 / v1.1.0)

The plan above said "flush, don't stream." What actually shipped is better than
that, and the difference matters:

**A localStorage write-ahead log.** Every sentence still records *everything* —
position, time, characters, mistakes, sprint history — synchronously, to
localStorage. That's the durable copy and it costs nothing. Firestore gets a
batched flush every 5 minutes and on session end. On next load, `walRecover()`
compares the local log against what Firestore has and replays anything unflushed.

**This is strictly more durable than the code it replaced.** The old version lost
everything typed since the last punctuation mark if the tab died. The WAL loses
nothing — including across a dead battery, a closed lid on a network blip, or a
Chromebook that just gives up. Verified with a 15-case harness covering hard
crash, offline-then-reconnect, and stale-log-from-a-different-book.

Also in this release:

- **progress + completedChapters merged into one document.** They were two
  billable writes to the *same* doc.
- **Chapter advance does one write instead of two** (it flushed the old position,
  then immediately wrote the new chapter).
- **Chapter text cached in localStorage** — the biggest per-load read, and book
  content is immutable once authored. Invalidated by a `contentVersion` bump on
  the book, with a 7-day fallback expiry and quota-exceeded handling.
- **Goals / class / school cached for a day** — was 2-3 reads on every page load.
- **Leaderboard write cadence raised to 5 minutes** to match the flush interval.
  The board is cached for 10 minutes, so writing more often bought nothing.

**What did NOT ship, deliberately:** merging `stats/time_tracking` into
`typing_logs`. It would save about one write per student per day and take writes
from 105% of the free tier to roughly 95%. It also requires a data migration over
every existing student. **Not worth a real migration risk to save a dollar a
year** — but it's the lever if you ever need the headroom.

| | v3.2.0 | v3.3.0 | **v3.4.0** |
|---|---|---|---|
| Reads/day | 326,960,710 | 35,025 | **28,954** (58% of free) |
| Writes/day | 268,525 | 235,835 | **21,015** (105% of free) |
| Cost/year | ~$34,404 | ~$68 | **~$0.32** |

---

## ✅ Problem 3 — `typing_sessions` grew without bound

> **Fixed in `game.js` v3.4.0.** One rollup document per session with a
> `sprints[]` array, instead of one document per sprint: **8.17M docs/year →
> ~409k**. Each doc now carries an `expiresAt` timestamp 120 days out.
>
> **You still need to enable the TTL policy** — Firestore console → Firestore →
> Time-to-live → create policy on `typing_sessions`, field `expiresAt`. The field
> is being written; nothing deletes anything until the policy exists.

<details><summary>Original analysis</summary>

## 🟡 Problem 3 (original) — `typing_sessions` grows without bound

`logSession()` (line 1552) does an `addDoc` per sprint. At 30-second sprints:

```
2,335 students × 20 sprints × 175 days = 8,170,000 documents/year
                                       ≈ 2.4 GB  vs. 1 GiB free storage
```

You'd blow the storage tier around Thanksgiving, and any report touching the
collection would be brutal.

### Fix

Accumulate sprints in memory and write **one** rollup document per page-session with
a `sprints: [...]` array. Twenty documents become one, 2.4 GB becomes ~250 MB, and
nothing is lost — the per-sprint detail is still in the array.

Then set a **TTL policy** on `typing_sessions` and `practice_sessions`.

</details>

---

## ✅ Problem 4 — `reports.html` will out-read the students

> **SHIPPED** (`reports.html` 2.8.0, confirmed Round 6). The fix below is what
> landed, essentially verbatim: the report builds `where("classId","==",...)` or
> `where("schoolId","==",...)` alongside the date range, chosen by the scope picker.
> The one refinement here that did NOT ship is `getCountFromServer()` for headline
> totals — still available if report views become a cost problem.

Line 434:

```js
const q = query(logsRef, where("date", ">=", startDate), where("date", "<=", endDate));
```

No class filter, no limit. A one-month range at full enrollment returns
2,335 students × 20 days ≈ **47,000 documents per report view.** A handful of report
views a day exceeds the entire student body's read budget.

### Fix

`classId` and `schoolId` **are now on every log document** as of v3.4.0 — that
part is done. What remains is using them:

```js
const q = query(logsRef,
    where("classId", "==", selectedClassId),
    where("date", ">=", startDate),
    where("date", "<=", endDate));
```

30 students × 20 days = **600 documents.** For headline totals that don't need the
underlying rows, `getCountFromServer()` bills 1 read per 1,000 documents matched.

---

## 🟡 Problem 5 — practice mode will not survive a real class period

> **STILL OPEN, confirmed Round 6, and the numbers below are unchanged.** No
> `practice_pool` cache exists in `game.js` or `index.js`. `maxInstances` is still 5
> (`index.js` line 76) and `DAILY_LIMIT` is still 5 (line 21).
>
> ⚠️ **Two reasons this has not bitten yet, and neither is a fix.** Enrollment is not
> at 7,000, and the per-student daily cap keeps *one* student from hammering it — but
> the cap does nothing about thirty students clicking at once, which is the actual
> failure mode described below. It fails as a burst, in a class period, not as a bill.
>
> ⚠️ Both halves of the fix need a **Firebase CLI deploy**, so this cannot ship from
> Jake's browser workflow. `index.js` in the repo is already ahead of what is
> deployed (see `README.md` § Known constraints) — whoever gets terminal access
> should read that before touching this.

Two independent ceilings, and this is the one part of the plan where "free" is
genuinely hard.

**`maxInstances: 5`** (`index.js` line 33) caps concurrency. Combined with a 30-second
timeout and 467 students in the building, kids will see failures — not slowness,
failures.

**Gemini free-tier quota** is the harder wall. Free-tier Flash sits around **10–15
requests per minute**, with a daily cap somewhere between a few hundred and ~1,500
depending on the model and Google's mood that quarter. Google cut these limits sharply
in December 2025 with no advance notice, and the published numbers disagree across
sources — **check AI Studio for your project's live limits before trusting any figure,
including these.**

Either way: 10–15 RPM cannot serve a class of thirty students clicking "practice" in
the same two minutes, let alone five classes. The current `DAILY_LIMIT = 5` permits up
to ~11,600 generations a day. You will 429 constantly.

### Fix — cache the paragraphs

Practice text is generated from a small input space: the student's problem characters
plus the book. Across 7,000 students there might be 200 distinct problem-character
profiles, not 7,000.

```
practice_pool/{bookId}_{sortedProblemChars}_{n}   →  { text, createdAt, uses }
```

On request: read the pool for that key. If it has ≥3 entries, return a random one
(**1 Firestore read, zero Gemini calls**). If it's thin, generate one, store it, and
serve it. Steady state after the first week is a cache hit nearly every time.

That turns thousands of Gemini calls per day into dozens, and it drops the function's
CPU-seconds — which is where the Cloud Functions overage would have hit — to near zero.
Also raise `maxInstances` to ~20 once the cache is absorbing the load.

The tradeoff is real and worth deciding deliberately: two students with the same
weak keys may see the same paragraph. In a typing tutor that seems fine, arguably
good — but it's your call, not mine.

---

## ✅ Security — rules now exist, and this section's premise is obsolete

> **⚠️ CORRECTED Round 6. Do not act on the paragraph immediately below.**
> `firestore.rules` (v2.2.0) and `storage.rules` (v2.1.0) are both committed to the
> repo. The reasoning in the rest of this section about *why* rules matter at 7,000
> students is still worth reading and is why they got written — but the factual claim
> that opens it has been false since Round 3.
>
> **Also superseded: the recommendation of Auth custom claims.** Roles live in
> `staff/{uid}` Firestore documents, which the rules `get()` directly.
> `firestore.rules` v2.0.0 made that change deliberately: claims can only be written
> by the Admin SDK, which needs a Cloud Functions deploy, which needs a command line
> — and Jake does not have one. A role change now also takes effect immediately
> rather than on next sign-in. **Read the header comment in `firestore.rules`.**
>
> ⚠️ Rules still have to be **pasted into the console** to take effect. Being in the
> repo is not being deployed.

*Original text, kept for its reasoning:*

There is no `firestore.rules` file here. Either rules only exist in the Firebase
console (a bus-factor problem — put them in the repo) or the database is running on
defaults.

At 7,000 students this stops being theoretical. Some fraction of 7,000 middle
schoolers will open devtools, and the admin gate in `admin.js` line 18 is a
client-side array — it hides buttons and nothing more. Without rules, any signed-in
student can rewrite the leaderboard, read every classmate's typing log, or edit book
content.

The `where("leaderboardOptOut", "==", false)` + `limit(10)` shape from Problem 1 is
also *rules-friendly* in a way the collection scan never was: you can constrain reads
to that exact query shape.

I'd rather draft rules with you than guess at them — `classes`,
`pendingClassAssignments`, and `settings/goals` all have write patterns I'd only be
inferring, and rules that are subtly too tight break the app in ways that surface
mid-class. Sketch of the shape:

```
// users/{uid}/**            → read/write if request.auth.uid == uid
// typing_logs/{docId}       → create/update if docId starts with request.auth.uid + '_'
//                             read only by admins
// leaderboard/{uid}         → write own doc only; read allowed (initials only, no names)
// books/**, lessons/**      → read: signed in;  write: admin only
// settings/goals            → read: signed in;  write: admin only
```

Admin identity belongs in a **custom claim**, not an email array — that's a
`setCustomUserClaims` call you'd run once from the functions environment.

---

## Summary

| | v3.2.0 | v3.3.0 | **v3.4.0 (shipped)** |
|---|---|---|---|
| Reads / day @ 2,335 students | 326,960,710 | 35,025 | **28,954** (58% of free) |
| Writes / day @ 2,335 students | 268,525 | 235,835 | **21,015** (105% of free) |
| Egress / day | ~82 GB | trivial | trivial |
| `typing_sessions` docs/year | 8,170,000 | 8,170,000 | **~409,000** |
| **Cost / school year** | **~$34,400** | **~$68** | **~$0.32** |

Reads are done at 58%, and that's the worst case where all 7,000 students type
every day.

Writes land at 105% — just over the line, which is where the ~30 cents comes from.
Going under means retiring `stats/time_tracking`, which needs a migration over every
existing student. I judged that not worth the risk for a dollar; the lever is there
if the real numbers come in higher than modelled.

**These are modelled numbers, not measured ones.** The read/write counts per block
were verified against the implementation in simulation, but the per-day totals rest
on assumptions about student behaviour. Check the Firestore Usage tab after the first
real week.

## Do this first, regardless

**Set a Google Cloud budget alert on the project.** $5/month, email to Jake. It takes
four minutes in the Cloud Console.

Blaze has no hard spending cap. That is the actual danger here — not any specific
line of code, but the fact that a mistake in a project this size compounds silently
across 467 devices and shows up as a bill. The alert is the difference between "huh,
weird" on Tuesday and a four-figure surprise in September.

You may also want to check the Firestore Usage tab now, at current enrollment. The
leaderboard scan is already costing something.

## Suggested order

1. **Budget alert.** Not code. Four minutes. Do it today. ← *still not done*
2. ~~**Leaderboard `limit(10)` + honest cache + drop `displayName`.**~~
   ✅ **Shipped as `game.js` v3.3.0.** Create the weekly composite index when the
   console asks; the fallback covers you until then.
3. ~~**Flush-based saves.**~~ ✅ **Shipped as `game.js` v3.4.0 + `learn.js` v1.1.0.**
   The rollup-doc merge was deliberately skipped — see that section. Bigger change, touches
   `game.js` and `learn.js` and needs a data migration for the merged doc. This is
   the one to be careful with.
4. **Session rollup** ✅ shipped — but **enable the TTL policy in the console**.
5. ~~**Reports class filter.**~~ ✅ **Shipped as `reports.html` 2.8.0**, together
   with the scope picker. Round 5 fixed a permission bug in it; Round 6 confirmed
   the fix is live. `getCountFromServer()` remains unused and optional.
6. **Practice pool cache + raise `maxInstances`.** Needs a CLI deploy.
7. **Security rules** ✅ written (`firestore.rules` v2.2.0, `storage.rules` v2.1.0)
   — ⚠️ but **verify they are pasted into the console**, which is the only place they
   take effect. **The "+ custom claims" half of this item is cancelled**, not pending:
   roles ship as Firestore documents so that no CLI is ever required.

Items 2, 4, and 5 are pure browser-upload changes — they fit your GitHub web
workflow. Item 6 needs the Firebase CLI.
