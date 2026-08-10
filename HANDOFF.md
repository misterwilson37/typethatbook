# HANDOFF — Round 8 (Yost)

<!-- HANDOFF.md v8.0.0 — Round 8, instance "Yost", 2026-08-10.
     ⚠️ SUPERSEDES Round 7, archived as HANDOFF-round7.md rather than overwritten.
     Round 7 §5 (invariants 21–36), §8 (working with Jake), and Round 6 §2/§4/§5/§8
     are STILL LOAD-BEARING and are NOT restated here. Go and read them. -->

**Instance:** **Yost** (8) · Hammond (7) · Noiseless (6) · Mignon (5) · Oliver (4)
· Blick (3) · Dvorak (2) · Underwood (1) · *other projects:* Stedman, Fable, Trilby, Vernier

> *On the name:* the Yost's whole reputation rested on its type-bar linkage, which
> carried each letter down to an ink pad and then struck the platen at a mechanically
> guaranteed point — characters landed exactly where they should, every time, and lines
> never drifted out of alignment. This round was the opposite condition: a stored
> position that no longer landed where it used to, because the paper had been changed
> underneath it.

---

## §0. What this round was

Jake's brief: *"I've now gone through and re-uploaded every single book in the library
with editorial changes that range from a few words changed to new chapter numbering… I
went into Little Princess and I only have one sentence to type. Nothing more, nothing
less. Do we need to reset everyone's progress to zero? Or is there a better fix? Books
may get updated again in the future, so we either need a policy or a tool."*

One defect, present in every version of `game.js` that has ever shipped, plus three
smaller ones in the same blast radius. **The answer to his question was "no, don't
reset" — because a reset fixes today and does nothing about the next re-upload, which
he told me in the same breath was coming.**

⚠️ **THE MOST USEFUL THING I DID WAS ASK FOR ONE NUMBER BEFORE WRITING ANY CODE.** Two
unrelated bugs produce "one sentence to type": a stale offset against a valid chapter,
or a chapter document that genuinely contains one sentence — an `admin.js` upload
defect and a completely different investigation. I asked Jake to open Game Genie and
read out the `Char X / Y` line. **It resolved the branch in one exchange, and the
screenshot carried a detail I had not asked for that turned out to be the most important
thing in the round.** See §2.2 and invariant 43.

---

## §1. Version state — `audit-versions.mjs` 2026-08-10: **0 problems**

`node run-all-tests.mjs` → **16 of 17 pass.** The one failure is NOT mine — see §5.

| file | version | changed? | upload? |
|---|---|---|---|
| `game.js` | **3.15.0** | ⚠️ **yes — the whole round** | **YES** |
| `reanchor-test.mjs` | **1.0.0** | ⚠️ **new harness, 25 assertions** | commit it |
| `run-all-tests.mjs` | — | yes — registers the new harness | commit it |
| `CHANGELOG.md` | — | yes — `game.js` v3.15.0 | commit it |
| `README.md` | — | yes — harness table, progress schema | commit it |
| everything else | — | no | — |

**`game.js` ships alone.** No companion file, no rules change, no Firestore console
work, no migration, no batch job. The four new fields are additive and written with
`merge: true`, so an old client and a new client can run side by side during a rollout —
the old one simply ignores fields it does not read.

⚠️ **Jake's `admin.js` is v3.30.0, not the v3.28.0 Round 7's table claims.** Round 7 §0
warned in bold never to trust a version claim in a handoff *including its own*, and its
own table was stale within two rounds. **Run the audit. Do not trust this table either.**

---

## §2. What was broken

### 2.1 The character offset was never validated against anything — every version

```js
renderText();
currentCharIndex = savedCharIndex;   // ← the entire bug
```

A bookmark is `(chapter, charIndex)`. **Both coordinates are measured against one
specific version of the text**, and the progress document recorded nothing about which
version that was. Re-upload the library and every stored offset silently becomes an
index into a text that no longer exists.

⚠️ **Rounds 6 and 7 hardened the chapter id three separate times** —
`isKnownBodyChapter()`, the `furthestChapter` companion check (v3.12.4),
`firstBodyChapterId()` (v3.12.1) — each time writing a comment about renumbering.
**Nobody ever looked at the other coordinate**, which sat one line away.

### 2.2 ⚠️ THE FAILURE MODE IS A PLAUSIBLE SUCCESS — this is the part that matters

Nothing threw. Nothing logged. The student resumed inside the last sentence of a chapter
they had barely started, typed that sentence, and `finishChapter()` **ticked the chapter
off as read.**

**A student would not report this as an error. They would report it as "I finished the
chapter" — or not report it at all.** That is why it took an admin with Game Genie to
notice, and why no amount of error monitoring would ever have surfaced it. This is Round
7's invariant 22 with the sign flipped: not a feature so wrong it got reclassified as
decoration, but a **failure so smooth it got reclassified as progress.**

### 2.3 Chapter *existence* was checked; chapter *identity* was not

`isKnownBodyChapter()` asks only whether the stored id resolves. After a renumber that
shifts content between ids that **all still resolve** — Toby Tyler's 3-22 → 1-20, caused
by `admin.js` Fix C, is the precedent already in this codebase — every id passes and the
student is dropped into different content at the same offset. The stored chapter
**title** is the only thing that survives that.

### 2.4 `completedChapters` was never revalidated

A ✓ could sit on an id that now means a different chapter, and `chaptersCompleted` in
the stats rollup takes its `.size`. Now filtered against the chapters the book has.

---

## §3. The fix, and the two decisions inside it that are Jake's, not mine

**Proof, then degradation.** Every write stamps `contentVersion`, `chapterTitle`,
`chapterLen` and `anchorText` (the ~48 characters *behind* the cursor). A matching
`contentVersion` on load is the fast path and behaves exactly as before, at zero added
cost. A mismatch searches the new text for the anchor.

⚠️ **`anchorText` is taken from BEHIND the cursor on purpose.** That text is what the
student has demonstrably read. An anchor taken from ahead would re-anchor them onto
content they have never seen if the edit inserted a paragraph.

⚠️ **`findAnchorEnd()` returns the occurrence NEAREST the old offset, not the first.** A
48-character anchor can legitimately repeat. Taking the first match drags a student
backwards, potentially to the top of the chapter — which looks exactly like the bug.

### 3.1 Jake's ladder — his design, and better than mine

I offered three flat policies for the pre-fix cohort. He rejected the framing:

> *"Moving forward, keeping this spot would be great, but if that's lost, current
> sentence and if that's lost the chapter. I would love it to be time based — been less
> than a week? Snap to the exact spot. Been more than a week? Snap to the sentence. A
> month or more? Chapter."*

⚠️ **This is load-bearing pedagogy, not a tuning constant. Do not "simplify" it.** The
reasoning is about what a child remembers: within a week they know the sentence they
were on and landing mid-paragraph helps; after a month they have lost the thread and
landing mid-paragraph disorients, so re-reading a chapter costs less than confusion.

⚠️ **AND IT NEEDED NO MIGRATION.** `lastUpdated` was already on every progress document,
so the entire pre-fix cohort is simply "stale" and lands on the chapter-start rung by the
ordinary rule. **The legacy code path I was one question away from building did not need
to exist.** Round 7 §8 says Jake improves the answer when asked a scope question; he did
it again, and the improvement was structural rather than cosmetic.

**My one amendment, flagged rather than taken silently:** a *found anchor* wins
regardless of age, because it is proof rather than a guess. Time governs only the
fallback. **Jake has not ruled on this yet.** If he wants hard time caps that override
even a confirmed anchor match, that is a change to `reconcilePosition()`'s first branch
and nothing else.

### 3.2 Why there is no admin repair tool

⚠️ **One is not buildable as the rules stand, and knowing that is worth a round to
someone.** `firestore.rules` (~line 216) lets staff and super **read** any student's
progress but restricts `write` to `request.auth.uid == uid`. Repairing progress from
`admin.html` means a Cloud Function or loosening that rule. Both are worse than healing
in the client, which happens on next open, costs nothing for books nobody reopens, and
needs no coordination with anyone.

---

## §4. Invariants — additions to Round 7 §5 and Round 6 §5, both of which still apply

37. **When you harden one half of a composite key, state why the other half is safe.**
    Three rounds hardened the chapter id, each writing a comment about renumbering. The
    character offset sat one line away, untouched, the whole time.
38. **The dangerous bug is not the one that errors — it is the one that completes.** A
    stale offset near a chapter end produces a chapter that finishes normally and marks
    itself read. Ask of any restored state: *if this value were wrong, would the app
    fail, or would it succeed at something else?*
39. **Any stored offset into content is a foreign key into a version you did not
    record.** Character indices, line numbers, scroll positions, timestamps into media.
    Store what it was measured against, or a fingerprint of the content at that point,
    or accept that it will rot silently.
40. **Prefer proof to policy where proof is cheap.** 48 characters per write turns "we
    think they were about here" into "they were exactly here". The staleness ladder is
    the fallback, not the mechanism.
41. **Refuse to remap on ambiguity, at the level of the whole operation.** Round 7's
    invariant 24 was about not guessing a licence version; `chapterIdForTitle()` returns
    null on a duplicate title for the same reason. A part-numbered book repeats titles
    across parts, and guessing means teleporting a child into the wrong part.
42. **Ask for one measured number before choosing which bug you are fixing.** "One
    sentence to type" had two causes with no overlap in their fixes. One Game Genie
    readout cost one exchange and eliminated an entire investigation.
43. **A screenshot carries more than the number you asked for.** I asked for
    `Char X / Y`. The ✓ beside the chapter in the same dropdown proved the chapter had
    been *completed* — which is what established §2.2, the part of this round that
    actually matters. **Read the whole image, not the field you requested.**

---

## §5. ⚠️ A failure you will see that is NOT this round's

`metadata-map-test.mjs` fails: `CLASSROOM_NOTICE not found in admin.js`.

`admin.js` v3.30.0's own header records deliberately removing `runDedication()`,
`CLASSROOM_NOTICE`, `DEDICATION_TEXT`, the classroom argument to
`canonicalRightsFrom()`, and the dedication gap flag. **The harness was never updated to
match**, so it has been red since that round shipped. I did not touch it — repairing a
harness for a feature I did not remove, during a round about something else, is exactly
how Round 7 §7's 370-line deletion started.

⚠️ **But it needs fixing soon.** A permanently red harness in the fast suite trains
everyone to read "1 failing" as normal, and the next real failure hides behind it. That
is invariant 22 pointed at the test suite.

⚠️ **The harnesses need dev dependencies that are not installed.** `jsdom`, `acorn`,
`acorn-walk`, `jszip`. Seven of sixteen fail with `ERR_MODULE_NOT_FOUND` on a clean
checkout, which at a glance reads as seven broken tests. Run
`npm install jsdom acorn acorn-walk jszip` first. **Consider adding them to
`package.json` as devDependencies** — a suite that looks half-broken on checkout is a
suite people stop running.

---

## §6. Things I got wrong, and one thing I nearly did

- **My first header-trim assertion failed and I am glad it did.** I calculated that my
  new changelog entry had to be 9 lines, wrote 11, and asserted the count before
  splicing. The assert fired; the file was untouched; I rewrote to 9. **Round 7 §7
  records botching this exact header five times, twice destructively. Asserting the line
  count before the splice is what turns it into a non-event** — invariant 33, working.
- **I nearly built a legacy migration path that did not need to exist.** It was designed
  and I was one question from writing it when Jake's time-based ladder made
  `lastUpdated` do the work for free. **The question was cheaper than the code.**
- **`lastSavedIndex` is dead state and I added to it anyway.** Assigned in eighteen
  places, read in two, both of which only save and restore it around practice mode.
  Nothing consumes it — `walDirty` drives flushing. I kept my assignment for consistency
  rather than leave the one load path that fails to maintain it, **but the right fix is
  to delete all eighteen.** Clean, self-contained job for whoever wants one.
- **My harness passed 25/25 on its first run**, which in this project's history is
  suspicious rather than reassuring; Round 7's caught two real bugs in its own author's
  fix within minutes. **I have no browser and have clicked none of this.** See §7.

---

## §7. ⚠️ What to spot-check in a browser, in order

1. **Open a book you have progress in.** It should land where it always did, with no
   notice. Your next keystroke stamps `contentVersion` and heals it permanently.
2. **Then one you have NOT touched since the re-upload.** Expect the blue
   `📘 This book was updated…` line in the start modal and a snap to the top of the
   chapter — everything is months stale, so the ladder's bottom rung.
3. **Console.** `Book content changed since this bookmark was written (age Nd, anchor
   ABSENT)` on the first load; silence on the second, after you have typed.
4. **The real proof: re-upload a book you are mid-chapter in, then reopen it.** That
   round-trips a stored anchor and is the only test of the *mechanism* rather than the
   fallback. It should put you back exactly where you were, silently.

---

## §8. Jake — working with him

Round 7 §8, Round 6 §8, Round 5 §8 and Round 4 §12 all still hold. Adding:

- **He answers a policy question with a better policy.** Given three flat options for
  the legacy cohort, he returned a graded, time-keyed ladder — plus a throwaway
  observation, *"it's been months, and no one will remember where they are"*, that was
  itself the design constraint. §3.1.
- **He reasons from what a child will experience, not from what is easy to build.** The
  ladder's rungs are about memory. Take that seriously before retuning them.
- **He sends screenshots that answer more than the question asked.** Invariant 43.
- **Tell him what ships.** One file this round. Say so plainly.
