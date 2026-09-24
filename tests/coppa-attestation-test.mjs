// coppa-attestation-test.mjs v1.0.0 — Round 142.
//
// ⚠️⚠️⚠️ EVERY TEACHER CONFIRMS THEIR SCHOOL'S CONSENT ONCE, AND THE RECORD CANNOT
//        BE EDITED.
//
// Jake: *"Build the checkbox now so that when the other guy signs in, it asks for
// permission. It can ask me for permission, too. That way there's a record of it in
// the database, as well as a truthful method of getting that permission."*
//
// ⭐ The rules are the part that matters: an attestation anyone could edit later is
// not evidence of anything. Part A pins them; Part B the dialog; Part C that the
// policy's description of this matches what exists.

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
const rules = read('firebase/firestore.rules');
const reports = read('reports.html');

console.log('\nA — ⚠️⚠️⚠️ THE RULES MAKE IT EVIDENCE');
{
    const i = rules.indexOf('match /coppaAttestations/{docId} {');
    let blk = '', depth = 0;
    for (let j = i + 'match /coppaAttestations/{docId} '.length; i > 0 && j < rules.length; j++) {
        if (rules[j] === '{') depth++; else if (rules[j] === '}' && --depth === 0) { blk = rules.slice(i, j); break; }
    }
    const code = blk.replace(/^\s*\/\/.*$/gm, '');
    ok(i > 0, 'A0 the collection exists in the rules');
    ok(/allow create: if isStaff\(\)/.test(code), 'A1 only STAFF can create one — never a student');
    ok(/docId == request\.auth\.uid \+ '_' \+ request\.resource\.data\.version/.test(code)
       && /request\.resource\.data\.uid == request\.auth\.uid/.test(code),
       '⚠️⚠️ A2 a teacher can create ONLY their own record — nobody attests for someone else');
    ok(/keys\(\)\.hasOnly\(/.test(code), 'A3 only the expected fields may be written');
    ok(/attestedAt == request\.time/.test(code), '⚠️⚠️ A4 the date is stamped by the SERVER — it cannot be backdated');
    ok(/allow update: if false;/.test(code), '⚠️⚠️⚠️ A5 NOBODY CAN EDIT ONE — not even the super-admin');
    ok(/docId\.matches\(/.test(code) && !/allow read:[^;]*resource\.data/.test(code),
       '⚠️ A6 reading is by document id, so checking for a missing record says "not found", not "denied"');
    const staffBlk = rules.slice(rules.indexOf('match /staff/{uid} {'), rules.indexOf('match /staff/{uid} {') + 400);
    ok(!/coppa/i.test(staffBlk.replace(/^\s*\/\/.*$/gm, '')),
       '⭐ A7 and the staff record — the guard on role escalation — was not touched');
}

console.log('\nB — THE DIALOG');
{
    const ask = extractFn(reports, 'maybeAskCoppaAttestation');
    const dlg = extractFn(reports, 'openCoppaAttestation');
    ok(/if \(!me\.uid \|\| !me\.role\) return;/.test(ask), 'B1 asked of staff only');
    ok(/maybeAskCoppaAttestation\(\);/.test(reports), 'B2 and asked as soon as the role is known');
    ok(/id="ttb-coppa-ok" disabled/.test(dlg) && /ok\.disabled = !check\.checked/.test(dlg),
       '⚠️⚠️ B3 Confirm stays disabled until the box is actually ticked');
    ok(/check\.focus\(\)/.test(dlg) && !/ok\.focus\(\)/.test(dlg), 'B4 focus to the checkbox, never to Confirm');
    const notYet = dlg.slice(dlg.indexOf('function notYet'), dlg.indexOf("box.querySelector('#ttb-coppa-later')"));
    ok(notYet.length > 0 && !/setDoc/.test(notYet), '⚠️ B5 "Not yet" writes NOTHING — it is not a refusal on record');
    ok(/statement: COPPA_ATTEST_STATEMENT/.test(dlg) && /version: COPPA_ATTEST_VERSION/.test(dlg),
       '⚠️⚠️ B6 the exact wording agreed to is saved with the record');
    ok(/attestedAt: serverTimestamp\(\)/.test(dlg), 'B7 with a server timestamp');
    ok(/my school has approved/.test(reports) && /on behalf of my school I consent/.test(reports),
       '⚠️⚠️ B8 the statement says the SCHOOL approved — the teacher records it, the school grants it');
    ok(/href="\.\/privacy\.html"/.test(dlg), 'B9 and links the policy being consented to');
    ok(/A FAILED CHECK IS NOT A "NO"/.test(ask) && /return;\s*\}\s*openCoppaAttestation/.test(ask),
       'B10 a failed lookup does not put the form in front of a teacher who already signed it');
}

console.log('\nC — ⭐ THE DOCUMENTS DESCRIBE WHAT EXISTS');
{
    const pol = read('privacy.html').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    ok(/each teacher confirms that their school has approved it and consents on parents' behalf/.test(pol),
       'C1 the policy says each teacher confirms their school\u2019s approval and consent');
    ok(/cannot be edited/.test(read('SECURITY.md')), 'C2 SECURITY.md says the record cannot be edited — and A5 makes that true');
}

console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed` : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
