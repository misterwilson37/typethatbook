// retention-test.mjs v1.0.0 — Round 137 (Caslon III). ROADMAP 135b.
//
// ⚠️⚠️⚠️ THE RETENTION PANEL REMOVES ONLY CHILDREN WHO ARE REALLY GONE.
//
// SECURITY.md §6: records are deleted after 24 months with no activity. The
// failure that matters is deleting a child who is still here — and the obvious
// implementation does exactly that, because `activeDayLast` is stamped by Library
// and School but NOT by the arcade. Part B pins the arcade case; Part C runs the
// real retentionScan() against a fake database holding every kind of account.

import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const reports = readFileSync(path.join(ROOT, 'reports.html'), 'utf8');
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok    ' + m); } else { fails.push(m); console.log('  FAIL  ' + m); } };
function extractFn(src, name) {
    let start = src.indexOf(`function ${name}(`);
    if (start < 0) return null;
    if (src.slice(Math.max(0, start - 6), start) === 'async ') start -= 6;
    let i = src.indexOf('{', start), depth = 0;
    for (let j = i; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
    }
    return null;
}
const constLine = (n) => { const m = new RegExp(`const ${n} = [^;]+;`).exec(reports); return m ? m[0] : null; };

const lib = new Function(`${constLine('RETENTION_MONTHS')}
    ${extractFn(reports, 'retentionCutoff')} ${extractFn(reports, 'retentionVerdict')}
    return { retentionCutoff, retentionVerdict };`)();

console.log('\nA — THE CUTOFF IS 24 MONTHS, AND 24 IS ENOUGH');
{
    const { retentionCutoff: c } = lib;
    ok(/const RETENTION_MONTHS = 24;/.test(reports), 'A1 the window is 24 months — Jake\u2019s ruling');
    ok(c(new Date(2026, 8, 24)) === '2024-09-24', 'A2 24 Sep 2026 → 24 Sep 2024');
    ok(c(new Date(2026, 0, 15)) === '2024-01-15', 'A3 across a year boundary');
    ok(c(new Date(2026, 2, 31)) === '2024-03-31', 'A4 at a month end');
    ok(/^\d{4}-\d{2}-\d{2}$/.test(c(new Date(2028, 1, 29))), 'A5 a leap day still yields a real date');
    // ⭐ THE ROTATION CASE THAT SET THE NUMBER: last typed in October of 6th grade,
    // back in the fourth quarter of 7th — about 17 months later.
    ok('2026-10-20' >= c(new Date(2028, 2, 15)),
       '⚠️⚠️ A6 a student last seen Oct 2026 is still ACTIVE in mid-March 2028 — the returning 7th grader keeps their lessons');
}

console.log('\nB — ⚠️⚠️⚠️ THE VERDICTS, INCLUDING THE ONE THAT WOULD HAVE BITTEN');
{
    const { retentionVerdict: v } = lib; const cut = '2024-09-24';
    ok(v({ activeDayLast: '2026-09-01' }, cut) === 'active', 'B1 stamped recently → active, with no reads at all');
    ok(v({ ttbLogDaysSince: '2026-08-30' }, cut) === 'active', 'B2 first seen recently → active');
    ok(v({ activeDayLast: '2023-05-01' }, cut, true) === 'active',
       '⚠️⚠️⚠️ B3 AN OLD STAMP BUT A RECENT LOG → ACTIVE. The arcade does not stamp activeDayLast; '
       + 'trusting the stamp alone would delete a child who played last week');
    ok(v({ activeDayLast: '2023-05-01' }, cut, false) === 'stale', 'B4 old stamp and no recent log → stale');
    ok(v({}, cut, false, true) === 'stale', 'B5 no stamp, but old logs → stale');
    ok(v({}, cut, false, false) === 'review',
       '⚠️⚠️ B6 NO EVIDENCE AT ALL → review, never stale — could be a child who signed in yesterday');
    ok(v({ activeDayLast: cut }, cut) === 'active', 'B7 active exactly ON the cutoff day is still active');
}

console.log('\nC — ⚠️⚠️⚠️ THE REAL SCAN, AGAINST EVERY KIND OF ACCOUNT');
{
    const DOCID = { __docid: true };
    const store = new Map();
    const put = (p, d) => store.set(p, d);
    put('users/kidStale',  { displayName: 'Stale',  email: 's@x.org', activeDayLast: '2023-11-02' });
    put('typing_logs/kidStale_2023-11-02', { uid: 'kidStale' });
    put('users/kidArcade', { displayName: 'Arcade', email: 'a@x.org', activeDayLast: '2023-11-02' });
    put('typing_logs/kidArcade_2023-11-02', { uid: 'kidArcade' });
    put('typing_logs/kidArcade_2026-09-20', { uid: 'kidArcade', secondsArcade: 300 });
    put('users/kidNew',    { displayName: 'New', email: 'n@x.org', ttbLogDaysSince: '2026-09-23' });
    put('users/kidEmpty',  { displayName: 'Empty', email: 'e@x.org' });
    put('users/kidOldNoStamp', { displayName: 'OldNoStamp', email: 'o@x.org' });
    put('typing_logs/kidOldNoStamp_2022-04-01', { uid: 'kidOldNoStamp' });
    put('users/kidActive', { displayName: 'Active', email: 'ac@x.org', activeDayLast: '2026-09-22' });
    put('users/teacher1',  { displayName: 'Teacher', email: 't@x.org', activeDayLast: '2022-01-01' });
    put('staff/teacher1',  { role: 'teacher', active: true });
    put('users/jake',      { displayName: 'Jake', email: 'j@x.org', activeDayLast: '2020-01-01' });
    let reads = 0;
    const api = {
        documentId: () => DOCID,
        collection: (_db, ...p) => ({ coll: p.join('/') }),
        where: (field, op, value) => ({ field, op, value }),
        limit: (n) => ({ limit: n }),
        query: (c, ...cons) => ({ coll: c.coll, cons }),
        getDocs: async (q) => {
            const coll = q.coll; const cons = q.cons || [];
            let rows = [...store.entries()].filter(([p]) => p.startsWith(coll + '/') && !p.slice(coll.length + 1).includes('/'))
                .map(([p, d]) => ({ id: p.slice(coll.length + 1), data: () => d }));
            for (const c of cons.filter(c => c.field)) {
                const val = (r) => c.field === DOCID ? r.id : r.data()[c.field];
                const cmp = { '>=': (a, b) => a >= b, '<=': (a, b) => a <= b, '==': (a, b) => a === b }[c.op];
                rows = rows.filter(r => cmp(val(r), c.value));
            }
            const lim = cons.find(c => c.limit); if (lim) rows = rows.slice(0, lim.limit);
            reads += Math.max(1, rows.length);
            return { docs: rows, empty: rows.length === 0 };
        },
    };
    const scan = new Function('api', 'me', '_studentNames', `
        const { documentId, collection, where, limit, query, getDocs } = api; const db = {};
        ${constLine('RETENTION_MONTHS')}
        ${extractFn(reports, 'retentionCutoff')} ${extractFn(reports, 'retentionVerdict')}
        ${extractFn(reports, 'logExistsFrom')} ${extractFn(reports, 'retentionDueFrom')} ${extractFn(reports, 'retentionScan')}
        return retentionScan;`)(api, { uid: 'jake' }, new Map());
    const r = await scan(() => {});
    const names = (rows) => rows.map(x => x.name).sort().join(',');
    ok(names(r.stale) === 'OldNoStamp,Stale',
       `⚠️⚠️⚠️ C1 exactly the two long-gone children are marked for deletion (${names(r.stale)})`);
    ok(!r.stale.some(x => x.name === 'Arcade'),
       '⚠️⚠️⚠️ C2 THE ARCADE-ONLY CHILD IS KEPT — found by their log, not their stamp');
    ok(names(r.review) === 'Empty', '⚠️⚠️ C3 the account with no evidence at all is set aside for review, not deletion');
    ok(!r.stale.concat(r.review).some(x => x.name === 'Teacher'),
       '⚠️⚠️ C4 a TEACHER with a two-year-old stamp is never listed — staff are excluded first');
    ok(!r.stale.concat(r.review).some(x => x.name === 'Jake'), 'C5 and neither is the person running it');
    ok(r.active === 3 && r.skipped === 2, `C6 three active kept, two skipped (${r.active}, ${r.skipped})`);
    // ⭐ ROUND 145 — the next student who could come due: kidActive, stamped 2026-09-22,
    // is due the day AFTER its 24-month anniversary. The arcade-only child (old stamp,
    // recent log) is left out, because its real date isn't known from the stamp.
    ok(r.nextDue && r.nextDue.date === '2028-09-23' && r.nextDue.name === 'Active',
       `⭐ C8 the panel names the next student who could come due (${r.nextDue && r.nextDue.date})`);
    ok(reads < 20, `⭐ C7 the whole scan cost ${reads} reads for 7 accounts — recently stamped children cost none`);
}

console.log('\nD — ⚠️⚠️ THE BULK DELETE IS THE SAME PURGE, AND IT IS SUPER DUPER SURE');
{
    const dlg = extractFn(reports, 'openRetentionDialog');
    ok(/purgeExecute\(await purgePlan\(row\.uid\)/.test(dlg),
       '⭐ D1 it deletes with the SAME purgePlan/purgeExecute that student-purge-test proves');
    ok(/for \(const row of r\.stale\)/.test(dlg) && !/for \(const row of r\.review\)/.test(dlg),
       '⚠️⚠️⚠️ D2 it loops over the STALE list only — the review list is never deleted in bulk');
    ok(/id="ttb-ret-go" disabled/.test(dlg), 'D3 the delete button starts disabled');
    ok(/const phrase = `delete \$\{n\}`/.test(dlg) && /go\.disabled = input\.value\.trim\(\)\.toLowerCase\(\) !== phrase/.test(dlg),
       '⚠️⚠️ D4 and arms only when "delete N" is typed with the right N — the count is read, not skipped past');
    ok(/input\.focus\(\)/.test(dlg) && !/go\.focus\(\)/.test(dlg), 'D5 focus to the text box, never to Delete');
    ok(/isSuper\(\)/.test(dlg) && /isSuper\(\)/.test(extractFn(reports, 'updateRetentionButton')),
       'D6 super-admin only, at the button and in the dialog');
    ok(/Stopped after/.test(dlg) && /again/.test(dlg), 'D7 an interrupted run says rerunning is safe');
    ok(/authentication\/users/.test(dlg), 'D8 it ends with the console step and the list of accounts to remove');
    const scanSrc = extractFn(reports, 'retentionScan');
    ok(/staff\.has\(d\.id\) \|\| d\.id === me\.uid/.test(scanSrc), 'D9 staff and self are filtered before any verdict');
}

console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed` : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
