// game-deadline.js v1.0.0 — DEADLINE. Round 82 (Victor).
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
import { buildFingerMap, getFingerInfo, FINGER_COLORS, FINGER_NAMES } from './keyboard.js';
import { mountChrome } from './game-chrome.js';
import { sfx, isMuted, setMuted } from './game-audio.js';
import {
    fitCanvas, platedText, platedProgress, makeStars, drawStars,
    burst, updateParticles, drawParticles, roundRect,
    drawHitFeedback, drawCapsWarning, motionScale,
} from './game-draw.js';

export const GAME_DEADLINE_VERSION = '1.0.0';

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

    let d = new GameDirector(cfg);
    const shieldCount = Math.max(1, Math.min(LANDMARKS.length, cfg.shields == null ? 3 : cfg.shields));
    let capsOn = false;
    let started = false;   // set by the countdown; spawns wait for it

    // ── DOM ─────────────────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;background:#02040a;';
    canvas.setAttribute('aria-label', 'Deadline typing game');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, stars = [];
    let domes = [], tubes = [];

    function layout() {
        const size = fitCanvas(canvas, ctx);
        W = size.w; H = size.h;
        stars = makeStars(W, H, Math.round(W * H / 6000));

        // Lanes are evenly spread; each dome sits over its own landmark and
        // catches only its own lane.
        const groundY = H - 26;
        domes = [];
        for (let i = 0; i < shieldCount; i++) {
            const cx = W * ((i + 1) / (shieldCount + 1));
            domes.push({
                x: cx, y: groundY,
                radius: Math.max(52, Math.min(120, W / (shieldCount * 2.6))),
                active: domes[i] ? domes[i].active : true,
                landmark: LANDMARKS[i % LANDMARKS.length],
                lane: i,
            });
        }
        // Two silos, four tubes each. Left hand fires from the left silo.
        tubes = [];
        for (let f = 0; f < 8; f++) {
            const left = f < 4;
            const silo = left ? W * 0.10 : W * 0.90;
            const idx = left ? f : f - 4;
            tubes.push({
                finger: f,
                x: silo - 22.5 + idx * 15,
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
        live.push({
            text: t.text, typed: 0,
            x: startX, y: startY,
            tx: dome.x, ty: aimY,
            vx: (dome.x - startX) / secs,
            vy: (aimY - startY) / secs,
            lane, dist, travelled: 0,
            kind: Math.floor(rand() * 3),
            spin: rand() * Math.PI * 2,
        });
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
        if (e.key === 'Escape') {
            // ⚠️ ABANDONING A LOCK IS FREE. It is the whole lane mechanic: the
            // student is choosing which landmark to save, and charging them an
            // error for a tactical decision would make the depth a trap.
            e.preventDefault();
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
        target.typed++;
        fire(ch, target, target.typed >= target.text.length, now);
        if (target.typed >= target.text.length) {
            // ⚠️ THE TARGET IS REMOVED NOW, NOT WHEN THE MISSILE LANDS. The
            // prototype waited for missile arrival, so a word the student had
            // finished kept flying and could still take a dome — punishing them
            // for the flight time of their own feedback animation.
            d.cleared(target.text, now);
            sfx.clear();
            live = live.filter(x => x !== target);
            if (locked === target) locked = null;
            burst(particles, target.x, target.y, '#00e5ff', Math.round(22 * motionScale()), 220);
            if (!d.endless && d.quotaMet && !ended) finish(now, true);
        }
    }

    function reject(ch, now) {
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
                    const dome = domes[e.lane];
                    live.splice(i, 1);
                    if (locked === e) locked = null;
                    burst(particles, e.x, e.y, '#ff8800', Math.round(30 * motionScale()), 260);
                    flash = 0.35;
                    sfx.hit();
                    if (dome && dome.active) {
                        dome.active = false;
                        banner = { text: dome.landmark.name + ' IS GONE', until: now + 2200 };
                        shatter(dome);
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

        draw(now, ts / 1000);
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

    function finish(now, won) {
        if (ended) return;
        ended = true;
        d.end(now);
        const rep = d.report(now);
        won ? sfx.win() : sfx.lose();
        // ⚠️ THE VIEW FORMATS THESE LINES; IT DOES NOT COMPUTE THEM. Every number
        // here came off the shell's report untouched, and no letter grade appears
        // — run-grade.js turns (wpm, acc) into a grade, and a second place that
        // did it is the Rule 9 shape this project keeps finding.
        if (chrome) {
            chrome.showResult({
                heading: won ? 'CITY DEFENDED' : 'THE DEADLINE PASSED',
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

    // ── drawing ─────────────────────────────────────────────────────────────
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

        drawHud(ctx, W, d.report(now), d);
        if (capsOn) drawCapsWarning(ctx, W, 46);

        if (banner && now < banner.until) {
            platedText(ctx, {
                x: W / 2, y: H * 0.32, text: banner.text,
                font: 'bold 30px "Courier Prime", monospace',
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
            ctx.strokeStyle = c;
            ctx.lineWidth = 2;
            if (e.kind === 0) {
                ctx.beginPath(); ctx.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(0, -4, 10, Math.PI, 0); ctx.stroke();
            } else if (e.kind === 1) {
                ctx.beginPath();
                ctx.moveTo(0, -16); ctx.lineTo(20, 6); ctx.lineTo(0, 14); ctx.lineTo(-20, 6);
                ctx.closePath(); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.stroke();
                ctx.save(); ctx.rotate(e.spin);
                ctx.beginPath(); ctx.ellipse(0, 0, 24, 6, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.restore();
            }
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
                ctx.arc(dome.x, dome.y, dome.radius, Math.PI, 0);
                ctx.fill(); ctx.stroke();
                ctx.restore();
            }
            platedText(ctx, {
                x: dome.x, y: dome.y + 12, text: dome.landmark.short,
                font: 'bold 11px "Courier Prime", monospace',
                color: dome.active ? '#8fd8e8' : '#66404a',
                bg: 'rgba(2,4,10,0.8)', padX: 6, padY: 3,
                border: dome.active ? 'rgba(0,229,255,0.3)' : 'rgba(255,60,90,0.4)',
            });
        }
    }

    function drawSilos(ctx, list, now) {
        for (const t of list) {
            const dark = now < t.darkUntil;
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.fillStyle = dark ? '#2a2f38' : t.color;
            ctx.fillRect(-5, -46, 10, 46);
            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            if (!dark) ctx.fillRect(-3, -46, 2.5, 46);
            ctx.fillStyle = '#151a22';
            ctx.fillRect(-6, -48, 12, 5);
            ctx.restore();
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
        const g = H - 26;
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
        list.forEach((dome, i) => {
            const x = dome.x;
            const dead = !dome.active;
            const ink = dead ? '#2a1c22' : '#0d1730';
            const trim = dead ? '#5a2a36' : '#2b4a7a';
            if (dome.landmark.short === 'PARTHENON') drawParthenon(ctx, x, g, ink, trim);
            else if (dome.landmark.short === 'BATMAN BLDG') drawBatman(ctx, x, g, ink, trim, dead);
            else drawRyman(ctx, x, g, ink, trim);
        });

        // L&C Tower and the Pinnacle, off to the sides, always standing
        drawSlab(ctx, W * 0.04, g, 26, 130, '#0b1226', '#2b4a7a');
        drawSlab(ctx, W * 0.955, g, 32, 150, '#0b1226', '#2b4a7a');
        ctx.restore();
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

    function drawHud(ctx, W, rep, dir) {
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
        d = new GameDirector(cfg);
        live = []; missiles = []; particles = [];
        locked = null; banner = null; flash = 0;
        ended = false; started = false; lastFrame = null; tickAcc = 0;
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
        title: 'Deadline',
        hint: 'Words are falling on Nashville. Type the one closest to the ground. '
            + 'Esc gives up on a word so you can save a different landmark.',
        muted: isMuted(),
        onStart() { started = true; lastFrame = null; },
        onPause(on) {
            const now = performance.now();
            // ⚠️ PAUSE STOPS THE GRADED CLOCK. This is the one deliberate
            // exception beside a hidden tab: the student asked for it, and there
            // is nothing on screen to type at while the panel is up.
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
            live = []; missiles = []; particles = []; locked = null;
        },
        /** For a host that wants the numbers without waiting for onEnd. */
        report() { return d.report(performance.now()); },
    };
}
