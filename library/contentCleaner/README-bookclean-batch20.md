# Batch 20 — README

Toolkit rebuilt to 13 tools (see `TOOLKIT.md`), then two cleaned EPUBs.

## Deliverables

| File | Result |
|---|---|
| `gene-stratton-porter-girl-of-the-limberlost_g-claudeCleaned.epub` | 33 edits, incl. one scene reframe |
| `margaret-burnham-girl-aviators01-and-the-phantom-airship_g-claudeCleaned.epub` | 3 edits, clean |
| `HANDOFF-bookclean.md` | master handoff, batch 20 merged in |
| `edits.py` / `apply.py` / `verify.py` / `frontmatter.py` | this batch's table and harness |

Both books are import-safe: OPF byte-identical, nav/ncx skeleton identical, mimetype stored first.

## A Girl of the Limberlost (Stratton-Porter, 1909, PG #15143) — 33 edits

123,233 words. No literal slur anywhere in the book — every edit is surface-form
(`ejaculated`×6, `gay`×6, all always-fix regardless of sense), one profanity (`damn`, widened
rule), and one full scene reframe.

**Ch. 25 was "playing Indian," now "playing pirates."** Four kids dress up, smear themselves
with berries, go "on the warpath," joke about burning "tribes" at the stake, steal a motorcar,
and nearly drown. No Tier 1 vocabulary in it — a scan-only pass would have shipped this clean.
Jake's read: *"If kids are running around being racist, I'd rather them not. If there are no
negative consequences for it, then it's shown as a good thing."* The book disciplines the
reckless driving, never the costume premise — that asymmetry is the actual problem, not any one
word. Since the premise was swappable and nothing in the plot depended on it being specifically
"Indian," reframed the whole scene as pirates rather than choosing between "cut" and "leave
standing." Full walkthrough and the complete before/after table: HANDOFF §20j, `edits.py` rows
CH25a–q.

**Left alone in the same chapter:** Elnora's "stealthy Indian canoes" line (frontier-history
aside, unconnected scene) and the Meshingomesia/Waapimaankwa passage a few pages earlier (real
historical Miami figures, named respectfully). Read the whole chapter before concluding it all
needed work — only one scene did.

**Declined-as-false-positive, worth naming because the count was large:** `brave`×9 (courage, not
"a brave"), `coloured`×9 (moth wings, a dress — this is a nature-study book, colour vocabulary is
everywhere), `Indian`/`Indians`×20 outside ch. 25 (mostly "Indian relics/pipes," a genuine
collectibles subplot), `Huron`×2 (the lake, not the people), `breast`×24 (standing corpus false
positive).

## The Girl Aviators and the Phantom Airship (Burnham, 1911, PG #23393) — 3 edits

45,832 words. Clean book, no judgment calls needed on two of three sites.

**`Chinaman` → `rich man`, not `Chinese man`.** Incidental backstory for a minor character with
zero caricature attached; Jake's question cut straight to it — *"does it matter that he's
Chinese? If it doesn't, then it could just be...rich man."* It doesn't. Dropping the ethnonym
outright beats modernising it when the ethnicity carries no narrative weight. See HANDOFF §20i.

`war dance` → `wild jig` (batch-13 dead-metaphor idiom, same bucket as `pow-wow`/`war whoop`
elsewhere in the corpus) and `gay` → `merry` (always-fix, American spelling) were both clean,
no debate needed.

## A process note that isn't about either book

First table proposed `damn` → "blessed" *or* "cursed," pick one. Jake shut that down directly:
*"why not just make the suggestion then? ... I'm the one who has to deal with the fallout of the
choices, so I need to know what they are."* Presenting a menu isn't collaboration, it's handing
the vetting work back to him unfinished. **Standing rule now: one committed proposed replacement
per edit row, never options.** See HANDOFF §20h — read it before the next batch's first table
goes out.

## Verification

```
limberlost: XML 31/31 | <p> 3095→3095 (+0) | reverse-diff byte-identical (12 files)
            OPF BYTE-IDENTICAL | nav/ncx skeleton IDENTICAL | residual 0/3 whole-book
            ch25-scoped residual 0/5 (Indian frontier-history line intact at want=1)
            ruled leaves 13/13 vs source | note×1 CC0×1
phantom:    XML 29/29 | <p> 1461→1461 (+0) | reverse-diff byte-identical (4 files)
            OPF BYTE-IDENTICAL | nav/ncx skeleton IDENTICAL | residual 0/3
            ruled leaves 10/10 vs source | note×1 CC0×1
```

Both title-page notes rewritten — the prep-tool default ("period racial slurs") overstated both
books; neither has a literal slur. Limberlost's note also names the scene reframe (Crimson
Sweater precedent, batch 3, for when "reworded" alone undersells the work).

## Reverting anything

Every edit is one string or one full-sentence swap; `edits.py` holds the table as data. The
ch. 25 rows (`CH25a`–`CH25q`) are one continuous scene and should be reverted as a block if
reverted at all — they don't make sense individually.

## Forward flags

- ⚠️ **One committed proposal per edit, never a menu — see above and HANDOFF §20h.**
- **Named pattern worth watching for a third instance:** a scene whose *premise* (not just its
  vocabulary) is the problem, where the premise is swappable for a same-shape substitute from a
  different genre. Camp Fire Girls (leave standing) and this book's ch. 25 (reframe) look similar
  on the surface; the discriminator is whether the text attaches any consequence to the premise
  itself. See HANDOFF §20j.
- 41 books remain in the corpus, minus *Penrod* and its two sequels.
