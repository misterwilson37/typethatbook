// source-split-test.mjs v1.0.0
//
// ⚠️ WHY THIS HARNESS EXISTS. DESIGN-TELEMETRY.md §2.4: game.js and learn.js
// used to setDoc(merge:true) the SAME seconds/chars/mistakes fields on the SAME
// typing_logs document from their own independent in-memory counters. A student
// who did School then Library the same day had Library's smaller number
// silently overwrite School's — real graded minutes gone, no error. Round 16
// closed it by giving each page controller its OWN fields to write
// (secondsLibrary/secondsSchool etc.), which makes the collision structurally
// impossible rather than merely avoided — but that only matters if the READ
// side actually prefers the split sum over a stale legacy number, and if the
// recalc tool's session-splitting arithmetic is actually right. Both pieces are
// lifted straight out of reports.html and tested here, the same technique
// week-anchor-test.mjs uses.
//
// Two functions, both pure (no Firestore, no DOM), which is what makes lifting
// them possible at all:
//   readLogTotals(data)        — reports.html's read-side merge of the two
//                                 possible document shapes.
//   splitSessionTotals(sessions) — recalcDailyLog()'s session-to-fields split,
//                                 extracted so this harness doesn't have to
//                                 mock Firestore or the DOM to exercise it.

import { readFileSync } from 'fs';
const rep = readFileSync('./reports.html', 'utf8');

function lift(src, name) {
    const i = src.indexOf('function ' + name + '(');
    if (i < 0) return null;
    let d = 0, j = src.indexOf('{', i);
    for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) break; } }
    return src.slice(i, j + 1);
}

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };

const readLogTotalsBody = lift(rep, 'readLogTotals');
ok(!!readLogTotalsBody, 'reports.html: readLogTotals() exists');
const readLogTotals = readLogTotalsBody
    ? new Function(readLogTotalsBody + '; return readLogTotals;')()
    : null;

const splitSessionTotalsBody = lift(rep, 'splitSessionTotals');
ok(!!splitSessionTotalsBody, 'reports.html: splitSessionTotals() exists');
const splitSessionTotals = splitSessionTotalsBody
    ? new Function(splitSessionTotalsBody + '; return splitSessionTotals;')()
    : null;

console.log('\n─── A. readLogTotals ───');
if (readLogTotals) {
    ok(JSON.stringify(readLogTotals({ seconds: 600, chars: 1000, mistakes: 20 }))
       === JSON.stringify({ seconds: 600, chars: 1000, mistakes: 20 }),
       'a legacy-only document (no split fields) reads its flat totals unchanged');

    ok(JSON.stringify(readLogTotals({
        secondsLibrary: 300, charsLibrary: 500, mistakesLibrary: 5,
        secondsSchool: 200, charsSchool: 300, mistakesSchool: 3,
    })) === JSON.stringify({ seconds: 500, chars: 800, mistakes: 8 }),
       'a document with BOTH split triples sums them (a student who used both modes that day)');

    ok(JSON.stringify(readLogTotals({ secondsSchool: 400, charsSchool: 600, mistakesSchool: 10 }))
       === JSON.stringify({ seconds: 400, chars: 600, mistakes: 10 }),
       'a document with only ONE split triple present treats the absent side as 0, not missing');

    // The case that actually matters: a document carries a stale legacy
    // `seconds: 999` left over from before this shipped, AND a fresh split
    // write of 0 (the student did nothing today via the new code yet). The
    // split must win even though it's smaller — that's the whole point of
    // "the split is authoritative once either half exists," not "whichever
    // number is bigger."
    ok(JSON.stringify(readLogTotals({
        seconds: 999, chars: 999, mistakes: 99,
        secondsLibrary: 0, charsLibrary: 0, mistakesLibrary: 0,
    })) === JSON.stringify({ seconds: 0, chars: 0, mistakes: 0 }),
       'a present (even zero) split field outranks a stale legacy total, not the other way around');

    ok(JSON.stringify(readLogTotals({})) === JSON.stringify({ seconds: 0, chars: 0, mistakes: 0 }),
       'an empty document degrades to all zeros rather than throwing');
} else {
    fail += 5;
}

console.log('\n─── B. splitSessionTotals ───');
if (splitSessionTotals) {
    {
        const r = splitSessionTotals([
            { source: 'school', seconds: 100, chars: 50, mistakes: 1 },
            { source: 'school', seconds: 50, chars: 20, mistakes: 0 },
        ]);
        ok(r.schoolSec === 150 && r.schoolChars === 70 && r.schoolMist === 1
           && r.librarySec === 0 && r.libraryChars === 0 && r.libraryMist === 0,
           `all-School sessions sum entirely into the School side (got ${JSON.stringify(r)})`);
    }
    {
        const r = splitSessionTotals([{ source: 'library', seconds: 200, chars: 100, mistakes: 2 }]);
        ok(r.librarySec === 200 && r.libraryChars === 100 && r.libraryMist === 2 && r.schoolSec === 0,
           `an explicitly-tagged Library session sums into the Library side (got ${JSON.stringify(r)})`);
    }
    {
        // An untagged session (pre-source-tagging data) folds into Library,
        // the original, untagged mode — not dropped, and not misattributed
        // to School.
        const r = splitSessionTotals([
            { source: 'school', seconds: 60, chars: 30, mistakes: 0 },
            { seconds: 40, chars: 15, mistakes: 1 }, // no `source` at all
            { source: 'library', seconds: 20, chars: 10, mistakes: 0 },
        ]);
        ok(r.schoolSec === 60 && r.librarySec === 60,
           `an untagged session folds into Library alongside the explicitly-tagged one ` +
           `(got school=${r.schoolSec}, library=${r.librarySec}, want school=60, library=60)`);
    }
    {
        const r = splitSessionTotals([]);
        ok(r.schoolSec === 0 && r.librarySec === 0 && r.schoolChars === 0 && r.libraryChars === 0,
           'an empty session list produces all zeros, not a throw');
    }
    {
        // A session missing chars/mistakes entirely (a malformed or very old
        // record) must not poison the sum with NaN.
        const r = splitSessionTotals([{ source: 'school', seconds: 30 }]);
        ok(r.schoolSec === 30 && r.schoolChars === 0 && r.schoolMist === 0 && !Number.isNaN(r.schoolChars),
           `a session missing chars/mistakes degrades those to 0 rather than NaN (got ${JSON.stringify(r)})`);
    }
} else {
    fail += 5;
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
