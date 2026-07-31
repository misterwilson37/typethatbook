# HANDOFF — TypeThatBook

<!-- HANDOFF.md v2.1.0 -->

**Session:** Round 1 (first documented session on this project)
**Claude instance:** **Underwood**
**Date:** 2026-07-30
**Shipped:** `game.js` **v3.4.2** · `learn.js` **v1.7.0** · `index.html` **v3.0.1** ·
`reports.html` **v2.7.0** · `admin.js` **v2.8.0** · `lessons-admin.js` **v1.5.0** ·
`functions/index.js` **v1.5** · `versions.js` **v1.1.0** · `firebase-config.js` **v1.1.1** ·
`firestore.rules` **v2.1.0** · `staff-admin.js` **v2.1.0** (new) · `firestore.indexes.json` (new) ·
`firestore-rules.test.mjs` (new) · `SETUP-NO-CLI.md` v1.0.0 (new, SUPERSEDES SETUP-MULTISCHOOL.md) · `TTL-GUIDE.md` v1.0.0 ·
`README.md` v1.3.0 · `SCALE-PLAN.md` v1.2.0 · `MULTITENANCY.md` v1.0.0 · `HANDOFF.md` v1.4.0

> *On the name:* Underwood built the typewriter that taught America to touch-type —
> the machine that made the home row a thing people learned instead of hunted for.
> Seemed right for a typing tutor. Also sounds like someone who'd be very calm about
> a $34,000 Firestore bill, which was the mood required.
> (Predecessors on Ellis Web Bell: Stedman, Fable. Not reusing either.)

---

## What happened this session

Jake uploaded `typethatbook-main.zip` — no handoff, no README — and asked whether the
app could be optimized to serve 7,000 students over a school year (peak ~467
simultaneous) without costing money.

I read the codebase, mapped every Firestore access path, modeled the load, wrote the
three documents, then Jake greenlit the leaderboard fix and I shipped it.

Then two more rounds in the same session. Net result across all of it:

**$34,404/yr → about 30 cents/yr.** Reads at 58% of the Firestore free tier, writes
at 105%, `typing_sessions` from 8.17M docs/year to ~409k.

- **v3.3.0** — leaderboard rework (SCALE-PLAN Problem 1)
- **v3.4.0** + `learn.js` v1.1.0 — write-ahead log and coalesced flush (Problems 2
  and 3), plus `classId`/`schoolId` stamped on every log
- **`MULTITENANCY.md`** — schools/classes/roles design. **Not built.** Needs Jake's
  answers to five questions at the end of it.

**Two things Jake has now confirmed in production:**

1. The WAL works. He typed for a while, closed the tab, opened a new one, and
   resumed exactly where he left off. That was the test that mattered most.
2. The footer banner picked up v3.4.0 once the constant was fixed — so the
   constant → banner wiring was live all along. There was no caching problem; the
   stale 3.2.0 reading was entirely my missed constant bump.

⚠️ Everything else remains modelled and simulated, never measured against live
Firestore. Check the Usage tab after a real week.

## The finding

`fetchLeaderboard()` in `game.js` line 3902 reads the **entire** `leaderboard`
collection to compute four top-10 lists. `updateLeaderboard()` explicitly busts its
30-second cache on line 3880, and fires from `pauseGameForBreak()` — i.e. **every
sprint end**, which at the default 30-second sprint is 20× per ten-minute block.

At 7,000 students: ~327 million document reads per day, ~82 GB/day egress,
**~$34,400 per school year** from that one call path.

Full analysis and the five remaining problems are in **`SCALE-PLAN.md`** — read it
before touching anything.

## What v3.4.0 actually does

The important thing to understand, because it looks like a durability regression
and isn't:

**Every sentence still records everything, synchronously, to localStorage.** That
is now the durable copy. Firestore gets a batched flush every 5 minutes and on
session end. `walRecover()` (game.js) and `walRecoverLearn()` (learn.js) replay
unflushed state on next load by comparing against what Firestore has.

The OLD code lost everything since the last punctuation mark when a tab died. The
WAL loses nothing. Position, time, WPM, accuracy, streaks, completed chapters all
still tracked; students still resume exactly where they left off. Verified with a
15-case harness (hard crash, offline-then-reconnect, stale log from another book).

Other changes: progress+completedChapters merged into one doc (was two writes to
the same doc); chapter advance one write not two; `typing_sessions` one rollup doc
per session with a `sprints[]` array and an `expiresAt` TTL field; chapter text
cached in localStorage; goals/class/school cached for a day; leaderboard write gap
raised to 5 min to match the flush interval.

**Deliberately NOT done:** merging `stats/time_tracking` into `typing_logs`. Saves
~1 write/student/day (105% → ~95% of free tier) but needs a migration over every
existing student. Not worth real risk for a dollar a year. It's the lever if the
headroom is ever needed.

## What v3.3.0 does

All inside `game.js`. New code sits at the leaderboard state block (~line 240) and
the `updateLeaderboard` / `fetchLeaderboard` region (~lines 3900–4110).

- `fetchLeaderboard()` — four `orderBy(cat, 'desc') + limit(15)` queries, filtered
  and sliced to 10 client-side. Cache is 10 min and **is not busted on the hot path**.
- `fetchWeeklyRows()` — the weekly board needs `where('weekStart','==',x) +
  orderBy('totalSecondsWeek','desc')`, i.e. **one composite index**. Wrapped in
  try/catch with a wider-fetch fallback so a missing or still-building index
  degrades instead of breaking. Console warning names the index.
- `couldPlace()` — checks the student's score against top-10 cutoffs persisted in
  `localStorage` (`ttb_lbThresholds`). Most sprints skip the fetch entirely.
  Thresholds only drift upward, so staleness costs a missed celebration, never a
  false one. Cleared on admin reset, which lowers real cutoffs.
- `computePlacements()` — ranks against the cached lists, no network. **Ties at the
  top go to the student; ties at the bottom of a full board don't place.** The old
  code sorted the whole collection and read back an index, so its tie order was
  whatever Firestore returned — this is at least deterministic.
- `loadOwnLeaderboardEntry()` — own doc read once per session, not per sprint.
- `flushLeaderboard()` — coalesces writes to ≥120s apart, immediate on a new PB,
  and on `visibilitychange: hidden` (the only lifecycle event that fires reliably
  on Chromebooks; `beforeunload` does not).
- `displayName` removed from leaderboard docs — written but never read.

Verified with an 18-case harness on the rank/threshold logic and a 20-sprint block
simulation including an injected write failure (no seconds lost or double-counted).
Both were scratch harnesses, **not committed** — this project still has no test suite.

**Measured, one 10-minute block, one student:** leaderboard reads 140,020 → 9,
leaderboard writes 20 → 6.

## Design review round — two gaps Jake found before deploying

He read the design back before uploading anything, which caught two real problems.

**1. Buildings were console-only for no reason.** `schools` requires super_admin to
write, and a super_admin writes from the browser fine — I just hadn't built the
form. Now a Schools panel on the Staff tab (super_admin only). The ONLY genuinely
console-only thing in the whole system is the **first super_admin record**, because
rules require an existing admin to create staff docs and nobody may edit their own.

**2. You couldn't elevate someone who had never signed in.** `staff/{uid}` is keyed
on a Firebase UID, and a person who's never authenticated has none. Fixed with
`pendingStaffRoles/{email}` — an admin grants to an address, and the person's first
sign-in copies it onto their UID. Rules allow that copy **only if it matches the
pending document exactly**, so they can't invent a role, and no-self-edit still
applies afterwards. Same shape as `pendingClassAssignments`, which already worked
this way for student rosters.

Also added: **Add One Student** (single email + class, beside CSV import) for the
mid-year transfer, and a **help panel** on the Staff tab documenting the one console
step with a link, since Jake reasonably won't remember it.

The pending-role claim runs in `admin.js` and `reports.html` but **deliberately NOT
in game.js/learn.js** — that would be an extra read per student per session for
something only staff ever need.

## 🔴 READ FIRST: Jake has no command line

**Jake has never run a Firebase CLI command and does not have that tooling.** He
can upload files to GitHub and click in the Firebase console. That's it.

I built an entire claims-based role system across two rounds before finding this
out, because I never asked. Auth custom claims can only be written by the Admin
SDK → a Cloud Functions deploy → a terminal. **Every function I wrote was
undeployable.** `generatePractice` exists from before and still works, but nothing
new can be shipped that way.

**Never assume a deploy path for this project.** Anything that isn't (a) a file
uploaded to GitHub or (b) a click in the Firebase/Cloud console is not shippable.

### What that changed — firestore.rules v2.0.0

Roles moved from Auth custom claims into `staff/{uid}` documents that the rules
read via `get()`. Two things got BETTER:

- **Role changes are instant.** No token refresh, no "sign out and back in."
- **Nothing to keep in sync.** Claims meant two copies of the truth. Now one.

Cost: rules `get()` the caller's staff doc, billed as a read, cached per request.
~1 extra read per request, admin pages only. Irrelevant.

**Class membership is read from `classes/{id}.teacherUids`, not a list on the staff
record.** That removed a whole bug class — there is nothing to sync, no cache, no
stale claim. A teacher can only create a class with themselves on it, and can only
edit a class they're already on, so `teacherUids` is self-maintaining and can't be
used to widen their own scope. It also killed the "teacher creates a class and
can't see it" problem entirely.

### The request flow replaced email search

`lookupStaffCandidate` needed the Admin SDK. Without it, finding a person by email
would require a Firestore collection holding every user's name and email — a
browsable district-wide student directory, which collides with Jake's rule about
retaining student-identifying data.

Instead: a signed-in non-staff user who opens `admin.html` gets a *"request
access"* box (not "Access Denied") which writes `staffRequests/{uid}`. Admins see
pending requests on the Staff tab and set them up. Only people who opted in ever
appear. Matches what Jake described and needs no directory.

### Also: nobody can edit their own staff record

Rules block it for **all** roles including super_admin. That's what stops an admin
widening their own reach, and it's why the first super_admin must be created by
hand in the Firebase console. `SETUP-NO-CLI.md` step 3.

### ⚠️ The tests are now WRONG, not just unrun

`firestore-rules.test.mjs` (~52 cases) still tests the **v1.x claims model** —
`authenticatedContext(uid, {role: ...})` injects claims, which v2.0.0 rules ignore
entirely. It needs rewriting to seed `staff/{uid}` documents instead. And Jake
can't run it regardless (needs the emulator, needs a CLI). `SETUP-NO-CLI.md` has a
five-step manual check as the practical substitute.

**Rewriting that suite against v2.0.0 is the highest-value task available.**

### Dead code left in place

`functions/index.js` v1.5 still has `setStaffRole`, `lookupStaffCandidate`,
`listStaff`, `syncMyClaims`, `revokeStaffRole`, `setStaffReadScope`,
`resyncStaffClaims`. **Nothing calls them; they were never deployed.** Left as a
working claims implementation in case CLI access ever appears. Don't delete without
asking, don't assume they run.

## Staff tab + per-person read scope (earlier this round)

Jake asked for a Staff tab so he never has to touch the console to onboard a
colleague. His answer to "what should a teacher read?" was **"whatever the building
admin allows them to see"** — which turns read scope into a per-person setting rather
than a property of the role. That's a better model than either option offered.

**Three roles now**, plus student-by-default (no claim):

| role | reads | writes |
|---|---|---|
| `teacher` | per-person `readScope`: `own_classes` (default) or `building` | only classes they teach |
| `building_admin` | their whole building | any class in it; manages its teachers + their readScope |
| `super_admin` | everything | everything. **NOT grantable through the app** — bootstrap list or console only |

**How scope stays free.** `building` reads `schoolId` off the document. `own_classes`
checks `classId` against **claim.classIds**. Both zero reads. A classId is ~10 bytes
against a ~1000-byte claim budget, so 60 classes fit — capped at that in
`MAX_CLAIM_CLASS_IDS`.

**All claim writes funnel through `pushClaims()`** in functions/index.js. Nothing else
calls `setCustomUserClaims`. `staff/{uid}` is now `allow write: if false` in rules —
only the Admin SDK writes it. That's what makes claim-vs-record drift impossible.

### Three bugs this design created, all found and fixed before shipping

1. **Self-escalation via class editing.** claim.classIds is derived from
   `teacherUids`, so a teacher could add themselves to a colleague's class and read
   it. Rules now let a plain teacher edit only classes they already teach;
   building_admin edits any in their building. There's a test for it.
2. **`saveClass()` wrote no `schoolId` and no `teacherUids`** — class creation would
   have been rejected outright by the new rules. Now stamps both, and the school
   picker is required. A teacher must put themselves on a class they create, or
   they'd create something they can't read.
3. **`practice_sessions` had no tenancy stamps**, so its read rule had to be
   `if isStaff()` — any staff member, any district, on documents containing email,
   displayName, and the full generated paragraph. game.js v3.4.2 adds
   `classId`/`schoolId`; the rule is now scoped like every other activity
   collection. Pre-v3.4.2 docs have no stamps and so are super_admin-only, which is
   the right way round for a fallback.

### The consequence to remember

`claim.classIds` is derived, so **creating a class leaves the claim stale.**
`saveClass()` calls `syncMyClaims()` then `getIdToken(true)` and reports whether it
worked. **Any new class-creation path must do the same** or the teacher silently
can't see their own class.

### Deliberately not built

- **No browsable user directory.** `lookupStaffCandidate` takes one email, calls
  `getUserByEmail`, returns one person, stores nothing. A browsable list would mean
  writing every student's name and email into a queryable collection — a
  district-wide student directory — which runs into Jake's own rule about retaining
  student-identifying data.
- **Optional school for students** — Jake wants his son able to join without landing
  in a building. `schoolId` empty is a valid permanent state; those users show as
  *Unassigned*. Derive-from-CSV works today; a settings/sign-up picker is not built.

## Multi-school support — earlier this round

Colleagues at other schools in the district want in, so this jumped the queue.
Jake's answers to the open MULTITENANCY questions:

- **Other schools in the district** — `schools` is load-bearing, not ceremonial.
- **Teachers see their whole building, filterable down to their own classes.**
- **Teachers manage their own classes and rosters; Jake can do it for anyone.**

That collapsed three roles into two. `building_admin` wasn't needed: if every
teacher reads their whole building, `teacher` and `building_admin` differ only in
write scope, and Jake covers the rest as `super_admin`.

**Access model:** `role` + `schoolIds` live in Auth **custom claims** (signed,
unforgeable, zero reads to check). `classIds` live in `staff/{uid}` because they
change every trimester and claims have a ~1000-byte budget. **Rules enforce the
building; the UI narrows to classes.** That split is deliberate — class-level checks
in rules need a `get()` per access, which is billed.

### The find that mattered

`lessons-admin.js` `loadStudentRoster()` was doing
`getDocs(collection(_db, 'typing_logs'))` — the **entire** collection. ~1.2M docs a
year at full enrollment, and as an unfiltered `list` it's **rejected outright by the
new rules** for anyone who isn't super_admin. It would have worked fine for Jake and
broken for every colleague on day one. Now scoped to 45 days + the caller's
building(s).

An audit of every other `getDocs(collection(...))` in the codebase came back clean —
the rest are `books`, `lessons`, `classes`, `schools`, all small config collections
the rules allow broad read on deliberately.

Also found and fixed before shipping: my first rules draft broke `reports.html`'s
admin time-correction feature, which **writes** to `users/{uid}/stats/time_tracking`.
That path now pays a `get()` to scope by building — correct because it's a rare
deliberate action, unlike typing_logs where the same check is free.

### ⚠️ The rules are UNTESTED

`firestore-rules.test.mjs` has ~40 cases. **I could not run them** — the Firestore
emulator downloads its jar from `storage.googleapis.com`, which isn't in the sandbox
network allowlist. The rules were verified by reading, not executing.

This is the boundary between one teacher's students and another's. If you pick this
up, running that suite is the highest-value thing you can do.

`SETUP-MULTISCHOOL.md` has the ordered deploy: function → schools → bootstrap Jake's
claim → rules+indexes → backfill → add colleagues. **Order matters** — deploying
rules before Jake has a claim locks him out of his own admin pages. There's a
rollback snippet at the end of that doc.

### Not done

- `admin.html`'s **Books** and **Lessons** tabs aren't hidden from teachers. Rules
  block the writes, so nothing is at risk, but they'll see UI that errors on save.
  Hiding those tabs for non-super users is the obvious next piece.
- ~~No UI for granting staff roles~~ ✅ **Staff tab shipped.** Creating *schools* is
  still console-only (`schools` collection, short readable ids like `ems`) — they're
  created once and never change, so a UI would be overkill.
- `ADMIN_EMAILS` / `BOOTSTRAP_EMAILS` / `BOOTSTRAP_SUPER_ADMINS` still exist as
  fallbacks so nobody gets locked out mid-migration. Remove once staff records exist.

## ⚠️ Read this before bumping any version

**I got this wrong in this session. Don't repeat it.**

Every file has a **runtime version constant**. That constant is what renders on the
page. The header comment at the top of the file is decoration.

I bumped header comments and left the constants alone. Result: Jake deployed
`game.js` v3.4.0 and the page still said **3.2.0**, because `const VERSION` on line
70 was untouched. He had to fix it by hand. Then he asked, reasonably, how he was
supposed to verify what was running.

Worse: I invented a version number. `learn.js` had a header saying `v1.0.0` and a
constant saying `1.6.3`. I read the comment, called my release `v1.1.0`, and
documented that — a version that never existed in that file's lineage. The real
sequence is 1.6.3 → **1.7.0**.

**Where the constants live:**

| file | constant |
|---|---|
| `game.js` | `const VERSION` (~line 70) |
| `learn.js` | `const LEARN_VERSION` (~line 30) |
| `keyboard.js` | `export const KB_VERSION` |
| `adventure-renderer.js` | `export const RENDERER_VERSION` |
| `admin.js` | `const ADMIN_VERSION` |
| `lessons-admin.js` | `window.LESSONS_ADMIN_VERSION` |
| `firebase-config.js` | `export const CONFIG_VERSION` |
| `versions.js` | `export const VERSIONS_VERSION` |
| `index.html` | `const INDEX_VERSION` |
| `style.css` | `body::before { content: "v…" }` |
| `adventure.css` | `body::after { content: "v…" }` |

Bump the constant. Update the header comment too if you like, but the constant is
the one that matters.

## index.html now aggregates versions

Jake's design intent was "a constant in each file, pulled into index so index
doesn't need updating." `index.html` had **no version machinery at all** — its title
said 3.0.0 and its own footer said 2.3.1, both hardcoded, silently disagreeing.

Now: one `INDEX_VERSION` constant drives the title and footer, plus a **build info**
button that lists every file's deployed version.

`versions.js` **fetches and regex-parses** the deployed files rather than importing
them. Two reasons, both in that file's header:

1. `index.html` can't `import { VERSION } from './game.js'` — game.js is a page
   controller with module-level side effects (`window.onload = init`, document
   listeners). Importing it to read a string would try to boot the typing game on
   the library page.
2. **A shared version manifest was considered and rejected.** If game.js read its
   version from a manifest, a stale cached game.js would report the NEW version
   while running OLD code — lying in precisely the situation you'd use it to
   diagnose. A constant living in the file it describes cannot lie about itself.

It's lazy (nothing fetched until the panel opens — game.js is ~210KB), cached in
sessionStorage per tab, and fetches with `cache: 'no-cache'` so it reports the
server's copy rather than a stale one. All 10 parse patterns were verified against
the real files.

## State of the code

`game.js` is at v3.3.0. Everything else is as Jake uploaded it. Current versions:

| file | version |
|---|---|
| `game.js` | **3.4.2** ← changed this session |
| `learn.js` | **1.7.0** ← changed this session |
| `admin.js` | **3.1.0** ← changed this session |
| `admin.html` | Staff tab added |
| `staff-admin.js` | **2.1.0** ← NEW this session |
| `lessons-admin.js` | **1.8.0** ← changed this session |
| `adventure-renderer.js` | 0.4.0 |
| `keyboard.js` | 1.1.1 |
| `firebase-config.js` | **1.1.1** ← changed this session |
| `style.css` | 3.1.6 |
| `adventure.css` | 0.0.7 |
| `index.js` (Cloud Function) | **1.5** ← changed this session |

Plus `versions.js` **1.0.0** (new this session).

Page shells are versioned separately from the JS that drives them — don't confuse
them. `index.html` is now driven by `INDEX_VERSION` (3.0.1) and `learn.html`'s title
by `LEARN_VERSION`. **`game.html` (3.0.1.1), `admin.html` (2.7.6), and
`reports.html` (2.4.1) still have hardcoded titles** and are the remaining
inconsistency — worth converting to the same pattern.

## Next steps

Per `SCALE-PLAN.md` § Suggested order:

1. **Budget alert in Google Cloud Console.** Not code. Jake's action.
   **Still outstanding** — ask about it.
1b. ~~Enable the TTL policy in the console~~ — **now a file.** TTL policies for
   `typing_sessions` and `practice_sessions` are `fieldOverrides` in
   `firestore.indexes.json` and deploy with `firebase deploy --only
   firestore:indexes`.

   I had told Jake to find this in the "Firestore console." **TTL is not in the
   Firebase console at all** — it lives in the Google Cloud console, a different
   site. He couldn't find it, correctly. Don't repeat that; see `TTL-GUIDE.md`.

   Two related things: `practice_sessions` was never writing `expiresAt` at all
   (fixed in v3.4.1 — the policy would have been inert), and documents written
   before v3.4.0 have no `expiresAt` and will **never** be collected. Firestore
   ignores documents whose TTL field is missing rather than deleting them. The
   backlog needs a backfill or a manual purge; there's an unrun snippet in
   `TTL-GUIDE.md` with honest caveats about its inefficiency.
2. ~~Leaderboard rework~~ ✅ **done, v3.3.0.** Remaining task: create the weekly
   composite index when the console asks. The fallback covers it until then.
3. ~~Flush-based saves~~ ✅ **done, v3.4.0 + learn.js v1.1.0.** The
   `stats/time_tracking` merge was skipped on purpose — see above.
3b. ~~`reports.html` class filter + scope picker~~ ✅ **shipped, v2.5.0.** Also
   fixed SCALE-PLAN Problem 4 in the process.
3c. **Run `firestore-rules.test.mjs`.** ← *the top item now.* Untested security
   rules guarding other people's students.
3d. **Hide Books/Lessons tabs in admin.html from non-super users.** The Staff tab
   is now role-gated (`display:none` unless building_admin/super_admin); Books and
   Lessons still aren't. Rules block the writes, so it's cosmetic, but ugly.
3e. **Student school picker** — settings + optional at sign-up, never forced.
4. Session rollup + TTL policies.
5. `reports.html` class filter.
6. Practice-pool cache + `maxInstances` (needs Firebase CLI, not browser upload).
7. Firestore security rules + admin custom claims.

## Things that will bite you

- **`experimentalForceLongPolling` in `firebase-config.js` is load-bearing.** It fixes
  Safari's CORS block on Firestore's WebChannel transport. It is not leftover debug
  code. Leave it.
- **`ADMIN_EMAILS` is duplicated** — `admin.js` line 18 and `reports.html` line 306.
  Two separate arrays. Change one, change both.
- **Default sprint is 30 seconds** (`sessionValueStr = "30"`, line 141). Every
  per-sprint cost multiplies by 20 in a ten-minute block. Any time you're reasoning
  about load, start here.
- **No Firestore security rules in the repo.** Possibly none deployed at all — worth
  asking Jake to check the console. The admin email gate is client-side only.
- **`game.js` is 4,263 lines with no tests.** Ellis Web Bell has a 51-test suite;
  this project has nothing. Changes get verified by hand.
- **`adventure-renderer.js` is coupled to `game.js` via `_ttbEmit('keystroke')`.** If
  you touch the keystroke handler around line 1194, check Adventure Mode still paints.
- **`index.js`/`package.json` are Cloud Functions**, not `index.html`. Deploy path is
  completely different (CLI, not GitHub Pages).

## Verification Jake still owes us

**v3.3.0 and v3.4.0 were written, syntax-checked, and unit-tested in simulation, but
never run against live Firestore.** Two releases of unverified persistence changes is
a lot of exposure. Before 467 students touch it:

For v3.4.0 specifically:

1. Type a few sentences, **kill the tab**, reopen. Position and time should be intact
   — this is the WAL doing its job and it's the single most important check.
2. Type, close the lid, reopen later. Same.
3. Devtools → Application → Local Storage: look for `ttb_wal_v2`, `ttb_ch_v1:*`,
   `ttb_goalsCache_v1`, `ttb_lbThresholds`.
4. Confirm `typing_logs/{uid}_{date}` gains `classId`/`schoolId` (empty until the
   tenancy backfill, which is expected).
5. Confirm a `typing_sessions` doc has `sprints[]` and `expiresAt`.
6. Complete a chapter, reload, confirm it's still marked complete.
7. Lesson mode (`learn.html`): finish a step, kill the tab, reopen, confirm time
   survived.

For v3.3.0:

1. Trophy panel — all four tabs populate.
2. Console — check for the weekly composite-index warning; create the index if so.
3. Devtools Network, filtered to Firestore — sprint-ends should be near-silent.
4. A genuine personal best still fires the placement celebration.
5. Opt-out toggle removes the student from the board promptly (this now writes the
   public doc immediately rather than waiting for the next sprint flush).

## Open questions for Jake

1. Are Firestore security rules deployed in the console right now, or is the database
   on defaults? This changes the urgency of item 7 considerably.
2. What does the Firestore Usage tab show at current enrollment? The leaderboard scan
   is already costing something, and the real number beats my model.
3. Is the practice-pool cache acceptable? Two students with the same weak keys would
   sometimes get the same paragraph. Cheap and probably fine, but it's a product call.
4. Is 7,000 firm? The write budget lands at 82% of free tier, which is comfortable but
   not enormous. If it's really 9,000, item 3 stops being optional.

## Workflow notes

Jake deploys via **GitHub web uploads** — no CLI, no build pipeline. Deliver complete
replacement files, never diffs. Items 2, 4, and 5 above fit that workflow; item 6
does not and will need him at a machine with the Firebase CLI.

He prefers explicit over magic, values session momentum, and wants version bumps on
every shipped file (patch/minor automatic, **major requires his explicit sign-off**).

He greenlit the leaderboard fix ("write away") and then the write reduction ("write
what you need to write to get our reads and writes down"). Items 4–7 are **not**
approved. `MULTITENANCY.md` is a design doc with five open questions — do not start
building roles or deploying rules before he answers them.

He also asked directly whether students would still have their typing tracked and
still resume where they left off. The answer is yes, and it's now more robust than
before. If he asks again, the WAL is the reason — don't hedge, but do point at the
kill-the-tab test as the way to confirm it himself.

One thing he was clear about: real names must stay reachable from the admin panel.
They do — `typing_logs`, `typing_sessions`, and `practice_sessions` all still carry
`displayName` and `email`. Only the student-readable `leaderboard` collection was
stripped. Don't "helpfully" clean those up without asking.
