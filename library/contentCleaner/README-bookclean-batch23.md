# Batch 23 — README

Two Standard Ebooks. **Jekyll needs a decision from you that isn't about language** — see
the last section.

## Deliverables

| File | Result |
|---|---|
| `robert-louis-stevenson_the-strange-case-of-dr-jekyll-and-mr-hyde-claudeCleaned.epub` | 4 edits |
| `george-macdonald_at-the-back-of-the-north-wind-claudeCleaned.epub` | 14 edits, 4 of them re-rhymed verse |
| `bookclean-kit-batch23.tar.gz` | 13 tools, both docs, `pack.sh` |
| `HANDOFF-bookclean.md` | master handoff, batch 23 merged in (§23a–23e) |

---

## Your three rulings, applied

**`chink` stays.** All three North Wind sites cleared your condition, and I verified it
rather than assuming: a twenty-term Asian-reference pattern returns **zero hits anywhere in
either book**, let alone within a few paragraphs. `verify.py` now asserts the trio is
**present**, so a future instance who "helpfully" fixes it fails the battery instead of
quietly undoing your ruling.

I also flagged the consequence in the handoff: **the old `chink`-meaning-money edit is now a
revert candidate**, sitting on the list beside `Cock Robin`. It was cut on exactly the
reasoning you've just declined to extend.

**`cock` is gone — all twelve sites**, and your reason is now the rule rather than a note.
I had recommended leave-whole and was reasoning about whether the word was *defensible*.
"Thirteen-year-olds who lose it at page 69" is the operative standard, and a typing program
is the slowest, most conspicuous possible way to meet a word — letter by letter, under your
own fingers. That's in the handoff as **the standard is the room, not the etymology**, and
it also retires my "how far into the book" question, which was the wrong question.

To answer it anyway: chapter 20 of 38, so a bit past halfway. Didn't matter.

And you're right that cockchafer is a preposterously funny name for an animal. It was the
easiest one to fix, because Victorian English already called the same beetle a **maychafer**.

---

## The verse — the first time this project has composed rather than substituted

Four of the ten `cock` rows couldn't be word swaps. Every rhyme and syllable count is
preserved; the arithmetic is recorded in `edits.py` so it's checkable rather than a matter of
trusting my ear.

**The couplet.** The joke *is* the cock-/hen- pairing, so it had to be rebuilt on a different
base:

```
was  Cockchafers, henchafers, cockioli-birds,
     Cockroaches, henroaches, cuckoos in herds.

now  Maychafers, haychafers, tickolori-birds,
     Black-beetles, hen-beetles, cuckoos in herds.
```

**`maychafer` and `black-beetle` are both genuine Victorian English names for those exact two
insects**, so the two real creatures survive under real names and only the nonsense twin is
re-coined. 11 and 10 syllables in, 11 and 10 out, rhyme untouched.

**The weathercock**, three lines. `cock` → `bird`: same syllable count, a gilt weathercock
*is* a gold bird, and a bird can "fly down from the church" where a vane can't. Rhymes
desire/spire, church/lurch, churchwarden/garden all intact.

**`high cockolorum`** slant-rhymes with `before him`, so the replacement needed both four
syllables and the `-orum` ending → **`high hurralorum`**, coined from "hurrah" in MacDonald's
own manner. That poem already contains henchafers, flutterbies, harkydarks and rere-mice, so
he'd started it.

**⚠️ The Hogg line — flagging this plainly because you should be able to say so out loud.**
`where the cock never crew` rhymes with `blew`, so it became **`where the lark never flew`**.
That's a line of James Hogg's *Kilmeny* (1813) quoted inside MacDonald, and I changed it on
your say-so. Rewriting a line attributed to a named author is the one edit here a reader
could fairly call falsification, so it's disclosed in the title-page note as well as here.

**⚠️ One more you haven't seen: `Cockspur Street` ×2 is a real London street**, between Pall
Mall and Trafalgar Square. Renaming it would falsify geography, so it became **Charing
Cross** — the adjacent real landmark at the same end of the same cab stand, so the cab route
still works on a map. The introduced-word check then reported `Charing Cross=5`, meaning
**three were already in the book**. The replacement is MacDonald's own geography, not mine.

---

## ⚠️ A tool bug your queue was going to hit every single round

`quality.py` reported **155 defects in Jekyll and 311 in North Wind**. I checked the raw
bytes before believing any of them. **The files contain zero literal double spaces.** The
tool replaced *every* tag with a space, manufacturing the exact defects it hunts for:

```
<abbr>Mr.</abbr>&nbsp;Utterson        →  "Mr.  Utterson"     fake double-space
coming, <i lang="la">pede claudo</i>, →  "pede claudo ,"     fake space-before-comma
```

Gutenberg conversions have sparse markup, so this stayed quiet for twenty books. Standard
Ebooks marks up abbreviations, foreign phrases and emphasis throughout, so it fires
constantly. Fixed: block tags become a newline, inline tags become nothing. **Both books now
report `DEFECTS: none`**, and there's a regression harness.

Since you said several more of these are queued, I also wrote a **Standard Ebooks source
profile** into `TOOLKIT.md` — the paths differ (`epub/text/` not `OEBPS/`), the nav file is
`toc.xhtml` not `nav.xhtml`, and the title page needs *augmenting* rather than rebuilding,
which is the exact inverse of last batch's rule. Whoever takes the next round, me or someone
else, will hit all four.

---

## Verification

```
jekyll:    XML 15/15 | <p> 343->343 (+0, expect +0, DERIVED) | reverse-diff byte-identical
           on 4 files | OPF BYTE-IDENTICAL | toc.xhtml + toc.ncx IDENTICAL
           residual 0/4 | ruled leaves 5/5 | note x1 ourCC0 x1 SE-uncopyright x1

northwind: XML 45/45 | <p> 2391->2391 (+0, expect +0, DERIVED) | reverse-diff
           byte-identical on 9 files | OPF BYTE-IDENTICAL | toc.xhtml + toc.ncx IDENTICAL
           residual 0/13 (every cock* form) | ruled leaves 8/8

round-trip re-scan of both packaged EPUBs: every remaining Tier 1 token is a confirmed
false positive (brave x14 adjectival, jewel, savage laugh) or one of your ruled leaves
(chink x2, chinking, gaiety x3, gaily, queer x7 — all non-sexual senses).
quality.py on both packaged files: DEFECTS none.
```

Our CC0 is narrower on these two: Standard Ebooks already dedicates its own transcription
work, so ours claims only our edits, and `verify.py` asserts SE's dedication survives
untouched in its own file.

---

## ⚠️ Jekyll needs a content decision, and it isn't a language one

Four edits. `gay` → `bright`, `ass` → `fool`, `damnable` → `detestable`, and `faggots` →
`staves` (a bundle of bound sticks, so the binding image survives).

I left the two `damned` — both are the theological sense inside a confession explicitly about
damnation, and the always-fix list is aimed at the expletive. Say the word if you'd rather
they go; it's a two-minute change.

**What the language pass can't help you with:** Hyde tramples a child in chapter 1, beats an
elderly MP to death in chapter 4 with the narrator inside his pleasure — "tasting delight
from every blow" — and the book ends in suicide. No slurs, nothing this pipeline touches.

And it's the **second-hardest sentence load in the corpus at 24.1 words**, above *The Black
Arrow*, in a book of only 26,506 words. Short doesn't mean easy — worth remembering that word
count isn't a staging measure.

My read: 8th grade at the earliest, and a book you choose deliberately rather than let a
6th-grader stumble into on a rotation. But that's your call and your building, not mine.

## Other open items

- **North Wind ch18 "The Drunken Cabman"** — a drunk father striking the mother, with `devil`
  ×8 and `drunken` ×10 clustered there. Left whole: it's the moral centre of the book and
  MacDonald handles it with real tenderness. Still the passage a parent would ask about.
- **`mammy` ×6 fired the MINSTRELSY block and is a total false positive** — it's a London
  cabman's baby saying "baby's mammy" for *mother*. That block will fire on every British
  text you send.
- **`cripple Jim` ×2 stays** — a street child naming the friend she gives her hospital treat
  to. The row I'd most expect you to overrule.
- All three selftests now cite the current batch's books, so `pack.sh` passed its gate
  honestly rather than needing `--no-selftest`.
