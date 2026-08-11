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
| `game.js` | **3.18.0** | ⚠️ **yes — the whole round** | **YES** |
| `reanchor-test.mjs` | **1.1.0** | ⚠️ **new harness, 32 assertions** | commit it |
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

## §3a. ⚠️ v3.15.1 — MY OWN FIX REPRODUCED THE BUG, AND THE HARNESS BLESSED IT

Jake deployed v3.15.0 and hit the identical symptom on Aesop's Fables inside minutes.
**Read this section before touching `reconcilePosition()`.**

### The tell was in the completion modal, not the readout

`0 WPM · 100% Acc · 0m 1s`. Thirty characters in one second would read as ~360 WPM.
Zero elapsed and zero WPM means **one keystroke**, which hit the
`currentCharIndex >= fullText.length` guard in the keydown handler and ran
`finishChapter()`. There was never a sentence to type; the renderer was drawing the tail
of a chapter the student was already past the end of.

⚠️ **Generalise this: "one sentence left" is what an out-of-range offset LOOKS like.**
Aesop's chapters are ~500 characters, so almost any stale offset overshoots. The 284
tiny fables are the best stress case in the library — use that book to test this code.

### An offset at or past the end is a DEAD STATE, not a position

v3.15.0 reached it three ways, all mine:

1. The under-a-week rung clamped to `len` and called it "their exact spot". **Recency is
   worthless when the content changed *after* the bookmark was written.** The ladder
   silently assumed staleness and wrongness were the same axis. They are not.
2. The week-to-month rung clamped to `len` and *then* snapped to the sentence start —
   which lands on the **last sentence of any chapter, every time.** A machine for
   manufacturing this symptom.
3. ⚠️ **The recent rung LAUNDERED the bad offset.** One keystroke completed the chapter,
   the flush stamped the current `contentVersion` onto the dead position, the versions
   then agreed, and no reconcile ever fired again. **A self-healing system that can write
   its own bad state back as verified is worse than no healing at all** — it converts a
   recoverable fault into a permanent one and removes the evidence.

`reconcilePosition()` can now never return a position with nothing left to type: any
age, with or without a job.

### ⚠️ Anchor proof runs BEFORE the dead-state guard, and the order is load-bearing

My first attempt put the guard first. The harness caught it in one run: a chapter that
**shrank** below a student's stored offset is both out of range *and* perfectly
rescuable, because the anchor still names the exact words they had reached. Bailing to
the top of the chapter there throws away the only hard evidence in the system. Proof,
then guard, then ladder — in that order.

### ⚠️ The harness asserted the bug as correct and passed

`reanchor-test.mjs` v1.0.0 checked that an out-of-range index *"lands on a real sentence
boundary"*. It did — the boundary of the **final** sentence. Twenty-five green checks,
one of them expecting the wrong number.

§6 of this handoff already said that a harness passing 25/25 first try in this project is
suspicious rather than reassuring. I wrote that sentence and did not apply it to my own
expected values. **A passing assertion is only as good as the number it expects, and the
number is where the author's misconception lives.** v1.1.0's regression block fails
against v3.15.0.

---

## §3b. v3.16.0 — the only way back, and the one still missing

Jake tested v3.15.1 across three books: Aesop advanced correctly, Nancy Drew landed at
the right spot, and Little Princess *"felt new — I'm not sure I was that far forward."*

⚠️ **That last one is residue, not a live bug, and the distinction matters.** Ch. 2 was
falsely ticked complete back when the offset was dead; the student was then advanced
perfectly legitimately as far as the data knew. **No later fix can un-write that.** When
a bug has been corrupting stored state for a while, shipping the guard is only half the
job — the other half is giving people a way to undo what was already written.

So: `showStartModal()` now offers **"↩︎ Start this chapter over"** whenever
`currentCharIndex > 0`.

⚠️ **Until this shipped, every student-facing navigation ran FORWARD.** Jump-to-furthest
was the only one; the chapter picker is Game Genie, which is admin-gated. A student ahead
of where they had read had no move at all. **Look for that shape elsewhere — a system
that can only advance is one that cannot recover.**

Two design notes worth keeping:
- **Not gated on a re-anchor having happened.** An affordance that appears only after a
  rare fault is one nobody has learned to look for, and a kid who spaced out for a page
  needs it just as much.
- **No confirm dialog, on purpose.** It leaves `furthest*` untouched, so the jump link
  directly above reverses it in one click. Nothing is destroyed. Confirming harmless
  actions mainly trains children to click through warnings.

### v3.17.0 — Flip Back closed the gap

Jake's proposal, and he was right to push past the one-click restart: *"give students the
aspect of Game Genie that jumps to any chapter and any sentence… but limit it to previous
to where they are now."*

⚠️ **One correction to his framing, and it is the whole design: the ceiling is `furthest`,
not the current position.** Bounding by where a student stands collapses the instant the
tool is used — flip back to Ch. 2 and Ch. 3 is now "ahead", so the thing that moved them
cannot move them home. `furthest` gives free movement across earned ground with no route
past the frontier. **Generalise: a bound computed from mutable state that the feature
itself mutates is not a bound.**

⚠️ **Cross-chapter is two-step and must stay so.** `getSentenceMap()` reads `fullText`,
which exists only for the loaded chapter. One-screen navigation means prefetching all 284
Aesop chapters.

⚠️ **Sentence-level backjump makes WPM farming easier** — loop a memorised sentence. Not
new (restart-chapter and practice mode already allow it) but tighter. Told Jake before
shipping rather than after. **If the leaderboard ever looks wrong, start here.**

`completedChapters` is deliberately untouched by a flip back: the ✓ records something the
student did, and re-reading is not un-doing it. That is the question below, answered by
default in the least destructive direction — **but Jake still has not ruled on it**, and
if he wants re-reading to clear a tick, the place to do it is `flipBackTo()`.

### v3.18.0 — the same door, on the screen where people are standing

Jake, immediately after testing v3.17.0: *"We probably need a flip back option on the
pause screen that occurs when the user stops typing — between the stats and the buttons."*

He is right and the reason generalises. ⚠️ **The pause screen is where a student notices
they are lost** — they stop typing *because* the text stopped making sense. Reaching the
tool only from the start modal meant dismissing the stats, landing back in the book, and
pausing again: navigating out of the exact confusion the tool exists to fix. **An escape
hatch belongs where people are when they need it, not only where the flow begins.**

`showStatsModal()` already had an `extraHTML` slot in the right place (v3.12.2, added for
the book-completion "About this book" link) so this cost one insertion and one handler.
`modalActionCallback` is cleared first so the abandoned sprint does not resume underneath
the picker.

### ⚠️ The remaining open question, still Jake's call

**Does re-reading a chapter un-tick its ✓?** v3.17.0 ships saying no, because that is the
non-destructive default, not because the question is settled. `completedChapters`
feeds `chaptersCompleted` in the stats rollup and the ✓ marks in Game Genie's picker.
Silently clearing it edits a record of something the student did; silently keeping it
means the picker shows chapters as done that they are actively redoing. Ask before
building.

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
44. **An offset at or past the end of its content is a dead state, not a position.**
    Nothing can resume there. Guard the *shape* of the answer — "does this leave
    anything to do?" — not just its range.
45. **Recency is not validity.** A bookmark written an hour ago is still garbage if the
    content changed after it was written. Never let an age threshold decide whether a
    provably invalid value is acceptable.
46. ⚠️ **A self-healing system must never write its own bad state back as verified.**
    v3.15.0's recent rung stamped `contentVersion` onto a dead offset, converting a
    recoverable fault into a permanent one and deleting the evidence that anything was
    wrong. Before writing a "this is now correct" marker, check that it *is*.
47. **The number an assertion expects is where the author's misconception lives.** A
    green harness proves the code agrees with the author, not with reality. When a test
    passes first try, re-derive the expected values from the requirement rather than
    from the implementation.
48. **Consult proof before applying a guard.** Order matters: a value can be both
    out-of-range and exactly recoverable. Guards that run first discard evidence.
49. **A system that can only advance cannot recover.** Every student navigation in this
    app ran forward until v3.16.0. When auditing a flow, list the moves available and
    check whether any of them go backwards.
50. **Shipping the guard is half the job when a bug has been writing bad state.** The
    other half is an undo for what was already committed. Ask "what did this corrupt
    that my fix cannot reach?"
51. **An escape hatch belongs where people are when they need it.** Flip Back on the
    start modal alone required a lost student to navigate out of their confusion to
    reach the tool for it. Ask of any recovery affordance: *what screen is someone
    looking at at the moment they realise they need this?*

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

0. ⚠️ **Aesop's Fables first, every time.** 284 chapters of ~500 characters each is the
   library's best stress case for stale offsets — almost any overshoot lands past the
   end there, which is precisely how v3.15.1 was caught. A fix that looks fine on a
   novel can still be broken on Aesop's.
1. **Open a book you have progress in.** It should land where it always did, with no
   notice. Your next keystroke stamps `contentVersion` and heals it permanently.
2. **Then one you have NOT touched since the re-upload.** Expect the blue
   `📘 This book was updated…` line in the start modal and a snap to the top of the
   chapter — everything is months stale, so the ladder's bottom rung.
3. **Console.** `Book content changed since this bookmark was written (age Nd, anchor
   ABSENT)` on the first load; silence on the second, after you have typed.
4. ⚠️ **Never accept "the chapter completed" as a pass.** Check the completion modal:
   `0 WPM` and `0m 1s` means nobody typed anything and the offset was dead. A real
   completion has a real elapsed time.
5. **The real proof: re-upload a book you are mid-chapter in, then reopen it.** That
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
