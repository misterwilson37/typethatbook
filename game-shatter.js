// game-shatter.js v1.3.0 — Round 115 (Tower): THE ROCKS BREAK, THE SHIP TURNS,
//   AND EVERY KEY IS A COLOURED SHOT. Jake, 2026-09-10, sending the Gemini
//   prototype back as the baseline: *"Ship should rotate, and rocks should
//   literally break... Adding more color would help - perhaps mimicking what you
//   did with deadline and the ufos, where the colors of the keys were each
//   represented in the art of the rock itself. No projectiles come out of the
//   ship itself, and having the colors of the letters come out would at least
//   have something happen. Maybe it can shimmer..."*
//   • ROCK ART: each edge of a rock is coloured by one of its letters' finger
//     colours (keyboard.js, via fingerColorOf — the Deadline UFO idea). A typed
//     letter's edges go dark, so a rock visibly drains as you type it.
//   • BOLTS: every correct key fires a bolt in THAT KEY'S colour from the ship's
//     nose; on arrival the rock shimmers in the colour and chips sparks.
//   • BREAKING: a cleared rock's own outline is cut into wedges that fly apart
//     and tumble (Gemini's ShipDebris idea, applied to rocks). Pieces are thrown
//     OUT from the break point (shatter-board.js v1.2.0's SPLIT_KICK) and the
//     view flies them there instead of teleporting them.
//   • THE SHIP TURNS at a capped rate and tracks its orbiting target; with no
//     lock it holds its heading instead of snapping up.
//   • SPEED lives in shatter-board.js v1.2.0 (targetWPM passed in below).
//   ⚠️ ALL OF THIS IS VIEW-ONLY except the board options. No grading, no key
//   accounting and no timing changed here.
//
// (v1.2.0 and earlier follow.)
// game-shatter.js v1.2.0 — SHATTER. Rounds 103, 106, 109 (Bar-Let).
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
import { ShatterBoard, splittable, SHATTER_COST_FACTOR } from './shatter-board.js';
import { mountChrome } from './game-chrome.js';
import { sfx, isMuted, setMuted } from './game-audio.js';
import {
    fitCanvas, platedText, platedProgress, burst, updateParticles,
    drawParticles, roundRect, drawHitFeedback, drawCapsWarning, motionScale,
    makeStars, drawStars, fingerColorOf,
} from './game-draw.js';
// ⚠️⚠️ A ROCK IS AN OBJECT, NOT A LABEL. v1.0.0 drew each target as a rounded
// rectangle behind text — nothing about which says *breakable*, which is the one
// thing this game's art has to communicate. See game-sprites.js's header.
import { rockOutline, drawRock, drawShip as drawShipArt, drawTargetWord }
    from './game-sprites.js';
import { drawShatterPanel, drawGauges } from './game-draw.js';
import { MAX_WARPS } from './shatter-board.js';

export const GAME_SHATTER_VERSION = '1.3.0';

// Cosmetic only. ⚠️ NOT A DIFFICULTY KNOB — the board owns travel, the shell owns
// pacing. These decide where a rock is DRAWN, never when it arrives.
const SHIP_R = 26;          // the ship's own radius in px
const RING_MARGIN = 30;     // gap between the spawn ring and the canvas edge
const DANGER_R = 0.22;      // board-space radius at which a rock reads as close
const HUD_H = 46;

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
    let board = new ShatterBoard({ rand, targetWPM: d.targetWPM });
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
    function px(rock) {
        const rr = SHIP_R + Math.max(0, rock.r) * (ringR - SHIP_R);
        return { x: cx + Math.cos(rock.angle) * rr, y: cy + Math.sin(rock.angle) * rr };
    }

    /**
     * Attach the view-only art fields a rock needs. ⚠️ EVERY ROCK GETS THESE,
     * INCLUDING PIECES — a piece with no outline draws as a perfect circle and
     * instantly reads as a different kind of object from the rock it came from.
     * ⚠️ It is view state living on a board object, a deliberate exception: the
     * alternative is a parallel Map keyed by rock that has to be pruned in three
     * places, and Round 82's ease-Map already showed what that costs.
     */
    function decorate(rock) {
        if (!rock || rock.outline) return rock;
        rock.outline = rockOutline(rand);
        rock.spin = rand() * Math.PI * 2;
        rock.spinRate = (rand() - 0.5) * 0.6 * motionScale();
        return rock;
    }

    // ── view-only state ─────────────────────────────────────────────────────
    // ⚠️ EVERYTHING HERE IS COSMETIC. Board truth lives on `board`; game truth
    // lives on `d`. Nothing below is read to decide an outcome.
    // ⭐ v1.3.0 — view-only effects. See the header.
    let bolts = [];    // { x0,y0, rock, at, color, born }
    let shards = [];   // { pts, x,y, vx,vy, rot, vrot, color, life }
    let shipAngle = -Math.PI / 2;
    const BOLT_MS = 130, SHIMMER_MS = 260, FLY_MS = 420, SHARD_S = 1.1;

    function rockSize() { return Math.max(14, Math.round(ringR * 0.07)); }
    function rockRadius(rock) {
        const size = rockSize();
        return Math.max(size * 1.4, rock.text.length * size * 0.42);
    }
    function ease(t) { return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3); }
    /** Where a rock is DRAWN: a fresh piece flies out from its break point. */
    function drawPos(rock, now) {
        const p = px(rock);
        if (rock.bornR == null || rock.bornAt == null) return p;
        const t = ease((now - rock.bornAt) / FLY_MS);
        if (t >= 1) return p;
        const q = px({ r: rock.bornR, angle: rock.bornAngle });
        return { x: q.x + (p.x - q.x) * t, y: q.y + (p.y - q.y) * t };
    }
    function shipNose() {
        return { x: cx + Math.cos(shipAngle) * SHIP_R * 0.8,
                 y: cy + Math.sin(shipAngle) * SHIP_R * 0.8 };
    }
    /** Cut the rock's own outline into tumbling wedges, one colour per letter. */
    function shatterArt(rock, now) {
        if (!rock.outline) return;
        const p = drawPos(rock, now), rr = rockRadius(rock);
        const n = rock.outline.length;
        const spin = (rock.spin || 0) + (now / 1000) * (rock.spinRate || 0);
        const away = Math.atan2(p.y - cy, p.x - cx);
        const step = 2;
        for (let i = 0, w = 0; i < n; i += step, w++) {
            const pts = [[0, 0]];
            for (let k = 0; k <= step; k++) {
                const j = (i + k) % n, a = (j / n) * Math.PI * 2 + spin;
                const R = rr * rock.outline[j];
                pts.push([Math.cos(a) * R, Math.sin(a) * R]);
            }
            const mid = ((i + step / 2) / n) * Math.PI * 2 + spin;
            const v = (70 + rand() * 90) * motionScale();
            shards.push({
                pts, x: p.x, y: p.y,
                vx: Math.cos(mid) * v + Math.cos(away) * 40,
                vy: Math.sin(mid) * v + Math.sin(away) * 40,
                rot: 0, vrot: (rand() - 0.5) * 6 * motionScale(),
                color: fingerColorOf(rock.text[w % rock.text.length] || 'a', '#ffffff'),
                life: SHARD_S,
            });
        }
    }
    function updateEffects(dt, now) {
        for (const sh of shards) {
            sh.x += sh.vx * dt; sh.y += sh.vy * dt;
            sh.vx *= 0.985; sh.vy *= 0.985;
            sh.rot += sh.vrot * dt; sh.life -= dt;
        }
        shards = shards.filter(sh => sh.life > 0);
        for (const b of bolts) if (board.rocks.includes(b.rock)) b.at = drawPos(b.rock, now);
        const keep = [];
        for (const b of bolts) {
            if (now - b.born < BOLT_MS) { keep.push(b); continue; }
            // ARRIVED: the rock shimmers in the bolt's colour and chips sparks.
            b.rock.shimmer = { color: b.color, until: now + SHIMMER_MS };
            burst(particles, b.at.x, b.at.y, b.color, Math.round(6 * motionScale()), 120);
        }
        bolts = keep;
        // ⭐ THE SHIP TURNS, IT DOES NOT SNAP: capped turn rate toward the lock,
        // and with no lock it holds its heading.
        const lk = board.locked && board.rocks.includes(board.locked) ? board.locked : null;
        if (lk) {
            const p = drawPos(lk, now);
            let dA = Math.atan2(p.y - cy, p.x - cx) - shipAngle;
            dA = Math.atan2(Math.sin(dA), Math.cos(dA));
            const maxTurn = 10 * dt;
            shipAngle += Math.max(-maxTurn, Math.min(maxTurn, dA));
        }
    }
    function drawEffects(now) {
        ctx.save();
        ctx.lineCap = 'round';
        for (const b of bolts) {
            const t = Math.min(1, (now - b.born) / BOLT_MS);
            const tt = Math.max(0, t - 0.4);
            ctx.strokeStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 10;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(b.x0 + (b.at.x - b.x0) * tt, b.y0 + (b.at.y - b.y0) * tt);
            ctx.lineTo(b.x0 + (b.at.x - b.x0) * t, b.y0 + (b.at.y - b.y0) * t);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        for (const sh of shards) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, sh.life / SHARD_S);
            ctx.translate(sh.x, sh.y); ctx.rotate(sh.rot);
            ctx.beginPath();
            sh.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.closePath();
            ctx.fillStyle = 'rgba(8,12,22,0.7)'; ctx.fill();
            ctx.strokeStyle = sh.color; ctx.lineWidth = 1.6; ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    /**
     * ⭐ v1.3.0 — THE ROCK'S ART IS ITS LETTERS. Each edge takes the finger colour
     * of one letter (cycling); an edge whose letter is typed goes dark, so the
     * rock drains as it is typed. Danger and lock are a GLOW, not a recolour, so
     * the letters stay readable in both states. A shimmer is the last bolt's
     * colour washing over the whole outline.
     */
    function drawLetterRock(rock, x, y, rr, spin, isLocked, near, now) {
        const o = rock.outline, n = o.length, L = rock.text.length || 1;
        const pt = j => {
            const a = (j / n) * Math.PI * 2 + spin, R = rr * o[j % n];
            return [x + Math.cos(a) * R, y + Math.sin(a) * R];
        };
        ctx.save();
        ctx.beginPath();
        for (let j = 0; j < n; j++) { const [a, b] = pt(j); j ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }
        ctx.closePath();
        ctx.fillStyle = rock.parent != null ? 'rgba(40,30,10,0.6)' : 'rgba(4,7,14,0.6)';
        ctx.fill();
        // ⚠️ A HALO STROKE, NOT A GLOWING FILL — a blurred fill washed the whole
        // rock yellow and buried the letter colours (seen rendered, Round 115).
        if (near || isLocked) {
            ctx.strokeStyle = near ? 'rgba(255,85,102,0.30)' : 'rgba(255,255,0,0.22)';
            ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.stroke();
        }
        ctx.lineWidth = isLocked ? 2.8 : 2;
        ctx.lineCap = 'round';
        for (let j = 0; j < n; j++) {
            const li = Math.floor(j * L / n);
            const [a, b] = pt(j), [c, e] = pt(j + 1);
            ctx.globalAlpha = li < rock.typed ? 0.22 : 1;
            ctx.strokeStyle = fingerColorOf(rock.text[li], '#ffffff');
            ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, e); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        const sh = rock.shimmer;
        if (sh && now < sh.until) {
            const k = (sh.until - now) / SHIMMER_MS;
            ctx.globalAlpha = k;
            ctx.strokeStyle = sh.color; ctx.shadowColor = sh.color; ctx.shadowBlur = 18;
            ctx.lineWidth = 3 + 3 * k;
            ctx.beginPath();
            for (let j = 0; j < n; j++) { const [a, b] = pt(j); j ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }
            ctx.closePath(); ctx.stroke();
        }
        ctx.restore();
    }

    let particles = [];
    let banner = null;
    let flash = 0;
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
        if (e.key === ' ' && board.canWarp(now)) {
            board.warp(now);
            sfx.free();
            burst(particles, cx, cy, '#ffd700', Math.round(30 * motionScale()), 260);
            banner = { text: 'WARP', until: now + 900 };
            return;
        }

        const wasPiece = board.locked && board.locked.parent != null;
        const before = board.rocks.slice();
        const r = board.tryKey(e.key, now);

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
            sfx.misfire();
            return;
        }

        // ⭐ v1.3.0 — THE SHOT, in the colour of the key just typed, at the rock
        // that took it (the lock, or on the finishing key the rock that left).
        const gone = before.find(x => !board.rocks.includes(x)) || null;
        const hitRock = (board.locked && board.rocks.includes(board.locked)) ? board.locked : gone;
        if (hitRock) {
            const nose = shipNose();
            bolts.push({ x0: nose.x, y0: nose.y, rock: hitRock, at: drawPos(hitRock, now),
                         color: fingerColorOf(e.key, '#ffffff'), born: now });
        }

        if (r.cleared) {
            if (gone) shatterArt(gone, now);
            r.pieces.forEach(pc => { decorate(pc); pc.bornAt = now; });
            // ⚠️⚠️ ONE SPAWNED TARGET, ONE RAMP STEP. Every piece is a real
            // `cleared()` — it is real typing and must reach clearedChars and the
            // score — but `RAMP_PER_TARGET` is priced per TARGET, and a Shatter
            // target becomes three or four rocks. Left unsaid, the arcade ramped
            // three times per spawn and a child typing at exactly the gate with
            // 100% accuracy lost every shield at 79 seconds, on their own
            // success. Found by simulation; invisible in review.
            d.cleared(r.cleared, now, { ramp: !wasPiece });
            sfx.clear();
            const p = r.pieces.length ? px(r.pieces[0]) : { x: cx, y: cy };
            burst(particles, p.x, p.y,
                  r.pieces.length ? '#ffd700' : '#00e5ff',
                  Math.round((r.pieces.length ? 22 : 12) * motionScale()),
                  r.pieces.length ? 200 : 150);
            if (r.pieces.length) {
                r.pieces.forEach(decorate);
                sfx.launch(0);
                banner = { text: 'SHATTERED', until: now + 700 };
            }
        }
    }

    function takeHit(rock, now) {
        const p = px(rock);
        burst(particles, p.x, p.y, '#ff3355', Math.round(34 * motionScale()), 260);
        flash = 0.4;
        sfx.hit();
        // ⚠️ THE SHELL DECIDES WHETHER THAT WAS THE LAST SHIELD, not this file.
        d.hit(now);
        if (d.over) { finish(now); return; }
        banner = { text: 'HULL BREACH', until: now + 1200 };
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
                heading: 'SHIP DOWN',
                lines: [
                    `${rep.wpm} WPM  ·  ${rep.acc}% accurate  ·  ${rep.targetsCleared} rocks`,
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
        board = new ShatterBoard({ rand, targetWPM: d.targetWPM });
        bolts = []; shards = []; shipAngle = -Math.PI / 2;
        particles = [];
        banner = null; flash = 0;
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
            for (const gone of board.advance(now)) {
                takeHit(gone, now);
                if (ended) break;
            }

            // ⚠️ ONE SPAWN TEST PER FRAME, AND THE ON-SCREEN COUNT INCLUDES
            // PIECES. That is deliberate: MIN_ON_SCREEN exists so a fast student
            // is never left waiting, and a student mid-way through a shattered
            // word is not waiting for anything.
            if (!ended && d.spawnDue(now, board.rocks.length)) {
                const t = d.nextTarget(now);
                // ⚠️⚠️ THE SILHOUETTE IS FROZEN AT SPAWN AND CARRIED ON THE ROCK.
                // Re-rolling the offsets each frame makes the outline BOIL, which
                // reads as a rendering fault rather than as stone.
                if (t) decorate(board.spawn(t.text, t.lifetimeMs, now));
            }
        }

        if (!ended && started && !paused && d.clock.seconds(now) > 0
            && now - lastKeyAt > IDLE_MS) {
            idleMs += dt * 1000;
        }

        updateParticles(particles, dt);
        updateEffects(dt, now);
        if (flash > 0) flash = Math.max(0, flash - dt);
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
                contacts: board.rocks.map(r => ({ r: r.r, angle: r.angle })),
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
        ctx.fillStyle = '#04060e';
        ctx.fillRect(0, 0, W, H);
        drawStars(ctx, stars, tSec);

        drawRings();
        drawRocks(now, tSec);
        drawEffects(now);
        drawShip();
        drawParticles(ctx, particles);
        drawHud(d.report(now));

        // ⚠️ NO FULL-SCREEN RED FILL — photosensitivity. See game-draw.js.
        drawHitFeedback(ctx, W, H, flash);
        if (capsOn) drawCapsWarning(ctx, W, HUD_H + 8);

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
     * The spawn ring and the danger ring.
     *
     * ⚠️ THE DANGER RING IS THE TUTORIAL. The lock rule is "nearest to impact",
     * and a student cannot follow a rule they cannot see. Drawing the radius at
     * which a rock becomes urgent teaches the rule without a paragraph of text,
     * the same way Escape Key tints the player's row and column.
     */
    function drawRings() {
        ctx.save();
        ctx.strokeStyle = 'rgba(70,90,130,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2); ctx.stroke();

        ctx.strokeStyle = 'rgba(255,80,90,0.30)';
        ctx.setLineDash([5, 7]);
        ctx.beginPath();
        ctx.arc(cx, cy, SHIP_R + DANGER_R * (ringR - SHIP_R), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function drawRocks(now, tSec) {
        const sorted = board.rocks.slice().sort((a, b) => b.r - a.r);
        const size = rockSize();
        for (const rock of sorted) {
            decorate(rock);
            const p = drawPos(rock, now);
            const near = rock.r <= DANGER_R;
            const isLocked = rock === board.locked;
            drawLetterRock(rock, p.x, p.y, rockRadius(rock),
                           rock.spin + tSec * rock.spinRate, isLocked, near, now);
            drawTargetWord(ctx, p.x, p.y, rock.text, rock.typed, size, isLocked);
        }
    }

    /**
     * ⭐ THE SHIP POINTS AT WHAT THE STUDENT IS TYPING. It is the prototype's
     * best idea in this game: drawn confirmation that the lock landed where they
     * meant — which matters more here than anywhere, because two split pieces
     * can share a first letter.
     * ⚠️ WITH NO LOCK IT POINTS UP AND HOLDS STILL. A ship idly rotating is
     * telling the student about a target that does not exist.
     */
    function drawShip() {
        // ⭐ v1.3.0 — the heading is shipAngle, turned in updateEffects().
        drawShipArt(ctx, cx, cy, SHIP_R * 0.8, shipAngle);
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
        // their eyes are on a rock.
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
        ctx.fillStyle = full ? '#ffd700' : '#00e5ff'; ctx.fill();
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
        hint: 'Type a rock to break it — and it breaks into its pieces, which you '
            + 'have to type too. Go for whatever is closest to your ship. Fill the '
            + 'WARP meter by clearing rocks, then hit Space to push everything back. '
            + 'Esc lets go of the word you are on.',
        muted: isMuted(),
        onStart() { started = true; lastFrame = null; },
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
