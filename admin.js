// v1.9.7.10 - Restored Missing Buttons & Wizard Logic
import { db, auth } from "./firebase-config.js";
import { doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const ADMIN_VERSION = "1.9.9";

// Comprehensive character replacement map (shared logic with game.js runtime)
const CHAR_REPLACEMENTS = {
    '\u2018': "'", '\u2019': "'", '\u201A': "'",
    '\u201C': '"', '\u201D': '"', '\u201E': '"',
    '\u2039': "'", '\u203A': "'",
    '\u00AB': '"', '\u00BB': '"',
    '\u02BC': "'", '\u2032': "'", '\u2033': '"',
    '\u2013': '-', '\u2014': '--', '\u2015': '--',
    '\u2012': '-', '\u2010': '-', '\u2011': '-', '\u00AD': '',
    '\u2026': '...', '\u2022': '-', '\u2023': '-', '\u2027': '-', '\u00B7': '.',
    '\u00A0': ' ', '\u2002': ' ', '\u2003': ' ', '\u2004': ' ', '\u2005': ' ',
    '\u2006': ' ', '\u2007': ' ', '\u2008': ' ', '\u2009': ' ', '\u200A': ' ',
    '\u202F': ' ', '\u205F': ' ',
    '\u200B': '', '\u200C': '', '\u200D': '', '\u200E': '', '\u200F': '',
    '\uFEFF': '', '\u2060': '',
    '\u00C6': 'AE', '\u00E6': 'ae', '\u0152': 'OE', '\u0153': 'oe',
    '\u0132': 'IJ', '\u0133': 'ij',
    '\uFB00': 'ff', '\uFB01': 'fi', '\uFB02': 'fl', '\uFB03': 'ffi', '\uFB04': 'ffl',
    '\u00DF': 'ss', '\u00F0': 'd', '\u00FE': 'th', '\u00DE': 'Th',
    '\u00A9': '(c)', '\u00AE': '(R)', '\u2122': '(TM)',
    '\u00B0': ' degrees', '\u00D7': 'x', '\u00F7': '/', '\u2212': '-', '\u00B1': '+/-',
    '\u00BC': '1/4', '\u00BD': '1/2', '\u00BE': '3/4', '\u2153': '1/3', '\u2154': '2/3',
    '\u00A2': 'cents', '\u00A3': 'GBP ', '\u00A5': 'JPY ', '\u20AC': 'EUR ',
    '\u2020': '*', '\u2021': '**', '\u00A7': 'S.', '\u00B6': '', '\u2016': '||', '\u2044': '/',
};

function sanitizeText(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        result += (ch in CHAR_REPLACEMENTS) ? CHAR_REPLACEMENTS[ch] : ch;
    }
    result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    result = result.replace(/[^ -~\t\n]/g, '');
    result = result.replace(/ {2,}/g, ' ');
    return result;
}

// DOM Elements
const statusEl = document.getElementById('status');
const loginSec = document.getElementById('login-section');
const editorSec = document.getElementById('editor-section');
const loginBtn = document.getElementById('login-btn');
const footerEl = document.getElementById('admin-footer');

// Top Section
const bookSelect = document.getElementById('book-select');
const editExistingUI = document.getElementById('edit-existing-ui');
const createNewUI = document.getElementById('create-new-ui');
const openBookBtn = document.getElementById('open-book-btn');

// Create New Inputs
const newBookId = document.getElementById('new-book-id');
const newBookTitle = document.getElementById('new-book-title');
const newEpubFile = document.getElementById('new-epub-file');
const createParseBtn = document.getElementById('create-parse-btn');

// Staging
const stagingArea = document.getElementById('staging-area');
const activeBookTitle = document.getElementById('active-book-title');
const saveTitleBtn = document.getElementById('save-title-btn');
const overwriteSection = document.getElementById('overwrite-section');
const overwriteEpubFile = document.getElementById('overwrite-epub-file');
const overwriteBtn = document.getElementById('overwrite-btn');
const chapterListEl = document.getElementById('chapter-list');
const uploadAllBtn = document.getElementById('upload-all-btn');
const cleanNewlinesCb = document.getElementById('clean-newlines');

// Manual Editor
const manualTitle = document.getElementById('manual-chap-title');
const manualNum = document.getElementById('manual-chap-num');
const jsonContent = document.getElementById('json-content');
const updateStagedBtn = document.getElementById('update-staged-btn');
const saveDirectBtn = document.getElementById('save-btn');
const manualDetails = document.getElementById('manual-details');

// Modals
const warningModal = document.getElementById('warning-modal');
const confirmOverwriteBtn = document.getElementById('confirm-overwrite-btn');
const cancelOverwriteBtn = document.getElementById('cancel-overwrite-btn');

// Wizard Modals
const wizardModal = document.getElementById('error-wizard-modal');
const wizardStep = document.getElementById('wizard-step');
const wizardCharDisplay = document.getElementById('wizard-char-display');
const wizardPreview = document.getElementById('wizard-preview');
const wizardInput = document.getElementById('wizard-edit-input');
const wizardIgnoreBtn = document.getElementById('wizard-ignore-btn');
const wizardSaveBtn = document.getElementById('wizard-save-btn');
const wizardCancelBtn = document.getElementById('wizard-cancel-btn');

// State
let stagedChapters = [];
let editingIndex = -1;
let bookTitlesMap = {};
let activeBookId = ""; 
let importErrors = [];
let currentErrorIdx = 0;

if(footerEl) footerEl.innerText = `Admin JS: v${ADMIN_VERSION}`;

// --- AUTH ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        statusEl.innerText = "Logged in as: " + user.email;
        statusEl.style.borderColor = "#00ff41"; 
        loginSec.classList.add('hidden');
        editorSec.classList.remove('hidden');
        await loadBookList();
    } else {
        statusEl.innerText = "Access Restricted.";
        statusEl.style.borderColor = "#ff3333"; 
        loginSec.classList.remove('hidden');
        editorSec.classList.add('hidden');
    }
});

loginBtn.onclick = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (e) { alert(e.message); }
};

// --- BOOK LIST ---
async function loadBookList() {
    bookSelect.innerHTML = "<option>Loading...</option>";
    bookTitlesMap = {};
    try {
        const querySnapshot = await getDocs(collection(db, "books"));
        bookSelect.innerHTML = "";
        
        const createOpt = document.createElement("option");
        createOpt.value = "__NEW__";
        createOpt.text = "➕ Create New Book...";
        createOpt.style.color = "#4B9CD3";
        createOpt.style.fontWeight = "bold";
        bookSelect.appendChild(createOpt);

        querySnapshot.forEach((doc) => {
            const b = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            bookTitlesMap[doc.id] = b.title || doc.id;
            option.text = bookTitlesMap[doc.id] + ` (${doc.id})`;
            bookSelect.appendChild(option);
        });
        
        if(querySnapshot.size > 0) bookSelect.selectedIndex = 1;
        bookSelect.dispatchEvent(new Event('change'));

    } catch (e) { bookSelect.innerHTML = "<option>Error</option>"; }
}

bookSelect.onchange = () => {
    stagingArea.classList.add('hidden'); 
    clearAuditResults();
    
    // Toggle UI Containers
    if (bookSelect.value === "__NEW__") {
        createNewUI.classList.remove('hidden');
        editExistingUI.classList.add('hidden');
        
        // Reset fields
        newBookId.value = "";
        newBookTitle.value = "";
        newEpubFile.value = "";
    } else {
        createNewUI.classList.add('hidden');
        editExistingUI.classList.remove('hidden');
        
        activeBookId = bookSelect.value;
        activeBookTitle.value = bookTitlesMap[activeBookId] || activeBookId;
    }
};

// --- LOAD FROM DB ---
openBookBtn.onclick = async () => {
    if(!activeBookId) return;
    clearAuditResults();
    statusEl.innerText = `Loading ${activeBookId}...`;
    chapterListEl.innerHTML = "Loading...";
    stagedChapters = [];
    
    try {
        const metaSnap = await getDoc(doc(db, "books", activeBookId));
        if(metaSnap.exists()) {
            const meta = metaSnap.data();
            activeBookTitle.value = meta.title || activeBookId;
            const chapters = meta.chapters || [];
            
            for (let i = 0; i < chapters.length; i++) {
                const chapId = chapters[i].id; 
                const chapNum = chapId.replace("chapter_", "");
                
                const contentSnap = await getDoc(doc(db, "books", activeBookId, "chapters", chapId));
                if(contentSnap.exists()) {
                    stagedChapters.push({
                        id: chapNum, 
                        title: chapters[i].title,
                        segments: contentSnap.data().segments || []
                    });
                }
            }
        }
        renderChapterList();
        stagingArea.classList.remove('hidden');
        overwriteSection.classList.remove('hidden');
        statusEl.innerText = "Loaded.";
        statusEl.style.borderColor = "#00ff41";

        // Auto-audit after loading
        runAudit();
    } catch(e) { statusEl.innerText = "Error: " + e.message; }
};

// --- CREATE NEW PARSE ---
createParseBtn.onclick = async () => {
    const id = newBookId.value.trim();
    const title = newBookTitle.value.trim();
    const file = newEpubFile.files[0];
    if(!id || !title || !file) return alert("Fill all fields.");
    
    activeBookId = id;
    activeBookTitle.value = title;
    await parseEpubFile(file);
    stagingArea.classList.remove('hidden');
    overwriteSection.classList.add('hidden'); // No overwrite for new
};

// --- OVERWRITE ---
overwriteBtn.onclick = () => {
    if(!overwriteEpubFile.files[0]) return alert("Select file");
    warningModal.classList.remove('hidden');
};
cancelOverwriteBtn.onclick = () => warningModal.classList.add('hidden');
confirmOverwriteBtn.onclick = async () => {
    warningModal.classList.add('hidden');
    await parseEpubFile(overwriteEpubFile.files[0]);
};

// --- EPUB PARSER & ERROR SCANNER ---
async function parseEpubFile(file) {
    statusEl.innerText = "Parsing...";
    chapterListEl.innerHTML = "Parsing...";
    stagedChapters = [];
    importErrors = []; 
    
    try {
        const zip = await JSZip.loadAsync(file);
        
        let opfPath = null;
        const files = Object.keys(zip.files);
        const containerInfo = await zip.file("META-INF/container.xml")?.async("string");
        if (containerInfo) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(containerInfo, "text/xml");
            opfPath = doc.querySelector("rootfile").getAttribute("full-path");
        } else {
            opfPath = files.find(f => f.endsWith(".opf"));
        }
        if (!opfPath) throw new Error("No OPF file found.");

        const opfContent = await zip.file(opfPath).async("string");
        const parser = new DOMParser();
        const opfDoc = parser.parseFromString(opfContent, "text/xml");
        const spine = opfDoc.getElementsByTagName("spine")[0];
        const manifest = opfDoc.getElementsByTagName("manifest")[0];
        const basePath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);

        const idToHref = {};
        Array.from(manifest.getElementsByTagName("item")).forEach(item => {
            idToHref[item.getAttribute("id")] = item.getAttribute("href");
        });

        const spineItems = Array.from(spine.getElementsByTagName("itemref"));
        let counter = 1;

        for (let item of spineItems) {
            const href = idToHref[item.getAttribute("idref")];
            if (!href) continue;

            const fullPath = (basePath === "") ? href : basePath + href;
            const content = await zip.file(fullPath).async("string");
            const doc = parser.parseFromString(content, "application/xhtml+xml");
            
            let title = `Chapter ${counter}`;
            const hTag = doc.body.querySelector('h1, h2, h3');
            if(hTag) title = hTag.innerText.trim().substring(0, 60);

            const segments = [];
            const pTags = Array.from(doc.body.querySelectorAll("p"));
            
            pTags.forEach((el) => {
                let text = el.textContent;
                if (cleanNewlinesCb.checked) text = text.replace(/[\r\n]+/g, ' '); 
                text = text.replace(/\s\s+/g, ' ').trim();
                
                // Comprehensive sanitization (smart quotes, dashes, ligatures, accents, etc.)
                text = sanitizeText(text);

                if (text.length > 0) {
                    if (!text.startsWith('\t')) text = '\t' + text;
                    const segObj = { text: text };
                    segments.push(segObj);

                    const badMatches = text.match(/[^ -~\t\n]/g);
                    if (badMatches) {
                        importErrors.push({
                            chapTitle: title,
                            segmentRef: segObj, 
                            badChar: badMatches[0], 
                            fullText: text
                        });
                    }
                }
            });

            if (segments.length > 0) {
                stagedChapters.push({ 
                    id: counter, 
                    title: title, 
                    segments: segments 
                });
                counter++;
            }
        }
        
        if (importErrors.length > 0) {
            currentErrorIdx = 0;
            showErrorWizard();
        } else {
            renderChapterList();
            statusEl.innerText = `Parsed ${stagedChapters.length} chapters.`;
            statusEl.style.borderColor = "#00ff41";
        }

    } catch (e) {
        console.error(e);
        statusEl.innerText = "Parse Error: " + e.message;
        statusEl.style.borderColor = "#ff3333";
    }
}

// --- WIZARD LOGIC ---
function showErrorWizard() {
    if (currentErrorIdx >= importErrors.length) {
        wizardModal.classList.add('hidden');
        renderChapterList();
        statusEl.innerText = "Errors resolved. Ready to upload.";
        statusEl.style.borderColor = "#00ff41";
        return;
    }

    const err = importErrors[currentErrorIdx];
    wizardStep.innerText = `${currentErrorIdx + 1} / ${importErrors.length}`;
    
    const badCharCode = err.badChar.charCodeAt(0).toString(16).toUpperCase();
    wizardCharDisplay.innerText = `"${err.badChar}" (U+${badCharCode})`;
    
    // --- CONTEXT ---
    const text = err.segmentRef.text;
    const charIndex = text.indexOf(err.badChar);
    
    // Sentence isolation logic
    let start = -1;
    for(let i = charIndex - 1; i >= 0; i--) {
        if(['.', '!', '?'].includes(text[i])) { start = i + 1; break; }
    }
    if(start === -1) start = 0;

    let end = -1;
    for(let i = charIndex; i < text.length; i++) {
        if(['.', '!', '?'].includes(text[i])) { end = i + 1; break; }
    }
    if(end === -1) end = text.length;

    if((end - start) > 300) {
        start = Math.max(0, charIndex - 100);
        end = Math.min(text.length, charIndex + 100);
    }

    let sub = text.substring(start, end).trim();
    wizardInput.value = sub;
    
    // Preview
    const safeSub = sub.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeChar = err.badChar.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const highlightHtml = `<span class="bad-char-highlight">${safeChar}</span>`;
    const previewText = safeSub.split(safeChar).join(highlightHtml); 
    
    wizardPreview.innerHTML = previewText;
    
    err.contextStart = start;
    err.contextEnd = end;
    
    wizardModal.classList.remove('hidden');
}

wizardIgnoreBtn.onclick = () => {
    // Auto-fix ALL remaining errors by running sanitizeText on each affected segment
    for (let i = currentErrorIdx; i < importErrors.length; i++) {
        const err = importErrors[i];
        err.segmentRef.text = sanitizeText(err.segmentRef.text);
    }
    currentErrorIdx = importErrors.length;
    showErrorWizard(); // will close wizard since we're past the end
};

wizardSaveBtn.onclick = () => {
    const newSnippet = wizardInput.value;
    const err = importErrors[currentErrorIdx];
    const fullText = err.segmentRef.text;
    
    // Re-validation
    const badMatches = newSnippet.match(/[^ -~\t\n]/g);
    
    if (badMatches) {
        alert(`Still found untypable character: "${badMatches[0]}"`);
    } else {
        // Stitch
        const prefix = fullText.substring(0, err.contextStart);
        const suffix = fullText.substring(err.contextEnd);
        err.segmentRef.text = prefix + newSnippet + suffix;
        
        currentErrorIdx++;
        showErrorWizard();
    }
};

wizardCancelBtn.onclick = () => {
    if(confirm("Stop import?")) {
        stagedChapters = [];
        wizardModal.classList.add('hidden');
        statusEl.innerText = "Cancelled.";
        statusEl.style.borderColor = "#ff3333";
        chapterListEl.innerHTML = "";
    }
};

// --- RENDER LIST ---
function renderChapterList() {
    chapterListEl.innerHTML = "";
    stagedChapters.forEach((chap, index) => {
        const div = document.createElement('div');
        div.className = 'chapter-item';
        div.id = `ui-chap-${index}`;
        div.innerHTML = `
            <div class="chap-info">
                <div class="chap-title">ID: ${chap.id} | ${chap.title}</div>
                <div class="chap-meta">${chap.segments.length} segments <span class="chap-status"></span></div>
            </div>
            <div class="chap-actions">
                <button class="edit-btn" data-index="${index}">Edit</button>
                <button class="danger-btn delete-btn" data-index="${index}">Del</button>
            </div>
        `;
        chapterListEl.appendChild(div);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => {
            stagedChapters.splice(parseInt(e.target.dataset.index), 1);
            renderChapterList();
        };
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = (e) => editChapter(parseInt(e.target.dataset.index));
    });
}

function editChapter(index) {
    editingIndex = index;
    const chap = stagedChapters[index];
    manualTitle.value = chap.title;
    manualNum.value = chap.id; 
    jsonContent.value = JSON.stringify({ segments: chap.segments }, null, 2);
    updateStagedBtn.classList.remove('hidden');
    saveDirectBtn.classList.add('hidden');
    manualDetails.open = true;
    manualDetails.scrollIntoView({ behavior: 'smooth' });
}

updateStagedBtn.onclick = () => {
    if (editingIndex < 0) return;
    try {
        const data = JSON.parse(jsonContent.value);
        stagedChapters[editingIndex].title = manualTitle.value;
        stagedChapters[editingIndex].id = manualNum.value.trim(); 
        stagedChapters[editingIndex].segments = data.segments;
        editingIndex = -1;
        updateStagedBtn.classList.add('hidden');
        saveDirectBtn.classList.remove('hidden');
        manualDetails.open = false;
        renderChapterList();
    } catch (e) { alert("Invalid JSON"); }
};

// --- SAVE TITLE ---
saveTitleBtn.onclick = async () => {
    if (!activeBookId) return alert("No active book.");
    const newTitle = activeBookTitle.value.trim();
    if (!newTitle) return alert("Title required.");
    try {
        await setDoc(doc(db, "books", activeBookId), { title: newTitle }, { merge: true });
        bookTitlesMap[activeBookId] = newTitle;
        statusEl.innerText = "Title Updated.";
        statusEl.style.borderColor = "#00ff41";
    } catch(e) { alert(e.message); }
};

// --- UPLOAD ALL ---
uploadAllBtn.onclick = async () => {
    if (stagedChapters.length === 0) return alert("Nothing to upload.");
    if (!activeBookId) return alert("No active book.");
    
    if (!confirm(`Overwrite ${activeBookId}?`)) return;

    statusEl.innerText = "Uploading...";
    const chapterMeta = [];

    for (let i = 0; i < stagedChapters.length; i++) {
        const chapData = stagedChapters[i];
        const chapId = (chapData.id !== undefined && chapData.id !== "") ? chapData.id : (i + 1);
        
        const uiStatus = document.querySelector(`#ui-chap-${i} .chap-status`);
        
        try {
            if(uiStatus) uiStatus.innerText = "...";
            await setDoc(doc(db, "books", activeBookId, "chapters", "chapter_" + chapId), {
                segments: chapData.segments
            });
            chapterMeta.push({ id: "chapter_" + chapId, title: chapData.title });
            if(uiStatus) { uiStatus.innerText = "✔ OK"; uiStatus.className = "chap-status ok"; }
            const row = document.getElementById(`ui-chap-${i}`);
            if(row) row.classList.add('uploaded');
        } catch (e) {
            console.error(e);
            if(uiStatus) { uiStatus.innerText = "FAIL"; uiStatus.style.color = "red"; }
            return alert(`Upload failed at ID ${chapId}`);
        }
    }

    try {
        await setDoc(doc(db, "books", activeBookId), {
            title: activeBookTitle.value.trim() || activeBookId,
            totalChapters: stagedChapters.length,
            chapters: chapterMeta
        }, { merge: true });
        
        statusEl.innerText = "Upload Complete!";
        statusEl.style.borderColor = "#00ff41";
        await loadBookList();
    } catch (e) { alert("Metadata Save Failed: " + e.message); }
};

// --- DIRECT SAVE ---
saveDirectBtn.onclick = async () => {
    if (!activeBookId) return alert("No active book.");
    const chapNum = manualNum.value.trim();
    if(chapNum === "") return alert("Chapter ID required");
    
    try {
        const data = JSON.parse(jsonContent.value);
        await setDoc(doc(db, "books", activeBookId, "chapters", "chapter_" + chapNum), data);
        statusEl.innerText = `Saved Chapter ${chapNum}`;
        statusEl.style.borderColor = "#00ff41";
    } catch(e) { alert(e.message); }
};

function resolvePath(base, relative) {
    if(base === "") return relative;
    const stack = base.split("/");
    const parts = relative.split("/");
    stack.pop(); 
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === ".") continue;
        if (parts[i] === "..") stack.pop();
        else stack.push(parts[i]);
    }
    return stack.join("/");
}

// --- BOOK AUDIT TOOL ---
const auditBtn = document.getElementById('audit-book-btn');
const auditResults = document.getElementById('audit-results');
let auditIssueData = []; // live reference to issues for editing

function clearAuditResults() {
    if (auditResults) {
        auditResults.classList.add('hidden');
        auditResults.innerHTML = '';
    }
    auditIssueData = [];
}

async function runAudit() {
    if (!activeBookId || !auditBtn) return;

    auditBtn.disabled = true;
    auditBtn.innerText = '🔍 Auditing...';
    auditResults.classList.remove('hidden');
    auditResults.innerHTML = '<div style="color:#888;">Scanning chapters...</div>';
    auditIssueData = [];

    try {
        const metaSnap = await getDoc(doc(db, "books", activeBookId));
        if (!metaSnap.exists()) { auditResults.innerHTML = '<div style="color:red;">Book metadata not found.</div>'; return; }
        const meta = metaSnap.data();
        const chapters = meta.chapters || [];

        let totalIssues = 0;

        for (const chap of chapters) {
            const chapId = chap.id;
            const chapSnap = await getDoc(doc(db, "books", activeBookId, "chapters", chapId));
            if (!chapSnap.exists()) continue;
            const data = chapSnap.data();
            const segments = data.segments || [];

            segments.forEach((seg, segIdx) => {
                const text = seg.text || '';
                for (let i = 0; i < text.length; i++) {
                    const ch = text[i];
                    const code = ch.charCodeAt(0);
                    if (code === 9 || code === 10 || (code >= 32 && code <= 126)) continue;

                    const hex = code.toString(16).toUpperCase().padStart(4, '0');
                    const replacement = CHAR_REPLACEMENTS[ch] !== undefined ? CHAR_REPLACEMENTS[ch] : '';
                    auditIssueData.push({
                        chapId, chapTitle: chap.title || chapId,
                        segIdx, charIdx: i, char: ch, hex,
                        replacement: replacement || '(delete)',
                        segments // live reference to this chapter's segments array
                    });
                    totalIssues++;
                }
            });
        }

        renderAuditResults(chapters.length, totalIssues);
    } catch (e) {
        auditResults.innerHTML = `<div style="color:red;">Audit error: ${e.message}</div>`;
        console.error('Audit error:', e);
    } finally {
        auditBtn.disabled = false;
        auditBtn.innerText = '🔍 Audit Book for Untypeable Characters';
    }
}

function renderAuditResults(chapCount, totalIssues) {
    if (totalIssues === 0) {
        auditResults.innerHTML = `
            <div style="color:#00ff41; font-weight:bold; font-size:1.1em;">✅ Clean! No untypeable characters found.</div>
            <div style="color:#888; margin-top:5px;">Scanned ${chapCount} chapters.</div>
        `;
        return;
    }

    // Group by chapter
    const grouped = {};
    auditIssueData.forEach((iss, idx) => {
        if (!grouped[iss.chapId]) grouped[iss.chapId] = { chapTitle: iss.chapTitle, issues: [] };
        grouped[iss.chapId].issues.push({ ...iss, globalIdx: idx });
    });

    let html = `
        <div style="color:#ffaa00; font-weight:bold; font-size:1.1em; margin-bottom:10px;">
            ⚠️ Found ${totalIssues} untypeable character${totalIssues !== 1 ? 's' : ''} in ${Object.keys(grouped).length} chapter${Object.keys(grouped).length !== 1 ? 's' : ''}
        </div>
        <button id="audit-fix-all-btn" style="background:#664400; border:1px solid #996600; color:#ffcc66; padding:8px 16px; cursor:pointer; margin-bottom:15px; width:auto;">
            ⚡ Auto-Fix All ${totalIssues} Issues in Database
        </button>
    `;

    Object.entries(grouped).forEach(([chapId, { chapTitle, issues }]) => {
        html += `<div style="border-bottom:1px solid #333; padding:8px 0;">`;
        html += `<div style="font-weight:bold; color:#4B9CD3;">${escapeForHtml(chapTitle)} (${chapId}) — ${issues.length} issue${issues.length !== 1 ? 's' : ''}</div>`;
        issues.forEach(iss => {
            const seg = iss.segments[iss.segIdx];
            const text = seg.text || '';
            // Get sentence context around the bad char
            let ctxStart = iss.charIdx;
            for (let j = ctxStart - 1; j >= 0 && j > ctxStart - 80; j--) {
                if (['.', '!', '?'].includes(text[j]) && j < ctxStart - 5) { ctxStart = j + 1; break; }
                ctxStart = j;
            }
            let ctxEnd = iss.charIdx;
            for (let j = ctxEnd + 1; j < text.length && j < iss.charIdx + 80; j++) {
                ctxEnd = j + 1;
                if (['.', '!', '?'].includes(text[j])) break;
            }
            const context = text.substring(ctxStart, ctxEnd).trim();
            const safeCtx = escapeForHtml(context);
            const safeCh = escapeForHtml(iss.char);
            const highlighted = safeCtx.split(safeCh).join(`<span style="background:#660000; color:#ff3333; padding:0 2px; border-radius:2px;">${safeCh}</span>`);

            html += `<div id="audit-issue-${iss.globalIdx}" style="margin:6px 0 6px 15px; padding:6px; background:#111; border:1px solid #333; border-radius:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:0.8em; color:#aaa;">
                        Seg ${iss.segIdx}, pos ${iss.charIdx}:
                        <span style="color:#ff3333; font-weight:bold;">"${safeCh}"</span>
                        (U+${iss.hex}) → <span style="color:#00ff41;">${escapeForHtml(iss.replacement)}</span>
                    </div>
                    <div style="display:flex; gap:4px;">
                        <button class="audit-edit-btn" data-idx="${iss.globalIdx}" style="background:#333; color:#4B9CD3; border:1px solid #4B9CD3; padding:2px 8px; cursor:pointer; font-size:0.7em; width:auto;">✏️ Edit</button>
                        <button class="audit-autofix-btn" data-idx="${iss.globalIdx}" style="background:#333; color:#ffcc66; border:1px solid #664400; padding:2px 8px; cursor:pointer; font-size:0.7em; width:auto;">⚡ Fix</button>
                    </div>
                </div>
                <div style="font-family:'Courier New', monospace; font-size:0.85em; color:#888; margin-top:4px; line-height:1.5;">${highlighted}</div>
                <div id="audit-editor-${iss.globalIdx}" class="hidden" style="margin-top:6px;">
                    <textarea id="audit-textarea-${iss.globalIdx}" rows="3" style="width:100%; background:#1a1a1a; color:#ddd; border:1px solid #555; padding:6px; font-family:'Courier New', monospace; font-size:0.9em; box-sizing:border-box;"></textarea>
                    <div style="display:flex; gap:6px; margin-top:4px;">
                        <button class="audit-save-btn" data-idx="${iss.globalIdx}" style="background:#0047AB; color:#fff; border:none; padding:4px 12px; cursor:pointer; font-size:0.75em; width:auto;">Save & Re-Check</button>
                        <button class="audit-cancel-btn" data-idx="${iss.globalIdx}" style="background:#333; color:#aaa; border:1px solid #555; padding:4px 12px; cursor:pointer; font-size:0.75em; width:auto;">Cancel</button>
                    </div>
                </div>
            </div>`;
        });
        html += `</div>`;
    });

    auditResults.innerHTML = html;
    wireAuditButtons();
}

function escapeForHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wireAuditButtons() {
    // Auto-Fix All
    const fixAllBtn = document.getElementById('audit-fix-all-btn');
    if (fixAllBtn) {
        fixAllBtn.onclick = async () => {
            const chapIds = [...new Set(auditIssueData.map(i => i.chapId))];
            if (!confirm(`Fix all issues in ${chapIds.length} chapter(s)?`)) return;
            fixAllBtn.disabled = true;
            fixAllBtn.innerText = '⏳ Fixing...';

            let fixed = 0;
            for (const chapId of chapIds) {
                const chapSnap = await getDoc(doc(db, "books", activeBookId, "chapters", chapId));
                if (!chapSnap.exists()) continue;
                const data = chapSnap.data();
                const segments = data.segments || [];
                let changed = false;
                segments.forEach(seg => {
                    const orig = seg.text;
                    seg.text = sanitizeText(seg.text);
                    if (seg.text !== orig) changed = true;
                });
                if (changed) {
                    await setDoc(doc(db, "books", activeBookId, "chapters", chapId), { segments }, { merge: true });
                    fixed++;
                }
            }
            statusEl.innerText = `Audit fix complete: ${fixed} chapter(s) updated.`;
            statusEl.style.borderColor = '#00ff41';
            runAudit(); // re-scan
        };
    }

    // Per-issue Edit buttons
    document.querySelectorAll('.audit-edit-btn').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            const iss = auditIssueData[idx];
            const seg = iss.segments[iss.segIdx];
            const text = seg.text || '';
            // Get sentence context
            let ctxStart = iss.charIdx;
            for (let j = ctxStart - 1; j >= 0 && j > ctxStart - 80; j--) {
                if (['.', '!', '?'].includes(text[j]) && j < ctxStart - 5) { ctxStart = j + 1; break; }
                ctxStart = j;
            }
            let ctxEnd = iss.charIdx;
            for (let j = ctxEnd + 1; j < text.length && j < iss.charIdx + 80; j++) {
                ctxEnd = j + 1;
                if (['.', '!', '?'].includes(text[j])) break;
            }
            const context = text.substring(ctxStart, ctxEnd).trim();
            const editor = document.getElementById(`audit-editor-${idx}`);
            const textarea = document.getElementById(`audit-textarea-${idx}`);
            textarea.value = context;
            textarea._ctxStart = ctxStart;
            textarea._ctxEnd = ctxEnd;
            editor.classList.remove('hidden');
            textarea.focus();
        };
    });

    // Per-issue Cancel buttons
    document.querySelectorAll('.audit-cancel-btn').forEach(btn => {
        btn.onclick = () => {
            document.getElementById(`audit-editor-${btn.dataset.idx}`).classList.add('hidden');
        };
    });

    // Per-issue Save buttons
    document.querySelectorAll('.audit-save-btn').forEach(btn => {
        btn.onclick = async () => {
            const idx = parseInt(btn.dataset.idx);
            const iss = auditIssueData[idx];
            const textarea = document.getElementById(`audit-textarea-${idx}`);
            const newSnippet = textarea.value;

            // Check for remaining bad chars
            const remaining = newSnippet.match(/[^ -~\t\n]/g);
            if (remaining) {
                const chars = [...new Set(remaining)].map(c => `"${c}" (U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')})`).join(', ');
                if (!confirm(`Still contains untypeable characters: ${chars}\n\nSave anyway?`)) return;
            }

            // Splice edited text back into segment
            const seg = iss.segments[iss.segIdx];
            const before = seg.text.substring(0, textarea._ctxStart);
            const after = seg.text.substring(textarea._ctxEnd);
            seg.text = before + newSnippet + after;

            // Save to Firestore
            try {
                await setDoc(doc(db, "books", activeBookId, "chapters", iss.chapId), { segments: iss.segments }, { merge: true });
                statusEl.innerText = `Saved edit to ${iss.chapTitle}.`;
                statusEl.style.borderColor = '#00ff41';
                runAudit(); // re-scan
            } catch (e) {
                alert('Save failed: ' + e.message);
            }
        };
    });

    // Per-issue Auto-Fix buttons
    document.querySelectorAll('.audit-autofix-btn').forEach(btn => {
        btn.onclick = async () => {
            const idx = parseInt(btn.dataset.idx);
            const iss = auditIssueData[idx];
            const seg = iss.segments[iss.segIdx];
            seg.text = sanitizeText(seg.text);

            try {
                await setDoc(doc(db, "books", activeBookId, "chapters", iss.chapId), { segments: iss.segments }, { merge: true });
                // Mark this issue as fixed visually
                const issueEl = document.getElementById(`audit-issue-${idx}`);
                if (issueEl) {
                    issueEl.style.borderColor = '#336633';
                    issueEl.style.background = '#0a220a';
                    issueEl.innerHTML = '<div style="color:#00ff41; font-size:0.8em;">✅ Fixed</div>';
                }
                statusEl.innerText = `Fixed issue in ${iss.chapTitle}.`;
                statusEl.style.borderColor = '#00ff41';
            } catch (e) {
                alert('Fix failed: ' + e.message);
            }
        };
    });
}

if (auditBtn) {
    auditBtn.onclick = () => runAudit();
}
