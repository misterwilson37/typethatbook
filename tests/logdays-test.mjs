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

const { ledgerFrom, planReads, noteDay, reconcilePlan, reconcile,
        LOGDAYS_FIELD, LOGDAYS_SINCE } =
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
    // ⚠️ KEY BUMPED _v1 → _v2 BY ROUND 58 (ROADMAP 50). This harness names the
// storage key literally rather than importing it, which is deliberate — a
// rename is a REAL migration for every student's browser and should have to be
// made in two places on purpose. If you are here because this went red after a
// bump, that is the check working.
store.set('ttb_logDays_v2', JSON.stringify({
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
    store.set('ttb_logDays_v2', JSON.stringify({
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
    store.set('ttb_logDays_v2', JSON.stringify({
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

// ─── E. THE WRITE ORDER AND WHAT HAPPENS WHEN IT BREAKS ─────────────────────────────────

await check('E1. noteDay records locally even when the server write fails', () => {
    store.clear();
    const io = {
        db: {}, doc: () => ({}), arrayUnion: v => v,
        updateDoc: async () => { throw new Error('permission-denied'); },
        setDoc: async () => { throw new Error('permission-denied'); },
    };
    return noteDay({ ...io, uid: 'E1-student', date: '2026-08-24' }).then(ok => {
        assert.equal(ok, false, 'a total failure must report false');
        const local = JSON.parse(store.get('ttb_logDays_v2'));
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

// ─── E2. ensureSince() — THE STUDENT WHO SIGNS IN AND DOES NOTHING ───────────

const { ensureSince } = await import('../logdays.js');

await check('E4. seeds since when the user document has none', async () => {
    store.clear();
    let wrote = null, merged = false;
    const io = { db: {}, doc: () => ({}),
                 setDoc: async (_r, d, o) => { wrote = d; merged = !!(o && o.merge); } };
    const ok = await ensureSince({ ...io, uid: 'n1', date: '2026-08-24', userData: {} });
    assert.equal(ok, true);
    assert.equal(wrote[LOGDAYS_SINCE], '2026-08-24');
    assert.ok(merged, 'must MERGE, never overwrite a user document');
});

await check('E5. does nothing when since already exists', async () => {
    // ⚠️ ONE WRITE PER STUDENT, EVER. If this fired on every page load it would
    // be 167 writes a day for a field that never changes.
    store.clear();
    let writes = 0;
    const io = { db: {}, doc: () => ({}), setDoc: async () => { writes++; } };
    const ok = await ensureSince({ ...io, uid: 'n2', date: '2026-08-24',
                                   userData: { [LOGDAYS_SINCE]: '2026-08-01' } });
    assert.equal(ok, false);
    assert.equal(writes, 0);
});

await check('E6. refuses to write without the user document', async () => {
    // ⚠️ THE GUARD THAT MATTERS. Writing `since` blind could replace an EARLIER
    // value with a later one, which silently reclassifies days we DO know about
    // into "skip" — the one direction this module must never move.
    store.clear();
    let writes = 0;
    const io = { db: {}, doc: () => ({}), setDoc: async () => { writes++; } };
    assert.equal(await ensureSince({ ...io, uid: 'n3', date: '2026-08-24' }), false);
    assert.equal(await ensureSince({ ...io, uid: 'n3', date: '2026-08-24', userData: null }), false);
    assert.equal(writes, 0, 'no user document means no write, ever');
});

await check('E7. a seeded student with no typing days is SKIPPABLE, not blind', async () => {
    // ⚠️ THE WHOLE POINT. Before this, a student who never typed had no ledger,
    // ledgerFrom() returned null, and every day of every range was swept for
    // them forever. A `since` with an empty day list is the meaningful claim
    // "watched since X, typed on nothing after it".
    store.clear();
    const led = ledgerFrom({ [LOGDAYS_SINCE]: '2026-08-17' }, 'n4');
    assert.ok(led, 'a since with no days must still be a usable ledger');
    const p = planReads(led, DATES);
    assert.equal(p.blind, false);
    assert.deepEqual(p.fetch, [], 'nothing to read for a student with no typing days');
    assert.equal(p.skip.length, DATES.length);
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

// ─── G. readWeek() INTEGRATION — THE PART THAT CAN SHOW A WRONG NUMBER ───────
//
// ⚠️ ROADMAP ITEM 18 LIVES OR DIES HERE. Sections A–F prove the planner never
// skips a truthful day. These prove daylog.js CONSUMES the plan correctly: that
// a skipped day folds in as zero rather than as a failure, that `ok` survives,
// and above all that the WEEK TOTAL is identical to what the unpruned reader
// would have produced. If the totals differ by a single second, a child's HUD
// is wrong and the feature must not ship.

const { readWeek: _readWeekMemoised, invalidateWeek, clearDayCache } = await import('../daylog.js');

// ⚠⚠ EVERY CALL IN SECTION G IS A COLD READ, ON PURPOSE (daylog.js v1.6.0).
// readWeek() is memoised per page load and that memo is MODULE state, shared by
// every call in this file. Section G reuses one UID across several fake
// databases — that is the point of the section — so without this wrapper G3
// was handed G2's week and reported a total from the wrong fixture, and G5's
// throwing read was never issued at all.
//
// ⚠ THE MEMO IS NOT STUBBED OUT. This section tests the LEDGER's effect on
// which days get fetched; dropping the memo first is how it gets a clean
// reader without pretending the memo is absent. weekly-memo-test.mjs is where
// the memo itself is tested, and that one deliberately does not invalidate.
const readWeek = (args) => {
    const uid = args && args.uid;
    // ⚠⚠ BOTH LAYERS ARE DROPPED (daylog.js v1.7.0). invalidateWeek() clears the
    // per-load MEMO; clearDayCache() clears the localStorage CLOSED-DAY CACHE.
    // The second was added when ROADMAP 28 landed and Section G started
    // counting one read where it expected two — a day banked by an earlier part
    // was being served to a later one. Neither layer is stubbed out: these
    // sections test the READER, and dropping the caches first is how they get a
    // cold reader without pretending the caches are absent.
    // closed-day-cache-test.mjs and weekly-memo-test.mjs are where the caches
    // themselves are tested, and those deliberately do NOT drop them.
    invalidateWeek(uid); clearDayCache(uid);
    return _readWeekMemoised(args);
};

// A fake Firestore holding exactly two days of typing.
function fakeDb(present) {
    let reads = 0;
    return {
        reads: () => reads,
        io: {
            db: {},
            doc: (_db, _col, id) => ({ id }),
            getDoc: async (ref) => {
                reads++;
                const data = present[ref.id];
                return { exists: () => !!data, data: () => data };
            },
        },
    };
}

const UID = 'g-student';
const TODAY = '2026-08-21';
const PRESENT = {
    [`${UID}_2026-08-18`]: { seconds: 300, chars: 900, mistakes: 4, date: '2026-08-18' },
    [`${UID}_2026-08-21`]: { seconds: 120, chars: 400, mistakes: 1, date: '2026-08-21' },
};

await check('G1. an unpruned read is the baseline: 7 reads, ok, correct total', async () => {
    store.clear();
    const f = fakeDb(PRESENT);
    const r = await readWeek({ ...f.io, uid: UID, dateStr: TODAY, ledger: null });
    assert.equal(f.reads(), 7, 'no ledger must read all seven, exactly as before');
    assert.equal(r.ok, true);
    assert.equal(r.week.seconds, 420);
    assert.equal(r.week.chars, 1300);
});

await check('G2. a pruned read returns the IDENTICAL week total on fewer reads', async () => {
    store.clear();
    const base = await readWeek({ ...fakeDb(PRESENT).io, uid: UID, dateStr: TODAY, ledger: null });

    const f = fakeDb(PRESENT);
    const ledger = ledgerFrom({
        [LOGDAYS_FIELD]: ['2026-08-18', '2026-08-21'],
        [LOGDAYS_SINCE]: '2026-08-15',
    }, UID);
    const r = await readWeek({ ...f.io, uid: UID, dateStr: TODAY, ledger });

    // ⚠️ THE ASSERTION THE WHOLE ITEM RESTS ON.
    assert.deepEqual(r.week, base.week, 'pruning must not change a single number');
    assert.deepEqual(r.today, base.today);
    assert.equal(r.ok, true, 'skipped days are KNOWN empty, not failures');
    assert.ok(f.reads() < 7, 'it has to actually save something');
    assert.equal(f.reads(), 2, 'exactly the two days that hold data');
});

await check('G3. ok stays true when every non-today day is skipped', async () => {
    // ⚠️ THE ORDINARY MONDAY. A student who has typed only today would, if a
    // skip were treated as a failed read, get ok:false and a suppressed HUD on
    // the most common day of the week there is.
    store.clear();
    const only = { [`${UID}_${TODAY}`]: { seconds: 60, chars: 200, mistakes: 0, date: TODAY } };
    const f = fakeDb(only);
    const ledger = ledgerFrom({
        [LOGDAYS_FIELD]: [TODAY], [LOGDAYS_SINCE]: '2026-08-15',
    }, UID);
    const r = await readWeek({ ...f.io, uid: UID, dateStr: TODAY, ledger });
    assert.equal(r.ok, true);
    assert.equal(r.week.seconds, 60);
    assert.equal(f.reads(), 1, 'today only');
});

await check('G4. today is fetched even when the ledger has never heard of it', async () => {
    // The first sprint of the day: the log does not exist yet and the ledger
    // cannot know it is about to. daylog.js needs today's RAW document anyway.
    store.clear();
    const f = fakeDb({});
    const ledger = ledgerFrom({
        [LOGDAYS_FIELD]: ['2026-08-18'], [LOGDAYS_SINCE]: '2026-08-15',
    }, UID);
    const r = await readWeek({ ...f.io, uid: UID, dateStr: TODAY, ledger });
    assert.equal(r.ok, true);
    assert.equal(f.reads(), 2, 'the ledger day plus today, unconditionally');
});

await check('G5. a genuine read that throws still sets ok:false', async () => {
    // ⚠️ THE CONTRACT MUST NOT HAVE BEEN WEAKENED. Pruning teaches readWeek to
    // treat some absent days as fine; it must not have taught it to treat a
    // THROWN read as fine. A partial week that looks complete is the original sin.
    store.clear();
    let n = 0;
    const io = {
        db: {}, doc: (_d, _c, id) => ({ id }),
        getDoc: async (ref) => {
            if (++n === 1) throw new Error('permission-denied');
            const data = PRESENT[ref.id];
            return { exists: () => !!data, data: () => data };
        },
    };
    const ledger = ledgerFrom({
        [LOGDAYS_FIELD]: ['2026-08-18', '2026-08-21'], [LOGDAYS_SINCE]: '2026-08-15',
    }, UID);
    const r = await readWeek({ ...io, uid: UID, dateStr: TODAY, ledger });
    assert.equal(r.ok, false, 'a thrown read is still a failure, pruning or not');
});

// ─── report ──────────────────────────────────────────────────────────────────
await new Promise(r => setTimeout(r, 50));
// H. ⚠️⚠️ THE RECONCILER — ROADMAP 50. THE MIRROR MAY NOT KNOW LESS THAN THE
//    SERVER, AND THE REPAIR MAY ONLY EVER MOVE IN THE SAFE DIRECTION.
// ═══════════════════════════════════════════════════════════════════════════

await check('H1. a day the server vouches for and the mirror lacks is ADDED and reported', () => {
    const local  = { days: ['2026-09-02'], since: '2026-08-31' };
    const server = { [LOGDAYS_FIELD]: ['2026-08-31', '2026-09-01', '2026-09-02'],
                     [LOGDAYS_SINCE]: '2026-08-31' };
    const p = reconcilePlan(local, server);
    assert.deepEqual(p.added, ['2026-08-31', '2026-09-01']);
    assert.deepEqual(p.days, ['2026-08-31', '2026-09-01', '2026-09-02']);
    // ⚠️ THIS IS ROADMAP 50's SYMPTOM EXACTLY: without the merge those two days
    // are "known absent", planReads() skips them, and a 26-minute week reads as
    // today's 6 minutes.
    const plan = planReads({ since: local.since, days: new Set(local.days) },
                           ['2026-08-31', '2026-09-01', '2026-09-02'],
                           { always: ['2026-09-02'] });
    assert.deepEqual(plan.skip, ['2026-08-31', '2026-09-01']);
});

await check('H2. ⚠️ a day BEFORE the mirror\'s since is not a fault and is not reported', () => {
    // The student typed on a loaner laptop before this machine started watching.
    // planReads() already reads those blind. Calling it a fault would make every
    // student who ever used a second machine look broken.
    const local  = { days: ['2026-09-02'], since: '2026-09-02' };
    const server = { [LOGDAYS_FIELD]: ['2026-08-31', '2026-09-02'],
                     [LOGDAYS_SINCE]: '2026-08-31' };
    const p = reconcilePlan(local, server);
    assert.deepEqual(p.added, []);
});

await check('H3. ⚠️⚠️ since ONLY EVER MOVES BACKWARD, never forward', () => {
    const earlier = reconcilePlan({ days: [], since: '2026-09-02' },
                                  { [LOGDAYS_SINCE]: '2026-08-25' });
    assert.equal(earlier.since, '2026-08-25');
    assert.equal(earlier.moved, true);
    // ⚠️ A LATER SERVER `since` MUST BE IGNORED. Moving it forward would
    // reclassify days this machine DOES know about into "skip" — the one
    // direction this module must never move, and the shape of ROADMAP 50.
    const later = reconcilePlan({ days: [], since: '2026-08-25' },
                                { [LOGDAYS_SINCE]: '2026-09-02' });
    assert.equal(later.since, '2026-08-25');
    assert.equal(later.moved, false);
});

await check('H4. ⚠️ no local mirror is not a fault — it is left alone', () => {
    // ledgerFrom() returns null for it and the reader goes blind, which is
    // correct. Seeding a mirror here would be a behaviour change smuggled in
    // beside a repair.
    const p = reconcilePlan(null, { [LOGDAYS_FIELD]: ['2026-09-01'] });
    assert.equal(p.days, null);
    assert.deepEqual(p.added, []);
});

await check('H5. junk from the server cannot corrupt the mirror', () => {
    const local = { days: ['2026-09-02'], since: '2026-09-01' };
    for (const bad of [null, undefined, {}, { [LOGDAYS_FIELD]: 'nope' },
                       { [LOGDAYS_FIELD]: [1, null, {}] }, { [LOGDAYS_SINCE]: 7 }]) {
        const p = reconcilePlan(local, bad);
        assert.deepEqual(p.days, ['2026-09-02']);
        assert.deepEqual(p.added, []);
        assert.equal(p.since, '2026-09-01');
    }
});

await check('H6. reconcile() writes the healed mirror through to storage', () => {
    store.clear();
    store.set('ttb_logDays_v2', JSON.stringify({
        uid: 'u1', days: ['2026-09-02'], since: '2026-08-31' }));
    const added = reconcile('u1', {
        [LOGDAYS_FIELD]: ['2026-08-31', '2026-09-01', '2026-09-02'],
        [LOGDAYS_SINCE]: '2026-08-31' });
    assert.deepEqual(added, ['2026-08-31', '2026-09-01']);
    const after = JSON.parse(store.get('ttb_logDays_v2'));
    assert.deepEqual(after.days, ['2026-08-31', '2026-09-01', '2026-09-02']);
    // ⚠️ AND THE SKIP IS GONE — the assertion that matters, stated as the reader
    // sees it rather than as the mirror's contents.
    const plan = planReads({ since: after.since, days: new Set(after.days) },
                           ['2026-08-31', '2026-09-01', '2026-09-02'],
                           { always: ['2026-09-02'] });
    assert.deepEqual(plan.skip, []);
});

let failed = 0;
for (const [state, name] of results) {
    console.log(`  ${state === 'ok' ? 'ok  ' : 'FAIL'} ${name}`);
    if (state !== 'ok') failed++;
}
// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
