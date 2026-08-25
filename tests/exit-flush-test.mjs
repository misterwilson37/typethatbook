// exit-flush-test.mjs v1.0.0 — "← MAP" BANKS THE TIME AND THROWS AWAY THE RUN.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE DEFECT, MEASURED ON REAL DATA (Jake's console read, 2026-08-23)
// ═══════════════════════════════════════════════════════════════════════════
//
// `users/{nico}/lessonProgress/u1_l1`, after Jake typed the lesson by his own
// account "a dozen times", finishing each run and clicking ← Map:
//
//     attempts: 3      runCount: 2      furthestRunIdx: 1
//     runAttempts: { 0: 1, 1: 2 }                      ← FOUR runs, not twelve
//
// The same student's `typing_sessions` for that morning carry 10 sprints
// labelled u1_l1 / "run 1" and "run 2". ⚠️ THE TIME LANDED AND THE RUN DID NOT,
// which is the divergence ROADMAP item 4's implausibility flag exists to catch,
// on the most common exit path in the app.
//
// ⚠️ THE MECHANISM IS NOT THE ONE ROADMAP 14b NAMED. 14b said
// `flushLessonProgress()` has one caller in the session-end path and
// `stopLesson()` never calls it. The call sits inside `flushStats()`, which also
// runs on the five-minute interval and on every hide, so a write WAS scheduled
// and DID fire. What killed the run is the next line in `stopLesson()`:
//
//     loadUserProgress()  →  `userProgress = {}`  →  repopulate from the cache
//
// The in-memory run outcomes are destroyed before the scheduled flush reads
// them, while `pendingProgress` still names the lesson — so the flush finds the
// RELOADED record under that id and writes it back. ⚠️ THE WRITE SUCCEEDS,
// returns true, costs a billed write and stores the numbers it just read. That
// is why nothing ever reported an error.
//
// ⚠️ WHY THE FIX CANNOT BE "ADD A FLUSH TO stopLesson()". A flush placed AFTER
// the reload reads as a correct fix, passes any test that only asks whether the
// flush is called, and writes exactly the same stale record. THE ORDER IS THE
// FIX. Part D is the assertion that says so.
//
// PARTS
//   A — ⚠️ THE HARNESS PROVES ITSELF FIRST. The model is driven through the OLD
//       exit and must LOSE runs: twelve completed runs come out as
//       runAttempts {0:1, 1:1} — two — with THREE SUCCESSFUL WRITES on the way.
//       If A2 ever reads 12 the model has stopped being sensitive and every
//       part below it is worthless.
//   B — the shipped exit: 12 runs in, 12 recorded, on the real functions.
//   C — a flush that does not land must not lose the buffer. An offline Chromebook keeps its
//       unflushed runs rather than having them replaced by the server copy.
//   D — ⚠️ ORDER, statically: the flush is awaited BEFORE loadUserProgress(),
//       and stopLesson() no longer reaches loadUserProgress() directly.
//   E — the progress CACHE is refreshed between the flush and the reload.
//       loadUserProgress() prefers the cache over Firestore, so without this the
//       reload re-installs the pre-run copy and the map under-reports.
//   F — the guest path: no currentUser, nothing wiped, nothing thrown.
//
// ⚠️ MUTATION-VERIFIED. Against learn.js v2.33.0 this harness reports 18
// failing across Parts B, C, D, E and F (5 passing). Part A passes on BOTH
// builds by construction — it drives the old path deliberately, and it is the
// only evidence that the other five parts are testing anything.

import { readFileSync } from 'fs';
import { betterGrade, FIRE_GRADE } from '../run-grade.js';
import { runScoreOf, pointsForGrade, MASTERY_POINTS } from '../lesson-gate.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };

const src = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');
const decomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');

// Pull a function out of learn.js by name, brace-matching from its opening `{`.
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
// THE MODEL
// ─────────────────────────────────────────────────────────────────────────────
// A miniature of the page's progress state, driving the REAL
// recordRunOutcome(), flushLessonProgress(), loadUserProgress(),
// refreshProgressCache() and exitLessonToMap() out of learn.js.
//
// ⚠️ THE SERVER AND THE CACHE ARE SEPARATE OBJECTS ON PURPOSE. The defect lives
// in the gap between them: loadUserProgress() prefers the cache, and nothing was
// keeping the cache current. Modelling them as one store would hide it.
function buildWorld({ flushFails = false, signedIn = true } = {}) {
    const w = {
        server: {},                 // users/{uid}/lessonProgress/{id}
        cache: null,                // PROGRESS_CACHE_KEY payload
        writes: 0,
        walWrites: 0,
        rendered: 0,
        locks: 0,
        view: '',
    };

    // ⚠️ THE PAGE'S STATE MUST BE REAL BINDINGS, NOT COPIES. `loadUserProgress()`
    // works by REASSIGNING `userProgress`, and that reassignment is the whole
    // defect. Handing the functions a snapshot object would leave the wipe
    // invisible to this harness — so the state is declared INSIDE the factory,
    // where the extracted bodies close over it exactly as they do in learn.js.
    const env = {
        _uid: signedIn ? { uid: 'nico', email: 'nico@example.test' } : null,
        db: {}, doc: (...a) => a.join('/'), collection: (...a) => a.join('/'),
        // ⚠️ `merge: true` MERGES NESTED MAPS KEY BY KEY — it does not replace
        // them. `runAttempts: {0:1}` written over `{0:1, 1:2}` leaves run 2
        // standing. Modelling it as a wholesale replace would make the old
        // build look WORSE than it is and would misdescribe Jake's record,
        // which is exactly how {0:1, 1:2} survived a dozen runs.
        setDoc: async (path, rec) => {
            if (flushFails) throw new Error('offline');
            w.writes++;
            const id = String(path).split('/').pop();
            const isMap = (v) => v && typeof v === 'object' && !Array.isArray(v);
            const merge = (a, b) => {
                const out = Object.assign({}, a);
                for (const [k, v] of Object.entries(b)) {
                    out[k] = (isMap(v) && isMap(a && a[k])) ? merge(a[k], v) : v;
                }
                return out;
            };
            w.server[id] = merge(w.server[id] || {}, rec);
        },
        getDocs: async () => ({
            forEach: (fn) => Object.entries(w.server)
                .forEach(([id, data]) => fn({ id, data: () => structuredClone(data) })),
        }),
        loadGateState: async () => {},
        cacheRead: () => (w.cache ? structuredClone(w.cache) : null),
        cacheWrite: (_k, payload) => { w.cache = structuredClone(payload); },
        PROGRESS_CACHE_KEY: 'p', PROGRESS_CACHE_MS: 1,
        _wal: () => { w.walWrites++; },
        // ⚠️ v2.34.0 (ROADMAP 14) — recordRunOutcome() now banks mastery points
        // and stamps the lock, so the model has to supply those too. Kept as
        // real imports rather than stubs: the point of this harness is to drive
        // the SHIPPED function, and a stubbed scorer would let a scoring bug
        // through the one place run data is written.
        runScoreOf, pointsForGrade, MASTERY_POINTS,
        _stampLock: () => { w.locks++; },
        _render: () => { w.rendered++; },
        _view: (v) => { w.view = v; },
        console: { warn: () => {}, log: () => {} },
        structuredClone,
        // ⚠️ v1.1.0 — recordRunOutcome() banks a per-run GRADE as of learn.js
        // v2.36.0 (ROADMAP 15) and reaches for run-grade.js's betterGrade() to
        // do it. Imported rather than restated: a harness carrying its own copy
        // of the ordering would pass while the shipped rule changed underneath.
        betterGrade, FIRE_GRADE,
    };

    const NEEDED = ['recordRunOutcome', 'flushLessonProgress',
                    'loadUserProgress', 'refreshProgressCache'];
    const bodies = NEEDED.map(n => extractFn(src, n));
    const exitBody = extractFn(src, 'exitLessonToMap');
    const present = NEEDED.filter((_, i) => bodies[i]);

    const names = Object.keys(env);
    const factory = new Function(...names, `
        let userProgress = {};
        const pendingProgress = new Set();
        let currentUser = _uid, currentLesson = null, currentRuns = [];
        let stepSeconds = 0, learnDirty = false, gateActiveDays = 0;
        function stampLastLockDay() { _stampLock(); }
        function learnWalSave() { _wal(); }
        function renderMap() { _render(); }
        function showView(v) { _view(v); }

        ${bodies.filter(Boolean).join('\n\n')}

        ${exitBody || ''}

        return {
            ${present.join(', ')}${exitBody ? ', exitLessonToMap' : ''},
            setRun: (l, runs, secs) => { currentLesson = l; currentRuns = runs; stepSeconds = secs; },
            progress: () => userProgress,
            pending: () => pendingProgress,
        };
    `);

    w.fns = factory(...names.map(n => env[n]));
    w.missing = NEEDED.filter((_, i) => !bodies[i]);
    w.hasExit = !!exitBody;

    // ⚠️ THE OLD EXIT, KEPT VERBATIM SO PART A CAN DRIVE IT. This is the two
    // lines stopLesson() used to end with. It exists to prove the model can see
    // the defect at all, and for no other reason.
    w.legacyExit = async () => {
        await w.fns.loadUserProgress();
        w.rendered++; w.view = 'map';
    };
    return w;
}

// One completed run of the given lesson, then a click on ← Map.
async function typeRunThenLeave(w, lesson, runIdx, exit) {
    w.fns.setRun(lesson, new Array(lesson.runs).fill(0).map((_, i) => ({ i })), 11);
    w.fns.recordRunOutcome(runIdx, 'A', true);
    await exit();
}

// ⚠️ THE INTERVAL FLUSH IS PART OF THE MODEL AND IT IS WHY THE LOSS LOOKED
// RANDOM. flushStats() runs every five minutes and on every hide, and it calls
// flushLessonProgress(). A run whose flush happened to fire BEFORE the student
// left the lesson landed; every other run was wiped first. Firing it on one run
// in four reproduces Jake's record: four of a dozen, with no pattern a person
// could report.
async function drive(w, exit, sequence = SEQUENCE) {
    for (let i = 0; i < sequence.length; i++) {
        await typeRunThenLeave(w, LESSON, sequence[i], async () => {
            if (i % 4 === 3) await w.fns.flushLessonProgress();   // the interval lands
            await exit();
        });
    }
}

const LESSON = { id: 'u1_l1', runs: 2 };
const totalAttempts = (rec) => Object.values((rec && rec.runAttempts) || {})
    .reduce((a, b) => a + b, 0);

// Jake's own sequence: alternating run 1 / run 2, twelve completed runs, ← Map
// after each. The real record came out as four.
const SEQUENCE = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─── A. ⚠️ THE MODEL REPRODUCES THE LOSS (old exit) ───');
{
    const w = buildWorld();
    ok(w.missing.length === 0,
       'A1 the four progress functions are all extractable from learn.js — missing: ' + w.missing.join(', '));
    await drive(w, w.legacyExit);
    await w.fns.flushLessonProgress();   // whatever the last hide would have taken
    const landed = totalAttempts(w.server[LESSON.id]);
    ok(landed < SEQUENCE.length,
       `A2 ⚠️ the old exit LOSES runs — ${landed} of ${SEQUENCE.length} landed. ` +
       'If this ever reads 12, the model has stopped being sensitive and Parts B–F prove nothing');
    ok(landed > 0 && landed <= 4,
       `A4 ⚠️ and it loses MOST of them, not all (${landed} of ${SEQUENCE.length}) — ` +
       "the shape of Jake's runAttempts {0:1, 1:2} after a dozen runs. Partial survival is " +
       'the fingerprint: only the runs whose interval flush beat the wipe landed');
    ok(w.writes > 0,
       'A3 ⚠️ and the writes SUCCEEDED while doing it — ' + w.writes + ' of them. ' +
       'Nothing failed, which is why no round ever caught this');
}

console.log('\n─── B. THE SHIPPED EXIT BANKS EVERY RUN ───');
{
    const w = buildWorld();
    ok(w.hasExit, 'B1 ⚠️ exitLessonToMap() exists in learn.js');
    if (w.hasExit) {
        await drive(w, w.fns.exitLessonToMap);
        const rec = w.server[LESSON.id];
        ok(rec, 'B2 the lessonProgress document was written');
        ok(totalAttempts(rec) === SEQUENCE.length,
           `B3 ⚠️ all ${SEQUENCE.length} runs are on the record — got ${totalAttempts(rec)}`);
        ok(rec && rec.runAttempts && rec.runAttempts['0'] === SEQUENCE.filter(i => i === 0).length,
           'B4 run 1\u2019s count is exact, not merely non-zero');
        ok(rec && rec.runAttempts['1'] === SEQUENCE.filter(i => i === 1).length,
           'B5 run 2\u2019s count is exact');
        ok(rec && rec.furthestRunIdx === 1, 'B6 furthestRunIdx survives the exit');
        // ⚠️ TIME IS THE HALF THAT ALREADY WORKED. It must still work.
        ok(rec && rec.timeSpentSeconds === 11 * SEQUENCE.length,
           `B7 the seconds are unchanged by the fix — expected ${11 * SEQUENCE.length}, got ` +
           (rec && rec.timeSpentSeconds));
        ok(w.fns.pending().size === 0, 'B8 the queue is empty after a clean exit');
        ok(w.view === 'map' && w.rendered === SEQUENCE.length,
           'B9 the student still lands on a rendered map every time');
    }
}

console.log('\n─── C. A WRITE THAT DOES NOT LAND MUST NOT LOSE THE BUFFER ───');
{
    const w = buildWorld({ flushFails: true });
    if (w.hasExit) {
        await drive(w, w.fns.exitLessonToMap);
        ok(w.fns.pending().has(LESSON.id),
           'C1 the lesson is still queued after every write failed');
        ok(totalAttempts(w.fns.progress()[LESSON.id]) === SEQUENCE.length,
           `C2 \u26a0\ufe0f the unflushed runs are still IN MEMORY — got ` +
           totalAttempts(w.fns.progress()[LESSON.id]) + ' of ' + SEQUENCE.length +
           '. An offline Chromebook must not have its work replaced by the server copy');
        ok(w.walWrites > 0, 'C3 the WAL was re-saved so a crash can still replay them');
        ok(w.view === 'map', 'C4 the student is not stranded in the drill by a failed write');
    } else { fail += 4; console.log('  FAIL: C1–C4 skipped — no exitLessonToMap()'); }
}

console.log('\n─── D. ⚠️ ORDER IS THE FIX, NOT THE CALL ───');
{
    const body = extractFn(decomment(src), 'exitLessonToMap') || '';
    const iFlush = body.indexOf('flushLessonProgress');
    const iLoad  = body.indexOf('loadUserProgress');
    ok(iFlush > -1, 'D1 exitLessonToMap() flushes lesson progress');
    ok(iLoad  > -1, 'D2 exitLessonToMap() reloads progress');
    ok(iFlush > -1 && iLoad > -1 && iFlush < iLoad,
       '\u26a0\ufe0f D3 THE FLUSH COMES BEFORE THE RELOAD. Reversed, the flush writes back the ' +
       'record loadUserProgress() just installed and the fix is cosmetic');
    ok(/await\s+flushLessonProgress\(\)/.test(body),
       'D4 the flush is AWAITED — an unawaited flush races the wipe it exists to beat');
    // stopLesson() must not still hold its own reload.
    const stop = extractFn(decomment(src), 'stopLesson') || '';
    ok(stop.length > 0, 'D5 stopLesson() is still extractable');
    ok(!/loadUserProgress\s*\(/.test(stop),
       '\u26a0\ufe0f D6 stopLesson() does NOT call loadUserProgress() directly any more — ' +
       'that call is what emptied userProgress ahead of the flush');
    ok(/exitLessonToMap\s*\(/.test(stop),
       'D7 stopLesson() leaves through exitLessonToMap()');
}

console.log('\n─── E. THE CACHE THE RELOAD IS ABOUT TO READ ───');
{
    const body = extractFn(decomment(src), 'exitLessonToMap') || '';
    const iRefresh = body.indexOf('refreshProgressCache');
    const iLoad    = body.indexOf('loadUserProgress');
    ok(iRefresh > -1, 'E1 the progress cache is refreshed on the way out');
    ok(iRefresh > -1 && iLoad > -1 && iRefresh < iLoad,
       '\u26a0\ufe0f E2 the refresh happens BEFORE the reload. loadUserProgress() prefers the ' +
       'cache over Firestore, so a stale cache re-installs the pre-run copy');
    // Behavioural: the cache must agree with what was written.
    const w = buildWorld();
    if (w.hasExit) {
        await drive(w, w.fns.exitLessonToMap);
        const cached = w.cache && w.cache.progress && w.cache.progress[LESSON.id];
        ok(cached && totalAttempts(cached) === SEQUENCE.length,
           'E3 \u26a0\ufe0f the cached copy carries the same count as the document — ' +
           'RULE 11 in miniature: the map and the record read one number');
    } else { fail++; console.log('  FAIL: E3 skipped — no exitLessonToMap()'); }
}

console.log('\n─── F. THE GUEST PATH ───');
{
    const w = buildWorld({ signedIn: false });
    if (w.hasExit) {
        let threw = null;
        try { await drive(w, w.fns.exitLessonToMap); }
        catch (e) { threw = e; }
        ok(!threw, 'F1 a guest leaving a lesson does not throw — ' + (threw && threw.message));
        ok(w.writes === 0, 'F2 nothing is written to Firestore for a guest');
        ok(totalAttempts(w.fns.progress()[LESSON.id]) === SEQUENCE.length,
           'F3 \u26a0\ufe0f the guest keeps their runs in memory for the merge at sign-in');
        ok(w.view === 'map', 'F4 the guest still reaches the map');
    } else { fail += 4; console.log('  FAIL: F1–F4 skipped — no exitLessonToMap()'); }
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passing, ${fail} failing`);
process.exit(fail === 0 ? 0 : 1);
