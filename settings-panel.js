// settings-panel.js v1.2.0 — THE ⚙ DIALOG, AND THE READING-FONT MODEL.
//
// v1.2.0 — `copy` on an info row: click the value to put a longer form on the
//          clipboard. Added for the student ID when Round 27g deleted the corner
//          stamp that used to carry that behaviour. §0.-19.
//
// v1.1.0 — `onClose`. learn.js pauses School's graded clock while this is open,
//          and this is how it gets resumed. ⚠️ READ THE BLOCK INSIDE close():
//          the callback runs in a `finally`, from the single close() that ✕, Esc
//          and the backdrop all reach, because a resume that fails to fire means
//          a child types on while nothing counts.
//
// ═════════════════════════════════════════════════════════════════════════════
// WHY THIS FILE EXISTS
// ═════════════════════════════════════════════════════════════════════════════
//
// ROADMAP item 0b. School had no settings dialog at all, and three things had
// nowhere to live:
//
//   1. the reading-font control, which was pinned to the School MAP header
//      because a focusable control inside the drill is one Tab away from eating
//      a keystroke the child should have been credited for;
//   2. the child's CLASS, which learn.js v2.24.0 removed from the top bar on
//      Jake's ruling and which then lived NOWHERE — `updateClassDisplay()` has
//      been writing to `#user-class-name`, an element deleted from learn.html,
//      so the text went into a null check every time;
//   3. parity — a child moving between Library and School should not find that
//      the ⚙ means something different on each side.
//
// ⚠️ ROADMAP 0b SAID EXPLICITLY: *"`openMenuModal()` in game.js is the model.
// DO NOT IMPORT IT — it reaches into book, chapter, sprint and view state that
// School has none of. Take its shape, not its body, and put the shared parts
// somewhere both can import rather than growing a third copy of a settings
// dialog."* This is that somewhere. It is the SHAPE of Library's menu — a
// titled dialog of labelled rows, dismissed by ✕, Esc or the backdrop — with
// none of its body.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ THE CONTRACT: DOM-ONLY AND STATE-FREE, exactly like celebrate.js and
// receipt.js
// ═════════════════════════════════════════════════════════════════════════════
//
// This module NEVER reads Firestore, NEVER flushes, NEVER touches a counter and
// NEVER decides anything. It is handed values that have already been resolved
// and it draws them. The one piece of state it owns is the reading-font choice,
// which is localStorage-only and affects nothing but glyphs.
//
// ⚠️ IT MUST NOT LEARN TO SAVE THINGS. The moment a settings dialog starts
// writing to Firestore it becomes a place where a child can lose work by
// closing a window, and every counting incident in this project traces to a
// quantity that got a second owner. If a future round needs a persisted setting
// here, the WRITE belongs in the page controller; this file collects the value
// and hands it back through a callback.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THE TAB HAZARD — WHY THE DIALOG IS BUILT AND DESTROYED, NOT HIDDEN
// ═════════════════════════════════════════════════════════════════════════════
//
// ROADMAP item 8's ruling, which item 0b restates and does not soften: a
// focusable control that a child can reach by pressing Tab from a typing view
// will eventually eat a keystroke they should have been credited for. A
// `<select>` that is merely `display:none` is still in the tab order in some
// engines and is still one bug away from being visible.
//
// So: `openSettingsPanel()` CREATES the dialog and `close()` REMOVES it from the
// document. Between opens there is no dialog, no select, and nothing to tab to.
// The ⚙ that opens it is `tabindex="-1"` and mouse-only for the same reason.
//
// ⚠️ AND IT RESTORES FOCUS ON THE WAY OUT. Whatever had focus when the panel
// opened gets it back when the panel closes. In School that is the drill's
// keyboard surface, and a child who opens settings mid-lesson and closes it
// again must be able to keep typing without clicking anything. Losing that is
// the same defect as eating a keystroke, one step removed.

export const SETTINGS_PANEL_VERSION = '1.2.0';

// ═════════════════════════════════════════════════════════════════════════════
// THE READING-FONT MODEL — moved here from learn.js v2.23.0 in one commit
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ RULE 9: THIS IS A MOVE, NOT A COPY. learn.js's own `DRILL_FONTS`,
// `applyDrillFont()` and `readDrillFont()` are DELETED in the same deploy that
// adds these. If you find a second copy of this table anywhere, one of them is
// already wrong — the celebration drift in HANDOFF §0.-13.E started exactly
// this way, with two lists nobody chose to differ.
//
// ⚠️ NO WEBFONTS. Every face here is either already loaded (Courier Prime) or a
// system stack. appcheck.html exists because a district can block a CDN, and a
// font picker whose options silently fall back to Times on the school network is
// worse than no picker. Nothing here makes a network request.
//
// ⚠️ NO SCRIPT OR JOINED FACES (Jake's rule). A child learning to touch-type has
// to tell `l` from `1` and `rn` from `m`, and per-character highlighting on a
// joined face is unreadable besides.
//
// ⚠️⚠️ AND THE ONE THAT IS NOT OBVIOUS: A PROPORTIONAL FONT BREAKS THE DRILL'S
// NO-REFLOW GUARANTEE, AND style.css MAKES THAT GUARANTEE WITHOUT KNOWING IT.
// The comment above .dt-char reads "State classes change color only, never
// dimensions" — but .dt-fixed and .dt-dirty set `font-weight: bold`. In a
// MONOSPACE face bold has the same advance width, so the claim holds by luck of
// the font rather than by the CSS. In a proportional face it does not: a
// character going bold the moment a child backspaces and retypes would shove
// the rest of the line sideways, under their fingers, at exactly the worst
// moment. style.css v3.6.0 swaps bold for an underline while a proportional
// face is active. ⚠️ IF YOU ADD A FACE, SET THE `mono` FLAG HONESTLY OR THAT
// GUARANTEE SILENTLY LAPSES.
export const DRILL_FONTS = [
    // key,     label,        stack,                                                   mono
    ['courier', 'Typewriter', "'Courier Prime', monospace",                             true ],
    ['mono',    'Plain',      "Consolas, 'Andale Mono', 'DejaVu Sans Mono', monospace", true ],
    ['serif',   'Book',       "Georgia, 'Times New Roman', serif",                      false],
    ['sans',    'Clean',      "Verdana, Geneva, sans-serif",                            false],
    ['round',   'Rounded',    "'Comic Sans MS', 'Trebuchet MS', sans-serif",            false],
];

const DRILL_FONT_KEY = 'ttbDrillFont';

// Returns the key actually applied. ⚠️ An unknown key falls back to the default
// rather than blanking the drill: a student who somehow gets a bad value in
// localStorage must still be able to read the words on the screen.
export function applyDrillFont(key) {
    const f = DRILL_FONTS.find(x => x[0] === key) || DRILL_FONTS[0];
    document.documentElement.style.setProperty('--drill-font', f[2]);
    // The class is what style.css keys the bold-vs-underline swap off.
    document.documentElement.classList.toggle('ttb-drill-proportional', !f[3]);
    return f[0];
}

export function readDrillFont() {
    try { return localStorage.getItem(DRILL_FONT_KEY) || DRILL_FONTS[0][0]; }
    catch (_) { return DRILL_FONTS[0][0]; }
}

export function writeDrillFont(key) {
    try { localStorage.setItem(DRILL_FONT_KEY, key); } catch (_) { /* private mode */ }
}

// ═════════════════════════════════════════════════════════════════════════════
// THE DIALOG
// ═════════════════════════════════════════════════════════════════════════════
//
// openSettingsPanel({ title, rows }) -> close()
//
// `rows` is an array, drawn in order:
//   { kind: 'info',  label, value, hint }   read-only text
//   { kind: 'font' }                        the reading-font control
//   { kind: 'note',  text }                 a quiet line of explanation
//
// ⚠️ RE-ENTRANCY GUARDED. A double-click on the ⚙ must not stack two overlays,
// because the second one's close() would leave the first behind with the page
// still covered. Same guard shape as receipt.js's.
let _open = null;

export function openSettingsPanel({ title = 'Settings', rows = [], onClose = null } = {}) {
    if (_open) return _open;

    // ⚠️ REMEMBER WHO HAD FOCUS. In School this is the drill's keyboard surface;
    // if it does not get focus back, the child cannot resume typing without
    // clicking, and they will not know why.
    const previouslyFocused = document.activeElement;

    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.className = 'settings-overlay';
    // Announced as a dialog, but note the tabindex discipline below: nothing in
    // here is reachable from the page behind, because the page behind no longer
    // has anything to tab from once this is open.
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', title);

    const panel = document.createElement('div');
    panel.className = 'settings-panel';

    const head = document.createElement('div');
    head.className = 'settings-head';
    const h = document.createElement('span');
    h.className = 'settings-title';
    h.textContent = title;
    const x = document.createElement('button');
    x.type = 'button';
    x.className = 'settings-close';
    x.setAttribute('aria-label', 'Close settings');
    x.textContent = '\u2715';
    head.appendChild(h);
    head.appendChild(x);
    panel.appendChild(head);

    const body = document.createElement('div');
    body.className = 'settings-body';

    for (const row of rows) {
        if (!row) continue;
        if (row.kind === 'font') { body.appendChild(_fontRow()); continue; }
        if (row.kind === 'note') {
            const n = document.createElement('div');
            n.className = 'settings-note';
            n.textContent = row.text || '';
            body.appendChild(n);
            continue;
        }
        // 'info' — read-only. ⚠️ textContent, never innerHTML: a class name is
        // teacher-entered text and this file is not the place to discover that.
        const wrap = document.createElement('div');
        wrap.className = 'settings-row';
        const lab = document.createElement('div');
        lab.className = 'settings-label';
        lab.textContent = row.label || '';
        const val = document.createElement('div');
        val.className = 'settings-value';
        // ⚠️ AN EMPTY VALUE SAYS SO RATHER THAN RENDERING A BLANK LINE. A child
        // with no class assigned should see that they have no class, not an
        // empty space that reads as a bug.
        val.textContent = (row.value === undefined || row.value === null || row.value === '')
            ? (row.empty || '\u2014') : String(row.value);
        if (!row.value) val.classList.add('settings-value-empty');
        // ⚠️ OPTIONAL CLICK-TO-COPY (v1.2.0). Added for the student ID, whose
        // corner stamp copied the FULL uid on click — eight characters are enough
        // to read aloud and not enough to paste into a console. `row.copy` holds
        // the long form; the row keeps showing the short one.
        if (row.copy) {
            val.dataset.copy = String(row.copy);
            val.title = String(row.copy) + ' (click to copy)';
            val.style.cursor = 'pointer';
            val.style.userSelect = 'all';
            val.onclick = () => {
                if (navigator.clipboard) navigator.clipboard.writeText(String(row.copy)).catch(() => {});
            };
        }
        wrap.appendChild(lab);
        wrap.appendChild(val);
        if (row.hint) {
            const hint = document.createElement('div');
            hint.className = 'settings-hint';
            hint.textContent = row.hint;
            wrap.appendChild(hint);
        }
        body.appendChild(wrap);
    }

    panel.appendChild(body);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    function close() {
        if (!_open) return;
        _open = null;
        try {
            document.removeEventListener('keydown', onKey, true);
            // ⚠️ REMOVED, NOT HIDDEN. See the Tab hazard block at the top.
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            // ⚠️ AND FOCUS GOES BACK. The element may have been torn down while
            // the panel was open (a lesson ending, an auth change).
            if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
        } catch (e) {
            console.warn('settings close: teardown failed:', e);
        } finally {
            // ═════════════════════════════════════════════════════════════════
            // ⚠️⚠️ onClose IS HOW A CALLER RESUMES WHAT IT PAUSED, AND IT IS THE
            // MOST SAFETY-CRITICAL LINE IN THIS FILE.
            // ═════════════════════════════════════════════════════════════════
            // learn.js stops School's graded clock when this opens. If this
            // callback does not fire, that clock never restarts and a child goes
            // on typing while NOTHING COUNTS — no error, no warning, a whole
            // lesson's minutes silently not credited. **That is strictly worse
            // than the problem the pause was added to solve.**
            //
            // ⚠️ THEREFORE: ONE close(), reached by all three dismiss paths (✕,
            // Esc, backdrop), and the resume sits in a `finally` so a throw in
            // the teardown above — a detached focus target, a listener a future
            // round adds — cannot swallow it. **Never give this dialog a second
            // exit that does not come through here.**
            try {
                if (typeof onClose === 'function') onClose();
            } catch (e) { console.warn('settings onClose failed:', e); }
        }
    }

    // ⚠️ CAPTURE PHASE. learn.js binds its drill handler to the keyboard element
    // and its step handlers to `document`; taking Esc in the capture phase means
    // this closes without those seeing the key at all.
    function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    }
    document.addEventListener('keydown', onKey, true);

    x.onclick = close;
    // Backdrop dismiss, but only on the backdrop itself — a click that lands on
    // the panel must not close it, or a mis-click while choosing a font does.
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    _open = close;
    return close;
}

// ⚠️ THE "Aa" IS THE AFFORDANCE, AND IT IS RENDERED IN THE CHOSEN FACE.
// learn.js v2.23.0 shipped this control as a bare label at 0.75rem in #777 and
// Jake asked whether the feature existed at all. It did. **A control nobody can
// find has not shipped**, and that is why there is a visibility floor asserted
// in tests/drill-filter-test.mjs rather than left to taste.
function _fontRow() {
    const wrap = document.createElement('div');
    wrap.id = 'drill-font-pick';
    wrap.className = 'settings-row';

    const lab = document.createElement('label');
    lab.className = 'settings-label';
    lab.setAttribute('for', 'drill-font-select');
    lab.textContent = 'Reading font';

    const line = document.createElement('div');
    line.className = 'settings-control';

    const aa = document.createElement('span');
    aa.className = 'dfp-aa';
    aa.setAttribute('aria-hidden', 'true');
    aa.textContent = 'Aa';

    const sel = document.createElement('select');
    sel.id = 'drill-font-select';
    for (const f of DRILL_FONTS) {
        const o = document.createElement('option');
        o.value = f[0];
        o.textContent = f[1];
        sel.appendChild(o);
    }
    sel.value = readDrillFont();
    // Each option reads in the face it names — the fastest possible label.
    sel.style.fontFamily = 'var(--drill-font)';

    sel.addEventListener('change', () => {
        const applied = applyDrillFont(sel.value);
        sel.value = applied;
        writeDrillFont(applied);
        sel.style.fontFamily = 'var(--drill-font)';
    });

    line.appendChild(aa);
    line.appendChild(sel);
    wrap.appendChild(lab);
    wrap.appendChild(line);
    return wrap;
}

// ⚠️ THE GEAR. Mouse-only and out of the tab order, per ROADMAP item 8's ruling.
// Returns the button so a caller can show and hide it; it does NOT decide when
// it is visible, because only the page controller knows what view is up.
export function buildSettingsButton(onOpen) {
    let btn = document.getElementById('menu-btn');
    if (btn) return btn;
    btn = document.createElement('button');
    btn.id = 'menu-btn';
    btn.type = 'button';
    btn.innerHTML = '&#9881;';
    btn.title = 'Settings';
    // ⚠️ SAME id AND SAME PLACE AS LIBRARY'S, so the two bars stay identical and
    // style.css v3.7.1's rule covers both without a second selector.
    btn.setAttribute('tabindex', '-1');
    btn.onclick = onOpen;
    return btn;
}
