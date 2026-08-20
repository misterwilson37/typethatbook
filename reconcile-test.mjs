// reconcile-test.mjs v1.0.0
//
// ⚠️ PATHS: sources are read as `../` — this file lives in tests/ (Round 17).
//
// ⚠️ READ THIS BEFORE TRUSTING A GREEN RUN FROM IT.
//
// Round 16 shipped three defects in two days and every one of them passed a
// full suite, because every test in that suite checked ARITHMETIC and every one
// of those bugs was CHOREOGRAPHY — which handler fired twice, what the browser
// does at page death, whether a localStorage clear survived teardown. A harness
// cannot reach any of that. It runs in Node, there is no tab to close, no
// second handler, no page death.
//
// So this file deliberately does NOT claim to prove the reconciliation view is
// correct. It proves three narrower things, each of which is a specific defect
// that was possible in the code as first written:
//
//   A. buildRebuildPlan()'s REFUSALS. The plan must never propose zeroing a day
//      that has no session records, must never propose writing a day that has
//      no daily-log document to write into, and must hold today's rows back by
//      default. These are the properties that make a bulk repair safe to give
//      to someone whose students are the blast radius, and they are pure
//      functions of the swept data, which is exactly the shape a harness CAN
//      hold.
//
//   B. POSITION IS NOT IDENTITY. reportData is sorted in place by renderTable(),
//      and the reconcile sweep finishes by sorting the table by Δ. The first
//      version of buildRebuildPlan() keyed its moves by the array index the
//      sweep captured — which meant every correction would have been written to
//      whichever student happened to occupy that row after the sort. It was
//      found by reading, not by testing, and every arithmetic assertion in the
//      repo would have stayed green through it. Part B is the regression guard,
//      and it is the reason this file exists at all.
//
//   C. STRUCTURAL GUARDS on reports.html's source text — that the read-only
//      half really is read-only, and that the bulk path does not pass
//      allowZero. These are greps, not behaviour, and they are honest about
//      being greps. They catch the edit that would quietly turn the safe
//      version into the unsafe one.
//
// What is NOT covered, and must be checked by hand in the browser:
//   * that the sweep's queries are permitted by firestore.rules for a real
//     staff account (the rules are not evaluated here),
//   * that the ⟳ path still works after recalcDailyLog()'s return type changed,
//   * anything at all about what happens when a student's tab is open during a
//     rebuild — which is the failure mode the "not during a period" rule exists
//     for and which no harness will ever see.

import { readFileSync } from 'fs';
const rep = readFileSync(new URL('../reports.html', import.meta.url), 'utf8');

// ⚠️ NOT the same lift() as source-split-test.mjs, and the difference is load-
// bearing. That one takes the first `{` after the name as the start of the
// body, which is correct for `function f(a, b) {` and WRONG for
// `function buildRebuildPlan({ includeToday = false } = {})` — the first brace
// there belongs to the destructured parameter, so brace-matching closes on the
// parameter list and lifts a function with no body. That failure is loud (a
// SyntaxError at construction), which is the only reason it is safe to have two
// of these; a quiet version of this bug would lift a truncated function and
// test it. Walk the parameter parens first, then take the next brace.
function lift(src, name) {
    const i = src.indexOf('function ' + name + '(');
    if (i < 0) return null;
    let p = src.indexOf('(', i), pd = 0, k = p;
    for (; k < src.length; k++) { if (src[k] === '(') pd++; else if (src[k] === ')') { pd--; if (!pd) break; } }
    let d = 0, j = src.indexOf('{', k);
    for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) break; } }
    return src.slice(i, j + 1);
}

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };

// buildRebuildPlan() reads four things from module scope: localToday(),
// uidIndexMap(), reportData and reconState. All four are liftable or trivially
// stubbed, which is what makes the plan testable without a DOM or Firestore.
const planBody   = lift(rep, 'buildRebuildPlan');
const uidMapBody = lift(rep, 'uidIndexMap');
const datesBody  = lift(rep, 'datesInRange');
ok(!!planBody,   'reports.html: buildRebuildPlan() exists');
ok(!!uidMapBody, 'reports.html: uidIndexMap() exists');
ok(!!datesBody,  'reports.html: datesInRange() exists');

// Build a scope with the two module globals as mutable closure variables.
function makePlanner(reportData, reconState, today) {
    return new Function('reportData', 'reconState', '__today', `
        function localToday() { return __today; }
        ${uidMapBody}
        ${planBody}
        return buildRebuildPlan;
    `)(reportData, reconState, today);
}

const datesInRange = datesBody
    ? new Function(datesBody + '; return datesInRange;')()
    : null;

const TODAY = '2026-08-19';

// Two students. Bea sorts after Abe by name and BEFORE him by delta — which is
// the whole point of Part B.
function fixture() {
    const reportData = [
        { uid: 'u_abe', name: 'Abe',
          dailyLogs: [ { docId: 'u_abe_2026-08-17', date: '2026-08-17', seconds: 600, chars: 1000, mistakes: 20 },
                       { docId: 'u_abe_2026-08-19', date: '2026-08-19', seconds: 300, chars: 500,  mistakes: 5 } ] },
        { uid: 'u_bea', name: 'Bea',
          dailyLogs: [ { docId: 'u_bea_2026-08-17', date: '2026-08-17', seconds: 120, chars: 200,  mistakes: 2 },
                       { docId: 'u_bea_2026-08-18', date: '2026-08-18', seconds: 900, chars: 1500, mistakes: 30 } ] },
    ];
    const S = (seconds, chars, mistakes, docCount, dupes = 0) =>
        ({ seconds, chars, mistakes, docCount, keptCount: docCount - dupes, dupes });
    const reconState = { results: [
        // Abe 8/17: log says 600s, sessions say 450s — a real DOWN move.
        { idx: 0, uid: 'u_abe', date: '2026-08-17', li: 0, hasLog: true, docId: 'u_abe_2026-08-17',
          logSeconds: 600, logChars: 1000, logMistakes: 20, sess: S(450, 900, 18, 3), error: null },
        // Abe 8/19 is TODAY: log 300s, sessions 380s. Held back by default.
        { idx: 0, uid: 'u_abe', date: '2026-08-19', li: 1, hasLog: true, docId: 'u_abe_2026-08-19',
          logSeconds: 300, logChars: 500, logMistakes: 5, sess: S(380, 640, 7, 2), error: null },
        // Bea 8/17: log 120s, NO session documents at all. Must never be zeroed.
        { idx: 1, uid: 'u_bea', date: '2026-08-17', li: 0, hasLog: true, docId: 'u_bea_2026-08-17',
          logSeconds: 120, logChars: 200, logMistakes: 2, sess: S(0, 0, 0, 0), error: null },
        // Bea 8/18: log 900s, sessions 1200s — a real UP move, with a duplicate.
        { idx: 1, uid: 'u_bea', date: '2026-08-18', li: 1, hasLog: true, docId: 'u_bea_2026-08-18',
          logSeconds: 900, logChars: 1500, logMistakes: 30, sess: S(1200, 2000, 33, 4, 1), error: null },
        // Bea 8/16: sessions exist but there is NO daily-log document.
        { idx: 1, uid: 'u_bea', date: '2026-08-16', li: null, hasLog: false, docId: null,
          logSeconds: 0, logChars: 0, logMistakes: 0, sess: S(500, 800, 9, 2), error: null },
        // Abe 8/16: a day that could not be read at all.
        { idx: 0, uid: 'u_abe', date: '2026-08-16', li: null, hasLog: false, docId: null,
          logSeconds: 0, logChars: 0, logMistakes: 0, sess: null, error: 'permission-denied' },
    ] };
    return { reportData, reconState };
}

console.log('\n─── A. buildRebuildPlan refusals ───');
if (planBody && uidMapBody) {
    const { reportData, reconState } = fixture();
    const plan = makePlanner(reportData, reconState, TODAY)({ includeToday: false });

    ok(plan.down.length === 1 && plan.down[0].uid === 'u_abe' && plan.down[0].date === '2026-08-17',
       'a day whose sessions total LESS than its log is proposed as a DOWN move');
    ok(plan.down[0].fromSeconds === 600 && plan.down[0].toSeconds === 450,
       'the DOWN move carries both the old and the new number, so the preview can show the movement');

    ok(plan.up.length === 1 && plan.up[0].uid === 'u_bea' && plan.up[0].date === '2026-08-18',
       'a day whose sessions total MORE than its log is proposed as an UP move');
    ok(plan.up[0].dupes === 1,
       'a move carries the duplicate count for its day, so the preview can say the new total excludes them');

    // ⚠️ THE ONE THAT MATTERS MOST. A day with no session records is usually a
    // day from before session logging existed (v2.4.0) or one whose sessions
    // have aged past the 120-day TTL. Its log total is real and is the only
    // copy left. Rebuilding it to zero would destroy a child's graded time and
    // would look exactly like a successful repair.
    const beaZeroProposed = [...plan.down, ...plan.up, ...plan.todayHeld]
        .some(m => m.uid === 'u_bea' && m.date === '2026-08-17');
    ok(!beaZeroProposed,
       'A DAY WITH NO SESSION RECORDS IS NEVER PROPOSED FOR REBUILD — it is not zeroed, at all, ever');
    ok(plan.skipped.some(s => s.uid === 'u_bea' && s.date === '2026-08-17' && /never zeroed/.test(s.why)),
       'that day is listed as skipped with its reason, rather than silently omitted');

    // Sessions with no log document: firestore.rules gives staff UPDATE only on
    // typing_logs, never CREATE. There is nothing to write into.
    const beaOrphanProposed = [...plan.down, ...plan.up, ...plan.todayHeld]
        .some(m => m.uid === 'u_bea' && m.date === '2026-08-16');
    ok(!beaOrphanProposed,
       'a day with sessions but NO daily-log document is never proposed (staff cannot create one)');
    ok(plan.skipped.some(s => s.uid === 'u_bea' && s.date === '2026-08-16'),
       'that day is surfaced as skipped, so real typing with no cached total is visible rather than lost');

    const abeErrProposed = [...plan.down, ...plan.up, ...plan.todayHeld]
        .some(m => m.uid === 'u_abe' && m.date === '2026-08-16');
    ok(!abeErrProposed, 'a day that could not be READ is never proposed for a write');
    ok(plan.skipped.some(s => s.uid === 'u_abe' && s.date === '2026-08-16' && /could not be read/.test(s.why)),
       'an unreadable day is reported, so a failed read never passes for a clean one');

    // Today is excluded by default: sessions are written at unit boundaries, so
    // a student mid-chapter has real time in the log that is not in sessions
    // yet, and rebuilding now truncates them to their last completed unit.
    ok(plan.todayHeld.length === 1 && plan.todayHeld[0].date === TODAY,
       "today's rows are held back from the default plan");
    ok(!plan.down.concat(plan.up).some(m => m.date === TODAY),
       'no row dated today reaches the write lists unless it is asked for');

    const withToday = makePlanner(reportData, reconState, TODAY)({ includeToday: true });
    ok(withToday.up.some(m => m.date === TODAY) || withToday.down.some(m => m.date === TODAY),
       "ticking 'include today' moves today's rows into the plan — the escape hatch works");
    ok(withToday.todayHeld.length === 0,
       'and nothing is left held back once it has been asked for');

    // A day already in agreement is not busywork.
    const agreed = fixture();
    agreed.reconState.results = [{
        idx: 0, uid: 'u_abe', date: '2026-08-17', li: 0, hasLog: true, docId: 'u_abe_2026-08-17',
        logSeconds: 600, logChars: 1000, logMistakes: 20,
        sess: { seconds: 600, chars: 1000, mistakes: 20, docCount: 3, keptCount: 3, dupes: 0 }, error: null,
    }];
    const noop = makePlanner(agreed.reportData, agreed.reconState, TODAY)({ includeToday: false });
    ok(noop.down.length === 0 && noop.up.length === 0 && noop.skipped.length === 0,
       'a day whose log already equals its sessions produces no move and no noise');

    // Mistakes alone differing is still a difference worth writing — accuracy
    // is graded from it.
    const mm = fixture();
    mm.reconState.results = [{
        idx: 0, uid: 'u_abe', date: '2026-08-17', li: 0, hasLog: true, docId: 'u_abe_2026-08-17',
        logSeconds: 600, logChars: 1000, logMistakes: 20,
        sess: { seconds: 600, chars: 1000, mistakes: 44, docCount: 3, keptCount: 3, dupes: 0 }, error: null,
    }];
    const mmPlan = makePlanner(mm.reportData, mm.reconState, TODAY)({ includeToday: false });
    ok(mmPlan.up.length + mmPlan.down.length === 1,
       'a day matching on seconds and chars but differing on MISTAKES is still rebuilt (accuracy is graded)');
}

console.log('\n─── B. position is not identity ───');
if (planBody && uidMapBody) {
    // Sweep order, then the sort renderTable() performs. If the plan keys moves
    // by the sweep's captured index, Abe's correction lands on Bea.
    const { reportData, reconState } = fixture();
    reportData.reverse();                       // Bea now at index 0, Abe at 1
    const plan = makePlanner(reportData, reconState, TODAY)({ includeToday: false });

    const down = plan.down[0];
    ok(down.uid === 'u_abe' && down.name === 'Abe',
       'after the table is re-sorted, a move still names the student it belongs to');
    ok(down.fromSeconds === 600 && down.toSeconds === 450,
       "and still carries that student's own numbers, not the numbers of whoever took their old row");

    const up = plan.up[0];
    ok(up.uid === 'u_bea' && up.name === 'Bea' && up.fromSeconds === 900,
       'the same holds for the student who moved the other way');

    // The plan must not carry a stale positional index at all — if it did,
    // something downstream could still use it.
    ok(!('idx' in down) && !('idx' in up),
       'moves carry NO captured array index, so nothing downstream can accidentally trust one');

    // And the write path must resolve by uid at the moment of writing.
    ok(/const byUid = uidIndexMap\(\);/.test(rep) &&
       /const idx = byUid\.get\(m\.uid\);/.test(rep),
       'runRebuildAll() resolves each row by uid at write time, not from the preview');
}

console.log('\n─── C. structural guards on reports.html ───');
{
    // The reconciliation half must issue no writes. Bounded between its own
    // banner and the rebuild banner so this stays meaningful as the file grows.
    const a = rep.indexOf('RECONCILIATION  (v2.15.0)');
    const b = rep.indexOf('REBUILD-ALL  (v2.15.0)');
    ok(a > 0 && b > a, 'the read-only half and the writing half are still separated by their banners');
    if (a > 0 && b > a) {
        const readOnly = rep.slice(a, b);
        const writes = ['updateDoc(', 'setDoc(', 'deleteDoc(', 'addDoc(', 'deleteField('];
        const found = writes.filter(w => readOnly.includes(w));
        ok(found.length === 0,
           'THE RECONCILIATION HALF CONTAINS NO WRITE CALL — found: ' + (found.join(', ') || 'none'));
    }

    // allowZero is what lets the post-delete cascade write a zero. The bulk
    // path must never pass it: there, an empty session result means "this day
    // predates sessions", not "this day is genuinely empty now".
    const rb = rep.indexOf('async function runRebuildAll');
    const rbEnd = rep.indexOf('\n    }', rb);
    const rbBody = rb > 0 ? rep.slice(rb, rbEnd) : '';
    ok(rb > 0 && !/allowZero/.test(rbBody),
       'runRebuildAll() never passes allowZero — a bulk repair cannot zero a day');
    ok(/expect: m\.expect/.test(rbBody),
       'runRebuildAll() passes the previewed totals as `expect`, so the write is the thing that was previewed');

    // The expect guard has to sit BEFORE the write or it guards nothing.
    const rc = rep.indexOf('async function recalcDailyLog');
    const guardAt = rep.indexOf('THE PREVIEW MUST PREDICT THE WRITE', rc);
    const writeAt = rep.indexOf('await updateDoc(doc(db, "typing_logs", log.docId)', rc);
    ok(guardAt > rc && writeAt > guardAt,
       'the `expect` staleness check runs BEFORE recalcDailyLog()\'s updateDoc, not after it');

    // The three reconciliation fields must start as null, not 0 — "not measured"
    // and "measured, clean" must never render the same.
    ok(/sessSeconds: null, sessChars: null, sessMistakes: null/.test(rep),
       'report rows start with null reconciliation fields, so an unchecked student never reads as clean');
}

console.log('\n─── D. datesInRange ───');
if (datesInRange) {
    ok(datesInRange('2026-08-17', '2026-08-19').join(',') === '2026-08-17,2026-08-18,2026-08-19',
       'an inclusive range yields every day at both ends');
    ok(datesInRange('2026-08-19', '2026-08-19').length === 1, 'a single-day range yields one day');
    ok(datesInRange('2026-08-20', '2026-08-19').length === 0, 'a backwards range yields nothing rather than looping');
    ok(datesInRange('2026-02-27', '2026-03-02').join(',') === '2026-02-27,2026-02-28,2026-03-01,2026-03-02',
       'a month boundary is crossed correctly');
    // ⚠️ The rest of this page builds date strings through toISOString(), which
    // is UTC. Here that would be a real defect: an off-by-one day queries a
    // date no session was ever filed under, and the result is an empty read
    // that looks exactly like a clean one. Local noon is what avoids it.
    ok(datesInRange('2026-08-17', '2026-08-17')[0] === '2026-08-17',
       'a date survives the round trip unshifted (the UTC off-by-one trap)');
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passed, ${fail} failed.`);
process.exit(fail === 0 ? 0 : 1);
