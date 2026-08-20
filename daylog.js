// daylog.js v1.2.0 — THE STUDENT READS THE GRADED DOCUMENT, AND THE GRADED
//                     DOCUMENT IS A PROJECTION OF THE SESSION RECORD.
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

export const DAYLOG_VERSION = "1.2.0";

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
export async function readWeek({ db, doc, getDoc, uid, dateStr }) {
    const dates = weekDatesOf(dateStr);
    const byDate = {};
    let ok = true;

    const results = await Promise.all(dates.map(async (date) => {
        try {
            const snap = await getDoc(doc(db, 'typing_logs', `${uid}_${date}`));
            return { date, totals: totalsOf(snap.exists() ? snap.data() : null, date) };
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
