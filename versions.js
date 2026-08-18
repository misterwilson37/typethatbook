// versions.js v1.5.0 — reads every file's version constant out of the files as
// actually deployed, so index.html can show a full build list.
//
// WHY IT WORKS THIS WAY
//
// The intent was always "a constant in each file, pulled into index so index
// doesn't need touching." Right intent. The obvious mechanism doesn't work:
// index.html is the Library page and can't `import { VERSION } from './game.js'`
// — game.js is a page controller with module-level side effects (it sets
// window.onload = init and registers document listeners), so importing it just
// to read a string would try to boot the typing game on the library page.
//
// The tempting alternative is a manifest — one file listing every version, which
// everything imports. Rejected on purpose. If game.js read its version from a
// manifest, a STALE CACHED game.js would report the NEW version while running
// OLD code. It would lie in precisely the situation you'd be using it to
// diagnose. A constant that lives in the file it describes cannot lie about
// itself, and that property is the whole point.
//
// So: fetch each file as text and parse its constant. No imports, no execution,
// no second source of truth. Update the constant in game.js and index reflects
// it, with nothing else to remember.
//
// COST: this fetches the raw .js files (game.js is ~210KB). That's why it is
// LAZY — nothing is requested until the build banner is expanded — and why the
// result is cached in sessionStorage for the tab's lifetime. A student who never
// opens it pays nothing.

// v1.5.0 — registers session-log.js, the THIRD module game.js and learn.js both
// import. The warning below applied to stats-wal.js and applies here twice over:
// this one is the only writer of typing_sessions on either page, so a stale
// cached copy takes out the teacher's entire drill-down — on both pages at once,
// with the build panel showing three correct version numbers and no sign of the
// fourth.
//
// v1.4.0 — registers stats-wal.js, the second module game.js and learn.js both
// import. ⚠️ A shared module that is not in this list is the worst kind to have
// stale: a cached copy of it misbehaves on BOTH pages at once, and the build
// panel would show two files at their correct versions and no sign of the third.
//
// Explicit patterns rather than one clever regex, so an unexpected match is
// impossible and adding a file is obvious.
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
    { file: 'versions.js',           pattern: /\bexport\s+const\s+VERSIONS_VERSION\s*=\s*["']([^"']+)["']/ },
    // Stylesheets carry theirs in a comment on line 1 as well as in a
    // body::before / body::after stamp. The comment is what we parse here,
    // because a page that doesn't load the stylesheet can still report it.
    { file: 'style.css',             pattern: /style\.css\s+v([0-9][^\s*]*)/ },
    { file: 'adventure.css',         pattern: /adventure\.css\s+v([0-9][^\s*]*)/ },
];

export const VERSIONS_VERSION = '1.5.0';

const CACHE_KEY = 'ttb_buildVersions_v3';   // v3: entries gained header budget fields

// v1.2.0 — HEADER-COMMENT DRIFT DETECTION.
//
// Every JS file carries its version twice: a runtime constant (which is what
// actually renders) and a version in the header comment block (which is what a
// human reads first). They are supposed to agree and they kept not agreeing —
// admin.js sat at header v2.7.5 while the constant said 3.6.0, nine minor
// versions adrift, and that is exactly the class of mistake that made a deploy
// silently report the wrong number (HANDOFF §6, ball-drop 5).
//
// Keeping them in sync was previously a discipline problem. Now it's a detected
// one: the build panel says so.
//
// The convention this relies on is that the FIRST v<semver> appearing inside the
// leading comment block is the file's current version — true whether the header
// is `// admin.js v3.6.0` or a newest-first changelog like game.js's. Stylesheets
// are exempt: their comment IS the source of truth, there's no second copy.
const HEADER_EXEMPT = ['style.css', 'adventure.css'];

// v1.3.0 — HEADER BUDGET.
//
// Headers grew unbounded: game.js reached 122 lines and 18 version entries, and
// its entries had drifted OUT OF ORDER because each session's edit anchored on
// the previous newest one and landed a slot too deep. Nobody catches either by
// reading, because nobody reads a 122-line comment.
//
// Budget: 60 lines and 6 version entries per header, newest first. Everything
// older lives in CHANGELOG.md. Violations are reported in index.html's build
// panel, which is the only place a check can run without a CLI.
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

// Returns { lines, entries, ordered, problems[] } for the leading // block.
function auditHeader(file, text) {
    if (HEADER_EXEMPT.includes(file)) return null;
    const lines = text.split('\n');
    let n = 0;
    for (const line of lines) {
        const t = line.trim();
        if (t === '' || t.startsWith('//')) n++; else break;
    }
    const block = lines.slice(0, n);

    // A version ENTRY is a line that OPENS a changelog item. Version numbers
    // mentioned inside an entry's prose must not count, or a well-written
    // header reads as a violation.
    const entries = block
        .map(l => (l.trim().match(/^\/\/\s*v(\d+\.\d+(?:\.\d+)?)\s*[-\u2014]/) || [])[1])
        .filter(Boolean);

    const ordered = entries.every((v, i) => i === 0 || cmpSemver(entries[i - 1], v) >= 0);

    const problems = [];
    if (n > HEADER_MAX_LINES)
        problems.push('header is ' + n + ' lines (budget ' + HEADER_MAX_LINES + ')');
    if (entries.length > HEADER_MAX_ENTRIES)
        problems.push(entries.length + ' version entries (budget ' + HEADER_MAX_ENTRIES +
                      ') \u2014 move the rest to CHANGELOG.md');
    if (!ordered)
        problems.push('version entries out of order: ' + entries.join(' '));

    return { lines: n, entries: entries.length, ordered, problems };
}

function readHeaderVersion(file, text) {
    if (HEADER_EXEMPT.includes(file)) return null;
    // Only look at the leading run of // comment lines, so a version number
    // mentioned in code or in a mid-file comment can't be mistaken for it.
    const lines = text.split('\n');
    let block = '';
    for (const line of lines) {
        const t = line.trim();
        if (t === '' || t.startsWith('//')) { block += t + '\n'; continue; }
        break;
    }
    const m = block.match(/\bv(\d+\.\d+\.\d+)\b/);
    return m ? m[1] : null;
}

// Fetch one file and pull its version out. Never throws.
async function readOne({ file, pattern }) {
    try {
        // cache: 'no-cache' revalidates rather than trusting a stale copy —
        // reporting a cached version number would defeat the purpose.
        const res = await fetch(file, { cache: 'no-cache' });
        if (!res.ok) return { file, version: null, note: 'HTTP ' + res.status };
        const text = await res.text();
        const m = text.match(pattern);
        if (!m) return { file, version: null, note: 'constant not found' };
        return { file, version: m[1],
                 header: readHeaderVersion(file, text),
                 audit: auditHeader(file, text) };
    } catch (e) {
        return { file, version: null, note: 'fetch failed' };
    }
}

// Read every file's deployed version. Cached per tab.
export async function readDeployedVersions({ force = false } = {}) {
    if (!force) {
        try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (_) { /* fall through */ }
    }
    const results = await Promise.all(SOURCES.map(readOne));
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(results)); } catch (_) {}
    return results;
}

// Read a stylesheet's version from its body::before / body::after stamp. This is
// the version of the CSS the browser has ACTUALLY APPLIED, which can differ from
// the file on the server if a stale copy is cached — worth surfacing separately.
export function readAppliedCssVersion(pseudo) {
    try {
        const raw = getComputedStyle(document.body, pseudo).content;
        const cleaned = raw.replace(/^["']|["']$/g, '').replace(/\\/g, '').replace(/^v/, '');
        return cleaned && cleaned !== 'none' ? cleaned : null;
    } catch (e) { return null; }
}

// Render the build list as HTML. Flags anything it couldn't read, and flags a
// stylesheet whose applied version disagrees with the deployed file.
export function renderBuildList(results) {
    const rows = results.map(r => {
        if (!r.version) {
            return `<div style="color:#ff8a65">${r.file} — could not read (${r.note})</div>`;
        }
        let line = `<div><span style="opacity:.6">${r.file}</span> v${r.version}`;
        // Runtime constant vs header comment. The constant wins — it's what
        // renders — so the header is what's reported as wrong.
        if (r.audit && r.audit.problems.length) {
            line += r.audit.problems.map(p =>
                ' <span style="color:#ff5252">\u26a0 ' + p + '</span>').join('');
        }
        if (r.header && r.header !== r.version) {
            line += ` <span style="color:#ffb74d">⚠ header comment says v${r.header}` +
                    ` — one of the two is a lie</span>`;
        }
        const pseudo = r.file === 'style.css' ? '::before'
                     : r.file === 'adventure.css' ? '::after' : null;
        if (pseudo) {
            const applied = readAppliedCssVersion(pseudo);
            if (applied && applied !== r.version) {
                line += ` <span style="color:#ff5252">⚠ browser is applying v${applied}` +
                        ` — stale cached stylesheet, hard-reload</span>`;
            }
        }
        return line + `</div>`;
    });
    return rows.join('');
}
