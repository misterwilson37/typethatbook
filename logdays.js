// logdays.js v1.0.0 — WHICH DAYS DID THIS STUDENT TYPE?
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

export const LOGDAYS_VERSION = "1.0.0";

// ⚠️ FIELD NAME IS PREFIXED. `users` documents are shared with staff-admin.js,
// the roster importer and the reports roster query; an unprefixed `logDays`
// is the kind of name a future feature collides with by accident.
export const LOGDAYS_FIELD  = 'ttbLogDays';
export const LOGDAYS_SINCE  = 'ttbLogDaysSince';

const LOCAL_KEY = 'ttb_logDays_v1';

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
    while (days.length > MAX_DAYS) days.shift();

    // Local mirror first: it cannot fail in a way that matters and it makes the
    // once-per-load guard meaningful even if the network is down.
    writeLocal(uid, days, days[0] < since ? days[0] : since);
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

    if (userData && Array.isArray(userData[LOGDAYS_FIELD])) {
        for (const d of userData[LOGDAYS_FIELD]) if (typeof d === 'string') days.add(d);
        if (typeof userData[LOGDAYS_SINCE] === 'string') since = userData[LOGDAYS_SINCE];
    }

    const local = uid ? readLocal(uid) : null;
    if (local) {
        for (const d of local.days) days.add(d);
        // ⚠️ THE EARLIER `since` WINS, AND THAT IS THE CONSERVATIVE CHOICE:
        // an earlier `since` means MORE dates get read blind, not fewer.
        if (local.since && (!since || local.since < since)) since = local.since;
    }

    if (!since || days.size === 0) {
        // A `since` with no days is legitimate (a student who has not typed since
        // the ledger began) — but only if it came from the server, where absence
        // is meaningful. With neither, we know nothing.
        if (!since) return null;
    }
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

/** For diagnostics from the console. */
export function ledgerLocal(uid) { return readLocal(uid); }
