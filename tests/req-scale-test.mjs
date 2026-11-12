// req-scale-test.mjs v1.0.0 — Round 166. REQUIREMENTS AS A PERCENTAGE.
//
// Jake, 2026-11-12: *"if the requirement is 10%, I can go in and say 70%, which would make it
// 7%... I could make their requirements 110%, so they have to be better (but not over 100%,
// obviously). This would also maintain the climb in requirements."*
//
//   A  the arithmetic, and "student replaces class, field by field"
//   B  ⭐ grades: a 70% student passes what a 100% student fails, a 110% student fails what
//      a 100% student passes — through the REAL grade rule
//   C  ⚠️ every lesson requirement on both School pages goes through the scaled path
//   D  ⚠️ the student never sees a percentage
//   E  the student's own setting reaches an open page live; Reports grades and shows it
import { readFileSync } from 'node:fs';

const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)),
                            removeItem: k => store.delete(k) };
const R = await import('../req-scale.js');
const G = await import('../run-grade.js');
const W = await import('../day-wipe.js');

let pass = 0, fail = 0; const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };
const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

console.log('\nA — THE ARITHMETIC');
{
    ok(R.scaleWpm(10, R.resolveReq(null, { reqSpeedPct: 70 })) === 7, '⭐ A1 Jake\'s own example: 10 at 70% is 7');
    ok(R.scaleWpm(10, R.resolveReq(null, { reqSpeedPct: 110 })) === 11, 'A2 …and 10 at 110% is 11');
    ok(R.scaleWpm(15, R.resolveReq(null, { reqSpeedPct: 70 })) === 10.5, 'A3 one decimal: 15 at 70% is 10.5');
    ok(R.scaleAcc(95, R.resolveReq(null, { reqAccPct: 110 })) === 100, '⚠️ A4 accuracy never goes above 100%');
    ok(R.scaleAcc(90, R.resolveReq(null, { reqAccPct: 70 })) === 63, 'A5 90% at 70% is 63%');
    const both = R.resolveReq({ reqSpeedPct: 80, reqAccPct: 80 }, { reqSpeedPct: 110 });
    ok(both.speedPct === 110 && both.speedFrom === 'student', '⭐ A6 the student\'s setting replaces the class\'s…');
    ok(both.accPct === 80 && both.accFrom === 'class', 'A7 …field by field: their unset accuracy follows the class');
    ok(R.resolveReq(null, null).speedPct === 100 && !R.isAdjusted(R.resolveReq(null, null)), 'A8 nothing set → 100%, not adjusted');
    ok(R.cleanPct(5) === 25 && R.cleanPct(900) === 200 && R.cleanPct('') === null && R.cleanPct('x') === null,
       'A9 stored values are clamped 25..200; junk is "not set"');
    const g = R.scaleGates({ minWPM: null, minAccuracy: 85, strictSpeed: true }, R.resolveReq(null, { reqSpeedPct: 50, reqAccPct: 50 }));
    ok(g.minWPM === null && g.minAccuracy === 43 && g.strictSpeed === true,
       '⚠️ A10 a run with no speed gate keeps none; strictSpeed is untouched');
    ok(R.describeReq(R.resolveReq(null, { reqSpeedPct: 70, reqAccPct: 90 })) === 'speed 70% · accuracy 90%'
       && R.describeReq(R.NO_SCALE) === '', 'A11 the Reports wording, blank when standard');
}

console.log('\nB — ⭐ GRADES, THROUGH THE REAL RULE');
{
    const run = { type: 'passage' };
    const lg = { minWPM: 20, minAccuracy: 90 };
    const std = G.gatesForRun(run, lg);
    const cdc = R.scaleGates(std, R.resolveReq({ reqSpeedPct: 70, reqAccPct: 70 }, null));
    ok(cdc.minWPM === 14 && cdc.minAccuracy === 63, 'B0 a 20 WPM / 90% run is 14 / 63 at 70%');
    const slow = { wpm: 15, acc: 70 };
    ok(!G.gradeAdvances(G.calculateGrade(slow.wpm, slow.acc, std.minWPM, std.minAccuracy, false), std),
       'B1 15 WPM at 70% FAILS the standard bar');
    ok(G.gradeAdvances(G.calculateGrade(slow.wpm, slow.acc, cdc.minWPM, cdc.minAccuracy, false), cdc),
       '⭐ B2 …and PASSES at 70%');
    const hard = R.scaleGates(std, R.resolveReq(null, { reqSpeedPct: 110, reqAccPct: 110 }));
    ok(hard.minAccuracy === 99, 'B3 90% at 110% is 99%');
    ok(G.gradeAdvances(G.calculateGrade(24, 95, std.minWPM, std.minAccuracy, false), std)
       && !G.gradeAdvances(G.calculateGrade(24, 95, hard.minWPM, hard.minAccuracy, false), hard),
       '⭐ B4 24 WPM at 95% passes the standard bar and FAILS at 110% — they have to be better');
    // Reports' rebuild path takes the same scaling.
    const lesson = { id: 'l', gates: lg, steps: [{ type: 'passage', text: 'x'.repeat(40) }] };
    const att = { runIdx: 0, wpm: 15, accuracy: 70, clean: false };
    const plain = G.gradeMergedRun(att, lesson, null);
    const mine  = G.gradeMergedRun(att, lesson, null, g => R.scaleGates(g, R.resolveReq({ reqSpeedPct: 70, reqAccPct: 70 }, null)));
    ok(plain.ok && mine.ok && !plain.advances && mine.advances,
       '⭐ B5 Reports\' grade rebuild judges the student against THEIR bar');
}

console.log('\nC — ⚠️ EVERY LESSON REQUIREMENT IS SCALED, ON BOTH PAGES');
for (const f of ['learn.js', 'learn2.js']) {
    const src = read(f);
    ok(/function effGates\(run, lessonGates\) \{ return scaleGates\(gatesForRun\(run, lessonGates\), reqScale\); \}/.test(src),
       `C1 ${f}: effGates() scales gatesForRun()`);
    ok(!/gatesForRun\(currentStep/.test(src), `⚠️⚠️ C2 ${f}: no lesson run is graded through the UNSCALED gates`);
    ok(/scaleAcc\(g\.minAccuracy == null \? 85 : g\.minAccuracy, reqScale\)/.test(src)
       && /scaleWpm\(g\.minWPM == null \? 15 : g\.minWPM, reqScale\)/.test(src),
       `C3 ${f}: the lesson card shows the student's own numbers`);
    ok(/reqClassDoc = cd; refreshReqScale\(\);/.test(src), `C4 ${f}: the class's percentages load with the class`);
    ok(/onData: \(d\) => \{ reqUserDoc = d; refreshReqScale\(\); \}/.test(src), `C5 ${f}: the student's own arrive on the account listener`);
}
ok(/scaleLessonGates\(currentLesson && currentLesson\.gates, reqScale\)/.test(read('learn2.js')),
   'C6 learn2.js: Deadline\'s pace follows the scaled lesson gates');
{
    const g = read('game.js');
    ok(/function gatePasses\(m\) \{ return m\.wpm >= gateMinWpm\(\) && m\.acc >= gateMinAcc\(\); \}/.test(g),
       'C7 game.js: Library\'s gate judges at the scaled line');
    ok(/onData: \(d\) => \{ reqUserDoc = d; refreshReqScale\(\); \}/.test(g), 'C8 game.js: live student setting');
}

console.log('\nD — ⚠️ THE STUDENT NEVER SEES A PERCENTAGE');
for (const f of ['learn.js', 'learn2.js', 'game.js']) {
    const code = read(f).replace(/^\s*\/\/.*$/gm, '');
    ok(!/\.speedPct|\.accPct|describeReq/.test(code), `D1 ${f} never reads a percentage out to show it`);
}

console.log('\nE — LIVE, AND IN REPORTS');
{
    let seen = [];
    let cb = null;
    const w = W.watchAccount({ db: {}, doc: () => 'x', onSnapshot: (_r, next) => { cb = next; return () => {}; },
                               uid: 'k', today: () => '2026-11-12', onReload: () => {}, onData: d => seen.push(d),
                               firstTimeoutMs: 50 });
    cb({ exists: () => true, data: () => ({ reqSpeedPct: 70 }), metadata: {} });
    await w.ready;
    cb({ exists: () => true, data: () => ({ reqSpeedPct: 80 }), metadata: {} });
    ok(seen.length === 2 && seen[1].reqSpeedPct === 80, '⭐ E1 a change in Reports reaches an open page on the listener it already has');
    w.stop();
    const r = read('reports.html');
    const heads = [...r.matchAll(/<th data-col="([a-z]+)"/g)].map(m => m[1]);
    ok(heads.join(',') === 'name,email,seconds,chars,wpm,accuracy,days,adjusted',
       '⭐⭐ E2 Adjusted is its OWN column, LAST — every column Jake reads stays where it was');
    ok(/'Days Active', 'Adjusted'\]/.test(r), 'E3 the CSV appends it — the first eight columns are unchanged');
    ok(/gradeSprintsForDay\(sprints, r\.uid\)/.test(r) && /gradeSprintsForDay\(allSprints, uid\)/.test(r)
       && /gradeMergedRun\(att, lesson, rec \? rec\.runCount : null, _reqScaleFn\)/.test(r),
       'E4 every Reports grade is judged against the student\'s own bar');
    const la = read('lessons-admin.js');
    ok(/\['class-reqspeed-input', 'reqSpeedPct'\], \['class-reqacc-input', 'reqAccPct'\]/.test(la),
       'E5 the Class Manager saves the class\'s percentages');
}

console.log(fail ? `\nreq-scale-test: ${pass} passed, ${fail} FAILED` : `\nreq-scale-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   ✗ ' + f)); process.exit(1); }
