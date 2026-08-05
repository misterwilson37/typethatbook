# Test fixtures — expected results

<!-- TESTING-ttb-test-epubs.md v1.0.0 — Round 5 (Mignon). Companion to
     ttb-test-flat.epub and ttb-test-parts.epub. Every number below was produced by
     running the shipping code through the harnesses, not estimated. -->

Two books, original text, CC0. **Import the flat one first.** If it passes and the
parts one fails, the fault is in the part-numbering path, which is where every
`parseInt`-on-an-id bug in this project has lived. Two books so a failure isolates.

**Typing cost:** 259 + 266 = **525 words**, about **5 minutes at 100 wpm** for the
whole book. You can run the full loop — import, About, type both chapters, hit the
completion screen — inside one prep period, twice.

Requires **admin.js ≥ 3.22.0**, **game.js ≥ 3.12.0**, **index.html ≥ 3.5.0**.

---

## 1. On parse — what the staging list should say

Both books: **12 spine documents in, 10 chapters staged, 2 body, 0 paragraphs lost.**

| id | title | matter | About | why it's here |
|---|---|---|---|---|
| — | Cover | — | — | **dropped**: 0 paragraphs |
| 0.1 | Title Page | front | ☐ off | front matter that is *not* credits |
| 0.2 | Imprint | front | ☑ **on** | auto-detected from filename |
| 0.3 | Dedication | front | ☐ off | not credits — it's the author's, not a notice |
| — | Half Title | — | — | **dropped**: heading only, 0 paragraphs |
| **1** or **1.01** | Chapter 1 | **body** | — | ~259 words |
| **2** or **2.01** | Chapter 2 | **body** | — | ~266 words |
| 900.1 | Appendix | back | ☐ off | back matter that is *not* credits |
| 900.2 | Endnotes | back | ☐ off | ⚠️ percent-encoded filename — see §2 |
| 900.3 | Colophon | back | ☑ **on** | auto-detected |
| 900.4 | Uncopyright | back | ☑ **on** | auto-detected — proves About handles **2+ pages** |
| 900.5 | Table of Contents | **back** | ☐ off | ⚠️ see §3 |

Parse summary should end with `· cover: cover.jpg (image/jpeg)` and a green border.

**If the two dropped pages appear as chapters,** the `segments.length > 0` guard
regressed and students can be assigned an empty chapter.

---

## 2. ⚠️ The endnotes page is the real test of v3.18.3

Its filename contains a space; the manifest refers to it as `endnotes%20page.xhtml`,
which the EPUB spec requires. Measured against the shipping code:

```
              spine  old zip.file()  new zipEntry()
ttb-test-flat    12       1 MISS         0 miss
```

**This is the only fixture in the project where "spine resolution DIFFERS" is the
correct outcome.** On your 42 real books identical was the goal; here differing is
the proof. Before v3.18.3 this book would have died on
`zip.file(p).async(...)` throwing on null, with a `TypeError` naming no file.

**If Endnotes is missing from the staging list,** or the parse dies with a
`TypeError`, percent-decoding regressed.

---

## 3. ⚠️ The Table of Contents page tests Fix A

`toc.xhtml` is **last in the spine**, and `toc` matches the front-matter filename
rule. So the classifier calls it *front* — and it sits after the whole story.

Verified against the differ:

```
toc.xhtml   was 0.4 front "Table of Contents"   now 900.5 back "Table of Contents"
```

**If it arrives as `0.4`, Fix A regressed** — and the practical consequence is that
`0.4` *sorts to position four of the book*, so a page belonging at the end appears
near the front.

---

## 4. The dot, before and after

On first import, before you fill anything in:

```
○ The Machine in the Back Room (…)  · needs: age, licence
```

Cover comes from the EPUB, and About is satisfied by Imprint/Colophon/Uncopyright,
so those two shouldn't appear. Set ages and pick a licence and it should go solid:

```
● The Machine in the Back Room (…)
```

`dc:rights` in both books declares CC0 with its URL, so **Licence and Source should
auto-fill on file selection** and the autofill status should turn amber and warn you
a licence was found. If it doesn't, `readEpubMetadata` isn't reading `dc:rights`.

---

## 5. About this book

Card should show a quiet credit line, then **ℹ About this book**.

Clicking it must **not navigate into the book** — the card is an `<a>`, so this is
the `stopPropagation` path. The panel should show:

- title, author
- **Credits**: Source, Licence (CC0, linked), and Text prepared by if you set it
- then **three sections in id order: Imprint, Colophon, Uncopyright**

The Imprint page says so explicitly: *"If you can read this inside the app, the
attribution path works."*

**Things worth breaking on purpose:** untick About on all three and reload — the ℹ
button should vanish entirely rather than open an empty panel. Tick *Appendix* on
and it should appear between Imprint and Colophon, because the view sorts by id, not
by when you ticked it.

---

## 6. Typing and completion

Chapter 1 → finish → should offer **Ch. 2**, not the appendix. Chapter 2 → finish →

> **That was the last chapter — you finished the book.**

and a button back to the library. ⚠️ **If it offers "Ch. 3", that's the invented
next-chapter regressing** — the bug that meant nobody had ever seen the completion
screen. On the parts book the equivalent failure is an offer of **"Ch. 3.01"** or
**"2.02"**.

Progress bar should read `Ch. 1 / 2` then `Ch. 2 / 2` at 100%. **`/ 2`, not `/ 10`** —
if it says 10 the denominator is counting front and back matter again.

On the parts book specifically: the book progress bar should show **two segments
labelled 1 and 2**, and only **one** highlighted as current at a time. Two segments
both lit is the `parseInt("1.01") === parseInt("2.01")` bug returning.

---

## 7. Firefox — do this one in Firefox on purpose

Chapter 1 is deliberately stuffed with apostrophes: *didn't, grandmother's,
hadn't, doesn't, wouldn't, that's, I'm, you'd*. Before `game.js` 3.9.3 every one of
those opened Firefox's Quick Find (links only) bar.

Type a paragraph in **Firefox**. No find bar should appear. Then confirm **Ctrl+R
still reloads** — if it doesn't, the modifier guard is wrong and you've trapped a kid
in the tab.

There are also curly quotes and em dashes throughout, which should be silently
normalised by the character cleaner rather than triggering the wizard.

---

## 8. Re-import, which is the one you actually need to trust

The whole point of Monday's deadline. With the flat book already uploaded:

1. **Open Book**, change nothing, **Upload All**. Front/back matter must survive.
   ⚠️ Before admin.js 3.21.0 this reset every non-body page to `body` — the
   classification was only ever right on the *first* import.
2. **Delete a chapter** in staging. Remaining ids must stay `0.1 / 0.2 / 0.3 / …`,
   **not** flatten to `1, 2, 3`. That's the §B.13 renumber bug.
3. **Re-import the parts book over the flat one** (same book id). It has different
   chapter ids, so the completion line should report **old chapter doc(s) removed**.
   That's the v3.22.0 pruning. Then check Firestore: no `chapter_1` or `chapter_2`
   left beside `chapter_1.01`.

Test 3 is the one that matters for your 42 books, because Fix C renumbers the
Gutenberg ones and orphaned chapter documents are both billable and loadable.

---

## What these fixtures do NOT cover

Be aware, so you don't read a pass as broader than it is:

- **Fix C** (leading matter inside a bodymatter file). Both books report **0 suspect
  body chapters** — correctly, since their front matter is in its own files. Toby
  Tyler and The Crimson Sweater are the real tests, and Oz_g / Scranton Chums /
  Camp Fire Girls are the three still needing your eye.
- **SVG cover wrappers and AVIF.** Both covers are plain JPEG. Nothing in your
  library has an SVG wrapper either, so that path stays untested by anything real.
- **The flush guards and rollup chunking.** Those need concurrency and a WAL
  pile-up, not a book.
- **Multi-student anything** — leaderboard, reports scoping, App Check on the
  student path. Monday.
