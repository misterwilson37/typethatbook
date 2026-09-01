# Batch 9 — TypeThatBook EPUB cleanup

**Instance:** Thorowgood · **Date:** 2026-08-06 · **Book:** 1 · **Sites:** 73

## Files

| File | What it is |
|---|---|
| `alexandre-dumas_the-count-of-monte-cristo_chapman-and-hall-claudeCleaned.epub` | Ready to import |
| `HANDOFF-bookclean.md` | Updated master handoff. Replaces the batch-8 copy |
| `README-batch9.md` | This file |

## The headline

**462,037 words — four times the size of anything else in the corpus — and one Tier 1
slur in the whole book**, spoken by a nameless thief in a holding cell. For an 1846
translation that is much better than the period predicts, and it's worth saying plainly
rather than manufacturing work. The translation is Chapman and Hall 1846, the anonymous
English text nearly every English reader has met, and for once Standard Ebooks credits
it in the metadata, so the translation check took thirty seconds.

## What changed — 73 sites

**The racial and ethnic work (23 sites).** The one `nigger`; two `negro`; four
`gypsies` (the child-stealing libel three times, plus the Catalan fishermen as "gypsies
of the sea"); the South Seas `savages`; Morrel's `infidels`; the "old Jews" simile; the
Leghorn jeweller unmarked four times; and the person-referring `Oriental` split seven
ways — object-referring uses like Oriental carpets and an Oriental feast all stay.

**Vocabulary (50 sites).** `gay*` ×28, the biggest cluster we've done, with no
substitute used more than twice. `ejaculated` ×4. Six `cock*`, of which the one that
mattered was Cocles the cashier being glossed as "Cock-eye." A `wench`, a `strumpet`, a
`parcel of country boobies`, a `fagged`. The catalogue of Turks, Persians and Iroquois
as torturers. And eight Victorian-register words that are genuinely sexual in context —
four in Franz's hashish dream, four in the Carlini and Rita story.

## Your two rulings, and where they landed

**"Heroes don't get to be racist if we can help it."** The proof case is Maximilian
Morrel saying Heaven forgave him because `the victims of my sword were infidels`. He's
a French officer talking about Arab dead, and he's a hero — he gets the girl and the
last scene of the novel. Now reads `were the enemy`. A villain could have kept that
line; he doesn't get to.

**"Don't gloss over slavery; make sure the text treats enslaved people with respect."**
So Ali's Chapter 46 passage stays — the Count calling him "a mere slave, a dog" he would
kill, and Ali kissing his hand. And all 19 `Nubian` stay, because stripping them would
leave him a nameless silent servant instead of a man from somewhere. The institution is
ugly; Dumas's portrayal of Ali is not — he hunts lions, stops a bolting carriage with a
lasso, furnishes a Paris house to a taste the Count trusts absolutely, and leaves a room
on tiptoe so as not to disturb a reverie. Haydée's slavery is likewise untouched and
untouchable: the slave-merchant's receipt read aloud in the Chamber of Peers is the
evidence that destroys Morcerf.

Both of those went into the handoff as top-level rules, not book notes. They decide more
cases than anything else in that document.

## Verification

- Dry run **73/73, 0 misses on the first pass** — the first book in nine batches where
  nothing was hiding
- Residual scan: 10 residuals, **every one deliberate and individually checked**
- XML well-formed — 122/122 spine files
- `<p>` parity 14549 → 14550 (+1 = the classroom-edition note)
- OPF **byte-identical** — `slugify()` safe, no orphaned bookmarks
- Reverse-diff **byte-identical** on all 43 touched files
- Full battery run twice: once on the working copy, once re-extracted from the shipped
  `.epub`

## Kept, with your sign-off

The hashish chapter, the Roman execution, the Carlini and Rita story, and the suicide
thread — which is heavier than *Frankenstein*: Morrel's attempt is staged in real time
in Chapter 30 with the pistol ready and the clock running, and the Count's final lesson
is built on it. All in, all flagged in the handoff so a future instance doesn't
re-litigate them.

One thing you may already know but I wanted on the record: Dumas's grandfather was born
enslaved in Saint-Domingue, and Dumas himself was mixed-race and mocked for it in his
lifetime. It changed none of the rulings above. But given how the Ali question went, it
felt like the fact you'd want.

## Next

**The first Hardy Boys — send the file when you're ready.** *The Tower Treasure*, and
the edition question is the whole game: only the **1927 original** is US public domain,
and the 1959 revision isn't. That means we'd be working from the unrevised text —
exactly the *Secret of the Old Clock* situation, where Grosset & Dunlap rewrote the
racial material themselves in the revision because it was indefensible. **Expect a Jeff
Tucker.** I'll check the copyright page and chapter count first, run the eye-dialect
detector early, and read every servant and comic-minor-character line regardless of what
the scanner returns.
