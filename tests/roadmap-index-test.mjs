// roadmap-index-test.mjs v1.0.0 — ⚠️⚠️ THE INDEX MUST DESCRIBE THE DOCUMENT.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-08-25: *"I tried to navigate the roadmap, and it's practically
// impossible. It counts from 9 to 12, and then 10 is the last thing listed. It
// doesn't seem to be connected to what's done and what isn't."* Round 41 added
// an index at the top of ROADMAP.md to fix that — items grouped by status,
// Ctrl-F-able, with the numbers deliberately NOT renumbered because HANDOFF.md,
// several source files and the harnesses all cite them in prose.
//
// ⚠️⚠️ AND THEN I LET THE INDEX GO STALE WITHIN THREE ROUNDS. Item 22 was closed
// and still listed as open. Item 24's entry still carried a "do not press ⟳"
// warning after ⟳ had been fixed. Item 25 was fixed and its priority line was
// still at the top. **An index that lies about status is worse than no index**,
// because the whole point is that a reader trusts it INSTEAD of reading the file
// — which is §0.-22's rule about diagnostics, one document over.
//
// ⚠️ THIS IS THE SAME FAILURE AS §0.-31.L (items 13 and 11a carried ⭐⭐ for
// eight rounds after being fixed) AND IT COST ROUND 35 AN ENTIRE ROUND on item
// 17's stale premise. Three occurrences. Prose warnings did not stop it; this
// might.
//
// ⚠️ WHAT IT DOES **NOT** CHECK: whether a heading's status is TRUE. Nothing can
// — that is judgement. It checks only that the index and the body AGREE, which
// is the mechanical half and the half that actually rotted.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const md = readFileSync(new URL('../ROADMAP.md', import.meta.url), 'utf8');

const GROUPS = ['⚠️ OPEN — needs work', '⏳ WATCHING', '✅ DONE', 'REFERENCE'];
const indexStart = md.indexOf('## ' + GROUPS[0]);
ok(indexStart > 0, 'A1 ROADMAP.md carries the index block');

// The index ends at the first item heading (a heading starting with a digit or
// "ITEM"), which is where the document proper begins.
const bodyStart = (() => {
    const re = /^## (?:\d|ITEM )/m;
    const m = re.exec(md.slice(indexStart));
    return m ? indexStart + m.index : -1;
})();
ok(bodyStart > indexStart, 'A2 the index ends where the items begin');

if (indexStart > 0 && bodyStart > indexStart) {
    const indexText = md.slice(indexStart, bodyStart);
    const bodyText  = md.slice(bodyStart);

    // Every `## ` heading in the body.
    const headings = [...bodyText.matchAll(/^## (.+)$/gm)].map(m => m[1].trim());
    ok(headings.length > 10, `A3 the body has items (${headings.length} found)`);

    // ─────────────────────────────────────────────────────────────────────
    console.log('\n--- B. EVERY ITEM IS LISTED, EXACTLY ONCE ---');
    const missing = [], duped = [];
    for (const h of headings) {
        // The index lists headings verbatim, so a substring match is the test.
        const n = indexText.split(h).length - 1;
        if (n === 0) missing.push(h);
        else if (n > 1) duped.push(h);
    }
    ok(missing.length === 0,
       '⚠️⚠️ B1 EVERY ITEM APPEARS IN THE INDEX. Missing: ' +
       (missing.slice(0, 5).map(h => h.slice(0, 60)).join(' | ') || 'none') +
       (missing.length > 5 ? ` (+${missing.length - 5} more)` : '') +
       ' \u2014 an item not in the index is invisible to the person who reads the ' +
       'index instead of the file, which is everyone');
    ok(duped.length === 0,
       'B2 no item is listed twice. Duplicated: ' +
       (duped.slice(0, 3).map(h => h.slice(0, 50)).join(' | ') || 'none'));

    // ─────────────────────────────────────────────────────────────────────
    console.log('\n--- C. ⚠️⚠️ THE GROUP MATCHES THE HEADING\u2019S OWN STATUS ---');
    // Which group does a heading sit in, in the index?
    const groupOf = (h) => {
        const at = indexText.indexOf(h);
        if (at < 0) return null;
        let found = null;
        for (const g of GROUPS) {
            const gi = indexText.indexOf('## ' + g);
            if (gi >= 0 && gi < at) found = g;
        }
        return found;
    };

    const wrong = [];
    for (const h of headings) {
        const g = groupOf(h);
        if (!g) continue;                       // already reported by B1
        const isDone  = h.includes('✅');
        const isWatch = h.startsWith('⏳');
        const inDone  = g.startsWith('✅');
        const inWatch = g.startsWith('⏳');
        const isRef   = g === 'REFERENCE';
        if (isRef) continue;
        if (isDone !== inDone || isWatch !== inWatch) {
            wrong.push(`${h.slice(0, 55)} \u2192 filed under "${g}"`);
        }
    }
    ok(wrong.length === 0,
       '⚠️⚠️ C1 A ✅ ITEM IS FILED UNDER DONE AND AN OPEN ONE IS NOT. Mismatched: ' +
       (wrong.slice(0, 5).join(' | ') || 'none') +
       (wrong.length > 5 ? ` (+${wrong.length - 5} more)` : '') +
       ' \u2014 THIS IS THE CHECK THAT MATTERS. Round 44 closed item 22 and left it ' +
       'listed as open; Round 42 fixed item 25 and left its warning at the top. ' +
       'When you change a heading\u2019s status, REGENERATE THE INDEX in the same edit');

    // ─────────────────────────────────────────────────────────────────────
    console.log('\n--- D. THE INDEX STILL SAYS WHY THE NUMBERS ARE ODD ---');
    ok(/DO NOT RENUMBER/i.test(md.slice(0, indexStart)),
       '⚠️ D1 THE "DO NOT RENUMBER" WARNING SURVIVES. HANDOFF.md, sources and ' +
       'harnesses cite these numbers in prose; renumbering breaks every citation ' +
       'SILENTLY, in files no test reads');
    ok(/TWO DIFFERENT ITEM 18s/i.test(md.slice(0, indexStart)),
       'D2 the duplicate-18 collision is still documented');
}

console.log('');
if (fail === 0) console.log(`PASS - ${pass} passing, 0 failing`);
else            console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
