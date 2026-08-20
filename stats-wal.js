// stats-wal.js v1.1.0 — the day/week counters' write-ahead log, shared by
// game.js and learn.js.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS FILE EXISTS — THE BUG IT WAS EXTRACTED TO FIX
// ═══════════════════════════════════════════════════════════════════════════
//
// game.js kept ONE write-ahead log, `ttb_wal_v2`, holding reading position AND
// the day/week time counters in a single record. `walSave()` overwrote that one
// slot on every visibilitychange. `walRecover()` read it back — and bailed on
// the second line:
//
//     if (wal.bookId !== currentBookId) return false;   // different book
//
// That guard is CORRECT for a reading position and WRONG for a clock, and the
// two were in the same record. So:
//
//   1. A student types eight minutes in Dracula and closes the tab. Firestore
//      holds whatever the last flush caught — the interval is five minutes and
//      the on-hide flush is rate-limited to once a minute, so up to five
//      minutes exists only in the WAL.
//   2. Next period they open Treasure Island. walRecover() declines the WAL
//      because the book does not match, and leaves it in place. Correct so far.
//   3. The first visibilitychange in the new book calls walSave(), which
//      overwrites the single slot.
//
// The Dracula minutes are gone, permanently, and nothing anywhere reports it.
// ⚠️ THE DEFECT IS NOT THE GUARD. IT IS THAT TWO VALUES WITH DIFFERENT SCOPES
// WERE STORED UNDER ONE KEY. A book-scoped record cannot also carry the thing
// that is true regardless of book.
//
// It compounded across pages: learn.js used a separate key (`ttb_learnwal_v1`),
// so School and Library never clobbered each other — and never replayed each
// other either. Type in School, close the tab, spend the rest of the day in
// books, and those minutes did not land until the student happened to reopen
// learn.html.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY IT IS A MODULE AND NOT A COPY IN EACH FILE
// ═══════════════════════════════════════════════════════════════════════════
//
// Because Round 9 §4 is the standing warning: when two subsystems implement the
// same thing, the duplication is the visible defect and the DIVERGENCE in what
// they do is the expensive one. game.js and learn.js already carried two copies
// of a WAL that agreed on the shape of the record and disagreed about who owned
// it, which is how the bug above survived. A second pair of hand-maintained
// copies would have been the same trap with a fresh coat.
//
// game.js and learn.js share no code today except `firebase-config.js`. This is
// the second shared module, and it is deliberately tiny, side-effect-free and
// DOM-free, so importing it cannot boot anything.
//
// ═══════════════════════════════════════════════════════════════════════════
// SEMANTICS
// ═══════════════════════════════════════════════════════════════════════════
//
//   * max(), not sum(). Within one day and one week these counters only ever
//     rise, so the larger of two values is the later one. This is the merge
//     both pages already used on recovery; it is now also the merge used on
//     WRITE, which is what lets two pages share one key without either of them
//     stepping on the other.
//
//   * ⚠️ max() IS NOT CORRECT FOR TWO TABS TYPING AT ONCE, and nothing here
//     pretends otherwise. Two live tabs each hold their own in-memory
//     statsData, each equal to a common base plus their own work; max() keeps
//     the larger rather than the sum. That limitation is pre-existing and
//     app-wide — flushAll() writes statsData to Firestore as ABSOLUTE values,
//     so the last writer already won — and fixing it needs server-side
//     increments, not a different local merge. Do not "fix" it here.
//
//   * Period-guarded. A record from a different day contributes nothing to
//     today's counters, and one from a different week contributes nothing to
//     this week's. A record that matches neither is dropped on sight, so a
//     stale entry cannot sit in localStorage forever waiting to be misread.
//
//   * uid-scoped. A record belonging to another account is never read and never
//     merged into. It is also never DELETED by that other account — a second
//     student signing in on the same browser must not destroy the first one's
//     unflushed minutes just by showing up.
//
//   * Never throws. Every entry point is wrapped. Quota failures, disabled
//     storage, corrupt JSON — all degrade to "no WAL", which costs at most the
//     un-flushed tail and must never break a typing lesson.

// ═══════════════════════════════════════════════════════════════════════════
// v1.1.0 — THE PER-SOURCE COUNTERS RIDE HERE TOO
// ═══════════════════════════════════════════════════════════════════════════
//
// game.js and learn.js each keep a per-source day counter now (ROADMAP item 1,
// §3.1). Those counters are day-scoped exactly like `secondsToday`, so they
// belong under the same period guard and get the same max() merge.
//
// ⚠️ ADDING THEM HERE IS NOT OPTIONAL AND THE FAILURE IS SILENT. statsWalSave()
// stores whatever object it is handed, so the fields would be PRESENT in
// localStorage either way — but _mergeInto() only ever copies keys named in
// these two lists, so an unlisted counter is written, read back, and quietly
// ignored on every recovery. The tail it was holding is dropped on the floor
// with no error anywhere.
//
// ⚠️ WHAT THIS STILL DOES NOT DO, AND KNOW IT BEFORE RELYING ON IT. Before
// v1.1.0, a School tail left in this record could be replayed by a LIBRARY page,
// because both pages wrote the same `seconds` field and either could flush the
// other's number. That is over: each page now writes only its own triple, so a
// Library page recovering `secondsSchool` has nowhere to put it. The value is
// kept and carried — a later School page flushes it — but it is no longer true
// that any page can drain the whole record.
//
// That is a deliberate trade and it is the smaller loss. What the old behaviour
// bought was the tail of the other mode; what it cost was that either page could
// write the other's minutes, which IS §3.1. The tail is bounded by one flush
// interval and reappears the next time that mode is opened. §3.1 was unbounded
// and permanent.
export const STATS_WAL_VERSION = '1.1.0';

const KEY = 'ttb_statswal_v1';

// ⚠️ THE STORAGE KEY IS UNCHANGED, ON PURPOSE. A record written by v1.0.0 has no
// per-source keys; _mergeInto() skips absent keys, so an old record still
// replays its `secondsToday` correctly and simply contributes nothing to the new
// counters. Bumping the key would have thrown away every unflushed tail in the
// building on deploy day to avoid a case that costs nothing.
const DAY_COUNTERS  = ['secondsToday', 'charsToday', 'mistakesToday',
                       'secondsLibrary', 'charsLibrary', 'mistakesLibrary',
                       'secondsSchool',  'charsSchool',  'mistakesSchool'];
const WEEK_COUNTERS = ['secondsWeek',  'charsWeek',  'mistakesWeek'];

function _read() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const w = JSON.parse(raw);
        if (!w || w.v !== 1 || !w.stats) return null;
        return w;
    } catch (_) { return null; }
}

function _write(uid, stats) {
    try {
        localStorage.setItem(KEY, JSON.stringify({
            v: 1, uid, savedAt: Date.now(), stats
        }));
        return true;
    } catch (_) { return false; }
}

// Fold `src` into `dst` with max(), but only for the periods that match.
// Returns true if anything actually moved.
function _mergeInto(dst, src) {
    let moved = false;
    if (src.lastDate && src.lastDate === dst.lastDate) {
        for (const k of DAY_COUNTERS) {
            if ((src[k] || 0) > (dst[k] || 0)) { dst[k] = src[k]; moved = true; }
        }
    }
    if (src.weekStart && src.weekStart === dst.weekStart) {
        for (const k of WEEK_COUNTERS) {
            if ((src[k] || 0) > (dst[k] || 0)) { dst[k] = src[k]; moved = true; }
        }
    }
    return moved;
}

// Persist the live counters. Call this everywhere the page already saves its
// own WAL — it is a synchronous localStorage write and costs nothing.
//
// Guests are skipped: there is no account for the numbers to belong to, and
// learn.js keeps a separate guest accumulator for exactly that case.
export function statsWalSave(uid, stats) {
    if (!uid || !stats) return;
    const merged = { ...stats };
    const prev = _read();
    // Fold in anything the OTHER page left behind, so switching between School
    // and a book cannot drop the tail of the page being left.
    if (prev && prev.uid === uid) _mergeInto(merged, prev.stats);
    _write(uid, merged);
}

// Replay whatever the last session, or the other page, could not get to
// Firestore. MUTATES `stats` in place and returns true if it raised anything —
// which the caller should treat as "flush this now".
//
// ⚠️ CALL THIS AFTER THE FIRESTORE READ, NEVER BEFORE. It compares against what
// the server already has; running it first means comparing against zeroes and
// then having the server read overwrite the result.
export function statsWalRecover(uid, stats) {
    if (!uid || !stats) return false;
    const w = _read();
    if (!w) return false;
    if (w.uid !== uid) return false;      // someone else's — leave it alone

    const moved = _mergeInto(stats, w.stats);

    // Neither period matches: this record can never contribute again. Drop it
    // rather than leave yesterday's numbers sitting in storage where a future
    // date-comparison bug could resurrect them.
    const sameDay  = w.stats.lastDate  && w.stats.lastDate  === stats.lastDate;
    const sameWeek = w.stats.weekStart && w.stats.weekStart === stats.weekStart;
    if (!sameDay && !sameWeek) statsWalClear(uid);

    return moved;
}

// Only clears a record we own. A no-op against another student's entry.
export function statsWalClear(uid) {
    const w = _read();
    if (w && uid && w.uid !== uid) return;
    try { localStorage.removeItem(KEY); } catch (_) {}
}

// ═══════════════════════════════════════════════════════════════════════════
// GUEST ACCUMULATOR  (v1.0.0)
// ═══════════════════════════════════════════════════════════════════════════
//
// A signed-out student's minutes lived in a plain module variable and died with
// the tab. The login ladder told them so twice, which made it honest but did
// not make it good: a student who types for twenty minutes, closes the tab, and
// signs in third period has done real work that the app could have credited and
// chose not to.
//
// This persists it so `retroactiveSaveAnonSession()` has something to fold in.
//
// ⚠️ DATE-STAMPED AND DROPPED ON A NEW DAY. Yesterday's guest minutes must not
// be silently credited to today — a teacher's daily report is the one thing
// that has to mean what it says. Twelve hours would have been the lazy version
// of this and it is wrong across a midnight.
//
// ⚠️ THIS IS THE ONE PLACE A SHARED MACHINE STILL MATTERS. See learn.js
// checkpointOwner() for the ruling: every student at Ellis has their own
// account, so per-browser is per-person. If that ever stops being true, this
// and the checkpoint are the two things to revisit — together.

const GUEST_KEY = 'ttb_guestAccum_v1';

export function guestAccumSave(dateStr, seconds, lessonProgress) {
    if (!dateStr) return;
    if (!seconds && !(lessonProgress && Object.keys(lessonProgress).length)) return;
    try {
        localStorage.setItem(GUEST_KEY, JSON.stringify({
            v: 1, date: dateStr, savedAt: Date.now(),
            seconds: seconds || 0,
            lessonProgress: lessonProgress || {}
        }));
    } catch (_) { /* quota — the session-scoped copy still works */ }
}

// Returns { seconds, lessonProgress } for TODAY only, or null.
export function guestAccumLoad(dateStr) {
    try {
        const raw = localStorage.getItem(GUEST_KEY);
        if (!raw) return null;
        const g = JSON.parse(raw);
        if (!g || g.v !== 1) return null;
        if (g.date !== dateStr) { guestAccumClear(); return null; }
        return {
            seconds: g.seconds || 0,
            lessonProgress: (g.lessonProgress && typeof g.lessonProgress === 'object')
                ? g.lessonProgress : {}
        };
    } catch (_) { return null; }
}

export function guestAccumClear() {
    try { localStorage.removeItem(GUEST_KEY); } catch (_) {}
}
