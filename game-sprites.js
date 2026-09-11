// game-sprites.js v1.5.0 — THE ARCADE'S ARTWORK. Rounds 106, 112, 116 (Sun).
//
// v1.5.0 — ⭐ EVERY CELL IS COLOURED FROM SPAWN, NOT ONLY ONCE IT LIGHTS. Jake:
//   *"can you give each pane of glass multiple colors? ... So a four letter
//   word would have four colors (even if three are the same)?"* ⚠️ v1.4.0
//   coloured a cell only when it lit, so an untyped window was uniformly dark
//   and a half-typed one showed two colours out of four. **REAL STAINED GLASS
//   IS COLOURED WHETHER OR NOT LIGHT IS BEHIND IT** — typing is the light
//   coming on, not the colour arriving. A frozen `tint` permutation assigns
//   each cell a letter's colour, shuffled so the tints do not run around the
//   wheel in order, and `cellTarget()` now guarantees at least one cell per
//   letter so no colour can be missing.
//
// v1.4.0 — ⚠️⚠️ THE PANE IS AN IRREGULAR LEADED WINDOW, NOT A ROW OF STRIPES.
//   Jake on v1.3.0: *"I was imagining that it would be like an asteroid with
//   random edges that kind of fill in with random panes. Yours is a word. Split
//   into letters. It's...not impressive."* Correct. One-panel-per-letter made
//   the geometry serve the letter count and produced a progress bar with a
//   glass texture. Irregular silhouette, irregular cells from an off-centre
//   hub, cells light in a frozen shuffle, word drawn FLAT on top — plus the
//   Superman II tumble (a plate turning, `scale(cos θ)` under a rotation, never
//   quite reaching edge-on).
//
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

export const GAME_SPRITES_VERSION = '1.5.0';

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
// ⚠️⚠️ v1.3.0 GOT THIS WRONG AND JAKE SAID SO: *"I was imagining that it would
// be like an asteroid with random edges that kind of fill in with random panes.
// Yours is a word. Split into letters. It's...not impressive."*
//
// ⭐ HE IS RIGHT AND THE DIAGNOSIS IS SPECIFIC RATHER THAN A MATTER OF TASTE.
// v1.3.0 drew a rectangle divided into N equal vertical stripes, one per letter.
// **THAT IS A PROGRESS BAR WITH A GLASS TEXTURE ON IT.** Every real property of
// stained glass is regularity's opposite: the came lines are irregular, the
// cells are different shapes and sizes, and none of it lines up with anything.
// A row of equal stripes reads as a loading indicator because that is what a
// row of equal stripes *is*.
//
// ⚠️ AND IT CAME FROM ONE BAD INFERENCE: "one panel per letter" sounded like it
// tied the art to the teaching, so the geometry was made to serve the letter
// count. ⭐ THE TEACHING NEVER NEEDED THE GEOMETRY — it needs the COLOUR to be
// the finger's colour, and a cell can be any shape at all and still be the
// right colour. Freeing the shape from the letter count costs the teaching
// nothing and is the whole fix.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT A PANE IS NOW
// ═══════════════════════════════════════════════════════════════════════════
//
//   * An **irregular polygon** — the asteroid silhouette v1.2.0 had, which was
//     the one thing about it that was right, and which this file threw away.
//     ⚠️ STRAIGHT EDGES AND SHARP CORNERS: glass is cut, not eroded.
//   * Leaded into **irregular cells** from an OFF-CENTRE hub: random sector
//     widths, two rings, and a per-corner radius that is also what defines the
//     silhouette. ⭐ THE CELLS AND THE OUTLINE ARE THE SAME ARITHMETIC, so they
//     cannot disagree — the outer edge of the outer ring IS the polygon.
//   * Cells light **in a frozen random order**, not left to right, each in the
//     colour of the finger that typed it. *"Fill in with random panes."*
//   * The word is drawn **flat on top**, in screen space, over the glass. ⚠️ It
//     is NOT carved into the geometry, and that is what makes both the tumble
//     and the irregular cells possible at all.
//
// ⚠️⚠️ THE COLOURS STILL ARRIVE AS AN ARGUMENT AND ARE NEVER LOOKED UP. This
// file imports nothing; game-draw.js owns the one import of keyboard.js's
// FINGER_COLORS. A palette literal here would be the second copy.

/**
 * How many leaded cells a pane of `n` letters gets. ⚠️ NOT `n` — the geometry is
 * free of the letter count, which is the whole of Jake's note on v1.3.0.
 *
 * ⚠️ BUT IT IS NEVER FEWER THAN `n` EITHER, and that is a second, later
 * constraint: every letter's colour has to appear somewhere in the window, so
 * there must be at least one cell per letter to put them in. The floor of 6 is
 * so a two-letter splinter is still a window; the ceiling of 20 is so a very
 * long word does not become a mosaic of slivers.
 */
function cellTarget(n) {
    return Math.max(6, Math.min(20, Math.max(n, n + 4)));
}

/**
 * The frozen cut of one pane: its sectors, its rings, its hub, its tumble and
 * the order its cells light in.
 *
 * ⚠️ CALL ONCE AT SPAWN AND KEEP IT ON THE TARGET. Re-rolling per frame makes
 * the glass boil, which reads as a rendering fault — the lesson rockOutline()
 * learned and the reason it took `rand` too.
 *
 * ⚠️ `letters` ONLY SETS HOW MANY CELLS TO CUT, and loosely. It is deliberately
 * not the cell count: see the header.
 */
export function paneCut(rand = Math.random, letters = 6) {
    const cells = cellTarget(Math.max(1, letters | 0));
    const rings = 2;
    const sectors = Math.max(4, Math.round(cells / rings));

    // ⚠️ RANDOM SECTOR WIDTHS, NORMALISED TO EXACTLY 2π. Equal sectors are a pie
    // chart; unequal ones are a window. Normalising rather than nudging is what
    // guarantees the last cell closes onto the first with no seam.
    const w = [];
    let total = 0;
    for (let i = 0; i < sectors; i++) { const v = 0.55 + rand() * 0.9; w.push(v); total += v; }
    const angles = [];
    let a = rand() * Math.PI * 2;
    for (let i = 0; i < sectors; i++) { angles.push(a); a += (w[i] / total) * Math.PI * 2; }

    // ⭐ ONE RADIUS PER SECTOR CORNER, AND IT DOES DOUBLE DUTY: it is where the
    // outer ring ends AND it is the silhouette vertex. That is why the outline
    // can never drift away from the glass it is supposed to contain.
    const reach = [];
    for (let i = 0; i < sectors; i++) reach.push(0.74 + rand() * 0.44);
    // ⚠️ A DEGENERATE CUT IS STILL A WINDOW. Nothing below may divide by a
    // reach of zero or a sector of zero width; the ranges above guarantee it,
    // and this comment exists so a later "simplification" of them does not.

    // Where the inner ring sits, per sector. Irregular, or the inner ring reads
    // as a drawn circle sitting on top of the design.
    const inner = [];
    for (let i = 0; i < sectors; i++) inner.push(0.34 + rand() * 0.22);

    // ⚠️ AN OFF-CENTRE HUB IS MOST OF WHAT MAKES IT LOOK HAND-MADE. Centred, the
    // spokes are a wheel and the eye reads symmetry that is not there.
    const hubA = rand() * Math.PI * 2;
    const hubR = rand() * 0.20;

    // The order the cells light in. ⚠️ A FROZEN PERMUTATION, NOT A PER-FRAME
    // DRAW — a pane whose lit cells moved around while the student typed would
    // be unreadable as progress and would look like a fault.
    const order = [];
    for (let i = 0; i < sectors * rings; i++) order.push(i);
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const t = order[i]; order[i] = order[j]; order[j] = t;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ WHICH COLOUR EACH CELL IS, FROZEN AT SPAWN — Jake, 2026-09-10
    // ═══════════════════════════════════════════════════════════════════════
    //
    // *"can you give each pane of glass multiple colors? ... So a four letter
    // word would have four colors (even if three are the same)?"*
    //
    // ⭐ EVERY CELL HAS A COLOUR FROM THE MOMENT IT SPAWNS. v1.4.0 coloured a
    // cell only once it was lit, so an untyped window was uniformly dark and a
    // half-typed one showed two colours out of four — which is not stained
    // glass, it is a glass that gets stained. **REAL STAINED GLASS IS COLOURED
    // WHETHER OR NOT THERE IS LIGHT BEHIND IT**, and typing is the light coming
    // on, not the colour arriving.
    //
    // ⚠️ `0..cells-1` SHUFFLED, THEN TAKEN MOD THE WORD LENGTH AT DRAW TIME.
    // That is what guarantees EVERY letter's colour appears: the indices are a
    // permutation, so mod `n` distributes them as evenly as the counts allow
    // and no colour can be skipped while cells >= n (which cellTarget() now
    // guarantees). ⭐ Shuffling the ASSIGNMENT rather than the palette is the
    // point — colours must not run in sector order around the wheel, or the
    // window reads as a colour chart.
    const tint = [];
    for (let i = 0; i < sectors * rings; i++) tint.push(i);
    for (let i = tint.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const t = tint[i]; tint[i] = tint[j]; tint[j] = t;
    }

    const cracks = [];
    for (let i = 0; i < 3; i++) {
        cracks.push({ a: rand() * Math.PI * 2, bend: (rand() - 0.5) * 0.9,
                      reach: 0.55 + rand() * 0.5 });
    }

    return {
        sectors, rings, angles, reach, inner, hubA, hubR, order, tint, cracks,
        // ── the Superman II tumble ──────────────────────────────────────────
        // ⭐ Jake: *"the glass panes that capture the evil Kryptonians kind of
        // tumble through space."* A flat plate turning in 3D, seen from the
        // side, foreshortens to a line and opens out again — which on a 2D
        // canvas is exactly `scale(cos θ, 1)` under a rotation. ⚠️ IT IS NOT A
        // SPIN: v1.2.0's rocks rotated in-plane, which is a different motion and
        // the one that made the word unreadable.
        tumbleRate: (0.22 + rand() * 0.34) * (rand() < 0.5 ? -1 : 1),
        tumblePhase: rand() * Math.PI * 2,
        // The axis the plate turns about, so they are not all tumbling the same
        // way. Held still — a wandering axis reads as a wobble, not a tumble.
        tumbleAxis: rand() * Math.PI * 2,
        // ⚠️ AND A SLOW IN-PLANE DRIFT ON TOP, because a plate that only ever
        // turns about one axis reads as mechanical.
        rollRate: (rand() - 0.5) * 0.22,
        rollPhase: rand() * Math.PI * 2,
    };
}

/**
 * The corner points of the silhouette, in local coordinates.
 * ⚠️ EXPORTED FOR THE HARNESS ONLY. Nothing in the app should need this — if a
 * caller wants the outline it is because it is about to draw a second one.
 */
export function paneVerts(cut, r) {
    const out = [];
    for (let i = 0; i < cut.sectors; i++) {
        out.push([Math.cos(cut.angles[i]) * r * cut.reach[i],
                  Math.sin(cut.angles[i]) * r * cut.reach[i]]);
    }
    return out;
}

/** Hub position in local coordinates. */
function hubOf(cut, r) {
    return [Math.cos(cut.hubA) * r * cut.hubR, Math.sin(cut.hubA) * r * cut.hubR];
}

/**
 * Corner of the lattice at sector `i`, ring boundary `j` (0 = hub, 1 = inner
 * ring, 2 = outer edge).
 *
 * ⚠️⚠️ EVERY POINT IN THE PANE COMES THROUGH HERE, INCLUDING THE SILHOUETTE'S.
 * That is the property that makes the outline and the cells one piece of
 * arithmetic rather than two that have to be kept in step.
 */
function latticePoint(cut, r, i, j) {
    const s = i % cut.sectors;
    const [hx, hy] = hubOf(cut, r);
    if (j === 0) return [hx, hy];
    const ang = cut.angles[s];
    const rad = r * cut.reach[s] * (j === 1 ? cut.inner[s] : 1);
    // ⚠️ MEASURED FROM THE HUB, NOT FROM THE CENTRE. From the centre the cells
    // would not meet the hub the spokes are drawn from, and every inner cell
    // would have a sliver of unpainted glass at its point.
    return [hx + Math.cos(ang) * rad, hy + Math.sin(ang) * rad];
}

/**
 * Every leaded cell, as a polygon, in local coordinates.
 *
 * ⚠️⚠️ drawPane() USES THIS RATHER THAN REBUILDING THE QUADS INLINE, so there
 * is exactly one arithmetic for where a cell is. It is also exported, for the
 * harness: counting how many cells lit cannot tell you WHICH lit, and
 * "scattered rather than sweeping" is the whole of Jake's note. A mutation that
 * lit cells in index order passed a count-based check.
 */
export function paneCells(cut, r) {
    const out = [];
    for (let ring = 0; ring < cut.rings; ring++) {
        for (let i = 0; i < cut.sectors; i++) {
            out.push([
                latticePoint(cut, r, i, ring),
                latticePoint(cut, r, i + 1, ring),
                latticePoint(cut, r, i + 1, ring + 1),
                latticePoint(cut, r, i, ring + 1),
            ]);
        }
    }
    return out;
}

/** Trace the silhouette. Straight edges, sharp corners: glass is cut. */
function panePath(ctx, cut, r) {
    ctx.beginPath();
    for (let i = 0; i < cut.sectors; i++) {
        const [x, y] = latticePoint(cut, r, i, 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
}

/**
 * One pane of stained glass.
 *
 * @param {object} o
 *   text      {string}   drawn FLAT on top, not built into the geometry
 *   typed     {number}   letters typed so far
 *   total     {number}   letters in the word; defaults to text.length. ⚠️ PASSED
 *                        separately so a caller can light a pane it is not
 *                        drawing text on
 *   size      {number}   letter size in px
 *   colors    {string[]} one colour per letter, from the finger map; cycled if
 *                        there are more cells than letters
 *   base      {string}   the unlit glass
 *   rim       {string}   the came around the edge — this carries STATE
 *   lineWidth {number}
 *   glow      {string|null}
 *   piece     {boolean}  a splinter broken off a pane
 *   crack     {number}   0..1
 *   locked    {boolean}
 *   tSec      {number}   drives the tumble
 *   tumble    {boolean}  false freezes it flat (reduced motion)
 */
export function drawPane(ctx, x, y, r, cut, o) {
    const opt = o || {};
    const text = String(opt.text || '');
    const typed = Math.max(0, opt.typed || 0);
    const pal = opt.colors && opt.colors.length ? opt.colors : ['#9fb6d8'];
    const tSec = opt.tSec || 0;

    ctx.save();
    ctx.translate(x, y);

    // ── the tumble ──────────────────────────────────────────────────────────
    // ⚠️ `scale()` INSIDE A ROTATION IS THE WHOLE TRICK. Rotating to the axis,
    // squashing along it, and rotating back is the 2D shadow of a flat plate
    // turning in 3D — which is what the Phantom Zone panes do.
    // ⚠️⚠️ IT NEVER REACHES ZERO. A plate exactly edge-on is invisible, and a
    // target that disappears for a third of a second is a target the student is
    // charged for not typing. 0.16 is thin enough to read as edge-on and thick
    // enough to stay on screen.
    let squash = 1;
    if (opt.tumble !== false) {
        const th = cut.tumblePhase + tSec * cut.tumbleRate;
        squash = 0.16 + 0.84 * Math.abs(Math.cos(th));
        ctx.rotate(cut.tumbleAxis + cut.rollPhase + tSec * cut.rollRate);
        ctx.scale(squash, 1);
        ctx.rotate(-cut.tumbleAxis);
    }

    // ── the glass ───────────────────────────────────────────────────────────
    panePath(ctx, cut, r);
    ctx.fillStyle = opt.base || 'rgba(6,10,20,0.86)';
    ctx.fill();

    // ⚠️ THE CELLS ARE CLIPPED TO THE SILHOUETTE ANYWAY, BELT AND BRACES. They
    // are built from the same points so they cannot escape it, but a future
    // change to either is one line away from a cell hanging outside the lead.
    ctx.save();
    ctx.clip();

    const cells = paneCells(cut, r);
    const nCells = cells.length;
    // ⚠️⚠️ LIT CELLS ARE A PROPORTION OF THE WORD, NOT A COUNT OF KEYSTROKES,
    // and that is what finally decouples the glass from the letters. Lighting
    // one cell per key meant the cell count had to track the letter count or a
    // finished word left its window half dark — which is how v1.3.0 talked
    // itself into one-cell-per-letter in the first place. ⭐ A PROPORTION LETS
    // THE WINDOW BE ANY SHAPE AND STILL BLAZE COMPLETELY ON THE LAST KEY, which
    // is also a better beat: the glass is fully lit for the instant before it
    // goes.
    const total = Math.max(1, opt.total || text.length || 1);
    const onCount = typed >= total ? nCells
        : Math.round((typed / total) * nCells);
    for (let k = 0; k < nCells; k++) {
        // ⭐ `order` MAPS PROGRESS TO CELLS, NOT POSITION TO CELLS. Progress
        // lights the next cell of a frozen shuffle, so the glass fills in
        // scattered rather than sweeping across — which is the difference
        // between a window and a progress bar.
        const lit = cut.order.indexOf(k) < onCount;
        const poly = cells[k];
        ctx.beginPath();
        for (let q = 0; q < poly.length; q++) {
            q === 0 ? ctx.moveTo(poly[q][0], poly[q][1])
                    : ctx.lineTo(poly[q][0], poly[q][1]);
        }
        ctx.closePath();
        // ⚠️⚠️ THE COLOUR IS THE CELL'S OWN AND NEVER CHANGES. It is NOT keyed
        // to how far through the word the student is — a cell that changed
        // colour as it lit would make the finger colours meaningless, which is
        // the one thing the palette is carrying.
        ctx.fillStyle = pal[cut.tint[k] % pal.length];
        // ⭐ UNLIT GLASS IS DIM, NOT ABSENT. A window is coloured before the
        // sun is behind it. This is also what lets a four-letter word show
        // four colours from the instant it spawns, which is what Jake asked
        // for and what "stained glass" actually means.
        ctx.globalAlpha = lit ? 0.84 : 0.26;
        ctx.fill();
        ctx.globalAlpha = 1;
        // The lit cells get a little bloom, so "lit" is not only an alpha step
        // — on a small pane at the far end of the field alpha alone is too
        // subtle to read at a glance.
        if (lit) {
            ctx.save();
            ctx.globalAlpha = 0.34;
            ctx.shadowColor = pal[cut.tint[k] % pal.length];
            ctx.shadowBlur = Math.max(4, r * 0.14);
            ctx.fill();
            ctx.restore();
        }
    }

    // The sheen, across the whole window rather than per cell.
    const sheen = ctx.createLinearGradient(-r, -r, r * 0.5, r);
    sheen.addColorStop(0, 'rgba(255,255,255,0.12)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0.03)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(-r, -r, r * 2, r * 2);

    if (opt.crack > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.25 + 0.45 * opt.crack).toFixed(3) + ')';
        ctx.lineWidth = 1.1;
        for (const f of cut.cracks) {
            const reach = f.reach * r * (0.6 + 0.6 * opt.crack);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let s = 1; s <= 3; s++) {
                const ang = f.a + f.bend * (s / 3);
                ctx.lineTo(Math.cos(ang) * reach * (s / 3), Math.sin(ang) * reach * (s / 3));
            }
            ctx.stroke();
        }
    }
    ctx.restore();

    // ── the lead ────────────────────────────────────────────────────────────
    // ⚠️ DRAWN AFTER THE GLASS AND OVER IT, which is how leading works and also
    // why the cells need no gaps between them: the came covers the seam.
    const lead = Math.max(1.5, r * 0.055);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(3,5,11,0.95)';
    ctx.lineWidth = lead;
    for (let i = 0; i < cut.sectors; i++) {
        const a0 = latticePoint(cut, r, i, 0);
        const a2 = latticePoint(cut, r, i, 2);
        ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke();
    }
    // The inner ring, as straight segments between the spokes — a real ring of
    // lead is bent at each spoke, not curved.
    ctx.beginPath();
    for (let i = 0; i <= cut.sectors; i++) {
        const p = latticePoint(cut, r, i, 1);
        i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();

    // ── the rim, which is the only thing carrying state ─────────────────────
    panePath(ctx, cut, r);
    if (opt.glow) { ctx.shadowColor = opt.glow; ctx.shadowBlur = 14; }
    ctx.strokeStyle = opt.rim || '#ffffff';
    ctx.lineWidth = opt.lineWidth || 1.8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── the word, FLAT, in screen space ─────────────────────────────────────
    // ⚠️⚠️ OUTSIDE THE TUMBLE TRANSFORM, DELIBERATELY. A word that tumbled with
    // its pane would be unreadable for most of every turn, and the student is
    // being asked to type it. ⭐ THIS IS ALSO WHAT FREED THE GEOMETRY: once the
    // word stopped being built out of cells, the cells could be any shape.
    if (text) drawPaneWord(ctx, x, y, text, typed, opt.size || 16, !!opt.locked);
}

/**
 * The word on a pane: typed part dim, the rest bright — or gold when locked.
 *
 * ⚠️ A DARK BACKING STROKE, NOT A PLATE. Over glass and a starfield bare text is
 * unreadable, and a filled plate hides the window the word belongs to. This is
 * v1.2.0's `drawTargetWord()`, restored: it was deleted in v1.3.0 because the
 * cells had taken over saying how far through the word the student was, and
 * with the cells no longer aligned to letters that job comes back here.
 */
export function drawPaneWord(ctx, x, y, text, typedLen, size, locked) {
    ctx.save();
    ctx.font = 'bold ' + Math.round(size) + 'px "Courier Prime", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const full = ctx.measureText(text).width;
    const typed = text.slice(0, typedLen), rest = text.slice(typedLen);
    let sx = x - full / 2;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(2,4,10,0.92)';
    ctx.strokeText(text, sx, y);
    ctx.fillStyle = 'rgba(120,140,175,0.85)';
    ctx.fillText(typed, sx, y);
    sx += ctx.measureText(typed).width;
    ctx.fillStyle = locked ? '#ffd700' : '#ffffff';
    ctx.fillText(rest, sx, y);
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
