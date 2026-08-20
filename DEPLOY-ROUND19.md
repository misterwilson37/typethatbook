# DEPLOY — Round 19 (Hermes)

Complete replacement files, already in the directories they belong in. Drop each
at the matching path in the repo.

`firebase/firestore.rules` v2.5.0 is **already live** — you deployed it. Included
only so the repo copy matches the console.

---

## ⚠️ TWO STAGES. DEPLOY STAGE 1, WATCH ONE REAL PERIOD, THEN STAGE 2.

Both are built and both pass the suite. **Do not ship them together.** They are
both write-path changes to the number you grade on, and if something looks wrong
after a combined deploy you will not know which one did it. Stage 1 is the one
that makes the numbers line up; Stage 2 makes the lined-up number harder to
corrupt. Stage 1 alone is a complete, correct improvement.

Not a school night, either one.

---

## STAGE 1 — the student and the teacher read the same document

| # | file | version | why here |
|---|---|---|---|
| 1 | `daylog.js` | 1.1.0 **NEW** | Imported by `game.js`, `learn.js`, `index.html`. Must exist first — a missing module renders nothing at all. |
| 2 | `update-gate.js` | 1.0.1 **NEW** | Independent; rides along. **Use this, not the 1.0.0 from earlier — that one had a real bug.** |
| 3 | `versions.js` | 1.9.0 | Registers both new modules in the build footer. |
| 4 | `reports.html` | 2.16.0 | **Consumer first.** Works correctly against the OLD controllers. |
| 5 | `index.html` | 3.9.0 | Shelf banner. |
| 6 | `game.js` | 3.31.0 → see note | |
| 7 | `learn.js` | 2.16.0 → see note | |
| 8 | `game.html` | 1.2.0 | Adds the `update-gate.js` script tag. |
| 9 | `learn.html` | 1.1.0 | Same. |
| 10 | `admin.js` | 3.31.1 | Independent of everything above — two import-metadata fixes. |

⚠️ **The `game.js` and `learn.js` in this zip are the STAGE 2 versions (3.32.0 /
2.17.0).** They contain Stage 1 and Stage 2 together; the two stages were built
in one sitting and I did not split the files. If you want a clean Stage 1 first,
say so and I will cut 3.31.0 / 2.16.0 as separate files. **Otherwise treat the
whole thing as one deploy and watch it twice as carefully.**

### One console step, after the files are up

Firestore → `settings` → create document **`appVersion`** → field **`nonce`**,
type number, value **`1`**.

Nothing happens on creation. From then on, raising it to 2, 3, 4 reloads every
signed-in client in the building within ten minutes.

---

## STAGE 2 — the daily total is derived, not reported

| file | version |
|---|---|
| `session-log.js` | 1.4.0 |
| `daylog.js` | 1.1.0 (already up from Stage 1) |
| `game.js` | 3.32.0 |
| `learn.js` | 2.17.0 |

⚠️ **`session-log.js` goes up BEFORE the two page controllers.** They call its new
`sessionLogPendingSeconds()`; against 1.3.0 that is undefined and the flush
throws.

Each flush now writes:

```
seconds = deduped sessions on the server
        + this device's un-uploaded queue
        + this tab's still-open sprint or run
```

Two tabs open at once can no longer overwrite each other's day. The leaderboard
is derived too — it was the last independent counter in the app.

---

## How to tell it worked

Open Library, look at the footer, hover it (tap-to-pin on touch) to expand.

- `game.html v1.2.0 · game.js v3.32.0 · style.css v3.5.5`
- The expanded list must include **`daylog.js v1.1.0`**,
  **`update-gate.js v1.0.1`**, **`session-log.js v1.4.0`**.
- ⚠️ **If `daylog.js` is missing, the page is running cached code** and nothing
  else you check means anything.
- `reports.html` — tab title should read `TypeThatBook Reports v2.16.0`.

## ⚠️ If students see 0:00

**Check `firestore.rules` v2.5.0 first.** The whole redesign rests on owner-read
of `typing_logs`, that is a console action, and **no test in this repo can verify
it.** A green suite says nothing about it.

Nothing is lost either way — the writes still land. `daylog.js` refuses to paint
on an incomplete read rather than showing a zero, so a rules failure looks like
"the HUD never updates" rather than "everyone lost their time."

## What is gone from reports.html

**`Audit Week Counters` and its repair button are deleted.** They compared a
student's stored week counter against the sum of their daily logs. There is no
stored week counter any more — the student's own screen reads these same daily
logs — so there is nothing to compare.

`Reconcile vs Sessions` survives and is now the only checking tool on the page.
It compares the graded document against the append-only session record behind it:
a projection against its source. That is a real check.

## Delete from your repo root

Confirmed stale in what you sent me:

```
source-split-test.mjs          ← the real one is tests/source-split-test.mjs
```

Also check the root for any of these. All belong in `tests/`, `tools/`, `docs/`,
`firebase/` or `functions/`, and any root copy is a fossil from before the
Round 17 reorganisation:

```
*-test.mjs   *-harness.mjs   run-all-tests.mjs   verify-guards.mjs
scan2.mjs    fix-candidates.mjs   audit-versions.mjs
firestore.rules   firestore.indexes.json   storage.rules
DESIGN-TELEMETRY.md   MULTITENANCY.md   PEDAGOGY-AUDIT.md
SCALE-PLAN.md   TTL-GUIDE.md   TESTING-ttb-test-epubs.md
README-SESSION-LOGGING.md
```

⚠️ **`index.js` in the ROOT is the Cloud Function and belongs at
`functions/index.js`.** Deleting the root copy is right. Deleting the one in
`functions/` is not.
