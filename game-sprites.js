// game-sprites.js v1.0.0 — THE ARCADE'S ARTWORK. Round 106 (Bar-Let).
//
// ⚠️⚠️ THIS FILE EXISTS BECAUSE THE PROTOTYPES LOOKED BETTER THAN THE REWRITE AND
// JAKE WAS RIGHT TO SAY SO.
//
// Jake, 2026-09-09, on the shipped Escape Key: *"ALL THE ANIMATION I STARTED WITH
// IS GONE... it looks 1000% times better than what's in lab. I can't share what
// you made with kids."*
//
// ⭐ HE IS RIGHT, AND THE DIAGNOSIS IS SPECIFIC RATHER THAN A MATTER OF TASTE.
// Rounds 82–105 rebuilt Escape Key's *rules* correctly — the camper dies, the
// cadence is gate-derived, the tick banks — and quietly replaced its *characters*
// with primitives. A frog in glasses whose mouth opens while you type became a
// yellow arc. A kaiju firing an atomic beam became a green triangle with two red
// squares. **The mechanics survived the port and the game did not.**
//
// ⚠️⚠️ THE ART WAS NEVER THE PART THAT NEEDED REWRITING. Every defect those
// rounds found — the unreachable gate, the safe camper, the dead tick, the
// two-letter pool — was in the arithmetic. The sprites were fine. Replacing them
// was work that cost quality and bought nothing, and it happened because a
// rewrite treats everything it touches as a draft.
//
// ⭐ SO THE PIXEL DATA BELOW IS JAKE'S, FROM HIS PROTOTYPE, TRANSCRIBED AND NOT
// REINTERPRETED. ⚠️ DO NOT "IMPROVE" THESE GRIDS. They are the look he built and
// wants; a future round that finds them crude and smooths them out is repeating
// exactly the mistake this file was written to undo.
//
// ⚠️ PURE-ISH: it draws to a 2D context and does nothing else. No DOM, no state,
// no timers, no Math.random(). Every function takes everything it needs.

export const GAME_SPRITES_VERSION = '1.0.0';

// ═════════════════════════════════════════════════════════════════════════════
// ESCAPE KEY — 24×24 PIXEL SPRITES
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ '0' IS TRANSPARENT IN EVERY PALETTE. It is not a colour and must never be
// given one, or every sprite gains a square background.

export const FROG_COLORS   = { '0': null, '1': '#2ecc71', '2': '#ffffff', '3': '#000000', '4': '#e74c3c', '5': '#2980b9' };
export const KAIJU_COLORS  = { '0': null, '1': '#2c323b', '2': '#4f5866', '3': '#ff2244', '4': '#00e5ff', '5': '#ffffff', '6': '#5a6372' };
export const SPIDER_COLORS = { '0': null, '1': '#4a154b', '2': '#9b59b6', '3': '#e74c3c', '4': '#ffffff', '5': '#af7ac5' };
export const HUNTER_COLORS = { '0': null, '1': '#7f8c8d', '2': '#bdc3c7', '3': '#f1c40f', '4': '#e74c3c', '5': '#3498db', '6': '#2c3e50' };

/** The frog, mouth shut. Rows 1–3 are the eye stalks. */
export const FROG_CLOSED = [
    "000000000000000000000000", "000000022200000222000000", "000000022200000222000000", "000000022200000222000000",
    "000111111111111111111000", "001111111111111111111100", "011111111111111111111110", "011111111111111111111110",
    "011111111111111111111110", "011111111111111111111110", "011111111111111111111110", "001111111113333333333330",
    "000111111111111111111100", "000011111111111111111000", "000001111111111111110000", "000000110000000011000000",
    "000000110000000011000000", "000000110000000011000000", "000000110000000011000000", "000000110000000011000000",
    "000000110000000011000000", "000001111000000111100000", "000011111100001111110000", "000011111100001111110000",
];

/** ⭐ THE MOUTH OPENS WHILE THE STUDENT IS MID-WORD, and that is the single
 *  cheapest piece of feedback in either game: the character reacts to typing.
 *  ⚠️ IT IS DRIVEN BY `typed.length > 0`, NOT BY A TIMER — an idle chomp animation
 *  says the same thing whether the student is typing or staring at the screen. */
export const FROG_OPEN = [
    "000000000000000000000000", "000000022200000222000000", "000000022200000222000000", "000000022200000222000000",
    "000111111111111111111000", "001111111111111111111100", "011111111111111111111110", "011111111444444444444440",
    "011111111444444444444440", "011111111444444444444440", "011111111444444444444440", "001111111444444444444440",
    "000111111111111111111100", "000011111111111111111000", "000001111111111111110000", "000000110000000011000000",
    "000000110000000011000000", "000000110000000011000000", "000000110000000011000000", "000000110000000011000000",
    "000000110000000011000000", "000001111000000111100000", "000011111100001111110000", "000011111100001111110000",
];

/** Laid over the top four rows of either base. It is a typing game; the frog
 *  wears reading glasses. */
export const FROG_GLASSES = [
    "000000555550005555500000", "000000500055555000500000", "000000500050005000500000",
    "000000500050005000500000", "000000555550005555500000",
];

export const KAIJU = [
    "000000000000000000000000", "000000000000000000000000", "000000000000001111100000", "000000000000112222110000",
    "000000000001122223311000", "000000000011222211115500", "000000000011221133333300", "000000000401122115555000",
    "000000444001126611000000", "000000444440112666110000", "000000044400112666611000", "000000444440112266611000",
    "000000044401122226611100", "000000444411222222115500", "000011004411222222110000", "001111000112222221100000",
    "011110001122222111000000", "111100001122111111100000", "111000011221100112210000", "110000011211000112210000",
    "000000011211000112210000", "000000111555001115550000", "000000111555001115550000", "000000000000000000000000",
];

export const SPIDER = [
    "000000000000000000000000", "110000000000000000000111", "111000000000000000000111", "011500000000000000005110",
    "001110000011110000011100", "510111000122221000111015", "110011101222222101110011", "011001112222222211100110",
    "001101122233332221101100", "110111122343343221111011", "111011122233332221110111", "011101122222222221101110",
    "001111122222222221111100", "000111112222222211111000", "510011111222222111110015", "111001111111111111100111",
    "011100111100001111001110", "001110011000000110011100", "000111010000000010111000", "000011110000000011110000",
    "000001100000000001100000", "000000000000000000000000", "000000000000000000000000", "000000000000000000000000",
];

export const HUNTER = [
    "000000000003300000000000", "000000000003300000000000", "000000000001100000000000", "000000011111111000000000",
    "000000112222221100000000", "000000114422441100000000", "000000114422441100000000", "000000112222221100000000",
    "000000011111111000000000", "000000000111000000000000", "000111111111111111110000", "001122222222222222110000",
    "001122555555555522110000", "001122222222222222110000", "001122555555555522110000", "001122222222222222110000",
    "000111111111111111110000", "000000111100111100000000", "000000111100111100000000", "000000666600666600000000",
    "000000666600666600000000", "000000666600666600000000", "000001111100111110000000", "000000000000000000000000",
];

export const ENEMY_SPRITES = { kaiju: KAIJU, spider: SPIDER, hunter: HUNTER };
export const ENEMY_PALETTES = { kaiju: KAIJU_COLORS, spider: SPIDER_COLORS, hunter: HUNTER_COLORS };

/**
 * Draw a pixel grid centred on (x, y), scaled to `size` pixels across.
 *
 * ⚠️⚠️ THE PIXEL SIZE IS ROUNDED AND NEVER BELOW 1. The prototype hardcoded 4,
 * which is right on its fixed canvas and wrong on every other — and a fractional
 * pixel size makes each 24×24 cell land on a different sub-pixel boundary, which
 * is what turns crisp pixel art into a blurred smear. ⭐ ROUNDING IS WHY THIS
 * LOOKS LIKE PIXEL ART AT ANY BOARD SIZE rather than only at the prototype's.
 *
 * @param {string[]} sprite   rows of digit codes
 * @param {object} palette    code → CSS colour, '0' → null
 * @param {number} size       target width in px; the sprite is square
 * @param {boolean} flipX     face the other way
 * @param {number} rotation   radians
 */
export function drawPixelSprite(ctx, sprite, palette, x, y, size, flipX = false, rotation = 0) {
    if (!sprite || !sprite.length) return;
    const cols = sprite[0].length;
    const pixel = Math.max(1, Math.round(size / cols));
    const w = cols * pixel, h = sprite.length * pixel;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flipX) ctx.scale(-1, 1);
    if (rotation) ctx.rotate(rotation);
    const sx = -w / 2, sy = -h / 2;
    for (let r = 0; r < sprite.length; r++) {
        const row = sprite[r];
        for (let c = 0; c < row.length; c++) {
            const col = palette[row[c]];
            if (!col) continue;
            ctx.fillStyle = col;
            ctx.fillRect(sx + c * pixel, sy + r * pixel, pixel, pixel);
        }
    }
    ctx.restore();
}

/**
 * The frog, assembled: base + glasses + pupils aimed where the student is typing.
 *
 * ⭐ THE EYES FOLLOW THE DIRECTION, and it is the best idea in the prototype.
 * Escape Key's whole decision is *which neighbour am I typing toward*, and the
 * character looking that way is the game confirming the student's intent before
 * they finish the word. ⚠️ IT IS DERIVED FROM THE AIM, NOT FROM THE LAST MOVE —
 * looking where you already went tells nobody anything.
 *
 * @param {string|null} dir  'up' | 'down' | 'left' | 'right' | null
 * @param {boolean} mouthOpen  the student is mid-word
 */
export function frogSprite(dir, mouthOpen, facingLeft) {
    const sprite = (mouthOpen ? FROG_OPEN : FROG_CLOSED).map(row => row.split(''));
    for (let r = 0; r < FROG_GLASSES.length; r++) {
        for (let c = 0; c < FROG_GLASSES[r].length; c++) {
            const code = FROG_GLASSES[r][c];
            if (code !== '0') sprite[r][c] = code;
        }
    }
    // Pupil position inside each lens. Default is centred and slightly low.
    let pr = 2, pc = 1;
    if (dir === 'up') { pr = 1; pc = 1; }
    else if (dir === 'down') { pr = 3; pc = 1; }
    else if (dir === 'left') { pr = 2; pc = facingLeft ? 2 : 0; }
    else if (dir === 'right') { pr = 2; pc = facingLeft ? 0 : 2; }
    sprite[pr][7 + pc] = '3';
    sprite[pr][15 + pc] = '3';
    return sprite;
}

/**
 * The kaiju's atomic beam.
 *
 * ⚠️ TWO STROKES, WIDE-THEN-NARROW, PLUS A SHADOW. One stroke reads as a line;
 * the white core inside the cyan glow is what makes it read as energy. The jitter
 * on the outer width is deliberate and small.
 */
export function drawBeam(ctx, x0, y0, x1, y1, jitter = 0) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 22 + jitter * 8;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.restore();
}

/** A vaporised cell: the X the prototype drew where a word used to be. */
export function drawVaporised(ctx, x, y, size) {
    const p = size * 0.28;
    ctx.save();
    ctx.strokeStyle = 'rgba(233,69,96,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - p, y - p); ctx.lineTo(x + p, y + p);
    ctx.moveTo(x + p, y - p); ctx.lineTo(x - p, y + p);
    ctx.stroke();
    ctx.restore();
}

/** The web rosette: eight spokes and three rings. */
export function drawWeb(ctx, x, y, r) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        ctx.stroke();
    }
    // ⚠️ STRAIGHT SEGMENTS BETWEEN THE SPOKES, NOT arc(). A real web's rings are
    // octagons strung between the radials; drawing circles makes a dartboard.
    for (let k = 0.35; k <= 1.0; k += 0.35) {
        ctx.beginPath();
        for (let i = 0; i <= 8; i++) {
            const a = i * Math.PI / 4;
            const px = x + Math.cos(a) * r * k, py = y + Math.sin(a) * r * k;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
    ctx.restore();
}

// ═════════════════════════════════════════════════════════════════════════════
// SHATTER — VECTOR ART
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ A ROCK IS AN IRREGULAR POLYGON WITH A FIXED SILHOUETTE, AND BOTH HALVES OF
// THAT MATTER. Round 105 drew rocks as rounded rectangles behind text, which is
// a label rather than an object — nothing about it says *breakable*. And the
// jaggedness must be FROZEN PER ROCK: re-rolling the offsets each frame makes the
// outline boil, which reads as a rendering fault rather than as stone.

export const ROCK_POINTS = 10;

/**
 * The frozen silhouette for one rock. Call once at spawn, keep it on the rock.
 * ⚠️ TAKES `rand` — a rock field that cannot be reproduced in a harness is one
 * whose "it only looks wrong sometimes" report cannot be investigated.
 */
export function rockOutline(rand = Math.random) {
    const out = [];
    for (let i = 0; i < ROCK_POINTS; i++) out.push(0.78 + rand() * 0.42);
    return out;
}

export function drawRock(ctx, x, y, r, outline, opts) {
    const o = opts || {};
    ctx.save();
    ctx.translate(x, y);
    if (o.spin) ctx.rotate(o.spin);
    ctx.strokeStyle = o.stroke || '#ffffff';
    ctx.lineWidth = o.lineWidth || 1.8;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 12; }
    ctx.beginPath();
    for (let i = 0; i < ROCK_POINTS; i++) {
        const a = (i / ROCK_POINTS) * Math.PI * 2;
        const rr = r * (outline ? outline[i] : 1);
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
    ctx.stroke();
    ctx.restore();
}

/**
 * The ship. ⭐ IT POINTS AT WHAT THE STUDENT IS TYPING, which is the prototype's
 * other good idea: the aim is confirmation, drawn, that the lock went where they
 * meant. ⚠️ WITH NO LOCK IT POINTS UP rather than spinning idly — a ship that
 * rotates on its own is telling the student about a target that does not exist.
 */
export function drawShip(ctx, x, y, r, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle == null ? -Math.PI / 2 : angle);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(-r * 0.66, r * 0.66);
    ctx.lineTo(-r * 0.33, 0);
    ctx.lineTo(-r * 0.66, -r * 0.66);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

/** The word on a rock: typed part red, the rest white — or yellow when locked. */
export function drawTargetWord(ctx, x, y, text, typedLen, size, locked) {
    ctx.save();
    ctx.font = `bold ${size}px "Courier Prime", monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const full = ctx.measureText(text).width;
    const typed = text.slice(0, typedLen), rest = text.slice(typedLen);
    let sx = x - full / 2;
    // ⚠️ A DARK BACKING STROKE, NOT A PLATE. Over a starfield bare text is
    // unreadable, and a filled plate hides the rock the word belongs to.
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(2,4,10,0.9)';
    ctx.strokeText(text, sx, y);
    ctx.fillStyle = '#ff4444';
    ctx.fillText(typed, sx, y);
    sx += ctx.measureText(typed).width;
    ctx.fillStyle = locked ? '#ffff00' : '#ffffff';
    ctx.fillText(rest, sx, y);
    ctx.restore();
}
