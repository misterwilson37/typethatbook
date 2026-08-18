// session-log.js v1.1.0 — the sprint/run history queue, shared by game.js and
// learn.js. The third shared module, after firebase-config.js and stats-wal.js.
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
//                     invariant 71 rebuilt at field scope.
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

export const SESSION_LOG_VERSION = '1.1.0';

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
// reader can tell. (Round 13, invariant 74.)
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
// still a record of work somebody did. (Round 11, invariant 58.)
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
    if (seconds < 5) return false;          // trivially short; matches game.js
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
export async function sessionLogFlush(uid, meta) {
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
