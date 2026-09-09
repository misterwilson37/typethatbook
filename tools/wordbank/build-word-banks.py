#!/usr/bin/env python3
"""
build-word-banks.py v1.0.0 — TypeThatBook, Round 102 (Pittsburg).

Builds Escape Key's word banks (3–8 letters) from the cleaned EPUB library,
plus the Shatter candidate list for classification.

⚠️ THE CORPUS IS THE POINT. Every word a student meets in the arcade is a word
that appears in a book on their own shelf, which is why the provenance hover
is not a gimmick — it is true, and it is free, because it is baked in here at
build time and costs the browser nothing at runtime.

Run from the repo root:  python3 build-word-banks.py library/ out/
"""
import zipfile, glob, re, json, html, collections, math, os, sys

# ══════════════════════════════════════════════════════════════════════════
# EDITABLE POLICY — Jake owns everything in this section.
# ══════════════════════════════════════════════════════════════════════════

# ⚠️ STRUCTURAL PAGES, SKIPPED WHOLE. Standard Ebooks names these consistently
# across all 80 books: titlepage 80/80, colophon 78, uncopyright 78, imprint 78.
# They are the single largest source of false "common" vocabulary in the corpus.
SKIP_PAGES = {'titlepage', 'colophon', 'uncopyright', 'imprint', 'toc',
              'halftitlepage', 'halftitle', 'copyright', 'dedication', 'loi'}

MIN_FREQ  = 20    # total occurrences across the whole corpus
MIN_BOOKS = 8     # ⚠️ THE QUALITY FILTER THAT MATTERS. Breadth beats frequency:
                  # `yez` appears 12 times in 3 books, `jump` 248 times in 62.
MIN_BOOKS_RARE = 3   # relaxed bar for words carrying a rare letter — see below
RARE_LETTERS = set('qzxjkv')
BANK_SIZE = 200
LENGTHS = [3, 4, 5, 6, 7, 8, 9, 10]
TOP_BOOKS_PER_WORD = 5   # how many titles the hover names before "+N more"

# ⚠️ NOT PROFANITY IN THE OBVIOUS SENSE — these are words that are ordinary in a
# 19th-century novel and wrong on a screen in a middle-school classroom. Jake's
# standing bookclean rulings supply the hard ones; the rest are judgement.
# ⚠️ `queer` IS DELIBERATELY HERE even though the bookclean ruling keeps it in
# PROSE (where ~90% of period usage means "odd"). A bare word on a falling tile
# has no sentence around it to carry that sense, so the ruling does not transfer.
BLOCKED = set('''
ass asses damn damned damns damning cock cocks gay gays queer queers wench wenches
gipsy gypsy gipsies gypsies nigger niggers negro negroes darkie darkies injun squaw
savage savages heathen heathens halfbreed mulatto
hell hells whore whores bitch bitches slut piss shit fuck fucking
sex sexy naked nude bosom bosoms breast breasts thigh thighs
kill kills killed killing killer murder murders murdered murderer slay slain
dead death deaths die dies died dying corpse corpses blood bloody bleeding
gun guns pistol pistols rifle rifles shoot shoots shot shooting bullet bullets
knife knives stab stabbed sword swords dagger blade blades
rape ravish hang hanged hanging gallows noose suicide
drunk drunken booze whisky whiskey rum gin ale beer brandy opium tobacco cigar
corset corsets petticoat petticoats drawers
coxswain coxswains
'''.split())

# ⚠️ THE CORPUS IS PERIOD AND PARTLY BRITISH. These read as spelling errors to a
# Tennessee sixth grader and no statistic can catch them: `grey` is in 42 of 80
# books, `centre` in 41. Pattern rules below catch the regular families; this
# list is for the irregulars that no rule finds.
BRITISH = set('''
grey cheque cheques plough ploughs ploughed gaol kerb kerbs tyre tyres
moustache moustaches pyjamas aluminium storey storeys waggon waggons
sceptical scepticism mould moulds moulded smoulder smouldering draught draughts
gramme grammes kilogramme metre metres litre litres
cosy plait plaits skilful skilfully wilful wilfully instal instalment
connexion connexions inflexion gaoler jewellery
'''.split())

# ⚠️ PERIOD AND FOREIGN VOCABULARY. Real words, wrong century or wrong language.
ARCHAIC = set('''
thee thou thy thine hath doth dost didst hast wilt shalt art nay yea ere
whilst amongst unto oft betwixt hither thither whence whither hence
perchance forsooth alas behold verily nought naught aught methinks prithee
monsieur madame mademoiselle monsieurs messieurs signor signora senor senora
herr frau mynheer sahib effendi von van der del della di du de la le
aye nay quoth twas tis twere ye yonder morrow eventide
'''.split())

# ⚠️ ABBREVIATIONS AND FRAGMENTS. Not words, and a falling tile has no full stop
# to give them away. `etc` and `ave` both cleared the breadth bar on the first
# pass. The `-n't` fragments are handled at tokenisation, not here, but the
# stragglers that survive as real-looking strings are listed.
ABBREV = set('''
etc ave vol chap illus fig pp esq mrs mr dr st jr sr rev hon capt sgt
inst ult prox viz ibid seq fig no nos
jes jest'd yer yez wot wuz nuthin nothin somethin
ain nt ll ve re-  don didn couldn wouldn shouldn doesn isn wasn arent
werent hasnt hadnt cant wont
'''.split())


# ══════════════════════════════════════════════════════════════════════════
# EXTRACTION
# ══════════════════════════════════════════════════════════════════════════

def extract(libdir):
    """Returns (freq, capfreq, per-word book map, book list)."""
    freq = collections.Counter()
    capf = collections.Counter()
    inbook = collections.defaultdict(collections.Counter)   # word -> {bookidx: count}
    books = []
    files = sorted(glob.glob(os.path.join(libdir, '*.epub')))
    for idx, f in enumerate(files):
        title, author = None, None
        counts = collections.Counter()
        try:
            z = zipfile.ZipFile(f)
            opf = [n for n in z.namelist() if n.endswith('.opf')]
            if opf:
                x = z.read(opf[0]).decode('utf8', 'ignore')
                m = re.search(r'<dc:title[^>]*>(.*?)</dc:title>', x, re.S)
                if m: title = re.sub(r'\s+', ' ', html.unescape(m.group(1))).strip()
                m = re.search(r'<dc:creator[^>]*>(.*?)</dc:creator>', x, re.S)
                if m: author = re.sub(r'\s+', ' ', html.unescape(m.group(1))).strip()
            for n in z.namelist():
                if not n.endswith(('.xhtml', '.html', '.htm')):
                    continue
                # ⚠️⚠️ FRONT AND BACK MATTER IS NOT PROSE, AND THE BREADTH FILTER
                # ACTIVELY PROMOTES IT. `domain` scored 423 across 80 of 80 books,
                # `artwork` 222 across 46 — not because children's novels discuss
                # artwork, but because every Standard Ebooks file carries the same
                # imprint, colophon and uncopyright pages. ⭐ THE BEST QUALITY
                # SIGNAL IN THIS SCRIPT WAS REWARDING THE WORST TEXT IN THE
                # CORPUS, because identical boilerplate is maximally "broad".
                # ⚠️ SKIPPED BY FILENAME, NOT BY SNIFFING THE TEXT. A first pass
                # dropped files containing "gutenberg" near "licence"; it missed
                # these entirely, because Standard Ebooks does not use Gutenberg's
                # *** START OF *** markers and the imprint says none of those
                # words. The library's structure is a reliable signal; its prose
                # is not.
                if os.path.basename(n).lower().split('.')[0] in SKIP_PAGES:
                    continue
                t = z.read(n).decode('utf8', 'ignore')
                # ⚠️ SCRIPT/STYLE FIRST, THEN TAGS, THEN ENTITIES. Skipping the
                # entity step is how `quot` became the 12th commonest 4-letter
                # "word" in the corpus on the first pass.
                t = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', t, flags=re.S | re.I)
                t = re.sub(r'<[^>]+>', ' ', t)
                t = html.unescape(t)

                # ⚠️⚠️ THE PROJECT GUTENBERG LICENCE IS NOT PROSE, AND THE BREADTH
                # FILTER ACTIVELY PROMOTES IT. `domain` appears in 80 of 80 books,
                # `ebook` in 77, `trademark` in 34 — not because children's novels
                # discuss trademarks, but because the same licence is bolted to
                # every file. ⭐ THE BEST QUALITY SIGNAL IN THIS SCRIPT WAS
                # REWARDING THE WORST TEXT IN THE CORPUS. Drop those sections
                # whole rather than trying to blocklist their vocabulary, which
                # would also cost real words like `distance` and `produce`.
                low_t = t.lower()
                if 'gutenberg' in low_t and re.search(
                        r'licen[cs]e|trademark|donation|\bebook\b', low_t):
                    continue

                # ⚠️ APOSTROPHES ARE PART OF THE TOKEN, THEN THE TOKEN IS DROPPED.
                # Matching [A-Za-z]+ alone splits "didn't" into `didn` + `t`, and
                # `didn` scored 2,860 across 69 books on the first pass — it would
                # have shipped. Curly apostrophes are normalised first or the
                # split happens anyway.
                t = t.replace('\u2019', "'").replace('\u02bc', "'")
                for w in re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)*", t):
                    if "'" in w:
                        continue
                    lw = w.lower()
                    counts[lw] += 1
                    if w[0].isupper():
                        capf[lw] += 1
        except Exception as e:
            print(f'  ! skipped {os.path.basename(f)}: {e}', file=sys.stderr)
            continue
        books.append({'title': title or os.path.basename(f), 'author': author or ''})
        for w, c in counts.items():
            freq[w] += c
            inbook[w][idx] = c
    return freq, capf, inbook, books


# ══════════════════════════════════════════════════════════════════════════
# FILTERING
# ══════════════════════════════════════════════════════════════════════════

def is_british(w, freq):
    """Pattern families, checked against the corpus's own American variant."""
    if w in BRITISH:
        return True
    pairs = [(r'our$', 'or'), (r'oured$', 'ored'), (r'ouring$', 'oring'),
             (r'ours$', 'ors'), (r'ourite$', 'orite'), (r'ourable$', 'orable'),
             (r'ise$', 'ize'), (r'ised$', 'ized'), (r'ising$', 'izing'),
             (r'isation$', 'ization'), (r'iser$', 'izer'),
             (r'yse$', 'yze'), (r'ysed$', 'yzed'),
             (r'tre$', 'ter'), (r'tres$', 'ters'),
             (r'ogue$', 'og'), (r'aeon$', 'eon')]
    for pat, repl in pairs:
        if re.search(pat, w):
            amer = re.sub(pat, repl, w)
            # ⚠️ ONLY IF THE AMERICAN FORM IS ALSO IN THE CORPUS. Otherwise a
            # word like `four` (matches `our$`) would be thrown away.
            if freq.get(amer, 0) >= MIN_FREQ:
                return True
    # travelling/travelled — doubled l where the single-l form is commoner
    m = re.match(r'^(.*[aeiou])ll(ing|ed|er|ers)$', w)
    if m:
        single = m.group(1) + 'l' + m.group(2)
        if freq.get(single, 0) >= MIN_FREQ:
            return True
    return False


def eligible(w, c, capf, inbook, freq):
    if not w.isalpha() or not w.islower():
        return False
    if c < MIN_FREQ:
        return False
    if capf.get(w, 0) / c > 0.5:            # proper noun
        return False
    nbooks = len(inbook[w])
    bar = MIN_BOOKS_RARE if (set(w) & RARE_LETTERS) else MIN_BOOKS
    if nbooks < bar:
        return False
    if w in BLOCKED or w in ARCHAIC or w in ABBREV:
        return False
    if is_british(w, freq):
        return False
    return True


# ══════════════════════════════════════════════════════════════════════════
# LETTER-BALANCED SELECTION
# ══════════════════════════════════════════════════════════════════════════

def balanced_pick(pool, n):
    """
    Greedy: repeatedly take the word that best serves the letters we have least
    of, with a mild pull toward commoner words so the bank stays familiar.

    ⚠️ BALANCE AND SIZE FIGHT EACH OTHER. Every word added past the target
    dilutes the rare-letter share, because there are simply more common-letter
    words to choose from. That, not file size, is why the banks are capped.
    """
    have = collections.Counter()
    remaining = dict(pool)
    maxf = max(pool.values()) if pool else 1
    chosen = []
    while len(chosen) < n and remaining:
        best, bestscore = None, -1e9
        for w, c in remaining.items():
            s = sum(1.0 / (1.0 + have[ch]) for ch in set(w)) / (len(set(w)) ** 0.5)
            s += 0.15 * (math.log(c) / math.log(maxf))
            if s > bestscore:
                best, bestscore = w, s
        chosen.append(best)
        for ch in best:
            have[ch] += 1
        del remaining[best]
    return chosen, have


# ══════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════

def main(libdir, outdir):
    os.makedirs(outdir, exist_ok=True)
    print('reading library...')
    freq, capf, inbook, books = extract(libdir)
    print(f'  {len(books)} books, {len(freq)} distinct words, {sum(freq.values())} tokens')

    banks = {}
    report = {}
    for L in LENGTHS:
        pool = {w: c for w, c in freq.items()
                if len(w) == L and eligible(w, c, capf, inbook, freq)}
        want = min(BANK_SIZE, len(pool))
        words, have = balanced_pick(pool, want)
        tot = sum(have.values()) or 1
        rare = sum(have[c] for c in RARE_LETTERS)
        missing = ''.join(c for c in 'abcdefghijklmnopqrstuvwxyz' if not have[c])
        report[L] = {'pool': len(pool), 'picked': len(words),
                     'rare_pct': round(100 * rare / tot, 1), 'missing': missing}
        # provenance: the books where this word is commonest
        entries = []
        for w in sorted(words):
            bl = inbook[w].most_common()
            entries.append({'w': w,
                            'b': [i for i, _ in bl[:TOP_BOOKS_PER_WORD]],
                            'n': len(bl)})
        banks[L] = entries
        print(f'  {L} letters: pool {len(pool):5d} -> {len(words):3d} picked, '
              f'rare {report[L]["rare_pct"]:4.1f}%, missing "{missing or "none"}"')

    # ── the JS module ──────────────────────────────────────────────────────
    js = build_js(banks, books, report)
    p = os.path.join(outdir, 'word-banks.js')
    open(p, 'w').write(js)
    print(f'wrote {p} ({len(js)/1024:.1f} KB)')

    # ── the rare-letter tail, for Jake's eyes ──────────────────────────────
    tail = []
    for L in LENGTHS:
        for e in banks[L]:
            if set(e['w']) & RARE_LETTERS:
                tail.append((L, e['w'], freq[e['w']], len(inbook[e['w']])))
    p = os.path.join(outdir, 'rare-letter-review.txt')
    with open(p, 'w') as f:
        f.write('# Every bank word carrying q, z, x, j, k or v.\n')
        f.write('# These passed on a RELAXED book bar (%d, vs %d normally),\n'
                '# because rare letters live in rare words. Delete any that\n'
                '# do not belong; the bank is regenerated from the same script.\n\n'
                % (MIN_BOOKS_RARE, MIN_BOOKS))
        f.write(f'{"len":>3}  {"word":<10} {"freq":>6} {"books":>6}\n')
        for L, w, fr, nb in tail:
            f.write(f'{L:>3}  {w:<10} {fr:>6} {nb:>6}\n')
    print(f'wrote {p} ({len(tail)} words to review)')

    # ── Shatter candidates ─────────────────────────────────────────────────
    build_shatter(freq, capf, inbook, books, outdir)


def build_js(banks, books, report):
    L = []
    L.append("// word-banks.js v1.0.0 — Escape Key's word banks. Round 102 (Pittsburg).")
    L.append("//")
    L.append("// ⚠️⚠️ GENERATED — DO NOT HAND-EDIT. Rebuild with build-word-banks.py.")
    L.append("// An edit here is lost on the next build and, worse, silently changes the")
    L.append("// letter balance the selection was optimising for.")
    L.append("//")
    L.append("// ⚠️ EVERY WORD APPEARS IN A BOOK IN THE TTB LIBRARY. That is what makes the")
    L.append("// provenance hover true rather than decorative, and it is FREE: the book")
    L.append("// list is baked in below, so a hover costs zero reads and zero latency.")
    L.append("//")
    L.append("// Selection: frequency >= %d, present in >= %d books (>= %d for words"
             % (MIN_FREQ, MIN_BOOKS, MIN_BOOKS_RARE))
    L.append("// carrying q/z/x/j/k/v), proper nouns dropped, British spellings and period")
    L.append("// vocabulary excluded, then chosen greedily for LETTER BALANCE rather than")
    L.append("// frequency — so rare letters appear far above their natural rate.")
    L.append("//")
    L.append("//   bank   pool  picked  rare%  letters missing")
    for k in sorted(report):
        r = report[k]
        L.append("//   %-4d %6d  %6d  %5.1f  %s"
                 % (k, r['pool'], r['picked'], r['rare_pct'], r['missing'] or 'none'))
    L.append("//")
    L.append("// ⚠️ 8-LETTER WORDS DO NOT FIT THE DEFAULT CELL FONT. game-escape.js draws")
    L.append("// grid words at `cell * 0.20` in Courier Prime (~0.6em advance), which is")
    L.append("// about 8.3 characters of cell width — an 8-letter word touches both edges.")
    L.append("// Scale the font by word length before using BANK_8. See HANDOFF.")
    L.append("")
    # ⚠️ TITLES ALONE ARE NOT UNIQUE IN THIS LIBRARY, and a hover is the one
    # place that shows. Beatrix Potter and O. Henry both have a book called
    # "Short Fiction", so a bare title would name the wrong author's work.
    # Disambiguate only where needed, so the common case stays short.
    tcount = collections.Counter(b['title'] for b in books)
    L.append("/** The library, indexed. `b` on each word indexes into this.")
    L.append(" *  `d` is the display label: the title, plus the author where the")
    L.append(" *  title alone is ambiguous. ⚠️ THREE BOOKS ARE GENUINELY DUPLICATED")
    L.append(" *  ON DISK (two files each of The Wonderful Wizard of Oz and The")
    L.append(" *  Half-Back). provenance() de-duplicates by label so a hover never")
    L.append(" *  names the same book twice — but the duplication also inflates")
    L.append(" *  every book count by one for words in those two titles, and that")
    L.append(" *  is a LIBRARY problem this script cannot fix. See HANDOFF. */")
    L.append("export const BOOKS = [")
    for b in books:
        t = b['title'].replace('\\', '\\\\').replace("'", "\\'")
        a = b['author'].replace('\\', '\\\\').replace("'", "\\'")
        disp = t if tcount[b['title']] == 1 else (t + ' \u2014 ' + a if a else t)
        L.append(f"    {{ t: '{t}', a: '{a}', d: '{disp}' }},")
    L.append("];")
    L.append("")
    L.append("// Each entry: w = the word, b = indices of the books it is commonest in,")
    L.append("// n = how many library books contain it at all.")
    for k in sorted(banks):
        L.append(f"export const BANK_{k} = [")
        for e in banks[k]:
            L.append("    { w: '%s', b: [%s], n: %d },"
                     % (e['w'], ','.join(str(i) for i in e['b']), e['n']))
        L.append("];")
        L.append("")
    L.append("export const BANKS = { %s };"
             % ', '.join(f'{k}: BANK_{k}' for k in sorted(banks)))
    L.append("")
    L.append("""/**
 * The bank for a given round. Length climbs every ROUNDS_PER_TIER rounds.
 *
 * ⚠️ THIS IS A SKILL RAMP, NOT A SPEED RAMP, AND THE DIFFERENCE MATTERS.
 * game-shell.js's enemyStepMs() is (avgChars / cps) * 1000 / pressure — LINEAR
 * in word length — so a 6-letter bank buys exactly twice the step time of a
 * 3-letter bank at the same gate. Longer words do not make the board faster.
 * They demand longer clean motor sequences and charge more for one typo.
 * `pressure` remains the only difficulty knob, and it is independent of this.
 */
export const ROUNDS_PER_TIER = 3;

// ⚠ DERIVED FROM THE BANKS, NOT HARDCODED. A first draft defaulted maxLen to
// 8; adding the 9- and 10-letter banks then silently changed nothing, because
// the ceiling was written in two places and only one of them moved.
export const BANK_LENGTHS = Object.keys(BANKS).map(Number).sort((a, b) => a - b);
export const MIN_LEN = BANK_LENGTHS[0];
export const MAX_LEN = BANK_LENGTHS[BANK_LENGTHS.length - 1];

export function bankForRound(round, minLen = MIN_LEN, maxLen = MAX_LEN) {
    const tier = Math.floor(Math.max(0, (round | 0) - 1) / ROUNDS_PER_TIER);
    const len = Math.min(maxLen, minLen + tier);
    return BANKS[len] || BANKS[maxLen];
}

/** Just the strings, which is what game-shell.js's target pool wants. */
export function wordsForRound(round, minLen = MIN_LEN, maxLen = MAX_LEN) {
    return bankForRound(round, minLen, maxLen).map(e => e.w);
}

/**
 * "brick — in Treasure Island, Black Beauty and 12 more"
 * ⚠️ NO READS, NO AWAIT. Everything it needs is in this file.
 */
export function provenance(word) {
    for (const k of Object.keys(BANKS)) {
        const hit = BANKS[k].find(e => e.w === word);
        if (!hit) continue;
        // ⚠️ DE-DUPLICATED BY LABEL. Two files on disk carry the same book, so
        // a raw map would print "The Wonderful Wizard of Oz" twice in one hover.
        const seen = new Set();
        const titles = [];
        for (const i of hit.b) {
            const d = (BOOKS[i] || {}).d;
            if (d && !seen.has(d)) { seen.add(d); titles.push(d); }
        }
        const extra = hit.n - titles.length;
        return { word, titles, total: hit.n, extra: extra > 0 ? extra : 0 };
    }
    return null;
}

/** Ready-made hover line: "jump — in A Little Princess, Dracula and 60 more". */
export function provenanceLine(word) {
    const p = provenance(word);
    if (!p || !p.titles.length) return '';
    const names = p.titles.slice(0, 2).join(', ');
    return p.extra > 0
        ? `${p.word} — in ${names} and ${p.extra} more`
        : `${p.word} — in ${names}`;
}""")
    return '\n'.join(L) + '\n'


PRE = ['un', 're', 'dis', 'in', 'im', 'pre', 'mis', 'over', 'under', 'out',
       'fore', 'sub', 'non', 'de', 'ex', 'inter', 'trans', 'anti', 'semi']
SUF = ['ing', 'ed', 'er', 'est', 'ly', 'ness', 'ful', 'less', 'able', 'ible',
       'ment', 'tion', 'sion', 'ous', 'ive', 'al', 'ish', 'hood', 'ward',
       'like', 'ship', 'en', 'y', 's']


def build_shatter(freq, capf, inbook, books, outdir):
    """
    Candidate decompositions for Shatter, for a model to VALIDATE.

    ⚠️⚠️ THESE ARE CANDIDATES, NOT ANSWERS, AND ROUGHLY HALF ARE WRONG.
    Mechanical affix-stripping cannot tell `un+fold+ed` from `de+liver+ed` or
    `de+sir+ous`, because the difference is meaning and this script has none.
    That is precisely the job being handed to the classifier: it is judging a
    CLOSED list, not generating an open one, so it cannot invent a word that is
    not in the library.
    """
    def ok(w):
        c = freq.get(w, 0)
        return (c >= MIN_FREQ and capf.get(w, 0) / max(c, 1) <= 0.5
                and w not in BLOCKED and w not in ARCHAIC
                and not is_british(w, freq) and len(inbook[w]) >= MIN_BOOKS)

    three, two = [], []
    for w, c in freq.items():
        if not ok(w) or len(w) < 5:
            continue
        got3 = False
        if len(w) >= 6:
            for p in PRE:
                if not w.startswith(p):
                    continue
                for s in SUF:
                    if not w.endswith(s):
                        continue
                    stem = w[len(p):len(w) - len(s)]
                    if len(stem) >= 3 and freq.get(stem, 0) >= MIN_FREQ:
                        three.append((w, [p, stem, s]))
                        got3 = True
                        break
                if got3:
                    break
        if got3:
            continue
        for s in SUF:
            if w.endswith(s):
                stem = w[:len(w) - len(s)]
                if len(stem) >= 3 and freq.get(stem, 0) >= MIN_FREQ:
                    two.append((w, [stem, s]))
                    break

    def rows(items):
        out = []
        for w, parts in sorted(items):
            bl = [i for i, _ in inbook[w].most_common(TOP_BOOKS_PER_WORD)]
            out.append({'word': w, 'parts': parts,
                        'books': [books[i]['title'] for i in bl],
                        'book_count': len(inbook[w])})
        return out

    data = {'three_part': rows(three), 'two_part': rows(two)}
    p = os.path.join(outdir, 'shatter-candidates.json')
    json.dump(data, open(p, 'w'), indent=1)
    print(f'wrote {p} ({len(three)} three-part, {len(two)} two-part candidates)')


if __name__ == '__main__':
    lib = sys.argv[1] if len(sys.argv) > 1 else 'library'
    out = sys.argv[2] if len(sys.argv) > 2 else 'out'
    main(lib, out)
