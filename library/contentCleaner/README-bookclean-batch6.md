# Classroom Edition — Batch 6

| File | Source | Sites changed |
|---|---|---|
| `jane-austen_pride-and-prejudice-claudeCleaned.epub` | Standard Ebooks | 11 |
| `jane-austen_northanger-abbey-claudeCleaned.epub` | Standard Ebooks | 16 |
| `eleanor-h-porter_pollyanna-claudeCleaned.epub` | Standard Ebooks | 26 |

All three carry a one-line note under the byline. Metadata, front matter, and file structure
unchanged, so each overwrites its original in `admin.js` rather than creating a new entry.

---

## The short version

**Both Austens are near-*Alice* clean.** Pride and Prejudice contains no Tier 1 language at
all — no `ejaculat*`, no `cock*`, not one `damn`, `hell`, or `devil` in 121,000 words. Its
eleven edits are one noun, three `gay`, six `intercourse`, and one `seduction`.

**Pollyanna had the only real decision in the batch, and it wasn't a word.** See below.

---

## The scan missed thirteen tokens, and the reason is new

The `gay` stem found 3 tokens in Pride and Prejudice and 4 in Northanger Abbey. The actual
count across the two books is 20. The missing thirteen are spelled **`gaily`, `gaiety`,
`gaieties`** — these are en-GB texts, and British orthography drops the `y`.

`gay\w*` cannot see any of them. This is the batch-4 romanization gap wearing a different
hat: **the scan list needs spelling variants, not just word stems**, and the variant that
bites you is whichever one your source's house style happens to use. *Little Lord
Fauntleroy* was American and spelled it `gayly`/`gayeties`, which the stem caught. Two
British books in a row would have sailed straight past.

You ruled these stay (PP5/NA10) on your own `chink` logic — the letters `g-a-y` never
appear on screen — so nothing was edited. But a scan that can't see a word can't tell you
that, which is the whole point.

## The inverse of the eye-dialect problem

Batch 5's lesson was that innocent-looking spelling can hide a slur. Northanger Abbey is
the mirror image: **three words that are completely innocent by meaning and unusable by
spelling.**

- `niggardly` — Norse root, means stingy, no etymological relationship to the slur whatsoever
- `fag` — Mrs. Allen means a slog, a tiring errand
- `faggot` — a bundle of firewood, which is exactly what the servant is carrying

None of these is a slur. All three are catastrophic read aloud by a sixth grader. This is
your `chink`-meaning-money rule generalized: **the word on screen is the word on screen**,
and etymology is not a defence in a classroom. They're now standing filter terms.

## Pollyanna: `heathen` ×12

Not a vocabulary problem — a running gag with a payoff. Nancy tells Pollyanna that the rich
recluse is "saving it for the heathen"; Pollyanna believes it for eight chapters; Pendleton
finally snaps *"There is no money for the heathen. I never sent a penny to them in my
life."* Running parallel is the Ladies' Aid refusing Jimmy Bean because a local orphan earns
no credit in the India report.

Your batch-4 ruling left `heathen` in *Heidi* **where it meant godless rather than
foreign.** All twelve of Pollyanna's are the foreign sense, so they fell outside that
exception and went to you rather than being decided here.

The fix turned out cheap because **Porter is already on our side** — her target is the
Ladies' Aid, never the people in India. `heathen` → `missions` ×8, `heathen countries` →
`faraway countries` ×2, and two recasts. Every joke survives, including Jimmy Bean's *"I
ain't a mission or a new carpet,"* which is the best line in the chapter.

`little India boys` and `Hindu missions` were left. They're Pollyanna's and the Ladies'
Aid's own phrasing, they're the *object* of the satire rather than its voice, and `Hindu`
is simply the correct current term.

## Two structural checks on Pollyanna, both clean

**Nancy is a character, not a type.** She's a servant with heavy dialect, so the batch-5
rule required reading her. The eye-dialect detector returned **zero hits across the entire
book** — her speech is regional New England (`ter`, `jest`, `a-savin'`, `hain't`) with no
respelled racial markers and no race attached anywhere. She supports a family, has a suitor,
and is right about Miss Polly when nobody else is. **Dialect kept whole, no edits inside
it.** Old Tom likewise.

**No staged entertainment.** The only two triggers in the book are Jimmy Bean saying the
orphanage would "pretend" he couldn't leave, and Pollyanna putting a lace shawl on her aunt.
Both read in full, both clean.

Worth knowing: Pollyanna's accident is carried entirely by `paralysis`, `invalid`,
`helpless`, and `walk again` ×12. **No `cripple` and no `lame` anywhere in the book.**
Porter got there without them in 1913.

---

## Verification

- 53 substitutions staged, 53 found, **0 misses on the dry run.**
- Residual scan across ~26 patterns per book. Every edited term at zero. Survivors are all
  deliberate keeps: `coloured`/`colored` ×14 (blushing in all three books, plus one lot of
  worsted yarn), `savage` ×1 (adjectival, the doctor), `injunction` ×3.
- XML well-formed — 66 files P&P, 39 NA, 39 Pollyanna.
- `<p>` parity 2057 → 2058, 1042 → 1043, 1970 → 1971 (+1 each = the note).
- OPF byte-identical, all three.
- Repackaged with `mimetype` stored first and uncompressed; container test OK.

---

## Notes for next time

**`/\bcolo(u)?red\b/` is noise outside its home book.** It fired 14 times across these three
and was wrong every single time — blushing in Austen, blushing and yarn in Porter. It
earned its place on *The Secret of the Old Clock* and should stay in the filter, but expect
zero signal from it on any British or New England text.

**Austen is safe to stage in bulk.** Two books, 199,000 words, and the total Tier 1 content
is one `savage` and two `as rich as a Jew`. *Emma*, *Sense and Sensibility*, and
*Persuasion* should behave the same way; budget for `gay`, `intercourse`, and `ejaculat*`
and little else. Check each one for surface-form landmines like `niggardly` — that's the
category the word lists don't catch.

Still not pasted into `settings/languageFilter`: every block from batches 3, 4, 5, and 6. No
`admin.js` change needed — settings blob only.
