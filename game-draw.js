// game-draw.js v1.0.0 — CANVAS HELPERS SHARED BY ALL THREE ARCADE VIEWS.
// Round 82 (Victor).
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
