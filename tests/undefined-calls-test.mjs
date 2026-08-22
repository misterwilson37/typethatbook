// undefined-calls-test.mjs v1.3.1 — Round 6 (Noiseless).
//
// v1.3.1 — PATH ONLY, Round 17 (Linotype). This file moved from the repo root
//          into tests/, so every source it reads is now `../` rather than `./`.
//          No assertion, threshold or expectation changed.
//
// v1.2.0 — Also checks inline <script> blocks in the HTML pages. v1.0.0/v1.1.0 read
//          only the .js files and thereby skipped ~1,750 lines, 795 of them in
//          index.html — the library, and the first page a student loads.
//
// v1.1.0 — Checks every identifier REFERENCE, not just call callees. v1.0.0 missed
//          the one that mattered most. See the note above walk.ancestor below.
//
// WHY THIS EXISTS
//
// learn.js shipped `if (!currentStep) { finishLesson(); return; }` and there was
// no finishLesson() in the file, or anywhere in the repo. It sat in the one branch
// of beginStep() that exists to handle an out-of-range run index, so it only fired
// in the situation it was written to rescue — and when it did it threw a
// ReferenceError, abandoning beginStep() before the intro was hidden or the
// keyboard was wired. The student got a dead screen and no record was written.
//
// Nobody catches that by reading. A grep for "finishLesson" finds one hit and it
// looks like a call to something real. The only way to see it is to ask, for every
// identifier the file CALLS, whether anything declares it — which is a question a
// parser can answer in a second and a person cannot answer at all.
//
// So: parse each file, walk every scope, and report calls to identifiers that are
// neither declared in the file, nor imported into it, nor a host/JS global. This
// is scope-aware on purpose. An earlier regex version of this check reported ~20
// false positives per file — "opened(" out of a comment, "rgba(" out of a template
// literal — and a check that cries wolf twenty times gets ignored, which is the
// same as not having it.
//
// HOW TO RUN
//
//   npm install --no-save acorn acorn-walk
//   node undefined-calls-test.mjs
//
// Add a file to FILES below when a new one appears. Add a genuine host global to
// EXTRA_GLOBALS — but read the failure first, because the last time one of these
// looked like a missing global it was a missing function.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const FILES = [
    'game.js', 'learn.js', 'admin.js', 'adventure-renderer.js',
    'keyboard.js', 'lessons-admin.js', 'staff-admin.js', 'versions.js',
    'firebase-config.js',
    // ⚠️ Added in Round 13. The shared modules were never in this list — see the
    // note in run-all-tests.mjs. hud.js, session-log.js and stats-wal.js are
    // imported by both page controllers.
    'stats-wal.js', 'session-log.js', 'hud.js',
    // ⚠️ Added Round 16. The fifth shared module — see variety-floor.js's header.
    'variety-floor.js',
    // ⚠️ Added Round 27. Three modules extracted in Rounds 25–26 and one in 27,
    // none of which this audit knew about — so a typo in any of them would have
    // reached a classroom unparsed. `drill-filter.js` and `celebrate.js` and
    // `receipt.js` are imported by the writers; `settings-panel.js` is ROADMAP
    // 0b. **If you extract a module, add it here in the same commit.**
    'drill-filter.js', 'celebrate.js', 'receipt.js', 'settings-panel.js',
];

// ⚠️ HTML PAGES TOO (v1.2.0). v1.0.0 and v1.1.0 checked only the .js files and so
// skipped ~1,750 lines of inline module script — including 795 lines in index.html,
// which is the library and the FIRST page a student loads. Two undeclared-identifier
// bugs had already been found in the .js files; there was no reason to assume the
// inline scripts were cleaner, and every reason to check the student-facing one.
const HTML_FILES = [
    'index.html', 'game.html', 'learn.html', 'admin.html', 'reports.html', 'appcheck.html',
];

// Pull every non-empty inline <script> body out of an HTML file, tracking the line
// each block starts on so reported line numbers point into the real file.
function inlineScripts(html) {
    const out = [];
    const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const attrs = m[1] || '';
        const body = m[2] || '';
        if (/\bsrc\s*=/i.test(attrs)) continue;   // external file, checked elsewhere
        if (!body.trim()) continue;
        const before = html.slice(0, m.index + m[0].indexOf(body));
        out.push({ body, startLine: before.split('\n').length });
    }
    return out;
}

// Globals the browser or the language provides. Deliberately explicit: an
// allowlist that is easy to read is one whose additions get questioned.
const GLOBALS = new Set(`
    undefined NaN Infinity arguments
    globalThis window document navigator location history screen performance crypto
    localStorage sessionStorage indexedDB caches
    console alert confirm prompt fetch setTimeout clearTimeout setInterval
    clearInterval requestAnimationFrame cancelAnimationFrame queueMicrotask
    structuredClone getComputedStyle matchMedia scrollTo scrollBy requestIdleCallback
    Object Array String Number Boolean Symbol BigInt Function Math JSON Date RegExp
    Error TypeError RangeError SyntaxError ReferenceError EvalError URIError
    Promise Map Set WeakMap WeakSet WeakRef Proxy Reflect Intl
    parseInt parseFloat isNaN isFinite encodeURIComponent decodeURIComponent
    encodeURI decodeURI escape unescape btoa atob eval
    ArrayBuffer SharedArrayBuffer DataView Uint8Array Uint8ClampedArray Int8Array
    Uint16Array Int16Array Uint32Array Int32Array Float32Array Float64Array
    BigInt64Array BigUint64Array TextEncoder TextDecoder
    Blob File FileReader FormData Headers Request Response URL URLSearchParams
    AbortController AbortSignal ReadableStream WritableStream TransformStream
    Event CustomEvent EventTarget MouseEvent KeyboardEvent PointerEvent TouchEvent
    InputEvent FocusEvent WheelEvent DragEvent ClipboardEvent MessageEvent
    Node Element HTMLElement Text Comment DocumentFragment DOMParser XMLSerializer
    XMLHttpRequest MutationObserver IntersectionObserver ResizeObserver
    Image Audio Option Worker BroadcastChannel Notification
    Range Selection CSS OffscreenCanvas Path2D ImageData
    speechSynthesis SpeechSynthesisUtterance AudioContext webkitAudioContext
`.trim().split(/\s+/));

// Names supplied by a <script> tag rather than an import, so no declaration
// appears in the file that uses them.
const EXTRA_GLOBALS = new Set([
    'JSZip',      // admin.js: loaded from a CDN <script> in admin.html
    'Tone',       // audio unlock; see the Firefox sign-in note in the README
]);

// ─── Scope analysis ──────────────────────────────────────────────────────────
//
// ⚠️ v1.3.0 MADE THIS SCOPE-AWARE, AND THAT IS THE WHOLE POINT OF THE FILE NOW.
//
// v1.0.0-v1.2.0 collected every declaration in a file into one flat set and asked
// "is this name declared ANYWHERE in the file". That is not the question the
// runtime asks. admin.js declared `const val = ...` inside readBookMetadataForm()
// and called val() from inside uploadAllBtn.onclick — a different function, so a
// ReferenceError at runtime — and this harness reported admin.js clean, because the
// name did appear in the file. It was the third bug of this exact class in one
// session and the only one the tool got wrong.
//
// So: build real scopes. `var` and function declarations belong to the nearest
// FUNCTION; `let`, `const` and `class` belong to the nearest BLOCK. A reference
// resolves only if some scope on its ancestor chain declares it.

const FN_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);
const BLOCK_SCOPES = new Set(['BlockStatement', 'ForStatement', 'ForInStatement',
                              'ForOfStatement', 'SwitchStatement', 'CatchClause',
                              'StaticBlock', 'ClassBody']);

function patternNames(node, out) {
    if (!node) return out;
    switch (node.type) {
        case 'Identifier': out.add(node.name); break;
        case 'ObjectPattern':
            for (const p of node.properties)
                patternNames(p.type === 'RestElement' ? p.argument : p.value, out);
            break;
        case 'ArrayPattern':      for (const e of node.elements) patternNames(e, out); break;
        case 'AssignmentPattern': patternNames(node.left, out); break;
        case 'RestElement':       patternNames(node.argument, out); break;
    }
    return out;
}

// Statements directly owned by a scope node, without descending into nested
// functions (for var hoisting) or nested blocks (for let/const).
function bodyOf(node) {
    if (node.type === 'Program' || node.type === 'BlockStatement' || node.type === 'StaticBlock')
        return node.body;
    if (FN_TYPES.has(node.type)) return node.body && node.body.body ? node.body.body : [];
    if (node.type === 'SwitchStatement') return node.cases.flatMap(c => c.consequent);
    if (node.type === 'ClassBody') return node.body;
    return [];
}

// Everything hoisted to a FUNCTION scope: params, `var`, function declarations —
// found anywhere below, except inside another function.
function functionScopeNames(fnNode) {
    const out = new Set();
    if (fnNode.id) out.add(fnNode.id.name);
    if (fnNode.params) for (const p of fnNode.params) patternNames(p, out);
    if (fnNode.type !== 'Program') out.add('arguments');

    const root = fnNode.type === 'Program' ? fnNode
               : (fnNode.body && fnNode.body.type === 'BlockStatement' ? fnNode.body : null);
    if (!root) return out;

    (function descend(node) {
        for (const key of Object.keys(node)) {
            const child = node[key];
            if (!child || typeof child !== 'object') continue;
            const kids = Array.isArray(child) ? child : [child];
            for (const k of kids) {
                if (!k || typeof k.type !== 'string') continue;
                if (FN_TYPES.has(k.type)) {                 // stop: new function scope
                    if (k.type === 'FunctionDeclaration' && k.id) out.add(k.id.name);
                    continue;
                }
                if ((k.type === 'ExportNamedDeclaration' || k.type === 'ExportDefaultDeclaration')
                    && k.declaration && k.declaration.type === 'FunctionDeclaration'
                    && k.declaration.id) out.add(k.declaration.id.name);
                if (k.type === 'VariableDeclaration' && k.kind === 'var')
                    for (const d of k.declarations) patternNames(d.id, out);
                if (k.type === 'FunctionDeclaration' && k.id) out.add(k.id.name);
                descend(k);
            }
        }
    })(root);
    return out;
}

// let / const / class / function declared DIRECTLY in this block.
function blockScopeNames(node) {
    const out = new Set();
    if (node.type === 'CatchClause') { patternNames(node.param, out); return out; }
    if (node.type === 'ForStatement' && node.init &&
        node.init.type === 'VariableDeclaration' && node.init.kind !== 'var')
        for (const d of node.init.declarations) patternNames(d.id, out);
    if ((node.type === 'ForInStatement' || node.type === 'ForOfStatement') &&
        node.left && node.left.type === 'VariableDeclaration' && node.left.kind !== 'var')
        for (const d of node.left.declarations) patternNames(d.id, out);
    for (let st of bodyOf(node)) {
        if (!st) continue;
        // `export const X = ...` is an ExportNamedDeclaration WRAPPING the
        // declaration. Missing this made every exported const look undeclared.
        if ((st.type === 'ExportNamedDeclaration' || st.type === 'ExportDefaultDeclaration')
            && st.declaration) st = st.declaration;
        if (st.type === 'VariableDeclaration' && st.kind !== 'var')
            for (const d of st.declarations) patternNames(d.id, out);
        if (st.type === 'ClassDeclaration' && st.id) out.add(st.id.name);
        if (st.type === 'FunctionDeclaration' && st.id) out.add(st.id.name);
    }
    return out;
}

const _cache = new WeakMap();
function scopeNames(node) {
    if (_cache.has(node)) return _cache.get(node);
    let names;
    if (node.type === 'Program' || FN_TYPES.has(node.type)) {
        names = functionScopeNames(node);
        for (const n of blockScopeNames(node)) names.add(n);
    } else {
        names = blockScopeNames(node);
    }
    _cache.set(node, names);
    return names;
}

// Module-level names an ES module gets from imports and from `window.x = ...`.
function moduleLevelExtras(ast) {
    const out = new Set();
    walk.full(ast, (node) => {
        if (node.type === 'ImportSpecifier' || node.type === 'ImportDefaultSpecifier' ||
            node.type === 'ImportNamespaceSpecifier') out.add(node.local.name);
        if (node.type === 'AssignmentExpression' &&
            node.left.type === 'MemberExpression' &&
            node.left.object.type === 'Identifier' &&
            (node.left.object.name === 'window' || node.left.object.name === 'globalThis') &&
            node.left.property.type === 'Identifier') out.add(node.left.property.name);
    });
    return out;
}

let failures = 0;
let checked = 0;

// label is what gets printed; lineOffset shifts reported lines for inline blocks.
function check(label, src, lineOffset = 0) {
    let ast;
    try {
        ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
    } catch (e) {
        console.log(`  !!  ${label.padEnd(24)} PARSE ERROR ${e.message}`);
        failures++;
        return;
    }
    const file = label;

    const extras = moduleLevelExtras(ast);
    const unresolved = new Map();
    const resolves = (name, ancestors) => {
        if (extras.has(name) || GLOBALS.has(name) || EXTRA_GLOBALS.has(name)) return true;
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const a = ancestors[i];
            if (a.type === 'Program' || FN_TYPES.has(a.type) || BLOCK_SCOPES.has(a.type)) {
                if (scopeNames(a).has(name)) return true;
            }
        }
        return false;
    };

    // ⚠️ REFERENCES, NOT JUST CALLS (v1.1.0). The first version of this file only
    // examined CallExpression callees. It found learn.js's finishLesson() and
    // walked straight past lessons-admin.js's `addEventListener('click',
    // _addOneStudent)` — which was the worse of the two, because passing an
    // undeclared identifier as an ARGUMENT throws just as hard as calling it, and
    // that one threw during panel initialisation and took four other features down
    // with it. A name that resolves to nothing is a ReferenceError in every
    // expression position, so every expression position is what we check.
    walk.ancestor(ast, {
        Identifier(node, _state, ancestors) {
            const name = node.name;
            const parent = ancestors[ancestors.length - 2];
            if (!parent) return;

            // Positions where an Identifier is a NAME, not a reference to a binding.
            switch (parent.type) {
                // a.foo — `foo` is a property name on whatever `a` turns out to be.
                case 'MemberExpression':
                    if (parent.property === node && !parent.computed) return;
                    break;
                // { foo: 1 } and { foo } — the key is not a reference. For shorthand
                // both key and value are this same node, so only skip when it is
                // genuinely key-only.
                case 'Property':
                    if (parent.key === node && !parent.computed && parent.value !== node) return;
                    break;
                case 'MethodDefinition':
                case 'PropertyDefinition':
                    if (parent.key === node && !parent.computed) return;
                    break;
                // break outer; / continue outer; / outer:
                case 'LabeledStatement':
                case 'BreakStatement':
                case 'ContinueStatement':
                    if (parent.label === node) return;
                    break;
                // import { a as b } / export { a as b } — module plumbing.
                case 'ImportSpecifier':
                case 'ImportDefaultSpecifier':
                case 'ImportNamespaceSpecifier':
                case 'ExportSpecifier':
                    return;
                // function foo() / class Foo — the name is the declaration.
                case 'FunctionDeclaration':
                case 'FunctionExpression':
                case 'ArrowFunctionExpression':
                case 'ClassDeclaration':
                case 'ClassExpression':
                    if (parent.id === node) return;
                    break;
            }

            if (resolves(name, ancestors)) return;
            if (!unresolved.has(name)) unresolved.set(name, node.loc.start.line + lineOffset);
        }
    });

    checked++;
    if (!unresolved.size) {
        console.log(`  ok  ${file.padEnd(24)} every reference resolves in its own scope`);
    } else {
        failures += unresolved.size;
        console.log(`  FAIL ${file.padEnd(23)} ${unresolved.size} reference(s) to nothing:`);
        for (const [name, line] of [...unresolved].sort((a, b) => a[1] - b[1]))
            console.log(`         ${file}:${line}  ${name}  is never declared, imported, or a known global`);
    }
}

function read(file) {
    try { return readFileSync(fileURLToPath(new URL('../' + file, import.meta.url)), 'utf8'); }
    catch { console.log(`  ??  ${file.padEnd(24)} not found — remove it from the list or restore it`); failures++; return null; }
}

for (const file of FILES) {
    const src = read(file);
    if (src !== null) check(file, src);
}

for (const file of HTML_FILES) {
    const html = read(file);
    if (html === null) continue;
    const blocks = inlineScripts(html);
    if (!blocks.length) { console.log(`  --  ${file.padEnd(24)} no inline script`); continue; }
    blocks.forEach((b, k) => {
        const label = blocks.length > 1 ? `${file}[${k}]` : file;
        check(label, b.body, b.startLine - 1);
    });
}

console.log('');
if (failures) {
    console.log(`${failures} unresolved reference(s) across ${checked} file(s). Each one is a`);
    console.log('ReferenceError waiting for the branch that reaches it. Declare the function or');
    console.log('fix the reference — do not silence it via EXTRA_GLOBALS unless it truly is one.');
    process.exitCode = 1;
} else {
    console.log(`ALL PASS — ${checked} files parsed, every identifier reference resolves.`);
}
