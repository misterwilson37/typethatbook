// staff-role-editor-test.mjs v1.0.0 — Round 80 (Imperial), ROADMAP 65.
//
// v1.0.0 — RULES FIRST, AGAIN. firestore.rules already allowed a super_admin
//          to edit — including narrow — a FELLOW super_admin, and to touch
//          no one's record but their own (see firestore-rules.test.mjs's
//          rewritten "staff records" block, and the two mutation-verified
//          cases proving the fellow-super-admin backstop and the self-edit
//          block are both real). This file covers the UI defect that sat on
//          top of an already-correct rule: the role dropdown never offered
//          'super_admin' as a choice, so opening Edit on an existing
//          super_admin silently fell back to the dropdown's first entry
//          instead of showing what they actually were — an unforced,
//          silent demotion waiting for someone to click Save without
//          noticing.
//
// STRUCTURAL ONLY: bindUI(), openGrantFor() and doGrant() are all bound to
// document.getElementById() and Firestore; none is a pure function worth
// extracting and running the way class-teacher-editor-test.mjs could for
// _canReassignTeachers(). See anon-ladder-test.mjs's header for why that's
// graded lower, and firestore-rules.test.mjs for where the real behavioural
// coverage of this feature actually lives.
//
// Run: node tests/staff-role-editor-test.mjs   (or via run-all-tests.mjs)

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const src = readFileSync(new URL('../staff-admin.js', import.meta.url), 'utf8');

function extractFn(s, name) {
    const start = s.indexOf(`function ${name}(`);
    if (start < 0) return null;
    let depth = 0;
    for (let j = s.indexOf('{', start); j < s.length; j++) {
        if (s[j] === '{') depth++;
        else if (s[j] === '}') { depth--; if (depth === 0) return s.slice(start, j + 1); }
    }
    return null;
}

// ═══════════════ A. bindUI() — the dropdown itself must offer it ══════════
const bindUISrc = extractFn(src, 'bindUI') || '';
ok(bindUISrc.length > 0, 'staff-admin.js defines bindUI()');
ok(/\['teacher',\s*'building_admin',\s*'super_admin'\]/.test(bindUISrc),
   "a super_admin viewer's role dropdown offers 'super_admin' as a choice — this is the fix itself");
ok(/\?\s*\['teacher',\s*'building_admin',\s*'super_admin'\]\s*\n?\s*:\s*\['teacher'\]/.test(bindUISrc),
   'a non-super viewer (building_admin) still only offers \'teacher\' — unchanged by this fix');

// ═══════════════ B. openGrantFor() — must be able to PRE-SELECT it ════════
const openGrantSrc = extractFn(src, 'openGrantFor') || '';
ok(openGrantSrc.length > 0, 'staff-admin.js defines openGrantFor()');
// ⚠️ THE SECOND HALF OF THE SAME BUG: this file used to special-case
// `current.role !== 'super_admin'` right where the pre-select happens, which
// would have silently reintroduced the exact failure even after bindUI()'s
// list was fixed, since editing an existing super_admin would still refuse
// to select it.
ok(!/current\??\.role\s*&&\s*current\.role\s*!==\s*'super_admin'/.test(openGrantSrc),
   'the pre-select no longer explicitly excludes \'super_admin\' — that was a second copy of the same bug');
ok(/rs\.value\s*=\s*current\.role/.test(openGrantSrc),
   'the pre-select still sets the dropdown to whatever role the record actually has');
ok(/_candidateCurrentRole\s*=\s*current\?\.role/.test(openGrantSrc),
   'the role BEFORE this edit is remembered for doGrant()\u2019s demotion guard');

// ═══════════════ C. doGrant() — self-edit block AND the demotion guard ════
const doGrantSrc = extractFn(src, 'doGrant') || '';
ok(doGrantSrc.length > 0, 'staff-admin.js defines doGrant()');
ok(/_candidate\.uid\s*===\s*_auth\.currentUser\?\.uid/.test(doGrantSrc),
   'doGrant() still refuses to write when the candidate IS the acting user — matches the rule\u2019s own self-edit block');
ok(/_candidateCurrentRole\s*===\s*'super_admin'\s*&&\s*role\s*!==\s*'super_admin'/.test(doGrantSrc),
   'doGrant() specifically detects a super_admin being changed AWAY from that role');
ok(/confirm\(/.test(doGrantSrc.match(/_candidateCurrentRole[\s\S]{0,400}/)?.[0] || ''),
   'the demotion case is gated behind an explicit confirm(), not a silent write');
// ⚠️ THE GUARD MUST BE ABLE TO SAY NO. A confirm() that is checked but whose
// negative branch does not stop the write is decoration, not a guard.
const demotionBlock = doGrantSrc.match(/if\s*\(\s*_candidateCurrentRole[\s\S]*?\n\s*\}/)?.[0] || '';
ok(/return\s+setStatus/.test(demotionBlock),
   'declining the confirm() actually stops the write (returns before it), not just logs a warning');

// ═══════════════ D. the guard runs AFTER the self-edit check, not instead ═
// ⚠️ ORDER MATTERS: if the demotion guard ran BEFORE the self-edit check, a
// super_admin could trip the confirm() on THEMSELVES ("demote yourself?")
// instead of getting the clearer, unconditional self-edit refusal.
const selfEditIdx = doGrantSrc.indexOf('_auth.currentUser?.uid');
const demotionIdx = doGrantSrc.indexOf('_candidateCurrentRole');
ok(selfEditIdx > -1 && demotionIdx > -1 && selfEditIdx < demotionIdx,
   'the self-edit refusal is checked BEFORE the demotion guard, not after');

// ─────────────────────────────────────────────────────────────────────────
console.log(`\n${pass} passing, ${fail} failing`);
if (failures.length) {
    console.log('\nFAILURES:');
    failures.forEach(f => console.log('  - ' + f));
    process.exit(1);
}
