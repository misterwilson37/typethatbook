# Jane Eyre — Classroom Edition

**File:** `charlotte-bronte_jane-eyre-claudeCleaned.epub`
**Source:** Standard Ebooks, *Jane Eyre: An Autobiography* by Charlotte Brontë (1847)
**Prepared:** 2026-08-07 · batch 12 · instance *Besley*
**Changes:** 47 edits across 24 of 46 spine files · 186,958 words

---

## What this is

A public-domain text prepared for a **typing class**. A small number of period racial slurs and
dated terms have been reworded so a student can type the book without reading something ugly
aloud in front of the room.

Brontë's story, characters, plot, dialogue, and dialect are otherwise **unchanged**. Nothing was
cut. No scene was reframed. A one-paragraph note recording this appears on the title page.

---

## Read this part before assigning the book

**The most serious content in *Jane Eyre* was deliberately left in place, and you should know
that going in.**

Bertha Mason — Rochester's first wife, the madwoman in the attic — is a Creole woman from
Jamaica who is described in animal terms: "the clothed hyena," "wolfish cries," "that fearful
hag." Rochester attributes her condition to inherited West Indian family taint.

Nothing was edited here, for three reasons:

1. **There is no slur to remove.** "Creole" is the accurate period term for a person of European
   descent born in the West Indies, and one of its three uses is inside the marriage certificate
   read aloud in Chapter 26. Removing it would make her less visible, not better treated.
2. **It is the plot.** The madwoman in the attic is the entire third act of the novel.
3. **Rochester is the speaker for nearly all of it, and Brontë convicts him for it.** He calls
   himself a villain in the same speech. Jane walks out over it and does not come back until he
   is ruined.

**Leaving it does not make the book unproblematic.** The animal imagery attached to a West Indian
woman is exactly what Jean Rhys's *Wide Sargasso Sea* was written to answer, and an observant
student may notice. This is a book to assign with eyes open, not a book that has been made safe.

---

## What changed

**Eleven racial or dated-term edits:**

| Chapter | What changed |
|---|---|
| 3, 9, 18, 19 | The Chapter 18–19 fortune-teller plot. Twelve uses of a dated word for Romani people, replaced three different ways depending on what each one meant: `Romany` where actual Romani people are described, `fortune-teller`/`old woman` where Rochester's *disguise* is meant (Brontë's own words, already in the chapter), and `straw hat` for a bonnet style |
| 21 | An archaic word meaning *stingy* that is unrelated to any slur but unusable read aloud → `miser` |
| 24 | Jane compares herself to an antisemitic stereotype → `moneylender` |
| 6 | Helen Burns contrasting "heathens and savage tribes" with "Christians and civilised nations" → rephrased. Her argument survives word for word |
| 34 | St. John on India: "savage tribes" → "strange peoples" |
| 8, 27 | Two similes using Native Americans as a stereotype ("silent as an Indian"; "the Indian in his canoe") → "silent as a statue"; "the boatman" |
| 16 | "the oriental eye" describing Blanche Ingram → "the dark eye" |
| 27 | One word meaning *prostitute*, used as a comparison → `fishwife` |

**Thirty-six house-standard edits:** `gay` ×17 and `ejaculated` ×11 and its relatives, each
replaced with a varied set of period-appropriate words rather than one flat substitute.

---

## Deliberately left alone

- **Chapter 18's charades tableau** — Rochester in a turban. Read in full; it's a *Biblical*
  scene (Eliezer and Rebecca at the well, which is the charade word: Bride-well → Bridewell),
  not a minstrel one.
- **Chapter 7, Brocklehurst on "Brahma" and "Juggernaut."** He is the book's hypocrite-villain
  and Brontë is skewering him.
- **Chapter 24's "seraglio" dialogue.** Rochester makes an Orientalist joke; Jane rebukes him and
  turns it into a speech about preaching liberty to the enslaved. Brontë built the correction
  into the scene.
- **`bastard` ×2** — both refer to actual illegitimate children (Rochester's rumoured half-sister,
  and Adèle), not used as a generic insult.
- **`blind` ×31 and `crippled` ×3** — Rochester's injuries. Precise and plot-critical.
- **One song lyric in Chapter 3** ("In the days when we went gipsying") — a real 1830s song, set
  as verse, where the word means *picnicking outdoors*.
- **`Moor` and `moors` ×40** — Yorkshire landscape.

---

## Verification run before packaging

| Check | Result |
|---|---|
| Every edit applied with an asserted match count | 47 planned / 47 applied, 0 misses |
| Residual scan | 0, apart from the one deliberate song lyric |
| XML well-formedness | 49 files, 0 failures |
| `<p>` element parity | 4109 → 4110 (+1 = the title-page note) |
| `content.opf`, `toc.xhtml`, `toc.ncx` | byte-identical to the original |
| Reverse-diff (undo every edit, compare to pristine) | byte-identical on all 24 touched files |
| EPUB structure | `mimetype` stored first and uncompressed |

Metadata was not touched, so this file **overwrites** the existing book on import rather than
creating a duplicate, and student chapter pointers survive.

---

## If you want something reverted

Every edit is listed individually in `HANDOFF-bookclean.md` under **RESULTS → Jane Eyre**, with
the original text beside the replacement. Any one can be undone with a find-and-replace.
