// im-done-test.mjs v1.0.0 — ⚠️⚠️ "I'M DONE" MUST NOT STAMP A CHILD A NUMBER THAT
// IS SMALLER THAN THE ONE THEY WERE JUST WATCHING.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE DEFECT (ROADMAP 25, learn.js v2.36.0 and every version before it)
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-08-25, two screenshots. The HUD reads `Daily 10:02 / 10:00`; the
// receipt stamps `AUG 25 9:31 — RETURNED` and says "Your minutes are counted."
// The gap is 31 seconds and it is exactly the run the child is in the middle of.
// Press it again after a run completes and the two agree.
//
// handleImDone() does everything right — logOpenRun('done'), then
// `await flushStats('done', true)`. The `final` argument then went UNREAD:
//
//     if (!learnDirty && pendingProgress.size === 0) return;    // ← no `final`
//
// ⚠️ THE PER-SECOND TICK INCREMENTS statsData.secondsToday AND DOES NOT SET
// learnDirty. Only saveStats() does, and it is called at RUN BOUNDARIES. So
// mid-run the counter climbs while the flag stays false, every "final" flush in
// that window wrote nothing, and the receipt read a typing_logs the flush had
// never touched.
//
// ⚠️⚠️ AND IT WAS A TWIN DIVERGENCE WHERE THE SIBLING WAS ALREADY CORRECT.
// game.js gates on `if (!walDirty && !final && queued === 0) return;`. Library
// forced the write; School skipped it. Both functions carry comments swearing
// they are "identical in shape" (§0.-13.E) — and they differed in exactly the
// clause that decides whether a child is told the truth about their own minutes.
//
// ⚠️ SO THIS HARNESS DRIVES **BOTH FILES** AND ASSERTS THEY AGREE. A harness
// that checked only the file with the bug would have passed the day before the
// bug was found and every day after it was reintroduced.
//
// ⚠️ MUTATION-VERIFIED: A2 and C1 fail against learn.js v2.36.0.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const learn = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');
const game  = readFileSync(new URL('../game.js',  import.meta.url), 'utf8');

// ⚠️ Assert on CODE, never on prose — this round's own comments quote the buggy
// gate verbatim to explain it, and a matcher reading comments would find the
// defect in the file that fixed it. §0.-31.H.
const decomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');
const learnCode = decomment(learn);
const gameCode  = decomment(game);

function extractFn(s, name) {
    const re = new RegExp('(?:async\\s+)?function\\s+' + name + '\\s*\\(');
    const m = re.exec(s);
    if (!m) return null;
    let i = s.indexOf('{', m.index), depth = 0;
    for (let j = i; j < s.length; j++) {
        if (s[j] === '{') depth++;
        else if (s[j] === '}') { depth--; if (depth === 0) return s.slice(m.index, j + 1); }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- A. THE FLUSH GATE HONOURS `final` IN BOTH FILES ---');
{
    const li = extractFn(learnCode, '_flushStatsInner');
    ok(li !== null, 'A1 learn.js _flushStatsInner() is extractable');

    // The early-return that decides whether anything is written at all.
    const lGate = li && /if\s*\([^)]*Dirty[^)]*\)\s*return;/.exec(li);
    ok(!!lGate, 'A1b learn.js has a dirty-gate early return');
    ok(!!lGate && /!\s*final/.test(lGate[0]),
       '⚠️⚠️ A2 learn.js\u2019s FLUSH GATE READS `final`. Without it, ' +
       '`flushStats("done", true)` returns having written NOTHING whenever the ' +
       'child is mid-run \u2014 which is the whole window in which they press the ' +
       'button \u2014 and the receipt stamps a stale number');

    const gi = extractFn(gameCode, '_flushAllInner');
    ok(gi !== null, 'A3 game.js _flushAllInner() is extractable');
    const gGate = gi && /if\s*\([^)]*Dirty[^)]*\)\s*return;/.exec(gi);
    ok(!!gGate && /!\s*final/.test(gGate[0]),
       'A4 game.js\u2019s flush gate reads `final` too (it always did \u2014 this is ' +
       'the sibling that was already correct)');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- B. THE HANDLER STILL DOES THE THREE THINGS IN ORDER ---');
{
    for (const [label, code, fnName, openFn, flushFn] of [
        ['learn.js', learnCode, 'handleImDone', 'logOpenRun',    'flushStats'],
        ['game.js',  gameCode,  'handleImDone', 'logOpenSprint', 'flushAll'],
    ]) {
        const fn = extractFn(code, fnName);
        ok(fn !== null, `B1 ${label} handleImDone() exists`);
        if (!fn) continue;

        const iOpen  = fn.indexOf(openFn + '(');
        const iFlush = fn.indexOf(flushFn + '(');
        const iRead  = fn.indexOf('readWeek(');
        const iShow  = fn.indexOf('showReceipt(');

        ok(iOpen >= 0 && iFlush > iOpen,
           `⚠️ B2 ${label}: THE OPEN RUN IS CLOSED BEFORE THE FLUSH. Flushing ` +
           'first would leave the tail of the current run unbanked, which is the ' +
           'gap this button exists to close');
        ok(iRead > iFlush,
           `⚠️⚠️ B3 ${label}: THE WEEK IS READ **AFTER** THE FLUSH. Reading first ` +
           'is how the receipt shows a number the flush was about to change \u2014 ' +
           'the same read-before-write shape as \u00a70.-23\u2019s lost run outcomes');
        ok(iShow > iRead,
           `B4 ${label}: the card is drawn last`);
        ok(/await\s+\w*\.?flush/.test(fn) || new RegExp('await\\s+' + flushFn).test(fn),
           `⚠️ B5 ${label}: THE FLUSH IS AWAITED. An un-awaited flush races the ` +
           'read and the receipt becomes a coin toss');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- C. ⚠️ THE TICK DOES NOT MARK THE DAY DIRTY, AND THAT IS WHY ---');
{
    // Not a defect in itself: marking dirty every second would schedule a WAL
    // write every second. It is the REASON `final` has to be honoured, and if a
    // future round makes the tick mark dirty, this assertion should be UPDATED
    // rather than deleted — the gate must still read `final`.
    const li = extractFn(learnCode, '_flushStatsInner') || '';
    ok(/!\s*final/.test(li),
       '⚠️⚠️ C1 THE GATE READS `final` REGARDLESS OF HOW THE DIRTY FLAG BEHAVES. ' +
       'This is the assertion that must survive: a child pressing the button is ' +
       'never "idle", whatever the flag says');

    const save = extractFn(learnCode, 'saveStats') || '';
    ok(/learnDirty\s*=\s*true/.test(save),
       'C2 saveStats() is what sets the flag');

    // ⚠️ The increments must stay where open-unit-test Part E expects them.
    ok(/statsData\.secondsToday\+\+/.test(learnCode),
       'C3 the tick still increments the day counter');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- D. THE RECEIPT REMAINS A RECEIPT ---');
{
    // receipt.js's own header: it is NOT a save button, and the moment a child
    // believes unpressed means unsaved, the quiet one who packs up at the bell
    // loses minutes. These are cheap to assert and expensive to rediscover.
    const rc = readFileSync(new URL('../receipt.js', import.meta.url), 'utf8');
    ok(!/\bSave\b/.test(decomment(rc).replace(/Saving/g, '')),
       '⚠️ D1 THE CARD NEVER SAYS "SAVE". Jake chose "I\u2019m done" \u2014 a child ' +
       'ANNOUNCING something, not performing a chore that can be failed');
    for (const [label, code] of [['learn.js', learnCode], ['game.js', gameCode]]) {
        const fn = extractFn(code, 'handleImDone') || '';
        ok(!/confirm\(|alert\(/.test(fn),
           `⚠️ D2 ${label}: NO CONFIRM OR NAG. It reads and it draws; blocking an ` +
           'exit on it would make it the "save or lose it" button it must never be');
    }
}

console.log('');
if (fail === 0) console.log(`PASS - ${pass} passing, 0 failing`);
else            console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
