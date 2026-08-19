// audit-versions.mjs v1.1.0 — Round 15 (Sholes's successor).
//
// v1.1.0 — Added game.html, learn.html, session-log.js, stats-wal.js and hud.js
// to SOURCES, closing a gap against versions.js that had existed since each of
// those was added there — this file's own header says it's a mirror and must be
// kept in sync, and it hadn't been for three modules. Caught while adding the
// two new html entries for the version-footer redesign.
//
// Runs versions.js's OWN checks — runtime constant vs header comment, the 60-line
// header budget, the 6-entry budget, and entry ordering — against the files on
// disk, so drift is caught without deploying and opening a browser.
//
//   node audit-versions.mjs [path-to-repo]     # defaults to .
//
// ⚠️ THIS IS A MIRROR, NOT A SECOND SOURCE OF TRUTH. SOURCES, HEADER_EXEMPT and
// the two budget numbers below are copied from versions.js. If you change them
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

const ROOT = process.argv[2] || '.';

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
    { file: 'variety-floor.js',      pattern: /\bexport\s+const\s+VARIETY_FLOOR_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'versions.js',           pattern: /\bexport\s+const\s+VERSIONS_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'style.css',             pattern: /style\.css\s+v([0-9][^\s*]*)/ },
    { file: 'adventure.css',         pattern: /adventure\.css\s+v([0-9][^\s*]*)/ },
    { file: 'game.html',             pattern: /game\.html\s+v([0-9][^\s\->]*)/ },
    { file: 'learn.html',            pattern: /learn\.html\s+v([0-9][^\s\->]*)/ },
];
const HEADER_EXEMPT = ['style.css', 'adventure.css', 'game.html', 'learn.html'];
const HEADER_MAX_LINES = 60;
const HEADER_MAX_ENTRIES = 6;

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
        if (n > HEADER_MAX_LINES) flags.push(`header is ${n} lines (budget ${HEADER_MAX_LINES})`);
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
