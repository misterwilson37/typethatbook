// guest-merge-test.mjs v1.0.0 — THE MINUTE A CHILD TYPES BEFORE SIGNING IN.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE DEFECT, MEASURED ON REAL DATA (Jake, 2026-08-20)
// ═══════════════════════════════════════════════════════════════════════════
//
// One student, one machine, both modes, cache cleared first:
//
//     School   guest 1:04  →  sign in  →  8:31     server held 7:27
//     Library  guest 1:11  →  sign in  →  8:31     server held 7:27
//
// 7:27 + 1:04 = 8:31, so School merged the guest minute. Library landed on the
// SAME 8:31 — the server's figure, unchanged — so its guest minute was
// overwritten. The next signed-in sprint then took it 8:31 → 9:39, which the
// report confirms at 9m 39s / 1,633 chars.
//
// ⚠️ THIS IS JAKE'S RULE 10 SATISFIED FOR ONCE ON GENUINELY REAL DATA. Part A
// drives those exact figures. It is not a synthetic case chosen to fail.
//
// ⚠️ THE CAUSE WAS AN ABSENCE, NOT AN ERROR. learn.js's onAuthStateChanged
// calls retroactiveSaveAnonSession() before loadUserStats(); game.js went
// straight to loadUserStats(), whose applyWeekToStats() is — by its own header
// — AN ASSIGNMENT, NOT AN ACCUMULATION. game.js DID have the merge, twice,
// inline, in two modal paths, so whether a child kept their minutes depended on
// which of three sign-in buttons they pressed. Nothing could grep for that.
//
// PARTS
//   A — mergeGuestStats(), lifted from BOTH files, against the real 08-20
//       figures. Both must produce 8:31, and must agree with each other.
//   B — GREP: game.js has exactly ONE merge call site reachable from auth, and
//       retroactiveSaveGuestSession() runs BEFORE loadUserStats(). This is the
//       assertion that would notice the defect coming back.
//   C — GREP: neither page files a guest's records under an account uid, and
//       both hand the guest slot over at sign-in.
//   D — the handover itself, against the real session-log.js.
//
// ⚠️ MUTATION-VERIFIED. Against game.js v3.35.0 / learn.js v2.20.0 this
// harness reports 7 failing across Parts B, C and D.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };
const eq = (msg, got, want) => ok(got === want, `${msg} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const src = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ⚠️ COMMENTS ARE STRIPPED BEFORE ANY ORDER OR ABSENCE TEST, AND THIS BIT ME
// WHILE WRITING IT. Both fixes below are documented in comments that NAME the
// thing they replaced — game.js's new note says "loadUserStats() ASSIGNS", and
// learn.js's says the old line read `currentUser ? currentUser.uid`. A grep
// over raw source therefore finds the defect in the prose describing its own
// repair, and reports the fix as absent. A harness that reads comments is
// asserting documentation, not behaviour.
const decomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '')
                          .split('\n').map(l => l.replace(/(^|[^:'"`])\/\/.*$/, '$1')).join('\n');
const game = src('game.js');
const learn = src('learn.js');

// ─── lift a function body out of a source file by brace matching ────────────
function lift(text, name) {
    const start = text.indexOf('function ' + name + '(');
    if (start < 0) return null;
    let i = text.indexOf('{', start), depth = 0;
    for (; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') { depth--; if (!depth) break; }
    }
    return text.slice(start, i + 1);
}

console.log('\n─── A. the real 2026-08-20 figures ───');
{
    // 7:27 stored on the server, all of it School; the guest minute typed here.
    const SERVER_SECONDS = 447;   // 7m 27s
    const server = {
        lastDate: '2026-08-20', weekStart: '2026-08-15',
        secondsToday: SERVER_SECONDS, charsToday: 1400, mistakesToday: 30,
        secondsSchool: SERVER_SECONDS, charsSchool: 1400, mistakesSchool: 30,
        secondsLibrary: 0, charsLibrary: 0, mistakesLibrary: 0,
        secondsWeek: 3552, charsWeek: 5000, mistakesWeek: 90,
    };

    const run = (text, what, guestSeconds, guestField) => {
        const body = lift(text, 'mergeGuestStats');
        ok(!!body, `${what}: mergeGuestStats() is liftable`);
        if (!body) return null;
        const sandbox = new Function('server', 'dateStr', 'weekStart', 'guest', `
            const statsData = Object.assign({}, guest);
            const statsBaseline = {};      // a true guest: nothing was seeded
            // Stubbed: the baseline snapshot is a side effect for the NEXT
            // merge, not part of this one's arithmetic.
            function captureStatsBaseline() {}
            ${body}
            mergeGuestStats(server, dateStr, weekStart);
            return statsData;
        `);
        const guest = {
            lastDate: '2026-08-20', weekStart: '2026-08-15',
            secondsToday: guestSeconds, charsToday: 300, mistakesToday: 5,
            secondsLibrary: 0, charsLibrary: 0, mistakesLibrary: 0,
            secondsSchool: 0, charsSchool: 0, mistakesSchool: 0,
            secondsWeek: guestSeconds, charsWeek: 300, mistakesWeek: 5,
        };
        guest[guestField] = guestSeconds;
        return sandbox(server, '2026-08-20', '2026-08-15', guest);
    };

    // School: guest 1:04 → 8:31
    const school = run(learn, 'learn.js', 64, 'secondsSchool');
    if (school) {
        eq('A1 School: 7:27 + 1:04 = 8:31', school.secondsToday, 511);
        eq('A2 and the guest minute lands in the School field', school.secondsSchool, 447 + 64);
    }

    // Library: guest 1:11 → must be 8:38, NOT the 8:31 Jake saw
    const library = run(game, 'game.js', 71, 'secondsLibrary');
    if (library) {
        eq('A3 Library: 7:27 + 1:11 = 8:38', library.secondsToday, 518);
        ok(library.secondsToday !== 447,
           'A4 ⚠️ the guest minute is NOT overwritten by the server figure');
        eq('A5 and it lands in the Library field', library.secondsLibrary, 71);
    }

    // ⚠️ THE TWO COPIES MUST AGREE. The arithmetic was never the defect — the
    // absence of a caller was — but two copies that drift is how this project
    // got here, so hold them together while they both exist.
    if (school && library) {
        const a = run(game, 'game.js', 64, 'secondsSchool');
        eq('A6 both files\u2019 copies agree on identical inputs',
           JSON.stringify(a), JSON.stringify(school));
    }
}

console.log('\n─── B. the merge is on the auth path, and runs first ───');
{
    // ⚠️ ORDER IS THE ASSERTION. A merge that runs AFTER loadUserStats() is a
    // merge whose result is immediately assigned over. Both indices are taken
    // inside the auth handler so an unrelated call elsewhere cannot satisfy it.
    const gameCode = decomment(game), learnCode = decomment(learn);
    const authStart = gameCode.indexOf('onAuthStateChanged(auth, async (user) => {');
    ok(authStart > 0, 'B1 game.js has an onAuthStateChanged handler');
    const authBlock = gameCode.slice(authStart, authStart + 4000);

    const merge = authBlock.indexOf('retroactiveSaveGuestSession(');
    const load  = authBlock.indexOf('loadUserStats(');
    ok(merge > 0, 'B2 ⚠️ game.js merges the guest session on the auth path');
    ok(load > 0,  'B3 and still loads user stats there');
    ok(merge > 0 && load > 0 && merge < load,
       'B4 ⚠️ THE MERGE RUNS BEFORE loadUserStats() — after it, the assignment wins');

    // The same property in learn.js, which had it all along.
    const lAuth = learnCode.indexOf('onAuthStateChanged(auth, async user => {');
    const lBlock = learnCode.slice(lAuth, lAuth + 4000);
    const lMerge = lBlock.indexOf('retroactiveSaveAnonSession(');
    const lLoad  = lBlock.indexOf('loadUserStats(');
    ok(lMerge > 0 && lLoad > 0 && lMerge < lLoad,
       'B5 learn.js keeps the same order');

    // ⚠️ ONE COPY. Two inline copies are what let the third caller be missing.
    const inlineCopies = (gameCode.match(/mergeGuestStats\(read\.ok/g) || []).length;
    eq('B6 ⚠️ game.js calls mergeGuestStats() from ONE place only', inlineCopies, 1);
    ok(lift(game, 'retroactiveSaveGuestSession') !== null,
       'B7 and that place is retroactiveSaveGuestSession()');
}

console.log('\n─── C. a guest\u2019s records are kept, and handed over ───');
{
    for (const [what, text, fn] of [['game.js', decomment(game), 'logSession'],
                                    ['learn.js', decomment(learn), 'logRun']]) {
        const body = lift(text, fn);
        ok(!!body, `C1 ${what}: ${fn}() is liftable`);
        if (!body) continue;
        ok(body.includes('GUEST_QUEUE_UID'),
           `C2 ${what}: a true guest\u2019s records go to the guest slot, not nowhere`);
        // ⚠️ THE OLD learn.js BUG, ASSERTED ABSENT: `currentUser ? currentUser.uid`
        // treats an ANONYMOUS user as an account, because a guest IS signed in.
        ok(!/currentUser\s*\?\s*currentUser\.uid/.test(body),
           `C3 ${what}: an anonymous user is never treated as an account`);
    }
    ok(/sessionLogAdopt\(\s*user\.uid,\s*sessionLogTake\(GUEST_QUEUE_UID\)/.test(game),
       'C4 game.js hands the guest slot to the account at sign-in');
    ok(/sessionLogAdopt\(\s*user\.uid,\s*sessionLogTake\(GUEST_QUEUE_UID\)/.test(learn),
       'C5 learn.js does the same');
    // Jake: "As a flush so it's in the record, too."
    ok(/retroactiveSaveGuestSession[\s\S]{0,3000}?flushAll\('guest-retroactive', true\)/.test(game),
       'C6 ⚠️ game.js FLUSHES immediately — the correction reaches the teacher now');
    ok(/sessionLogAdopt[\s\S]{0,500}?flushStats\('anon-retroactive', true\)/.test(learn),
       'C7 learn.js flushes after adopting too');
}

console.log('\n─── D. the handover, against the real module ───');
{
    const store = new Map();
    globalThis.localStorage = {
        getItem: k => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => { store.set(k, String(v)); },
        removeItem: k => { store.delete(k); },
    };
    const m = await import('../session-log.js');
    const writes = [];
    m.sessionLogInit({
        db: {}, collection: (_d, n) => n,
        addDoc: async (_c, p) => { writes.push(p); return { id: 'd' + writes.length }; },
    });

    const D = '2026-08-20';
    const rec = (secs, n) => ({ date: D, at: `${D}T12:5${n}:00.000Z`, seconds: secs,
                                chars: secs * 5, mistakes: 1, wpm: 40, accuracy: 98,
                                source: 'library', label: 'pinocchio' });

    // A guest types 71 seconds across two sprints.
    m.sessionLogPush(m.GUEST_QUEUE_UID, rec(35, 5));
    m.sessionLogPush(m.GUEST_QUEUE_UID, rec(36, 6));
    eq('D1 the guest slot holds both records', m.sessionLogPending(m.GUEST_QUEUE_UID), 2);
    eq('D2 and no account can see them', m.sessionLogPending('realStudent'), 0);

    // Sign-in: take and adopt.
    const adopted = m.sessionLogAdopt('realStudent', m.sessionLogTake(m.GUEST_QUEUE_UID), D);
    eq('D3 both records are adopted', adopted, 2);
    eq('D4 ⚠️ the guest slot is empty — never adopted twice',
       m.sessionLogPending(m.GUEST_QUEUE_UID), 0);
    eq('D5 and the account now holds them', m.sessionLogPending('realStudent'), 2);
    eq('D6 with the seconds intact', m.sessionLogPendingSeconds('realStudent', D), 71);

    await m.sessionLogFlush('realStudent', {});
    eq('D7 ⚠️ they reach Firestore under the REAL uid', writes.length, 1);
    eq('D8 with the student\u2019s own id', writes[0] && writes[0].uid, 'realStudent');
    eq('D9 and all 71 seconds', writes[0] && writes[0].seconds, 71);

    // ⚠️ AN INTERRUPTED HANDOVER LOSES THE TAIL RATHER THAN DOUBLING IT.
    m.sessionLogPush(m.GUEST_QUEUE_UID, rec(20, 7));
    m.sessionLogTake(m.GUEST_QUEUE_UID);          // taken, then the page dies
    eq('D10 a taken-but-unadopted queue is gone, not re-adoptable',
       m.sessionLogPending(m.GUEST_QUEUE_UID), 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
