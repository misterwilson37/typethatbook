// logdays-test.mjs — ⚠️ THE LEDGER MAY OVER-READ AND MUST NEVER UNDER-READ.
//
// logdays.js exists to let a reader SKIP document ids it would otherwise fetch
// blind. Every defect in it therefore has one of two costs, and they are not
// symmetrical:
//
//   over-reading   a wasted read. Exactly what the code did before it existed.
//   under-reading  a day of a child's typing vanishes from their week total.
//
// So this file spends almost all of its assertions on the second. The rule the
// whole module rests on — a ledger is a SUPERSET of the logs, never a subset —
// is enforced here in the only place it can be: at the read planner, by proving
// that every category of "I do not know" resolves to a fetch.

import { strict as assert } from 'node:assert';

// ── localStorage stub, installed before the module loads ─────────────────────
const store = new Map();
globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
    clear: () => store.clear(),
};

const { ledgerFrom, planReads, noteDay, LOGDAYS_FIELD, LOGDAYS_SINCE } =
    await import('../logdays.js');

const results = [];
// ⚠️ AWAITS. The first draft of this helper did not, and the async cases below
// raced each other through noteDay()'s once-per-load guard: test E1 stamped the
// (uid, date) key, E2 hit the guard and returned early without writing, and E2's
// assertion failed for a reason that had nothing to do with the code it tested.
// A harness whose cases can interfere with each other reports on itself.
async function check(name, fn) {
    try { await fn(); results.push(['ok', name]); }
    catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
}

const DATES = ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21'];

// ─── A. NO LEDGER MEANS READ EVERYTHING ──────────────────────────────────────

await check('A1. a null ledger fetches every date and reports blind', () => {
    const p = planReads(null, DATES);
    assert.deepEqual(p.fetch, DATES);
    assert.deepEqual(p.skip, []);
    assert.equal(p.blind, true);
});

await check('A2. a user document with no ledger fields yields null, not an empty ledger', () => {
    // ⚠️ THE CENTRAL DISTINCTION. An empty ledger reads as "typed on no days"
    // and would skip everything. null reads as "I know nothing" and skips
    // nothing. Returning the wrong one here empties every report at once.
    store.clear();
    assert.equal(ledgerFrom({ displayName: 'A Student' }, 'u1'), null);
    assert.equal(ledgerFrom({}, 'u1'), null);
    assert.equal(ledgerFrom(null, 'u1'), null);
    assert.equal(ledgerFrom(undefined, undefined), null);
});

await check('A3. a malformed ledger field is treated as no ledger', () => {
    store.clear();
    assert.equal(ledgerFrom({ [LOGDAYS_FIELD]: 'not-an-array' }, 'u1'), null);
    assert.equal(ledgerFrom({ [LOGDAYS_FIELD]: [1, 2, 3] }, 'u1'), null,
        'numeric entries with no since must not produce a usable ledger');
});

// ─── B. DATES BEFORE `since` ARE ALWAYS READ ─────────────────────────────────

await check('B1. everything earlier than since is fetched even though the ledger omits it', () => {
    store.clear();
    const led = ledgerFrom({
        [LOGDAYS_FIELD]: ['2026-08-20'],
        [LOGDAYS_SINCE]: '2026-08-20',
    }, 'u1');
    const p = planReads(led, DATES);
    // 17, 18, 19 predate the ledger — unknowable, so they must be read.
    assert.deepEqual(p.fetch, ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20']);
    assert.deepEqual(p.skip, ['2026-08-21']);
});

await check('B2. a range entirely before since is swept in full', () => {
    store.clear();
    const led = ledgerFrom({
        [LOGDAYS_FIELD]: ['2026-09-01'], [LOGDAYS_SINCE]: '2026-09-01',
    }, 'u1');
    const p = planReads(led, DATES);
    assert.deepEqual(p.fetch, DATES, 'a pre-ledger range must degrade to the old sweep');
    assert.equal(p.skip.length, 0);
});

await check('B3. the earlier since wins when the server and the local mirror disagree', () => {
    // ⚠️ EARLIER IS THE CONSERVATIVE DIRECTION: it moves dates OUT of "known
    // absent" and INTO "read blind". Taking the later one would skip days the
    // ledger never actually vouched for.
    store.clear();
    store.set('ttb_logDays_v1', JSON.stringify({
        uid: 'u1', days: ['2026-08-18'], since: '2026-08-18',
    }));
    const led = ledgerFrom({
        [LOGDAYS_FIELD]: ['2026-08-20'], [LOGDAYS_SINCE]: '2026-08-20',
    }, 'u1');
    assert.equal(led.since, '2026-08-18');
    const p = planReads(led, DATES);
    assert.ok(p.fetch.includes('2026-08-17'), 'before the earlier since — must read');
    assert.ok(p.fetch.includes('2026-08-18'), 'in the local ledger — must read');
    assert.ok(p.skip.includes('2026-08-19'), 'after since, in neither ledger — skippable');
});

// ─── C. THE TWO COPIES UNION, THEY DO NOT OVERRIDE ───────────────────────────

await check('C1. a day known only to the server survives', () => {
    store.clear();
    store.set('ttb_logDays_v1', JSON.stringify({
        uid: 'u1', days: ['2026-08-18'], since: '2026-08-17',
    }));
    const led = ledgerFrom({
        [LOGDAYS_FIELD]: ['2026-08-21'], [LOGDAYS_SINCE]: '2026-08-17',
    }, 'u1');
    // ⚠️ THE LOANER-LAPTOP CASE. A day typed on another machine is on the server
    // ledger and absent from this machine's mirror. Preferring the local copy
    // would drop it.
    assert.ok(led.days.has('2026-08-21'));
    assert.ok(led.days.has('2026-08-18'));
});

await check('C2. the local mirror is ignored when it belongs to another student', () => {
    store.clear();
    store.set('ttb_logDays_v1', JSON.stringify({
        uid: 'SOMEONE-ELSE', days: ['2026-08-19'], since: '2026-08-17',
    }));
    const led = ledgerFrom({
        [LOGDAYS_FIELD]: ['2026-08-21'], [LOGDAYS_SINCE]: '2026-08-17',
    }, 'u1');
    assert.ok(!led.days.has('2026-08-19'),
        'one student must never inherit another student\'s ledger from shared hardware');
});

// ─── D. `always` OVERRIDES EVERY SKIP ────────────────────────────────────────

await check('D1. a date in always is fetched even when the ledger says it is empty', () => {
    // ⚠️ TODAY IS ALWAYS READ. daylog.js keeps today's RAW document for the
    // per-source seed, and a student may be about to type for the first time
    // this session — the ledger cannot know that yet.
    store.clear();
    const led = ledgerFrom({
        [LOGDAYS_FIELD]: ['2026-08-17'], [LOGDAYS_SINCE]: '2026-08-17',
    }, 'u1');
    const p = planReads(led, DATES, { always: ['2026-08-21'] });
    assert.ok(p.fetch.includes('2026-08-21'));
    assert.ok(!p.skip.includes('2026-08-21'));
});

// ─── E. THE WRITE ORDER AND ITS FAILURE MODE ─────────────────────────────────

await check('E1. noteDay records locally even when the server write fails', () => {
    store.clear();
    const io = {
        db: {}, doc: () => ({}), arrayUnion: v => v,
        updateDoc: async () => { throw new Error('permission-denied'); },
        setDoc: async () => { throw new Error('permission-denied'); },
    };
    return noteDay({ ...io, uid: 'E1-student', date: '2026-08-24' }).then(ok => {
        assert.equal(ok, false, 'a total failure must report false');
        const local = JSON.parse(store.get('ttb_logDays_v1'));
        assert.ok(local.days.includes('2026-08-24'),
            'the local mirror must still record the day — it is what stops the ' +
            'next reader skipping a date this student really typed on');
    });
});

await check('E2. noteDay falls back to a merge-create when the user doc does not exist', () => {
    store.clear();
    let merged = false;
    const io = {
        db: {}, doc: () => ({}), arrayUnion: v => v,
        updateDoc: async () => { throw new Error('No document to update'); },
        setDoc: async (_r, _d, opts) => { merged = !!(opts && opts.merge); },
    };
    return noteDay({ ...io, uid: 'E2-student', date: '2026-08-24' }).then(ok => {
        assert.equal(ok, true);
        assert.ok(merged, 'the fallback must MERGE, never overwrite a user document');
    });
});

await check('E3. a repeat call in the same page load does not write again', () => {
    store.clear();
    let writes = 0;
    const io = {
        db: {}, doc: () => ({}), arrayUnion: v => v,
        updateDoc: async () => { writes++; }, setDoc: async () => { writes++; },
    };
    return noteDay({ ...io, uid: 'u2', date: '2026-08-24' })
        .then(() => noteDay({ ...io, uid: 'u2', date: '2026-08-24' }))
        .then(() => noteDay({ ...io, uid: 'u2', date: '2026-08-24' }))
        .then(() => {
            assert.equal(writes, 1,
                'the flush path runs many times a session; the ledger needs one write per day');
        });
});

// ─── F. THE PROPERTY THAT MATTERS, ON RANDOM INPUT ───────────────────────────

await check('F1. no date holding a real log is ever skipped, over 2000 random ledgers', () => {
    // ⚠️ THE WHOLE MODULE IN ONE ASSERTION. Build a random truth (which days the
    // student really typed), derive a ledger that is a correct superset of it,
    // and prove the planner never skips a truthful day. If this can be made to
    // fail, a child's week total can be made to read short.
    let seed = 20260824;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

    for (let iter = 0; iter < 2000; iter++) {
        const all = [];
        for (let d = 1; d <= 28; d++) all.push('2026-08-' + String(d).padStart(2, '0'));

        const truth = new Set(all.filter(() => rnd() < 0.25));
        const since = all[Math.floor(rnd() * all.length)];

        // A correct ledger: every truthful day on or after `since`, plus any
        // number of spurious extras (which are allowed — they cost a read).
        const ledgerDays = [...truth].filter(d => d >= since);
        for (const d of all) if (rnd() < 0.1) ledgerDays.push(d);

        const led = ledgerFrom({
            [LOGDAYS_FIELD]: ledgerDays.length ? ledgerDays : ['1970-01-01'],
            [LOGDAYS_SINCE]: since,
        }, 'uX');

        const p = planReads(led, all);
        for (const d of p.skip) {
            assert.ok(!truth.has(d),
                `iter ${iter}: skipped ${d} but the student typed that day ` +
                `(since=${since})`);
        }
    }
});

// ─── report ──────────────────────────────────────────────────────────────────
await new Promise(r => setTimeout(r, 50));
let failed = 0;
for (const [state, name] of results) {
    console.log(`  ${state === 'ok' ? 'ok  ' : 'FAIL'} ${name}`);
    if (state !== 'ok') failed++;
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
