// game-draw.js v1.10.0 — Round 109 (Bar-Let): drawShatterPanel() — a radar over a
//   warp meter. ⚠️⚠️ THE TWO HALVES ARE DELIBERATELY UNEQUAL. Jake: the radar is
//   *"just window dressing - nothing of importance. Only the 'Can I warp yet?'
//   bar is important."* A future round that labels the contacts has turned window
//   dressing into a second place to look during play.
// game-draw.js v1.9.0 — Round 108 (Bar-Let): drawWavePreview(), and Shift is two
//   REAL KEYS on the bottom row instead of a line of text over the space bar.
//   ⚠️⚠️ ONLY THE OPPOSITE HAND'S SHIFT LIGHTS UP — a capital is typed with the
//   hand that is NOT holding Shift, so lighting both would teach the one-handed
//   claw this strip exists to prevent. The hand comes from keyboard.js's finger
//   map, never from a list of letters here.
//   ⚠️ drawWavePreview() ANSWERS "WHAT AND HOW SOON" AND REFUSES "WHERE". Jake:
//   *"previews what's coming, but not where."* Deadline's radar shows position
//   because its threat IS a position; Escape Key's threat is a KIND. A future
//   round that adds a spawn-edge indicator has changed the game.
// the run is passed, because a bar pinned at 100% reports nothing.
// game-draw.js v1.7.0 — Round 101: the BANKED bank sizes and spaces itself to
// the console's spare height, and the keyboard shows BOTH halves of an error —
// the key the student needed (swelling) and the key they hit (blinking).
// game-draw.js v1.6.0 — playfield countdown overlay; BANKED becomes a
// seven-segment readout, Round 100b.
// game-draw.js v1.5.0 — the threat board, Round 100 (Franklin).
// game-draw.js v1.4.0 — Round 99 (Franklin): the scope stops being pixellated,
// the console becomes a console, and seven-segment digits are drawn rather than
// downloaded. See drawSevenSeg(), drawRadar() and drawGauges() headers.
// game-draw.js v1.3.0 — keyStates added Round 90 (miss/fixed key colouring).
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

// ⚠️ THE PREVIEW PANEL DRAWS THE REAL CREATURES. Three coloured dots would need
// a legend, and a legend is something a twelve-year-old has to learn instead of
// a picture they already know from the board.
import { ENEMY_SPRITES, ENEMY_PALETTES, drawPixelSprite } from './game-sprites.js';

export const GAME_DRAW_VERSION = '1.10.0';

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
 *   missPulse  {object}   OPTIONAL {key, age} — the key the student NEEDED,
 *                         swelling and settling over KEY_MISS_PULSE_MS
 *   hitFlash   {object}   OPTIONAL {key, age} — the key they actually HIT,
 *                         blinking red over KEY_HIT_FLASH_MS
 *   progress   {number}   0..1, drawn as a bar under the right flank; null to omit
 *
 * ⚠️⚠️ THE TWO FEEDBACK CHANNELS ARE DIFFERENT SHAPES ON PURPOSE (Round 101).
 * Jake: *"Maybe even pulsate larger with the missed key hit (so that the user
 * can SEE that they're forgetting the period)."* The keyStates memory already
 * turned the needed key red, and a child who is skipping every full stop still
 * missed it, because a static tint two rows down does not catch an eye that is
 * on a falling word. So the NEEDED key GROWS — motion, where the memory was
 * static — and the key they actually pressed BLINKS and is gone. ⚠️ IF THESE
 * EVER BECOME THE SAME EFFECT THE FEATURE IS DEAD: the student would see two red
 * keys and no way to tell which one they were supposed to press.
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

    // ── the two error signals (Round 101) ───────────────────────────────────
    // ⚠️ AGE COMES IN, NOT A TIMESTAMP. This function is handed everything it
    // draws and reads no clock of its own — the same rule drawCountdownOverlay()
    // follows, and the reason a harness can render either of them deterministically.
    const fx = (spec, span) => {
        if (!spec || spec.key == null || !(spec.age >= 0) || spec.age > span) return null;
        return { key: String(spec.key).toLowerCase(), t: 1 - spec.age / span };
    };
    const pulse = fx(o.missPulse, LAY.KEY_MISS_PULSE_MS);
    const flash = fx(o.hitFlash, LAY.KEY_HIT_FLASH_MS);
    // ⚠️ REDUCED MOTION DROPS THE GROWTH, NEVER THE COLOUR. A student who cannot
    // have the movement must still be told which key they missed.
    const grow = prefersReducedMotion() ? 0 : LAY.KEY_MISS_PULSE_SCALE;
    /** Geometry of the pulsing key, drawn AFTER the board so it sits over its neighbours. */
    let pulseAt = null;

    /** The red blink on the key they actually pressed. Returns an alpha, or 0. */
    const flashAlpha = ch => (flash && flash.key === ch ? 0.15 + 0.75 * flash.t : 0);

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
            const fa = flashAlpha(ch);
            const keyCol = fa ? LAY.KEY_MISS_INK
                        : st === 'miss' ? LAY.KEY_MISS_INK
                        : st === 'fixed' ? '#7fb8ff' : col;
            if (pulse && pulse.key === ch) pulseAt = { x, y, ch, col: LAY.KEY_MISS_INK };
            roundRect(ctx, x, y, keyW, keyH, 4);
            ctx.fillStyle = keyCol;
            // ⚠️ THE RESTING TINT IS FAINT BUT NOT INVISIBLE. At 0.05 the board
            // rendered as uniform grey and the colours — the entire reason a
            // beginner needs this strip — conveyed nothing.
            // A missed key sits brighter than a resting one even when it is not
            // the current target, or it is only findable by hunting for it.
            ctx.globalAlpha = fa ? fa
                : isWant ? LAY.KEY_ALPHA_ACTIVE
                : (st === 'miss' ? LAY.KEY_ALPHA_MISSED
                : st === 'fixed' ? LAY.KEY_ALPHA_FIXED : LAY.KEY_ALPHA_RESTING);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = isWant && !fa ? '#ffffff' : keyCol;
            ctx.lineWidth = isWant || st === 'miss' || fa ? 2 : 1;
            ctx.globalAlpha = isWant ? 1 : 0.75;
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.fillStyle = isWant ? '#04070d' : '#e8f2fa';
            ctx.globalAlpha = isWant ? 1 : 0.9;
            ctx.fillText(ch.toUpperCase(), x + keyW / 2, y + keyH / 2 + 0.5);
            ctx.globalAlpha = 1;
        });

        // ⚠️⚠️ SHIFT FLANKS THE BOTTOM ROW, ON BOTH SIDES, WHICH IS WHERE IT IS
        // ON THE MACHINE UNDER THEIR HANDS. It used to be a line of text over the
        // space bar reading "⇧ SHIFT + A" — that says Shift exists but not where
        // it is or which hand takes it, and those are the only two things a
        // beginner needs.
        // ⭐⭐ ONLY THE OPPOSITE HAND'S SHIFT LIGHTS UP. A capital is typed with
        // the hand that is NOT holding Shift, so lighting both would teach the
        // habit this strip exists to prevent — the one-handed claw. The needed
        // letter's own finger decides: a left-hand letter lights the RIGHT Shift.
        if (r === 2 && rows.length >= 3) {
            const sw = keyW * LAY.KB_SHIFT_WIDTH;
            const lx = originX + indent - sw - pad;
            const rx = originX + indent + rowChars.length * (keyW + pad);
            // ⚠️ THE HAND COMES FROM keyboard.js's FINGER MAP, not from a list of
            // letters here — a fourth copy of that map is exactly the Rule 9
            // shape this project keeps finding. Fingers 0–3 are the left hand.
            const fi = wantLower == null ? -1 : fingerIndexOfChar(wantLower);
            const wantLeftShift = shifted && fi >= 4;
            const wantRightShift = shifted && fi >= 0 && fi < 4;
            for (const sk of [{ x: lx, on: wantLeftShift }, { x: rx, on: wantRightShift }]) {
                // ⚠️ THE SHIFT KEYS ARE PINKY KEYS AND TAKE THE PINKY COLOUR from
                // the shared map, so they match the rest of the row's logic.
                const scol = fingerColorOf(sk.x === lx ? 'a' : ';');
                roundRect(ctx, sk.x, y, sw, keyH, 4);
                ctx.fillStyle = scol;
                ctx.globalAlpha = sk.on ? 0.95 : 0.16;
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.strokeStyle = sk.on ? '#ffffff' : scol;
                ctx.lineWidth = sk.on ? 2 : 1;
                ctx.globalAlpha = sk.on ? 1 : 0.75;
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.save();
                ctx.font = 'bold ' + Math.max(9, Math.floor(keyH * 0.34)) + 'px "Courier Prime", monospace';
                ctx.fillStyle = sk.on ? '#04070d' : '#e8f2fa';
                ctx.globalAlpha = sk.on ? 1 : 0.9;
                ctx.fillText('\u21e7', sk.x + sw / 2, y + keyH / 2 + 0.5);
                ctx.restore();
                ctx.globalAlpha = 1;
            }
        }

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
    // ⚠️ THE SPACE BAR CARRIES THE ERROR STATES TOO (Round 101). It did not
    // before, and it is the one key on the board a student can be told to press
    // MID-word and miss — a space between two words in a sentence target. A key
    // that can be wanted but can never look wrong teaches nothing when it is.
    const spaceSt = states[' '];
    const spaceFa = flashAlpha(' ');
    if (pulse && pulse.key === ' ') pulseAt = { x: sx, y: sy, w: sw, ch: ' ', col: LAY.KEY_MISS_INK };
    roundRect(ctx, sx, sy, sw, keyH, 4);
    ctx.fillStyle = spaceFa || spaceSt === 'miss' ? LAY.KEY_MISS_INK
                  : wantSpace ? '#cfe6f5' : 'rgba(255,255,255,0.05)';
    ctx.globalAlpha = spaceFa ? spaceFa
                    : spaceSt === 'miss' ? LAY.KEY_ALPHA_MISSED : 1;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = spaceFa || spaceSt === 'miss' ? LAY.KEY_MISS_INK
                    : wantSpace ? '#ffffff' : 'rgba(200,225,245,0.45)';
    ctx.lineWidth = wantSpace || spaceSt === 'miss' || spaceFa ? 2 : 1;
    ctx.stroke();

    // ⚠️ THE SPACE-BAR ANNOUNCEMENT IS GONE — Shift is drawn as two real keys on
    // the bottom row now. ⚠️⚠️ DO NOT RE-ADD THE TEXT ALONGSIDE THEM: two signals
    // for one fact is the shape Round 101 spent a whole section untangling, and
    // here the text would be over the space bar while the lit key is two rows
    // down, so a student would be told to look in two places at once.

    // ── the key they NEEDED, swelling (Round 101) ───────────────────────────
    //
    // ⚠️⚠️ DRAWN LAST, AND THAT IS NOT A STYLE CHOICE. A key scaled up in place
    // overlaps its neighbours; drawn inside the row loop it would be painted
    // over by every key after it in the row and clipped on one side only, which
    // reads as a rendering fault rather than as emphasis.
    // ⚠️ IT SHRINKS TOWARD ITS RESTING SIZE, IT DOES NOT FLASH. One swell per
    // error, settling — not a repeating strobe. See KEY_MISS_PULSE_MS.
    if (pulseAt) {
        const kw = pulseAt.w || keyW;
        const s = 1 + grow * pulseAt.t;
        const dw = kw * s, dh = keyH * s;
        const dx = pulseAt.x + (kw - dw) / 2, dy = pulseAt.y + (keyH - dh) / 2;
        ctx.save();
        roundRect(ctx, dx, dy, dw, dh, 4 * s);
        ctx.fillStyle = pulseAt.col;
        ctx.globalAlpha = 0.35 + 0.5 * pulseAt.t;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = pulseAt.col;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (pulseAt.ch !== ' ') {
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold ' + Math.max(10, Math.floor(keyH * 0.42 * s)) +
                       'px "Courier Prime", monospace';
            ctx.fillText(String(pulseAt.ch).toUpperCase(), dx + dw / 2, dy + dh / 2 + 0.5);
        }
        ctx.restore();
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

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SEVEN-SEGMENT DIGITS, DRAWN. Round 99.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Jake, 2026-09-09, with a photograph of a red LED wall clock: *"Traditional
 * digital readouts would probably work better, especially if you use that for
 * the gauges above... I'm thinking a font like the one attached."*
 *
 * ⚠️⚠️ NOT A WEBFONT, AND THE REASON IS THE CLASSROOM. A seven-segment font is a
 * network dependency on a page a child opens on a Chromebook behind a district
 * filter — and canvas does not wait for fonts. `ctx.fillText` with an unloaded
 * family silently draws in the fallback, so the one element on this panel whose
 * appearance depended on the wifi holding would be the clock. This has no
 * dependency and therefore cannot fall back.
 *
 * ⚠️ THE UNLIT SEGMENTS ARE DRAWN. On the real clock every segment that is off
 * is still visible, and that is most of what makes an LED panel look like one.
 * It is also functional: the digit box keeps its shape as the value changes, so
 * nothing on the panel reflows when 9 becomes 10.
 *
 * ⚠️ IT RENDERS DIGITS, COLON, MINUS AND SPACE — NOTHING ELSE. An unmapped
 * character draws as a blank digit rather than throwing or silently vanishing.
 * ⭐ SO IT MAY ONLY BE HANDED SOMETHING ALREADY NUMERIC. The minutes totals on
 * this panel are formatted strings ("1h 20m") that come from ONE formatter in
 * game-deadline.js, and they stay in plain monospace for exactly that reason —
 * teaching this function to render an 'h' would be the second formatter that
 * file's own comment warns about.
 */
const SEG_ON = {
    //         a  b  c  d  e  f  g
    '0': [1, 1, 1, 1, 1, 1, 0],
    '1': [0, 1, 1, 0, 0, 0, 0],
    '2': [1, 1, 0, 1, 1, 0, 1],
    '3': [1, 1, 1, 1, 0, 0, 1],
    '4': [0, 1, 1, 0, 0, 1, 1],
    '5': [1, 0, 1, 1, 0, 1, 1],
    '6': [1, 0, 1, 1, 1, 1, 1],
    '7': [1, 1, 1, 0, 0, 0, 0],
    '8': [1, 1, 1, 1, 1, 1, 1],
    '9': [1, 1, 1, 1, 0, 1, 1],
    '-': [0, 0, 0, 0, 0, 0, 1],
    ' ': [0, 0, 0, 0, 0, 0, 0],
};

/** A horizontal bar as a hexagon, so the segments mitre against each other. */
function segH(cx, cy, len, t) {
    const h = len / 2, q = t / 2;
    return [[cx - h, cy], [cx - h + q, cy - q], [cx + h - q, cy - q],
            [cx + h, cy], [cx + h - q, cy + q], [cx - h + q, cy + q]];
}
function segV(cx, cy, len, t) {
    const h = len / 2, q = t / 2;
    return [[cx, cy - h], [cx + q, cy - h + q], [cx + q, cy + h - q],
            [cx, cy + h], [cx - q, cy + h - q], [cx - q, cy - h + q]];
}
function segPolys(x, y, w, h, t) {
    const L = w - t * 1.15;
    const M = (h - t * 1.7) / 2;
    const upper = y + t / 2 + M / 2 + t * 0.1;
    const lower = y + h - t / 2 - M / 2 - t * 0.1;
    return [
        segH(x + w / 2, y + t / 2, L, t),          // a  top
        segV(x + w - t / 2, upper, M, t),          // b  upper right
        segV(x + w - t / 2, lower, M, t),          // c  lower right
        segH(x + w / 2, y + h - t / 2, L, t),      // d  bottom
        segV(x + t / 2, lower, M, t),              // e  lower left
        segV(x + t / 2, upper, M, t),              // f  upper left
        segH(x + w / 2, y + h / 2, L, t),          // g  middle
    ];
}

/** Width a string will occupy at a given digit height. */
export function sevenSegWidth(text, h) {
    const dw = h * LAY.SEG_ASPECT, cw = h * 0.30, gap = h * 0.12;
    let w = 0;
    const s = String(text == null ? '' : text);
    for (let i = 0; i < s.length; i++) {
        w += (s[i] === ':' ? cw : dw) + (i === s.length - 1 ? 0 : gap);
    }
    return w;
}

/**
 * @param {object} o
 *   x, y   {number} top-left, or the anchor when `align` is set
 *   h      {number} digit height; everything else derives from it
 *   text   {string} digits, ':', '-' and ' ' only
 *   color  {string} the lit colour; unlit segments are the same hue, faint
 *   align  {'left'|'center'|'right'}
 */
export function drawSevenSeg(ctx, o) {
    const h = o.h, t = h * LAY.SEG_THICK;
    const dw = h * LAY.SEG_ASPECT, cw = h * 0.30, gap = h * 0.12;
    const text = String(o.text == null ? '' : o.text);
    const total = sevenSegWidth(text, h);
    let x = o.align === 'center' ? o.x - total / 2
          : o.align === 'right'  ? o.x - total
          : o.x;
    const ink = o.color || '#ff5a4a';

    ctx.save();
    for (const ch of text) {
        if (ch === ':') {
            ctx.fillStyle = ink;
            for (const cy of [o.y + h * 0.33, o.y + h * 0.67]) {
                ctx.beginPath();
                ctx.arc(x + cw / 2, cy, t * 0.45, 0, Math.PI * 2);
                ctx.fill();
            }
            x += cw + gap;
            continue;
        }
        const on = SEG_ON[ch] || SEG_ON[' '];
        const polys = segPolys(x, o.y, dw, h, t);
        ctx.fillStyle = ink;
        for (let i = 0; i < 7; i++) {
            ctx.globalAlpha = on[i] ? 1 : LAY.SEG_UNLIT_ALPHA;
            const p = polys[i];
            ctx.beginPath();
            ctx.moveTo(p[0][0], p[0][1]);
            for (let k = 1; k < p.length; k++) ctx.lineTo(p[k][0], p[k][1]);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        x += dw + gap;
    }
    ctx.restore();
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE RADAR — READ-AHEAD, AND NOTHING ELSE. Round 95; rebuilt Round 99.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Jake: *"Radar as read ahead. Even two words ahead would be helpful."* He
 * explicitly declined a scope a student could type off — that would make the
 * city, the shields and the three-deep overlap decorative, which is most of the
 * game.
 *
 * ⚠️⚠️ SO IT MUST NOT LOOK TYPABLE. The rule drawKeyboardStrip() already states
 * about the humble NEXT preview applies here with far more force: *"a second
 * thing that looks typable is worse than no preview at all."* No plate, no box,
 * no lock highlight, no colour that matches a live target, and dimmer than
 * anything in the sky. If a student starts typing at this panel, the design has
 * failed regardless of how it looks.
 *
 * ⚠️⚠️ ROUND 99 UNDID ROUND 97 HERE, ON JAKE'S CORRECTION, AND THE CORRECTION IS
 * WORTH KEEPING. Round 97 snapped every line on this panel to a 4px lattice
 * because he asked for *"more chunky pixels"*. Seeing it: *"The left panel radar
 * grid is pixellated, which is weird... I'd like that all clean, traditional
 * pale green lines."* Then, unprompted: *"when I wanted it chunkier, I was
 * referring to the overall look, and especially the right card. I did not
 * actually specify that, though, so you delivered a version of what I said."*
 * ⭐ THE LESSON IS NOT "ASK MORE QUESTIONS". It is that a style instruction has
 * a SCOPE, and the scope was inferable from the thing being styled: this panel
 * is the WINDOW and the right card is the CONSOLE. Lattice the console.
 *
 * ⚠️⚠️ AND NO SWEEPING LINE, EVER. A rotating bright line across a 200px panel
 * is a periodic large-area flash in front of thirty twelve-year-olds — the same
 * reason drawHitFeedback() stopped doing a full-screen fill. Static arcs. Now
 * that the panel looks like a real scope this will be more tempting, not less.
 *
 * ⚠️⚠️ A CONTACT NEVER FADES. Round 95 ramped each contact's alpha over its
 * first slice of descent, and with several words alive the panel appeared to
 * wash in and out — Jake: *"Each word fades out the whole grid, too, making it
 * impossible to actually start typing the next possible word."* The only thing
 * on this panel with a variable alpha is the not-yet-spawned inbound word, and
 * `prefers-reduced-motion` freezes even that.
 *
 * ⚠️ IT KNOWS NOTHING ABOUT PLAY GEOMETRY. Contacts arrive pre-normalised
 * (`nx` 0..1 across, `ny` 0..1 down, where 1 is impact) so no lane, no shield
 * measurement and no impact test is reachable from here — the same reason the
 * panels are sibling canvases rather than an inset rect.
 *
 * @param {object} o  W, H, contacts:[{text,typed,nx,ny}], inbound:string|null,
 *                    inboundProgress:number
 */
export function drawRadar(ctx, o) {
    const { W, H } = o;
    const pad = LAY.RADAR_PAD;
    const still = prefersReducedMotion();
    const clamp01 = v => Math.max(0, Math.min(1, v || 0));

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.lineCap = 'round';

    // ── the coordinate system, which is the game's own ──────────────────────
    // ny = 0 is the top edge of the play canvas; ny = 1 is impact. The band
    // above `topRow` is OUTSIDE the screen and holds the inbound word.
    const band = LAY.RADAR_PREVIEW_BAND;
    const topRow = pad + band;
    const originY = H - pad;
    const span = Math.max(1, originY - topRow);
    const cx = W / 2;
    const rowY = ny => topRow + clamp01(ny) * span;

    // ⚠️ THE INNERMOST ARC IS FLOORED AWAY FROM THE ORIGIN. `ny = 1` IS the
    // origin, so an arc through it would have no height at all and the lowest
    // ring would be invisible. Floored, it also reads as the thing it marks.
    const ringRow = ny => Math.min(rowY(ny), originY - span * LAY.RADAR_DOME_ARC_MIN);

    // ── the three rings, named for what they are ────────────────────────────
    //
    // Jake: *"You have three rings on there - lowest should be dome, second
    // should be midway up the screen, third should be screen, and above that
    // should be the preview/incoming word that isn't on the screen yet."*
    //
    // ⚠️ SHALLOW PARALLEL ARCS, NOT NESTED CIRCLES. Concentric circles centred
    // on the origin would put the middle ring across only half the panel's
    // width, while a contact's `nx` uses the whole of it — so a word could sit
    // visibly outside the ring whose depth it actually occupies. The arcs droop
    // by a fixed fraction, so every ring spans the full width, none crosses
    // another, and a pip above a line is genuinely nearer the screen than it.
    const DROOP = 0.045;
    const arc = (y0, w) => {
        const dy = span * DROOP;
        ctx.strokeStyle = LAY.RADAR_LINE;
        ctx.lineWidth = w == null ? LAY.RADAR_LINE_W : w;
        ctx.beginPath();
        ctx.moveTo(pad, y0 + dy);
        ctx.quadraticCurveTo(cx, y0 - dy, W - pad, y0 + dy);
        ctx.stroke();
    };
    const tag = (y0, text) => {
        ctx.font = '8px "Courier Prime", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = LAY.RADAR_LABEL;
        ctx.fillText(text, pad + 1, y0 - 3);
    };

    const rings = [
        [LAY.RADAR_RING_SCREEN, 'SCREEN'],
        [LAY.RADAR_RING_MID, 'MIDWAY'],
        [LAY.RADAR_RING_DOME, 'DOME'],
    ];
    for (const [ny, label] of rings) {
        const y0 = ringRow(ny);
        arc(y0, ny === LAY.RADAR_RING_DOME ? LAY.RADAR_LINE_W + 0.6 : LAY.RADAR_LINE_W);
        tag(y0, label);
    }

    // Bearing line and two shallow spokes. Static furniture, nothing moving.
    ctx.strokeStyle = LAY.RADAR_LINE;
    ctx.lineWidth = LAY.RADAR_LINE_W;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(cx, topRow); ctx.lineTo(cx, originY);
    ctx.moveTo(cx, originY); ctx.lineTo(pad + (W - pad * 2) * 0.16, topRow);
    ctx.moveTo(cx, originY); ctx.lineTo(W - pad - (W - pad * 2) * 0.16, topRow);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── contacts ────────────────────────────────────────────────────────────
    //
    // ⚠️ `ghost` IS THE WHOLE SAFETY PROPERTY OF THIS PANEL: SOLID MEANS "IN
    // THE SKY", HOLLOW MEANS "NOT YET". A student must never mistake the
    // preview for something already typable, and a hollow ring is the one
    // distinction that survives being glanced at.
    const plot = (c, alpha, ghost, yAt) => {
        // ⚠️ `yAt` EXISTS FOR THE INBOUND WORD AND FOR NOTHING ELSE. It sits
        // ABOVE the screen ring, which is a negative depth; rowY() clamps to
        // 0..1, so without an override the preview would be drawn ON the ring
        // and read as arrived — the one thing this panel must never say.
        const y = yAt == null ? rowY(c.ny) : yAt;
        const x = pad + clamp01(c.nx) * (W - pad * 2);
        const r = LAY.RADAR_PIP_R;
        ctx.globalAlpha = alpha;
        if (ghost) {
            ctx.strokeStyle = LAY.RADAR_PIP;
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        } else {
            ctx.fillStyle = LAY.RADAR_PIP;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.font = '11px "Courier Prime", monospace';
        const right = x > W * 0.58;
        ctx.textAlign = right ? 'right' : 'left';
        const tx = x + (right ? -(r + 4) : (r + 4));
        const typed = (c.text || '').slice(0, c.typed || 0);
        const rest = (c.text || '').slice(c.typed || 0);
        if (!right) {
            ctx.fillStyle = LAY.RADAR_TYPED; ctx.fillText(typed, tx, y + 4);
            ctx.fillStyle = LAY.RADAR_INK;
            ctx.fillText(rest, tx + ctx.measureText(typed).width, y + 4);
        } else {
            ctx.fillStyle = LAY.RADAR_INK; ctx.fillText(rest, tx, y + 4);
            ctx.fillStyle = LAY.RADAR_TYPED;
            ctx.fillText(typed, tx - ctx.measureText(rest).width, y + 4);
        }
        ctx.globalAlpha = 1;
    };

    // ⚠️ FULL STRENGTH, ALWAYS. See the header — the fade was the defect.
    for (const c of (o.contacts || [])) plot(c, LAY.RADAR_CONTACT_ALPHA, false);

    // ⭐ ONE WORD MORE THAN THE SKY HOLDS, PARKED OUTSIDE THE SCREEN RING. Jake:
    // *"they should be fading in before they even show up on the play screen -
    // it's a preview of what's coming for kids who type a little faster than
    // the floor."* And Round 99: *"even during the countdown, there should be a
    // word coming in the edge of that screen."* It brightens as its spawn
    // approaches, so a fast student reads it before it exists.
    // ⚠️ ITS x IS UNKNOWN UNTIL IT SPAWNS, so it is centred, not guessed — a pip
    // that jumped sideways on spawn would teach a position that is a lie.
    if (o.inbound) {
        ctx.font = '8px "Courier Prime", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = LAY.RADAR_LABEL;
        ctx.fillText('INBOUND', pad + 1, pad + 8);
        const p = still ? 0.72
            : Math.max(LAY.RADAR_INBOUND_MIN_ALPHA, clamp01(o.inboundProgress)) * 0.85;
        plot({ text: o.inbound, typed: 0, nx: 0.5, ny: 0 }, p, true, pad + band * 0.55);
    }
    ctx.restore();
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE CONSOLE. Round 95; rebuilt Round 99.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Jake, 2026-09-09, and this paragraph is the whole specification:
 * *"But looking at this should not make you feel like the space is not
 * intentionally used. We're looking out a window on the field of battle, and the
 * space on either side is the console itself. we wouldn't leave parts of it bare
 * - we'd have information, or buttons, or lights, or something helping us make
 * battle decisions. This is a battle station, not a computer game."*
 *
 * ⚠️⚠️ SO EVERY ITEM HERE HAS TO EARN ITS PLACE, AND "FILLING SPACE" IS NOT A
 * JOB. The temptation this brief creates is decorative lamps — a bare panel and
 * a panel of meaningless lights are both failures, and the second one is worse
 * because it teaches a child to stop reading the panel. Everything drawn below
 * is a number the student can act on: how fast they are going, whether that
 * clears the gate, how much of the run is left, and how long they have been at
 * it.
 *
 * ⚠️ THE RING AND THE BAR IN EACH UNIT ARE NOT THE SAME READING TWICE. The ring
 * is the VALUE; the bar is that value against the GATE, with the gate marked.
 * Round 95 had to delete a duplicated readout for precisely this reason (the
 * strip flanks and this panel printing one WPM six inches apart), so the test is
 * not "do they look different" but "does either become unreadable if the other
 * is removed". Take the bar away and the target disappears.
 *
 * ⚠️ RUN STATS AND REAL TOTALS KEEP THEIR DIFFERENT TREATMENTS. A child must not
 * read "28 WPM" and "14m today" as two facts of the same kind: one is this run
 * and resets, one is their week and does not. Dials above the rule, plain text
 * below it.
 */
export function drawGauges(ctx, o) {
    const { W, H } = o;
    const cell = LAY.GAUGE_CELL, gap = LAY.GAUGE_CELL_GAP, segs = LAY.GAUGE_SEGMENTS;
    ctx.clearRect(0, 0, W, H);
    ctx.save();

    const x = 12, w = W - 24;
    let y = 12;

    // ── the bezel ───────────────────────────────────────────────────────────
    // Corner brackets rather than a full box: a closed rectangle inside a card
    // that already has a border reads as a mistake, and the brackets are what
    // make this a panel bolted into a console rather than a list of numbers.
    (() => {
        const L = 14, ox = 3, oy = 3;
        ctx.strokeStyle = 'rgba(120,170,220,0.30)';
        ctx.lineWidth = 1;
        const corner = (px, py, dx, dy) => {
            ctx.beginPath();
            ctx.moveTo(px + dx * L, py);
            ctx.lineTo(px, py);
            ctx.lineTo(px, py + dy * L);
            ctx.stroke();
        };
        corner(ox, oy, 1, 1);
        corner(W - ox, oy, -1, 1);
        corner(ox, H - oy, 1, -1);
        corner(W - ox, H - oy, -1, -1);
    })();

    const label = (lx, ly, text, align, color, size) => {
        ctx.textAlign = align || 'left';
        ctx.font = (size ? size : 9) + 'px "Courier Prime", monospace';
        ctx.fillStyle = color || LAY.GAUGE_LABEL;
        ctx.fillText(text, lx, ly);
    };

    /**
     * One segmented lamp bar, optionally with a stoplight zone split.
     *
     * ⚠️ SEGMENTS QUANTISE, AND THAT IS THE POINT — a value lands on a lamp or
     * it does not, so the meter ticks instead of creeping. A smooth bar reads as
     * modern; this reads as a machine with lamps in it.
     * ⚠️ THE LIT COUNT ROUNDS DOWN, NEVER UP: a meter showing the last lamp at
     * 96% would be claiming a target was met when it was not.
     * ⚠️ `zone` IS null WHEN THERE IS NO GATE, and then NO lamp is tinted. A
     * drill run carries no speed gate (run-grade.js returns `minWPM: null`), and
     * painting one red would invent a failure learn.js deliberately refuses to
     * report.
     */
    const lampBar = (bx, by, bw, frac, zone, ink) => {
        const cw = (bw - (segs - 1) * gap) / segs;
        const lit = Math.floor(Math.max(0, Math.min(1, frac)) * segs);
        for (let i = 0; i < segs; i++) {
            const at = (i + 0.5) / segs;
            const base = zone == null ? ink
                : at < zone ? LAY.GAUGE_RED : LAY.GAUGE_GREEN;
            ctx.fillStyle = i < lit ? base : LAY.GAUGE_UNLIT;
            if (i >= lit && zone != null) {
                // An unlit lamp still shows which zone it belongs to, faintly —
                // that is what "delineate the different targets visually on the
                // bar" asks for, and it works before the run has any value.
                ctx.globalAlpha = 0.22;
                ctx.fillStyle = base;
            }
            ctx.fillRect(bx + i * (cw + gap), by, cw, LAY.GAUGE_BAR_H);
            ctx.globalAlpha = 1;
        }
        return cw;
    };

    /** Tick marks above a bar, with a taller bright one on the gate. */
    const ticks = (bx, by, bw, zone) => {
        ctx.strokeStyle = 'rgba(120,170,220,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const f of [0, 0.25, 0.5, 0.75, 1]) {
            const tx = Math.round(bx + bw * f) + 0.5;
            ctx.moveTo(tx, by); ctx.lineTo(tx, by + LAY.GAUGE_TICK_H);
        }
        ctx.stroke();
        if (zone != null) {
            const tx = Math.round(bx + bw * Math.max(0, Math.min(1, zone))) + 0.5;
            ctx.strokeStyle = LAY.GAUGE_AMBER;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(tx, by - 2); ctx.lineTo(tx, by + LAY.GAUGE_BAR_H + 6);
            ctx.stroke();
        }
    };

    /**
     * A segmented ring face. Lamps, not a needle — the same quantisation rule
     * as the bars, so the two halves of a unit agree about what "one step" is.
     */
    const ring = (rcx, rcy, frac, pass, ink) => {
        const n = LAY.GAUGE_RING_SEGS;
        const r0 = LAY.GAUGE_RING_D / 2 - LAY.GAUGE_RING_W;
        const r1 = LAY.GAUGE_RING_D / 2;
        const start = Math.PI * 0.75, sweep = Math.PI * 1.5;
        const lit = Math.floor(Math.max(0, Math.min(1, frac)) * n);
        const step = sweep / n;
        for (let i = 0; i < n; i++) {
            const a0 = start + i * step + step * LAY.GAUGE_RING_GAP * 0.5;
            const a1 = start + (i + 1) * step - step * LAY.GAUGE_RING_GAP * 0.5;
            ctx.beginPath();
            ctx.arc(rcx, rcy, r1, a0, a1);
            ctx.arc(rcx, rcy, r0, a1, a0, true);
            ctx.closePath();
            ctx.fillStyle = i < lit ? (pass === false ? LAY.GAUGE_RED : ink) : LAY.GAUGE_UNLIT;
            ctx.fill();
        }
    };

    /**
     * ⚠️ ONE UNIT = ONE QUANTITY. `target` may be null, and then nothing on the
     * unit is coloured by pass/fail and no gate tick is drawn.
     */
    const unit = (uy, name, value, text, max, target, ink) => {
        const d = LAY.GAUGE_RING_D;
        const rcx = x + d / 2, rcy = uy + d / 2;
        const frac = max > 0 ? value / max : 0;
        const zone = target == null || max <= 0 ? null : target / max;
        const pass = target == null ? null : value >= target;
        ring(rcx, rcy, frac, pass, pass === false ? LAY.GAUGE_RED : (pass ? LAY.GAUGE_GREEN : ink));
        drawSevenSeg(ctx, {
            x: rcx, y: rcy - LAY.SEG_VALUE_H / 2, h: LAY.SEG_VALUE_H, text,
            color: pass === false ? LAY.GAUGE_RED : (pass ? LAY.GAUGE_GREEN : ink),
            align: 'center',
        });

        const bx = x + d + 12;
        const bw = x + w - bx;
        label(bx, uy + 9, name);
        ticks(bx, uy + 16, bw, zone);
        lampBar(bx, uy + 16 + LAY.GAUGE_TICK_H + 3, bw, frac, zone, ink);
        label(bx, uy + d - 2,
              target == null ? 'NO GATE' : 'GATE ' + target,
              'left', target == null ? LAY.GAUGE_LABEL : LAY.GAUGE_AMBER);
        label(bx + bw, uy + d - 2, '0 - ' + max, 'right');
        return uy + LAY.GAUGE_UNIT_H;
    };

    // ── the clock ───────────────────────────────────────────────────────────
    //
    // ⚠️⚠️ THE COUNTDOWN LIVES HERE NOW, AND THAT IS A RULING CHANGED ON PURPOSE.
    // Round 94 recorded *"the countdown must not cover the radar... it is an
    // overlay on the thing it is counting down TO"*, and the harness pins that
    // the chrome's panel still belongs to the play container. Both stay true:
    // the READY, PAUSED and RESULT panels are untouched overlays. Only the three
    // digits moved. Jake, 2026-09-09: *"Countdown time should move to the new
    // digital readout to keep it unified."*
    // ⭐ AND IT SERVES THE OLDER RULING BETTER THAN THE OLD PLACEMENT DID. The
    // reason the countdown must not cover the scope is that the inbound word is
    // already on it — which is exactly the three seconds a student is meant to
    // spend reading ahead. A 96px numeral over the sky spent them instead.
    // ⚠️ ONE READOUT, ONE NUMBER AT A TIME. It is the count or the run clock,
    // never both, so there is never a second timer on screen to reconcile.
    (() => {
        const counting = o.countdown != null;
        const secs = Math.max(0, Math.floor(o.seconds || 0));
        const text = counting
            ? '  ' + Math.max(0, Math.min(9, o.countdown))
            : Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
        label(x, y + 8, counting ? 'GET READY' : 'RUN CLOCK');
        if (o.shieldsLeft != null) label(x + w, y + 8, 'SHIELDS', 'right');
        const top = y + 14;
        drawSevenSeg(ctx, {
            x, y: top, h: LAY.SEG_TIME_H, text,
            color: counting ? LAY.SEG_COUNT_INK : LAY.SEG_TIME_INK,
        });
        if (o.shieldsLeft != null) {
            drawSevenSeg(ctx, {
                x: x + w, y: top + 6, h: LAY.SEG_TIME_H - 6,
                text: String(Math.max(0, Math.min(99, o.shieldsLeft))),
                color: o.shieldsLeft <= 1 ? LAY.GAUGE_RED : LAY.SEG_TIME_INK,
                align: 'right',
            });
        }
        y = top + LAY.SEG_TIME_H + 14;
    })();

    // A ruled divider, in cells — the console's own seam between the clock and
    // the dials.
    ctx.fillStyle = 'rgba(120,170,220,0.22)';
    for (let dx = x; dx < x + w; dx += cell * 2) ctx.fillRect(dx, y - 7, cell, 2);

    // ── the dials ───────────────────────────────────────────────────────────
    y = unit(y, 'WPM', o.wpm || 0, String(Math.max(0, Math.min(999, o.wpm || 0))),
             LAY.GAUGE_WPM_MAX, o.targetWPM == null ? null : o.targetWPM,
             LAY.GAUGE_RUN_INK);
    y = unit(y, 'ACCURACY', o.acc || 0, String(Math.max(0, Math.min(100, o.acc || 0))),
             100, o.minAccuracy == null ? null : o.minAccuracy,
             LAY.GAUGE_RUN_INK);

    // ⚠️⚠️ THE QUOTA BAR IS LABELLED, AND THAT IS A BUG FIX. Unlabelled, it sat
    // above the WEEK figure and Jake read it as the week's time — *"what is that
    // progress bar?"* It is the RUN's character quota. If the author of a
    // feature cannot identify it, no sixth-grader will.
    // ⚠️ ABSENT IN ARCADE, not zeroed: an endless run has no quota, and a bar
    // pinned at 0% would be reporting a mission that does not exist.
    // ⚠️⚠️ ONCE THE RUN IS PASSED THIS ROW STOPS BEING A QUOTA AND BECOMES THE
    // SCORE (Round 101). Jake's survival mode: the graded run ends at 100% and
    // the student plays on for the leaderboard, so a bar pinned full for the
    // next four minutes is a readout that has stopped reporting. ⭐ THE ROW IS
    // THE ONE NUMBER STILL MOVING. ⚠️ It is the SURVIVAL score, not the
    // session's — the graded run's points belong to the frozen record.
    if (o.survivalScore != null) {
        label(x, y + 8, 'SURVIVAL');
        label(x + w, y + 8, String(o.survivalScore), 'right', LAY.GAUGE_GOLD);
        // A full gold bar, because the mission IS complete — it is the badge for
        // the pass, not a progress reading, and it never moves again.
        lampBar(x, y + 14, w, 1, null, LAY.GAUGE_GOLD);
        y += 14 + LAY.GAUGE_BAR_H + 16;
    } else if (o.quota != null) {
        const pct = Math.round(Math.min(1, o.quota) * 100);
        label(x, y + 8, 'RUN QUOTA');
        label(x + w, y + 8, pct + '%', 'right',
              o.quota >= 1 ? LAY.GAUGE_GOLD : LAY.GAUGE_RUN_INK);
        lampBar(x, y + 14, w, o.quota, null,
                o.quota >= 1 ? LAY.GAUGE_GOLD : LAY.GAUGE_RUN_INK);
        y += 14 + LAY.GAUGE_BAR_H + 16;
    }

    ctx.fillStyle = 'rgba(120,170,220,0.22)';
    for (let dx = x; dx < x + w; dx += cell * 2) ctx.fillRect(dx, y - 7, cell, 2);

    // ── the real totals ─────────────────────────────────────────────────────
    //
    // ⚠️ NOTHING IS PRINTED WHEN THERE IS NOTHING TO PRINT. "0m today" is a
    // claim, and a page that never read the totals has no business making it.
    // ⚠️⚠️ THESE STAY PLAIN MONOSPACE, NOT SEVEN-SEGMENT, AND THAT IS DELIBERATE.
    // They arrive as formatted strings ("1h 20m") from ONE formatter in
    // game-deadline.js; drawSevenSeg() renders digits only, so making them
    // digital would mean reformatting them here — the second formatter that
    // file's own comment warns would show a student two different "today"s.
    // ⚠️⚠️ ROUND 100b — THESE ARE SEVEN-SEGMENT NOW, ON JAKE'S RULING: *"I like
    // what you have with the exception of the Banked section. That should look
    // very similar to the run clock at the top."*
    //
    // ⚠️ MY PREVIOUS NOTE HERE ARGUED THE OPPOSITE AND WAS HALF RIGHT. The
    // standing rule — *"a child must not read '28 WPM' and '14m today' as two
    // facts of the same kind"* — is about telling THIS RUN from THEIR WEEK, and
    // it is preserved by INK, not by typeface: the run clock is red, these are
    // the blue total ink, and each row is named. Same instrument family, two
    // clearly different meters, which is what a real console looks like.
    //
    // ⚠️⚠️ AND THE DIGITS COME FROM THE SAME FORMATTER AS THE WORDS. drawSevenSeg
    // renders digits, a colon and a minus and nothing else, so it cannot be
    // handed "1h 20m". game-deadline.js's minuteLines() therefore emits BOTH
    // shapes from ONE function over the SAME seconds — see its header. A local
    // `Math.floor(sec/60)` here would be the second formatter that file has
    // warned about since Round 95, and the failure mode is a student shown two
    // different totals for one day.
    // ⚠️⚠️ ROUND 101 — THE ROWS SIZE AND SPACE THEMSELVES TO WHAT IS LEFT.
    // Jake, 2026-09-09: *"I'd like the today and week timers to be bigger and
    // include seconds to better fill all the dead space on the right."*
    // v1.4.0 drew them at a fixed 21px directly under the divider, so on a tall
    // screen the console ended two thirds of the way up the card and the rest
    // was bare — the identical failure Round 100 fixed on the flanks, one level
    // down. ⭐ THE BLOCK NOW TAKES THE WHOLE REGION BELOW THE DIALS: the digits
    // grow to the room available (bounded by SEG_TOTAL_MIN_H/MAX_H and by the
    // column's WIDTH), and the two rows are spread down it rather than stacked
    // at the top of it. That removes the space instead of relocating it.
    // ⚠️ THE SECONDS ARE WHY THE WIDTH BOUND EXISTS. "0:08:05" is seven glyphs
    // where "0:08" was four, so the height a 240px column can carry dropped by
    // nearly half — a bare SEG_TOTAL_MAX_H would run the digits under the label.
    if (o.todayClock || o.weekClock) {
        let rows = [['TODAY', o.todayClock], ['WEEK', o.weekClock]].filter(r => !!r[1]);
        // ⚠️⚠️ AND IT DEGRADES IN A FIXED ORDER RATHER THAN OVERFLOWING, WHICH
        // v1.4.0 DID NOT. At GAUGE_MIN_H the clock and two dials leave under
        // 20px here, and a fixed row height simply drew the WEEK row off the
        // bottom of the canvas — the student lost a readout and nothing said so.
        // The order of sacrifice is deliberate, cheapest first:
        //   1. the BANKED heading — it is the one thing on the block that is
        //      REDUNDANT, because every row already says TODAY or WEEK;
        //   2. the digit size, down to a floor;
        //   3. the WEEK row, because TODAY is the figure a child can still act
        //      on in the minutes they have left;
        //   4. the block.
        let heading = true, rowsTop = y + 16;
        let avail = H - 12 - rowsTop;
        if (avail / rows.length < LAY.SEG_TOTAL_MIN_H) {
            heading = false; rowsTop = y + 4; avail = H - 12 - rowsTop;
        }
        let slot = avail / rows.length;
        if (slot < 16 && rows.length > 1) { rows = rows.slice(0, 1); slot = avail; }
        if (slot >= 13) {
            if (heading) label(x, y + 8, 'BANKED');
            // The widest string decides the height BOTH rows use: two readouts
            // of one kind at two sizes is exactly the "slightly off" this
            // console is built to avoid.
            const widest = rows.reduce((a, r) => r[1].length > a.length ? r[1] : a, '');
            const labelW = 46;
            const byWidth = (w - labelW) / (sevenSegWidth(widest, 100) / 100);
            const pad = Math.min(LAY.SEG_TOTAL_PAD, slot * 0.2);
            const h = Math.max(12,
                      Math.min(LAY.SEG_TOTAL_MAX_H, byWidth, slot - pad));
            rows.forEach(([name, clock], i) => {
                const top = rowsTop + i * slot;
                const dy = top + (slot - h) / 2;
                // ⚠️ THE ROW LABEL GREW WITH THE DIGITS. At 9px beside a 36px
                // readout the name reads as a stray mark, and the name is what
                // keeps this block from being mistaken for the run clock.
                label(x, dy + h / 2 + 4, name, 'left', LAY.GAUGE_LABEL,
                      h >= 26 ? 11 : 9);
                drawSevenSeg(ctx, {
                    x: x + w, y: dy, h, text: clock,
                    color: LAY.GAUGE_TOTAL_INK, align: 'right',
                });
            });
        }
    }

    ctx.restore();
}

/**
 * The countdown, big, in the middle of the play area.
 *
 * Jake, 2026-09-09: *"I like the countdown clock in the run clock, but let's
 * duplicate those numbers (and that font) in the middle of the playfield, too,
 * so it's super obvious."*
 *
 * ⚠️⚠️ THIS DELIBERATELY REVERSES drawGauges()'s OWN "one readout, one number"
 * NOTE, AND THE DISTINCTION IS WORTH KEEPING STRAIGHT. That rule forbids a
 * second thing COUNTING; this is a second thing DISPLAYING a count that is
 * handed to both from game-chrome.js's single timer, so the two cannot disagree
 * by construction. Round 95 had to delete a genuinely duplicated readout — the
 * strip flanks and the console each computing a WPM — and that is a different
 * shape entirely: two sources, not one source twice.
 *
 * ⚠️ STATIC, AND THAT MATTERS MORE HERE THAN ANYWHERE ELSE ON THE CANVAS. The
 * DOM countdown this replaces animated its scale every frame; a large centred
 * numeral that pulses is a periodic large-area luminance change in front of
 * thirty twelve-year-olds, which is the exact pattern drawHitFeedback() stopped
 * doing a full-screen fill to avoid. No pulse, no dimming panel behind it.
 *
 * ⚠️ AND IT IS DRAWN UNDER THE HUD AND OVER NOTHING THAT MATTERS: during the
 * countdown the spawns have not started, so the only thing in the sky is the
 * word already on the radar. Once play begins this stops being drawn at all.
 */
export function drawCountdownOverlay(ctx, W, H, n) {
    if (n == null) return;
    const h = Math.max(LAY.COUNT_OVERLAY_MIN_H,
                       Math.min(LAY.COUNT_OVERLAY_MAX_H, H * LAY.COUNT_OVERLAY_FRACTION));
    const text = String(Math.max(0, Math.min(9, n)));
    drawSevenSeg(ctx, {
        x: W / 2, y: (H - h) / 2, h, text,
        color: LAY.SEG_COUNT_INK, align: 'center',
    });
    ctx.save();
    ctx.font = 'bold 13px "Courier Prime", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(159,182,198,0.75)';
    ctx.fillText('GET READY', W / 2, (H - h) / 2 - 14);
    ctx.restore();
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE THREAT BOARD. Round 100 (Franklin).
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Jake's brief for the flanks: *"we wouldn't leave parts of it bare - we'd have
 * information, or buttons, or lights, or something helping us make battle
 * decisions. This is a battle station, not a computer game."*
 *
 * ⚠️⚠️ THE TEST FOR ANYTHING PUT ON A FLANK IS "CAN A STUDENT ACT ON IT". A bare
 * panel and a panel of decorative lamps are both failures of that brief, and the
 * second is the worse one, because a child who learns the lights mean nothing
 * stops reading the panel that also carries the gate.
 *
 * ⭐ THIS ONE EARNS ITS PLACE BECAUSE OF Escape. The game's central tactical
 * choice is abandoning a word to save a different landmark — game-deadline.js's
 * own note: *"the student is choosing which landmark to save, and charging them
 * an error for a tactical decision would make the depth a trap."* Making that
 * choice requires knowing which landmark is exposed, and until now that was only
 * available by reading the skyline while words were falling. Round 87 outlines an
 * exposed landmark in amber ON the skyline; this says the same thing in words, in
 * a place the student is not simultaneously trying to read a falling word.
 *
 * ⚠️⚠️ IT RECEIVES COUNTS, NEVER GEOMETRY. Exactly the rule the radar's contacts
 * follow: `cover` is a NUMBER of standing shields over that lane, computed by the
 * view that owns the geometry. No lane position and no dome measurement may cross
 * into a panel — that measurement IS the coverage test giving the city six lives
 * instead of three, and Round 91 proved it can be broken by something that looks
 * completely fine.
 *
 * ⚠️ THREE STATES, AND THE COLOUR IS NEVER THE ONLY CHANNEL. Each row prints a
 * word as well: SHIELDED / EXPOSED / LOST. One boy in twelve in a class of thirty
 * has a colour vision deficiency, and this panel's whole purpose is to be read at
 * a glance under time pressure.
 *
 * @param {object} o  W, H, lanes:[{ short:string, cover:number, alive:boolean }]
 */
export function drawThreatBoard(ctx, o) {
    const { W, H } = o;
    const lanes = o.lanes || [];
    ctx.clearRect(0, 0, W, H);
    if (!lanes.length) return;
    ctx.save();

    const x = 10, w = W - 20;
    ctx.font = '8px "Courier Prime", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = LAY.GAUGE_LABEL;
    ctx.fillText('CITY STATUS', x, 9);

    // ⚠️ ROWS DIVIDE THE HEIGHT THEY ARE GIVEN, with a floor. This panel is the
    // one element on the flank with a FIXED height, so that the radar above it
    // gets every pixel the column has spare — but a caller could still hand it
    // less, and three rows crushed into 30px is worse than none.
    const top = 16;
    const rowH = Math.max(LAY.THREAT_ROW_MIN, (H - top - 4) / lanes.length);

    lanes.forEach((ln, i) => {
        const y = top + i * rowH;
        const state = !ln.alive ? 'LOST' : (ln.cover > 0 ? 'SHIELDED' : 'EXPOSED');
        const ink = !ln.alive ? LAY.THREAT_LOST
                  : ln.cover > 0 ? LAY.THREAT_SHIELDED : LAY.THREAT_EXPOSED;

        ctx.font = 'bold 9px "Courier Prime", monospace';
        ctx.textAlign = 'left';
        // ⚠️ A LOST LANDMARK IS DIMMED, NOT DELETED. The row has to keep its
        // place or the two survivors move under the student's eye mid-run.
        ctx.globalAlpha = ln.alive ? 1 : 0.5;
        ctx.fillStyle = ink;
        ctx.fillText(ln.short || '', x, y + 8);

        ctx.font = '8px "Courier Prime", monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = ink;
        ctx.fillText(state, x + w, y + 8);
        ctx.globalAlpha = 1;

        // Shield lamps: one per standing dome over this lane. ⚠️ THE UNLIT ONES
        // ARE DRAWN, so the row shows what has been SPENT as well as what is
        // left — that is the six-lives mechanic made visible.
        const lampW = 9, lampGap = 3, max = o.coverMax || 3;
        for (let k = 0; k < max; k++) {
            const on = k < ln.cover;
            ctx.globalAlpha = on ? 1 : 0.18;
            ctx.fillStyle = on ? ink : 'rgba(120,170,220,0.5)';
            ctx.fillRect(x + k * (lampW + lampGap), y + 12, lampW, 4);
        }
        ctx.globalAlpha = 1;
    });

    ctx.restore();
}

// ═════════════════════════════════════════════════════════════════════════════
// THE WAVE PREVIEW — ESCAPE KEY'S LEFT PANEL. Round 108 (Bar-Let).
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-09: *"Left panel is like the radar in Deadline in that it
// previews what's coming, but not where. So it can go ahead and tell us what the
// next three monsters are - maybe even with a countdown."*
//
// ⚠️⚠️ "BUT NOT WHERE" IS THE ENTIRE SPECIFICATION AND IT IS A DESIGN RULE, NOT A
// SIMPLIFICATION. Deadline's radar shows position because Deadline's threat IS a
// position — a word falling in a lane. Escape Key's threat is a KIND: what a
// spider does to you and what a kaiju does to you are different problems, and
// knowing a spider is coming is what lets a student plan. Showing where it will
// enter would remove the read-the-board skill the game is built on.
//
// ⭐ SO THIS PANEL ANSWERS "WHAT, AND HOW SOON" AND REFUSES TO ANSWER "WHERE."
// A future round that adds a spawn-edge indicator here has changed the game.
//
// ⚠️ THE SPRITES ARE THE REAL ONES. A panel with three coloured dots on it would
// need a legend, and a legend is a thing a twelve-year-old has to learn instead
// of a picture they already recognise from the board.

/**
 * @param {object} o
 *   W, H     {number}
 *   waves    {object[]}  from escape-board.js's upcoming(): { wave, kind, gap }
 *   progress {number}    0..1 toward the NEXT wave, or null if it is waiting on
 *                        a clear board rather than on a distance
 *   round    {number}    the wave the student is currently in
 */
export function drawWavePreview(ctx, o) {
    const { W, H } = o;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.fillStyle = 'rgba(6,10,20,0.92)';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(163,44,196,0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    const pad = 12;
    ctx.font = 'bold 11px "Courier Prime", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#9fb6d8';
    ctx.fillText('INCOMING', pad, pad);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('WAVE ' + (o.round || 1), W - pad, pad);

    const waves = (o.waves || []).slice(0, 3);
    if (!waves.length) { ctx.restore(); return; }

    const top = pad + 24;
    const rowH = Math.max(46, Math.min(96, (H - top - pad) / 3));
    // ⚠️ THE SPRITE IS SIZED TO THE ROW, NOT TO A CONSTANT. This panel is a flex
    // child between GAUGE_MIN_H and GAUGE_MAX_H on the real page and a fixed
    // sprite size would overflow it on a short window — the Round 101 defect,
    // one panel over.
    const sprite = Math.min(rowH * 0.78, W - pad * 2 - 70);

    waves.forEach((w, i) => {
        const y = top + i * rowH;
        // ⭐ THE NEXT ONE IS FULL STRENGTH AND THE OTHERS FADE BACK. Three equal
        // rows read as a list; a fading queue reads as an order of arrival, which
        // is the fact the student actually needs.
        ctx.globalAlpha = i === 0 ? 1 : (i === 1 ? 0.62 : 0.38);

        const s = ENEMY_SPRITES[w.kind];
        if (s) {
            drawPixelSprite(ctx, s, ENEMY_PALETTES[w.kind],
                            pad + sprite / 2, y + rowH / 2, sprite);
        }

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 12px "Courier Prime", monospace';
        ctx.fillStyle = '#e8f2fa';
        ctx.fillText(String(w.kind || '').toUpperCase(), pad + sprite + 10, y + rowH / 2 - 8);

        ctx.font = 'bold 10px "Courier Prime", monospace';
        ctx.fillStyle = '#7f97b8';
        // ⚠️ ONLY THE NEXT WAVE GETS A COUNTDOWN. The two behind it depend on when
        // this one lands, so a number on them would be a guess presented as a
        // fact — and a preview that is sometimes wrong is worse than one that
        // says less.
        const note = i > 0 ? 'then'
            : w.gap == null ? 'when the board clears'
            : 'in ' + w.gap + ' square' + (w.gap === 1 ? '' : 's');
        ctx.fillText(note, pad + sprite + 10, y + rowH / 2 + 8);
        ctx.globalAlpha = 1;
    });

    // The countdown bar for the next wave only, and only when it is measurable.
    if (o.progress != null && waves.length) {
        const bw = W - pad * 2, by = top + rowH - 8;
        roundRect(ctx, pad, by, bw, 5, 2.5);
        ctx.fillStyle = 'rgba(12,20,34,0.95)'; ctx.fill();
        roundRect(ctx, pad, by, bw * Math.max(0, Math.min(1, o.progress)), 5, 2.5);
        ctx.fillStyle = '#a32cc4'; ctx.fill();
    }
    ctx.restore();
}

// ═════════════════════════════════════════════════════════════════════════════
// SHATTER'S LEFT PANEL — A RADAR OVER A WARP METER. Round 109 (Bar-Let).
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-09, and the honesty in it is the specification:
// *"The radar screen in the top gives slightly more information than the screen
// itself, so you could see meteors coming before they appear, but you can't do
// much with that information as there are no words there yet. It's just window
// dressing - nothing of importance. Only the 'Can I warp yet?' bar is
// important."*
//
// ⚠️⚠️ SO THE TWO HALVES ARE DELIBERATELY UNEQUAL AND MUST STAY THAT WAY. The
// radar is atmosphere; the warp meter is a decision. A future round that makes
// the radar useful — labelling contacts, showing which rock is which — has turned
// window dressing into a second place to look during play, and the student's eyes
// belong on the field.
// ⭐ THE SIZE SPLIT SAYS SO: the meter gets the room it needs and the radar takes
// what is left, not the other way round.

/**
 * @param {object} o
 *   W, H      {number}
 *   contacts  {object[]}  { r, angle } in board space, r = 1 at the ring
 *   warps     {number}    banked warps
 *   maxWarps  {number}
 *   charge    {number}    0..1 toward the next one
 */
export function drawShatterPanel(ctx, o) {
    const { W, H } = o;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.fillStyle = 'rgba(6,10,20,0.92)';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(70,90,130,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    const pad = 12;
    // ⚠️ THE METER'S HEIGHT IS FIXED AND THE RADAR TAKES THE REMAINDER. Round 101
    // learned this one panel over: a flex canvas with two fixed halves draws the
    // lower one off the bottom on a short window and says nothing about it.
    const meterH = 96;
    const radarH = Math.max(70, H - meterH - pad * 2);
    const cx = W / 2, cy = pad + radarH / 2;
    const rr = Math.min(W / 2 - pad, radarH / 2) - 4;

    ctx.font = 'bold 11px "Courier Prime", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#5d7characters'.slice(0, 0) || '#5d7290';
    ctx.fillText('RADAR', pad, pad - 4);

    ctx.strokeStyle = 'rgba(0,229,255,0.25)';
    for (const k of [1, 0.66, 0.33]) {
        ctx.beginPath(); ctx.arc(cx, cy, rr * k, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(cx - rr, cy); ctx.lineTo(cx + rr, cy);
    ctx.moveTo(cx, cy - rr); ctx.lineTo(cx, cy + rr); ctx.stroke();

    // ⚠️ CONTACTS ARE DOTS AND CARRY NO TEXT. Labelling them would make the radar
    // readable, which is exactly what it must not be — see the header.
    for (const c of (o.contacts || [])) {
        const d = Math.max(0, Math.min(1.15, c.r)) * rr;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(c.angle) * d, cy + Math.sin(c.angle) * d, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = c.r <= 0.25 ? '#ff5566' : 'rgba(0,229,255,0.75)';
        ctx.fill();
    }
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffff'; ctx.fill();

    // ── the half that matters ───────────────────────────────────────────────
    const my = H - meterH - pad + 8;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = 'bold 11px "Courier Prime", monospace';
    ctx.fillStyle = o.warps > 0 ? '#ffd700' : '#5d7290';
    ctx.fillText('WARP', pad, my);

    // ⭐ BANKED WARPS ARE PIPS, NOT A NUMBER. "Warps: 2" is a fact to read; two
    // lit pips beside an empty third is a fact to see, and it shows the CEILING
    // at the same time — which is what makes hoarding legible as a choice.
    const maxW = o.maxWarps || 3;
    const pipW = Math.min(46, (W - pad * 2 - (maxW - 1) * 6) / maxW);
    for (let i = 0; i < maxW; i++) {
        const x = pad + i * (pipW + 6);
        roundRect(ctx, x, my + 18, pipW, 22, 4);
        const lit = i < (o.warps || 0);
        ctx.fillStyle = lit ? '#ffd700' : 'rgba(12,20,34,0.95)';
        ctx.globalAlpha = lit ? 0.9 : 1; ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = lit ? '#ffd700' : 'rgba(70,90,130,0.6)';
        ctx.lineWidth = 1; ctx.stroke();
    }

    const bw = W - pad * 2;
    roundRect(ctx, pad, my + 48, bw, 10, 5);
    ctx.fillStyle = 'rgba(12,20,34,0.95)'; ctx.fill();
    ctx.strokeStyle = 'rgba(70,90,130,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    roundRect(ctx, pad + 1.5, my + 49.5, Math.max(0, (bw - 3) * (o.charge || 0)), 7, 3.5);
    ctx.fillStyle = (o.warps || 0) > 0 ? '#ffd700' : '#00e5ff'; ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = 'bold 10px "Courier Prime", monospace';
    ctx.fillStyle = (o.warps || 0) > 0 ? '#ffd700' : '#5d7290';
    ctx.fillText((o.warps || 0) > 0 ? 'SPACE TO WARP' : 'CLEAR ROCKS TO CHARGE',
                 W / 2, my + 64);
    ctx.restore();
}
