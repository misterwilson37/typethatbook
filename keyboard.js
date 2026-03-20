// keyboard.js — Shared keyboard renderer + hand guide
// Imported by both game.js and learn.js.
// v1.1.0 — fixes duplicate-ID bug (two keyboards in learn.html DOM),
//           all lookups now scoped to containerEl rather than document.
export const KB_VERSION = '1.1.1';

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
