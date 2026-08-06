// student-flow-test.mjs v1.0.0 — Round 6 (Noiseless).
//
// WHAT THIS IS FOR
//
// Jake cannot test with real students — the Google accounts are a mess — and the
// riskiest moment in this app's year is the one nobody can rehearse: the first day
// of a 9-week rotation, when every student is newly assigned at once. This walks
// that journey against the SHIPPING code and asserts what has to be true at each
// step.
//
// It lifts applyPendingClassAssignment() out of game.js and learn.js by
// brace-matching, the same way the other harnesses lift from index.html, and runs
// it against a fake Firestore and a fake localStorage. So it tests the real
// function, not a description of it, and it breaks if the function is renamed —
// which is correct.
//
//   node student-flow-test.mjs
//
// WHY EACH ASSERTION IS HERE (all four bugs below were live in Round 6):
//
//   1. game.js had NO applyPendingClassAssignment at all. Only learn.js did. A
//      student who typed a book chapter before ever opening the Lessons page was
//      never assigned to their class, so every log they wrote was stamped
//      classId: '' and they appeared in no class-filtered report.
//   2. Both files cleared nothing before re-reading goals. loadGoals() had written
//      ttb_goalsCache_v1 with classId: '' and a 24-HOUR lifetime moments earlier,
//      so the re-read returned the empty value the function had just fixed.
//   3. The two files share that cache key, so the poisoned entry followed the
//      student between pages.
//   4. schoolId must ride along on the write, or the student has a class but no
//      building and is invisible to their own teacher.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import assert from 'assert';

const HERE = (f) => fileURLToPath(new URL('./' + f, import.meta.url));

function liftFn(src, name, file) {
    const k = src.indexOf('async function ' + name + '(');
    if (k < 0) throw new Error(
        `${name}() not found in ${file}. If it was renamed, reanchor this harness — ` +
        `do NOT paste a copy of the logic in here. If it was DELETED, that is the ` +
        `bug this file exists to catch: see note 1 at the top.`);
    let d = 0;
    for (let x = src.indexOf('{', k); x < src.length; x++) {
        if (src[x] === '{') d++;
        else if (src[x] === '}') { d--; if (!d) return src.slice(k, x + 1); }
    }
    throw new Error('unbalanced braces lifting ' + name);
}

// ── Fakes ─────────────────────────────────────────────────────────────────────
// Deliberately dumb. A fake that is clever enough to hide a bug is worse than none.
function makeWorld() {
    const store = new Map();            // "collection/id" -> data object
    const deleted = [];
    const reads = [];
    const localStore = new Map();

    const api = {
        doc: (_db, ...path) => ({ path: path.join('/') }),
        getDoc: async (ref) => {
            reads.push(ref.path);
            const has = store.has(ref.path);
            return { exists: () => has, data: () => (has ? { ...store.get(ref.path) } : undefined) };
        },
        setDoc: async (ref, data, opts) => {
            if (opts && opts.merge) store.set(ref.path, { ...(store.get(ref.path) || {}), ...data });
            else store.set(ref.path, { ...data });
        },
        deleteDoc: async (ref) => { deleted.push(ref.path); store.delete(ref.path); },
        localStorage: {
            getItem: (k) => (localStore.has(k) ? localStore.get(k) : null),
            setItem: (k, v) => localStore.set(k, String(v)),
            removeItem: (k) => localStore.delete(k),
        },
    };
    return { store, deleted, reads, localStore, api };
}

const GOALS_KEY = 'ttb_goalsCache_v1';

// Build a runnable copy of the lifted function with the fakes injected.
function bindLifted(code, world, onLoadGoals) {
    const factory = new Function(
        'db', 'doc', 'getDoc', 'setDoc', 'deleteDoc', 'localStorage',
        'GOALS_CACHE_KEY', 'LEARN_GOALS_KEY', 'loadGoals', 'console',
        code + '\n return applyPendingClassAssignment;'
    );
    return factory(
        {}, world.api.doc, world.api.getDoc, world.api.setDoc, world.api.deleteDoc,
        world.api.localStorage, GOALS_KEY, GOALS_KEY, onLoadGoals,
        { log() {}, warn() {} }
    );
}

const SOURCES = [
    ['game.js',  readFileSync(HERE('game.js'), 'utf8')],
    ['learn.js', readFileSync(HERE('learn.js'), 'utf8')],
];

let failures = 0;
function check(label, fn) {
    try { fn(); console.log('    ok   ' + label); }
    catch (e) { failures++; console.log('    FAIL ' + label + '\n           ' + e.message); }
}

for (const [file, src] of SOURCES) {
    console.log(`\n### ${file} — a student's first sign-in of a new rotation`);

    let code;
    try { code = liftFn(src, 'applyPendingClassAssignment', file); }
    catch (e) { failures++; console.log('    FAIL could not lift\n           ' + e.message); continue; }

    // ── Scenario 1: brand-new student, pre-assigned by a roster import ────────
    {
        const w = makeWorld();
        w.store.set('pendingClassAssignments/kid@school.org',
                    { classId: 'cs_3rd_x1a', schoolId: 'ems', assignedAt: 'now' });
        // loadGoals() already ran and cached the fact that this student had no class.
        w.localStore.set(GOALS_KEY, JSON.stringify({
            uid: 'uid_kid', at: Date.now(), dailySeconds: 0, weeklySeconds: 0,
            classId: '', schoolId: ''
        }));

        let reloaded = 0;
        const fn = bindLifted(code, w, async () => { reloaded++; });
        await fn({ uid: 'uid_kid', email: 'Kid@School.org', isAnonymous: false });

        check('assignment written to users/{uid}', () => {
            const u = w.store.get('users/uid_kid');
            assert.ok(u, 'no users/uid_kid document was written');
            assert.strictEqual(u.classId, 'cs_3rd_x1a');
        });
        check('schoolId rides along (else invisible to their own teacher)', () => {
            assert.strictEqual(w.store.get('users/uid_kid').schoolId, 'ems');
        });
        check('email lowercased before lookup', () => {
            assert.ok(w.reads.includes('pendingClassAssignments/kid@school.org'),
                      'looked up ' + JSON.stringify(w.reads));
        });
        check('pending record deleted so it cannot re-apply', () => {
            assert.ok(w.deleted.includes('pendingClassAssignments/kid@school.org'));
        });
        check('stale goals cache CLEARED before the re-read', () => {
            assert.strictEqual(w.localStore.get(GOALS_KEY), undefined,
                'ttb_goalsCache_v1 survived. It holds classId:"" with a 24h lifetime, ' +
                'so loadGoals() re-reads the empty value this function just fixed — and ' +
                'game.js/learn.js share the key, so it follows the student between pages. ' +
                'Every log flushed meanwhile is stamped classId:"".');
        });
        check('goals reloaded after assignment', () => {
            assert.strictEqual(reloaded, 1, 'loadGoals() called ' + reloaded + ' times');
        });
    }

    // ── Scenario 2: already placed directly — must not be clobbered ───────────
    {
        const w = makeWorld();
        w.store.set('pendingClassAssignments/kid@school.org', { classId: 'stale_class', schoolId: 'ems' });
        w.store.set('users/uid_kid', { classId: 'real_class', schoolId: 'ems' });
        const fn = bindLifted(code, w, async () => {});
        await fn({ uid: 'uid_kid', email: 'kid@school.org', isAnonymous: false });
        check('a real assignment is not overwritten by a stale pending record', () => {
            assert.strictEqual(w.store.get('users/uid_kid').classId, 'real_class');
        });
    }

    // ── Scenario 3: anonymous student — must be skipped, and cost nothing ─────
    {
        const w = makeWorld();
        w.store.set('pendingClassAssignments/kid@school.org', { classId: 'c', schoolId: 's' });
        const fn = bindLifted(code, w, async () => {});
        await fn({ uid: 'anon', email: null, isAnonymous: true });
        check('anonymous user skipped with zero reads', () => {
            assert.strictEqual(w.reads.length, 0, 'read ' + JSON.stringify(w.reads));
        });
    }

    // ── Scenario 4: nothing pending — the ~99% case, must stay cheap ──────────
    {
        const w = makeWorld();
        const before = JSON.stringify({ a: 1 });
        w.localStore.set(GOALS_KEY, before);
        const fn = bindLifted(code, w, async () => {});
        await fn({ uid: 'uid_kid', email: 'kid@school.org', isAnonymous: false });
        check('no pending record: one read, no writes, cache untouched', () => {
            assert.strictEqual(w.reads.length, 1, 'reads: ' + JSON.stringify(w.reads));
            assert.strictEqual(w.store.size, 0, 'wrote something it should not have');
            assert.strictEqual(w.localStore.get(GOALS_KEY), before, 'cleared the cache needlessly');
        });
    }

    // ── Scenario 5: pending record with no classId — malformed, ignore ────────
    {
        const w = makeWorld();
        w.store.set('pendingClassAssignments/kid@school.org', { schoolId: 'ems' });
        const fn = bindLifted(code, w, async () => {});
        await fn({ uid: 'uid_kid', email: 'kid@school.org', isAnonymous: false });
        check('pending record without a classId writes nothing', () => {
            assert.ok(!w.store.has('users/uid_kid'), 'wrote a user doc from a malformed record');
        });
    }
}

// ── Cross-file invariant ──────────────────────────────────────────────────────
console.log('\n### both entry points');
check('game.js and learn.js BOTH consume pending assignments', () => {
    for (const [file, src] of SOURCES) {
        assert.ok(src.includes('async function applyPendingClassAssignment'),
            `${file} has no applyPendingClassAssignment. index.html links students ` +
            `straight into game.html, so if only learn.js consumes the record, a ` +
            `student who types a book before opening Lessons is never assigned.`);
    }
});
check('both call it only when no class was resolved (keeps the read off the 99%)', () => {
    const g = readFileSync(HERE('game.js'), 'utf8');
    const l = readFileSync(HERE('learn.js'), 'utf8');
    assert.ok(/if\s*\(!ttbClassId\)\s*await\s+applyPendingClassAssignment/.test(g),
              'game.js calls it unconditionally, or not at all');
    assert.ok(/if\s*\(!\(classInfo && classInfo\.id\)\)\s*await\s+applyPendingClassAssignment/.test(l),
              'learn.js calls it unconditionally, or not at all');
});
check('logs are stamped from the resolved class, not a literal', () => {
    const g = readFileSync(HERE('game.js'), 'utf8');
    const l = readFileSync(HERE('learn.js'), 'utf8');
    assert.ok(/classId:\s*ttbClassId/.test(g), 'game.js stamps something other than ttbClassId');
    assert.ok(/classId:\s*\(?classInfo/.test(l), 'learn.js stamps something other than classInfo.id');
});

console.log('');
if (failures) {
    console.log(`${failures} FAILURE(S). Each one is a student who types for a day and appears`);
    console.log('in no class-filtered report, with no error anywhere to say so.');
    process.exitCode = 1;
} else {
    console.log('ALL PASS — a cold-start student gets assigned, stamped, and reportable');
    console.log('from either entry point, and an assigned student costs one extra read.');
}
