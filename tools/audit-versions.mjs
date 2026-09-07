// audit-versions.mjs v1.6.0 — Round 15 (Sholes's successor), Round 17 (Linotype),
// Round 27 (Chicago), Round 28 (Daugherty), Round 58 (Emerson), Round 81 (Fox).
//
// v1.6.0 — ⚠️⚠️ ROADMAP 57: index.html registered, and HEADER_EXEMPT CORRECTED
//          against the harness's copy, which had been right while this one was
//          wrong since Round 27. See the long note above the list. ⚠️ Nothing
//          compared the two exemption lists — section D compares the SOURCES
//          arrays and stops there. It compares both now.
//
// v1.5.0 — SOURCES mirrors versions.js v1.15.0: rights-ladder.js added. ⚠️ IT
//          HAD BEEN MISSING SINCE ROUND 57 SHIPPED THAT MODULE, so this tool
//          printed "0 problems" while one shipped file's stamp went unread —
//          verified by mutation before the fix (constant 9.9.9 against a
//          v1.0.0 header: 0 problems here, 1 failure in the harness).
//          ⚠️⚠️ THE REASON IT SURVIVED IS THE PART WORTH KEEPING. version-
//          stamp-test.mjs section D calls itself "the three mirrors agree" and
//          both of its loops ended at the HARNESS's list — nothing was ever
//          asserted INTO this file, so it could lose an entry silently. The
//          missing direction is added there now. A mirror needs a check
//          pointing AT it, not only away from it.
//
// v1.4.0 — MIRRORS versions.js v1.12.0's PROPORTIONAL HEADER BUDGET. The flat
//          60-line limit is replaced by max(220, 8% of the file's CODE lines),
//          and the entry budget goes 6 → 8. ⚠️ THE RATIO IS MEASURED AGAINST
//          THE BODY, NOT THE WHOLE FILE — a header measured against the total
//          would fund its own growth. Read the long block in versions.js for
//          why lines scale and entries deliberately do not.
//
// v1.3.0 — SOURCES mirrors versions.js v1.11.0: settings-panel.js added.
//
// v1.2.0 — SOURCES mirrors versions.js v1.10.0: drill-filter.js, celebrate.js
//          and receipt.js added. ⚠️ THIS TOOL IS NO LONGER THE ONLY OFFLINE
//          CHECK — tests/version-stamp-test.mjs runs the same comparison inside
//          `npm test`, because this one is a separate command and Round 26
//          shipped five lying stamps past it without ever running it.
//
// v1.1.1 — PATH ONLY. Moved from the repo root into tools/, so ROOT now defaults
//          to the parent directory rather than '.'. `npm run audit:versions` is
//          the entry point. No check changed.
//
// v1.1.0 — Added game.html, learn.html, session-log.js, stats-wal.js and hud.js
// to SOURCES, closing a gap against versions.js that had existed since each of
// those was added there — this file's own header says it's a mirror and must be
// kept in sync, and it hadn't been for three modules. Caught while adding the
// two new html entries for the version-footer redesign.
//
// Runs versions.js's OWN checks — runtime constant vs header comment, the
// proportional header-line budget, the 8-entry budget, and entry ordering —
// against the files on disk, so drift is caught without deploying and opening a browser.
//
//   node audit-versions.mjs [path-to-repo]     # defaults to .
//
// ⚠️ THIS IS A MIRROR, NOT A SECOND SOURCE OF TRUTH. SOURCES, HEADER_EXEMPT and
// the three budget numbers below are copied from versions.js. If you change them
// there, change them here — and if the two ever disagree, versions.js is the one
// that ships and therefore the one that is right. The reason to accept a copy at
// all is that versions.js FETCHES its files over HTTP for the build panel, which
// cannot work from a CLI, and the alternative (no offline check) is what let
// admin.js's header sit nine versions stale.
//
// ⚠️ AND IT CANNOT CATCH EVERYTHING. It compares what a file claims against what
// the same file claims elsewhere. It passed adventure-renderer.js in Round 5 while
// the constant read 1.1.0 and the code was 1.2.0, because the header agreed with
// the constant. Only a behavioural test told the truth there — map-geometry-test.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.argv[2] || fileURLToPath(new URL('../', import.meta.url));

const SOURCES = [
    { file: 'game.js',               pattern: /\bconst\s+VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'learn.js',              pattern: /\bconst\s+LEARN_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'keyboard.js',           pattern: /\bexport\s+const\s+KB_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'adventure-renderer.js', pattern: /\bexport\s+const\s+RENDERER_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'admin.js',              pattern: /\bconst\s+ADMIN_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'lessons-admin.js',      pattern: /window\.LESSONS_ADMIN_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'staff-admin.js',        pattern: /window\.STAFF_ADMIN_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'firebase-config.js',    pattern: /\bexport\s+const\s+CONFIG_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'stats-wal.js',          pattern: /\bexport\s+const\s+STATS_WAL_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'session-log.js',        pattern: /\bexport\s+const\s+SESSION_LOG_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'hud.js',                pattern: /\bexport\s+const\s+HUD_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'chapter-position.js',   pattern: /\bexport\s+const\s+CHAPTER_POSITION_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'variety-floor.js',      pattern: /\bexport\s+const\s+VARIETY_FLOOR_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'rights-ladder.js',      pattern: /\bexport\s+const\s+RIGHTS_LADDER_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'versions.js',           pattern: /\bexport\s+const\s+VERSIONS_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'update-gate.js',        pattern: /\bexport\s+const\s+UPDATE_GATE_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'daylog.js',             pattern: /\bexport\s+const\s+DAYLOG_VERSION\s*=\s*["']([^"']+)["']/ },
    // ⚠️ ROADMAP 9b, Round 27. Three modules extracted in Rounds 25–26 that the
    // footer could not see. celebrate.js and receipt.js had no constant at all
    // until this commit. ⚠️ THIS LIST IS MIRRORED IN tools/audit-versions.mjs
    // AND tests/version-stamp-test.mjs — section D of that harness FAILS if the
    // three ever disagree, so all three move together or none do.
    { file: 'drill-filter.js',       pattern: /\bexport\s+const\s+DRILL_FILTER_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'celebrate.js',          pattern: /\bexport\s+const\s+CELEBRATE_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'receipt.js',            pattern: /\bexport\s+const\s+RECEIPT_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'lesson-gate.js',        pattern: /\bexport\s+const\s+LESSON_GATE_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'run-grade.js',          pattern: /\bexport\s+const\s+RUN_GRADE_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'read-meter.js',         pattern: /\bexport\s+const\s+READ_METER_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'logdays.js',            pattern: /\bexport\s+const\s+LOGDAYS_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'settings-panel.js',     pattern: /\bexport\s+const\s+SETTINGS_PANEL_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'style.css',             pattern: /style\.css\s+v([0-9][^\s*]*)/ },
    { file: 'adventure.css',         pattern: /adventure\.css\s+v([0-9][^\s*]*)/ },
    { file: 'game.html',             pattern: /game\.html\s+v([0-9][^\s\->]*)/ },
    { file: 'learn.html',            pattern: /learn\.html\s+v([0-9][^\s\->]*)/ },
    { file: 'reports.html',          pattern: /reports\.html\s+v([0-9][^\s\->]*)/ },
    { file: 'admin.html',            pattern: /admin\.html\s+v([0-9][^\s\->]*)/ },
    // ⚠️ ROADMAP 57 — mirrors versions.js v1.17.0. Read that entry's comment
    // before touching the pattern: it is the runtime constant on purpose, and
    // the pattern the item suggested would have matched an incidental line.
    { file: 'index.html',            pattern: /\bconst\s+INDEX_VERSION\s*=\s*["']([^"']+)["']/ },
];
// ⚠️⚠️ THIS LIST DISAGREED WITH tests/version-stamp-test.mjs's COPY OF IT UNTIL
// ROUND 81, AND THE HARNESS'S WAS THE RIGHT ONE. It carried reports.html and
// admin.html; this one did not — so this tool believed it was header-checking
// two files it cannot header-check. leadingBlock() below only counts lines that
// are blank or start with `//`, and every .html file here opens with
// `<!DOCTYPE html>`, so n is 0 and the header comparison, the line budget and
// the entry-count check all silently do nothing on them. The checks were not
// skipped by decision, they were skipped by accident, which is the worse of the
// two — an exemption list is a CLAIM about what is watched.
// ⚠️ index.html is exempt for the same mechanical reason and NOT because it
// lacks a header: it has a real `//` version block, it just sits inside the
// <script> rather than at the top of the file, where leadingBlock() cannot
// reach it. ⚠️⚠️ ROADMAP 57 SAID EXPLICITLY THAT index.html "should NOT be
// exempt". That instruction was written without checking this function, and
// following it would have produced a check that reads an empty block and passes
// forever. The coverage it was asking for is real and it is in
// tests/version-stamp-test.mjs section A2, which finds the block by the
// constant it sits above instead of by position in the file.
const HEADER_EXEMPT = ['style.css', 'adventure.css', 'game.html', 'learn.html',
                       'reports.html', 'admin.html', 'index.html'];
// ⚠️ MIRRORS versions.js v1.12.0. Change there first; these three are the copy.
const HEADER_FLOOR_LINES = 220;
const HEADER_LINES_RATIO = 0.08;
const HEADER_MAX_ENTRIES = 8;
const headerLineBudget = body =>
    Math.max(HEADER_FLOOR_LINES, Math.ceil(body * HEADER_LINES_RATIO));

function cmpSemver(a, b) {
    const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (pa[i] || 0) - (pb[i] || 0);
        if (d) return d;
    }
    return 0;
}

function leadingBlock(text) {
    const lines = text.split('\n');
    let n = 0;
    for (const line of lines) {
        const t = line.trim();
        if (t === '' || t.startsWith('//')) n++; else break;
    }
    return { n, block: lines.slice(0, n) };
}

let problems = 0;
for (const { file, pattern } of SOURCES) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) { console.log(`MISSING  ${file}`); problems++; continue; }
    const text = fs.readFileSync(p, 'utf8');
    const m = text.match(pattern);
    const version = m ? m[1] : null;
    let out = `${file.padEnd(24)} v${version ?? '??'}`;
    const flags = [];
    if (!version) flags.push('constant not found');
    if (!HEADER_EXEMPT.includes(file)) {
        const { n, block } = leadingBlock(text);
        const hm = block.join('\n').match(/\bv(\d+\.\d+\.\d+)\b/);
        const header = hm ? hm[1] : null;
        if (header && version && header !== version)
            flags.push(`header comment says v${header} — one of the two is a lie`);
        const bodyLines = text.split('\n').length - n;
        const budget = headerLineBudget(bodyLines);
        if (n > budget)
            flags.push(`header is ${n} lines (budget ${budget} for ${bodyLines} lines of code)`);
        const entries = block
            .map(l => (l.trim().match(/^\/\/\s*v(\d+\.\d+(?:\.\d+)?)\s*[-\u2014]/) || [])[1])
            .filter(Boolean);
        if (entries.length > HEADER_MAX_ENTRIES)
            flags.push(`${entries.length} version entries (budget ${HEADER_MAX_ENTRIES})`);
        const ordered = entries.every((v, i) => i === 0 || cmpSemver(entries[i - 1], v) >= 0);
        if (!ordered) flags.push('version entries out of order: ' + entries.join(' '));
    }
    if (flags.length) { problems += flags.length; out += '\n' + flags.map(f => '    !! ' + f).join('\n'); }
    console.log(out);
}
console.log(`\n${problems} problem(s)`);
