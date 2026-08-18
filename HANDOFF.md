# HANDOFF — Round 13 (Ludlow)

<!-- HANDOFF.md v13.0.0 — Round 13, instance "Ludlow", 2026-08-18.
     ⚠️ SUPERSEDES Round 12, archived as HANDOFF-round12.md. Round 12's §1
     (the doubled week counter and why the fix is not max()), §5 (known problems)
     and §7 (the two defects it shipped and withdrew) remain LOAD-BEARING and are
     cited here, not restated. Round 11's §3.3, §4 (invariants 56-63) and §6 are
     also still live, in HANDOFF-round11.md. §9 below says which archived rounds
     exist as files and which do not — read it before you go looking. -->

**Instance:** **Ludlow** (13) · Caligraph (12) · Bar-Lock (11) ·
*(Round 10 — unnamed)* · Remington (9) · Yost (8) · Hammond (7) · Noiseless (6) ·
Mignon (5) · Oliver (4) · Blick (3) · Dvorak (2) · Underwood (1) ·
*other projects:* Stedman, Fable, Trilby, Vernier

> *On the name:* the Ludlow Typograph split typesetting in two on purpose. A
> compositor set brass matrices by hand in a composing stick; the machine then
> cast a line of type from them. The stick was the record and the slug was
> derived from it, so a wrong letter meant pulling one matrix and recasting —
> not correcting metal.
>
> That is `DESIGN-TELEMETRY.md` §4 in brass: sessions are the stick, totals are
> the slug, and R4 ("delete a bad record and the totals change") is what recasting
> means. This round sets one matrix — a server clock the student cannot reach —
> and casts nothing. **Deliberately. See §1.**

---

## §0. What this round was

**One step. `DESIGN-TELEMETRY.md` §7 step 1: add `serverAt`.** Jake asked for the
smallest possible change first so his deploy loop could be confirmed before
anything structural moved. That instruction was followed literally, and the whole
of the code delta is one field, one injected dependency, and the tests that hold
them in place.

Round 12 shipped a rewrite and a diagnostic in one afternoon and got both wrong
(round 12 §7). This round is the opposite shape by design. **If you are the next
instance and step 2 is in front of you, the fact that this round was boring is the
argument that the staging works.**

---

## §1. What `serverAt` is, and why nothing reads it

Every date, duration and WPM interval in this project is stamped by the student's
own Chromebook clock. A child who changes it files work under the wrong day or
manufactures a WPM interval, and there is no second opinion anywhere in the data.

`serverAt: serverTimestamp()` is resolved by Firestore at commit. It cannot be
influenced from a browser. It now lands on every `typing_sessions` rollup.

⚠️ **NOTHING READS IT. NO TOTAL DERIVES FROM IT. NO PANEL DISPLAYS IT.** That is
not an omission, it is the point of shipping it first: a cheat signal added on the
day you need it has no history behind it. In 120 days (the TTL) there will be a
term's worth of paired clocks to compare against; today there are none. The read
side is step 3's business at the earliest.

### 1.1 ⚠️ Two clocks, and the second one must never be faked

```
timestamp   client clock — the first record in the document, i.e. when the
            student typed. This IS what DESIGN-TELEMETRY §4 calls `clientAt`.
serverAt    server clock — written by Firestore at commit.
```

They are *expected* to differ by the queue's delivery lag: seconds usually, a
whole day when a queue survives overnight, which is legitimate and is precisely
what the dated-record design exists to preserve. What is not legitimate is
`timestamp` landing in a different week from `serverAt`, or ahead of it by more
than clock skew.

⚠️ **THAT COMPARISON ONLY WORKS WHILE THE TWO FIELDS HAVE DIFFERENT PROVENANCE.**
`_stampServer()` has no client-side fallback and must never acquire one. A
`serverAt` built from `new Date()` satisfies the field's type and destroys its only
purpose: it agrees with `timestamp` by construction, so the divergence becomes
permanently zero — a field that reports "no clock tampering" whether or not the
clock was tampered with. Absent is honest. Approximated is a lie wearing the name
of a trusted source. `session-merge-test.mjs` asserts this against the source text
of `session-log.js`, not against anybody's reading of it.

### 1.2 ⚠️ There is no `clientAt` field, and adding one would be a defect

`DESIGN-TELEMETRY.md` §4's schema names `clientAt`. `timestamp` already holds
exactly that value. Adding `clientAt` would put two copies of one quantity in one
document — invariant 71 at field scope instead of document scope.

`timestamp` keeps its existing name for the same reason `bookId` did: `reports.html`,
and a live single-field index exemption in the Google Cloud console, already know
it, and a rename would cost Jake a console change to buy a better word. This is
written into `session-log.js`'s SEMANTICS block as well, because the schema in the
design document is the thing a future instance will read first.

### 1.3 ⚠️ Why the dependency is optional

`sessionLogInit()` takes `serverTimestamp` and works without it, omitting the
field. That is not test convenience — it is the GitHub-web-portal upload window.

Jake uploads one file at a time. There is a window, minutes or an afternoon long,
where `session-log.js` v1.1.0 is live and a browser still has `game.js` v3.23.0
cached. A required dependency would make that window write `serverAt: undefined`,
which Firestore rejects outright, which fails the entire rollup write, which loses
the sprint detail for every student who typed during it. **A missing dependency
costs one field. A required one costs a period.** Both mixed pairings are tested,
including a non-function passed in the slot.

---

## §2. Version state

`npm test` → **21 of 22 harnesses pass.** The one failure is the pre-existing
`metadata-map-test.mjs`; see §5.

⚠️ **`npm install` first on a clean container.** The Round 10 `devDependencies`
fix is correct and works, but the packages are not vendored.

| file | version | changed? | upload? |
|---|---|---|---|
| `session-log.js` | **1.1.0** | ⚠️ yes — `serverAt`, injected `serverTimestamp` | **YES — 1st** |
| `game.js` | **3.23.1** | yes — one import, one dependency. Nothing else. | **YES — 2nd** |
| `learn.js` | **2.7.1** | yes — identical change to `game.js` | **YES — 3rd** |
| `session-merge-test.mjs` | **1.1.0** | yes — `serverAt` assertions + new Part C | commit it |
| `firestore.indexes.json` | **2.1.0** | documentation only — see §3 | no |
| `firestore.rules` | 2.3.0 | **NO — verified unnecessary, see §3** | no |
| `versions.js` | 1.5.0 | **NO** — it detects `SESSION_LOG_VERSION` by regex, so the bump is picked up with no change | no |
| `reports.html` | 2.11.0 | **NO** — nothing reads `serverAt` yet, on purpose (§1) | no |
| `HANDOFF.md` / `HANDOFF-round12.md` / `DESIGN-TELEMETRY.md` / `README.md` / `README-SESSION-LOGGING.md` | — | yes | commit them |

⚠️ **UPLOAD `session-log.js` FIRST**, as in Round 12 and for the same reason:
`game.js` and `learn.js` both import it and a missing module throws on import and
renders nothing at all. §1.3 explains why the ordering is now *safe* rather than
merely *ordered* — either half works alone — but first is still correct, because
it is the half that carries the feature.

**Deploy check:** Library footer reads `game.js v3.23.1`; Lessons footer reads
`School v2.7.1`. The grey `ID xxxxxxxx` must still be bottom-left on both — if it
is missing, the new code is not running and nothing below applies.

**Then verify the field itself, which is the actual point of this round:** type at
least ten seconds in *each* mode, end a sprint and a lesson run, then open the
Firestore console → `typing_sessions` → sort by newest. **`serverAt` must be
present on one `source: "library"` document AND one `source: "school"` document.**
Present on one and absent on the other means only one page controller uploaded.

---

## §3. Why there is no rules change and no index change

Both checked against source, not assumed, because either costs Jake a console
paste.

- **`firestore.rules` — no change needed.** The `typing_sessions` create rule
  requires `uid == request.auth.uid`, `seconds` a number in `[0, 86400]`,
  `sprints` a list of size ≤ 200, and `expiresAt` a timestamp. It has **no
  `keys().hasOnly()`**, so an added field is not denied. `serverAt` satisfies
  nothing and violates nothing. (Round 12 verified the same block for `source`;
  this is the second field to ride in on that property, and the property is
  deliberate — read the comment above `validDailyLog` before "tidying" it.)
- **`firestore.indexes.json` — no change needed, and one decision recorded.**
  Firestore will auto-index `serverAt` ascending and descending. Its sibling
  `timestamp` is *exempted* from that in the console, so the obvious move is to
  exempt this one too. **I deliberately did not.** The entire reason the field
  exists is to be compared against `timestamp`, and the first thing anyone will
  want from that comparison is a range query — *show me sessions where the clocks
  disagree by more than a day*. An exemption would have to be removed again to
  allow it, and removing one rebuilds the index across the collection. The cost of
  being wrong in this direction is index storage on a collection TTL-capped at 120
  days: ~160k documents standing at Ellis scale, two entries each, on a timestamp.
  Pennies. **At district scale, re-decide.** The reasoning is in the file, which
  is the only record of what the console holds.

⚠️ Unchanged from Round 12 and still true: adding an `orderBy` or a range filter to
the drill-down query (`where uid == … && where date == …`) *does* need a composite
index, which *is* a console change.

---

## §4. Invariants added this round

74. ⚠️ **A field named for a trusted source must be absent rather than
    approximated.** `serverAt` filled in by the client is worse than no `serverAt`:
    it type-checks, it looks populated, and it silently guarantees agreement with
    the field it exists to be compared against. The whole value of a second witness
    is that it is a *different* witness. If the trusted source is unavailable, omit
    the field and let the reader see that it is missing.
75. ⚠️ **A shared module's dependency list is a contract between two files that
    cannot see each other, so test it against both.** `game.js` and `learn.js`
    each configure `session-log.js` at module scope. A dependency passed on one
    side and not the other makes School and Library write differently shaped
    documents — the R2 symmetry failure in its smallest possible form, and
    invisible from inside either file, because each is internally consistent.
    `session-merge-test.mjs` Part C reads both call sites out of the shipped
    sources and asserts the dep sets are equal. This is invariant 73 applied to a
    dependency list instead of a constant.
76. **A signal must be planted before it is needed.** A comparison against history
    has no value on the day it ships and full value a term later, so the correct
    time to start writing it is the boring round, not the round where a student is
    suspected. Shipping the write side alone is a complete deliverable.

---

## §5. Known problems left standing

Round 12's §5 list is unchanged except where noted. Restated in brief because a
list nobody restates becomes a list nobody reads:

1. ⚠️ **`chunktest.mjs` is still testing deleted code.** It reimplements the
   v3.9.2 rollup loop inline instead of importing `session-log.js`, so it passes
   green on a fossil. `session-merge-test.mjs` Part B is its real replacement.
   **Delete it or rewrite it to import.** Left standing a second round; I touched
   `session-merge-test.mjs` and could have, but deleting a green test is not a
   change to make in the same commit as a live-data field.
2. ⚠️ **Historical day counters may be doubled and no audit can detect it.**
   Unchanged. Round 12 §5.2 and §7.3 bound the repair.
3. **`metadata-map-test.mjs` — 42 of 487 assertions fail.** Pre-existing,
   unrelated: Gutenberg-sourced EPUBs report a `gutenberg.org` origin where the
   harness expects Standard Ebooks. A bookclean/import metadata question, not an
   app defect. **Confirmed still 42 this round**, i.e. nothing here made it worse.
4. **`audit-versions.mjs` header budgets.** Now slightly worse again: `game.js`
   and `learn.js` each gained one more history entry. ⚠️ **The blocker is real and
   was measured this round:** trimming means migrating entries into `CHANGELOG.md`,
   whose own state is — `game.js` entries stop at **v3.19.1** (four versions
   behind), `learn.js` at **v2.2.4** (five behind), the Contents index claims
   `game.js` v3.14.0 and `learn.js` v2.2.4, and there is **no section at all** for
   `session-log.js` or `stats-wal.js`. That is a multi-round backfill, not a
   cheap task, and Round 11 §5.1's description of it as "the cheapest real task
   available" was optimistic.
5. **`resume-path-test.mjs` still does not exist** and `learn.js` still asserts in
   a comment that it does. Flagged by Rounds 11 and 12; still true.
6. **`renderIdStamp()` is duplicated in `game.js` and `learn.js`.** Unchanged
   tripwire; it did not grow this round.
7. **App Check is initialized but not enforced.** Unchanged. Read the App Check
   block in `firebase-config.js` before clicking Enforce.
8. **`learn.html` hardcodes `v2.1.0`** in its footer (Round 11 §5.4). Overwritten
   at runtime, harmless, and it will still cost somebody twenty minutes. Not fixed
   here because it is an unrelated file in a round that is meant to prove one
   deploy path.

---

## §6. For Jake, operationally

- **Upload order: `session-log.js`, `game.js`, `learn.js`.** Then commit the test
  and the documents. No console work of any kind this round.
- **The verification is in §2** and it is two footers, one ID stamp, and one look
  at the newest two `typing_sessions` documents. If `serverAt` is on both a School
  and a Library document, step 1 is done and the loop is proven.
- **Nothing a student sees changes.** No new prompt, no new number, no shifted
  minutes. If a child reports anything different about School or Library after this
  deploy, it is not this change, and that is worth knowing precisely because it is
  such a narrow deploy.
- ⚠️ **`README-SESSION-LOGGING.md` §3 told you to set the audit range "starting
  Monday." That was wrong and is fixed in this round's edit.** The app and the
  v2.11.0 audit both anchor the week on **Saturday** — which is Round 12 §7.2, the
  defect fixed in the code and left standing in the teacher-facing document that
  tells you how to drive it. A doc that misdirects the range makes the audit
  report "unverifiable" rows and look broken.
- **Cost of this round: zero.** One extra timestamp field per rollup document. No
  additional writes, no additional reads.

---

## §7. ⚠️ NEXT ROUND STARTS AT `DESIGN-TELEMETRY.md` §7 STEP 2

Step 1 is shipped. `DESIGN-TELEMETRY.md` is at v1.1.0 and its §7 records which
steps are done; §6.3 is now closed.

**Step 2 is the one that matters: make `typing_logs` derived — written by summing
the day's sessions rather than from a live in-memory counter.** That is what closes
§2.4, which is a live data-loss path today: `typing_logs/{uid}_{date}` is ONE
document written by both page controllers from their own counters, so ten minutes
of School work can be overwritten by four minutes of Library work, silently, in
the document this project grades from. It is worth more than everything Round 12
and Round 13 shipped combined.

⚠️ **Before writing a line of it, re-read `DESIGN-TELEMETRY.md` §2 and §8.** §2 is
verification-only and every claim in it was read out of source; every claim Round
12 made *without* doing that turned out to be wrong. §8 is the list of things that
must not happen, and two of them are specifically about step 2:

* **Do not write a daily or weekly total from a live in-memory counter once
  sessions exist.** That is §2.4 rebuilt by hand.
* **Do not re-gate the stats write on `final`.** Round 12 §7.1. The ~$85/year it
  saves is the price of the entire week of 2026-08-18.

And one that is about temperament rather than code: **do not answer the next
divergence with a better audit.** An audit is a confession that the data model
permits states you have to go looking for.

⚠️ **The 2s/3s idle threshold difference between Library and School is DELIBERATE,
decided by Jake, and closed.** `DESIGN-TELEMETRY.md` §2.2 and §6.1. Round 12
flagged it as an R2 violation and was wrong. Do not unify it. Do not "align" it.
The populations are different and the thresholds are fitted to them.

---

## §8. If a bug is reported against this round

The surface is one field, so the space of real failures is small and each has a
different single datum that settles it. **Ask for the datum. Do not theorise** —
Round 12 guessed twice and was wrong both times (round 12 §7).

| report | the one thing to ask for |
|---|---|
| "sprint detail stopped appearing" | Firestore console: is there **any** new `typing_sessions` document since the deploy? If yes the writer is fine and the fault is in `reports.html`, which did not change. |
| "`serverAt` is missing on some documents" | Which `source` — school or library? Present on one and absent on the other means one page controller was not uploaded (§1.3), which is a deploy state, not a bug. |
| "permission denied on a rollup write" | The console error's full text. The rule requires `uid`, `seconds ≤ 86400`, `sprints` ≤ 200 and `expiresAt`; `serverAt` is not in the rule at all, so a denial mentioning it means the rules in the console are not the rules in the repo. |
| "the times all changed" | This round writes no total, no counter and no gate. Get the two footer versions before assuming it was this deploy. |

---

## §9. ⚠️ WHICH ARCHIVED HANDOFFS EXIST — READ BEFORE HUNTING

Several archived handoffs are cited by name across these documents and are not in
the repo. **This section exists so the next instance stops looking after one
paragraph instead of after twenty minutes.** Jake's statement, 2026-08-18:

> *Don't chase rounds 4, 8, 9 or 10 — they're only in GitHub commit history.
> Rounds 3, 5, 6, 7 and 11 are real files you can read.*

| round | file | status |
|---|---|---|
| 1–3 | `HANDOFF-round3.md` | ✅ **in repo.** §10 is the document map. |
| 4 | — | ❌ **not in repo.** See the note below. |
| 5 | `HANDOFF-round5.md` | ✅ **in repo.** |
| 6 | `HANDOFF-round6.md` | ✅ **in repo.** |
| 7 | `HANDOFF-round7.md` | ✅ **in repo.** §5 and §8 still cited as live. |
| 8 | — | ❌ **not in repo.** ⚠️ Round 12's header calls its §4 (invariants 37–55), §7 and §8 load-bearing. Those invariants are therefore **unreadable from the repo alone** — commit history or nothing. |
| 9 | — | ❌ **not in repo.** Round 12 cites its §4. |
| 10 | — | ❌ **never written.** Round 11 §1 is a reconstruction of Round 10 for exactly this reason, and Round 10's instance was never named. |
| 11 | `HANDOFF-round11.md` | ✅ **in repo** (supplied by Jake this round; it had been missing). §3.3, §4 (invariants 56–63) and §6 are live. |
| 12 | `HANDOFF-round12.md` | ✅ **in repo**, archived this round. §1, §5, §7 live. |

⚠️ **The two accounts of round 4 differ and neither is dismissible.** Jake places
it in commit history; `README.md` and `HANDOFF-round3.md` §10 state flatly that
`HANDOFF-round4.md` **never existed** and that the reference to it was invented.
Recorded rather than resolved, because the practical instruction is identical
either way — **it is not in the repo, do not look for it** — and because a
document quietly picking one story is how the first invented reference happened.

⚠️ **Consequence worth stating plainly: invariants 37–55 are cited as load-bearing
by a handoff whose source file is not present.** If you find yourself needing one,
say so to Jake rather than inferring it. Three of them survive quoted in code
comments (grep for `invariant` across `.js` and `.mjs`), which is not the same as
having them.

**And the standing rule, from `HANDOFF-round3.md` §10:** if a session produces a
document, it ships in the same batch as the code. Referencing a file that is not
in the repo is worse than not writing it.
