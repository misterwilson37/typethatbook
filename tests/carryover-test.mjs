// carryover-test.mjs v1.0.0 — THE OVERNIGHT RESCUE: guest minutes reach the day
// they were typed on, and never any other day.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS IS FOR
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake's ruling, 2026-08-20: *"If Kid A types a bunch but loses connection and
// comes in tomorrow, I want him to be able to rescue that time. It wouldn't be
// cheating, as it would get picked up and put in the right place."*
//
// The objection this overturns is in stats-wal.js's guest-accumulator header
// and it was correct: yesterday's minutes must not be **silently credited to
// today**, because a teacher's daily report has to mean what it says. It
// assumed the only destination was today's counter. Since Round 23 the guest
// queue is dated, sourced and durable for 21 days, and `typing_logs` is keyed
// `{uid}_{date}` — so the right day is addressable and the objection no longer
// applies to what actually ships.
//
// ⚠️ THE THING THIS HARNESS EXISTS TO STOP is the version of this feature that
// credits the wrong day. Every Part below is a different wrong day.
//
// ═══════════════════════════════════════════════════════════════════════════
// PARTS
// ═══════════════════════════════════════════════════════════════════════════
//
//   A — yesterday's guest sprints are planned onto YESTERDAY, grouped per
//       source, oldest day first
//   B — ⚠️ TODAY IS NEVER CARRIED. The live merge already owns it, and carrying
//       it too is the double-credit this whole feature has to not be
//   C — ⚠️ PRE-CUTOVER DAYS ARE REFUSED, by the plan and by the payload. Adding
//       to the shared flat triple is §3.1 with an addition in front of it
//   D — the payload ADDS to what the document already holds, names only its own
//       source's three fields, and names them absolutely
//   E — junk in the queue cannot produce a write: undated, unsourced, zeroed,
//       negative, or dated in the future
//   F — the end-to-end shape: a guest day, a signed-in day, and a day that
//       straddles both, against a fake Firestore
//
// ⚠️ MUTATION-VERIFIED, both guards, against daylog.js v1.4.0:
//   * remove `date >= todayStr` from carryOverPlan()  → 5 failing (B1 B3 B4 F1 F7)
//   * remove BOTH cutover guards                      → 3 failing (C1 C2 C4)
// If you are reading it green, check both guards are still there.

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };
const eq = (msg, got, want) => ok(got === want, `${msg} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
const deep = (msg, got, want) => ok(JSON.stringify(got) === JSON.stringify(want),
    `${msg} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const mod = await import('../daylog.js');
const { carryOverPlan, carryOverPayloadFor, sourceTotalsOf,
        SOURCE_SPLIT_CUTOVER, DAYLOG_VERSION } = mod;

console.log(`\ndaylog.js v${DAYLOG_VERSION} — cutover ${SOURCE_SPLIT_CUTOVER}\n`);

// Dates chosen relative to the real constant so this harness does not need
// editing when the cutover moves. daylog-cutover-test.mjs makes the same point
// about itself and for the same reason.
const CUT   = SOURCE_SPLIT_CUTOVER;              // 2026-08-22
const AFTER = '2026-08-24';
const A2    = '2026-08-25';
const TODAY = '2026-08-26';
const BEFORE = '2026-08-20';

let seq = 0;
function rec(date, source, seconds, chars = seconds * 5, mistakes = 2) {
    seq++;
    return {
        date, at: `${date}T18:0${seq % 10}:00.000Z`,
        seconds, chars, mistakes, wpm: 60, accuracy: 97,
        source, label: 'aesops fables', detail: '1',
    };
}

// ─── A. yesterday lands on yesterday ───────────────────────────────────────
console.log('─── A. the rescue targets the day the child typed ───');
{
    const plan = carryOverPlan([
        rec(AFTER, 'library', 60),
        rec(AFTER, 'library', 42),
        rec(A2,    'library', 30),
    ], TODAY);

    eq('A1 two days of work produce two carry-over groups', plan.length, 2);
    eq('A2 ⚠️ the older day is first, so a partial failure leaves the newer one',
       plan[0].date, AFTER);
    eq('A3 the older day sums its own sprints only', plan[0].seconds, 102);
    eq('A4 and the newer day sums its own', plan[1].seconds, 30);
    eq('A5 the source rides along', plan[0].source, 'library');
    eq('A6 chars are summed too', plan[0].chars, 510);
    eq('A7 and mistakes', plan[0].mistakes, 4);
    eq('A8 the records are kept for the log line', plan[0].records.length, 2);
}

// ─── A2. two sources on one day do not merge ───────────────────────────────
console.log('\n─── A2. School and Library on one day stay apart ───');
{
    const plan = carryOverPlan([
        rec(AFTER, 'library', 60),
        rec(AFTER, 'school',  90),
    ], TODAY);
    eq('A9 one day, two sources, two groups', plan.length, 2);
    const lib = plan.find(g => g.source === 'library');
    const sch = plan.find(g => g.source === 'school');
    eq('A10 ⚠️ Library keeps its own 60s', lib.seconds, 60);
    eq('A11 ⚠️ and School its own 90s — a merged 150 would be filed under one field', sch.seconds, 90);
}

// ─── B. today is never carried ─────────────────────────────────────────────
console.log('\n─── B. ⚠️ TODAY IS THE LIVE MERGE\u2019S, NOT THIS FEATURE\u2019S ───');
{
    const plan = carryOverPlan([
        rec(TODAY, 'library', 66),
        rec(AFTER, 'library', 60),
    ], TODAY);
    eq('B1 ⚠️ today produces no carry-over group at all', plan.length, 1);
    eq('B2 and the group that survives is the prior day', plan[0].date, AFTER);
    eq('B3 ⚠️ today\u2019s 66 seconds are nowhere in the plan',
       plan.reduce((n, g) => n + g.seconds, 0), 60);

    // A record dated in the future — a wrong device clock — is not "prior".
    const future = carryOverPlan([rec('2026-09-01', 'library', 60)], TODAY);
    eq('B4 a future-dated record is refused, not carried', future.length, 0);
}

// ─── C. pre-cutover days are refused ───────────────────────────────────────
console.log('\n─── C. ⚠️ THE §3.1 GUARD: the shared flat triple is not a target ───');
{
    const plan = carryOverPlan([
        rec(BEFORE, 'library', 300),
        rec(AFTER,  'library', 60),
    ], TODAY);
    eq('C1 ⚠️ a pre-cutover day is not planned', plan.length, 1);
    eq('C2 and the day that IS planned is the post-cutover one', plan[0].date, AFTER);

    // The cutover day itself is ON the new shape — `>=`, matching every other
    // gate in the project.
    eq('C3 the cutover day itself is carryable',
       carryOverPlan([rec(CUT, 'library', 60)], TODAY).length, 1);

    let threw = false;
    try {
        carryOverPayloadFor('library', BEFORE, { stored: {}, add: { seconds: 60 } });
    } catch (_) { threw = true; }
    ok(threw, 'C4 ⚠️ the payload THROWS on a pre-cutover date rather than writing the flat triple');
}

// ─── D. the payload adds, and names only its own fields ────────────────────
console.log('\n─── D. the payload is an absolute value for three fields ───');
{
    const stored = { seconds: 120, chars: 600, mistakes: 5 };
    const p = carryOverPayloadFor('library', AFTER, {
        stored, add: { seconds: 60, chars: 300, mistakes: 2 },
    });
    deep('D1 stored + rescued, in the Library triple only', p, {
        secondsLibrary: 180, charsLibrary: 900, mistakesLibrary: 7,
    });
    ok(!('seconds' in p), 'D2 ⚠️ the flat `seconds` field is NOT named — that is the frozen one');
    ok(!('secondsSchool' in p), 'D3 ⚠️ nor the other source\u2019s field — that is the whole §3.1 fix');

    const s = carryOverPayloadFor('school', AFTER, {
        stored: { seconds: 0, chars: 0, mistakes: 0 },
        add: { seconds: 45, chars: 200, mistakes: 1 },
    });
    deep('D4 a day with no stored School time starts from zero', s, {
        secondsSchool: 45, charsSchool: 200, mistakesSchool: 1,
    });

    // sourceTotalsOf() on an absent document is what the caller passes as
    // `stored` for a guest-only day.
    const empty = sourceTotalsOf({});
    deep('D5 an absent document reads as zeros, not undefined', empty.library,
         { seconds: 0, chars: 0, mistakes: 0 });

    let threw = false;
    try { carryOverPayloadFor('adventure', AFTER, { stored: {}, add: {} }); }
    catch (_) { threw = true; }
    ok(threw, 'D6 an unknown source throws rather than writing an undefined field name');
}

// ─── E. junk cannot produce a write ────────────────────────────────────────
console.log('\n─── E. nothing malformed reaches Firestore ───');
{
    const plan = carryOverPlan([
        null,
        { source: 'library', seconds: 60 },                       // no date
        { date: AFTER, seconds: 60 },                             // no source
        { date: AFTER, source: 'nonsense', seconds: 60 },         // unknown source
        { date: 'yesterday', source: 'library', seconds: 60 },    // malformed date
        rec(AFTER, 'library', 0, 0, 0),                           // nothing happened
    ], TODAY);
    eq('E1 every malformed record is dropped and nothing is planned', plan.length, 0);

    // Negative numbers clamp rather than subtracting from a stored total.
    const neg = carryOverPlan([rec(AFTER, 'library', -50, -100, -3)], TODAY);
    eq('E2 an all-negative record contributes nothing and is not planned', neg.length, 0);

    const mixed = carryOverPlan([rec(AFTER, 'library', 60, -100, -3)], TODAY);
    eq('E3 ⚠️ a negative char count clamps to 0 and never reduces a stored total',
       mixed.length ? mixed[0].chars : null, 0);
    eq('E4 while the real seconds survive', mixed[0].seconds, 60);

    deep('E5 an empty queue plans nothing', carryOverPlan([], TODAY), []);
    deep('E6 so does a missing one', carryOverPlan(null, TODAY), []);
    deep('E7 and a plan with no date to compare against refuses outright',
         carryOverPlan([rec(AFTER, 'library', 60)], ''), []);
}

// ─── F. end to end against a fake Firestore ────────────────────────────────
console.log('\n─── F. the classroom sequence: Thursday guest, Friday sign-in ───');
{
    // Thursday's document already holds signed-in Library time; the child then
    // typed as a guest, lost the network, and signed in on Friday.
    const docs = {
        [`u1_${AFTER}`]: { uid: 'u1', date: AFTER, secondsLibrary: 240, charsLibrary: 1200, mistakesLibrary: 10 },
    };
    const writes = [];

    const plan = carryOverPlan([
        rec(AFTER, 'library', 60, 300, 2),
        rec(AFTER, 'library', 42, 210, 1),
        rec(A2,    'school',  90, 400, 4),   // a second day, other mode
        rec(TODAY, 'library', 66, 330, 3),   // today — the live merge's
    ], TODAY);

    for (const g of plan) {
        const id = `u1_${g.date}`;
        const stored = sourceTotalsOf(docs[id] || {})[g.source];
        const payload = carryOverPayloadFor(g.source, g.date, {
            stored, add: { seconds: g.seconds, chars: g.chars, mistakes: g.mistakes },
        });
        docs[id] = { ...(docs[id] || { uid: 'u1', date: g.date }), ...payload };
        writes.push(id);
    }

    eq('F1 two prior days written, today untouched', writes.length, 2);
    eq('F2 ⚠️ Thursday\u2019s stored 240s is ADDED TO, not replaced',
       docs[`u1_${AFTER}`].secondsLibrary, 342);
    eq('F3 and its chars likewise', docs[`u1_${AFTER}`].charsLibrary, 1710);
    eq('F4 ⚠️ Thursday\u2019s School field is never mentioned',
       'secondsSchool' in docs[`u1_${AFTER}`], false);
    eq('F5 the guest-only Friday document is CREATED', docs[`u1_${A2}`].secondsSchool, 90);
    eq('F6 ⚠️ and carries its own date, not today\u2019s', docs[`u1_${A2}`].date, A2);
    eq('F7 ⚠️ TODAY HAS NO DOCUMENT FROM THIS PATH AT ALL',
       `u1_${TODAY}` in docs, false);

    // ⚠️ THE SECOND SIGN-IN. sessionLogTake() is atomic, so the queue is empty
    // by then and the plan is empty. Modelled explicitly because "it cannot run
    // twice" is the claim the whole no-cheating argument rests on.
    const second = carryOverPlan([], TODAY);
    eq('F8 ⚠️ a second sign-in carries nothing and cannot double-credit', second.length, 0);
}

console.log(`\n${pass} passing, ${fail} failing.`);
process.exit(fail ? 1 : 0);
