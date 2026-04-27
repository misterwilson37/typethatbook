// adventure-renderer.js — v0.2.7
//
// v0.2.7 — Underscore-style cursor gap + keyboard skin shim:
//   - Cursor-gap red bridge line drops to LETTER BASELINE (like an underscore).
//     Space label below the line; tab/enter labels above.
//   - Keyboard re-tinted to muted vintage finger colors via MutationObserver
//     shim. keyboard.js untouched; classic view bit-for-bit unchanged.
//   - Death cleans falling-letter and tilt state so the respawn sentence
//     displays cleanly. (Already mostly working in v0.2.5; locking it down.)
//
// v0.2.6 — Letters become walkable surface, gaps render only at cursor.
//
// v0.2.5 — Connector line in gap only, letter tilt on stumble, letters fall
//   on plummet, head-rolling ghost, leap arc clears next paragraph.
//
// v0.2.4 — Diagnostic overlay + stumble/plummet split + curly-quote flip +
//   platform line below words.
//
// v0.2.3 — Integration of Gemini's refined animation block (gait, hop, leap,
//   stumble, respawn, three ghost styles). X-eyes only on actual ghosts.
//
// v0.2.2 bugfixes:
//   - Respawn detritus: paragraph crossings now rebuild via
//     _relayoutCurrentWorld instead of appending forever.
//   - Preview paragraph fades to ~30% alpha and loses its platform underline.
//   - Tabs render distinctly: wider gap, italic "tab" label.
//   - Gravestone inscription: each grave displays the failed letter.
//   - Space pit drops below the platform line so the figure visibly hops.
//
// v0.2.1 bugfixes:
//   - Per-letter rendering with active-cursor highlight.
//   - Bigger text (32px).
//   - "space" italic label restored.
//   - Curly-quote fix: ctx.fontKerning = 'none'.
//
// Observer of TTB events. Listens to ttb:* CustomEvents on document and renders
// the typing experience as a stick figure walking across word-platforms with
// a parchment aesthetic. Owns no game logic. Reads no game state directly.
// All it knows is what game.js tells it via events.
//
// Mounted by game.js when the user has selected Adventure view. Unmounted
// (canvas hidden, listeners removed) when they switch back to Classic.
//
// Events consumed:
//   ttb:textLoaded   { fullText, chapterTitle }       — new chapter ready
//   ttb:textCleared  {}                                — chapter unloading
//   ttb:positionSet  { position, isResume }            — cursor jumped (resume, fail, etc)
//   ttb:keystroke    { char, correct, position, expected, status }
//   ttb:fail         { reason, position }              — hard stop / spam / afk
//   ttb:respawn      { position }                      — resume after pause
//   ttb:stats        { wpm, accuracy, ... }            — periodic stats update
//   ttb:complete     {}                                — chapter finished
//
// Event source: document.addEventListener('ttb:keystroke', ...). The renderer
// never reads from window.* / DOM ids it doesn't own / globals.
//
// Design rules:
//   - Canvas-only DOM mutation. The renderer never touches #text-stream,
//     #virtual-keyboard, the modal, or any classic-view element.
//   - Idempotent mount/unmount. Calling mount twice is safe; unmount removes
//     all listeners.
//   - Survives missed events. If textLoaded was missed, the renderer just
//     shows nothing until the next one arrives.

export const RENDERER_VERSION = '0.2.7';

const TEXT_FONT = '32px "IM Fell English", Georgia, serif';
const SPACE_LABEL_FONT = 'italic 13px "IM Fell English", Georgia, serif';

// ============================================================================
// Public API
// ============================================================================

let _instance = null;

export function mountAdventureRenderer() {
  if (_instance) return _instance;
  _instance = new AdventureRenderer();
  _instance.mount();
  return _instance;
}

export function unmountAdventureRenderer() {
  if (!_instance) return;
  _instance.unmount();
  _instance = null;
}

// ============================================================================
// Renderer
// ============================================================================

class AdventureRenderer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.w = 0;
    this.h = 0;

    // ---- Source-of-truth from events ----
    this.fullText = '';
    this.currentPos = 0;
    this.lastKeystrokeTime = 0;
    this.wpm = 0;

    // ---- Animation state ----
    this.state = 'idle';                   // idle | walk | jog | run | fall | respawning
    this.cameraX = 0;
    this.targetCameraX = 0;
    this.cameraY = 0;
    this.targetCameraY = 0;
    this.characterY = 0;                   // unused by gait but kept for API compat
    this.walkPhase = 0;                    // gait progression
    this.figureAngle = 0;                  // smoothed platform tilt
    this.fallPhase = 0;
    this.stumblePhase = 0;     // transient mistake stumble (no death)
    this.respawnPhase = 0;
    this.isJumping = false;
    this.jumpPhase = 0;
    this.jumpDirection = 1;
    this.jumpHeight = 80;             // dynamic per-leap, set in _triggerJump
    this.isHopping = false;
    this.hopPhase = 0;

    // ---- World layout ----
    // wordSegments contains all paragraphs flattened into a single coord space.
    // Each segment carries its paraIdx and yOffset for camera-aware rendering.
    this.wordSegments = [];
    this.totalWidth = 0;
    this.paragraphs = [];                  // text per paragraph
    this.paragraphStartPos = [];           // global char index where each paragraph starts
    this.currentParaIdx = 0;

    // ---- Terrain progression (per-paragraph; resets at each paragraph break) ----
    this.globalWordIdx = 0;
    this.prevSign = 0;
    this.runLen = 0;

    // ---- Crumbling words (key: `${paraIdx}:${startPos}`) ----
    this.crumbleAt = {};

    // ---- Per-letter status (mirrors game.js classes done-perfect/fixed/dirty) ----
    // Keyed by global char position. Populated as the user types; cleared on
    // textLoaded and respawn.
    this.letterStatus = {};
    // Last-mistake flash: position -> birthtime, fades out
    this.mistakeFlash = {};
    // Per-letter "kicked rock" tilt — the letter that was just mistyped tilts
    // a few degrees, like the figure tripped over it. Settles back to upright
    // when correctly typed. Map: globalPos -> { angleRad, setAt }.
    this.letterTilts = {};
    // Per-letter "falling away" — when the figure plummets, the letter(s)
    // they were stumbling on physically fall off-screen. Map: globalPos ->
    // { startTime, vx, rot } animation state.
    this.fallingLetters = {};

    // ---- Background decorations ----
    this.ghosts = [];
    this.gravestones = [];

    // ---- Bound listeners for unmount ----
    this._listeners = [];
    this._raf = null;
    this._resizeObserver = null;

    // ---- Diagnostic (toggle with backtick key) ----
    // Helps chase rendering bugs by showing live internal state on top of
    // the canvas. Off by default; doesn't affect rendering when off.
    this._debug = false;
    this._eventLog = [];        // ring buffer of recent events for display
    this._eventLogMax = 12;

    // ---- Keyboard skin shim ----
    // TTB's keyboard.js sets per-key finger colors via inline backgroundColor
    // (rainbow palette + '38' alpha). For the parchment aesthetic we re-tint
    // to muted vintage tones via a MutationObserver. Done as a shim so we
    // don't have to touch keyboard.js or game.js. Mounted with the renderer,
    // disconnected on unmount.
    this._kbObserver = null;
  }

  // Map of TTB rainbow hex (uppercase, no alpha) → vintage parchment tones.
  static get _KEY_COLOR_MAP() {
    return {
      '#FF69B4': '#b86a78',  // left-pinky   pink   → dusty rose
      '#E53935': '#a85040',  // left-ring    red    → brick
      '#FF9800': '#c8932e',  // left-middle  orange → mustard
      '#FDD835': '#c4a838',  // left-index   yellow → wheat
      '#43A047': '#6a8a5e',  // right-index  green  → sage
      '#1E88E5': '#607590',  // right-middle blue   → dusty blue
      '#8E24AA': '#6e4866',  // right-ring   purple → aubergine
      '#4FC3F7': '#6c9499',  // right-pinky  lblue  → faded teal
    };
  }

  // --------------------------------------------------------------------------
  // Mount / unmount
  // --------------------------------------------------------------------------

  mount() {
    this.canvas = document.getElementById('adventure-canvas');
    if (!this.canvas) {
      console.warn('AdventureRenderer: #adventure-canvas not found in DOM');
      return;
    }
    this.canvas.classList.remove('hidden');
    this.ctx = this.canvas.getContext('2d');

    this._resize();
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.canvas.parentElement);

    this._on('ttb:textLoaded',  (d) => this._onTextLoaded(d));
    this._on('ttb:textCleared', ()  => this._onTextCleared());
    this._on('ttb:positionSet', (d) => this._onPositionSet(d));
    this._on('ttb:keystroke',   (d) => this._onKeystroke(d));
    this._on('ttb:fail',        (d) => this._onFail(d));
    this._on('ttb:respawn',     (d) => this._onRespawn(d));
    this._on('ttb:stats',       (d) => this._onStats(d));
    this._on('ttb:complete',    ()  => this._onComplete());

    // Backtick toggles diagnostic overlay (shows internal state on canvas)
    const onKey = (e) => {
      if (e.key === '`') { this._debug = !this._debug; }
    };
    document.addEventListener('keydown', onKey);
    this._listeners.push({ type: 'keydown', fn: onKey });

    // Keyboard skin: re-tint inline finger colors to vintage palette
    this._mountKeyboardSkin();

    this._raf = requestAnimationFrame((t) => this._loop(t));
  }

  unmount() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._kbObserver) {
      this._kbObserver.disconnect();
      this._kbObserver = null;
    }
    for (const { type, fn } of this._listeners) {
      document.removeEventListener(type, fn);
    }
    this._listeners.length = 0;
    if (this.canvas) this.canvas.classList.add('hidden');
  }

  // ---- Keyboard skin shim ----
  // Watches #virtual-keyboard for inline backgroundColor changes on .key
  // elements and re-applies the vintage equivalent. The TTB rainbow palette
  // gets re-mapped to a parchment-friendly muted palette.
  _mountKeyboardSkin() {
    const kb = document.getElementById('virtual-keyboard');
    if (!kb) return;
    const map = AdventureRenderer._KEY_COLOR_MAP;
    const ALPHA = '38';   // same alpha suffix keyboard.js uses

    const reskin = (el) => {
      // keyboard.js sets style.backgroundColor like '#FF69B438' (8 hex digits).
      // We pull it via the inline style attr (string form) since
      // getComputedStyle/getAttribute returns rgba() form which is harder.
      const inline = el.getAttribute('style') || '';
      const m = inline.match(/background-color:\s*(#[0-9A-Fa-f]{6,8})/);
      if (!m) return;
      const raw = m[1].toUpperCase();
      const prefix = raw.slice(0, 7);   // first 6 hex digits + #
      const replacement = map[prefix];
      if (!replacement) return;
      // Only re-set if not already vintage (avoids observer feedback loop)
      if (raw.startsWith(replacement.toUpperCase())) return;
      el.style.backgroundColor = replacement + ALPHA;
    };

    // Initial pass
    kb.querySelectorAll('.key').forEach(reskin);

    // Observe for future color changes (TTB recolors on layout switch etc.)
    this._kbObserver = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'attributes' && r.attributeName === 'style' &&
            r.target.classList && r.target.classList.contains('key')) {
          reskin(r.target);
        } else if (r.type === 'childList') {
          // Keys might be re-rendered; pass over any new ones
          r.addedNodes.forEach((n) => {
            if (n.nodeType === 1) {
              if (n.classList && n.classList.contains('key')) reskin(n);
              if (n.querySelectorAll) n.querySelectorAll('.key').forEach(reskin);
            }
          });
        }
      }
    });
    this._kbObserver.observe(kb, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
      subtree: true,
    });
  }

  _on(type, fn) {
    const wrapped = (e) => fn(e.detail || {});
    document.addEventListener(type, wrapped);
    this._listeners.push({ type, fn: wrapped });
  }

  _logEvent(label) {
    this._eventLog.push({ t: performance.now(), label });
    if (this._eventLog.length > this._eventLogMax) this._eventLog.shift();
  }

  _resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(300, rect.width) * dpr;
    this.canvas.height = Math.max(300, rect.height) * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
  }

  // --------------------------------------------------------------------------
  // Event handlers
  // --------------------------------------------------------------------------

  _onTextLoaded(d) {
    this.fullText = (d && d.fullText) || '';
    this.currentPos = (d && typeof d.position === 'number') ? d.position : 0;
    this._logEvent(`textLoaded len=${this.fullText.length} pos=${this.currentPos}`);

    // Reset terrain progression on new chapter
    this.globalWordIdx = 0;
    this.prevSign = 0;
    this.runLen = 0;
    this.crumbleAt = {};
    this.letterStatus = {};
    this.mistakeFlash = {};
    this.letterTilts = {};
    this.fallingLetters = {};
    this.ghosts = [];
    this.gravestones = [];
    this.currentParaIdx = 0;
    this.cameraX = 0;
    this.targetCameraX = 0;
    this.cameraY = 0;
    this.targetCameraY = 0;
    this.state = 'idle';

    // If we're resuming mid-chapter, mark all preceding chars as 'perfect'
    // so they render as completed (matches game.js's setupGame behavior).
    for (let i = 0; i < this.currentPos; i++) {
      this.letterStatus[i] = 'perfect';
    }

    this._splitParagraphs();
    this._setCurrentParaForPos(this.currentPos);
    this._relayoutCurrentWorld();
    this.cameraY = this._paragraphYOffset(this.currentParaIdx);
    this.targetCameraY = this.cameraY;
    const charX = this._xAtPosition(this.currentPos);
    this.cameraX = charX - this.w * 0.35;
    this.targetCameraX = this.cameraX;
  }

  _onTextCleared() {
    this.fullText = '';
    this.wordSegments = [];
    this.paragraphs = [];
    this.paragraphStartPos = [];
    this.crumbleAt = {};
    this.state = 'idle';
  }

  _onPositionSet(d) {
    if (typeof d.position !== 'number') return;
    this._logEvent(`positionSet pos=${d.position}`);
    this.currentPos = d.position;
    this._setCurrentParaForPos(this.currentPos);
    this._relayoutCurrentWorld();
    this.cameraY = this._paragraphYOffset(this.currentParaIdx);
    this.targetCameraY = this.cameraY;
    const charX = this._xAtPosition(this.currentPos);
    this.cameraX = charX - this.w * 0.35;
    this.targetCameraX = this.cameraX;
  }

  _onKeystroke(d) {
    this.lastKeystrokeTime = performance.now();

    if (d.correct) {
      // Record the just-completed letter's quality
      if (typeof d.completedPos === 'number' && d.statusAtCompleted) {
        this.letterStatus[d.completedPos] = d.statusAtCompleted;
        // Clear any error flash on this position
        delete this.mistakeFlash[d.completedPos];
        // Clear any "kicked rock" tilt — they made it past the letter that
        // had been askew.
        delete this.letterTilts[d.completedPos];
      }

      const oldPos = this.currentPos;
      const newPos = (typeof d.position === 'number') ? d.position : oldPos + 1;
      this.currentPos = newPos;

      // Did we cross a paragraph boundary?
      const newParaIdx = this._paragraphForPos(this.currentPos);
      if (newParaIdx !== this.currentParaIdx) {
        const goingUp = (newParaIdx % 2 === 1);  // alternating Y rule
        this._logEvent(`paraCross ${this.currentParaIdx}→${newParaIdx}`);
        this.currentParaIdx = newParaIdx;

        // Full rebuild on every paragraph crossing. wordSegments only ever
        // holds current + next-preview, both starting at X=0 in their own
        // coord space. Camera resets to put the figure (now at the start of
        // the new paragraph) into a comfortable spot on screen.
        this._relayoutCurrentWorld();
        const charX = this._xAtPosition(this.currentPos);
        this.cameraX = charX - this.w * 0.35;
        this.targetCameraX = this.cameraX;

        this.targetCameraY = this._paragraphYOffset(newParaIdx);
        this._triggerJump(goingUp);
      } else {
        // Small hop on whitespace crossing within a paragraph
        const charJustTyped = this.fullText[oldPos];
        if (charJustTyped === ' ' || charJustTyped === '\t') {
          this.isHopping = true;
          this.hopPhase = 0;
        }
      }
    } else {
      // Mistake — flash the current position red briefly, plus trigger a
      // transient stumble. Stumble interrupts the gait for ~350ms; the figure
      // recovers automatically. If they trip 3 times in a row, game.js fires
      // ttb:fail and we plummet.
      const pos = (typeof d.position === 'number') ? d.position : this.currentPos;
      this.mistakeFlash[pos] = performance.now();
      // Tilt the letter they tripped over. Direction alternates by hash of
      // position so it doesn't always lean the same way. Magnitude is 0.18
      // to 0.28 rad (~10-16 degrees) — enough to read as askew but not so
      // much it becomes hard to identify.
      const sign = (pos % 2 === 0) ? 1 : -1;
      const mag  = 0.18 + (((pos * 9301) % 100) / 1000);  // 0.18..0.28
      this.letterTilts[pos] = { angleRad: sign * mag, setAt: performance.now() };

      // Don't restart stumble if already stumbling — let the existing one play
      // out, then a new mistake can re-trigger.
      if (this.state !== 'stumble' && this.state !== 'fall' && this.state !== 'respawning') {
        this.state = 'stumble';
        this.stumblePhase = 0;
        this._logEvent(`stumble pos=${pos}`);
      }
    }
  }

  _onFail(d) {
    if (this.state === 'fall' || this.state === 'respawning') return;
    this._logEvent(`FAIL pos=${d && d.position} expected=${(d && d.expected) || '?'}`);
    this.state = 'fall';
    this.fallPhase = 0;

    // Letters fall away with the figure. Every letter currently tilted (the
    // ones they were tripping on) gets converted to a falling letter — the
    // visible cause of the plummet.
    const fallStart = performance.now();
    let lastFalling = null;
    for (const k of Object.keys(this.letterTilts)) {
      const pos = parseInt(k);
      const tilt = this.letterTilts[pos];
      this.fallingLetters[pos] = {
        startTime: fallStart,
        initialAngle: tilt.angleRad,
        // Slight horizontal scatter, accelerating downward
        vx: (Math.random() - 0.5) * 80,         // px/sec
        rot: (Math.random() - 0.5) * 4,         // rad/sec
      };
      if (lastFalling === null || pos > lastFalling) lastFalling = pos;
    }
    // The current cursor position also falls (in case it wasn't tilted)
    const failPos = (d && typeof d.position === 'number') ? d.position : this.currentPos;
    if (this.fallingLetters[failPos] == null) {
      this.fallingLetters[failPos] = {
        startTime: fallStart,
        initialAngle: 0,
        vx: (Math.random() - 0.5) * 80,
        rot: (Math.random() - 0.5) * 4,
      };
      if (lastFalling === null || failPos > lastFalling) lastFalling = failPos;
    }
    // Tilts are now expressed as falling animations, no longer separately tracked
    this.letterTilts = {};

    // Inscription: the last (rightmost) letter that fell — the one that
    // killed them. Falls back to the fail event's `expected` if no letters
    // were tracked as tilted.
    let inscription;
    if (lastFalling !== null && this.fullText[lastFalling]) {
      const ch = this.fullText[lastFalling];
      inscription = (ch === ' ') ? '␣' : (ch === '\n') ? '↵' : (ch === '\t') ? '⇥' : ch;
    } else {
      const failedChar = (d && d.expected) || '?';
      inscription = (failedChar === ' ') ? '␣'
                  : (failedChar === '\n') ? '↵'
                  : (failedChar === '\t') ? '⇥'
                  : failedChar;
    }

    const graveXPct = 0.04 + Math.random() * 0.92;
    const graveYPct = 0.84 + Math.random() * 0.10;
    this.gravestones.push({
      xPct: graveXPct,
      yPct: graveYPct,
      tilt: (Math.random() - 0.5) * 0.18,
      scale: 0.65 + Math.random() * 0.45,
      style: Math.random() < 0.55 ? 'rounded' : (Math.random() < 0.5 ? 'cross' : 'flat'),
      inscription,
    });

    // Ghost rises slowly from that gravestone. Style is randomized per death
    // for visual variety: 'limp' (short body, dangling arms), 'sheet' (classic
    // sheet ghost with wavy hem), or 'head' (Y-frame body with rolling head).
    const ghostStyles = ['limp', 'sheet', 'head'];
    const ghostStyle = ghostStyles[Math.floor(Math.random() * ghostStyles.length)];
    this.ghosts.push({
      style: ghostStyle,
      originXPct: graveXPct,
      originYPct: Math.max(0, graveYPct - 0.02),
      destXPct: 0.05 + Math.random() * 0.9,
      destYPct: 0.05 + Math.random() * 0.40,
      phase: Math.random() * Math.PI * 2,
      scale: 0.65 + Math.random() * 0.55,
      birthTime: performance.now(),
      riseMs: 2200 + Math.random() * 800,
    });
  }

  _onRespawn(d) {
    this._logEvent(`RESPAWN pos=${d && d.position}`);
    // Game tells us the new position. Reset terrain to flat (per Jake's design).
    this.state = 'respawning';
    this.respawnPhase = 0;
    if (typeof d.position === 'number') this.currentPos = d.position;
    this.globalWordIdx = 0;
    this.prevSign = 0;
    this.runLen = 0;
    this.crumbleAt = {};
    this.mistakeFlash = {};
    this.letterTilts = {};
    this.fallingLetters = {};
    // Clear status for everything from the respawn point forward — the user
    // must retype it. Keep prior characters as they were.
    for (const k of Object.keys(this.letterStatus)) {
      if (parseInt(k) >= this.currentPos) delete this.letterStatus[k];
    }
    this._setCurrentParaForPos(this.currentPos);
    this._relayoutCurrentWorld();
    const charX = this._xAtPosition(this.currentPos);
    this.cameraX = charX - this.w * 0.35;
    this.targetCameraX = this.cameraX;
  }

  _onStats(d) {
    if (typeof d.wpm === 'number') this.wpm = d.wpm;
  }

  _onComplete() {
    this.state = 'idle';
  }

  // --------------------------------------------------------------------------
  // Paragraph + position helpers
  // --------------------------------------------------------------------------

  _splitParagraphs() {
    // Split fullText into paragraphs on \n. Track their global start positions
    // so we can map a char index back to a paragraph index.
    this.paragraphs = [];
    this.paragraphStartPos = [];
    let pos = 0;
    const lines = this.fullText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      this.paragraphs.push(lines[i]);
      this.paragraphStartPos.push(pos);
      pos += lines[i].length + 1;  // +1 for the \n separator
    }
  }

  _paragraphForPos(globalPos) {
    // Binary search would be faster, but with N paragraphs in the dozens this is fine
    for (let i = this.paragraphStartPos.length - 1; i >= 0; i--) {
      if (globalPos >= this.paragraphStartPos[i]) return i;
    }
    return 0;
  }

  _setCurrentParaForPos(globalPos) {
    this.currentParaIdx = this._paragraphForPos(globalPos);
  }

  _localPosWithinPara(globalPos, paraIdx) {
    return globalPos - this.paragraphStartPos[paraIdx];
  }

  // --------------------------------------------------------------------------
  // Terrain progression — flat → gentle → rolling → climbing
  // --------------------------------------------------------------------------

  _stageFor(globalIdx) {
    if (globalIdx < 6)   return { flat: true };
    if (globalIdx < 13)  return { maxRun: 1, magScale: 0.6  };
    if (globalIdx < 23)  return { maxRun: 1, magScale: 1.0  };
    if (globalIdx < 41)  return { maxRun: 2, magScale: 1.0  };
    if (globalIdx < 66)  return { maxRun: 3, magScale: 1.05 };
                         return { maxRun: 4, magScale: 1.10 };
  }

  _paragraphYOffset(paraIdx) {
    return (paraIdx % 2 === 1) ? -90 : 0;
  }

  // --------------------------------------------------------------------------
  // World layout
  // --------------------------------------------------------------------------

  _buildParagraphSegments(text, startX, paraIdx) {
    const ctx = this.ctx;
    ctx.font = TEXT_FONT;
    if ('fontKerning' in ctx) ctx.fontKerning = 'none';
    const yOffset = this._paragraphYOffset(paraIdx);
    const charWidthCache = {};
    const measure = (s) => {
      if (charWidthCache[s] != null) return charWidthCache[s];
      return (charWidthCache[s] = ctx.measureText(s).width);
    };

    const seedHash = (n) => {
      let h = ((n + 1) * 2654435761) >>> 0;
      h = (h ^ (h >>> 13)) >>> 0;
      h = (h * 1597334677) >>> 0;
      return h;
    };

    const segs = [];
    let i = 0;
    let x = startX;

    while (i < text.length) {
      if (/\s/.test(text[i])) {
        const isTab = text[i] === '\t';
        const isNewline = text[i] === '\n';
        // Tabs are visually wider than spaces — they're meaningfully different
        // keys and should look like it. Newlines are even wider as a beat
        // before a paragraph, but newlines also END a paragraph in our split,
        // so they shouldn't appear here.
        const gapWidth = isTab ? 56 : isNewline ? 80 : 20;
        segs.push({
          type: 'gap',
          subtype: isTab ? 'tab' : isNewline ? 'newline' : 'space',
          text: text[i],
          startPos: i,
          endPos: i,
          x,
          width: gapWidth,
          angle: 0,
          paraIdx,
          yOffset,
        });
        x += gapWidth;
        i++;
      } else {
        let j = i;
        while (j < text.length && !/\s/.test(text[j])) j++;
        const word = text.slice(i, j);
        const width = measure(word);
        const letterOffsets = [0];
        for (let k = 1; k <= word.length; k++) {
          letterOffsets.push(measure(word.slice(0, k)));
        }

        const stage = this._stageFor(this.globalWordIdx);
        let signOut, runLenOut;
        if (stage.flat) { signOut = 0; runLenOut = 0; }
        else if (this.prevSign === 0) {
          signOut = (seedHash(this.globalWordIdx) % 2 === 0) ? 1 : -1;
          runLenOut = 1;
        } else if (this.runLen >= stage.maxRun) {
          signOut = -this.prevSign;
          runLenOut = 1;
        } else {
          const pContinue = (stage.maxRun - 1) / stage.maxRun;
          const r = (seedHash(this.globalWordIdx * 7 + 3) % 1000) / 1000;
          if (r < pContinue) { signOut = this.prevSign; runLenOut = this.runLen + 1; }
          else { signOut = -this.prevSign; runLenOut = 1; }
        }
        const magHash = seedHash(this.globalWordIdx * 11 + 17);
        const baseMag = 0.04 + ((magHash % 81) / 1000);
        const angle = signOut * baseMag * (stage.magScale || 0);

        this.prevSign = signOut;
        this.runLen = runLenOut;
        this.globalWordIdx++;

        segs.push({ type: 'word', text: word, startPos: i, endPos: j, x, width, letterOffsets, angle, paraIdx, yOffset });
        x += width;
        i = j;
      }
    }
    return { segs, endX: x };
  }

  _relayoutCurrentWorld() {
    // Terrain progression is per-paragraph: each paragraph starts flat and
    // ramps up internally. Resets at every paragraph break. This makes
    // _relayoutCurrentWorld idempotent (rebuilding always produces the same
    // terrain) and gives kids a breather after each paragraph.
    const INDENT = 80;
    const before = this.wordSegments.length;
    this.wordSegments = [];
    this._logEvent(`relayout para=${this.currentParaIdx} (was ${before} segs)`);
    if (!this.paragraphs[this.currentParaIdx]) return;

    this.globalWordIdx = 0;
    this.prevSign = 0;
    this.runLen = 0;

    const cur = this._buildParagraphSegments(this.paragraphs[this.currentParaIdx], 0, this.currentParaIdx);
    this.wordSegments.push(...cur.segs);
    this.totalWidth = cur.endX;

    if (this.currentParaIdx + 1 < this.paragraphs.length) {
      // Reset progression for preview paragraph too, so its terrain matches
      // what it'll be when the user crosses into it.
      this.globalWordIdx = 0;
      this.prevSign = 0;
      this.runLen = 0;
      const nxt = this._buildParagraphSegments(
        this.paragraphs[this.currentParaIdx + 1],
        cur.endX + INDENT,
        this.currentParaIdx + 1
      );
      this.wordSegments.push(...nxt.segs);
    }
  }

  _xAtPosition(globalPos) {
    const localPos = this._localPosWithinPara(globalPos, this.currentParaIdx);
    const segs = this.wordSegments;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      if (seg.paraIdx !== this.currentParaIdx) continue;
      if (localPos >= seg.startPos && localPos <= seg.endPos) {
        if (seg.type === 'word' && seg.letterOffsets) {
          const k = localPos - seg.startPos;
          const offset = seg.letterOffsets[k] || 0;
          return seg.x + Math.cos(seg.angle || 0) * offset;
        }
        for (let j = i - 1; j >= 0; j--) {
          const p = segs[j];
          if (p.paraIdx !== this.currentParaIdx) break;
          if (p.type === 'word') {
            return p.x + Math.cos(p.angle || 0) * p.width;
          }
        }
        return seg.x;
      }
    }
    let lastEnd = 0;
    for (const seg of segs) {
      if (seg.paraIdx !== this.currentParaIdx) continue;
      lastEnd = Math.max(lastEnd, seg.x + seg.width);
    }
    return lastEnd;
  }

  _heightAtPosition(globalPos) {
    const localPos = this._localPosWithinPara(globalPos, this.currentParaIdx);
    const segs = this.wordSegments;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      if (seg.paraIdx !== this.currentParaIdx) continue;
      if (localPos >= seg.startPos && localPos <= seg.endPos) {
        if (seg.type === 'word') {
          const k = localPos - seg.startPos;
          const offset = (seg.letterOffsets && seg.letterOffsets[k]) || 0;
          return -Math.sin(seg.angle || 0) * offset;
        }
        for (let j = i - 1; j >= 0; j--) {
          const p = segs[j];
          if (p.paraIdx !== this.currentParaIdx) break;
          if (p.type === 'word') return -Math.sin(p.angle || 0) * p.width;
        }
        return 0;
      }
    }
    return 0;
  }

  _angleAtPosition(globalPos) {
    const localPos = this._localPosWithinPara(globalPos, this.currentParaIdx);
    const segs = this.wordSegments;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      if (seg.paraIdx !== this.currentParaIdx) continue;
      if (localPos >= seg.startPos && localPos <= seg.endPos) {
        if (seg.type === 'word') return seg.angle || 0;
        for (let j = i - 1; j >= 0; j--) {
          const p = segs[j];
          if (p.paraIdx !== this.currentParaIdx) break;
          if (p.type === 'word') return p.angle || 0;
        }
        return 0;
      }
    }
    return 0;
  }

  _triggerJump(goingUp) {
    this.isJumping = true;
    this.jumpPhase = 0;
    this.jumpDirection = goingUp ? -1 : 1;
    // Compute apex of the arc. Base height is 80 (a comfortable arc); add
    // the absolute Y delta to the destination so going UP clears the next
    // paragraph naturally, plus a 30px clearance margin.
    const yDelta = Math.abs(this.targetCameraY - this.cameraY);
    this.jumpHeight = 80 + yDelta + 30;
  }

  // --------------------------------------------------------------------------
  // Loop + render
  // --------------------------------------------------------------------------

  _loop(t) {
    if (!this._raf && this.canvas == null) return; // safety
    this._raf = requestAnimationFrame((t2) => this._loop(t2));
    const dt = 16;  // ~60fps target; we don't need precise integration
    const now = performance.now();

    // Animation state from idle/walk/jog/run based on WPM and recency
    const idleMs = now - this.lastKeystrokeTime;
    const recent = idleMs < 600 && this.lastKeystrokeTime > 0;
    if (this.state !== 'fall' && this.state !== 'respawning' && this.state !== 'stumble') {
      if (!recent) {
        this.state = 'idle';
      } else if (this.wpm >= 50) {
        this.state = 'run';
      } else if (this.wpm >= 25) {
        this.state = 'jog';
      } else {
        this.state = 'walk';
      }
    }

    // Phase progression — let _drawStickFigure scale by profile.speed
    if (this.state === 'walk' || this.state === 'jog' || this.state === 'run') {
      this.walkPhase += dt / 100;
    }

    // Camera follow
    if (this.state !== 'fall') {
      const charX = this._xAtPosition(this.currentPos);
      this.targetCameraX = charX - this.w * 0.35;
    }
    this.cameraX += (this.targetCameraX - this.cameraX) * 0.12;
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.08;

    if (this.isJumping) {
      this.jumpPhase += dt / 600;
      if (this.jumpPhase >= 1) { this.isJumping = false; this.jumpPhase = 0; }
    }
    if (this.isHopping) {
      this.hopPhase += dt / 260;
      if (this.hopPhase >= 1) { this.isHopping = false; this.hopPhase = 0; }
    }

    if (this.state === 'fall') {
      this.fallPhase = Math.min(1, this.fallPhase + dt / 900);
      // Fall→respawning transition is driven by ttb:respawn from game.js; we
      // don't auto-transition here because game.js owns the timing.
    }
    if (this.state === 'respawning') {
      this.respawnPhase = Math.min(1, this.respawnPhase + dt / 800);
      if (this.respawnPhase >= 1) { this.state = 'idle'; }
    }
    if (this.state === 'stumble') {
      this.stumblePhase = Math.min(1, this.stumblePhase + dt / 350);
      if (this.stumblePhase >= 1) {
        // Recover — back to gait, picked up next frame from WPM
        this.state = 'idle';
        this.stumblePhase = 0;
      }
    }

    // Smooth platform tilt the figure rests on
    if (this.state !== 'fall' && this.state !== 'respawning' && this.state !== 'stumble') {
      const targetAngle = this._angleAtPosition(this.currentPos);
      this.figureAngle += (targetAngle - this.figureAngle) * 0.18;
    }

    // Crumble trailing words
    const CRUMBLE_X = this.w * 0.18;
    if (this.state !== 'fall' && this.state !== 'respawning') {
      for (const seg of this.wordSegments) {
        if (seg.type !== 'word') continue;
        if (seg.paraIdx > this.currentParaIdx) continue;
        const localPos = this._localPosWithinPara(this.currentPos, this.currentParaIdx);
        if (seg.paraIdx === this.currentParaIdx && seg.endPos > localPos) continue;
        const key = `${seg.paraIdx}:${seg.startPos}`;
        if (this.crumbleAt[key] != null) continue;
        const rightScreenX = (seg.x + seg.width) - this.cameraX;
        if (rightScreenX < CRUMBLE_X) this.crumbleAt[key] = now;
      }
    }

    this._render(now);
  }

  _render(now) {
    const ctx = this.ctx;
    if (!ctx) return;

    // Parchment background
    ctx.fillStyle = '#f2e8d5';
    ctx.fillRect(0, 0, this.w, this.h);

    // Subtle paper grain
    ctx.fillStyle = 'rgba(120, 100, 70, 0.04)';
    for (let i = 0; i < 22; i++) {
      const y = (i * 31 + 13) % this.h;
      ctx.fillRect(0, y, this.w, 1);
    }

    // World offset during respawn — sentence rises from below
    let worldYOffset = 0;
    if (this.state === 'respawning') {
      const slideT = Math.min(1, this.respawnPhase / 0.7);
      const eased = 1 - Math.pow(1 - slideT, 3);
      worldYOffset = 260 * (1 - eased);
    }

    // Ghosts + gravestones (drawn first, behind world)
    for (const ghost of this.ghosts) this._drawGhost(ghost, now);
    for (const g of this.gravestones) this._drawGravestone(g);

    const baseY = Math.round(this.h * 0.50) + worldYOffset;

    // Word platforms (each at its own paragraph Y)
    ctx.font = TEXT_FONT;
    ctx.textBaseline = 'alphabetic';
    // Disable auto-curling of straight ASCII quotes — IM Fell English insists
    // on rendering both " glyphs as right-curly otherwise.
    if ('fontKerning' in ctx) ctx.fontKerning = 'none';
    ctx.textRendering = 'geometricPrecision';

    const cursorPos = this.currentPos;
    const cursorParaIdx = this.currentParaIdx;
    const cursorLocalPos = this._localPosWithinPara(cursorPos, cursorParaIdx);

    for (const seg of this.wordSegments) {
      if (seg.type !== 'word') continue;
      const angle = seg.angle || 0;
      const crumbled = this.crumbleAt[`${seg.paraIdx}:${seg.startPos}`];
      const segPlatformY = baseY + seg.yOffset - this.cameraY;

      // Future-paragraph preview reads as "next destination": fade alpha,
      // skip the platform line. The character will physically jump to it
      // when game.js advances the paragraph index.
      const isPreview = (seg.paraIdx > this.currentParaIdx);

      ctx.save();
      ctx.translate(seg.x - this.cameraX, segPlatformY);
      ctx.rotate(angle);

      let crumbleAlpha = 1;
      let crumbleY = 0;
      let crumbleRot = 0;
      if (crumbled != null) {
        const crumbleT = Math.min(1, (now - crumbled) / 700);
        crumbleAlpha = 1 - crumbleT;
        crumbleY = crumbleT * crumbleT * 80;
        crumbleRot = crumbleT * 0.5;
        ctx.globalAlpha = crumbleAlpha;
        ctx.translate(0, crumbleY);
        ctx.rotate(crumbleRot);
      }

      if (isPreview) {
        ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.32;
      }
      // No platform line under the word itself — the figure runs ON the
      // letters. Only the gap between words gets a connector line (drawn
      // separately in the gap-pit pass below). Tripping on a missing letter
      // is what makes them stumble.

      // ─── Per-letter rendering ───────────────────────────────────────
      // Each letter is painted in a color reflecting its state:
      //   active cursor: bright red (cherry on top)
      //   future:        ink (#2b221a)
      //   perfect:       slightly faded ink
      //   fixed:         slightly more faded
      //   dirty:         even more faded — got there but with errors
      //   mistake-flash: orange-red for 250ms then fades back
      // Letters sit ABOVE the platform line (negative y) — the line is the
      // figure's ground. textBaseline='alphabetic' puts the bottom of letters
      // at the y-coordinate; drawing at y=-2 keeps a small gap above the line.
      const isCursorOnThisWord = (seg.paraIdx === cursorParaIdx) &&
                                  (cursorLocalPos >= seg.startPos) &&
                                  (cursorLocalPos <= seg.endPos);

      for (let k = 0; k < seg.text.length; k++) {
        const localPos = seg.startPos + k;
        const globalPos = this.paragraphStartPos[seg.paraIdx] + localPos;
        const offset = (seg.letterOffsets && seg.letterOffsets[k]) || 0;

        // Falling letter? Render with translation and rotation, then move on.
        // Skipped from normal layout — they're physically off the platform.
        const falling = this.fallingLetters[globalPos];
        if (falling) {
          const ageS = (now - falling.startTime) / 1000;
          // Gravity: y = vy0*t + 0.5*g*t^2, with vy0=0 and g~1400 px/s²
          const dy = 0.5 * 1400 * ageS * ageS;
          const dx = falling.vx * ageS;
          const angle = falling.initialAngle + falling.rot * ageS;
          if (dy > 800) continue;  // out of frame, skip rendering
          ctx.save();
          ctx.translate(offset + dx, dy + 26);
          ctx.rotate(angle);
          ctx.fillStyle = 'rgba(150, 50, 50, 0.85)';
          ctx.fillText(seg.text[k], 0, 0);
          ctx.restore();
          continue;
        }

        let color = '#2b221a';                // future text
        let isActive = false;

        if (isCursorOnThisWord && localPos === cursorLocalPos) {
          color = '#c0392b';                  // bright red — current cursor
          isActive = true;
        } else if (this.letterStatus[globalPos] === 'perfect') {
          color = 'rgba(43, 34, 26, 0.55)';
        } else if (this.letterStatus[globalPos] === 'fixed') {
          color = 'rgba(43, 34, 26, 0.40)';
        } else if (this.letterStatus[globalPos] === 'dirty') {
          color = 'rgba(150, 50, 50, 0.55)';  // reddish-faded
        }

        // Mistake flash overrides: 280ms of bright orange-red after a wrong key
        const flashAt = this.mistakeFlash[globalPos];
        if (flashAt) {
          const age = now - flashAt;
          if (age < 280) {
            color = '#d04020';
          } else {
            delete this.mistakeFlash[globalPos];
          }
        }

        // Letter tilt — kicked-rock pose. Holds at full angle until the
        // letter is correctly typed (which clears it via _onKeystroke).
        const tilt = this.letterTilts[globalPos];
        const tiltAngle = tilt ? tilt.angleRad : 0;

        ctx.fillStyle = color;
        if (isActive) {
          ctx.shadowColor = 'rgba(192, 57, 43, 0.4)';
          ctx.shadowBlur = 6;
        }

        const ch = seg.text[k];
        // Letters render BELOW the figure's feet line — the figure walks on
        // their TOPS (the cap-line). With textBaseline='alphabetic', drawing
        // at y=26 puts the baseline 26px below the feet line; cap-height-tall
        // letters then occupy y=0..26 with descenders extending a bit below.
        const letterY = 26;
        // Quote glyph fix: a leading " (k===0 within a word) should curl
        // toward the word, but IM Fell English renders both " glyphs as
        // right-curling (close-quote). Flip horizontally for the leading case.
        if (ch === '"' && k === 0) {
          ctx.save();
          ctx.translate(offset, letterY);
          if (tiltAngle) ctx.rotate(tiltAngle);
          ctx.scale(-1, 1);
          const qWidth = ctx.measureText('"').width;
          ctx.fillText('"', -qWidth, 0);
          ctx.restore();
        } else if (tiltAngle) {
          // Tilted letter — rotate around its own baseline-left
          ctx.save();
          ctx.translate(offset, letterY);
          ctx.rotate(tiltAngle);
          ctx.fillText(ch, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(ch, offset, letterY);
        }
        if (isActive) ctx.shadowBlur = 0;
      }

      ctx.restore();
    }

    // Cursor-gap indicator: a red bridge line at LETTER BASELINE (like an
    // underscore), appearing ONLY at the gap the user is currently on.
    // Non-cursor gaps render nothing — empty air the figure has to hop.
    // Label placement:
    //   space → below the line (under the underscore)
    //   tab   → above the line (between letter caps and the underscore)
    //   enter → above the line
    for (const seg of this.wordSegments) {
      if (seg.type !== 'gap') continue;
      if (seg.paraIdx !== cursorParaIdx) continue;
      const isCursor = (cursorLocalPos >= seg.startPos && cursorLocalPos <= seg.endPos);
      if (!isCursor) continue;     // only draw the cursor's gap

      const segScreenY = baseY + seg.yOffset - this.cameraY;
      const x0 = seg.x - this.cameraX;
      const x1 = x0 + seg.width;
      // Letters render with caps at segScreenY, baseline at +26.
      // Bridge line lives at the baseline like an underscore under the gap.
      const lineY = segScreenY + 26;

      ctx.strokeStyle = 'rgba(192, 57, 43, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x0, lineY);
      ctx.lineTo(x1, lineY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(192, 57, 43, 0.78)';
      ctx.font = SPACE_LABEL_FONT;
      ctx.textAlign = 'center';
      const label = seg.subtype === 'tab' ? 'tab'
                  : seg.subtype === 'newline' ? 'enter'
                  : 'space';
      // tab/enter ABOVE the line (between letter caps and underscore);
      // space BELOW (under the underscore).
      const labelY = (seg.subtype === 'tab' || seg.subtype === 'newline')
                   ? lineY - 4    // above the bridge line
                   : lineY + 14;  // below the bridge line
      ctx.fillText(label, (x0 + x1) / 2, labelY);
      ctx.textAlign = 'start';
      ctx.font = TEXT_FONT;
      if ('fontKerning' in ctx) ctx.fontKerning = 'none';
    }

    // Stick figure
    const charX = this._xAtPosition(this.currentPos) - this.cameraX;
    const charScreenY = baseY;
    this._drawStickFigure(charX, charScreenY, now);

    // Diagnostic overlay (toggle with `)
    if (this._debug) this._drawDebugOverlay(now);
  }

  // Diagnostic state HUD. Top-left corner of the canvas. Toggled with the
  // backtick key. Shows internal state useful for chasing rendering bugs.
  _drawDebugOverlay(now) {
    const ctx = this.ctx;
    ctx.save();
    const lines = [];
    lines.push(`v${RENDERER_VERSION} debug (\` to hide)`);
    lines.push(`state=${this.state} fp=${this.fallPhase.toFixed(2)} rp=${this.respawnPhase.toFixed(2)}`);
    lines.push(`currentPos=${this.currentPos}/${this.fullText.length}`);
    lines.push(`currentParaIdx=${this.currentParaIdx} of ${this.paragraphs.length}`);
    // Per-paragraph segment count
    const perPara = {};
    for (const seg of this.wordSegments) {
      perPara[seg.paraIdx] = (perPara[seg.paraIdx] || 0) + 1;
    }
    const breakdown = Object.entries(perPara).map(([k, v]) => `p${k}:${v}`).join(' ');
    lines.push(`wordSegments=${this.wordSegments.length} [${breakdown}]`);
    lines.push(`crumbleAt=${Object.keys(this.crumbleAt).length} keys`);
    lines.push(`ghosts=${this.ghosts.length}  graves=${this.gravestones.length}`);
    lines.push(`cam x=${this.cameraX.toFixed(0)} y=${this.cameraY.toFixed(0)} | ` +
               `tgt x=${this.targetCameraX.toFixed(0)} y=${this.targetCameraY.toFixed(0)}`);
    lines.push(`wpm=${this.wpm}  walkPhase=${this.walkPhase.toFixed(1)}`);
    lines.push('— recent events —');
    for (const ev of this._eventLog) {
      const age = ((now - ev.t) / 1000).toFixed(1) + 's';
      lines.push(`  ${age} ago: ${ev.label}`);
    }

    const padding = 8, lineH = 14;
    const w = 380;
    const h = padding * 2 + lines.length * lineH;
    ctx.fillStyle = 'rgba(20, 18, 14, 0.88)';
    ctx.fillRect(8, 8, w, h);
    ctx.strokeStyle = 'rgba(192, 57, 43, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, w, h);
    ctx.font = '11px "Courier Prime", Menlo, monospace';
    ctx.fillStyle = '#e8d8a0';
    ctx.textBaseline = 'top';
    let y = 8 + padding;
    for (const line of lines) {
      ctx.fillText(line, 8 + padding, y);
      y += lineH;
    }
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // Stick figure (gait code adapted from Gemini)
  // --------------------------------------------------------------------------

  _drawStickFigure(x, y, now) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    // The figure has many states. World offsets (jump arc, hop arc, respawn
    // drop) translate the whole body; gait state determines pose. For the
    // stumble (state==='fall') we DON'T apply jump/hop offsets — the figure is
    // tumbling on the spot before respawn animates them away. Note: X-eyes are
    // ONLY drawn on actual ghosts (in _drawGhost), never on a living figure
    // who's just tripped.

    // ---- Stumble (transient mistake): running-gait-based stumble with sway ----
    // Player tripped on a wrong key but is still going. ~350ms then back to
    // gait. Doesn't translate position. Used for individual mistakes.
    if (this.state === 'stumble') {
      const fp = this.stumblePhase;
      const stumbleData = {
        legs: [{p:0,hip:30,knee:10},{p:0.2,hip:-20,knee:0},{p:0.5,hip:-40,knee:0},{p:0.8,hip:60,knee:0},{p:1,hip:30,knee:0}],
        arms: [{p:0,shoulder:-20,elbow:20},{p:0.2,shoulder:60,elbow:10},{p:0.5,shoulder:100,elbow:0},{p:0.8,shoulder:40,elbow:40},{p:1,shoulder:-20,elbow:10}],
      };
      const limbLen = 9, armLen = 7.5, spineLen = 14;
      ctx.strokeStyle = '#2b221a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const lLegA = this._getAngles(fp, stumbleData.legs);
      const rLegA = this._getAngles((fp + 0.3) % 1, stumbleData.legs);
      const lLeg = this._calcLeg(lLegA, limbLen);
      const rLeg = this._calcLeg(rLegA, limbLen);
      const hipY = -16 + Math.sin(fp * Math.PI) * 4;     // small dip
      const lean = Math.sin(fp * Math.PI) * 0.6;          // less dramatic than fall
      const shoulderX = Math.sin(lean) * spineLen;
      const shoulderY = hipY - Math.cos(lean) * spineLen;
      const lArm = this._calcArm(this._getAngles(fp, stumbleData.arms), shoulderX, shoulderY, armLen);
      const rArm = this._calcArm(this._getAngles(fp, stumbleData.arms), shoulderX, shoulderY, armLen);

      const drawLine = (x1,y1,x2,y2,x3,y3) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke();
      };
      drawLine(shoulderX, shoulderY, rArm.elbowX, rArm.elbowY, rArm.handX, rArm.handY);
      drawLine(0, hipY, rLeg.kneeX, hipY + rLeg.kneeY, rLeg.footX, hipY + rLeg.footY);
      ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(shoulderX, shoulderY); ctx.stroke();
      ctx.beginPath(); ctx.arc(shoulderX, shoulderY - 5, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#2b221a'; ctx.fill();
      drawLine(0, hipY, lLeg.kneeX, hipY + lLeg.kneeY, lLeg.footX, hipY + lLeg.footY);
      drawLine(shoulderX, shoulderY, lArm.elbowX, lArm.elbowY, lArm.handX, lArm.handY);
      ctx.restore();
      return;
    }

    // ---- Plummet (hard-stop / 3-strikes-out): figure falls off the bottom ----
    // Translates down accelerating, flailing limbs, off-screen by the time
    // game.js fires ttb:respawn (~900ms after fail).
    if (this.state === 'fall') {
      const fp = this.fallPhase;
      // Translate down with acceleration (gravity-like)
      ctx.translate(0, fp * fp * 600);
      // Slight rotation for drama
      ctx.rotate(fp * Math.PI * 0.3);

      const limbLen = 9, armLen = 7.5, spineLen = 14;
      ctx.strokeStyle = '#2b221a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Flailing limbs: sin/cos based on `now` so they wave during the fall
      const t = now / 50;
      const hipY = -16; const lean = 0;
      const lLegA = { primary: (-30 + Math.sin(t)*40) * Math.PI/180, secondary: 10 * Math.PI/180 };
      const rLegA = { primary: ( 30 + Math.cos(t)*40) * Math.PI/180, secondary: 10 * Math.PI/180 };
      const lArmA = { primary: -150 * Math.PI/180, secondary: (20 + Math.sin(t*0.8)*20) * Math.PI/180 };
      const rArmA = { primary:  150 * Math.PI/180, secondary: (20 + Math.cos(t*0.8)*20) * Math.PI/180 };
      const lLeg = this._calcLeg(lLegA, limbLen);
      const rLeg = this._calcLeg(rLegA, limbLen);
      const shoulderX = Math.sin(lean) * spineLen;
      const shoulderY = hipY - Math.cos(lean) * spineLen;
      const lArm = this._calcArm(lArmA, shoulderX, shoulderY, armLen);
      const rArm = this._calcArm(rArmA, shoulderX, shoulderY, armLen);

      const drawLine = (x1,y1,x2,y2,x3,y3) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke();
      };
      drawLine(shoulderX, shoulderY, rArm.elbowX, rArm.elbowY, rArm.handX, rArm.handY);
      drawLine(0, hipY, rLeg.kneeX, hipY + rLeg.kneeY, rLeg.footX, hipY + rLeg.footY);
      ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(shoulderX, shoulderY); ctx.stroke();
      ctx.beginPath(); ctx.arc(shoulderX, shoulderY - 5, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#2b221a'; ctx.fill();
      drawLine(0, hipY, lLeg.kneeX, hipY + lLeg.kneeY, lLeg.footX, hipY + lLeg.footY);
      drawLine(shoulderX, shoulderY, lArm.elbowX, lArm.elbowY, lArm.handX, lArm.handY);
      ctx.restore();
      return;
    }

    // ---- Respawning (drop from sky → landing crouch → stand) ----
    if (this.state === 'respawning') {
      const rp = this.respawnPhase;
      const limbLen = 9, armLen = 7.5, spineLen = 14;
      ctx.strokeStyle = '#2b221a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      let lLegA, rLegA, hipY, lean, lArmA, rArmA;
      if (rp < 0.5) {
        // Falling phase: figure drops from above with arms wide
        const fallT = rp / 0.5;
        ctx.translate(0, -400 * (1 - Math.pow(fallT, 2)));
        hipY = -16; lean = 0.2;
        lLegA = { primary: -10 * Math.PI / 180, secondary: 20 * Math.PI / 180 };
        rLegA = { primary: 20 * Math.PI / 180, secondary: 40 * Math.PI / 180 };
        lArmA = { primary: -140 * Math.PI / 180, secondary: 40 * Math.PI / 180 };
        rArmA = { primary: -110 * Math.PI / 180, secondary: 20 * Math.PI / 180 };
      } else {
        // Landing crouch → stand
        const crouchT = (rp - 0.5) / 0.5;
        hipY = -6 - Math.sin(crouchT * Math.PI / 2) * 10;
        lean = 0.8 * (1 - Math.pow(crouchT, 2));
        lLegA = { primary: -30 * Math.PI / 180, secondary: 100 * (1 - crouchT) * Math.PI / 180 };
        rLegA = { primary:  30 * Math.PI / 180, secondary: 100 * (1 - crouchT) * Math.PI / 180 };
        lArmA = { primary: -60 * Math.PI / 180, secondary:  80 * (1 - crouchT) * Math.PI / 180 };
        rArmA = { primary: -40 * Math.PI / 180, secondary:  80 * (1 - crouchT) * Math.PI / 180 };
      }

      const lLeg = this._calcLeg(lLegA, limbLen);
      const rLeg = this._calcLeg(rLegA, limbLen);
      const shoulderX = Math.sin(lean) * spineLen;
      const shoulderY = hipY - Math.cos(lean) * spineLen;
      const lArm = this._calcArm(lArmA, shoulderX, shoulderY, armLen);
      const rArm = this._calcArm(rArmA, shoulderX, shoulderY, armLen);

      const drawLine = (x1,y1,x2,y2,x3,y3) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke();
      };
      drawLine(shoulderX, shoulderY, rArm.elbowX, rArm.elbowY, rArm.handX, rArm.handY);
      drawLine(0, hipY, rLeg.kneeX, hipY + rLeg.kneeY, rLeg.footX, hipY + rLeg.footY);
      ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(shoulderX, shoulderY); ctx.stroke();
      ctx.beginPath(); ctx.arc(shoulderX, shoulderY - 5, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#2b221a'; ctx.fill();
      drawLine(0, hipY, lLeg.kneeX, hipY + lLeg.kneeY, lLeg.footX, hipY + lLeg.footY);
      drawLine(shoulderX, shoulderY, lArm.elbowX, lArm.elbowY, lArm.handX, lArm.handY);
      ctx.restore();
      return;
    }

    // ---- Leap (paragraph crossing): full leg/arm leap keyframes ----
    if (this.isJumping) {
      const limbLen = 9, armLen = 7.5, spineLen = 14;
      ctx.translate(0, -Math.sin(this.jumpPhase * Math.PI) * this.jumpHeight);
      ctx.strokeStyle = '#2b221a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.rotate(this.figureAngle);

      const leapData = {
        legs: [{p:0,hip:-20,knee:60},{p:0.2,hip:-40,knee:0},{p:0.5,hip:20,knee:90},{p:0.8,hip:70,knee:0},{p:1,hip:20,knee:40}],
        arms: [{p:0,shoulder:-60,elbow:10},{p:0.2,shoulder:45,elbow:10},{p:0.5,shoulder:90,elbow:40},{p:0.8,shoulder:20,elbow:10},{p:1,shoulder:-20,elbow:20}],
      };
      const getA = this._getAngles;
      const legAng = getA(this.jumpPhase, leapData.legs);
      const armAng = getA(this.jumpPhase, leapData.arms);
      const lLeg = this._calcLeg(legAng, limbLen);
      const rLeg = this._calcLeg(legAng, limbLen);
      const hipY = -18, lean = 0.4;
      const shoulderX = Math.sin(lean) * spineLen;
      const shoulderY = hipY - Math.cos(lean) * spineLen;
      const lArm = this._calcArm(armAng, shoulderX, shoulderY, armLen);
      const rArm = this._calcArm(armAng, shoulderX, shoulderY, armLen);

      const drawLine = (x1,y1,x2,y2,x3,y3) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke();
      };
      drawLine(shoulderX, shoulderY, rArm.elbowX, rArm.elbowY, rArm.handX, rArm.handY);
      drawLine(0, hipY, rLeg.kneeX, hipY + rLeg.kneeY, rLeg.footX, hipY + rLeg.footY);
      ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(shoulderX, shoulderY); ctx.stroke();
      ctx.beginPath(); ctx.arc(shoulderX, shoulderY - 5, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#2b221a'; ctx.fill();
      drawLine(0, hipY, lLeg.kneeX, hipY + lLeg.kneeY, lLeg.footX, hipY + lLeg.footY);
      drawLine(shoulderX, shoulderY, lArm.elbowX, lArm.elbowY, lArm.handX, lArm.handY);
      ctx.restore();
      return;
    }

    // ---- Living: idle, walk, jog, run (with optional in-progress hop) ----
    if (this.isHopping) ctx.translate(0, -Math.sin(this.hopPhase * Math.PI) * 22);
    ctx.rotate(this.figureAngle);

    ctx.strokeStyle = '#2b221a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const profiles = {
      walk: {
        speed: 2.5, lean: 0.05,
        leg: [{p:0,hip:30,knee:0},{p:0.15,hip:15,knee:15},{p:0.3,hip:0,knee:0},{p:0.5,hip:-20,knee:10},{p:0.6,hip:0,knee:40},{p:0.75,hip:25,knee:60},{p:0.85,hip:30,knee:10},{p:1,hip:30,knee:0}],
        arm: [{p:0,shoulder:-25,elbow:10},{p:0.15,shoulder:-15,elbow:10},{p:0.3,shoulder:0,elbow:15},{p:0.5,shoulder:20,elbow:45},{p:0.6,shoulder:10,elbow:35},{p:0.75,shoulder:-10,elbow:20},{p:0.85,shoulder:-20,elbow:15},{p:1,shoulder:-25,elbow:10}],
      },
      jog: {
        speed: 3.5, lean: 0.15,
        leg: [{p:0,hip:35,knee:10},{p:0.15,hip:10,knee:30},{p:0.3,hip:-10,knee:15},{p:0.5,hip:-25,knee:20},{p:0.6,hip:-10,knee:70},{p:0.75,hip:35,knee:90},{p:0.85,hip:40,knee:30},{p:1,hip:35,knee:10}],
        arm: [{p:0,shoulder:-70,elbow:60},{p:0.15,shoulder:-30,elbow:70},{p:0.3,shoulder:20,elbow:80},{p:0.5,shoulder:30,elbow:85},{p:0.6,shoulder:15,elbow:80},{p:0.75,shoulder:-30,elbow:60},{p:0.85,shoulder:-60,elbow:50},{p:1,shoulder:-70,elbow:60}],
      },
      run: {
        speed: 5.5, lean: 0.30,
        leg: [{p:0,hip:45,knee:15},{p:0.15,hip:5,knee:40},{p:0.3,hip:-20,knee:20},{p:0.5,hip:-40,knee:25},{p:0.6,hip:-15,knee:90},{p:0.75,hip:40,knee:120},{p:0.85,hip:55,knee:40},{p:1,hip:45,knee:15}],
        arm: [{p:0,shoulder:-75,elbow:70},{p:0.15,shoulder:-30,elbow:80},{p:0.3,shoulder:20,elbow:100},{p:0.5,shoulder:45,elbow:110},{p:0.6,shoulder:20,elbow:90},{p:0.75,shoulder:-30,elbow:70},{p:0.85,shoulder:-60,elbow:60},{p:1,shoulder:-75,elbow:70}],
      },
    };

    let active = profiles.walk;
    if (this.state === 'jog') active = profiles.jog;
    if (this.state === 'run') active = profiles.run;
    // (idle uses walk profile, locked at phase=0)

    let phase = ((this.walkPhase * active.speed) / (Math.PI * 2)) % 1;
    if (phase < 0) phase += 1;
    if (this.state === 'idle') phase = 0;

    const lLegA = this._getAngles(phase, active.leg);
    const rLegA = this._getAngles((phase + 0.5) % 1, active.leg);

    // During a hop, lock the left leg straight to sell the leap pose. The
    // gait's arm swing continues normally.
    if (this.isHopping) { lLegA.primary = 45 * Math.PI / 180; lLegA.secondary = 0; }

    const limbLen = 9, armLen = 7.5, spineLen = 14;
    const lLeg = this._calcLeg(lLegA, limbLen);
    const rLeg = this._calcLeg(rLegA, limbLen);

    // Lock lowest foot to Y=0 to create dynamic body rise/fall during gait
    const maxFootY = Math.max(lLeg.footY, rLeg.footY);
    const hipY = this.state === 'idle' ? -16 : -maxFootY;

    const lean = this.state === 'idle' ? 0 : active.lean;
    const shoulderX = Math.sin(lean) * spineLen;
    const shoulderY = hipY - Math.cos(lean) * spineLen;

    const lArm = this._calcArm(this._getAngles(phase, active.arm), shoulderX, shoulderY, armLen);
    const rArm = this._calcArm(this._getAngles((phase + 0.5) % 1, active.arm), shoulderX, shoulderY, armLen);

    const drawLine = (x1,y1,x2,y2,x3,y3) => {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke();
    };

    // Background side first (right limbs)
    drawLine(shoulderX, shoulderY, rArm.elbowX, rArm.elbowY, rArm.handX, rArm.handY);
    drawLine(0, hipY, rLeg.kneeX, hipY + rLeg.kneeY, rLeg.footX, hipY + rLeg.footY);

    // Spine + head
    ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(shoulderX, shoulderY); ctx.stroke();
    ctx.beginPath(); ctx.arc(shoulderX, shoulderY - 5, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#2b221a'; ctx.fill();

    // Foreground side (left limbs)
    drawLine(0, hipY, lLeg.kneeX, hipY + lLeg.kneeY, lLeg.footX, hipY + lLeg.footY);
    drawLine(shoulderX, shoulderY, lArm.elbowX, lArm.elbowY, lArm.handX, lArm.handY);

    ctx.restore();
  }

  // Shared kinematic helpers — promoted out of _drawStickFigure so the various
  // pose branches (walk/leap/stumble/respawn) can share them.
  _getAngles(phase, dataSet) {
    let p1 = dataSet[0], p2 = dataSet[1];
    for (let i = 0; i < dataSet.length - 1; i++) {
      if (phase >= dataSet[i].p && phase <= dataSet[i + 1].p) {
        p1 = dataSet[i]; p2 = dataSet[i + 1]; break;
      }
    }
    const t = (phase - p1.p) / (p2.p - p1.p);
    const val1 = p1.hip !== undefined ? p1.hip : p1.shoulder;
    const val2 = p2.hip !== undefined ? p2.hip : p2.shoulder;
    const joint1 = p1.knee !== undefined ? p1.knee : p1.elbow;
    const joint2 = p2.knee !== undefined ? p2.knee : p2.elbow;
    return {
      primary:   (val1 + (val2 - val1) * t) * Math.PI / 180,
      secondary: (joint1 + (joint2 - joint1) * t) * Math.PI / 180,
    };
  }

  _calcLeg(angles, limbLen) {
    const thighAngle = angles.primary;
    const calfAngle = thighAngle - angles.secondary;
    const kneeX = Math.sin(thighAngle) * limbLen;
    const kneeY = Math.cos(thighAngle) * limbLen;
    return {
      kneeX, kneeY,
      footX: kneeX + Math.sin(calfAngle) * limbLen,
      footY: kneeY + Math.cos(calfAngle) * limbLen,
    };
  }

  _calcArm(angles, shoulderX, shoulderY, armLen) {
    const upperAngle = angles.primary;
    const lowerAngle = upperAngle + angles.secondary;
    const elbowX = shoulderX + Math.sin(upperAngle) * armLen;
    const elbowY = shoulderY + Math.cos(upperAngle) * armLen;
    return {
      elbowX, elbowY,
      handX: elbowX + Math.sin(lowerAngle) * armLen,
      handY: elbowY + Math.cos(lowerAngle) * armLen,
    };
  }

  // --------------------------------------------------------------------------
  // Decoration: ghosts and gravestones
  // --------------------------------------------------------------------------

  _drawGhost(ghost, now) {
    const ctx = this.ctx;
    ctx.save();

    // Rise animation: tween from origin (gravestone) to dest (haunting band)
    // over riseMs. Bob and alpha both ease in. Style determines body shape.
    const ageMs = now - ghost.birthTime;
    const t = Math.max(0, Math.min(1, ageMs / ghost.riseMs));
    const eased = 1 - Math.pow(1 - t, 2);
    const xPct = ghost.originXPct + (ghost.destXPct - ghost.originXPct) * eased;
    const yPct = ghost.originYPct + (ghost.destYPct - ghost.originYPct) * eased;
    ctx.globalAlpha = 0.32 * eased;

    const phaseT = now * 0.001 + ghost.phase;
    const bob = Math.sin(phaseT) * 6 * eased;
    ctx.translate(this.w * xPct, this.h * yPct + bob);
    ctx.scale(ghost.scale, ghost.scale);

    ctx.strokeStyle = '#2b221a';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (ghost.style === 'sheet') {
      // Classic sheet ghost — long flowing body, head bulge at top, wavy hem
      ctx.fillStyle = '#f4ecd8';
      const headY = -35;
      ctx.beginPath();
      ctx.moveTo(-15, 20);
      ctx.bezierCurveTo(-20, headY - 15, 20, headY - 15, 15, 20);
      // Wavy hem
      for (let i = 15; i >= -15; i -= 2) {
        ctx.lineTo(i, 20 + Math.sin(now / 150 + i * 0.4) * 4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      this._drawGhostXEyes(0, headY + 12, 3.5);
    } else if (ghost.style === 'head') {
      // Y-frame body with a head that ROLLS between the arm tips. As the
      // head swings, it tumbles — its rotation is proportional to lateral
      // displacement. Eyes rotate with it. Drops slightly at extremes
      // (suggests it's actually rolling along the arms).
      ctx.fillStyle = '#f4ecd8';
      // Spine waves slightly
      ctx.beginPath();
      ctx.moveTo(0, -12);
      for (let i = 0; i <= 30; i += 2) {
        ctx.lineTo(Math.sin(now / 150 + i * 0.2) * 4, -12 + i);
      }
      ctx.stroke();
      const shoulderY = -26;
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, shoulderY); ctx.stroke();
      // Y-shape arms going up from shoulder
      const width = 18;
      ctx.beginPath();
      ctx.moveTo(0, shoulderY); ctx.lineTo(-width, shoulderY - 15);
      ctx.moveTo(0, shoulderY); ctx.lineTo( width, shoulderY - 15);
      ctx.stroke();
      const rollX = Math.sin(now / 400) * 16;
      const dropY = shoulderY - 13 - Math.pow(Math.abs(rollX / width), 2) * 6;
      // Rotation = lateral position scaled to a tumble. Full π rotation
      // across the swing means the eyes spin around as the head rolls
      // along the arms — the original "head rolling between hands" effect.
      const headRot = (rollX / width) * Math.PI;
      ctx.save();
      ctx.translate(rollX, dropY);
      ctx.rotate(headRot);
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // X-eyes inside the rotated frame so they tumble with the head
      this._drawGhostXEyes(0, 0, 2.2);
      ctx.restore();
    } else {
      // 'limp' (default) — short body, dangling arms, head hovering
      ctx.fillStyle = '#f4ecd8';
      // Wavy spine
      ctx.beginPath();
      ctx.moveTo(0, -12);
      for (let i = 0; i <= 30; i += 2) {
        ctx.lineTo(Math.sin(now / 150 + i * 0.2) * 4, -12 + i);
      }
      ctx.stroke();
      const shoulderY = -26;
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, shoulderY); ctx.stroke();
      // Head
      ctx.beginPath();
      ctx.arc(0, shoulderY - 6, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      this._drawGhostXEyes(0, shoulderY - 6, 2.2);
      // Dangling arms
      ctx.beginPath();
      ctx.moveTo(0, shoulderY); ctx.lineTo(-8, shoulderY + 10);
      ctx.moveTo(0, shoulderY); ctx.lineTo( 8, shoulderY + 10);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw a pair of X eyes — only ever called from _drawGhost. Not on the
  // living figure even during stumbles. spacing is the gap from center to
  // each eye.
  _drawGhostXEyes(cx, cy, spacing) {
    const ctx = this.ctx;
    const size = 0.9;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#2b221a';
    ctx.lineWidth = 1.5;
    // Left X
    ctx.save(); ctx.translate(-spacing, 0);
    ctx.beginPath(); ctx.moveTo(-size, -size); ctx.lineTo(size, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(size, -size); ctx.lineTo(-size, size); ctx.stroke();
    ctx.restore();
    // Right X
    ctx.save(); ctx.translate(spacing, 0);
    ctx.beginPath(); ctx.moveTo(-size, -size); ctx.lineTo(size, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(size, -size); ctx.lineTo(-size, size); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  _drawGravestone(g) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.translate(this.w * g.xPct, this.h * g.yPct);
    ctx.scale(g.scale, g.scale);
    ctx.rotate(g.tilt);

    ctx.fillStyle = '#7a7266';
    ctx.strokeStyle = '#2b221a';
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-13, 26);
    ctx.lineTo(-13, -6);
    if (g.style === 'rounded') {
      ctx.quadraticCurveTo(-13, -22, 0, -22);
      ctx.quadraticCurveTo(13, -22, 13, -6);
    } else if (g.style === 'cross') {
      ctx.lineTo(-13, -18); ctx.lineTo(13, -18); ctx.lineTo(13, -6);
    } else {
      ctx.lineTo(-13, -16); ctx.lineTo(13, -16); ctx.lineTo(13, -6);
    }
    ctx.lineTo(13, 26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inscription — the letter that killed the player
    if (g.inscription) {
      ctx.fillStyle = '#2b221a';
      ctx.font = 'bold 14px "IM Fell English", Georgia, serif';
      if ('fontKerning' in ctx) ctx.fontKerning = 'none';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const inscY = (g.style === 'rounded') ? -10 : (g.style === 'cross') ? -8 : -7;
      ctx.fillText(g.inscription, 0, inscY);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }

    // Cross-style: extra cross above the stone
    if (g.style === 'cross') {
      ctx.strokeStyle = '#2b221a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -28); ctx.lineTo(0, -22);
      ctx.moveTo(-3, -25); ctx.lineTo(3, -25);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(43, 34, 26, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-19, 26); ctx.lineTo(19, 26);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(61, 90, 61, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-16, 26); ctx.lineTo(-15, 22);
    ctx.moveTo(-14, 26); ctx.lineTo(-13, 23);
    ctx.moveTo(15, 26); ctx.lineTo(14, 22);
    ctx.moveTo(17, 26); ctx.lineTo(16, 24);
    ctx.stroke();

    ctx.restore();
  }
}
