// session-log.js v1.6.0
//
// v1.6.0 — ⚠️ sessionLogAdopt() THREW AWAY A GOOD LOCAL DATE AND REPLACED IT
//          WITH A UTC ONE. The date came from `at.slice(0, 10)`, and `at` is
//          `toISOString()` — UTC. In Central time that is tomorrow's date from
//          7:00 PM onward (6:00 PM in winter), so a guest typing at home in the
//          evening had their adopted sprint filed under TOMORROW while the day
//          total stayed correctly on today. The drill-down and the clock then
//          disagree by exactly one sprint, in the shape ROADMAP item 1 is
//          about, and sessionLogPendingSeconds() — which matches on `date` —
//          stops seeing those seconds for the day they belong to.
//
//          ⚠️ THE RECORD ALREADY CARRIED THE RIGHT ANSWER. game.js logSession()
//          and learn.js logRun() both stamp `date: getLocalDateStr()` at the
//          moment the typing ends, which is this module's own stated rule (see
//          _write's note: "`date` IS THE CALLER'S, NOT ours"). Adopt was the one
//          path that overrode it. It now PREFERS `r.date` and falls back to the
//          UTC slice only for the undated legacy records it was written for.
//
//          ⚠️ SCHOOL HOURS NEVER SAW THIS and that is why it survived: at Ellis
//          the offset never crosses midnight. It is a Library-at-home defect.
//          tests/adopt-date-test.mjs is the harness — 4 failing against v1.5.0.
//
// v1.5.0 — ⚠️⚠️ ONE BROWSER, TWO STUDENTS: A SECOND ACCOUNT DESTROYED THE
//          FIRST'S UNFLUSHED QUEUE. The store is now one slot PER ACCOUNT.
//
//          Every READ in v1.4.0 was correctly uid-scoped, and sessionLogClear()
//          refused to delete a queue it did not own. ⚠️ `_write()` HAD NO SUCH
//          GUARD, and `_write()` is where both live paths end:
//
//              sessionLogPush(B, …) → _read(B) is [] → _write(B, [one record])
//
//          …and student A's entire unflushed queue is gone. Permanently,
//          silently, at student B's first five seconds of typing. The flush
//          path was worse in shape: `_read(B)` is `[]`, the empty branch called
//          `_write(B, [])` → `removeItem()` → and then RETURNED `true`, meaning
//          "everything landed", having landed nothing and destroyed the records
//          on the way past. All four call sites in game.js and learn.js happen
//          to guard that with `sessionLogPending(uid) > 0`, which reads 0 for a
//          foreign queue, so it was latent rather than live. ⚠️ THAT WAS A
//          PROPERTY OF THE CALLERS, NOT OF THIS MODULE.
//
//          ⚠️ THE GRADE WAS NEVER AT RISK — `typing_logs` is written directly
//          and stats-wal.js has had the ownership guard since v1.0.0. What was
//          lost is the EVIDENCE behind the grade: the drill-down, the ⟳
//          button's input, and every measurement ROADMAP items 4, 5 and 6 need.
//          It is a fourth mechanism for ROADMAP item 1, beside the five-second
//          floor, the sprint that never closes and the failed upload — and the
//          only one of the four that can lose many minutes at once.
//
//          ⚠️ THE FIX IS NOT A REFUSAL, AND THE DIFFERENCE MATTERS. Making
//          `_write()` decline when the key belongs to somebody else would have
//          traded one silent loss for another: the student at the keyboard
//          would then be the one whose records never persisted. Both queues have
//          to fit, so both queues get a slot. See _readStore().
//
//          New export MAX_QUEUE_OWNERS. tests/queue-owner-test.mjs is the
//          harness — mutation-verified, 8 failing against v1.4.0.
//
// v1.4.0 — ADDS sessionLogPendingSeconds(uid, date). Nothing else changed; the
//          flush serialization and every existing export behave identically.
//          Stage 2 makes typing_logs a projection of typing_sessions, and the
//          projection needs to know what is queued locally but not yet uploaded.
//          See daylog.js projectDayTotal(). HANDOFF §0.0.
//
// session-log.js v1.3.0 — the sprint/run history queue, shared by game.js and
// learn.js. The third shared module, after firebase-config.js and stats-wal.js.
//
// v1.3.0 — SERIALIZED FLUSHES. `sessionLogFlush()` is now a thin wrapper that
//          chains onto `_flushChain` and calls `_sessionLogFlushInner()`; a second
//          flush starts only after the first has resolved and cleared what it
//          wrote. This closes the duplicate-session race of 2026-08-19: clicking
//          Home fires BOTH visibilitychange:hidden and pagehide, each calling
//          flushSessionsNow() unawaited, and the second read a queue the first had
//          not cleared yet. Callers WAIT rather than being dropped — one arriving
//          mid-flush may carry records the in-flight run never saw. Guarded by
//          session-merge-test.mjs Part E, which is mutation-tested. The full
//          reasoning is in the comment block above sessionLogFlush().
//          ⚠️ HEADER REPAIR, Round 17 (Linotype): this file arrived with
//          SESSION_LOG_VERSION already set to '1.3.0' and its header still saying
//          1.2.1, so `npm run audit:versions` reported "header comment says
//          v1.2.1 — one of the two is a lie", the twelfth problem in a repo whose
//          standing count is eleven. The code was correct and complete; only the
//          header was missing. This entry was written from the file's own
//          sessionLogFlush() comment block and the concurrent round's HANDOFF §0.6
//          item 8, not invented. NOTHING EXECUTABLE WAS CHANGED.
//
// v1.2.1, v1.2.0, v1.1.0 — invariant-citation renumbering; the `continuation`
//          exemption from the 5-second floor; and `serverAt`. ⚠️ The two of
//          those that are BEHAVIOUR, and the reasoning behind them, are in
//          SEMANTICS below and above sessionLogPush() — they are not history
//          and they did not move. The round-by-round narrative is in
//          CHANGELOG.md. Trimmed here in v1.5.0 to hold the 6-entry header
//          budget (ROADMAP item 7), which this file's own audit enforces.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS FILE EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// Two defects, both reported on 2026-08-18 as one symptom — "the report says
// *No session data* and I can't check anyone's work any more."
//
//   1. ⚠️ learn.js NEVER WROTE typing_sessions. AT ALL. EVER. Sprint rollups
//      were built into game.js and were never built into the lesson engine, so
//      a student who spends the period in School leaves a daily total and
//      nothing behind it. This is not a regression from the cost work — there
//      was never anything here to regress. It looked like one because School is
//      where the students actually are, so as lesson mode grew, the fraction of
//      the roster with any session detail quietly fell toward zero.
//
//   2. game.js stamped every rollup `date: getLocalDateStr()` — evaluated at
//      FLUSH time, not at sprint time. Sprints that miss their flush ride the
//      WAL to the next session (walRecover concatenates them), so a rollup
//      written Tuesday could contain Monday's sprints filed under Tuesday.
//      Monday looks empty; Tuesday looks padded. Both wrong, silently, and in
//      the direction that makes a teacher distrust the honest numbers too.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY A MODULE AND NOT A SECOND COPY
// ═══════════════════════════════════════════════════════════════════════════
//
// Round 9 §4 is the standing warning and this file is the third time it has
// been paid: when two subsystems implement the same thing, the duplication is
// the visible defect and the DIVERGENCE is the expensive one. Defect 1 above IS
// that divergence — not two copies that drifted, but one copy and one absence,
// which is the same failure with nothing to grep for. A hand-copied rollup
// writer in learn.js would have been the identical trap set again.
//
// ⚠️ THE RECORDS ARE DELIBERATELY SOURCE-AGNOSTIC. A sprint from a book and a
// run from a lesson are the same shape: a bounded stretch of typing with a
// duration, a character count, a mistake count, and a derived WPM/accuracy.
// The only difference is what you call the container, so `source` says which
// ('library' | 'school') and `label` names the book or the lesson. reports.html
// renders one column from both.
//
// DOM-free, side-effect-free, and it imports nothing — the Firestore helpers
// are INJECTED by init(). That matters: this module is imported by two page
// controllers that each build their own Firestore surface, and a module with a
// top-level SDK import would be a third place for versions to disagree.
//
// ═══════════════════════════════════════════════════════════════════════════
// SEMANTICS
// ═══════════════════════════════════════════════════════════════════════════
//
//   * ⚠️ EVERY RECORD CARRIES ITS OWN `date`, STAMPED WHEN THE TYPING HAPPENED.
//     This is defect 2's fix and it is the whole reason the queue is a queue of
//     dated records rather than an undated array. On flush, records are GROUPED
//     BY (date, source, label) and one document is written per group, so a
//     queue that survived midnight produces two correctly-dated documents
//     rather than one wrong one. Never re-stamp a record at flush time.
//
//   * Persisted to localStorage, uid-scoped, so a queue survives the tab close
//     that stopped it being flushed. Another student's queue is never read,
//     never written over, and never deleted by an account that does not own it.
//     ⚠️ THAT LAST CLAUSE WAS FALSE FROM v1.0.0 TO v1.4.0 AND IS TRUE FROM
//     v1.5.0. It described a guarantee only `sessionLogClear()` actually made;
//     `_write()` overwrote the single slot regardless of who owned it. The
//     sentence is unchanged because it was always the right sentence — what
//     changed is that the code now keeps it. ⚠️ A comment asserting a property
//     is not a test of it, and this one read as authoritative for five versions.
//
//   * Chunked at 200 records per document, because firestore.rules v2.2.0
//     requires `sprints.size() <= 200`. Unchunked this is a poison pill: once a
//     recovered queue crosses 200 every future write is denied, the denial keeps
//     the queue, and the kept queue is carried forward — failing permanently,
//     silently, and growing while it does. Chunks are removed from the queue one
//     at a time and only after their write lands.
//
//   * Records older than STALE_DAYS are dropped on load. A queue that has failed
//     to flush for two weeks is not going to start, and reports.html only reads
//     the last 45 days anyway.
//
//   * Never throws. Storage quota, disabled storage, corrupt JSON — all degrade
//     to "no queue", which costs the sprint detail and must never break a lesson.
//
//   * ⚠️ TWO CLOCKS, NAMED HONESTLY, AND NEITHER IS A COPY OF THE OTHER. (v1.1.0)
//
//       `timestamp` — the CLIENT clock. The first record in the document, i.e.
//                     when the student typed. This is the field DESIGN-TELEMETRY
//                     §4 calls `clientAt`; it keeps its existing name for the
//                     same reason `bookId` did — reports.html, the rules and a
//                     live single-field index exemption all already know it, and
//                     a rename would cost Jake a console change for a word.
//                     ⚠️ DO NOT ADD A `clientAt` FIELD. It would be a second
//                     copy of this quantity in the same document, which is
//                     invariant 1 ("one quantity, one record") rebuilt at
//                     field scope.
//       `serverAt`  — the SERVER clock, from serverTimestamp(), resolved by
//                     Firestore at commit. Cannot be influenced from a browser.
//
//     They are expected to differ by the queue's delivery lag — seconds usually,
//     a day if a queue survived overnight, which is legitimate and is exactly
//     what the dated-record design exists to preserve. What is NOT legitimate is
//     `timestamp` landing in a different week from `serverAt`, or ahead of it by
//     more than clock skew. That comparison is the cheat signal, and it only
//     works while the two fields have genuinely different provenance.
//
//   * ⚠️ THE SENTINEL IS CREATED AT WRITE TIME, NEVER AT PUSH TIME, AND NEVER
//     GOES INTO localStorage. serverTimestamp() returns a FieldValue sentinel,
//     not a date; JSON.stringify() flattens it to `{}` and a queue that survived
//     a tab close would then try to write an empty map into a timestamp field.
//     Queued records carry `at` (a real ISO string) and nothing else time-like.

export const SESSION_LOG_VERSION = '1.6.0';

const KEY = 'ttb_sessionq_v1';
const RECORDS_PER_DOC = 200;   // firestore.rules: sprints.size() <= 200
const MAX_SECONDS     = 86400; // firestore.rules: seconds <= 86400
const STALE_DAYS      = 21;
const TTL_DAYS        = 120;   // matches the live TTL policy on typing_sessions
const MAX_QUEUE       = 2000;  // a hard ceiling on what one browser can hoard

// How many accounts may hold an unflushed queue on one browser at once.
// Exported so a harness asserts the real number rather than a copy of it.
//
// Eight is a school day: a cart Chromebook sees one class per period and the
// queues that matter are hours old, not weeks. Slots beyond this are evicted
// oldest-first, and the account currently typing is never the one evicted.
export const MAX_QUEUE_OWNERS = 8;

// ⚠️ THE SLOT A SIGNED-OUT STUDENT'S SPRINTS GO IN. (v1.5.0)
//
// A guest has no account for a record to belong to YET, and both page
// controllers used to conclude from that they should throw the record away —
// game.js dropped it outright, learn.js filed it under the throwaway anonymous
// uid. Either way a child who typed before signing in left the day's total
// carrying minutes with no evidence behind them.
//
// They go here instead, and the two pages hand them to the real account at
// sign-in with sessionLogTake() + sessionLogAdopt(). ⚠️ THIS IS THE WHOLE
// REASON THE STORE IS PER-OWNER: the guest slot and the account slot have to
// exist at the same moment for the handover to be possible at all.
//
// The NUL byte makes it a string no Firebase uid can ever be, so a real
// account can never collide with it.
export const GUEST_QUEUE_UID = '\u0000guest';

// Injected by init(). Nothing in this file reaches for a global.
let _db = null, _collection = null, _addDoc = null, _serverTimestamp = null;

export function sessionLogInit(deps) {
    if (!deps) return;
    _db         = deps.db         || null;
    _collection = deps.collection || null;
    _addDoc     = deps.addDoc     || null;
    // ⚠️ OPTIONAL, ON PURPOSE, AND IT IS NOT ONLY A COURTESY TO THE TESTS.
    // Jake uploads one file at a time through the GitHub web portal, so there is
    // a window — minutes, or an afternoon — where this module is new and a page
    // controller is still the old one that does not pass this dependency. Making
    // it required would turn that window into `serverAt: undefined`, which
    // Firestore rejects outright, which fails the whole rollup write, which
    // loses a period's sprint detail for every student who typed during it.
    // A missing dependency omits ONE field. See _stampServer().
    _serverTimestamp = typeof deps.serverTimestamp === 'function'
        ? deps.serverTimestamp : null;
}

function _ready() { return !!(_db && _collection && _addDoc); }

// ⚠️ THERE IS NO CLIENT-SIDE FALLBACK HERE, AND THERE MUST NEVER BE ONE.
// `new Date()` would satisfy the field's type and destroy its only purpose: a
// serverAt written by the browser agrees with `timestamp` by construction, so
// the divergence that makes it a cheat signal becomes permanently zero and
// permanently unfalsifiable — a field that reports "no clock tampering" whether
// or not the clock was tampered with. Absent is honest; approximated is a lie
// wearing the name of a trusted source. If serverAt is missing from a document,
// that means "this browser was running code that could not stamp it", and a
// reader can tell. (Invariant 7, "absent beats approximated".)
function _stampServer(payload) {
    if (_serverTimestamp) payload.serverAt = _serverTimestamp();
    return payload;
}

// ═══════════════════════════════════════════════════════════════════════════
// THE STORE  (v1.5.0)
// ═══════════════════════════════════════════════════════════════════════════
//
// One localStorage key, holding one slot PER ACCOUNT:
//
//     { v: 2, owners: { <uid>: { savedAt, records: [...] }, ... } }
//
// ⚠️ THE KEY IS UNCHANGED ON PURPOSE, exactly as stats-wal.js v1.1.0 left its
// own. A v1 record is migrated in place by _readStore() below. Bumping the key
// would have thrown away every unflushed queue in the building on deploy day to
// avoid a case that costs nothing.
//
// ⚠️ THE UPLOAD WINDOW, STATED SO NOBODY IS SURPRISED BY IT. Jake uploads one
// file at a time, so a browser can hold a v2 store and then load a CACHED
// v1.4.0 module, which does not recognise `v: 2` and will overwrite the whole
// key with a single-owner v1 record. That loses the other slots — which is
// precisely what v1.4.0 did every time anyway, so the window is no worse than
// today and it closes the moment the tab reloads. It is bounded by one deploy;
// v1.4.0's version of it was bounded by nothing.
function _readStore() {
    const empty = { v: 2, owners: {} };
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return empty;
        const q = JSON.parse(raw);
        if (!q) return empty;
        if (q.v === 2 && q.owners && typeof q.owners === 'object') {
            return { v: 2, owners: { ...q.owners } };
        }
        // ⚠️ THE v1 MIGRATION. One uid, one array, straight into its own slot.
        // A malformed record migrates to nothing, which is what v1.4.0's own
        // reader did with it.
        if (q.v === 1 && q.uid && Array.isArray(q.records) && q.records.length) {
            return { v: 2, owners: { [q.uid]: { savedAt: q.savedAt || Date.now(),
                                                records: q.records } } };
        }
        return empty;
    } catch (_) { return empty; }
}

// Persist the store, having first made it small enough to be worth persisting.
//
// `protectUid` is the account whose write this is, and it is NEVER the one
// evicted. Dropping the queue of the student who is typing to make room for the
// queue of a student who left an hour ago would be the same defect this version
// exists to fix, wearing a politer hat.
function _writeStore(store, protectUid) {
    try {
        const owners = store.owners || {};

        // Every slot is pruned, not just the caller's. A queue that has failed
        // to flush for STALE_DAYS is not going to start, and an account with
        // nothing left is not an owner — that is what keeps a shared cart
        // machine from accumulating a term of dead slots.
        for (const uid of Object.keys(owners)) {
            const kept = _prune(owners[uid] && owners[uid].records);
            if (kept.length) owners[uid] = { savedAt: owners[uid].savedAt || Date.now(), records: kept };
            else delete owners[uid];
        }

        let uids = Object.keys(owners);
        if (!uids.length) { localStorage.removeItem(KEY); return true; }

        if (uids.length > MAX_QUEUE_OWNERS) {
            // Oldest slot out first. Array.prototype.sort is stable, so slots
            // saved in the same millisecond evict in the order they arrived.
            const evictable = uids.filter(u => u !== protectUid)
                .sort((a, b) => (owners[a].savedAt || 0) - (owners[b].savedAt || 0));
            let over = uids.length - MAX_QUEUE_OWNERS;
            for (const u of evictable) {
                if (over <= 0) break;
                delete owners[u]; over--;
            }
            uids = Object.keys(owners);
        }

        // ⚠️ A QUOTA FAILURE MUST NOT COST THE CURRENT STUDENT THEIR QUEUE.
        // v1.4.0 returned false and dropped the write on the floor; with several
        // slots there is something cheaper to give up first. Shed the oldest
        // OTHER account and try again, down to the caller alone. Only then fail.
        for (;;) {
            try {
                localStorage.setItem(KEY, JSON.stringify({ v: 2, owners }));
                return true;
            } catch (_) {
                const others = Object.keys(owners).filter(u => u !== protectUid)
                    .sort((a, b) => (owners[a].savedAt || 0) - (owners[b].savedAt || 0));
                if (!others.length) return false;
                delete owners[others[0]];
            }
        }
    } catch (_) { return false; }
}

function _read(uid) {
    if (!uid) return [];
    const o = _readStore().owners[uid];
    return (o && Array.isArray(o.records)) ? o.records : [];
}

// ⚠️ THIS FUNCTION MAY ONLY EVER TOUCH `uid`'s OWN SLOT. That sentence is the
// entire v1.5.0 fix. See the header.
function _write(uid, records) {
    if (!uid) return false;
    const store = _readStore();
    if (records && records.length) {
        store.owners[uid] = { savedAt: Date.now(), records };
    } else {
        // An empty queue means THIS student has nothing pending. It has never
        // meant the browser has nothing pending, and v1.4.0 could not tell the
        // difference because there was only one slot to remove.
        delete store.owners[uid];
    }
    return _writeStore(store, uid);
}

// Drop anything too old to be worth writing. Records with no parseable `at`
// are KEPT — "unknown age" is not "expired", and a record we cannot date is
// still a record of work somebody did. (Invariant 9, "unknown is not expired".)
function _prune(records) {
    const cutoff = Date.now() - STALE_DAYS * 86400 * 1000;
    const kept = (Array.isArray(records) ? records : []).filter(r => {
        const t = Date.parse(r && r.at);
        return !isFinite(t) || t >= cutoff;
    });
    return kept.length > MAX_QUEUE ? kept.slice(kept.length - MAX_QUEUE) : kept;
}

// ⚠️ `date` IS THE CALLER'S, NOT ours. The caller knows the student's local
// date at the moment the typing ended; this module may not run again until
// tomorrow. A default of "today at flush time" is exactly the bug this file
// exists to fix, so an undated record is refused outright rather than guessed at.
export function sessionLogPush(uid, record) {
    if (!uid || !record || !record.date) return false;
    const seconds = Math.max(0, Math.round(record.seconds || 0));
    // ⚠️ THE FLOOR IS ABOUT UNITS, NOT ABOUT SECONDS. (v1.2.0) A standalone
    // 3-second run is noise and is refused. The 3-second TAIL of a sprint that
    // was interrupted and then finished is the rest of a real record, and
    // refusing it would leave the day's sessions summing to less than the day's
    // clock — an undercount that looks exactly like a clean read. The caller
    // sets `continuation` only when it has already logged part of this same
    // unit; see game.js logSession() and learn.js logRun().
    if (seconds < 5 && !record.continuation) return false;
    if (seconds <= 0) return false;         // nothing happened at all
    const records = _prune(_read(uid));
    records.push({
        date:     String(record.date),
        at:       record.at || new Date().toISOString(),
        seconds,
        chars:    Math.max(0, Math.round(record.chars    || 0)),
        mistakes: Math.max(0, Math.round(record.mistakes || 0)),
        wpm:      Math.max(0, Math.round(record.wpm      || 0)),
        accuracy: Math.max(0, Math.round(record.accuracy || 0)),
        source:   record.source || '',       // 'library' | 'school'
        label:    record.label  || '',       // bookId or lessonId
        detail:   record.detail || '',       // chapter number or step index
        // Marks a record as the second-or-later piece of one stretch of typing.
        // Kept on the record (not just used as a gate) because a teacher reading
        // three rows for one sprint should be able to see that is what they are.
        ...(record.continuation ? { continuation: true } : {}),
    });
    return _write(uid, records);
}

export function sessionLogPending(uid) { return _read(uid).length; }

/**
 * Remove one owner's records from the store and return them.
 *
 * ⚠️ TAKE, NOT READ, AND THE ATOMICITY IS THE POINT. (v1.5.0) The guest-to-
 * account handover is `sessionLogAdopt(realUid, sessionLogTake(GUEST_QUEUE_UID))`
 * — the records leave the guest slot in the same step they are handed over, so
 * a handover interrupted half-way loses them rather than filing them twice.
 * Losing a guest's unlogged tail costs one sprint's detail; adopting it twice
 * would inflate a number a teacher grades on. Of the two, this is the direction
 * to fail in.
 */
export function sessionLogTake(uid) {
    if (!uid) return [];
    const store = _readStore();
    const slot = store.owners[uid];
    const records = (slot && Array.isArray(slot.records)) ? slot.records : [];
    if (!records.length) return [];
    delete store.owners[uid];
    _writeStore(store, null);
    return records;
}

/**
 * How many SECONDS are sitting in the local queue for one date, not yet uploaded.
 *
 * ⚠️ ADDED FOR STAGE 2 (v1.4.0). `typing_logs` is now a PROJECTION of
 * `typing_sessions` rather than a copy of an in-memory counter — see daylog.js
 * and HANDOFF §0.0. The projection is
 *
 *     sessions on the server  +  this queue  +  the still-open unit
 *
 * and this function is the middle term. Without it the middle term is invisible
 * and every flush between one unit boundary and the next would write a total
 * that is short by whatever is waiting in localStorage — an undercount that
 * looks exactly like a light period.
 *
 * Counts by the date the work was TYPED, matching how records are grouped for
 * upload: a queue that survives overnight holds yesterday's records, and they
 * must not be added to today's projection.
 */
export function sessionLogPendingSeconds(uid, dateStr) {
    if (!uid || !dateStr) return 0;
    return _read(uid).reduce(
        (sum, r) => sum + (r && r.date === dateStr ? (r.seconds || 0) : 0), 0);
}

// Adopt records from somewhere else. Two callers now, and they want different
// things from this function:
//
//   1. THE ONE-TIME LEGACY MIGRATION — the sprint array that used to ride
//      inside game.js's ttb_wal_v2. Those records have no `date` at all, so
//      one is derived, and any derivation is an approximation.
//   2. THE GUEST HANDOVER (v1.5.0) — records this module itself queued, which
//      DO have a date, stamped by the caller in the student's own timezone at
//      the moment the typing ended.
//
// ⚠️ PREFER THE RECORD'S OWN `date`. (v1.6.0) `at` is `toISOString()`, so
// `at.slice(0, 10)` is the UTC date — which in Central time is TOMORROW from
// 7:00 PM onward. Deriving it there overwrote a correct local date with a wrong
// one, and split a child's evening between two days: the clock on today, the
// sprint record on tomorrow. The whole reason this module refuses to date a
// record itself (see _write's note) is that the caller knows something this
// module does not, and case 2 is the caller having already said so.
//
// The UTC slice survives as a fallback for case 1 ONLY, where there is nothing
// better. `fallbackDate` is the last resort, in the caller's local terms.
export function sessionLogAdopt(uid, legacyRecords, fallbackDate) {
    if (!uid || !Array.isArray(legacyRecords) || !legacyRecords.length) return 0;
    let n = 0;
    for (const r of legacyRecords) {
        if (!r) continue;
        const at = r.at || '';
        const own = (typeof r.date === 'string' && r.date.length === 10) ? r.date : '';
        const date = own || ((at && at.length >= 10) ? at.slice(0, 10) : fallbackDate);
        if (!date) continue;
        if (sessionLogPush(uid, { ...r, date, at: at || undefined })) n++;
    }
    return n;
}

// Clear ONE account's queue and nothing else. This is the one path that already
// had an ownership guard in v1.4.0; it now expresses it by construction rather
// than by a `return` in front of a `removeItem`.
export function sessionLogClear(uid) {
    if (!uid) return;
    const store = _readStore();
    if (!store.owners[uid]) return;
    delete store.owners[uid];
    _writeStore(store, null);
}

// Group by the three things that must not be mixed inside one document: the day
// it happened, whether it was a book or a lesson, and which book or lesson.
function _group(records) {
    const groups = new Map();
    for (const r of records) {
        const k = `${r.date}\u0000${r.source}\u0000${r.label}`;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(r);
    }
    return groups;
}

// Write the queue to Firestore. `meta` carries the tenancy stamps reports.html
// scopes by: { email, displayName, classId, schoolId }.
//
// Returns true only if EVERYTHING landed. A false return means the caller should
// keep whatever durable state it was going to drop — records that failed are
// still in the queue and will be retried.
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ SERIALIZED — DO NOT CALL _sessionLogFlushInner DIRECTLY. (v1.3.0)
// ═════════════════════════════════════════════════════════════════════════════
//
// THE DUPLICATE-SESSION BUG, found 2026-08-19. Jake typed one 23-second run in
// Pinocchio, clicked Home, and got TWO identical typing_sessions documents —
// same timestamp, same 182 characters, same sprint, both labelled "left page".
//
// The cause is a race this module's own header used to argue was impossible.
// The old comment on game.js's flushSessionsNow() said the flush "is
// self-limiting: records are removed from the queue as they land." That is true
// SEQUENTIALLY and false CONCURRENTLY: records are removed only AFTER the
// `await _addDoc(...)` resolves, and that is a full network round trip. Clicking
// Home fires visibilitychange:hidden AND pagehide, each of which calls
// flushSessionsNow() fire-and-forget, unawaited. The second call ran while the
// first was still in flight, called _read() on a queue nobody had cleared yet,
// and wrote the same record a second time.
//
// This is fixed HERE rather than in the two callers on purpose. There are four
// call sites across game.js and learn.js, two of them deliberately unawaited on
// a navigation path where awaiting isn't reliable anyway, and any future caller
// would inherit the same trap. A promise chain in the one module that owns the
// queue makes the guarantee structural: a second flush starts only after the
// first has finished and cleared what it wrote, so it finds an empty (or
// only-newer) queue and writes nothing twice.
//
// Serializing rather than dropping the second call matters — a caller that
// arrives mid-flush may be carrying records the in-flight run never saw, and
// dropping it would lose them. It waits its turn instead.
let _flushChain = Promise.resolve();

export function sessionLogFlush(uid, meta) {
    // Both handlers re-run the inner flush regardless of whether the previous
    // one resolved or rejected — a failed flush leaves its records in the queue
    // precisely so the next attempt retries them.
    const run = _flushChain.then(
        () => _sessionLogFlushInner(uid, meta),
        () => _sessionLogFlushInner(uid, meta)
    );
    // The chain itself must never reject, or every later flush would inherit
    // the rejection and skip straight to its own inner call.
    _flushChain = run.then(() => {}, () => {});
    return run;
}

async function _sessionLogFlushInner(uid, meta) {
    if (!uid || !_ready()) return false;
    let records = _prune(_read(uid));
    if (!records.length) { _write(uid, records); return true; }

    meta = meta || {};
    let ok = true;

    for (const [, group] of _group(records)) {
        for (let i = 0; i < group.length; i += RECORDS_PER_DOC) {
            const chunk = group.slice(i, i + RECORDS_PER_DOC);
            const totals = chunk.reduce((a, s) => ({
                seconds:  a.seconds  + s.seconds,
                chars:    a.chars    + s.chars,
                mistakes: a.mistakes + s.mistakes,
            }), { seconds: 0, chars: 0, mistakes: 0 });

            // The document's timestamp is the FIRST record in it, not now. A
            // teacher scanning the drill-down reads these as a period's
            // timeline, and "when it was written" is not a fact about the
            // student — it is a fact about the network.
            const firstAt = Date.parse(chunk[0].at);
            const stamp = isFinite(firstAt) ? new Date(firstAt) : new Date();

            try {
                // _stampServer() adds `serverAt` here, at write time, and only
                // here — see the sentinel note in SEMANTICS above.
                await _addDoc(_collection(_db, 'typing_sessions'), _stampServer({
                    uid,
                    email:       meta.email       || '',
                    displayName: meta.displayName || 'Anonymous',
                    classId:     meta.classId     || '',
                    schoolId:    meta.schoolId    || '',
                    date:        chunk[0].date,
                    timestamp:   stamp,
                    source:      chunk[0].source || '',
                    // `bookId` keeps its name because reports.html, the rules
                    // and the index exemptions all already know it. For a
                    // lesson it holds the lesson id. Renaming it would have
                    // been tidier and would have needed a console change to a
                    // live index, which is not a trade worth making for a word.
                    bookId:      chunk[0].label || '',
                    sprintCount: chunk.length,
                    seconds:     Math.min(totals.seconds, MAX_SECONDS),
                    chars:       totals.chars,
                    mistakes:    totals.mistakes,
                    wpm: totals.seconds > 0
                        ? Math.round((totals.chars / 5) / (totals.seconds / 60)) : 0,
                    accuracy: (totals.chars + totals.mistakes) > 0
                        ? Math.round((totals.chars / (totals.chars + totals.mistakes)) * 100)
                        : 100,
                    sprints: chunk,
                    expiresAt: new Date(Date.now() + TTL_DAYS * 86400 * 1000),
                }));
                if (totals.seconds > MAX_SECONDS) {
                    console.warn('[session-log] rollup seconds clamped to ' + MAX_SECONDS +
                                 ' — local total was ' + totals.seconds + '. Check the queue.');
                }
                // Remove exactly what landed, immediately. A later failure in
                // this same run must not resend these.
                const written = new Set(chunk);
                records = records.filter(r => !written.has(r));
                _write(uid, records);
            } catch (e) {
                ok = false;
                console.warn('[session-log] rollup write failed:', e);
            }
        }
    }

    _write(uid, records);
    return ok;
}
