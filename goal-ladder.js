// goal-ladder.js v1.0.0 — WHERE A STUDENT'S DAILY/WEEKLY TARGET COMES FROM.
//
// v1.0.0 — Round 161. ⭐ A TARGET EXISTS ONLY WHEN SOMEONE ACTUALLY SET ONE.
//   Jake, 2026-11-02: a student was not in his class and nobody could tell —
//   the HUD read `Daily 9:22 / 10:00` exactly as it does for his own students,
//   because the 10:00 came from the site-wide `settings/goals` fallback. *"The
//   counting target is pretty arbitrary if you're not in my class. So my
//   thought was that the target time would not exist unless it actually
//   existed."* His rulings, same day:
//     · CLASS WINS. A student in a class gets the class's minutes — including
//       a class that sets none — and cannot override them.
//     · NO CLASS → the student's OWN goals, set in ⚙ Settings and saved on
//       their account (`users/{uid}.ownDailySeconds` / `ownWeeklySeconds`).
//     · NEITHER → NO TARGET. The HUD counts up with no denominator (hud.js
//       already renders that: `pair()` drops the `/ 0:00`).
//     · The site-wide minutes in reports.html are REMOVED. `settings/goals`
//       keeps `weekStartDay`, which classes still inherit.
//     · The missing denominator is the only signal on the HUD. Settings says
//       "No class assigned" explicitly. Jake: *"Should people want to use this
//       on their own, we don't need to rub their faces in the lack of class."*
//
// ⚠️ ONE HOME (Rule 9). game.js, learn.js, learn2.js and index.html each
// resolved minutes with their own copy of the ladder, and they had already
// drifted — index.html never read `settings/goals` while the other three did,
// so the landing page and the book disagreed about the same child's target.
// Every page now calls resolveMinuteGoals(). Pure, no DOM, no Firestore.
//
// ⚠️ NO FIRESTORE RULES CHANGE. The owner may already write any field of their
// own users doc except a forged name/email. These two fields only set the
// student's own denominator; nothing graded reads them.

export const GOAL_LADDER_VERSION = '1.0.0';

// The same caps reports.html used for the old site-wide inputs.
export const OWN_DAILY_MAX_MIN  = 120;
export const OWN_WEEKLY_MAX_MIN = 600;

// Whole minutes, clamped, as seconds. Anything that is not a finite positive
// number is 0 — "no goal" — never NaN, which hud.js would print.
export function cleanGoalSeconds(seconds, maxMinutes) {
    const n = Number(seconds);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(maxMinutes, Math.round(n / 60)) * 60;
}

// The ladder. `classDoc` is the class document's data when the student's class
// EXISTS (a classId pointing at a deleted class counts as no class), else null.
// `userDoc` is users/{uid}'s data, or null.
//
// Returns { dailySeconds, weeklySeconds, source: 'class' | 'own' | 'none' }.
export function resolveMinuteGoals({ classDoc = null, userDoc = null } = {}) {
    if (classDoc) {
        return {
            dailySeconds:  Math.max(0, Math.round(Number(classDoc.dailySeconds)  || 0)),
            weeklySeconds: Math.max(0, Math.round(Number(classDoc.weeklySeconds) || 0)),
            source: 'class',
        };
    }
    const u = userDoc || {};
    const dailySeconds  = cleanGoalSeconds(u.ownDailySeconds,  OWN_DAILY_MAX_MIN);
    const weeklySeconds = cleanGoalSeconds(u.ownWeeklySeconds, OWN_WEEKLY_MAX_MIN);
    if (dailySeconds || weeklySeconds) return { dailySeconds, weeklySeconds, source: 'own' };
    return { dailySeconds: 0, weeklySeconds: 0, source: 'none' };
}

// What a page writes (merge) to users/{uid} when a student saves their goals.
// Minutes in, clamped seconds out; blank or 0 clears that half.
export function ownGoalsPatch(dailyMinutes, weeklyMinutes) {
    return {
        ownDailySeconds:  cleanGoalSeconds((Number(dailyMinutes)  || 0) * 60, OWN_DAILY_MAX_MIN),
        ownWeeklySeconds: cleanGoalSeconds((Number(weeklyMinutes) || 0) * 60, OWN_WEEKLY_MAX_MIN),
    };
}

// "10 min a day · 50 min a week", for Settings. Empty string for no goals.
export function describeGoals(dailySeconds, weeklySeconds) {
    const fmt = (s) => { const m = Math.floor(s / 60); return m + ' min'; };
    const parts = [];
    if (dailySeconds  > 0) parts.push(fmt(dailySeconds)  + ' a day');
    if (weeklySeconds > 0) parts.push(fmt(weeklySeconds) + ' a week');
    return parts.join(' · ');
}
