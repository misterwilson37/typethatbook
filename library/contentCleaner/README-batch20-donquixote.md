# README — batch 20, *Don Quixote* (Cervantes 1605/1615, trans. John Ormsby 1885, Standard Ebooks)

**Instance:** Dickinson (Samuel Nelson Dickinson, Boston — opening the New England house.
`dickinson`, `nelson` and `samuel` all scan zero in this book. MacKellar is still unused;
Wilson, Bell, Austin, Caslon→Conner, both Bruces and both Conners remain barred.)
**Date:** 2026-08-21 **Version:** 20.0.0

Shipped: `miguel-de-cervantes-saavedra_don-quixote_john-ormsby-claudeCleaned.epub`
**994,795 bytes — 971.5 KiB — 0.995 MB decimal.** Under 1 MB by both definitions.

## The library card

| field | value | how |
|---|---|---|
| book id | `don-quixote` | `slugifyBookId(dc:title)`, unchanged by this build |
| Licence | Public domain (United States) & CC0 1.0 | fills the dropdown ✓ |
| Source | Standard Ebooks | fills the dropdown ✓ |
| **Genre** | **Humor** | was guessing **Romance** — `dc:subject` says `Romances`, meaning the chivalric form the book mocks. `setgenre.py` added `Satire`. |
| **Reading age** | **13–18** | mean sentence 69.0 words; 40.1% of sentences over 60 words. ⚠️ *The Ill-Advised Curiosity*, chs. 1-33 to 1-35, ~19,000 words, is a novella about a husband asking his friend to seduce his wife. Nothing explicit; the subject is adult. |
| **Protagonist** | **male** | a two-hander, but Sancho is a squire to a knight, not a co-lead |

Age and protagonist are set in Firestore, not in the EPUB — `admin.js` never reads them
from the file. They are here so Jake can fill them in one pass.

Verified with `harness/ttbcheck.mjs`, which lifts the real `admin.js` v3.31.1 functions.

---

## What this build is

The largest book in the corpus by a small margin (452,127 words as uploaded; 407,797 after
the prune) and, like *Monte Cristo*, far cleaner than the period predicts. 139 edit rows
plus one 176-word excision, applied to 407,912 words of Ormsby.

Two things beyond the usual language pass, both at Jake's request:

1. **Size.** Jake asked for under 1 MB "when possible." It was possible only by removing
   Ormsby's scholarly apparatus, which he approved after seeing the arithmetic.
2. **A CC0 dedication** in the classroom note, verbatim as Jake supplied it.

---

## How to recreate it

Everything runs from the kit directory with the book's `.epub` beside it. Stdlib only,
except Pillow (cover downsize) and `zopfli` (packing).

```bash
pip install pillow zopfli --break-system-packages

python3 stage.py miguel-de-cervantes-saavedra_don-quixote_john-ormsby.epub   # read-only

mkdir -p build && cd build
unzip -q ../miguel-de-cervantes-saavedra_don-quixote_john-ormsby.epub -d dq
cp -r dq .pristine && cd ..

python3 deimage.py build/dq        # 4 images out, cover downsized, 0 words lost
python3 prune_dq.py                # endnotes 1/2/3 + translator's preface, 5 ways
cp -r build/dq build/.base         # ⚠️ diff baseline for verify check 4

python3 probe_dq.py                # SEQUENTIAL dry run, 139 rows, must be 0 misses
python3 apply_dq.py                # asserted; never filter this output
python3 -c "import zpack; zpack.pack('build/dq','out.epub')"
python3 verify_dq.py               # 9 checks, must read ALL PASS

# round-trip: the only check independent of the tools that built the file
mkdir rt && unzip -q out.epub -d rt/x
python3 dump.py rt/x/epub/content.opf > rt/packaged.txt
python3 coverage_dq.py rt/packaged.txt
```

### Files written this batch

| File | Ver | Job |
|---|---|---|
| `edits_dq.py` | 20.0.0 | The 139 rows + the DQ27 cut + the bulk donkey pass. **Every `old` is a finder regex, never a typed string.** |
| `apply_dq.py` | 20.0.0 | Asserted application, then the bulk pass, then the classroom note |
| `probe_dq.py` | 20.0.0 | **Sequential** dry run (see below) |
| `prune_dq.py` | 1.0.0 | The five-way prune + noteref strip |
| `verify_dq.py` | 20.0.0 | 9-check battery |
| `coverage_dq.py` | 1.0.0 | 19i: every block minus a written leave list, two guards |
| `zpack.py` | 1.0.0 | zopfli-DEFLATE EPUB packer — standard stream, ~2% smaller |

`deimage.py` and `verify_deimage.py` are Jake's, used unmodified.

---

## The size work

| Build | Bytes |
|---|---|
| As uploaded | 1,508,000 |
| `deimage.py` (4 images, cover at 22 KB, **0 words lost**) | 1,136,925 |
| + 999 inline endnote reference numbers stripped | 1,112,962 |
| + `endnotes-1` + `endnotes-2` + `endnotes-3` dropped | 1,031,053 |
| + `translators-preface` dropped | 996,112 |
| + 139 language rows and the DQ27 cut | **994,793** |

**The core novel alone does not fit under 1 MB with default deflate.** 407,912 words of
Ormsby compress to about 1,021 KB at zlib level 9. Three things bought the margin:

- **zopfli.** A standard DEFLATE stream — every EPUB reader takes it — squeezed harder.
  ~2%, and it is the difference between 1,019,978 and 996,112 bytes. `zpack.py` writes the
  raw stream into the ZIP by hand because `zipfile` has no hook for a custom compressor.
- **The apparatus.** 44,443 words of endnotes and preface. Jake: *"I see no use for the
  endnotes and translator's preface. Cut them entirely."*
- **The noterefs.** Not a size measure primarily — a text-quality fix (below).

Whitespace and the redundant `class="epub-type epub-type-contains-word-…"` attributes were
measured and rejected: 43 KB of tabs and 54 KB of class attributes across 2.9 MB of XHTML,
both nearly free after deflate because they are so repetitive. **There is no markup trick
left in this book.** If a future book of this size needs to be smaller, the only remaining
lever is splitting it into two volumes, and that changes `dc:title`, which is forbidden.

### The noterefs are a text-quality fix, not a size fix

Standard Ebooks renders each of Ormsby's 1,001 endnote references as an inline superscript
number. In a typing program the student types the digits: `surrender no right,710 and I
have`. This is the batch-13b ruling (text-quality restoration is inside the scope of
language cleanup) and it would be right at 1.5 MB.

---

## Verification

```
1. XML well-formed          : ✓ 141 files
2. OPF <metadata> identical : ✓
3. <p> parity               : ✓ (titlepage +1 = the note)
4. changed regions <= rows  : ✓ no file changed anywhere a row did not aim
5. prune consistent 5 ways  : ✓ manifest, spine, toc.xhtml, toc.ncx, guide
6. no textless spine entry  : ✓
7. classroom note + CC0     : ✓
8. package                  : ✓  994,793 bytes = 971.5 KiB = 0.995 MB
9. words 407,924 -> 407,797 (net -127; DQ27 cut 176, note added ~69)
== ALL PASS ==
```

Round-trip re-scan of the packaged `.epub` under **`scan.py` 2.3.0**, with the 19i
subtraction check: **four patterns fire, all four are the recorded deliberate residuals** —
`savage` ×1 (adjectival, the lion's howl), `jewel*` ×29 (the `\bjew\w*` stem), `Muhammad` ×3
(correctly spelled, the Monte Cristo ruling), `wantonly` ×1 (gratuitous sense). Plus
`bitch` ×2 (the astrologer's literal hound) and `baggage` ×1 (baggage trains), both ruled
leave and both outside `scan.py` entirely.

**The 6c reverse-diff was NOT run, and it would have been invalid if it had been.** 18B-a's
precondition is that no replacement string already occurs in the source. `donkey`, `girl`,
`rogue`, `Romany` and `merry` all occur in pristine Ormsby — `donkey` is in the very sonnet
DQ1b edits. Check 4 replaces it: a line-level opcode diff asserting that **no file changed
in more regions than it had rows aimed at it**. For a 194-token bulk pass that is stronger
than a round trip, because it counts sites instead of trusting reversibility.

---

## The edit table, in one paragraph each

**Mechanical, translator's choice.** `ass`/`asses`/`jackass` **×194 → donkey**, plus six
bespoke sites. Ormsby's rendering of *asno*; Dapple loses nothing. `wench` ×27 → girl /
lass / country girl / farm-girl / serving-girl / sweetheart. `gay*` ×20, no substitute used
twice. `whoreson` ×11 + `whored` + `strumpet` ×4 → a rogue/rascal palette. `bitch` ×6 (the
insult; the two hounds stay). `booby` ×8 → blockhead / numskull / oaf / dolt / ninny /
noodle / gaby / dullard. `pimp` ×5 → **go-between**, which the epigraph already uses.
`niggard*` ×4 (glyph rule; it also fires the Tier 1 pattern). `cock*` ×8. Singletons:
`ravishers`, `doxy`, `slut`, `baggage` ×2, `hussy`, `bastard` ×3, `savage` (noun),
`carnal-minded`, `cockering`.

**Group claims stated as fact, unanswered on the page.** Ch. 1-9, the narrator on Cide
Hamete: `as lying is a very common propensity with those of that nation` → recast to keep
the enmity, which is historical and is the actual reason for the suspicion, and to keep
Cervantes' unreliable-narrator joke. Ch. 2-8, Sancho's merit list: `a mortal enemy of the
Jews` → **`an old Christian`**, the book's own phrase, used ×8 elsewhere. Ch. 1-40 ×2
(Zoraida's `trust no Moor, for they are all perfidious`; the Captive's `the Christians keep
their promises better than the Moors`). Ch. 1-39 `the cunning which all his race possess`.
Ch. 2-63 `those barbarous Turks`. Ch. 1-51 `of pure blood` — *limpieza de sangre* offered
as a personal credential.

**Religion.** `Muhammadan` → `Muslim` (Tier 2); `Mohammed` → `Muhammad`, matching the book's
other three; ch. 1-18's `his false prophet Muhammad` recast. `Muhammad` ×3 correctly spelled
stays, per Monte Cristo.

**Judgment.** DQ27, the 176-word excision — Sancho works out he can sell his Black vassals
into Spain. DQ29, Santiago Matamoros, **Jake's own solution** (below). DQ30/DQ31, the gipsy
cluster → `Romany`. DQ33, `held no legitimate knight but a bastard` → `base-born pretender`.

**Whole blocks left, with reasons.** DISABILITY, 38 tokens, zero edits. CLASS_CONTEMPT, 54
tokens, zero edits — and ch. 2-16 corrects itself out loud: *do not suppose that I apply
the term vulgar here merely to plebeians… everyone who is ignorant, be he lord or prince*.
`Moor*` ×149, `Turk*` ×52, `Morisco`/`renegade`, `slave*` ×52, `heathen*` ×7 (classical
sense), `chink*` ×7 (literal cracks, batch-17 adjacency condition checked on each),
`Oriental pearls` ×4. **Zero `damn*`, zero `ejaculat*` in 452,000 words.**

---

## The classroom note

On `titlepage.xhtml`, which has an `<h1>`, so it is safe there (unlike Potter's, which had
to go on `imprint.xhtml`). Worded for an excision, not just rewording, per the batch-3 rule:

> Classroom edition. This public-domain text has had a small number of period racial slurs
> and dated terms reworded, and one passage removed, for classroom use by Claude with
> supervision. Cervantes' story, characters, and dialect are otherwise unchanged. The
> scholarly endnotes and the translator's preface have been omitted. The editorial changes
> in this edition are dedicated to the worldwide public domain via the CC0 1.0 Universal
> Public Domain Dedication (https://creativecommons.org/publicdomain/zero/1.0/). You may
> reuse this edition freely, with or without credit.

The CC0 sentence is Jake's text, byte-verbatim, and `verify_dq.py` check 7 asserts it.
