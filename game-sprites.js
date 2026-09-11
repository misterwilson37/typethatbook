// game-sprites.js v1.2.0 — THE ARCADE'S ARTWORK. Rounds 106, 112, 116 (Sun).
//
// v1.2.0 — ⭐ SHATTER IS STAINED GLASS. The rock functions are DELETED, not
//   deprecated: `rockOutline`, `drawRock`, `drawShip` and `drawTargetWord` had
//   exactly one caller between them and keeping them beside their replacements
//   would be two answers to one question. A target is now a leaded pane with one
//   panel per letter, the panel lights in that letter's finger colour as it is
//   typed, and the ship is the prism that throws those colours. See the section
//   header below for why this is not a reskin. ⚠️ THE ESCAPE KEY SPRITES ABOVE
//   ARE UNTOUCHED and the rule about them still stands.
//
// v1.1.0 — ⚠️ drawPixelSprite() TAKES A SCREEN-SPACE ANGLE. `scale(-1, 1)` mirrors
//   the rotation too, so a kaiju entering from the right leaned backwards OUT of
//   the board while the identical call leaned the left-hand one correctly in.
//   ⭐ NEGATED INSIDE, NOT AT THE CALL SITES, so every caller means the same thing
//   by a positive angle and the next one cannot inherit the bug.
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

export const GAME_SPRITES_VERSION = '1.2.0';

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
    // ⚠️⚠️ ROTATION IS IN SCREEN SPACE, AND THE MIRROR IS UNDONE FOR IT. Jake,
    // 2026-09-10: *"Kaiju tilts the wrong way when spawning on the right."*
    // ⭐ `scale(-1, 1)` MIRRORS THE ROTATION TOO, so a kaiju entering from the
    // right — which is drawn flipped — leaned backwards out of the board while
    // the identical call leaned the left-hand one correctly in. ⚠️ NEGATING HERE
    // RATHER THAN AT THE CALL SITE IS THE POINT: every caller now means the same
    // thing by a positive angle, so the next one cannot inherit the bug. The two
    // call sites that compensated for this by hand are simpler for it.
    if (flipX) ctx.scale(-1, 1);
    if (rotation) ctx.rotate(flipX ? -rotation : rotation);
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
// SHATTER — STAINED GLASS
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ THE ROCKS ARE GONE AND THAT IS THE POINT. v1.1.0 replaced a rounded
// rectangle with an irregular polygon because *"nothing about a rounded
// rectangle says BREAKABLE"* — correct, and it bought an ASTEROID, which says
// breakable and says nothing else. The game is called **Shatter**, the words are
// already coloured a letter at a time by the finger map, and the thing that
// shatters into coloured pieces is GLASS.
//
// ⭐ SO A TARGET IS A LEADED PANE, ONE PANEL PER LETTER, EACH PANEL THE COLOUR OF
// THE FINGER THAT TYPES IT. The pane starts dark. Every correct key lights its
// panel from behind. The last key lights the last panel and the whole thing
// blows apart into coloured shards. ⚠️ THE PROGRESS BAR, THE FINGER DRILL AND THE
// ART ARE NOW ONE OBJECT rather than three things layered on top of each other —
// which is why this is not a reskin. `drawTargetWord()`'s red-typed / white-rest
// scheme was a second, competing progress display and is deleted with it.
//
// ⚠️⚠️ AND THEREFORE THE PANE DOES NOT TUMBLE. v1.1.0's rocks spun, with the word
// drawn flat on top in screen space — fine when the word was a label sitting in
// front of a rock, impossible now that each letter must stay over its own panel.
// It keeps a small frozen TILT and a slow SWAY instead, so it reads as glass
// hanging rather than as a sticker. ⭐ A slow sway costs nothing and a spin costs
// legibility; there was never a trade here.
//
// ⚠️ THE FUNCTIONS BELOW TAKE THEIR COLOURS AS ARGUMENTS AND LOOK NOTHING UP.
// game-draw.js owns the one import of keyboard.js's FINGER_COLORS (game-
// assumptions-test.mjs Part J is the guard), and a palette literal in this file
// would be the second copy that check exists to prevent.

/**
 * The frozen cut of one pane: how its corners are chamfered, how its lead lines
 * lean, how it hangs, and where it will craze when it gets close.
 *
 * ⚠️ CALL ONCE AT SPAWN AND KEEP IT ON THE TARGET. Re-rolling per frame makes the
 * came lines jitter, which reads as a rendering fault — the same lesson
 * rockOutline() learned and the reason it took `rand` too.
 *
 * ⚠️ TAKES THE PANEL COUNT, because `lean` is per interior came and a pane handed
 * a lean array of the wrong length would draw its glass and its lead in two
 * different places.
 */
export function paneCut(rand = Math.random, panels = 1) {
    const n = Math.max(1, panels | 0);
    const lean = [];
    for (let i = 0; i < n - 1; i++) lean.push((rand() - 0.5) * 0.46);
    const corner = [];
    for (let i = 0; i < 4; i++) corner.push(0.10 + rand() * 0.20);
    // Where the crazing starts and which way it runs. Three fractures is enough
    // to read as glass; more looks like a cobweb.
    const cracks = [];
    for (let i = 0; i < 3; i++) {
        cracks.push({ a: rand() * Math.PI * 2, bend: (rand() - 0.5) * 0.9,
                      reach: 0.55 + rand() * 0.5 });
    }
    return {
        panels: n, lean, corner, cracks,
        tilt: (rand() - 0.5) * 0.20,
        sway: 0.45 + rand() * 0.65,
        phase: rand() * Math.PI * 2,
    };
}

/**
 * Trace the silhouette in LOCAL coordinates, centred on the origin.
 *
 * ⚠️ A PANE AND A SHARD DIFFER IN KIND, NOT IN DEGREE — the same argument
 * v1.1.0 made for filled-versus-hollow, which this replaces. A whole target is a
 * chamfered window: even, architectural, cut by a glazier. A piece is a
 * SPLINTER, pointed at both ends. A slightly smaller window would be the
 * "slightly off" that reads as a mistake rather than as a fragment.
 */
function panePath(ctx, halfW, halfH, cut, piece) {
    ctx.beginPath();
    if (piece) {
        const tip = Math.min(halfW * 0.5, halfH * 1.1);
        ctx.moveTo(-halfW, -halfH * 0.10 + cut.corner[0] * halfH * 0.4);
        ctx.lineTo(-halfW + tip * 0.8, -halfH);
        ctx.lineTo(halfW - tip * 0.5, -halfH * 0.86);
        ctx.lineTo(halfW, halfH * 0.06);
        ctx.lineTo(halfW - tip * 0.7, halfH);
        ctx.lineTo(-halfW + tip * 0.45, halfH * 0.88);
        ctx.closePath();
        return;
    }
    const c = i => Math.min(halfH * 0.5, halfW * 0.30) * cut.corner[i];
    ctx.moveTo(-halfW + c(0), -halfH);
    ctx.lineTo(halfW - c(1), -halfH);
    ctx.lineTo(halfW, -halfH + c(1));
    ctx.lineTo(halfW, halfH - c(2));
    ctx.lineTo(halfW - c(2), halfH);
    ctx.lineTo(-halfW + c(3), halfH);
    ctx.lineTo(-halfW, halfH - c(3));
    ctx.lineTo(-halfW, -halfH + c(0));
    ctx.closePath();
}

/**
 * One pane: the glass, the lead, the letters and the crazing, in one call.
 *
 * ⚠️⚠️ THE LETTERS ARE DRAWN HERE AND NOT BY THE CALLER, and that is deliberate
 * rather than convenient. A panel boundary and the letter that sits over it are
 * the SAME NUMBER; two functions computing it is exactly the shape that lets a
 * word drift half a panel off its own glass with nothing on screen to say which
 * of the two is wrong. One function, one arithmetic.
 *
 * @param {object} o
 *   halfW, halfH  {number}   the pane's half-extents before tilt
 *   text          {string}   the word; its length must equal cut.panels
 *   typed         {number}   how many letters are lit
 *   size          {number}   letter size in px
 *   colors        {string[]} one colour per letter, from the finger map
 *   base          {string}   the unlit glass
 *   rim           {string}   the came around the edge — this carries STATE
 *   lineWidth     {number}
 *   glow          {string|null}
 *   piece         {boolean}  splinter rather than window
 *   crack         {number}   0..1, how badly it has crazed
 *   pulse         {number}   0..1, the breathing on the NEXT panel
 *   tSec          {number}   for the sway
 */
export function drawPane(ctx, x, y, cut, o) {
    const opt = o || {};
    const text = String(opt.text || '');
    const n = Math.max(1, cut.panels || text.length || 1);
    const halfW = opt.halfW || 40, halfH = opt.halfH || 14;
    const typed = Math.max(0, Math.min(n, opt.typed || 0));
    const pal = opt.colors || [];
    const pw = (halfW * 2) / n;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(cut.tilt + Math.sin((opt.tSec || 0) * cut.sway + cut.phase) * 0.035);

    // ── the glass ───────────────────────────────────────────────────────────
    panePath(ctx, halfW, halfH, cut, opt.piece);
    ctx.fillStyle = opt.base || 'rgba(6,10,20,0.82)';
    ctx.fill();

    ctx.save();
    ctx.clip();

    // ⚠️ THE LEAN IS APPLIED AT THE TOP AND UNDONE AT THE BOTTOM, so every came
    // stays centred on its boundary and the panels keep equal average width. A
    // lean applied to one end only walks the whole word off the pane.
    const cameX = i => {
        const base = -halfW + i * pw;
        const k = cut.lean[i - 1] || 0;
        return { top: base + k * pw * 0.38, bot: base - k * pw * 0.38 };
    };

    for (let i = 0; i < n; i++) {
        const state = i < typed ? 'lit' : (i === typed ? 'next' : 'dark');
        if (state === 'dark') continue;
        const L = i === 0 ? { top: -halfW - 2, bot: -halfW - 2 } : cameX(i);
        const R = i === n - 1 ? { top: halfW + 2, bot: halfW + 2 } : cameX(i + 1);
        ctx.beginPath();
        ctx.moveTo(L.top, -halfH - 2);
        ctx.lineTo(R.top, -halfH - 2);
        ctx.lineTo(R.bot, halfH + 2);
        ctx.lineTo(L.bot, halfH + 2);
        ctx.closePath();
        ctx.fillStyle = pal[i] || '#9fb6d8';
        // ⭐ LIT IS NEARLY OPAQUE, NEXT IS A BREATH. The student needs to see at a
        // glance how much of the word is gone AND which finger comes next; those
        // are two facts and they get two strengths rather than two widgets.
        ctx.globalAlpha = state === 'lit' ? 0.82 : (0.13 + 0.16 * (opt.pulse || 0));
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // The sheen. ⚠️ ONE SOFT DIAGONAL, NOT A HIGHLIGHT PER PANEL — glass catches
    // the light across a window, not inside each piece of it.
    const sheen = ctx.createLinearGradient(-halfW, -halfH, halfW * 0.4, halfH);
    sheen.addColorStop(0, 'rgba(255,255,255,0.13)');
    sheen.addColorStop(0.45, 'rgba(255,255,255,0.03)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(-halfW, -halfH, halfW * 2, halfH * 2);

    // ── the crazing ─────────────────────────────────────────────────────────
    // ⚠️ IT IS THE DANGER SIGNAL AND IT IS FROZEN PER PANE. A pane about to land
    // crazes; the fractures do not move once they appear, because glass that
    // re-cracks every frame is a shimmer, not a warning.
    if (opt.crack > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.25 + 0.45 * opt.crack).toFixed(3) + ')';
        ctx.lineWidth = 1.1;
        for (const f of cut.cracks) {
            const reach = f.reach * Math.max(halfW, halfH) * (0.6 + 0.6 * opt.crack);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let s = 1; s <= 3; s++) {
                const a = f.a + f.bend * (s / 3);
                ctx.lineTo(Math.cos(a) * reach * (s / 3), Math.sin(a) * reach * (s / 3) * 0.7);
            }
            ctx.stroke();
        }
    }
    ctx.restore();

    // ── the lead ────────────────────────────────────────────────────────────
    const lead = Math.max(1.6, halfH * 0.13);
    ctx.strokeStyle = 'rgba(3,5,11,0.92)';
    ctx.lineWidth = lead;
    for (let i = 1; i < n; i++) {
        const c = cameX(i);
        ctx.beginPath();
        ctx.moveTo(c.top, -halfH); ctx.lineTo(c.bot, halfH); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(190,215,255,0.16)';
    ctx.lineWidth = 1;
    for (let i = 1; i < n; i++) {
        const c = cameX(i);
        ctx.beginPath();
        ctx.moveTo(c.top + lead * 0.5, -halfH); ctx.lineTo(c.bot + lead * 0.5, halfH); ctx.stroke();
    }

    // ── the rim, which is the only thing carrying state ─────────────────────
    panePath(ctx, halfW, halfH, cut, opt.piece);
    if (opt.glow) { ctx.shadowColor = opt.glow; ctx.shadowBlur = 14; }
    ctx.strokeStyle = opt.rim || '#ffffff';
    ctx.lineWidth = opt.lineWidth || 1.8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ── the letters ─────────────────────────────────────────────────────────
    // ⚠️ A LIT LETTER GOES DARK AND AN UNLIT ONE GOES PALE, which is the inverse
    // of every other view in this app and is right here: the letter is a lead
    // glyph and the glass behind it is what changed. Making the letter brighter
    // as well would put two signals on one panel and dim the finger colour that
    // panel exists to teach.
    ctx.font = 'bold ' + Math.round(opt.size || 16) + 'px "Courier Prime", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
        const ch = text[i];
        if (!ch || ch === ' ') continue;
        const lx = -halfW + (i + 0.5) * pw;
        if (i < typed) ctx.fillStyle = 'rgba(6,9,16,0.88)';
        else if (i === typed) ctx.fillStyle = '#ffffff';
        else ctx.fillStyle = 'rgba(196,212,238,0.72)';
        ctx.fillText(ch, lx, 0);
    }
    ctx.restore();
}

/**
 * THE PRISM. White light goes in the back face; the colours come out the front.
 *
 * ⭐ IT IS THE SAME TRIANGLE POINTING THE SAME WAY AS v1.1.0's SHIP, and that is
 * on purpose. Jake's ruling after Escape Key (game-sprites.js's own header):
 * *"do not rewrite what works."* Aiming at the locked target was the prototype's
 * best idea in this game and it is untouched — a prism is what the triangle
 * turns out to have been all along, once the targets became glass.
 *
 * ⚠️ WITH NO LOCK IT POINTS UP AND HOLDS STILL. A prism idly rotating is telling
 * the student about a target that does not exist.
 *
 * @param {object} o
 *   fan   {string[]} the finger palette, in order — the resting dispersion, and
 *                    a free permanent legend for the colours on the panes
 *   flare {number}   0..1, the white-out on a wrong key
 */
export function drawPrism(ctx, x, y, r, angle, o) {
    const opt = o || {};
    const flare = Math.max(0, Math.min(1, opt.flare || 0));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle == null ? -Math.PI / 2 : angle);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // The incoming beam. ⚠️ WHITE, ALWAYS, AND ALWAYS THERE — it is the premise
    // of the picture. A prism with nothing entering it is a triangle.
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.34 + 0.4 * flare).toFixed(3) + ')';
    ctx.lineWidth = Math.max(2, r * 0.17);
    ctx.beginPath();
    ctx.moveTo(-r * 2.7, 0); ctx.lineTo(-r * 0.60, 0); ctx.stroke();

    // The resting dispersion.
    const fan = opt.fan || [];
    for (let i = 0; i < fan.length; i++) {
        const t = fan.length === 1 ? 0 : (i / (fan.length - 1) - 0.5);
        const a = t * 0.46;
        ctx.strokeStyle = fan[i];
        ctx.globalAlpha = 0.30 + 0.35 * flare;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(r * 0.92, 0);
        ctx.lineTo(r * 0.92 + Math.cos(a) * r * 1.75, Math.sin(a) * r * 1.75);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // The body.
    const body = ctx.createLinearGradient(-r * 0.6, -r * 0.7, r, r * 0.7);
    body.addColorStop(0, 'rgba(150,200,255,0.16)');
    body.addColorStop(0.55, 'rgba(255,255,255,' + (0.20 + 0.5 * flare).toFixed(3) + ')');
    body.addColorStop(1, 'rgba(120,230,255,0.12)');
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(-r * 0.60, r * 0.74);
    ctx.lineTo(-r * 0.60, -r * 0.74);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();

    ctx.strokeStyle = flare > 0.05 ? '#ffffff' : 'rgba(210,240,255,0.9)';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#9fe8ff';
    ctx.shadowBlur = 8 + 14 * flare;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // The bright edge along the face the light leaves by.
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(r * 0.94, -r * 0.06);
    ctx.lineTo(-r * 0.52, -r * 0.66);
    ctx.stroke();

    ctx.restore();
}

/**
 * One refracted shot: a tapering coloured beam with a white core.
 *
 * ⚠️ IT IS FIRED ON A CORRECT KEY AND IN THE KEY'S FINGER COLOUR, which is the
 * whole reason the ship became a prism. The shot, the panel it lights and the
 * finger that typed it are one colour in three places.
 *
 * @param {number} t 0..1 remaining life; the beam thins and fades with it.
 */
export function drawRefract(ctx, x0, y0, x1, y1, color, t) {
    const k = Math.max(0, Math.min(1, t));
    if (k <= 0) return;
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const w0 = 6.5 * k, w1 = 2.2 * k;
    ctx.save();
    ctx.globalAlpha = 0.22 + 0.58 * k;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15 * k;
    ctx.beginPath();
    ctx.moveTo(x0 + nx * w0, y0 + ny * w0);
    ctx.lineTo(x1 + nx * w1, y1 + ny * w1);
    ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
    ctx.lineTo(x0 - nx * w0, y0 - ny * w0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.45 + 0.55 * k;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x0 + nx * w0 * 0.34, y0 + ny * w0 * 0.34);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x0 - nx * w0 * 0.34, y0 - ny * w0 * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}
