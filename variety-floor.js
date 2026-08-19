// variety-floor.js v1.0.0
//
// v1.0.0 — Extracted from game.js's `_qualifyingPracticeChars()` (v3.27.1) and
//          learn.js's `_qualifyingRemediationChars()` (v2.12.0). Both were the
//          same nine lines with different names: given a map of missed
//          characters to how many times each was missed, filter to the ones
//          that clear a per-character threshold, sorted worst-first. Round 15
//          and Round 16 shipped that logic twice, in the two monoliths, and
//          both left a note flagging the duplication as worth closing if it
//          became a pattern. It did — same numbers, same shape, two files —
//          so this is the fifth shared module, after firebase-config.js,
//          stats-wal.js, session-log.js and hud.js.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS GUARDS AGAINST
// ═══════════════════════════════════════════════════════════════════════════
//
// Both game.js's ✨ AI-practice button and learn.js's 🎲 "Practice missed
// keys" button used to unlock off a single missed character, however many
// times it was missed. A dominant, common letter — Jake's example was a
// student who'd really only missed "F" — could unlock either one: an easy,
// fast paragraph or an easy, fast drill, banking time without remediating
// anything. The fix in both files is the same shape: require at least
// MIN_QUALIFYING different characters, each missed at least CHAR_MISS_THRESHOLD
// times, before either button offers or fires.
//
// This module holds ONLY the filter. It does not know about buttons, DOM,
// Gemini, or drills — game.js and learn.js each keep their own threshold
// constants (currently equal, at 3 and 3, but they are two separate tuning
// knobs for two separate features that happen to agree today, not one
// shared constant) and their own call sites.

export const VARIETY_FLOOR_VERSION = "1.0.0";

// Given a map of { char: missCount } and a per-character threshold, return
// the qualifying [char, count] pairs, worst-missed first. Missing or
// non-object input degrades to "nothing qualifies" rather than throwing —
// the callers gate a button on the result and a thrown error there is worse
// than an under-populated one.
export function qualifyingChars(missedMap, threshold) {
    return Object.entries(missedMap || {})
        .filter(([, n]) => n >= threshold)
        .sort((a, b) => b[1] - a[1]);
}

// Convenience wrapper for the one-line check both call sites actually want:
// "has this student missed enough DIFFERENT characters to unlock this?"
export function hasVarietyFloor(missedMap, threshold, minQualifying) {
    return qualifyingChars(missedMap, threshold).length >= minQualifying;
}
