# Batch 16 — README

Three cleaned EPUBs, the updated handoff, and the seven-script toolchain that produced them.

## Deliverables

| File | Edits |
|---|---|
| `beatrix-potter_short-fiction-claudeCleaned.epub` | 10 sites, 18 tokens |
| `e-nesbit_the-magic-city-claudeCleaned.epub` | 8 sites, 10 tokens |
| `laura-lee-hope-outdoor-girls-of-deepdale_g-claudeCleaned.epub` | 1 site |
| `HANDOFF-bookclean.md` | master handoff, batch 16 merged in |

All three import-safe: `dc:title` untouched, spine unchanged, no files renumbered or split.

## The toolchain (run in this order)

```bash
python3 dump.py BOOK/epub/content.opf > book.txt   # spine order, from the OPF
python3 stemaudit.py book.txt                      # ⚠️ audits the PATTERNS, not the book
python3 scan.py book.txt                           # cumulative scan, deduped
python3 ctx.py book.txt '\bpattern\w*'             # full paragraph per hit
python3 edits.py                                   # DRY RUN — counts vs raw source
python3 apply.py                                   # asserted; never filter its output
python3 verify.py                                  # XML / <p> parity / OPF / reverse-diff
```

`stemaudit.py` is new in batch 16 and is the one to actually add to the routine. It re-runs
every hard-bounded literal in the scan list as a stem and reports what the standing patterns
cannot see. It found the worst line in this batch in about a second.

## What changed in each book

**Short Fiction (Potter)** — zero racial content in 20 tales. The work was surface forms:
`cock`/`cockerel` ×4 → rooster, `faggots` ×2 → sticks/bundles, `black prick ears` → `black
pointed ears`, and **`Cock Robin` ×8 → `Robin Redbreast`** (3 body + 2 alt attributes + 2 list
of illustrations + 1 in a second tale — editing only the body would have left the image
descriptions contradicting the text).

**The Magic City (Nesbit)** — `peckers` → `appetites` (the hidden one), `keep your pecker up`
→ `keep pecking away` (preserves the three-beat pun), `gipsies` ×3 → `kidnappers`, `Red Indians`
→ `Native Americans` (the sentence already contained `Indians` meaning South Asians, so the
standing one-word rule would have produced a duplicate), `gay`/`gayest`, `crowing cocks`,
`china-men` → `porcelain-men`. **`savages` ×2 deliberately kept** — Philip corrects Lucy two
lines later and Jake ruled the correction is the point.

**The Outdoor Girls (Hope)** — one edit: `like little Arabs` → `like little chimney-sweeps`.
Three scene/character checks run and all clean; details in the handoff (16g).

## Also in this session: The Turn of the Screw — assessed, not shipped

Staged, scanned, and read. Eight edits available (`gay` ×2, `intercourse` ×5, `seduction`), zero
Tier 1, zero Tier 2. **Declined by Jake on content**, and the content is not lexical — the book's
central implication is entirely unstated, so there is nothing to strip. Written up in HANDOFF
§16j along with a new staging criterion: **for a typing program, prose difficulty can disqualify
a book that is lexically spotless.** Do not re-stage it.

## Three corrections to the handoff itself

1. **`damn` / `damned` / `damnation` is ALWAYS-FIX, including the theological sense.** Jake's
   widening. I had proposed leaving three tokens citing "the *Dracula* precedent" — that
   precedent says the opposite (DR13 fixed both). Two theological leaves elsewhere in the corpus
   now need reverting: *Pollyanna* and *Monte Cristo*. Batch 16's shipped books scan zero.
2. **`intercourse` was ruled on in batch 6 and silently lost by batch 9.** Nine tokens fixed
   across two Austens; five left in *Monte Cristo* with no reason given, because the term was
   never written into `customFlaggedWords`. Now in the surface-form block. *Monte Cristo*'s five
   need reverting.
3. **`dc:language` mispredicted orthography twice in one batch.** Two American-tagged books using
   British `gai-` spellings. It is a hint about what to expect, never an input to a ruling.

## Two things worth knowing before the next batch

1. **The scan list contains patterns that violate the scan list's own rule.** `/\bpecker\b/`
   cannot match `peckers`. About eighteen patterns have the same shape and want restemming —
   the list is in HANDOFF §16a. This is a fifteen-minute fix and the highest-value maintenance
   item in the document.
2. **`customFlaggedWords` still has not been pasted into `settings/languageFilter`.** Open
   since batch 3, now fourteen batches. Batch 16 adds one new block (`ETHNONYM_IDIOM`).

## Reverting anything

Every edit is one string. `edits.py` holds the full table as data — id, file, old, new, count —
so any single row can be reversed by swapping `old` and `new` and re-running. The title-page
notes are a single `<p>` each: Potter's is in `text/imprint.xhtml` (not the title page — that
file is an image with no byline, see §16c), Magic City's in `text/titlepage.xhtml`, Outdoor
Girls' after the `<h5 id="id00003">` byline.
