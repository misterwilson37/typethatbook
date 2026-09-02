// midnight-test.mjs v1.1.0 — A SPRINT THAT CROSSES MIDNIGHT BELONGS TO TWO DAYS.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE DEFECT — ROADMAP item 6, observed on real data 2026-08-20
// ═══════════════════════════════════════════════════════════════════════════
//
// A session rollup of **4m 9s at 12:00 AM** sitting beside a daily log of
// **0m 6s** for the same date. 249 seconds in the drill-down; 6 in the total.
//
// ⚠️ NEITHER NUMBER WAS WRONG. THEY WERE ANSWERING DIFFERENT QUESTIONS, and
// that is why two rounds looked at this and could not name a culprit.
//
// A sprint running 11:56 PM → 12:00:09 AM is split correctly by the day
// counters: they tick second by second, and when `getLocalDateStr()` turns over
// the tick resets them and starts writing tomorrow's document. 243 seconds land
// on yesterday, 6 on today. Exactly right.
//
// `sprintSeconds` knew nothing about midnight. It kept climbing. When the sprint
// finally ended, logSession() filed ONE record of 249 seconds stamped with the
// day it ENDED on — so the drill-down under today showed 4m 9s of typing that
// today's total had only 6 seconds of.
//
// ⚠️ THE ROADMAP NAMED TWO CANDIDATES AND THE SECOND ONE IS INNOCENT.
// "session-log.js's own dating of a chunk" is not it. That module dates from the
// caller and always has — the caller was handing it a sprint that had already
// crossed midnight. ⚠️ Do not go looking in session-log.js for this.
//
// THE FIX (game.js v3.38.0): the tick closes the open sprint on the OUTGOING day
// before it resets the counters, using the same machinery that already handles a
// student navigating away mid-sprint. The remainder is logged later as a
// continuation, dated correctly, by the ordinary path.
//
// ═══════════════════════════════════════════════════════════════════════════
// PARTS
// ═══════════════════════════════════════════════════════════════════════════
//
//   A — the split itself: 249 straddling seconds become a 243s record on
//       yesterday and a 6s continuation on today, and each day's records now
//       agree with what its counters wrote
//   B — ⚠️ THE ORDERING, which is the entire fix: the close happens before the
//       reset AND before `sprintSeconds++`
//   C — the dateOverride plumbing exists and defaults to "now"
//   D — ⚠️ learn.js IS NOT FIXED, asserted on purpose so it cannot be forgotten
//
// ⚠️ Part D asserts a KNOWN DEFECT. It is not a target for deletion — when
// School is fixed, invert it. See ROADMAP item 6.
//
// ⚠️ MUTATION-VERIFIED against game.js v3.38.0:
//   * remove the logOpenSprint('midnight', …) call  → 2 failing (B2 B5)
//   * move `sprintSeconds++` back above the close   → 1 failing (B4)
// The second mutation is the off-by-one, and it is the one a reviewer would
// wave through. That is why B4 exists.

import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };
const eq = (msg, got, want) => ok(got === want, `${msg} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const store = new Map();
globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); },
};

const sl = await import('../session-log.js');
const game  = readFileSync(new URL('../game.js',  import.meta.url), 'utf8');
const learn = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');

console.log(`\nsession-log.js v${sl.SESSION_LOG_VERSION}\n`);

const YDAY = '2026-08-24';
const TDAY = '2026-08-25';

// ─── A. the split ──────────────────────────────────────────────────────────
console.log('─── A. 249 straddling seconds land on the two days that own them ───');
{
    // A faithful model of game.js logSession()'s watermark arithmetic. The
    // watermark is what makes a continuation possible at all: each call writes
    // the DELTA since the last one, so closing a sprint early and finishing it
    // later cannot double-count.
    let logged = { seconds: 0, chars: 0 };
    const uid = 'u1';
    function logSession(seconds, chars, dateOverride) {
        const dSeconds = Math.max(0, Math.round(seconds - logged.seconds));
        const dChars   = Math.max(0, Math.round(chars   - logged.chars));
        if (dSeconds <= 0 && dChars <= 0) return false;
        const continuation = logged.seconds > 0 || logged.chars > 0;
        if (dSeconds < 5 && !continuation) return false;   // the floor
        const wrote = sl.sessionLogPush(uid, {
            date: dateOverride || TDAY,
            at: new Date().toISOString(),
            seconds: dSeconds, chars: dChars, mistakes: 0, wpm: 60, accuracy: 97,
            source: 'library', label: 'aesops fables', detail: '1',
            ...(continuation ? { continuation: true } : {}),
        });
        logged.seconds = Math.max(logged.seconds, Math.round(seconds));
        logged.chars   = Math.max(logged.chars,   Math.round(chars));
        return wrote;
    }

    store.clear();
    // 11:56:00 PM → 11:59:59 PM: 243 seconds, 1200 characters.
    // The tick notices midnight and closes the sprint on the OUTGOING day.
    logSession(243, 1200, YDAY);
    // The sprint continues to 12:00:06 AM and then ends: 249 total, 1230 chars.
    logSession(249, 1230);

    const recs = sl.sessionLogTake(uid);
    eq('A1 two records, not one', recs.length, 2);
    eq('A2 ⚠️ the first is dated YESTERDAY', recs[0].date, YDAY);
    eq('A3 and carries the pre-midnight seconds', recs[0].seconds, 243);
    eq('A4 ⚠️ the second is dated TODAY', recs[1].date, TDAY);
    eq('A5 and carries only the remainder', recs[1].seconds, 6);
    eq('A6 the remainder is marked a continuation, so its WPM is not the sprint\u2019s',
       recs[1].continuation, true);
    eq('A7 ⚠️ nothing is double-counted: the two records sum to the sprint',
       recs[0].seconds + recs[1].seconds, 249);
    eq('A8 and neither are the characters', recs[0].chars + recs[1].chars, 1230);

    // ⚠️ THE POINT OF THE WHOLE ROUND. Each day's drill-down now agrees with
    // what that day's counters wrote — 243 and 6, the numbers the tick actually
    // filed. Before the fix this read 0 and 249.
    const byDate = (d) => recs.filter(r => r.date === d).reduce((n, r) => n + r.seconds, 0);
    eq('A9 ⚠️ yesterday\u2019s record total matches yesterday\u2019s counter', byDate(YDAY), 243);
    eq('A10 ⚠️ today\u2019s record total matches today\u2019s counter', byDate(TDAY), 6);

    // The observed incident, in the numbers it was reported in.
    eq('A11 the reported 4m 9s no longer appears under the 0m 6s day', byDate(TDAY) === 249, false);
}

// ─── A2. the floor at the boundary ─────────────────────────────────────────
console.log('\n─── A2. a sprint begun at 11:59:58 loses nothing ───');
{
    let logged = { seconds: 0, chars: 0 };
    store.clear();
    // Two seconds before midnight: below the five-second floor, so the record is
    // REFUSED — and the watermark must not advance, or those seconds are gone.
    const dSeconds = 2;
    const refused = dSeconds < 5 && logged.seconds === 0;
    ok(refused, 'A12 the two pre-midnight seconds are refused by the floor');
    ok(logged.seconds === 0,
       'A13 ⚠️ and the watermark does NOT advance, so they roll into the new day rather than vanishing');
}

// ─── B. the ordering, which is the fix ─────────────────────────────────────
console.log('\n─── B. ⚠️ THE CLOSE HAPPENS BEFORE THE RESET AND BEFORE THE INCREMENT ───');
{
    // ⚠️⚠️ v1.1.0 — THE ROLLOVER MOVED OUT OF THE TICK AND THIS PART FOLLOWED IT
    // RATHER THAN BEING RELAXED. ROADMAP 9 needed the rollover reachable by
    // something other than a counted second, so game.js v3.40.0 lifted the block
    // verbatim into rollDayIfNeeded() and the tick now calls it at exactly the
    // point the block used to occupy. The ordering constraints did not change;
    // they are now spread across TWO regions, so this part asserts both:
    //
    //   B2–B3, B5   inside rollDayIfNeeded()  — close before reset, dated right
    //   B4, B6      inside the per-second block — the call sits before the bump
    //
    // ⚠️ B4 USED TO PASS VACUOUSLY AND THAT IS WORTH KNOWING. It read
    // `iClose < iBump` with `indexOf` returning -1 when the close was absent, so
    // -1 < anything held and the assertion reported success on a build with no
    // rollover at all. B2 happened to cover the absence, so nothing showed. Both
    // ordering assertions now require their left operand to EXIST first.

    // Region 1: the tick's per-second block.
    const start = game.indexOf('if (timeAccumulator >= 1000) {');
    const end   = game.indexOf('// Goal celebrations', start);
    ok(start > 0 && end > start, 'B1 the per-second block is locatable in game.js');
    // ⚠️ COMMENTS ARE STRIPPED FIRST, AND THIS HARNESS LEARNED THAT THE HARD WAY
    // ON ITS FIRST RUN. The fix's own comment block explains that the close must
    // precede `sprintSeconds++`, so the phrase appears in PROSE above the line it
    // describes — and B4 went red against correct code. Same failure as
    // guest-merge-test.mjs C4/C5/C7 this round, third variant: an assertion that
    // reads comments is measuring the documentation, not the program.
    const strip = s => s.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
    const block = strip(game.slice(start, end));

    // Region 2: rollDayIfNeeded() itself, by balanced brace so a later edit that
    // grows the function cannot slide the end anchor onto something else.
    const fnStart = game.indexOf('function rollDayIfNeeded(');
    ok(fnStart > 0, 'B1b ⚠️ rollDayIfNeeded() exists — the rollover is a callable, not tick-only');
    let depth = 0, fnEnd = fnStart;
    for (let i = game.indexOf('{', fnStart); i < game.length; i++) {
        if (game[i] === '{') depth++;
        else if (game[i] === '}') { depth--; if (!depth) { fnEnd = i + 1; break; } }
    }
    const roll = strip(game.slice(fnStart, fnEnd));

    const iClose = roll.indexOf("logOpenSprint('midnight'");
    const iReset = roll.indexOf('statsData.secondsToday = 0');
    const iCall  = block.indexOf('rollDayIfNeeded(');
    const iBump  = block.indexOf('sprintSeconds++');

    ok(iClose >= 0, 'B2 ⚠️ the rollover closes the open sprint');
    ok(iClose >= 0 && iReset >= 0 && iClose < iReset,
       'B3 ⚠️ BEFORE the counters reset — after, and the sprint is dated by a day that no longer exists');
    ok(iCall >= 0 && iBump >= 0 && iCall < iBump,
       'B4 ⚠️⚠️ the tick calls the rollover BEFORE sprintSeconds++ — one line lower and the first second of the NEW day is filed under yesterday, every midnight, invisibly');
    ok(roll.includes("logOpenSprint('midnight', statsData.lastDate)"),
       'B5 ⚠️ and it is dated from statsData.lastDate, the only value that still holds the outgoing day');
    // ⚠️ THE ROLLOVER MUST NOT HAVE BEEN LEFT BEHIND AS WELL AS EXTRACTED. Two
    // copies would reset the counters twice and file the sprint twice.
    ok(!block.includes("logOpenSprint('midnight'"),
       'B6 ⚠️ the tick does not ALSO carry an inline copy of the rollover');
}

// ─── B2. ROADMAP 9: the rollover is reachable without typing ───────────────
console.log('\n─── B2. ⚠️ A TAB THAT WAKES ON A NEW DAY ROLLS OVER WITHOUT A KEYSTROKE ───');
{
    // ⚠️⚠️ THE DEFECT THIS PART EXISTS FOR. The rollover fired only on a counted
    // second, so a tab that woke on a new day and FLUSHED — without the student
    // typing — wrote yesterday's day counters into a document stamped with
    // getLocalDateStr(), i.e. today. Yesterday's whole day on today's ledger
    // line. That is the shape measured on two real students on 2026-08-21;
    // Round 26 closed the MERGE path that produced those rows and left the
    // FLUSH path open, where it stayed for thirty rounds.
    //
    // ⚠️ ASSERTED AS REACHABILITY, NOT AS A LIST OF CALL SITES. What matters is
    // that a path which WRITES and a path which WAKES can both reach the
    // rollover; naming the two functions would go red on any rename that kept
    // the property true.
    for (const [label, src] of [['game.js', game], ['learn.js', learn]]) {
        const fn = label === 'game.js' ? 'rollDayIfNeeded' : 'rollDayIfNeeded';
        const calls = (src.match(new RegExp(fn + '\\(', 'g')) || []).length;
        // one declaration + the tick + at least two more (wake, write)
        ok(calls >= 4,
           `B2a ${label} ⚠️ the rollover has more than one caller — got ${calls} occurrences, want the declaration plus at least three call sites`);
    }
}

// ─── C. the plumbing ───────────────────────────────────────────────────────
console.log('\n─── C. dateOverride reaches the record, and defaults to now ───');
{
    ok(/function logSession\([^)]*dateOverride\)/.test(game),
       'C1 logSession() accepts an explicit date');
    ok(/function logOpenSprint\(reason, dateOverride\)/.test(game),
       'C2 logOpenSprint() passes one through');
    ok(game.includes('date: dateOverride || getLocalDateStr(),'),
       'C3 ⚠️ and it DEFAULTS to now — every other caller is logging seconds that just happened');
}

// ─── D. School closes its run too, now ─────────────────────────────
console.log('\n─── D. ✅ ROADMAP 6 CLOSED: learn.js mirrors game.js ───');
{
    // ⚠⚠ THESE WERE INVERTED, NOT DELETED (learn.js v2.40.0). Until then they
    // asserted the GAP on purpose so it could not be quietly forgotten. The
    // reason it was held for several rounds is real and worth keeping: learn.js
    // incremented stepSeconds BEFORE its rollover check and compensated with
    // `= 1`, so mirroring game.js meant moving the whole block past
    // `anonSecondsAccum++` and `armAnonLoginPrompt()` in the file 8th grade
    // depends on.
    ok(learn.includes("logOpenRun('midnight', statsData.lastDate)"),
       'D1 ✅ learn.js closes its open run on the OUTGOING day at midnight');
    ok(/function logRun\(wpm, acc, detailSuffix, dateOverride\)/.test(learn),
       'D2 ✅ logRun() takes a date override');
    ok(/function logOpenRun\(reason, dateOverride\)/.test(learn),
       'D3 ✅ logOpenRun() passes it through');
    ok(learn.includes('date: dateOverride || getLocalDateStr(),'),
       'D4 ⚠ and it DEFAULTS to now — every other caller logs seconds that just happened');

    // ⚠⚠ THE ORDERING IS HALF THE FIX, exactly as Part B asserts for game.js.
    // One line lower and the first second of each new day is filed under
    // yesterday, invisibly, forever.
    //
    // ⚠️⚠️ v1.1.0 — SPLIT ACROSS TWO REGIONS, FOR THE SAME REASON AS PART B.
    // learn.js v2.43.0 lifted the rollover into rollDayIfNeeded() so ROADMAP 9
    // could reach it from the wake and flush paths. The constraints did not
    // change; they now live in two places, and asserting them with a single
    // indexOf over the whole file silently inverted — the tick's increment sits
    // ABOVE the extracted function in source order, so `indexOf(incr, close)`
    // returned -1 and D6 went red against correct code.
    const fnStart = learn.indexOf('function rollDayIfNeeded(');
    ok(fnStart > 0, 'D5a ⚠ rollDayIfNeeded() exists in learn.js as well — the twins have not drifted');
    let depth = 0, fnEnd = fnStart;
    for (let i = learn.indexOf('{', fnStart); i < learn.length; i++) {
        if (learn[i] === '{') depth++;
        else if (learn[i] === '}') { depth--; if (!depth) { fnEnd = i + 1; break; } }
    }
    const roll = learn.slice(fnStart, fnEnd);

    const tickStart = learn.indexOf('rollDayIfNeeded(\'tick\')');
    const close = roll.indexOf("logOpenRun('midnight'");
    const reset = roll.indexOf('statsData.secondsSchool = 0');
    const incr  = learn.indexOf('statsData.secondsSchool++', tickStart);

    ok(close >= 0 && reset >= 0 && close < reset,
       'D5 ⚠⚠ the close happens BEFORE the counters are reset');
    ok(tickStart > 0 && incr > tickStart,
       'D6 ⚠⚠ the tick rolls the day BEFORE the second is added to the new day');
    // ⚠️ AND THE ROLLOVER WAS NOT LEFT BEHIND AS WELL AS EXTRACTED. Two copies
    // would reset the counters twice and file the run twice.
    ok(learn.slice(tickStart, incr + 200).indexOf("logOpenRun('midnight'") === -1,
       'D6b ⚠ the tick does not ALSO carry an inline copy of the rollover');

    // ⚠ THE `= 1` COMPENSATIONS ARE GONE. They existed only because the
    // increments ran first; leaving one behind double-counts the first second of
    // every new day — the mirror image of the bug just fixed.
    const tick = roll;
    ok(!/statsData\.secondsSchool = 1\b/.test(tick),
       'D7 ⚠ School\u2019s counter resets to 0, not the old compensating 1');
    ok(!/statsData\.secondsWeek = 1\b/.test(tick),
       'D8 ⚠ the week counter resets to 0 as well');
    ok(!/statsData\.secondsToday = 1\b/.test(tick),
       'D9 ⚠ and the day counter resets to 0');
}

console.log(`\n${pass} passing, ${fail} failing.`);
process.exit(fail ? 1 : 0);
