// game-escape.js v2.2.0 — a FIFTH creature in the wave queue, paid for by the
//   collapse of the empty threat box beside it. Round 114 (Carriage).
//   ⚠️ THE ROW COUNT IS NO LONGER SPELLED IN TWO FILES — see drawWavePreview().
// game-escape.js v2.1.0 — ESCAPE KEY. Round 82 (Victor), 102, 104, 106, 108, 112.
//
// v2.1.0 — ⚠️⚠️ THE TOP BAR IS GONE AND THE BOARD TOOK ITS 54px. Every number it
//   showed — round, WPM, accuracy, lives — is already on the console to the right
//   or the panel to the left, in a different visual language, so the student had
//   to work out whether two readouts agreed. ⭐ TWO READOUTS FOR ONE STATE IS THE
//   SHAPE THIS PROJECT KEEPS FINDING. The Pac-Man lives were a third language
//   besides. ⚠️ DO NOT RE-ADD A HUD: if a number is missing it belongs in
//   drawGauges(), which all three games share.
// game-escape.js v2.0.0 — Round 108.
//
// ✅ 2.0.0 on Jake's sign-off — escape-board.js's rules rewrite is a 2.0.0 and
// this view moves with it.
//
// v2.0.0 — ⭐ THE SIDE PANELS AND THE KEYBOARD. Jake, 2026-09-09: a left panel
//   that *"previews what's coming, but not where"*, a right panel carrying lives,
//   time, speed, accuracy and the banked minutes, and a keyboard with Shift keys.
//   • ⚠️ EVERY PANEL IS ABSENT-SAFE, because learn.js mounts games with no side
//     canvases. ⚠️ tools/game-lab.html was the other such host and is GONE as of
//     Round 112 — the lab is arcade.html?lab=1, one instance, and it passes the
//     canvases exactly as a student's session does.
//   • ⚠️ THE KEYBOARD'S HEIGHT COMES OUT OF THE BOARD'S BUDGET BEFORE the cell
//     size is computed. Subtracting it afterwards sizes the cells to a canvas
//     that no longer exists and pushes the bottom row under the strip.
//   • ⭐ THE ERROR MEMORY REACHES THIS GAME AT LAST. Round 90 built it for
//     Deadline and it never crossed over: the key the student NEEDED is marked,
//     not the one they hit — marking the wrong key tells them where they went,
//     which they already know.
// game-escape.js v1.3.0 — Round 106.
//
// v1.3.0 — ⚠️⚠️ THE ART IS JAKE'S AGAIN. Jake, 2026-09-09: *"ALL THE ANIMATION I
//   STARTED WITH IS GONE... I can't share what you made with kids."* He is right,
//   and the diagnosis is specific: Rounds 82–105 rebuilt this game's RULES
//   correctly and quietly replaced its CHARACTERS with primitives. A frog in
//   reading glasses whose mouth opens while you type became a yellow arc; a kaiju
//   firing an atomic beam became a green triangle with two red squares.
//   ⭐ THE MECHANICS SURVIVED THE PORT AND THE GAME DID NOT.
//   ⚠️ THE ART WAS NEVER THE PART THAT NEEDED REWRITING — every defect those
//   rounds found was in the arithmetic. Replacing the sprites cost quality and
//   bought nothing; it happened because a rewrite treats everything it touches as
//   a draft. See game-sprites.js's header, and DO NOT DO IT AGAIN.
// game-escape.js v1.2.0 — Round 104.
//
// v1.2.0 — ⚠️⚠️ THE CELL FONT IS SIZED TO THE LONGEST WORD ON THE BOARD, and it
//   had to be before word-banks.js could be wired in at all. That file's own
//   header warns that an 8-letter word touches both edges of a cell at the old
//   fixed `cell*0.20`, and BANK_9 and BANK_10 exist — so the banks this round
//   connected would have overflowed their plates in later rounds.
//   ⚠️ SIZING EACH CELL TO ITS OWN WORD WAS REJECTED: thirty labels at thirty
//   slightly different sizes is Jake's standing pet peeve, where slightly-off
//   reads worse than plainly different. ONE size for the board is both fixes.
//   ⭐ AND THE WORDS THEMSELVES NOW COME FROM THE STUDENT'S LEVEL: the host may
//   pass `poolFor(round)` through to escape-board.js v1.1.0, so real library
//   words replace random letter groups the moment a level's keys can spell
//   enough of them. See arcade-pool.js.
// game-escape.js v1.1.0 — Round 102.
//
// v1.1.0 — ⚠️⚠️ THE PER-SECOND TICK DID NOT EXIST, SO NO HOST COULD EVER BANK A
//   MINUTE OF THIS GAME. game-names.js has carried `countsTime: true` for this
//   game since Round 82 (Jake: *"I'm leaning toward arcade for now, but time
//   typed should still count"*) and NEXT-STEPS.md §4e states it twice — but
//   mount() accepted no `onSecond`, so the registry was promising something
//   the view had no way to deliver. Added bankWholeSeconds(), mirroring
//   game-deadline.js v1.10.0 statement for statement: derived from
//   d.clock.seconds() rather than accumulated from dt, a high-water mark so it
//   is idempotent, called from the frame loop AND at the top of finish() ABOVE
//   `ended = true` and ABOVE d.end(), and reset by restart().
//   ⚠️ THE ORDER IS THE LESSON, NOT THE CODE. Deadline shipped this with the
//   call in finish() only, behind a guard three lines after `ended = true` —
//   two defects in one block, the second hiding the first, so moving the call
//   without fixing the guard would have looked like a fix and banked nothing.
//   ⚠️ ALSO FIXED: v1.0.0's mount() doc comment claimed *"same contract as
//   game-deadline"*. It was false — no onSecond, no minutes, no barHost, no
//   side canvases — and being false is how the missing tick stayed invisible.
//   The accepted options are now listed, and so are the refused ones.
//   ⚠️ STILL ARCADE-ONLY. This changes nothing about `assessed: false`; it only
//   makes the clock half of Jake's 4e ruling actually reachable.
//
// v1.0.0 — first version of this file that has ever left a container.
//
// ⚠️ The polish pass added: get-ready countdown, pause, quit, restart and
// mute via game-chrome.js; synthesised sound via game-audio.js; Caps Lock
// detection; and the full-screen red flash replaced with an edge vignette that
// degrades to a static border under prefers-reduced-motion. See those files'
// headers for why each one was a real defect rather than a nicety.
//
// ⚠️ v1.0.0 IS THE FIRST VERSION OF THIS FILE THAT HAS EVER LEFT A CONTAINER.
// It went through several internal drafts (an inline board, then the extraction
// into escape-board.js, then the polish pass) and briefly carried a 2.x stamp for
// the extraction. Jake's ruling, 2026-09-07: *"Nothing to this moment has had a
// version, so I'd rather it be 1.x. Gemini doesn't deserve to have version 1. It
// was version 0 at best."* ⚠️ HE IS RIGHT, AND THE PRINCIPLE IS THE USEFUL PART:
// **THE VERSION LOG RECORDS DEPLOYS, NOT DRAFTS.** A file that has never shipped
// has no history to record, and stamping my own iterations into it would put five
// entries in front of the next reader that describe nothing they can observe.
// The reasoning from those drafts is kept below as prose, because the reasoning
// is what has value — the numbers were never real.
//
// ⚠️ RENAMED FROM game-muncher.js / "Word Muncher", and the rename records a
// design change rather than a coat of paint. Jake, 2026-09-07: *"Silverfish the
// bugs are universally gross. I had a physical reaction."* — and, on the name
// that stuck: *"Escape Key is brilliant. That is now the name."*
//
// ⚠️⚠️ THE NAME IS ACCURATE IN A WAY "MUNCHER" WAS NOT. Once enemies spawn on the
// player's row or column, eating is incidental and not being cornered is the
// whole game. The words a student types ARE their escape keys.
//
// ⚠️⚠️ AND IT IS A THROUGHPUT GAME NOW, NOT A CADENCE GAME. Standing still used
// to be survivable, so typing bought mobility and a patient player could opt out
// of typing altogether — which made its WPM a patience measurement rather than a
// typing measurement. Jake's row/column spawn rule closed that, and
// tests/escape-board-test.mjs Part B proves it: a student who types NOTHING loses
// all three shields on 40 of 40 seeds, median at enemy step 20 — about a minute
// at a 15 WPM gate. A dodging player clears 102 moves against a 28-target
// mission. ⚠️ THAT TEST IS WHAT EARNS ESCAPE KEY A PLACE ON THE GRADED PATH.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE THREE-WAY SPLIT, AND WHY EACH PIECE IS WHERE IT IS
// ═══════════════════════════════════════════════════════════════════════════
//
//   game-shell.js    the numbers.  Timing, WPM, accuracy, quota, score, pressure.
//   escape-board.js  the rules.    Grid, enemies, spawning, keystroke matching.
//   game-escape.js   the pixels.   This file. Draws, animates, routes keys.
//
// ⚠️ THIS FILE OWNS NO NUMBERS AND NO RULES. It does not decide whether a
// keystroke was correct (the board says), nor what that keystroke is worth (the
// shell says), nor how fast enemies move (the shell says). If a `MOVE_SPEED`
// constant or an `if (word === typed)` ever appears in here, one of the two files
// above has grown a second copy — which is the defect the whole split exists to
// prevent, and the shape the original prototype had.
//
// ⚠️ THE DISPLAY TITLE LIVES IN game-names.js. Filenames and Firestore ids are
// frozen; titles are not.

import { GameDirector, enemyStepMs } from './game-shell.js';
import { EscapeBoard, COLS, ROWS } from './escape-board.js';
import { mountChrome } from './game-chrome.js';
import { sfx, isMuted, setMuted } from './game-audio.js';
import {
    fitCanvas, platedText, platedProgress, burst, updateParticles,
    drawParticles, roundRect, drawHitFeedback, drawCapsWarning, motionScale,
    drawKeyboardStrip, keyboardStripHeight, drawWavePreview, drawGauges,
} from './game-draw.js';
// ⚠️⚠️ THE CHARACTERS ARE JAKE'S, FROM HIS PROTOTYPE. Rounds 82–105 rebuilt this
// game's rules correctly and quietly replaced its ART with primitives — a frog in
// glasses became a yellow arc, a kaiju became a green triangle. See
// game-sprites.js's header. ⚠️ DO NOT REDRAW THESE WITH ctx PRIMITIVES AGAIN.
import {
    frogSprite, FROG_COLORS, ENEMY_SPRITES, ENEMY_PALETTES,
    drawPixelSprite, drawBeam, drawVaporised, drawWeb,
} from './game-sprites.js';

export const GAME_ESCAPE_VERSION = '2.2.0';

/**
 * @param {HTMLElement} container
 * @param {object} opts
 *   ⚠️ SPELLED OUT, NOT "SAME AS game-deadline". v1.0.0's comment claimed the
 *   contracts matched; they did not, and the claim is how the missing tick
 *   stayed invisible — a host reading it would reasonably assume `onSecond`
 *   worked here. State what this view accepts and nothing more:
 *     config    {object}    the GameDirector config (required in practice)
 *     onEnd     {function}  (rep) once, when the run ends
 *     onTick    {function}  (rep) about once a second, for a live HUD
 *     onQuit    {function}  () when the student quits from the chrome
 *     onSecond  {function}  () once per WHOLE GRADED SECOND — see its note
 *   ⚠️ NOT ACCEPTED, AND DELIBERATELY: `minutes` (Deadline's banked-minutes
 *   readout has no counterpart in this HUD), `survival`, `barHost`, and the
 *   three side canvases. Adding one means building the panel that shows it —
 *   a silently-ignored option is worse than an absent one.
 * @returns {{ destroy: function, report: function }}
 */
export function mount(container, opts) {
    const cfg = (opts && opts.config) || {};
    const onEnd = (opts && opts.onEnd) || function () {};
    const onTick = (opts && opts.onTick) || null;
    const rand = cfg.rand || Math.random;

    const onQuit = (opts && opts.onQuit) || function () {};

    // ⚠️⚠️ ONE TICK PER WHOLE GRADED SECOND, AND THE VIEW STAMPS NO DATE. The
    // host calls localDateStr() inside the callback, at the moment of the tick,
    // which is what makes a game running through midnight split across two
    // documents exactly as a lesson does. This file must never learn what a
    // date is.
    //
    // ⚠️ IT FOLLOWS THE GRADED CLOCK, NOT WALL TIME: no tick while paused, none
    // before the first keystroke, none after the run ends. `d.clock.seconds()`
    // already encodes all three, so the tick is derived from it rather than
    // from a second timer that could disagree with the number being reported.
    //
    // ⚠️⚠️ ADDED v1.1.0, AND ITS ABSENCE WAS A REAL DEFECT, NOT A MISSING
    // NICETY. game-names.js has recorded `countsTime: true` for this game since
    // Round 82 — Jake's ruling, *"I'm leaning toward arcade for now, but time
    // typed should still count"* — and this view had no way to emit a second,
    // so every minute a student spent in Escape Key was unbankable by any host.
    // The registry was promising something the view could not deliver.
    const onSecond = (opts && opts.onSecond) || null;

    // ⚠️⚠️ OPTIONAL, AND IT IS HOW word-banks.js REACHES THE BOARD. arcade-pool.js
    // builds one from the student's chosen level; `escape-board.js` calls it with
    // its own round so words lengthen as the run goes on. ⚠️ A HOST THAT PASSES
    // NOTHING GETS `cfg.targets` AND THE OLD BEHAVIOUR BYTE FOR BYTE.
    // ⚠️ IT IS PASSED THROUGH, NEVER CALLED HERE. A view that picked its own
    // words would be deciding difficulty, which is the one thing this file may
    // not do.
    const poolFor = (opts && opts.poolFor) || null;

    // ⚠️⚠️ THE SIDE PANELS, ALL OPTIONAL. Jake, 2026-09-09, asked for Deadline's
    // two flanks on this game: a left panel previewing what is coming and a right
    // panel carrying lives, time, speed, accuracy and the banked minutes.
    // ⚠️ EVERY ONE IS ABSENT-SAFE, because learn.js mounts games with no side
    // canvases at all. ⚠️ tools/game-lab.html was the other such host and is GONE
    // as of Round 112 — the lab is arcade.html?lab=1 now, one instance, and it
    // passes the canvases like any student would.
    const previewCanvas = (opts && opts.previewCanvas) || (opts && opts.radarCanvas) || null;
    const gaugeCanvas = (opts && opts.gaugeCanvas) || null;
    const previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;
    const gaugeCtx = gaugeCanvas ? gaugeCanvas.getContext('2d') : null;
    // ⚠️⚠️ A GETTER, NOT A VALUE. The daily and weekly totals live in daylog.js's
    // day documents — a Firestore read — and A VIEW MUST NOT FETCH: this file is
    // mounted by hosts with no auth at all. A getter keeps
    // the read where the page's own budget is accounted for, and lets a page that
    // cannot answer simply not pass one.
    const getMinutes = (opts && opts.minutes) || null;
    // ⚠️ THE KEYBOARD IS OPT-IN AND DEFAULTS **ON** where there is room for it.
    // keyboardStripHeight() returns 0 on a canvas too short to carry it, so the
    // board never loses half its height to a strip nobody can read.
    let keysOn = !(opts && opts.keys === false);

    let d = new GameDirector(cfg);
    let board = new EscapeBoard({ pool: cfg.targets || [], poolFor, rand });
    let capsOn = false;
    let started = false;   // set by the countdown; enemy steps wait for it

    // ── DOM ─────────────────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;background:#05070c;';
    canvas.setAttribute('aria-label', 'Escape Key typing game');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, cell = 0, offX = 0, offY = 0, kbH = 0;
    /** How long a blast stays on screen. ⚠️ SHORTER THAN AN ENEMY STEP, so two
     *  consecutive shots never overlap into one continuous beam. */
    const BLAST_MS = 280;

    // ⚠️ THE BOARD SCALES TO THE CANVAS. The prototype hardcoded 120 px cells on a
    // 720×600 canvas, so on a student iPad in portrait the board was cropped and
    // on a classroom projector it was a stamp in the corner.
    function layout() {
        const size = fitCanvas(canvas, ctx);
        W = size.w; H = size.h;
        // ⚠️ THE STRIP'S HEIGHT COMES OUT OF THE BOARD'S BUDGET BEFORE THE CELL
        // SIZE IS COMPUTED, not after. Subtracting it afterwards would size the
        // cells to a canvas that no longer exists and push the bottom row under
        // the keyboard — which is the class of bug Round 100 spent a round on.
        kbH = keyboardStripHeight(H, keysOn);
        cell = Math.floor(Math.min(W / COLS, (H - kbH - 12) / ROWS));
        offX = Math.round((W - cell * COLS) / 2);
        offY = Math.round((H - kbH - cell * ROWS) / 2);
    }

    // ── view-only state ─────────────────────────────────────────────────────
    // ⚠️ EVERYTHING HERE IS COSMETIC. Board truth lives on `board`; game truth
    // lives on `d`. Nothing below is read to decide an outcome.
    let particles = [];
    let banner = null;
    let flash = 0;
    let ended = false;
    let rafId = null, lastFrame = null, tickAcc = 0;
    let stepAccMs = 0;
    // ⚠️ HIGH-WATER MARK, NOT AN ACCUMULATOR — see bankWholeSeconds(). Reset by
    // restart(), or the replay's first N seconds are swallowed by the last run's
    // mark, which is the exact bug game-deadline.js v1.10.0 records.
    let secondsBanked = 0;
    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ TWO CLOCKS, AND CONFLATING THEM IS WHY THIS WAS WRONG
    // ═══════════════════════════════════════════════════════════════════════
    //
    // Jake, 2026-09-09: *"I've let the game run the whole time I've been typing
    // this, and it keeps counting time. Like library, it should only count when
    // I'm typing."* He is right about the BANKED clock and game-shell.js is right
    // about the GRADED one, and they are not the same number.
    //
    //   • THE GRADED CLOCK (`d.clock`) stays wall-clock, first keystroke to end.
    //     GameClock's header explains why and it is not negotiable: an
    //     idle-aware WPM divides characters by only the seconds spent typing
    //     them and reports 45 for a student producing 15 — a number that lands
    //     on the leaderboard and disagrees with every other surface in the app.
    //   • THE BANKED CLOCK — the seconds that reach the student's day and week —
    //     must stop when they stop, exactly as Library and learn.js do. A game
    //     left open on a desk is not practice.
    //
    // ⭐ SO THE IDLE GATE LIVES HERE, ON THE BANKING PATH ONLY, AND `d.report()`
    // IS UNTOUCHED. ⚠️ DO NOT "SIMPLIFY" THIS BY WIRING d.pause() TO THE IDLE
    // TIMER — that is the exact thing game-shell.js forbids, and it would silently
    // inflate every WPM this game reports.
    //
    // ⚠️ THREE SECONDS, AND IT IS learn.js's NUMBER (LEARN_IDLE_THRESHOLD), not a
    // new one. Two thresholds for "has this child stopped typing" would drift.
    const IDLE_MS = 3000;
    let lastKeyAt = 0;
    let idleMs = 0;
    // ⚠️⚠️ THE ERROR MEMORY. Round 90 built this for Deadline and it never reached
    // this game: a key the student gets wrong stays tinted red until they get it
    // right, so a child who keeps missing the same letter can SEE which one.
    // ⚠️ 'fixed' IS NOT ERASED. A key that stops shouting but stays marked is the
    // information they asked for; deleting it deletes the record.
    const keyStates = {};
    // ⚠️⚠️ THE BEAM IS AN EVENT, NOT A GUESS. v2.0.0 drew a beam from any kaiju
    // that happened to share the player's row or column, aimed AT THE PLAYER, and
    // it had nothing to do with the zap the board actually fired. Jake saw all
    // three symptoms at once: *"the kaiju zapped all the way to me... but it x'd
    // out the next square"*, *"zapped above and below, but with no beam"*, and
    // *"the beam only appeared when I was within a column, and it seemed to have
    // no effect beyond the visual."* ⭐ TWO SYSTEMS DESCRIBING ONE EVENT, NEITHER
    // READING THE OTHER — the view was animating a rule the board does not have.
    // ⚠️ NOW IT RENDERS `blast` EVENTS AND NOTHING ELSE: one square, in the
    // direction the board fired, landing exactly on the cell the board ashed.
    let blasts = [];
    // Per-enemy render position, eased toward the board's integer cell so a step
    // reads as a glide rather than a teleport.
    const ease = new Map();

    // ── input ───────────────────────────────────────────────────────────────
    function onKeyDown(e) {
        if (ended) return;
        // ⚠️ THE GET-READY AND PAUSE PANELS MUST NOT EAT KEYSTROKES INTO THE
        // DIRECTOR — a key charged then is a mistake the student never made.
        if (!started || (chrome && chrome.phase === 'paused')) return;
        // ⚠️ READ THE REAL OS STATE, EVERY KEYSTROKE. Matching is case-sensitive,
        // so Caps Lock makes every keystroke wrong and the student has no idea
        // why. See game-draw.js's drawCapsWarning header.
        if (typeof e.getModifierState === 'function') capsOn = e.getModifierState('CapsLock');
        if (e.key === 'Escape') { e.preventDefault(); board.clearTyped(); return; }
        if (e.key.length !== 1) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();

        const now = performance.now();
        lastKeyAt = now;
        const r = board.tryKey(e.key);

        // ⚠️ EVERY KEYSTROKE IS ACCOUNTED, INCLUDING A MISS. All three prototypes
        // dropped an unmatched key on the floor, so a masher held 100% accuracy.
        d.keyResult(r.correct, now);

        if (!r.correct) {
            // ⚠️ THE KEY THEY *NEEDED* IS MARKED, NOT THE ONE THEY HIT. Marking
            // the wrong key tells a student where they went, which they already
            // know; marking the right one tells them where they should have gone.
            const wanted = nextKeyWanted();
            if (wanted) keyStates[wanted.toLowerCase()] = 'miss';
            flash = Math.max(flash, 0.11);
            sfx.misfire();
            return;
        }
        {
            const hit = e.key.toLowerCase();
            if (keyStates[hit] === 'miss') keyStates[hit] = 'fixed';
        }
        if (r.kind === 'tear-free') {
            sfx.free();
            burst(particles, cx(board.player.x), cy(board.player.y), '#ffd700',
                  Math.round(20 * motionScale()), 200);
            banner = { text: 'FREE!', until: now + 900 };
            return;
        }
        if (r.kind === 'move') {
            d.cleared(r.word, now);
            sfx.clear();
            burst(particles, cx(r.to.x), cy(r.to.y), '#00e5ff',
                  Math.round(14 * motionScale()), 150);
            if (r.webbed) {
                sfx.web();
                banner = { text: 'WEBBED — TYPE TO TEAR FREE', until: now + 1600 };
            }
            if (board.caughtBy()) { takeHit(now); return; }
            if (!d.endless && d.quotaMet && !ended) finish(now, true);
        }
    }

    function takeHit(now) {
        burst(particles, cx(board.player.x), cy(board.player.y), '#ff3355',
              Math.round(34 * motionScale()), 260);
        flash = 0.4;
        sfx.hit();
        // ⚠️ THE SHELL DECIDES WHETHER THAT WAS THE LAST SHIELD, not this file.
        d.hit(now);
        if (d.over) { finish(now, false); return; }
        board.respawn();
        banner = { text: 'CAUGHT!', until: now + 1200 };
    }

    function finish(now, won) {
        if (ended) return;
        // ⚠️⚠️ BEFORE `ended = true` AND BEFORE d.end(), AND THAT ORDER IS THE
        // WHOLE LESSON OF game-deadline.js v1.10.0. There, the identical call
        // sat behind `if (onSecond && started && !ended)` three lines AFTER
        // `ended = true` — permanently false — and lived only in finish(), so
        // nothing banked during play either. ⭐ TWO DEFECTS IN ONE BLOCK, AND
        // THE SECOND HID THE FIRST: moving the call without fixing the guard
        // would have looked like a fix and banked nothing. d.end() stops the
        // graded clock, so a call below it loses the final partial second.
        bankWholeSeconds(now);
        ended = true;
        d.end(now);
        const rep = d.report(now);
        won ? sfx.win() : sfx.lose();
        // ⚠️ FORMATTED HERE, NOT COMPUTED HERE. No letter grade appears —
        // run-grade.js owns that.
        if (chrome) {
            chrome.showResult({
                heading: won ? 'ESCAPED' : 'CORNERED',
                lines: [
                    `${rep.wpm} WPM  ·  ${rep.acc}% accurate  ·  ${rep.targetsCleared} words`,
                    d.endless ? `Score ${rep.score}`
                              : `Needed ${rep.targetWPM} WPM and ${rep.minAccuracy}%`,
                ],
                canRestart: true,
            });
        }
        onEnd(rep);
    }

    /**
     * ⚠️ A FRESH DIRECTOR AND A FRESH BOARD, NOT RESET ONES. "Play again" must
     * produce a run indistinguishable from a first run, and a reset() method
     * would be a second place that knows every field on both objects — which is
     * how a stale counter survives a restart and shows up as a student's second
     * game scoring impossibly high.
     */
    function restart() {
        d = new GameDirector(cfg);
        board = new EscapeBoard({ pool: cfg.targets || [], poolFor, rand });
        particles = []; ease.clear();
        banner = null; flash = 0; stepAccMs = 0;
        ended = false; started = false; lastFrame = null; tickAcc = 0;
        blasts = [];
        idleMs = 0; lastKeyAt = 0;
        for (const k of Object.keys(keyStates)) delete keyStates[k];
        // ⚠️ OR THE REPLAY'S FIRST N SECONDS ARE SWALLOWED by the previous
        // run's high-water mark. A fresh director means a fresh clock starting
        // at zero, so the mark has to start at zero with it.
        secondsBanked = 0;
        layout();
        chrome.setPhase('ready');
    }

    // ── loop ────────────────────────────────────────────────────────────────
    //
    //
    // ⚠️ ONE BOARD STEP PER `enemyStepMs()`, READ FRESH EVERY STEP so the arcade
    // ramp tightens it mid-game. At a 15 WPM gate and 4-character groups that is
    // 3,200 ms. The prototype's 1,200 ms demanded 40 WPM just to keep pace with
    // an enemy, which was the entire unfairness and was invisible because every
    // other number in the file was fine.
    function stepMs() {
        return enemyStepMs(d.avgChars, d.targetWPM, d.pressure);
    }

    function frame(ts) {
        rafId = requestAnimationFrame(frame);
        if (lastFrame == null) lastFrame = ts;
        // ⚠️ dt IS CLAMPED. A tab that was hidden hands back a delta of many
        // seconds, which would run a dozen enemy steps in one frame.
        const dt = Math.min(0.05, Math.max(0, (ts - lastFrame) / 1000));
        lastFrame = ts;
        const now = performance.now();

        const paused = chrome && chrome.phase === 'paused';
        if (!ended && started && !paused) {
            stepAccMs += dt * 1000;
            let guard = 0;
            while (stepAccMs >= stepMs() && !ended && guard++ < 4) {
                stepAccMs -= stepMs();
                for (const ev of board.step(d.pressure)) {
                    if (ev.t === 'zap') {
                        burst(particles, cx(ev.x), cy(ev.y), '#ff7700',
                              Math.round(10 * motionScale()), 120);
                    } else if (ev.t === 'spawn' && ev.kind === 'hunter') {
                        sfx.hunter();
                        banner = { text: 'A HUNTER IS AWAKE', until: now + 1800 };
                    } else if (ev.t === 'enter') {
                        // ⭐ THE CREATURE COMMITS. Its own sound, because the peek
                        // and the entry are two different moments for the student
                        // and only one of them is a threat.
                        sfx.step();
                    } else if (ev.t === 'destroyed') {
                        sfx.win();
                        burst(particles, cx(ev.x), cy(ev.y), '#ffd700',
                              Math.round(26 * motionScale()), 220);
                        banner = { text: 'BOT DOWN', until: now + 1200 };
                    } else if (ev.t === 'blast') {
                        // ⚠️ THE TARGET CELL IS COMPUTED ONCE, HERE, from the
                        // same `dir` the board used — never re-derived at draw
                        // time from the player's position.
                        blasts.push({ x: ev.x, y: ev.y, ty: ev.y + ev.dir,
                                      dir: ev.dir, until: now + BLAST_MS });
                        sfx.hunter();
                    } else if (ev.t === 'leave') {
                        burst(particles, cx(ev.x), cy(ev.y), '#556',
                              Math.round(8 * motionScale()), 90);
                    } else if (ev.t === 'stuck') {
                        sfx.web();
                        banner = { text: 'HUNTER STUCK IN A WEB', until: now + 1400 };
                    } else if (ev.t === 'caught') takeHit(now);
                }
            }
        }

        // ⚠️ ACCUMULATED ONLY WHILE THE GRADED CLOCK IS ALSO RUNNING, or a
        // student who paused for a minute would have that minute counted as idle
        // AND already excluded by the pause — subtracted twice, and the banked
        // total would run backwards.
        if (!ended && started && !paused && d.clock.seconds(now) > 0
            && now - lastKeyAt > IDLE_MS) {
            idleMs += dt * 1000;
        }

        updateParticles(particles, dt);
        if (flash > 0) flash = Math.max(0, flash - dt);
        // ⚠️ IN THE FRAME LOOP, NOT ONLY IN finish() — the host's daily total
        // has to move WHILE the student plays, because that is when they are
        // looking at it. See bankWholeSeconds() and finish().
        // ⚠️ `now` IS THE FRAME'S OWN performance.now(), declared above, so this
        // reads identically to game-deadline.js's call and one assertion pins
        // both files.
        bankWholeSeconds(now);
        drawPanels(now, d.report(now));
        if (onTick && !ended) {
            tickAcc += dt;
            if (tickAcc >= 1) { tickAcc = 0; onTick(d.report(now)); }
        }
        draw(now, ts / 1000, dt);
    }

    /**
     * Hand the host every whole graded second it has not been told about yet.
     *
     * ⚠️ IDEMPOTENT BY CONSTRUCTION — `secondsBanked` is a high-water mark, so
     * calling this twice in one frame, or once more at the top of finish(), can
     * never double-count. That is what lets it sit in both places safely.
     *
     * ⚠️ DERIVED FROM d.clock.seconds(), NOT ACCUMULATED FROM dt. The graded
     * clock already encodes "not while paused, not before the first keystroke,
     * not after the end"; a separate accumulator would drift from the number
     * the result panel reports, and a student's banked minutes would disagree
     * with the run they just played. ⚠️ NOTE frame()'s `dt` IS CLAMPED to 50ms
     * for the enemy stepper — accumulating from it would silently under-bank
     * every hidden tab, which is precisely why this reads the clock instead.
     *
     * ⚠️ A WHILE LOOP, NOT AN `if`: a tab that was hidden hands back a delta of
     * many seconds, and each one is a real second the host must file
     * separately — it calls localDateStr() per tick so a run through midnight
     * splits across two documents.
     */
    function bankWholeSeconds(now) {
        if (!onSecond || !started) return;
        // ⚠️ IDLE SECONDS ARE SUBTRACTED FROM THE GRADED CLOCK RATHER THAN
        // COUNTED SEPARATELY, so this stays DERIVED from d.clock.seconds() and
        // keeps every property that made it safe: idempotent, pause-aware,
        // nothing before the first keystroke.
        // ⚠️ `idleMs` IS ACCUMULATED FROM A CLAMPED dt, so a hidden tab
        // UNDER-counts idle and the student banks slightly MORE than they
        // strictly typed. ⭐ THAT DIRECTION IS DELIBERATE: the clock already
        // pauses outright on a hidden tab, so the residue is small, and erring
        // toward the child is the right way to be wrong about minutes.
        const whole = Math.floor(d.clock.seconds(now) - idleMs / 1000);
        while (secondsBanked < whole) {
            secondsBanked++;
            try { onSecond(); } catch (_) { /* never let a host error stop play */ }
        }
    }

    /**
     * The character the keyboard should light.
     *
     * ⚠️ WHILE WEBBED IT IS THE TEAR-FREE WORD, NOT A NEIGHBOUR. A student
     * fighting out of a web who was shown a key belonging to a word they cannot
     * currently type would be given an instruction that does not work.
     * ⭐ WITH NOTHING AIMED AT, IT SHOWS A NEIGHBOUR'S FIRST LETTER rather than
     * going dark — a strip that stops teaching between words is a strip that is
     * dark most of the time, because between words is where a beginner lives.
     */
    function nextKeyWanted() {
        const p = board.player;
        if (p.webWord != null) return p.webWord[board.typed.length] || null;
        if (board.typed) {
            for (const c of board.adjacent(p.x, p.y)) {
                const w = board.grid[c.y][c.x];
                if (w && w.startsWith(board.typed)) return w[board.typed.length] || null;
            }
        }
        for (const c of board.adjacent(p.x, p.y)) {
            const w = board.grid[c.y][c.x];
            if (w) return w[0];
        }
        return null;
    }

    /**
     * The two side panels. ⚠️ DRAWN FROM THE FRAME LOOP LIKE THE BOARD, not on
     * their own timer — two clocks over one game state is how a panel comes to
     * disagree with the thing it is describing.
     */
    function drawPanels(now, rep) {
        if (previewCtx) {
            const size = fitCanvas(previewCanvas, previewCtx);
            drawWavePreview(previewCtx, {
                W: size.w, H: size.h,
                round: board.round,
                // ⚠️⚠️ FIVE, AND THE HEIGHT TO DRAW THEM ONLY EXISTS AS OF ROUND
                // 114. Jake, 2026-09-10: *"There's also dead space below the
                // incoming monsters row — add another monster or some other
                // information."* The dead space was #threat-canvas, a fixed 104px
                // box reserved for a panel only Deadline draws; arcade.html now
                // collapses it, and that height flows into this canvas's flex.
                // ⭐ SO THE FIFTH ROW IS PAID FOR BY THE FIX RATHER THAN TAKEN
                // FROM THE EXTRA-LIFE TIP, which is the one rule in the game a
                // student would never guess and must not be squeezed out.
                // ⚠️ drawWavePreview() RESERVES THE TIP'S HEIGHT BEFORE SIZING
                // ROWS and floors a row at 48px, so on a short window the tip
                // still wins and the fifth row is simply not drawn. Raising this
                // number does not risk the tip; see that function's header.
                waves: board.upcoming(5),
                // ⚠️ NULL WHEN THE NEXT WAVE WAITS ON A CLEAR BOARD RATHER THAN A
                // DISTANCE. A bar filling toward an event that is not on a timer
                // would be an animation telling a lie.
                progress: waveProgress(),
                // ⭐ THE ONE RULE THAT REWARDS APPROACHING SOMETHING.
                tip: true,
            });
        }
        if (gaugeCtx) {
            const size = fitCanvas(gaugeCanvas, gaugeCtx);
            const m = getMinutes ? getMinutes() : null;
            drawGauges(gaugeCtx, {
                W: size.w, H: size.h,
                seconds: rep.seconds,
                shieldsLeft: rep.shieldsLeft,
                // ⚠️ THE FIELD KEEPS game-shell.js's NAME; only the LABEL changes.
                livesLabel: 'LIVES',
                wpm: rep.wpm,
                acc: rep.acc,
                todayClock: m ? m.todayClock : null,
                weekClock: m ? m.weekClock : null,
            });
        }
    }

    /** 0..1 toward the next wave, or null when it is gated on an empty board. */
    function waveProgress() {
        const last = board._lastSpawned;
        const gap = board.enemies.length ? null : undefined;
        const g = board.round >= 1 ? (typeof board.upcoming(1)[0].gap === 'number'
            ? board.upcoming(1)[0].gap : null) : null;
        if (g == null || !last || !board.enemies.includes(last)) return null;
        return Math.max(0, Math.min(1, (last.stepsIn || 0) / g));
    }

    // ── drawing ─────────────────────────────────────────────────────────────
    function cx(x) { return offX + x * cell + cell / 2; }
    function cy(y) { return offY + y * cell + cell / 2; }

    function draw(now, tSec, dt) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#05070c';
        ctx.fillRect(0, 0, W, H);

        drawCells();
        drawBlasts(now);
        drawWebs();
        drawWords();
        drawEnemies(tSec, dt);
        drawPlayer();
        drawParticles(ctx, particles);

        // ⭐⭐ THE TEAR-FREE WORD SITS ON THE PLAYER, ON THE WEB, ON A WHITE
        // PLATE. Jake: *"When I got caught in a web, it was hard to tell what my
        // word was. It should appear on my square, on a white box, on a web, on
        // me. That way typing it literally frees me."*
        //
        // ⚠️⚠️ IT USED TO SIT ABOVE THE BOARD, at `offY - 16`, and that is not a
        // placement problem — it is a MEANING problem. A word floating over the
        // board is an instruction from the game; a word stamped on the web that
        // is holding you is the thing you are typing your way out of. The second
        // one needs no explaining, which is the entire point.
        //
        // ⚠️ DRAWN AFTER THE PLAYER AND THE PARTICLES, so nothing covers it. The
        // student cannot act on anything else while webbed, so it outranks
        // everything on the board.
        if (board.player.webWord != null) {
            const wx = cx(board.player.x), wy = cy(board.player.y);
            // The web that holds them, drawn on top of the frog rather than under
            // it — they are caught IN it.
            drawWeb(ctx, wx, wy, cell * 0.46);
            platedProgress(ctx, {
                x: wx, y: wy, text: board.player.webWord, typedLen: board.typed.length,
                font: `bold ${Math.max(13, Math.round(cell * 0.20))}px "Courier Prime", monospace`,
                // ⚠️ A WHITE PLATE, NOT THE DARK ONE EVERY OTHER LABEL USES. It is
                // the one moment the board has a single correct answer, and it
                // should not look like the thirty other words around it.
                bg: 'rgba(255,255,255,0.94)', border: '#ffd700', borderWidth: 3,
                typedColor: '#1a7f37', restColor: '#101418',
            });
        }

        // ⚠️ THE KEYBOARD IS DRAWN BEFORE THE FLASH AND THE BANNER, so neither
        // sits under it. It lights the character the student needs NEXT, which
        // comes from the word they are aiming at — or, when nothing is aimed at,
        // from the first letter of a neighbour, because a strip that goes dark
        // between words is a strip that stops teaching between words.
        if (kbH) {
            drawKeyboardStrip(ctx, {
                W, H, height: kbH,
                nextChar: nextKeyWanted(),
                keyStates,
            });
        }

        // ⚠️ NO FULL-SCREEN RED FILL — photosensitivity. See game-draw.js.
        drawHitFeedback(ctx, W, H, flash);
        if (capsOn) drawCapsWarning(ctx, W, offY - 44 > 40 ? offY - 44 : 44);

        if (banner && now < banner.until) {
            platedText(ctx, {
                x: W / 2, y: H * 0.5, text: banner.text,
                font: 'bold 26px "Courier Prime", monospace',
                color: ended ? '#ffd700' : '#ff8899',
                bg: 'rgba(2,4,10,0.93)', border: '#334', padX: 20, padY: 12,
            });
        }
    }

    function isAdj(x, y) {
        return Math.abs(x - board.player.x) + Math.abs(y - board.player.y) === 1;
    }

    function drawCells() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const px = offX + x * cell, py = offY + y * cell;
                const adj = isAdj(x, y);
                // ⚠️ THE PLAYER'S ROW AND COLUMN ARE TINTED. Enemies only ever
                // arrive along them, so the tint is the telegraph — it teaches the
                // spawn rule without a tutorial, and it is what makes "get out of
                // the lane" a readable decision rather than a surprise.
                const lane = x === board.player.x || y === board.player.y;
                ctx.save();
                roundRect(ctx, px + 3, py + 3, cell - 6, cell - 6, 8);
                ctx.fillStyle = board.zapped[y][x] > 0 ? 'rgba(60,26,14,0.55)'
                              : adj ? 'rgba(10,32,48,0.92)'
                              : lane ? 'rgba(26,16,34,0.85)'
                              : 'rgba(9,15,24,0.85)';
                ctx.fill();
                // ⚠️ THE PROTOTYPE'S PURPLE GRID, KEPT. Jake's board reads as an
                // arcade cabinet because the lines are bright and coloured; a
                // 20%-alpha slate outline reads as a spreadsheet.
                ctx.strokeStyle = board.zapped[y][x] > 0 ? 'rgba(255,120,40,0.45)'
                                : adj ? 'rgba(0,229,255,0.55)'
                                : lane ? 'rgba(163,44,196,0.75)'
                                : 'rgba(163,44,196,0.45)';
                ctx.lineWidth = adj ? 2.5 : 2;
                ctx.stroke();
                ctx.restore();
                // ⭐ A CELL WITH NO WORD IS DRAWN AS VAPORISED rather than left
                // blank. The prototype's X says "something was here and it is
                // gone", which is what actually happened; an empty cell says the
                // board failed to deal one.
                if (!board.grid[y][x] && !(x === board.player.x && y === board.player.y)) {
                    drawVaporised(ctx, cx(x), cy(y), cell);
                }
            }
        }
    }

    /**
     * ⚠️⚠️ ONE SQUARE, IN THE DIRECTION THE BOARD FIRED, ENDING ON THE CELL THE
     * BOARD ASHED. Jake: *"The beam should zap one square up or down, and the
     * result is the ash (and an x)."* The beam and the X are now two renderings
     * of ONE event, so they cannot point at different squares.
     */
    function drawBlasts(now) {
        blasts = blasts.filter(b => now < b.until);
        for (const b of blasts) {
            // ⚠️ IT STARTS AT THE KAIJU'S MOUTH AND STOPS AT THE CELL EDGE, not
            // at the next cell's centre — a beam that overshot into the square
            // beyond the one it ashed is exactly the mismatch this replaced.
            const jitter = Math.max(0, (b.until - now) / BLAST_MS);
            drawBeam(ctx, cx(b.x), cy(b.y), cx(b.x), cy(b.ty), jitter);
        }
    }

    function drawWebs() {
        for (const w of board.webs) drawWeb(ctx, cx(w.x), cy(w.y), cell * 0.42);
    }

    // ⚠️ Courier Prime's advance width, in ems. Used to fit a word to a cell
    // WITHOUT measuring 30 strings every frame.
    const MONO_ADVANCE = 0.6;
    // The plate's own horizontal padding (game-draw.js platedText/platedProgress)
    // plus a margin so two neighbouring plates never touch.
    const PLATE_PAD = 18 + 10;

    /**
     * ⚠️⚠️ ONE FONT SIZE FOR THE WHOLE BOARD, SET BY THE LONGEST WORD ON IT.
     *
     * word-banks.js says so in its own header: *"8-LETTER WORDS DO NOT FIT THE
     * DEFAULT CELL FONT... an 8-letter word touches both edges."* At `cell*0.20`
     * the board fits about 8.3 characters, and BANK_9 and BANK_10 exist, so the
     * banks this round wired in would have run off their plates in later rounds.
     *
     * ⚠️ THE OBVIOUS FIX — SIZE EACH CELL TO ITS OWN WORD — IS THE ONE JAKE HAS
     * ASKED ME NOT TO MAKE. It puts thirty labels at thirty slightly different
     * sizes on one board, and slightly-different reads worse than plainly
     * different. ⭐ Sizing the whole board to its longest word is both fixes at
     * once: nothing overflows, and every cell matches every other cell exactly.
     *
     * ⚠️ IT CHANGES ONLY WHEN THE ROUND'S WORD LENGTH DOES, not per frame, so the
     * board does not breathe while a student reads it.
     */
    function cellFont() {
        let longest = 0;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const w = board.grid[y][x];
                if (w && w.length > longest) longest = w.length;
            }
        }
        const base = cell * 0.20;
        const fitted = longest > 0
            ? (cell - PLATE_PAD) / (MONO_ADVANCE * longest)
            : base;
        return `bold ${Math.max(11, Math.round(Math.min(base, fitted)))}px "Courier Prime", monospace`;
    }

    function drawWords() {
        const font = cellFont();
        const typed = board.typed;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const w = board.grid[y][x];
                if (!w) continue;
                const adj = isAdj(x, y);
                const aiming = adj && typed && w.startsWith(typed) && board.player.webWord == null;
                // ⚠️ EVERY LABEL SITS ON A PLATE. Jake, 2026-09-07: *"STUCK was
                // always hard to read."* It was the same defect as the washed-out
                // grid words — bare fillText on a busy canvas.
                if (aiming) {
                    platedProgress(ctx, {
                        x: cx(x), y: cy(y), text: w, typedLen: typed.length,
                        font, border: '#ffd700', typedColor: '#ffd700', restColor: '#fff',
                    });
                } else {
                    platedText(ctx, {
                        x: cx(x), y: cy(y), text: w, font,
                        color: adj ? '#e8f6ff' : '#7d93a6',
                        border: adj ? 'rgba(0,229,255,0.35)' : null,
                    });
                }
            }
        }
    }

    /**
     * ⭐ THE FROG REACTS TO TYPING, AND THAT IS THE WHOLE POINT OF IT. Its mouth
     * opens while a word is half-typed and its pupils turn toward the neighbour
     * being aimed at — so the game confirms the student's intent BEFORE they
     * finish the word. ⚠️ BOTH ARE DERIVED FROM `board.typed` AND `board.aim`,
     * never from a timer: an idle chomp says the same thing whether the student
     * is working or staring at the screen.
     */
    function aimDirection() {
        const a = board.aim;
        if (!a) return null;
        if (a.y < board.player.y) return 'up';
        if (a.y > board.player.y) return 'down';
        if (a.x < board.player.x) return 'left';
        if (a.x > board.player.x) return 'right';
        return null;
    }

    function drawPlayer() {
        const webbed = board.player.webWord != null;
        const sprite = frogSprite(aimDirection(), board.typed.length > 0,
                                  board.player.facingLeft);
        ctx.save();
        // ⚠️ WEBBED IS A TINT ON THE WHOLE SPRITE, NOT A SECOND SPRITE. A separate
        // stuck-frog grid would be a second copy of the frog to keep in step.
        if (webbed) ctx.globalAlpha = 0.72;
        drawPixelSprite(ctx, sprite, FROG_COLORS,
                        cx(board.player.x), cy(board.player.y), cell * 0.78,
                        board.player.facingLeft);
        ctx.restore();
    }

    function drawEnemies(tSec, dt) {
        // Prune eased positions for enemies that no longer exist.
        for (const key of Array.from(ease.keys())) {
            if (!board.enemies.includes(key)) ease.delete(key);
        }
        for (const en of board.enemies) {
            const want = { x: cx(en.x), y: cy(en.y) };
            let pos = ease.get(en);
            if (!pos) { pos = { x: want.x, y: want.y }; ease.set(en, pos); }
            // ⚠️ EASING IS FRAMERATE-INDEPENDENT. `pos += (want - pos) * k` per
            // frame would glide at different speeds on 60 and 120 Hz; the
            // exponential form is the same curve in wall time either way.
            const k = 1 - Math.exp(-dt * 9);
            pos.x += (want.x - pos.x) * k;
            pos.y += (want.y - pos.y) * k;

            // ⚠️⚠️ EVERY ENEMY IS ITS PROTOTYPE SPRITE, NOT A PRIMITIVE. The
            // kaiju was a green triangle with two red squares here for twenty
            // rounds; it is a 24×24 pixel monster with a tail and glowing eyes,
            // and the difference is why Jake could not put this in front of
            // students. ⚠️ `ENEMY_SPRITES` IS KEYED BY THE SAME `kind` STRING
            // escape-board.js emits — an unknown kind draws nothing rather than
            // a placeholder, because a wrong creature is worse than a gap.
            const sprite = ENEMY_SPRITES[en.kind];
            if (!sprite) { ctx.restore(); continue; }
            ctx.save();
            // ⚠️ A STUNNED CREATURE IS FADED, NOT RECOLOURED. Recolouring a
            // palette entry would need a second palette per enemy per state.
            if (en.stunSteps > 0) ctx.globalAlpha = 0.45;
            // ⭐ THE KAIJU FIRES DOWN ITS LANE, and the beam is drawn BEFORE the
            // sprite so the creature sits on top of its own blast. Its head
            // tilts toward the shot, which is the prototype's touch.
            // ⚠️ THE HEAD TILT COMES FROM A REAL BLAST THIS CREATURE FIRED, and
            // the beam itself is drawn separately in drawBlasts() — over the
            // cells, under the sprites, so a kaiju sits on top of its own shot.
            const mine = blasts.find(b => b.x === en.x && b.y === en.y);
            // ⚠️ SCREEN ANGLE — see drawPixelSprite(). A kaiju drawn flipped no
            // longer needs its blast tilt inverted by hand.
            const tilt = mine ? (mine.dir < 0 ? -0.45 : 0.45) : 0;
            // ⭐⭐ THE PEEK IS NOW VISIBLE, WHICH IS THE ONLY REASON IT EXISTS.
            // Jake: *"The creatures also don't peak into the board when they
            // spawn, they just come in for another turn."* ⚠️ HE IS RIGHT AND IT
            // WAS A REAL FAILURE: escape-board.js has held a `peek` step since
            // Round 107, and the view drew the creature at its full position the
            // whole time — so the telegraph existed in the rules and NOWHERE ON
            // SCREEN. A warning nobody can see is a wasted turn, which is exactly
            // what he saw.
            //
            // ⭐ THE CREATURE IS PUSHED BACK OFF ITS OWN EDGE AND ONLY LEANS IN,
            // along the axis it will travel. Jake's own staging: *"Kaiju could
            // literally tilt his head in (as he already tilts to blast). Spider
            // could poke a quarter of his pixels into the board - enough to get
            // his glowing eyes."*
            let px = pos.x, py = pos.y, lean = tilt;
            if (en.peek > 0) {
                if (en.kind === 'kaiju') {
                    // ⚠️ 62% OUT, PLUS A TILT TOWARD THE BOARD. Enough that the
                    // head and the glowing eye clear the edge and nothing else.
                    px -= en.dir * cell * 0.62;
                    // ⚠️ ALWAYS POSITIVE — drawPixelSprite() now takes a SCREEN
                    // angle and undoes the mirror itself, so "lean into the
                    // board" is one number for both directions.
                    lean = 0.5;
                } else if (en.kind === 'spider') {
                    // ⚠️ 72% OUT — a quarter of the sprite showing, which for
                    // this grid is the head and the eyes and no legs.
                    py -= en.dir * cell * 0.72;
                } else {
                    // ⚠️ THE HUNTER IS NOT STAGED, IT IS ANNOUNCED. Jake: *"Robot
                    // gets an announcement, so it doesn't matter."* It has no
                    // entry axis to lean along — it arrives at a corner — so a
                    // lean would be a direction it is not about to move in.
                    px = pos.x; py = pos.y;
                }
                // ⚠️ FADED, SO A LEANING CREATURE NEVER READS AS ONE THAT HAS
                // ARRIVED. It cannot catch anything yet (caughtBy() skips it) and
                // it must not look like it can.
                ctx.globalAlpha *= 0.7;
            }
            drawPixelSprite(ctx, sprite, ENEMY_PALETTES[en.kind],
                            px, py, cell * 0.8,
                            en.dir === -1 || en.facingLeft, lean);
            if (en.peek > 0 && en.kind === 'hunter') {
                // The announcement, since the bot cannot stage itself.
                platedText(ctx, {
                    x: pos.x, y: pos.y - cell * 0.5, text: 'HUNTER INBOUND',
                    font: 'bold 11px "Courier Prime", monospace',
                    color: '#f1c40f', bg: 'rgba(2,4,10,0.94)', border: '#f1c40f',
                    padX: 8, padY: 5,
                });
            }
            ctx.restore();
        }
    }

    /**
     * ⚠️⚠️ THERE IS NO TOP BAR ANY MORE, AND THE BOARD GOT THE SPACE.
     *
     * Jake, 2026-09-10: *"Pacman life indicators make no sense. In fact, the whole
     * top bar is silly when you have the console on the right. Let's use that
     * space more effectively by expanding the board."*
     *
     * ⭐ HE IS RIGHT TWICE OVER. The bar showed ROUND, SCORE, WPM, ACCURACY and
     * lives — and the console on the right shows the run clock, LIVES, WPM and
     * accuracy, while the left panel shows the wave. **EVERY NUMBER WAS ON SCREEN
     * TWICE**, in two visual languages, and the student had to work out whether
     * they agreed. ⚠️ TWO READOUTS FOR ONE STATE IS THE SHAPE THIS PROJECT KEEPS
     * FINDING; here it was costing 46px off the top of a board that needed it.
     *
     * ⚠️ AND THE PAC-MAN LIVES WERE A THIRD LANGUAGE — yellow arcs that belong to
     * a different game entirely, next to a console that already counts LIVES in
     * words. ⚠️ DO NOT RE-ADD A HUD HERE. If a number is missing, it belongs in
     * drawGauges(), which every game on the page already shares.
     *
     * ⚠️ THE SCORE IS THE ONE THING THE CONSOLE DOES NOT CARRY, and it is not
     * lost: the result panel reports it at the end of the run, which is when it
     * means anything. A live score during play is a number nobody acts on.
     */
    const HUD_H = 0;


    function onVisibility() {
        const now = performance.now();
        if (document.hidden) d.pause(now);
        else { d.resume(now); lastFrame = null; stepAccMs = 0; }
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
        title: 'Escape Key',
        hint: 'Type a word next to you to move onto it. Your row and column are '
            + 'tinted — that is where creatures come from, so keep moving. '
            + 'Esc clears what you have typed.',
        muted: isMuted(),
        onStart() { started = true; lastFrame = null; stepAccMs = 0; },
        // ⚠️ THE BUTTON ONLY APPEARS BECAUSE THIS VIEW NOW OFFERS THE STRIP.
        // game-chrome.js omits it when onToggleKeys is absent, and a dead button
        // is worse than a missing one.
        keysOn,
        onToggleKeys() { keysOn = !keysOn; layout(); return keysOn; },
        onPause(on) {
            const now = performance.now();
            // ⚠️ PAUSE STOPS THE GRADED CLOCK — the one deliberate exception
            // beside a hidden tab, because the student asked for it and there is
            // nothing to type at while the panel is up.
            if (on) d.pause(now); else { d.resume(now); lastFrame = null; stepAccMs = 0; }
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
            particles = [];
            ease.clear();
        },
        report() { return d.report(performance.now()); },
    };
}
