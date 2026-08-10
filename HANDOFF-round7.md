# HANDOFF — Round 7 (Hammond) — ARCHIVED

> **Archived by Round 8 (Yost), 2026-08-10.** Superseded by `HANDOFF.md`.
> **Still load-bearing:** §5 (invariants 21–36) and §8 (working with Jake) are NOT
> restated in Round 8 and remain in force. §2–§4c are the `admin.js` metadata round
> and are still accurate as history.
> ⚠️ **Its §1 table is STALE, exactly as its own §0 warned.** It claims `admin.js`
> v3.28.0; Jake's shipped file is **v3.30.0**, and v3.30.0 removed `CLASSROOM_NOTICE`,
> `runDedication()` and `DEDICATION_TEXT` — which is why `metadata-map-test.mjs` now
> fails. See Round 8 §5.

<!-- HANDOFF.md v7.0.0 — Round 7, instance "Hammond", 2026-08-08.
     ⚠️ SUPERSEDES the Round 6 handoff, archived here as HANDOFF-round6.md rather
     than overwritten — Round 6's own §0 complained that Round 4's was lost exactly
     that way. Round 6 §2, §4, §5 and §8 are STILL LOAD-BEARING and are NOT restated
     here. Go and read them. In particular §5's invariants 10b–20 are not repeated. -->

**Instance:** **Hammond** (7) · Noiseless (6) · Mignon (5) · Oliver (4) · Blick (3)
· Dvorak (2) · Underwood (1) · *other projects:* Stedman, Fable, Trilby, Vernier

> *On the name:* the Hammond typewriter used interchangeable type shuttles — same
> machine, swap the entire typeface. This round was precisely that: many raw imprints
> (`dc:rights`, `dc:source`, `dc:publisher`, `dc:identifier`) stamped onto one
> canonical set of dropdown values. It also fits the failure mode. Every defect here
> was a *mapping* that had never been written, in code that looked finished and ran
> without error.

---

## §0. What this round was

Jake's brief: *"Start with the handoff, but then we're looking at admin. The autofills
for source and license are broken."* Then mid-round: *"gutenberg already includes its
origin link on its license page. If you can pull that, that would be awesome."*

Narrow scope, fully closed. **Five defects, all in one ~40-line block, all shipped and
all silent.** Plus two more that the new harness found *in my own fix*.

⚠️ **The single most useful thing I did was measure before theorising.** I dumped
`dc:rights` / `dc:source` / `dc:publisher` / `dc:identifier` from all 24 EPUBs in
`library/` before reading the autofill code. That turned "the autofill is broken" into
"exactly two of 24 books match an option, and here is why each of the other 22 does
not" in one command. **Do this first, every time.** Every conclusion below was read out
of the corpus, not reasoned toward.

⚠️ **Round 6's §0 warning holds and applied to Round 6 itself.** Its §1 table claims
`admin.js` v3.24.1 and 11 harnesses. The zip I received had **v3.25.3 and 15**. Never
trust a version claim in a handoff, including this one — run `node audit-versions.mjs`
and `node run-all-tests.mjs`.

---

## §1. Version state — read by `audit-versions.mjs`, 2026-08-08

`node audit-versions.mjs` → **0 problems.** `node run-all-tests.mjs` → **16/16 pass.**

| file | version | changed this round? | upload? |
|---|---|---|---|
| `admin.js` | **3.28.0** | ⚠️ **yes — the whole round** | **YES, FIRST** |
| `admin.html` | — (title driven from `ADMIN_VERSION`) | ⚠️ **yes — new option, two fields, genre input renamed** | **YES, WITH admin.js** |
| `index.html` | **3.6.3** | yes — About rows + one label word | with the pair, ideally |
| `game.js` | **3.14.2** | yes — one label word | cosmetic, whenever |
| `adventure-renderer.js` | **1.5.4** | yes — one label word | cosmetic, whenever |
| `metadata-map-test.mjs` | **1.2.0** | ⚠️ **new harness, 193 assertions** | commit it |
| `run-all-tests.mjs` | — | yes — registers the new harness | commit it |
| `CHANGELOG.md` | — | yes — 4 entries + 2 gap notices | commit it |
| `README.md` | — | yes — harness table + two warnings | commit it |
| `learn.js` | 2.2.4 | no | — |
| `lessons-admin.js` | 1.7.1 | no | — |
| `keyboard.js` | 1.1.1 | no | — |
| `staff-admin.js` | 2.2.0 | no | — |
| `firebase-config.js` | 1.2.0 | no | — |
| `versions.js` | 1.3.0 | no | — |
| `style.css` / `adventure.css` | 3.5.0 / 1.0.0 | no | — |
| `firestore.rules` / `storage.rules` | 2.2.0 / 2.1.0 | no | console-only |

⚠️ **`admin.js` AND `admin.html` MUST GO UP TOGETHER.** `canonicalRightsFrom()` returns
`Public domain (United States) & CC0 1.0 …`, and that option exists only in the new
`admin.html`. Ship `admin.js` alone and every Standard Ebooks import silently lands in
Custom… again — the exact bug this round fixed, wearing a different hat. The mappers
read the select's live options, so the failure is quiet, not loud.

**The other three are one word each** (`Licence` → `License` on a credits row). They fix
nothing. Upload them when something else takes you to those files.

---

## §2. What was broken

All five in `autofillFromEpub()` / `reportMetadataMismatches()`. Verified against the
corpus, not inferred.

### 2.1 Source precedence was backwards — 17 of 23 books

`const src = meta.source || meta.publisher`. For Standard Ebooks, `dc:source` is the
**upstream transcription** (`https://www.gutenberg.org/ebooks/345`) and `dc:publisher`
is `Standard Ebooks`. So a URL won a field labelled *"who produced this edition"*, no
option matched a URL, and `writeSelectOrCustom()` fell to Custom…

⚠️ **The generalisable bit: `dc:source` and `dc:publisher` answer different questions,
and the EPUB spec does not stop you conflating them.** `canonicalSourceFrom()` now runs
two passes — *edition* signals (`dc:publisher`, `dc:identifier`) first, *upstream*
(`dc:source`) only if those are silent. **I then made the identical mistake again in
`readGutenbergOrigin()` an hour later** (§3). The distinction is slippery; assume you
will get it wrong on the second site too.

Global Grey missed differently and is worth remembering: `dc:publisher` is `Global Grey
ebooks`, the option is `Global Grey`. **One trailing word is a total miss under exact
matching.**

### 2.2 No normalisation of `dc:rights` at all

SE's is a 90-word paragraph. Gutenberg's is `Public domain in the USA.` The option says
`Public domain (United States)`. **Zero exact matches across the corpus** bar the two
fixtures. Nothing was malfunctioning; the mapping layer was never written.

⚠️ **Jake had concluded the dropdowns were unimportant** — *"those drop-downs are
important, but we practically ignore them"*. They were ignored because they had never
once been right. **A feature that is wrong every time gets classified as decoration,
and then the bug is invisible because nobody looks.**

### 2.3 The mismatch panel argued the wrong value back in

`reportMetadataMismatches()` compared the form's canonical value against the file's
**raw** value. On a book Jake had already fixed by hand, re-uploading the EPUB reported
a mismatch and offered a button labelled *"Use the file's"* that pasted the paragraph
back. **Compare canonical against canonical, or a normaliser and a differ will fight
each other forever** — and the differ has a button and looks authoritative, so it wins.

### 2.4 The attribution warning had never once been seen

```js
say('⚠ This EPUB declares a licence …', '#ffaa00');   // ~line 1109
...
say(filled.length ? '✓ Filled in …' : '…', '#00ff41'); // ~line 1145, SAME BLOCK
```

Both write `#autofill-status`. The second overwrote the first microseconds later, with
no await between. **Dead since v3.20.0.** Now: notes accumulate and **one** `say()` is
composed at the end.

⚠️ **Class of bug worth naming: two writes to one output in the same synchronous
block.** `undefined-calls-test.mjs` cannot see it — every identifier resolves and the
code is valid. Grep for a second `say()` / `textContent` / `innerHTML` write to the same
element in one function.

### 2.5 …and it was the wrong warning anyway

It fired on any non-empty `dc:rights`, which SE always populates — so it would have
cried wolf on ~20 public-domain books, telling Jake not to clear a field that legally
needed nothing. Only `CC BY*` obliges credit; public domain and CC0 do not. This is
Round 6 §3's *"a check that cries wolf twenty times is the same as no check at all"*,
except it never even got to cry.

---

## §3. `metadata-map-test.mjs` v1.0.0 — and the two bugs it caught in my own fix

121 assertions. Synthetic edges, then every book in `library/` end-to-end.

⚠️ **It failed on its first run and both failures were real.**

1. **All 17 Standard Ebooks were getting a *Gutenberg* origin URL.** SE cites Gutenberg
   in `dc:source`, my gate tested `dc:source`, so SE books resolved to the Gutenberg
   transcription — not where their edition came from. §2.1's mistake, committed a second
   time in the same session, in a function whose comment block *explains* the
   distinction. Now gated on edition signals only.
2. **The two test fixtures mis-mapped to the combined SE value.** Their `dc:rights` is
   `CC0 1.0 Public Domain Dedication …`, which mentions public domain *and* CC0, so my
   compound rule claimed it was Standard Ebooks. But **"Public Domain Dedication" is
   part of CC0's own name**, not an independent claim about the text. Fixed by an
   already-canonical short-circuit plus stripping CC0's brand phrase before testing.

**Neither was findable by reading.** I had read both functions several times.

⚠️ **`allowed` comes from the DOM, deliberately.** Both mappers take the select's own
option values and can only return one of them, so `admin.html` is the single source of
truth and a mapping cannot outlive its option. Rename an option and the harness fails —
correct behaviour.

⚠️ **Refusing to map is a feature.** `CC BY 3.0` has no option; the mapper returns `''`
rather than rounding to 4.0. **Guessing a licence version writes a false legal claim
into Firestore.** Unrecognised text is preserved verbatim in Custom…, because a licence
we cannot name is the one most likely to carry terms.

⚠️ **`lift()` as inherited silently strips `async`.** It searches `function NAME(`, so
the slice starts after `async`, and the lifted function's `await` is a `SyntaxError`.
Every prior use was synchronous. `metadata-map-test.mjs` has the fix — copy that one,
not `about-test.mjs`'s.

⚠️ **It takes ~3s**, breaking the fast list's stated "well under a second". It is in
the fast list anyway and `run-all-tests.mjs` explains why: this regression shipped for
six versions, and a guard behind a flag is a guard nobody runs.

---

## §4. The Gutenberg origin link — Round 6 §4.2 closed

Jake was right, and it is better than `dc:identifier`. Gutenberg publishes the canonical
page **inside** every book, in a block marked up for machines:

```html
<header class="pg-boilerplate pgheader" id="pg-header">
  <div class="container" id="pg-machine-header">
    <p><strong>Other information and formats</strong>:
       <a href="https://www.gutenberg.org/ebooks/91">…</a></p>
```

Structurally identical across all three Gutenberg books including the `.txt`-derived one.

⚠️ **`stripBoilerplate()` has been deleting it on every import.** `#pg-header` is on its
removal list — correctly; nobody wants to type Gutenberg's legalese. So the one field
Jake typed by hand every single time was in the file, parsed into a DOM, and discarded a
few hundred milliseconds later. **When a user says "I always type X by hand", check
whether the importer reads X and throws it away.** That is a different question from
"does the importer read X".

Implementation notes: gated to Gutenberg books only, so the 17 SE books pay nothing;
capped at **three** spine entries, because Gutenberg puts a cover wrapper first and a
286-chapter book must not be walked for something that is in the front matter or
nowhere; falls back to deriving the ebook number from `dc:identifier`; both paths
normalise to `https://www.gutenberg.org/ebooks/<id>` rather than echoing the href. For
non-Gutenberg books Origin URL is filled from `dc:identifier`, which is the edition's
own page (`standardebooks.org/ebooks/…`, the Global Grey product page).

### 4.1 Not done, and cheap if you want it

- **`Credits:` in the same machine header** — `An Anonymous Volunteer and David Widger`,
  `E-text prepared by …`. Transcriber credit, which is *not* what `cleanedBy` means
  (that is who did the text pass: Jake, Claude, Gemini). It would want its own field, so
  I left it. **Worth raising with Jake before building.**
- **The 23 books already in Firestore still hold paragraphs and Gutenberg URLs.** Jake
  chose *"Autofill only — I'll redo books by hand"* when asked. The load path shows the
  stored value in Custom…; he changes the dropdown and saves. §2.3's fix is what makes
  that stick — before it, a re-import would have undone his correction.
- **A bulk normaliser was offered and declined.** If it is ever wanted: dry-run preview
  first, then write, matching the "nothing changes unless you click" idiom the mismatch
  panel already establishes. ~23 writes, negligible cost.

---

## §4b. Classroom editions and the licence (v3.27.0)

Another Claude instance is cleaning every book in the library, leaving a notice on the
title page. Jake asked whether the licence needed updating for that, and whether it
could be done programmatically.

⚠️ **The reasoning is the load-bearing part, so do not "simplify" the outcome.** You
cannot CC0 the public-domain source text — there is nothing there to license. What
exists to license is **the editorial contribution**: the specific rewording choices.
That is exactly why Standard Ebooks' rights statement has two halves, and why
`Public domain (United States) & CC0 1.0` was already the correct value for a cleaned
book. **No new licence option was added, and none should be.**

The narrow consequence, which is easy to get backwards: **cleaning changes the correct
licence only for some books.**

| book | before cleaning | after cleaning |
|---|---|---|
| Standard Ebooks | PD & CC0 | **unchanged** — SE already dedicated its own contributions |
| Gutenberg / plain PD | Public domain (United States) | **PD & CC0** — there are now contributions to dedicate |
| CC BY anything | CC BY … | **never touched** — those terms are not ours to dedicate away |

⚠️ **Jake declined a "classroom edition" badge on the library card, and he was right:**
*"as it applies to literally every book."* Every book gets cleaned, so a badge on every
card carries no information. Same argument as v3.26.0's cry-wolf warning and invariant
22. The disclosure lives in the About panel, which now has `Prepared by` and
`Cleaned up by` rows.

**The boilerplate line, for whoever runs the cleaning sessions.** Jake asked for it and
it is reproduced here so it does not have to be re-derived:

> **Classroom edition.** This public-domain text has had a small number of period racial
> slurs and dated terms reworded for classroom use by Claude, with human supervision by
> Jake Wilson. Twain's story, characters, and dialect are otherwise unchanged.
>
> The source text is in the United States public domain. The editorial changes in this
> edition are dedicated to the worldwide public domain via the
> [CC0 1.0 Universal Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/).
> You may reuse this edition freely, with or without credit.

The last sentence is the one that achieves what Jake actually wants — a downstream
teacher can tell they may use the work. Detection matches on *"classroom edition"* /
*"reworded for classroom use"*, so the surrounding prose may vary per book, but **those
phrases must survive** or the licence upgrade stops firing.

⚠️ **What admin CANNOT do.** It reads EPUBs; it does not write them. The dedication
sentence has to be added where the cleaning happens, or through the staging area's
find-and-replace. The `dedication` dot-gap flag exists so the backlog is visible rather
than hunted, and it is a **proxy** — see the comment in `loadBookList()` for why
checking the title-page prose properly would cost real money on every dropdown render.

### 4b.1 Still open

- **`Prepared by` is blank for Standard Ebooks.** Their producer is named in the
  colophon, not in the OPF, so it would need colophon parsing. Gutenberg autofills today.
- **A count in the notice.** Standard Ebooks earns trust by being specific; *"eleven
  instances across four chapters"* costs the cleaning session nothing and makes the claim
  checkable. Raised with Jake, not yet decided.
- **`/credits` page** (Round 6 §4.2) is still unbuilt and now has more to show.

---

## §4c. The genre dropdown (v3.28.0) — a latent bug that v3.27.0 was about to trigger

Jake, with a screenshot: *"We lost custom genre — a category that so far has only
included sports."*

⚠️ **First thing done: diffed the block against Jake's original zip. Byte-identical.**
Not a Round 7 regression. Establishing that took one command and changed what to look
for — had it been mine, the question would have been "what else did that edit touch".

The `__custom__` option **was never created**. The population loop appended `GENRES` and
stopped, so three handlers testing for `__custom__` were all dead code: the population
block's `onchange`, a **duplicate** `change` listener 3,000 lines below it, and
`readGenreField()`. Sports, added by hand at some point, had no route back into the list.

⚠️ **It was also erasing data, and this is the part that made it urgent.**
`genreSelect.value = meta.genre` with no matching option sets `selectedIndex` to `-1`,
which reads back as `''`, which Save Metadata then writes. **Opening a Sports book and
pressing Save erased its genre.** And v3.27.0's whole purpose is to send Jake through
every cleaned book pressing that button. A dormant bug from an earlier round was about to
be triggered systematically, by a feature added the same day.

**Generalise this:** when you add a workflow that walks every record and saves it, ask
what that save path does to values it did not put there. A read-modify-write over a form
only round-trips what the form can represent.

Fix: genre is now the fourth field on the shared select+custom helpers. Sports restored.
A leading blank option added — without it a fresh form defaults to *Adventure*, so the
autofill's `!value` guard refused to write the genre it had just guessed. ⚠️ **That is
the second, unnoticed half of the bug v3.23.0 thought it had fixed** ("the Flat Edition
came out tagged Adventure when its dc:subject says Humor"); leftover state was real, but
a fresh page produced the same wrong result by a different route, and the two look
identical on screen.

⚠️ **`protagonistGender` still uses a bare `.value =` on load** (line ~921). Its options
are a closed set and the data comes from the same list, so there is no live bug — but it
is the last field in this panel that cannot represent a value from outside its own list,
and if anything ever writes one it will vanish the same way.

---

## §5. Invariants — additions to Round 6 §5 and Round 5 §5, both of which still apply in full

Round 6's 10b–20 are **not repeated here.** Adding:

21. **Two writes to the same output element in one synchronous block: the first one
    never happened.** No linter, parser or identifier check can see it. §2.4 sat dead
    for six versions.
22. **A feature that is wrong every single time gets reclassified as decoration**, and
    then nobody reports it. Jake said the dropdowns were important *and* that he ignored
    them, in one sentence — that pairing is the tell. **Ask what a user has stopped
    trusting.**
23. **A normaliser and a differ must compare on the same side of the normalisation.**
    Otherwise the differ reverts the normaliser.
24. **Refusing to map beats mapping approximately, wherever the value is a claim rather
    than a preference.** A licence, a version, an age range. `''` plus a human is cheaper
    than a false assertion in the database.
25. **Read the corpus before reading the code.** One command over 24 files converted a
    vague report into an exact per-book explanation. Every theory I would otherwise have
    formed was unnecessary.
26. **The same conceptual confusion gets committed twice in one session.** Edition vs
    upstream was right in `canonicalSourceFrom()` and wrong in `readGutenbergOrigin()`
    an hour later. **After fixing a confusion, grep for every other place those same two
    fields are read.**
28. **You cannot license a public-domain text; you can only license your own edits.**
    Any "we should CC0 this" instinct resolves to dedicating the *contribution*. This is
    the whole reason Standard Ebooks' rights statement is two sentences.
29. **A badge that applies to every item is not a badge.** Round 7 proposed showing
    "classroom edition" on the library card; Jake pointed out every book is cleaned, so
    it would appear everywhere and mean nothing. Same family as invariant 22 and the
    cry-wolf warning. **Ask "what fraction of rows does this appear on" before adding a
    flag.**
30. **A `select` + Custom… pair cannot be cleared with `.value = ''`.** That picks the
    blank option and leaves the custom input visible, still holding the previous value,
    which then wins on save. There are TWO clear blocks in `admin.js` and both need the
    `writeSelectOrCustom(id, '')` form. Converting a field to a select means auditing
    every place it is read, written, or cleared.
34. **A missing option in a `<select>` is a data-loss bug, not a UI gap.** Assigning an
    unrepresentable value gives `selectedIndex = -1`, which reads back as `''` and then
    gets saved. Any field that loads with `el.value = stored` and saves with `el.value`
    silently deletes anything outside its option list.
35. **Before assuming you broke it, diff the block against the last known-good copy.**
    One command, and it redirects the entire investigation.
36. **A feature that walks every record and re-saves it will trigger every latent
    read-modify-write bug at once.** v3.27.0's dedication flag was about to erase the
    genre of every Sports book. Ask what the save path does to values the form cannot
    represent.
32. **A parse check proves syntax, not survival.** `admin.js` parsed cleanly, passed the
    version audit, and matched the original's line count with four top-level functions
    deleted. Before shipping a file you edited with scripts, diff its declaration list
    against the previous copy: `grep -o '^function [a-zA-Z_]*' | sort` then `comm`.
33. **Never compute a deletion slice from a loose textual match.** `startswith('// v3.')`
    matched a comment in the file body, not the header entry it was meant to find, and
    took 370 lines with it. Anchor deletions to an asserted line index.
31. **A short-circuit added for one case will block a later rule for another.**
    v3.26.0's already-canonical fast path silently defeated v3.27.0's classroom upgrade,
    in exactly the scenario that mattered most. **When you add a rule downstream of an
    early return, test the early-return path against it.**
27. **`Current:` lines in `CHANGELOG.md` are hand-maintained and every one I checked was
    stale.** `admin.js` said v3.24.2 against a shipped v3.25.3; `adventure-renderer.js`
    said v1.4.0 against v1.5.3; `game.js` said v3.14.0 against v3.14.1. Same category as
    the README version table Round 6 deleted rather than corrected. **Consider deleting
    the line rather than fixing it a fourth time.**

---

## §6. Documents this round

- **`CHANGELOG.md`** — full `admin.js` v3.26.0 entry (the header could not hold it; see
  §7), plus `game.js` v3.14.2, `adventure-renderer.js` v1.5.4, `index.html` v3.6.2. All
  four stale `Current:` lines corrected.
  ⚠️ **`admin.js` v3.24.3–v3.25.3 are now TRANSCRIBED** into `CHANGELOG.md`, verbatim
  from the file header, clearly labelled as a transcription rather than a
  reconstruction. This became necessary rather than optional: the header is
  space-budgeted, v3.27.0's entry needed room, and the header was the **only** record of
  those five versions. Trimming it would have destroyed them. ⚠️ **`adventure-renderer.js`
  v1.4.1–v1.5.3 are still missing** and its GAP notice stands — that file's header was
  not read this round, so there was nothing to transcribe from.
  ⚠️ **The general lesson: a space-budgeted header is not an archive.** If the only copy
  of something is in a place with a size cap, it is already being deleted.
- **`README.md`** — sixteen harnesses, the new row, the ~3s caveat, the `lift()`/`async`
  trap.
- **`HANDOFF-round6.md`** — Round 6, archived with a header saying what in it is still
  live and that its §1 was stale on arrival.

---

## §7. Things I got wrong, recorded on purpose

- **I made §2.1's exact mistake a second time, in `readGutenbergOrigin()`, after writing
  the comment block explaining it.** Only the harness caught it. See invariant 26 — I
  would not have believed this about myself without the failure output.
- **My first licence rule mis-mapped the project's own test fixtures**, because I tested
  "mentions PD and CC0" instead of "makes a PD claim independent of CC0's name". I had
  reasoned carefully about the Standard Ebooks paragraph and never checked the simple
  case.
- **I blew `admin.js`'s header budget** (86 lines / 7 entries against 60 / 6) with an
  entry so long it belonged in `CHANGELOG.md` in the first place — which is what the
  budget exists to enforce. `audit-versions.mjs` caught it. **Round 6 §7 records making
  this identical mistake one file after warning about it; I made it one round after
  reading that.** Then I burned four tool calls rewriting the entry to the *same* length
  before doing the obvious thing: count the lines and splice a fixed number.
- **I bumped `game.js`'s header comment and left its `VERSION` constant behind** — the
  Round 6 §2.3 drift, caught by the audit within a minute. Two version numbers per file
  is the actual defect and it will happen again.
- **`node --check` is useless here**, as invariant 13b says. `node --input-type=module
  --check` after every edit is what I actually used.
- ⚠️ **I DELETED 370 LINES OF `admin.js` AND THE LINE COUNT HID IT.** My header-trim
  script picked "the oldest changelog entry" with `vs[-1]` over every line starting
  `// v3.`, which matched a version comment **in the body of the file**, not in the
  header — so the slice ran from there to the next `// ──` divider, taking `val()`,
  `readAgeRange()`, `readBookMetadataForm()`, `resolvePath()` and ~360 more lines.
  **`node --input-type=module --check` passed. `audit-versions.mjs` reported 0 problems.
  `wc -l` was identical to the original**, because the code I had added elsewhere
  happened to total 370 lines too. **Only `undefined-calls-test.mjs` caught it**, via a
  single unresolved `resolvePath`, which is exactly the job Round 6 built it for.
  Restored by splicing the region out of Jake's original zip and re-applying the one
  edit that had been inside it.
  **Three lessons.** (1) *Never compute a deletion slice from a loose textual match —
  anchor it to a line index you have asserted.* Round 7 §7 already records me botching
  this same header four separate times; this was the fifth and the worst. (2) *A parse
  check proves syntax, not survival* — the file was valid JavaScript with four functions
  missing. (3) *Diff against the original before shipping.* `wc -l` agreeing is not
  evidence; `comm` over the top-level declaration list is. That check is two lines and
  is now the last thing I do.
- **I have not clicked any of this in a browser and cannot.** The mapping is asserted
  over the real corpus and the combined value was verified against both credit
  linkifiers' regexes, so I am confident. **But the thing to spot-check is one Standard
  Ebooks import and one Gutenberg import**, watching Source, License and Origin URL.

---

## §8. Jake — working with him

Round 6 §8, Round 5 §8 and Round 4 §12 all still hold. Additions:

- **He answers scope questions precisely and improves the answer.** Offered "Public
  domain" or "CC0" for the Standard Ebooks case, he said *combine them in chronological
  order* — more accurate than either option I proposed. **Ask, and take the answer
  seriously rather than as a tiebreak between your own two ideas.**
- **He supplies domain knowledge you cannot derive.** *"Gutenberg already includes its
  origin link on its license page"* was worth more than any amount of reading, and it
  arrived mid-round. **Stay interruptible.**
- **He hedges when he is right.** *"Not only is licence spelled wrong (it is, right?)"*
  and *"which I believe all of gutenberg and standard ebooks are"* — both correct, both
  offered tentatively. Check them properly and say plainly which way it came out; the
  answer to the spelling one was "British, not a typo, still wrong for your classroom".
- **Tell him which uploads matter.** Nine files changed; **two must ship together** and
  three are one word each.
