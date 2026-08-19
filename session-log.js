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
//          v1.2.1 — `npm run audit:versions` reported "header comment says v1.2.1
//          — one of the two is a lie", the twelfth problem in a repo whose
//          standing count is eleven. The code was correct and complete; only the
//          header was missing. This entry was written from the file's own
//          sessionLogFlush() comment block and the concurrent round's HANDOFF §0.6
//          item 8, not invented. NOTHING EXECUTABLE WAS CHANGED.
//
// v1.2.1 — COMMENTS ONLY. Invariant citations renumbered against the single
//          consolidated HANDOFF.md §5. The old numbering was unusable: Round 9
//          assigned 56-81 and Round 11, told to continue from Round 8's 55, also
//          started at 56, so every number in that range meant two things and this
//          file cited both. ⚠️ The numbers in §5 are now APPEND-ONLY — a new
//          invariant takes the next free number and nothing is ever renumbered
//          again. Citations carry the invariant's NAME as well, so a number that
//          somehow drifts can still be resolved.
//
// v1.2.0 — `continuation` records may be shorter than the 5-second floor.
//          DESIGN-TELEMETRY.md §7 step 1.5. game.js and learn.js now close the
//          OPEN sprint/run when a student switches books, toggles to the other
//          mode, or hides the tab, so one stretch of typing can arrive as two or
//          three records: a partial, then the remainder when it finishes. The
//          5-second floor exists to suppress trivial standalone runs, and a
//          3-second remainder of an already-recorded 40-second sprint is not
//          that. ⚠️ Dropping it would make the day's session total quietly
//          smaller than the day's counter, which is precisely the undercount
//          step 2 must not inherit. The floor still applies to any record that
//          starts a unit.
//
// v1.1.0 — `serverAt: serverTimestamp()` on every rollup document.
//          DESIGN-TELEMETRY.md §6.3 / §7 step 1. One field, no behaviour change,
//          nothing else in this file moved. Every date and duration in this
//          project is currently stamped by the student's own Chromebook clock;
//          a child who changes it files work under the wrong day or fakes a WPM
//          interval, and there is nothing to check that against. serverAt is a
//          clock the student cannot set, written by Firestore at commit.
//          ⚠️ IT IS DELIBERATELY NOT USED FOR ANYTHING YET. Nothing reads it,
//          nothing grades on it, no total derives from it. It exists so that in
//          120 days there is history to compare against — a signal added the day
//          you need it has no past. See §7 of HANDOFF.md (Round 13).
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

export const SESSION_LOG_VERSION = '1.3.0';

const KEY = 'ttb_sessionq_v1';
const RECORDS_PER_DOC = 200;   // firestore.rules: sprints.size() <= 200
const MAX_SECONDS     = 86400; // firestore.rules: seconds <= 86400
const STALE_DAYS      = 21;
const TTL_DAYS        = 120;   // matches the live TTL policy on typing_sessions
const MAX_QUEUE       = 2000;  // a hard ceiling on what one browser can hoard

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

function _read(uid) {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const q = JSON.parse(raw);
        if (!q || q.v !== 1 || !Array.isArray(q.records)) return [];
        if (uid && q.uid !== uid) return [];   // someone else's — invisible to us
        return q.records;
    } catch (_) { return []; }
}

function _write(uid, records) {
    try {
        if (!records.length) { localStorage.removeItem(KEY); return true; }
        localStorage.setItem(KEY, JSON.stringify({
            v: 1, uid, savedAt: Date.now(), records
        }));
        return true;
    } catch (_) { return false; }
}

// Drop anything too old to be worth writing. Records with no parseable `at`
// are KEPT — "unknown age" is not "expired", and a record we cannot date is
// still a record of work somebody did. (Invariant 9, "unknown is not expired".)
function _prune(records) {
    const cutoff = Date.now() - STALE_DAYS * 86400 * 1000;
    const kept = records.filter(r => {
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

// Adopt records from somewhere else — used once, to migrate the sprint array
// that used to ride inside game.js's ttb_wal_v2. Undated legacy records are
// stamped with `fallbackDate` because there is nothing better available; that
// is a one-time approximation for a queue that already exists, NOT a licence to
// date new records at flush time.
export function sessionLogAdopt(uid, legacyRecords, fallbackDate) {
    if (!uid || !Array.isArray(legacyRecords) || !legacyRecords.length) return 0;
    let n = 0;
    for (const r of legacyRecords) {
        if (!r) continue;
        const at = r.at || '';
        const date = (at && at.length >= 10) ? at.slice(0, 10) : fallbackDate;
        if (!date) continue;
        if (sessionLogPush(uid, { ...r, date, at: at || undefined })) n++;
    }
    return n;
}

// Only clears a queue we own.
export function sessionLogClear(uid) {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
            const q = JSON.parse(raw);
            if (q && uid && q.uid && q.uid !== uid) return;
        }
        localStorage.removeItem(KEY);
    } catch (_) {}
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
