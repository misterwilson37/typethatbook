// audit-inline-styles.mjs v1.1.0 — ROADMAP 42's instrument.
//
// ═══════════════════════════════════════════════════════════════════════════
//   node tools/audit-inline-styles.mjs            # every staff surface
//   node tools/audit-inline-styles.mjs admin.js   # one file
// ═══════════════════════════════════════════════════════════════════════════
//
// WHY THIS EXISTS. Item 42 was filed with a hand count — "276 inline style=
// attributes in admin.html, against 33 in reports.html" — and that count was
// right about admin.html and MISSED admin.js ENTIRELY, which carries another
// 183 that build the same page's markup out of template strings. A number
// nobody can re-derive goes stale the round after it is written, and this file
// is the answer to that: every figure item 42 cites is printed by this command.
//
// ⚠️ IT COUNTS DECLARATIONS, NOT ATTRIBUTES, because that is the unit of work.
// `style="a:1; b:2; c:3"` is one attribute and three decisions.
//
// ⚠️ THE SINGLE-USE COUNT IS THE ONE TO WATCH. It is the size of the one-off
// tail — mostly one-off colour — and it is the metric for item 38. It should
// fall hard when the three severities land, and barely move otherwise.
//
// ⚠️⚠️ v1.1.0 — THE UTILITY BLOCK HAS TWO CONSUMERS AND THIS TOOL WAS READING
// ONE. The classes are declared in admin.html and used from admin.html AND
// admin.js, and counting uses in the markup alone made the item 38 metric a
// lie in both directions at once: after Round 59 moved 232 more declarations
// out of admin.js it reported 62 healthy classes as orphans while UNDERSTATING
// the single-use tail, which is the number the item is steering by.
// ⚠️ inline-styles-test.mjs A3/A4 had exactly this bug and Round 58 fixed it
// there. The tool that PRINTS the metric kept it for one more round, because
// nothing points a check at a tool. **A future page built against these
// utilities has to join CONSUMERS below.**

import { readFileSync, readdirSync } from 'fs';

const DEFAULT = ['admin.html', 'admin.js', 'reports.html'];
const files = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;
const root = new URL('../', import.meta.url);

// ⚠️ EVERY FILE THAT WRITES `class="u-…"` AGAINST admin.html's BLOCK. Usage is
// counted across all of them; declaring lives in admin.html alone.
const CONSUMERS = ['admin.html', 'admin.js'];

const stripComments = (src, isHtml) => isHtml
    ? src.replace(/<!--[\s\S]*?-->/g, '')
    : src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

let grand = { attrs: 0, decls: 0 };

for (const f of files) {
    let src;
    try { src = readFileSync(new URL(f, root), 'utf8'); }
    catch { console.log(`\n${f}: NOT FOUND`); continue; }
    const isHtml = f.endsWith('.html');
    let body = stripComments(src, isHtml);

    // For an HTML page the <style> block is the DESTINATION, not a finding —
    // exclude it or every extracted rule reads as a problem.
    let utilCount = 0, utilUses = new Map();
    if (isHtml && body.includes('<style>')) {
        const a = body.indexOf('<style>'), b = body.indexOf('</style>');
        const css = body.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '');
        utilCount = [...css.matchAll(/\.(u-[\w-]+)\s*\{/g)].length;
        body = body.slice(0, a) + body.slice(b);
        for (const consumer of CONSUMERS) {
            let text;
            if (consumer === f) text = body;
            else { try { text = readFileSync(new URL(consumer, root), 'utf8'); } catch { continue; } }
            for (const m of text.matchAll(/\bclass\s*=\s*"([^"]*)"/g))
                for (const c of m[1].split(/\s+/))
                    if (c.startsWith('u-')) utilUses.set(c, (utilUses.get(c) || 0) + 1);
        }
    }

    const attrs = [...body.matchAll(/\bstyle\s*=\s*"([^"]*)"/g)].map(m => m[1]);
    const decls = [], props = new Map(), hex = new Map(), sizes = new Map();
    for (const a of attrs) {
        for (const d of a.split(';')) {
            const i = d.indexOf(':'); if (i < 0) continue;
            const p = d.slice(0, i).trim().toLowerCase(), v = d.slice(i + 1).trim();
            if (!p || !v) continue;
            decls.push(`${p}:${v}`);
            props.set(p, (props.get(p) || 0) + 1);
            if (p === 'font-size') sizes.set(v, (sizes.get(v) || 0) + 1);
            for (const h of v.match(/#[0-9a-fA-F]{3,6}/g) || [])
                hex.set(h.toLowerCase(), (hex.get(h.toLowerCase()) || 0) + 1);
        }
    }
    grand.attrs += attrs.length; grand.decls += decls.length;

    console.log(`\n══ ${f} ${'═'.repeat(Math.max(0, 58 - f.length))}`);
    console.log(`   inline style= attributes : ${attrs.length}`);
    console.log(`   inline declarations      : ${decls.length}` +
                (decls.length ? ` (${new Set(decls).size} distinct)` : ''));
    if (utilCount) {
        const single = [...utilUses.values()].filter(v => v === 1).length;
        console.log(`   utility classes declared : ${utilCount}`);
        console.log(`   \u2b50 used exactly once       : ${single}   <-- the item 38 metric`);
        const orphan = utilCount - utilUses.size;
        if (orphan) console.log(`   \u26a0\ufe0f declared but unused      : ${orphan}`);
    }
    if (hex.size) {
        console.log(`   distinct hex colours     : ${hex.size} in ${[...hex.values()].reduce((a, b) => a + b, 0)} uses`);
        console.log('      ' + [...hex].sort((a, b) => b[1] - a[1]).slice(0, 8)
            .map(([h, n]) => `${h}\u00d7${n}`).join('  '));
    }
    if (sizes.size > 1) {
        // ⚠️ Jake's stated number-one design complaint is elements that are only
        // SLIGHTLY different from each other, so the font-size ladder is printed
        // in full rather than summarised. `.8em` and `0.8em` are the same size
        // spelled two ways and are listed separately on purpose — the duplicate
        // spelling is itself a finding.
        const key = v => parseFloat(v) || 99;
        console.log(`   \u26a0\ufe0f font-size ladder         : ${sizes.size} distinct`);
        console.log('      ' + [...sizes].sort((a, b) => key(a[0]) - key(b[0]))
            .map(([v, n]) => `${v}\u00d7${n}`).join('  '));
    }
    if (props.size) {
        console.log('   top properties           : ' + [...props].sort((a, b) => b[1] - a[1])
            .slice(0, 6).map(([p, n]) => `${p}\u00d7${n}`).join('  '));
    }
}

console.log(`\n${'\u2500'.repeat(62)}`);
console.log(`TOTAL across ${files.length} file(s): ${grand.attrs} attributes, ${grand.decls} declarations`);
console.log('\u26a0\ufe0f  admin.js\u2019s share builds the SAME PAGE as admin.html out of template');
console.log('   strings. Item 42\u2019s original count of 276 was admin.html only.');
