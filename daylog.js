// daylog.js v1.0.0 — THE STUDENT READS THE GRADED DOCUMENT.
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

export const DAYLOG_VERSION = "1.0.0";

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
function totalsOf(data) {
    if (!data) return { seconds: 0, chars: 0, mistakes: 0 };
    // ⚠️ LEGACY-FIRST, mirroring reports.html's readLogTotals(). The per-source
    // split (secondsLibrary/secondsSchool) was deployed and then REVERTED in
    // game.js v3.30.0 / learn.js v2.15.0, so a handful of documents written
    // during that window carry split fields and no flat number. Summing both
    // shapes would double-count every normal day; reading the split ONLY when
    // there is no flat field recovers those few days and nothing else.
    if ('seconds' in data || 'chars' in data || 'mistakes' in data) {
        return {
            seconds:  data.seconds  || 0,
            chars:    data.chars    || 0,
            mistakes: data.mistakes || 0,
        };
    }
    return {
        seconds:  (data.secondsLibrary  || 0) + (data.secondsSchool  || 0),
        chars:    (data.charsLibrary    || 0) + (data.charsSchool    || 0),
        mistakes: (data.mistakesLibrary || 0) + (data.mistakesSchool || 0),
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
export async function readWeek({ db, doc, getDoc, uid, dateStr }) {
    const dates = weekDatesOf(dateStr);
    const byDate = {};
    let ok = true;

    const results = await Promise.all(dates.map(async (date) => {
        try {
            const snap = await getDoc(doc(db, 'typing_logs', `${uid}_${date}`));
            return { date, totals: totalsOf(snap.exists() ? snap.data() : null) };
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
