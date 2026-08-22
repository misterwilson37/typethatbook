// dead-handler-test.mjs v1.0.0 — Round 27f (Chicago).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ WHY THIS EXISTS: A BUTTON THAT DID NOTHING, FOR A DAY, IN PRODUCTION
// ═════════════════════════════════════════════════════════════════════════════
//
// Round 26 shipped ROADMAP item 0d, "I'm done". It shipped:
//   · `handleImDone()` in game.js — complete, correct, re-entrancy-guarded;
//   · `<button id="done-btn">` in game.html;
//   · `.done-btn` in style.css v3.7.2;
//   · the whole of receipt.js to draw the card;
//   · and in learn.js, the line that attaches the handler to the button.
//
// It did not ship that last line **in game.js**. So in Library the button was
// visible, styled, and inert. Clicking it produced NO handler, NO error and NO
// console output — which is exactly what Jake reported after typing Pinocchio.
//
// ⚠️ 43 HARNESSES PASSED THE WHOLE TIME, AND NONE OF THEM COULD HAVE FAILED.
// `undefined-calls-test.mjs` asks *"does every reference resolve?"*
// `handleImDone` resolves perfectly — it is defined, exported to nobody, and
// referenced by nothing. **A defined-but-unreachable function is invisible to
// that check by construction.** This file asks the mirror question:
//
//              undefined-calls: is everything USED also DEFINED?
//              dead-handler:    is everything DEFINED also USED?
//
// ⚠️ AND NOTE THE TWIN, BECAUSE IT IS THE SIXTH THIS WEEK. learn.js wired its
// identical button correctly. Round 26 built both halves and connected one. See
// HANDOFF §0.-13.E for the other five, and §0.-18 for this one.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ WHAT THIS DELIBERATELY DOES NOT DO
// ═════════════════════════════════════════════════════════════════════════════
//
// It does not try to prove a function is reachable — that is a call-graph
// problem and this is a regex over source. It asks only the cheap, decisive
// question: **does the identifier appear anywhere other than its own
// definition?** One reference is enough. That catches the ONE failure mode that
// actually bit us — a handler nothing ever attaches — without pretending to
// static analysis it cannot do.
//
// ⚠️ FALSE POSITIVES ARE THE REAL RISK HERE, not false negatives. A checker that
// cries wolf on an honest file teaches the next round to skip it, which is how
// drill-filter F12 came to be ignored for a whole round (§0.-14.B). So anything
// legitimately reference-free lives in ALLOWED below, **with a reason**, and the
// list is short on purpose.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('  FAIL: ' + msg); } };

const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// The page controllers. ⚠️ Shared MODULES are deliberately not scanned: their
// whole purpose is to define things for someone else to call, and `export`
// already documents that intent.
const CONTROLLERS = ['game.js', 'learn.js'];

// ⚠️ EVERY ENTRY NEEDS A REASON. An unexplained name here is a bug being
// suppressed rather than fixed.
const ALLOWED = {
    // (none yet — add with a reason, never bare)
};

// ⚠️ TWO DIFFERENT VIEWS OF THE SOURCE, AND CONFLATING THEM COST THIS HARNESS
// TWO SELF-INFLICTED FALSE-POSITIVE RUNS BEFORE IT EVER RAN GREEN. Recorded so
// nobody "simplifies" them back into one:
//
//   identifiersOnly()  strips comments AND string literals. For section A, which
//                      counts references to a NAME. Needed because
//                      `handleImDone` appeared in a game.js COMMENT ("See
//                      handleImDone() and receipt.js") and a naive grep would
//                      have counted that as a use and passed the very defect
//                      this file exists for.
//
//   withStrings()      strips comments ONLY. For sections B and C, which look
//                      for an element ID — and an ID lives *inside* a string, so
//                      stripping strings makes every `getElementById('done-btn')`
//                      in the app invisible. The first draft used the wrong one
//                      here and reported all ten buttons as inert.
//
// ⚠️ AND TEMPLATE LITERALS KEEP THEIR ${...} EXPRESSIONS. This file's first run
// flagged nine honest functions as dead — `getMissedCharsHTML`,
// `getDropdownHTML` and friends — because they are only ever called from inside
// `${...}` in an HTML template. Stripping the whole literal deleted real calls.
const stripComments = src => src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/([^:])\/\/.*$/gm, '$1 ');

const withStrings = src => stripComments(src);

const identifiersOnly = src => stripComments(src)
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    // Template literals: keep the ${...} expressions, drop the literal text.
    .replace(/`(?:[^`\\]|\\.)*`/g, m =>
        (m.match(/\$\{[\s\S]*?\}/g) || []).join(' '));

console.log('\n─── A. ⚠️ EVERY FUNCTION A CONTROLLER DEFINES IS REFERENCED SOMEWHERE ───');

for (const file of CONTROLLERS) {
    const src  = read(file);
    const code = identifiersOnly(src);
    const allowed = ALLOWED[file] || {};

    // `function name(` and `async function name(` at any indentation.
    const defined = [...code.matchAll(/(?:^|\s)(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)]
        .map(m => m[1]);

    const dead = [];
    for (const name of [...new Set(defined)]) {
        if (name in allowed) continue;
        // Count every appearance of the bare identifier, then discount the
        // definition sites themselves. Anything left is a real reference.
        const all = (code.match(new RegExp('\\b' + name + '\\b', 'g')) || []).length;
        const defs = (code.match(new RegExp('function\\s+' + name + '\\b', 'g')) || []).length;
        if (all - defs === 0) dead.push(name);
    }

    ok(dead.length === 0,
       `⚠️ ${file} defines ${dead.length} function(s) that NOTHING references: ` +
       `${dead.join(', ')}. Either it is an unwired handler — the "I'm done" ` +
       `defect, a button that silently does nothing — or it is dead code that ` +
       `should be deleted. If it is legitimately reference-free, add it to ` +
       `ALLOWED in this file WITH A REASON.`);
}

console.log('\n─── B. ⚠️ EVERY BUTTON IN THE MARKUP HAS A HANDLER ───');
// The same defect from the other end. A button with an id, no inline onclick,
// and no controller ever naming that id, is inert — which is what a child
// actually experiences.
//
// ⚠️ #done-btn IS THE REASON THIS SECTION EXISTS. It was in game.html and styled
// in style.css and game.js never once mentioned its id.
{
    const PAGES = [['game.html', 'game.js'], ['learn.html', 'learn.js']];
    for (const [htmlFile, jsFile] of PAGES) {
        const html = read(htmlFile);
        const js   = withStrings(read(jsFile));
        const inert = [];
        for (const m of html.matchAll(/<button\b([^>]*)>/g)) {
            const attrs = m[1];
            const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
            if (!id) continue;                       // nothing to wire it by
            if (/\bonclick=/.test(attrs)) continue;  // wired inline
            if (!js.includes(`'${id}'`) && !js.includes(`"${id}"`)) inert.push(id);
        }
        ok(inert.length === 0,
           `⚠️ ${htmlFile} has button(s) ${jsFile} never mentions by id: ` +
           `${inert.join(', ')}. A styled button that does nothing when clicked ` +
           `is worse than no button — it tells a child the app is broken.`);
    }
}

console.log('\n─── C. ⚠️ THE TWIN: BOTH PAGES WIRE "I\'M DONE" ───');
// ⚠️ NAMED EXPLICITLY, not covered by the general checks above, because this is
// the one that shipped broken and because §0.-13.E's lesson is that twins fail
// one half at a time. game.js and learn.js each own a `handleImDone()`; both
// must attach it.
for (const file of CONTROLLERS) {
    const code = withStrings(read(file));
    ok(/function handleImDone/.test(code), `${file} defines handleImDone()`);
    ok(/done-btn/.test(code),
       `⚠️ ${file} looks up #done-btn at all`);
    ok(/doneBtn\.addEventListener\('click', handleImDone\)|_doneBtn\.onclick = handleImDone|doneBtn\.onclick = handleImDone/.test(code),
       `⚠️⚠️ ${file} ATTACHES handleImDone to the button. This is the exact line ` +
       `Round 26 omitted from game.js, leaving a visible, styled, inert button ` +
       `in production for a day.`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
