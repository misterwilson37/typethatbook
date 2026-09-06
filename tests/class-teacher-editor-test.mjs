// class-teacher-editor-test.mjs v1.0.0 — Round 80 (Imperial), ROADMAP 62.
//
// v1.0.0 — RULES FIRST, THIS FILE SECOND, ON PURPOSE. firestore.rules v2.11.0
//          (see firestore-rules.test.mjs's "class ownership" block) closed the
//          self-service gap; this file covers the JS half that reveals and
//          uses the editor which depends on that rule already being correct.
//          If this file's assertions ever passed while the rules ones failed,
//          the UI would offer a control that only throws when pressed.
//
// BEHAVIOURAL: _canReassignTeachers() is extracted and run against four roles.
//              It has no DOM and no Firestore dependency, so it is the one
//              piece of this feature that can be driven for real rather than
//              read as text — see anon-ladder-test.mjs's header for why the
//              rest of this file is graded lower.
// STRUCTURAL:  everything else here touches document.getElementById() or
//              Firestore and is asserted from source text.
//
// Run: node tests/class-teacher-editor-test.mjs   (or via run-all-tests.mjs)

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const src  = readFileSync(new URL('../lessons-admin.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../admin.html', import.meta.url), 'utf8');

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

// ═══════════════════ A. _canReassignTeachers() — RUN, NOT READ ═════════════
// ⚠️ MIRRORS firestore.rules v2.11.0. If this function's answer for any of the
// four roles below ever disagreed with what the rule actually allows, the
// button would either vanish for someone it should serve, or dare someone
// into a write the emulator has already proven the server refuses.
const isSuperLine    = src.match(/const _isSuper = \(\) => [^\n]+;/);
const canReassignSrc = extractFn(src, '_canReassignTeachers');
ok(!!isSuperLine,    'lessons-admin.js defines _isSuper()');
ok(!!canReassignSrc, 'lessons-admin.js defines _canReassignTeachers()');

function canReassignAs(role) {
    if (!isSuperLine || !canReassignSrc) return false;
    const factory = new Function(`
        let _scope = { role: ${JSON.stringify(role)} };
        ${isSuperLine[0]}
        ${canReassignSrc}
        return _canReassignTeachers;
    `);
    return factory()();
}

ok(canReassignAs('super_admin') === true,     'super_admin CAN reassign teachers');
ok(canReassignAs('building_admin') === true,  'building_admin CAN reassign teachers');
ok(canReassignAs('teacher') === false,        'a plain teacher CANNOT reassign teachers');
ok(canReassignAs('') === false,               'no role at all CANNOT reassign teachers');
ok(canReassignAs(undefined) === false,        'an undefined role CANNOT reassign teachers — no throw, no accidental yes');

// ═══════════════════ B. saveClass() sends the field ONLY when it may ═══════
// ⚠️ THREE CONDITIONS, ALL THREE OR NONE: editing (not creating — a fresh
// class still auto-assigns its creator via _newClassRecord(), unchanged by
// this round), admin (matching the rule), and the field only added to the
// OUTGOING record, never forced onto a teacher's write.
const saveClassSrc = extractFn(src, 'saveClass') || '';
ok(/if\s*\(\s*editId\s*&&\s*_canReassignTeachers\(\)\s*\)/.test(saveClassSrc),
   'saveClass() gates the teacherUids write on editId AND _canReassignTeachers()');
ok(/record\.teacherUids\s*=\s*Array\.from\(\s*teacherSel\.selectedOptions\s*\)/.test(saveClassSrc),
   'the value sent is read from the multi-select\u2019s actual selection, not reconstructed');
// ⚠️ THE CREATE SHAPE IS UNCHANGED. _newClassRecord() still sets teacherUids
// to the creator alone — this file does not test that path, only that
// saveClass()'s edit branch no longer forbids teacherUids outright the way
// the old comment ("An EDIT must not carry ... teacherUids") once did.
ok(!/An EDIT must not carry createdAt or teacherUids/.test(src),
   'the stale comment forbidding teacherUids on edit is gone, not just ignored');

// ═══════════════════ C. populateClassTeachers() — the reveal gate ═════════
const populateSrc = extractFn(src, 'populateClassTeachers') || '';
ok(populateSrc.length > 0, 'lessons-admin.js defines populateClassTeachers()');
ok(/if\s*\(\s*!_canReassignTeachers\(\)\s*\)\s*\{\s*wrap\.classList\.add\(\s*['"]u-display-none['"]\s*\)/.test(populateSrc),
   'populateClassTeachers() HIDES the wrap for anyone _canReassignTeachers() refuses');
ok(/s\.schoolIds\.includes\(\s*schoolId\s*\)/.test(populateSrc),
   'the staff list is filtered to the CLASS\u2019S OWN building, not the viewer\u2019s');
ok(/s\.active/.test(populateSrc), 'an inactive staff member is not offered as a teacher');

// ═══════════════════ D. startClassEdit() / cancelClassEdit() wiring ═══════
const startEditSrc  = extractFn(src, 'startClassEdit')  || '';
const cancelEditSrc = extractFn(src, 'cancelClassEdit') || '';
ok(/populateClassTeachers\(\s*cls\.schoolId\s*,\s*cls\.teacherUids\s*\)/.test(startEditSrc),
   'startClassEdit() populates the picker from the CLASS being edited, pre-selecting its current teachers');
ok(/class-teachers-wrap['"]\)\.classList\.add\(\s*['"]u-display-none['"]\s*\)/.test(cancelEditSrc),
   'cancelClassEdit() re-hides the Teachers field');
ok(/class-teachers-select['"]\)\.innerHTML\s*=\s*['"]{2}/.test(cancelEditSrc),
   'cancelClassEdit() clears the picker — a leftover selection must not survive into the next class this form touches');

// ⚠️ setting .value programmatically does NOT fire change — so startClassEdit()
// populating the picker directly (not by relying on an onchange handler) is
// the only way the picker is ever right on the FIRST paint of an edit.
ok(!/sel\.value = cls\.schoolId[\s\S]{0,80}\.onchange\(\)/.test(startEditSrc),
   'startClassEdit() does not rely on onchange firing from a programmatic .value set (it never does)');

// ═══════════════════ E. renderClassList() — the orphan flag (§3) ══════════
const renderListSrc = extractFn(src, 'renderClassList') || '';
ok(/no teacher/.test(renderListSrc) && /#ffaa00/.test(renderListSrc),
   'a class with empty/missing teacherUids is flagged in warning colour, not left to read as a quiet blank');
ok(/!\(Array\.isArray\(cls\.teacherUids\)\s*&&\s*cls\.teacherUids\.length\)/.test(renderListSrc),
   'the orphan check is the same shape as _teacherLabel()\u2019s own — missing AND empty both count');

// ═══════════════════ F. ONE getDocs('staff'), SHARED, NOT DOUBLED (§READS) ═
const staffReads = (src.match(/getDocs\(collection\(_db,\s*['"]staff['"]\)\)/g) || []).length;
ok(staffReads === 1,
   `exactly ONE getDocs('staff') call in the whole file (found ${staffReads}) — ` +
   '_loadTeacherNames() must sit on top of _loadStaffRecords(), not read it separately');
ok(/_loadStaffRecords\(\)/.test(extractFn(src, '_loadTeacherNames') || ''),
   '_loadTeacherNames() is now DERIVED from _loadStaffRecords(), the shared cache');

// ═══════════════════ G. admin.html carries the markup, hidden by default ══
ok(/id="class-teachers-wrap"\s+class="u-display-none/.test(html),
   'admin.html: #class-teachers-wrap exists and starts hidden — only populateClassTeachers() ever reveals it');
ok(/id="class-teachers-select"[^>]*\bmultiple\b/.test(html),
   'admin.html: #class-teachers-select is a real multi-select, not a single-choice dropdown');
// ⚠️ ROADMAP 62 said "beside School" — this checks proximity in the document,
// not identical grid placement, since a multi-line listbox sharing a
// single-line input row is exactly the height mismatch item 64 just fixed
// elsewhere on this same page.
const schoolIdx   = html.indexOf('id="class-school-select"');
const teachersIdx = html.indexOf('id="class-teachers-wrap"');
ok(schoolIdx > -1 && teachersIdx > schoolIdx && teachersIdx - schoolIdx < 2000,
   'the Teachers field sits close after School in the document, not buried elsewhere in the panel');

// ═══════════════════ H. the multi-select is NOT caught by the chevron rule ═
// ⚠️ v1.20.0's select-height fix was scoped to :not([multiple]) specifically
// because of this control. If that scoping regressed, this control would get
// an arrow that opens nothing and 30px eaten off its right edge for it.
ok(/select:not\(\[multiple\]\)\s*\{/.test(html),
   'admin.html: the appearance/arrow fix is scoped to :not([multiple]), so it never touches this listbox');

// ─────────────────────────────────────────────────────────────────────────
console.log(`\n${pass} passing, ${fail} failing`);
if (failures.length) {
    console.log('\nFAILURES:');
    failures.forEach(f => console.log('  - ' + f));
    process.exit(1);
}
