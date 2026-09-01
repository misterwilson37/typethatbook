# Classroom Edition — Batch 5

| File | Source | Sites changed |
|---|---|---|
| `carolyn-keene_the-secret-of-the-old-clock-claudeCleaned.epub` | Standard Ebooks | 42 |

Carries a one-line note under the byline. Metadata, front matter, and file structure
unchanged, so it overwrites the original in `admin.js` rather than creating a new entry.

---

## Read this part before you assign it

**This is the 1930 text, not the 1959 revision.** Standard Ebooks dated the file
2026-01-01 — the day it entered US public domain. That's the whole story: the versions now
becoming free are the *unrevised* ones, and the 1959 rewrites exist because the publisher
already knew there was a problem.

Outside one character, the book is genuinely clean. Twenty-five chapters: `queer` ×11
(struck per your ruling), one `oriental rugs`, one adjectival `savagely`, one `lamely`.
That's it.

**The scanner found one `negro` in the entire book.** Underneath it was a complete minstrel
character.

## Jeff Tucker

The Topham bungalow caretaker. `negro` ×1, `colored` ×3, `a plain culled man`, `Black boy,
bestir yo'-self`, `Jeff's black, furrowed old cheek`, five `white man`/`white gu'l` in his
own mouth, and roughly seventy tokens of eye-dialect across three chapters — plus drunk
comedy, comic cowardice, a *Swing Low, Sweet Chariot* gag, an eye-roll, and being shoved off
the running board of the police car at the end.

None of that except the four race words is visible to a word list. **A minstrel character is
made of spelling and stage business, not vocabulary.**

What I did, per your call:

**Unmarked him.** Every race marker gone. He's now simply "the caretaker." I'll say plainly
what this costs, because it isn't free: it makes a Black character disappear into the
unmarked default rather than repairing his portrayal. The alternative was worse — a Black
caretaker who's still the gullible drunk with the accent filed off.

**De-dialected him.** Every respelled vowel out (`dis`, `dat`, `de`, `heah`, `suah`, `mah`,
`chile`, `troof`, `Lawdy`). Kept `ain't`, `reckon`, "powerful sickish," and dropped-g where
it reads as *old* rather than as *Black*. He still doesn't talk like Nancy.

**Drugged, not drunk — and Keene wrote that version herself.** In Chapter XVIII, Jeff tells
the marshal a different story than the narrator tells: *"dey gives me some kind of a
sleepin' powdah and pahks me in a ho-tel."* I promoted his account to the true one. The
robber now buys him coffee and watches him drink it; the road goes soft and the trees go
sideways; he wakes in the hotel with his keys gone. Not one word of plot invented, the
mechanism untouched — the robbers still walk off with his keys — and the entire
drunk-comedy is gone. Same trick as turning Dracula's gipsies into Stoker's own `Szgany`,
just applied to plot instead of vocabulary.

**Cut three things:** the chariot gag, the eye-roll, and "I'd recognize that man in a
bootlegger's convention" (a Prohibition drinking joke that stopped making sense once the
drink did).

**Kept everything that was actually funny.** He still mistakes Nancy for a burglar and
announces he's got the closet surrounded. He's still a natural-born two-legged bloodhound.
He still loses the key at the worst possible moment. He still has seven children, still
calls it "my favorite jail," still says he's been run in "just for enjoying myself," still
performs the enormous face-wash at the pump while Nancy fumes in the roadster, still gets
pushed off the running board and left gazing mournfully after the police car. Nancy still
calls him an old scamp and tells him he was unfaithful to his trust. He still cries.

And he still does both jobs the plot needs: he lets Nancy out of the closet, and he's the
one who confirms the old clock was in the bungalow before the theft. That's why cutting him
was never on the table.

---

## Verification

- 41 substitutions staged, 41 found, **0 misses on the dry run**, plus one follow-up fix
  when proofreading caught a word I'd made repeat.
- Residual scan across ~35 dialect and race markers. Two hits, both false: `de` ×5 is
  `coup de grâce` (which is also a chapter title), and the one `inebriated` is the
  *robbers* in Ch. 20 — villain behaviour, and violence isn't a flag.
- XML well-formed, 30 files. `<p>` parity 1552 → 1553 (+1 = the note). OPF byte-identical.
- Repackaged with `mimetype` stored first and uncompressed.

---

## Two notes for next time

**The eye-dialect detector.** New block for `settings/languageFilter`, in full in the
handoff — `/\bdat\b|\bdis\b|\bdem\b|\bdey\b|\bdar\b/`, `/\bLawd\w*/`, `/\bchillun\w*/`,
`/\bgwine\b/`, `/\bsuah\b|\btroof\b|\bheah\b/`, and so on. These aren't words you need
flagged for a student to read. They're a **smoke detector**: two or three co-occurring in
one chapter means somebody has to go read that chapter.

(`/\bde\b/` is deliberately *not* in it — it fires on `coup de grâce` and every French name
in the corpus. Grep it by hand on a book you already suspect.)

**Stratemeyer is now a standing hazard.** As these copyrights lapse, Standard Ebooks will
keep setting the unrevised 1930s texts. The next Nancy Drews, the Hardy Boys, and
especially the Bobbsey Twins each need a character-level read rather than a word scan. The
Bobbsey Twins are worse than this one.

Still not pasted into `settings/languageFilter`: every block from batches 3, 4, and 5. No
`admin.js` change needed — settings blob only.
