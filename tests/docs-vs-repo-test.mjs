// docs-vs-repo-test.mjs v1.0.0 — ⚠️⚠️ THE DOCUMENTS MUST NOT LIE ABOUT THE REPO.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS — ROADMAP 52, AND FOUR OCCURRENCES IN A SINGLE DAY
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-06: *"I have to ask for updates regularly because referring to
// something as 34 and 58 and whatever is utter nonsense to me. And the document
// is too large and unwieldy for me to even navigate."*
//
// He cannot audit these files, and neither can anyone reading them cold. The
// only reader they have is the next instance, who trusts them — and Round 81
// found FOUR separate places where that trust was misplaced, in one session:
//
//   1. ROADMAP 42's heading said admin.js carried 183 inline-style attributes.
//      `tools/audit-inline-styles.mjs` said 13. Rounds 58–59 had done the work
//      twenty rounds earlier. ⚠️ ROUND 80 READ THAT HEADING AND PASSED IT
//      FORWARD as "the next candidate" — a round that trusted it would have
//      gone hunting 170 attributes that do not exist.
//   2. ROADMAP 58 said a ruling was needed from Jake. He had given it two days
//      before, and his answer was recorded IN THE SAME ITEM, directly below the
//      heading that said it was missing. Three places said he had not answered.
//   3. ROADMAP 30 said Adventure gives no colour feedback on a wrong key. It
//      does. Jake's screenshot closed half the item in one message.
//   4. ROADMAP 9's first bullet described a rollover defect as open. Both halves
//      shipped in Round 57.
//
// ⚠️⚠️ EVERY ONE OF THOSE COST A ROUND OR NEARLY DID, AND NONE OF THEM COULD
// TURN A HARNESS RED, because no harness read the documents.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ WHAT THIS CAN AND CANNOT DO — READ BEFORE TRUSTING A GREEN RUN
// ═══════════════════════════════════════════════════════════════════════════
//
// It checks the MECHANICAL half only: claims that are a file path, a version
// stamp, or a count, where the repo can be asked directly. It cannot check
// whether an item's DESCRIPTION of a defect is still true — #1 and #3 above
// were prose, and prose needs a person. ⭐ But #2 and #4 are exactly the shape
// this catches, and #1 becomes catchable the moment a number is written as a
// stamp rather than as English.
//
// ⚠️ THE FAILURE MODE THIS FILE MUST AVOID IS CRYING WOLF. A checker that
// flags prose it merely failed to parse teaches the next round to skip it, and
// then it is worse than nothing. So: anything ambiguous is a NOTE, not a
// failure, and only claims written in an unambiguous, machine-readable form are
// allowed to go red.

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');

let pass = 0, fail = 0;
const notes = [];
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const handoff = read('HANDOFF.md');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n--- A. ⚠️⚠️ EVERY DOCUMENT IN THE REPO IS IN §9\'s DOCUMENT MAP ---');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ THIS IS THE CHECK THAT WOULD HAVE CAUGHT ROUND 81's OWN FINDING.
// `docs/TEACHER-GUIDE.md` and `docs/archive/HANDOFF-ARCHIVE.md` were both in the
// repo and in neither index. ⭐ The archive one was the dangerous one: §9's own
// "GONE, AND GONE MEANS GONE" paragraph reads as if every split-out handoff file
// was deleted, so two indexes agreed BY OMISSION about a 2,177-line file that is
// sitting right there. Round 80 fixed this exact shape one directory up — three
// stale root-level docs missing from the same map — and this survived it.

function walkMd(dir, acc = []) {
    for (const e of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
        const rel = dir === '.' ? e.name : `${dir}/${e.name}`;
        if (e.isDirectory()) walkMd(rel, acc);
        else if (e.name.endsWith('.md')) acc.push(rel);
    }
    return acc;
}

const allMd = walkMd('.').sort();
ok(allMd.length > 5, `A1 the repo has documents to check (${allMd.length} found)`);

// The map entries are backticked paths inside the §9 table. A trailing /* covers
// a whole directory — that is how the two sibling projects are delegated.
// ⚠️ SCOPED TO §9's TABLE, NOT THE WHOLE FILE. The first draft of this check
// scanned all of HANDOFF.md and flagged `typing_sessions/*` — a FIRESTORE
// COLLECTION named in a different table entirely — as a missing directory.
// That is the crying-wolf failure this file's own header warns about, produced
// by this file, on its first run. Bound the region before parsing it.
const s9 = handoff.slice(handoff.indexOf('## \u00a79. Document map'));
const s9End = s9.indexOf('\n## ', 10);
const s9Text = s9End > 0 ? s9.slice(0, s9End) : s9;
const mapped = [...s9Text.matchAll(/\|\s*`([^`]+\.md|[^`]+\.mjs|[^`]+\/\*)`\s*\|/g)].map(m => m[1]);
ok(mapped.length > 8, `A2 §9's document map is readable (${mapped.length} entries)`);

const covers = (file) => mapped.some(m =>
    m === file || (m.endsWith('/*') && file.startsWith(m.slice(0, -1))));

const unmapped = allMd.filter(f => !covers(f));
ok(unmapped.length === 0,
   '⚠️⚠️ A3 EVERY .md IN THE REPO IS IN §9\'s DOCUMENT MAP. Missing: ' +
   (unmapped.join(', ') || 'none') +
   ' \u2014 an unlisted document is one the next reader never opens, and an unlisted ' +
   'ARCHIVE is worse: §9 says every split-out handoff file was deleted, so silence ' +
   'here reads as confirmation that it is gone.');

// ⚠️ The other direction. A map entry pointing at a deleted file sends the next
// reader looking for something that is not there, which costs them the same
// time as the omission and shakes their trust in the rest of the table.
const ghosts = mapped.filter(m => !m.endsWith('/*') && !existsSync(path.join(ROOT, m)));
ok(ghosts.length === 0,
   '⚠️ A4 EVERY PATH IN §9\'s MAP EXISTS. Missing from disk: ' +
   (ghosts.join(', ') || 'none'));

const dirGhosts = mapped.filter(m => m.endsWith('/*') &&
    !(existsSync(path.join(ROOT, m.slice(0, -2))) && statSync(path.join(ROOT, m.slice(0, -2))).isDirectory()));
ok(dirGhosts.length === 0,
   `⚠️ A5 every directory the map delegates to exists. Missing: ${dirGhosts.join(', ') || 'none'}`);

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n--- B. ⚠️⚠️ THE "EXPECTED STAMPS" BLOCK MATCHES THE ACTUAL FILES ---');
// ═══════════════════════════════════════════════════════════════════════════
//
// The START HERE block lists what each shipped file's version SHOULD be, so the
// next round can confirm what is live before touching anything. ⚠️ A stale entry
// here is worse than none: it is read as evidence, and it will be used to decide
// that a file does NOT need re-uploading.
//
// ⚠️ ONLY THE FIRST BLOCK IS CHECKED, AND THAT IS DELIBERATE. Previous rounds'
// blocks are kept below it verbatim and legitimately cite the versions that were
// current when they were written. Checking those would flag history as error,
// which is the crying-wolf failure this file must not commit.

const stampsAt = handoff.indexOf('**Expected stamps:**');
ok(stampsAt > 0, 'B1 the START HERE block still carries an Expected stamps list');

if (stampsAt > 0) {
    const block = handoff.slice(stampsAt, handoff.indexOf('\n> * ', stampsAt + 10));
    const claims = [...block.matchAll(/`([\w.-]+\.(?:js|css|html))`\s*\*\*v([0-9][\w.]*)\*\*/g)];
    ok(claims.length > 3, `B2 the stamps list parses (${claims.length} claims)`);

    // Same patterns versions.js uses, so this agrees with the build panel by
    // construction rather than by a second hand-maintained copy.
    // ⚠️⚠️ THE PATTERNS COME FROM versions.js's OWN SOURCES ARRAY, NOT FROM A
    // SECOND COPY WRITTEN HERE. The first draft of this check invented its own
    // "try a filename comment, then try a constant" order and immediately
    // reported index.html as v3.5.2 — matching an incidental `(index.html
    // v3.5.2)` deep in that file's body, in a sentence about a cache key.
    // ⭐ THAT IS THE EXACT TRAP ROADMAP 57 SET FOR ITSELF AND THAT ROUND 81
    // DOCUMENTED IN versions.js EARLIER THE SAME DAY. Writing a third copy of
    // the version-reading rule reproduced the bug the first two had already
    // been fixed for. Read the registry; do not re-derive it.
    const registry = read('versions.js');
    const sources = new Map();
    for (const m of registry.matchAll(/\{\s*file:\s*'([^']+)',\s*pattern:\s*\/(.+?)\/\s*\}/g)) {
        try { sources.set(m[1], new RegExp(m[2])); } catch { /* skip unparseable */ }
    }
    const readVersion = (file) => {
        const re = sources.get(file);
        if (!re || !existsSync(path.join(ROOT, file))) return null;
        const m = re.exec(read(file));
        return m ? m[1] : null;
    };

    for (const [, file, claimed] of claims) {
        const actual = readVersion(file);
        if (actual === null) { notes.push(`${file}: no readable version stamp; skipped`); continue; }
        ok(actual === claimed,
           `⚠️⚠️ B3 HANDOFF's START HERE says ${file} is v${claimed}; the file says ` +
           `v${actual}. ONE OF THE TWO IS A LIE, and the handoff is the one the next ` +
           `round reads BEFORE it looks at the file \u2014 it will decide this file is ` +
           `already deployed and skip it.`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n--- C. ⚠️ THE HARNESS COUNT IS THE REGISTRY COUNT ---');
// ═══════════════════════════════════════════════════════════════════════════
//
// "76 harnesses pass" appears in HANDOFF, CHANGELOG and the deploy notes, and is
// the single number a round quotes to say the suite is healthy. ⚠️ Adding a
// harness without updating it makes every one of those claims quietly wrong, and
// the number is the LAST thing anybody re-derives.

// ⚠️ COUNTED THE WAY THE RUNNER COUNTS: `suite` is FAST (plus EPUB only under
// --with-epubs), and the printed total is suite.length. The first draft grepped
// every `['name-test.mjs',` in the file and got 69 against a real 77, because
// the registry is split across arrays and the regex met entries it did not
// expect. A count that is merely close is a count that cries wolf.
const runner = read('tests/run-all-tests.mjs');
const arrayNamed = (name) => {
    const at = runner.search(new RegExp('const ' + name + '\\s*=\\s*\\['));
    if (at < 0) return null;
    let depth = 0, i = runner.indexOf('[', at);
    for (let j = i; j < runner.length; j++) {
        if (runner[j] === '[') depth++;
        else if (runner[j] === ']') { depth--; if (!depth) return runner.slice(i, j + 1); }
    }
    return null;
};
const fastBlock = arrayNamed('FAST');
// ⚠️ BOTH QUOTE STYLES. The registry mixes '...' and "..." entries and the
// second draft of this line matched only single quotes — 77 counted as 70.
// Twice now this check has been wrong in a way that looked plausible, which is
// exactly why it asserts an EXACT match and not a range: a count that is nearly
// right teaches the next round to ignore the number.
const registered = fastBlock ? (fastBlock.match(/\[\s*['"][\w.-]+\.mjs['"]/g) || []).length : -1;
ok(registered > 50, `C1 the runner's registry parses (${registered} harnesses)`);

const claimedCounts = [...handoff.matchAll(/\*\*(\d+) harnesses pass/g)].map(m => +m[1]);
if (!claimedCounts.length) {
    notes.push('HANDOFF states no harness count; nothing to check');
    pass++;
} else {
    // ⚠️ FIRST ONLY — later blocks are previous rounds' and cite their own counts.
    ok(claimedCounts[0] === registered,
       `⚠️ C2 HANDOFF's START HERE claims ${claimedCounts[0]} harnesses; the runner ` +
       `registers ${registered}. The count is quoted in three documents and is the ` +
       `last thing anyone re-derives.`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n--- D. ⚠️ THE ROADMAP INDEX AND THE DOCUMENT AGREE ON WHAT IS OPEN ---');
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ NARROW ON PURPOSE. `roadmap-index-test.mjs` already checks that every item
// is listed and grouped by its own ✅/⏳ marker. What it does NOT check is the
// SECTION HEADINGS INSIDE an item — and that is precisely where occurrence #2
// hid: ROADMAP 58 carried "### ⚠️ WHAT NEEDS A RULING FROM JAKE BEFORE IT IS
// BUILT" with Jake's answer recorded directly underneath it.
//
// ⭐ A heading that asks for a ruling, inside an item whose own answer is right
// there, is mechanically detectable. That is the whole of section D.

const roadmap = read('ROADMAP.md');
const items = roadmap.split(/^## (?=\d)/m).slice(1);
const stillAsking = [];
for (const item of items) {
    const title = item.slice(0, item.indexOf('\n')).trim();
    const asksForRuling = /###[^\n]*(NEEDS A RULING|NEEDS JAKE'S RULING|WAITING ON JAKE)/i.test(item);
    const hasAnswer = /###[^\n]*(JAKE'S ANSWER|JAKE'S RULING|ANSWERED|HE RULED)/i.test(item);
    if (asksForRuling && hasAnswer) stillAsking.push(title.slice(0, 60));
}
ok(stillAsking.length === 0,
   '⚠️⚠️ D1 NO ITEM BOTH ASKS FOR A RULING AND RECORDS THE ANSWER. Both: ' +
   (stillAsking.join(' | ') || 'none') +
   ' \u2014 this is ROADMAP 58\'s exact shape: Jake answered on 09-04, the heading ' +
   'above his answer still said he had not, and TWO ROUNDS told him it was ' +
   'blocked on him. He had to correct us: "I thought I addressed all of those ' +
   'before." When a ruling lands, re-head the section \u2014 do not just append.');

if (notes.length) {
    console.log('\n--- notes (not failures) ---');
    for (const n of notes) console.log('  - ' + n);
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} - ${pass} passing, ${fail} failing, ${notes.length} note(s)`);
process.exit(fail === 0 ? 0 : 1);
