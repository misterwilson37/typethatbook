// admin.js v3.10.0
// v3.10.0 — ONE PASS PER BOOK. Two divergent copies of "write the book document"
//          had drifted apart, so every book had to be visited twice and you had
//          to know which button wrote which field.
//
//          ROOT CAUSE of "Save Metadata loses the chapters": saveTitleBtn called
//          loadBookList() to refresh the picker (added v3.6.0, well meant), and
//          loadBookList ended with `selectedIndex = 1` + a synthetic change
//          event. bookSelect.onchange hides the staging area AND reassigns
//          activeBookId — to the FIRST book alphabetically, not the one being
//          edited. So it didn't merely hide the chapters, it silently repointed
//          the editor at a different book. loadBookList() now preserves the
//          selection and takes an explicit flag before it fires onchange.
//
//          Upload All was missing minAge/maxAge/protagonistGender entirely (my
//          miss in 3.7.0 — I added them to Save Metadata only), read genre via
//          .value instead of readGenreField() so "Custom..." stored the literal
//          "__custom__", and still had the `if (author)` guards that v3.6.0
//          removed from the other path. That genre read is the FOURTH instance
//          of the read-the-field-properly bug HANDOFF §11 warned to look for.
//
//          Both paths now share readBookMetadataForm(). One reader, one writer,
//          no drift. Upload All writes chapters AND metadata, so a new book is
//          finished in one pass.
//
//          Also: find & replace across a staged book, with case preservation and
//          automatic a/an correction. Built after doing 169 of them by hand in
//          Aesop's Fables.
// v3.9.0
// v3.9.0 — EPUB import: split multi-work spine files.
//          The importer assumed one spine file == one chapter. Standard Ebooks
//          (where most of this library comes from) puts every short work of a
//          COLLECTION in a single XHTML file as sibling <article>/<section>
//          elements — Aesop's Fables is 284 fables in one file. That imported as
//          one 238KB "chapter" with 284 titles run together, and the alternative
//          was splitting and naming 284 chapters by hand.
//          findChapterUnits() now detects that shape and splits on it. Novels are
//          unaffected: one heading per file means no split, and the old path runs.
//          Also fixes a latent bug — title extraction used hTag.innerText, which
//          is undefined on a DOMParser document in Firefox because innerText
//          needs layout. Every imported title would have been blank there.
//          Also: the seven period words previously held back are now flagged, at
//          Jake's request. See the note above FLAGGED_WORD_GROUPS.review.
// v3.8.0
// v3.8.0 — Language filter: regex + audit. The persistent "always flag these"
//          list now accepts /…/ patterns like the free-text search already did,
//          patterns are validated on entry AND defensively at scan time (one bad
//          stored pattern used to be able to break every scan), and there is
//          finally a way to SEE the effective list — built-in plus custom, with
//          a live tester. FLAGGED_WORDS regrouped by category and substantially
//          expanded for period literature; see the note above it.
//          Also: book list CSV export + an on-page balance report, for checking
//          the library's spread of genre / age / protagonist.
// v3.7.0
// v3.7.0 — Book tags: target age range (minAge/maxAge) and protagonistGender on
//          books/{id}. Written unconditionally by Save Metadata, same as author
//          and genre — see the v3.6.0 note on `if (author)` silently keeping the
//          old value when a field is blanked. Age is validated as a RANGE, not
//          two independent numbers: half a range is a data bug, and min > max is
//          silently unmatchable by the library's overlap test.
//          The book picker now marks untagged books with a bullet so the tagging
//          backlog is visible while working through it.
// v3.6.0
import { db, auth, storage } from "./firebase-config.js";
import { initLessonsPanel, setStaffHooks } from "./lessons-admin.js";
import { initStaffPanel, initStaffPanelContent, syncOwnClaimsAfterClassChange }
    from "./staff-admin.js";
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const ADMIN_VERSION = "3.10.0";

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
            // v3.7.0: flag the tagging backlog where the books actually are.
            // Age is the one that changes what students can find, so it's the
            // one that earns a marker.
            const untagged = (b.minAge === null || b.minAge === undefined);
            option.text = (untagged ? '\u25cb ' : '\u25cf ') +
                          bookTitlesMap[doc.id] + ` (${doc.id})`;
            if (untagged) option.style.color = '#ffb74d';
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

            // Book tags (v3.7.0). Number inputs want '' not '0' for absent —
            // a book tagged for age 0 is not a thing, but `meta.minAge || ''`
            // would also blank a legitimate 0, so test for null/undefined.
            const minAgeIn = document.getElementById('active-book-minage');
            const maxAgeIn = document.getElementById('active-book-maxage');
            const protSel  = document.getElementById('active-book-protagonist');
            if (minAgeIn) minAgeIn.value = (meta.minAge ?? '') === '' ? '' : String(meta.minAge);
            if (maxAgeIn) maxAgeIn.value = (meta.maxAge ?? '') === '' ? '' : String(meta.maxAge);
            if (protSel)  protSel.value  = meta.protagonistGender || "";
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
        let splitFiles = 0, splitUnits = 0;

        for (let item of spineItems) {
            const href = idToHref[item.getAttribute("idref")];
            if (!href) continue;

            const fullPath = (basePath === "") ? href : basePath + href;
            const content = await zip.file(fullPath).async("string");
            const doc = parser.parseFromString(content, "application/xhtml+xml");

            // One spine file is USUALLY one chapter, but not always — see
            // findChapterUnits(). When it isn't, each unit becomes its own chapter.
            const units = findChapterUnits(doc);
            if (units) { splitFiles++; splitUnits += units.length; }
            const roots = units || [doc.body];

          for (const root of roots) {
            let title = `Chapter ${counter}`;
            const hTag = root.querySelector('h1, h2, h3, h4, h5, h6');
            // textContent, NOT innerText. innerText is layout-dependent and comes
            // back undefined on a DOMParser document in Firefox, which would have
            // made `.trim()` throw and killed the whole import.
            if (hTag) {
                const t = (hTag.textContent || '').replace(/\s+/g, ' ').trim();
                if (t) title = t.substring(0, 60);
            }

            const segments = [];
            const pTags = Array.from(root.querySelectorAll("p"));
            
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
        }
        
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
            const splitNote = splitFiles
                ? ` (split ${splitFiles} file${splitFiles === 1 ? '' : 's'} into ${splitUnits} sections)`
                : '';
            if (langIssues.length > 0) {
                showLanguageWarnings(langIssues, false);
                statusEl.innerText = `Parsed ${stagedChapters.length} chapters${splitNote}. ⚠️ ${langIssues.length} language warning(s).`;
                statusEl.style.borderColor = "#ffaa00";
            } else {
                statusEl.innerText = `✅ Parsed ${stagedChapters.length} chapters${splitNote}. No character issues or language warnings found.`;
                statusEl.style.borderColor = "#00ff41";
            }
        }

    } catch (e) {
        console.error(e);
        statusEl.innerText = "Parse Error: " + e.message;
        statusEl.style.borderColor = "#ff3333";
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
// Returns an array of unit elements to treat as chapters, or null to keep the
// old whole-file behaviour.
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

    return leaves.length >= 2 ? leaves : null;
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

        if (stagedCoverBlob) {
            setInline('Uploading cover\u2026', '#888');
            const coverUrl = await uploadCover(activeBookId, stagedCoverBlob);
            if (coverUrl) updates.coverUrl = coverUrl;
        }

        await setDoc(doc(db, "books", activeBookId), updates, { merge: true });
        bookTitlesMap[activeBookId] = newTitle;

        const stamp = new Date().toLocaleTimeString();
        const tagBits = [];
        tagBits.push(genre ? 'genre: ' + genre : 'genre cleared');
        tagBits.push(age.minAge === null ? 'no age range'
                                         : 'ages ' + age.minAge + '\u2013' + age.maxAge);
        if (protagonistGender) tagBits.push('lead: ' + protagonistGender);
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
            chapters: chapterMeta
        });
        
        // Upload cover if staged
        if (stagedCoverBlob) {
            statusEl.innerText = "Uploading cover image...";
            const coverUrl = await uploadCover(activeBookId, stagedCoverBlob);
            if (coverUrl) bookData.coverUrl = coverUrl;
        }
        
        await setDoc(doc(db, "books", activeBookId), bookData, { merge: true });
        
        const tagged = (bookData.minAge !== null) ? `ages ${bookData.minAge}\u2013${bookData.maxAge}` : 'NO age range';
        statusEl.innerText = `Upload complete \u2014 ${stagedChapters.length} chapters, ` +
            `${bookData.genre || 'no genre'}, ${tagged}, ` +
            `${bookData.protagonistGender || 'no protagonist tag'}. This book is done.`;
        statusEl.style.borderColor = (bookData.minAge !== null && bookData.protagonistGender) ? "#00ff41" : "#ffaa00";
        await loadBookList(false);
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
