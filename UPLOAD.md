# UPLOAD — Round 30 (Postal), 2026-08-23

**9 files changed of 181, plus this note.** ⚠️ **Diffed against the repo after
Round 29.** Rounds 28, 29 and 30 are cumulative — if 28 and 29 are not up yet,
take all three sets in order; nothing here conflicts with them.

⚠️ **DELETE THIS FILE AFTER THE UPLOAD.**

✅ **VERIFIED:** 47 harnesses green, `audit:versions` clean.

⚠️⚠️ **NOTHING FROM TODAY'S TESTING IS FIXED IN THIS SET.** All eight findings are
written up as **ROADMAP items 11–18** and summarised in the HANDOFF banner. This
round is the build-panel cache fix, which was already in flight.

---

## ⚠️⚠️ READ BEFORE VERIFYING THIS DEPLOY

**This round fixes the reason you could not verify the last one.** The hover panel
cached its answer in `sessionStorage`, which survives a hard reload and clears
only in a new tab — so it answered "what is running right now?" from a copy taken
at page load.

⚠️ **The old behaviour is still in force while you upload this.** Check from a
**new tab**. From the next deploy onward, a second hover sixty seconds later is
enough.

## Order

| # | file | why |
|---|---|---|
| 1 | `versions.js` | **1.13.0** — the fix. ⚠️ Backward-compatible on its own; **if you upload nothing else, upload this** |
| 2 | `game.js` | **3.45.0** — drops its own staleness flag |
| 3 | `learn.js` | **2.33.0** — same. ⚠️ Round 29's lesson gate is unchanged |
| 4 | `index.html` | **3.13.0** — build button forces a fresh read |

Repo-only, never served: `CHANGELOG.md` · `HANDOFF.md` · `ROADMAP.md` ·
`tests/README.md` · `tests/build-panel-test.mjs`

## Telling "not deployed" from "cached"

The site is **GitHub Pages** (`firebase.json` here is emulator config and deploys
nothing). ⚠️ **GH Pages cannot set cache headers**, and a web-portal commit is not
live immediately. A throwaway query string is a different URL, so it bypasses your
browser and the CDN edge together:

```
typethatbook.misterwilson.org/versions.js?x=1
```

`v1.13.0` → deployed, everything else is caching. `v1.12.0` → not published yet;
wait rather than refreshing harder.

## What did NOT change

**172 of 181 files** — every book in `library/`, `firestore.rules`, `functions/`,
`lesson-gate.js`, `firebase-config.js`, `admin.js`, `reports.html`, `style.css`,
`adventure.css`, `game.html`, `learn.html`, `package.json`.
