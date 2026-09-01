// busy-state-test.mjs v1.0.0 — ⚠️⚠️ A SLOW CONTROL LOOKS BUSY, AND ALWAYS COMES BACK.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// ROADMAP 41. reports.html had TWO loading indicators in 3,700 lines. Generate,
// the ⚑ regrade, the ⊘ clear-mastery and the ⟳ recalculate all run for seconds
// against the network; only "Scan for flags" said anything, because item 36
// added it.
//
// ⚠️⚠️ THE DISABLE IS A CORRECTNESS FEATURE, NOT A COURTESY. Three of those four
// controls WRITE. A teacher who believes a button did nothing clicks it again —
// and a second ⚑ while the first is still resolving reconstructs the same day
// twice. The label is the half that stops a disabled button reading as a broken
// one; they ship together for that reason.
//
// ⚠️ AND ONE OF THEM WAS ACTUALLY BROKEN. `recalc-btn` set `disabled = true`,
// awaited, then set it false on the next line — with nothing to catch a throw.
// Any failure inside recalcDailyLog() left that button dead until the teacher
// reloaded a page that gave no hint reloading was the cure. Part C is that bug's
// tombstone.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const src = readFileSync(new URL('../reports.html', import.meta.url), 'utf8');

function lift(name, kw = 'async function') {
    const at = src.indexOf(kw + ' ' + name + '(');
    if (at < 0) return null;
    const open = src.indexOf('{', at);
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(at, i + 1); }
    }
    return null;
}

console.log('--- A. THE HELPER EXISTS AND HONOURS ITS CONTRACT ---');
const helper = lift('withBusy');
ok(helper, 'A1 withBusy() exists');

ok(helper && /finally\s*\{/.test(helper),
   '⚠️⚠️ A2 IT RESTORES IN A finally. This is the entire point. A restore on the ' +
   'line after the await is not a restore — it is a restore on the happy path ' +
   'and a permanently dead button on every other one');

ok(helper && /btn\.disabled = wasDisabled/.test(helper) && /btn\.innerHTML = wasHTML/.test(helper),
   '⚠️ A3 IT RESTORES WHAT IT FOUND, not a hardcoded false/label. A button that ' +
   'was already disabled for its own reasons must not be switched on by a helper ' +
   'that borrowed it');

const finallyBlock = helper ? helper.slice(helper.indexOf('finally')) : '';
ok(finallyBlock && !/return\s/.test(finallyBlock),
   '⚠️⚠️ A4 THE finally DOES NOT RETURN OR SWALLOW. A return inside finally ' +
   'discards the exception entirely — the callers here all do their own error ' +
   'reporting, and a helper that ate their failures would hide exactly the ' +
   'errors the restore exists to survive');

ok(helper && /aria-busy/.test(helper),
   '⚠️ A5 aria-busy IS SET AND REMOVED. ROADMAP 40 made these controls reachable ' +
   'by keyboard; a user who cannot see the greyed-out pixels has to be told the ' +
   'control is working');

ok(helper && /const wasHTML = btn\.innerHTML/.test(helper),
   '⚠️ A6 THE ORIGINAL LABEL IS READ AT CALL TIME. These rows re-render ' +
   'constantly; a label cached anywhere outside this call would be reapplied to ' +
   'a button that has since become a different one');

ok(helper && /if \(!btn\) return fn\(\)/.test(helper),
   'A7 a missing button still runs the work rather than throwing');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- B. ⚠️⚠️ ALL FOUR SLOW CONTROLS GO THROUGH IT ---');
for (const [what, re] of [
    ['Generate',       /generate-btn'\)\.onclick[\s\S]{0,120}withBusy\(/],
    ['⚑ regrade',      /withBusy\([^)]*reconstructGrades|withBusy\([\s\S]{0,80}reconstructGrades/],
    ['⟳ recalculate',  /withBusy\([\s\S]{0,80}recalcDailyLog/],
    ['⊘ clear mastery',/withBusy\([\s\S]{0,120}clearMastery/],
]) {
    ok(re.test(src),
       `⚠️ B1 ${what} goes through withBusy(). All four run for seconds and ` +
       `three of them write; one left out is the one a teacher double-fires`);
}

// ⚠️ NO HAND-ROLLED disabled TOGGLING LEFT IN THE CLICK HANDLERS. The pattern
// this item fixed is `disabled = true; await …; disabled = false;` — if it
// reappears, it reappears without a finally, because that is what makes it
// tempting to write in the first place.
const handlerRegion = src.slice(src.indexOf("getElementById('report-body').addEventListener('click'"));
const handlerEnd = handlerRegion.indexOf('\n    });');
const handlers = handlerRegion.slice(0, handlerEnd > 0 ? handlerEnd : 20000);
const rawToggles = [...handlers.matchAll(/\.disabled = true;[\s\S]{0,400}?\.disabled = false;/g)];
const unguarded = rawToggles.filter(m => !/finally/.test(m[0]));
ok(unguarded.length === 0,
   '⚠️⚠️ B2 NO HAND-ROLLED disable/await/enable REMAINS IN THE CLICK HANDLERS ' +
   `(${unguarded.length} found). That shape has no finally — which is precisely ` +
   'how recalc-btn came to leave itself dead on any throw');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- C. THE recalc-btn TOMBSTONE ---');
// Kept as its own section because it was a real defect rather than polish, and
// because the shape that caused it is easy to reintroduce.
ok(/withBusy\([\s\S]{0,80}recalcDailyLog\(idx, li, uid, date\)/.test(src),
   '⚠️⚠️ C1 THE ⟳ HANDLER IS WRAPPED. It previously re-enabled on the line after ' +
   'its await with nothing catching a throw, so a failed recalculation killed the ' +
   'button until reload — on a row that gave no clue reloading was the cure');

ok(/recalcDailyLog\(idx, li, uid, date\)\s*[;)]/.test(src),
   '⚠️ C2 AND IT STILL PASSES NO OPTIONS OBJECT, so it keeps the drop guard by ' +
   'default. recalc-guard-test.mjs A5 owns this property; asserted here too ' +
   'because ROADMAP 41 is what changed the call site\u2019s shape');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- D. THE SCAN BUTTON STILL DOES ITS OWN THING ---');
// ⚠️ NOT A GAP. scanForFlags() reports incremental progress ("42 of 60 students")
// across a loop, which a wrap-the-whole-call helper cannot express. Converting
// it would REMOVE information. Asserted so nobody "finishes the job" later.
const scan = lift('scanForFlags');
ok(scan && /setStatus\(/.test(scan),
   '⚠️ D1 scanForFlags() KEEPS ITS OWN PER-STUDENT PROGRESS REPORTING and is ' +
   'deliberately not converted — withBusy() wraps a call and cannot report from ' +
   'inside a loop. Folding it in would trade real progress for a spinner');
ok(scan && /btn\.disabled = true/.test(scan) && /btn\.disabled = false/.test(scan),
   'D2 and it still disables itself around the work');

console.log('');
if (fail === 0) console.log(`PASS - ${pass} passing, 0 failing`);
else            console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
