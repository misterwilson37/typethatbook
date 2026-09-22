// game-shatter.js v1.18.0 — Round 127 (Didot): passes the calibrator's sample and
// rejection counts through to telemetry, same as Deadline.
// game-shatter.js v1.17.0 — Round 126 (Fournier): ⚠️⚠️ THE KEYS COME OUT OF THE
// PROSE. Round 125 fixed the sentence that promised a ping on the radial board;
// this puts every key in `controls`, which game-chrome.js renders as a scannable
// grid. ⭐ A KEY BURIED MID-PARAGRAPH IS A KEY A SIXTH-GRADER SKIMS PAST — which
// is how the scatter went unused long enough to be reported broken before we
// found that it really was. The two boards get different rows because they have
// different keys: PING IS DRIFT-ONLY, and on the radial board Enter scatters.
// game-shatter.js v1.16.0 — Round 125 (Bodoni): ⚠️⚠️⚠️ THE RADIAL HINT
// PROMISED A PING THAT BOARD DOES NOT HAVE. Enter's handler reads
// `if (!drift) { tryScatter(true); return; }` — it returns BEFORE the ping, so
// PING IS DRIFT-ONLY and on Shatter proper Enter scatters. A child on the radial
// board was told to press Enter for "a wave that writes each pane's word on the
// ring" and got a scatter or a refusal. ⭐⭐ AND THE COMMENT ABOVE THE HINT IS WHY
// IT LIVED: it certifies that every key the hint names is a key this view
// handles, which is TRUE and INSUFFICIENT — naming the right key is not
// describing the right effect, and `abandon-lock-test.mjs` D1/D2 check only the
// key set. D4 now pins the effect. ⚠️ Both hints also expanded on a student's
// account (Jake, 2026-09-15) to say what ENDS the run, not only what the keys do.
// game-shatter.js v1.15.0 — Round 124 (Sholes): ⚠️⚠️⚠️ `tryScatter()` HAD NO
// BODY. Round 122 shipped two call sites and no function, so Space and Enter
// both threw a ReferenceError and the scatter has been dead since — Jake:
// *"neither the space nor the enter key pushed the words back. Ever. Didn't
// matter if I was between words or in the middle of them."* ⭐ THAT LAST CLAUSE
// IS THE DIAGNOSTIC: `canWarp()`'s guards would have produced a control that
// worked SOMETIMES, so a control that works NEVER is upstream of them — and it
// means Round 122 spent a round tuning permissions on a function nobody could
// call. ⚠️⚠️ AND THE PING WAS CAPPED AT 1.05 IN TWO PLACES AT ONCE: one literal
// spent as a sweep DISTANCE in field units and again as a draw RADIUS through
// `toPixelRadius()`, which maps 1 to `ringR` on the drift board — so the wave
// could only reach 1.05 and could only be DRAWN to 1.05 × the ring. The picture
// and the mechanic agreed with each other and both were wrong. `PING_REACH` is
// now `WRAP_EDGE × √2`, the far CORNER of the square field Shards wraps on,
// which is where the off-canvas panes actually are. See tryScatter(),
// PING_REACH and drawPingLabels().
// game-shatter.js v1.14.0 — Round 122 (Maskelyne): ⚠️⚠️ ENTER SCATTERS ON THE
// RADIAL BOARD AND PINGS ON THE DRIFT ONE, and both go through `tryScatter()`,
// which now SAYS SO when the board refuses — Jake read a correctly-refused
// scatter as a broken one (*"works intermittently"*) because nothing on screen
// said anything. ⭐ Enter is `deliberate`: it cannot be confused with typing, so
// the half-typed and reflex guards that protect a SPACE-pressing student do not
// apply to it. ⚠️ The countdown moved into the gauge readout (the overlay is
// suppressed when there is one), and `layout()` now tells the board what a field
// unit is worth in pixels — see the hit-box note there.
// game-shatter.js v1.13.0 — Round 121 (Maskelyne): ⭐⭐ THE PING, THE SCATTER'S
// NAME, AND A CLOCK THAT STARTS WHEN THE COUNTDOWN DOES. Enter sweeps a wave out
// from the prism and writes each pane's word at the point of the ring nearest it
// for 2.6 seconds — Jake's answer to *"the beginning is incredibly boring"*, and
// it deliberately gives nothing to a pane already inside the ring, so it fades
// out as the game gets harder. ⚠️ `ENTRY_M` is now `shatter-board.js`'s `ENTRY_R`,
// imported: Round 121 gave that band its own speed, so the number is a RULE and
// two copies would put the crawl and the ring in different places.
// game-shatter.js v1.12.0 — Round 120 (Maskelyne): ⚠️⚠️ TWO OF JAKE'S THREE
// SHATTER COMPLAINTS, BOTH FIXED IN THE VIEW AND NEITHER IN THE BOARD.
// *"Shatter panes don't shatter, they just kind of respawn separately. They also
// don't spawn off screen, but in the circle itself."*
// ⭐ THE SPAWN ONE WAS ONE LINE: field magnitude 1 mapped to `ringR`, a circle
// this file DRAWS, so panes appeared on a visible line. `entryRadius()` runs the
// outer band of the field to the canvas edge instead — see it for why the band
// is piecewise and not a whole-field stretch.
// ⭐ THE SPLIT ONE IS `SPLIT_FLY_MS`: pieces keep the board's one-journey-one-
// speed rule (Jake's ruling, 2026-09-13: *"Shatter is a different game, leave it
// as is"*) and the VIEW walks them out of the point the parent broke at.
// ⚠️⚠️ THE BOARD IS UNTOUCHED BY BOTH. No pacing, no arrival time, no lock rule,
// no hit test — shatter-board.js and its harness are byte for byte what they
// were, which is the property the `place()` seam was built to have.
// game-shatter.js v1.11.0 — Round 119 (Hammond): ⚠️⚠️ THE BOARD CLOCK NO LONGER
// RUNS WHILE PAUSED. Measured from a real trace: a 254-second pause handed the
// first resumed frame a 254,000ms dt and took two of three shields in five
// seconds. See the frame loop.
// game-shatter.js v1.10.0 — Round 119 (Hammond): debug() also reports what the
// DIRECTOR believes — cleared, pressure, interval, lifetime, paced WPM — so
// `arcade-telemetry.js` can record the pacing curve without adding a single
// counter (Rule 9: every field is a read of a number the game already keeps).
// ⚠️ Nobody could count panes while playing and a screen recording could not see
// the director's model at all. ⚠️ RULE 11 STILL HOLDS: `pacedWPM` may be written
// to a diagnostic CSV and may never reach a screen.
// game-shatter.js v1.9.0 — Round 119 (Hammond): ⚠️⚠️ BACKSPACE LETS GO OF THE
// WORD. Escape did release the lock — AND PAUSED THE GAME IN THE SAME KEYSTROKE,
// because game-chrome.js's `stopPropagation()` does not stop a sibling listener
// on the same target. Alive and unusable. See onKeyDown(). Jake typed the `ate` in `affectionate` ten times and
// could not clear it; `release()` wipes the invisible progress as well as the
// lock, which is the half that makes the word typeable again.
// game-shatter.js v1.8.0 — Round 119 (Hammond): ⭐ THE CALIBRATOR IS WIRED, AND
// THIS IS THE FIRST VIEW THAT MEASURES THE CHILD IN FRONT OF IT.
// ROADMAP 118a. `typing-calibrator.js` and the `GameDirector` integration
// shipped inert in Round 118; this file is what calls them.
//
// ⚠️⚠️ FOUR CALLS, AND THE HARD PART IS *WHICH PANE* AND *WHICH CLOCK*.
//   • `spawned()` at the director's spawn site — NOT on pieces, see below.
//   • `keyed()` on every CORRECT key, against the pane the key actually landed
//     on, which after a re-lock is not the pane that was locked before it.
//   • `finished()` when a pane is typed out, `dropped()` when one hits the prism.
//
// ⚠️⚠️ EVERY ONE OF THEM TAKES `now`, THE WALL CLOCK — NEVER `bNow`. The board
// clock slows to 22% during the shatter effect, and a child typing through slow
// motion is still typing in real seconds. Feeding `bNow` would report them as
// up to 4.5× faster than they are and hand them a game paced for a typist who
// does not exist. ⭐ The rule is the same one the two-clock split already states
// for the banked seconds: the BOARD runs on `bNow`, anything measuring the
// STUDENT runs on `now`.
//
// ⚠️⚠️ PIECES ARE NOT CALIBRATION SAMPLES, AND THAT IS A DESIGN RULING, NOT AN
// OVERSIGHT. Acquisition means locate-and-read: find the target, read the word,
// aim. A piece is born where the student is already looking, spelling a word
// they finished typing half a second ago — its acquisition is near zero for
// everybody, fast and slow alike. ⭐ FOLDING PIECES IN WOULD DRAG MEDIAN
// ACQUISITION DOWN, WHICH RAISES `onScreenTarget`, WHICH PUTS MORE PANES ON THE
// BOARD — and more panes is precisely what hurts the hunting child the
// per-student design exists to protect. The `MIN_ON_SCREEN = 3` sweep that
// collapsed to 53.2% is the same mistake made globally.
// ⭐ AND IT NEEDS NO BRANCH IN THE KEY HANDLER: a piece was never `spawned()`,
// so `keyed()`, `finished()` and `dropped()` on a piece id are no-ops by
// construction. The rule is enforced at one site.
// game-shatter.js v1.7.0 — Round 117 (Bennett): the pane size rule moves to
// shatter-board.js so Shards' hit test and this file's draw read ONE formula.
// ⚠️ NO BEHAVIOUR CHANGE HERE — paneRadius(text, size) returns exactly what the
// inline max() returned. The change is who else can see it.
// game-shatter.js v1.6.0 — Round 116 (Sun): ⭐ THE PRISM SHATTERS IN SLOW MOTION.
//   Jake: *"when the ship gets hit, it should shatter into all the colors.
//   Ideally in slow motion."* The burst is the WHOLE finger spectrum, not the
//   pane's palette — the prism has been refracting all eight fingers all game,
//   and this is the only moment they appear at once.
//   ⚠️⚠️ THE SLOWDOWN NEEDED A SECOND CLOCK, AND THE SPLIT IS THE CAREFUL PART:
//   the BOARD runs on `bNow`, which slows; the DIRECTOR keeps wall clock, so the
//   seconds a student banks are untouched. Every board call reads `bNow` so the
//   board is internally consistent — a warp cooldown measured on one clock and
//   spent on another is the Rule 11 shape. ⚠️ `bNow` only ever runs SLOWER than
//   wall clock; one that could run faster would bank time nobody typed in.
// game-shatter.js v1.5.0 — Round 116 (Sun), after Jake played it:
//   • ⭐ THE COUNTDOWN IS THE SEVEN-SEGMENT ONE NOW. *"the countdown at the
//     beginning of shatter is not the digital countdown of deadline, and I think
//     that's a consistency thing that should be across games."* game-chrome.js
//     has offered `onCountdown` since Round 99 and Deadline was the ONLY view
//     that ever took it up — the same "option offered at one end, consumed at
//     neither" shape this project keeps finding. ⚠️ Escape Key still has not.
//   • ⭐ THE PRISM HOLDS ITS BEARING THROUGH A MISS. *"the prism ship points up
//     on mistakes, which is jarring when your target is below you."* A wrong key
//     drops the lock, which is right; the view treated "no lock" as "nowhere to
//     aim" and flicked to its rest pose — a 180° snap at the moment the student
//     is already off balance. ⚠️ AIM AND LOCK ARE NOT THE SAME QUESTION.
// game-shatter.js v1.4.0 — SHATTER. Rounds 103, 106, 109 (Bar-Let), 116 (Sun).
//
// v1.4.0 — ⭐⭐ THIS VIEW NO LONGER KNOWS WHAT A POLAR COORDINATE IS. Jake:
//   *"What about a shatter 2 and have kids try both?"* — two motion models
//   offered side by side for a rotation. ⚠️⚠️ THE WHOLE RISK IN THAT PLAN IS
//   RULE 5: two GAMES is fine and the registry is built for it, but two COPIES
//   of one game is what `tools/game-lab.html` was deleted for. This file read
//   `rock.r` and `rock.angle` in nine places, so a drift board would have
//   forced a second VIEW — and from that moment every change to the glass
//   would have had to be made twice.
//   It now asks `board.place()` where a pane is and how urgent it is, and
//   `toPixels()` is the only geometry left in the file. ⚠️ NOTHING ON SCREEN
//   MOVED: shatter-board-test.mjs Part H sweeps 400 positions and asserts the
//   new path lands every pane on the same pixel the old px() did.
//
//
// v1.3.0 — ⭐⭐ STAINED GLASS, AND A PRISM FOR A SHIP.
//   ⚠️⚠️ THIS IS THE THIRD TIME THIS FILE HAS REDRAWN ITS TARGETS AND THE FIRST
//   TIME THE ART HAS MADE AN ARGUMENT. v1.0.0 drew a rounded rectangle behind
//   text — Jake: *"that's just...bad."* v1.2.0 drew an irregular polygon, which
//   does say BREAKABLE and says nothing else, and what it bought was Asteroids
//   wearing a different name. ⭐ THE GAME IS CALLED SHATTER AND THE WORDS WERE
//   ALREADY COLOURED A LETTER AT A TIME BY THE FINGER MAP; the thing that
//   shatters into coloured pieces is GLASS, and it always was.
//
//   A target is now a **leaded pane with one panel per letter**, each panel the
//   colour of the finger that types it. It starts dark. A correct key lights its
//   panel from behind and the prism throws a ray in that same colour to do it.
//   The last key lights the last panel and the pane blows apart into shards of
//   exactly those colours. ⚠️ THE PROGRESS DISPLAY, THE FINGER DRILL AND THE ART
//   ARE ONE OBJECT NOW rather than three stacked on each other — which is why
//   `drawTargetWord()`'s red-typed/white-rest scheme is DELETED rather than
//   kept: it was a second, competing answer to "how far through am I".
//
//   ⭐ THE SHIP IS THE SAME TRIANGLE POINTING THE SAME WAY. That is the whole
//   design: the prism is not a new ship, it is what that triangle turns out to
//   have been once the targets became glass. White light enters the back face,
//   the spectrum rests at the apex, and a correct key collapses the fan into one
//   ray. ⚠️ A WRONG KEY WHITES IT OUT AND THROWS NOTHING, because the one thing
//   a mistake must read as is *no light came out*. See HANDOFF §16 for why the
//   aim behaviour itself was not touched (Jake's *"do not rewrite what works"*).
//
//   ⚠️ THE PANE DOES NOT TUMBLE. v1.2.0's rocks spun with the word drawn flat on
//   top in screen space — fine for a label in front of a rock, impossible once
//   each letter must stay over its own panel. A frozen tilt and a slow sway
//   instead: a sway costs nothing, a spin costs legibility.
//
// v1.2.0 — ⭐ BOTH SIDE PANELS, STACKED WARPS, AND THE IDLE-AWARE BANKED CLOCK.
//   ⚠️ THE RIGHT PANEL REUSES drawGauges() rather than growing a third console:
//   the ship's LIVES are Deadline's shields under a different word.
//   ⚠️ THE LEFT PANEL'S RADAR IS DELIBERATELY USELESS — Jake: *"It's just window
//   dressing... Only the 'Can I warp yet?' bar is important."* Do not label the
//   contacts.
// game-shatter.js v1.1.0 — Round 106.
//
// v1.1.0 — ⚠️⚠️ ROCKS ARE OBJECTS NOW, NOT LABELS. v1.0.0 drew every target as a
//   rounded rectangle behind text — Jake's verdict was *"that's just...bad. Just
//   plain bad."* ⭐ NOTHING ABOUT A ROUNDED RECTANGLE SAYS *BREAKABLE*, and
//   breakable is the one thing this game's art has to communicate. Rocks are
//   irregular 10-point polygons with a silhouette frozen at spawn, a slow tumble,
//   and a fill that distinguishes a piece from its parent by KIND rather than by
//   degree. ⭐ And the ship aims at the locked rock, which is drawn confirmation
//   the lock went where the student meant — worth most here, because two split
//   pieces can share a first letter.
//
// ⚠️ v1.0.0 IS THE FIRST VERSION OF THIS FILE THAT HAS EVER LEFT A CONTAINER,
// and by Jake's standing ruling (2026-09-07) that is where it starts: *"Nothing
// to this moment has had a version, so I'd rather it be 1.x."* **THE VERSION LOG
// RECORDS DEPLOYS, NOT DRAFTS.** The reasoning from the drafts is kept as prose
// below, because the reasoning is the part with value.
//
// ⚠️ RENAMED FROM "Asteroids", and on the rip-off question Jake's own read is the
// one this file follows: Maelstrom was Asteroids' mechanic wearing none of
// Asteroids' clothes. Mechanics are not the exposure; the name and the art are.
// Keep the mechanic, own the art.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE THREE-WAY SPLIT, AND WHY EACH PIECE IS WHERE IT IS
// ═══════════════════════════════════════════════════════════════════════════
//
//   game-shell.js     the numbers.  Timing, WPM, accuracy, pressure, score.
//   shatter-board.js  the rules.    The split ladder, rock travel, the lock,
//                                   the warp meter. Pure, and TESTED — 55
//                                   assertions in tests/shatter-board-test.mjs.
//   game-shatter.js   the pixels.   This file.
//
// ⚠️ THIS FILE OWNS NO NUMBERS AND NO RULES. It does not decide whether a
// keystroke was correct (the board says), what it is worth (the shell says), how
// a word splits (the board says), or how fast a rock falls (the shell says). If a
// `SPEED` constant or an `if (word === typed)` ever appears here, one of the two
// files above has grown a second copy.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ IT IS A GAME, NOT AN ASSESSMENT, AND THAT IS A RULING — Jake, 2026-09-09
// ═══════════════════════════════════════════════════════════════════════════
//
// *"Shatter and Escape Key are just games. They're not quizzes. Kids can choose
// to play them or not... They're graded on time, and time spent typing is time
// spent well."*
//
// ⭐ SO THIS VIEW HAS NO QUOTA PATH, NO FROZEN-PASS SNAPSHOT AND NO GRADE. It
// does not accept `survival`, it never calls `recordRunOutcome`, and `d.quotaMet`
// is not consulted anywhere below. Deadline has all three because Deadline
// replaces a graded run; ⚠️ DO NOT COPY THEM ACROSS FROM IT because the files
// otherwise look alike.
//
// ⚠️⚠️ AND THEREFORE `onSecond` IS THE LOAD-BEARING SEAM OF THIS ENTIRE FILE.
// Time is the only thing Shatter produces that the app keeps. A view that draws
// beautifully and never emits a second is a view that does nothing — which is
// exactly what Escape Key was for twenty rounds while `game-names.js` promised
// `countsTime: true` and nobody noticed. bankWholeSeconds() below mirrors
// game-escape.js v1.1.0 and game-deadline.js v1.10.0 statement for statement,
// including the two things that made it wrong in Deadline first: it is called
// from the frame loop AS WELL AS finish(), and in finish() it sits ABOVE
// `ended = true` and ABOVE `d.end()`.

import { GameDirector } from './game-shell.js';
import { TypingCalibrator } from './typing-calibrator.js';
import { ShatterBoard, splittable, SHATTER_COST_FACTOR, paneRadius, ENTRY_R } from './shatter-board.js';
// ⭐ THE SECOND CABINET. Jake: *"build shard, please. I want kids to have that
// option."* ⚠️⚠️ ONE VIEW, TWO BOARDS — that is the whole reason Round 116 spent
// a version on the `place()` seam before writing a line of Shards. A second
// COPY of this file would be Rule 5 and every change to the glass would have to
// be made twice; a second BOARD is just a different answer to "where is this
// pane", which this file stopped asking directly in v1.4.0.
// ⚠️ `WRAP_EDGE` IS IMPORTED, NOT COPIED. It is the drift field's own edge and
// the ping's reach is derived from it — a literal here would be a second answer
// to "how big is the field", and the first one is in shatter-shards.js.
import { ShardsBoard, WRAP_EDGE } from './shatter-shards.js';
import { mountChrome } from './game-chrome.js';
import { sfx, isMuted, setMuted } from './game-audio.js';
import {
    fitCanvas, platedText, glassBurst, updateParticles,
    drawParticles, roundRect, drawHitFeedback, drawCapsWarning, motionScale,
    makeStars, drawStars, fingerColorOf, fingerPalette, drawCountdownOverlay,
} from './game-draw.js';
// ⚠️⚠️ A TARGET IS A PANE OF GLASS, ONE PANEL PER LETTER. v1.0.0 drew a rounded
// rectangle behind text (a label), v1.2.0 drew an asteroid (breakable, and
// nothing else). See game-sprites.js's SHATTER section header for why this is
// the version that makes the name, the colours and the shots one idea.
import { paneCut, drawPane, drawPrism, drawRefract } from './game-sprites.js';
import { drawShatterPanel, drawGauges } from './game-draw.js';
import { MAX_WARPS } from './shatter-board.js';

export const GAME_SHATTER_VERSION = '1.18.0';

// Cosmetic only. ⚠️ NOT A DIFFICULTY KNOB — the board owns travel, the shell owns
// pacing. These decide where a rock is DRAWN, never when it arrives.
const SHIP_R = 26;          // the prism's own radius in px
const RING_MARGIN = 30;     // gap between the spawn ring and the canvas edge
// ⚠️ A THREAT LEVEL, NOT A RADIUS, SINCE v1.4.0. The board decides what makes a
// pane urgent (this one derives it from range; a drift board would fold in
// closing speed); the view decides only how urgent is urgent enough to go red.
// ⭐ 0.78 IS THE OLD `r <= 0.22` EXACTLY, since this board's threat is 1 - r.
const DANGER_T = 0.78;

// ⚠️⚠️ WHERE THE FIELD PROPER ENDS AND THE APPROACH BEGINS IS `shatter-board.js`'s
// `ENTRY_R` — imported, never restated. Round 121 gave the board its own speed
// for that band (APPROACH_MS), so the number is now a RULE and not a drawing
// choice, and two copies of it would put the crawl and the ring in different
// places. ⭐ The alias exists only so this file reads the way it did.
const ENTRY_M = ENTRY_R;

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ THE PING — Jake, 2026-09-14, on Shards
// ═════════════════════════════════════════════════════════════════════════════
//
// *"We should add a radar ping so that the person can hit the enter key and see
// the text of the incoming panes. A wave comes out from the ship, and when it
// hits a pane, it shows the word on the point of the circle closest to the pane.
// It stays up there for 2-3 seconds and is typable. That gives people a chance to
// type the word as soon as the pane is visible, even if the word is not. It will
// speed up early game for impatient people, and it won't provide any additional
// help in later game."*
//
// ⭐⭐ THE LAST SENTENCE IS THE DESIGN ARGUMENT AND IT IS WHY THIS IS NOT A
// CHEAT. Late in a run the panes are close and their words are already readable,
// so a label at the rim tells a student nothing they do not have. Early, when a
// pane is a dot at the edge of a very slow crossing, it is the difference between
// playing and waiting. ⚠️ A HELP THAT FADES OUT AS THE GAME GETS HARDER IS THE
// ONLY KIND THIS GAME CAN AFFORD.
//
// ⚠️ IT COSTS NOTHING AND CANNOT BE HOARDED. The warp meter exists because a
// board-clearing power must be earned; this clears nothing, moves nothing and
// changes no rule — it only draws a word the student could have read by waiting.
// ⚠️ THE COOLDOWN IS SO THE WAVE READS AS AN EVENT, not to ration it.
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ THE PING'S REACH IS THE FIELD, NOT THE RING — Round 124
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-14: *"while hitting space bar sent out an appropriate wave, it
// stopped at the circle, and the whole point is that it reveals the words that
// aren't visible yet off screen."*
//
// ⭐⭐ ONE NUMBER DID BOTH HALVES OF THE DAMAGE, because `1.05` was spent twice —
// once as a SWEEP DISTANCE in field units and once as a DRAW RADIUS through
// `toPixelRadius()`. On the drift board that maps 1 to `ringR`, so a wave that
// could only reach 1.05 could also only be DRAWN to 1.05 × the ring. The picture
// and the mechanic agreed with each other and both were wrong.
//
// ⚠️⚠️ AND THE FIELD IS A SQUARE. `shatter-shards.js` wraps on a box at
// `WRAP_EDGE`, so the furthest a pane can ever be is the box's CORNER —
// `WRAP_EDGE * √2`, about 1.91. Every pane between 1.05 and 1.91 is exactly the
// pane this control exists for: far enough out to be off the canvas, and
// therefore invisible and unreadable. The ping swept past none of them.
//
// ⚠️ NOT `SPAWN_R`, WHICH IS 1 AND IS WHERE PANES ARE BORN. They drift and wrap
// after that; where they are born is not where they are.
const PING_REACH = WRAP_EDGE * Math.SQRT2;

// ⚠️ THE RATE IS A SPEED, SO IT HAD TO MOVE WHEN THE DISTANCE DID. The old 1.6
// crossed 1.05 in 0.66 s; this crosses PING_REACH in the same time at the same
// pixels-per-second, which is what "the same expansion rate the scatter wave
// uses" was always supposed to mean. ⭐ A shared CONSTANT is not a shared speed
// once the two waves travel different distances.
const PING_SWEEP_RATE = 1.6 * (1.05 / PING_REACH);
const PING_LABEL_MS = 2600;       // Jake's "2-3 seconds"
const PING_COOLDOWN_MS = 900;

// How far past the canvas edge a pane's CENTRE is born, in pixels.
const PANE_CLEARANCE = 74;

// ⚠️⚠️ HOW LONG THE PIECES OF A BROKEN WINDOW FLY APART, in board milliseconds.
// Jake, 2026-09-13: *"shatter panes don't shatter, they just kind of respawn
// separately."* ⭐ AND THE BOARD IS NOT WRONG — pieces share the parent's
// journey, one journey and one speed, which is Jake's own ruling and stands.
// What was missing is that they ARRIVED at their fanned positions rather than
// travelling there: three panes blinked into existence a little apart from where
// one used to be. ⚠️ SO THIS IS A DRAWING DECAY AND NOTHING ELSE. The board's
// position is the truth the whole time; for a third of a second the view draws
// the piece somewhere between where the parent broke and where the board says it
// is. Arrival times, the lock rule and the hit test never see it.
const SPLIT_FLY_MS = 340;
// ⚠️ BOARD CLOCK, LIKE THE PANES THEMSELVES. In the hit slowdown the glass flies
// apart slowly too, which is the whole point of having one clock for the board.
const HUD_H = 46;
// ⚠️ FETCHED ONCE AND NEVER WRITTEN. The palette is keyboard.js's; this is a
// cached read of it, not a second home for it. See game-draw.js's
// fingerPalette().
const FAN = fingerPalette();
// How long a refracted shot stays on screen. ⚠️ SHORTER THAN THE FASTEST
// PLAUSIBLE KEY INTERVAL AT 60 WPM (200ms), so a fast student sees a stream of
// separate shots rather than one smeared ribbon.
const SHOT_MS = 150;

/**
 * @param {HTMLElement} container
 * @param {object} opts
 *   ⚠️ SPELLED OUT, NOT "SAME AS game-deadline". game-escape.js v1.0.0 claimed
 *   the contracts matched, they did not, and that false claim is how a missing
 *   `onSecond` stayed invisible for twenty rounds. State what is accepted:
 *     config    {object}    the GameDirector config
 *     onEnd     {function}  (rep) once, when the run ends
 *     onTick    {function}  (rep) about once a second, for a live HUD
 *     onQuit    {function}  (rep) when the student quits from the chrome
 *     onSecond  {function}  () once per WHOLE GRADED SECOND — the seam
 *   ⚠️ NOT ACCEPTED, DELIBERATELY: `survival` and any assessed wiring (see the
 *   ruling above), plus `minutes`, `barHost` and the three side canvases, which
 *   are Deadline's console panels and have no counterpart in this HUD. A
 *   silently-ignored option is worse than an absent one.
 * @returns {{ destroy: function, report: function }}
 */
export function mount(container, opts) {
    const cfg = (opts && opts.config) || {};
    const onEnd = (opts && opts.onEnd) || function () {};
    const onTick = (opts && opts.onTick) || null;
    const onQuit = (opts && opts.onQuit) || function () {};
    const rand = cfg.rand || Math.random;

    // ⚠️⚠️ ONE TICK PER WHOLE GRADED SECOND, AND THE VIEW STAMPS NO DATE. The
    // host calls localDateStr() inside the callback, at the moment of the tick,
    // which is what makes a run through midnight split across two day documents
    // exactly as a lesson does. This file must never learn what a date is.
    const onSecond = (opts && opts.onSecond) || null;

    // ⚠️ THE PANELS, ALL OPTIONAL — tools/game-lab.html may pass none. Shatter's
    // right panel mirrors the other two games' consoles; ⭐ ITS "SHIELDS" ROW IS
    // THE SHIP'S LIVES, which is the same quantity under a different word, so it
    // reuses drawGauges() rather than growing a third console.
    const panelCanvas = (opts && opts.panelCanvas) || (opts && opts.radarCanvas) || null;
    const gaugeCanvas = (opts && opts.gaugeCanvas) || null;
    const panelCtx = panelCanvas ? panelCanvas.getContext('2d') : null;
    const gaugeCtx = gaugeCanvas ? gaugeCanvas.getContext('2d') : null;
    // ⚠️⚠️ A GETTER, NOT A VALUE — the banked totals are a Firestore read and a
    // view must not fetch. Same rule as the other two views.
    const getMinutes = (opts && opts.minutes) || null;

    // ⚠️ SAME TWO-CLOCK SPLIT AS ESCAPE KEY v2.0.0, AND FOR THE SAME REASON. The
    // graded clock stays wall-clock (game-shell.js's GameClock header explains
    // why an idle-aware WPM is a lie); the BANKED clock stops when the student
    // does, because a game left open on a desk is not practice.
    // ⚠️ learn.js's THREE SECONDS, not a new number.
    const IDLE_MS = 3000;
    let lastKeyAt = 0;
    let idleMs = 0;

    // ⚠️⚠️ A ONE-CHARACTER TARGET CANNOT SPLIT, so it is a Deadline word wearing
    // Shatter's costume: the student pays the doubled interval `costFactor`
    // bought and gets half the game. Filtered here rather than discovered on
    // screen. ⚠️ AND THE FILTER CANNOT EMPTY THE POOL — a host that somehow
    // supplies nothing splittable gets its own list back and a playable game,
    // rather than a director with no targets and a silent blank screen.
    const rawTargets = cfg.targets || [];
    const usable = rawTargets.filter(splittable);
    const baseCfg = Object.assign({}, cfg, {
        targets: usable.length ? usable : rawTargets,
        // ⚠️⚠️ THE FACTOR OF TWO. A student types `unusually` to break the rock
        // and then types `un`, `usual` and `ly` — the pieces spell the word, so
        // one target is 2N keystrokes. Priced at N it would demand 30 WPM of a
        // child on a 15 WPM gate. See game-shell.js v1.6.0; the arithmetic is
        // pinned in tests/shatter-board-test.mjs Part B.
        costFactor: SHATTER_COST_FACTOR,
        // ⚠️ ARCADE. There is no assessed Shatter — see the ruling in the header.
        endless: true,
    });

    /**
     * ⚠️⚠️ A FRESH DIRECTOR *AND* A FRESH CALIBRATOR, TOGETHER, ALWAYS.
     *
     * `baseCfg` is built once and reused by `restart()`. Putting the calibrator
     * in it would share ONE object across every run of the session, so the
     * second game would open already `confident` — carrying the first game's
     * median into a run the student may be playing tired, or handing the
     * keyboard to the next child in the rotation and pacing the game for the
     * previous one. ⭐ `TypingCalibrator` has a `reset()`, and it is deliberately
     * NOT used here: `restart()`'s own rule is fresh objects rather than reset
     * ones, because a reset is a second place that has to know every field.
     *
     * ⚠️ AND IT IS WHY `adaptive` WORKS AT ALL. game-shell.js v1.10.0 only
     * adapts when a calibrator is supplied — supplying one is this file saying
     * *I feed this*, which is the thing the director cannot check for itself.
     */
    function newDirector() {
        return new GameDirector(Object.assign({}, baseCfg, {
            calibrator: new TypingCalibrator({}),
        }));
    }

    let d = newDirector();
    // ⚠️ THE CABINET PICKS THE BOARD AND NOTHING ELSE CHANGES. `drift: true`
    // arrives from arcade.html via the game registry; every other line in this
    // file is identical for both games, which is the property to protect.
    const drift = !!(opts && opts.drift);
    const makeBoard = () => (drift ? new ShardsBoard({ rand }) : new ShatterBoard({ rand }));
    let board = makeBoard();
    let capsOn = false;
    let started = false;   // set by the countdown; spawns wait for it

    // ── DOM ─────────────────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;background:#04060e;';
    canvas.setAttribute('aria-label', 'Shatter typing game');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, cx = 0, cy = 0, ringR = 0;
    let stars = [];

    // ⚠️ THE FIELD SCALES TO THE CANVAS, like every other board in this repo.
    // The prototype hardcoded a 720×600 canvas and was cropped on a portrait
    // iPad and a stamp on a classroom projector.
    function layout() {
        const size = fitCanvas(canvas, ctx);
        W = size.w; H = size.h;
        cx = W / 2;
        cy = HUD_H + (H - HUD_H) / 2;
        ringR = Math.max(60, Math.min(W / 2, (H - HUD_H) / 2) - RING_MARGIN);
        stars = makeStars(W, H, Math.round(60 * motionScale()), rand);
        // ⚠️⚠️ THE BOARD IS TOLD WHAT A FIELD UNIT IS WORTH HERE, ON EVERY LAYOUT,
        // BECAUSE IT FOLLOWS THE WINDOW — Round 122. `toPixelRadius()` has an
        // OFFSET (field 0 is the prism's hull, not the centre) while a pane is
        // drawn at `paneRadius * ringR` with no offset, so the two are not in the
        // same units and a collision test comparing them is short by
        // `ringR / (ringR - SHIP_R)` — Jake's *"the hitbox now appears to be the
        // center dot."* ⭐ ONLY THIS FILE CAN KNOW THE FACTOR; see
        // shatter-shards.js's reachOf() for the arithmetic.
        // ⚠️ THE INSET IS THE GAP BETWEEN THE HULL AND THE PRISM ACTUALLY DRAWN
        // (drawPrism uses SHIP_R * 0.8), so the test lands on the triangle rather
        // than on the space around it — which is exactly what Jake asked for.
        if (board && board.setViewScale) {
            const k = Math.max(1, ringR - SHIP_R);
            board.setViewScale(ringR / k, (SHIP_R - SHIP_R * 0.8) / k);
        }
    }

    /**
     * Board space (r = 1 at the ring, 0 at the ship) → pixels.
     *
     * ⚠️ r = 0 IS THE SHIP'S HULL, NOT THE SHIP'S CENTRE. Mapping straight to the
     * centre piles every arriving rock on top of the sprite, so the last second
     * of a rock's life — the second the student most needs to read — is the one
     * second it is unreadable.
     */
    function px(rock) { return toPixels(board.place(rock)); }

    /**
     * Field coordinates → pixels. ⚠️⚠️ THE ONLY PLACE IN THIS FILE THAT KNOWS
     * HOW BIG THE FIELD IS, and since v1.4.0 the only place that does any
     * geometry at all — everything else asks `board.place()`.
     *
     * ⚠️ THE HULL OFFSET IS A DRAWING NUDGE AND LIVES HERE ON PURPOSE. Mapping
     * a field origin straight to the canvas centre piles every arriving pane on
     * top of the prism, so the last second of a pane's life — the second the
     * student most needs to read — is the one second it is unreadable. ⭐ It
     * applies to any board: "do not draw under the ship" is a fact about the
     * sprite, not about how the panes move.
     */
    /** A field magnitude → a pixel radius from the prism. The radial half of
     *  toPixels(), shared so the rings and the warp cannot disagree with the
     *  panes about how big the field is.
     *
     * ⚠️⚠️ ONLY THE INNER FIELD IS A CIRCLE. See `entryRadius()`: magnitudes past
     * ENTRY_M leave the ring and run to the canvas edge, which is a different
     * distance in every direction, so those cannot be drawn as a radius alone.
     * Everything that draws a RING — the tracery, the danger line — is inside
     * ENTRY_M and still gets its answer from here. */
    function toPixelRadius(m) {
        if (drift) return SHIP_R + Math.max(0, m) * (ringR - SHIP_R);
        const inner = Math.max(0, Math.min(ENTRY_M, m));
        return SHIP_R + (inner / ENTRY_M) * (ringR - SHIP_R);
    }

    /**
     * ⭐⭐ HOW FAR OFF THE CANVAS A PANE IS BORN, ALONG ITS OWN BEARING.
     *
     * Jake, 2026-09-13: *"They also don't spawn off screen, but in the circle
     * itself."* He is right, and it was one line: field magnitude 1 — the board's
     * SPAWN_R — mapped to `ringR`, which is a circle this file also DRAWS. Panes
     * popped into existence on a visible line.
     *
     * ⚠️⚠️ THE FIX IS A VIEW REMAP AND NOTHING ELSE. The board still spawns at
     * r = 1, still prices `dr` as 1/lifetime, and every clearability claim in
     * shatter-board-test.mjs holds byte for byte. ⭐ THE SEAM IS EXACTLY WHAT
     * MADE THIS CHEAP: `place()` answers in field coordinates and this file alone
     * decides how many pixels that is.
     *
     * ⚠️ AND IT IS PIECEWISE, WHICH IS THE PART THAT MATTERS. Stretching the
     * WHOLE field to the canvas corner would have left a pane invisible for over
     * half its life on a wide canvas — a word that appears with 40% of its time
     * already spent. Only the outer band (ENTRY_M → 1) runs to the edge, so a
     * pane is off-screen for about 14% of its journey — long enough to be seen
     * arriving, short enough that nothing is stolen from the student.
     * ⚠️ EVERYTHING FROM ENTRY_M INWARD IS PIXEL-FOR-PIXEL WHAT IT WAS.
     */
    function entryRadius(dx, dy) {
        const ax = Math.abs(dx), ay = Math.abs(dy);
        const tx = ax < 1e-6 ? Infinity : (dx > 0 ? (W - cx) : cx) / ax;
        const ty = ay < 1e-6 ? Infinity : (dy > 0 ? (H - cy) : (cy - HUD_H)) / ay;
        // ⚠️ THE CLEARANCE IS NOT DECORATION. A pane is drawn AROUND its centre,
        // so a centre exactly on the edge is a half-visible pane clinging to the
        // frame — which looks like a rendering fault, not like something
        // arriving. It has to be clear of the glass it is about to become.
        return Math.max(ringR + 1, Math.min(tx, ty) + PANE_CLEARANCE);
    }

    function toPixels(g) {
        const m = Math.hypot(g.x, g.y);
        // ⚠️⚠️ THE DIRECTION COMES FROM `g.dx/g.dy`, NOT FROM NORMALISING x,y.
        // At the origin — a pane at the moment of impact — x and y are both
        // zero and normalising loses the side it arrived from, putting every
        // arriving pane straight up. shatter-board-test.mjs Part H caught that
        // on its first run; see place()'s header.
        let rr = toPixelRadius(m);
        // ⚠️⚠️ THE RADIAL BOARD ONLY. On Shards a pane's magnitude is where it
        // WANDERED to, not how far through a journey it is: panes routinely sit
        // past 1 and sail back, and running that band to the canvas edge would
        // throw half of Shards' field off the screen. ⭐ Jake on Shards:
        // *"it's not nearly as slick as shards"* — the cabinet he is happy with
        // is the one this must not touch. The mapping there is the old linear
        // one, unchanged.
        if (!drift && m > ENTRY_M) {
            // ⚠️ THE OUTER BAND, AND IT IS ALLOWED TO RUN PAST 1: a warped pane
            // is shoved back out toward the ring and may leave the field
            // entirely for a moment, which is what a warp should look like.
            const t = (m - ENTRY_M) / (1 - ENTRY_M);
            rr = ringR + t * (entryRadius(g.dx, g.dy) - ringR);
        }
        return { x: cx + g.dx * rr, y: cy + g.dy * rr };
    }

    /**
     * Attach the view-only art fields a pane needs. ⚠️ EVERY TARGET GETS THESE,
     * INCLUDING PIECES — a piece with no cut draws as a perfect rectangle and
     * instantly reads as a different kind of object from the pane it came from.
     * ⚠️ It is view state living on a board object, a deliberate exception: the
     * alternative is a parallel Map keyed by rock that has to be pruned in three
     * places, and Round 82's ease-Map already showed what that costs.
     *
     * ⚠️⚠️ `colors` IS ONE ENTRY PER LETTER AND IS BUILT HERE, ONCE. Deriving it
     * inside the draw loop would call the finger lookup for every letter of
     * every pane every frame, and — worse — would be a second place that decides
     * what colour a letter is. The pane, the shot and the shards all read this
     * array, which is what makes them agree.
     */
    function decorate(rock) {
        if (!rock || rock.cut) return rock;
        rock.cut = paneCut(rand, rock.text.length);
        // ⚠️ THE TUMBLE ANSWERS TO THE REDUCED-MOTION SETTING like everything
        // else in this file. ⭐ SCALED, NOT DISABLED: a plate turning slowly is
        // still the Superman II picture, and freezing every pane flat would
        // make a reduced-motion student's game look like a different game.
        // game-draw.js's motionScale() returns 0.25, never 0.
        rock.cut.tumbleRate *= motionScale();
        rock.cut.rollRate *= motionScale();
        rock.colors = Array.from(rock.text, ch => fingerColorOf(ch, '#9fb6d8'));
        return rock;
    }

    // ── view-only state ─────────────────────────────────────────────────────
    // ⚠️ EVERYTHING HERE IS COSMETIC. Board truth lives on `board`; game truth
    // lives on `d`. Nothing below is read to decide an outcome.
    let particles = [];
    let banner = null;
    let flash = 0;
    // ⚠️ THE SHOTS ARE PURELY DECORATIVE AND CARRY NO HIT TEST. The board already
    // decided the key landed before one of these exists; a beam that could
    // "miss" would be a second adjudicator of a keystroke, which is the one
    // thing this file is not allowed to grow.
    // Each: { x0, y0, x1, y1, color, t } with t counting 1 → 0.
    let shots = [];
    // 0..1. The prism whites out on a wrong key, which is the mirror of the
    // coloured shot it throws on a right one.
    let flare = 0;
    // ⚠️⚠️ THE SEVEN-SEGMENT COUNTDOWN, NOT game-chrome.js's DOM NUMERAL. Jake,
    // 2026-09-11: *"the countdown at the beginning of shatter is not the digital
    // countdown of deadline, and I think that's a consistency thing that should
    // be across games."* ⭐ IT IS THE SAME SHAPE AS EVERY OTHER DEFECT THIS
    // PROJECT KEEPS FINDING: game-chrome.js has offered `onCountdown` since
    // Round 99 and Deadline is the only view that ever took it up, so two of the
    // three cabinets have been counting down in a different typeface from the
    // one they then play in. ⚠️ Escape Key still does — see HANDOFF.
    let countdown = null;
    // The dispersion shockwave a warp throws. 0..1, or null.
    let warpRing = null;
    // ⚠️ VIEW-ONLY, LIKE EVERYTHING ELSE IN THIS SECTION. `pingWave` is the
    // expanding circle; `pingLabels` is id → board-clock deadline. The board has
    // never heard of either, and a label is not a second copy of a pane: it is
    // drawn from `board.place()` every frame, so it follows its pane around the
    // rim and vanishes with it.
    let pingWave = null;
    let pingLabels = new Map();
    let lastPingAt = -Infinity;
    // ⚠️⚠️ WHERE THE PRISM WAS LAST POINTING. Jake, 2026-09-11: *"the prism ship
    // points up on mistakes, which is jarring when your target is below you.
    // Maybe wrong colors just fizzle at the tip?"*
    //
    // ⭐ THE CAUSE IS A BOARD RULE THE VIEW WAS READING TOO LITERALLY. A wrong
    // key drops the lock (shatter-board.js `if (!next) { this.locked = null }`),
    // which is correct — the student is no longer typing that word. But the view
    // treated "no lock" as "nothing to aim at" and snapped to its rest pose,
    // which on a radial field is a 180° flick at the exact moment the student is
    // already off balance.
    //
    // ⚠️ AIM IS NOT THE SAME QUESTION AS LOCK. It only points up before the FIRST
    // lock of a run, when there genuinely is nowhere to point. After that it
    // holds the last bearing, and the miss is told by the prism flaring white and
    // throwing no ray — which is exactly Jake's "fizzle at the tip" and was
    // already built; it was just being drowned out by the flick.
    let lastAim = null;
    // ⚠️⚠️ A SEPARATE CLOCK FOR THE BOARD, SO A HIT CAN SLOW TIME WITHOUT
    // SLOWING THE GRADE. Jake, 2026-09-11: *"when the ship gets hit, it should
    // shatter into all the colors. Ideally in slow motion."*
    //
    // ⭐ THE BOARD GETS `bNow`, THE DIRECTOR KEEPS WALL CLOCK. Every board call —
    // advance, tryKey, canWarp, warp — reads one clock and it is internally
    // consistent; the seconds a student banks come from the director and are
    // untouched. ⚠️ MIXING THEM WOULD BE THE RULE 11 SHAPE: a warp cooldown
    // measured on one clock and spent on another.
    // ⚠️ AND IT ONLY EVER RUNS SLOWER, NEVER FASTER. A board clock that could
    // outrun the wall clock would let a student bank time they did not type in.
    let bNow = 0;
    let slowMo = 0;   // 0..1, decaying; 1 is the instant of the hit
    let ended = false;
    let rafId = null, lastFrame = null, tickAcc = 0;
    // ⚠️ HIGH-WATER MARK, NOT AN ACCUMULATOR — see bankWholeSeconds().
    let secondsBanked = 0;

    // ── input ───────────────────────────────────────────────────────────────

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * ⚠️⚠️⚠️ THIS FUNCTION DID NOT EXIST. ROUND 122 SHIPPED TWO CALLS TO IT AND
     *        NO BODY, AND THE SCATTER HAS BEEN DEAD EVER SINCE.
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Jake, 2026-09-14: *"neither the space nor the enter key pushed the words
     * back. Ever. Didn't matter if I was between words or in the middle of
     * them. That just seems broken."*
     *
     * ⭐⭐ IT IS NOT A RULE THAT WAS TOO STRICT, IT IS A `ReferenceError`. Round
     * 122's header claims `tryScatter()` "now SAYS SO when the board refuses";
     * the two call sites landed and the body never did. Space threw before
     * `board.tryKey()` was reached, so a space at a word boundary did not even
     * arrive as a keystroke — ⚠️ AND THE THROW IS WHY NO AMOUNT OF TUNING
     * `canWarp()` WOULD EVER HAVE HELPED. Round 122 spent a whole round making
     * the warp conditions more permissive for a control that was never called.
     *
     * ⚠️⚠️ AND IT IS WHY JAKE'S "DIDN'T MATTER IF I WAS BETWEEN WORDS OR IN THE
     * MIDDLE OF THEM" IS THE DIAGNOSTIC. `canWarp()`'s half-typed and reflex
     * guards would have produced a control that worked SOMETIMES. A control
     * that works NEVER, under every condition the guards distinguish, is
     * upstream of the guards.
     *
     * ⭐ THE BOARD STILL DECIDES. All three conditions — charge, half-typed,
     * reflex grace — live in `shatter-board.js` and are tested there; this
     * asks and reports. A copy of any of them here would be the second home
     * the view/board split exists to prevent.
     *
     * ⚠️ A REFUSAL IS SPOKEN, NOT SILENT, which is the part of Round 122's
     * intent worth keeping: Jake read a correctly-refused scatter as a broken
     * one because nothing on screen said anything. ⚠️ AND IT IS NOT CHARGED AS
     * A MISTAKE — the student pressed the key the gauge told them to press.
     *
     * @param {boolean} deliberate  Enter. A key that cannot be mistaken for
     *        typing, so the board skips its intent guesses.
     * @returns {boolean} whether it fired — the callers use this to decide
     *        whether the keystroke has been spent.
     */
    function tryScatter(deliberate) {
        if (board.warp(bNow, deliberate)) {
            warpRing = { t: 1 };
            banner = { text: 'SCATTER', until: performance.now() + 700 };
            sfx.launch(0);
            return true;
        }
        // ⚠️ THE TWO REFUSALS READ DIFFERENTLY TO A STUDENT AND MUST SAY SO. "No
        // charge" is a thing they can fix by clearing panes; the others are the
        // board declining to guess that a space meant scatter, and telling them
        // to use Enter is an instruction they can act on immediately.
        banner = board.warps < 1
            ? { text: 'NO CHARGE', until: performance.now() + 900 }
            : { text: 'PRESS ENTER', until: performance.now() + 900 };
        return false;
    }

    function onKeyDown(e) {
        if (ended) return;
        // ⚠️ THE GET-READY AND PAUSE PANELS MUST NOT EAT KEYSTROKES INTO THE
        // DIRECTOR — a key charged then is a mistake the student never made.
        if (!started || (chrome && chrome.phase === 'paused')) return;
        // ⚠️ READ THE REAL OS STATE, EVERY KEYSTROKE. Matching is case-sensitive,
        // so Caps Lock makes every keystroke wrong and the student has no idea why.
        if (typeof e.getModifierState === 'function') capsOn = e.getModifierState('CapsLock');
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
        if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            board.release();
            return;
        }
        // ⭐⭐ ENTER PINGS. See PING_SWEEP_RATE above for why this is free.
        // ⚠️ IT MUST BE HANDLED **BEFORE** THE `e.key.length !== 1` GUARD BELOW,
        // which is what silently swallows every named key — and it is not a
        // keystroke: `keyResult()` is not called, because a ping is not an
        // attempt at a word and charging it as a mistake would teach a student
        // not to look.
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!started) return;
            // ═══════════════════════════════════════════════════════════════
            // ⚠️⚠️ ONE KEY, TWO BOARDS, AND THE SPLIT IS JAKE'S OBSERVATION.
            // ═══════════════════════════════════════════════════════════════
            //
            // 2026-09-14: *"It appears that enter is sending out the radar ping
            // in shatter, too, even though it doesn't actually do anything.
            // Maybe enter or space can be the scatter in shatter? Or just space.
            // Doesn't matter, as long as it works."*
            //
            // ⭐⭐ THE PING REALLY DOES NOTHING ON THE RADIAL BOARD, AND IT IS THE
            // PING'S OWN DESIGN RULE DOING IT. A label is drawn only for a pane
            // OUTSIDE the ring — that is the "no help in the late game" clause —
            // and since Round 121 a radial pane crosses the approach in 900ms and
            // spends the rest of its life inside. There is nothing out there to
            // label. ⚠️ A CONTROL THAT IS CORRECT AND USELESS IS STILL A CONTROL
            // A CHILD PRESSES AND LEARNS NOTHING FROM.
            //
            // ⭐ SO ENTER SCATTERS HERE AND PINGS THERE — one key, whatever that
            // board's help is. ⚠️ AND IT IS `deliberate`: Enter cannot be confused
            // with typing, so shatter-board.js's half-typed and reflex guards do
            // not apply. That is the whole of the *"works intermittently"* report.
            if (!drift) { tryScatter(true); return; }
            if (bNow - lastPingAt >= PING_COOLDOWN_MS) {
                lastPingAt = bNow;
                pingWave = { t: 1 };
                sfx.free();
            }
            return;
        }
        // ⚠️ ESCAPE IS DELIBERATELY NOT HANDLED HERE ANY MORE. It is
        // game-chrome.js's pause key, and one key doing two jobs is what made
        // this unusable. ⭐ ONE KEY, ONE JOB — and now that no view binds Escape,
        // that file's `stopPropagation()` has nothing left to arbitrate.

        if (e.key.length !== 1) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();

        const now = performance.now();
        lastKeyAt = now;

        // ⚠️⚠️ THE WARP IS TRIED BEFORE THE KEYSTROKE IS ACCOUNTED, AND ONLY THE
        // BOARD DECIDES WHETHER IT FIRES. All three of its conditions — meter
        // full, nothing half-typed, and past the reflex grace after a clear —
        // live in shatter-board.js and are tested there. A copy of any of them
        // here would be the second home this split exists to prevent.
        if (e.key === ' ' && tryScatter(false)) return;

        const wasPiece = board.locked && board.locked.parent != null;

        // ⚠️⚠️ WHERE EVERY PANE WAS *BEFORE* THE KEY, BY ID. The shot has to be
        // aimed at the pane the key landed on, and a cleared pane is gone from
        // `board.rocks` by the time tryKey() returns — so its position cannot be
        // read afterwards. ⭐ AND THIS IS BOOKKEEPING, NOT A RULE: it never
        // decides where the key goes, it only asks the board afterwards which
        // target stopped existing. Re-deriving the aim here — locked, or
        // nearest-matching, or the re-lock — would be a second copy of
        // shatter-board.js's dispatch, which is precisely the split this file's
        // header forbids.
        const before = new Map();
        for (const k of board.rocks) before.set(k.id, { p: px(k), colors: k.colors });

        const r = board.tryKey(e.key, bNow);

        // ⚠️⚠️ IGNORED IS NOT CORRECT AND NOT WRONG. A space at a word boundary
        // must reach the director as NEITHER. `keyResult(true)` here would let a
        // student inflate accuracy by tapping space — the exact hole Round 101's
        // `reject()` was written to close, reopened from the other side.
        if (r.ignored) return;

        // ⚠️ EVERY OTHER KEYSTROKE IS ACCOUNTED, INCLUDING A MISS. All three
        // prototypes dropped an unmatched key on the floor, so a masher held
        // 100% accuracy for a minute.
        d.keyResult(r.correct, now);

        if (!r.correct) {
            flash = Math.max(flash, 0.11);
            // ⚠️ THE PRISM WHITES OUT AND THROWS NOTHING. A wrong key producing a
            // beam in some colour would say the keystroke did something, and the
            // one thing a mistake must read as is *no light came out*.
            flare = 1;
            sfx.misfire();
            return;
        }

        // ── the shot ────────────────────────────────────────────────────────
        // ⭐ ONE CORRECT KEY, ONE REFRACTED RAY, IN THAT KEY'S FINGER COLOUR.
        // The ray, the panel it lights and the key on keyboard.js's map are the
        // same colour in three places, which is the entire argument for the
        // prism.
        // ⚠️⚠️ `landed.id` IS LOAD-BEARING NOW, NOT JUST DECORATION. Until v1.8.0
        // this block existed only to aim a cosmetic ray; it is also the only
        // place in this file that knows WHICH PANE A KEY ACTUALLY WENT TO, which
        // is exactly what the calibrator needs. ⭐ AND IT IS STILL DERIVED FROM
        // THE BOARD RATHER THAN RE-DECIDED HERE — re-deriving the aim (locked,
        // or nearest-matching, or the re-lock) would be a second copy of
        // shatter-board.js's dispatch, which this file's header forbids.
        let landed = null;
        if (r.cleared) {
            const live = new Set(board.rocks.map(k => k.id));
            for (const [id, snap] of before) {
                if (!live.has(id)) { landed = { id, p: snap.p, colors: snap.colors }; break; }
            }
        } else if (board.locked) {
            // ⚠️⚠️ `board.locked` AFTER tryKey(), AND THE RE-LOCK IS WHY THAT
            // MATTERS. When `unusually` breaks into `un | usual | ly` and the
            // student means `usual`, the board transfers the keystrokes and the
            // lock moves — so the pane this key landed on is NOT the pane that
            // was locked before the call. Reading the pre-key lock would credit
            // the burst to a pane the student abandoned.
            landed = { id: board.locked.id, p: px(board.locked), colors: board.locked.colors };
        }
        if (landed) {
            const a = Math.atan2(landed.p.y - cy, landed.p.x - cx);
            shots.push({
                x0: cx + Math.cos(a) * SHIP_R * 0.78,
                y0: cy + Math.sin(a) * SHIP_R * 0.78,
                x1: landed.p.x, y1: landed.p.y,
                color: fingerColorOf(e.key, '#cfe6ff'),
                t: 1,
            });
        }

        // ── the measurement ─────────────────────────────────────────────────
        // ⚠️⚠️ `now`, NOT `bNow`. The shatter slowdown runs the board at 22% of
        // real time; a child typing through it is typing in real seconds, and
        // charging their burst to the slowed clock would report them up to 4.5×
        // faster than they are. See the header.
        //
        // ⚠️ CORRECT KEYS ONLY, and we are past the `!r.correct` return above.
        // A mistyped key is accuracy, which netWPM() already owns; folding it in
        // here would make the pacing number FALL when a child is fast and
        // sloppy, which is not what "how fast can they type" means for spawning.
        //
        // ⚠️ ORDER: keyed() BEFORE finished(). The last character of a word is
        // both, and the calibrator discards any burst of fewer than two keys —
        // so skipping the final keyed() would throw away every three-letter
        // sample and silently bias the estimate toward long words.
        //
        // ⭐ NO PIECE FILTER HERE, ON PURPOSE. A piece was never `spawned()`, so
        // both calls are no-ops against an id the calibrator has never seen. The
        // ruling lives at one site — the spawn — and cannot drift out of step
        // with a second test written here.
        if (landed) {
            d.calibrator.keyed(landed.id, now);
            if (r.cleared) d.calibrator.finished(landed.id, now);
        }

        if (r.cleared) {
            // ⚠️⚠️ ONE SPAWNED TARGET, ONE RAMP STEP. Every piece is a real
            // `cleared()` — it is real typing and must reach clearedChars and the
            // score — but `RAMP_PER_TARGET` is priced per TARGET, and a Shatter
            // target becomes three or four rocks. Left unsaid, the arcade ramped
            // three times per spawn and a child typing at exactly the gate with
            // 100% accuracy lost every shield at 79 seconds, on their own
            // success. Found by simulation; invisible in review.
            d.cleared(r.cleared, now, { ramp: !wasPiece });
            sfx.clear();
            // ⭐ THE SHARDS ARE THE PANE'S OWN PANELS. A word typed with four
            // fingers blows apart in those four colours, so the debris is a
            // record of the keystrokes that produced it — which is a thing a
            // gold spark could never say.
            const at = landed ? landed.p : { x: cx, y: cy };
            const pal = (landed && landed.colors) || FAN;
            // ⚠️ A BREAK THROWS MORE GLASS AND THROWS IT FOR LONGER THAN A
            // CLEAN CLEAR, because the two events are not the same size: one
            // window became three, and the debris is the only thing on screen
            // that says a thing came apart rather than merely vanished. ⭐ The
            // count still answers to motionScale(); a reduced-motion student
            // gets the same picture with less of it.
            glassBurst(particles, at.x, at.y, pal,
                       Math.round((r.pieces.length ? 38 : 14) * motionScale()),
                       r.pieces.length ? 330 : 160, rand);
            if (r.pieces.length) {
                r.pieces.forEach(decorate);
                // ⭐⭐ THE PIECES LEAVE FROM WHERE THE WINDOW WAS. See
                // SPLIT_FLY_MS: the board has already put them at their fanned
                // positions and that stands — this stamps the point they should
                // be seen coming FROM, and `drawPanes()` walks them out of it
                // over a third of a second.
                // ⚠️ PIXELS, DELIBERATELY, AND IT IS THE ONLY WAY THIS STAYS OUT
                // OF THE BOARD. The alternative is storing a field offset, which
                // means knowing whether the field is polar — and this file has
                // not known that since v1.4.0 and must not learn it again.
                // ⚠️ NOT ON SHARDS. That board gives its pieces a real kick away
                // from the prism — its own header calls it the best thing about
                // the board — so a drawing decay on top would be a second
                // animation of one event, and the two would disagree.
                for (const piece of (drift ? [] : r.pieces)) {
                    piece.bornAt = bNow;
                    piece.bornX = at.x;
                    piece.bornY = at.y;
                }
                sfx.launch(0);
                banner = { text: 'SHATTERED', until: now + 700 };
            }
        }
    }

    function takeHit(rock, now) {
        // ⚠️⚠️ THE PANE THAT LANDED IS NOT A SAMPLE, AND FORGETTING IT IS THE
        // POINT. A half-typed word the student ran out of time on measures the
        // BOARD, not the child — `finished()` already refuses it, but the open
        // record would otherwise sit in the calibrator for the rest of the run
        // and, in the one case that matters, a pane the student had started and
        // abandoned could later be re-typed and charged a burst spanning the
        // abandonment. ⭐ Dropping it is also what keeps `_open` bounded over a
        // twenty-minute arcade session.
        // ⚠️ A no-op for a piece, which was never registered. See the header.
        d.calibrator.dropped(rock.id);
        const p = px(rock);
        // ⚠️ THE PANE BREAKS, AND IT BREAKS IN ITS OWN COLOURS WITH RED THROUGH
        // IT. An all-red burst would be the clearer damage signal and would also
        // be the ONLY event in this game that does not tell the student which
        // letters were involved — the pane that just landed on them is the one
        // they most need to recognise next time. ⭐ The red flash below carries
        // the damage; the shards carry the identification.
        glassBurst(particles, p.x, p.y, (rock.colors || []).concat('#ff3355'),
                   Math.round(34 * motionScale()), 260, rand);
        // ⭐⭐ THE PRISM COMES APART IN EVERY COLOUR IT EVER THREW. Jake:
        // *"when the ship gets hit, it should shatter into all the colors.
        // Ideally in slow motion."* ⚠️ THE WHOLE SPECTRUM, not the pane's
        // palette — the pane is one word and the prism is the thing that has
        // been refracting all eight fingers all game. It is the only moment in
        // Shatter where the entire finger map appears at once, which is what
        // makes a hit feel like something breaking rather than a counter
        // decrementing.
        // ⚠️ SLOW, WIDE AND NOT CAPPED BY motionScale()'s COUNT the way the pane
        // burst is: this happens at most three times in a run.
        // ⚠️⚠️ THE SHELL DECIDES WHETHER THAT WAS THE LAST SHIELD **AND WHETHER A
        // SHIELD WAS SPENT AT ALL** — game-shell.js v1.11.0, HIT_GRACE_MS. Four
        // panes expiring in the same second are one mistake, and the shell now
        // charges one. ⭐ THE VIEW HAS TO AGREE OR THE STUDENT IS LIED TO: the
        // full damage beat under a shield counter that did not move reads as a
        // bug, and playing it three times in two seconds is exactly the cascade
        // the grace exists to end.
        const charged = d.hit(now);
        if (charged) {
            // ⭐⭐ THE PRISM COMES APART IN EVERY COLOUR IT EVER THREW — the beat
            // that belongs to actually losing something.
            glassBurst(particles, cx, cy, FAN, Math.round(52 * motionScale()), 150, rand);
            // ⚠️ AND THE SLOW MOTION ANSWERS TO REDUCED MOTION, like everything
            // else here. Scaled rather than switched off — a student on that
            // setting still gets the beat, just less of it.
            slowMo = Math.max(slowMo, motionScale());
            flash = 0.4;
            flare = 1;
        } else {
            // ⚠️ SMALLER, AND IT SAYS SOMETHING DIFFERENT. The pane still broke
            // on the prism — that is why the burst above fired — but nothing was
            // spent, and a student who is being hit repeatedly needs to be able
            // to tell those two apart at a glance.
            flash = 0.14;
        }
        sfx.hit();
        if (d.over) { finish(now); return; }
        banner = { text: charged ? 'GLASS DOWN' : 'SHIELD HELD', until: now + 1200 };
    }

    function finish(now) {
        if (ended) return;
        // ⚠️⚠️ BEFORE `ended = true` AND BEFORE d.end(), AND THAT ORDER IS THE
        // WHOLE LESSON OF game-deadline.js v1.10.0. There the identical call sat
        // behind a guard three lines AFTER `ended = true` — permanently false —
        // and lived only in finish(), so nothing banked during play either.
        // ⭐ TWO DEFECTS IN ONE BLOCK, AND THE SECOND HID THE FIRST. d.end()
        // stops the graded clock, so a call below it loses the final second.
        bankWholeSeconds(now);
        ended = true;
        d.end(now);
        const rep = d.report(now);
        sfx.lose();
        // ⚠️ FORMATTED HERE, NOT COMPUTED HERE, and NO LETTER GRADE APPEARS.
        // run-grade.js owns that, and Shatter never asks it anything.
        if (chrome) {
            chrome.showResult({
                heading: 'PRISM DOWN',
                lines: [
                    `${rep.wpm} WPM  ·  ${rep.acc}% accurate  ·  ${rep.targetsCleared} panes`,
                    `Score ${rep.score}  ·  ${fmtClock(rep.seconds)} typing`,
                ],
                canRestart: true,
            });
        }
        onEnd(rep);
    }

    function fmtClock(sec) {
        const s = Math.max(0, Math.floor(sec));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }

    /**
     * ⚠️ A FRESH DIRECTOR AND A FRESH BOARD, NOT RESET ONES. "Play again" must
     * produce a run indistinguishable from a first run, and a reset() method
     * would be a second place that knows every field on both objects — which is
     * how a stale counter survives a restart and shows up as a student's second
     * game scoring impossibly high.
     */
    function restart() {
        // ⚠️ newDirector(), NOT `new GameDirector(baseCfg)`. The calibrator has
        // to be replaced in the same breath as the director or the replay is
        // paced for the run the student just lost. See newDirector().
        d = newDirector();
        board = makeBoard();
        // ⚠️ A REPLACED BOARD HAS NOT BEEN TOLD THE VIEW'S SCALE, and layout()
        // may not run again before the first pane arrives — a replay would be
        // played with the pre-Round-122 hit box. See layout().
        layout();
        particles = [];
        banner = null; flash = 0;
        // ⚠️ THE LIGHT GOES OUT TOO. A shot or a warp ring left over from the
        // previous run paints on the countdown of the next one, which reads as
        // the game firing at a pane that is not there.
        shots = []; flare = 0; warpRing = null; lastAim = null; countdown = null;
        pingWave = null; pingLabels = new Map(); lastPingAt = -Infinity;
        bNow = 0; slowMo = 0;
        ended = false; started = false; lastFrame = null; tickAcc = 0;
        idleMs = 0; lastKeyAt = 0;
        // ⚠️ OR THE REPLAY'S FIRST N SECONDS ARE SWALLOWED by the previous run's
        // high-water mark. A fresh director means a fresh clock at zero, so the
        // mark has to start at zero with it.
        secondsBanked = 0;
        layout();
        chrome.setPhase('ready');
    }

    // ── loop ────────────────────────────────────────────────────────────────
    function frame(ts) {
        rafId = requestAnimationFrame(frame);
        if (lastFrame == null) lastFrame = ts;
        // ⚠️ dt IS CLAMPED. A tab that was hidden hands back a delta of many
        // seconds, which would walk every rock onto the ship in one frame.
        const dt = Math.min(0.05, Math.max(0, (ts - lastFrame) / 1000));
        lastFrame = ts;
        const now = performance.now();

        const paused = chrome && chrome.phase === 'paused';
        if (!ended && started && !paused) {
            // ⚠️ THE BOARD IS ADVANCED WITH `now`, NOT WITH dt. It keeps its own
            // last-seen timestamp, so a clamped dt here cannot desynchronise the
            // rocks from the lifetimes the director issued them.
            for (const gone of board.advance(bNow)) {
                takeHit(gone, now);
                if (ended) break;
            }

            // ⚠️ ONE SPAWN TEST PER FRAME, AND THE ON-SCREEN COUNT INCLUDES
            // PIECES. That is deliberate: MIN_ON_SCREEN exists so a fast student
            // is never left waiting, and a student mid-way through a shattered
            // word is not waiting for anything.
            if (!ended && d.spawnDue(now, board.rocks.length)) {
                const t = d.nextTarget(now);
                // ⚠️⚠️ THE CUT IS FROZEN AT SPAWN AND CARRIED ON THE PANE.
                // Re-rolling the corners and the came leans each frame makes the
                // glass BOIL, which reads as a rendering fault rather than as a
                // window.
                if (t) {
                    const rock = decorate(board.spawn(t.text, t.lifetimeMs, bNow));
                    // ⚠️⚠️ `now`, NOT `bNow` — the line above takes the board
                    // clock and this one must not. See the header: acquisition
                    // is measured against the student's wall clock, and `bNow`
                    // runs at 22% during the shatter slowdown.
                    // ⚠️ AFTER the push, so `board.rocks.length` is the board the
                    // student is actually looking at, pieces included — that is
                    // what `onScreen` means to the calibrator.
                    // ⚠️ THE ONLY `spawned()` IN THIS FILE. Pieces are never
                    // registered; see the header for why that is a ruling.
                    d.calibrator.spawned(rock.id, rock.text.length, now,
                                         board.rocks.length);
                }
            }
        }

        if (!ended && started && !paused && d.clock.seconds(now) > 0
            && now - lastKeyAt > IDLE_MS) {
            idleMs += dt * 1000;
        }

        updateParticles(particles, dt);
        if (flash > 0) flash = Math.max(0, flash - dt);
        // ⚠️ THE LIGHT DECAYS ON dt, NOT ON A TIMESTAMP DIFFERENCE, so a paused
        // game does not come back with every shot already expired — and a
        // hidden tab cannot fast-forward it, because dt is clamped above.
        if (flare > 0) flare = Math.max(0, flare - dt * 4.5);
        // ⚠️ THE SLOWDOWN IS GENEROUS AND SHORT. Long enough to read the glass
        // coming apart, short enough that a student is not waiting to play.
        if (slowMo > 0) slowMo = Math.max(0, slowMo - dt * 1.15);
        const scale = 1 - 0.78 * slowMo;
        // ═══════════════════════════════════════════════════════════════════
        // ⚠️⚠️⚠️ THE BOARD CLOCK STOPS WHEN THE BOARD STOPS. IT DID NOT, AND IT
        // COST JAKE TWO OF THREE LIVES IN FIVE SECONDS.
        // ═══════════════════════════════════════════════════════════════════
        //
        // Measured, from a real run (`ttb-shards-1789246174158.csv`): paused for
        // **254 seconds**, and within 5 seconds of resuming the shields went
        // 3 → 1. Jake: *"some shards were ZOOMING across the screen, which seems
        // like a bug."*
        //
        // ⚠️⚠️ `dt` IS CLAMPED TO 50ms AND THAT IS NOT THE CLAMP THAT MATTERED.
        // The per-frame clamp stops ONE long frame from teleporting anything.
        // But this line ran on EVERY frame including paused ones, while
        // `board.advance(bNow)` above runs only when `!paused` — so `bNow` walked
        // forward through the whole pause and the board did not.
        // ⭐⭐ THE FIRST RESUMED FRAME THEN HANDED advance() A dt OF 254,000ms,
        // and `rock.x += rock.vx * dt` moved every pane a quarter of an hour's
        // worth of travel in one step. The collision test runs ONCE after that
        // jump, so panes either tunnelled straight through the prism or landed
        // on it — which is not a game, it is a coin toss thrown on the student's
        // behalf while they were not looking.
        //
        // ⚠️ THE TWO CLOCKS ARE NOT INTERCHANGEABLE AND THIS IS THE THIRD TIME
        // THAT HAS BITTEN: `now` is the student's wall clock (the calibrator's),
        // `bNow` is the board's. ⭐ THE BOARD'S CLOCK IS THE ONE THING THAT MUST
        // AGREE WITH WHAT IS ON SCREEN, and nothing is on screen while paused.
        if (!paused) bNow += dt * 1000 * scale;
        if (shots.length) {
            for (let i = shots.length - 1; i >= 0; i--) {
                shots[i].t -= dt * (1000 / SHOT_MS);
                if (shots[i].t <= 0) shots.splice(i, 1);
            }
        }
        if (warpRing) {
            warpRing.t -= dt * 1.6;
            if (warpRing.t <= 0) warpRing = null;
        }
        // ── the ping sweep ──────────────────────────────────────────────────
        // ⚠️⚠️ THE WAVE REVEALS A PANE WHEN IT REACHES IT, NOT WHEN IT IS FIRED.
        // A ping that labelled everything instantly would be a button that turns
        // the words on; the travel time is what makes it a sweep, and it is also
        // what makes a distant pane cost the student a moment's patience.
        if (pingWave) {
            pingWave.t -= dt * PING_SWEEP_RATE;
            const reach = (1 - pingWave.t) * PING_REACH;
            for (const rock of board.rocks) {
                const g = board.place(rock);
                if (Math.hypot(g.x, g.y) <= reach) {
                    pingLabels.set(rock.id, bNow + PING_LABEL_MS);
                }
            }
            if (pingWave.t <= 0) pingWave = null;
        }
        // ⚠️ EXPIRED LABELS ARE DROPPED HERE AND PANES THAT DIED ARE DROPPED IN
        // THE DRAW, where the live set is already in hand. Keeping this map
        // bounded matters over a twenty-minute session.
        if (pingLabels.size) {
            // ⚠️⚠️ A LABEL THE STUDENT IS ACTIVELY USING DOES NOT EXPIRE — Round
            // 124. The old comment on `drawPingLabels()` claimed a label that
            // expires mid-word "costs the student nothing they had". ⭐ IT COSTS
            // THEM THE WORD: they are locked into a pane they cannot see, and the
            // one key that would free them is Backspace, which reads as giving up.
            // ⚠️ Jake's pane takes fifteen seconds to drift into view and the
            // label lived 2.6 — so the help arrived and left before the pane did.
            for (const rock of board.rocks) {
                if (rock.typed > 0 && pingLabels.has(rock.id)) {
                    pingLabels.set(rock.id, Math.max(pingLabels.get(rock.id),
                                                     bNow + PING_LABEL_MS));
                }
            }
            for (const [id, until] of pingLabels) {
                if (bNow >= until) pingLabels.delete(id);
            }
        }
        // ⚠️ IN THE FRAME LOOP, NOT ONLY IN finish() — the host's daily total has
        // to move WHILE the student plays, because that is when they are looking
        // at it.
        bankWholeSeconds(now);
        drawPanels(d.report(now));
        if (onTick && !ended) {
            tickAcc += dt;
            if (tickAcc >= 1) { tickAcc = 0; onTick(d.report(now)); }
        }
        draw(now, ts / 1000);
    }

    /**
     * Hand the host every whole graded second it has not been told about yet.
     *
     * ⚠️ IDEMPOTENT BY CONSTRUCTION — `secondsBanked` is a high-water mark, so
     * calling this twice in one frame, or once more at the top of finish(),
     * cannot double-count. That is what lets it sit in both places safely.
     *
     * ⚠️ DERIVED FROM d.clock.seconds(), NOT ACCUMULATED FROM dt. The graded
     * clock already encodes "not while paused, not before the first keystroke,
     * not after the end"; a separate accumulator would drift from the number the
     * result panel reports. ⚠️ NOTE frame()'s dt IS CLAMPED to 50ms — accumulating
     * from it would silently under-bank every hidden tab.
     *
     * ⚠️ A WHILE LOOP, NOT AN `if`: each whole second is a real second the host
     * must file separately, because it calls localDateStr() per tick so a run
     * through midnight splits across two documents.
     */
    function bankWholeSeconds(now) {
        if (!onSecond || !started) return;
        // ⚠️ IDLE SUBTRACTED FROM THE GRADED CLOCK, so this stays DERIVED and
        // keeps every property that made it safe. See Escape Key v2.0.0.
        const whole = Math.floor(d.clock.seconds(now) - idleMs / 1000);
        while (secondsBanked < whole) {
            secondsBanked++;
            try { onSecond(); } catch (_) { /* never let a host error stop play */ }
        }
    }

    /**
     * The two side panels. ⚠️ DRAWN FROM THE FRAME LOOP like the field — two
     * clocks over one game state is how a panel comes to disagree with the thing
     * it describes.
     */
    function drawPanels(rep) {
        if (panelCtx) {
            const size = fitCanvas(panelCanvas, panelCtx);
            drawShatterPanel(panelCtx, {
                W: size.w, H: size.h,
                // ⚠️ THE RADAR SEES EVERY ROCK, INCLUDING ONES STILL OUT PAST THE
                // RING — that is the *"you could see meteors coming before they
                // appear"* Jake asked for, and it is the only thing it adds.
                // ⚠️ FIELD COORDINATES NOW, NOT POLAR. The panel maps them; this
                // file no longer knows an angle from a radius.
                contacts: board.rocks.map(r => board.place(r)),
                warps: board.warps, maxWarps: MAX_WARPS, charge: board.charge,
                // ⚠️ THE PANEL IS TOLD WHAT THE KEYS DO; IT DOES NOT GUESS. It
                // has no idea which board it is describing and must not learn —
                // `drift` is this file's business. ⭐ The ping's readiness is read
                // from the same cooldown the key checks, so a dimmed label and a
                // refused press can never disagree.
                // ⚠️ THE TOP LINE NAMES A KEY ONLY WHERE THAT KEY DOES SOMETHING.
                // On the radial board Enter scatters, which the line below already
                // says, and a panel advertising a ping that draws nothing is the
                // defect Jake found by pressing it.
                pingLabel: drift ? 'ENTER \u2014 PING' : 'ROSE WINDOW',
                pingReady: drift ? (bNow - lastPingAt >= PING_COOLDOWN_MS) : false,
                spendLabel: drift ? 'SPACE \u2014 WARP' : 'SPACE / ENTER \u2014 SCATTER',
                spendReady: drift ? 'SPACE TO WARP' : 'SPACE OR ENTER',
            });
        }
        if (gaugeCtx) {
            const size = fitCanvas(gaugeCanvas, gaugeCtx);
            const m = getMinutes ? getMinutes() : null;
            drawGauges(gaugeCtx, {
                W: size.w, H: size.h,
                seconds: rep.seconds,
                // ⭐ THE SHIP'S LIVES. Same quantity as Deadline's shields under a
                // different word, so it reuses the console rather than growing a
                // third one.
                shieldsLeft: rep.shieldsLeft,
                // ⚠️ THE FIELD KEEPS game-shell.js's NAME; only the LABEL changes.
                livesLabel: 'LIVES',
                wpm: rep.wpm, acc: rep.acc,
                // ⭐⭐ THE COUNTDOWN RUNS IN THE READOUT AND THEN THE CLOCK TAKES
                // OVER — Round 122. Jake, 2026-09-14: *"Playing shatter, and the
                // run clock doesn't count down and then start counting like it
                // does in deadline. I'd like that in all of the games, please."*
                // ⚠️ ROUND 116 CHOSE THE OVERLAY NUMERAL HERE and said two
                // countdowns on screen would be worse than an inconsistent one.
                // That was the right worry and the wrong resolution: the answer is
                // ONE countdown, in the place Deadline puts it. The overlay is
                // suppressed below rather than left to race this.
                countdown,
                todayClock: m ? m.todayClock : null,
                weekClock: m ? m.weekClock : null,
            });
        }
    }

    // ── drawing ─────────────────────────────────────────────────────────────
    function draw(now, tSec) {
        ctx.clearRect(0, 0, W, H);
        drawNave(tSec);

        drawRings();
        drawPanes(tSec);
        drawPingWave();
        drawPingLabels();
        drawShots();
        drawPrismShip();
        drawWarpRing();
        drawParticles(ctx, particles);
        drawHud(d.report(now));

        // ⚠️ NO FULL-SCREEN RED FILL — photosensitivity. See game-draw.js.
        drawHitFeedback(ctx, W, H, flash);
        if (capsOn) drawCapsWarning(ctx, W, HUD_H + 8);
        // ⚠️ ONE SOURCE DISPLAYED ONCE. game-chrome.js owns the countdown clock
        // and hands the number over; this only paints it. A view that ran its
        // own timer here would be the second clock Round 95 had to delete.
        // ⚠️ NOT WHILE THE READOUT IS COUNTING — see the drawGauges() call. The
        // overlay survives only for a host with no gauge panel, which is the
        // fallback game-chrome.js already documents.
        if (!gaugeCtx) drawCountdownOverlay(ctx, W, H, countdown);

        if (banner && now < banner.until) {
            platedText(ctx, {
                x: cx, y: cy + ringR * 0.62, text: banner.text,
                font: 'bold 22px "Courier Prime", monospace',
                color: '#ffd700', bg: 'rgba(2,4,10,0.93)', border: '#334',
                padX: 20, padY: 12,
            });
        }
    }

    /**
     * The background: a dark nave with a light well behind the prism.
     *
     * ⚠️⚠️ THE STARFIELD WAS THE MOST ASTEROIDS-LOOKING THING LEFT ON SCREEN, and
     * the whole point of this round is that the game stops being Asteroids in a
     * costume. ⭐ THE SAME `stars` ARRAY IS KEPT AND REUSED AS MOTES OF DUST in
     * the light — one array, one makeStars() call, no second field of anything —
     * but it now sits under a radial glow centred on the prism, so what a
     * student sees is light falling through a dark room rather than space.
     */
    function drawNave(tSec) {
        ctx.fillStyle = '#04060e';
        ctx.fillRect(0, 0, W, H);
        const g = ctx.createRadialGradient(cx, cy, SHIP_R * 0.4, cx, cy, ringR * 1.15);
        g.addColorStop(0, 'rgba(96,132,205,0.20)');
        g.addColorStop(0.45, 'rgba(48,66,116,0.10)');
        g.addColorStop(1, 'rgba(4,6,14,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        drawStars(ctx, stars, tSec);
    }

    /**
     * The spawn ring and the danger ring.
     *
     * ⚠️ THE DANGER RING IS THE TUTORIAL AND IS UNCHANGED IN MEANING. The lock
     * rule is "nearest to impact", and a student cannot follow a rule they
     * cannot see. Drawing the radius at which a pane becomes urgent teaches the
     * rule without a paragraph of text, the same way Escape Key tints the
     * player's row and column. ⚠️ IT STAYS RED. The window dressing around it
     * changed; a danger signal that changed colour with the art would be the art
     * overruling the teaching.
     */
    function drawRings() {
        ctx.save();
        // The outer ring is tracery now: a lead circle with ribs, which is the
        // same circle the old one drew and reads as the frame of a window.
        ctx.strokeStyle = 'rgba(120,150,205,0.28)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * (ringR - 7), cy + Math.sin(a) * (ringR - 7));
            ctx.lineTo(cx + Math.cos(a) * (ringR + 4), cy + Math.sin(a) * (ringR + 4));
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(255,80,90,0.30)';
        ctx.setLineDash([5, 7]);
        ctx.beginPath();
        // ⚠️ DRAWN THROUGH toPixels() LIKE EVERYTHING ELSE, so the ring cannot
        // drift away from the threshold it is illustrating.
        ctx.arc(cx, cy, toPixelRadius(1 - DANGER_T), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function drawPanes(tSec) {
        // ⚠️ FARTHEST FIRST, so a near pane is never drawn under a far one. The
        // near pane is the one the prism is pointing at.
        // ⚠️ ONE place() PER PANE PER FRAME, CACHED. It is a pure read, but the
        // sort, the position and the threat all want it and a drift board's may
        // not be as cheap as this one's.
        const seen = board.rocks.map(rock => ({ rock, g: board.place(rock) }));
        // ⚠️ LEAST URGENT FIRST, so a pane about to land is never drawn under a
        // distant one. The near pane is the one the prism is pointing at.
        seen.sort((a, b) => a.g.threat - b.g.threat);
        const size = Math.max(14, Math.round(ringR * 0.07));
        for (const { rock, g } of seen) {
            decorate(rock);
            let p = toPixels(g);
            const near = g.threat >= DANGER_T;
            const isLocked = rock === board.locked;
            // ⭐ THE PANE IS SIZED TO ITS OWN WORD, because the word is drawn
            // across it. That is legitimate here in a way it was not on Escape
            // Key's grid: these are objects at different distances, so plainly
            // different sizes read as depth rather than as sloppy alignment.
            // ⚠️ A FLOOR, so a two-letter splinter is still a pane of glass and
            // not a chip.
            // ⚠️⚠️ THE SIZE RULE IS shatter-board.js's, NOT THIS FILE'S — Round
            // 117. Shards' hit test reads the SAME function in field units, so a
            // pane that looks like it covers the prism is a pane that does.
            // ⚠️ DO NOT INLINE THIS FORMULA BACK. It was a local here for four
            // rounds and that is precisely why glass could visibly pass over the
            // prism with nothing happening.
            let rr = paneRadius(rock.text, size);
            // ── the break, drawn ────────────────────────────────────────────
            // ⚠️⚠️ COSMETIC, AND THE BOARD NEVER SEES IT. See SPLIT_FLY_MS. The
            // piece's real position is `p` above and the lock rule, the hit test
            // and the arrival time all use it; for 340ms the VIEW draws it part
            // of the way there instead, starting from the point its parent broke.
            // ⭐ THAT IS THE WHOLE OF "THE PANES DON'T SHATTER": they were correct
            // and they were instantaneous, and nothing that arrives instantly
            // reads as something that came apart.
            // ⚠️ NO GLOW ON THE FLASH, ON PURPOSE. `drawPane`'s glow option sets
            // shadowBlur, which Round 116 found is ruinously slow in Safari — and
            // this is a 1-to-1 iPad programme. The beat is carried by the flight,
            // the growth and the debris, none of which cost anything.
            if (rock.bornAt != null) {
                const e = (bNow - rock.bornAt) / SPLIT_FLY_MS;
                if (e >= 1) {
                    rock.bornAt = null;
                } else {
                    // Ease-out cubic: fast off the break, settling into place.
                    const k = 1 - Math.pow(1 - Math.max(0, e), 3);
                    p = { x: rock.bornX + (p.x - rock.bornX) * k,
                          y: rock.bornY + (p.y - rock.bornY) * k };
                    // ⚠️ IT GROWS INTO ITSELF RATHER THAN SHRINKING OUT OF THE
                    // PARENT. A piece that started at the parent's size would
                    // have to shrink, and three shrinking copies of one window
                    // reads as a duplication bug, which is close to what Jake
                    // saw.
                    rr *= 0.62 + 0.38 * k;
                }
            }
            // ⚠️ THE RIM CARRIES STATE AND NOTHING ELSE DOES: red when it is
            // about to land, gold when locked, otherwise the colour of the
            // finger that types its next key — the same finger map keyboard.js
            // uses everywhere else in this app.
            const nextCh = rock.text[rock.typed] || rock.text[0];
            const rim = near ? '#ff5566'
                : isLocked ? '#ffd700'
                : fingerColorOf(nextCh, '#cfe6ff');
            drawPane(ctx, p.x, p.y, rr, rock.cut, {
                text: rock.text,
                typed: rock.typed,
                size,
                colors: rock.colors,
                locked: isLocked,
                // ⚠️ A PIECE IS A SPLINTER, A PARENT IS A WINDOW — a difference
                // of KIND rather than of degree. A slightly smaller window
                // would be exactly the "slightly off" that reads as a mistake.
                piece: rock.parent != null,
                base: rock.parent != null
                    ? 'rgba(16,11,28,0.82)' : 'rgba(6,10,20,0.86)',
                rim,
                lineWidth: isLocked ? 2.6 : 1.8,
                glow: near ? '#ff5566' : (isLocked ? '#ffd700' : null),
                // ⭐ IT CRAZES AS IT CLOSES. The danger ring says where the line
                // is; the crazing says this particular pane has crossed it, on
                // the pane itself, where the student's eyes already are.
                crack: near
                    ? Math.min(1, (g.threat - DANGER_T) / (1 - DANGER_T) + 0.25) : 0,
                tSec,
            });
        }
    }

    /** The refracted shots, oldest first so the newest is brightest on top. */
    function drawShots() {
        for (const s of shots) drawRefract(ctx, s.x0, s.y0, s.x1, s.y1, s.color, s.t);
    }

    /**
     * ⭐ THE PRISM POINTS AT WHAT THE STUDENT IS TYPING. It is the prototype's
     * best idea in this game and it is UNCHANGED: drawn confirmation that the
     * lock landed where they meant — which matters more here than anywhere,
     * because two split pieces can share a first letter.
     * ⚠️ WITH NO LOCK IT POINTS UP AND HOLDS STILL. A prism idly rotating is
     * telling the student about a target that does not exist.
     */
    function drawPrismShip() {
        if (board.locked && board.rocks.includes(board.locked)) {
            const p = px(board.locked);
            // ⚠️ REMEMBERED, so a miss does not throw the aim away — see below.
            lastAim = Math.atan2(p.y - cy, p.x - cx);
        }
        drawPrism(ctx, cx, cy, SHIP_R * 0.8, lastAim, { fan: FAN, flare });
    }

    /**
     * The ping's wave. ⚠️ ONE RING, NOT EIGHT — the scatter is the spectrum going
     * out and this must not be mistaken for it at a glance, because one of them
     * costs a charge and the other does not. ⭐ Same geometry, different signature.
     */
    function drawPingWave() {
        if (!pingWave) return;
        const k = 1 - pingWave.t;
        // ⚠️ THE RING IS ALLOWED OFF THE CANVAS, and that is the point: the panes
        // it is sweeping over are off the canvas. The drift branch of
        // `toPixelRadius()` does not clamp, so this runs past `ringR` on its own.
        const r = toPixelRadius(k * PING_REACH);
        if (r <= SHIP_R + 0.5) return;
        ctx.save();
        ctx.lineWidth = 2;
        ctx.globalAlpha = pingWave.t * 0.7;
        ctx.strokeStyle = '#00e5ff';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = pingWave.t * 0.25;
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }

    /**
     * ⭐⭐ THE WORD, AT THE POINT ON THE RING NEAREST ITS PANE.
     *
     * Jake: *"it shows the word on the point of the circle closest to the pane."*
     *
     * ⚠️⚠️ IT IS A LABEL AND NOT A TARGET. Typing it types the PANE — the board's
     * `aimFor()` has always matched on any pane's next character and knows
     * nothing about this. ⭐ THAT IS WHY IT IS SAFE: there is no second thing on
     * screen that can be typed, so there is nothing for the two to disagree
     * about, and a label that expires mid-word costs the student nothing they
     * had.
     * ⚠️ THE TYPED PREFIX IS SHOWN DIM, like the pane itself, or a student
     * halfway through a word would be reading a prompt that contradicts the
     * glass.
     */
    function drawPingLabels() {
        if (!pingLabels.size) return;
        const live = new Set();
        for (const rock of board.rocks) {
            const until = pingLabels.get(rock.id);
            if (until == null) continue;
            live.add(rock.id);
            const g = board.place(rock);
            const m = Math.hypot(g.x, g.y);
            // ⚠️ A PANE ALREADY INSIDE THE RING IS NOT LABELLED. Its own word is
            // drawn on it at that range, and two copies of one word a few pixels
            // apart is worse than none — this is the "no extra help in the late
            // game" clause, enforced rather than hoped for.
            // ⚠️⚠️ REVERTED IN ROUND 124, AND IT WAS MY OWN REGRESSION. I tightened
            // this to `m <= 1` on the drift board reasoning that magnitude 1 IS
            // the ring, so anything inside is already readable. ⭐⭐ PANES SPAWN AT
            // `SPAWN_R = 1` — so the guard skipped every freshly-arrived pane,
            // which is precisely the one the student is waiting to be told about.
            // ⚠️ THE ORIGINAL 0.72 OF `ENTRY_M` IS THE RULE ON BOTH BOARDS. A
            // redundant label on a pane the student can already read costs
            // nothing; a missing one on a pane they cannot costs the control.
            if (m <= ENTRY_M * 0.72) continue;
            const fade = Math.max(0, Math.min(1, (until - bNow) / 600));
            const x = cx + g.dx * (ringR - 14);
            const y = cy + g.dy * (ringR - 14);
            ctx.save();
            ctx.globalAlpha = fade;
            // ═══════════════════════════════════════════════════════════════
            // ⚠️⚠️⚠️ THE ARGUMENTS WERE POSITIONAL AND `platedText()` TAKES AN
            //        OPTIONS OBJECT. THIS LABEL HAS NEVER DRAWN. ROUND 124.
            // ═══════════════════════════════════════════════════════════════
            //
            // Jake, 2026-09-14: *"While the ping goes out further, it doesn't
            // tell me what the words are. That's the whole point."*
            //
            // ⭐⭐ `platedText(ctx, o)` READS `o.text` AND `o.x`. The old call
            // passed `(ctx, rock.text, x, y, {...})`, so `o` was a STRING: `o.text`
            // and `o.x` were both `undefined`, `px` computed to `NaN`, and
            // `roundRect()` drew nothing at all. ⚠️ SILENT SINCE ROUND 121 — the
            // ping shipped, was tuned twice, had its reach rewritten this round,
            // and the one thing it exists to do had never happened once.
            //
            // ⚠️⚠️ AND `tests/undefined-calls-test.mjs` COULD NOT HAVE CAUGHT IT.
            // Every identifier here resolves; the defect is the SHAPE of the
            // arguments. ⭐ A REFERENCE AUDIT IS NOT A SIGNATURE AUDIT, and this
            // file now contains two calls to one function in two different
            // shapes — see the `banner` call in drawShatter() for the correct one.
            //
            // ⚠️ THE DIM TYPED PREFIX IS DROPPED FOR NOW. `platedText()` paints
            // one colour and has no two-tone mode, and inventing one here would
            // put a second text renderer in this file. ⭐ THE WHOLE WORD IS THE
            // THING THE STUDENT ASKED FOR: they are reading it to START typing.
            platedText(ctx, {
                x, y, text: rock.text,
                font: `bold ${Math.max(13, Math.round(ringR * 0.065))}px `
                    + '"Courier Prime", monospace',
                color: '#bff7ff', bg: 'rgba(2,10,16,0.90)', border: '#00e5ff',
                borderWidth: 1, padX: 7, padY: 4,
            });
            ctx.restore();
        }
        // ⚠️ A PANE THAT DIED TAKES ITS LABEL WITH IT.
        for (const id of pingLabels.keys()) if (!live.has(id)) pingLabels.delete(id);
    }

    /**
     * The scatter: the prism firing in every direction at once.
     *
     * ⚠️ IT IS DRAWN FROM `warpRing` AND NOTHING ELSE. The board already spent
     * the warp and pushed the panes back; this is the picture of that having
     * happened, and it must never be a second place that decides whether it did.
     */
    function drawWarpRing() {
        if (!warpRing) return;
        const k = 1 - warpRing.t;                 // 0 at the prism, 1 at the ring
        ctx.save();
        ctx.lineWidth = 3;
        for (let i = 0; i < FAN.length; i++) {
            // ⭐ EIGHT RINGS, ONE PER FINGER, SLIGHTLY APART — the spectrum
            // spreading, which is what a prism does and what the warp costs:
            // eight cleared words' worth of colour going back out.
            const r = toPixelRadius((k - i * 0.035) * 1.05);
            if (r <= SHIP_R + 0.5) continue;
            ctx.globalAlpha = warpRing.t * 0.55;
            ctx.strokeStyle = FAN[i];
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
    }

    function drawHud(rep) {
        ctx.save();
        ctx.fillStyle = 'rgba(6,10,20,0.92)';
        ctx.fillRect(0, 0, W, HUD_H);
        ctx.strokeStyle = 'rgba(70,90,130,0.4)';
        ctx.beginPath(); ctx.moveTo(0, HUD_H + 0.5); ctx.lineTo(W, HUD_H + 0.5); ctx.stroke();

        ctx.font = 'bold 15px "Courier Prime", monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#9fb6d8';
        ctx.fillText(`${rep.wpm} WPM   ${rep.acc}%   ${fmtClock(rep.seconds)}`, 14, HUD_H / 2);

        // ⚠️ SHIELDS AS SHAPES, NOT AS A NUMBER. "Shields: 2" is a fact a child
        // has to read; three pips with one dark is a fact they can see while
        // their eyes are on a pane.
        ctx.textAlign = 'right';
        const pipR = 6, gap = 17;
        for (let i = 0; i < rep.shieldsLeft + rep.hits; i++) {
            ctx.beginPath();
            ctx.arc(W - 14 - i * gap, HUD_H / 2, pipR, 0, Math.PI * 2);
            ctx.fillStyle = i < rep.shieldsLeft ? '#00e5ff' : 'rgba(90,110,140,0.45)';
            ctx.fill();
        }

        // The warp meter. ⚠️ IT IS DRAWN FROM board.charge AND NOTHING ELSE —
        // a second progress calculation here could disagree with the rule that
        // actually gates the key.
        const bw = Math.min(180, Math.max(90, W * 0.22));
        const bx = cx - bw / 2;
        const full = board.warps > 0;
        roundRect(ctx, bx, HUD_H / 2 - 6, bw, 12, 6);
        ctx.fillStyle = 'rgba(12,20,34,0.95)'; ctx.fill();
        ctx.strokeStyle = 'rgba(70,90,130,0.6)'; ctx.lineWidth = 1; ctx.stroke();
        roundRect(ctx, bx + 1.5, HUD_H / 2 - 4.5, Math.max(0, (bw - 3) * board.charge), 9, 4.5);
        // ⭐ THE METER FILLS WITH THE SPECTRUM AND GOES GOLD WHEN IT IS READY.
        // The charge is light the prism has collected from cleared panes, so it
        // is drawn as light; gold is reserved for "you can spend this now",
        // which is the only state the student has to act on. ⚠️ THE GRADIENT IS
        // COSMETIC — the WIDTH is still board.charge and nothing else.
        if (full) {
            ctx.fillStyle = '#ffd700';
        } else {
            const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
            for (let i = 0; i < FAN.length; i++) {
                grad.addColorStop(i / (FAN.length - 1), FAN[i]);
            }
            ctx.fillStyle = grad;
        }
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.font = 'bold 11px "Courier Prime", monospace';
        ctx.fillStyle = full ? '#ffd700' : '#6f86a8';
        // ⚠️ THE HUD SHOWS THE COUNT WHEN THERE IS ONE. The left panel carries the
        // pips; this is the glance version for a student whose eyes are on the
        // field, and it must agree with the panel because both read `board`.
        ctx.fillText(full ? `WARP \u00d7${board.warps} \u2014 SPACE` : 'WARP',
                     cx, HUD_H / 2 + 17);
        ctx.restore();
    }

    // ── lifecycle ───────────────────────────────────────────────────────────
    //
    // ⚠️ THE HIDDEN-TAB PAUSE IS THE ONLY THING ALLOWED TO STOP THE CLOCK BESIDE
    // AN EXPLICIT PAUSE. Idle time inside a running game is charged — see
    // GameClock's header.
    function onVisibility() {
        const now = performance.now();
        if (document.hidden) d.pause(now);
        else { d.resume(now); lastFrame = null; }
    }
    function onResize() { layout(); }

    layout();

    const chrome = mountChrome(container, {
        // ⚠️⚠️ PASSED THROUGH, WHICH IT WAS NOT. Both views ACCEPTED `barHost` and
        // then never handed it to game-chrome.js, so the control bar fell back to
        // its floating overlay and landed on top of the keyboard — Jake:
        // *"The buttons should go to the right (and off the keyboard)."*
        // ⭐ THE OPTION EXISTED AT BOTH ENDS AND NOTHING CONNECTED THEM, which is
        // the same shape as Escape Key's dead per-second tick and the pool
        // provider the board ignored. ⚠️ WHEN A VIEW ACCEPTS AN OPTION, GREP FOR
        // WHERE IT IS USED BEFORE BELIEVING IT WORKS.
        barHost: (opts && opts.barHost) || null,
        title: 'Shatter',
        // ⚠️ IT SAYS PANE AND PRISM BECAUSE THE SCREEN DOES. A hint that still
        // said "rock" and "ship" would be describing the previous version of
        // this game to a child looking at this one.
        // ⚠️⚠️ EVERY KEY THIS HINT NAMES IS A KEY THIS VIEW HANDLES, AND THE
        // REVERSE IS NOW TRUE TOO. `abandon-lock-test.mjs` Part D exists because
        // four sentences once promised Escape to a child who was already stuck;
        // Round 121 added Enter, so it is named here and on the panel.
        // ═══════════════════════════════════════════════════════════════════
        // ⚠️⚠️⚠️ THE RADIAL HINT PROMISED A PING THAT BOARD DOES NOT HAVE.
        // ═══════════════════════════════════════════════════════════════════
        //
        // Read the Enter handler: `if (!drift) { tryScatter(true); return; }` —
        // it returns BEFORE the ping. ⭐ **PING IS DRIFT-ONLY. On Shatter, Enter
        // scatters.** The old copy told a child on the radial board to press
        // Enter for "a wave that writes each pane's word on the ring", and what
        // they got was a scatter or a refusal.
        //
        // ⚠️⚠️ AND THE COMMENT DIRECTLY ABOVE THIS ONE IS WHY IT SURVIVED. It
        // claims every key the hint names is a key this view handles "and the
        // reverse is now true too" — which is TRUE and INSUFFICIENT. This view
        // does handle Enter. It just does something else with it. ⭐ NAMING THE
        // RIGHT KEY IS NOT THE SAME AS DESCRIBING THE RIGHT EFFECT, and a test
        // that checks the key set cannot see the difference.
        //
        // ⚠️ EXPANDED ON JAKE'S STUDENT'S ACCOUNT, 2026-09-15: *"she admitted
        // that more description of all of them would have been helpful."* Each
        // hint now says what ends the run, not only what the keys do — a child
        // who does not know what they are protecting cannot prioritise.
        hint: drift
            ? 'Panes of glass drift across the field and wrap around the edges, '
              + 'the way rocks do in Asteroids \u2014 nothing lands on a timer, so a '
              + 'word you ignore comes back around. Type a pane to light it up '
              + 'and shatter it, and its pieces really do fly apart into more '
              + 'words. If a pane reaches your prism in the middle you lose a '
              + 'shield. Lose all three and the run is over.'
            : 'Each word is a pane of glass, one panel per letter, coloured for '
              + 'the finger that types it. Light up every panel and the pane '
              + 'shatters \u2014 into pieces, which you have to type too. Go for '
              + 'whatever is closest to your prism. If a pane reaches the prism '
              + 'you lose a shield. Lose all three and the run is over.',
        // ═══════════════════════════════════════════════════════════════════
        // ⚠️⚠️ THE KEYS LIVE HERE NOW, NOT IN THE PROSE \u2014 Round 126 (Fournier).
        // ═══════════════════════════════════════════════════════════════════
        //
        // ⭐ A KEY BURIED MID-PARAGRAPH IS A KEY A SIXTH-GRADER SKIMS PAST, which
        // is how Shatter's scatter went unused long enough for Jake to call it
        // broken before we found it really was. `game-chrome.js` renders these as
        // a grid the eye can run down.
        //
        // ⚠️⚠️ AND THE TWO BOARDS GET DIFFERENT ROWS BECAUSE THEY HAVE DIFFERENT
        // KEYS. Enter's handler reads `if (!drift) { tryScatter(true); return; }`
        // \u2014 it returns BEFORE the ping, so PING IS DRIFT-ONLY and on the radial
        // board Enter scatters. Round 125 fixed the sentence that got this wrong;
        // this is the same fact in a shape a child can scan.
        controls: drift
            ? [
                { keys: 'ENTER', what: 'Radar ping. A wave sweeps out to the far '
                    + 'edge of the field and writes the word of every pane it '
                    + 'finds around the ring \u2014 including ones still too far out '
                    + 'to see \u2014 so you can start typing a word before it '
                    + 'arrives. Free, and you can ping again about once a second.' },
                { keys: 'SPACE', what: 'Warp. Clearing panes charges the meter in '
                    + 'the corner; when it is full your prism jumps somewhere '
                    + 'quieter and leaves the crowd behind. Finish your word '
                    + 'first \u2014 mid-word it will wait.' },
                { keys: 'BACKSPACE', what: 'Let go of the word you are on and '
                    + 'wipe it clean, so you can chase a closer one.' },
              ]
            : [
                { keys: 'ENTER', what: 'Scatter. Clearing panes charges the meter '
                    + 'in the corner; when it is full, a scatter shoves every '
                    + 'pane on the board back out to the ring and buys you room. '
                    + 'Enter always works.' },
                { keys: 'SPACE', what: 'Scatter, but only between words \u2014 in the '
                    + 'middle of one the board cannot tell a scatter from a typo, '
                    + 'and it will tell you to press Enter instead.' },
                { keys: 'BACKSPACE', what: 'Let go of the word you are on and '
                    + 'wipe it clean, so you can start it again or pick another.' },
              ],
        muted: isMuted(),
        onStart() {
        // ⚠️⚠️ THE RUN CLOCK STARTS HERE, AT THE END OF THE COUNTDOWN, NOT ON THE
        // FIRST KEYSTROKE — Round 121 (Maskelyne). Jake, 2026-09-14: *"Deadline
        // counts down to the start of the game in the top right and then
        // immediately starts counting. Other games wait for the player to type.
        // They should all act like deadline."*
        // ⭐ THE OLD RULE WAS RIGHT ABOUT A DIFFERENT GAME. `startIfNeeded()` has
        // been called from `keyResult()` since the first prototype, so a student
        // who took eight seconds to read the screen was not charged for them —
        // fair when nothing was on screen until they acted. With a countdown, the
        // three seconds ARE the reading time, and a clock that sits at 0:00 while
        // panes are already falling reads as a broken clock.
        // ⚠️ IDLE TIME IS STILL SUBTRACTED from the banked seconds (see
        // bankWholeSeconds), so this cannot become a way to bank typing time by
        // walking away.
        d.clock.startIfNeeded(performance.now());
            started = true; lastFrame = null;
        },
        // ⚠️ SUPPLYING THIS SUPPRESSES game-chrome.js's OWN DOM NUMERAL, which
        // is the point — two countdowns on screen would be worse than the
        // inconsistent one. See `countdown` above.
        onCountdown(n) { countdown = n; },
        onPause(on) {
            const now = performance.now();
            // ⚠️ PAUSE STOPS THE GRADED CLOCK — the one deliberate exception
            // beside a hidden tab, because the student asked for it and there is
            // nothing to type at while the panel is up.
            if (on) d.pause(now); else { d.resume(now); lastFrame = null; }
        },
        onQuit() { onQuit(d.report(performance.now())); },
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
            board.destroy();
            particles = [];
        },
        report() { return d.report(performance.now()); },
        /**
         * ⚠️⚠️⚠️ DIAGNOSTICS AND HARNESSES ONLY. NOTHING MAY RENDER `calibration`.
         * RULE 11.
         *
         * The calibration WPM is not `netWPM()` — different window (one burst,
         * not a session), different denominator (characters of target text, not
         * keystrokes), different purpose (pacing, not assessment). Two numbers
         * called WPM that disagree is a thing this project has paid for twice,
         * and the second one always arrives as "it was already on the handle".
         * ⭐ THE STUDENT SEES A DIFFICULTY, NEVER A SPEED.
         *
         * ⚠️ IT EXISTS BECAUSE THE WIRING IS OTHERWISE UNOBSERVABLE, AND THAT IS
         * NOT A HYPOTHETICAL: Round 118 shipped an engine nothing called and all
         * 101 harnesses stayed green. The only defence against that repeating is
         * a test that can mount this view and ask whether the calibrator is
         * being fed — which means it must also be able to see what is on the
         * board, or it can only type blind and assert nothing.
         *
         * ⚠️ ONE ACCESSOR, NOT TWO. A second debug read is a second thing a page
         * could start depending on. `tests/adaptive-arcade-test.mjs` Part G goes
         * red if any file outside `tests/` calls this one.
         */
        debug() {
            return {
                calibration: d.calibrator ? d.calibrator.snapshot() : null,
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
                // ⚠️ THE CALIBRATOR'S OWN NUMBERS, NOT A SECOND COPY (Rule 9) —
                // read straight off `snapshot()` at the same instant as the
                // estimate they explain.
                samples: d.calibrator ? d.calibrator.samples.length : null,
                rejected: d.calibrator ? d.calibrator.rejected : null,
                shields: d.shields,
                // ⚠️ COPIES, NOT THE ROCKS. Handing out live board objects would
                // let a caller mutate the game, and a harness that can reach in
                // and set `typed` is testing something no student can do.
                panes: board.rocks.map(r => ({
                    id: r.id, text: r.text, typed: r.typed,
                    piece: r.parent != null,
                })),
            };
        },
    };
}
