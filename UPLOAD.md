# UPLOAD — Round 28 (Daugherty), 2026-08-23

**19 files changed of 180 in the repo, plus this note.** This archive contains
**only those**, at their real paths. Drop it over a checkout, or upload file by
file through the GitHub web portal in the order below.

✅ **THIS SET WAS VERIFIED BY APPLYING IT.** A pristine copy of the delivered
repo, plus these files and nothing else, runs **all 46 harnesses green** and
`audit:versions` clean. That is the check that matters for a partial upload —
"the files I edited all pass" is a different and weaker claim than "these files
are sufficient."

⚠️ **AND THE VERIFICATION EARNED ITS KEEP ON THE FIRST RUN: `versions.js` WAS
MISSING FROM THE FIRST BUILD OF THIS SET.** The list of changed files was correct;
the shell loop that copied them dropped its last line, because the manifest had no
trailing newline and `while read` discards an unterminated final line. **The count
printed 19 either way.** Had this shipped, `game.js` v3.43.0 would have imported
`countBuildNotes` from `versions.js` v1.11.0, which does not export it — a blank
page, from a file nobody had touched. See HANDOFF §0.-20.L.

⚠️ **DELETE THIS FILE AFTER THE UPLOAD.** `UPLOAD.md` is a note about one deploy,
not a repository document. It is the only file here that is not meant to survive.

---

## ⚠️⚠️ ORDER MATTERS THIS ROUND, AND IT DID NOT LAST ROUND

`ADMIN_EMAILS` moved into `firebase-config.js` and **five files now import it from
there**. Uploading through the web portal means one commit per file, so the site
is in a **mixed state between commits** — some files new, some old, live, with
students possibly on it.

⚠️ **The bad ordering is not a degraded page. It is a blank one.** A browser that
loads the NEW `game.js` against the OLD `firebase-config.js` throws
`SyntaxError: does not provide an export named 'ADMIN_EMAILS'` **at import time**,
before any of the file runs. No HUD, no text, no error visible to a child — a
white screen.

**Upload group 1 completely before starting group 2.**

### Group 1 — the shared modules everything else imports

| # | file | why first |
|---|---|---|
| 1 | `firebase-config.js` | **1.3.0** — new home of `ADMIN_EMAILS` + `isStaffUser()`. ⚠️ Five files import it. **This one is the whole reason for the ordering.** |
| 2 | `versions.js` | **1.12.0** — `renderBuildList` gained `{ notes }`; imported by `game.js`, `learn.js`, `index.html` |

⚠️ **BOTH ARE BACKWARD-COMPATIBLE ON THEIR OWN.** `firebase-config.js` v1.3.0
still exports everything v1.2.0 did — it only *adds*. `versions.js` v1.12.0's new
option defaults to off, so an old caller that passes nothing still works. **That
is deliberate: after group 1, the live site is still fine on the old page files.**
If you have to stop halfway, stop here.

### Group 2 — the pages (any order within the group)

| # | file | what changed |
|---|---|---|
| 3 | `game.js` | **3.43.0** — notes gated; the false `stale module cache` alarm fixed; imports `ADMIN_EMAILS` |
| 4 | `learn.js` | **2.31.0** — twin of the above; imports `ADMIN_EMAILS` |
| 5 | `index.html` | **3.12.0** — build-info button gates notes; imports `isStaffUser` |
| 6 | `admin.js` | **3.31.2** — imports `ADMIN_EMAILS`. No behaviour change |
| 7 | `reports.html` | **2.25.1** — `BOOTSTRAP_EMAILS` aliases the import. No behaviour change |
| 8 | `lessons-admin.js` | **1.13.2** — header entries archived. **No code changed at all** |

### Group 3 — stylesheets (safe any time, but they are the visible fix)

| # | file | what changed |
|---|---|---|
| 9 | `style.css` | **3.8.1** — `#footer-full` opaque, bounded, self-defending |
| 10 | `adventure.css` | **1.0.3** — ⚠️ **the round's root cause.** The unscoped `body footer { opacity:.55 }` |

⚠️ **These two are what makes the panel readable, and they are independent of
everything above.** If you only want the readability fix today and want to defer
the rest, **groups 1 and 2 can wait and these two cannot break anything** — no
page imports a stylesheet.

### Group 4 — repo only, never served to a browser

`CHANGELOG.md` · `HANDOFF.md` · `README.md` · `ROADMAP.md` ·
`tests/README.md` · `tests/build-panel-test.mjs` *(new)* ·
`tests/run-all-tests.mjs` · `tests/version-stamp-test.mjs` ·
`tools/audit-versions.mjs`

⚠️ **`tests/build-panel-test.mjs` IS NEW AND `tests/run-all-tests.mjs` REGISTERS
IT.** Upload both or neither — the runner's registration audit **fails the suite**
on a `.mjs` in the folder that is in no list, so uploading only the harness turns
`npm test` red for a bookkeeping reason.

⚠️ **`README.md` IS A RECONSTRUCTION.** The project README had been overwritten by
a copy of `tests/README.md` some rounds ago and there is no history to recover it
from. Read HANDOFF §0.-20.J before accepting it. **If you have the original
anywhere, use yours.**

---

## After the upload — what to check, in one hover

Open a book in Library and **hover the footer**.

1. **The triad reads `game.html v1.2.0 · game.js v3.43.0 · style.css v3.8.1`.**
   If `game.js` still says 3.42.3, the new code is not running and nothing else
   below means anything.
2. **The hover panel is readable** — solid white, sharp black text, no book text
   showing through. That is the whole fix. If it is still washed out,
   `adventure.css` did not land or is cached; hard-reload.
3. **No red `adventure-renderer.js … stale module cache` line** in classic view.
   ⚠️ That line was **false** and fired every session before this round. Its
   absence is the fix working, not information missing.
4. **Signed out or as a student:** no ⚠ lines, and a grey
   *"N build notes — sign in as staff to read them."*
   ⚠️ **That grey line is load-bearing.** A panel with no ⚠ *and* no grey line is
   genuinely clean. A panel with the grey line has notes you are not being shown.
   Sign in with an admin account and hover again — **no reload needed**, it
   re-renders on the next hover.
5. **Do the same on `learn.html`.** The two pages are hand-maintained twins and
   the seventh twin failure of the week was one page having a feature the other
   did not.

⚠️ **If any student page is BLANK after this deploy, it is the ordering.** Upload
`firebase-config.js` and hard-reload; that is the only new way this round can fail.

---

## What did NOT change

**161 of 180 files are untouched** and are not in this archive — every book in
`library/`, `firestore.rules`, `functions/`, `keyboard.js`,
`adventure-renderer.js`, `daylog.js`, `session-log.js`, `stats-wal.js`, `hud.js`,
`settings-panel.js`, `drill-filter.js`, `celebrate.js`, `receipt.js`,
`update-gate.js`, `variety-floor.js`, `staff-admin.js`, `game.html`,
`learn.html`, `package.json`.

⚠️ **`package.json` is deliberately absent.** Running `npm install` here bumped
its declared dependency ranges as a side effect; that was not an intended change
and has been reverted. The dependencies it declares were already correct.
