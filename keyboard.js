// keyboard.js — Shared keyboard renderer + hand guide
// Imported by both game.js and learn.js.
// v1.0.0

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
                    ['a','s','d','f','g','h','j','k','l',';',"'"],
                    ['z','x','c','v','b','n','m',',','.','/']],
        shiftRows: [['Q','W','E','R','T','Y','U','I','O','P','{','}','|'],
                    ['A','S','D','F','G','H','J','K','L',':','"'],
                    ['Z','X','C','V','B','N','M','<','>','?']]
    },
    dvorak: {
        numRow:      ['`','1','2','3','4','5','6','7','8','9','0','[',']'],
        numShiftRow: ['~','!','@','#','$','%','^','&','*','(',')' ,'{','}'],
        rows:      [["'",',','.','p','y','f','g','c','r','l','/','+','\\'],
                    ['a','o','e','u','i','d','h','t','n','s','-'],
                    [';','q','j','k','x','b','m','w','v','z']],
        shiftRows: [['"','<','>','P','Y','F','G','C','R','L','?','=','|'],
                    ['A','O','E','U','I','D','H','T','N','S','_'],
                    [':', 'Q','J','K','X','B','M','W','V','Z']]
    }
};

// ─── Keyboard ────────────────────────────────────────────────────────────────

export function createKeyboard(containerEl, layout = 'qwerty') {
    const L = LAYOUTS[layout] || LAYOUTS.qwerty;
    containerEl.innerHTML = '';

    function addKey(parent, char, shift, id, extraClass, width) {
        const k = document.createElement('div');
        k.className = 'key' + (extraClass ? ' ' + extraClass : '');
        if (char !== null) k.dataset.char = char;
        if (shift !== null) k.dataset.shift = shift;
        k.id = id || (char !== null ? `key-${char}` : '');
        if (width) k.style.width = width + 'px';
        return k;
    }

    // Number row
    const numDiv = document.createElement('div'); numDiv.className = 'kb-row';
    L.numRow.forEach((char, i) => {
        const k = addKey(numDiv, char, L.numShiftRow[i], `key-${char}`, 'key-num');
        k.innerHTML = `<span class="num-symbol">${escHtml(L.numShiftRow[i])}</span><span class="num-digit">${escHtml(char)}</span>`;
        numDiv.appendChild(k);
    });
    const back = addKey(numDiv, null, null, 'key-BACK', 'wide', 53); back.textContent = 'BACK';
    numDiv.appendChild(back);
    containerEl.appendChild(numDiv);

    // Letter rows
    L.rows.forEach((rowChars, rIdx) => {
        const rowDiv = document.createElement('div'); rowDiv.className = 'kb-row';
        if (rIdx === 0) { const t = addKey(rowDiv,null,null,'key-TAB','wide',72); t.textContent='TAB'; rowDiv.appendChild(t); }
        if (rIdx === 1) { const c = addKey(rowDiv,null,null,'key-CAPS','wide',80); c.textContent='CAPS'; rowDiv.appendChild(c); }
        if (rIdx === 2) { const s = addKey(rowDiv,null,null,'key-SHIFT-L','wide',100); s.textContent='SHIFT'; rowDiv.appendChild(s); }
        rowChars.forEach((char, cIdx) => {
            const k = addKey(rowDiv, char, L.shiftRows[rIdx][cIdx], `key-${char}`, '');
            k.textContent = char;
            rowDiv.appendChild(k);
        });
        if (rIdx === 1) { const e = addKey(rowDiv,null,null,'key-ENTER','wide',80); e.textContent='ENTER'; rowDiv.appendChild(e); }
        if (rIdx === 2) { const s = addKey(rowDiv,null,null,'key-SHIFT-R','wide',100); s.textContent='SHIFT'; rowDiv.appendChild(s); }
        containerEl.appendChild(rowDiv);
    });

    // Space row
    const spaceRow = document.createElement('div'); spaceRow.className = 'kb-row';
    const space = document.createElement('div'); space.className = 'key space'; space.id = 'key- ';
    spaceRow.appendChild(space); containerEl.appendChild(spaceRow);
}

export function toggleKeyboardCase(containerEl, isShift) {
    containerEl.querySelectorAll('.key').forEach(k => {
        if (k.classList.contains('key-num')) return;
        if (k.dataset.char) k.textContent = isShift ? k.dataset.shift : k.dataset.char;
        if (k.id === 'key-SHIFT-L' || k.id === 'key-SHIFT-R') {
            isShift ? k.classList.add('shift-active') : k.classList.remove('shift-active');
        }
    });
}

export function highlightKey(containerEl, char, needsShift = false) {
    containerEl.querySelectorAll('.key').forEach(k => k.classList.remove('target'));
    let el = null;
    if (char === ' ') el = containerEl.querySelector('#key-\\ ') || document.getElementById('key- ');
    else if (char === '\t') el = document.getElementById('key-TAB');
    else if (char === '\n') el = document.getElementById('key-ENTER');
    else {
        const all = Array.from(containerEl.querySelectorAll('.key'));
        el = all.find(k => k.dataset.char === char || k.dataset.shift === char) || null;
    }
    if (el) el.classList.add('target');
    toggleKeyboardCase(containerEl, needsShift);
}

function escHtml(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Finger Map ──────────────────────────────────────────────────────────────

export function buildFingerMap(layout = 'qwerty') {
    const L = LAYOUTS[layout] || LAYOUTS.qwerty;
    const map = {};

    const numAssign = ['left-pinky','left-pinky','left-ring','left-middle','left-index','left-index',
                       'right-index','right-index','right-middle','right-ring','right-pinky','right-pinky','right-pinky'];
    L.numRow.forEach((char, i) => {
        if (i >= numAssign.length) return;
        map[char] = { finger: numAssign[i], keyChar: char };
        if (L.numShiftRow[i]) map[L.numShiftRow[i]] = { finger: numAssign[i], keyChar: char, shift: true };
    });

    const assignments = [
        ['left-pinky','left-ring','left-middle','left-index','left-index','right-index','right-index','right-middle','right-ring','right-pinky','right-pinky','right-pinky','right-pinky'],
        ['left-pinky','left-ring','left-middle','left-index','left-index','right-index','right-index','right-middle','right-ring','right-pinky','right-pinky'],
        ['left-pinky','left-ring','left-middle','left-index','left-index','right-index','right-index','right-middle','right-ring','right-pinky'],
    ];
    L.rows.forEach((rowChars, rIdx) => {
        const assign = assignments[rIdx]; if (!assign) return;
        rowChars.forEach((char, cIdx) => {
            if (cIdx >= assign.length) return;
            map[char] = { finger: assign[cIdx], keyChar: char };
            if (L.shiftRows[rIdx]?.[cIdx]) map[L.shiftRows[rIdx][cIdx]] = { finger: assign[cIdx], keyChar: char, shift: true };
        });
    });
    map[' '] = { finger: 'thumb', keyChar: ' ' };
    map['\n'] = { finger: 'right-pinky', keyChar: 'ENTER' };
    map['\t'] = { finger: 'left-pinky', keyChar: 'TAB' };
    return map;
}

export function getFingerInfo(fingerMap, char) {
    if (fingerMap[char]) return fingerMap[char];
    const lower = char.toLowerCase();
    if (lower !== char && fingerMap[lower]) return { ...fingerMap[lower], shift: true };
    return null;
}

// ─── Hand Guide ──────────────────────────────────────────────────────────────

export function getHomePositions(layout = 'qwerty') {
    const r = (LAYOUTS[layout] || LAYOUTS.qwerty).rows[1];
    return {
        'left-pinky': r[0],  'left-ring': r[1],  'left-middle': r[2],  'left-index': r[3],
        'right-index': r[6], 'right-middle': r[7],'right-ring': r[8],  'right-pinky': r[9],
    };
}

export function getKeyCenterInKB(containerEl, charOrId) {
    if (!containerEl) return null;
    let el;
    if (charOrId === ' ')        el = containerEl.querySelector('#key-\\20') || document.getElementById('key- ');
    else if (charOrId === 'ENTER')    el = document.getElementById('key-ENTER');
    else if (charOrId === 'SHIFT-L')  el = document.getElementById('key-SHIFT-L');
    else if (charOrId === 'SHIFT-R')  el = document.getElementById('key-SHIFT-R');
    else                              el = document.getElementById(`key-${charOrId}`);
    if (!el) return null;
    const kbRect = containerEl.getBoundingClientRect();
    const keyRect = el.getBoundingClientRect();
    return {
        x: keyRect.left - kbRect.left - containerEl.clientLeft + keyRect.width / 2,
        y: keyRect.top  - kbRect.top  - containerEl.clientTop  + keyRect.height / 2
    };
}

export function colorKeyboardKeys(containerEl, fingerMap, rainbow = true, singleColor = '#4FC3F7') {
    containerEl.querySelectorAll('.key').forEach(k => { k.style.backgroundColor = ''; });

    function fc(name) {
        return rainbow ? (FINGER_COLORS[name] || singleColor) : singleColor;
    }

    Object.entries(fingerMap).forEach(([char, info]) => {
        if (!info.finger || info.shift || info.finger === 'thumb') return;
        const color = fc(info.finger);
        let el;
        if (char === ' ')  el = document.getElementById('key- ');
        else if (char === '\n') el = document.getElementById('key-ENTER');
        else if (char === '\t') el = document.getElementById('key-TAB');
        else el = document.getElementById(`key-${char}`);
        if (el) el.style.backgroundColor = color + '38';
    });

    const spaceEl = document.getElementById('key- ');
    if (spaceEl) spaceEl.style.backgroundColor = rainbow ? '#d0d0d0' : singleColor + '38';

    const lp = fc('left-pinky') + '38', rp = fc('right-pinky') + '38';
    const g = id => document.getElementById(id);
    if (g('key-TAB'))     g('key-TAB').style.backgroundColor = lp;
    if (g('key-CAPS'))    g('key-CAPS').style.backgroundColor = lp;
    if (g('key-SHIFT-L')) g('key-SHIFT-L').style.backgroundColor = lp;
    if (g('key-SHIFT-R')) g('key-SHIFT-R').style.backgroundColor = rp;
    if (g('key-ENTER'))   g('key-ENTER').style.backgroundColor = rp;
    if (g('key-BACK'))    g('key-BACK').style.backgroundColor = rp;
}

export function createHandGuide(containerEl, fingerMap, layout = 'qwerty', rainbow = true, singleColor = '#4FC3F7') {
    const old = containerEl.querySelector('#hand-guide-overlay');
    if (old) old.remove();
    containerEl.style.position = 'relative';

    const overlay = document.createElement('div');
    overlay.id = 'hand-guide-overlay';
    overlay.innerHTML = '<svg id="hg-svg" xmlns="http://www.w3.org/2000/svg"></svg>';
    containerEl.appendChild(overlay);

    colorKeyboardKeys(containerEl, fingerMap, rainbow, singleColor);
    requestAnimationFrame(() => buildFingerSVG(containerEl, fingerMap, layout, rainbow, singleColor));
    return overlay;
}

export function buildFingerSVG(containerEl, fingerMap, layout = 'qwerty', rainbow = true, singleColor = '#4FC3F7') {
    const svg = document.getElementById('hg-svg');
    if (!svg) return;
    svg.innerHTML = '';
    svg.setAttribute('width', containerEl.clientWidth);
    svg.setAttribute('height', containerEl.clientHeight);
    svg.setAttribute('viewBox', `0 0 ${containerEl.clientWidth} ${containerEl.clientHeight}`);

    const home = getHomePositions(layout);
    const R = 11;

    FINGER_NAMES.forEach(name => {
        const pos = getKeyCenterInKB(containerEl, home[name]);
        if (!pos) return;
        const fc = rainbow ? (FINGER_COLORS[name] || singleColor) : singleColor;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = `hg-finger-${name}`;
        g.classList.add('hg-finger-group');
        g.style.setProperty('--fc', fc);

        const body = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        body.classList.add('hg-body');
        body.setAttribute('x1', pos.x); body.setAttribute('y1', pos.y);
        body.setAttribute('x2', pos.x); body.setAttribute('y2', pos.y);
        body.setAttribute('stroke-width', R * 2); body.setAttribute('stroke-linecap', 'round');
        g.appendChild(body);

        const home_c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        home_c.classList.add('hg-home');
        home_c.setAttribute('cx', pos.x); home_c.setAttribute('cy', pos.y); home_c.setAttribute('r', R);
        g.appendChild(home_c);

        const tip = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        tip.classList.add('hg-tip');
        tip.setAttribute('cx', pos.x); tip.setAttribute('cy', pos.y); tip.setAttribute('r', R);
        g.appendChild(tip);

        svg.appendChild(g);
    });
}

export function setHandGuideToChar(containerEl, fingerMap, layout, char) {
    const svg = document.getElementById('hg-svg');
    if (!svg) return;
    const home = getHomePositions(layout);
    const info = getFingerInfo(fingerMap, char);

    // Reset all to home
    FINGER_NAMES.forEach(name => {
        const g = document.getElementById(`hg-finger-${name}`);
        if (!g) return;
        g.classList.remove('hg-active','hg-shift-active');
        const pos = getKeyCenterInKB(containerEl, home[name]);
        if (!pos) return;
        const body = g.querySelector('.hg-body');
        const tip = g.querySelector('.hg-tip');
        if (body) { body.setAttribute('x1',pos.x); body.setAttribute('y1',pos.y); body.setAttribute('x2',pos.x); body.setAttribute('y2',pos.y); }
        if (tip)  { tip.setAttribute('cx',pos.x); tip.setAttribute('cy',pos.y); }
    });

    if (!info || info.finger === 'thumb') {
        const sp = document.getElementById('key- ');
        if (sp && info?.finger === 'thumb') sp.classList.add('space-active');
        return;
    }

    const homePos   = getKeyCenterInKB(containerEl, home[info.finger]);
    const targetPos = getKeyCenterInKB(containerEl, info.keyChar);
    if (!homePos || !targetPos) return;

    const fg = document.getElementById(`hg-finger-${info.finger}`);
    if (fg) {
        const body = fg.querySelector('.hg-body');
        const tip  = fg.querySelector('.hg-tip');
        if (body) { body.setAttribute('x1',homePos.x); body.setAttribute('y1',homePos.y); body.setAttribute('x2',targetPos.x); body.setAttribute('y2',targetPos.y); }
        if (tip)  { tip.setAttribute('cx',targetPos.x); tip.setAttribute('cy',targetPos.y); }
        fg.classList.add('hg-active');
    }

    if (info.shift) {
        const isLeft = info.finger.startsWith('left');
        const shiftSide = isLeft ? 'right' : 'left';
        const shiftKey  = isLeft ? 'SHIFT-R' : 'SHIFT-L';
        const sg = document.getElementById(`hg-finger-${shiftSide}-pinky`);
        if (sg) {
            const shHome = getKeyCenterInKB(containerEl, home[`${shiftSide}-pinky`]);
            const shTarget = getKeyCenterInKB(containerEl, shiftKey);
            if (shHome && shTarget) {
                const sb = sg.querySelector('.hg-body');
                const st = sg.querySelector('.hg-tip');
                if (sb) { sb.setAttribute('x1',shHome.x); sb.setAttribute('y1',shHome.y); sb.setAttribute('x2',shTarget.x); sb.setAttribute('y2',shTarget.y); }
                if (st) { st.setAttribute('cx',shTarget.x); st.setAttribute('cy',shTarget.y); }
            }
            sg.classList.add('hg-shift-active');
        }
    }
}

export function resetHandGuideToHome(containerEl, layout) {
    const svg = document.getElementById('hg-svg');
    if (!svg) return;
    const home = getHomePositions(layout);
    FINGER_NAMES.forEach(name => {
        const g = document.getElementById(`hg-finger-${name}`);
        if (!g) return;
        g.classList.remove('hg-active','hg-shift-active');
        const pos = getKeyCenterInKB(containerEl, home[name]);
        if (!pos) return;
        const body = g.querySelector('.hg-body');
        const tip  = g.querySelector('.hg-tip');
        if (body) { body.setAttribute('x1',pos.x); body.setAttribute('y1',pos.y); body.setAttribute('x2',pos.x); body.setAttribute('y2',pos.y); }
        if (tip)  { tip.setAttribute('cx',pos.x); tip.setAttribute('cy',pos.y); }
    });
}

export function flashFingerPressed(containerEl) {
    const svg = document.getElementById('hg-svg');
    if (!svg) return;
    svg.querySelectorAll('.hg-active').forEach(g => {
        g.classList.add('hg-pressed');
        setTimeout(() => g.classList.remove('hg-pressed'), 120);
    });
    const sp = document.getElementById('key- ');
    if (sp?.classList.contains('space-active')) {
        sp.classList.add('space-pressed');
        setTimeout(() => sp.classList.remove('space-pressed'), 120);
    }
}
