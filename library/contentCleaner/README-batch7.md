# Classroom-Cleaned EPUBs — Batch 7

Three public-domain books prepared for **TypeThatBook**, where students type along with a real
book. The goal is a text a sixth grader can read aloud in class without hitting a slur.

**This is rewriting, not censorship.** The ELA teacher wants to talk about the language; the
typing teacher just needs them to type. Every change below is documented, reversible, and
counted.

## Files

| File | Source | Edits |
|---|---|---|
| `carlo-collodi_the-adventures-of-pinocchio-claudeCleaned.epub` | Standard Ebooks (Murray 1892 translation) | 6 sites, 15 tokens |
| `donald-ferguson-chums-of-scranton-high-at-ice-hockey_g-claudeCleaned.epub` | Project Gutenberg #13250 | 8 sites, 10 tokens |
| `kate-douglas-smith-wiggin-rebecca-of-sunnybrook_g-claudeCleaned.epub` | Project Gutenberg #498 | 11 sites, 31 tokens |

Each carries a one-line note on its title page saying it is a classroom edition. Original
files are untouched; these are new files with `-claudeCleaned` appended.

## What changed

### Pinocchio
Nearly clean. The one real issue is the translation: Mary Alice Murray's 1892 English renders
Collodi's *Paese dei Balocchi* — Land of **Toys** — as the **"Land of Boobies."** Nothing in
the Italian is objectionable, so Collodi's own name for the place has been restored throughout
(10 occurrences, including the table of contents and the chapter heading). Beyond that: four
`cock`/`cocked` forms, two `gay`, and one `asses` → `donkeys`, which is the word Pinocchio's
own narrator uses everywhere else.

Left alone on purpose: `lame` and `crippled` (specific and plot-bearing — the Fox's feigned
paw, the donkey lamed for life), `Indian corn` (maize), `naked eye`, `simpleton`.

### The Chums of Scranton High at Ice Hockey
One buried problem in an otherwise clean sports story. In Chapter XVI Deacon Winslow tells a
fireside joke about startling three Black musicians in the dark woods with a new electric
torch; they flee believing they've seen a ghost, and he calls them "the poor ignorant chaps."
The racial marking has been removed — three men from the barn-dance band, spooked by a
flashlight — which keeps the joke and the plot beat that follows. Also: a "colored wash-lady"
unmarked, four `ejaculated`/`ejaculation`, one `loins` → `waist`, and "beats the Dutch" →
"beats everything."

### Rebecca of Sunnybrook Farm
The heaviest of the three, and the most interesting. Wiggin writes decent, ordinary people
saying ordinary period-ugly things, which is exactly what makes it a good ELA book and a
tricky typing book.

Fixed: the neighbour's first description of Rebecca (`black as an Injun`, plus the phrase next
to it that was carrying the sting); `black-haired gypsy`; a narrator's nod to the "only good
Indian" saying; a children's war game against "hostile Indians"; two lines of Rebecca's
missionary poem; one description of people in hot climates as "lazy and slow"; sixteen `gay`
family tokens; eight `ejaculated`; and one `fagging`.

**Deliberately kept:** the entire missionary and `heathen` thread, including both hymns. That
language is church-goers talking about non-church-goers, mostly inside quoted verse, and
removing it would flatten what Wiggin is actually satirizing — Riverboro's stinginess, not
Syria. The one exception fixed was Rebecca imagining "the heathen mothers who cast their babes
to the crocodiles in the Ganges," which describes real people rather than church business.

Also kept: the Wordsworth epigraph on the dedication page (front matter never reaches the
typing app), Rebecca's sister **Fanny** (a character name, and the naming joke in Chapter I
depends on it), `cripple`, `idiot`, `queer`, and the metaphorical uses of `slave`.

## How it was verified

1. **Dry run** — every edit counted against the raw XHTML before anything was written. 56/56 matched, 0 misses.
2. **Residual scan** — re-scan of the finished text for every always-fix term. Clean, with one deliberate exception (the Wordsworth epigraph in *Rebecca*).
3. **XML well-formedness** — every file in all three books parses.
4. **`<p>` parity** — each book gained exactly one paragraph: the title-page note.
5. **OPF byte-identical** — no metadata touched, so TypeThatBook overwrites the same book rather than creating a new one and orphaning student progress.
6. **Reverse-diff** — every edit undone on the shipped file and compared byte-for-byte to the original. All 17 touched files came back identical, which proves nothing *unintended* changed.

## Importing

Drop each `.epub` into TypeThatBook's admin importer as usual. Because the OPF metadata is
unchanged, importing a cleaned file over an existing copy of the same book updates it in place
and keeps every student's stored chapter position.

## If you disagree with a call

Every change is listed by number in `HANDOFF-bookclean.md` under RESULTS (prefixes `PN`, `SH`,
`RB`). Any single one can be reverted in one line.
