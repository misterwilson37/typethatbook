# HANDOFF — TypeThatBook

<!-- HANDOFF.md v5.0.0 — Round 4 (Oliver): cost / grades / stability audit.
     No new features. Read §B first; it is the current round. §A is Round 3
     (Blick) and is unchanged. Everything from §0 down is Rounds 1-2, verbatim. -->

**Claude instance:** **Oliver** (Round 4) · **Blick** (Round 3) · **Dvorak** (Round 2) · **Underwood** (Round 1)
**Session:** Round 4 — 2026-08-02 · Round 3 — 2026-08-02 · Round 2 — 2026-08-01 · Round 1 — 2026-07-30 → 2026-07-31

> *On the names:* Underwood built the typewriter that taught America to touch-type.
> Dvorak was an educational psychologist who studied typing instruction and finger
> motion, which is what Round 2 was about. Blick is the Blickensderfer 5 (1893),
> whose trick was a swappable typewheel — one machine, pull one cylinder, drop in
> another, same keystrokes come out looking completely different. Round 3 was the
> view switcher. Oliver is the Oliver No. 1 (1894), the **visible writer**: every
> machine before it printed on the underside of the platen, so you typed blind and
> lifted the carriage to find out what you'd done. Round 4 was an audit — reading
> the code for what it actually does rather than what its comments say it does,
> which turned out to be the whole job. Predecessors on Ellis Web Bell: Stedman,
> Fable. (Jake's wife types Dvorak. Unplanned, and welcome.)

---

## B. Round 4 — the cost / grades / stability audit (2026-08-02)

**Shipped this round:** `learn.js` **2.2.0** · `game.js` **3.9.1** ·
`index.html` **3.3.0** · `reports.html` **2.8.0** · `firestore.rules` **2.2.0** ·
`firestore.indexes.json` **2.0.0** · `firebase-config.js` **1.2.0** ·
`index.js` **1.6.0** · `package.json` · `admin.js` **3.18.2** ·
`admin.html` · **new files:** `appcheck.html` **1.0.0**, `storage.rules` **2.0.0**,
`ONBOARDING.md`

⚠️ **READ §B.8 BEFORE ASSUMING ANY OF THAT IS LIVE.** This round produced more
files than were deployed. Several are sitting in Jake's downloads, and the
difference matters: `admin.js` and `admin.html` are a matched pair, and
`game.js` 3.9.1 assumes `admin.js` 3.12.0+.

**Queued, not started:** `ttb-shared.js` dedup, leaderboard scope toggle,
per-school book visibility + book requests, and the part-id renumber bug — all in
§B.13, in Jake's stated priority order.

⚠️ **Deploy order matters in one place.** `admin.js` 3.12.0 and `game.js` 3.9.1
are a pair: game.js only trusts its 7-day chapter cache because admin.js now
writes `contentVersion`. Ship admin.js first, or ship both. Rolling admin.js
back alone silently reintroduces week-long stale chapters.

### B.0 Why this round happened, and the ordering that came out of it

Jake asked for a fresh-eyes audit and then gave the priority order himself:
**cost, then student grades, then stability, then everything else.** That order
is not arbitrary and the next person should keep it. He is not paid to write
this, he charges nobody for it, and at full district scale every student past
about thirty is money out of his own paycheck for kids he does not teach. A
change that saves reads outranks a change that feels tidier.

The scale target, confirmed: **7,000 middle schoolers ÷ 3 trimesters ÷ 5
periods ≈ 467 simultaneous**, and that is deliberately conservative — most
districts run quarters and 6-8 periods, so the real number is lower.

Hardware, also confirmed and it changes the analysis: **Jake's building is
MacBooks running Chrome.** Other districts that adopt this may be Chromebooks,
possibly in ephemeral mode where localStorage is wiped at every sign-out. So
caching has to work AND the cold path has to be survivable. Every cache added
this round degrades to a plain read, never to a broken page, and several fall
back to an EXPIRED cache rather than an error screen.

### B.1 ⚠️ The three things that were actually broken

Not slow — **wrong**. Each was verified by reading both sides, not inferred.

**1. `flushAll()` had no re-entrancy guard, and it corrupted teacher-facing data.**
Reachable from the interval timer, `visibilitychange`, `saveProgress(force)` and
`walRecover()`; async with four sequential awaits. Two overlapping runs both
captured the same `sessionsBeingWritten` slice, both `addDoc()`'d it, and both
advanced the queue past it — a **duplicate `typing_sessions` document**, double
counting minutes in the per-day sprint drill-down. `typing_logs` was never
affected because it is a merge. `learn.js` `flushStats()` had the identical
shape and got the identical fix.

**2. "My classes" was permission-denied for the default teacher.**
`buildScopedQuery()` handled `__mine__` by querying the whole building on
`schoolId` and narrowing on the client. **Rules are not filters.**
`canReadActivity()` short-circuits to `teachesClass(d.classId)` for anyone whose
`readScope` isn't `building`, and rules evaluate against every document the
query returns, not the subset the client means to keep. So a teacher with the
DEFAULT `own_classes` scope got denied on the scope option the UI defaults them
to — and it would separately have blown Firestore's ceiling of 20
`get()`/`exists()` calls per query. Now one equality query per class, unioned
and de-duplicated. Fewer documents read than before, and every one of them is
one the rules already agree the caller may see.

**3. Teacher time corrections have NEVER worked.**
`reports.html` has had a "correct a student's recorded time" button for several
versions. It calls `updateDoc()` on `typing_logs`. The only update rule was
`request.resource.data.uid == request.auth.uid` — but under an update
`request.resource.data` is the **merged** document, so `uid` is the student's,
never the teacher's. Every correction ever attempted was denied. Nobody noticed
because it surfaces as a console error on a rarely-clicked button. Rules 2.2.0
adds a staff branch, limited to building-scoped staff (matching the identical
constraint already on `users/{uid}/stats`) with the identity fields pinned.

### B.2 The cost work — and the one number that explains it

`game.js` accumulated a caching layer over several versions. **`learn.js` never
got any of it**, and `learn.js` is the page the 6th and 7th graders open every
single day. Same ten minutes of typing: ~5 reads on one page, ~115 on the other.

Backported: lessons cache, `lessonProgress` cache, goals cache (sharing game.js's
exact key), and the pending-assignment read skipped when the student already has
a class. `index.html` got the same treatment — it was re-reading every book
document, including the embedded `chapters` array, on every load. One
284-chapter book is ~11 KB of document, Firestore has no field projection, and
that is billed **egress** — which does come out of Jake's pocket, unlike the SDK
downloads from `gstatic.com` that Round 4 initially and wrongly flagged.

⚠️ **`getCountFromServer()` is the trick that makes cache validation cheap.**
Firestore bills an aggregation at **one read per up to 1000 matched index
entries**. So "has the lesson list changed?" costs 1 read instead of 80. It
catches additions and removals instantly. It does **not** catch an edit to an
existing document — that is what the TTL is for, and that trade is written at
every call site. Do not remove the TTL on the theory the count covers it.

### B.3 ⚠️ Cache invalidation, honestly stated

| cache | key | TTL | validated by | catches an edit? |
|---|---|---|---|---|
| lessons | `ttb_lessonsCache_v1` | 4h | count aggregation | within 4h |
| lesson progress | `ttb_lessonProgCache_v1` | 8h | uid + write-through | this tab, instantly |
| library books | `ttb_booksCache_v1` | 6h | count aggregation | within 6h |
| library progress | `ttb_idxProgCache_v1` | 8h | uid | within 8h |
| goals | `ttb_goalsCache_v1` | 24h | uid | within 24h |
| chapter text | `ttb_ch_v1:{book}:{ch}` | **12h** | `contentVersion` — **which nothing writes**, see §B.6 | within 12h |

Escape hatches, because a TTL is not a workflow: `window.ttbClearLearnCaches()`
on the school page and `window.ttbClearLibraryCache()` on the library. Both are
console-callable. After editing content, call one and reload rather than waiting.

### B.4 App Check — where it actually stands

Sign-up is open to any Google account on earth, deliberately: students self-serve
and Jake's own son uses it. Combined with an unvalidated `allow create`, that was
an authenticated, unmetered, uncapped write target pointed at a personal credit
card. Rules 2.2.0 caps what one forged document can cost. App Check stops the
flood arriving.

⚠️ **Round 4 twice called App Check "entirely console-based". That was wrong** —
it needs client SDK initialisation too, which is why `firebase-config.js` went to
1.2.0. Provider is **classic reCAPTCHA v3, NOT Enterprise**, and that was a cost
decision: Enterprise bills above 10,000 assessments/month and this app clears
that in a week, while classic has a quota that simply stops evaluating. Token TTL
is set to **7 days** in the console because every refresh is a billable
assessment. If anyone re-keys this, keep it classic — the tell is that classic
issues a secret key and Enterprise does not.

**Verified working, 2026-08-04:**

| layer | result |
|---|---|
| Client mints tokens (`firebase-config.js` 1.2.0 live) | ✅ `ok: true` |
| District firewall / proxy | ✅ PASS on school network |
| Chrome enterprise policy, teacher profile | ✅ PASS, enterprise Chrome 150 on a school Mac |
| **Student profile in Chrome** | ⚠️ **NEVER TESTED** |
| Firestore enforcement toggled ON | ⚠️ **UNCONFIRMED — check this first** |

⚠️ **The remaining risk is filtering extensions.** GoGuardian, Securly and
Lightspeed are force-installed **per profile**, so a teacher account passing does
not prove a student account will, and Chrome policy does not apply to Safari.
Hand any student `typethatbook.misterwilson.org/appcheck.html` and have them read
the colour back — that page needs no devtools and no sign-in, which is the whole
point of it existing (a managed Chromebook has no console).

⚠️ **Confirm the enforcement state before trusting it.** The sequence on
2026-08-04 was: enforced → discovered `0/2.6K` verified because the client half
was not live yet → unenforced → uploaded 1.2.0 → confirmed tokens minting →
advised to re-enforce. **Whether that last step happened was never confirmed.**
Firebase console → App Check → APIs → Cloud Firestore. If it says *Unenforced*,
the abuse net is not up.

If enforcement is on and something breaks: **App Check → APIs → Cloud Firestore →
Unenforce.** Know where that button is before you need it. A block after
enforcement means students type normally and nothing saves — the WALs mean the
work is not lost, but a period's data would not reach a report that day.

### B.5 What rules 2.2.0 changed, and one thing it deliberately did NOT

- `typing_logs` doc IDs are now bound to `uid + '_' + date`. The old
  `docId.split('_')[0] == uid` proved you owned the document but said nothing
  about how many you could own — `uid_1`, `uid_2`, `uid_3` were all legal.
- Sanity clamps on `seconds` / `chars` / `mistakes`. A student could write
  `seconds: 999999` into their own graded log from the browser console. Middle
  schoolers absolutely do find this.
- `typing_sessions` create validation with `sprints` capped at 200.
- `practice_sessions` must carry `expiresAt` — a document without it would never
  be TTL-collected and would sit in storage forever carrying the heaviest payload
  in the database.
- `users/{uid}/{collection}` restricted to a whitelist. The wildcard let any
  signed-in account write unbounded documents into subcollections of its own user
  doc.

⚠️ **No `keys().hasOnly()` on `typing_logs`, on purpose.** Both writers use
`setDoc(merge: true)`, and under a merge `request.resource.data` is the merged
result, not the delta. A field written by any earlier version that wasn't in a
whitelist would fail the rule on every flush forever — and the client catches
that and logs a console warning, so a student's time would **silently stop
recording**. Silent grade loss is far worse than a stray field's storage. The
docId binding is what bounds the collection; a whitelist would only bound its
width. Do not "tighten" this back.

### B.6 ⚠️ `contentVersion` — fixed, and why it stayed broken so long

`game.js` `readChapterCache()`/`writeChapterCache()` key on
`books/{id}.contentVersion`, and a comment above them said admin.html bumps it
when a chapter is edited. **It never did** — verified by grep against admin.js
3.10.0, 3.11.0, and every version before. So the chapter cache's only
invalidation was ever its expiry, which was seven days. Edit a chapter, and a
student holding a cached copy read the old text for a week.

This is the most instructive bug of the round. Nothing errored. Nothing logged.
Both halves were individually reasonable and the comment asserting they were
connected was the only evidence anyone had — and it was wrong. **A comment
claiming another file does something is not evidence that it does.** Grep it.

Fixed in `admin.js` **3.12.0** via `bumpContentVersion()`, called from all seven
paths that change chapter text: Upload All (inline, since that write happens
anyway), Direct Save, the language-editor save, the audit fix-all (once after
the batch, not per chapter), the audit single save, the audit autofix, and
Repair Chapter Order. The bump failing is deliberately non-fatal — the chapter
save it follows already succeeded, and turning a cache-freshness miss into a
failed save would be strictly worse. `game.js` 3.9.1 returns
`CHAPTER_CACHE_MS` to seven days, where it now means something.

### B.6b The EPUB importer was dropping paragraphs — Jake spotted this

He asked whether the v3.11.0 TOC-driven importer would skip anything not in the
table of contents. It would, and the line was `let current = null` in
`chapterUnitsFromToc()`. Every `<p>` before the **first** TOC anchor was skipped
and never reached a chapter. Content *between* anchors was always safe (it
attaches to the preceding unit — merged, not lost) and content after the last
anchor was safe too. The loss case was narrow and real: a dedication, an
epigraph, or a Gutenberg transcriber's note sharing a file with chapter one.

Two rules in 3.12.0, neither of which can lose a paragraph:

1. **Orphans are kept**, prepended to the first unit. They may land in the wrong
   chapter, but a stray paragraph at the top of chapter one is visible in the
   staging list and deletable in two clicks. Wrong-and-visible beats
   absent-and-silent.
2. **If more than half a file's paragraphs fall outside the TOC, the TOC isn't a
   map of that file** — bail out and let the structure heuristic or the
   whole-file path handle it. Both keep everything by construction.

And the general guard: **paragraph reconciliation.** Every import now counts the
`<p>` elements each spine file has after boilerplate removal against the ones
actually handed to a chapter, and reports any shortfall in amber on the status
line. The importer will get cleverer over time; this is the thing that will say
so when a clever change loses text.

### B.7 The EPUB importer: what the 20-book harness found

Jake handed over twenty real EPUBs and asked why chapter titles were sometimes
blank. A Node harness (`jszip` + `jsdom`) that replays the SHIPPING functions
against real files found something considerably worse than blank titles, and it
is the single most productive thing this round did.

⚠️ **The harness is not in the repo and should be rebuilt if the importer is
touched again.** It extracted `findChapterUnits`, `headingInfoOf`,
`classifyDocument`, `assignChapterIds` etc. straight out of `admin.js` by
brace-matching, so it tested the real code rather than a copy. Twenty books
verify in about thirty seconds. Do not change chapter detection without one.

**1. Every spine document was becoming a numbered chapter.** Standard Ebooks'
`imprint.xhtml` — their publishing boilerplate — was chapter 2 of every book in
the library, `titlepage.xhtml` was chapter 1, and a student could be assigned to
type the colophon. That shifted real chapters by a different amount per book:
Pride and Prejudice's Chapter I sat at position 3, Gatsby's at 5, Douglass's at 6.
Aesop reported 289 fables instead of 284. Fixed by reading `epub:type`
(frontmatter / bodymatter / backmatter), authoritative in 18 of the 20 books; the
two Gutenberg files fall back to filename then shape. Counts now match the actual
books — P&P 61, Gatsby 9, Alice 12, Pinocchio 36, Douglass 11, Aesop 284.

**2. Chapter titles were being typed instead of read.** Standard Ebooks marks a
titled chapter as an `<hgroup>` holding the ordinal in the heading and **the
title in a `<p epub:type="title">`**. The old extractor queried only `h1`–`h6`,
so it returned "II" and never saw "Old Tom and Nancy" — twelve of twenty books,
every one of which Jake retyped by hand. And because the title was a `<p>`,
`querySelectorAll('p')` swept it into the prose, making the chapter title
**segment zero of what students type**. He was typing names into the admin form
that were simultaneously being served to kids as the first line of the chapter.

**3. Numbering.** Body chapters `1..n` so chapter 1 is chapter 1; front matter
`0.1`; back matter `900.1` — high enough never to collide with the part scheme.
Front and back matter are labelled in the staging list, not hidden: some of it is
real prose worth typing (Aesop's Introduction, Douglass's Preface). `bodyChapters`
is written separately from `totalChapters` so "finished the book" is judged on the
story — Jake's catch: keeping the colophon meant a student never got the
completion celebration.

**4. ⚠️ `parseFloat` cannot compare part numbers.** `parseFloat("1.10")` is 1.1 —
the same value as `parseFloat("1.1")`. So `1.1` and `1.10` were indistinguishable
and `1.2` sorted after both. `compareChapterIds()` splits on the dot and compares
element-wise; new ids are also zero-padded per book. **The comparator is the
important half** — it fixes books already numbered by hand with no renumbering,
so no student's stored chapter pointer moves.

**5. Metadata auto-fill.** Every field the create form demanded was already in the
EPUB: `<dc:title>` 20/20, `<dc:creator>` 20/20, `<dc:subject>` in most. Only the
file is required to parse now. The old gate demanded id and title up front, which
is why the author extraction that had lived inside `parseEpubFile` for versions
never saved anyone any typing — you had to type the metadata to earn the right to
press the button that read the metadata.

### B.8 ⚠️ Deployment state — DO NOT ASSUME

Nothing here deploys itself and this round outran the uploads. Verify before
debugging anything, because a bug that is already fixed in a file sitting in
Jake's downloads is the most expensive kind to chase.

| file | version | state as of 2026-08-04 |
|---|---|---|
| `firestore.rules` | 2.2.0 | ✅ pasted, confirmed by screenshot |
| `firebase-config.js` | 1.2.0 | ✅ live, confirmed by `ttbAppCheckStatus()` |
| `appcheck.html` | 1.0.0 | ✅ live, ran successfully at school |
| `learn.js` | 2.2.0 | probably live — uploaded in the first batch |
| `index.html` | 3.3.0 | probably live — same batch |
| `reports.html` | 2.8.0 | probably live — same batch |
| `game.js` | 3.9.1 | **unconfirmed** |
| `admin.js` | 3.18.2 | ❌ **NOT uploaded** |
| `admin.html` | — | ❌ **NOT uploaded, and never has been** |
| `storage.rules` | 2.0.0 | ❌ not pasted |
| `firestore.indexes.json` | 2.0.0 | documentation only — exemptions never created, and that is fine (§B.14) |
| `index.js` / `package.json` | 1.6.0 | **cannot be deployed — no CLI.** The running function is the pre-1.6.0 one |

⚠️ **`admin.js` and `admin.html` are a matched pair.** 3.18.1+ expects
`create-reset-btn` and `autofill-status`, which exist only in the new HTML.
⚠️ **`game.js` 3.9.1 assumes `admin.js` 3.12.0+.** It trusts a 7-day chapter
cache because admin.js writes `contentVersion`. Older admin.js silently
reintroduces week-long stale chapters with no other symptom.

### B.9 ⚠️ Two bug classes that recurred — check for these first

**Re-entrancy: an async handler that resets shared state before its first
await.** Three instances this round:

| where | what it did |
|---|---|
| `game.js` `flushAll()` | duplicate `typing_sessions` → double-counted minutes in the reports teachers grade from |
| `learn.js` `flushStats()` | same shape, found by analogy |
| `admin.js` Open Book | two clicks ran two loads into one array; the second reset discarded the first's work and the loops interleaved |

The Open Book one is the best diagnostic story in the project. The rendered order
was `4, 5, 1, 6, 2, 7, 3, 8`, which is not random — it is `(4,5,6,7,8)`
interleaved with `(1,2,3)`. Reconstructing it step by step matched digit for
digit, and the database was sequential the whole time. **Grep for `= []` or
`= {}` at the top of an async function and ask what happens if it runs twice.**

**Silent failure reported to the wrong place.** `uploadCover()` wrote its error to
the status bar at the top of the page while the message beside the button said
"✓ Saved" — so two books shipped with no cover and the screen claimed success.
The metadata form had the identical defect fixed in v3.10.0 ("feedback lives next
to the button now"); the cover path never got it. **When a save has more than one
step, the success message must name every step or it will eventually lie.**

### B.10 ⚠️ "No code references this" is not "nothing references this"

The worst mistake of the round, and it caused a real outage.

Firestore showed an `admins` collection. Grep across every `.js` and `.html`
found no reference — a true finding — so it was called a dead fossil and Jake
deleted it. **Firebase Storage rules required `admins/{email}`.** Cover uploads
failed on every book afterwards; 31 books have covers, the two uploaded after the
deletion do not. The one consumer lived in a file that had never been in the repo.

On this project, several things consume Firestore data from outside the codebase:
Storage rules, Firestore rules, TTL policies, index definitions, App Check
settings, and reCAPTCHA keys. **Grep cannot see any of them.** `storage.rules`
now exists in the repo for exactly this reason — it cannot be deployed from
there, but it can be read there, which is what was missing.

### B.11 Versioning discipline — corrected mid-round

`admin.js` v3.12.0 through v3.18.0 were bumped as MINOR and most were straight
bug fixes that should have been PATCH. Jake caught it: *"We haven't added any
features in a couple of turns — just tweaked what's already there."* Then the
very next release broke the rule again as v3.19.0, and he caught that too, one
turn later; it was renumbered to v3.18.1.

Past numbers are left alone because some of those files are deployed and
rewriting history would make the CHANGELOG disagree with what is running. The
standard, restated: **a bug fix is x.y.Z. A minor bump means a new capability
actually arrived. A major needs Jake's explicit sign-off.**

### B.12 Testing this solo — ~20 minutes, no students

1. **Reads actually dropped.** Open the school page with the Network tab
   filtered to `firestore`. First load is a real fetch. Reload — it should be
   dramatically quieter. Then run `ttbClearLearnCaches()` in the console and
   reload; the traffic should come back. That round trip is the whole feature.
2. **Lessons still update.** Edit a lesson in admin, then
   `ttbClearLearnCaches()` and reload the school page. The edit is there. Add a
   whole new lesson and reload WITHOUT clearing — the count check should catch
   it on its own.
3. **The double-fire is gone.** Hard-reload the school page and count requests
   to the `lessons` collection. One. It used to be two.
4. **Two students, one machine.** Sign in as A, do a lesson, sign out, sign in
   as B. B must not see A's progress. This is the uid namespace and it is the
   thing most worth breaking on purpose to check.
5. **No duplicate sprint rollups.** Type a couple of sprints, then alt-tab away
   and back eight times in under a minute. Open the student's day in reports —
   the drill-down should show one rollup, and the minutes should match the
   summary row. Before this round they would diverge.
6. **"My classes" works at all.** Log in as a teacher whose `readScope` is
   `own_classes` (the default), pick "My classes", generate. It should return
   data. It used to return permission-denied.
7. **Teacher correction works.** As a building admin, correct a student's
   recorded time in reports. It should save. It never has.
8. **The report ceiling refuses politely.** As super_admin, pick ALL SCHOOLS
   over a wide date range. Either it returns, or it says it stopped on purpose.
   It must never show a partial table.
9. **Typing still feels right.** Type a full sprint in Classic and in
   Adventure. Scrolling should track the cursor as before — it is now one
   update per frame instead of one per character, which should be smoother, not
   different.
10. **The importer accounts for itself.** Re-import a book you already have —
    Aesop is the good one, it should still say 284. The status line now reports
    paragraphs it rescued from outside the TOC and warns in amber if any
    paragraph failed to reach a chapter. Green with no warning means nothing was
    lost.
11. **An edited chapter reaches a student.** Edit one word of a chapter in
    admin, then open that chapter as a student who has already read it. The edit
    should be there immediately. Before admin.js 3.12.0 it would have taken up
    to a week.
12. **App Check can reach reCAPTCHA from school.** On a school machine, open
    devtools and run `await ttbAppCheckStatus()`. `{ok: true}` with a token
    preview means the filter is not in the way. Do this on the actual district
    network, not at home — home is not the environment that will break.
13. **A cover actually uploads.** Open a book, pick any image under Cover Image,
    Save Metadata. It must say `cover saved` in the confirmation line. If it goes
    red naming Storage rules, §B.10 is why.
14. **A student cannot forge time.** In the console as a student, try writing
    `seconds: 999999` to your own `typing_logs` doc. Denied.

### B.13 Not done — queued, in Jake's priority order

Jake's stated ordering for the whole round was **cost, then student grades, then
stability, then everything else.** Keep it.

1. **⚠️ NOTHING FROM THIS ROUND HAS BEEN RUN.** Eight-plus files changed,
   verified by reading both sides of every interaction and by syntax check, not
   by execution. `game.js` has no test suite. §B.12 has the list; the three that
   would embarrass us most if wrong are the duplicate sprint rollup, "My
   classes", and a chapter edit reaching a student.
2. **Student-profile App Check test** (§B.4) — the one layer never checked, and
   the one that decides whether enforcement is safe.
3. **`storage.rules` 2.0.0** — paste it, or recreate `admins/{email}` as the
   quick restore. Cover uploads are broken until one of those happens.
4. **The part-id renumber bug.** Del / Merge ↓ / Split all end with
   `stagedChapters.forEach((ch, i) => ch.id = i + 1)`, which flattens part-aware
   ids: delete one chapter from Heidi and `1.01–2.09` becomes `1–22`. Needs the
   part scheme threaded through all three handlers. **Avoid those three buttons
   on a multi-part book until it is done.**
5. **Per-school book visibility + book requests.** Jake's design, agreed: a
   `hiddenBookIds` array on the SCHOOL document rather than a field on each book,
   so building admins get a narrow `allow update` on their own school and books
   stay untouched — no per-book write permission handed out, which preserves his
   line about not trusting anyone else to enter books correctly or legally. Plus a
   `bookRequests` collection: any staff can create, only super_admin reads and
   acts. Touches `firestore.rules`, `admin.js`, `index.html`, `game.js`.
   ⚠️ Becomes urgent the moment a second teacher wants a book Jake does not.
6. **Leaderboard scope toggle** — "My class / My school / Everyone". The
   `classId`/`schoolId` stamps have been written since `game.js` 3.9.0 so there is
   no backfill. Needs UI, two composite indexes, and a decision about what a
   student with no class sees. Jake is fine with the board staying global
   (initials only), so this is a nice-to-have.
7. **`ttb-shared.js`.** Biggest quality win, biggest test burden, and Jake's
   stated next big job. `getLocalDateStr`, `getWeekStart` and `formatTime` are
   duplicated across two files each; five separate HTML-escape implementations;
   three `loadGoals()` variants that disagreed about caching — which is exactly
   the class of bug this round spent its time on. ⚠️ Start it in a FRESH session:
   it touches every file, it is pure refactor with no functional change to verify
   against, and it needs precisely the discipline that degrades late in a long
   conversation.
8. **`index.js` 1.6.0 cannot ship.** It removes ~360 lines of abandoned
   custom-claims code, makes the practice rate limit a transaction, and stops a
   429 fanning out across six models. All of it needs `firebase deploy`, which
   needs a CLI. `package.json` also moves Node 18 → 22, since 18 is no longer
   accepted for Cloud Functions deploys. Whoever first gets CLI access should
   deploy this **before** anything else, because the pre-1.6.0 file exports seven
   functions the security rules no longer consult.
9. **`experimentalAutoDetectLongPolling`** — deliberately NOT done. Faster on
   Chrome and Mac, but the upside is latency only and the downside is Safari
   sign-in breaking on a day nobody can debug it. Wrong side of Jake's priority
   order. Do not "fix" it without a better reason than tidiness.

### B.14 Two corrections to Round 4's own first pass

Recorded because the next person will read the audit before the fixes:

1. **The SDK imports are not a cost.** The first pass flagged
   `firebase-storage.js` and `firebase-functions.js` loading on every page as
   billed egress. They come from `gstatic.com`. Google pays. It is a page-load
   latency item and nothing more.
2. **`typing_logs` has no TTL, and that is correct.** The first pass implied it
   should. Jake confirmed the 120-day policies on `typing_sessions` and
   `practice_sessions` are live. `typing_logs` deliberately has none — it is
   what reports grade from and losing a year of it loses a year of records. The
   26 single-field index exemptions in `firestore.indexes.json` 2.0.0 are what
   keep its storage growth flat instead of linear in field count.

---

## A. Round 3 — Adventure Mode out of alpha (2026-08-02)

**Shipped:** `game.js` 3.5.0 · `style.css` 3.2.0 · `adventure-renderer.js` **1.0.0** ·
`adventure.css` **1.0.0** · `versions.js` 1.2.0 · header-comment corrections to
`admin.js`, `lessons-admin.js`, `keyboard.js`, `staff-admin.js`, `index.js`,
`game.html`, `learn.html`.

### A.1 What the feature is

Adventure Mode existed since `game.js` 3.0.1 but was reachable only through
Settings → View, labelled "(alpha)". Jake's read after a term of use: it gets more
kid-attention than Classic does, so the better mode was the hidden one.

Now: **a full-screen splash on every new book**, two cards, each with an animated
SVG mock of the mode it selects. The choice is stored on the student's account and
follows them between machines.

### A.2 The three storage keys, and why each exists

| key | where | what it answers |
|---|---|---|
| `viewMode` | `users/{uid}/profile/info` + `localStorage.ttb_view` | which view |
| `viewRemember` | same document + `localStorage.ttb_viewRemember` | "stop asking me" |
| `ttb_splashBook` | **sessionStorage** | "already asked about this book, this tab" |

`viewMode` and `viewRemember` went into `profile/info` — the document
`loadInitials()` already read — so **the feature costs zero extra reads.** That
required splitting the read out into `loadProfileInfo()`, because the view has to
be known *before* `loadUserProgress()` while initials are wanted at the end of the
chain. Two consumers, one read. ⚠️ **Do not add a second profile document.**

Per-book suppression is sessionStorage on purpose: it's a tab-lifetime question,
costs nothing, survives a reload, and resets on a new tab. Firestore would be
paying to store an answer nobody needs tomorrow.

### A.3 Hot swap replaced `location.reload()`

The 3.4.x settings toggle persisted the choice and reloaded the page. Fine for a
deliberate settings change; **not** fine for the case the feature is actually for —
a student sits at a Chromebook they've never used, localStorage is empty or holds
whatever the last kid picked, and Firestore has the real answer. Reloading on every
new machine is not acceptable.

`applyViewMode(mode, { replay, persist, remember })` now mounts or unmounts the
renderer in place. Two things it has to do that aren't obvious:

- **Replay.** A renderer mounted mid-session missed `textLoaded` and draws
  *nothing* — that's its documented behaviour, not a bug. So the swap re-emits
  `textLoaded` + `positionSet`. The emit block was extracted out of `loadChapter()`
  into `emitTextLoaded()` so both callers share one copy.
- **Repaint the keyboard.** The renderer's keyboard skin rewrites `.key` inline
  backgrounds via MutationObserver. `unmount()` disconnects the observer but leaves
  the colours it already applied, so returning to Classic calls
  `colorKeyboardKeys()`.

⚠️ Failure is one-directional by design: if the module won't load we fall back to
Classic and **do not persist**. A student on a flaky connection must not end up
with a stored preference for a view that didn't load.

### A.4 Ordering in the auth handler — this is load-bearing

```
loadBookMetadata()  →  loadProfileInfo()  →  resolveViewMode()  →  loadUserProgress()
```

`loadUserProgress()` calls `loadChapter()`, which emits `textLoaded`. Resolving the
view first means the correct renderer is already listening and **no replay is
needed at boot**. Move `resolveViewMode()` after it and adventure boots to a blank
canvas until the next chapter.

### A.5 The splash does not touch `isModalOpen` / `isInputBlocked`

It's an overlay at `z-index: 200`, above `#modal`. Whatever the modal chain put
underneath it — the start modal, or the initials prompt if `loadInitials()` got
there first — is simply revealed when the splash closes. **No chain surgery was
needed and none should be added.** Keystrokes are swallowed by a capture-phase
listener with `stopPropagation()`, which cannot corrupt modal state the way
borrowing the flags could. Arrow keys move the selection, Enter commits.

`maybeShowViewSplash()` is called from the tail of `loadChapter()`, fire-and-forget.
That single insertion point covers every entry path — boot, the Settings book
picker, a library link — because the sessionStorage check is what makes it
once-per-book rather than once-per-chapter. It skips practice mode: an AI drill
isn't a book.

### A.6 Renderer 1.0.0

No rendering changes. One behaviour change: **the diagnostic overlay now needs
Ctrl+Shift+` or Cmd+Shift+`**. It was a bare backtick, which is a real key in the
virtual keyboard's `numRow` for both QWERTY and Dvorak — any student could open it
by typing. Harmless (read-only, typing continues) but it covers the canvas and
reads as a crash. Jake's call was that the information itself is fine to expose;
the modifier just stops it happening by accident.

### A.7 Version alignment — and the mechanism that keeps it

Every file carries its version twice: a runtime constant (what renders) and a
header comment (what a human reads). They kept drifting. `admin.js` was at header
v2.7.5 with constant 3.6.0 — **nine minor versions adrift**. That's ball-drop 5 in
§6, still happening.

Corrected everywhere. But the durable fix is **`versions.js` 1.2.0**, which now
parses the leading comment block of every JS file and flags a mismatch in
`index.html`'s build panel in amber. Discipline became detection.

Convention it relies on: **the first `v<semver>` in the leading `//` block is the
file's current version.** True for `// admin.js v3.6.0` and for a newest-first
changelog like `game.js`'s. Stylesheets are exempt — their comment *is* the source.
If you add a file, keep that shape or teach `readHeaderVersion()` about it.

⚠️ `CACHE_KEY` went to `ttb_buildVersions_v2` because entries gained a `header`
field. Don't reuse v1.

### A.8 Testing this solo — ~10 minutes, no students

1. **The splash appears.** Open any book. Two cards, Classic pre-selected (or
   whichever you last used). Arrow keys should move the selection; Enter commits.
2. **It's per book, not per load.** Reload the same book — no splash. Switch books
   in Settings — splash. Open a new tab — splash.
3. **Remember works.** Tick "Use this for every book", pick one, then switch books.
   No splash. Settings → untick "Ask me for each new book" → switch books → splash
   returns.
4. **Hot swap, no reload.** Type into the middle of a chapter, open Settings, flip
   View. The page must **not** reload and you must land in the same place, same
   position, with the world drawn. This is the whole point of A.3 — if the canvas
   is blank, `emitTextLoaded()` isn't firing on the swap.
5. **Classic keyboard un-tints.** Switch adventure → classic and check the virtual
   keyboard is back to bright finger colours, not parchment tones.
6. **The choice follows you.** Pick Adventure, then open the app in a private
   window / another machine and sign in as the same account. It should boot into
   Adventure with no reload and no flash.
7. **Different student, same seat.** Sign out, sign in as a second test account.
   Their preference must win over the localStorage left behind. Same shared-cart
   case as the `learn.js` position WAL.
8. **Backtick is safe.** Type a backtick in Adventure — nothing. Ctrl+Shift+`
   should still open the diagnostic.
9. **Build panel.** `index.html` → build info. Every file listed, no amber header
   warnings. Deliberately break one (edit a header comment) to confirm it flags.

### A.9 Book tags — age range + protagonist (admin.js 3.7.0, index.html 3.2.0)

Three new fields on `books/{id}`:

| field | type | meaning |
|---|---|---|
| `minAge` | number \| **null** | inclusive low end of the target reading age |
| `maxAge` | number \| **null** | inclusive high end |
| `protagonistGender` | string | `''` \| `female` \| `male` \| `multiple` \| `ensemble` \| `nonhuman` \| `unspecified` |

`null` means untagged and is a real stored value — **do not `|| 0` or `|| ''`
these on read.** `index.html` tests `typeof x === 'number'` for exactly this
reason.

**`unspecified` and `''` are different and both are needed.** `''` is "nobody has
looked at this book yet"; `unspecified` is "somebody looked, and the text doesn't
say". Collapsing them loses the distinction between a backlog item and a finished
judgement.

#### The overlap rule

A student asking for ages 9–12 wants every book whose range *touches* theirs. A
7–11 book is squarely relevant to a 9-year-old and a containment test would throw
it away. So:

```
book.minAge <= filterMax  &&  book.maxAge >= filterMin
```

with an absent filter end treated as unbounded. Two ranges overlap iff each starts
before the other ends. Verified against boundary cases (exact-match ranges,
single-year books, open-ended filters, adjacent-but-not-touching).

⚠️ **A book with no age range cannot participate in that test and is excluded
whenever an age filter is active.** That is correct but looks like a bug during
the tagging backlog, so `renderBooks()` counts what it hid and says so, with a
"Show all ages" escape. **Do not "fix" this by including untagged books in
filtered results** — that makes the filter meaningless, which was considered and
rejected.

#### Validation is on the PAIR, not the fields

`readAgeRange()` in `admin.js` rejects a half-range (min with no max) and a
backwards range. Both would save silently and then never match anything: no error,
no result, no clue. The library's `onAge` handler does the same on the student
side by pushing the other end along rather than rendering an empty grid.

The book picker in admin now prefixes each title with ● (tagged) or ○ (no age
range, shown amber) so the backlog is visible where the books are. There is **no
backfill** — every existing book needs both fields entered by hand.

### A.10 ⚠️ §9 item 1 (practice mode) was WRONG — corrected 2026-08-02

Underwood's §9 item 1 says practice mode "will not survive a real class period".
Blick repeated it without checking. Jake pushed back and was right on every point.
**Reading the code instead of the handoff:**

- **`index.js` already has the engine fallback chain.** `GEMINI_MODEL` +
  `GEMINI_FALLBACKS` — six models across **three separate quota buckets** (3.x,
  3.1, 2.5), looped with a catch. The "priority queue of engines" that got
  proposed this session **already exists and shipped in index.js v1.1**.
- **`DAILY_LIMIT = 5`**, enforced server-side in `practice_limits/{uid}`.
- **A cooldown already exists.** `PRACTICE_FIRST_UNLOCK = 150` (2.5 min of typing
  before the first practice) and `PRACTICE_COOLDOWN = 60` (1 min between
  subsequent ones), gated client-side on `practiceTypingAccumulator`.

And the observed load is nothing like the projection: ~20 students typing books
daily, 3–4 on lessons, **nobody ever requested practice unprompted**. Requests
self-stagger because a practice round takes 1–5 minutes to type.

**The failure mode is also benign** — the student sees a cool-down message and
keeps typing their book. No data loss, no cost. That is categorically unlike the
leaderboard problem, which was automatic, per-keystroke, and $34,400/year.

**§9 item 1 is downgraded from "will fail" to "worth a nicer error message
someday."** Do not resurrect it as a blocker.

**The generalisable lesson** — third time in three rounds: *this handoff is a
snapshot, not a fact.* §2 already says "diff before you assert anything about
what's deployed." Extend it: **read the code before repeating a risk claim.**

### A.11 What actually requires `firebase deploy` — and what doesn't

Recorded because it keeps getting re-litigated.

**Nothing in the normal workflow needs a CLI:**

| thing | how it ships |
|---|---|
| every `.js`, `.css`, `.html` | GitHub web upload → GitHub Pages |
| `firestore.rules` | paste into Firebase console → Publish |
| composite indexes | click the link in the failing query's console error |
| TTL policies | Google Cloud console (not Firebase) |
| book/lesson/roster data | the admin UI |

**One thing does:** `index.js`, the Cloud Functions source. Those functions are
**already deployed and running** — `generatePractice` and the staff-role helpers.
Editing `index.js` in this repo changes nothing until someone runs
`firebase deploy --only functions`.

So the question "can Jake deploy functions?" only ever matters when we want to
change a function's behaviour. **Right now we don't** — see §A.10; the fallback
chain we wanted is already live. Treat `index.js` as a read-only record of what's
running, and bump its version line if that ever stops being true.

### A.12 Language filter: regex + audit (admin.js 3.8.0)

**The list is now readable.** "Show every term" renders the whole effective
filter grouped by category, marks custom vs built-in and literal vs regex, and
highlights whichever terms fired on a test sentence you paste in. A filter you
can't read is a filter you can't trust — you can't tell a missing word from a
broken pattern until a student reads it aloud.

**Regex in the persistent list**, same `/…/` convention the free-text search
already used. One rule, two places.

⚠️ **Each term carries its own boundaries.** The old code wrapped the entire
alternation in `\b(...)\b`; that cannot mix with raw patterns, because `\b`
before `\w*` defeats the point of the pattern. `compileFilter()` now emits
`\bliteral\b` per literal and `(?:pattern)` per regex.

⚠️ **A bad pattern used to be able to break every scan.** One malformed entry in
`settings/languageFilter` would throw inside `buildFlaggedRegex()` and take down
the whole audit, not just its own term. Now: validated on entry, skipped
defensively at compile time, and *reported* in the audit view rather than failing
silently. `validateFilterTerm()` also rejects patterns matching the empty string
(they'd match everywhere) and bare slashes (which fell below the `isRegexTerm`
length floor and were being stored as literals that could never match).

#### The word list was regrouped and roughly doubled — 150 terms

`FLAGGED_WORD_GROUPS` = `slur` (34) · `profanity` (36) · `period` (62) ·
`anatomy` (18). `FLAGGED_WORDS` is still a flat array so nothing downstream
changed.

The old list's gap was not "boob" — it was the entire **`period`** category, which
is most of what a public-domain library actually contains. It had been written by
pattern-matching modern profanity.

⚠️ **DELIBERATELY OMITTED — do not "helpfully" add them:** `queer`, `gay`,
`savage`, `cock`, `dwarf`, `guinea`, `negro`. Every one appears constantly in
19th-century children's literature in an innocent sense ("a queer little man",
"the cock crowed", "a guinea" as money). Flagging them fires on nearly every book
and trains the reflex to click past warnings, which costs more than it saves. Put
them in the *custom* list for a specific book if a specific book warrants it.
There's a regression test for their absence.

**This is a teacher-awareness tool, not a censor** — the scan surfaces a word in
context and there's a per-book approve path. So a false positive costs one click
and a false negative costs a 6th grader reading it aloud in class. That asymmetry
is why the list is generous.

### A.13 Book list CSV export + balance report (admin.js 3.8.0)

Database Manager → **⤓ Export Book List (CSV)**. Columns: id, title, author,
genre, min_age, max_age, protagonist_gender, chapters, has_cover. Intended to be
handed to an LLM to check whether the library is lopsided.

⚠️ `csvCell()` does RFC4180 quoting. Book titles contain commas constantly
("Alice's Adventures in Wonderland, and Through the Looking-Glass") and a naive
`join(',')` corrupts every row after the first one that has one. The file is
written with a UTF-8 BOM so Excel doesn't mojibake curly quotes in author names.

**📊 Balance Report** is the same data on-page: protagonist and genre
distribution, plus **books available at each age from 5 to 16**, computed with the
same overlap rule the library uses. A per-year breakdown rather than a range count
because a library can look balanced by totals and still have nothing at all for
the 13-year-olds — that row turns red when it's zero.

### A.14 EPUB import: multi-work spine files (admin.js 3.9.0)

**The importer assumed one spine file == one chapter.** That holds for novels and
breaks for **collections**. Standard Ebooks — where most of this library comes
from — puts every short work of a collection in a single XHTML file as sibling
`<article>` / `<section>` elements, each with its own `<h2 epub:type="title">`.

Aesop's Fables is **284 fables in one 238KB file**. Under the old rule it imported
as ONE chapter with all 284 titles run together into the prose, and the only
alternative was splitting and naming 284 chapters by hand.

`findChapterUnits(doc)` returns units to split on, or `null` to keep the old
whole-file path. Three rules, each load-bearing:

1. **A unit needs both a heading and a `<p>`.** A heading with no prose is a part
   divider; a `<section>` of pure markup is neither.
2. **Only leaves count.** A unit containing another candidate is a container, not
   a chapter. This is what makes a parts-and-chapters book split into its
   *chapters* rather than its three *parts*.
3. **Two or more, or no split.** A single `<article>` wrapping one chapter is the
   normal case and must go down the untouched path.

⚠️ **Novels are unaffected** — one heading per file yields at most one candidate,
rule 3 declines, and the original code runs unchanged. Verified against four
non-splitting shapes plus a nested parts/chapters document.

Verified on the real file: **284 units, 284 chapters, 0 untitled, 0 empty**, all
89 morals preserved as second paragraphs. Median chapter 598 characters — about
five minutes at 25 WPM, which is a good block size by accident.

The status line now reports `(split 1 file into 284 sections)`. 284 chapters
appearing from a 7-item spine looks like a bug unless the importer says so — and
if a split is ever *wrong*, that line is where you'd notice.

⚠️ **Latent bug fixed on the way.** Title extraction used `hTag.innerText`.
`innerText` is layout-dependent and returns `undefined` on a `DOMParser` document
in Firefox, so `.trim()` would have thrown and killed the whole import there. Now
`textContent`. If you touch DOM parsing in this file, **never use `innerText` on
a parsed document.**

### A.15 The `review` word group — Jake's override (admin.js 3.9.0)

v3.8.0 deliberately withheld `queer`, `gay`, `savage`, `cock`, `dwarf`, `guinea`,
`negro` on false-positive grounds. **Jake overruled that**, and the reasoning is
worth keeping:

> He is not censoring, he is **rewriting**. A flagged passage gets reworded before
> students see it. The goal is "type without worrying about what they might read."
> The ELA teacher wants to talk about it; the typing teacher just needs them to
> type.

Under that use the cost asymmetry flips: a false positive is one edit, a false
negative is a student reading it aloud. So a term that fires often is still worth
firing.

⚠️ They live in their **own `review` group**, not folded into `period`, so the
audit view can label them "expect false positives". **Do not merge them.**

Real measurement — the full 284-fable text scans to **29 hits**: `cock` ×23,
`cocks` ×2, `simpleton`, `gaily`, `lunatics`, `gay`. Every one a rooster or an
archaic adverb. That's the tradeoff working as intended: a short review pass
instead of a surprise.

### A.16 One pass per book — the two-writer bug (admin.js 3.10.0)

Jake: *"If I click save metadata, it loses the chapters. If I upload the chapters,
it doesn't save the metadata. Every book has to be looked at twice."* Both halves
confirmed by reading the code, and both were worse than reported.

**Half one — Save Metadata destroyed editor state.** `saveTitleBtn` ended with
`loadBookList()` (added v3.6.0, to make the change visible in the picker).
`loadBookList()` ended with `bookSelect.selectedIndex = 1` plus a synthetic
`change` event. `bookSelect.onchange` hides the staging area **and reassigns
`activeBookId`** — to the first book *alphabetically*, not the one being edited.
So it didn't merely hide the staged chapters; it silently repointed the editor at
a different book.

⚠️ `loadBookList()` now takes `selectFirst` (default **false**), preserves the
current selection, and only fires `onchange` when it actually had to move.
**Passing `true` from a post-save refresh will reintroduce the bug.** Only the
boot call passes `true`.

**Half two — Upload All wrote a different, smaller document.** It never learned
about the v3.7.0 tag fields (my miss — I added them to Save Metadata only), read
genre as a raw `.value` so "✏️ Custom…" stored the literal `__custom__`, and still
carried the `if (author)` guards that v3.6.0 removed from the other path. A book
uploaded and never re-saved was silently untagged.

That genre read is the **fourth** instance of the read-the-field-properly bug
§11 predicted. There are now no known others; the shared reader is what stops a
fifth.

**The fix is structural, not two patches.** `readBookMetadataForm()` is the single
source of truth: it validates and returns the whole document, and both writers
call it. Upload All writes chapters *and* metadata, so a new book is finished in
one pass, and its status line names what it actually saved — going amber when the
age range or protagonist tag is still missing.

### A.17 Find & replace across a staged book (admin.js 3.10.0)

Generalises the Aesop cleanup. Three things a plain string replace gets wrong,
all three handled:

1. **Capitalisation** — `matchCase()` maps ALL CAPS → ALL CAPS, Capitalised →
   Capitalised, else lowercase. "Ass"→"Donkey" and "ass"→"donkey" are one rule.
2. **Articles** — `fixArticles()` corrects "an Donkey" → "a Donkey" (21 of the 169
   Aesop edits) and the reverse. ⚠️ It is letter-based, not sound-based, so it
   gets "an hour" and "a unicorn" wrong. Deliberate: rare per book, and visible
   in the preview before commit. Do not "fix" this with a pronunciation
   dictionary without a reason.
3. **Boundaries** — whole-word by default, `/…/` for regex. `\b` is only applied
   where the term actually begins or ends with a word character, otherwise
   searching for `—` with Whole words ticked matches nothing.

Preview first, commit second, and it only ever touches `stagedChapters` — nothing
reaches Firestore until upload, so a bad replace costs a re-parse, not a book.

**Regression-tested against the real Aesop text**: 148 replacements, zero
survivors, and all nine protected words (Grasshopper, passed, grass, compassion,
assembly, brass, glass, Peacock, cocked) at identical counts. It reproduces the
hand-run.

### A.18 The 284-chapter problem — confirmed by screenshot (2026-08-02)

Predicted in the last session, photographed in this one. Aesop's Fables (286
chapters after front matter) is the first book to exceed ~40 and it broke **three**
things. Jake's screenshots are the record.

#### 1. Classic book progress bar — and it was a latency bug, not a cosmetic one

`initBookProgressBar()` built **5 DOM nodes per chapter** (segment, divider, inner
fill, inner marker, label) — ~1,430 nodes for Aesop, in a ~280px strip. Under one
pixel each with a 1px divider inside it, so it rendered as a grey hairline smear.

That was the visible half. The expensive half: `updateProgressBars()` does **four
`getElementById` calls per chapter, on every keystroke**. 1,144 DOM lookups per
character typed, on a Chromebook. ⚠️ **This is why the fix matters more than it
looks** — a cosmetic bug was hiding a typing-latency bug.

Above `BOOK_BAR_MAX_SEGMENTS` (40) the bar renders condensed: one track, one fill,
one marker. Three nodes, three lookups per keystroke, flat regardless of chapter
count. The label carries what the segments used to — `Ch 12 / 286`.

`bookProgressFraction()` treats chapters as equal width. ⚠️ They aren't, and that's
deliberate: per-chapter lengths aren't in the metadata document and reading 286
chapter documents to find out would cost more than the honesty is worth. Position
*within* the current chapter is interpolated from real characters, so the marker
still moves as you type.

#### 2. Adventure chapter map — same disease

284 dots at 4.2px radius down a ~500px strip is 1.8px of room each. It rendered as
a solid brown caterpillar. Above `MAP_MAX_DOTS` (40) the map draws a continuous
route — faint for the untravelled remainder, inked for the walked part — with
ticks every 10%, start/finish caps, the pulsing gold "you are here", and a
`Ch 12 / 284` label.

⚠️ The condensed branch **returns before the per-chapter segment loop**, not after.
That loop draws 14 line steps per chapter — ~4,000 path segments per frame at
60fps for Aesop — and the condensed route paints over all of it. Putting the
branch after the loop would fix the picture and keep the whole cost. It was
written that way first; don't undo it.

#### 3. The splash preview was drawn from memory, and it showed

Jake: *"Your runner is in the words rather than on them, and it's just a little
sloppy."* Correct on both counts. Redrawn against an actual screenshot:

- **The figure stands ON the letters.** Letters are the walkable surface
  (renderer v0.2.6); the preview had the figure's legs overlapping the glyphs of
  "great". Feet now sit at cap height above the text baseline.
- **The strips were wrong.** LEFT is the chapter close-up (rubric route, pilcrow
  ticks, gold marker); RIGHT is the book map. The preview had one map on the
  right and nothing on the left.
- The right-hand map is drawn **condensed**, since that's now what a real book of
  any size looks like.
- The gravestone sits on a ground line instead of floating mid-air.

**Lesson for the next instance:** the previous preview was built from reading the
renderer source. That was enough to get the palette right and the layout wrong.
Ask for a screenshot before drawing a picture of something that already exists.

### A.19 Chapter picker filter (game.js 3.7.0) — Tier 1 closed

The other half of the 284-chapter problem. A `<select>` with 286 options and no
search means finding "The Donkey and the Lapdog" is a scroll, not a lookup.

Above `CHAPTER_FILTER_MIN` (25) both chapter pickers — Settings and the Game
Genie — gain a filter box. It matches the **visible label** (so it hits number
and title together) or a bare chapter number exactly, reports "3 of 286" /
"no matches", and Enter means Go.

⚠️ When nothing matches, the option's value is `''` and both Go handlers bail on
a falsy value. Without that guard, "No chapters match" is a selectable target and
Go tries to load `chapter_`.

#### The bug found on the way: three drifted copies

There were **three** chapter-option builders. Two of them populate *the same
`<select>`* — the initial Settings render and the rebuild that runs after a book
switch — and they disagreed:

| | initial render | after switching books |
|---|---|---|
| label | `✓ Ch. 4: Title` | `Chapter 4: Title` |
| completion ticks | yes | **no** |

So switching books silently relabelled the dropdown and dropped every ✓. The
third copy lived in the Game Genie with yet another format.

All three now call `buildChapterOptions()`. This is the same disease as the admin
metadata form in A.16 — two writers for one thing, drifting quietly — and it is
worth treating as a pattern in this codebase rather than two coincidences. **When
you find a second copy of something, delete it; don't sync it.**

Tested against the real 284-fable list: full render, title search, exact number
match, no-match handling, completion ticks, and selection marking.

### A.20 Tier 3 (game.js 3.8.0) — student school picker + practice gating

#### The school picker

Settings → School, in the same column as Initials. Until now a student's building
was set only by staff, so a student nobody had added yet typed with `schoolId: ''`
and was **invisible to every building-scoped report**, with no way to say where
they were.

⚠️ **It goes read-only the moment they have a `classId`** — it then shows the
school name and "set by your teacher". A student must not be able to overrule a
teacher's assignment, and making the teacher's value win means the picker
self-corrects the instant an assignment happens. Do not "improve" this into an
always-editable control.

⚠️ **"No school" is a permanent valid state, not an unfinished one.** Never nag,
never block, never auto-select the first school. That's the whole reason the
feature was requested — Jake's son isn't in a building.

**No rules change was needed and none should be.** `match /users/{uid}` already
has `allow update: if request.auth.uid == uid`, and `schools` is
`allow read: if signedIn()`. If a future change here looks like it needs a rules
edit, the design is wrong.

**What a student can actually do by setting this:** stamp their own *future* logs
with a building, making themselves visible to that building's staff. They gain no
read access. Worst case is picking a school they don't attend, which puts their
own name in that school's report — visible, traceable, fixable by reassignment.
Better than the status quo, where an unassigned student is invisible to everyone.

⚠️ `saveStudentSchool()` clears `GOALS_CACHE_KEY`. That cache carries `schoolId`,
so without the clear a student would keep stamping the old building onto logs
until it expired. Schools themselves are cached 24h (`SCHOOLS_CACHE_KEY`) — one
read per student per day at most.

#### Practice gating (closes §A.10)

Three fixes, all wording-adjacent but the first is a real lie removed:

1. **"Practice unlocks in ~2m" never said what unlocks it.** The counter
   (`practiceTypingAccumulator`) only advances *while keys are being pressed*, so
   sitting still does nothing. Now: "Practice unlocks after 40 more sec of typing".
2. **`Math.ceil(seconds/60)` turned 5 seconds into "~1m"**, which reads as a stall.
   Now shows seconds under a minute.
3. **The daily cap was only discovered by failing.** `index.js` enforces
   `DAILY_LIMIT = 5` server-side, and the client offered the button regardless —
   click, wait for a round trip, read an error. `practiceRemainingToday` is now
   captured from each successful call and from a `resource-exhausted` failure, and
   the button is replaced with "Practice comes back tomorrow" before it's offered.
   `null` means not-yet-known and still offers the button, so a fresh session
   never wrongly withholds it.

### A.21 Header budget + CHANGELOG.md (2026-08-02)

Jake: *"we're getting lost in the comments at the top... I notice that game.js is
going 3.5, 3.8, 3.7, 3.6, 3.4.2."*

Both true, and the ordering was **entirely self-inflicted this session**. Every
`str_replace` that added a version entry anchored on the *previous* newest entry
and therefore inserted one slot too deep. Four sessions, four misplacements,
nobody noticed — because nobody reads a 122-line comment, which is precisely the
problem.

**The rule, adopted from Jake's other project: 60 lines and 6 version entries per
header, newest first.** Everything older lives in `CHANGELOG.md`, per file.

Before → after: `game.js` 122→32, `adventure-renderer.js` 156→33, `admin.js`
63→29, `learn.js` 48→27. Nothing was lost; the old headers were moved
programmatically, not retyped.

⚠️ **A header now has one job beyond the changelog: the load-bearing
invariants.** Each of the four carries a "do not simplify these" block — the WAL
flush event, the leaderboard cache, `loadBookList(selectFirst)`, `merge:true` on
`saveProgress`, never `innerText` on a parsed document. Those were previously
scattered through 100+ lines of history where they were invisible. **If you trim
a header further, trim changelog entries, never invariants.**

**Enforced in `versions.js` 1.3.0.** `auditHeader()` reports over-budget,
over-count and out-of-order to `index.html`'s build panel in red — the only place
a check can run without a CLI. Sabotage-verified: fires on 7 entries, on 61
lines, and on the exact scramble `game.js` had; does not count version numbers
appearing inside an entry's prose. `CACHE_KEY` bumped to `_v3`.

**Writing a new entry:** put it at the TOP, drop the oldest into `CHANGELOG.md`,
and keep it to two or three lines. If it needs more room, it needs the changelog.

### A.22 Not done — queued

0. **Tiers 0-3 are all closed as of 2026-08-02.** The roadmap is done. What's
   left below is hygiene, plus whatever the school year turns up.

⚠️ **Do not "fix" the `authDomain` mismatch.** The app is served from
`typethatbook.misterwilson.org` (GitHub Pages, see `CNAME`) while
`firebase-config.js` sets `authDomain: "typethatbook.firebaseapp.com"`. Firefox
logs a partitioned-storage notice about the cross-origin auth iframe on every
load; it is informational, not an error. Changing `authDomain` to the custom
domain looks like the fix and **breaks sign-in completely** — it requires serving
Firebase's `/__/auth/*` handler paths, which GitHub Pages cannot do. `game.js`
uses `signInWithPopup`, which is the variant that survives third-party cookie
blocking; `signInWithRedirect` is the one that doesn't. Leave it alone.

⚠️ **Firestore index errors appear a beat AFTER the click**, once the query
round-trips. Checking the console immediately shows only the auth notice above.
And `fetchLeaderboard()` catches its own failure — the weekly-board index link
arrives as `console.warn("Fetch leaderboard failed:", e)`, a yellow warning, not
a red error. Both of these cost Jake real time on 2026-08-02.
1. **Age/protagonist tags have no backfill.** Every existing book needs both
   entered by hand. The ○/● markers in the admin book picker are the worklist,
   and the Balance Report counts what's still missing.
2. A nicer practice-mode cool-down message (§A.10). Low priority.
3. `firestore-rules.test.mjs` still tests the v1.x claims model (§9 item 3).

---

## 0. Round 2 — read this first if you're picking up the lesson work

Jake reported that his test students last year **never complained but never got
far**, stalling out mid-curriculum and blaming their own typing. He was skeptical.
He was right to be.

The audit is written up in full in **`PEDAGOGY-AUDIT.md`** — research comparison,
the gate arithmetic, and the agreed change list. Do not re-derive it. The short
version is six mechanisms in `learn.js`, none of which are about student ability:

1. **One gate applies to every step.** No per-step gates exist in the schema, so a
   new-key `key_pattern_auto` drill is graded at the same WPM as a closing prose
   step. Random letters type far slower than prose, so **the lesson's hardest gate
   is its first step.** The difficulty curve runs backwards.
2. **Step length, not gate height — this is the big one.** The authored gates are a
   sensible per-unit ramp (10 WPM/90% at home row up to 25/90% at graduation); the
   defaults in `learn.js` are barely used. But **six steps are longer than a
   10-minute typing block.** `u6_l2` step 1 is 789 characters, which at its own
   20 WPM gate is 10.5 minutes of flawless typing. And the lesson WAL persists
   `statsData` only — **not** `drillPos` or `currentStepIdx` — so the bell erases
   the whole step *and* any cleared-but-not-final steps. A student who reaches such
   a step is in a closed loop: ten minutes, lost, same step from scratch tomorrow,
   forever. Lowering `minWPM` does not help; they still run out of clock. Expected
   stall point at realistic speeds: **unit 4**. Full table in `PEDAGOGY-AUDIT.md` §3.2.
3. **Grade C fails.** Both gates must be met, so 14 WPM at 100% accuracy fails
   while 15 WPM at 85% passes. Worse: `chars++` fires *before* the correct/incorrect
   branch (~line 992), so **errors inflate the WPM numerator**. Three deliberate
   mistakes convert a failing perfect run into a pass. Verified arithmetically.
4. **The graded timer never pauses.** `stepSeconds` increments whenever
   `drillPos > 0`, unconditionally. `LEARN_IDLE_THRESHOLD` gates the time-on-task
   counter but not the graded one, so a 15-second interruption makes the gate
   unreachable and the app then says *"just a little faster!"*
5. **Failing the last step replays the whole lesson** — `showLessonResultModal()`'s
   failure path calls `startLesson()`, which resets `currentStepIdx = 0` and
   re-shows the intro. Expected drills to clear a 5-step lesson at a 50% per-step
   pass rate: **18** (floor is 5). At 30%: **48**.
6. **All of it was invisible.** `saveProgress()` runs only from the final step's
   result modal, and only when the grade isn't F. A student stuck on step 2 writes
   **no `lessonProgress` record at all**, which renders in the admin per-student
   grid as `not started` — identical to a student who never opened it.
   `reports.html` never reads `lessonProgress`.

**What shipped in Round 2:** the lessons JSON export, then **Batch A in `learn.js`
v2.0.0**, which fixes mechanisms 1–5 above. Mechanism 6 (invisibility) is Batch B and
is still outstanding — see §11.

⚠️ **Do not re-derive or re-fix mechanisms 1–5.** They are closed. The list above is
kept as the record of *why* the code looks the way it does, not as a to-do.

---

## 1. What Round 1 was for

Jake asked whether TypeThatBook could serve **7,000 students a year** (~467
simultaneous at peak) without costing money. It could not — one function projected to
**$34,400/year** on its own. It now costs about **thirty cents a year**.

Midway through, colleagues at other schools wanted in, so multi-school support with
per-teacher permissions got built too.

| | before | after |
|---|---|---|
| Reads/day @ 2,335 active students | 326,960,710 | **29,194** (58% of free tier) |
| Writes/day | 268,525 | **21,015** (105%) |
| Egress/day | ~82 GB | trivial |
| `typing_sessions` docs/year | 8,170,000 | ~409,000 |
| **Cost/school year** | **~$34,400** | **~$0.32** |

---

## 2. Deployment status — verified 2026-07-31 by diff

Jake uploaded his live repo; every file was compared against source.

### ✅ Live and current

`game.js` 3.4.2 · `learn.js` 1.7.1 · `lessons-admin.js` 1.5.1 · `versions.js` 1.1.0 ·
`firebase-config.js` 1.1.1 · `index.html` 3.0.1 · `admin.html` · `reports.html` ·
**`firestore.rules` 2.1.0 published** (byte-identical to source, including the audit
fixes) · `index.js` (functions source in repo; only `generatePractice` is deployed)

Also done: the **budget alert is in place** and has been for a while — I nagged about
it repeatedly after it was already handled, see §6. Jake's own `staff/{uid}`
super_admin document exists and works, confirmed by a report that returned data.

`learn.js` is actually **ahead** of source: Jake fixed a header comment still reading
v1.7.0 when the constant said 1.7.1.

### ✅ Round 1 is fully deployed — verified again 2026-08-01 by diff

**The "one revision behind" table that lived here was stale and is deleted.**
It claimed `admin.js` 3.1.0 / `staff-admin.js` 2.1.0 were live with 3.2.0 / 2.2.0
pending. Jake had already uploaded both. Diffing his live repo against Underwood's
final batch: **byte-identical**, `ADMIN_VERSION = "3.2.0"`,
`STAFF_ADMIN_VERSION = '2.2.0'`.

Dvorak repeated the stale claim without diffing the files Jake had provided in the
same conversation — which is ball-drop #4 in §6, committed by the instance that had
just read §6. The lesson generalises: **this section is a snapshot, not a fact.
Diff before you assert anything about what's deployed.** Jake's uploads are the
evidence; this table is hearsay.

### 🆕 Round 2 — ready to upload, not yet deployed

| file | live | ship | what changed |
|---|---|---|---|
| `admin.html` | 2.7.6 | **2.9.0** | Export JSON panel; "Find stuck" button; inline Save Metadata status |
| `admin.js` | 3.5.0 | **3.6.0** | chapter Update &amp; Next; editable word list + free-text search; third provenance fix |
| `admin.html` | 2.9.0 | **3.0.0** | Update &amp; Next button; Word list &amp; search panel |
| `index.html` | 3.0.1 | **3.1.0** | persistent School/Library toggle in the header |
| `learn.js` | 1.7.1 | **2.1.0** | **Batches A+B.** Runs/chunking, position WAL, accuracy-gated advancement, net WPM, idle-aware clock, run-level progress records |
| `lessons-admin.js` | 1.5.1 | **1.7.0** | export + gate audit (1.6.0), stuck-student scan (1.7.0) |
| `learn.html` | — | **2.0.0** | pre-JS footer text only (learn.js overwrites it at runtime) |

⚠️ **`learn.js` 2.0.0 has not been run in a browser.** Verified by parse, static
identifier sweep, and executing the pure functions against the real 47-lesson export.
Everything DOM-facing — resume-after-bell, the pip row at 10+ pips, modal button
wiring — needs hand testing. §8 lists how to test each piece solo.

`admin.js` needs no change — it already reads `window.LESSONS_ADMIN_VERSION` for
the footer.

### 📄 Now in the repo (added 2026-08-01)

`firestore.indexes.json` and `firestore-rules.test.mjs`. Neither is deployable
without a CLI. Committed because:

- **`firestore.indexes.json` is the only written record** of the three composite
  indexes (`typing_logs` × schoolId+date, `typing_logs` × classId+date,
  `leaderboard` × weekStart+totalSecondsWeek) and both TTL field overrides
  (`typing_sessions.expiresAt`, `practice_sessions.expiresAt`).
- **`firestore-rules.test.mjs` is confirmed wrong, not merely unrun.** Its header
  says v1.1.0 and it seeds roles as auth-token claims via
  `authenticatedContext(uid, { role: 'super_admin', … })`. `firestore.rules` v2.1.0
  reads `staff/{uid}` documents and ignores the token entirely, so every
  authorization assertion in the file tests a mechanism that no longer exists.
  It is committed as the starting point for a rewrite, not as a passing suite.

---

## 3. ⚠️ Hard constraints — read before writing any code

**Jake has no command line.** No `firebase deploy`, no `gcloud`, no emulator. He
uploads files to GitHub and clicks in the Firebase / Google Cloud consoles. That's it.

I built an entire Auth-custom-claims role system across two rounds before finding
this out, because I never asked. Claims can only be written by the Admin SDK → a
Cloud Functions deploy → a terminal. **Anything that isn't (a) a file on GitHub or
(b) a console click is not shippable.** Ask before assuming otherwise.

**Version constants, not header comments.** Every file has a runtime constant that
renders on the page; the header comment is decoration. I bumped comments and left
constants alone, so Jake deployed "v3.4.0" and the page said 3.2.0. Table in §7.

**One bump per shipped release, not per edit.** I took `reports.html` 2.4.1 → 2.7.0
across three edits nobody deployed in between. That destroys the version's only
purpose as a marker of what's actually running.

**Never walk a deployed version backwards.** I renumbered several files downward on
the false belief that nothing was deployed. It was. Corrections go *forward*:
`admin.js` 3.1.0 → 3.2.0, not down to 2.8.1.

**`experimentalForceLongPolling` in `firebase-config.js` is load-bearing.** It fixes
Safari's CORS block on Firestore's WebChannel transport. Not leftover debug code.

**`game.js` is 4,800 lines with no test suite.** Changes get verified by hand.

---

## 4. Architecture — the three things that matter

### The write-ahead log (`game.js` v3.4.0+, `learn.js` v1.7.0+)

`saveProgress()` used to fire on every `.`, `!`, `?` and newline, writing **three
documents** each time. Now every sentence records *everything* synchronously to
`localStorage`, and Firestore gets a batched flush every 5 minutes plus on
`visibilitychange: hidden`.

**This is more durable than what it replaced.** The old code lost everything since
the last punctuation mark if the tab died; the WAL loses nothing — `walRecover()`
replays it on next load. Jake confirmed in production: typed, closed the tab, opened
a new one, resumed exactly.

`visibilitychange: hidden` is the load-bearing event. `beforeunload` does not fire
reliably on Chromebooks.

### The leaderboard (`game.js` v3.3.0+)

`fetchLeaderboard()` read the **entire** collection to build four top-10 lists, and
`updateLeaderboard()` busted its own cache before calling it — on every sprint end,
which at the default 30-second sprint is 20× per ten-minute block. That single path
was 140,020 reads per student per block: ~$34,300/year.

Now four `orderBy` + `limit(15)` queries, cached 10 minutes and **not** busted on the
hot path, with placement computed locally against top-10 cutoffs persisted in
`localStorage`. Nine reads per block. Thresholds only drift upward, so staleness costs
a missed celebration, never a false one.

### Roles in documents, not claims (`firestore.rules` v2.0.0+)

`staff/{uid}` documents that rules read via `get()`. Two consequences, both good: role
changes are **instant** (no token refresh), and there's one copy of the truth so
nothing can drift.

- **`teacher`** — `readScope` is a **per-person** setting (`own_classes` default, or
  `building`), chosen by their building admin. Writes only classes they're on.
- **`building_admin`** — whole building; any class in it; grants teachers in it.
- **`super_admin`** — everything. **Not grantable through the app**, deliberately.

Class membership reads from `classes/{id}.teacherUids`, never a list on the staff
record. Nothing to sync, no cache, no stale claim — and since a teacher can only
create a class with themselves on it and only edit one they're already on,
`teacherUids` is self-maintaining and can't be used to widen their own scope.

**People arrive three ways, and nobody browses a user list:** they sign in (students,
zero setup); an admin grants a role by email via `pendingStaffRoles` (works whether or
not they've ever signed in); or they request access from `admin.html`, writing
`staffRequests/{uid}`. A browsable directory would mean a queryable district-wide list
of student names, which is why it doesn't exist.

---

## 5. The bootstrap chicken-and-egg — permanent, by design

Rules identify admins by a `staff/{uid}` document **and** forbid anyone — including a
super_admin — from creating or editing their own. That second half is what stops an
admin quietly widening their own access, so it stays.

Consequence: **the first `staff` document must be written in the Firebase console**,
which bypasses rules. One time, forever.

This cost Jake an evening. `admin.js` has an `ADMIN_EMAILS` fallback granting
super_admin **in JavaScript only** — rules never heard of it — so the UI showed a
Schools panel while Firestore rejected every write. `admin.js` v3.2.0 now renders an
orange banner with his UID pre-filled and the exact field list, and the Schools form
disables itself. **Any redesign must preserve the no-self-edit property.**

---

## 6. Balls dropped — honest accounting

**Mine, and they cost real time:**

1. **Never asked about deploy tooling.** Two full rounds of claims-based work thrown
   away. One question would have prevented it.
2. **Nagged about the budget alert repeatedly when it was already done.** Never
   asked — just kept asserting it was outstanding. Check before pressing.
3. **Renumbered versions downward** assuming nothing was deployed, while a screenshot
   in the conversation proved otherwise.
4. **Kept reciting a stale "not deployed" checklist** instead of reading the evidence
   Jake had already given me. He had to point it out.
5. **Bumped header comments instead of runtime constants**, so a deploy silently
   reported the old version.
6. **Told Jake he couldn't test without students.** He can test nearly all of it solo
   in twenty minutes — §8.

**His, all minor:**

1. `admin.js` and `staff-admin.js` uploaded one revision early — reasonable given how
   many times I revised them mid-session.
2. `firestore.indexes.json` not committed. The only record of the index and TTL
   definitions.
3. In-repo docs one version behind.

**Neither of us:**

- **Practice mode is still unaddressed and will fail at scale.** §9, item 1.

---

## 7. Version constants — bump these, not the comments

| file | constant |
|---|---|
| `game.js` | `const VERSION` (~line 78) |
| `learn.js` | `const LEARN_VERSION` (~line 56 after the 2.0.0 header) |
| `admin.js` | `const ADMIN_VERSION` (~line 10) |
| `lessons-admin.js` | `window.LESSONS_ADMIN_VERSION` |
| `staff-admin.js` | `window.STAFF_ADMIN_VERSION` |
| `keyboard.js` | `export const KB_VERSION` |
| `adventure-renderer.js` | `export const RENDERER_VERSION` |
| `firebase-config.js` | `export const CONFIG_VERSION` |
| `versions.js` | `export const VERSIONS_VERSION` |
| `index.html` | `const INDEX_VERSION` |
| `style.css` / `adventure.css` | `body::before` / `::after` `content` |

`index.html`'s **build info** panel fetches and parses these out of the deployed
files — deliberately not a shared manifest, because a stale cached `game.js` reading
its version from a manifest would report the new number while running old code.

Still hardcoded in `<title>` and not driven by a constant: `game.html`, `admin.html`,
`reports.html`. `learn.html`'s `<footer>` is hardcoded too, but `learn.js` overwrites
it at runtime from `LEARN_VERSION` — so it only shows during the pre-JS paint. Keep it
in sync anyway; a stale number there is the first thing you see if the module fails
to load.

**localStorage keys** (not versioned, but breaking their shape breaks recovery):
`ttb_learnwal_v1` (stats write-ahead log) and `ttb_learnpos_v1` (run position, added
2.0.0). Both carry an explicit `v` field — bump it rather than silently changing the
payload shape, or a mid-run student on the old shape gets a corrupt resume.

---

## 8. Jake can test almost all of this solo

He believed he couldn't without students. Not true:

1. Staff tab → Schools → create the school
2. Classes tab → create a class with that `schoolId`
3. Students → Add One Student → his own email
4. Type a minute in `game.html`
5. Reports → select **that school**, not "All schools" → Generate

Step 5 is the composite-index test. His first report used "All schools", which is a
date-range-only query needing no index — that's why it looked clean and proved less
than it appeared to.

That sequence exercises school creation, class creation with `teacherUids`,
single-student assignment, `schoolId` stamping, the composite index, and scoped
reporting. A second Google account covers the request-access flow and cross-building
denial. Only "467 users at once" is genuinely untestable before September.

**Expect an empty report the first time he filters by school.** His existing log was
written with `schoolId: ''` because he had no class then. Historical logs can't be
backfilled from the browser — `typing_logs` rules allow writing only your own
(`docId.split('_')[0] == request.auth.uid`), by design. Old logs live under "All
schools" only.

---

## 8b. Testing `learn.js` 2.0.0 solo — the paths that were never executed

Everything below is DOM-facing and was verified only by reading. Roughly 15 minutes,
no students required. Use the admin genie (backtick) to warp rather than grinding.

1. **Chunking is visible.** Open `u6_l2`. The step label should read
   `Capitalization Drill (1/6)` and the pip row should show **10 pips**, not 2.
   Confirm the pips stay legible at that width — `.step-pip` is `flex: 1`, so they
   thin out rather than wrap, but 10 is more than has ever rendered.
2. **Resume after the bell — the whole point of the batch.** Start any long run,
   type 20+ characters, then switch tabs (don't reload). Come back, go to the map,
   re-enter the lesson. It should skip the intro and drop you back mid-run with your
   WPM and accuracy carried over. Then repeat with a hard reload instead of a tab
   switch. Then repeat having typed only 3 characters — that one should *not* resume
   (below the 5-char floor), which is intended.
3. **Position is uid-scoped.** Resume something, sign out, sign in as a different
   test account, open the same lesson. It must start clean. This is the shared-cart
   case and it is the one with a real privacy smell if it's wrong.
4. **Accuracy-only drills.** On any `key_*` run, the results modal should show a
   Target of `85%+` and **no Target WPM tile**. Type deliberately slowly and
   accurately: it should pass. Type fast and sloppy: it should not.
5. **C advances.** On a `word_list` or `sentence_list` run, type accurately but
   slowly. Expect grade C, the title "✓ Lesson Complete!", and the next lesson
   unlocking on the map.
6. **A failed run retries the run.** Fail the *last* run of a multi-run lesson on
   accuracy. "Try Again" must return you to that run — not to the intro animation.
7. **The clock pauses.** Start a run, type a few characters, then sit for 20 seconds
   without touching anything, then finish. The reported WPM should be roughly what
   you actually typed at, not halved.
8. **Net WPM.** Deliberately mash wrong keys for a while. WPM should *fall*. Under
   1.7.1 it rose — that was the exploit.
10. **Run records appear.** Fail a run 3+ times without finishing the lesson, wait
    ~5 min or switch tabs to force a flush, then Students → **⚠ Find stuck**. You
    should appear, with the run number and failure count. Under 1.7.1 this produced
    no record at all. Then finish that lesson and re-scan: you should drop off the
    list, and the per-student grid should still show the run data (that's the
    `merge: true` fix — without it, completing a lesson wiped it).
11. **Pips.** Open `u4_l3` or `u6_l2` — the worst cases at **10 runs each**. The bar
    is `#step-progress-bar` at the very top of the drill view, above the step label.
    Expect ten thin segments filling the width, darkening left-to-right as you go.
    It computes to ~27px per pip on a phone and ~68px on an iPad, so this should be
    a non-event; I flagged it only because ten had never rendered. Failure would look
    like a second row wrapping underneath or segments collapsing to invisible —
    neither is possible with `flex: 1` and no `flex-wrap`, so if you see it, the CSS
    changed underneath us.
9. **Remediation still works.** Fail something badly enough to get the practice-missed
   -keys button, then click it. It should run a drill and return cleanly.

If 2 or 3 misbehave, the suspects are `peekPendingRun` / `takePendingRun` in
`learn.js` and the `visibilitychange` handler near the bottom.

## 9. Open work, in priority order

1. **Practice mode will not survive a real class period.** `maxInstances: 5` and
   Gemini free tier ~10–15 requests per **minute** versus thirty kids clicking at
   once. The fix is the paragraph-pool cache in `SCALE-PLAN.md` Problem 5 — but
   that's a Cloud Function, so Jake can't deploy it. CLI-free options: throttle
   client-side in `game.js`, or disable practice mode. **Unresolved; his decision.**
2. ~~**Three composite indexes and two TTL policies not yet created.**~~
   ✅ **DONE 2026-08-02.** Both TTL policies created (`typing_sessions.expiresAt`,
   `practice_sessions.expiresAt`, offset 0), both single-field index exemptions
   added, and all three composite indexes built — verified against
   `firestore.indexes.json` field by field. `TTL-GUIDE.md` documents the whole
   runbook including the console-label discrepancies that cost time.
   Historical note for whoever reads the old text below: definitions
   live in `firestore.indexes.json` in the repo. Indexes give
   click-to-create links on the first failing query. TTL is in the **Google Cloud**
   console, not Firebase — see `TTL-GUIDE.md` (which now genuinely exists),
   including why pre-v3.4.0 documents will never be collected.
3. **`firestore-rules.test.mjs` is wrong, not merely unrun.** Now committed (§2) so
   the rewrite has a starting point. It tests the v1.x claims model that v2.x ignores
   entirely; needs rewriting to seed `staff/{uid}` documents.
   Jake can't run it either way. The manual sequence in §8 plus the two extra checks
   at the end of `RULES-AUDIT.md` is the practical substitute.
4. Student school picker — optional, settings + sign-up, never forced. Jake wants his
   son able to join without landing in a building; `schoolId: ''` is already a valid
   permanent state.
5. Drive `game.html` / `admin.html` / `reports.html` titles from constants.
6. Remove the `ADMIN_EMAILS` / `BOOTSTRAP_EMAILS` fallbacks once staff records settle.

---

## 10. Document map

⚠️ **This table used to list eight documents. Six of them did not exist.**
Corrected 2026-08-02 after Jake went looking for `TTL-GUIDE.md` and couldn't find
it — I had cited it twice in the same session without checking. They appear to
have been written in earlier conversations and never committed; the repo is the
only thing that survives a session, so an uncommitted document is a lost one.

**In the repo:**

| doc | what it's for |
|---|---|
| `README.md` | what the project is; file map, data model, version table |
| `HANDOFF.md` | this file |
| `PEDAGOGY-AUDIT.md` | **Round 2.** Why students stalled in `learn.js`. Research comparison, gate arithmetic, agreed change list |
| `TTL-GUIDE.md` | ✅ **rewritten 2026-08-02.** TTL policy setup, the billing arithmetic, the pre-v3.4.0 gotcha, and the composite indexes |
| `firestore.indexes.json` | the only machine-readable record of the three indexes and two TTL field overrides |

**Referenced but MISSING — do not cite these as if a reader can open them:**

| doc | what was in it | recoverable? |
|---|---|---|
| `SCALE-PLAN.md` | the 7,000-student cost analysis; "Problem 5" is the practice paragraph-pool design | partly — §1 of this file has the headline numbers |
| `RULES-AUDIT.md` | the overnight audit, three bugs found tracing 103 Firestore ops | partly — the three fixes are described in §2 and are live in `firestore.rules` |
| `SETUP-NO-CLI.md` | the ordered console-only setup runbook | §8 covers the same ground for testing; a fresh-project runbook would need rewriting |
| `MULTITENANCY.md` | original design doc for the claims model | superseded anyway — §4 describes the document-based model that replaced it |
| `SETUP-MULTISCHOOL.md` | obsolete, assumed a CLI | no loss |

**Rule going forward:** if a session produces a document, it ships in the same
batch as the code. Referencing a file that isn't in the repo is worse than not
writing it — it sends the next person looking for something that was never there.

---

## 11. Round 2 open work — the lesson scoring rewrite

**Agreed with Jake, designed, not yet written.** Blocked on one thing only: he
needs to run the new export and hand over the curriculum JSON, because the actual
authored gates and step counts have never been visible outside the admin UI.
Do not start editing `learn.js` before reading that file — every number below
depends on what the curriculum actually contains.

**Batch A is done** — shipped as `learn.js` v2.0.0. Items 0, 0b, 3, 4, 5, 6, 7, 9
below are closed, plus the grade-F record from item 1. Struck items are history.

**Batch B is also done** — `learn.js` 2.1.0 and `lessons-admin.js` 1.7.0. Every
finished run now writes `runAttempts` / `runFailures` / `furthestRunIdx` /
`lastSeenAt`, queued onto the existing coalesced flush so it costs no extra Firestore
writes or reads. Students → **⚠ Find stuck** scans the current roster filter and
lists runs nobody can clear.

Two latent bugs fixed on the way: `saveProgress()` used `setDoc` **without merge**, so
completing a lesson would have erased every run-level field; and `timeSpentSeconds`
counted only the final run, so it undercounted by most of the lesson.

**Nothing on the audit list is now outstanding.** What remains is §9, plus the
books/library fixes below.

### Books + library, 2026-08-02

Three bugs in the book metadata form, all in `saveTitleBtn.onclick`:

1. **"Save Metadata" looked dead.** It always worked — `setDoc(..., { merge: true })` —
   but the only confirmation went to `#status`, a bar ~66 lines of markup above the
   button and normally scrolled out of view. Now reports inline next to the button
   with a timestamp, and refreshes the book list.
2. **Author and genre could be changed but never cleared.** `if (author)` / `if (genre)`
   meant blanking a field silently kept the old value. Both are now written
   unconditionally.
3. **The "✏️ Custom..." genre option was dead.** `customGenreInput` was declared and
   never referenced, so choosing Custom stored the literal string `__custom__`.
   Now wired via `readGenreField()`, with the text box revealed on selection.

**"Audit Book for Untypeable Characters" said "Book metadata not found" on any newly
created book.** Not a data problem. `createParseBtn` sets `activeBookId` and stages
the parsed chapters *in memory*; nothing is written to Firestore until Upload All (or
Save Metadata, whose `setDoc merge` creates the parent document as a side effect).
The audit read only from Firestore, so auditing before uploading always failed — and
checking for untypable characters *before* committing a book is the order you'd
actually want.

The audit now prefers `stagedChapters` when they exist and falls back to Firestore,
mirroring the `langIsFromDB` pattern already used by the language scanner. A new
`auditIsFromDB` flag routes fixes accordingly: database audits write immediately,
staged audits mutate the in-memory segments and are persisted by Upload All. Both the
per-issue save and Fix All honour it, and the results panel states which copy it is
looking at — otherwise "fixed" is ambiguous. The old error message is now specific
about what to do instead.

⚠️ Chapter ids for staged books fall back to `index + 1` when a chapter has a blank or
missing `id`, matching what Upload All will write. If you change that rule in one
place, change it in `runAudit` and the Fix All lookup too.

### Bulk-upload workflow, 2026-08-02

Found while Jake was uploading five books at once.

**Chapter titles.** Filling in unparsed titles meant Edit → paste → Update → scroll
back to the list, per chapter, times twenty-odd. Added **Update & Next →**, which
commits and opens the following chapter without leaving the editor, plus an
"Editing chapter N of M" readout and autofocus on the title field. The commit logic
moved into `commitStagedEdit()` so both buttons share one code path and neither can
advance past invalid JSON.

**The word list was hardcoded and unsearchable.** `FLAGGED_WORDS` was a module-level
const with `FLAGGED_REGEX` built once at load, so there was no way to flag a word the
list didn't know (Jake hit "Land of the Boobies" in Pinocchio) or to look for one
yourself. Now:

- `buildFlaggedRegex()` is built per scan from `FLAGGED_WORDS` + `customFlaggedWords`.
- Custom words live in **`settings/languageFilter`**, which the existing rules already
  cover (`read: signedIn()`, `write: isSuper()`) — no rules change. They follow Jake
  between machines rather than sitting in one browser's localStorage.
- Free-text **search** reuses `scanForLanguageIssues` via a new `overrideRegex`
  parameter, so a search hit gets the same context extraction and inline-edit
  affordances as a flagged word. Whole-word by default, `/…/` for a regex.
- All terms are regex-escaped, so `a.b` doesn't match `a?b`, and the `\b` guards are
  conditional so a search for a non-word string like `?` still matches.

⚠️ `loadCustomWords()` **must not** be called at module-eval time — `settings/{docId}`
is gated behind `signedIn()`, so it would race auth and silently leave the list empty.
It's called from `onAuthStateChanged`.

**Third instance of the provenance bug.** `langScanBtn.onclick` passed a hardcoded
`true` for `fromDB`, same class of error as the audit had. Now `stagedFromDB`.
If a fourth read/write pair appears in this file, check it too.

`index.html` gained a **School / Library toggle** in the header. A `back-to-landing`
link already existed but lived inside the library view where nobody found it, so a
student who chose Library had no visible route back. School is a plain `<a href>` so
it survives a JS failure.

0. ~~Chunk long steps~~ ✅ **DONE (2.0.0).** 176 runs, none over a block, longest 193 chars.
   `buildSequence()` already returns a flat array; split on group/word/sentence
   boundaries. Fixes all 47 existing lessons and everything authored later without
   re-editing documents. 150 ≈ 30–60 s at these gates, matching the `game.js` sprint
   length. Jake approved 150. **Nothing else matters until a step fits in a period.**
0b. ~~Persist run position~~ ✅ **DONE (2.0.0)** — `ttb_learnpos_v1`, uid-keyed. Required even with
   chunking — see `PEDAGOGY-AUDIT.md` §3.2.
1. ~~Instrument the failures~~ ✅ **DONE (learn.js 2.1.0).** an F now writes a record
   (previously it wrote nothing, so the students in the most trouble left no trace).
   Still needed: write a record on *every* finished
   step, pass or fail, including grade F. Add `furthestStepIdx`, a `stepAttempts`
   map, and `stepFailures`. Fix `timeSpentSeconds`, which currently adds only the
   final step's `stepSeconds` rather than the lesson's.
2. ~~A "stuck" view in admin~~ ✅ **DONE (lessons-admin.js 1.7.0)** — Students → ⚠ Find stuck. — any student with ≥ N attempts on a step they
   haven't cleared. This is the report that would have caught all of this in week two.
3. ~~Net WPM~~ ✅ **DONE (2.0.0)** — `netWPM()`. Kills the error exploit and makes
   the number comparable to every other typing assessment.
4. ~~Idle-aware graded clock~~ ✅ **DONE (2.0.0)** — `startGradedTimer()`; `DRILL_STOP_TIME_THRESHOLD` deleted. The constant and the
   timestamp already exist; the graded timer just doesn't consult them. Note the
   related bug at `DRILL_STOP_TIME_THRESHOLD`: the comment says "stop counting
   time" but the code sets `learnLastInputTime = 0`, which stops *time-on-task
   credit* while the graded timer keeps running. Almost certainly inverted intent.
5. ~~Retry the run~~ ✅ **DONE (2.0.0)**.
6. ~~Grade C advances~~ ✅ **DONE (2.0.0)** — `gradeAdvances()`. Accuracy gates progression; speed determines the badge.
7. ~~Per-step gates~~ ✅ **DONE (2.0.0)** — inferred from `step.type` via `DRILL_TYPES`; optional `step.gates` override. Drill steps (`key_pattern*`, `key_random`)
   accuracy-only, no WPM. Only the closing prose step carries a speed number.
   This alone fixes the backwards difficulty curve.
8. ~~Scale `minWPM` by unit~~ — **already done in the authored curriculum**, and done
   well. Unit 4's 18 and unit 6's 20 now matter far less, since chunking removed the
   long runs those gates were punishing. Leave them unless testing says otherwise.
   New in 2.0.0: `gates.strictSpeed` exists and nothing sets it. Add
   `"strictSpeed": true` to the Unit 7 lessons via Import JSON if 25 WPM should ever
   be enforced rather than advisory — the engine already honours it.
   ⚠️ **Do NOT scale by grade level.** Jake rejected that explicitly and his
   reasoning is load-bearing: an 8th grader may have had him twice or never, so
   grade carries no information about skill. Unit scaling is grade-independent and
   self-calibrating — a student's position in the curriculum *is* the level signal.
   25 WPM stays the exit number for everyone.
9. ~~Recalibrate A🔥~~ ✅ **DONE (2.0.0)** — clean run on drills, 1.5× on prose. Award kept.
   Currently 2× gate + 95% accuracy, which on a 49-char drill means 30 WPM at
   0.40 s/keystroke with at most two errors: an adult touch-typist number
   permanently visible on the map and permanently out of reach. Proposal: on
   accuracy-only drill steps make it a *clean run* (100%, no backspaces) — fully
   within the student's control, which is the whole point given the attribution
   problem; on speed-gated steps, 1.5× rather than 2×.

**The graduate link stays where it is.** It appears only when every unit 1–6 lesson
is passed — eight lessons past where the letters are actually complete, and behind
the two longest steps in the curriculum. Jake's call 2026-08-01: leave it. If the
wall comes down the escape hatch is not needed. Do not "helpfully" loosen this to
`unit < 5`; it was considered and declined.

Students can still reach `game.html` through the library at any time, and Jake tracks
both sides.

---

## 12. Jake's working preferences

GitHub web uploads, no build step, no CLI. Complete replacement files, never diffs.
Explicit over magic. Values session momentum — but reviews designs carefully before
deploying, and twice in this session that review caught real bugs, so present designs
for comment rather than shipping them silently.

Never retain student-identifying data beyond what reporting genuinely needs. That
constraint is why the leaderboard stores initials only and why there is no browsable
user directory.
