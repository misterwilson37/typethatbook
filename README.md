# TypeThatBook

<!-- README.md v1.5.0 -->

A browser-based typing tutor for middle school students. Students type their way
through real books, chapter by chapter, while the app tracks speed, accuracy, and
time-on-task for teacher reporting.

**Live:** https://typethatbook.misterwilson.org (GitHub Pages, `CNAME` in repo root)
**Backend:** Firebase project `typethatbook` — Firestore + Auth + Cloud Functions

---

## The five surfaces

| Page | Version | Who | What it does |
|---|---|---|---|
| `index.html` | 3.3.0 | students | Library — pick a book, see per-book progress and today's time |
| `game.html` | 3.0.1.1 | students | **The main event.** Type a book chapter. Sprints, WPM, streaks, leaderboard, AI practice mode, Adventure Mode (`game.js` v3.4.0) |
| `learn.html` | 2.2.0 | students | Structured lessons (`learn.js` v2.2.0) — home row, finger drills, on-screen keyboard guidance |
| `admin.html` | 3.3.0 (`admin.js` 3.18.2) | Jake | Book/chapter authoring (EPUB import via JSZip), lesson authoring + JSON import/export, goals |
| `reports.html` | 2.8.0 | Jake | Time-on-task and accuracy reports by student and date range |

No build step. No bundler. Native ES modules loaded straight from the HTML with
`<script type="module">`, Firebase SDK 10.8.0 pulled from `gstatic.com`. Edit a
file, upload it to GitHub, it's live. Same workflow as Ellis Web Bell.

## File map

### Versions: where they actually live

**The runtime constant in each file is authoritative.** Header comments and
hardcoded page titles are decoration and have drifted before — `learn.js` carried
a header saying v1.0.0 while its constant read 1.6.3, and `index.html`'s title said
3.0.0 while its own footer said 2.3.1.

| file | constant | shown where |
|---|---|---|
| `game.js` | `const VERSION` | game.html footer banner, console on init |
| `learn.js` | `const LEARN_VERSION` | learn.html footer + `document.title` |
| `keyboard.js` | `export const KB_VERSION` | learn.html footer |
| `adventure-renderer.js` | `export const RENDERER_VERSION` | game.html banner, adventure debug overlay |
| `admin.js` | `const ADMIN_VERSION` | admin.html footer |
| `lessons-admin.js` | `window.LESSONS_ADMIN_VERSION` | admin.html footer |
| `firebase-config.js` | `export const CONFIG_VERSION` | index.html build panel |
| `versions.js` | `export const VERSIONS_VERSION` | index.html build panel |
| `index.html` | `const INDEX_VERSION` | its own `document.title` + footer |
| `reports.html` | *hardcoded* `<title>` + `<footer>` | still not driven from a constant — §9 item 5 |
| `appcheck.html` | *hardcoded* `<title>` | standalone diagnostic, no deps beyond firebase-config |
| `storage.rules` | header comment | **console-only.** Storage rules are separate from firestore.rules |
| `style.css` | `body::before { content }` | read via `getComputedStyle` |
| `adventure.css` | `body::after { content }` | read via `getComputedStyle` |

`index.html`'s **build info** panel reads every one of those out of the files as
actually deployed — it fetches and parses them rather than importing, because
importing `game.js` would try to boot the typing game on the library page. Lazy;
nothing is fetched until the panel is opened. See the header of `versions.js` for
why a shared version *manifest* was rejected (a stale cached file would report the
new version while running old code — it would lie exactly when you need the truth).

As of `versions.js` **v1.2.0** the build panel also compares each JS file's
**runtime constant against its header comment** and flags a mismatch in amber.
Both numbers exist in every file, both kept drifting (`admin.js` was nine minor
versions adrift), and keeping them aligned was a discipline problem until it
became a detected one. The convention: **the first `v<semver>` in a file's leading
`//` comment block is its current version.** Stylesheets are exempt — their comment
is the source of truth.

`game.js` now sets `document.title` from `VERSION` at runtime. `admin.html` and
`reports.html` still carry hardcoded page-shell versions in their `<title>` and are
NOT yet driven from a constant. Remaining inconsistency.

### Layout

```
firebase-config.js      v1.1.1   Firebase init. Exports db, auth, storage, and
                                 CONFIG_VERSION.
                                 experimentalForceLongPolling is load-bearing —
                                 it fixes Safari's CORS block on Firestore's
                                 WebChannel transport. Do not remove.

versions.js             v1.2.0   Reads every file's version constant out of the
                                 deployed files, for index.html's build panel.
                                 v1.2.0 also parses header comments and flags
                                 drift. No imports, no side effects.

game.js                 v3.8.0   ~5,100 lines. Typing engine, sprint timer,
                                 WPM/accuracy math, streaks, mistake tracking,
                                 leaderboard, practice mode, chapter navigation,
                                 all modals. Write-ahead-log persistence.
                                 v3.5.0 owns the view-choice splash and
                                 applyViewMode() — the Classic/Adventure switch.
adventure-renderer.js   v1.1.0   Adventure Mode — the illustrated/animated skin.
                                 Listens for _ttbEmit('keystroke') from game.js.
                                 Out of alpha as of 1.0.0.
adventure.css           v1.0.0   Adventure Mode styling.

learn.js                v2.1.0   Lesson-mode engine (separate from game.js).
                                 Same WAL/flush persistence pattern as game.js.
keyboard.js             v1.1.1   On-screen keyboard widget, used by learn.html.

admin.js                v3.9.0   Book authoring, EPUB import, chapter editor,
                                 book tags, language filter (regex + audit),
                                 book list CSV export + balance report.
                                 v3.9.0 splits multi-work spine files.
                                 v3.10.0 one-pass book workflow, find & replace.
lessons-admin.js        v1.7.0   Lesson + class authoring, CSV roster import,
                                 lessons JSON import AND export, gate audit
                                 table, stuck-student scan (1.7.0).
                                 Version exposed as window.LESSONS_ADMIN_VERSION
                                 so admin.js can read it.
staff-admin.js          v2.2.0   Staff tab: roles, schools, classes, grants.

style.css               v3.3.0   Main stylesheet. #view-splash, condensed book bar.

index.js                v1.0.0    Cloud Function: generatePractice. Calls Gemini to
package.json                      generate custom practice paragraphs targeting a
                                  student's problem characters. 5/user/day cap.
                                  NOT deployable from this repo — needs a CLI.
```

Note: `index.js` and `package.json` are the **Cloud Functions** source and are
unrelated to `index.html`. They deploy separately via the Firebase CLI, not
GitHub Pages.

### Also in the repo, not deployable from a browser

```
firestore.rules          v2.1.0   Published. Byte-identical to source.
firestore.indexes.json            The ONLY written record of the three composite
                                  indexes and both TTL field overrides. Needs the
                                  CLI to deploy; the indexes can also be created
                                  from the click-to-create links Firestore returns
                                  on the first failing query.
CHANGELOG.md                      Full per-file version history. Headers are
                                  budgeted to 6 entries; the rest lives here.

TTL-GUIDE.md                      Console runbook: the two TTL policies, the
                                  billing arithmetic, why pre-v3.4.0 documents
                                  are never collected, and the three composite
                                  indexes. TTL lives in the GOOGLE CLOUD console,
                                  not Firebase — that trips everyone.

firestore-rules.test.mjs          ⚠️ KNOWN WRONG. Header says v1.1.0 and it seeds
                                  roles as auth-token claims; rules v2.x reads
                                  staff/{uid} documents and ignores the token.
                                  Committed as a starting point for a rewrite, not
                                  as a passing suite. Needs a CLI + emulator.
```

## Firestore data model

```
books/{bookId}                          title, author, chapter list metadata
books/{bookId}/chapters/{chapter_N}     the actual text students type

users/{uid}                             classId
users/{uid}/progress/{bookId}           chapter, charIndex, furthestChapter,
                                        furthestCharIndex, completedChapters[]
users/{uid}/stats/time_tracking         secondsToday, charsToday, mistakesToday,
                                        secondsWeek, charsWeek, mistakesWeek,
                                        lastDate, weekStart
users/{uid}/profile/info                initials, leaderboardOptOut
users/{uid}/lessonProgress/{lessonId}   lesson completion records

typing_logs/{uid}_{YYYY-MM-DD}          daily rollup for reports.html
typing_sessions/{auto}                  one doc per sprint (append-only)
practice_sessions/{auto}                one doc per AI practice attempt
practice_limits/{uid}                   rate-limit counter, written by Cloud Function

leaderboard/{uid}                        initials, bestWPM, bestAccuracy, bestStreak,
                                        chaptersCompleted, totalSecondsWeek, weekStart
                                        NO real names — every student can read this
                                        collection. Names live in typing_logs.
                                        Needs one composite index:
                                        weekStart ASC + totalSecondsWeek DESC

classes/{classId}                        class metadata
pendingClassAssignments/{...}            class-join handshake
lessons/{lessonId}                       lesson definitions. The ONLY copy of the
                                         curriculum — export it from admin.html
                                         (Lessons → Export JSON) to back it up.
                                         Export output is import-compatible, so a
                                         downloaded file can be pasted straight
                                         back into Import JSON to restore.
settings/goals                           daily/weekly time goals (global)
```

## Auth and admin access

Google sign-in via `signInWithPopup`. Students may also play anonymously; if they
sign in mid-session, `game.js` retroactively merges the anonymous session's stats
into their account (see the `signInAction` handler around line 2116).

Admin pages gate on a hardcoded email list:
- `admin.js` line 18 — `ADMIN_EMAILS`
- `reports.html` line 306 — a second, separate copy of the same list

⚠️ **Keep those two lists in sync.** They are duplicated, not shared.

⚠️ **This gate is cosmetic.** It hides UI; it does not stop anyone from reading or
writing the same data directly from the browser console. Real enforcement requires
Firestore security rules. See `SCALE-PLAN.md` § Security.

## Deploying

**Static pages** (everything except `index.js`/`package.json`): upload the changed
files to the GitHub repo through the web UI. GitHub Pages serves them. No build.

**Cloud Function:** requires the Firebase CLI from a machine with the functions
directory and `GEMINI_API_KEY` set as a Firebase secret. This is the one part of
the project that can't be shipped from a browser.

**Cache:** these files are served with default GitHub Pages caching. If a change
doesn't appear, hard-reload. The version stamps in the page titles and the admin
footer exist so you can confirm which build is actually loaded.

## Header budget

**60 lines and 6 version entries per file header, newest first.** Everything
older goes to `CHANGELOG.md`, which is organised per file.

A header should answer three questions and stop: what is this file, what changed
recently, and what will bite me if I "simplify" it. That last part — the
load-bearing invariants — is the reason a header exists at all, and it was
getting buried. `game.js` had reached **122 lines and 18 entries**, with the
entries silently **out of order**, because each session's edit anchored on the
previous newest one and landed a slot too deep. Nobody catches that by reading,
because nobody reads a 122-line comment.

Enforced, not merely requested: `versions.js` v1.3.0 audits every header and
reports over-budget, over-count, and out-of-order to **`index.html`'s build
panel** in red. Stylesheets are exempt — their comment is their only version.

The checker is sabotage-verified: it fires on 7 entries, on 61 lines, and on the
exact scramble `game.js` had, while not counting version numbers that merely
appear inside an entry's prose.

## Versioning rules

- Every file that ships gets a version bump.
- Patch and minor are automatic; **major requires Jake's explicit sign-off.**
- **Bump the runtime constant, not just the header comment.** The constant is what
  renders on the page; a header-only bump is invisible and actively misleading.
  See the version table above for where each file's constant lives.
- **Bump both, and they must agree.** Constant, header comment, and any `<title>`
  are three copies of one fact. `index.html`'s build panel flags constant-vs-header
  disagreement in amber as of `versions.js` v1.2.0 — if you see amber there, one of
  the two numbers is a lie and the constant is the one telling the truth.

## Book tags (admin.js v3.7.0 / index.html v3.2.0)

`books/{id}` carries `minAge`, `maxAge` (numbers, or **`null` for untagged**) and
`protagonistGender` (`''` untagged, or `female` / `male` / `multiple` / `ensemble`
/ `nonhuman` / `unspecified`).

`null` and `''` are meaningful values, not absences — read them with a type check,
never `|| 0` or `|| ''`. `unspecified` means "somebody looked and the text doesn't
say"; `''` means "nobody has looked yet". The admin book picker marks the latter
with an amber ○.

The library filters by **overlap**, not containment:
`book.minAge <= filterMax && book.maxAge >= filterMin`, with an absent filter end
unbounded. A student asking for 9–12 gets a 7–11 book, which is the point.
Untagged books are excluded from age-filtered results and counted in a note
beneath the filter bar.

## EPUB import: ask the book, don't guess

Three strategies, tried in order, all of them reading what the book states about
itself rather than inferring from shape:

1. **`epub:type`** on the root section says `frontmatter` / `bodymatter` /
   `backmatter`. Authoritative in 18 of 20 test books. Only bodymatter becomes a
   numbered chapter — before this, Standard Ebooks' `imprint.xhtml` was chapter 2
   of every book in the library and every real chapter was offset.
2. **The table of contents**, for splitting one spine file into many.
3. **Container structure** (`<article>` / `<section>`), the v3.9.0 heuristic.
4. Whole file, unchanged from the original behaviour.

⚠️ **A chapter's title may not be in its heading.** Standard Ebooks marks a titled
chapter as an `<hgroup>` with the ordinal in the `<h2>` and **the title in a
`<p epub:type="title">`**. A heading-only extractor returns "II" and never sees
"Old Tom and Nancy" — and because the title is a `<p>`, it also lands in the prose
as the first thing a student types. Both halves are fixed; if you touch this code,
rebuild the twenty-book harness described in `HANDOFF.md` §B.7 first.

⚠️ **`parseFloat` cannot compare part numbers.** `parseFloat("1.10")` is 1.1, the
same value as `parseFloat("1.1")`. Use `compareChapterIds()`.

## EPUB import: collections vs novels

One spine file is normally one chapter. **Collections break that rule** —
Standard Ebooks puts every short work of a collection in a single XHTML file as
sibling `<article>` / `<section>` elements. Aesop's Fables is 284 fables in one
file.

`findChapterUnits()` in `admin.js` detects that shape and splits on it. A unit
must have a heading *and* a paragraph; only leaf units count (so a
parts-and-chapters book splits into chapters, not parts); and fewer than two
units means no split, which is what keeps novels on the original code path.

The parse status line reports when a file was split and into how many sections.
If a split ever looks wrong, that number is the tell.

⚠️ Never use `innerText` on a `DOMParser` document here — it needs layout and
returns `undefined` in Firefox. Use `textContent`.

## Editing a book: one pass

`readBookMetadataForm()` is the only place the book metadata form is read. **Save
Metadata and Upload All both call it**, so they cannot drift — they did, for four
releases, and that is what made every book need two visits.

Upload All writes chapters *and* metadata. A new book is: create → parse → fill
in genre / age / protagonist → Upload All. Done.

⚠️ `loadBookList(selectFirst)` defaults to **false** and preserves the current
selection. Passing `true` makes it jump to the first book and fire `onchange`,
which hides the staging area and reassigns `activeBookId`. Only the boot call
should pass `true`.

**Find & replace** (Language panel) works on the staged copy only — nothing is
written until upload. Case-preserving, fixes a/an, whole-word by default, `/…/`
for regex. Preview before commit.

## Student school picker

Settings → School. A student with **no class** may set or clear their building;
`schoolId: ''` is a permanent valid state and is never nagged about. A student
**in a class** sees it read-only — the teacher's assignment wins, always.

Uses existing rules (`users/{uid}` self-write, `schools` read-if-signed-in). No
rules change was needed. Schools are cached 24h in `SCHOOLS_CACHE_KEY`; saving
clears `GOALS_CACHE_KEY`, which also carries `schoolId`.

## Books with a lot of chapters

Aesop's Fables is 286 chapters and was the first book to break the per-chapter
UI. Two thresholds now guard it, both set to **40**:

- `BOOK_BAR_MAX_SEGMENTS` (`game.js`) — above it, the classic book progress bar
  renders condensed. This is a **performance** guard as much as a visual one: the
  segmented bar cost four `getElementById` calls per chapter *per keystroke*.
- `MAP_MAX_DOTS` (`adventure-renderer.js`) — above it, the chapter map draws one
  continuous route instead of a dot per chapter. The branch returns *before* the
  per-chapter route loop; keep it that way or the frame cost stays.
- `CHAPTER_FILTER_MIN` (`game.js`) — above it, chapter dropdowns get a filter box
  matching number or title, with Enter as Go.

Every chapter dropdown is built by `buildChapterOptions()`. There were three
hand-rolled copies and they had drifted — two of them populated the *same*
`<select>` with different labels. One builder; don't add a fourth.

## Language filter

Built-in terms live in `FLAGGED_WORD_GROUPS` in `admin.js` (categories: `slur`,
`profanity`, `period`, `anatomy`) and need a code change. Custom terms live in
`settings/languageFilter` and apply to every book immediately.

Both accept **`/…/` for a regular expression**; anything else is a whole-word
literal. Patterns are validated on entry and skipped-with-a-report at compile
time, so one bad entry can't break every scan. Admin → Language panel →
**Show every term** renders the whole effective filter and will highlight which
terms fire against a sentence you paste in.

Some words are deliberately *not* flagged because they're innocent in period
English — see the comment above `FLAGGED_WORD_GROUPS` before adding any.

## localStorage keys

As of `game.js` v3.4.0 the app keeps real state locally. Clearing site data loses
at most one unflushed session; it is not destructive beyond that.

View-mode keys added in v3.5.0: `ttb_view` (`classic` | `adventure`) and
`ttb_viewRemember` (`'1'` | `'0'`). Both are a **cache** — the durable copies live
in `users/{uid}/profile/info` as `viewMode` / `viewRemember` and win on conflict,
which is what makes the choice follow a student between machines. There is also a
**sessionStorage** key, `ttb_splashBook`, holding the book id the splash last asked
about in this tab; that one is deliberately not durable.

| key | what |
|---|---|
| `ttb_wal_v2` | **write-ahead log** — position, time, sprint history not yet in Firestore |
| `ttb_learnwal_v1` | same, for lesson mode |
| `ttb_ch_v1:{book}:{chapter}` | cached chapter text |
| `ttb_goalsCache_v1` | goals + classId + schoolId, 1-day TTL. **Shared by game.js and learn.js** — one read serves both pages |
| `ttb_lessonsCache_v1` | the whole `lessons` collection, 4h TTL, count-validated (learn.js 2.2.0) |
| `ttb_lessonProgCache_v1` | the student's `lessonProgress`, 8h, uid-namespaced (learn.js 2.2.0) |
| `ttb_booksCache_v1` | the library list with `chapters` stripped, 6h, count-validated (index.html 3.3.0) |
| `ttb_idxProgCache_v1` | the student's per-book progress, 8h, uid-namespaced (index.html 3.3.0) |
| `ttb_lbThresholds` | leaderboard top-10 cutoffs |
| `ttb_sessionLength` | the sprint-length dropdown |

⚠️ **Every per-student cache is namespaced by uid.** On a shared cart machine a
cache that isn't would hand one student another's progress. If you add one, do
the same.

⚠️ **Caches degrade to a read, never to a broken page.** A quota failure, a
corrupt entry, or a parse error all fall through to a real fetch. The lessons
and library caches go one further and serve an EXPIRED copy rather than an error
screen, so a student on a flaky school network still sees the map they saw this
morning.

**Escape hatches**, because a TTL is not a workflow. After editing content, run
`ttbClearLearnCaches()` in the console on the school page, or
`ttbClearLibraryCache()` on the library, and reload.

⚠️ **`admin.js` and `admin.html` are a matched pair.** From `admin.js` 3.18.1 onward the
JS expects `create-reset-btn` and `autofill-status`, which exist only in the newer
HTML. Upload both or neither.

⚠️ **`contentVersion` couples two files — keep them together.** `game.js`
invalidates its 7-day chapter cache on `books/{id}.contentVersion`, and
`admin.js` **3.12.0** is the first version that has ever written it (from all
seven paths that change chapter text). Before that the field was read and never
set, so an edited chapter took up to a week to reach students, silently.
Running `game.js` 3.9.1+ against an `admin.js` below 3.12.0 brings that back
with no other symptom.

## Known constraints

- `game.js` is ~5,500 lines and does not have a test suite. Every change in
  Round 4 was verified by reading both sides of the interaction, then by hand.
- Default sprint length is **30 seconds** (`sessionValueStr = "30"`). This is the
  single most important number for understanding load — a lot of per-sprint work
  fires twenty times in a ten-minute typing block.
- `firestore.rules` v2.2.0 and `storage.rules` v2.0.0 are both in this repo and
  both must be pasted into the Firebase console to take effect. Nothing here
  deploys itself.
- ⚠️ `index.js` v1.6.0 and `package.json` **cannot be deployed at all** without a
  CLI. The Cloud Function actually running is the pre-1.6.0 one, which still
  exports seven abandoned custom-claims functions the security rules no longer
  consult. First person with terminal access should deploy this before anything
  else. `package.json` also moves Node 18 → 22, since 18 is no longer accepted.
- ⚠️ Del / Merge ↓ / Split in the admin staging list renumber chapters from array
  position, which flattens part-aware ids: delete one chapter from a two-part book
  and `1.01–2.09` becomes `1–22`. **Avoid those three buttons on a multi-part
  book** until that is fixed. Edit and Upload are safe.
- No automated backup of book content. `admin.html` is the only way in or out.
  Lesson content **can** now be exported (Lessons tab → Export JSON, v1.6.0);
  book content still cannot.
- Practice mode depends on Gemini free-tier quota, which Google has changed
  without notice more than once.

## Before you scale this

**Target, confirmed with Jake:** 7,000 middle schoolers in his district ÷ 3
trimesters ÷ 5 periods ≈ **467 simultaneous**, and that is deliberately
conservative — most districts run quarters and 6-8 periods. He charges nobody,
is not paid to write this, and every student past about thirty is money out of
his own paycheck. **Cost is the first priority, ahead of everything except data
that is wrong.**

Round 4 (2026-08-02) audited the whole app against that. What it found and
fixed is in `HANDOFF.md` §B; the short version:

- **`learn.js` had no caching at all** while `game.js` had accumulated a full
  layer, and `learn.js` is the page most students open daily. ~115 reads per
  load became ~3.
- **No query anywhere had a `limit()`** except the leaderboard. A building-wide
  semester report was ~126,000 reads on one click, 2.5× the daily free tier.
  There is now a 20,000-document ceiling that **refuses rather than truncates**
  — a partial report you can't tell is partial is worse than none.
- **Three things were wrong, not slow:** duplicate sprint rollups double-counting
  minutes in the reports teachers grade from; "My classes" denied outright for
  the default teacher scope; and teacher time corrections that have never once
  worked.
- **`typing_logs` was an unbounded authenticated write target** and students
  could forge their own graded minutes. Both closed in `firestore.rules` 2.2.0.

### App Check — client half live, enforcement unconfirmed

Sign-up is open to any Google account — deliberately, so students self-serve —
which meant an unvalidated write rule was an uncapped liability against a personal
card. `firestore.rules` 2.2.0 caps what a single forged document can cost;
App Check is what stops the flood arriving.

`firebase-config.js` **1.2.0** mints App Check tokens using **classic reCAPTCHA
v3**, and that is live and verified. Enforcement — Firebase console → App Check →
**APIs** → Cloud Firestore — is a separate switch and its state is **not
confirmed**. Check it before assuming you are protected.

⚠️ **Classic reCAPTCHA v3, not Enterprise.** Enterprise bills above 10,000
assessments a month and this app clears that in a week; classic has a quota that
stops evaluating rather than charging. Token TTL is 7 days because every refresh
is a billable assessment. The tell, if anyone re-keys it: classic issues a secret
key, Enterprise does not.

**Verified 2026-08-04, on a school Mac on the district network:**

| layer | result |
|---|---|
| Client mints a token | ✅ |
| District firewall / proxy | ✅ |
| Chrome enterprise policy, teacher profile | ✅ |
| **Student profile in Chrome** | ⚠️ **never tested** |

The remaining risk is filtering extensions — GoGuardian, Securly, Lightspeed are
force-installed **per profile**, so a teacher account passing does not prove a
student account will. Send any student to
**`typethatbook.misterwilson.org/appcheck.html`** and have them read the colour
back: it needs no devtools and no sign-in, which is why it exists (a managed
Chromebook has no console).

If enforcement is on and work stops saving: **App Check → APIs → Cloud Firestore →
Unenforce.** The write-ahead logs mean nothing is permanently lost, but a period's
data would not reach a report that day.

### ⚠️ Firebase Storage has its own rules, and they are not in firestore.rules

`storage.rules` (v2.0.0, in the repo, console-only) governs the `covers/` bucket.
It went undocumented for most of the project's life, and that absence caused an
outage: the old rules required a Firestore document at `admins/{email}`, a
collection nothing in the codebase referenced. It was identified as a dead fossil
by grep, deleted, and cover uploads silently failed on every book afterwards.

**The lesson generalises.** Several things consume Firestore data from outside the
codebase — Storage rules, Firestore rules, TTL policies, index definitions, App
Check settings, reCAPTCHA keys. **Grep cannot see any of them.** Before deleting a
collection, check the console too.

### Hardware assumptions

Jake's building is **MacBooks running Chrome**. Districts that adopt this may be
Chromebooks, possibly in ephemeral mode where localStorage is wiped at every
sign-out — which would defeat every cache above. That is survivable by design
(each cache falls back to a plain read) but roughly 25× more expensive, so if
another district's numbers look wrong, check that setting in their Google Admin
console before touching code.

Schools, classes, and teacher roles are built and live — see `firestore.rules`
and §4 of `HANDOFF.md`. `MULTITENANCY.md` and `SCALE-PLAN.md` are referenced in
older notes but **do not exist in the repo**; don't send anyone looking.
