# HANDOFF — EPUB normalisation, instance "Clarendon", 2026-08-08

<!-- Companion to README-epub-normalisation.md. The README says what the files
     are. This says what I learned, what I got wrong, and what is still open. -->

**Instance:** **Clarendon**. Clarendon (1845) was the first typeface registered
under Britain's Ornamental Designs Act, and it was cut not as a text face but as
a *companion* — a bolder weight made to sit beside an existing roman and mark
what mattered in it. It did not set the book; it made the book's own structure
legible. That is this session exactly: not one word of these twelve books is
mine, and the whole job was making the parts they already contained findable by
`admin.js`. Predecessors on the bookclean side: Caslon, Baskerville, Bulmer,
Figgins, Thorne, Thorowgood, Besley, Reed, Fox, Miller, Blake. On the app side
(typewriters, a separate lineage): Underwood, Dvorak, Blick, Oliver, Mignon,
Noiseless.

---

## §1. The brief, and the correction that reshaped it

Jake's opening ask was "reformat these so admin.js pulls in the metadata and
named chapters." I began building Standard-Ebooks-style `imprint.xhtml` and
`colophon.xhtml` pages — **composing prose that did not exist in the sources.**

Jake stopped me: *"I see you're creating stuff whole cloth to match the ebook
standard. While that's nice, I don't need that."* What he wanted was already
written, by Gutenberg and by Global Grey: the header block, the printed title
page, the licence. The job was to **find and preserve**, not to compose.

⚠️ **This is the single most important thing in this document.** The instinct to
produce a tidy publishing artefact is strong and it was wrong. These are
provenance documents. Inventing a colophon that reads like Standard Ebooks'
would have put words in Gutenberg's mouth on a public classroom site.

The one place I still write rather than transcribe is the `Copyright status:`
line — Gutenberg states the status but never the *basis*, and Jake explicitly
asked for the basis. It is one sentence, it is flagged here, and Jake approved
the shape on the reference build before I made eleven more.

## §2. What was actually wrong with the twelve

Not what the brief implied. **No text had been lost** — word-count diffs against
the raws came out at boilerplate-only deltas. The damage was:

- **All 12**: `dc:rights` and `dc:source` missed the dropdown option values by a
  few characters, so every book landed in "Custom…". Twelve books, twelve
  slightly different strings on twelve library cards.
- **8 of 12**: the previous pass had **deleted the Gutenberg header entirely**
  and **truncated the licence mid-section-1.C**. That is the real loss, and it
  is invisible unless you go looking for it.
- **4 of 12**: structurally raw. Front matter was becoming body chapters 1–2
  (Oz, Toby Tyler), chapter names were "Chapter I"…"Chapter XXV" with the real
  titles sitting unread in `<h5>` elements (Left End), and Daddy Long-Legs was
  99 Global Grey `index_split_NNN` files.

## §3. Bugs I wrote, and what caught each one

Recorded because each was caught by a test rather than by reading, and that is
the transferable part.

1. **Self-closing `<div/>` swallowed Rebecca's `<h1>`.** My block extractor
   paired `<div/>` with a *later* `</div>`, consuming the title, and then the
   leaf filter discarded the whole span as a container. Rebecca's title page
   came back with `by / Kate Douglas Wiggin` and no title. Fixed with a `(?<!/)`
   guard. **Caught by eyeballing output that was obviously short.**
2. **Entity-blind string replacement silently did nothing.** The chapter titles
   store apostrophes as `&#x27;`, so replacing the *decoded* `Mother Wit'S
   Discovery` matched nothing and the fix quietly no-opped. **Caught by an
   assert I had put on the replacement.** Without that assert this ships looking
   fine and the defect survives another round. Assert that your edit landed.
3. **Title-caser capitalised after quotes wrongly** — `"THE CATTLE CAR"` →
   `"the Cattle Car"`. **Caught by the unit test.**
4. **Roman-lookalike blocklist ate real ordinals.** `VI.` and `XI` are on the
   blocklist (they spell English words), so `Chapter VI The Cowardly Lion` kept
   its ordinal. Fixed: a numeral is unambiguous when punctuation **or** a
   structural word ("Chapter", "Part") precedes it. **Caught by reading the
   generated Oz chapter list — two of twenty-four were wrong.**
5. **Fixing (4) regressed "I AM BORN" to "Am Born"** — the David Copperfield
   trap `admin.js` documents and I had failed to port. **Caught by adding it to
   the test set the moment I touched the function.**

⚠️ **The pattern across 2–5: every one of these is a title-handling edge case,
and title handling is where the *previous* round shipped its defects too
(`Billy'S Story`). This code is a magnet for this class of bug. Do not touch
`titlecase.py` without running its `__main__` test set.**

## §4. Decisions Jake made, so don't relitigate them

- **Daddy Long-Legs = 95 chapters**, matching the book's own contents list,
  duplicate datelines and all ("Sunday" ×5, "Saturday" ×5). He was explicit:
  *"I want it to match the table of contents."* The contents list has exactly
  95 entries and maps 1:1 onto the letters; this was verified, not assumed.
  I corrected three mechanical Global Grey defects in those headings only
  (`Lock Willow,12th July` → missing space ×2, `Camp Mcbride` → `McBride`).
- **Genre stays as the subjects honestly guess it.** Jake will set the six
  sports books by hand. Do not massage `dc:subject` to steer the guess.
- **Tom Sawyer Abroad's title-page note now matches the other eleven.** Its old
  note said only "lightly modernised for readability", which almost certainly
  understated what the cleaning session did to a book with Jim in it.

## §5. Still open

- **`SUBJECT_TO_GENRE` has no "Sports"** — six of these twelve are sports books.
  Adding it is an `admin.js` change and was out of scope; Jake is filling them
  in manually for now.
- **Origin URL is never autofilled.** `autofillFromEpub()` fills title, id,
  author, genre, licence, source and archive URL, but not `active-book-origin`,
  even though every one of these books now carries its canonical Gutenberg URL
  in `dc:identifier`. A three-line change in `admin.js` would fill it. Not made,
  because Jake asked for EPUB fixes this round.
- **Central High #37019 has no printed title page anywhere in its source.**
  Its title page is the one page in the twelve not transcribed from the book.
  If a better scan turns up, that page should be redone from it.

## §6. Tooling written this session

All in the working directory, none of it shipped into the repo:

| file | does |
|---|---|
| `ttbepub.py` | EPUB writer — OPF, nav, NCX, container, correct stored `mimetype` |
| `pghead.py` | pulls the PG header block and printed title page out of a Gutenberg EPUB |
| `extract_gut.py` | splits a Gutenberg EPUB into chapters **using its own NCX anchors** |
| `titlecase.py` | title normalisation + its test set. Read §3 before editing |
| `lic.py` | lifts the full PG licence from an intact copy (it is byte-identical boilerplate across books; only the END line differs) |
| `config.py` | per-book transcribed title pages and metadata |
| `build_se.py` / `build_gut.py` / `build_dll.py` | the three build paths |
| `aboutcheck.mjs` | **worth keeping.** Lifts `detectAbout`, `classifyDocument`, `guessGenre` and `slugifyBookId` out of `admin.js` and reports, per book, whether the dropdowns will fill and whether each credit page is flagged. This is what proved the work rather than assuming it. |

⚠️ **`aboutcheck.mjs` belongs in the repo next to the other harnesses.** It is
the only check that tests the *metadata* path; `chapter-harness.mjs` and
`real-epub-harness.mjs` both test structure and neither would have caught the
"Custom…" defect that affected all twelve books.

## §7. Verification standard used

Nothing here was reported on the strength of reading code. Every claim came from
running one of the repo's harnesses or a script that lifts the real `admin.js`
functions. Final state: 12/12 books, 0 paragraphs lost, 0 XML errors, 12/12
covers PASS, 12/12 metadata filling both dropdowns, 36/36 credit pages flagged,
and the four rebuilt books matching their inputs exactly on both word and
paragraph count.
