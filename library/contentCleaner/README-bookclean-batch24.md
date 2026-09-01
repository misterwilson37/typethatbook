# Batch 24 — README

Three books evaluated, **two shipped, one declined.** Plus a measurement bug that means I owe
you a correction on something I told you last round.

## Deliverables

| File | Result |
|---|---|
| `l-frank-baum-oz03-ozma-of-oz-claudeCleaned.epub` | 2 edits — cleanest book in the corpus |
| `george-macdonald_the-princess-and-the-goblin-claudeCleaned.epub` | 17 edits, 14 of them one character rename |
| `bookclean-kit-batch24.tar.gz` | 13 tools, both docs, `pack.sh` |
| `HANDOFF-bookclean.md` | master handoff, batch 24 merged in (§24a–24f) **+ a new ROAD MAP section** |

**Declined:** *The Wood Beyond the World.* First decline on register in the corpus.

---

## ⚠️ A correction I owe you

Last round I told you *"Jekyll's 24.1 is the second-longest mean sentence in the corpus."*
**That number was wrong, and so is every mean-sentence figure this project has ever published.**

`measure.py` split sentences only on `.!?` — and chapter titles carry no terminal punctuation,
so every heading welded onto the paragraph beneath it and counted as one sentence. The Wood's
"longest sentence" was 320 words and started with a chapter title.

```
Ozma of Oz                 24.2  ->  17.6
The Wood Beyond the World  42.1  ->  30.1
```

The inflation isn't uniform — it scales with how many chapters a book has, so it corrupted
*rankings* too, not just values. Since I can't re-measure books that aren't on disk, I've
**withdrawn** the stale figures rather than quietly adjusting the constants to match the new
code: Black Arrow 21.3, Dominion 25.9, Jekyll 24.1, Ranch 17.7, Big Horn 19.1, North Wind
19.8 are commented out with their old values kept as a record. **Archaic density was never
affected**, which is why the Wood decline still stands on measurement.

---

## Ozma of Oz — 2 edits

`gay ribbons` → `bright ribbons`, and person-referring `Oriental` → `tip-tilted` in the list
of nose shapes on Langwidere's heads. That's the whole book. Archaic 1.5/1,000, mean sentence
17.6.

Everything else was a false positive: `queer` ×12 is Baum's word for *strange*, all seven
`colored` are "rock-colored" Nomes, both `savage` are "savage beast", `cannibal` is Billina
indignantly denying she is one, and the nine `slave` are the Nome King's enslavement of the
royal family of Ev — plot, and the book is squarely against it.

**One typing note, not a language one:** Tik-Tok speaks in syllable-hyphenated English
throughout — `ma-chin-er-y`, `to-geth-er`, `Ve-ry`. Nothing to fix, but a student typing his
dialogue is typing mid-word hyphens constantly.

## The Princess and the Goblin — 17 edits

Three ordinary rows: `gipsy` → `Romany`; `cock` → `bird`; and the narrator's *"rather vulgar
little girls"* → *"had never been taught better"*.

On `cock`: I used `bird` rather than `rooster` because MacDonald is Scottish and `rooster` is
an Americanism — and `cockerel`, the British word, keeps the substring you ruled out. Worth
remembering as a habit: check the author's nationality before picking a substitute.

**The other 14 are the Harelip rename**, now `Grumble` throughout, with the body-part line
changed to *"an ugly noise with his mouth"*. The text handed the name over — *"Harelip
growled"* reads as *"Grumble growled"* without a seam.

⚠️ **Two checks earned their keep here.** The introduced-word check reported `Grumble=14`
against my 13 name rows; I chased it rather than waving at it — the fourteenth is in my own
title-page note, and there is **no `grumble` verb anywhere in MacDonald's text**, so the
rename introduces no collision. And six rows **failed the first dry run** because I wrote
chapter numbers from gapcheck's summary line instead of reading them off the files. gapcheck
was right; I transcribed it wrong.

**The goblins themselves needed no edits**, and I checked specifically because `dwarf` ×32 was
part of why I recommended tossing the Wood. Morris's Dwarf is a servant caste with no
interiority, described by skin colour. MacDonald's goblins are an antagonist kingdom with a
court, politics and comedy. That distinction is now written down as a test.

## ⚠️ gapcheck found the biggest item in both books it ran on

Two batches running now:

| Book | `scan.py` said | `gapcheck.py` found |
|---|---|---|
| The Wood Beyond the World | RELIGIOUS_ETHNIC: 1 | **`Mahound`** — the medieval pejorative for Muhammad, as a devil's name |
| The Princess and the Goblin | 36 tokens total | **`harelip` ×14** — a named character |

Neither term is in any `scan.py` block, and `harelip` was the *entire* language story of the
Goblin. The disability block especially is worth reading every time — its terms are ordinary
English words (`natural`, `wanting`, `afflicted`, `harelip`), which is exactly why the main
scanner can't carry them.

## ⚠️ A near-miss in packaging

My round-trip re-scan unzipped its input with `unzip .../george-macdonald*`. **That glob
matched two files** — batch 23's *North Wind* is still in the outputs directory. `unzip`
errored, which is the only reason I caught it. Had it silently matched the wrong book, the
re-scan would have come back clean and I'd have reported the Goblin verified on evidence from
a different book.

Two rules now in the handoff: round-trip re-scans use **exact filenames, never globs**, and
**assert the book's identity** after unzipping. This batch used `Billina=143` for Ozma and
`Curdie=271` for the Goblin. A re-scan that can't prove which book it read isn't a
verification.

## Verification

```
ozma:    XML 21/21 | <p> parity +0 (DERIVED) | reverse-diff byte-identical on 1 file
         OPF BYTE-IDENTICAL | toc.xhtml + toc.ncx IDENTICAL | residual 0/2 | leaves 5/5
         round-trip (exact filename, identity Billina=143): Tier1 26, all FPs

goblin:  XML 31/31 | <p> parity +0 (DERIVED) | reverse-diff byte-identical on 7 files
         OPF BYTE-IDENTICAL | toc.xhtml + toc.ncx IDENTICAL | residual 0/5 | leaves 5/5
         round-trip (exact filename, identity Curdie=271): harelip 0; Tier1 9 = brave x4,
         jewels x2, native x1, and your ruled chink x2

quality.py on both packaged files: DEFECTS none.
All three selftests cite this batch's books, so pack.sh passed its gate honestly.
```

## One housekeeping item

⚠️ **The typeface-founder name well is dry.** Blake was the last British alternate. Sixteen
names are spent plus four on the transplant side, and Wilson, Bell and Austin are barred. The
next instance needs a new series — papermakers (Whatman, Fabriano, Arches, Canson) or binders
(Zaehnsdorf, Riviere, Sangorski) both work. Noted at the top of the handoff.

---

# Road map — answering your question

Full version is now a standing **ROAD MAP** section in the handoff. Short version:

**Captains Courageous alone.** Expect a full character read, not a vocabulary pass: a Black
cook from Cape Breton with dialect and second sight, Portuguese Manuel, and heavy nautical
jargon on top. Kipling, so Tier 1 is likely too.

**Phantom of the Opera alone**, and it needs a decision from you *before* I touch language.
Two whole-book problems: **the Persian** is a major character named by his ethnicity
throughout, and **Erik's disfigurement is the engine of the plot** — the horror language
around his face can't be edited away without dismantling the book, so that's a staging call
like Jekyll's, not a table of rows. Also check which translation; translator choices aren't
Leroux's.

**Prince and the Pauper + Don Quixote together — confirmation only.** This is the one place
two books in a session is right, because a confirmation pass is read-only and cheap. I've
written the procedure into the handoff as a named thing, because it is *not* a cleaning pass —
re-cleaning an already-clean book is how the `Cock Robin` over-fix happened. It answers one
question: did the previous pass land, and is the file sound? ⚠️ **Send both the raw and the
deployed copy if you have them** — a confirmation pass on the cleaned file alone can't tell an
edit from an original reading. And the fingerprint result is a hypothesis, not a finding:
Ozma showed `rooster` ×8 this batch and had never been edited, because Billina is a hen.

**Then Quixote proper, split.** Your assumption is right and if anything understated — roughly
400,000+ words in translation, about four times the largest book handled in one session here.
Part I and Part II at minimum, possibly by volume, with a handoff entry per part. The real
work won't be Tier 1: it's Moors, Moriscos and Cide Hamete Benengeli as the book's own
narrative frame, which is structural rather than decorative, plus the Morisco expulsion
episode in Part II. **Identify the translator first** — Ormsby, Jarvis, Shelton and Motteux
differ enormously, and the staging numbers depend entirely on which one you have. And measure
the whole dump rather than a sample; a book that long can hide a very hard stretch inside an
easy average.
