# Spot On! — Visual Perception Games

A collection of educational games that train visual perception skills: alignment, spacing, balance, and formatting recognition. Built for classroom use on iPads, Chromebooks, laptops, and phones. Deployed via GitHub Pages at **spoton.misterwilson.org**.

## Games

### Alignment & Formatting

| Game | Version | File | Description |
|------|---------|------|-------------|
| **Spot the Format** | 2.2.0 | spottheformat.html | Identify text formatting: horizontal/vertical alignment, line spacing, indentation. |
| **Format Frenzy** | 2.2.0 | formatfrenzy.html | Timed challenge — identify all 4 formatting properties before the bomb explodes. Timer accelerates each round. |
| **Format Trainer** | 0.11.1 | formattrainer.html | Practice formatting step-by-step. 6 levels covering basic and MLA format with speed and streak modes. Uses time-based scoring (lower is better), isolated from the unified leaderboard. |

### Centering & Layout

| Game | Version | File | Description |
|------|---------|------|-------------|
| **Find the Center** | 2.2.0 | findthecenter.html | Click the exact center of randomly generated quadrilaterals. |
| **Perfect Alignment** | 2.2.0 | perfectalignment.html | Drag shapes to align centers. Shapes get smaller and mismatched as rounds progress. |
| **Balanced Placement** | 2.2.0 | balancedplacement.html | Position two shapes with equal spacing inside containers. |
| **Balanced Placement II** | 2.2.0 | balancedplacement2.html | Place images and text with equal spacing. Alignment rules determine which side elements belong on. |
| **Sweet Spot** | 2.4.1 | sweetspot.html | Find the perfect placement for text on curated images. Polygon scoring zones. |

### Visual Perception

| Game | Version | File | Description |
|------|---------|------|-------------|
| **Picture Perfect** | 2.4.1 | pictureperfect.html | Spot the defects — is each image correct, stretched, or pixelated? |

## Site Files

| File | Version | Description |
|------|---------|-------------|
| **index.html** | 2.3.0 | Dynamic game index, loads from Firestore `site-config/index` with hardcoded FALLBACK_DATA. |
| **admin.html** | 2.11.0 | Admin panel: Sweet Spot level editor, Picture Perfect image manager, site/index config, leaderboards, **Privacy tab** (legacy cleanup, delete a student, quarterly retention, picture sources). Admin-only: checks with the database and signs anyone else out. |
| **leaderboard.html** | 1.5.0 | Unified leaderboard across all 8 higher-is-better games. Format Trainer scores are filtered out of the "All Games" view. |
| **privacy.html** | 1.0.0 | Privacy & Data Policy, including the COPPA notice. Linked from every page's menu or footer. |
| **SECURITY.md** | — | The written information-security program (COPPA 16 CFR 312.8). |
| **score-save.js** | 1.0.0 | **The one place a score is written.** Every game imports `saveScore()`. Public score + private email record. |
| **privacy-tools.js** | 1.2.0 | Admin privacy tools (cleanup, delete, retention, picture sources + moving outside pictures into Firebase Storage). Imported by admin.html; tested directly. |
| **firestore.rules** / **storage.rules** | 2.0.0 | The security rules. Not deployed from here — paste into the Firebase console. |
| **tailwind.css** | — | Built Tailwind (replaces the CDN script). **Rebuild after adding any Tailwind class** — see "Styles and fonts". |
| **fonts/** | 1.0.0 | Self-hosted Inter, Urbanist, Questrial (OFL) + `fonts.css`. |
| **scripts/auth-cleanup.py** | 1.0.1 | Deletes sign-in accounts unused 24 months (or one on request). Runs in Google Cloud Shell — instructions at the top of the file. |
| **tests/** | — | Test harnesses (rules, privacy tools, policy promises, self-hosted assets). Not part of the site. |
| **firebase-config.js** | 1.1.0 | ES-module-only config for the `spot-on-games` Firebase project. (Analytics ID removed.) |
| **games.css** | 2.1.0 | Shared stylesheet. Defines `.btn-*`, `.nav-links`, `.game-wrapper`, `.canvas-container`, `.leaderboard`, `.screen`, etc. |
| **firestore.indexes.json** | — | Documents the two composite indexes the `scores` collection needs (see below). Not deployed automatically — this repo has no CLI/`firebase deploy` access, so it's a reference for recreating the indexes by hand in the console if the project is ever rebuilt. |

## Architecture

### Firebase

Single project: **`spot-on-games`**. All files use the modern **modular SDK v11.6.1** imported as ES modules. No compat SDK usage anywhere in the codebase.

Every page that touches Firebase loads it this way:

```html
<script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
    import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
    import { getFirestore, collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
    import { firebaseConfig } from "./firebase-config.js";

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    // ...
</script>
```

### Firestore Collections

| Collection | Purpose | Written By | Read By |
|------------|---------|------------|---------|
| `scores` | All leaderboard entries. **Public.** Only: `gameId, initials, score, uid, timestamp` + optional `flagged, roundCount, averageScore, roundsCompleted, bestStreak, categoryScores, levelCount`. Never email/name/photo — the rules reject them. | All games, via `score-save.js` | Anyone (leaderboard.html has no sign-in) |
| `players` | `players/{uid}` = `{ email, lastPlayed }`. **Private** — the only place a student's email is kept. | `score-save.js` (own record only) | Admin only |
| `levels` | Sweet Spot level data (image URL, polygon zones, feedback text) | admin.html | sweetspot.html |
| `picture-perfect-images` | Picture Perfect image pool | admin.html | pictureperfect.html |
| `bp2-content` | Balanced Placement II curated image/text pool | admin.html | balancedplacement2.html |
| `site-config` | Index page layout (categories, games, order, enabled flag) | admin.html | index.html |

### gameIds in the `scores` collection

Canonical gameId strings, higher-is-better unless noted:

- `sweet-spot`
- `find-the-center`
- `perfect-alignment`
- `balanced-placement`
- `balanced-placement-ii`
- `picture-perfect`
- `spot-the-format`
- `format-frenzy` (score is time in seconds — higher still wins because it represents a faster *per-round* average in the current scoring)
- `ft-basic`, `ft-mla`, `ft-basic-speed`, `ft-mla-speed`, `ft-random-speed` — Format Trainer time-based modes, **lower is better**
- `ft-streak` — Format Trainer streak mode, higher is better

The unified leaderboard (`leaderboard.html`) uses a `KNOWN_GAME_IDS` allowlist to exclude the Format Trainer time-based IDs from the "All Games" view, since mixing asc-sorted and desc-sorted scores in one ranked list is incoherent. Per-game filter buttons in the leaderboard only cover the 8 main games; Format Trainer shows its own per-level leaderboard in-game.

### Security rules

The live rules are **`firestore.rules`** and **`storage.rules`** in this repo. There is no
CLI, so they are deployed by pasting each whole file into the Firebase console
(spot-on-games → Firestore Database → Rules, and Storage → Rules) and pressing Publish.
In short: game content and Storage uploads are admin-only (two named, verified emails);
a student can only create a score under their own uid with the fixed field list; the
`players` collection is admin-read-only. `tests/rules-test.mjs` runs the real files.

### Privacy

See **privacy.html** (the public policy) and **SECURITY.md** (the security program).
Every promise in them is pinned to code by `tests/privacy-promises-test.mjs`. The rules
of thumb for future changes:

- **Never put an email, name or photo on a `scores` record.** Rules protect whole
  documents, not fields, and `scores` is public. Private data goes in `players/{uid}`.
- **Scores are written only by `score-save.js`.** Adding a score field means adding it
  to `SCORE_FIELDS` there **and** to `validNewScore()` in `firestore.rules`.
- **No new outside service** (fonts, scripts, analytics, image hosts) without updating
  privacy.html and SECURITY.md first.
- **Pictures live in Firebase Storage.** admin.html copies any picture added by URL
  (Picture Perfect add/seed, Balanced II add/edit) into Storage right after saving;
  admin → Privacy → "Move outside pictures" catches anything else.
- **Retention:** 24 months without a saved score → email record deleted, scores
  anonymised (initials kept). Run quarterly from admin.html → Privacy (it shows who
  expires next and when), then `scripts/auth-cleanup.py` in Cloud Shell for sign-in accounts.


### Required Firestore Indexes

Every game's leaderboard, and every game's post-submit rank calculation, queries
`scores` filtered by `gameId` and ordered by `score`. Firestore auto-indexes single
fields but **not** an equality filter combined with a sort on a different field —
that combination needs a composite index created by hand, or the query throws
`failed-precondition` at runtime. `leaderboard.html` is the one page that never
needed one, because it sorts by `score` alone with no `gameId` filter — which is
why it kept working in Aug 2026 while every in-game leaderboard failed at once.

Two composite indexes cover every query shape in this repo (verified by scanning
every `query()` call across all games):

| # | Collection | Fields | Needed by |
|---|------------|--------|-----------|
| 1 | `scores` | `gameId` ASC, `score` DESC | Every in-game leaderboard display (top scores per game) + admin.html |
| 2 | `scores` | `gameId` ASC, `score` ASC | `getPlayerRank()`'s `score >` comparison in 6 games, and Format Trainer's timed modes (lower-is-better sort) |

**`firestore.indexes.json` in this repo documents both, but does not deploy
them** — there's no CLI access in this workflow, so the source of truth is
whatever's live in the Firebase console. If the project is ever recreated, or an
index is accidentally deleted, recreate both by hand: Firestore Database →
Indexes → **Manual** tab → Create index → **Structured** → collection ID
`scores` → add the two fields from the table above, in order → Query scope
**Collection**.

An index shows **Building** for a few minutes after creation; queries fail with
the exact same `failed-precondition` error until it flips to **Enabled**. Don't
diagnose against a still-building index.

### Firestore error handling in the games

As of the Aug 2026 patch (`v2.1.1` / `v2.2.1` / `v2.3.1` / `v0.10.1`, see Version
History), every game's `loadLeaderboard()` follows the same shape:

1. Run the query inside `try`. On failure, translate `error.code` into an actual
   sentence via `describeFirestoreError()` (`failed-precondition` → index
   building; `permission-denied` → says so; anything else → generic) and
   `return` immediately.
2. Render the result **outside** the `try/catch`, so a bug in rendering can
   never be mistaken for a database problem.
3. Callers that need to highlight a just-submitted score pass a `highlightId`
   into `loadLeaderboard()` directly, rather than calling `renderLeaderboard()`
   a second time afterward. The old two-call pattern let a successful render
   silently overwrite an error message — or, after a submit, made a live
   "Score saved!" confirmation sit next to an "error"-flavored empty board with
   no way to tell they were the same failure.

Format Trainer's leaderboard modal shows four boards at once, so its
`loadScores()` returns `{ data, error }` instead of a bare array — an empty
`data` with `error: null` is a genuinely empty board; `error` set means the
query failed and the modal says so per-card instead of claiming no one has
played.

## Storage CORS (pictures)

Pictures live in Firebase Storage (`spot-on-games.firebasestorage.app`). A page that
only DRAWS a picture needs nothing special. A page that READS pixels back
(`getImageData`/`toDataURL` — Sweet Spot's cropping, admin's Sweet Spot level editor)
must load it with `crossOrigin`, and then the bucket must send a CORS header for
spoton.misterwilson.org. That's a one-time bucket setting, made in Cloud Shell; the
exact commands are in admin → Privacy → 📋 How-to → "One-time setup". **Never add
`crossOrigin` to a page that doesn't read pixels** — that is how Picture Perfect 2.4.0
failed to load every picture (fixed in 2.4.1).

## Styles and fonts

No page loads anything from an outside company except the Firebase SDK (from Google).
Fonts are self-hosted in `fonts/`. Tailwind is a **built file**, `tailwind.css`, not the
CDN script — so **a Tailwind class that isn't already used somewhere won't exist until
the file is rebuilt** (`cd tests && npm i && npm run build:css`, which needs a shell; a
Claude session can do it). `tests/self-hosted-assets-test.mjs` fails if it's stale.
`tailwind.css` is linked **last** in `<head>` because the CDN script injected its styles
there, and moving it would change which rule wins.

## Cross-Platform Compatibility

- **Desktop**: Mouse and keyboard. Space advances rounds; `1`-`4` select answers in Picture Perfect.
- **iPad**: Touch-optimized (minimum 44×44px targets). All games allow pinch-zoom — no `user-scalable=no` anywhere in the codebase.
- **Phone**: Portrait and landscape supported. Dynamic viewport units (`100dvh`) handle mobile browser chrome.

### Touch-action rules (games.css)

Only two `touch-action` rules exist, scoped cleanly:
- `canvas { touch-action: none; }` — canvases handle drag/click natively
- `.game-wrapper { touch-action: pan-y; }` — page scroll allowed outside canvas

## Admin Panel

Accessible via the `⚙` link in the footer of index.html, or directly at admin.html. Signed-in users can:

- **Site / Index**: Add/remove/reorder games, manage categories, enable/disable games, apply special styling (e.g., fire theme for Format Frenzy). Writes to `site-config/index`.
- **Sweet Spot**: Level editor with polygon zone drawing, image crop tool, feedback text per level. Writes to `levels`.
- **Picture Perfect**: Image pool manager with preview/edit modal. Writes to `picture-perfect-images`.
- **Balanced Placement II**: Content pool manager for curated images and text. Writes to `bp2-content`.
- **Leaderboards**: View, flag, and delete scores for any game.

## Authentication

Google Sign-In via Firebase Auth popup (`GoogleAuthProvider` + `signInWithPopup`). Scoring requires sign-in; anyone can play without it, and nothing is saved for them. Sign-out is a single `✕` in the user badge. Every game implements the same auth UI, derived from the `.user-badge` component in games.css.

## Adding a New Game

1. Create the game HTML. Use an existing game like `findthecenter.html` as a template for the Firebase/auth/score/leaderboard boilerplate. Save scores **only** with `saveScore()` from `score-save.js`.
2. Link `fonts/fonts.css` and `games.css` (and `tailwind.css` last in `<head>` if you use Tailwind classes — then rebuild it). Keep game-specific styles in a short inline `<style>` block.
3. Choose a unique gameId in kebab-case (e.g., `new-game`).
4. Include the standard nav header (the Privacy link is required — a test checks every page):
   ```html
   <div class="nav-links">
       <a href="index.html" class="nav-link">← All Games</a>
       <div class="nav-group">
           <a href="leaderboard.html" class="nav-link">🏆 Leaderboard</a>
           <a href="privacy.html" class="nav-link">🔒 Privacy</a>
       </div>
   </div>
   ```
5. Add the game to `site-config/index` via the admin panel.
6. Add the gameId to `GAME_NAMES` and `GAME_CLASSES` in `leaderboard.html` with a filter button (if the game is higher-is-better and belongs in the unified view).

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Space** | Advance to next round / start / restart |
| **1–4** | Select answer (Picture Perfect) |
| **Enter** | Submit initials on Game Over screen |

## Version History

### Sep 2026 — Privacy round (Figgins)

Seven of nine games were saving each student's email, Google name and profile-photo
link on every score, in a collection anyone could read without signing in. Now:

- **All nine games** save through the new `score-save.js`: public score (initials,
  score, uid, stats) + private `players/{uid}` email record. Games 2.2.0 (Picture
  Perfect 2.3.0, Sweet Spot 2.4.0, Format Trainer 0.11.0). Picture Perfect and Balanced
  Placement II switched from `userId` to `uid`.
- **Rules 2.0.0**: fixed score fields, own-uid only, 1–3 character initials; `players`
  admin-read-only; verified-email admin check; Storage uploads admin-only.
- **admin.html 2.6.0**: database-checked admin gate; emails joined from `players`; Name
  column removed; Privacy tab.
- **Privacy & Data Policy** (privacy.html) and **SECURITY.md**; Privacy link on every page.
- **Self-hosted fonts and built Tailwind** — no outside company contacted on page load.
- **firebase-config.js 1.1.0**: unused Analytics ID removed.
- **migration.html removed** from the site.
- **tests/**: four harnesses, mutation-verified.

Version-stamp note: Format Trainer's title said 0.10.0 while this README said 0.10.1, and
the leaderboard's title said 1.3.0 while this README said 1.2.0; both bumped from the
higher number.

### Aug 2026 — Missing composite indexes + leaderboard error handling

Every in-game leaderboard was throwing `failed-precondition` because the
`scores` collection was missing the composite indexes its own `gameId` +
`orderBy(score)` / `score >` queries require. `leaderboard.html` masked this for
weeks, since its single-field sort needs no composite index and kept working
while every other leaderboard silently failed. Root-caused via a browser-console
diagnostic that ran the identical query shape against multiple `gameId` values
to confirm the failure was index-wide, not specific to one game. Two composite
indexes created in the Firebase console; both now documented (not deployed —
no CLI here) in `firestore.indexes.json`. See "Required Firestore Indexes"
above.

While in there, fixed a related bug present in every game: after a score
submit, `handleScoreSubmit()` called `loadLeaderboard()` then
`renderLeaderboard()` a second time. If the leaderboard query failed, that
second render call silently overwrote the error message with "No scores yet" —
so a genuine outage looked identical to nobody having played, right below a
"✓ Score saved!" confirmation that was, in fact, true. `error.code` is now
surfaced as an actual sentence instead of a generic string, and rendering
happens outside the `try/catch` so a render bug can't be mislabeled as a
database problem.

- **Find the Center 2.1.1**, **Balanced Placement 2.1.1**, **Balanced Placement
  II 2.1.1**, **Perfect Alignment 2.1.1**, **Spot the Format 2.1.1**, **Format
  Frenzy 2.1.1**, **Sweet Spot 2.3.1** (also picked up a missing `!db` guard on
  `loadLeaderboard()` it never had), **Picture Perfect 2.2.1** — leaderboard
  error handling rewritten per above.
- **Format Trainer 0.10.1** — `loadScores()` now returns `{ data, error }`
  instead of a bare array so its four-board leaderboard modal can tell a real
  failure from an empty board, per card.

### Apr 2026 — Infrastructure cleanup

Full Firebase SDK migration: all games moved from compat v10.7.1 (multiple script tags loading `firebase.*` globals) to modular v11.6.1 (ES-module imports). Unified `firebase-config.js` as a single-purpose ES module. Unified auth/Firestore call patterns across every game.

- **Sweet Spot 2.3.0** — modular Firebase; dropped unused Storage SDK reference; simplified `init()` error handling.
- **Find the Center 2.1.0**, **Balanced Placement 2.1.0**, **Perfect Alignment 2.1.0**, **Picture Perfect 2.1.0**, **Balanced Placement II 2.1.0**, **Spot the Format 2.1.0**, **Format Frenzy 2.1.0** — modular Firebase migration.
- **Picture Perfect 2.1.0**, **Balanced Placement II 2.1.0**, **Format Trainer 0.10.0** — also removed `user-scalable=no` viewport restriction (accessibility fix — pinch-zoom now allowed).
- **Format Trainer 0.10.0** — first versioned release. Nav standardized to shared `.nav-links`/`.nav-link` classes. Added the `🏆 Leaderboard` link it was previously missing.
- **Index 2.2.0** — added Format Trainer to FALLBACK_DATA.
- **Leaderboard 1.2.0** — added `balanced-placement-ii` to known game IDs and filter buttons (new lavender badge); added `KNOWN_GAME_IDS` allowlist so the "All Games" view excludes Format Trainer's time-based scores from the top list; initial query expanded from 100 to 200 to keep the filtered display full.
- **Migration 1.0.0** — version-stamped. Migration from ellisbell-c185c → spot-on-games is complete. Consider moving this file out of the deployed site.

### Earlier

See git log. Prior state: mixed compat/modular SDKs, inline firebase-config dual-mode (ES export + CommonJS) that silently broke classic-script loads, scattered game IDs, Format Trainer not yet in the index.

---

*Games created with Claude & Gemini • Enhanced for the classroom*
