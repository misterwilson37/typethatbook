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
| `index.html` | 3.0.1 | students | Library — pick a book, see per-book progress and today's time |
| `game.html` | 3.0.1.1 | students | **The main event.** Type a book chapter. Sprints, WPM, streaks, leaderboard, AI practice mode, Adventure Mode (`game.js` v3.4.0) |
| `learn.html` | School 1.7.0 | students | Structured lessons (`learn.js` v1.7.0) — home row, finger drills, on-screen keyboard guidance |
| `admin.html` | 2.8.0 | Jake | Book/chapter authoring (EPUB import via JSZip), lesson authoring + JSON import/export, goals |
| `reports.html` | 2.4.1 | Jake | Time-on-task and accuracy reports by student and date range |

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

game.js                 v3.5.0   ~5,100 lines. Typing engine, sprint timer,
                                 WPM/accuracy math, streaks, mistake tracking,
                                 leaderboard, practice mode, chapter navigation,
                                 all modals. Write-ahead-log persistence.
                                 v3.5.0 owns the view-choice splash and
                                 applyViewMode() — the Classic/Adventure switch.
adventure-renderer.js   v1.0.0   Adventure Mode — the illustrated/animated skin.
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
lessons-admin.js        v1.7.0   Lesson + class authoring, CSV roster import,
                                 lessons JSON import AND export, gate audit
                                 table, stuck-student scan (1.7.0).
                                 Version exposed as window.LESSONS_ADMIN_VERSION
                                 so admin.js can read it.
staff-admin.js          v2.2.0   Staff tab: roles, schools, classes, grants.

style.css               v3.2.0   Main stylesheet. v3.2.0 adds #view-splash.

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
| `ttb_goalsCache_v1` | goals + classId + schoolId, 1-day TTL |
| `ttb_lbThresholds` | leaderboard top-10 cutoffs |
| `ttb_sessionLength` | the sprint-length dropdown |

## Known constraints

- `game.js` is 4,263 lines and does not have a test suite.
- Default sprint length is **30 seconds** (`sessionValueStr = "30"`). This is the
  single most important number for understanding load — a lot of per-sprint work
  fires twenty times in a ten-minute typing block.
- No Firestore security rules in this repo.
- No automated backup of book content. `admin.html` is the only way in or out.
  Lesson content **can** now be exported (Lessons tab → Export JSON, v1.6.0);
  book content still cannot.
- Practice mode depends on Gemini free-tier quota, which Google has changed
  without notice more than once.

## Before you scale this

Read `SCALE-PLAN.md` and `MULTITENANCY.md`.

Scaling to 7,000 students is largely done: **~$34,400/year → ~$0.32/year**, with
reads at 58% and writes at 105% of the Firestore free tier. Two console tasks are
outstanding (a budget alert and the `typing_sessions` TTL policy), and there are
still no security rules — which at 7,000 students matters more than the money ever
did.

Schools, classes, teacher roles: designed in `MULTITENANCY.md`, not built. The
`classId`/`schoolId` fields are already flowing onto every log document so there's
only one migration, not two.
