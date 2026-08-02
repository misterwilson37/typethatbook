# HANDOFF — TypeThatBook

<!-- HANDOFF.md v4.1.0 — Round 3 (Blick): Adventure Mode out of alpha, project-wide
     version alignment, book tags (age range + protagonist). §9 item 1 CORRECTED —
     the practice-mode panic was wrong; see §A.10. New §A is Round 3 and is the first thing to read. §0 and §11
     are Round 2 (Dvorak). Underwood's §1, §3-§10, §12 are verbatim. -->

**Claude instance:** **Blick** (Round 3) · **Dvorak** (Round 2) · **Underwood** (Round 1)
**Session:** Round 3 — 2026-08-02 · Round 2 — 2026-08-01 · Round 1 — 2026-07-30 → 2026-07-31

> *On the names:* Underwood built the typewriter that taught America to touch-type.
> Dvorak was an educational psychologist who studied typing instruction and finger
> motion, which is what Round 2 was about. Blick is the Blickensderfer 5 (1893),
> whose trick was a swappable typewheel — one machine, pull one cylinder, drop in
> another, same keystrokes come out looking completely different. Round 3 was the
> view switcher. Predecessors on Ellis Web Bell: Stedman, Fable. (Jake's wife types
> Dvorak. Unplanned, and welcome.)

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

### A.12 Not done — queued

1. **Flagged-words list: regex support + an audit view.** Free-text search already
   accepts `/…/` (see §11 "Bulk-upload workflow"); the persistent list in
   `settings/languageFilter` does not, and there is no UI to see the effective
   list at all — Jake is filtering with a list he cannot read. `FLAGGED_WORDS`
   also needs a content review: it did not contain "boob", which Jake hit in
   Pinocchio, suggesting it was written by pattern-matching modern profanity
   rather than by thinking about 19th-century children's literature.
2. **Age/protagonist tags have no backfill.** Every existing book needs both
   entered by hand. The ○/● markers in the admin book picker are the worklist.
3. A nicer practice-mode cool-down message (§A.10). Low priority.

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
2. **Three composite indexes and two TTL policies not yet created.** Definitions
   now live in `firestore.indexes.json` in the repo. Indexes give
   click-to-create links on the first failing query. TTL is in the **Google Cloud**
   console, not Firebase — `TTL-GUIDE.md`, including why pre-v3.4.0 documents will
   never be collected.
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

| doc | what it's for |
|---|---|
| `README.md` | what the project is; file map, data model, version table |
| `PEDAGOGY-AUDIT.md` | **Round 2.** Why students stalled in `learn.js`. Research comparison, gate arithmetic, agreed change list |
| `SETUP-NO-CLI.md` | **the setup runbook.** Ordered, console-only. Supersedes `SETUP-MULTISCHOOL.md` |
| `SCALE-PLAN.md` | the 7,000-student cost analysis. Problems 1–3 fixed, 4–5 open |
| `RULES-AUDIT.md` | the overnight audit: three bugs found by tracing 103 Firestore ops |
| `TTL-GUIDE.md` | where TTL actually lives, and the pre-v3.4.0 gotcha |
| `MULTITENANCY.md` | original design doc. **Partly superseded** — describes the claims model. Kept for the reasoning, not the mechanism |
| `SETUP-MULTISCHOOL.md` | **obsolete.** Assumes a CLI throughout. Safe to delete |

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
