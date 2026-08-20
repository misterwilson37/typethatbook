// daylog-test.mjs v1.0.0 — the shared day-log reader, HANDOFF §0.0.
//
// daylog.js is the module that made "one number" possible: both student pages
// and the report now read `typing_logs/{uid}_{date}`, and this is the only
// implementation of "read a week out of that collection". It is a pure-ish
// module with its dependencies injected, so unlike most of this repo's surface
// it can genuinely be driven end to end from Node.
//
// ⚠️ FIVE MUTATION-VERIFIED GUARDS. Each of these was broken on purpose and the
// named part fails. A guard nobody has broken deliberately is decoration:
//
//   1. Make readWeek() return ok:true on a failed day      → Part C fails (2)
//   2. Sum the split fields ON TOP OF a flat `seconds`      → Part B fails (1)
//   3. Anchor the week on Monday instead of Saturday        → Part A fails (3)
//   4. Have applyWeekToStats() ADD instead of ASSIGN        → Part D fails (2)
//   5. Build dates with toISOString() instead of local noon → Part A fails (1)
//
// ⚠️ WHAT THIS CANNOT COVER, and it is the important half. It cannot see whether
// `firestore.rules` v2.5.0 actually permits a student to read their own
// typing_logs — that is the single deployment step the whole redesign rests on,
// it is a console action, and no harness in Node will ever check it. If Jake
// reports students seeing 0:00 after this ships, THAT is the first thing to
// check, not this file being green.

// ⚠️ TIMEZONE IS PINNED BEFORE ANY Date IS CONSTRUCTED, AND THAT IS LOAD-BEARING.
// The container this runs in is UTC, where toISOString() and local time agree —
// so the "never use toISOString()" guard below passed happily against a version
// that used toISOString(), i.e. it proved nothing. Jake's students are in
// Central. Pinning the zone makes the assertion mean the same thing here, on his
// machine, and in CI. Must precede the import of daylog.js.
process.env.TZ = 'America/Chicago';

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import {
    readWeek, applyWeekToStats, weekStartOf, weekDatesOf, localDateStr,
    sessionSignature, sumDaySessions, projectDayTotal, DAYLOG_VERSION,
} from '../daylog.js';

let pass = 0, fail = 0;
const bad = [];
function eq(label, got, want) {
    try { assert.deepEqual(got, want); pass++; }
    catch (_) {
        fail++;
        bad.push(`  ${label}\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`);
    }
}

// ─── A. The Saturday anchor ──────────────────────────────────────────────────
// ⚠️ THE SCHOOL WEEK IS SAT–FRI AND THIS FILE MUST AGREE WITH getWeekStart() IN
// game.js AND learn.js. reports.html v2.10.0 anchored on Monday, matched no
// student's stored week, silently skipped all ninety of them and reported a
// clean audit. A wrong anchor here does not throw either — it reads seven days
// that are not the student's week.

// 2026-08-19 is a Wednesday. Its school week starts Saturday 2026-08-15.
eq('A1 weekStartOf: midweek → the preceding Saturday', weekStartOf('2026-08-19'), '2026-08-15');
eq('A2 weekStartOf: a Saturday is its own week start', weekStartOf('2026-08-15'), '2026-08-15');
eq('A3 weekStartOf: Friday still belongs to that Saturday', weekStartOf('2026-08-21'), '2026-08-15');
eq('A4 weekStartOf: the NEXT Saturday starts a new week', weekStartOf('2026-08-22'), '2026-08-22');

eq('A5 weekDatesOf: seven days, Saturday first', weekDatesOf('2026-08-19'),
   ['2026-08-15','2026-08-16','2026-08-17','2026-08-18','2026-08-19','2026-08-20','2026-08-21']);

// ⚠️ MONTH AND YEAR BOUNDARIES, because this is date arithmetic and the failure
// mode is a day that quietly does not exist.
eq('A6 weekDatesOf crosses a month boundary', weekDatesOf('2026-09-01'),
   ['2026-08-29','2026-08-30','2026-08-31','2026-09-01','2026-09-02','2026-09-03','2026-09-04']);
eq('A7 weekStartOf crosses a year boundary', weekStartOf('2027-01-01'), '2026-12-26');

// ⚠️ LOCAL NOON, NEVER toISOString(). Every date in this app is a local string.
// A UTC round trip shifts the date by a whole day for anyone west of Greenwich
// after 5pm — which is Nashville, every evening — and the shifted date names a
// document nothing was ever filed under.
// 23:30 Central on the 19th is 04:30 UTC on the TWENTIETH. A UTC round trip
// renames the day, and the renamed day names a document nothing was filed under.
eq('A8 localDateStr is local, not UTC (evening in Central)',
   localDateStr(new Date(2026, 7, 19, 23, 30, 0)), '2026-08-19');
eq('A9 weekStartOf survives a late-evening date string',
   weekStartOf(localDateStr(new Date(2026, 7, 21, 23, 45, 0))), '2026-08-15');

// ─── B. Reading one document's totals ────────────────────────────────────────
// The legacy-first rule, mirroring reports.html's readLogTotals(). The
// per-source split shipped in game.js v3.29.0 and was REVERTED in v3.30.0, so a
// handful of documents carry split fields. Summing both shapes double-counts
// every ordinary day; reading the split ONLY when there is no flat field
// recovers those few days and touches nothing else.

function fakeDb(docs) {
    return {
        db: {},
        doc: (_db, _coll, id) => ({ id }),
        getDoc: async (ref) => {
            if (docs[ref.id] === 'THROW') throw new Error('permission-denied');
            const data = docs[ref.id];
            return { exists: () => data !== undefined, data: () => data };
        },
    };
}
const D = (date, o) => [`u1_${date}`, o];
const week = (pairs) => Object.fromEntries(pairs);

{
    const docs = week([
        D('2026-08-17', { seconds: 600, chars: 900, mistakes: 10 }),
        // Flat AND split on the same document: the flat number is the whole day
        // from the shared counter, so the split beside it is the same time again.
        D('2026-08-18', { seconds: 300, chars: 400, mistakes: 5,
                          secondsLibrary: 300, charsLibrary: 400, mistakesLibrary: 5 }),
        // Split only — written during the window the split was live.
        D('2026-08-19', { secondsLibrary: 120, secondsSchool: 60,
                          charsLibrary: 200, charsSchool: 100,
                          mistakesLibrary: 2, mistakesSchool: 1 }),
    ]);
    const r = await readWeek({ ...fakeDb(docs), uid: 'u1', dateStr: '2026-08-19' });
    eq('B1 flat document reads flat', r.byDate['2026-08-17'], { seconds: 600, chars: 900, mistakes: 10 });
    eq('B2 flat WINS over a split beside it (no double count)',
       r.byDate['2026-08-18'], { seconds: 300, chars: 400, mistakes: 5 });
    eq('B3 split-only document is summed', r.byDate['2026-08-19'],
       { seconds: 180, chars: 300, mistakes: 3 });
    eq('B4 a day with no document is zero, not missing',
       r.byDate['2026-08-15'], { seconds: 0, chars: 0, mistakes: 0 });
    eq('B5 week is the sum of all seven', r.week,
       { seconds: 1080, chars: 1600, mistakes: 18 });
    eq('B6 today is picked out by date', r.today, { seconds: 180, chars: 300, mistakes: 3 });
    eq('B7 weekStart is reported', r.weekStart, '2026-08-15');
}

// ─── C. ⚠️ A PARTIAL READ IS NOT A CLEAN READ ────────────────────────────────
// This is the guard that matters most and the one with no visible symptom. If
// one of the seven reads fails and readWeek() reports ok:true anyway, the caller
// paints a total that is short by however much that day held — and an
// undercount is indistinguishable, on screen, from a light week. Jake's whole
// objection to inflation applies in reverse here: a child shown less than they
// earned has been lied to just as surely.
{
    const docs = week([
        D('2026-08-17', { seconds: 600, chars: 0, mistakes: 0 }),
        D('2026-08-18', 'THROW'),
    ]);
    const r = await readWeek({ ...fakeDb(docs), uid: 'u1', dateStr: '2026-08-19' });
    eq('C1 ok is FALSE when any day failed to read', r.ok, false);
    eq('C2 the failed day contributes zero rather than NaN',
       r.byDate['2026-08-18'], { seconds: 0, chars: 0, mistakes: 0 });
}
{
    const r = await readWeek({ ...fakeDb(week([])), uid: 'u1', dateStr: '2026-08-19' });
    eq('C3 an entirely empty week is ok:true — nothing typed is not a failure', r.ok, true);
    eq('C4 an entirely empty week totals zero', r.week, { seconds: 0, chars: 0, mistakes: 0 });
}

// ─── D. applyWeekToStats ASSIGNS, it does not ACCUMULATE ─────────────────────
// ⚠️ THE OLD MODEL SEEDED A COUNTER FROM STORAGE AND ADDED TO IT. That is how a
// week counter gets doubled, and it was doubled in production, twice. Here the
// server side simply IS what the seven documents say; this tab's own typing is
// added afterwards by the caller's tick. If this ever starts with `+=`, the
// doubling is back.
{
    const stats = {
        secondsToday: 999, charsToday: 999, mistakesToday: 999,
        secondsWeek: 999, charsWeek: 999, mistakesWeek: 999,
        lastDate: 'stale', weekStart: 'stale',
    };
    const read = {
        ok: true, weekStart: '2026-08-15',
        today: { seconds: 180, chars: 300, mistakes: 3 },
        week:  { seconds: 1080, chars: 1600, mistakes: 18 },
    };
    applyWeekToStats(stats, read, '2026-08-19');
    eq('D1 day figures are ASSIGNED, pre-existing values discarded',
       [stats.secondsToday, stats.charsToday, stats.mistakesToday], [180, 300, 3]);
    eq('D2 week figures are ASSIGNED, pre-existing values discarded',
       [stats.secondsWeek, stats.charsWeek, stats.mistakesWeek], [1080, 1600, 18]);
    eq('D3 period stamps are refreshed', [stats.lastDate, stats.weekStart],
       ['2026-08-19', '2026-08-15']);
}

// ─── E. The document id contract ─────────────────────────────────────────────
// ⚠️ `uid + '_' + date` IS NOT COSMETIC. firestore.rules binds it
// (`docId == request.auth.uid + '_' + request.resource.data.date`), and
// firestore.indexes.json EXEMPTS `uid` from indexing — so a where('uid','==')
// query is not available and reading by id is the only affordable route. If
// this format ever drifts, the reads silently return nothing and every student
// sees 0:00 with no error anywhere.
{
    const seen = [];
    const deps = {
        db: {},
        doc: (_db, coll, id) => { seen.push(`${coll}/${id}`); return { id }; },
        getDoc: async () => ({ exists: () => false, data: () => null }),
    };
    await readWeek({ ...deps, uid: 'abc123', dateStr: '2026-08-19' });
    eq('E1 exactly seven reads, one per day', seen.length, 7);
    eq('E2 all against typing_logs', seen.every(x => x.startsWith('typing_logs/')), true);
    eq('E3 ids are uid_date, Saturday first', seen[0], 'typing_logs/abc123_2026-08-15');
    eq('E4 ids are uid_date, Friday last', seen[6], 'typing_logs/abc123_2026-08-21');
}

// ─── G. STAGE 2: the projection, and its parity with reports.html ───────────
//
// ⚠️ THE DEDUPE MUST MATCH reports.html EXACTLY. Its `Reconcile vs Sessions`
// compares the graded document against these same sessions using its OWN
// sessionSignature(). If the two ever disagree about what a duplicate is, the
// reconcile tool reports a permanent non-zero delta that no rebuild can close —
// and Jake is back to two numbers, this time with a tool insisting one of them
// is wrong. So the shipped function is lifted out of reports.html and run
// side-by-side against ours on the same inputs.
{
    const rep = readFileSync(new URL('../reports.html', import.meta.url), 'utf8');
    function lift(src, name) {
        const i = src.indexOf('function ' + name + '(');
        if (i < 0) return null;
        let d = 0, j = src.indexOf('{', i);
        for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) break; } }
        return src.slice(i, j + 1);
    }
    const body = lift(rep, 'sessionSignature');
    eq('G1 reports.html still HAS a sessionSignature() to compare against', !!body, true);
    const repSig = body ? new Function(body + '; return sessionSignature;')() : null;

    const cases = [
        ['sprints present', { source: 'library', bookId: 'b1',
                              sprints: [{ at: '2026-08-19T10:00:00Z' }, { at: '2026-08-19T10:05:00Z' }] }, 'doc1'],
        ['sprints empty, timestamp present', { source: 'school', bookId: 'l3',
                              sprints: [], timestamp: { toDate: () => new Date('2026-08-19T11:00:00Z') } }, 'doc2'],
        ['no sprints, no timestamp → falls back to id', { source: '', bookId: '' }, 'doc3'],
        ['sprint entries missing `at` are filtered', { source: 'library', bookId: 'b1',
                              sprints: [{}, { at: '2026-08-19T12:00:00Z' }] }, 'doc4'],
    ];
    for (const [label, data, id] of cases) {
        eq(`G2 signature parity with reports.html — ${label}`,
           sessionSignature(data, id), repSig ? repSig(data, id) : 'NO-LIFT');
    }
}

// Duplicate rollups exist in the database (session-log.js before v1.3.0 could
// write one queued sprint twice). A projection that trusted a raw sum would
// inflate the very day it is computing.
{
    const a = { seconds: 300, chars: 400, mistakes: 5, source: 'library', bookId: 'b1',
                sprints: [{ at: '2026-08-19T10:00:00Z' }] };
    const dup = JSON.parse(JSON.stringify(a));
    const b = { seconds: 120, chars: 200, mistakes: 2, source: 'school', bookId: 'l1',
                sprints: [{ at: '2026-08-19T11:00:00Z' }] };
    const t = sumDaySessions([{ id: 'd1', data: a }, { id: 'd2', data: dup }, { id: 'd3', data: b }]);
    eq('G3 identical rollups are counted ONCE', t.seconds, 420);
    eq('G4 the duplicate is reported, not hidden', t.dupes, 1);
    eq('G5 chars dedupe with them', t.chars, 600);
}

// ⚠️ THE THREE TERMS, AND THE CLAMP. A negative open remainder means this tab's
// bookkeeping disagrees with the queue; subtracting it would remove real
// recorded time from a total a child is graded on. Clamping can only
// under-credit this tab's own unlogged tail, which the next flush recovers.
{
    const srv    = { seconds: 600, chars: 900, mistakes: 10 };
    const queued = { seconds: 45,  chars: 0,   mistakes: 0 };
    const open   = { seconds: 12,  chars: 0,   mistakes: 0 };
    eq('G6 projection is server + queue + open', projectDayTotal(srv, queued, open).seconds, 657);
    eq('G7 a NEGATIVE open is clamped, never subtracted',
       projectDayTotal(srv, queued, { seconds: -500, chars: 0, mistakes: 0 }).seconds, 645);
    eq('G8 an empty day projects to zero, not NaN',
       projectDayTotal({ seconds: 0 }, { seconds: 0 }, { seconds: 0 }).seconds, 0);
    eq('G9 fractional seconds are rounded, not truncated toward a loss',
       projectDayTotal({ seconds: 10.6 }, { seconds: 0 }, { seconds: 0 }).seconds, 11);
}

// ─── F. Version constant ─────────────────────────────────────────────────────
eq('F1 DAYLOG_VERSION is exported and looks like x.y.z',
   /^\d+\.\d+\.\d+$/.test(DAYLOG_VERSION), true);

if (fail) {
    console.log('\n' + bad.join('\n'));
    console.log(`\nFAIL — ${pass} passed, ${fail} failed.`);
    process.exit(1);
}
console.log(`OK — ${pass} assertions passed.`);
