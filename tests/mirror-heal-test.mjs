// mirror-heal-test.mjs — ⚠️⚠️ A SURFACE THAT READS A WEEK MUST HEAL THE MIRROR.
//
// ROADMAP 50. Round 58 added logdays.js's reconcile() to learn.js's
// loadGateState() and nowhere else. game.js and index.html paint the SAME weekly
// figure, from the SAME readWeek(), off the SAME per-browser ledger — and never
// healed it. A student who spent the day in Library or Adventure kept a mirror
// that was missing days the server vouches for, and planReads() turns a missing
// day into a skipped read, and a skipped read into a zero.
//
// ⚠️⚠️ NOTHING WENT RED, AND THAT IS THE PART THIS FILE EXISTS FOR.
// logdays-test.mjs drives reconcilePlan() and reconcile() as pure functions and
// asks whether they behave. It never asks whether anything CALLS them. Round 59
// found the same shape in a different file — `audit:versions` compared
// style.css's constant against style.css's own header and printed 0 problems for
// ten rounds. A fix needs a check pointing at its WIRING, not only at its logic.
//
// ⚠️ SO PART A IS A CLASS GUARD, NOT A LIST OF THREE FILES. It DISCOVERS the
// surfaces by looking for real readWeek() call sites and requires each one to
// reconcile. A fourth surface arriving unhealed is the defect this file is for;
// naming today's three would let that one through silently.
//
// ⚠️ AND PART B IS WHY IT COSTS NOTHING. reconcile() must be handed a user
// document the enclosing function ALREADY READ. Passing it a fresh getDoc()
// would make the heal a read tax on every student on every load, to catch a
// fault most of them never have — logdays.js's own docstring says so, and a
// harness that only checked "is it called" would wave that through.
//
// ⚠️ STRUCTURE, NOT DISTANCE — ROADMAP § GUARD ON STRUCTURE. The enclosing
// function is found by brace-matching, so a comment or a refactor that moves the
// call within its own function does not fail this file, and a call that escapes
// into a different function does.

import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

const results = [];
function check(name, fn) {
    try { fn(); results.push(['ok', name]); }
    catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
}

// ─── Comment stripping ───────────────────────────────────────────────────────
// ⚠️ REQUIRED, AND THE FIRST DRAFT DID NOT DO IT. Every one of these files
// discusses readWeek() and reconcile() at length in its header — logdays.js
// mentions readWeek() four times and calls it never. A harness that counts its
// own explanation as code reports on the prose.
//
// ⚠️ `://` IS PROTECTED BEFORE ANYTHING ELSE. Both page controllers import from
// https://www.gstatic.com/..., and a naive `//`-to-end-of-line strip eats the
// rest of that line and every import under it.
function stripComments(src) {
    return src
        .replace(/:\/\//g, ':\u0001\u0001')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\/\/[^\n]*/g, ' ')
        .replace(/:\u0001\u0001/g, '://');
}

const SHIPPED = readdirSync(ROOT)
    .filter(f => (f.endsWith('.js') || f.endsWith('.html')))
    .sort();

const code = new Map();
for (const f of SHIPPED) {
    try { code.set(f, stripComments(readFileSync(path.join(ROOT, f), 'utf8'))); }
    catch (_) { /* directories and unreadable files are not surfaces */ }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Every index at which `name(` is called, ignoring longer identifiers. */
function callSites(src, name) {
    const out = [];
    const re = new RegExp('(^|[^\\w.$])' + name + '\\s*\\(', 'g');
    let m;
    while ((m = re.exec(src))) out.push(m.index + m[1].length);
    return out;
}

/** The arguments of the call starting at `at`, split at top-level commas. */
function argsOf(src, at) {
    const open = src.indexOf('(', at);
    let depth = 0, i = open, start = open + 1;
    const args = [];
    for (; i < src.length; i++) {
        const c = src[i];
        if (c === '(' || c === '[' || c === '{') depth++;
        else if (c === ')' || c === ']' || c === '}') {
            depth--;
            if (depth === 0) { args.push(src.slice(start, i).trim()); break; }
        } else if (c === ',' && depth === 1) {
            args.push(src.slice(start, i).trim());
            start = i + 1;
        }
    }
    return args.filter(a => a !== '');
}

/**
 * The body of the innermost `function` whose braces enclose `at`.
 *
 * ⚠️ WALKS OUTWARD FROM THE CALL rather than taking the nearest preceding
 * `function` keyword. A nested callback declared above the call would win that
 * race and the check would pass against a body that reads nothing.
 */
function enclosingFunctionBody(src, at) {
    const starts = [];
    const re = /\bfunction\b/g;
    let m;
    while ((m = re.exec(src)) && m.index < at) starts.push(m.index);
    for (let k = starts.length - 1; k >= 0; k--) {
        const open = src.indexOf('{', starts[k]);
        if (open < 0) continue;
        let depth = 0;
        for (let i = open; i < src.length; i++) {
            const c = src[i];
            if (c === '{') depth++;
            else if (c === '}') {
                depth--;
                if (depth === 0) {
                    if (open < at && at < i) return src.slice(open, i);
                    break;
                }
            }
        }
    }
    return null;
}

const USER_DOC_READ = /getDoc\s*\(\s*doc\s*\(\s*db\s*,\s*['"]users['"]/;

// ─── A. EVERY SURFACE THAT READS A WEEK HEALS THE MIRROR ─────────────────────

const weekReaders = [...code.entries()]
    .filter(([f, src]) => f !== 'daylog.js' && callSites(src, 'readWeek').length > 0)
    .map(([f]) => f);

check('A1. the readWeek() surfaces are discovered, not assumed', () => {
    assert.ok(weekReaders.length >= 3,
        'expected at least three student surfaces calling readWeek(); found ' +
        weekReaders.join(', ') + '. If a surface was deliberately retired, this ' +
        'number moves down in the same round, with the reason written here');
});

for (const f of weekReaders) {
    check(`A2. ${f} calls reconcile() — a week reader that never heals its mirror ` +
          `shows a child fewer minutes than they typed`, () => {
        const sites = callSites(code.get(f), 'reconcile');
        assert.ok(sites.length > 0,
            f + ' reads a week off the per-browser ledger and never reconciles it ' +
            'against the server. ROADMAP 50: planReads() turns a day the mirror is ' +
            'missing into a skip, and a skip into a zero');
    });

    check(`A3. ${f} imports reconcile from logdays.js`, () => {
        const src = code.get(f);
        assert.match(src, /import\s*\{[^}]*\breconcile\b[^}]*\}\s*from\s*['"]\.\/logdays\.js['"]/,
            f + ' calls reconcile() without importing it from ./logdays.js');
    });
}

// ─── B. THE HEAL COSTS NO EXTRA READ ─────────────────────────────────────────

for (const f of weekReaders) {
    for (const at of callSites(code.get(f), 'reconcile')) {
        const src = code.get(f);
        const args = argsOf(src, at);

        check(`B1. ${f} passes reconcile() a uid AND a user document`, () => {
            assert.equal(args.length, 2,
                'reconcile(uid, userData) takes two arguments; found ' + args.length +
                ' — a one-argument call reconciles against nothing and silently ' +
                'reports no missing days, forever');
            assert.notEqual(args[1], 'null',
                'a null user document makes reconcilePlan() a no-op that still ' +
                'looks wired');
        });

        check(`B2. ${f} reconciles against a document its own function ALREADY read`, () => {
            const body = enclosingFunctionBody(src, at);
            assert.ok(body, 'could not brace-match the function enclosing the call');
            assert.match(body, USER_DOC_READ,
                'the enclosing function does not read users/{uid}. ⚠️ The heal must ' +
                'sit where the document is ALREADY in hand — logdays.js: "it must ' +
                'cost NO extra read, or it is a read tax on every student to catch ' +
                'a fault most never have"');
            assert.ok(!/await\s+reconcile\s*\(/.test(body),
                'reconcile() is synchronous; awaiting it reads as a network call ' +
                'to the next person and invites one');
        });

        check(`B3. ${f} binds the document from that read, not from a second one`, () => {
            const body = enclosingFunctionBody(src, at);
            const name = args[1];
            assert.match(name, /^[A-Za-z_$][\w$]*$/,
                'the user document must be a plain identifier already bound in this ' +
                'function; found the expression `' + name + '`, which is how a ' +
                'second read gets smuggled into the argument list');
            const bound = new RegExp(
                '(const|let|var)\\s+' + name.replace(/\$/g, '\\$') + '\\s*=[^;]*\\.data\\s*\\(\\s*\\)');
            assert.match(body, bound,
                '`' + name + '` is not assigned from a snapshot .data() call in this ' +
                'function body');
        });
    }
}

// ─── C. THE TWINS AGREE, AND THE PAIRING IS THE ASSERTION ────────────────────
//
// ⚠️ game.js and learn.js are the CHANGE ONE, CHANGE BOTH pair the project has
// been bitten by repeatedly — ROADMAP 27, item 6's learn.js half, "I'm done"
// shipping in School and not Library for eleven versions. ensureSince() and
// reconcile() read the same document in the same function on both pages, so the
// pairing is what gets guarded, not either call on its own.

for (const f of ['game.js', 'learn.js']) {
    check(`C1. ${f} keeps ensureSince() and reconcile() in the SAME function`, () => {
        const src = code.get(f);
        const rSites = callSites(src, 'reconcile');
        const eSites = callSites(src, 'ensureSince');
        assert.ok(rSites.length && eSites.length,
            'both calls must be present on this page');
        const bodies = rSites.map(at => enclosingFunctionBody(src, at));
        assert.ok(bodies.some(b => b && /ensureSince\s*\(/.test(b)),
            'reconcile() and ensureSince() have separated. They exist to share one ' +
            'user-document read; split apart, the second one becomes an extra read ' +
            'nobody notices paying for');
    });
}

check('C2. index.html reconciles ABOVE the classId guard', () => {
    // ⚠️ A STUDENT WITH NO CLASS STILL HAS A WEEK. resolveIndexGoals() returns
    // early when the user document has no classId, because a goal denominator is
    // all it wants. The heal is not about goals, so it must happen first — and
    // an unassigned student is exactly the one whose records get looked at.
    const src = code.get('index.html');
    const at = callSites(src, 'reconcile')[0];
    const body = enclosingFunctionBody(src, at);
    assert.ok(body, 'could not brace-match the function enclosing the call');
    const guard = body.search(/if\s*\(\s*!\s*\w+\.classId\s*\)\s*return/);
    const call = body.search(/(^|[^\w.$])reconcile\s*\(/);
    assert.ok(guard >= 0, 'the classId early-return this case is about has moved or gone');
    assert.ok(call < guard,
        'reconcile() sits below the classId early return, so every student without ' +
        'a class is skipped by the heal');
});

// ─── D. THE MODULE STILL CANNOT UNDERCOUNT ───────────────────────────────────
//
// ⚠️ THE SAFETY ARGUMENT FOR WIRING THIS ON THREE PAGES IS THAT reconcile() CAN
// ONLY ADD. logdays-test.mjs H3 proves that of the pure function; this asserts
// the property the WIRING depends on has not been quietly relaxed underneath it.

const store = new Map();
globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
    clear: () => store.clear(),
};
const { reconcilePlan, LOGDAYS_FIELD, LOGDAYS_SINCE } = await import('../logdays.js');

check('D1. reconcilePlan() only ever adds days and only moves `since` backward', () => {
    const local = { days: ['2026-09-02'], since: '2026-08-29' };
    const plan = reconcilePlan(local, {
        [LOGDAYS_FIELD]: ['2026-08-31', '2026-09-01', '2026-09-02'],
        [LOGDAYS_SINCE]: '2026-08-24',
    });
    for (const d of local.days) assert.ok(plan.days.includes(d), 'a mirrored day was dropped');
    assert.ok(plan.days.includes('2026-08-31') && plan.days.includes('2026-09-01'),
        'the two days the server vouched for were not healed in — this is ROADMAP ' +
        "50's exact shape: 26m of typing rendered as today's 6m");
    assert.ok(plan.since <= local.since,
        '`since` moved FORWARD, which reclassifies known days into skips');
});

check('D2. a mirror the server cannot improve on is left alone', () => {
    const local = { days: ['2026-09-01', '2026-09-02'], since: '2026-08-29' };
    const plan = reconcilePlan(local, {
        [LOGDAYS_FIELD]: ['2026-09-01'], [LOGDAYS_SINCE]: '2026-09-01',
    });
    assert.deepEqual(plan.added, [], 'nothing was missing and something was reported');
    assert.equal(plan.moved, false, '`since` moved on a document that knew less');
});

let failed = 0;
for (const [state, name] of results) {
    console.log(`  ${state === 'ok' ? 'ok  ' : 'FAIL'} ${name}`);
    if (state !== 'ok') failed++;
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
