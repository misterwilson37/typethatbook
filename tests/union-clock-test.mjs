// union-clock-test.mjs v1.0.0
//
// ⚠️ PATHS: sources are read as `../` — this file lives in tests/ (Round 17).
//
// THE CHECK HANDOFF §0.0.A ASKED FOR AND NOBODY HAD WRITTEN.
//
// Its exact words: "The check that would have found this is: do any two rollups
// for one student on one day overlap in wall-clock time? Nobody had written it.
// Write it." This is that, plus the column built on top of it.
//
// ⚠️ WHY EVERY EXISTING TEST WENT GREEN THROUGH THE CORRUPTION. Round 18
// verified that each document's stored totals equal the sum of its own
// `sprints[]`. All four documents in §0.0.A pass that check. Internal
// consistency is a statement about ONE record; overlap is a relation BETWEEN
// records, and no arithmetic assertion about a single document can see it. That
// is the whole lesson of §0.0 and it is why this file compares records to each
// other in time and nothing else.
//
// Part A  — unionSprintSeconds() is really a union: overlaps count once,
//           disjoint stretches add, and the result is never above the sum.
// Part B  — THE IMMUNITY PROPERTY. A re-sent, re-chunked document — the shape
//           §0.0.D candidate 3 predicts — must not move the number. This is the
//           single property that makes the Clock column worth having.
// Part C  — UNPLACEABLE RECORDS ARE REPORTED, NEVER FOLDED IN. Invariant 7,
//           "absent beats approximated."
// Part D  — THE REGRESSION GUARD ON THE INTERVAL DIRECTION. `at` is the END of
//           a stretch of typing. Reading it as a start shifts every interval
//           forward by its own duration and quietly destroys the immunity in
//           Part B while leaving Part A green.
// Part E  — detectOverlaps() on the real §0.0.A documents. Structural: proves
//           the detector reports the overlap that started all of this.
// Part F  — GREPS on reports.html's source text. That the rebuild write is
//           still refused, and that the union is fed ALL documents rather than
//           the signature-deduped subset.

import fs from 'fs';

const SRC = '../reports.html';
let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

const html = fs.readFileSync(new URL(SRC, import.meta.url), 'utf8');

// ── Lift the function out of the page rather than re-implementing it ─────────
// ⚠️ LIFTED, NOT COPIED. A copy in this file would be a second implementation
// of the graded arithmetic, which is the duplication this project has paid for
// four times (Round 9 §4). If the extraction stops finding the function, that
// is a failure, not a reason to paste one in.
const marker = 'function unionSprintSeconds(docs) {';
const start = html.indexOf(marker);
if (start < 0) {
    console.log('  ✗ could not find unionSprintSeconds() in reports.html — ABORTING');
    process.exit(1);
}
const end = html.indexOf('\n    }', start);
const unionSprintSeconds = eval('(' + html.slice(start, end + 6) + ')');

const D = '2026-08-18T';
const sp = (hhmmss, secs) => ({ at: D + (hhmmss.length === 5 ? hhmmss + ':00' : hhmmss), seconds: secs });

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart A — it is a union, not a sum');
// ═══════════════════════════════════════════════════════════════════════════

// Two stretches that do not touch: 10:00:00–10:01:00 and 10:05:00–10:06:00.
ok('disjoint stretches add',
   unionSprintSeconds([{ sprints: [sp('10:01', 60), sp('10:06', 60)] }]).seconds === 120);

// Same instant, same duration — one stretch described twice.
ok('identical intervals count once',
   unionSprintSeconds([{ sprints: [sp('10:01', 60), sp('10:01', 60)] }]).seconds === 60);

// [10:00:30,10:01:00] and [10:00:00,10:01:00] — the first is inside the second.
ok('a contained interval adds nothing',
   unionSprintSeconds([{ sprints: [sp('10:01', 30), sp('10:01', 60)] }]).seconds === 60);

// [10:00:00,10:01:00] and [10:00:30,10:01:30] — partial overlap, union is 90s.
ok('partial overlap counts the covered span once',
   unionSprintSeconds([{ sprints: [sp('10:01', 60), sp('10:01:30', 60)] }]).seconds === 90);

// Adjacent, touching exactly at 10:01:00. One continuous minute, not two.
ok('touching intervals merge rather than double-counting the boundary',
   unionSprintSeconds([{ sprints: [sp('10:01', 30), sp('10:01:30', 30)] }]).seconds === 60);

// ⚠️ A CONTINUATION IS TWO STRETCHES AND MUST ADD. session-log.js v1.2.0 splits
// one interrupted sprint into a partial and a remainder with DIFFERENT `at`
// stamps. Merging them would re-create the undercount that file exists to stop.
ok('a partial and its remainder add',
   unionSprintSeconds([{ sprints: [sp('10:01', 30), sp('10:02', 30)] }]).seconds === 60);

// The invariant that holds for every input: union ≤ sum.
{
    const docs = [{ sprints: [sp('10:01', 60), sp('10:01', 60), sp('10:06', 45)] }];
    const sum = docs[0].sprints.reduce((a, s) => a + s.seconds, 0);
    const u = unionSprintSeconds(docs).seconds;
    ok('union never exceeds the sum', u <= sum, `union ${u} > sum ${sum}`);
}

// Order must not matter — the function sorts internally.
ok('input order is irrelevant',
   unionSprintSeconds([{ sprints: [sp('10:06', 60), sp('10:01', 60)] }]).seconds ===
   unionSprintSeconds([{ sprints: [sp('10:01', 60), sp('10:06', 60)] }]).seconds);

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart B — THE IMMUNITY PROPERTY (this is the one that matters)');
// ═══════════════════════════════════════════════════════════════════════════
//
// §0.0.D candidate 3: _sessionLogFlushInner() writes the document, THEN trims
// the queue. Die in between and the records are re-sent next load — but more
// have accumulated, so the new chunk is a SUPERSET with different boundaries,
// a different sessionSignature(), and it is summed in full. The sprints
// themselves are byte-identical; only the chunking differs. That is exactly
// what a union over sprint intervals collapses.

{
    const first  = { seconds: 92,  sprints: [sp('10:10', 40), sp('10:12', 52)] };
    const resent = { seconds: 165, sprints: [sp('10:10', 40), sp('10:12', 52), sp('10:14', 73)] };
    const sum = first.seconds + resent.seconds;                       // 257 — the defect
    const u = unionSprintSeconds([first, resent]).seconds;            // 165 — the truth
    ok('a re-chunked superset is counted once', u === 165, `got ${u}`);
    ok('...and the sum would have inflated it', sum === 257 && sum > u);
}

{
    // An exact duplicate document — the pre-v1.3.0 flush race.
    const doc = { seconds: 120, sprints: [sp('10:10', 60), sp('10:12', 60)] };
    const alone = unionSprintSeconds([doc]).seconds;
    const twice = unionSprintSeconds([doc, JSON.parse(JSON.stringify(doc))]).seconds;
    ok('an exact duplicate document changes nothing', alone === twice, `${alone} vs ${twice}`);
}

{
    // Two writers, same minutes, INDEPENDENT records. The union cannot fully
    // collapse these — different `at` means different intervals — but it must
    // still count the covered span once rather than adding both durations.
    const school  = { seconds: 120, sprints: [sp('10:10', 120)] };  // 10:08:00–10:10:00
    const library = { seconds: 90,  sprints: [sp('10:10', 90)]  };  // 10:08:30–10:10:00
    const u = unionSprintSeconds([school, library]).seconds;
    ok('two writers over the same minutes do not add', u === 120, `got ${u}, sum is 210`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart C — unplaceable records are reported, never folded in');
// ═══════════════════════════════════════════════════════════════════════════

{
    const good = { seconds: 60, sprints: [sp('10:01', 60)] };
    const noSprints = { seconds: 600, sprints: [] };            // pre-v2.10.0 rollup
    const r = unionSprintSeconds([good, noSprints]);
    ok('a rollup with no sprints[] is not counted in the union', r.seconds === 60, `got ${r.seconds}`);
    ok('...and its seconds are reported as unplaced', r.unplaced === 600, `got ${r.unplaced}`);
}

{
    const r = unionSprintSeconds([{ seconds: 90, sprints: [
        sp('10:01', 60), { at: 'not-a-date', seconds: 30 }] }]);
    ok('a sprint with an unparseable `at` is not counted', r.seconds === 60, `got ${r.seconds}`);
    ok('...and is reported as unplaced', r.unplaced === 30, `got ${r.unplaced}`);
}

ok('a zero-second sprint is neither counted nor flagged', (() => {
    const r = unionSprintSeconds([{ seconds: 0, sprints: [sp('10:01', 0)] }]);
    return r.seconds === 0 && r.unplaced === 0;
})());

ok('no documents at all is 0, not a throw',
   unionSprintSeconds([]).seconds === 0 && unionSprintSeconds(null).seconds === 0);

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart D — the interval direction is [at − seconds, at]');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ THIS IS A MUTATION GUARD. `at` is stamped by logSession()/logRun() when
// the record is CREATED, i.e. when that stretch of typing ENDED. Flip the
// direction to [at, at + seconds] and Part A still passes in full — every
// union/overlap property is symmetric under translation. What breaks is the
// relationship between two records logged at the same instant with different
// durations, which is precisely the corruption shape. Part D is the only part
// of this file that can tell the two readings apart.

{
    // Two records both ending at 10:10:00, durations 120s and 90s. Read as
    // END stamps they nest: [10:08:00,10:10:00] ⊃ [10:08:30,10:10:00] = 120s.
    // Read as START stamps they also nest, but the other way: 120s. Not enough.
    // Add a third that only disambiguates under the correct reading:
    const docs = [{ sprints: [
        sp('10:10', 120),   // correct: 10:08:00–10:10:00
        sp('10:08', 60),    // correct: 10:07:00–10:08:00 (adjacent, adds 60)
    ] }];
    const u = unionSprintSeconds(docs).seconds;
    // END reading:   10:07:00–10:10:00 contiguous = 180
    // START reading: 10:10:00–10:12:00 and 10:08:00–10:09:00 = 180 too. Still tied.
    ok('adjacent-by-end-stamp records total 180', u === 180, `got ${u}`);
}

{
    // The disambiguating case. Under the END reading these two overlap; under
    // the START reading they are disjoint.
    //   END:   sp('10:05',300) = 10:00:00–10:05:00 ; sp('10:04',60) = 10:03:00–10:04:00
    //          -> second is CONTAINED, union = 300
    //   START: 10:05:00–10:10:00 ; 10:04:00–10:05:00 -> adjacent, union = 360
    const u = unionSprintSeconds([{ sprints: [sp('10:05', 300), sp('10:04', 60)] }]).seconds;
    ok('`at` is read as the END of the stretch', u === 300,
       `got ${u} — 360 means the interval direction has been flipped`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart E — the real §0.0.A documents');
// ═══════════════════════════════════════════════════════════════════════════
//
// One student, 2026-08-18, transcribed from Jake's drill-down. Timestamps are
// at MINUTE resolution because that is all the report renders; the real `at`
// values carry seconds, so the figures below are approximate. The ORDER of the
// three numbers is not approximate and that is what is asserted.

const docA = { seconds: 891, sprints: [   // stamped 10:25, covers 10:47–11:16
    sp('10:47', 9), sp('10:49', 53), sp('10:55', 34), sp('10:56', 40), sp('10:59', 127),
    sp('10:59', 39), sp('11:02', 94), sp('11:03', 14), sp('11:05', 116), sp('11:16', 365)] };
const docB = { seconds: 486, sprints: [   // stamped 10:40, covers 10:27–10:38
    sp('10:27', 51), sp('10:29', 106), sp('10:32', 113), sp('10:33', 26),
    sp('10:34', 79), sp('10:36', 90), sp('10:38', 21)] };
const docC = { seconds: 245, sprints: [
    sp('10:43', 105), sp('10:45', 107), sp('10:46', 33)] };
const docD = { seconds: 319, sprints: [   // Library, covers 10:48–10:55
    sp('10:48', 32), sp('10:49', 23), sp('10:50', 49), sp('10:51', 38),
    sp('10:53', 94), sp('10:54', 39), sp('10:55', 44)] };

const REAL = [docA, docB, docC, docD];
const LOG_SECONDS = 807;   // typing_logs said 13m 27s

{
    REAL.forEach((d, i) => ok(`document ${'ABCD'[i]} totals match its own sprints`,
        d.sprints.reduce((a, s) => a + s.seconds, 0) === d.seconds));

    const sum = REAL.reduce((a, d) => a + d.seconds, 0);
    const u = unionSprintSeconds(REAL);
    ok('the sessions SUM is 1941s (32m 21s), as the reconcile screen reported', sum === 1941);
    ok('the union is strictly below the sum — real overlap exists', u.seconds < sum);
    ok('nothing in this day is unplaceable', u.unplaced === 0);

    // ⚠️⚠️ THE FINDING THAT REVERSES §0.0's DIAGNOSIS, ASSERTED SO IT CANNOT BE
    // QUIETLY LOST. Overlap accounts for only ~2 minutes of the 19-minute gap.
    // The union still lands FAR above the daily log. The dominant defect on
    // this day is typing_logs UNDERCOUNTING (the cross-mode overwrite, §3.1),
    // not typing_sessions overcounting.
    ok('overlap explains under 3 minutes of the gap', (sum - u.seconds) < 180,
       `overlap is ${sum - u.seconds}s`);
    ok('⚠️ the union is still far ABOVE the daily log', u.seconds > LOG_SECONDS * 2,
       `union ${u.seconds}s vs log ${LOG_SECONDS}s`);

    console.log(`     log ${LOG_SECONDS}s · union ${u.seconds}s · sum ${sum}s ` +
                `· double-counted ${sum - u.seconds}s · log shortfall ${u.seconds - LOG_SECONDS}s`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\nPart F — structural guards on reports.html');
// ═══════════════════════════════════════════════════════════════════════════
//
// Greps, and honest about being greps. They catch the edit that quietly turns
// the safe version back into the unsafe one.

ok('runRebuildAll() still refuses before doing anything',
   /async function runRebuildAll[\s\S]{0,3000}?console\.warn\('\[rebuild\] refused/.test(html));

ok('the rebuild button is unconditionally disabled',
   /id="rebuild-run-btn" disabled/.test(html));

// ⚠️ THE UNION IS FED `all`, NOT `kept`. Feeding it the signature-deduped
// subset would risk dropping intervals only a "duplicate" covers. Over-feed a
// union, never under-feed it — see readPairSessions()'s comment.
ok('the union is fed every document, not the deduped subset',
   /const clock = unionSprintSeconds\(all\);/.test(html));

ok('reconCellsHtml() emits four cells in every branch',
   (html.match(/recon-cell recon-idle">—<\/td>/g) || []).length === 4 &&
   (html.match(/recon-cell recon-err/g) || []).length >= 4);

ok('the drill-down colspan matches the widened table',
   /colspan="12"/.test(html) && !/colspan="11"/.test(html));

ok('REPORTS_VERSION is 2.19.0 or later',
   /const REPORTS_VERSION = "2\.(19|[2-9]\d)\./.test(html));

// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${fail === 0 ? '✓ PASS' : '✗ FAIL'} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
