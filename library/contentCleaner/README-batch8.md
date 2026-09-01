# Batch 8 — TypeThatBook EPUB cleanup

**Instance:** Thorowgood · **Date:** 2026-08-06 · **Books:** 2 · **Sites:** 24

## Files

| File | What it is |
|---|---|
| `mary-roberts-rinehart_the-circular-staircase-claudeCleaned.epub` | Ready to import |
| `hildegard-g-frey-campfire-girls-in-the-maine-woods_g-claudeCleaned.epub` | Ready to import — **but read CF-A below before you stage it** |
| `HANDOFF-bookclean.md` | Updated master handoff. Replaces the old copy |
| `README-batch8.md` | This file |

## What changed

**The Circular Staircase** (Rinehart, 1908, Standard Ebooks) — **16 sites.**
Thomas Johnson, the Black butler, is a real character — he has a motive, makes a
choice, is wrong about it, holds two of the three physical clues, and his death is
the hinge of the plot. So his dialect is untouched. Every racial site in the book
belongs to the *narrator*, to the detective, or to Halsey, and all of them are fixed:
the "one part thief, one part pigment" line, the "old negroes who cling to the
traditions of slavery days" line, "those darkies seldom have a penny," Halsey's joke
about not being able to see Sam Bohannon in the dark, and "showing his white teeth
through the darkness." Plus the printed "only good Indian" proverb, three
`ejaculated`, and a small profanity cluster.

**The Camp Fire Girls in the Maine Woods** (Frey, 1916, PG #18606) — **8 sites.**
A line of coon-song titles sung at camp, "Mammy Moon," one `savage Mingoes`, three
`gay`, one `boob`, one `cocky`.

## Two things worth knowing

**ST6 — settled, and it's now a rule.** Thomas is marked **once**, at his first
appearance in Chapter 1 (`the Armstrongs' Black butler`), and unmarked everywhere
after (`the old butler says`, `the old man turned with quiet dignity`). Three
markers in a 70,000-word book was period habit, not information. The Chapter 12
line still does its work — the reader has known since Chapter 1, so `the old man
turned with quiet dignity to Halsey` reads exactly as Rinehart meant it, without the
label. This supersedes the older unmark-everything approach for any character with a
name and a part to play; full unmarking is now just for walk-ons.

**CF-A — the Camp Fire book's problem is its premise, not its vocabulary.** The
girls' names, the group name (Winnebagos, which is in the title and can't be
touched), the Council Fire, ceremonial doeskin gowns, wampum, honor beads, playing
at braves and chieftains — that's the book and the real organisation, not a passage
to excise. I left all of it. Worth knowing before you decide: the treatment is
admiring rather than mocking. No war paint, no squaw, no tomahawk, no broken
English anywhere in it, and the one Native legend it tells is a real Oneida story
with an Oneida woman as the hero. The question isn't what to edit; it's whether you
want the premise in front of sixth graders. Answer it once and it covers the rest of
Frey's series.

## Verification

Both books passed the full battery, run twice — once on the working copy and once
re-extracted from the shipped `.epub`:

- Dry run **24/24, 0 misses** (every edit string count-asserted against raw XHTML)
- Residual scan clean; deliberate residuals documented in the handoff
- XML well-formed — 39/39 and 4/4 spine files
- `<p>` parity 1669→1670 and 868→869 (+1 each = the classroom-edition note)
- OPF **byte-identical** in both books — `slugify()` is safe, no orphaned bookmarks
- Reverse-diff **byte-identical** on all 17 touched files
- `mimetype` first and stored; zip integrity OK

## Scanner bug found and fixed

My eye-dialect detector reported **0 hits** on *The Circular Staircase*. The real
count was 9, including the marker for the only Black character in the book.
`re.findall` on a pattern containing capture groups returns the groups, not the
matches — so every branch without a group came back as an empty string and got
filtered away. Fixed to `finditer`/`group(0)`, both books rescanned. This is worth
knowing because it's the first failure that produced a **false clean result** rather
than an obviously partial one: a capped output looks capped, but a zero looks like
good news. Details in the handoff, section 8a.

## Not done

The `customFlaggedWords` blocks still aren't pasted into `settings/languageFilter` —
open since batch 3, and batch 8 adds a warning to that section about the `findall`
bug, since whatever runs those patterns will hit it too.

## Next

*Count of Monte Cristo* is next in the queue and over 1 MB. It's a French novel in
Victorian English translation, which is exactly the shape the batch-4/7a rules were
written for — **check which translation before staging it.** The common public-domain
English text carries racial language the French doesn't, and Haydée's storyline
involves slavery directly, so it needs a scene-level read rather than a word scan.
Send the file when you're ready and I'll check the translation first.
