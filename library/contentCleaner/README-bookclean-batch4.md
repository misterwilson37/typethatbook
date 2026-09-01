# Classroom Editions — Batch 4

Three public-domain books prepared for TypeThatBook. Import as normal.

| File | Source | Sites changed |
|---|---|---|
| `frances-hodgson-burnett_little-lord-fauntleroy-claudeCleaned.epub` | Standard Ebooks | 27 |
| `johanna-spyri_heidi_elisabeth-p-stork-claudeCleaned.epub` | Standard Ebooks | 3 |
| `mary-shelley_frankenstein-claudeCleaned.epub` | Standard Ebooks | 17 |

Each carries a one-line note under the byline saying it's a classroom edition. Nothing
else about the front matter, metadata, or file structure changed, so these overwrite the
originals in `admin.js` rather than creating new book entries.

---

## What "cleaned" means here

Same as always: a book a 6th grader can type through without hitting something that stops
the room. Not a bowdlerized text. Where a word had to go, it was replaced with something
that does the same work in the same voice.

Violence isn't a flag. Neither is religion, politics, drinking, or anything a student would
recognize as ordinary period exaggeration.

---

## Heidi

**Three sites. This is the cleanest book in four batches — genuinely *Alice* territory,**
and I'd rather say that than pad the list.

**The two that mattered.** The villagers call the Alm-Uncle "a heathen or an old Indian";
he's now "a heathen or an old hermit." **`heathen` stays on purpose** — the whole reason
they say it is that he won't go to church, and his return to the church is the plot of
Book II. Taking it out would cost you the story. "Hermit" is also just true of him.

**The Hottentots rhyme,** your option A. Peter's alphabet book threatens him with:

> And he who makes his Z with blots, / Must journey to the **Ostrogoths**,

Everything downstream still works and one bit works better: Peter's sneer "Nobody even
knows where they are!" is now *correct*, because they're extinct. Heidi still runs off to
ask grandfather, and he still would know.

Third site: "the gay little gnats" → "merry."

**Left alone, and you agreed:** Peter's biggest goat is named the Big Turk (×4, including
"you push me like the Big Turk"). Nothing ethnic happens in any of those scenes. Also left:
Clara's `lame` ×5 and the grandmother's `blind` ×8 — both precise, both the `cripple` rule.
And the devotional content, which is heavy (`God` ×55, hymns, the prodigal son) and is the
spine of Book II.

**On the translation.** I checked `dc:contributor role="trl"` first, per the Pinocchio rule
— Elisabeth P. Stork, 1915. Then I checked whether a different translation would solve it
for free, and it wouldn't: *Hottentotten* and *Indianer* are both in Spyri's German, so
every faithful English version carries them. Stork stays. Worth noting the rule cuts both
ways — check the *source language* before you go shopping for a different English.

## Little Lord Fauntleroy

Lexically thin for an 1886 book. The real work was `gay` ×20, varied across merry, bright,
pleased, blithely, happy, lively, joyful, delighted, brightly, light-hearted, cheerfully,
briskly, cheerily, jolly, high spirits, cheery, brightest, and festivities. Nothing used
more than twice.

Also: one `gypsy` in the newspaper gossip about Cedric's mother → **`a Romany`** (couldn't
reuse the Daddy-Long-Legs "Spanish dancer" fix — "a beautiful Spaniard" is literally the
next item in the same sentence). `ejaculat*` ×5 → `exclaimed`, except the Ch. 2 one, which
became "a proper and suitable **thing to say**" because the sentence right above it already
reads "This was an exclamation he always used." And "as proud as a turkey-**cock**" → "as
proud as a **peacock**," which is the commoner English form anyway.

**The one to know about: Jerry's yarn, Ch. 4.** Read in full, per the Crimson Sweater rule.
The sailor claims shipwreck on "an island densely populated with bloodthirsty cannibals,"
being roasted and eaten, and being scalped by the King of the Parromachaweekins with a
knife made from the skull of the Chief of the Wopslemumpkies. **Kept whole, your call.**
The tribe names are deliberate gibberish, no real people are named, and Burnett's joke is
that Jerry is lying — Cedric says so two paragraphs later.

**Mr. Hobbs's politics kept whole too.** Anti-British, anti-aristocracy, "grasping
tyrants," "British ristycrats," the Fourth of July, the Declaration. 25 sites across the
whole book, threaded rather than blocked, no slurs in any of it, and Hobbs's slow
conversion by castles is the comic arc.

**One thing I did *not* touch and you should look at:** the Standard Ebooks title page
spells the author **"Francis** Hodgson Burnett." The OPF has it right as "Frances." It's
outside the language mandate and wasn't on your approved list, so I left it. One-character
fix in `text/titlepage.xhtml` whenever you say — it doesn't touch the OPF and can't affect
the import id.

## Frankenstein

**Check the edition before you tell a class anything about it.** This is the **1831 text**
— 24 chapters, "brightest living gold," the 1831 Introduction — carrying Percy's 1818
Preface. Most classroom editions use the 1818, and the two differ on Elizabeth's parentage
and on how much free will Victor has.

17 sites. The Tier 1/2 ones: "the slothful **Asiatics**" → "the ancient empires of Asia";
"the unfortunate **Muhammadan**" → "the unfortunate **merchant**," which is Shelley's own
word for him twice elsewhere; and "a **savage** inhabitant of some undiscovered island" →
"an **untaught** inhabitant," the one person-referring `savage` in the book.

Then `gay` ×7, varied. The Aesop reference "as the **ass** and the lapdog… the gentle
**ass**" → **donkey** ×2, fable intact. "as silent as a **Turk**" → "as silent as a stone."
"from the hands of the **infidels**" → "from the hands of their enemies." Two `ravish` →
"transported with delight" and "must **tear** from you your happiness." One "heaving
breast" → "labouring breast."

**`wanton` came out of the proposal list on your ruling,** and I've written the principle
into the handoff so it doesn't come back: the Victorian sexual-register group *surfaces*,
it doesn't sentence. Read the sense. Dracula's fifteen were sexual and got rewritten;
Frankenstein's three mean "gratuitous" and are now vocabulary. Same logic retired two of
the three `mistress` — Letter 2's mean *betrothed* and stayed; only the priest and his
mistress killed by the avalanche (Ch. 18) became "his love."

**Flagged, kept, all yours:** Safie's father called "the Turk" ×9 and the harem passage
around it; the self-destruction thread, which is the only one in four batches that runs to
the final page (the creature ends by announcing he'll burn himself); and Victor's double
dose of laudanum in Ch. 21.

---

## Verification run on all three

- Every substitution made with an asserted match count (`expected == found`). 48 staged,
  48 found, **0 misses on the dry run** — first batch where the dry run was clean on the
  first pass.
- Post-edit residual scan across ~70 stems. **This caught two tokens in *Frankenstein* the
  pre-edit scan was structurally blind to** — see below. Neither needed an edit, but the
  scan is the only reason I can tell you that.
- XML well-formedness checked on all 89 content files.
- `<p>` count parity: each book +1, which is the title-page note and nothing else.
- OPF byte-compared against the original — titles and authors untouched, so imports
  overwrite cleanly and no student's chapter pointer is orphaned.
- Repackaged with `mimetype` stored first and uncompressed.

---

## The scanner gap this batch found

My term list carried `mohammed`, `mahomet`, and `harem`. *Frankenstein* spells them
**`Muhammad`** and **`haram`**. Neither stem matched; both were invisible until the residual
pass.

Neither needed changing — `Muhammad` is the Prophet's name spelled correctly, which is not
the same thing as `Mohammedan` as a dated label for Muslims, and `haram` is an accurate
loanword. Both sit inside the "the Turk" passage you already ruled on. But a scan that
can't see a word can't tell you it's fine.

**Three batches, three different failure modes, same tool caught all three.** Batch 2 the
tool hid the hits, batch 3 I compressed them, batch 4 I never asked. The residual scan is
the reason none of them shipped.

Additions for `settings/languageFilter`, in full in `HANDOFF-bookclean.md`:

```
/mu(h)?ammad\w*/
/\bharam\b|\bhareem\w*|\bharem\w*|\bseraglio\w*/
/\b(al)?qu?r.?an\b/
/hottentot\w*|\bbushm[ae]n\b/
/\besquimaux?\b|\beskimo\w*/
/\basiatic\w*/
/\btzigane\w*|\bzigeuner\w*/
```

`asiatic` would have earned its place on its own — "the slothful Asiatics" is a real site
that nothing else in the list touches.

**Still not pasted in:** the batch 3 blocks (minstrelsy, Victorian sexual register, widened
`cock\w*`, always-fix `ejaculat\w*`) plus these. That's been open two batches now. No
`admin.js` code change needed — settings blob only.
