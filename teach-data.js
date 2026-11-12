// teach-data.js v1.0.0 — Round 167. THE NUMBERS BEHIND teach.html, PURE.
//
// Jake, 2026-11-12, asking for one staff page instead of Reports + Admin: *"The active students
// pop up at the top of today, and I can see flags in that moment (hopefully without adding too
// many reads). Click on the individual and see what they've done, when they've done it, and how
// much time they've spent. Edit as I need to. Class struggling? Click on it... Export the CSV
// for the class from the class page or for the whole school... I know I want to be able to
// export one csv for all my classes at once."*
//
// ⚠️ THE NUMBERS ARE THE STUDENT'S OWN. A day's total is daylog.js totalsOf() — the function
// the student's HUD uses — never a local copy. Reports kept a copy and it silently dropped every
// Arcade minute until Round 167 (tests/week-agreement-test.mjs now drives Arcade days).
//
// ⚠️ THE CSV IS REPORTS' CSV. Same first nine columns, same formatting, same WPM and accuracy
// arithmetic, so a gradebook built on Reports' export reads this one unchanged. A `Class`
// column is APPENDED (tenth) for multi-class exports.
//
// No DOM, no Firestore. tests/teach-data-test.mjs drives all of it.

import { totalsOf, weekStartOf } from './daylog.js';

export const TEACH_DATA_VERSION = '1.0.0';

/** Reports' own format, verbatim: "1h 5m", "12m 30s", "0m 0s". */
export function formatTime(secs) {
    if (!secs) return '0m 0s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
}

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Every date from a to b inclusive (capped at 400, as Reports caps it). */
export function datesInRange(a, b) {
    const out = [];
    const d = new Date(a + 'T12:00:00'), end = new Date(b + 'T12:00:00');
    if (isNaN(d) || isNaN(end) || d > end) return out;
    let guard = 0;
    while (d <= end && guard++ < 400) { out.push(ymd(d)); d.setDate(d.getDate() + 1); }
    return out;
}

/** "This week", "Last week" and "Today" for a class's week anchor (0=Sun … 6=Sat). */
export function rangePreset(which, todayStr, anchor = 6) {
    if (which === 'today') return { start: todayStr, end: todayStr };
    const start = weekStartOf(todayStr, anchor);
    if (which === 'week') return { start, end: todayStr };
    const s = new Date(start + 'T12:00:00'); s.setDate(s.getDate() - 7);
    const e = new Date(start + 'T12:00:00'); e.setDate(e.getDate() - 1);
    return { start: ymd(s), end: ymd(e) };   // 'last'
}

/** WPM and accuracy exactly as Reports computes them. */
export function rates(chars, mistakes, seconds) {
    return {
        wpm: seconds > 0 ? Math.round((chars / 5) / (seconds / 60)) : 0,
        accuracy: (chars + mistakes) > 0 ? Math.round((chars / (chars + mistakes)) * 100) : 100,
    };
}

/** One typing_logs document → that day's totals and its three sources. */
export function dayRow(data, date) {
    const t = totalsOf(data, date);
    const d = data || {};
    return {
        date, ...t, ...rates(t.chars, t.mistakes, t.seconds),
        library: d.secondsLibrary || 0, school: d.secondsSchool || 0, arcade: d.secondsArcade || 0,
        lastUpdated: d.lastUpdated || null,
    };
}

// Reports' idle-farming flag, same constants: ≥ 60 s credited at < 15 characters a minute.
export const IDLE_FARM_CPM = 15;
export const IDLE_FARM_MIN_SECONDS = 60;
export function idleSuspect(seconds, chars) {
    const sec = Number(seconds) || 0;
    if (sec < IDLE_FARM_MIN_SECONDS) return false;
    return ((Number(chars) || 0) / (sec / 60)) < IDLE_FARM_CPM;
}

/**
 * Fold day documents into one row per student.
 *   docs:   [{ uid, date, data }]
 *   people: Map uid → { name, email, classId }   (the roster; students with no days get a 0 row)
 * Returns [{ uid, name, email, classId, seconds, chars, mistakes, days, wpm, accuracy, dailyLogs }].
 */
export function rollUp(docs, people) {
    const by = new Map();
    const ensure = (uid, hint) => {
        if (!by.has(uid)) {
            const p = (people && people.get(uid)) || {};
            by.set(uid, { uid, name: p.name || (hint && hint.displayName) || 'Unknown',
                          email: p.email || (hint && hint.email) || '', classId: p.classId || (hint && hint.classId) || '',
                          seconds: 0, chars: 0, mistakes: 0, days: 0, dailyLogs: [] });
        }
        return by.get(uid);
    };
    if (people) for (const uid of people.keys()) ensure(uid);
    const seen = new Set();
    for (const { uid, date, data } of docs) {
        const key = uid + '_' + date;
        if (!uid || seen.has(key)) continue;   // one document per student-day, however it was found
        seen.add(key);
        const u = ensure(uid, data);
        const r = dayRow(data, date);
        u.seconds += r.seconds; u.chars += r.chars; u.mistakes += r.mistakes;
        // ⚠️ AS REPORTS COUNTS IT: a day is "active" when its document exists, and the
        // name and email on the day's document win over the roster's.
        u.days++;
        u.dailyLogs.push(r);
        if (data && data.displayName) u.name = data.displayName;
        if (data && data.email) u.email = data.email;
    }
    return [...by.values()].map(u => ({ ...u, ...rates(u.chars, u.mistakes, u.seconds),
        dailyLogs: u.dailyLogs.sort((a, b) => a.date.localeCompare(b.date)) }));
}

function csvCell(cell) {
    const str = String(cell == null ? '' : cell);
    return (str.includes(',') || str.includes('"') || str.includes('\n'))
        ? `"${str.replace(/"/g, '""')}"` : str;
}

export const CSV_HEADERS = ['Name', 'Email', 'Total Seconds', 'Total Time', 'Characters', 'Avg WPM',
                            'Accuracy %', 'Days Active', 'Adjusted'];

/**
 * Reports' CSV. `classNameOf(classId)` given → a Class column is APPENDED and rows sort by
 * class, then name — one file for all of a teacher's classes. Without it, by name.
 */
export function toCsv(rows, { classNameOf = null, adjustedOf = () => '' } = {}) {
    const headers = classNameOf ? [...CSV_HEADERS, 'Class'] : CSV_HEADERS;
    const sorted = [...rows].sort((a, b) => {
        if (classNameOf) {
            const c = String(classNameOf(a.classId) || '').localeCompare(String(classNameOf(b.classId) || ''));
            if (c) return c;
        }
        return String(a.name || '').localeCompare(String(b.name || ''));
    });
    let csv = headers.join(',') + '\n';
    for (const r of sorted) {
        const row = [r.name, r.email, r.seconds, formatTime(r.seconds), r.chars, r.wpm, r.accuracy,
                     r.days, adjustedOf(r) || ''];
        if (classNameOf) row.push(classNameOf(r.classId) || '');
        csv += row.map(csvCell).join(',') + '\n';
    }
    return csv;
}

/** "3 min ago" from a Firestore Timestamp / Date / ms. '' when unknown. */
export function agoText(v, nowMs = Date.now()) {
    let ms = 0;
    if (v && typeof v.toMillis === 'function') ms = v.toMillis();
    else if (v instanceof Date) ms = v.getTime();
    else if (typeof v === 'number') ms = v;
    else if (v && typeof v.seconds === 'number') ms = v.seconds * 1000;
    if (!ms) return '';
    const m = Math.round((nowMs - ms) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60);
    return h + ' h ago';
}
