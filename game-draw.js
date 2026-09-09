// game-draw.js v1.2.0 — keyStates added Round 90 (miss/fixed key colouring).
// game-draw.js v1.1.0 — CANVAS HELPERS SHARED BY ALL THREE ARCADE VIEWS.
// Round 82 (Victor); keyboard strip added Round 89.
//
// v1.1.0 — ⭐ THE KEYBOARD STRIP MOVED HERE FROM game-deadline.js. Jake,
//          2026-09-08: *"Maybe there's a whole arcade css that they all share so
//          the games all share the same keyboard."* Right instinct, wrong
//          mechanism for this codebase — the strip is CANVAS, not CSS, so a
//          stylesheet cannot carry it. A shared DRAWING helper is the same idea
//          in the form this architecture already uses, and it is why this file
//          exists at all. Escape Key can now show the identical board by calling
//          one function.
//          ⚠️ IT ALSO OWNS THE STAT FLANKS. Jake, same message: *"just add those
//          stats to the left and right of the keyboard (given that that space is
//          available now)."* The board is centred and narrower than the canvas,
//          so there is dead space either side; putting the readout there buys
//          back the whole top strip for sky. Flanks live with the strip because
//          their geometry is the strip's geometry — a caller computing those
//          rectangles itself would drift the moment key sizing changed.
//
// ⚠️⚠️ THE PLATE IS THE WHOLE POINT OF THIS FILE. Jake, 2026-09-07, on the
// Muncher prototype: *"it will need some sort of color behind it to be easier to
// read. STUCK was always hard to read."* It was hard to read for the same reason
// the cyan grid words wash out and the enemy labels vanish over the skyline:
// every one of the three prototypes drew fillText straight onto a busy canvas
// with no backing. One helper, called from every text site, is the single largest
// readability win available across all three games — and it is fifteen lines, so
// there is no version of this where three copies is the cheaper option.
//
// ⚠️ NO GAME LOGIC HERE, EVER. No timing, no scoring, no key handling. This file
// may be imported by anything that draws; that only stays safe while it knows
// nothing.

export const GAME_DRAW_VERSION = '1.0.0';

/**
 * Size a canvas to its container in CSS pixels while rendering at device
 * resolution.
 *
 * ⚠️ ALL THREE PROTOTYPES SIZED THE CANVAS ONCE AT LOAD AND NEVER AGAIN. Rotate
 * an iPad in the Missile Command prototype and the domes stay where the portrait
 * layout put them — off screen. Student iPads rotate constantly.
 *
 * ⚠️ RETURNS CSS PIXEL DIMENSIONS, and the caller must lay out in those. The
 * transform below means every subsequent draw call is in CSS pixels regardless
 * of devicePixelRatio, so nothing downstream has to know about retina at all.
 */
// ⚠️ THE LAYOUT AND THE COLOURS ARE keyboard.js's, ALWAYS. No arcade file may
// hold a second copy of either — game-assumptions-test.mjs Part J is the guard.
import { LAYOUTS, FINGER_COLORS, FINGER_NAMES, buildFingerMap, getFingerInfo }
    from './keyboard.js';
// ⚠️ Pixel-only tunables. See game-layout.js's header before adding to it.
import * as LAY from './game-layout.js';

const _KB_MAP = buildFingerMap('qwerty');

/**
 * Finger index 0..7 for a character, or null.
 *
 * ⚠️ keyboard.js STORES `finger` AS A NAME ('left-index'), NOT AN INDEX, so
 * FINGER_NAMES[info.finger] is undefined and a canvas fill silently keeps
 * whatever colour was set last — which is exactly how the first draft of this
 * strip rendered as a grey board. Go through the name→index lookup.
 * ⚠️ A THUMB CHARACTER (space) RETURNS null RATHER THAN 0. Falling back to 0 is
 * what once put every unmapped character on the left pinky.
 */
export function fingerIndexOfChar(ch) {
    const info = getFingerInfo(_KB_MAP, ch);
    if (!info || !info.finger) return null;
    const i = FINGER_NAMES.indexOf(info.finger);
    return i === -1 ? null : i;
}

export function fingerColorOf(ch, fallback) {
    const i = fingerIndexOfChar(ch);
    return i == null ? (fallback || '#7fd7ff') : FINGER_COLORS[FINGER_NAMES[i]];
}

/**
 * How tall the keyboard strip should be, or 0 if it must not be drawn.
 *
 * ⚠️ THE CALLER SUBTRACTS THIS FROM THE PLAY AREA — the strip is never overlaid.
 * Impact tests in these games are distance-based, so a target falling behind the
 * keys would "land" somewhere the student cannot see.
 * ⚠️ 0 BELOW ~360px OF HEIGHT. Squeezing four rows into a short window produces
 * a board nobody can read, which is worse than no board.
 */
export function keyboardStripHeight(H, enabled) {
    if (!enabled || H < LAY.KB_MIN_CANVAS_HEIGHT) return 0;
    return Math.max(LAY.KB_HEIGHT_MIN, Math.min(LAY.KB_HEIGHT_MAX, H * LAY.KB_HEIGHT_FRACTION));
}

/**
 * The on-screen keyboard, plus a stat flank on each side.
 *
 * @param {object} o
 *   W, H       {number}   canvas size
 *   height     {number}   from keyboardStripHeight()
 *   nextChar   {string}   the character to light, or null
 *   left,right {string[]} lines for the flanks
 *   keyStates  {object}   char -> 'miss' | 'fixed', for the error memory
 *   progress   {number}   0..1, drawn as a bar under the right flank; null to omit
 *
 * ⚠️ THE NUMBER ROW IS OMITTED ON PURPOSE. Three letter rows and a space bar
 * cover every character any lesson or book target uses; the number row would
 * cost a fifth of the sky to show keys that never light up.
 */
export function drawKeyboardStrip(ctx, o) {
    const { W, H, height } = o;
    if (!height) return;
    const rows = (LAYOUTS.qwerty).rows;
    const top = H - height;
    const want = o.nextChar;
    const states = o.keyStates || {};
    const wantLower = want == null ? null : String(want).toLowerCase();
    const shifted = want != null && want !== wantLower;

    const pad = LAY.KEY_PAD;
    // ⚠️ THE PREVIEW OWNS THE TOP 34px WHEN PRESENT, so the rows start below it.
    const headY = o.nextWord ? LAY.KB_PREVIEW_BAND : 0;
    const rowH = Math.floor((height - 10 - headY) / 4);
    const keyH = rowH - pad;
    const widest = Math.max.apply(null, rows.map(r => r.length));
    const keyW = Math.min(LAY.KEY_MAX_W, Math.floor((W * LAY.KB_BOARD_WIDTH_FRACTION) / widest)) - pad;
    const boardW = widest * (keyW + pad);
    const originX = (W - boardW) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(4,8,16,0.82)';
    ctx.fillRect(0, top, W, height);
    ctx.strokeStyle = 'rgba(120,170,220,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, top + 0.5); ctx.lineTo(W, top + 0.5); ctx.stroke();

    ctx.font = 'bold ' + Math.max(10, Math.floor(keyH * 0.42)) + 'px "Courier Prime", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    rows.forEach((rowChars, r) => {
        // Stagger, as a real keyboard does — a square grid is noticeably harder
        // to map onto the board under their hands.
        const indent = r * (keyW * LAY.KB_ROW_STAGGER);
        const y = top + 6 + headY + r * rowH;
        rowChars.forEach((ch, c) => {
            const x = originX + indent + c * (keyW + pad);
            const col = fingerColorOf(ch);
            const isWant = wantLower !== null && ch === wantLower;
            // ⚠️⚠️ ERROR STATE OUTRANKS FINGER COLOUR, AND THAT IS THE POINT.
            // Students asked for keys that turn red where they get stuck; a
            // red key that is still tinted by its finger is neither. 'miss'
            // shouts, 'fixed' stays marked but stops shouting — erasing it
            // entirely would delete the very information they asked for.
            const st = states[ch];
            const keyCol = st === 'miss' ? '#ff5566' : st === 'fixed' ? '#7fb8ff' : col;
            roundRect(ctx, x, y, keyW, keyH, 4);
            ctx.fillStyle = keyCol;
            // ⚠️ THE RESTING TINT IS FAINT BUT NOT INVISIBLE. At 0.05 the board
            // rendered as uniform grey and the colours — the entire reason a
            // beginner needs this strip — conveyed nothing.
            // A missed key sits brighter than a resting one even when it is not
            // the current target, or it is only findable by hunting for it.
            ctx.globalAlpha = isWant ? LAY.KEY_ALPHA_ACTIVE
                : (st === 'miss' ? LAY.KEY_ALPHA_MISSED
                : st === 'fixed' ? LAY.KEY_ALPHA_FIXED : LAY.KEY_ALPHA_RESTING);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = isWant ? '#ffffff' : keyCol;
            ctx.lineWidth = isWant || st === 'miss' ? 2 : 1;
            ctx.globalAlpha = isWant ? 1 : 0.75;
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.fillStyle = isWant ? '#04070d' : '#e8f2fa';
            ctx.globalAlpha = isWant ? 1 : 0.9;
            ctx.fillText(ch.toUpperCase(), x + keyW / 2, y + keyH / 2 + 0.5);
            ctx.globalAlpha = 1;
        });

        // ⚠️ ENTER SITS AT THE RIGHT END OF THE HOME ROW (rIdx 1), which is where
        // keyboard.js's createKeyboard() puts it and therefore where School has
        // trained the student to look. Putting it anywhere else would teach a
        // position their fingers then have to unlearn.
        // ⚠️ IT IS A RIGHT-PINKY KEY and takes that colour from the shared map
        // (keyboard.js maps '\n' to right-pinky), not from a literal here.
        if (r === 1) {
            const ex = originX + indent + rowChars.length * (keyW + pad);
            const ew = keyW * LAY.KB_ENTER_WIDTH;
            const wantEnter = want === '\n' || want === '\r';
            const ecol = fingerColorOf('\n');
            roundRect(ctx, ex, y, ew, keyH, 4);
            ctx.fillStyle = ecol;
            ctx.globalAlpha = wantEnter ? 0.95 : 0.16;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = wantEnter ? '#ffffff' : ecol;
            ctx.lineWidth = wantEnter ? 2 : 1;
            ctx.globalAlpha = wantEnter ? 1 : 0.75;
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.save();
            ctx.font = 'bold ' + Math.max(9, Math.floor(keyH * 0.30)) + 'px "Courier Prime", monospace';
            ctx.fillStyle = wantEnter ? '#04070d' : '#e8f2fa';
            ctx.globalAlpha = wantEnter ? 1 : 0.9;
            ctx.fillText('\u21b5 ENTER', ex + ew / 2, y + keyH / 2 + 0.5);
            ctx.restore();
        }
    });

    // Space bar
    const sy = top + 6 + headY + rows.length * rowH;
    const sw = boardW * LAY.KB_SPACE_WIDTH_FRACTION, sx = (W - sw) / 2;
    const wantSpace = want === ' ';
    roundRect(ctx, sx, sy, sw, keyH, 4);
    ctx.fillStyle = wantSpace ? '#cfe6f5' : 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = wantSpace ? '#ffffff' : 'rgba(200,225,245,0.45)';
    ctx.lineWidth = wantSpace ? 2 : 1;
    ctx.stroke();

    // ⚠️ SHIFT IS ANNOUNCED, NOT DRAWN AS KEYS. Matching is case-sensitive here
    // exactly as it is in the drills, so the student must know a capital needs
    // Shift — but two full shift keys would cost a row.
    if (shifted) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px "Courier Prime", monospace';
        ctx.fillText('\u21e7 SHIFT + ' + wantLower.toUpperCase(), W / 2, sy + keyH / 2 + 0.5);
    }

    // ── the flanks ──────────────────────────────────────────────────────────
    // ⚠️ CLIPPED TO THEIR OWN SIDE. A long stat line running under the board
    // would sit behind the keys and read as corruption.
    const flankW = originX - LAY.FLANK_PAD_X;
    const drawFlank = (lines, xCenter, align) => {
        if (!lines || !lines.length || flankW < LAY.FLANK_MIN_WIDTH) return;
        ctx.textAlign = align;
        const lh = Math.min(22, (height - 12) / Math.max(3, lines.length));
        lines.forEach((ln, i) => {
            ctx.font = (i === 0 ? 'bold ' : '') +
                Math.max(11, Math.floor(lh * 0.62)) + 'px "Courier Prime", monospace';
            ctx.fillStyle = i === 0 ? '#8fe8c8' : '#7f97ab';
            ctx.fillText(ln, xCenter, top + 14 + i * lh);
        });
    };
    drawFlank(o.left, LAY.FLANK_PAD_X, 'left');
    drawFlank(o.right, W - LAY.FLANK_PAD_X, 'right');

    // ⚠️⚠️ BOTTOM-ANCHORED, NOT APPENDED TO THE TOP LISTS. Jake, 2026-09-08:
    // *"add current daily minutes to the bottom left and weekly minutes to the
    // bottom right."* These are the student's REAL totals for the day and the
    // week — the same numbers School and the reports show — and they must sit
    // apart from the run's own live stats above them, or a child reads "28 WPM"
    // and "14m today" as two facts of the same kind. Anchoring to the bottom
    // edge keeps that separation at every strip height.
    const drawBottom = (text, xCenter, align) => {
        if (!text || flankW < LAY.FLANK_MIN_WIDTH) return;
        ctx.textAlign = align;
        ctx.font = 'bold 12px "Courier Prime", monospace';
        ctx.fillStyle = '#5f7387';
        ctx.fillText(text, xCenter, top + height - 12);
    };
    drawBottom(o.bottomLeft, LAY.FLANK_PAD_X, 'left');
    drawBottom(o.bottomRight, W - LAY.FLANK_PAD_X, 'right');

    // ⚠️⚠️ THE NEXT WORD, SO IT CAN BE READ BEFORE IT ARRIVES. This is the whole
    // remedy for the "waiting for the next word" cap — the student pre-reads
    // here instead of paying a locate-and-read when it appears in the sky.
    // ⚠️ IT IS NOT A TARGET AND MUST NOT LOOK LIKE ONE: dim, small, unboxed,
    // parked on the strip. A second thing that looks typable is worse than no
    // preview at all.
    if (o.nextWord) {
        ctx.textAlign = 'center';
        ctx.font = '11px "Courier Prime", monospace';
        ctx.fillStyle = '#5f7387';
        ctx.fillText('NEXT', W / 2, top + 12);
        ctx.font = 'bold 15px "Courier Prime", monospace';
        ctx.fillStyle = '#9fb6c6';
        ctx.fillText(o.nextWord, W / 2, top + 28);
    }

    if (o.progress != null && flankW >= LAY.FLANK_MIN_WIDTH) {
        const bw = Math.min(LAY.FLANK_BAR_MAX_W, flankW - 10);
        const bx = W - LAY.FLANK_PAD_X - bw;
        // ⚠️ LIFTED CLEAR OF THE WEEKLY-MINUTES LINE BELOW IT (Round 90). At
        // `height - 22` the bar and that text occupied the same pixels.
        const by = top + height - (o.bottomRight ? LAY.FLANK_BAR_LIFT_WITH_MINUTES : LAY.FLANK_BAR_LIFT_ALONE);
        roundRect(ctx, bx, by, bw, 10, 5);
        ctx.fillStyle = 'rgba(2,4,10,0.8)'; ctx.fill();
        ctx.strokeStyle = 'rgba(0,229,255,0.3)'; ctx.lineWidth = 1; ctx.stroke();
        roundRect(ctx, bx + 1.5, by + 1.5, Math.max(0, (bw - 3) * Math.min(1, o.progress)), 7, 3.5);
        ctx.fillStyle = o.progress >= 1 ? '#ffd700' : '#00e5ff'; ctx.fill();
    }
    ctx.restore();
}

export function fitCanvas(canvas, ctx) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
}

/**
 * Draw text on a rounded dark plate so it is legible over anything.
 *
 * @param {object} o
 *   x, y      centre of the plate
 *   text      the string
 *   font      any canvas font shorthand
 *   color     text colour
 *   bg        plate fill (default a near-opaque black)
 *   border    optional plate stroke — used to carry target state (locked, etc.)
 *   padX/padY plate padding
 */
export function platedText(ctx, o) {
    const font = o.font || 'bold 20px "Courier Prime", monospace';
    const padX = o.padX == null ? 8 : o.padX;
    const padY = o.padY == null ? 4 : o.padY;

    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const m = ctx.measureText(o.text);
    const th = (m.actualBoundingBoxAscent || 10) + (m.actualBoundingBoxDescent || 4);
    const pw = m.width + padX * 2;
    const ph = th + padY * 2;
    const px = o.x - pw / 2;
    const py = o.y - ph / 2;

    roundRect(ctx, px, py, pw, ph, Math.min(6, ph / 2));
    ctx.fillStyle = o.bg || 'rgba(4,7,14,0.86)';
    ctx.fill();
    if (o.border) {
        ctx.strokeStyle = o.border;
        ctx.lineWidth = o.borderWidth || 1.5;
        ctx.stroke();
    }

    ctx.fillStyle = o.color || '#fff';
    ctx.fillText(o.text, px + padX, o.y);
    ctx.restore();
    return { x: px, y: py, w: pw, h: ph };
}

/**
 * A target word with the typed prefix shown in a second colour, on one plate.
 *
 * ⚠️ ONE PLATE FOR THE WHOLE WORD, MEASURED BEFORE DRAWING. The prototypes
 * measured the typed and untyped halves separately and positioned each from the
 * full width, which drifts on any proportional font and jitters as characters
 * land. Measuring once and advancing by the typed width cannot drift.
 */
export function platedProgress(ctx, o) {
    const font = o.font || 'bold 20px "Courier Prime", monospace';
    const typed = o.text.slice(0, o.typedLen);
    const rest = o.text.slice(o.typedLen);

    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const m = ctx.measureText(o.text);
    const th = (m.actualBoundingBoxAscent || 10) + (m.actualBoundingBoxDescent || 4);
    const padX = 9, padY = 5;
    const pw = m.width + padX * 2;
    const ph = th + padY * 2;
    const px = o.x - pw / 2;
    const py = o.y - ph / 2;

    roundRect(ctx, px, py, pw, ph, Math.min(6, ph / 2));
    ctx.fillStyle = o.bg || 'rgba(4,7,14,0.88)';
    ctx.fill();
    if (o.border) {
        ctx.strokeStyle = o.border;
        ctx.lineWidth = o.borderWidth || 2;
        ctx.stroke();
    }

    ctx.fillStyle = o.typedColor || '#00e5ff';
    ctx.fillText(typed, px + padX, o.y);
    ctx.fillStyle = o.restColor || '#ffffff';
    ctx.fillText(rest, px + padX + ctx.measureText(typed).width, o.y);
    ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

/** A starfield sized to the canvas. Regenerate on resize, not every frame. */
export function makeStars(w, h, count, rand = Math.random) {
    const stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: rand() * w,
            y: rand() * h * 0.7,
            r: rand() * 1.4 + 0.2,
            phase: rand() * Math.PI * 2,
            speed: 0.6 + rand() * 1.4,
        });
    }
    return stars;
}

/** ⚠️ TWINKLE IS A FUNCTION OF ELAPSED TIME, NOT OF FRAME COUNT. */
export function drawStars(ctx, stars, tSec) {
    ctx.save();
    for (const s of stars) {
        ctx.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(s.phase + tSec * s.speed));
        ctx.fillStyle = '#dceaff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

/**
 * A particle burst. Lives are in SECONDS and updates take a delta, so the burst
 * lasts the same wall time on any refresh rate.
 */
export function burst(list, x, y, color, n = 18, speed = 180, rand = Math.random) {
    for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2;
        const s = speed * (0.3 + rand() * 0.7);
        list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4 + rand() * 0.5, max: 0.9, color });
    }
}

export function updateParticles(list, dt) {
    for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 40 * dt;
        p.life -= dt;
        if (p.life <= 0) list.splice(i, 1);
    }
}

export function drawParticles(ctx, list) {
    ctx.save();
    for (const p of list) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.max));
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.restore();
}

// ═════════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY AND MOTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️⚠️ DOES THIS STUDENT WANT FULL-SCREEN FLASHES? ASK BEFORE DRAWING ONE.
 *
 * All three prototypes — and the first draft of both shipped views — answered a
 * hit with a 40%-alpha red vignette across the entire canvas. In a room of thirty
 * twelve-year-olds that is a photosensitivity risk, and it is not a hypothetical
 * one: repeated large-area luminance flashes are the exact pattern seizure
 * guidance names. ⚠️ THIS IS THE ONE ITEM IN THE POLISH LIST THAT WAS A BLOCKER
 * RATHER THAN A NICETY.
 *
 * ⚠️ IT IS READ FRESH, NOT CACHED AT MOUNT. A student can change the OS setting
 * mid-session, and a cached answer would keep flashing at someone who just asked
 * it to stop.
 */
export function prefersReducedMotion() {
    try {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (_) {
        // ⚠️ AN ENVIRONMENT THAT CANNOT ANSWER GETS THE SAFE ANSWER. A harness,
        // an old WebView or a locked-down MDM browser should not be treated as
        // consent to flash the screen.
        return true;
    }
}

/**
 * Hit feedback that degrades instead of disappearing.
 *
 * Full motion: a brief red vignette, capped well below the prototype's alpha and
 * concentrated at the edges rather than over the play area.
 * Reduced motion: a static border band, no luminance change across the middle of
 * the screen — the student still knows they were hit.
 *
 * @param {number} t  0..1, remaining intensity
 */
export function drawHitFeedback(ctx, w, h, t) {
    if (t <= 0) return;
    const reduce = prefersReducedMotion();
    ctx.save();
    if (reduce) {
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ff4466';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, w - 6, h - 6);
    } else {
        // ⚠️ A RADIAL VIGNETTE, TRANSPARENT AT THE CENTRE. The play area — where
        // the student is reading words — does not change luminance at all.
        const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25,
                                           w / 2, h / 2, Math.max(w, h) * 0.62);
        g.addColorStop(0, 'rgba(255,34,68,0)');
        g.addColorStop(1, `rgba(255,34,68,${Math.min(0.30, t * 0.9).toFixed(3)})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
}

/** Particle counts scale down under reduced motion. */
export function motionScale() {
    return prefersReducedMotion() ? 0.25 : 1;
}

/**
 * ⚠️⚠️ THE CAPS LOCK WARNING. learn.js has one; the games had none, and matching
 * is case-sensitive — so a student with Caps Lock on fails EVERY keystroke and
 * has no idea why. They conclude the game is broken, which is the Word Muncher
 * STUCK failure in a new costume: the machine appears not to work and no
 * explanation is offered.
 *
 * ⚠️ DETECTED FROM THE KEY EVENT, NOT TRACKED. `getModifierState` reports the
 * real OS state, so it is correct on the first keystroke and after an alt-tab;
 * a flag toggled on keydown of 'CapsLock' would be wrong for both.
 */
export function drawCapsWarning(ctx, w, y) {
    platedText(ctx, {
        x: w / 2, y: y == null ? 46 : y,
        text: 'CAPS LOCK IS ON',
        font: 'bold 15px "Courier Prime", monospace',
        color: '#ffd166', bg: 'rgba(48,30,4,0.95)', border: '#ffd166',
        padX: 14, padY: 7,
    });
}
