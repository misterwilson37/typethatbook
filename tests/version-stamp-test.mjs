// version-stamp-test.mjs v1.3.0 — Round 27 (Chicago), Round 28 (Daugherty),
// Round 41 (Rem-Sho), Round 58 (Emerson).
//
// v1.3.0 — ⚠️⚠️ SECTION D WAS NOT CHECKING WHAT IT SAID IT CHECKED. It calls
//          itself "the three mirrors of the source list agree" and D2's own
//          failure message tells the next round that section D checks all
//          three — but both of D's loops ended at THIS harness's list, so no
//          assertion ever pointed INTO tools/audit-versions.mjs. That list
//          could lose an entry and D stayed green.
//          ⚠️ IT HAD ALREADY LOST ONE. rights-ladder.js shipped in Round 57
//          into versions.js and into this file, and not into the audit tool,
//          so `npm run audit:versions` reported "0 problems" while that
//          module's stamp went unread — the figure every handoff quotes as
//          evidence the build is honest. Mutation-verified both ways: the new
//          assertion goes red against the repo exactly as it arrived, and with
//          the entry restored the audit tool catches a 9.9.9-against-v1.0.0
//          constant it previously passed.
//          ⚠️ THE GENERAL FORM: a mirror needs a check pointing AT it. Two
//          checks running away from the same list prove nothing about the
//          lists they came from, however many of them there are.
//
// v1.1.0 — ⚠️⚠️ SECTION E IS A FAILURE NOW, NOT A NOTE — AND READ WHY BEFORE
//          TOUCHING IT. The block below says notes stay notes because a suite
//          that is red for a known reason trains everyone to ignore red. That
//          reasoning was never about header budgets being unimportant; it was
//          about the count being FOURTEEN. Round 28 took the count to ZERO —
//          by raising the line budget (it was wrong: flat 60 against files
//          from 51 to 8,000 lines) and by moving 45 stale changelog entries to
//          CHANGELOG.md § ARCHIVED FILE HEADERS (they were right: game.js had
//          40 entries in one comment block). A budget at zero violations can
//          be a ratchet. A budget at fourteen can only be noise.
//          ⚠️ THE CONDITION FOR DEMOTING IT BACK IS NOT "it went red". It is
//          "it went red and the budget is wrong". If a header genuinely needs
//          the room, raise HEADER_FLOOR_LINES — in versions.js FIRST, then the
//          two mirrors. If it is a changelog run, move it to CHANGELOG.md.
//
// ⚠️⚠️ WHY THIS FILE EXISTS, AND IT IS NOT "TIDINESS".
//
// On 2026-08-21 Round 26 shipped four files whose RUNTIME VERSION CONSTANT did
// not match the code inside them:
//
//     game.js     constant 3.38.0   header 3.42.0   (six releases stale)
//     learn.js    constant 2.23.1   header 2.27.0   (five releases stale)
//     hud.js      constant 1.2.0    header 1.4.0    (two, across a BREAKING change)
//     style.css   body::before v3.6.1   header v3.7.2   (three)
//
// The constant is not decoration. `versions.js` parses it out of the DEPLOYED
// file to build the footer panel, which is the only way Jake — who has no
// command line — can tell what is actually running in a classroom. And
// ROADMAP's cutover checklist says, in capitals, *check the footer version
// before concluding anything*. A correctly deployed build was going to report
// the PRE-FIX version of the stale-day data-corruption fix, which is precisely
// the reading that means "the fix never reached the browser".
//
// ⚠️ THE CHECK ALREADY EXISTED AND NOBODY RAN IT. `tools/audit-versions.mjs`
// has reported "one of the two is a lie" the entire time, via
// `npm run audit:versions` — a SEPARATE command, outside `npm test`. That is
// the whole lesson: **a guard that is not in the suite is a guard nobody runs.**
// This file is that check, moved inside the thing rounds actually execute.
//
// ⚠️ IT USED TO BE DELIBERATELY NARROWER THAN THE AUDIT TOOL, and v1.1.0 closed
// that gap. The reason for the gap was fourteen outstanding header-budget
// violations: failing on those would have left `npm test` permanently red, and
// invariant 54 is explicit that an accepted red hides the next real failure.
// That was not hypothetical — hud-test.mjs and drill-filter-test.mjs were BOTH
// red in the repo Round 27 was handed, and the second had been catching Round
// 27's own defect since Round 25.
//
// Round 28 removed the reason rather than the check. Both budgets are at zero
// violations, so both are enforced. **A stamp that lies is a failure and so is
// a header over budget.** ROADMAP item 9 is closed.
//
// ⚠️ WHAT THIS CANNOT CATCH, stated so nobody trusts it further than it goes.
// It compares what a file claims against what the same file claims elsewhere.
// If BOTH the header and the constant are stale together, this passes and the
// file is still lying about its code. audit-versions.mjs's own header records
// exactly that happening to adventure-renderer.js in Round 5, and only a
// behavioural test found it. This closes the two-labels-disagree hole. It does
// not make a version stamp true.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const notes = [];
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };

// ⚠️ MIRRORED FROM versions.js, LIKE tools/audit-versions.mjs. If the three ever
// disagree, versions.js is the one that ships and is therefore the one that is
// right. A missing entry here is a file nobody is checking — see D.
const SOURCES = [
    { file: 'game.js',               pattern: /\bconst\s+VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'learn.js',              pattern: /\bconst\s+LEARN_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'keyboard.js',           pattern: /\bexport\s+const\s+KB_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'adventure-renderer.js', pattern: /\bexport\s+const\s+RENDERER_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'admin.js',              pattern: /\bconst\s+ADMIN_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'lessons-admin.js',      pattern: /window\.LESSONS_ADMIN_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'staff-admin.js',        pattern: /window\.STAFF_ADMIN_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'firebase-config.js',    pattern: /\bexport\s+const\s+CONFIG_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'stats-wal.js',          pattern: /\bexport\s+const\s+STATS_WAL_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'session-log.js',        pattern: /\bexport\s+const\s+SESSION_LOG_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'hud.js',                pattern: /\bexport\s+const\s+HUD_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'chapter-position.js',   pattern: /\bexport\s+const\s+CHAPTER_POSITION_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'variety-floor.js',      pattern: /\bexport\s+const\s+VARIETY_FLOOR_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'rights-ladder.js',      pattern: /\bexport\s+const\s+RIGHTS_LADDER_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'versions.js',           pattern: /\bexport\s+const\s+VERSIONS_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'update-gate.js',        pattern: /\bexport\s+const\s+UPDATE_GATE_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'daylog.js',             pattern: /\bexport\s+const\s+DAYLOG_VERSION\s*=\s*["']([^"']+)["']/ },
    // ⚠️ ROADMAP 9b, Round 27. Three modules extracted in Rounds 25–26 that the
    // footer could not see. celebrate.js and receipt.js had no constant at all
    // until this commit. ⚠️ THIS LIST IS MIRRORED IN tools/audit-versions.mjs
    // AND tests/version-stamp-test.mjs — section D of that harness FAILS if the
    // three ever disagree, so all three move together or none do.
    { file: 'drill-filter.js',       pattern: /\bexport\s+const\s+DRILL_FILTER_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'celebrate.js',          pattern: /\bexport\s+const\s+CELEBRATE_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'receipt.js',            pattern: /\bexport\s+const\s+RECEIPT_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'lesson-gate.js',        pattern: /\bexport\s+const\s+LESSON_GATE_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'run-grade.js',          pattern: /\bexport\s+const\s+RUN_GRADE_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'read-meter.js',         pattern: /\bexport\s+const\s+READ_METER_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'logdays.js',            pattern: /\bexport\s+const\s+LOGDAYS_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'settings-panel.js',     pattern: /\bexport\s+const\s+SETTINGS_PANEL_VERSION\s*=\s*["']([^"']+)["']/ },
    { file: 'style.css',             pattern: /style\.css\s+v([0-9][^\s*]*)/ },
    { file: 'adventure.css',         pattern: /adventure\.css\s+v([0-9][^\s*]*)/ },
    { file: 'game.html',             pattern: /game\.html\s+v([0-9][^\s\->]*)/ },
    { file: 'learn.html',            pattern: /learn\.html\s+v([0-9][^\s\->]*)/ },
    { file: 'reports.html',          pattern: /reports\.html\s+v([0-9][^\s\->]*)/ },
    { file: 'admin.html',            pattern: /admin\.html\s+v([0-9][^\s\->]*)/ },
];
// The CSS files carry their header in the same comment the pattern above reads,
// so header-vs-constant is not a meaningful question for them. The HTML files
// have no runtime constant separate from their comment either.
// ⚠️ EXEMPT FROM SECTION A ONLY — they are still parsed for a version and still
// drift-checked. Section A compares a RUNTIME CONSTANT against a `//` header
// comment, and none of these files has either: the stylesheets carry a CSS
// comment, the markup shells an HTML one. Adding a file here says "this has no
// runtime constant to disagree with", not "stop watching it".
const HEADER_EXEMPT = ['style.css', 'adventure.css', 'game.html', 'learn.html',
                       'reports.html', 'admin.html'];
// ⚠️ MIRRORS versions.js v1.12.0 AND tools/audit-versions.mjs v1.4.0. Three
// copies; section D fails if the SOURCES lists disagree, but nothing checks
// these three numbers against each other — change versions.js first, then both
// mirrors, in the same commit.
const HEADER_FLOOR_LINES = 220;
const HEADER_LINES_RATIO = 0.08;
const HEADER_MAX_ENTRIES = 8;
const headerLineBudget = body =>
    Math.max(HEADER_FLOOR_LINES, Math.ceil(body * HEADER_LINES_RATIO));

const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── A. ⚠️ THE RUNTIME CONSTANT MATCHES THE HEADER COMMENT ───');
// ═══════════════════════════════════════════════════════════════════════════
// This is the whole point of the file. Everything below is supporting work.
for (const { file, pattern } of SOURCES) {
    let src;
    try { src = read(file); }
    catch { ok(false, `${file} — could not be read at all`); continue; }

    const version = (src.match(pattern) || [])[1];
    ok(!!version, `${file} has a machine-readable version stamp`);
    if (!version) continue;

    if (HEADER_EXEMPT.includes(file)) continue;

    // The header claim is the FIRST line of the leading comment block that
    // names this file AND carries a version.
    //
    // ⚠️ THIS IS DELIBERATELY LOOSE, AND IT TOOK TWO FALSE POSITIVES TO GET
    // THERE — recorded so nobody tightens it back up:
    //   · `lessons-admin.js` opens `// lessons-admin.js — TypeThatBook Lesson
    //     Panel v1.13.1`. A title sits between the name and the version.
    //   · `keyboard.js` puts its stamp on line THREE, under two lines of
    //     description. "First line of the file" is not the convention.
    // Both are honest headers. A checker that cries wolf on them is worse than
    // no checker, because the next round learns to skip section A.
    const esc = file.replace(/\./g, '\\.');
    const headLines = [];
    for (const line of src.split('\n')) {
        if (line.startsWith('//') || line.trim() === '') headLines.push(line); else break;
    }
    let header;
    for (const line of headLines) {
        const re = new RegExp(esc + '.*?v([0-9][\\d.]*)', 'g');
        let m, last;
        while ((m = re.exec(line)) !== null) last = m[1];   // last wins: titles may hold digits
        if (last) { header = last; break; }
    }
    ok(!!header, `${file} declares its version in its header comment`);
    if (!header) continue;

    ok(version === header,
       `⚠️ ${file}: constant says v${version}, header says v${header} — ONE OF THE TWO IS A LIE. ` +
       `The constant is what versions.js parses and what the footer renders, so fix whichever is wrong ` +
       `and bump BOTH in the same edit.`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── B. ⚠️ style.css\'s TWO STAMPS AGREE ───');
// ═══════════════════════════════════════════════════════════════════════════
// The stylesheets have the same defect in a different shape: the header comment
// and the `body::before` content are two hand-maintained copies of one number.
// ⚠️ drill-filter-test.mjs F12 ALREADY ASSERTS THIS and was red on delivery.
// It is duplicated here on purpose — F12 lives in a harness about drill word
// filtering, where nobody looking for a version problem would ever find it, and
// the next round to touch style.css should trip over this file instead.
{
    const css = read('style.css');
    const hdr   = (css.match(/style\.css v([\d.]+)/) || [])[1];
    const stamp = (css.match(/body::before\s*\{\s*content:\s*"v([\d.]+)"/) || [])[1];
    ok(!!hdr,   'style.css declares a version in its header');
    ok(!!stamp, 'style.css carries a body::before machine-readable stamp');
    ok(stamp === hdr,
       `⚠️ style.css: body::before says v${stamp}, header says v${hdr}. This is the ONLY copy ` +
       `versions.js can read back out of a LIVE page to spot a stale cached stylesheet.`);
}
{
    const css = read('adventure.css');
    const hdr   = (css.match(/adventure\.css v([\d.]+)/) || [])[1];
    const stamp = (css.match(/body::after\s*\{\s*content:\s*"v([\d.]+)"/) || [])[1];
    ok(!!hdr, 'adventure.css declares a version in its header');
    if (stamp) {
        ok(stamp === hdr,
           `⚠️ adventure.css: body::after says v${stamp}, header says v${hdr}`);
    } else {
        notes.push('adventure.css has no body::after stamp — versions.js cannot read its APPLIED version');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── C. ⚠️ THE VERSION PINS POINT AT VERSIONS THAT EXIST ───');
// ═══════════════════════════════════════════════════════════════════════════
// HANDOFF §1: three pins exist, and "bump either module and every pin on it
// moves in the same commit".
//
// ⚠️⚠️ THE PIN ON hud.js FAILED TO FIRE IN ROUND 26 AND THAT IS THE SUBTLEST
// PART OF THIS WHOLE DEFECT. hud-test.mjs asserted `HUD_VERSION === '1.2.0'`
// precisely so that bumping hud.js would go red and force a human to look. It
// stayed green — because the constant was never bumped either. The pin was
// checking a number a human maintains by hand, so it could only ever be as
// honest as that number. It went two releases, through a BREAKING return-shape
// change, without a murmur, and hud-test.mjs crashed on the old API instead.
//
// A pin catches "you bumped the module and forgot the harness". It cannot catch
// "you forgot to bump the module". Section A is what catches that. Both are
// needed and neither replaces the other.
{
    const PINS = [
        ['tests/session-merge-test.mjs', 'session-log.js', /\bexport\s+const\s+SESSION_LOG_VERSION\s*=\s*["']([^"']+)["']/],
        ['tests/open-unit-test.mjs',     'session-log.js', /\bexport\s+const\s+SESSION_LOG_VERSION\s*=\s*["']([^"']+)["']/],
        ['tests/hud-test.mjs',           'hud.js',         /\bexport\s+const\s+HUD_VERSION\s*=\s*["']([^"']+)["']/],
    ];
    for (const [harness, module, modPattern] of PINS) {
        const actual = (read(module).match(modPattern) || [])[1];
        const hSrc   = read(harness);
        // The pin is an equality assertion against a literal version string.
        const pinned = [...hSrc.matchAll(/_VERSION\s*===\s*'([\d.]+)'/g)].map(m => m[1]);
        ok(pinned.length > 0, `${harness} still carries a version pin on ${module}`);
        if (!pinned.length) continue;
        ok(pinned.every(p => p === actual),
           `⚠️ ${harness} pins ${module} at v${pinned.join('/')} but the module is v${actual} — ` +
           `move the pin in the same commit as the bump.`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── D. ⚠️ THE THREE MIRRORS OF THE SOURCE LIST AGREE ───');
// ═══════════════════════════════════════════════════════════════════════════
// versions.js, tools/audit-versions.mjs and this file each carry a copy of
// SOURCES. HANDOFF §0.-13.E's finding was that FOUR hand-maintained twins failed
// in one day; this file would be the next one if nobody checked it. A file
// missing from a list is a file whose stamp nobody is watching — which is how
// hud.js, session-log.js and stats-wal.js went unchecked until v1.1.0 of the
// audit tool added them.
{
    const names = src => [...src.matchAll(/\{\s*file:\s*'([^']+)'/g)].map(m => m[1]);
    const mine    = SOURCES.map(s => s.file);
    const shipped = names(read('versions.js'));
    const audit   = names(read('tools/audit-versions.mjs'));

    ok(shipped.length > 0, 'versions.js exposes a readable SOURCES list');
    for (const f of shipped) {
        ok(mine.includes(f),
           `⚠️ versions.js checks ${f} and this harness does not — add it to SOURCES here`);
    }
    for (const f of audit) {
        ok(mine.includes(f),
           `⚠️ tools/audit-versions.mjs checks ${f} and this harness does not`);
    }
    // ⚠️⚠️ THIS DIRECTION WAS MISSING UNTIL ROUND 58, AND ITS ABSENCE HAD ALREADY
    // COST SOMETHING. Both loops above end at `mine`, so nothing ever asserted a
    // file INTO tools/audit-versions.mjs — that list could quietly lose entries
    // and this section stayed green while calling itself "the three mirrors
    // agree". D2's own failure message told the next round that section D checks
    // all three, which was false when it was written.
    //
    // What it cost: rights-ladder.js shipped in Round 57, was added to
    // versions.js and to this harness, and was NOT added to the audit tool.
    // `npm run audit:versions` — the offline instrument every handoff quotes as
    // "0 problems" — was therefore not checking that module's stamp at all.
    // Verified by mutation: with the constant set to 9.9.9 against a v1.0.0
    // header, the audit printed 0 problems and this harness printed the failure.
    //
    // ⚠️ THE ASYMMETRY BELOW IS STILL DELIBERATE AND THIS IS NOT AN EXCEPTION TO
    // IT. That one is about versions.js FETCHING over HTTP. audit-versions.mjs
    // and this harness both read the same files off the same disk, and
    // audit-versions.mjs's own header calls itself a mirror of versions.js, so
    // there is no file versions.js can legitimately carry that it cannot.
    for (const f of shipped) {
        ok(audit.includes(f),
           `⚠️ versions.js checks ${f} and tools/audit-versions.mjs does not — ` +
           `npm run audit:versions will report "0 problems" while that file's ` +
           `stamp goes unread. Add it to tools/audit-versions.mjs's SOURCES.`);
    }
    // ⚠️ NOT symmetrical on purpose: versions.js FETCHES over HTTP and may
    // legitimately carry a file this offline check cannot reach.
    for (const f of mine) {
        if (!shipped.includes(f)) {
            notes.push(`${f} is checked here but not by versions.js — the footer will not report it`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─── D2. ✅ EVERY SHARED MODULE THE WRITERS IMPORT IS WATCHED ───');
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ CLOSED IN ROUND 27 ON JAKE'S RULING (ROADMAP 9b). Rounds 25 and 26
// extracted drill-filter.js, celebrate.js and receipt.js and none reached
// versions.js's SOURCES, so the footer could not report them and a stale cached
// copy in a classroom was invisible. celebrate.js and receipt.js had no runtime
// constant at all.
//
// ⚠️ THIS ASSERTION IS THE RATCHET, NOT THE FIX. The fix was a one-time wiring;
// this stops the NEXT extracted module from repeating it. §0.-13.E's finding was
// that extracting a hand-maintained twin is only half the job — the module then
// has to be wired into the machinery that maintains it. Three rounds forgot.
//
// A module imported by game.js or learn.js is, by definition, code that runs on
// a child's screen, and anything that runs on a child's screen must be
// reportable in the footer Jake reads to diagnose a deploy.
{
    const mine = SOURCES.map(s => s.file);
    const imports = new Set();
    for (const writer of ['game.js', 'learn.js']) {
        const src = read(writer);
        for (const m of src.matchAll(/from\s+["']\.\/([\w.-]+\.js)["']/g)) imports.add(m[1]);
    }
    ok(imports.size > 0, 'the writers\' local module imports are readable');
    for (const f of [...imports].sort()) {
        ok(mine.includes(f),
           `⚠️ ${f} is imported by a page controller but is NOT in SOURCES — ` +
           `the build footer cannot report it, so a stale cached copy of it is ` +
           `invisible from the chair. Add it to versions.js, tools/audit-versions.mjs ` +
           `and this file, in the same commit (section D checks all three agree).`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─── F. ⚠️ THE RULES FILE IS WATCHED TOO ───');
//
// ⚠️⚠️ NOTHING CHECKED firestore.rules UNTIL ROUND 41, AND JAKE CAUGHT IT BY
// READING THE FILE. Round 41 bumped its title line to v2.7.0 and left the
// version-note stack ending at v2.6.0 — the file claimed a version its own
// history did not mention — and `npm test` and `npm run audit:versions` both
// reported clean, because this file is in NONE of the three source lists.
//
// ⚠️ IT IS DELIBERATELY *NOT* ADDED TO versions.js SOURCES. That instrument
// fetches files as DEPLOYED and compares them; the rules that matter live in the
// Firebase console, not on GitHub Pages, so a SOURCES entry would report the
// repo's copy while implying it had checked the live ones. §0.-22's lesson: a
// diagnostic is consulted INSTEAD of checking, so when it is wrong nothing
// disagrees with it. The honest check is internal consistency, which is what
// this section does.
{
    const rulesPath = new URL('../firebase/firestore.rules', import.meta.url);
    let rules = null;
    try { rules = readFileSync(rulesPath, 'utf8'); } catch (_) {}

    ok(rules !== null, 'F1 firebase/firestore.rules is present');

    if (rules) {
        const title = /^\s*\/\/\s*firestore\.rules\s+v([0-9][^\s]*)/m.exec(rules);
        ok(!!title, 'F2 it carries a version on its title line');

        // Every entry in the note stack, newest first.
        const entries = [...rules.matchAll(/^\/\/ v(\d+\.\d+\.\d+) —/gm)].map(m => m[1]);
        ok(entries.length > 0, 'F3 it has a version-note stack');

        if (title && entries.length) {
            ok(entries[0] === title[1],
               `⚠️⚠️ F4 THE TITLE VERSION MATCHES THE NEWEST NOTE — title says v${title[1]}, ` +
               `newest note is v${entries[0]}. A rules change with no note is a change ` +
               'nobody can date, in the one file Jake cannot test from a browser and ' +
               'must paste by hand');

            const numeric = (v) => v.split('.').map(Number);
            const newer = (a, b) => {   // a strictly newer than b
                const [A, B] = [numeric(a), numeric(b)];
                for (let i = 0; i < 3; i++) {
                    if ((A[i] || 0) !== (B[i] || 0)) return (A[i] || 0) > (B[i] || 0);
                }
                return false;
            };
            const desc = entries.every((v, i) => i === 0 || newer(entries[i - 1], v));
            ok(desc, 'F5 the note stack is in descending order');
        }

        // ⚠️ The bare glyph reads as a dingbat rather than a warning sign in the
        // Rules editor, so a warning written without the variation selector is
        // quietly less visible than every other warning in the file.
        const bare = (rules.match(/\u26a0(?!\ufe0f)/g) || []).length;
        ok(bare === 0,
           `F6 every ⚠️ carries its variation selector (${bare} bare)`);
    }
}

console.log('\n─── E. HEADER BUDGETS — proportional lines, flat entries, both ENFORCED ───');
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ v1.1.0 — PROMOTED FROM NOTES. Read the v1.1.0 entry at the top of this file
// before demoting them back: the old reasoning was about a count of fourteen,
// not about the checks being unimportant, and the count is zero now.
//
// ⚠️ THE LINE BUDGET IS MEASURED AGAINST THE BODY, NOT THE FILE. Measuring
// against the total lets a header fund its own growth: add 100 lines of header,
// earn 8 more lines of header, forever.
for (const { file } of SOURCES) {
    if (HEADER_EXEMPT.includes(file)) continue;
    let src; try { src = read(file); } catch { continue; }
    const lines = src.split('\n');
    let n = 0;
    while (n < lines.length && (lines[n].startsWith('//') || lines[n].trim() === '')) n++;
    const headerLines = n;
    const entries = lines.slice(0, n).filter(l => /^\/\/\s*v[\d.]+\s*—/.test(l)).length;
    const bodyLines = lines.length - n;
    const budget = headerLineBudget(bodyLines);
    ok(headerLines <= budget,
       `${file}: header ${headerLines} lines <= budget ${budget} (${bodyLines} lines of code)`);
    ok(entries <= HEADER_MAX_ENTRIES,
       `${file}: ${entries} version entries <= ${HEADER_MAX_ENTRIES} ` +
       `— overflow belongs in CHANGELOG.md § ARCHIVED FILE HEADERS`);
}
if (notes.length) {
    console.log(`  ${notes.length} note(s):`);
    for (const nt of notes) console.log('    · ' + nt);
}

console.log(`\n${pass} passed, ${fail} failed, ${notes.length} note(s)`);
process.exit(fail ? 1 : 0);
