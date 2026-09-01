# The High School Left End — classroom edition

`h-irving-hancock-high-school-left-end_g-claudeCleaned.epub`

H. Irving Hancock, 1911. Project Gutenberg #12691, third of the four *High School Boys* novels
about Dick Prescott and his friends at Gridley High School. 45,964 words, 25 chapters.

Prepared for TypeThatBook. This file is safe to import; the OPF is untouched, so it will overwrite
cleanly rather than creating a second book.

---

## What this book is

Football season at Gridley High. The wealthy students refuse to play alongside the poor ones,
Dick Prescott breaks the boycott with a newspaper article, and the season is played out around a
missing-banker mystery, a courtroom scene, and a building fire. It is a book about **class**, and
it is unambiguously on the side of the boys without money.

**It is the cleanest period book of the eighteen prepared so far.** No racial slurs of any tier.
The five language changes below are the entire list.

## What changed — language (11 edits at 5 sites)

| Site | Change |
|---|---|
| Ch. XIII | `scalping Tottenville` → `trimming Tottenville` |
| Ch. XIV | `the school war-whoop` → `the school yell` (the book's own term for it) |
| Ch. XVII | `All was gay noise` → `All was merry noise` |
| Ch. XXIII | `yelling like so many Comanches` → `yelling like so many steam whistles` |
| Ch. XVI | `play welsher` → `play quitter` |
| six chapters | `ejaculated` ×6 → burst out / exclaimed / gasped / chuckled / cried / sputtered |

Nothing else in the story, characters, plot or dialect was altered.

## What changed — source text (101 edits + 1 deletion)

**This is the larger half of the work, and it is the part that matters for a typing program.**

The Gutenberg text was transcribed in 2004 and never proofread. It contains roughly a hundred
places where a real English word was substituted for the right one — invisible to a spellchecker,
because every one of them is spelled correctly:

- `directed Thief Coy` → `Chief Coy`
- `Prescott and Barren!` → `Prescott and Darrin!`
- `That football could not By through the air` → `could not fly through`
- `all the chatter stormed at once` → `stopped at once`
- `It's the feet that I'm fooled out of playing` → `the fact that`
- `young Prescott day senseless on the floor` → `lay senseless`
- `termed "the mockers"` → `the muckers`

Plus about forty punctuation repairs, mostly speeches that were never closed and question marks
printed as quotation marks.

**Two chapter titles were wrong.** Chapter XI read `DIES FOOTBALL TEACH REAL NERVE?` and Chapter
XII read `DICK, LILE CAESAR, REFUSES THE CROWN`. Both fixed. The table of contents at the front
was correct, which is presumably why nobody noticed for twenty years.

**A 107-word passage in Chapter II was printed twice.** Two paragraphs — Dick and Dave driving off
in the buggy, and Bradley's musing afterward — appear verbatim in immediate succession, differing
only in `tonight` vs `to-night`. The duplicate is deleted. Students would otherwise have typed it
a second time with no explanation.

### ⚠️ Four of the source edits are reconstructions

Marked `R01`–`R04` in the session record. In these four places the transcription dropped words
outright and the sentence cannot be repaired without supplying wording that is not in the file.
The most substantial is a lost speaker attribution in Chapter XII, restored as
`"Wadleigh," answered Dick promptly.` from context. **These are inventions, they are flagged, and
they are individually reversible** if a better scan of the 1911 printing ever turns up.

## Things to know before putting this in front of a class

Nothing here needed an edit, but you should not be surprised by any of it.

- **The protagonist is named Dick, 420 times.** Unavoidable — it is his name, the series is
  called *Dick & Co.*, and it is in the title of half the chapters.
- **There is a suicide thread in Chapters II–VI.** A banker vanishes leaving his coat by a river,
  and a sixteen-year-old and a detective reason through it out loud as a possible insurance fraud.
  It resolves — he had a breakdown and was taken in by vagrants — but the discussion is explicit
  and runs for several chapters.
- **Football deaths are the book's actual argument.** Chapter XI stages a debate about whether the
  sport is worth the casualties, and a character states that more than forty young men were killed
  playing football that year. This is historically accurate for the period.
- **The class conflict is blunt.** Wealthy students call the poorer ones "muckers" throughout, 35
  times. The book defines the word sympathetically in Chapter VIII and the snobs lose completely.
- **Herr Schimmelpodt speaks in heavy stage-German** across several chapters. He is written with
  real affection and dignity — generous, shrewd, and the moral centre of two scenes — so his
  accent was kept as a fact about him rather than sanded off.

## Verification

Every edit was applied with an asserted match count of exactly one, then checked five ways:

| Check | Result |
|---|---|
| Residual scan for flagged terms | 0 |
| XML well-formedness, all files | pass |
| `<p>` parity | 1902 → 1901 (−2 duplicated, +1 title note) — as expected |
| OPF / NCX / nav byte-identical | pass |
| Reverse-diff (undo every edit, compare to original) | byte-identical |

The EPUB is repackaged with `mimetype` stored uncompressed as the first entry, and the manifest
matches the original file for file.

## Reproducing or reversing this

The full edit table — all 113 entries with IDs, exact old and new strings, and target files — is
in the batch 13 section of `HANDOFF-bookclean.md`, along with the reasoning for every judgment
call. Any individual edit can be reversed by replacing its `new` string with its `old` string
once in the named file.

## The rest of the series

*The High School Freshmen* (1910), *The High School Pitcher* (1910) and *The High School Captain
of the Team* (1911) complete the arc, and there are two vacation books with the same cast. All are
on Project Gutenberg. **Expect the same profile: almost no objectionable language, and a source
text that needs more repair than the language does.** If the PG release date is 2004–2006, budget
for the corruption pass first.
