// inline-styles-test.mjs v1.0.0 — ⚠️⚠️ THE EXTRACTED STYLES STAY EXTRACTED, AND
//                                    THE UTILITY BLOCK STAYS LAST.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// ROADMAP 42. admin.html carried 276 inline `style=` attributes against
// reports.html's 33, which is why it resisted items 37–41: there was no
// stylesheet to edit, so any visual change meant hunting through markup.
// Round 56 moved 834 of its 866 declarations into a utility block.
//
// ⚠️⚠️ THE ITEM SAID THE WORK WAS "MECHANICAL, LOW-RISK, AND RENDERING SHOULD BE
// BYTE-IDENTICAL." TWO OF THOSE THREE WERE WRONG, AND THIS FILE IS WHERE THE
// CORRECTIONS LIVE, because both failure modes are INVISIBLE to a passing suite:
//
//   1. SOURCE ORDER IS LOad-BEARING. The utility classes are single-class
//      selectors. Against `.lbtn`, `.l-field`, `.col` and `.l-label` they TIE on
//      specificity (0,1,0) and win only because they come later in the file.
//      69 declarations depend on that. Move the block up — or let a later round
//      append a new rule below it — and those 69 silently revert to the values
//      they were written to override. Nothing renders an error; the page just
//      quietly goes back to how it looked before anyone filed item 42.
//
//   2. SOME DECLARATIONS MUST **NOT** BE EXTRACTED, and the reasons are not
//      cosmetic. See Part C.
//
// ⚠️ WHAT THIS DOES NOT CHECK: whether the page looks right. Nothing can — see
// ROADMAP § CONVENTIONS, "if a round touches layout, look at it rendered." This
// checks the invariants that survive without a browser.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const admin = readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const adminJs = readFileSync(new URL('../admin.js', import.meta.url), 'utf8');

// Comments are stripped before anything is counted. staff-tokens-test.mjs's
// first draft failed against correct code by reading its own explanation as
// output; that mistake is not worth making twice.
const styleBlock = (() => {
    const a = admin.indexOf('<style>'), b = admin.indexOf('</style>');
    return admin.slice(a, b);
})();
const cssNoComments = styleBlock.replace(/\/\*[\s\S]*?\*\//g, '');
const htmlNoComments = admin.replace(/<!--[\s\S]*?-->/g, '');
// The markup half, with the style block removed so its braces are not read as tags.
const markup = htmlNoComments.slice(0, htmlNoComments.indexOf('<style>')) +
               htmlNoComments.slice(htmlNoComments.indexOf('</style>'));

console.log('--- A. THE EXTRACTION HAPPENED AND HAS NOT BEEN UNDONE ---');

const inlineCount = (markup.match(/\bstyle\s*=\s*"/g) || []).length;
ok(inlineCount <= 10,
   `⚠️⚠️ A1 admin.html CARRIES AT MOST 10 INLINE style= ATTRIBUTES (found ${inlineCount}). ` +
   'It was 276 before ROADMAP 42. Every one that comes back is a value that ' +
   'cannot be restyled without hunting through markup, which is the entire ' +
   'reason this page resisted items 37\u201341. If a new one is genuinely needed, ' +
   'it belongs in Part C\u2019s list with a reason, not here');

const utilRules = [...cssNoComments.matchAll(/\.(u-[\w-]+)\s*\{\s*([^}]*?)\s*\}/g)];
ok(utilRules.length > 150,
   `A2 the utility block exists (${utilRules.length} classes)`);

// Every u- class used in the markup is declared, and every declared one is used.
//
// ⚠️⚠️ admin.js IS A SECOND CONSUMER OF THIS BLOCK AND MUST BE COUNTED HERE.
// Round 58 extracted 250 declarations out of the template strings admin.js
// builds its markup from, and those classes are USED at runtime while appearing
// nowhere in admin.html. Reading only the markup made A4 report 31 healthy
// classes as orphans, and — far worse in the other direction — would let A3 miss
// a class admin.js uses that nobody ever declared, which renders as "nothing
// happened" rather than as an error.
//
// ⚠️ THE BLOCK LIVES IN admin.html AND ITS CONSUMERS ARE BOTH FILES. Any future
// page that builds markup against these utilities has to be added to this list
// too, or its classes look unused and get deleted from under it.
const CONSUMERS = [markup, adminJs];
const used = new Set();
for (const src of CONSUMERS)
    for (const m of src.matchAll(/\bclass\s*=\s*"([^"]*)"/g))
        for (const c of m[1].split(/\s+/)) if (c.startsWith('u-')) used.add(c);
const declared = new Set(utilRules.map(m => m[1]));
const undeclared = [...used].filter(c => !declared.has(c));
const unused = [...declared].filter(c => !used.has(c));
ok(undeclared.length === 0,
   '⚠️⚠️ A3 EVERY u- CLASS IN THE MARKUP IS DECLARED. Undeclared: ' +
   (undeclared.slice(0, 6).join(', ') || 'none') +
   ' \u2014 an undeclared utility class is a declaration that silently vanished from ' +
   'the page, and it renders as \u201Cnothing happened\u201D rather than as an error');
ok(unused.length === 0,
   'A4 no utility class is declared and unused. Orphans: ' +
   (unused.slice(0, 6).join(', ') || 'none') +
   ' \u2014 an orphan is usually the residue of an element that was deleted or ' +
   'retagged, and it makes the item 38 tail count lie');

// A utility must declare exactly one property. Two would make the name a lie.
const multi = utilRules.filter(m => m[2].replace(/;\s*$/, '').includes(';'));
ok(multi.length === 0,
   'A5 every utility declares exactly ONE property. Offenders: ' +
   (multi.slice(0, 4).map(m => m[1]).join(', ') || 'none') +
   ' \u2014 the class name encodes property and value, so a second declaration is ' +
   'invisible at the call site');

// The name must match what it declares, or grepping for a value stops working.
const slug = s => s.toLowerCase().trim().replace(/'/g, '').replace(/%/g, 'pct')
    .replace(/#/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const misnamed = utilRules.filter(m => {
    const d = m[2].replace(/;\s*$/, ''); const i = d.indexOf(':');
    if (i < 0) return true;
    return m[1] !== 'u-' + slug(d.slice(0, i)) + '-' + slug(d.slice(i + 1));
});
ok(misnamed.length === 0,
   '⚠️ A6 EVERY UTILITY\u2019S NAME MATCHES ITS DECLARATION. Mismatched: ' +
   (misnamed.slice(0, 4).map(m => `${m[1]} { ${m[2]} }`).join(' | ') || 'none') +
   ' \u2014 these are VALUE-named on purpose (item 38 has not decided the roles yet), ' +
   'so a name that does not match its value makes the file ungreppable, which is ' +
   'the one property that justified value-naming in the first place');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- B. ⚠️ NO RAW COLOUR CAME BACK INTO THE MARKUP ---');
// Item 38 is still open for admin.html. This does not assert the colours are
// systematic yet — they are not. It asserts that the only colour left in markup
// is on an element Part C explains, so item 38 has ONE place to work.
//
// ⚠️ THE FIRST DRAFT OF THIS CHECK BANNED HEX IN MARKUP OUTRIGHT AND WENT RED
// AGAINST CORRECT CODE. Thirteen of the twenty retained declarations ARE colour —
// that is what a suppressed `button:hover` and a runtime-assigned status colour
// look like. A check that cannot tell deliberate residue from a leak is a check
// someone silences. It counts instead.
const hexTags = [...markup.matchAll(/<[^>]*\bstyle\s*=\s*"[^"]*#[0-9a-fA-F]{3,6}[^"]*"[^>]*>/g)]
    .map(m => m[0]);
const ALLOWED_COLOUR = new Set([
    // runtime .style.color / .background assignment — see Part C
    'export-books-status', 'autofill-status', 'save-title-status', 'custom-word-status',
    // inline value suppressing button:hover / a:hover — see Part C
    'save-title-btn', 'audit-book-btn', 'language-scan-btn', 'repair-chapter-order-btn',
    'update-next-btn', 'wizard-save-btn', 'replace-all-btn', 'replace-word-btn',
]);
const leaked = hexTags.filter(t => {
    const id = /\bid="([^"]*)"/.exec(t);
    if (id && ALLOWED_COLOUR.has(id[1])) return false;
    // the one anonymous case: the Firebase console link, whose colour suppresses a:hover
    return !(!id && /<a\b/.test(t));
});
ok(leaked.length === 0,
   '⚠️⚠️ B1 THE ONLY COLOUR LEFT IN MARKUP IS ON AN ELEMENT PART C EXPLAINS. Leaked: ' +
   (leaked.slice(0, 4).map(t => t.slice(0, 70)).join(' | ') || 'none') +
   ' \u2014 item 38 cannot retire a colour it cannot find, and a colour in markup is ' +
   'exactly the kind this page had 51 of. If a new one is genuinely load-bearing, ' +
   'add it to ALLOWED_COLOUR **with its reason**, never silently');
ok(hexTags.length <= 5,
   `B2 the colour residue has not grown (${hexTags.length} elements; it was 13 before the buttons were fixed)`);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- C. ⚠️⚠️ THE DECLARATIONS THAT MUST STAY INLINE, AND WHY ---');
//
// These are NOT leftovers. Extracting any of them changes behaviour, and two of
// them would break a feature outright. Each is pinned so a later round doing a
// "finish the job" pass cannot quietly remove them without this file going red.

// C1/C2 — the display trap. Both elements are shown again with
// `element.style.display = ''`, which clears the INLINE value and falls through
// to the stylesheet. Move `display:none` into a class and '' resolves to the
// class instead — so the element never appears again.
for (const [id, what] of [['tab-staff', 'the Staff tab, for building admins and super admins'],
                          ['build-list', 'the build panel']]) {
    const tag = new RegExp(`<[^>]*\\bid="${id}"[^>]*>`).exec(markup);
    ok(tag && /\bstyle\s*=\s*"[^"]*display\s*:\s*none/.test(tag[0]),
       `⚠️⚠️ C1 #${id} KEEPS display:none INLINE \u2014 ${what}. admin.js restores it with ` +
       `\`.style.display = ''\`, which clears the INLINE value and falls through to the ` +
       `stylesheet. Extract this into a class and '' resolves to the CLASS, so the ` +
       `element never appears again \u2014 silently, for the people who have the role`);
}

// C3 — ⚠️⚠️ THIS CHECK ASSERTED THE OPPOSITE FOR HALF OF ROUND 56, AND THE
// REVERSAL IS WORTH READING. The extraction first shipped with these five tints
// still inline, on the reasoning that reviving a dead :hover is a visible change
// and therefore Jake's to approve. Jake's answer: "You have buttons that don't
// work or are invisible? They need to be fixed." He was right and the caution was
// misplaced — a suppressed :disabled is a DEFECT, not a design decision waiting
// for sign-off. Ask about the ones that are genuinely a matter of taste; just fix
// the ones that are broken.
const TINTED = {
    'save-title-btn': 'btn-tint-save', 'update-next-btn': 'btn-tint-save',
    'audit-book-btn': 'btn-tint-audit', 'language-scan-btn': 'btn-tint-scan',
    'repair-chapter-order-btn': 'btn-tint-repair',
};
for (const [id, cls] of Object.entries(TINTED)) {
    const tag = new RegExp(`<button[^>]*\\bid="${id}"[^>]*>`, 's').exec(markup);
    ok(tag && !/\bstyle\s*=\s*"[^"]*background/.test(tag[0]),
       `⚠️⚠️ C3 #${id} CARRIES NO INLINE background. An inline value beats every ` +
       `selector, so putting one back re-kills button:disabled on a button admin.js ` +
       `really does disable for slow work`);
    ok(tag && new RegExp(`\\b${cls}\\b`).test(tag[0]) && /\bbtn-tint\b/.test(tag[0]),
       `C3b #${id} carries btn-tint and ${cls}`);
}

// C3c — ⚠️⚠️ THE MECHANISM, NOT JUST THE OUTCOME. `:not(:disabled)` is what lets a
// disabled button fall through to `button:disabled`. Written as a plain
// `.btn-tint-save { background: ... }` it TIES with `button:disabled` on
// specificity and, sitting later in the file, WINS — restoring the exact bug with
// nothing on screen to show for it.
for (const cls of new Set(Object.values(TINTED))) {
    ok(new RegExp(`button\\.${cls}:not\\(:disabled\\)`).test(cssNoComments),
       `⚠️⚠️ C3c .${cls} IS GUARDED BY :not(:disabled). Without it the rule ties ` +
       `with button:disabled and wins on source order, and the grey-out silently ` +
       `stops happening again`);
}
ok(/button\.btn-plain:hover/.test(cssNoComments),
   '⚠️ C3d .btn-plain has an explicit :hover rule. The bare class only TIES with ' +
   'button:hover, so without it the text-style toggles flood Carolina blue on hover');
ok(/filter:\s*brightness/.test(cssNoComments),
   'C3e the tint hover is a derived filter, not four new hex values \u2014 item 38 is ' +
   'still open on this page, and Round 55 was rightly pulled up for adding colour ' +
   'while improving something else');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- D. ⚠️⚠️ THE UTILITY BLOCK IS LAST. THIS IS THE ONE THAT ROTS SILENTLY ---');
//
// 69 declarations beat .lbtn / .l-field / .col / .l-label on SOURCE ORDER alone,
// because a single class ties with a single class. Nothing about the page looks
// broken if this regresses; it just reverts.
const firstUtil = cssNoComments.search(/\.u-[\w-]+\s*\{/);
ok(firstUtil > 0, 'D1 the utility block is found in the style block');

const afterBlock = cssNoComments.slice(firstUtil);
const nonUtil = [...afterBlock.matchAll(/(^|\})\s*([^{}@]+)\{/g)]
    .map(m => m[2].trim())
    .filter(s => s && !/^\.u-[\w-]+$/.test(s));
ok(nonUtil.length === 0,
   '⚠️⚠️ D2 NOTHING BUT UTILITY RULES APPEARS AFTER THE UTILITY BLOCK BEGINS. ' +
   'Found after it: ' + (nonUtil.slice(0, 4).join(' | ') || 'none') +
   ' \u2014 69 declarations beat .lbtn, .l-field, .col and .l-label on SOURCE ORDER ' +
   'alone, because a single class ties with a single class. A rule added below ' +
   'this block does not error and does not look broken: those 69 just quietly ' +
   'revert to the values they were written to override. ADD NEW RULES ABOVE THE ' +
   'BLOCK, or give them a second class');

// And the specific ties, named, so the reason survives the number.
for (const cls of ['lbtn', 'l-field', 'col']) {
    const at = cssNoComments.indexOf('.' + cls + ' {');
    ok(at >= 0 && at < firstUtil,
       `⚠️ D3 .${cls} is declared BEFORE the utility block. It ties with a utility ` +
       `on specificity, so its position is what decides which one wins`);
}

console.log('');
if (fail === 0) console.log(`PASS - ${pass} passing, 0 failing`);
else            console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
