# TypeThatBook — Scaling to 7,000 Students

<!-- SCALE-PLAN.md v1.4.0 -->
<!-- v1.4.0 — Round 9 (Corona). Re-audited against game.js v3.18.0 / learn.js as
              shipped, then patched. THREE changes, one of which is an apology.

              1. THE BUDGET ALERT IS SET. It has been set for a long time. Jake
                 has now told THREE separate instances this, and all three left
                 "← still not done" in the file, because each one read the stale
                 line instead of the person. That is a documentation failure with
                 a specific cost: it trains the reader to skip the action items.
                 Corrected, and the "Do this first" section is gone.
              2. PRACTICE MODE DOWNGRADED on observed evidence, not theory. See
                 that section. Field data beats a quota table.
              3. COVER EGRESS ADDED — and it is the headline. This plan spent
                 three rounds on Firestore reads and writes, which come to tens
                 of dollars a year, while never once looking at Cloud Storage,
                 which was the only line that could reach three figures. Fixed in
                 admin.js v3.31.0. Numbers measured over the 24 real covers in
                 library/, not estimated.

     v1.3.0 — Round 6 (Noiseless): recovered from outside the repo and committed.
              Status corrections only.
     v1.2.0 — Problems 2 and 3 shipped.
     v1.1.0 — Problem 1 SHIPPED in game.js v3.3.0. -->

> ## Status, August 2026 — the answer is yes, and it is not close
>
> **~389 simultaneous students, ~2,333/day, 175 days: somewhere between $0 and
> about $50 for a full school year.** Firestore stopped being the constraint at
> v3.4.0 and the current code holds the line.
>
> **The thing to internalise: being over the free tier and costing money are
> different events.** Firestore reads are $0.06 per *hundred thousand*. This
> project can run at ten times the free read tier all year for the price of a
> sandwich. Percentages in the tables below are a health signal, not a bill.
>
> **Everything in Problems 1-5 is now shipped, fixed, or observed to be a
> non-issue.** The two open items are both optional.

---

## What actually costs money here, ranked

| | Scale | Cost/year | Status |
|---|---|---|---|
| **Cover image egress** | up to ~206 GB/mo | was up to **$114** | ✅ fixed, admin.js v3.31.0 |
| Firestore reads | 110k-495k/day | **$6-$47** | ✅ fine |
| Firestore writes | ~21k/day | **$0.31** | ✅ fine |
| Cloud Functions / Gemini | ~0 | **$0** | ✅ observed non-issue |
| Firebase Hosting | — | **$0** | GitHub Pages |

Cover egress was larger than every Firestore line combined and it was not in
this document. The lesson is not "watch Storage" — it is that this plan
optimised the thing it had already been looking at. **When you next ask whether
this is affordable, check the Firebase Usage tab for the product nobody has
mentioned yet.**

---

## ✅ Budget alerts — DONE. Stop putting this back.

Jake has **two** Google Cloud budget alerts on the project: **$1 and $5.**

They have been in place for months. Three consecutive rounds of this document
told him to go set them anyway, because each round trusted the file over the
person who was answering it. If you are a future instance reading this: the
alerts exist, do not open your reply by telling him to create them, and if he
tells you something about his own deployment that contradicts this file,
**he is right and the file is stale.** Fix the file.

---

## Load model

Assumptions, stated so they can be argued with:

| | |
|---|---|
| Total students/year | 7,000 |
| Trimesters | 3 → ~2,335 students per trimester |
| Periods/day | 6 → **389 simultaneous** at peak (corrected v1.4.0; was 5) |
| Students touching Firestore per day | ~2,335 |
| Typing block | 10 minutes |
| Sprint length | 30 seconds (the default) → **20 sprint-ends per block** |
| Characters typed | ~1,500 at 30 WPM → ~25 sentence-ending punctuation marks |
| School days | 175 |

Firestore free tier (daily, resets midnight Pacific): **50,000 reads · 20,000 writes ·
20,000 deletes · 1 GiB stored.**
Blaze overage: **$0.06/100k reads · $0.18/100k writes · $0.02/100k deletes.**

**Cloud Storage** (bucket `typethatbook.firebasestorage.app`, newer-style, so GCS
"Always Free"): **5 GB stored · 100 GB/month egress to North America**, then
~$0.12/GB. This is a *separate* budget from Firestore and it is where the covers
live — see Problem 6.

**Hosting is GitHub Pages**, so it costs nothing and appears on no Firebase bill.

You are on Blaze already — Cloud Functions requires it — so overages **bill
silently** rather than cutting you off. That is why the budget alerts matter, and
**they are set: $1 and $5.**

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
389 students × 20 sprints × 7,000 docs =  54,460,000 reads per class period
                              × 6 periods = 326,760,000 reads per day
```

Against a 50,000/day free tier. At $0.06/100k that is **$196/day**, or **$34,300 a
school year** — from this one line.

The egress is arguably worse. Each scan ships ~250 bytes × 7,000 docs ≈ 1.75 MB down
the wire. Across a day that's **~82 GB**, against a free tier of 10 GiB *per month*.
You'd exhaust the monthly egress allowance in the first three hours of the first
Monday, on your school's wifi, 389 devices at once.

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

## ✅ Problem 5 — practice mode: closed on field evidence, not theory

> **DOWNGRADED v1.4.0 from "will not survive a real class period."** The code is
> unchanged — `index.js` still has `maxInstances: 5`, `DAILY_LIMIT = 5`, and no
> `practice_pool` cache. What changed is that we now have **observation**, and it
> flatly contradicts the model.

**Jake's field data, across the full deployment to date:** roughly 30 students
using the software daily. **Not one has ever opened practice mode on their own
initiative.** Not one. When he suggests it directly, they do it grudgingly. The
feature's measured organic usage rate is zero.

The analysis below assumed a class of thirty students clicking "practice" in the
same two minutes. That event has never occurred and there is no evidence it is
approaching. **A risk model that has been contradicted by two years of
observation is not a cautious model, it is a wrong one.**

And the failure mode, if it ever did happen, is benign: Gemini returns 429, the
student sees an error, and they go back to typing the book — which is the thing
the app is actually for. No data is lost, no bill is incurred, no class is
derailed beyond a shrug.

**Recommendation: do nothing.** The `practice_pool` cache is a real optimisation
for a problem this project does not have, and it needs a Firebase CLI deploy
Jake does not have access to. If organic practice usage ever becomes non-zero,
re-open this. Until then it is a solution looking for a shortage.

<details><summary>Original analysis, kept because the Gemini quota facts are still accurate</summary>

Two independent ceilings. **`maxInstances: 5`** caps concurrency; combined with a
30-second timeout and hundreds of students in the building, kids would see
failures rather than slowness. **Gemini free-tier quota** is the harder wall —
free-tier Flash sits around 10-15 requests per minute with a daily cap that
Google has changed without notice. Check AI Studio for live limits before
trusting any published figure.

The proposed fix was a `practice_pool/{bookId}_{sortedProblemChars}_{n}` cache:
read the pool, return a random entry if it has ≥3, otherwise generate and store.
Steady state is a cache hit nearly every time, turning thousands of Gemini calls
into dozens. Still the right fix **if the demand ever materialises.**

</details>

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

## ✅ Problem 6 — cover images were the biggest cost in the project

> **Fixed in `admin.js` v3.31.0.** New in v1.4.0 of this plan. Nothing in Rounds
> 1-8 looked at Cloud Storage.

Covers were uploaded **exactly as extracted from the EPUB**, with no downscaling
and **no `Cache-Control` header at all.** Measured across the 24 EPUBs in
`library/`: **mean 308 KB, max 942 KB** (Heidi), with Standard Ebooks emitting a
uniform 1400×2100.

The library grid renders them into `minmax(180px, 1fr)` at `aspect-ratio: 2/3`.
Even on a 2× Chromebook display that is a **~360px-wide slot.** Every kilobyte
past ~500px of width was billed as egress and then discarded by the browser's
scaler.

| | mean cover | egress/month | vs. 100 GB free | cost/year |
|---|---|---|---|---|
| Before | 308 KB | ~206 GB | **206%** | **up to $114** |
| After | **67 KB** | ~45 GB | 45% | **$0** |
| After, with the cache header working | 67 KB | ~9 GB | 9% | **$0** |

**The "after" row assumes browser caching never helps at all.** It is under the
free tier on downscaling alone; the `Cache-Control` header is margin on top.

### One piece of good luck worth knowing

The bucket is `typethatbook.firebasestorage.app` — a **newer-style bucket**,
which follows Google Cloud Storage "Always Free": **5 GB stored and 100 GB/month
egress to North America.** Legacy `*.appspot.com` buckets get the far stingier
**1 GB/day.** On the legacy tier the before-numbers would have been roughly
$630/year instead of $114. Nobody chose this; do not assume the next Firebase
project inherits it.

### What shipped

`downscaleCover()` in `admin.js`: canvas re-encode to fit **500×800, JPEG q0.82**,
composited onto white so a transparent PNG source cannot flatten onto black.
`uploadCover()` then sets **`cacheControl: 'public, max-age=2592000'`** (30 days).

Measured over all 24 library covers: **7.22 MB → 1.56 MB, 4.6× smaller, −78%.**

Three deliberate safety properties:

- **It never blocks an upload.** Every failure path — object URL, decode error,
  10-second timeout, canvas exception, `toBlob` returning null — resolves with
  the *original* blob. A full-size cover costs a fraction of a cent; a cover that
  fails to upload costs Jake an afternoon.
- **It keeps the original if the re-encode is not smaller.** Already-optimised
  small PNGs sometimes grow when re-encoded.
- **It reports the saving in the admin status line** (`308 KB → 67 KB, −78%`).
  This is how you tell a working downscale from a silent fallback. If you start
  seeing covers upload with no size note, the canvas path is failing.

**30 days is safe despite the fixed path** (`covers/{bookId}`, overwritten in
place) because clients never request that path — they request the download URL,
and `uploadBytes` mints a **new download token on every upload**. A replaced
cover therefore has a URL no cache can match. `index.html`'s 6-hour book cache is
the real upper bound on how long a swap takes to appear.

⚠️ **This applies to covers uploaded from now on.** Existing covers keep their
size and their missing header until re-uploaded. There is no migration and it
does not need one — the library grows continuously, so the mix shifts on its own.
If you want it immediately, re-upload covers for the largest titles first; Heidi
alone is 942 KB.

---

## ✅ Problem 7 — the Settings dropdown scanned the whole library

> **Fixed in `game.js` v3.19.0.** New in v1.4.0.

`openMenuModal()` did an uncached `getDocs(collection(db, "books"))` **every time
a student opened Settings.** It was the last read in the student path that
ignored the caching discipline the rest of `game.js` adopted in v3.4.0, and the
only one that got **worse over time** — the bookclean project adds titles
continuously, so the price of opening a menu grew with the library.

At ~42 books it was, on its own, roughly the size of the entire rest of the read
budget. At 100 books it would have been double.

**Fixed with the pattern `index.html` already used for the library grid:** cache
`{id, title}` in `localStorage` for an hour, validated by a **COUNT aggregation —
one billed read for the whole collection** rather than one per document. A count
catches the case that matters (a book added or removed); a *rename* is caught by
the TTL. Console escape hatch: `ttbClearBookList()`.

Only `id` and `title` are cached, deliberately. The `chapters` array is by far
the largest field on a book document and the dropdown renders neither.

---

## Summary

**Modelled at 7,000 students/year — 2,333/day, ~389 simultaneous, 175 days.**

| | v3.2.0 | v3.4.0 | **v3.19.0 / admin 3.31.0** |
|---|---|---|---|
| Firestore reads/day | 326,960,710 | 28,954 | **110k warm / 495k cold** |
| Firestore writes/day | 268,525 | 21,015 | **~21,000** |
| Cover egress/month | ~206 GB | ~206 GB | **~45 GB** |
| `typing_sessions` docs/year | 8,170,000 | ~409,000 | ~409,000 |
| **Cost/school year** | **~$34,400** | **~$0.32 + up to $114 unseen** | **$6-$47** |

The read range is cache-dependent: **warm** assumes a student returns to the same
browser profile day to day, **cold** assumes Chromebook profiles are wiped or
shared so every `localStorage` cache starts empty. Cold is 10× the free read tier
and still **$47 a year**, which is the point of this whole document.

**These remain modelled numbers.** The per-block read/write counts are verified
against the implementation; the per-day totals rest on assumptions about student
behaviour. The cover figures are the exception — those are **measured** over the
24 real EPUBs in `library/`.

## Open items — both optional, neither urgent

1. **Retire `stats/time_tracking`.** Would take writes from ~105% of free to
   ~95%. Needs a migration over every existing student. **Judged not worth the
   risk to save one dollar** — it is the lever if real numbers come in higher.
2. **`getCountFromServer()` for report headline totals.** Available if report
   views ever become a cost problem. They are not currently.

## Closed, do not reopen without new evidence

- **Budget alerts** — set ($1 and $5). See the section above.
- **Practice pool cache** — organic usage is zero. See Problem 5.
- **Security rules** — `firestore.rules` v2.2.0, `storage.rules` v2.1.0. Roles
  live in `staff/{uid}` documents; the custom-claims proposal is **cancelled**,
  not pending, because claims need the Admin SDK and Jake has no terminal.

## A note for the next instance

Two of the three corrections in v1.4.0 were things **Jake had already told
previous instances** — the budget alert (three times) and practice mode usage
(twice). Both were repeated back to him as open action items anyway, because
each round read the file and not the person.

**If Jake tells you something about his own deployment that this document
contradicts, he is right.** He is the only one here who can see the Usage tab and
the classroom. Update the file in the same session, or the next instance will
make you look bad in exactly the same way.
