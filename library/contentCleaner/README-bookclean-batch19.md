# Batch 19 — README

One cleaned EPUB, one declined book, the updated master handoff, and the four per-batch scripts.

## Deliverables

| File | Result |
|---|---|
| `josephine-chase-grace-harlowe01-plebe-year_g-claudeCleaned.epub` | 22 edits |
| *Penrod* (Tarkington, 1914) | ⚠️ **declined on content** — see below and HANDOFF §19c |
| `HANDOFF-bookclean.md` | master handoff, batch 19 merged in |
| `edits.py` / `apply.py` / `verify.py` / `frontmatter.py` | this batch's table and harness |

*Grace* is import-safe: `dc:title` byte-identical, OPF byte-identical, spine unchanged, nothing
renumbered or split.

## The toolchain (run in this order)

```bash
# read the table of contents FIRST — it is free and it was right again this batch
grep -o -E '>[^<]+</a>' BOOK/OEBPS/nav.xhtml

python3 dump.py BOOK/OEBPS/content.opf > book.txt
python3 stemaudit.py book.txt                      # ⚠️ audits the PATTERNS, not the book
python3 scan.py book.txt
python3 ctx.py book.txt '\bpattern\w*'
python3 frontmatter.py                             # front-matter state, before anything
python3 edits.py                                   # DRY RUN — counts vs raw source
python3 apply.py                                   # asserted; never filter its output
python3 verify.py                                  # 8 checks; exits nonzero on failure
```

## Grace Harlowe — 22 edits, no judgment calls

First book in several batches that needed no new rule. Three `gypsy`, one person-referring
`oriental`, three batch-13 idioms, twelve `gay*`, two `ejaculat*`, one untypable character.

⚠️ **The batch-6 `gaily` leave does NOT apply to this book, and the reason is the spelling.** The
en-GB leave exists because `g-a-i-l-y` never puts the letters on screen. Chase is American and
spells it **`gayly`** — eight times. That's the *Fauntleroy* side of the ruling, not the *Dracula*
side. All twelve `gay*` came out. **Check which spelling a book actually uses before applying either
half.**

Eight `gayly` got eight distinct adverbs (merrily, brightly, gleefully, cheerily, laughingly,
blithely, cheerfully, eagerly) and three `gypsy` got three (rover, vagabond, wanderer).

**GH5 got chased before it was written.** Miriam Nesbit is the antagonist — dark, imperious, richest
girl in the class, `oriental-looking`, in 1910. That's the batch-18 shape, so the whole book got
swept for `Jew`/`Hebrew`/`Semit`, nose/swarthy/olive descriptors, and money coding. Nothing. One
adjective, always-fix regardless. The sweep still had to happen.

**Cleared by reading:** chapter 4, "The Black Monks of Asia" — sophomores in black robes pranking
freshmen at a ruined tavern called Mount Asia. Seven tokens, nothing ethnic, title stays.

**Left:** `queer` ×7, `tramp`/`tramps` ×14 (real vagrants in the plot plus hiking), `ragamuffins`
(describing Grace's kindness to poor children, not mockery), `Indians` ×1 (the tavern "burned by the
Indians" — local legend; the *simile* in the same chapter came out), `dervish`, `wanton cruelty`,
`slaves` (metaphor), `Moore` ×2 (a surname).

## New harness check 8: introduced words

`verify.py` now asserts every word the round **introduced** appears exactly one more time than it did
in the source.

⚠️ **This is the check that proves a cluster swap didn't collapse into one word.** Check 7 proves
ruled leaves survived; check 6 proves ruled tokens are gone. **Neither can tell whether eight
`gayly` became eight distinct adverbs or eight copies of `merrily`** — and a page of identical
replacements is exactly what a rushed cluster edit produces.

⚠️ **It failed on my typed numbers, for the third batch running.** I hardcoded `brightly` at 1 and
`eagerly` at 4; both words already existed in the book, once and five times. Fixed by asserting
`shipped == source + 1`, derived at run time.

**Rule now in the handoff: no expected count in `verify.py` may be a literal.** Batch 17 lost two
numbers this way (`Crookback`, and a full-count preserve on a partially-edited stem); batch 19 lost
two more. If a check needs a number, it needs a computation.

## Penrod — declined

**The first book in the corpus a scan would have cleared and a read had to kill.** ~20 Tier 1 tokens,
all one-string edits with settled precedent. A pass that stopped at the token list would have shipped
it in an hour.

Herman and Verman, two Black brothers, run through six chapters — 169 mentions, ~13,300 words, 22%
of the book. Four things are welded to them that no edit table reaches:

1. **Verman is tongue-tied and that IS his comic function** — every line is unintelligible gibberish
   translated by Herman, across all ~71 appearances. 14b sub-rule 1 says don't erase the disability;
   batch 5 says the character is the offense. They point opposite ways on the same person.
2. **A ~350-word minstrel-stage set piece** — Herman imitating a Black revival preacher sliding down
   a church pole. That's 12 of the book's 19 `hell` tokens in one paragraph, with Black worship as
   the punchline. ⚠️ A 19-token `hell` count that reads like ordinary period profanity is actually
   one minstrel routine; the raw block total said the opposite of the truth.
3. **The family offered to a white boy as spectacle** — a self-amputated finger "jes' fo' nothin'",
   a sister's goitre viewed through a window, a father jailed for a stabbing, a raccoon named after
   the murdered uncle, and the narrator: *"For the first time in their lives they moved in the rich
   glamour of sensationalism."*
4. **The narrator uses the slur himself** — *"the lunatic shriek of a gin-maddened nigger."*

**The honest counterweight:** Tarkington makes them likable and competent. They beat the bully;
Herman gets real dignity in that fight. Batch 11's test is *"is there a portrayal here worth
protecting"* and the answer is **yes** — which is exactly what makes it undoable.

⚠️ **The deciding argument is specific to this program and it's new.** A reader skims dialect; a
student **keys** it. 13,000 words of phonetic respelling is a different activity from reading it.
That's now the third staging criterion in the handoff, alongside 16j (prose difficulty, killed *Turn
of the Screw*) and 18c (series position, carried *Phoenix and the Carpet*).

⚠️ **Declining *Penrod* declines the series** — *Penrod and Sam* (1916) and *Penrod Jashber* (1929)
both continue Herman and Verman.

## Closed: the PG licence in the spine

Checking *Penrod*'s spine surfaced that `uncopyright.xhtml` sits in the spine carrying ~2,960 words
of full PG licence for Gutenberg-sourced books (Global Grey books get 59). Your ruling: `admin.js`
handles copyright pages, so it never reaches a student. **Closed, recorded, don't re-raise.**

The general lesson stays in the handoff, because it's the batch-7 insight and I'd temporarily
forgotten it: **"it's in the spine" is not the same as "a student types it."** `admin.js` sits
between the two, and the importer's behaviour is the acceptance criterion — not the file's.

## Title-page note

Third rewrite in three batches, and this one was wrong in **both** directions: the prepared note
said "period racial slurs", which overstates `gypsy` and `oriental-looking`, and omits the bulk of
the actual work (twelve `gay*`, two `ejaculat*`, a spelling) entirely. Now reads *"dated ethnic terms
and surface spellings."*

⚠️ **The prepared note's default wording has needed correcting on every book that has come through
the split toolchain.** Worth changing at the prep end rather than fixing downstream a sixth time.

## Verification

```
grace: XML 29/29 | <p> 1667→1667 (+0, expected) | reverse-diff byte-identical (13 files)
       OPF BYTE-IDENTICAL | nav/ncx skeleton IDENTICAL | residual 0/12
       ruled leaves 9/9 vs source | introduced 11/11 at source+1 | note×1 CC0×1
```

Re-checked after packaging: `mimetype` first and stored, container and OPF present, unpacked tree
`diff -rq` identical to the verified build.

## Reverting anything

Every edit is one string; `edits.py` holds the table as data. The eight `gayly` adverbs are the rows
most likely to want re-picking — `GH6a`–`GH6h`, one string each.

## Forward flags

- ✅ **Josephine Chase is the cheapest remaining author in the document and should be staged in
  bulk.** The *Grace Harlowe* series runs to **seventeen** books; the four high-school titles are
  the right size. Expect the same profile every time: `gayly` in double digits, `ejaculated` as a
  dialogue tag, a couple of batch-13 idioms.
- ⚠️ **Before staging any American boys' book from 1900–1930, grep for `Lawd|wuz|dey|dat|gwine`.**
  Same decade and same intended age produced *Grace Harlowe* (22 mechanical edits) and *Penrod*
  (undoable). The variable is whether the author reaches for a Black comic character. Barbour didn't;
  Tarkington did. One grep answers it in seconds.
- **Still open from 16a:** the eighteen hard-bounded literals in `scan.py`. `stemaudit.py` covered
  again — three hits this batch, all false positives (`Hello`→`hell`, `massaged`→`massa`,
  `insanely`→`insane`).
- ⚠️ **The five absent stems from §18h have not been worked in three batches.**
