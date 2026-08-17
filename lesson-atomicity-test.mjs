// lesson-atomicity-test.mjs v1.0.0 — Round 10 (Williams)
//
// Covers the three claims this round makes that nothing else checks.
//
// ⚠️ GRADED, per Round 9 invariant 65. Each assertion is tagged [BEHAVIOURAL] or
// [STRUCTURAL]. Behavioural ones execute real extracted code and survive any
// refactor that preserves meaning. Structural ones read source text: they catch
// invisible, expensive defects — a deleted system creeping back, a view-state
// invariant quietly dropped — and they will also break on innocent renames.
// When a structural one fails, check whether the claim is still true before
// changing the assertion.

import fs from 'fs';
import path from 'path';

const ROOT = process.argv[2] || '.';
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let pass = 0, fail = 0;
const failures = [];
function ok(kind, name, cond, detail) {
    if (cond) { pass++; return; }
    fail++;
    failures.push(`[${kind}] ${name}` + (detail ? `\n        ${detail}` : ''));
}
const B = (n, c, d) => ok('BEHAVIOURAL', n, c, d);
const S = (n, c, d) => ok('STRUCTURAL',  n, c, d);

// ═══════════════════════════════════════════════════════════════════════════
// 1. LESSONS ARE ATOMIC — the checkpoint system stays deleted
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ THIS IS THE ASSERTION MOST LIKELY TO BE "FIXED" BY A FUTURE ROUND. The
// argument for resuming a lesson mid-run is genuinely appealing — it was
// convincing enough to build the first time — and it is against a ruling. If
// this fails, the question is not "how do I make the test pass" but "has Jake
// changed his mind".
{
    const learn = read('learn.js');

    // Strip comments so the deliberate prose ABOUT the deleted system doesn't
    // read as the system still being there. This is the whole reason the
    // assertion is written against code rather than raw text.
    const code = learn
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

    for (const fn of ['saveRunPosition', 'readRunPosition', 'clearRunPosition',
                      'peekPendingRun', 'takePendingRun', 'checkpointOwner']) {
        S(`learn.js has no executable ${fn}`, !code.includes(fn),
          `${fn} is back. The lesson-resume checkpoint was removed on a ruling ` +
          `in v2.5.0 — see the block comment where it lived.`);
    }
    S('learn.js does not write ttb_learnpos_v1',
      !/setItem\(\s*LEARN_POS_KEY|setItem\(\s*['"]ttb_learnpos/.test(code));
    S('retired keys are purged at init',
      /purgeRetiredKeys\(\)/.test(code) && code.includes("'ttb_learnpos_v1'"));

    // Time must survive what the checkpoint no longer does.
    S('stopLesson() banks time via saveStats()',
      /function stopLesson\(\)[\s\S]{0,900}?saveStats\(\)/.test(code),
      'An abandoned lesson is now the normal way a partial lesson ends. If ' +
      'stopLesson() stops calling saveStats(), those minutes sit in memory ' +
      'until a hide or the 5-minute interval happens to catch them.');
    S('a restart control exists', /function restartLesson\(\)/.test(code));
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. THE VIEW-STATE INVARIANT — beginStep() owns the whole drill view
// ═══════════════════════════════════════════════════════════════════════════
//
// The Round 10 blank screen: #active-drill ships hidden in learn.html and
// showIntro() was the only line that ever unhid it, so the resume path reached
// beginStep() with both children of #drill-view hidden. The path is gone; the
// invariant is what mattered.
{
    const learn = read('learn.js');
    const html  = read('learn.html');
    const body  = learn.slice(learn.indexOf('function beginStep(stepIdx)'));
    const fnEnd = body.indexOf('\n}\n');
    const beginStep = body.slice(0, fnEnd);

    S('learn.html still ships #active-drill hidden',
      /id="active-drill"[^>]*class="hidden"/.test(html),
      'If this changed, the assertion below is no longer load-bearing — but ' +
      'check that nothing else relies on the initial hidden state first.');
    S('beginStep() unhides #active-drill',
      /activeDrill\.classList\.remove\(\s*['"]hidden['"]\s*\)/.test(beginStep),
      'THIS IS THE BLANK SCREEN. beginStep() must resolve the drill view for ' +
      'itself rather than trusting that showIntro() ran first.');
    S('beginStep() hides #intro-panel',
      /introPanel\.classList\.add\(\s*['"]hidden['"]\s*\)/.test(beginStep));
    S('beginStep() clears the intro opacity collapse',
      /activeDrill\.style\.opacity\s*=\s*''/.test(beginStep),
      'showIntro() sets opacity:0 to pre-build the keyboard at real size. ' +
      'Unhiding without clearing that is a blank screen wearing a different hat.');
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. renderMap() cannot leave an empty container
// ═══════════════════════════════════════════════════════════════════════════
{
    const learn = read('learn.js');
    const body = learn.slice(learn.indexOf('function renderMap()'));
    const renderMap = body.slice(0, body.indexOf('\n}\n'));
    S('renderMap() does not blank before building',
      !/^\s*lessonMapEl\.innerHTML\s*=\s*'';/m.test(renderMap),
      'Emptying the container on line 1 means any throw afterwards leaves a ' +
      'blank map with no error a student can report.');
    S('renderMap() swaps a fragment in at the end',
      /replaceChildren\(\s*mapFrag\s*\)/.test(renderMap));
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. THE SHARED STATS WAL — behavioural, against the real module
// ═══════════════════════════════════════════════════════════════════════════
{
    // Minimal localStorage so the module runs under node.
    const store = new Map();
    globalThis.localStorage = {
        getItem: k => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: k => store.delete(k),
    };
    const wal = await import(path.resolve(ROOT, 'stats-wal.js'));
    const { statsWalSave, statsWalRecover, statsWalClear,
            guestAccumSave, guestAccumLoad } = wal;

    const D = '2026-08-17', W = '2026-08-15';
    const mk = (o = {}) => ({
        lastDate: D, weekStart: W,
        secondsToday: 0, charsToday: 0, mistakesToday: 0,
        secondsWeek: 0, charsWeek: 0, mistakesWeek: 0, ...o
    });

    store.clear();
    statsWalSave('uidA', mk({ secondsToday: 300, secondsWeek: 900 }));
    let live = mk({ secondsToday: 120, secondsWeek: 700 });
    B('recovers a tail Firestore never received',
      statsWalRecover('uidA', live) && live.secondsToday === 300 && live.secondsWeek === 900,
      `got secondsToday=${live.secondsToday}`);

    // THE ROUND 10 BUG, as a test: a book switch must not destroy the counters.
    store.clear();
    statsWalSave('uidA', mk({ secondsToday: 480 }));       // Dracula, tab closed
    statsWalSave('uidA', mk({ secondsToday: 300 }));       // Treasure Island opens
    live = mk({ secondsToday: 300 });
    B('a later save cannot lower a stored counter',
      statsWalRecover('uidA', live) && live.secondsToday === 480,
      `got ${live.secondsToday}, expected 480 — this is the exact defect ` +
      `stats-wal.js was extracted to fix, in miniature.`);

    store.clear();
    statsWalSave('uidA', mk({ secondsToday: 500 }));
    live = mk({ secondsToday: 900 });
    B('does not lower a Firestore value that is already ahead',
      statsWalRecover('uidA', live) === false && live.secondsToday === 900);

    store.clear();
    statsWalSave('uidA', mk({ secondsToday: 400 }));
    live = mk({ secondsToday: 10 });
    B('never merges another student\'s record',
      statsWalRecover('uidB', live) === false && live.secondsToday === 10);

    store.clear();
    statsWalSave('uidA', mk({ secondsToday: 400 }));
    statsWalClear('uidB');
    live = mk();
    B('clear() is a no-op against another student\'s record',
      statsWalRecover('uidA', live) && live.secondsToday === 400,
      'A second student signing in on the same browser must not destroy the ' +
      'first one\'s unflushed minutes just by showing up.');

    // Period guards. Yesterday's day counters must not reach today, but the
    // WEEK counters legitimately still can.
    store.clear();
    statsWalSave('uidA', mk({ lastDate: '2026-08-16', secondsToday: 999, secondsWeek: 2000 }));
    live = mk({ secondsToday: 60, secondsWeek: 100 });
    const movedAcrossDay = statsWalRecover('uidA', live);
    B('yesterday\'s DAY counter does not reach today',
      live.secondsToday === 60, `got ${live.secondsToday}`);
    B('yesterday\'s WEEK counter still counts this week',
      movedAcrossDay && live.secondsWeek === 2000, `got ${live.secondsWeek}`);

    store.clear();
    statsWalSave('uidA', mk({ lastDate: '2026-07-01', weekStart: '2026-06-27', secondsToday: 999 }));
    live = mk({ secondsToday: 5 });
    B('a record matching neither period is ignored',
      statsWalRecover('uidA', live) === false && live.secondsToday === 5);
    B('...and is dropped rather than left in storage',
      globalThis.localStorage.getItem('ttb_statswal_v1') === null,
      'A stale record left in place is one date-comparison bug away from ' +
      'being credited to the wrong day.');

    // Guest accumulator
    store.clear();
    guestAccumSave(D, 420, { u1l1: { grade: 'B' } });
    const g = guestAccumLoad(D);
    B('guest minutes survive a tab close', g && g.seconds === 420);
    B('guest lesson results survive too', g && g.lessonProgress.u1l1.grade === 'B');
    B('guest minutes do NOT cross midnight',
      guestAccumLoad('2026-08-18') === null,
      'Crediting yesterday\'s guest typing to today would put a wrong number ' +
      'in a teacher\'s daily report, which is the one place that cannot lie.');
    B('...and the stale record is cleared on the date miss',
      globalThis.localStorage.getItem('ttb_guestAccum_v1') === null);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. THE TWO PAGES AGREE ON FLUSH POLICY
// ═══════════════════════════════════════════════════════════════════════════
//
// Round 9 §4: when two subsystems implement the same thing, the divergence in
// what they DO is the expensive half. These constants are one policy applied to
// the same student on two pages.
{
    const grab = (src, name) => {
        const m = src.match(new RegExp(`const\\s+${name}\\s*=\\s*(\\d+)`));
        return m ? Number(m[1]) : null;
    };
    const game = read('game.js'), learn = read('learn.js');
    const pairs = ['HIDDEN_FLUSH_MIN_GAP_MS', 'HIDDEN_FLUSH_DELTA_SECONDS'];
    for (const c of pairs) {
        const a = grab(game, c), b = grab(learn, c);
        S(`${c} agrees across game.js and learn.js`, a !== null && a === b,
          `game.js=${a} learn.js=${b}`);
    }
    // The delta gate's cost depends entirely on this being a top-up, not a
    // full flush. See the cost model in HANDOFF Round 10 §4.
    S('the delta-driven flush is not unconditionally final (game.js)',
      /flushAll\('hidden',\s*gapElapsed\)/.test(game),
      'A `final` flush writes 2-3 documents. Making the delta path final ' +
      'raises the district-scale ceiling from ~$15/yr to ~$85/yr.');
    S('the delta-driven flush is not unconditionally final (learn.js)',
      /flushStats\('hidden',\s*gapElapsed\)/.test(learn));
    S('game.js recovery does not force a progress write',
      !/statsWalRecover[\s\S]{0,300}?walDirty\s*=\s*true/.test(game),
      'The recovered value is a clock; the reading position did not move.');

    // Both pages must actually participate in the shared WAL.
    for (const [f, src] of [['game.js', game], ['learn.js', learn]]) {
        S(`${f} imports the shared stats WAL`,
          /from\s+["']\.\/stats-wal\.js["']/.test(src));
        S(`${f} writes the shared stats WAL`, /statsWalSave\(/.test(src));
        S(`${f} recovers the shared stats WAL`, /statsWalRecover\(/.test(src));
    }
}

// ═══════════════════════════════════════════════════════════════════════════
console.log(`\nlesson-atomicity-test: ${pass} passed, ${fail} failed`);
if (fail) {
    console.log('\n' + failures.map(f => '  ✗ ' + f).join('\n'));
    process.exit(1);
}
