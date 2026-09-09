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

// ── radar panel (Round 95) ──────────────────────────────────────────────────
//
// ⚠️⚠️ THE RADAR IS READ-AHEAD, NOT AN INPUT SURFACE. Jake declined a radar a
// student could type off: that would make the city, the domes and the whole
// three-deep overlap decorative. Everything below is instrument styling chosen
// so it CANNOT be mistaken for a target — no plate, no box, no lock colour, and
// deliberately dimmer than anything in the sky.
export const RADAR_PAD = 10;
/** Depth rings, as fractions of panel height from the origin at the bottom. */
export const RADAR_RINGS = [0.25, 0.5, 0.75];
export const RADAR_PIP_R = 3;
/**
 * ⚠️ A CONTACT FADES IN OVER ITS FIRST SLICE OF DESCENT — no timer, no pulse,
 * no sweep. See RADAR_SWEEP below; this is the only motion on the panel.
 */
export const RADAR_FADE_IN = 0.15;
/**
 * ⚠️⚠️ THERE IS NO SWEEPING LINE AND THERE MUST NEVER BE ONE. A rotating bright
 * line across a 200px panel is a periodic large-area flash in a room of thirty
 * twelve-year-olds — the same reason drawHitFeedback() stopped doing a
 * full-screen red fill. This constant exists to be found by anyone who reaches
 * for one.
 */
export const RADAR_SWEEP = false;

// ── retro-future treatment (Round 97) ───────────────────────────────────────
//
// Jake: *"I was hoping for a more retro-future feel. More chunky pixels. Gauges
// that fill up one bar at a time."*
//
// ⚠️ CHUNKY IS A GRID SIZE, NOT A FILTER. Everything on the panels snaps to
// RADAR_CELL / GAUGE_CELL, so pips, bars and rings all land on the same lattice
// and read as one instrument rather than three styles sharing a card.
export const RADAR_CELL = 4;
export const GAUGE_CELL = 6;
export const GAUGE_CELL_GAP = 2;
/** Segments per meter. Fewer, larger cells read as more retro than many small. */
export const GAUGE_SEGMENTS = 14;
/** The inbound contact's resting alpha before its spawn is imminent. */
export const RADAR_INBOUND_MIN_ALPHA = 0.12;

export const RADAR_INK = 'rgba(120,170,220,0.55)';
export const RADAR_GRID = 'rgba(120,170,220,0.14)';
export const RADAR_PIP = '#8fd8e8';
export const RADAR_TYPED = 'rgba(120,170,220,0.28)';

// ── gauges (Round 95) ───────────────────────────────────────────────────────
//
// ⚠️ RUN STATS AND REAL TOTALS GET DIFFERENT TREATMENTS ON PURPOSE. A child must
// not read "28 WPM" and "14m today" as two facts of the same kind: one is this
// run, one is their week. Arc faces for the run, plain bars for the totals.
export const GAUGE_ARC_R = 26;
export const GAUGE_ROW_H = 74;
export const GAUGE_BAR_H = 8;
export const GAUGE_LABEL = 'rgba(159,182,198,0.85)';
export const GAUGE_RUN_INK = '#8fe8c8';
export const GAUGE_TOTAL_INK = '#7fb8ff';
/** WPM face ceiling. Above this the needle pins rather than rescaling. */
export const GAUGE_WPM_MAX = 60;

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
