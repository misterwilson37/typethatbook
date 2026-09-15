// call-shape-test.mjs v1.0.0 — Round 124 (Sholes).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ A REFERENCE AUDIT IS NOT A SIGNATURE AUDIT, AND THE DIFFERENCE COST
//        THE ARCADE A WHOLE FEATURE FOR THREE ROUNDS.
// ═════════════════════════════════════════════════════════════════════════════
//
// `game-draw.js` declares `platedText(ctx, o)` and reads `o.text` and `o.x`.
// `game-shatter.js`'s ping label called it as
// `platedText(ctx, rock.text, x, y, {...})` — five positional arguments — so `o`
// was a STRING, `o.text` and `o.x` were `undefined`, the plate's corner computed
// to `NaN` and `roundRect()` painted nothing.
//
// ⭐⭐ THE PING SHIPPED IN ROUND 121, WAS TUNED IN 122, HAD ITS REACH REWRITTEN
// IN 124, AND THE ONE THING IT EXISTS TO DO HAD NEVER HAPPENED ONCE. Jake:
// *"While the ping goes out further, it doesn't tell me what the words are.
// That's the whole point."*
//
// ⚠️⚠️ `undefined-calls-test.mjs` CANNOT SEE THIS AND NEVER COULD. Every
// identifier in that call resolves — `platedText`, `rock`, `x`, `y` are all
// declared. The defect is the SHAPE of the argument list, which is a different
// question from whether the names exist. ⭐ Widening that harness to cover the
// arcade (Round 124) was right and did catch two real bugs; it is simply the
// wrong instrument for this one, and a harness that is the wrong instrument is
// worth saying so about rather than trusting.
//
// ⚠️ WHAT THIS CHECKS AND WHAT IT DELIBERATELY DOES NOT:
//   • every call to a function EXPORTED BY one of the SOURCES below, made from
//     any file in TARGETS, is compared against that function's declared
//     parameter list;
//   • too many arguments is an ERROR — JavaScript silently discards them, which
//     is exactly how the ping failed;
//   • too few is a NOTE, NEVER A FAILURE, and that is a finding about this
//     codebase rather than a compromise. `fingerColorOf(ch, fallback)` and
//     `arcadeWindow(lessons, progress, levelIdx)` both mark an optional trailing
//     parameter with an `== null` test in the body instead of a default value,
//     so a bare parameter name here does NOT mean "required". ⭐ THE FIRST DRAFT
//     OF THIS HARNESS FAILED ALL FOUR OF THOSE CALL SITES, which would have made
//     it a red test defending nothing — the exact shape HANDOFF §22C warns about.
// ⚠️ IT DOES NOT TYPE-CHECK. A string where an object was wanted is invisible to
// it — but that call was also the wrong ARITY, which is the property that makes
// a cheap structural check worth having at all.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as acorn from 'acorn';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ⚠️ THE FILES WHOSE EXPORTS ARE THE CONTRACT. Drawing helpers first, because
// they are the ones called from many places with hand-written argument lists.
const SOURCES = [
    'game-draw.js', 'game-sprites.js', 'game-shell.js', 'typing-calibrator.js',
    'shatter-board.js', 'shatter-shards.js', 'arcade-pool.js', 'game-layout.js',
];

// ⚠️ THE FILES WHOSE CALLS ARE CHECKED. Every arcade module, plus the sources
// themselves — a helper calling its own neighbour wrongly is the same defect.
const TARGETS = [
    'game-shatter.js', 'game-deadline.js', 'game-escape.js', 'game-chrome.js',
    'escape-board.js', 'arcade-telemetry.js', 'game-draw.js', 'game-sprites.js',
    'shatter-board.js', 'shatter-shards.js', 'game-shell.js', 'game-layout.js',
];

let ok = 0;
const failures = [];
const notes = [];
function check(cond, msg) {
    if (cond) { ok++; console.log(`  ok    ${msg}`); }
    else { failures.push(msg); console.log(`  FAIL  ${msg}`); }
}

function parse(file) {
    return acorn.parse(readFileSync(join(ROOT, file), 'utf8'), {
        ecmaVersion: 2022, sourceType: 'module', locations: true,
    });
}

/** min required args, max accepted args, or null for rest/unknown. */
function arity(params) {
    let min = 0, max = 0, rest = false;
    for (const p of params) {
        if (p.type === 'RestElement') { rest = true; break; }
        max++;
        if (p.type !== 'AssignmentPattern') min = max;
    }
    return { min, max, rest };
}

function walk(node, visit) {
    if (!node || typeof node.type !== 'string') return;
    visit(node);
    for (const k of Object.keys(node)) {
        const v = node[k];
        if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && walk(c, visit));
        else if (v && typeof v.type === 'string') walk(v, visit);
    }
}

// ── collect exported function signatures ────────────────────────────────────
const sigs = new Map();   // name -> { file, min, max, rest }
for (const file of SOURCES) {
    walk(parse(file), (n) => {
        if (n.type !== 'ExportNamedDeclaration' || !n.declaration) return;
        const d = n.declaration;
        if (d.type === 'FunctionDeclaration' && d.id) {
            sigs.set(d.id.name, { file, ...arity(d.params) });
        }
    });
}
console.log(`\n─── A. ${sigs.size} exported functions have a declared shape ───`);
check(sigs.has('platedText'), 'platedText() is among them — the function this harness exists for');
{
    const s = sigs.get('platedText');
    check(s && s.max === 2 && !s.rest,
          `⭐ and it takes exactly 2 arguments (ctx, o) — got ${s ? s.max : '?'}`);
}

// ── check every call site ───────────────────────────────────────────────────
console.log('\n─── B. ⚠️ EVERY CALL MATCHES ITS DECLARATION ───');
let calls = 0;
for (const file of TARGETS) {
    const bad = [];
    walk(parse(file), (n) => {
        if (n.type !== 'CallExpression' || n.callee.type !== 'Identifier') return;
        const s = sigs.get(n.callee.name);
        if (!s) return;
        // ⚠️ A SPREAD MAKES THE COUNT UNKNOWABLE STATICALLY. Skip rather than guess.
        if (n.arguments.some(a => a.type === 'SpreadElement')) return;
        calls++;
        const got = n.arguments.length;
        if (!s.rest && got > s.max) {
            bad.push(`${file}:${n.loc.start.line}  ${n.callee.name}() got ${got} `
                   + `argument(s), declared ${s.max} in ${s.file}`);
        } else if (got < s.min) {
            // ⚠️ A NOTE. See the header: an optional trailing parameter is
            // spelled with an `== null` test in the body in this codebase, so
            // "fewer than declared" is a normal call shape and not a defect.
            notes.push(`${file}:${n.loc.start.line}  ${n.callee.name}() got ${got} `
                   + `of ${s.max} — trailing optional, not a defect`);
        }
    });
    check(bad.length === 0,
          bad.length ? `${file} — ${bad.length} call(s) of the wrong shape:\n         `
                       + bad.join('\n         ')
                     : `${file.padEnd(22)} every call matches its declaration`);
}

console.log(`\n${calls} cross-module call site(s) checked across ${TARGETS.length} files.`);
for (const n of notes) console.log(`  note  ${n}`);
if (failures.length) {
    console.log(`\nFAIL — ${ok} ok, ${failures.length} failed. Extra arguments are `
        + 'discarded silently by JavaScript; that is how the ping label drew nothing '
        + 'for three rounds.');
    process.exit(1);
}
console.log(`PASS — ${ok} ok, 0 failed`);
