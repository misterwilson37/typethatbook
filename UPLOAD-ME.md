# Round 128 (Bembo) — 8 files

⚠️ **Assumes Rounds 124–127 are deployed.**

| # | path | version | what changed |
|---|---|---|---|
| 1 | `reports.html` | 1.11.0 → **1.12.0** | the delete fix, the quote fix, the orphaned rows |
| 2 | `game-shell.js` | 1.15.0 → **1.16.0** | 125a option C — hit relief scales |
| 3 | `tests/reports-identity-test.mjs` | **1.0.0** | ⭐ NEW, 13 assertions |
| 4 | `tests/game-shell-test.mjs` | — | relief assertion rewritten as a ratio |
| 5 | `tests/run-all-tests.mjs` | — | registers the new harness (104 → 105) |
| 6-8 | `HANDOFF.md`, `CHANGELOG.md`, `ROADMAP.md` | — | §28, 128a–c |

## ⚠️⚠️⚠️ Per-run delete had never worked. Not once, for anyone.

`sprintIdentity()` joined its fields with **U+0000**. That identity gets written
into `data-run-id` and read back as `dataset.runId` — and the HTML parser is
**required by spec** to replace U+0000 in an attribute with U+FFFD. The string
going in was never the string coming out, so the lookup returned -1 on every
click since the button shipped.

Every symptom you reported is that one character:

* *"Could not find that run — the session may have changed"* is the -1 branch,
  blaming a race that never happened;
* *"deleting individual runs didn't change the times"* — the Firestore write sits
  **below** that return, so it never ran and no total ever moved;
* nothing in the console — it's a handled branch, which is why your dump was clean.

Separator is U+001F now, proven by round-tripping through a real parser rather
than by reading the spec.

## ⚠️⚠️ The new harness caught a second bug on its way past

`escapeHtml()` was the `createTextNode().innerHTML` trick, which escapes `&`, `<`
and `>` and **leaves quotes alone** — correct in text position, wrong in the
attributes it's actually used in. A double quote closes the attribute and
everything after is reparsed as further attributes.

**`data-name` carries student names.** Not a display glitch.

## ⚠️ The orphaned rows

`.session-entry` and `.sprint-list` are siblings, so `row.remove()` took the
header and left the runs. Your screenshot showed exactly that.

## 125a option C

Relief is `max(flat 0.10, ramp × 0.40)`. The `max` means early hits are
unchanged — only the late ones, where 0.10 had become rounding error against a
pressure of 2.8. **125a is still open**; C makes the collapse survivable, not
gradual.

## ⚠️ Two things I did NOT do, both in ROADMAP

**128a — the read cost.** Your meter: 1,593 reads at `readLogById`, 1,435 of them
misses, to show you three days. The fix is a student/class filter applied before
the per-day loop — three reads instead of 1,593. This is the biggest item open
and I'd like it to be next.

**128b — the zeros on days that had runs.** `readLogById()` returns "missing",
"error" and "has data" as three distinct things, and its header promises a failed
read is never shown as zero. A zero reached your screen, so a caller is
collapsing them — check `reports.html:2565` before touching the reader. With
1,435 misses per load a transient failure is likely and would look exactly like
this. Grades correctness, so it outranks everything but cost.

## Verify after uploading

```
npm install acorn jsdom
node tests/run-all-tests.mjs
```

Expect **ALL 105 HARNESSES PASS**. Then try deleting one run.
