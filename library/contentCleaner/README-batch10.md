# Batch 10 — TypeThatBook EPUB cleanup

**Instance:** Thorowgood · **Date:** 2026-08-06 · **Book:** 1 · **Sites:** 21

## Files

| File | What it is |
|---|---|
| `franklin-w-dixon_the-tower-treasure-claudeCleaned.epub` | Ready to import |
| `HANDOFF-bookclean.md` | Updated master handoff. Replaces the batch-9 copy |
| `README-batch10.md` | This file |

## Edition — checked first, and it's the unrevised one

Colophon says **1927**, and Standard Ebooks first released it 2023-03-28, the quarter
that text entered public domain. So this is the original, not the 1959 Grosset & Dunlap
revision — the *Secret of the Old Clock* situation exactly.

## You were right about the shape, wrong about the scale

You said "probably full of racism." It's 42,085 words and **there is no Tier 1 slur in
the book and no Black character at all.** The eye-dialect detector returned five hits and
every one was a false positive — `cain't` is an old white farmer arguing about touring
cars, `den` is Fenton Hardy's study.

**All of it is Italian, and almost all of it is in one chapter.** Frank and Joe
themselves say nothing racist anywhere; under your villain/hero rule the heroes never
needed protecting, which is why 22 sites did the whole job.

## The interesting part: two Italian characters, opposite rulings

**Tony Prito is a friend.** He's in the gang, he's invited to the celebration supper, and
outside Chapter 15 he speaks plain English. He keeps his accent as a fact — what came out
is his friends laughing at him. Look at what the original is doing with its conjunctions:

> "…contractor, **but** he had not yet been in America long enough to talk the language
> without an accent, **and his attempts were frequently the cause of much amusement to
> his companions.** He was quick and good-natured, **however**…"

The *but* and the *however* frame his accent as a defect he compensates for. Removing
three conjunctions removes the whole apology. He's now just a good-natured kid with an
accent.

**Rocco the fruit-seller is a type** — "a simple, genial soul, who believed almost
everything he heard and, **like most of his countrymen**, he was of an excitable nature,"
arm-waving, gabbling, and the mangled English *is* the joke. That's Jeff Tucker in a
white apron, so he got the full de-dialect. He stays Italian and keeps his (genuinely
sympathetic) speech about the struggles of building a business in a new country — what
went was "gabbled," "poor," and "like most of his countrymen."

Same book, same ethnicity, twenty paragraphs apart, opposite calls. I put it in the
handoff as the teaching example for that boundary.

## The Black Hand prank — reframed to the movies

Seven references to the Black Hand, including Tony proposing it about his own country
("If we were in Italy we could get the Black Hand to help"). All now **gangsters**, and
the opener is **"If we were in the movies"** — your wording, and better than my
"storybook," which you were right to say no kid would use.

It turned out to be period-perfect too: ***Underworld*, the first true gangster picture,
came out in 1927 — the same year as this book.** A Bayport kid reaching for gangster
movies that year is exactly right.

**On your question: the Black Hand was real, but it still shouldn't go back.** *La Mano
Nera* was an extortion racket in Italian-American neighborhoods from about 1890 to the
1920s — a letter demanding money, signed with a black hand, threatening to bomb your shop.
The NYPD ran an Italian Squad against it under Joseph Petrosino, who was assassinated in
Palermo in 1909. Two reasons it stays out:

1. **By your own test it fails.** You said leave it if it was based in Italy. It
   essentially wasn't — the name had Sicilian roots, but the thing itself was an American
   immigrant-neighborhood phenomenon. Tony's "if we were in Italy" is backwards; that's
   Dixon reaching for *Italy = crime*.
2. **Italian shopkeepers exactly like Rocco were its victims.** Bombed fruit stands were
   literal and documented. Putting it back wouldn't make the scene more honest — it'd make
   the prank crueler, with the heroes triggering a real terror that really killed people
   and the victim's panic still played as the joke.

Nothing was lost in the reframe, because the scene's comedy was never Rocco. It's Chief
Collig ordering Smuff to go pour a pail of water on the bomb — *"Me?" … "But I got to
think of my wife and family." "Coward! … only it wouldn't be right, seein' I'm your
superior officer. Bad for discipline."* — and Con Riley dragged off his beat to soak it
twice. Every beat intact, and they still miss the train.

Worth knowing: **Grosset & Dunlap cut Rocco entirely from the 1959 revision.** The
intervention isn't novel; the publisher got there first, for the same reason.

## What you changed on review

- **HB2c — the collar-grab is back.** You were right: Rocco grabbing a boy by the collar
  is temper, and temper is a thing people have. I was de-fanging a character in the act of
  claiming to restore his dignity. Only "poor Italian" and "gabbled off prices" went.
- **HB4 — withdrawn. Phil keeps his "Oi!"** Wrong on my part twice over: it's a live
  general-purpose interjection, and unmarking the only Jewish kid in the book to sand off
  one cheerful word is the Thomas Johnson cost paid for much less reason.
- **HB3 — the movies and gangsters** throughout, per above.

That's 21 sites, down one from what I first proposed.

## Verification

Rebuilt from the pristine source after your review — not patched on top of the earlier
build — so the reverse-diff is a real check rather than a check of a check.

- Dry run **21/21, 0 misses**
- Residual scan clean; `Oi` correctly still present
- XML well-formed 28/28 spine files
- `<p>` parity 1612 → 1613 (+1 = the classroom-edition note)
- OPF **byte-identical**
- Reverse-diff **byte-identical** on all 6 touched files
- Battery run twice, including once re-extracted from the shipped `.epub`

Three things the battery caught during the first build, none of them from the pre-edit
scan: the residual scan found the planning scene I'd read past; `<p>` parity found a
title-page note that silently never applied (SE wraps middle initials in `<abbr>`, so my
anchor matched nothing — and the reverse-diff had passed that file as "byte-identical,"
which is true and meaningless when undoing a no-op); and the dry run found an italic tag
inside a quoted line.

## On the process

I shipped before you'd seen the table, and that was the wrong order. I've written the
review round into the workflow section of the handoff as a hard stop rather than a step,
with your reasoning attached — three of the four things you changed were ones I'd flagged
as my own highest-judgment calls, which is exactly what the round is for. Next book, you
get the table first.

## Next

The other three 1927 Hardy Boys are all public domain now — *The House on the Cliff*,
*The Secret of the Old Mill*, *The Missing Chums*. Same Bayport, same gang, and **Tony
Prito and Phil Cohen recur**, so I'd want to apply the Tony ruling consistently or he'll
read differently book to book. Expect a fresh ethnic walk-on in each; Rocco's slot looks
like a series fixture rather than a one-off.
