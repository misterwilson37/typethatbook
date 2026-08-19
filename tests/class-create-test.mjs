// class-create-test.mjs v1.0.1 — class name matching, and the shared creation
//
// v1.0.1 — PATH ONLY, Round 17 (Linotype). This file moved from the repo root
//          into tests/, so every source it reads is now `../` rather than `./`.
//          No assertion, threshold or expectation changed.
// path the CSV importer and the class form both use.
//
// ⚠️ WHY THE NORMALISER IS THE PART WORTH TESTING. Making the CSV importer able
// to create missing classes is only safe if "missing" is accurate. Under the old
// lowercase-only lookup, a roster export writing "Period 3" against an existing
// "Period-3" was reported missing — and the new feature's answer to a missing
// class is to CREATE one. So the obvious version of this feature, built on the
// old lookup, would have quietly produced a second class with the same name and
// split the roster across both. That defect never throws and looks correct on
// the screen it is made on.
//
// BEHAVIOURAL: _classKey() and _newClassId() are extracted and run.
// STRUCTURAL:  the rest reads source text — see anon-ladder-test.mjs's header
//              for why those are graded lower.
//
// Run: node class-create-test.mjs   (or via run-all-tests.mjs)

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const src = readFileSync(new URL('../lessons-admin.js', import.meta.url), 'utf8');

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

// ── _classKey: the matcher ───────────────────────────────────────────────────
const keySrc = extractFn(src, '_classKey');
ok(!!keySrc, 'lessons-admin.js defines _classKey()');
const _classKey = keySrc
    ? new Function(`${keySrc}; return _classKey;`)()
    : () => '\u0000NO-SUCH-FUNCTION';

// The four spellings a roster export actually produces for one class.
const variants = ['Period 3', 'period-3', 'Period  3', 'PERIOD3'];
const keys = variants.map(_classKey);
ok(new Set(keys).size === 1,
   `all spellings of one class collapse to one key (got ${JSON.stringify(keys)})`);

// ⚠️ And it must NOT over-collapse. Two genuinely different classes that differ
// only in a digit have to stay different, or the importer would file a whole
// class into the wrong one — a worse outcome than the bug being fixed.
ok(_classKey('Period 3') !== _classKey('Period 4'), 'Period 3 and Period 4 stay distinct');
ok(_classKey('7th CS') !== _classKey('8th CS'), 'grade-level prefixes stay distinct');
ok(_classKey('Mrs Smith AM') !== _classKey('Mrs Smith PM'), 'AM and PM sections stay distinct');

// Degenerate input must not become a wildcard that matches every class.
ok(_classKey('') === '', 'an empty name yields an empty key');
ok(_classKey('---') === '', 'punctuation-only yields an empty key, not a match-all');
ok(_classKey(null) === '' && _classKey(undefined) === '', 'null and undefined are handled');

// ── _newClassId: uniqueness and shape ────────────────────────────────────────
const idSrc = extractFn(src, '_newClassId');
ok(!!idSrc, 'lessons-admin.js defines _newClassId()');
const _newClassId = idSrc
    ? new Function(`${idSrc}; return _newClassId;`)()
    : () => '';

const id = _newClassId('Period 3');
ok(/^period_3_[a-z0-9]+$/.test(id), `id is a slug plus a suffix (got "${id}")`);
ok(!_newClassId('!!!').startsWith('_'), 'a name with no slug still yields a usable id');
ok(_newClassId('!!!').startsWith('class_'), 'a nameless slug falls back to "class"');

// ⚠️ The sharp edge on the normaliser: an empty key would match any other class
// that also normalises to empty, assigning students to a class nobody named.
const usableSrc = extractFn(src, '_isUsableClassName');
ok(!!usableSrc, 'lessons-admin.js defines _isUsableClassName()');
const _isUsableClassName = usableSrc
    ? new Function(`${keySrc}; ${usableSrc}; return _isUsableClassName;`)()
    : () => true;
ok(_isUsableClassName('Period 3'), 'a real name is usable');
ok(!_isUsableClassName('---'), 'punctuation-only is rejected, not looked up');
ok(!_isUsableClassName(''), 'empty is rejected');
ok(/_isUsableClassName\(clsRaw\)/.test(src), 'the preview rejects unusable names before creating');
ok(!/^_|_$/.test(_newClassId('  Period 3  ').replace(/_[a-z0-9]+$/, '')),
   'no leading or trailing underscore on the slug');

// ── STRUCTURAL: one creation path, not two ───────────────────────────────────
ok(/_newClassRecord\(nameVal, schoolId/.test(src),
   'saveClass() builds its create record via the shared helper');
ok(/_newClassRecord\(m\.name, schoolId/.test(src),
   'the CSV importer builds its record via the same helper');
const idSchemeCopies = (src.match(/replace\(\/\[\^a-z0-9\]\+\/g, '_'\)/g) || []).length;
ok(idSchemeCopies === 1,
   `the id scheme is written once (found ${idSchemeCopies} copies) — two would drift`);

// ── STRUCTURAL: creation is offered, never automatic ─────────────────────────
ok(/csv-create-classes-btn/.test(src), 'a create button is rendered');
ok(/addEventListener\('click', _createMissingClasses\)/.test(src),
   'creation runs from a click, not from the preview');
ok(!/await _createMissingClasses\(\);\s*$/m.test(src.replace(/\n\s*}/g, '')),
   'nothing calls _createMissingClasses() unprompted');

// ⚠️ schoolId is required by firestore.rules. Creating without one is rejected,
// and a UI that lets you try is a UI that reports a rules error as a bug.
ok(/if \(!schoolId\)/.test(src), 'the create path refuses without a building');

// ── STRUCTURAL: the preview is re-derived, not patched ───────────────────────
// _csvParsed is built against _classCache. Patching rows green after creating
// classes would leave the commit writing the pre-creation values.
ok(/await _previewCSV\(\);/.test(src),
   're-runs the preview after creating, rather than editing the table in place');

if (fail) {
    console.log(`\nclass-create-test: ${pass} passed, ${fail} FAILED`);
    failures.forEach(f => console.log('   \u2717 ' + f));
    process.exit(1);
}
console.log(`class-create-test: all ${pass} assertions pass`);
