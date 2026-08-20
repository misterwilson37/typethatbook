// daylog-cutover-test.mjs v1.1.0 — Round 21 (Hammond), ROADMAP Phase B step B1.
// v1.1.0 (Round 22) adds Part G: lessons-admin.js, the FOURTH reader of
// typing_logs and the one the cutover work missed. Three hand-maintained copies
// of one rule are now held to one behaviour BY EXECUTION rather than by memory.
//
// ⚠️ WRITTEN TEST-FIRST. Against daylog.js v1.1.0 this harness is RED, on
// purpose, and it must be seen red before v1.2.0 is uploaded. Rule 10: the fix
// has to fail on the real shape before it passes on it.
//
// ── WHAT PHASE B IS ─────────────────────────────────────────────────────────
// §3.1: game.js and learn.js each write the WHOLE day total under `seconds`, so
// a stale tab from an earlier period overwrites a newer total and a mode's time
// disappears. The fix is per-source FIELDS — secondsLibrary / secondsSchool —
// which firestore.rules v2.5.0 has permitted since v2.4.0 and which needs NO
// rules deploy (HANDOFF §0.-5.C, verified by rules-probe.test.mjs Part B).
//
// ⚠️ THE BLOCKER WAS NEVER THE WRITERS. It is that both readers are LEGACY-FIRST:
// given a document holding `seconds` beside split fields they return `seconds`
// and ignore the splits. Switch the writers first and every afternoon after the
// switch vanishes behind the morning's flat number. So the READERS ship first,
// alone — which is what this harness guards.
//
// ── WHY A DATE GATE AND NOT A PLAIN SUM ─────────────────────────────────────
// Plain flat+split summing double-counts the days written during the v3.29.x
// window, when the split shipped and was reverted: those documents carry a flat
// number AND split fields describing the same seconds. That is exactly why
// v2.14.0 made the readers legacy-first, and undoing it blindly re-breaks days
// that are currently correct.
//
// ⚠️ JAKE HAS RULED THAT HISTORICAL DATA IS GOOD ENOUGH AND IS NOT TO BE
// REPAIRED (HANDOFF §0.-7.A item 4). A date gate honours that exactly: every day
// before the cutover reads BIT-FOR-BIT as it does today, and no past number
// moves. tests/daylog-test.mjs Part B is the proof — its documents are dated
// 08-17/18/19, all pre-cutover, and it must stay green WITHOUT EDITS.
//
// ⚠️ IF daylog-test.mjs PART B EVER NEEDS CHANGING TO ACCOMMODATE THIS, THE
// CUTOVER IS WRONG. Stop and re-read this paragraph.
//
// Run: node tests/daylog-cutover-test.mjs

import { readWeek, totalsOf, SOURCE_SPLIT_CUTOVER, DAYLOG_VERSION }
    from '../daylog.js';
import { readFileSync } from 'node:fs';

let failures = 0, checks = 0;
const j = (v) => JSON.stringify(v);
const eq = (label, got, want) => {
    checks++;
    if (j(got) !== j(want)) { failures++; console.log(`  FAIL ${label}\n         got  ${j(got)}\n         want ${j(want)}`); }
    else console.log(`  ok   ${label}`);
};

function fakeDb(docs) {
    return {
        db: {},
        doc: (_db, _coll, id) => ({ id }),
        getDoc: async (ref) => {
            const data = docs[ref.id];
            return { exists: () => data !== undefined, data: () => data };
        },
    };
}

console.log(`\ndaylog.js v${DAYLOG_VERSION}, cutover ${SOURCE_SPLIT_CUTOVER}\n`);

// ─── A. the cutover constant itself ──────────────────────────────────────────
console.log('── A. the cutover date ──');
{
    eq('A1 the cutover is exported so both readers can share one value',
       typeof SOURCE_SPLIT_CUTOVER, 'string');
    eq('A2 it is a YYYY-MM-DD string', /^\d{4}-\d{2}-\d{2}$/.test(SOURCE_SPLIT_CUTOVER), true);
    // ⚠️ A SATURDAY ON PURPOSE. The school week is Sat–Fri everywhere in this
    // project, so a cutover on any other day would leave one week half in the
    // old shape and half in the new — and a weekly total spanning both would be
    // the one number nobody could explain. Cutting at a week boundary means no
    // week is ever mixed.
    const dow = new Date(SOURCE_SPLIT_CUTOVER + 'T12:00:00').getDay();
    eq('A3 the cutover falls on a SATURDAY, the school-week boundary', dow, 6);
}

// ─── B. before the cutover: NOTHING MOVES ────────────────────────────────────
console.log('\n── B. before the cutover — legacy-first, unchanged ──');
console.log('   ⚠️ These assertions duplicate daylog-test.mjs Part B ON PURPOSE.');
console.log('   If Phase B ever moves a historical number, it fails here first.');
{
    const PRE = '2026-08-18';
    eq('B1 flat document reads flat',
       totalsOf({ seconds: 600, chars: 900, mistakes: 10 }, PRE),
       { seconds: 600, chars: 900, mistakes: 10 });

    // The v3.29.x shape: a flat number AND a split describing the same seconds.
    eq('B2 flat still WINS over a split beside it — no double count',
       totalsOf({ seconds: 300, chars: 400, mistakes: 5,
                  secondsLibrary: 300, charsLibrary: 400, mistakesLibrary: 5 }, PRE),
       { seconds: 300, chars: 400, mistakes: 5 });

    eq('B3 split-only document is still summed',
       totalsOf({ secondsLibrary: 120, secondsSchool: 60,
                  charsLibrary: 200, charsSchool: 100,
                  mistakesLibrary: 2, mistakesSchool: 1 }, PRE),
       { seconds: 180, chars: 300, mistakes: 3 });

    eq('B4 an absent document is zero, not missing',
       totalsOf(null, PRE), { seconds: 0, chars: 0, mistakes: 0 });
}

// ─── C. on and after the cutover: flat + splits ──────────────────────────────
console.log('\n── C. on and after the cutover — flat plus both splits ──');
{
    const POST = SOURCE_SPLIT_CUTOVER;

    eq('C1 a pure split day sums both sources',
       totalsOf({ secondsLibrary: 600, secondsSchool: 600,
                  charsLibrary: 900, charsSchool: 800,
                  mistakesLibrary: 10, mistakesSchool: 9 }, POST),
       { seconds: 1200, chars: 1700, mistakes: 19 });

    // ⚠️ THE ONE THAT MATTERS. On the cutover day a document can hold a flat
    // number written by the OLD build before the deploy, plus splits written by
    // the new one after it. The flat field is FROZEN at that moment — never
    // written again — so it is the pre-cutover remainder, not a duplicate.
    // Legacy-first would return 600 here and throw away the rest of the day.
    eq('C2 flat is FROZEN and ADDED, not preferred',
       totalsOf({ seconds: 600, chars: 900, mistakes: 10,
                  secondsSchool: 600, charsSchool: 800, mistakesSchool: 9 }, POST),
       { seconds: 1200, chars: 1700, mistakes: 19 });

    eq('C3 a day that is still purely flat is unaffected',
       totalsOf({ seconds: 600, chars: 900, mistakes: 10 }, POST),
       { seconds: 600, chars: 900, mistakes: 10 });

    eq('C4 one source only, no flat',
       totalsOf({ secondsLibrary: 300, charsLibrary: 400, mistakesLibrary: 4 }, POST),
       { seconds: 300, chars: 400, mistakes: 4 });

    eq('C5 an absent document is still zero',
       totalsOf(null, POST), { seconds: 0, chars: 0, mistakes: 0 });
}

// ─── D. the boundary is exact ────────────────────────────────────────────────
console.log('\n── D. the boundary is exact, and inclusive of the cutover day ──');
{
    const cut = new Date(SOURCE_SPLIT_CUTOVER + 'T12:00:00');
    const day = (n) => {
        const d = new Date(cut); d.setDate(d.getDate() + n);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
               '-' + String(d.getDate()).padStart(2, '0');
    };
    const mixed = { seconds: 100, secondsLibrary: 50, secondsSchool: 25 };

    eq('D1 the day BEFORE the cutover is legacy-first', totalsOf(mixed, day(-1)).seconds, 100);
    eq('D2 the cutover day ITSELF sums',                 totalsOf(mixed, day(0)).seconds,  175);
    eq('D3 the day after sums',                          totalsOf(mixed, day(1)).seconds,  175);

    // ⚠️ A MISSING DATE MUST NOT SILENTLY PICK THE NEW BEHAVIOUR. A caller that
    // forgets to pass the date would otherwise start summing historical
    // documents and move numbers Jake has ruled must not move. Defaulting to
    // legacy-first fails toward "nothing changed", which is the safe direction.
    eq('D4 NO DATE AT ALL falls back to legacy-first, not to summing',
       totalsOf(mixed, undefined).seconds, 100);
}

// ─── E. through readWeek, the way the app actually calls it ──────────────────
console.log('\n── E. through readWeek() — the real call path ──');
{
    const cut = SOURCE_SPLIT_CUTOVER;
    const docs = {
        [`u1_${cut}`]: { seconds: 600, chars: 900, mistakes: 10,
                         secondsSchool: 600, charsSchool: 800, mistakesSchool: 9 },
    };
    const r = await readWeek({ ...fakeDb(docs), uid: 'u1', dateStr: cut });
    eq('E1 readWeek passes the date through to the gate',
       r.byDate[cut], { seconds: 1200, chars: 1700, mistakes: 19 });
    eq('E2 today is the same figure', r.today, { seconds: 1200, chars: 1700, mistakes: 19 });
    eq('E3 the week total includes it', r.week.seconds, 1200);
    eq('E4 the read is still clean', r.ok, true);
}

// ─── F. Rule 11 — PARITY WITH reports.html, ENFORCED ────────────────────────
console.log('\n── F. Rule 11 — reports.html carries the SAME gate ──');
console.log('   ⚠️ reports.html keeps its OWN copy of this function and this');
console.log('   constant, because it is a standalone page that imports no');
console.log('   modules. This part LIFTS THAT COPY OUT OF THE SHIPPED FILE and');
console.log('   drives it against ours on identical inputs. If the two ever');
console.log('   disagree, a teacher and a student read the same document and get');
console.log('   different numbers — the entire defect this project exists to');
console.log('   have ended. This is the only mechanical guard on that pair.');
{
    const rep = readFileSync(new URL('../reports.html', import.meta.url), 'utf8');

    // Same brace-matching lift daylog-test.mjs Part G uses on sessionSignature().
    function lift(src, name) {
        const i = src.indexOf('function ' + name + '(');
        if (i < 0) return null;
        let d = 0, j = src.indexOf('{', i);
        for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) break; } }
        return src.slice(i, j + 1);
    }

    const m = rep.match(/const\s+SOURCE_SPLIT_CUTOVER\s*=\s*["']([0-9-]+)["']/);
    eq('F1 reports.html declares a SOURCE_SPLIT_CUTOVER', !!m, true);
    // ⚠️ THE TWO CUTOVER DATES MUST BE IDENTICAL. If reports.html's is LATER,
    // days between the two read legacy-first there while carrying only splits —
    // the teacher sees ZERO for a day the student saw filled in. If it is
    // EARLIER, the teacher double-counts the v3.29.x window.
    eq('F2 and it is THE SAME DATE as daylog.js', m && m[1], SOURCE_SPLIT_CUTOVER);

    const body = lift(rep, 'readLogTotals');
    eq('F3 reports.html still HAS a readLogTotals() to compare against', !!body, true);
    const repRead = body
        ? new Function('SOURCE_SPLIT_CUTOVER', body + '; return readLogTotals;')(SOURCE_SPLIT_CUTOVER)
        : null;

    const PRE = '2026-08-18', POST = SOURCE_SPLIT_CUTOVER;
    const cases = [
        ['pre-cutover flat only',          { seconds: 600, chars: 900, mistakes: 10 }, PRE],
        ['pre-cutover flat beside split',  { seconds: 300, chars: 400, mistakes: 5,
                                             secondsLibrary: 300, charsLibrary: 400, mistakesLibrary: 5 }, PRE],
        ['pre-cutover split only',         { secondsLibrary: 120, secondsSchool: 60,
                                             charsLibrary: 200, charsSchool: 100,
                                             mistakesLibrary: 2, mistakesSchool: 1 }, PRE],
        ['post-cutover both splits',       { secondsLibrary: 600, secondsSchool: 600,
                                             charsLibrary: 900, charsSchool: 800,
                                             mistakesLibrary: 10, mistakesSchool: 9 }, POST],
        ['post-cutover frozen flat + split', { seconds: 600, chars: 900, mistakes: 10,
                                             secondsSchool: 600, charsSchool: 800, mistakesSchool: 9 }, POST],
        ['post-cutover flat only',         { seconds: 600, chars: 900, mistakes: 10 }, POST],
        ['no date at all',                 { seconds: 100, secondsLibrary: 50 }, undefined],
    ];
    for (const [label, data, date] of cases) {
        eq(`F4 parity with reports.html — ${label}`,
           totalsOf(data, date), repRead ? repRead(data, date) : 'NO-LIFT');
    }
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\n── G. the THIRD copy: lessons-admin.js\'s roster totals ──');
console.log('   ⚠️ THE READER NOBODY UPDATED. daylog.js, reports.html and');
console.log('   index.html all learned the cutover in v2.22.0. lessons-admin.js');
console.log('   is the fourth surface that reads typing_logs and its Students');
console.log('   panel was still legacy-first with no gate — so from the cutover');
console.log('   it would have shown a roster of students with a week of nearly');
console.log('   nothing while reports.html showed their real minutes, three');
console.log('   clicks away. Caught by asking "who else reads this collection",');
console.log('   not by any test. This part is that question, mechanised.');
// ═════════════════════════════════════════════════════════════════════════════
{
    const la = readFileSync(new URL('../lessons-admin.js', import.meta.url), 'utf8');

    const m = la.match(/const\s+SOURCE_SPLIT_CUTOVER\s*=\s*["']([0-9-]+)["']/);
    eq('G1 lessons-admin.js declares a SOURCE_SPLIT_CUTOVER', !!m, true);
    eq('G2 and it is THE SAME DATE as daylog.js', m && m[1], SOURCE_SPLIT_CUTOVER);

    // ⚠️ LIFTED, NOT REIMPLEMENTED. The expression is inline in a forEach rather
    // than in a named function, so it is extracted by its own bracketing
    // comment markers. If that block is refactored into a function, lift it the
    // way Part F lifts readLogTotals() — do NOT copy the arithmetic in here,
    // which would make this part agree with a stale idea of the shipped code.
    const start = la.indexOf('const SOURCE_SPLIT_CUTOVER = \'2026-08-22\';');
    const end   = la.indexOf(';', la.indexOf('const secs =', start)) + 1;
    const body  = (start > 0 && end > start) ? la.slice(start, end) : null;
    eq('G3 the roster total expression is still liftable', !!body, true);

    const laRead = body
        ? new Function('data', 'date', body + '; return secs;')
        : null;

    const PRE2 = '2026-08-18', POST2 = SOURCE_SPLIT_CUTOVER;
    const cases = [
        ['pre-cutover flat only',         { seconds: 600 }, PRE2],
        ['pre-cutover flat beside split', { seconds: 300, secondsLibrary: 300 }, PRE2],
        ['pre-cutover split only',        { secondsLibrary: 120, secondsSchool: 60 }, PRE2],
        ['post-cutover both splits',      { secondsLibrary: 600, secondsSchool: 600 }, POST2],
        ['post-cutover frozen flat + split', { seconds: 600, secondsSchool: 600 }, POST2],
        ['post-cutover flat only',        { seconds: 600 }, POST2],
        ['a day with nothing in it',      {}, POST2],
    ];
    for (const [label, data, date] of cases) {
        eq(`G4 parity with daylog.js — ${label}`,
           laRead ? laRead(data, date) : 'NO-LIFT', totalsOf(data, date).seconds);
    }
}

console.log('');
if (failures) {
    console.log(`FAIL — ${failures} of ${checks} checks failed.`);
    process.exitCode = 1;
} else {
    console.log(`All ${checks} checks pass.`);
    console.log('');
    console.log('⚠️ GREEN HERE MEANS THE READERS ARE READY, NOT THAT §3.1 IS FIXED.');
    console.log('   The writers still put the whole day under `seconds`. Until');
    console.log('   game.js and learn.js ship their half, every split field this');
    console.log('   harness describes is zero in production and these totals');
    console.log('   degenerate to exactly what they were before. That is the');
    console.log('   point: ship the readers alone, confirm NOTHING MOVED, then');
    console.log('   move the writers.');
}
