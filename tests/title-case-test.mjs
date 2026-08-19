// title-case-test.mjs v1.0.1 — Round 6 (Noiseless).
//
// v1.0.1 — PATH ONLY, Round 17 (Linotype). This file moved from the repo root
//          into tests/, so every source it reads is now `../` rather than `./`.
//          No assertion, threshold or expectation changed.
//
// Two bugs, both found because Jake looked at a chapter list and saw "Chapter Xix".
//
//   1. toTitleCase() lowercased the whole title then re-capitalised each word, so an
//      EPUB shouting "CHAPTER XIX" became "Chapter Xix" — every Roman-numbered book
//      had its entire contents mangled.
//   2. stripLeadingOrdinal() matched ordinals with [IVXLCDM]+, which is a character
//      class and not a numeral test. "DID", "MILD", "LID", "DIM" and "CIVIL" are all
//      built from numeral letters, so "DID IT MATTER" silently lost its first word.
//
// The two fixes pull in opposite directions — one wants numerals recognised more, the
// other wants them recognised less — so both directions are asserted here. The words
// below are the adversarial set: valid-numeral-looking English words, and the "I Am
// Born" collision where I is both a numeral and a pronoun.
//
//   node title-case-test.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(fileURLToPath(new URL('../admin.js', import.meta.url)), 'utf8');
const lift = (n) => {
    const k = src.indexOf('function ' + n + '(');
    if (k < 0) throw new Error(`${n}() not found — reanchor, do not copy the logic in`);
    let d = 0;
    for (let x = src.indexOf('{', k); x < src.length; x++) {
        if (src[x] === '{') d++;
        else if (src[x] === '}') { d--; if (!d) return src.slice(k, x + 1); }
    }
};
const konst = (n) => { const k = src.indexOf('const ' + n); return src.slice(k, src.indexOf(';\n', k) + 1); };

const F = new Function(
    konst('ROMAN_STRICT') + konst('ROMAN_LOOKALIKE_WORDS') + konst('STRUCTURAL_TITLE_WORDS') +
    konst('TITLE_MINOR_WORDS') + lift('isRomanNumeral') + lift('toTitleCase') +
    lift('isShoutedTitle') + lift('stripLeadingOrdinal') + lift('cleanChapterTitle') +
    '\nreturn { cleanChapterTitle, isRomanNumeral };')();

const CASES = [
    // Roman numerals must survive — the reported bug
    ['CHAPTER XIX',           'Chapter XIX'],
    ['CHAPTER XX',            'Chapter XX'],
    ['CHAPTER XXII',          'Chapter XXII'],
    ['CHAPTER XXIV',          'Chapter XXIV'],
    ['CHAPTER IX',            'Chapter IX'],
    ['CHAPTER XL',            'Chapter XL'],
    ['PART II',               'Part II'],
    ['BOOK IV',               'Book IV'],
    ['XXII',                  'XXII'],
    ['CHAPTER I',             'Chapter I'],
    // ...and must NOT be invented out of ordinary words
    ['I AM BORN',             'I Am Born'],      // David Copperfield: I is a pronoun
    ['THE MIX',               'The Mix'],
    ['MIX IT UP',             'Mix It Up'],
    ['DID IT MATTER',         'Did It Matter'],  // bug 2: was "It Matter"
    ['LID OF THE BOX',        'Lid of the Box'],
    ['DIM THE LAMPS',         'Dim the Lamps'],
    ['A CIVIL WAR',           'A Civil War'],
    ['THE MILD DAYS',         'The Mild Days'],
    ['CIVIL WAR',             'Civil War'],
    // ordinal stripping still works when a real title follows
    ['CHAPTER XIX. THE LAMP', 'The Lamp'],
    ['III. THE FOG',          'The Fog'],
    ['12. THE LAMP',          'The Lamp'],
    ['CHAPTER 12',            'Chapter 12'],
    ['THE LIGHTHOUSE',        'The Lighthouse'],
];

let fails = 0;
for (const [input, want] of CASES) {
    const got = F.cleanChapterTitle(input);
    const ok = got === want;
    if (!ok) fails++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${JSON.stringify(input).padEnd(26)} -> ` +
                `${JSON.stringify(got).padEnd(20)}${ok ? '' : ' want ' + JSON.stringify(want)}`);
}

// The numeral test itself, stated directly.
console.log('');
for (const [w, want] of [['XIX', true], ['XL', true], ['IV', true], ['I', true],
                         ['did', false], ['mild', false], ['civil', false], ['lid', false],
                         ['dim', false], ['mix', false], ['div', false], ['lighthouse', false]]) {
    const got = F.isRomanNumeral(w);
    const ok = got === want;
    if (!ok) fails++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} isRomanNumeral(${JSON.stringify(w).padEnd(12)}) = ${got}`);
}

console.log('');
if (fails) {
    console.log(`${fails} FAILURE(S). Each one is a chapter title shown wrong to every`);
    console.log('student, in every book, for as long as it goes unnoticed.');
    process.exitCode = 1;
} else {
    console.log('ALL PASS — numerals survive casing, and ordinary words are not mistaken');
    console.log('for numerals in either direction.');
}
