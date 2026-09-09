#!/usr/bin/env python3
"""
rejoin-shatter.py v1.0.0 — TypeThatBook, Round 102 (Pittsburg).

Two jobs:

  split   strip books/book_count and emit token-cheap batches for the model
  join    verify what comes back, drop anything unsound, rejoin provenance

⚠️⚠️ THE VERIFICATION IS THE POINT, NOT THE PLUMBING. A language model asked to
judge 150 rows will occasionally drop one in the middle, or "correct" a split
into parts that no longer spell the word, or return four glosses for three
parts. All three are invisible by eye and all three ship a broken Shatter word.
⚠️ ANYTHING FAILING A CHECK IS DROPPED, NEVER REPAIRED — a repair here would be
this script guessing at morphology, which is the whole thing it is not
qualified to do.

  python3 rejoin-shatter.py split shatter-candidates.json batches/ --key three_part
  python3 rejoin-shatter.py join  shatter-candidates.json batches/*.out.json -o shatter-words.js
"""
import json, sys, os, glob, collections

BATCH = 150


def do_split(src, outdir, key):
    data = json.load(open(src))[key]
    os.makedirs(outdir, exist_ok=True)
    n = 0
    for i in range(0, len(data), BATCH):
        chunk = [{'word': r['word'], 'parts': r['parts']} for r in data[i:i + BATCH]]
        p = os.path.join(outdir, f'{key}-{i // BATCH + 1:02d}.json')
        json.dump(chunk, open(p, 'w'), indent=1)
        n += 1
        print(f'  wrote {p} ({len(chunk)} rows)')
    print(f'{n} batch(es) from {len(data)} candidates. '
          f'Paste each under the prompt; save replies as <name>.out.json')


# ⚠️ SPLITS JAKE HAS RULED OUT BY HAND. Kept tiny and explicit rather than
# rolled into a heuristic: each one is a judgement about a specific word.
# ⚠️ "OPAQUE" IS NOT "WRONG", AND ONLY WRONG ONES BELONG HERE. Jake, 2026-09-09,
# on the twenty Latinate splits a 12-year-old cannot see through (`ex+tend+ed`,
# `re+port+ed`, `in+tense+ly`): *"keep those, too. If even one kid pauses the
# game and goes 'What?', it will be worth it... We're doing it to make kids
# start to question why words split the way they do."* Nineteen stayed.
# `submission` is here because sub+mis+sion is simply FALSE — `mis` is not a
# morpheme; the word is sub + miss + ion. A false split teaches a wrong fact,
# which is the opposite of the point.
REJECTED = {'submission'}


def _try_silent_e(word, parts):
    """
    Recover a surface split from a lemma split that lost a silent e.

        'debating' + ['debate', 'ing']  ->  ['debat', 'ing']

    ⚠️ CONSERVATIVE BY CONSTRUCTION. It strips a trailing 'e' from exactly ONE
    part, and only when the result concatenates to the real word. Anything else
    returns None and the row is dropped — a looser rule here would be this
    script inventing morphology, which is the one thing it is not qualified to
    do.
    """
    for i, p in enumerate(parts):
        if not p.endswith('e'):
            continue
        cand = list(parts)
        cand[i] = p[:-1]
        if ''.join(cand) == word:
            return cand
    return None


def do_join(src, replies, out):
    orig = json.load(open(src))
    prov = {}
    for key in ('three_part', 'two_part'):
        for r in orig.get(key, []):
            prov[r['word']] = (r['books'], r['book_count'])

    rows, seen = [], set()
    stats = collections.Counter()
    for f in replies:
        try:
            got = json.load(open(f))
        except Exception as e:
            print(f'  ! {f}: unparseable ({e}) — skipped whole file')
            stats['unparseable_files'] += 1
            continue
        for r in got:
            w = (r.get('word') or '').strip().lower()
            stats['returned'] += 1
            if not w or w in seen:
                stats['dup_or_blank'] += 1
                continue
            if w in REJECTED:
                stats['rejected_by_hand'] += 1
                continue
            if r.get('verdict') != 'ok':
                stats['verdict_' + str(r.get('verdict'))] += 1
                continue
            parts = r.get('parts') or []
            gl = r.get('glosses') or []
            # ⚠️⚠️ CHECK 1 — THE TILES MUST SPELL THE WORD; THE LEMMA NEED NOT.
            # Jake's ruling, 2026-09-09: *"include those silent e words back in —
            # even if it requires a janky letter addition on split... I like it!"*
            #
            # English drops a silent e before -ing/-ed/-able, so Gemini's
            # `debate + ing` is morphologically RIGHT and orthographically
            # unusable: those tiles would spell "debateing". v1.0.0 dropped all
            # ten such words. ⭐ IT WAS NEVER A CHOICE BETWEEN THEM — STORE BOTH.
            # `p` is the surface split: it concatenates to the word, and it is
            # what the tiles show and rebuild. `lemma` is the dictionary form,
            # and it is what the hover explains. The student watches `debat|ing`
            # shatter and reads "debate + -ing — the e drops before -ing", which
            # is a better lesson than either form alone.
            # ⚠️ THE SURFACE SPLIT IS DERIVED, NEVER GUESSED — see _try_silent_e().
            lemma = None
            if ''.join(parts) != w:
                fixed = _try_silent_e(w, parts)
                if fixed is None:
                    stats['parts_do_not_spell_word'] += 1
                    print(f'  ! dropped {w}: parts {parts} spell "{"".join(parts)}"')
                    continue
                lemma, parts = list(parts), fixed
                stats['silent_e_recovered'] += 1
            # ⚠️ CHECK 2 — one gloss per part, or every hover after it is wrong.
            if len(gl) != len(parts):
                stats['gloss_count_mismatch'] += 1
                print(f'  ! dropped {w}: {len(parts)} parts, {len(gl)} glosses')
                continue
            if len(parts) < 2:
                stats['too_few_parts'] += 1
                continue
            if w not in prov:
                stats['not_in_original'] += 1
                print(f'  ! dropped {w}: not in the candidate list (invented?)')
                continue
            books, bc = prov[w]
            rows.append({'w': w, 'p': parts, 'lemma': lemma, 'g': gl,
                         'grade': r.get('grade', ''), 'books': books, 'n': bc})
            seen.add(w)

    # ⚠️ CHECK 3 — did the model silently lose rows?
    print(f'\n  returned {stats["returned"]}, accepted {len(rows)}')
    for k, v in sorted(stats.items()):
        if k != 'returned':
            print(f'    {k}: {v}')

    # ⚠️ BACKSLASH FIRST, THEN QUOTE. Doing it the other way round escapes the
    # escape: "Grace Harlowe's" became "Grace Harlowe\\'s" and the module would
    # not parse. Caught by importing the output rather than eyeballing it.
    def esc(x):
        return x.replace('\\', '\\\\').replace("'", "\\'")

    js = ["// shatter-words.js v1.0.0 — GENERATED. Round 102 (Pittsburg).",
          "//",
          "// ⚠️ DO NOT HAND-EDIT. Rebuild: build-word-banks.py, then a model pass",
          "// (shatter-gemini-prompt.md), then rejoin-shatter.py.",
          "//",
          "// Each entry: w = word, p = morphemes in order (they concatenate back to",
          "// w — verified, not assumed), lemma = the dictionary form where English",
          "// dropped a silent e (debating: p is debat+ing, lemma is debate+ing — the",
          "// tiles rebuild the word, the hover explains the spelling change),",
          "// g = a plain-English gloss per part for the",
          "// pause-and-hover, books = where it appears in the TTB library.",
          "",
          "export const SHATTER_WORDS = ["]
    for r in sorted(rows, key=lambda r: (len(r['p']), r['w'])):
        p = ','.join("'" + esc(x) + "'" for x in r['p'])
        g = ','.join("'" + esc(x) + "'" for x in r['g'])
        b = ','.join("'" + esc(x) + "'" for x in r['books'][:3])
        lem = ''
        if r.get('lemma'):
            lm = ','.join("'" + esc(x) + "'" for x in r['lemma'])
            lem = "lemma: [" + lm + "], "
        js.append(f"    {{ w: '{r['w']}', p: [{p}], {lem}g: [{g}], "
                  f"grade: '{r['grade']}', books: [{b}], n: {r['n']} }},")
    js.append("];")
    js.append("")
    js.append("export const BY_PARTS = {")
    for k in (2, 3, 4):
        js.append(f"    {k}: SHATTER_WORDS.filter(e => e.p.length === {k}),")
    js.append("};")
    js.append("")
    open(out, 'w').write('\n'.join(js) + '\n')
    print(f'  wrote {out} ({len(rows)} words)')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == 'split':
        key = 'three_part'
        if '--key' in sys.argv:
            key = sys.argv[sys.argv.index('--key') + 1]
        do_split(sys.argv[2], sys.argv[3], key)
    elif cmd == 'join':
        out = 'shatter-words.js'
        args = sys.argv[3:]
        if '-o' in args:
            i = args.index('-o')
            out = args[i + 1]
            args = args[:i] + args[i + 2:]
        files = []
        for a in args:
            files.extend(glob.glob(a))
        do_join(sys.argv[2], files, out)
    else:
        print(__doc__)
