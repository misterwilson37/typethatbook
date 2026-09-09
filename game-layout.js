// game-layout.js v1.3.0 — the flanks track the stage and the threat board,
// Round 100 (Lambert).
// game-layout.js v1.2.0 — EVERY ARCADE LAYOUT NUMBER, IN ONE PLACE. Round 92;
// the scope/console split and the seven-segment readouts, Round 99 (Franklin).
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

/**
 * ⚠️ THE RUNTIME CONSTANT. Every shipped file in this repo carries its version
 * TWICE — here and in the header comment — and both move in the same edit. This
 * file shipped without one, so the build panel had nothing to read and no check
 * could tell whether a classroom was running the layout it was supposed to.
 */
export const GAME_LAYOUT_VERSION = '1.3.0';

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

// ── radar panel (Round 95, rebuilt Round 99) ────────────────────────────────
//
// ⚠️⚠️ THE RADAR IS READ-AHEAD, NOT AN INPUT SURFACE. Jake declined a radar a
// student could type off: that would make the city, the domes and the whole
// three-deep overlap decorative. Everything below is instrument styling chosen
// so it CANNOT be mistaken for a target — no plate, no box, no lock colour, and
// deliberately dimmer than anything in the sky.
//
// ⚠️⚠️ ROUND 99 REVERSED ROUND 97 *ON THIS PANEL ONLY*, AND THE REVERSAL IS THE
// POINT OF THIS BLOCK. Round 97 read *"more chunky pixels"* as applying
// everywhere and snapped the rings to a 4px lattice, which drew them as runs of
// squares. Jake, 2026-09-09: *"The left panel radar grid is pixellated, which is
// weird... I'd like that all clean, traditional pale green lines."* And on the
// original ask: *"when I wanted it chunkier, I was referring to the overall
// look, and especially the right card. I did not actually specify that."*
// ⭐ SO: CHUNKY IS THE GAUGES. THE RADAR IS A SCOPE. A stroked arc here and
// segmented lamps there is not two styles by accident — it is the difference
// between the window and the console, which is the whole brief.
export const RADAR_PAD = 10;

/**
 * ⚠️⚠️ THE THREE RINGS ARE NAMED POSITIONS IN THE GAME, NOT DECORATION, AND THIS
 * IS THE CORRECTION OF A REAL DEFECT. Round 95 used `[0.25, 0.5, 0.75]` —
 * three arcs at arbitrary fractions of the panel, meaning nothing. Jake,
 * 2026-09-09: *"lowest should be dome, second should be midway up the screen,
 * third should be screen, and above that should be the preview/incoming word
 * that isn't on the screen yet."*
 *
 * ⚠️ THE UNITS ARE `ny`, THE SAME NORMALISED DEPTH A CONTACT CARRIES: 0 is the
 * top of the play canvas (where a target enters) and 1 is impact on the dome.
 * That is `threat()` in game-deadline.js, handed over pre-normalised. Any other
 * unit here would be a second coordinate system for one quantity.
 */
export const RADAR_RING_SCREEN = 0.0;
export const RADAR_RING_MID    = 0.5;
export const RADAR_RING_DOME   = 1.0;

/**
 * ⚠️ THE DOME ARC NEEDS A DRAWN SIZE OR IT IS A POINT. `ny = 1` is the origin,
 * so an arc through it has no height at all. This floors the innermost arc at a
 * fraction of the panel's depth span — which also makes it read as what it is,
 * a dome over the city.
 */
export const RADAR_DOME_ARC_MIN = 0.14;

/**
 * ⭐ THE BAND ABOVE THE SCREEN RING, WHERE THE NOT-YET-SPAWNED WORD SITS. Jake:
 * *"even during the countdown, there should be a word coming in the edge of that
 * screen."* It is reserved height, not an overlay, so the inbound contact is
 * genuinely OUTSIDE the screen ring rather than drawn on top of the sky.
 */
export const RADAR_PREVIEW_BAND = 34;

/**
 * ⚠️⚠️ A CONTACT DOES NOT FADE, AND THIS IS THE OTHER ROUND 99 FIX. Round 95
 * ramped every contact's alpha over its first 15% of descent (`RADAR_FADE_IN`,
 * now deleted). With several words alive the whole panel appeared to wash in and
 * out. Jake: *"Each word fades out the whole grid, too, making it impossible to
 * actually start typing the next possible word. Once a word appears on there, it
 * should stay on there and not fade out until it's destroyed."*
 * ⭐ THE PANEL IS AN INSTRUMENT, AND AN INSTRUMENT DOES NOT DIM THE READING IT
 * HAS ALREADY TAKEN. A contact is drawn at full strength from the frame it
 * exists until the frame it does not.
 */
export const RADAR_CONTACT_ALPHA = 1;

/**
 * ⚠️⚠️ THERE IS NO SWEEPING LINE AND THERE MUST NEVER BE ONE. A rotating bright
 * line across a 200px panel is a periodic large-area flash in a room of thirty
 * twelve-year-olds — the same reason drawHitFeedback() stopped doing a
 * full-screen red fill. This constant exists to be found by anyone who reaches
 * for one. ⚠️ NOTE THAT ROUND 99 MADE THE PANEL PRETTIER, WHICH MAKES A SWEEP
 * MORE TEMPTING, NOT LESS. The answer is still no.
 */
export const RADAR_SWEEP = false;

// ── the scope's palette: pale phosphor green, per Jake's ruling ──────────────
//
// ⚠️ THE LINES ARE FAR DIMMER THAN THE CONTACTS, AND THE CONTACTS ARE STILL
// DIMMER THAN ANYTHING IN THE SKY. That ordering is what keeps the panel
// unmistakable for an input surface; it survived the recolour deliberately.
export const RADAR_LINE  = 'rgba(150,228,172,0.26)';
export const RADAR_LABEL = 'rgba(150,228,172,0.42)';
export const RADAR_INK   = '#a4e6b4';
export const RADAR_PIP   = '#8ee2a4';
export const RADAR_TYPED = 'rgba(164,230,180,0.30)';
/** Retired with the lattice, kept named so a search for it lands on the story. */
export const RADAR_GRID  = RADAR_LINE;
export const RADAR_LINE_W = 1;
export const RADAR_PIP_R = 3.5;
/** The inbound contact's resting alpha before its spawn is imminent. */
export const RADAR_INBOUND_MIN_ALPHA = 0.28;

// ── retro-future treatment (Round 97; scoped to the console in Round 99) ────
//
// Jake: *"I was hoping for a more retro-future feel. More chunky pixels. Gauges
// that fill up one bar at a time."* ⚠️ AND ON REVIEW, *"especially the right
// card"* — the chunk belongs to the console, not to the scope. RADAR_CELL is
// deleted; see the radar block above.
export const GAUGE_CELL = 6;
export const GAUGE_CELL_GAP = 2;
/** Segments per meter. Fewer, larger cells read as more retro than many small. */
export const GAUGE_SEGMENTS = 14;

// ── gauges: THE CONSOLE (Round 95, rebuilt Round 99) ────────────────────────
//
// Jake, 2026-09-09: *"On the right, I want something more intentional and that
// better fits the space... a gauge that could be used for speed and wpm, so the
// number and the target can be acknowledged. Perhaps with tick marks and stop
// light coloration (red failing, green passing) to delineate the different
// targets visually on the bar."* And the brief the whole card answers to:
// *"We're looking out a window on the field of battle, and the space on either
// side is the console itself. we wouldn't leave parts of it bare."*
//
// ⚠️ RUN STATS AND REAL TOTALS STILL GET DIFFERENT TREATMENTS. A child must not
// read "28 WPM" and "14m today" as two facts of the same kind: one is this run,
// one is their week. Dials for the run, plain readouts for the totals.
//
// ⚠️⚠️ THE STOPLIGHT IS A STATEMENT ABOUT THE TARGET, NOT ABOUT THE STUDENT.
// Red means "below the gate right now", green means "at or above it". It must
// never colour a number the gate does not judge — accuracy on a drill run has
// no speed gate, and painting one red would invent a failure learn.js refuses to
// report. See drawGauges(): a null target draws NO zones at all.
export const GAUGE_LABEL     = 'rgba(159,182,198,0.85)';
export const GAUGE_RUN_INK   = '#8fe8c8';
export const GAUGE_TOTAL_INK = '#7fb8ff';
/** WPM face ceiling. Above this the meter pins rather than rescaling. */
export const GAUGE_WPM_MAX = 60;

/**
 * ⚠️ STOPLIGHT, AND DELIBERATELY NOT PURE RED/GREEN. Saturated #ff0000 next to
 * #00ff00 is the single hardest pair for the commonest colour blindness, and
 * one in twelve boys in a class of thirty has it. These differ in LIGHTNESS as
 * well as hue, and the meter always prints the number too — the colour is the
 * second channel, never the only one.
 */
export const GAUGE_RED   = '#ff6b7a';
export const GAUGE_AMBER = '#ffcf6b';
export const GAUGE_GREEN = '#6be89a';
export const GAUGE_GOLD  = '#ffd700';
/** An unlit lamp. Present, so the meter reads as a machine with lamps in it. */
export const GAUGE_UNLIT = 'rgba(120,170,220,0.13)';

// ── the composite gauge: ring + segmented bar, per Jake's reference image ────
//
// ⚠️ THE RING AND THE BAR ARE ONE INSTRUMENT, NOT TWO READINGS OF ONE NUMBER.
// The RING is the value; the BAR is that value's position between zero and the
// scale ceiling, with the gate marked on it. Drawing the same number twice was
// the exact defect Round 95 fixed on the keyboard flanks — this passes because
// the bar's job is the TARGET, which the ring cannot show.
export const GAUGE_RING_D      = 62;
export const GAUGE_RING_W      = 7;
export const GAUGE_RING_SEGS   = 28;
export const GAUGE_RING_GAP    = 0.22;
export const GAUGE_UNIT_H      = 74;
export const GAUGE_BAR_H       = 10;
export const GAUGE_TICK_H      = 4;
export const GAUGE_ARC_R       = GAUGE_RING_D / 2;
export const GAUGE_ROW_H       = GAUGE_UNIT_H;

// ── the digital readouts (Round 99) ─────────────────────────────────────────
//
// Jake, 2026-09-09, with a photo of a wall clock: *"Time is harder. I kind of
// want it to be flip clocks, but that could be too distracting. Traditional
// digital readouts would probably work better, especially if you use that for
// the gauges above."* And: *"Countdown time should move to the new digital
// readout to keep it unified. I'm thinking a font like the one attached."*
//
// ⚠️⚠️ THE SEGMENTS ARE DRAWN, NOT SET IN A FONT, AND THAT IS NOT STUBBORNNESS.
// A seven-segment webfont is a network dependency on a page a child opens on a
// classroom Chromebook behind a filter, and a canvas that has not got its font
// yet silently falls back to the system monospace — so the readout would be the
// one element on the panel whose appearance depended on whether the wifi held.
// drawSevenSeg() has no dependency and cannot fall back. See its header.
//
// ⚠️ UNLIT SEGMENTS ARE DRAWN TOO. That is what makes it read as an LED panel
// rather than as blocky text: on the real clock in Jake's photo you can see
// every segment that is off. It is also functional — a digit's shape stays
// legible while it changes.
export const SEG_UNLIT_ALPHA = 0.13;
export const SEG_THICK       = 0.15;
export const SEG_ASPECT      = 0.58;
export const SEG_TIME_H      = 30;
export const SEG_VALUE_H     = 17;
export const SEG_TOTAL_H     = 14;
export const SEG_TIME_INK    = '#ff5a4a';
export const SEG_COUNT_INK   = '#ffd700';

// ── the flanks TRACK THE STAGE (Round 100) ──────────────────────────────────
//
// ⚠️⚠️ ROUND 99 ANSWERED *"big chunks of empty space don't fit the vibe"* WITH
// TALLER FIXED HEIGHTS, AND A FIXED HEIGHT CANNOT ANSWER IT. Measured after the
// fact, at #stage's own `height:78vh`: at a 900px viewport the left column still
// had **236px** of bare card below the radar and the right had 118px; at 1200px
// it was 470px and 352px. ⚠️ AND AT 700px THE CONSOLE CARD OVERFLOWED THE STAGE
// BY 38px — the same constant was simultaneously too small and too large,
// which is the signature of a number that should not have been a constant.
// ⭐ THE CANVASES FLEX AND THE CARDS TRACK THE STAGE NOW. These are FLOORS and
// CEILINGS, not heights.
//
// ⚠️ A FLOOR IS STILL REQUIRED. fitCanvas() sizes the drawing buffer from
// getBoundingClientRect(), so a canvas whose height came only from its own
// content resolves to ZERO on the first frame and the panel renders blank until
// something triggers a resize. The flex basis comes from the card, which comes
// from the grid row, which comes from #stage — all definite — but the floor is
// what makes that safe to reason about.
export const RADAR_MIN_H = 260;
export const GAUGE_MIN_H = 300;
/** ⚠️ A CEILING, so the readouts do not stretch into a sparse grey field on a
 *  tall monitor. Past this the buttons take the remaining height, which is the
 *  better use of it — see game-chrome.js's note on tap targets. */
export const GAUGE_MAX_H = 420;
/** ⚠️ AND A CEILING ON A BUTTON. Four controls sharing 400px of leftover column
 *  would be 100px tall each, which reads as a mistake rather than as a console. */
export const CONTROL_BTN_MAX_H = 68;

// ── the threat board (Round 100) ────────────────────────────────────────────
//
// Jake's brief for the flanks: *"we wouldn't leave parts of it bare - we'd have
// information, or buttons, or lights, or something helping us make battle
// decisions."*
//
// ⚠️⚠️ THE TEST FOR ANYTHING PUT HERE IS "CAN A STUDENT ACT ON IT", AND
// DECORATIVE LAMPS FAIL IT. A bare panel and a panel of meaningless lights are
// both failures, and the second is worse: it teaches a child to stop reading the
// panel. This board earns its place because the game's core tactical decision —
// Escape abandons a word so you can save a different landmark — requires knowing
// WHICH landmark is exposed, and until now that was only inferable by reading the
// skyline mid-fall.
//
// ⚠️ IT RECEIVES COUNTS, NEVER GEOMETRY. Same rule as the radar's contacts: no
// lane position and no dome measurement crosses into a panel, because the dome
// measurement IS the coverage test that gives the city six lives.
export const THREAT_H = 104;
export const THREAT_ROW_MIN = 22;
export const THREAT_SHIELDED = '#6be89a';
export const THREAT_EXPOSED  = '#ffcf6b';
export const THREAT_LOST     = '#ff6b7a';

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
