// module-parse-test.mjs v1.0.0 — EVERY SHIPPED MODULE MUST ACTUALLY PARSE.
// Round 96.
//
// ⚠️⚠️ THIS EXISTS BECAUSE A FILE THAT COULD NOT BE PARSED BY A BROWSER SHIPPED
// TO A CLASSROOM WITH EVERY CHECK GREEN.
//
// game-chrome.js v1.3.0 had a comment inside its CSS template literal that used
// backticks around an identifier. One backtick closed the string; the rest of
// the CSS became code; the browser said `SyntaxError: Unexpected identifier
// 'bottom'` — naming a CSS property, pointing nowhere near the comment.
//
// ⚠️ AND NOTHING CAUGHT IT. `node --check` passed, because it parses a .js file
// as a SCRIPT and the wreckage happened to be script-legal. The runner's own
// syntax audit passed for the same reason and reported "0 syntax failure(s)".
// All 87 harnesses passed, because every one of them READS these files as text
// rather than loading them as modules.
//
// ⭐ SO THIS PARSES THE BODY THE WAY A BROWSER WOULD. Imports and exports are
// stripped (the harness cannot resolve './firebase-config.js' or a gstatic URL,
// and does not need to) and what remains is handed to the Function constructor,
// which uses the real JS parser. An unterminated template literal, a stray
// backtick, an unbalanced brace — anything that would stop the file loading in a
// classroom — fails here.
//
// ⚠️ IT PROVES PARSEABILITY, NOT CORRECTNESS. A file can parse and still be
// wrong. That is fine: this is the floor, and the floor was missing.

import { readFileSync, readdirSync } from 'fs';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const root = new URL('../', import.meta.url);

// Every top-level .js in the repo. ⚠️ DISCOVERED, NOT LISTED — a hand-kept list
// is the thing that goes stale and lets the next file through unchecked.
const files = readdirSync(root)
    .filter(f => f.endsWith('.js'))
    .sort();

ok(files.length > 15, 'found the shipped modules to check (' + files.length + ')');

for (const f of files) {
    const src = readFileSync(new URL(f, root), 'utf8');
    // Strip module syntax the Function constructor cannot accept. Multi-line
    // import blocks are common in this repo, so the pattern spans lines.
    const body = src
        .replace(/^\s*import\s[\s\S]*?;\s*$/gm, '')
        // ⚠️ `export * from '...'` HAS NO STATEMENT BODY TO KEEP — read-meter.js
        // re-exports the whole Firebase SDK that way. Dropping the `export`
        // prefix alone leaves a bare `*` and the harness reports a syntax error
        // in a file that is perfectly fine, which is how a checker starts being
        // ignored.
        .replace(/^\s*export\s+\*\s+from\s+[^;]+;\s*$/gm, '')
        .replace(/^\s*export\s+default\s/gm, 'const __d = ')
        .replace(/^\s*export\s+/gm, '');
    let err = null;
    try { new Function(body); } catch (e) { err = e.message; }
    ok(!err, f + ' parses as JavaScript' + (err ? ' — ' + err : ''));
}

console.log(fail
    ? `\nmodule-parse-test: ${pass} passed, ${fail} FAILED`
    : `module-parse-test: all ${pass} modules parse`);
if (fail) { failures.forEach(x => console.log('   \u2717 ' + x)); process.exit(1); }
