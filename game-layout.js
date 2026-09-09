// game-layout.js v1.0.0 — EVERY ARCADE LAYOUT NUMBER, IN ONE PLACE. Round 92.
//
// Jake, 2026-09-08: *"Is there a file that will let me move buttons and stuff
// around without messing with what you're doing?"*
//
// ⚠️⚠️ THIS FILE IS SAFE TO EDIT WHILE ANOTHER ROUND IS IN FLIGHT, AND THAT IS
// ITS ENTIRE PURPOSE. It holds NO logic, NO state, NO Firestore. Every export is
// a number that only decides where something is drawn. Changing one cannot break
// a count, a grade, a write or a harness — the worst outcome available is
// something in the wrong place, which is visible.
//
// ⚠️ WHAT NEVER BELONGS HERE: anything the director owns — intervals, lifetimes,
// WPM, accuracy, quota, shields. game-shell.js owns numbers that decide
// DIFFICULTY; this file owns numbers that decide PIXELS. A targetWPM appearing
// here is the defect game-shell.js's header exists to prevent.
//
// ⚠️ ONE REAL TRAP, ALREADY HIT ONCE. DOME_SQUASH changes only how FLAT a dome
// is drawn. A dome's RADIUS is not a layout number at all — it is the horizontal
// test deciding which lanes it protects, and Round 91 shrank it for looks and
// silently ended the three-deep overlap giving the city six lives instead of
// three. It looked fine. Want smaller domes? This squash is the knob. The radius
// lives in game-deadline.js's layout() with a warning on it.

// ── keyboard strip ──────────────────────────────────────────────────────────
export const KB_HEIGHT_FRACTION = 0.19;
export const KB_HEIGHT_MIN = 84;
export const KB_HEIGHT_MAX = 132;
// ⚠️ Below this canvas height the strip is DROPPED, not squeezed — four rows
// crushed into a short window is worse than no board.
export const KB_MIN_CANVAS_HEIGHT = 360;
// Band above the keys reserved for the NEXT-word preview.
export const KB_PREVIEW_BAND = 34;

export const KEY_PAD = 3;
export const KEY_MAX_W = 46;
// Share of canvas width the board may take. The remainder becomes the flanks.
export const KB_BOARD_WIDTH_FRACTION = 0.62;
// Row step-right, in key widths.
export const KB_ROW_STAGGER = 0.34;
export const KB_ENTER_WIDTH = 1.6;
export const KB_SPACE_WIDTH_FRACTION = 0.46;

export const KEY_ALPHA_RESTING = 0.16;
export const KEY_ALPHA_ACTIVE = 0.95;
export const KEY_ALPHA_MISSED = 0.42;
export const KEY_ALPHA_FIXED = 0.30;

// ── stat flanks ─────────────────────────────────────────────────────────────
export const FLANK_PAD_X = 14;
// Below this flank width, flank content is suppressed rather than crowded.
export const FLANK_MIN_WIDTH = 70;
export const FLANK_BAR_MAX_W = 160;
export const FLANK_BAR_LIFT_WITH_MINUTES = 36;
export const FLANK_BAR_LIFT_ALONE = 22;

// ── side panels (Round 94) ──────────────────────────────────────────────────
//
// ⚠️⚠️ THE PLAY CANVAS KEEPS ITS OWN FULL-WIDTH COORDINATE SYSTEM. These widths
// size SIBLING elements; they are never subtracted from the play canvas's `W`.
// game-deadline.js's lane and dome maths is W-relative, and dome radius IS the
// coverage test that gives the city six lives — Round 91 shrank it for looks and
// silently ended the three-deep overlap, and it looked fine. Three canvases cost
// nothing; an inset playfield rect costs that.
export const WRAP_MAX_W = 1320;
export const RADAR_COL_W = 200;
export const CONTROL_COL_W = 240;
export const PANEL_GAP = 14;

// ⭐ THE PLAY AREA GROWS EVEN AFTER GIVING BOTH PANELS AWAY, because the old
// 760px wrap cap cost more than the panels do: 724 → ~816 on a 13.6" Air.
// ⚠️ THE FLOOR TO TEST AGAINST IS THE PLAY CANVAS, NOT THE PANEL WIDTHS: it must
// never be narrower than today's 724 at any breakpoint that keeps 3 columns.
export const PLAY_MIN_W = 724;

// Fold order, per Jake's ruling: radar stays, controls drop below the frame.
export const BREAK_THREE_COL = 1150;
export const BREAK_TWO_COL = 820;

// ── control bar ─────────────────────────────────────────────────────────────
// Where Pause/Sound/Keys/Done sits, as a fraction of strip height up from the
// bottom. ⚠️ IT MUST NOT SIT ON THE SKY: targets enter from the top, so a bar up
// there covers every word as it first becomes readable. Students reported that.
// ⚠️⚠️ RETIRED IN ROUND 94 AND KEPT ONLY AS A GRAVESTONE. The bar is a real DOM
// card in the right column now, not a canvas overlay, which is the actual fix
// for *"the buttons are a nightmare... they cover the interface"*. Positioning a
// floating bar over the play area was always going to land on something; every
// value here was a different thing to land on. DO NOT REVIVE THESE — if a bar
// needs placing over the canvas again, that is a design question, not a constant.
// export const CHROME_BOTTOM_FRACTION = 0.40;
// export const CHROME_BOTTOM_NO_KEYBOARD = 8;

// ── skyline ─────────────────────────────────────────────────────────────────
// Drawn heights in px; aspect ratio comes from each SVG's viewBox, so these
// resize without distorting.
export const LANDMARK_HEIGHTS = {
    'PARTHENON': 50,
    'BATMAN BLDG': 132,
    'RYMAN': 66,
};
export const LANDMARK_DEAD_SCALE = 0.55;
export const LANDMARK_DEAD_LEAN = 0.10;
export const LANDMARK_ALPHA = 0.82;
export const LANDMARK_ALPHA_EXPOSED = 0.95;

// ⚠️ HOW FLAT THE DOMES ARE DRAWN — NOT HOW WIDE. See this file's header.
export const DOME_SQUASH = 0.72;

export const GROUND_INSET = 26;
export const SILO_LEFT_X = 0.10;
export const SILO_RIGHT_X = 0.90;
export const SILO_BARREL_SPACING = 15;
export const SILO_BARREL_OFFSET = 22.5;

// ── banners ─────────────────────────────────────────────────────────────────
// ⚠️ THE BANNER MUST STAY NEAR THE GROUND: at mid-sky it covered falling words
// at their most readable, right after a hit when the student is already behind.
export const BANNER_ABOVE_GROUND = 64;
export const BANNER_FONT_PX = 26;
