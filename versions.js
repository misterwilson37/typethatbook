// versions.js v1.13.0 — reads every file's version constant out of the files as
// actually deployed, so index.html can show a full build list.
//
// v1.13.0 — ⚠️⚠️ THE BUILD PANEL NO LONGER ANSWERS FROM A COPY IT TOOK AT PAGE
//           LOAD. The sessionStorage cache is replaced by module state with a
//           60-second TTL. Module state dies with the page, which is the
//           lifetime the old comment already CLAIMED ("the tab's lifetime" was
//           what it said and what it meant was "this page load"); the TTL is
//           what saves a Chromebook tab left open for a week. ⚠️ A DEPLOY
//           INSTRUMENT MAY BE CHEAP OR IT MAY BE CACHED, NOT BOTH — this one is
//           read exactly when someone doubts what is running, which is exactly
//           when a remembered answer is the wrong one. HANDOFF §0.-22.
//
// v1.12.0 — ⚠️⚠️ THE ⚠ NOTES ARE STAFF-ONLY NOW, AND THE DEFAULT IS OFF.
//           renderBuildList(results, { notes }) — omit the option and you get
//           NO notes. That direction is deliberate: this function has three
//           call sites on three student-reachable surfaces (game.js, learn.js,
//           index.html), so a caller that forgets the flag must fail toward
//           silence, not toward a child reading "40 version entries (budget 6)"
//           over their book. §0.-13.E's twin problem, defused by making the
//           unsafe state the one you have to ASK for.
//           ⚠️ IT DOES NOT GO SILENT — renderHiddenNotesLine(n) prints "n build
//           notes — sign in as staff" and every caller ends with it. THAT IS
//           LOAD-BEARING: Jake troubleshoots at a student's machine while
//           signed in as nobody, and a panel that looked CLEAN when something
//           was wrong would be a diagnostic that lies — the exact failure
//           direction §0.-14.C is about. Hidden is fine. Absent is not.
//           ⚠️ countBuildNotes(results) exists so a caller can add its own
//           notes (game.js's renderer-drift line) to the same count.
//
// v1.11.0 — SOURCES gained settings-panel.js (ROADMAP 0b). ⚠️ The D2 ratchet
//           added in Round 27 caught this omission on the first test run after
//           the module was created, which is what it is for.
//
// v1.10.0 — SOURCES gained drill-filter.js, celebrate.js and receipt.js:
//           three modules game.js and learn.js import, which the footer could
//           not report because nobody added them here when they were extracted.
//           ⚠️ tests/version-stamp-test.mjs D2 now reads the writers' imports
//           and FAILS if a module they load is missing from this list, so the
//           next extraction cannot repeat it. ROADMAP 9b; HANDOFF §0.-15.
//           ⚠️ Cost: three more static-file fetches on a footer hover, ~38 KB
//           against the 684 KB game.js and learn.js already pull, cached per
//           tab in sessionStorage. NOT Firestore reads — nothing here is billed
//           per operation.
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
// result is cached. A student who never opens it pays nothing.
//
// ⚠️⚠️ v1.13.0 — THE CACHE USED TO BE sessionStorage AND THAT MADE THE
// INSTRUMENT LIE. sessionStorage SURVIVES A RELOAD — including a hard reload —
// and is only fresh in a NEW TAB. So the one question this panel exists to
// answer, "what is running right now?", was answered from a copy taken at first
// page load and never revisited. Jake, 2026-08-23: *"Force refreshing is not
// refreshing everything. I have to close the tab and open a new one."* That was
// the panel, not his browser and not the files. See HANDOFF §0.-22.

// v1.9.0 — registers daylog.js, the FIFTH module game.js and learn.js both
// import — and the one whose staleness is worst. A cached copy of it reads the
// wrong seven documents, on both pages, and the symptom is a student seeing a
// number that is merely WRONG rather than obviously broken. HANDOFF §0.0.
//
// v1.8.0 — registers update-gate.js. It is NOT imported by game.js or learn.js
// — it loads from its own script tag in each shell — which is exactly why it
// needs to be here: nothing else on the page would reveal that it failed to
// load. A silently absent update gate looks identical to a working one right up
// until a deploy doesn't reach the building.
//
// v1.7.0 — registers game.html and learn.html, and exports readOneDeployedVersion()
// so a page can read its OWN entry (and only its own entry) without paying for
// the full SOURCES fetch. Built for the game.html/learn.html footer redesign:
// each page shows its own html/js/css triad immediately (three small, targeted
// fetches — game.html is ~2KB, not the 210KB fetching game.js from outside it
// would cost) and defers the full cross-file list to the SAME lazy
// readDeployedVersions() index.html's build panel already uses, on first hover.
// ⚠️ game.html and learn.html carry their version the same way style.css does —
// a comment near the top, because they are markup shells with no runtime JS of
// their own to hold a constant. HEADER_EXEMPT covers them for the same reason
// it covers the stylesheets: there is no second (constant) copy to drift from.
//
// v1.6.0 — registers hud.js, the FOURTH shared module. Same reasoning as v1.5.0.
//
//
//
// ⚠️ v1.12.0 — v1.4.0's entry moved to CHANGELOG.md § ARCHIVED FILE HEADERS.
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
    { file: 'hud.js',                pattern: /\bexport\s+const\s+HUD_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'variety-floor.js',      pattern: /\bexport\s+const\s+VARIETY_FLOOR_VERSION\s*=\s*["']([^"']+)["']/ },
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
    { file: 'settings-panel.js',     pattern: /\bexport\s+const\s+SETTINGS_PANEL_VERSION\s*=\s*["']([^"']+)["']/ },
    // Stylesheets carry theirs in a comment on line 1 as well as in a
    // body::before / body::after stamp. The comment is what we parse here,
    // because a page that doesn't load the stylesheet can still report it.
    { file: 'style.css',             pattern: /style\.css\s+v([0-9][^\s*]*)/ },
    { file: 'adventure.css',         pattern: /adventure\.css\s+v([0-9][^\s*]*)/ },
    // Markup shells, versioned the same way the stylesheets are: a comment near
    // the top, because there is no runtime JS in either file to hold a constant.
    { file: 'game.html',             pattern: /game\.html\s+v([0-9][^\s\->]*)/ },
    { file: 'learn.html',            pattern: /learn\.html\s+v([0-9][^\s\->]*)/ },
];

export const VERSIONS_VERSION = '1.13.0';

// ⚠️ v1.13.0 — THE OLD sessionStorage KEY, KEPT ONLY TO BE CLEARED. A tab that
// loaded v1.12.0 or earlier has a stale build list sitting in sessionStorage
// under this key; nothing reads it any more, but leaving it there means a
// future reader finds a plausible-looking cache and wonders what writes it.
// Cleared once at module load, then the name can go.
const LEGACY_CACHE_KEY = 'ttb_buildVersions_v3';
try { sessionStorage.removeItem(LEGACY_CACHE_KEY); } catch (_) {}

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
const HEADER_EXEMPT = ['style.css', 'adventure.css', 'game.html', 'learn.html'];

// v1.3.0 — HEADER BUDGET.  ⚠️ REVISED IN v1.12.0 — READ THE BLOCK BELOW.
//
// Headers grew unbounded: game.js reached 122 lines and 18 version entries, and
// its entries had drifted OUT OF ORDER because each session's edit anchored on
// the previous newest one and landed a slot too deep. Nobody catches either by
// reading, because nobody reads a 122-line comment.
//
// Violations are reported in the build panel, which is the only place a check
// can run without a CLI.
//
// ═══════════════════════════════════════════════════════════════════════════
// v1.12.0 — ⚠️⚠️ THE TWO BUDGETS MEASURE DIFFERENT THINGS AND ONLY ONE SCALES.
// ═══════════════════════════════════════════════════════════════════════════
//
// The flat 60/6 pair had FOURTEEN outstanding violations and had been printing
// them into a student-facing panel for weeks. Fourteen standing violations is
// not fourteen problems; it is a budget that was wrong. But they were wrong in
// two DIFFERENT ways, and collapsing them would have thrown away the useful
// half.
//
// ⚠️ LINES ARE PROPORTIONAL, ON JAKE'S RULING (2026-08-22): "if the code itself
// expands, the line limit should, too." A 20-line module documented in 32 lines
// and an 8,000-line module documented in 400 are not the same fact, and a flat
// number called both of them the same violation. The budget is now a FLOOR plus
// a share of the body:
//
//     budget = max(HEADER_FLOOR_LINES, ceil(bodyLines * HEADER_LINES_RATIO))
//
// The floor is what protects the doc-dense small modules — drill-filter.js is
// 191 header lines over 105 lines of code and that is CORRECT, because in that
// module the policy IS the product and the code is the easy part. The ratio is
// what keeps the ratchet: a header can outgrow the floor only by earning it.
//
// ⚠️ ENTRIES ARE NOT PROPORTIONAL AND MUST NOT BECOME SO. This is the budget
// that caught something real — game.js was at 40 entries, learn.js at 46, and
// both had entries out of order because nobody scrolls to the bottom of a
// changelog to file a new one correctly. That failure does not get better
// because the file got bigger; it gets WORSE. 6 was too tight to be obeyed and
// so was ignored; 8 is a round's worth of work plus room. CHANGELOG.md is the
// overflow and has a § ARCHIVED FILE HEADERS section for exactly this.
//
// ⚠️ IF YOU COME HERE TO RAISE A NUMBER BECAUSE SOMETHING IS FAILING, RAISE THE
// LINE FLOOR, NOT THE ENTRY COUNT. The line budget is a guess about how much
// rationale a module deserves and guesses get revised. The entry budget is a
// claim about how a person reads, and that has not changed since Round 14.
const HEADER_FLOOR_LINES  = 220;
const HEADER_LINES_RATIO  = 0.08;
const HEADER_MAX_ENTRIES  = 8;

function headerLineBudget(bodyLines) {
    return Math.max(HEADER_FLOOR_LINES, Math.ceil(bodyLines * HEADER_LINES_RATIO));
}

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

    // ⚠️ THE BUDGET IS MEASURED AGAINST THE BODY, NOT THE WHOLE FILE. Measuring
    // against the total would let a header fund itself: add 100 lines of header,
    // earn 8 more lines of header, forever. `bodyLines` excludes the header, so
    // only real code buys room.
    const bodyLines = lines.length - n;
    const budget = headerLineBudget(bodyLines);

    const problems = [];
    if (n > budget)
        problems.push('header is ' + n + ' lines (budget ' + budget +
                      ' for ' + bodyLines + ' lines of code)');
    if (entries.length > HEADER_MAX_ENTRIES)
        problems.push(entries.length + ' version entries (budget ' + HEADER_MAX_ENTRIES +
                      ') \u2014 move the rest to CHANGELOG.md');
    if (!ordered)
        problems.push('version entries out of order: ' + entries.join(' '));

    return { lines: n, entries: entries.length, ordered, budget, bodyLines, problems };
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

// Read ONE file's deployed version — for a page that only wants its own
// html/js/css triad up front, without paying for every other file in SOURCES.
// Same readOne(), same no-throw guarantee, just not fanned out over
// Promise.all(). Not cached — callers hold three of these in module state for
// the tab's lifetime, which is cheaper than a sessionStorage round trip.
export async function readOneDeployedVersion(file) {
    const entry = SOURCES.find(s => s.file === file);
    if (!entry) return { file, version: null, note: 'not in SOURCES' };
    return readOne(entry);
}

// Read every file's deployed version. Cached per tab.
// How long a read stays good. Short enough that a second look after a deploy
// tells the truth; long enough that opening the panel three times in a row does
// not re-fetch ~600KB of source on a school connection.
//
// ⚠️ THIS IS THE WHOLE FRESHNESS POLICY AND IT LIVES HERE, IN ONE PLACE. The
// three callers used to each keep their own "already loaded" flag on top of this
// cache, so there were four layers deciding staleness and none of them owned it.
// A caller that wants a guaranteed-fresh read passes { force: true }; everything
// else just calls and lets this decide.
export const BUILD_READ_TTL_MS = 60_000;

// ⚠️⚠️ MODULE STATE, NOT sessionStorage, AND THE DIFFERENCE IS THE BUG.
// sessionStorage survives a reload and a hard reload, and clears only in a new
// tab — so a stale read outlived every refresh a person would try. Module state
// dies when the page does, which is the lifetime this cache was always described
// as having. ⚠️ DO NOT MOVE IT BACK TO ANY STORAGE THAT OUTLIVES A PAGE LOAD.
let _buildCache = null;
let _buildCacheAt = 0;
let _buildInFlight = null;

export async function readDeployedVersions({ force = false } = {}) {
    const fresh = _buildCache && (Date.now() - _buildCacheAt) < BUILD_READ_TTL_MS;
    if (!force && fresh) return _buildCache;
    // Coalesce concurrent callers. ⚠️ VALID HERE AND NOT ALWAYS: learn.js v2.3.0
    // records a real defect from sharing an in-flight promise between callers
    // with DIFFERENT credentials. These fetches are unauthenticated static reads,
    // so every caller is genuinely interchangeable.
    if (_buildInFlight) return _buildInFlight;
    _buildInFlight = Promise.all(SOURCES.map(readOne))
        .then(results => {
            _buildCache = results;
            _buildCacheAt = Date.now();
            return results;
        })
        .finally(() => { _buildInFlight = null; });
    return _buildInFlight;
}

// Exported for the harness: proves the cache is expiring rather than merely
// appearing to. Not for production callers — pass { force: true } instead.
export function _resetBuildCacheForTest() {
    _buildCache = null; _buildCacheAt = 0; _buildInFlight = null;
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

// v1.12.0 — Every ⚠ note one file can produce, as data rather than as HTML
// glued onto a row. Pulled out so the same list can be COUNTED without being
// SHOWN, which is what makes the staff gate honest instead of just quiet.
//
// ⚠️ ORDER MATTERS TO A READER, NOT TO THE CODE: staleness first (it describes
// THIS MACHINE RIGHT NOW and is the reason anyone opened the panel), then
// stamp drift, then header hygiene (identical on every machine in the
// building, and the only category a student was ever going to see).
function collectNotes(r) {
    const notes = [];

    const pseudo = r.file === 'style.css' ? '::before'
                 : r.file === 'adventure.css' ? '::after' : null;
    if (pseudo && r.version) {
        const applied = readAppliedCssVersion(pseudo);
        if (applied && applied !== r.version) {
            notes.push({ color: '#c62828',
                         text: `browser is applying v${applied} — stale cached ` +
                               `stylesheet, hard-reload` });
        }
    }
    if (r.header && r.version && r.header !== r.version) {
        notes.push({ color: '#e65100',
                     text: `header comment says v${r.header} — one of the two is a lie` });
    }
    if (r.audit && r.audit.problems.length) {
        for (const p of r.audit.problems) notes.push({ color: '#c62828', text: p });
    }
    return notes;
}

// How many ⚠ notes this build would produce. Exported so a caller that adds
// notes of its own (game.js's renderer-drift check) can report ONE total
// instead of two partial ones.
export function countBuildNotes(results) {
    return results.reduce((n, r) => n + collectNotes(r).length, 0);
}

// The line that keeps a gated panel from lying. `n` is the TOTAL — the caller's
// own notes included. Returns '' for zero, so a clean build says nothing.
//
// ⚠️ DO NOT MAKE THIS ALARMING. It is read most often by a child who has
// hovered the footer by accident and can do nothing about any of it. Grey,
// lowercase, no ⚠.
export function renderHiddenNotesLine(n) {
    if (!n) return '';
    return `<div class="build-note-hidden">${n} build note${n === 1 ? '' : 's'}` +
           ` — sign in as staff to read ${n === 1 ? 'it' : 'them'}.</div>`;
}

// Render the build list as HTML.
//
// ⚠️ `notes` DEFAULTS TO FALSE ON PURPOSE — see the v1.12.0 header entry. A
// caller that forgets the option shows a student a clean list of file versions,
// which is harmless. The opposite default put header-budget scolding on top of
// a nine-year-old's book.
export function renderBuildList(results, { notes = false } = {}) {
    const rows = results.map(r => {
        if (!r.version) {
            return `<div style="color:#c05621">${r.file} — could not read (${r.note})</div>`;
        }
        let line = `<div><span style="opacity:.6">${r.file}</span> v${r.version}`;
        if (notes) {
            for (const nt of collectNotes(r)) {
                line += `<span class="build-note" style="color:${nt.color}">` +
                        `\u26a0 ${nt.text}</span>`;
            }
        }
        return line + `</div>`;
    });
    return rows.join('');
}
