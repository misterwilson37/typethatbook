// queue-owner-test.mjs v1.1.0 — ONE BROWSER, TWO STUDENTS, ONE QUEUE.
//
// v1.1.0 — VERSION PIN / MOCK ONLY. session-log.js is v1.7.0 (Round 46, the
//          writer) — the injected Firestore surface gains `doc`/`setDoc`,
//          required now. No assertion about behaviour changed.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE DEFECT THIS WAS WRITTEN AGAINST — session-log.js v1.4.0 and earlier
// ═══════════════════════════════════════════════════════════════════════════
//
// `session-log.js` stored the whole sprint queue under ONE localStorage key
// holding ONE uid. Every read was correctly uid-scoped — `_read(uid)` returns
// `[]` for a record belonging to somebody else, and `sessionLogClear(uid)`
// refuses to delete a record it does not own. ⚠️ `_write()` HAD NO SUCH GUARD,
// and `_write()` is what both live paths end in:
//
//   sessionLogPush(B, …)  →  _read(B) === []  →  push one  →  _write(B, [one])
//   ...and A's entire unflushed queue is gone. Permanently. Silently.
//
// The flush path was worse in shape though not in reach: `_read(B)` returns
// `[]`, the empty branch calls `_write(B, [])`, which calls
// `localStorage.removeItem()` — and then RETURNS `true`, meaning "everything
// landed", having landed nothing and destroyed three records on the way past.
// All four call sites in game.js and learn.js happen to guard that path with
// `sessionLogPending(uid) > 0`, which reads as 0 for a foreign queue, so it was
// latent rather than live. ⚠️ THAT IS A PROPERTY OF THE CALLERS, NOT OF THE
// MODULE, and the module is the thing four call sites and every future one
// depend on. Part B holds it directly.
//
// ⚠️ WHY THIS MATTERS AT ELLIS. A middle-school Chromebook is not one child's
// machine for the length of a day. Whenever a second account signs in on a
// browser holding an unflushed queue — a cart machine in the next rotation, a
// student borrowing a seat, an expired session picked up by somebody else — the
// first student's sprints are destroyed by the second student's first five
// seconds of typing. `typing_logs` is untouched, so the GRADE is not at risk:
// what is lost is the evidence behind it, which is the drill-down, the ⟳
// button's input, and every measurement ROADMAP items 4, 5 and 6 need.
//
// ⚠️ WHAT THIS HARNESS DOES NOT PROVE. It drives the real module and it proves
// the mechanism exists. It does NOT prove this is the cause of the 2026-08-19
// Library case in ROADMAP item 1 (12m 4s stored against one 3m 47s rollup) —
// that needs Jake's ground truth on whether two accounts touched that machine,
// and the other three known mechanisms are still open. Do not close item 1 on
// the strength of a green run here.
//
// ═══════════════════════════════════════════════════════════════════════════
// PARTS
// ═══════════════════════════════════════════════════════════════════════════
//
//   A — a second account PUSHING must not destroy the first's queue
//   B — a second account FLUSHING must not destroy it either, and must not
//       claim success for a flush that wrote nothing
//   C — the two queues coexist and each account flushes only its own records
//   D — a v1 record written by session-log.js v1.4.0 migrates without loss
//   E — the store is bounded: stale owners are dropped, the cap holds, and the
//       CURRENT uid is never the one evicted
//   F — sessionLogClear() still refuses to clear another account's queue
//   G — the classroom sequence, end to end: A types and never flushes, B uses
//       the machine, A comes back and A's minutes still reach Firestore
//
// ⚠️ MUTATION-VERIFIED. Against session-log.js v1.4.0 this harness reports
// 8 failing across Parts A, B, C and G. If you are reading it green, check that
// `_write()` still refuses to touch an owner it was not handed.

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };
const eq = (msg, got, want) => ok(got === want, `${msg} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// ─── a localStorage that behaves like the real one and never throws ─────────
const store = new Map();
globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); },
};

const KEY = 'ttb_sessionq_v1';
const reset = () => { store.clear(); };

const mod = await import('../session-log.js');

// ─── an injected Firestore surface, same technique as session-merge-test ────
let writes = [];
let denyNext = 0;
mod.sessionLogInit({
    db: {},
    collection: (_db, name) => name,
    doc: (_db, _colName, id) => ({ __ref: true, id }),
    setDoc: async (ref, payload) => {
        if (denyNext > 0) { denyNext--; throw new Error('simulated denial'); }
        writes.push(payload);
    },
    addDoc: async (_col, payload) => {
        if (denyNext > 0) { denyNext--; throw new Error('simulated denial'); }
        writes.push(payload);
        return { id: 'doc' + writes.length };
    },
});

const TODAY = '2026-08-20';
let seq = 0;
function rec(seconds = 60, date = TODAY, source = 'library') {
    seq++;
    return {
        date, at: new Date(Date.parse(date + 'T09:00:00Z') + seq * 60000).toISOString(),
        seconds, chars: seconds * 5, mistakes: 1, wpm: 30, accuracy: 99,
        source, label: 'unit' + seq,
    };
}

console.log(`\nsession-log.js v${mod.SESSION_LOG_VERSION}\n`);

// ─── A. a second account's PUSH must not destroy the first's queue ──────────
console.log('─── A. one browser, two accounts, push ───');
{
    reset();
    mod.sessionLogPush('studentA', rec(70));
    mod.sessionLogPush('studentA', rec(80));
    mod.sessionLogPush('studentA', rec(90));
    eq('A1 A has three records queued', mod.sessionLogPending('studentA'), 3);
    eq('A2 A has 240 unflushed seconds', mod.sessionLogPendingSeconds('studentA', TODAY), 240);

    // B signs in on the same Chromebook and types for ten seconds.
    mod.sessionLogPush('studentB', rec(10));

    eq('A3 ⚠️ A STILL HAS THREE RECORDS after B typed', mod.sessionLogPending('studentA'), 3);
    eq('A4 ⚠️ and still 240 seconds', mod.sessionLogPendingSeconds('studentA', TODAY), 240);
    eq('A5 B has exactly their own one record', mod.sessionLogPending('studentB'), 1);
    eq('A6 and B cannot see A\u2019s seconds', mod.sessionLogPendingSeconds('studentB', TODAY), 10);
}

// ─── B. a second account's FLUSH must not destroy it either ────────────────
console.log('\n─── B. one browser, two accounts, flush ───');
{
    reset();
    writes = [];
    mod.sessionLogPush('studentA', rec(70));
    mod.sessionLogPush('studentA', rec(80));

    // ⚠️ CALLED WITHOUT THE `sessionLogPending() > 0` GUARD ON PURPOSE. Every
    // call site in game.js and learn.js has it today, so this path is latent —
    // but the guarantee belongs to the module, not to four callers who each
    // remembered. A fifth caller is one round away.
    const result = await mod.sessionLogFlush('studentB', {});

    eq('B1 ⚠️ A\u2019s queue survives B\u2019s flush', mod.sessionLogPending('studentA'), 2);
    eq('B2 nothing was written for B', writes.length, 0);
    eq('B3 an empty flush still reports success', result, true);
}

// ─── C. the two queues coexist and each flushes only its own ───────────────
console.log('\n─── C. two queues, two flushes ───');
{
    reset();
    writes = [];
    mod.sessionLogPush('studentA', rec(70, TODAY, 'library'));
    mod.sessionLogPush('studentA', rec(80, TODAY, 'library'));
    mod.sessionLogPush('studentB', rec(30, TODAY, 'school'));

    await mod.sessionLogFlush('studentB', { email: 'b@example.org' });
    eq('C1 B\u2019s flush wrote one document', writes.length, 1);
    eq('C2 it carries B\u2019s uid', writes[0].uid, 'studentB');
    eq('C3 and B\u2019s 30 seconds only', writes[0].seconds, 30);
    eq('C4 ⚠️ A\u2019s queue is untouched by it', mod.sessionLogPending('studentA'), 2);
    eq('C5 B\u2019s queue is now empty', mod.sessionLogPending('studentB'), 0);

    await mod.sessionLogFlush('studentA', { email: 'a@example.org' });
    const aDocs = writes.filter(w => w.uid === 'studentA');
    eq('C6 A\u2019s flush wrote A\u2019s records', aDocs.length, 2);
    eq('C7 for 150 seconds in total', aDocs.reduce((s, d) => s + d.seconds, 0), 150);
    eq('C8 both queues are empty and the key is gone', localStorage.getItem(KEY), null);
}

// ─── D. a v1 record migrates without loss ──────────────────────────────────
console.log('\n─── D. the v1.4.0 record migrates ───');
{
    reset();
    // Exactly the shape session-log.js v1.4.0 wrote. A student mid-upgrade has
    // one of these sitting in localStorage, and throwing it away would be a
    // data loss caused by the fix for a data loss.
    localStorage.setItem(KEY, JSON.stringify({
        v: 1, uid: 'studentA', savedAt: Date.now(),
        records: [
            { date: TODAY, at: TODAY + 'T09:00:00.000Z', seconds: 45, chars: 200,
              mistakes: 3, wpm: 28, accuracy: 98, source: 'library', label: 'legacy' },
            { date: TODAY, at: TODAY + 'T09:05:00.000Z', seconds: 55, chars: 260,
              mistakes: 1, wpm: 31, accuracy: 99, source: 'library', label: 'legacy' },
        ],
    }));

    eq('D1 the legacy queue is readable', mod.sessionLogPending('studentA'), 2);
    eq('D2 with its seconds intact', mod.sessionLogPendingSeconds('studentA', TODAY), 100);
    eq('D3 and it is still invisible to another account', mod.sessionLogPending('studentB'), 0);

    // B typing is what used to destroy it.
    mod.sessionLogPush('studentB', rec(20));
    eq('D4 ⚠️ the migrated queue survives a foreign push', mod.sessionLogPending('studentA'), 2);

    writes = [];
    await mod.sessionLogFlush('studentA', {});
    eq('D5 and it still uploads', writes.length, 1);
    // ⚠️ DEFENSIVE ON PURPOSE. A harness that THROWS on the build it was written
    // against reports one stack trace instead of eight named failures, and the
    // named failures are the whole value of running it red first.
    eq('D6 with both legacy records in it',
       (writes[0] && writes[0].sprints || []).length, 2);
}

// ─── E. the store stays bounded ────────────────────────────────────────────
console.log('\n─── E. bounded, and the current student is never evicted ───');
{
    reset();
    // A queue of records older than STALE_DAYS (21) is not going to start
    // flushing now, and an owner with nothing left is not an owner.
    const old = new Date(Date.now() - 40 * 86400000).toISOString();
    localStorage.setItem(KEY, JSON.stringify({
        v: 1, uid: 'ghost', savedAt: Date.now() - 40 * 86400000,
        records: [{ date: old.slice(0, 10), at: old, seconds: 60, chars: 300,
                    mistakes: 0, wpm: 30, accuracy: 100, source: 'library', label: 'x' }],
    }));
    mod.sessionLogPush('studentA', rec(60));
    eq('E1 the stale owner is pruned away', mod.sessionLogPending('ghost'), 0);
    eq('E2 the live one is kept', mod.sessionLogPending('studentA'), 1);

    // A cart machine sees many accounts. The store must not grow forever.
    reset();
    const CAP = mod.MAX_QUEUE_OWNERS;
    ok(typeof CAP === 'number' && CAP >= 2,
       `E3a session-log.js exports MAX_QUEUE_OWNERS (got ${JSON.stringify(CAP)})`);
    const cap = (typeof CAP === 'number' && CAP >= 2) ? CAP : 8;
    for (let i = 0; i < cap + 4; i++) {
        mod.sessionLogPush('student' + i, rec(30));
    }
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const owners = Object.keys(raw.owners || {});
    ok(owners.length > 0 && owners.length <= cap,
       `E3 at most ${cap} owners are kept (got ${owners.length})`);
    // ⚠️ THE ONE EVICTION THAT WOULD BE A BUG IS EVICTING THE STUDENT WHO IS
    // TYPING. Whoever pushed last must always be in the store afterwards.
    const last = 'student' + (cap + 3);
    eq('E4 ⚠️ the account that just pushed is still there',
       mod.sessionLogPending(last), 1);
    // Oldest out first.
    eq('E5 the earliest account was the one dropped', mod.sessionLogPending('student0'), 0);
}

// ─── F. clear still refuses to touch somebody else's queue ─────────────────
console.log('\n─── F. sessionLogClear ownership ───');
{
    reset();
    mod.sessionLogPush('studentA', rec(60));
    mod.sessionLogPush('studentB', rec(60));

    mod.sessionLogClear('studentB');
    eq('F1 B\u2019s queue is cleared', mod.sessionLogPending('studentB'), 0);
    eq('F2 ⚠️ A\u2019s is not', mod.sessionLogPending('studentA'), 1);

    mod.sessionLogClear('studentA');
    eq('F3 clearing the last owner removes the key', localStorage.getItem(KEY), null);
}

// ─── G. the classroom sequence, end to end ─────────────────────────────────
console.log('\n─── G. second period, third period, and back ───');
{
    reset();
    writes = [];

    // Second period: A types eight minutes in the library and the lid closes
    // before a final flush. Four sprints, none of them uploaded.
    for (const s of [125, 140, 110, 105]) mod.sessionLogPush('studentA', rec(s));
    eq('G1 480 seconds are sitting in the queue',
       mod.sessionLogPendingSeconds('studentA', TODAY), 480);

    // Third period: B has the same machine. They type, they hide the tab,
    // their page flushes.
    mod.sessionLogPush('studentB', rec(200, TODAY, 'school'));
    await mod.sessionLogFlush('studentB', {});
    eq('G2 B\u2019s work is uploaded', writes.filter(w => w.uid === 'studentB').length, 1);

    // Fourth period: A is back at the same machine.
    eq('G3 ⚠️ A\u2019s eight minutes are still there',
       mod.sessionLogPendingSeconds('studentA', TODAY), 480);
    await mod.sessionLogFlush('studentA', {});
    const aSecs = writes.filter(w => w.uid === 'studentA').reduce((s, d) => s + d.seconds, 0);
    eq('G4 ⚠️ and they reach Firestore', aSecs, 480);

    // ⚠️ AND A FAILED UPLOAD STILL KEEPS ITS RECORDS. The retry path must not
    // have been traded away for the ownership guard.
    denyNext = 1;
    mod.sessionLogPush('studentA', rec(60));
    const okFlush = await mod.sessionLogFlush('studentA', {});
    eq('G5 a denied write reports failure', okFlush, false);
    eq('G6 and the record is kept for the retry', mod.sessionLogPending('studentA'), 1);
    denyNext = 0;
    await mod.sessionLogFlush('studentA', {});
    eq('G7 the retry lands it', mod.sessionLogPending('studentA'), 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
