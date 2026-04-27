// adventure-renderer.js — v0.2.2
//
// v0.2.2 bugfixes:
//   - Respawn detritus: paragraph crossings now rebuild via
//     _relayoutCurrentWorld instead of appending forever. _appendNewPreviewParagraph
//     is gone. Single canonical layout rule: wordSegments only ever holds the
//     current paragraph + the next-paragraph preview, both starting from X=0
//     in their own coord space. Camera resets to follow the figure on every
//     rebuild.
//   - Preview paragraph fades to ~30% alpha and loses its platform underline,
//     so it reads as "next destination" not "competing line of words".
//   - Tabs render distinctly: wider gap, italic "tab" label below the pit.
//   - Gravestone inscription: each grave displays the letter that killed the
//     player, sourced from the ttb:fail event's `expected` field.
//   - Space pit drops below the platform line so the figure visibly hops over
//     it. The "space" italic label sits inside the pit.
//
// v0.2.1 bugfixes:
//   - Per-letter rendering with active-cursor highlight (red), completed-faded,
//     mistake-flash. The old version painted whole words in a single color.
//   - Bigger text (32px) for readability.
//   - "space" italic label restored under the cursor when on a gap, in addition
//     to the red underline.
//   - Curly-quote fix: ctx.fontKerning = 'none' to disable IM Fell English's
//     auto-curling of straight quotes.
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

export const RENDERER_VERSION = '0.2.2';

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
    this.respawnPhase = 0;
    this.isJumping = false;
    this.jumpPhase = 0;
    this.jumpDirection = 1;
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

    // ---- Background decorations ----
    this.ghosts = [];
    this.gravestones = [];

    // ---- Bound listeners for unmount ----
    this._listeners = [];
    this._raf = null;
    this._resizeObserver = null;
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

    this._raf = requestAnimationFrame((t) => this._loop(t));
  }

  unmount() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    for (const { type, fn } of this._listeners) {
      document.removeEventListener(type, fn);
    }
    this._listeners.length = 0;
    if (this.canvas) this.canvas.classList.add('hidden');
  }

  _on(type, fn) {
    const wrapped = (e) => fn(e.detail || {});
    document.addEventListener(type, wrapped);
    this._listeners.push({ type, fn: wrapped });
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

    // Reset terrain progression on new chapter
    this.globalWordIdx = 0;
    this.prevSign = 0;
    this.runLen = 0;
    this.crumbleAt = {};
    this.letterStatus = {};
    this.mistakeFlash = {};
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
      }

      const oldPos = this.currentPos;
      const newPos = (typeof d.position === 'number') ? d.position : oldPos + 1;
      this.currentPos = newPos;

      // Did we cross a paragraph boundary?
      const newParaIdx = this._paragraphForPos(this.currentPos);
      if (newParaIdx !== this.currentParaIdx) {
        const goingUp = (newParaIdx % 2 === 1);  // alternating Y rule
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
      // Mistake — flash the current position red briefly
      const pos = (typeof d.position === 'number') ? d.position : this.currentPos;
      this.mistakeFlash[pos] = performance.now();
    }
  }

  _onFail(d) {
    if (this.state === 'fall' || this.state === 'respawning') return;
    this.state = 'fall';
    this.fallPhase = 0;

    // The letter the player failed on — sourced from the ttb:fail event.
    // Engraved on the gravestone. Whitespace gets a glyph substitute.
    const failedChar = (d && d.expected) || '?';
    const inscription = (failedChar === ' ') ? '␣'
                      : (failedChar === '\n') ? '↵'
                      : (failedChar === '\t') ? '⇥'
                      : failedChar;

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

    // Ghost rises slowly from that gravestone
    this.ghosts.push({
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
    // Game tells us the new position. Reset terrain to flat (per Jake's design).
    this.state = 'respawning';
    this.respawnPhase = 0;
    if (typeof d.position === 'number') this.currentPos = d.position;
    this.globalWordIdx = 0;
    this.prevSign = 0;
    this.runLen = 0;
    this.crumbleAt = {};
    this.mistakeFlash = {};
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
    this.wordSegments = [];
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
    if (this.state !== 'fall' && this.state !== 'respawning') {
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

    // Smooth platform tilt the figure rests on
    if (this.state !== 'fall' && this.state !== 'respawning') {
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
      } else {
        // Platform line — only on current paragraph
        ctx.strokeStyle = 'rgba(43, 34, 26, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(seg.width, 0);
        ctx.stroke();
      }

      // ─── Per-letter rendering ───────────────────────────────────────
      // Each letter is painted in a color reflecting its state:
      //   active cursor: bright red (cherry on top)
      //   future:        ink (#2b221a)
      //   perfect:       slightly faded ink
      //   fixed:         slightly more faded
      //   dirty:         even more faded — got there but with errors
      //   mistake-flash: orange-red for 250ms then fades back
      const isCursorOnThisWord = (seg.paraIdx === cursorParaIdx) &&
                                  (cursorLocalPos >= seg.startPos) &&
                                  (cursorLocalPos <= seg.endPos);

      for (let k = 0; k < seg.text.length; k++) {
        const localPos = seg.startPos + k;
        const globalPos = this.paragraphStartPos[seg.paraIdx] + localPos;
        const offset = (seg.letterOffsets && seg.letterOffsets[k]) || 0;

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

        ctx.fillStyle = color;
        if (isActive) {
          // Slight shadow to make the cursor letter pop
          ctx.shadowColor = 'rgba(192, 57, 43, 0.4)';
          ctx.shadowBlur = 6;
        }
        ctx.fillText(seg.text[k], offset, 26);
        if (isActive) ctx.shadowBlur = 0;
      }

      ctx.restore();
    }

    // Gap pits: every gap (space, tab) in the CURRENT paragraph draws a
    // visible drop below the platform line. The label sits inside the pit.
    // The gap at the cursor position gets a red highlight so the typist
    // knows what key to press.
    for (const seg of this.wordSegments) {
      if (seg.type !== 'gap') continue;
      if (seg.paraIdx !== cursorParaIdx) continue;     // only current paragraph
      const isCursor = (cursorLocalPos >= seg.startPos && cursorLocalPos <= seg.endPos);

      const segScreenY = baseY + seg.yOffset - this.cameraY;
      const x0 = seg.x - this.cameraX;
      const x1 = x0 + seg.width;
      const pitDepth = 18;
      const pitColor = isCursor ? 'rgba(192, 57, 43, 0.85)' : 'rgba(43, 34, 26, 0.32)';
      const labelColor = isCursor ? 'rgba(192, 57, 43, 0.78)' : 'rgba(43, 34, 26, 0.42)';

      // Pit walls — drop straight down from the platform line
      ctx.strokeStyle = pitColor;
      ctx.lineWidth = isCursor ? 1.8 : 1.2;
      ctx.beginPath();
      ctx.moveTo(x0, segScreenY);
      ctx.lineTo(x0, segScreenY + pitDepth);
      ctx.lineTo(x1, segScreenY + pitDepth);
      ctx.lineTo(x1, segScreenY);
      ctx.stroke();

      // Label inside the pit (italic), only on the current cursor or wider
      // gaps where the label fits comfortably.
      if (isCursor || seg.subtype === 'tab') {
        ctx.fillStyle = labelColor;
        ctx.font = SPACE_LABEL_FONT;
        ctx.textAlign = 'center';
        const label = seg.subtype === 'tab' ? 'tab' : seg.subtype === 'newline' ? 'enter' : 'space';
        ctx.fillText(label, (x0 + x1) / 2, segScreenY + pitDepth - 4);
        ctx.textAlign = 'start';
        ctx.font = TEXT_FONT;
        if ('fontKerning' in ctx) ctx.fontKerning = 'none';
      }
    }

    // Stick figure
    const charX = this._xAtPosition(this.currentPos) - this.cameraX;
    const charScreenY = baseY;
    this._drawStickFigure(charX, charScreenY, now);
  }

  // --------------------------------------------------------------------------
  // Stick figure (gait code adapted from Gemini)
  // --------------------------------------------------------------------------

  _drawStickFigure(x, y, now) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    // World offsets (jumps, hops, respawns)
    if (this.state === 'respawning') {
      const dropT = Math.min(1, Math.max(0, (this.respawnPhase - 0.15) / 0.85));
      ctx.translate(0, -380 * (1 - dropT * dropT));
    } else {
      if (this.isJumping) ctx.translate(0, -Math.sin(this.jumpPhase * Math.PI) * 80);
      if (this.isHopping) ctx.translate(0, -Math.sin(this.hopPhase * Math.PI) * 22);
      ctx.rotate(this.figureAngle);
    }

    ctx.strokeStyle = '#2b221a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fall pose
    if (this.state === 'fall') {
      ctx.translate(0, this.fallPhase * this.fallPhase * 500);
      ctx.rotate(this.fallPhase * Math.PI * 1.8);
      ctx.beginPath();
      ctx.moveTo(0, -16); ctx.lineTo(-8, -8); ctx.lineTo(-10, 0);
      ctx.moveTo(0, -16); ctx.lineTo(10, -10); ctx.lineTo(12, -4);
      ctx.moveTo(0, -16); ctx.lineTo(10, -26);
      ctx.arc(10, -32, 5, 0, Math.PI * 2);
      ctx.moveTo(10, -26); ctx.lineTo(14, -18); ctx.lineTo(16, -10);
      ctx.moveTo(10, -26); ctx.lineTo(6, -16); ctx.lineTo(8, -6);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Gait profiles — clinical hip/knee/shoulder/elbow keyframes per state
    const profiles = {
      walk: {
        speed: 1.0, lean: 0.05,
        leg: [{p:0,hip:30,knee:0},{p:0.15,hip:15,knee:15},{p:0.3,hip:0,knee:0},{p:0.5,hip:-20,knee:10},{p:0.6,hip:0,knee:40},{p:0.75,hip:25,knee:60},{p:0.85,hip:30,knee:10},{p:1,hip:30,knee:0}],
        arm: [{p:0,shoulder:-25,elbow:10},{p:0.15,shoulder:-15,elbow:10},{p:0.3,shoulder:0,elbow:15},{p:0.5,shoulder:20,elbow:45},{p:0.6,shoulder:10,elbow:35},{p:0.75,shoulder:-10,elbow:20},{p:0.85,shoulder:-20,elbow:15},{p:1,shoulder:-25,elbow:10}],
      },
      jog: {
        speed: 1.5, lean: 0.15,
        leg: [{p:0,hip:35,knee:10},{p:0.15,hip:10,knee:30},{p:0.3,hip:-10,knee:15},{p:0.5,hip:-25,knee:20},{p:0.6,hip:-10,knee:70},{p:0.75,hip:35,knee:90},{p:0.85,hip:40,knee:30},{p:1,hip:35,knee:10}],
        arm: [{p:0,shoulder:-30,elbow:70},{p:0.15,shoulder:-15,elbow:75},{p:0.3,shoulder:10,elbow:85},{p:0.5,shoulder:30,elbow:95},{p:0.6,shoulder:15,elbow:85},{p:0.75,shoulder:-15,elbow:70},{p:0.85,shoulder:-25,elbow:65},{p:1,shoulder:-30,elbow:70}],
      },
      run: {
        speed: 2.2, lean: 0.30,
        leg: [{p:0,hip:45,knee:15},{p:0.15,hip:5,knee:40},{p:0.3,hip:-20,knee:20},{p:0.5,hip:-40,knee:25},{p:0.6,hip:-15,knee:90},{p:0.75,hip:40,knee:120},{p:0.85,hip:55,knee:40},{p:1,hip:45,knee:15}],
        arm: [{p:0,shoulder:-45,elbow:60},{p:0.15,shoulder:-20,elbow:75},{p:0.3,shoulder:15,elbow:95},{p:0.5,shoulder:45,elbow:110},{p:0.6,shoulder:20,elbow:90},{p:0.75,shoulder:-20,elbow:60},{p:0.85,shoulder:-40,elbow:50},{p:1,shoulder:-45,elbow:60}],
      },
    };

    let activeProfile = profiles.walk;
    if (this.state === 'jog') activeProfile = profiles.jog;
    if (this.state === 'run') activeProfile = profiles.run;
    if (this.state === 'idle') activeProfile = profiles.walk;

    const getAngles = (phase, dataSet) => {
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
      const primaryDeg = val1 + (val2 - val1) * t;
      const secondaryDeg = joint1 + (joint2 - joint1) * t;
      return { primary: primaryDeg * Math.PI / 180, secondary: secondaryDeg * Math.PI / 180 };
    };

    let phase = ((this.walkPhase * activeProfile.speed) / (Math.PI * 2)) % 1;
    if (phase < 0) phase += 1;
    if (this.state === 'idle') phase = 0;

    const lLegAngles = getAngles(phase, activeProfile.leg);
    const rLegAngles = getAngles((phase + 0.5) % 1, activeProfile.leg);
    const lArmAngles = getAngles(phase, activeProfile.arm);
    const rArmAngles = getAngles((phase + 0.5) % 1, activeProfile.arm);

    const limbLen = 9;
    const armLen = 7.5;

    const calcLeg = (angles) => {
      const thighAngle = angles.primary;
      const calfAngle = thighAngle - angles.secondary;
      const kneeX = Math.sin(thighAngle) * limbLen;
      const kneeY = Math.cos(thighAngle) * limbLen;
      const footX = kneeX + Math.sin(calfAngle) * limbLen;
      const footY = kneeY + Math.cos(calfAngle) * limbLen;
      return { kneeX, kneeY, footX, footY };
    };
    const calcArm = (angles, shoulderX, shoulderY) => {
      const upperAngle = angles.primary;
      const lowerAngle = upperAngle + angles.secondary;
      const elbowX = shoulderX + Math.sin(upperAngle) * armLen;
      const elbowY = shoulderY + Math.cos(upperAngle) * armLen;
      const handX = elbowX + Math.sin(lowerAngle) * armLen;
      const handY = elbowY + Math.cos(lowerAngle) * armLen;
      return { elbowX, elbowY, handX, handY };
    };

    const lLeg = calcLeg(lLegAngles);
    const rLeg = calcLeg(rLegAngles);
    const maxFootY = Math.max(lLeg.footY, rLeg.footY);
    const hipY = this.state === 'idle' ? -16 : -maxFootY;

    const lean = this.state === 'idle' ? 0 : activeProfile.lean;
    const spineLen = 14;
    const shoulderX = Math.sin(lean) * spineLen;
    const shoulderY = hipY - Math.cos(lean) * spineLen;

    const lArm = calcArm(lArmAngles, shoulderX, shoulderY);
    const rArm = calcArm(rArmAngles, shoulderX, shoulderY);

    const drawLine = (x1, y1, x2, y2, x3, y3) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
    };

    drawLine(shoulderX, shoulderY, rArm.elbowX, rArm.elbowY, rArm.handX, rArm.handY);
    drawLine(0, hipY, rLeg.kneeX, hipY + rLeg.kneeY, rLeg.footX, hipY + rLeg.footY);

    ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(shoulderX, shoulderY); ctx.stroke();
    ctx.beginPath(); ctx.arc(shoulderX, shoulderY - 5, 5.5, 0, Math.PI * 2); ctx.fillStyle = '#2b221a'; ctx.fill();

    drawLine(0, hipY, lLeg.kneeX, hipY + lLeg.kneeY, lLeg.footX, hipY + lLeg.footY);
    drawLine(shoulderX, shoulderY, lArm.elbowX, lArm.elbowY, lArm.handX, lArm.handY);

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // Decoration: ghosts and gravestones
  // --------------------------------------------------------------------------

  _drawGhost(ghost, now) {
    const ctx = this.ctx;
    ctx.save();

    const ageMs = now - ghost.birthTime;
    const t = Math.max(0, Math.min(1, ageMs / ghost.riseMs));
    const eased = 1 - Math.pow(1 - t, 2);
    const xPct = ghost.originXPct + (ghost.destXPct - ghost.originXPct) * eased;
    const yPct = ghost.originYPct + (ghost.destYPct - ghost.originYPct) * eased;
    ctx.globalAlpha = 0.30 * eased;

    const phaseT = now * 0.001 + ghost.phase;
    const bob = Math.sin(phaseT) * 6 * eased;
    ctx.translate(this.w * xPct, this.h * yPct + bob);
    ctx.scale(ghost.scale, ghost.scale);

    ctx.strokeStyle = '#2b221a';
    ctx.fillStyle = '#2b221a';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const headR = 6, bodyTop = -26, bodyBot = -8;
    ctx.beginPath(); ctx.arc(0, bodyTop - headR, headR, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, bodyTop); ctx.lineTo(0, bodyBot); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, bodyBot);
    ctx.quadraticCurveTo(-4, bodyBot + 6, -3, bodyBot + 8);
    ctx.moveTo(0, bodyBot);
    ctx.quadraticCurveTo(4, bodyBot + 6, 3, bodyBot + 8);
    ctx.stroke();

    const armWaver = Math.sin(phaseT * 1.7) * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, bodyTop + 3);
    ctx.lineTo(-7 + armWaver, bodyTop - 4);
    ctx.moveTo(0, bodyTop + 3);
    ctx.lineTo(7 - armWaver, bodyTop - 4);
    ctx.stroke();

    ctx.lineWidth = 1.4;
    const eyeY = bodyTop - headR - 1;
    ctx.beginPath();
    ctx.moveTo(-3.2, eyeY - 1.2); ctx.lineTo(-1.2, eyeY + 0.8);
    ctx.moveTo(-1.2, eyeY - 1.2); ctx.lineTo(-3.2, eyeY + 0.8);
    ctx.moveTo(1.2, eyeY - 1.2); ctx.lineTo(3.2, eyeY + 0.8);
    ctx.moveTo(3.2, eyeY - 1.2); ctx.lineTo(1.2, eyeY + 0.8);
    ctx.stroke();

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
