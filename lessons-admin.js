// lessons-admin.js — TypeThatBook Lesson Panel v1.20.0
//
// v1.20.0 — ⚠️ ROADMAP 59: A CLASS CARD SAYS WHOSE IT IS, AND THE LIST FILTERS.
//           Jake: "there is zero indication on this page as to which teacher or
//           school these classes belong to."
//           ⭐ THE DATA WAS ALREADY THERE. Every class document carries
//           `schoolId` and `teacherUids` and _classCache held both all along —
//           the card simply never printed them. Only the id→name lookups needed
//           fetching, and both are lazy and cached (§READS).
//           ⚠️⚠️ THE FILTER NARROWS AN ALREADY-SCOPED LIST AND IS NOT WHAT SCOPES
//           IT. firestore.rules and _scope decide what a building_admin may READ;
//           clearing these dropdowns can never widen it. A filter that WERE the
//           boundary would leak the moment somebody reset it.
//           ⚠️ Options come from the classes IN VIEW, not from the whole staff or
//           school list — offering a teacher whose classes this account cannot
//           read is a filter that can only return nothing, and it leaks that they
//           exist.
//           ⚠️ The bar hides entirely for a teacher: two empty dropdowns over one
//           person's own classes read as broken, not absent.
//           ⚠️ initClassFilters() runs AFTER the first paint — blocking the list
//           on label lookups would let a failed lookup cost the whole panel.
//
// v1.19.0 — ⚠️⚠️ TWO CONTROLS THAT DID NOTHING, AND THE CAUSE IS ONE RULE.
//           `Cancel` never appeared while editing a class, and the Lessons pane
//           stayed hidden on every student open. Both are hidden by the CLASS
//           `u-display-none`, and both were revealed by setting the INLINE
//           `style.display = ''` — which REMOVES the inline declaration and lets
//           the class win. A real value ('none', 'block') beats a class; '' loses
//           to one, every time.
//           ⭐ SAME FAMILY AS ROUND 64's DEAD HOVERS, INVERTED. THE RULE THAT
//           COVERS BOTH: whatever declares the state is what has to change it.
//           ⚠️ build-list-test.mjs P1 is a CLASS GUARD over every element hidden
//           this way, and it found six across three files.
//
// v1.18.0 — ⚠️⚠️ ROADMAP 58, THE COLLAPSE STEP: THE WEEK ANCHOR HAS ONE HOME.
//           `(getDay() + 1) % 7` was written out SIX times across the repo. Two of
//           them had ALREADY drifted once, and the symptom was that Saturday's
//           typing sat inside the number on a child's screen and outside the
//           teacher's report — every evening, which is when a teacher grades.
//           This file's week function is a SHAPE ADAPTER now: daylog.js's
//           weekStartOf() owns the rule, and this converts the argument type its
//           callers already use. ⚠️ DO NOT REINTRODUCE THE ARITHMETIC.
//           ⚠️ THE ANCHOR IS STILL HARDCODED TO SATURDAY, DELIBERATELY — a round
//           that collapses AND configures cannot tell a collapse bug from an
//           anchor bug. Making it per-class is ROADMAP 58 step two.
//           ⚠️ week-agreement-test.mjs Part B2 now DISCOVERS every .js/.html in
//           the repo and fails if any but daylog.js contains that expression.
//
// v1.17.0 — ⚠️⚠️ THE CLASS MANAGER'S DELETE BUTTON CARRIED TWO `class`
//           ATTRIBUTES. HTML keeps the first and silently discards the second, so
//           `class-del-btn` was never on the element. Two consequences, and both
//           were live: the click had to be found by `[data-id]:last-child` —
//           correct only for as long as Delete stays the last child — and the
//           HOVER WAS DEAD, because the inline `background:#500` beat
//           `.lbtn:hover` exactly as the eighteen inline backgrounds in admin.js
//           v3.42.0 did. That is ROADMAP 56c's second button, and Jake found it
//           by hovering.
//           ⚠️ `.lbtn-danger` already declared this exact treatment AND a hover,
//           four lines apart in admin.html; the inline copy was a second spelling
//           of a rule that already existed. Both are gone.
//
// v1.16.0 — ⚠️⚠️ THE LESSON-TRAFFIC SIGNAL FIRED ON ALMOST EVERY ROW, AND THE
// SWEEP SPENT ~4,000 READS WITHOUT SAYING SO. Both found by Jake on the first
// real run, over 138 students.
//   1. v1.15.0 flagged anything above 3 runs/student. The real median is ~6-7,
//      so "replayed after passing" appeared on nearly every line. ⚠️ THAT IS
//      §0.-20.B's ALARM THAT IS ALWAYS ON — a signal on every row is decoration,
//      and it teaches a teacher to stop reading the column. The threshold is now
//      RELATIVE (twice this scan's MEDIAN, min 8 students) because a constant
//      chosen without data cannot know what normal looks like in this building.
//   2. Ordering by runs/student alone put ONE-STUDENT lessons above 97-student
//      ones. Flagged rows lead now; small samples are listed but never flagged.
//   3. ⚠️ THIS FILE WAS NOT METERED. It imported Firestore directly, so
//      ttbMeter never saw the most expensive click in the app. Now imports
//      ./read-meter.js (a URL swap), warns before scanning >40 students, and
//      prints the actual read count next to the results.
//
// v1.15.0 — ⭐ ROADMAP §10.H — THE MEASUREMENT JAKE ASKED FOR FIRST, unbuilt for
// five rounds and shipped here for ZERO EXTRA READS. scanForStuck() already reads
// every record it needs — one lessonProgress subcollection per filtered student —
// so the per-lesson aggregate rides the same sweep. A second button would have
// re-read ~300 documents to answer a neighbouring question about the same data.
// ⚠️⚠️ TWO COLUMNS, NOT ONE: replay-rate high with a HIGH pass rate is the strong
// ones coasting; the same number with a LOW pass rate is the struggling ones
// grinding. Opposite problems, opposite fixes, and one "attempts" column cannot
// tell them apart. ⚠️ It sums runAttempts, NOT `attempts` — a student stuck on
// run 2 of 12 has attempts: 0 and is exactly who this is looking for (§0.-13).
// ⚠️ A🔥 counts are recorded from 2026-08-25 onward only; a dash means NOT
// RECORDED, not zero earned, and the table footnote says so.
//
// v1.14.0 — ⚠️⚠️ ROADMAP 11 — A STUDENT IN A CLASS BUT NOT A SCHOOL. THREE
//           writers assigned a class and only TWO wrote schoolId; the
//           single-student save and _bulkAssign() sent classId alone, so the
//           student had NO building — visible under "All schools", invisible
//           under their own, missing from every school-filtered report. Jake's
//           own son, three rounds running. ⚠️ _schoolIdForClass() is now the ONE
//           answerer and it FALLS BACK TO THE CLASS DOCUMENT: _classCache is
//           filled when the CLASSES panel opens, so a fix reading it directly
//           would have looked right and written '' exactly as the bug did.
//           ⚠️ The CSV lookup is PER ROW — a rollover file can name a different
//           class on every line. tests/class-assign-test.mjs.
//
// v1.13.2 — HEADER ONLY, NO CODE. Four older entries moved to CHANGELOG.md
//           § ARCHIVED FILE HEADERS; this file was over the build panel's
//           entry budget. See versions.js v1.12.0.
//
// ⚠️ v1.13.1's ENTRY IS IN CHANGELOG.md § ARCHIVED FILE HEADERS (Round 76).
// ⚠️ v1.13.0's ENTRY IS IN CHANGELOG.md § ARCHIVED FILE HEADERS (Round 74).
// ⚠️ v1.12.0's ENTRY IS IN CHANGELOG.md § ARCHIVED FILE HEADERS (Round 71).
// ⚠️ v1.11.0's ENTRY IS IN CHANGELOG.md § ARCHIVED FILE HEADERS (Round 64).
// It is the read-side of the source split.
//
// ⚠️ v1.13.2 — v1.8.1, v1.8.0, v1.7.1 and v1.7.0 moved to CHANGELOG.md
//    § ARCHIVED FILE HEADERS. Nothing deleted.
//
window.LESSONS_ADMIN_VERSION = '1.20.0';

// ⚠️ ROADMAP 58 — the week anchor, from its one home. daylog.js imports only
// logdays.js, which this page's siblings already load, so this adds no machinery.
import { weekStartOf } from "./daylog.js";
import {
    collection, getDocs, getDoc, setDoc, deleteDoc, doc, query, orderBy, where
} from "./read-meter.js";   // ⚠️ METERED. read-meter.js re-exports the whole SDK
// with the billable calls wrapped, so this is a URL swap and nothing else.
// Jake, 2026-08-25, after a 138-student scan: "There's nothing in the console
// letting me know how many reads/writes it used." This file was one of THREE
// still importing Firestore directly and therefore invisible to the meter —
// the others were staff-admin.js and school-audit.html. ⚠️ A PAGE THAT IS NOT
// METERED IS A PAGE WHOSE COST NOBODY CAN SEE, and admin pages are where the
// expensive sweeps live. ttbMeter.report() in the console, any time.


const LESSON_COLLECTION = "lessons";

// ─── STATE ────────────────────────────────────────────────────────────────────
let _db = null;
let _lessonCache = {};   // id → lesson object
let _expandedId = null;  // which lesson card is open

// Who's using this panel. Populated by admin.js from the staff/{uid} document.
// Defaults to the most restrictive thing rather than the most permissive: with
// no role and no schools, scoped queries return nothing instead of everything.
let _scope = { uid: null, role: null, schoolIds: [], readScope: 'own_classes' };
const _isSuper = () => _scope.role === 'super_admin';

// How far back the student roster looks. It's a "who's been active lately" list,
// not an archive — it never needed the whole history.
const ROSTER_DAYS = 45;

// Set by admin.js. Called when the Staff tab is opened, and after any class
// create/delete so a teacher's claim.classIds can be re-derived — otherwise they
// can't read the class they just made.
let _onStaffTab = null;
let _onClassesChanged = null;
export function setStaffHooks({ onStaffTab, onClassesChanged }) {
    _onStaffTab = onStaffTab || null;
    _onClassesChanged = onClassesChanged || null;
}

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
export function initLessonsPanel(db, scope) {
    _db = db;
    if (scope) _scope = { uid: scope.uid || null,
                          role: scope.role || null,
                          schoolIds: scope.schoolIds || [],
                          readScope: scope.readScope || 'own_classes' };
    setupTabSwitching();
    loadAndRenderLessons();
    bindImportUI();
    bindExportUI();
    document.getElementById('lessons-new-btn').addEventListener('click', openNewLessonEditor);
}

// ─── TAB SWITCHING ───────────────────────────────────────────────────────────
function setupTabSwitching() {
    document.getElementById('tab-books').addEventListener('click',    () => switchTab('books'));
    document.getElementById('tab-lessons').addEventListener('click',  () => switchTab('lessons'));
    document.getElementById('tab-students').addEventListener('click', () => switchTab('students'));
    const staffBtn = document.getElementById('tab-staff');
    if (staffBtn) staffBtn.addEventListener('click', () => switchTab('staff'));
    document.getElementById('tab-classes').addEventListener('click',  () => switchTab('classes'));
}

function switchTab(which) {
    ['books','lessons','students','classes','staff'].forEach(t => {
        const btn = document.getElementById('tab-' + t);
        if (!btn) return;
        btn.classList.toggle('tab-active', which === t);
        const panel = document.getElementById(t + '-panel');
        if (panel) panel.classList.toggle('hidden', which !== t);
    });
    if (which === 'students') initStudentsPanel();
    if (which === 'classes')  initClassesPanel();
    if (which === 'staff' && _onStaffTab) _onStaffTab();
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

// ⚠️ STEP VALIDATION (v1.9.0). This function used to check ONE thing — that
// every lesson had an `id` — and then wrote whatever else the file contained
// straight into Firestore.
//
// The failure mode that bought this: learn.js's buildSequence() reads a
// different field per step type, and a step whose type does not match its
// fields produces either a throw or an empty drill. Both surface as a blank
// screen, in a different file, hours later, for every student at once — and
// neither names the lesson. renderMap() calls buildRunList() for every lesson
// on every render just to print the run count on a card, so one bad step in one
// lesson takes down the whole map, not just that lesson.
//
// ⚠️ GENERALISE: THE VALIDATOR BELONGS WHERE THE HUMAN IS. Import is the only
// moment a person is looking at this data with the file still in front of them
// and the ability to fix it. Everything downstream of here is a student.
//
// This is deliberately a REJECTION, not a repair. Silently defaulting a missing
// `text` to '' would import a lesson that runs and teaches nothing, which is
// worse than a red message naming the step.
const STEP_TYPES = ['key_pattern', 'key_pattern_auto', 'key_random',
                    'word_list', 'sentence_list', 'passage'];

// The field each type actually needs, and what counts as present. Mirrors
// learn.js buildSequence() — ⚠️ if a step type is added there, add it here.
const STEP_REQUIREMENTS = {
    key_pattern:      s => typeof s.text === 'string' && s.text.length > 0,
    passage:          s => typeof s.text === 'string' && s.text.length > 0,
    key_pattern_auto: s => Array.isArray(s.keySet) && s.keySet.length > 0,
    key_random:       s => Array.isArray(s.keySet) && s.keySet.length > 0,
    word_list:        s => Array.isArray(s.words) && s.words.length > 0,
    sentence_list:    s => Array.isArray(s.sentences) && s.sentences.length > 0,
};
const STEP_FIELD_NAME = {
    key_pattern: 'text', passage: 'text',
    key_pattern_auto: 'keySet', key_random: 'keySet',
    word_list: 'words', sentence_list: 'sentences',
};

function validateLessonSteps(lesson, where) {
    const problems = [];
    if (lesson.steps === undefined) return problems;   // a lesson with no steps
    if (!Array.isArray(lesson.steps)) {
        problems.push(`${where}: "steps" is ${typeof lesson.steps}, expected an array`);
        return problems;
    }
    lesson.steps.forEach((step, i) => {
        const at = `${where} step ${i + 1}`;
        if (!step || typeof step !== 'object') {
            problems.push(`${at}: not an object`);
            return;
        }
        if (!step.type) {
            // Not defaulted on purpose. learn.js's switch falls through to
            // `return []` for an unknown type, which builds a drill with no
            // characters — a screen a student cannot finish or escape.
            problems.push(`${at}: no "type" field (expected one of ${STEP_TYPES.join(', ')})`);
            return;
        }
        if (!STEP_TYPES.includes(step.type)) {
            problems.push(`${at}: unknown type "${step.type}"`);
            return;
        }
        if (!STEP_REQUIREMENTS[step.type](step)) {
            problems.push(`${at}: type "${step.type}" needs a non-empty ` +
                          `"${STEP_FIELD_NAME[step.type]}"`);
        }
    });
    return problems;
}

function parseImportJSON(text) {
    const parsed = JSON.parse(text);
    // Accept either array of lessons or { lessons: [...] }
    const arr = Array.isArray(parsed) ? parsed : parsed.lessons;
    if (!Array.isArray(arr)) throw new Error('Expected an array of lessons or { lessons: [...] }');
    if (arr.length === 0) throw new Error('No lessons found in JSON');

    const problems = [];
    arr.forEach((l, i) => {
        if (!l.id) { problems.push(`Lesson at index ${i} has no id field`); return; }
        // ⚠️ Named by id, not by index. "Lesson at index 23" sends an admin
        // counting brackets in a 47-lesson file; the id is searchable.
        problems.push(...validateLessonSteps(l, `Lesson "${l.id}"`));
    });

    if (problems.length) {
        // ⚠️ ALL of them, not the first. A file generated by one bad template
        // usually has the same defect in twenty places, and reporting one at a
        // time turns a single fix into twenty round trips. Round 9 §6 invariant
        // 68: say which one failed — plural.
        const shown = problems.slice(0, 12);
        const more  = problems.length > 12 ? `\n…and ${problems.length - 12} more` : '';
        throw new Error(`${problems.length} problem(s) found:\n• ${shown.join('\n• ')}${more}`);
    }
    return arr;
}


// ─── EXPORT JSON ─────────────────────────────────────────────────────────────
// The curriculum lives only in Firestore. Until this existed there was no way to
// back it up, diff it, or read it outside the admin UI — the same gap the README
// flags for book content.
//
// Two deliberate choices:
//
// 1. It re-fetches from Firestore instead of dumping _lessonCache. A backup that
//    silently captures a stale cache is worse than no backup. Note this means an
//    expanded lesson card with unsaved field edits will NOT appear in the export
//    — save first. The status line says so.
//
// 2. Output is import-compatible. parseImportJSON() takes either a bare array or
//    an object with a .lessons array and ignores sibling keys, so the metadata
//    below survives a round trip through Import with no special handling.

// Key order in the emitted file. Cosmetic, but it makes the JSON readable and
// makes diffs between two exports meaningful instead of noise.
const EXPORT_KEY_ORDER = [
    'id', 'unit', 'lesson', 'title', 'intro',
    'newKeys', 'availableKeys', 'anchorKeys', 'gates', 'steps'
];

function normalizeLessonForExport(docId, data) {
    const out = {};
    // The document id is authoritative and Import requires the field, so it goes
    // first and is always present even if the document body omitted it.
    out.id = data.id || docId;
    EXPORT_KEY_ORDER.forEach(k => {
        if (k === 'id') return;
        if (Object.prototype.hasOwnProperty.call(data, k)) out[k] = data[k];
    });
    // Anything this version of the panel doesn't know about gets carried through
    // rather than silently dropped on the way out. An export that quietly loses
    // fields is a data-loss bug wearing a backup costume.
    Object.keys(data).sort().forEach(k => {
        if (!Object.prototype.hasOwnProperty.call(out, k)) out[k] = data[k];
    });
    return out;
}

function sortLessonsForExport(a, b) {
    const ua = Number(a.unit) || 0, ub = Number(b.unit) || 0;
    if (ua !== ub) return ua - ub;
    const la = Number(a.lesson) || 0, lb = Number(b.lesson) || 0;
    if (la !== lb) return la - lb;
    return String(a.id).localeCompare(String(b.id));
}

async function buildExportPayload() {
    const snap = await getDocs(collection(_db, LESSON_COLLECTION));
    const lessons = [];
    snap.forEach(d => lessons.push(normalizeLessonForExport(d.id, d.data())));
    lessons.sort(sortLessonsForExport);
    return {
        source: 'typethatbook/lessons',
        exportedAt: new Date().toISOString(),
        exporterVersion: window.LESSONS_ADMIN_VERSION,
        lessonCount: lessons.length,
        lessons
    };
}

// The gate audit renders the whole curriculum's thresholds as one table. The
// numbers that actually govern whether a student advances were previously only
// visible one expanded card at a time, which is how a gate can sit wrong for a
// whole rotation without anyone seeing it.
function buildGateAudit(lessons) {
    return lessons.map(l => {
        const g     = l.gates || {};
        const steps = Array.isArray(l.steps) ? l.steps : [];
        const warn  = [];
        // These two defaults are applied in learn.js at read time
        // (showStepModal / showLessonResultModal), not written into the document,
        // so a lesson with no gates object is silently graded at 15/85.
        if (!l.gates) {
            warn.push('no gates object → 15 WPM / 85% applied at runtime');
        } else {
            if (g.minWPM == null)      warn.push('minWPM unset → 15');
            if (g.minAccuracy == null) warn.push('minAccuracy unset → 85');
        }
        if (!steps.length) warn.push('no steps');
        return {
            id:        l.id,
            unit:      (l.unit == null ? '?' : l.unit),
            lesson:    (l.lesson == null ? '?' : l.lesson),
            title:     l.title || '',
            newKeys:   Array.isArray(l.newKeys) ? l.newKeys : [],
            stepCount: steps.length,
            stepTypes: steps.map(s => (s && s.type) || '?'),
            minWPM:    (g.minWPM == null ? 15 : g.minWPM),
            minAcc:    (g.minAccuracy == null ? 85 : g.minAccuracy),
            warn
        };
    });
}

function renderGateAudit(rows) {
    if (!rows.length) return '<div style="color:#888;">No lessons.</div>';
    const cell = 'padding:3px 8px; border-bottom:1px solid #262626; white-space:nowrap;';
    let html =
        '<table style="border-collapse:collapse; font-size:0.75em; width:100%;">' +
        '<thead><tr style="color:#4B9CD3; text-align:left;">' +
        ['Unit', 'Lesson id', 'New keys', 'Steps', 'Step types', 'minWPM', 'minAcc']
            .map(h => '<th style="' + cell + '">' + h + '</th>').join('') +
        '</tr></thead><tbody>';

    let lastUnit = null;
    rows.forEach(r => {
        // A rule between units makes the shape of the progression visible at a glance.
        const unitBreak = (lastUnit !== null && r.unit !== lastUnit);
        lastUnit = r.unit;
        const rowStyle = unitBreak ? ' style="border-top:2px solid #333;"' : '';
        html += '<tr' + rowStyle + '>' +
            '<td style="' + cell + ' color:#888;">' + escHtml(String(r.unit)) + '</td>' +
            '<td style="' + cell + ' color:#ccc;">' + escHtml(r.id) + '</td>' +
            '<td style="' + cell + ' color:#b87ae8;">' + escHtml(r.newKeys.join(' ')) + '</td>' +
            '<td style="' + cell + ' color:#888; text-align:right;">' + r.stepCount + '</td>' +
            '<td style="' + cell + ' color:#666;">' + escHtml(r.stepTypes.join(', ')) + '</td>' +
            '<td style="' + cell + ' color:#FFD700; text-align:right;">' + escHtml(String(r.minWPM)) + '</td>' +
            '<td style="' + cell + ' color:#22c55e; text-align:right;">' + escHtml(String(r.minAcc)) + '%</td>' +
            '</tr>';
        if (r.warn.length) {
            html += '<tr><td colspan="7" style="padding:2px 8px 6px 8px; color:#ffaa00; font-size:0.9em;">' +
                    '⚠ ' + escHtml(r.warn.join(' · ')) + '</td></tr>';
        }
    });
    return html + '</tbody></table>';
}

function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoked on a timer rather than immediately: revoking in the same tick has
    // cancelled in-flight downloads in Safari.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function copyExportText(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (e) { /* fall through to the legacy path */ }

    // Fallback for contexts where the async clipboard API is unavailable or
    // blocked by device policy — which includes some managed Chromebooks.
    const ta = document.getElementById('lessons-export-json');
    if (!ta) return false;
    const wasReadOnly = ta.hasAttribute('readonly');
    ta.removeAttribute('readonly');
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    if (wasReadOnly) ta.setAttribute('readonly', 'readonly');
    return ok;
}

function localDateStamp() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function bindExportUI() {
    const toggleBtn = document.getElementById('lessons-export-toggle');
    const sec       = document.getElementById('lessons-export-section');
    const ta        = document.getElementById('lessons-export-json');
    const summaryEl = document.getElementById('lessons-export-summary');
    const auditEl   = document.getElementById('lessons-export-audit');
    const statusEl  = document.getElementById('lessons-export-status');
    const dlBtn     = document.getElementById('lessons-export-download');
    const cpBtn     = document.getElementById('lessons-export-copy');
    const refreshBtn = document.getElementById('lessons-export-refresh');
    if (!toggleBtn || !sec) return;

    let _json = '';

    function setStatus(msg, color) {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.style.color = color || '#888';
    }

    function setButtonsEnabled(on) {
        [dlBtn, cpBtn].forEach(b => {
            if (!b) return;
            b.disabled = !on;
            b.style.opacity = on ? '1' : '0.4';
        });
    }

    async function runExport() {
        setButtonsEnabled(false);
        setStatus('Reading lessons from Firestore…', '#888');
        if (auditEl) auditEl.innerHTML = '';
        try {
            const payload = await buildExportPayload();
            _json = JSON.stringify(payload, null, 2);
            if (ta) ta.value = _json;

            const rows = buildGateAudit(payload.lessons);
            if (auditEl) auditEl.innerHTML = renderGateAudit(rows);

            const byUnit = {};
            payload.lessons.forEach(l => {
                const u = (l.unit == null ? '?' : l.unit);
                byUnit[u] = (byUnit[u] || 0) + 1;
            });
            const unitSummary = Object.keys(byUnit)
                .sort((a, b) => (Number(a) || 0) - (Number(b) || 0))
                .map(u => 'Unit ' + u + ': ' + byUnit[u]).join('  ·  ');
            const stepTotal = rows.reduce((n, r) => n + r.stepCount, 0);
            const flagged   = rows.filter(r => r.warn.length).length;

            if (summaryEl) {
                summaryEl.innerHTML =
                    '✓ ' + payload.lessonCount + ' lesson' + (payload.lessonCount !== 1 ? 's' : '') +
                    ', ' + stepTotal + ' steps, ' + (_json.length / 1024).toFixed(1) + ' KB' +
                    (flagged ? '  <span style="color:#ffaa00;">· ' + flagged + ' with warnings</span>' : '') +
                    '<div style="color:#888; font-size:0.9em; margin-top:4px;">' + escHtml(unitSummary) + '</div>';
            }
            setButtonsEnabled(payload.lessonCount > 0);
            setStatus('Read at ' + new Date().toLocaleTimeString() +
                      ' — reflects Firestore, not unsaved card edits.', '#00ff41');
        } catch (e) {
            _json = '';
            if (ta) ta.value = '';
            if (summaryEl) summaryEl.textContent = '';
            setStatus('Export failed: ' + e.message, '#ff4444');
            console.error('Lesson export failed:', e);
        }
    }

    toggleBtn.addEventListener('click', async () => {
        const isHidden = sec.classList.contains('hidden');
        sec.classList.toggle('hidden', !isHidden);
        toggleBtn.textContent = isHidden ? '▼ Export JSON' : '▶ Export JSON';
        if (isHidden) await runExport();   // always fetch fresh on open
    });

    if (refreshBtn) refreshBtn.addEventListener('click', runExport);

    if (dlBtn) dlBtn.addEventListener('click', () => {
        if (!_json) return;
        downloadTextFile('ttb-lessons-' + localDateStamp() + '.json', _json);
        setStatus('Downloaded ttb-lessons-' + localDateStamp() + '.json', '#00ff41');
    });

    if (cpBtn) cpBtn.addEventListener('click', async () => {
        if (!_json) return;
        const ok = await copyExportText(_json);
        setStatus(ok ? 'Copied ' + (_json.length / 1024).toFixed(1) + ' KB to clipboard.'
                     : 'Copy failed — select the text below and copy manually.',
                  ok ? '#00ff41' : '#ffaa00');
    });

    setButtonsEnabled(false);
}


async function loadStudentProgress(uid, label) {
    _currentStudentUid = uid;
    const lblEl    = document.getElementById('student-selected-label');
    const gridEl   = document.getElementById('student-lesson-grid');
    const assignEl = document.getElementById('student-class-assign');
    const statusEl = document.getElementById('student-class-status');

    lblEl.textContent = label;
    // Reveal detail panel and reset to lessons pane
    if (assignEl) assignEl.classList.remove('hidden');
    document.querySelectorAll('.progress-tab-btn').forEach(b => {
        const active = b.dataset.pane === 'lessons';
        b.style.borderBottomColor = active ? '#4B9CD3' : 'transparent';
        b.style.color = active ? '#4B9CD3' : '#666';
    });
    const lessonsPane = document.getElementById('student-pane-lessons');
    const booksPane   = document.getElementById('student-pane-books');
    const bookGrid    = document.getElementById('student-book-grid');
    // ⚠️ CLASS, NOT INLINE STYLE (Round 74). `u-display-none` has no
    // `!important`, so `= ''` lets the class win — the Lessons pane would have
    // stayed hidden on every open of a student.
    if (lessonsPane) lessonsPane.classList.remove('u-display-none');
    if (booksPane)   booksPane.classList.add('u-display-none');
    if (bookGrid)    bookGrid.innerHTML = '<span style="color:#555;">Click the Books tab to load.</span>';
    gridEl.innerHTML = '<span style="color:#888;">Loading…</span>';

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
                    // ⚠️⚠️ v1.14.0 — ROADMAP 11. schoolId MUST RIDE ALONG. This
                    // writer sent classId ALONE for three rounds, which is how
                    // Jake's own son ended up in his class and NOT in his
                    // school: visible under "All schools", invisible under his
                    // own, and missing from every school-filtered report.
                    // ⚠️ THE CORRECT PATTERN ALREADY EXISTED TWICE IN THIS FILE
                    // (_commitCSV and the one-student add at ~1700) and this
                    // path simply did not use it. Three writers, one omission.
                    await setDoc(doc(_db, 'users', uid), {
                        classId: classId || null,
                        schoolId: await _schoolIdForClass(classId),
                    }, { merge: true });
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
let _classCache = {};  // classId → { name, schoolId, dailySeconds, weeklySeconds }

// ⚠️⚠️ v1.14.0 — ROADMAP 11. THE CACHE IS NOT ALWAYS WARM, AND WITHOUT THIS
// THE FIX ABOVE WOULD HAVE LOOKED RIGHT AND CHANGED NOTHING. `_classCache` is
// filled by loadAndRenderClasses(), which runs when the CLASSES panel opens — an
// admin who goes straight to Students and assigns a class has an EMPTY cache, so
// `_classCache[classId].schoolId` reads undefined and the writer sends '' exactly
// as before. Same defect, one layer down, and silent.
//
// So: cache first, then the class document itself. One read, on a click.
async function _schoolIdForClass(classId) {
    if (!classId) return '';
    const hit = _classCache[classId];
    if (hit && hit.schoolId) return hit.schoolId;
    try {
        const snap = await getDoc(doc(_db, 'classes', classId));
        const sid = snap.exists() ? (snap.data().schoolId || '') : '';
        if (sid) _classCache[classId] = Object.assign({}, hit, { id: classId, schoolId: sid });
        return sid;
    } catch (e) {
        console.warn('[TTB] schoolId lookup failed for class', classId, e);
        return '';
    }
}

function initClassesPanel() {
    if (_classesPanelInited) { renderClassList(); initClassFilters(); return; }
    _classesPanelInited = true;

    populateClassSchools();
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
        // ⚠️ AFTER the first paint, never before it. The filter bar needs two
        // lookups; blocking the class list on labels would mean a failed lookup
        // costs the whole panel instead of two names.
        initClassFilters();
    } catch(e) {
        document.getElementById('class-list').innerHTML =
            '<span style="color:#ff4444;">Load failed: ' + escHtml(e.message) + '</span>';
    }
}

/** ⚠️ FALLS BACK TO THE ID, NEVER TO BLANK. "unknown school" on a card is a
 *  fact; an empty space is a card that looks like it has no building, which is
 *  the state firestore.rules refuses to create. */
function _schoolLabel(cls) {
    const id = cls.schoolId || '';
    if (!id) return 'no school';
    return (_schoolNames && _schoolNames[id]) || id;
}

/** ⚠️ A class can have several teachers, and the plural matters — "Ellis · 3
 *  teachers" is information; showing only the first one silently is not. */
function _teacherLabel(cls) {
    const uids = Array.isArray(cls.teacherUids) ? cls.teacherUids : [];
    if (!uids.length) return 'no teacher';
    if (!_teacherNames) return uids.length === 1 ? 'teacher' : uids.length + ' teachers';
    const named = uids.map(u => _teacherNames[u] || u);
    return named.length <= 2 ? named.join(', ') : named[0] + ' +' + (named.length - 1);
}

function renderClassList() {
    const listEl = document.getElementById('class-list');
    let classes = Object.values(_classCache).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // ⚠️⚠️ THE FILTER NARROWS AN ALREADY-SCOPED LIST. It is NOT what scopes it —
    // `_classCache` holds only what firestore.rules let this account read, and a
    // building_admin who clears these dropdowns still sees only their building.
    // A filter that were the boundary would leak the moment somebody reset it.
    const fSchool  = (document.getElementById('class-filter-school')  || {}).value || '';
    const fTeacher = (document.getElementById('class-filter-teacher') || {}).value || '';
    if (fSchool)  classes = classes.filter(c => (c.schoolId || '') === fSchool);
    if (fTeacher) classes = classes.filter(c => (c.teacherUids || []).includes(fTeacher));

    const countEl = document.getElementById('class-filter-count');
    if (countEl) {
        const total = Object.keys(_classCache).length;
        // ⚠️ SAY WHEN SOMETHING IS HIDDEN. A filtered list that looks like the
        // whole list is how "that class is missing" becomes a support question.
        countEl.textContent = classes.length === total
            ? `${total} class${total === 1 ? '' : 'es'}`
            : `${classes.length} of ${total} shown — ${total - classes.length} hidden by the filters`;
    }

    if (!classes.length && Object.keys(_classCache).length) {
        listEl.innerHTML = '<div style="color:#888; font-size:0.82em;">' +
            'No classes match these filters.</div>';
        return;
    }
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
            // ⚠️ WHOSE CLASS IS THIS. School and teacher come straight off the
            // class document — both were already in _classCache; the card simply
            // never printed them. The names fill in when the lookups land, so a
            // failed lookup costs a label and not the panel.
            '<div style="font-size:0.75em;color:#8ab;margin-bottom:2px;">' +
            escHtml(_schoolLabel(cls)) + ' &nbsp;·&nbsp; ' + escHtml(_teacherLabel(cls)) +
            '</div>' +
            '<div style="font-size:0.75em;color:#666;">' +
            'Daily: ' + dm + 'min&nbsp;&nbsp;Weekly: ' + wm + 'min' +
            '&nbsp;&nbsp;<span style="color:#444;">ID: ' + escHtml(cls.id) + '</span>' +
            '</div>' +
            '</div>' +
            '<button class="lbtn lbtn-secondary class-edit-btn" style="width:auto;padding:4px 12px;font-size:0.78em;" data-id="' + escHtml(cls.id) + '">Edit</button>' +
            // ⚠️⚠️ THIS BUTTON CARRIED TWO `class` ATTRIBUTES (v1.17.0, ROADMAP
            // 56c). HTML keeps the FIRST and silently discards the second, so
            // `class-del-btn` was never on the element — which is why the click
            // had to be found by `[data-id]:last-child`, and why the hover was
            // dead: the inline `background:#500` beat `.lbtn:hover` the way every
            // inline background does (admin.js v3.42.0's eighteen buttons).
            // ⚠️ `.lbtn-danger` already declares this exact treatment AND a
            // hover, four lines apart in admin.html. The inline copy was a second
            // spelling of a rule that already existed.
            '<button class="lbtn lbtn-danger class-del-btn" style="width:auto;padding:4px 12px;font-size:0.78em;" data-id="' + escHtml(cls.id) + '">Delete</button>';

        card.querySelector('.class-edit-btn').onclick = () => startClassEdit(cls.id);
        // ⚠️ BY CLASS, NOT BY POSITION. `[data-id]:last-child` worked only because
        // Delete happened to be last; appending anything to this card would have
        // moved the delete handler onto it, silently.
        card.querySelector('.class-del-btn').onclick = () => deleteClass(cls.id);
        listEl.appendChild(card);
    });

    // Also refresh assign dropdown in students panel if it's visible
    refreshClassDropdownInStudents();
}

// ⚠️ SHARED BY saveClass() AND THE CSV IMPORTER (v1.8.0). Both create classes;
// before this they would have carried two copies of the id scheme and the
// record shape, and the failure mode of that is not a crash — it is two classes
// that look identical in the list and are not the same document.
function _newClassId(name) {
    const slug = String(name || '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    // ⚠️ A name with no letters or digits slugs to the empty string, which used
    // to yield an id starting with "_". Cosmetic on its own; the reason it is
    // guarded is that the same emptiness is dangerous in _classKey() below.
    return (slug || 'class') + '_' + Date.now().toString(36);
}

function _newClassRecord(name, schoolId, dailySeconds, weeklySeconds) {
    const rec = {
        name: name,
        schoolId: schoolId,
        dailySeconds:  dailySeconds  || 0,
        weeklySeconds: weeklySeconds || 0,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    };
    // The rules require the creator to put themselves on the class. ⚠️ The
    // comment that used to sit here said this was because "claim.classIds is
    // derived from teacherUids" — that mechanism was DELETED in Cloud Functions
    // index.js v1.6.0, which removed seven custom-claims functions no client
    // called and no rule consulted. The line still earns its place for a
    // teacher (firestore.rules scopes them by teacherUids on the class doc),
    // but the stated reason had been wrong for a while.
    if (_scope.uid) rec.teacherUids = [_scope.uid];
    return rec;
}

// Normalised key for matching a class name typed into a CSV against one that
// already exists. Case, punctuation and run-together spacing are exactly the
// differences a roster export introduces and a human does not consider
// meaningful: "Period 3", "period-3" and "Period  3" are one class.
function _classKey(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// ⚠️ A name that normalises to nothing is NOT a class name, and treating it as
// one is the sharp edge on the normaliser. `_classKey('-')` is '', and an empty
// key would match any other class whose name also normalises to empty — a
// lookup hit that assigns students to a class nobody named. Callers must reject
// these before looking them up or offering to create them.
function _isUsableClassName(s) {
    return _classKey(s).length > 0;
}

async function saveClass() {
    const nameVal   = (document.getElementById('class-name-input').value || '').trim();
    const dailyMin  = parseInt(document.getElementById('class-daily-input').value) || 0;
    const weeklyMin = parseInt(document.getElementById('class-weekly-input').value) || 0;
    const editId    = document.getElementById('class-edit-id').value;
    const statusEl  = document.getElementById('class-form-status');

    if (!nameVal) { statusEl.textContent = 'Name is required.'; statusEl.style.color = '#ff6666'; return; }

    // schoolId is REQUIRED by firestore.rules — a class with no building can't be
    // scoped, so the write is rejected rather than silently creating an orphan.
    const schoolSel = document.getElementById('class-school-select');
    const schoolId = schoolSel ? schoolSel.value : '';
    if (!schoolId) {
        statusEl.textContent = 'Pick a school. A class has to belong to a building.';
        statusEl.style.color = '#ff6666';
        return;
    }

    // An EDIT must not carry createdAt or teacherUids — _newClassRecord() is the
    // create shape. Splitting it this way keeps merge:true from rewriting the
    // creation date every time somebody adjusts a goal.
    const record = editId ? {
        name: nameVal,
        schoolId: schoolId,
        dailySeconds:  dailyMin  * 60,
        weeklySeconds: weeklyMin * 60,
        updatedAt: new Date().toISOString(),
    } : _newClassRecord(nameVal, schoolId, dailyMin * 60, weeklyMin * 60);

    try {
        let classId = editId;
        let isNew = false;
        if (!classId) {
            isNew = true;
            classId = _newClassId(nameVal);
        }
        await setDoc(doc(_db, 'classes', classId), record, { merge: true });
        _classCache[classId] = { id: classId, ..._classCache[classId], ...record };
        statusEl.textContent = isNew ? 'Class created.' : 'Saved.';
        statusEl.style.color = '#00ff41';

        // Re-derive this teacher's claim.classIds and refresh their token, or the
        // class they just made stays invisible to them until the token rolls over
        // on its own (up to an hour).
        if (isNew && _onClassesChanged) {
            statusEl.textContent = 'Class created. Refreshing your access…';
            const ok = await _onClassesChanged();
            statusEl.textContent = ok
                ? 'Class created.'
                : 'Class created — sign out and back in to see its data.';
            statusEl.style.color = ok ? '#00ff41' : '#ffaa00';
        }
        cancelClassEdit();
        renderClassList();
    } catch(e) {
        statusEl.textContent = 'Error: ' + e.message;
        statusEl.style.color = '#ff6666';
    }
}

/**
 * ⚠️ ROADMAP 59 — the filter bar, populated from what this account may see.
 *
 * ⚠️⚠️ HIDDEN ENTIRELY FOR A TEACHER. One person's own classes are not a list
 * that needs narrowing, and two empty dropdowns read as a feature that is broken
 * rather than one that is absent. Jake: *"Teachers should be able to see...their
 * own? Not much need for a filter there."*
 *
 * ⚠️ THE TEACHER OPTIONS COME FROM THE CLASSES IN VIEW, not from the whole staff
 * list — offering a teacher whose classes this account cannot read would be a
 * filter that can only ever return nothing, and it would leak that they exist.
 */
async function initClassFilters() {
    const bar = document.getElementById('class-filter-bar');
    if (!bar) return;
    const canFilter = _isSuper() || _scope.role === 'building_admin';
    if (!canFilter) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');

    const schoolSel  = document.getElementById('class-filter-school');
    const teacherSel = document.getElementById('class-filter-teacher');

    const [schools, names] = await Promise.all([_loadSchoolNames(), _loadTeacherNames()]);

    // ⚠️ ONLY BUILDINGS THAT ACTUALLY HOLD A CLASS THIS ACCOUNT CAN SEE. A
    // dropdown full of empty buildings is a list of places to find nothing.
    const usedSchools = new Set(Object.values(_classCache).map(c => c.schoolId).filter(Boolean));
    schoolSel.innerHTML = '<option value="">All schools</option>' +
        [...usedSchools].sort((a, b) => (schools[a] || a).localeCompare(schools[b] || b))
            .map(id => `<option value="${escHtml(id)}">${escHtml(schools[id] || id)}</option>`).join('');

    const usedTeachers = new Set();
    Object.values(_classCache).forEach(c => (c.teacherUids || []).forEach(u => usedTeachers.add(u)));
    teacherSel.innerHTML = '<option value="">All teachers</option>' +
        [...usedTeachers].sort((a, b) => (names[a] || a).localeCompare(names[b] || b))
            .map(u => `<option value="${escHtml(u)}">${escHtml(names[u] || u)}</option>`).join('');

    schoolSel.onchange  = renderClassList;
    teacherSel.onchange = renderClassList;
    renderClassList();          // the names have landed; repaint the cards
}

// Fill the school dropdown from the caller's own buildings.
async function populateClassSchools() {
    const sel = document.getElementById('class-school-select');
    if (!sel) return;
    try {
        // Shared with the CSV importer via _loadSchoolOptions(), so "which
        // buildings may I put a class in" has one answer rather than two.
        const ids = await _loadSchoolOptions();
        sel.innerHTML = ids.length
            ? ids.map(x => `<option value="${x.id}">${x.name}</option>`).join('')
            : '<option value="">— no schools —</option>';
        if (!ids.length) {
            const st = document.getElementById('class-form-status');
            if (st) {
                st.textContent = 'No schools available. A super admin needs to create ' +
                    'them first (Firestore console → schools).';
                st.style.color = '#ffaa00';
            }
        }
    } catch (e) {
        console.warn('Could not load schools for class form:', e);
        sel.innerHTML = '<option value="">— could not load —</option>';
    }
}

function startClassEdit(classId) {
    const cls = _classCache[classId];
    if (!cls) return;
    const sel = document.getElementById('class-school-select');
    if (sel && cls.schoolId) sel.value = cls.schoolId;
    document.getElementById('class-edit-id').value     = classId;
    document.getElementById('class-name-input').value  = cls.name || '';
    document.getElementById('class-daily-input').value = Math.floor((cls.dailySeconds || 0) / 60);
    document.getElementById('class-weekly-input').value= Math.floor((cls.weeklySeconds || 0) / 60);
    document.getElementById('class-form-title').textContent = 'Edit Class';
    // ⚠️ CLASS, NOT INLINE STYLE (Round 74). These elements are hidden by
    // `u-display-none`, which has no `!important` — so `style.display = ''`
    // removes the inline declaration and lets the CLASS win, leaving the element
    // hidden while the code reads as if it revealed it. Setting a real value
    // ('none', 'block') works; setting '' never does.
    document.getElementById('class-cancel-btn').classList.remove('u-display-none');
    document.getElementById('class-form-status').textContent = '';
    document.getElementById('class-name-input').focus();
}

function cancelClassEdit() {
    document.getElementById('class-edit-id').value     = '';
    document.getElementById('class-name-input').value  = '';
    document.getElementById('class-daily-input').value = 10;
    document.getElementById('class-weekly-input').value= 50;
    document.getElementById('class-form-title').textContent = 'New Class';
    document.getElementById('class-cancel-btn').classList.add('u-display-none');
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
    const stuckBtn = document.getElementById('stuck-scan-btn');
    if (stuckBtn && !stuckBtn.dataset.wired) { stuckBtn.dataset.wired = '1'; stuckBtn.addEventListener('click', scanForStuck); }
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
// null until the teacher answers the decision block in _previewCSV. 'move' or
// 'newonly'. Deliberately NOT defaulted: the whole point of v1.10.0 is that an
// import which reassigns students cannot proceed on an assumption nobody stated.
let _csvOverwriteMode  = null;
let _selectedUids      = new Set();

function initStudentsPanel() {
    if (_studentsInited) {
        _buildClassFilterDropdown();
        _buildBulkClassDropdown();
        return;
    }
    _studentsInited = true;

    // Always load classes (ensures dropdowns are populated even if Classes tab never opened)
    getDocs(collection(_db, 'classes')).then(snap => {
        _classCache = {};
        snap.forEach(d => { _classCache[d.id] = { id: d.id, ...d.data() }; });
        _buildClassFilterDropdown();
        _buildBulkClassDropdown();
    }).catch(() => {});

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
    document.getElementById('student-one-toggle-btn')
        .addEventListener('click', async () => {
            const sec = document.getElementById('student-one-section');
            sec.classList.toggle('hidden');
            if (!sec.classList.contains('hidden')) await _populateOneStudentClasses();
        });
    document.getElementById('student-one-add-btn').addEventListener('click', _addOneStudent);
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
            document.getElementById('student-pane-lessons').classList.toggle('u-display-none', !(pane === 'lessons'));
            // ⚠️ CLASS, NOT INLINE STYLE (Round 74). These elements are hidden by
    // `u-display-none`, which has no `!important` — so `style.display = ''`
    // removes the inline declaration and lets the CLASS win, leaving the element
    // hidden while the code reads as if it revealed it. Setting a real value
    // ('none', 'block') works; setting '' never does.
        document.getElementById('student-pane-books').classList.toggle('u-display-none', !(pane === 'books'));
            if (pane === 'books' && _currentStudentUid) _loadStudentBooks(_currentStudentUid);
        });
    });

    loadStudentRoster();
}

// ── Add One Student ────────────────────────────────────────────────────────────
//
// ⚠️ THESE TWO FUNCTIONS WERE MISSING (v1.7.1). The feature's markup existed in
// admin.html (#student-one-section, #student-one-email, #student-one-class,
// #student-one-add-btn) and initStudentsPanel() wired both of them, but neither
// was ever declared in this file. That is not a dormant feature — it is fatal at
// wiring time. `addEventListener('click', _addOneStudent)` EVALUATES the
// identifier, so initStudentsPanel() threw a ReferenceError at that line and
// abandoned everything after it:
//
//   * Preview CSV and Commit CSV were never wired — the roster import buttons
//     did nothing at all;
//   * the Lessons/Books progress tabs were never wired;
//   * loadStudentRoster() at the end of the function never ran, so the roster
//     came up empty;
//   * and because _studentsInited = true is set BEFORE the throw, reopening the
//     tab took the early-return path and only rebuilt two dropdowns. Broken for
//     the rest of the session, with an empty table as the only symptom.
//
// Written from _commitCSV() and _bulkAssign() rather than from scratch: the
// single-student case is exactly one iteration of the bulk loop, so the schema,
// the schoolId rule and the pending-vs-existing split are copied from working
// code rather than guessed at. See §"Add One Student" in HANDOFF.md.

// Populates #student-one-class. Async because the toggle handler awaits it and
// the class cache may not be warm yet — opening this section is a legitimate
// first action after the tab loads.
async function _populateOneStudentClasses() {
    const sel = document.getElementById('student-one-class');
    if (!sel) return;

    if (!Object.keys(_classCache).length) {
        sel.innerHTML = '<option value="">Loading classes…</option>';
        try {
            const snap = await getDocs(collection(_db, 'classes'));
            _classCache = {};
            snap.forEach(d => { _classCache[d.id] = { id: d.id, ...d.data() }; });
        } catch (e) {
            sel.innerHTML = '<option value="">Could not load classes</option>';
            _setOneStudentStatus('Failed to load classes: ' + e.message, '#ff6666');
            return;
        }
    }

    const cur = sel.value;
    sel.innerHTML = '<option value="">— No class —</option>';
    Object.values(_classCache)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        .forEach(cls => {
            const opt = document.createElement('option');
            opt.value = cls.id;
            opt.textContent = cls.name || cls.id;
            if (cls.id === cur) opt.selected = true;
            sel.appendChild(opt);
        });
}

function _setOneStudentStatus(msg, color = '#888') {
    const el = document.getElementById('student-one-status');
    if (el) { el.style.color = color; el.textContent = msg; }
}

// One student, one class. Two destinations, and which one is correct depends on
// whether the student has ever typed:
//
//   * they appear on the roster (so a Firebase Auth uid exists) -> users/{uid};
//   * they do not -> pendingClassAssignments/{email}, which game.js consumes on
//     that student's first sign-in.
//
// Emailing the assignment ahead of the student's first login is the normal case
// at the start of a rotation, so the pending path is not an edge case.
async function _addOneStudent() {
    const emailEl = document.getElementById('student-one-email');
    const classEl = document.getElementById('student-one-class');
    const btn     = document.getElementById('student-one-add-btn');
    if (!emailEl || !classEl) return;

    const email   = (emailEl.value || '').trim().toLowerCase();
    const classId = classEl.value;

    // Same shape of check _previewCSV applies to a CSV row: an address without an
    // @ is a header line or a typo, and writing it creates a junk document keyed
    // by garbage that nothing will ever match.
    if (!email || !email.includes('@')) {
        _setOneStudentStatus('Enter a valid email address.', '#ff6666');
        return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    _setOneStudentStatus('Saving…');

    // schoolId MUST ride along, exactly as in _commitCSV: if no user document
    // exists yet the write is a CREATE, and firestore.rules requires the building
    // on create — without it there is nothing to scope the document by and the
    // write is denied.
    const schoolId = await _schoolIdForClass(classId);

    try {
        const existing = _rosterData.find(r => (r.email || '').toLowerCase() === email);

        if (existing && existing.uid) {
            await setDoc(doc(_db, 'users', existing.uid), {
                classId: classId || null,
                schoolId
            }, { merge: true });
            existing.classId = classId || '';
            _renderRoster();
            _setOneStudentStatus('\u2713 ' + email + ' assigned to ' +
                (classId ? (_classCache[classId]?.name || classId) : 'no class') + '.', '#22c55e');
        } else {
            // ⚠️ overwrite: true, AND UNLIKE THE CSV PATH IT IS NOT ASKED ABOUT.
            // Typing one address and picking one class is about as explicit as an
            // instruction gets — there is no ambiguity to resolve and no batch to
            // get wrong. The CSV importer asks because a file can silently contain
            // a hundred returning students; this cannot.
            await setDoc(doc(_db, 'pendingClassAssignments', email), {
                classId: classId || null,
                schoolId,
                overwrite: true,
                assignedAt: new Date().toISOString()
            });
            _setOneStudentStatus('\u2713 ' + email + ' queued — it will apply the next time ' +
                'they sign in, moving them out of any class they are already in.', '#22c55e');
        }
        emailEl.value = '';
    } catch (e) {
        _setOneStudentStatus('Failed: ' + e.message, '#ff6666');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Add'; }
    }
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

    // ⚠️ v1.14.0 — ROADMAP 11. Same omission as the single-student writer above.
    // HANDOFF §6 item 9 called this "fine within one building" for three rounds
    // and it was never fine: schoolId ends up ABSENT, not empty.
    const _assignSchoolId = await _schoolIdForClass(classId);

    let ok = 0;
    for (const uid of uids) {
        try {
            await setDoc(doc(_db, 'users', uid), {
                classId: classId || null,
                schoolId: _assignSchoolId,
            }, { merge: true });
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
        // WAS: getDocs(collection(_db, 'typing_logs')) — the ENTIRE collection.
        // At 7,000 students over a school year that's ~1.2 MILLION documents per
        // roster load. It is ALSO rejected outright by firestore.rules for anyone
        // who isn't a super_admin: an unfiltered `list` can't be proven to return
        // only documents the caller is allowed to read, so Firestore denies it.
        //
        // Now: recent activity only, scoped to the caller's building(s).
        // Needs the same composite index as reports.html: schoolId ASC + date ASC.
        const sinceDate = _localDateStr(new Date(Date.now() - ROSTER_DAYS * 86400000));
        const logsRef = collection(_db, 'typing_logs');
        let logSnap;
        const seesBuilding = _isSuper() || _scope.role === 'building_admin'
                             || _scope.readScope === 'building';
        if (_isSuper()) {
            logSnap = await getDocs(query(logsRef, where('date', '>=', sinceDate)));
        } else if (!seesBuilding) {
            // A class-scoped teacher can only read logs for classes they teach.
            // firestore.rules would reject a building-wide query outright.
            const myClasses = await getDocs(query(collection(_db, 'classes'),
                where('teacherUids', 'array-contains', _scope.uid)));
            const ids = myClasses.docs.map(d => d.id).slice(0, 30);
            if (!ids.length) {
                statusEl.textContent = 'You have no classes yet. Create one on the ' +
                    'Classes tab, then import a roster.';
                return;
            }
            logSnap = await getDocs(query(logsRef,
                where('classId', 'in', ids),
                where('date', '>=', sinceDate)));
        } else if (_scope.schoolIds.length === 1) {
            logSnap = await getDocs(query(logsRef,
                where('schoolId', '==', _scope.schoolIds[0]),
                where('date', '>=', sinceDate)));
        } else if (_scope.schoolIds.length > 1) {
            // `in` caps at 30 values — far more buildings than anyone teaches at.
            logSnap = await getDocs(query(logsRef,
                where('schoolId', 'in', _scope.schoolIds.slice(0, 30)),
                where('date', '>=', sinceDate)));
        } else {
            statusEl.textContent = 'No school assigned to your account — ask an ' +
                'administrator to set your staff record.';
            return;
        }
        const byUid    = new Map();
        const today    = new Date();
        const weekStart = _localDateStr(_weekStartDate(today));

        logSnap.forEach(d => {
            const data = d.data();
            const uid  = data.uid || ''; if (!uid) return;
            // ═════════════════════════════════════════════════════════════════
            // ⚠️⚠️ v1.13.1 — THE DATE COMES FROM THE DOCUMENT ID, NOT THE FIELD.
            // ═════════════════════════════════════════════════════════════════
            //
            // reports.html says this in capitals at its own point read and this
            // file disagreed with it: "p.date, NOT data.date. ... data.date is
            // whatever the writer stamped inside it and has been wrong before.
            // The gate must key off the id, like the read did."
            //
            // ⚠️ IT HAS BEEN WRONG BEFORE, AND RECENTLY. Round 24 found
            // sessionLogAdopt() recomputing a record's date from a UTC slice and
            // stamping tomorrow onto an evening's typing. That was a different
            // collection, but it is the same class of defect and it is the
            // reason a stamped date is not evidence about which day a document
            // IS. The id is: every writer and every reader in this app addresses
            // these documents as `{uid}_{date}`, so the id is the one place the
            // day is asserted by the addressing itself rather than by a field a
            // writer had to remember to set.
            //
            // ⚠️ THIS WAS COSMETIC UNTIL TOMORROW. Before the cutover a wrong
            // `date` only mis-sorted a row. From 2026-08-22 it also picks the
            // BRANCH: a post-cutover document read under a pre-cutover date goes
            // legacy-first, and on a mixed day — a morning written flat by a page
            // that had not picked up the new build, an afternoon written per
            // source — legacy-first returns the morning ALONE and silently drops
            // the afternoon. That is the exact shape of failure this panel is
            // scheduled to be checked for on Monday, which is the worst possible
            // time to be unable to tell it from a stale deploy.
            //
            // ⚠️ PARSED FROM THE RIGHT, ON PURPOSE. A Firebase uid may legally
            // contain an underscore, so splitting on the FIRST one is wrong and
            // splitting on the last is only accidentally right. Anchoring the
            // match to the end of the string is neither.
            //
            // ⚠️ FALLS BACK TO data.date, WHICH IS THE OLD BEHAVIOUR EXACTLY. An
            // id this pattern cannot read means an unknown document shape, and
            // the house rule for that is fail toward "nothing changed" — the
            // same reasoning as daylog.js's missing-dateStr branch.
            const date = _logDateFromId(d.id) || data.date || '';
            // ⚠️ v1.11.0 — READ-SIDE OF THE SOURCE SPLIT (DESIGN-TELEMETRY.md
            // §2.4). game.js/learn.js now write secondsLibrary/secondsSchool
            // instead of a shared `seconds` field — see reports.html's
            // readLogTotals() for the canonical explanation, duplicated here
            // rather than imported because this file and reports.html are two
            // separate standalone pages, same reason getWeekStart() is a twin
            // in game.js/learn.js rather than a shared import.
            // ⚠️ v1.12.0 — legacy-first, matching reports.html v2.14.0 after the
            // source split was reverted. Summing would double-count any day
            // still carrying split fields from the window the split was live.
            //
            // ═════════════════════════════════════════════════════════════════
            // ⚠️⚠️ v1.13.0 — DATE-GATED. THIS FILE IS THE FOURTH READER AND IT
            // WAS THE ONE NOBODY UPDATED.
            // ═════════════════════════════════════════════════════════════════
            //
            // daylog.js (the student's HUD), reports.html (the grade) and
            // index.html (via daylog.js) all learned the cutover in v2.22.0.
            // This copy did not, and legacy-first is CATASTROPHIC for it after
            // the writers ship: a post-cutover day carries only split fields, so
            // `'seconds' in data` is false, the split branch is taken and — on
            // this page's OLD code — that branch was the fallback nobody
            // expected to be load-bearing. Worse, on a mixed day it returns the
            // frozen flat remainder alone. Either way this panel would show a
            // roster of students with a week of nearly nothing while
            // reports.html showed their real minutes, three clicks away.
            //
            // ⚠️ A FOURTH COPY OF A RULE IS THE PROBLEM, NOT THE GATE. This is
            // now the third hand-maintained copy of the same six lines
            // (daylog.js totalsOf, reports.html readLogTotals, here) and the
            // reason is the same each time: three standalone pages that cannot
            // import each other. tests/daylog-cutover-test.mjs Part G lifts THIS
            // copy too, so all three are held to one behaviour by execution
            // rather than by anyone remembering.
            const SOURCE_SPLIT_CUTOVER = '2026-08-22';
            const _flatSecs  = data.seconds || 0;
            const _splitSecs = (data.secondsLibrary || 0) + (data.secondsSchool || 0);
            const secs = (date >= SOURCE_SPLIT_CUTOVER)
                ? _flatSecs + _splitSecs
                : (('seconds' in data) ? _flatSecs : _splitSecs);
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
        // ⚠️ _renderRoster() OWNS THIS STATUS LINE AND MUST HAVE THE LAST WORD.
        // There used to be a `statusEl.textContent = N + ' students loaded.'`
        // on the next line, which ran AFTER the render and overwrote the only
        // honest string on the screen. The render writes "1 student (filtered
        // from 31)"; the loader replaced it with "31 students loaded." while a
        // single row sat in the table.
        //
        // That is how Jake's Saturday-morning report became unreadable: the
        // count and the table contradicted each other, the contradiction was
        // the only visible symptom, and the sentence that would have explained
        // it had been written and then destroyed a line later. Two writers on
        // one element, and the one that ran last knew less.
        _renderRoster();
        tableEl.style.display = '';
    } catch(e) {
        statusEl.textContent = 'Error: ' + escHtml(e.message);
    }
}

// ⚠️⚠️ ROADMAP 58, THE COLLAPSE STEP. This was the fourth hand-written copy of
// `(getDay() + 1) % 7`. ⚠️ IT IS A SHAPE ADAPTER NOW — daylog.js's weekStartOf()
// owns the rule; this file's callers want a Date, so it converts.
// ⚠️ DO NOT REINTRODUCE THE ARITHMETIC HERE. The header comment in admin.html
// that points at this function is still accurate, and must stay accurate.
// ⚠️ NOON, NOT MIDNIGHT: a Date built from a bare 'YYYY-MM-DD' is parsed as UTC
// and lands on the PREVIOUS day west of Greenwich. Every date in this project is
// anchored at noon for that reason.
function _weekStartDate(date) {
    return new Date(weekStartOf(_localDateStr(new Date(date))) + 'T12:00:00');
}

function _localDateStr(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

// The day a `typing_logs` document IS, taken from how it is addressed.
//
// ⚠️ v1.13.1. Ids are `{uid}_{date}` — built that way in daylog.js, in game.js,
// in learn.js and in reports.html, which is what makes the id trustworthy in a
// way the stamped `date` field is not. Returns '' when the pattern does not
// match, so the caller can fall back rather than invent a day.
//
// ⚠️ ANCHORED AT THE END (`$`) BECAUSE A UID MAY CONTAIN AN UNDERSCORE. Firebase
// allows it, Google sign-in happens not to produce one, and "happens not to" is
// not a thing to key a grade off. `split('_')[1]` would truncate such a uid's
// date to nothing; this cannot.
//
// ⚠️ IT VALIDATES THE SHAPE, NOT THE CALENDAR. `2026-13-45` matches and is
// returned. That is deliberate: this function's job is to say what the id
// claims, and a nonsense date that reaches the roster as a visible oddity is
// better than one silently swapped for a plausible one. Nothing downstream does
// arithmetic on it — the gate and the week boundary are both string compares.
function _logDateFromId(id) {
    const m = /_(\d{4}-\d{2}-\d{2})$/.exec(id || '');
    return m ? m[1] : '';
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

// ── Stuck-student scan (v1.7.0) ──────────────────────────────────────────────
// The report that would have caught the whole problem in week two. A student
// grinding on one run they can't clear used to be invisible: lessonProgress was only
// written when a lesson was finished, so they rendered as "not started" — identical
// to a student who never opened it. learn.js v2.1.0 records every finished run; this
// reads those records back.
//
// Deliberately a button, not a live panel: it costs one subcollection read per
// student in the current filter, so ~25 reads for a class and ~300 for the whole
// school. Cheap on demand, wasteful on a timer.
const STUCK_FAILURES = 3;   // failures on a single uncleared run before we flag it

async function scanForStuck() {
    const btn    = document.getElementById('stuck-scan-btn');
    const outEl  = document.getElementById('stuck-results');
    const statEl = document.getElementById('stuck-status');
    if (!outEl) return;

    // Same filter the roster is showing, so "scan" always means "scan what I see".
    const classFilter = (document.getElementById('student-filter-class') || {}).value || 'all';
    const roster = _rosterData.filter(r => {
        if (classFilter === 'none') return !r.classId;
        if (classFilter !== 'all')  return r.classId === classFilter;
        return true;
    });

    if (!roster.length) { outEl.innerHTML = '<div style="color:#888;">No students in the current filter.</div>'; return; }

    if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
    outEl.innerHTML = '';
    const setStat = (m, c) => { if (statEl) { statEl.textContent = m; statEl.style.color = c || '#888'; } };

    // ⚠️⚠️ v1.16.0 — THE COST IS STATED BEFORE IT IS SPENT.
    //
    // Jake ran this over 138 students and reported it "very slow", with nothing
    // in the console saying what it cost. It is ONE SUBCOLLECTION READ PER
    // STUDENT — ~30 documents each, so ~4,000 reads for a whole school — and
    // that is the most expensive thing a teacher can click in this app.
    // ⚠️ AN UNMETERED SWEEP IS HOW A READ BUDGET GETS SPENT WITHOUT ANYONE
    // DECIDING TO SPEND IT (item 18: reads are ~50x dearer than writes).
    if (roster.length > 40) {
        const est = roster.length * 30;
        if (!confirm(`Scan ${roster.length} students?\n\n` +
                     `This reads every student's lesson history \u2014 roughly ` +
                     `${est.toLocaleString()} Firestore reads, and it takes a while.\n\n` +
                     `Narrowing the class filter first makes it much cheaper.`)) {
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            return;
        }
    }
    const _m0 = (() => { try { return window.ttbMeter && window.ttbMeter.totals(); } catch (_) { return null; } })();
    const _t0 = Date.now();

    const findings = [];
    _lessonStats = new Map();   // ROADMAP §10.H — reset per scan
    let done = 0, failed = 0;
    for (const stu of roster) {
        setStat(`Reading ${done + 1} of ${roster.length}\u2026`, '#888');
        try {
            const snap = await getDocs(collection(_db, 'users', stu.uid, 'lessonProgress'));
            snap.forEach(d => {
                // ⭐ ROADMAP §10.H — THE MEASUREMENT, FOR ZERO EXTRA READS.
                // Jake asked for this before the farming gate was designed and it
                // went unbuilt for five rounds because it read as a new feature.
                // It is not: this sweep ALREADY reads every record it needs, one
                // subcollection per student. Aggregating here costs nothing but
                // arithmetic — the alternative was a second button doing the same
                // ~300 reads over again.
                // ⚠️ COUNTED BEFORE THE `passed` EARLY RETURN BELOW. A passed
                // lesson is exactly the interesting case for farming: the
                // question is whether a lesson is being replayed BY STUDENTS WHO
                // ALREADY CLEARED IT, and returning first would have counted only
                // the students still stuck on it — the opposite population.
                _noteLessonStat(d.id, d.data());
                const r = d.data();
                if (r.passed === true) return;
                const fails = r.runFailures || {};
                let worstRun = null, worstN = 0;
                for (const [idx, n] of Object.entries(fails)) {
                    if (n > worstN) { worstN = n; worstRun = Number(idx); }
                }
                if (worstN >= STUCK_FAILURES) {
                    findings.push({
                        name: stu.name || stu.email || stu.uid,
                        lessonId: d.id,
                        run: worstRun,
                        runCount: r.runCount || 0,
                        fails: worstN,
                        attempts: (r.runAttempts || {})[String(worstRun)] || worstN,
                        lastSeen: r.lastSeenAt || '',
                        grade: r.lastGrade || ''
                    });
                }
            });
        } catch (e) { failed++; console.warn('stuck scan failed for', stu.uid, e); }
        done++;
    }

    findings.sort((a, b) => b.fails - a.fails);
    setStat(`Scanned ${done} student${done === 1 ? '' : 's'}` +
            (failed ? ` \u00b7 ${failed} unreadable` : '') +
            ` \u00b7 ${findings.length} stuck point${findings.length === 1 ? '' : 's'}`,
            findings.length ? '#ffaa00' : '#00ff41');

    if (!findings.length) {
        outEl.innerHTML = '<div style="color:#00ff41; font-size:0.85em;">' +
            'Nobody is stuck by this measure (' + STUCK_FAILURES + '+ failures on a run they haven\u2019t cleared).</div>';
    } else {
        const cell = 'padding:4px 8px; border-bottom:1px solid #262626; white-space:nowrap;';
        outEl.innerHTML =
            '<table style="border-collapse:collapse; font-size:0.78em; width:100%;"><thead><tr style="color:#4B9CD3; text-align:left;">' +
            ['Student', 'Lesson', 'Stuck on', 'Failures', 'Attempts', 'Last seen']
                .map(h => '<th style="' + cell + '">' + h + '</th>').join('') +
            '</tr></thead><tbody>' +
            findings.map(f =>
                '<tr>' +
                '<td style="' + cell + ' color:#eee;">' + escHtml(f.name) + '</td>' +
                '<td style="' + cell + ' color:#ccc;">' + escHtml(f.lessonId) + '</td>' +
                '<td style="' + cell + ' color:#b87ae8;">run ' + (f.run + 1) +
                    (f.runCount ? ' of ' + f.runCount : '') + '</td>' +
                '<td style="' + cell + ' color:#ff6666; text-align:right;">' + f.fails + '</td>' +
                '<td style="' + cell + ' color:#888; text-align:right;">' + f.attempts + '</td>' +
                '<td style="' + cell + ' color:#666;">' + escHtml((f.lastSeen || '').slice(0, 10)) + '</td>' +
                '</tr>').join('') +
            '</tbody></table>' +
            '<div style="color:#666; font-size:0.75em; margin-top:8px;">' +
            'Run numbers come from how the lesson chunked at the time. Editing a lesson\u2019s ' +
            'steps reshuffles them, so treat a stuck point from before an edit as approximate.</div>';
    }
    // ⚠️ WHAT IT COST, ON SCREEN, NOT ONLY IN THE CONSOLE. A number a teacher
    // has to open devtools for is a number a teacher does not see.
    const _m1 = (() => { try { return window.ttbMeter && window.ttbMeter.totals(); } catch (_) { return null; } })();
    const _cost = (_m0 && _m1)
        ? `${(_m1.reads - _m0.reads).toLocaleString()} reads in ${Math.round((Date.now() - _t0) / 1000)}s`
        : `${Math.round((Date.now() - _t0) / 1000)}s`;

    const tEl = document.getElementById('lesson-stats-title');
    if (tEl) tEl.textContent = 'Lesson traffic \u2014 ' + done + ' student' + (done === 1 ? '' : 's') + ' scanned';
    _renderLessonStats(done);
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
}

// ── ROADMAP §10.H — THE LESSON MEASUREMENT ───────────────────────────────────
//
// Jake asked for this FIRST, before item 10's gate was designed, and it went
// unbuilt for five rounds:
//
//   *"A read-only attempts-per-lesson column in the lessons admin costs an
//    afternoon and answers whether this is three kids or thirty, and whether it
//    is the strong ones coasting or the struggling ones hiding."*
//
// ⚠️ IT COSTS ZERO EXTRA READS. scanForStuck() already reads exactly the records
// this needs — one `lessonProgress` subcollection per filtered student. This
// aggregates the same documents on the way past. A separate button would have
// re-read ~300 documents to answer a neighbouring question about the same data.
//
// ⚠️⚠️ TWO COLUMNS ANSWER JAKE'S ACTUAL QUESTION, AND ONE OF THEM ALONE IS
// MISLEADING. "Attempts per student" high with a HIGH pass rate is the strong
// ones coasting — replaying something they have already cleared. The same number
// with a LOW pass rate is the struggling ones grinding. They are opposite
// problems with opposite fixes, and a single "attempts" column cannot tell them
// apart — which is how a farming gate could end up punishing the student it was
// built to help (lesson-gate-test.mjs Section A is the guard on that).
//
// ⚠️ `fires` IS NEW IN ROUND 41 AND IS NOT RETROSPECTIVE. `runFires` is written
// by learn.js v2.36.0 onward, so a lesson cleared before 2026-08-25 shows 0 fires
// however it was actually typed. A blank column here means "not recorded yet",
// NOT "nobody has earned one" — the same distinction §0.-30.E is about, and the
// footnote under the table says so rather than leaving it to be inferred.
let _lessonStats = new Map();

function _noteLessonStat(lessonId, r) {
    if (!lessonId || !r) return;
    let a = _lessonStats.get(lessonId);
    if (!a) {
        a = { students: 0, attempts: 0, passed: 0, fires: 0, stuck: 0, runAttempts: 0 };
        _lessonStats.set(lessonId, a);
    }
    a.students += 1;
    a.attempts += Number(r.attempts) || 0;
    if (r.passed === true) a.passed += 1;

    // ⚠️ SUM THE RUN MAP, NOT `attempts`. `attempts` counts LESSON completions
    // (saveProgress), while runAttempts counts every run finished — a student
    // grinding run 2 of 12 twenty times has attempts: 0 and is exactly who this
    // is looking for. HANDOFF §0.-13 is about that student rendering as
    // "not started".
    for (const n of Object.values(r.runAttempts || {})) a.runAttempts += Number(n) || 0;
    for (const n of Object.values(r.runFires    || {})) a.fires       += Number(n) || 0;

    const fails = Object.values(r.runFailures || {}).map(Number);
    if (r.passed !== true && fails.length && Math.max(...fails) >= STUCK_FAILURES) a.stuck += 1;
}

function _renderLessonStats(scanned) {
    const outEl = document.getElementById('lesson-stats-results');
    if (!outEl) return;
    if (!_lessonStats.size) {
        outEl.innerHTML = '<div style="color:#888; font-size:0.85em;">' +
            'No lesson records among the scanned students.</div>';
        return;
    }

    // ⚠️⚠️ v1.16.0 — RECALIBRATED AGAINST REAL DATA. v1.15.0's THRESHOLD WAS
    // PICKED BLIND AND FIRED ON ALMOST EVERY ROW.
    //
    // v1.15.0 flagged anything above 3 runs/student. Jake's first real scan (138
    // students) came back with a median near 6-7 and "replayed after passing" on
    // nearly every line. ⚠️ THAT IS §0.-20.B's RED ALARM THAT IS ALWAYS ON — a
    // signal on every row is not a signal, it is decoration, and it teaches a
    // teacher to stop reading the column. I chose that number with no data,
    // which is the thing Rule 10 exists to prevent.
    //
    // ⚠️ THE THRESHOLD IS NOW RELATIVE TO THIS SCAN. "Unusual" means unusual FOR
    // THIS COHORT — twice the median runs/student among the lessons scanned. A
    // constant cannot know what normal looks like in Jake's building.
    const rows = Array.from(_lessonStats.entries()).map(([id, a]) => {
        const perStudent = a.students ? a.runAttempts / a.students : 0;
        const passRate   = a.students ? a.passed / a.students : 0;
        const title = (_lessonCache[id] && _lessonCache[id].title) || '';
        return { id, title, ...a, perStudent, passRate, signal: '', colour: '#666' };
    });

    // ⚠️ MEDIAN, NOT MEAN. One lesson at 14.7 runs/student drags a mean upward
    // and would suppress the very rows it should be surfacing.
    const ordered = rows.map(r => r.perStudent).sort((x, y) => x - y);
    const median  = ordered.length ? ordered[Math.floor(ordered.length / 2)] : 0;
    const HEAVY   = Math.max(3, median * 2);

    // ⚠️ A LESSON WITH THREE STUDENTS IS NOISE AND IT SORTED TO THE TOP.
    // v1.15.0 ordered by runs/student alone, so u7_p9 (ONE student, 8 runs)
    // outranked u1_l4 (97 students, 744 runs). Small samples have the widest
    // spread and the least meaning. They stay LISTED — the counts are real — but
    // they cannot be flagged and they cannot lead.
    const MIN_STUDENTS = 8;

    for (const r of rows) {
        if (r.students < MIN_STUDENTS || r.perStudent < HEAVY) continue;
        if (r.passRate >= 0.90)      { r.signal = 'replayed after passing'; r.colour = '#ffaa00'; }
        else if (r.passRate <= 0.60) { r.signal = 'hard \u2014 few clearing it';  r.colour = '#ff6666'; }
        else                         { r.signal = 'heavy traffic';          r.colour = '#888';    }
    }

    // Flagged first, then by traffic: the thing being looked for is at the top,
    // the rest is reference.
    rows.sort((x, y) => (y.signal ? 1 : 0) - (x.signal ? 1 : 0) || y.perStudent - x.perStudent);

    const cell = 'padding:4px 8px; border-bottom:1px solid #262626; white-space:nowrap;';
    outEl.innerHTML =
        '<table style="border-collapse:collapse; font-size:0.78em; width:100%;"><thead><tr style="color:#4B9CD3; text-align:left;">' +
        ['Lesson', 'Students', 'Runs', 'Runs/student', 'Passed', 'A\uD83D\uDD25', 'Stuck', '']
            .map(h => '<th style="' + cell + '">' + h + '</th>').join('') +
        '</tr></thead><tbody>' +
        rows.map(r =>
            '<tr>' +
            '<td style="' + cell + ' color:#ccc;">' + escHtml(r.id) +
                (r.title ? '<span style="color:#666;"> \u00b7 ' + escHtml(r.title) + '</span>' : '') + '</td>' +
            '<td style="' + cell + ' color:#888; text-align:right;">' + r.students + '</td>' +
            '<td style="' + cell + ' color:#888; text-align:right;">' + r.runAttempts + '</td>' +
            '<td style="' + cell + ' color:#eee; text-align:right;">' + r.perStudent.toFixed(1) + '</td>' +
            '<td style="' + cell + ' color:#888; text-align:right;">' + r.passed +
                ' <span style="color:#555;">(' + Math.round(r.passRate * 100) + '%)</span></td>' +
            '<td style="' + cell + ' color:#ff9800; text-align:right;">' + (r.fires || '\u2014') + '</td>' +
            '<td style="' + cell + ' color:' + (r.stuck ? '#ff6666' : '#555') + '; text-align:right;">' +
                (r.stuck || '\u2014') + '</td>' +
            '<td style="padding:4px 0 4px 10px; border-bottom:1px solid #262626; color:' +
                r.colour + ';">' + escHtml(r.signal) + '</td>' +
            '</tr>').join('') +
        '</tbody></table>' +
        '<div style="color:#666; font-size:0.75em; margin-top:8px;">' +
        'From the same ' + scanned + '-student read as the stuck scan above \u2014 no extra Firestore reads. ' +
        '<b>Runs/student</b> counts finished runs, not lesson completions, so a student grinding one run shows up here. ' +
        'Flagged rows have more than <b>' + HEAVY.toFixed(1) + '</b> runs/student (twice this scan\u2019s median) ' +
        'AND at least ' + MIN_STUDENTS + ' students \u2014 the bar is relative to this cohort, not fixed. ' +
        '<b>Replayed after passing</b> is the farming signal; <b>hard</b> is the opposite problem. ' +
        '\u26a0\ufe0f A\uD83D\uDD25 is recorded from 2026-08-25 onward only \u2014 a dash means not recorded, not zero earned.' +
        '</div>';
}

// ── Render filtered/sorted roster ─────────────────────────────────────────────
function _renderRoster() {
    const timeFilter  = document.getElementById('student-filter-time').value;
    const classFilter = document.getElementById('student-filter-class').value;
    const textFilter  = (document.getElementById('student-filter-text').value || '').toLowerCase().trim();
    const tbody       = document.getElementById('student-roster-body');

    const today = new Date();
    let cutoff  = '';
    if (timeFilter === 'thisweek') { cutoff = _localDateStr(_weekStartDate(today)); }
    if (timeFilter === '7days')    { const d = new Date(today); d.setDate(d.getDate()-7);  cutoff = _localDateStr(d); }
    if (timeFilter === 'month')    { const d = new Date(today); d.setDate(d.getDate()-30); cutoff = _localDateStr(d); }
    if (timeFilter === '9weeks')   { const d = new Date(today); d.setDate(d.getDate()-63); cutoff = _localDateStr(d); }

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

    // ⚠️ THIS PANEL IS "WHO HAS BEEN ACTIVE", NOT "WHO IS ENROLLED", AND THE
    // LABEL HAS TO SAY SO. _rosterData is built from typing_logs over the last
    // ROSTER_DAYS days — a student imported from a roster who has never typed
    // does not appear here under ANY filter, and no amount of widening the date
    // range will summon them. A bare count reads like enrollment, which sent
    // Jake looking for 80 students in a list that structurally cannot contain
    // anyone who has not typed.
    //
    // Both numbers are always shown when they differ, because the gap between
    // them IS the diagnosis: "1 of 31 active" says the filter is hiding people,
    // where "1 student" says nobody is there.
    const statusEl = document.getElementById('student-list-status');
    const rangeLabel = {
        '7days':    'last 7 days',
        'thisweek': 'this week (Sat–Fri)',
        'month':    'last 30 days',
        '9weeks':   'last 9 weeks',
        'all':      'last ' + ROSTER_DAYS + ' days'
    }[timeFilter] || 'the selected range';

    if (!_rosterData.length) {
        statusEl.textContent = 'No students have typed in the last ' + ROSTER_DAYS +
            ' days. This list is built from typing activity, not from your roster ' +
            'import — students who have not typed yet never appear here.';
    } else if (rows.length === _rosterData.length) {
        statusEl.textContent = rows.length + ' student' + (rows.length !== 1 ? 's' : '') +
            ' active in the ' + rangeLabel + '.';
    } else {
        statusEl.textContent = rows.length + ' of ' + _rosterData.length +
            ' active students shown — ' + (_rosterData.length - rows.length) +
            ' hidden by the current filters (' + rangeLabel + ').';
    }

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

        // Build all cells via DOM — never use innerHTML+= on a row that has
        // event-listener children: it serialises/reparses and destroys them.
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

        function _td(text, color) {
            const td = document.createElement('td');
            td.style.cssText = 'padding:6px 8px; color:' + color + ';';
            td.textContent = text;
            return td;
        }
        tr.appendChild(_td(r.name || '—',  '#ddd'));
        tr.appendChild(_td(r.email || '—', '#777'));
        tr.appendChild(_td(r.lastLogin || '—', '#777'));
        const weekTd = _td(wm + ':' + String(ws).padStart(2,'0'), '#aaa');
        weekTd.style.fontFamily = 'monospace';
        tr.appendChild(weekTd);
        tr.appendChild(_td(clsName, cls ? '#4B9CD3' : '#444'));

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
    const testBtn   = document.getElementById('student-csv-preview-btn');
    const loadingEl = document.getElementById('student-csv-loading');
    _csvParsed      = [];
    // ⚠️ Reset with the parse. A mode chosen for the PREVIOUS file must not
    // survive into this one — paste a new roster, get asked again.
    _csvOverwriteMode = null;
    commitBtn.disabled = true;
    commitBtn.style.opacity = '0.4';
    commitBtn.style.cursor  = 'not-allowed';
    areaEl.innerHTML = '';

    if (!raw) {
        areaEl.innerHTML = '<span style="color:#ff6666;">No data — upload a file or paste CSV first.</span>';
        return;
    }

    if (loadingEl) { loadingEl.style.display = ''; loadingEl.textContent = 'Loading classes…'; }
    try {
        const classSnap = await getDocs(collection(_db, 'classes'));
        _classCache = {};
        classSnap.forEach(d => { _classCache[d.id] = { id: d.id, ...d.data() }; });
        _buildClassFilterDropdown();
        _buildBulkClassDropdown();
    } catch(e) {
        areaEl.innerHTML = '<span style="color:#ff6666;">Failed to load classes: ' + escHtml(e.message) + '</span>';
        if (loadingEl) loadingEl.style.display = 'none';
        return;
    }
    if (loadingEl) loadingEl.style.display = 'none';

    const lines = raw.split(/\r?\n/).filter(l => l.trim());
    const rows  = lines.map(l => {
        const idx = l.indexOf(',');
        return idx === -1 ? [l.trim(), ''] : [l.slice(0, idx).trim(), l.slice(idx+1).trim()];
    }).map(cols => cols.map(c => c.replace(/^"|"$/g, '').trim()));

    const hasHeader = rows[0][0].toLowerCase() === 'email' || !rows[0][0].includes('@');
    const dataRows  = hasHeader ? rows.slice(1) : rows;

    // ⚠️ NORMALISED KEYS (v1.8.0). This used to lowercase and nothing else, so a
    // roster export writing "Period 3" against a class named "Period-3" was
    // reported as missing. That mattered more once the importer could CREATE
    // missing classes: the obvious feature, built on the old lookup, would have
    // answered a punctuation mismatch by making a second class with the same
    // name and splitting the roster across both.
    const classLookup = new Map();
    Object.values(_classCache).forEach(cls => {
        classLookup.set(_classKey(cls.name), cls.id);
        classLookup.set(_classKey(cls.id), cls.id);
    });

    const emailToUid = new Map();
    const uidToClass = new Map();
    _rosterData.forEach(r => {
        if (r.email) emailToUid.set(r.email.toLowerCase(), r.uid);
        uidToClass.set(r.uid, r.classId || '');
    });

    // normalised key → { name: first spelling seen in the file, rows: how many }
    const missingClasses = new Map();

    // ── The two counts the decision block is about (v1.10.0) ──
    // queuedRows: no uid, so this becomes a pendingClassAssignments record and the
    //   student's existing class — if they have one — is unknown from here.
    // movedRows: has a uid AND is already in a DIFFERENT class, so committing
    //   moves them. This was always what happened; it was just never said out loud.
    let queuedRows = 0;
    let movedRows  = 0;

    let html = '<table style="width:100%; border-collapse:collapse;">' +
        '<tr style="color:#666; border-bottom:1px solid #333;">' +
        '<th style="text-align:left; padding:3px 6px;">Email</th>' +
        '<th style="text-align:left; padding:3px 6px;">Class</th>' +
        '<th style="text-align:left; padding:3px 6px;">Status</th></tr>';

    dataRows.forEach(cols => {
        const email   = (cols[0] || '').toLowerCase().trim();
        const clsRaw  = (cols[1] || '').trim();
        const uid     = emailToUid.get(email);
        const classId = classLookup.get(_classKey(clsRaw));
        const clsName = classId ? (_classCache[classId]?.name || classId) : null;

        let status, ok = false;
        if (!email)    { status = '<span style="color:#555;">empty row</span>'; }
        else if (!uid) {
            // ⚠️ THIS LABEL USED TO SAY "will apply on first login" AND IT WAS AN
            // ASSERTION ABOUT A STUDENT THIS FUNCTION KNOWS NOTHING ABOUT.
            //
            // A missing uid means only one thing: no typing_logs in the last
            // ROSTER_DAYS days. It does NOT mean the student is new. A returning
            // student who last typed in the spring looks identical here, and they
            // already have a classId from last year — which is exactly the case
            // the consumer used to discard in silence. The old wording promised an
            // outcome for the one case where the outcome was "nothing happens",
            // in confident blue, with no error anywhere in the chain.
            //
            // Say what is actually known, and let the decision block below ask
            // about what isn't.
            if (classId) {
                status = '<span style="color:#4B9CD3;">⏰ not in the last ' + ROSTER_DAYS +
                    ' days of logs — will queue for ' + escHtml(clsName) + '</span>';
                ok = true; // write to pending collection keyed by email
                queuedRows++;
                _csvParsed.push({ uid: null, email, classId: classId || '' });
                return; // skip the push below
            } else {
                status = '<span style="color:#888;">not in logs, class unknown — skipped</span>';
            }
        }
        else if (!clsRaw) { status = '<span style="color:#888;">will clear class</span>'; ok = true; }
        else if (!_isUsableClassName(clsRaw)) {
            status = '<span style="color:#ff6666;">class name has no letters or numbers: "' +
                escHtml(clsRaw) + '" — fix the file</span>';
        }
        else if (!classId) {
            // ⚠️ Record it rather than only complaining about it. The file in
            // front of us already names every class the import needs; sending
            // an admin to another tab to retype them was the bug.
            if (!missingClasses.has(_classKey(clsRaw))) {
                missingClasses.set(_classKey(clsRaw), { name: clsRaw, rows: 0 });
            }
            missingClasses.get(_classKey(clsRaw)).rows++;
            status = '<span style="color:#ffaa00;">no class named "' + escHtml(clsRaw) +
                '" yet — see below</span>';
        }
        else { status = '<span style="color:#22c55e;">✓ → ' + escHtml(clsName) + '</span>'; ok = true; }

        // A visible student already in a different class is a MOVE, and the row
        // should say so rather than showing the same green tick as a first
        // placement. This is the case the roster can actually see; the queued rows
        // above are the same question with the answer hidden.
        if (ok && uid && classId) {
            const cur = uidToClass.get(uid) || '';
            if (cur && cur !== classId) {
                movedRows++;
                status = '<span style="color:#ffaa00;">↷ move from ' +
                    escHtml(_classCache[cur]?.name || cur) + ' → ' + escHtml(clsName) + '</span>';
            }
        }

        if (ok) _csvParsed.push({ uid, email, classId: classId || '' });

        html += '<tr style="border-bottom:1px solid #111;">' +
            '<td style="padding:2px 6px; color:#ccc;">' + escHtml(email) + '</td>' +
            '<td style="padding:2px 6px; color:#aaa;">' + escHtml(clsRaw || '—') + '</td>' +
            '<td style="padding:2px 6px;">' + status + '</td></tr>';
    });
    html += '</table>';
    areaEl.innerHTML = html;

    // ── Offer to create the classes this file names and Firestore doesn't have ──
    if (missingClasses.size) {
        const schools = await _loadSchoolOptions();
        const list = [...missingClasses.values()];
        _csvMissingClasses = list;

        const rowsWord = n => n + ' student' + (n === 1 ? '' : 's');
        const names = list.map(m =>
            '<li style="margin:2px 0;"><b style="color:#eee;">' + escHtml(m.name) + '</b>' +
            ' <span style="color:#666;">— ' + rowsWord(m.rows) + '</span></li>').join('');

        let picker;
        if (!schools.length) {
            // schoolId is REQUIRED by firestore.rules; a class with no building
            // cannot be scoped, so there is nothing useful to offer here.
            picker = '<div style="color:#ffaa00; margin-top:6px;">No schools available — ' +
                     'a super admin has to create one first (Firestore console → schools). ' +
                     'A class has to belong to a building.</div>';
        } else {
            picker =
                '<div style="margin-top:8px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">' +
                '<label style="color:#888;">Building:</label>' +
                '<select id="csv-newclass-school" class="l-field" style="width:auto; padding:3px 6px;">' +
                schools.map(x => '<option value="' + escHtml(x.id) + '">' + escHtml(x.name) + '</option>').join('') +
                '</select>' +
                '<button id="csv-create-classes-btn" class="lbtn lbtn-primary" ' +
                'style="width:auto; padding:5px 12px; font-size:0.85em;">' +
                'Create ' + list.length + ' class' + (list.length === 1 ? '' : 'es') + '</button>' +
                '<span id="csv-create-classes-status" style="color:#888;"></span>' +
                '</div>';
        }

        areaEl.innerHTML +=
            '<div style="margin-top:10px; padding:8px 10px; border:1px solid #444; background:#141414;">' +
            '<div style="color:#ffaa00; font-weight:bold; margin-bottom:4px;">' +
            list.length + ' class name' + (list.length === 1 ? '' : 's') + ' in this file ' +
            (list.length === 1 ? 'does' : 'do') + " not exist yet</div>" +
            '<ul style="margin:4px 0 0 18px; padding:0; color:#ccc;">' + names + '</ul>' +
            // ⚠️ The read-before-write warning is the whole reason this is a
            // button and not automatic. A typo is indistinguishable from a new
            // class, and the resulting split roster looks correct here.
            '<div style="color:#888; margin-top:6px; font-size:0.95em;">' +
            'Read these before creating them — a misspelling here becomes a real class, ' +
            'and the students in it stop showing up under the class you meant.' +
            '</div>' + picker +
            '</div>';

        // ⚠️ NO addEventListener HERE ANY MORE (v1.10.0), AND THIS WAS ALREADY A
        // BUG BEFORE THIS VERSION EXISTED. The Create-classes button used to be
        // wired right here — and then the `_csvParsed.length > 0` block below did
        // `areaEl.innerHTML +=`, which re-parses this container and throws away
        // every node in it, listener and all. So any file that named both a new
        // class AND at least one valid row produced a Create-classes button that
        // did nothing at all when clicked. Silently: a dead button looks exactly
        // like a slow one.
        //
        // ⚠️ `innerHTML +=` IS NOT AN APPEND. It is a read, a concatenate, and a
        // full re-parse of the whole subtree. Every listener bound to anything
        // already inside is gone. All wiring for this panel now happens once, at
        // the end of the function, after the last write. Do not bind above it.
    }

    if (_csvParsed.length > 0) {
        // ── THE DECISION BLOCK (v1.10.0) ──────────────────────────────────────
        //
        // ⚠️ THIS IS THE POINT OF THE WHOLE VERSION. An import that reassigns
        // students had exactly one behaviour and never named it: visible students
        // were moved without being asked about, and queued students were silently
        // dropped by the consumer if they already had a class. Two opposite
        // outcomes, one button, no way to tell which you were getting.
        //
        // It is deliberately NOT an overlay modal. This file already has a pattern
        // for a decision that changes what gets written — the "create the classes
        // this file names" block — and it works because it sits in the preview,
        // next to the table it is about, and cannot be dismissed by a stray click
        // the way a modal can. Commit stays locked until a radio is chosen, so the
        // answer is impossible to skip rather than merely easy to give.
        //
        // Asked only when it matters: a file with no returning students and no
        // moves has nothing to decide, and a prompt with one sane answer trains
        // people to click through prompts.
        const needsDecision = (queuedRows > 0 || movedRows > 0);
        if (needsDecision) {
            const parts = [];
            if (movedRows)  parts.push('<b style="color:#eee;">' + movedRows + '</b> ' +
                (movedRows === 1 ? 'student is' : 'students are') +
                ' already in a different class');
            if (queuedRows) parts.push('<b style="color:#eee;">' + queuedRows + '</b> ' +
                (queuedRows === 1 ? 'student has' : 'students have') +
                ' not typed in ' + ROSTER_DAYS + ' days, so whether ' +
                (queuedRows === 1 ? 'they already have' : 'they already have') +
                ' a class is unknown from here');

            areaEl.innerHTML +=
                '<div style="margin-top:10px; padding:8px 10px; border:1px solid #4B9CD3; background:#0f1620;">' +
                '<div style="color:#4B9CD3; font-weight:bold; margin-bottom:4px;">' +
                'What should happen to students who already have a class?</div>' +
                '<ul style="margin:4px 0 6px 18px; padding:0; color:#ccc;">' +
                parts.map(p => '<li style="margin:2px 0;">' + p + '</li>').join('') +
                '</ul>' +
                '<div style="color:#888; font-size:0.95em; margin-bottom:6px;">' +
                'Returning students carry last year&rsquo;s class until something moves them. ' +
                'A queued assignment applies the next time that student signs in.' +
                '</div>' +
                '<label style="display:block; color:#ccc; margin:3px 0; cursor:pointer;">' +
                '<input type="radio" name="csv-overwrite" value="move"> ' +
                'Move them into the class named in this file' +
                '<span style="color:#666;"> — use this for a new rotation</span></label>' +
                '<label style="display:block; color:#ccc; margin:3px 0; cursor:pointer;">' +
                '<input type="radio" name="csv-overwrite" value="newonly"> ' +
                'Leave existing classes alone; only place students who have none' +
                '<span style="color:#666;"> — use this to top up a roster mid-term</span></label>' +
                '<div id="csv-overwrite-status" style="color:#ffaa00; margin-top:6px;">' +
                'Choose one to unlock Commit.</div>' +
                '</div>';
        }

        // Enable Commit and make it the obvious next step. When a decision is
        // outstanding the button stays locked — see the radio handler below.
        const unlockCommit = () => {
            commitBtn.disabled = false;
            commitBtn.style.opacity = '1';
            commitBtn.style.cursor  = 'pointer';
            commitBtn.className = 'lbtn lbtn-primary';
            if (testBtn) { testBtn.className = 'lbtn lbtn-secondary'; }
        };

        areaEl.innerHTML += '<div style="margin-top:6px; color:#22c55e; font-weight:bold;">' +
            '✓ ' + _csvParsed.length + ' assignment' + (_csvParsed.length !== 1 ? 's' : '') +
            ' ready' + (needsDecision ? ' — answer the question above, then click Commit.'
                                      : ' — click Commit to apply.') + '</div>';

        // ── ALL WIRING HAPPENS HERE, AFTER THE LAST innerHTML WRITE ──────────
        // See the note in the missing-classes block above. Nothing may be bound
        // before this point, because any later `innerHTML +=` re-parses the whole
        // container and silently discards every listener inside it.
        if (needsDecision) {
            areaEl.querySelectorAll('input[name="csv-overwrite"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    _csvOverwriteMode = radio.value;
                    const st = document.getElementById('csv-overwrite-status');
                    if (st) {
                        st.style.color = '#22c55e';
                        st.textContent = radio.value === 'move'
                            ? '\u2713 Students already in a class will be moved.'
                            : '\u2713 Students already in a class will be left where they are.';
                    }
                    unlockCommit();
                });
            });
        } else {
            // Nothing ambiguous in this file. 'move' is the correct mode for the
            // rows that remain: a student with no class cannot be moved out of one,
            // so the flag changes nothing and there is no question to ask.
            _csvOverwriteMode = 'move';
            unlockCommit();
        }
    } else {
        areaEl.innerHTML += missingClasses.size
            ? '<div style="margin-top:6px; color:#888;">Nothing to commit yet — create the classes above, ' +
              'then this re-checks itself.</div>'
            : '<div style="margin-top:6px; color:#ffaa00;">No valid rows — check class names match and students have typing logs.</div>';
    }

    // Create-classes button, wired last for the same reason as the radios.
    const createBtn = document.getElementById('csv-create-classes-btn');
    if (createBtn) createBtn.addEventListener('click', _createMissingClasses);
}

let _csvMissingClasses = [];

// Shared by the class form and the CSV importer. Returns [{id, name}] limited to
// the caller's own buildings, or everything for a super admin.
// ═══ ⚠️ ROADMAP 59 — A CLASS CARD MUST SAY WHOSE IT IS (v1.20.0) ════════════
//
// Jake: *"there is zero indication on this page as to which teacher or school
// these classes belong to. I should be able to see both of those things and
// filter by them."*
//
// ⚠️ THE DATA WAS ALREADY THERE. Every class document carries `schoolId` and
// `teacherUids`, and `_classCache` has held both all along — the card simply
// never printed them. The only thing that needed fetching was the uid→name and
// id→name lookups, and both are cached and lazy.
//
// ⚠️⚠️ SCOPE IS NOT A FILTER. What a building_admin may SEE is decided by
// firestore.rules and by `_scope`, not by this dropdown. The filter narrows a
// list that is already scoped; it must never be the thing that scopes it, or the
// first person to clear it sees another building's classes.

let _teacherNames = null;      // uid → display name, or null until loaded
let _schoolNames  = null;      // id  → name

/**
 * ⚠️ ONE getDocs, ON FIRST NEED, CACHED (§READS). The class list renders without
 * it and fills the names in when they arrive — a panel that blocks on a lookup it
 * only needs for LABELS is a panel that fails to open when the lookup fails.
 */
async function _loadTeacherNames() {
    if (_teacherNames) return _teacherNames;
    const out = {};
    try {
        const snap = await getDocs(collection(_db, 'staff'));
        snap.forEach(d => {
            const v = d.data() || {};
            out[d.id] = v.displayName || v.name || v.email || d.id;
        });
    } catch (e) {
        // ⚠️ A teacher cannot read the staff collection, and that is correct.
        // Their own classes are the only ones they see, so the name adds nothing.
        console.warn('Could not load staff names:', e);
    }
    _teacherNames = out;
    return out;
}

/** The school names, keyed. ⚠️ Reuses _loadSchoolOptions() so "which buildings"
 *  keeps having ONE answer — the same reason populateClassSchools() does. */
async function _loadSchoolNames() {
    if (_schoolNames) return _schoolNames;
    const out = {};
    for (const s of await _loadSchoolOptions()) out[s.id] = s.name;
    _schoolNames = out;
    return out;
}

async function _loadSchoolOptions() {
    try {
        const snap = await getDocs(collection(_db, 'schools'));
        const out = [];
        snap.forEach(d => {
            if (_isSuper() || _scope.schoolIds.includes(d.id)) {
                out.push({ id: d.id, name: (d.data().name || d.id) });
            }
        });
        return out;
    } catch (e) {
        console.warn('Could not load schools:', e);
        return [];
    }
}

// Create every class the CSV named that Firestore doesn't have, then re-run the
// preview so the rows that were amber turn green and Commit lights up.
//
// ⚠️ RE-RUNS _previewCSV() RATHER THAN PATCHING THE TABLE IN PLACE. The preview
// is derived from _classCache and the file; once the cache changes, the only
// honest way to show the new state is to derive it again. Patching the rows
// would leave _csvParsed built against the old cache — the table would say
// green and the commit would write the old thing.
async function _createMissingClasses() {
    const btn      = document.getElementById('csv-create-classes-btn');
    const statusEl = document.getElementById('csv-create-classes-status');
    const schoolId = (document.getElementById('csv-newclass-school') || {}).value || '';
    const pending  = _csvMissingClasses.slice();

    if (!schoolId) {
        if (statusEl) { statusEl.textContent = 'Pick a building first.'; statusEl.style.color = '#ff6666'; }
        return;
    }
    if (!pending.length) return;

    if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; btn.style.cursor = 'not-allowed'; }
    if (statusEl) { statusEl.textContent = 'Creating…'; statusEl.style.color = '#888'; }

    let made = 0;
    const failed = [];
    for (const m of pending) {
        try {
            const id = _newClassId(m.name);
            const rec = _newClassRecord(m.name, schoolId, 0, 0);
            await setDoc(doc(_db, 'classes', id), rec);
            _classCache[id] = { id, ...rec };
            made++;
        } catch (e) {
            // ⚠️ Named individually. "3 of 5 failed" with no names means redoing
            // all five and hoping, and a rules rejection here is usually about
            // one specific building rather than the batch.
            failed.push(m.name + ' (' + (e.message || e) + ')');
        }
    }

    // Goals are deliberately 0 — a class created from a roster file has no
    // stated daily or weekly target, and inventing one would be a number
    // appearing in a student's HUD that nobody chose. Set them in Classes.
    _buildClassFilterDropdown();
    _buildBulkClassDropdown();
    refreshClassDropdownInStudents();
    renderClassList();
    if (made && _onClassesChanged) { try { await _onClassesChanged(); } catch (_) {} }

    _csvMissingClasses = [];

    if (statusEl) {
        statusEl.textContent = failed.length
            ? made + ' created, ' + failed.length + ' failed'
            : made + ' created. Re-checking the file…';
        statusEl.style.color = failed.length ? '#ffaa00' : '#22c55e';
    }
    if (failed.length) {
        const areaEl = document.getElementById('student-csv-preview-area');
        if (areaEl) areaEl.innerHTML += '<div style="color:#ff6666; margin-top:6px;">Could not create: ' +
            escHtml(failed.join('; ')) + '</div>';
        if (!made) {
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
            return;
        }
    }

    await _previewCSV();
}

async function _commitCSV() {
    if (!_csvParsed.length) return;
    const commitBtn = document.getElementById('student-csv-commit-btn');
    const areaEl    = document.getElementById('student-csv-preview-area');
    commitBtn.disabled = true;
    areaEl.innerHTML += '<div style="color:#888; margin-top:6px;">Writing…</div>';


    // ⚠️ THE MODE MUST GOVERN BOTH PATHS OR IT IS A LIE (v1.10.0). "Leave existing
    // classes alone" has to mean the same thing for a student the roster can see
    // as for one it cannot — otherwise the answer applies to whichever half of the
    // file the 45-day log window happened to put someone in, which is exactly the
    // kind of split behaviour this version exists to remove. Visible students are
    // skipped here; queued students carry the flag to the consumer in game.js and
    // learn.js, which is the only code in a position to see their current class.
    const overwrite = (_csvOverwriteMode !== 'newonly');

    let ok = 0, fail = 0, skipped = 0, queued = 0;
    for (const { uid, email, classId } of _csvParsed) {
        // ⚠️ v1.14.0 — ROADMAP 11. Through the one answerer, not out of
        // _classCache. ⚠️ PER ROW, NOT HOISTED: a rollover CSV can name a
        // DIFFERENT class on every line, so one lookup for the file would stamp
        // the first row's building onto all of them. _schoolIdForClass() caches,
        // so this is one read per distinct class, not per row.
        const _csvSchoolId = await _schoolIdForClass(classId);
        try {
            if (uid) {
                if (!overwrite) {
                    const r = _rosterData.find(r => r.uid === uid);
                    const cur = (r && r.classId) || '';
                    if (cur && cur !== classId) { skipped++; continue; }
                }
                // Student has typed — write directly to their user doc
                // schoolId MUST ride along. If this student has no user document
                // yet, the write is a CREATE, and firestore.rules requires the
                // building on create — otherwise there's nothing to scope by.
                await setDoc(doc(_db, 'users', uid), {
                    classId: classId || null,
                    schoolId: _csvSchoolId
                }, { merge: true });
                const r = _rosterData.find(r => r.uid === uid);
                if (r) r.classId = classId || '';
                ok++;
            } else {
                // Not in the last ROSTER_DAYS of logs, so there is no uid to write
                // to. Queue it by email; the student's own next sign-in applies it.
                //
                // ⚠️ `overwrite` IS THE WHOLE FIX. Without it the consumer had to
                // guess whether a student's existing classId was last year's or
                // this morning's, guessed "leave it", and discarded every rollover
                // assignment in silence. The teacher answered that question on the
                // preview screen; this carries the answer to where it is needed.
                await setDoc(doc(_db, 'pendingClassAssignments', email.toLowerCase()), {
                    classId: classId || null,
                    schoolId: _csvSchoolId,
                    overwrite,
                    assignedAt: new Date().toISOString() });
                queued++;
            }
        } catch(e) { fail++; }
    }

    // Every number that is not zero gets said out loud. A bare "12 assigned" over
    // a 14-row file is how the returning-student defect stayed invisible: the
    // count was true and the sentence was still misleading.
    const bits = [ok + ' assigned'];
    if (queued)  bits.push(queued + ' queued for their next sign-in');
    if (skipped) bits.push(skipped + ' left in their current class');
    if (fail)    bits.push(fail + ' failed');
    areaEl.innerHTML += '<div style="color:' + (fail ? '#ffaa00' : '#22c55e') +
        '; margin-top:4px;">✓ Done: ' + bits.join(', ') + '.</div>';
    _csvParsed = [];
    _csvOverwriteMode = null;
    // Reset buttons to default state
    commitBtn.disabled = true;
    commitBtn.style.opacity = '0.4';
    commitBtn.style.cursor  = 'not-allowed';
    commitBtn.className = 'lbtn lbtn-secondary';
    const testBtnR = document.getElementById('student-csv-preview-btn');
    if (testBtnR) testBtnR.className = 'lbtn lbtn-primary';
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
