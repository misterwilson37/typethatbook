# Jeeves Stories — Classroom Edition

**File:** `p-g-wodehouse_jeeves-stories-claudeCleaned.epub`
**Source:** Standard Ebooks, *Jeeves Stories* by P. G. Wodehouse (26 stories, 1915–1927)
**Prepared:** 2026-08-07 · batch 11 · instance *Besley*
**Changes:** 53 edits across 22 of 31 spine files · 170,262 words

---

## What this is

A public-domain text prepared for use in a **typing class**. A small number of period racial
slurs and dated terms have been reworded so a sixth grader can type the book without reading
something ugly aloud in front of the room. This is not an annotated or censored edition for
literary study — it is a rewrite for one specific job.

Wodehouse's story, characters, plot, dialogue, jokes, and dialect are otherwise **unchanged**.
Nothing was cut. No scene was reframed. Chapter and story structure are untouched.

A one-paragraph note recording this appears on the title page.

---

## What changed

**Six racial edits.** In 170,000 words, that is all there was.

| Story | What changed |
|---|---|
| Extricating Young Gussie | A slur inside a description of a 1916 song lyric → `raccoons` (chosen to keep the line's internal rhyme, which is the joke) |
| Extricating Young Gussie | A pianist described by an antisemitic feature → described by a green eyeshade instead |
| The Aunt and the Sluggard | A racial adjective removed from a description of a banjo orchestra |
| Jeeves and the Chump Cyril | A one-scene lift attendant: race marker removed and his three lines respelled into ordinary English |

**Forty-seven house-standard edits**, all following the same rules used on every other book in
this collection:

- `ass` / `asses` ×29 → varied replacements drawn from Wodehouse's own vocabulary
  (chump, fathead, mug, fish, juggins, blister, prune, goop, mutt, cuckoo) so the book still
  sounds like itself. `chump` already appears 35 times in the original.
- `gay` ×4 → giddy / glittering / merry / riotous
- `ejaculated` ×1 → yelped
- `cocked`/`cocking an eye` ×4 → turned / fixing / casting / raised an eyebrow
- `damn` ×5 → `dash` forms, which is Wodehouse's own minced oath (he uses `dashed` 169 times)
- Three one-off dated phrases: `Oriental luxury` → `palatial`, `wigwam`/`big chief` →
  `headquarters`/`the great man`, `deaf-and-dumb language` → `sign language`

---

## What was deliberately left alone

- **`gaiety`, `gaily`, and the Gaiety Theatre** — the letters `g-a-y` never appear on screen.
- **`blighter` ×69 and `dashed` ×169** — this is the book's voice, not profanity.
- **`idiot`, `imbecile`, `half-witted`** — ordinary period and playground register.
- **`hell`, `devil`, `God`** — furniture, not swearing.
- **Abe Riesbitter**, the vaudeville agent. He keeps his promises, judges an act fairly, and
  names an honest price. Nothing marks him but a surname, and surnames stay.
- **Comrade Bingo's socialist meeting.** Wodehouse mocks the revolutionaries and the idle rich
  in equal measure; there is nothing here a student can't read.
- **`cocktail` ×4** — a word kids see on menus, and Wodehouse needs it.

---

## What this edition does *not* contain

*Thank You, Jeeves* (1934) is the Wodehouse novel built around a blackface plot. It is **not**
in this collection, is **not** US public domain until 2030, and should not be added.

There is **no minstrelsy anywhere in this book.** It was expected and it isn't there.

---

## Verification run before packaging

| Check | Result |
|---|---|
| Every edit applied with an asserted match count | 53 planned / 53 applied, 0 misses |
| Residual scan for the original terms | 0 |
| XML well-formedness | 35 files, 0 failures |
| `<p>` element parity | 6691 → 6692 (+1 = the title-page note) |
| `content.opf`, `toc.xhtml`, `toc.ncx` | byte-identical to the original |
| Reverse-diff (undo every edit, compare to pristine) | byte-identical on all 22 touched files |
| EPUB structure | `mimetype` stored first and uncompressed |

Metadata (`dc:title`, `dc:creator`) was not touched, so this file **overwrites** the existing
book on import rather than creating a duplicate, and student chapter pointers survive.

---

## If you want something reverted

Every edit is listed individually in `HANDOFF-bookclean.md` under
**RESULTS → Jeeves Stories**, with the original text beside the replacement. Any single one can
be undone with a find-and-replace.

Two are worth knowing about specifically:

1. **`raccoons`** (Extricating Young Gussie). Dropping the noun entirely —
   `being all about spooning in June under the moon` — also works and keeps the rhyme.
2. **The lift attendant** (Jeeves and the Chump Cyril) is fully unmarked. The alternative was
   to keep the fact of his race once, modernised, and unmark the repetitions. That trade-off is
   discussed in the handoff.
