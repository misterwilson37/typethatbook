// game-names.js v1.0.0 — THE GAME REGISTRY. Round 82 (Victor).
//
// ⚠️⚠️ THE ID AND THE TITLE ARE DIFFERENT THINGS AND THIS FILE IS WHY.
//
// The `id` is what goes into Firestore — the `game` field on a `game_scores`
// document, the composite index, every leaderboard query ever written. It is
// boring on purpose and IT MUST NEVER CHANGE, because changing it orphans every
// score a student has earned and needs a migration, not a deploy.
//
// The `title` is what a twelve-year-old reads. Jake named these on 2026-09-07
// after several rounds of brainstorming, and titles are exactly the kind of thing
// that gets a better idea eighteen months later. ⚠️ WITH THIS FILE, A RENAME IS
// ONE LINE. Without it, the title would have been spelled into three views, a
// modal, a leaderboard header and a Firestore field, and the sixth copy would be
// the one nobody found.
//
// ⚠️ THIS IS ALSO WHY THE FILES ARE `game-escape.js` AND `game-deadline.js`
// RATHER THAN `game-escape-key.js` AND SO ON. Filenames are ids too.

export const GAME_NAMES_VERSION = '1.0.0';

/**
 * ⚠️ `id` VALUES ARE FROZEN. Add games; never rename these strings.
 */
export const GAMES = {
    escape: {
        id: 'escape',
        title: 'Escape Key',
        // Jake, 2026-09-07: *"Escape Key is brilliant. That is now the name."*
        // It is a real key, it is literally what the game is about, and the words
        // the student types ARE their escape keys.
        tagline: 'Type your way out. Standing still is not an option.',
        kind: 'throughput',   // was 'cadence' until the row/column spawn rule
        // ⚠️⚠️ ARCADE-ONLY FOR NOW, BY JAKE'S RULING (2026-09-07): *"I'm leaning
        // toward arcade for now, but time typed should still count."*
        //
        // ⚠️ THIS IS A PRODUCT DECISION, NOT A CAPABILITY ONE. Escape Key CAN be
        // graded — escape-board-test.mjs Part B proves a camper loses all three
        // shields on 40 of 40 seeds, so its WPM is a typing measurement rather
        // than a patience one, and Part B is what would earn it the graded path.
        // Flip this to `true` and it works; nothing else has to change.
        //
        // ⚠️ AND THE CAMPER TEST STILL MATTERS WHILE THIS IS false, because
        // `countsTime` is true: a student who could stand still and bank minutes
        // for zero characters would be farming the daily clock. Do not treat
        // Part B as dead weight just because the grade is off.
        assessed: false,
        countsTime: true,
        module: './game-escape.js',
    },
    deadline: {
        id: 'deadline',
        title: 'Deadline',
        // Words fall toward a line at the bottom of the screen. Cross it and the
        // city is gone. Also what every writer calls time pressure, and a real
        // newspaper-press term, which keeps it in this app's world rather than
        // Atari's.
        tagline: 'Words are falling on Nashville. Beat the deadline.',
        kind: 'throughput',
        // The assessed one: replaces the FINAL run of a lesson, and reads that
        // run's real gates through run-grade.js's gatesForRun().
        assessed: true,
        countsTime: true,
        module: './game-deadline.js',
    },
    shatter: {
        id: 'shatter',
        title: 'Shatter',
        // ⚠️ NOT BUILT YET. Registered so the leaderboard schema and the lab page
        // can be written once. See HANDOFF-games.md §6.
        tagline: 'Break the long words into pieces before they reach you.',
        kind: 'throughput',
        assessed: false,
        countsTime: true,
        module: './game-shatter.js',
        unbuilt: true,
    },
};

/** Ids in the order they should be offered to a student. */
export const GAME_ORDER = ['deadline', 'escape', 'shatter'];

// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ WHERE THE ARCADE IS REACHED FROM (Jake's ruling, 2026-09-07)
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake: *"Both. A tile on the library page (school, library, arcade) as well as
// an option on the school page to practice everything they've learned so far. I
// wouldn't make it too obvious, as I want school to come first (have tos before
// want tos), but I'm not sure gating it to a day makes sense yet."*
//
// ⚠️ NEITHER ENTRY POINT IS BUILT. This constant exists so the intent is recorded
// next to the registry rather than only in a handoff, and so the two surfaces
// cannot drift into disagreeing about what the arcade is called.
//
// ⚠️ "NOT TOO OBVIOUS" IS A REQUIREMENT, NOT A STYLE NOTE — have-tos before
// want-tos. The arcade is a third tile beside School and Library, not a banner,
// and on the school page it is an option rather than a call to action.
//
// ⚠️ NO DAY GATING. Jake is explicitly undecided, so nothing here may assume a
// Friday. Do not add a weekday check without asking; a game that silently
// disappears on a Tuesday reads as broken.
export const ARCADE_ENTRY = {
    libraryTile: { label: 'Arcade', prominence: 'equal-third',
                   note: 'beside School and Library, same weight, not louder' },
    schoolOption: { label: 'Practice everything you know',
                    prominence: 'secondary',
                    note: 'an option on the school page, below the lesson path' },
    dayGated: false,
};

/** The ones that exist today. */
export function builtGames() {
    return GAME_ORDER.map(id => GAMES[id]).filter(g => g && !g.unbuilt);
}

/**
 * Title for an id, for any surface that needs to print one.
 * ⚠️ AN UNKNOWN ID RETURNS THE ID, NOT 'Unknown'. A leaderboard row for a game
 * this build has never heard of should still say something true.
 */
export function titleOf(id) {
    return (GAMES[id] && GAMES[id].title) || String(id || '');
}

/** Is this id allowed to write an assessed result? */
export function isAssessed(id) {
    return !!(GAMES[id] && GAMES[id].assessed);
}
