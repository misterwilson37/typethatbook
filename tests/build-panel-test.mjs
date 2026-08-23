// build-panel-test.mjs v1.0.0 — Round 28 (Daugherty).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ WHY THIS EXISTS: THE PANEL WAS SHOWING CHILDREN ITS OWN HOUSEKEEPING
// ═════════════════════════════════════════════════════════════════════════════
//
// The build footer on game.html and learn.html — and the "build info" button on
// index.html — rendered every ⚠ note versions.js could produce, to anybody who
// hovered it. On 2026-08-22 that was twelve files' worth of lines like
//
//     game.js v3.42.3 ⚠ header is 453 lines (budget 60) ⚠ 40 version entries…
//
// printed in red over a nine-year-old's book. Nothing gated it, on any of the
// three surfaces, and nothing could have caught it: no harness knew the panel
// had an audience.
//
// ⚠️ THE FIX'S OWN FAILURE MODE IS THE THING THIS FILE ACTUALLY GUARDS.
// Hiding the notes is easy. Hiding them and leaving a panel that LOOKS CLEAN is
// a diagnostic that lies — and Jake reads this panel standing at a student's
// machine, signed in as nobody, which is exactly the state where the notes are
// suppressed. §0.-14.C is a whole write-up about a version stamp failing in the
// direction that reads as "everything is fine". So:
//
//     H. ⚠️ THE READ CACHE EXPIRES, AND NEVER OUTLIVES A PAGE LOAD
//     A. notes off by DEFAULT     — a caller that forgets the flag is safe
//     B. notes on when asked      — the gate is a gate, not a deletion
//     C. suppressed is never SILENT — the count still prints
//     D. all three callers pass a flag AND print the count
//     E. ADMIN_EMAILS has exactly one literal home
//     F. the renderer-drift note requires a real semver, not a sentinel
//
// ⚠️ E IS NOT ABOUT THIS PANEL and is here because this round created it. The
// list lived in four files. Nothing had drifted yet — luck, not design.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let pass = 0, fail = 0;
function ok(cond, msg) {
    if (cond) { pass++; }
    else { fail++; console.log('  ✗ FAIL  ' + msg); }
}

// versions.js is a browser module but the three functions under test are pure —
// no fetch, no DOM — except readAppliedCssVersion(), which collectNotes() calls
// for the two stylesheets. Stub the globals it touches so the module imports.
globalThis.sessionStorage = { getItem: () => null, setItem: () => {} };
globalThis.document = { body: {} };
globalThis.getComputedStyle = () => ({ content: 'none' });

const V = await import(path.join(ROOT, 'versions.js'));

// A results array shaped exactly like readDeployedVersions() returns, carrying
// one of every note class the renderer knows how to draw.
const RESULTS = [
    { file: 'clean.js', version: '1.0.0', header: '1.0.0',
      audit: { lines: 10, entries: 1, ordered: true, problems: [] } },
    { file: 'longheader.js', version: '2.0.0', header: '2.0.0',
      audit: { lines: 900, entries: 2, ordered: true,
               problems: ['header is 900 lines (budget 220 for 50 lines of code)'] } },
    { file: 'liar.js', version: '3.0.0', header: '2.9.0',
      audit: { lines: 10, entries: 1, ordered: true, problems: [] } },
    { file: 'unreadable.js', version: null, note: 'HTTP 404' },
];

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── A. ⚠️ NOTES ARE OFF BY DEFAULT — a forgetful caller is SAFE ───');
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ THIS IS THE LOAD-BEARING ONE. renderBuildList has three call sites on three
// student-reachable surfaces and they are hand-maintained twins (§0.-13.E). The
// default decides what happens when a FOURTH surface is added by someone who
// never read this file.
{
    const html = V.renderBuildList(RESULTS);
    ok(!html.includes('⚠'), 'default render emits no ⚠ at all');
    ok(!html.includes('900 lines'), 'default render omits header-budget notes');
    ok(!html.includes('2.9.0'), 'default render omits header/constant drift');
    ok(html.includes('clean.js') && html.includes('v1.0.0'),
       'default render still lists every file and version');
    ok(html.includes('unreadable.js') && html.includes('HTTP 404'),
       '⚠️ an unreadable file is a ROW, not a note — it stays visible to everyone, ' +
       'because a missing version is the panel failing to answer, not housekeeping');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── B. NOTES ON WHEN ASKED — the gate is a gate, not a deletion ───');
// ═══════════════════════════════════════════════════════════════════════════
{
    const html = V.renderBuildList(RESULTS, { notes: true });
    ok(html.includes('900 lines'), 'staff render includes header-budget notes');
    ok(html.includes('2.9.0') && html.includes('one of the two is a lie'),
       'staff render includes header/constant drift');
    ok((html.match(/⚠/g) || []).length >= 2, 'staff render marks each note with ⚠');
    ok(html.includes('build-note'),
       'notes carry .build-note so they WRAP — an unwrapped note once pushed the ' +
       'panel wider than the viewport and off the left edge');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── C. ⚠️⚠️ SUPPRESSED IS NEVER SILENT ───');
// ═══════════════════════════════════════════════════════════════════════════
// The panel must never look CLEAN when it is merely GAGGED. Jake troubleshoots
// at student machines signed in as nobody.
{
    ok(V.countBuildNotes(RESULTS) === 2,
       'countBuildNotes counts every note the staff render would have drawn');
    ok(V.countBuildNotes([RESULTS[0]]) === 0, 'a clean build counts zero');

    const line = V.renderHiddenNotesLine(V.countBuildNotes(RESULTS));
    ok(line.includes('2 build notes'), 'the hidden-notes line states the COUNT');
    ok(line.includes('staff'), 'the hidden-notes line says who can read them');
    ok(!line.includes('⚠'),
       '⚠️ NO ⚠ IN THE HIDDEN LINE. It is read most often by a child who hovered ' +
       'the footer by accident and can do nothing about any of it');
    ok(V.renderHiddenNotesLine(0) === '',
       'a genuinely clean build says nothing at all');
    ok(V.renderHiddenNotesLine(1).includes('1 build note —'),
       'singular is not "1 build notes"');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── D. ⚠️ ALL THREE CALLERS GATE **AND** COUNT ───');
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ THE TWIN CHECK. Three surfaces render this panel and no two of them can
// import each other's controller. Gating two and forgetting the third is the
// default outcome unless something asks.
for (const f of ['game.js', 'learn.js', 'index.html']) {
    const src = read(f);
    ok(/renderBuildList\([^)]*\{\s*notes:/.test(src),
       `${f} passes an explicit { notes: … } flag to renderBuildList`);
    // ⚠️ THE TRAILING `(` IS THE WHOLE POINT AND IT IS NOT PEDANTRY. The first
    // draft of this check tested `src.includes('renderHiddenNotesLine')`, which
    // is satisfied by the IMPORT LINE ALONE. Deleting the call site and keeping
    // the import passed it. Mutation-verified into existence; see §0.-20.E.
    ok(src.includes('renderHiddenNotesLine('),
       `${f} CALLS renderHiddenNotesLine — a gated panel that showed nothing ` +
       `would read as a clean build`);
    ok(src.includes('countBuildNotes('),
       `${f} CALLS countBuildNotes rather than hardcoding a count`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── E. ⚠️ ADMIN_EMAILS HAS EXACTLY ONE LITERAL HOME ───');
// ═══════════════════════════════════════════════════════════════════════════
// It lived in game.js, learn.js, admin.js and reports.html. Four hand-maintained
// copies of two addresses; adding a colleague meant remembering all four, and
// the symptom of forgetting one is a teacher who can reach Reports but not the
// admin panel, with no error anywhere to explain it.
{
    const CANDIDATES = ['game.js', 'learn.js', 'admin.js', 'lessons-admin.js',
                        'staff-admin.js', 'index.html', 'reports.html',
                        'admin.html', 'firebase-config.js', 'school-audit.html'];
    // Any file declaring a literal array of @-bearing strings under an
    // admin/staff/bootstrap name. Deliberately loose: a renamed copy is still a
    // copy, and this check exists because a copy is easy to make by accident.
    const RE = /(ADMIN_EMAILS|BOOTSTRAP_EMAILS|STAFF_EMAILS)\s*=\s*\[[^\]]*@[^\]]*\]/s;
    const holders = CANDIDATES.filter(f => {
        try { return RE.test(read(f)); } catch { return false; }
    });
    ok(holders.length === 1,
       `exactly one file declares the list literally (found: ${holders.join(', ') || 'none'})`);
    ok(holders[0] === 'firebase-config.js',
       '⚠️ the one home is firebase-config.js — chosen because all five consumers ' +
       'already import db/auth from it, so consolidating cost zero new dependencies');
    ok(V.VERSIONS_VERSION && /^\d+\.\d+\.\d+$/.test(V.VERSIONS_VERSION),
       'versions.js still exports a well-formed VERSIONS_VERSION');
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── F. ⚠️⚠️ THE RENDERER-DRIFT NOTE NEEDS A SEMVER, NOT A SENTINEL ───');
// ═══════════════════════════════════════════════════════════════════════════
// game.js seeds `rendererVersionStr = '—'` for NEVER MOUNTED. The old guard
// excluded only 'failed', so in classic view — the DEFAULT view — the panel
// printed "mounted v—, deployed file reads v1.5.4 — stale module cache" in red,
// on every session, since the check shipped. A red alarm that is always on is
// not an alarm.
{
    const src = read('game.js');
    ok(/_SEMVER_RE\s*=\s*\/\^\\d\+\\\.\\d\+\\\.\\d\+\$\//.test(src),
       'game.js defines a semver shape for the mounted-renderer version');
    ok(/_SEMVER_RE\.test\(String\(_mountedRendererVersion/.test(src),
       '⚠️ the drift note is gated on that shape, so NO sentinel can satisfy it — ' +
       "not '—', not 'failed', and not the next one somebody adds");
    ok(!/_mountedRendererVersion\s*&&\s*_mountedRendererVersion\s*!==\s*'failed'/.test(src),
       'the old sentinel-blind guard is gone, not merely supplemented');

    // The sentinel is still the initial value — the fix is in the guard, not by
    // changing what "never mounted" looks like.
    ok(/rendererVersionStr\s*=\s*'—'/.test(src),
       "'—' is still the never-mounted sentinel; the guard changed, not the seed");
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── H. ⚠️⚠️ THE READ CACHE EXPIRES AND DIES WITH THE PAGE ───');
// ═══════════════════════════════════════════════════════════════════════════
// Jake, 2026-08-23: *"Force refreshing is not refreshing everything. I have to
// close the tab and open a new one."* That was this cache. It lived in
// sessionStorage, which SURVIVES a reload — including a hard reload — and clears
// only in a new tab. So the panel answered "what is running right now?" from a
// copy taken at first page load, and the harder he refreshed the more certain
// the wrong answer looked. §0.-22.
{
    const src = read('versions.js');
    // Comments stripped: this file now discusses sessionStorage at length.
    const code = src.replace(/\/\/[^\n]*/g, '');

    ok(!/sessionStorage\.getItem/.test(code),
       '⚠️⚠️ NOTHING READS FROM sessionStorage. That storage outlives a reload, ' +
       'so a deploy instrument kept there cannot be refreshed by any action a ' +
       'person would think to try.');
    ok(!/sessionStorage\.setItem/.test(code),
       'and nothing writes to it either — a write with no read is the next ' +
       "round's confusing discovery");
    ok(/sessionStorage\.removeItem/.test(code),
       'the legacy key IS cleared once at load, so a tab upgrading from v1.12.0 ' +
       'does not leave a plausible-looking cache behind for someone to find');
    ok(typeof V.BUILD_READ_TTL_MS === 'number' && V.BUILD_READ_TTL_MS > 0,
       'the freshness policy is a named, exported number rather than a literal ' +
       'buried in a branch');
    ok(V.BUILD_READ_TTL_MS <= 5 * 60_000,
       '⚠️ the TTL is short enough to be useful DURING a deploy — the only time ' +
       'anyone reads this panel is when they doubt what is running');

    // Drive the real thing. readOne() fetches, so stub fetch and count calls.
    const realFetch = globalThis.fetch;
    let fetches = 0;
    globalThis.fetch = async () => { fetches++; return {
        ok: true, status: 200,
        text: async () => 'export const VERSIONS_VERSION = \'9.9.9\';\n',
    }; };
    try {
        V._resetBuildCacheForTest();
        await V.readDeployedVersions();
        const first = fetches;
        ok(first > 0, 'a cold read actually fetches');

        await V.readDeployedVersions();
        ok(fetches === first,
           'a second read inside the TTL is served from memory — opening the ' +
           'panel three times must not re-fetch ~600KB on a school connection');

        await V.readDeployedVersions({ force: true });
        ok(fetches > first,
           '⚠️ { force: true } ALWAYS goes to the network. index.html\'s build ' +
           'button passes it, because a deliberate press means "right now".');

        // Concurrency: two callers, one round of fetches.
        V._resetBuildCacheForTest();
        fetches = 0;
        await Promise.all([V.readDeployedVersions(), V.readDeployedVersions()]);
        const both = fetches;
        V._resetBuildCacheForTest();
        fetches = 0;
        await V.readDeployedVersions();
        ok(both === fetches,
           '⚠️ two concurrent callers share ONE round of fetches. Valid here and ' +
           'NOT always: learn.js v2.3.0 records a real defect from sharing an ' +
           'in-flight promise between callers with different credentials — these ' +
           'are unauthenticated static reads, so callers are interchangeable.');
    } finally {
        globalThis.fetch = realFetch;
        V._resetBuildCacheForTest();
    }

    // ⚠️ The page controllers must not rebuild a staleness layer of their own.
    for (const f of ['game.js', 'learn.js']) {
        const c = read(f).replace(/\/\/[^\n]*/g, '');
        ok(!/dataset\.loaded/.test(c),
           `${f} keeps no "already loaded" flag — it was a THIRD layer of ` +
           `staleness on top of this cache and the HTTP cache, and it is the one ` +
           `that made a hard reload useless`);
    }
    ok(/readDeployedVersions\(\s*\{\s*force:\s*true/.test(read('index.html')),
       "index.html's explicit build button forces a fresh read");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
