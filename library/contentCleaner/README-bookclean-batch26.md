# README — bookclean batch 26 (Fabriano)

**Date:** 2026-08-31
**Instance:** Fabriano (Fabriano, the Italian papermaking town that gave Europe the watermark —
second name in the papermaker series after Whatman)

## What shipped

| Book | Words | Rows | Outcome |
|---|---|---|---|
| *Tom Swift and His Motor-Cycle* (Appleton 1910, PG #4230) | 45,004 | **96** | ✅ **SHIPPED.** Full de-dialect of Eradicate Sampson, Jake's option 2. |
| *Ruth Fielding of the Red Mill* (Emerson 1913, PG #4985) | 45,361 | **54** | ✅ **SHIPPED.** 13 `ejaculat*`, a 29-site disability-label pass, 5 Mammy 'Liza. |
| *The Box-Car Children* (Warner 1924, PG #42796) | 27,660 | **5** | ✅ **SHIPPED.** Second-cleanest book in the corpus after *Alice*. |

```
appleton-tom-swift-and-his-motor-cycle-claudeCleaned.epub
emerson-ruth-fielding-of-the-red-mill-claudeCleaned.epub
warner-the-box-car-children-claudeCleaned.epub
```

**155 rows across 118,025 words. Fourth three-book batch.** All three arrived as
`-claudePrepared` from the structural session (Bodoni), flat Gutenberg `OEBPS/` layout,
`quality.py` DEFECTS none on arrival, zero untypable characters, and **the three easiest-typing
books measured since the archaic-density bug was fixed** — mean sentence 13.5 / 15.4 / 13.5
against *Captains Courageous*'s 15.0.

---

## Tom Swift — the biggest single-character pass in the corpus

**Eradicate Andrew Jackson Abraham Lincoln Sampson**, elderly Black whitewasher with a mule named
Boomerang, in chapters 7, 8, 10, 17, 20, 21 and 22. 96 rows: **37 race labels** (`darky` ×10,
`negro` ×7, `colored man/men` ×27, `nigger` ×1, `coon` ×2) and **~1,900 words of eye-dialect across
68 speeches**. Eye-dialect tokens **265 → 28, and all 28 remaining are the tramp's.**

Jake's ruling was option 2 — batch-14's option B, scaled up. The diagnostic held: separate the
joke from the marking.

- **Every malapropism survived, without exception**, and they all work in plain English:
  `the most outrageous quadruped that ever circumlocuted`, the whole `liverage`/livery-stable riff,
  `a conjure-man when it comes t' fixin' wagons`, `that monstrousness machine`, `I didn't know my
  lawn-mower was named Paul` (for *pawl*), `I'll explanation it to you`, `What's that 'bout mush?`
  (for *mesh*).
- **Every bit of grammar survived**: `that's what I is`, `am you sure`, `Does you think I can?`,
  `I guarantees satisfaction`, `he done back up against the bar, an' there he stay`, `not a stick
  have I sawed`, `the man what I'm workin' with on shares`, `I asks you fair`. Plus every elision
  the book also gives its white characters — `an'`, `t'`, `fer`, `git`, `jest`, `ef`, `'scuse`,
  `pow'ful`, `allers`, `indeedy`, `Good land o' massy`.
- **ST6 mark-once at the first introduction:** `an old colored man` → `an old Black man` (ch. 7),
  modernised per Jake's batch-8 preference. Every later narratorial marker is unmarked and varied
  across `the driver` — ⚠️ **Appleton's own word, supplied two paragraphs later** — `the old man`,
  `Eradicate`, `the aged whitewasher`, `the sawyer`.

### ⚠️ THE TRAMP'S DIALECT IS A PLOT DEVICE AND NOT ONE TOKEN WAS TOUCHED

Happy Harry speaks Bowery cant, and **Tom identifies him as a disguised criminal by hearing the
dialect slip**: *"The tramp in his second remarks used language more in keeping with his character,
whereas, in his first surprise and anger, he had talked much as any other person would."* Two
paragraphs later Tom spots the false beard. A pass that regularised the tramp along with Eradicate
would have deleted the clue.

**So this book has two dialect speakers with opposite rulings** — the batch-10 Prito/Rocco shape
pointed at dialect instead of caricature. `verify.py` asserts chapters 11 and 19 **byte-identical**
and the ch. 20 hobo paragraph verbatim.

### What was flagged and deliberately not edited

⚠️ **Ch. 21: `I uster wuk dere befo' de wah`.** Eradicate worked at the Harkness mansion before the
Civil War and the book never says in what capacity; `since quality folks libed dere` is his own
phrase for the family. The spellings were fixed; **the history was not.** Batch 9: slavery is never
glossed, and the only question is whether the text treats him as a person. It does — he is the one
who knows the house, and that knowledge is what breaks the case.

---

## Ruth Fielding — the disability pass is the deliverable

**Mercy Curtis** is in a wheel chair, and she is savage, funny and the best thing in the book.
**The disability is untouched** (14b sub-rule 1) — the chair, the pain, Ruth's refusal to pity her,
Uncle Jabez's unexpected tenderness, the surgeon in ch. 23. What came out is **25 places where the
narrator used it as her name**: `the cripple` ×13 and `the lame girl` / `the crippled girl` ×12 as
bare noun substitutes, including in dialogue tags (`snapped the cripple`). All collapse to `Mercy`,
`she` or `the girl`, varied by sentence, with three rows recast rather than swapped.

⚠️ **Jake's self-reference ruling has ZERO SITES, and that is recorded rather than dropped.** He
ruled that if Mercy uses either word about herself it stays. She never does — she names *the
chair*: `tied to this chair like I have`, `this old chair`, `when the grape leaves get big enough
to hide me`. **The ruling still binds the rest of the series**; Ruth Fielding runs to 30 books and
Mercy is in most of them.

**Left as characters speaking (14g):** Ruth's `"The lame girl, sir?"`, Aunt Alvirah's `that leetle
lame gal`, Uncle Jabez's `"Sam Curtis' gal--the cripple?"` — and `verify.py` carries an *allowed
count* for the last two rather than a bare zero, so the ruling is in the harness.

**Mammy 'Liza, 5 rows, one scene.** 'Liza never appears on the page; the child who brings the tray
is nameless, has one line, and is described by `her wool "done" in innumerable pigtails, like tiny
horns, and sticking out all over her brown head`. Full unmark, batch-11 Chump Cyril. **The body
business is the marking, not the label** — the pigtails stay, because a small girl with her hair in
pigtails is a real and harmless image.

**Also 13 `ejaculat*`**, varied per speaker: `exclaimed`, `cried`, `snapped Mercy` (the book's own
verb for her), `whistled Tom` for `"Whew!"`, `many murmurs of` for Aunt Alvirah's back-and-bones
refrain.

---

## Box-Car Children — 5 rows, and 20 of 24 scan hits were false positives

`gay` ×2, the bare `cock` (`Watch cock his head` → `tip his head`; `cocked an ear` stays per 11b),
and `the little colored boy` → `the little Black boy`, ST6 mark-once — he is last year's race
winner and Henry's benchmark, the line is admiring, and unmarking him would delete him from a scene
in which he beat a college runner.

⚠️ **`filling in the chinks` LEFT BY JAKE'S RULING, and the portable part is new calibration.** It
sits ~15 words after `like a Japanese print` — the tightest proximity the batch-23 rule could ever
see. Jake: *"fine either way, as I don't think anyone would associate a Japanese print with a
Chinese slur."* **The proximity rule is about an Asian PERSON, not an Asian OBJECT.** A woodblock
print, a china teapot, a Japanese maple do not arm the word. Asserted PRESENT in `verify.py` so a
later instance who "helpfully" fixes it fails the battery.

`roosters` ×2 fired `rawcheck --fingerprint` as a possible prior `cock` swap and are **genuine
barnyard** — the batch-24 Ozma/Billina case exactly.

---

## ⚠️ The title-page note was FALSE ON ARRIVAL, and then still wrong

All three files arrived with the classroom note already inserted by `ttb-fix-epubs.py`, **before
any language pass had run** — so on arrival the sentence *"has had a small number of period racial
slurs and dated terms reworded"* was simply untrue, and `rawcheck --fingerprint` reports it as a
previous-pass fingerprint on all three. That is 17a: the note is evidence about the note.

Worse, the shipped wording ended *"...stories, characters, and **dialect** are otherwise
unchanged"* — and **the dialect is the one thing this batch changed most.** All three notes are
restated (rows N1–N3). Tom Swift's now names the de-dialect *and* names the exception, so a reader
can see the tramp's surviving dialect is a ruling.

**This is a structural-side bug worth fixing at source:** a book that ships structural-only would
go out carrying a false provenance claim.

---

## Verification

**All 10 `verify.py` checks pass, 33 assertions.** Round-trip on the **packaged** EPUBs: 0 residual,
`measure.py typable` none, `quality.py` DEFECTS none, `rawcheck --attrs` no hits, and **every
touched file reproduces from the pristine upload plus the edit table alone.**

```
[1]  XML well-formedness          30/30, 30/30, 22/22
[2]  <p> parity                   +0 / +0 / +0, expected derived from edits.py
[3]  OPF byte-identical to upload  all three
[4]  nav.xhtml + toc.ncx           all six byte-identical
[5]  REVERSE-diff                  8/8, 15/15, 5/5 touched files
[6]  FORWARD-diff from PRISTINE    8/8, 15/15, 5/5
[7]  residual, whole book          27/27, 11/11, 3/3 as ruled
[8]  ruled leaves unchanged        24/24, 14/14, 7/7
[9]  introduced-word check          reported
[10] identity + dc:title           all three
```

### ⚠️ THE HARNESS CAUGHT FIVE THINGS AND FOUR OF THEM WERE MINE

1. **Two real misses in Ruth Fielding**, found by the post-apply residual scan and not by my
   reading (RF48, RF49). ⚠️ **RF49 escaped because I enumerated sites with a grep for `the crippled
   girl` and the text reads `the LITTLE crippled girl`.** An intervening adjective defeated my own
   pattern — the same shape as `/\bpecker\b/` (16a) and the written `gay*` stem that cannot reach
   `gaiety` (25j). **When enumerating sites for a table, allow for an intervening word.**
2. ⚠️ **`verify.py`'s `plain()` did not unescape entities**, so *every* pattern containing an
   apostrophe matched nothing in both directions — `\byo'`, `\bdoan't`, `\ban'`, `pow'ful`,
   `'bout mush`, `Curtis' crippled daughter`. Six leave patterns read `0->0` and one residual
   pattern was **untestable while reporting success.** 25h again. There is now an `a == 0` guard so
   a pattern that can never match fails.
3. ⚠️ **The leave check counted our own classroom note as the book's text** — `\btramp\w*` read
   72→73 because the corrected note contains the words "the tramp's dialect". `titlepage.xhtml` is
   now excluded from every count.
4. ⚠️ **A count cannot express the tramp ruling at all.** Asserting `dat` unchanged book-wide failed
   63→19 (correct outcome, badly-posed check); scoping it to the tramp's *chapters* still failed
   20→19, because **ch. 20 contains both the hobo and Eradicate.** Replaced with **byte identity** on
   chapters 11 and 19 plus a verbatim check on the hobo paragraph. A count can be satisfied by
   accident; bytes cannot.
5. ⚠️ **I typed two identity counts out of nothing** (`Alvirah 27`, `Benny 149`; actual 78 and 207)
   **in the same file whose docstring warns against typing a number you can compute.** Seventh
   consecutive batch in which a failing harness caught my number rather than the book's. Writing the
   lesson down has now failed five times, so the rule is stronger: **a harness may not contain a
   literal count.** Check 10 derives from PRISTINE and adds a `dc:title` match.

---

## ⚠️ `the invalid` — RULED AND APPLIED (rows RF50–RF53)

Jake: *"If Mercy is calling herself an invalid, then it stays. If it's someone else — including
the narrator calling her that — then it needs to be updated."*

**Verified: Mercy never uses the word.** All four remaining instances are the narrator or Ruth's
point of view, so all four are fixed — joining the fifth that row RF3 had already caught by
sharing a span with an approved `ejaculat*` row.

| # | old | new |
|---|---|---|
| RF50 | `such as Ruth knew was used by invalids who could not walk` | `...used by people who could not walk` |
| RF51 | `which Ruth supposed must belong to the invalid.` | `...must belong to the child in the wheel-chair.` |
| RF52 | `the first greeting of the invalid was a most ill-natured one` | `Mercy's first greeting was a most ill-natured one` |
| RF53 | `to bring something for the invalid.` | `to bring her something.` |

⚠️ **RF50 is not strictly covered by the ruling and I took it anyway, which is worth saying out
loud.** It is a generic plural describing a *kind* of chair; Mercy is not present and is not being
called anything. It went because the replacement is lossless and because leaving one `invalid`
standing after removing four is exactly the inconsistency the ruling exists to end. RF51 could not
use her name — Ruth has not learned it yet; it appears in the next line of dialogue.

⚠️ **This is the RF49 lesson repeating inside one batch.** I built the site list by grepping the
labels I *expected* (`the cripple`, `the lame girl`) instead of reading for the **function** —
narrator naming a character by her condition. `invalid` does that job and never entered my table.
**Enumerate by function, then confirm by pattern; never the reverse.**

## ✅ Closed by Jake in-batch: the apostrophes stay

**The apostrophe load barely moved on Tom Swift** — mid-word apostrophes 1,161 → 1,153, because
   the policy deliberately **keeps** `an'`, `t'`, `fo'`, `fer` and the g-drops, on the grounds that
   the book gives the same elisions to its white characters and stripping them would make Eradicate
   speak like the Swifts. The win was the respellings (265 → 28). **If you want the elisions gone
   too for typing reasons, say so and it is a mechanical follow-up pass**, not a judgment one.

## Tool changes

| File | Change |
|---|---|
| `edits.py` | Batch 26 table, 155 rows, 3 books. New: `raw()` as the single owner of the entity mapping; `check_amp()` refuses to run on a bare `&` (13c); overlap detection between rows in one file. |
| `verify.py` | **Ten checks.** `plain()` now unescapes; `titlepage.xhtml` excluded from counts; byte-identity leaves; residual patterns carry an allowed count; identity derived, not typed. |
| `apply.py` | Header only. |

`repack.sh` ships with the kit — `mimetype` stored first and uncompressed, asserted after build.
