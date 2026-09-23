# Round 133 — CUMULATIVE, 23 files

Everything changed since your original upload (Rounds 124–133). Each file is the
final version, so re-uploading one you already have does no harm.

⚠️ **Why this exists:** every round I packaged, I deleted the previous round's zip
first. So the file you needed was always the one I'd just removed, and the
anti-farming fix never reached you. That's fixed — I won't delete old zips again.

---

## 1. UPLOAD THESE FIRST — you definitely don't have them

| path | version | why it matters |
|---|---|---|
| **`game.js`** | **v3.52.0** | ⚠️⚠️⚠️ **Stops the Backspace farming.** Kids are still doing it until this is live. |
| `reports.html` | v1.15.0 | ⏸ flag, student picker, "Unknown" fix |
| `tests/backspace-farm-test.mjs` | v1.0.0 | NEW |
| `tests/reports-identity-test.mjs` | v1.2.0 | picker + flag parts |
| `tests/run-all-tests.mjs` | — | registers both |
| `HANDOFF.md` / `CHANGELOG.md` / `ROADMAP.md` | — | through §33 |

## 2. Probably already live — re-upload to be sure

These are from Rounds 124–128, which you've confirmed working, plus 126 (side
panels/taglines) and 127 (telemetry counters), which you may or may not have
uploaded. Uploading them again is safe.

| path | version | round |
|---|---|---|
| `game-shell.js` | v1.16.0 | 124, 128 |
| `game-shatter.js` | v1.18.0 | 124–127 |
| `game-deadline.js` | v1.21.0 | 125–127 |
| `game-escape.js` | v2.9.0 | 125–126 |
| `game-chrome.js` | v1.11.0 | 126 |
| `game-names.js` | v1.4.0 | 126 |
| `typing-calibrator.js` | v1.3.0 | 127 |
| `arcade-telemetry.js` | v1.4.0 | 127 |
| `escape-board.js` | v2.2.0 | 124 |
| `tests/abandon-lock-test.mjs` | — | 125–126 |
| `tests/adaptive-arcade-test.mjs` | — | 124 |
| `tests/call-shape-test.mjs` | — | 124 (new) |
| `tests/game-shell-test.mjs` | — | 128 |
| `tests/typing-calibrator-test.mjs` | — | 127 |
| `tests/undefined-calls-test.mjs` | — | 124 |

## Verify

```
npm install acorn jsdom
node tests/run-all-tests.mjs
```

Expect **ALL 106 HARNESSES PASS**. Then hold Backspace in a book: the timer should
stop and the game should pause within five seconds.
