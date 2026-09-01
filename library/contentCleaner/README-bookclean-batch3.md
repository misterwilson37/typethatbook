# Classroom Editions — Batch 3

Three public-domain books prepared for TypeThatBook. Import as normal.

| File | Source | Sites changed |
|---|---|---|
| `bram-stoker_dracula-claudeCleaned.epub` | Standard Ebooks | 40 |
| `ralph-henry-barbour-the-crimson-sweater_g-claudeCleaned.epub` | Gutenberg #33425 | 20 |
| `jean-webster_daddy-long-legs-claudeCleaned.epub` | Global Grey | 7 |

Each carries a one-line note under the byline saying it's a classroom edition. Nothing
else about the front matter, metadata, or file structure changed, so these overwrite
the originals in `admin.js` rather than creating new book entries.

---

## What "cleaned" means here

The goal is a book a 6th grader can type through without hitting something that stops
the room. Not a bowdlerized text — the story, the characters, the dialect, and the
scary parts are all intact. Where a word had to go, it was replaced with something that
does the same work in the same voice.

Violence isn't a flag. Neither is religion, politics, drinking, or anything a student
would recognize as ordinary period exaggeration.

---

## Dracula

Everything you'd expect from the book is still there: the castle, the brides, Lucy's
staking, Renfield, the boxes of earth, the chase down the Borgo Pass.

**The `damn` question, answered.** You remembered *Dracula* leaning on "damn" and
"damned" — it uses each exactly once. What's actually everywhere is `hell` (24) and
`devil` (23), and both are theological rather than profane in this book ("his
hell-home," "callous as a devil"). Those were left alone. The two real `damn`s became
`curse`, which is what your first pass did.

**The main work was `voluptuous`.** Stoker uses it, plus `wanton` and `carnal`, fifteen
times — almost always meaning *predatory appetite* rather than anything sexual. Left
alone it's twelve invitations to a question you don't want to field mid-typing-drill.
Each one got a different replacement matched to its scene: *dazzle, hungry, relish,
coaxing, ravenous hunger, greedy, gliding, eager, warm, beautiful, red, lovely.*

**The Roma.** Stoker calls them `Szgany` thirteen times as a proper name and `gipsy` /
`gypsy` seventeen times in plain English. Everything went to `Szgany` — his own word,
so nothing was invented — which reads to a student as a tribe name and puts no modern
slur on the screen. The one exception is "the Romany tongue," which is the accurate
name of the language and isn't a slur.

**One antisemitic caricature removed.** A one-sentence description of a shipping agent
in Ch. 26. The bribe he takes is still there; the nose-like-a-sheep isn't.

**Mina's scene (Ch. 21) is intact**, with one word added for clarity — "forcing her
face down **to the blood on** his breast" — so the image lands as blood-drinking on the
first read instead of the second.

Also: the roosters crow now instead of the cocks, and Van Helsing exclaims rather than
ejaculates.

## The Crimson Sweater

**Heads up on this one.** Chapters XIII and XIV stage a full blackface minstrel show —
a printed programme with Interlocutor and Bones, a "negro song," and a "Christmas Eve
on the Plantation" sketch with a boy playing Aunt Dinah. None of it is visible to a
word-scanner; it surfaced from reading the chapter.

Rather than cut it, the show was reframed as a generic school variety show. The
programme is now the Ferry Hill Merrymakers with a Master of Ceremonies and Drums, and
the closing sketch is "Christmas Eve at the Lumber Camp." **Every joke and every
pratfall survives**, including the tambourine that lands in Mrs. Emery's lap and the
log cabin roof that collapses on Post. It reads as what it always was underneath —
boys putting on a ridiculous show — with the minstrelsy gone.

Otherwise: "Honest injun" → "Honest and true," two "silly ass" → "silly chump,"
Schonberg is now called a German rather than a Dutchman (he's German), and the parrot
tips its head instead of cocking it.

Kept: "bum show," `cripple`, and the hazing chapter where Roy gets blindfolded and
dropped in three feet of river.

## Daddy-Long-Legs

Barely touched. Seven sites. Two of them — the waiters on the train and Judy's
"I'm not a Chinaman" P.S. — are exactly the edits you'd already made.

The other five: two `Gipsy` (one became "a Spanish dancer," one "a Romany"), one `gay`,
one `ejaculatory`, and the Latin-class pun, where **De Amicitia** is now pronounced
*Dam Icitia* — the joke still works, it just takes a beat.

**Left in on purpose**, both flagged and both your call: Judy's 115-word takedown of
the Semples' inherited Puritan God, and her running Socialist/Fabian thread. The second
one isn't removable anyway — it's woven through six letters and it's where the book's
ending comes from.

---

## Verification run on all three

- Every substitution made with an asserted match count (`expected == found`) — no blind
  replaces.
- Post-edit residual scan across ~60 stems. **This caught six missed `gypsies` tokens
  in *Dracula* that the first pass left behind.** They're fixed; the scan is the reason
  they're fixed.
- XML well-formedness checked on all 140 content files.
- `<p>` count parity: each book +1, which is the title-page note and nothing else.
- OPF byte-compared against the original — titles and authors untouched, so imports
  overwrite cleanly and no student's chapter pointer is orphaned.
- Repackaged with `mimetype` stored first and uncompressed.

---

## Two things for the scanner

Neither is a code change — both are additions to `settings/languageFilter`, listed in
full in `HANDOFF-bookclean.md`:

1. **A minstrelsy group.** *Senegambian*, *Darktown*, *Interlocutor*, *plantation*,
   *cakewalk*, *mammy*, *burnt cork*. The Crimson Sweater proved the gap.
2. **A Victorian sexual-register group**, which is the thing you asked for after
   "voluptuous wantonness": *voluptu-*, *wanton*, *sensual*, *carnal*, *lascivious*,
   *ravish*, *languorous*, *panting/heaving*. The built-in anatomy group is
   modern-clinical, and period English is where the landmines are — the words are
   innocent then and loud now.

Also widened: `cock\w*` (so `cocked` fires too) and `ejaculat\w*` moved from
propose-and-discuss to always-fix.
