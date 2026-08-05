// undefined-calls-test.mjs v1.1.0 — Round 6 (Noiseless).
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
];

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

// Collect every binding a scope can see. Params, declarations, imports,
// function/class names, catch clauses, labels — anything that makes an identifier
// resolvable without leaving the file.
function collectDeclared(ast) {
    const names = new Set();
    const addPattern = (node) => {
        if (!node) return;
        switch (node.type) {
            case 'Identifier': names.add(node.name); break;
            case 'ObjectPattern':
                for (const p of node.properties)
                    addPattern(p.type === 'RestElement' ? p.argument : p.value);
                break;
            case 'ArrayPattern':
                for (const e of node.elements) addPattern(e);
                break;
            case 'AssignmentPattern': addPattern(node.left); break;
            case 'RestElement':      addPattern(node.argument); break;
        }
    };

    walk.full(ast, (node) => {
        switch (node.type) {
            case 'VariableDeclarator': addPattern(node.id); break;
            case 'FunctionDeclaration':
            case 'FunctionExpression':
            case 'ArrowFunctionExpression':
                if (node.id) names.add(node.id.name);
                for (const p of node.params) addPattern(p);
                break;
            case 'ClassDeclaration':
            case 'ClassExpression':
                if (node.id) names.add(node.id.name);
                break;
            case 'CatchClause': addPattern(node.param); break;
            case 'ImportSpecifier':
            case 'ImportDefaultSpecifier':
            case 'ImportNamespaceSpecifier':
                names.add(node.local.name);
                break;
            // `window.foo = ...` publishes a global the file may then call bare.
            case 'AssignmentExpression':
                if (node.left.type === 'MemberExpression' &&
                    node.left.object.type === 'Identifier' &&
                    (node.left.object.name === 'window' || node.left.object.name === 'globalThis') &&
                    node.left.property.type === 'Identifier') {
                    names.add(node.left.property.name);
                }
                break;
        }
    });
    return names;
}

let failures = 0;
let checked = 0;

for (const file of FILES) {
    const path = fileURLToPath(new URL('./' + file, import.meta.url));
    let src;
    try { src = readFileSync(path, 'utf8'); }
    catch { console.log(`  ??  ${file.padEnd(24)} not found — remove it from FILES or restore it`); failures++; continue; }

    let ast;
    try {
        ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
    } catch (e) {
        console.log(`  !!  ${file.padEnd(24)} PARSE ERROR ${e.message}`);
        failures++;
        continue;
    }

    const declared = collectDeclared(ast);
    const unresolved = new Map();

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
            if (declared.has(name) || GLOBALS.has(name) || EXTRA_GLOBALS.has(name)) return;

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

            if (!unresolved.has(name)) unresolved.set(name, node.loc.start.line);
        }
    });

    checked++;
    if (!unresolved.size) {
        console.log(`  ok  ${file.padEnd(24)} ${declared.size} bindings, every reference resolves`);
    } else {
        failures += unresolved.size;
        console.log(`  FAIL ${file.padEnd(23)} ${unresolved.size} reference(s) to nothing:`);
        for (const [name, line] of [...unresolved].sort((a, b) => a[1] - b[1]))
            console.log(`         ${file}:${line}  ${name}  is never declared, imported, or a known global`);
    }
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
