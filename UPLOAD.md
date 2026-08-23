# UPLOAD — Round 29 (Odell), 2026-08-23

**13 files changed of 181, plus this note.** Only those are here, at their real
paths. ⚠️ **This set is diffed against the repo AFTER Round 28 was uploaded.** If
Round 28 has not gone up yet, upload it first — these files assume
`firebase-config.js` v1.3.0 and `versions.js` v1.12.0 are already live.

⚠️ **DELETE THIS FILE AFTER THE UPLOAD.** It is a note about one deploy.

✅ **VERIFIED BY APPLYING IT.** A pristine copy of the post-Round-28 repo, plus
these files and nothing else, runs **all 47 harnesses green** and
`audit:versions` clean. Round 28's first attempt at a partial set silently
dropped `versions.js`, so this is now checked by applying, not by reviewing the
list — see HANDOFF §0.-20.K.

---

## ⚠️⚠️ ORDER MATTERS — `lesson-gate.js` IS A NEW SHARED MODULE

`lesson-gate.js` did not exist before this round and **both page controllers
import it**. The web portal means one commit per file, so the site sits in a mixed
state between them, live, with students possibly on it.

⚠️ **The bad ordering is a BLANK page, not a degraded one.** A browser loading the
new `learn.js` against a repo with no `lesson-gate.js` fails the import **before
any code runs** — no map, no lessons, no error a child can report. Identical
hazard to Round 28's `firebase-config.js`, one file along.

### Group 1 — the new module, alone

| # | file | why first |
|---|---|---|
| 1 | `lesson-gate.js` | **1.0.0, NEW.** The whole of ROADMAP item 10's rule. ⚠️ Imported by both `game.js` and `learn.js` |

⚠️ **IT IS INERT UNTIL SOMETHING IMPORTS IT.** Nothing on the live site references
it yet, so uploading it alone changes nothing and cannot break anything. **If you
have to stop halfway, stop here.**

### Group 2 — the pages

| # | file | what changed |
|---|---|---|
| 2 | `learn.js` | **2.32.0** — the gate, practice runs, the banner. The feature |
| 3 | `game.js` | **3.44.0** — counts active days only. Renders no gate |
| 4 | `versions.js` | **1.12.0 → registers `lesson-gate.js`** so the footer can report it |

⚠️ **`game.js` IS NOT OPTIONAL AND ITS CHANGE IS INVISIBLE.** It only counts days
— but your rule is *"a month of typing anything"*, so a period spent in Library is
an active day a School lesson has to know about. **Skipping it silently starves
the gate**: reach-back would accrue at roughly half speed, with no error anywhere
and no symptom except review lessons opening later than they should.

### Group 3 — the stylesheet

| # | file | what changed |
|---|---|---|
| 5 | `style.css` | **3.9.0** — `.practice-banner`, `.practice-only`. No page imports a stylesheet, so this is safe any time |

⚠️ **BUT DO NOT SHIP `learn.js` WITHOUT IT.** The banner would render unstyled —
plain text at the top of the drill — which still says the right words but loses
the visual weight that makes a child read it.

### Group 4 — repo only, never served

`CHANGELOG.md` · `HANDOFF.md` · `ROADMAP.md` · `tests/README.md` ·
`tests/lesson-gate-test.mjs` *(new)* · `tests/run-all-tests.mjs` ·
`tests/version-stamp-test.mjs` · `tools/audit-versions.mjs`

⚠️ **`tests/lesson-gate-test.mjs` IS NEW AND `tests/run-all-tests.mjs` REGISTERS
IT.** Upload both or neither — the registration audit **fails the suite** on a
`.mjs` in no list.

---

## After the upload — what to check

⚠️ **THE GATE WILL NOT VISIBLY DO ANYTHING FOR MOST STUDENTS ON DAY ONE, AND THAT
IS CORRECT.** `activeDayCount` starts at 0 and climbs one per day typed;
`fireCount` seeds at 1 for a lesson already showing A🔥 and needs two more. **A
class that sees no change on Monday is the feature working**, not failing.

1. **Footer triad on `learn.html` reads `learn.js v2.32.0`.** Hover for the full
   panel and confirm `lesson-gate.js v1.0.0` is listed. If it is absent,
   `versions.js` did not go up.
2. **Sign in as yourself and open the lesson map.** ⚠️ **You will see no practice
   badges at all** — staff are never gated, so you can demonstrate any lesson to a
   child. That is deliberate; it also means **you cannot test the gate from your
   own account.**
3. **To actually see it:** find a student who has three A🔥 on a lesson behind
   their furthest, and look at their map. Or read
   `tests/lesson-gate-test.mjs` section C, which is your worked example executed.
4. **Open a mastered lesson as a student** → warm dashed card, "Mastered ·
   practice", and on entry **a yellow banner across the top of the drill for the
   whole run.** ⚠️ Finish it and confirm the daily total **does not move** — that
   is the whole point, and the banner is why it does not read as broken.
5. **Open a normal lesson** → no banner, clock runs, grade files as always.

⚠️ **IF ANY STUDENT PAGE IS BLANK, IT IS THE ORDERING.** Upload `lesson-gate.js`
and hard-reload.

---

## ⚠️ What is NOT in this feature, and you should know before Monday

* **The measurement you asked for first** (ROADMAP §10.H) is **not built** — the
  attempts-per-lesson column that would tell you whether this is three kids or
  thirty. It is cheaper now than when you wrote it, because `fireCount` sits on
  the same record as `attempts`.
* **Nothing here has been driven in a browser.** The rule is proven by 56 checks;
  that the map asks it correctly, that the clock really never arms, and that the
  banner appears are **unproven**. Worth five minutes on one student account
  before ninety of them meet it.
* **No per-student override.** Staff are ungated so you can demo; there is no way
  to hand one child back one lesson. Nobody has needed it yet.

## What did NOT change

**168 of 181 files are untouched** — every book in `library/`,
`firestore.rules`, `functions/`, `firebase-config.js`, `index.html`,
`admin.js`, `reports.html`, `keyboard.js`, `daylog.js`, `session-log.js`,
`stats-wal.js`, `hud.js`, `settings-panel.js`, `adventure.css`, `game.html`,
`learn.html`, `package.json`.
