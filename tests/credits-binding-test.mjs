// credits-binding-test.mjs v1.0.0 — A CREDIT LABEL MUST NAME THE PERSON IT SAYS.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE DEFECT — ROADMAP 48, reported by Jake 2026-09-02 with a screenshot
// ═══════════════════════════════════════════════════════════════════════════
//
// "I don't think the text prepared by field is working. I've updated this guy
// manually multiple times — it's not claude. This is a Global Grey book, so it's
// Julie (or Julia? I don't remember). But even when it's correctly pulling from
// Gutenberg in Admin, it's not showing up on the about page. It's ALWAYS
// claude....when it shouldn't be. You're awesome, but not that awesome."
//
// ⚠️⚠️ TWO INDEPENDENT DEFECTS PRODUCED ONE SYMPTOM, AND EITHER ALONE WAS ENOUGH
// TO MAKE THE FIELD LOOK BROKEN. That is why editing it in admin appeared to do
// nothing for weeks, and why a fix to one half would not have been visible.
//
//   (1) THE LABEL WAS BOUND TO THE WRONG FIELD, AT THREE SITES. "Text prepared
//       by" read `cleanedBy` in index.html's About panel, in game.js's classic
//       end credits, and in adventure-renderer.js's. `cleanedBy` is "Claude" on
//       essentially every book in the library, so the row said Claude on every
//       book no matter who had prepared the text. The page was faithfully
//       rendering a field nobody meant it to render.
//       ⚠️ ON THE ABOUT PANEL IT WAS ALSO A DUPLICATE — that panel already had a
//       correct "Cleaned up by" row four lines above, so it printed the same
//       name twice under two labels. THREE LABELS EXISTED FOR TWO PEOPLE.
//
//   (2) `preparedBy` NEVER REACHED index.html AT ALL. The library projection
//       carried source, rights, archiveUrl, originUrl and cleanedBy — and not
//       preparedBy. So `book.preparedBy` was undefined for every book ever
//       loaded, and the correct row that had been sitting in that panel since
//       v3.6.3 had NEVER ONCE RENDERED for anybody. admin.js has saved the field
//       correctly since v3.20.0 and still does.
//       ⚠️ ADVENTURE HAD THE SAME GAP ONE LAYER UP: game.js's payload passed only
//       `cleanedBy` into the renderer, so fixing that renderer's label alone
//       would have rendered nothing at all.
//
// ⚠️⚠️ WHY THIS FILE EXISTS AT ALL: NOTHING WATCHED THE CREDIT ROWS. A field that
// never reached the page survived eleven versions, and a label bound to the wrong
// variable survived at three sites SIMULTANEOUSLY. credits-test.mjs and
// credits-scroll-test.mjs both build fixtures containing `cleanedBy` and NEITHER
// ASSERTS A SINGLE LABEL. The credits are the project's ATTRIBUTION surface — the
// place a CC BY book's legal obligation is discharged and where "this text was
// modified" is disclosed — and it was the least tested thing in the repo.
//
// ⚠️ IT ASSERTS THE PAIRING, NEVER THE PRESENCE. "Does the string 'Text prepared
// by' appear in game.js" would have passed against the broken build, on all three
// files, for the whole eleven versions. Every assertion here reads a
// [label, expression] PAIR and checks which field the expression names.
//
// PARTS
//   A — the pairing, on all three surfaces. The canonical map, one label per
//       person, asserted against the pairs the code actually constructs.
//   B — no label is bound to two fields and no field appears under two labels
//       within one surface. This is the DUPLICATE half of defect (1).
//   C — ⚠️ THE CLASS GUARD FOR DEFECT (2): every `book.<field>` the About panel
//       renders is carried by the library projection. Catches the NEXT field
//       someone adds to that panel and forgets to project, not just this one.
//   D — the same, one layer up: every `detail.<field>` creditsContent() reads is
//       supplied by game.js's payload.
//   E — BEHAVIOURAL, and the only end-to-end assertion available here.
//       creditsContent() is exported and pure, so it is driven with a real
//       object whose values are all distinguishable, and the rendered rows are
//       read back. A structural test can be fooled by a shape it did not expect;
//       this one cannot.
//
// ⚠️ MUTATION-VERIFIED AGAINST THE PRE-FIX BUILD (the Round 57 upload:
// index.html v3.16.0, game.js v3.46.0, adventure-renderer.js v1.5.4). That build
// reports 12 FAILING ACROSS PARTS A, B, C AND E — including E1 reproducing Jake's
// report exactly: "TEXT PREPARED BY" renders the cleaner's name.
//
// ⚠️ PART D PASSES ON THE BROKEN BUILD, AND THAT IS CORRECT, NOT A GAP. D asks
// whether the payload supplies what the renderer READS; the broken renderer read
// `cleanedBy`, which the payload did carry. D guards the failure that would have
// happened NEXT — fixing the renderer's label alone, leaving `preparedBy` out of
// the payload, and shipping a row that renders nothing. Verified separately by
// deleting that line from the fixed build: 1 failing, D2. Part C was verified the
// same way by deleting `cleanedBy` from the projection: 1 failing, C2.
//
// ⚠️ I FIRST WROTE "11 failing across Parts A, B, C, D and E" HERE FROM MEMORY
// AND IT WAS WRONG IN BOTH NUMBERS. The count is 12 and D is not among them.
// Round 57's other harness made the same mistake in the same afternoon — a
// coverage claim written before it was measured. MEASURE, THEN WRITE.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };
const eq = (msg, got, want) => ok(got === want, `${msg} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const src = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const game  = src('game.js');
const index = src('index.html');
const adv   = src('adventure-renderer.js');

// ⚠️ COMMENTS ARE STRIPPED BEFORE ANY MATCHING, AND THIS IS NOT OPTIONAL HERE.
// The fixes carry long comment blocks that QUOTE the old wrong bindings verbatim
// — "used to read `detail.cleanedBy`" sits four lines above the corrected line.
// An assertion that reads comments measures the documentation, not the program;
// midnight-test.mjs B4 and guest-merge-test.mjs C4/C5/C7 both learned this the
// hard way, and this file would have failed on its own fix without it.
const strip = s => s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');

// Balanced-brace slice of a named function, same lifter as guest-merge-test.mjs
// and live-period-test.mjs.
function lift(text, name) {
    const start = text.indexOf('function ' + name + '(');
    if (start < 0) return null;
    let i = text.indexOf('{', start), depth = 0;
    for (; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') { depth--; if (!depth) break; }
    }
    return text.slice(start, i + 1);
}

// ⚠️ THE PAIR EXTRACTOR IS THE WHOLE INSTRUMENT. All three surfaces build their
// credits as [label, expression] tuples — push([...]) in two of them, an array
// literal in the third — so one reader covers all three and none of them is
// matched by proximity.
function pairs(region) {
    const out = [];
    const re = /\[\s*(['"])([^'"]+)\1\s*,\s*([^\]]+?)\s*\]/g;
    let m;
    while ((m = re.exec(region)) !== null) out.push([m[2], m[3]]);
    return out;
}

// Which book field an expression names. Deliberately narrow: it looks for the
// known credit fields only, so an expression naming none of them reports '' and
// fails loudly rather than being quietly accepted.
const FIELDS = ['preparedBy', 'cleanedBy', 'source', 'rights', 'author',
                'archiveUrl', 'originUrl', 'title'];
const fieldOf = expr => FIELDS.find(f => new RegExp('\\.' + f + '\\b').test(expr)) || '';

// ⚠️ THE CANONICAL MAP. TWO PEOPLE, TWO LABELS, AND THE THIRD LABEL IS GONE.
// Before Round 57 there were THREE labels for these two people — "Prepared by",
// "Cleaned up by" and "Text prepared by" — and the third was a second alias
// pointing at the wrong one of the first two. Jake reads "Text prepared by" as
// the SOURCE preparer (that is the wording in his screenshot), so that is the
// wording kept, and it names `preparedBy`.
// ⚠️ "Cleaned up by" IS NOT OPTIONAL AND MUST NEVER BE FOLDED INTO THE OTHER.
// It is a DISCLOSURE that this text was modified, not only a courtesy.
const CANON = {
    'Text prepared by': 'preparedBy',
    'Cleaned up by':    'cleanedBy',
    'Source':           'source',
    'License':          'rights',
    'By':               'author',
};

// ─── A. the pairing, on all three surfaces ─────────────────────────────────
console.log('\n─── A. ⚠️⚠️ EVERY CREDIT LABEL NAMES THE FIELD IT CLAIMS TO ───');

const SURFACES = [];
{
    // index.html — the About panel. Bounded by the metaRows array and the point
    // it is turned into markup, so unrelated pushes elsewhere cannot leak in.
    const s = index.indexOf('const metaRows = []');
    const e = index.indexOf('const metaHTML = metaRows.length', s);
    ok(s > 0 && e > s, 'A0a the About panel\u2019s metaRows region is locatable in index.html');
    SURFACES.push(['index.html About panel', strip(index.slice(s, e))]);
}
{
    const fn = lift(game, 'renderClassicCredits');
    ok(!!fn, 'A0b renderClassicCredits() is locatable in game.js');
    SURFACES.push(['game.js classic credits', strip(fn || '')]);
}
{
    const fn = lift(adv, 'creditsContent');
    ok(!!fn, 'A0c creditsContent() is locatable in adventure-renderer.js');
    SURFACES.push(['adventure-renderer.js credits', strip(fn || '')]);
}

for (const [name, region] of SURFACES) {
    const ps = pairs(region).filter(([label]) => label in CANON);
    ok(ps.length >= 3, `A1 ${name}: at least three canonical credit rows found (got ${ps.length})`);
    for (const [label, expr] of ps) {
        eq(`A2 ${name}: "${label}" names the right field`, fieldOf(expr), CANON[label]);
    }
    // ⚠️ THE RETIRED THIRD LABEL MUST NOT COME BACK. "Prepared by" was the
    // About panel's original name for `preparedBy` and it never rendered once,
    // because the field was not projected; reviving it alongside "Text prepared
    // by" recreates the two-labels-one-person state that hid this defect.
    ok(!pairs(region).some(([l]) => l === 'Prepared by'),
       `A3 ${name}: the retired third label "Prepared by" has not reappeared`);
}

// ─── B. one label per person, one person per label ─────────────────────────
console.log('\n─── B. ⚠️ NO ROW IS PRINTED TWICE UNDER TWO NAMES ───');
for (const [name, region] of SURFACES) {
    const ps = pairs(region).filter(([label]) => label in CANON);
    const byLabel = ps.map(([l]) => l);
    const byField = ps.map(([, e]) => fieldOf(e)).filter(Boolean);
    eq(`B1 ${name}: no label appears twice`,
       byLabel.length, new Set(byLabel).size);
    // ⚠️ THIS IS THE ASSERTION THAT WOULD HAVE CAUGHT THE ABOUT PANEL. It printed
    // `cleanedBy` under BOTH "Cleaned up by" and "Text prepared by" — two rows,
    // one field, the same name shown twice, which is visible in Jake's
    // screenshot and which nobody read as a bug for eleven versions.
    eq(`B2 ${name}: no FIELD is rendered under two different labels`,
       byField.length, new Set(byField).size);
    // Both people are credited wherever any person is credited at all.
    const has = f => byField.includes(f);
    ok(has('preparedBy') === has('cleanedBy'),
       `B3 ${name}: preparedBy and cleanedBy are credited together \u2014 the cleaner\u2019s row is a MODIFICATION DISCLOSURE and is never dropped to make room`);
}

// ─── C. the class guard for the missing projection ─────────────────────────
console.log('\n─── C. ⚠️⚠️ EVERY FIELD THE ABOUT PANEL READS IS ACTUALLY PROJECTED ───');
{
    // ⚠️ THIS IS THE HALF THAT ACTUALLY HID FOR ELEVEN VERSIONS, and it is
    // asserted as a CLASS rather than as `preparedBy`. index.html does not hand
    // the About panel a Firestore document: it hands it an entry from `allBooks`,
    // which is a hand-written PROJECTION of a few fields. A row reading a field
    // the projection omits renders nothing, silently, forever — and admin can go
    // on saving that field correctly the whole time, which is exactly what makes
    // it look like a data problem instead of a code one.
    // ⚠️ ANCHORED ON `allBooks.push({`, WHICH IS WHAT THE PROJECTION ACTUALLY IS.
    // My first attempt looked for `const b = {` and matched nothing, so C0 failed
    // and every C2 failed with it — a locator that misses reports the whole
    // surface as broken, which is loud enough to notice but says the wrong thing.
    // If this anchor ever stops matching, C0 fails FIRST and on its own.
    const projStart = index.indexOf('allBooks.push({');
    const projEnd = index.indexOf('aboutIds:', projStart);
    ok(projStart > 0 && projEnd > projStart, 'C0 the library projection is locatable in index.html');
    const projection = strip(index.slice(projStart, projEnd));

    const s = index.indexOf('const metaRows = []');
    const e = index.indexOf('const metaHTML = metaRows.length', s);
    const panel = strip(index.slice(s, e));

    const read = [...new Set([...panel.matchAll(/\bbook\.([A-Za-z]+)\b/g)].map(m => m[1]))];
    ok(read.length >= 4, `C1 the About panel reads at least four book fields (got ${read.length})`);
    for (const f of read) {
        ok(new RegExp('\\b' + f + '\\s*:').test(projection),
           `C2 \`book.${f}\` is carried by the library projection \u2014 a field the panel reads and the projection omits is undefined for EVERY book, and the row never renders for anybody`);
    }
}

// ─── D. the same gap, one layer up ─────────────────────────────────────────
console.log('\n─── D. ⚠️ THE ADVENTURE PAYLOAD SUPPLIES WHAT THE RENDERER READS ───');
{
    // adventure-renderer.js is handed a `detail` object built in game.js. Fixing
    // a label in the renderer is worth nothing if the payload never carried the
    // field — which is precisely what happened to `preparedBy`.
    const fn = strip(lift(adv, 'creditsContent') || '');
    const read = [...new Set([...fn.matchAll(/\bdetail\.([A-Za-z]+)\b/g)].map(m => m[1]))];
    ok(read.length >= 4, `D1 creditsContent() reads at least four detail fields (got ${read.length})`);

    const s = game.indexOf("kind: 'credits'") >= 0
        ? game.lastIndexOf('showStatsModal', game.indexOf("kind: 'credits'"))
        : -1;
    // Bound the payload by the credits emit itself: the object literal that
    // carries author/source/rights into the renderer.
    const anchor = game.indexOf('rights:     bookMetadata');
    const pStart = game.lastIndexOf('{', anchor);
    const pEnd   = game.indexOf('});', anchor);
    ok(anchor > 0 && pEnd > pStart, 'D0 the adventure credits payload is locatable in game.js');
    const payload = strip(game.slice(pStart, pEnd));

    for (const f of read) {
        ok(new RegExp('\\b' + f + '\\s*:').test(payload),
           `D2 \`detail.${f}\` is supplied by game.js\u2019s credits payload \u2014 a field the renderer reads and the payload omits renders NOTHING, however correct the label is`);
    }
}

// ─── E. behavioural: drive the one builder that is importable ──────────────
console.log('\n─── E. ⚠️ creditsContent() IS PURE AND EXPORTED, SO DRIVE IT FOR REAL ───');
{
    // ⚠️ EVERY VALUE IS DISTINGUISHABLE ON PURPOSE. The whole defect was one
    // person's name appearing where another's belonged, and a fixture that used
    // "Claude" for both would have passed against the broken build. These are
    // Jake's real case: a Global Grey book whose text was prepared by somebody
    // else entirely and cleaned up by Claude.
    const { creditsContent } = await import('../adventure-renderer.js');
    const rows = creditsContent({
        title:      'The Phoenix and the Carpet',
        author:     'E. Nesbit',
        source:     'Global Grey',
        rights:     'Public domain (United States) & CC0 1.0',
        preparedBy: 'JULIA-THE-PREPARER',
        cleanedBy:  'CLAUDE-THE-CLEANER',
    });

    // Rows alternate {kind:'label'} / {kind:'value'}; pair them back up.
    const got = {};
    for (let i = 0; i < rows.length - 1; i++) {
        if (rows[i].kind === 'label' && rows[i + 1].kind === 'value') {
            got[rows[i].text] = rows[i + 1].text;
        }
    }
    eq('E1 ⚠️⚠️ "TEXT PREPARED BY" renders the PREPARER, not the cleaner',
       got['TEXT PREPARED BY'], 'JULIA-THE-PREPARER');
    eq('E2 "CLEANED UP BY" renders the cleaner',
       got['CLEANED UP BY'], 'CLAUDE-THE-CLEANER');
    eq('E3 the cleaner\u2019s name appears exactly once in the whole render',
       Object.values(got).filter(v => v === 'CLAUDE-THE-CLEANER').length, 1);
    eq('E4 Source survives', got['SOURCE'], 'Global Grey');

    // ⚠️ A BOOK WITH NO PREPARER MUST NOT BORROW THE CLEANER'S NAME. The filter
    // drops empty rows, and the failure mode being guarded is a fallback like
    // `preparedBy || cleanedBy` looking helpful and re-creating the defect.
    const bare = creditsContent({ title: 'X', cleanedBy: 'CLAUDE-THE-CLEANER' });
    const bareLabels = bare.filter(r => r.kind === 'label').map(r => r.text);
    ok(!bareLabels.includes('TEXT PREPARED BY'),
       'E5 ⚠️ a book with no preparer shows NO preparer row \u2014 it must never fall back to the cleaner');
}

console.log(`\n${pass} passing, ${fail} failing.`);
process.exit(fail ? 1 : 0);
