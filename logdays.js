// logdays.js v1.5.0 — WHICH DAYS DID THIS STUDENT TYPE?
//
// v1.5.0 — ⚠⚠ THE MAX_DAYS TRIM DROPPED EVIDENCE AND LEFT `since` BEHIND, so
//          past 400 recorded days the trimmed-away dates became "known absent"
//          and were skipped — ROADMAP 50's exact shape, arriving on its own.
//          Latent at today's volumes; found while looking for 50 and fixed
//          rather than left as a note, because the note would have outlived
//          everyone who understood it.
//          ⚠ `since` MOVES FORWARD HERE AND THAT OBEYS THE RULE RATHER THAN
//          BREAKING IT: the rule forbids reclassifying a KNOWN day into a skip.
//          A forward move makes the era below it UNKNOWN, so it is read blind —
//          it costs reads, never minutes.
//
// v1.4.0 — ⚠️⚠️ ROADMAP 50: reconcilePlan()/reconcile(). THE MIRROR MAY NOT
//          KNOW LESS THAN THE SERVER. Every readWeek() caller passes NO ledger,
//          so the reader trusts THIS BROWSER'S mirror alone and the server's
//          ttbLogDays — written by the same noteDay(), never pruned — is not
//          consulted. A mirror missing a day the server vouches for turns a day
//          the child typed into a skipped read and a zero.
//          ⚠️ NOT A GUESS AT THE ROOT CAUSE, which was never found. Whatever
//          corrupts a mirror entry, the effect and the cure are the same.
//          ⚠️⚠️ IT CANNOT CAUSE AN UNDERCOUNT: it only ADDS days and only moves
//          `since` BACKWARD. An extra day costs one wasted read; a missing one
//          costs a child their week. Every change here must keep that
//          direction — logdays-test.mjs H3 fails if `since` can move forward.
//          ⚠️ CALL IT WHERE THE USER DOCUMENT IS ALREADY IN HAND (learn.js
//          loadGateState) so it costs NO extra read. Its console.warn is the
//          ONLY instrument there is: students have no devtools and cannot clear
//          site data, so a fault in their browser is otherwise invisible.
//
// v1.3.0 — ⚠️⚠️ ROADMAP 50: LOCAL_KEY bumped _v1 → _v2, alongside hud.js
//          v2.1.0 and daylog.js v1.8.0. NO FAULT WAS FOUND IN THIS FILE; it is
//          bumped because the fault is known to be per-browser and NOT pinned to
//          one store. ⚠️ ITEM 18's READ SAVING IS SUSPENDED for roughly a week
//          per student while `since` catches up, and that is accepted: a child
//          shown fewer minutes than they typed outranks a read budget.
//          ⚠️ A LATENT BUG FOUND WHILE LOOKING AND DELIBERATELY NOT FIXED HERE:
//          noteDay()'s `while (days.length > MAX_DAYS) days.shift()` drops the
//          oldest dates WITHOUT moving `since` forward, so past 400 recorded
//          days those dates become "known absent" and get skipped. Harmless at
//          today's volumes, wrong later. ROADMAP 50 §C2.
//
// v1.2.0 — ⚠️ ledgerFrom() READ `since` INSIDE THE DAY-ARRAY BRANCH, so a
//          document with a since and no days returned null and was swept in
//          full. That is exactly the document v1.1.0's ensureSince() creates,
//          which would have made the seeding pointless. Caught by a harness case
//          written for ensureSince, not by one written for ledgerFrom.
//
// v1.1.0 — ensureSince(). noteDay() only fires on a typing flush, so a student
//          who signs in and does nothing never gets a ledger and is swept in
//          full, forever. Seeding `since` from the page controllers gives every
//          signed-in student a ledger on their first load. ⚠️ IT NEEDS THE USER
//          DOCUMENT THE CALLER ALREADY HAS — writing `since` blind could replace
//          an earlier value with a later one, which is the one direction this
//          module must never move.
//
// ⚠️ THE PROBLEM THIS EXISTS TO END: every read path in TTB discovers a
// student's activity by GUESSING AT DOCUMENT IDS AND SEEING WHAT COMES BACK.
// readWeek() asks for seven `typing_logs/{uid}_{date}` documents to find the one
// or two that exist. reports.html asks for (students × days) of them. Firestore
// bills a get() on a document that does not exist, so both are paying full price
// for absence.
//
// Measured on real hardware, 2026-08-24, one student, one day:
//     361 reads · 88 misses      — 24% OF EVERY READ FOUND NOTHING
//     one game.html load:        14 reads, 11 misses, all from daylog.js:312
//     one report:              1,155 reads for 6 real records
//
// This module keeps a LEDGER of the dates a student actually has a typing_log
// for, so a reader can ask for those and skip the rest.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ THE LEDGER IS A SUPERSET, AND THE WRITE ORDER IS WHAT MAKES IT ONE
// ═══════════════════════════════════════════════════════════════════════════
//
// noteDay() is called BEFORE the typing_logs write, never after. That ordering
// is the entire safety argument and it is not negotiable:
//
//   * A ledger entry with NO LOG behind it costs ONE WASTED READ. That is
//     exactly what the code does today, on every day, for every student. It is
//     the current behaviour and it is harmless.
//   * A LOG WITH NO LEDGER ENTRY costs a child a number they earned. A reader
//     that trusts the ledger would skip that day, and the week total on their
//     screen would come up short.
//
// So: if the ledger write succeeds and the log write then fails, we are fine.
// If we wrote the log first and the ledger write failed, we would not be. Write
// the cheap safe one first and let it be wrong in the safe direction.
//
// ⚠️ COROLLARY — NOBODY MAY "TIDY UP" THE LEDGER. There is no pruning pass, no
// reconciliation, no "this day has no log, remove it". A stale entry is a
// wasted read; a removed entry is a wrong number on a child's screen.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ `since` IS WHY A HALF-MIGRATED DATABASE IS SAFE
// ═══════════════════════════════════════════════════════════════════════════
//
// Every log written before this module shipped has no ledger entry, and never
// will. So the ledger records the FIRST DATE IT WAS EVER AUTHORITATIVE FOR, and
// readers get told, per date, which of two worlds they are in:
//
//     date <  since   →  WE DO NOT KNOW. Read it blind, exactly as today.
//     date >= since   →  the ledger is complete. Absent means absent. Skip it.
//
// A reader therefore degrades to current behaviour for old dates and gets the
// saving for new ones, with no flag day, no backfill, and no window in which
// anything reads short. As the school year moves forward, `since` recedes and
// the saving becomes total on its own.
//
// ⚠️ `since` ONLY EVER MOVES BACKWARD (toward earlier dates), never forward.
// Moving it forward would silently reclassify days we DO know about into "read
// blind", which is merely slow — but it would also mean a machine that saw a
// later `since` could overwrite an earlier, better one. Keep the min.
//
// ═══════════════════════════════════════════════════════════════════════════
// TWO COPIES, ON PURPOSE
// ═══════════════════════════════════════════════════════════════════════════
//
//   users/{uid}.ttbLogDays      the SERVER ledger. Complete across every machine
//                               the student has ever used. reports.html reads it
//                               FOR FREE — readRosterUids() already fetches the
//                               whole user document.
//   localStorage                a per-machine mirror, for readers that have not
//                               got the user document in hand.
//
// ⚠️ THE SERVER COPY IS THE AUTHORITY AND THE LOCAL ONE IS AN OPTIMISATION.
// A student who types on a loaner laptop writes the server ledger from there;
// their own machine's local mirror will not have that day. Any reader that can
// see the user document must prefer it, and any reader that cannot must union
// the two rather than trusting the local one alone.

export const LOGDAYS_VERSION = "1.5.0";

// ⚠️ FIELD NAME IS PREFIXED. `users` documents are shared with staff-admin.js,
// the roster importer and the reports roster query; an unprefixed `logDays`
// is the kind of name a future feature collides with by accident.
export const LOGDAYS_FIELD  = 'ttbLogDays';
export const LOGDAYS_SINCE  = 'ttbLogDaysSince';

// ⚠️⚠️ BUMPED TO _v2 BY ROUND 58 — ROADMAP 50, the same one-shot repair as
// hud.js's HUD_CACHE_KEY. Renaming orphans every mirror, so ledgerFrom() returns
// null, planReads() reports blind, and the week is read in full from Firestore
// once per machine.
// ⚠️ THIS COSTS READS AND THAT IS ACCEPTED: item 18's saving is suspended for
// roughly a week per student (until `since` falls behind the week being read),
// because a child shown fewer minutes than they typed outranks a read budget.
// ⚠️ NO FAULT WAS FOUND IN THIS FILE. It is bumped because the fault is known to
// be per-browser and NOT known to be in one particular store — see ROADMAP 50 §C2.
const LOCAL_KEY = 'ttb_logDays_v2';

// ⚠️ CAP. One entry per school day is ~180/year at 10 bytes each — trivial
// against the 1MB document limit, but a runaway writer is not, and an unbounded
// array on a hot document is how a 1MB ceiling gets found during a lesson. At
// 400 entries the oldest are dropped, and dropping them is SAFE: a date that
// falls off the front is older than `since` from that moment on, so readers go
// back to reading it blind rather than skipping it.
const MAX_DAYS = 400;

// Per page load. Stops a ledger write on every flush — the log document is
// written many times a session, the ledger needs writing once per new date.
const stampedThisLoad = new Set();

function todayKey(uid, date) { return uid + '|' + date; }

// ─── Local mirror ─────────────────────────────────────────────────────────────

function readLocal(uid) {
    try {
        const raw = localStorage.getItem(LOCAL_KEY);
        if (!raw) return null;
        const c = JSON.parse(raw);
        if (!c || c.uid !== uid || !Array.isArray(c.days)) return null;
        return { days: c.days, since: c.since || null };
    } catch (_) { return null; }
}

function writeLocal(uid, days, since) {
    try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify({ uid, days, since }));
    } catch (_) { /* quota — the server copy is the authority anyway */ }
}

// ─── Recording ────────────────────────────────────────────────────────────────

/**
 * Record that `date` has (or is about to have) a typing_log for `uid`.
 *
 * ⚠️ CALL THIS BEFORE THE typing_logs WRITE, NOT AFTER. See the header. The
 * ledger must be a superset of the logs, and ordering is what guarantees it.
 *
 * ⚠️ AWAIT IT, BUT NEVER LET IT BLOCK THE LOG. It resolves to true/false and
 * throws nothing: a ledger that could not be written is a wasted read later,
 * which is the behaviour that exists today. The log write must proceed either
 * way — a student's minutes are not contingent on a bookkeeping field.
 *
 * @param {object}   io          { db, doc, updateDoc, setDoc, arrayUnion }
 * @param {string}   io.uid
 * @param {string}   io.date     'YYYY-MM-DD', the student's LOCAL date — the
 *                               same string used to build the document id.
 */
export async function noteDay({ db, doc, updateDoc, setDoc, arrayUnion, uid, date }) {
    if (!uid || !date) return false;

    const key = todayKey(uid, date);
    if (stampedThisLoad.has(key)) return true;

    const local = readLocal(uid);
    // ⚠️ FIRST EVER CALL ON THIS MACHINE ESTABLISHES `since` AS TODAY, and today
    // is the earliest date this machine can vouch for. If a ledger already
    // exists, keep the older value — see the header on why it only moves back.
    const since = local && local.since ? (local.since < date ? local.since : date) : date;

    const days = local ? local.days.slice() : [];
    if (!days.includes(date)) days.push(date);
    days.sort();
    // ⚠️⚠️ THE TRIM DESTROYS EVIDENCE, SO `since` MUST FOLLOW IT FORWARD.
    // v1.5.0. `since` means "I have been watching from here", and every date at
    // or after it that is NOT in `days` is reported to planReads() as KNOWN
    // ABSENT and skipped. Dropping the oldest dates while leaving `since` where
    // it was therefore turns days this student DID type into skipped reads and
    // zeros — the exact shape of ROADMAP 50, arriving on its own after 400
    // recorded days.
    //
    // ⚠️ THIS IS THE ONE PLACE `since` MAY MOVE FORWARD, AND THE MODULE'S RULE
    // THAT IT ONLY MOVES BACK IS NOT BEING BROKEN — IT IS BEING OBEYED. The rule
    // exists because a forward move must never reclassify a KNOWN day into a
    // skip. Here the opposite happens: the era below the new `since` becomes
    // UNKNOWN, so planReads() reads it blind. It costs reads. It cannot cost a
    // child their minutes, which is the only asymmetry this module cares about.
    // logdays-test.mjs H7 fails if a trim ever leaves `since` behind.
    const trimmed = days.length > MAX_DAYS;
    while (days.length > MAX_DAYS) days.shift();

    // Local mirror first: it cannot fail in a way that matters and it makes the
    // once-per-load guard meaningful even if the network is down.
    const mirrorSince = trimmed ? days[0]
                                : (days[0] < since ? days[0] : since);
    writeLocal(uid, days, mirrorSince);
    stampedThisLoad.add(key);

    try {
        // ⚠️ arrayUnion, NOT a read-modify-write. Two tabs, or the Library and
        // School pages open at once, must not be able to clobber each other's
        // day. arrayUnion is applied server-side and is idempotent, which is why
        // this needs no transaction and no prior read.
        await updateDoc(doc(db, 'users', uid), {
            [LOGDAYS_FIELD]: arrayUnion(date),
            [LOGDAYS_SINCE]: since,
        });
        return true;
    } catch (e) {
        // ⚠️ updateDoc FAILS IF THE DOCUMENT DOES NOT EXIST. A student whose
        // users/{uid} has not been created yet is a real case (first sign-in
        // races the profile writer), so fall back to a merge-create. Anything
        // else — rules, network — is swallowed: see the docstring.
        try {
            await setDoc(doc(db, 'users', uid), {
                [LOGDAYS_FIELD]: arrayUnion(date),
                [LOGDAYS_SINCE]: since,
            }, { merge: true });
            return true;
        } catch (e2) {
            console.warn('[logdays] ledger write failed (harmless, costs a read later):',
                         e2 && e2.message);
            // ⚠️ UNSTAMP. The next flush should try again rather than assume
            // this load already recorded the day.
            stampedThisLoad.delete(key);
            return false;
        }
    }
}

// ─── Reading ──────────────────────────────────────────────────────────────────

/**
 * Build a ledger view from a `users/{uid}` document's data, optionally unioned
 * with this machine's local mirror.
 *
 * ⚠️ RETURNS null IF THERE IS NO LEDGER AT ALL. null means "I know nothing",
 * and every caller MUST treat that as "read everything blind, as before".
 * Returning an empty ledger instead would read as "this student typed on no
 * days", which is the undercount this module must never cause.
 */
export function ledgerFrom(userData, uid) {
    const days = new Set();
    let since = null;

    // ⚠️ `since` IS READ INDEPENDENTLY OF THE DAY ARRAY, AND v1.0.0 GOT THIS
    // WRONG. It read `since` INSIDE the Array.isArray() branch, so a document
    // with a `since` and no day array returned null — "I know nothing" — and was
    // swept in full. That is precisely the document ensureSince() creates for a
    // student who has signed in and never typed, which is the case the whole
    // seeding mechanism exists to make skippable. The two fields answer
    // different questions and must be read separately:
    //     since  — "from when have I been watching?"
    //     days   — "and what did I see?"
    // An empty answer to the second is a real answer, not a missing one.
    if (userData) {
        if (Array.isArray(userData[LOGDAYS_FIELD])) {
            for (const d of userData[LOGDAYS_FIELD]) if (typeof d === 'string') days.add(d);
        }
        if (typeof userData[LOGDAYS_SINCE] === 'string' && userData[LOGDAYS_SINCE]) {
            since = userData[LOGDAYS_SINCE];
        }
    }

    const local = uid ? readLocal(uid) : null;
    if (local) {
        for (const d of local.days) days.add(d);
        // ⚠️ THE EARLIER `since` WINS, AND THAT IS THE CONSERVATIVE CHOICE:
        // an earlier `since` means MORE dates get read blind, not fewer.
        if (local.since && (!since || local.since < since)) since = local.since;
    }

    // ⚠️ NO `since` MEANS NO LEDGER, and that is the ONLY null case. A ledger
    // with a since and zero days is the meaningful claim "watched since X, saw
    // nothing after it" — returning null for that would sweep the very students
    // this is meant to skip. See logdays-test.mjs E7.
    if (!since) return null;
    return { days, since };
}

/**
 * Split candidate dates into the ones a reader must actually fetch and the ones
 * it can skip.
 *
 * @returns {{ fetch: string[], skip: string[], blind: boolean }}
 *          `blind: true` means no usable ledger — fetch is the full input and
 *          the caller has today's behaviour, unchanged.
 */
export function planReads(ledger, dates, opts) {
    const always = (opts && opts.always) || [];
    if (!ledger) return { fetch: dates.slice(), skip: [], blind: true };

    const fetch = [], skip = [];
    for (const d of dates) {
        // ⚠️ `always` EXISTS FOR TODAY. daylog.js keeps today's RAW document for
        // the per-source seed, not just its folded total, so today is fetched
        // whether or not the ledger has heard of it — the student may be about
        // to type for the first time this session.
        if (always.includes(d))      { fetch.push(d); continue; }
        if (d < ledger.since)        { fetch.push(d); continue; }   // unknown era
        if (ledger.days.has(d))      { fetch.push(d); continue; }   // known to exist
        skip.push(d);                                               // known absent
    }
    return { fetch, skip, blind: false };
}

/**
 * Make sure this student's user document has a `since`, even if they have never
 * typed a word.
 *
 * ⚠️ THIS IS THE DIFFERENCE BETWEEN A LEDGER THAT HELPS AND ONE THAT DOES NOT,
 * AND IT IS NOT OBVIOUS. noteDay() only fires on a typing flush, so it never
 * reaches a student who signed in and did nothing. Those students have NO
 * ledger, ledgerFrom() correctly returns null, and reports.html correctly sweeps
 * every day of the range for them — forever, because they never type and so
 * never get a ledger.
 *
 * Measured 2026-08-24: a three-day report swept 501 student-days for 104 real
 * records. The roster was 167 user documents; roughly 66 of them belonged to
 * accounts with no typing at all, and every one was swept in full.
 *
 * A `since` with an EMPTY day list is the meaningful statement "I have been
 * watching this student since date X and they have typed on no days after it".
 * That is what lets a reader skip them.
 *
 * ⚠️ ONE WRITE PER STUDENT, EVER — NOT PER DAY. `since` is set once and then
 * only ever moves backward. The caller already holds the user document (it was
 * read to decide something else), so this costs NO extra read either, and it
 * does nothing at all when the field is already there.
 *
 * ⚠️ PASS THE DOCUMENT DATA YOU ALREADY HAVE. Calling this without `userData`
 * would mean writing `since` blind, which could overwrite an EARLIER value with
 * a later one — and a later `since` silently reclassifies days we do know about
 * into "skip", which is the one direction this module must never move.
 */
export async function ensureSince({ db, doc, setDoc, uid, date, userData }) {
    if (!uid || !date || !userData) return false;
    // Already vouched for — nothing to do, and nothing to write.
    if (typeof userData[LOGDAYS_SINCE] === 'string' && userData[LOGDAYS_SINCE]) return false;

    const key = 'since|' + uid;
    if (stampedThisLoad.has(key)) return false;
    stampedThisLoad.add(key);

    try {
        await setDoc(doc(db, 'users', uid), { [LOGDAYS_SINCE]: date }, { merge: true });
        const local = readLocal(uid);
        writeLocal(uid, local ? local.days : [],
                   local && local.since && local.since < date ? local.since : date);
        return true;
    } catch (e) {
        stampedThisLoad.delete(key);
        console.warn('[logdays] since not seeded (harmless, costs reads later):', e && e.message);
        return false;
    }
}

/** For diagnostics from the console. */
export function ledgerLocal(uid) { return readLocal(uid); }

// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THE RECONCILER (v1.4.0) — THE MIRROR MAY NOT KNOW LESS THAN THE SERVER
// ═════════════════════════════════════════════════════════════════════════════
//
// ROADMAP 50. A student whose daily rows totalled 26m 15s had a weekly HUD
// reading exactly today's figure, on two machines, while reports.html totalled
// the same documents correctly. Proven per-browser: the same student read
// correctly in a fresh browser, because empty storage makes planReads() go blind
// and fetch all seven days.
//
// ⚠️ THE ROOT CAUSE WAS NEVER FOUND, AND THIS IS NOT A GUESS AT IT. It is the
// structural repair daylog.js has asked for in its own comments since item 18:
// every readWeek() caller passes NO ledger, so the reader trusts THIS MACHINE'S
// MIRROR ALONE. The server's ttbLogDays — written by the same noteDay() that
// writes the mirror, and never pruned — is simply not consulted.
//
// So whatever corrupts, truncates or loses a mirror entry, the effect is the
// same and so is the cure: a day the SERVER vouches for must never be a day the
// mirror calls absent, because "absent" is what planReads() turns into "skip",
// and a skip is what turns a child's minutes into zero.
//
// ⚠️⚠️ IT CANNOT CAUSE AN UNDERCOUNT, AND THAT IS THE WHOLE SAFETY ARGUMENT.
// It only ever ADDS days and only ever moves `since` BACKWARD. An extra day
// costs one wasted read; a missing day costs a child their week. The asymmetry
// is the entire reason this module exists, and every change here must preserve
// its direction.
//
// ⚠️ PURE. Takes the two records and returns the merged one — no storage, no
// Firestore, no clock. reconcile() below is the only part that touches
// localStorage, and it is four lines. logdays-test.mjs drives THIS function.

/**
 * Merge a server ledger into a local mirror.
 *
 * @param local     this machine's mirror, or null
 * @param userData  the users/{uid} document data, or null
 * @returns { days, since, added, moved } — `added` lists days the server knew
 *          about and the mirror did not, which is the fault condition; `moved`
 *          is true when `since` moved backward. Both null-safe.
 */
export function reconcilePlan(local, userData) {
    const serverDays = (userData && Array.isArray(userData[LOGDAYS_FIELD]))
        ? userData[LOGDAYS_FIELD].filter(d => typeof d === 'string') : [];
    const serverSince = (userData && typeof userData[LOGDAYS_SINCE] === 'string'
                         && userData[LOGDAYS_SINCE]) ? userData[LOGDAYS_SINCE] : null;

    // ⚠️ NO LOCAL MIRROR IS NOT A FAULT. ledgerFrom() already returns null for
    // it and the reader goes blind, which is correct and costs only reads.
    // Seeding one here would be a behaviour change smuggled in beside a repair.
    if (!local) return { days: null, since: null, added: [], moved: false };

    const days = new Set(local.days || []);
    // ⚠️ ONLY DAYS THE MIRROR CLAIMS TO COVER COUNT AS MISSING. A day before the
    // mirror's `since` is one it never claimed to have seen — planReads() reads
    // those blind already, so they are not the fault and must not be reported as
    // one. Reporting them would make every student who ever used a second
    // machine look broken.
    const added = serverDays
        .filter(d => !days.has(d) && (!local.since || d >= local.since))
        .sort();
    for (const d of added) days.add(d);

    let since = local.since || null;
    let moved = false;
    if (serverSince && (!since || serverSince < since)) { since = serverSince; moved = true; }

    return { days: [...days].sort(), since, added, moved };
}

/**
 * Apply reconcilePlan() to this machine's mirror. Returns the days that were
 * missing, so a caller can report them.
 *
 * ⚠️ CALL IT WHERE THE USER DOCUMENT IS ALREADY IN HAND — it must cost NO extra
 * read, or it is a read tax on every student to catch a fault most never have.
 */
export function reconcile(uid, userData) {
    if (!uid) return [];
    const local = readLocal(uid);
    const plan = reconcilePlan(local, userData);
    if (!plan.days) return [];
    if (plan.added.length || plan.moved) {
        writeLocal(uid, plan.days, plan.since);
        if (plan.added.length) {
            // ⚠️ THE ONLY INSTRUMENT THERE IS. Students have no devtools and
            // cannot clear site data, so a fault in their browser is invisible
            // unless a child mentions it. This line is what makes ROADMAP 50
            // detectable at all if it recurs.
            console.warn('[logdays] mirror was missing ' + plan.added.length +
                         ' day(s) the server vouches for — healed: ' +
                         plan.added.join(', ') + ' (ROADMAP 50)');
        }
    }
    return plan.added;
}
