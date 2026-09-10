// arcade-versions-test.mjs v1.1.0 — Round 114 (Carriage): arcade.html's OWN two
// halves are pinned at last. Its header read v3.7.0 while ARCADE_PAGE_VERSION
// read 3.13.0 — twelve rounds of drift, in the one arcade file this harness did
// not check, because it discovers `game-*` modules and that is a page. ⚠️ Round
// 98 found the same drift, fixed that instance by hand, and wrote the gap into a
// comment instead of closing it. A gap described in a comment is an open gap.
// arcade-versions-test.mjs v1.0.0 — THE ARCADE FILES STAMP THEMSELVES HONESTLY.
// Round 98.
//
// ⚠️⚠️ THIS EXISTS BECAUSE FOUR ARCADE FILES SPENT TEN ROUNDS LYING ABOUT THEIR
// OWN VERSION AND NOTHING NOTICED.
//
// README.md states the rule for the whole project: *"Every shipped file carries
// its version TWICE — a runtime constant and a header comment — and both are
// bumped in the same edit, always. npm test fails if the two disagree."* That
// last sentence was true only for files registered in `versions.js` SOURCES, and
// the arcade is DELIBERATELY not registered (Jake's ruling: a draft is not a
// version, and while the games were inert the build panel had no business
// fetching eight modules no student loaded).
//
// ⚠️ SO THE ARCADE FELL IN THE GAP BETWEEN TWO CORRECT DECISIONS. Headers were
// bumped round after round; the constants sat at 1.0.0. game-layout.js shipped
// with no constant at all. A classroom running a stale file would have reported
// itself as current.
//
// ⭐ THIS IS THE COVER UNTIL THEY JOIN versions.js. When they do, delete this
// file and let version-stamp-test.mjs own them — do not keep both, or the next
// person gets two answers to one question.

import { readFileSync, readdirSync } from 'fs';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const root = new URL('../', import.meta.url);

// ⚠️ DISCOVERED, NOT LISTED. A hand-kept list is what goes stale and lets the
// next arcade file ship unstamped — which is the defect this file is about.
const files = readdirSync(root)
    .filter(f => /^(game-|escape-board)/.test(f) && f.endsWith('.js'))
    .sort();

ok(files.length >= 8, 'found the arcade modules (' + files.length + ')');

for (const f of files) {
    const src = readFileSync(new URL(f, root), 'utf8');

    const head = src.match(new RegExp('^// ' + f.replace('.', '\\.') + ' v([0-9]+\\.[0-9]+\\.[0-9]+)', 'm'));
    ok(!!head, f + ' has a header stamp on its first line');

    const konst = src.match(/export const ([A-Z_]*VERSION) = '([0-9]+\.[0-9]+\.[0-9]+)'/);
    ok(!!konst, f + ' exports a runtime version constant');

    if (head && konst) {
        ok(head[1] === konst[2],
           '⚠️ ' + f + ' header (' + head[1] + ') matches its constant (' + konst[2] + ')');
    }
}

// ⚠️ AND THE BUILD PANEL MUST READ THE CONSTANTS, NOT THE HEADERS. A header is a
// comment in the repo; the constant is what the DEPLOYED file says about itself,
// and telling them apart is the only way to know what a classroom is running.
{
    const arcade = readFileSync(new URL('arcade.html', root), 'utf8');
    ok(/GAME_DEADLINE_VERSION/.test(arcade) && /GAME_SHELL_VERSION/.test(arcade),
       'arcade.html reads the runtime constants for its build panel');

    // ═════════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ arcade.html ITSELF WAS THE ONE FILE THIS HARNESS DID NOT CHECK, AND
    // IT DRIFTED SIX ROUNDS.
    // ═════════════════════════════════════════════════════════════════════════
    //
    // The loop above discovers `game-*` and `escape-board*`, which is every
    // arcade MODULE and not the page that mounts them. Its header read v3.7.0
    // (Round 101) while ARCADE_PAGE_VERSION read 3.13.0 (Round 113) — twelve
    // rounds of constant bumps against a frozen header.
    //
    // ⭐ AND THE FILE'S OWN HEADER PREDICTED IT. Round 98 wrote there: *"the one
    // file its own harness does not check both halves of, because
    // arcade-versions-test.mjs only pins the `game-*` modules."* It then fixed
    // that instance by hand and left the hole open. ⚠️ A KNOWN GAP WRITTEN DOWN
    // IN A COMMENT IS NOT A CLOSED GAP; this is what closing it looks like.
    //
    // ⚠️ THIS MATTERS MORE THAN A MODULE'S STAMP, NOT LESS. Round 113's whole
    // finding was that a bug report arrived against a build two versions old and
    // there was no cheap way to tell "not applied" from "not fixed". The number
    // in the corner of the page is the instrument for that, and the header is
    // where the next reader looks to see what it should say.
    const pageHead = arcade.match(/^<!-- arcade\.html v([0-9]+\.[0-9]+\.[0-9]+)/m);
    ok(!!pageHead, 'arcade.html has a header stamp on its first comment line');
    const pageKonst = arcade.match(/const ARCADE_PAGE_VERSION = '([0-9]+\.[0-9]+\.[0-9]+)'/);
    ok(!!pageKonst, 'arcade.html declares ARCADE_PAGE_VERSION');
    if (pageHead && pageKonst) {
        ok(pageHead[1] === pageKonst[1],
           '⚠️⚠️ arcade.html header (' + pageHead[1] + ') matches its constant (' +
           pageKonst[1] + ') — six rounds of drift before Round 114');
    }
    // ⚠️ AND THE VERSION THE STUDENT CAN SEE IS THE CONSTANT, so the badge must
    // render it rather than repeating a literal. A third copy in the markup is
    // the one that would go stale next.
    ok(/arcade v\$\{ARCADE_PAGE_VERSION\}|ARCADE_PAGE_VERSION/.test(arcade),
       'and the on-page badge is rendered from that constant');
}

console.log(fail
    ? `\narcade-versions-test: ${pass} passed, ${fail} FAILED`
    : `arcade-versions-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(x => console.log('   \u2717 ' + x)); process.exit(1); }
