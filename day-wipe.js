// day-wipe.js v1.2.0 — Round 164. "WIPE TODAY", AND THE OPEN TAB THAT HEARS IT.
//
// v1.2.0 — Round 168: a third signal, `progressChangedAt` — a teacher changed this student's
//          LESSON records (deleted a run, cleared mastery). An open tab drops its copy of lesson
//          progress (the cache and the WAL's pending records) and reloads; a closed one drops
//          them at sign-in. ⚠️ Unsaved MINUTES are kept (stats WAL untouched) — only lessons
//          changed. Without this, the tab's next lesson flush (a merge of its whole in-memory
//          record) would write the deleted run's credit straight back.
//
// v1.1.0 — Round 166: watchAccount() takes an optional `onData(data)`, called with every
//          server snapshot of users/{uid} (the first included), so a page can read the
//          student's own settings — req-scale.js's percentages — off the listener it
//          already holds instead of paying a second read. Called before any action.
//
// Jake, 2026-11-11: *"Let's say I catch a kid cheating in class. I want to delete
// everything he's done to that moment, resetting his progress to the start of the
// day and removing the time from his record (but allowing him to jump back in,
// type correctly, and earn his time)."* And: *"It should undo lessons they passed,
// too. If they felt they needed to cheat on it, they didn't learn it."*
//
// ⭐ HOW IT WORKS, END TO END
//   1. reports.html "Wipe today" removes what is SAVED: today's runs, today's
//      minutes on typing_logs, and every lessonProgress record changed today goes
//      back to how it stood at the start of the day (the `dayStart*` snapshot
//      below). Then it stamps users/{uid}: logsChangedAt + logsChangedDay +
//      wipeAt + wipeDay (rules v2.18.0).
//   2. Every student page LISTENS to its own users/{uid} (watchAccount()). The
//      stamp reaches an open tab in a second or two; the tab locks its saves,
//      throws away everything it had not saved yet (purgeLocal()), and reloads —
//      so the minutes and lesson passes it was holding in memory die with it.
//   3. A tab that was CLOSED gets the same purge at its next sign-in, from the
//      listener's first snapshot, before any write-ahead log is replayed.
//
// ⚠️⚠️ ROADMAP 145a, CLOSED HERE TOO. The same listener carries an ordinary
// "a teacher changed today's minutes" stamp (a deleted run), and an open tab now
// reloads on it instead of writing its old absolute total back over the
// teacher's correction five minutes later.
//
// ⭐ READS. One listener per open page on ONE document the student owns: one read
// when it attaches, one each time that document changes (rare — a teacher stamp,
// the once-a-day ledger note, a goal change), and a re-read after a long offline
// spell. Polling at every save would be ~12 reads an hour per student; this is ~1.
//
// ⚠️ THE SAVE LOCK IS THE SAFETY ARGUMENT. Between the stamp arriving and the
// reload, every page's save paths — and stats-wal.js / session-log.js, which
// import savesLocked() — refuse to write. Without it, the reload's own pagehide
// flush would put the wiped minutes straight back.

import { ackTeacherChange, LOGS_CHANGED_FIELD } from './daylog.js';

export const DAY_WIPE_VERSION = '1.2.0';

// ─── The save lock ───────────────────────────────────────────────────────────
let _locked = false;
export function savesLocked() { return _locked; }
export function lockSaves() { _locked = true; }
/** Harnesses only. */
export function _unlockForTest() { _locked = false; }

// ─── Stamps and acknowledgements ─────────────────────────────────────────────
const WIPE_ACK_PREFIX = 'ttbWipeAck:';

export function msOf(v) {
    if (!v) return 0;
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (typeof v === 'number') return v;
    if (v instanceof Date) return v.getTime();
    return 0;
}
function _ack(uid) {
    try { return Number(localStorage.getItem(WIPE_ACK_PREFIX + uid)) || 0; } catch (_) { return 0; }
}
export function ackWipe(uid, ms) {
    if (!uid || !ms) return;
    try { localStorage.setItem(WIPE_ACK_PREFIX + uid, String(ms)); } catch (_) {}
}
const PROGRESS_ACK_PREFIX = 'ttbProgressAck:';
function _progressAck(uid) {
    try { return Number(localStorage.getItem(PROGRESS_ACK_PREFIX + uid)) || 0; } catch (_) { return 0; }
}
export function ackProgress(uid, ms) {
    if (!uid || !ms) return;
    try { localStorage.setItem(PROGRESS_ACK_PREFIX + uid, String(ms)); } catch (_) {}
}
export const PROGRESS_CHANGED_FIELD = 'progressChangedAt';

function _logsAck(uid) {
    try { return Number(localStorage.getItem('ttbLogsAck:' + uid)) || 0; } catch (_) { return 0; }
}

/**
 * What does this users/{uid} snapshot ask of this browser?
 *   { kind: 'wipe', day, wipeMs, logsMs }    a teacher wiped `day`
 *   { kind: 'today', logsMs }                 a teacher changed TODAY's minutes
 *   null                                      nothing new
 * ⚠️ A stamp with no logsChangedDay (an older reports.html) is treated as
 * "today": reloading costs a few unsaved seconds; ignoring it costs the fix.
 */
export function accountAction(data, uid, today) {
    if (!data || !uid) return null;
    const wipeMs = msOf(data.wipeAt);
    if (wipeMs && wipeMs > _ack(uid) && typeof data.wipeDay === 'string') {
        return { kind: 'wipe', day: data.wipeDay, wipeMs, logsMs: msOf(data[LOGS_CHANGED_FIELD]) };
    }
    const logsMs = msOf(data[LOGS_CHANGED_FIELD]);
    let todayChanged = false;
    if (logsMs && logsMs > _logsAck(uid)) {
        const day = data.logsChangedDay;
        if (!day || day === today) todayChanged = true;
    }
    // Round 168 — a staff change to lesson records.
    const progressMs = msOf(data[PROGRESS_CHANGED_FIELD]);
    const progressChanged = !!progressMs && progressMs > _progressAck(uid);
    if (todayChanged) return { kind: 'today', logsMs, progress: progressChanged, progressMs };
    if (progressChanged) return { kind: 'progress', progressMs };
    return null;
}

/**
 * Round 168 — drop this browser's copy of lesson progress: the cached records, and the
 * pending (unflushed) records inside the learn WAL. The WAL's MINUTES stay.
 */
export function purgeProgress(uid) {
    try {
        const raw = localStorage.getItem('ttb_lessonProgCache_v2');
        if (raw) {
            let owner = null; try { owner = JSON.parse(raw).uid; } catch (_) {}
            if (!owner || owner === uid) localStorage.removeItem('ttb_lessonProgCache_v2');
        }
    } catch (_) {}
    try {
        const raw = localStorage.getItem('ttb_learnwal_v1');
        if (raw) {
            const w = JSON.parse(raw);
            if (w && (!w.uid || w.uid === uid) && w.progress) {
                delete w.progress;
                localStorage.setItem('ttb_learnwal_v1', JSON.stringify(w));
            }
        }
    } catch (_) {}
}

// ─── Purging what this browser had not saved ─────────────────────────────────
// Every localStorage store that holds unsaved work or a copy of today's numbers.
// ⚠️ ADD TO THIS LIST when a page gains a new one, or a wipe leaves it behind.
export const LOCAL_STORES = [
    'ttb_statswal_v1',         // stats-wal.js — unsaved minutes
    'ttb_learnwal_v1',         // learn.js / learn2.js — unsaved lesson progress
    'ttb_lessonProgCache_v2',  // learn.js / learn2.js — cached lesson records
    'ttb_hudCache_v2',         // hud.js — paint-only copy of today's totals
];
const SESSION_QUEUE = 'ttb_sessionq_v1';

/**
 * Throw away this uid's unsaved work. Each store is removed only when it belongs
 * to `uid` (a shared Chromebook holds other students' too); the session queue
 * loses only this uid's runs dated `day`.
 */
export function purgeLocal(uid, day) {
    if (!uid) return;
    for (const key of LOCAL_STORES) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            let owner = null;
            try { const j = JSON.parse(raw); owner = j && (j.uid || (j.stats && j.stats.uid)); } catch (_) {}
            if (owner && owner !== uid) continue;
            localStorage.removeItem(key);
        } catch (_) {}
    }
    try {
        const raw = localStorage.getItem(SESSION_QUEUE);
        if (raw) {
            const q = JSON.parse(raw);
            const slot = q && q.owners && q.owners[uid];
            if (slot && Array.isArray(slot.records)) {
                slot.records = slot.records.filter(r => day && r.date !== day);
                if (!slot.records.length) delete q.owners[uid];
                localStorage.setItem(SESSION_QUEUE, JSON.stringify(q));
            }
        }
    } catch (_) {}
}

// ─── The listener ────────────────────────────────────────────────────────────
/**
 * Watch users/{uid}. Resolves after the FIRST snapshot has been handled (or
 * after `firstTimeoutMs` offline), so a page can await it before replaying any
 * write-ahead log.
 *
 *   first snapshot, wipe pending  → purgeLocal + ack. Nothing is loaded yet, so
 *                                   there is nothing to reload.
 *   first snapshot, 'today'       → left to the page's existing load-time check
 *                                   (statsWalRecoverChecked), unchanged.
 *   later snapshot, either kind   → lockSaves, purge, ack, onReload().
 *
 * Returns { stop } — the unsubscribe.
 */
export function watchAccount({ db, doc, onSnapshot, uid, today, onReload, onData = null,
                               firstTimeoutMs = 4000 }) {
    let first = true, stop = () => {};
    // ⚠️ IN-MEMORY HIGH-WATER MARKS. The acks live in localStorage, which a locked-
    // down browser may refuse; without these, every later write the STUDENT makes to
    // their own users doc (the ledger note, lastLockDay) would re-deliver the same
    // unacknowledged stamp and reload the page again. A stamp acts once per page.
    let seenWipe = 0, seenLogs = 0, seenProgress = 0;
    const handle = (snap) => {
        const data = snap && snap.exists && snap.exists() ? snap.data() : null;
        if (onData) { try { onData(data); } catch (e) { console.warn('[wipe] onData', e); } }
        let act = accountAction(data, uid, today());
        const wasFirst = first;
        first = false;
        if (act && !wasFirst) {
            if (act.kind === 'wipe' && act.wipeMs <= seenWipe) act = null;
            else if (act.kind === 'progress' && act.progressMs <= seenProgress) act = null;
            else if (act.kind === 'today' && act.logsMs <= seenLogs) {
                // The minutes stamp is old news; a fresh progress stamp may still ride along.
                act = (act.progress && act.progressMs > seenProgress) ? { kind: 'progress', progressMs: act.progressMs } : null;
            }
        }
        if (data) {
            seenWipe = Math.max(seenWipe, msOf(data.wipeAt));
            seenLogs = Math.max(seenLogs, msOf(data[LOGS_CHANGED_FIELD]));
            seenProgress = Math.max(seenProgress, msOf(data[PROGRESS_CHANGED_FIELD]));
        }
        if (!act) return;
        if (act.kind === 'wipe') {
            if (!wasFirst) lockSaves();
            purgeLocal(uid, act.day);
            ackWipe(uid, act.wipeMs);
            if (act.logsMs) ackTeacherChange(uid, act.logsMs);
            if (!wasFirst) onReload('wipe');
            return;
        }
        // Round 168 — lesson records changed: drop our copy (open or closed tab alike).
        if (act.progress || act.kind === 'progress') {
            if (!wasFirst) lockSaves();
            purgeProgress(uid);
            ackProgress(uid, act.progressMs);
            if (act.kind === 'progress') { if (!wasFirst) onReload('progress'); return; }
        }
        if (act.kind === 'today' && !wasFirst) {
            lockSaves();
            // Unsaved minutes only. Lesson progress and runs are kept: a single
            // deleted run is not a reason to throw away the student's lessons.
            for (const key of ['ttb_statswal_v1', 'ttb_hudCache_v2']) {
                try { localStorage.removeItem(key); } catch (_) {}
            }
            ackTeacherChange(uid, act.logsMs);
            onReload('today');
        }
    };
    const ready = new Promise((resolve) => {
        const timer = setTimeout(resolve, firstTimeoutMs);
        try {
            stop = onSnapshot(doc(db, 'users', uid),
                (snap) => {
                    // Our own pending writes echo back first; the stamp only ever
                    // arrives from the server, so those carry nothing to act on.
                    if (snap.metadata && snap.metadata.hasPendingWrites) return;
                    const wasFirst = first;
                    try { handle(snap); } catch (e) { console.warn('[wipe] snapshot', e); }
                    if (wasFirst) { clearTimeout(timer); resolve(); }
                },
                (err) => { console.warn('[wipe] listener', err); clearTimeout(timer); resolve(); });
        } catch (e) { console.warn('[wipe] could not listen', e); clearTimeout(timer); resolve(); }
    });
    return { ready, stop: () => { try { stop(); } catch (_) {} } };
}

// ─── Lesson records: the start-of-today snapshot ─────────────────────────────
//
// lessonProgress keeps ONE record per lesson and overwrites it on every run, so
// "undo today's lesson work" needs the record as it stood before today's first
// change. The first write of a record each day carries that state with it:
//   dayStartDate  'YYYY-MM-DD' of the snapshot
//   dayStartAt    ms when it was taken
//   dayStartJson  JSON of the record before today's first change, or 'null'
// ⚠️ A JSON STRING, NOT A MAP: lesson records are written with merge:true, and a
// merged map would keep stale keys from an older snapshot. A string is replaced
// whole.
// ⚠️ ZERO EXTRA WRITES — it rides in the setDoc the page was already making.

const DAYSTART_KEYS = ['dayStartDate', 'dayStartAt', 'dayStartJson'];

function _strip(rec) {
    if (!rec) return null;
    const o = { ...rec };
    for (const k of DAYSTART_KEYS) delete o[k];
    // An empty record is "never started" — a tombstone on restore, not a {} doc.
    return Object.keys(o).length ? o : null;
}

/**
 * `next` with the start-of-today snapshot attached. `prev` is the record BEFORE
 * this change (or undefined for a lesson never touched).
 * ⚠️ If prev was already changed today its snapshot is carried, never retaken —
 * retaking it would make "the start of the day" mean "the last run".
 */
export function withDayStart(prev, next, today, nowMs = Date.now()) {
    if (!next) return next;
    if (prev && prev.dayStartDate === today) {
        return { ...next, dayStartDate: prev.dayStartDate, dayStartAt: prev.dayStartAt,
                 dayStartJson: prev.dayStartJson };
    }
    return { ...next, dayStartDate: today, dayStartAt: nowMs,
             dayStartJson: JSON.stringify(_strip(prev) || null) };
}

/**
 * What reports.html writes back for a record changed on `day`: the start-of-day
 * record, or a TOMBSTONE when the lesson had no record before today (staff may
 * write lessonProgress but not delete it; the student's page deletes the
 * tombstone at its next load — see isTombstone()). null = leave it alone.
 */
export function restoreForWipe(rec, lessonId, day, nowIso = new Date().toISOString()) {
    if (!rec || rec.dayStartDate !== day) return null;
    let before = null;
    try { before = JSON.parse(rec.dayStartJson || 'null'); } catch (_) { return null; }
    if (before && typeof before === 'object') return _strip(before);
    return { lessonId, wipedAt: nowIso };
}

/** A record that is only a wipe's tombstone, i.e. "never started". */
export function isTombstone(rec) {
    if (!rec || !rec.wipedAt) return false;
    return !rec.passed && !rec.attempts && !rec.runAttempts && !rec.lastRunIdx
        && !rec.furthestRunIdx && !rec.grade;
}
