# TTL-GUIDE.md

<!-- v1.4.1 — Round 6 (Noiseless): recovered and committed. This file was written in
     Round 3, referenced by HANDOFF §9/§10 across four rounds, and never actually
     committed — Jake burned a whole session finding it again. VERIFIED on recovery:
     §5's three composite indexes and §1's two TTL field overrides match
     firestore.indexes.json exactly (typing_logs schoolId+date, typing_logs
     classId+date, leaderboard weekStart+totalSecondsWeek; expiresAt TTL on
     typing_sessions and practice_sessions). No content changed.
     ⚠️ SCALE-PLAN.md is now in the repo, but read its Round 6 header before
     trusting it — its security section is out of date in a way this file is not.
     v1.4.0 — dropped a citation to SCALE-PLAN.md, which is not in the repo.
     v1.3.0 — §2a steps corrected to match the live wizard, walked through with
     Jake on 2026-08-02: the field is "Collection ID" (not collection group), and
     Query scope must be set to Collection.
     v1.2.0 — §2a rewritten. The tab is called AUTOMATIC in the live console, not
     "Single Field" as the docs say, and the original text was written in jargon
     that obscured a simple idea. It is also explicitly marked optional now,
     because it is.
     v1.1.0 — §2a added: the single-field index exemption the console banner is
     warning about. The console does NOT create it for you.
     v1.0.0 — written 2026-08-02 by Blick. This file was referenced by HANDOFF §9
     and §10 for two rounds but never actually existed in the repo. Console steps
     verified against Google's current documentation on the day of writing, not
     recalled. -->

**What this is for:** `typing_sessions` and `practice_sessions` are append-only.
Every session a student finishes adds a document, and nothing ever removes one.
Both collections have been writing an `expiresAt` field since `game.js` v3.4.0 /
v3.4.1 specifically so that a TTL policy could collect them — **but the policies
were never created**, so the field has been decorative ever since.

Two policies. Roughly five minutes. One time, forever.

---

## 1. What you're creating

Straight out of `firestore.indexes.json`, which is the only other written record:

| collection group | field | retention as written |
|---|---|---|
| `typing_sessions` | `expiresAt` | 120 days |
| `practice_sessions` | `expiresAt` | 120 days |

The 120 days is baked into the documents, not the policy — `game.js` writes
`new Date(Date.now() + 120 * 24 * 3600 * 1000)` at
`game.js` ~line 2441 and ~line 5400. The policy just says "when the timestamp in
this field passes, delete the document." **Leave the console's Expiration offset
at 0**, or you'll be adding a second delay on top of the 120 days already in the
data.

---

## 2. The clicks

TTL lives in the **Google Cloud console**, not the Firebase console. Same project,
different site — this is the single most common reason people can't find it.

1. Go to the Google Cloud console → **Firestore** → **Databases**.
2. Select your database (`(default)` unless you made another).
3. In the left navigation, click **Time-to-live**.
4. Click **Create Policy**.
5. Collection group: `typing_sessions` — Timestamp field: `expiresAt`
6. Leave **Expiration offset** at 0. Click **Create**.
7. Repeat steps 4–6 for `practice_sessions`.

There is also a shortcut into this page from the Firestore data editor, if you
happen to be looking at one of these collections already.

The page then lists both policies with a status. **A policy takes ten minutes or
more to become active, even on an empty database** — if it still says `CREATING`,
that's normal, not a failure.

> If the navigation has moved since this was written, the canonical page is
> <https://firebase.google.com/docs/firestore/ttl>. Trust it over this document.

---

## 2a. The banner about automatic indexes — optional housekeeping

**Skip this section if you're short on time.** The policies above are the job.
This is a small cleanup that saves a trivial amount of money and nothing else.
It is written down so it isn't lost, not because it's urgent.

### What the banner means, in plain terms

Firestore automatically builds a **lookup table for every field** in your data, so
that searching on that field is fast. It does this whether or not you ever search
on it.

Nothing in TypeThatBook ever searches on `expiresAt`. It's written when a session
is saved and never read again — verified by grep: no query, no sort, no filter.
The TTL policy reads the field directly, not through a lookup table.

So Firestore is building and maintaining lookup tables (two of them: one
ascending, one descending) for a field nobody ever looks up. An **exemption**
tells it to stop.

The banner's own concern is a scaling one — a timestamp only ever moves forward,
so every new row lands at the same end of the lookup table, and at very high write
rates that becomes a bottleneck. **That will never happen here.** Even the
7,000-student projection is well under one write per second on average. Ignore
that part; the reason to do it is simply that the tables are useless.

### ⚠️ You are NOT creating an index. You are turning one off.

Easy to get backwards, because it lives on the Indexes page.

1. Google Cloud console → **Firestore** → **Databases** → your database.
2. Left navigation → **Indexes**.
3. Click the **Automatic** tab. *(Google's docs call this "Single Field"; the live
   console says "Automatic". Same page.)*
4. **Add exemption**. Collection ID `typing_sessions`, Field path `expiresAt`.
5. **Query scope: tick "Collection" only.** Leave "Collection group" unchecked —
   Firestore doesn't auto-create collection-group indexes, so there's nothing
   there to switch off, and both of these are top-level collections anyway.
   Ticking neither box leaves the wizard nothing to configure.
6. Next → set **Ascending, Descending and Arrays** all to **Disabled**.
7. Repeat for `practice_sessions`.

**Reading the result.** The Exemptions table should show one row per collection
with three chips under *Collection scope* and the words *"No changes from
automatic index settings"* under *Collection group scope*. That contrast is the
confirmation: the column with an override shows chips, the column without one
says so in words. If Collection scope also said "No changes", the exemption
didn't take. To be certain, use ⋮ → Edit and check the radio buttons directly.

The **Manual** tab is for the three composite indexes in §5 — a completely
different thing, and those you don't create by hand either. Don't use Manual here.

### Why bother at all

`firestore.indexes.json` in the repo has always declared this exemption:

```json
{ "collectionGroup": "typing_sessions", "fieldPath": "expiresAt",
  "ttl": true, "indexes": [] }
```

`"ttl": true` is the policy you just created. `"indexes": []` is the exemption.
That file is only applied by `firebase deploy`, which we don't run — so doing the
policy by hand gets you half of what the file describes. Finishing it keeps the
repo's only written record of this setup honest.

---

## 3. Things that will surprise you

**⚠️ Deletion is not instant.** Documents are typically removed within **24 hours**
of expiring, not at the moment they expire. Expired documents keep showing up in
queries until the sweep actually runs. Nothing in TypeThatBook reads these
collections on a hot path, so this costs us nothing — but don't use TTL as an
access-control mechanism anywhere, ever.

**⚠️ TTL deletes are billed deletes.** They count against the free tier's daily
delete quota exactly like a delete you issued yourself. Do the arithmetic before
you turn it on at scale:

- At today's ~20 students: a rounding error.
- At the 7,000-student projection: ~409,000 `typing_sessions`
  documents a year, so steady state is roughly **1,120 deletes/day** against a
  20,000/day free allowance. Comfortable.

**✅ Nothing will vanish when you turn this on.** `expiresAt` was first written in
late July 2026 with a 120-day horizon, so the earliest document expires around
**late November 2026**. Turning the policies on today does nothing visible for
about four months and then quietly starts working. There is no backlog and no
thundering-herd first sweep. This is the cheapest possible time to do it.

---

## 4. ⚠️ The pre-v3.4.0 gotcha — documents TTL will never touch

**A TTL policy ignores any document where the field is missing, null, or not a
Timestamp.** Those documents are not deleted. Ever. They are not errors, they
don't appear in a report, and nothing warns you.

Every `typing_sessions` document written **before `game.js` v3.4.0** — and every
`practice_sessions` document written before **v3.4.1** — has no `expiresAt` field
at all. They are immortal.

This is fine, and here's the honest reasoning: at ~20 students for one school
year the total is small, and the Firestore free tier includes 1 GiB of storage.
Those documents are a rounding error against it. They are worth knowing about,
not worth an evening.

If you do want them gone:

1. Firestore data browser → `typing_sessions`.
2. Sort or filter to find documents with no `expiresAt`. If the collection is
   small, eyeballing it is faster than being clever.
3. Delete by hand.

**Do not delete the whole collection** to clean up a handful of old documents —
that also destroys everything the TTL policy was going to manage correctly, and
`typing_sessions` is what `reports.html` reads.

There is no browser-side backfill. Rules only let a student write their own
documents (`docId.split('_')[0] == request.auth.uid`), by design, so you cannot
retroactively stamp `expiresAt` onto someone else's old rows from the admin page.
That constraint is load-bearing for the security model and should not be relaxed
to solve a storage problem this small.

---

## 5. While you're in there: the three composite indexes

The other half of Tier 2, and much easier — these announce themselves.

`firestore.indexes.json` records three:

| collection group | fields |
|---|---|
| `typing_logs` | `schoolId` ASC, `date` ASC |
| `typing_logs` | `classId` ASC, `date` ASC |
| `leaderboard` | `weekStart` ASC, `totalSecondsWeek` DESC |

**You don't have to create these by hand.** The first query that needs a missing
index fails with an error containing a click-to-create link that pre-fills
everything. So the practical approach is to *trigger* each one deliberately,
somewhere other than in front of a class:

1. **Reports → pick a specific school** (not "All schools") → Generate.
   "All schools" is a date-range-only query and needs no index, which is why the
   first report anyone runs always looks clean and proves nothing.
2. **Reports → pick a specific class** → Generate.
3. Open the leaderboard and look at the **weekly** board.

Each failure gives you a link. Click it, wait for the index to build, retry.

---

## 6. How to know it worked

- **Time-to-live page** lists both policies with status `ACTIVE` (not `CREATING`).
- *(Optional, §2a)* **Indexes → Automatic** lists two exemptions,
  `typing_sessions.expiresAt` and `practice_sessions.expiresAt`, indexing
  disabled.
- **Indexes page** lists three composite indexes as `Enabled`.
- Reports scoped to a single school and a single class both return data.
- The weekly leaderboard populates.

TTL itself won't be provable until late November. That's expected — the policy
being `ACTIVE` is the whole verification available before then.
