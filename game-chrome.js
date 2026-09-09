// game-chrome.js v1.1.0
//
// v1.2.0 — ⭐ THE BAR MOVED OFF THE SKY, to the bottom-left, offset by whatever
//          the view reports as its keyboard height (--gc-bottom). Targets enter
//          from the top, so a control bar up there covered every word at the
//          moment it became readable.
//
// v1.1.0 — ⭐ AN OPTIONAL "Keys" BUTTON. Jake, 2026-09-08: *"We should be able to
//          toggle off the keyboard, too."* The view owns the state and the
//          persistence; this file owns the button and its label, and renders
//          nothing at all when the view does not pass onToggleKeys.
// — THE FURNITURE EVERY GAME NEEDS AND NEITHER HAD.
// Round 82 (Victor).
//
// ⚠️⚠️ WHAT WAS MISSING, AND WHY EACH ITEM MATTERS MORE THAN IT SOUNDS:
//
//   • NO GET-READY. The game opened with a target already in flight. The clock
//     starts on the first keystroke so it was not unfair, but a student's first
//     experience was a word already falling at them.
//   • NO WAY OUT. A child who needed to stop had the browser back button. In a
//     44-minute related-arts rotation with a bell, that is not a hypothetical.
//   • NO RESTART. After game over the banner sat there forever, waiting for a
//     host that did not exist. ⚠️ "Refresh to restart" was the prototype's
//     answer and it loses the run.
//   • NOTHING TAPPABLE. Both views were keyboard-only, so a student iPad without
//     a keyboard attached could not even quit. The buttons here are DOM, not
//     canvas, so they are real tap targets and real focus targets.
//
// ⚠️ ONE COPY, TWO GAMES. Every item above would otherwise be built twice and
// drift — which is the whole argument of this round. Views hand in callbacks and
// get back an object with `setPhase()`.
//
// ⚠️ THE BUTTONS MUST NOT STEAL KEYSTROKES. A focused <button> swallows Space and
// Enter, and Space is a character in prose lessons. Every button here calls
// `blur()` on click and the container refuses to take focus, so the keystroke
// path is unchanged. ⚠️ DO NOT ADD A BUTTON WITHOUT THAT BLUR.

import { prefersReducedMotion } from './game-draw.js';

export const GAME_CHROME_VERSION = '1.3.0';

// ⚠️ THREE SECONDS, AND THE SPAWNS WAIT FOR IT. Not the clock — the clock starts
// on the first keystroke regardless, and always did.
export const COUNTDOWN_MS = 3000;

const CSS = `
.gc-wrap { position:absolute; inset:0; pointer-events:none;
           font-family:"Courier Prime", ui-monospace, monospace; }
/* ⚠️⚠️ THE OVERLAY POSITIONING IS GONE (Round 94). Jake: "The buttons are a
   nightmare. You can see that they cover the interface, which is a no go. Even
   when the keyboard is hidden, they are offset awkwardly." Every value we tried
   for the bottom offset landed the bar on something — the sky, the skyline, the
   keys — because a floating bar over a full-bleed canvas has nowhere that is not
   something. When a host supplies barHost the bar is an ordinary block in an
   ordinary card and cannot cover anything by construction.
   ⚠️⚠️ NO BACKTICKS IN THIS BLOCK, EVER. It lives inside a template literal, so
   one backtick closes the string and the whole module fails to parse with an
   error that names a CSS property and points nowhere near here. */
.gc-bar { display:flex; gap:6px; pointer-events:auto; z-index:2; }
/* ⚠️⚠️ THE OVERLAY POSITIONING IS GONE (Round 94). Jake: *"The buttons are a
   nightmare. You can see that they cover the interface, which is a no go. Even
   when the keyboard is hidden, they are offset awkwardly."* Every value we tried
   for 'bottom' landed the bar on something — the sky, the skyline, the keys —
   because a floating bar over a full-bleed canvas has nowhere that is not
   something. When a host supplies 'barHost' the bar is an ordinary block in an
   ordinary card and cannot cover anything by construction. */
.gc-bar-card { flex-direction:column; align-items:stretch; gap:8px; }
.gc-bar-card .gc-btn { width:100%; }
/* ⚠️ FALLBACK ONLY, for a host that supplies no barHost (learn.js, and Escape
   Key until it grows a card). Still off the sky: bottom-left, over the strip. */
.gc-bar-float { position:absolute; bottom:8px; left:14px; }
.gc-btn { background:rgba(6,10,18,0.86); color:#bfe9ff; border:1px solid #2b6c8a;
          border-radius:6px; padding:6px 12px; font:inherit; font-size:13px;
          cursor:pointer; min-width:44px; min-height:32px; }
.gc-btn:hover { background:rgba(22,64,85,0.95); }
.gc-panel { position:absolute; inset:0; display:flex; flex-direction:column;
            align-items:center; justify-content:center; gap:14px;
            background:rgba(2,4,10,0.82); pointer-events:auto; }
.gc-title { color:#ffd700; font-size:30px; font-weight:700; letter-spacing:1px; }
.gc-sub { color:#9fb6c6; font-size:14px; text-align:center; max-width:34ch; line-height:1.5; }
.gc-row { display:flex; gap:10px; }
.gc-count { color:#00e5ff; font-size:96px; font-weight:700; line-height:1; }
.gc-hidden { display:none; }
`;

/**
 * @param {HTMLElement} container  the same element the view drew its canvas into
 * @param {object} opts
 *   title      {string}   game display title, from game-names.js
 *   hint       {string}   one line of how-to-play for the get-ready panel
 *   onStart    {function} countdown finished — begin spawning
 *   onPause    {function(boolean)} paused / resumed
 *   onQuit     {function} student is done; host should unmount
 *   onRestart  {function} student wants another run
 *   onMute     {function(boolean)} sound off / on
 *   muted      {boolean}  initial state
 * @returns {{ setPhase, showResult, destroy, el }}
 */
export function mountChrome(container, opts) {
    const o = opts || {};
    if (!document.getElementById('gc-style')) {
        const st = document.createElement('style');
        st.id = 'gc-style';
        st.textContent = CSS;
        document.head.appendChild(st);
    }

    const wrap = document.createElement('div');
    wrap.className = 'gc-wrap';
    // ⚠️ THE VIEW'S CONTAINER NEEDS A POSITIONING CONTEXT or this overlay escapes
    // to the nearest positioned ancestor, which in learn.html is the page.
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

    const bar = document.createElement('div');
    // ⚠️ THE HOST DECIDES WHETHER THIS IS A CARD OR AN OVERLAY. A host that
    // passes barHost gets a static block inside its own layout; one that does
    // not keeps the old floating bar, so learn.js and Escape Key are untouched.
    bar.className = 'gc-bar' + (o.barHost ? ' gc-bar-card' : ' gc-bar-float');
    const btnPause = mkBtn('Pause');
    const btnMute = mkBtn(o.muted ? 'Sound off' : 'Sound on');
    // ⚠️ OPTIONAL, AND ABSENT WHEN THE VIEW DOES NOT OFFER IT. Escape Key has no
    // keyboard strip yet, and a dead button is worse than a missing one.
    const btnKeys = o.onToggleKeys ? mkBtn(o.keysOn === false ? 'Keys off' : 'Keys on') : null;
    const btnQuit = mkBtn('Done');
    bar.append(btnPause, btnMute, ...(btnKeys ? [btnKeys] : []), btnQuit);
    if (btnKeys) {
        btnKeys.addEventListener('click', () => {
            const on = o.onToggleKeys();
            btnKeys.textContent = on ? 'Keys on' : 'Keys off';
        });
    }

    const panel = document.createElement('div');
    panel.className = 'gc-panel gc-hidden';

    // ⚠️⚠️ THE PANEL AND COUNTDOWN STAY IN THE PLAY CONTAINER, ALWAYS. Jake's
    // ruling: the countdown must not cover the radar. It is an overlay on the
    // thing it is counting down TO, and that is the play area — moving it into a
    // side card would put "3… 2… 1…" beside the game instead of over it.
    wrap.append(panel);
    container.appendChild(wrap);
    if (o.barHost) o.barHost.appendChild(bar);
    else wrap.appendChild(bar);

    let phase = 'ready';
    let countdownFrom = null;
    let rafId = null;
    let muted = !!o.muted;

    function mkBtn(label) {
        const b = document.createElement('button');
        b.className = 'gc-btn';
        b.type = 'button';
        b.textContent = label;
        // ⚠️ BLUR ON CLICK. See the header — a focused button eats Space and
        // Enter, and Space is a real character in a prose lesson.
        b.addEventListener('click', () => b.blur());
        return b;
    }

    function panelHTML(nodes) {
        panel.textContent = '';
        nodes.forEach(n => panel.appendChild(n));
        panel.classList.remove('gc-hidden');
    }
    function hidePanel() { panel.classList.add('gc-hidden'); }

    function el(cls, text) {
        const d = document.createElement('div');
        d.className = cls;
        if (text != null) d.textContent = text;
        return d;
    }

    // ── ready / countdown ───────────────────────────────────────────────────
    function showReady() {
        phase = 'ready';
        const go = mkBtn('Start');
        go.style.fontSize = '16px';
        go.style.padding = '10px 26px';
        go.addEventListener('click', beginCountdown);
        const row = el('gc-row'); row.appendChild(go);
        panelHTML([
            el('gc-title', o.title || 'Ready?'),
            el('gc-sub', o.hint || ''),
            row,
        ]);
        // Enter or Space also starts, since their hands are already on the keys.
        window.addEventListener('keydown', readyKey, true);
    }

    function readyKey(e) {
        if (phase !== 'ready') return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); beginCountdown(); }
    }

    function beginCountdown() {
        window.removeEventListener('keydown', readyKey, true);
        phase = 'countdown';
        countdownFrom = performance.now();
        const num = el('gc-count', '3');
        panelHTML([num]);
        // ⚠️ REDUCED MOTION GETS A STATIC COUNT, no scale animation.
        const animate = !prefersReducedMotion();
        const tick = () => {
            const left = COUNTDOWN_MS - (performance.now() - countdownFrom);
            if (left <= 0) {
                hidePanel();
                phase = 'playing';
                rafId = null;
                if (o.onStart) o.onStart();
                return;
            }
            const secs = Math.ceil(left / 1000);
            num.textContent = String(secs);
            if (animate) {
                const frac = (left % 1000) / 1000;
                num.style.transform = `scale(${(0.85 + 0.15 * frac).toFixed(3)})`;
            }
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
    }

    // ── pause ───────────────────────────────────────────────────────────────
    function setPaused(on) {
        if (phase === 'over' || phase === 'ready' || phase === 'countdown') return;
        phase = on ? 'paused' : 'playing';
        btnPause.textContent = on ? 'Resume' : 'Pause';
        if (on) {
            const resume = mkBtn('Resume');
            resume.style.fontSize = '16px';
            resume.style.padding = '10px 26px';
            resume.addEventListener('click', () => setPaused(false));
            const row = el('gc-row'); row.appendChild(resume);
            panelHTML([el('gc-title', 'Paused'), row]);
        } else {
            hidePanel();
        }
        if (o.onPause) o.onPause(on);
    }

    btnPause.addEventListener('click', () => setPaused(phase !== 'paused'));
    btnQuit.addEventListener('click', () => { if (o.onQuit) o.onQuit(); });
    btnMute.addEventListener('click', () => {
        muted = !muted;
        btnMute.textContent = muted ? 'Sound off' : 'Sound on';
        if (o.onMute) o.onMute(muted);
    });

    return {
        el: wrap,

        /** 'ready' shows the get-ready panel; the view calls this after mount. */
        setPhase(p) {
            if (p === 'ready') showReady();
        },

        /**
         * Game over. `lines` is a short list of strings the view has already
         * formatted — ⚠️ THIS FILE DOES NOT COMPUTE OR FORMAT A RESULT. That is
         * the shell's report and the host's modal; a second place that renders a
         * grade is exactly the Rule 9 shape this project keeps finding.
         */
        showResult({ heading, lines, canRestart }) {
            phase = 'over';
            btnPause.classList.add('gc-hidden');
            const nodes = [el('gc-title', heading || 'Game over')];
            (lines || []).forEach(t => nodes.push(el('gc-sub', t)));
            const row = el('gc-row');
            if (canRestart !== false && o.onRestart) {
                const again = mkBtn('Play again');
                again.style.fontSize = '16px';
                again.style.padding = '10px 22px';
                again.addEventListener('click', () => o.onRestart());
                row.appendChild(again);
            }
            const done = mkBtn('Done');
            done.style.fontSize = '16px';
            done.style.padding = '10px 22px';
            done.addEventListener('click', () => { if (o.onQuit) o.onQuit(); });
            row.appendChild(done);
            nodes.push(row);
            panelHTML(nodes);
        },

        get phase() { return phase; },

        destroy() {
            if (rafId != null) cancelAnimationFrame(rafId);
            window.removeEventListener('keydown', readyKey, true);
            if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        },
    };
}
