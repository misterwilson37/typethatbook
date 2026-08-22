// tests/drill-filter-test.mjs v1.0.0 — Round 25 (Hall).
//
// THE REPORT: a student told Jake that "ass" appeared in a School lesson.
//
// ⚠️ PART A EXISTS TO PROVE THE DEFECT IS REAL BEFORE ANYTHING FILTERS IT, and
// it does that by REPRODUCING learn.js's generator rather than by arguing from
// probability. drill-filter.js's header claims a rate; Part A measures it. If
// the measurement and the header ever disagree, the HEADER is wrong — it is
// prose and this is arithmetic.
//
// ⚠️ PART D IS THE ONE THAT MATTERS MOST AND IT IS NOT ABOUT OFFENSIVE WORDS AT
// ALL. It is about a browser that does not freeze. Rejection sampling on a key
// set where every outcome is blocked is an infinite loop in a classroom.
//
// Run: node tests/drill-filter-test.mjs

import { containsBlocked, firstBlocked, safeGroup, BLOCKED, LEADING, NEVER,
         MAX_ATTEMPTS, DRILL_FILTER_VERSION } from '../drill-filter.js';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

let failures = 0, checks = 0;
const j = (v) => JSON.stringify(v);
const eq = (label, got, want) => {
    checks++;
    if (j(got) !== j(want)) { failures++; console.log(`  FAIL ${label}\n         got  ${j(got)}\n         want ${j(want)}`); }
    else console.log(`  ok   ${label}`);
};
const ok = (label, cond) => eq(label, !!cond, true);

console.log(`\ndrill-filter.js v${DRILL_FILTER_VERSION}, ${BLOCKED.length} entries\n`);

// ─── A. the cost, measured across the whole course ───────────────────────────
console.log('── A. what the filter costs, on every key set a student meets ──');
{
    // ⚠️ A COPY OF generateRandom()'s DRAW, deliberately — lifting it would drag
    // the whole module in. What matters is the SHAPE: independent uniform draws.
    const HOME = ['a','s','d','f','j','k','l',';'];
    const IDX  = HOME.concat(['g','h','r','t','y','u']);
    const TOP  = IDX.concat(['e','i','o','p','q','w']);
    const ALL  = TOP.concat(['z','x','c','v','b','n','m']);
    const LADDER = [['home row',HOME], ['home+index',IDX], ['+top row',TOP], ['full alphabet',ALL]];

    const mk = (seed) => () => {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const measure = (keys, size, n = 200000) => {
        const rnd = mk(20260821);
        let hits = 0; const per = {};
        for (let i = 0; i < n; i++) {
            let g = '';
            for (let j = 0; j < size; j++) g += keys[Math.floor(rnd() * keys.length)];
            const w = firstBlocked(g);
            if (w) { hits++; per[w] = (per[w] || 0) + 1; }
        }
        return { rate: hits / n, per };
    };

    // ⚠️ THIS TABLE IS THE POINT OF PART A. Twice now a plausible-looking entry
    // has cost more than the defect it was added for — `kkk`, then `fuk` — and
    // NEITHER WAS VISIBLE BY READING THE LIST. The per-entry column is how they
    // were caught. Run this before and after touching NEVER.
    let worst = 0, worstLabel = '';
    for (const size of [4, 5]) {
        for (const [name, keys] of LADDER) {
            const r = measure(keys, size);
            if (r.rate > worst) { worst = r.rate; worstLabel = `${name} @ ${size}`; }
            const top = Object.entries(r.per).sort((x, y) => y[1] - x[1]).slice(0, 3)
                .map(([w, c]) => `${w} ${(c / 2000).toFixed(3)}%`).join('  ');
            console.log(`   size ${size}  ${name.padEnd(14)} ${(r.rate * 100).toFixed(3)}%   ${top}`);
        }
    }
    console.log(`   worst: ${(worst * 100).toFixed(3)}% at ${worstLabel}`);

    // ⚠️ THE CAP. A filter that redraws 1 group in 100 is invisible; one that
    // redraws 1 in 10 is quietly reshaping what the drill teaches, and nobody
    // would notice because the evidence is what is MISSING.
    ok('A1 ⚠️ the whole filter costs under 1% of groups at its worst', worst < 0.01);

    // The original report, and Jake's counter-examples.
    ok('A2 "ass" leading a four-clump is caught',
       containsBlocked('assd') && containsBlocked('asse'));
    ok('A3 ⚠️ "fass" is NOT — the one carve-out, and the reason for it',
       !containsBlocked('fass'));
    ok('A4 the home row alone stays cheap', measure(HOME, 4).rate < 0.005);

    // ⚠️ THE HEADER IS PROSE AND THIS IS ARITHMETIC. An early draft guessed a
    // rate in the head and was out by half. Nothing may claim a rate in prose
    // that is not printed here.
    const src = readFileSync(new URL('../drill-filter.js', import.meta.url), 'utf8');
    ok('A5 the header quotes no rate this harness does not print',
       !/1 in \d+ groups/.test(src));
}

// ─── B. the matcher ──────────────────────────────────────────────────────────
console.log('\n── B. ⚠️ THE RULING IN THREE PARTS, ALL OF THEM LIVE ──');
{
    // ⚠️ JAKE GAVE THIS RULING IN THREE MESSAGES IN ONE MORNING AND EACH ONE
    // NARROWED THE LAST. The assertions below are the final state. Reading any
    // single earlier quote and "restoring" behaviour from it will go red here,
    // which is deliberate — see the module header for all three quotes.
    //   1. whole-group    → `asse` fine
    //   2. leading        → `asse` blocked, `fass` fine
    //   3. NEVER for all but `ass` → `xfart` blocked, `fass` still fine

    // ── `ass`: the one carve-out, matched LEADING ──
    ok('B1 "ass" alone',            containsBlocked('ass'));
    ok('B2 "asse" — leads',         containsBlocked('asse'));
    ok('B3 ⚠️ "fass" — FINE',       !containsBlocked('fass'));
    ok('B4 ⚠️ "lass" — FINE',       !containsBlocked('lass'));
    ok('B5 ⚠️ "mass" — FINE',       !containsBlocked('mass'));
    ok('B6 ⚠️ "sass" — FINE',       !containsBlocked('sass'));

    // ── everything else: NEVER, position-blind. Jake's own examples. ──
    ok('B7 "xfart"',  containsBlocked('xfart'));
    ok('B8 "fartx"',  containsBlocked('fartx'));
    ok('B9 "xfuck"',  containsBlocked('xfuck'));
    ok('B10 "fuckx"', containsBlocked('fuckx'));
    ok('B11 "xdamn"', containsBlocked('xdamn'));

    ok('B12 case insensitive',        containsBlocked('XFART') && containsBlocked('AsS'));
    ok('B13 an ordinary group passes', !containsBlocked('asdf'));
    ok('B14 empty and null are clean', !containsBlocked('') && !containsBlocked(null));
    eq('B15 firstBlocked names the entry', firstBlocked('xfart'), 'fart');

    // ⚠️ `fuk` IS GONE AND THIS ASSERTS IT. It was mine, not a ruling, and it
    // was 80% of the filter's cost on the key set most students are on.
    ok('B16 ⚠️ "fuka" passes — `fuk` was deleted, see the NEVER header',
       !containsBlocked('fuka'));
    ok('B17 …but the actual word is still caught anywhere', containsBlocked('afuckb'));
}

// ─── C. list hygiene ─────────────────────────────────────────────────────────
console.log('\n── C. the lists keep their own invariants ──');
{
    ok('C1 every entry is lowercase', BLOCKED.every(w => w === w.toLowerCase()));
    ok('C2 every entry is letters only — groups have no spaces or punctuation',
       BLOCKED.every(w => /^[a-z]+$/.test(w)));
    eq('C3 no duplicates within LEADING', LEADING.length, new Set(LEADING).size);
    eq('C4 no duplicates within NEVER',   NEVER.length,   new Set(NEVER).size);
    eq('C5 ⚠️ no entry in BOTH lists — NEVER would silently win',
       LEADING.filter(w => NEVER.includes(w)), []);

    // ⚠️ TIER 1 IS ONE WORD AND ITS FAMILY, BY RULING. A second entry needs a
    // reason of the same kind — "appears inside letter runs a drill should be
    // free to produce" — not "seems mild". This is a speed bump, not a law:
    // if Jake rules another word in, update this assertion with the ruling.
    eq('C6 ⚠️ LEADING holds only the `ass` family — a second entry needs a ruling',
       LEADING.filter(w => !w.startsWith('ass')), []);

    // ⚠️ NO NEVER ENTRY MAY BE SPELLABLE FROM THE HOME ROW. This is the `kkk`
    // guard, and it is the cheap structural version of Part A's measurement:
    // the home row is where every student starts and where a bad entry does the
    // most damage.
    const HOMEKEYS = new Set(['a','s','d','f','j','k','l',';']);
    eq('C7 ⚠️ no NEVER entry is spellable from the home row alone — the `kkk` guard',
       NEVER.filter(w => [...w].every(ch => HOMEKEYS.has(ch))), []);
}

// ─── D. ⚠️ IT MUST NOT HANG ──────────────────────────────────────────────────
console.log('\n── D. ⚠️ termination — the part that is about a classroom, not a word ──');
{
    // A generator that can NEVER produce a clean group.
    let calls = 0;
    const always = () => { calls++; return ['a','s','s']; };
    const r = safeGroup(always);
    eq('D1 an impossible key set gives up rather than looping', r.exhausted, true);
    eq('D2 …after exactly MAX_ATTEMPTS draws', calls, MAX_ATTEMPTS);
    eq('D3 …and still RETURNS A GROUP, because a drill must appear',
       r.group.join(''), 'ass');
    eq('D4 …naming what matched, so it can be logged', r.matched, 'ass');

    // The ordinary case.
    let n = 0;
    const secondTimeLucky = () => (++n === 1 ? ['a','s','s'] : ['a','s','d']);
    const r2 = safeGroup(secondTimeLucky);
    eq('D5 a blocked draw is redrawn', r2.group.join(''), 'asd');
    eq('D6 …and it took two attempts', r2.attempts, 2);
    eq('D7 …and is not flagged exhausted', r2.exhausted, false);

    const r3 = safeGroup(() => ['j','k','l']);
    eq('D8 a clean first draw costs exactly one attempt', r3.attempts, 1);
}

// ─── E. the drill is not biased ──────────────────────────────────────────────
console.log('\n── E. redrawing the WHOLE group keeps the distribution honest ──');
{
    // ⚠️ THIS IS WHY IT IS NOT CHARACTER SUBSTITUTION. Rejection sampling leaves
    // every ALLOWED outcome exactly as likely relative to every other as it was.
    // Swapping the offending letter would push the drill away from the very
    // finger sequences the lesson exists to teach — a home-row lesson would
    // quietly stop drilling a-s-s, which is a real and useful sequence.
    const KEYS = ['a','s','d'];
    const mk = (seed) => () => {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const rnd = mk(7);
    const counts = {};
    const N = 90000;
    for (let i = 0; i < N; i++) {
        const { group } = safeGroup(() => {
            const g = [];
            for (let k = 0; k < 3; k++) g.push(KEYS[Math.floor(rnd() * KEYS.length)]);
            return g;
        });
        counts[group.join('')] = (counts[group.join('')] || 0) + 1;
    }
    eq('E1 the blocked outcome never appears', counts['ass'], undefined);
    eq('E2 every other outcome still appears', Object.keys(counts).length, 26);
    const expected = N / 26;
    const worst = Math.max(...Object.values(counts).map(c => Math.abs(c - expected) / expected));
    console.log(`   worst deviation from uniform: ${(worst * 100).toFixed(1)}%`);
    ok('E3 the survivors stay uniform — no outcome is favoured by the filter',
       worst < 0.12);
}

// ─── F. wiring ───────────────────────────────────────────────────────────────
console.log('\n── F. wired into School, and nowhere near the clock ──');
{
    const learn = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');
    const game  = readFileSync(new URL('../game.js',  import.meta.url), 'utf8');
    const css   = readFileSync(new URL('../style.css', import.meta.url), 'utf8');

    ok('F1 learn.js imports drill-filter.js',        /from "\.\/drill-filter\.js"/.test(learn));
    ok('F2 generateRandom draws through safeGroup',  /function generateRandom\([\s\S]{0,900}?safeGroup\(/.test(learn));
    ok('F3 the pattern generator\'s random phase does too',
       (learn.match(/safeGroup\(/g) || []).length >= 2);
    ok('F4 an exhausted budget is logged, not swallowed', /exhausted[\s\S]{0,200}?console\.warn/.test(learn));

    // ⚠️ NEVER IN LIBRARY. Its text is real books; `class`, `grass` and
    // `passage` are words a reader must be able to see. Part B11.
    eq('F5 game.js must NEVER import this — its text is real prose',
       /drill-filter/.test(game), false);
    eq('F6 …and has no random generator to guard anyway',
       /function generateRandom\(/.test(game), false);

    // ═════════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ F7 IS JAKE'S CONDITION, MECHANISED: "if you think you can make them
    // without touching the timing mechanism, do it."
    // ═════════════════════════════════════════════════════════════════════════
    // The filter and the font picker are TEXT and PRESENTATION. The five
    // functions that implement them must not reference a counter, a timer or a
    // flush — if a future round reaches for one, this says so.
    //
    // ⚠️ THE FIRST VERSION OF THIS CHECK SPLIT THE FILE ON /\nfunction / AND WAS
    // WRONG. Function "bodies" bled into whatever followed them, and it flagged
    // renderMap() — which legitimately BOTH builds presentation controls and
    // paints a time on the map. A render function displaying a number is not a
    // render function computing one. Brace-matching the functions by name is the
    // precise question; "do these two words appear near each other" was not.
    //
    // ⚠️⚠️ v1.5.0 — JAKE RULED ON WHAT THIS CONDITION MEANT, 2026-08-22:
    // *"When I said 'don't mess with the timing mechanism', I meant not to break
    // the ability to track the time accurately. It acting the same way it does
    // in library mode — namely, counting time typed and pausing when necessary —
    // is just fine."*
    //
    // So the rule is ACCURACY, not "never stop the clock". `openSchoolSettings()`
    // is therefore OFF this list — it pauses on purpose, like Library's menu —
    // and F7c below asserts the thing that actually matters about a pause.
    // Everything else stays: the filter and the font control are TEXT and
    // PRESENTATION and have no business near a counter.
    const bodyOf = (src, name) => {
        const m = new RegExp('function\\s+' + name + '\\s*\\(').exec(src);
        if (!m) return null;
        let i = src.indexOf('{', m.index), depth = 0, start = i;
        for (; i < src.length; i++) {
            if (src[i] === '{') depth++;
            else if (src[i] === '}') { depth--; if (!depth) return src.slice(start, i + 1); }
        }
        return null;
    };
    const TIMING = ['stepSeconds', 'anonSecondsAccum', 'secondsToday', 'secondsSchool',
                    'secondsWeek', 'lastDate', 'flushStats', 'logRun', 'sessionLog',
                    'walCheckpoint', 'setInterval', 'Date.now'];
    const panel = readFileSync(new URL('../settings-panel.js', import.meta.url), 'utf8');
    const OURS = [
        [learn, 'learn.js', 'generateRandom'],
        [learn, 'learn.js', 'generateReachPattern'],
        [learn, 'learn.js', 'ensureSettingsButton'],
        [panel, 'settings-panel.js', 'applyDrillFont'],
        [panel, 'settings-panel.js', 'readDrillFont'],
        [panel, 'settings-panel.js', 'openSettingsPanel'],
        [panel, 'settings-panel.js', '_fontRow'],
    ];
    const found = {};
    for (const [src, file, fn] of OURS) {
        const body = bodyOf(src, fn);
        // ⚠️ 'NOT FOUND' IS LOAD-BEARING. A function that was renamed or moved
        // must FAIL this, not silently drop out of the check — which is exactly
        // what happened when ROADMAP 0b moved three of these into another file.
        if (body === null) { found[`${file}:${fn}`] = 'NOT FOUND'; continue; }
        const hits = TIMING.filter(t => body.includes(t));
        if (hits.length) found[`${file}:${fn}`] = hits;
    }
    eq('F7 ⚠️ no presentation function in either file touches a timing identifier',
       found, {});

    // ⚠️ F7b — THE PANEL MODULE AS A WHOLE STAYS OUT OF THE DATA PATH.
    // settings-panel.js has the same contract as celebrate.js and receipt.js:
    // DOM-only, state-free. A settings dialog that learns to write to Firestore
    // becomes a place a child can lose work by closing a window.
    for (const forbidden of ['firestore', 'getDoc', 'setDoc', 'updateDoc', 'firebase']) {
        ok(`F7b ⚠️ settings-panel.js never mentions \`${forbidden}\``,
           !panel.includes(forbidden));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ F7c — A PAUSE MUST ALWAYS RESUME. THIS IS THE REAL RISK IN item 0b.
    // ═════════════════════════════════════════════════════════════════════════
    // Pausing the graded clock to open settings is allowed and correct. A pause
    // that never resumes is a silent disaster: the child types for the rest of
    // the lesson and NOTHING COUNTS — no error, no warning, minutes simply gone.
    // It is strictly worse than the handful of seconds the pause saves.
    //
    // Three things have to hold, so all three are asserted rather than trusted:
    const settingsBody = bodyOf(learn, 'openSchoolSettings') || '';
    ok('F7c1 openSchoolSettings pauses the graded clock',
       /clearInterval\(learnTickInterval\)/.test(settingsBody));
    ok('F7c2 ⚠️ …and hands the matching resume to onClose, not to a dismiss handler',
       /onClose:[\s\S]{0,120}?startGradedTimer\(\)/.test(settingsBody));
    ok('F7c3 ⚠️ …and only resumes what it actually paused (guarded on drillRunning)',
       /const drillRunning/.test(settingsBody) &&
       /if \(drillRunning\) clearInterval/.test(settingsBody) &&
       /if \(drillRunning\) startGradedTimer/.test(settingsBody));
    // ⚠️ AND THE CALLBACK MUST BE UNSWALLOWABLE. One close(), reached by ✕, Esc
    // and backdrop alike, with the resume in a `finally` so a throw in the
    // teardown above it cannot eat the resume.
    ok('F7c4 ⚠️ settings-panel.js runs onClose in a `finally`',
       /finally\s*\{[\s\S]{0,1400}?onClose\(\)/.test(panel));
    eq('F7c5 ⚠️ …from exactly ONE close path', (panel.match(/function close\(\)/g) || []).length, 1);

    // ⚠️ F7d — AND THE SINGLE INCREMENT SITE IS STILL SINGLE. The pause re-arms
    // startGradedTimer(), and the one thing that must never follow from that is
    // a second timer. open-unit-test.mjs Part E counts increment sites; this
    // counts the ARMING, which is the half a resume could plausibly duplicate.
    eq('F7d ⚠️ startGradedTimer() is defined exactly once',
       (learn.match(/function startGradedTimer\(/g) || []).length, 1);
    eq('F7e ⚠️ …and learn.js still has exactly one setInterval that counts seconds',
       (learn.match(/timerInterval = setInterval\(/g) || []).length, 1);

    // ⚠️ F8 — THE NO-REFLOW GUARANTEE. A proportional face plus the bold in
    // .dt-fixed/.dt-dirty would shove the line sideways when a child corrects a
    // character. style.css must carry the swap, and learn.js must set the class
    // that triggers it. Either half alone is useless.
    ok('F8 style.css neutralises bold for proportional faces',
       /ttb-drill-proportional[\s\S]{0,300}?font-weight:\s*normal/.test(css));
    ok('F9 …and settings-panel.js sets that class when the face is not monospace',
       /classList\.toggle\('ttb-drill-proportional'/.test(panel));
    // ⚠️ F9b — RULE 9. The font model MOVED to settings-panel.js in v2.28.0; it
    // was not copied. A second DRILL_FONTS table in learn.js is the celebration
    // drift of HANDOFF §0.-13.E starting over, and the two would differ in some
    // detail nobody chose.
    ok('F9b ⚠️ learn.js kept NO local copy of the font table',
       !/const\s+DRILL_FONTS\s*=/.test(learn));
    ok('F9c ⚠️ learn.js imports the font model rather than redefining it',
       /from "\.\/settings-panel\.js"/.test(learn));
    ok('F10 #drill-text reads the custom property',
       /#drill-text[\s\S]{0,400}?var\(--drill-font/.test(css));

    // ⚠️ THE HUD IS MONOSPACE ON PURPOSE — the clock must not reflow while it
    // counts. The picker must never reach it.
    // ⚠️ THIS USED TO COUNT OCCURRENCES AND EXPECT 1, WHICH WAS A PROXY FOR THE
    // REAL QUESTION AND BROKE THE MOMENT v3.6.1 ADDED A LEGITIMATE SECOND USE —
    // the "Aa" preview glyph, which SHOULD render in the chosen face. Counting
    // is not the invariant; WHICH SELECTORS get the variable is.
    const users = [...css.matchAll(/([^{}]+)\{[^}]*var\(--drill-font/g)]
        .map(m => m[1].trim().split('\n').pop().trim());
    const ALLOWED = ['#drill-text', '#drill-font-pick .dfp-aa'];
    eq('F11 ⚠️ only the drill text and the preview glyph get the font — never the HUD',
       users.filter(u => !ALLOWED.includes(u)), []);
    for (const forbidden of ['#hud-time', '#hud-week', '#virtual-keyboard', '#drill-modal']) {
        ok(`F11b ⚠️ ${forbidden} stays monospace`,
           !users.some(u => u.includes(forbidden)));
    }

    // The stamp nothing was checking. v3.5.6 bumped the header and left
    // body::before at v3.5.5, so the build footer under-reported the file.
    const hdr = (css.match(/style\.css v([\d.]+)/) || [])[1];
    const stamp = (css.match(/body::before\s*\{\s*content:\s*"v([\d.]+)"/) || [])[1];
    eq('F12 style.css\'s machine-readable stamp matches its own header', stamp, hdr);
}

// ─── G. ⚠️ THE HOLE WITH TEETH — REAL ENGLISH LIVES IN THIS FILE TOO ────────
console.log('\n── G. ⚠️ learn.js has step types made of REAL WORDS. Keep away. ──');
{
    const learn = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');

    // ⚠️ THE WARNING IN THE MODULE HEADER USED TO POINT AT game.js, WHICH MADE IT
    // SOUND LIKE SOMEBODY ELSE'S PROBLEM. It is not. learn.js itself has THREE
    // step types built from real English — word_list, sentence_list and passage —
    // and a future round that reads "the drill filter is in learn.js" could
    // reasonably wire it into all six. That would silently eat ordinary words.
    for (const t of ['word_list', 'sentence_list', 'passage']) {
        ok(`G1 learn.js still has the "${t}" step type — real English, unfiltered`,
           learn.includes(`case '${t}'`));
    }

    // ⚠️ WHAT WOULD BE DESTROYED, BY NAME. Every one of these is a word a school
    // typing app uses. They are asserted as BLOCKED so the damage is a number in
    // the test output rather than a paragraph nobody reads.
    const CASUALTIES = [
        'assignment', 'assume', 'assist', 'assess', 'asset',   // leading `ass`
        'title', 'titles', 'constitution', 'attitude',          // contains `tit`
        'biscuit', 'circuit', 'cute', 'cutting',                // contains `cut`
        'soldier', 'audience', 'obedient', 'ingredient',        // contains `die`
        'sweet', 'between', 'weekend',                          // contains `wee`
        'speech', 'speed',                                      // contains `pee`
        'shampoo', 'spoon',                                     // contains `poo`
        'sparse', 'parse', 'coarse',                            // contains `arse`
        'grape', 'scrape',                                      // contains `rape`
        'raccoon', 'cocoon', 'tycoon',                          // contains `coon`
        'manuscript',                                           // contains `anus`
        'shatter', 'shell', 'hello', 'album', 'peanuts',
        'suspicion', 'homophone', 'begun', 'shotgun',
    ];
    const survivors = CASUALTIES.filter(w => !containsBlocked(w));
    console.log(`   ${CASUALTIES.length - survivors.length} of ${CASUALTIES.length} ` +
                `ordinary English words would be destroyed by this module.`);
    ok('G2 ⚠️ the overwhelming majority of that list IS blocked — the cost is real',
       (CASUALTIES.length - survivors.length) / CASUALTIES.length > 0.85);

    // ⚠️ THE ACTUAL GUARD. The filter must reach the two RANDOM generators and
    // nothing else. If a future round wires it into the word/sentence/passage
    // path, safeGroup() count goes up and this goes red.
    // ⚠️ COUNT CODE, NOT PROSE. The first draft of this counted /safeGroup\(/
    // across the whole file and got 4 — two call sites and two comments that
    // mention the function by name. A guard that a comment can trip is a guard
    // people learn to ignore. Strip line comments first.
    const codeOnly = learn.split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
    const uses = (codeOnly.match(/=\s*safeGroup\(/g) || []).length;
    eq('G3 ⚠️ safeGroup() is CALLED exactly twice — the two random generators only',
       uses, 2);
}

// ─── H. ⚠️ THE CONTROL ACTUALLY APPEARS ON THE PAGE ─────────────────────────
console.log('\n── H. ⚠️ the font control renders, and can be SEEN ──');
{
    // ⚠️ THIS PART EXISTS BECAUSE THE FEATURE SHIPPED INVISIBLE. v2.23.0 built
    // the picker correctly, appended it to the right element, and styled it at
    // 0.75rem in #777 with no affordance — and Jake asked whether it existed.
    // Every assertion I had written was about the FILTER; not one asked whether
    // the other half of the round was on the screen.
    // ⚠️ GENERALISE: "the code runs" and "a person can find it" are different
    // claims, and only the first one had a test. A control nobody can find has
    // not shipped.
    //
    // ⚠️⚠️ v1.4.0, ROUND 27 — THE CONTROL MOVED INTO THE ⚙ DIALOG (ROADMAP 0b)
    // AND THIS PART GOT STRONGER FOR IT. It used to slice the font block out of
    // learn.js as TEXT and eval it through `new Function`, because the code was
    // not importable. settings-panel.js is a real module, so the real thing is
    // imported and driven here — no lifting, no reimplementation, no chance of
    // the harness and the shipped code diverging in the seam between them.
    const html  = readFileSync(new URL('../learn.html', import.meta.url), 'utf8');
    const learn = readFileSync(new URL('../learn.js',   import.meta.url), 'utf8');
    const css   = readFileSync(new URL('../style.css',  import.meta.url), 'utf8');

    const dom = new JSDOM(html, { url: 'https://example.org/' });
    const doc = dom.window.document;

    // settings-panel.js touches `document` and `localStorage` only when called,
    // never at module scope, so handing it globals here is enough.
    const prevDoc = globalThis.document, prevLS = globalThis.localStorage;
    globalThis.document = doc;
    globalThis.localStorage = { _v: {}, getItem(k){ return this._v[k] ?? null; },
                                setItem(k, v){ this._v[k] = v; } };
    const api = await import('../settings-panel.js');

    ok('H1 the settings panel is importable as a real module', !!api.openSettingsPanel);

    // ⚠️ NOTHING TO TAB TO BEFORE IT IS OPENED. This is item 8's ruling, and it
    // is the reason the control was allowed to leave the map at all.
    ok('H2 ⚠️ there is NO font control in the document before the panel opens',
       !doc.getElementById('drill-font-select'));

    const close = api.openSettingsPanel({ title: 'Settings', rows: [{ kind: 'font' }] });
    const pick = doc.getElementById('drill-font-pick');
    ok('H3 ⚠️ the control RENDERS — the assertion that was missing',  !!pick);
    ok('H4 …inside the dialog, where there is no drill to interrupt',
       !!(pick && pick.closest('.settings-panel')));
    eq('H5 …with every face offered',
       pick ? [...pick.querySelectorAll('option')].length : 0, api.DRILL_FONTS.length);
    ok('H6 …and a visible "Aa" affordance, not a bare label',
       !!(pick && pick.querySelector('.dfp-aa')));
    ok('H7 …labelled in words a child reads, not font names',
       pick && /Reading font/.test(pick.textContent));

    // ⚠️ RE-ENTRANCY. A double-click on the ⚙ must not stack two overlays; the
    // second one's close() would leave the first behind covering the page.
    api.openSettingsPanel({ rows: [{ kind: 'font' }] });
    eq('H8 opening it twice makes exactly one dialog',
       doc.querySelectorAll('.settings-overlay').length, 1);

    // ⚠️⚠️ H8b IS THE TAB HAZARD, ASSERTED. The dialog is REMOVED on close, not
    // hidden — a `display:none` <select> is still in the tab order in some
    // engines, and item 8's whole ruling is that a focusable control near a
    // typing view eventually eats a keystroke a child should have been paid for.
    close();
    eq('H8b ⚠️ closing REMOVES the dialog from the document, leaving nothing to tab to',
       doc.querySelectorAll('.settings-overlay').length, 0);
    ok('H8c ⚠️ …and no font <select> survives it',
       !doc.getElementById('drill-font-select'));

    // ⚠️ THE VISIBILITY FLOOR. Not a taste assertion — a floor. v3.6.0 sat below
    // it at 0.75rem/#777 and that is precisely why nobody found it.
    const rule = (css.match(/#drill-font-pick\s*\{[^}]*\}/) || [''])[0];
    const size = parseFloat((rule.match(/font-size:\s*([\d.]+)rem/) || [0, 0])[1]);
    ok(`H9 ⚠️ font-size is at least 0.8rem (is ${size})`, size >= 0.8);
    ok('H10 ⚠️ the gear that opens it is mouse-only, out of the tab order',
       /tabindex', '-1'/.test(readFileSync(new URL('../settings-panel.js', import.meta.url), 'utf8')));

    // Choosing a face writes it and sets the proportional class.
    api.applyDrillFont('serif');
    ok('H11 a proportional face sets the no-reflow class',
       doc.documentElement.classList.contains('ttb-drill-proportional'));
    api.applyDrillFont('courier');
    ok('H12 …and a monospace face clears it',
       !doc.documentElement.classList.contains('ttb-drill-proportional'));
    eq('H13 an unknown key falls back to the default rather than blanking the text',
       api.applyDrillFont('nonsense'), api.DRILL_FONTS[0][0]);

    // ⚠️ H14 — THE DEBT ITEM 0b WAS OPENED TO PAY. learn.js v2.24.0 removed
    // #user-class-name from the top bar on Jake's ruling and the class then
    // lived NOWHERE: updateClassDisplay() went on writing to an element that no
    // longer exists in learn.html. The panel is where it lives now.
    ok('H14 ⚠️ learn.html still has no #user-class-name — the bar element is gone',
       !html.includes('id="user-class-name"'));
    ok('H15 ⚠️ …and the settings panel is what shows the class instead',
       /kind: 'info', label: 'Class'/.test(learn));

    globalThis.document = prevDoc;
    globalThis.localStorage = prevLS;
}

console.log('');
if (failures) {
    console.log(`FAIL — ${failures} of ${checks} checks failed.`);
    process.exitCode = 1;
} else {
    console.log(`All ${checks} checks pass.`);
    console.log('');
    console.log('⚠️ `ass` IS THE ONLY LEADING ENTRY. Everything else is NEVER-USE,');
    console.log('   matched anywhere. Jake ruled it in three narrowing steps in one');
    console.log('   morning — all three quotes are in the module header, and Part B');
    console.log('   asserts the FINAL state. Do not restore behaviour from an early');
    console.log('   quote. ⚠️ AND SEE PART G: real English lives in learn.js too.');
}
