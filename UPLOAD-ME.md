# Round 146 — initials that outlive the student

⚠️ **Assumes Round 145 is deployed** (your console shows v3.54.0). No rules change.

| file | what changed |
|---|---|
| `game.js` | v3.55.0 — Chapters records a date; dates never written blank; admin sees dates on the board |
| `reports.html` | v1.20.0 — Retention keeps board places by initials; one-time backfill button |
| `privacy.html`, `SECURITY.md` | say what's kept, and that a deletion request keeps nothing |
| `tests/…` | `leaderboard-keep-test.mjs` (new), `retention-test.mjs` |
| `HANDOFF.md` / `CHANGELOG.md` / `ROADMAP.md` | §46 |

## ⚠️ Do this once, right after uploading

Reports → **📋 How-to** → **The leaderboard** → **Date the current leaderboard**.
It stamps today on every score that has no date yet, so nobody currently on a board
loses their place when they age out. Pressing it twice is harmless.

## What happens now

* **A student ages out** (Retention…) while holding a place on a board → the place
  stays, with only their initials, the score, the date it was set and their school,
  under a new identifier with no link to their account. It stays until someone
  pushes it off every board; the next Retention run then removes it.
* **A parent asks for deletion** (Delete student…) → everything goes, initials too.
* **Kids who chose "Hide me from leaderboards"** aren't kept.
* **You** see each score's date beside it on the board, and "· kept" on records from
  students who've left. Students see nothing new.

Expect **ALL 115 HARNESSES PASS**.
