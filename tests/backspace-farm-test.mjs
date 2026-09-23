// backspace-farm-test.mjs v1.0.0 — Round 131 (Garamond).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ A HELD BACKSPACE EARNED TEN MINUTES. THIS PINS THAT IT EARNS NOTHING.
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-23: *"students have learned that they can hold the backspace key
// and it counts it as time. So some students are just sitting and holding the
// delete/backspace key for 10 straight minutes."*
//
// `handleTyping()` stamped `lastInputTime` on its first line, for every key,
// before looking at which one. The clock credits time while the last input is
// under IDLE_THRESHOLD old, and a held key auto-repeats ~30 times a second.
//
// ⚠️⚠️ RULE 10, SAID OUT LOUD: THIS IS A REPRODUCTION, NOT A RECORDING. No farmed
// session from a real student was available when this was written. Part C below
// replays the exploit through the REAL thresholds and the REAL guard lifted from
// game.js, which proves the mechanism — but it is not production data. The
// session-flag in reports.html (Round 131, part 5 of Jake's ruling) is what will
// surface real farmed sessions; the first one found belongs in this file.

import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const game = readFileSync(path.join(ROOT, 'game.js'), 'utf8');
const learn = readFileSync(path.join(ROOT, 'learn.js'), 'utf8');

let pass = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok    ' + m); } else { fails.push(m); console.log('  FAIL  ' + m); } };

function extractFn(src, name) {
    const start = src.indexOf(`function ${name}(`);
    if (start < 0) return null;
    let i = src.indexOf('{', start), depth = 0;
    for (let j = i; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
    }
    return null;
}
const constOf = (src, name) => {
    const m = new RegExp(`const ${name} = (\\d+)`).exec(src);
    return m ? parseInt(m[1], 10) : null;
};

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nA — THE RULE, AS A TRUTH TABLE');
const guardSrc = extractFn(game, 'countsAsActivity');
ok(!!guardSrc, 'game.js defines countsAsActivity()');
const countsAsActivity = new Function(`${guardSrc}; return countsAsActivity;`)();
ok(countsAsActivity('a', false) === true, 'A1 a real letter counts');
ok(countsAsActivity(' ', false) === true, 'A2 a real space counts');
ok(countsAsActivity('Enter', false) === true, 'A3 a real Enter counts');
ok(countsAsActivity('Backspace', false) === false,
   '⚠️⚠️ A4 a single Backspace does NOT count — the exploit key');
ok(countsAsActivity('a', true) === false,
   '⚠️⚠️ A5 a HELD letter does not count — the family of exploits');
ok(countsAsActivity('Backspace', true) === false, 'A6 and a held Backspace, doubly not');

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nB — ⚠️⚠️⚠️ THE STAMP IS GUARDED, AND EVERY CALLER PASSES THE REPEAT FLAG');
{
    const ht = extractFn(game, 'handleTyping');
    ok(!!ht, 'game.js defines handleTyping()');
    const code = ht.replace(/^\s*\/\/.*$/gm, '');
    const firstStamp = code.indexOf('lastInputTime = Date.now()');
    const guard = code.indexOf('countsAsActivity(');
    ok(firstStamp > 0 && guard > 0 && guard < firstStamp,
       '⚠️⚠️⚠️ B1 handleTyping() consults the guard BEFORE it stamps — the stamp '
       + 'is no longer its unconditional first line');
    ok((code.match(/lastInputTime = Date\.now\(\)/g) || []).length === 1,
       'B2 and it stamps exactly once, inside the guard');

    // ⚠️ A CALL SITE THAT DROPS THE FLAG SILENTLY RE-OPENS THE REPEAT HOLE.
    const bare = (game.match(/handleTyping\(e\.key\)/g) || []).length;
    const flagged = (game.match(/handleTyping\(e\.key, \{ repeat: e\.repeat === true \}\)/g) || []).length;
    ok(bare === 0, `B3 no caller passes the key without the repeat flag (${bare} found)`);
    ok(flagged >= 3, `B4 every keyboard caller passes it (${flagged} of 3)`);
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nC — ⚠️⚠️⚠️ THE EXPLOIT, REPLAYED THROUGH THE REAL THRESHOLDS');
{
    // ⭐ BOTH NUMBERS COME FROM game.js, NOT FROM THIS FILE. A harness with its
    // own copy of the threshold would keep passing after someone changed it.
    const IDLE = constOf(game, 'IDLE_THRESHOLD');
    const AFK = constOf(game, 'AFK_THRESHOLD');
    ok(IDLE === 2000 && AFK === 5000,
       `C0 the thresholds are what this analysis assumed (idle ${IDLE}, afk ${AFK})`);

    // gameTick() runs every 100 ms and credits 100 ms while input is fresh.
    // A held key: one real press, then auto-repeat at ~33 ms (30 Hz).
    const replay = (stampRule, seconds) => {
        let last = 0, credited = 0, pausedAt = null;
        const repeatMs = 33;
        let nextKey = 0, firstPress = true;
        for (let t = 0; t <= seconds * 1000; t += 1) {
            if (t === nextKey) {
                if (stampRule('Backspace', !firstPress)) last = t || 1;
                firstPress = false;
                nextKey += repeatMs;
            }
            if (t % 100 === 0 && t > 0) {
                if (last && t - last > AFK && pausedAt === null) pausedAt = t;
                if (pausedAt === null && last && t - last < IDLE) credited += 100;
            }
        }
        return { credited: credited / 1000, pausedAt };
    };

    const oldRule = () => true;                      // the unconditional first line
    const before = replay(oldRule, 600);
    const after = replay(countsAsActivity, 600);

    ok(before.credited >= 590,
       `⚠️⚠️ C1 THE OLD RULE PAYS FOR THE HOLD: ${before.credited}s credited for a `
       + '600 s hold — Jake\u2019s ten minutes, reproduced');
    ok(before.pausedAt === null, 'C2 and the old rule never auto-pauses the holder');
    ok(after.credited === 0,
       `⚠️⚠️⚠️ C3 THE NEW RULE PAYS NOTHING: ${after.credited}s credited for the same hold`);
    // ⚠️ C4 WAS FIRST WRITTEN ASSERTING A PAUSE HERE, AND IT WAS WRONG. With no
    // real key EVER pressed, `lastInputTime` stays 0 — which gameTick() treats as
    // "has not started" (the `lastInputTime &&` gate, v3.26.0) — so the AFK check
    // never fires. ⭐ BUT NOTHING IS EARNED EITHER, and that is the property that
    // matters: a hold with no typing before it is a clock that never started, not
    // a clock that is running. C5 and C6 cover the realistic shape, where a word
    // came first and the pause DOES arrive.
    ok(after.pausedAt === null && after.credited === 0,
       'C4 a hold with no typing before it never starts the clock at all');

    // ⚠️ THE REALISTIC SHAPE. A student types a word, THEN holds Backspace. The
    // word stamps legitimately; the hold must not extend it.
    const realistic = (() => {
        let last = 0, credited = 0, pausedAt = null;
        for (let t = 0; t <= 600 * 1000; t += 1) {
            if (t < 1000 && t % 200 === 0) {                  // five letters in 1 s
                if (countsAsActivity('a', false)) last = t || 1;
            } else if (t >= 1000 && (t - 1000) % 33 === 0) {  // then hold Backspace
                if (countsAsActivity('Backspace', t !== 1000)) last = t;
            }
            if (t % 100 === 0 && t > 0) {
                if (last && t - last > AFK && pausedAt === null) pausedAt = t;
                if (pausedAt === null && last && t - last < IDLE) credited += 100;
            }
        }
        return { credited: credited / 1000, pausedAt };
    })();
    ok(realistic.credited <= (1000 + IDLE) / 1000 + 0.1,
       `⚠️⚠️⚠️ C5 type a word then hold for ten minutes: ${realistic.credited}s credited `
       + '— the typing, plus one idle window, and not one second of the hold');
    ok(realistic.pausedAt !== null && realistic.pausedAt <= 800 + AFK + 200,
       `⭐ C6 and the game pauses ${(realistic.pausedAt / 1000).toFixed(1)} s in, `
       + 'so the exploit ends visibly instead of silently');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nD — ⭐ SCHOOL WAS ALREADY IMMUNE, AND STILL IS');
{
    // The precedent this fix copies. If School ever starts stamping on Backspace,
    // the argument that justified Library's change is gone.
    const i = learn.indexOf("else if (e.key === 'Backspace') {");
    const j = learn.indexOf('e.preventDefault(); return;', i);
    const branch = i > 0 && j > i ? learn.slice(i, j) : '';
    ok(branch.length > 0, 'D1 learn.js still has its Backspace branch');
    ok(!/learnLastInputTime\s*=/.test(branch),
       '⚠️⚠️ D2 and that branch still never stamps activity');
}

console.log('\nE — ⚠️⚠️⚠️ THE HISTORY FLAG FINDS FARMED TIME AND LEAVES REAL CHILDREN ALONE');
{
    // ⭐ The game.js fix stops NEW farming; it cannot un-farm what is already
    // stored. reports.html's idleTimeSuspect() finds it. The cases below are the
    // shapes that matter, and the slow-but-genuine ones are real numbers from the
    // 2026-09-22 student traces, not invented ones.
    const reports = readFileSync(path.join(ROOT, 'reports.html'), 'utf8');
    const src = extractFn(reports, 'idleTimeSuspect');
    ok(!!src, 'E0 reports.html defines idleTimeSuspect()');
    const cpm = constOf(reports, 'IDLE_FARM_CPM');
    const min = constOf(reports, 'IDLE_FARM_MIN_SECONDS');
    const suspect = new Function('IDLE_FARM_CPM', 'IDLE_FARM_MIN_SECONDS',
                                 `${src}; return idleTimeSuspect;`)(cpm, min);

    ok(suspect(600, 5) === true,
       '⚠️⚠️⚠️ E1 a ten-minute hold after five letters is flagged — Jake\u2019s case');
    ok(suspect(600, 0) === true, 'E2 a ten-minute hold with nothing at all is flagged');
    // ⭐ REAL SLOW CHILDREN, FROM THE TRACES. 11 WPM is the slowest genuine run
    // seen; at 5 chars a word that is 55 a minute.
    ok(suspect(48, 56) === false,
       'E3 the 9:03 AM run from Jake\u2019s screenshot (48 s, 56 ch, 11 WPM) is NOT flagged — too short to judge');
    ok(suspect(435, 22 * 5) === false,
       '⚠️⚠️ E4 AA\u2019s seven-minute Shards grind (22 words, 435 s) is NOT flagged — slow is not farming');
    ok(suspect(300, 5 * 11 * 5) === false,
       'E5 five genuine minutes at 11 WPM is NOT flagged');
    // ⚠️ THE DILUTION THE COMMENT ADMITS TO, pinned so nobody "fixes" it by
    // lowering the bar until real children trip it.
    ok(suspect(900, 500) === false,
       '⚠️ E6 five real minutes plus a ten-minute hold PASSES at day level — the '
       + 'session and run markers exist precisely for this');
    ok(suspect(30, 0) === false,
       'E7 under a minute is never judged — a child who opened a book and left is not a farmer');

    // ⚠️ IT FLAGS; IT NEVER DEDUCTS. A deduction here would be a second number
    // for the same quantity, one for the teacher and one for the student.
    const code = reports.replace(/^\s*\/\/.*$/gm, '');
    const iFn = code.indexOf('function idleTimeSuspect');
    const body = code.slice(iFn, code.indexOf('\n    }', iFn));
    ok(!/seconds\s*[-=]|updateDoc|setDoc/.test(body),
       '⭐ E8 idleTimeSuspect() only answers a question — it writes and adjusts nothing');
    const uses = (code.match(/idleTimeSuspect\(/g) || []).length;
    ok(uses >= 5, `E9 it marks the student, day, session and run levels (${uses} call sites)`);
}

console.log('\nF — ⚠️⚠️⚠️ RULE 10, SATISFIED: TWO REAL STUDENTS WHO FARMED TIME');
{
    // ⭐⭐ Jake, 2026-09-23, sent the session records of two students he caught
    // holding Backspace — "cheated at least today and probably yesterday" — and
    // offered to wait before deleting them so the flag could be tested. These are
    // those numbers, transcribed from his screenshots. The flag was written BEFORE
    // they arrived (part E), so this is a real out-of-sample test, not a fit.
    //
    // ⚠️⚠️⚠️ AND THERE IS NO GROUND TRUTH FOR ANY INDIVIDUAL RUN. Jake, same day:
    // *"I don't know whether or not they cheated the whole time, and I'm not sure
    // I can trust them to actually tell me … Exactly how much is unknown."*
    // Round 132's first draft of this part called some runs "genuine-looking" and
    // one "the known miss", which quietly assumed an answer nobody has. ⭐ WHAT IS
    // ACTUALLY KNOWN is narrow and it is enough: a multi-minute run with zero or
    // near-zero characters CANNOT be anything but a hold, and every one of those
    // is flagged. Everything else below is a claim about the flag's BEHAVIOUR on
    // a shape, never a verdict about the child.
    const reports = readFileSync(path.join(ROOT, 'reports.html'), 'utf8');
    const src = extractFn(reports, 'idleTimeSuspect');
    const suspect = new Function('IDLE_FARM_CPM', 'IDLE_FARM_MIN_SECONDS',
        `${src}; return idleTimeSuspect;`)(constOf(reports, 'IDLE_FARM_CPM'),
                                           constOf(reports, 'IDLE_FARM_MIN_SECONDS'));
    const t = (m, sec) => m * 60 + sec;

    // ── the holds: every one of these is a child sitting on Backspace ────────
    ok(suspect(t(11, 3), 0),  '⚠️⚠️⚠️ F1 Sherlock 09-22 run 2: 11m03s, 0 chars — FLAGGED');
    ok(suspect(t(10, 2), 0),  '⚠️⚠️⚠️ F2 Lost World 09-22 run 1: 10m02s, 0 chars — FLAGGED');
    ok(suspect(t(4, 50), 2),  '⚠️⚠️ F3 Lost World 09-23 run 1: 4m50s, 2 chars — FLAGGED');
    ok(suspect(t(6, 4), 12),  '⚠️⚠️ F4 Lost World 09-23 run 2: 6m04s, 12 chars — FLAGGED');
    ok(suspect(t(12, 17), 132), 'F5 Sherlock 09-22 as a DAY (132 gross chars) — FLAGGED');
    ok(suspect(t(10, 2), 1),  'F6 Lost World 09-22 as a DAY — FLAGGED');

    // ⭐ SO BOTH STUDENTS ARE FOUND FROM THE ROSTER ROW, without expanding
    // anything: the student marker fires if ANY day trips, and both 09-22s do.
    const sherlockDays = [[t(12, 17), 132], [t(14, 2), 474]];
    const lostDays = [[t(10, 2), 1], [t(11, 1), 322]];
    ok(sherlockDays.some(([s2, c]) => suspect(s2, c)) && lostDays.some(([s2, c]) => suspect(s2, c)),
       '⭐⭐ F7 BOTH students carry ⏸ on their roster row — Jake finds them without opening a day');

    // ── the honest misses ───────────────────────────────────────────────────
    // ⚠️⚠️ THE CERTAIN HOLDS SIT AT 0–2 A MINUTE; EVERY OTHER RUN IN THESE RECORDS
    // SITS AT 17 OR ABOVE. The 15 line falls between. ⚠️ THAT IS NOT PROOF THE
    // RUNS ABOVE 17 ARE CLEAN — some may be partly farmed, and nobody knows which.
    // It is proof only that the flag separates "certainly a hold" from "not
    // certainly a hold", which is the only line this flag claims to draw.
    ok(!suspect(t(2, 39), 66) && !suspect(t(3, 22), 158),
       'F8 Sherlock 09-23 runs 1 and 3 (25 and 47 a minute) are not flagged \u2014 '
       + 'not certainly holds, which is not the same as certainly clean');
    // ⚠️ THE CLOSEST CALL. 6m06s for 106 chars, 17.4 a minute — the slowest run
    // above the line. It may be partly farmed; at run level it is
    // indistinguishable from a very slow child, and lowering the bar to catch it
    // would start catching those. ⭐ Round 131's game.js fix means the shape
    // cannot recur, and 131a (< 15 WPM does not count) makes the question moot
    // going forward: at 6 WPM for the day, none of it would have counted anyway.
    ok(!suspect(t(6, 6), 106),
       '⚠️ F9 Sherlock 09-23 run 2 (17.4/min) is NOT flagged — pinned so nobody '
       + 'lowers the bar onto slow children to catch an ambiguous run');

    // ⚠️⚠️ AND THE DAY-LEVEL MISS HAS A CAUSE THAT IS NOT DILUTION. A day's
    // `chars` is GROSS correct keystrokes (`charsToday++` on every correct key),
    // while a run's `chars` is NET progress (`currentCharIndex - sprintCharStart`).
    // Lost World 09-23: the day says 322, its runs sum to 14. Type-erase-retype
    // piles up gross characters while the cursor never moves, so the DAY reads
    // 29 a minute and passes while every RUN inside it is caught.
    ok(!suspect(t(11, 1), 322) && suspect(t(4, 50), 2) && suspect(t(6, 4), 12),
       '⚠️⚠️⚠️ F10 Lost World 09-23: the day (322 GROSS) passes while both of its '
       + 'runs (2 and 12 NET) are caught — two different quantities, one word');
}

console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed`
                         : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
