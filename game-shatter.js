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
import { ShatterBoard, splittable, SHATTER_COST_FACTOR, paneRadius } from './shatter-board.js';
// ⭐ THE SECOND CABINET. Jake: *"build shard, please. I want kids to have that
// option."* ⚠️⚠️ ONE VIEW, TWO BOARDS — that is the whole reason Round 116 spent
// a version on the `place()` seam before writing a line of Shards. A second
// COPY of this file would be Rule 5 and every change to the glass would have to
// be made twice; a second BOARD is just a different answer to "where is this
// pane", which this file stopped asking directly in v1.4.0.
import { ShardsBoard } from './shatter-shards.js';
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

export const GAME_SHATTER_VERSION = '1.7.0';

// Cosmetic only. ⚠️ NOT A DIFFICULTY KNOB — the board owns travel, the shell owns
// pacing. These decide where a rock is DRAWN, never when it arrives.
const SHIP_R = 26;          // the prism's own radius in px
const RING_MARGIN = 30;     // gap between the spawn ring and the canvas edge
// ⚠️ A THREAT LEVEL, NOT A RADIUS, SINCE v1.4.0. The board decides what makes a
// pane urgent (this one derives it from range; a drift board would fold in
// closing speed); the view decides only how urgent is urgent enough to go red.
// ⭐ 0.78 IS THE OLD `r <= 0.22` EXACTLY, since this board's threat is 1 - r.
const DANGER_T = 0.78;
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

    let d = new GameDirector(baseCfg);
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
     *  panes about how big the field is. */
    function toPixelRadius(m) { return SHIP_R + Math.max(0, m) * (ringR - SHIP_R); }

    function toPixels(g) {
        const m = Math.hypot(g.x, g.y);
        // ⚠️⚠️ THE DIRECTION COMES FROM `g.dx/g.dy`, NOT FROM NORMALISING x,y.
        // At the origin — a pane at the moment of impact — x and y are both
        // zero and normalising loses the side it arrived from, putting every
        // arriving pane straight up. shatter-board-test.mjs Part H caught that
        // on its first run; see place()'s header.
        const rr = toPixelRadius(m);
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
    function onKeyDown(e) {
        if (ended) return;
        // ⚠️ THE GET-READY AND PAUSE PANELS MUST NOT EAT KEYSTROKES INTO THE
        // DIRECTOR — a key charged then is a mistake the student never made.
        if (!started || (chrome && chrome.phase === 'paused')) return;
        // ⚠️ READ THE REAL OS STATE, EVERY KEYSTROKE. Matching is case-sensitive,
        // so Caps Lock makes every keystroke wrong and the student has no idea why.
        if (typeof e.getModifierState === 'function') capsOn = e.getModifierState('CapsLock');
        if (e.key === 'Escape') { e.preventDefault(); board.locked = null; return; }
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
        if (e.key === ' ' && board.canWarp(bNow)) {
            board.warp(bNow);
            sfx.free();
            // ⭐ THE WARP IS THE PRISM FIRING IN EVERY DIRECTION AT ONCE, which
            // is the picture the mechanic was always drawing: the panes are
            // pushed back by light. ⚠️ It still destroys nothing — see the
            // WARP_PUSH note in shatter-board.js.
            warpRing = { t: 1 };
            glassBurst(particles, cx, cy, FAN, Math.round(30 * motionScale()), 260, rand);
            banner = { text: 'WARP', until: now + 900 };
            return;
        }

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
        let landed = null;
        if (r.cleared) {
            const live = new Set(board.rocks.map(k => k.id));
            for (const [id, snap] of before) {
                if (!live.has(id)) { landed = snap; break; }
            }
        } else if (board.locked) {
            landed = { p: px(board.locked), colors: board.locked.colors };
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
            glassBurst(particles, at.x, at.y, pal,
                       Math.round((r.pieces.length ? 26 : 14) * motionScale()),
                       r.pieces.length ? 210 : 160, rand);
            if (r.pieces.length) {
                r.pieces.forEach(decorate);
                sfx.launch(0);
                banner = { text: 'SHATTERED', until: now + 700 };
            }
        }
    }

    function takeHit(rock, now) {
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
        glassBurst(particles, cx, cy, FAN, Math.round(52 * motionScale()), 150, rand);
        // ⚠️ AND THE SLOW MOTION ANSWERS TO REDUCED MOTION, like everything else
        // here. Scaled rather than switched off — a student on that setting
        // still gets the beat, just less of it.
        slowMo = Math.max(slowMo, motionScale());
        flash = 0.4;
        flare = 1;
        sfx.hit();
        // ⚠️ THE SHELL DECIDES WHETHER THAT WAS THE LAST SHIELD, not this file.
        d.hit(now);
        if (d.over) { finish(now); return; }
        banner = { text: 'GLASS DOWN', until: now + 1200 };
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
        d = new GameDirector(baseCfg);
        board = makeBoard();
        particles = [];
        banner = null; flash = 0;
        // ⚠️ THE LIGHT GOES OUT TOO. A shot or a warp ring left over from the
        // previous run paints on the countdown of the next one, which reads as
        // the game firing at a pane that is not there.
        shots = []; flare = 0; warpRing = null; lastAim = null; countdown = null;
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
                if (t) decorate(board.spawn(t.text, t.lifetimeMs, bNow));
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
        bNow += dt * 1000 * scale;
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
        drawCountdownOverlay(ctx, W, H, countdown);

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
            const p = toPixels(g);
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
            const rr = paneRadius(rock.text, size);
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
     * The warp: the prism firing in every direction at once.
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
        hint: drift
            ? 'Panes of glass drift across the field and wrap around the edges '
              + 'the way they do in Asteroids \u2014 nothing lands on a timer, so a '
              + 'word you ignore comes back. Type one to light it up and shatter '
              + 'it, and its pieces really do fly apart. Clearing panes charges '
              + 'the WARP meter; Space shoves everything away from your prism. '
              + 'Esc lets go of the word you are on.'
            : 'Each word is a pane of glass, one panel per letter, coloured for '
            + 'the finger that types it. Light up every panel and the pane '
            + 'shatters — into its pieces, which you have to type too. Go for '
            + 'whatever is closest to your prism. Clearing panes charges the WARP '
            + 'meter; Space pushes everything back. Esc lets go of the word you '
            + 'are on.',
        muted: isMuted(),
        onStart() { started = true; lastFrame = null; },
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
    };
}
