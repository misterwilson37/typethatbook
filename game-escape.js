// game-escape.js v1.1.0 — ESCAPE KEY. Round 82 (Victor), Round 102.
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
} from './game-draw.js';

export const GAME_ESCAPE_VERSION = '1.1.0';

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

    let d = new GameDirector(cfg);
    let board = new EscapeBoard({ pool: cfg.targets || [], rand });
    let capsOn = false;
    let started = false;   // set by the countdown; enemy steps wait for it

    // ── DOM ─────────────────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;background:#05070c;';
    canvas.setAttribute('aria-label', 'Escape Key typing game');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, cell = 0, offX = 0, offY = 0;

    // ⚠️ THE BOARD SCALES TO THE CANVAS. The prototype hardcoded 120 px cells on a
    // 720×600 canvas, so on a student iPad in portrait the board was cropped and
    // on a classroom projector it was a stamp in the corner.
    function layout() {
        const size = fitCanvas(canvas, ctx);
        W = size.w; H = size.h;
        cell = Math.floor(Math.min(W / COLS, (H - 54) / ROWS));
        offX = Math.round((W - cell * COLS) / 2);
        offY = Math.round((H - 54 - cell * ROWS) / 2) + 46;
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
        const r = board.tryKey(e.key);

        // ⚠️ EVERY KEYSTROKE IS ACCOUNTED, INCLUDING A MISS. All three prototypes
        // dropped an unmatched key on the floor, so a masher held 100% accuracy.
        d.keyResult(r.correct, now);

        if (!r.correct) {
            flash = Math.max(flash, 0.11);
            sfx.misfire();
            return;
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
        board = new EscapeBoard({ pool: cfg.targets || [], rand });
        particles = []; ease.clear();
        banner = null; flash = 0; stepAccMs = 0;
        ended = false; started = false; lastFrame = null; tickAcc = 0;
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

        updateParticles(particles, dt);
        if (flash > 0) flash = Math.max(0, flash - dt);
        // ⚠️ IN THE FRAME LOOP, NOT ONLY IN finish() — the host's daily total
        // has to move WHILE the student plays, because that is when they are
        // looking at it. See bankWholeSeconds() and finish().
        // ⚠️ `now` IS THE FRAME'S OWN performance.now(), declared above, so this
        // reads identically to game-deadline.js's call and one assertion pins
        // both files.
        bankWholeSeconds(now);
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
        const whole = Math.floor(d.clock.seconds(now));
        while (secondsBanked < whole) {
            secondsBanked++;
            try { onSecond(); } catch (_) { /* never let a host error stop play */ }
        }
    }

    // ── drawing ─────────────────────────────────────────────────────────────
    function cx(x) { return offX + x * cell + cell / 2; }
    function cy(y) { return offY + y * cell + cell / 2; }

    function draw(now, tSec, dt) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#05070c';
        ctx.fillRect(0, 0, W, H);

        drawHud(d.report(now));
        drawCells();
        drawWebs();
        drawWords();
        drawEnemies(tSec, dt);
        drawPlayer(tSec);
        drawParticles(ctx, particles);

        if (board.player.webWord != null) {
            platedProgress(ctx, {
                x: W / 2, y: offY - 16, text: board.player.webWord, typedLen: board.typed.length,
                font: `bold ${Math.max(16, Math.round(cell * 0.24))}px "Courier Prime", monospace`,
                border: '#ffd700', typedColor: '#ffd700', restColor: '#fff',
                bg: 'rgba(40,26,4,0.94)',
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
                ctx.strokeStyle = board.zapped[y][x] > 0 ? 'rgba(255,120,40,0.35)'
                                : adj ? 'rgba(0,229,255,0.42)'
                                : lane ? 'rgba(190,120,255,0.20)'
                                : 'rgba(70,95,120,0.20)';
                ctx.lineWidth = adj ? 2 : 1;
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    function drawWebs() {
        for (const w of board.webs) {
            const wx = cx(w.x), wy = cy(w.y), r = cell * 0.42;
            ctx.save();
            ctx.strokeStyle = 'rgba(225,235,255,0.4)';
            ctx.lineWidth = 1;
            for (let a = 0; a < 8; a++) {
                ctx.beginPath();
                ctx.moveTo(wx, wy);
                ctx.lineTo(wx + Math.cos(a * Math.PI / 4) * r, wy + Math.sin(a * Math.PI / 4) * r);
                ctx.stroke();
            }
            for (let k = 1; k <= 3; k++) {
                ctx.beginPath();
                ctx.arc(wx, wy, r * k / 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    function drawWords() {
        const font = `bold ${Math.max(12, Math.round(cell * 0.20))}px "Courier Prime", monospace`;
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

    function drawPlayer(tSec) {
        const px = cx(board.player.x), py = cy(board.player.y), r = cell * 0.3;
        const webbed = board.player.webWord != null;
        const chomp = webbed ? 0.12 : 0.10 + 0.26 * Math.abs(Math.sin(tSec * 4));
        ctx.save();
        ctx.translate(px, py);
        if (board.player.facingLeft) ctx.scale(-1, 1);
        ctx.fillStyle = webbed ? '#c9a227' : '#ffd700';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, chomp, Math.PI * 2 - chomp);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#05070c';
        ctx.beginPath();
        ctx.arc(r * 0.15, -r * 0.42, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
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

            const r = cell * 0.28;
            ctx.save();
            ctx.translate(pos.x, pos.y);
            if (en.stunSteps > 0) ctx.globalAlpha = 0.5;
            if (en.kind === 'kaiju') {
                ctx.fillStyle = '#4caf50';
                ctx.beginPath();
                ctx.moveTo(-r, r); ctx.lineTo(-r * 0.6, -r * 0.3);
                ctx.lineTo(-r * 0.2, r * 0.1); ctx.lineTo(0, -r);
                ctx.lineTo(r * 0.2, r * 0.1); ctx.lineTo(r * 0.6, -r * 0.3);
                ctx.lineTo(r, r);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#ff3355';
                ctx.fillRect(-r * 0.4, -r * 0.15, r * 0.25, r * 0.25);
                ctx.fillRect(r * 0.15, -r * 0.15, r * 0.25, r * 0.25);
            } else if (en.kind === 'spider') {
                ctx.strokeStyle = '#cfd8e3';
                ctx.lineWidth = 2;
                for (let a = 0; a < 4; a++) {
                    const ang = 0.5 + a * 0.5;
                    for (const s of [-1, 1]) {
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(s * Math.cos(ang) * r * 1.5,
                                   Math.sin(ang + Math.sin(tSec * 5 + a) * 0.2) * r * 1.1);
                        ctx.stroke();
                    }
                }
                ctx.fillStyle = '#6b4fa0';
                ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff3355';
                ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.15, r * 0.12, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.15, r * 0.12, 0, Math.PI * 2); ctx.fill();
            } else {
                const pulse = 0.85 + 0.15 * Math.sin(tSec * 7);
                ctx.fillStyle = '#ff3355';
                ctx.beginPath();
                for (let a = 0; a < 6; a++) {
                    const ang = -Math.PI / 2 + a * Math.PI / 3;
                    const rr = r * pulse * (a % 2 ? 0.6 : 1);
                    if (a === 0) ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
                    else ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
                }
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();

            // A short arrow along the enemy's travel axis: the telegraph again,
            // per-creature this time.
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.strokeStyle = '#ff9bb0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const ax = en.axis === 'h' ? en.dir : 0;
            const ay = en.axis === 'v' ? en.dir : 0;
            ctx.moveTo(pos.x + ax * r * 1.2, pos.y + ay * r * 1.2);
            ctx.lineTo(pos.x + ax * r * 2.0, pos.y + ay * r * 2.0);
            ctx.stroke();
            ctx.restore();
        }
    }

    function drawHud(rep) {
        const font = 'bold 15px "Courier Prime", monospace';
        // ⚠️ THE ROUND IS SHOWN. The prototype displayed it, Jake thinks in it
        // ("he should appear around round 5 or 6"), and a rising number is its own
        // reward — the difference from the prototype is that this one MEANS
        // something: escape-board.js gates the hunter on it.
        const text = d.endless
            ? `ROUND ${board.round}   SCORE ${rep.score}   ${rep.wpm} WPM   ${rep.acc}%`
            : `ROUND ${board.round}   ${rep.wpm} WPM   ${rep.acc}%   TARGET ${rep.targetWPM}/${rep.minAccuracy}%`;
        // ⚠️ SET THE FONT BEFORE MEASURING, or the plate drifts as the game draws
        // other things and leaves other fonts on the context.
        ctx.save(); ctx.font = font;
        const tw = ctx.measureText(text).width;
        ctx.restore();
        platedText(ctx, {
            x: 14 + tw / 2, y: 20, text, font, color: '#8fe8c8',
            bg: 'rgba(2,4,10,0.75)', padX: 10, padY: 6, border: 'rgba(0,229,255,0.2)',
        });

        for (let i = 0; i < d.shieldsMax; i++) {
            const x = W - 20 - i * 26;
            ctx.save();
            ctx.globalAlpha = i < rep.shieldsLeft ? 1 : 0.22;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(x, 20, 8, 0.35, Math.PI * 2 - 0.35);
            ctx.lineTo(x, 20);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }

        if (!d.endless) {
            const pct = Math.min(1, d.clearedChars / d.quotaChars);
            const bw = Math.min(180, W * 0.26);
            const bx = W - bw - 20 - d.shieldsMax * 26;
            ctx.save();
            roundRect(ctx, bx, 14, bw, 12, 6);
            ctx.fillStyle = 'rgba(2,4,10,0.8)'; ctx.fill();
            ctx.strokeStyle = 'rgba(0,229,255,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            roundRect(ctx, bx + 1.5, 15.5, Math.max(0, (bw - 3) * pct), 9, 4.5);
            ctx.fillStyle = pct >= 1 ? '#ffd700' : '#00e5ff'; ctx.fill();
            ctx.restore();
        }
    }

    // ── lifecycle ───────────────────────────────────────────────────────────
    //
    // ⚠️ THE HIDDEN-TAB PAUSE IS THE ONLY THING ALLOWED TO STOP THE CLOCK. Idle
    // time inside a running game is charged — see GameClock's header. `stepAccMs`
    // is reset on resume so a hidden minute does not fire a burst of enemy steps.
    function onVisibility() {
        const now = performance.now();
        if (document.hidden) d.pause(now);
        else { d.resume(now); lastFrame = null; stepAccMs = 0; }
    }
    function onResize() { layout(); }

    layout();

    const chrome = mountChrome(container, {
        title: 'Escape Key',
        hint: 'Type a word next to you to move onto it. Your row and column are '
            + 'tinted — that is where creatures come from, so keep moving. '
            + 'Esc clears what you have typed.',
        muted: isMuted(),
        onStart() { started = true; lastFrame = null; stepAccMs = 0; },
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
