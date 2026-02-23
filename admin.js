// v1.9.7.10 - Restored Missing Buttons & Wizard Logic
import { db, auth } from "./firebase-config.js";
import { doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const ADMIN_VERSION = "1.9.8";

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

if (auditBtn) {
    auditBtn.onclick = async () => {
        if (!activeBookId) return alert("No active book. Open a book first.");

        auditBtn.disabled = true;
        auditBtn.innerText = '🔍 Auditing...';
        auditResults.classList.remove('hidden');
        auditResults.innerHTML = '<div style="color:#888;">Scanning chapters...</div>';

        try {
            const metaSnap = await getDoc(doc(db, "books", activeBookId));
            if (!metaSnap.exists()) { auditResults.innerHTML = '<div style="color:red;">Book metadata not found.</div>'; return; }
            const meta = metaSnap.data();
            const chapters = meta.chapters || [];

            let totalIssues = 0;
            let chaptersWithIssues = 0;
            let issueDetails = [];

            for (const chap of chapters) {
                const chapId = chap.id;
                const chapSnap = await getDoc(doc(db, "books", activeBookId, "chapters", chapId));
                if (!chapSnap.exists()) continue;
                const data = chapSnap.data();
                const segments = data.segments || [];
                let chapIssues = [];

                segments.forEach((seg, segIdx) => {
                    const text = seg.text || '';
                    for (let i = 0; i < text.length; i++) {
                        const ch = text[i];
                        const code = ch.charCodeAt(0);
                        // Typeable: space (32) through tilde (126), tab (9), newline (10)
                        if (code === 9 || code === 10 || (code >= 32 && code <= 126)) continue;

                        // Found a bad char
                        const hex = code.toString(16).toUpperCase().padStart(4, '0');
                        const replacement = CHAR_REPLACEMENTS[ch] !== undefined ? CHAR_REPLACEMENTS[ch] : '';
                        const ctx = text.substring(Math.max(0, i - 20), Math.min(text.length, i + 20));
                        chapIssues.push({
                            segIdx, charIdx: i, char: ch, hex,
                            replacement: replacement || '(delete)',
                            context: ctx
                        });
                        totalIssues++;
                    }
                });

                if (chapIssues.length > 0) {
                    chaptersWithIssues++;
                    const chapTitle = chap.title || chapId;
                    issueDetails.push({ chapId, chapTitle, issues: chapIssues });
                }
            }

            // Render results
            if (totalIssues === 0) {
                auditResults.innerHTML = `
                    <div style="color:#00ff41; font-weight:bold; font-size:1.1em;">✅ Clean! No untypeable characters found.</div>
                    <div style="color:#888; margin-top:5px;">Scanned ${chapters.length} chapters.</div>
                `;
            } else {
                let html = `
                    <div style="color:#ffaa00; font-weight:bold; font-size:1.1em; margin-bottom:10px;">
                        ⚠️ Found ${totalIssues} untypeable character${totalIssues !== 1 ? 's' : ''} in ${chaptersWithIssues} chapter${chaptersWithIssues !== 1 ? 's' : ''}
                    </div>
                    <button id="audit-fix-all-btn" style="background:#664400; border:1px solid #996600; color:#ffcc66; padding:8px 16px; cursor:pointer; margin-bottom:15px; width:auto;">
                        ⚡ Auto-Fix All ${totalIssues} Issues in Database
                    </button>
                `;

                issueDetails.forEach(({ chapId, chapTitle, issues }) => {
                    html += `<div style="border-bottom:1px solid #333; padding:8px 0;">`;
                    html += `<div style="font-weight:bold; color:#4B9CD3;">${chapTitle} (${chapId}) — ${issues.length} issue${issues.length !== 1 ? 's' : ''}</div>`;
                    issues.forEach(iss => {
                        const safeCtx = iss.context.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        const safeCh = iss.char.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        html += `<div style="font-size:0.8em; color:#aaa; margin:3px 0 3px 15px;">
                            Seg ${iss.segIdx}, pos ${iss.charIdx}: 
                            <span style="color:#ff3333; font-weight:bold;">"${safeCh}"</span> 
                            (U+${iss.hex}) → <span style="color:#00ff41;">${iss.replacement}</span>
                            <div style="color:#666; font-family:monospace; font-size:0.9em; margin-top:2px;">...${safeCtx}...</div>
                        </div>`;
                    });
                    html += `</div>`;
                });

                auditResults.innerHTML = html;

                // Wire fix button
                document.getElementById('audit-fix-all-btn').onclick = async () => {
                    if (!confirm(`This will modify ${chaptersWithIssues} chapter(s) in the database, replacing ${totalIssues} untypeable character(s). Continue?`)) return;

                    const fixBtn = document.getElementById('audit-fix-all-btn');
                    fixBtn.disabled = true;
                    fixBtn.innerText = '⏳ Fixing...';
                    let fixed = 0;

                    for (const { chapId } of issueDetails) {
                        const chapSnap = await getDoc(doc(db, "books", activeBookId, "chapters", chapId));
                        if (!chapSnap.exists()) continue;
                        const data = chapSnap.data();
                        const segments = data.segments || [];
                        let changed = false;

                        segments.forEach(seg => {
                            const original = seg.text;
                            seg.text = sanitizeText(seg.text);
                            if (seg.text !== original) changed = true;
                        });

                        if (changed) {
                            await setDoc(doc(db, "books", activeBookId, "chapters", chapId), { segments }, { merge: true });
                            fixed++;
                        }
                    }

                    fixBtn.innerText = `✅ Fixed ${fixed} chapter(s)!`;
                    fixBtn.style.background = '#224422';
                    fixBtn.style.borderColor = '#336633';
                    fixBtn.style.color = '#00ff41';
                    statusEl.innerText = `Audit fix complete: ${fixed} chapter(s) updated.`;
                    statusEl.style.borderColor = '#00ff41';
                };
            }
        } catch (e) {
            auditResults.innerHTML = `<div style="color:red;">Audit error: ${e.message}</div>`;
            console.error('Audit error:', e);
        } finally {
            auditBtn.disabled = false;
            auditBtn.innerText = '🔍 Audit Book for Untypeable Characters';
        }
    };
}
