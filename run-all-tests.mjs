// run-all-tests.mjs v1.0.0 — Round 6 (Noiseless).
//
// There are fifteen harnesses. Before this file, knowing whether they passed meant
// running fifteen commands and reading fifteen different output formats, so in
// practice nobody ran the ones they weren't already suspicious of — which is how
// credit-test.mjs sat broken through a whole round without anyone noticing that it
// was broken rather than passing.
//
//   npm install --no-save jsdom jszip @xmldom/xmldom acorn acorn-walk
//   node run-all-tests.mjs                 # the fast suite
//   node run-all-tests.mjs --with-epubs    # plus the EPUB corpus harnesses
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
import { existsSync } from 'node:fs';

const HERE = fileURLToPath(new URL('./', import.meta.url));

// Fast: no external corpus, each runs in well under a second.
const FAST = [
    ["undefined-calls-test.mjs", "every identifier reference resolves: 9 JS files + 3 inline HTML scripts"],
    ["student-flow-test.mjs",     "a cold-start student gets assigned, stamped and reportable"],
    ['verify-guards.mjs',        'flush re-entrancy guards at 2/3/6/12 concurrent callers'],
    ['chunktest.mjs',            'sprint rollup chunking: loss, duplication, the 200 cap'],
    ['progress-test.mjs',        'library progress bar, including its degradation paths'],
    ['ordinal-test.mjs',         'body ordinals on modern and legacy documents'],
    ['map-geometry-test.mjs',    'Adventure dot placement across real book sizes'],
    ['credits-test.mjs',         'Classic end credits: structure and injection'],
    ['credit-test.mjs',          'library card attribution: structure and injection'],
    ['card-markup-test.mjs',     'card markup survives the HTML parser intact'],
    ['about-test.mjs',           'detectAbout() and the completeness dot'],
    ['about-render-test.mjs',    'About panel segments, headings, credit injection'],
];

// Slow: need a directory of EPUBs. Default to the repo's library/.
const EPUB = [
    ['chapter-harness.mjs',   'full chapter pipeline over the corpus'],
    ['real-epub-harness.mjs', 'cover detection + spine resolution'],
    ['scan2.mjs',             'suspect body chapters (Fix C candidates)'],
    ['fix-candidates.mjs',    'BEFORE/AFTER differ — collateral damage from importer changes'],
];

const withEpubs = process.argv.includes('--with-epubs');
const suite = withEpubs ? [...FAST, ...EPUB] : FAST;

let failed = 0, missing = 0;
const results = [];

for (const [file, what] of suite) {
    if (!existsSync(HERE + file)) { results.push(['MISS', file, what]); missing++; continue; }
    const r = spawnSync(process.execPath, [file], { cwd: HERE, encoding: 'utf8', timeout: 600000 });
    const out = (r.stdout || '') + (r.stderr || '');
    const bad = r.status !== 0 || /FAIL|UNSAFE|\bERROR\b/.test(out);
    if (bad) { failed++; results.push(['FAIL', file, what, out]); }
    else results.push(['ok', file, what]);
}

console.log('');
for (const [status, file, what, out] of results) {
    console.log(`  ${status.padEnd(4)} ${file.padEnd(26)} ${what}`);
    if (out) console.log(out.split('\n').filter(Boolean).slice(-12).map(l => '         ' + l).join('\n'));
}

console.log('');
if (failed || missing) {
    console.log(`${failed} failing, ${missing} missing, of ${suite.length} harnesses.`);
    if (!withEpubs) console.log('(EPUB corpus harnesses not run — pass --with-epubs.)');
    process.exitCode = 1;
} else {
    console.log(`ALL ${suite.length} HARNESSES PASS.`);
    if (!withEpubs) console.log('EPUB corpus harnesses not run — pass --with-epubs for those.');
}
