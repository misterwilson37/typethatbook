# Round 6 (Noiseless) — what to upload, in order

28 files changed. **Two of them fix anything.** Everything here is verified: all JS
parses, `audit-versions.mjs` reports 0 problems, and 11/11 fast harnesses pass.

---

## 1. Upload these two first — they fix live bugs

| file | version | what it fixes |
|---|---|---|
| `lessons-admin.js` | 1.7.1 | The **Students tab in admin was throwing during setup.** Roster never loaded, CSV import buttons dead, progress tabs dead. |
| `learn.js` | 2.2.3 | `beginStep()` called a nonexistent `finishLesson()` — a student could land on a dead drill screen with nothing written. |

⚠️ **After uploading `lessons-admin.js`, open the Students tab in admin and check
that the roster loads and "Add One Student" shows your classes in its dropdown.**
This is the one item in this round I could not verify in a browser. If the roster was
loading fine for you *before* this change, then my model of the bug is wrong and I'd
want to know that more than I want the fix.

## 2. Upload when convenient — a real fix, but nothing user-visible

| file | version | why |
|---|---|---|
| `adventure-renderer.js` | 1.2.0 | Its runtime constant said `1.1.0` while the code was 1.2.0. **Code untouched** — only the constant. Fixes the build panel reporting a stale version on a correct deploy. |
| `admin.js` | 3.23.2 | Header refresh (it was nine versions stale) plus one line: `document.title` is now driven from `ADMIN_VERSION`. |
| `admin.html` | — | Its `<title>` is now a labelled pre-JS fallback instead of a hardcoded version. **Pairs with `admin.js` — upload both or neither.** |

## 3. Optional — comment-only, zero functional change

| file | version | why |
|---|---|---|
| `game.js` | 3.13.1 | Header trimmed to the 6-entry/60-line budget your own build panel enforces. Nothing else. Batch it with your next real `game.js` change. |

## 4. Repo hygiene — commit, but nothing depends on them being live

**Docs:** `HANDOFF.md`, `HANDOFF-round5.md` (new — the archive Round 5 asked for and
didn't get), `README.md`, `CHANGELOG.md`, `PEDAGOGY-AUDIT.md`.

**Test harnesses** — all 13 existing ones had a dead absolute path and could not run
in a fresh checkout. Now repo-relative:
`about-render-test.mjs`, `about-test.mjs`, `card-markup-test.mjs`,
`chapter-harness.mjs`, `cover-harness.mjs`, `credit-test.mjs`, `credits-test.mjs`,
`fix-candidates.mjs`, `map-geometry-test.mjs`, `ordinal-test.mjs`,
`progress-test.mjs`, `real-epub-harness.mjs`, `scan2.mjs`, `verify-guards.mjs`.

**New harnesses:** `undefined-calls-test.mjs` (found both live bugs above),
`run-all-tests.mjs` (runs the suite in one command), `audit-versions.mjs` (the
version-drift check, offline).

---

## Not in this zip, and why

- `firebase-storage.rules` — you deleted it during the session. Nothing to upload.
- `firestore.rules`, `storage.rules` — unchanged. Still console-only; worth
  confirming the console has 2.2.0 and 2.1.0 respectively.
- `reports.html` — unchanged at 2.8.0, and correct. Round 5 nearly lost this file, so
  it's worth confirming the live copy says 2.8.0 in its footer and not 2.4.1.
- `index.html`, `style.css`, `keyboard.js`, `staff-admin.js`, `versions.js`,
  `firebase-config.js`, `index.js` — untouched.

## Running the tests (for whoever edits the code next, not for you)

```
npm install --no-save jsdom jszip @xmldom/xmldom acorn acorn-walk
node run-all-tests.mjs                 # 11 harnesses, ~5 seconds
node run-all-tests.mjs --with-epubs    # plus 4 corpus harnesses over library/
node audit-versions.mjs                # version + header drift, no browser needed
```
