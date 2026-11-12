// req-scale.js v1.0.0 — Round 166. A STUDENT'S REQUIREMENTS, AS A PERCENTAGE.
//
// Jake, 2026-11-12: *"We probably need to look at per student and class exemptions for speed
// and accuracy - probably set at percentages. So if the requirement is 10%, I can go in and say
// 70%, which would make it 7%. My CDC kids are struggling, and I may need to make it easier for
// them. On the flipside, I have some kids who could use some challenge, so I could make their
// requirements 110%, so they have to be better (but not over 100%, obviously). This would also
// maintain the climb in requirements, as opposed to setting a specific wpm or accuracy for each
// lesson - which just sounds tedious."*
//
// ⭐ HIS RULINGS, SAME DAY
//   · Applies to: School lessons (pass bar + grades, both pages), Library's 15 WPM / 80% gate,
//     and the pace of Deadline in lessons.
//   · A student's own setting REPLACES the class's, field by field (speed and accuracy are
//     separate). Neither set → 100%.
//   · Students see only the adjusted numbers — never a percentage, never "adjusted".
//   · Reports grades against the student's own bar, with the setting in ITS OWN COLUMN.
//
// Stored as `reqSpeedPct` / `reqAccPct` on classes/{id} (the Class Manager) and users/{uid}
// (Reports → Requirements…). Absent = no adjustment. Rules v2.19.0: staff may set them, a
// student may not.
//
// ⚠️ ONE HOME (Rule 9). learn.js, learn2.js, game.js and reports.html all scale through
// scaleGates()/scaleWpm()/scaleAcc(). Pure — no DOM, no Firestore.

export const REQ_SCALE_VERSION = '1.0.0';

export const REQ_MIN_PCT = 25;
export const REQ_MAX_PCT = 200;

/** A stored percentage, or null for "not set". Whole numbers, clamped. */
export function cleanPct(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.min(REQ_MAX_PCT, Math.max(REQ_MIN_PCT, Math.round(n)));
}

/**
 * The percentages in force. Each field independently: the student's, else the class's,
 * else 100. `source` names where each came from, for Reports.
 */
export function resolveReq(classDoc, userDoc) {
    const c = classDoc || {}, u = userDoc || {};
    const pick = (field) => {
        const s = cleanPct(u[field]);
        if (s != null) return { pct: s, from: 'student' };
        const k = cleanPct(c[field]);
        if (k != null) return { pct: k, from: 'class' };
        return { pct: 100, from: 'none' };
    };
    const sp = pick('reqSpeedPct'), ac = pick('reqAccPct');
    return { speedPct: sp.pct, accPct: ac.pct, speedFrom: sp.from, accFrom: ac.from };
}

export const NO_SCALE = Object.freeze({ speedPct: 100, accPct: 100, speedFrom: 'none', accFrom: 'none' });

export function isAdjusted(req) {
    return !!req && (req.speedPct !== 100 || req.accPct !== 100);
}

/** A WPM requirement at this student's percentage. null (no speed gate) stays null. */
export function scaleWpm(wpm, req) {
    if (wpm == null) return wpm;
    const p = req ? req.speedPct : 100;
    if (p === 100) return wpm;
    return Math.round(wpm * p / 10) / 10;   // one decimal: 15 × 70% = 10.5
}

/** An accuracy requirement at this student's percentage — never above 100%. */
export function scaleAcc(acc, req) {
    if (acc == null) return acc;
    const p = req ? req.accPct : 100;
    if (p === 100) return acc;
    return Math.min(100, Math.round(acc * p / 100));
}

/** run-grade.js gatesForRun() output, scaled. strictSpeed is untouched. */
export function scaleGates(gates, req) {
    if (!gates) return gates;
    return { ...gates, minWPM: scaleWpm(gates.minWPM, req), minAccuracy: scaleAcc(gates.minAccuracy, req) };
}

/** A lesson's own `gates` block, scaled the same way (Deadline paces from it). */
export function scaleLessonGates(lg, req) {
    if (!lg) return lg;
    const out = { ...lg };
    if (lg.minWPM != null) out.minWPM = scaleWpm(lg.minWPM, req);
    if (lg.minAccuracy != null) out.minAccuracy = scaleAcc(lg.minAccuracy, req);
    return out;
}

/** Reports' column: "speed 70% · accuracy 90%", "" when nothing is adjusted. */
export function describeReq(req) {
    if (!isAdjusted(req)) return '';
    const parts = [];
    if (req.speedPct !== 100) parts.push('speed ' + req.speedPct + '%');
    if (req.accPct !== 100) parts.push('accuracy ' + req.accPct + '%');
    return parts.join(' · ');
}
