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

import { containsBlocked, firstBlocked, safeGroup, BLOCKED, LEADING, ALWAYS,
         MAX_ATTEMPTS, DRILL_FILTER_VERSION } from '../drill-filter.js';
import { readFileSync } from 'node:fs';

let failures = 0, checks = 0;
const j = (v) => JSON.stringify(v);
const eq = (label, got, want) => {
    checks++;
    if (j(got) !== j(want)) { failures++; console.log(`  FAIL ${label}\n         got  ${j(got)}\n         want ${j(want)}`); }
    else console.log(`  ok   ${label}`);
};
const ok = (label, cond) => eq(label, !!cond, true);

console.log(`\ndrill-filter.js v${DRILL_FILTER_VERSION}, ${BLOCKED.length} entries\n`);

// ─── A. the defect, reproduced ───────────────────────────────────────────────
console.log('── A. the defect is real — learn.js\'s own generator, measured ──');
{
    // ⚠️ A COPY OF generateRandom()'s DRAW, deliberately. It is three lines and
    // lifting it would drag expandKeySetWithHomeCompanions() and the whole module
    // in. What matters is the SHAPE — independent uniform draws from the key set —
    // and if learn.js stops doing that, Part F notices.
    const HOME = ['a','s','d','f','j','k','l',';'];
    // Early-reach set: home row plus the first index reaches. This is the one
    // that matters, because it is where `fart` becomes reachable.
    const REACH = ['a','s','d','f','j','k','l',';','r','t','g','u','y','h','e','i'];
    const mk = (seed) => () => {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const draw = (keySet, size, rnd) => {
        const out = [];
        for (let i = 0; i < size; i++) out.push(keySet[Math.floor(rnd() * keySet.length)]);
        return out;
    };
    const measure = (keySet, size, n = 200000) => {
        const rnd = mk(20260821);
        let hits = 0;
        for (let i = 0; i < n; i++) if (containsBlocked(draw(keySet, size, rnd).join(''))) hits++;
        return hits / n;
    };

    // ⚠️ v1.2.0 CLOSED A DEAD SPOT AND THIS IS THE PROOF. Under whole-group
    // matching a three-letter entry could not fire at groupSize 4 at all, so the
    // ORIGINAL REPORT — a student seeing "ass" — was not covered by the fix
    // written for it. Leading matching covers it, and A1 asserts the rate is now
    // non-zero where v1.1.0 measured exactly 0.
    const homeRate4 = measure(HOME, 4);
    console.log(`   home row, groupSize 4: about 1 in ${Math.round(1/homeRate4)} groups`);
    ok('A1 ⚠️ at groupSize 4 the home row DOES now yield blocked groups — v1.1.0 gave 0',
       homeRate4 > 0);
    ok('A2 …"ass" leading a four-clump is caught',
       containsBlocked('assd') && containsBlocked('asse'));
    ok('A3 ⚠️ …and "fass" is NOT — Jake\'s example, the whole point of leading',
       !containsBlocked('fass'));

    // ⚠️ THE RATE MUST STAY SANE. A leading match has ONE position to hit, so it
    // is intrinsically cheaper than a substring rule — this is the guard that
    // would have caught `kkk` immediately had it been a tier 1 entry.
    ok('A4 the home-row rejection rate stays under 1% of groups', homeRate4 < 0.01);

    // The early-reach set at the DEFAULT size is where the real value is.
    const reachRate = measure(REACH, 4);
    const oneIn = Math.round(1 / reachRate);
    const perDrill = 1 - Math.pow(1 - reachRate, 12);
    console.log(`   early reach set, groupSize 4: about 1 in ${oneIn} groups`);
    console.log(`   → a 12-group drill is blocked ${(perDrill * 100).toFixed(2)}% of the time`);
    ok('A5 four-letter words ARE reachable from an early lesson', reachRate > 0);
    ok('A6 "fart" needs only home keys and the first index reaches',
       containsBlocked('fart'));
    ok('A7 …and a drill is still overwhelmingly unfiltered', perDrill < 0.10);

    // ⚠️ THE HEADER IS PROSE AND THIS IS ARITHMETIC. The first draft guessed
    // "one in ninety" and was out by half. Nothing now claims a rate in prose —
    // A7 asserts that, so the failure mode cannot come back by someone helpfully
    // writing the number in again without a test behind it.
    const src = readFileSync(new URL('../drill-filter.js', import.meta.url), 'utf8');
    ok('A8 the header quotes NO un-tested rate — Part A prints the truth instead',
       !/1 in \d+ groups/.test(src) && !/[\d.]+% of drills/.test(src));
}

// ─── B. the matcher ──────────────────────────────────────────────────────────
console.log('\n── B. ⚠️ JAKE\'S RULING, AS AMENDED: LEADING ──');
{
    // ⚠️ THE RULING, VERBATIM, AS ASSERTIONS — AND IT CHANGED ONCE. Jake gave it
    // in two parts on 2026-08-21 and part 2 amended part 1, INCLUDING ONE OF ITS
    // OWN EXAMPLES: `asse` was named as acceptable in part 1 and is blocked under
    // part 2. ⚠️ B3 IS THAT REVERSAL. Do not "restore" it to `!containsBlocked`
    // on the strength of the earlier quote — the live rule is part 2.
    ok('B1 ⚠️ "lass" is FINE — does not lead',                 !containsBlocked('lass'));
    ok('B2 ⚠️ "mass" is FINE — does not lead',                 !containsBlocked('mass'));
    ok('B3 ⚠️ "fass" is FINE — Jake\'s amended example',        !containsBlocked('fass'));
    ok('B4 ⚠️ "asse" IS blocked — the amendment, reversing B3 of v1.1.0',
       containsBlocked('asse'));
    ok('B5 …and "ass" alone is too',                            containsBlocked('ass'));
    // ⚠️ THE ASYMMETRY, ASSERTED SO IT IS A DECISION AND NOT A SURPRISE. A
    // trailing giggle-tier word passes, because `fass` must pass and nothing
    // distinguishes them but position. The hard cases live in tier 2, which is
    // position-blind. See the module header.
    ok('B5b ⚠️ KNOWN: a TRAILING tier 1 word passes — move it to ALWAYS if it matters',
       !containsBlocked('xass'));

    ok('B6 case insensitive',        containsBlocked('ASS') && containsBlocked('AsS'));
    ok('B7 an ordinary group passes', !containsBlocked('asdf'));
    ok('B8 empty and null are clean', !containsBlocked('') && !containsBlocked(null));
    eq('B8b firstBlocked names the entry', firstBlocked('fart'), 'fart');
    // Longest-first: a group leading `cuts` reports `cuts`, not `cut`.
    eq('B8c …and the most specific one when two lead', firstBlocked('cutsx'), 'cuts');

    // ⚠️ TIER 2 IS SUBSTRING AND MUST STAY THAT WAY. A slur is a slur whatever
    // surrounds it. This tier was not asked for — see the module header — so it
    // is asserted loudly rather than left to be discovered.
    ok('B9 ⚠️ a slur is blocked EMBEDDED, not just alone', containsBlocked('xkikex'));
    ok('B10 …and alone',                                   containsBlocked('kike'));

    // ═════════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ B11/B12 — THE PROSE GUARD, AND LEADING MATCHING MADE IT SHARPER.
    // ═════════════════════════════════════════════════════════════════════════
    // Under the ruling, a real word is safe only if the blocked sequence does
    // not START it. That splits English cleanly in two, and the second half is
    // the reason this module must NEVER be pointed at book text or Gemini prose.
    for (const w of ['class', 'passage', 'grass', 'embarrassed', 'harass']) {
        ok(`B11 "${w}" passes — the sequence does not lead`, !containsBlocked(w));
    }
    // ⚠️ THESE ARE ALL BLOCKED, AND THAT IS CORRECT FOR NONSENSE GROUPS AND
    // CATASTROPHIC FOR PROSE. "assignment" is a word this app cannot do without.
    // v1.1.0's whole-group rule happened to spare them; v1.2.0's does not, so the
    // warning in the module header is now load-bearing rather than cautionary.
    for (const w of ['assignment', 'assume', 'assist', 'assess', 'asset']) {
        ok(`B12 ⚠️ "${w}" IS blocked — never use this module on prose`,
           containsBlocked(w));
    }
}

// ─── C. list hygiene ─────────────────────────────────────────────────────────
console.log('\n── C. the lists keep their own invariants ──');
{
    ok('C1 every entry is lowercase', BLOCKED.every(w => w === w.toLowerCase()));
    ok('C2 every entry is letters only — groups have no spaces or punctuation',
       BLOCKED.every(w => /^[a-z]+$/.test(w)));
    eq('C3 no duplicates within LEADING', LEADING.length, new Set(LEADING).size);
    eq('C4 no duplicates within ALWAYS',      ALWAYS.length,      new Set(ALWAYS).size);
    // ⚠️ AN ENTRY IN BOTH LISTS WOULD MEAN THE RULING IS SILENTLY OVERRIDDEN for
    // that word — tier 2 wins, and the whole-group intent would be a dead letter.
    eq('C5 ⚠️ no entry appears in BOTH lists — tier 2 would silently win',
       LEADING.filter(w => ALWAYS.includes(w)), []);
    // ⚠️ A TIER 2 ENTRY UNDER 4 CHARACTERS FIRES CONSTANTLY, because it is a
    // substring test over a small alphabet. 'kkk' was in this list for one hour
    // and A1 caught it at 1 in 270 groups on the home row. No exceptions now.
    eq('C6 ⚠️ no tier 2 entry is shorter than 4 characters — see A1 and \'kkk\'',
       ALWAYS.filter(w => w.length < 4), []);
    // ⚠️ AND NONE OF THEM IS SPELLABLE FROM THE HOME ROW, which is the property
    // A1 actually depends on. A tier 2 entry made of common keys is a pedagogy
    // bug wearing a safety costume.
    const HOMEKEYS = new Set(['a','s','d','f','j','k','l',';']);
    eq('C7 ⚠️ no tier 2 entry is spellable from the home row alone',
       ALWAYS.filter(w => [...w].every(ch => HOMEKEYS.has(ch))), []);
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
    // renderMap() — which legitimately BOTH calls buildFontPicker() and paints a
    // time on the map. A render function displaying a number is not a render
    // function computing one. Brace-matching the five functions by name is the
    // precise question; "do these two words appear near each other" was not.
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
    const OURS = ['generateRandom', 'generateReachPattern', 'applyDrillFont',
                  'readDrillFont', 'buildFontPicker'];
    const found = {};
    for (const fn of OURS) {
        const body = bodyOf(learn, fn);
        if (body === null) { found[fn] = 'NOT FOUND'; continue; }
        const hits = TIMING.filter(t => body.includes(t));
        if (hits.length) found[fn] = hits;
    }
    eq('F7 ⚠️ none of the five new/changed functions touches a timing identifier',
       found, {});

    // ⚠️ F8 — THE NO-REFLOW GUARANTEE. A proportional face plus the bold in
    // .dt-fixed/.dt-dirty would shove the line sideways when a child corrects a
    // character. style.css must carry the swap, and learn.js must set the class
    // that triggers it. Either half alone is useless.
    ok('F8 style.css neutralises bold for proportional faces',
       /ttb-drill-proportional[\s\S]{0,300}?font-weight:\s*normal/.test(css));
    ok('F9 …and learn.js sets that class when the face is not monospace',
       /classList\.toggle\('ttb-drill-proportional'/.test(learn));
    ok('F10 #drill-text reads the custom property',
       /#drill-text[\s\S]{0,400}?var\(--drill-font/.test(css));

    // ⚠️ THE HUD IS MONOSPACE ON PURPOSE — the clock must not reflow while it
    // counts. The picker must never reach it.
    eq('F11 ⚠️ the font variable is scoped to the drill text, not the HUD',
       (css.match(/var\(--drill-font/g) || []).length, 1);

    // The stamp nothing was checking. v3.5.6 bumped the header and left
    // body::before at v3.5.5, so the build footer under-reported the file.
    const hdr = (css.match(/style\.css v([\d.]+)/) || [])[1];
    const stamp = (css.match(/body::before\s*\{\s*content:\s*"v([\d.]+)"/) || [])[1];
    eq('F12 style.css\'s machine-readable stamp matches its own header', stamp, hdr);
}

console.log('');
if (failures) {
    console.log(`FAIL — ${failures} of ${checks} checks failed.`);
    process.exitCode = 1;
} else {
    console.log(`All ${checks} checks pass.`);
    console.log('');
    console.log('⚠️ WHOLE-GROUP MATCHING IS A DELIBERATE NARROWING (Jake, 2026-08-21).');
    console.log('   `lass`, `mass` and `asse` are FINE and B1-B3 hold that line.');
    console.log('   At groupSize 4 a three-letter entry cannot fire at all — see A1.');
}
