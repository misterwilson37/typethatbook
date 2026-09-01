# README — TypeThatBook bookclean, batch 17 (Ronaldson)

**Date:** 2026-08-08
**Scope:** a **revert batch**. No new titles. Eight already-shipped books re-greped against two
rules that were widened *after* those books shipped.
**Result:** 22 edits across 6 books, ~1,076,000 words. 2 books scanned clean and were left alone.

---

## What this batch was for

Two standing rules had been widened but never applied backwards:

1. **`damn*` — always fix, including the theological sense.** Widened by Jake in batch 16.
2. **`intercourse` — always fix.** Ruled in batch 6, silently lost by batch 9 because the term
   was never written into a pattern block.

Batch 16 logged both as REVERT PENDING and audited for damage. **That audit was scoped to batch
16's own three books and then generalised to the whole corpus.** Batch 17 re-greped six earlier
titles and found three live `damn*` in *Jane Eyre* plus twelve more `intercourse`.

---

## Results

| Book | `damn*` | `intercourse` | Edits | Shipped |
|---|---|---|---|---|
| Pollyanna | 1 | 0 | 1 | ✅ new file |
| The Count of Monte Cristo | 1 | 5 | 6 | ✅ new file |
| Frankenstein | 0 | 6 | 6 | ✅ new file |
| Jane Eyre | **3** | 4 | 7 | ✅ new file |
| Daddy-Long-Legs | 0 | 1 | 1 | ✅ new file |
| Jeeves Stories | 0 | 1 | 1 | ✅ new file |
| Dracula | 0 | 0 | 0 | ⬜ **unchanged, not repackaged** |
| Little Women | 0 | 0 | 0 | ⬜ **unchanged, not repackaged** |

A book that did not change does not get a new file. Rebuilding an EPUB with no content change
risks the OPF id and the students' chapter pointers for zero benefit.

---

## Files in this delivery

| File | What it is |
|---|---|
| `HANDOFF-bookclean.md` | updated handoff — read this first next session |
| `scan.py` | ⚠️ **CHANGED.** `SEXUAL_REGISTER` now carries an `intercourse` pattern (verified firing); `commerce`/`converse` never existed here and still doesn't |
| `edits.py` | batch-17 edit table (**data, not carry-forward** — keep the shape, replace rows) |
| `apply.py` | asserted applier; clones `BOOK/` → `BOOK-clean/` then edits the copy |
| `verify.py` | ⚠️ **CHANGED.** six checks now; check 6 (untouched-file drift) is new |
| `pack.py` | repackager; `mimetype` stored first, uncompressed |
| 6 × `*-claudeCleaned.epub` | the shipped books |

`dump.py`, `ctx.py`, `stemaudit.py` are **unchanged** from batch 16 and are not re-shipped.

---

## Reproducing the build from scratch

Requires Python 3 (stdlib only) and `unzip`. No dependencies, no setup.

```bash
# 1. unpack each source EPUB into a directory named for the book key used in edits.py
#    keys: pollyanna monte daddy frank jeeves eyre
mkdir -p eyre && (cd eyre && unzip -q ../charlotte-bronte_jane-eyre-claudeCleaned.epub)

# 2. dump spine-ordered text (reads the OPF; never sorts filenames)
python3 dump.py eyre/epub/content.opf > eyre.txt

# 3. audit the PATTERNS before reading the book
python3 stemaudit.py eyre.txt

# 4. scan
python3 scan.py eyre.txt

# 5. read the paragraph around every hit
python3 ctx.py eyre.txt '\bintercourse\b'

# 6. DRY RUN — counts every edit string against raw source, asserts expected == found
python3 edits.py                    # must print "DRY RUN: PASS" before going further

# 7. apply (asserted per edit; aborts the book rather than shipping a partial)
python3 apply.py                    # NEVER filter this output

# 8. verify — six checks
python3 verify.py                   # must print "BATTERY: ALL CHECKS PASS"

# 9. repackage
python3 pack.py

# 10. round-trip: unpack the SHIPPED epub and re-scan it
```

Step 10 is not optional. Verifying the directory you edited is not the same as verifying the
file you hand over.

---

## Verification actually run

- `stemaudit.py` — clean on both staged books (`Marseilles`, `Gothic`, `massacre`, `bravest`:
  noise)
- **dry run — 22/22, 0 misses**
- residual `damn*`/`intercourse` — **0** in all six
- XML well-formed — **379/379 files**
- `<p>` parity — **+0 on every book** (⚠️ a revert batch expects +0, *not* the template's +1;
  these books already have their title-page note)
- OPF — **byte-identical on every book**
- reverse-diff — byte-identical on all **20** edited files
- untouched-file drift (new) — **359/359 identical**
- EPUB structure — `mimetype` first + stored + correct string + CRC ok, all six
- round-trip on the packaged artifacts — `damn*` 0 / `intercourse` 0, all six

---

## ⚠️ One thing carried forward that needs Jake

1. **The grep is 8 books done, 16 to go.** Every remaining title in the corpus is still
   unverified against both widened rules. One grep per book; needs only the shipped EPUBs.

**Closed, not carried forward:** the `commerce`/`converse` pattern is **deleted**. Never in any
script, 26/26 innocent, no book ever edited for it in seventeen batches. See handoff 17e for the
one-line lesson.
