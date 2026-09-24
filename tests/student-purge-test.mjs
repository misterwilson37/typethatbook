// student-purge-test.mjs v1.0.0 — Round 136 (Caslon II). ROADMAP 135a.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ "DELETE THIS STUDENT" DELETES EXACTLY ONE STUDENT, COMPLETELY, SAFELY.
// ═════════════════════════════════════════════════════════════════════════════
//
// SECURITY.md §7 promises deletion within 30 days of a request; Tenn. Code
// § 49-1-708 requires it on a district's request. Jake: *"obviously we need a
// 'are you super duper sure?' modal before deleting stuff."*
//
// ⭐ PART B RUNS THE REAL purgePlan() AND purgeExecute() — lifted from
// reports.html — against an in-memory database holding TWO students, because the
// one failure that would matter more than any other is deleting the wrong child.
//
// ⭐⭐ PART A IS THE ONE THAT PROTECTS THE FUTURE. It reads every collection the
// RULES file knows about and demands each be classified here — student data the
// purge removes, student data the console removes, or not student data. A
// collection added to the rules later that nobody classified fails the suite, so
// a new place a child's data lives cannot quietly escape "delete this student".

import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const reports = readFileSync(path.join(ROOT, 'reports.html'), 'utf8');
const rules = readFileSync(path.join(ROOT, 'firebase', 'firestore.rules'), 'utf8');
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok    ' + m); } else { fails.push(m); console.log('  FAIL  ' + m); } };
function extractFn(src, name) {
    let start = src.indexOf(`function ${name}(`);
    if (start < 0) return null;
    // ⚠️ KEEP A LEADING `async`. Slicing from `function` drops it, and an async
    // body lifted without it is a SyntaxError on its first `await`.
    if (src.slice(Math.max(0, start - 6), start) === 'async ') start -= 6;
    let i = src.indexOf('{', start), depth = 0;
    for (let j = i; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
    }
    return null;
}
const constSrc = (name) => { const m = new RegExp(`const ${name} = [\\s\\S]*?\\];`).exec(reports); return m ? m[0] : null; };

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA — ⭐⭐ EVERY COLLECTION IN THE RULES IS CLASSIFIED');
const CLASS = {
    // student data the purge removes
    'users/{uid}': 'purge', 'users/{uid}/stats/{docId}': 'purge',
    'users/{uid}/{collection}/{docId}': 'purge',
    'typing_logs/{docId}': 'purge', 'typing_sessions/{id}': 'purge',
    'practice_sessions/{id}': 'purge', 'leaderboard/{uid}': 'purge',
    'pendingClassAssignments/{email}': 'purge',
    // student data only the Firebase console can remove (rules: read, write: false)
    'practice_limits/{uid}': 'console',
    // not student data
    'staff/{uid}': 'staff', 'pendingStaffRoles/{email}': 'staff', 'staffRequests/{uid}': 'staff',
    // Round 142: a teacher's write-once COPPA consent record — staff data, not a child's.
    'coppaAttestations/{docId}': 'staff',
    'schools/{schoolId}': 'none', 'classes/{classId}': 'none', 'books/{bookId}': 'none',
    'chapters/{chapterId}': 'none', 'lessons/{lessonId}': 'none', 'settings/{docId}': 'none',
    '{document=**}': 'none',
};
const matches = [...rules.replace(/^\s*\/\/.*$/gm, '').matchAll(/match \/([^ ]+) \{/g)]
    .map(m => m[1]).filter(p => !p.startsWith('databases/'));
const unclassified = matches.filter(p => !(p in CLASS));
ok(matches.length >= 18, `A1 the rules declare ${matches.length} collections`);
ok(unclassified.length === 0,
   '⚠️⚠️⚠️ A2 every one is classified as student data or not'
   + (unclassified.length ? ` — UNCLASSIFIED: ${unclassified.join(', ')}. Decide whether it holds a child\u2019s data.` : ''));

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB — ⚠️⚠️⚠️ THE REAL PURGE, AGAINST TWO STUDENTS');
function fakeDb() {
    const store = new Map();
    const order = [];
    const api = {
        doc: (_db, ...p) => ({ path: p.join('/') }),
        collection: (_db, ...p) => ({ coll: p.join('/') }),
        where: (field, _op, value) => ({ field, value }),
        query: (c, w) => ({ coll: c.coll, w }),
        getDoc: async (ref) => ({ ref, exists: () => store.has(ref.path), data: () => store.get(ref.path) }),
        getDocs: async (q) => ({ docs: [...store.entries()]
            .filter(([p]) => p.startsWith(q.coll + '/') && !p.slice(q.coll.length + 1).includes('/'))
            .filter(([, d]) => !q.w || d[q.w.field] === q.w.value)
            .map(([p, d]) => ({ ref: { path: p }, data: () => d })) }),
        deleteDoc: async (ref) => { order.push(ref.path); store.delete(ref.path); },
    };
    return { store, order, api };
}
function seed(store, uid, email, n) {
    store.set(`users/${uid}`, { email, displayName: `Kid ${uid}` });
    for (const sub of ['progress', 'profile', 'lessonProgress', 'stats'])
        for (let i = 0; i < 2; i++) store.set(`users/${uid}/${sub}/d${i}`, { x: 1 });
    for (let i = 0; i < n; i++) store.set(`typing_logs/${uid}_2026-09-${10 + i}`, { uid, email, seconds: 60 });
    for (let i = 0; i < n; i++) store.set(`typing_sessions/s_${uid}_${i}`, { uid });
    store.set(`practice_sessions/p_${uid}`, { uid, email });
    store.set(`leaderboard/${uid}`, { shatter: 10 });
    store.set(`pendingClassAssignments/${email}`, { classId: 'c1' });
}
const makePurge = (api) => new Function('api', `
    const { doc, collection, where, query, getDoc, getDocs, deleteDoc } = api;
    const db = {};
    ${constSrc('PURGE_SUBCOLLECTIONS')}
    ${constSrc('PURGE_BY_UID_FIELD')}
    ${extractFn(reports, 'purgePlan')}
    ${extractFn(reports, 'purgeExecute')}
    return { purgePlan, purgeExecute };
`)(api);
{
    const { store, order, api } = fakeDb();
    seed(store, 'kidA', 'a@school.org', 5);
    seed(store, 'kidB', 'b@school.org', 7);
    const before = store.size;
    const bKeys = [...store.keys()].filter(k => k.includes('kidB') || k.includes('b@school'));
    const { purgePlan, purgeExecute } = makePurge(api);

    const plan = await purgePlan('kidA');
    ok(store.size === before, '⭐ B1 PHASE 1 DELETES NOTHING — counting is reads only');
    ok(plan.email === 'a@school.org' && plan.name === 'Kid kidA', 'B2 the plan names the right child');
    ok(plan.total === 1 + 8 + 5 + 5 + 1 + 1 + 1,
       `B3 it finds every one of kidA\u2019s ${plan.total} records`);

    await purgeExecute(plan, () => {});
    const aLeft = [...store.keys()].filter(k => k.includes('kidA') || k.includes('a@school'));
    ok(aLeft.length === 0, `⚠️⚠️⚠️ B4 NOTHING OF kidA SURVIVES (${aLeft.length} left)`);
    ok(bKeys.every(k => store.has(k)),
       `⚠️⚠️⚠️ B5 AND EVERY ONE OF kidB\u2019s ${bKeys.length} RECORDS IS UNTOUCHED — the wrong child is never deleted`);
    ok(order[order.length - 1] === 'users/kidA',
       '⚠️⚠️ B6 the ACCOUNT RECORD is deleted LAST, so an interrupted run leaves the child findable');

    // ⚠️ AN INTERRUPTED RUN IS SAFE TO REPEAT.
    const f2 = fakeDb(); seed(f2.store, 'kidC', 'c@school.org', 4);
    const p2 = makePurge(f2.api);
    const plan2 = await p2.purgePlan('kidC');
    let n = 0; const realDelete = f2.api.deleteDoc;
    f2.api.deleteDoc = async (r) => { if (++n > 6) throw new Error('connection dropped'); return realDelete(r); };
    const p2b = makePurge(f2.api);
    let threw = false;
    try { await p2b.purgeExecute(plan2, () => {}); } catch { threw = true; }
    ok(threw && f2.store.has('users/kidC'), 'B7 a run that dies partway still leaves the account record, so the child is still listed');
    f2.api.deleteDoc = realDelete;
    const p2c = makePurge(f2.api);
    await p2c.purgeExecute(await p2c.purgePlan('kidC'), () => {});
    ok(![...f2.store.keys()].some(k => k.includes('kidC') || k.includes('c@school')),
       '⭐ B8 and running it again finishes the job cleanly');

    // ⚠️ A USER DOCUMENT WITH NO EMAIL — Round 130 found students' often have none.
    const f3 = fakeDb(); seed(f3.store, 'kidD', 'd@school.org', 3);
    f3.store.set('users/kidD', {});
    const plan3 = await makePurge(f3.api).purgePlan('kidD');
    ok(plan3.email === 'd@school.org',
       'B9 with no email on the account, the email is recovered from the child\u2019s own logs');
    ok(plan3.steps.some(st => st.label === 'pending class assignment' && st.refs.length === 1),
       'B10 so the pending class assignment keyed by that email is still found');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC — ⚠️⚠️ THE RULES LET A SUPER-ADMIN DELETE EVERY PURGED COLLECTION');
{
    const block = (p) => {
        const i = rules.indexOf(`match /${p} {`);
        if (i < 0) return '';
        let depth = 0;
        // ⚠️ START AT THE BLOCK'S OWN BRACE, not the first `{` after `match` — that
        // one is the `{uid}` inside the path, and counting from it reads nonsense.
        for (let j = i + `match /${p} `.length; j < rules.length; j++) {
            if (rules[j] === '{') depth++; else if (rules[j] === '}' && --depth === 0) return rules.slice(i, j);
        }
        return '';
    };
    const code = (p) => block(p).replace(/^\s*\/\/.*$/gm, '');
    ok(/allow delete: if request\.auth\.uid == uid \|\| isSuper\(\)/.test(code('users/{uid}')), 'C1 users/{uid}');
    ok(/allow read, write: if request\.auth\.uid == uid\s*\|\| isSuper\(\)/.test(code('users/{uid}/stats/{docId}')), 'C2 stats');
    ok(/allow delete: if isSuper\(\);/.test(code('users/{uid}/{collection}/{docId}')),
       '⚠️⚠️⚠️ C3 progress / profile / lessonProgress — the v2.14.0 line that makes deletion possible at all');
    ok(!/allow write: if isSuper/.test(code('users/{uid}/{collection}/{docId}')),
       '⚠️ C4 and it is DELETE ONLY — no staff member gains create or update on a child\u2019s progress');
    ok(/allow delete: if isSuper\(\)/.test(code('typing_logs/{docId}')), 'C5 typing_logs');
    ok(/allow delete: if canReadActivity/.test(code('typing_sessions/{id}')), 'C6 typing_sessions');
    ok(/allow update, delete: if isSuper\(\)/.test(code('practice_sessions/{id}')), 'C7 practice_sessions');
    ok(/allow delete: if isSuper\(\)/.test(code('leaderboard/{uid}')), 'C8 leaderboard');
    ok(/\|\| isStaff\(\)/.test(code('pendingClassAssignments/{email}')), 'C9 pendingClassAssignments');
    ok(/allow read, write: if false/.test(code('practice_limits/{uid}')),
       '⚠️ C10 practice_limits really is console-only — which is why the dialog sends Jake there');
    const sub = /collection in \[([^\]]+)\]/.exec(code('users/{uid}/{collection}/{docId}'));
    const inRules = sub ? sub[1].split(',').map(x => x.trim().replace(/'/g, '')).sort() : [];
    const inCode = (/PURGE_SUBCOLLECTIONS = \[([^\]]+)\]/.exec(reports) || [, ''])[1]
        .split(',').map(x => x.trim().replace(/'/g, '')).filter(Boolean).sort();
    ok(JSON.stringify(inRules) === JSON.stringify(inCode),
       `⚠️⚠️ C11 the purge clears exactly the subcollections the rules allow (${inCode.join(', ')})`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD — ⚠️⚠️ "ARE YOU SUPER DUPER SURE?"');
{
    const dlg = extractFn(reports, 'openPurgeDialog');
    const btn = extractFn(reports, 'updatePurgeButton');
    ok(/isSuper\(\)/.test(btn) && /isSuper\(\)/.test(dlg), 'D1 super-admin only, checked at the button AND in the dialog');
    ok(/hidden/.test(btn), 'D2 hidden, not merely disabled, for everyone else');
    ok(/id="ttb-purge-go" disabled/.test(dlg), '⚠️⚠️⚠️ D3 the Delete button starts DISABLED');
    ok(/go\.disabled = input\.value\.trim\(\)\.toLowerCase\(\) !== phrase\.toLowerCase\(\)/.test(dlg),
       '⚠️⚠️ D4 and is enabled only by typing the child\u2019s email EXACTLY — not a prefix, not "contains"');
    ok(/input\.focus\(\)/.test(dlg) && !/go\.focus\(\)/.test(dlg),
       '⭐ D5 focus goes to the text box, never to the destructive button');
    ok(/cannot be undone/i.test(dlg), 'D6 it says plainly that this cannot be undone');
    ok(dlg.indexOf('purgePlan(uid)') < dlg.indexOf('ttb-purge-go'),
       '⭐ D7 the count is shown BEFORE the confirmation is asked for');
    ok(/authentication\/users/.test(dlg) && /practice_limits/.test(dlg),
       '⚠️ D8 it ends with the two console steps no web page can do, and links to both');
    ok(/Deletion stopped partway/.test(dlg) && /again to finish/.test(dlg),
       'D9 a failure says it is safe to run again, rather than leaving the teacher to guess');
}

console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed` : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
