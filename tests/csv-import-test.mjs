// csv-import-test.mjs v1.0.0 — Round 151 (Olympia). THE IMPORT THAT WORKED IN SILENCE.
//
// Jake, 2026-10-11, screenshot of eleven "empty row" lines and nothing else:
// *"Why can't I import students into my class?"* Then, after committing anyway:
// *"I followed the rules and clicked commit, but I don't know if they got
// committed. Or what happened to the students who were already in it."*
//
// Every real row had been accepted. The screen hid it three ways (see
// lessons-admin.js v1.23.0). This harness LIFTS the real functions out of
// lessons-admin.js, runs them in jsdom against stubbed Firestore, and reads what
// a teacher would see — so "the summary is on top" is a DOM fact, not a grep.
//
// ⚠️ THE FIXTURE IS SHAPED LIKE JAKE'S FILE, NOT COPIED FROM IT. His file holds
// student IDs (Rule 4: never retained), so the emails here are invented. Shape
// kept: header row, CRLF line endings, ~130 students, one class name containing
// "&" and parentheses, and hundreds of comma-only padding lines from a
// spreadsheet export, including some interleaved between real rows.
//
// ⚠️ MUTATION-VERIFIED: against lessons-admin.js v1.22.0 + admin.html v1.23.0,
// 33 of 47 assertions fail, across every Part. C1 is the screenshot itself:
// v1.22.0 draws 306 table rows for this file and 0 of them are students.

import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL  ' + m); } };
const read = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

const SRC  = read('lessons-admin.js');
const HTML = read('admin.html');

// Brace-match a top-level `function NAME(` or `async function NAME(` out of the file.
function lift(name) {
    const m = new RegExp('(?:^|\\n)((?:async )?function ' + name + '\\s*\\()').exec(SRC);
    if (!m) return null;
    const start = m.index + (SRC[m.index] === '\n' ? 1 : 0);
    let i = SRC.indexOf('{', start), depth = 0, inStr = null, esc = false;
    for (; i < SRC.length; i++) {
        const ch = SRC[i];
        if (inStr) {
            if (esc) { esc = false; continue; }
            if (ch === '\\') { esc = true; continue; }
            if (ch === inStr) inStr = null;
            continue;
        }
        if (ch === '/' && SRC[i + 1] === '/') { i = SRC.indexOf('\n', i); continue; }
        if (ch === '/' && SRC[i + 1] === '*') { i = SRC.indexOf('*/', i) + 1; continue; }
        if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
        // Regex literal: a `/` where an operand is expected. Skip to its closing
        // `/`, honouring escapes and [classes] — `/[\s,;"']/` must not open a string.
        if (ch === '/') {
            let k = i - 1; while (k >= 0 && /\s/.test(SRC[k])) k--;
            if (k < 0 || /[(,=:[!&|?{};]/.test(SRC[k]) || /\breturn$/.test(SRC.slice(Math.max(0, k - 5), k + 1))) {
                let inClass = false;
                for (i++; i < SRC.length; i++) {
                    const c = SRC[i];
                    if (c === '\\') { i++; continue; }
                    if (c === '[') inClass = true;
                    else if (c === ']') inClass = false;
                    else if (c === '/' && !inClass) break;
                }
                continue;
            }
        }
        if (ch === '{') depth++;
        else if (ch === '}' && --depth === 0) return SRC.slice(start, i + 1);
    }
    return null;
}
function liftConst(name) {
    const m = new RegExp('\\nconst ' + name + '\\s*=\\s*\\{[\\s\\S]*?\\n\\};').exec(SRC);
    return m ? m[0] : null;
}

// ── The fixture ──────────────────────────────────────────────────────────────
const CLASS = '7th & 8th Grade (Standard)';
const N_STUDENTS = 131;
const fakeEmail = (k) => 'student' + String(k).padStart(3, '0') + '@example.test';
function jakeShapedFile() {
    const L = ['email,class_name,,'];
    let blanks = 0;
    for (let k = 1; k <= N_STUDENTS; k++) {
        L.push(fakeEmail(k) + ',' + CLASS + (k % 3 === 0 ? ',,' : ''));   // some rows carry padding columns
        if (k % 20 === 0) { L.push(',,'); blanks++; }                   // interleaved padding
    }
    for (let k = 0; k < 300; k++) { L.push(k % 2 ? ',' : ',,'); blanks++; }
    return { text: '\uFEFF' + L.join('\r\n') + '\r\n', blanks };
}
const FIX = jakeShapedFile();

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─── A. THE PARSER READS A SPREADSHEET EXPORT THE WAY A HUMAN WOULD ───');
const parseSrc = lift('_parseRosterCSV');
const stripSrc = lift('_stripBlankRosterLines');
ok(parseSrc, 'A0 _parseRosterCSV exists in lessons-admin.js');
ok(stripSrc, 'A0 _stripBlankRosterLines exists in lessons-admin.js');
let parse = () => ({ rows: [], blank: 0 }), strip = (s) => s;
try { parse = new Function(parseSrc + '; return _parseRosterCSV;')(); } catch (e) { ok(false, 'A0 parser is self-contained: ' + e.message); }
try { strip = new Function(stripSrc + '; return _stripBlankRosterLines;')(); } catch (e) { ok(false, 'A0 strip is self-contained: ' + e.message); }
{
    const p = parse(FIX.text);
    ok(p.header === true, 'A1 BOM-prefixed "email,class_name,," is recognised as a header');
    ok(p.rows.length === N_STUDENTS, `A2 every student line is a row — got ${p.rows.length}, want ${N_STUDENTS}`);
    ok(p.blank === FIX.blanks, `A3 comma-only lines are counted as blank — got ${p.blank}, want ${FIX.blanks}`);
    ok(p.rows.every(r => r.cls === CLASS),
       'A4 trailing padding columns are stripped: "' + CLASS + ',," must read as the class, not a new one');
    ok(p.rows.every(r => r.email.includes('@')), 'A5 no blank line leaked into rows');
    ok(p.rows[0]?.line === 2, 'A6 line numbers match the file as opened in an editor (first student is line 2)');
    const q = parse('a@x.test,"7th, 8th Grade"\nb@x.test,"Say ""Hi"""');
    ok(q.rows[0]?.cls === '7th, 8th Grade', 'A7 a quoted class name may contain a comma');
    ok(q.rows[1]?.cls === 'Say "Hi"', 'A8 doubled quotes inside a quoted name unescape');
    ok(parse('a@x.test,Period 3').header === false, 'A9 a file with no header loses no student');
}

console.log('\n─── B. "REMOVE BLANK ROWS" REMOVES ONLY BLANK ROWS ───');
{
    const s = strip(FIX.text);
    const p = parse(s);
    ok(p.blank === 0, 'B1 nothing blank survives the strip');
    ok(p.rows.length === N_STUDENTS, 'B2 every student survives the strip');
    ok(s.includes('\r\n') && !/[^\r]\n/.test(s), 'B3 CRLF in, CRLF out');
    ok(s.startsWith('\uFEFFemail,class_name'), 'B4 the header line is kept byte-for-byte');
}

// ── Sandbox: the real preview/commit functions, stubbed Firestore, jsdom ─────
function sandbox({ roster = [], classes = { c78: { name: CLASS } }, pendingOnServer = null } = {}) {
    const dom = new JSDOM(`<!doctype html><body>
        <input type="file" id="student-csv-file">
        <textarea id="student-csv-paste"></textarea>
        <button id="student-csv-preview-btn"></button>
        <button id="student-csv-commit-btn" disabled></button>
        <span id="student-csv-loading"></span>
        <div id="student-csv-preview-area"></div></body>`);
    const writes = [];
    const pending = new Map();   // the fake pendingClassAssignments collection
    const names = ['_parseRosterCSV', '_stripBlankRosterLines', '_removeBlankRowsFromCSV',
                   '_previewCSV', '_commitCSV', '_showQueuedAssignments',
                   '_classKey', '_isUsableClassName', 'escHtml'];
    // Only these MUST exist; the rest are stubbed when absent so an older file's
    // preview is still DRIVEN and its failures counted (mutation check), not skipped.
    const required = ['_previewCSV', '_commitCSV', '_classKey', '_isUsableClassName', 'escHtml'];
    if (required.some(n => !lift(n))) return null;
    const bodies = names.map(n => lift(n) || ('function ' + n + '() {}'));
    const status = liftConst('_CSV_STATUS') || '';
    const factory = new Function('document', 'stubs', `
        let _csvParsed = [], _csvOverwriteMode = null, _csvMissingClasses = [], _classCache = {};
        const _db = {}, ROSTER_DAYS = 45;
        let _rosterData = stubs.roster;
        const collection = (db, name) => ({ name });
        const doc = (db, coll, id) => ({ coll, id });
        const where = (f, op, v) => ({ f, op, v });
        const query = (c, w) => ({ name: c.name, w });
        const getDocs = stubs.getDocs, setDoc = stubs.setDoc;
        const _buildClassFilterDropdown = () => {}, _buildBulkClassDropdown = () => {};
        const _loadSchoolOptions = async () => [{ id: 's1', name: 'Test MS' }];
        const _createMissingClasses = async () => {};
        const _schoolIdForClass = async () => 's1';
        const _renderRoster = () => {};
        ${status}
        ${bodies.join('\n')}
        return { _previewCSV, _commitCSV, _showQueuedAssignments,
                 get parsed() { return _csvParsed; } };`);
    const api = factory(dom.window.document, {
        roster,
        getDocs: async (q) => {
            const out = [];
            if (q.name === 'classes') for (const [id, d] of Object.entries(classes)) out.push({ id, data: () => d });
            if (q.name === 'pendingClassAssignments') {
                const src = pendingOnServer || pending;
                for (const [id, d] of src) if (!q.w || d[q.w.f] === q.w.v) out.push({ id, data: () => d });
            }
            return { forEach: (f) => out.forEach(f), size: out.length };
        },
        setDoc: async (ref, data) => { writes.push({ ref, data }); if (ref.coll === 'pendingClassAssignments') pending.set(ref.id, data); },
    });
    return { dom, doc: dom.window.document, api, writes, pending };
}

console.log('\n─── C. ⚠️⚠️ THE PREVIEW SHOWS THE STUDENTS, AND THE QUESTION IS ON TOP ───');
let S = sandbox();
ok(S, 'C0 every function the preview needs could be lifted');
if (S) {
    S.doc.getElementById('student-csv-paste').value = FIX.text;
    await S.api._previewCSV();
    const area = S.doc.getElementById('student-csv-preview-area');
    const txt = area.textContent;
    const dataRows = [...area.querySelectorAll('table tr')].slice(1);
    const studentRows = dataRows.filter(tr => /@example\.test/.test(tr.textContent));
    ok(studentRows.length === N_STUDENTS && dataRows.length === N_STUDENTS,
       `C1 ⚠️ the table is the students and only the students — ${studentRows.length} student rows of ` +
       `${dataRows.length} drawn, want ${N_STUDENTS} of ${N_STUDENTS}. (v1.22.0 on this file: 0 of 306 — ` +
       `Jake's screenshot exactly: every queued student returned before rendering, every blank drawn.)`);
    ok(!/empty row/.test(txt), 'C2 no "empty row" lines — blank padding is counted, not drawn');
    ok(new RegExp(N_STUDENTS + ' student lines').test(txt), 'C3 the summary states how many students the file holds');
    ok(new RegExp(FIX.blanks + ' blank rows').test(txt), 'C4 the summary states how many blank rows were ignored');
    ok(S.doc.getElementById('csv-strip-blank-btn'), 'C5 a button to remove the blank rows is offered');

    const html = area.innerHTML;
    const iQ = html.indexOf('name="csv-overwrite"'), iT = html.indexOf('<table');
    ok(iQ > -1, 'C6 queued students trigger the "already in a class?" question');
    ok(iQ > -1 && iT > -1 && iQ < iT, 'C7 ⚠️ the question comes BEFORE the table, not under it');
    ok(html.indexOf('student lines') < iT, 'C8 the summary comes BEFORE the table');
    const tableBox = area.querySelector('table')?.parentElement;
    ok(tableBox && tableBox !== area && /overflow-y:\s*auto/.test(tableBox.getAttribute('style') || ''),
       'C9 the table scrolls inside its OWN box; the panel itself does not');

    const commit = S.doc.getElementById('student-csv-commit-btn');
    ok(commit.disabled, 'C10 Commit is locked until the question is answered');
    const radio = S.doc.querySelector('input[name="csv-overwrite"][value="move"]');
    if (radio) { radio.checked = true; radio.dispatchEvent(new S.dom.window.Event('change')); }
    ok(!commit.disabled, 'C11 answering the question unlocks Commit (the listener survived — one write, no +=)');
    ok(S.api.parsed.length === N_STUDENTS, `C12 all ${N_STUDENTS} are ready to commit`);

    // The blank-row button really strips the text and re-checks.
    S.doc.getElementById('csv-strip-blank-btn')?.click();
    await new Promise(r => setTimeout(r, 0));
    ok(parse(S.doc.getElementById('student-csv-paste').value).blank === 0, 'C13 the button removes blank rows from the text box');
    ok(!S.doc.getElementById('csv-strip-blank-btn'), 'C14 …and the re-check no longer offers it');
}

console.log('\n─── D. ⚠️⚠️ COMMIT ENDS IN A RECEIPT, AND THE RECEIPT READS FIRESTORE BACK ───');
S = sandbox({ roster: [
    { uid: 'u1', email: fakeEmail(1), classId: 'old' },   // visible, in another class → move
    { uid: 'u2', email: fakeEmail(2), classId: '' },      // visible, no class → placed
] });
if (S) {
    S.doc.getElementById('student-csv-paste').value = FIX.text;
    await S.api._previewCSV();
    const radio = S.doc.querySelector('input[name="csv-overwrite"][value="move"]');
    if (radio) { radio.checked = true; radio.dispatchEvent(new S.dom.window.Event('change')); }
    await S.api._commitCSV();
    const area = S.doc.getElementById('student-csv-preview-area');
    const first = area.firstElementChild || area;
    ok(/Import saved/.test(first.textContent), 'D1 ⚠️ the FIRST thing in the panel after Commit is the receipt');
    ok(/2<\/b> placed now/.test(first.innerHTML), 'D2 the receipt counts students placed now');
    ok(new RegExp((N_STUDENTS - 2) + '</b> queued').test(first.innerHTML), 'D3 the receipt counts students queued');
    ok(/Read back from Firestore: all \d+ queued/.test(first.textContent), 'D4 the receipt says it READ THE QUEUE BACK and found them all');
    ok(/Nobody outside this file was changed/.test(first.textContent), 'D5 the receipt answers "what happened to everyone else?"');
    ok(/moved from old/.test(area.textContent), 'D6 a moved student is reported as moved, by origin');
    ok(S.writes.filter(w => w.ref.coll === 'pendingClassAssignments').every(w => w.data.overwrite === true),
       'D7 "move" rides to every queued record');
}
// Read-back must catch a write that "succeeded" but isn't there.
S = sandbox({ pendingOnServer: new Map() });
if (S) {
    S.doc.getElementById('student-csv-paste').value = 'email,class_name\n' + fakeEmail(1) + ',' + CLASS;
    await S.api._previewCSV();
    const radio = S.doc.querySelector('input[name="csv-overwrite"][value="move"]');
    if (radio) { radio.checked = true; radio.dispatchEvent(new S.dom.window.Event('change')); }
    await S.api._commitCSV();
    const first = S.doc.getElementById('student-csv-preview-area').firstElementChild || S.doc.body;
    ok(/finished with problems/.test(first.textContent), 'D8 ⚠️ a queued write the read-back cannot find is a PROBLEM, not a ✓');
}

console.log('\n─── E. A NEW STUDENT IN A NOT-YET-CREATED CLASS IS OFFERED THE CREATE BUTTON ───');
S = sandbox({ classes: {} });
if (S) {
    S.doc.getElementById('student-csv-paste').value = 'email,class_name\n' + fakeEmail(1) + ',Brand New Class';
    await S.api._previewCSV();
    ok(S.doc.getElementById('csv-create-classes-btn'),
       'E1 v1.22.0 said "class unknown — skipped" for a student with no logs and never offered Create');
}

console.log('\n─── F. THE MARKUP ───');
{
    const area = /<div id="student-csv-preview-area"[^>]*>/.exec(HTML);
    ok(area && !/max-height|overflow/.test(area[0]), 'F1 the preview area itself is not a capped scroll box');
    ok(/id="student-csv-queue-btn"/.test(HTML), 'F2 "Check queued students" exists');
    ok(/getElementById\('student-csv-queue-btn'\)\.addEventListener\('click', _showQueuedAssignments\)/.test(SRC),
       'F3 …and is wired');
    const ph = /id="student-csv-paste"[\s\S]*?placeholder="([^"]*)"/.exec(HTML);
    ok(ph && !/\d{6,}@/.test(ph[1]), 'F4 Rule 4: the placeholder shows no real-looking student ID');
    const prev = lift('_previewCSV') || '', com = lift('_commitCSV') || '';
    ok(!/innerHTML\s*\+=/.test(prev.replace(/\/\/[^\n]*/g, '')), 'F5 _previewCSV never appends with innerHTML +=');
    ok(!/innerHTML\s*\+=/.test(com.replace(/\/\/[^\n]*/g, '')), 'F6 _commitCSV never appends with innerHTML +=');
}

console.log(`\ncsv-import-test: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
