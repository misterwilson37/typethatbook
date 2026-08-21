// drill-filter.js v1.3.0 — KEEP THE RANDOM DRILLS FROM SPELLING THINGS.
//
// v1.3.0 — ⚠️ `ass` IS THE ONLY LEADING ENTRY LEFT; EVERYTHING ELSE IS NEVER-USE.
//          Jake, 2026-08-21: "Ass is in real, nonoffensive words. I can't think
//          of a single word that has fuck in it. [...] xfart and xfuck and xdamn
//          (and fartx and fuckx, etc) will always elicit a response because the
//          word is right there and can't be confused with anything else."
//          ⚠️ MEASURED BEFORE ADOPTING, NOT AFTER: the whole NEVER list costs at
//          most 0.24% of groups across the course's key-set ladder. Part A.
//          ⚠️ `fuk`/`fuks` DELETED — my invention, not a word, and 80% of the
//          filter's entire cost at the key set most students are on. See NEVER.
//
// v1.2.0 — ⚠️ TIER 1 IS NOW **LEADING**, NOT WHOLE-GROUP. Jake amended his own
//          ruling the same morning, and amended one of his own examples with it:
//          "maybe make it so ass can't lead the word in the four letter clump.
//          Fass is fine, but asse would probably get it." So `asse` — which
//          v1.1.0 was built to PERMIT, on his earlier wording — is blocked, and
//          `fass`, `lass` and `mass` stay fine.
//          ⚠️ THE EARLIER EXAMPLE IS SUPERSEDED, NOT CONTRADICTED. Do not
//          "restore" B3 from the v1.1.0 test on the strength of the older quote.
//          ⚠️ AND IT UNDOES v1.1.0's DEAD SPOT: a three-letter entry could not
//          fire at all at groupSize 4, so the original "ass" report was not
//          covered. Leading matching covers it. See the ruling block below.
//
// v1.1.0 — ⚠️ WHOLE-GROUP MATCHING, ON JAKE'S RULING. v1.0.0 matched substrings,
//          which would have stripped `lass`, `mass` and `asse` from the drills.
//          Two tiers now: WHOLE_GROUP (the ruling) and ALWAYS (slurs, substring).
//          ⚠️ A BREAKING CHANGE TO THE MATCH SEMANTICS, which would be a MAJOR
//          bump if v1.0.0 had ever been imported by anything. It was not — it was
//          written and superseded the same morning — so this is a minor. Flagged
//          rather than decided: say so if you would rather it were 2.0.0.
//
// v1.0.0 — Round 25 (Hall), 2026-08-21. The seventh shared module, after
//          firebase-config.js, stats-wal.js, session-log.js, hud.js,
//          variety-floor.js and daylog.js.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE REPORT
// ═══════════════════════════════════════════════════════════════════════════
//
// A student told Jake, 2026-08-20, that "ass" turned up in a School lesson.
//
// ⚠️ IT IS NOT A FLUKE AND IT WILL HAPPEN AGAIN WITHOUT THIS. learn.js's
// generateRandom() draws each character independently from the lesson's key
// set. The very first lessons use the home row — {a,s,d,f,j,k,l,;} — and at
// groupSize 4 a group is four independent draws from eight keys.
//
// ⚠️ MEASURED, NOT ESTIMATED, AND RE-MEASURED AFTER THE RULING NARROWED IT.
// Part A reproduces that generator over 200,000 groups and counts. The numbers
// it prints are the truth; A4 and A5 hold the ones written here to them, so a
// stale comment fails the suite rather than misleading the next reader.
//
// ⚠️ THE FIRST DRAFT OF THIS PARAGRAPH GUESSED "one in ninety" FROM ARITHMETIC
// DONE IN THE HEAD, and it was out by half. Making the comment testable was
// cheaper than resolving to be more careful.
//
// ⚠️ LIBRARY IS NOT AFFECTED AND DOES NOT NEED THIS. game.js has no
// generateRandom() and no key_random step type — its text comes from real books.
// This is a School-only defect because random generation is a School-only
// feature. Do not wire this into game.js "for symmetry".
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ JAKE'S RULING, 2026-08-21 — LEADING, NOT WHOLE-GROUP, NOT SUBSTRING
// ═══════════════════════════════════════════════════════════════════════════
//
// Given in two parts on the same morning. Both are here because the second only
// makes sense against the first.
//
//   1. "ass is bad alone, but it is fine to randomize to lass or asse or mass
//       or whatever."
//   2. "maybe make it so ass can't lead the word in the four letter clump.
//       Fass is fine, but asse would probably get it."
//
// ⚠️ PART 2 AMENDS PART 1, INCLUDING ONE OF ITS OWN EXAMPLES. `asse` was listed
// as acceptable in part 1 and is blocked under part 2. That is not a
// contradiction to be resolved by picking the older quote — it is Jake looking
// at the consequence and narrowing it. **The live rule is part 2.**
//
// So a tier 1 entry blocks a group when the group STARTS with it:
//
//     ass   → blocked (the group IS the word)
//     asse  → blocked (leads)
//     assd  → blocked (leads)
//     fass  → FINE   (does not lead)
//     lass  → FINE
//     mass  → FINE
//
// ⚠️ THE READING BEHIND IT, so the next round can extend it correctly: the eye
// takes a group as one token and reads it left to right. A word at the START is
// what the group looks like it says. The same letters buried after another
// character read as nonsense. That is why leading is the right test and why
// substring — v1.0.0's rule — was wrong.
//
// ⚠️ LEADING ALSO FIXES A DEAD SPOT v1.1.0 HAD. Whole-group matching could never
// fire a three-letter entry at groupSize 4, because nothing four characters long
// equals a three-letter word — so the ORIGINAL REPORT, a student seeing "ass",
// was not covered by the fix written for it. It is now.
//
// ⚠️ KNOWN AND DELIBERATE ASYMMETRY: A TRAILING WORD IS NOT BLOCKED. `xfuck` at
// groupSize 5 passes tier 1, because `fass` must pass and no rule distinguishes
// them by position alone. The hard cases are covered by tier 2 instead, which is
// substring and position-blind. If a trailing giggle-tier word ever turns up in
// a classroom, the fix is to move that entry to ALWAYS — not to make tier 1
// match at both ends, which would block `fass` and reopen this ruling.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY REJECTION SAMPLING AND NOT CHARACTER SUBSTITUTION
// ═══════════════════════════════════════════════════════════════════════════
//
// The obvious repair is to find the offending substring and change one letter.
// It is wrong twice:
//
//   1. It BIASES THE DRILL. Swapping the offending character for another
//      pushes the distribution away from exactly the letter combinations the
//      lesson is trying to drill — a home-row lesson would quietly stop
//      teaching the a-s-s finger sequence, which is a real and useful one.
//   2. It can make a NEW blocked word, so you need the check again anyway.
//
// Redrawing the WHOLE group and testing it again samples uniformly from the set
// of acceptable groups. Every allowed group stays exactly as likely relative to
// every other allowed group as it was before. The drill is unchanged except
// that one outcome is missing.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ IT MUST NEVER HANG A DRILL. THIS IS THE PART TO GET RIGHT.
// ═══════════════════════════════════════════════════════════════════════════
//
// Rejection sampling loops until it succeeds, and there are key sets where it
// CANNOT succeed: keySet {a,s} at groupSize 3 has eight possible groups and one
// of them is blocked, which is fine — but a future lesson, or a "practice the
// keys you missed" drill built from two missed letters, could in principle
// produce a set where every outcome is blocked. An unbounded `while` there is a
// frozen browser in a classroom.
//
// So the attempt count is BOUNDED and the fallback is to return the last draw
// anyway. ⚠️ A drill that briefly spells something is bad. A drill that never
// appears, on a machine a child cannot debug, in a lesson their grade depends
// on, is worse. The count is returned so the caller can log it — an exhausted
// budget means a lesson's key set needs looking at, and that is a message for
// Jake, not a reason to stop the child typing.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT IS ON THE LIST, AND WHAT DELIBERATELY IS NOT
// ═══════════════════════════════════════════════════════════════════════════
//
// Two kinds of entry: words that would genuinely upset or offend, and words
// that would derail a room of twelve-year-olds for five minutes. Both are worth
// blocking; the second is most of the practical value.
//
// ⚠️⚠️ AND AS OF v1.3.0 THERE ARE TWO TIERS WITH A ONE-MEMBER FIRST TIER. Jake:
// "Ass is different, but I think all of the other words should be on a NEVER USE
// list." His reasoning, and it is the right reasoning: for everything except
// `ass` there is no innocent reading. A group containing `fart` contains the
// word `fart` wherever it sits, and a room of twelve-year-olds will find it.
// `ass` alone lives inside letter runs a drill has a legitimate reason to make —
// `fass`, `lass`, `mass`, `sass` — so it, and only it, is matched LEADING.
//
// ⚠️ DO NOT ADD A SECOND LEADING ENTRY WITHOUT A RULING. The qualification is
// "appears inside letter runs a typing drill should be free to produce", not
// "seems mild".
//
// ⚠️ THIS TESTS NONSENSE LETTER GROUPS, WHICH IS WHY IT CAN BE BLUNT. There is no real prose here to damage — no "Scunthorpe problem",
// because there is no Scunthorpe. Nothing on this list can suppress a legitimate
// word, because there are no legitimate words. That freedom does NOT transfer:
// ⚠️ DO NOT REUSE THIS MODULE ON BOOK TEXT OR ON GEMINI PROSE. Blocking "ass"
// as a substring in real English removes "class", "passage", "assignment",
// "grass" and "embarrassed" — and "class" is a word this app cannot do without.
// If prose ever needs filtering, that is a different module with word
// boundaries and a much shorter list.
//
// ⚠️⚠️ AND v1.3.0 MADE IT SEVERE. With everything but `ass` matched ANYWHERE,
// Part G measures the damage: **39 of 42 ordinary English words are blocked.**
// `title`, `constitution`, `attitude`, `biscuit`, `circuit`, `soldier`,
// `audience`, `ingredient`, `sweet`, `between`, `weekend`, `speech`, `shampoo`,
// `sparse`, `parse`, `grape`, `scrape`, `raccoon`, `manuscript`, `shatter`,
// `hello`, `album`, `peanuts`, `shotgun` — all destroyed.
//
// ⚠️⚠️⚠️ AND THE TARGET OF THAT WARNING IS NOT ONLY game.js. IT IS THIS FILE.
// learn.js has THREE step types built from real English — `word_list`,
// `sentence_list` and `passage` — sitting in the same switch statement as the
// two random generators this module guards. A future round reading "the drill
// filter lives in learn.js" could reasonably wire it into all of them, and the
// only visible symptom would be words quietly going missing from lessons.
// Part G3 asserts safeGroup() is CALLED EXACTLY TWICE and names why.
//
// ⚠️ SHORT ENTRIES ARE THE EXPENSIVE ONES AND THE EXPENSE IS INVISIBLE BY
// READING. A NEVER entry is tested at (groupSize - len + 1) positions, so a
// three-letter entry made of EARLY keys costs several times what a six-letter
// one made of late keys does. This has now bitten twice — `kkk`, then `fuk` —
// and neither was catchable by looking at the list. ⚠️ MEASURE: run Part A
// before and after adding anything.
export const DRILL_FILTER_VERSION = '1.3.0';

// ⚠️ LOWERCASE ONLY, both lists. Everything is compared lowercased; an uppercase
// entry would never match and would look like it was working.

// ── TIER 1 — LEADING. One word, and that is the whole design. ───────────────
export const LEADING = ['ass', 'asses'];

// ── TIER 2 — NEVER USE. Blocked anywhere in the group. ─────────────────────
// ⚠️ `fuk` AND `fuks` WERE HERE AND WERE DELETED IN v1.3.0. They were my
// invention rather than anyone's ruling — a near-miss spelling nobody types —
// and the measurement showed them costing 0.074% of groups on the home+index key
// set, which was EIGHTY PERCENT OF THE FILTER'S ENTIRE COST at the level most
// students are actually on. `f`, `u` and `k` are all early keys, while `fuck`
// proper needs a `c`, which is bottom-row and late. So a string that is not the
// word was doing almost all of the work. Do not put them back.
export const NEVER = [
    'arse', 'arses', 'butt', 'butts', 'bum', 'bums',
    'fart', 'farts', 'poop', 'poops', 'poo', 'pee', 'wee', 'turd', 'turds',
    'crap', 'craps', 'piss', 'pissed',
    'boob', 'boobs', 'tit', 'tits', 'titty', 'penis', 'anus', 'pube', 'pubes',
    'dick', 'dicks', 'cock', 'cocks', 'balls', 'nuts', 'crotch',
    'nipple', 'nipples', 'scrotum', 'testicle', 'vagina', 'pussy',
    'shit', 'shits', 'shat', 'fuck', 'fucks',
    'cunt', 'cunts', 'twat', 'twats', 'wank', 'wanks', 'bitch', 'bitches',
    'slut', 'sluts', 'whore', 'whores', 'prick', 'pricks', 'douche', 'bastard',
    'damn', 'damned', 'hell', 'sex', 'sexy',
    // Violence and self-harm.
    'kill', 'kills', 'die', 'dies', 'dead', 'gun', 'guns', 'shoot', 'shot',
    'stab', 'stabs', 'bomb', 'bombs', 'blood', 'suicide', 'cut', 'cuts',
    // Substances.
    'drug', 'drugs', 'weed', 'vape', 'vapes', 'meth', 'heroin', 'cocaine',
    'beer', 'drunk',
    // Slurs and hate.
    'nigg', 'nigr', 'spic', 'chink', 'kike', 'coon', 'gook', 'wetback',
    'tranny', 'fagg', 'retard', 'hitler', 'nazi', 'rape',
];

/** @deprecated v1.3.0 — the old name for NEVER, when it held only the slurs. */
export const ALWAYS = NEVER;

/** Everything filtered, for callers that want to display it. Not used in logic. */
export const BLOCKED = LEADING.concat(NEVER);

/** @deprecated v1.2.0 — the old name for LEADING, when the rule was equality. */
export const WHOLE_GROUP = LEADING;

// ⚠️ SORTED LONGEST-FIRST so firstBlocked() names the most specific entry that
// leads: `cuts` rather than `cut` for a group beginning `cuts`. Logic does not
// depend on which one is reported, but a log line that names the shorter entry
// sends a reader to the wrong row of the list.
const _LEAD = Object.freeze(
    LEADING.map(w => String(w).toLowerCase()).sort((a, b) => b.length - a.length));
const _NEVER = Object.freeze(
    NEVER.map(w => String(w).toLowerCase()).sort((a, b) => b.length - a.length));

/**
 * Which entry blocks this group, or '' if none.
 *
 * @param {string} s ONE GROUP, as text. ⚠️ NOT A WHOLE LINE. No entry contains a
 *   space, so a line could never match tier 1 and this would silently do almost
 *   nothing. Call it per group.
 */
export function firstBlocked(s) {
    const t = String(s == null ? '' : s).toLowerCase();
    // Tier 1: does the group LEAD with it? `startsWith` also catches the
    // whole-group case, which is a leading match that happens to use every
    // character — so v1.1.0's behaviour is a strict subset of this one.
    for (const w of _LEAD) if (t.startsWith(w)) return w;
    // Tier 2: anywhere at all.
    for (const w of _NEVER) if (t.indexOf(w) !== -1) return w;
    return '';
}

/** Is this group blocked? */
export function containsBlocked(s) { return firstBlocked(s) !== ''; }

export const MAX_ATTEMPTS = 12;

/**
 * Draw a group that does not spell anything, by redrawing whole groups.
 *
 * @param {function(): string[]} makeGroup  returns a fresh array of characters
 * @param {number} [maxAttempts]
 * @returns {{ group: string[], attempts: number, exhausted: boolean, matched: string }}
 *
 * ⚠️ THE CALLER GETS THE LAST DRAW EVEN WHEN `exhausted` IS TRUE. See the header:
 * a drill that appears is worth more than a drill that is perfect. `exhausted`
 * is the signal to log, not a reason to withhold the group.
 *
 * ⚠️ `makeGroup` MUST BE THE CALLER'S OWN GENERATOR, unchanged. This module does
 * not know the key set, the group size or the distribution and must not learn
 * them — the moment it does, it is a second copy of generateRandom() that can
 * drift from the real one.
 */
export function safeGroup(makeGroup, maxAttempts = MAX_ATTEMPTS) {
    let group = [], attempts = 0, matched = '';
    for (attempts = 1; attempts <= maxAttempts; attempts++) {
        group = makeGroup();
        matched = firstBlocked(Array.isArray(group) ? group.join('') : String(group));
        if (!matched) return { group, attempts, exhausted: false, matched: '' };
    }
    return { group, attempts: maxAttempts, exhausted: true, matched };
}
