// rights-ladder.js v1.0.0
//
// v1.0.0 — ROADMAP 47, STEP ONE. Extracted VERBATIM from `admin.js` v3.39.0
//          (~1525–1611), where SOURCE_PATTERNS, looksLikeBareUrl(),
//          canonicalSourceFrom() and canonicalRightsFrom() had lived since
//          v3.26.0. Bodies unchanged; the four declarations gained `export` and
//          nothing else. The sixth shared module, after firebase-config.js,
//          stats-wal.js, session-log.js, hud.js and variety-floor.js.
//
//          ⚠️⚠️ THE REASON GIVEN IN ROADMAP 47 FOR THIS MOVE WAS WRONG, AND THE
//          MOVE IS STILL RIGHT. The item says to extract so that item 47's
//          Cloud Function can IMPORT the ladder instead of carrying a second
//          copy. **A Cloud Function cannot import this file.** `firebase deploy
//          --only functions` packages the `functions/` directory and nothing
//          above it, so a root-level module is never uploaded. Checked against
//          `firebase.json` and `functions/index.js` before building anything;
//          see ROADMAP 47 for the corrected note.
//
//          ⚠️ WHAT THE MOVE ACTUALLY BUYS, WHICH IS ENOUGH ON ITS OWN:
//          * `metadata-map-test.mjs` stops LIFTING these four out of admin.js as
//            text through `new Function(...)` and imports them like ordinary
//            code. That lift is a whole class of harness fragility — it breaks
//            on any syntax the lifter's brace matcher does not expect, and it
//            silently tests a COPY rather than the thing that ships.
//          * The licence ladder gets ONE canonical home, so when step two writes
//            the functions-side copy it can be checked against this file rather
//            than hand-maintained beside it. ⚠️ THE PROJECT ALREADY HAS ONE
//            UNGUARDED DUPLICATION ACROSS THAT EXACT BOUNDARY:
//            `MIN_PROBLEM_CHARS = 3` is written by hand in both
//            `variety-floor.js` and `functions/index.js` and **nothing asserts
//            they agree**. Two legal mappers drifting apart would be worse than
//            one, and that is the failure to design against.
//
//          ⚠️⚠️ THIS FILE MUST STAY DEPENDENCY-FREE AND DOM-FREE. It imports
//          nothing and touches neither `document` nor `window`, which is the
//          only property that makes a functions-side copy possible at all — a
//          Cloud Function has no DOM and no Firebase client SDK.
//          `metadata-map-test.mjs` Part F asserts both. ⚠️ `selectOptionValues()`
//          was deliberately LEFT BEHIND in admin.js for this reason: it reads
//          the live `<select>` and is the mechanism by which admin.html stays
//          the single source of truth for what a mapping is allowed to return.
//
//          ⚠️ THE ORDER IS LOAD-BEARING IN THREE PLACES and must survive any
//          future edit: Standard Ebooks before Gutenberg in SOURCE_PATTERNS, the
//          already-canonical short-circuit before the heuristics in
//          canonicalRightsFrom(), and CC BY before anything that could flatten
//          it into "public domain". ⚠️ AND THE TWO-PASS SPLIT IN
//          canonicalSourceFrom() IS A SECOND, INDEPENDENT PROTECTION — Round 57
//          found the two had been masking each other, so both are now pinned
//          separately in metadata-map-test.mjs Part 1. Read that before
//          simplifying either.
//
// Both mappers take the caller's list of permitted values as `allowed` and can
// only return something already in it, so no mapping can outlive the option it
// names. The failure mode is deliberately "left verbatim for a human", never
// "asserted a license the book does not carry" — which is the property item 47's
// Gemini check must preserve: it may FLAG and it may DISAGREE, never APPROVE.

export const RIGHTS_LADDER_VERSION = "1.0.0";

// Ordered, and the ORDER IS LOAD-BEARING in two directions. Standard Ebooks before
// Gutenberg, because an SE book cites Gutenberg as its own upstream and matches both.
export const SOURCE_PATTERNS = [
    [/standard\s*ebooks/i,               'Standard Ebooks'],
    [/gutenberg/i,                       'Project Gutenberg'],
    [/global\s*grey/i,                   'Global Grey'],
    [/faded\s*page/i,                    'Faded Page'],
    [/wikisource/i,                      'Wikisource'],
    [/archive\.org|internet\s*archive/i, 'Internet Archive'],
];

export function looksLikeBareUrl(s) {
    return /^https?:\/\/\S*$/i.test(String(s || '').trim());
}

// TWO PASSES, and the split is the fix for the Standard Ebooks case. Pass 1 asks who
// produced THIS edition (dc:publisher, dc:identifier). Only if that says nothing does
// pass 2 fall back to dc:source, which says what the edition was BUILT FROM. Without
// the split, every Standard Ebook resolves to Project Gutenberg — accurately, and
// uselessly, because the Source field means "whose edition is this".
export function canonicalSourceFrom(meta, allowed) {
    const edition  = [meta.publisher, meta.identifier].filter(Boolean).join(' ');
    const upstream = (Array.isArray(meta.sources) && meta.sources.length
                        ? meta.sources : [meta.source]).filter(Boolean).join(' ');
    for (const hay of [edition, upstream]) {
        if (!hay) continue;
        for (const [re, name] of SOURCE_PATTERNS) {
            if (re.test(hay) && allowed.indexOf(name) !== -1) return name;
        }
    }
    return '';
}

// Returns an exact option value, or '' meaning "I will not guess at this one".
export function canonicalRightsFrom(rightsText, allowed) {
    const t = String(rightsText || '').trim();
    if (!t) return '';
    const exact  = v => (allowed.indexOf(v) !== -1 ? v : '');
    const byPrefix = p => allowed.find(v => v.indexOf(p) === 0) || '';

    // 0. ALREADY CANONICAL. A book whose dc:rights is verbatim an option value needs
    //    no heuristic, and running one on it can only make things worse. Both test
    //    fixtures are this case and the compound rule in step 2 mis-mapped them until
    //    this short-circuit existed — found by metadata-map-test.mjs, not by reading.
    if (allowed.indexOf(t) !== -1) return t;

    // ⚠️ "PUBLIC DOMAIN DEDICATION" IS PART OF CC0'S OWN NAME. It is not a separate
    //    claim about the text, so it must not be counted as one: "CC0 1.0 Public
    //    Domain Dedication" otherwise reads as "asserts both" and lands on the
    //    Standard Ebooks combined value. SE's paragraph survives the strip because it
    //    asserts the source text is public domain in its own sentence.
    const hasPD  = /public\s+domain/i.test(t.replace(/public\s+domain\s+dedication/ig, ''));
    const hasCC0 = /\bcc0\b|publicdomain\/zero/i.test(t);

    // 1. An explicit CC BY licence FIRST, because it is the only family that carries
    //    a real obligation and it must not be flattened into "public domain" by a
    //    later rule. Family and version are read out of the text, and the built value
    //    is used ONLY if the dropdown can express it exactly. A CC BY 3.0 book has no
    //    option here, and inventing 4.0 to make it fit would be a false legal claim
    //    written into Firestore — so it falls through and a human decides.
    const by = /\bCC[\s-]*BY(-?NC)?(-?SA)?[\s-]*([0-9](?:\.[0-9])?)?/i.exec(t);
    if (by) {
        if (!by[3]) return '';                 // a CC licence with no version is unnameable
        const nc = by[1] ? '-NC' : '';
        const sa = by[2] ? '-SA' : '';
        const slug = ('by' + nc + sa).toLowerCase();
        return exact('CC BY' + nc + sa + ' ' + by[3] +
                     ' https://creativecommons.org/licenses/' + slug + '/' + by[3] + '/');
    }
    // 2. Standard Ebooks asserts BOTH — the source text is believed US public domain,
    //    and SE's own contributions are dedicated CC0. Tested as a compound condition
    //    rather than by matching SE's exact prose, which SE is free to reword.
    if (hasPD && hasCC0) return byPrefix('Public domain (United States) &');
    // 3. CC0 on its own.
    if (hasCC0) return byPrefix('CC0 1.0');
    // 4. Public domain on its own — Gutenberg's terse "Public domain in the USA."
    if (hasPD) return exact('Public domain (United States)');
    return '';
}
