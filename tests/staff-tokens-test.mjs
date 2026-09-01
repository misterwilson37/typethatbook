// staff-tokens-test.mjs v1.0.0 — ⚠️⚠️ THE STAFF PAGES USE THE TOKENS, AND A COLOUR MEANS ONE THING.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// ROADMAP 37, 38 and 40. Jake: *"It and admin look so much rougher than the
// student facing side."* Measured before it was touched: reports.html carried
// 33 distinct hex colours in 323 style lines and admin.html 51 in 164, neither
// loaded the product's font, and five near-identical greys did overlapping jobs.
//
// ⚠️⚠️ ITEM 38 IS A CORRECTNESS ITEM AND THAT IS WHY THIS HARNESS EXISTS AT ALL.
// Amber meant "watch this error rate" on a day row, "suspicious" on a sprint
// row, and something else again in admin. **A teacher cannot learn what a colour
// means if it means three things**, and the entire value of item 36's
// at-a-glance surface rests on a mark meaning ONE thing reliably. A stray hex
// value added later would quietly reintroduce exactly that.
//
// ⚠️ WHAT THIS DOES NOT CHECK: whether the page looks good. It checks that
// there is a SYSTEM and that nothing has escaped it. Taste is not testable and
// this harness does not pretend otherwise.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const reports = readFileSync(new URL('../reports.html', import.meta.url), 'utf8');
const admin   = readFileSync(new URL('../admin.html',   import.meta.url), 'utf8');
const student = readFileSync(new URL('../style.css',    import.meta.url), 'utf8');

// ⚠️ COMMENTS ARE STRIPPED BEFORE ANY OF THIS IS COUNTED, AND THE FIRST DRAFT
// DID NOT DO IT. It reported two failures against correct code: a hex value
// quoted inside a CSS comment explaining the focus offset, and the word <label>
// inside a comment counting how many labels there used to be. A harness that
// reads the EXPLANATION as if it were the OUTPUT is a harness someone fixes by
// deleting the explanation, which is the opposite of what this file is for.
const stripCss  = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');
const stripHtml = (t) => t.replace(/<!--[\s\S]*?-->/g, '');
const styleOf = (src) => stripCss(src.slice(src.indexOf('<style>'), src.indexOf('</style>')));
const rootOf  = (src) => {
    const st = styleOf(src);
    const at = st.indexOf(':root {');
    return at < 0 ? '' : st.slice(at, st.indexOf('}', at) + 1);
};

console.log('--- A. BOTH STAFF PAGES DECLARE THE TOKENS ---');
for (const [name, src] of [['reports.html', reports], ['admin.html', admin]]) {
    ok(rootOf(src).length > 0, `A1 ${name} has a :root token block`);
    for (const t of ['--surface', '--ink', '--ink-dim', '--rule', '--accent',
                     '--notice', '--warn', '--bad', '--good']) {
        ok(rootOf(src).includes(t + ':'), `A2 ${name} declares ${t}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- B. ⚠️ THE TWO STAFF PAGES AGREE ON EVERY SHARED TOKEN ---');
// There is no shared stylesheet to enforce this — both pages declare their own
// block — so the agreement has to be asserted somewhere or it will drift.
const parse = (src) => Object.fromEntries(
    [...rootOf(src).matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim().toLowerCase()]));
const rp = parse(reports), ad = parse(admin);
const shared = Object.keys(ad).filter(k => k in rp);
ok(shared.length >= 9, `B1 the pages share at least 9 tokens (${shared.length})`);
const drifted = shared.filter(k => rp[k] !== ad[k]);
ok(drifted.length === 0,
   '⚠️⚠️ B2 NO SHARED TOKEN HAS A DIFFERENT VALUE ON THE TWO PAGES. Drifted: ' +
   drifted.map(k => `${k} (${rp[k]} vs ${ad[k]})`).join(', ') +
   ' — two staff pages with the same token NAMES and different VALUES would be ' +
   'worse than no tokens at all, because the name would stop meaning anything');

// ⚠️ --accent IS THE PRODUCT'S IDENTITY COLOUR AND IS SHARED WITH THE STUDENT
// SIDE. The rest of the values are deliberately NOT copied from style.css —
// that file is light and tuned for reading a book, this one is dark and tuned
// for scanning a table — but this one must not drift between surfaces.
const carolina = /--carolina-blue:\s*(#[0-9a-fA-F]{6})/.exec(student);
ok(carolina && rp['--accent'] === carolina[1].toLowerCase(),
   `⚠️⚠️ B3 --accent MATCHES style.css --carolina-blue (${carolina && carolina[1]}). ` +
   `It is the identity colour; the other tokens are role-named on purpose and ` +
   `are NOT expected to match the student side`);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- C. ⚠️⚠️ NOTHING ESCAPES THE SYSTEM IN reports.html ---');
// The whole point. A raw hex anywhere outside :root is a colour that means
// whatever the person who typed it was thinking at the time.
const rStyle = styleOf(reports);
const rBody  = rStyle.slice(rStyle.indexOf('}', rStyle.indexOf(':root {')) + 1);
const strayStyle = [...rBody.matchAll(/#[0-9a-fA-F]{3,6}\b/g)].map(m => m[0]);
ok(strayStyle.length === 0,
   '⚠️⚠️ C1 NO RAW HEX IN THE STYLE BLOCK OUTSIDE :root. Found: ' +
   strayStyle.join(', ') + ' — add a token or reuse one; if the new state fits ' +
   'none of notice/warn/bad, that is worth a conversation rather than a fourth ' +
   'hex value');

// ⚠️ THE JS HALF COUNTS TOO. Most of this page's markup is built in template
// strings, and an inline style="color:#ff3333" is exactly as unsystematic as a
// stylesheet rule — it is just harder to find.
const rJs = stripCss(stripHtml(reports.slice(reports.indexOf('</style>')))).replace(/^\s*\/\/.*$/gm, '');
// (?<!&) — &#8635; is an HTML entity, not a colour. A blind regex matched the
// digits inside it and would have rewritten a ↻ glyph into a CSS variable.
const strayJs = [...rJs.matchAll(/(?<!&)#[0-9a-fA-F]{3,6}\b/g)].map(m => m[0]);
ok(strayJs.length === 0,
   '⚠️⚠️ C2 NO RAW HEX IN THE JS HALF EITHER. Found: ' + strayJs.join(', ') +
   ' — inline style= built in a template string is as unsystematic as a rule, ' +
   'and harder to find later');

ok(rJs.includes('&#8635;'),
   '⚠️ C3 THE RECALCULATE GLYPH ENTITY SURVIVED. &#8635; contains four digits ' +
   'after a # and a naive colour regex rewrites it into a CSS variable. This ' +
   'assertion exists because that nearly happened');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- D. THE PRODUCT FONT IS LOADED ON BOTH ---');
for (const [name, src] of [['reports.html', reports], ['admin.html', admin]]) {
    ok(/fonts\.googleapis\.com[^"]*Courier\+Prime/.test(src),
       `⚠️ D1 ${name} loads Courier Prime. It was on plain 'Courier New' while ` +
       `index.html and learn.html loaded the real face — half of why the staff ` +
       `pages read as a different product`);
    ok(/font-family:\s*'Courier Prime'/.test(styleOf(src)),
       `D2 ${name} actually uses it on body`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- E. ROADMAP 40 — KEYBOARD USABILITY ---');
// ⚠️ SCANNED IN THE MARKUP ONLY, past </style>. The <label> text also occurs
// inside a CSS comment in the style block explaining how many labels there
// used to be — same class of false positive as the one stripCss fixed above.
const markup = stripHtml(reports.slice(reports.indexOf('</style>')));
const labels = [...markup.matchAll(/<label(\s[^>]*)?>/g)].map(m => m[0]);
const unlabelled = labels.filter(l => !l.includes('for='));
ok(unlabelled.length === 0,
   `⚠️ E1 EVERY <label> IN reports.html CARRIES for= (${unlabelled.length} without). ` +
   `All six had none: clicking a label did not focus its input`);

ok(/:focus-visible/.test(styleOf(reports)) && /:focus-visible/.test(styleOf(admin)),
   '⚠️⚠️ E2 BOTH PAGES HAVE A VISIBLE FOCUS STYLE. reports.html had two :focus ' +
   'rules in 3,700 lines and admin.html one — on a product whose entire purpose ' +
   'is teaching children to use a keyboard without a mouse');

ok(/outline:\s*2px solid var\(--accent\)/.test(styleOf(reports)),
   '⚠️ E3 IT IS AN outline, NOT A border. A border participates in layout and ' +
   'would shift the row it lands in; an outline does not');

// Interactive spans must be reachable AND operable, and the two go together.
for (const cls of ['uid-chip', 'expand-sessions']) {
    const m = new RegExp('class="[^"]*' + cls + '[^"]*"[^>]*').exec(reports);
    const tag = m ? m[0] : '';
    ok(/role="button"/.test(tag) && /tabindex="0"/.test(tag),
       `⚠️⚠️ E4 .${cls} HAS role AND tabindex TOGETHER. Either alone is worse ` +
       `than neither: focusable with no role announces as plain text, and a role ` +
       `with no tabindex announces as a button a keyboard user cannot reach`);
}

ok(/keydown[\s\S]{0,600}\.uid-chip,\s*\.expand-sessions/.test(reports),
   '⚠️⚠️ E5 ENTER AND SPACE ACTIVATE THEM. A focus ring that leads a keyboard ' +
   'user to a control which then ignores them is worse than no focus ring — it ' +
   'promises something the page does not deliver');

ok(/e\.preventDefault\(\)/.test(reports.slice(reports.indexOf("addEventListener('keydown'"),
                                              reports.indexOf("addEventListener('keydown'") + 600)),
   '⚠️ E6 SPACE IS preventDefault()ed. Its default action is to scroll, which ' +
   'would fire the control AND jump the teacher away from the row they were on');

console.log('');
if (fail === 0) console.log(`PASS - ${pass} passing, 0 failing`);
else            console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
