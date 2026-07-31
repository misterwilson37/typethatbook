# HANDOFF — TypeThatBook

<!-- HANDOFF.md v3.0.0 — reorganised. Earlier versions accreted section-by-section
     across one long session and had become a changelog rather than a handoff. -->

**Claude instance:** **Underwood**
**Session:** Round 1 (first documented session on this project)
**Dates:** 2026-07-30 → 2026-07-31

> *On the name:* Underwood built the typewriter that taught America to touch-type.
> Seemed right for a typing tutor. Predecessors on Ellis Web Bell: Stedman, Fable.

---

## 1. What this session was for

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

### ⚠️ One revision behind

Uploaded just before the last two edits landed. Both carry real fixes:

| file | live | ship | what's missing |
|---|---|---|---|
| `admin.js` | 3.1.0 | **3.2.0** | bootstrap warning banner; Books/Lessons tabs hidden from non-super users |
| `staff-admin.js` | 2.1.0 | **2.2.0** | Schools form disables itself in bootstrap mode; diagnostic permission errors |

### 📄 Not in the repo

`firestore.indexes.json` and `firestore-rules.test.mjs`. Neither is deployable
without a CLI, but the first is the **only written record** of the three composite
index definitions and both TTL policies. Worth committing for the record.

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
| `learn.js` | `const LEARN_VERSION` (~line 30) |
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
`reports.html`.

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

## 9. Open work, in priority order

1. **Practice mode will not survive a real class period.** `maxInstances: 5` and
   Gemini free tier ~10–15 requests per **minute** versus thirty kids clicking at
   once. The fix is the paragraph-pool cache in `SCALE-PLAN.md` Problem 5 — but
   that's a Cloud Function, so Jake can't deploy it. CLI-free options: throttle
   client-side in `game.js`, or disable practice mode. **Unresolved; his decision.**
2. **Three composite indexes and two TTL policies not yet created.** Indexes give
   click-to-create links on the first failing query. TTL is in the **Google Cloud**
   console, not Firebase — `TTL-GUIDE.md`, including why pre-v3.4.0 documents will
   never be collected.
3. **`firestore-rules.test.mjs` is wrong, not merely unrun.** It tests the v1.x claims
   model that v2.x ignores entirely; needs rewriting to seed `staff/{uid}` documents.
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
| `SETUP-NO-CLI.md` | **the setup runbook.** Ordered, console-only. Supersedes `SETUP-MULTISCHOOL.md` |
| `SCALE-PLAN.md` | the 7,000-student cost analysis. Problems 1–3 fixed, 4–5 open |
| `RULES-AUDIT.md` | the overnight audit: three bugs found by tracing 103 Firestore ops |
| `TTL-GUIDE.md` | where TTL actually lives, and the pre-v3.4.0 gotcha |
| `MULTITENANCY.md` | original design doc. **Partly superseded** — describes the claims model. Kept for the reasoning, not the mechanism |
| `SETUP-MULTISCHOOL.md` | **obsolete.** Assumes a CLI throughout. Safe to delete |

---

## 11. Jake's working preferences

GitHub web uploads, no build step, no CLI. Complete replacement files, never diffs.
Explicit over magic. Values session momentum — but reviews designs carefully before
deploying, and twice in this session that review caught real bugs, so present designs
for comment rather than shipping them silently.

Never retain student-identifying data beyond what reporting genuinely needs. That
constraint is why the leaderboard stores initials only and why there is no browsable
user directory.
