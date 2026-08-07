// admin.js v3.24.0
//
// Book authoring: EPUB import, chapter editor, metadata and tags, language
// filter, CSV export. Hosts the Lessons and Staff panels from their own files.
//
// ── Full history: CHANGELOG.md § admin.js ─────────────────────────────────
//
// v3.24.0 — TWO IMPORT FIXES. (1) autofillFromEpub() now re-runs AFTER the new-book
//           tag clear instead of only before it. v3.23.0 added a clear of genre /
//           ages / protagonist / source / licence / archive / cleanedby / origin so
//           one book could not inherit the previous book's tags — correct, but
//           autofill runs on the file input's `change` event, so the clear wiped
//           everything it had just filled. Since v3.23.0 EVERY new-book import
//           silently lost every field except title, author and cover, which survive
//           only because they sit outside the cleared set. (2) Archive URL is filled
//           from the picked file's own name against ARCHIVE_BASE_DEFAULT.
// v3.23.3 — Comment fix, no behaviour change. The AUTH block's header comment said
//           staff identity came from Auth custom claims; the comment four lines
//           below it, and the code, correctly said staff/{uid} documents. Claims were
//           reversed in firestore.rules v2.0.0 and are not coming back — they need a
//           terminal. Round 6 recovered MULTITENANCY.md, which is where that idea
//           came from, so the wrong wording is now traceable rather than mysterious.
// v3.23.2 — HEADER ONLY, no code change. The entries below had stopped at v3.18.4
//           while the constant read v3.23.1 — NINE releases, including Delete Book
//           and the whole attribution/About system, were absent from the file that
//           implements them. Refreshed from CHANGELOG.md and trimmed to the
//           6-entry budget.
// v3.23.1 — "Cleaned up with" became "Cleaned up by": what the field means, and
//           short enough to stop the circled-i hint wrapping.
// v3.23.0 — DELETE BOOK, with typed confirmation rather than a confirm() one
//           careless Return from gone. Counts chapters before asking, and deletes
//           them before the book record so a half-failure is visible instead of an
//           invisible pile of orphans. Plus three more panel fixes.
// v3.22.1 — admin.html layout only: the metadata block had become one row of nine
//           columns with hint paragraphs taller than the inputs they described.
//           Two rows now, identity/tagging then provenance.
// ── Load-bearing ──────────────────────────────────────────────────────────
//
//   * loadBookList(selectFirst) defaults to FALSE and preserves the current
//     selection. Passing true fires onchange, which hides the staging area
//     and reassigns activeBookId — that is how Save Metadata used to throw
//     away a book's staged chapters.
//   * loadCustomWords() must not run at module-eval time; settings/{docId}
//     is gated behind signedIn() and it would race auth.
//   * Never use innerText on a DOMParser document. It needs layout and
//     returns undefined in Firefox.
import { db, auth, storage } from "./firebase-config.js";
import { initLessonsPanel, setStaffHooks } from "./lessons-admin.js";
import { initStaffPanel, initStaffPanelContent, syncOwnClaimsAfterClassChange }
    from "./staff-admin.js";
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const ADMIN_VERSION = "3.24.0";

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
// Grouped by WHY a term is flagged, because "why" is the thing the audit view
// needed to be able to show. FLAGGED_WORDS stays a flat array of strings so
// nothing downstream had to change.
//
// ⚠️ THIS IS A TEACHER-AWARENESS TOOL, NOT A CENSOR. The scan surfaces a word in
// context and Jake decides per book — there's an "approve" path that whitelists a
// word for that book. So the cost asymmetry runs one way: a false positive is one
// click, a false negative is a 6th grader hitting it live in front of the class.
// That argues for a generous list, which is why `period` exists.
//
// The v3.7.0 list was written by pattern-matching modern profanity and missed
// "boob" in Pinocchio ("Land of the Boobies"). The gap wasn't that word — it was
// the whole category of period vocabulary, which is most of what these books are.
//
// ⚠️ The `review` group (v3.9.0) was previously held back on false-positive
// grounds. Jake overruled that, and his reasoning is load-bearing enough to
// record: he is not censoring, he is REWRITING. A flagged passage gets reworded
// before students ever see it, and the goal is "type without worrying about what
// they might read". Under that use, a false positive costs one edit and a false
// negative costs a 6th grader reading it aloud — so a term that fires often is
// still worth firing. As he put it: the ELA teacher wants to talk about it, the
// typing teacher just needs them to type.
//
// They are kept in their OWN group rather than folded into `period` so the audit
// view can warn that they're expected to fire a lot. Do not merge them.
const FLAGGED_WORD_GROUPS = {
    // Racial and ethnic slurs. Not okay in any context.
    slur: [
        'nigger', 'niggers', 'nigga', 'niggas',
        'chink', 'chinks', 'spic', 'spics', 'spick', 'spicks',
        'wetback', 'wetbacks', 'kike', 'kikes',
        'gook', 'gooks', 'beaner', 'beaners',
        'coon', 'coons', 'darkie', 'darkies', 'darky',
        'redskin', 'redskins', 'injun', 'injuns',
        'halfbreed', 'half-breed', 'pickaninny', 'pickaninnies',
        'sambo', 'jap', 'japs',
    ],
    // Modern profanity.
    profanity: [
        'fuck', 'fucking', 'fucked', 'fucker', 'fucks',
        'shit', 'shits', 'shitting', 'shitty',
        'bitch', 'bitches', 'asshole', 'assholes',
        'damn', 'damned', 'goddamn', 'goddamned',
        'bastard', 'bastards', 'cunt', 'cunts',
        'piss', 'pissed', 'pissing', 'whore', 'whores',
        'arse', 'arses', 'bugger', 'buggered', 'bollocks',
        'prick', 'pricks', 'twat', 'twats', 'wanker',
    ],
    // Archaic terms that are slurs now. HIGH VALUE for this library — these are
    // the ones that actually appear in the public-domain books being uploaded,
    // and the ones a teacher most needs advance warning about.
    period: [
        'squaw', 'squaws', 'papoose', 'papooses',
        'mulatto', 'mulattos', 'mulattoes', 'quadroon', 'quadroons',
        'octoroon', 'octoroons', 'hottentot', 'hottentots',
        'kaffir', 'kaffirs', 'dago', 'dagos', 'wop', 'wops',
        'greaser', 'greasers', 'polack', 'polacks',
        'yid', 'yids', 'hebe', 'hebes', 'sheeny', 'sheenies',
        'chinaman', 'chinamen', 'coolie', 'coolies', 'oriental', 'orientals',
        'gypsy', 'gypsies', 'gipsy', 'gipsies',
        'heathen', 'heathens', 'negress', 'negresses',
        'cripple', 'crippled', 'cripples',
        'imbecile', 'imbeciles', 'moron', 'morons',
        'lunatic', 'lunatics', 'feeble-minded', 'simpleton', 'simpletons',
        'mongoloid', 'spastic', 'midget', 'midgets',
        'retard', 'retards', 'retarded',
    ],
    // Innocent in period English, flagged anyway — see the note above.
    // "a queer little man", "the cock crowed", "a guinea" as money, and every
    // fairy-tale dwarf will trip these. That is expected and accepted.
    review: [
        'queer', 'queerly', 'queerest',
        'gay', 'gayly', 'gaily', 'gayest',
        'savage', 'savages', 'savagely', 'savagery',
        'cock', 'cocks',
        'dwarf', 'dwarfs', 'dwarves',
        'guinea', 'guineas',
        'negro', 'negroes', 'negros',
    ],
    // Anatomical / crude. The category that was missing entirely.
    anatomy: [
        'boob', 'boobs', 'boobies', 'booby',
        'tit', 'tits', 'titty', 'titties',
        'penis', 'penises', 'vagina', 'vaginas',
        'testicle', 'testicles', 'scrotum',
        'buttock', 'buttocks', 'anus',
    ],
};

const FLAGGED_WORD_CATEGORY = {};
for (const [cat, words] of Object.entries(FLAGGED_WORD_GROUPS)) {
    for (const w of words) FLAGGED_WORD_CATEGORY[w] = cat;
}
const FLAGGED_WORDS = Object.values(FLAGGED_WORD_GROUPS).flat();
// Words Jake adds himself, stored in settings/languageFilter so they follow him
// between school and home rather than living in one browser. Rules already allow
// read: signedIn / write: isSuper on settings/{docId}, so no rules change was needed.
let customFlaggedWords = [];

function escapeForRegex(w) { return String(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// A term is a raw regex if it's wrapped in slashes — the same /…/ convention the
// free-text search already used, so there's one rule to remember instead of two.
function isRegexTerm(t) {
    const s = String(t).trim();
    return s.length > 2 && s.startsWith('/') && s.endsWith('/');
}
function regexTermSource(t) { return String(t).trim().slice(1, -1); }

// Validate before storing. An invalid pattern that reaches the word list would
// throw inside buildFlaggedRegex() and take down EVERY scan, not just its own
// term — so it's rejected at the door, and skipped defensively at compile time
// in case one is already in the document from a hand edit.
function validateFilterTerm(t) {
    const s = String(t).trim();
    if (!s) return { ok: false, msg: 'Empty.' };
    // '/' and '//' fall below the isRegexTerm length floor and would sail through
    // as LITERALS — stored as a term that compiles to \b\/\/\b and matches
    // nothing, ever, silently. Someone typing those slashes meant a pattern.
    if (/^\/+$/.test(s)) {
        return { ok: false, msg: 'Slashes with nothing between them. ' +
                                 'Write the pattern inside, like /boob\\w*/.' };
    }
    if (!isRegexTerm(s)) return { ok: true, kind: 'literal' };
    const src = regexTermSource(s);
    if (!src) return { ok: false, msg: 'Empty pattern between the slashes.' };
    try { new RegExp(src); } catch (e) {
        return { ok: false, msg: 'Not a valid regular expression: ' + e.message };
    }
    // A pattern that can match nothing turns every scan into an infinite crawl.
    if (new RegExp(src).test('')) {
        return { ok: false, msg: 'That pattern matches an empty string — it would ' +
                                 'match everywhere. Add something it must contain.' };
    }
    return { ok: true, kind: 'regex' };
}

// Returns { rx, terms, skipped }. `terms` is what the audit view renders;
// `skipped` is any stored term that failed to compile.
//
// Each term carries its OWN boundaries rather than the whole alternation being
// wrapped in \b(...)\b. That's what makes mixing literals and regexes work: a
// literal still gets whole-word treatment, and a pattern like /boob\w*/ gets to
// control its own edges (\b before \w* would defeat the point).
function compileFilter() {
    const seen = new Set();
    const terms = [], skipped = [], parts = [];

    const push = (raw, source) => {
        const s = String(raw).trim();
        if (!s) return;
        const key = s.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        const v = validateFilterTerm(s);
        if (!v.ok) { skipped.push({ term: s, source, reason: v.msg }); return; }
        if (v.kind === 'regex') {
            parts.push('(?:' + regexTermSource(s) + ')');
            terms.push({ term: s, source, kind: 'regex',
                         category: source === 'custom' ? 'custom' : FLAGGED_WORD_CATEGORY[key] });
        } else {
            parts.push('\\b' + escapeForRegex(key) + '\\b');
            terms.push({ term: key, source, kind: 'literal',
                         category: source === 'custom' ? 'custom' : FLAGGED_WORD_CATEGORY[key] });
        }
    };

    // Longest literals first so "goddamned" wins over "damn" at the same index.
    // Regex terms keep author order — their precedence is the author's problem.
    const builtin = [...FLAGGED_WORDS].sort((x, y) => y.length - x.length);
    builtin.forEach(w => push(w, 'built-in'));
    customFlaggedWords.forEach(w => push(w, 'custom'));

    let rx;
    try {
        rx = new RegExp(parts.join('|'), 'gi');
    } catch (e) {
        // Belt and braces: fall back to literals only rather than failing the scan.
        console.warn('Filter compile failed, falling back to literals:', e);
        rx = new RegExp(FLAGGED_WORDS.map(w => '\\b' + escapeForRegex(w) + '\\b').join('|'), 'gi');
    }
    return { rx, terms, skipped };
}

// Built fresh each scan instead of once at load, because the word list is
// editable and a module-level const could never see an addition.
function buildFlaggedRegex() { return compileFilter().rx; }

async function loadCustomWords() {
    try {
        const snap = await getDoc(doc(db, "settings", "languageFilter"));
        customFlaggedWords = (snap.exists() && Array.isArray(snap.data().words))
            ? snap.data().words : [];
    } catch (e) { customFlaggedWords = []; console.warn('Custom word list unreadable:', e); }
    renderCustomWords();
}

async function saveCustomWords() {
    const statusEl2 = document.getElementById('custom-word-status');
    try {
        await setDoc(doc(db, "settings", "languageFilter"),
                     { words: customFlaggedWords, updatedAt: new Date().toISOString() },
                     { merge: true });
        if (statusEl2) { statusEl2.textContent = 'Saved. Applies to every book.'; statusEl2.style.color = '#00ff41'; }
    } catch (e) {
        if (statusEl2) { statusEl2.textContent = 'Save failed: ' + e.message + ' (super admin only)'; statusEl2.style.color = '#ff4444'; }
    }
}

function renderCustomWords() {
    const el = document.getElementById('custom-word-list');
    if (!el) return;
    if (!customFlaggedWords.length) {
        el.innerHTML = '<span style="color:#775577; font-size:0.75em;">None yet. The built-in list still applies.</span>';
        return;
    }
    el.innerHTML = customFlaggedWords.map((w, i) =>
        '<span style="background:#2a0022; border:1px solid #552244; border-radius:12px; padding:2px 8px; font-size:0.75em; color:#eebbee;">' +
        (isRegexTerm(w) ? '<span style="color:#88ddaa; font-size:0.9em;" title="regular expression">.*&nbsp;</span>' : '') +
        escapeHtmlSafe(w) +
        ' <button data-widx="' + i + '" class="custom-word-del" title="Remove" ' +
        'style="background:none;border:0;color:#cc6688;cursor:pointer;padding:0 0 0 4px;font-size:1em;width:auto;">\u00d7</button></span>'
    ).join('');
    el.querySelectorAll('.custom-word-del').forEach(b => {
        b.onclick = async () => {
            customFlaggedWords.splice(parseInt(b.dataset.widx), 1);
            renderCustomWords();
            await saveCustomWords();
        };
    });
}

function escapeHtmlSafe(t) {
    return String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function getApprovedWords(bookId) {
    try {
        const saved = localStorage.getItem(`ttb_approved_lang_${bookId}`);
        return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
}
function saveApprovedWords(bookId, words) {
    localStorage.setItem(`ttb_approved_lang_${bookId}`, JSON.stringify(words));
}

// overrideRegex lets the free-text search reuse this whole function — the context
// extraction, the issue-card shape, the edit affordances — instead of duplicating it.
function scanForLanguageIssues(chapters, approvedWords = [], overrideRegex = null) {
    const approvedSet = new Set(approvedWords.map(w => w.toLowerCase()));
    const rx = overrideRegex || buildFlaggedRegex();
    const issues = [];
    chapters.forEach((chap, chapIdx) => {
        chap.segments.forEach((seg, segIdx) => {
            const text = seg.text || '';
            let match;
            rx.lastIndex = 0;
            while ((match = rx.exec(text)) !== null) {
                if (match[0].length === 0) { rx.lastIndex++; continue; }   // guard empty match
                if (!overrideRegex && approvedSet.has(match[0].toLowerCase())) continue;
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
// Body chapters only — excludes front and back matter. Written to the book
// document so "finished the book" can be judged on the story rather than the file
// count. Without it, a student who types the last chapter still has the colophon
// between them and the celebration.
let stagedBodyChapters = 0;
let editingIndex = -1;
let bookTitlesMap = {};
let activeBookId = ""; 
let importErrors = [];
let currentErrorIdx = 0;
let stagedCoverBlob = null;   // extracted or uploaded cover image
let stagedCoverUrl = null;    // preview data URL
// ⚠️ The image content type, tracked separately because JSZip strips it and the
// Storage upload needs it explicitly. See sniffImageType(). Empty means "no
// staged blob, or one whose type we could not establish" — uploadCover() refuses
// rather than storing an octet-stream nobody can render.
let stagedCoverType = '';

if(footerEl) footerEl.innerText = `Admin JS: v${ADMIN_VERSION} | Lessons Admin: v${window.LESSONS_ADMIN_VERSION || '?'} | Staff Admin: v${window.STAFF_ADMIN_VERSION || '?'}`;

// HANDOFF §4.1: admin.html's <title> was hardcoded and had no constant behind it,
// so it read v3.3.0 for nineteen minor versions. The tab title is the first
// version number anyone looks at, which makes it the worst one to maintain by
// hand. Driven from ADMIN_VERSION now — the constant in the file that implements
// the behaviour, which is the only copy that cannot lie about itself. The static
// title in admin.html is left as a pre-JS fallback, not as a second source.
document.title = `TypeThatBook Admin v${ADMIN_VERSION}`;

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
// Staff identity from the staff/{uid} DOCUMENT, not from Auth custom claims.
// ⚠️ v3.23.3: this comment said "from Auth custom claims" while the comment four
// lines below it, and the code, said the opposite. Claims were the Round 1 design
// (MULTITENANCY.md) and firestore.rules v2.0.0 reversed it because claims need the
// Admin SDK, which needs a terminal. The stale wording is worth naming rather than
// just deleting: the same confusion is why firestore-rules.test.mjs seeds roles as
// token claims and has never matched the rules it tests.
// ADMIN_EMAILS is retained ONLY as a bootstrap fallback so the first staff document
// can be created. Delete it once staff records exist.
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
await loadBookList(true);   // initial load: pick a book and open it
        // Safe now that auth has resolved — see the note by loadCustomWords().
        loadCustomWords();
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
// selectFirst=false (the default) PRESERVES the current selection and does NOT
// fire onchange. Refreshing the picker after a save must not disturb the editor:
// onchange hides the staging area and reassigns activeBookId, which is how
// "Save Metadata" came to throw away a book's staged chapters and silently
// repoint at whichever book happened to sort first.
async function loadBookList(selectFirst = false) {
    const previous = bookSelect.value;
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
            // ─── THE DOT IS THE RE-UPLOAD CHECKLIST (v3.21.0) ────────────────
            //
            // v3.7.0 checked age alone, because age was the only thing that
            // changed what students could find. Three more now matter enough to
            // block a book from being called done, and naming WHICH is the whole
            // value — a bare hollow dot on 40 books tells you there is work
            // without telling you what, which is how the age backlog sat.
            //
            //   age      — an untagged book is hidden whenever a student filters
            //   cover    — a blank tile in the grid, and the thing that sent this
            //              whole round sideways
            //   licence  — '' now means "not decided", because public domain is an
            //              explicit choice in the dropdown rather than an absence.
            //              A CC book without it is a compliance gap, not untidiness.
            //   about    — a book with front/back matter but nothing in the About
            //              view has credits that cannot be reached
            const gaps = [];
            if (b.minAge === null || b.minAge === undefined) gaps.push('age');
            if (!b.coverUrl) gaps.push('cover');
            if (!b.rights) gaps.push('licence');
            const chapArr = Array.isArray(b.chapters) ? b.chapters : [];
            const hasMatter = chapArr.some(c => c && c.matter && c.matter !== 'body');
            const hasAbout  = chapArr.some(c => c && c.about === true);
            if (hasMatter && !hasAbout) gaps.push('about');
            option.text = (gaps.length ? '\u25cb ' : '\u25cf ') +
                          bookTitlesMap[doc.id] + ` (${doc.id})` +
                          (gaps.length ? '  \u00b7 needs: ' + gaps.join(', ') : '');
            if (gaps.length) option.style.color = '#ffb74d';
            bookSelect.appendChild(option);
        });
        
        if (!selectFirst && previous &&
            Array.from(bookSelect.options).some(o => o.value === previous)) {
            bookSelect.value = previous;          // silent: no change event
        } else if (querySnapshot.size > 0) {
            bookSelect.selectedIndex = 1;
            bookSelect.dispatchEvent(new Event('change'));
        }

    } catch (e) { bookSelect.innerHTML = "<option>Error</option>"; }
}

bookSelect.onchange = () => {
    stagingArea.classList.add('hidden'); 
    clearAuditResults();
    // The form is about a different book now; last book's save message is not.
    clearSaveTitleStatus();
    
    // Toggle UI Containers
    if (bookSelect.value === "__NEW__") {
        createNewUI.classList.remove('hidden');
        editExistingUI.classList.add('hidden');

        // ⚠️ new-book-author WAS MISSING FROM THIS RESET. It has been auto-filled
        // from <dc:creator> since v3.14.0, so leaving it behind meant the previous
        // book's author sat in the form for the next one.
        newBookId.value = "";
        newBookTitle.value = "";
        newEpubFile.value = "";
        const a = document.getElementById('new-book-author');
        if (a) a.value = "";
        const af = document.getElementById('autofill-status');
        if (af) af.textContent = "";
    } else {
        createNewUI.classList.add('hidden');
        editExistingUI.classList.remove('hidden');
        
        activeBookId = bookSelect.value;
        activeBookTitle.value = bookTitlesMap[activeBookId] || activeBookId;
    }
};

// --- LOAD FROM DB ---
// ⚠️ RE-ENTRANCY GUARD. THIS IS WHAT SCRAMBLED TOM SAWYER ABROAD. (v3.18.0)
//
// Loading a book is one sequential round trip per chapter — thirteen for Tom
// Sawyer Abroad, 284 for Aesop — so there is ample time to click the button
// again while the first load is still running. Both handlers then reset
// `stagedChapters = []` and push into the SAME array as their awaits resolve,
// so the second reset discards whatever the first had collected and the two
// loops interleave from wherever each had got to.
//
// The observed order was 4, 5, 1, 6, 2, 7, 3, 8 — which is not random, it is
// (4,5,6,7,8) interleaved with (1,2,3): one run continuing while another started
// over. The stored array was perfectly sequential the whole time.
//
// Third instance of this bug class in the project, after game.js flushAll() and
// learn.js flushStats(). ⚠️ ANY async handler that resets shared module state
// before its first await needs one of these. Look for `x = []` or `x = {}` at the
// top of an async function and check what happens if it runs twice.
let _openInFlight = false;

// ─── The inline save message had no way to go away (v3.18.3) ─────────────────
//
// `save-title-status` was written in exactly ONE place — saveTitleBtn.onclick —
// and cleared in NONE. Not on book change, not on Open Book, not on an EPUB
// parse, not after Upload All. So a green "✓ Saved at 10:41:54 · genre: Horror ·
// ages 14–18 · cover saved" from one book sat next to the NEXT book's form
// indefinitely, and when that book's cover upload failed the screen showed a red
// failure at the top and a green success beside the button, describing two
// different books.
//
// Nothing was lying: the message was accurate about the book it was written for.
// But §B.9's lesson has a mirror image — a success reported about the wrong
// SUBJECT is as misleading as a failure reported in the wrong PLACE, and this one
// cost real trust in a message that was telling the truth. Any handler that
// changes which book the form is about clears it.
function clearSaveTitleStatus() {
    const el = document.getElementById('save-title-status');
    if (el) { el.textContent = ''; el.style.color = '#888'; }
}

openBookBtn.onclick = async () => {
    if(!activeBookId) return;
    if (_openInFlight) {
        statusEl.innerText = "Already loading \u2014 hang on.";
        statusEl.style.borderColor = "#ffaa00";
        return;
    }
    _openInFlight = true;
    openBookBtn.disabled = true;
    openBookBtn.style.opacity = '0.6';
    statusEl.innerText = `Loading ${activeBookId}...`;
    chapterListEl.innerHTML = "Loading...";
    stagedChapters = [];
    stagedFromDB = true;   // loaded from Firestore — fixes should write straight back
    stagedCoverBlob = null; stagedCoverUrl = null; stagedCoverType = '';
    clearSaveTitleStatus();

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

            // Book tags (v3.7.0). Number inputs want '' not '0' for absent —
            // a book tagged for age 0 is not a thing, but `meta.minAge || ''`
            // would also blank a legitimate 0, so test for null/undefined.
            const minAgeIn = document.getElementById('active-book-minage');
            const maxAgeIn = document.getElementById('active-book-maxage');
            const protSel  = document.getElementById('active-book-protagonist');
            if (minAgeIn) minAgeIn.value = (meta.minAge ?? '') === '' ? '' : String(meta.minAge);
            if (maxAgeIn) maxAgeIn.value = (meta.maxAge ?? '') === '' ? '' : String(meta.maxAge);
            if (protSel)  protSel.value  = meta.protagonistGender || "";
            const cleanIn = document.getElementById('active-book-cleanedby');
            if (cleanIn) cleanIn.value = meta.cleanedBy || "";
            // Attribution (v3.20.0). Plain || is correct here — these are strings
            // and '' is exactly what an untagged book should show.
            writeSelectOrCustom('active-book-source', meta.source);
            writeSelectOrCustom('active-book-rights', meta.rights);
            const arcIn = document.getElementById('active-book-archive');
            if (arcIn) arcIn.value = meta.archiveUrl || "";
            const orgIn = document.getElementById('active-book-origin');
            if (orgIn) orgIn.value = meta.originUrl || "";
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
                        // ⚠️ RESTORED, NOT DEFAULTED (v3.21.0). This push never
                        // carried `matter`, so opening a book and re-uploading it
                        // silently reset every front and back matter document to
                        // 'body' — the classification was only ever correct on the
                        // FIRST import. Which also means the About flag would have
                        // evaporated on the second. Both come back from the stored
                        // chapter list; a pre-v3.19.1 document has neither, and
                        // falls back exactly as before.
                        matter: chapters[i].matter || 'body',
                        about: chapters[i].about === true,
                        srcFile: chapters[i].srcFile || '',
                        segments: contentSnap.data().segments || []
                    });
                }
            }
        }
        // Order is load-bearing — see sortStagedChapters(). Say so when it fires,
        // because a book that needed sorting on load is a book whose stored array
        // and rendered list disagreed, and that is worth knowing about.
        const wasUnsorted = sortStagedChapters();
        renderChapterList();
        stagingArea.classList.remove('hidden');
        overwriteSection.classList.remove('hidden');
        statusEl.innerText = wasUnsorted
            ? "Loaded \u2014 chapters arrived out of order and were sorted. " +
              "Your data is unchanged; Del/Merge/Split are now safe to use."
            : "Loaded.";
        statusEl.style.borderColor = "#00ff41";
        
        // Auto-audit for character and language issues
        runAudit();
    } catch(e) { statusEl.innerText = "Error: " + e.message; }
    finally {
        // Released in a finally so a failed load cannot leave the button dead.
        _openInFlight = false;
        openBookBtn.disabled = false;
        openBookBtn.style.opacity = '1';
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// METADATA AUTO-FILL  (v3.14.0)
// ═════════════════════════════════════════════════════════════════════════════
//
// Every field the create form demanded is already in the EPUB. Book ID, title
// and author were all typed by hand for twenty books, and the author was ALREADY
// being extracted during parse — just too late to help, because the form
// wouldn't let you press the button without filling it in first.
//
// Verified across Jake's 20 test books: <dc:title> present in 20/20,
// <dc:creator> in 20/20, <dc:subject> in most. So: pick the file, everything
// fills in, correct what's wrong. Age range is the only field that genuinely
// cannot be derived and still needs a human.
function slugifyBookId(title) {
    return String(title || '')
        .toLowerCase()
        .replace(/[\u2018\u2019']/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/^(the|a|an)-/, '')   // "the-great-gatsby" -> "great-gatsby"
        .substring(0, 40);
}

// dc:subject is a loose vocabulary, so this maps keywords rather than exact
// strings, and it only ever SUGGESTS — the dropdown is still yours to change.
// Order matters: first match wins, so put the specific ahead of the general.
const SUBJECT_TO_GENRE = [
    [/\bfable|aesop\b/i,                    'Short Stories'],
    [/\bfairy tale|folklore|mytholog/i,      'Mythology'],
    [/\bdetective|murder|crime|mystery/i,    'Mystery'],
    [/\bghost|horror|gothic/i,               'Horror'],
    [/\bscience fiction\b/i,                 'Science Fiction'],
    [/\bfantas|magic\b/i,                    'Fantasy'],
    [/\badventure|voyages|survival/i,        'Adventure'],
    [/\bhumor|humour|satire/i,               'Humor'],
    [/\bwestern\b/i,                         'Western'],
    [/\bpoetry|poems\b/i,                    'Poetry'],
    [/\bautobiograph|biograph|slaves|history/i, 'Non-Fiction'],
    [/\bromance|courtship|love stories/i,    'Romance'],
    [/\bjuvenile|children/i,                 'Young Adult'],
    [/\bbildungsroman|classic/i,             'Classic Literature'],
];
function guessGenre(subjects) {
    const joined = (subjects || []).join(' ; ');
    for (const [rx, genre] of SUBJECT_TO_GENRE) if (rx.test(joined)) return genre;
    return '';
}

// Reads just the OPF. Cheap enough to run the instant a file is picked, and it
// touches nothing else — a failure here leaves the form exactly as it was.
async function readEpubMetadata(file) {
    const zip = await JSZip.loadAsync(file);
    const container = await zip.file('META-INF/container.xml')?.async('string');
    let opfPath = null;
    if (container) {
        const d = new DOMParser().parseFromString(container, 'text/xml');
        opfPath = d.querySelector('rootfile')?.getAttribute('full-path');
    }
    if (!opfPath) opfPath = Object.keys(zip.files).find(f => f.endsWith('.opf'));
    if (!opfPath) throw new Error('No OPF found.');
    const opf = new DOMParser().parseFromString(await zip.file(opfPath).async('string'), 'text/xml');
    const DC = 'http://purl.org/dc/elements/1.1/';
    const grab = tag => Array.from(opf.getElementsByTagNameNS(DC, tag))
                             .map(el => (el.textContent || '').trim()).filter(Boolean);
    const titles = grab('title');
    return {
        title: titles[0] || '',
        author: grab('creator')[0] || '',
        subjects: grab('subject'),
        language: grab('language')[0] || '',
        // ⚠️ ATTRIBUTION (v3.20.0). Public domain books need none of this, but a
        // Creative Commons licence REQUIRES credit, and the EPUB already carries
        // it: dc:rights holds the licence statement, dc:source and dc:publisher
        // say where the edition came from. Reading them here means the one legal
        // obligation attached to a CC book is filled in before Jake types
        // anything, rather than depending on him remembering.
        rights: grab('rights')[0] || '',
        source: grab('source')[0] || '',
        publisher: grab('publisher')[0] || '',
    };
}

// Fires the moment a file is chosen. Never overwrites something already typed:
// if you deliberately set an id, the file does not get to argue.
// Where your own copies of the source EPUBs live. Overridable at runtime by setting
// window.TTB_ARCHIVE_BASE so the base can move without a code change; this constant
// is only the fallback.
const ARCHIVE_BASE_DEFAULT =
    'https://github.com/misterwilson/typethatbook/raw/main/library';

async function autofillFromEpub(file) {
    const st = document.getElementById('autofill-status');
    const say = (m, c) => { if (st) { st.textContent = m; st.style.color = c || '#888'; }
                            else if (statusEl) statusEl.innerText = m; };
    if (!file) return;
    say('Reading metadata\u2026');
    try {
        const meta = await readEpubMetadata(file);
        const filled = [];
        if (meta.title && newBookTitle && !newBookTitle.value.trim()) {
            newBookTitle.value = meta.title; filled.push('title');
        }
        if (meta.title && newBookId && !newBookId.value.trim()) {
            newBookId.value = slugifyBookId(meta.title); filled.push('id');
        }
        const authorEl = document.getElementById('new-book-author');
        if (meta.author && authorEl && !authorEl.value.trim()) {
            authorEl.value = meta.author; filled.push('author');
        }
        const genre = guessGenre(meta.subjects);
        if (genre && genreSelect && !genreSelect.value) {
            const opt = Array.from(genreSelect.options).find(o => o.value === genre);
            if (opt) { genreSelect.value = genre; filled.push('genre (a guess)'); }
        }
        // ⚠️ Attribution, filled from the EPUB (v3.20.0). A Creative Commons book
        // carries a LEGAL OBLIGATION to credit, and it is the one field where
        // "I'll do it later" is not merely untidy. dc:rights is the licence
        // statement; dc:source then dc:publisher for where the edition came from.
        const rightsEl = document.getElementById('active-book-rights');
        const sourceEl = document.getElementById('active-book-source');
        if (meta.rights && rightsEl && !readSelectOrCustom('active-book-rights')) {
            writeSelectOrCustom('active-book-rights', meta.rights); filled.push('licence');
        }
        const src = meta.source || meta.publisher;
        if (src && sourceEl && !readSelectOrCustom('active-book-source')) {
            writeSelectOrCustom('active-book-source', src); filled.push('source');
        }
        // Say so out loud when a licence turned up, because it changes what has
        // to appear on the library card and it is easy to scroll past.
        if (meta.rights) {
            say('\u26a0 This EPUB declares a licence \u2014 filled into Licence/rights, and it ' +
                'will show on the library card. Do not clear it unless the book is public domain.',
                '#ffaa00');
        }
        // ── ARCHIVE URL from the picked file's own name (v3.24.0) ─────────────
        //
        // Jake asked for this and it went missing across a handoff. Archive URL is
        // "your copy of the EPUB this was built from", and in practice that is
        // always ARCHIVE_BASE + the exact filename sitting in the file picker —
        // which the browser has already handed us. Typing it by hand is both
        // tedious and the kind of thing that gets a character wrong once in forty
        // books and is never noticed, because nothing ever fetches the URL.
        //
        // ARCHIVE_BASE lives in settings/config so it can be changed without a code
        // edit; the constant below is only the fallback. Filled ONLY when the field
        // is empty, like everything else here.
        const archiveEl = document.getElementById('active-book-archive');
        if (file.name && archiveEl && !archiveEl.value.trim()) {
            const base = (window.TTB_ARCHIVE_BASE || ARCHIVE_BASE_DEFAULT).replace(/\/+$/, '');
            // encodeURIComponent, not raw: apostrophes and spaces are legal in a
            // filename and are not legal, unescaped, in a URL.
            archiveEl.value = base + '/' + encodeURIComponent(file.name);
            filled.push('archive URL');
        }

        say(filled.length
            ? '\u2713 Filled in ' + filled.join(', ') + '. Check it, then parse. ' +
              '(Age range still needs you.)'
            : 'Metadata read \u2014 nothing to fill, you had it all typed already.',
            '#00ff41');
    } catch (e) {
        // Non-fatal by design: the manual path still works exactly as before.
        say('Could not read metadata (' + e.message + ') \u2014 fill it in by hand.', '#ffaa00');
    }
}
if (newEpubFile) newEpubFile.addEventListener('change', e => autofillFromEpub(e.target.files[0]));

// --- CREATE NEW PARSE ---
createParseBtn.onclick = async () => {
    const file = newEpubFile.files[0];
    if (!file) return alert("Choose an EPUB file.");

    // ⚠️ ONLY THE FILE IS REQUIRED NOW. This used to demand id and title up front,
    // which is why the author extraction that already existed inside parseEpubFile
    // never saved anyone any typing — you had to type the metadata to earn the
    // right to press the button that read the metadata. If autofill has not run
    // (paste, drag-drop, or a browser that skipped the change event), do it now.
    if (!newBookId.value.trim() || !newBookTitle.value.trim()) {
        await autofillFromEpub(file);
    }
    const id = newBookId.value.trim();
    const title = newBookTitle.value.trim();
    if (!id || !title) return alert(
        "Could not read a title from that EPUB \u2014 fill in Book ID and Title by hand.");
    
    activeBookId = id;
    activeBookTitle.value = title;
    // ⚠️ CLEAR THE PREVIOUS BOOK'S TAGS FIRST (v3.23.0). autofillFromEpub() only
    // fills a field that is EMPTY — deliberately, so it cannot argue with something
    // typed by hand. But nothing cleared these between books, so importing a second
    // EPUB in the same session inherited the first one's genre, ages and protagonist
    // and the autofill politely declined to correct them. That is why the Flat
    // Edition came out tagged Adventure when its dc:subject says Humor: the value
    // was left over from the book before it. Only the NEW-book path clears; the
    // overwrite path must keep the stored metadata it is about to re-save.
    ['active-book-genre', 'active-book-protagonist', 'active-book-minage',
     'active-book-maxage', 'active-book-archive', 'active-book-cleanedby',
     'active-book-origin'].forEach(fid => {
        const el = document.getElementById(fid);
        if (el) el.value = '';
    });
    writeSelectOrCustom('active-book-source', '');
    writeSelectOrCustom('active-book-rights', '');
    const cgi = document.getElementById('custom-genre-input');
    if (cgi) { cgi.value = ''; cgi.classList.add('hidden'); }

    // ⚠️ RE-FILL AFTER THE CLEAR, NOT BEFORE IT (v3.24.0).
    //
    // The clear immediately above was correct and the ORDER around it was not.
    // autofillFromEpub() runs on the file input's `change` event, so by the time
    // Parse is clicked the fields are already populated — and then this block wipes
    // genre, ages, protagonist, source, licence, archive, cleanedby and origin. The
    // conditional call further up cannot save them: it only fires when the id or
    // title is blank, and autofill filled those on change too, so it is skipped in
    // exactly the case where it was needed.
    //
    // Net effect since v3.23.0: EVERY new-book import silently lost every field
    // except title, author and cover. Those three survive only because they live
    // outside the cleared set. It looks like "the importer never read the metadata",
    // which is the opposite of what happened — it read it, filled it, and then the
    // next click threw it away.
    //
    // Safe to call twice: autofill only ever writes into a field it finds EMPTY, and
    // everything it touches was just emptied. That is also why it must come after
    // the author pre-fill below is NOT true — author is handled separately and
    // deliberately, so this runs first and leaves a typed author alone.
    await autofillFromEpub(file);

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

// ─── Start another book ──────────────────────────────────────────────────────
//
// There was no way back to an empty form except reloading the page, which is a
// silly thing to make someone do after they have just finished a book — and
// reloading also throws away the book list and the sign-in round trip.
//
// ⚠️ CLEARS THE STAGING STATE TOO, NOT JUST THE VISIBLE FIELDS. Leaving
// stagedChapters populated behind a blank form is the setup for the worst
// possible bug here: parse book B, and an "Upload All" writes B's chapters under
// A's id. Everything the previous book touched is reset in one place, on purpose.
function resetCreateForm(announce) {
    stagedChapters = [];
    stagedFromDB = false;
    stagedBodyChapters = 0;
    importErrors = [];
    currentErrorIdx = 0;
    editingIndex = -1;
    activeBookId = "";

    if (stagedCoverUrl && stagedCoverUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(stagedCoverUrl); } catch (_) {}
    }
    stagedCoverBlob = null;
    stagedCoverUrl = null;
    stagedCoverType = '';
    clearSaveTitleStatus();
    updateCoverPreview();

    ['new-book-id', 'new-book-title', 'new-book-author', 'new-epub-file',
     'active-book-title', 'active-book-author',
     'active-book-archive', 'active-book-origin', 'active-book-cleanedby',
     'active-book-minage', 'active-book-maxage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['active-book-genre', 'active-book-protagonist'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    writeSelectOrCustom('active-book-source', '');
    writeSelectOrCustom('active-book-rights', '');
    if (customGenreInput) { customGenreInput.value = ''; customGenreInput.classList.add('hidden'); }

    const af = document.getElementById('autofill-status');
    if (af) af.textContent = '';
    if (chapterListEl) chapterListEl.innerHTML = '';
    if (stagingArea) stagingArea.classList.add('hidden');
    clearAuditResults();
    closeChapterEditor();

    if (announce) {
        statusEl.innerText = 'Cleared. Choose the next EPUB.';
        statusEl.style.borderColor = '#4B9CD3';
    }
    const f = document.getElementById('new-epub-file');
    if (f) f.focus();
}

const createResetBtn = document.getElementById('create-reset-btn');
if (createResetBtn) createResetBtn.onclick = () => {
    // Only warn when there is something to lose. Confirming a no-op is noise.
    if (stagedChapters.length && !stagedFromDB &&
        !confirm('Discard the ' + stagedChapters.length +
                 ' staged chapters that have not been uploaded?')) return;
    resetCreateForm(true);
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
//
// ⚠️ RE-ENTRANCY GUARD (v3.18.3). §B.9 states the rule and then this function
// was left out of it: "ANY async handler that resets shared module state before
// its first await needs one of these. Look for `x = []` or `x = {}` at the top of
// an async function." This opens with `stagedChapters = []` and `importErrors =
// []`, is reachable from TWO separate file inputs, and nulls stagedCoverBlob
// several awaits in — so two overlapping parses interleave stagedChapters exactly
// like Open Book did (4,5,1,6,2,7,3,8), and the later run can null out the
// earlier one's extracted cover after it was already staged.
//
// DROPPED, not queued — the opposite of flushAll(). A second flush carries work
// that must not be lost; a second parse of a file picker is a double-click, and
// running it twice has no value at all. A big EPUB takes seconds to unzip, which
// is exactly long enough to click again.
let _parseInFlight = false;

async function parseEpubFile(file) {
    if (_parseInFlight) {
        statusEl.innerText = "Already parsing an EPUB \u2014 hang on.";
        statusEl.style.borderColor = "#ffaa00";
        return;
    }
    if (!file) {
        statusEl.innerText = "No EPUB file selected.";
        statusEl.style.borderColor = "#ffaa00";
        return;
    }
    _parseInFlight = true;
    statusEl.innerText = "Parsing...";
    chapterListEl.innerHTML = "Parsing...";
    stagedChapters = [];
    stagedFromDB = false;  // local file; nothing in Firestore to write back to yet
    importErrors = [];
    // This parse is about to replace the form's contents, so the previous book's
    // save message must not survive it.
    clearSaveTitleStatus();

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

        // ─── EXTRACT COVER IMAGE FROM EPUB (rewritten v3.18.3) ───────────────
        //
        // Three things were wrong here beyond the content type:
        //
        //  1. Methods 1 and 2 did not check the media type. Standard Ebooks
        //     points `properties="cover-image"` at `images/cover.svg` — a WRAPPER
        //     whose only content is an <image> referencing the real raster. An
        //     SVG inside an <img> tag runs in secure static mode and cannot load
        //     external resources, so uploading that wrapper yields a cover that
        //     is blank everywhere, forever, with no error anywhere.
        //  2. A zip miss was `if (coverFile)` with no else: no cover, no warning,
        //     no console line, nothing.
        //  3. The one status message it did write ("Cover image extracted") was
        //     overwritten unconditionally by the end-of-parse summary, and that
        //     summary never mentioned the cover either way. §B.9's own rule — a
        //     multi-step operation must name every step or it will eventually
        //     lie — was never applied to the parse.
        //
        // coverNote is reported in the final summary, whatever happened.
        stagedCoverBlob = null; stagedCoverUrl = null; stagedCoverType = '';
        let coverNote = 'NO COVER FOUND IN EPUB';
        {
            const items = Array.from(manifest.getElementsByTagName("item"));
            const hrefOf = it => it && it.getAttribute("href");
            const mtOf   = it => (it && it.getAttribute("media-type")) || "";
            const isRaster = it => mtOf(it).startsWith("image/")
                                && mtOf(it) !== "image/svg+xml";
            const toPath = href => (basePath === "")
                ? href : resolvePath(basePath + "dummy", href);

            let coverItem = null;
            let coverPathOverride = null;
            // The media-type to compare the sniffed bytes against. Tracked apart
            // from coverItem because an SVG-wrapper swap deliberately changes
            // which FILE we take, so the wrapper's own type is no longer the
            // relevant declaration and comparing against it cries mismatch on a
            // swap that worked exactly as intended.
            let coverDeclaredType = '';
            let coverVia = '';

            // Method 1: <meta name="cover" content="imageId">. Now type-checked —
            // some books point this at the cover XHTML page, not the image.
            const metas = opfDoc.querySelectorAll('meta[name="cover"]');
            if (metas.length > 0) {
                const coverId = metas[0].getAttribute("content");
                const byId = items.find(i => i.getAttribute("id") === coverId);
                if (byId && mtOf(byId).startsWith("image/")) coverItem = byId;
            }
            // Method 2: properties="cover-image", the EPUB 3 way. Also type-checked.
            if (!coverItem) {
                coverItem = items.find(i =>
                    (i.getAttribute("properties") || "").includes("cover-image")
                    && mtOf(i).startsWith("image/")) || null;
            }
            // Method 3: id or href mentions "cover" and it is an image.
            if (!coverItem) {
                coverItem = items.find(i => {
                    const id = (i.getAttribute("id") || "").toLowerCase();
                    const hr = (hrefOf(i) || "").toLowerCase();
                    return (id.includes("cover") || hr.includes("cover"))
                        && mtOf(i).startsWith("image/");
                }) || null;
            }

            // ⚠️ PREFER A RASTER. If the declared cover is an SVG, the raster it
            // wraps is what we actually want. Read the wrapper's own href first —
            // it names the file — and only then fall back to guessing at a
            // cover-ish raster in the manifest.
            if (coverItem && mtOf(coverItem) === "image/svg+xml") {
                const svgHref = hrefOf(coverItem);
                const svgPath = toPath(svgHref);
                let swapped = null;
                try {
                    const svgFile = zipEntry(zip, svgPath);
                    if (svgFile) {
                        const svgDoc = parser.parseFromString(
                            await svgFile.async("string"), "image/svg+xml");
                        const inner = svgDoc.querySelector('image');
                        const innerHref = inner && (
                            inner.getAttribute('href') ||
                            inner.getAttributeNS('http://www.w3.org/1999/xlink', 'href'));
                        if (innerHref) {
                            // Relative to the SVG, not to the OPF.
                            const rasterPath = resolvePath(svgPath, innerHref);
                            if (zipEntry(zip, rasterPath)) swapped = rasterPath;
                        }
                    }
                } catch (e) { console.warn("SVG cover wrapper unreadable:", e); }

                if (!swapped) {
                    const alt = items.find(i => isRaster(i) &&
                        ((i.getAttribute("id") || "") + (hrefOf(i) || ""))
                            .toLowerCase().includes("cover"));
                    if (alt) swapped = toPath(hrefOf(alt));
                }

                if (swapped) {
                    coverPathOverride = swapped;
                    coverVia = ' \u00b7 raster from inside the SVG wrapper';
                    const swappedItem = items.find(i => toPath(hrefOf(i)) === swapped);
                    coverDeclaredType = swappedItem ? mtOf(swappedItem) : '';
                } else {
                    // Keep the SVG rather than nothing, but say so loudly: it will
                    // very likely render blank, and that is worth knowing NOW.
                    coverPathOverride = svgPath;
                    coverDeclaredType = mtOf(coverItem);
                    importErrors.push({ type: 'cover',
                        msg: 'Cover is an SVG wrapper and no raster was found inside ' +
                             'it. It will probably render blank — replace it with the ' +
                             'Choose File picker.' });
                }
            } else if (coverItem) {
                coverPathOverride = toPath(hrefOf(coverItem));
                coverDeclaredType = mtOf(coverItem);
            }

            if (coverPathOverride) {
                const coverPath = coverPathOverride;
                try {
                    const coverFile = zipEntry(zip, coverPath);
                    if (!coverFile) {
                        // Was silent. Now it is a sentence on screen naming the file.
                        coverNote = 'COVER MISSING FROM EPUB (' + coverPath + ')';
                        console.warn('Cover declared in the manifest but absent from ' +
                                     'the zip:', coverPath);
                    } else {
                        // arraybuffer, not blob: JSZip's blob has an empty type, and
                        // the whole bug was that nothing ever put one back.
                        const buf = await coverFile.async("arraybuffer");
                        const declared = coverDeclaredType;
                        const sniffed = sniffImageType(buf);
                        const type = sniffed || declared || '';
                        if (!type.startsWith('image/')) {
                            coverNote = 'COVER TYPE UNKNOWN — not uploaded (' + coverPath + ')';
                            console.warn('Cover bytes were not a recognised image and ' +
                                         'the manifest declared "' + declared + '":', coverPath);
                        } else {
                            stagedCoverType = type;
                            stagedCoverBlob = new Blob([buf], { type });
                            stagedCoverUrl = URL.createObjectURL(stagedCoverBlob);
                            updateCoverPreview();
                            // Three outcomes worth telling apart, because they need
                            // different responses:
                            //   · bytes recognised, manifest agrees → nothing to say
                            //   · bytes recognised, manifest disagrees → we trust the
                            //     bytes, but a book whose manifest lies is worth a look
                            //   · bytes NOT recognised → we are taking the manifest's
                            //     word. Deliberately not a refusal: it could be a real
                            //     format this sniffer predates (JPEG XL, JP2, TIFF).
                            //     But it could equally be a corrupt file that uploads
                            //     "successfully" and renders as a broken image, so it
                            //     must not pass silently. Check the preview.
                            const note = !sniffed
                                ? ' ⚠ UNVERIFIED — bytes unrecognised, type taken from ' +
                                  'the manifest. Check the preview actually shows art.'
                                : (declared && declared !== sniffed
                                    ? ' ⚠ manifest said ' + declared : '');
                            coverNote = 'cover: ' + coverPath.split('/').pop() +
                                        ' (' + type + ')' + coverVia + note;
                        }
                    }
                } catch(e) {
                    coverNote = 'COVER EXTRACTION FAILED (' + e.message + ')';
                    console.warn("Cover extraction failed:", e);
                }
            }
        }

        // Read the table of contents once. Failure here is non-fatal — we just
        // fall back to the container heuristic, which is what v3.9.0 did.
        let tocIndex = {};
        try {
            const navRef = findNavHref(opfDoc);
            if (navRef && navRef.href) {
                const navPath = (basePath === "") ? navRef.href : basePath + navRef.href;
                const navFile = zipEntry(zip, navPath);
                if (navFile) {
                    const navDoc = parser.parseFromString(
                        await navFile.async("string"), "application/xhtml+xml");
                    tocIndex = buildTocIndex(navDoc, navRef.kind);
                }
            }
        } catch (e) { console.warn("TOC unreadable, falling back to structure:", e); }

        const spineItems = Array.from(spine.getElementsByTagName("itemref"));
        let counter = 1;
        let splitFiles = 0, splitUnits = 0, skippedBoiler = 0;
        let viaToc = 0, viaStructure = 0;
        // ⚠️ PARAGRAPH RECONCILIATION (v3.12.0). Count every <p> the document has
        // after boilerplate removal, and count every <p> the grouping actually
        // handed to a chapter. If those two numbers disagree, the importer lost
        // text — and BEFORE this existed, it could do that in complete silence.
        // Reported unconditionally at the end of the parse.
        let pSeen = 0, pGrouped = 0, orphansRescued = 0;
        let matterFront = 0, matterBack = 0, titleSegmentsRemoved = 0;
        // Spine files named by the manifest but absent from the zip. Each one is
        // a chapter that will not exist, so this is reported in red, not amber.
        const missingSpineFiles = [];
        // Set once the first body chapter is emitted. See the front/back note below.
        let seenBodyMatter = false;
        // Fix C needs the book's own title and author to recognise a title page.
        // Read off the OPF that is already parsed — no second zip load.
        const DC_NS = 'http://purl.org/dc/elements/1.1/';
        const dcFirst = tag => {
            const els = opfDoc.getElementsByTagNameNS(DC_NS, tag);
            return (els && els[0] && (els[0].textContent || '').trim()) || '';
        };
        const bookMetaTitle = dcFirst('title');
        const bookMetaAuthor = dcFirst('creator');
        // Flipped by the first body unit that is NOT leading matter.
        let seenRealChapter = false;

        for (let item of spineItems) {
            const href = idToHref[item.getAttribute("idref")];
            if (!href) continue;

            // ⚠️ WAS `zip.file(fullPath).async(...)`, WHICH THREW ON NULL and
            // killed the entire import with a TypeError that named no file.
            // Encoded hrefs (a space or accent in a filename) are the common
            // cause — see zipEntry(). A file we genuinely cannot find is a LOST
            // CHAPTER, so it is counted, named on screen, and the rest of the
            // book still imports: partial-and-labelled beats nothing at all.
            const fullPath = (basePath === "") ? href : basePath + href;
            const spineFile = zipEntry(zip, fullPath);
            if (!spineFile) {
                missingSpineFiles.push(fullPath);
                importErrors.push({ type: 'spine',
                    msg: 'Spine file listed in the manifest but not present in the ' +
                         'EPUB: ' + fullPath + ' — its chapter is MISSING.' });
                console.warn('Spine file missing from zip:', fullPath);
                continue;
            }
            const content = await spineFile.async("string");
            const doc = parser.parseFromString(content, "application/xhtml+xml");

            // Gutenberg licence and machine-header regions. Not the book.
            skippedBoiler += stripBoilerplate(doc);

            // One spine file is USUALLY one chapter, but not always. Ask the
            // book's own TOC first; fall back to the container heuristic; fall
            // back to the whole file.
            pSeen += doc.body.querySelectorAll('p').length;

            const fileKey = href.split('/').pop();

            // What IS this file? Front matter must not consume chapter numbers.
            const kind = classifyDocument(doc, fileKey);
            // ⚠️ FRONT MATTER CANNOT FOLLOW BODY MATTER (v3.18.4).
            //
            // Toby Tyler's last spine file — the Gutenberg licence, zero
            // paragraphs, no heading, no keyword in its name — classified as
            // 'front', which gave it id 0.2 and therefore SORTED IT TO POSITION 2
            // OF THE BOOK. A file that appears after the story has started is not
            // front matter by definition, whatever its shape looks like.
            //
            // Verified against all eight of Jake's books: this fires exactly once,
            // on the one file that had the bug, and moves no body chapter's id on
            // any book — so no student's stored chapter pointer moves.
            if (kind.cls === 'front' && seenBodyMatter) kind.cls = 'back';
            // A part divider (part-1.xhtml) is bodymatter with a heading and no
            // paragraphs, so it produces zero segments and falls out below with no
            // special case. Its NUMBER is what matters and that lives in the
            // chapter filenames.
            if (kind.cls === 'front') matterFront++;
            else if (kind.cls === 'back') matterBack++;

            let units = chapterUnitsFromToc(doc, tocIndex[fileKey]);
            if (units) { viaToc++; orphansRescued += (units.orphanCount || 0); }
            else { units = findChapterUnits(doc); if (units) viaStructure++; }
            if (units) { splitFiles++; splitUnits += units.length; }

            let groups;
            if (units) {
                // Split file: each unit has its own heading. Re-read it with the
                // richer extractor so an <hgroup> title is found and its <p> can
                // be excluded from the prose.
                groups = units.map(u => {
                    const info = headingInfoOf(u.root || doc.body);
                    return { title: u.title || info.title || info.ordinal,
                             info, pEls: u.pEls };
                });
            } else {
                const info = headingInfoOf(doc.body);
                groups = [{ title: '', info,
                            pEls: Array.from(doc.body.querySelectorAll('p')) }];
            }

            // ⚠️ THE TITLE IS NOT PROSE. Standard Ebooks puts a chapter's name in
            // a <p epub:type="title">, so querySelectorAll('p') collected it as
            // segment zero and students typed the chapter title as the first line
            // of the chapter. Excise those elements from every group.
            for (const g of groups) {
                const drop = (g.info && g.info.titleEls) || [];
                if (!drop.length) continue;
                const before = g.pEls.length;
                g.pEls = g.pEls.filter(el => drop.indexOf(el) === -1);
                titleSegmentsRemoved += (before - g.pEls.length);
            }

          for (const group of groups) {
            // textContent, NOT innerText — innerText is layout-dependent and
            // returns undefined on a DOMParser document in Firefox, which would
            // make .trim() throw and kill the whole import.
            // Real name first; bare ordinal only when the book has no chapter
            // names at all (Pride and Prejudice, Gatsby). The number already
            // lives in the id, so repeating it in the title earns nothing.
            const title = (group.title && group.title.trim())
                ? cleanChapterTitle(group.title).substring(0, 60)
                : composeChapterTitle(group.info, counter);
            // A generic "Chapter N" on something that is not a chapter gets a
            // name that is actually true. Never touches a real title.
            // ── FIX C: per-unit reclassification (v3.18.5) ──
            let unitCls = kind.cls;
            if (unitCls === 'body' && !seenRealChapter) {
                if (looksLikeLeadingMatter(title, bookMetaTitle, bookMetaAuthor,
                                           group.pEls ? group.pEls.length : 0)) {
                    unitCls = 'front';
                } else {
                    seenRealChapter = true;
                }
            }
            const honestTitle = (unitCls !== 'body' && /^Chapter \d+$/.test(title))
                ? matterTitleFrom(fileKey, unitCls,
                                  unitCls === 'back' ? matterBack : matterFront)
                : title;

            const segments = [];
            const pTags = group.pEls;
            pGrouped += pTags.length;
            
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
                    id: counter,          // replaced by assignChapterIds() below
                    title: honestTitle,
                    matter: unitCls,      // 'front' | 'body' | 'back'
                    matterWhy: kind.why,
                    // Credits, not chapters. See detectAbout().
                    about: detectAbout(doc, fileKey, unitCls),
                    srcFile: fileKey,     // assignChapterIds() reads the part from this
                    segments: segments
                });
                counter++;
                // Load-bearing for the front-after-body rule above.
                if (unitCls === 'body') seenBodyMatter = true;
            }
          }
        }
        
        // Numbering happens AFTER the whole spine is read, because it depends on
        // each chapter's class and front matter must not consume chapter numbers.
        const numbering = assignChapterIds(stagedChapters);
        stagedBodyChapters = numbering.bodyChapters;
        // Ids were assigned in array order, so this is normally a no-op. It is here
        // so that there is exactly one place where "the array is in chapter order"
        // becomes true, rather than two paths that each have to remember.
        sortStagedChapters();

        if (importErrors.length > 0) {
            currentErrorIdx = 0;
            showErrorWizard();
        } else {
            renderChapterList();
            // Scan for language issues
            const approved = activeBookId ? getApprovedWords(activeBookId) : [];
            const langIssues = scanForLanguageIssues(stagedChapters, approved);
            // Say when a file was split, and into how many. 284 chapters appearing
            // from a 7-item spine looks like a bug unless the importer explains
            // itself — and if the split is WRONG, this is where you notice.
            // Name the strategy. If a split is ever wrong, the first useful
            // question is which route produced it.
            const how = viaToc && viaStructure ? 'table of contents + structure'
                      : viaToc ? 'table of contents' : 'structure';
            const splitNote = (splitFiles
                ? ` (split ${splitFiles} file${splitFiles === 1 ? '' : 's'} into ${splitUnits} sections via ${how})`
                : '') + (skippedBoiler ? ` · removed ${skippedBoiler} boilerplate block${skippedBoiler === 1 ? '' : 's'}` : '')
                + (orphansRescued ? ` · kept ${orphansRescued} paragraph${orphansRescued === 1 ? '' : 's'} that sat outside the table of contents` : '')
                + ` · ${numbering.bodyChapters} chapter${numbering.bodyChapters === 1 ? '' : 's'}`
                + (numbering.parts ? ` in ${numbering.parts} parts` : '')
                + (matterFront ? `, ${matterFront} front matter` : '')
                + (matterBack ? `, ${matterBack} back matter` : '')
                + (titleSegmentsRemoved ? ` · removed ${titleSegmentsRemoved} chapter title${titleSegmentsRemoved === 1 ? '' : 's'} from the text students type` : '');
            // The reconciliation. A shortfall means the grouping dropped text and
            // is the single most important thing on this screen — say it loudly
            // and say what to do. An excess means a <p> was counted twice, which
            // is odd but not lossy.
            // ⚠ Subtract the title elements we removed ON PURPOSE, or the
            // reconciliation reports its own fix as data loss and warns in amber
            // on every single import.
            const pDelta = pSeen - pGrouped - titleSegmentsRemoved;
            const pNote = pDelta > 0
                ? ` ⚠ ${pDelta} paragraph${pDelta === 1 ? '' : 's'} in the EPUB did not reach any chapter — check the chapter list before uploading.`
                : (pDelta < 0 ? ` (note: ${-pDelta} paragraph${pDelta === -1 ? '' : 's'} counted more than once)` : '');
            // ⚠️ THE COVER IS NAMED HERE, ALWAYS. (v3.18.3) The old summary
            // reported chapters, splits, reconciliation and language warnings and
            // said NOTHING about the cover, in either direction — so a cover that
            // silently failed to extract looked exactly like one that worked. Same
            // rule as §B.9: a multi-step operation names every step, or it lies.
            const coverBad = !stagedCoverBlob;
            const coverMsg = ` · ${coverNote}`;
            // A spine file named by the manifest and absent from the zip is a
            // missing chapter. Nothing else on this screen outranks that.
            const missNote = missingSpineFiles.length
                ? ` ⛔ ${missingSpineFiles.length} spine file${missingSpineFiles.length === 1 ? '' : 's'} MISSING from the EPUB (${missingSpineFiles.slice(0, 3).join(', ')}${missingSpineFiles.length > 3 ? ', …' : ''}) — those chapters do not exist. Do not upload until you know why.`
                : '';
            if (langIssues.length > 0) {
                showLanguageWarnings(langIssues, false);
                statusEl.innerText = `Parsed ${stagedChapters.length} chapters${splitNote}.${pNote}${coverMsg} ⚠️ ${langIssues.length} language warning(s).${missNote}`;
                statusEl.style.borderColor = missingSpineFiles.length ? "#ff3333" : "#ffaa00";
            } else {
                statusEl.innerText = `${missingSpineFiles.length ? '⛔' : (pDelta > 0 || coverBad ? '⚠️' : '✅')} Parsed ${stagedChapters.length} chapters${splitNote}.${pNote}${coverMsg} No character issues or language warnings found.${missNote}`;
                statusEl.style.borderColor = missingSpineFiles.length ? "#ff3333"
                    : ((pDelta > 0 || coverBad) ? "#ffaa00" : "#00ff41");
            }
        }

    } catch (e) {
        console.error(e);
        statusEl.innerText = "Parse Error: " + e.message;
        statusEl.style.borderColor = "#ff3333";
    } finally {
        // In a finally, matching openBookBtn: a parse that throws must not leave
        // the importer permanently refusing to run.
        _parseInFlight = false;
    }
}

// ─── Multi-work spine files (v3.9.0) ─────────────────────────────────────────
//
// The importer's founding assumption was "one spine file, one chapter". That
// holds for novels and breaks for COLLECTIONS. Standard Ebooks — the source of
// most of this library — puts every short work of a collection in a single XHTML
// file as sibling <article> or <section> elements, each with its own heading.
// Aesop's Fables is 284 fables in one 238KB file. Under the old rule that
// imported as ONE chapter with 284 titles run together into the prose.
//
// Returns an array of { title, pEls } to treat as chapters, or null to keep the
// old whole-file behaviour. Strategy 2 of 2 — see chapterUnitsFromToc() first.
//
// Rules, and why each one is there:
//
//   1. A unit must have BOTH a heading and a <p>. A wrapper with a heading and no
//      prose is a part divider, not a chapter; a <section> of pure markup is
//      neither.
//   2. Only LEAVES count — a unit containing another candidate unit is a
//      container, not a chapter. This is what makes a parts-and-chapters book
//      split into its chapters rather than its three parts.
//   3. Two or more, or no split. A single <article> wrapping a whole chapter is
//      the normal case and must go down the untouched path.
//
// Novels are therefore unaffected: one heading per file yields at most one
// candidate, rule 3 declines, and the original code runs byte-for-byte.
function findChapterUnits(doc) {
    if (!doc || !doc.body) return null;
    const UNIT = 'article, section';
    const HEADING = 'h1, h2, h3, h4, h5, h6';

    const candidates = Array.from(doc.body.querySelectorAll(UNIT))
        .filter(el => el.querySelector(HEADING) && el.querySelector('p'));
    if (candidates.length < 2) return null;

    const candidateSet = new Set(candidates);
    const leaves = candidates.filter(el =>
        !Array.from(el.querySelectorAll(UNIT)).some(d => candidateSet.has(d)));

    if (leaves.length < 2) return null;
    return leaves.map(el => ({
        title: headingTextOf(el),
        pEls: Array.from(el.querySelectorAll('p'))
    }));
}

// ─── Strategy 1: ask the book (v3.11.0) ───────────────────────────────────
//
// v3.9.0 split on <article>/<section> containers, which is how Standard Ebooks
// marks up a collection. Project Gutenberg uses none — Toby Tyler is 20
// chapters as bare <h2> headings in two 150KB files, and the container
// heuristic declines, so the whole thing imported as two enormous chapters.
//
// Rather than bolt on a second heuristic (split at headings) and inherit its
// false positives — a chapter with subheadings would shatter — read the
// table of contents. The book states where its chapters begin and what they
// are called. That is not a guess.
//
// ⚠️ This runs BEFORE findChapterUnits(). Verified on Aesop's Fables: the TOC
// route produces the identical 284 chapters the container route did, because
// SE's TOC anchors point at exactly those <article> elements. If you change
// the order of these strategies, re-check that number.

// Locates the navigation document: EPUB3 properties="nav", else the EPUB2 NCX.
function findNavHref(opfDoc) {
    const items = Array.from(opfDoc.getElementsByTagName('item'));
    const nav = items.find(i => (i.getAttribute('properties') || '').split(/\s+/).includes('nav'));
    if (nav) return { href: nav.getAttribute('href'), kind: 'nav' };
    const spine = opfDoc.getElementsByTagName('spine')[0];
    const tocId = spine && spine.getAttribute('toc');
    if (tocId) {
        const ncx = items.find(i => i.getAttribute('id') === tocId);
        if (ncx) return { href: ncx.getAttribute('href'), kind: 'ncx' };
    }
    const anyNcx = items.find(i => (i.getAttribute('href') || '').endsWith('.ncx'));
    return anyNcx ? { href: anyNcx.getAttribute('href'), kind: 'ncx' } : null;
}

// filename -> [{ frag, label }] in TOC order. Entries without a #fragment are
// skipped: they address a whole file, which tells us nothing about splitting it.
function buildTocIndex(navDoc, kind) {
    const map = {};
    const add = (href, label) => {
        if (!href || href.indexOf('#') < 0) return;
        const parts = href.split('#');
        const file = parts[0].split('/').pop();
        (map[file] = map[file] || []).push({
            frag: parts[1],
            label: (label || '').replace(/\s+/g, ' ').trim()
        });
    };
    if (kind === 'ncx') {
        Array.from(navDoc.getElementsByTagName('navPoint')).forEach(np => {
            const c = np.getElementsByTagName('content')[0];
            const t = np.getElementsByTagName('text')[0];
            if (c) add(c.getAttribute('src'), t && t.textContent);
        });
    } else {
        Array.from(navDoc.getElementsByTagName('a')).forEach(el =>
            add(el.getAttribute('href'), el.textContent));
    }
    return map;
}

// ONE document-order pass handles both shapes. When the anchor is a container
// (Standard Ebooks) its paragraphs are inside it; when the anchor is a bare
// heading (Gutenberg) its paragraphs are siblings that follow. Walking the
// document and assigning each <p> to the most recent anchor seen is correct
// either way, which is why there is one implementation and not two.
function chapterUnitsFromToc(doc, anchors) {
    if (!doc || !doc.body || !anchors || anchors.length < 2) return null;

    const byEl = new Map();
    const ordered = [];
    for (const a of anchors) {
        let el = null;
        try { el = doc.getElementById(a.frag); } catch (e) { /* malformed id */ }
        if (!el || byEl.has(el)) continue;
        const unit = { title: a.label || headingTextOf(el), pEls: [] };
        byEl.set(el, unit);
        ordered.push(unit);
    }
    if (ordered.length < 2) return null;

    // ⚠️ v3.12.0 — THIS LOOP USED TO LOSE TEXT, SILENTLY.
    //
    // `current` starts null, so every <p> encountered BEFORE the first TOC
    // anchor was skipped and never reached any chapter. Content between anchors
    // was always fine (it attaches to the preceding unit — merged, not lost) and
    // content after the last anchor was fine too. The single loss case was the
    // run-up to the first anchor: a dedication, an epigraph, a Gutenberg
    // transcriber's note sharing a file with chapter one.
    //
    // Two rules now, and neither can lose a paragraph:
    //
    //   ORPHANS ARE KEPT, not dropped. Anything before the first anchor is
    //   prepended to the first unit. It might land in the wrong chapter — but a
    //   stray paragraph at the top of chapter one is VISIBLE in the staging list
    //   and deletable in two clicks, whereas a missing one is invisible forever.
    //   Wrong-and-visible beats absent-and-silent every time.
    //
    //   IF MOST OF THE FILE IS ORPHANED, THE TOC IS NOT A MAP OF THIS FILE.
    //   Bail out and let findChapterUnits() or the whole-file path handle it,
    //   both of which keep everything by construction. A table of contents that
    //   accounts for less than half a document is describing something else.
    let current = null;
    let orphans = [];
    let totalP = 0;
    const walk = doc.body.getElementsByTagName('*');
    for (let i = 0; i < walk.length; i++) {
        const el = walk[i];
        if (byEl.has(el)) { current = byEl.get(el); continue; }
        if (!el.tagName || el.tagName.toLowerCase() !== 'p') continue;
        totalP++;
        if (current) current.pEls.push(el);
        else orphans.push(el);
    }

    if (totalP > 0 && orphans.length > totalP / 2) {
        console.warn('TOC accounts for less than half of this file (' +
                     orphans.length + ' of ' + totalP + ' paragraphs fall outside ' +
                     'it) — falling back to structure.');
        return null;
    }

    // Front matter that happens to be in the TOC — a title page, a Contents
    // list — carries no paragraphs and drops out here without special-casing.
    const kept = ordered.filter(u => u.pEls.length);
    if (kept.length < 2) return null;
    if (orphans.length) kept[0].pEls = orphans.concat(kept[0].pEls);
    // Reported by parseEpubFile so a rescue is a number on screen, not a secret.
    kept.orphanCount = orphans.length;
    return kept;
}

// Project Gutenberg wraps its licence and machine header in marked-up
// boilerplate. It is not part of the book and nobody wants to type it.
//
// ⚠️ REMOVE THE REGIONS, NEVER SKIP THE FILE. The first version of this skipped
// any spine file containing boilerplate — and Gutenberg puts its header in the
// SAME file as the opening chapters, so Toby Tyler silently imported chapters
// XI-XX and lost I-X. Excising the marked-up regions leaves the chapters that
// share the file, and a page that was nothing but boilerplate ends up with no
// paragraphs and drops out on its own with no special case.
function stripBoilerplate(doc) {
    if (!doc || !doc.body) return 0;
    const junk = doc.body.querySelectorAll('.pg-boilerplate, #pg-header, #pg-footer');
    junk.forEach(el => el.parentNode && el.parentNode.removeChild(el));
    return junk.length;
}


// ═════════════════════════════════════════════════════════════════════════════
// ASK THE BOOK WHAT EACH FILE IS  (v3.13.0)
// ═════════════════════════════════════════════════════════════════════════════
//
// Before this, EVERY spine document became a numbered chapter. So Standard
// Ebooks' `imprint.xhtml` — their publishing boilerplate — was chapter 2 of
// every book in the library, `titlepage.xhtml` was chapter 1, and a student
// could be assigned to type the colophon. Worse, it shifted the real chapters:
// Pride and Prejudice's Chapter I sat at position 3, Gatsby's at position 5,
// Douglass's at position 6 — a different offset per book. Aesop reported 289
// fables instead of 284 for exactly this reason.
//
// EPUB3 already answers this. The root <section>/<body> carries
// epub:type="frontmatter" | "bodymatter" | "backmatter". Standard Ebooks is
// meticulous about it — verified across 18 of Jake's 20 books. Same principle
// that fixed the chapter splitting in v3.11.0: the book states its own
// structure, so read it instead of guessing.
//
// ⚠️ Nothing is DISCARDED. Front and back matter still import; they are just
// numbered outside the chapter sequence (see assignChapterId) and labelled in
// the staging list. Some front matter is real prose worth typing — Aesop's
// Introduction, Douglass's Preface and the Wendell Phillips letter. Dropping
// those would be its own bug.
const FRONT_MATTER_FILE = /\b(frontmatter|titlepage|halftitle|halftitlepage|imprint|dedication|epigraph|toc|contents|landmarks|loi|cover)\b/;
const BACK_MATTER_FILE  = /\b(backmatter|colophon|copyright|uncopyright|appendix|endnotes|index)\b/;

function classifyDocument(doc, fileKey) {
    if (!doc || !doc.body) return { cls: 'body', why: 'unparseable' };

    // Strategy 1: epub:type, which is authoritative when present.
    const roots = [doc.body].concat(Array.from(doc.body.querySelectorAll('section, article')));
    for (const el of roots) {
        const t = (el.getAttribute && (el.getAttribute('epub:type') || el.getAttribute('type'))) || '';
        if (!t) continue;
        if (/\bbodymatter\b/.test(t))  return { cls: 'body',  why: 'epub:type bodymatter' };
        if (/\bbackmatter\b/.test(t))  return { cls: 'back',  why: 'epub:type backmatter' };
        if (/\bfrontmatter\b/.test(t)) return { cls: 'front', why: 'epub:type frontmatter' };
    }

    // Strategy 2: EPUB2 has no semantics at all (Project Gutenberg). Filename,
    // then shape. A document with no heading and almost no prose is not a
    // chapter of a novel — it is a dedication or a transcriber's note.
    const f = String(fileKey || '').toLowerCase();
    if (FRONT_MATTER_FILE.test(f)) return { cls: 'front', why: 'filename' };
    if (BACK_MATTER_FILE.test(f))  return { cls: 'back',  why: 'filename' };

    const lead = (doc.body.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (/^(contents|table of contents)\b/i.test(lead)) {
        return { cls: 'front', why: 'reads like a contents page' };
    }
    const chars = Array.from(doc.body.querySelectorAll('p'))
                       .map(x => x.textContent.trim()).join(' ').length;
    if (!doc.body.querySelector('h1,h2,h3,h4,h5,h6') && chars < 600) {
        return { cls: 'front', why: 'no heading, only ' + chars + ' characters' };
    }
    return { cls: 'body', why: 'default' };
}

// ─── Heading extraction: the title AND the ordinal, separately ───────────────
//
// ⚠️ THIS IS THE BUG THAT COST JAKE THE MOST TYPING, AND IT WAS TWO BUGS.
//
// headingTextOf() only ever queried h1-h6. Standard Ebooks marks a titled
// chapter like this:
//
//     <hgroup>
//       <h2 epub:type="z3998:ordinal z3998:roman">II</h2>
//       <p  epub:type="title">Old Tom and Nancy</p>
//     </hgroup>
//
// The ordinal is the heading. THE TITLE IS A <p>. So the old function returned
// "II" and never saw the name — twelve of Jake's twenty books, every one of
// which he then re-typed by hand.
//
// And because the title is a <p>, querySelectorAll('p') swept it into the body
// text, making the chapter title SEGMENT ZERO of what students type. He was
// typing names into the admin form that were simultaneously being served to
// kids as the first line of prose.
//
// Returns { title, ordinal, titleEls }. `titleEls` is the <p> elements to
// exclude from the typing segments — the caller MUST honour that or the title
// stays in the prose.
function headingInfoOf(root) {
    const HEADING = 'h1, h2, h3, h4, h5, h6';
    const txt = el => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();
    const typeOf = el => (el && el.getAttribute &&
                         (el.getAttribute('epub:type') || el.getAttribute('type'))) || '';

    if (!root || !root.querySelector) return { title: '', ordinal: '', titleEls: [] };
    const first = root.querySelector(HEADING);
    if (!first) return { title: '', ordinal: '', titleEls: [] };

    // An <hgroup> wraps the ordinal and the title together. Without one, the
    // heading is the whole story (Beatrix Potter: <h2 epub:type="title">).
    let scope = first;
    try { const hg = first.closest && first.closest('hgroup'); if (hg) scope = hg; } catch (_) {}
    const candidates = (scope.tagName || '').toLowerCase() === 'hgroup'
        ? Array.from(scope.children) : [scope];

    let title = '', ordinal = '';
    const titleEls = [];
    for (const el of candidates) {
        const t = typeOf(el);
        // 'fulltitle' is the book's own name on a half-title page, not a chapter's.
        if (/\bfulltitle\b/.test(t)) continue;
        if (/\bordinal\b/.test(t)) { if (!ordinal) ordinal = txt(el); continue; }
        if (/\b(title|subtitle)\b/.test(t)) {
            const v = txt(el);
            if (!v) continue;
            title = title ? (title + ': ' + v) : v;   // title + subtitle, in order
            // Only a <p> needs excluding. A heading was never in the prose.
            if ((el.tagName || '').toLowerCase() === 'p') titleEls.push(el);
            continue;
        }
        // Untyped element inside an hgroup — treat a non-ordinal one as a title.
        if (!ordinal && !title && (el.tagName || '').toLowerCase() !== 'p') {
            const v = txt(el);
            if (v) title = v;
        }
    }

    // No semantic title: use the heading's own text, unless it IS just the
    // ordinal. Pride and Prejudice and Gatsby genuinely have unnamed chapters
    // and must fall through to the numeral — that was Jake's explicit rule.
    if (!title) {
        const h = txt(first);
        if (h && h !== ordinal) title = h;
    }
    return { title, ordinal, titleEls };
}

// Backwards compatibility: findChapterUnits() and chapterUnitsFromToc() still
// call headingTextOf(). Now routed through the richer extractor so a titled
// chapter comes back named rather than numbered.
function headingTextOf(root) {
    const info = headingInfoOf(root);
    return info.title || info.ordinal || '';
}

// ─── Title tidying (v3.16.0) ─────────────────────────────────────────────────
//
// Project Gutenberg headings arrive as "I. TOBY'S INTRODUCTION TO THE CIRCUS".
// The chapter number is already the document id, so repeating it in the title
// buys nothing, and SHOUTING is worse than useless in a dropdown — it is harder
// to scan than mixed case, which is the one job a chapter list has.
//
// Wanted: "Toby's Introduction to the Circus".

// Kept lowercase unless first or last. Deliberately short: the more words on
// this list, the more real titles get mangled.
const TITLE_MINOR_WORDS = new Set([
    'a','an','the','and','but','or','nor','for','yet','so',
    'as','at','by','in','of','off','on','to','up','via','per',
    'from','into','onto','over','with','without','than','that','upon'
]);

// Only rewrite case when the text really is shouted. A title that is already
// mixed case was set deliberately and must be left exactly alone — Standard
// Ebooks' "The Tale of Peter Rabbit" needs no help.
function isShoutedTitle(t) {
    const letters = String(t || '').replace(/[^A-Za-z]/g, '');
    if (letters.length < 4) return false;                 // "II", "XV" — not shouting
    const upper = String(t).replace(/[^A-Z]/g, '').length;
    return (upper / letters.length) >= 0.9;
}

// Splits on spaces but capitalises inside hyphens and after apostrophes only
// where it should: TENDER-HEARTED -> Tender-Hearted, but TOBY'S -> Toby's, not
// Toby'S. That apostrophe case is the one a naive implementation always gets
// wrong, and these titles are full of possessives.
function toTitleCase(t) {
    const words = String(t).toLowerCase().split(/(\s+)/);
    const lastIdx = words.reduce((acc, w, i) => (/\S/.test(w) ? i : acc), 0);
    return words.map((w, i) => {
        if (!/\S/.test(w)) return w;
        const bare = w.replace(/[^a-z']/g, '');
        if (i !== 0 && i !== lastIdx && TITLE_MINOR_WORDS.has(bare)) return w;
        // Capitalise the first letter of each hyphen-separated part, and the
        // first letter overall — but never a letter that follows an apostrophe.
        return w.replace(/(^|[-\u2014\/(])([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase());
    }).join('');
}

// Removes ONE leading ordinal, and only when something is left behind.
//
// ⚠️ THE TRAP IS "I AM BORN". "I" is both a Roman numeral and an English word,
// so a bare-numeral rule would turn David Copperfield's first chapter into "Am
// Born". A single-character numeral is therefore only stripped when punctuation
// follows it, which is what marks it as an ordinal rather than a pronoun.
// "CHAPTER I. I AM BORN" strips exactly one ordinal and correctly yields
// "I Am Born"; "I AM BORN" alone is left untouched.
function stripLeadingOrdinal(t) {
    const raw = String(t || '').trim();
    const m = /^(?:chapter|chap\.?|part|book|section|fable|story|letter)?\s*([IVXLCDM]+|\d{1,3})\s*([.:)\u2014-]?)\s+(\S.*)$/i.exec(raw);
    if (!m) return raw;
    const numeral = m[1], punct = m[2], rest = m[3].trim();
    if (!rest) return raw;                                // nothing would remain
    if (numeral.length < 2 && !punct) return raw;         // the "I Am Born" guard
    return rest;
}

function cleanChapterTitle(t) {
    let out = stripLeadingOrdinal(t);
    if (isShoutedTitle(out)) out = toTitleCase(out);
    return out.trim();
}

// Final display title. The chapter NUMBER already lives in the id, so a bare
// ordinal is only used when the book genuinely has no chapter name.
// ─── A NON-CHAPTER IS NEVER CALLED "Chapter N" (v3.18.4) ─────────────────────
//
// composeChapterTitle() falls back to the running counter whenever a document has
// no usable heading, regardless of what KIND of document it is. So Gatsby's
// dedication.xhtml was titled "Chapter 3" and Alice's frontispiece.xhtml was
// "Chapter 4" — a number that is not even the item's id, sitting in the staging
// list next to real chapters. Front matter is deliberately kept and labelled
// rather than hidden (§B.7), which only works if the label is honest.
//
// Only ever consulted when the existing code produced a bare "Chapter N", so a
// real title is never overwritten.
const MATTER_FILE_NAMES = {
    titlepage: 'Title Page', halftitlepage: 'Half Title', halftitle: 'Half Title',
    imprint: 'Imprint', dedication: 'Dedication', epigraph: 'Epigraph',
    frontispiece: 'Frontispiece', colophon: 'Colophon', uncopyright: 'Uncopyright',
    copyright: 'Copyright', endnotes: 'Endnotes', loi: 'List of Illustrations',
    toc: 'Table of Contents', contents: 'Table of Contents', index: 'Index',
    appendix: 'Appendix', preface: 'Preface', introduction: 'Introduction',
    // v3.19.2 — found by a real book. Augie and the Green Knight ships an
    // acknowledgements page, which fell through to "Front matter 1" because this
    // table had no entry for it. Every one of these is a name a producer actually
    // uses for a file that is not a chapter.
    acknowledgements: 'Acknowledgements', acknowledgments: 'Acknowledgments',
    foreword: 'Foreword', afterword: 'Afterword', prologue: 'Prologue',
    epilogue: 'Epilogue', glossary: 'Glossary', bibliography: 'Bibliography',
    notes: 'Notes', errata: 'Errata', imprimatur: 'Imprimatur',
};
// ─── "About this book" — ORTHOGONAL TO matter (v3.21.0) ──────────────────────
//
// `matter` answers "is this typeable?". `about` answers "is this part of the
// credits?". They cross, and collapsing them into one field is the mistake:
//
//     chapter                        typeable, not credits
//     imprint / colophon / licence   NOT typeable, IS credits
//     an author's real preface       not typeable (unless flipped), NOT credits
//     dedication                     not typeable, and honestly your call
//
// So `about` is a separate boolean, and the About view renders EVERY chapter
// carrying it, in id order. That is how Standard Ebooks' colophon AND uncopyright
// both appear without either being special-cased — and how a Creative Commons
// notice can be PRESERVED VERBATIM in the document served rather than paraphrased
// on a card or linked to a copy somewhere else.
//
// Nothing distinguishes "typed" from "about" beyond these two flags. game.js
// v3.11.0 offers body chapters only; the About view reads about:true. Neither
// consults the other, so a chapter cannot leak into the wrong one.
const ABOUT_FILE = /\b(imprint|copyright|uncopyright|colophon|licen[cs]e|rights|attribution)\b/;
const ABOUT_EPUB_TYPE = /\b(imprint|colophon|copyright-page|acknowledg)/i;

// Auto-set on import so a Standard Ebook or my Augie build needs nothing ticked.
// ⚠️ Only ever true for NON-body documents: a chapter is never credits, whatever
// it happens to be called.
function detectAbout(doc, fileKey, cls) {
    if (cls === 'body') return false;
    if (ABOUT_FILE.test(String(fileKey || '').toLowerCase())) return true;
    try {
        const roots = [doc.body].concat(Array.from(doc.body.querySelectorAll('section, article')));
        for (const el of roots) {
            const t = (el.getAttribute && (el.getAttribute('epub:type') || el.getAttribute('type'))) || '';
            if (t && ABOUT_EPUB_TYPE.test(t)) return true;
        }
    } catch (_) { /* shape unknown; the filename verdict stands */ }
    return false;
}

function matterTitleFrom(fileKey, cls, n) {
    const stem = String(fileKey || '').replace(/\.x?html?$/i, '').toLowerCase();
    for (const k of Object.keys(MATTER_FILE_NAMES)) {
        if (new RegExp('\\b' + k + '\\b').test(stem)) return MATTER_FILE_NAMES[k];
    }
    // Global Grey and some Gutenberg builds use opaque names (index_split_001),
    // so there is nothing to read. "Front matter 2" is still true, which
    // "Chapter 2" was not.
    return (cls === 'back' ? 'Back matter ' : 'Front matter ') + n;
}

// ─── FIX C: front matter hiding INSIDE a bodymatter file (v3.18.5) ───────────
//
// classifyDocument() classifies a whole spine FILE. The TOC route then splits
// that file into units, and every unit inherits the file's class — so a title
// page, a contents list, a dedication or an e-text credit sitting in the same
// file as chapter one all became BODY chapters. Measured across Jake's 42-book
// library, this hit 10 of the 11 Gutenberg books and pushed their real chapter
// numbering out by 1 to 4:
//
//   Crimson Sweater   body 1-4 were "E-text prepared by David Edwards…",
//                     "Ralph Henry Barbour", "With Illustrations By C.M.
//                     Relyea", "List of Illustrations"  → real ch.1 was ch.5
//   Toby Tyler        body 1-2 were "Toby Tyler", "Contents"
//   Wizard of Oz      body 1-2 were "The Wonderful Wizard of Oz", "Introduction"
//   Dracula           body 1-2 were "D R a C U L A", "Contents"
//   Rebecca           body 1 was "To My Mother"
//   Outdoor Girls     body 1 was "OR"   ← subtitle debris
//   Scranton Chums    body 1 was "The World Syndicate Publishing Co."
//   Camp Fire Girls   body 1 was the book's own title
//   HS Left End       body 1 was "Contents"
//
// A kid told to type chapter 1 of The Crimson Sweater got the transcriber's
// credit. Reclassified as FRONT, not deleted — §B.7 keeps front matter visible
// and labelled, so Baum's real Introduction stays available, just not as ch.2.
//
// ⚠️ ONLY RUNS BEFORE THE FIRST REAL CHAPTER. The first body unit that does not
// match switches the filter off for the rest of the book, so nothing downstream
// of chapter one can be touched however it is titled.
const LEADING_MATTER_TITLE = /^(contents?|table of contents|list of illustrations|illustrations?|transcriber'?s?\s*note|e-?text prepared|preface|introduction|foreword|dedication|half.?title|title.?page|frontispiece|advertisement|copyright|colophon)\b/i;
const LEADING_MATTER_CREDIT = /\b(publishing\s+(co|company)\b|printed by|with illustrations by|illustrated by|engraved by|all rights reserved)/i;

function normaliseTitleForCompare(t) {
    return String(t || '').toLowerCase()
        .replace(/[\u2018\u2019']/g, '')
        .replace(/[^a-z0-9]+/g, '');
}

function looksLikeLeadingMatter(title, bookTitle, bookAuthor, pCount) {
    const t = String(title || '').trim();
    if (!t) return false;
    if (LEADING_MATTER_TITLE.test(t)) return true;
    if (LEADING_MATTER_CREDIT.test(t)) return true;

    const n = normaliseTitleForCompare(t);
    if (!n) return false;
    const bt = normaliseTitleForCompare(bookTitle);
    const ba = normaliseTitleForCompare(bookAuthor);

    // Title page: the heading IS the book's title, or the title's leading words
    // (Gutenberg splits "Toby Tyler; Or, Ten Weeks with a Circus" across lines).
    //
    // ⚠️ ONE-DIRECTIONAL ON PURPOSE. Testing n.startsWith(bt) as well would fire
    // on any book whose dc:title is a short name that its chapters also use —
    // dc:title "Heidi" would swallow a chapter called "Heidi Goes to the
    // Mountain". Only the title-is-a-prefix-of-dc:title direction is safe, and
    // the length floor keeps a two-word chapter from matching by accident.
    if (bt && (bt === n || (n.length >= 6 && bt.startsWith(n)))) return true;

    // A page whose only heading is the author's name.
    if (ba && ba === n) return true;

    // Subtitle debris: Gutenberg leaves the "OR" between title and subtitle
    // stranded as its own heading.
    if (pCount <= 2 && n.length <= 3) return true;

    // Dedications rarely say "dedication". ⚠️ The loosest rule here, held in
    // check by the paragraph ceiling and by only running before chapter one.
    if (pCount <= 3 && /^(to|for)\s+(my|his|her|our|the)\b/i.test(t)) return true;

    return false;
}

function composeChapterTitle(info, fallbackIndex) {
    if (info && info.title)   return cleanChapterTitle(info.title).substring(0, 60);
    // A bare ordinal is all some books have — Pride and Prejudice and Gatsby
    // genuinely do not name their chapters — so it passes through untidied.
    if (info && info.ordinal) return info.ordinal.substring(0, 60);
    return 'Chapter ' + fallbackIndex;
}

// ─── Numbering ───────────────────────────────────────────────────────────────
//
// Jake's scheme, and the reason it matters beyond tidiness: front matter used
// to consume chapter numbers, so "chapter 1" was never chapter 1.
//
//   body   1, 2, 3 …          chapter 1 IS chapter 1
//   front  0.1, 0.2, 0.3 …    sorts ahead of chapter 1
//   back   900.1, 900.2 …     sorts last, unmistakably not a chapter
//
// 900 rather than "last chapter + 0.1" so it never collides with the 1.1 / 2.1
// convention Jake uses for books with internal parts. Chapter ids are compared
// with parseFloat throughout, so decimals sort correctly.
//
// ⚠️ WHY BACK MATTER MUST NOT COUNT AS A CHAPTER — Jake's own catch. He keeps
// the colophon because why not, and the why-not is that a student who finishes
// the story never gets the completion celebration, because three files of
// publishing boilerplate still sit between them and the end. The book document
// therefore records `bodyChapters` separately from `totalChapters`, so
// completion can be judged on the story rather than on the file count.
// Part / book / volume detection.
//
// ⚠️ WRITTEN AFTER v3.13.0 FLATTENED HEIDI. Heidi is two parts — "Heidi's Years
// of Wandering and Learning" and "Heidi Makes Use of Her Experience" — and Jake
// had hand-numbered them 1.1-1.13 and 2.1-2.8. A re-import renumbered the lot
// 1-23 and the structure was gone. Sequential numbering is correct for a novel
// and actively destructive for a book with internal divisions.
//
// The signal is right there in the filename. Standard Ebooks names a chapter in
// a multi-part book `chapter-{part}-{n}.xhtml` and drops `part-1.xhtml` /
// `part-2.xhtml` in as dividers. Heidi: chapter-1-1 … chapter-1-14, then
// chapter-2-1 … chapter-2-9. A single-part book is plain `chapter-7.xhtml`, so
// the two cases are unambiguous.
//
// Position within the part is POSITIONAL, not the book's own ordinal. Heidi's
// chapter-2-1 is headed "XV" because that edition numbers straight through, but
// Jake wants it as 2.1 — which is also what he had by hand. Books that restart
// their numbering come out the same way, so one rule covers both.
// ⚠️ parseFloat CANNOT COMPARE PART NUMBERS, AND EVERYTHING USED TO USE IT.
//
// parseFloat("1.10") is 1.1 — the SAME VALUE as parseFloat("1.1"). So 1.1 and
// 1.10 were not merely misordered, they were indistinguishable, and 1.2 sorted
// after both of them. Every chapter sort in this file had that bug, which is why
// a two-part book came out 1.1, 1.10, 1.11, 1.2.
//
// A dotted id is not a number, it is a sequence of numbers, so compare it as
// one: split on the dot and compare element-wise as integers. This fixes books
// ALREADY numbered by hand — 1.1 … 1.13 sorts correctly with no renumbering and
// therefore no disruption to a student's stored chapter pointer. The padding
// below is a separate, additive safety net.
function chapterSortKey(id) {
    return String(id == null ? '' : id)
        .replace(/^chapter_/, '')
        .split('.')
        .map(x => { const n = parseInt(x, 10); return Number.isFinite(n) ? n : 0; });
}
function compareChapterIds(a, b) {
    const x = chapterSortKey(a), y = chapterSortKey(b);
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
        const d = (x[i] || 0) - (y[i] || 0);
        if (d) return d;
    }
    return 0;
}

const SE_PART_CHAPTER = /^chapter-(\d+)-(\d+)\b/i;
const PART_DIVIDER    = /^(part|book|volume)-(\d+)\b/i;

function detectPart(chap) {
    const f = String(chap.srcFile || '').toLowerCase();
    const m = SE_PART_CHAPTER.exec(f);
    return m ? parseInt(m[1], 10) : null;
}

function assignChapterIds(chapters) {
    let front = 0, back = 0;

    // Does this book have parts at all? If nothing declares one, every body
    // chapter numbers 1..n exactly as before — novels are unaffected.
    const parts = chapters.filter(c => (c.matter || 'body') === 'body')
                          .map(detectPart).filter(x => x !== null);
    const hasParts = new Set(parts).size >= 2;

    // Zero-pad the within-part index to a fixed width across the WHOLE book, so
    // a naive numeric sort anywhere else still gets the right answer. Width comes
    // from the largest part, so every id in one book is the same shape: Heidi's
    // 14-chapter part 1 makes it 1.01 … 1.14 and 2.01 … 2.09, not a mix.
    //
    // A book whose largest part is under 10 chapters stays unpadded (2.1 … 2.9),
    // because there is nothing to disambiguate and the short form reads better.
    let padWidth = 1;
    if (hasParts) {
        const tally = {};
        for (const c of chapters) {
            if ((c.matter || 'body') !== 'body') continue;
            const pt = detectPart(c);
            const k = pt === null ? '_' : pt;
            tally[k] = (tally[k] || 0) + 1;
        }
        const biggest = Math.max(1, ...Object.values(tally));
        padWidth = String(biggest).length;
    }
    const pad = n => String(n).padStart(padWidth, '0');

    let body = 0;
    const withinPart = {};
    let lastPart = null;

    for (const c of chapters) {
        if (c.matter === 'front')     { c.id = '0.' + (++front); continue; }
        if (c.matter === 'back')      { c.id = '900.' + (++back); continue; }

        if (!hasParts) { c.id = String(++body); body === body; c.part = null; continue; }

        // A chapter whose filename names no part inherits the part before it —
        // that covers a stray file in an otherwise well-named book rather than
        // silently sending it to part 1.
        let pt = detectPart(c);
        if (pt === null) pt = (lastPart === null ? 1 : lastPart);
        lastPart = pt;
        withinPart[pt] = (withinPart[pt] || 0) + 1;
        c.part = pt;
        c.id = pt + '.' + pad(withinPart[pt]);
        body++;
    }
    return { bodyChapters: body, frontCount: front, backCount: back,
             parts: hasParts ? new Set(parts).size : 0 };
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

// ⚠️ stagedChapters ORDER IS LOAD-BEARING, not cosmetic. (v3.17.0)
//
// Three buttons in the staging list work on ARRAY INDICES, and all three end by
// renumbering from position: `stagedChapters.forEach((ch, i) => ch.id = i + 1)`.
//   · Del      — splices by index, then renumbers everything
//   · Merge ↓  — merges index with index + 1
//   · Split    — splices replacements in by index, then renumbers
//
// So an out-of-order array is not a display quirk: deleting one chapter rewrites
// every id from the wrong positions, and "Merge with next" merges two chapters
// that merely LOOK adjacent. Tom Sawyer Abroad rendered as 4, 5, 1, 6, 2, 7, 3,
// 8 while its database array was perfectly sequential — the data was right and
// one Del click would have destroyed it.
//
// Sorting here rather than in renderChapterList() is deliberate. Sorting only
// the render would fix the appearance and leave the three index operations still
// reaching for the wrong rows, which is strictly worse than the visible bug.
// uploadAllBtn already sorts on write, so this makes the array, the display, and
// the saved order all agree.
//
// ⚠️ SEPARATE BUG, STILL OPEN: that `ch.id = i + 1` renumber flattens part-aware
// ids. Delete one chapter from Heidi and 1.01—2.09 becomes 1—22. Not fixed here
// because it needs the part scheme threading through all three handlers. Avoid
// Del / Merge / Split on a multi-part book until it is.
function sortStagedChapters() {
    if (!Array.isArray(stagedChapters) || stagedChapters.length < 2) return false;
    const before = stagedChapters.map(c => c.id).join(',');
    stagedChapters.sort((a, b) => compareChapterIds(a.id, b.id));
    return stagedChapters.map(c => c.id).join(',') !== before;
}

// Front and back matter are labelled, not hidden. Jake keeps the colophon; the
// point is that it is visibly NOT chapter 3.
function matterTag(chap) {
    const m = chap.matter || 'body';
    if (m === 'body') return '';
    const label = m === 'front' ? 'FRONT MATTER' : 'BACK MATTER';
    const colour = m === 'front' ? '#ba9ae0' : '#c0b060';
    return '<span title="' + escapeHtml(chap.matterWhy || '') + '" style="background:#1c1c1c;' +
           'border:1px solid ' + colour + ';color:' + colour + ';border-radius:9px;' +
           'padding:0 6px;font-size:0.72em;margin-right:6px;">' + label + '</span>';
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
                <div class="chap-title">${matterTag(chap)}ID: ${escapeHtml(chap.id)} | ${escapeHtml(chap.title)}</div>
                <div class="chap-meta">${chap.segments.length} segments <span class="chap-status"></span></div>
            </div>
            <div class="chap-actions">
                ${(chap.matter || 'body') !== 'body' ? `<button class="about-btn" data-index="${index}" title="${chap.about ? 'IN the About this book view. Click to remove.' : 'Not in About this book. Click to include \u2014 use this for the imprint, colophon, licence or uncopyright page.'}" style="${chap.about ? 'background:#2a4535;border:1px solid #58a06f;color:#8fd6a6;' : ''}">${chap.about ? '\u2139 About' : '\u2139'}</button>` : ''}
                ${canMerge ? `<button class="merge-btn" data-index="${index}" title="Merge with next chapter">Merge ↓</button>` : ''}
                <button class="split-btn" data-index="${index}" title="Split into multiple chapters">Split</button>
                <button class="matter-btn" data-index="${index}" title="Cycle: body \u2192 front matter \u2192 back matter. Use this when the importer guessed wrong \u2014 it relabels, it does not delete.">${(chap.matter || 'body') === 'body' ? 'Body' : ((chap.matter === 'front') ? 'Front' : 'Back')}</button>
                <button class="edit-btn" data-index="${index}">Edit</button>
                <button class="danger-btn delete-btn" data-index="${index}">Del</button>
            </div>
        `;
        chapterListEl.appendChild(div);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => {
            stagedChapters.splice(parseInt(e.target.dataset.index), 1);
            assignChapterIds(stagedChapters);   // NOT i+1 — see the note by assignChapterIds
            renderChapterList();
        };
    });

    // ─── RELABEL, DON'T DELETE (v3.19.0) ───────────────────────────────────
    //
    // Every matter class in this file is a GUESS — from a filename pattern, an
    // epub:type, a heading, or Fix C's leading-matter test. Guesses are wrong
    // sometimes, and until now the staging row offered Merge, Split, Edit and Del
    // but no way to say "that IS a chapter". So the only remedy for a
    // misclassified chapter one was to delete it, which is the opposite of what
    // was wanted.
    //
    // Cycles body → front → back → body, then re-derives every id, so promoting
    // Gutenberg's mislabelled chapter one renumbers the rest of the book to match
    // in one click.
    // ⚠️ The About toggle only appears on NON-BODY rows, which keeps the row from
    // growing on the 31 chapters of a novel — on a Standard Ebook it is 4 buttons
    // out of 35 rows, and usually already correct from import.
    document.querySelectorAll('.about-btn').forEach(btn => {
        btn.onclick = (e) => {
            const i = parseInt(e.target.dataset.index);
            const chap = stagedChapters[i];
            chap.about = !chap.about;
            renderChapterList();
            const n = stagedChapters.filter(c => c.about).length;
            statusEl.innerText = `"${chap.title}" ${chap.about ? 'added to' : 'removed from'} ` +
                `About this book \u2014 ${n} page${n === 1 ? '' : 's'} in the credits. Re-upload to save.`;
            statusEl.style.borderColor = "#ffaa00";
        };
    });

    document.querySelectorAll('.matter-btn').forEach(btn => {
        btn.onclick = (e) => {
            const i = parseInt(e.target.dataset.index);
            const chap = stagedChapters[i];
            const now = chap.matter || 'body';
            chap.matter = (now === 'body') ? 'front' : (now === 'front' ? 'back' : 'body');
            chap.matterWhy = 'set by hand';
            const n = assignChapterIds(stagedChapters);
            renderChapterList();
            statusEl.innerText = `"${chap.title}" is now ${chap.matter === 'body' ? 'a BODY chapter' : chap.matter.toUpperCase() + ' MATTER'} \u2014 ` +
                `${n.bodyChapters} body chapter${n.bodyChapters === 1 ? '' : 's'}. Re-upload to save.`;
            statusEl.style.borderColor = "#ffaa00";
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
    assignChapterIds(stagedChapters);   // NOT i+1 — see the note by assignChapterIds
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
        assignChapterIds(stagedChapters);   // NOT i+1 — see the note by assignChapterIds
        
        modal.classList.add('hidden');
        renderChapterList();
        statusEl.innerText = `Split into ${newChapters.length} chapters. ${stagedChapters.length} total now.`;
        statusEl.style.borderColor = "#00ff41";
    };
}

function editChapter(index) {
    if (index < 0 || index >= stagedChapters.length) return;
    editingIndex = index;
    const chap = stagedChapters[index];
    manualTitle.value = chap.title;
    manualNum.value = chap.id; 
    jsonContent.value = JSON.stringify({ segments: chap.segments }, null, 2);
    updateStagedBtn.classList.remove('hidden');
    saveDirectBtn.classList.add('hidden');

    // Position readout + Next, so bulk title entry doesn't mean scrolling back to the
    // list after every single chapter.
    const posEl  = document.getElementById('chap-edit-position');
    const nextBtn = document.getElementById('update-next-btn');
    const isLast = index >= stagedChapters.length - 1;
    if (posEl) {
        posEl.classList.remove('hidden');
        posEl.textContent = 'Editing chapter ' + (index + 1) + ' of ' + stagedChapters.length +
                            (isLast ? ' (last)' : '');
    }
    if (nextBtn) {
        nextBtn.classList.toggle('hidden', isLast);
        nextBtn.disabled = isLast;
    }

    manualDetails.open = true;
    manualDetails.scrollIntoView({ behavior: 'smooth' });
    // Focus the title, which is the field being filled in 90% of these edits.
    setTimeout(() => { try { manualTitle.focus(); manualTitle.select(); } catch (_) {} }, 250);
}

// Commit the open editor back into stagedChapters. Returns false if the JSON is bad,
// so callers can decide whether to advance.
function commitStagedEdit() {
    if (editingIndex < 0) return false;
    let data;
    try { data = JSON.parse(jsonContent.value); }
    catch (e) { alert("Invalid JSON — not saved."); return false; }
    stagedChapters[editingIndex].title = manualTitle.value;
    stagedChapters[editingIndex].id = manualNum.value.trim();
    stagedChapters[editingIndex].segments = data.segments;
    return true;
}

function closeChapterEditor() {
    editingIndex = -1;
    updateStagedBtn.classList.add('hidden');
    const nextBtn = document.getElementById('update-next-btn');
    const posEl   = document.getElementById('chap-edit-position');
    if (nextBtn) nextBtn.classList.add('hidden');
    if (posEl)   posEl.classList.add('hidden');
    saveDirectBtn.classList.remove('hidden');
    manualDetails.open = false;
}

updateStagedBtn.onclick = () => {
    if (!commitStagedEdit()) return;
    closeChapterEditor();
    renderChapterList();
};

// Commit and open the next chapter without leaving the editor. The whole point is
// that adding 24 missing chapter titles shouldn't mean 24 round trips to the list.
const updateNextBtn = document.getElementById('update-next-btn');
if (updateNextBtn) updateNextBtn.onclick = () => {
    const idx = editingIndex;
    if (!commitStagedEdit()) return;
    renderChapterList();   // keep the list honest as you go
    if (idx + 1 < stagedChapters.length) {
        editChapter(idx + 1);
    } else {
        closeChapterEditor();
        statusEl.innerText = 'Last chapter updated.';
        statusEl.style.borderColor = '#00ff41';
    }
};

// --- SAVE TITLE ---
// Reads the genre control, resolving the "Custom..." option to the text input.
// customGenreInput was declared in v3.x and never used, so picking Custom stored the
// literal string "__custom__" as the genre.
// ─── select + "Custom…" pairs (v3.21.0) ──────────────────────────────────────
//
// Generalised from readGenreField(), which existed because Upload All once read
// genre with a raw .value and stored the literal string "__custom__" in Firestore.
// Three fields now share the shape, so they share one reader and one writer
// rather than three chances to make that same mistake again.
function readSelectOrCustom(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return "";
    if (sel.value === '__custom__') {
        const inp = document.getElementById(selectId + '-custom');
        return (inp && inp.value.trim()) || "";
    }
    return sel.value;
}

// Puts a stored value back: an exact option if one matches, otherwise Custom…
// with the text filled in. Without this, opening a book whose licence came from
// dc:rights would show "— Not set —" and re-saving would erase it.
function writeSelectOrCustom(selectId, value) {
    const sel = document.getElementById(selectId);
    const inp = document.getElementById(selectId + '-custom');
    if (!sel) return;
    const v = String(value || '');
    const exact = Array.from(sel.options).find(o => o.value === v && o.value !== '__custom__');
    if (v && !exact) {
        sel.value = '__custom__';
        if (inp) { inp.value = v; inp.classList.remove('hidden'); }
    } else {
        sel.value = exact ? v : '';
        if (inp) { inp.value = ''; inp.classList.add('hidden'); }
    }
}

function wireCustomSelect(selectId) {
    const sel = document.getElementById(selectId);
    const inp = document.getElementById(selectId + '-custom');
    if (!sel || !inp) return;
    sel.addEventListener('change', () => {
        if (sel.value === '__custom__') { inp.classList.remove('hidden'); inp.focus(); }
        else { inp.classList.add('hidden'); inp.value = ''; }
    });
}
['active-book-source', 'active-book-rights'].forEach(wireCustomSelect);

function readGenreField() {
    const sel = document.getElementById('active-book-genre');
    if (!sel) return "";
    if (sel.value === '__custom__') {
        return (customGenreInput && customGenreInput.value.trim()) || "";
    }
    return sel.value;
}

// The single source of truth for "what is in the book metadata form".
//
// Save Metadata and Upload All both used to read these fields themselves and had
// drifted: Upload All never learned about the v3.7.0 tag fields, read genre with
// a raw .value so "Custom..." stored "__custom__", and kept the `if (author)`
// guards that made a blanked field silently retain its old value. Two readers is
// one reader too many.
//
// Returns { ok:false, msg } or { ok:true, data } where data is written verbatim
// with merge:true. null is a real, storable value here — it means "untagged".
function readBookMetadataForm(title) {
    const t = String(title || '').trim();
    if (!t) return { ok: false, msg: 'Title required.' };

    const age = readAgeRange();
    if (!age.ok) return { ok: false, msg: age.msg };

    const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    return { ok: true, data: {
        title: t,
        author: val('active-book-author'),
        genre: readGenreField(),
        minAge: age.minAge,
        maxAge: age.maxAge,
        protagonistGender: (document.getElementById('active-book-protagonist') || {}).value || '',
        // Empty string, not omitted: a blank field must be able to CLEAR a value
        // that was set before. §A.14's lesson about || guards on metadata.
        source: readSelectOrCustom('active-book-source'),
        rights: readSelectOrCustom('active-book-rights'),
        archiveUrl: val('active-book-archive'),
        originUrl: val('active-book-origin'),
        cleanedBy: val('active-book-cleanedby'),
    }};
}

// Reads and VALIDATES the age-range pair. Returns
//   { ok: true,  minAge, maxAge }        both numbers, or both null
//   { ok: false, msg }                   with a reason to show the user
//
// Validating as a pair rather than per-field is deliberate. A book with a min
// and no max is not "partly tagged" — it's unmatchable, because the library's
// overlap test needs both ends. Same for min > max. Both would save silently
// and then quietly never appear in a filtered search, which is the worst kind
// of bug: no error, no result, no clue.
function readAgeRange() {
    const minEl = document.getElementById('active-book-minage');
    const maxEl = document.getElementById('active-book-maxage');
    const rawMin = minEl ? minEl.value.trim() : '';
    const rawMax = maxEl ? maxEl.value.trim() : '';

    if (rawMin === '' && rawMax === '') return { ok: true, minAge: null, maxAge: null };
    if (rawMin === '' || rawMax === '') {
        return { ok: false, msg: 'Age range needs BOTH ends, or neither. ' +
                                 'A half-range can never match a search.' };
    }
    const min = parseInt(rawMin, 10), max = parseInt(rawMax, 10);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return { ok: false, msg: 'Age range must be whole numbers.' };
    }
    if (min < 3 || max > 18) return { ok: false, msg: 'Ages must be between 3 and 18.' };
    if (min > max) return { ok: false, msg: `Age range is backwards (${min} to ${max}).` };
    return { ok: true, minAge: min, maxAge: max };
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
        const form = readBookMetadataForm(newTitle);
        if (!form.ok) {
            setInline('\u26a0 ' + form.msg, '#ff9800');
            saveTitleBtn.textContent = original;
            saveTitleBtn.disabled = false;
            saveTitleBtn.style.opacity = '1';
            return;
        }
        const updates = form.data;
        const genre = updates.genre;
        const age = { minAge: updates.minAge, maxAge: updates.maxAge };
        const protagonistGender = updates.protagonistGender;

        let coverNote = '';
        if (stagedCoverBlob) {
            setInline('Uploading cover\u2026', '#888');
            const cover = await uploadCover(activeBookId, stagedCoverBlob, stagedCoverType);
            if (cover.ok) { updates.coverUrl = cover.url; coverNote = 'cover saved (' + cover.contentType + ')'; }
            else {
                // ⚠️ STOP. Do not write the metadata and report success when the
                // cover failed — that is precisely how two books shipped with no
                // cover while the screen said "✓ Saved". Nothing is written, so
                // fixing the cause and clicking again is all that is needed.
                setInline('✗ Cover upload FAILED, nothing was saved: ' + cover.error, '#ff4444');
                statusEl.innerText = 'Cover upload failed — metadata NOT saved.';
                statusEl.style.borderColor = '#ff3333';
                saveTitleBtn.textContent = original;
                saveTitleBtn.disabled = false;
                saveTitleBtn.style.opacity = '1';
                return;
            }
        }

        await setDoc(doc(db, "books", activeBookId), updates, { merge: true });
        bookTitlesMap[activeBookId] = newTitle;

        const stamp = new Date().toLocaleTimeString();
        const tagBits = [];
        tagBits.push(genre ? 'genre: ' + genre : 'genre cleared');
        tagBits.push(age.minAge === null ? 'no age range'
                                         : 'ages ' + age.minAge + '\u2013' + age.maxAge);
        if (protagonistGender) tagBits.push('lead: ' + protagonistGender);
        // Say whether a cover was part of this save. Its silence is what let two
        // books slip through: "Saved" listed genre, ages and lead, and simply did
        // not mention the one thing that had failed.
        tagBits.push(coverNote || (stagedCoverUrl ? 'cover unchanged' : 'NO COVER'));
        setInline('\u2713 Saved at ' + stamp + ' \u00b7 ' + tagBits.join(' \u00b7 '), '#00ff41');
        statusEl.innerText = "Metadata Updated.";
        statusEl.style.borderColor = "#00ff41";
        saveTitleBtn.textContent = '\u2713 Saved';
        // Refresh the list so the change is visible where the book is listed, not
        // just in the form you just typed into. selectFirst=false is LOAD-BEARING:
        // the default used to jump the picker to the first book and fire onchange,
        // which hid the staging area and threw away the staged chapters.
        await loadBookList(false);
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
    
    // ⚠️ ONLY ASK IF THERE IS SOMETHING TO OVERWRITE (v3.23.0). This said
    // "Overwrite <id>?" on a brand new book, because the id exists as a variable
    // long before it exists as a document. Confusing on the first upload of every
    // single book, and it trains people to click through a warning that will one
    // day be real.
    const alreadyExists = Object.prototype.hasOwnProperty.call(bookTitlesMap, activeBookId);
    if (alreadyExists) {
        if (!confirm(`"${bookTitlesMap[activeBookId]}" already exists.\n\n` +
                     `Overwrite it with these ${stagedChapters.length} chapters?`)) return;
    } else {
        if (!confirm(`Create "${val('active-book-title') || activeBookId}" with ` +
                     `${stagedChapters.length} chapters?`)) return;
    }

    statusEl.innerText = "Uploading...";
    // Upload All reports to the status bar at the top, so a leftover green
    // "✓ Saved · cover saved" beside the button would sit there contradicting a
    // red COVER FAILED — which is exactly what happened with Northanger Abbey.
    clearSaveTitleStatus();
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
            // ⚠️ `matter` IS LOAD-BEARING DOWNSTREAM (v3.19.1). Without it the book
            // document says nothing about which entries are front or back matter,
            // so index.html and game.js have to guess from the id shape — and
            // bodyChapters, written since v3.18.x, had no consumer for exactly
            // this reason. Old book documents lack the field, so both readers must
            // fall back; re-upload a book to give it one.
            chapterMeta.push({ id: "chapter_" + chapId, title: chapData.title,
                               matter: chapData.matter || 'body',
                               about: chapData.about === true });
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
        // compareChapterIds, NOT parseFloat — see the note by chapterSortKey().
        chapterMeta.sort((a, b) => compareChapterIds(a.id, b.id));

        // Same reader Save Metadata uses. Upload All previously wrote only
        // title/author/genre — no age range, no protagonist — read genre with a
        // raw .value (so "Custom..." stored "__custom__"), and guarded with
        // `if (author)` so a cleared field kept its old value. A book uploaded
        // here and never re-saved was silently untagged.
        const form = readBookMetadataForm(activeBookTitle.value || activeBookId);
        if (!form.ok) {
            statusEl.innerText = '\u26a0 ' + form.msg + ' Chapters uploaded; metadata NOT saved.';
            statusEl.style.borderColor = '#ffaa00';
            return;
        }
        const bookData = Object.assign({}, form.data, {
            totalChapters: stagedChapters.length,
            // ⚠ Completion should be measured against this, not totalChapters.
            bodyChapters: stagedBodyChapters ||
                          stagedChapters.filter(c => (c.matter || 'body') === 'body').length,
            chapters: chapterMeta,
            // Every chapter was just rewritten. Invalidate every student's
            // cached copy of this book. Set inline rather than via
            // bumpContentVersion() because this write is happening anyway.
            contentVersion: Date.now()
        });
        
        // Upload cover if staged
        let uploadCoverFailed = '';
        let uploadCoverNote = stagedCoverUrl ? 'cover unchanged' : 'NO COVER';
        if (stagedCoverBlob) {
            statusEl.innerText = "Uploading cover image...";
            const cover = await uploadCover(activeBookId, stagedCoverBlob, stagedCoverType);
            if (cover.ok) {
                bookData.coverUrl = cover.url;
                uploadCoverNote = 'cover saved (' + cover.contentType + ')';
            } else uploadCoverFailed = cover.error;
            // Unlike Save Metadata this does NOT abort: the chapters are already
            // written, so refusing to save the book document would leave a book with
            // content and no metadata — strictly worse than a book with no cover.
            // It is reported loudly at the end instead.
        }
        
        await setDoc(doc(db, "books", activeBookId), bookData, { merge: true });
        const uploadedId = activeBookId;
        
        // ─── PRUNE ORPHANED CHAPTER DOCUMENTS (v3.22.0) ──────────────────────
        //
        // Upload All writes the chapters it has and NEVER removed ones it does not.
        // That was survivable while ids were stable. It is not survivable now:
        // v3.18.5's Fix C renumbers the Gutenberg books — Toby Tyler's chapters go
        // from 3-22 to 1-20 — so re-importing leaves the old chapter_21 and
        // chapter_22 documents sitting in the subcollection forever. They are still
        // readable, they still bill for storage, and a student whose stored progress
        // points at chapter_22 would load one and be reading a chapter the book no
        // longer lists.
        //
        // So: after the book document is written, delete every chapter document
        // whose id is not in the list we just wrote. Deliberately AFTER, so a failed
        // book write leaves the old chapters intact rather than deleting content the
        // new list never replaced.
        try {
            const keep = new Set(chapterMeta.map(c => c.id));
            const existing = await getDocs(collection(db, "books", activeBookId, "chapters"));
            const orphans = existing.docs.map(d => d.id).filter(id => !keep.has(id));
            for (const id of orphans) {
                await deleteDoc(doc(db, "books", activeBookId, "chapters", id));
            }
            if (orphans.length) {
                console.log('Pruned ' + orphans.length + ' orphaned chapter document(s): ' +
                            orphans.join(', '));
            }
            window._ttbLastPrune = orphans.length;
        } catch (e) {
            // Non-fatal: the book is correct, there is just dead weight beside it.
            // Say so rather than failing an upload that otherwise worked.
            console.warn('Could not prune old chapters:', e);
            window._ttbLastPrune = -1;
        }

        const tagged = (bookData.minAge !== null) ? `ages ${bookData.minAge}\u2013${bookData.maxAge}` : 'NO age range';
        // The cover is named on the SUCCESS path too, not only when it fails.
        // "This book is done" was previously said without reference to it.
        statusEl.innerText = `Upload complete \u2014 ${stagedChapters.length} chapters, ` +
            `${bookData.genre || 'no genre'}, ${tagged}, ` +
            `${bookData.protagonistGender || 'no protagonist tag'}, ` +
            `${uploadCoverFailed ? 'COVER FAILED' : uploadCoverNote}` +
            `${window._ttbLastPrune > 0 ? `, ${window._ttbLastPrune} old chapter doc(s) removed` : ''}` +
            `${window._ttbLastPrune === -1 ? ', \u26a0 could not prune old chapters' : ''}.` +
            `${uploadCoverFailed ? '' : ' This book is done.'}`;
        if (uploadCoverFailed) {
            statusEl.innerText += ' ⚠ COVER FAILED: ' + uploadCoverFailed;
        }
        statusEl.style.borderColor = uploadCoverFailed ? "#ff3333"
            : ((bookData.minAge !== null && bookData.protagonistGender) ? "#00ff41" : "#ffaa00");
        await loadBookList(false);

        // ⚠️ POINT THE PICKER AT THE BOOK THAT NOW EXISTS. This fixes a dead
        // control, not just a cosmetic mismatch.
        //
        // loadBookList(false) silently restores whatever was selected before, and
        // during a new-book upload that is "__NEW__". So after uploading, the
        // dropdown was ALREADY on "Create New Book..." — and re-picking it fired no
        // change event, because the value had not changed. The reset code in
        // bookSelect.onchange therefore never ran, and there was no way back to an
        // empty form except reloading the page.
        //
        // Selecting the real book makes the picker honest AND makes "Create New
        // Book..." a genuine change next time, so its reset fires.
        //
        // ⚠️ SET SILENTLY. NEVER dispatchEvent('change') here. onchange hides the
        // staging area and reassigns activeBookId, which would throw away the
        // chapters that were just uploaded and are still worth auditing. That is
        // the same trap documented on loadBookList's selectFirst parameter.
        if (uploadedId &&
            Array.from(bookSelect.options).some(o => o.value === uploadedId)) {
            bookSelect.value = uploadedId;
            createNewUI.classList.add('hidden');
            editExistingUI.classList.remove('hidden');
        }
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
        await bumpContentVersion(activeBookId);
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

// ─── EPUB hrefs are URL-ENCODED; zip entry names are not (v3.18.3) ───────────
//
// A manifest href of `images/cover%20art.jpg` refers to the zip entry
// `images/cover art.jpg`. Nothing in this file decoded that, so any book with a
// space, ampersand or accent in an internal filename failed to resolve — and
// failed differently depending on the caller: the cover path was guarded by
// `if (coverFile)` and vanished in total silence, while the spine path did
// `zip.file(p).async(...)` and threw on null, killing the whole import with a
// message that named nothing.
//
// Raw name is tried FIRST, because a zip entry is legally allowed to contain a
// literal `%` and decoding such a name would break a book that currently works.
function zipEntry(zip, path) {
    if (!path) return null;
    let f = zip.file(path);
    if (f) return f;
    try {
        const decoded = decodeURIComponent(path);
        if (decoded !== path) {
            f = zip.file(decoded);
            if (f) return f;
        }
    } catch (_) { /* malformed escape — the raw miss stands */ }
    return null;
}

// ─── ⚠️ THE COVER BUG. READ THIS BEFORE TOUCHING uploadCover(). ──────────────
//
// JSZip's `.async("blob")` builds its Blob with an EMPTY type — `""`, hardcoded,
// see jszip/lib/zipObject.js. Firebase's uploadBytes() then falls through
// `metadata.contentType || blob.type || 'application/octet-stream'` and stores
// the object as application/octet-stream.
//
// Storage rules v2.0.0 required `request.resource.contentType.matches('image/.*')`,
// which that never satisfies. So EVERY cover extracted from an EPUB was denied
// with storage/unauthorized, while every cover chosen by hand sailed through —
// because the file picker hands over a File, which carries a real `image/jpeg`.
// That is the entire difference between the two paths, and it is why this looked
// like an EPUB problem rather than a permissions one. It was diagnosed once as an
// AVIF mapping issue, which was the wrong half: the format is irrelevant, because
// the type is gone before anyone looks at it.
//
// Dropping the rule (storage.rules v2.1.0) unblocks the upload but still stores
// every cover as application/octet-stream, and that is not harmless: an SVG
// served with the wrong type will not render in an <img> at all, and the download
// URL prompts a file download instead of showing a picture. So the type gets
// fixed HERE, at the source, and the Blob itself is rebuilt carrying it — which
// makes the preview honest too, since createObjectURL uses the Blob's type.
//
// Sniffing beats the manifest on purpose. `media-type` is an authored string and
// can be wrong; magic bytes are the file.
function sniffImageType(buf) {
    const b = new Uint8Array(buf);
    const at = (i, ...sig) => sig.every((v, k) => b[i + k] === v);
    const ascii = (i, s) => [...s].every((c, k) => b[i + k] === c.charCodeAt(0));

    if (b.length < 12) return '';
    if (at(0, 0xFF, 0xD8, 0xFF)) return 'image/jpeg';
    if (at(0, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) return 'image/png';
    if (ascii(0, 'GIF8')) return 'image/gif';
    if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp';
    if (ascii(0, 'BM')) return 'image/bmp';
    // ISO-BMFF family: the brand at byte 8 is what separates AVIF from HEIC.
    if (ascii(4, 'ftyp')) {
        const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
        if (brand === 'avif' || brand === 'avis') return 'image/avif';
        if (['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'].includes(brand))
            return 'image/heic';
    }
    // SVG is text and has no magic number, so look for the tag in the opening
    // bytes — past a BOM, an XML declaration, a doctype, or a comment.
    const head = new TextDecoder('utf-8', { fatal: false })
        .decode(b.subarray(0, Math.min(b.length, 1024)));
    if (/<svg[\s>]/i.test(head)) return 'image/svg+xml';
    return '';
}

// ─── contentVersion: the cache key game.js has always read (v3.12.0) ─────────
//
// game.js readChapterCache()/writeChapterCache() invalidate a student's cached
// chapter text by comparing `books/{id}.contentVersion`. A comment in game.js
// said "admin.html bumps contentVersion on a book when a chapter is edited."
// IT NEVER DID. No version of this file has ever written that field, so the
// chapter cache's only invalidation was its expiry — which was seven days.
// Fix a typo, and a student holding a cached copy read the typo for a week.
//
// So: every path that changes chapter TEXT calls this. It is one small write to
// a document this page is already touching, and it is what makes editing a book
// mid-term actually reach the students.
//
// ⚠️ Failure is non-fatal ON PURPOSE. If the bump fails, the chapter save that
// preceded it still happened and is still correct; students just see the change
// a bit later, at expiry. Throwing here would turn a cache-freshness miss into
// a failed save, which is strictly worse.
async function bumpContentVersion(bookId) {
    if (!bookId) return;
    try {
        await setDoc(doc(db, "books", bookId), { contentVersion: Date.now() }, { merge: true });
    } catch (e) {
        console.warn('contentVersion bump failed (chapter saved fine; students ' +
                     'will pick the change up at cache expiry):', e);
    }
}

// --- COVER IMAGE ---
// ⚠️ RETURNS A RESULT, NOT A URL-OR-NULL. (v3.18.2)
//
// This used to report failure by writing to statusEl — the status bar at the TOP
// of the page, roughly seventy lines of markup above the button that triggered it
// and reliably scrolled out of view. Meanwhile the inline message beside Save
// Metadata said "✓ Saved", because the Firestore write DID succeed; only the
// cover did not. So a failed cover looked exactly like a successful save, and two
// books went up with no cover before anyone noticed.
//
// This is the same defect that was fixed for the metadata form in v3.10.0
// ("feedback lives next to the button now"). The cover path never got it.
//
// Callers MUST surface .error. Do not go back to swallowing it.
//
// ⚠️ contentType IS PASSED EXPLICITLY (v3.18.3). See the long note by
// sniffImageType(). Without it, `uploadBytes` stores an EPUB-extracted cover as
// application/octet-stream, which storage.rules v2.0.0 denied outright and which
// v2.1.0 accepts but stores wrong. The blob handed in should already carry the
// type; this pins it in the upload metadata as well so a future refactor that
// loses the Blob's type cannot silently reintroduce the bug.
async function uploadCover(bookId, blob, contentType) {
    try {
        const type = contentType || (blob && blob.type) || '';
        if (!type || !type.startsWith('image/')) {
            // Refuse rather than upload something that will be stored as
            // octet-stream and then fail to render for reasons nobody connects
            // back to here.
            return { ok: false, error:
                'could not determine an image content type for this cover ' +
                '(got "' + (type || 'none') + '"). Nothing was uploaded.' };
        }
        const storageRef = ref(storage, `covers/${bookId}`);
        await uploadBytes(storageRef, blob, { contentType: type });
        return { ok: true, url: await getDownloadURL(storageRef), contentType: type };
    } catch(e) {
        console.error("Cover upload failed:", e);
        // Storage has its own security rules, entirely separate from
        // firestore.rules. An unauthorized error here is almost always those
        // rules — so say that rather than making someone guess.
        const code = (e && e.code) ? e.code : '';
        const hint = /unauthorized|permission/i.test(code + ' ' + (e.message || ''))
            ? ' — this is a Firebase STORAGE rules problem, not a Firestore one. ' +
              'Storage has its own rules; check Firebase console → Storage → Rules. ' +
              'If they still contain a contentType check, paste storage.rules v2.1.0.'
            : '';
        return { ok: false, error: (e && e.message ? e.message : String(e)) + hint };
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
    // A File from the picker carries its own type, which is exactly why the
    // manual path never hit the bug the EPUB path did. Recorded anyway so both
    // paths hand uploadCover() the same thing.
    stagedCoverType = file.type || '';
    stagedCoverUrl = URL.createObjectURL(file);
    updateCoverPreview();
    statusEl.innerText = `Cover image loaded from file (${stagedCoverType || 'unknown type'}).`;
});

document.getElementById('cover-remove-btn')?.addEventListener('click', () => {
    stagedCoverBlob = null;
    stagedCoverType = '';
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
                    await bumpContentVersion(activeBookId);
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
            // One bump for the whole batch, after the loop. Bumping per chapter
            // would be N extra writes for an identical result.
            if (fixed && auditIsFromDB) await bumpContentVersion(activeBookId);
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
                await bumpContentVersion(activeBookId);
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
                await bumpContentVersion(activeBookId);
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
            // Was hardcoded `true`. Same bug the audit had: a freshly parsed book has
            // no document behind it, so an edit saved from here would write chapters
            // under a book that doesn't exist yet.
            showLanguageWarnings(issues, stagedFromDB);
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

    // ── Free-text search ────────────────────────────────────────────────────
    // Reuses scanForLanguageIssues via overrideRegex, so a search hit gets exactly
    // the same context extraction and inline-edit affordances as a flagged word.
    function runLanguageSearch() {
        const input = document.getElementById('language-search-input');
        if (!input) return;
        const term = input.value.trim();
        if (!term) return;
        if (stagedChapters.length === 0) return alert("No book loaded. Open a book first.");

        let rx;
        try {
            if (term.length > 2 && term.startsWith('/') && term.endsWith('/')) {
                rx = new RegExp(term.slice(1, -1), 'gi');
            } else {
                // Whole-word by default, but only where the boundary makes sense —
                // \b before a non-word character never matches, which would silently
                // return nothing for a search like "?!".
                const esc = escapeForRegex(term);
                const lead  = /^\w/.test(term) ? '\\b' : '';
                const trail = /\w$/.test(term) ? '\\b' : '';
                rx = new RegExp(lead + esc + trail, 'gi');
            }
        } catch (e) { return alert('Bad search pattern: ' + e.message); }

        const hits = scanForLanguageIssues(stagedChapters, [], rx);
        const container = document.getElementById('language-results');
        if (!hits.length) {
            if (container) {
                container.classList.remove('hidden');
                container.innerHTML = '<div style="color:#00ff41;">No matches for <strong>' +
                    escapeHtmlSafe(term) + '</strong> in this book.</div>';
            }
            statusEl.innerText = 'No matches for "' + term + '".';
            statusEl.style.borderColor = '#00ff41';
            return;
        }
        showLanguageWarnings(hits, stagedFromDB);
        statusEl.innerText = hits.length + ' match(es) for "' + term + '".';
        statusEl.style.borderColor = '#ffaa00';
    }

    const searchBtn = document.getElementById('language-search-btn');
    const searchInput = document.getElementById('language-search-input');
    if (searchBtn)   searchBtn.onclick = runLanguageSearch;
    if (searchInput) searchInput.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); runLanguageSearch(); } };

    // ── Custom always-flag words ────────────────────────────────────────────
    async function addCustomWord() {
        const inp = document.getElementById('custom-word-input');
        if (!inp) return;
        const st = document.getElementById('custom-word-status');
        const raw = inp.value.trim();
        if (!raw) return;
        // Regex terms keep their case — /Boob/ and /boob/ are different patterns,
        // even though the compiled filter runs case-insensitively. Literals are
        // lowercased so the list can't hold "Boob" and "boob" separately.
        const w = isRegexTerm(raw) ? raw : raw.toLowerCase();

        const v = validateFilterTerm(w);
        if (!v.ok) {
            if (st) { st.textContent = v.msg; st.style.color = '#ff4444'; }
            return;
        }
        if (customFlaggedWords.includes(w) || FLAGGED_WORDS.includes(w)) {
            if (st) { st.textContent = '"' + w + '" is already flagged.'; st.style.color = '#ffaa00'; }
            inp.value = '';
            return;
        }
        customFlaggedWords.push(w);
        inp.value = '';
        renderCustomWords();
        await saveCustomWords();
    }
    // ── Find & replace across the staged book ───────────────────────────────
    //
    // Written after doing 169 of these by hand in Aesop's Fables (Ass→Donkey,
    // Cock→Rooster). Three things made that job non-trivial, and a plain
    // string replace gets all three wrong:
    //
    //   1. CAPITALISATION. "Ass"→"Donkey" and "ass"→"donkey" are one rule, not
    //      two, and getting it wrong mid-sentence is worse than not replacing.
    //   2. ARTICLES. "an Ass" must become "a Donkey". 21 of those 169.
    //   3. WORD BOUNDARIES. "ass" must not touch grass, passed, compassion or
    //      Grasshopper; "cock" must not touch Peacock or cocked.
    //
    // Operates on stagedChapters ONLY. Nothing reaches Firestore until upload,
    // so a bad replace costs a re-parse, not a book.

    // ALL CAPS → all caps, Capitalised → Capitalised, anything else → as typed.
    function matchCase(replacement, matched) {
        if (matched.length > 1 && matched === matched.toUpperCase() &&
            matched !== matched.toLowerCase()) return replacement.toUpperCase();
        if (matched[0] === matched[0].toUpperCase() && matched[0] !== matched[0].toLowerCase()) {
            return replacement[0].toUpperCase() + replacement.slice(1);
        }
        return replacement.toLowerCase();
    }

    // Letter-based approximation of the a/an rule. Deliberately NOT clever: the
    // real rule is about SOUND, so "an hour" and "a unicorn" are both wrong here.
    // Those are rare enough in one book to fix by eye, and a wrong guess is
    // visible in the preview before anything is committed.
    function fixArticles(text) {
        return text.replace(/\b([Aa])(n?)(\s+)([A-Za-z])/g, (m, a, n, sp, first) => {
            const wantsAn = 'aeiouAEIOU'.includes(first);
            if (wantsAn === (n === 'n')) return m;               // already right
            return a + (wantsAn ? 'n' : '') + sp + first;
        });
    }

    function buildFindRegex(find, wholeWord) {
        if (isRegexTerm(find)) {
            const v = validateFilterTerm(find);
            if (!v.ok) return { error: v.msg };
            return { rx: new RegExp('(?:' + regexTermSource(find) + ')', 'g') };
        }
        const body = escapeForRegex(find);
        // \b is meaningless against a non-word edge, so only apply it where the
        // term actually starts/ends with a word character. Without this, finding
        // "—" or "!" with Whole words ticked silently matches nothing.
        const lead  = /^\w/.test(find) ? '\\b' : '';
        const trail = /\w$/.test(find) ? '\\b' : '';
        return { rx: new RegExp(wholeWord ? lead + body + trail : body, 'gi') };
    }

    function runFindReplace(commit) {
        const out = document.getElementById('fr-out');
        if (!out) return;
        out.classList.remove('hidden');

        const find    = (document.getElementById('fr-find').value || '');
        const replace = (document.getElementById('fr-replace').value || '');
        const wholeWord    = document.getElementById('fr-wholeword').checked;
        const preserveCase = document.getElementById('fr-preservecase').checked;
        const doArticles   = document.getElementById('fr-fixarticles').checked;
        const doTitles     = document.getElementById('fr-titles').checked;

        if (!find) { out.innerHTML = '<span style="color:#ffaa00;">Nothing to find.</span>'; return; }
        if (!stagedChapters.length) {
            out.innerHTML = '<span style="color:#ffaa00;">No book staged. Parse or open one first.</span>';
            return;
        }

        const built = buildFindRegex(find, wholeWord);
        if (built.error) {
            out.innerHTML = '<span style="color:#ff4444;">' + escapeHtmlSafe(built.error) + '</span>';
            return;
        }

        const swap = (text) => {
            built.rx.lastIndex = 0;
            let n = 0;
            let result = text.replace(built.rx, (m) => {
                n++;
                return preserveCase ? matchCase(replace, m) : replace;
            });
            if (n && doArticles) result = fixArticles(result);
            return { result, n };
        };

        let total = 0, titlesHit = 0, chaptersHit = 0;
        const samples = [];

        for (const chap of stagedChapters) {
            let touched = false;

            if (doTitles) {
                const r = swap(chap.title || '');
                if (r.n) {
                    titlesHit += r.n; total += r.n; touched = true;
                    if (samples.length < 12)
                        samples.push({ where: 'title', before: chap.title, after: r.result });
                    if (commit) chap.title = r.result;
                }
            }
            for (const seg of chap.segments) {
                const r = swap(seg.text || '');
                if (r.n) {
                    total += r.n; touched = true;
                    if (samples.length < 12) {
                        const i = Math.max(0, (seg.text.search(built.rx) || 0) - 45);
                        samples.push({ where: 'Ch ' + chap.id,
                                       before: seg.text.substr(i, 130),
                                       after:  r.result.substr(i, 130) });
                    }
                    if (commit) seg.text = r.result;
                }
            }
            if (touched) chaptersHit++;
        }

        if (!total) {
            out.innerHTML = '<span style="color:#ffaa00;">No matches for <code>' +
                            escapeHtmlSafe(find) + '</code>.</span>';
            return;
        }

        let html = '<div style="color:' + (commit ? '#00ff41' : '#4B9CD3') + '; margin-bottom:8px;"><b>' +
            (commit ? '\u2713 Replaced ' : 'Would replace ') + total + '</b> occurrence' +
            (total === 1 ? '' : 's') + ' across ' + chaptersHit + ' chapter' +
            (chaptersHit === 1 ? '' : 's') + (titlesHit ? ' (' + titlesHit + ' in titles)' : '') + '.</div>';

        if (!commit) {
            html += '<div style="color:#888; margin-bottom:8px;">Nothing has changed yet. ' +
                    'Check the samples, then commit.</div>';
        }

        html += samples.map(s =>
            '<div style="margin-bottom:8px; border-left:2px solid #442233; padding-left:8px;">' +
            '<div style="color:#886688; font-size:0.9em;">' + escapeHtmlSafe(s.where) + '</div>' +
            '<div style="color:#997799;">\u2212 ' + escapeHtmlSafe(s.before) + '</div>' +
            '<div style="color:#bbddbb;">+ ' + escapeHtmlSafe(s.after) + '</div></div>').join('');

        if (samples.length >= 12) html += '<div style="color:#666;">\u2026 first 12 shown.</div>';

        if (commit) {
            renderChapterList();
            html += '<div style="color:#ffaa00; margin-top:10px;">Staged only \u2014 ' +
                    'upload to save.</div>';
        } else {
            html += '<div style="margin-top:10px;"><button id="fr-commit-btn" class="secondary-btn" ' +
                    'style="width:auto; padding:5px 14px; font-size:0.9em; background:#442200; ' +
                    'border-color:#885500;">Replace all ' + total + '</button></div>';
        }
        out.innerHTML = html;

        const commitBtn = document.getElementById('fr-commit-btn');
        if (commitBtn) commitBtn.onclick = () => runFindReplace(true);
    }

    const frBtn = document.getElementById('fr-preview-btn');
    if (frBtn) frBtn.onclick = () => runFindReplace(false);
    ['fr-find', 'fr-replace'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); runFindReplace(false); } };
    });

    // ── Filter audit: show every term, and test a sentence against them ──────
    //
    // "There's no way for me to audit that list" was the actual problem. A filter
    // you can't read is a filter you can't trust: you don't know what it catches,
    // you can't tell a missing word from a broken pattern, and you find out which
    // it was when a student reads it aloud.
    function renderFilterAudit(testText) {
        const out = document.getElementById('filter-audit-out');
        if (!out) return;
        out.classList.remove('hidden');

        const { rx, terms, skipped } = compileFilter();

        // Which terms actually fire on the test string. Each is tested on its
        // own so the report can name the term, not just the match.
        let hits = null;
        if (testText) {
            hits = [];
            for (const t of terms) {
                try {
                    const one = t.kind === 'regex'
                        ? new RegExp('(?:' + regexTermSource(t.term) + ')', 'gi')
                        : new RegExp('\\b' + escapeForRegex(t.term) + '\\b', 'gi');
                    const m = testText.match(one);
                    if (m) hits.push({ term: t.term, source: t.source, found: [...new Set(m)] });
                } catch (e) { /* already reported under skipped */ }
            }
        }

        const LABEL = {
            slur: 'Racial / ethnic slurs', profanity: 'Profanity',
            period: 'Period terms (archaic, offensive today)',
            review: 'Review — innocent in period English, expect false positives',
            anatomy: 'Anatomical / crude', custom: 'Your custom terms',
        };
        const COLOR = { slur:'#ff6b6b', profanity:'#ffa726', period:'#ba9ae0',
                        review:'#c0b060', anatomy:'#4fc3f7', custom:'#88ddaa' };

        let html = '';

        if (hits) {
            html += hits.length
                ? '<div style="color:#ffaa00; margin-bottom:10px;"><b>' + hits.length +
                  ' term' + (hits.length === 1 ? '' : 's') + ' matched:</b> ' +
                  hits.map(h => '<code style="color:#eebbee;">' + escapeHtmlSafe(h.term) +
                                '</code> \u2192 ' + escapeHtmlSafe(h.found.join(', '))).join(' &nbsp;\u00b7&nbsp; ') +
                  '</div>'
                : '<div style="color:#00ff41; margin-bottom:10px;"><b>Nothing matched.</b> ' +
                  'That sentence passes the filter as it stands.</div>';
        }

        if (skipped.length) {
            html += '<div style="color:#ff4444; margin-bottom:10px; border:1px solid #661111; padding:8px;">' +
                    '<b>\u26a0 ' + skipped.length + ' stored term' + (skipped.length===1?'':'s') +
                    ' could not be compiled and ' + (skipped.length===1?'is':'are') + ' being IGNORED:</b><br>' +
                    skipped.map(s => '<code>' + escapeHtmlSafe(s.term) + '</code> \u2014 ' +
                                     escapeHtmlSafe(s.reason)).join('<br>') + '</div>';
        }

        const byCat = {};
        for (const t of terms) (byCat[t.category || 'custom'] ||= []).push(t);

        html += '<div style="margin-bottom:8px; color:#aaa;"><b>' + terms.length +
                '</b> terms active \u00b7 ' +
                terms.filter(t => t.source === 'custom').length + ' custom \u00b7 ' +
                terms.filter(t => t.kind === 'regex').length + ' regex</div>';

        for (const cat of ['custom', 'slur', 'period', 'profanity', 'anatomy', 'review']) {
            const list = byCat[cat];
            if (!list || !list.length) continue;
            html += '<div style="margin-top:10px;"><div style="color:' + (COLOR[cat]||'#aaa') +
                    '; font-weight:bold; margin-bottom:4px;">' + (LABEL[cat]||cat) +
                    ' <span style="opacity:.6; font-weight:normal;">(' + list.length + ')</span></div>' +
                    '<div style="display:flex; flex-wrap:wrap; gap:4px;">' +
                    list.map(t => {
                        const on = hits && hits.some(hh => hh.term === t.term);
                        return '<span style="background:' + (on ? '#443300' : '#1c1c1c') +
                               '; border:1px solid ' + (on ? '#ffaa00' : '#333') +
                               '; border-radius:10px; padding:1px 7px; color:' +
                               (on ? '#ffcc55' : '#bbb') + ';">' +
                               (t.kind === 'regex' ? '<span style="color:#88ddaa;">.*</span> ' : '') +
                               escapeHtmlSafe(t.term) + '</span>';
                    }).join('') + '</div></div>';
        }

        html += '<div style="margin-top:12px; color:#666; font-size:0.95em; border-top:1px solid #330022; padding-top:8px;">' +
                'Built-in terms live in <code>FLAGGED_WORD_GROUPS</code> in admin.js and need a ' +
                'code change. Custom terms save to <code>settings/languageFilter</code> and apply ' +
                'to every book immediately. The <b>Review</b> group is expected to fire often \u2014 ' +
                'those words are innocent in period English and are flagged so they can be ' +
                'reworded, not because they are wrong.</div>';

        out.innerHTML = html;
    }

    const auditBtn = document.getElementById('filter-audit-btn');
    if (auditBtn) auditBtn.onclick = () => renderFilterAudit(null);
    const testBtn = document.getElementById('filter-test-btn');
    const testInp = document.getElementById('filter-test-input');
    const runTest = () => renderFilterAudit((testInp && testInp.value) || '');
    if (testBtn) testBtn.onclick = runTest;
    if (testInp) testInp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); runTest(); } };

    const addWordBtn = document.getElementById('custom-word-add-btn');
    const wordInput  = document.getElementById('custom-word-input');
    if (addWordBtn) addWordBtn.onclick = addCustomWord;
    if (wordInput)  wordInput.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addCustomWord(); } };

    // NOT called here: loadCustomWords() reads settings/languageFilter, and the rules
    // gate settings/{docId} behind signedIn(). At module-eval time auth hasn't
    // resolved, so the read would fail and leave the list silently empty. It's called
    // from onAuthStateChanged instead.
}


// ─── Book list export + balance report (v3.8.0) ───────────────────────────────
//
// Jake's use: hand the CSV to an LLM and ask whether the library is lopsided on
// protagonist gender, genre, or reading age. That means the CSV is the product —
// the on-page report is just so the obvious gaps don't need a round trip.

// RFC4180: quote if the value contains a comma, quote, or newline; double any
// internal quotes. Book titles contain commas constantly ("Alice's Adventures in
// Wonderland, and Through the Looking-Glass") and a naive join would corrupt
// every row after the first one that has one.
function csvCell(v) {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csvRow(cells) { return cells.map(csvCell).join(','); }

function downloadCsv(filename, text) {
    // BOM so Excel opens UTF-8 correctly — without it, curly quotes and accents
    // in author names come through as mojibake on Windows.
    const blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = filename;
    document.body.appendChild(el); el.click(); document.body.removeChild(el);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function fetchAllBooksForExport() {
    const snap = await getDocs(collection(db, "books"));
    const rows = [];
    snap.forEach(d => {
        const b = d.data();
        rows.push({
            id: d.id,
            title: b.title || d.id,
            author: b.author || '',
            genre: b.genre || '',
            minAge: (typeof b.minAge === 'number') ? b.minAge : null,
            maxAge: (typeof b.maxAge === 'number') ? b.maxAge : null,
            protagonistGender: b.protagonistGender || '',
            chapters: (b.chapters ? b.chapters.length : 0) || b.totalChapters || 0,
            hasCover: b.coverUrl ? 'yes' : 'no',
        });
    });
    rows.sort((x, y) => x.title.localeCompare(y.title));
    return rows;
}

// ─── DELETE A BOOK (v3.23.0) ─────────────────────────────────────────────────
//
// There was no way to remove a book from this panel at all — the only route was
// the Firebase console. Which is fine until you have two copies of the same test
// fixture and no reason for either.
//
// ⚠️ THIS IS THE ONLY CONTROL HERE THAT DESTROYS A STUDENT'S WORK. Deleting a book
// does NOT delete users/{uid}/progress/{bookId}, deliberately: those documents live
// under each student and this admin cannot enumerate them cheaply or safely. They
// become orphans pointing at nothing, which is harmless — index.html only renders
// progress for books it can see — and recoverable if the book is ever re-uploaded
// under the same id. Deleting a book a class is mid-way through is not undoable and
// the confirmation says so in those words.
//
// Typed confirmation, not an OK button. A confirm() dialog is one careless Return
// away from gone, and this loops over every chapter document in the book.
const deleteBookBtn = document.getElementById('delete-book-btn');
if (deleteBookBtn) deleteBookBtn.onclick = async () => {
    const id = bookSelect.value;
    if (!id || id === '__NEW__') {
        return alert('Pick a book from the dropdown first.');
    }
    const title = bookTitlesMap[id] || id;

    // How much is actually at stake — read it BEFORE asking, so the number in the
    // prompt is a fact rather than an estimate.
    let chapCount = '?';
    try {
        const snap = await getDocs(collection(db, "books", id, "chapters"));
        chapCount = snap.size;
    } catch (e) { console.warn('Could not count chapters before delete:', e); }

    const typed = prompt(
        `DELETE "${title}"\n\n` +
        `This removes the book and all ${chapCount} of its chapter documents.\n` +
        `Any student part-way through it will lose their place in this book.\n` +
        `Their typing history and totals are NOT affected.\n\n` +
        `This cannot be undone.\n\n` +
        `Type the book id to confirm:  ${id}`);
    if (typed === null) return;
    if (typed.trim() !== id) {
        return alert('That did not match the book id. Nothing was deleted.');
    }

    statusEl.innerText = `Deleting "${title}"\u2026`;
    statusEl.style.borderColor = '#ffaa00';
    try {
        // Chapters FIRST, then the book document. If this dies half way the book
        // doc still exists and still lists chapters, so the state is visibly broken
        // and fixable by re-uploading. Deleting the book doc first would leave an
        // invisible pile of orphaned chapter documents nobody can find.
        const snap = await getDocs(collection(db, "books", id, "chapters"));
        let done = 0;
        for (const d of snap.docs) {
            await deleteDoc(doc(db, "books", id, "chapters", d.id));
            done++;
            if (done % 10 === 0) statusEl.innerText = `Deleting\u2026 ${done}/${snap.size} chapters`;
        }
        await deleteDoc(doc(db, "books", id));

        // The cover is in Storage, not Firestore, and is not reachable from here
        // without a Storage delete permission this panel may not have. Say so
        // rather than pretending the book is entirely gone.
        statusEl.innerText = `Deleted "${title}" \u2014 ${done} chapter document(s) and the book record. ` +
            `\u26a0 The cover image is still in Storage at covers/${id}; remove it from the ` +
            `Firebase console if you want it gone.`;
        statusEl.style.borderColor = '#00ff41';

        activeBookId = null;
        stagedChapters = [];
        stagingArea.classList.add('hidden');
        clearSaveTitleStatus();
        await loadBookList();
    } catch (e) {
        console.error('Delete failed:', e);
        statusEl.innerText = `Delete FAILED: ${e.message}. The book may be partly deleted \u2014 ` +
            `check the chapter list before re-uploading.`;
        statusEl.style.borderColor = '#ff3333';
    }
};

const exportBooksBtn = document.getElementById('export-books-csv-btn');
if (exportBooksBtn) exportBooksBtn.onclick = async () => {
    const st = document.getElementById('export-books-status');
    const set = (m, c) => { if (st) { st.textContent = m; st.style.color = c || '#888'; } };
    set('Reading books\u2026');
    try {
        const rows = await fetchAllBooksForExport();
        const header = ['id','title','author','genre','min_age','max_age',
                        'protagonist_gender','chapters','has_cover'];
        const csv = [csvRow(header)].concat(rows.map(r => csvRow([
            r.id, r.title, r.author, r.genre,
            r.minAge === null ? '' : r.minAge,
            r.maxAge === null ? '' : r.maxAge,
            r.protagonistGender, r.chapters, r.hasCover
        ]))).join('\r\n');
        const stamp = new Date().toISOString().slice(0, 10);
        downloadCsv('typethatbook-books-' + stamp + '.csv', csv);
        set('\u2713 Exported ' + rows.length + ' books.', '#00ff41');
    } catch (e) {
        set('Export failed: ' + e.message, '#ff4444');
    }
};

const balanceBtn = document.getElementById('library-balance-btn');
if (balanceBtn) balanceBtn.onclick = async () => {
    const out = document.getElementById('library-balance-out');
    const st  = document.getElementById('export-books-status');
    if (!out) return;
    out.classList.remove('hidden');
    out.innerHTML = 'Reading books\u2026';
    try {
        const rows = await fetchAllBooksForExport();
        const n = rows.length;
        if (!n) { out.innerHTML = 'No books yet.'; return; }

        const tally = (key, fallback) => {
            const m = {};
            rows.forEach(r => { const k = r[key] || fallback; m[k] = (m[k] || 0) + 1; });
            return Object.entries(m).sort((x, y) => y[1] - x[1]);
        };
        const bar = (count) => {
            const pct = Math.round((count / n) * 100);
            return '<span style="display:inline-block; width:120px; background:#222; ' +
                   'vertical-align:middle; margin:0 6px;"><span style="display:inline-block; ' +
                   'height:9px; width:' + pct + '%; background:#4B9CD3;"></span></span>' +
                   count + ' <span style="color:#666;">(' + pct + '%)</span>';
        };
        const section = (title, entries) =>
            '<div style="margin-bottom:14px;"><div style="color:#4B9CD3; font-weight:bold; ' +
            'margin-bottom:4px;">' + title + '</div>' +
            entries.map(([k, c]) =>
                '<div><span style="display:inline-block; min-width:150px; color:#ccc;">' +
                escapeHtmlSafe(k) + '</span>' + bar(c) + '</div>').join('') + '</div>';

        // Age coverage per year, so a hole in the middle of the range is visible.
        // A library can look balanced by count and still have nothing at all for
        // the 13-year-olds.
        const ageCounts = [];
        for (let age = 5; age <= 16; age++) {
            ageCounts.push([String(age), rows.filter(r =>
                r.minAge !== null && r.maxAge !== null && r.minAge <= age && r.maxAge >= age).length]);
        }
        const untagged = rows.filter(r => r.minAge === null).length;
        const noProt   = rows.filter(r => !r.protagonistGender).length;

        out.innerHTML =
            '<div style="color:#888; margin-bottom:10px;"><b>' + n + '</b> books total</div>' +
            (untagged ? '<div style="color:#ffaa00; margin-bottom:10px;">\u26a0 ' + untagged +
                        ' with no age range \u2014 invisible to any age filter.</div>' : '') +
            (noProt ? '<div style="color:#ffaa00; margin-bottom:10px;">\u26a0 ' + noProt +
                      ' with no protagonist tag.</div>' : '') +
            section('Protagonist', tally('protagonistGender', '(untagged)')) +
            section('Genre', tally('genre', '(none)')) +
            '<div style="margin-bottom:6px;"><div style="color:#4B9CD3; font-weight:bold; ' +
            'margin-bottom:4px;">Books available at each age</div>' +
            ageCounts.map(([age, c]) =>
                '<div><span style="display:inline-block; min-width:150px; color:' +
                (c === 0 ? '#ff6b6b' : '#ccc') + ';">age ' + age +
                (c === 0 ? '  \u2190 nothing here' : '') + '</span>' + bar(c) + '</div>').join('') +
            '</div>';
        if (st) { st.textContent = ''; }
    } catch (e) {
        out.innerHTML = '<span style="color:#ff4444;">Failed: ' + escapeHtmlSafe(e.message) + '</span>';
    }
};

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
            // compareChapterIds fixes 1.1 / 1.10 / 1.2 on books already numbered
            // by hand, WITHOUT renumbering them — so no student's stored chapter
            // pointer moves. Run this button on any multi-part book.
            deduped.sort((a, b) => compareChapterIds(a.id, b.id));

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
                await setDoc(doc(db, "books", activeBookId),
                             { chapters: deduped, contentVersion: Date.now() }, { merge: true });
                resultsEl.innerHTML = '<span style="color:#00ff41;">✓ Done — ' + deduped.length + ' chapters in correct order. Reload the book to confirm.</span>';
                statusEl.innerText = 'Chapter order repaired.';
                statusEl.style.borderColor = '#00ff41';
            };

        } catch (e) {
            resultsEl.innerHTML = '<span style="color:#ff4444;">Error: ' + e.message + '</span>';
        }
    };
}


// ═════════════════════════════════════════════════════════════════════════════
// REPAIR: remove chapter titles from the text students type  (v3.15.0)
// ═════════════════════════════════════════════════════════════════════════════
//
// For books already in Firestore. v3.13.0 stops the title getting into the prose
// on IMPORT, but every book uploaded before it has the chapter name sitting in
// segment zero — Standard Ebooks marks it <p epub:type="title">, so the old
// querySelectorAll('p') swept it in.
//
// Re-importing would fix it and cost the chapter titles Jake typed by hand, plus
// renumber everything and orphan any student's stored chapter pointer. This does
// the one thing needed and nothing else: drop a first segment that merely repeats
// the chapter's own title. Titles untouched, ids untouched, no re-import.
//
// ⚠️ PREVIEW THEN CONFIRM, ALWAYS. It edits book content in place. A false
// positive would silently delete a real opening line, so the match is deliberately
// strict — see titlesMatch() — and nothing is written until Jake has seen the list.

// Compare on letters and digits only. "Old Tom and Nancy" must match
// "\tOld Tom and Nancy" and "OLD TOM AND NANCY," but must NOT match a sentence
// that merely begins with the title.
function normalizeForTitleMatch(t) {
    return String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
function titlesMatch(segText, chapTitle) {
    const a = normalizeForTitleMatch(segText), b = normalizeForTitleMatch(chapTitle);
    if (!a || !b) return false;
    if (a === b) return true;
    // A title plus its subtitle joined by a colon, stored as one segment.
    if (b.length > 6 && a === b.replace(/:/g, '')) return true;
    return false;
}

function injectTitleRepairUI() {
    const host = document.getElementById('repair-results');
    if (!host || document.getElementById('repair-titles-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'repair-titles-btn';
    btn.textContent = '\u2702 Remove chapter titles from typed text';
    btn.title = 'For books imported before admin.js v3.13.0, whose first segment ' +
                'repeats the chapter title.';
    btn.style.cssText = 'background:#3a2200;border:1px solid #886600;color:#ffcc66;' +
        'padding:8px 16px;cursor:pointer;border-radius:4px;width:auto;margin-left:8px;';
    const anchor = document.getElementById('repair-chapter-order-btn');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(btn, anchor.nextSibling);
    else host.parentNode.insertBefore(btn, host);
    btn.onclick = runTitleRepair;
}

async function runTitleRepair() {
    if (!activeBookId) return alert('Open a book first.');
    const out = document.getElementById('repair-results');
    out.classList.remove('hidden');
    out.innerHTML = 'Reading chapters from Firestore\u2026';

    try {
        const metaSnap = await getDoc(doc(db, 'books', activeBookId));
        if (!metaSnap.exists()) { out.innerHTML = 'Book metadata not found.'; return; }
        const metaChapters = metaSnap.data().chapters || [];
        if (!metaChapters.length) { out.innerHTML = 'This book has no chapters listed.'; return; }

        const hits = [];
        for (const ch of metaChapters) {
            const snap = await getDoc(doc(db, 'books', activeBookId, 'chapters', ch.id));
            if (!snap.exists()) continue;
            const segs = snap.data().segments || [];
            if (!segs.length) continue;
            if (titlesMatch(segs[0].text, ch.title)) {
                hits.push({ id: ch.id, title: ch.title,
                            removing: String(segs[0].text || '').trim(),
                            nextLine: String((segs[1] && segs[1].text) || '').trim().slice(0, 70),
                            segments: segs });
            }
        }

        if (!hits.length) {
            out.innerHTML = '<span style="color:#00ff41;">\u2713 Nothing to remove \u2014 no ' +
                'chapter in this book starts with its own title. Either it was imported ' +
                'with v3.13.0 or later, or it never had the problem.</span>';
            return;
        }

        out.innerHTML =
            '<div style="color:#ffcc66;font-weight:bold;margin-bottom:8px;">' + hits.length +
            ' of ' + metaChapters.length + ' chapters begin with their own title.</div>' +
            '<div style="color:#888;margin-bottom:10px;">The first line goes; the second ' +
            'line becomes the new opening. Chapter titles and ids are not touched.</div>' +
            hits.slice(0, 40).map(h =>
                '<div style="border-left:2px solid #886600;padding-left:8px;margin-bottom:8px;">' +
                '<div style="color:#4B9CD3;">' + escapeHtml(h.id) + ' \u2014 ' +
                escapeHtml(h.title) + '</div>' +
                '<div style="color:#cc7777;">\u2212 ' + escapeHtml(h.removing) + '</div>' +
                '<div style="color:#bbddbb;">new first line: ' + escapeHtml(h.nextLine) +
                '\u2026</div></div>').join('') +
            (hits.length > 40 ? '<div style="color:#666;">\u2026 first 40 shown.</div>' : '') +
            '<div style="margin-top:10px;"><button id="repair-titles-go" ' +
            'style="background:#664400;border:1px solid #996600;color:#ffcc66;padding:8px 18px;' +
            'cursor:pointer;border-radius:4px;width:auto;">Remove all ' + hits.length +
            '</button> <button id="repair-titles-cancel" class="secondary-btn" ' +
            'style="width:auto;padding:8px 18px;">Cancel</button></div>';

        document.getElementById('repair-titles-cancel').onclick = () => {
            out.innerHTML = 'Cancelled. Nothing was changed.';
        };
        document.getElementById('repair-titles-go').onclick = async () => {
            out.innerHTML = 'Writing\u2026';
            let done = 0;
            for (const h of hits) {
                try {
                    await setDoc(doc(db, 'books', activeBookId, 'chapters', h.id),
                                 { segments: h.segments.slice(1) }, { merge: true });
                    done++;
                } catch (e) { console.error('Repair failed on ' + h.id, e); }
            }
            // Students hold cached chapter text; without this they keep the old
            // copy until expiry. See bumpContentVersion().
            if (done) await bumpContentVersion(activeBookId);
            out.innerHTML = '<span style="color:#00ff41;">\u2713 Removed the title line from ' +
                done + ' of ' + hits.length + ' chapters. Students see the change on next load.' +
                '</span>' + (done < hits.length
                    ? '<div style="color:#ff6666;">' + (hits.length - done) +
                      ' failed \u2014 see the console.</div>' : '');
            statusEl.innerText = 'Removed ' + done + ' chapter-title lines from typed text.';
            statusEl.style.borderColor = '#00ff41';
        };
    } catch (e) {
        out.innerHTML = '<span style="color:#ff4444;">Error: ' + escapeHtml(e.message) + '</span>';
    }
}
injectTitleRepairUI();

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
