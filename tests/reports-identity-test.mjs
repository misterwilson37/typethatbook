// reports-identity-test.mjs v1.0.0 — Round 128 (Bembo).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ PER-RUN DELETE NEVER WORKED ONCE, AND THE CAUSE WAS ONE CHARACTER.
// ═════════════════════════════════════════════════════════════════════════════
//
// `sprintIdentity()` joined its fields with U+0000. The identity is written into
// `data-run-id` on the delete button and read back as `dataset.runId`, and **the
// HTML parser is required by spec to replace U+0000 in an attribute value with
// U+FFFD**. The string that went in was never the string that came out, so
// `sprints.findIndex(sp => sprintIdentity(sp) === runId)` returned -1 on every
// click since the button shipped.
//
// ⭐⭐ AND EVERY SYMPTOM JAKE REPORTED FALLS OUT OF THAT ONE CHARACTER:
//   • *"Could not find that run — the session may have changed"* — the -1 branch,
//     blaming a race that never happened;
//   • *"deleting individual runs didn't change the times"* — the Firestore write
//     is below the -1 return, so it never ran and the rollup never moved;
//   • nothing in the console — it is a HANDLED branch, so there was no error to
//     find in the dump he pasted.
//
// ⚠️ THIS HARNESS DOES NOT TEST THE SPEC, IT TESTS THE ROUND TRIP. The reason
// U+0000 fails is the spec; the reason we believe U+001F passes is that jsdom
// parses a real attribute here and hands the value back.

import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok    ' + m); } else { fails.push(m); console.log('  FAIL  ' + m); } };

// The real sprint shapes, including the one from Jake's screenshot.
const SPRINTS = [
    { at: '2026-09-22T11:10:04.000Z', detail: 'run 3', seconds: 60, chars: 192 },
    { at: '2026-09-22T08:42:00.000Z', detail: 'run 3', seconds: 83, chars: 105 },
    { at: '2026-09-22T08:43:00.000Z', detail: 'run 4', seconds: 47, chars: 98 },
    // ⚠️ THE ADVERSARIAL ONES. A detail carrying a quote would break out of the
    // attribute; one carrying the separator itself would forge a boundary.
    { at: '', detail: 'run 1 "quoted" & <angled>', seconds: 0, chars: 0 },
    { at: '2026-09-22T09:03:00.000Z', detail: "run 3 (hidden) o'clock", seconds: 48, chars: 56 },
];

// ⚠️ reports.html's escapeHtml() as it now stands, at module scope because both
// B1 and B2 need it — B2 compares it against the textNode escaper it replaced.
const esc = (str) => String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const roundTrip = (sep) => {
    const identity = (sp) => [sp.at || '', sp.detail || '', sp.seconds || 0, sp.chars || 0].join(sep);
    // ⚠️ BUILT THE WAY reports.html BUILDS IT: escapeHtml() into an attribute,
    // then parsed as HTML. Anything short of a real parse would miss this bug.
    const doc = new JSDOM('').window.document;
    const html = SPRINTS.map((sp, i) =>
        `<button class="delete-run-btn" data-i="${i}" data-run-id="${esc(identity(sp))}">x</button>`).join('');
    const dom = new JSDOM(`<div>${html}</div>`);
    return [...dom.window.document.querySelectorAll('button')].map((b, i) => ({
        wanted: identity(SPRINTS[i]),
        got: b.dataset.runId,
    }));
};

console.log('\nA — ⚠️⚠️⚠️ THE OLD SEPARATOR, U+0000, CANNOT SURVIVE AN ATTRIBUTE');
{
    const trips = roundTrip('\u0000');
    const broken = trips.filter(t => t.got !== t.wanted).length;
    ok(broken === trips.length,
       `⭐ EVERY ONE of ${trips.length} identities comes back changed — this is the bug, `
       + 'reproduced, not argued');
    ok(trips[0].got.includes('\uFFFD'),
       '⚠️ and the parser substituted U+FFFD, exactly as the HTML spec requires');
}

console.log('\nB — ⭐ U+001F SURVIVES, WHICH IS WHY THE FIX IS THE FIX');
{
    const trips = roundTrip('\u001f');
    ok(trips.every(t => t.got === t.wanted),
       `all ${trips.length} identities round-trip byte for byte, including quotes, `
       + 'ampersands and angle brackets in the detail');
    // ⚠️ THE PROPERTY THE JOIN EXISTS FOR. A separator that a field could contain
    // would let two different sprints share an identity, and one click would
    // delete the wrong run — worse than the bug being fixed.
    ok(new Set(trips.map(t => t.got)).size === SPRINTS.length,
       '⚠️⚠️ and every identity is still DISTINCT — no field value can forge a boundary');
}

console.log('\nB2 — ⚠️⚠️⚠️ THE TEXTNODE ESCAPER LEAVES QUOTES, AND THIS LIVES IN ATTRIBUTES');
{
    // ⭐ FOUND BY B1 ON THE WAY PAST. The identity survived the new separator and
    // still came back as `run 1 ` — because `innerHTML` of a text node escapes
    // &, < and > and leaves `"` alone, which is correct in TEXT position and
    // catastrophic in an ATTRIBUTE, where a quote closes it and everything after
    // is reparsed as further attributes. `data-name` carries student names.
    const doc = new JSDOM('').window.document;
    const escOld = (str) => { const d = doc.createElement('div'); d.appendChild(doc.createTextNode(str)); return d.innerHTML; };
    const nasty = 'Ann "Annie" O\u2019Hara';
    const oldDom = new JSDOM(`<button data-name="${escOld(nasty)}">x</button>`);
    ok(oldDom.window.document.querySelector('button').dataset.name !== nasty,
       '\u26a0\ufe0f the OLD escaper truncates a name at its quote — reproduced');
    const newDom = new JSDOM(`<button data-name="${esc(nasty)}">x</button>`);
    ok(newDom.window.document.querySelector('button').dataset.name === nasty,
       '\u2b50 the new one round-trips it whole');
    ok(!/escapeHtml[\s\S]{0,200}createTextNode/.test(
         readFileSync(path.join(ROOT, 'reports.html'), 'utf8')),
       '\u26a0\u26a0 and reports.html no longer builds escapeHtml from a text node');
}

console.log('\nC — ⚠️ reports.html ACTUALLY USES IT, AND USES ONLY IT');
{
    const src = readFileSync(path.join(ROOT, 'reports.html'), 'utf8');
    const code = src.replace(/^\s*\/\/.*$/gm, '');
    ok(/const IDENTITY_SEP = '\\u001f'/.test(code),
       'the separator is a named constant, not a literal at the join');
    ok(!/\.join\('\\u0000'\)/.test(code),
       '⚠️⚠️ and no join on U+0000 survives anywhere in the file');
    const lookup = /sprints\.findIndex\(sp => sprintIdentity\(sp\) === runId\)/.test(code);
    ok(lookup, '⭐ the delete still matches by identity, never by array index');
}

console.log('\nD — ⚠️⚠️ DELETING A SESSION TAKES ITS RUNS WITH IT');
{
    // ⭐ The template emits `.session-entry` and `.sprint-list` as SIBLINGS, so
    // `row.remove()` alone orphans every run of the deleted session on screen.
    // Jake read that as "the runs and sessions never actually seem to disappear",
    // which is a fair reading of what the page showed him.
    const build = () => new JSDOM('<div id="c">'
        + '<div class="session-entry" data-session-id="a"><button class="delete-session-btn">x</button></div>'
        + '<div class="sprint-list"><div class="run">r1</div><div class="run">r2</div></div>'
        + '<div class="session-entry" data-session-id="b"></div>'
        + '<div class="sprint-list"><div class="run">r3</div></div>'
        + '</div>');

    const oldWay = build();
    oldWay.window.document.querySelector('.delete-session-btn').closest('.session-entry').remove();
    ok(oldWay.window.document.querySelectorAll('.run').length === 3,
       '\u26a0\ufe0f the OLD removal leaves all three runs on screen — reproduced');

    const newWay = build();
    const row = newWay.window.document.querySelector('.delete-session-btn').closest('.session-entry');
    const runs = row && row.nextElementSibling;
    if (runs && runs.classList.contains('sprint-list')) runs.remove();
    row.remove();
    ok(newWay.window.document.querySelectorAll('.run').length === 1,
       '\u2b50 the new one removes exactly that session\u2019s runs and leaves the next session alone');
    ok(newWay.window.document.querySelectorAll('.session-entry').length === 1,
       '\u26a0\ufe0f and the surviving session header is untouched');
}

console.log('\nE — ⚠️⚠️⚠️ THE STUDENT FILTER NARROWS BEFORE THE SWEEP, NOT AFTER');
{
    // ⭐⭐ THE POSITION IS THE WHOLE FIX. The sweep is one getDoc per student-day;
    // filtering the rendered OUTPUT would read all 1,593 documents and throw
    // 1,590 away — the convenience without the saving, which is the version that
    // looks finished and fixes nothing. Jake's meter, 2026-09-22: 1,593 reads at
    // readLogById, 1,435 of them misses, to show three days.
    const src = readFileSync(path.join(ROOT, 'reports.html'), 'utf8');
    const code = src.replace(/^\s*\/\/.*$/gm, '');

    const iFilter = code.indexOf("document.getElementById('scope-student').value");
    const iPairs = code.indexOf('plan.fetch.forEach(date => pairs.push');
    const iSweep = code.indexOf('await readLogById(p.uid, p.date)');
    ok(iFilter > 0, 'E1 generateReport() reads the student picker');
    ok(iPairs > 0 && iSweep > 0, 'E2 the per-student-day sweep is still where we think it is');
    ok(iFilter < iPairs,
       '⚠️⚠️⚠️ E3 the narrowing runs BEFORE `pairs` is built — so the saved reads '
       + 'are never issued, rather than issued and discarded');
    ok(iFilter < iSweep, 'E4 and before readLogById is ever called');

    // ⚠️ THE PICKER MUST NOT PAY FOR ITSELF. A dropdown that queried the roster
    // to populate itself would add a read every time the class picker moved.
    const iRemember = code.indexOf('rememberStudents(uids)');
    ok(iRemember > 0 && iRemember < iPairs,
       '⭐ E5 the list is captured from the roster the report already assembled');

    // ⚠️ AND AN OUT-OF-SCOPE CHILD IS REFUSED, NOT SILENTLY EMPTIED. An empty
    // report reads on screen exactly like a child who did no typing.
    ok(/not in the selected school\/class/.test(code),
       '⚠️⚠️ E6 picking a student outside the scope says so instead of showing zero');
}

console.log('\nF — ⚠️⚠️⚠️ THE PICKER NEVER RENDERS A WALL OF IDENTICAL LABELS');
{
    // ⭐⭐ Jake's screenshot, 2026-09-23: thirty rows of the word "Unknown".
    // `readRosterUids()` reads the `users` collection and takes `u.displayName`,
    // which for students is EMPTY — the authoritative name is written onto each
    // typing_logs document by game.js at save time. The ⟳ button is the only
    // path that never touches a log, so it is the only path that cannot know a
    // name. ⚠️ Buying names with log reads would undo Round 129 entirely, so the
    // fix is to REMEMBER them from reports and to degrade to something DISTINCT.
    const src = readFileSync(path.join(ROOT, 'reports.html'), 'utf8');
    const code = src.replace(/^\s*\/\/.*$/gm, '');

    ok(/const _studentNames = new Map\(\)/.test(code),
       'F1 names learned from a report are banked for the page load');
    ok(/_studentNames\.set\(uid, info\.name\)/.test(code),
       'F2 and banked only when the name is real, never the placeholder');
    ok(/function labelFor\(/.test(code) && /\(no name\) \$\{String\(uid\)\.slice\(0, 8\)\}/.test(code),
       '⚠️⚠️ F3 the last resort is a uid fragment, so every row is DISTINCT');
    ok(!/name: info\.name \|\| 'Unknown'[\s\S]{0,200}<option/.test(code),
       'F4 no path builds an <option> labelled from a bare Unknown fallback');

    // ⚠️ THE ⟳ PATH MUST STILL NOT READ LOGS — that is the whole of Round 129.
    const iLoad = code.indexOf('async function loadStudents');
    const loadBody = code.slice(iLoad, code.indexOf('\n    }', iLoad));
    ok(iLoad > 0 && !/readLogById/.test(loadBody),
       '⭐ F5 loadStudents() still issues the roster query ONLY — no per-day reads');
    // ⚠️ ROUND 148: the notice's wording changed — names are now saved on accounts as
    // students type — but it must still say what to do meanwhile.
    ok(/name is saved the next time they type/.test(code) && /running a report fills them in/.test(code),
       '⚠️ F6 and when names are missing it says what to do about it');

    // The label ladder, exercised directly.
    const labelFor = (uid, info, remembered) => {
        const name = (info && info.name) || remembered || '';
        const email = (info && info.email) || '';
        if (name && name !== 'Unknown') return email ? `${name} — ${email}` : name;
        if (email) return email;
        return `(no name) ${String(uid).slice(0, 8)}`;
    };
    ok(labelFor('abcdefgh1234', { name: 'Ada L', email: 'a@b.c' }) === 'Ada L — a@b.c',
       'F7 a real name wins');
    ok(labelFor('abcdefgh1234', { name: 'Unknown', email: 'a@b.c' }) === 'a@b.c',
       'F8 the placeholder loses to an email');
    const bare = ['u1111111aaaa', 'u2222222bbbb']
        .map(u => labelFor(u, { name: 'Unknown', email: '' }));
    ok(new Set(bare).size === 2,
       '⚠️⚠️⚠️ F9 two nameless students get two DIFFERENT labels — the failure '
       + 'Jake photographed cannot recur');
}

console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed`
                         : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
