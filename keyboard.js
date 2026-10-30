// keyboard.js — Shared keyboard renderer + hand guide
// Imported by both game.js and learn.js.
// keyboard.js v1.6.0
// v1.6.0 — ADVENTURE HAS ITS OWN CHOICE: HAND_GUIDE_ADV_MODES (off / human / skeleton) and
//          readHandGuideAdvCache / writeHandGuideAdvCache / handGuideAdvModeOf. Adventure has
//          no text column, so "beside the words" and "both" mean nothing there; what it needs
//          to choose is which HAND to draw. It is stored apart from the Classic/School choice
//          (own localStorage key, own account field handGuideAdv), so picking a hand in
//          Adventure never switches hands on in Classic. Never chosen → it FOLLOWS the
//          Classic choice: off stays off, anything else shows the skeleton.
//          The cache code is shared with the Classic choice (one reader, one writer).
// v1.5.0 — A SECOND ART: THE SKELETON. createSideHands(host, variant, art) takes an
//          optional third argument — hand-skeleton.js's HAND_SKELETON — and then draws
//          bones instead of the Classic hand. Library's Adventure view passes it; every
//          other caller passes nothing and gets exactly what it got before. The rest of
//          the API (setSideHandsToChar / clearSideHands / removeSideHands) is unchanged
//          and works on either art. The art is PASSED IN, never imported here, so
//          School and Classic never download the ~50KB skeleton.
// v1.4.1 — TIGHTER THUMB, CENTRED LETTER. The thumb's region now runs down the whole
//          thumb side of the hand — a vertical line continuing the index finger's edge —
//          so the thumb's base no longer lights when a FINGER is the target. That also
//          leaves the palm a clean shape, and the letter is placed at its MEASURED
//          centre (see SH_ANCHOR). No API change.
// v1.4.0 — NEW HAND DRAWING. The cartoon hand is replaced by a natural back-of-hand
//          silhouette by oksmith (public domain; credit and the one-outline-five-fingers
//          trick are explained at SH_SIL below). NO API CHANGE: createSideHands /
//          setSideHandsToChar / clearSideHands / removeSideHands, the .sh-finger /
//          .sh-palm / .sh-label hooks and the colours are exactly as before, so
//          learn.js, learn2.js, game.js and style.css are untouched.
// v1.3.0 — THE SIDE-HANDS CHOICE HAS ONE HOME. HAND_GUIDE_MODES (moved here from
//          settings-panel.js — Rule 9, a move not a copy) and the saved-choice
//          cache: readHandGuideCache / writeHandGuideCache / handGuideModeOf.
//          learn.js, learn2.js and game.js all store the choice the same way, in the
//          same localStorage key, so a setting made in School is already there in
//          Library. ⚠️ Pure localStorage — NO Firestore here. The page controllers
//          own the account copy (users/{uid}/profile/info.handGuide).
// v1.2.0 — SIDE HANDS. createSideHands / setSideHandsToChar / clearSideHands /
//          removeSideHands: two hands drawn beside the words and/or beside the
//          keyboard, the target finger lit in its FINGER_COLORS row colour and
//          the character (or SHIFT / SPACE) on the back of the hand. Built for
//          students who need far more than the sliding fingertip dot. ⚠️ NO
//          SECOND FINGER MAP: it asks getFingerInfo() and FINGER_COLORS, the same
//          as the keyboard overlay, so the two can never disagree. ⚠️ DOM-ONLY,
//          NOT FOCUSABLE (aria-hidden, pointer-events:none) — see the Tab hazard
//          in settings-panel.js.
// v1.1.1 — patch release; see KB_VERSION.
// v1.1.0 — fixes duplicate-ID bug (two keyboards in learn.html DOM),
//           all lookups now scoped to containerEl rather than document.
export const KB_VERSION = '1.6.0';

export const FINGER_COLORS = {
    'left-pinky':   '#FF69B4',
    'left-ring':    '#E53935',
    'left-middle':  '#FF9800',
    'left-index':   '#FDD835',
    'right-index':  '#43A047',
    'right-middle': '#1E88E5',
    'right-ring':   '#8E24AA',
    'right-pinky':  '#4FC3F7',
    'left-thumb':   '#FDD835',
    'right-thumb':  '#43A047',
};

export const FINGER_NAMES = [
    'left-pinky','left-ring','left-middle','left-index',
    'right-index','right-middle','right-ring','right-pinky'
];

export const LAYOUTS = {
    qwerty: {
        numRow:      ['`','1','2','3','4','5','6','7','8','9','0','-','='],
        numShiftRow: ['~','!','@','#','$','%','^','&','*','(',')','_','+'],
        rows:      [['q','w','e','r','t','y','u','i','o','p','[',']','\\'],
                    ['a','s','d','f','g','h','j','k','l',';',"\'"],
                    ['z','x','c','v','b','n','m',',','.','/']],
        shiftRows: [['Q','W','E','R','T','Y','U','I','O','P','{','}','|'],
                    ['A','S','D','F','G','H','J','K','L',':','"'],
                    ['Z','X','C','V','B','N','M','<','>','?']]
    },
    dvorak: {
        numRow:      ['`','1','2','3','4','5','6','7','8','9','0','[',']'],
        numShiftRow: ['~','!','@','#','$','%','^','&','*','(',')' ,'{','}'],
        rows:      [["\'",',','.','p','y','f','g','c','r','l','/','+','\\'],
                    ['a','o','e','u','i','d','h','t','n','s','-'],
                    [';','q','j','k','x','b','m','w','v','z']],
        shiftRows: [['"','<','>','P','Y','F','G','C','R','L','?','=','|'],
                    ['A','O','E','U','I','D','H','T','N','S','_'],
                    [':', 'Q','J','K','X','B','M','W','V','Z']]
    }
};

// ─── Internal scoped helpers ─────────────────────────────────────────────────
// All element lookups go through these — NEVER document.getElementById —
// so the right keyboard is always targeted when two keyboards share the DOM.

function _key(containerEl, charOrId) {
    if (!containerEl) return null;
    if (charOrId === ' ') return containerEl.querySelector('.key.space');
    const specials = ['ENTER','BACK','TAB','CAPS','SHIFT-L','SHIFT-R'];
    if (specials.includes(charOrId))
        return containerEl.querySelector('[id="key-' + charOrId + '"]')||null;
    // Regular key: data-char match is safe for any character
    return Array.from(containerEl.querySelectorAll('[data-char]')).find(k => k.dataset.char === charOrId)
        || containerEl.querySelector('[id="key-' + charOrId + '"]')||null;
}
function _svg(c)        { return c ? c.querySelector('#hg-svg')                   : null; }
function _overlay(c)    { return c ? c.querySelector('#hand-guide-overlay')       : null; }
function _finger(c, n)  { return c ? c.querySelector('#hg-finger-' + n)           : null; }

// ─── Keyboard ────────────────────────────────────────────────────────────────

export function createKeyboard(containerEl, layout) {
    layout = layout || 'qwerty';
    const L = LAYOUTS[layout] || LAYOUTS.qwerty;
    containerEl.innerHTML = '';

    function addKey(parent, char, shift, id, extraClass, width) {
        const k = document.createElement('div');
        k.className = 'key' + (extraClass ? ' ' + extraClass : '');
        if (char  !== null) k.dataset.char  = char;
        if (shift !== null) k.dataset.shift = shift;
        k.id = id || (char !== null ? 'key-' + char : '');
        if (width) k.style.width = width + 'px';
        return k;
    }

    const numDiv = document.createElement('div'); numDiv.className = 'kb-row';
    L.numRow.forEach(function(char, i) {
        const k = addKey(numDiv, char, L.numShiftRow[i], 'key-' + char, 'key-num');
        k.innerHTML = '<span class="num-symbol">' + escHtml(L.numShiftRow[i]) + '</span><span class="num-digit">' + escHtml(char) + '</span>';
        numDiv.appendChild(k);
    });
    const back = addKey(numDiv, null, null, 'key-BACK', 'wide', 53); back.textContent = 'BACK';
    numDiv.appendChild(back);
    containerEl.appendChild(numDiv);

    L.rows.forEach(function(rowChars, rIdx) {
        const rowDiv = document.createElement('div'); rowDiv.className = 'kb-row';
        if (rIdx === 0) { const t = addKey(rowDiv,null,null,'key-TAB',  'wide', 72);  t.textContent='TAB';   rowDiv.appendChild(t); }
        if (rIdx === 1) { const c = addKey(rowDiv,null,null,'key-CAPS', 'wide', 80);  c.textContent='CAPS';  rowDiv.appendChild(c); }
        if (rIdx === 2) { const s = addKey(rowDiv,null,null,'key-SHIFT-L','wide',100); s.textContent='SHIFT'; rowDiv.appendChild(s); }
        rowChars.forEach(function(char, cIdx) {
            const k = addKey(rowDiv, char, L.shiftRows[rIdx][cIdx], 'key-' + char, '');
            k.textContent = char;
            rowDiv.appendChild(k);
        });
        if (rIdx === 1) { const e = addKey(rowDiv,null,null,'key-ENTER', 'wide', 80); e.textContent='ENTER'; rowDiv.appendChild(e); }
        if (rIdx === 2) { const s = addKey(rowDiv,null,null,'key-SHIFT-R','wide',100); s.textContent='SHIFT'; rowDiv.appendChild(s); }
        containerEl.appendChild(rowDiv);
    });

    const spaceRow = document.createElement('div'); spaceRow.className = 'kb-row';
    const space = document.createElement('div'); space.className = 'key space'; space.id = 'key- ';
    spaceRow.appendChild(space); containerEl.appendChild(spaceRow);
}

export function toggleKeyboardCase(containerEl, isShift) {
    containerEl.querySelectorAll('.key').forEach(function(k) {
        if (k.classList.contains('key-num')) return;
        if (k.dataset.char) k.textContent = isShift ? k.dataset.shift : k.dataset.char;
        if (k.id === 'key-SHIFT-L' || k.id === 'key-SHIFT-R')
            isShift ? k.classList.add('shift-active') : k.classList.remove('shift-active');
    });
}

export function highlightKey(containerEl, char) {
    containerEl.querySelectorAll('.key').forEach(function(k) { k.classList.remove('target'); });
    const el = _key(containerEl, char);
    if (el) el.classList.add('target');
}

function escHtml(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Finger Map ──────────────────────────────────────────────────────────────

export function buildFingerMap(layout) {
    layout = layout || 'qwerty';
    const L = LAYOUTS[layout] || LAYOUTS.qwerty;
    const map = {};
    const numAssign = ['left-pinky','left-pinky','left-ring','left-middle','left-index','left-index',
                       'right-index','right-index','right-middle','right-ring','right-pinky','right-pinky','right-pinky'];
    L.numRow.forEach(function(char, i) {
        if (i >= numAssign.length) return;
        map[char] = { finger: numAssign[i], keyChar: char };
        if (L.numShiftRow[i]) map[L.numShiftRow[i]] = { finger: numAssign[i], keyChar: char, shift: true };
    });
    const assignments = [
        ['left-pinky','left-ring','left-middle','left-index','left-index','right-index','right-index','right-middle','right-ring','right-pinky','right-pinky','right-pinky','right-pinky'],
        ['left-pinky','left-ring','left-middle','left-index','left-index','right-index','right-index','right-middle','right-ring','right-pinky','right-pinky'],
        ['left-pinky','left-ring','left-middle','left-index','left-index','right-index','right-index','right-middle','right-ring','right-pinky'],
    ];
    L.rows.forEach(function(rowChars, rIdx) {
        const assign = assignments[rIdx]; if (!assign) return;
        rowChars.forEach(function(char, cIdx) {
            if (cIdx >= assign.length) return;
            map[char] = { finger: assign[cIdx], keyChar: char };
            if (L.shiftRows[rIdx] && L.shiftRows[rIdx][cIdx])
                map[L.shiftRows[rIdx][cIdx]] = { finger: assign[cIdx], keyChar: char, shift: true };
        });
    });
    map[' '] = { finger: 'thumb', keyChar: ' ' };
    map['\n'] = { finger: 'right-pinky', keyChar: 'ENTER' };
    map['\t'] = { finger: 'left-pinky',  keyChar: 'TAB' };
    return map;
}

export function getFingerInfo(fingerMap, char) {
    if (fingerMap[char]) return fingerMap[char];
    const lower = char.toLowerCase();
    if (lower !== char && fingerMap[lower]) return Object.assign({}, fingerMap[lower], { shift: true });
    return null;
}

// ─── Hand Guide ──────────────────────────────────────────────────────────────

export function getHomePositions(layout) {
    const r = (LAYOUTS[layout] || LAYOUTS.qwerty).rows[1];
    return {
        'left-pinky':  r[0], 'left-ring':   r[1], 'left-middle': r[2], 'left-index':  r[3],
        'right-index': r[6], 'right-middle':r[7], 'right-ring':  r[8], 'right-pinky': r[9],
    };
}

export function getKeyCenterInKB(containerEl, charOrId) {
    if (!containerEl) return null;
    const el = _key(containerEl, charOrId);
    if (!el) return null;
    const kbRect  = containerEl.getBoundingClientRect();
    const keyRect = el.getBoundingClientRect();
    return {
        x: keyRect.left - kbRect.left - containerEl.clientLeft + keyRect.width  / 2,
        y: keyRect.top  - kbRect.top  - containerEl.clientTop  + keyRect.height / 2,
    };
}

export function colorKeyboardKeys(containerEl, fingerMap, rainbow, singleColor) {
    rainbow     = (rainbow     === undefined) ? true     : rainbow;
    singleColor = (singleColor === undefined) ? '#4FC3F7' : singleColor;
    containerEl.querySelectorAll('.key').forEach(function(k) { k.style.backgroundColor = ''; });

    function fc(name) { return rainbow ? (FINGER_COLORS[name] || singleColor) : singleColor; }

    Object.entries(fingerMap).forEach(function(entry) {
        const char = entry[0], info = entry[1];
        if (!info.finger || info.shift || info.finger === 'thumb') return;
        const cid = (char === '\n') ? 'ENTER' : (char === '\t') ? 'TAB' : char;
        const el  = _key(containerEl, cid);
        if (el) el.style.backgroundColor = fc(info.finger) + '38';
    });

    const sp = _key(containerEl, ' ');
    if (sp) sp.style.backgroundColor = rainbow ? '#d0d0d0' : singleColor + '38';

    const lp = fc('left-pinky') + '38', rp = fc('right-pinky') + '38';
    function setColor(cid, color) { const k = _key(containerEl, cid); if (k) k.style.backgroundColor = color; }
    setColor('TAB','left-pinky' && lp);
    setColor('CAPS',    lp); setColor('SHIFT-L', lp);
    setColor('SHIFT-R', rp); setColor('ENTER',   rp); setColor('BACK', rp);
}

export function createHandGuide(containerEl, fingerMap, layout, rainbow, singleColor) {
    layout      = layout      || 'qwerty';
    rainbow     = (rainbow     === undefined) ? true     : rainbow;
    singleColor = (singleColor === undefined) ? '#4FC3F7' : singleColor;
    const old = _overlay(containerEl);
    if (old) old.remove();
    containerEl.style.position = 'relative';
    const overlay = document.createElement('div');
    overlay.id = 'hand-guide-overlay';
    overlay.innerHTML = '<svg id="hg-svg" xmlns="http://www.w3.org/2000/svg"></svg>';
    containerEl.appendChild(overlay);
    colorKeyboardKeys(containerEl, fingerMap, rainbow, singleColor);
    requestAnimationFrame(function() { buildFingerSVG(containerEl, fingerMap, layout, rainbow, singleColor); });
    return overlay;
}

export function buildFingerSVG(containerEl, fingerMap, layout, rainbow, singleColor) {
    layout      = layout      || 'qwerty';
    rainbow     = (rainbow     === undefined) ? true     : rainbow;
    singleColor = (singleColor === undefined) ? '#4FC3F7' : singleColor;
    const svg = _svg(containerEl);
    if (!svg) return;
    svg.innerHTML = '';
    // clientWidth/Height give layout dimensions unaffected by CSS transforms.
    // getKeyCenterInKB also uses getBoundingClientRect deltas relative to containerEl,
    // which match layout dimensions as long as no CSS transform sits on containerEl.
    // The intro keyboard in learn.html must NOT use transform:scale() for this reason.
    svg.setAttribute('width',   containerEl.clientWidth);
    svg.setAttribute('height',  containerEl.clientHeight);
    svg.setAttribute('viewBox', '0 0 ' + containerEl.clientWidth + ' ' + containerEl.clientHeight);

    const home = getHomePositions(layout);
    const R = 11;
    FINGER_NAMES.forEach(function(name) {
        const pos = getKeyCenterInKB(containerEl, home[name]);
        if (!pos) return;
        const fc = rainbow ? (FINGER_COLORS[name] || singleColor) : singleColor;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = 'hg-finger-' + name;
        g.classList.add('hg-finger-group');
        g.style.setProperty('--fc', fc);

        const body = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        body.classList.add('hg-body');
        body.setAttribute('x1', pos.x); body.setAttribute('y1', pos.y);
        body.setAttribute('x2', pos.x); body.setAttribute('y2', pos.y);
        body.setAttribute('stroke-width', R * 2); body.setAttribute('stroke-linecap', 'round');
        g.appendChild(body);

        const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circ.classList.add('hg-home');
        circ.setAttribute('cx', pos.x); circ.setAttribute('cy', pos.y); circ.setAttribute('r', R);
        g.appendChild(circ);

        const tip = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        tip.classList.add('hg-tip');
        tip.setAttribute('cx', pos.x); tip.setAttribute('cy', pos.y); tip.setAttribute('r', R);
        g.appendChild(tip);

        svg.appendChild(g);
    });
}

export function setHandGuideToChars(containerEl, fingerMap, layout, chars) {
    // Like setHandGuideToChar but activates multiple fingers simultaneously.
    // Resets all to home once, then stretches each target finger without re-resetting.
    const svg = _svg(containerEl);
    if (!svg) return;
    const home = getHomePositions(layout);

    // Reset all to home first
    FINGER_NAMES.forEach(function(name) {
        const g = _finger(containerEl, name);
        if (!g) return;
        g.classList.remove('hg-active', 'hg-shift-active');
        const pos = getKeyCenterInKB(containerEl, home[name]);
        if (!pos) return;
        const body = g.querySelector('.hg-body'), tip = g.querySelector('.hg-tip');
        if (body) { body.setAttribute('x1',pos.x); body.setAttribute('y1',pos.y); body.setAttribute('x2',pos.x); body.setAttribute('y2',pos.y); }
        if (tip)  { tip.setAttribute('cx',pos.x); tip.setAttribute('cy',pos.y); }
    });

    // Now activate each char's finger
    chars.forEach(function(char) {
        const info = getFingerInfo(fingerMap, char);
        if (!info || info.finger === 'thumb') return;
        const homePos   = getKeyCenterInKB(containerEl, home[info.finger]);
        const targetPos = getKeyCenterInKB(containerEl, info.keyChar);
        if (!homePos || !targetPos) return;
        const fg = _finger(containerEl, info.finger);
        if (fg) {
            const body = fg.querySelector('.hg-body'), tip = fg.querySelector('.hg-tip');
            if (body) { body.setAttribute('x1',homePos.x); body.setAttribute('y1',homePos.y); body.setAttribute('x2',targetPos.x); body.setAttribute('y2',targetPos.y); }
            if (tip)  { tip.setAttribute('cx',targetPos.x); tip.setAttribute('cy',targetPos.y); }
            fg.classList.add('hg-active');
        }
    });
}

export function setHandGuideToChar(containerEl, fingerMap, layout, char) {
    const svg = _svg(containerEl);
    if (!svg) return;
    const home = getHomePositions(layout);
    const info = getFingerInfo(fingerMap, char);

    FINGER_NAMES.forEach(function(name) {
        const g = _finger(containerEl, name);
        if (!g) return;
        g.classList.remove('hg-active', 'hg-shift-active');
        const pos = getKeyCenterInKB(containerEl, home[name]);
        if (!pos) return;
        const body = g.querySelector('.hg-body'), tip = g.querySelector('.hg-tip');
        if (body) { body.setAttribute('x1',pos.x); body.setAttribute('y1',pos.y); body.setAttribute('x2',pos.x); body.setAttribute('y2',pos.y); }
        if (tip)  { tip.setAttribute('cx',pos.x); tip.setAttribute('cy',pos.y); }
    });

    if (!info || info.finger === 'thumb') {
        const sp = _key(containerEl, ' ');
        if (sp && info && info.finger === 'thumb') sp.classList.add('space-active');
        return;
    }

    const homePos   = getKeyCenterInKB(containerEl, home[info.finger]);
    const targetPos = getKeyCenterInKB(containerEl, info.keyChar);
    if (!homePos || !targetPos) return;

    const fg = _finger(containerEl, info.finger);
    if (fg) {
        const body = fg.querySelector('.hg-body'), tip = fg.querySelector('.hg-tip');
        if (body) { body.setAttribute('x1',homePos.x); body.setAttribute('y1',homePos.y); body.setAttribute('x2',targetPos.x); body.setAttribute('y2',targetPos.y); }
        if (tip)  { tip.setAttribute('cx',targetPos.x); tip.setAttribute('cy',targetPos.y); }
        fg.classList.add('hg-active');
    }

    if (info.shift) {
        const shiftSide = info.finger.startsWith('left') ? 'right' : 'left';
        const shiftKey  = info.finger.startsWith('left') ? 'SHIFT-R' : 'SHIFT-L';
        const sg = _finger(containerEl, shiftSide + '-pinky');
        if (sg) {
            const shHome   = getKeyCenterInKB(containerEl, home[shiftSide + '-pinky']);
            const shTarget = getKeyCenterInKB(containerEl, shiftKey);
            if (shHome && shTarget) {
                const sb = sg.querySelector('.hg-body'), st = sg.querySelector('.hg-tip');
                if (sb) { sb.setAttribute('x1',shHome.x); sb.setAttribute('y1',shHome.y); sb.setAttribute('x2',shTarget.x); sb.setAttribute('y2',shTarget.y); }
                if (st) { st.setAttribute('cx',shTarget.x); st.setAttribute('cy',shTarget.y); }
            }
            sg.classList.add('hg-shift-active');
        }
    }
}

export function resetHandGuideToHome(containerEl, layout) {
    const svg = _svg(containerEl);
    if (!svg) return;
    const home = getHomePositions(layout);
    FINGER_NAMES.forEach(function(name) {
        const g = _finger(containerEl, name);
        if (!g) return;
        g.classList.remove('hg-active', 'hg-shift-active');
        const pos = getKeyCenterInKB(containerEl, home[name]);
        if (!pos) return;
        const body = g.querySelector('.hg-body'), tip = g.querySelector('.hg-tip');
        if (body) { body.setAttribute('x1',pos.x); body.setAttribute('y1',pos.y); body.setAttribute('x2',pos.x); body.setAttribute('y2',pos.y); }
        if (tip)  { tip.setAttribute('cx',pos.x); tip.setAttribute('cy',pos.y); }
    });
}

export function flashFingerPressed(containerEl) {
    const svg = _svg(containerEl);
    if (!svg) return;
    svg.querySelectorAll('.hg-active').forEach(function(g) {
        g.classList.add('hg-pressed');
        setTimeout(function() { g.classList.remove('hg-pressed'); }, 120);
    });
    const sp = _key(containerEl, ' ');
    if (sp && sp.classList.contains('space-active')) {
        sp.classList.add('space-pressed');
        setTimeout(function() { sp.classList.remove('space-pressed'); }, 120);
    }
}

// ─── Side hands ──────────────────────────────────────────────────────────────
// Two cartoon hands, back-of-hand view. Drawn ONCE as SVG DOM and recoloured on
// each character — no innerHTML churn per keystroke.
//
// Geometry is the LEFT hand (pinky far left, thumb right); the right hand is the
// same drawing mirrored. The label text sits OUTSIDE the mirror group so it is
// never drawn backwards.
const SH_NS      = 'http://www.w3.org/2000/svg';
const SH_NEUTRAL = '#d9dfe6';
const SH_LINE    = '#5b6b7b';
// ─── The hand drawing ───────────────────────────────────────────────────────
// ⚠️ ART CREDIT: "Back of hand" by oksmith (https://openclipart.org/artist/oksmith),
// Openclipart #334867, also on publicdomainq.net — PUBLIC DOMAIN, so no credit is
// required, but it is given here anyway; recorded so the next person knows where it
// came from and that it is safe to ship. It is a RIGHT hand, thumb on the left, one
// silhouette. The art below is ONLY geometry: the colours are ours.
//
// ⚠️ HOW ONE OUTLINE BECOMES FIVE LIGHTABLE FINGERS. The silhouette cannot be split,
// so it is drawn once as the palm and then once more over each finger and the thumb,
// each copy CLIPPED to that finger's region (SH_CLIPS). Lighting a finger recolours
// only its overlay; the outline, nails and wrinkles sit on top and never change.
// ⚠️ THE PALM IS UNDER THE FINGERS, so a lit palm shows only where no finger overlay
// covers it — which is exactly what we want, and why palm-first order matters.
// ⚠️ CLIP REGIONS ARE IN THE ICON'S OWN (right-hand) COORDINATES, cut along the webs
// between the fingers; the left hand is the same drawing mirrored, and the clips
// mirror with it because they live inside the mirrored group.
const SH_VIEW = [226, 263];
const SH_SIL = 'M130.454,1.789 L131.397,1.799 C141.741,2.343 140.108,14.318 140.651,20.853 C141.196,27.384 142.284,103.047 142.826,106.859 C143.373,110.67 149.362,112.845 150.994,109.037 C152.627,105.226 166.78,38.814 167.869,33.373 C168.955,27.927 171.678,18.673 178.756,20.306 C185.832,21.939 188.01,31.193 186.92,37.724 C185.832,44.259 174.944,111.215 174.944,113.935 C174.944,116.656 180.932,118.291 180.932,118.291 C180.932,118.291 193.998,98.15 196.174,93.248 C198.352,88.349 205.428,74.197 208.151,68.755 C210.871,63.31 215.227,57.322 220.67,60.043 C226.112,62.767 224.481,73.111 220.127,85.086 C215.77,97.058 201.619,134.619 199.987,140.065 C198.352,145.508 193.996,177.875 192.909,184.953 C191.819,192.028 188.182,217.039 179.299,232.856 C176.002,238.723 170.045,252.996 171.135,261.703 L90.025,261.16 C90.025,261.16 87.848,245.375 82.947,239.387 C78.049,233.399 57.365,216.524 54.642,210.535 C51.92,204.547 39.4,172.973 29.059,160.453 C18.717,147.936 1.297,140.315 1.297,137.592 C1.297,134.871 11.096,120.72 27.971,128.883 C44.846,137.051 49.199,144.127 51.377,147.393 C53.555,150.658 60.088,158.278 65.529,159.367 C70.975,160.453 74.24,156.645 74.783,153.381 C75.328,150.115 78.049,124.277 77.506,121.556 C76.961,118.834 67.709,45.349 68.252,35.548 C68.795,25.75 68.795,18.673 76.416,18.127 C84.037,17.584 87.85,27.384 90.025,35.548 C92.203,43.713 106.355,110.125 106.355,110.125 C106.355,110.125 112.346,112.845 113.978,109.037 C115.612,105.226 119.965,20.306 119.965,17.584 C120.161,12.24 121.498,5.751 126.502,2.82 C127.982,1.954 128.887,1.979 130.454,1.789 z';
const SH_OUTLINE = 'M90.025,261.16 C90.025,261.16 87.848,245.375 82.947,239.387 C78.049,233.399 57.365,216.524 54.642,210.535 C51.92,204.547 39.4,172.973 29.059,160.453 C18.717,147.936 1.297,140.315 1.297,137.592 C1.297,134.871 11.096,120.72 27.971,128.883 C44.846,137.051 49.199,144.127 51.377,147.393 C53.555,150.658 60.088,158.278 65.529,159.367 C70.975,160.453 74.24,156.645 74.783,153.381 C75.328,150.115 78.049,124.277 77.506,121.556 C76.961,118.834 67.709,45.349 68.252,35.548 C68.795,25.75 68.795,18.673 76.416,18.127 C84.037,17.584 87.85,27.384 90.025,35.548 C92.203,43.713 106.355,110.125 106.355,110.125 C106.355,110.125 112.346,112.845 113.978,109.037 C115.612,105.226 119.965,20.306 119.965,17.584 C119.965,14.863 121.055,1.255 131.397,1.799 C141.741,2.343 140.108,14.318 140.651,20.853 C141.196,27.384 142.284,103.047 142.826,106.859 C143.373,110.67 149.362,112.845 150.994,109.037 C152.627,105.226 166.78,38.814 167.869,33.373 C168.955,27.927 171.678,18.673 178.756,20.306 C185.832,21.939 188.01,31.193 186.92,37.724 C185.832,44.259 174.944,111.215 174.944,113.935 C174.944,116.656 180.932,118.291 180.932,118.291 C180.932,118.291 193.998,98.15 196.174,93.248 C198.352,88.349 205.428,74.197 208.151,68.755 C210.871,63.31 215.227,57.322 220.67,60.043 C226.112,62.767 224.481,73.111 220.127,85.086 C215.77,97.058 201.619,134.619 199.987,140.065 C198.352,145.508 193.996,177.875 192.909,184.953 C191.819,192.028 188.182,217.039 179.299,232.856 C176.002,238.723 170.045,252.996 171.135,261.703';
const SH_NAILS = [
    'M70.279,26.703 C70.279,26.703 71.801,37.99 73.539,38.427 C75.279,38.859 78.975,37.338 80.713,37.338 C82.451,37.338 85.494,37.338 85.713,36.685 C85.93,36.033 85.545,28.509 85.277,25.834 C84.842,21.486 81.363,17.574 75.932,18.009 C70.498,18.443 70.06,24.31 70.279,26.703',
    'M170.852,28.671 C170.852,28.671 169.076,38.826 170.649,39.689 C172.219,40.552 176.18,40.021 177.862,40.461 C179.545,40.906 182.487,41.679 182.864,41.105 C183.239,40.529 185.155,34.306 185.576,31.65 C186.264,27.336 183.897,22.668 178.53,21.701 C173.164,20.74 171.248,26.304 170.852,28.671',
    'M212.315,64.748 C212.315,64.748 209.584,73.068 210.674,73.9 C211.764,74.728 214.819,74.767 216.039,75.291 C217.264,75.816 219.401,76.732 219.748,76.339 C220.098,75.947 222.494,70.611 223.114,68.65 C224.116,65.466 222.848,61.67 218.901,60.341 C214.955,59.009 212.881,63.002 212.315,64.748',
    'M1.471,137.752 C1.471,137.752 4.728,128.531 9.268,130.474 C13.807,132.424 23.092,136.346 21.795,138.291 C20.498,140.237 16.931,144.774 16.283,147.369 C15.635,149.963 1.471,137.752 1.471,137.752',
    'M12.803,145.405 C12.803,145.405 15.07,138.057 20.58,137.842 C20.58,137.842 20.799,138.274 20.472,138.705 C20.15,139.135 17.018,143.565 15.611,147.133 L12.803,145.405',
    'M74.394,37.886 C74.394,37.886 78.824,36.588 80.013,36.588 C81.203,36.588 85.201,36.265 85.201,36.265 C85.201,36.265 81.959,32.482 79.041,32.697 C76.123,32.914 74.178,35.185 74.394,37.886',
    'M170.676,38.209 C170.676,38.209 170.567,39.398 172.08,39.398 C173.592,39.398 179.104,39.83 180.401,40.369 C181.698,40.912 182.237,41.236 182.455,40.588 C182.67,39.937 180.834,36.478 177.375,36.048 C173.918,35.617 170.893,37.886 170.676,38.209',
    'M210.981,72.353 C210.981,72.353 210.549,73.545 211.737,73.652 C212.924,73.759 215.737,74.302 216.924,74.951 C218.112,75.595 218.76,76.029 219.303,75.49 C219.842,74.951 219.194,72.572 216.6,71.384 C214.006,70.193 210.981,72.353 210.981,72.353',
    'M123.245,9.347 C123.245,9.347 122.725,20.724 124.358,21.465 C125.993,22.201 129.9,21.364 131.611,21.675 C133.321,21.985 136.315,22.529 136.647,21.926 C136.977,21.323 137.942,13.852 138.157,11.172 C138.505,6.816 135.782,2.345 130.36,1.803 C124.936,1.259 123.457,6.954 123.245,9.347',
    'M125.296,21.086 C125.296,21.086 129.886,20.599 131.057,20.812 C132.227,21.024 136.218,21.422 136.218,21.422 C136.218,21.422 133.704,17.12 130.795,16.81 C127.885,16.502 125.565,18.389 125.296,21.086',
];
const SH_WRINKLES = [
    'M70.279,26.703 C70.279,26.703 71.801,37.99 73.539,38.427 C75.279,38.859 78.975,37.338 80.713,37.338 C82.451,37.338 85.494,37.338 85.713,36.685 C85.93,36.033 85.545,28.509 85.277,25.834 C84.842,21.486 81.363,17.574 75.932,18.009 C70.498,18.443 70.06,24.31 70.279,26.703 z M122.862,10.185 C122.862,10.185 122.971,21.177 124.655,21.795 C126.338,22.41 130.172,21.287 131.901,21.474 C133.631,21.658 136.657,21.982 136.944,21.353 C137.227,20.732 137.852,13.599 137.869,10.91 C137.899,6.541 134.854,2.283 129.405,2.14 C123.955,1.996 122.901,7.783 122.862,10.185 z',
    'M170.852,28.671 C170.852,28.671 169.076,38.826 170.649,39.689 C172.219,40.552 176.18,40.021 177.862,40.461 C179.545,40.906 182.487,41.679 182.864,41.105 C183.239,40.529 185.155,34.306 185.576,31.65 C186.264,27.336 183.897,22.668 178.53,21.701 C173.164,20.74 171.248,26.304 170.852,28.671 z',
    'M212.315,64.748 C212.315,64.748 209.584,73.068 210.674,73.9 C211.764,74.728 214.819,74.767 216.039,75.291 C217.264,75.816 219.401,76.732 219.748,76.339 C220.098,75.947 222.494,70.611 223.114,68.65 C224.116,65.466 222.848,61.67 218.901,60.341 C214.955,59.009 212.881,63.002 212.315,64.748 z M75.713,50.396 C75.713,50.396 82.451,47.789 87.232,48.658 M78.539,53.222 C78.539,53.222 82.018,52.57 84.625,52.138 M78.975,78.22 C78.975,78.22 89.842,75.611 92.668,75.828 M81.799,83.002 C81.799,83.002 87.451,81.045 89.842,80.392 M124.405,32.789 C124.405,32.789 133.1,32.357 136.362,33.443 M127.881,36.486 C127.881,36.486 131.36,36.701 133.752,36.701 M122.883,64.525 C122.883,64.525 130.272,63.22 135.709,64.525 M125.926,69.091 C125.926,69.091 129.619,69.306 132.229,69.091 M168.965,49.529 C168.965,49.529 175.053,49.529 178.748,50.83 M170.705,53.222 C170.705,53.222 175.268,54.091 177.444,54.091 M164.401,72.351 C164.401,72.351 170.922,72.568 176.139,74.525 M164.619,77.132 C164.619,77.132 170.705,77.785 174.182,78.654 M207.006,81.263 C207.006,81.263 212.659,82.349 217.002,84.959 M208.526,85.83 L213.092,87.783 M199.397,99.088 C199.397,99.088 205.049,101.912 208.311,103 M197.44,103 C197.44,103 200.92,105.392 205.483,106.695 M88.756,112.564 C88.756,112.564 91.365,119.084 89.627,121.908 C87.885,124.736 89.627,130.172 89.627,130.822 M131.36,106.478 C131.36,106.478 131.795,111.478 132.664,113.65 C133.534,115.824 133.1,122.129 133.1,123.65 M162.227,130.822 C162.227,130.822 163.53,125.822 163.53,122.129 M187.225,140.387 C187.225,140.387 189.616,136.039 190.049,135.389',
    'M1.471,137.752 C1.471,137.752 4.728,128.531 9.268,130.474 C13.807,132.424 23.092,136.346 21.795,138.291 C20.498,140.237 16.931,144.774 16.283,147.369 C15.635,149.963 1.471,137.752 1.471,137.752 z M25.336,155.664 C25.336,155.664 28.9,148.858 32.467,147.237 M28.254,157.61 L31.818,152.1 M91.361,140.108 C92.656,143.133 94.818,145.295 94.818,147.889 C94.818,150.483 96.115,154.373 96.978,159.125',
    'M71.045,216.613 C71.045,216.613 79.475,221.149 85.309,223.094 C91.143,225.043 95.033,235.418 96.978,242.547',
    'M123.245,9.347 C123.245,9.347 122.725,20.724 124.358,21.465 C125.993,22.201 129.9,21.364 131.611,21.675 C133.321,21.985 136.315,22.529 136.647,21.926 C136.977,21.323 137.942,13.852 138.157,11.172 C138.505,6.816 135.782,2.345 130.36,1.803 C124.936,1.259 123.457,6.954 123.245,9.347 z',
];
const SH_CLIPS = {
    thumb:  '-10,123 77.8,123 76,153 76,300 -10,300',
    index:  '60,-5 60,124 110,111 110,-5',
    middle: '110,-5 110,111 147,109 147,-5',
    ring:   '147,-5 147,109 178,116 213,-5',
    pinky:  '213,-5 178,116 207,128 240,128 240,-5',
};
// Where the big letter goes (palm centre), per hand, in final (post-mirror) coordinates.
// ⚠️ MEASURED, NOT GUESSED: the lit palm is the silhouette minus the five clip regions,
// rasterised and measured — x 76..204, y 109..262 in icon coordinates; its centroid is
// (134, 183) and its widest point (135, 169). Letter at x 135 (mirrored for the left hand
// → 226-135 = 91), y 180 between the two. Move a CLIP and these must be re-measured.
const SH_ANCHOR = { left: [91, 180], right: [135, 180] };
let _shUid = 0;   // every hand needs its own clipPath ids: copies must not borrow the first one's

function _shEl(tag, attrs, parent) {
    const e = document.createElementNS(SH_NS, tag);
    Object.keys(attrs || {}).forEach(function(k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
}

function _buildSideHand(side) {
    const uid = ++_shUid;
    const svg = _shEl('svg', { 'class': 'sh-hand', 'data-side': side,
        viewBox: '0 0 ' + SH_VIEW[0] + ' ' + SH_VIEW[1], 'aria-hidden': 'true', focusable: 'false' });
    const defs = _shEl('defs', {}, svg);
    Object.keys(SH_CLIPS).forEach(function(name) {
        const cp = _shEl('clipPath', { id: 'sh-clip-' + name + '-' + uid }, defs);
        _shEl('polygon', { points: SH_CLIPS[name] }, cp);
    });
    // The art is a RIGHT hand; the left hand is its mirror image.
    const g = _shEl('g', side === 'left' ? { transform: 'translate(' + SH_VIEW[0] + ',0) scale(-1,1)' } : {}, svg);
    _shEl('path', { 'class': 'sh-palm', d: SH_SIL, fill: SH_NEUTRAL }, g);
    ['thumb', 'index', 'middle', 'ring', 'pinky'].forEach(function(name) {
        _shEl('path', { 'class': 'sh-finger', 'data-finger': name, d: SH_SIL, fill: SH_NEUTRAL,
            'clip-path': 'url(#sh-clip-' + name + '-' + uid + ')' }, g);
    });
    SH_NAILS.forEach(function(d) { _shEl('path', { d: d, fill: '#fff', 'fill-opacity': 0.6 }, g); });
    SH_WRINKLES.forEach(function(d) {
        _shEl('path', { d: d, fill: 'none', stroke: '#000', 'stroke-opacity': 0.28, 'stroke-width': 1.8,
            'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    });
    _shEl('path', { d: SH_OUTLINE, fill: 'none', stroke: SH_LINE, 'stroke-width': 4,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    // The label is OUTSIDE the mirror group so it is never drawn backwards.
    const lab = _shEl('text', { 'class': 'sh-label', x: SH_ANCHOR[side][0], y: SH_ANCHOR[side][1],
        'text-anchor': 'middle', 'dominant-baseline': 'central' }, svg);
    lab.textContent = '';
    return svg;
}

// ─── Skeleton art (Library's Adventure view) ────────────────────────────────
// The art arrives as DATA (hand-skeleton.js). Each bone is its own <path> tagged with the
// finger it belongs to; lighting repaints the bones of one finger. ⚠️ See hand-skeleton.js
// for how the 145 bones were sorted into fingers and why.
// Darken (k < 1) a '#rrggbb' colour: the shadow bones stay shadows when a finger is lit.
function _shShade(hex, k) {
    const h = hex.replace('#', '');
    const c = [0, 2, 4].map(function(i) { return Math.max(0, Math.min(255, Math.round(parseInt(h.substr(i, 2), 16) * k))); });
    return '#' + c.map(function(v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('');
}

function _buildSkeletonHand(side, art) {
    const v = art.view;                       // minX, minY, width, height
    const svg = _shEl('svg', { 'class': 'sh-hand sh-skel-hand', 'data-side': side, 'data-art': 'skeleton',
        viewBox: v.join(' '), 'aria-hidden': 'true', focusable: 'false' });
    svg.style.setProperty('--sh-u', art.unit);            // scales the label type to this art's units
    // The art is a RIGHT hand; the left hand is its mirror image, about the viewBox's own centre.
    const g = _shEl('g', side === 'left' ? { transform: 'translate(' + (2 * v[0] + v[2]) + ',0) scale(-1,1)' } : {}, svg);
    const rays = {};
    art.bones.forEach(function(b) {
        const el = _shEl('path', { d: b[3], fill: '#' + b[1], stroke: '#' + b[1] }, g);
        if (b[0] !== 'line') {                // 'line' is the hair-thin edge drawing: never recoloured
            el.setAttribute('data-ray', b[0]);
            el.__rest = '#' + b[1];
            el.__k = b[2];
            (rays[b[0]] = rays[b[0]] || []).push(el);
        }
    });
    svg.__rays = rays;
    // The label is OUTSIDE the mirror group so it is never drawn backwards.
    const ax = side === 'left' ? (2 * v[0] + v[2]) - art.anchor[0] : art.anchor[0];
    const lab = _shEl('text', { 'class': 'sh-label', x: ax, y: art.anchor[1],
        'text-anchor': 'middle', 'dominant-baseline': 'central' }, svg);
    lab.textContent = '';
    return svg;
}

function _shPaintRay(hand, ray, color) {      // color === null puts the ray back to bone
    (hand.__rays[ray] || []).forEach(function(el) {
        const c = color ? _shShade(color, el.__k) : el.__rest;
        el.setAttribute('fill', c);
        el.setAttribute('stroke', c);
    });
}

function _sideHandsPair(hostEl) { return hostEl ? hostEl.querySelector(':scope > .sh-pair') : null; }
function _sideHand(hostEl, side) {
    const pair = _sideHandsPair(hostEl);
    return pair ? pair.querySelector('.sh-hand[data-side="' + side + '"]') : null;
}

// variant: 'text' (beside the words) or 'kb' (beside the keyboard) — CSS only.
// art: OPTIONAL — hand-skeleton.js's HAND_SKELETON to draw bones; omit for the Classic hand.
export function createSideHands(hostEl, variant, art) {
    if (!hostEl) return null;
    removeSideHands(hostEl);
    const pair = document.createElement('div');
    pair.className = 'sh-pair sh-' + (variant || 'text') + (art ? ' sh-skel' : '');
    pair.setAttribute('aria-hidden', 'true');
    const build = art ? function(side) { return _buildSkeletonHand(side, art); } : _buildSideHand;
    pair.appendChild(build('left'));
    pair.appendChild(build('right'));
    hostEl.appendChild(pair);
    return pair;
}

export function removeSideHands(hostEl) {
    const pair = _sideHandsPair(hostEl);
    if (pair) pair.remove();
}

function _shLight(hand, fingerName, color, label) {
    if (!hand) return;
    if (hand.__rays) {                        // skeleton: repaint this finger's bones and the palm's
        _shPaintRay(hand, fingerName, color);
        _shPaintRay(hand, 'palm', color);
    } else {
        const f = hand.querySelector('.sh-finger[data-finger="' + fingerName + '"]');
        if (f) f.setAttribute('fill', color);
        const palm = hand.querySelector('.sh-palm');
        if (palm) palm.setAttribute('fill', color);
    }
    const t = hand.querySelector('.sh-label');
    if (t) {
        t.textContent = label;
        // one character is BIG; a word (SHIFT, SPACE, ENTER, TAB) is smaller
        t.setAttribute('class', 'sh-label ' + (label.length > 1 ? 'sh-label-word' : 'sh-label-char'));
    }
}

export function clearSideHands(hostEl) {
    ['left', 'right'].forEach(function(side) {
        const hand = _sideHand(hostEl, side);
        if (!hand) return;
        if (hand.__rays) {
            Object.keys(hand.__rays).forEach(function(r) { _shPaintRay(hand, r, null); });
        } else {
            hand.querySelectorAll('.sh-finger').forEach(function(f) { f.setAttribute('fill', SH_NEUTRAL); });
            const palm = hand.querySelector('.sh-palm');
            if (palm) palm.setAttribute('fill', SH_NEUTRAL);
        }
        const t = hand.querySelector('.sh-label');
        if (t) { t.textContent = ''; t.setAttribute('class', 'sh-label'); }
    });
}

// Light the hand(s) for `ch`. Uses the SAME fingerMap the keyboard overlay uses.
export function setSideHandsToChar(hostEl, fingerMap, ch) {
    if (!_sideHandsPair(hostEl)) return;
    clearSideHands(hostEl);
    const info = getFingerInfo(fingerMap, ch);
    if (!info) return;

    if (info.finger === 'thumb') {            // space bar — either thumb, show both
        _shLight(_sideHand(hostEl, 'left'),  'thumb', FINGER_COLORS['left-thumb'],  'SPACE');
        _shLight(_sideHand(hostEl, 'right'), 'thumb', FINGER_COLORS['right-thumb'], 'SPACE');
        return;
    }
    const parts = info.finger.split('-');     // e.g. ['left','index']
    const label = ch === '\n' ? 'ENTER' : ch === '\t' ? 'TAB' : ch;
    _shLight(_sideHand(hostEl, parts[0]), parts[1], FINGER_COLORS[info.finger], label);

    if (info.shift) {                         // the OPPOSITE pinky holds Shift
        const other = parts[0] === 'left' ? 'right' : 'left';
        _shLight(_sideHand(hostEl, other), 'pinky', FINGER_COLORS[other + '-pinky'], 'SHIFT');
    }
}

// ─── Side-hands choice: vocabulary and local cache ───────────────────────────
// ⚠️ The KEYS are what every page stores — in localStorage and in
// users/{uid}/profile/info.handGuide — so renaming one orphans every saved choice.
export const HAND_GUIDE_MODES = [
    // key,    label
    ['off',  'Off'],
    ['text', 'Beside the words'],
    ['keys', 'Beside the keyboard'],
    ['both', 'Both'],
];

export function normalizeHandGuideMode(m) {
    return HAND_GUIDE_MODES.some(function(x) { return x[0] === m; }) ? m : 'off';
}

export const HAND_GUIDE_KEY = 'ttb_handGuide_v1';
const HAND_GUIDE_MS = 7 * 24 * 3600 * 1000;

// One reader and one writer for BOTH choices (Classic/School and Adventure).
// ⚠️ THE UID STAMP IS NOT DECORATION: a shared Chromebook must not show the last child's
// choice to the next one. Signed-out visitors use uid ''. Returns the mode, or null when
// there is no fresh entry (never set on this machine, older than a week, or another student's).
function _shReadCache(key, modes, uid) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const c = JSON.parse(raw);
        if (c.uid !== (uid || '')) return null;
        if ((Date.now() - c.at) > HAND_GUIDE_MS) return null;
        return modes.some(function(x) { return x[0] === c.mode; }) ? c.mode : null;
    } catch (_) { return null; }
}
function _shWriteCache(key, modes, uid, mode) {
    try {
        const m = modes.some(function(x) { return x[0] === mode; }) ? mode : modes[0][0];   // modes[0] is 'off'
        localStorage.setItem(key, JSON.stringify({ at: Date.now(), uid: uid || '', mode: m }));
    } catch (_) { /* private mode — the choice just won't be remembered */ }
}

export function readHandGuideCache(uid) { return _shReadCache(HAND_GUIDE_KEY, HAND_GUIDE_MODES, uid); }
export function writeHandGuideCache(uid, mode) { _shWriteCache(HAND_GUIDE_KEY, HAND_GUIDE_MODES, uid, mode); }
export function handGuideModeOf(uid) { return readHandGuideCache(uid) || 'off'; }

// ─── Adventure's own choice ──────────────────────────────────────────────────
// ⚠️ The KEYS are stored (localStorage and users/{uid}/profile/info.handGuideAdv) — never rename one.
export const HAND_GUIDE_ADV_MODES = [
    // key,       label
    ['off',      'Off'],
    ['human',    'Human hand'],
    ['skeleton', 'Skeleton hand'],
];
export const HAND_GUIDE_ADV_KEY = 'ttb_handGuideAdv_v1';
export function readHandGuideAdvCache(uid) { return _shReadCache(HAND_GUIDE_ADV_KEY, HAND_GUIDE_ADV_MODES, uid); }
export function writeHandGuideAdvCache(uid, mode) { _shWriteCache(HAND_GUIDE_ADV_KEY, HAND_GUIDE_ADV_MODES, uid, mode); }
// Never chosen in Adventure → follow the Classic choice: off stays off, anything else is the skeleton.
export function handGuideAdvModeOf(uid) {
    return readHandGuideAdvCache(uid) || (handGuideModeOf(uid) === 'off' ? 'off' : 'skeleton');
}
