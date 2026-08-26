// daylog.js v1.6.0 — THE STUDENT READS THE GRADED DOCUMENT, AND THE GRADED
//
// v1.6.0 — §READS. readWeek() IS MEMOISED PER PAGE LOAD. Measured 2026-08-26 as
//          a student: it was 20 of 31 reads in a full session (65%), and
//          game.html paid TEN because it reads the same week twice —
//          retroactiveSaveGuestSession() then loadUserStats(), three lines
//          apart. The memo holds the PROMISE (so overlapping callers share one
//          round trip), never caches an `ok:false` read, hands every caller a
//          deep copy, and lives in memory only — it cannot outlive the page.
//          ⚠⚠ EVERY WRITER OF typing_logs MUST CALL invalidateWeek(uid).
//          weekly-memo-test.mjs asserts they do; a writer that forgets shows a
//          later caller pre-write numbers within the same load.
//          ⚠ THIS IS NOT THE CLOSED-DAY CACHE — see ROADMAP §READS. A day with
//          data is still re-read on every fresh page load.
//
// v1.5.0 — ROADMAP ITEM 18. readWeek() no longer fetches all seven days blind;
//          logdays.js tells it which of them can hold nothing. Measured before:
//          14 reads / 10 misses on one game.html load. ⚠️ A SKIPPED DAY MUST NOT
//          SET ok:false — see the comment in the map below, and Part G of
//          daylog-cutover-test.mjs's sibling harness logdays-test.mjs.
//
// v1.4.0 — THE STUDENT READS THE GRADED DOCUMENT, AND THE GRADED
//                     DOCUMENT IS A PROJECTION OF THE SESSION RECORD.
//
// v1.4.0 — ⚠️ THE OVERNIGHT RESCUE, on Jake's ruling: a child who typed as a
//          guest and did not sign in until the next day gets those minutes
//          credited TO THE DAY THEY HAPPENED ON, not to today. Adds
//          carryOverPlan() and carryOverPayloadFor(). ⚠️ PRE-CUTOVER DAYS ARE
//          REFUSED BY BOTH — adding to the shared flat triple is §3.1 with an
//          addition in front of it. The rescue switches itself on at
//          SOURCE_SPLIT_CUTOVER. See the block at the foot of this file, which
//          is the argument and not just the code.
//
// v1.3.0 — ⚠️ ROADMAP ITEM 1, THE WRITER HALF. Adds SOURCE_FIELDS and
//          sourceTotalsOf(), and readWeek() now returns `todaySources`.
//          totalsOf() IS UNTOUCHED — daylog-cutover-test.mjs Part F drives it
//          against reports.html's twin and any edit here breaks that pair.
//
//          ⚠️ WHY A WRITER NEEDS ITS OWN READ. game.js and learn.js each keep a
//          per-source counter now, and ROADMAP item 1 is explicit about the one
//          way to get it wrong: **the counter seeds from its own field, never
//          from the day total.** Seeding from the total folds the other mode's
//          time into your own bucket and the post-cutover reader then adds it
//          twice — that is the v3.29.0 bug, and tab-lifetime-test.mjs Part E
//          drives it deliberately. totalsOf() returns the DAY, which is the
//          right number for a HUD and the wrong number for a seed, so a second
//          accessor is not duplication: the two answer different questions.
//
//          It rides on readWeek()'s existing seven reads. No extra round trip.
//
// v1.2.0 — ⚠️ ROADMAP PHASE B, STEP B2. THE READER HALF OF THE §3.1 FIX, AND IT
//          SHIPS ALONE. totalsOf() is now DATE-GATED and EXPORTED.
//
//          §3.1: game.js and learn.js each write the whole day total under
//          `seconds`, so a tab left open from an earlier period overwrites a
//          newer total and a whole mode's time disappears. The fix is per-source
//          FIELDS — secondsLibrary / secondsSchool — which firestore.rules
//          v2.5.0 has permitted since v2.4.0 and which needs NO RULES DEPLOY.
//          Verified by execution: tests/rules-probe.test.mjs Part B.
//          (⚠️ The per-source DOCUMENT id design in HANDOFF §0.-4.C is DENIED by
//          the deployed rules. Do not revive it. §0.-5.B.)
//
//          ⚠️ THE BLOCKER WAS NEVER THE WRITERS — IT WAS THIS FUNCTION. Reading
//          legacy-first means a document holding `seconds` beside split fields
//          returns `seconds` and silently drops the splits. Move the writers
//          first and every afternoon after the switch vanishes behind that
//          morning's flat number. So the readers go first, alone, and with no
//          writer producing splits the totals are BIT-FOR-BIT what they were.
//          That is the safety argument for shipping this file by itself: it is
//          a no-op until game.js and learn.js follow.
//
//          ⚠️ WHY A DATE GATE INSTEAD OF JUST SUMMING. Plain flat+split summing
//          double-counts the days written during the v3.29.x window, when the
//          split shipped and was reverted — those documents carry a flat number
//          AND splits describing the same seconds. That is precisely why v2.14.0
//          made this legacy-first, and undoing it blindly re-breaks days that
//          are currently right. Jake has ruled that historical data is good
//          enough and is not to be repaired (HANDOFF §0.-7.A item 4); the gate
//          honours that exactly — every day before the cutover reads as it does
//          today and no past number moves.
//
//          ⚠️ tests/daylog-test.mjs PART B IS THE PROOF AND IT PASSES UNCHANGED.
//          Its documents are dated 08-17/18/19, all pre-cutover. IF THAT
//          HARNESS EVER NEEDS EDITING TO ACCOMMODATE THIS CHANGE, THE CUTOVER IS
//          WRONG — stop and re-read this note.
//
// v1.1.0 adds the Stage 2 half: sessionSignature(), sumDaySessions() and
// projectDayTotal(). v1.0.0's readWeek() is unchanged.
//
// HANDOFF.md §0.0. This module exists so that the number on a student's screen
// and the number in Jake's report are THE SAME DOCUMENT, not two documents that
// somebody has to keep reconciling.
//
// ⚠️ WHAT THIS REPLACES, AND WHY IT COULD NOT HAVE EXISTED BEFORE NOW.
//
// Until `firestore.rules` v2.5.0 the read rule on `typing_logs` was
// `canReadActivity(resource.data)` — STAFF ONLY. A student's browser could write
// its daily log and could never read it back. So the HUD had nowhere to get a
// number and kept a private second copy in `users/{uid}/stats/time_tracking`,
// accumulated separately in memory and flushed on its own schedule. Two records
// of one quantity, updated on different paths. That is the sentence behind every
// counting incident this project has had, and it was a RULES CONSTRAINT, not
// carelessness. v2.5.0 added owner-read. This module is what that unlocks.
//
// ⚠️ SEVEN getDoc() CALLS BY ID — NOT A QUERY, AND THAT IS DELIBERATE.
// The document id is `uid + '_' + date`, so a week is seven direct reads. No
// composite index, and no change to firestore.indexes.json — which matters,
// because that file EXEMPTS `uid` from indexing, so `where('uid','==',…)` is not
// available and adding it would mean re-indexing the fastest-growing collection
// in the database. Seven reads per page load against the one it used to do.
//
// ⚠️ THE WEEK IS DERIVED, NEVER STORED. `secondsWeek` used to be a counter that
// was carried, merged and repaired — and doubled, twice, in production. Here it
// is the sum of seven documents, recomputed on every load. A derived quantity
// cannot drift from its inputs, cannot be double-merged, and has no repair path
// because it has no stored value to be wrong.
//
// ⚠️ SATURDAY-ANCHORED. The school week is Sat–Fri. This must agree with
// getWeekStart() in game.js and learn.js and weekStartOf() in reports.html;
// tests/week-anchor-test.mjs and tests/daylog-test.mjs both hold that line. A
// mismatch here does not throw — it silently reads the wrong seven days.

export const DAYLOG_VERSION = "1.6.0";

// ═════════════════════════════════════════════════════════════════════════════
// THE PER-SOURCE CUTOVER
// ═════════════════════════════════════════════════════════════════════════════
//
// Days on or after this date read `seconds` PLUS both split triples. Days before
// it read legacy-first, exactly as every version up to v1.1.0 did.
//
// ⚠️ A SATURDAY, ON PURPOSE. The school week is Sat–Fri everywhere in this
// project. A cutover on any other weekday leaves one week half in the old shape
// and half in the new, and a weekly total spanning the seam becomes the one
// number nobody can explain to a parent. Cutting on a week boundary means no
// week is ever mixed. tests/daylog-cutover-test.mjs A3 holds this.
//
// ⚠️ THIS MUST BE THE SAME VALUE AS `SOURCE_SPLIT_CUTOVER` IN reports.html.
// reports.html imports nothing — it is a standalone page — so it keeps its own
// copy of this constant and of totalsOf(). Two copies of one rule is a Rule 9
// smell and it is accepted here for exactly one reason: the alternative is the
// teacher's page importing a module the student's page also imports, which the
// page cannot do. tests/daylog-test.mjs Part G lifts reports.html's copy and
// drives it against this one so the pair cannot drift silently.
//
// ⚠️ MOVING THIS DATE AFTER THE WRITERS SHIP WILL LOSE OR DOUBLE TIME. Later,
// and days between the two values read legacy-first while carrying only splits —
// they read as ZERO. Earlier, and v3.29.x days start double-counting. Set it
// once, to the deploy weekend, and leave it.
export const SOURCE_SPLIT_CUTOVER = "2026-08-22";

// Local-noon date arithmetic throughout. Never toISOString(): that is UTC, and
// an offset of a few hours shifts a date string by a whole day, which here means
// reading a document nothing was ever filed under.
function ymd(d) {
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
}

/** The Saturday that starts the Sat–Fri school week containing `dateStr`. */
export function weekStartOf(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() - ((d.getDay() + 1) % 7));
    return ymd(d);
}

/** The seven date strings of the school week containing `dateStr`, Sat first. */
export function weekDatesOf(dateStr) {
    const start = new Date(weekStartOf(dateStr) + 'T12:00:00');
    const out = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        out.push(ymd(d));
    }
    return out;
}

/** Today, as the same local YYYY-MM-DD the rest of the app files documents under. */
export function localDateStr(now = new Date()) { return ymd(now); }

// One document's three numbers, defaulted. A day with no document is a day with
// no typing, which is zero — NOT a failure, and not a reason to leave the totals
// unset.
import { ledgerFrom, planReads } from './logdays.js';

export function totalsOf(data, dateStr) {
    if (!data) return { seconds: 0, chars: 0, mistakes: 0 };

    const flat = {
        seconds:  data.seconds  || 0,
        chars:    data.chars    || 0,
        mistakes: data.mistakes || 0,
    };
    const split = {
        seconds:  (data.secondsLibrary  || 0) + (data.secondsSchool  || 0),
        chars:    (data.charsLibrary    || 0) + (data.charsSchool    || 0),
        mistakes: (data.mistakesLibrary || 0) + (data.mistakesSchool || 0),
    };

    // ⚠️ ON OR AFTER THE CUTOVER: FLAT + SPLITS. After the writers change, the
    // flat field is FROZEN — never written again — so whatever sits in it is the
    // pre-cutover remainder for that day, not a duplicate of the splits beside
    // it. On the cutover day itself a document can legitimately hold a morning's
    // flat number and an afternoon's splits, and both are real. Legacy-first
    // there would return the morning and throw the afternoon away.
    //
    // ⚠️ A MISSING dateStr DELIBERATELY TAKES THE OLD PATH. A caller that forgets
    // to pass the date must fail toward "nothing changed" rather than start
    // summing historical documents and moving numbers that are already correct.
    // String comparison is safe and intended: YYYY-MM-DD sorts lexicographically.
    if (dateStr && dateStr >= SOURCE_SPLIT_CUTOVER) {
        return {
            seconds:  flat.seconds  + split.seconds,
            chars:    flat.chars    + split.chars,
            mistakes: flat.mistakes + split.mistakes,
        };
    }

    // ⚠️ BEFORE THE CUTOVER: LEGACY-FIRST, BYTE-FOR-BYTE THE v1.1.0 BEHAVIOUR.
    // The per-source split shipped in game.js v3.29.0 and was REVERTED in
    // v3.30.0, so a handful of documents from that window carry split fields and
    // no flat number. Summing both shapes there would double-count every
    // ordinary day; reading the split ONLY when there is no flat field recovers
    // those few days and touches nothing else.
    if ('seconds' in data || 'chars' in data || 'mistakes' in data) return flat;
    return split;
}

// ═════════════════════════════════════════════════════════════════════════════
// THE WRITER SIDE OF THE CUTOVER  (v1.3.0)
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ ONE PAGE, ONE SOURCE, THREE FIELDS, AND NOTHING ELSE IT MAY WRITE. game.js
// is 'library' and learn.js is 'school', for the whole of their lives. The
// entire §3.1 fix is that each page's write names only the fields in its own
// row below, so a merge from the other page cannot mention them and therefore
// cannot replace them. A page that writes a field from the other row has
// rebuilt the defect, whatever it was trying to achieve.
export const SOURCE_FIELDS = {
    library: { seconds: 'secondsLibrary', chars: 'charsLibrary', mistakes: 'mistakesLibrary' },
    school:  { seconds: 'secondsSchool',  chars: 'charsSchool',  mistakes: 'mistakesSchool'  },
};

/**
 * What one document already holds under EACH source's own triple.
 *
 * ⚠️ DELIBERATELY NOT DATE-GATED, AND THAT IS NOT AN OVERSIGHT. totalsOf() is
 * gated because it answers "what did this child do that day", and the answer
 * has to stay bit-for-bit identical for every day already in the database.
 * This answers "what is currently stored in the field I am about to overwrite",
 * which is a fact about the document, not about the calendar. Gating it would
 * make a writer seed from zero on a day whose field is not zero, and the next
 * flush would then write that zero-based counter straight over real time.
 *
 * On a pre-cutover document every field below is absent and every number is 0,
 * which is correct: nothing has been written per-source yet.
 */
export function sourceTotalsOf(data) {
    const d = data || {};
    const of = (f) => ({
        seconds:  d[f.seconds]  || 0,
        chars:    d[f.chars]    || 0,
        mistakes: d[f.mistakes] || 0,
    });
    return { library: of(SOURCE_FIELDS.library), school: of(SOURCE_FIELDS.school) };
}

/**
 * The payload a page writes for its own source on `dateStr`, given its own
 * counters. Shared so game.js and learn.js cannot drift on either the gate or
 * the field names — the two files that have drifted on exactly this before.
 *
 * ⚠️ THE GATE IS ON THE WRITER TOO, AND IT IS THE PART THAT MAKES THE DEPLOY
 * SAFE ON ANY DAY. The readers are legacy-first before the cutover. A page that
 * started writing split fields on 2026-08-21 would file that afternoon under
 * `secondsLibrary`, where every reader in the app would ignore it — a whole
 * afternoon reading as the morning's stale flat number. Gating the writer means
 * the upload can land on a Tuesday and still change nothing until Saturday, and
 * that a machine that misses the deploy is merely OLD rather than at odds with
 * the new shape.
 *
 * ⚠️ AFTER THE CUTOVER THE FLAT TRIPLE IS FROZEN — NEVER WRITTEN AGAIN BY A
 * STUDENT PAGE. Whatever sits in it is the pre-cutover remainder for that day,
 * which is exactly the assumption totalsOf() makes when it adds flat + splits.
 * Write `seconds` from a student page after the cutover and that assumption is
 * false the moment you do it.
 *
 * `day` is the page's cross-mode counter — the number the HUD paints. `own` is
 * its per-source counter. BOTH are passed and the gate picks, so the choice of
 * counter and the choice of field can never disagree: there is one `if` in the
 * whole app that decides which shape a day is written in, and this is it.
 */
export function dayLogPayloadFor(source, dateStr, { day, own }) {
    const n = (v) => Math.max(0, Math.round(v || 0));
    if (!(dateStr >= SOURCE_SPLIT_CUTOVER)) {
        return {
            seconds:  n(day.seconds),
            chars:    n(day.chars),
            mistakes: n(day.mistakes),
        };
    }
    const f = SOURCE_FIELDS[source];
    if (!f) throw new Error('dayLogPayloadFor: unknown source ' + source);
    return {
        [f.seconds]:  n(own.seconds),
        [f.chars]:    n(own.chars),
        [f.mistakes]: n(own.mistakes),
    };
}

/**
 * Read a student's whole school week out of `typing_logs`, by document id.
 *
 * Dependencies are passed in rather than imported so this module has no opinion
 * about which Firebase build the page loaded, and so the harness can drive it
 * with a fake. Same reasoning as sessionLogInit()'s injected serverTimestamp.
 *
 * ⚠️ RETURNS `ok: false` RATHER THAN ZEROS IF ANY DAY FAILED TO READ. A partial
 * week that looks like a complete one is the exact failure this whole redesign
 * exists to end: the caller must be able to tell "this student typed nothing"
 * from "we could not find out", because painting the first when it is the second
 * shows a child a zero they did not earn.
 */
// ⚠⚠ v1.6.0 — §READS. THE PER-PAGE-LOAD MEMO, AND WHY IT IS A PROMISE.
//
// Measured 2026-08-26 on real hardware, signed in as a student: readWeek() was
// 20 of 31 reads across a full session — 65% — and a Library page load cost 5
// reads of which 5 were this function. game.html cost TEN, because it calls
// readWeek() twice per load: retroactiveSaveGuestSession() reads a week, then
// loadUserStats() reads the same week three lines later. Same uid, same date,
// same seven documents, twice.
//
// ⚠ THE PROMISE IS CACHED, NOT THE RESULT. Two callers that overlap must share
// one round trip; caching only the resolved value would let a second caller
// start its own reads while the first is still in flight, which is the exact
// case on a page that awaits them back to back.
//
// ⚠ A FAILED READ IS NEVER CACHED. `ok:false` means some day could not be read,
// and the caller's next attempt must actually retry — memoising a failure would
// pin a partial week for the life of the page. Same reasoning as the
// ok/false contract in readWeek() itself.
//
// ⚠⚠ EVERY CALLER GETS ITS OWN DEEP COPY. Handing the same object to two
// callers means one mutating `today` or `byDate` corrupts the other's view of
// the week, and the bug would look like a counting defect rather than an
// aliasing one — which is the hardest kind to trace in this file.
//
// ⚠⚠ IN MEMORY ONLY, FOR THIS PAGE LOAD. This is NOT a localStorage cache of
// closed days (see ROADMAP §READS) — it cannot outlive the page, so it can
// never serve a stale day to a later visit. The only staleness it can produce
// is within one load, and invalidateWeek() closes that: every writer of
// typing_logs MUST call it. weekly-memo-test.mjs asserts they all do.
const _weekMemo = new Map();

const _memoKey = (uid, dateStr) => String(uid) + '|' + String(dateStr);

/**
 * Drop the memo for a uid. Call after ANY write to typing_logs, before the next
 * readWeek(), or a caller later in the same page load sees pre-write numbers.
 * Cheap and safe to over-call — the cost of a needless drop is one read.
 */
export function invalidateWeek(uid) {
    const prefix = String(uid) + '|';
    for (const k of Array.from(_weekMemo.keys())) {
        if (k.startsWith(prefix)) _weekMemo.delete(k);
    }
}

/** Test seam. Not for app code. */
export function _weekMemoSize() { return _weekMemo.size; }

export async function readWeek(args) {
    const { uid, dateStr } = args;
    const key = _memoKey(uid, dateStr);
    if (_weekMemo.has(key)) return _clone(await _weekMemo.get(key));

    const p = _readWeekUncached(args);
    _weekMemo.set(key, p);
    try {
        const result = await p;
        // ⚠ See the header: a partial week must not be pinned for the page.
        if (!result || !result.ok) _weekMemo.delete(key);
        return _clone(result);
    } catch (e) {
        _weekMemo.delete(key);
        throw e;
    }
}

// structuredClone is present in every browser this app targets and in Node 17+;
// the JSON fallback is for a harness that stubs the global away. Neither path
// carries functions or Dates — a week read is plain numbers and strings.
function _clone(v) {
    if (v == null) return v;
    try { return structuredClone(v); }
    catch (_) { return JSON.parse(JSON.stringify(v)); }
}

async function _readWeekUncached({ db, doc, getDoc, uid, dateStr, ledger }) {
    const dates = weekDatesOf(dateStr);

    // ⚠️ v1.3.0 — ROADMAP ITEM 18. SEVEN READS TO FIND ONE OR TWO DAYS.
    //
    // Measured 2026-08-24 on real hardware: this function is the most expensive
    // line in the student path. One game.html load spent 14 reads here and 10 of
    // them returned nothing — 71% of the cost of the page, paid to discover
    // absence. The misses were never bad data; they are days in the same week
    // the student simply did not type.
    //
    // logdays.js records which dates a typing_log actually exists for, so the
    // days it vouches for as EMPTY are skipped instead of fetched.
    //
    // ⚠️ THE LEDGER DEFAULTS TO THIS MACHINE'S MIRROR, AND THAT IS SAFE FOR A
    // REASON WORTH SPELLING OUT. A mirror only vouches for dates from the moment
    // THAT MACHINE started recording (`since`). A student who typed on a loaner
    // laptop on Tuesday and is on their own machine today has a mirror whose
    // `since` is today — so Tuesday falls before it, is classed as unknowable,
    // and is read blind exactly as it is now. The per-machine `since` makes the
    // cross-machine case correct by construction rather than by luck.
    //
    // ⚠️ A CALLER WITH THE users/{uid} DOCUMENT IN HAND SHOULD PASS A BETTER
    // LEDGER: ledgerFrom(userData, uid) unions the server's copy in and saves
    // more. Never pass an EMPTY ledger — see ledgerFrom()'s docstring on why
    // null and empty must not be confused.
    //
    // ⚠️ TODAY IS IN `always` AND MUST STAY THERE. This function keeps today's
    // RAW document for the per-source seed, not just its folded total, and the
    // student may be about to type for the first time this session — the ledger
    // cannot know that yet. Skipping today would seed the splits from nothing.
    const plan = planReads(
        ledger === undefined ? ledgerFrom(null, uid) : ledger,
        dates,
        { always: [dateStr] }
    );
    const skipped = new Set(plan.skip);
    const byDate = {};
    let ok = true;

    let todayRaw = null;

    const results = await Promise.all(dates.map(async (date) => {
        // ⚠️ A SKIPPED DAY IS A KNOWN-EMPTY DAY, NOT A FAILED READ. It returns
        // totalsOf(null) — the same zeros a genuinely absent document produces —
        // so `ok` stays TRUE. Returning `totals: null` here instead would set
        // ok:false and suppress the HUD on every ordinary week, which is the
        // exact failure the ok/false contract exists to prevent, inverted.
        if (skipped.has(date)) return { date, totals: totalsOf(null, date) };
        try {
            const snap = await getDoc(doc(db, 'typing_logs', `${uid}_${date}`));
            const data = snap.exists() ? snap.data() : null;
            // ⚠️ TODAY'S RAW DOCUMENT IS KEPT, AND ONLY TODAY'S. The per-source
            // seed needs the fields themselves, not the folded total, and today
            // is the only day any writer touches. Holding all seven would be
            // seven documents kept alive for six days nobody will write to.
            if (date === dateStr) todayRaw = data;
            return { date, totals: totalsOf(data, date) };
        } catch (e) {
            console.warn('[daylog] read failed', date, e && e.message);
            return { date, totals: null };
        }
    }));

    const week = { seconds: 0, chars: 0, mistakes: 0 };
    for (const r of results) {
        if (!r.totals) { ok = false; byDate[r.date] = { seconds: 0, chars: 0, mistakes: 0 }; continue; }
        byDate[r.date] = r.totals;
        week.seconds  += r.totals.seconds;
        week.chars    += r.totals.chars;
        week.mistakes += r.totals.mistakes;
    }

    const today = byDate[dateStr] || { seconds: 0, chars: 0, mistakes: 0 };
    return {
        ok,
        weekStart: dates[0],
        dates,
        byDate,
        today,
        // ⚠️ v1.3.0 — each source's OWN stored triple, for the writers to seed
        // from. On a failed or missing read this is all zeroes, which is the
        // same thing a fresh day looks like; callers must gate on `ok` exactly
        // as they already do for `today`, and both callers do.
        todaySources: sourceTotalsOf(todayRaw),
        week,
    };
}

/**
 * Fold a week read into the shape `statsData` already uses on both pages, so no
 * caller has to know the field names twice.
 *
 * ⚠️ THIS IS AN ASSIGNMENT, NOT AN ACCUMULATION, AND THAT IS THE WHOLE POINT.
 * `statsData` used to be seeded from a stored counter and then added to. Here
 * the server side is simply what the seven documents say. Anything typed in this
 * tab is added on top afterwards by the caller's own tick.
 */
export function applyWeekToStats(statsData, read, dateStr) {
    statsData.secondsToday  = read.today.seconds;
    statsData.charsToday    = read.today.chars;
    statsData.mistakesToday = read.today.mistakes;

    // ⚠️ v1.3.0 — BOTH per-source triples are seeded, on BOTH pages, and each
    // page then ticks and writes ONLY its own. Seeding the other one costs
    // nothing and buys two things: the WAL's max() merge has a value to compare
    // against on either page, and mergeGuestStats() has a server figure for
    // every key it folds. A key that is folded without a server value is one
    // that gets overwritten by this browser's local number — which is the
    // failure mode this whole section exists to end.
    const src = read.todaySources || { library: {}, school: {} };
    statsData.secondsLibrary  = src.library.seconds  || 0;
    statsData.charsLibrary    = src.library.chars    || 0;
    statsData.mistakesLibrary = src.library.mistakes || 0;
    statsData.secondsSchool   = src.school.seconds   || 0;
    statsData.charsSchool     = src.school.chars     || 0;
    statsData.mistakesSchool  = src.school.mistakes  || 0;

    statsData.secondsWeek   = read.week.seconds;
    statsData.charsWeek     = read.week.chars;
    statsData.mistakesWeek  = read.week.mistakes;
    statsData.lastDate      = dateStr;
    statsData.weekStart     = read.weekStart;
    return statsData;
}


// ═════════════════════════════════════════════════════════════════════════════
// STAGE 2 — typing_logs BECOMES A PROJECTION OF typing_sessions
// ═════════════════════════════════════════════════════════════════════════════
//
// Stage 1 made the student and the teacher read ONE document. It did not make
// that document's contents derived: the write was still setDoc(merge:true) of an
// in-memory counter, so two tabs open at once were still a last-write-wins race,
// and whichever flushed second erased the other's contribution.
//
// ⚠️ THE FIX IS NOT A BIGGER LOCK, IT IS REMOVING THE OPINION. A day's total is
//
//     sessions already on the server   (shared, append-only, deduped)
//   + this device's un-uploaded queue  (sessionLogPendingSeconds)
//   + this tab's still-open unit       (typed, not yet even queued)
//
// The first term is the same for every tab, so two tabs no longer overwrite each
// other's work — each adds only its own unflushed remainder on top of a shared
// server-derived base. Anything a tab loses that way is bounded by its own open
// unit and reappears for everyone the moment that unit is logged. The projection
// is therefore SELF-HEALING: it converges on the session record, which is
// append-only and cannot be overwritten at all.
//
// ⚠️ THE DEDUPE MUST MATCH reports.html EXACTLY. Its `Reconcile vs Sessions`
// compares the graded document against these same sessions with its own
// sessionSignature(). If the two disagree about what a duplicate is, the
// reconcile tool reports a permanent non-zero Δ that no rebuild can close, and
// Jake is back to two numbers — this time with a tool insisting one of them is
// wrong. tests/daylog-test.mjs Part G lifts reports.html's function and asserts
// the two agree on the same inputs. Do not edit one without the other.

/**
 * Identify a duplicate rollup. Copied in behaviour from reports.html's function
 * of the same name — see the warning above.
 *
 * The signature is the sprint TIMESTAMPS, not the totals: two genuine sessions
 * can coincidentally share seconds and characters, but two documents whose
 * sprints carry identical ISO instants are the same recorded work written twice.
 * Falls back to the document's own timestamp for pre-v2.10.0 rollups with no
 * sprints array, and to the document id — never dedupable, but never wrongly
 * merged either.
 */
export function sessionSignature(s, id) {
    const sprints = Array.isArray(s.sprints) ? s.sprints : [];
    const stamps = sprints.map(sp => sp && sp.at).filter(Boolean);
    if (!stamps.length) {
        const t = s.timestamp && s.timestamp.toDate ? s.timestamp.toDate().getTime() : null;
        return t === null ? 'id\u0000' + id : `t\u0000${s.source || ''}\u0000${s.bookId || ''}\u0000${t}`;
    }
    return `s\u0000${s.source || ''}\u0000${s.bookId || ''}\u0000${stamps.join(',')}`;
}

/** Sum an array of {id, data} session rollups, skipping duplicates. Pure. */
export function sumDaySessions(docs) {
    const seen = new Set();
    let seconds = 0, chars = 0, mistakes = 0, dupes = 0;
    for (const d of docs) {
        const sig = sessionSignature(d.data, d.id);
        if (seen.has(sig)) { dupes++; continue; }
        seen.add(sig);
        seconds  += d.data.seconds  || 0;
        chars    += d.data.chars    || 0;
        mistakes += d.data.mistakes || 0;
    }
    return { seconds, chars, mistakes, dupes };
}

/**
 * Read one day's session rollups off the server and fold them.
 *
 * ⚠️ RETURNS ok:false ON ANY FAILURE, and the caller must then WRITE NOTHING.
 * A projection computed from a failed read is not a smaller number, it is a
 * fabricated one — and it would be written over a correct stored value. The WAL
 * keeps the local copy, so refusing costs one flush and loses nothing.
 */
export async function readDaySessions({ db, collection, query, where, getDocs, uid, dateStr }) {
    try {
        const snap = await getDocs(query(collection(db, 'typing_sessions'),
                                         where('uid', '==', uid),
                                         where('date', '==', dateStr)));
        const docs = [];
        snap.forEach(d => docs.push({ id: d.id, data: d.data() }));
        return { ok: true, ...sumDaySessions(docs), docCount: docs.length };
    } catch (e) {
        console.warn('[daylog] session read failed', dateStr, e && e.message);
        return { ok: false, seconds: 0, chars: 0, mistakes: 0, dupes: 0, docCount: 0 };
    }
}

/**
 * The whole projection, in one place, so game.js and learn.js cannot drift.
 *
 * `queued` is sessionLogPendingSeconds()-style totals for the local queue.
 * `open`   is what this tab has typed that is not even queued yet.
 *
 * ⚠️ NEGATIVE OPEN IS CLAMPED TO ZERO, NOT TRUSTED. An open remainder below zero
 * means this tab's bookkeeping disagrees with the queue — a day rolled over, a
 * record was refused by the 5-second floor and then counted anyway, something.
 * Subtracting it would remove real recorded time from a total the teacher grades
 * on. Clamping can only under-credit this tab's own unlogged tail, which the
 * next flush recovers.
 */
export function projectDayTotal(serverSessions, queued, open) {
    const clamp = (n) => Math.max(0, Math.round(n || 0));
    return {
        seconds:  clamp(serverSessions.seconds)  + clamp(queued.seconds)  + clamp(open.seconds),
        chars:    clamp(serverSessions.chars)    + clamp(queued.chars)    + clamp(open.chars),
        mistakes: clamp(serverSessions.mistakes) + clamp(queued.mistakes) + clamp(open.mistakes),
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// THE OVERNIGHT RESCUE  (v1.4.0)
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ JAKE'S RULING, 2026-08-20, VERBATIM: *"If Kid A types a bunch but loses
// connection and comes in tomorrow, I want him to be able to rescue that time.
// It wouldn't be cheating, as it would get picked up and put in the right
// place."* That last clause is the whole design. The objection this overturns —
// recorded in stats-wal.js's guest accumulator header — is that yesterday's
// minutes must not be **silently credited to today**, because a teacher's daily
// report has to mean what it says. That objection was correct and it is still
// correct. It assumed the only available destination was today's counter.
//
// It is not, and has not been since Round 23 gave a guest's sprints a dated,
// sourced, 21-day-durable queue. `typing_logs` is keyed `{uid}_{date}`, so the
// right day is addressable. The seconds go to the day they happened on.
//
// ⚠️ THIS CANNOT INFLATE A GRADE, AND THAT IS STRUCTURAL RATHER THAN CAREFUL:
//   * the input is CLOSED SPRINTS ONLY, so it can only ever be less than what
//     the child actually typed — the open tail is not in the queue;
//   * the records leave the guest slot via sessionLogTake(), which is atomic, so
//     a second sign-in on the same browser finds nothing to carry;
//   * a guest's time has never reached `typing_logs` under any uid, so there is
//     nothing here to double.
// The failure direction is UNDER-crediting a child. That is the one to have.
//
// ⚠️ PRE-CUTOVER DAYS ARE REFUSED, ON PURPOSE, AND IT IS NOT A LIMITATION —
// IT IS THE §3.1 GUARD. Before SOURCE_SPLIT_CUTOVER a day's time lives in the
// SHARED flat `seconds` triple. Adding to it means read-modify-write on a field
// the other page also writes, which is §3.1 with an addition in front of it —
// the exact defect Round 22 spent itself closing. After the cutover the target
// is this page's own per-source field, which no other writer may name, so the
// add is safe by construction. The practical effect is that the rescue switches
// itself on with the cutover and never runs against the shape it would corrupt.
// ⚠️ DO NOT "FIX" THIS BY ADDING TO THE FLAT TRIPLE. Read §3.1 first.

/**
 * Group a taken guest queue into per-day, per-source carry-over work.
 *
 * Returns [{ date, source, seconds, chars, mistakes, records }], excluding
 * today (which the live merge already handles) and excluding any day the rescue
 * may not safely touch. Pure — no clock, no storage, no Firestore.
 *
 * `todayStr` is the caller's local date, for the same reason every other date
 * in this project is: this module does not get to decide what day it is.
 */
export function carryOverPlan(records, todayStr) {
    if (!Array.isArray(records) || !todayStr) return [];
    const groups = new Map();
    for (const r of records) {
        if (!r) continue;
        const date = typeof r.date === 'string' && r.date.length === 10 ? r.date : '';
        if (!date) continue;                       // undated: nowhere to put it
        if (date >= todayStr) continue;            // today, or a clock in the future
        if (!(date >= SOURCE_SPLIT_CUTOVER)) continue;   // see the header above
        const source = r.source === 'school' ? 'school'
                     : r.source === 'library' ? 'library' : '';
        if (!source) continue;                     // unsourced: no field to name
        const key = date + '\u0000' + source;
        if (!groups.has(key)) {
            groups.set(key, { date, source, seconds: 0, chars: 0, mistakes: 0, records: [] });
        }
        const g = groups.get(key);
        g.seconds  += Math.max(0, Math.round(r.seconds  || 0));
        g.chars    += Math.max(0, Math.round(r.chars    || 0));
        g.mistakes += Math.max(0, Math.round(r.mistakes || 0));
        g.records.push(r);
    }
    // Oldest first, so a partial failure leaves the most recent day for the
    // retry rather than the other way round.
    return Array.from(groups.values())
        .filter(g => g.seconds > 0 || g.chars > 0)
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * The payload that credits one prior day's rescued time to its own document.
 *
 * `stored` is what that document ALREADY holds for this source — read it with
 * sourceTotalsOf() immediately before calling this. The result is an absolute
 * value for this page's own three fields, so it merges the same way every other
 * write in this app does.
 *
 * ⚠️ IT THROWS ON A PRE-CUTOVER DATE RATHER THAN FALLING BACK TO THE FLAT
 * TRIPLE. carryOverPlan() has already filtered those out; a caller that reaches
 * here with one has bypassed the plan, and the quiet fallback would be the §3.1
 * revival the header refuses. Fail loudly at the boundary instead.
 */
export function carryOverPayloadFor(source, dateStr, { stored, add }) {
    if (!(dateStr >= SOURCE_SPLIT_CUTOVER)) {
        throw new Error('carryOverPayloadFor: refusing a pre-cutover date ' + dateStr);
    }
    const f = SOURCE_FIELDS[source];
    if (!f) throw new Error('carryOverPayloadFor: unknown source ' + source);
    const n = (v) => Math.max(0, Math.round(v || 0));
    const s = stored || {}, a = add || {};
    return {
        [f.seconds]:  n(s.seconds)  + n(a.seconds),
        [f.chars]:    n(s.chars)    + n(a.chars),
        [f.mistakes]: n(s.mistakes) + n(a.mistakes),
    };
}
