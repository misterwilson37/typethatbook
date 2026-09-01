# README — bookclean batch 25 (Whatman)

**Date:** 2026-08-28
**Instance:** Whatman (James Whatman, papermaker — first name in the new series; the typefounder
well went dry in batch 24)

## What shipped

| Book | Outcome |
|---|---|
| *The Phantom of the Opera* (Leroux 1910, trans. Teixeira de Mattos 1911, SE, PG #175) | **DECLINED by Jake.** Third decline in the corpus; first on **scope**. |
| *Captains Courageous* (Kipling 1897, SE, PG #2186) | ✅ **CLEANED AND SHIPPED.** 20 judgment rows + 613 typability substitutions. |

`rudyard-kipling_captains-courageous-claudeCleaned.epub`

### Captains Courageous — what changed

- **6 n-word sites.** Four are Dan's (a sympathetic hero), two the narrator's. Rule 9 and 14g,
  not vocabulary, dispose of all six.
- **3 `negro`/`negroes`**, both sites defining labels (14b). `jet-black` kept — it is Kipling's
  physical description and the sentence's point.
- **2 `Chinaman`** — and they are not the same word. One is a railway worker; **the other is a
  SHIP** (a China-trade vessel). Both fixed under 23c: the standard is the room.
- `Dagoes`, `gypsies`, `Red Indian`, **3 `gay*`**.
- **4 source-corruption rows.** ⚠️ `Aeneid` ×3 is a corruption of `Ain't` — a correctly-spelled
  real word in a valid position, so invisible to `quality.py`, every scan block, and a modern
  spellchecker. Plus `accomodate`.
- **613 typability substitutions** via the new `typefix.py`. `measure.py typable` on the packaged
  file returns **none**.

### What deliberately did NOT change

- ⚠️ **The dialect, entire.** 412 respellings, 379 g-dropped participles, 1,901 apostrophe
  events. Jake: *"Keep the dialect."* **Now asserted at count in `verify.py` LEAVES**, so a later
  pass that flattens it FAILS the battery.
- ⚠️ **The cook's `Master — man` servant arc.** Jake: *"keep the structure."* Documented in §S of
  the edit table. **A clean token list plus an uncomfortable ending is a RULING, not an
  oversight.**
- 7 named reasoned exceptions in §X, including the ch. 10 memorial roll's `coloured` — every
  other entry reads name/age/status/place, and removing his would make the list uniform and
  erase that the record itself segregated him.

### Verification

All 9 `verify.py` checks pass. Round-trip re-scan of the **packaged** EPUB: 0 residual, 0
untypable, DEFECTS none, and **every chapter reproduces from source + edit table alone**.

## Tool changes — read `TOOLKIT.md` §BATCH 25 for the full write-up

| File | Was | Now |
|---|---|---|
| `measure.py` | 1.0.0 | **1.1.0** |
| `scene.py` | 1.0.0 | **1.1.0** |
| `quality.py` | `VERSION` said 1.2.0, table said 1.3.0 | **1.3.0**, and they agree |
| `scan.py` | §16a open since batch 16 | **§16a closed**, `--selftest` added |
| `typefix.py` | — | **NEW library tool, 1.0.0** — untypable-character normalisation |
| `pack.sh` | TOOL_COUNT 13, 3 selftests | **14 tools, 5 selftests** |

### Four bugs, three of which failed silently

1. **`measure.py spine()` regexed the attribute pair `id=...href=...`.** Standard Ebooks writes
   `href` first, so on every SE book the manifest map was empty, all spine items printed `?` and
   `0 words`, and the report ended `total spine words: 0` **with no error**. Fourth SE-specific
   break after the three in 23a. All OPF parsing now goes through one `_manifest_map()`, and an
   unresolved idref now raises instead of printing a zero.
2. **`measure.py` ARCHAIC contained `\ban\b(?= [a-z]+ [a-z])` — the indefinite article.** 179 of
   Phantom's 210 "archaic" tokens were `an inquiry`, `an effort`, `an event`. ⚠️ **Every
   archaic-density figure the project has published is inflated by ~2/1,000 and all pre-25
   figures are WITHDRAWN.** `art` and `marry` were also firing on the modern noun and verb.
   Orderings are intact; **no book was staged wrongly.** Trustworthy figures: Phantom 0.2,
   Captains Courageous 2.4. Mean-sentence figures unaffected.
3. **`scene.py` RESPELL contained bare `\bde\b`** → 147 hits on Phantom, all `de Chagny`. Now
   `\bde\b(?! [A-Z])`; 147 → 1.
4. **`quality.py` `VERSION` lied.** The batch-23 SE fix was present and working; only the
   constant said 1.2.0, while TOOLKIT told the next instance to require ≥1.3.0.

### New: `NAMEDBY` probe (`scene.py`, seventh probe)

Counts a character referred to by a **group noun** — `the Persian`, `the Portuguese`, `the
Chinaman`. Floor 8; at or above it, prints **NAMING DECISION**. Written because Phantom calls a
major sympathetic character `the Persian` 157 times and never names him, and **neither `scan.py`
nor `gapcheck.py` carries the term.** Counts rather than quotes: `the Italian` once is a
description, ninety times is a name — ST6 at book scale.

### §16a closed, and why it took nine batches

THE REGEX RULE prescribes `\w*`, but **`\bass\w*` matches *assistant, assume, assembly,
assassin***. The rule is right for `gay`/`cock` and wrong for a short word that prefixes a common
one. The gap §16a actually named was **plurals**, so `plural()` + `PLURALISE` adds exactly those,
across **every** block (the bounded literals are also in MINSTRELSY, TIER1_CORE, EYE_DIALECT and
DISABILITY). `peckers` matches; `assistant` does not. Scan totals on both batch-25 books were
**unchanged** — coverage without noise.

`python3 scan.py --selftest` — 28 cases, **both directions**.

### Selftests now actually run

All three reported **0 cases** on arrival (the batch 17–19 reference books have been absent since
batch 22). Each now carries current-batch rows:

```
measure.py selftest      4/8  pass
quality.py --selftest    4/12 pass
scene.py  --selftest     2/16 pass
scan.py   --selftest     28   pass   (new)
```

`scene.py` selftest cases now accept an optional 4th element, a **ceiling** — previously a case
could only assert "the probe still fires", which cannot express "and not 147 times".

## Verify on arrival

```bash
tar -xzf bookclean-kit-batch25.tar.gz
cd bookclean-kit-batch25 && sha256sum -c MANIFEST.sha256
ls -1 *.py | wc -l          # must be 13
```

## ⚠️ One question that needs Jake before the next Standard Ebook

Standard Ebooks wraps every ellipsis as `U+FEFF` + `U+200A` + `…` (zero-width no-break space,
hair space, single-glyph ellipsis). Phantom had 953 of them — **4,611 characters no student can
key, one every 18 words.** Captains Courageous has 633, so it is a per-book property.

**Does TypeThatBook normalise these at import?** If yes, the problem disappears. If no, it is a
formatting deliverable on its own, and it is invisible to every other check in the kit.
