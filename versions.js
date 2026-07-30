// versions.js v1.0.0 — reads every file's version constant out of the files as
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
    { file: 'versions.js',           pattern: /\bexport\s+const\s+VERSIONS_VERSION\s*=\s*["']([^"']+)["']/ },
    // Stylesheets carry theirs in a comment on line 1 as well as in a
    // body::before / body::after stamp. The comment is what we parse here,
    // because a page that doesn't load the stylesheet can still report it.
    { file: 'style.css',             pattern: /style\.css\s+v([0-9][^\s*]*)/ },
    { file: 'adventure.css',         pattern: /adventure\.css\s+v([0-9][^\s*]*)/ },
];

export const VERSIONS_VERSION = '1.1.0';

const CACHE_KEY = 'ttb_buildVersions_v1';

// Fetch one file and pull its version out. Never throws.
async function readOne({ file, pattern }) {
    try {
        // cache: 'no-cache' revalidates rather than trusting a stale copy —
        // reporting a cached version number would defeat the purpose.
        const res = await fetch(file, { cache: 'no-cache' });
        if (!res.ok) return { file, version: null, note: 'HTTP ' + res.status };
        const text = await res.text();
        const m = text.match(pattern);
        return m ? { file, version: m[1] }
                 : { file, version: null, note: 'constant not found' };
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
