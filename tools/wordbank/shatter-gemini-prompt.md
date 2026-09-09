# Shatter — the Gemini classification prompt

⚠️ **SEND `word` AND `parts` ONLY. STRIP `books` AND `book_count` FIRST.**
They cost tokens, the model has no use for them, and a field the model never
sees is a field it cannot quietly alter. Rejoin on the `word` key afterwards —
`rejoin-shatter.py` does it in one pass.

⚠️ **BATCH AT ABOUT 150 WORDS.** Long lists are where models start drifting into
summarising instead of answering every row. Run the three-part list first (215
rows, two batches) — it is the one that needs judgement. The two-part list is
2,933 rows and roughly 90% correct already, so do it last and only if you want
the extra volume.

---

## The prompt

> You are validating morphological decompositions of English words for a
> typing game used by 11-to-14-year-old students in a US middle school.
>
> I will give you a JSON list. Each row has a `word` and a proposed `parts`
> split, produced by a **mechanical script that has no understanding of
> meaning**. Roughly half of the three-part splits are wrong. Your job is to
> judge each one — **not to fix the list, and never to add to it.**
>
> ### What counts as a correct split
>
> Each part must be a real **morpheme**: a prefix, root, or suffix that carries
> meaning and keeps that meaning in this word. This is **not** syllable
> division.
>
> Correct:
> - `unfolded` → `un` + `fold` + `ed` — un- reverses, fold is the root, -ed is past tense
> - `unlikely` → `un` + `like` + `ly`
> - `unaccountable` → `un` + `account` + `able`
>
> Incorrect, and these are all real rows from my list:
> - `delivered` → `de` + `liver` + `ed` — "liver" is not the root; deliver is one morpheme
> - `desirous` → `de` + `sir` + `ous` — "sir" is unrelated
> - `debating` → `de` + `bat` + `ing` — debate is one root; "bat" is a coincidence
> - `defeated` → `de` + `feat` + `ed` — defeat is one morpheme, not de- plus feat
> - `declaration` → `de` + `clara` + `tion` — "clara" is not a morpheme
>
> ⚠️ **The test is meaning, not spelling.** If removing the prefix does not
> leave a root whose meaning actually contributes to the word, the split is
> wrong — even when the letters line up perfectly. When you are genuinely
> unsure, mark it `unsure`. **Do not guess to be helpful; a wrong split
> teaches a child a false fact about their language.**
>
> ### Also judge whether the word belongs in a school game
>
> Reject anything a US 6th-grader would not plausibly meet: archaic or period
> vocabulary (`whilst`, `perchance`), British-only spellings (`grey`,
> `centre`), foreign words, proper nouns, or anything about violence, death,
> alcohol, or sex. These come from public-domain novels, so period vocabulary
> is common.
>
> ### Output
>
> Return **only** a JSON array, one object per input row, in the same order,
> with no commentary before or after:
>
> ```json
> {
>   "word": "unfolded",
>   "verdict": "ok",
>   "parts": ["un", "fold", "ed"],
>   "glosses": ["not / reverse", "to bend over", "past tense"],
>   "grade": "easy"
> }
> ```
>
> - `verdict` — `"ok"`, `"bad_split"`, `"unsuitable"`, or `"unsure"`
> - `parts` — for `"ok"`, repeat the split unchanged. **If the word is real and
>   school-appropriate but my split is wrong AND you are confident of the
>   correct one, return `"verdict": "ok"` with the corrected `parts`.** Say so
>   in a `"note"` field.
> - `glosses` — a short plain-English meaning for each part, in the same order,
>   written so a 6th-grader could read it. This is what the student sees when
>   they pause and hover, so it is the whole educational payload — write it for
>   them, not for a linguist.
> - `grade` — `"easy"`, `"medium"`, or `"hard"` for a strong middle-schooler.
>
> Every input row must produce exactly one output row. Do not merge, skip, or
> reorder. If you cannot judge a row, emit it with `"verdict": "unsure"`.

---

## After it comes back

⚠️ **VERIFY MECHANICALLY BEFORE TRUSTING ANY OF IT.** `rejoin-shatter.py`
checks the three things a model gets wrong quietly:

1. **Row count and word set match the input** — the failure mode is a dropped
   row in the middle of a long batch, which is invisible by eye.
2. **`''.join(parts) == word`** — a corrected split that no longer spells the
   word would ship a Shatter word that cannot be reassembled.
   ⚠️ **EXCEPT FOR THE SILENT E, WHICH IS NOW RECOVERED RATHER THAN DROPPED.**
   English drops a silent e before `-ing`/`-ed`/`-able`, so `debate + ing` is
   morphologically right and orthographically unusable. `_try_silent_e()`
   derives a surface split (`debat` + `ing`) that concatenates correctly and
   keeps the dictionary form as `lemma`. **The tiles rebuild the word; the
   hover explains the spelling change** — which is a better lesson than either
   form alone, and Jake's reason for asking these back in.
   ⚠️ It strips one trailing `e` from one part, only when the result spells the
   real word. Anything else is still dropped: a looser rule would be the script
   inventing morphology.
3. **`len(glosses) == len(parts)`** — an off-by-one makes every hover after it
   wrong, and only for that word.

A short `REJECTED` set at the top of the script cuts splits ruled out by hand.
⚠️ **"OPAQUE" IS NOT "WRONG" AND ONLY WRONG ONES GO THERE.** Jake, on the
twenty Latinate splits a 12-year-old cannot see through (`ex+tend+ed`,
`re+port+ed`, `in+tense+ly`): *"keep those, too. If even one kid pauses the
game and goes 'What?', it will be worth it."* Nineteen stayed. `submission` is
cut because `sub+mis+sion` is simply false — the word is sub + miss + ion, and
a false split teaches a wrong fact.

Anything failing the three checks is dropped, not repaired. Then the book
provenance is rejoined from the original file.
