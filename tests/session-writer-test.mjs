// session-writer-test.mjs v1.0.0 — THE WRITER, NOT THE READER.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE DEFECT THIS WAS WRITTEN AGAINST — session-log.js v1.6.0 and earlier
// ═══════════════════════════════════════════════════════════════════════════
//
// `_sessionLogFlushInner()` writes a rollup with `addDoc()`, which mints a
// RANDOM id, and only removes the chunk from the local queue AFTER that
// write resolves. The flush runs on `pagehide`/`visibilitychange` — exactly
// when a browser may kill the page. Die between the write and the local
// removal (or have the removal itself fail — `_write()` returns `false` on a
// full localStorage and both call sites discard it) and the chunk is still
// queued. The next load resends it, `addDoc()` mints a SECOND random id, and
// the resend becomes a new, larger document instead of replacing the old one.
// Measured 2026-08-25: 12 of 51 student-days, 8 of 10 students. See ROADMAP
// item 24 and HANDOFF §0.-34.C for the full trace.
//
// ⚠️ THE FIX IS IDEMPOTENCE, NOT A MORE RELIABLE REMOVAL. The document id is
// now DERIVED from the chunk (`uid` + the first sprint's `at` + `source` +
// `label`) and written with `setDoc()`, so a resend lands on the SAME
// document and overwrites it. A superset replacing a subset is the correct
// result — no duplicate, no loss — and it resolves BOTH paths to the bug at
// once: a killed page and a failed local write behave identically, because
// neither one changes what the next flush derives as the id.
//
// ⚠️ THIS HARNESS DOES NOT COVER THE RULES CHANGE. `typing_sessions` update
// was `isSuper()`-only; a real resend would be DENIED by the deployed rules
// and retry forever no matter what this file proves. That needs the emulator
// — see tests/rules-probe.test.mjs / firestore-rules.test.mjs. A green run
// here is not permission to skip `npm run test:rules` before deploying.
//
// ═══════════════════════════════════════════════════════════════════════════
// PARTS
// ═══════════════════════════════════════════════════════════════════════════
//
//   A — a clean flush writes with setDoc(), never addDoc(), at a derived id
//   B — a resend of the SAME chunk (queue not cleared) overwrites — one
//       document, not two, and it carries the superset's contents
//   C — a resend that also picked up a LATER sprint in the same group still
//       derives the same id (keyed on the first sprint, not the chunk shape)
//   D — a failed local removal (`_write()` returns false — the "second,
//       rarer path") behaves identically: the next flush overwrites, it does
//       not duplicate
//   E — two independent groups (different day/source/label) never collide on
//       one id
//   F — an ordinary two-groups-in-one-flush still writes two documents
//
// ⚠️ MUTATION-VERIFIED. Against session-log.js v1.6.0 this harness reports
// failures in Parts A, B, C and D — the write call is `addDoc`, not `setDoc`,
// so there is no derived id to compare and every resend is a fresh document.

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };
const eq = (msg, got, want) => ok(got === want, `${msg} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// ─── a localStorage that behaves like the real one and never throws ─────────
const store = new Map();
let failSetItem = false;
globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { if (failSetItem) throw new Error('quota'); store.set(k, String(v)); },
    removeItem: k => { store.delete(k); },
};
const reset = () => { store.clear(); failSetItem = false; };

const mod = await import('../session-log.js');

// ─── an injected Firestore surface — setDoc keyed by a derived ref, exactly
//     as game.js's / learn.js's real `doc`/`setDoc` behave: the same ref
//     shape always resolves to the same server document. ────────────────────
let serverDocs;   // Map<id, payload> — the "server"
let setDocCalls;  // [{id, payload}] — every call, in order
let addDocCalls;  // addDoc must never be called by the fixed writer
function freshFirestore() {
    serverDocs = new Map();
    setDocCalls = [];
    addDocCalls = [];
    mod.sessionLogInit({
        db: {},
        collection: (_db, name) => name,
        doc: (_db, _colName, id) => ({ __ref: true, id }),
        setDoc: async (ref, payload) => {
            setDocCalls.push({ id: ref.id, payload });
            serverDocs.set(ref.id, payload);
        },
        addDoc: async (_col, payload) => {
            addDocCalls.push(payload);
            const id = 'random' + addDocCalls.length;
            serverDocs.set(id, payload);
            return { id };
        },
        serverTimestamp: () => ({ __sentinel: 'serverAt' }),
    });
}

const TODAY = '2026-08-25';
let seq = 0;
function rec(seconds = 60, { date = TODAY, source = 'library', label = 'unit1' } = {}) {
    seq++;
    return {
        date, at: new Date(Date.parse(date + 'T09:00:00Z') + seq * 60000).toISOString(),
        seconds, chars: seconds * 5, mistakes: 1, wpm: 30, accuracy: 99,
        source, label,
    };
}

console.log(`\nsession-log.js v${mod.SESSION_LOG_VERSION}\n`);

// ─── A. a clean flush uses setDoc at a derived id, never addDoc ────────────
console.log('─── A. clean flush: setDoc, not addDoc ───');
{
    reset(); freshFirestore();
    mod.sessionLogPush('studentA', rec(70));
    mod.sessionLogPush('studentA', rec(80));

    const result = await mod.sessionLogFlush('studentA', { email: 'a@example.org' });

    eq('A1 flush reports success', result, true);
    eq('A2 exactly one document written', setDocCalls.length, 1);
    eq('A3 ⚠️ addDoc was never called', addDocCalls.length, 0);
    ok(typeof (setDocCalls[0] && setDocCalls[0].id) === 'string' && setDocCalls[0].id.length > 0,
       `A4 the write carries a real, non-empty id (got ${JSON.stringify(setDocCalls[0] && setDocCalls[0].id)})`);
    eq('A5 the queue is cleared', mod.sessionLogPending('studentA'), 0);
    eq('A6 the document carries both sprints',
       setDocCalls[0] && setDocCalls[0].payload && setDocCalls[0].payload.sprintCount, 2);
}

// ─── B. a resend of the SAME chunk overwrites, it does not duplicate ──────
console.log('\n─── B. queue not cleared \u2192 resend overwrites ───');
{
    reset(); freshFirestore();
    const r1 = rec(70), r2 = rec(80);
    mod.sessionLogPush('studentA', r1);
    mod.sessionLogPush('studentA', r2);

    await mod.sessionLogFlush('studentA', {});
    const firstId = setDocCalls[0] && setDocCalls[0].id;
    eq('B1 one document on the server', serverDocs.size, 1);

    // ⚠️ SIMULATES THE KILLED PAGE. The server write landed (serverDocs has
    // it) but the local queue was never cleared — pagehide killed the tab
    // between the two, or `_write()` failed silently. Re-push the SAME two
    // records exactly as a resend would replay them from a queue that still
    // holds the chunk.
    mod.sessionLogPush('studentA', r1);
    mod.sessionLogPush('studentA', r2);
    await mod.sessionLogFlush('studentA', {});

    eq('B2 ⚠️ still ONE document, not two', serverDocs.size, 1);
    eq('B3 the resend landed on the SAME id', setDocCalls[1] && setDocCalls[1].id, firstId);
    eq('B4 the surviving document is the resend\u2019s content',
       firstId && serverDocs.has(firstId) ? serverDocs.get(firstId).sprintCount : undefined, 2);
}

// ─── C. a resend that also gained a later sprint still derives the same id ─
console.log('\n─── C. superset resend \u2014 same first sprint, more besides ───');
{
    reset(); freshFirestore();
    const r1 = rec(70);
    mod.sessionLogPush('studentA', r1);
    await mod.sessionLogFlush('studentA', {});
    const firstId = setDocCalls[0] && setDocCalls[0].id;
    eq('C1 first write carries one sprint',
       firstId && serverDocs.has(firstId) ? serverDocs.get(firstId).sprintCount : undefined, 1);

    // The queue was not cleared (same simulated failure as B), AND the
    // student kept typing before the retry — a third sprint joins the group.
    const r2 = rec(90);
    mod.sessionLogPush('studentA', r1);
    mod.sessionLogPush('studentA', r2);
    await mod.sessionLogFlush('studentA', {});

    eq('C2 ⚠️ still one document', serverDocs.size, 1);
    eq('C3 same id as the original write', setDocCalls[1] && setDocCalls[1].id, firstId);
    eq('C4 the surviving document is the SUPERSET (2 sprints)',
       firstId && serverDocs.has(firstId) ? serverDocs.get(firstId).sprintCount : undefined, 2);
    eq('C5 and its seconds are the superset\u2019s total',
       firstId && serverDocs.has(firstId) ? serverDocs.get(firstId).seconds : undefined, 160);
}

// ─── D. a failed local removal behaves exactly like a killed page ─────────
console.log('\n─── D. localStorage quota failure \u2014 the "second, rarer path" ───');
{
    reset(); freshFirestore();
    const r1 = rec(70);
    mod.sessionLogPush('studentA', r1);

    // The server write succeeds; persisting the shrunk queue back to
    // localStorage does not.
    failSetItem = true;
    const result = await mod.sessionLogFlush('studentA', {});
    failSetItem = false;

    eq('D1 one document reached the server', serverDocs.size, 1);
    const firstId = setDocCalls[0] && setDocCalls[0].id;
    // ⚠️ THE QUEUE STILL HOLDS THE RECORD — the write to localStorage never
    // landed, so the next load (or the next flush on this page) sees it as
    // still pending. This is expected and is exactly the case the derived id
    // exists for; it is not asserted as a failure here.
    ok(mod.sessionLogPending('studentA') >= 0, 'D2 flush did not throw');

    // The retry: storage works now, and the record resends.
    mod.sessionLogPush('studentA', r1);
    await mod.sessionLogFlush('studentA', {});

    eq('D3 ⚠️ still one document on the server, not two', serverDocs.size, 1);
    const lastCall = setDocCalls[setDocCalls.length - 1];
    eq('D4 the retry landed on the same id as the first attempt', lastCall && lastCall.id, firstId);
}

// ─── E. two independent groups never collide on one id ────────────────────
console.log('\n─── E. two different groups \u2192 two different ids ───');
{
    reset(); freshFirestore();
    mod.sessionLogPush('studentA', rec(60, { source: 'library', label: 'bookA' }));
    mod.sessionLogPush('studentA', rec(60, { source: 'school',  label: 'lessonB' }));
    await mod.sessionLogFlush('studentA', {});

    eq('E1 two documents written', setDocCalls.length, 2);
    ok(setDocCalls.length === 2 && setDocCalls[0].id !== setDocCalls[1].id,
       `E2 the two groups get different ids (got ${JSON.stringify(setDocCalls.map(c => c.id))})`);
}

// ─── F. an ordinary two-groups flush still writes two documents ───────────
console.log('\n─── F. two groups, two documents, business as usual ───');
{
    reset(); freshFirestore();
    mod.sessionLogPush('studentA', rec(60, { date: '2026-08-24' }));
    mod.sessionLogPush('studentA', rec(60, { date: '2026-08-25' }));
    await mod.sessionLogFlush('studentA', {});

    eq('F1 two documents, one per day', serverDocs.size, 2);
    eq('F2 the queue is fully cleared', mod.sessionLogPending('studentA'), 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
