// leaderboard-keep-test.mjs v1.0.0 — Round 146.
//
// ⚠️⚠️⚠️ A STUDENT'S INITIALS OUTLIVE THEM ON THE LEADERBOARD — AND NOTHING ELSE DOES.
//
// Jake: "I'd like the student chosen initials to live on the leaderboards for as long
// as they survive. I'd like to keep a date with when it hit the leaderboards, too."
// The kept record must carry initials, scores, dates and school ONLY — never the
// account id, class, email or name — or it is not anonymous at all. Part A runs the
// REAL keptRecordFrom() lifted from reports.html against a full live entry.

import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');
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
const reports = read('reports.html'), game = read('game.js');
const constLine = (n) => (new RegExp(`const ${n} = [^;]+;`).exec(reports) || [''])[0];
const lib = new Function(`${constLine('LB_BOARDS')} ${constLine('LB_TOP_N')}
    ${extractFn(reports, 'keptRecordFrom')} ${extractFn(reports, 'lbOnBoardIds')}
    return { keptRecordFrom, lbOnBoardIds, LB_BOARDS };`)();

console.log('\nA — ⚠️⚠️⚠️ THE KEPT RECORD IS ANONYMOUS');
{
    const live = { uid: 'abc123', initials: 'JQW', classId: 'c1', schoolId: 's1', email: 'kid@stu.org',
                   displayName: 'Kid Name', bestWPM: 41, bestWPMAt: '2026-09-25', bestStreak: 88,
                   chaptersCompleted: 0, totalSecondsWeek: 900, weekStart: '2026-09-19', leaderboardOptOut: false };
    const k = lib.keptRecordFrom(live, '2028-10-01');
    const allowed = new Set(['archived', 'initials', 'schoolId', 'archivedOn', 'bestWPM', 'bestWPMAt',
                             'bestStreak', 'bestStreakAt', 'chaptersCompleted', 'chaptersAt']);
    ok(k && Object.keys(k).every(x => allowed.has(x)), `⚠️⚠️⚠️ A1 it holds ONLY initials, scores, dates and school (${Object.keys(k).join(', ')})`);
    ok(!('uid' in k) && !('classId' in k) && !('email' in k) && !('displayName' in k),
       '⚠️⚠️⚠️ A2 no account id, class, email or name');
    ok(!('totalSecondsWeek' in k), 'A3 no weekly time — it means nothing once they are gone');
    ok(k.bestWPM === 41 && k.bestWPMAt === '2026-09-25', 'A4 a score keeps the date it was set');
    ok(k.bestStreakAt === '2028-10-01', 'A5 a score with no date takes the day it was kept, rather than being lost');
    ok(!('chaptersCompleted' in k), 'A6 a zero score is not carried');
    ok(k.archived === true && k.initials === 'JQW', 'A7 marked as kept, with their initials');
    ok(lib.keptRecordFrom({ ...live, leaderboardOptOut: true }, 'x') === null,
       '⚠️⚠️ A8 a student who hid from the leaderboard is NOT kept — the choice outlasts them');
    ok(lib.keptRecordFrom({ ...live, initials: '' }, 'x') === null, 'A9 no initials, nothing to keep');
    ok(lib.keptRecordFrom({ initials: 'AB', bestWPM: 0 }, 'x') === null, 'A10 no scores, nothing to keep');
}

console.log('\nB — WHO IS ON A BOARD');
{
    const e = (id, data) => ({ id, data });
    const many = Array.from({ length: 12 }, (_, i) => e(`s${i}`, { bestWPM: 100 - i }));
    const on = lib.lbOnBoardIds([...many, e('hid', { bestWPM: 999, leaderboardOptOut: true }),
                                 e('kept_x', { archived: true, bestStreak: 5 })]);
    ok(on.has('s0') && on.has('s9') && !on.has('s10'), 'B1 the top 10 of a board are on it; 11th is not');
    ok(!on.has('hid'), 'B2 a hidden student is never counted as on a board');
    ok(on.has('kept_x'), 'B3 a kept record competes like anyone else — it survives while it ranks');
}

console.log('\nC — ⚠️⚠️ WHERE IT HAPPENS, AND WHERE IT NEVER DOES');
{
    const ret = extractFn(reports, 'openRetentionDialog');
    const iKeep = ret.indexOf("await setDoc(doc(db, 'leaderboard', keptRecordId()), kept);");
    const iPurge = ret.indexOf('await purgeExecute(await purgePlan(row.uid)');
    ok(iKeep > 0 && iKeep < iPurge, '⚠️⚠️ C1 Retention writes the kept record BEFORE the purge deletes the live entry');
    ok(/keptRecordId\(\)/.test(ret) && !/doc\(db, 'leaderboard', row\.uid\)/.test(ret),
       '⚠️⚠️⚠️ C2 under a FRESH id, never the student\u2019s account id');
    ok(/for \(const id of r\.lbPrune\) \{ await deleteDoc/.test(ret), 'C3 kept records off every board are removed');
    const scan = extractFn(reports, 'retentionScan');
    ok(/lbPrune: lbAll\.filter\(e => e\.data\.archived && !lbOn\.has\(e\.id\)\)/.test(scan),
       'C4 and only KEPT records are ever pruned — a live student\u2019s entry is never touched here');
    // ⚠️ purgePlan() IS SHARED by "Delete student…" AND Retention, so archiving inside it
    // would keep initials on a deletion request too. The first draft of this check
    // looked only at the dialog, and a mutation planted in purgePlan() slipped past.
    ok(!/keptRecordFrom|keptRecordId/.test(extractFn(reports, 'openPurgeDialog')
         + extractFn(reports, 'purgePlan') + extractFn(reports, 'purgeExecute')),
       '⚠️⚠️⚠️ C5 "Delete student\u2026" keeps NOTHING — a deletion request removes the initials too');
    const bf = extractFn(reports, 'backfillLeaderboardDates');
    ok(/if \(!isSuper\(\)\) return;/.test(bf) && /!e\[at\]/.test(bf) && /if \(e\.archived\) continue;/.test(bf),
       '⭐ C6 the backfill: super-admin only, fills only MISSING dates, leaves kept records alone');
}

console.log('\nD — THE STUDENT SIDE');
{
    const map = JSON.parse(((/const LB_DATE_OF = (\{[^}]+\});/.exec(game) || [, '{}'])[1]).replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
    ok(JSON.stringify(Object.entries(map).sort()) === JSON.stringify([...lib.LB_BOARDS].sort()),
       '⚠️ D1 game.js and reports.html agree on which boards carry which date');
    ok(/\.\.\.\(bestWPMAt \? \{ bestWPMAt \} : \{\}\)/.test(game) && /\.\.\.\(chaptersAt \? \{ chaptersAt \} : \{\}\)/.test(game),
       '⚠️⚠️ D2 a blank date is never written — an open student tab cannot erase a backfilled one');
    ok(/chaptersAt\s*=\s*newChapters\s*>\s*\(existing\.chaptersCompleted \|\| 0\)\s*\?\s*_lbToday/.test(game),
       'D3 Chapters now records a date too, set only when beaten');
    ok(/const dateTag = isAdmin && \(setAt \|\| entry\.archived\)/.test(game), 'D4 dates show to the admin alone');
}

console.log('\nE — THE DOCUMENTS SAY THE SAME');
{
    const pol = read('privacy.html').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    ok(/any leaderboard place they still hold stays until someone beats it/.test(pol) &&
       /showing only their chosen initials, the score, the date it was set and their school/.test(pol),
       'E1 the policy: an aged-out place stays, by initials, score, date and school');
    ok(/including any leaderboard place/.test(pol), 'E2 and a deletion request removes it');
    ok(/a deletion request keeps nothing/.test(read('SECURITY.md')), 'E3 SECURITY.md agrees');
}

console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed` : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
