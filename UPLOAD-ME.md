# Round 127 (Didot) — 8 files

⚠️ **Assumes Rounds 124–126 are deployed.** Round 126 (taglines + side-panel
docs) went out last turn — your message repeated the earlier request, so if you
haven't uploaded 126 yet, do that first.

| # | path | version | what changed |
|---|---|---|---|
| 1 | `typing-calibrator.js` | 1.2.0 → **1.3.0** | discarded samples counted by reason |
| 2 | `arcade-telemetry.js` | 1.3.0 → **1.4.0** | 4 new columns: `samples`, `rejGap`, `rejShort`, `rejNoKeys` |
| 3 | `game-deadline.js` | 1.20.0 → **1.21.0** | passes the counts through |
| 4 | `game-shatter.js` | 1.17.0 → **1.18.0** | passes the counts through |
| 5 | `tests/typing-calibrator-test.mjs` | — | Part R, mutation-verified |
| 6 | `HANDOFF.md` | — | new START HERE + §27 |
| 7 | `CHANGELOG.md` | — | Round 127 entry |
| 8 | `ROADMAP.md` | — | 127a, 127b, 127c |

## The students found something you and I could not

**Two of the nine adaptive runs never gained confidence once.**

| run | cleared | duration | distinct `pacedWPM` values |
|---|---|---|---|
| shards (AA, claimed ~25 WPM) | 22 | **435 s** | **1** — `8.0`, start to finish |
| deadline | 59 | 327 s | **1** — `12.0` |

`MIN_SAMPLES` is 4. A child who finished 22 words produced fewer than four usable
samples, and `intervalMs` sat at 5,000 for every sample of a seven-minute run.

**⭐ One gate explains both of your complaints.** `calibrator.confident` switches
three things at the same instant: the estimate, the `SEED_MAX_INTERVAL_MS` cap,
and `SEED_MAX_ON_SCREEN` — the only crowd ceiling in the file, and the only
negative feedback anywhere in the spawner. So there are two modes and no path
between them. You flip in seconds, lose the ceiling, and die in ten. AA never
flipped, kept the ceiling, and ground for seven minutes. "Easy easy easy HARD"
and "kind of slow throughout" are the same gate from either side.

## ⚠️ What I did NOT change, and why

The suspect is `BURST_GAP_CAP_MS = 1500` — a pause over 1.5 s *inside a word*
throws the whole sample away. For a 15-25 WPM sixth-grader that is an ordinary
hunt between letters, not a hole. The constant's own comment says it exists to
protect "exactly the child we must not under-serve."

**Keystroke timing is in no trace we hold.** That makes this a strong inference
and not a measurement, and Rule 10 says the number does not move until a harness
fails on real data first. So this round ships the instrument, not the fix.

**One more slow-typist run settles it.** A trace ending with 20+ clears,
`samples` under 4 and `rejGap` in double figures convicts the constant outright.
High `rejShort` or `rejNoKeys` clears it and points somewhere else.

## Verify after uploading

```
npm install acorn jsdom
node tests/run-all-tests.mjs
```

Expect **ALL 104 HARNESSES PASS**.
