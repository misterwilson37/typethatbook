# HANDOFF — Round 5 (Mignon)

<!-- HANDOFF.md v5.0.0 — Round 5, instance "Mignon", 2026-08-05.
     ⚠️ THIS SUPERSEDES THE PREVIOUS HANDOFF. Rename the old one to
     HANDOFF-round4.md and keep it: its §A history is still useful and its §B.8
     deployment table is actively wrong. See §0. -->

**Instance:** **Mignon** (5) · Oliver (4) · Blick (3) · Dvorak (2) · Underwood (1)
· *other projects:* Stedman, Fable, Trilby, Vernier

> *On the name:* the Mignon (AEG, 1904) is an index typewriter — you point at a
> character on a printed plate and press one key. The label you point at and the
> type cylinder that strikes the paper are separate parts, and if they come apart
> nothing tells you; you point at `a` and get `q`, confidently, forever. That was
> Round 5 from the first hour to the last: a manifest saying `image/avif`, a blob
> saying nothing, a Storage rule demanding `image/*`, a status bar saying `✓`.

---

## §0. READ THIS BEFORE THE OLD HANDOFF

**The Round 4 handoff's §B.8 deployment table was wrong in both directions**, and
believing it cost the first hour of this session. It listed `admin.js` 3.18.2 as
never uploaded (it was), and `game.js` 3.9.1 / `learn.js` 2.2.0 / `reports.html`
2.8.0 as probably live (they were not in the repo at all). The CHANGELOG documented
versions that existed in no file.

**So: never trust a version claim in a handoff, including this one. Read the
constant.** Every number in §1 was read out of the file, not remembered.

Also, and this is not a criticism of Jake: **the repo he hands you may contain files
from another project.** Round 4's zip had `store.js` and `queue.js` from
Tentacalendar — 180 KB of foreign logic that nothing in TypeThatBook imports. If
you treat those as TypeThatBook code you will produce confident nonsense. Grep for
imports before believing a file belongs here. They should be gone now; check.

---

## §1. Version state — read from the files, 2026-08-05

| file | version | uploaded? |
|---|---|---|
| `admin.js` | **3.23.1** | ask Jake — he was mid-upload |
| `admin.html` | **3.23.1** (title only; no constant — see §4.1) | ask |
| `game.js` | **3.13.0** | ask |
| `learn.js` | **2.2.2** | ask |
| `index.html` | **3.6.1** | ask |
| `style.css` | **3.5.0** | ask |
| `adventure-renderer.js` | **1.2.0** | ask |
| `reports.html` | **2.8.0** | ⚠️ see §1.1 |
| `firestore.rules` | 2.2.0 | pasted into console — verify |
| `storage.rules` | 2.1.0 | ⚠️ see §1.2 |

### 1.1 ⚠️ reports.html 2.8.0 was Round 4's, and I nearly lost it

Round 4 wrote `reports.html` 2.8.0 and it was never uploaded. Mid-session I copied
the repo's older 2.7.0 over my working copy and did not notice for several turns.
Restored from Round 4's zip and re-verified. **If reports.html in the repo says
2.7.0 or its footer says 2.4.1, the "My classes" permission fix is missing** — that
version queries the whole building and narrows on the client, which is
permission-denied for any teacher on the default `own_classes` scope.

### 1.2 ⚠️ storage.rules — the cover bug's other half

`firebase-storage.rules` (v2.0.0) was a second, contradictory copy of the Storage
rules sitting in the repo. Its write rule required
`request.resource.contentType.matches('image/.*')`, and that was what denied every
EPUB cover. **Delete it if it is still there**, and confirm the console has
`storage.rules` v2.1.0.

---

## §2. The one bug class that explains most of this round

**An id is a label, not a number.** Part-numbered books use ids like `1.14`, front
matter is `0.x`, back matter is `900.x`. `parseInt("1.14")` is 1 and
`parseInt("1.01") === parseInt("1.14")` is `true`.

Found and fixed in **seven** places this round:

1. `index.html` progress bar — a student who finished all 23 chapters of Heidi saw
   "Ch. 2 / 27" and a bar at 7%
2. `game.js` per-segment label — Heidi's fourteen part-one chapters all read "1"
3. `game.js` `bookProgressFraction()` — the marker never left the start of a part
4. `game.js` `isCurrent`/`isPast` — **fourteen** segments rendered as current at once
5. `game.js` `advanceToNextChapter` fallback — asked for "2.14", which does not exist
6. `game.js` `finishChapter` fallback — offered "Ch. 3" of a two-chapter book
7. `game.js` initial chapter — hardcoded `1`, so **every part-numbered book showed a
   blank page to any student opening it for the first time.** Live since part
   numbering shipped in admin.js 3.14.0. Heidi, Treasure Island, Little Women, The
   War of the Worlds.

**And the sibling class: "the spine is not the book."** `bookMetadata.chapters`
includes front and back matter. Six sites: the chapter picker, auto-advance, the
Adventure map, two `N ch` labels, and the progress bar's geometry. Use
`bodyChapterList()`.

⚠️ **If you find another id being parsed or another loop over
`bookMetadata.chapters`, it is a bug.** Both helpers live in `game.js` next to
`bookProgressFraction()`.

---

## §3. What shipped, in one line each

**The cover bug (admin.js 3.18.3).** JSZip's `.async("blob")` returns a Blob with an
**empty** type; Firebase falls back to `application/octet-stream`; storage.rules
v2.0.0 required `image/*`. So every EPUB cover was denied and every hand-picked one
worked — which is why it looked like an EPUB problem. Now sniffed from magic bytes,
the Blob rebuilt carrying the type, and passed explicitly. All 42 of Jake's books
verified.

**Round 4's guards were wrong (game.js 3.9.2, learn.js 2.2.1).** `if
(_flushInFlight)` serialises two callers and lets three or more overlap. Measured: 6
callers, 5 overlapping runs. `while`, not `if`.

**Rules 2.2.0 needed a client (game.js 3.9.2).** The new `sprints.size() <= 200` cap
plus an uncapped `pendingSessions` that `walRecover()` *concatenates* is a poison
pill: one failure grows the array past the ceiling and every write is denied
forever, silently. Chunked at 200.

**Fix A/B/C, the importer (admin.js 3.18.4–3.18.5).** Front matter cannot follow body
matter; a non-chapter is never titled "Chapter N"; and leading matter hiding inside a
bodymatter file — which hit 9 of 11 Gutenberg books and pushed Toby Tyler's chapters
to 3–22.

**"About this book" (admin.js 3.21.0, index.html 3.5.0+).** A second boolean
`about`, orthogonal to `matter`. Deleting front matter to keep it out of the typing
picker was destroying the copyright notice a CC licence requires be kept intact — a
UI default was setting a legal constraint.

**Classic contrast (style.css 3.4.0).** `.letter` was `#ccc` and typed text was
black. Backwards: the words being read ahead need the contrast.

**Delete Book (admin.js 3.23.0).** Typed confirmation. Chapters before the book
record, so a half-failure is visible rather than an invisible pile of orphans.

Full detail is in `CHANGELOG.md`, which is current and was updated every release.

---

## §4. Open work, in the order I would take it

### 4.1 Small and certain

- **`admin.html` has no version constant.** Its title is hardcoded and said v3.3.0
  for nineteen minor versions. Give it one, driven from `admin.js`.
- **Archive URL auto-fill.** Jake wants a configurable base directory with the
  filename filled from the import. `originUrl` exists; the base does not.
- **A `/credits` page** listing every book, source and licence. Conventional, cheap,
  and what a copyright holder would actually look for.

### 4.2 Adventure scrolling credits — the next real piece

`game.js` 3.13.0 emits `ttb:bookComplete` **carrying the credit fields**
(`title/author/source/rights/cleanedBy/chapters`), so the renderer needs no extra
Firestore read. Classic already renders its credits into the text stream. Adventure
should scroll them up the canvas — the renderer owns that surface and already
animates. ⚠️ I did not build it because it is canvas animation and I could not watch
it run; do not ship motion you cannot see.

### 4.3 The text-cleanup pass (designed, not built)

Jake's three-way split, which is the useful framing:

1. **False positives** — "guinea" as money, "New Guinea", guinea fowl. Context
   regexes, free, permanent.
2. **True positives he is choosing to accept** — "gay"/"gaily", hundreds of times.
   He needs *acknowledge and mute*, per word, stored on the book. Not a rewrite. The
   tool is failing him by asking again.
3. **True positives needing a rewrite** — the only expensive part. ⚠️ **Send flagged
   PASSAGES, not books.** The existing scanner finds them locally for free; that is
   ~50–200 excerpts instead of 60,000 words. Two orders of magnitude cheaper, and
   cost is Jake's stated top priority. If it goes in `admin.js` it must route through
   a Cloud Function — an API key in static GitHub Pages JS is a published key.

⚠️ **The bigger issue a word list will miss:** his Nancy Drew and Hardy Boys are the
**1930 originals** — which is *why* they are public domain. The 1959–60 revisions
exist substantially because the originals contain racial caricature, and those
revised texts are still in copyright. A word list catches "gay" and sails past a page
of dialect caricature. Same class of risk: disability language used clinically, and
"ejaculated" as a dialogue verb. **Those need reading, not scanning.**

### 4.4 Library additions Jake has agreed to

Metadata in his exact schema. His goals: every kid of both sexes has choices, spread
of genres, focus on adventure/humour/sports, most worried about ages 7–14.

| id | title | author | genre | min | max | protagonist |
|---|---|---|---|---|---|---|
| `augie_green_knight` | Augie and the Green Knight | Zach Weinersmith | Fantasy | 8 | 13 | female |
| `anne_of_green_gables` | Anne of Green Gables | L. M. Montgomery | Humor | 9 | 14 | female |
| `black_beauty` | Black Beauty | Anna Sewell | Adventure | 9 | 14 | nonhuman |
| `central_high01` | The Girls of Central High 01 | Gertrude W. Morrison | Sports | 10 | 14 | female |
| `sherlock_adventures` | The Adventures of Sherlock Holmes | Arthur Conan Doyle | Mystery | 11 | 16 | male |
| `lost_world` | The Lost World | Arthur Conan Doyle | Science Fiction | 11 | 16 | ensemble |
| `five_children_and_it` | Five Children and It | E. Nesbit | Fantasy | 8 | 13 | ensemble |
| `peterkin_papers` | The Peterkin Papers | Lucretia P. Hale | Humor | 8 | 12 | ensemble |

**A built EPUB of Augie already exists** — `augie-and-the-green-knight.epub`, built
from Jake's KF8 with `build-augie-epub.py`, 19 chapters, CC BY-NC 3.0 preserved
verbatim as the imprint. Not yet imported.

**Coverage gaps, measured:** sports is male-only and 10–14; humour collapses to one
book at age 12; a 14-year-old has zero fantasy. And **Aesop (5–9) and the Potter
collection (5–7) were age-gated below Jake's entire student population** — the two
books whose short units are ideal for a 44-minute period. He has widened them.

### 4.5 Not now

- `ttb-shared.js`. Pure refactor across every file, nothing to verify against, and
  it needs discipline that degrades late in a long session. Round 4 was right.
- `experimentalAutoDetectLongPolling`. Still the wrong side of the cost priority.

---

## §5. Invariants discovered this round

Add these to the ones you inherit.

1. **An id is a label.** §2. Never `parseInt` one.
2. **`bookMetadata.chapters` is the spine, not the book.** Use `bodyChapterList()`.
3. **`matter` says typeable; `about` says credits.** Orthogonal. Collapsing them is
   the mistake.
4. **Front matter must survive import.** The notice is a licence condition.
   `game.js` filters the picker so it can.
5. **`ttb_booksCache_v*` must be bumped whenever the cached book shape changes**, or
   the change silently does nothing for six hours. This bit us: `aboutTitles` shipped
   and every About heading still read "NOTICE" because the data feeding it was stale.
6. **An `<a>` may not contain an `<a>` or a `<button>`.** Browsers *recover* by
   closing the anchor early and reparenting the rest, which is what made the library
   cards fall apart. Not a styling bug. Not fixable in CSS.
7. **`justify-content: center` + `overflow: auto` clips the overflow at the START**
   and the clipped part cannot be scrolled to. That is what made the Game Genie's top
   controls unreachable.
8. **`escapeHtml`-by-DOM does not escape quotes**, because quotes need no escaping in
   element content — and very much do inside an `href`. I shipped this hole **twice**
   in one round. Use a URL character class that excludes quotes *and* escape the
   attribute.
9. **Upload All prunes orphaned chapter documents.** It must, because Fix C
   renumbers books.
10. **Open Book must restore `matter` and `about`.** It did not, so any re-upload
    silently reset every non-body page to `body` — the classification was only ever
    correct on the first import.

---

## §6. Test harnesses — use them, do not rebuild them

Round 4's warning was that the harness was not in the repo. There are now eight, and
they lift the **shipping functions** out of the files by brace-matching rather than
copying logic, so they break when the code moves — which is correct behaviour.

| file | what it proves |
|---|---|
| `chapter-harness.mjs` | full chapter pipeline over a directory of EPUBs |
| `real-epub-harness.mjs` | cover detection + old-vs-new spine resolution |
| `fix-candidates.mjs` | **before/after differ** — collateral damage from any importer change |
| `scan2.mjs` | suspect body chapters (Fix C candidates) |
| `card-markup-test.mjs` | card markup survives the HTML parser intact |
| `about-render-test.mjs` | segment shapes, cached headings, credit injection |
| `about-test.mjs` | `detectAbout()` + the dot's gap list |
| `ordinal-test.mjs` | body ordinals, modern and legacy documents |
| `map-geometry-test.mjs` | Adventure dot placement across real book sizes |
| `credits-test.mjs` | Classic credits, structure and injection |
| `verify-guards.mjs` | flush guards at 2/3/6/12 concurrent callers |
| `chunktest.mjs` | sprint rollup chunking, loss and duplication |
| `progress-test.mjs` | library progress bar degradation paths |

**`fix-candidates.mjs` is the important one.** Point it at Jake's library directory
and it tells you exactly which chapters a change moves. That is how Fix A, B and C
were shown to move **no body chapter's id on any of 42 books** before shipping.

Jake keeps the corpus in a GitHub directory. Point the harnesses at it.

---

## §7. Things I got wrong, recorded on purpose

- **`creditLine()` shipped with an injection hole I had already fixed in
  `index.html`** two turns earlier. Second time in one round. The lesson is not "try
  harder to remember" — the test caught it in eight seconds and my memory did not.
- **`game.js` 3.12.3 shipped without its version bump.** The CHANGELOG said 3.12.3
  while the file said 3.12.2. That is the exact drift this round spent its time
  catching in Round 4's work, and I am not exempt from it.
- **I told Jake the imprint page survives inside the book** and would satisfy the
  notice requirement. It does not, because he deletes front matter. He caught it.
  That is what produced §4.2's whole design.
- **I told him to expect genre "Humor" on an overwrite.** Overwrite deliberately
  preserves stored metadata — it must, or re-uploading would wipe 42 books' tags.
- **The `[object Object]` in the About panel was mine.** A segment is `{ text: … }`
  and always has been; I wrote `String(t)` without checking the shape.

---

## §8. Jake — working with him

Everything in Round 4's §12 still holds. Additions from this round:

- **He tests properly and reports precisely.** "Scroll is there, but not there enough
  to utilize" was an exact description of a flex-overflow clip. "The squiggle at the
  top is all that the first chapter did" located an off-by-one in canvas geometry.
  **Take his descriptions literally; they are usually the diagnosis.**
- **He will ask "are you sure?" and he is usually right to.** "But we delete the
  front matter, don't we?" and "shouldn't it be 2.2.1?" both caught real errors.
  Check before answering, every time.
- **He would rather know a thing is unbuilt than receive it half-built.** Saying "I
  won't ship motion I can't watch run" landed better than shipping it would have.
- **Don't burn the session and skip the handoff.** He had to say "ahem".
