# TypeThatBook EPUB normalisation — thirteen books

**Instance:** Clarendon · **Date:** 2026-08-08 · **Input:** thirteen
`-claudeCleaned.epub` files · **Output:** same twelve filenames, restructured.

## What these files are for

`admin.js` reads an EPUB and fills the book form from it. Before this pass, all
twelve fought it: none of them filled the Source or Licence dropdowns, four had
lost or mangled their chapter names, and eight had had their Project Gutenberg
header deleted and their licence truncated mid-sentence.

## The shape every book now has

```
mimetype                    (stored, uncompressed, first entry)
META-INF/container.xml
OEBPS/content.opf
OEBPS/nav.xhtml             EPUB3 navigation
OEBPS/toc.ncx               EPUB2 navigation (admin.js falls back to this)
OEBPS/cover.{png,jpg,jpeg}
OEBPS/titlepage.xhtml       frontmatter titlepage      ← credits
OEBPS/gutenberg.xhtml       frontmatter imprint        ← credits
OEBPS/chapter-01.xhtml …    bodymatter chapter
OEBPS/gutenberg-license.xhtml  backmatter copyright-page  ← credits
```

Daddy Long-Legs is Global Grey, not Gutenberg, so its two source pages are
`globalgrey.xhtml` and `copyright.xhtml`. The Wizard of Oz additionally keeps
`introduction.xhtml` — Baum's own 1900 introduction — as front matter. It is
real prose, so it is *not* flagged as credits; it is typeable if you want it.

## The three credit pages

All three trip `admin.js`'s `ABOUT_FILE` / `ABOUT_EPUB_TYPE` patterns, so all
three appear in the About view and none of them is a numbered chapter.

| page | contents |
|---|---|
| `titlepage.xhtml` | the book's **own printed title page**, transcribed from the source — title, subtitle, byline, publisher, year — then the classroom-edition note naming Claude and Jake Wilson |
| `gutenberg.xhtml` | Gutenberg's header block verbatim: eBook-of line, the "no cost and almost no restrictions" statement, Title, Author, Release date + eBook number, Language, **Credits** (the named transcribers), then the START marker |
| `gutenberg-license.xhtml` | the END marker retitled for this book, then all 47 paragraphs of the Project Gutenberg licence |

**One sentence on each `gutenberg.xhtml` is not Gutenberg's.** Gutenberg states
the status ("Public domain in the USA") but never the reason. A `Copyright
status:` line was added giving the first-publication year and the basis: the
US copyright has expired, so no one owns a US copyright in the work.

## Metadata — why it was all landing in "Custom…"

`admin.js` fills the Source and Licence dropdowns by **exact string match**
against the `<option value="">`. Every input book failed both:

| field | was | now |
|---|---|---|
| `dc:rights` | `Public domain in the USA.` | `Public domain (United States)` |
| `dc:source` | `Project Gutenberg ebook #13250, https://…` | `Project Gutenberg` |
| `dc:source` (Daddy Long-Legs) | `Global Grey ebooks` | `Global Grey` |

The detailed source string is not lost — it lives in `dc:identifier` and, in
prose, on `gutenberg.xhtml`.

## Chapter counts

| book | chapters | notes |
|---|---:|---|
| Chums of Scranton High at Ice Hockey | 20 | |
| The Girls of Central High | 25 | |
| …on Lake Luna | 25 | `Billy'S` → `Billy's` ×2, `Mother Wit'S` → `Mother Wit's` |
| …at Basketball | 25 | |
| The High School Left End | 25 | **names recovered from `<h5>` subtitles** |
| The Camp Fire Girls in the Maine Woods | 12 | trailing full stops removed from all 12 titles |
| Toby Tyler | 20 | names recovered from NCX; front matter no longer body ch. 1–2 |
| Daddy Long-Legs | 95 | prologue + 94 letters, matching the book's own contents list |
| Rebecca of Sunnybrook Farm | 31 | |
| The Wonderful Wizard of Oz | 24 | names recovered from NCX; front matter no longer body ch. 1–2 |
| Tom Sawyer Abroad | 13 | `Going for Tom's Pipe:` → trailing colon removed |
| The Crimson Sweater | 27 | |
| The Outdoor Girls of Deepdale | 25 | names recovered from `<h5>` subtitles |

## Verification

Run from the repo root, against the output directory:

```
node chapter-harness.mjs   <dir>   # front/back split, chapter count, paragraph parity
node real-epub-harness.mjs <dir>   # cover detection and spine resolution
node aboutcheck.mjs        <dir>   # metadata dropdowns + credits flags (new, this session)
```

Current state: **13/13 books, 0 paragraphs lost, 0 XML errors, 0 missing spine
files, 13/13 covers PASS, 13/13 metadata filling both dropdowns, 39/39 credit
pages flagged.** The five rebuilt books were checked word-for-word and
paragraph-for-paragraph against their inputs; all five match exactly.

## Two things a human should look at

1. **The Girls of Central High (#37019) has no printed title page in its
   Gutenberg edition.** Its title page is the only one of the twelve that is
   *reconstructed* rather than transcribed. Every element is sourced: the title,
   subtitle, byline, "ILLUSTRATED" and the Grosset & Dunlap address all come
   from this volume's own publisher advertising pages; the copyright line comes
   from the publication note in sibling volume #37912; the layout follows
   volume 2 (#30840), same series, same publisher, same year. There is
   deliberately no "Author of …" line — volume 2 has one, but what volume 1's
   first printing listed is the single element that would be guesswork. The
   page states that it is a reconstruction, on the page.
2. **Genre.** `SUBJECT_TO_GENRE` has no "Sports", so the sports books guess
   badly: Central High 01 and 03 come out **Mystery** (their `dc:subject` lists
   "Mystery and detective stories") and Toby Tyler comes out **blank**. Set
   these by hand, or add a Sports genre to `GENRES` and `SUBJECT_TO_GENRE`.
