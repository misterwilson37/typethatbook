// teacher-change-stamp-test.mjs v1.0.0 — Round 145.
//
// ⚠️⚠️⚠️ A TEACHER'S CORRECTION MUST SURVIVE THE STUDENT'S NEXT PAGE LOAD.
//
// Jake deleted two students' farmed minutes on 2026-09-23. Reports then showed the
// corrected 8:27 for one student's week — and on 9/24 that student's own screen read
// "Weekly ~28/50". stats-wal.js's recovery took the LARGER of the browser's log and the
// server for the whole week, so the correction was undone on every load. On the SAME
// day the day counters are merged too, and game.js's flush writes secondsToday into
// today's record — a same-day deletion would have been written straight back.
//
// ⭐ RULE 10: Part B uses that student's real numbers — 507 s on the server (reports:
// 8:27), and the ~1,579 s his log held from 9/22–23 — and runs the REAL stats-wal.js
// and daylog.js, seeding the log through the REAL statsWalSave().

import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok    ' + m); } else { fails.push(m); console.log('  FAIL  ' + m); } };

const mem = new Map();
globalThis.localStorage = {
    getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => mem.set(k, String(v)),
    removeItem: k => mem.delete(k), clear: () => mem.clear(),
};
const wal = await import(path.join(ROOT, 'stats-wal.js'));
const dl = await import(path.join(ROOT, 'daylog.js'));

const UID = 'kidSherlock', WEEK = '2026-09-19';
const server = () => ({ lastDate: '2026-09-24', weekStart: WEEK, secondsToday: 507, secondsWeek: 507 });

console.log('\nA — ⚠️⚠️ THE RULES LET A TEACHER STAMP A CHANGE, AND ONLY THAT');
{
    const r = read('firebase/firestore.rules').replace(/^\s*\/\/.*$/gm, '');
    const i = r.indexOf("hasOnly(['logsChangedAt'])");
    const clause = i > 0 ? r.slice(r.lastIndexOf('|| (isStaff()', i), r.indexOf(';', i) + 1) : '';
    ok(i > 0, 'A1 staff may update users/{uid} with logsChangedAt as the ONLY changed field');
    ok(/logsChangedAt == request\.time/.test(clause), '⚠️ A2 set to the SERVER clock only — never a future date that defeats later stamps');
    ok(/inMySchool\(resource\.data\.schoolId\)[\s\S]*teachesClass\(resource\.data\.classId\)/.test(clause),
       'A3 and only for a student in the teacher\u2019s school or class');
}

console.log('\nB — ⚠️⚠️⚠️ THE REAL CASE, ON THE REAL LOG');
{
    mem.clear();
    // Before the deletion (9/23), the student's browser logged his farmed week.
    wal.statsWalSave(UID, { lastDate: '2026-09-23', weekStart: WEEK, secondsToday: 842, secondsWeek: 1579 });
    const s = server();
    wal.statsWalRecover(UID, s);
    ok(s.secondsWeek === 1579,
       `⚠️⚠️ B1 THE BUG, REPRODUCED: the old recovery puts his week back to ${s.secondsWeek} s over the server\u2019s 507`);

    mem.clear();
    wal.statsWalSave(UID, { lastDate: '2026-09-23', weekStart: WEEK, secondsToday: 842, secondsWeek: 1579 });
    const s2 = server(); let asked = 0;
    const r2 = await wal.statsWalRecoverChecked(UID, s2, async () => { asked++; return { changed: true, stamp: 1000 }; });
    ok(s2.secondsWeek === 507 && r2.teacherChanged && !r2.moved,
       '⚠️⚠️⚠️ B2 WITH A TEACHER CHANGE, THE SERVER WINS: the week stays 507 s');
    ok(!wal.statsWalWouldMove(UID, server()), 'B3 and the stale log is discarded, so it cannot win next time either');

    mem.clear();
    wal.statsWalSave(UID, { lastDate: '2026-09-24', weekStart: WEEK, secondsToday: 900, secondsWeek: 900 });
    const s3 = { lastDate: '2026-09-24', weekStart: WEEK, secondsToday: 0, secondsWeek: 0 };
    await wal.statsWalRecoverChecked(UID, s3, async () => ({ changed: true, stamp: 2000 }));
    ok(s3.secondsToday === 0,
       '⚠️⚠️⚠️ B4 THE SAME-DAY CASE: a run deleted today is NOT put back into today\u2019s counter — the one the flush writes');

    mem.clear();
    wal.statsWalSave(UID, { lastDate: '2026-09-24', weekStart: WEEK, secondsToday: 600, secondsWeek: 1107 });
    const s4 = server();
    const r4 = await wal.statsWalRecoverChecked(UID, s4, async () => ({ changed: false, stamp: 0 }));
    ok(r4.moved && s4.secondsToday === 600,
       '⭐ B5 WITHOUT a teacher change, genuine unflushed time IS still recovered — the protection is intact');

    mem.clear(); asked = 0;
    const r5 = await wal.statsWalRecoverChecked(UID, server(), async () => { asked++; return { changed: true }; });
    ok(!r5.moved && asked === 0, '⭐ B6 when the log would not raise anything, the stamp is never read — no cost');

    mem.clear();
    wal.statsWalSave(UID, { lastDate: '2026-09-24', weekStart: WEEK, secondsToday: 600, secondsWeek: 1107 });
    const s6 = server();
    await wal.statsWalRecoverChecked(UID, s6, async () => { throw new Error('offline'); });
    ok(s6.secondsToday === 600, 'B7 a failed stamp read is treated as "no change" — unflushed time is not thrown away on a blip');
}

console.log('\nC — THE STAMP ITSELF');
{
    mem.clear();
    const fake = (v, fail) => ({ db: {}, doc: (_d, ...p) => p.join('/'),
        getDoc: async () => { if (fail) throw new Error('x'); return { exists: () => v !== undefined, data: () => ({ logsChangedAt: v }) }; } });
    const ts = { toMillis: () => 5000 };
    let r = await dl.teacherChangedSince({ ...fake(ts), uid: UID });
    ok(r.changed && r.stamp === 5000, 'C1 a stamp this browser has not honoured reads as a change');
    dl.ackTeacherChange(UID, r.stamp);
    r = await dl.teacherChangedSince({ ...fake(ts), uid: UID });
    ok(!r.changed, 'C2 once honoured, the same stamp is not a change again');
    r = await dl.teacherChangedSince({ ...fake({ toMillis: () => 9000 }), uid: UID });
    ok(r.changed, 'C3 a newer stamp is');
    ok(!(await dl.teacherChangedSince({ ...fake(undefined), uid: 'nobody' })).changed, 'C4 no stamp at all is no change');
    ok(!(await dl.teacherChangedSince({ ...fake(ts, true), uid: 'other' })).changed, 'C5 a failed read is no change');
    const r2 = await dl.teacherChangedSince({ ...fake(ts), uid: 'someoneElse' });
    ok(r2.changed, '⚠️ C6 honouring one student\u2019s stamp never hides another\u2019s on a shared machine');
}

console.log('\nD — ⚠️⚠️ LIBRARY, SCHOOL AND THE LESSONS BETA RUN THE SAME GATE');
{
    const gate = (f) => {
        const s = read(f); const i = s.indexOf('ROUND 145 \u2014 THE LOG MAY NOT UNDO');
        const j = s.indexOf('if (_wal.moved) {', i);
        return i > 0 && j > i ? s.slice(i, j).replace(/\n\s*lbServerWins = true;[^\n]*/, '') : '';
    };
    const [g, l, l2] = ['game.js', 'learn.js', 'learn2.js'].map(gate);
    ok(g && l && l2, 'D1 all three files carry the gate');
    ok(g === l && l === l2, '⚠️⚠️ D2 and it is byte-identical in all three — one rule, three readers (Rule 11)');
    for (const f of ['game.js', 'learn.js', 'learn2.js']) {
        const code = read(f).replace(/^\s*\/\/.*$/gm, '');
        ok(!/if \(statsWalRecover\(currentUser\.uid, statsData\)\)/.test(code), `D3 ${f} no longer calls the ungated recovery`);
    }
    ok(/_fresh = await readWeek\(/.test(g) && /clearDayCache\(currentUser\.uid\)/.test(g) && /ackTeacherChange\(/.test(g),
       'D4 on a change the week is re-read from scratch, cache dropped, stamp honoured');
}

console.log('\nE — YOUR SIDE: EVERY CORRECTION IS STAMPED');
{
    const r = read('reports.html');
    const save = r.indexOf('secondsLibrary: deleteField(), charsLibrary: deleteField()');
    const recalc = r.indexOf('...recalcPayload,');
    ok(save > 0 && r.indexOf('await stampLogsChanged(uidOfLogDoc(log.docId));', save) > save, 'E1 the SAVE button stamps after writing');
    ok(recalc > 0 && r.indexOf('await stampLogsChanged(uid);', recalc) > recalc,
       'E2 recalculation stamps after writing — and run-delete, session-delete and \u27f3 all go through it');
    ok(/logsChangedAt: serverTimestamp\(\)/.test(r), 'E3 with the server\u2019s clock');
    const uidOf = (docId) => String(docId || '').slice(0, String(docId || '').lastIndexOf('_'));
    ok(uidOf('abcXYZ_2026-09-24') === 'abcXYZ', 'E4 the uid is recovered from a day record\u2019s id');
}

console.log('\nF — ⚠️ THE LEADERBOARD\u2019S FLOOR YIELDS');
{
    const g = read('game.js');
    ok(/lbOwnEntry\.totalSecondsWeek = lbServerWins\s*\?\s*derivedWeek/.test(g), 'F1 after a correction the board takes the true weekly total');
    const i = g.indexOf('lbLastWriteTime = Date.now();');
    ok(/lbServerWins = false;/.test(g.slice(i, i + 120)), 'F2 and the flag clears only once that write has landed');
    ok(/bestWPMAt\s*=\s*newBestWPM\s*>\s*\(existing\.bestWPM \|\| 0\)\s*\?\s*_lbToday/.test(g),
       '⭐ F3 a record\u2019s date is set only when the record is actually beaten');
}

console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed` : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
