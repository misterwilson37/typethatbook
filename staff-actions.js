// staff-actions.js v1.1.0 — Round 167. THE STAFF WRITES, IN ONE PLACE.
//
// v1.1.0 — Round 168: deleteRunAttempt() (a whole run, its time AND — via lesson-undo.js — its
//          lesson credit), setDayTime() (Reports' manual save, Arcade now cleared too), and
//          clearLessonMastery() (Reports' clear, now telling the student's open page).
//
// Reports and the new Teach page (teach.html) both wipe a student's day and set a student's
// requirement percentages. Two copies of a write is how this project's numbers have drifted
// before (Rule 9 — see the Arcade total Round 167 found in reports.html), so the writes live
// here and both pages call them. Firestore functions are INJECTED (`fs`), so this module has no
// opinion about which SDK build a page loaded, and a harness can drive it with a fake.
//
//   wipeToday({ db, fs, uid, isSuper, day })      Round 164's "Wipe today", moved here verbatim
//   saveStudentReq({ db, fs, uid, speed, acc })   Round 166's student percentages
//   classReqPatch(speedRaw, accRaw, isEdit)       Round 166's class percentages, validated
//
// fs = { doc, getDoc, getDocs, query, where, collection, setDoc, updateDoc, deleteDoc,
//        deleteField, serverTimestamp }

import { restoreForWipe } from './day-wipe.js';

export const STAFF_ACTIONS_VERSION = '1.1.0';

export const WIPE_TIME_FIELDS = ['seconds', 'chars', 'mistakes',
    'secondsLibrary', 'charsLibrary', 'mistakesLibrary',
    'secondsSchool', 'charsSchool', 'mistakesSchool',
    'secondsArcade', 'charsArcade', 'mistakesArcade'];

// ═════════════════════════════════════════════════════════════════════════════
// WIPE TODAY (day-wipe.js has the whole mechanism).
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ TODAY ONLY, BY CONSTRUCTION. Every query is `date == day` or `dayStartDate == day`;
// the minutes doc is `{uid}_{day}` by id; a lesson goes back to the snapshot its first
// change THAT DAY took. No other day is read for writing, so no other day can be touched.
// ⚠️ TWO PASSES AROUND THE STAMP: a save an open tab made between the zeroing and the stamp
// is removed by the second pass, three seconds after the stamp, by which time the tab has
// locked its saves and is reloading.
export async function wipeToday({ db, fs, uid, isSuper, day, pauseMs = 3000 }) {
    const { doc, getDoc, getDocs, query, where, collection, setDoc, updateDoc, deleteDoc,
            serverTimestamp } = fs;
    const got = { runs: 0, seconds: 0, lessons: 0 };
    async function pass(first) {
        // 1. That day's runs.
        const ss = await getDocs(query(collection(db, 'typing_sessions'),
            where('uid', '==', uid), where('date', '==', day)));
        for (const d of ss.docs) {
            const s = d.data();
            const sprints = Array.isArray(s.sprints) ? s.sprints : [];
            if (!sprints.length && !s.seconds) continue;
            if (first) got.runs += sprints.length || 1;
            if (isSuper) await deleteDoc(d.ref);
            else await updateDoc(d.ref, { sprints: [], sprintCount: 0, seconds: 0,
                                          chars: 0, mistakes: 0, wpm: 0, accuracy: 100 });
        }
        // 2. That day's minutes — every source's fields on its one document.
        const ref = doc(db, 'typing_logs', uid + '_' + day);
        const ls = await getDoc(ref);
        if (ls.exists()) {
            const L = ls.data();
            if (first) got.seconds = (L.secondsLibrary || 0) + (L.secondsSchool || 0)
                + (L.secondsArcade || 0) + (L.seconds || 0);
            const zero = {};
            for (const k of WIPE_TIME_FIELDS) if (k in L && L[k]) zero[k] = 0;
            if (Object.keys(zero).length) await updateDoc(ref, { ...zero, lastUpdated: new Date() });
        }
        // 3. Lessons changed that day → back to how they stood that morning.
        const ps = await getDocs(query(collection(db, 'users', uid, 'lessonProgress'),
            where('dayStartDate', '==', day)));
        for (const d of ps.docs) {
            const back = restoreForWipe(d.data(), d.id, day);
            if (!back) continue;
            if (first) got.lessons++;
            await setDoc(d.ref, back);   // a full replace, never a merge
        }
    }
    await pass(true);
    // The signal. Rules v2.18.0. An open tab hears it in a second or two.
    try {
        await updateDoc(doc(db, 'users', uid), {
            logsChangedAt: serverTimestamp(), logsChangedDay: day,
            wipeAt: serverTimestamp(), wipeDay: day,
        });
    } catch (e) {
        got.noSignal = true;
        console.warn('[wipe] stamp refused — are rules v2.18.0 published?', e);
        return got;
    }
    await new Promise(r => setTimeout(r, pauseMs));
    await pass(false);
    return got;
}

// ═════════════════════════════════════════════════════════════════════════════
// REQUIREMENT PERCENTAGES (req-scale.js). Rules v2.19.0.
// ═════════════════════════════════════════════════════════════════════════════

/** One typed box → { del } | { v } | { bad }. Blank means "follow the class / standard". */
export function readPctInput(raw) {
    const t = String(raw == null ? '' : raw).trim();
    if (t === '') return { del: true };
    const n = Number(t);
    if (!Number.isInteger(n) || n < 25 || n > 200) return { bad: true };
    return { v: n };
}

/** Save a student's own percentages. Returns { ok, error, values }. */
export async function saveStudentReq({ db, fs, uid, speed, acc }) {
    const sp = readPctInput(speed), ac = readPctInput(acc);
    if (sp.bad || ac.bad) return { ok: false, error: 'Use whole numbers from 25 to 200, or leave blank.' };
    const patch = { reqSpeedPct: sp.del ? fs.deleteField() : sp.v,
                    reqAccPct:   ac.del ? fs.deleteField() : ac.v };
    try {
        await fs.updateDoc(fs.doc(db, 'users', uid), patch);
    } catch (e) {
        return { ok: false, error: 'Could not save: ' + (e.message || e) + ' (are Firestore rules v2.19.0 published?)' };
    }
    return { ok: true, values: { reqSpeedPct: sp.del ? undefined : sp.v, reqAccPct: ac.del ? undefined : ac.v } };
}

/**
 * A class's percentages as a merge patch. On an edit a blank box REMOVES the key
 * (deleteField) — merge:true never removes a key it isn't given. { error } on bad input.
 */
export function classReqPatch(fs, speedRaw, accRaw, isEdit) {
    const out = {}, cleared = [];
    for (const [raw, key] of [[speedRaw, 'reqSpeedPct'], [accRaw, 'reqAccPct']]) {
        const r = readPctInput(raw);
        if (r.bad) return { error: 'Requirements must be whole numbers from 25 to 200 (or blank).' };
        if (r.del) { if (isEdit) { out[key] = fs.deleteField(); cleared.push(key); } }
        else out[key] = r.v;
    }
    return { patch: out, cleared };
}

// ═════════════════════════════════════════════════════════════════════════════
// Round 168 — RUN, DAY AND MASTERY EDITS (Teach's student page)
// ═════════════════════════════════════════════════════════════════════════════

/** Reports' identity for one sprint inside a session — at, detail, seconds, chars. */
export const sprintKeyOf = (sp) => [sp.at || '', sp.detail || '', sp.seconds || 0, sp.chars || 0].join('\u0001');

// The day-log fields a source owns, and the cutover after which they are the live ones.
const SRC = {
    school:  ['secondsSchool', 'charsSchool', 'mistakesSchool'],
    library: ['secondsLibrary', 'charsLibrary', 'mistakesLibrary'],
};

/**
 * The patch that takes `t` = { seconds, chars, mistakes } off a day document for one source.
 * After the cutover the source's own fields are live; before it (or when they are absent) the
 * flat triple is. Never below zero.
 */
export function subtractFromDay(data, source, t, splitCutover, date) {
    const d = data || {};
    const own = SRC[source];
    const useSplit = own && date >= splitCutover && (own[0] in d);
    const [fs, fc, fm] = useSplit ? own : ['seconds', 'chars', 'mistakes'];
    return {
        [fs]: Math.max(0, (d[fs] || 0) - (t.seconds || 0)),
        [fc]: Math.max(0, (d[fc] || 0) - (t.chars || 0)),
        [fm]: Math.max(0, (d[fm] || 0) - (t.mistakes || 0)),
    };
}

/**
 * Delete ONE run attempt — all of its fragments — from a student's day:
 *   1. its sprints out of their typing_sessions documents (totals recomputed, as Reports does)
 *   2. its time off that day's minutes, for its own source (delta, not a rebuild)
 *   3. if `lessonRecord` is given (lesson-undo.js), the lesson record replaced with it
 *   4. the stamp, so the student's open page reloads (today) and drops its lesson copy
 * members: the attempt's sprints, each carrying `_sid` (its session's id) and `_source`.
 */
export async function deleteRunAttempt({ db, fs, uid, date, members, totals, source, splitCutover,
                                         lessonId = null, lessonRecord = null, isSuper }) {
    const { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } = fs;
    const bySession = new Map();
    for (const m of members) {
        if (!bySession.has(m._sid)) bySession.set(m._sid, new Set());
        bySession.get(m._sid).add(sprintKeyOf(m));
    }
    let removed = 0;
    for (const [sid, keys] of bySession) {
        const ref = doc(db, 'typing_sessions', sid);
        const snap = await getDoc(ref);
        if (!snap.exists()) continue;
        const s = snap.data();
        const sprints = Array.isArray(s.sprints) ? s.sprints : [];
        const kept = sprints.filter(sp => !keys.has(sprintKeyOf(sp)));
        removed += sprints.length - kept.length;
        if (kept.length === sprints.length) continue;
        if (!kept.length && isSuper) { await deleteDoc(ref); continue; }
        const secs  = kept.reduce((a, sp) => a + (sp.seconds  || 0), 0);
        const chars = kept.reduce((a, sp) => a + (sp.chars    || 0), 0);
        const miss  = kept.reduce((a, sp) => a + (sp.mistakes || 0), 0);
        await updateDoc(ref, {
            sprints: kept, sprintCount: kept.length, seconds: secs, chars, mistakes: miss,
            wpm: secs > 0 ? Math.round((chars / 5) / (secs / 60)) : 0,
            accuracy: (chars + miss) > 0 ? Math.round((chars / (chars + miss)) * 100) : 100,
        });
    }
    const logRef = doc(db, 'typing_logs', uid + '_' + date);
    const log = await getDoc(logRef);
    if (log.exists()) {
        await updateDoc(logRef, { ...subtractFromDay(log.data(), source, totals, splitCutover, date),
                                  lastUpdated: new Date() });
    }
    if (lessonId && lessonRecord) {
        await setDoc(doc(db, 'users', uid, 'lessonProgress', lessonId), lessonRecord);   // full replace
    }
    const stamp = { logsChangedAt: serverTimestamp(), logsChangedDay: date };
    if (lessonId && lessonRecord) stamp.progressChangedAt = serverTimestamp();
    await updateDoc(doc(db, 'users', uid), stamp);
    return { removed };
}

/**
 * Reports' manual "set this day's time": the day becomes one flat number. ⚠️ Round 168 —
 * the ARCADE fields are cleared too (Reports' version left them, so a corrected day still
 * added its Arcade minutes on top of the number the teacher typed).
 */
export async function setDayTime({ db, fs, uid, date, seconds, chars, mistakes }) {
    const { doc, updateDoc, deleteField, serverTimestamp } = fs;
    await updateDoc(doc(db, 'typing_logs', uid + '_' + date), {
        seconds, chars, mistakes,
        secondsLibrary: deleteField(), charsLibrary: deleteField(), mistakesLibrary: deleteField(),
        secondsSchool:  deleteField(), charsSchool:  deleteField(), mistakesSchool:  deleteField(),
        secondsArcade:  deleteField(), charsArcade:  deleteField(), mistakesArcade:  deleteField(),
        lastUpdated: new Date(),
    });
    await updateDoc(doc(db, 'users', uid), { logsChangedAt: serverTimestamp(), logsChangedDay: date });
}

/**
 * Reports' "Clear mastery": every run in the lesson goes back to being graded (runScores and
 * runLocks removed; grades, fireballs and attempts kept), and the student's reach-back clock
 * (lastLockDay) is re-derived from whatever mastery is left. ⚠️ Round 168 — and the student's
 * open page is told (progressChangedAt), or its next flush would put the scores straight back.
 * Returns { lockNote } — '' on success, a sentence when lastLockDay could not be re-derived.
 */
export async function clearLessonMastery({ db, fs, uid, lessonId }) {
    const { doc, getDocs, collection, updateDoc, deleteField, serverTimestamp } = fs;
    await updateDoc(doc(db, 'users', uid, 'lessonProgress', lessonId), {
        runScores: deleteField(), runLocks: deleteField(),
    });
    let lockNote = '';
    try {
        let maxLock = null;
        const all = await getDocs(collection(db, 'users', uid, 'lessonProgress'));
        all.forEach(d => Object.values(d.data().runLocks || {}).forEach(v => {
            const n = Number(v);
            if (Number.isFinite(n) && (maxLock === null || n > maxLock)) maxLock = n;
        }));
        await updateDoc(doc(db, 'users', uid), { lastLockDay: maxLock === null ? deleteField() : maxLock });
    } catch (e) {
        lockNote = 'Mastery cleared, but the reach-back clock could not be recalculated (' + (e.message || e) + ').';
    }
    try { await updateDoc(doc(db, 'users', uid), { progressChangedAt: serverTimestamp() }); }
    catch (e) { lockNote = (lockNote ? lockNote + ' ' : '') + 'Their open page was not told (are rules v2.20.0 published?).'; }
    return { lockNote };
}

/**
 * Round 168 — Reports' sign-in step, shared: a staff role pre-authorised for this email
 * (pendingStaffRoles/{email}) is claimed onto staff/{uid}, so a new teacher's FIRST page can
 * be Teach. Never throws.
 */
export async function claimPendingRole({ db, fs, user }) {
    const { doc, getDoc, setDoc, deleteDoc } = fs;
    try {
        const lower = String(user.email || '').toLowerCase();
        if (!lower) return;
        const pend = await getDoc(doc(db, 'pendingStaffRoles', lower));
        if (!pend.exists()) return;
        const p = pend.data();
        await setDoc(doc(db, 'staff', user.uid), {
            email: lower, displayName: user.displayName || '',
            role: p.role, schoolIds: p.schoolIds, readScope: p.readScope, active: true,
        }, { merge: true });
        await deleteDoc(doc(db, 'pendingStaffRoles', lower));
    } catch (e) { console.warn('Could not claim a pre-authorised role:', e); }
}

/** Round 168 — has this staff member confirmed school consent (Reports' COPPA attestation)? */
export async function hasCoppaAttestation({ db, fs, uid, version = 'v1' }) {
    const localKey = `ttb_coppa_attested_${uid}_${version}`;
    try { if (localStorage.getItem(localKey) === '1') return true; } catch (_) {}
    try {
        const s = await fs.getDoc(fs.doc(db, 'coppaAttestations', `${uid}_${version}`));
        if (s.exists()) { try { localStorage.setItem(localKey, '1'); } catch (_) {} return true; }
        return false;
    } catch (_) { return true; }   // a failed check never blocks; Reports asks next visit
}
