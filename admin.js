// admin.js v2.7.5
import { db, auth, storage } from "./firebase-config.js";
import { initLessonsPanel, setStaffHooks } from "./lessons-admin.js";
import { initStaffPanel, initStaffPanelContent, syncOwnClaimsAfterClassChange }
    from "./staff-admin.js";
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const ADMIN_VERSION = "3.5.0";

const GENRES = [
    "Adventure", "Classic Literature", "Fantasy", "Historical Fiction",
    "Horror", "Humor", "Mystery", "Mythology", "Non-Fiction",
    "Poetry", "Romance", "Science Fiction", "Short Stories",
    "Thriller", "Western", "Young Adult"
];

// Only these emails can access the admin panel
const ADMIN_EMAILS = [
    "jacob.wilson@sumnerk12.net",
    "jacob.v.wilson@gmail.com",
];

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
const replaceAllSection = document.getElementById('replace-all-section');
const replaceAllCount = document.getElementById('replace-all-count');
const replaceAllChar = document.getElementById('replace-all-char');
const replaceAllInput = document.getElementById('replace-all-input');
const replaceAllBtn = document.getElementById('replace-all-btn');
const replaceWordRow = document.getElementById('replace-word-row');
const replaceWordOriginal = document.getElementById('replace-word-original');
const replaceWordCount = document.getElementById('replace-word-count');
const replaceWordInput = document.getElementById('replace-word-input');
const replaceWordBtn = document.getElementById('replace-word-btn');

// Suggested replacements for common characters (shown in Replace All)
const CHAR_SUGGESTIONS = {
    '\u00E6': 'ae', '\u00C6': 'Ae',   // æ Æ
    '\u0153': 'oe', '\u0152': 'Oe',   // œ Œ
    '\u00DF': 'ss',                     // ß
    '\u00A0': ' ',                      // NBSP
    '\u200A': ' ',                      // hair space
    '\u2002': ' ', '\u2003': ' ', '\u2009': ' ', // en/em/thin space
    '\u00AD': '',                       // soft hyphen
    '\u2011': '-',                      // non-breaking hyphen
    '\u2013': '-', '\u2014': '--',     // en/em dash
    '\u2018': "'", '\u2019': "'",      // smart quotes
    '\u201C': '"', '\u201D': '"',
    '\u2026': '...',                    // ellipsis
    '\u00D7': 'x',                     // ×
    '\u00B7': '-',                     // middle dot
    '\u2022': '-',                     // bullet
};

// === COMPREHENSIVE CHARACTER REPLACEMENT MAP ===
// Shared logic with game.js runtime sanitizer
const CHAR_REPLACEMENTS = {
    '\u2018': "'", '\u2019': "'", '\u201A': "'",
    '\u201C': '"', '\u201D': '"', '\u201E': '"',
    '\u2039': "'", '\u203A': "'",
    '\u00AB': '"', '\u00BB': '"',
    '\u02BC': "'", '\u2032': "'", '\u2033': '"',
    '\u2013': '-', '\u2014': '--', '\u2015': '--',
    '\u2012': '-', '\u2010': '-', '\u2011': '-',
    '\u2026': '...', '\u2022': '-', '\u2023': '-', '\u2027': '-', '\u00B7': '.',
    '\u00A0': ' ', '\u2002': ' ', '\u2003': ' ', '\u2004': ' ', '\u2005': ' ',
    '\u2006': ' ', '\u2007': ' ', '\u2008': ' ', '\u2009': ' ', '\u200A': ' ',
    '\u202F': ' ', '\u205F': ' ',
    '\u200B': '', '\u200C': '', '\u200D': '', '\u200E': '', '\u200F': '',
    '\uFEFF': '', '\u2060': '', '\u00AD': '',
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

function getSanitizedReplacement(ch) {
    if (ch in CHAR_REPLACEMENTS) return CHAR_REPLACEMENTS[ch] || '(remove)';
    const nfd = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (nfd !== ch && /^[ -~]+$/.test(nfd)) return nfd;
    return '(remove)';
}

// === LANGUAGE CONTENT WARNINGS ===
const FLAGGED_WORDS = [
    'nigger', 'niggers', 'nigga', 'niggas',
    'chink', 'chinks', 'spic', 'spics', 'spick', 'spicks',
    'wetback', 'wetbacks', 'kike', 'kikes',
    'gook', 'gooks', 'beaner', 'beaners',
    'coon', 'coons', 'darkie', 'darkies', 'darky',
    'redskin', 'redskins', 'injun', 'injuns',
    'halfbreed', 'half-breed', 'pickaninny', 'pickaninnies',
    'sambo', 'jap', 'japs',
    'fuck', 'fucking', 'fucked', 'fucker', 'fucks',
    'shit', 'shits', 'shitting', 'shitty',
    'bitch', 'bitches', 'asshole', 'assholes',
    'damn', 'damned', 'goddamn', 'goddamned',
    'bastard', 'bastards', 'cunt', 'cunts',
    'piss', 'pissed', 'pissing', 'whore', 'whores',
];
const FLAGGED_REGEX = new RegExp('\\b(' + FLAGGED_WORDS.join('|') + ')\\b', 'gi');

function getApprovedWords(bookId) {
    try {
        const saved = localStorage.getItem(`ttb_approved_lang_${bookId}`);
        return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
}
function saveApprovedWords(bookId, words) {
    localStorage.setItem(`ttb_approved_lang_${bookId}`, JSON.stringify(words));
}

function scanForLanguageIssues(chapters, approvedWords = []) {
    const approvedSet = new Set(approvedWords.map(w => w.toLowerCase()));
    const issues = [];
    chapters.forEach((chap, chapIdx) => {
        chap.segments.forEach((seg, segIdx) => {
            const text = seg.text || '';
            let match;
            FLAGGED_REGEX.lastIndex = 0;
            while ((match = FLAGGED_REGEX.exec(text)) !== null) {
                if (approvedSet.has(match[0].toLowerCase())) continue;
                // Sentence-bounded context (~80 chars each direction)
                let ctxStart = match.index;
                for (let j = ctxStart - 1; j >= 0 && j > ctxStart - 80; j--) {
                    if (['.', '!', '?'].includes(text[j]) && j < ctxStart - 5) { ctxStart = j + 1; break; }
                    ctxStart = j;
                }
                let ctxEnd = match.index + match[0].length;
                for (let j = ctxEnd; j < text.length && j < match.index + match[0].length + 80; j++) {
                    ctxEnd = j + 1;
                    if (['.', '!', '?'].includes(text[j])) break;
                }
                issues.push({
                    chapIdx, chapTitle: chap.title, segIdx,
                    word: match[0], position: match.index,
                    context: text.substring(ctxStart, ctxEnd).trim(),
                    ctxStart, ctxEnd,
                    segRef: seg  // live reference for editing
                });
            }
        });
    });
    return issues;
}

// State
let stagedChapters = [];
// Where stagedChapters came from. openBookBtn loads them FROM Firestore; parseEpubFile
// creates them from a local file that Firestore has never seen. Fixes must write to
// the database in the first case and stay in memory in the second, and
// stagedChapters.length alone cannot tell them apart.
let stagedFromDB = false;
let editingIndex = -1;
let bookTitlesMap = {};
let activeBookId = ""; 
let importErrors = [];
let currentErrorIdx = 0;
let stagedCoverBlob = null;   // extracted or uploaded cover image
let stagedCoverUrl = null;    // preview data URL

if(footerEl) footerEl.innerText = `Admin JS: v${ADMIN_VERSION} | Lessons Admin: v${window.LESSONS_ADMIN_VERSION || '?'} | Staff Admin: v${window.STAFF_ADMIN_VERSION || '?'}`;

// Populate genre dropdown
const genreSelect = document.getElementById('active-book-genre');
const customGenreInput = document.getElementById('custom-genre-input');
if (genreSelect) {
    GENRES.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g; opt.text = g;
        genreSelect.appendChild(opt);
    });
    genreSelect.onchange = () => {
        if (genreSelect.value === '__custom__') {
            customGenreInput.classList.remove('hidden');
            customGenreInput.focus();
        } else {
            customGenreInput.classList.add('hidden');
        }
    };
    customGenreInput.onblur = () => {
        const custom = customGenreInput.value.trim();
        if (custom && genreSelect.value === '__custom__') {
            // Add as option and select it
            const opt = document.createElement('option');
            opt.value = custom; opt.text = custom;
            genreSelect.insertBefore(opt, genreSelect.querySelector('option[value="__custom__"]'));
            genreSelect.value = custom;
            customGenreInput.classList.add('hidden');
        }
    };
}

// --- AUTH ---
// Staff identity from Auth custom claims (see firestore.rules). ADMIN_EMAILS is
// retained ONLY as a bootstrap fallback so the first staff document can be
// created. Delete it once staff records exist.
let _staffScope = { uid: null, role: null, schoolIds: [], readScope: 'own_classes' };

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // v3.0.0: the role comes from staff/{uid}, NOT from Auth custom claims.
        // Claims need the Admin SDK, which needs a Cloud Functions deploy, which
        // needs a command line. A document read needs none of that — and a role
        // change takes effect immediately instead of on the user's next sign-in.
        _staffScope.uid = user.uid;

        // Claim a role that was pre-authorised by email before this person had an
        // account. pendingStaffRoles/{email} is written by an admin; rules let the
        // owner copy it onto their own UID unchanged, and nothing else.
        try {
            const email = (user.email || '').toLowerCase();
            if (email) {
                const pendSnap = await getDoc(doc(db, 'pendingStaffRoles', email));
                if (pendSnap.exists()) {
                    const p = pendSnap.data();
                    await setDoc(doc(db, 'staff', user.uid), {
                        email,
                        displayName: user.displayName || '',
                        role: p.role,
                        schoolIds: p.schoolIds,
                        readScope: p.readScope,
                        active: true,
                    }, { merge: true });
                    await deleteDoc(doc(db, 'pendingStaffRoles', email));
                    console.log('Claimed pre-authorised role:', p.role);
                }
            }
        } catch (e) {
            // Not fatal — they just stay a student and can request access.
            console.warn('Could not claim a pre-authorised role:', e);
        }

        try {
            const staffSnap = await getDoc(doc(db, 'staff', user.uid));
            if (staffSnap.exists() && staffSnap.data().active !== false) {
                const sd = staffSnap.data();
                _staffScope.role = sd.role || null;
                _staffScope.schoolIds = Array.isArray(sd.schoolIds) ? sd.schoolIds : [];
                _staffScope.readScope = sd.readScope || 'own_classes';
            }
        } catch (e) { console.warn('Could not read staff record:', e); }

        // Bootstrap: before any staff document exists, these two addresses get in
        // so the first super_admin record can be created. Remove once set up.
        // BOOTSTRAP. Grants access in JavaScript ONLY — firestore.rules knows
        // nothing about ADMIN_EMAILS, so every WRITE is still rejected until a real
        // staff document exists. That mismatch surfaced as a cryptic "Permission
        // denied" from a panel that looked like it should work; it now announces
        // itself with the exact fix and the UID already filled in.
        if (!_staffScope.role && ADMIN_EMAILS.includes(user.email)) {
            _staffScope.role = 'super_admin';
            _staffScope.readScope = 'building';
            _staffScope.bootstrap = true;
            console.warn('BOOTSTRAP MODE: no staff/' + user.uid + ' document. ' +
                         'Firestore will reject writes until you create one.');
            showBootstrapWarning(user);
        }

        // Not staff? Not an error — they're a student. Offer to ask for access.
        if (!_staffScope.role) {
            statusEl.innerText = "Signed in as a student account.";
            statusEl.style.borderColor = "#666";
            editorSec.classList.add('hidden');
            showRequestAccessPanel(user);
            return;
        }
        statusEl.innerText = "Logged in as: " + user.email;
        statusEl.style.borderColor = "#00ff41"; 
        loginSec.classList.add('hidden');
        editorSec.classList.remove('hidden');
            // ── Init lessons panel (only once) ──
            if (!window._lessonsPanelInited) {
                window._lessonsPanelInited = true;
                initLessonsPanel(db, _staffScope);
                initStaffPanel(db, auth, _staffScope);
                setStaffHooks({
                    onStaffTab: initStaffPanelContent,
                    onClassesChanged: syncOwnClaimsAfterClassChange,
                });
            }
            // The Staff tab only exists for people who can act on it.
            const staffTabBtn = document.getElementById('tab-staff');
            if (staffTabBtn) {
                staffTabBtn.style.display =
                    ['super_admin', 'building_admin'].includes(_staffScope.role) ? '' : 'none';
            }
            // Books and Lessons are global content — super_admin only. Rules already
            // block the writes; this is so a colleague doesn't get a full editor that
            // errors on save, which reads as "the app is broken" rather than "you
            // lack permission."
            const contentOnly = _staffScope.role === 'super_admin';
            ['tab-books', 'tab-lessons'].forEach(id => {
                const b = document.getElementById(id);
                if (b) b.style.display = contentOnly ? '' : 'none';
            });
            // Books is the default tab. Send everyone else somewhere usable.
            if (!contentOnly) {
                const first = _staffScope.role === 'teacher' ? 'classes' : 'students';
                ['books', 'lessons'].forEach(t => {
                    const btn = document.getElementById('tab-' + t);
                    const panel = document.getElementById(t + '-panel');
                    if (btn) btn.classList.remove('tab-active');
                    if (panel) panel.classList.add('hidden');
                });
                const target = document.getElementById('tab-' + first);
                if (target) target.click();
            }
        await loadBookList();
    } else {
        statusEl.innerText = "Access Restricted. Admin login required.";
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
    statusEl.innerText = `Loading ${activeBookId}...`;
    chapterListEl.innerHTML = "Loading...";
    stagedChapters = [];
    stagedFromDB = true;   // loaded from Firestore — fixes should write straight back
    stagedCoverBlob = null; stagedCoverUrl = null;
    
    try {
        const metaSnap = await getDoc(doc(db, "books", activeBookId));
        if(metaSnap.exists()) {
            const meta = metaSnap.data();
            activeBookTitle.value = meta.title || activeBookId;
            
            // Load author, genre, cover
            const authorInput = document.getElementById('active-book-author');
            const genreSelect = document.getElementById('active-book-genre');
            if (authorInput) authorInput.value = meta.author || "";
            if (genreSelect) genreSelect.value = meta.genre || "";
            if (meta.coverUrl) {
                stagedCoverUrl = meta.coverUrl;
                updateCoverPreview();
            } else {
                updateCoverPreview();
            }
            
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
        
        // Auto-audit for character and language issues
        runAudit();
    } catch(e) { statusEl.innerText = "Error: " + e.message; }
};

// --- CREATE NEW PARSE ---
createParseBtn.onclick = async () => {
    const id = newBookId.value.trim();
    const title = newBookTitle.value.trim();
    const file = newEpubFile.files[0];
    if(!id || !title || !file) return alert("Fill Book ID, Title, and EPUB file.");
    
    activeBookId = id;
    activeBookTitle.value = title;
    // Pre-fill author if user typed one
    const newAuthor = document.getElementById('new-book-author');
    const stagingAuthor = document.getElementById('active-book-author');
    if (newAuthor && stagingAuthor && newAuthor.value.trim()) {
        stagingAuthor.value = newAuthor.value.trim();
    }
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
    stagedFromDB = false;  // local file; nothing in Firestore to write back to yet
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
        const idToMediaType = {};
        Array.from(manifest.getElementsByTagName("item")).forEach(item => {
            idToHref[item.getAttribute("id")] = item.getAttribute("href");
            idToMediaType[item.getAttribute("id")] = item.getAttribute("media-type") || "";
        });

        // --- EXTRACT AUTHOR FROM OPF ---
        let extractedAuthor = "";
        const creators = opfDoc.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", "creator");
        if (creators.length > 0) extractedAuthor = creators[0].textContent.trim();
        const authorInput = document.getElementById('active-book-author');
        if (authorInput && !authorInput.value.trim()) authorInput.value = extractedAuthor;

        // --- EXTRACT COVER IMAGE FROM EPUB ---
        stagedCoverBlob = null; stagedCoverUrl = null;
        let coverHref = null;
        
        // Method 1: <meta name="cover" content="imageId"> in metadata
        const metas = opfDoc.querySelectorAll('meta[name="cover"]');
        if (metas.length > 0) {
            const coverId = metas[0].getAttribute("content");
            if (coverId && idToHref[coverId]) coverHref = idToHref[coverId];
        }
        // Method 2: <item properties="cover-image"> in manifest
        if (!coverHref) {
            const items = Array.from(manifest.getElementsByTagName("item"));
            const coverItem = items.find(i => (i.getAttribute("properties") || "").includes("cover-image"));
            if (coverItem) coverHref = coverItem.getAttribute("href");
        }
        // Method 3: manifest item with id containing "cover" and image media type
        if (!coverHref) {
            const items = Array.from(manifest.getElementsByTagName("item"));
            const coverItem = items.find(i => {
                const id = (i.getAttribute("id") || "").toLowerCase();
                const mt = (i.getAttribute("media-type") || "");
                return id.includes("cover") && mt.startsWith("image/");
            });
            if (coverItem) coverHref = coverItem.getAttribute("href");
        }
        
        if (coverHref) {
            try {
                const coverPath = (basePath === "") ? coverHref : resolvePath(basePath + "dummy", coverHref);
                const coverFile = zip.file(coverPath);
                if (coverFile) {
                    const blob = await coverFile.async("blob");
                    stagedCoverBlob = blob;
                    stagedCoverUrl = URL.createObjectURL(blob);
                    updateCoverPreview();
                    statusEl.innerText = "Cover image extracted from EPUB.";
                }
            } catch(e) { console.warn("Cover extraction failed:", e); }
        }

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
                
                // Comprehensive sanitization
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
            // Scan for language issues
            const approved = activeBookId ? getApprovedWords(activeBookId) : [];
            const langIssues = scanForLanguageIssues(stagedChapters, approved);
            if (langIssues.length > 0) {
                showLanguageWarnings(langIssues, false);
                statusEl.innerText = `Parsed ${stagedChapters.length} chapters. ⚠️ ${langIssues.length} language warning(s).`;
                statusEl.style.borderColor = "#ffaa00";
            } else {
                statusEl.innerText = `✅ Parsed ${stagedChapters.length} chapters. No character issues or language warnings found.`;
                statusEl.style.borderColor = "#00ff41";
            }
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
        // Scan for language issues after all character errors are resolved
        const wizApproved = activeBookId ? getApprovedWords(activeBookId) : [];
        const langIssues = scanForLanguageIssues(stagedChapters, wizApproved);
        if (langIssues.length > 0) {
            showLanguageWarnings(langIssues, false);
            statusEl.innerText = `Character errors resolved. ⚠️ ${langIssues.length} language warning(s) found. Ready to upload.`;
            statusEl.style.borderColor = "#ffaa00";
        } else {
            statusEl.innerText = "✅ All errors resolved. No language warnings. Ready to upload.";
            statusEl.style.borderColor = "#00ff41";
        }
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
    
    // Populate Replace All section
    const sameCharErrors = importErrors.filter(e => e.badChar === err.badChar);
    // Count total occurrences across all segments
    let totalOccurrences = 0;
    const seenSegments = new Set();
    stagedChapters.forEach(ch => {
        ch.segments.forEach(seg => {
            if (!seenSegments.has(seg)) {
                seenSegments.add(seg);
                const matches = seg.text.match(new RegExp(escapeRegex(err.badChar), 'g'));
                if (matches) totalOccurrences += matches.length;
            }
        });
    });
    
    const badCode = err.badChar.charCodeAt(0).toString(16).toUpperCase();
    replaceAllCount.textContent = totalOccurrences;
    replaceAllChar.textContent = `"${err.badChar}" (U+${badCode})`;
    replaceAllInput.value = CHAR_SUGGESTIONS[err.badChar] || '';
    replaceAllInput.placeholder = CHAR_SUGGESTIONS[err.badChar] !== undefined 
        ? `Suggested: "${CHAR_SUGGESTIONS[err.badChar] || '(remove)'}"`
        : 'Replacement text';
    
    // Extract the word containing the bad character
    const charIdx = err.segmentRef.text.indexOf(err.badChar);
    if (charIdx >= 0) {
        const txt = err.segmentRef.text;
        let wStart = charIdx, wEnd = charIdx;
        while (wStart > 0 && txt[wStart - 1] !== ' ' && txt[wStart - 1] !== '\t') wStart--;
        while (wEnd < txt.length && txt[wEnd] !== ' ' && txt[wEnd] !== '\t') wEnd++;
        const badWord = txt.substring(wStart, wEnd).replace(/^[.,;:!?"'()\[\]]+|[.,;:!?"'()\[\]]+$/g, '');
        
        if (badWord.length > 1 && badWord !== err.badChar) {
            // Count word occurrences across all segments
            let wordCount = 0;
            const wordRegex = new RegExp(escapeRegex(badWord), 'g');
            stagedChapters.forEach(ch => {
                ch.segments.forEach(seg => {
                    const m = seg.text.match(wordRegex);
                    if (m) wordCount += m.length;
                });
            });
            
            replaceWordOriginal.textContent = badWord;
            replaceWordCount.textContent = wordCount;
            // Pre-fill suggestion: swap the bad char for its suggested replacement within the word
            const charSuggestion = CHAR_SUGGESTIONS[err.badChar];
            replaceWordInput.value = charSuggestion !== undefined 
                ? badWord.replace(new RegExp(escapeRegex(err.badChar), 'g'), charSuggestion) 
                : '';
            replaceWordInput.placeholder = `Replacement for "${badWord}"`;
            replaceWordRow.classList.remove('hidden');
        } else {
            replaceWordRow.classList.add('hidden');
        }
    } else {
        replaceWordRow.classList.add('hidden');
    }
    
    wizardModal.classList.remove('hidden');
}

wizardIgnoreBtn.onclick = () => {
    currentErrorIdx++;
    showErrorWizard();
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
        stagedFromDB = false;
        wizardModal.classList.add('hidden');
        statusEl.innerText = "Cancelled.";
        statusEl.style.borderColor = "#ff3333";
        chapterListEl.innerHTML = "";
    }
};

replaceAllBtn.onclick = () => {
    const err = importErrors[currentErrorIdx];
    const badChar = err.badChar;
    const replacement = replaceAllInput.value;
    const badCode = badChar.charCodeAt(0).toString(16).toUpperCase();
    
    const displayReplacement = replacement === '' ? '(remove)' : `"${replacement}"`;
    if (!confirm(`Replace ALL "${badChar}" (U+${badCode}) with ${displayReplacement} across all chapters?`)) return;
    
    // Global replace across all staged chapter segments
    const regex = new RegExp(escapeRegex(badChar), 'g');
    let replaceCount = 0;
    stagedChapters.forEach(ch => {
        ch.segments.forEach(seg => {
            const matches = seg.text.match(regex);
            if (matches) {
                replaceCount += matches.length;
                seg.text = seg.text.replace(regex, replacement);
            }
        });
    });
    
    // Remove errors where the bad char is gone, but re-check for other bad chars
    importErrors = importErrors.filter(e => {
        if (e.badChar === badChar) {
            // This error's char was just replaced — but does the segment still have issues?
            const remaining = e.segmentRef.text.match(/[^ -~\t\n]/g);
            if (remaining && remaining.length > 0) {
                e.badChar = remaining[0]; // update to next bad char
                e.fullText = e.segmentRef.text;
                return true;
            }
            return false;
        }
        return true;
    });
    
    // Reset index (may have shifted)
    if (currentErrorIdx >= importErrors.length) currentErrorIdx = importErrors.length - 1;
    if (currentErrorIdx < 0) currentErrorIdx = 0;
    
    // Re-scan all segments for any remaining bad chars that weren't in importErrors
    // (a segment could have had multiple different bad chars)
    statusEl.innerText = `Replaced ${replaceCount} instances of "${badChar}" (U+${badCode}).`;
    statusEl.style.borderColor = "#00ff41";
    
    showErrorWizard();
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

replaceWordBtn.onclick = () => {
    const err = importErrors[currentErrorIdx];
    const badWord = replaceWordOriginal.textContent;
    const replacement = replaceWordInput.value;
    
    if (!replacement && !confirm(`Replace "${badWord}" with nothing (delete the word)?`)) return;
    if (replacement && !confirm(`Replace all "${badWord}" with "${replacement}" across all chapters?`)) return;
    
    const regex = new RegExp(escapeRegex(badWord), 'g');
    let replaceCount = 0;
    stagedChapters.forEach(ch => {
        ch.segments.forEach(seg => {
            const matches = seg.text.match(regex);
            if (matches) {
                replaceCount += matches.length;
                seg.text = seg.text.replace(regex, replacement);
            }
        });
    });
    
    // Re-check: remove errors whose segment no longer contains ANY bad chars
    importErrors = importErrors.filter(e => {
        const remaining = e.segmentRef.text.match(/[^ -~\t\n]/g);
        if (remaining && remaining.length > 0) {
            e.badChar = remaining[0];
            e.fullText = e.segmentRef.text;
            return true;
        }
        return false;
    });
    
    if (currentErrorIdx >= importErrors.length) currentErrorIdx = importErrors.length - 1;
    if (currentErrorIdx < 0) currentErrorIdx = 0;
    
    statusEl.innerText = `Replaced ${replaceCount} instances of "${badWord}" → "${replacement}".`;
    statusEl.style.borderColor = "#00ff41";
    
    showErrorWizard();
};

// Security: escape HTML to prevent XSS from Firestore data
function escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
}

// --- RENDER LIST ---
function renderChapterList() {
    chapterListEl.innerHTML = "";
    stagedChapters.forEach((chap, index) => {
        const div = document.createElement('div');
        div.className = 'chapter-item';
        div.id = `ui-chap-${index}`;
        const canMerge = index < stagedChapters.length - 1;
        div.innerHTML = `
            <div class="chap-info">
                <div class="chap-title">ID: ${escapeHtml(chap.id)} | ${escapeHtml(chap.title)}</div>
                <div class="chap-meta">${chap.segments.length} segments <span class="chap-status"></span></div>
            </div>
            <div class="chap-actions">
                ${canMerge ? `<button class="merge-btn" data-index="${index}" title="Merge with next chapter">Merge ↓</button>` : ''}
                <button class="split-btn" data-index="${index}" title="Split into multiple chapters">Split</button>
                <button class="edit-btn" data-index="${index}">Edit</button>
                <button class="danger-btn delete-btn" data-index="${index}">Del</button>
            </div>
        `;
        chapterListEl.appendChild(div);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => {
            stagedChapters.splice(parseInt(e.target.dataset.index), 1);
            stagedChapters.forEach((ch, i) => { ch.id = i + 1; });
            renderChapterList();
        };
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = (e) => editChapter(parseInt(e.target.dataset.index));
    });
    
    document.querySelectorAll('.split-btn').forEach(btn => {
        btn.onclick = (e) => openSplitUI(parseInt(e.target.dataset.index));
    });
    
    document.querySelectorAll('.merge-btn').forEach(btn => {
        btn.onclick = (e) => mergeWithNext(parseInt(e.target.dataset.index));
    });
}

// --- MERGE CHAPTERS ---
function mergeWithNext(index) {
    if (index >= stagedChapters.length - 1) return;
    const current = stagedChapters[index];
    const next = stagedChapters[index + 1];
    
    if (!confirm(`Merge "${current.title}" (${current.segments.length} segs) with "${next.title}" (${next.segments.length} segs)?`)) return;
    
    current.segments = current.segments.concat(next.segments);
    stagedChapters.splice(index + 1, 1);
    stagedChapters.forEach((ch, i) => { ch.id = i + 1; });
    renderChapterList();
    statusEl.innerText = `Merged → "${current.title}" now has ${current.segments.length} segments. ${stagedChapters.length} chapters total.`;
    statusEl.style.borderColor = "#00ff41";
}

// --- SPLIT CHAPTER ---
function detectHeadings(segments) {
    const headingPattern = /^[\t ]*(chapter|part|book|section|prologue|epilogue|preface|introduction|conclusion|appendix)\b/i;
    const romanPattern = /^[\t ]*(I{1,3}|IV|V|VI{0,3}|IX|X{1,3}|XI{0,3}|XIV|XV|XVI{0,3}|XIX|XX)[\.\s:—\-]/;
    const numberPattern = /^[\t ]*\d{1,3}[\.\s:—\-]/;
    
    const found = [];
    segments.forEach((seg, idx) => {
        if (idx === 0) return; // can't split before first segment
        const text = seg.text.replace(/^\t/, '').trim();
        if (text.length === 0) return;
        if (text.length > 80) return; // headings are short
        
        if (headingPattern.test(text) || romanPattern.test(text) || numberPattern.test(text)) {
            found.push({ index: idx, text: text });
        }
    });
    return found;
}

function openSplitUI(chapIndex) {
    const chap = stagedChapters[chapIndex];
    const headings = detectHeadings(chap.segments);
    
    // Build the split modal
    const modal = document.getElementById('error-wizard-modal');
    const content = modal.querySelector('.error-wizard-content');
    
    let headingsList = '';
    if (headings.length > 0) {
        headingsList = `
            <div style="margin-bottom:15px;">
                <div style="color:#00ff41; margin-bottom:8px;">Detected ${headings.length} heading(s) — click to toggle:</div>
                ${headings.map(h => `
                    <label style="display:block; padding:6px 8px; margin:2px 0; background:#1a1a1a; border:1px solid #333; border-radius:3px; cursor:pointer;">
                        <input type="checkbox" class="split-point-cb" data-seg-index="${h.index}" checked style="margin-right:8px;">
                        <span style="color:#ffaa00;">Seg ${h.index}:</span> <span style="color:#ccc;">${escapeHtml(h.text.substring(0, 60))}</span>
                    </label>
                `).join('')}
            </div>
        `;
    } else {
        headingsList = `<div style="color:#888; margin-bottom:15px;">No headings auto-detected.</div>`;
    }
    
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #444; padding-bottom:10px;">
            <h3 style="margin:0; color:#4B9CD3;">Split Chapter: ${escapeHtml(chap.title)}</h3>
            <span style="color:#888;">${chap.segments.length} segments</span>
        </div>
        
        ${headingsList}
        
        <div style="margin-bottom:10px;">
            <label style="color:#ccc; display:block; margin-bottom:5px;">Split points (segment numbers, comma-separated):</label>
            <input id="manual-split-input" type="text" style="width:100%; background:#111; color:white; border:1px solid #555; padding:10px; font-family:'Courier New', monospace;" 
                   placeholder="e.g. 15, 30, 45" value="${headings.map(h => h.index).join(', ')}">
        </div>
        
        <div style="margin-bottom:6px; display:flex; gap:6px; align-items:center;">
            <input id="seg-search-input" type="text" placeholder="Search segments..." 
                   style="flex:3; background:#111; color:white; border:1px solid #555; padding:8px 10px; font-family:'Courier New', monospace; font-size:0.85em;">
            <span id="seg-search-count" style="flex:1; color:#888; font-size:0.75em; white-space:nowrap; text-align:center;"></span>
            <button id="seg-search-prev" style="flex:1; background:#333; border:1px solid #555; color:#ccc; padding:8px 0; cursor:pointer; font-size:0.75em;">▲ Prev</button>
            <button id="seg-search-next" style="flex:1; background:#333; border:1px solid #555; color:#ccc; padding:8px 0; cursor:pointer; font-size:0.75em;">▼ Next</button>
        </div>
        
        <div id="seg-browser" style="margin-bottom:15px; max-height:200px; overflow-y:auto; background:#0a0a0a; border:1px solid #333; padding:8px; font-size:0.8em; font-family:'Courier New', monospace;">
            ${chap.segments.map((seg, i) => {
                const preview = seg.text.replace(/^\t/, '').trim().substring(0, 90);
                const isHeading = headings.some(h => h.index === i);
                return `<div class="seg-row" data-index="${i}" style="padding:2px 4px; ${isHeading ? 'color:#ffaa00; font-weight:bold; background:#1a1500;' : 'color:#666;'} cursor:pointer;" 
                         title="Click to add as split point">
                    <span style="color:#555; min-width:36px; display:inline-block;">${i}</span> <span class="seg-text">${escapeHtml(preview)}${seg.text.length > 90 ? '...' : ''}</span>
                </div>`;
            }).join('')}
        </div>
        
        <div class="row">
            <div class="col"><button id="split-execute-btn" style="background:#0047AB; width:100%; padding:12px;">Split Chapter</button></div>
            <div class="col"><button id="split-cancel-btn" class="secondary-btn" style="width:100%; padding:12px;">Cancel</button></div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    
    // Click segment row to add as split point
    content.querySelectorAll('.seg-row').forEach(row => {
        row.onclick = () => {
            const idx = row.dataset.index;
            const input = document.getElementById('manual-split-input');
            const existing = input.value.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
            if (!existing.includes(idx)) {
                input.value = existing.length ? existing.join(', ') + ', ' + idx : idx;
            }
            row.style.borderLeft = '3px solid #4B9CD3';
        };
    });
    
    // Search within segments
    const searchInput = document.getElementById('seg-search-input');
    const searchCount = document.getElementById('seg-search-count');
    const browser = document.getElementById('seg-browser');
    let searchMatches = [];
    let searchIdx = -1;
    
    function doSearch() {
        const query = searchInput.value.trim().toLowerCase();
        // Clear previous highlights
        content.querySelectorAll('.seg-row').forEach(row => {
            row.style.background = '';
            const textEl = row.querySelector('.seg-text');
            if (textEl) textEl.style.color = '';
        });
        searchMatches = [];
        searchIdx = -1;
        
        if (!query) { searchCount.textContent = ''; return; }
        
        content.querySelectorAll('.seg-row').forEach(row => {
            const text = row.querySelector('.seg-text')?.textContent.toLowerCase() || '';
            if (text.includes(query)) {
                searchMatches.push(row);
                row.style.background = '#1a2a15';
                row.querySelector('.seg-text').style.color = '#7aff7a';
            }
        });
        
        searchCount.textContent = searchMatches.length ? `${searchMatches.length} found` : 'no matches';
        if (searchMatches.length > 0) jumpToMatch(0);
    }
    
    function jumpToMatch(idx) {
        // Remove current highlight
        if (searchIdx >= 0 && searchMatches[searchIdx]) {
            searchMatches[searchIdx].style.background = '#1a2a15';
        }
        searchIdx = idx;
        const row = searchMatches[searchIdx];
        if (!row) return;
        row.style.background = '#2a4a1a';
        row.scrollIntoView({ block: 'center', behavior: 'smooth' });
        searchCount.textContent = `${searchIdx + 1} / ${searchMatches.length}`;
    }
    
    searchInput.oninput = doSearch;
    searchInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchMatches.length > 0) jumpToMatch((searchIdx + 1) % searchMatches.length);
        }
    };
    document.getElementById('seg-search-next').onclick = () => {
        if (searchMatches.length > 0) jumpToMatch((searchIdx + 1) % searchMatches.length);
    };
    document.getElementById('seg-search-prev').onclick = () => {
        if (searchMatches.length > 0) jumpToMatch((searchIdx - 1 + searchMatches.length) % searchMatches.length);
    };
    
    // Update manual input when checkboxes change
    content.querySelectorAll('.split-point-cb').forEach(cb => {
        cb.onchange = () => {
            const checked = Array.from(content.querySelectorAll('.split-point-cb:checked'))
                .map(c => c.dataset.segIndex).join(', ');
            document.getElementById('manual-split-input').value = checked;
        };
    });
    
    document.getElementById('split-cancel-btn').onclick = () => {
        modal.classList.add('hidden');
    };
    
    document.getElementById('split-execute-btn').onclick = () => {
        const input = document.getElementById('manual-split-input').value.trim();
        if (!input) { alert('No split points specified.'); return; }
        
        const splitPoints = [...new Set(
            input.split(/[,\s]+/)
                 .map(s => parseInt(s.trim()))
                 .filter(n => !isNaN(n) && n > 0 && n < chap.segments.length)
        )].sort((a, b) => a - b);
        
        if (splitPoints.length === 0) { alert('No valid split points.'); return; }
        
        // Perform the split
        const newChapters = [];
        let prevIdx = 0;
        
        for (const splitAt of splitPoints) {
            const slice = chap.segments.slice(prevIdx, splitAt);
            if (slice.length > 0) {
                const title = prevIdx === 0 ? chap.title : slice[0].text.replace(/^\t/, '').trim().substring(0, 60);
                newChapters.push({ id: 0, title: title, segments: slice });
            }
            prevIdx = splitAt;
        }
        // Last chunk
        const lastSlice = chap.segments.slice(prevIdx);
        if (lastSlice.length > 0) {
            const title = lastSlice[0].text.replace(/^\t/, '').trim().substring(0, 60);
            newChapters.push({ id: 0, title: title, segments: lastSlice });
        }
        
        // Replace the original chapter with the new ones
        stagedChapters.splice(chapIndex, 1, ...newChapters);
        
        // Re-number all chapters
        stagedChapters.forEach((ch, i) => { ch.id = i + 1; });
        
        modal.classList.add('hidden');
        renderChapterList();
        statusEl.innerText = `Split into ${newChapters.length} chapters. ${stagedChapters.length} total now.`;
        statusEl.style.borderColor = "#00ff41";
    };
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
// Reads the genre control, resolving the "Custom..." option to the text input.
// customGenreInput was declared in v3.x and never used, so picking Custom stored the
// literal string "__custom__" as the genre.
function readGenreField() {
    const sel = document.getElementById('active-book-genre');
    if (!sel) return "";
    if (sel.value === '__custom__') {
        return (customGenreInput && customGenreInput.value.trim()) || "";
    }
    return sel.value;
}

// Show/hide the custom box when the dropdown changes.
if (genreSelect) {
    genreSelect.addEventListener('change', () => {
        if (!customGenreInput) return;
        const custom = genreSelect.value === '__custom__';
        customGenreInput.classList.toggle('hidden', !custom);
        if (custom) customGenreInput.focus();
    });
}

saveTitleBtn.onclick = async () => {
    if (!activeBookId) return alert("No active book.");
    const newTitle = activeBookTitle.value.trim();
    if (!newTitle) return alert("Title required.");

    // Feedback lives next to the button now. The write always worked; the only
    // confirmation was the status bar at the top of the page, ~66 lines of markup
    // above this button and usually scrolled out of view — so a successful save was
    // indistinguishable from a dead button.
    const inline = document.getElementById('save-title-status');
    const setInline = (msg, color) => {
        if (!inline) return;
        inline.textContent = msg;
        inline.style.color = color || '#888';
    };
    const original = saveTitleBtn.textContent;
    saveTitleBtn.disabled = true;
    saveTitleBtn.style.opacity = '0.6';
    saveTitleBtn.textContent = 'Saving\u2026';
    setInline('Saving\u2026', '#888');

    try {
        const author = document.getElementById('active-book-author').value.trim();
        const genre  = readGenreField();

        // Written unconditionally. Previously these were guarded by `if (author)` /
        // `if (genre)`, which meant a field could be changed but never CLEARED —
        // blanking the author and saving silently kept the old one.
        const updates = { title: newTitle, author, genre };

        if (stagedCoverBlob) {
            setInline('Uploading cover\u2026', '#888');
            const coverUrl = await uploadCover(activeBookId, stagedCoverBlob);
            if (coverUrl) updates.coverUrl = coverUrl;
        }

        await setDoc(doc(db, "books", activeBookId), updates, { merge: true });
        bookTitlesMap[activeBookId] = newTitle;

        const stamp = new Date().toLocaleTimeString();
        setInline('\u2713 Saved at ' + stamp + (genre ? ' \u00b7 genre: ' + genre : ' \u00b7 genre cleared'), '#00ff41');
        statusEl.innerText = "Metadata Updated.";
        statusEl.style.borderColor = "#00ff41";
        saveTitleBtn.textContent = '\u2713 Saved';
        // Refresh the list so the change is visible where the book is listed, not
        // just in the form you just typed into.
        await loadBookList();
        setTimeout(() => { saveTitleBtn.textContent = original; }, 2000);
    } catch(e) {
        setInline('Save failed: ' + e.message, '#ff4444');
        saveTitleBtn.textContent = original;
        alert("Metadata Save Failed: " + e.message);
    } finally {
        saveTitleBtn.disabled = false;
        saveTitleBtn.style.opacity = '1';
    }
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
        // Always sort chapter metadata numerically before writing —
        // prevents a corrupt display order from propagating into Firestore
        chapterMeta.sort((a, b) => {
            const na = parseFloat(a.id.replace('chapter_', '')) || 0;
            const nb = parseFloat(b.id.replace('chapter_', '')) || 0;
            return na - nb;
        });

        const bookData = {
            title: activeBookTitle.value.trim() || activeBookId,
            totalChapters: stagedChapters.length,
            chapters: chapterMeta
        };
        
        const author = document.getElementById('active-book-author').value.trim();
        const genre = document.getElementById('active-book-genre').value;
        if (author) bookData.author = author;
        if (genre) bookData.genre = genre;
        
        // Upload cover if staged
        if (stagedCoverBlob) {
            statusEl.innerText = "Uploading cover image...";
            const coverUrl = await uploadCover(activeBookId, stagedCoverBlob);
            if (coverUrl) bookData.coverUrl = coverUrl;
        }
        
        await setDoc(doc(db, "books", activeBookId), bookData, { merge: true });
        
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

// --- COVER IMAGE ---
async function uploadCover(bookId, blob) {
    try {
        const storageRef = ref(storage, `covers/${bookId}`);
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    } catch(e) {
        console.error("Cover upload failed:", e);
        statusEl.innerText = "Cover upload failed: " + e.message;
        return null;
    }
}

function updateCoverPreview() {
    const preview = document.getElementById('cover-preview');
    const removeBtn = document.getElementById('cover-remove-btn');
    if (stagedCoverUrl) {
        preview.src = stagedCoverUrl;
        preview.classList.remove('hidden');
        removeBtn.classList.remove('hidden');
    } else {
        preview.src = "";
        preview.classList.add('hidden');
        removeBtn.classList.add('hidden');
    }
}

// Manual cover upload
document.getElementById('cover-upload')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    stagedCoverBlob = file;
    stagedCoverUrl = URL.createObjectURL(file);
    updateCoverPreview();
    statusEl.innerText = "Cover image loaded from file.";
});

document.getElementById('cover-remove-btn')?.addEventListener('click', () => {
    stagedCoverBlob = null;
    if (stagedCoverUrl) URL.revokeObjectURL(stagedCoverUrl);
    stagedCoverUrl = null;
    updateCoverPreview();
    document.getElementById('cover-upload').value = '';
});

// === LANGUAGE WARNINGS UI ===
let langIssueData = []; // live reference for editing
let langIsFromDB = false; // whether edits should write to Firestore

function showLanguageWarnings(issues, fromDB = false) {
    const container = document.getElementById('language-results');
    if (!container) return;
    container.classList.remove('hidden');
    langIssueData = issues;
    langIsFromDB = fromDB;

    if (issues.length === 0) {
        container.innerHTML = '<div style="color:#00ff41; font-weight:bold;">✅ No flagged language found.</div>';
        return;
    }

    // Group by word
    const grouped = {};
    issues.forEach((iss, idx) => {
        const w = iss.word.toLowerCase();
        if (!grouped[w]) grouped[w] = { word: iss.word, occurrences: [] };
        grouped[w].occurrences.push({ ...iss, globalIdx: idx });
    });

    const approvedWords = activeBookId ? getApprovedWords(activeBookId) : [];

    let html = `
        <div style="color:#ff6666; font-weight:bold; font-size:1.1em; margin-bottom:10px;">
            ⚠️ ${issues.length} language warning${issues.length !== 1 ? 's' : ''} found
        </div>
        <div style="font-size:0.85em; color:#aaa; margin-bottom:12px;">
            Review each flagged word. Edit to replace it, or approve if it's acceptable in context (e.g. "chink in armor").
            ${approvedWords.length > 0 ? `<div style="margin-top:4px; color:#888;">Approved words for this book: ${approvedWords.map(w => `<span style="color:#66cc66;">${escapeHtml(w)}</span>`).join(', ')} <a href="#" id="lang-clear-approvals" style="color:#ff6666; margin-left:8px;">Clear all</a></div>` : ''}
        </div>
    `;

    Object.entries(grouped).forEach(([wordKey, { word, occurrences }]) => {
        html += `<div style="border-bottom:1px solid #333; padding:10px 0;">`;
        html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div style="font-weight:bold; color:#ff6666; font-size:1em;">"${escapeHtml(word)}" — ${occurrences.length} occurrence${occurrences.length !== 1 ? 's' : ''}</div>
            <button class="lang-approve-word-btn" data-word="${escapeHtml(wordKey)}" style="background:#1a3a1a; color:#66cc66; border:1px solid #336633; padding:3px 10px; cursor:pointer; font-size:0.75em; width:auto;">✅ Approve all "${escapeHtml(word)}"</button>
        </div>`;

        occurrences.forEach(occ => {
            const safeCtx = escapeHtml(occ.context);
            const highlighted = safeCtx.replace(
                new RegExp(escapeRegex(escapeHtml(occ.word)), 'gi'),
                m => `<span class="bad-char-highlight" style="background:#660000;">${m}</span>`
            );
            const fullText = occ.segRef.text || '';
            const prefix = occ.ctxStart > 0 ? '...' : '';
            const suffix = occ.ctxEnd < fullText.length ? '...' : '';

            html += `<div id="lang-issue-${occ.globalIdx}" style="margin:6px 0 6px 15px; padding:6px; background:#111; border:1px solid #333; border-radius:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:0.75em; color:#666;">Ch: ${escapeHtml(occ.chapTitle)} | Seg ${occ.segIdx}</div>
                    <div style="display:flex; gap:4px;">
                        <button class="lang-more-ctx-btn" data-idx="${occ.globalIdx}" style="background:#333; color:#aaa; border:1px solid #555; padding:2px 8px; cursor:pointer; font-size:0.7em; width:auto;">📖 More</button>
                        <button class="lang-edit-btn" data-idx="${occ.globalIdx}" style="background:#333; color:#4B9CD3; border:1px solid #4B9CD3; padding:2px 8px; cursor:pointer; font-size:0.7em; width:auto;">✏️ Edit</button>
                    </div>
                </div>
                <div id="lang-ctx-${occ.globalIdx}" style="font-family:'Courier New', monospace; font-size:0.85em; color:#888; margin-top:4px; line-height:1.5;">${prefix}${highlighted}${suffix}</div>
                <div id="lang-editor-${occ.globalIdx}" class="hidden" style="margin-top:6px;">
                    <textarea id="lang-textarea-${occ.globalIdx}" rows="3" style="width:100%; background:#1a1a1a; color:#ddd; border:1px solid #555; padding:6px; font-family:'Courier New', monospace; font-size:0.9em; box-sizing:border-box;"></textarea>
                    <div style="display:flex; gap:6px; margin-top:4px;">
                        <button class="lang-save-btn" data-idx="${occ.globalIdx}" style="background:#0047AB; color:#fff; border:none; padding:4px 12px; cursor:pointer; font-size:0.75em; width:auto;">Save & Re-Scan</button>
                        <button class="lang-cancel-btn" data-idx="${occ.globalIdx}" style="background:#333; color:#aaa; border:1px solid #555; padding:4px 12px; cursor:pointer; font-size:0.75em; width:auto;">Cancel</button>
                    </div>
                </div>
            </div>`;
        });
        html += `</div>`;
    });

    container.innerHTML = html;
    wireLangButtons();
}

function wireLangButtons() {
    // Clear approvals link
    const clearLink = document.getElementById('lang-clear-approvals');
    if (clearLink) {
        clearLink.onclick = (e) => {
            e.preventDefault();
            if (!confirm('Clear all approved words for this book?')) return;
            saveApprovedWords(activeBookId, []);
            rerunLanguageScan();
        };
    }

    // Approve all instances of a word
    document.querySelectorAll('.lang-approve-word-btn').forEach(btn => {
        btn.onclick = () => {
            const word = btn.dataset.word;
            const approved = activeBookId ? getApprovedWords(activeBookId) : [];
            if (!approved.includes(word)) approved.push(word);
            if (activeBookId) saveApprovedWords(activeBookId, approved);
            btn.innerText = '✅ Approved';
            btn.style.background = '#224422';
            btn.disabled = true;
            rerunLanguageScan();
        };
    });

    // More Context buttons — expand by ~120 chars each direction
    document.querySelectorAll('.lang-more-ctx-btn').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            const iss = langIssueData[idx];
            const text = iss.segRef.text || '';

            // Expand boundaries by ~120 chars, respecting segment edges
            let newStart = Math.max(0, iss.ctxStart - 120);
            let newEnd = Math.min(text.length, iss.ctxEnd + 120);

            // If we've reached the full segment, try to hint that
            const atStart = newStart === 0;
            const atEnd = newEnd === text.length;

            iss.ctxStart = newStart;
            iss.ctxEnd = newEnd;
            iss.context = text.substring(newStart, newEnd).trim();

            // Re-render the context display
            const ctxDiv = document.getElementById(`lang-ctx-${idx}`);
            if (ctxDiv) {
                const safeCtx = escapeHtml(iss.context);
                const highlighted = safeCtx.replace(
                    new RegExp(escapeRegex(escapeHtml(iss.word)), 'gi'),
                    m => `<span class="bad-char-highlight" style="background:#660000;">${m}</span>`
                );
                const prefix = atStart ? '' : '...';
                const suffix = atEnd ? '' : '...';
                ctxDiv.innerHTML = prefix + highlighted + suffix;
            }

            // If editor is open, update textarea too
            const textarea = document.getElementById(`lang-textarea-${idx}`);
            if (textarea && !document.getElementById(`lang-editor-${idx}`).classList.contains('hidden')) {
                textarea.value = iss.context;
                textarea._ctxStart = iss.ctxStart;
                textarea._ctxEnd = iss.ctxEnd;
            }

            // Disable if we've hit segment boundaries
            if (atStart && atEnd) {
                btn.innerText = '📖 Full segment';
                btn.disabled = true;
                btn.style.color = '#555';
            }
        };
    });

    // Edit buttons — use current (possibly expanded) context
    document.querySelectorAll('.lang-edit-btn').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            const iss = langIssueData[idx];
            const textarea = document.getElementById(`lang-textarea-${idx}`);
            textarea.value = iss.context;
            textarea._ctxStart = iss.ctxStart;
            textarea._ctxEnd = iss.ctxEnd;
            document.getElementById(`lang-editor-${idx}`).classList.remove('hidden');
            textarea.focus();
        };
    });

    // Cancel buttons
    document.querySelectorAll('.lang-cancel-btn').forEach(btn => {
        btn.onclick = () => document.getElementById(`lang-editor-${btn.dataset.idx}`).classList.add('hidden');
    });

    // Save buttons
    document.querySelectorAll('.lang-save-btn').forEach(btn => {
        btn.onclick = async () => {
            const idx = parseInt(btn.dataset.idx);
            const iss = langIssueData[idx];
            const textarea = document.getElementById(`lang-textarea-${idx}`);
            const newSnippet = textarea.value;

            // Splice edit back into segment
            const seg = iss.segRef;
            seg.text = seg.text.substring(0, textarea._ctxStart) + newSnippet + seg.text.substring(textarea._ctxEnd);

            // Save to Firestore if loaded from DB
            if (langIsFromDB && activeBookId) {
                try {
                    const chapData = stagedChapters[iss.chapIdx];
                    const chapId = chapData.id;
                    await setDoc(doc(db, "books", activeBookId, "chapters", "chapter_" + chapId), { segments: chapData.segments }, { merge: true });
                    statusEl.innerText = `Saved edit to ${iss.chapTitle}.`;
                    statusEl.style.borderColor = '#00ff41';
                } catch (e) { alert('Save failed: ' + e.message); return; }
            }
            rerunLanguageScan();
        };
    });
}

function rerunLanguageScan() {
    const approved = activeBookId ? getApprovedWords(activeBookId) : [];
    const issues = scanForLanguageIssues(stagedChapters, approved);
    showLanguageWarnings(issues, langIsFromDB);
    if (issues.length > 0) {
        statusEl.innerText = `⚠️ ${issues.length} language warning(s) remaining.`;
        statusEl.style.borderColor = "#ffaa00";
    } else {
        statusEl.innerText = "✅ No language warnings remaining.";
        statusEl.style.borderColor = "#00ff41";
    }
}

// === BOOK AUDIT TOOL ===
const auditBtn = document.getElementById('audit-book-btn');
const auditResults = document.getElementById('audit-results');
// true = audited from Firestore, false = audited from stagedChapters. Mirrors
// langIsFromDB, and decides whether a fix writes to the DB or edits memory.
let auditIsFromDB = true;
const langScanBtn = document.getElementById('language-scan-btn');
let auditIssueData = [];

function clearAuditResults() {
    if (auditResults) { auditResults.classList.add('hidden'); auditResults.innerHTML = ''; }
    const langResults = document.getElementById('language-results');
    if (langResults) { langResults.classList.add('hidden'); langResults.innerHTML = ''; }
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
        // The audit used to read only from Firestore, so auditing a freshly parsed
        // EPUB before clicking "Upload All" always failed with "Book metadata not
        // found" — createParseBtn sets activeBookId and stages chapters in memory but
        // writes nothing to Firestore until upload. Checking for untypable characters
        // BEFORE committing a book is the useful order, so staged chapters win.
        // Was: (stagedChapters.length === 0), which was wrong — "Open Book" fills
        // stagedChapters from Firestore, so that test would have classified a
        // database-backed book as staged and quietly stopped writing its fixes.
        auditIsFromDB = (stagedChapters.length === 0) || stagedFromDB;

        let chapters;   // [{ id, title, segments }]
        if (stagedChapters.length > 0) {
            chapters = stagedChapters.map((c, i) => ({
                id: (c.id !== undefined && c.id !== "") ? String(c.id) : String(i + 1),
                title: c.title || ('Chapter ' + ((c.id !== undefined && c.id !== "") ? c.id : i + 1)),
                segments: c.segments || []
            }));
            if (!chapters.length) {
                auditResults.innerHTML = '<div style="color:red;">Nothing staged to audit.</div>';
                return;
            }
        } else {
            const metaSnap = await getDoc(doc(db, "books", activeBookId));
            if (!metaSnap.exists()) {
                auditResults.innerHTML = '<div style="color:#ffaa00;">' +
                    'No saved copy of <strong>' + activeBookId + '</strong> in the database yet, ' +
                    'and nothing staged to audit.<br><span style="color:#888;">' +
                    'If you just parsed an EPUB, click <strong>Open Book</strong> to load it, ' +
                    'or upload it first.</span></div>';
                return;
            }
            const metaChapters = metaSnap.data().chapters || [];
            chapters = [];
            for (const chap of metaChapters) {
                const chapSnap = await getDoc(doc(db, "books", activeBookId, "chapters", chap.id));
                if (!chapSnap.exists()) continue;
                chapters.push({ id: chap.id, title: chap.title || chap.id,
                                segments: chapSnap.data().segments || [] });
            }
        }

        for (const chap of chapters) {
            const chapId = chap.id;
            const segments = chap.segments;

            segments.forEach((seg, segIdx) => {
                const text = seg.text || '';
                for (let i = 0; i < text.length; i++) {
                    const ch = text[i];
                    const code = ch.charCodeAt(0);
                    if (code === 9 || code === 10 || (code >= 32 && code <= 126)) continue;
                    const hex = code.toString(16).toUpperCase().padStart(4, '0');
                    auditIssueData.push({
                        chapId, chapTitle: chap.title || chapId,
                        segIdx, charIdx: i, char: ch, hex,
                        replacement: getSanitizedReplacement(ch),
                        segments
                    });
                }
            });
        }
        renderAuditResults(chapters.length);
    } catch (e) {
        auditResults.innerHTML = `<div style="color:red;">Audit error: ${e.message}</div>`;
    } finally {
        auditBtn.disabled = false;
        auditBtn.innerText = '🔍 Audit Book for Untypeable Characters';
    }
}

function renderAuditResults(chapCount) {
    const totalIssues = auditIssueData.length;
    const sourceBanner = auditIsFromDB
        ? '<div style="color:#4B9CD3; font-size:0.8em; margin-bottom:8px;">Auditing the <strong>saved</strong> copy in the database. Fixes write immediately.</div>'
        : '<div style="color:#ffaa00; font-size:0.8em; margin-bottom:8px;">Auditing <strong>staged</strong> chapters that are not uploaded yet. Fixes stay in memory until you click <strong>Upload All</strong>.</div>';

    if (totalIssues === 0) {
        auditResults.innerHTML = sourceBanner + `
            <div style="color:#00ff41; font-weight:bold; font-size:1.1em;">✅ Clean! No untypeable characters found.</div>
            <div style="color:#888; margin-top:5px;">Scanned ${chapCount} chapters.</div>
        `;
        return;
    }

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
        html += `<div style="font-weight:bold; color:#4B9CD3;">${escapeHtml(chapTitle)} (${chapId}) — ${issues.length} issue${issues.length !== 1 ? 's' : ''}</div>`;
        issues.forEach(iss => {
            const seg = iss.segments[iss.segIdx];
            const text = seg.text || '';
            // Sentence context
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
            const safeCtx = escapeHtml(context);
            const safeCh = escapeHtml(iss.char);
            const highlighted = safeCtx.split(safeCh).join(`<span class="bad-char-highlight">${safeCh}</span>`);

            html += `<div id="audit-issue-${iss.globalIdx}" style="margin:6px 0 6px 15px; padding:6px; background:#111; border:1px solid #333; border-radius:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:0.8em; color:#aaa;">
                        Seg ${iss.segIdx}, pos ${iss.charIdx}:
                        <span style="color:#ff3333; font-weight:bold;">"${safeCh}"</span>
                        (U+${iss.hex}) → <span style="color:#00ff41;">${escapeHtml(String(iss.replacement))}</span>
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

    auditResults.innerHTML = sourceBanner + html;
    wireAuditButtons();
}

function wireAuditButtons() {
    const fixAllBtn = document.getElementById('audit-fix-all-btn');
    if (fixAllBtn) {
        fixAllBtn.onclick = async () => {
            const chapIds = [...new Set(auditIssueData.map(i => i.chapId))];
            if (!confirm(`Fix all issues in ${chapIds.length} chapter(s)?`)) return;
            fixAllBtn.disabled = true; fixAllBtn.innerText = '⏳ Fixing...';
            let fixed = 0;
            for (const chapId of chapIds) {
                if (stagedChapters.length > 0 && !stagedFromDB) {
                    // Staged book: mutate the in-memory segments. They get written by
                    // Upload All. Writing to Firestore here would create chapters
                    // under a book document that doesn't exist yet.
                    const staged = stagedChapters.find((c, i) =>
                        String((c.id !== undefined && c.id !== "") ? c.id : i + 1) === String(chapId));
                    if (!staged) continue;
                    let changed = false;
                    (staged.segments || []).forEach(seg => {
                        const o = seg.text; seg.text = sanitizeText(seg.text);
                        if (seg.text !== o) changed = true;
                    });
                    if (changed) fixed++;
                    continue;
                }
                const chapSnap = await getDoc(doc(db, "books", activeBookId, "chapters", chapId));
                if (!chapSnap.exists()) continue;
                const data = chapSnap.data();
                let changed = false;
                data.segments.forEach(seg => { const o = seg.text; seg.text = sanitizeText(seg.text); if (seg.text !== o) changed = true; });
                if (changed) { await setDoc(doc(db, "books", activeBookId, "chapters", chapId), { segments: data.segments }, { merge: true }); fixed++; }
            }
            statusEl.innerText = auditIsFromDB
                ? `Audit fix complete: ${fixed} chapter(s) updated in the database.`
                : `Audit fix complete: ${fixed} staged chapter(s) cleaned \u2014 click Upload All to save.`;
            statusEl.style.borderColor = '#00ff41';
            runAudit();
        };
    }

    document.querySelectorAll('.audit-edit-btn').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            const iss = auditIssueData[idx];
            const text = iss.segments[iss.segIdx].text || '';
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
            const textarea = document.getElementById(`audit-textarea-${idx}`);
            textarea.value = text.substring(ctxStart, ctxEnd).trim();
            textarea._ctxStart = ctxStart;
            textarea._ctxEnd = ctxEnd;
            document.getElementById(`audit-editor-${idx}`).classList.remove('hidden');
            textarea.focus();
        };
    });

    document.querySelectorAll('.audit-cancel-btn').forEach(btn => {
        btn.onclick = () => document.getElementById(`audit-editor-${btn.dataset.idx}`).classList.add('hidden');
    });

    document.querySelectorAll('.audit-save-btn').forEach(btn => {
        btn.onclick = async () => {
            const idx = parseInt(btn.dataset.idx);
            const iss = auditIssueData[idx];
            const textarea = document.getElementById(`audit-textarea-${idx}`);
            const newSnippet = textarea.value;
            const remaining = newSnippet.match(/[^ -~\t\n]/g);
            if (remaining) {
                const chars = [...new Set(remaining)].map(c => `"${c}" (U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')})`).join(', ');
                if (!confirm(`Still contains untypeable characters: ${chars}\n\nSave anyway?`)) return;
            }
            const seg = iss.segments[iss.segIdx];
            seg.text = seg.text.substring(0, textarea._ctxStart) + newSnippet + seg.text.substring(textarea._ctxEnd);
            // iss.segments is the same array object as the staged chapter's segments,
            // so the edit above has already landed in memory. Only persist when the
            // audit came from the database.
            if (!auditIsFromDB) {
                statusEl.innerText = `Edited ${iss.chapTitle} (staged \u2014 click Upload All to save).`;
                statusEl.style.borderColor = '#ffaa00';
                runAudit();
                return;
            }
            try {
                await setDoc(doc(db, "books", activeBookId, "chapters", iss.chapId), { segments: iss.segments }, { merge: true });
                statusEl.innerText = `Saved edit to ${iss.chapTitle}.`;
                statusEl.style.borderColor = '#00ff41';
                runAudit();
            } catch (e) { alert('Save failed: ' + e.message); }
        };
    });

    document.querySelectorAll('.audit-autofix-btn').forEach(btn => {
        btn.onclick = async () => {
            const idx = parseInt(btn.dataset.idx);
            const iss = auditIssueData[idx];
            iss.segments[iss.segIdx].text = sanitizeText(iss.segments[iss.segIdx].text);
            try {
                await setDoc(doc(db, "books", activeBookId, "chapters", iss.chapId), { segments: iss.segments }, { merge: true });
                const el = document.getElementById(`audit-issue-${idx}`);
                if (el) { el.style.borderColor = '#336633'; el.style.background = '#0a220a'; el.innerHTML = '<div style="color:#00ff41; font-size:0.8em;">✅ Fixed</div>'; }
                statusEl.innerText = `Fixed issue in ${iss.chapTitle}.`;
                statusEl.style.borderColor = '#00ff41';
            } catch (e) { alert('Fix failed: ' + e.message); }
        };
    });
}

if (auditBtn) auditBtn.onclick = () => runAudit();

// Language scan button (for existing books loaded from DB)
if (langScanBtn) {
    langScanBtn.onclick = () => {
        if (stagedChapters.length === 0) return alert("No book loaded. Open a book first.");
        const approved = activeBookId ? getApprovedWords(activeBookId) : [];
        const issues = scanForLanguageIssues(stagedChapters, approved);
        if (issues.length > 0) {
            showLanguageWarnings(issues, true);
            statusEl.innerText = `⚠️ ${issues.length} language warning(s) found.`;
            statusEl.style.borderColor = "#ffaa00";
        } else {
            const container = document.getElementById('language-results');
            if (container) {
                container.classList.remove('hidden');
                container.innerHTML = '<div style="color:#00ff41; font-weight:bold;">✅ No flagged language found.</div>';
            }
            statusEl.innerText = "Language scan complete — no issues found.";
            statusEl.style.borderColor = "#00ff41";
        }
    };
}

// ─── Repair Chapter Order ─────────────────────────────────────────────────────
const repairChapterOrderBtn = document.getElementById('repair-chapter-order-btn');
if (repairChapterOrderBtn) {
    repairChapterOrderBtn.onclick = async () => {
        if (!activeBookId) return alert("No book loaded. Open a book first.");
        const resultsEl = document.getElementById('repair-results');
        resultsEl.classList.remove('hidden');
        resultsEl.innerHTML = 'Reading chapter metadata from Firestore...';

        try {
            const metaSnap = await getDoc(doc(db, "books", activeBookId));
            if (!metaSnap.exists()) { resultsEl.innerHTML = 'Book metadata not found.'; return; }

            const meta = metaSnap.data();
            const chapters = meta.chapters || [];
            const before = chapters.map(c => c.id).join(', ');

            // Deduplicate by id (keep first occurrence)
            const seen = new Set();
            const deduped = chapters.filter(c => {
                if (seen.has(c.id)) return false;
                seen.add(c.id); return true;
            });

            // Sort numerically by chapter number (handles "chapter_0", "chapter_1", "chapter_10")
            deduped.sort((a, b) => {
                const na = parseFloat(a.id.replace('chapter_', '')) || 0;
                const nb = parseFloat(b.id.replace('chapter_', '')) || 0;
                return na - nb;
            });

            const after = deduped.map(c => c.id).join(', ');
            const dupCount = chapters.length - deduped.length;

            if (before === after && dupCount === 0) {
                resultsEl.innerHTML = '<span style="color:#00ff41;">✓ Chapter order is already clean — no changes needed.</span>';
                return;
            }

            // Preview
            resultsEl.innerHTML =
                '<strong>Before (' + chapters.length + ' entries):</strong><br>' +
                before.split(', ').map(id => '<span style="color:#888">' + id + '</span>').join(' ') +
                '<br><br><strong>After (' + deduped.length + ' entries):</strong><br>' +
                after.split(', ').map(id => '<span style="color:#66ccff">' + id + '</span>').join(' ') +
                (dupCount > 0 ? '<br><br><span style="color:#ffaa00;">⚠ ' + dupCount + ' duplicate(s) will be removed.</span>' : '') +
                '<br><br><button id="repair-confirm-btn" style="background:#004466;border:1px solid #006688;color:#66ccff;padding:8px 20px;cursor:pointer;border-radius:4px;">Write Repaired Order to Firestore</button>' +
                ' <button id="repair-cancel-btn" style="background:#333;border:1px solid #555;color:#aaa;padding:8px 20px;cursor:pointer;border-radius:4px;">Cancel</button>';

            document.getElementById('repair-cancel-btn').onclick = () => {
                resultsEl.innerHTML = 'Cancelled.';
                setTimeout(() => resultsEl.classList.add('hidden'), 2000);
            };

            document.getElementById('repair-confirm-btn').onclick = async () => {
                resultsEl.innerHTML = 'Writing...';
                await setDoc(doc(db, "books", activeBookId), { chapters: deduped }, { merge: true });
                resultsEl.innerHTML = '<span style="color:#00ff41;">✓ Done — ' + deduped.length + ' chapters in correct order. Reload the book to confirm.</span>';
                statusEl.innerText = 'Chapter order repaired.';
                statusEl.style.borderColor = '#00ff41';
            };

        } catch (e) {
            resultsEl.innerHTML = '<span style="color:#ff4444;">Error: ' + e.message + '</span>';
        }
    };
}


// ═══════════════════════════════════════════════════════════════════════════
// Request access — what a colleague sees instead of "Access Denied"
// ═══════════════════════════════════════════════════════════════════════════
//
// This is how people get found without a browsable user directory. Rather than
// searching every account in the district for a name, the person who wants access
// asks for it, and only requesters appear in the Staff tab. No student data at
// rest, nothing to search, and it matches how it happens in real life — a
// colleague mentions they're interested.
function showRequestAccessPanel(user) {
    const login = document.getElementById('login-section');
    if (!login) return;
    login.classList.remove('hidden');
    const editor = document.getElementById('editor-section');
    if (editor) editor.classList.add('hidden');

    if (document.getElementById('request-access-box')) return;   // already shown

    const box = document.createElement('div');
    box.id = 'request-access-box';
    box.style.cssText = 'max-width:520px;margin:18px auto;padding:18px;' +
        'background:#1a1a1a;border:1px solid #333;border-radius:4px;text-align:left';
    box.innerHTML = `
        <div style="color:#4B9CD3;font-weight:bold;margin-bottom:6px">Not a staff account</div>
        <div style="font-size:.9em;color:#aaa;line-height:1.5;margin-bottom:12px">
            You're signed in as ${(user.email || '').replace(/[<>&"]/g, '')}, which is a
            student account. If you're a teacher and need access, ask below and an
            administrator will set you up.
        </div>
        <textarea id="request-note" placeholder="Which school and classes do you teach? (optional)"
            style="width:100%;min-height:60px;background:#111;color:#eee;border:1px solid #333;
                   border-radius:3px;padding:8px;font:inherit;font-size:.9em"></textarea>
        <div style="display:flex;gap:8px;align-items:center;margin-top:10px">
            <button id="request-send" style="padding:6px 18px;background:#4B9CD3;color:#000;
                border:none;border-radius:3px;font:inherit;font-weight:bold;cursor:pointer">Request access</button>
            <span id="request-status" style="font-size:.85em;color:#888"></span>
        </div>`;
    login.appendChild(box);

    document.getElementById('request-send').addEventListener('click', async () => {
        const statusEl = document.getElementById('request-status');
        const note = (document.getElementById('request-note').value || '').trim().slice(0, 500);
        statusEl.textContent = 'Sending…';
        try {
            await setDoc(doc(db, 'staffRequests', user.uid), {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                note,
                requestedAt: serverTimestamp(),
            });
            statusEl.style.color = '#00ff41';
            statusEl.textContent = 'Sent. An administrator will see it on their Staff tab.';
            document.getElementById('request-send').disabled = true;
        } catch (e) {
            console.error(e);
            statusEl.style.color = '#ff5252';
            statusEl.textContent = 'Could not send: ' + (e.message || 'unknown error');
        }
    });
}


// ═══════════════════════════════════════════════════════════════════════════
// Bootstrap warning  (v3.2.0)
// ═══════════════════════════════════════════════════════════════════════════
//
// The one genuine chicken-and-egg in the setup: rules identify admins by a
// staff/{uid} document, and rules also forbid anyone from creating or editing
// their own staff record — which is exactly what stops an admin quietly widening
// their own access. So the FIRST staff document cannot come from the app. It has
// to be written in the Firebase console, which bypasses rules.
//
// Until then the admin pages READ fine and every WRITE fails. Say so plainly,
// with the UID pre-filled, instead of letting it surface as a permission error
// halfway through adding a school.
function showBootstrapWarning(user) {
    if (document.getElementById('bootstrap-warning')) return;
    const host = document.getElementById('editor-section') || document.body;
    const div = document.createElement('div');
    div.id = 'bootstrap-warning';
    div.style.cssText = 'background:#2b1c00;border:1px solid #ffaa00;border-radius:4px;' +
        'padding:14px;margin:12px 0;font-size:.85em;line-height:1.6;color:#ffd79a';
    div.innerHTML = `
        <div style="font-weight:bold;color:#ffaa00;margin-bottom:6px">
            Setup incomplete — writes will fail</div>
        <p style="margin:0 0 8px">
            This page is treating you as a super admin, but the security rules
            identify admins by a <code>staff</code> document and you don't have one.
            Reading works; <b>saving anything will be denied.</b>
        </p>
        <p style="margin:0 0 8px">
            Rules deliberately forbid creating your own staff record — that's what
            prevents an admin widening their own access — so this first one has to be
            written in the Firebase console, which bypasses rules.
        </p>
        <p style="margin:0 0 6px"><b>Firestore Database → Start collection →
            <code>staff</code> → Document ID:</b></p>
        <div style="display:flex;gap:6px;align-items:center;margin:0 0 8px">
            <code id="bootstrap-uid" style="background:#000;padding:4px 8px;border-radius:3px;
                  user-select:all;flex:1;overflow:auto">${user.uid}</code>
            <button id="bootstrap-copy" style="padding:4px 12px;font:inherit;font-size:.95em;
                background:#ffaa00;color:#000;border:none;border-radius:3px;cursor:pointer">Copy</button>
        </div>
        <p style="margin:0 0 8px">Fields — <code>active</code> is a
            <b>boolean</b>, not the string "true":</p>
        <pre style="margin:0 0 8px;background:#000;padding:8px;border-radius:3px;overflow:auto"
>role        (string)   super_admin
schoolIds   (array)    ["ems"]
readScope   (string)   building
active      (boolean)  true
email       (string)   ${(user.email || '').replace(/[<>&"]/g, '')}
displayName (string)   ${(user.displayName || '').replace(/[<>&"]/g, '')}</pre>
        <p style="margin:0">
            <a href="https://console.firebase.google.com/" target="_blank" rel="noopener"
               style="color:#ffaa00">Open the Firebase console →</a>
            &nbsp;Then reload. This banner disappears on its own.
        </p>`;
    host.insertBefore(div, host.firstChild);
    host.classList.remove('hidden');

    const btn = document.getElementById('bootstrap-copy');
    if (btn) btn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(user.uid); btn.textContent = 'Copied'; }
        catch (e) { btn.textContent = 'Select it manually'; }
    });
}
