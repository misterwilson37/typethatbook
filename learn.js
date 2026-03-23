// learn.js — TypeThatBook School v1.0.0
import { db, auth } from "./firebase-config.js";
import {
    collection, getDocs, doc, getDoc, setDoc, addDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    FINGER_COLORS, FINGER_NAMES, LAYOUTS, KB_VERSION,
    createKeyboard, buildFingerMap, getFingerInfo,
    createHandGuide, buildFingerSVG, setHandGuideToChar, setHandGuideToChars,
    resetHandGuideToHome, colorKeyboardKeys, flashFingerPressed,
    getHomePositions, getKeyCenterInKB, toggleKeyboardCase
} from "./keyboard.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const LEARN_VERSION = "1.4.2"; // bump z every deploy to confirm cache cleared
const LAYOUT = localStorage.getItem('keyboardLayout') || 'qwerty';
const INTRO_ANIM_MS   = 1400;   // ms per animation frame (home ↔ reach)

// ─── State ────────────────────────────────────────────────────────────────────
let currentUser = null;
let allLessons   = [];   // sorted lesson objects from Firestore
let userProgress = {};   // lessonId → progress doc

// ─── Stats & Goals (mirrors game.js — writes to same Firestore path) ────────
let statsData = { secondsToday:0, secondsWeek:0, charsToday:0, charsWeek:0,
                  mistakesToday:0, mistakesWeek:0, lastDate:'', weekStart:0 };
let goals = { dailySeconds: 0, weeklySeconds: 0 };
let dailyGoalCelebrated  = false;
let weeklyGoalCelebrated = false;
let learnActiveSeconds   = 0;   // active seconds this step (for HUD display)
let learnTickInterval    = null;
let learnLastInputTime   = 0;
const LEARN_IDLE_THRESHOLD = 3000; // 3s idle = paused

// ─── Drill session state ─────────────────────────────────────────────────────
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
let missedChars    = {};  // char → count for this lesson

// Per-character done states — mirrors game.js currentLetterStatus logic
let drillCharStates      = [];      // 'upcoming' | 'perfect' | 'fixed' | 'dirty' per char
let drillLetterStatus    = 'clean'; // 'clean' | 'error' | 'fixed'
let drillBackspaceOrigin = -1;      // furthest pos reached during a backspace run
let drillConsecutiveMistakes = 0;   // resets on any correct key
let drillIsHardStop      = false;   // timer paused, waiting for correct key
const DRILL_HARD_STOP_THRESHOLD = 3;  // wrong keys in a row before pausing
const DRILL_SPAM_THRESHOLD      = 8;  // total consecutive to restart step

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
const mapProgressEl  = document.getElementById('map-progress-summary');
const graduateLink   = document.getElementById('graduate-link');
const backBtn        = document.getElementById('back-btn');
const hudLessonLabel = document.getElementById('hud-lesson-label');
const hudTimer       = document.getElementById('hud-timer');

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
        // Load lessons first if they haven't arrived yet (race: auth can beat loadLessons)
        if (allLessons.length === 0) await loadLessons();
        await loadUserProgress();
        await loadUserStats();
        await loadGoals();
    } else {
        userInfo.classList.add('hidden'); loginBtn.style.display = '';
        userProgress = {};
        // Load lessons if needed for signed-out view
        if (allLessons.length === 0) await loadLessons();
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
        // If the map is already visible but was rendered before lessons loaded, refresh it
        if (!mapView.classList.contains('hidden') &&
            lessonMapEl.querySelectorAll('.map-lesson-card').length === 0) {
            renderMap();
        }
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
    // "Continue" button — find first incomplete unlocked lesson
    const continueLesson = allLessons.find(l => !completed.has(l.id) && isUnlocked(l));
    const continueBtnEl = document.getElementById('map-continue-btn');
    if (continueBtnEl) {
        if (continueLesson) {
            const keys = (continueLesson.newKeys || []).length
                ? continueLesson.newKeys.map(k => k.toUpperCase()).join(' ') : '↺';
            continueBtnEl.textContent = '▶ Continue: ' + (continueLesson.title || continueLesson.id);
            continueBtnEl.style.display = '';
            continueBtnEl.onclick = () => startLesson(continueLesson);
        } else {
            continueBtnEl.style.display = 'none';
        }
    }

    // Show today's time in map header
    const timeEl = document.getElementById('map-time-today');
    if (timeEl && statsData.secondsToday > 0) {
        const dailyDone = goals.dailySeconds > 0 && statsData.secondsToday >= goals.dailySeconds;
        timeEl.innerHTML = 'Today: <strong>' + formatTime(statsData.secondsToday) + '</strong>' +
            (dailyDone ? ' <span class="goal-badge goal-daily" style="display:inline-flex;width:18px;height:18px;font-size:0.65rem;">✓</span>' : '');
        timeEl.style.display = '';
    }

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
            const grade = prog?.grade || (prog?.stars ? ['','B','A','A🔥'][Math.min(prog.stars,3)] : '');
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
                <div class="mlc-stars">${gradeOnMap(grade)}</div>
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

function calculateGrade(wpm, acc, minWPM, minAcc) {
    // F  — clearly didn't meet either gate (below 70%)
    // D  — tried but missed at least one gate (time counts, must retry)
    // C  — met one gate but not both (time counts, must retry)
    // B  — met both gates (passes, can advance)
    // A  — exceeded both gates by 15%+ on each
    // A🔥 — exceeded both gates by 30%+ on each
    const wpmMet = wpm  >= minWPM;
    const accMet = acc  >= minAcc;

    if (!wpmMet && !accMet) {
        if (wpm < minWPM * 0.70 || acc < minAcc * 0.70) return 'F';
        return 'D';
    }
    if (wpmMet && accMet) {
        if (wpm >= minWPM * 1.30 && acc >= minAcc * 1.15) return 'A🔥';
        if (wpm >= minWPM * 1.15 && acc >= minAcc * 1.05) return 'A';
        return 'B';
    }
    // Met one but not both
    return 'C';
}

function gradeHTML(grade) {
    const map = {
        'A🔥': { color:'#ff6600', label:'A 🔥', bg:'rgba(255,100,0,0.12)' },
        'A':   { color:'#22c55e', label:'A',    bg:'rgba(34,197,94,0.12)'  },
        'B':   { color:'#4B9CD3', label:'B',    bg:'rgba(75,156,211,0.12)' },
        'C':   { color:'#FFD700', label:'C',    bg:'rgba(255,215,0,0.12)'  },
        'D':   { color:'#FF9800', label:'D',    bg:'rgba(255,152,0,0.12)'  },
        'F':   { color:'#888',    label:'F',    bg:'rgba(128,128,128,0.08)'},
    };
    const g = map[grade] || map['F'];
    return '<span class="grade-badge" style="color:' + g.color + ';background:' + g.bg + ';">' + g.label + '</span>';
}

function gradeOnMap(grade) {
    // Compact version for the lesson map card
    if (!grade) return '';
    if (grade === 'A🔥') return '<span style="color:#ff6600;font-weight:bold;font-size:0.85rem;">A🔥</span>';
    const colors = { A:'#22c55e', B:'#4B9CD3', C:'#FFD700', D:'#FF9800', F:'#888' };
    return '<span style="color:' + (colors[grade] || '#888') + ';font-weight:bold;font-size:0.85rem;">' + grade + '</span>';
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
    // Keep active-drill visible but collapse it so the drill keyboard
    // gets laid out in the DOM with real pixel dimensions while the intro shows.
    // This eliminates the race condition where beginStep() builds the keyboard
    // on a zero-size element that Safari hasn't reflowed yet.
    activeDrill.classList.remove('hidden');
    activeDrill.style.position = 'absolute';
    activeDrill.style.top = '0';
    activeDrill.style.left = '0';
    activeDrill.style.width = '100%';
    activeDrill.style.height = '100%';
    activeDrill.style.opacity = '0';
    activeDrill.style.pointerEvents = 'none';
    drillModal.classList.add('hidden');
    document.getElementById('drill-keyboard-wrap').style.display = '';
    stopIntroAnim();

    // Key badges
    introKeysEl.innerHTML = (lesson.newKeys || []).length
        ? lesson.newKeys.map(k => '<div class="intro-key-badge">' + escHtml(k.toUpperCase()) + '</div>').join('')
        : '<div class="intro-key-badge" style="font-size:1rem;">All Keys</div>';

    introTitleEl.textContent = lesson.title || '';
    introTextEl.textContent  = lesson.intro || '';

    // Build intro keyboard
    createKeyboard(introKeyboard, LAYOUT);
    createHandGuide(introKeyboard, fingerMap, LAYOUT, true);

    // Pre-build the drill keyboard NOW while it has real dimensions in the DOM.
    // By the time the student hits Start, the keyboard has been laid out for
    // several seconds and beginStep() just needs to show and focus it.
    requestAnimationFrame(() => {
        createKeyboard(drillKeyboard, LAYOUT);
        createHandGuide(drillKeyboard, fingerMap, LAYOUT, true);
        console.log('[TTB] Drill keyboard pre-built during intro — keys:', drillKeyboard.querySelectorAll('.key').length);
        startIntroAnim(lesson);
    });

    introStartBtn.onclick = () => {
        stopIntroAnim();
        document.removeEventListener('keydown', introEnterHandler);
        beginStep(0);
    };

    // Enter key activates Start Lesson from the intro screen
    function introEnterHandler(e) {
        if (e.key === 'Enter' && !introPanel.classList.contains('hidden')) {
            e.preventDefault();
            document.removeEventListener('keydown', introEnterHandler);
            stopIntroAnim();
            beginStep(0);
        }
    }
    document.addEventListener('keydown', introEnterHandler);
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
        // Frame B: all target fingers reach simultaneously
        // setHandGuideToChars resets once then activates all — no second reset clobbers the first
        setHandGuideToChars(introKeyboard, fingerMap, LAYOUT, newKeys);
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
    // Restore active-drill to normal flow (was kept visible but hidden during intro)
    activeDrill.style.position = '';
    activeDrill.style.top = '';
    activeDrill.style.left = '';
    activeDrill.style.width = '';
    activeDrill.style.height = '';
    activeDrill.style.opacity = '';
    activeDrill.style.pointerEvents = '';
    drillModal.classList.add('hidden');

    // Keyboard was pre-built during intro — only rebuild if it somehow ended up empty
    if (drillKeyboard.querySelectorAll('.key').length === 0) {
        console.warn('[TTB] beginStep: keyboard empty, rebuilding (pre-build failed)');
        createKeyboard(drillKeyboard, LAYOUT);
        createHandGuide(drillKeyboard, fingerMap, LAYOUT, true);
    }
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
    drillCharStates     = new Array(drillSequence.length).fill('upcoming');
    drillLetterStatus   = 'clean';
    drillBackspaceOrigin = -1;
    drillConsecutiveMistakes = 0;
    drillIsHardStop = false;
    stepStartTime = Date.now();
    stepSeconds   = 0;

    learnActiveSeconds = 0;
    learnLastInputTime = 0;
    clearInterval(timerInterval);
    clearInterval(learnTickInterval);

    timerInterval = setInterval(() => {
        if (drillPos > 0) stepSeconds++;
        updateHUD();
    }, 1000);

    // Active-time tracking (same pattern as game.js gameTick)
    learnTickInterval = setInterval(() => {
        if (!learnLastInputTime) return;
        const idle = Date.now() - learnLastInputTime;
        if (idle < LEARN_IDLE_THRESHOLD) {
            learnActiveSeconds++;
            statsData.secondsToday++;
            statsData.secondsWeek++;
            // Midnight rollover
            const todayStr = getLocalDateStr();
            if (statsData.lastDate && statsData.lastDate !== todayStr) {
                statsData.secondsToday = 1; statsData.charsToday = 0; statsData.mistakesToday = 0;
                statsData.lastDate = todayStr; dailyGoalCelebrated = false;
                const ws = getWeekStart(new Date());
                if (statsData.weekStart !== ws) {
                    statsData.secondsWeek = 1; statsData.charsWeek = 0; statsData.mistakesWeek = 0;
                    statsData.weekStart = ws; weeklyGoalCelebrated = false;
                }
            }
            // Goal celebrations
            if (goals.dailySeconds > 0 && !dailyGoalCelebrated && statsData.secondsToday >= goals.dailySeconds) {
                dailyGoalCelebrated = true; launchConfetti();
            }
            if (goals.weeklySeconds > 0 && !weeklyGoalCelebrated && statsData.secondsWeek >= goals.weeklySeconds) {
                weeklyGoalCelebrated = true; launchFireworks();
            }
            // Update HUD timer
            if (hudTimer) {
                const m = Math.floor(statsData.secondsToday / 60), s = statsData.secondsToday % 60;
                hudTimer.textContent = m + ':' + String(s).padStart(2,'0');
            }
        }
    }, 1000);

    renderDrillText();
    advanceHandGuide();

    // Set up keypress handling
    drillKeyboard.onkeydown = handleDrillKey;
    // Defer focus until after the browser has painted the keyboard.
    // Then immediately verify it rendered — if not, rebuild right away
    // rather than waiting for the 2-second periodic check.
    // Single rAF for focus — keyboard was pre-built during intro so no timing games needed
    requestAnimationFrame(() => {
        drillKeyboard.focus();
        _hideKeyboardRecovery();
    });

    // Show a static anchor hint below the step label when anchorEnforced is true.
    // This replaces the reactive popup — it informs without alarming.
    const anchorHint = document.getElementById('anchor-hint');
    if (anchorHint) {
        if (currentStep.anchorEnforced && (currentLesson.anchorKeys || []).length) {
            anchorHint.textContent = '💡 Rest your other fingers lightly on the home keys between strokes.';
            anchorHint.style.display = 'block';
        } else {
            anchorHint.style.display = 'none';
        }
    }
}

function buildSequence(step) {
    switch (step.type) {
        case 'key_pattern':
            return step.text.split('');
        case 'key_pattern_auto':
            return generateReachPattern(step.keySet || [], step.groupSize || 4, step.groupCount || 10);
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

// Generates a reach pattern: reach→home→reach→home groups for each new key,
// then mixed groups that interleave all keys together.
// Example with g/h: gfgf jhjh fggf jhhj gfhj fgjh fhgj ...
function generateReachPattern(keySet, groupSize, groupCount) {
    if (!keySet.length) return [];
    groupSize = groupSize || 4;
    groupCount = groupCount || 10;

    // Split into reach keys and home keys (some lessonsets may be pure home row)
    const reachKeys = keySet.filter(k => REACH_HOME_COMPANION[k.toLowerCase()]);
    const homeKeys  = keySet.filter(k => !REACH_HOME_COMPANION[k.toLowerCase()]);

    // Build companion pairs: each reach key paired with its home companion
    const pairs = reachKeys.map(k => ({
        reach: k,
        home: REACH_HOME_COMPANION[k.toLowerCase()]
    }));

    // If no reach keys, fall through to pure random
    if (!pairs.length) return generateRandom(keySet, groupSize, groupCount);

    const groups = [];

    // Phase 1: isolated pairs — reach home reach home for each key separately
    // e.g. gfgf, jhjh
    pairs.forEach(({reach, home}) => {
        const g = [];
        for (let i = 0; i < groupSize; i++) g.push(i % 2 === 0 ? reach : home);
        groups.push(g);
    });

    // Phase 2: reversed pairs — home reach reach home (tests finding the reach from home)
    // e.g. fggf, jhhj
    pairs.forEach(({reach, home}) => {
        const g = [];
        for (let i = 0; i < groupSize; i++) {
            if (i === 0 || i === groupSize - 1) g.push(home);
            else g.push(reach);
        }
        groups.push(g);
    });

    // Phase 3: cross pairs — mix all keys together
    // e.g. gfhj fgjh hgfj
    const allKeys = reachKeys.concat(pairs.map(p => p.home)).concat(homeKeys);
    const uniqueKeys = [...new Set(allKeys)];
    const remaining = groupCount - groups.length;
    for (let i = 0; i < remaining; i++) {
        const g = [];
        // Shuffle-ish: pick keys ensuring reach keys appear often
        for (let j = 0; j < groupSize; j++) {
            const pool = j % 2 === 0 ? reachKeys : uniqueKeys;
            g.push(pool[Math.floor(Math.random() * pool.length)]);
        }
        groups.push(g);
    }

    // Flatten with spaces between groups
    const chars = [];
    groups.forEach((g, i) => {
        if (i > 0) chars.push(' ');
        g.forEach(c => chars.push(c));
    });
    return chars;
}

// Home-key companions: for any reach key, the same finger's home-row key.
// Using the same indices as keyboard.js getHomePositions (rows[1] positions 0-9).
const REACH_HOME_COMPANION = {
    'q':'a','z':'a',                         // left-pinky reaches → a
    'w':'s','x':'s',                         // left-ring reaches → s
    'e':'d','c':'d',                         // left-middle reaches → d
    'r':'f','t':'f','g':'f','v':'f','b':'f', // left-index reaches → f
    'y':'j','u':'j','h':'j','n':'j','m':'j', // right-index reaches → j
    'i':'k',',':'k',                         // right-middle reaches → k
    'o':'l','.':'l',                         // right-ring reaches → l
    'p':';','[':';',']':';','\\':';','\'':';','/':';', // right-pinky reaches → ;
    // Number row — same finger as the letter below
    '1':'a','2':'s','3':'d','4':'f','5':'f',
    '6':'j','7':'j','8':'k','9':'l','0':';'
};

function expandKeySetWithHomeCompanions(keySet) {
    // For each reach key in the set, automatically include its home-row companion
    // so students must use correct finger placement and not cheat with index fingers.
    const expanded = new Set(keySet);
    keySet.forEach(k => {
        const companion = REACH_HOME_COMPANION[k.toLowerCase()];
        if (companion) expanded.add(companion);
    });
    return Array.from(expanded);
}

function generateRandom(keySet, groupSize, groupCount) {
    if (!keySet.length) return [];
    // Always include home companions for reach keys
    const effectiveKeySet = expandKeySetWithHomeCompanions(keySet);
    const chars = [];
    for (let g = 0; g < groupCount; g++) {
        if (g > 0) chars.push(' ');
        for (let i = 0; i < groupSize; i++) {
            chars.push(effectiveKeySet[Math.floor(Math.random() * effectiveKeySet.length)]);
        }
    }
    return chars;
}

// ─── Keypress Handler ─────────────────────────────────────────────────────────
function handleDrillKey(e) {
    // Ignore modifier keys
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    if (e.key === 'CapsLock') return;

    const anchors = (currentStep?.anchorEnforced && currentLesson?.anchorKeys) || [];

    // Silently consume anchor key presses — holding F/J while drilling D/K
    // would otherwise register as repeated wrong keypresses.
    if (anchors.length && e.key.length === 1 && anchors.includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
    }

    // Anchor key reminder is shown as a static hint (not reactive) — see beginStep()

    if (drillPos >= drillSequence.length) return;
    const expected = drillSequence[drillPos];

    // If in hard stop, only the correct key resumes — anything else is ignored
    if (drillIsHardStop) {
        const expected = drillSequence[drillPos];
        const typed = (e.key === 'Enter') ? '\n' : (e.key === 'Tab') ? '\t' : (e.key.length === 1 ? e.key : null);
        if (typed === expected) {
            drillIsHardStop = false;
            drillConsecutiveMistakes = 0;
            // Clear the hard stop overlay and re-enable timer
            const hsEl = document.getElementById('drill-hardstop');
            if (hsEl) hsEl.remove();
            clearInterval(timerInterval);
            timerInterval = setInterval(() => { if (drillPos > 0) stepSeconds++; updateHUD(); }, 1000);
            learnLastInputTime = Date.now();
            // Now process the correct key normally
            flashFingerPressed(drillKeyboard);
            if (drillLetterStatus === 'clean')      drillCharStates[drillPos] = 'perfect';
            else if (drillLetterStatus === 'fixed') drillCharStates[drillPos] = 'fixed';
            else                                     drillCharStates[drillPos] = 'dirty';
            drillPos++;
            if (drillBackspaceOrigin >= 0 && drillPos <= drillBackspaceOrigin) {
                drillLetterStatus = 'fixed';
            } else { drillBackspaceOrigin = -1; drillLetterStatus = 'clean'; }
            renderDrillText();
            if (drillPos >= drillSequence.length) { finishStep(); return; }
            advanceHandGuide();
            updateHUD();
        }
        e.preventDefault(); return;
    }

    let typed = '';
    if (e.key === 'Enter')     typed = '\n';
    else if (e.key === 'Tab')  typed = '\t';
    else if (e.key === 'Backspace') {
        if (drillLetterStatus === 'error') {
            // First backspace: clear current error, become 'fixed'
            drillLetterStatus = 'fixed';
            if (drillBackspaceOrigin < 0) drillBackspaceOrigin = drillPos;
            renderDrillText(false);  // re-render without error highlight
        } else if (drillPos > 0) {
            // Additional backspaces: step back, mark status fixed
            if (drillBackspaceOrigin < 0) drillBackspaceOrigin = drillPos;
            drillPos--;
            drillLetterStatus = 'fixed';
            drillCharStates[drillPos] = 'upcoming'; // un-done the char we stepped back to
            renderDrillText();
            advanceHandGuide();
        }
        e.preventDefault(); return;
    } else if (e.key.length === 1) {
        typed = e.key;
    } else {
        e.preventDefault(); return;
    }
    e.preventDefault();

    // Idle-resume space skip: if the student was idle (> LEARN_IDLE_THRESHOLD)
    // and the current position is a space, skip it once so they don't have to
    // type a space as their first character back. During active typing every
    // space is required as normal.
    const wasIdle = learnLastInputTime > 0 && (Date.now() - learnLastInputTime) > LEARN_IDLE_THRESHOLD;
    if (wasIdle && drillPos < drillSequence.length && drillSequence[drillPos] === ' ') {
        drillPos++;
        if (drillPos >= drillSequence.length) { finishStep(); return; }
    }
    const newExpected = drillSequence[drillPos];

    chars++;
    if (typed === newExpected) {
        flashFingerPressed(drillKeyboard);
        drillConsecutiveMistakes = 0; // reset on any correct key
        learnLastInputTime = Date.now();
        statsData.charsToday++;  statsData.charsWeek++;

        if (drillLetterStatus === 'clean')       drillCharStates[drillPos] = 'perfect';
        else if (drillLetterStatus === 'fixed')  drillCharStates[drillPos] = 'fixed';
        else                                     drillCharStates[drillPos] = 'dirty';

        drillPos++;

        // Keep 'fixed' status until we re-pass the backspace origin
        if (drillBackspaceOrigin >= 0 && drillPos <= drillBackspaceOrigin) {
            drillLetterStatus = 'fixed';
        } else {
            drillBackspaceOrigin = -1;
            drillLetterStatus = 'clean';
        }

        renderDrillText();
        if (drillPos >= drillSequence.length) {
            finishStep();
            return;
        }
        advanceHandGuide();
    } else {
        mistakes++;
        drillConsecutiveMistakes++;
        learnLastInputTime = Date.now();
        statsData.mistakesToday++; statsData.mistakesWeek++;
        if (newExpected !== ' ') {
            missedChars[newExpected] = (missedChars[newExpected] || 0) + 1;
        }
        if (drillLetterStatus === 'clean') drillLetterStatus = 'error';
        flashTargetKey();
        renderDrillText(true);

        if (drillConsecutiveMistakes >= DRILL_SPAM_THRESHOLD) {
            // Spam detected — restart the step with a fresh sequence
            const stepIdx = currentStepIdx;
            clearInterval(timerInterval);
            clearInterval(learnTickInterval);
            const hsEl = document.getElementById('drill-hardstop');
            if (hsEl) hsEl.remove();
            setTimeout(() => beginStep(stepIdx), 400);
            return;
        }
        if (drillConsecutiveMistakes >= DRILL_HARD_STOP_THRESHOLD) {
            // Hard stop — pause timer, show overlay, wait for correct key
            drillIsHardStop = true;
            clearInterval(timerInterval); // freeze time
            _showHardStopOverlay(newExpected);
        }
    }
    updateHUD();
}

// Maintain a set of currently held keys
const heldKeys = new Set();
window.addEventListener('keydown', e => { if (e.key.length === 1) heldKeys.add(e.key.toLowerCase()); });
window.addEventListener('keyup',   e => { if (e.key.length === 1) heldKeys.delete(e.key.toLowerCase()); });



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

    // Render exactly like the book: every character (including space) is the same
    // .dt-char inline-block span with identical min-width and padding.
    // State classes change color only — never dimensions.
    // Groups of non-space chars are wrapped in a nowrap container so CSS
    // line-wrapping never splits a group mid-character. Each trailing space
    // is attached to the end of its preceding group so lines never start
    // with a bare space.

    // Build groups: each group is a run of chars ending with optional space
    const groups = [];
    let cur = [];
    seq.forEach((ch, i) => {
        cur.push({ch, i});
        if (ch === ' ') {
            groups.push(cur);
            cur = [];
        }
    });
    if (cur.length) groups.push(cur);

    let html = '';
    groups.forEach(group => {
        // Wrap group in nowrap so it never splits across lines
        html += '<span style="display:inline-block;white-space:nowrap;">';
        group.forEach(({ch, i}) => {
            // Space displays as &nbsp; — invisible but identical width to any letter
            const disp = (ch === ' ') ? '&nbsp;' : (ch === '\n' ? '↵' : escHtml(ch));
            let cls;
            if (i === drillPos) {
                const errClass = (showError || drillLetterStatus === 'error') ? 'dt-error' : 'dt-current';
                cls = 'dt-char ' + errClass;
                html += '<span class="' + cls + '" id="dt-cursor">' + disp + '</span>';
                return;
            }
            const state = drillCharStates[i] || 'upcoming';
            if      (state === 'perfect')  cls = 'dt-char dt-done';
            else if (state === 'fixed')    cls = 'dt-char dt-fixed';
            else if (state === 'dirty')    cls = 'dt-char dt-dirty';
            else                           cls = 'dt-char dt-upcoming';
            // Spaces: add background-tint class so the state is visible (text is invisible)
            if (ch === ' ' && state === 'fixed') cls += ' dt-space-fixed';
            if (ch === ' ' && state === 'dirty') cls += ' dt-space-dirty';
            html += '<span class="' + cls + '">' + disp + '</span>';
        });
        html += '</span>';
    });

    drillTextEl.innerHTML = html;

    // Scroll cursor into view
    requestAnimationFrame(() => {
        const cursor = document.getElementById('dt-cursor');
        if (cursor) cursor.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
}

function advanceHandGuide() {
    if (drillPos >= drillSequence.length) return;
    const ch = drillSequence[drillPos];
    setHandGuideToChar(drillKeyboard, fingerMap, LAYOUT, ch);
    const info = getFingerInfo(fingerMap, ch);
    toggleKeyboardCase(drillKeyboard, info?.shift || false);

    // Highlight target key. Space bar uses space-active only (shows thumb circles).
    // 'target' is for letter keys only — adding it to space caused persistent dots.
    drillKeyboard.querySelectorAll('.key').forEach(k => k.classList.remove('target'));
    if (ch !== ' ' && info) {
        const el = Array.from(drillKeyboard.querySelectorAll('[data-char]'))
            .find(k => k.dataset.char === info.keyChar);
        if (el) el.classList.add('target');
    }
    // space-active is set by setHandGuideToChar (called above) — no extra work needed

    // Space bar cue: show a small hint so students don't wonder what to press
    const spaceHint = document.getElementById('space-hint');
    if (spaceHint) spaceHint.style.visibility = (ch === ' ') ? 'visible' : 'hidden';
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
    clearInterval(learnTickInterval);
    drillKeyboard.onkeydown = null;
    const spaceHint = document.getElementById('space-hint');
    if (spaceHint) spaceHint.style.visibility = 'hidden';
    const anchorHint = document.getElementById('anchor-hint');
    if (anchorHint) anchorHint.style.display = 'none';
    saveStats(); // write time to Firestore

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

    document.getElementById('dm-title').textContent = 'Step ' + nextIdx + ' of ' + totalSteps + ' done';
    document.getElementById('dm-stars').textContent = '';

    const dailyBadge = (goals.dailySeconds > 0 && statsData.secondsToday >= goals.dailySeconds)
        ? '<span class="goal-badge goal-blue" title="Daily goal reached!">✓</span>' : '';
    const weeklyBadge = (goals.weeklySeconds > 0 && statsData.secondsWeek >= goals.weeklySeconds)
        ? '<span class="goal-badge goal-blue" title="Weekly goal reached!">✓</span>' : '';

    document.getElementById('dm-stats').innerHTML =
        '<div class="dm-stat"><div class="dm-val">' + wpm + '</div><div class="dm-label">WPM</div></div>' +
        '<div class="dm-stat"><div class="dm-val">' + acc + '%</div><div class="dm-label">Accuracy</div></div>';
    document.getElementById('dm-msg').innerHTML =
        '<div class="cumulative-row" style="font-size:0.78rem;margin-bottom:4px;">' +
        dailyBadge +
        '<span>Today: ' + formatTime(statsData.secondsToday) + '</span>' +
        '<span class="cumulative-sep">|</span>' +
        '<span>This week: ' + formatTime(statsData.secondsWeek) + '</span>' +
        weeklyBadge +
        '</div>' +
        '<span style="color:#888;font-size:0.8rem;font-family:monospace;">press Enter to continue</span>';
    document.getElementById('dm-remediation').innerHTML = '';
    const btns = document.getElementById('dm-btns');
    btns.innerHTML = '';

    const mapBtn = document.createElement('button');
    mapBtn.className = 'dm-btn-secondary'; mapBtn.textContent = '← Map';
    const next = document.createElement('button');
    next.className = 'dm-btn-primary'; next.textContent = 'Next Step → (Enter)';

    const advance = () => {
        drillModal.classList.add('hidden');
        document.getElementById('drill-keyboard-wrap').style.display = '';
        document.removeEventListener('keydown', enterHandler);
        beginStep(nextIdx);
    };
    next.onclick = advance;
    mapBtn.onclick = () => {
        document.removeEventListener('keydown', enterHandler);
        drillModal.classList.add('hidden');
        document.getElementById('drill-keyboard-wrap').style.display = '';
        stopLesson();
    };
    btns.appendChild(mapBtn);  // left = back
    btns.appendChild(next);    // right = forward

    function enterHandler(e) {
        if (e.key === 'Enter') { e.preventDefault(); advance(); }
    }
    document.addEventListener('keydown', enterHandler);
}

function showLessonResultModal(wpm, acc) {
    const gates  = currentLesson.gates || {};
    const minWPM = gates.minWPM || 15;
    const minAcc = gates.minAccuracy || 85;

    const grade  = calculateGrade(wpm, acc, minWPM, minAcc);
    const passed = grade === 'B' || grade === 'A' || grade === 'A🔥';
    const countsAsTime = grade !== 'F'; // D and above = time credit

    // Hint toward next grade
    let gradeHint = '';
    if (grade === 'F' || grade === 'D') {
        gradeHint = 'Need ' + minWPM + ' WPM and ' + minAcc + '% accuracy to pass (grade B).';
    } else if (grade === 'C') {
        const needWPM = !( wpm >= minWPM );
        gradeHint = needWPM
            ? (minWPM - wpm) + ' more WPM for a B.'
            : 'Get accuracy to ' + minAcc + '% for a B.';
    } else if (grade === 'B') {
        gradeHint = (Math.ceil(minWPM * 1.15) - wpm) > 0
            ? (Math.ceil(minWPM * 1.15) - wpm) + ' more WPM for an A.'
            : 'Higher accuracy for an A.';
    } else if (grade === 'A') {
        gradeHint = (Math.ceil(minWPM * 1.30) - wpm) > 0
            ? (Math.ceil(minWPM * 1.30) - wpm) + ' more WPM for A 🔥.'
            : '';
    }

    // Save — always if time counts, i.e. grade D or better
    if (currentUser && countsAsTime) saveProgress(passed, wpm, acc, grade);

    drillModal.classList.remove('hidden');
    document.getElementById('drill-keyboard-wrap').style.display = 'none';

    const titleMap = { 'A🔥':'🔥 On Fire!', A:'🎉 Excellent!', B:'✓ Lesson Complete!', C:'Almost…', D:'Keep Going', F:'Not Yet' };
    document.getElementById('dm-title').textContent = titleMap[grade] || 'Done';
    document.getElementById('dm-stars').innerHTML = gradeHTML(grade);
    const rdBadge = (goals.dailySeconds > 0 && statsData.secondsToday >= goals.dailySeconds)
        ? '<span class="goal-badge goal-blue" title="Daily goal!">✓</span>' : '';
    const rwBadge = (goals.weeklySeconds > 0 && statsData.secondsWeek >= goals.weeklySeconds)
        ? '<span class="goal-badge goal-blue" title="Weekly goal!">✓</span>' : '';
    document.getElementById('dm-stats').innerHTML =
        rdBadge +
        '<div class="dm-stat"><div class="dm-val">' + wpm + '</div><div class="dm-label">WPM</div></div>' +
        '<div class="dm-stat"><div class="dm-val">' + acc + '%</div><div class="dm-label">Accuracy</div></div>' +
        '<div class="dm-stat"><div class="dm-val" style="font-size:1.4rem;">' + minWPM + '+</div><div class="dm-label">Target WPM</div></div>' +
        rwBadge;

    const msg = 'You got ' + wpm + ' WPM at ' + acc + '% accuracy.' + (gradeHint ? ' ' + gradeHint : '');
    document.getElementById('dm-msg').innerHTML =
        escHtml(msg) +
        '<div class="cumulative-row" style="font-size:0.78rem;margin-top:4px;">' +
        '<span>Today: ' + formatTime(statsData.secondsToday) + '</span>' +
        '<span class="cumulative-sep">|</span>' +
        '<span>This week: ' + formatTime(statsData.secondsWeek) + '</span>' +
        '</div>';

    // Remediation links for missed chars
    const remMissedKeys = Object.entries(missedChars)
        .filter(([ch, n]) => n >= 3).sort((a,b) => b[1]-a[1]).slice(0,3).map(([ch]) => ch);
    const remText = buildRemediationLinks();
    document.getElementById('dm-remediation').innerHTML = remText;
    // Wire all interactive elements after HTML is inserted
    const pracBtn = document.getElementById('practice-missed-btn');
    if (pracBtn) pracBtn.onclick = () => window._practiceMissedKeys(remMissedKeys);
    document.querySelectorAll('#dm-remediation a[data-lesson-id]').forEach(a => {
        a.href = '#';
        a.onclick = e => { e.preventDefault(); window._gotoLesson(a.dataset.lessonId); };
    });

    const btns = document.getElementById('dm-btns');
    btns.innerHTML = '';

    // Enter key shortcut for primary action
    const enterResultHandler = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.removeEventListener('keydown', enterResultHandler);
            primaryAction();
        }
    };
    document.addEventListener('keydown', enterResultHandler);

    let primaryAction;
    if (passed) {
        const nextLesson = getNextLesson();
        primaryAction = () => {
            document.removeEventListener('keydown', enterResultHandler);
            if (nextLesson) { startLesson(nextLesson); }
            else { window.location.href = 'index.html'; }
        };
        const nextBtn = document.createElement('button');
        nextBtn.className = 'dm-btn-primary';
        nextBtn.textContent = nextLesson ? 'Next Lesson → (Enter)' : '📚 Go to Library';
        nextBtn.onclick = primaryAction;
        const mapBtnP = document.createElement('button');
        mapBtnP.className = 'dm-btn-secondary'; mapBtnP.textContent = '← Map';
        mapBtnP.onclick = () => {
            document.removeEventListener('keydown', enterResultHandler);
            stopLesson();
        };
        btns.appendChild(mapBtnP); // left
        btns.appendChild(nextBtn); // right
    } else {
        primaryAction = () => {
            document.removeEventListener('keydown', enterResultHandler);
            drillModal.classList.add('hidden');
            document.getElementById('drill-keyboard-wrap').style.display = '';
            startLesson(currentLesson);
        };
        const retryBtn = document.createElement('button');
        retryBtn.className = 'dm-btn-primary'; retryBtn.textContent = 'Try Again (Enter)';
        retryBtn.onclick = primaryAction;
        const mapBtnF = document.createElement('button');
        mapBtnF.className = 'dm-btn-secondary'; mapBtnF.textContent = '← Map';
        mapBtnF.onclick = () => {
            document.removeEventListener('keydown', enterResultHandler);
            stopLesson();
        };
        btns.appendChild(mapBtnF); // left
        btns.appendChild(retryBtn); // right
    }
}

function buildRemediationLinks() {
    const top = Object.entries(missedChars)
        .filter(([ch, n]) => n >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    if (!top.length) return '';

    const missedKeys = top.map(([ch]) => ch);

    const links = top.map(([ch]) => {
        const introLesson = allLessons.find(l => (l.newKeys || []).includes(ch));
        if (!introLesson) return null;
        return '<a href="#" data-lesson-id="' + introLesson.id + '">' + ch.toUpperCase() + ' (' + escHtml(introLesson.title) + ')</a>';
    }).filter(Boolean);

    const linkText = links.length
        ? 'You often missed: ' + links.join(', ') + ' — revisit these?'
        : '';

    // Practice button — store keys in data attribute to avoid quoting nightmares
    const practiceBtn = '<button class="dm-btn-secondary" style="margin-top:6px;width:100%;font-size:0.8rem;padding:7px;" '
        + 'id="practice-missed-btn">🎲 Practice missed keys</button>';

    return linkText + practiceBtn;
}

window._practiceMissedKeys = function(missedKeys) {
    if (!missedKeys || !missedKeys.length) return;
    // Build a synthetic key_random step from the missed keys
    const syntheticStep = {
        id: 'remediation',
        label: 'Practice: ' + missedKeys.map(k => k.toUpperCase()).join(' '),
        type: 'key_random',
        keySet: missedKeys,
        groupSize: 5,
        groupCount: 14,
        anchorEnforced: false,
    };
    // Inject as current step and run it
    drillModal.classList.add('hidden');
    document.getElementById('drill-keyboard-wrap').style.display = '';
    // Temporarily replace steps with just this remediation step
    const origSteps = currentLesson.steps;
    currentLesson.steps = [syntheticStep];
    beginStep(0);
    // Restore original steps after the step is set up so finishStep works correctly
    currentLesson.steps = origSteps;
};

window._gotoLesson = function(id) {
    const lesson = allLessons.find(l => l.id === id);
    if (lesson) startLesson(lesson);
};

// ─── Progress Persistence ────────────────────────────────────────────────────
async function saveProgress(passed, wpm, acc, grade) {
    if (!currentUser || !currentLesson) return;
    const prev = userProgress[currentLesson.id] || {};
    const attempts  = (prev.attempts || 0) + 1;
    const timeSpent = (prev.timeSpentSeconds || 0) + stepSeconds;

    // Keep best grade seen — order: F D C B A A🔥
    const GRADE_ORDER = ['F','D','C','B','A','A🔥'];
    const prevGrade   = prev.grade || 'F';
    const bestGrade   = GRADE_ORDER.indexOf(grade) > GRADE_ORDER.indexOf(prevGrade) ? grade : prevGrade;

    const record = {
        lessonId: currentLesson.id,
        completedAt: new Date().toISOString(),
        attempts,
        finalWPM: wpm,
        finalAccuracy: acc,
        timeSpentSeconds: timeSpent,
        passed: passed || prev.passed || false,
        grade: bestGrade,
        // Keep stars field for backward compat with old progress records
        stars: bestGrade === 'A🔥' ? 3 : bestGrade === 'A' ? 3 : bestGrade === 'B' ? 2 : bestGrade === 'C' ? 1 : 0,
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
    clearInterval(learnTickInterval);
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

// ─── Save stats on page unload ───────────────────────────────────────────────
// Ensures time typed in School is persisted even if student navigates away
// mid-lesson without completing a step (which is when saveStats() normally fires).
window.addEventListener('beforeunload', () => {
    if (currentUser && statsData.secondsToday > 0) {
        // Synchronous-style fire-and-forget — navigator.sendBeacon would be ideal
        // but Firestore SDK doesn't support it. setDoc is async; it will usually
        // complete before the tab closes on desktop, and is a best-effort on mobile.
        saveStats();
    }
});

// ─── Caps Lock Warning ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    const capsEl = document.getElementById('caps-warning');
    if (capsEl) capsEl.classList.toggle('hidden', !e.getModifierState('CapsLock'));
});

// ─── Auto-refocus keyboard on click-back ─────────────────────────────────────
function ensureKeyboardFocus() {
    if (!activeDrill.classList.contains('hidden') &&
        drillModal.classList.contains('hidden') &&
        drillKeyboard.onkeydown) {
        drillKeyboard.focus();
    }
}

document.getElementById('active-drill').addEventListener('click', ensureKeyboardFocus);

document.addEventListener('keydown', e => {
    if (e.target !== drillKeyboard) ensureKeyboardFocus();
});

// ─── Keyboard health-check ────────────────────────────────────────────────────
// Re-initialize keyboard if it somehow ends up empty (Safari paint timing edge case).
// Runs whenever the tab becomes visible again and on a periodic interval during drills.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        ensureKeyboardFocus();
        rebuildKeyboardIfNeeded();
    }
});

function _showHardStopOverlay(targetChar) {
    // Remove any existing overlay first
    const existing = document.getElementById('drill-hardstop');
    if (existing) existing.remove();

    let friendly = targetChar;
    if (targetChar === ' ')  friendly = 'Space';
    if (targetChar === '\n') friendly = 'Enter';
    if (targetChar === '\t') friendly = 'Tab';

    const el = document.createElement('div');
    el.id = 'drill-hardstop';
    el.style.cssText = [
        'position:absolute','inset:0','z-index:30',
        'display:flex','flex-direction:column','align-items:center','justify-content:center',
        'background:rgba(255,255,255,0.92)','gap:12px'
    ].join(';');
    el.innerHTML =
        '<div style="font-size:0.9rem;color:#555;font-family:'Courier Prime',monospace;">Too many errors — type the correct key to continue</div>' +
        '<div style="font-size:2rem;font-weight:bold;color:#D32F2F;border:2px solid #D32F2F;border-radius:6px;padding:6px 20px;font-family:'Courier Prime',monospace;">' +
        escHtml(friendly) + '</div>';

    // Attach to drill-keyboard-wrap so it overlays the keyboard area
    const wrap = document.getElementById('drill-keyboard-wrap');
    if (wrap) { wrap.style.position = 'relative'; wrap.appendChild(el); }
}

function _rebuildKeyboard() {
    console.warn('[TTB] Rebuilding keyboard — layout:', LAYOUT, 'step:', currentStepIdx);
    createKeyboard(drillKeyboard, LAYOUT);
    createHandGuide(drillKeyboard, fingerMap, LAYOUT, true);
    colorKeyboardKeys(drillKeyboard, fingerMap, true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        if (currentStep) advanceHandGuide();
        drillKeyboard.focus();
        _hideKeyboardRecovery();
        console.log('[TTB] Keyboard rebuilt OK — keys:', drillKeyboard.querySelectorAll('.key').length);
    }));
}

function _showKeyboardRecovery() {
    let el = document.getElementById('keyboard-recovery');
    if (!el) {
        el = document.createElement('div');
        el.id = 'keyboard-recovery';
        el.style.cssText = [
            'position:absolute', 'inset:0', 'display:flex',
            'align-items:center', 'justify-content:center',
            'background:rgba(0,0,0,0.55)', 'z-index:20',
            'cursor:pointer', 'border-radius:4px'
        ].join(';');
        el.innerHTML = '<div style="background:#fff;padding:16px 24px;border-radius:6px;text-align:center;font-family:monospace;">'
            + '<div style="font-size:1rem;font-weight:bold;margin-bottom:8px;">&#x2328; Keyboard did not load</div>'
            + '<div style="font-size:0.85rem;color:#555;margin-bottom:12px;">Tap to reload it</div>'
            + '<button style="background:var(--carolina-blue);color:white;border:none;padding:8px 20px;border-radius:4px;font-family:inherit;cursor:pointer;font-size:0.9rem;">Reload Keyboard</button>'
            + '</div>';
        el.addEventListener('click', () => { _rebuildKeyboard(); });
        // Wrap in position:relative container
        const wrap = document.getElementById('drill-keyboard-wrap');
        if (wrap) { wrap.style.position = 'relative'; wrap.appendChild(el); }
    }
    el.style.display = 'flex';
}

function _hideKeyboardRecovery() {
    const el = document.getElementById('keyboard-recovery');
    if (el) el.style.display = 'none';
}

function rebuildKeyboardIfNeeded() {
    if (activeDrill.classList.contains('hidden')) return;
    if (drillModal && !drillModal.classList.contains('hidden')) return;
    if (drillKeyboard.querySelectorAll('.key').length === 0) {
        console.warn('[TTB] Periodic check: keyboard empty — showing recovery UI');
        _showKeyboardRecovery();
        _rebuildKeyboard();
    }
}

// Periodic backstop — 1s interval (was 2s) for faster recovery
setInterval(() => {
    if (!activeDrill.classList.contains('hidden') &&
        drillModal.classList.contains('hidden')) {
        rebuildKeyboardIfNeeded();
    }
}, 1000);

// ─── Utils ────────────────────────────────────────────────────────────────────
function escHtml(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return m + ':' + String(s).padStart(2,'0');
}

function getLocalDateStr(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function getWeekStart(date) {
    const d = new Date(date);
    const diff = (d.getDay() + 1) % 7;
    d.setDate(d.getDate() - diff); d.setHours(0,0,0,0);
    return d.getTime();
}

// ─── Stats loading (mirrors game.js) ─────────────────────────────────────────
async function loadUserStats() {
    if (!currentUser) return;
    try {
        const today = new Date();
        const dateStr = getLocalDateStr(today);
        const weekStart = getWeekStart(today);
        const snap = await getDoc(doc(db, 'users', currentUser.uid, 'stats', 'time_tracking'));
        if (snap.exists()) {
            const data = snap.data();
            if (data.lastDate === dateStr) {
                statsData.secondsToday  = data.secondsToday  || 0;
                statsData.charsToday    = data.charsToday    || 0;
                statsData.mistakesToday = data.mistakesToday || 0;
            } else {
                statsData.secondsToday = statsData.charsToday = statsData.mistakesToday = 0;
            }
            if (data.weekStart === weekStart) {
                statsData.secondsWeek  = data.secondsWeek  || 0;
                statsData.charsWeek    = data.charsWeek    || 0;
                statsData.mistakesWeek = data.mistakesWeek || 0;
            } else {
                statsData.secondsWeek = statsData.charsWeek = statsData.mistakesWeek = 0;
            }
        }
        statsData.lastDate  = dateStr;
        statsData.weekStart = weekStart;
    } catch(e) { console.warn('loadUserStats failed:', e); }
}

async function loadGoals() {
    try {
        const snap = await getDoc(doc(db, 'settings', 'goals'));
        if (snap.exists()) {
            const d = snap.data();
            goals.dailySeconds  = d.dailySeconds  || 0;
            goals.weeklySeconds = d.weeklySeconds || 0;
        }
        if (goals.dailySeconds  > 0 && statsData.secondsToday >= goals.dailySeconds)  dailyGoalCelebrated  = true;
        if (goals.weeklySeconds > 0 && statsData.secondsWeek  >= goals.weeklySeconds) weeklyGoalCelebrated = true;
    } catch(e) { console.warn('loadGoals failed:', e); }
}

async function saveStats() {
    if (!currentUser) return;
    try {
        await setDoc(doc(db, 'users', currentUser.uid, 'stats', 'time_tracking'), statsData, { merge: true });
        // Daily log for admin reporting
        const today = getLocalDateStr();
        const logId = currentUser.uid + '_' + today;
        await setDoc(doc(db, 'typing_logs', logId), {
            uid: currentUser.uid, email: currentUser.email || '',
            displayName: currentUser.displayName || 'Anonymous',
            date: today, seconds: statsData.secondsToday || 0,
            chars: statsData.charsToday || 0, mistakes: statsData.mistakesToday || 0,
            lastUpdated: new Date(), source: 'school'
        }, { merge: true });
    } catch(e) { console.warn('saveStats failed:', e); }
}

// ─── Celebration (copied from game.js) ───────────────────────────────────────
function createCelebrationCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    document.body.appendChild(canvas); return canvas;
}

function showGoalToast(message, color) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:' + color + ';color:#000;font-family:"Courier Prime",monospace;font-weight:700;font-size:1.2rem;padding:14px 28px;border-radius:8px;z-index:10000;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 3000);
}

function launchConfetti() {
    const canvas = createCelebrationCanvas();
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const colors = ['#4B9CD3','#FFD700','#FF6B6B','#22c55e','#FF69B4','#FFA500','#9B59B6','#00CED1'];
    const pieces = [];
    for (let i = 0; i < 150; i++) {
        pieces.push({ x: W*0.5+(Math.random()-0.5)*W*0.6, y:-20-Math.random()*100,
            w:6+Math.random()*6, h:10+Math.random()*8, color:colors[Math.floor(Math.random()*colors.length)],
            rotation:Math.random()*Math.PI*2, rotSpeed:(Math.random()-0.5)*0.15,
            vx:(Math.random()-0.5)*4, vy:2+Math.random()*3,
            wobble:Math.random()*Math.PI*2, wobbleSpeed:0.03+Math.random()*0.05 });
    }
    showGoalToast('🎉 Daily Goal Reached!', '#22c55e');
    let frame = 0;
    (function animate() {
        ctx.clearRect(0,0,W,H); let alive=false;
        pieces.forEach(p => {
            p.x+=p.vx+Math.sin(p.wobble)*0.5; p.y+=p.vy; p.vy+=0.04;
            p.rotation+=p.rotSpeed; p.wobble+=p.wobbleSpeed; p.vx*=0.99;
            if(p.y<H+50){ alive=true; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rotation);
                ctx.fillStyle=p.color; ctx.globalAlpha=Math.max(0,1-(frame/200));
                ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore(); }
        });
        frame++; if(alive&&frame<250) requestAnimationFrame(animate); else canvas.remove();
    })();
}

function launchFireworks() {
    const canvas = createCelebrationCanvas();
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const colors = ['#4B9CD3','#FFD700','#FF6B6B','#22c55e','#FF69B4','#FFA500','#9B59B6','#00CED1','#fff'];
    const shells = [], particles = [];
    for(let i=0;i<5;i++) setTimeout(()=>{
        shells.push({x:W*(0.2+Math.random()*0.6),y:H,vy:-(8+Math.random()*4),
            targetY:H*(0.15+Math.random()*0.35),color:colors[Math.floor(Math.random()*colors.length)],exploded:false});
    },i*400);
    showGoalToast('🎆 Weekly Goal Reached!', '#FFD700');
    let frame=0;
    (function animate(){
        ctx.clearRect(0,0,W,H);
        shells.forEach(s=>{
            if(s.exploded)return; s.y+=s.vy; s.vy+=0.12;
            ctx.beginPath();ctx.arc(s.x,s.y,2,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
            if(s.y<=s.targetY||s.vy>=0){
                s.exploded=true;
                for(let i=0;i<80;i++){
                    const angle=(Math.PI*2*i)/80+(Math.random()-0.5)*0.3, speed=2+Math.random()*4;
                    particles.push({x:s.x,y:s.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
                        color:Math.random()>0.3?s.color:colors[Math.floor(Math.random()*colors.length)],
                        life:1.0,decay:0.008+Math.random()*0.012,size:1.5+Math.random()*2});
                }
            }
        });
        for(let i=particles.length-1;i>=0;i--){
            const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.04; p.vx*=0.98; p.life-=p.decay;
            if(p.life<=0){particles.splice(i,1);continue;}
            ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
            ctx.fillStyle=p.color;ctx.globalAlpha=p.life;ctx.fill();
        }
        ctx.globalAlpha=1; frame++;
        if(frame<400&&(particles.length>0||shells.some(s=>!s.exploded))) requestAnimationFrame(animate);
        else canvas.remove();
    })();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// loadLessons fires immediately (lessons collection is public, no auth needed).
// onAuthStateChanged handles ALL rendering — it fires for both signed-in and
// signed-out states, and is the only reliable moment to know auth is settled.
// We must NOT call renderMap() here because auth.currentUser is null at module
// load time even for a returning signed-in user.
const footer = document.querySelector('footer');
if (footer) footer.textContent = 'School v' + LEARN_VERSION + ' / keyboard.js v' + KB_VERSION;

loadLessons(); // fire-and-forget; renderMap() in onAuthStateChanged will re-render when done
