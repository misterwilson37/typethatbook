// lessons-admin.js — TypeThatBook Lesson Panel
// Imported by admin.js. Call initLessonsPanel(db, auth) after auth check.

import {
    collection, getDocs, getDoc, setDoc, deleteDoc, doc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const LESSON_COLLECTION = "lessons";

// ─── STATE ────────────────────────────────────────────────────────────────────
let _db = null;
let _lessonCache = {};   // id → lesson object
let _expandedId = null;  // which lesson card is open

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
export function initLessonsPanel(db) {
    _db = db;
    setupTabSwitching();
    loadAndRenderLessons();
    bindImportUI();
    document.getElementById('lessons-new-btn').addEventListener('click', openNewLessonEditor);
}

// ─── TAB SWITCHING ───────────────────────────────────────────────────────────
function setupTabSwitching() {
    document.getElementById('tab-books').addEventListener('click', () => switchTab('books'));
    document.getElementById('tab-lessons').addEventListener('click', () => switchTab('lessons'));
}

function switchTab(which) {
    document.getElementById('tab-books').classList.toggle('tab-active', which === 'books');
    document.getElementById('tab-lessons').classList.toggle('tab-active', which === 'lessons');
    document.getElementById('books-panel').classList.toggle('hidden', which !== 'books');
    document.getElementById('lessons-panel').classList.toggle('hidden', which !== 'lessons');
}

// ─── LOAD ─────────────────────────────────────────────────────────────────────
async function loadAndRenderLessons() {
    setLessonStatus("Loading lessons from Firestore...", "#888");
    try {
        const snap = await getDocs(collection(_db, LESSON_COLLECTION));
        _lessonCache = {};
        snap.forEach(d => { _lessonCache[d.id] = d.data(); });
        renderLessonList();
        setLessonStatus(`${snap.size} lesson(s) loaded.`, "#00ff41");
    } catch (e) {
        setLessonStatus(`Load failed: ${e.message}`, "#ff3333");
    }
}

// ─── RENDER LIST ─────────────────────────────────────────────────────────────
function renderLessonList() {
    const container = document.getElementById('lesson-list');
    const lessons = Object.values(_lessonCache).sort((a, b) => {
        if (a.unit !== b.unit) return a.unit - b.unit;
        return a.lesson - b.lesson;
    });

    if (lessons.length === 0) {
        container.innerHTML = '<div style="color:#666; padding:20px; text-align:center;">No lessons found. Import a JSON file to get started.</div>';
        return;
    }

    // Group by unit
    const byUnit = {};
    lessons.forEach(l => {
        const u = l.unit || 0;
        if (!byUnit[u]) byUnit[u] = [];
        byUnit[u].push(l);
    });

    const UNIT_LABELS = {
        1: "Unit 1 — Home Row",
        2: "Unit 2 — Index Fingers",
        3: "Unit 3 — Middle Fingers (E, I, W, O)",
        4: "Unit 4 — Remaining Letters",
        5: "Unit 5 — Number Row",
        6: "Unit 6 — Shift & Capitals",
        7: "Unit 7 — Graduation",
    };

    container.innerHTML = Object.keys(byUnit).sort((a,b) => a-b).map(unit => {
        const unitLessons = byUnit[unit];
        const cards = unitLessons.map(l => renderLessonCard(l)).join('');
        return `
            <div class="lesson-unit-header">${UNIT_LABELS[unit] || `Unit ${unit}`}
                <span style="color:#555; font-size:0.8em;">(${unitLessons.length} lesson${unitLessons.length !== 1 ? 's' : ''})</span>
            </div>
            ${cards}`;
    }).join('');

    // Re-bind expand/action buttons
    container.querySelectorAll('.lesson-expand-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleLessonExpand(btn.dataset.id));
    });
    container.querySelectorAll('.lesson-clone-btn').forEach(btn => {
        btn.addEventListener('click', () => cloneLesson(btn.dataset.id));
    });
    container.querySelectorAll('.lesson-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteLesson(btn.dataset.id));
    });

    // Re-open expanded lesson if one was open
    if (_expandedId && _lessonCache[_expandedId]) {
        const editorEl = document.getElementById(`lesson-editor-${_expandedId}`);
        if (editorEl) editorEl.classList.remove('hidden');
    }
}

function renderLessonCard(lesson) {
    const id = lesson.id;
    const isVariant = !!lesson.variantOf;
    const variantBadge = isVariant
        ? `<span style="color:#b87ae8; font-size:0.7em; border:1px solid #5a2a8c; padding:1px 5px; margin-left:6px;">variant of ${escHtml(lesson.variantOf)}</span>`
        : '';
    const stepSummary = (lesson.steps || []).map(s => {
        const icons = { key_pattern:'⌨', key_random:'🎲', word_list:'📝', sentence_list:'💬', passage:'📖' };
        return `<span style="color:#555;" title="${s.label || s.id}">${icons[s.type] || '?'}</span>`;
    }).join(' ');
    const newKeysBadge = (lesson.newKeys || []).length
        ? `<span style="color:#4B9CD3;">[${lesson.newKeys.join(' ')}]</span>` : '';

    return `
        <div class="lesson-card" id="lesson-card-${escHtml(id)}">
            <div class="lesson-card-header">
                <div style="flex:1; overflow:hidden;">
                    <span class="lesson-card-title">${escHtml(lesson.title || id)}</span>
                    ${variantBadge}
                    <span style="color:#444; font-size:0.75em; margin-left:8px;">${escHtml(id)}</span>
                </div>
                <div style="display:flex; gap:6px; align-items:center; white-space:nowrap;">
                    ${newKeysBadge}
                    <span style="color:#555; font-size:0.8em;">${stepSummary}</span>
                    <button class="lesson-clone-btn lbtn lbtn-secondary" data-id="${escHtml(id)}" title="Clone as variant">⎘ Clone</button>
                    <button class="lesson-delete-btn lbtn lbtn-danger" data-id="${escHtml(id)}" title="Delete lesson">✕</button>
                    <button class="lesson-expand-btn lbtn lbtn-primary" data-id="${escHtml(id)}">Edit ▾</button>
                </div>
            </div>
            <div id="lesson-editor-${escHtml(id)}" class="lesson-editor hidden">
                ${buildLessonEditorHTML(lesson)}
            </div>
        </div>`;
}

// ─── LESSON EDITOR HTML ───────────────────────────────────────────────────────
function buildLessonEditorHTML(lesson) {
    const id = lesson.id;
    const steps = lesson.steps || [];

    return `
        <div style="padding:16px; border-top:1px solid #333;">

            <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; margin-bottom:12px;">
                <div>
                    <label class="l-label">Unit</label>
                    <input class="l-field" data-field="unit" type="number" value="${lesson.unit || 1}" min="1" max="9">
                </div>
                <div>
                    <label class="l-label">Lesson #</label>
                    <input class="l-field" data-field="lesson" type="number" value="${lesson.lesson || 1}" min="1">
                </div>
                <div>
                    <label class="l-label">Min Accuracy %</label>
                    <input class="l-field" data-field="gate_accuracy" type="number" value="${(lesson.gates || {}).minAccuracy || 85}" min="0" max="100">
                </div>
                <div>
                    <label class="l-label">Min WPM</label>
                    <input class="l-field" data-field="gate_wpm" type="number" value="${(lesson.gates || {}).minWPM || 15}" min="1">
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <label class="l-label">Title</label>
                <input class="l-field" data-field="title" type="text" value="${escHtml(lesson.title || '')}">
            </div>

            <div style="margin-bottom:12px;">
                <label class="l-label">Intro text (shown before first step)</label>
                <textarea class="l-field" data-field="intro" rows="3">${escHtml(lesson.intro || '')}</textarea>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:16px;">
                <div>
                    <label class="l-label">New Keys (space-separated)</label>
                    <input class="l-field" data-field="newKeys" type="text" value="${(lesson.newKeys || []).join(' ')}">
                </div>
                <div>
                    <label class="l-label">Available Keys (space-separated)</label>
                    <input class="l-field" data-field="availableKeys" type="text" value="${(lesson.availableKeys || []).join(' ')}">
                </div>
                <div>
                    <label class="l-label">Anchor Keys (space-separated)</label>
                    <input class="l-field" data-field="anchorKeys" type="text" value="${(lesson.anchorKeys || []).join(' ')}">
                </div>
            </div>

            <div class="l-steps-header">
                Steps
                <button class="lbtn lbtn-secondary" onclick="window._lessonAddStep('${escHtml(id)}')" style="font-size:0.75em; padding:3px 10px;">+ Add Step</button>
            </div>
            <div id="lesson-steps-${escHtml(id)}">
                ${steps.map((step, idx) => buildStepHTML(id, step, idx)).join('')}
            </div>

            <div style="display:flex; gap:8px; margin-top:16px;">
                <button class="lbtn lbtn-primary" style="flex:2;"
                    onclick="window._lessonSave('${escHtml(id)}')">💾 Save to Firestore</button>
                <button class="lbtn lbtn-secondary"
                    onclick="window._lessonDiscard('${escHtml(id)}')">Cancel</button>
            </div>
        </div>`;
}

function buildStepHTML(lessonId, step, idx) {
    const sid = escHtml(step.id || `s${idx+1}`);
    const type = step.type || 'key_pattern';

    const typeOptions = ['key_pattern','key_random','word_list','sentence_list','passage']
        .map(t => `<option value="${t}" ${t === type ? 'selected' : ''}>${t}</option>`)
        .join('');

    let contentHTML = '';
    if (type === 'key_pattern') {
        contentHTML = `<label class="l-label">Pattern Text</label>
            <textarea class="l-field step-content" data-content="text" rows="2">${escHtml(step.text || '')}</textarea>`;
    } else if (type === 'key_random') {
        contentHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
                <div><label class="l-label">Key Set (space-sep)</label>
                    <input class="l-field step-content" data-content="keySet" type="text" value="${(step.keySet || []).join(' ')}"></div>
                <div><label class="l-label">Group Size</label>
                    <input class="l-field step-content" data-content="groupSize" type="number" value="${step.groupSize || 4}"></div>
                <div><label class="l-label">Group Count</label>
                    <input class="l-field step-content" data-content="groupCount" type="number" value="${step.groupCount || 12}"></div>
            </div>`;
    } else if (type === 'word_list') {
        contentHTML = `<label class="l-label">Words (one per line)</label>
            <textarea class="l-field step-content" data-content="words" rows="6">${(step.words || []).join('\n')}</textarea>`;
    } else if (type === 'sentence_list') {
        contentHTML = `<label class="l-label">Sentences (one per line)</label>
            <textarea class="l-field step-content" data-content="sentences" rows="8">${(step.sentences || []).join('\n')}</textarea>`;
    } else if (type === 'passage') {
        contentHTML = `<label class="l-label">Passage Text</label>
            <textarea class="l-field step-content" data-content="text" rows="5">${escHtml(step.text || '')}</textarea>`;
    }

    return `
        <div class="l-step-card" id="lesson-step-${escHtml(lessonId)}-${idx}" data-step-idx="${idx}">
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
                <input class="l-field step-id" style="flex:1; font-size:0.8em;" placeholder="Step ID (e.g. s1)" value="${sid}" data-content="id">
                <input class="l-field step-label" style="flex:2; font-size:0.8em;" placeholder="Label (e.g. Pattern Drill)" value="${escHtml(step.label || '')}" data-content="label">
                <select class="l-field step-type-select" style="flex:1.5; font-size:0.8em;">${typeOptions}</select>
                <label style="display:flex; align-items:center; gap:4px; color:#888; font-size:0.75em; white-space:nowrap;">
                    <input type="checkbox" class="step-anchor" ${step.anchorEnforced ? 'checked' : ''}> Anchors
                </label>
                <button class="lbtn lbtn-danger" style="padding:2px 8px; font-size:0.75em;"
                    onclick="window._lessonDeleteStep('${escHtml(lessonId)}', ${idx})">✕</button>
            </div>
            <div class="step-content-area">${contentHTML}</div>
        </div>`;
}

// ─── EXPAND / COLLAPSE ────────────────────────────────────────────────────────
function toggleLessonExpand(id) {
    const editorEl = document.getElementById(`lesson-editor-${id}`);
    if (!editorEl) return;
    const isOpen = !editorEl.classList.contains('hidden');
    if (isOpen) {
        editorEl.classList.add('hidden');
        _expandedId = null;
    } else {
        // Collapse any other open editor
        document.querySelectorAll('.lesson-editor').forEach(el => el.classList.add('hidden'));
        editorEl.classList.remove('hidden');
        _expandedId = id;
    }
}

// ─── SAVE ─────────────────────────────────────────────────────────────────────
window._lessonSave = async function(id) {
    const editorEl = document.getElementById(`lesson-editor-${id}`);
    if (!editorEl) return;

    // Collect base fields
    const getField = (field) => editorEl.querySelector(`[data-field="${field}"]`)?.value?.trim() ?? '';

    const lesson = {
        id,
        unit: parseInt(getField('unit')) || 1,
        lesson: parseInt(getField('lesson')) || 1,
        title: getField('title'),
        intro: getField('intro'),
        newKeys: getField('newKeys').split(/\s+/).filter(Boolean),
        availableKeys: getField('availableKeys').split(/\s+/).filter(Boolean),
        anchorKeys: getField('anchorKeys').split(/\s+/).filter(Boolean),
        gates: {
            minAccuracy: parseInt(getField('gate_accuracy')) || 85,
            minWPM: parseInt(getField('gate_wpm')) || 15,
        },
        steps: [],
    };

    // Carry over variantOf if present
    if (_lessonCache[id]?.variantOf) {
        lesson.variantOf = _lessonCache[id].variantOf;
    }

    // Collect steps
    const stepCards = editorEl.querySelectorAll('.l-step-card');
    stepCards.forEach(card => {
        const stepType = card.querySelector('.step-type-select')?.value || 'key_pattern';
        const step = {
            id: card.querySelector('[data-content="id"]')?.value?.trim() || '',
            label: card.querySelector('[data-content="label"]')?.value?.trim() || '',
            type: stepType,
            anchorEnforced: card.querySelector('.step-anchor')?.checked || false,
        };

        // Type-specific fields
        if (stepType === 'key_pattern' || stepType === 'passage') {
            step.text = card.querySelector('[data-content="text"]')?.value?.trim() || '';
        } else if (stepType === 'key_random') {
            step.keySet = (card.querySelector('[data-content="keySet"]')?.value || '').split(/\s+/).filter(Boolean);
            step.groupSize = parseInt(card.querySelector('[data-content="groupSize"]')?.value) || 4;
            step.groupCount = parseInt(card.querySelector('[data-content="groupCount"]')?.value) || 12;
        } else if (stepType === 'word_list') {
            step.words = (card.querySelector('[data-content="words"]')?.value || '').split('\n').map(w => w.trim()).filter(Boolean);
        } else if (stepType === 'sentence_list') {
            step.sentences = (card.querySelector('[data-content="sentences"]')?.value || '').split('\n').map(s => s.trim()).filter(Boolean);
        }

        lesson.steps.push(step);
    });

    try {
        await setDoc(doc(_db, LESSON_COLLECTION, id), lesson);
        _lessonCache[id] = lesson;
        setLessonStatus(`Saved: ${lesson.title || id}`, "#00ff41");
        renderLessonList();
    } catch (e) {
        setLessonStatus(`Save failed: ${e.message}`, "#ff3333");
        alert(`Save failed: ${e.message}`);
    }
};

window._lessonDiscard = function(id) {
    const editorEl = document.getElementById(`lesson-editor-${id}`);
    if (editorEl) editorEl.classList.add('hidden');
    _expandedId = null;
};

// ─── ADD / DELETE STEPS ───────────────────────────────────────────────────────
window._lessonAddStep = function(lessonId) {
    const stepsContainer = document.getElementById(`lesson-steps-${lessonId}`);
    if (!stepsContainer) return;
    const idx = stepsContainer.querySelectorAll('.l-step-card').length;
    const newStep = {
        id: `s${idx + 1}`,
        label: 'New Step',
        type: 'sentence_list',
        anchorEnforced: false,
        sentences: [],
    };
    stepsContainer.insertAdjacentHTML('beforeend', buildStepHTML(lessonId, newStep, idx));
};

window._lessonDeleteStep = function(lessonId, idx) {
    const card = document.getElementById(`lesson-step-${lessonId}-${idx}`);
    if (card && confirm('Delete this step?')) card.remove();
};

// ─── CLONE ────────────────────────────────────────────────────────────────────
async function cloneLesson(id) {
    const original = _lessonCache[id];
    if (!original) return;

    // Find next available variant ID
    let newId = id + '_v2';
    let attempt = 2;
    while (_lessonCache[newId]) {
        attempt++;
        newId = id + '_v' + attempt;
    }

    const clone = JSON.parse(JSON.stringify(original));
    clone.id = newId;
    clone.title = (original.title || id) + ' (Variant)';
    clone.variantOf = id;

    try {
        await setDoc(doc(_db, LESSON_COLLECTION, newId), clone);
        _lessonCache[newId] = clone;
        setLessonStatus(`Cloned → ${newId}`, "#b87ae8");
        renderLessonList();
        // Auto-expand the new clone
        setTimeout(() => toggleLessonExpand(newId), 100);
    } catch (e) {
        setLessonStatus(`Clone failed: ${e.message}`, "#ff3333");
    }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
async function deleteLesson(id) {
    const lesson = _lessonCache[id];
    if (!lesson) return;
    if (!confirm(`Delete lesson "${lesson.title || id}"?\n\nThis cannot be undone.`)) return;
    try {
        await deleteDoc(doc(_db, LESSON_COLLECTION, id));
        delete _lessonCache[id];
        setLessonStatus(`Deleted: ${id}`, "#ff9999");
        renderLessonList();
    } catch (e) {
        setLessonStatus(`Delete failed: ${e.message}`, "#ff3333");
        alert(`Delete failed: ${e.message}`);
    }
}

// ─── NEW LESSON ───────────────────────────────────────────────────────────────
function openNewLessonEditor() {
    const existingIds = Object.keys(_lessonCache);
    const maxUnit = Math.max(0, ...existingIds.map(id => _lessonCache[id].unit || 0));
    const newLesson = {
        id: `u${maxUnit + 1}_l1_new`,
        unit: maxUnit + 1,
        lesson: 1,
        title: 'New Lesson',
        intro: '',
        newKeys: [],
        availableKeys: [],
        anchorKeys: [],
        gates: { minAccuracy: 85, minWPM: 15 },
        steps: [{
            id: 's1', label: 'Step 1', type: 'sentence_list',
            anchorEnforced: false, sentences: [],
        }],
    };
    _lessonCache[newLesson.id] = newLesson;
    renderLessonList();
    setTimeout(() => toggleLessonExpand(newLesson.id), 100);
}

// ─── IMPORT JSON ─────────────────────────────────────────────────────────────
function bindImportUI() {
    const previewBtn = document.getElementById('lessons-import-preview');
    const importBtn = document.getElementById('lessons-import-commit');
    const textarea = document.getElementById('lessons-import-json');
    const previewArea = document.getElementById('lessons-import-preview-area');
    const fileInput = document.getElementById('lessons-import-file');

    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => { textarea.value = e.target.result; };
            reader.readAsText(file);
        });
    }

    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            try {
                const parsed = parseImportJSON(textarea.value);
                previewArea.innerHTML = `<span style="color:#00ff41;">✓ ${parsed.length} lesson(s) ready to import.</span> ` +
                    parsed.slice(0, 5).map(l => `<span style="color:#888;">${escHtml(l.id)}</span>`).join(' ') +
                    (parsed.length > 5 ? ` <span style="color:#555;">+${parsed.length - 5} more</span>` : '');
                importBtn.disabled = false;
                importBtn._parsed = parsed;
            } catch (e) {
                previewArea.innerHTML = `<span style="color:#ff3333;">Parse error: ${escHtml(e.message)}</span>`;
                importBtn.disabled = true;
            }
        });
    }

    if (importBtn) {
        importBtn.disabled = true;
        importBtn.addEventListener('click', async () => {
            const lessons = importBtn._parsed;
            if (!lessons || lessons.length === 0) return;
            const overwrite = _lessonCache && Object.keys(_lessonCache).length > 0;
            if (overwrite && !confirm(`This will overwrite existing lessons in Firestore. Continue?`)) return;

            importBtn.disabled = true;
            importBtn.textContent = 'Importing...';
            let done = 0, failed = 0;

            for (const lesson of lessons) {
                try {
                    await setDoc(doc(_db, LESSON_COLLECTION, lesson.id), lesson);
                    done++;
                    setLessonStatus(`Importing... ${done}/${lessons.length}`, "#888");
                } catch (e) {
                    failed++;
                    console.error(`Failed to import ${lesson.id}:`, e);
                }
            }

            importBtn.textContent = 'Import All to Firestore';
            importBtn.disabled = false;
            setLessonStatus(`Import complete: ${done} succeeded, ${failed} failed.`, done > 0 ? "#00ff41" : "#ff3333");
            await loadAndRenderLessons();
            // Collapse import UI
            document.getElementById('lessons-import-section').classList.add('hidden');
            document.getElementById('lessons-import-toggle').textContent = '▶ Import JSON';
        });
    }

    // Toggle import section visibility
    const toggleBtn = document.getElementById('lessons-import-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const sec = document.getElementById('lessons-import-section');
            const isHidden = sec.classList.contains('hidden');
            sec.classList.toggle('hidden', !isHidden);
            toggleBtn.textContent = isHidden ? '▼ Import JSON' : '▶ Import JSON';
        });
    }
}

function parseImportJSON(text) {
    const parsed = JSON.parse(text);
    // Accept either array of lessons or { lessons: [...] }
    const arr = Array.isArray(parsed) ? parsed : parsed.lessons;
    if (!Array.isArray(arr)) throw new Error('Expected an array of lessons or { lessons: [...] }');
    if (arr.length === 0) throw new Error('No lessons found in JSON');
    arr.forEach((l, i) => {
        if (!l.id) throw new Error(`Lesson at index ${i} has no id field`);
    });
    return arr;
}

// ─── PUBLIC RELOAD (for toolbar button) ──────────────────────────────────────
window._lessonsReload = () => loadAndRenderLessons();

// ─── UTILS ───────────────────────────────────────────────────────────────────
function setLessonStatus(msg, color = "#888") {
    const el = document.getElementById('lessons-status');
    if (el) { el.textContent = msg; el.style.borderColor = color; }
}

function escHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
