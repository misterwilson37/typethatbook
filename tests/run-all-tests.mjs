// run-all-tests.mjs v1.6.0 — Round 24 (Monotype): adopt-date-test.mjs
// registered. Nothing else changed. 36 harnesses.
//
// run-all-tests.mjs v1.5.0 — Round 23 (Empire): guest-merge-test.mjs and
// queue-owner-test.mjs registered; reconcile-test.mjs and union-clock-test.mjs
// DELETED with the reconcile tool they covered; real-sessions-fixture.mjs
// exempted as data rather than a harness. ⚠️ THE AUDIT CAUGHT THE HALF-DONE
// DELETION — the harnesses were removed from disk before their entries were
// removed from FAST, and the suite went red naming both. That is the second
// time it has paid for itself.
//
// run-all-tests.mjs v1.4.0 — Round 6 (Noiseless), amended Round 14 (Sholes),
// Round 16 (Royal), Round 17 (Linotype), Round 21 (Hammond).
//
// v1.4.0 — ⚠️ THREE HARNESSES WERE IN NO LIST AT ALL, AND ONE OF THEM WAS THE
//          ONLY HARNESS THAT DRIVES THE LIVE §3.1 DEFECT. This file printed
//          "ALL 29 HARNESSES PASS" while crossmode-overwrite-test.mjs,
//          union-clock-test.mjs and week-agreement-test.mjs sat beside it
//          unrun. All three are runner-clean and are now in FAST.
//          ⚠️ THE REAL FIX IS THE REGISTRATION AUDIT BELOW, NOT THE THREE LINES.
//          A harness is only coverage if something notices when it stops being
//          run, and until now nothing did — tests/README.md said "thirty-four
//          harnesses, thirty-two registered" when the true numbers were
//          thirty-nine and thirty-four. The count drifted because each round
//          updated the number it remembered instead of the number on disk. The
//          audit now reads the directory and FAILS THE SUITE on any .mjs that
//          is in no list and not explicitly exempt. You cannot add a harness and
//          forget to register it any more; the suite will not go green.
//          ⚠️ NEW LIST `RULES` — harnesses that need the Firebase emulator. They
//          are NOT run by `npm test` (a fresh clone has no JVM guarantee) but
//          they ARE named, so the audit sees them and so nobody concludes again
//          that the rules cannot be tested. `npm run test:rules` runs them.
//
// v1.3.2 — ⚠️ DESCRIPTION FIX, and worth a moment. source-split-test.mjs's entry
//          here advertised "Part C: no split field is fed from the shared
//          cross-mode counter" for a Part C that had been DELETED when the source
//          split was reverted (v2.0.0). The suite was green throughout: nothing
//          asserts that these one-line descriptions match the harnesses they
//          name, so they are documentation with no test behind them and they rot
//          silently while reading as authoritative. If you change what a harness
//          covers, change its line here in the same edit.
//
// v1.3.1 — ✅ THE PENDING LIST EMPTIED ITSELF, EXACTLY ONCE, AND WORKED. All three
//          entries landed together when the concurrent round's app code arrived:
//          the runner reported LAND on each and printed its notice, and all three
//          are promoted into FAST in this same commit, as the mechanism requires.
//          `PENDING` stays in the file, empty, because it is now the documented
//          place to put a test-first harness — and because deleting it would mean
//          the next round has to reinvent it under deadline. See tests/README.md.
//
// v1.3.0 — ⚠️ NEW THIRD LIST: `PENDING`. Three harnesses arrived from a
//          concurrent round written TEST-FIRST — they assert behaviour that the
//          shipped repo does not have yet, so they are red on purpose. Putting
//          them in FAST would have moved the headline from "1 failing" to "4
//          failing", and README's own warning (invariant 54) is that an accepted
//          red is how the next real failure hides. A pending harness therefore
//          does NOT count toward `failed`.
//          ⚠️ THE LIST IS SELF-CLEARING, WHICH IS THE ONLY REASON IT IS SAFE. A
//          pending harness that PASSES is reported loudly as LANDED, because
//          that means the app code shipped and the entry must be promoted into
//          FAST. Nothing may sit in PENDING quietly. If you add an entry here,
//          name the exact file and version it waits on — "pending" without a
//          named blocker is just a disabled test.
//
// v1.2.0 — MOVED INTO tests/. This file now lives one level below the repo
//          root, so it keeps two paths: HERE (this directory, where the
//          harnesses are) and ROOT (the repo root, where every shipped file
//          still is). Harnesses are spawned with cwd: ROOT, which is what
//          they saw before the move, so a harness that reads a relative path
//          off the working directory keeps working.
//          Also REGISTERED TWO HARNESSES THAT WERE GREEN AND UNWATCHED:
//          sort-test.mjs and lesson-atomicity-test.mjs both passed on demand
//          but were in no list, so nothing would have told you the day they
//          stopped. An unregistered passing test is not coverage.
//
// v1.1.1 — description string only: session-merge-test.mjs's entry now
//          mentions the repair-resync coverage its new Part D added.
//
// v1.1.0 — ⚠️ `chunktest.mjs` DEREGISTERED AND DELETED. It reimplemented the
//          v3.9.2 sprint-rollup loop inline instead of importing the module, so
//          when that logic moved into session-log.js the harness kept passing
//          against a copy of code that no longer existed anywhere. Three rounds
//          flagged it and none removed it, because deleting a green test always
//          looks like losing coverage. It was not coverage.
//          ⚠️ ITS REAL REPLACEMENT IS `session-merge-test.mjs` PART B, which
//          drives the actual module. If you are about to re-add chunktest.mjs
//          from an old copy of the repo, read HANDOFF.md invariant 39 first.
//
// There are seventeen harnesses. Before this file, knowing whether they passed meant
// running fifteen commands and reading fifteen different output formats, so in
// practice nobody ran the ones they weren't already suspicious of — which is how
// credit-test.mjs sat broken through a whole round without anyone noticing that it
// was broken rather than passing.
//
//   npm install                            # devDependencies cover the suite
//   npm test                               # the fast suite
//   npm run test:epubs                     # plus the EPUB corpus harnesses
//
// Both scripts run this file from the repo root. Running it from inside
// tests/ works too — every path below is resolved from import.meta.url, not
// from the working directory.
//
// A harness counts as passing if it exits 0 and prints no line matching /FAIL|
// UNSAFE|\bERROR\b/. That is deliberately crude: these harnesses predate any
// shared reporting convention and retrofitting one across all of them would be a
// bigger change than the value justifies. If you write a new harness, exit
// non-zero on failure and this file needs no edit.
//
// NOT INCLUDED: firestore-rules.test.mjs. It needs the Firebase emulator (a CLI
// and a JVM), and README already records it as known-wrong against rules v2.x —
// it seeds roles as auth-token claims and the rules read staff/{uid} documents.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync } from 'node:fs';

// HERE is tests/. ROOT is the repo root, one level up, where every shipped
// file lives. Keep the two apart: mixing them up is how the move breaks.
const HERE = fileURLToPath(new URL('./', import.meta.url));
const ROOT = fileURLToPath(new URL('../', import.meta.url));

// Fast: runs with no arguments in a fresh checkout, nothing external to fetch.
// ⚠️ metadata-map-test.mjs is the one exception to "well under a second" — it unzips
// the 24 books in library/ and takes ~3s. It is here rather than in EPUB below because
// it guards a regression that shipped for six versions unnoticed, and a guard that
// only runs behind a flag is a guard nobody runs. Its synthetic half still passes with
// library/ absent.
const FAST = [
    ["undefined-calls-test.mjs", "every identifier reference resolves: 13 JS files + 3 inline HTML scripts"],
    ["metadata-map-test.mjs",     "EPUB source/license map onto real dropdown options; Gutenberg origin"],
    ["reanchor-test.mjs",         "progress survives a re-upload: clamp, anchor search, staleness ladder"],
    ["credits-scroll-test.mjs",  "end-of-book credits reel: rises into view, holds, shows every row"],
    ["canvas-clear-test.mjs",     "the per-frame clear always covers the whole canvas"],
    ["title-case-test.mjs",       "Roman numerals survive title casing; words are not mistaken for them"],
    ["student-flow-test.mjs",     "a cold-start student gets assigned, stamped and reportable"],
    ['verify-guards.mjs',        'flush re-entrancy guards at 2/3/6/12 concurrent callers'],
    ['progress-test.mjs',        'library progress bar, including its degradation paths'],
    ['ordinal-test.mjs',         'body ordinals on modern and legacy documents'],
    ['map-geometry-test.mjs',    'Adventure dot placement across real book sizes'],
    ['credits-test.mjs',         'Classic end credits: structure and injection'],
    ['credit-test.mjs',          'library card attribution: structure and injection'],
    ['card-markup-test.mjs',     'card markup survives the HTML parser intact'],
    ['about-test.mjs',           'detectAbout() and the completeness dot'],
    ['about-render-test.mjs',    'About panel segments, headings, credit injection'],
    ['anon-ladder-test.mjs',     'guest login ladder: rungs, the no-third-prompt rule, coalescing guards'],
    ['hud-test.mjs',             'the shared time readout: layout, goal denominators, one formatter only'],
    ['variety-floor-test.mjs',   'the shared missed-character variety filter behind both practice buttons'],
    ['week-anchor-test.mjs',     'the report audit and the app agree on where the school week starts'],
    ['class-create-test.mjs',    'class name matching and the shared CSV class-creation path'],
    ['roster-filter-test.mjs',   'Students-tab date range: the Saturday week boundary and the status line'],
    ['sort-test.mjs',            'library sort keys against the real author strings in library/'],
    ['lesson-atomicity-test.mjs','lesson restart-on-incomplete, and the constants game.js and learn.js share'],
    // ── promoted out of PENDING when the concurrent round's code landed ──
    ['session-merge-test.mjs',   'the guest/expired merge, session-log rollup dating, the repair resync, and Part E: two concurrent flushes write ONE document'],
    ['open-unit-test.mjs',       'the open sprint/run: deltas, watermarks, and the reset-site parity guard'],
    ['source-split-test.mjs',    'legacy-FIRST daily-log reads (the split is reverted), splitSessionTotals(), and sessionSignature() duplicate detection'],
    // ⚠️ Round 23 (Empire): reconcile-test.mjs and union-clock-test.mjs were
    // DELETED here, in the same commit as the reconcile tool they covered. The
    // registration audit caught the attempt to remove only one half. The real
    // production session documents union-clock-test.mjs held were lifted first
    // into real-sessions-fixture.mjs — ROADMAP item 2 required that, and item 1
    // needs them.
    ['daylog-test.mjs',          'ONE NUMBER: the shared typing_logs week reader \u2014 Saturday anchor, legacy-first totals, and the partial-read refusal'],
    // ── Round 21 (Hammond): were in NO list. See the v1.4.0 note above. ──
    // ⚠️ REWRITTEN IN ROUND 22 (v2.0.0). It no longer reproduces §3.1 — it GUARDS
    // THE FIX, and it fails properly now instead of reporting a loss as expected
    // behaviour. Its old Part C modelled per-source DOCUMENT ids, which the
    // deployed rules DENY (HANDOFF §0.-5.B): six rounds of green there meant
    // only that the author's idea was self-consistent. Its Part A reads the real
    // files and is the assertion that would notice §3.1 coming back.
    ['crossmode-overwrite-test.mjs', 'ONE DOCUMENT, TWO WRITERS: \u00a73.1 CLOSED. Part A is the guard \u2014 neither page may name the other source\u2019s fields in a Firestore payload, ever'],
    ['week-agreement-test.mjs',  'Rule 11 date agreement at all 24 hours \u2014 run as TZ=America/Chicago for the real check'],
    // ⚠️ ROADMAP Phase B step B1. Written test-first and RED against daylog.js
    // v1.1.0 — it could not even import. Green from v1.2.0. Its Part F LIFTS
    // readLogTotals() OUT OF reports.html and drives it against daylog.js's
    // totalsOf(), so the student's reader and the teacher's reader cannot drift.
    // ⚠️ The ⟳ button is the only destructive control in reports.html reachable
    // in one click. Until v2.23.0 it had no limit on how far down it could move
    // a day, and the session record it rewrites from is NOT a superset of the
    // day counter. Real 2026-08-19 evidence is in the harness header.
    ['recalc-guard-test.mjs',    'the \u27f3 drop guard: small corrections stay silent, a big down-move needs a confirmed yes, and the delete path is exempt'],
    ['daylog-cutover-test.mjs',  'the per-source cutover: pre-cutover days read EXACTLY as before, post-cutover days sum flat + splits, and reports.html carries the identical gate'],
    ['tab-lifetime-test.mjs',    'THE MISSING AXIS: two controllers over one shared document across real tab orderings. \u26a0\ufe0f Parts B/C/F assert the CORRECT totals and choose their controller by READING game.js/learn.js, so they go RED on a build without the writers'],
    // ⚠️ Round 23 (Empire). The session queue was ONE slot holding ONE uid, so a
    // second student signing in on the same Chromebook destroyed the first's
    // unflushed sprints at their first five seconds of typing. Every READ was
    // uid-scoped; `_write()` was not. Mutation-verified: 8 failing against
    // session-log.js v1.4.0.
    // ⚠️ Round 23 (Empire). THE GUEST MINUTE, and the numbers are Jake's own:
    // School guest 1:04 -> 8:31 (merged), Library guest 1:11 -> 8:31 (lost).
    // game.js had no guest merge on the auth path; the merge existed twice
    // inline in two modal paths, so which of three sign-in buttons a child
    // pressed decided whether their minutes survived. 11 failing against
    // game.js v3.35.0 / learn.js v2.20.0.
    ['guest-merge-test.mjs',     'THE GUEST MINUTE: time typed before signing in is merged AND flushed AND lands in the session record, in BOTH modes'],
    ['queue-owner-test.mjs',     'ONE BROWSER, TWO STUDENTS: a second account may not destroy the first\u2019s unflushed queue, by push, by flush or by eviction'],

    // ⚠️ Round 24 (Monotype). THE EVENING GUEST. sessionLogAdopt() recomputed a
    // record's date from `at.slice(0, 10)` — UTC — throwing away the local date
    // the caller had already stamped. In Central time that is tomorrow from
    // 7:00 PM, so an evening guest's clock landed on today and their sprint
    // record on tomorrow. Invisible during school hours, which is why every
    // classroom test of the guest handover passed on a build with it.
    // 4 failing against session-log.js v1.5.0.
    ['adopt-date-test.mjs',      'THE EVENING GUEST: an adopted sprint keeps the local date the student typed it on, not the UTC one'],
];

// ⚠️ RULES — need the Firebase emulator (a JVM plus a jar download), so they are
// NOT part of `npm test`; a fresh clone cannot be assumed to have java. Run them
// with `npm run test:rules`. They are named here so the registration audit can
// see them and so that NOBODY CONCLUDES AGAIN THAT THE RULES CANNOT BE TESTED —
// firestore-rules.test.mjs carried an "I COULD NOT RUN THIS" header for four
// rounds and it was false the whole time. Round 20 then designed a fix the
// deployed rules reject. See tests/README.md → "Running the rules harnesses".
const RULES = [
    ['rules-probe.test.mjs',     'the rules questions HANDOFF \u00a70.-5 depends on: the roster sweep, the per-source shape, the owner read, and \u26a0\ufe0f Part D \u2014 a day the student never typed reads as MISSING, not DENIED (the v2.6.0 incident)'],
    ['firestore-rules.test.mjs', 'the broad security suite \u2014 staff scoping, student isolation, privilege escalation'],
];

// ⚠️ PENDING — written test-first, against app code that has NOT landed. Each
// entry names the exact blocker. These run, and their failures are reported, but
// they do not count as suite failures. When one starts passing the runner says so
// in capitals: move it into FAST and delete it from here, same commit.
// ✅ EMPTY, and that is the correct resting state. The three harnesses that opened
// this list (open-unit, session-merge, source-split) were promoted into FAST the
// moment their app code landed, which is the rule below working as intended.
const PENDING = [
];

// Slow: need a directory of EPUBs. Default to the repo's library/, which each
// harness now resolves as ../library relative to itself.
const EPUB = [
    ['chapter-harness.mjs',   'full chapter pipeline over the corpus'],
    ['real-epub-harness.mjs', 'cover detection + spine resolution'],
    ['scan2.mjs',             'suspect body chapters (Fix C candidates)'],
    ['fix-candidates.mjs',    'BEFORE/AFTER differ — collateral damage from importer changes'],
];

// ⚠️ SYNTAX GATE. `node --check foo.js` parses a .js file as a SCRIPT, not a module,
// and so accepts an ES module with an unclosed method — it did exactly that during
// Round 6, and only an actual `import` surfaced it. Every shipped .js here is an ES
// module, so they must be checked as modules. Cheap, and it fails loudly.
import { readFileSync as _rf } from 'node:fs';
// ⚠️ THE THREE SHARED MODULES WERE MISSING FROM THIS LIST — stats-wal.js since
// Round 11, session-log.js since Round 12 — so the files game.js and learn.js both
// depend on were the only shipped JS nothing parsed. Found in Round 13 when hud.js
// became the fourth. A shared module is the worst possible thing to leave
// unchecked: a syntax error in one takes down BOTH student pages at import time.
const MODULES = ['game.js', 'learn.js', 'admin.js', 'adventure-renderer.js',
                 'keyboard.js', 'lessons-admin.js', 'staff-admin.js', 'versions.js',
                 'firebase-config.js', 'stats-wal.js', 'session-log.js', 'hud.js',
                 'variety-floor.js'];
let syntaxBad = 0;
for (const f of MODULES) {
    const r = spawnSync(process.execPath, ['--input-type=module', '--check'],
                        { input: _rf(ROOT + f, 'utf8'), encoding: 'utf8' });
    if (r.status !== 0) {
        syntaxBad++;
        console.log(`  FAIL ${f.padEnd(26)} does not parse as an ES module`);
        console.log((r.stderr || '').split('\n').slice(0, 4).map(l => '         ' + l).join('\n'));
    }
}
if (!syntaxBad) console.log(`  ok   ${'(syntax)'.padEnd(26)} all ${MODULES.length} shipped modules parse as ES modules`);

// ═════════════════════════════════════════════════════════════════════════════
// REGISTRATION AUDIT — the part of v1.4.0 that actually matters
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ AN UNREGISTERED HARNESS IS NOT COVERAGE, AND NOTHING USED TO NOTICE. Three
// harnesses sat in tests/ in no list — including the only one that drives the
// live §3.1 defect — while this file printed ALL 29 HARNESSES PASS.
//
// This reads the directory and fails the suite on anything unaccounted for. To
// exempt a file you must name it AND say why, right here, which is a deliberate
// act that shows up in a diff.
const EXEMPT = new Map([
    ['run-all-tests.mjs', 'this file'],
    ['cover-harness.mjs', 'needs a directory of EPUBs AND writes image files; run by hand'],
    // ⚠️ NOT A HARNESS — it asserts nothing and has no exit code. It is the only
    // real production session data in the repository, lifted out of
    // union-clock-test.mjs before Round 23 deleted it, because Jake's rule 10
    // will not accept synthetic records for a defect that lives BETWEEN records.
    // Imported by harnesses; never run on its own. Deleting it costs the project
    // the only evidence it has about what a real day looks like.
    ['real-sessions-fixture.mjs', 'a data fixture imported by harnesses, not a harness itself'],
]);
const listed = new Set([...FAST, ...PENDING, ...EPUB, ...RULES].map(e => e[0]));
const onDisk = readdirSync(HERE).filter(f => f.endsWith('.mjs'));
const orphans = onDisk.filter(f => !listed.has(f) && !EXEMPT.has(f));
if (orphans.length) {
    console.log('');
    console.log(`  FAIL ${'(registration)'.padEnd(26)} ${orphans.length} harness(es) in tests/ are in NO list:`);
    for (const f of orphans) console.log(`         ${f}`);
    console.log('         Add each to FAST, PENDING, EPUB or RULES — or to EXEMPT with a reason.');
} else {
    console.log(`  ok   ${'(registration)'.padEnd(26)} all ${onDisk.length} files in tests/ are accounted for`);
}

const withEpubs = process.argv.includes('--with-epubs');
const suite = withEpubs ? [...FAST, ...EPUB] : FAST;

let failed = 0, missing = 0, landed = 0;
const results = [];

const run = (file) => {
    const r = spawnSync(process.execPath, [HERE + file], { cwd: ROOT, encoding: 'utf8', timeout: 600000 });
    const out = (r.stdout || '') + (r.stderr || '');
    return { out, bad: r.status !== 0 || /FAIL|UNSAFE|\bERROR\b/.test(out) };
};

for (const [file, what] of suite) {
    if (!existsSync(HERE + file)) { results.push(['MISS', file, what]); missing++; continue; }
    const { out, bad } = run(file);
    if (bad) { failed++; results.push(['FAIL', file, what, out]); }
    else results.push(['ok', file, what]);
}

// Pending harnesses run last and are scored backwards: failing is expected and
// silent-ish, PASSING is the event worth reporting.
for (const [file, blocker] of PENDING) {
    if (!existsSync(HERE + file)) { results.push(['MISS', file, blocker]); missing++; continue; }
    const { bad } = run(file);
    if (bad) results.push(['pend', file, blocker]);
    else { landed++; results.push(['LAND', file, blocker]); }
}

console.log('');
for (const [status, file, what, out] of results) {
    console.log(`  ${status.padEnd(4)} ${file.padEnd(26)} ${what}`);
    if (out) console.log(out.split('\n').filter(Boolean).slice(-12).map(l => '         ' + l).join('\n'));
}

console.log('');
if (failed || missing || syntaxBad || orphans.length) {
    console.log(`${failed} failing, ${missing} missing, of ${suite.length} harnesses; ${syntaxBad} syntax failure(s); ${orphans.length} unregistered.`);
} else {
    // ⚠️ THIS LINE IS ONLY TRUE BECAUSE THE REGISTRATION AUDIT ABOVE PASSED.
    // Before v1.4.0 it was printed while three harnesses sat unrun.
    console.log(`ALL ${suite.length} HARNESSES PASS. (${RULES.length} rules harnesses not run — npm run test:rules.)`);
}
if (PENDING.length) {
    console.log(`${PENDING.length} pending (test-first, blocked on app code) — not counted above.`);
}
if (landed) {
    console.log('');
    console.log(`  ⚠️  ${landed} PENDING HARNESS(ES) NOW PASS. The code they were waiting`);
    console.log('      on has landed. Promote them into FAST and delete them from');
    console.log('      PENDING, in the same commit that ships that code.');
}
if (!withEpubs) console.log('(EPUB corpus harnesses not run — pass --with-epubs.)');
if (failed || missing || syntaxBad || orphans.length) process.exitCode = 1;
