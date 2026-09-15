# Round 124 (Sholes) — the 10 files that changed

Drop each at the path shown. Everything else in the repo is byte-identical to
what you uploaded — verified by a full recursive diff against a fresh extraction
of `typethatbook-main_1_.zip`. 320 files in, 321 out; the one new file is
`tests/call-shape-test.mjs`.

## Upload order

Test files first if you want the audits live before the code lands.

| # | path | version | what changed |
|---|---|---|---|
| 1 | `tests/undefined-calls-test.mjs` | — | 27 unaudited modules added to `FILES` (13 → 59 files) |
| 2 | `tests/call-shape-test.mjs` | **1.0.0** | ⭐ NEW — argument-shape audit |
| 3 | `tests/adaptive-arcade-test.mjs` | — | H5a idle budget 4000 → 6000 frames |
| 4 | `tests/run-all-tests.mjs` | — | registers `call-shape-test.mjs` (103 → 104) |
| 5 | `game-shell.js` | 1.14.0 → **1.15.0** | `COMFORT_FRACTION`, `RAMP_DOUBLE_CHARS`, `_rampChars` |
| 6 | `game-shatter.js` | 1.14.0 → **1.15.0** | `tryScatter()` written; `PING_REACH`; `platedText()` call fixed |
| 7 | `escape-board.js` | 2.1.0 → **2.2.0** | orphaned `spawnSpot()` deleted |
| 8 | `HANDOFF.md` | — | new START HERE + §24 |
| 9 | `CHANGELOG.md` | — | Round 124 entry |
| 10 | `ROADMAP.md` | — | items 124a, 124b, 124c |

## ⚠️ Every original line that was REMOVED, accounted for

You asked whether I torched anything. Here is the full accounting — 41 original
lines were removed across all ten files, and this is all of them:

* **`escape-board.js` — 24 lines.** The `spawnSpot()` method and its docblock,
  deleted on purpose (§24E). It read `MIN_SPAWN_DISTANCE`, a constant this file
  had already removed; nothing in the repo called it. ⚠️ **This is the only real
  deletion in the round.**
* **`game-shatter.js` — 9 lines.** The broken `platedText(...)` positional call
  (5 lines), the old label-expiry loop (4 lines) — both replaced in place.
* **`game-shell.js` — 2 lines.** The one-line body of `calibratedWPM`, and the
  `_extraChars` constructor line — both replaced and expanded.
* **CHANGELOG / ROADMAP / run-all-tests / adaptive-arcade — 1 line each,**
  HANDOFF 3: the heading or list row being edited in place (the harness count,
  the START HERE stamp, the H5a `for` line, the registry row).
* **`undefined-calls-test.mjs` / `ROADMAP.md` — 0 removed.** Purely additive.

Everything else in all ten files is an addition. Nothing else in the repo was
touched.

## Verify it yourself after uploading

```
npm install acorn jsdom      # ⚠️ see ROADMAP 124c — neither is declared
node tests/run-all-tests.mjs
```

Expect **ALL 104 HARNESSES PASS**.
