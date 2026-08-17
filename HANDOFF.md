# HANDOFF — Round 11 (Bar-Lock)

<!-- HANDOFF.md v11.0.0 — Round 11, instance "Bar-Lock", 2026-08-17.
     ⚠️ SUPERSEDES Round 9, which is archived as HANDOFF-round9.md. Remington's
     handoff is NOT restated here. Round 8 §4 (invariants 37–55), §7, §8, and
     Round 7 §5 and §8 remain LOAD-BEARING and are not restated either. Go and
     read them.

     ⚠️ ROUND 10 LEFT NO HANDOFF. §1 below is a RECONSTRUCTION of what it did,
     assembled from the version blocks in the files it shipped. Treat it as
     evidence, not testimony. -->

**Instance:** **Bar-Lock** (11) · *(Round 10 — unnamed)* · Remington (9) · Yost (8)
· Hammond (7) · Noiseless (6) · Mignon (5) · Oliver (4) · Blick (3) · Dvorak (2)
· Underwood (1) · *other projects:* Stedman, Fable, Trilby, Vernier

> *On the name:* the Bar-Lock's innovation was a locking bar that caught every
> type-bar in the same guide, so each one struck the identical point on the platen
> no matter which key you pressed. Alignment by construction, rather than by hoping
> forty separate arms had each been adjusted correctly. This round was that twice
> over: a function whose every exit path must now land the same way, and two copies
> of it in two files that must behave identically because a student can arrive at
> either one first.

---

## §0. What this round was

Two unrelated things, on the same afternoon, during a GitHub Pages outage.

1. **A total outage of lesson mode**, caused by Round 10. One line.
2. **The rollover import**: 10 returning students imported into this year's
   classes, no error anywhere, all 10 still on last year's roster.

⚠️ **THE COMMON SHAPE, AND THE REASON TO READ THIS SECTION:** both defects were
**a promise made by one file and quietly refused by another.** Round 10's importer
said *"will apply on first login"*; the consumer said no, and said nothing. Round
10's `beginStep()` was called by eight sites; it threw before rendering and told
nobody. Neither produced an error a student or a teacher could report. Both were
caught by harnesses that already existed and had not been run.

**RUN `npm test` BEFORE YOU SHIP. Round 10 did not.** `undefined-calls-test.mjs`
named the outage, by file and line number, on the first run.

---

## §1. RECONSTRUCTION — what Round 10 did (no handoff exists)

Assembled from version blocks. **Unverified against any statement of intent.**

| file | left at | what its own header claims |
|---|---|---|
| `learn.js` | 2.5.0 | v2.4.0: fixed the blank-lesson screen (`beginStep()` never unhid `#active-drill`); guest checkpoints to localStorage; guest minutes survive a tab close; `renderMap()` builds into a fragment. v2.5.0: **LESSONS ARE ATOMIC** — Jake's ruling; the entire `ttb_learnpos_v1` checkpoint system deleted, 143 lines, six `clearRunPosition()` sites, `checkpointOwner()`; adds a ↺ Restart control |
| `game.js` | 3.21.0 | a genre-field migration (referenced from a later block; not otherwise documented) |
| `lessons-admin.js` | 1.9.0 | import JSON validates steps, not just lesson ids |
| `learn.html` | — | still hardcodes `v2.1.0` in `<footer>`; overwritten at runtime, harmless, misleading |
| `resume-path-test.mjs` | — | **DOES NOT EXIST.** `learn.js` asserts in a comment that it does |

⚠️ **Round 10 left `audit-versions.mjs` at 8 problems.** Round 9 left 2. Two of
those were header/constant drift it introduced: `learn.js` line 1 said v2.3.0 while
the constant said 2.5.0, and `game.js` line 1 said v3.20.1 against 3.21.0. **Both
are now corrected.** The remaining 7 are header budgets — see §5.

---

## §2. Version state

`npm test` → **19 of 20 harnesses pass.** The one failure is pre-existing; see §5.

| file | version | changed? | upload? |
|---|---|---|---|
| `learn.js` | **2.5.2** | ⚠️ yes — the outage hotfix, then the consumer rewrite | **YES — 2nd** |
| `game.js` | **3.21.1** | ⚠️ yes — consumer rewrite, mirrored | **YES — 1st** |
| `lessons-admin.js` | **1.10.0** | ⚠️ yes — the decision block, honest labels, a listener bug | **YES — 3rd** |
| `student-flow-test.mjs` | **1.1.0** | scenarios 6–9 added, 11 new assertions | commit it |
| `firestore.rules` | 2.3.0 | **NO — and that is a design decision, see §3.3** | no |
| everything else | — | no | — |

⚠️ **UPLOAD ORDER IS NOT ARBITRARY THIS TIME.** `game.js` and `learn.js` first,
`lessons-admin.js` last. The new consumers understand both old records (no
`overwrite` field) and new ones; the old consumers do **not** understand the new
field and would discard a record carrying it. Ship the writer first and every
assignment made in that window is silently thrown away — which is the exact defect
being fixed.

⚠️ **Do not trust this table.** Three consecutive rounds had a stale version table
on `admin.js`. Run `node audit-versions.mjs`.

---

## §3. What changed and why

### 3.1 `learn.js` v2.5.1 — THE OUTAGE (one line)

`beginStep()` line 1301 read:

```js
stepSeconds = resume ? (resume.stepSeconds || 0) : 0;
```

v2.5.0 deleted the checkpoint system and the local `resume` object with it, and left
this reader standing. `learn.js` is an ES module → strict mode → reading an
undeclared identifier is a **ReferenceError**, not `undefined`. So `beginStep()`
threw on **every** lesson start, from all eight call sites, *after* hiding the intro
panel and unhiding `#active-drill` but *before* `startGradedTimer()` and the first
`renderDrill()`. An empty drill view. No text, no timer, no error a student can
describe. Now `stepSeconds = 0`, because a run always begins at zero.

Symptom history worth keeping straight, because it is the same screen three times:
v2.4.0 fixed a blank drill that needed a saved checkpoint to trigger (~1 student in
10). v2.5.0 replaced it with one that needed only a click (~9 in 10). Jake's report
— *"1 in 10 was blank, now 9 in 10 are"* — was precisely accurate, and the ratio was
the diagnosis.

⚠️ **GENERALISE: deleting a subsystem means deleting its READERS, not just its
writers.** `resume` had no declaration left to grep for. The only thing in the repo
that could still see it was `undefined-calls-test.mjs`, which parses every shipped
file for exactly this class of defect. A round that deletes a subsystem is the round
most likely to need that harness.

### 3.2 The rollover import (`game.js` 3.21.1 / `learn.js` 2.5.2 / `lessons-admin.js` 1.10.0)

**The chain, in full, because no single file was wrong:**

1. The Students roster is built from `typing_logs` filtered to the last
   `ROSTER_DAYS` (**45**). Over summer, last year's students have no logs in that
   window, so they are absent from `_rosterData`.
2. `_previewCSV()` resolves email→uid **only** out of `_rosterData`. No match, so it
   treated them as new and printed, in confident blue: *"⏰ pre-assign to Period 3
   (will apply on first login)."*
3. `_commitCSV()` therefore wrote `pendingClassAssignments/{email}` rather than
   touching their user document.
4. On sign-in, `applyPendingClassAssignment()` in **both** `game.js` and `learn.js`
   hit `if (userSnap.exists() && userSnap.data().classId) return;`. A returning
   student has a classId — last year's. Silent return, **and no delete**, so the
   record was re-read and re-rejected on every subsequent sign-in, forever.

Nobody lied and nothing errored. Three files each did something locally defensible.

**The fixes:**

- **Intent travels with the record.** The pending document gains `overwrite`, set
  from the teacher's answer on the preview screen. The consumer is *told* which fact
  is newer instead of guessing. Absent field = `false`, so pre-v1.10.0 records keep
  the old cautious reading.
- **Every exit consumes the record.** All five return paths now `deleteDoc` first.
  ⚠️ This is the half that is easy to skip and shouldn't be: a pending doc is a
  *message*, and reading it consumes it whatever it said. A record that cannot act
  must not survive to be re-read — it costs a billed read per sign-in and, far
  worse, it sits in the database looking live.
- **Records expire at 30 days.** Past that, a direct placement made in the interim
  is likelier to be current than a record nobody consumed. An *unparseable or
  absent* `assignedAt` is "unknown age", never "expired" — otherwise legacy records
  become permanently unusable, silently.
- **The goals cache is dropped on a move, not only a first placement.** ⚠️ THIS IS
  THE SUBTLE ONE. On a reassignment the cached `ttb_goalsCache_v1` entry is not
  empty — it holds **last year's class with a valid `className`**, so it satisfies
  every check the cache-hit guard makes. It is well-formed and wrong, which is the
  case a validity check structurally cannot catch. 24-hour lifetime, shared between
  `game.js` and `learn.js`.
- **`_previewCSV()` stops asserting what it cannot know.** A missing uid means only
  *"no logs in the last 45 days"*. It now says that. Rows that are moves are shown
  as moves (`↷ move from X → Y`), not as first placements with a green tick.
- **The decision block.** Shown only when `queuedRows > 0 || movedRows > 0`, and
  **Commit stays locked until it is answered.** Deliberately not an overlay modal:
  it uses the same in-preview pattern as the existing "create the classes this file
  names" block, sits next to the table it is about, and cannot be dismissed by a
  stray click. A prompt with one sane answer trains people to click through
  prompts, so a file with nothing ambiguous in it is not asked about at all.
- **The mode governs BOTH write paths.** Visible students are skipped in
  `_commitCSV`; queued students are decided at sign-in by the consumer, which is the
  only code positioned to see their current class. ⚠️ An answer that applied to only
  one path would make behaviour depend on which side of the 45-day log window a
  student happened to fall on — which is the original defect wearing a hat.
- **`_addOneStudent()` sets `overwrite: true` and is not asked.** One typed address
  and one chosen class is unambiguous. The CSV importer asks because a file can
  silently contain a hundred returning students; this cannot.
- **The commit summary reports queued and skipped counts.** A bare *"12 assigned"*
  over a 14-row file was true and misleading simultaneously, and that is how this
  defect stayed invisible.

### 3.3 ⚠️ WHY THERE IS NO `classAssignedAt` FIELD

The obvious design is a timestamp on the user document, compared against the pending
record's `assignedAt`. **`firestore.rules` forbids it, and the rules are right.**
The staff grant on `users/{uid}` is
`.affectedKeys().hasOnly(['classId', 'schoolId'])`, and create is
`.keys().hasOnly(['classId', 'schoolId'])`. A third field is **denied**, so that
design needs a console rules paste — and it would widen what a teacher may write
into a student's document in order to store a fact the teacher already knows.

Carrying the intent on the pending record needs no rules change at all
(`pendingClassAssignments` has no field whitelist) and puts the decision where the
human made it. **If you are tempted by the timestamp, read this paragraph again
first.**

### 3.4 A pre-existing bug found on the way

The **Create-classes button lost its click listener** whenever a CSV contained both
an unrecognised class name *and* at least one valid row. `_previewCSV` bound the
listener, then a later `areaEl.innerHTML +=` re-parsed the container and discarded
every node in it. Dead button, indistinguishable from a slow one.

⚠️ **`innerHTML +=` IS NOT AN APPEND.** It is a read, a concatenate, and a full
re-parse of the subtree. All wiring in that panel now happens once, after the last
write. **Do not bind above it.**

---

## §4. Invariants added this round (continuing Round 8's numbering)

56. **Deleting a subsystem means deleting its readers.** After removing one, run
    `undefined-calls-test.mjs` before anything else. A deleted declaration leaves
    its references grep-invisible.
57. **A pending document is a message; reading it consumes it.** Every exit path
    from `applyPendingClassAssignment()` deletes the record. A record that cannot
    act must never survive to be re-read.
58. **"Unknown" is not "expired."** An absent or unparseable timestamp must fall
    back to the permissive reading, or legacy data becomes silently unusable.
59. **A cache guard cannot catch a well-formed stale entry.** Drop the goals cache
    unconditionally on any class change, not only when the cached value looks empty.
60. **A choice must govern every path it appears to govern.** If a teacher's answer
    applies to one write path and not the other, behaviour depends on which branch a
    student fell into, and that is not a choice the teacher made.
61. **`innerHTML +=` destroys listeners in the whole container.** Bind after the
    final write, never before.
62. **`applyPendingClassAssignment()` must depend on nothing but its injected
    arguments.** `student-flow-test.mjs` lifts it by brace-matching and runs it
    standalone; a top-level helper is invisible inside that sandbox and becomes a
    ReferenceError swallowed by the function's own catch. Inline it. (This cost a
    debug cycle *this round* — the age check started life as a helper.)
63. **Two copies of `applyPendingClassAssignment()` exist on purpose** — neither
    page controller can import the other. **Change one, change both.** A student can
    reach `game.html` or `learn.html` first, and the point of the function is that
    it does not matter which.

---

## §5. Known problems left standing

1. ⚠️ **`audit-versions.mjs`: 7 problems, all header budgets** (60 lines / 6
   entries). Header/constant **drift is now cleared** — that was the dangerous
   class, since a stale cached file reporting a new version lies exactly when you
   are using it to diagnose. What remains is length: `game.js` 81/8, `learn.js`
   101/10, `lessons-admin.js` 76/6, `admin.js` 69/7.
   **I made game.js and learn.js worse by one entry each and did not trim them,
   because trimming means migrating entries into `CHANGELOG.md` and that file's
   index is itself stale** (it claims game.js v3.14.0, learn.js v2.2.4,
   lessons-admin.js v1.7.1). Doing it properly is a round's worth of work and the
   room had students in it. **Next instance: this is the cheapest real task
   available.**
2. **`metadata-map-test.mjs` — 42 of 487 assertions fail.** Pre-existing, unrelated
   to any code here: Gutenberg-sourced EPUBs in `library/` report
   `source: "Project Gutenberg"` and a `gutenberg.org` origin where the harness
   expects Standard Ebooks and a CC0 rights string. This is a **bookclean/import
   metadata** question, not an app defect.
3. **`resume-path-test.mjs` does not exist**, and `learn.js` ~line 1251 asserts in a
   comment that it does and states what it proves. Either write it or delete the
   claim. ⚠️ A comment asserting a test exists is worse than no comment: it stops
   the next person looking.
4. **`learn.html` still hardcodes `v2.1.0`** in `<footer>`. Overwritten at runtime by
   `learn.js`, so harmless — but it is a stale number that will cost somebody twenty
   minutes. Change it to `TypeThatBook School` with no version at all.
5. **`ROSTER_DAYS = 45` is the reason the importer cannot see returning students**,
   and that is now handled rather than fixed. There is no email→uid index outside
   `typing_logs` (by design — `users/{uid}` holds no PII), so the pending path is the
   correct mechanism and not a workaround. **Do not "fix" this by putting emails in
   user documents.**
6. **App Check is initialized but not enforced** (`firebase-config.js` v1.2.0).
   Unchanged. A `401` on `recaptcha/api2/pat` is visible in the console at Ellis;
   harmless while unenforced, an **outage** the day it is enforced. Read that file's
   App Check block before clicking Enforce.

---

## §6. For Jake, operationally

- **Upload order: `game.js`, `learn.js`, `lessons-admin.js`.** See §2.
- **Deploy check:** the Lessons footer reads `School v2.5.2 / keyboard.js v1.1.1`,
  written from the constant at the bottom of the module. Still `2.5.0` → cached or
  undeployed. Still `TypeThatBook School v2.1.0` → `learn.js` never executed at all.
- **The 10 students from today** are fixed fastest through the UI, no deploy needed:
  Students tab → Reload roster (they are inside the 45-day window now that they have
  typed) → tick them → Bulk assign. Their browsers may still *display* last year's
  class name for up to 24 hours (`ttb_goalsCache_v1`); the database will be right.
- ⚠️ **`_bulkAssign()` writes `classId` but not `schoolId`.** Fine within one
  building. Do not use it for a cross-building move.
- **Their stale pending records** clean themselves up on next sign-in once §3.2
  ships — every exit path now deletes.
