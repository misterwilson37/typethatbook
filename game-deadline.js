// game-deadline.js v1.15.0 — Round 119 (Hammond): debug() also reports what the
// DIRECTOR believes — cleared, pressure, interval, lifetime, paced WPM — so
// `arcade-telemetry.js` can record the pacing curve without adding a single
// counter (Rule 9: every field is a read of a number the game already keeps).
// ⚠️ Nobody could count panes while playing and a screen recording could not see
// the director's model at all. ⚠️ RULE 11 STILL HOLDS: `pacedWPM` may be written
// to a diagnostic CSV and may never reach a screen.
// game-deadline.js v1.14.0 — Round 119 (Hammond): ⚠️⚠️ BACKSPACE LETS GO OF THE
// WORD. Escape released the lock AND paused the game in one keystroke since
// Round 109 — `stopPropagation()` does not stop a sibling listener on the same
// target, so the arbitration that file documents never happened — ⭐ AND HERE THAT WAS A TRAP,
// NOT A MISSING CONVENIENCE: every key goes to `locked`, and the auto-lock skips
// any target with `typed > 0`, so a student who locked the wrong word was stuck
// in it until it landed. A student reported it. See onKeyDown().
// game-deadline.js v1.13.0 — Round 119 (Hammond): DEADLINE MEASURES THE CHILD
// TOO, and `restart()` stops halving the city's health.
//
// ⭐ ROADMAP 118a, the third cabinet. Shatter and Shards are one view and were
// wired together; Deadline has its own and was still pacing every arcade run
// from the lesson gate. Four calls: `spawned()` at the spawn site, `keyed()` on
// every correct key, `finished()` on a clear, `dropped()` on impact.
//
// ⚠️⚠️ A TARGET NOW CARRIES AN `id`. It did not need one before — `live` was
// searched by identity and nothing outside this file cared which word was which
// — and the calibrator's whole question is "how long did THIS pane take to
// find", which cannot be asked of an anonymous object.
//
// ⚠️ THE MEASUREMENTS ARE TAKEN ON A GRADED RUN TOO, AND DELIBERATELY IGNORED.
// game-shell.js v1.10.0 decides whether anything reads them, and a view that
// branched on `adaptive` here would be a SECOND reader of the flag — which is
// the shape that let the graded path and the arcade path disagree about
// difficulty in the first place. One feeder, one decider.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ AND A LIVE DEFECT FOUND WHILE WIRING: **PLAY AGAIN HALVED THE CITY.**
// ═════════════════════════════════════════════════════════════════════════════
//
// The mount built its director with `shields: shieldCount * 2` — the doubling
// that exists because a dome absorbs a hit and the landmark under it takes the
// next, so a 3-shield difficulty is staged on screen as SIX hits. ⚠️ `restart()`
// built `new GameDirector(cfg)` and did not repeat it.
//
// ⭐⭐ SO EVERY REPLAY ENDED AT THREE HITS WITH THREE BUILDINGS STILL STANDING —
// which is the *"the dome doesn't do anything"* complaint the doubling was
// written to answer, resurrected on the second game of every session and on no
// other. Measured: first run `shieldsMax` 6, after "play again" 3.
//
// ⚠️ IT IS EXACTLY THE FAILURE THIS FILE'S `restart()` ALREADY WARNS ABOUT in
// its own header — "a stale counter survives a restart" — with the sign
// reversed: not a value carried forward, but an override dropped. Both come from
// the same cause, a second place that has to know how the first one was built.
// ⭐ FIXED WITH `newDirector()`, so there is one place. The same factory carries
// the calibrator, which is why a wiring round found a balance bug.
// game-deadline.js v1.12.0
//
// v1.12.0 — Round 115 (Tower). Quit/Escape after the survival pass ENDS the
//   session through onEnd (with `pass`) instead of reporting a quit, so a host
//   cannot mistake a won run for an abandoned one. Nothing else changed.
//
// (v1.11.0 and earlier follow.)
//
// v1.11.0 — ⭐ SURVIVAL MODE, AND THE FROZEN GRADE THAT MAKES IT SAFE. Jake,
//   2026-09-09: *"if they pass the game and enter survival mode, then they get
//   the passing score (unlocking the next lesson) and survival mode is there to
//   get on the leaderboard... Stats become whatever they did during the checking
//   run, and then bragging rights."*
//   • The quota no longer ends the run when the host passes `survival`. It takes
//     a COPY of d.report() instead — ⚠️⚠️ WPM and accuracy are ratios over the
//     session and DO NOT DECOMPOSE, so the only correct moment to read them is
//     the instant of the pass. Subtracting survival afterwards cannot work.
//   • ⚠️ A PASS CANNOT BE UNDONE. Dying in survival ends the session and still
//     reports CITY DEFENDED, or playing on would be a gamble with the lesson the
//     student already earned.
//   • onEnd() hands the host `pass` (the frozen run) alongside `rep` (the whole
//     session). ⚠️ ONLY `pass` MAY EVER REACH recordRunOutcome().
//   • ⭐ NOTHING IN game-shell.js CHANGED: the pool already wraps and the
//     pressure ramp already feeds off targets cleared past the quota.
//
// v1.10.0 — ⚠️⚠️ THE PER-SECOND TICK NEVER FIRED, IN ANY ROUND. Jake, 2026-09-09,
//   with 0:35 on the run clock and the banked rows at zero: *"I can confirm it's
//   not adding time to the day or week."* The banking loop lived ONLY inside
//   finish() — so nothing could move while a student played — and it sat behind
//   `if (onSecond && started && !ended)` three lines AFTER `ended = true`, which
//   is permanently false. ⭐ TWO DEFECTS IN ONE BLOCK, AND THE SECOND HID THE
//   FIRST: moving the call without fixing the guard would have looked like a fix
//   and banked nothing. Now bankWholeSeconds() is called from the frame loop and
//   once more at the top of finish(), before `ended` and before d.end() stops the
//   graded clock. ⚠️ restart() resets `secondsBanked` too, or the replay's first
//   N seconds are swallowed by the last run's high-water mark.
//   ⚠️ arcade-lesson-test.mjs pinned the PAGE's listener and stayed green for ten
//   rounds while nothing emitted. A seam needs BOTH ends asserted.
//
// v1.9.0 — ⭐ ROUND 101 — the console fills its card, and an error is visible on
//   the board rather than only in the memory.
//   • ⚠️⚠️ A SPACE AT A WORD BOUNDARY NO LONGER COUNTS AGAINST THE STUDENT.
//     Jake: *"I don't want spaces at the end of words to count against me, as
//     it's the logical key to hit. In the middle of a word should hurt, but at
//     the end should not."* It is IGNORED, not scored as a hit — see onKeyDown().
//   • The missed key SWELLS and the pressed key BLINKS; keyStates keeps the
//     standing red. Two channels, two shapes — see game-draw.js.
//   • BANKED carries seconds. Both shapes still come off ONE formatter.
//
// v1.8.0 — ⭐ ROUND 100b — Jake's screen, four notes.
//   • The countdown is ALSO drawn big in the middle of the field. ⚠️ One
//     SOURCE displayed twice, not two sources — see drawCountdownOverlay().
//   • BANKED is a seven-segment readout, and minuteLines() emits BOTH the words
//     and the digits so nothing downstream reformats seconds.
//   • ⚠️⚠️ drawHudTop() NO LONGER RUNS WHEN A CONSOLE IS PRESENT. With the
//     keyboard off, kbH is 0 and the fallback plate printed WPM/accuracy/target
//     over the sky while the console printed the same four numbers — visible in
//     Jake's screenshot. The flanks stood down in Round 95; this branch did not.
//
// v1.7.0 — ⭐ ROUND 100 (Franklin) — THE FLANKS STOP HAVING BARE SPACE, FOR REAL.
//   ⚠️⚠️ v1.6.0 ANSWERED *"big chunks of empty space don't fit the vibe"* WITH
//   TALLER FIXED HEIGHTS, WHICH CANNOT ANSWER IT. Measured afterwards against
//   #stage's own 78vh: 236px of bare left column at a 900px viewport, 470px at
//   1200px — and a console card that OVERFLOWED the stage by 38px at 700px. The
//   same constant was too small and too large at once.
//   • The canvases flex; game-layout.js holds floors and ceilings, not heights.
//   • ⭐ THE LEFT COLUMN'S SPARE HEIGHT GOES TO THE RADAR, and a fixed-height
//     THREAT BOARD sits under it: which landmark is shielded, exposed or lost.
//     ⚠️ IT EARNS ITS PLACE VIA Escape — abandoning a word to save a different
//     landmark requires knowing which one is exposed, and that was previously
//     only readable off the skyline while words were falling.
//   • ⚠️ COUNTS CROSS THE SEAM, NEVER GEOMETRY, and the count uses the SAME
//     predicate covered() does. See drawSidePanels().
//
// v1.6.0 — ⭐ ROUND 99 (Franklin) — THE CONSOLE. Jake, 2026-09-09: *"looking at
//   this should not make you feel like the space is not intentionally used.
//   We're looking out a window on the field of battle, and the space on either
//   side is the console itself... This is a battle station, not a computer
//   game."*
//   • The gauge panel is fed the GATES, the graded clock and the shield count,
//     so a number and the target it is judged against are legible together.
//     ⚠️ ALL FIVE COME OFF `d.report()`, never off `cfg` — arcade substitutes a
//     rolling WPM for a fixed gate, and a panel reading cfg would paint an
//     arcade run red against a number nothing enforces.
//   • The countdown renders in that panel's clock. ⚠️ THIS VIEW OPTS IN by
//     passing onCountdown; game-chrome.js keeps its overlay numeral for any
//     host that does not, which is why Escape Key is untouched.
//   • ⚠️⚠️ A DEAD `--gc-bottom` WRITE WAS EVALUATING TO NaN EVERY layout() —
//     it read two constants Round 94 retired. See layout() for the lesson.
//
// v1.5.0 — ⭐ ROUND 91 — THE "SLOWER THAN THE QUIZ" GAP, DIAGNOSED AND ADDRESSED.
//   ⚠️⚠️ v1.4.0 CALLED THIS "REAL HUMAN TIME, DO NOT FIX IN THE ARITHMETIC" AND
//   LEFT IT THERE. That was half right and wholly unhelpful: it IS locate-and-
//   read time, and it was still costing a 100 WPM typist more than half his
//   speed. Jake, measured on himself: *"Simply waiting for the next word to
//   appear dropped me to 48."* Modelled at 500ms per word it reports 44 for a
//   100 WPM typist and 22 for a 30 WPM one — matching his figure and his
//   prediction for a 30 WPM child.
//   ⭐ THE FIX IS A "NEXT" PREVIEW ON THE KEYBOARD STRIP (GameDirector.peekNext),
//   so the word is already read when it arrives. ⚠️ RAISING MIN_ON_SCREEN TO
//   SHOW MORE WAS TRIED FIRST AND IS WRONG: at 3 the corpus sweep falls from
//   99.9% to 53.2% clearable, because a refill floor spawns work a slower
//   typist never asked for. READING AHEAD MUST NOT MEAN RECEIVING FASTER.
//   • Landmark name plates removed; they sat on the ground line under art that
//     no longer needs captioning. The names still appear in the loss banner.
//   • ⚠️ DOMES ARE FLATTENED, NOT SHRUNK. `radius` IS the coverage test — the
//     obvious `reach * 0.86` gives smaller domes and silently ends the
//     three-deep overlap that is the six-lives mechanic. Caught by asserting
//     coverage after the change, not by looking at it. DOME_SQUASH scales the
//     drawn height only.
//   • Control bar moved to mid-flank, between the run stats and the minutes.
//
//
// v1.4.0 — ⭐ ROUND 90 — STUDENT FEEDBACK, FOUR ITEMS.
//   • PER-KEY ERROR MEMORY: a key you miss turns red and stays marked (blue)
//     once you land it. ⚠️ KEYED ON THE CHARACTER THEY NEEDED, not the one they
//     hit — a student stuck on 'k' who keeps pressing 'j' needs 'k' lit.
//   • THE DESTRUCTION BANNER DROPPED TO GROUND LEVEL. At H*0.32 it covered
//     falling words at their most readable, right after a hit when the student
//     is already behind.
//   • THE CONTROL BAR LEFT THE SKY (game-chrome.js v1.2.0). Targets enter from
//     the top; the buttons were covering every word as it became readable.
//   • ⚠️⚠️ THE "SLOWER IN THE GAME THAN THE QUIZ" REPORT IS *NOT* A CLOCK BUG —
//     MEASURED, NOT ASSUMED. Simulating students at 15/25/40/60 WPM against a 15
//     gate reports back 15/25/40/60 exactly: the clock does not cap anyone and
//     spawnDue() already refills an empty sky instantly. The remaining gap is
//     real human time — locating and reading a word that has just appeared at
//     the top of a large canvas, which a quiz never charges because its text is
//     already on the page and already read. DO NOT "FIX" THIS IN THE ARITHMETIC.
//
//
// v1.3.0 — ⭐ ROUND 89 — SPACE BOUGHT BACK, AND THE KEYBOARD IS SHARED AND
//   OPTIONAL. Jake, 2026-09-08: *"That missing space makes the game harder, so
//   let's take some of it back by moving your instructions to underneath the
//   game... Maybe there's a whole arcade css that they all share... We should be
//   able to toggle off the keyboard, too."*
//   • THE STRIP MOVED TO game-draw.js (v1.1.0) so every arcade view can draw the
//     identical board. ⚠️ A SHARED DRAWING HELPER, NOT A STYLESHEET — the board
//     is canvas, so CSS cannot carry it; this file already exists to be the
//     shared-pixels module.
//   • THE READOUT MOVED INTO THE STRIP'S FLANKS. The board is centred and about
//     half the canvas wide, so the sides were dead pixels; the top plate and the
//     quota bar now live there and the whole top strip goes back to sky.
//     ⚠️ WITH THE BOARD OFF THERE ARE NO FLANKS, so drawHudTop() is the fallback
//     — otherwise the toggle would silently take the score away too.
//   • A "Keys" BUTTON TOGGLES IT, remembered in localStorage. ⚠️ localStorage,
//     NOT FIRESTORE: a display preference is not student data, and nothing on
//     this page may write to the database. ⚠️ THE TOGGLE CALLS layout() —
//     kbH feeds the ground line, the dome radii and the silo positions, so
//     flipping it without a re-layout leaves the city drawn where the keyboard
//     used to be.
//
//
// v1.2.0 — ⭐ ROUND 88 — THE ON-SCREEN KEYBOARD IS BACK, AT THE BOTTOM.
//   Jake, 2026-09-08: *"Apparently that's a tool kids still depend on at that
//   point."* A student in unit 2 is still hunting for keys, and a typing game
//   that hides the keyboard asks them to do two hard things at once.
//   ⚠️ DRAWN ON THE CANVAS, not built from keyboard.js's createKeyboard() — that
//   emits DOM styled by rules in style.css, which School loads and neither
//   arcade.html nor tools/game-lab.html does. Reusing it would have rendered as
//   unstyled stacked divs on both standalone pages. The SHAPE is local; the
//   LAYOUT and the COLOURS are still keyboard.js's.
//   ⚠️ THE STRIP IS SUBTRACTED FROM THE PLAY AREA, NOT OVERLAID. The impact test
//   is distance-based, so a target falling behind the keys would "land"
//   somewhere the student cannot see. Raising the ground keeps every landing
//   visible; below ~360px of window height the strip is dropped entirely rather
//   than squeezed unreadable.
//   ⚠️ COLOURS COME FROM THIS FILE'S OWN fingerIndexOf(), NOT getFingerInfo()
//   DIRECTLY: keyboard.js stores `finger` as a NAME, so FINGER_NAMES[info.finger]
//   is undefined and the fill silently keeps the previous colour — which is
//   exactly how the first draft rendered as a grey board.
//
//
// v1.1.0 — ⭐ ROUND 87, JAKE'S FOUR GRAPHICS NOTES, ALL FROM WATCHING IT PLAYED.
//   1. THE HULLS CARRY THE LETTERS' FINGER COLOURS. One arc per character, in
//      order, from keyboard.js's map — the same colours as the silo barrels and
//      the on-screen keyboard — and typed characters dim, so the hull drains as
//      the student works. An unmapped character keeps the hull colour rather
//      than falling back to finger 0; see this file's own note on why that
//      default once put every unmapped character on the left pinky.
//   2. THE BARRELS AIM AT WHAT THEY ARE SHOOTING AT, and are drawn INNERMOST
//      FIRST so the outermost sits on top. Vertical barrels never occluded each
//      other, so draw order did not matter until they rotated — at which point
//      an innermost-last order hides the other three colours at exactly the
//      angles the student is looking at. See drawSilos().
//   3. THE DOMES DO SOMETHING NOW. Jake: *"they don't do anything... if the dome
//      is destroyed, the building should be revealed and then destroyed."* Each
//      dome now reaches the centre lane, so the Batman Building sits under all
//      three and the outer landmarks under two each; a hit strips the nearest
//      standing dome and only a BARE lane loses its landmark. The city absorbs
//      six hits instead of three, an exposed landmark is outlined in amber, and
//      the director's shield count is doubled to match. ⚠️ Strictly more
//      forgiving, so the 990-trial corpus sweep still holds.
//   4. THE LANDMARKS ARE GEMINI'S ART, inlined as base64 data URLs with a vector
//      fallback for the frames before they decode. ⚠️ The Batman SVG's
//      full-bleed sky rect was stripped first — it read as a pale sticker over a
//      night skyline.
// — DEADLINE. Round 82 (Victor).
//
// ⚠️⚠️ AN EARLIER DRAFT OF THIS FILE CARRIED A RULE 9 VIOLATION OF MY OWN MAKING,
// AND IT IS WORTH RECORDING BECAUSE THE NEXT PERSON WILL BE TEMPTED THE SAME WAY.
// It hand-wrote `FINGER_MAP` and `FINGER_COLORS` — a second copy of something
// keyboard.js has exported all along, and the WORSE copy: it covered letters,
// digits and a little punctuation, and everything else (`!`, `?`, `"`, `:` — all
// over a book lesson) fell through to `undefined`, which lands on tube 0, the left
// pinky. ⚠️ SO IN A PROSE LESSON THE GAME CONFIDENTLY LAUNCHED FROM THE WRONG
// FINGER, and the finger tubes are the single best thing in this game. Showing
// the wrong one is worse than showing none.
// It imports keyboard.js's `buildFingerMap()`/`getFingerInfo()` now, which handle
// the shift rows properly, so a recolour or a layout change in that file follows
// here for free. tests/game-shell-test.mjs Part J pins it.
//
// ⚠️ RENAMED FROM game-deadline.js / "Deadline" v1.0.1. Jake's ruling,
// 2026-09-07: the Atari title is an active trademark on a property Atari has been
// reviving, and it had to go. **Deadline** is what the game actually is — words
// falling toward a line at the bottom of the screen — and it doubles as what
// every writer calls time pressure and as a real newspaper-press term, which
// keeps it in this app's world.
//
// ⚠️ AND IT IS DELIBERATELY NOT "LAST WORD", which was the other candidate.
// "Last Word" frames the game as unwinnable, and the ASSESSED mode is winnable:
// clear the quota and the banner reads CITY DEFENDED. Only arcade is endless.
// Promising a struggling child doom before their graded run is the one thing the
// title must not do.
//
// ⚠️ THE DISPLAY TITLE LIVES IN game-names.js, NOT HERE. Filenames and ids are
// frozen; titles are not.
//
// ⚠️⚠️ THIS FILE OWNS PIXELS AND OWNS NO NUMBERS. Every quantity that decides
// whether a child passes — spawn interval, target lifetime, WPM, accuracy, the
// quota, the score — comes from game-shell.js's GameDirector. This view asks and
// draws. ⚠️ IF YOU FIND YOURSELF WRITING `speed +=` OR A WPM CALCULATION IN HERE,
// STOP: that is the Rule 9 defect this split exists to prevent, and it is exactly
// the shape the prototype had (`const speed = 0.5 + (score * 0.02)`).
//
// ⚠️ DELTA-TIMED THROUGHOUT. The prototype moved everything in pixels per FRAME,
// so it ran at double speed on a 120 Hz iPad and could not be tuned to a gate on
// any hardware. Velocities in here are pixels per SECOND, derived from
// `lifetimeMs` and the actual on-screen distance, which is why the same mission
// plays identically on a Chromebook and an iPad.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT SURVIVED FROM THE PROTOTYPE, AND WHY
// ═══════════════════════════════════════════════════════════════════════════
//
// ⭐ THE FINGER TUBES. Eight launch tubes, one per finger, each in that finger's
// colour from keyboard.js's scheme, and the missile leaves the tube belonging to
// the finger that should have pressed the key. It is a live kinetic version of
// the keyboard colouring and it teaches the thing that is hardest to teach.
// ⚠️ DO NOT SIMPLIFY THE TUBES INTO ONE LAUNCHER to save code. Everything else
// in this file is negotiable; this is the feature.
//
// ⚠️ A WRONG KEY DARKS ITS TUBE AND FIRES A MISS. Jake's ruling on penalties
// (2026-09-07) is that a leak must not be charged twice — but a wrong KEY is not
// a leak, it is an error, and it needs to be visible or the student cannot learn
// which finger lied. It costs time (a missile spent on nothing) and it costs
// accuracy through the director. ⚠️ IT MUST NEVER BLOCK INPUT. The Muncher
// prototype froze the keyboard for four seconds on a web hit and flashed red,
// which reads to a twelve-year-old as broken hardware. The cooldown here is
// PURELY VISUAL.
//
// ═══════════════════════════════════════════════════════════════════════════
// LANES: OPT-IN DEPTH, ZERO COST TO THE CHILD WHO IGNORES THEM
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake's concern, 2026-09-07: *"my only fear on the lanes is that it distracts
// kids who just want to type and don't care about the game."*
//
// ⚠️ SO TARGETING AUTO-LOCKS TO THE LOWEST THREAT AND THE STUDENT NEVER HAS TO
// THINK ABOUT LANES AT ALL. Press a letter and the game picks the target nearest
// to impact that starts with it — the same behaviour the prototype had, which is
// the behaviour of a child who just wants to type. Lanes only pay off for a
// student who CHOOSES to abandon a lock (Escape) and save a different landmark.
// The prototype's three domes were concentric enough that the big one always
// popped first whatever lane the enemy used, which made them three lives in a
// costume; one dome per lane makes the choice real without making it required.
//
// ⚠️ AND THE LANDMARK NAMES ARE THE PAYOFF FOR THE CHILD WHO IGNORED THE
// MECHANIC. "THE PARTHENON IS GONE" is a story, not a skill check, and it is
// what reaches the student who is only here to type.

import { GameDirector } from './game-shell.js';
import { TypingCalibrator } from './typing-calibrator.js';
// ⚠️ EVERY NUMBER THAT ONLY DECIDES PIXELS LIVES IN game-layout.js, so UI work
// can happen in parallel without touching this file. See that file's header for
// what may and may not move there.
import * as LAY from './game-layout.js';
// ⚠️ LAYOUTS JOINS THE IMPORT (Round 88). The keyboard strip is drawn on the
// canvas, but its ROWS still come from keyboard.js — this file must not hold a
// second copy of the layout any more than it holds a second copy of the finger
// map. game-assumptions-test.mjs Part J exists for exactly that reason.
import { buildFingerMap, getFingerInfo, FINGER_COLORS, FINGER_NAMES, LAYOUTS } from './keyboard.js';
import { mountChrome } from './game-chrome.js';
import { sfx, isMuted, setMuted } from './game-audio.js';
import {
    fitCanvas, platedText, platedProgress, makeStars, drawStars,
    burst, updateParticles, drawParticles, roundRect,
    drawKeyboardStrip, keyboardStripHeight, drawRadar, drawGauges, drawThreatBoard, drawCountdownOverlay,
    drawHitFeedback, drawCapsWarning, motionScale,
} from './game-draw.js';

export const GAME_DEADLINE_VERSION = '1.15.0';

// ⚠️⚠️ THE FINGER MAP AND THE COLOURS COME FROM keyboard.js. NOT A COPY.
// A student who has learned that yellow is the right index finger must not meet a
// game where it is not, and the only way to guarantee that is to read the same
// table the keyboard reads. `getFingerInfo()` also resolves SHIFTED characters to
// their base key's finger, which the hand-written map this replaces did not.
const FINGER_MAP = buildFingerMap('qwerty');

/** Finger index 0..7 for a character, left pinky to right pinky. */
function fingerIndexOf(ch) {
    const info = getFingerInfo(FINGER_MAP, ch);
    if (!info || !info.finger) return null;
    const i = FINGER_NAMES.indexOf(info.finger);
    // ⚠️ A THUMB CHARACTER (space) HAS NO TUBE AND RETURNS null RATHER THAN 0.
    // Falling back to 0 is what put every unmapped character on the left pinky.
    return i === -1 ? null : i;
}

// ⚠️ THREE LANES, THREE LANDMARKS, THREE SHIELDS. The shield count comes from
// the director's config; this list must be at least as long as it.
const LANDMARKS = [
    { name: 'THE PARTHENON', short: 'PARTHENON' },
    { name: 'THE BATMAN BUILDING', short: 'BATMAN BLDG' },
    { name: 'THE RYMAN', short: 'RYMAN' },
];


// ═══════════════════════════════════════════════════════════════════════════
// LANDMARK ART — v1.1.0, ROUND 87
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-08: *"The buildings need more definition. Attached are svgs that
// Gemini put together for you."* They are markedly more recognisable than the
// hand-drawn canvas paths they replace — the Batman Building's twin spires and
// crown, the Ryman's gothic windows and gable, the Parthenon's Doric colonnade.
//
// ⚠️⚠️ INLINED AS BASE64 DATA URLS, NOT FETCHED. Three reasons, and the third is
// the one that matters: a fetch is a network round trip per game start; a
// relative path breaks the moment this module is imported from a page at a
// different depth (arcade.html is at the root, tools/game-lab.html is not); and
// game-deadline.js is imported by pages that must keep working with no server
// beyond static file hosting. A data URL has no path and no request.
//
// ⚠️ THE BATMAN SVG'S FULL-BLEED SKY RECT WAS STRIPPED BEFORE EMBEDDING. Gemini
// drew it on a pale gradient background, which is right for a standalone
// illustration and reads as a light STICKER pasted on a night skyline once it is
// composited over the game. Nothing else was altered — the building itself is
// exactly as drawn. If these are ever re-exported, strip the background again.
//
// ⚠️ DRAWN ONLY ONCE LOADED. `drawImage` with an unloaded Image throws in some
// browsers and silently no-ops in others, so every draw checks `.complete` and
// falls back to the vector shapes below. THE FALLBACKS ARE NOT DEAD CODE — they
// are what the first frame or two of every game uses.
const LANDMARK_SVG = {
    'PARTHENON':   'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3NjAgMzYwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj4gPGRlZnM+IDwhLS0gQ29sdW1uIERlZmluaXRpb24gLS0+IDxnIGlkPSJkb3JpYy1jb2x1bW4iPiA8IS0tIFNoYWZ0IC0tPiA8cmVjdCB4PSIwIiB5PSIxMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjE0MCIgZmlsbD0iI0U2REFCRiIgLz4gPCEtLSBGbHV0aW5nIC8gU2hhZGluZyAtLT4gPHJlY3QgeD0iNCIgeT0iMTAiIHdpZHRoPSI0IiBoZWlnaHQ9IjE0MCIgZmlsbD0iI0Q0QzRBMSIgLz4gPHJlY3QgeD0iMTIiIHk9IjEwIiB3aWR0aD0iNCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNENEM0QTEiIC8+IDxyZWN0IHg9IjIwIiB5PSIxMCIgd2lkdGg9IjQiIGhlaWdodD0iMTQwIiBmaWxsPSIjQzJCMDg5IiAvPiA8IS0tIEVjaGludXMgKExvd2VyIENhcGl0YWwpIC0tPiA8cG9seWdvbiBwb2ludHM9Ii00LDEwIDMyLDEwIDI4LDE1IDAsMTUiIGZpbGw9IiNENEM0QTEiIC8+IDwhLS0gQWJhY3VzIChVcHBlciBDYXBpdGFsKSAtLT4gPHJlY3QgeD0iLTYiIHk9IjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSIxMCIgZmlsbD0iI0U2REFCRiIgLz4gPC9nPiA8IS0tIFRyaWdseXBoIERlZmluaXRpb24gLS0+IDxnIGlkPSJ0cmlnbHlwaCI+IDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxOCIgaGVpZ2h0PSIyNCIgZmlsbD0iI0U2REFCRiIgLz4gPCEtLSBWZXJ0aWNhbCBncm9vdmVzIC0tPiA8cmVjdCB4PSIzIiB5PSIwIiB3aWR0aD0iMyIgaGVpZ2h0PSIyNCIgZmlsbD0iI0MyQjA4OSIgLz4gPHJlY3QgeD0iOSIgeT0iMCIgd2lkdGg9IjMiIGhlaWdodD0iMjQiIGZpbGw9IiNDMkIwODkiIC8+IDxyZWN0IHg9IjE1IiB5PSIwIiB3aWR0aD0iMyIgaGVpZ2h0PSIyNCIgZmlsbD0iI0MyQjA4OSIgLz4gPC9nPiA8L2RlZnM+IDwhLS0gQ3JlcGlkb21hIChTdGVwcGVkIEJhc2UpIC0tPiA8ZyBpZD0iYmFzZSI+IDxyZWN0IHg9IjY1IiB5PSIzMzAiIHdpZHRoPSI2MzAiIGhlaWdodD0iMTIiIGZpbGw9IiNENEM0QTEiIC8+IDxyZWN0IHg9IjgwIiB5PSIzMTgiIHdpZHRoPSI2MDAiIGhlaWdodD0iMTIiIGZpbGw9IiNFNkRBQkYiIC8+IDxyZWN0IHg9Ijk1IiB5PSIzMDYiIHdpZHRoPSI1NzAiIGhlaWdodD0iMTIiIGZpbGw9IiNENEM0QTEiIC8+IDwhLS0gU3R5bG9iYXRlIChUb3AgU3RlcCkgLS0+IDxyZWN0IHg9IjExMCIgeT0iMjk0IiB3aWR0aD0iNTQwIiBoZWlnaHQ9IjEyIiBmaWxsPSIjRTZEQUJGIiAvPiA8L2c+IDwhLS0gQ2VsbGEgKElubmVyIEJ1aWxkaW5nIFNoYWRvdyAmIERvb3J3YXkpIC0tPiA8ZyBpZD0iaW5uZXItYnVpbGRpbmciPiA8cmVjdCB4PSIxNDUiIHk9IjE0NCIgd2lkdGg9IjQ3MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiM4Rjc4NTUiIC8+IDwhLS0gR2lhbnQgQnJvbnplIERvb3JzIFJlcHJlc2VudGF0aW9uIC0tPiA8cmVjdCB4PSIzNDUiIHk9IjE3NCIgd2lkdGg9IjcwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzRBM0IyOSIgLz4gPHJlY3QgeD0iMzc5IiB5PSIxNzQiIHdpZHRoPSIyIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzJFMjQxNyIgLz4gPC9nPiA8IS0tIFBlcmlzdHlsZSAoT3V0ZXIgQ29sdW1ucykgLS0+IDxnIGlkPSJjb2x1bW5zIj4gPHVzZSBocmVmPSIjZG9yaWMtY29sdW1uIiB4PSIxMjAiIHk9IjE0NCIgLz4gPHVzZSBocmVmPSIjZG9yaWMtY29sdW1uIiB4PSIxODYiIHk9IjE0NCIgLz4gPHVzZSBocmVmPSIjZG9yaWMtY29sdW1uIiB4PSIyNTIiIHk9IjE0NCIgLz4gPHVzZSBocmVmPSIjZG9yaWMtY29sdW1uIiB4PSIzMTgiIHk9IjE0NCIgLz4gPHVzZSBocmVmPSIjZG9yaWMtY29sdW1uIiB4PSIzODQiIHk9IjE0NCIgLz4gPHVzZSBocmVmPSIjZG9yaWMtY29sdW1uIiB4PSI0NTAiIHk9IjE0NCIgLz4gPHVzZSBocmVmPSIjZG9yaWMtY29sdW1uIiB4PSI1MTYiIHk9IjE0NCIgLz4gPHVzZSBocmVmPSIjZG9yaWMtY29sdW1uIiB4PSI1ODIiIHk9IjE0NCIgLz4gPC9nPiA8IS0tIEVudGFibGF0dXJlIC0tPiA8ZyBpZD0iZW50YWJsYXR1cmUiPiA8IS0tIEFyY2hpdHJhdmUgLS0+IDxyZWN0IHg9IjExMCIgeT0iMTI0IiB3aWR0aD0iNTQwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRTZEQUJGIiAvPiA8IS0tIFRhZW5pYSAoVGhpbiBiYW5kIGFib3ZlIGFyY2hpdHJhdmUpIC0tPiA8cmVjdCB4PSIxMTAiIHk9IjEyMCIgd2lkdGg9IjU0MCIgaGVpZ2h0PSI0IiBmaWxsPSIjQzJCMDg5IiAvPiA8IS0tIEZyaWV6ZSAoTWV0b3BlcyBhbmQgVHJpZ2x5cGhzKSAtLT4gPHJlY3QgeD0iMTEwIiB5PSI5NiIgd2lkdGg9IjU0MCIgaGVpZ2h0PSIyNCIgZmlsbD0iI0I1OUU3OCIgLz4gPCEtLSBCYWNrZ3JvdW5kIGZvciBNZXRvcGVzIC0tPiA8IS0tIENlbnRlcmVkIG9uIENvbHVtbnMgLS0+IDx1c2UgaHJlZj0iI3RyaWdseXBoIiB4PSIxMjUiIHk9Ijk2IiAvPiA8dXNlIGhyZWY9IiN0cmlnbHlwaCIgeD0iMTkxIiB5PSI5NiIgLz4gPHVzZSBocmVmPSIjdHJpZ2x5cGgiIHg9IjI1NyIgeT0iOTYiIC8+IDx1c2UgaHJlZj0iI3RyaWdseXBoIiB4PSIzMjMiIHk9Ijk2IiAvPiA8dXNlIGhyZWY9IiN0cmlnbHlwaCIgeD0iMzg5IiB5PSI5NiIgLz4gPHVzZSBocmVmPSIjdHJpZ2x5cGgiIHg9IjQ1NSIgeT0iOTYiIC8+IDx1c2UgaHJlZj0iI3RyaWdseXBoIiB4PSI1MjEiIHk9Ijk2IiAvPiA8dXNlIGhyZWY9IiN0cmlnbHlwaCIgeD0iNTg3IiB5PSI5NiIgLz4gPCEtLSBCZXR3ZWVuIENvbHVtbnMgLS0+IDx1c2UgaHJlZj0iI3RyaWdseXBoIiB4PSIxNTgiIHk9Ijk2IiAvPiA8dXNlIGhyZWY9IiN0cmlnbHlwaCIgeD0iMjI0IiB5PSI5NiIgLz4gPHVzZSBocmVmPSIjdHJpZ2x5cGgiIHg9IjI5MCIgeT0iOTYiIC8+IDx1c2UgaHJlZj0iI3RyaWdseXBoIiB4PSIzNTYiIHk9Ijk2IiAvPiA8dXNlIGhyZWY9IiN0cmlnbHlwaCIgeD0iNDIyIiB5PSI5NiIgLz4gPHVzZSBocmVmPSIjdHJpZ2x5cGgiIHg9IjQ4OCIgeT0iOTYiIC8+IDx1c2UgaHJlZj0iI3RyaWdseXBoIiB4PSI1NTQiIHk9Ijk2IiAvPiA8IS0tIENvcm5pY2UgKEdlaXNvbikgLS0+IDxyZWN0IHg9IjEwMCIgeT0iODYiIHdpZHRoPSI1NjAiIGhlaWdodD0iMTAiIGZpbGw9IiNENEM0QTEiIC8+IDwvZz4gPCEtLSBQZWRpbWVudCAoVHJpYW5ndWxhciBSb29mKSAtLT4gPGcgaWQ9InBlZGltZW50Ij4gPCEtLSBPdXRlciBUcmlhbmdsZSAvIENvcm5pY2UgZWRnZSAtLT4gPHBvbHlnb24gcG9pbnRzPSIxMDAsODYgMzgwLDI0IDY2MCw4NiIgZmlsbD0iI0U2REFCRiIgLz4gPCEtLSBJbm5lciBUeW1wYW51bSAoUmVjZXNzZWQgYXJlYSkgLS0+IDxwb2x5Z29uIHBvaW50cz0iMTI0LDg2IDM4MCwzNCA2MzYsODYiIGZpbGw9IiM4Rjc4NTUiIC8+IDwhLS0gQWJzdHJhY3QgUGVkaW1lbnQgU2N1bHB0dXJlcyAoU3RhdHVhcnkpIC0tPiA8cGF0aCBkPSJNMzcwLDg2IEwzNzUsNTAgTDM4NSw1MCBMMzkwLDg2IFoiIGZpbGw9IiNENEM0QTEiIC8+IDxjaXJjbGUgY3g9IjM4MCIgY3k9IjQ1IiByPSI1IiBmaWxsPSIjRDRDNEExIiAvPiA8cGF0aCBkPSJNMzUwLDg2IEwzNDUsNjUgTDM2MCw2MCBMMzY1LDg2IFoiIGZpbGw9IiNDMkIwODkiIC8+IDxwYXRoIGQ9Ik00MTAsODYgTDQxNSw2NSBMNDAwLDYwIEwzOTUsODYgWiIgZmlsbD0iI0MyQjA4OSIgLz4gPHBhdGggZD0iTTMyMCw4NiBMMzEwLDc1IEwzMzAsNzAgTDM0MCw4NiBaIiBmaWxsPSIjRDRDNEExIiAvPiA8cGF0aCBkPSJNNDQwLDg2IEw0NTAsNzUgTDQzMCw3MCBMNDIwLDg2IFoiIGZpbGw9IiNENEM0QTEiIC8+IDxwYXRoIGQ9Ik0yODAsODYgTDI3MCw4MCBMMjkwLDc1IEwzMDAsODYgWiIgZmlsbD0iI0MyQjA4OSIgLz4gPHBhdGggZD0iTTQ4MCw4NiBMNDkwLDgwIEw0NzAsNzUgTDQ2MCw4NiBaIiBmaWxsPSIjQzJCMDg5IiAvPiA8IS0tIFJha2luZyBDb3JuaWNlIChVcHBlciBlZGdlIG9mIHJvb2YpIC0tPiA8cG9seWdvbiBwb2ludHM9Ijk4LDg2IDM4MCwxOCA2NjIsODYgNjYyLDgwIDM4MCwxMiA5OCw4MCIgZmlsbD0iI0Q0QzRBMSIgLz4gPC9nPiA8IS0tIEFjcm90ZXJpYSAoUm9vZiBPcm5hbWVudHMpIC0tPiA8ZyBpZD0iYWNyb3RlcmlhIj4gPCEtLSBDZW50ZXIgKEFwZXgpIC0tPiA8cG9seWdvbiBwb2ludHM9IjM3MiwxMiAzODgsMTIgMzg0LDAgMzc2LDAiIGZpbGw9IiNDMkIwODkiIC8+IDwhLS0gTGVmdCBDb3JuZXIgLS0+IDxwb2x5Z29uIHBvaW50cz0iOTgsODAgMTEwLDgwIDExNCw2OCAxMDQsNzAiIGZpbGw9IiNDMkIwODkiIC8+IDwhLS0gUmlnaHQgQ29ybmVyIC0tPiA8cG9seWdvbiBwb2ludHM9IjY2Miw4MCA2NTAsODAgNjQ2LDY4IDY1Niw3MCIgZmlsbD0iI0MyQjA4OSIgLz4gPC9nPiA8L3N2Zz4=',
    'BATMAN BLDG': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgODAwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj4gPGRlZnM+IDxjbGlwUGF0aCBpZD0idG9wR2xhc3NDbGlwIj4gPHBvbHlnb24gcG9pbnRzPSIxMjUsMjA1IDI3NSwyMDUgMjM1LDMzMCAxNjUsMzMwIi8+IDwvY2xpcFBhdGg+IDwhLS0gU3VidGxlIHJlZmxlY3RpdmUgYmx1ZSBncmFkaWVudHMgZm9yIHRoZSBnbGFzcyBjb3JlIC0tPiA8bGluZWFyR3JhZGllbnQgaWQ9ImNlbnRyYWxHbGFzc0dyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIwJSI+IDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwODE0MjM7IHN0b3Atb3BhY2l0eToxIiAvPiA8IS0tIFNsaWdodGx5IGRhcmtlciBibHVlIGZvciBsZWZ0IC0tPiA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwQzIwMzA7IHN0b3Atb3BhY2l0eToxIiAvPiA8IS0tIFNsaWdodGx5IGxpZ2h0ZXIgYmx1ZSBmb3IgcmlnaHQgLS0+IDwvbGluZWFyR3JhZGllbnQ+IDxsaW5lYXJHcmFkaWVudCBpZD0ic2xvcGVkR2xhc3NHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPiA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMEExNjI4OyBzdG9wLW9wYWNpdHk6MSIgLz4gPCEtLSBTbGlnaHRseSBkYXJrZXIgYmx1ZSBmb3IgbGVmdCAtLT4gPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMTIyODNBOyBzdG9wLW9wYWNpdHk6MSIgLz4gPCEtLSBTbGlnaHRseSBsaWdodGVyIGJsdWUgZm9yIHJpZ2h0IC0tPiA8L2xpbmVhckdyYWRpZW50PiA8IS0tIEVudmlyb25tZW50IGdyYWRpZW50IGZvciBpbXBsaWNpdCByZWZsZWN0aW9uIGNvbnRleHQgLS0+IDxsaW5lYXJHcmFkaWVudCBpZD0icmVmbGVjdGlvbkNvbnRleHRHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPiA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojQzBEMEUwOyBzdG9wLW9wYWNpdHk6MSIgLz4gPCEtLSBMZWZ0IHNreTogZGFya2VyIGdyZXktYmx1ZSAtLT4gPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRDBFOEY4OyBzdG9wLW9wYWNpdHk6MSIgLz4gPCEtLSBSaWdodCBza3k6IGxpZ2h0ZXIgZ3JleS1ibHVlIC0tPiA8L2xpbmVhckdyYWRpZW50PiA8L2RlZnM+IDwhLS0gSW1wbGljaXQgYmFja2dyb3VuZCBmaWxsIGZvciByZWZsZWN0aW9uIGNvbnRleHQgYW5kIG5vIHdoaXRlIHNwYWNlIC0tPiA8IS0tIFRvcCBBbnRlbm5hZSAtLT4gPGxpbmUgeDE9IjExMi41IiB5MT0iNjAiIHgyPSIxMTIuNSIgeTI9IjIwIiBzdHJva2U9IiM3QTgwODQiIHN0cm9rZS13aWR0aD0iMi41Ii8+IDxsaW5lIHgxPSIyODcuNSIgeTE9IjYwIiB4Mj0iMjg3LjUiIHkyPSIyMCIgc3Ryb2tlPSIjN0E4MDg0IiBzdHJva2Utd2lkdGg9IjIuNSIvPiA8IS0tIExlZnQgU3BpcmUgKCJFYXIiKSAtLT4gPGcgaWQ9ImxlZnQtc3BpcmUiPiA8cG9seWdvbiBwb2ludHM9IjEwMCwyMDAgMTI1LDIwMCAxMjUsMTIwIDExNiw4MCAxMTQsNjAgMTExLDYwIDEwOSw4MCAxMDAsMTIwIiBmaWxsPSIjQzRDOUNDIi8+IDxwb2x5Z29uIHBvaW50cz0iMTEyLjUsMjAwIDEyNSwyMDAgMTI1LDEyMCAxMTYsODAgMTE0LDYwIDExMi41LDYwIiBmaWxsPSIjQThBREIwIi8+IDxsaW5lIHgxPSIxMDYiIHkxPSIxMjAiIHgyPSIxMDYiIHkyPSIyMDAiIHN0cm9rZT0iIzlFQTRBOCIgc3Ryb2tlLXdpZHRoPSIxIi8+IDxsaW5lIHgxPSIxMTIuNSIgeTE9IjgwIiB4Mj0iMTEyLjUiIHkyPSIyMDAiIHN0cm9rZT0iIzlFQTRBOCIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4gPGxpbmUgeDE9IjExOSIgeTE9IjEyMCIgeDI9IjExOSIgeTI9IjIwMCIgc3Ryb2tlPSIjOUVBNEE4IiBzdHJva2Utd2lkdGg9IjEiLz4gPC9nPiA8IS0tIFJpZ2h0IFNwaXJlICgiRWFyIikgLS0+IDxnIGlkPSJyaWdodC1zcGlyZSI+IDxwb2x5Z29uIHBvaW50cz0iMjc1LDIwMCAzMDAsMjAwIDMwMCwxMjAgMjkxLDgwIDI4OSw2MCAyODYsNjAgMjg0LDgwIDI3NSwxMjAiIGZpbGw9IiNDNEM5Q0MiLz4gPHBvbHlnb24gcG9pbnRzPSIyNzUsMjAwIDI4Ny41LDIwMCAyODcuNSw2MCAyODYsNjAgMjg0LDgwIDI3NSwxMjAiIGZpbGw9IiNBOEFEQjAiLz4gPGxpbmUgeDE9IjI4MSIgeTE9IjEyMCIgeDI9IjI4MSIgeTI9IjIwMCIgc3Ryb2tlPSIjOUVBNEE4IiBzdHJva2Utd2lkdGg9IjEiLz4gPGxpbmUgeDE9IjI4Ny41IiB5MT0iODAiIHgyPSIyODcuNSIgeTI9IjIwMCIgc3Ryb2tlPSIjOUVBNEE4IiBzdHJva2Utd2lkdGg9IjEuNSIvPiA8bGluZSB4MT0iMjk0IiB5MT0iMTIwIiB4Mj0iMjk0IiB5Mj0iMjAwIiBzdHJva2U9IiM5RUE0QTgiIHN0cm9rZS13aWR0aD0iMSIvPiA8L2c+IDwhLS0gVG9wIEJyaWRnZSAvIFJvb2YgU3RydWN0dXJlIChObyBMb2dvKSAtLT4gPGcgaWQ9InRvcC1icmlkZ2UiPiA8cG9seWdvbiBwb2ludHM9IjEyNSwyMDAgMjc1LDIwMCAyNzUsMTcwIDI2MCwxNTAgMTQwLDE1MCAxMjUsMTcwIiBmaWxsPSIjRTZFQUVGIi8+IDwhLS0gQnJpZGdlIGluc2V0IC8gc2hhZG93IC0tPiA8cG9seWdvbiBwb2ludHM9IjEyNSwyMDUgMjc1LDIwNSAyNzUsMTc1IDI1OCwxNTUgMTQyLDE1NSAxMjUsMTc1IiBmaWxsPSIjQThBRUIzIi8+IDxwb2x5Z29uIHBvaW50cz0iMTQwLDIwNSAyNjAsMjA1IDI2MCwxODAgMjQ1LDE2NSAxNTUsMTY1IDE0MCwxODAiIGZpbGw9IiM4ODkxOTYiLz4gPC9nPiA8IS0tIFNsb3BlZCBUb3AgR2xhc3MgKFRyYXBlem9pZCwgR3JhZGllbnQgRmlsbCkgLS0+IDxnIGlkPSJzbG9wZWQtZ2xhc3MiPiA8cG9seWdvbiBwb2ludHM9IjEyNSwyMDUgMjc1LDIwNSAyMzUsMzMwIDE2NSwzMzAiIGZpbGw9InVybCgjc2xvcGVkR2xhc3NHcmFkaWVudCkiLz4gPGcgY2xpcC1wYXRoPSJ1cmwoI3RvcEdsYXNzQ2xpcCkiPiA8cGF0aCBkPSJNMTIwLDIwNSBWMzMwIE0xMzAsMjA1IFYzMzAgTTE0MCwyMDUgVjMzMCBNMTUwLDIwNSBWMzMwIE0xNjAsMjA1IFYzMzAgTTE3MCwyMDUgVjMzMCBNMTgwLDIwNSBWMzMwIE0xOTAsMjA1IFYzMzAgTTIwMCwyMDUgVjMzMCBNMjEwLDIwNSBWMzMwIE0yMjAsMjA1IFYzMzAgTTIzMCwyMDUgVjMzMCBNMjQwLDIwNSBWMzMwIE0yNTAsMjA1IFYzMzAgTTI2MCwyMDUgVjMzMCBNMjcwLDIwNSBWMzMwIiBzdHJva2U9IiMxRDQzNkIiIHN0cm9rZS13aWR0aD0iMSIvPiA8cGF0aCBkPSJNMTAwLDIxNSBIMzAwIE0xMDAsMjI1IEgzMDAgTTEwMCwyMzUgSDMwMCBNMTAwLDI0NSBIMzAwIE0xMDAsMjU1IEgzMDAgTTEwMCwyNjUgSDMwMCBNMTAwLDI3NSBIMzAwIE0xMDAsMjg1IEgzMDAgTTEwMCwyOTUgSDMwMCBNMTAwLDMwNSBIMzAwIE0xMDAsMzE1IEgzMDAgTTEwMCwzMjUgSDMwMCIgc3Ryb2tlPSIjMUQ0MzZCIiBzdHJva2Utd2lkdGg9IjEiLz4gPC9nPiA8L2c+IDwhLS0gQ2VudHJhbCBWZXJ0aWNhbCBHbGFzcyBDb3JlIChHcmFkaWVudCBGaWxsKSAtLT4gPGcgaWQ9ImNlbnRyYWwtZ2xhc3MiPiA8cmVjdCB4PSIxNjUiIHk9IjMzMCIgd2lkdGg9IjcwIiBoZWlnaHQ9IjM5MCIgZmlsbD0idXJsKCNjZW50cmFsR2xhc3NHcmFkaWVudCkiLz4gPHBhdGggZD0iTTE3NSwzMzAgVjcyMCBNMTg1LDMzMCBWNzIwIE0xOTUsMzMwIFY3MjAgTTIwNSwzMzAgVjcyMCBNMjE1LDMzMCBWNzIwIE0yMjUsMzMwIFY3MjAiIHN0cm9rZT0iIzFENDM2QiIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4gPCEtLSBIb3Jpem9udGFsIFN0cnVjdHVyYWwgU2hhZG93cyAtLT4gPGxpbmUgeDE9IjE2NSIgeTE9IjQxMCIgeDI9IjIzNSIgeTI9IjQxMCIgc3Ryb2tlPSIjMDQwQTEyIiBzdHJva2Utd2lkdGg9IjIiLz4gPGxpbmUgeDE9IjE2NSIgeTE9IjQ5MCIgeDI9IjIzNSIgeTI9IjQ5MCIgc3Ryb2tlPSIjMDQwQTEyIiBzdHJva2Utd2lkdGg9IjIiLz4gPGxpbmUgeDE9IjE2NSIgeTE9IjU3MCIgeDI9IjIzNSIgeTI9IjU3MCIgc3Ryb2tlPSIjMDQwQTEyIiBzdHJva2Utd2lkdGg9IjIiLz4gPGxpbmUgeDE9IjE2NSIgeTE9IjY1MCIgeDI9IjIzNSIgeTI9IjY1MCIgc3Ryb2tlPSIjMDQwQTEyIiBzdHJva2Utd2lkdGg9IjIiLz4gPC9nPiA8IS0tIFN0b25lIFBpbGxhcnMgLSBMZWZ0IFNpZGUgKE91dGVyIHRvIElubmVyKSAtLT4gPGcgaWQ9ImxlZnQtcGlsbGFycyI+IDwhLS0gT3V0ZXIgTGF5ZXIgKFRhbGxlc3QpIC0tPiA8cmVjdCB4PSIxMDAiIHk9IjIwMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjUyMCIgZmlsbD0iI0M1QUE4QyIvPiA8cmVjdCB4PSIxMDAiIHk9IjIwMCIgd2lkdGg9IjMiIGhlaWdodD0iNTIwIiBmaWxsPSIjRTJDREI2Ii8+IDxyZWN0IHg9IjEyMiIgeT0iMjAwIiB3aWR0aD0iMyIgaGVpZ2h0PSI1MjAiIGZpbGw9IiNBMDg2NkEiLz4gPGxpbmUgeDE9IjEwNy41IiB5MT0iMjAwIiB4Mj0iMTA3LjUiIHkyPSI3MjAiIHN0cm9rZT0iIzE1MUExRSIgc3Ryb2tlLXdpZHRoPSI0LjUiIHN0cm9rZS1kYXNoYXJyYXk9IjE0IDUiLz4gPGxpbmUgeDE9IjExNy41IiB5MT0iMjAwIiB4Mj0iMTE3LjUiIHkyPSI3MjAiIHN0cm9rZT0iIzE1MUExRSIgc3Ryb2tlLXdpZHRoPSI0LjUiIHN0cm9rZS1kYXNoYXJyYXk9IjE0IDUiLz4gPCEtLSBNaWRkbGUgTGF5ZXIgLS0+IDxyZWN0IHg9IjEyNSIgeT0iMzEwIiB3aWR0aD0iMjAiIGhlaWdodD0iNDEwIiBmaWxsPSIjQzVBQThDIi8+IDxyZWN0IHg9IjEyNSIgeT0iMzEwIiB3aWR0aD0iMyIgaGVpZ2h0PSI0MTAiIGZpbGw9IiNFMkNEQjYiLz4gPHJlY3QgeD0iMTQyIiB5PSIzMTAiIHdpZHRoPSIzIiBoZWlnaHQ9IjQxMCIgZmlsbD0iI0EwODY2QSIvPiA8bGluZSB4MT0iMTMxIiB5MT0iMzEwIiB4Mj0iMTMxIiB5Mj0iNzIwIiBzdHJva2U9IiMxNTFBMUUiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMTQgNSIvPiA8bGluZSB4MT0iMTM5IiB5MT0iMzEwIiB4Mj0iMTM5IiB5Mj0iNzIwIiBzdHJva2U9IiMxNTFBMUUiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMTQgNSIvPiA8IS0tIElubmVyIExheWVyIChTaG9ydGVzdCkgLS0+IDxyZWN0IHg9IjE0NSIgeT0iNDIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMzAwIiBmaWxsPSIjQzVBQThDIi8+IDxyZWN0IHg9IjE0NSIgeT0iNDIwIiB3aWR0aD0iMyIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNFMkNEQjYiLz4gPHJlY3QgeD0iMTYyIiB5PSI0MjAiIHdpZHRoPSIzIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0EwODY2QSIvPiA8bGluZSB4MT0iMTUxIiB5MT0iNDIwIiB4Mj0iMTUxIiB5Mj0iNzIwIiBzdHJva2U9IiMxNTFBMUUiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMTQgNSIvPiA8bGluZSB4MT0iMTU5IiB5MT0iNDIwIiB4Mj0iMTU5IiB5Mj0iNzIwIiBzdHJva2U9IiMxNTFBMUUiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMTQgNSIvPiA8L2c+IDwhLS0gU3RvbmUgUGlsbGFycyAtIFJpZ2h0IFNpZGUgKElubmVyIHRvIE91dGVyKSAtLT4gPGcgaWQ9InJpZ2h0LXBpbGxhcnMiPiA8IS0tIElubmVyIExheWVyIChTaG9ydGVzdCkgLS0+IDxyZWN0IHg9IjIzNSIgeT0iNDIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMzAwIiBmaWxsPSIjQzVBQThDIi8+IDxyZWN0IHg9IjIzNSIgeT0iNDIwIiB3aWR0aD0iMyIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNFMkNEQjYiLz4gPHJlY3QgeD0iMjUyIiB5PSI0MjAiIHdpZHRoPSIzIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0EwODY2QSIvPiA8bGluZSB4MT0iMjQxIiB5MT0iNDIwIiB4Mj0iMjQxIiB5Mj0iNzIwIiBzdHJva2U9IiMxNTFBMUUiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMTQgNSIvPiA8bGluZSB4MT0iMjQ5IiB5MT0iNDIwIiB4Mj0iMjQ5IiB5Mj0iNzIwIiBzdHJva2U9IiMxNTFBMUUiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMTQgNSIvPiA8IS0tIE1pZGRsZSBMYXllciAtLT4gPHJlY3QgeD0iMjU1IiB5PSIzMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI0MTAiIGZpbGw9IiNDNUFBOEMiLz4gPHJlY3QgeD0iMjU1IiB5PSIzMTAiIHdpZHRoPSIzIiBoZWlnaHQ9IjQxMCIgZmlsbD0iI0UyQ0RCNiIvPiA8cmVjdCB4PSIyNzIiIHk9IjMxMCIgd2lkdGg9IjMiIGhlaWdodD0iNDEwIiBmaWxsPSIjQTA4NjZBIi8+IDxsaW5lIHgxPSIyNjEiIHkxPSIzMTAiIHgyPSIyNjEiIHkyPSI3MjAiIHN0cm9rZT0iIzE1MUExRSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtZGFzaGFycmF5PSIxNCA1Ii8+IDxsaW5lIHgxPSIyNjkiIHkxPSIzMTAiIHgyPSIyNjkiIHkyPSI3MjAiIHN0cm9rZT0iIzE1MUExRSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtZGFzaGFycmF5PSIxNCA1Ii8+IDwhLS0gT3V0ZXIgTGF5ZXIgKFRhbGxlc3QpIC0tPiA8cmVjdCB4PSIyNzUiIHk9IjIwMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjUyMCIgZmlsbD0iI0M1QUE4QyIvPiA8cmVjdCB4PSIyNzUiIHk9IjIwMCIgd2lkdGg9IjMiIGhlaWdodD0iNTIwIiBmaWxsPSIjRTJDREI2Ii8+IDxyZWN0IHg9IjI5NyIgeT0iMjAwIiB3aWR0aD0iMyIgaGVpZ2h0PSI1MjAiIGZpbGw9IiNBMDg2NkEiLz4gPGxpbmUgeDE9IjI4Mi41IiB5MT0iMjAwIiB4Mj0iMjgyLjUiIHkyPSI3MjAiIHN0cm9rZT0iIzE1MUExRSIgc3Ryb2tlLXdpZHRoPSI0LjUiIHN0cm9rZS1kYXNoYXJyYXk9IjE0IDUiLz4gPGxpbmUgeDE9IjI5Mi41IiB5MT0iMjAwIiB4Mj0iMjkyLjUiIHkyPSI3MjAiIHN0cm9rZT0iIzE1MUExRSIgc3Ryb2tlLXdpZHRoPSI0LjUiIHN0cm9rZS1kYXNoYXJyYXk9IjE0IDUiLz4gPC9nPiA8IS0tIEJhc2UgJiBBdHJpdW1zIC0tPiA8ZyBpZD0iYnVpbGRpbmctYmFzZSI+IDwhLS0gTWFpbiBCcmljayBGb3VuZGF0aW9uIC0tPiA8cmVjdCB4PSI5MCIgeT0iNzIwIiB3aWR0aD0iMjIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjNzU0QjNBIi8+IDxyZWN0IHg9IjEwMCIgeT0iNzMwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjcwIiBmaWxsPSIjMTUxNTE1Ii8+IDxyZWN0IHg9IjEwNSIgeT0iNzM1IiB3aWR0aD0iMTkwIiBoZWlnaHQ9IjY1IiBmaWxsPSIjMjAxQTE4Ii8+IDwhLS0gTGVmdCBHbGFzcyBBdHJpdW0gLS0+IDxwb2x5Z29uIHBvaW50cz0iMTIwLDcyMCAxNjAsNzIwIDE0MCw2OTUiIGZpbGw9IiMyQTVDNkQiIHN0cm9rZT0iIzFFNDI0RiIgc3Ryb2tlLXdpZHRoPSIxIi8+IDxsaW5lIHgxPSIxNDAiIHkxPSI2OTUiIHgyPSIxNDAiIHkyPSI3MjAiIHN0cm9rZT0iIzQ4ODY5QyIgc3Ryb2tlLXdpZHRoPSIxIi8+IDwhLS0gQ2VudGVyIEdsYXNzIEF0cml1bSAtLT4gPHBvbHlnb24gcG9pbnRzPSIxNzAsNzIwIDIzMCw3MjAgMjAwLDY4MCIgZmlsbD0iIzJBNUM2RCIgc3Ryb2tlPSIjMUU0MjRGIiBzdHJva2Utd2lkdGg9IjEiLz4gPGxpbmUgeDE9IjIwMCIgeTE9IjY4MCIgeDI9IjIwMCIgeTI9IjcyMCIgc3Ryb2tlPSIjNDg4NjlDIiBzdHJva2Utd2lkdGg9IjEiLz4gPCEtLSBSaWdodCBHbGFzcyBBdHJpdW0gLS0+IDxwb2x5Z29uIHBvaW50cz0iMjQwLDcyMCAyODAsNzIwIDI2MCw2OTUiIGZpbGw9IiMyQTVDNkQiIHN0cm9rZT0iIzFFNDI0RiIgc3Ryb2tlLXdpZHRoPSIxIi8+IDxsaW5lIHgxPSIyNjAiIHkxPSI2OTUiIHgyPSIyNjAiIHkyPSI3MjAiIHN0cm9rZT0iIzQ4ODY5QyIgc3Ryb2tlLXdpZHRoPSIxIi8+IDwvZz4gPC9zdmc+',
    'RYMAN':       'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MDAgNTAwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj4gPGRlZnM+IDwhLS0gUmV1c2FibGUgR290aGljIEFyY2hlZCBXaW5kb3cgLS0+IDxnIGlkPSJnb3RoaWMtd2luZG93Ij4gPCEtLSBXaW5kb3cgZ2xhc3MgLS0+IDxyZWN0IHg9IjAiIHk9IjMwIiB3aWR0aD0iMzAiIGhlaWdodD0iNzAiIGZpbGw9IiMyOTM4NDUiIC8+IDxwYXRoIGQ9Ik0gMCwzMCBRIDUsMTAgMTUsMCBRIDI1LDEwIDMwLDMwIFoiIGZpbGw9IiMyOTM4NDUiIC8+IDwhLS0gT3V0ZXIgVHJpbSAtLT4gPHJlY3QgeD0iMCIgeT0iMzAiIHdpZHRoPSIzMCIgaGVpZ2h0PSI3MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRTNEQUM5IiBzdHJva2Utd2lkdGg9IjIiIC8+IDxwYXRoIGQ9Ik0gMCwzMCBRIDUsMTAgMTUsMCBRIDI1LDEwIDMwLDMwIiBmaWxsPSJub25lIiBzdHJva2U9IiNFM0RBQzkiIHN0cm9rZS13aWR0aD0iMiIgLz4gPCEtLSBXaW5kb3cgUGFuZXMgKE11bGxpb25zKSAtLT4gPGxpbmUgeDE9IjE1IiB5MT0iMCIgeDI9IjE1IiB5Mj0iMTAwIiBzdHJva2U9IiNFM0RBQzkiIHN0cm9rZS13aWR0aD0iMS41IiAvPiA8bGluZSB4MT0iMCIgeTE9IjUwIiB4Mj0iMzAiIHkyPSI1MCIgc3Ryb2tlPSIjRTNEQUM5IiBzdHJva2Utd2lkdGg9IjEuNSIgLz4gPGxpbmUgeDE9IjAiIHkxPSI3NSIgeDI9IjMwIiB5Mj0iNzUiIHN0cm9rZT0iI0UzREFDOSIgc3Ryb2tlLXdpZHRoPSIxLjUiIC8+IDwhLS0gU2lsbCAtLT4gPHJlY3QgeD0iLTMiIHk9IjEwMCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjQiIGZpbGw9IiNFM0RBQzkiIHJ4PSIxIiAvPiA8L2c+IDwvZGVmcz4gPCEtLSBCYWNrZ3JvdW5kIEJhc2UgKFRyYW5zcGFyZW50IGZvciBjaXR5c2NhcGUsIGFkZGVkIHNreSBvcHRpb25hbGx5IG9taXR0ZWQpIC0tPiA8IS0tIDEuIEN1cG9sYSAvIFJvb2YgU3BpcmUgLS0+IDxyZWN0IHg9IjI0MiIgeT0iODAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIyMCIgZmlsbD0iIzhDMkUyMCIvPiA8cG9seWdvbiBwb2ludHM9IjIzOCw4MCAyNTAsNjUgMjYyLDgwIiBmaWxsPSIjMjkzODQ1Ii8+IDxsaW5lIHgxPSIyNTAiIHkxPSI2NSIgeDI9IjI1MCIgeTI9IjUwIiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPiA8Y2lyY2xlIGN4PSIyNTAiIGN5PSI1MCIgcj0iMiIgZmlsbD0iIzMzMzMzMyIvPiA8IS0tIDIuIE1haW4gQnVpbGRpbmcgV2FsbHMgKEJyaWNrIEJhc2UpIC0tPiA8IS0tIENlbnRlciBCbG9jayAtLT4gPHJlY3QgeD0iMTMwIiB5PSIxOTAiIHdpZHRoPSIyNDAiIGhlaWdodD0iMjYwIiBmaWxsPSIjQTYzQTI5Ii8+IDwhLS0gQ2VudGVyIEdhYmxlIC0tPiA8cG9seWdvbiBwb2ludHM9IjEzMCwxOTAgMjUwLDEwMCAzNzAsMTkwIiBmaWxsPSIjQTYzQTI5Ii8+IDwhLS0gTGVmdCBXaW5nIC0tPiA8cmVjdCB4PSI3MCIgeT0iMjQwIiB3aWR0aD0iNjAiIGhlaWdodD0iMjEwIiBmaWxsPSIjQTYzQTI5Ii8+IDwhLS0gUmlnaHQgV2luZyAtLT4gPHJlY3QgeD0iMzcwIiB5PSIyNDAiIHdpZHRoPSI2MCIgaGVpZ2h0PSIyMTAiIGZpbGw9IiNBNjNBMjkiLz4gPCEtLSAzLiBIb3Jpem9udGFsIFN0b25lIEJhbmRpbmcgLS0+IDxsaW5lIHgxPSI3MCIgeTE9IjM0MCIgeDI9IjQzMCIgeTI9IjM0MCIgc3Ryb2tlPSIjRTNEQUM5IiBzdHJva2Utd2lkdGg9IjMiIC8+IDxsaW5lIHgxPSI3MCIgeTE9IjM5MCIgeDI9IjQzMCIgeTI9IjM5MCIgc3Ryb2tlPSIjRTNEQUM5IiBzdHJva2Utd2lkdGg9IjMiIC8+IDwhLS0gNC4gVmVydGljYWwgUGlsbGFycyAvIEJ1dHRyZXNzZXMgLS0+IDwhLS0gQ2VudGVyIGVkZ2VzIC0tPiA8cmVjdCB4PSIxMzAiIHk9IjE5MCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjI2MCIgZmlsbD0iIzhDMkUyMCIvPiA8cmVjdCB4PSIzNTIiIHk9IjE5MCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjI2MCIgZmlsbD0iIzhDMkUyMCIvPiA8IS0tIENlbnRlciBpbm5lciAtLT4gPHJlY3QgeD0iMjEwIiB5PSIxOTAiIHdpZHRoPSIxMiIgaGVpZ2h0PSIyNjAiIGZpbGw9IiM4QzJFMjAiLz4gPHJlY3QgeD0iMjc4IiB5PSIxOTAiIHdpZHRoPSIxMiIgaGVpZ2h0PSIyNjAiIGZpbGw9IiM4QzJFMjAiLz4gPCEtLSBPdXRlciB3aW5nIGVkZ2VzIC0tPiA8cmVjdCB4PSI3MCIgeT0iMjQwIiB3aWR0aD0iMTUiIGhlaWdodD0iMjEwIiBmaWxsPSIjOEMyRTIwIi8+IDxyZWN0IHg9IjQxNSIgeT0iMjQwIiB3aWR0aD0iMTUiIGhlaWdodD0iMjEwIiBmaWxsPSIjOEMyRTIwIi8+IDwhLS0gNS4gV2luZG93cyAtLT4gPCEtLSBMZWZ0IFdpbmcgV2luZG93IC0tPiA8dXNlIGhyZWY9IiNnb3RoaWMtd2luZG93IiB4PSI5MiIgeT0iMjI1IiAvPiA8IS0tIENlbnRlciBXaW5kb3dzIC0tPiA8dXNlIGhyZWY9IiNnb3RoaWMtd2luZG93IiB4PSIxNjQiIHk9IjE5MCIgLz4gPHVzZSBocmVmPSIjZ290aGljLXdpbmRvdyIgeD0iMjM1IiB5PSIxOTAiIC8+IDx1c2UgaHJlZj0iI2dvdGhpYy13aW5kb3ciIHg9IjMwNiIgeT0iMTkwIiAvPiA8IS0tIFJpZ2h0IFdpbmcgV2luZG93IC0tPiA8dXNlIGhyZWY9IiNnb3RoaWMtd2luZG93IiB4PSIzNzgiIHk9IjIyNSIgLz4gPCEtLSA2LiBSb29mIENhcHMgYW5kIFRyaW1zIC0tPiA8IS0tIE1haW4gR2FibGUgVHJpbSAtLT4gPHBvbHlsaW5lIHBvaW50cz0iMTIwLDE5OCAyNTAsMTAwIDM4MCwxOTgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0UzREFDOSIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+IDwhLS0gR2FibGUgQXJjaCBSZWxpZWYgLS0+IDxwYXRoIGQ9Ik0gMTcwLDE5MCBRIDI1MCwxMzUgMzMwLDE5MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRTNEQUM5IiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9IjAuNiIvPiA8IS0tIExlZnQgV2luZyBUcmltIC0tPiA8bGluZSB4MT0iNjUiIHkxPSIyNDAiIHgyPSIxNDAiIHkyPSIyNDAiIHN0cm9rZT0iI0UzREFDOSIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4gPCEtLSBSaWdodCBXaW5nIFRyaW0gLS0+IDxsaW5lIHgxPSIzNjAiIHkxPSIyNDAiIHgyPSI0MzUiIHkyPSIyNDAiIHN0cm9rZT0iI0UzREFDOSIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4gPCEtLSA3LiBNYWluIEVudHJhbmNlIC8gRG9vcnMgLS0+IDxyZWN0IHg9IjIyMiIgeT0iNDAwIiB3aWR0aD0iNTYiIGhlaWdodD0iNTAiIGZpbGw9IiMyQTE2MTAiIC8+IDxwYXRoIGQ9Ik0gMjIyLDQwMCBRIDI1MCwzNzUgMjc4LDQwMCBaIiBmaWxsPSIjMkExNjEwIiAvPiA8IS0tIERvb3IgVHJpbSAtLT4gPHBhdGggZD0iTSAyMjIsNDUwIEwgMjIyLDQwMCBRIDI1MCwzNzUgMjc4LDQwMCBMIDI3OCw0NTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0UzREFDOSIgc3Ryb2tlLXdpZHRoPSIzIiAvPiA8IS0tIENlbnRlciBEb29yIFNwbGl0ICYgSGFuZGxlcyAtLT4gPGxpbmUgeDE9IjI1MCIgeTE9IjM4OCIgeDI9IjI1MCIgeTI9IjQ1MCIgc3Ryb2tlPSIjRTNEQUM5IiBzdHJva2Utd2lkdGg9IjEuNSIgLz4gPGNpcmNsZSBjeD0iMjQ1IiBjeT0iNDI1IiByPSIxLjUiIGZpbGw9IiNFM0RBQzkiIC8+IDxjaXJjbGUgY3g9IjI1NSIgY3k9IjQyNSIgcj0iMS41IiBmaWxsPSIjRTNEQUM5IiAvPiA8IS0tIDguIFNpZ25hZ2UgLS0+IDxyZWN0IHg9IjIwNSIgeT0iMTU1IiB3aWR0aD0iOTAiIGhlaWdodD0iMjAiIGZpbGw9IiNFM0RBQzkiIHJ4PSIyIiAvPiA8dGV4dCB4PSIyNTAiIHk9IjE2OSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjExIiBmaWxsPSIjMkExNjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMS41Ij5SWU1BTjwvdGV4dD4gPCEtLSA5LiBHcm91bmQgJiBTdGVwcyAtLT4gPHJlY3QgeD0iMjAwIiB5PSI0NTAiIHdpZHRoPSIxMDAiIGhlaWdodD0iNCIgZmlsbD0iI0IwQjBCMCIgLz4gPHJlY3QgeD0iMTg1IiB5PSI0NTQiIHdpZHRoPSIxMzAiIGhlaWdodD0iNCIgZmlsbD0iIzkwOTA5MCIgLz4gPHJlY3QgeD0iMTcwIiB5PSI0NTgiIHdpZHRoPSIxNjAiIGhlaWdodD0iNCIgZmlsbD0iIzcwNzA3MCIgLz4gPCEtLSBCYXNlIEZvdW5kYXRpb24gTGluZSAtLT4gPGxpbmUgeDE9IjMwIiB5MT0iNDYyIiB4Mj0iNDcwIiB5Mj0iNDYyIiBzdHJva2U9IiMyMjIyMjIiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPiA8L3N2Zz4=',
};
// ⚠️ MODULE-LEVEL, SO THE DECODE HAPPENS ONCE FOR THE LIFE OF THE PAGE rather
// than once per mount(). A student replaying ten times decodes three SVGs once.
const LANDMARK_IMG = {};
for (const k of Object.keys(LANDMARK_SVG)) {
    const im = new Image();
    im.src = LANDMARK_SVG[k];
    LANDMARK_IMG[k] = im;
}
// Natural aspect ratios, so a landmark is never stretched. Taken from each
// SVG's own viewBox.
const LANDMARK_BOX = {
    'PARTHENON':   { w: 760, h: 360, drawH: LAY.LANDMARK_HEIGHTS['PARTHENON'] },
    'BATMAN BLDG': { w: 400, h: 800, drawH: LAY.LANDMARK_HEIGHTS['BATMAN BLDG'] },
    'RYMAN':       { w: 500, h: 500, drawH: LAY.LANDMARK_HEIGHTS['RYMAN'] },
};

// ⚠️ HOW FLAT THE DOMES ARE DRAWN. 1.0 is a true half-circle. Lowering this
// gives falling words more sky WITHOUT changing which lanes a dome protects —
// coverage is a horizontal test against `radius`, which this does not touch.
const DOME_SQUASH = LAY.DOME_SQUASH;

const MISFIRE_DARK_MS = 260;   // purely visual; see the header
const MISSILE_SPEED = 900;     // px/sec, generous — the missile is feedback, not a mechanic

/**
 * Mount the game.
 *
 * @param {HTMLElement} container  the game gets a canvas inside this, sized to it
 * @param {object} opts
 *   config   {object}   a GameDirector config from game-shell.js
 *   onEnd    {function} called ONCE with the director's report
 *   onTick   {function} optional, called with the report each second for a HUD
 * @returns {{ destroy: function }}
 *
 * ⚠️ destroy() IS NOT OPTIONAL AND THE PROTOTYPES HAD NOTHING LIKE IT. They
 * attached a `window` keydown listener and ran a requestAnimationFrame loop
 * forever. Mounted inside learn.html, that means a game the student left is still
 * eating keystrokes from the next drill. Every listener and the loop are torn
 * down here.
 */
export function mount(container, opts) {
    const cfg = (opts && opts.config) || {};
    const onEnd = (opts && opts.onEnd) || function () {};
    const onTick = (opts && opts.onTick) || null;

    // ⚠️ THE INJECTED RAND, NOT Math.random. An earlier draft used Math.random()
    // for lanes and spawn positions, so a lane sequence could not be reproduced
    // in a harness — the one thing that makes a "it only happens sometimes" bug
    // report investigable.
    const rand = cfg.rand || Math.random;
    const onQuit = (opts && opts.onQuit) || function () {};
    // ⚠️⚠️ THE MINUTES ARE SUPPLIED BY THE CALLER, NEVER READ HERE. Jake wants
    // the student's daily and weekly totals under the keyboard, and those live
    // in daylog.js's day documents — a Firestore read. A VIEW MUST NOT FETCH:
    // this file is mounted by tools/game-lab.html, which has no auth at all, as
    // well as by arcade.html, which does. A getter keeps the read where the
    // page's own budget is accounted for and lets a page that cannot answer
    // simply not pass one.
    // ⚠️ IT IS A FUNCTION, NOT A VALUE, so a caller that refreshes the totals
    // mid-run is reflected without remounting the game.
    const getMinutes = (opts && opts.minutes) || null;

    // ⚠️⚠️ THE TIME SEAM. Called ONCE PER WHOLE ELAPSED SECOND of actual play,
    // never with a duration and never at the end.
    //
    // NEXT-STEPS.md §5.1 is emphatic and it is right: learn.js has exactly ONE
    // per-second increment site, below rollDayIfNeeded('tick'), with a comment
    // saying four counting bugs died to create it and that there is no subtract
    // path. A game that banked `report.seconds` at game over would be a SECOND
    // record of a quantity that already exists (Rule 9) and would file a
    // midnight-straddling game entirely under the day it ended in.
    //
    // ⚠️ SO THE VIEW EMITS TICKS AND STAMPS NOTHING. The host calls
    // localDateStr() inside the callback, at the moment of the tick, which is
    // what makes a game running through midnight split across two documents
    // exactly as a lesson does. This file must never learn what a date is.
    //
    // ⚠️ IT FOLLOWS THE GRADED CLOCK, NOT WALL TIME: no tick while paused, none
    // before the first keystroke, none after the run ends. `d.seconds()` already
    // encodes all three, so the tick is derived from it rather than from a
    // second timer that could disagree with the number being reported.
    const onSecond = (opts && opts.onSecond) || null;

    // ⚠️ SIBLING CANVASES, BOTH OPTIONAL. A host with no side columns (the lab,
    // learn.js) passes neither and the game is byte-for-byte what it was — which
    // is why the NEXT band below stays conditional rather than being removed.
    const radarCanvas = (opts && opts.radarCanvas) || null;
    // ⚠️ OPTIONAL, LIKE THE OTHER TWO. tools/game-lab.html and learn.js supply
    // no side canvases at all, and every panel has to be absent-safe or the
    // bench and the real lesson page break the moment a panel is added.
    const threatCanvas = (opts && opts.threatCanvas) || null;
    const gaugeCanvas = (opts && opts.gaugeCanvas) || null;
    const radarCtx = radarCanvas ? radarCanvas.getContext('2d') : null;
    const threatCtx = threatCanvas ? threatCanvas.getContext('2d') : null;
    const gaugeCtx = gaugeCanvas ? gaugeCanvas.getContext('2d') : null;
    let secondsBanked = 0;

    const shieldCount = Math.max(1, Math.min(LANDMARKS.length, cfg.shields == null ? 3 : cfg.shields));
    // ⚠️⚠️ ROUND 87 — THE DIRECTOR IS TOLD HOW MANY HITS THE CITY CAN ACTUALLY
    // ABSORB, AND IT IS NOW DOUBLE. Every lane has a dome AND a landmark under
    // it, so the city takes `shieldCount` hits to strip and `shieldCount` more
    // to flatten. Leaving the director on 3 would end the game with three
    // buildings still visibly standing, which is the exact "the dome doesn't do
    // anything" complaint in a new costume.
    // ⚠️ THIS ONLY EVER MAKES A RUN EASIER, so every clearability guarantee the
    // 990-trial corpus sweep established still holds — more shields is strictly
    // more forgiving. That one-way property is what makes it safe to land
    // without re-running the corpus.
    // ⚠️ AND IT IS DELIBERATELY *NOT* `cfg.shields`: the caller asks for a
    // difficulty, the view decides how that difficulty is staged on screen.
    /**
     * ⚠️⚠️ THE ONLY PLACE A DIRECTOR IS BUILT. `restart()` used to build its own
     * with `new GameDirector(cfg)` and DROPPED the shield doubling above, so
     * every replay ran a city staged for six hits on a director that ended at
     * three — game over with three landmarks still standing, which is precisely
     * the complaint the doubling exists to answer. Measured: 6, then 3.
     * ⭐ ONE FACTORY, SO THERE IS NOTHING TO FORGET.
     *
     * ⚠️ THE CALIBRATOR IS BUILT HERE AND NOWHERE ELSE, FOR THE SAME REASON IT
     * IS IN game-shatter.js's: baked into `cfg` it would be shared across
     * restarts, and the second game would open already `confident` on the
     * previous run's median — or on the previous child's, in a rotation of
     * thirty. ⭐ `reset()` exists and is deliberately unused; fresh objects, not
     * reset ones.
     */
    function newDirector() {
        return new GameDirector(Object.assign({}, cfg, {
            shields: shieldCount * 2,
            calibrator: new TypingCalibrator({}),
        }));
    }

    let d = newDirector();
    // ⚠️ TARGET IDS. See the header: the calibrator asks how long THIS word took
    // to find, which an anonymous object cannot answer. Monotonic per mount and
    // never reused, so a stale id can never collide with a live pane.
    let nextTargetId = 1;
    let capsOn = false;
    let started = false;   // set by the countdown; spawns wait for it

    // ── DOM ─────────────────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;background:#02040a;';
    canvas.setAttribute('aria-label', 'Deadline typing game');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, stars = [];
    // ⚠️ THE KEYBOARD STRIP'S HEIGHT, AND THE GROUND SITS ON TOP OF IT.
    // Jake, 2026-09-08: *"Can we add the keyboard back in at the bottom?
    // Apparently that's a tool kids still depend on at that point."* A student
    // in unit 2 is still hunting for keys; a typing game that hides the
    // keyboard asks them to do two hard things at once.
    let kbH = 0;
    // ⚠️ THE KEYBOARD IS OPTIONAL. Jake, 2026-09-08: *"We should be able to
    // toggle off the keyboard, too."* A unit-2 student needs it; a fluent one
    // wants the sky back, and the strip costs real play area because it is
    // subtracted rather than overlaid.
    // ⚠️ REMEMBERED IN localStorage, NOT FIRESTORE. It is a display preference,
    // not student data — nothing on this page writes to the database, and that
    // must stay true. A read that throws (private mode, blocked storage) simply
    // leaves the default on.
    // ⚠️⚠️ PER-KEY ERROR MEMORY, FOR THE KEYBOARD STRIP. Students, via Jake
    // 2026-09-08: *"Keys should turn red when you fail them so you have a visual
    // reminder of where you're stuck."*
    //   'miss'  — a wrong key was pressed while THIS key was the one wanted
    //   'fixed' — they later got it right, so it stops shouting but is still
    //             marked, because "where I keep getting stuck" is the whole
    //             point and clearing it entirely would erase the lesson
    // ⚠️ KEYED ON THE EXPECTED CHARACTER, NOT THE ONE THEY PRESSED. A student
    // stuck on 'k' who keeps hitting 'j' needs 'k' lit — marking 'j' would point
    // at the finger that is working.
    const keyStates = {};
    // ⚠️⚠️ THE MEMORY ABOVE IS PERMANENT FOR THE RUN; THESE TWO ARE MOMENTARY,
    // AND THAT PAIRING IS THE FEATURE (Round 101). Jake, 2026-09-09: *"Wrong
    // keys should also go red when missed. Maybe even pulsate larger with the
    // missed key hit (so that the user can SEE that they're forgetting the
    // period)."* keyStates already turned the needed key red and it was not
    // enough — a static tint on a board below the action does not catch an eye
    // that is on a falling word. So the needed key also SWELLS at the moment of
    // the error (missPulse) and the key actually pressed BLINKS (hitFlash).
    // ⚠️ ONE HOLDS A CHARACTER AND A TIMESTAMP, NOTHING ELSE. No animation state
    // lives here; game-draw.js is handed an AGE and decides everything visual,
    // exactly as the countdown overlay is handed a number.
    let missPulse = null;   // { key, at } — the key they NEEDED
    let hitFlash = null;    // { key, at } — the key they HIT
    let kbOn = true;
    try {
        const v = localStorage.getItem('ttb_arcade_keyboard');
        if (v === '0') kbOn = false;
    } catch (_) {}
    let domes = [], tubes = [], buildings = [];
    // ⚠️ WHERE THE SILOS ARE AIMING. Set each frame from the locked target so a
    // barrel points at the thing it is about to shoot. See drawSilos().
    let aimAt = null;

    function fitSidePanels() {
        // ⚠️ fitCanvas() ALREADY HANDLES DPR AND CSS-PIXEL SIZING for any canvas
        // in any container, so a side panel costs nothing architecturally.
        if (radarCanvas && radarCtx) fitCanvas(radarCanvas, radarCtx);
        if (threatCanvas && threatCtx) fitCanvas(threatCanvas, threatCtx);
        if (gaugeCanvas && gaugeCtx) fitCanvas(gaugeCanvas, gaugeCtx);
    }

    function layout() {
        const size = fitCanvas(canvas, ctx);
        W = size.w; H = size.h;
        stars = makeStars(W, H, Math.round(W * H / 6000));

        // ⚠️⚠️ ROUND 87 — OVERLAPPING DOMES, JAKE'S OWN DESIGN.
        //
        // Jake, 2026-09-08: *"While I like the idea of the three buildings
        // having three different domes, they don't do anything. If the dome is
        // destroyed, the building should be revealed and then destroyed - not
        // immediately destroyed... reorganize it so that the three domes cover
        // the three buildings, but all three domes overlap to cover the batman
        // building. That way the first removed dome reveals one building,
        // allowing the next hit to destroy the next dome AND that building."*
        //
        // He is describing a real mechanic, and the old one was decoration: a
        // leak killed the dome and the landmark in the same instant, so three
        // domes were three lives wearing a costume.
        //
        // ⭐ NOW THE CITY ABSORBS SIX HITS, NOT THREE. Each dome is wide enough
        // to reach the CENTRE lane, so the Batman Building sits under all three
        // and the outer two sit under two each. A hit resolves against the
        // NEAREST dome still covering that lane; only when a lane is bare does
        // the landmark under it fall. So the first hit anywhere strips a dome
        // and exposes an outer landmark, and the shape of the city tells the
        // student what is still protected without a legend.
        // ⚠️⚠️ THE KEYBOARD IS SUBTRACTED FROM THE PLAY AREA, NOT DRAWN OVER IT.
        // Overlaying would let a UFO fall behind the keys and "land" somewhere
        // the student cannot see — the impact test is distance-based, so it
        // would fire with the target hidden. Raising the ground keeps every
        // landing visible. ⚠️ CAPPED AND FLOORED: on a short window the strip
        // must not eat the sky, and below ~360px of height it is dropped
        // entirely rather than squeezed into unreadability.
        fitSidePanels();
        kbH = keyboardStripHeight(H, kbOn);
        // ⭐ THE PREVIEW BAND IS ONLY PAID FOR WHEN THE STRIP CARRIES THE
        // PREVIEW. With a radar the read-ahead lives there, so these 34px go
        // back to the sky — and the sky is where the game happens.
        if (kbH && !radarCtx) kbH += LAY.KB_PREVIEW_BAND;
        // ⚠️⚠️ THE `--gc-bottom` WRITE IS GONE, AND IT WAS EVALUATING TO NaN
        // (Round 99). Round 94 moved the control bar out of the canvas overlay
        // into a real card and RETIRED `CHROME_BOTTOM_FRACTION` /
        // `CHROME_BOTTOM_NO_KEYBOARD` — commenting them out in game-layout.js
        // with a note not to revive them — but this line kept reading them.
        // `Math.round(kbH * undefined)` is NaN, so every layout() set
        // `--gc-bottom: NaNpx` on the container. It was harmless only because
        // nothing consumes that variable any more: game-chrome.js's CSS uses a
        // literal `bottom:8px` for its fallback float.
        // ⚠️ THE LESSON, NOT THE LINE: a retired constant left a live READER
        // behind, and `try {} catch (_) {}` swallowed the evidence. Deleting a
        // constant means deleting its call sites in the same edit — the same
        // shape as Rule 9, one deploy, both halves.
        const groundY = H - LAY.GROUND_INSET - kbH;
        const laneX = i => W * ((i + 1) / (shieldCount + 1));
        const reach = Math.abs(laneX(Math.floor(shieldCount / 2)) - laneX(0));
        const prevDomes = domes;
        const prevBuildings = buildings;
        domes = [];
        buildings = [];
        for (let i = 0; i < shieldCount; i++) {
            domes.push({
                x: laneX(i), y: groundY,
                // ⚠️ +8 SO THE CENTRE LANE IS GENUINELY INSIDE EVERY DOME, not
                // exactly on its rim where a rounding error decides coverage.
                // ⚠️⚠️ THE RADIUS IS THE COVERAGE TEST AND MUST NOT SHRINK.
                // Jake asked for smaller domes to give the words more room, and
                // the obvious `reach * 0.86` DOES make them smaller — it also
                // silently stops the outer two domes from reaching the centre
                // lane, which ends the three-deep overlap that is the entire
                // six-lives mechanic. Caught by asserting coverage after the
                // change rather than by looking at it.
                // ⭐ SO THE ARC IS FLATTENED INSTEAD: radius (and therefore
                // coverage) is unchanged, and `squash` below scales only the
                // drawn HEIGHT. Same protection, less sky.
                radius: Math.max(60, reach + 8),
                active: prevDomes[i] ? prevDomes[i].active : true,
                landmark: LANDMARKS[i % LANDMARKS.length],
                lane: i,
            });
            buildings.push({
                x: laneX(i), y: groundY, lane: i,
                landmark: LANDMARKS[i % LANDMARKS.length],
                alive: prevBuildings[i] ? prevBuildings[i].alive : true,
            });
        }
        // Two silos, four tubes each. Left hand fires from the left silo.
        tubes = [];
        for (let f = 0; f < 8; f++) {
            const left = f < 4;
            const silo = left ? W * LAY.SILO_LEFT_X : W * LAY.SILO_RIGHT_X;
            const idx = left ? f : f - 4;
            tubes.push({
                finger: f,
                x: silo - LAY.SILO_BARREL_OFFSET + idx * LAY.SILO_BARREL_SPACING,
                y: groundY - 12,
                color: FINGER_COLORS[FINGER_NAMES[f]],
                darkUntil: 0,
                siloX: silo,
            });
        }
    }

    // ── entity state ────────────────────────────────────────────────────────
    // A live target: text, how much is typed, where it is, when it dies.
    let live = [];
    let missiles = [];
    let particles = [];
    let locked = null;          // reference into `live`
    let banner = null;          // { text, until }
    // ⚠️⚠️ SURVIVAL IS THE HOST'S CHOICE, AND IT IS OFF BY DEFAULT. learn.js and
    // tools/game-lab.html mount this view too; a run that silently refused to
    // end when its quota was met would hang the lesson flow on both of them.
    // ⚠️ AND IT IS A VIEW-LEVEL BEHAVIOUR, NOT A DIRECTOR ONE. The shell already
    // ramps pressure past the quota (`_extraCleared`) and already wraps its
    // target pool (`_cursor % targets.length`), so survival needs NOTHING from
    // game-shell.js — only that this file stops calling finish() on the pass.
    const survival = !!(opts && opts.survival);
    // The frozen grade. Null until the quota is met; see the snapshot note in
    // accept(). Its presence IS the "they have passed" flag.
    let passReport = null;
    // ⚠️ THE COUNTDOWN NUMBER, OWNED BY THE CHROME AND RENDERED BY THE GAUGES.
    // null means "not counting", which is what makes the readout show the run
    // clock instead. See the onCountdown callback and drawGauges()'s clock
    // block for why the three digits left the sky in Round 99.
    let countdown = null;
    let flash = 0;              // seconds of red vignette remaining
    let ended = false;
    let lastFrame = null;
    let rafId = null;
    let tickAcc = 0;

    // ── spawning ────────────────────────────────────────────────────────────
    //
    // ⚠️ VELOCITY IS DERIVED, NEVER CHOSEN. The director says how long the target
    // may live; the distance is whatever this canvas happens to be; so the speed
    // is distance/lifetime. That is the single line that makes the game
    // resolution-independent and refresh-rate-independent at once.
    function spawn(now) {
        const t = d.nextTarget(now);
        if (!t) return;
        const lane = Math.floor(rand() * domes.length);
        const dome = domes[lane];
        const startX = W * (0.12 + rand() * 0.76);
        const startY = -30;
        // Aim at the dome's perimeter, or at the ground if the dome is gone.
        const aimY = dome.active ? dome.y - dome.radius : dome.y;
        const dist = Math.hypot(dome.x - startX, aimY - startY);
        const secs = Math.max(0.6, t.lifetimeMs / 1000);
        const id = nextTargetId++;
        live.push({
            id,
            text: t.text, typed: 0,
            x: startX, y: startY,
            tx: dome.x, ty: aimY,
            vx: (dome.x - startX) / secs,
            vy: (aimY - startY) / secs,
            lane, dist, travelled: 0,
            kind: Math.floor(rand() * 3),
            spin: rand() * Math.PI * 2,
        });
        // ⚠️ AFTER THE PUSH, so `live.length` is the sky the student is actually
        // looking at. ⚠️ `now` is the wall clock and this view has no second one
        // — there is no slow-motion here — but the argument is named for the
        // same reason game-shatter.js's is: acquisition is a fact about a child,
        // not about a board.
        d.calibrator.spawned(id, t.text.length, now, live.length);
    }

    /** How close to impact, 0..1. The auto-lock's sort key. */
    function threat(e) {
        return e.dist > 0 ? Math.min(1, e.travelled / e.dist) : 1;
    }

    // ── input ───────────────────────────────────────────────────────────────
    //
    // ⚠️ CASE-SENSITIVE, LIKE THE DRILLS. learn.js compares `typed === expected`
    // exactly, so a capital needs Shift there and needs Shift here. The
    // prototypes uppercased everything and matched on the uppercase, which made
    // every capital in a book lesson free.
    function onKeyDown(e) {
        if (ended) return;
        // ⚠️ THE GET-READY AND PAUSE PANELS MUST NOT EAT KEYSTROKES INTO THE
        // DIRECTOR. Before the countdown finishes there is nothing to type at,
        // and a key charged then would be a mistake the student never made.
        if (!started || (chrome && chrome.phase === 'paused')) return;
        // ═══════════════════════════════════════════════════════════════════
        // ⚠️⚠️⚠️ BACKSPACE LETS GO OF THE WORD. ESCAPE CANNOT, AND HAS NOT SINCE
        // ROUND 109.
        // ═══════════════════════════════════════════════════════════════════
        //
        // Jake, 2026-09-11, and a student reported it the same day:
        // *"There's no escape key. So if I think I'm typing one word, but I'm
        // actually typing another, there's no way to get out of it to start a
        // new word... when the sky is covered in words, you can't tell where
        // you're missing. Maybe the backspace/delete key could clear it out?"*
        //
        // ⭐⭐ HE IS RIGHT, AND THE CAUSE IS NOT THE ONE IT LOOKS LIKE. The
        // handler was here the whole time and it FIRED. `game-chrome.js` v1.8.0
        // bound Escape to PAUSE and calls `stopPropagation()`, believing that
        // settled it — its header says *"pausing outranks that"*.
        // ⚠️⚠️ IT DOES NOT. `stopPropagation()` STOPS OTHER *TARGETS*, NOT OTHER
        // LISTENERS ON THE SAME ONE — that is `stopImmediatePropagation()`. Both
        // handlers are bound to `window` in the capture phase, so Escape did
        // BOTH THINGS AT ONCE: it released the lock and it paused the game.
        // ⭐ SO THE MECHANIC WAS ALIVE AND UNUSABLE. You cannot abandon a word
        // without freezing the game behind a pause panel, and the pause is the
        // only half a student can see — press Escape to escape the word, and
        // what happens is the game stops. Press it again to resume and the lock
        // is released a second time. Jake reported it as *"there's no escape
        // key"* because that is exactly what it is to play.
        // ⚠️⚠️ AN ARBITRATION THAT DOES NOT ARBITRATE IS WORSE THAN NONE: the
        // author made a deliberate choice, wrote it down, and the code quietly
        // did something neither option described.
        //
        // ⚠️⚠️ AND IT IS NOT A LOST CONVENIENCE, IT IS A TRAP. A half-typed target
        // wants a letter the student cannot see, so every attempt to start it
        // over is charged as a mistake with nothing on screen to explain why.
        //
        // ⭐ BACKSPACE IS A BETTER KEY THAN ESCAPE EVER WAS. It already means
        // *undo what I just typed* to every human who has used a keyboard, it is
        // on the home-row reach, and it collides with nothing. Delete is
        // accepted as its twin because Mac keyboards label that key `delete`.
        // ⚠️ IT IS FREE — NOT a keyResult. Abandoning a lock is a tactical
        // decision, not a mistake; this file has said so since Round 87.
        //
        // ⚠️⚠️ AND IT IS WORST OF ALL HERE. Once `locked` is set EVERY key goes to
        // it, right or wrong — and the auto-lock below skips any target with
        // `typed > 0` as *"already someone's business"*, so an abandoned
        // half-typed word can never be re-acquired either. ⭐ A STUDENT WHO
        // LOCKED THE WRONG WORD WAS STUCK IN IT UNTIL IT LANDED. That is why
        // `typed` is reset and not merely released: without the reset, Backspace
        // would free the student and leave a permanently untypeable missile
        // falling on a landmark.
        if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            if (locked && live.includes(locked)) locked.typed = 0;
            locked = null;
            return;
        }
        // ⚠️ READ THE REAL OS STATE, EVERY KEYSTROKE. A flag toggled on the
        // CapsLock keydown would be wrong on the first key and after an alt-tab.
        // Without this a student with Caps Lock on fails EVERY key and concludes
        // the game is broken — the Word Muncher STUCK failure in a new costume.
        if (typeof e.getModifierState === 'function') capsOn = e.getModifierState('CapsLock');
        if (e.key.length !== 1) return;         // Shift, arrows, F-keys: not keystrokes
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();

        const now = performance.now();
        const ch = e.key;

        // ⚠️⚠️ A SPACE AT A WORD BOUNDARY IS FREE, AND MID-WORD IT IS NOT.
        // Jake, 2026-09-09: *"I don't want spaces at the end of words to count
        // against me, as it's the logical key to hit. In the middle of a word
        // should hurt, but at the end should not."*
        //
        // ⭐ THIS IS THE SAME RULING AS Escape, ONE LEVEL DOWN. Abandoning a lock
        // is free because it is a tactical decision, not a mistake; the space
        // after a finished word is not a decision at all — it is the habit every
        // lesson in School has spent months building, fired at a game that ends
        // its words with nothing. Charging for it teaches a child to UNLEARN
        // correct typing in order to score, which is the exact opposite of what
        // this page exists to measure.
        //
        // ⚠️ IT IS IGNORED, NOT COUNTED AS A HIT. d.keyResult(true) here would
        // let a student inflate accuracy by tapping space, and the whole reason
        // reject() charges for an unmatched key is that all three prototypes let
        // exactly that happen.
        //
        // ⚠️ THE TEST IS "IS A WORD HALF-TYPED", NOT "IS THE KEY A SPACE". A
        // space the target genuinely wants (a two-word target) never reaches
        // here — it matches, and accept() takes it above. What reaches here
        // mid-word is a space where a letter was wanted, and that is a real
        // error: it is how a student types "the cat" as "th e cat".
        if (ch === ' ') {
            const src = locked && live.includes(locked) ? locked : null;
            const midWord = !!src && src.typed > 0 && src.typed < src.text.length;
            if (!midWord) return;   // preventDefault already ran above
        }

        if (locked && live.includes(locked)) {
            if (locked.text[locked.typed] === ch) {
                accept(locked, ch, now);
            } else {
                reject(ch, now);
            }
            return;
        }

        locked = null;
        // Auto-lock: nearest to impact whose first character matches.
        // ⚠️ THIS IS THE DEFAULT AND IT REQUIRES NO STRATEGY. A child who wants
        // to type just types.
        let best = null, bestThreat = -1;
        for (const e2 of live) {
            if (e2.typed > 0) continue;         // already someone's business
            if (e2.text[0] !== ch) continue;
            const th = threat(e2);
            if (th > bestThreat) { bestThreat = th; best = e2; }
        }
        if (best) { locked = best; accept(best, ch, now); }
        else { reject(ch, now); }
    }

    function accept(target, ch, now) {
        d.keyResult(true, now);
        // ⚠️ CORRECT KEYS ONLY, and this function is the correct-key path —
        // reject() is the other one. A mistyped key is accuracy, which netWPM()
        // owns; folding it in would make the PACING number fall when a child is
        // fast and sloppy, which is not what "how fast can they type" means.
        // ⚠️ BEFORE the clear below, because the last character of a word is both
        // a key and the finish, and the calibrator discards bursts of fewer than
        // two keys — skipping it would throw away every short word.
        d.calibrator.keyed(target.id, now);
        // A key they had missed and have now landed goes from red to corrected.
        const k = String(ch).toLowerCase();
        if (keyStates[k] === 'miss') keyStates[k] = 'fixed';
        target.typed++;
        fire(ch, target, target.typed >= target.text.length, now);
        if (target.typed >= target.text.length) {
            // ⚠️ THE TARGET IS REMOVED NOW, NOT WHEN THE MISSILE LANDS. The
            // prototype waited for missile arrival, so a word the student had
            // finished kept flying and could still take a dome — punishing them
            // for the flight time of their own feedback animation.
            d.cleared(target.text, now);
            d.calibrator.finished(target.id, now);
            sfx.clear();
            live = live.filter(x => x !== target);
            if (locked === target) locked = null;
            burst(particles, target.x, target.y, '#00e5ff', Math.round(22 * motionScale()), 220);
            if (!d.endless && d.quotaMet && !ended) {
                // ⚠️⚠️ THE GRADE FREEZES HERE, AND EVERYTHING AFTER THIS LINE IS
                // BRAGGING RIGHTS. Jake, 2026-09-09: *"if they pass the game and
                // enter survival mode, then they get the passing score
                // (unlocking the next lesson) and survival mode is there to get
                // on the leaderboard/prove your mettle. Stats become whatever
                // they did during the checking run, and then bragging rights."*
                // ⭐ THE SNAPSHOT IS THE WHOLE MECHANISM: d.report() is a pure
                // read of the counters and the clock, so one copy taken at this
                // instant IS the graded run, and nothing a student does in the
                // next four minutes can touch it.
                // ⚠️⚠️ DO NOT REPLACE THIS WITH "SUBTRACT SURVIVAL AT THE END".
                // WPM and accuracy are ratios over the whole session — they do
                // not decompose, so a late 60%-accuracy sprint would drag the
                // graded figure down no matter what was subtracted afterwards.
                // The only correct time to read them is the moment of the pass.
                if (!survival) { finish(now, true); }
                else if (!passReport) {
                    passReport = d.report(now);
                    banner = { text: 'CITY DEFENDED \\u2014 SURVIVAL', until: now + 2600 };
                    sfx.win();
                }
            }
        }
    }

    function reject(ch, now) {
        // ⚠️ MARK WHAT THEY *NEEDED*, NOT WHAT THEY HIT. The expected character
        // comes from the locked target, or the one they should be on.
        {
            const src = locked || aimAt;
            const wanted = src && src.typed < src.text.length ? src.text[src.typed] : null;
            if (wanted) {
                keyStates[String(wanted).toLowerCase()] = 'miss';
                // ⚠️ THE SWELL IS ON THE KEY THEY NEEDED, for the same reason the
                // memory above is: a student stuck on '.' who keeps hitting a
                // letter needs '.' to move, not the finger that is working.
                missPulse = { key: String(wanted).toLowerCase(), at: now };
            }
        }
        // ⚠️ AND THE BLINK IS ON THE KEY THEY ACTUALLY PRESSED — the other half
        // of the same fact, and the half nothing on this page showed before.
        // Two channels, two shapes: see game-draw.js's note on why they must
        // never converge into one red glow.
        hitFlash = { key: String(ch).toLowerCase(), at: now };
        // ⚠️ AN UNMATCHED KEY IS A MISTAKE. All three prototypes silently dropped
        // it, which let a student mash for a minute and report 100% accuracy.
        d.keyResult(false, now);
        const f = fingerIndexOf(ch);
        sfx.misfire();
        if (f != null) {
            tubes[f].darkUntil = now + MISFIRE_DARK_MS;
            // A missile fired at nothing: it goes up and fizzles. Visible cost,
            // no input block.
            const tube = tubes[f];
            missiles.push({
                x: tube.x, y: tube.y,
                tx: tube.x + (rand() - 0.5) * 120, ty: H * 0.45,
                color: tube.color, letter: ch.toUpperCase(), target: null, kill: false, miss: true,
            });
        }
        flash = Math.max(flash, 0.12);
    }

    function fire(ch, target, isKill, now) {
        const f = fingerIndexOf(ch);
        // ⚠️ A THUMB CHARACTER LAUNCHES FROM THE NEAREST SILO RATHER THAN TUBE 0.
        // Space has no finger tube; sending it to tube 0 taught the left pinky.
        const tube = tubes[f == null ? (target.x < W / 2 ? 3 : 4) : f];
        sfx.launch(f == null ? 0 : f);
        missiles.push({
            x: tube.x, y: tube.y,
            tx: target.x, ty: target.y,
            color: tube.color, letter: ch.toUpperCase(),
            target: isKill ? null : target, kill: isKill, miss: false,
        });
    }

    // ── the loop ────────────────────────────────────────────────────────────
    function frame(ts) {
        rafId = requestAnimationFrame(frame);
        if (lastFrame == null) lastFrame = ts;
        // ⚠️ dt IS CLAMPED. A tab that was hidden hands back a delta of many
        // seconds, which would teleport every target through the domes at once.
        const dt = Math.min(0.05, Math.max(0, (ts - lastFrame) / 1000));
        lastFrame = ts;
        const now = performance.now();

        const paused = chrome && chrome.phase === 'paused';
        if (!ended && !paused) {
            // Spawns. ⚠️ THE ON-SCREEN COUNT IS PASSED IN: it is what lets a fast
            // student pull work rather than wait for the metronome. See the
            // shell's header.
            let guard = 0;
            if (started) while (d.spawnDue(now, live.length) && guard++ < 4) spawn(now);

            // Targets
            for (let i = live.length - 1; i >= 0; i--) {
                const e = live[i];
                e.x += e.vx * dt;
                e.y += e.vy * dt;
                e.travelled += Math.hypot(e.vx, e.vy) * dt;
                e.spin += dt * 1.6;

                if (threat(e) >= 1) {
                    // ⚠️ A WORD THAT LANDED IS NOT A SAMPLE. It measures the SKY
                    // — how fast the director was pushing — not the child, and
                    // `finished()` would refuse it anyway. Dropping it is what
                    // keeps the open set bounded over a long survival run.
                    d.calibrator.dropped(e.id);
                    live.splice(i, 1);
                    if (locked === e) locked = null;
                    burst(particles, e.x, e.y, '#ff8800', Math.round(30 * motionScale()), 260);
                    flash = 0.35;
                    sfx.hit();

                    // ⚠️⚠️ ROUND 87 — A DOME ABSORBS THE HIT, AND ONLY A BARE
                    // LANE LOSES ITS LANDMARK. See the layout() note for why.
                    // The nearest still-standing dome covering this lane takes
                    // it; "nearest" so a hit on an outer lane strips that lane's
                    // own dome first rather than peeling the centre's early,
                    // which would leave the outer landmark exposed while the
                    // dome directly above it still stood — visible nonsense.
                    const lane = buildings[e.lane] || buildings[0];
                    let shield = null, best = Infinity;
                    for (const dm of domes) {
                        if (!dm.active) continue;
                        const dx = Math.abs(dm.x - lane.x);
                        if (dx <= dm.radius && dx < best) { best = dx; shield = dm; }
                    }
                    if (shield) {
                        shield.active = false;
                        const bare = buildings.filter(b => b.alive && !covered(b)).length;
                        banner = {
                            text: 'SHIELD DOWN \u2014 ' +
                                  (bare ? bare + ' EXPOSED' : 'CITY STILL COVERED'),
                            until: now + 2200,
                        };
                        shatter(shield);
                    } else if (lane && lane.alive) {
                        lane.alive = false;
                        banner = { text: lane.landmark.name + ' IS GONE', until: now + 2200 };
                        burst(particles, lane.x, lane.y - 30, '#ff4444',
                              Math.round(40 * motionScale()), 300);
                    }

                    d.leaked(e.text, now);
                    if (d.over) { finish(now, false); break; }
                }
            }

            // Missiles
            for (let i = missiles.length - 1; i >= 0; i--) {
                const m = missiles[i];
                if (m.target && live.includes(m.target)) { m.tx = m.target.x; m.ty = m.target.y; }
                const dx = m.tx - m.x, dy = m.ty - m.y;
                const dist = Math.hypot(dx, dy);
                const step = MISSILE_SPEED * dt;
                if (dist <= step) {
                    burst(particles, m.tx, m.ty, m.miss ? '#666' : m.color, m.miss ? 6 : 12, m.miss ? 80 : 160);
                    missiles.splice(i, 1);
                    continue;
                }
                m.x += (dx / dist) * step;
                m.y += (dy / dist) * step;
            }
        }

        updateParticles(particles, dt);
        if (flash > 0) flash = Math.max(0, flash - dt);

        if (onTick && !ended) {
            tickAcc += dt;
            if (tickAcc >= 1) { tickAcc = 0; onTick(d.report(now)); }
        }

        // ⚠️⚠️ THE PER-SECOND TICK FIRES *DURING PLAY*, AND UNTIL v1.10.0 IT DID
        // NOT FIRE AT ALL. Jake, 2026-09-09, with a screenshot at 0:35 on the run
        // clock and the banked rows still at zero: *"I can confirm it's not
        // adding time to the day or week."* The whole loop lived inside finish()
        // — so nothing could move while a student played, which is the one time
        // they are looking at it — AND it sat behind `!ended` three lines after
        // `ended = true`, so it was unreachable there too. ⭐ TWO DEFECTS IN ONE
        // BLOCK, AND THE SECOND MADE THE FIRST INVISIBLE: moving the call without
        // fixing the guard would have looked like a fix and banked nothing.
        // ⚠️ DERIVED FROM d.clock.seconds(), NOT ACCUMULATED FROM dt. The graded
        // clock already encodes "not while paused, not before the first
        // keystroke, not after the end"; a separate accumulator would drift from
        // the number the result modal reports, and a student's banked minutes
        // would disagree with the run they just played.
        // ⚠️ A WHILE LOOP, NOT AN `if`: a tab that was hidden hands back a delta
        // of many seconds, and each one is a real second the host must file
        // separately — it calls localDateStr() per tick so a run through midnight
        // splits across two documents.
        bankWholeSeconds(now);

        draw(now, ts / 1000);
    }

    /**
     * Hand the host every whole graded second it has not been told about yet.
     *
     * ⚠️ IDEMPOTENT BY CONSTRUCTION — `secondsBanked` is a high-water mark, so
     * calling this twice in one frame, or once more at the end of the run, can
     * never double-count.
     */
    function bankWholeSeconds(now) {
        if (!onSecond || !started) return;
        const whole = Math.floor(d.clock.seconds(now));
        while (secondsBanked < whole) {
            secondsBanked++;
            try { onSecond(); } catch (_) { /* never let a host error stop play */ }
        }
    }

    // Is this landmark still under any standing dome?
    function covered(b) {
        return domes.some(dm => dm.active && Math.abs(dm.x - b.x) <= dm.radius);
    }

    function shatter(dome) {
        for (let a = Math.PI; a <= Math.PI * 2; a += 0.08) {
            particles.push({
                x: dome.x + Math.cos(a) * dome.radius,
                y: dome.y + Math.sin(a) * dome.radius,
                vx: Math.cos(a) * (60 + Math.random() * 160),
                vy: Math.sin(a) * (60 + Math.random() * 160),
                life: 0.6 + Math.random() * 0.5, max: 1.1,
                color: Math.random() > 0.3 ? '#00e5ff' : '#0088ff',
            });
        }
    }

    /** m:ss for the survival line. ⚠️ Display only — it never reaches a total. */
    function fmtClock(sec) {
        const s = Math.max(0, Math.round(sec || 0));
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    function finish(now, won) {
        if (ended) return;
        // ⚠️⚠️ BANK THE LAST PART-SECOND *BEFORE* `ended` IS SET, WHICH IS THE BUG
        // THIS ORDER EXISTS TO PREVENT. The old call sat AFTER `ended = true`
        // behind a `!ended` guard — permanently false, so the final catch-up
        // never ran and neither did anything else. ⭐ Ordering is the fix, not a
        // looser guard: d.end() below stops the graded clock, so a call after it
        // would also read a frozen figure.
        bankWholeSeconds(now);
        ended = true;
        d.end(now);

        const rep = d.report(now);
        // ⚠️⚠️ A PASS CANNOT BE UNDONE BY WHAT HAPPENS AFTER IT. Losing the city
        // in survival ends the session; it does not un-unlock the lesson. Any
        // other reading would make "play on for a leaderboard score" a gamble
        // with the thing the student already earned, and no child would take it
        // twice.
        const passed = !!passReport || (won && !survival);
        // ⚠️ SURVIVAL FIGURES ARE THE DIFFERENCE BETWEEN THE TWO READS, NOT A NEW
        // COUNTER. A second accumulator over the same quantities is the Rule 9
        // shape this project keeps finding — and these cannot disagree with the
        // graded numbers, because both come off the same report.
        // ⚠️⚠️ THE SCORE COMES FROM THE SHELL, NOT FROM SUBTRACTING TWO SCORES.
        // The obvious `rep.score - passReport.score` is WRONG and was caught by
        // running it: `score` pays for INTACT SHIELDS, and survival is exactly
        // when a student spends them, so the difference goes negative for anyone
        // who plays on long enough to lose one — a clean 700 fell to 300 over
        // four minutes. d.survivalScore prices the characters cleared past the
        // quota and nothing else. ⚠️ SECONDS AND COUNTS *DO* SUBTRACT — they are
        // totals, not ratios and not shield-bearing.
        const survivalPart = passReport ? {
            seconds: Math.max(0, rep.seconds - passReport.seconds),
            cleared: rep.extraCleared,
            score: rep.survivalScore,
        } : null;
        passed ? sfx.win() : sfx.lose();
        // ⚠️ THE VIEW FORMATS THESE LINES; IT DOES NOT COMPUTE THEM. Every number
        // here came off the shell's report untouched, and no letter grade appears
        // — run-grade.js turns (wpm, acc) into a grade, and a second place that
        // did it is the Rule 9 shape this project keeps finding.
        //
        // ⚠️⚠️ A SURVIVOR WHO DIES MUST BE TOLD THEY PASSED, IN THE FIRST LINE,
        // AND THIS IS THE ENTIRE UX RISK IN THE FEATURE. The session ends the way
        // every losing run ends — shields gone, city flattened — so a modal that
        // led with the loss would tell a child who had already earned the lesson
        // that they had failed it. The heading is the PASS; the survival run is
        // the line under it.
        const gradeLine = r =>
            `${r.wpm} WPM  ·  ${r.acc}% accurate  ·  ${r.targetsCleared} words`;
        if (chrome) {
            const lines = [];
            if (passReport) {
                lines.push(gradeLine(passReport));
                lines.push(`Needed ${passReport.targetWPM} WPM and ${passReport.minAccuracy}% — cleared`);
                // ⚠️ THE SURVIVAL LINE NEVER PRINTS A WPM OR AN ACCURACY. Those
                // exist for the graded run only; a second pair beside them is
                // the "two different numbers for one thing" a student would then
                // have to reconcile, and the whole point of the freeze is that
                // there is exactly one answer.
                lines.push(survivalPart && survivalPart.cleared
                    ? `Survival: ${fmtClock(survivalPart.seconds)} · ` +
                      `${survivalPart.cleared} more words · ${survivalPart.score} points`
                    : 'Survival: the city fell right after the pass');
            } else {
                lines.push(gradeLine(rep));
                lines.push(d.endless ? `Score ${rep.score}`
                                     : `Needed ${rep.targetWPM} WPM and ${rep.minAccuracy}%`);
            }
            chrome.showResult({
                heading: passed ? 'CITY DEFENDED' : 'THE DEADLINE PASSED',
                lines,
                canRestart: true,
            });
        }
        // ⚠️⚠️ THE HOST IS HANDED THE GRADED RUN AS `pass`, AND IT IS THE ONLY
        // THING THAT MAY EVER REACH recordRunOutcome(). `rep` is the whole
        // session including survival, so a wiring that wrote `rep` would file a
        // leaderboard stunt as a lesson grade. ⚠️ WHEN THE GATE SEAM IS BUILT,
        // THIS IS THE FIELD IT READS.
        onEnd(Object.assign({}, rep, {
            passed,
            pass: passReport || (passed ? rep : null),
            survival: survivalPart,
        }));
    }

    // ── drawing ─────────────────────────────────────────────────────────────
    /**
     * The two side canvases, if the host gave us any.
     *
     * ⚠️ CONTACTS ARE HANDED OVER PRE-NORMALISED (`nx` 0..1 across, `ny` 0..1
     * down). The radar never learns a lane position, a dome radius or an impact
     * test — the same separation that made sibling canvases the right
     * architecture instead of an inset playfield rect.
     */
    function drawSidePanels(rep, now) {
        if (radarCtx) {
            drawRadar(radarCtx, {
                W: radarCanvas.clientWidth, H: radarCanvas.clientHeight,
                contacts: live.map(e => ({
                    text: e.text, typed: e.typed,
                    nx: W ? e.x / W : 0.5, ny: threat(e),
                })),
                inbound: d.peekNext(),
                // ⚠️ HOW CLOSE ITS SPAWN IS, so the preview materialises rather
                // than appearing whole. A pure read — see spawnProgress().
                inboundProgress: d.spawnProgress(now),
            });
        }
        // ⚠️⚠️ COUNTS CROSS THE SEAM, NEVER GEOMETRY. `cover` is computed HERE,
        // where the dome measurement lives, and the panel receives an integer.
        // The same rule as the radar's normalised contacts, and for the same
        // reason: that measurement IS the coverage test that gives the city six
        // lives, and Round 91 broke it with a change that looked completely
        // fine. A panel that could read it is a panel that could be "improved"
        // into breaking it.
        if (threatCtx) {
            drawThreatBoard(threatCtx, {
                W: threatCanvas.clientWidth, H: threatCanvas.clientHeight,
                coverMax: domes.length,
                lanes: buildings.map(b => ({
                    short: b.landmark.short,
                    // ⚠️ THE SAME PREDICATE covered() USES, counted rather than
                    // any'd. Two different tests for "is this lane protected"
                    // would be a second copy of the rule that decides whether a
                    // landmark falls — the panel must agree with the game by
                    // construction, not by coincidence.
                    cover: domes.filter(dm =>
                        dm.active && Math.abs(dm.x - b.x) <= dm.radius).length,
                    alive: b.alive,
                })),
            });
        }
        if (gaugeCtx) {
            const m = minuteLines();
            drawGauges(gaugeCtx, {
                W: gaugeCanvas.clientWidth, H: gaugeCanvas.clientHeight,
                wpm: rep.wpm, acc: rep.acc,
                // ⚠️⚠️ THE GATES COME OFF THE REPORT, NOT OFF cfg. The director
                // is the only thing that knows what this run is judged against
                // — arcade substitutes the student's rolling WPM for a fixed
                // gate — and a panel reading cfg.targetWPM would paint an
                // arcade run red against a number nothing is enforcing.
                targetWPM: rep.targetWPM, minAccuracy: rep.minAccuracy,
                // ⚠️ rep.seconds IS THE GRADED CLOCK, the same one finish()
                // banks minutes from. A separate elapsed counter for the
                // display would drift from the number the modal reports.
                seconds: rep.seconds,
                shieldsLeft: rep.shieldsLeft,
                countdown,
                quota: d.endless ? null : d.clearedChars / d.quotaChars,
                // ⚠️⚠️ ONCE THE QUOTA IS MET THE ROW BECOMES THE SCORE, BECAUSE A
                // BAR PINNED AT 100% FOR FOUR MINUTES REPORTS NOTHING. The
                // student needs to see the one number that is still moving, or
                // survival is a mode with no readout. ⚠️ THE SCORE IS THE
                // SURVIVAL SCORE, not the session's: the graded run's points are
                // part of the frozen record and counting them here would let a
                // child read their leaderboard figure as including work that was
                // already banked as a grade.
                survivalScore: passReport ? rep.survivalScore : null,
                // ⚠️ THE SAME STRINGS THE STRIP USES, from the same helper. Two
                // formatters would drift and show a student two "today" figures.
                todayText: m.bottomLeft ? m.bottomLeft.replace('TODAY  ', '') : null,
                weekText: m.bottomRight ? m.bottomRight.replace('WEEK  ', '') : null,
                // ⚠️ THE DIGIT SHAPES OF THE SAME TWO NUMBERS, from the same
                // helper. See minuteLines() for why they are not derived here.
                todayClock: m.todayClock, weekClock: m.weekClock,
                // ⚠️ THE RAW SECONDS TOO, so the meter can show a fill while the
                // printed number stays the truth. The bar is decoration; the
                // figure beside the label is the fact.
                todaySeconds: (getMinutes && (getMinutes() || {}).dailySeconds) || 0,
                weekSeconds: (getMinutes && (getMinutes() || {}).weeklySeconds) || 0,
            });
        }
    }

    function draw(now, tSec) {
        ctx.clearRect(0, 0, W, H);
        // Sky
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#02040a');
        sky.addColorStop(0.75, '#050b1a');
        sky.addColorStop(1, '#0a1226');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        drawStars(ctx, stars, tSec);
        // ⚠️ THE SILOS AIM AT WHAT THE STUDENT IS ACTUALLY TYPING. Locked
        // target first; failing that the most threatening one, so the barrels
        // are already pointing where the next keystroke will matter.
        aimAt = locked || live.reduce(
            (best, e) => (best === null || threat(e) > threat(best) ? e : best), null);
        drawSkyline(ctx, W, H, domes, tSec);
        drawDomes(ctx, domes);
        drawSilos(ctx, tubes, now);
        drawMissiles(ctx, missiles);
        drawTargets(ctx, live, locked, tSec);
        drawParticles(ctx, particles);

        // ⚠️ NO MORE FULL-SCREEN RED FILL. See game-draw.js's header — a
        // 45%-alpha flash over the whole canvas, repeated, is a photosensitivity
        // risk in a room of thirty twelve-year-olds. drawHitFeedback() vignettes
        // the edges and degrades to a static border under prefers-reduced-motion.
        drawHitFeedback(ctx, W, H, flash);

        // ⚠️ AFTER the world and the hit feedback, BEFORE the HUD. The strip is
        // furniture, not part of the scene — a UFO must never appear to pass in
        // front of it — but the banner and the HUD still outrank it.
        // ⚠️ ONE READOUT, TWO PLACES, NEVER BOTH. With the board up the stats
        // ride in its flanks; with it off they fall back to the top plate.
        const rep = d.report(now);
        drawSidePanels(rep, now);
        if (kbH) {
            // ⚠️⚠️ THE FLANKS ARE THE NARROW-MODE FALLBACK NOW. With a gauge
            // panel the same four numbers were drawn twice, six inches apart —
            // and a student reading "11 WPM" in two places has to work out
            // whether they are the same number. When the panel is present the
            // strip carries the keys and nothing else.
            const hl = gaugeCtx ? { left: [], right: [] } : hudLines(rep, d);
            drawKeyboardStrip(ctx, {
                W, H, height: kbH,
                nextChar: (() => {
                    const src = locked || aimAt;
                    return src && src.typed < src.text.length ? src.text[src.typed] : null;
                })(),
                left: hl.left, right: hl.right, keyStates,
                // ⚠️ AN AGE IS COMPUTED HERE AND A TIMESTAMP IS NOT PASSED DOWN.
                // game-draw.js reads no clock of its own — the same rule the
                // countdown overlay follows, and what lets a harness render
                // either of them deterministically. Expiry is decided by the
                // spans in game-layout.js, on this side of the boundary.
                missPulse: missPulse && { key: missPulse.key, age: now - missPulse.at },
                hitFlash: hitFlash && { key: hitFlash.key, age: now - hitFlash.at },
                nextWord: radarCtx ? null : d.peekNext(),
                // ⚠️ THE QUOTA BAR AND THE MINUTES MOVE TO THE GAUGES TOO —
                // the bar is the one Jake could not identify unlabelled.
                progress: gaugeCtx ? null : (d.endless ? null : d.clearedChars / d.quotaChars),
                ...(gaugeCtx ? {} : minuteLines()),
            });
        } else if (!gaugeCtx) {
            // ⚠️⚠️ `!gaugeCtx` ADDED IN ROUND 100b, AND IT WAS A REAL DUPLICATE
            // ON SCREEN. With the keyboard toggled OFF kbH is 0, so this branch
            // ran even when the console was present — and Jake's screenshot
            // shows the result: "0 WPM 100% TARGET 25/90%" on a plate over the
            // sky while the console printed the same four numbers a foot to the
            // right. The flanks were already stood down for this reason; the
            // top-plate fallback was not, so turning the keys off resurrected
            // the very duplication Round 95 removed.
            drawHudTop(ctx, W, rep, d);
        }
        // ⭐ THE COUNTDOWN, BIG, IN THE MIDDLE OF THE FIELD. Jake: *"let's
        // duplicate those numbers (and that font) in the middle of the
        // playfield, too, so it's super obvious."*
        // ⚠️ THE SAME `countdown` VARIABLE THE CONSOLE CLOCK READS — one source,
        // displayed twice, which is emphasis rather than the two-sources
        // duplication Round 95 had to delete. See drawCountdownOverlay().
        drawCountdownOverlay(ctx, W, H, countdown);
        if (capsOn) drawCapsWarning(ctx, W, 46);

        if (banner && now < banner.until) {
            platedText(ctx, {
                // ⚠️⚠️ GROUND LEVEL, NOT MID-SKY. Students, via Jake
                // 2026-09-08: *"The text showing that various monuments have
                // been destroyed get in the way of the text. They should move
                // to the ground level to avoid blocking the typable
                // characters."* At H*0.32 the banner sat exactly where falling
                // words are most readable, so the game covered the thing it was
                // asking them to type — and it did it at the WORST moment, just
                // after a hit, when they are already behind. Just above the
                // skyline it is still unmissable and blocks nothing: no target
                // is typable down there, it has already landed.
                x: W / 2, y: (H - kbH) - LAY.BANNER_ABOVE_GROUND, text: banner.text,
                font: 'bold ' + LAY.BANNER_FONT_PX + 'px "Courier Prime", monospace',
                color: ended ? '#ffd700' : '#ff5566',
                bg: 'rgba(2,4,10,0.92)', border: '#334', padX: 22, padY: 12,
            });
        }
    }

    function drawTargets(ctx, list, lockedRef, tSec) {
        // ⚠️ FARTHEST FIRST, so the nearest-to-impact target — the one the
        // student is most likely working on — is drawn on top of the others.
        const sorted = list.slice().sort((a, b) => threat(a) - threat(b));
        for (const e of sorted) {
            const isLocked = e === lockedRef;
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(Math.atan2(e.vy, e.vx) - Math.PI / 2);
            const c = isLocked ? '#ffd700' : '#7fd7ff';
            ctx.lineWidth = 2;

            // ⚠️⚠️ ROUND 87 — THE HULL IS DRAWN IN THE FINGER COLOURS OF ITS OWN
            // LETTERS.
            //
            // Jake, 2026-09-08: *"UFOs look great, but I wish the lines
            // reflected the colors of the letters that have to be typed."*
            //
            // The saucer's outline is cut into one arc per character, in order,
            // each stroked in that character's finger colour — the SAME colours
            // keyboard.js gives the silo barrels and the on-screen keyboard, so
            // a student can read "this one is mostly right-hand" off the shape
            // before they read the word. ⭐ TYPED CHARACTERS DIM, so the hull
            // drains as they go and progress is legible at a glance from across
            // a classroom, not only in the label plate underneath.
            //
            // ⚠️ A CHARACTER WITH NO FINGER (space, punctuation outside the map)
            // FALLS BACK TO THE HULL COLOUR rather than to finger 0 — this file's
            // own header records that defaulting to 0 is exactly what once put
            // every unmapped character on the left pinky.
            const segColors = [];
            for (let ci = 0; ci < e.text.length; ci++) {
                const f = fingerIndexOf(e.text[ci]);
                const col = f == null ? c : FINGER_COLORS[FINGER_NAMES[f]];
                segColors.push({ col, done: ci < e.typed });
            }
            const strokeArcs = (rx, ry, from, to) => {
                const n = segColors.length || 1;
                const span = (to - from) / n;
                for (let k = 0; k < n; k++) {
                    const sg = segColors[k] || { col: c, done: false };
                    ctx.strokeStyle = sg.col;
                    // ⚠️ ALPHA, NOT A DARKER COLOUR — a dimmed finger colour and
                    // a different finger colour are hard to tell apart.
                    ctx.globalAlpha = sg.done ? 0.28 : 1;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, rx, ry, 0, from + k * span, from + (k + 1) * span);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            };

            if (e.kind === 0) {
                strokeArcs(22, 9, 0, Math.PI * 2);
                ctx.strokeStyle = c;
                ctx.beginPath(); ctx.arc(0, -4, 10, Math.PI, 0); ctx.stroke();
            } else if (e.kind === 1) {
                // ⚠️ THE DIAMOND IS A POLYGON, so its edges are walked directly
                // rather than reusing strokeArcs — four corners, one segment per
                // character spread along the perimeter.
                const pts = [[0, -16], [20, 6], [0, 14], [-20, 6]];
                const n = segColors.length || 1;
                for (let k = 0; k < n; k++) {
                    const sg = segColors[k] || { col: c, done: false };
                    const t0 = k / n, t1 = (k + 1) / n;
                    const at = t => {
                        const seg = t * 4, i0 = Math.min(3, Math.floor(seg)), f = seg - i0;
                        const a = pts[i0], b = pts[(i0 + 1) % 4];
                        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
                    };
                    const p0 = at(t0), p1 = at(t1);
                    ctx.strokeStyle = sg.col;
                    ctx.globalAlpha = sg.done ? 0.28 : 1;
                    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
                }
                ctx.globalAlpha = 1;
            } else {
                ctx.strokeStyle = c;
                ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.stroke();
                ctx.save(); ctx.rotate(e.spin);
                strokeArcs(24, 6, 0, Math.PI * 2);
                ctx.restore();
            }
            ctx.strokeStyle = c;
            // Engine glow
            ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(tSec * 8 + e.spin));
            ctx.fillStyle = c;
            ctx.beginPath(); ctx.ellipse(0, 12, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // ⚠️ THE LABEL SITS ON A PLATE. Over the skyline, bare fillText is
            // unreadable — this is the Muncher STUCK problem in its other form.
            platedProgress(ctx, {
                x: e.x, y: e.y + 34, text: e.text, typedLen: e.typed,
                border: isLocked ? '#ffd700' : 'rgba(127,215,255,0.35)',
                typedColor: '#00e5ff', restColor: isLocked ? '#fff' : '#cfe6f5',
                font: 'bold 20px "Courier Prime", monospace',
            });
        }
    }


    function drawDomes(ctx, list) {
        for (const dome of list) {
            if (dome.active) {
                ctx.save();
                const g = ctx.createRadialGradient(dome.x, dome.y, dome.radius * 0.2, dome.x, dome.y, dome.radius);
                g.addColorStop(0, 'rgba(0,229,255,0.04)');
                g.addColorStop(1, 'rgba(0,229,255,0.20)');
                ctx.fillStyle = g;
                ctx.strokeStyle = '#00e5ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                // ⚠️ DRAWN AS A FLATTENED ELLIPSE, NOT A SMALLER CIRCLE — see
                // the radius note in layout(). Width is coverage; height is
                // only pixels, so height is what gives the words room.
                ctx.ellipse(dome.x, dome.y, dome.radius, dome.radius * DOME_SQUASH,
                            0, Math.PI, 0);
                ctx.fill(); ctx.stroke();
                ctx.restore();
            }
            // ⚠️ THE NAME PLATES ARE GONE (Round 91). Jake, 2026-09-08: *"we
            // could center them all and remove the names of the buildings."*
            // They sat on the ground line where the control bar also lives, and
            // Gemini's art is recognisable enough that a label under the
            // Parthenon was captioning a photograph. The names still appear where
            // they carry meaning — the "PARTHENON IS GONE" banner — which is the
            // one moment a student needs to be told which one they just lost.
        }
    }

    /**
     * ⚠️⚠️ ROUND 87 — THE BARRELS TRACK WHAT THEY ARE SHOOTING AT.
     *
     * Jake, 2026-09-08: *"Missile silos on the left and right should point at
     * whatever they're shooting at, with the outermost barrels being on the
     * foremost layer (so that when they turn, you can see all four colors)."*
     *
     * Both halves matter and the second is the subtle one. Four barrels standing
     * vertically in a row occlude almost nothing, so draw order never mattered.
     * The moment they ROTATE they sweep across each other, and if the innermost
     * is drawn last it covers the three behind it at exactly the angles the
     * student is looking — so the finger colours, which are the whole point of
     * having four barrels, disappear precisely when they become informative.
     *
     * ⭐ SO THEY ARE DRAWN INNERMOST FIRST, OUTERMOST LAST, per silo. Sorting by
     * distance from the silo centre does that for both sides at once without a
     * left/right special case.
     */
    function drawSilos(ctx, list, now) {
        // ⚠️ SORTED COPY. `list` is `tubes`, whose ORDER IS ITS FINGER INDEX —
        // sorting it in place would silently re-map every finger to the wrong
        // barrel, which is the kind of defect that looks like a colour bug.
        const order = list.slice().sort(
            (a, b) => Math.abs(a.x - a.siloX) - Math.abs(b.x - b.siloX));

        for (const t of order) {
            const dark = now < t.darkUntil;

            // Point at the live target if there is one, else rest at a slight
            // outward fan so the silo never looks switched off.
            let ang = (t.x < t.siloX ? -0.18 : 0.18);
            if (aimAt) {
                // ⚠️ ATAN2 FROM THE BARREL'S OWN BASE, not the silo centre, or
                // the four barrels would sit parallel and read as one object.
                ang = Math.atan2(aimAt.x - t.x, t.y - aimAt.y);
                // ⚠️ CLAMPED. A target that has drifted behind a silo would
                // otherwise swing the barrel through the ground.
                const LIM = 1.35;
                ang = Math.max(-LIM, Math.min(LIM, ang));
            }

            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.rotate(ang);
            // Barrel
            ctx.fillStyle = dark ? '#2a2f38' : t.color;
            ctx.fillRect(-5, -46, 10, 46);
            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            if (!dark) ctx.fillRect(-3, -46, 2.5, 46);
            // Muzzle
            ctx.fillStyle = '#151a22';
            ctx.fillRect(-6, -48, 12, 5);
            // ⚠️ A DARK OUTLINE SO OVERLAPPING BARRELS STAY COUNTABLE. Four
            // saturated colours touching each other with no separator read as
            // one smeared shape once they fan out.
            ctx.strokeStyle = 'rgba(2,6,14,0.85)';
            ctx.lineWidth = 1;
            ctx.strokeRect(-5, -46, 10, 46);
            ctx.restore();

            // Pivot cap, drawn unrotated so the barrel appears to turn in a
            // socket rather than to slide.
            ctx.fillStyle = dark ? '#222831' : 'rgba(255,255,255,0.20)';
            ctx.beginPath(); ctx.arc(t.x, t.y, 4.5, 0, Math.PI * 2); ctx.fill();
        }
        // Silo bodies, drawn after so the tubes emerge from them
        const seen = new Set();
        for (const t of list) {
            if (seen.has(t.siloX)) continue;
            seen.add(t.siloX);
            ctx.save();
            ctx.fillStyle = '#28313d';
            ctx.beginPath();
            ctx.arc(t.siloX, t.y + 12, 38, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#1a212b';
            ctx.fillRect(t.siloX - 46, t.y + 6, 92, 10);
            ctx.restore();
        }
    }

    function drawMissiles(ctx, list) {
        for (const m of list) {
            const ang = Math.atan2(m.ty - m.y, m.tx - m.x) + Math.PI / 2;
            ctx.save();
            ctx.translate(m.x, m.y);
            ctx.rotate(ang);
            // exhaust
            ctx.fillStyle = '#ff5500';
            ctx.beginPath();
            ctx.moveTo(-4, 9); ctx.lineTo(4, 9); ctx.lineTo(0, 9 + 8 + Math.random() * 6);
            ctx.closePath(); ctx.fill();
            // keycap body — the missile IS a key
            ctx.fillStyle = '#0a0d14';
            ctx.fillRect(-10, -10, 20, 20);
            ctx.fillStyle = m.miss ? '#3a4048' : m.color;
            ctx.fillRect(-8, -8, 16, 16);
            ctx.fillStyle = '#000';
            ctx.font = '900 11px "Courier Prime", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(m.letter, 0, 0);
            // nosecone
            ctx.fillStyle = m.kill ? '#fff' : '#c8d2dc';
            ctx.beginPath();
            ctx.moveTo(-8, -10); ctx.lineTo(0, -20); ctx.lineTo(8, -10);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    }

    /**
     * The skyline.
     *
     * ⚠️ DRAWN BEHIND THE DOMES AND KEYED TO THEIR POSITIONS, so a landmark sits
     * under the shield that protects it. Jake, 2026-09-07: *"If you think you can
     * add more buildings, go for it."* Parthenon, Batman Building, Ryman, L&C
     * Tower, the Pinnacle, a Broadway neon strip and the pedestrian bridge.
     */
    function drawSkyline(ctx, W, H, list, tSec) {
        const g = H - LAY.GROUND_INSET - kbH;
        ctx.save();

        // Far background block towers
        ctx.fillStyle = '#070c18';
        for (let i = 0; i < 14; i++) {
            const bw = W / 14;
            const bh = 40 + ((i * 37) % 70);
            ctx.fillRect(i * bw, g - bh, bw - 3, bh);
        }
        // Lit windows, deterministic so they do not strobe
        ctx.fillStyle = 'rgba(150,190,255,0.13)';
        for (let i = 0; i < 14; i++) {
            const bw = W / 14;
            const bh = 40 + ((i * 37) % 70);
            for (let r = 0; r < Math.floor(bh / 12); r++) {
                for (let c = 0; c < 3; c++) {
                    if ((i * 7 + r * 3 + c) % 4 === 0) continue;
                    ctx.fillRect(i * bw + 4 + c * 7, g - bh + 6 + r * 12, 4, 6);
                }
            }
        }

        // Pedestrian bridge across the whole base
        ctx.strokeStyle = 'rgba(140,175,235,0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, g - 16);
        ctx.lineTo(W, g - 16);
        for (let x = 10; x < W; x += 26) {
            ctx.moveTo(x, g - 16);
            ctx.lineTo(x, g);
        }
        ctx.stroke();

        // Broadway neon strip
        for (let i = 0; i < 9; i++) {
            const x = W * 0.06 + i * (W * 0.1);
            ctx.globalAlpha = 0.55 + 0.35 * Math.sin(tSec * 2.2 + i);
            ctx.fillStyle = ['#ff2266', '#ffcc00', '#00e5ff', '#ff7700'][i % 4];
            ctx.fillRect(x, g - 12, 16, 3);
        }
        ctx.globalAlpha = 1;

        // Landmarks, one under each dome
        // ⚠️ THE LANDMARK'S STATE IS ITS OWN, NOT ITS DOME'S (Round 87). A
        // building stands until IT is hit; losing the dome above it only exposes
        // it. That separation is the whole mechanic.
        for (const b of buildings) {
            drawLandmark(ctx, b, g);
        }

        // L&C Tower and the Pinnacle, off to the sides, always standing
        drawSlab(ctx, W * 0.04, g, 26, 130, '#0b1226', '#2b4a7a');
        drawSlab(ctx, W * 0.955, g, 32, 150, '#0b1226', '#2b4a7a');
        ctx.restore();
    }

    /**
     * One landmark, using Gemini's art when it has loaded.
     *
     * ⚠️ A DEAD BUILDING IS NOT JUST A TINT — it is drawn shorter, dimmed and
     * leaning, because on a dark skyline a colour change alone reads as "that
     * one is lit differently", not as "that one is rubble". The point of the
     * whole mechanic is that a student can see at a glance what they have lost.
     */
    function drawLandmark(ctx, b, g) {
        const key = b.landmark.short;
        const img = LANDMARK_IMG[key];
        const box = LANDMARK_BOX[key] || { w: 1, h: 1, drawH: 80 };
        const dead = !b.alive;
        const exposed = b.alive && !covered(b);

        if (img && img.complete && img.naturalWidth) {
            const h = box.drawH * (dead ? LAY.LANDMARK_DEAD_SCALE : 1);
            const w = h * (box.w / box.h);
            ctx.save();
            // ⚠️ RUBBLE LEANS AND DARKENS. globalAlpha alone left a perfectly
            // intact building that happened to be faint.
            if (dead) {
                ctx.globalAlpha = 0.5;
                ctx.translate(b.x, g);
                ctx.rotate(LAY.LANDMARK_DEAD_LEAN);
                ctx.translate(-b.x, -g);
            } else {
                // ⚠️ SLIGHTLY DIMMED EVEN WHEN ALIVE. The art is daylight-bright
                // and this is a night skyline; at full strength it detaches from
                // the background and reads as a sticker.
                ctx.globalAlpha = exposed ? LAY.LANDMARK_ALPHA_EXPOSED : LAY.LANDMARK_ALPHA;
            }
            ctx.drawImage(img, b.x - w / 2, g - h, w, h);
            ctx.restore();

            // ⭐ AN EXPOSED BUILDING IS OUTLINED IN WARNING AMBER. Without this
            // the student has to infer "my dome is gone" from an absence, and an
            // absence is exactly what nobody notices mid-game.
            if (exposed) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255,190,90,0.55)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 4]);
                ctx.strokeRect(b.x - w / 2 - 3, g - h - 3, w + 6, h + 6);
                ctx.restore();
            }
            return;
        }

        // ⚠️ FALLBACK, AND IT RUNS FOR REAL — the first frames of every game
        // happen before the SVGs decode. See the LANDMARK_SVG note.
        const ink  = dead ? '#2a1c22' : '#0d1730';
        const trim = dead ? '#5a2a36' : '#2b4a7a';
        if (key === 'PARTHENON') drawParthenon(ctx, b.x, g, ink, trim);
        else if (key === 'BATMAN BLDG') drawBatman(ctx, b.x, g, ink, trim, dead);
        else drawRyman(ctx, b.x, g, ink, trim);
    }

    function drawSlab(ctx, x, g, w, h, fill, trim) {
        ctx.fillStyle = fill;
        ctx.fillRect(x - w / 2, g - h, w, h);
        ctx.strokeStyle = trim;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - w / 2, g - h, w, h);
        ctx.fillStyle = 'rgba(180,215,255,0.18)';
        for (let r = 0; r < Math.floor(h / 11); r++) ctx.fillRect(x - w / 2 + 3, g - h + 5 + r * 11, w - 6, 4);
    }

    function drawParthenon(ctx, x, g, ink, trim) {
        const w = 96, h = 46;
        ctx.fillStyle = ink;
        ctx.fillRect(x - w / 2, g - h, w, h);
        // columns
        ctx.fillStyle = trim;
        for (let i = 0; i < 8; i++) ctx.fillRect(x - w / 2 + 5 + i * 11.5, g - h + 8, 5, h - 12);
        // pediment
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.moveTo(x - w / 2 - 6, g - h);
        ctx.lineTo(x, g - h - 20);
        ctx.lineTo(x + w / 2 + 6, g - h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = trim;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    function drawBatman(ctx, x, g, ink, trim, dead) {
        const h = 150;
        ctx.fillStyle = ink;
        ctx.fillRect(x - 18, g - h * 0.62, 36, h * 0.62);
        ctx.strokeStyle = trim;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 18, g - h * 0.62, 36, h * 0.62);
        // the two spires
        for (const s of [-1, 1]) {
            ctx.fillStyle = ink;
            ctx.beginPath();
            ctx.moveTo(x + s * 36, g);
            ctx.lineTo(x + s * 36, g - h * 0.55);
            ctx.lineTo(x + s * 31, g - h);
            ctx.lineTo(x + s * 18, g - h * 0.55);
            ctx.lineTo(x + s * 18, g);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = trim;
            ctx.stroke();
            ctx.fillStyle = dead ? '#442' : '#ff3344';
            ctx.beginPath(); ctx.arc(x + s * 31, g - h, 2.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = 'rgba(0,229,255,0.5)';
        ctx.fillRect(x - 10, g - h * 0.45, 7, 10);
        ctx.fillRect(x + 3, g - h * 0.45, 7, 10);
    }

    function drawRyman(ctx, x, g, ink, trim) {
        const w = 84, h = 58;
        ctx.fillStyle = ink;
        ctx.fillRect(x - w / 2, g - h, w, h);
        ctx.strokeStyle = trim;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x - w / 2, g - h, w, h);
        // arched windows
        for (let i = 0; i < 4; i++) {
            const wx = x - w / 2 + 12 + i * 20;
            ctx.fillStyle = 'rgba(255,215,140,0.22)';
            ctx.beginPath();
            ctx.arc(wx, g - h + 26, 6, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(wx - 6, g - h + 26, 12, 18);
        }
        // gable
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.moveTo(x - w / 2, g - h);
        ctx.lineTo(x, g - h - 18);
        ctx.lineTo(x + w / 2, g - h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = trim;
        ctx.stroke();
    }

    /**
     * ⚠️⚠️ ROUND 89 — THE READOUT LIVES BESIDE THE KEYBOARD NOW, NOT ACROSS THE
     * TOP.
     *
     * Jake, 2026-09-08: *"That missing space makes the game harder, so let's
     * take some of it back by moving your instructions to underneath the game...
     * just add those stats to the left and right of the keyboard (given that
     * that space is available now)."*
     *
     * He is right that it is free: the board is centred and about half the
     * canvas wide, so the flanks were dead pixels. Moving the plate and the
     * quota bar down returns the whole top strip to sky — which is where the
     * targets actually are, and the space the keyboard took.
     *
     * ⚠️ WHEN THE KEYBOARD IS TOGGLED OFF THERE ARE NO FLANKS, so the readout
     * falls back to the top plate. Otherwise turning the board off would also
     * silently remove the score, which is not what the toggle is for.
     */
    /**
     * The student's real day and week totals, for the bottom of each flank.
     *
     * ⚠️⚠️ THESE DO NOT INCLUDE THE RUN IN PROGRESS, AND THAT IS NOT A ROUNDING
     * ISSUE — arcade time is not counted at all yet (nothing on this page
     * writes). So the numbers are the student's REAL totals as of page load and
     * will not move while they play. That is honest, but it is also exactly the
     * kind of thing a child reads as broken, so the labels say TODAY and WEEK
     * rather than implying live accumulation. WHEN THE learn.js SECONDS SEAM IS
     * WIRED, these start moving on their own and the labels still hold.
     * ⚠️ NO GETTER MEANS NO LINES, not zeroes — "0m today" is a claim, and a
     * page that never asked has no business making it.
     */
    function minuteLines() {
        if (!getMinutes) return {};
        let m = null;
        try { m = getMinutes(); } catch (_) { return {}; }
        if (!m) return {};
        const fmt = sec => {
            if (sec == null) return null;
            const mins = Math.floor(sec / 60);
            return mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm' : mins + 'm';
        };
        // ⚠️⚠️ ONE FORMATTER, TWO SHAPES, AND THIS IS THE WHOLE REASON IT LIVES
        // HERE (Round 100b). The console's BANKED rows are seven-segment now,
        // and drawSevenSeg() renders digits, a colon and a minus — it cannot be
        // handed "1h 20m". The tempting fix is a `Math.floor(sec/60)` inside
        // drawGauges(), which is exactly the second formatter this function's
        // own comment has warned about since Round 95: two places converting
        // seconds to minutes is two chances to round differently, and the
        // failure a student sees is two different totals for one day.
        // ⭐ SO BOTH SHAPES COME OFF THE SAME SECONDS IN THE SAME FUNCTION, and
        // arcade-panels-test.mjs asserts they agree to the minute over a sweep.
        //
        // ⚠️⚠️ ROUND 101 — THE DIGITS CARRY SECONDS AND THE WORDS STILL DO NOT,
        // AND THAT IS NOT A DRIFT. Jake, 2026-09-09: *"I'd like the today and
        // week timers to be bigger and include seconds."* The two shapes are the
        // SAME seconds at two resolutions: `fmt` rounds down to the minute for
        // the narrow keyboard flanks, `clock` prints the whole figure for the
        // console. They cannot disagree, because neither is a re-derivation of
        // the other — both read `sec`.
        // ⚠️ ALWAYS h:mm:ss, NEVER m:ss ON SHORT TOTALS. A row that switched
        // shape once a student passed an hour would put TODAY and WEEK at
        // different widths on the same panel, which is precisely the "slightly
        // off" this console is built to avoid — and "8:05" beside "3:12:40"
        // invites reading the first as eight hours.
        const clock = sec => {
            if (sec == null) return null;
            const s = Math.max(0, Math.floor(sec));
            const h = Math.floor(s / 3600);
            return h + ':' + String(Math.floor(s / 60) % 60).padStart(2, '0') +
                       ':' + String(s % 60).padStart(2, '0');
        };
        const day = fmt(m.dailySeconds), week = fmt(m.weeklySeconds);
        return {
            bottomLeft:  day  == null ? null : 'TODAY  ' + day,
            bottomRight: week == null ? null : 'WEEK  ' + week,
            todayClock: clock(m.dailySeconds),
            weekClock:  clock(m.weeklySeconds),
        };
    }

    function hudLines(rep, dir) {
        return dir.endless
            ? { left: ['SCORE ' + rep.score, rep.wpm + ' WPM', rep.acc + '%'],
                right: ['ARCADE', 'target ' + rep.targetWPM + ' WPM'] }
            : { left: [rep.wpm + ' WPM', rep.acc + '% accurate'],
                right: ['TARGET', rep.targetWPM + ' WPM / ' + rep.minAccuracy + '%'] };
    }

    function drawHudTop(ctx, W, rep, dir) {
        const lines = dir.endless
            ? `SCORE ${rep.score}   ${rep.wpm} WPM   ${rep.acc}%`
            : `${rep.wpm} WPM   ${rep.acc}%   TARGET ${rep.targetWPM}/${rep.minAccuracy}%`;
        // ⚠️ SET THE FONT BEFORE MEASURING. The first draft measured with
        // whatever font the previous draw call had left on the context, so the
        // HUD plate drifted left and right as the game drew different things.
        const hudFont = 'bold 15px "Courier Prime", monospace';
        ctx.save();
        ctx.font = hudFont;
        const hudW = ctx.measureText(lines).width;
        ctx.restore();
        platedText(ctx, {
            x: 14 + hudW / 2, y: 22, text: lines,
            font: hudFont, color: '#8fe8c8',
            bg: 'rgba(2,4,10,0.75)', padX: 10, padY: 6, border: 'rgba(0,229,255,0.2)',
        });
        if (!dir.endless) {
            const pct = Math.min(1, dir.clearedChars / dir.quotaChars);
            const bw = Math.min(200, W * 0.3);
            const bx = W - bw - 14;
            ctx.save();
            roundRect(ctx, bx, 14, bw, 12, 6);
            ctx.fillStyle = 'rgba(2,4,10,0.8)'; ctx.fill();
            ctx.strokeStyle = 'rgba(0,229,255,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            roundRect(ctx, bx + 1.5, 15.5, Math.max(0, (bw - 3) * pct), 9, 4.5);
            ctx.fillStyle = pct >= 1 ? '#ffd700' : '#00e5ff'; ctx.fill();
            ctx.restore();
        }
    }


    /**
     * ⚠️ A FRESH DIRECTOR, NOT A RESET ONE. "Play again" has to produce a run
     * that is indistinguishable from a first run, and a reset() method would be a
     * second place that knows every field on the director — which is how a stale
     * counter survives a restart and shows up as a student's second game scoring
     * impossibly high.
     */
    function restart() {
        // ⚠️ newDirector(), NOT `new GameDirector(cfg)`. That line is what halved
        // the city on every replay for as long as "play again" has existed.
        d = newDirector();
        live = []; missiles = []; particles = [];
        locked = null; banner = null; flash = 0; countdown = null;
        ended = false; started = false; lastFrame = null; tickAcc = 0;
        // ⚠️ THE MOMENTARY FEEDBACK IS CLEARED; THE ERROR MEMORY IS NOT. A swell
        // left over from the last run would fire on the first frame of the new
        // one, pointing at a key nobody just missed. keyStates deliberately
        // survives — "where I keep getting stuck" is the whole point of it, and
        // a student who replays to work on the same keys wants it standing.
        missPulse = null; hitFlash = null;
        // ⚠️⚠️ THE HIGH-WATER MARK RESETS WITH THE DIRECTOR, OR THE SECOND RUN
        // BANKS NOTHING. restart() builds a FRESH GameDirector, so the graded
        // clock returns to zero — a `secondsBanked` left at 35 would swallow the
        // first 35 seconds of every replay. ⚠️ This is exactly the "stale counter
        // survives a restart" failure this function's own header warns about,
        // and it only became reachable once the tick started firing at all.
        secondsBanked = 0;
        // ⚠️ AND THE FROZEN GRADE GOES WITH IT. A snapshot surviving into the
        // replay would report the PREVIOUS run's WPM as this one's pass.
        passReport = null;
        layout();
        chrome.setPhase('ready');
    }

    // ── lifecycle ───────────────────────────────────────────────────────────
    //
    // ⚠️ THE HIDDEN-TAB PAUSE IS THE ONLY THING ALLOWED TO STOP THE CLOCK. See
    // GameClock's header: idle time inside a running game is charged, because
    // dead air between spawns is the game's own and an idle-aware clock would
    // report a student's WPM as three times their real speed.
    function onVisibility() {
        const now = performance.now();
        if (document.hidden) { d.pause(now); }
        else { d.resume(now); lastFrame = null; }
    }
    function onResize() { layout(); }

    layout();

    // ⚠️ THE CHROME OWNS GET-READY, PAUSE, QUIT, RESTART AND MUTE, and it is DOM
    // rather than canvas so every one of them is a real tap target. Both views
    // were keyboard-only before this, which meant a student on an iPad with no
    // keyboard attached could not even quit.
    const chrome = mountChrome(container, {
        // ⚠️ PASSED STRAIGHT THROUGH. This view has no opinion about where the
        // buttons live; the page that mounts it does.
        barHost: (opts && opts.barHost) || null,
        title: 'Deadline',
        hint: 'Words are falling on Nashville. Type the one closest to the ground. '
            + 'Backspace gives up on a word so you can save a different landmark.',
        muted: isMuted(),
        keysOn: kbOn,
        // ⚠️ RE-LAYS OUT IMMEDIATELY. kbH feeds the ground line, the dome radii
        // and the silo positions, so toggling without a layout() would leave the
        // city drawn where the keyboard used to be. Returns the new state so the
        // chrome can relabel its own button without duplicating the state.
        onToggleKeys() {
            kbOn = !kbOn;
            try { localStorage.setItem('ttb_arcade_keyboard', kbOn ? '1' : '0'); } catch (_) {}
            layout();
            return kbOn;
        },
        // ⭐ THE COUNTDOWN RENDERS IN THE CONSOLE'S CLOCK, NOT OVER THE SKY.
        // ⚠️ SUPPLYING THIS CALLBACK IS WHAT TAKES THE 96px NUMERAL AWAY — see
        // game-chrome.js v1.4.0. It is only correct to supply it because this
        // view HAS a readout to put the digits in; Escape Key does not, passes
        // no onCountdown, and keeps the overlay numeral unchanged.
        onCountdown(n) { countdown = n; },
        onStart() { started = true; lastFrame = null; },
        onPause(on) {
            const now = performance.now();
            // ⚠️ PAUSE STOPS THE GRADED CLOCK. This is the one deliberate
            // exception beside a hidden tab: the student asked for it, and there
            // is nothing on screen to type at while the panel is up.
            if (on) d.pause(now); else { d.resume(now); lastFrame = null; }
        },
        onQuit() {
            // ⚠️⚠️ v1.12.0 — QUITTING AFTER THE PASS IS NOT ABANDONING THE RUN.
            // Once passReport exists the student has WON (see the survival
            // branch: "A PASS CANNOT BE UNDONE"). Handing the host a plain quit
            // here let learn2.js treat a defended city as an abandoned run —
            // straight to the map, no grade, no way forward. Ending the session
            // instead sends the frozen pass through onEnd exactly as a death in
            // survival does. Round 115 (Tower).
            if (passReport && !ended) { finish(performance.now(), false); return; }
            onQuit(d.report(performance.now()));
        },
        onRestart() { restart(); },
        onMute(m) { setMuted(m); },
    });
    chrome.setPhase('ready');

    window.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    rafId = requestAnimationFrame(frame);

    return {
        destroy() {
            if (rafId != null) cancelAnimationFrame(rafId);
            rafId = null;
            window.removeEventListener('keydown', onKeyDown, true);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('resize', onResize);
            if (chrome) chrome.destroy();
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            live = []; missiles = []; particles = []; locked = null;
        },
        /** For a host that wants the numbers without waiting for onEnd. */
        report() { return d.report(performance.now()); },
        /**
         * ⚠️⚠️⚠️ DIAGNOSTICS AND HARNESSES ONLY. NOTHING MAY RENDER
         * `calibration`. RULE 11 — it is not `netWPM()`: different window (one
         * burst, not a session), different denominator (characters of target
         * text, not keystrokes), different purpose (pacing, not assessment).
         * ⭐ THE STUDENT SEES A DIFFICULTY, NEVER A SPEED.
         *
         * ⚠️ THE SAME SHAPE game-shatter.js CARRIES, AND FOR THE SAME REASON:
         * Round 118 shipped an engine nothing called and 101 harnesses stayed
         * green. The only defence is a test that can mount this view and ask
         * whether the calibrator is being fed — which means seeing the sky too,
         * or it can only type blind and assert nothing.
         * ⚠️ `tests/adaptive-arcade-test.mjs` Part G goes red if any file
         * outside `tests/` calls it.
         */
        debug() {
            return {
                calibration: d.calibrator ? d.calibrator.snapshot() : null,
                shieldsMax: d.shieldsMax,
                over: d.over,
                // ── what the director believes, at the same instant ────
                // ⚠️ READS, NOT COUNTERS. Rule 9: every one of these is a number
                // the director already keeps for its own pacing. A telemetry
                // module that tallied spawns itself would be a second record of
                // the spawn count, and the first argument in any disagreement
                // would be which of the two is right.
                // ⚠️ THE VIEW SETS costFactor, NOT arcadeConfig() — so the first
                // real traces came back without it, and an interval column you
                // cannot divide by the cost factor is a column you cannot read.
                costFactor: d.costFactor,
                cleared: d._extraCleared,
                pressure: d.pressure,
                intervalMs: d.intervalMs,
                lifetimeMs: d.lifetimeMs,
                // ⚠️ THE PACE THE DIRECTOR IS USING — NOT netWPM(), NOT A SCORE,
                // AND NOT FOR A SCREEN. Rule 11: this leaves the machine in a
                // diagnostic CSV or not at all.
                pacedWPM: d.calibratedWPM,
                shields: d.shields,
                // ⚠️ COPIES, NOT THE LIVE TARGETS. A harness that could reach in
                // and set `typed` would be testing something no student can do.
                panes: live.map(e => ({ id: e.id, text: e.text, typed: e.typed,
                                        piece: false })),
            };
        },
    };
}
