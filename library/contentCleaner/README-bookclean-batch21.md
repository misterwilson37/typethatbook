# Batch 21 — README

One book shipped as-is, one cleaned EPUB.

## Deliverables

| File | Result |
|---|---|
| `mary-eleanor-wilkins-freeman-wind-in-the-rose-bush_g-claudePrepared.epub` | unchanged — the original prepared file, no edits met the bar |
| `bessie-marchant-daughters-of-the-dominion_g-claudeCleaned.epub` | 19 edits, incl. one cut scene and a chapter retitle |
| `HANDOFF-bookclean.md` | master handoff, batch 21 merged in |
| `edits.py` / `apply.py` / `verify.py` / `frontmatter.py` | this batch's table and harness (Dominion only — Rose-Bush needed none) |

## The Wind in the Rose-Bush (Freeman, 1903) — shipped as-is

43,423 words, six Gothic short stories. Easy register, no scenes, no self-harm content despite
several stories turning on a death. Only one item cleared the bar for a table row: a simile
("like a Chinese toy," describing a nodding-doll toy of the period) that's genuinely this minor.
Jake's call: leave it. First book in the corpus shipped with the original prepared file
unchanged — a clean scan-and-report result, not a skipped review.

## Daughters of the Dominion (Marchant, 1911) — 19 edits

98,505 words. **Register flag, not a decline:** mean sentence length 25.9 words, higher than
*The Black Arrow*'s 21.3 (previously the hardest-shipped book), despite easy archaic density
(2.0/1000). Sentences are long and clause-heavy throughout — no prose-quality problem, just
harder to type than anything else shipped so far. Jake's call on scheduling.

**The Squawlands passage (ch. 15) was cut.** A settler character recalls a founding legend in
which the Salish — a real, named Pacific Northwest nation — "resent" settlement, are defeated by
"intrepid settlers," and are then economically coerced into labour ("the lordly red man has a
soul above toil," so "the Salish squaws, driven to toil from babyhood" do the work instead). The
place is called "Squawlands" as a result. Two full paragraphs, told approvingly, whose entire
logic depends on the stereotype — not a word to swap. It's a total aside (never referenced again,
the place name used exactly once); Jake: "Cut it." Deleted both paragraphs and repointed the
following paragraph's opening so it doesn't dangle on "thought of it" with no antecedent. Full
context: HANDOFF §21b.

**A new verification pattern came out of this cut.** Reverse-diff (the standard "undo every edit
and confirm byte-identity with source") can't check a deletion — there's nothing to reverse it
from. Added a forward-diff check specifically for files with a deletion row: replay every edit
forward from a fresh copy of the source and assert byte-identity with what shipped. **Standing
rule now: any batch with a deletion needs both directions checked, not just one.**

**Left alone, same book:** the "Tacla Indians" subplot (ch. 26) — a crew of criminals gets
"wiped out" while prospecting, no particular sympathy from the narrator. No slur vocabulary, the
ethnonym used plainly, the Tacla never given a scene or voice of their own. Flagged for
awareness only — this is portrayal without a vocabulary hook to fix, a different bucket from the
Squawlands passage, which depends on demeaning language to make its point.

**Two other findings, worth reading together:**

- `chinkie(s)` ×3 — used by a neutral freight driver and separately a captured criminal, about
  the same mining crew. Fixed regardless of speaker (villain/hero rule: worst vocabulary comes
  out either way). Jake's framing here mattered: *"Something tells me that the fact they're
  Chinese matters here."* Unlike batch 20's `Chinaman`→`rich man` (where the ethnicity did zero
  narrative work), this book has an actual subplot — a mining claim, two named brothers, a body
  shipped home for burial. The ethnicity stays in the text. Only the slur goes.
- `Chinaman` ×9 and the ch. 18 title → the man's actual name. He's named in dialogue almost
  immediately after his first mention: **Li Hang**, brother of **Li Hung** ("the boss"). Every
  subsequent ethnonym-as-label reference became "Li Hang" / "Li Hang's coffin"; the one mention
  before the name is known stayed a plain "a dead Chinese man." Chapter title "The Dead
  Chinaman" → **"The Dead Man's Coffin"** (nav.xhtml and toc.ncx labels updated to match, ids
  and hrefs untouched).

**New calibration split worth naming:** "does the ethnicity do narrative work" (batch 20)
decides whether to drop or modernize a dated ethnonym. It's a separate question from "is this
slur-tier vocabulary," which always comes out regardless of how much narrative work the
ethnicity is doing. This book needed both calls made independently, in the same subplot.

## Verification

```
dominion: XML 37/37 | <p> 2307→2302 (-5, expect -5, the cut) | reverse-diff byte-identical
          on 11 files, 1 excluded for a deletion row (ch. 15)
          forward-diff (ch. 15 only): byte-identical to shipped
          OPF BYTE-IDENTICAL | nav/ncx skeleton IDENTICAL | residual 0/5 whole-book
          ch15-scoped residual 0/7 | ruled leaves 18/18 vs source
          (Indian/Indians deliberately excluded from the leaves list — the cut legitimately
          removes 2 of the book's 10 "Indians", inside the deleted passage; a source==shipped
          equality check on that word would be wrong by design here)
          note×1 CC0×1
```

Title-page note rewritten to name the cut scene and the retitle, not just "reworded" —
Crimson Sweater precedent (batch 3).

## Reverting anything

Every edit in `edits.py` is one string or one full-paragraph block; DD3a/DD3b (the cut) should
be reverted as a pair if reverted at all, same as the ch. 25 pirate rows in batch 20.

## Forward flags

- ⚠️ **Any batch with a deletion row needs BOTH reverse- and forward-diff in verify.py.** See
  above — reverse alone silently under-checks a deleted file.
- **Two-question split (ethnicity-does-work vs. slur-tier vocabulary) — apply both
  independently next time a book has this shape.** See HANDOFF §21b.
- Register flag on this book (25.9 mean sentence length) is Jake's scheduling call, not an
  editorial one.
