// account-names-test.mjs v1.0.0 — Round 148.
//
// ⚠️⚠️ A STUDENT'S NAME IS SAVED ON THEIR ACCOUNT — ONCE, AND ONLY THEIR REAL ONE.
//
// The reports page's student picker reads accounts (one read each) and showed 178 of
// 178 students as "(no name)": names lived only on typing records, so seeing them meant
// a full report (~1,600 reads). Jake explicitly overruled Rule 9 for this second copy
// on 2026-09-25, because it SAVES reads and removing the other copies would save none.

import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok    ' + m); } else { fails.push(m); console.log('  FAIL  ' + m); } };
const { identityPlan } = await import(path.join(ROOT, 'lesson-gate.js'));
const user = { uid: 'u1', displayName: 'Ada Lovelace', email: 'Ada.L@stu.org', isAnonymous: false };

console.log('\nA — ONE WRITE PER STUDENT, EVER');
ok(JSON.stringify(identityPlan({}, user)) === JSON.stringify({ displayName: 'Ada Lovelace', email: 'Ada.L@stu.org' }),
   'A1 a student with nothing saved gets both, exactly as the sign-in has them (not lower-cased)');
ok(identityPlan({ displayName: 'Ada Lovelace', email: 'Ada.L@stu.org' }, user) === null,
   '⭐ A2 once saved, nothing is written again — the common case costs nothing');
ok(JSON.stringify(identityPlan({ displayName: 'Ada L', email: 'Ada.L@stu.org' }, user)) === '{"displayName":"Ada Lovelace"}',
   'A3 a changed name updates only the name');
ok(identityPlan({}, { ...user, isAnonymous: true }) === null && identityPlan({}, null) === null, 'A4 guests and signed-out pages write nothing');

console.log('\nB — ⚠️⚠️ LIBRARY, SCHOOL AND THE LESSONS BETA ALL SAVE IT — IN ITS OWN WRITE');
for (const f of ['game.js', 'learn.js', 'learn2.js']) {
    const s = read(f);
    const i = s.indexOf('const _idp = identityPlan(');
    const w = s.indexOf("await setDoc(doc(db, 'users', currentUser.uid), _idp, { merge: true });", i);
    const plan = s.indexOf('const plan = activeDayPlan(', i);
    ok(i > 0 && w > i && w < plan, `B1 ${f} saves the name BEFORE, and separately from, the day stamp`);
    ok(/catch \(e\) \{ console\.warn\('\[account\] name not saved/.test(s.slice(i, plan)),
       `⚠️ B2 ${f}: a rejected name is caught, so the day stamp still lands`);
}

console.log('\nC — ⚠️⚠️⚠️ THE RULES ACCEPT ONLY THE SIGNED-IN ACCOUNT\u2019S OWN NAME');
{
    const r = read('firebase/firestore.rules');
    const blk = r.slice(r.indexOf('    match /users/{uid} {'), r.indexOf('    match /users/{uid}/stats/{docId}'));
    const code = blk.replace(/^\s*\/\/.*$/gm, '');
    ok(/hasAny\(\['displayName'\]\)\s*\|\| request\.resource\.data\.displayName == request\.auth\.token\.name/.test(code),
       '⚠️⚠️ C1 update: a changed name must equal the sign-in token\u2019s name — no renaming yourself as a classmate');
    ok(/hasAny\(\['email'\]\)\s*\|\| request\.resource\.data\.email == request\.auth\.token\.email/.test(code), 'C2 and the same for email');
    ok(/allow create: if \(request\.auth\.uid == uid\s*&& \(!\('displayName' in request\.resource\.data\)/.test(code), 'C3 and on create');
    ok(/allow update: if \(request\.auth\.uid == uid\s*&& \(!request\.resource\.data\.diff/.test(code),
       'C4 checked only when the field CHANGES — every other owner write is as before');
}

console.log('\nD — THE PICKER REMEMBERS THE DAY\u2019S LIST');
{
    const s = read('reports.html');
    ok(/rosterCacheSave\(roster\);/.test(s), 'D1 \u27f3 saves the list it read');
    ok(/c\.date !== toDateStr\(new Date\(\)\) \|\| c\.scope !== rosterScopeKey\(\)/.test(s),
       '⚠️ D2 a remembered list is used only the same day, for the same school and class');
    ok(/if \(!sel \|\| sel\.options\.length > 1\) return;/.test(s), 'D3 and only to fill an EMPTY picker — never over a fresher one');
}

console.log('\nE — ⭐ THE PRIVACY POLICY NEEDED NO CHANGE, AND STILL DOESN\u2019T');
{
    const pol = read('privacy.html').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    ok(/Name and school email address, from the student's school Google account/.test(pol),
       'E1 name and email were already disclosed as collected — where they are stored inside the site is not a promise the policy makes');
    ok(/temporary copies of data so pages load faster/.test(pol), 'E2 the day\u2019s list in the teacher\u2019s browser is covered by the browser-storage section');
    ok(/Rule 9 WAS EXPLICITLY OVERRULED BY JAKE/i.test(read('lesson-gate.js')), 'E3 the Rule 9 overrule is recorded where the code lives');
}

console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed` : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
