// learn.js — TypeThatBook School v1.0.0
import { db, auth } from "./firebase-config.js";
import {
    collection, getDocs, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    FINGER_COLORS, FINGER_NAMES, LAYOUTS,
    createKeyboard, buildFingerMap, getFingerInfo,
    createHandGuide, buildFingerSVG, setHandGuideToChar,
    resetHandGuideToHome, colorKeyboardKeys, flashFingerPressed,
    getHomePositions, getKeyCenterInKB, toggleKeyboardCase
} from "./keyboard.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const VERSION = "1.0.0";
const LAYOUT = localStorage.getItem('keyboardLayout') || 'qwerty';
const ANCHOR_FLASH_MS = 1800;   // how long the anchor warning stays visible
const INTRO_ANIM_MS   = 1400;   // ms per animation frame (home ↔ reach)

// ─── State ────────────────────────────────────────────────────────────────────
let currentUser = null;
let allLessons   = [];   // sorted lesson objects from Firestore
let userProgress = {};   // lessonId → progress doc

// Drill session state
let currentLesson  = null;
let currentStepIdx = 0;
let currentStep    = null;
let drillSequence  = [];  // array of chars to type for current step
let drillPos       = 0;   // index into drillSequence
let mistakes       = 0;
let chars          = 0;
let stepStartTime  = 0;
let stepSeconds    = 0;
let timerInterval  = null;
let introAnimTimer = null;
let introAnimFrame = 0;   // 0 = home, 1 = reach
let fingerMap      = buildFingerMap(LAYOUT);
let anchorLiftWarningActive = false;
let missedChars    = {};  // char → count for this lesson

// ─── DOM ─────────────────────────────────────────────────────────────────────
const mapView        = document.getElementById('map-view');
const drillView      = document.getElementById('drill-view');
const introPanel     = document.getElementById('intro-panel');
const activeDrill    = document.getElementById('active-drill');
const lessonMapEl    = document.getElementById('lesson-map');
const introKeysEl    = document.getElementById('intro-keys');
const introTitleEl   = document.getElementById('intro-title');
const introTextEl    = document.getElementById('intro-text');
const introStartBtn  = document.getElementById('intro-start-btn');
const introKeyboard  = document.getElementById('intro-keyboard');
const drillTextEl    = document.getElementById('drill-text');
const stepLabelEl    = document.getElementById('step-label');
const stepProgressEl = document.getElementById('step-progress-bar');
const drillModal     = document.getElementById('drill-modal');
const drillKeyboard  = document.getElementById('virtual-keyboard');
const wpmDisplay     = document.getElementById('wpm-display');
const accDisplay     = document.getElementById('acc-display');
const anchorWarning  = document.getElementById('anchor-warning');
const mapProgressEl  = document.getElementById('map-progress-summary');
const graduateLink   = document.getElementById('graduate-link');
const backBtn        = document.getElementById('back-btn');
const hudLessonLabel = document.getElementById('hud-lesson-label');

// ─── Auth ─────────────────────────────────────────────────────────────────────
document.getElementById('login-btn').onclick = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch(e) { console.error(e); }
};
document.getElementById('logout-btn').onclick = async () => {
    try { await signOut(auth); } catch(e) { console.error(e); }
};
onAuthStateChanged(auth, async user => {
    currentUser = user;
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    if (user) {
        document.getElementById('user-name').textContent = user.displayName || user.email;
        userInfo.classList.remove('hidden'); loginBtn.style.display = 'none';
        await loadUserProgress();
    } else {
        userInfo.classList.add('hidden'); loginBtn.style.display = '';
        userProgress = {};
    }
    renderMap();
});

// ─── Load Lessons ─────────────────────────────────────────────────────────────
async function loadLessons() {
    try {
        const snap = await getDocs(collection(db, 'lessons'));
        allLessons = [];
        snap.forEach(d => allLessons.push(d.data()));
        allLessons.sort((a, b) => {
            if (a.unit !== b.unit) return a.unit - b.unit;
            return a.lesson - b.lesson;
        });
    } catch(e) {
        lessonMapEl.innerHTML = '<div style="color:#888; text-align:center; padding:40px;">Could not load lessons. Check your connection.</div>';
        console.error(e);
    }
}

async function loadUserProgress() {
    if (!currentUser) return;
    userProgress = {};
    try {
        const snap = await getDocs(collection(db, 'users', currentUser.uid, 'lessonProgress'));
        snap.forEach(d => { userProgress[d.id] = d.data(); });
    } catch(e) { console.warn('Could not load lesson progress:', e); }
}

// ─── Lesson Map ───────────────────────────────────────────────────────────────
function renderMap() {
    lessonMapEl.innerHTML = '';
    if (allLessons.length === 0) {
        lessonMapEl.innerHTML = '<div style="color:#888; text-align:center; padding:40px;">No lessons loaded.</div>';
        return;
    }

    const completed = new Set(Object.keys(userProgress).filter(id => userProgress[id]?.passed));
    const totalLessons = allLessons.length;
    const doneCount = completed.size;
    mapProgressEl.textContent = currentUser
        ? `${doneCount} of ${totalLessons} lessons complete`
        : 'Sign in to save your progress';

    // Build by unit
    const byUnit = {};
    allLessons.forEach(l => {
        const u = l.unit || 0;
        if (!byUnit[u]) byUnit[u] = [];
        byUnit[u].push(l);
    });

    const UNIT_LABELS = {
        1: 'Unit 1 — Home Row',
        2: 'Unit 2 — Index Fingers',
        3: 'Unit 3 — Middle & Ring Up',
        4: 'Unit 4 — Remaining Letters',
        5: 'Unit 5 — Number Row',
        6: 'Unit 6 — Shift & Capitals',
        7: 'Unit 7 — Graduation',
    };

    // Find first unlocked-and-incomplete lesson to highlight
    let firstActiveId = null;
    let prevUnlocked = true;
    for (const lesson of allLessons) {
        if (!completed.has(lesson.id) && prevUnlocked) { firstActiveId = lesson.id; break; }
        prevUnlocked = completed.has(lesson.id);
    }

    Object.keys(byUnit).sort((a,b) => a-b).forEach(unit => {
        const header = document.createElement('div');
        header.className = 'map-unit-header';
        header.textContent = UNIT_LABELS[unit] || `Unit ${unit}`;
        lessonMapEl.appendChild(header);

        const row = document.createElement('div');
        row.className = 'map-lesson-row';

        byUnit[unit].forEach(lesson => {
            const prog = userProgress[lesson.id];
            const isDone = prog?.passed;
            const stars = prog?.stars || 0;
            const isLocked = !isDone && !isUnlocked(lesson);
            const isNext = lesson.id === firstActiveId;

            const card = document.createElement('div');
            card.className = 'map-lesson-card' +
                (isLocked ? ' locked' : '') +
                (isDone   ? ' completed' : '') +
                (isNext   ? ' active-next' : '');

            const keysLabel = (lesson.newKeys || []).length
                ? lesson.newKeys.map(k => k.toUpperCase()).join(' ')
                : (lesson.unit === 7 ? '★' : '↺');

            card.innerHTML = `
                <div class="mlc-keys">${keysLabel}</div>
                <div class="mlc-title">${escHtml(lesson.title || lesson.id)}</div>
                <div class="mlc-meta">${(lesson.steps || []).length} steps · WPM ${(lesson.gates || {}).minWPM || '?'}+</div>
                <div class="mlc-stars">${starsHTML(stars)}</div>
                ${isLocked ? '<div class="mlc-lock">🔒</div>' : ''}
            `;

            if (!isLocked) {
                card.addEventListener('click', () => startLesson(lesson));
            }
            row.appendChild(card);
        });

        lessonMapEl.appendChild(row);
    });

    // Graduate button: show if all non-Unit-7 lessons complete
    const graduateable = allLessons.filter(l => l.unit < 7).every(l => completed.has(l.id));
    graduateLink.classList.toggle('hidden', !graduateable);
}

function isUnlocked(lesson) {
    // A lesson is unlocked if it's the first in its unit, or the previous lesson is complete
    const idx = allLessons.findIndex(l => l.id === lesson.id);
    if (idx === 0) return true;
    const prev = allLessons[idx - 1];
    // Different unit: first of new unit needs previous unit's last lesson done
    return userProgress[prev.id]?.passed === true;
}

function starsHTML(count) {
    if (count === 0) return '<span style="color:#333;">☆☆☆</span>';
    return '⭐'.repeat(count) + '<span style="color:#333;">☆</span>'.repeat(3 - count);
}

// ─── Start Lesson ─────────────────────────────────────────────────────────────
function startLesson(lesson) {
    currentLesson  = lesson;
    currentStepIdx = 0;
    mistakes       = 0;
    chars          = 0;
    missedChars    = {};
    hudLessonLabel.textContent = lesson.title || '';
    backBtn.href = '#'; backBtn.onclick = () => { stopLesson(); return false; };

    showView('drill');
    showIntro(lesson);
}

function showIntro(lesson) {
    introPanel.classList.remove('hidden');
    activeDrill.classList.add('hidden');
    stopIntroAnim();

    // Key badges
    introKeysEl.innerHTML = (lesson.newKeys || []).length
        ? lesson.newKeys.map(k => `<div class="intro-key-badge">${escHtml(k.toUpperCase())}</div>`).join('')
        : '<div class="intro-key-badge" style="font-size:1rem;">All Keys</div>';

    introTitleEl.textContent = lesson.title || '';
    introTextEl.textContent  = lesson.intro || '';

    // Build intro keyboard
    createKeyboard(introKeyboard, LAYOUT);
    createHandGuide(introKeyboard, fingerMap, LAYOUT, true);
    requestAnimationFrame(() => {
        startIntroAnim(lesson);
    });

    introStartBtn.onclick = () => {
        stopIntroAnim();
        beginStep(0);
    };
}

// ─── Intro Animation ──────────────────────────────────────────────────────────
function startIntroAnim(lesson) {
    const newKeys = lesson.newKeys || [];
    if (newKeys.length === 0) {
        resetHandGuideToHome(introKeyboard, LAYOUT);
        return;
    }

    introAnimFrame = 0;
    runIntroAnimFrame(newKeys);
    introAnimTimer = setInterval(() => {
        introAnimFrame = 1 - introAnimFrame;
        runIntroAnimFrame(newKeys);
    }, INTRO_ANIM_MS);
}

function runIntroAnimFrame(newKeys) {
    if (introAnimFrame === 0) {
        // Frame A: all fingers resting at home
        resetHandGuideToHome(introKeyboard, LAYOUT);
    } else {
        // Frame B: target finger(s) reaching to new key(s)
        // Reset first, then stretch each new key's finger
        resetHandGuideToHome(introKeyboard, LAYOUT);
        newKeys.forEach(k => {
            setHandGuideToChar(introKeyboard, fingerMap, LAYOUT, k);
        });
    }
}

function stopIntroAnim() {
    if (introAnimTimer) { clearInterval(introAnimTimer); introAnimTimer = null; }
}

// ─── Step Engine ──────────────────────────────────────────────────────────────
function beginStep(stepIdx) {
    currentStepIdx = stepIdx;
    currentStep = (currentLesson.steps || [])[stepIdx];
    if (!currentStep) { finishLesson(); return; }

    introPanel.classList.add('hidden');
    activeDrill.classList.remove('hidden');
    drillModal.classList.add('hidden');

    // Build full keyboard for drilling
    createKeyboard(drillKeyboard, LAYOUT);
    createHandGuide(drillKeyboard, fingerMap, LAYOUT, true);
    drillKeyboard.focus();

    // Step progress pips
    const steps = currentLesson.steps || [];
    stepProgressEl.innerHTML = steps.map((s, i) => {
        const cls = i < stepIdx ? 'done' : i === stepIdx ? 'active' : '';
        return `<div class="step-pip ${cls}"></div>`;
    }).join('');
    stepLabelEl.textContent = currentStep.label || `Step ${stepIdx + 1}`;

    // Build drill sequence
    drillSequence = buildSequence(currentStep);
    drillPos  = 0;
    mistakes  = 0;
    chars     = 0;
    stepStartTime = Date.now();
    stepSeconds   = 0;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (drillPos > 0) stepSeconds++;
        updateHUD();
    }, 1000);

    renderDrillText();
    advanceHandGuide();

    // Set up keypress handling
    drillKeyboard.onkeydown = handleDrillKey;
    drillKeyboard.focus();
}

function buildSequence(step) {
    switch (step.type) {
        case 'key_pattern':
            return step.text.split('');
        case 'key_random':
            return generateRandom(step.keySet || [], step.groupSize || 4, step.groupCount || 12);
        case 'word_list':
            return (step.words || []).join(' ').split('');
        case 'sentence_list':
            return (step.sentences || []).join(' ').split('');
        case 'passage':
            return (step.text || '').split('');
        default:
            return [];
    }
}

function generateRandom(keySet, groupSize, groupCount) {
    if (!keySet.length) return [];
    const chars = [];
    for (let g = 0; g < groupCount; g++) {
        if (g > 0) chars.push(' ');
        for (let i = 0; i < groupSize; i++) {
            chars.push(keySet[Math.floor(Math.random() * keySet.length)]);
        }
    }
    return chars;
}

// ─── Keypress Handler ─────────────────────────────────────────────────────────
function handleDrillKey(e) {
    // Ignore modifier keys
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    if (e.key === 'CapsLock') return;

    // Check anchor keys first
    if (currentStep?.anchorEnforced) {
        const anchors = currentLesson.anchorKeys || [];
        const heldKeys = getHeldAnchorKeys(e, anchors);
        if (heldKeys.missing.length > 0) {
            flashAnchorWarning(heldKeys.missing);
        }
    }

    if (drillPos >= drillSequence.length) return;
    const expected = drillSequence[drillPos];

    let typed = '';
    if (e.key === 'Enter')     typed = '\n';
    else if (e.key === 'Tab')  typed = '\t';
    else if (e.key === 'Backspace') {
        // Allow backspace to go back one char
        if (drillPos > 0) { drillPos--; renderDrillText(); advanceHandGuide(); }
        e.preventDefault(); return;
    } else if (e.key.length === 1) {
        typed = e.key;
    } else {
        e.preventDefault(); return;
    }
    e.preventDefault();

    chars++;
    if (typed === expected) {
        flashFingerPressed(drillKeyboard);
        drillPos++;
        renderDrillText();
        if (drillPos >= drillSequence.length) {
            finishStep();
            return;
        }
        advanceHandGuide();
    } else {
        mistakes++;
        if (expected !== ' ') {
            missedChars[expected] = (missedChars[expected] || 0) + 1;
        }
        // Flash the correct key
        flashTargetKey();
        renderDrillText(true);
    }
    updateHUD();
}

// Track which anchor keys are NOT being held
function getHeldAnchorKeys(keyEvent, anchors) {
    // We can't directly read held keys in keydown for arbitrary keys,
    // so we use a held-keys set maintained by keydown/keyup
    const missing = anchors.filter(k => !heldKeys.has(k));
    return { missing };
}

// Maintain a set of currently held keys
const heldKeys = new Set();
window.addEventListener('keydown', e => { if (e.key.length === 1) heldKeys.add(e.key.toLowerCase()); });
window.addEventListener('keyup',   e => { if (e.key.length === 1) heldKeys.delete(e.key.toLowerCase()); });

function flashAnchorWarning(missingKeys) {
    if (anchorLiftWarningActive) return;
    anchorLiftWarningActive = true;
    anchorWarning.textContent = `⚠ Keep ${missingKeys.map(k => k.toUpperCase()).join(', ')} on the home row!`;
    anchorWarning.classList.add('visible');
    setTimeout(() => {
        anchorWarning.classList.remove('visible');
        anchorLiftWarningActive = false;
    }, ANCHOR_FLASH_MS);
}

function flashTargetKey() {
    const expected = drillSequence[drillPos];
    if (!expected) return;
    const info = getFingerInfo(fingerMap, expected);
    if (!info) return;
    const el = document.getElementById(`key-${info.keyChar}`);
    if (!el) return;
    const orig = el.style.backgroundColor;
    el.style.backgroundColor = '#c62828';
    setTimeout(() => { el.style.backgroundColor = orig; }, 200);
}

// ─── Render Drill Text ────────────────────────────────────────────────────────
function renderDrillText(showError = false) {
    const seq = drillSequence;
    const html = seq.map((ch, i) => {
        const disp = ch === ' ' ? '&nbsp;' : ch === '\n' ? '↵' : escHtml(ch);
        if (i < drillPos) return `<span class="dt-done">${disp}</span>`;
        if (i === drillPos) {
            const cls = showError ? 'dt-error' : 'dt-current';
            return `<span class="${cls}" id="dt-cursor">${disp}</span>`;
        }
        return `<span class="dt-upcoming">${disp}</span>`;
    }).join('');
    drillTextEl.innerHTML = html;

    // Scroll cursor into view
    requestAnimationFrame(() => {
        const cursor = document.getElementById('dt-cursor');
        if (cursor) cursor.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
}

function advanceHandGuide() {
    if (drillPos >= drillSequence.length) return;
    const ch = drillSequence[drillPos];
    setHandGuideToChar(drillKeyboard, fingerMap, LAYOUT, ch);
    // Show shift state on keyboard
    const info = getFingerInfo(fingerMap, ch);
    toggleKeyboardCase(drillKeyboard, info?.shift || false);
    // Highlight the target key
    drillKeyboard.querySelectorAll('.key').forEach(k => k.classList.remove('target'));
    const info2 = getFingerInfo(fingerMap, ch);
    if (info2) {
        const el = document.getElementById(`key-${info2.keyChar}`);
        if (el) el.classList.add('target');
    } else if (ch === ' ') {
        const sp = document.getElementById('key- ');
        if (sp) sp.classList.add('target');
    }
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function updateHUD() {
    const wpm = stepSeconds > 0 ? Math.round((chars / 5) / (stepSeconds / 60)) : 0;
    const acc = chars > 0 ? Math.round(((chars - mistakes) / chars) * 100) : 100;
    wpmDisplay.textContent = wpm;
    accDisplay.textContent = acc + '%';
}

// ─── Finish Step ─────────────────────────────────────────────────────────────
function finishStep() {
    clearInterval(timerInterval);
    drillKeyboard.onkeydown = null;

    const wpm = stepSeconds > 0 ? Math.round((chars / 5) / (stepSeconds / 60)) : 0;
    const acc = chars > 0 ? Math.round(((chars - mistakes) / chars) * 100) : 100;

    const steps = currentLesson.steps || [];
    const isLastStep = currentStepIdx >= steps.length - 1;

    if (isLastStep) {
        showLessonResultModal(wpm, acc);
    } else {
        // Quick inter-step modal
        showStepModal(wpm, acc, currentStepIdx + 1, steps.length);
    }
}

function showStepModal(wpm, acc, nextIdx, totalSteps) {
    drillModal.classList.remove('hidden');
    document.getElementById('drill-keyboard-wrap').style.display = 'none';

    document.getElementById('dm-title').textContent = `Step ${nextIdx} of ${totalSteps} done`;
    document.getElementById('dm-stars').textContent = '';
    document.getElementById('dm-stats').innerHTML = `
        <div class="dm-stat"><div class="dm-val">${wpm}</div><div class="dm-label">WPM</div></div>
        <div class="dm-stat"><div class="dm-val">${acc}%</div><div class="dm-label">Accuracy</div></div>`;
    document.getElementById('dm-msg').textContent = '';
    document.getElementById('dm-remediation').innerHTML = '';
    const btns = document.getElementById('dm-btns');
    btns.innerHTML = '';
    const next = document.createElement('button');
    next.className = 'dm-btn-primary'; next.textContent = 'Next Step →';
    next.onclick = () => {
        drillModal.classList.add('hidden');
        document.getElementById('drill-keyboard-wrap').style.display = '';
        beginStep(nextIdx);
    };
    btns.appendChild(next);
}

function showLessonResultModal(wpm, acc) {
    const gates  = currentLesson.gates || {};
    const minWPM = gates.minWPM || 15;
    const minAcc = gates.minAccuracy || 85;
    const passed = wpm >= minWPM && acc >= minAcc;

    // Star rating
    const wpmRatio = wpm / minWPM;
    const accRatio = acc / minAcc;
    let stars = 1;
    if (passed && wpmRatio >= 1.3 && accRatio >= 1.1) stars = 3;
    else if (passed && (wpmRatio >= 1.2 || accRatio >= 1.05)) stars = 2;
    if (!passed) stars = 0;

    // Save progress to Firestore
    if (currentUser) saveProgress(passed, wpm, acc, stars);

    drillModal.classList.remove('hidden');
    document.getElementById('drill-keyboard-wrap').style.display = 'none';

    document.getElementById('dm-title').textContent = passed ? '🎉 Lesson Complete!' : 'Not quite yet…';
    document.getElementById('dm-stars').textContent = passed ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆';
    document.getElementById('dm-stats').innerHTML = `
        <div class="dm-stat"><div class="dm-val">${wpm}</div><div class="dm-label">WPM</div></div>
        <div class="dm-stat"><div class="dm-val">${acc}%</div><div class="dm-label">Accuracy</div></div>
        <div class="dm-stat"><div class="dm-val">${minWPM}+</div><div class="dm-label">Target WPM</div></div>`;

    const msg = passed
        ? `You hit ${wpm} WPM at ${acc}% accuracy. Gates: ${minWPM} WPM / ${minAcc}% accuracy.`
        : `You need ${minWPM} WPM and ${minAcc}% accuracy. You got ${wpm} WPM and ${acc}%. Try again!`;
    document.getElementById('dm-msg').textContent = msg;

    // Remediation links for missed chars
    const remText = buildRemediationLinks();
    document.getElementById('dm-remediation').innerHTML = remText;

    const btns = document.getElementById('dm-btns');
    btns.innerHTML = '';

    if (passed) {
        const nextLesson = getNextLesson();
        const nextBtn = document.createElement('button');
        nextBtn.className = 'dm-btn-primary';
        nextBtn.textContent = nextLesson ? 'Next Lesson →' : '📚 Go to Library';
        nextBtn.onclick = () => {
            if (nextLesson) { startLesson(nextLesson); }
            else { window.location.href = 'index.html'; }
        };
        btns.appendChild(nextBtn);

        const mapBtn = document.createElement('button');
        mapBtn.className = 'dm-btn-secondary'; mapBtn.textContent = 'Back to Map';
        mapBtn.onclick = () => stopLesson();
        btns.appendChild(mapBtn);
    } else {
        const retryBtn = document.createElement('button');
        retryBtn.className = 'dm-btn-primary'; retryBtn.textContent = 'Try Again';
        retryBtn.onclick = () => {
            drillModal.classList.add('hidden');
            document.getElementById('drill-keyboard-wrap').style.display = '';
            startLesson(currentLesson);
        };
        btns.appendChild(retryBtn);

        const mapBtn = document.createElement('button');
        mapBtn.className = 'dm-btn-secondary'; mapBtn.textContent = 'Back to Map';
        mapBtn.onclick = () => stopLesson();
        btns.appendChild(mapBtn);
    }
}

function buildRemediationLinks() {
    const top = Object.entries(missedChars)
        .filter(([ch, n]) => n >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    if (!top.length) return '';

    const links = top.map(([ch]) => {
        // Find the lesson that first introduced this key
        const introLesson = allLessons.find(l => (l.newKeys || []).includes(ch));
        if (!introLesson) return null;
        return `<a href="#" onclick="window._gotoLesson('${introLesson.id}'); return false;">${ch.toUpperCase()} (Lesson: ${escHtml(introLesson.title)})</a>`;
    }).filter(Boolean);

    if (!links.length) return '';
    return `You often missed: ${links.join(', ')} — revisit these?`;
}

window._gotoLesson = function(id) {
    const lesson = allLessons.find(l => l.id === id);
    if (lesson) startLesson(lesson);
};

// ─── Progress Persistence ────────────────────────────────────────────────────
async function saveProgress(passed, wpm, acc, stars) {
    if (!currentUser || !currentLesson) return;
    const prev = userProgress[currentLesson.id] || {};
    const prevStars = prev.stars || 0;
    const attempts  = (prev.attempts || 0) + 1;
    const timeSpent = (prev.timeSpentSeconds || 0) + stepSeconds;

    const record = {
        lessonId: currentLesson.id,
        completedAt: new Date().toISOString(),
        attempts,
        finalWPM: wpm,
        finalAccuracy: acc,
        timeSpentSeconds: timeSpent,
        passed: passed || prev.passed || false,
        stars: Math.max(stars, prevStars),
    };

    // Leap detection flag
    const prevWPM = prev.finalWPM || 0;
    if (prevWPM > 0 && wpm > prevWPM * 1.5) record.leapFlagged = true;

    try {
        await setDoc(
            doc(db, 'users', currentUser.uid, 'lessonProgress', currentLesson.id),
            record
        );
        userProgress[currentLesson.id] = record;
    } catch(e) { console.warn('Could not save lesson progress:', e); }
}

// ─── Navigation ──────────────────────────────────────────────────────────────
function showView(which) {
    mapView.classList.toggle('hidden', which !== 'map');
    drillView.classList.toggle('hidden', which !== 'drill');
}

function stopLesson() {
    clearInterval(timerInterval);
    stopIntroAnim();
    drillKeyboard.onkeydown = null;
    currentLesson = null;
    backBtn.href = 'index.html'; backBtn.onclick = null;
    hudLessonLabel.textContent = '';
    document.getElementById('drill-keyboard-wrap').style.display = '';
    drillModal.classList.add('hidden');
    wpmDisplay.textContent = '—';
    accDisplay.textContent = '—';
    loadUserProgress().then(() => {
        renderMap();
        showView('map');
    });
}

function getNextLesson() {
    if (!currentLesson) return null;
    const idx = allLessons.findIndex(l => l.id === currentLesson.id);
    return allLessons[idx + 1] || null;
}

// ─── Caps Lock Warning ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    const capsEl = document.getElementById('caps-warning');
    if (capsEl) capsEl.classList.toggle('hidden', !e.getModifierState('CapsLock'));
});

// ─── Utils ────────────────────────────────────────────────────────────────────
function escHtml(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Init ─────────────────────────────────────────────────────────────────────
(async () => {
    await loadLessons();
    // Auth state handled by onAuthStateChanged above
    // which calls renderMap() when ready
    // If not signed in, render immediately
    if (!currentUser) renderMap();
})();
