// source-split-test.mjs v2.0.0
//
// v2.0.0 — THE SOURCE SPLIT WAS REVERTED (game.js v3.30.0 / learn.js v2.15.0).
//          Part C is deleted with the counters it guarded. Part A now asserts
//          LEGACY-FIRST reading, which is the opposite of what v1.1.0 asserted
//          and is correct for the reverted world — see readLogTotals(). Parts
//          B and B2 are unchanged and still earn their keep: splitSessionTotals()
//          and sessionSignature() both still ship.
//
// v1.1.0 — Part C added (the structural guard on the per-source counters), and
//          Part A's legacy-vs-split assertion CORRECTED: it used to assert that
//          a split field supersedes a legacy total, which was the v2.13.0
//          behavior and was wrong — it silently dropped time recorded earlier
//          the same day. They are summed now. Mutation-tested: re-introducing
//          the v3.29.0 line fails Part C.
//
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

    ok(JSON.stringify(readLogTotals({
        secondsLibrary: 300, charsLibrary: 500, mistakesLibrary: 5,
        secondsSchool: 200, charsSchool: 300, mistakesSchool: 3,
    })).includes('500'),
       'both-modes-one-day still sums both sides after the summing change');

    // ⚠️ THE REGRESSION TEST FOR THE BUG JAKE CAUGHT IN LIVE TESTING.
    // v2.13.0 returned the split sum ALONE whenever a split field existed,
    // which silently dropped time recorded earlier the same day by pre-split
    // code — he watched his morning School lesson disappear from the report the
    // moment the afternoon's Library session wrote a split field. The two
    // shapes describe disjoint periods (see readLogTotals()'s comment), so they
    // must be SUMMED. If this assertion ever flips back, that morning's time is
    // being thrown away again.
    ok(JSON.stringify(readLogTotals({
        seconds: 103, chars: 301, mistakes: 9,
        secondsLibrary: 75, charsLibrary: 622, mistakesLibrary: 3,
    })) === JSON.stringify({ seconds: 103, chars: 301, mistakes: 9 }),
       'LEGACY WINS when both shapes are present — summing here would double-count, ' +
       'because the flat number is already the whole combined day');

    // A split of zero must not erase a legacy total either — same bug, the
    // shape it took on a day where the new code loaded but nothing was typed.
    ok(readLogTotals({ seconds: 999, secondsLibrary: 0 }).seconds === 999,
       'a zero split field does not erase a legacy total');
    ok(readLogTotals({ secondsLibrary: 40, secondsSchool: 20 }).seconds === 60,
       'a split-only day (written while the split was deployed) still reads, rather than showing zero');

    ok(JSON.stringify(readLogTotals({})) === JSON.stringify({ seconds: 0, chars: 0, mistakes: 0 }),
       'an empty document degrades to all zeros rather than throwing');
} else {
    fail += 7;
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

// ─── B2. duplicate rollups must not inflate a recalculated day ─────────────
console.log('\n─── B2. sessionSignature ───');
//
// ⚠️ Jake's Pinocchio duplicate, 2026-08-19: session-log.js before v1.3.0 could
// write the same queued sprint twice when clicking Home fired two flushes at
// once. v1.3.0 stops new ones; the already-written ones still sit in
// typing_sessions, and recalcDailyLog() grades from that collection. A
// duplicate there inflates the very day Jake is trying to correct.
const sigBody = lift(rep, 'sessionSignature');
ok(!!sigBody, 'reports.html: sessionSignature() exists');
const sessionSignature = sigBody ? new Function(sigBody + '; return sessionSignature;')() : null;

if (sessionSignature) {
    const dupA = { source: 'library', bookId: 'pinocchio',
                   sprints: [{ at: '2026-08-19T16:55:00.000Z' }] };
    const dupB = { source: 'library', bookId: 'pinocchio',
                   sprints: [{ at: '2026-08-19T16:55:00.000Z' }] };
    ok(sessionSignature(dupA, 'doc1') === sessionSignature(dupB, 'doc2'),
       'two rollups of the same sprint share a signature even with different document ids');

    // Two REAL sessions a minute apart must stay distinct, or deduping would
    // start deleting legitimate work.
    const realA = { source: 'library', bookId: 'pinocchio',
                    sprints: [{ at: '2026-08-19T16:55:00.000Z' }] };
    const realB = { source: 'library', bookId: 'pinocchio',
                    sprints: [{ at: '2026-08-19T16:56:00.000Z' }] };
    ok(sessionSignature(realA, 'd1') !== sessionSignature(realB, 'd2'),
       'two genuine sessions a minute apart do NOT collide');

    // Same instant, different mode: not a duplicate.
    ok(sessionSignature({ source: 'school', bookId: 'u2l1', sprints: [{ at: 'X' }] }, 'd1')
       !== sessionSignature({ source: 'library', bookId: 'u2l1', sprints: [{ at: 'X' }] }, 'd2'),
       'the same instant in different modes is not treated as a duplicate');

    // No sprints array at all (pre-v2.10.0 rollups): must fall back to
    // something stable, and must never merge two documents on nothing.
    const bare1 = sessionSignature({ source: 'library', bookId: 'b' }, 'docA');
    const bare2 = sessionSignature({ source: 'library', bookId: 'b' }, 'docB');
    ok(bare1 !== bare2,
       'two sprintless rollups fall back to document id rather than merging on emptiness');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
