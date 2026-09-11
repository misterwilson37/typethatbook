// game-names.js v1.3.0 — Round 116 (Sun): ⭐ SHARDS, the fourth cabinet and the
// second Shatter. Same view, different board. ⚠️ THE REGISTRY IS THE LAST STEP
// OF BUILDING A GAME, NOT A NOTE ABOUT ONE — see the `unbuilt` note below, which
// kept a finished Shatter out of every picker for eleven rounds.
// game-names.js v1.2.0 — Round 114 (Carriage). TWO CHANGES, ONE ROOT CAUSE:
//   • Shatter is no longer flagged `unbuilt`. The view shipped in Round 103 and
//     this flag kept it out of every picker for eleven rounds, defended the
//     whole time by a green assertion in game-assumptions-test.mjs.
//   • ⭐ panelOptionsFor() and usesThreatBoard() — the console wiring, as a
//     VALUE. It lived as an object literal inside arcade.html, which imports
//     firebase-config.js, so no harness could import it and the only available
//     check was a regex over source text. That check PASSED against the exact
//     shipped bug (Deadline receiving no panels on the free-play path), because
//     a regex cannot see control flow. Extracting it is what made the defect
//     testable; see that function's header.
//   ⚠️ BOTH ARE THE SAME SHAPE: a fact about the world recorded in a second
//   place, going stale where nothing could check it.
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

export const GAME_NAMES_VERSION = '1.3.0';

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
        // ⚠️ THE LEFT PANEL'S OPTION NAME, NOT THE PANEL ITSELF. See `panels`
        // below and panelOptionsFor().
        panels: { left: 'previewCanvas', threat: false },
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
        // ⚠️ THE ONLY GAME WITH A THREAT BOARD, because it is the only one with
        // landmarks to lose. The other two accept no such option.
        panels: { left: 'radarCanvas', threat: true },
    },
    shatter: {
        id: 'shatter',
        title: 'Shatter',
        // ⚠️⚠️ `unbuilt: true` SAT HERE FOR ELEVEN ROUNDS AFTER THE GAME WAS
        // FINISHED, AND IT IS THE WHOLE REASON JAKE COULD NOT PLAY IT. Round 103
        // built `game-shatter.js`; Rounds 106 and 109 took it to v1.2.0 with both
        // side panels wired — and nobody came back to this object. `fillGames()`
        // skips any game carrying the flag, so the picker never offered Shatter
        // and there was no error to notice: the option was simply absent.
        //
        // ⭐ THE REGISTRY IS THE LAST STEP OF BUILDING A GAME, NOT A NOTE ABOUT
        // ONE. A view that exists and a registry that denies it is the same class
        // of defect as a `countsTime: true` on a view that emitted no seconds —
        // a promise in one file with nothing behind it in another.
        // ⚠️ AND A HARNESS WAS PINNING IT: game-assumptions-test.mjs asserted
        // `unbuilt === true`, so the bug had a passing test defending it. See
        // that file's Part on the registry for the corrected assertion.
        tagline: 'Break the long words into pieces before they reach you.',
        kind: 'throughput',
        assessed: false,
        countsTime: true,
        module: './game-shatter.js',
        panels: { left: 'panelCanvas', threat: false },
    },
    shards: {
        // ⚠️⚠️ THE ID IS FROZEN THE MOMENT THIS SHIPS — it is the `game` field on
        // every `game_scores` document Shards ever writes. Jake named it on
        // 2026-09-11; Round 116 renamed game-draw.js's glass-particle field
        // `shard` → `sliver` beforehand so the word means one thing in this repo.
        id: 'shards',
        // ⭐ NOT "SHATTER 2". Jake's, and better than the `drift` proposed to
        // him: the two cabinets share everything except motion, so *Shatter /
        // Shards* says "same world, different physics" where *Drift* would say
        // "different game". ⚠️ AND A SEQUEL NUMBER WOULD BIAS THE EXPERIMENT —
        // the whole point of offering both is to find out which one a class
        // actually prefers, and "2" tells a twelve-year-old the answer.
        title: 'Shards',
        tagline: 'The same glass, drifting. Nothing lands — it comes back around.',
        kind: 'throughput',
        assessed: false,
        countsTime: true,
        // ⚠️⚠️ THE SAME VIEW AS SHATTER, ON PURPOSE. `game-shatter.js` takes a
        // `drift` flag and swaps `ShatterBoard` for `ShardsBoard`; everything
        // else — the glass, the prism, the panels, the HUD — is one file. A
        // second view would be Rule 5, and every change to the art would have to
        // be made twice. See shatter-shards.js's header.
        module: './game-shatter.js',
        drift: true,
        panels: { left: 'panelCanvas', threat: false },
    },
};

/** Ids in the order they should be offered to a student. */
// ⚠️ SHARDS SITS NEXT TO SHATTER, LAST. They are a pair and a student choosing
// between them should see them side by side; putting the new one first would
// also be a recommendation nobody made.
export const GAME_ORDER = ['deadline', 'escape', 'shatter', 'shards'];

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

// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THE CONSOLE WIRING, AS A VALUE. Round 114 (Carriage).
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-10: *"there are no active consoles on deadline."* The panels had
// existed since Round 94 with 141 assertions behind them; `playFree()` in
// arcade.html simply never handed Deadline any canvases. It listed a spread for
// `shatter` and a spread for `escape` and nothing for `deadline`, so the view got
// nothing, correctly drew nothing, and fell back to a floating button bar.
//
// ⚠️⚠️ AND THE FIRST ATTEMPT TO PIN THAT WITH A HARNESS FAILED ITS OWN MUTATION
// TEST, WHICH IS WHY THIS FUNCTION EXISTS. The wiring was an object literal
// inside a page that imports firebase-config.js, so nothing could import it and
// the only available check was a regex counting `gaugeCanvas:` in the source.
// Reinstating the exact shipped bug — moving the shared options back inside a
// per-game spread — kept that count at one and the suite stayed green. ⭐ A
// REGEX OVER SOURCE TEXT CANNOT SEE CONTROL FLOW, and "which games receive a
// console" is nothing but control flow.
//
// ⭐ SO THE DECISION IS A PURE FUNCTION OVER THE REGISTRY, AND THE HARNESS CALLS
// IT FOR EVERY ID IN GAME_ORDER. A game that would ship with a blank flank now
// fails an assertion about a returned object rather than passing one about a
// substring. ⚠️ THIS IS THE SAME MOVE `escape-board.js` MADE when the camper bug
// needed testing: extract the decision, then it can be driven.
//
// ⚠️ NO DOM API IS TOUCHED HERE AND NONE MAY BE. The elements arrive as plain
// values, so this file stays importable by a harness and by learn.js alike. A
// `document.getElementById` in this function would undo the whole point of it.
//
// ⚠️⚠️ BOTH LAUNCH PATHS IN arcade.html CALL THIS — the lesson-run Deadline path
// and the free-play path. They used to spell the same four options separately,
// which is two records of one wiring decision; the free-play copy is the one that
// was missing a game. Rule 9: one record.

/**
 * The console options for a game, or `{}` when the host has no panels to give.
 *
 * @param {string} id      a GAMES key
 * @param {object} els     { barHost, gauge, left, threat, minutes } — any may be
 *                         absent, and an absent one is simply not passed on.
 * @returns {object}       options to spread into the view's mount()
 *
 * ⚠️ ABSENT-SAFE IN BOTH DIRECTIONS. learn.js mounts these views with no panels
 * at all and every view is written to expect that, so a missing element must
 * yield an ABSENT key rather than an explicit `undefined` — the views test
 * `opts.gaugeCanvas || null`, and passing undefined would work today and would
 * silence a genuinely missing element tomorrow.
 * ⚠️ AN UNKNOWN ID RETURNS `{}`, NOT A GUESS. A view this build has never heard
 * of gets no canvases rather than Deadline's.
 */
export function panelOptionsFor(id, els) {
    const g = GAMES[id];
    const e = els || {};
    if (!g || !g.panels) return {};
    const out = {};
    // ⚠️ THE THREE SHARED ONES ARE SHARED BECAUSE THE CONSOLE IS THE SAME
    // CONSOLE — all three games draw it with drawGauges(). That is why they are
    // assigned once here instead of per game.
    if (e.barHost) out.barHost = e.barHost;
    if (e.gauge) out.gaugeCanvas = e.gauge;
    if (e.minutes) out.minutes = e.minutes;
    // ⚠️ THE LEFT PANEL DIFFERS BY KEY NAME BECAUSE THE THREE VIEWS ASK
    // DIFFERENT QUESTIONS OF THE SAME BOX: Deadline's radar answers "where", the
    // wave preview deliberately refuses to, and Shatter's is a warp meter over
    // window dressing. ⚠️ DO NOT COLLAPSE THESE TO `radarCanvas`. Escape Key and
    // Shatter accept it as a fallback, so it would work and would stop saying
    // which panel is meant.
    if (e.left) out[g.panels.left] = e.left;
    // ⚠️ DEADLINE ONLY. The other two views accept no threatCanvas, and a
    // silently-ignored option is worse than an absent one.
    if (g.panels.threat && e.threat) out.threatCanvas = e.threat;
    return out;
}

/**
 * Does this game draw a threat board?
 *
 * ⚠️⚠️ THE HOST NEEDS THIS SEPARATELY BECAUSE THE BOX IS ITS OWN ELEMENT. Jake,
 * 2026-09-10: *"There's also dead space below the incoming monsters row."* That
 * space was #threat-canvas — a fixed 104px canvas reserved for a panel only
 * Deadline is handed — sitting empty on the other two games.
 * ⭐ READ FROM THE SAME `panels.threat` FLAG panelOptionsFor() USES, so the page
 * cannot reveal a box it did not pass a canvas for, or hide one it did.
 */
export function usesThreatBoard(id) {
    return !!(GAMES[id] && GAMES[id].panels && GAMES[id].panels.threat);
}
