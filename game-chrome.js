// game-chrome.js v1.9.0 — Round 111 (Bar-Let): THE WHOLE RUN IS REACHABLE FROM
//   THE HOME ROW — Enter starts, Enter plays again, Escape pauses, Enter or
//   Escape resumes. ⚠️⚠️ THE START HANDLER USED TO REMOVE ITSELF AT COUNTDOWN, so
//   Enter worked exactly ONCE per mount and every restart needed the mouse.
//   ⭐ THE MOUSE IS A POSTURE PROBLEM, NOT A CONVENIENCE ONE: every reach for it
//   takes a hand off the home row, which is the one habit this app exists to
//   build. ⚠️ SPACE RESUMES NOTHING — it is a live typing key in all three games.
// game-chrome.js v1.8.0 — Round 109 (Bar-Let): ESCAPE PAUSES ANY GAME. Jake:
//   *"The escape key should pause any game - this gives the hover mechanic to
//   work."* ⚠️ IT LIVES HERE, NOT IN THE THREE VIEWS — pause is already this
//   file's job, and three copies of a pause key is three places for it to stop
//   working. ⚠️ CAPTURE PHASE, and it stops propagation: every view already binds
//   Escape to its own "clear what I typed", and pausing outranks that.
// game-chrome.js v1.7.0
//
// v1.7.0 — ⭐ ROUND 101 — THE CARD BUTTONS BECOME BOLTED-IN HARDWARE. Jake,
//          2026-09-09: *"I wish the buttons were a little more thought out -
//          made to look like they were a part of the physical interface there
//          above."* Bevelled plates with a lit top edge, a 9x4 lamp matching the
//          threat board's shield pips, a press that SINKS rather than lights,
//          and amber on the one control that ends the run.
//          ⚠️⚠️ EVERY COSMETIC RULE IS SCOPED TO .gc-bar-card. learn.js and
//          Escape Key mount the FLOATING bar over a full-bleed canvas, where a
//          raised plate would read as a panel dropped on the sky — they see the
//          bare .gc-btn rules and nothing else. DO NOT MERGE THE TWO BLOCKS.
//
// v1.6.0 — ⚠️⚠️ THE DUPLICATED CONTROLS. destroy() removed `wrap` and left the
//          BAR on the page, because with a barHost the bar has a different
//          parent — so every re-mount appended another set, and the extra
//          stack's min-content height is what made the flanks taller than the
//          stage. Fixed at source, plus a stale-bar sweep on mount. A card
//          button's height floor is lower now for the same reason.
//
// v1.5.0 — ⭐ ROUND 100 (Franklin) — the card stack can take the column's spare
//          height and the buttons grow into it, capped by the host. ⚠️ THE
//          FLOATING BAR IS UNCHANGED: a bar overlaid on a canvas must not start
//          stretching, and learn.js and Escape Key both still use it.
//
// v1.4.0 — ⭐ ROUND 99 (Franklin) — THE COUNTDOWN LEAVES THE SKY, AND THE
//          BUTTONS BECOME CONSOLE HARDWARE.
//          Jake, 2026-09-09: *"Countdown time should move to the new digital
//          readout to keep it unified."* and *"Buttons can fill in the space
//          below in a style that matches everything else."*
//          ⚠️⚠️ ROUND 94's RULING IS INTACT, NOT OVERRULED. It said the countdown
//          must not cover the radar and must not migrate into a side card. The
//          READY, PAUSED and RESULT panels have not moved a pixel — they are
//          still overlays on the play container, and the harness still pins
//          that. What moved is THREE DIGITS, into a readout that already
//          existed, and it serves the original reason better than the old
//          placement did: the whole point of not covering the scope is that the
//          inbound word is on it, and those three seconds are when a student is
//          meant to read it. A 96px numeral over the sky spent them instead.
//          ⚠️ AND IT DEGRADES RATHER THAN DISAPPEARING. A host that passes no
//          onCountdown (learn.js, Escape Key) keeps the big DOM numeral exactly
//          as before — a countdown that silently vanished on two of three
//          surfaces would be the worse bug by far.
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

export const GAME_CHROME_VERSION = '1.9.0';

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
/* ⚠️ CONSOLE HARDWARE, NOT WEB BUTTONS (Round 99). Jake: *"we wouldn't leave
   parts of it bare - we'd have information, or buttons, or lights... This is a
   battle station, not a computer game."* Uppercase, letter-spaced, square-cut
   with a lit left edge, sized to the same 10px lamp rhythm as the gauges.
   ⚠️ min-height STAYS AT OR ABOVE 40px: these are the only way off this page
   for a student on an iPad with no keyboard attached, and 32px was already
   under Apple's own 44pt guidance. */
/* ⚠️ IN A CARD THE FLOOR IS LOWER THAN THE FLOATING BAR'S. Four 40px buttons
   plus the canvas floor was contributing more min-content height than #stage
   gives the row, which pushed the flanks past the play frame. They still GROW
   to fill the column (the host sets flex), so the tap target on a real screen is
   larger than the floor — the floor only decides what happens when there is no
   room to spare. */
.gc-bar-card .gc-btn { min-height:34px; }
/* ⭐ ROUND 101 — THE CARD BUTTONS ARE BOLTED-IN HARDWARE, AND EVERY RULE BELOW
   IS SCOPED TO .gc-bar-card FOR A REASON. Jake, 2026-09-09: *"I wish the buttons
   were a little more thought out - made to look like they were a part of the
   physical interface there above."* The interface above them is a canvas of
   segmented lamps, corner brackets and lit top edges — so these borrow the same
   vocabulary rather than inventing a fifth one.
   ⚠️⚠️ THE FLOATING BAR MUST NOT INHERIT ANY OF IT. learn.js and Escape Key put
   .gc-btn over a full-bleed canvas, where a raised plate with a bevel would read
   as a panel dropped on the sky. Everything cosmetic here is under
   .gc-bar-card; the bare .gc-btn rules above are still the only thing those two
   surfaces see. ⚠️ DO NOT "TIDY" THESE INTO THE .gc-btn BLOCK.
   ⚠️ AND NO BACKTICKS — this whole string is a template literal. */
.gc-bar-card .gc-btn {
    position:relative;
    padding:9px 12px 9px 30px;
    border:1px solid #24455c; border-left:3px solid #2b6c8a; border-radius:2px;
    background:linear-gradient(180deg, rgba(20,34,48,0.96) 0%, rgba(9,16,24,0.96) 100%);
    /* A lit top edge and a dark bottom one: the same two-tone housing the flank
       cards use, so a button reads as part of the console's face. */
    box-shadow:inset 0 1px 0 rgba(143,232,200,0.10),
               inset 0 -2px 0 rgba(0,0,0,0.45),
               0 1px 0 rgba(0,0,0,0.55);
    letter-spacing:2px;
}
/* ⚠️ THE LAMP IS 9x4 BECAUSE THE THREAT BOARD'S SHIELD PIPS ARE 9x4. Two lamp
   sizes six inches apart is exactly the "slightly off" that reads worse than an
   obvious difference — one machine, one lamp. */
.gc-bar-card .gc-btn::before {
    content:''; position:absolute; left:11px; top:50%; margin-top:-2px;
    width:9px; height:4px; background:rgba(120,170,220,0.5);
}
.gc-bar-card .gc-btn:hover {
    background:linear-gradient(180deg, rgba(30,62,84,0.98) 0%, rgba(14,30,42,0.98) 100%);
    border-left-color:#8fe8c8; color:#e8f6ff;
}
.gc-bar-card .gc-btn:hover::before {
    background:#8fe8c8; box-shadow:0 0 7px rgba(143,232,200,0.55);
}
/* ⚠️ A PRESS SINKS, IT DOES NOT LIGHT UP. The bevel inverts and the plate drops
   1px, which is what a physical control does — and it keeps the pressed state
   readable on a touch screen where there is no hover to have lost. */
.gc-bar-card .gc-btn:active {
    transform:translateY(1px);
    box-shadow:inset 0 2px 5px rgba(0,0,0,0.65);
    background:linear-gradient(180deg, rgba(9,16,24,0.98) 0%, rgba(20,34,48,0.98) 100%);
}
.gc-bar-card .gc-btn:focus-visible { outline:2px solid #8fe8c8; outline-offset:1px; }
/* ⚠️ AMBER ON THE WAY OUT, AND COLOUR IS NOT THE ONLY CHANNEL — it is also the
   last button in the stack and says DONE. The rest of the console reserves amber
   for the gate marker, i.e. "the thing you are steering toward"; leaving the run
   is the one control with a consequence, so it does not look identical to Pause. */
.gc-bar-card .gc-btn-exit { border-left-color:#ffcf6b; }
.gc-bar-card .gc-btn-exit::before { background:rgba(255,207,107,0.55); }
.gc-bar-card .gc-btn-exit:hover { border-left-color:#ffd27d; }
.gc-bar-card .gc-btn-exit:hover::before {
    background:#ffd27d; box-shadow:0 0 7px rgba(255,210,125,0.55);
}
.gc-btn { background:rgba(6,12,20,0.92); color:#bfe9ff;
          border:1px solid #2b6c8a; border-left:3px solid #2b6c8a;
          border-radius:3px; padding:9px 12px; font:inherit; font-size:12px;
          letter-spacing:1.5px; text-transform:uppercase; text-align:left;
          cursor:pointer; min-width:44px; min-height:40px; }
.gc-btn:hover { background:rgba(22,64,85,0.95); border-left-color:#8fe8c8;
                color:#e8f6ff; }
.gc-btn:active { background:rgba(30,84,112,0.98); }
/* The card stack gets a hairline rule above it so the buttons read as the
   bottom third of one instrument rather than as loose controls under a canvas.
   ⭐ ROUND 100: the host may hand this stack the column's leftover height (see
   arcade.html's #controls-col rules), and the buttons grow into it. That is the
   best available use of that space — these are the only way off the page for a
   student on an iPad with no keyboard attached, so bigger is strictly better up
   to the cap the host sets. ⚠️ THE GROWTH IS THE HOST'S DECISION, NOT THIS
   FILE'S: learn.js and Escape Key still get the floating bar, which must not
   start stretching to fill a canvas overlay. */
.gc-bar-card { border-top:1px solid rgba(120,170,220,0.22); padding-top:10px; }
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
 *   onCountdown {function(number|null)} OPTIONAL. Given one, this file draws no
 *              countdown numeral at all and the host renders the seconds in its
 *              own readout; null means the count is over. See beginCountdown().
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
    const btnQuit = mkBtn('Done', 'gc-btn-exit');
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
    if (o.barHost) {
        // ⚠️ BELT AND BRACES, AND DELIBERATELY NOT THE FIX. The leak is fixed at
        // source in destroy() below; this clears any bar a caller has already
        // orphaned, so a page that mounts twice cannot show two sets of controls
        // even if some future teardown path is missed again. ⚠️ SCOPED TO DIRECT
        // CHILDREN of the host — a descendant .gc-bar would belong to somebody
        // else's mount.
        for (const stale of Array.from(o.barHost.children)) {
            if (stale.classList && stale.classList.contains('gc-bar')) stale.remove();
        }
        o.barHost.appendChild(bar);
    }
    else wrap.appendChild(bar);

    let phase = 'ready';
    let countdownFrom = null;
    let rafId = null;
    let muted = !!o.muted;

    // ⚠️ `extra` IS COSMETIC ONLY, AND ONLY THE CARD STACK STYLES IT. A class on
    // the floating bar's buttons changes nothing there by construction — every
    // rule that reads it is scoped to .gc-bar-card in the CSS above.
    function mkBtn(label, extra) {
        const b = document.createElement('button');
        b.className = 'gc-btn' + (extra ? ' ' + extra : '');
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
        // ⭐⭐ ESCAPE PAUSES ANY GAME. Jake, 2026-09-09: *"The escape key should pause
    // any game - this gives the hover mechanic to work (hover over a word to see
    // what book it came from and/or what morphemes mean)."*
    // ⚠️ IT LIVES IN THE CHROME, NOT IN THE THREE VIEWS. Pause is already this
    // file's job — three copies of a pause key is three places for it to stop
    // working, and the views each already bind Escape to their own "clear what I
    // typed", which is why this listens in the CAPTURE phase and stops the event
    // before it reaches them.
    // ⚠️ NOT WHILE THE GET-READY PANEL IS UP: there is nothing to pause yet, and
    // Escape there would look like it did nothing.
    function pauseKey(e) {
        if (e.key !== 'Escape') return;
        if (phase !== 'playing' && phase !== 'paused') return;
        e.preventDefault();
        e.stopPropagation();
        setPaused(phase !== 'paused');
    }
    window.addEventListener('keydown', pauseKey, true);
    window.addEventListener('keydown', readyKey, true);
    }

    /**
     * ⚠️⚠️ THE WHOLE RUN IS REACHABLE FROM THE HOME ROW. Jake, 2026-09-10:
     * *"Enter should play again - ideally a kid would never have to use the mouse
     * once he's in the game... That way they can stay on home row for as long as
     * possible."*
     *
     * ⭐ THE MOUSE IS NOT A CONVENIENCE PROBLEM, IT IS A POSTURE PROBLEM. Every
     * reach for it takes a hand off the home row, and the one habit this entire
     * app exists to build is the hand that stays there. A game that ends with a
     * mouse click undoes a little of its own lesson every round.
     *
     * ⚠️ THIS HANDLER USED TO REMOVE ITSELF AT `beginCountdown()`, so Enter
     * worked exactly once — on the very first start — and every restart after
     * that needed the mouse. ⭐ IT NOW LIVES FOR THE WHOLE MOUNT and switches on
     * `phase`, which is the state that already decides what a key should mean.
     *
     *   ready   Enter / Space  start
     *   over    Enter          play again
     *   paused  Enter / Escape resume
     *   playing Escape         pause (in pauseKey, so it can stop propagation)
     *
     * ⚠️ SPACE RESUMES NOTHING. It is a live typing key in all three games, and a
     * student unpausing with it would fire a keystroke into the run they just
     * came back to.
     */
    function readyKey(e) {
        if (phase === 'ready') {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); beginCountdown(); }
            return;
        }
        if (phase === 'over') {
            // ⚠️ ONLY WHEN A RESTART IS ACTUALLY ON OFFER. Enter on a result panel
            // with no PLAY AGAIN button would silently do nothing, which reads as
            // a stuck game rather than as a disabled key.
            if (e.key === 'Enter' && o.onRestart) { e.preventDefault(); o.onRestart(); }
            return;
        }
        if (phase === 'paused' && e.key === 'Enter') { e.preventDefault(); setPaused(false); }
    }

    // ⚠️⚠️ WHO OWNS THE THREE DIGITS IS DECIDED BY THE HOST, ONCE, HERE. A view
    // that supplies onCountdown draws them in its own readout and this file
    // clears the overlay so the sky and the scope are visible for those three
    // seconds. A view that does not keeps the 96px numeral it always had.
    // ⚠️ NEVER BOTH. Two countdowns for one clock is the Rule 9 shape in
    // miniature, and the student would have to work out whether they agree.
    const hostOwnsCount = typeof o.onCountdown === 'function';

    function beginCountdown() {
        phase = 'countdown';
        countdownFrom = performance.now();
        let num = null;
        if (hostOwnsCount) {
            // ⭐ THE PANEL COMES DOWN IMMEDIATELY. This is the whole gain: the
            // inbound word is already on the scope, and the countdown is
            // precisely the window in which a student is supposed to read it.
            hidePanel();
        } else {
            num = el('gc-count', '3');
            panelHTML([num]);
        }
        // ⚠️ REDUCED MOTION GETS A STATIC COUNT, no scale animation.
        const animate = !prefersReducedMotion();
        const tick = () => {
            const left = COUNTDOWN_MS - (performance.now() - countdownFrom);
            if (left <= 0) {
                hidePanel();
                phase = 'playing';
                rafId = null;
                // ⚠️ CLEARED BEFORE onStart, ALWAYS. The view switches its
                // readout back to the run clock on a null; doing it after
                // onStart would leave "1" on the panel for one frame of play.
                if (hostOwnsCount) o.onCountdown(null);
                if (o.onStart) o.onStart();
                return;
            }
            const secs = Math.ceil(left / 1000);
            if (hostOwnsCount) {
                o.onCountdown(secs);
            } else {
                num.textContent = String(secs);
                if (animate) {
                    const frac = (left % 1000) / 1000;
                    num.style.transform = `scale(${(0.85 + 0.15 * frac).toFixed(3)})`;
                }
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
            // ⚠️ A HOST UNMOUNTED MID-COUNTDOWN MUST NOT KEEP "2" ON ITS CLOCK.
            if (phase === 'countdown' && hostOwnsCount) {
                try { o.onCountdown(null); } catch (_) {}
            }
            window.removeEventListener('keydown', readyKey, true);
            window.removeEventListener('keydown', pauseKey, true);
            if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
            // ⚠️⚠️ AND THE BAR, WHICH IS THE BUG JAKE SAW AS "the buttons are
            // currently duplicated when I'm paused". With a barHost the bar is
            // NOT inside `wrap` — it was appended to the host's own card — so
            // removing `wrap` orphaned it and left it on the page. arcade.html's
            // play() destroys and re-mounts on every launch, so a second run
            // appended a SECOND set of controls, a third a third.
            // ⭐ AND THAT IS ALSO WHY THE PAGE WAS TOO TALL. The extra stack
            // contributed its own min-content height to the grid row, so the
            // flank cards grew past #stage and the radar stretched with them.
            // One defect, two of the four reports.
            // ⚠️ THE LESSON: A TEARDOWN MUST UNDO EVERY ATTACHMENT, NOT THE
            // OBVIOUS ONE. The moment mountChrome() gained a second parent
            // (Round 94's barHost) it needed a second removal, and nothing
            // failed loudly because the leak looks like a layout opinion.
            if (bar.parentNode) bar.parentNode.removeChild(bar);
        },
    };
}
