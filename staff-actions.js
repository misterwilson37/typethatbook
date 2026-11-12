// staff-actions.js v1.0.0 — Round 167. THE STAFF WRITES, IN ONE PLACE.
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

export const STAFF_ACTIONS_VERSION = '1.0.0';

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
