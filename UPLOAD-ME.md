# Round 129 (Caslon) — 5 files

⚠️ **Assumes Round 128 is deployed** (it is — your per-run delete works).

| # | path | version | what changed |
|---|---|---|---|
| 1 | `reports.html` | 1.12.0 → **1.13.0** | Student picker + ⟳ load button |
| 2 | `tests/reports-identity-test.mjs` | 1.0.0 → **1.1.0** | part E — pins the filter's POSITION |
| 3-5 | `HANDOFF.md`, `CHANGELOG.md`, `ROADMAP.md` | — | §29, 128a closed |

## How to use it

A **Student** dropdown now sits next to School and Class. It starts empty
("All students"), and fills two ways:

1. **Run any report** — the list populates from the roster that report already
   read, at no extra cost. Then pick yourself and hit Generate again.
2. **Click ⟳** — loads the student list for the current school/class without
   running a report. That's the roster query only, no per-day reads.

Changing School or Class clears the list, so you'll need to reload it for the new
scope. That's deliberate — a stale child left selected under a new class gives you
an empty report that looks like a kid who didn't type.

## ⚠️⚠️ Why this is a cost fix, not a convenience

Your meter: **1,593 reads at `readLogById`, 1,435 of them misses**, to show three
days. That sweep is one `getDoc` per student-day.

The filter runs **before** the read list is built, so the saved reads are never
issued. Filtering the displayed results instead would have read all 1,593 and
thrown 1,590 away — it would look identical on screen and save you nothing.

**You, three days: 3 reads instead of 1,593.**

Part E of the harness pins the *order*, not the feature. Mutation-verified by
moving the filter below the read-list build: E3 goes red and everything else
still passes, which is exactly the wrong fix it exists to catch.

## ⚠️ Still open, in priority order

1. **128b — the zeros.** Untouched. `readLogById()` returns "missing", "error"
   and "has data" as three distinct things, and a zero still reached your screen,
   so a caller is collapsing them. In the sweep, `res.error` increments an
   `unreadable` counter and returns — I'd start there. Grades correctness.
   ⭐ **This gets much rarer on its own now**: 1,435 fewer reads per load means
   far fewer chances for a transient failure. That makes it harder to reproduce,
   not fixed.
2. **128c** — the word-lock display (127b option A), ruled and not built.
3. **125a A and B** — still yours.

## Verify

```
npm install acorn jsdom
node tests/run-all-tests.mjs
```

Expect **ALL 105 HARNESSES PASS**. Then run a report, pick yourself, run it again
and watch the meter.
