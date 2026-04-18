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
    document.getElementById('tab-books').addEventListener('click',    () => switchTab('books'));
    document.getElementById('tab-lessons').addEventListener('click',  () => switchTab('lessons'));
    document.getElementById('tab-students').addEventListener('click', () => switchTab('students'));
    document.getElementById('tab-classes').addEventListener('click',  () => switchTab('classes'));
}

function switchTab(which) {
    ['books','lessons','students','classes'].forEach(t => {
        document.getElementById('tab-' + t).classList.toggle('tab-active', which === t);
        document.getElementById(t + '-panel').classList.toggle('hidden', which !== t);
    });
    if (which === 'students') initStudentsPanel();
    if (which === 'classes')  initClassesPanel();
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
        const icons = { key_pattern:'⌨', key_pattern_auto:'🎯', key_random:'🎲', word_list:'📝', sentence_list:'💬', passage:'📖' };
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

    const typeOptions = ['key_pattern','key_pattern_auto','key_random','word_list','sentence_list','passage']
        .map(t => `<option value="${t}" ${t === type ? 'selected' : ''}>${t}</option>`)
        .join('');

    let contentHTML = '';
    if (type === 'key_pattern') {
        contentHTML = `<label class="l-label">Pattern Text</label>
            <textarea class="l-field step-content" data-content="text" rows="2">${escHtml(step.text || '')}</textarea>`;
    } else if (type === 'key_pattern_auto') {
        contentHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
                <div><label class="l-label">Keys (space-sep)</label>
                    <input class="l-field step-content" data-content="keySet" type="text" value="${(step.keySet || []).join(' ')}" placeholder="e.g. g h"></div>
                <div><label class="l-label">Group Size</label>
                    <input class="l-field step-content" data-content="groupSize" type="number" value="${step.groupSize || 4}"></div>
                <div><label class="l-label">Group Count</label>
                    <input class="l-field step-content" data-content="groupCount" type="number" value="${step.groupCount || 10}"></div>
            </div>
            <div style="color:#888; font-size:0.75em; margin-top:4px;">🎯 Auto-generates reach→home pattern (e.g. gfgf jhjh fggf jhhj mixed…)</div>`;
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
        } else if (stepType === 'key_pattern_auto') {
            step.keySet     = (card.querySelector('[data-content="keySet"]')?.value || '').trim().split(/[ ,]+/).filter(Boolean);
            step.groupSize  = parseInt(card.querySelector('[data-content="groupSize"]')?.value) || 4;
            step.groupCount = parseInt(card.querySelector('[data-content="groupCount"]')?.value) || 10;
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
    const previewBtn  = document.getElementById('lessons-import-preview');
    const importBtn   = document.getElementById('lessons-import-commit');
    const textarea    = document.getElementById('lessons-import-json');
    const previewArea = document.getElementById('lessons-import-preview-area');
    const errorArea   = document.getElementById('lessons-import-error');
    const summaryEl   = document.getElementById('lessons-import-summary');
    const breakdownEl = document.getElementById('lessons-import-breakdown');
    const progressEl  = document.getElementById('lessons-import-progress');
    const fileInput   = document.getElementById('lessons-import-file');

    function showError(msg) {
        previewArea.classList.add('hidden');
        errorArea.classList.remove('hidden');
        errorArea.textContent = '✗ ' + msg;
        importBtn.disabled = true;
        importBtn.style.opacity = '0.4';
        importBtn._parsed = null;
    }

    function showPreview(parsed) {
        errorArea.classList.add('hidden');
        previewArea.classList.remove('hidden');

        // Summary line
        summaryEl.textContent = '✓ ' + parsed.length + ' lesson' + (parsed.length !== 1 ? 's' : '') + ' ready to upload';

        // Breakdown by unit
        const byUnit = {};
        parsed.forEach(l => {
            const u = 'Unit ' + (l.unit || '?');
            byUnit[u] = (byUnit[u] || 0) + 1;
        });
        breakdownEl.innerHTML = Object.entries(byUnit)
            .map(([u, n]) => '<span style="margin-right:16px;">' + escHtml(u) + ': ' + n + ' lesson' + (n !== 1 ? 's' : '') + '</span>')
            .join('');

        importBtn.disabled = false;
        importBtn.style.opacity = '1';
        importBtn._parsed = parsed;
    }

    function runPreview() {
        const text = textarea.value.trim();
        if (!text) { showError('Nothing to parse — upload a file or paste JSON.'); return; }
        try {
            showPreview(parseImportJSON(text));
        } catch (e) {
            showError(e.message);
        }
    }

    // File upload → populate textarea → auto-preview
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => { textarea.value = ev.target.result; runPreview(); };
            reader.readAsText(file);
        });
    }

    // Paste → requires clicking Check JSON (textarea doesn't know when paste is done)
    if (previewBtn) previewBtn.addEventListener('click', runPreview);

    // Also auto-preview on textarea input after a short pause
    if (textarea) {
        let debounce;
        textarea.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(runPreview, 600);
        });
    }

    // Commit
    if (importBtn) {
        importBtn.disabled = true;
        importBtn.style.opacity = '0.4';

        importBtn.addEventListener('click', async () => {
            const lessons = importBtn._parsed;
            if (!lessons || !lessons.length) return;

            importBtn.disabled = true;
            importBtn.style.opacity = '0.4';
            progressEl.textContent = 'Starting…';

            let done = 0, failed = 0;
            for (const lesson of lessons) {
                try {
                    await setDoc(doc(_db, LESSON_COLLECTION, lesson.id), lesson);
                    done++;
                    const pct = Math.round((done / lessons.length) * 100);
                    progressEl.textContent = 'Uploading… ' + done + ' / ' + lessons.length + '  (' + pct + '%)';
                    setLessonStatus('Uploading… ' + done + ' / ' + lessons.length, '#888');
                } catch (e) {
                    failed++;
                    console.error('Failed:', lesson.id, e);
                }
            }

            const ok = failed === 0;
            const msg = ok
                ? ('✓ Done — ' + done + ' lesson' + (done !== 1 ? 's' : '') + ' uploaded.')
                : ('⚠ ' + done + ' uploaded, ' + failed + ' failed — check console.');
            progressEl.textContent = msg;
            progressEl.style.color = ok ? '#00ff41' : '#ffaa00';
            setLessonStatus(msg, ok ? '#00ff41' : '#ffaa00');

            // Re-enable with updated count
            importBtn.disabled = false;
            importBtn.style.opacity = '1';
            importBtn.textContent = 'Upload to Firestore';

            await loadAndRenderLessons();
        });
    }

    // Toggle import panel
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




async function loadStudentProgress(uid, label) {
    _currentStudentUid = uid;
    const secEl    = document.getElementById('student-progress-section');
    const lblEl    = document.getElementById('student-selected-label');
    const gridEl   = document.getElementById('student-lesson-grid');
    const assignEl = document.getElementById('student-class-assign');
    const statusEl = document.getElementById('student-class-status');

    lblEl.textContent = label;
    // Reset to lessons pane on new student selection
    document.querySelectorAll('.progress-tab-btn').forEach(b => {
        const active = b.dataset.pane === 'lessons';
        b.style.borderBottomColor = active ? '#4B9CD3' : 'transparent';
        b.style.color = active ? '#4B9CD3' : '#666';
    });
    document.getElementById('student-pane-lessons').style.display = '';
    document.getElementById('student-pane-books').style.display   = 'none';
    document.getElementById('student-book-grid').innerHTML = '<span style="color:#555;">Click the Books tab to load.</span>';
    gridEl.innerHTML  = '<span style="color:#888;">Loading…</span>';
    secEl.classList.remove('hidden');

    // Show class assignment UI and populate dropdown
    if (assignEl) {
        assignEl.classList.remove('hidden');
        refreshClassDropdownInStudents();

        // Read current class assignment for this student
        try {
            const userSnap = await getDoc(doc(_db, 'users', uid));
            const currentClassId = userSnap.exists() ? (userSnap.data().classId || '') : '';
            const sel = document.getElementById('student-class-select');
            if (sel) sel.value = currentClassId;
        } catch(e) { /* non-critical */ }

        // Wire save button
        const saveBtn = document.getElementById('student-class-save-btn');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const classId = document.getElementById('student-class-select').value;
                if (statusEl) { statusEl.textContent = 'Saving…'; statusEl.style.color = '#888'; }
                try {
                    await setDoc(doc(_db, 'users', uid),
                        { classId: classId || null }, { merge: true });
                    if (statusEl) { statusEl.textContent = classId ? 'Assigned.' : 'Removed.'; statusEl.style.color = '#00ff41'; }
                } catch(e) {
                    if (statusEl) { statusEl.textContent = 'Error: ' + e.message; statusEl.style.color = '#ff4444'; }
                }
            };
        }
    }

    try {
        // Load their progress sub-collection
        const snap = await getDocs(collection(_db, 'users', uid, 'lessonProgress'));
        const progress = {};
        snap.forEach(d => { progress[d.id] = d.data(); });

        // Get ordered lesson list from cache
        const lessonList = Object.values(_lessonCache)
            .sort((a, b) => (a.unit !== b.unit ? a.unit - b.unit : a.lesson - b.lesson));

        gridEl.innerHTML = '';
        lessonList.forEach(lesson => {
            const prog   = progress[lesson.id];
            const passed = prog?.passed || false;
            const grade  = prog?.grade  || (prog?.stars ? ['','C','B','A'][Math.min(prog.stars,3)] : '');
            const hasAny = !!prog;

            const card = document.createElement('div');
            card.style.cssText = [
                'background:' + (passed ? '#0a220a' : hasAny ? '#1a1500' : '#1a1a1a'),
                'border:1px solid ' + (passed ? '#1a4a1a' : hasAny ? '#443300' : '#333'),
                'border-radius:4px',
                'padding:8px 10px',
                'font-size:0.78em',
                'cursor:pointer',
                'transition:border-color 0.15s'
            ].join(';');

            card.innerHTML =
                '<div style="font-weight:bold; color:#aaa; margin-bottom:2px;">' + escHtml(lesson.id) + '</div>' +
                '<div style="color:#666; font-size:0.9em; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + escHtml(lesson.title || '') + '</div>' +
                '<div style="font-size:1.1em; font-weight:bold; color:' + (passed ? '#22c55e' : hasAny ? '#FFD700' : '#444') + ';">' +
                (grade || (passed ? 'B' : hasAny ? '…' : '—')) + '</div>' +
                '<div style="font-size:0.8em; color:#555; margin-top:2px;">' + (passed ? '✓ passed' : hasAny ? 'attempted' : 'not started') + '</div>';

            card.title = passed ? 'Click to LOCK (remove progress)' : 'Click to UNLOCK (mark as passed)';

            card.addEventListener('click', () => toggleStudentLesson(uid, lesson, prog, card, label));
            gridEl.appendChild(card);
        });

    } catch (e) {
        gridEl.innerHTML = '<span style="color:#ff4444;">Error: ' + escHtml(e.message) + '</span>';
    }
}

async function toggleStudentLesson(uid, lesson, existingProg, card, label) {
    const hasProg  = !!existingProg;
    const isPassed = existingProg?.passed || false;
    const docRef   = doc(_db, 'users', uid, 'lessonProgress', lesson.id);

    if (isPassed) {
        // Lock — remove progress entirely
        if (!confirm('Remove ALL progress for "' + lesson.title + '" for this student?\n\nThis cannot be undone.')) return;
        try {
            await deleteDoc(docRef);
            card.style.background = '#1a1a1a';
            card.style.borderColor = '#333';
            card.querySelector('div:nth-child(3)').textContent = '—';
            card.querySelector('div:nth-child(3)').style.color = '#444';
            card.querySelector('div:nth-child(4)').textContent = 'not started';
            card.title = 'Click to UNLOCK (mark as passed)';
        } catch (e) { alert('Failed: ' + e.message); }

    } else {
        // Unlock — write a passed record
        const action = hasProg ? 'Mark as PASSED' : 'Unlock and mark as PASSED';
        if (!confirm(action + ': "' + lesson.title + '" for this student?')) return;
        try {
            const record = {
                lessonId: lesson.id,
                completedAt: new Date().toISOString(),
                passed: true,
                grade: 'B',
                adminOverride: true,
                attempts: existingProg?.attempts || 1,
                finalWPM: existingProg?.finalWPM || 0,
                finalAccuracy: existingProg?.finalAccuracy || 0,
                timeSpentSeconds: existingProg?.timeSpentSeconds || 0
            };
            await setDoc(docRef, record, { merge: true });
            card.style.background = '#0a220a';
            card.style.borderColor = '#1a4a1a';
            card.querySelector('div:nth-child(3)').textContent = 'B';
            card.querySelector('div:nth-child(3)').style.color = '#22c55e';
            card.querySelector('div:nth-child(4)').textContent = '✓ passed';
            card.title = 'Click to LOCK (remove progress)';
        } catch (e) { alert('Failed: ' + e.message); }
    }
}


// ─── CLASSES PANEL ────────────────────────────────────────────────────────────
let _classesPanelInited = false;
let _classCache = {};  // classId → { name, dailySeconds, weeklySeconds }

function initClassesPanel() {
    if (_classesPanelInited) { renderClassList(); return; }
    _classesPanelInited = true;

    const saveBtn   = document.getElementById('class-save-btn');
    const cancelBtn = document.getElementById('class-cancel-btn');
    if (saveBtn)   saveBtn.onclick   = saveClass;
    if (cancelBtn) cancelBtn.onclick = cancelClassEdit;

    loadAndRenderClasses();
}

async function loadAndRenderClasses() {
    try {
        const snap = await getDocs(collection(_db, 'classes'));
        _classCache = {};
        snap.forEach(d => { _classCache[d.id] = { id: d.id, ...d.data() }; });
        renderClassList();
    } catch(e) {
        document.getElementById('class-list').innerHTML =
            '<span style="color:#ff4444;">Load failed: ' + escHtml(e.message) + '</span>';
    }
}

function renderClassList() {
    const listEl = document.getElementById('class-list');
    const classes = Object.values(_classCache).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    if (!classes.length) {
        listEl.innerHTML = '<div style="color:#555; font-size:0.82em;">No classes yet. Create one above.</div>';
        return;
    }

    listEl.innerHTML = '';
    classes.forEach(cls => {
        const dm = Math.floor((cls.dailySeconds || 0) / 60);
        const wm = Math.floor((cls.weeklySeconds || 0) / 60);
        const card = document.createElement('div');
        card.style.cssText = 'background:#1a1a1a;border:1px solid #333;border-radius:4px;padding:12px 16px;display:flex;align-items:center;gap:12px;';
        card.innerHTML =
            '<div style="flex:1;">' +
            '<div style="font-weight:bold;color:#eee;margin-bottom:2px;">' + escHtml(cls.name || cls.id) + '</div>' +
            '<div style="font-size:0.75em;color:#666;">' +
            'Daily: ' + dm + 'min&nbsp;&nbsp;Weekly: ' + wm + 'min' +
            '&nbsp;&nbsp;<span style="color:#444;">ID: ' + escHtml(cls.id) + '</span>' +
            '</div>' +
            '</div>' +
            '<button class="lbtn lbtn-secondary class-edit-btn" style="width:auto;padding:4px 12px;font-size:0.78em;" data-id="' + escHtml(cls.id) + '">Edit</button>' +
            '<button class="lbtn" style="width:auto;padding:4px 12px;font-size:0.78em;background:#500;border:1px solid #800;color:#fcc;" class="class-del-btn" data-id="' + escHtml(cls.id) + '">Delete</button>';

        card.querySelector('.class-edit-btn').onclick = () => startClassEdit(cls.id);
        card.querySelector('[data-id="' + cls.id + '"]:last-child').onclick = () => deleteClass(cls.id);
        listEl.appendChild(card);
    });

    // Also refresh assign dropdown in students panel if it's visible
    refreshClassDropdownInStudents();
}

async function saveClass() {
    const nameVal   = (document.getElementById('class-name-input').value || '').trim();
    const dailyMin  = parseInt(document.getElementById('class-daily-input').value) || 0;
    const weeklyMin = parseInt(document.getElementById('class-weekly-input').value) || 0;
    const editId    = document.getElementById('class-edit-id').value;
    const statusEl  = document.getElementById('class-form-status');

    if (!nameVal) { statusEl.textContent = 'Name is required.'; statusEl.style.color = '#ff6666'; return; }

    const record = {
        name: nameVal,
        dailySeconds:  dailyMin  * 60,
        weeklySeconds: weeklyMin * 60,
        updatedAt: new Date().toISOString(),
    };

    try {
        let classId = editId;
        if (!classId) {
            // Generate a slug-like ID from name
            classId = nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') +
                      '_' + Date.now().toString(36);
            record.createdAt = new Date().toISOString();
        }
        await setDoc(doc(_db, 'classes', classId), record, { merge: true });
        _classCache[classId] = { id: classId, ...record };
        statusEl.textContent = editId ? 'Saved.' : 'Class created.';
        statusEl.style.color = '#00ff41';
        cancelClassEdit();
        renderClassList();
    } catch(e) {
        statusEl.textContent = 'Error: ' + e.message;
        statusEl.style.color = '#ff6666';
    }
}

function startClassEdit(classId) {
    const cls = _classCache[classId];
    if (!cls) return;
    document.getElementById('class-edit-id').value     = classId;
    document.getElementById('class-name-input').value  = cls.name || '';
    document.getElementById('class-daily-input').value = Math.floor((cls.dailySeconds || 0) / 60);
    document.getElementById('class-weekly-input').value= Math.floor((cls.weeklySeconds || 0) / 60);
    document.getElementById('class-form-title').textContent = 'Edit Class';
    document.getElementById('class-cancel-btn').style.display = '';
    document.getElementById('class-form-status').textContent = '';
    document.getElementById('class-name-input').focus();
}

function cancelClassEdit() {
    document.getElementById('class-edit-id').value     = '';
    document.getElementById('class-name-input').value  = '';
    document.getElementById('class-daily-input').value = 10;
    document.getElementById('class-weekly-input').value= 50;
    document.getElementById('class-form-title').textContent = 'New Class';
    document.getElementById('class-cancel-btn').style.display = 'none';
    document.getElementById('class-form-status').textContent = '';
}

async function deleteClass(classId) {
    const cls = _classCache[classId];
    if (!confirm('Delete class "' + (cls ? cls.name : classId) + '"?\n\nStudents in this class will revert to default goals.')) return;
    try {
        await deleteDoc(doc(_db, 'classes', classId));
        delete _classCache[classId];
        renderClassList();
    } catch(e) { alert('Delete failed: ' + e.message); }
}

function refreshClassDropdownInStudents() {
    const sel = document.getElementById('student-class-select');
    if (sel) {
        const current = sel.value;
        sel.innerHTML = '<option value="">— No class (default goals) —</option>';
        Object.values(_classCache).sort((a,b) => (a.name||'').localeCompare(b.name||'')).forEach(cls => {
            const opt = document.createElement('option');
            opt.value = cls.id; opt.textContent = cls.name || cls.id;
            if (cls.id === current) opt.selected = true;
            sel.appendChild(opt);
        });
    }
    if (document.getElementById('student-filter-class')) _buildClassFilterDropdown();
    if (document.getElementById('student-bulk-class'))   _buildBulkClassDropdown();
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

// ─── STUDENTS PANEL ─────────────────────────────────────────────────────────
let _studentsInited    = false;
let _currentStudentUid = null;
let _rosterData        = [];   // [{uid, name, email, lastLogin, weekSeconds, classId}]
let _rosterSort        = { col: 'last', dir: -1 };
let _csvParsed         = [];
let _selectedUids      = new Set();

function initStudentsPanel() {
    if (_studentsInited) {
        _buildClassFilterDropdown();
        _buildBulkClassDropdown();
        return;
    }
    _studentsInited = true;

    // Ensure _classCache is loaded (may not be if Classes tab never opened)
    if (Object.keys(_classCache).length === 0) {
        getDocs(collection(_db, 'classes')).then(snap => {
            snap.forEach(d => { _classCache[d.id] = { id: d.id, ...d.data() }; });
            _buildClassFilterDropdown();
            _buildBulkClassDropdown();
        }).catch(() => {});
    }

    document.getElementById('student-refresh-btn')
        .addEventListener('click', () => { _rosterData = []; _selectedUids.clear(); loadStudentRoster(); });
    document.getElementById('student-filter-time')
        .addEventListener('change', _renderRoster);
    document.getElementById('student-filter-class')
        .addEventListener('change', _renderRoster);
    document.getElementById('student-filter-text')
        .addEventListener('input', _renderRoster);

    // Sort headers
    document.getElementById('student-roster-table')
        .querySelectorAll('.roster-sort').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.dataset.col;
                _rosterSort.dir = (_rosterSort.col === col) ? -_rosterSort.dir : -1;
                _rosterSort.col = col;
                _renderRoster();
            });
        });

    // Select-all checkbox
    document.getElementById('student-select-all').addEventListener('change', e => {
        const checked = e.target.checked;
        document.querySelectorAll('.student-row-cb').forEach(cb => {
            cb.checked = checked;
            const uid = cb.dataset.uid;
            if (checked) _selectedUids.add(uid); else _selectedUids.delete(uid);
        });
        _updateBulkBar();
    });

    // Bulk bar buttons
    document.getElementById('student-bulk-assign-btn').addEventListener('click', _bulkAssign);
    document.getElementById('student-bulk-cancel-btn').addEventListener('click', () => {
        _selectedUids.clear();
        document.querySelectorAll('.student-row-cb').forEach(cb => cb.checked = false);
        document.getElementById('student-select-all').checked = false;
        _updateBulkBar();
    });

    // CSV
    document.getElementById('student-csv-toggle-btn')
        .addEventListener('click', () => {
            document.getElementById('student-csv-section').classList.toggle('hidden');
        });
    document.getElementById('student-csv-file')
        .addEventListener('change', e => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => { document.getElementById('student-csv-paste').value = ev.target.result; };
            reader.readAsText(file);
        });
    document.getElementById('student-csv-preview-btn').addEventListener('click', _previewCSV);
    document.getElementById('student-csv-commit-btn').addEventListener('click', _commitCSV);

    // Progress tabs
    document.querySelectorAll('.progress-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pane = btn.dataset.pane;
            document.querySelectorAll('.progress-tab-btn').forEach(b => {
                const active = b.dataset.pane === pane;
                b.style.borderBottomColor = active ? '#4B9CD3' : 'transparent';
                b.style.color = active ? '#4B9CD3' : '#666';
            });
            document.getElementById('student-pane-lessons').style.display = pane === 'lessons' ? '' : 'none';
            document.getElementById('student-pane-books').style.display   = pane === 'books'   ? '' : 'none';
            if (pane === 'books' && _currentStudentUid) _loadStudentBooks(_currentStudentUid);
        });
    });

    loadStudentRoster();
}

// ── Bulk selection ─────────────────────────────────────────────────────────────
function _updateBulkBar() {
    const bar = document.getElementById('student-bulk-bar');
    const cnt = document.getElementById('student-bulk-count');
    const n   = _selectedUids.size;
    if (n > 0) {
        bar.style.display = 'flex';
        cnt.textContent   = n + ' student' + (n !== 1 ? 's' : '') + ' selected';
    } else {
        bar.style.display = 'none';
    }
}

function _buildBulkClassDropdown() {
    const sel = document.getElementById('student-bulk-class');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">— No class (clear) —</option>';
    Object.values(_classCache).sort((a,b) => (a.name||'').localeCompare(b.name||'')).forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls.id; opt.textContent = cls.name || cls.id;
        if (cls.id === cur) opt.selected = true;
        sel.appendChild(opt);
    });
}

async function _bulkAssign() {
    const classId = document.getElementById('student-bulk-class').value;
    const btn     = document.getElementById('student-bulk-assign-btn');
    const uids    = [..._selectedUids];
    btn.disabled  = true; btn.textContent = 'Saving…';

    let ok = 0;
    for (const uid of uids) {
        try {
            await setDoc(doc(_db, 'users', uid), { classId: classId || null }, { merge: true });
            const r = _rosterData.find(r => r.uid === uid);
            if (r) r.classId = classId || '';
            ok++;
        } catch(e) { /* continue */ }
    }

    btn.disabled  = false; btn.textContent = 'Assign';
    _selectedUids.clear();
    document.querySelectorAll('.student-row-cb').forEach(cb => cb.checked = false);
    document.getElementById('student-select-all').checked = false;
    _updateBulkBar();
    _renderRoster();
}

// ── Roster loading ─────────────────────────────────────────────────────────────
async function loadStudentRoster() {
    const statusEl = document.getElementById('student-list-status');
    const tableEl  = document.getElementById('student-roster-table');
    statusEl.textContent = 'Loading students…';
    tableEl.style.display = 'none';

    try {
        const logSnap  = await getDocs(collection(_db, 'typing_logs'));
        const byUid    = new Map();
        const today    = new Date();
        const weekStart = _localDateStr(_weekStartDate(today));

        logSnap.forEach(d => {
            const data = d.data();
            const uid  = data.uid || ''; if (!uid) return;
            const date = data.date || '';
            const secs = data.seconds || 0;
            if (!byUid.has(uid)) {
                byUid.set(uid, { name: data.displayName || '', email: data.email || '',
                                 lastLogin: date, weekSeconds: 0, classId: '' });
            }
            const row = byUid.get(uid);
            if (!row.name  && data.displayName) row.name  = data.displayName;
            if (!row.email && data.email)        row.email = data.email;
            if (date > row.lastLogin)             row.lastLogin = date;
            if (date >= weekStart)                row.weekSeconds += secs;
        });

        const uidList = [...byUid.keys()];
        await Promise.all(uidList.map(async uid => {
            try {
                const snap = await getDoc(doc(_db, 'users', uid));
                if (snap.exists()) byUid.get(uid).classId = snap.data().classId || '';
            } catch(e) {}
        }));

        _rosterData = uidList.map(uid => ({ uid, ...byUid.get(uid) }));
        _buildClassFilterDropdown();
        _buildBulkClassDropdown();
        _renderRoster();
        statusEl.textContent = _rosterData.length + ' students loaded.';
        tableEl.style.display = '';
    } catch(e) {
        statusEl.textContent = 'Error: ' + escHtml(e.message);
    }
}

function _weekStartDate(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - ((d.getDay() + 1) % 7));
    return d;
}

function _localDateStr(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function _buildClassFilterDropdown() {
    const sel = document.getElementById('student-filter-class');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="all">All classes</option><option value="none">Unassigned</option>';
    Object.values(_classCache).sort((a,b) => (a.name||'').localeCompare(b.name||'')).forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls.id; opt.textContent = cls.name || cls.id;
        if (cls.id === cur) opt.selected = true;
        sel.appendChild(opt);
    });
}

// ── Render filtered/sorted roster ─────────────────────────────────────────────
function _renderRoster() {
    const timeFilter  = document.getElementById('student-filter-time').value;
    const classFilter = document.getElementById('student-filter-class').value;
    const textFilter  = (document.getElementById('student-filter-text').value || '').toLowerCase().trim();
    const tbody       = document.getElementById('student-roster-body');

    const today = new Date();
    let cutoff  = '';
    if (timeFilter === '7days')  { const d = new Date(today); d.setDate(d.getDate()-7);   cutoff = _localDateStr(d); }
    if (timeFilter === 'month')  { const d = new Date(today); d.setDate(d.getDate()-30);  cutoff = _localDateStr(d); }
    if (timeFilter === '9weeks') { const d = new Date(today); d.setDate(d.getDate()-63);  cutoff = _localDateStr(d); }

    let rows = _rosterData.filter(r => {
        if (cutoff && r.lastLogin < cutoff) return false;
        if (classFilter === 'none' && r.classId) return false;
        if (classFilter !== 'all' && classFilter !== 'none' && r.classId !== classFilter) return false;
        if (textFilter && !r.name.toLowerCase().includes(textFilter) &&
                          !r.email.toLowerCase().includes(textFilter)) return false;
        return true;
    });

    const col = _rosterSort.col, dir = _rosterSort.dir;
    rows.sort((a, b) => {
        let av, bv;
        if (col === 'name')  { av = a.name;       bv = b.name; }
        if (col === 'email') { av = a.email;       bv = b.email; }
        if (col === 'last')  { av = a.lastLogin;   bv = b.lastLogin; }
        if (col === 'week')  { av = a.weekSeconds; bv = b.weekSeconds; }
        if (col === 'class') { av = _classCache[a.classId]?.name || ''; bv = _classCache[b.classId]?.name || ''; }
        if (av < bv) return dir; if (av > bv) return -dir; return 0;
    });

    // Update sort indicators
    document.querySelectorAll('.roster-sort').forEach(th => {
        const base = th.dataset.col === 'name' ? 'Name' : th.dataset.col === 'email' ? 'Email' :
                     th.dataset.col === 'last' ? 'Last Login' : th.dataset.col === 'week' ? 'This Week' : 'Class';
        th.textContent = base + (th.dataset.col === col ? (dir === -1 ? ' ↓' : ' ↑') : ' ↕');
    });

    const statusEl = document.getElementById('student-list-status');
    statusEl.textContent = rows.length + ' student' + (rows.length !== 1 ? 's' : '') +
        (rows.length !== _rosterData.length ? ' (filtered from ' + _rosterData.length + ')' : '') + '.';

    tbody.innerHTML = '';
    rows.forEach(r => {
        const wm     = Math.floor(r.weekSeconds / 60);
        const ws     = r.weekSeconds % 60;
        const cls    = _classCache[r.classId];
        const clsName = cls ? cls.name : (r.classId ? r.classId : '—');
        const isSelected = _selectedUids.has(r.uid);

        const tr = document.createElement('tr');
        tr.style.cssText = 'border-bottom:1px solid #222; cursor:pointer;' +
            (isSelected ? 'background:#0d1e2e;' : '');

        const cbCell = document.createElement('td');
        cbCell.style.cssText = 'padding:6px 8px; width:28px;';
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.className = 'student-row-cb';
        cb.dataset.uid = r.uid; cb.checked = isSelected;
        cb.addEventListener('change', e => {
            e.stopPropagation();
            if (cb.checked) _selectedUids.add(r.uid); else _selectedUids.delete(r.uid);
            tr.style.background = cb.checked ? '#0d1e2e' : '';
            _updateBulkBar();
        });
        cbCell.appendChild(cb);
        tr.appendChild(cbCell);

        tr.innerHTML += '<td style="padding:6px 8px; color:#ddd;">'  + escHtml(r.name || '—')   + '</td>' +
            '<td style="padding:6px 8px; color:#777;">'  + escHtml(r.email || '—')  + '</td>' +
            '<td style="padding:6px 8px; color:#777;">'  + escHtml(r.lastLogin || '—') + '</td>' +
            '<td style="padding:6px 8px; color:#aaa; font-family:monospace;">' +
                wm + ':' + String(ws).padStart(2,'0') + '</td>' +
            '<td style="padding:6px 8px; color:' + (cls ? '#4B9CD3' : '#444') + ';">' +
                escHtml(clsName) + '</td>';

        tr.addEventListener('mouseenter', () => { if (!cb.checked) tr.style.background = '#161616'; });
        tr.addEventListener('mouseleave', () => { if (!cb.checked) tr.style.background = ''; });
        tr.addEventListener('click', e => {
            if (e.target === cb || e.target.type === 'checkbox') return;
            document.querySelectorAll('#student-roster-body tr').forEach(t => {
                if (!t.querySelector('.student-row-cb')?.checked) t.style.outline = '';
            });
            tr.style.outline = '1px solid #4B9CD3';
            loadStudentProgress(r.uid, (r.name || r.email) + ' (' + r.email + ')');
        });
        tbody.appendChild(tr);
    });

    if (rows.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" style="padding:20px; text-align:center; color:#555;">No students match the current filters.</td>';
        tbody.appendChild(tr);
    }
}

// ── CSV Import ─────────────────────────────────────────────────────────────────
async function _previewCSV() {
    const raw       = document.getElementById('student-csv-paste').value.trim();
    const areaEl    = document.getElementById('student-csv-preview-area');
    const commitBtn = document.getElementById('student-csv-commit-btn');
    const loadingEl = document.getElementById('student-csv-loading');
    _csvParsed      = [];
    commitBtn.disabled = true;

    if (!raw) { areaEl.innerHTML = '<span style="color:#ff6666;">No CSV data.</span>'; return; }

    // Ensure classes are loaded before previewing
    if (Object.keys(_classCache).length === 0) {
        if (loadingEl) { loadingEl.style.display = ''; loadingEl.textContent = 'Loading classes…'; }
        try {
            const snap = await getDocs(collection(_db, 'classes'));
            snap.forEach(d => { _classCache[d.id] = { id: d.id, ...d.data() }; });
            _buildClassFilterDropdown();
            _buildBulkClassDropdown();
        } catch(e) {}
        if (loadingEl) loadingEl.style.display = 'none';
    }

    const lines    = raw.split(/\r?\n/).filter(l => l.trim());
    // Split on first comma only to handle class names containing commas
    const rows     = lines.map(l => {
        const idx = l.indexOf(',');
        return idx === -1 ? [l.trim(), ''] : [l.slice(0, idx).trim(), l.slice(idx+1).trim()];
    }).map(cols => cols.map(c => c.replace(/^"|"$/g, '').trim()));

    const hasHeader = rows[0][0].toLowerCase() === 'email' || !rows[0][0].includes('@');
    const dataRows  = hasHeader ? rows.slice(1) : rows;

    const classLookup = new Map();
    Object.values(_classCache).forEach(cls => {
        classLookup.set((cls.name || '').toLowerCase(), cls.id);
        classLookup.set(cls.id.toLowerCase(), cls.id);
    });

    const emailToUid = new Map();
    _rosterData.forEach(r => { if (r.email) emailToUid.set(r.email.toLowerCase(), r.uid); });

    let html = '<table style="width:100%; border-collapse:collapse;">' +
        '<tr style="color:#666; border-bottom:1px solid #333;">' +
        '<th style="text-align:left; padding:3px 6px;">Email</th>' +
        '<th style="text-align:left; padding:3px 6px;">Class</th>' +
        '<th style="text-align:left; padding:3px 6px;">Status</th></tr>';

    dataRows.forEach(cols => {
        const email   = (cols[0] || '').toLowerCase().trim();
        const clsRaw  = (cols[1] || '').trim();
        const uid     = emailToUid.get(email);
        const classId = classLookup.get(clsRaw.toLowerCase());
        const clsName = classId ? (_classCache[classId]?.name || classId) : null;

        let status, ok = false;
        if (!email)    { status = '<span style="color:#555;">empty</span>'; }
        else if (!uid) { status = '<span style="color:#ffaa00;">not found in logs</span>'; }
        else if (!clsRaw) { status = '<span style="color:#888;">will clear class</span>'; ok = true; }
        else if (!classId) { status = '<span style="color:#ff6666;">class not found: ' + escHtml(clsRaw) + '</span>'; }
        else { status = '<span style="color:#22c55e;">✓ → ' + escHtml(clsName) + '</span>'; ok = true; }

        if (ok) _csvParsed.push({ uid, email, classId: classId || '' });

        html += '<tr style="border-bottom:1px solid #111;">' +
            '<td style="padding:2px 6px; color:#ccc;">' + escHtml(email) + '</td>' +
            '<td style="padding:2px 6px; color:#aaa;">' + escHtml(clsRaw || '—') + '</td>' +
            '<td style="padding:2px 6px;">' + status + '</td></tr>';
    });
    html += '</table>';
    areaEl.innerHTML = html;

    if (_csvParsed.length > 0) {
        commitBtn.disabled = false;
        areaEl.innerHTML += '<div style="margin-top:6px; color:#22c55e;">' +
            _csvParsed.length + ' row' + (_csvParsed.length !== 1 ? 's' : '') + ' ready to commit.</div>';
    } else {
        areaEl.innerHTML += '<div style="margin-top:6px; color:#ffaa00;">No valid rows found. Check that class names match exactly and that students have typing logs.</div>';
    }
}

async function _commitCSV() {
    if (!_csvParsed.length) return;
    const commitBtn = document.getElementById('student-csv-commit-btn');
    const areaEl    = document.getElementById('student-csv-preview-area');
    commitBtn.disabled = true;
    areaEl.innerHTML += '<div style="color:#888; margin-top:6px;">Writing…</div>';

    let ok = 0, fail = 0;
    for (const { uid, classId } of _csvParsed) {
        try {
            await setDoc(doc(_db, 'users', uid), { classId: classId || null }, { merge: true });
            const r = _rosterData.find(r => r.uid === uid);
            if (r) r.classId = classId || '';
            ok++;
        } catch(e) { fail++; }
    }

    areaEl.innerHTML += '<div style="color:#22c55e; margin-top:4px;">✓ Done: ' +
        ok + ' assigned' + (fail ? ', ' + fail + ' failed.' : '.') + '</div>';
    _csvParsed = [];
    _renderRoster();
}

// ── Book progress (Books pane) ─────────────────────────────────────────────────
async function _loadStudentBooks(uid) {
    const el = document.getElementById('student-book-grid');
    if (!el) return;
    el.innerHTML = '<span style="color:#888;">Loading book progress…</span>';

    try {
        const snap = await getDocs(collection(_db, 'users', uid, 'progress'));
        if (snap.empty) { el.innerHTML = '<span style="color:#555;">No book progress recorded.</span>'; return; }

        const books = [];
        snap.forEach(d => { books.push({ id: d.id, ...d.data() }); });

        // Sort by lastUpdated desc
        books.sort((a, b) => {
            const at = a.lastUpdated?.seconds || 0;
            const bt = b.lastUpdated?.seconds || 0;
            return bt - at;
        });

        let html = '<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:8px;">';
        books.forEach(b => {
            const title   = b.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const chap    = b.chapter || b.furthestChapter || '?';
            const fChap   = b.furthestChapter || chap;
            const updated = b.lastUpdated?.seconds
                ? new Date(b.lastUpdated.seconds * 1000).toLocaleDateString()
                : '—';
            html += '<div style="background:#1a1a1a; border:1px solid #333; border-radius:4px; padding:10px;">' +
                '<div style="font-weight:bold; color:#ddd; margin-bottom:4px; font-size:0.82em;">' + escHtml(title) + '</div>' +
                '<div style="font-size:0.75em; color:#666;">Current: Ch. ' + escHtml(String(chap)) + '</div>' +
                '<div style="font-size:0.75em; color:#555;">Furthest: Ch. ' + escHtml(String(fChap)) + '</div>' +
                '<div style="font-size:0.72em; color:#444; margin-top:4px;">' + escHtml(updated) + '</div>' +
                '</div>';
        });
        html += '</div>';
        el.innerHTML = html;
    } catch(e) {
        el.innerHTML = '<span style="color:#ff4444;">Error: ' + escHtml(e.message) + '</span>';
    }
}
